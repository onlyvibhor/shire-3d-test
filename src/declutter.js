// Keep every sign and screen readable: after the island is built, look at the corridor of sight
// in front of each one (from where a visitor stands, up to 22 m away and 25° either side) and leave
// out any tree or monolith that would stand in it. Cheap 2D-plus-height geometry, no raycasting.
import * as THREE from 'three';
import { groundAt } from './world.js';

const v = new THREE.Vector3();
const q = new THREE.Quaternion();
const s = new THREE.Vector3();

// vertical textured planes big enough to be signs, screens or posters
function displaySurfaces(root) {
  const out = [];
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || o.geometry?.type !== 'PlaneGeometry' || o.userData.decor) return;
    const m = o.material;
    if (!m || !m.map) return;
    for (let p = o; p; p = p.parent) if (!p.visible) return;
    o.matrixWorld.decompose(v, q, s);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const w = o.geometry.parameters.width * s.x;
    const h = o.geometry.parameters.height * s.y;
    if (Math.abs(n.y) > 0.6 || w * h < 0.9) return;
    const hn = new THREE.Vector3(n.x, 0, n.z).normalize();
    out.push({ c: v.clone(), hn, right: new THREE.Vector3(hn.z, 0, -hn.x), w, bottom: v.y - h / 2, top: v.y + h / 2 });
  });
  return out;
}

const REACH = 22;
const SPREAD = Math.tan(0.44);
// does an upright obstacle (circle r at x,z, from bottom to top) stand in this surface's sightlines?
function blocks(sf, it) {
  const dx = it.x - sf.c.x;
  const dz = it.z - sf.c.z;
  const ahead = dx * sf.hn.x + dz * sf.hn.z; // distance in front of the face
  if (ahead < -it.r || ahead > REACH) return false;
  const side = Math.abs(dx * sf.right.x + dz * sf.right.z);
  if (side - it.r > sf.w / 2 + Math.max(0, ahead) * SPREAD) return false;
  // the lowest sightline at this distance runs from the face's bottom edge to an eye 1.7 m up,
  // 22 m away; anything taller than that line here gets in the way
  const eye = groundAt(sf.c.x + sf.hn.x * REACH, sf.c.z + sf.hn.z * REACH) + 1.7;
  const t = Math.max(0, ahead) / REACH;
  const line = sf.bottom + (eye - sf.bottom) * t;
  const lineTop = sf.top + (eye - sf.top) * t;
  return it.top > Math.min(line, lineTop) && (it.bottom ?? -1e9) < Math.max(line, lineTop);
}

export function declutter(root, { trees, monoliths }, { merge = true } = {}) {
  const surfaces = displaySurfaces(root);
  let treesOut = 0;
  let monosOut = 0;
  for (const it of trees.items) {
    if (it.out) continue;
    if (surfaces.some((sf) => blocks(sf, it))) {
      it.out = true;
      trees.hide(it);
      treesOut++;
    }
  }
  for (const it of monoliths.items) {
    if (it.out) continue;
    if (surfaces.some((sf) => blocks(sf, it))) {
      it.out = true;
      for (const m of it.meshes) m.parent?.remove(m);
      const k = monoliths.colliders.indexOf(it.collider);
      if (k >= 0) monoliths.colliders.splice(k, 1);
      monosOut++;
    }
  }
  if (merge) monoliths.merge();
  return { surfaces: surfaces.length, treesOut, monosOut };
}
