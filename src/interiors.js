import * as THREE from 'three';
import { AIHUB, FUN } from './data.js';
import { deepMerge } from './materials.js';
import { addStory } from './roomstory.js';
import { buildPlayhouse } from './rooms/playhouse.js';
import { buildAIHub } from './rooms/aihub.js';
import { buildHome } from './rooms/home.js';
import { buildHall } from './rooms/hall.js';

// The four buildings you can walk into. Each is one continuous interior of several rooms, built in
// src/rooms/ from a shared kit; they live far from the island, and entering one hides the island
// and relights the scene (see nav.js).

// Box furniture (seats, sofas, stools, plinths) that was set a little above the floor, or above
// the riser or base under it, is extended down so it stands on it instead of hovering.
function settleFurniture(room) {
  const g = room.group;
  g.updateMatrixWorld(true);
  const boxes = [];
  g.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.userData.dynamic) return;
    const b = new THREE.Box3().setFromObject(o, false);
    if (!b.isEmpty()) boxes.push({ o, b });
  });
  const floor = room.origin.y;
  const e = new THREE.Euler();
  for (const { o, b } of boxes) {
    if (o.geometry.type !== 'BoxGeometry' || o === room.floor) continue;
    e.setFromRotationMatrix(o.matrixWorld);
    if (Math.abs(e.x) > 0.01 || Math.abs(e.z) > 0.01) continue;
    // what is right underneath: the floor or the top of something it overlaps
    let under = floor;
    for (const c of boxes) {
      if (c.o === o) continue;
      const cb = c.b;
      if (cb.max.y > b.min.y + 0.01) continue;
      if (cb.min.x < b.max.x - 0.05 && cb.max.x > b.min.x + 0.05 && cb.min.z < b.max.z - 0.05 && cb.max.z > b.min.z + 0.05) under = Math.max(under, cb.max.y);
    }
    const gap = b.min.y - under;
    if (gap < 0.03 || gap > 0.45) continue;
    const p = o.geometry.parameters;
    const sy = o.getWorldScale(new THREE.Vector3()).y;
    o.geometry = new THREE.BoxGeometry(p.width, p.height + gap / sy, p.depth);
    o.position.y -= gap / sy / 2 * o.scale.y;
    o.updateMatrixWorld(true);
    b.setFromObject(o, false);
  }
}

export function buildInteriors(root) {
  const rooms = {
    ai: buildAIHub(new THREE.Vector3(3000, 0, 0)),
    home: buildHome(new THREE.Vector3(3000, 0, 400)),
    fun: buildPlayhouse(new THREE.Vector3(3000, 0, 800)),
    awards: buildHall(new THREE.Vector3(3000, 0, 1200)),
  };
  const theme = { ai: [AIHUB.color, true], home: ['#c8503c', false], fun: [FUN.color, true], awards: ['#d9a441', true] };
  for (const [id, room] of Object.entries(rooms)) {
    settleFurniture(room);
    // the room's story: numbered stops, lecterns and a path from the door
    room.story = addStory(room, id, theme[id][0], { dark: theme[id][1] });
    room.group.visible = false;
    root.add(room.group);
    deepMerge(room.group);
  }
  return rooms;
}
