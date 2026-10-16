// The island's plan without its terrain: the same positions as the full island (world.js), so the
// places, the roads, the map and the campaigns line up, but nothing heavy is built.
import { HAMLETS, LAB, HOME, FUN, AIHUB, HALL, CENTER, DEPARTMENTS } from '../data.js';

const PLAN = {
  departments: { brand: 75, pmm: 70, product: 66, social: 76, mentorship: 70, design: 66 },
  zones: { fun: [60, 43], home: [240, 42] },
  corners: { ai: ['design', 15], awards: ['product', 14] },
  roads: { spoke: 2.3, ring: 1.85, lane: 1.35 },
};
const rad = (d) => (d * Math.PI) / 180;

HAMLETS.forEach((h, i) => {
  const a = -Math.PI / 2 + (i / HAMLETS.length) * Math.PI * 2;
  const r = PLAN.departments[h.id] ?? 72;
  h.angle = a;
  h.x = Math.cos(a) * r;
  h.z = Math.sin(a) * r;
});
const pondAngle = (HAMLETS[0].angle + HAMLETS[1].angle) / 2;
export const POND = { x: Math.cos(pondAngle) * 44, z: Math.sin(pondAngle) * 44, r: 7.4, bank: 10 };
LAB.angle = pondAngle;
LAB.x = Math.cos(pondAngle) * 25;
LAB.z = Math.sin(pondAngle) * 25;
for (const place of [FUN, HOME]) {
  const [deg, r] = PLAN.zones[place.id];
  place.angle = rad(deg);
  place.x = Math.cos(place.angle) * r;
  place.z = Math.sin(place.angle) * r;
}
for (const place of [AIHUB, HALL]) {
  const [slot, past] = PLAN.corners[place.id];
  const h = HAMLETS.find((s) => s.id === slot);
  place.corner = h;
  place.angle = h.angle;
  place.x = Math.cos(h.angle) * (Math.hypot(h.x, h.z) + past);
  place.z = Math.sin(h.angle) * (Math.hypot(h.x, h.z) + past);
  place.facing = Math.atan2(h.x - place.x, h.z - place.z);
}

export const PATHS = [];
HAMLETS.forEach((h, i) => {
  const n = HAMLETS[(i + 1) % HAMLETS.length];
  PATHS.push([0, 0, h.x, h.z, PLAN.roads.spoke, 'spoke']);
  PATHS.push([h.x, h.z, n.x, n.z, PLAN.roads.ring, 'ring']);
});
for (const [z, i, r, edge] of [[FUN, 2, 32, 11], [HOME, 5, 32, 11], [LAB, 1, 19, 7.4]]) {
  const a = HAMLETS[i].angle;
  const sx = Math.cos(a) * r;
  const sz = Math.sin(a) * r;
  const dx = z.x - sx;
  const dz = z.z - sz;
  const l = Math.hypot(dx, dz);
  PATHS.push([sx, sz, z.x - (dx / l) * edge, z.z - (dz / l) * edge, PLAN.roads.lane, 'lane']);
  z.facing = Math.atan2(sx - z.x, sz - z.z);
}
for (const z of [AIHUB, HALL]) {
  const h = z.corner;
  const l = Math.hypot(z.x - h.x, z.z - h.z);
  PATHS.push([h.x, h.z, z.x - ((z.x - h.x) / l) * 11, z.z - ((z.z - h.z) / l) * 11, PLAN.roads.lane, 'lane']);
}

export function coastR(a) {
  return 152 + 9 * Math.sin(3 * a + 1) + 6 * Math.sin(5 * a + 0.4) + 3 * Math.sin(9 * a);
}

// every place, as the full island lists them (reach: how close counts as "here")
export const PLACES = [
  { ...CENTER, x: 0, z: 0, reach: 16 },
  ...DEPARTMENTS.map((h) => Object.assign(h, { reach: 22 })),
  Object.assign(LAB, { reach: 9 }),
  Object.assign(FUN, { reach: 16 }),
  Object.assign(HOME, { reach: 16 }),
  Object.assign(AIHUB, { reach: 17 }),
  Object.assign(HALL, { reach: 16 }),
];
