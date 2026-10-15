// Production equipment for the department scenes, at real-world scale (the avatar is ~1.75 m):
// tripods, C-stands and sandbags, ring lights, softboxes, LED panels, a cinema camera on a fluid
// head, a boom with a zeppelin mic, a clapperboard, carts, cases and cable, folding furniture.
// Built from a few shared materials so the scenes stay cheap to draw.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mesh, solid, glow, canvasTexture, WHITE_METAL, BRUSHED, CHROME, WOOD } from '../materials.js';

export const M = {
  black: solid('#17191d', { roughness: 0.55, metalness: 0.2 }),
  graphite: solid('#2c3037', { roughness: 0.42, metalness: 0.45 }),
  rubber: solid('#0f1012', { roughness: 0.95 }),
  alu: BRUSHED,
  chrome: CHROME,
  white: WHITE_METAL,
  lens: solid('#0a0f1a', { roughness: 0.08, metalness: 0.9 }),
  glass: solid('#1b2a3d', { roughness: 0.05, metalness: 0.7 }),
  canvas: solid('#2a2a2e', { roughness: 0.9 }),
  sand: solid('#3f4a3a', { roughness: 0.95 }),
  wood: WOOD,
  paper: solid('#f7f4ec', { roughness: 0.9 }),
  red: solid('#d23a3a', { roughness: 0.6 }),
  diffuse: glow('#fff6e6', 1.1),
  ring: glow('#ffffff', 2.6),
  led: glow('#fff2d9', 1.6),
  tally: glow('#ff2b2b', 2.4),
};

const cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// a rod from a to b ([x, y, z] in the group's frame)
export function rod(a, b, r, mat, seg = 6) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const m = mesh(cyl(r, r, A.distanceTo(B), seg), mat, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize());
  return m;
}

// ---------- stands ----------
// three splayed legs up to a collar, with a centre column to `h`
export function tripod(h = 1.4, { spread = 0.42, mat = M.black, collar = 0.75 } = {}) {
  const g = new THREE.Group();
  const top = Math.min(collar, h - 0.15);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
    g.add(rod([0, top, 0], [Math.cos(a) * spread, 0.02, Math.sin(a) * spread], 0.014, mat));
    // a rubber foot and a spreader strut
    g.add(mesh(new THREE.SphereGeometry(0.025, 6, 4), M.rubber, Math.cos(a) * spread, 0.02, Math.sin(a) * spread, false));
    g.add(rod([0, top * 0.35, 0], [Math.cos(a) * spread * 0.62, top * 0.38, Math.sin(a) * spread * 0.62], 0.007, M.alu, 4));
  }
  g.add(mesh(cyl(0.03, 0.03, 0.08), mat, 0, top, 0));
  g.add(mesh(cyl(0.016, 0.016, h - top), M.alu, 0, top + (h - top) / 2, 0));
  return g;
}
// a C-stand: a turtle base (one leg high so the next stand nests), riser, grip head and arm
export function cStand(h = 2.1, { arm = 0.9 } = {}) {
  const g = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const y = 0.04 + k * 0.09;
    g.add(rod([0, y + 0.08, 0], [Math.cos(a) * 0.48, y, Math.sin(a) * 0.48], 0.012, M.chrome));
  }
  g.add(mesh(cyl(0.02, 0.022, h), M.chrome, 0, h / 2, 0));
  g.add(mesh(cyl(0.03, 0.03, 0.1), M.black, 0, h * 0.55, 0));
  g.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), M.black, 0, h, 0));
  if (arm) g.add(rod([0, h, 0], [0, h + 0.05, arm], 0.012, M.chrome));
  return g;
}
export function sandbag() {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const b = mesh(new THREE.CapsuleGeometry(0.07, 0.16, 3, 8), M.sand, sx * 0.1, 0.07, 0);
    b.rotation.x = Math.PI / 2;
    g.add(b);
  }
  g.add(mesh(box(0.06, 0.02, 0.22), M.black, 0, 0.15, 0, false));
  return g;
}

