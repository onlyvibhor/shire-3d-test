// Each place's two signs: one with what I believe about working there, one with the place's
// name, standing one each side of the road just outside its gate, boards running along the road
// so they read as you walk in or out. Same copy on both faces of each. Shared by the full island
// and the light one.
import * as THREE from 'three';
import { CENTER, HAMLETS, LAB, HOME, FUN, AIHUB, HALL, BELIEFS } from './data.js';
import { makeSignPair } from './jaipur.js';

const SPOKE_HALF = 2.3;
const LANE_HALF = 1.35;

export function placeSignPairs(parent, { departments, deptEntrance, groundAt = () => 0, lamps = [], colliders = [] }) {
  const entries = [];
  for (const h of departments) {
    const en = deptEntrance(h);
    if (en) entries.push({ place: h, ...en, half: SPOKE_HALF });
  }
  // the places on lanes: out along the lane from their gate
  for (const [place, out] of [[AIHUB, 13], [HALL, 13], [HOME, 13], [FUN, 13]]) {
    const f = place.facing ?? Math.atan2(-place.x, -place.z);
    const u = new THREE.Vector3(Math.sin(f), 0, Math.cos(f));
    entries.push({ place, e: new THREE.Vector3(place.x, 0, place.z).addScaledVector(u, out), u, half: LANE_HALF });
  }
  // the tree: on the spoke that faces where you arrive
  {
    const h = [...HAMLETS].sort((a, b) => Math.sin(b.angle) - Math.sin(a.angle))[0];
    const u = new THREE.Vector3(Math.cos(h.angle), 0, Math.sin(h.angle));
    entries.push({ place: CENTER, e: u.clone().multiplyScalar(15.5), u, half: SPOKE_HALF });
  }
  const placed = [];
  // the Night Lab has no gate: its two signs stand on the grass at the edge of the ring stage,
  // either side of the way in from the tree, boards following the ring and facing you as you come
  if (BELIEFS[LAB.id]) {
    const r = Math.atan2(-LAB.x, -LAB.z) + Math.PI; // the stage's frame: +z towards the pond
    const local = (x, z) => new THREE.Vector3(LAB.x + x * Math.cos(r) + z * Math.sin(r), 0, LAB.z - x * Math.sin(r) + z * Math.cos(r));
    const pair = makeSignPair(LAB, BELIEFS[LAB.id]);
    [[pair.belief, -1], [pair.name, 1]].forEach(([sign, side]) => {
      const a = THREE.MathUtils.degToRad(side * 146);
      const c = local(Math.sin(a) * 9.3, 0.6 + Math.cos(a) * 9.3);
      const t = local(Math.cos(a), 0.6 - Math.sin(a)).sub(local(0, 0.6)); // along the ring
      const p1 = [c.x + t.x * 1.71, c.z + t.z * 1.71];
      const p2 = [c.x - t.x * 1.71, c.z - t.z * 1.71];
      sign.position.set(c.x, Math.min(groundAt(...p1), groundAt(...p2), groundAt(c.x, c.z)) - 0.05, c.z);
      sign.rotation.y = Math.atan2(-t.z, t.x);
      parent.add(sign);
      for (const [cx, cz] of [p1, p2, [c.x, c.z]]) colliders.push({ x: cx, z: cz, r: 0.4 });
      placed.push(sign);
    });
  }
  for (const { place, e, u, half } of entries) {
    if (!BELIEFS[place.id]) continue;
    const n = new THREE.Vector3(-u.z, 0, u.x); // across the road
    const off = half + 1.7;
    // step further out if a street lamp stands where a sign would
    for (let k = 0; k < 5; k++) {
      const clash = lamps.some((l) => [1, -1].some((side) => Math.hypot(l.x - (e.x + n.x * off * side), l.z - (e.z + n.z * off * side)) < 2.4));
      if (!clash) break;
      e.addScaledVector(u, 2.2);
    }
    const pair = makeSignPair(place, BELIEFS[place.id]);
    const rot = Math.atan2(-u.z, u.x); // the board's width runs along the road
    [[pair.belief, -1], [pair.name, 1]].forEach(([sign, side]) => {
      const x = e.x + n.x * off * side;
      const z = e.z + n.z * off * side;
      const p1 = [x + u.x * 1.71, z + u.z * 1.71];
      const p2 = [x - u.x * 1.71, z - u.z * 1.71];
      sign.position.set(x, Math.min(groundAt(...p1), groundAt(...p2), groundAt(x, z)) - 0.05, z);
      sign.rotation.y = rot;
      parent.add(sign);
      for (const [cx, cz] of [p1, p2, [x, z]]) colliders.push({ x: cx, z: cz, r: 0.4 });
      placed.push(sign);
    });
  }
  return placed;
}
