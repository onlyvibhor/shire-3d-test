// More of the full island for the light one, each piece sized for a phone:
//   - a meadow of grass and flowers (two instanced meshes, a few thousand blades in one draw each)
//   - lamps along the spokes that light up at night (instanced)
//   - Sankranti kites over the tree, and a few drifting clouds
//   - villagers walking the roads (one draw call each, animated only when you're near)
//   - each department's real production scene from the full island (the reel shoot, the TV
//     commercial, the launch centre, the creative review), streamed in as you approach that team
//     and taken down again when you leave, so only one is ever in memory.
import * as THREE from 'three';
import { makePerson, animate } from '../characters.js';
import { buildSocialStudio, buildBrandShoot, buildLaunchCentre, buildMentorStudio } from '../ambient/departments.js';

const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function segDist(x, z, [ax, az, bx, bz]) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - (ax + t * dx), z - (az + t * dz));
}

export function buildExtras(scene, { PATHS, PLACES, POND, coastR, lite = false }) {
  const rnd = rng(11);
  const onRoad = (x, z, pad) => PATHS.some((s) => segDist(x, z, s) < s[4] + pad);
  const inPlace = (x, z) => PLACES.some((p) => Math.hypot(x - p.x, z - p.z) < (p.reach === 22 ? 17 : p.id === 'hq' ? 12 : 10));
  const inPond = (x, z) => Math.hypot(x - POND.x, z - POND.z) < POND.r + 2;
  const spot = (minR, pad) => {
    for (let k = 0; k < 30; k++) {
      const a = rnd() * Math.PI * 2;
      const r = minR + rnd() * (coastR(a) - 12 - minR);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!onRoad(x, z, pad) && !inPlace(x, z) && !inPond(x, z)) return [x, z];
    }
    return null;
  };
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  // ---------- the meadow ----------
  const GRASS = lite ? 4000 : 9000;
  const blade = new THREE.ConeGeometry(0.06, 0.42, 3);
  blade.translate(0, 0.21, 0);
  const grass = new THREE.InstancedMesh(blade, new THREE.MeshLambertMaterial({ color: '#ffffff' }), GRASS);
  let n = 0;
  for (let i = 0; i < GRASS * 1.4 && n < GRASS; i++) {
    const s = spot(8, 1.2);
    if (!s) continue;
    dummy.position.set(s[0], 0, s[1]);
    dummy.rotation.set((rnd() - 0.5) * 0.35, rnd() * Math.PI, (rnd() - 0.5) * 0.35);
    dummy.scale.set(1 + rnd() * 0.6, 0.6 + rnd() * 0.8, 1 + rnd() * 0.6);
    dummy.updateMatrix();
    grass.setMatrixAt(n, dummy.matrix);
    grass.setColorAt(n, col.setHSL(0.24 + rnd() * 0.06, 0.45 + rnd() * 0.2, 0.32 + rnd() * 0.16));
    n++;
  }
  grass.count = n;
  scene.add(grass);

  const FLOWERS = lite ? 900 : 2000;
  const PALETTE = ['#ff6fa3', '#ffd34d', '#b28cff', '#ffffff', '#ff7a4d', '#7fd2ff'];
  const head = new THREE.IcosahedronGeometry(0.2, 0);
  head.translate(0, 0.55, 0);
  const flowers = new THREE.InstancedMesh(head, new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), FLOWERS);
  n = 0;
  for (let i = 0; i < FLOWERS * 1.4 && n < FLOWERS; i++) {
    // flowers gather in drifts beside the roads and round the plazas
    const s = spot(10, 0.9);
    if (!s) continue;
    dummy.position.set(s[0], 0, s[1]);
    dummy.rotation.set(0, rnd() * 6, 0);
    dummy.scale.setScalar(0.7 + rnd() * 0.7);
    dummy.updateMatrix();
    flowers.setMatrixAt(n, dummy.matrix);
    flowers.setColorAt(n, col.set(PALETTE[Math.floor(rnd() * PALETTE.length)]));
    n++;
  }
  flowers.count = n;
  scene.add(flowers);

  // ---------- lamps along the spokes ----------
  const lampSpots = [];
  for (const [ax, az, bx, bz, half, kind] of PATHS) {
    if (kind !== 'spoke') continue;
    const len = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / len;
    const uz = (bz - az) / len;
    for (let d = 18; d < len - 16; d += 13) {
      const side = (Math.round(d / 13) % 2 ? 1 : -1) * (half + 1.2);
      lampSpots.push([ax + ux * d - uz * side, az + uz * d + ux * side]);
    }
  }
  const postGeo = new THREE.CylinderGeometry(0.07, 0.1, 3.4, 6);
  postGeo.translate(0, 1.7, 0);
  const posts = new THREE.InstancedMesh(postGeo, new THREE.MeshLambertMaterial({ color: '#2a2f34' }), lampSpots.length);
  const lampMat = new THREE.MeshLambertMaterial({ color: '#fff3d6', emissive: '#ffd27a', emissiveIntensity: 0.2 });
  const headGeo = new THREE.SphereGeometry(0.28, 10, 8);
  headGeo.translate(0, 3.5, 0);
  const heads = new THREE.InstancedMesh(headGeo, lampMat, lampSpots.length);
  lampSpots.forEach(([x, z], i) => {
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix);
    heads.setMatrixAt(i, dummy.matrix);
  });
  scene.add(posts, heads);
  const lampSolids = lampSpots.map(([x, z]) => [x, z, 0.25]);

  // ---------- kites over the tree, clouds overhead ----------
  const kites = [];
  const KITE_COLORS = ['#ff4f8b', '#ffd34d', '#2f6bff', '#3dd36d', '#ff7a1a', '#7b5cff', '#00c2ff', '#e8505b'];
  const kiteShape = new THREE.Shape();
  kiteShape.moveTo(0, 0.9);
  kiteShape.lineTo(0.65, 0);
  kiteShape.lineTo(0, -0.9);
  kiteShape.lineTo(-0.65, 0);
  kiteShape.closePath();
  const kiteGeo = new THREE.ShapeGeometry(kiteShape);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + rnd();
    const r = 18 + rnd() * 30;
    const anchor = new THREE.Vector3(Math.cos(a) * (r * 0.4), 0.5, Math.sin(a) * (r * 0.4));
    const kite = new THREE.Mesh(kiteGeo, new THREE.MeshBasicMaterial({ color: KITE_COLORS[k], side: THREE.DoubleSide }));
    const base = new THREE.Vector3(Math.cos(a) * r, 24 + rnd() * 14, Math.sin(a) * r);
    kite.position.copy(base);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([anchor, base]), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 }));
    scene.add(kite, line);
    kites.push({ kite, line, base, anchor, ph: rnd() * 6 });
  }
  const clouds = [];
  const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true, transparent: true, opacity: 0.92 });
  for (let k = 0; k < 7; k++) {
    const g = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + rnd() * 4, 0), cloudMat);
      m.position.set((j - 1.5) * 5, rnd() * 2, rnd() * 3);
      g.add(m);
    }
    const a = rnd() * Math.PI * 2;
    const r = 60 + rnd() * 140;
    g.position.set(Math.cos(a) * r, 55 + rnd() * 25, Math.sin(a) * r);
    scene.add(g);
    clouds.push({ g, a, r, w: 0.004 + rnd() * 0.006 });
  }

  // ---------- villagers on the roads ----------
  const walkers = [];
  const roads = PATHS.filter((s) => s[5] !== 'lane');
  const WALKERS = lite ? 8 : 14;
  for (let k = 0; k < WALKERS; k++) {
    const p = makePerson({ seed: (k * 0.137 + 0.21) % 1, accent: PLACES[1 + (k % (PLACES.length - 1))].color });
    const seg = roads[Math.floor(rnd() * roads.length)];
    const w = { p, seg, f: rnd(), dir: rnd() < 0.5 ? 1 : -1, speed: 1.2 + rnd() * 0.5, side: (rnd() < 0.5 ? -1 : 1) * (seg[4] * 0.55) };
    scene.add(p.root);
    walkers.push(w);
  }
  const nextSeg = (w) => {
    // at the end of a road, carry on along one that starts there (or turn round)
    const [ax, az, bx, bz] = w.seg;
    const ex = w.dir > 0 ? bx : ax;
    const ez = w.dir > 0 ? bz : az;
    const options = roads.filter((s) => s !== w.seg && (Math.hypot(s[0] - ex, s[1] - ez) < 1 || Math.hypot(s[2] - ex, s[3] - ez) < 1));
    if (!options.length) {
      w.dir = -w.dir;
      return;
    }
    const s = options[Math.floor(rnd() * options.length)];
    w.seg = s;
    w.dir = Math.hypot(s[0] - ex, s[1] - ez) < 1 ? 1 : -1;
    w.f = w.dir > 0 ? 0 : 1;
  };

  // ---------- the departments' own scenes, streamed ----------
  const BUILDERS = { brand: buildBrandShoot, pmm: buildLaunchCentre, social: buildSocialStudio, mentorship: buildMentorStudio };
  const streamPos = new THREE.Vector3(1e6, 0, 1e6);
  const streamed = PLACES.filter((p) => BUILDERS[p.id]).map((p) => ({ p, g: null, updaters: [], solids: [] }));
  let busy = false;
  function load(s) {
    const g = new THREE.Group();
    g.position.set(s.p.x, 0, s.p.z);
    g.rotation.y = Math.atan2(-s.p.x, -s.p.z); // the scene's +z (its gateway) faces the tree
    const colliders = [];
    const collider = (parent, r, x = 0, z = 0) => {
      const o = new THREE.Object3D();
      o.position.set(x, 0, z);
      o.userData.collider = r;
      parent.add(o);
      colliders.push(o);
    };
    const updaters = [];
    BUILDERS[s.p.id](g, { color: s.p.color, collider, r: rng(Math.round(Math.abs(s.p.x * 97 + s.p.z * 13)) + 1), playerPos: streamPos, updaters });
    scene.add(g);
    g.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    s.solids = colliders.map((o) => {
      o.getWorldPosition(v);
      return [v.x, v.z, o.userData.collider];
    });
    s.g = g;
    s.updaters = updaters;
  }
  function unload(s, t) {
    // let the screens know nobody's watching (pauses their videos), then take it all down
    const far = streamPos.clone();
    streamPos.set(1e6, 0, 1e6);
    for (const u of s.updaters) u.update?.(t);
    streamPos.copy(far);
    scene.remove(s.g);
    s.g.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.geometry?.dispose();
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        // geometry and pictures are what take the memory; materials are shared (the people's
        // material is the player's too), so they stay and nothing has to recompile
        for (const m of ms) if (m?.map) m.map.dispose();
      }
    });
    s.g = null;
    s.updaters = [];
    s.solids = [];
  }

  let night = 0;
  const solidsNow = () => {
    const out = lampSolids.slice();
    for (const s of streamed) if (s.g) out.push(...s.solids);
    return out;
  };
  let solidsCache = solidsNow();

  return {
    get solids() {
      return solidsCache;
    },
    setNight(n) {
      night = n;
      lampMat.emissiveIntensity = 0.2 + n * 2.2;
    },
    update(t, dt, player, stream = true) {
      streamPos.copy(player);
      // stream: build the team you're walking towards, drop the ones you've left
      for (const s of streamed) {
        const d = Math.hypot(player.x - s.p.x, player.z - s.p.z);
        if (stream && !s.g && d < 58 && !busy) {
          busy = true;
          load(s);
          solidsCache = solidsNow();
          setTimeout(() => (busy = false), 400);
        } else if (s.g && d > 95) {
          unload(s, t);
          solidsCache = solidsNow();
        }
        if (s.g) for (const u of s.updaters) u.update?.(t);
      }
      // kites and clouds
      for (const k of kites) {
        k.kite.position.set(k.base.x + Math.sin(t * 0.7 + k.ph) * 2.2, k.base.y + Math.sin(t * 1.3 + k.ph) * 1.4, k.base.z + Math.cos(t * 0.6 + k.ph) * 1.8);
        k.kite.rotation.set(Math.sin(t + k.ph) * 0.3, t * 0.2 + k.ph, Math.sin(t * 1.7 + k.ph) * 0.4);
        const pos = k.line.geometry.attributes.position;
        pos.setXYZ(1, k.kite.position.x, k.kite.position.y, k.kite.position.z);
        pos.needsUpdate = true;
      }
      for (const c of clouds) {
        c.a += c.w * dt;
        c.g.position.x = Math.cos(c.a) * c.r;
        c.g.position.z = Math.sin(c.a) * c.r;
      }
      // villagers: walk everywhere, but only animate the ones you can see up close
      for (const w of walkers) {
        const [ax, az, bx, bz] = w.seg;
        const len = Math.hypot(bx - ax, bz - az) || 1;
        w.f += (w.dir * w.speed * dt) / len;
        if (w.f > 1 || w.f < 0) {
          w.f = Math.max(0, Math.min(1, w.f));
          nextSeg(w);
          continue;
        }
        const ux = (bx - ax) / len;
        const uz = (bz - az) / len;
        const x = ax + (bx - ax) * w.f - uz * w.side;
        const z = az + (bz - az) * w.f + ux * w.side;
        const d = Math.hypot(x - player.x, z - player.z);
        w.p.root.visible = d < 110;
        if (!w.p.root.visible) continue;
        w.p.root.position.set(x, 0, z);
        w.p.root.rotation.y = Math.atan2(ux * w.dir, uz * w.dir);
        if (d < 60) animate(w.p, 'walk', t + w.f * 7, w.speed);
      }
    },
    night: () => night,
  };
}