// ---------- lights ----------
// a ring light on a stand: housing, a glowing ring, a phone clamp in the middle, tilted to the talent
export function ringLight(h = 1.62, { r = 0.24, phone = true } = {}) {
  const g = tripod(h - r, { spread: 0.36 });
  const head = new THREE.Group();
  head.position.y = h;
  // a black housing with the lit diffuser ring across its front face
  head.add(mesh(new THREE.TorusGeometry(r, 0.034, 8, 40), M.black));
  const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.03, r + 0.03, 40), M.ring);
  ring.position.z = 0.036;
  head.add(ring);
  head.add(mesh(box(0.05, 0.1, 0.05), M.black, 0, -r - 0.03, 0));
  if (phone) {
    head.add(rod([0, -r, 0], [0, 0, 0], 0.008, M.alu, 4));
    head.add(mesh(new RoundedBoxGeometry(0.075, 0.155, 0.01, 2, 0.008), M.graphite, 0, 0, 0.01));
  }
  head.rotation.x = 0.12;
  g.add(head);
  g.userData.head = head;
  return g;
}
// a softbox on a C-stand: a black tapered box with a glowing diffuser face, aimed down at the set
export function softbox(w = 0.9, hgt = 0.65, h = 2.0) {
  const g = cStand(h, { arm: 0 });
  const head = new THREE.Group();
  head.position.y = h + 0.05;
  const bx = new THREE.Mesh(new THREE.CylinderGeometry(Math.SQRT1_2, 0.18, 0.5, 4, 1, true), M.black);
  bx.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  bx.scale.set(w, 1, hgt);
  bx.position.z = 0.25;
  head.add(bx);
  head.add(mesh(box(w, hgt, 0.01), M.diffuse, 0, 0, 0.5, false));
  head.add(mesh(box(0.12, 0.12, 0.16), M.black, 0, 0, -0.05));
  head.rotation.x = 0.2;
  g.add(head);
  g.userData.head = head;
  return g;
}
// a flat LED panel in a yoke on a stand
export function ledPanel(w = 0.6, hgt = 0.35, h = 1.8) {
  const g = cStand(h, { arm: 0 });
  const head = new THREE.Group();
  head.position.y = h + 0.1;
  head.add(mesh(box(w + 0.04, hgt + 0.04, 0.05), M.graphite));
  head.add(mesh(box(w, hgt, 0.01), M.led, 0, 0, 0.03, false));
  head.add(rod([-w / 2 - 0.04, 0, 0], [-w / 2 - 0.04, -hgt / 2 - 0.08, 0], 0.01, M.alu, 4));
  head.add(rod([w / 2 + 0.04, 0, 0], [w / 2 + 0.04, -hgt / 2 - 0.08, 0], 0.01, M.alu, 4));
  head.add(rod([-w / 2 - 0.04, -hgt / 2 - 0.08, 0], [w / 2 + 0.04, -hgt / 2 - 0.08, 0], 0.01, M.alu, 4));
  head.rotation.x = 0.15;
  g.add(head);
  g.userData.head = head;
  return g;
}
// a diffusion frame (white cloth) or a flag (black) on a C-stand arm
export function frameOnStand(w = 1.0, hgt = 1.0, h = 1.6, { flag = false } = {}) {
  const g = cStand(h, { arm: 0 });
  const f = new THREE.Group();
  f.position.y = h + hgt / 2 + 0.05;
  f.add(mesh(box(w, hgt, 0.01), flag ? M.black : solid('#fbfaf6', { roughness: 0.9, transparent: true, opacity: 0.85 }), 0, 0, 0, false));
  for (const [a, b] of [[[-w / 2, -hgt / 2, 0], [w / 2, -hgt / 2, 0]], [[-w / 2, hgt / 2, 0], [w / 2, hgt / 2, 0]], [[-w / 2, -hgt / 2, 0], [-w / 2, hgt / 2, 0]], [[w / 2, -hgt / 2, 0], [w / 2, hgt / 2, 0]]]) f.add(rod(a, b, 0.012, M.chrome, 4));
  g.add(f);
  return g;
}
// a round 5-in-1 reflector on a stand, silver side to the talent
export function reflector(r = 0.45, h = 1.2) {
  const g = cStand(h, { arm: 0 });
  const d = mesh(new THREE.CircleGeometry(r, 24), solid('#e9ebee', { metalness: 0.35, roughness: 0.45, side: THREE.DoubleSide }), 0, h + r, 0, false);
  d.rotation.x = -0.25;
  g.add(d);
  const rim = mesh(new THREE.TorusGeometry(r, 0.012, 4, 24), M.black, 0, h + r, 0, false);
  rim.rotation.x = -0.25;
  g.add(rim);
  return g;
}

