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
  for (const [place, out] of [[AIHUB, 13], [HALL, 13], [HOME, 13], [FUN, 13], [LAB, 9.5]]) {
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
