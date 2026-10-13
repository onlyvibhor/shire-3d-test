// The interior kit: what every building is built from. A shell (floor, outer walls, ceiling, the
// front door), partitions with open archways between its rooms (no doors to open, no loading:
// one continuous interior), named zones for the floor plan, and a set of real furniture that
// collides properly. Coordinates are the building's own: origin at its centre, the door at +z.
import * as THREE from 'three';
import { canvasTexture, mesh, glow, solid } from '../materials.js';
import { makePerson, animate } from '../characters.js';

export const LITE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('lite');

export function plate(w, h, draw, opts = {}) {
  const tex = canvasTexture(Math.round(w * (opts.res || 256)), Math.round(h * (opts.res || 256)), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: !!opts.transparent, toneMapped: false }));
  m.userData.dynamic = true;
  return m;
}

// ----- the shell -----
export function makeShell({ id, origin, w, d, h, floor, wall, ceiling, trim, doorColor, doorW = 3.2 }) {
  const g = new THREE.Group();
  g.position.copy(origin);
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  g.add(floorMesh);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = h;
  g.add(ceil);
  const wallGeo = (len, hh = h) => new THREE.PlaneGeometry(len, hh);
  const add = (m) => {
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  add(new THREE.Mesh(wallGeo(w), wall)).position.set(0, h / 2, -d / 2);
  const left = add(new THREE.Mesh(wallGeo(d), wall));
  left.position.set(-w / 2, h / 2, 0);
  left.rotation.y = Math.PI / 2;
  const right = add(new THREE.Mesh(wallGeo(d), wall));
  right.position.set(w / 2, h / 2, 0);
  right.rotation.y = -Math.PI / 2;
  const seg = (w - doorW) / 2;
  for (const sx of [-1, 1]) {
    const f = add(new THREE.Mesh(wallGeo(seg), wall));
    f.position.set(sx * (w / 2 - seg / 2), h / 2, d / 2);
    f.rotation.y = Math.PI;
  }
  const doorH = 3.8;
  const lintel = add(new THREE.Mesh(wallGeo(doorW, h - doorH), wall));
  lintel.position.set(0, doorH + (h - doorH) / 2, d / 2);
  lintel.rotation.y = Math.PI;
  for (const [x, z, len, ry] of [[0, -d / 2 + 0.06, w, 0], [-w / 2 + 0.06, 0, d, Math.PI / 2], [w / 2 - 0.06, 0, d, Math.PI / 2]]) {
    const s = mesh(new THREE.BoxGeometry(len, 0.18, 0.12), trim, x, 0.09, z, false);
    s.rotation.y = ry;
    g.add(s);
  }
  // the way out: a warm doorway of daylight with a frame and a sign
  const door = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), glow(doorColor, 1.1));
  door.position.set(0, doorH / 2, d / 2 - 0.02);
  door.rotation.y = Math.PI;
  g.add(door);
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.28, doorH + 0.2, 0.3), trim, sx * (doorW / 2 + 0.14), (doorH + 0.2) / 2, d / 2 - 0.15, false));
  g.add(mesh(new THREE.BoxGeometry(doorW + 0.56, 0.28, 0.3), trim, 0, doorH + 0.14, d / 2 - 0.15, false));
  const exitSign = plate(1.7, 0.42, (ctx, cw, ch) => {
    ctx.fillStyle = '#10261a';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#5ee08a';
    ctx.font = `700 ${ch * 0.52}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT TO ISLAND', cw / 2, ch / 2 + 2);
  });
  exitSign.position.set(0, doorH + 0.62, d / 2 - 0.32);
  exitSign.rotation.y = Math.PI;
  g.add(exitSign);
  const room = {
    id,
    group: g,
    origin: origin.clone(),
    w,
    d,
    h,
    floor: floorMesh,
    bounds: { minX: -w / 2 + 0.5, maxX: w / 2 - 0.5, minZ: -d / 2 + 0.5, maxZ: d / 2 - 0.5 },
    spawn: { x: 0, z: d / 2 - 2.6, heading: Math.PI },
    exit: { x: 0, z: d / 2 - 0.8 },
    colliders: [],
    interactables: [],
    clickables: [],
    npcs: [],
    updaters: [],
    projects: [],
    residents: [],
    blockers: [], // invisible boxes for walls: they stop clicks and keep the camera on your side
    plan: { zones: [], walls: [] },
    lights: [],
  };
  return room;
}

// ----- placement helpers -----
export const local = (room, x, z) => ({ x: room.origin.x + x, z: room.origin.z + z });
export function addCollider(room, x, z, r) {
  room.colliders.push({ ...local(room, x, z), r });
}
export function addBox(room, x0, z0, x1, z1) {
  const o = room.origin;
  room.colliders.push({ x: o.x + (x0 + x1) / 2, z: o.z + (z0 + z1) / 2, r: 0, box: { minX: o.x + Math.min(x0, x1), maxX: o.x + Math.max(x0, x1), minZ: o.z + Math.min(z0, z1), maxZ: o.z + Math.max(z0, z1) } });
}
// a collider box for something of size (w, d) at (x, z) turned by ry (any multiple of 90°)
export function addFootprint(room, x, z, w, d, ry = 0) {
  const turned = Math.abs(Math.sin(ry)) > 0.7;
  const hw = (turned ? d : w) / 2;
  const hd = (turned ? w : d) / 2;
  addBox(room, x - hw, z - hd, x + hw, z + hd);
}
export function addThing(room, x, z, thing) {
  room.interactables.push({ ...thing, ...local(room, x, z) });
}
export function clickable(room, m, action) {
  m.userData.action = action;
  m.userData.dynamic = true;
  room.clickables.push(m);
  return m;
}
export function addNpc(room, p, x, z, rotY, action, dept, extra = {}) {
  p.root.position.set(x, extra.y ?? 0, z);
  p.root.rotation.y = rotY;
  room.group.add(p.root);
  room.updaters.push({ update: (t) => animate(p, action, t) });
  room.npcs.push({ p, dept, ...extra });
  return p;
}
export const person = (o) => makePerson(o);
export const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

// a named area of the building, for the floor plan and for "where am I"
export function zone(room, id, name, x0, z0, x1, z1, at, note = '') {
  room.plan.zones.push({ id, name, x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), at: at || [(x0 + x1) / 2, (z0 + z1) / 2], note });
}

// a soft light source; skipped in lite mode (the emissive fixture still reads as a lamp)
export function lamp(room, x, y, z, color, intensity = 6, distance = 12) {
  if (LITE) return null;
  const l = new THREE.PointLight(color, intensity, distance, 1.6);
  l.position.set(x, y, z);
  room.group.add(l);
  room.lights.push(l);
  return l;
}

// ----- arches -----
// The curve of an opening's head, from its left springing point to its right, as [x, y] points.
//   'round'   a semicircle
//   'scallop' a Rajput multifoil: lobes between inward cusps, the arch of the Jaipur palaces
//   'pointed' a gentle Mughal point
//   'flat'    a square head
export function archCurve(w, spring, style = 'round', lobes = 7) {
  const R = w / 2;
  const pts = [];
  if (style === 'flat') return [[-R, spring], [R, spring]];
  const N = style === 'scallop' ? lobes * 10 : 28;
  for (let k = 0; k <= N; k++) {
    const th = Math.PI - (k / N) * Math.PI;
    let r = R;
    if (style === 'scallop') r = R - R * 0.11 * (1 - Math.abs(Math.sin((lobes * th) / 1))) ** 0.6;
    let y = Math.sin(th) * r;
    if (style === 'pointed') y = Math.sin(th) * R * (1 + 0.35 * Math.sin(th) ** 4);
    pts.push([Math.cos(th) * r, spring + y]);
  }
  return pts;
}

// the solid wall above an opening: its bottom edge is the arch curve
function headPiece(w, spring, top, style, depth, mats) {
  const pts = archCurve(w, spring, style);
  const s = new THREE.Shape();
  s.moveTo(-w / 2, top);
  s.lineTo(-w / 2, pts[0][1]);
  for (const [x, y] of pts) s.lineTo(x, y);
  s.lineTo(w / 2, top);
  s.lineTo(-w / 2, top);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 4 });
  geo.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geo, mats);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// A partition along x (from x0 to x1 at z) or along z (from z0 to z1 at x), with openings in it.
// openings: [{ at, w, style, spring }] — `at` is the centre along the wall. Openings are always
// open: they're the passages between rooms.
export function partition(room, { axis, at, from, to, h = 5, t = 0.32, mat, trim, openings = [], cap = true }) {
  const g = room.group;
  const ops = [...openings].sort((a, b) => a.at - b.at);
  const along = axis === 'x';
  const put = (m, u, y, ry = 0) => {
    if (along) m.position.set(u, y, at);
    else {
      m.position.set(at, y, u);
      m.rotation.y = Math.PI / 2 + ry;
    }
    g.add(m);
    return m;
  };
  const solidSeg = (a, b, y0, y1) => {
    if (b - a < 0.05) return;
    const len = b - a;
    put(mesh(new THREE.BoxGeometry(len, y1 - y0, t), mat, 0, 0, 0), (a + b) / 2, (y0 + y1) / 2);
    blocker(room, along ? [a, at - t / 2, b, at + t / 2] : [at - t / 2, a, at + t / 2, b], y0, y1);
    if (y0 < 0.1) {
      if (along) addBox(room, a, at - t / 2, b, at + t / 2);
      else addBox(room, at - t / 2, a, at + t / 2, b);
      room.plan.walls.push(along ? [a, at, b, at] : [at, a, at, b]);
    }
  };
  let u = from;
  for (const o of ops) {
    const a = o.at - o.w / 2;
    const b = o.at + o.w / 2;
    solidSeg(u, a, 0, h);
    const spring = o.spring ?? Math.min(h - o.w / 2 - 0.35, 3.0);
    const style = o.style || 'scallop';
    if (style !== 'open') {
      const head = headPiece(o.w, spring, h, style, t, [mat, trim || mat]);
      put(head, o.at, 0);
      blocker(room, along ? [a, at - t / 2, b, at + t / 2] : [at - t / 2, a, at + t / 2, b], spring + o.w / 2, h);
      // pilasters framing the passage
      if (trim) for (const e of [a, b]) put(mesh(new THREE.BoxGeometry(0.22, spring, t + 0.12), trim, 0, 0, 0), e, spring / 2);
    }
    // the name of the room beyond, over the passage, on each side
    for (const [side, text] of Object.entries(o.signs || {})) {
      if (!text) continue;
      const sg = archSign(text, o.signColor || '#ffffff', o.signInk);
      const y = Math.min(h - 0.3, (style === 'open' ? h - 0.6 : spring + o.w / 2) + 0.42);
      const off = (t / 2 + 0.012) * (side === 'pos' ? 1 : -1);
      if (along) sg.position.set(o.at, y, at + off);
      else sg.position.set(at + off, y, o.at);
      sg.rotation.y = along ? (side === 'pos' ? 0 : Math.PI) : side === 'pos' ? Math.PI / 2 : -Math.PI / 2;
      g.add(sg);
    }
    u = b;
  }
  solidSeg(u, to, 0, h);
  // a moulded cap along the top of a partial wall
  if (cap && trim) put(mesh(new THREE.BoxGeometry(to - from, 0.14, t + 0.16), trim, 0, 0, 0, false), (from + to) / 2, h + 0.07);
}

function archSign(text, color, ink) {
  const w = Math.min(4.2, 0.7 + text.length * 0.17);
  return plate(w, 0.46, (c, cw, ch) => {
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = ink || 'rgba(14,12,16,0.78)';
    c.beginPath();
    c.roundRect(4, 4, cw - 8, ch - 8, ch / 2 - 4);
    c.fill();
    c.fillStyle = color;
    c.font = `600 ${ch * 0.44}px Inter, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, cw / 2, ch / 2 + 1);
  }, { transparent: true });
}