// ---------- cameras and sound ----------
// a phone in portrait on a tripod: the lenses face the talent (+z), the screen faces the operator
export function phoneRig(screenMat, h = 1.45) {
  const g = tripod(h - 0.12, { spread: 0.3 });
  const head = new THREE.Group();
  head.position.y = h;
  head.add(mesh(box(0.05, 0.06, 0.05), M.black, 0, -0.1, 0));
  head.add(mesh(box(0.13, 0.025, 0.02), M.black, 0, -0.078, 0));
  const ph = new THREE.Group();
  ph.add(mesh(new RoundedBoxGeometry(0.1, 0.205, 0.012, 2, 0.01), M.graphite));
  // the camera island: three lenses and a flash on the back
  ph.add(mesh(new RoundedBoxGeometry(0.046, 0.046, 0.006, 2, 0.006), M.black, -0.022, 0.07, 0.008, false));
  for (const [x, y] of [[-0.031, 0.08], [-0.013, 0.08], [-0.022, 0.061]]) {
    const l = mesh(cyl(0.0085, 0.0085, 0.006, 12), M.lens, x, y, 0.012, false);
    l.rotation.x = Math.PI / 2;
    ph.add(l);
  }
  if (screenMat) {
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.19), screenMat);
    sc.position.z = -0.0065;
    sc.rotation.y = Math.PI;
    ph.add(sc);
  }
  // a stylised size: phones read at a few metres
  ph.scale.setScalar(1.6);
  head.add(ph);
  g.add(head);
  g.userData.head = head;
  return g;
}
// a cinema camera on a fluid head: body, big lens, matte box, follow focus, top handle, side monitor,
// eyepiece and a pan bar; head.pan / head.tilt turn it. The lens looks down +z.
export function cinemaCamera(monitorMat, h = 1.4) {
  const g = tripod(h - 0.2, { spread: 0.55, mat: M.graphite, collar: 0.95 });
  // a spreader on the ground between the legs
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
    g.add(rod([0, 0.05, 0], [Math.cos(a) * 0.55, 0.04, Math.sin(a) * 0.55], 0.01, M.alu, 4));
  }
  const pan = new THREE.Group();
  pan.position.y = h - 0.12;
  g.add(pan);
  pan.add(mesh(cyl(0.08, 0.09, 0.12, 16), M.black));
  const tilt = new THREE.Group();
  tilt.position.y = 0.08;
  pan.add(tilt);
  // body and battery
  tilt.add(mesh(new RoundedBoxGeometry(0.17, 0.2, 0.32, 2, 0.02), M.graphite, 0, 0.12, -0.02));
  tilt.add(mesh(box(0.15, 0.13, 0.08), M.black, 0, 0.11, -0.22));
  // lens: barrel, focus and zoom rings, front glass
  const lens = new THREE.Group();
  lens.position.set(0, 0.12, 0.14);
  lens.rotation.x = Math.PI / 2;
  lens.add(mesh(cyl(0.055, 0.06, 0.26, 18), M.black, 0, 0.13, 0));
  for (const y of [0.07, 0.15]) lens.add(mesh(cyl(0.064, 0.064, 0.035, 18), M.graphite, 0, y, 0));
  lens.add(mesh(cyl(0.05, 0.05, 0.005, 18), M.lens, 0, 0.262, 0, false));
  tilt.add(lens);
  // matte box: a flared hood with flags
  const mb = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.16, 4, 1, true), M.black);
  mb.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  mb.position.set(0, 0.12, 0.47);
  tilt.add(mb);
  tilt.add(mesh(box(0.24, 0.01, 0.12), M.black, 0, 0.245, 0.5));
  // rails, follow focus wheel, top handle, eyepiece, side monitor
  for (const sx of [-1, 1]) tilt.add(rod([sx * 0.04, 0.0, -0.12], [sx * 0.04, 0.0, 0.42], 0.008, M.alu, 6));
  const ff = mesh(cyl(0.045, 0.045, 0.02, 16), M.graphite, -0.1, 0.08, 0.23);
  ff.rotation.z = Math.PI / 2;
  tilt.add(ff);
  tilt.add(rod([0, 0.24, -0.1], [0, 0.24, 0.08], 0.012, M.black, 6));
  tilt.add(rod([0, 0.22, -0.1], [0, 0.24, -0.1], 0.012, M.black, 6));
  tilt.add(rod([0, 0.22, 0.08], [0, 0.24, 0.08], 0.012, M.black, 6));
  const eye = mesh(cyl(0.025, 0.03, 0.09, 10), M.black, -0.06, 0.16, -0.21);
  eye.rotation.x = Math.PI / 2;
  tilt.add(eye);
  const mon = new THREE.Group();
  mon.position.set(0.17, 0.2, 0.0);
  mon.rotation.y = -0.6;
  mon.add(mesh(box(0.2, 0.13, 0.025), M.black));
  if (monitorMat) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.11), monitorMat);
    s.position.z = -0.0135;
    s.rotation.y = Math.PI;
    mon.add(s);
  }
  tilt.add(mon);
  // a red tally light that shows when rolling
  const tally = mesh(new THREE.SphereGeometry(0.012, 6, 4), M.tally, 0.06, 0.23, 0.12, false);
  tilt.add(tally);
  // the pan bar reaching back to the operator's right hand
  tilt.add(rod([0.05, 0.0, -0.05], [0.28, -0.08, -0.62], 0.012, M.alu, 6));
  const grip = mesh(cyl(0.018, 0.018, 0.12, 8), M.rubber, 0.29, -0.085, -0.66);
  grip.rotation.x = Math.PI / 2.4;
  tilt.add(grip);
  for (const o of [pan, tilt, tally]) o.userData.dynamic = true;
  pan.traverse((o) => (o.userData.noFit = true));
  g.userData.pan = pan;
  g.userData.tilt = tilt;
  g.userData.tally = tally;
  return g;
}
// a boom pole from the operator's hands out to a zeppelin mic (the pole runs along +z, rising)
export function boomPole(len = 3.2, rise = 0.95) {
  const g = new THREE.Group();
  const end = [0, rise, len];
  g.add(rod([0, 0, -0.3], end, 0.016, M.graphite, 8));
  g.add(rod([0, -0.03, -0.32], [0, -0.06, -0.55], 0.01, M.black, 4)); // the cable tail
  const mic = new THREE.Group();
  mic.position.set(end[0], end[1] - 0.12, end[2]);
  const z = mesh(new THREE.CapsuleGeometry(0.045, 0.32, 4, 10), solid('#3b3d42', { roughness: 1 }));
  z.rotation.x = Math.PI / 2 - 0.5; // aimed down at the talent
  mic.add(z);
  mic.add(rod([0, 0.12, 0], [0, 0, 0], 0.008, M.black, 4));
  g.add(mic);
  g.traverse((o) => (o.userData.noFit = true));
  return g;
}
// a clapperboard: slate with clap sticks; userData.stick hinges open (rotation.z)
export function clapperboard() {
  const g = new THREE.Group();
  const slate = canvasTexture(256, 200, (c, w, h) => {
    c.fillStyle = '#1b1c1f';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#f2f2f2';
    c.lineWidth = 3;
    for (const y of [70, 120, 160]) {
      c.beginPath();
      c.moveTo(10, y);
      c.lineTo(w - 10, y);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(w / 2, 120);
    c.lineTo(w / 2, 200);
    c.stroke();
    c.fillStyle = '#f2f2f2';
    c.font = '700 26px Inter, sans-serif';
    c.fillText('SCENE', 16, 108);
    c.fillText('TAKE', w / 2 + 12, 150);
    c.fillText('ROLL', 16, 150);
  });
  g.add(mesh(box(0.28, 0.22, 0.012), M.black));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.21), new THREE.MeshStandardMaterial({ map: slate, roughness: 0.6 }));
  face.position.z = 0.0065;
  g.add(face);
  const stripes = canvasTexture(256, 32, (c, w, h) => {
    for (let k = 0; k < 8; k++) {
      c.fillStyle = k % 2 ? '#111' : '#f4f4f4';
      c.beginPath();
      c.moveTo(k * 32, 0);
      c.lineTo(k * 32 + 32, 0);
      c.lineTo(k * 32 + 16, h);
      c.lineTo(k * 32 - 16, h);
      c.fill();
    }
  });
  const stickMat = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.5 });
  g.add(mesh(box(0.28, 0.035, 0.014), stickMat, 0, 0.13, 0, false));
  const hinge = new THREE.Group();
  hinge.position.set(-0.14, 0.15, 0);
  hinge.add(mesh(box(0.28, 0.035, 0.014), stickMat, 0.14, 0.02, 0, false));
  hinge.userData.dynamic = true;
  g.add(hinge);
  g.userData.stick = hinge;
  return g;
}

