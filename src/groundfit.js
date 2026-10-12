// Fit every static thing on the island to the terrain it stands on. Builders place an object at the
// ground height under its centre, so on a slope one side hangs in the air. After the island is built
// (and has run for a moment, so anything that moves can be told apart) this walks every static
// piece that touches the ground and:
//   - upright pieces (posts, legs, plinths, walls, building bases): their flat bottom is extended
//     straight down to the terrain under each corner, so nothing hovers on the downhill side;
//   - thin flat pieces (rings, footings, decals, light pools): laid along the slope.
// Pieces are only ever stretched downward into the ground, never lifted, so nothing gets buried.
import * as THREE from 'three';

// top-level groups that are not standing on the terrain, or that move
// (anything that moves is told apart at run time)
const SKIP = /^(sky|clouds|terrain|ocean|mountains|trees|pond|pollen|smoke)$/;

export function snapshotMatrices(root) {
  const snap = new Map();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (o.isMesh) snap.set(o, o.matrixWorld.elements.slice());
  });
  return snap;
}

export function groundFit(root, snap, groundAt) {
  root.updateMatrixWorld(true);
  const uses = new Map();
  root.traverse((o) => {
    if (o.isMesh && o.geometry) uses.set(o.geometry, (uses.get(o.geometry) || 0) + 1);
  });
  const meshes = [];
  for (const top of root.children) {
    if (SKIP.test(top.name || '')) continue;
    top.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.geometry?.attributes?.position) return;
      if (o.userData.dynamic || o.userData.noFit) return;
      for (let p = o; p; p = p.parent) if (!p.visible) return;
      const before = snap.get(o);
      if (!before) return;
      const now = o.matrixWorld.elements;
      if (before.some((v, i) => Math.abs(v - now[i]) > 1e-5)) return; // it moves
      meshes.push(o);
    });
  }
  const v = new THREE.Vector3();
  const inv = new THREE.Matrix4();
  const box = new THREE.Box3();
  let fitted = 0;
  for (const o of meshes) {
    box.setFromObject(o, false);
    if (box.isEmpty()) continue;
    // quick reject: everything well above the ground under it
    let gHi = -Infinity;
    for (const [x, z] of [[box.min.x, box.min.z], [box.max.x, box.min.z], [box.min.x, box.max.z], [box.max.x, box.max.z], [(box.min.x + box.max.x) / 2, (box.min.z + box.max.z) / 2]]) gHi = Math.max(gHi, groundAt(x, z));
    const pieces = o.userData.pieces || [o.geometry.attributes.position.count];
    if (pieces.length === 1 && box.min.y > gHi + 0.4) continue;
    let geo = o.geometry;
    const pos = geo.attributes.position;
    const m = o.matrixWorld;
    inv.copy(m).invert();
    const n = pos.count;
    const wx = new Float32Array(n);
    const wy = new Float32Array(n);
    const wz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      wx[i] = v.x;
      wy[i] = v.y;
      wz[i] = v.z;
    }
    const idx = geo.index;
    const changes = [];
    // indexed geometry is one piece; merged (non-indexed) meshes carry their piece sizes
    let start = 0;
    for (const count of idx ? [n] : pieces) {
      const end = Math.min(n, start + count);
      let minY = Infinity, maxY = -Infinity, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let i = start; i < end; i++) {
        if (wy[i] < minY) minY = wy[i];
        if (wy[i] > maxY) maxY = wy[i];
        if (wx[i] < x0) x0 = wx[i];
        if (wx[i] > x1) x1 = wx[i];
        if (wz[i] < z0) z0 = wz[i];
        if (wz[i] > z1) z1 = wz[i];
      }
      const ext = Math.max(x1 - x0, z1 - z0);
      if (end > start && ext < 25 && ext > 0.04) {
        const cx = (x0 + x1) / 2;
        const cz = (z0 + z1) / 2;
        let hi = -Infinity;
        for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [cx, cz]]) hi = Math.max(hi, groundAt(x, z));
        const h = maxY - minY;
        if (h >= 0.18 && minY <= hi + 0.3) {
          // upright: pull the flat bottom down to the terrain
          const band = minY + Math.min(0.04, h * 0.1);
          // only a real flat base (not a wheel, a ball or a point) that spans the piece's footprint
          let k = 0, bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
          for (let i = start; i < end; i++) {
            if (wy[i] > band) continue;
            k++;
            if (wx[i] < bx0) bx0 = wx[i];
            if (wx[i] > bx1) bx1 = wx[i];
            if (wz[i] < bz0) bz0 = wz[i];
            if (wz[i] > bz1) bz1 = wz[i];
          }
          if (k >= 2 && bx1 - bx0 >= (x1 - x0) * 0.5 && bz1 - bz0 >= (z1 - z0) * 0.5) {
            for (let i = start; i < end; i++) {
              if (wy[i] > band) continue;
              const g = groundAt(wx[i], wz[i]) - 0.08;
              if (wy[i] > g) changes.push(i, g);
            }
          }
        } else if (h < 0.18 && ext > 0.3) {
          // anchor it where it sits closest to the ground (its centre, or wherever it touches)
          let gc = groundAt(cx, cz);
          let best = Math.abs(minY - gc);
          for (let i = start; i < end; i += Math.max(1, Math.floor((end - start) / 200))) {
            const g = groundAt(wx[i], wz[i]);
            const d = Math.abs(wy[i] - g);
            if (d < best) {
              best = d;
              gc = g + (minY - wy[i]);
            }
          }
          if (best < 0.3) {
            // flat: lay it along the ground, keeping its height above it
            for (let i = start; i < end; i++) {
              const d = groundAt(wx[i], wz[i]) - gc;
              if (Math.abs(d) > 0.02) changes.push(i, wy[i] + d);
            }
          }
        }
      }
      start = end;
    }
    if (!changes.length) continue;
    if (uses.get(geo) > 1) {
      geo = geo.clone();
      o.geometry = geo;
    }
    const p = geo.attributes.position;
    for (let c = 0; c < changes.length; c += 2) {
      const i = changes[c];
      v.set(wx[i], changes[c + 1], wz[i]).applyMatrix4(inv);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    p.needsUpdate = true;
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    fitted++;
  }
  return fitted;
}