// invisible, unmerged boxes: clicks stop at walls, and the camera never looks through one
const BLOCK_MAT = new THREE.MeshBasicMaterial({ visible: false });
function blocker(room, [x0, z0, x1, z1], y0, y1) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0)), BLOCK_MAT);
  m.position.set(room.origin.x + (x0 + x1) / 2, room.origin.y + (y0 + y1) / 2, room.origin.z + (z0 + z1) / 2);
  m.updateMatrixWorld(true);
  room.blockers.push(m);
}

// ----- textures -----
export function tileTexture(a, b, cells = 8, line = 'rgba(0,0,0,0.08)') {
  const t = canvasTexture(512, 512, (c, w) => {
    const s = w / cells;
    for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) {
      c.fillStyle = (i + j) % 2 ? a : b;
      c.fillRect(i * s, j * s, s, s);
    }
    c.strokeStyle = line;
    c.lineWidth = 2;
    for (let k = 0; k <= cells; k++) {
      c.beginPath();
      c.moveTo(k * s, 0);
      c.lineTo(k * s, w);
      c.moveTo(0, k * s);
      c.lineTo(w, k * s);
      c.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function plankTexture(tones = ['#b98a5c', '#a97a4e', '#c39468', '#b08254']) {
  const t = canvasTexture(512, 512, (ctx, w) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = tones[i % tones.length];
      ctx.fillRect(0, i * 64, w, 64);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, i * 64, w, 2);
      ctx.fillRect(((i * 197) % 400) + 40, i * 64, 2, 64);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function marbleTexture(base = '#f4f1ea', vein = 'rgba(160,150,130,0.25)') {
  const t = canvasTexture(512, 512, (ctx, w) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = vein;
    for (let k = 0; k < 18; k++) {
      ctx.lineWidth = 1 + (k % 3);
      ctx.beginPath();
      let x = (k * 97) % w;
      ctx.moveTo(x, 0);
      for (let y = 0; y < w; y += 32) ctx.lineTo((x += Math.sin(y * 0.05 + k) * 14), y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, w);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// a floor area of its own (a rug, a carpet, a tiled zone) laid just above the floor
export function floorPatch(room, x, z, w, d, material, y = 0.012) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  room.group.add(m);
  return m;
}

// ----- furniture -----
// Everything takes (room, x, z, ry, opts), adds itself and its collider, and returns its group.
function placed(room, x, z, ry) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  room.group.add(g);
  return g;
}

// a sofa facing +z in its own frame; seat height 0.45, so people can sit on it
export function sofa(room, x, z, ry = 0, { w = 2.6, color = '#5a6b4a', cushion, legs = '#3a2a1c' } = {}) {
  const g = placed(room, x, z, ry);
  const fab = solid(color, { roughness: 0.95 });
  const cus = solid(cushion || color, { roughness: 1 });
  g.add(mesh(new THREE.BoxGeometry(w, 0.28, 0.95), fab, 0, 0.24, 0));
  g.add(mesh(new THREE.BoxGeometry(w - 0.5, 0.16, 0.8), cus, 0, 0.46, 0.05));
  g.add(mesh(new THREE.BoxGeometry(w, 0.62, 0.22), fab, 0, 0.62, -0.38));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.22, 0.5, 0.95), fab, sx * (w / 2 - 0.11), 0.47, 0));
  for (let k = 0; k < Math.round(w / 0.9); k++) {
    const px = -w / 2 + 0.55 + k * ((w - 1.1) / Math.max(1, Math.round(w / 0.9) - 1));
    const p = mesh(new THREE.BoxGeometry(0.5, 0.42, 0.14), cus, px, 0.76, -0.24);
    p.rotation.x = -0.18;
    g.add(p);
  }
  const lm = solid(legs);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.1, 6), lm, sx * (w / 2 - 0.12), 0.05, sz * 0.38));
  addFootprint(room, x, z, w, 0.95, ry);
  return g;
}
export function armchair(room, x, z, ry = 0, { color = '#c98b5a' } = {}) {
  const g = sofa(room, x, z, ry, { w: 1.05, color });
  return g;
}
export function coffeeTable(room, x, z, ry = 0, { w = 1.3, d = 0.7, top = '#7a5232', legs = '#2f2a24', round = false } = {}) {
  const g = placed(room, x, z, ry);
  const tm = solid(top, { roughness: 0.55 });
  if (round) g.add(mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.06, 28), tm, 0, 0.42, 0));
  else g.add(mesh(new THREE.BoxGeometry(w, 0.06, d), tm, 0, 0.42, 0));
  const lm = solid(legs);
  if (round) g.add(mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.4, 10), lm, 0, 0.2, 0));
  else for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), lm, sx * (w / 2 - 0.08), 0.2, sz * (d / 2 - 0.08)));
  if (round) addCollider(room, x, z, w / 2 + 0.05);
  else addFootprint(room, x, z, w, d, ry);
  return g;
}
export function table(room, x, z, ry = 0, { w = 1.8, d = 0.9, h = 0.76, top = '#8a5f3a', legs = '#2f2a24', chairs = 0, chairColor = '#3c4a3a' } = {}) {
  const g = placed(room, x, z, ry);
  g.add(mesh(new THREE.BoxGeometry(w, 0.06, d), solid(top, { roughness: 0.5 }), 0, h, 0));
  const lm = solid(legs);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.06, h, 0.06), lm, sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1)));
  const per = Math.ceil(chairs / 2);
  for (let k = 0; k < chairs; k++) {
    const side = k < per ? -1 : 1;
    const i = k < per ? k : k - per;
    const cx = -w / 2 + (w / (per + 1)) * (i + 1);
    chairIn(g, cx, side * (d / 2 + 0.38), side > 0 ? Math.PI : 0, chairColor);
  }
  addFootprint(room, x, z, w + 0.1, d + (chairs ? 1.2 : 0.1), ry);
  return g;
}
function chairIn(g, x, z, ry, color) {
  const c = new THREE.Group();
  c.position.set(x, 0, z);
  c.rotation.y = ry;
  const m = solid(color, { roughness: 0.8 });
  c.add(mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44), m, 0, 0.46, 0));
  c.add(mesh(new THREE.BoxGeometry(0.46, 0.5, 0.05), m, 0, 0.72, -0.2));
  const lm = solid('#2f2a24');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.add(mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), lm, sx * 0.19, 0.23, sz * 0.18));
  g.add(c);
}
export function chair(room, x, z, ry = 0, { color = '#3c4a3a' } = {}) {
  const g = placed(room, x, z, 0);
  chairIn(g, 0, 0, ry, color);
  addCollider(room, x, z, 0.32);
  return g;
}
export function stool(room, x, z, { color = '#2f2a24', h = 0.75 } = {}) {
  const g = placed(room, x, z, 0);
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), solid(color), 0, h, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, h, 8), solid('#1e1e1e', { metalness: 0.6, roughness: 0.4 }), 0, h / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), solid('#1e1e1e', { metalness: 0.6, roughness: 0.4 }), 0, 0.015, 0));
  addCollider(room, x, z, 0.25);
  return g;
}
export function rug(room, x, z, w, d, colors = ['#b5523b', '#e8c27a', '#2f5b4a'], { round = false, ry = 0 } = {}) {
  const tex = canvasTexture(512, Math.round((512 * d) / w), (c, cw, ch) => {
    c.fillStyle = colors[0];
    c.fillRect(0, 0, cw, ch);
    c.strokeStyle = colors[1];
    c.lineWidth = 14;
    c.strokeRect(22, 22, cw - 44, ch - 44);
    c.lineWidth = 5;
    c.strokeRect(48, 48, cw - 96, ch - 96);
    c.fillStyle = colors[2];
    for (let k = 0; k < 6; k++) {
      c.beginPath();
      c.arc(cw / 2, ch / 2, 30 + k * 26, 0, Math.PI * 2);
      c.globalAlpha = k % 2 ? 0.35 : 0.8;
      c.lineWidth = 6;
      c.strokeStyle = k % 2 ? colors[1] : colors[2];
      c.stroke();
    }
    c.globalAlpha = 1;
  });
  const m = new THREE.Mesh(round ? new THREE.CircleGeometry(w / 2, 48) : new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = ry;
  m.position.set(x, 0.015, z);
  m.receiveShadow = true;
  room.group.add(m);
  return m;
}
export function plant(room, x, z, { s = 1, pot = '#e9dcc8', leaf = '#4f8a3a' } = {}) {
  const g = placed(room, x, z, 0);
  g.add(mesh(new THREE.CylinderGeometry(0.32 * s, 0.24 * s, 0.55 * s, 16), solid(pot, { roughness: 0.8 }), 0, 0.275 * s, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.29 * s, 0.29 * s, 0.04, 16), solid('#3b2a1c'), 0, 0.53 * s, 0));
  const lm = solid(leaf, { roughness: 0.9, flatShading: true });
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const l = mesh(new THREE.ConeGeometry(0.12 * s, 0.9 * s, 4), lm, Math.cos(a) * 0.16 * s, 0.95 * s, Math.sin(a) * 0.16 * s);
    l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    g.add(l);
  }
  g.add(mesh(new THREE.IcosahedronGeometry(0.3 * s, 1), lm, 0, 1.2 * s, 0));
  addCollider(room, x, z, 0.36 * s);
  return g;
}
export function floorLamp(room, x, z, { color = '#ffe2a8', stem = '#2b2b2b', light = false } = {}) {
  const g = placed(room, x, z, 0);
  const sm = solid(stem, { metalness: 0.5, roughness: 0.4 });
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.04, 16), sm, 0, 0.02, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), sm, 0, 0.8, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.32, 18, 1, true), glow(color, 1.6), 0, 1.68, 0, false));
  addCollider(room, x, z, 0.22);
  if (light) lamp(room, x, 1.6, z, color, 3, 7);
  return g;
}
export function pendant(room, x, z, y, { color = '#ffe2a8', shade = '#c9a24a', r = 0.3 } = {}) {
  const g = placed(room, x, z, 0);
  g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, room.h - y, 4), solid('#222'), 0, (room.h + y) / 2, 0, false));
  g.add(mesh(new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), solid(shade, { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }), 0, y, 0, false));
  g.add(mesh(new THREE.SphereGeometry(r * 0.35, 12, 8), glow(color, 3), 0, y - 0.02, 0, false));
  return g;
}
// open shelving against a wall; its back to -z in its own frame
export function shelf(room, x, z, ry = 0, { w = 2.4, h = 2.4, d = 0.42, wood = '#7a5232', rows = 4, fill = 'books', r = Math.random } = {}) {
  const g = placed(room, x, z, ry);
  const wm = solid(wood, { roughness: 0.7 });
  g.add(mesh(new THREE.BoxGeometry(w, h, 0.04), wm, 0, h / 2, -d / 2 + 0.02));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.05, h, d), wm, sx * (w / 2 - 0.025), h / 2, 0));
  const step = (h - 0.1) / rows;
  for (let k = 0; k <= rows; k++) g.add(mesh(new THREE.BoxGeometry(w, 0.04, d), wm, 0, 0.05 + k * step, 0));
  if (fill === 'books') {
    const cols = ['#b5523b', '#2f5b4a', '#e8c27a', '#3d5f9e', '#7b5c8a', '#1f2937', '#f4efe6', '#c8503c'];
    for (let row = 0; row < rows; row++) {
      let bx = -w / 2 + 0.1;
      while (bx < w / 2 - 0.25) {
        const bw = 0.05 + r() * 0.06;
        const bh = step * (0.62 + r() * 0.25);
        if (r() < 0.08) {
          bx += 0.25;
          continue;
        }
        g.add(mesh(new THREE.BoxGeometry(bw, bh, d * 0.8), solid(cols[Math.floor(r() * cols.length)]), bx + bw / 2, 0.07 + row * step + bh / 2, 0.02, false));
        bx += bw + 0.012;
      }
    }
  }
  addFootprint(room, x, z, w, d + 0.1, ry);
  return g;
}
// a plinth with something on it; top at h
export function plinth(room, x, z, { w = 0.9, h = 1.05, color = '#26242f', top = null, collide = true } = {}) {
  const g = placed(room, x, z, 0);
  g.add(mesh(new THREE.BoxGeometry(w, h, w), solid(color, { roughness: 0.6 }), 0, h / 2, 0));
  if (top) g.add(mesh(new THREE.BoxGeometry(w + 0.08, 0.05, w + 0.08), top, 0, h + 0.025, 0, false));
  if (collide) addCollider(room, x, z, w * 0.72);
  return g;
}
// a picture in a frame on a wall; facing +z in its own frame
export function framed(room, x, y, z, ry, w, h, material, { frame = '#2b2118', border = 0.08, mat = null } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const fm = typeof frame === 'string' ? solid(frame, { roughness: 0.5 }) : frame;
  g.add(mesh(new THREE.BoxGeometry(w + border * 2, h + border * 2, 0.06), fm, 0, 0, 0, false));
  if (mat) g.add(mesh(new THREE.BoxGeometry(w + border * 0.6, h + border * 0.6, 0.065), solid(mat), 0, 0, 0.002, false));
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  pic.position.z = 0.036;
  pic.userData.dynamic = true;
  g.add(pic);
  room.group.add(g);
  return { group: g, pic };
}
// a big integrated screen with a slim bezel; facing +z in its own frame
export function bigScreen(room, x, y, z, ry, w, h, material, { bezel = '#0c0d10' } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  g.add(mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.08), solid(bezel, { roughness: 0.3, metalness: 0.4 }), 0, 0, -0.03, false));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  scr.position.z = 0.012;
  scr.userData.dynamic = true;
  g.add(scr);
  room.group.add(g);
  return { group: g, screen: scr };
}
// a kitchen or bar counter; front faces +z
export function counter(room, x, z, ry = 0, { w = 3, d = 0.7, h = 0.92, body = '#e9dcc8', top = '#f4f1ea' } = {}) {
  const g = placed(room, x, z, ry);
  g.add(mesh(new THREE.BoxGeometry(w, h - 0.05, d), solid(body, { roughness: 0.7 }), 0, (h - 0.05) / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(w + 0.06, 0.05, d + 0.06), solid(top, { roughness: 0.25 }), 0, h - 0.025, 0));
  addFootprint(room, x, z, w + 0.06, d + 0.06, ry);
  return g;
}
// a lit niche in a wall: a recess with a warm back, for one object; facing +z in its own frame
export function niche(room, x, z, ry, { w = 1.3, h = 2.2, y = 0.9, depth = 0.45, frame, back = '#3a2f22', light = '#ffe2a8', style = 'scallop' } = {}) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  const fm = frame || solid('#d9b45a', { metalness: 0.7, roughness: 0.3 });
  g.add(mesh(new THREE.BoxGeometry(w, h, 0.04), solid(back, { roughness: 0.9, emissive: light, emissiveIntensity: 0.12 }), 0, y + h / 2, -depth));
  g.add(mesh(new THREE.BoxGeometry(w, 0.06, depth), fm, 0, y, -depth / 2, false));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.06, h, depth), fm, sx * (w / 2), y + h / 2, -depth / 2, false));
  const head = headPiece(w + 0.12, y + h - w / 2, y + h + 0.2, style, 0.08, [fm, fm]);
  head.position.z = 0.02;
  g.add(head);
  g.add(mesh(new THREE.BoxGeometry(w - 0.1, 0.03, 0.03), glow(light, 2.4), 0, y + h - w / 2 - 0.04, -0.06, false));
  room.group.add(g);
  return g;
}