// ---------- kit on the ground ----------
export function hardCase(w = 0.6, h = 0.3, d = 0.4) {
  const g = new THREE.Group();
  g.add(mesh(new RoundedBoxGeometry(w, h, d, 2, 0.03), M.black, 0, h / 2, 0));
  g.add(mesh(box(w + 0.01, 0.03, d + 0.01), M.alu, 0, h * 0.6, 0, false));
  for (const sx of [-1, 1]) g.add(mesh(box(0.05, 0.04, 0.02), M.chrome, sx * w * 0.25, h * 0.6, d / 2 + 0.01, false));
  return g;
}
export function cableCoil(r = 0.22, color = '#141518') {
  const g = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const t = mesh(new THREE.TorusGeometry(r - k * 0.02, 0.012, 4, 24), solid(color, { roughness: 0.8 }), k * 0.01, 0.015 + k * 0.012, 0, false);
    t.rotation.x = Math.PI / 2;
    g.add(t);
  }
  return g;
}
// a cable lying along the ground through the given points (kept out of walking lines by the caller)
export function cableRun(points, color = '#141518') {
  const g = new THREE.Group();
  for (let k = 0; k < points.length - 1; k++) g.add(rod([points[k][0], 0.015, points[k][1]], [points[k + 1][0], 0.015, points[k + 1][1]], 0.011, solid(color, { roughness: 0.8 }), 5));
  g.traverse((o) => (o.castShadow = false));
  return g;
}
// a two-shelf equipment cart on casters, with some kit on it
export function cart(w = 0.9, d = 0.5, h = 0.9) {
  const g = new THREE.Group();
  for (const y of [0.25, h]) g.add(mesh(box(w, 0.03, d), M.graphite, 0, y, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(mesh(cyl(0.015, 0.015, h - 0.08), M.alu, (x * (w - 0.04)) / 2, h / 2 + 0.04, (z * (d - 0.04)) / 2));
    g.add(mesh(new THREE.SphereGeometry(0.04, 6, 4), M.rubber, (x * (w - 0.08)) / 2, 0.04, (z * (d - 0.08)) / 2, false));
  }
  g.add(rod([-w / 2, h + 0.18, -d / 2], [w / 2, h + 0.18, -d / 2], 0.012, M.alu, 6));
  g.add(hardCase(0.36, 0.14, 0.26).translateX(-0.2).translateY(h + 0.015));
  g.add(mesh(box(0.22, 0.12, 0.16), M.black, 0.22, h + 0.075, 0));
  g.add(hardCase(0.5, 0.18, 0.36).translateY(0.265));
  return g;
}
// a folding table at standing or sitting height
export function table(w = 1.4, d = 0.7, h = 0.75, top = M.white) {
  const g = new THREE.Group();
  g.add(mesh(box(w, 0.04, d), top, 0, h - 0.02, 0));
  for (const sx of [-1, 1]) {
    g.add(rod([sx * (w / 2 - 0.08), 0, -d / 2 + 0.06], [sx * (w / 2 - 0.08), h - 0.04, d / 2 - 0.06], 0.014, M.alu, 6));
    g.add(rod([sx * (w / 2 - 0.08), 0, d / 2 - 0.06], [sx * (w / 2 - 0.08), h - 0.04, -d / 2 + 0.06], 0.014, M.alu, 6));
  }
  return g;
}
// a director's chair: crossed legs, canvas seat and back
export function directorChair(color = '#2a2a2e') {
  const g = new THREE.Group();
  const cm = solid(color, { roughness: 0.9 });
  for (const sx of [-1, 1]) {
    g.add(rod([sx * 0.24, 0, -0.22], [sx * 0.24, 0.45, 0.2], 0.014, WOOD, 5));
    g.add(rod([sx * 0.24, 0, 0.2], [sx * 0.24, 0.45, -0.22], 0.014, WOOD, 5));
    g.add(rod([sx * 0.24, 0.45, -0.22], [sx * 0.24, 0.9, -0.24], 0.014, WOOD, 5));
    g.add(rod([sx * 0.24, 0.62, -0.2], [sx * 0.24, 0.62, 0.18], 0.014, WOOD, 5));
  }
  g.add(mesh(box(0.46, 0.02, 0.4), cm, 0, 0.45, 0));
  g.add(mesh(box(0.46, 0.18, 0.015), cm, 0, 0.78, -0.24));
  return g;
}
export function stool(h = 0.48, color = '#2c3037') {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.19, 0.19, 0.05, 14), solid(color, { roughness: 0.6 }), 0, h, 0));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    g.add(rod([0, h, 0], [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], 0.012, M.alu, 5));
  }
  return g;
}
// a laptop, open, its screen facing -z (towards whoever sits at +z... turned by the caller)
export function laptop(screenMat, tilt = -0.25) {
  const g = new THREE.Group();
  g.add(mesh(box(0.34, 0.015, 0.23), M.alu, 0, 0.0075, 0));
  const lid = new THREE.Group();
  lid.position.set(0, 0.015, -0.11);
  lid.rotation.x = tilt;
  lid.add(mesh(box(0.34, 0.22, 0.008), M.alu, 0, 0.11, 0));
  if (screenMat) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.19), screenMat);
    s.position.set(0, 0.11, 0.005);
    lid.add(s);
  }
  g.add(lid);
  return g;
}
// a monitor on a foot, screen facing +z
export function deskMonitor(screenMat, w = 0.56, h = 0.33) {
  const g = new THREE.Group();
  g.add(mesh(box(0.2, 0.012, 0.14), M.graphite, 0, 0.006, 0));
  g.add(mesh(box(0.035, 0.14, 0.02), M.graphite, 0, 0.08, -0.02));
  g.add(mesh(box(w + 0.02, h + 0.02, 0.025), M.black, 0, 0.12 + h / 2, -0.01));
  if (screenMat) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), screenMat);
    s.position.set(0, 0.12 + h / 2, 0.004);
    g.add(s);
  }
  return g;
}
// a stack of printed pages, slightly fanned
export function papers(n = 4, w = 0.21, d = 0.297) {
  const g = new THREE.Group();
  for (let k = 0; k < n; k++) {
    const p = mesh(box(w, 0.002, d), M.paper, k * 0.012, 0.002 * k, k * 0.008, false);
    p.rotation.y = (k - n / 2) * 0.06;
    g.add(p);
  }
  return g;
}
// over-ear headphones lying on a table
export function headphones() {
  const g = new THREE.Group();
  const band = mesh(new THREE.TorusGeometry(0.08, 0.008, 4, 16, Math.PI), M.black, 0, 0.02, 0, false);
  band.rotation.x = -Math.PI / 2;
  g.add(band);
  for (const sx of [-1, 1]) g.add(mesh(cyl(0.035, 0.035, 0.03, 12), M.black, sx * 0.08, 0.02, 0, false));
  return g;
}
export function cup(color = '#ffffff') {
  return mesh(cyl(0.04, 0.034, 0.1, 10), solid(color, { roughness: 0.5 }), 0, 0.05, 0, false);
}
