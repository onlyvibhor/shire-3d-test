// The environment kit for the island's arenas and places.
//
// One design language, many compositions: every department arena is described as data (where
// its gateway, hero exhibit, secondary boards, landmark, workspace, homes, people, planting and
// furniture go), and built from the same small set of parts. Repositioning or re-art-directing an
// arena means editing its entry in ARENAS, not the scene code.
//
// Local frame of an arena: origin at the plaza centre, +Z points back down the spoke towards the
// tree (where visitors arrive from), +X is on their right as they walk in. The ring road leaves
// the plaza at ±60° from +Z, so the free ground is the back (120°–240°) and the side wedges.
// Positions are written as polar [degrees from +Z, clockwise; metres] with P().
import * as THREE from 'three';
import { archSlab, cuspedArchPoints, pathFrom, makeChhatri, LIME } from './jaipur.js';
import { solid, mesh, canvasTexture, nightGlow, WHITE_METAL, BRUSHED, DARK } from './materials.js';
import { FONT, fit } from './type.js';

export const P = (deg, r) => {
  const a = THREE.MathUtils.degToRad(deg);
  return [+(Math.sin(a) * r).toFixed(2), +(Math.cos(a) * r).toFixed(2)];
};
export const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

// ---------- design tokens ----------
// The avatar is ~1.75 m tall and ~0.55 m wide: spokes are ~8 avatars wide, the ring ~6.5, lanes
// ~5; gateways open at ≥ 2.6 avatar heights; hero exhibits read from the plaza edge, secondary
// boards from a few steps away.
export const TOKENS = {
  avatar: { h: 1.75, w: 0.55 },
  stone: { pink: '#ebb9a8', blush: '#f1cdbf', lime: '#f6efe2', ochre: '#efc27a', white: '#f4f2ee' },
  ink: '#2a1d14',
  brass: '#c9a24a',
  hero: 1.55, // billboard scale for the featured project
  board: 1.05, // and for the rest
};
const M = {
  pink: solid(TOKENS.stone.pink, { roughness: 0.82 }),
  blush: solid(TOKENS.stone.blush, { roughness: 0.82 }),
  lime: solid(TOKENS.stone.lime, { roughness: 0.75 }),
  ochre: solid(TOKENS.stone.ochre, { roughness: 0.8 }),
  white: solid(TOKENS.stone.white, { roughness: 0.6 }),
  soil: solid('#6d5236', { roughness: 1 }),
  brass: solid(TOKENS.brass, { metalness: 0.55, roughness: 0.35 }),
  bronze: solid('#3b342e', { metalness: 0.4, roughness: 0.5 }),
  leaf: solid('#4c9a37', { roughness: 0.8, flatShading: true }),
  leafDark: solid('#3a7d2c', { roughness: 0.8, flatShading: true }),
  hedge: solid('#55a03c', { roughness: 0.85 }),
};
const lanternGlow = nightGlow(new THREE.MeshStandardMaterial({ color: '#fff1cf', emissive: '#ffc874', emissiveIntensity: 0.55 }));
const stoneMat = (k) => M[k] || M.pink;

// ---------- signage ----------
// Level 1: the department's name, carved into the gateway frieze. Level 2: project plates (on the
// boards themselves). Level 3: fingerposts at junctions and arrival points (makeFingerpost).
const plaqueCache = {};
export function plaqueTexture(title, sub, color) {
  const key = title + sub + color;
  return (plaqueCache[key] ||= canvasTexture(1400, 300, (c, w, h) => {
    c.fillStyle = '#f7f1e6';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = color;
    c.lineWidth = 10;
    c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = color;
    c.fillRect(40, h / 2 - 3, 70, 6);
    c.fillRect(w - 110, h / 2 - 3, 70, 6);
    c.fillStyle = TOKENS.ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    fit(c, title.toUpperCase(), { weight: 800, size: 120, min: 60, family: FONT.display, maxW: w - 300 });
    c.fillText(title.toUpperCase(), w / 2, h * 0.43);
    if (sub) {
      c.fillStyle = color;
      fit(c, sub.toUpperCase(), { weight: 500, size: 40, min: 24, family: FONT.mono, maxW: w - 300 });
      c.fillText(sub.toUpperCase(), w / 2, h * 0.79);
    }
  }));
}

// ---------- the gateway ----------
// A pol in the house style: a deep sandstone mass with a cusped arch, a lime outline and a
// recessed inner frame on both faces, pilasters, a cornice and kangura merlons, and the name on
// the frieze. Variants change the flanks: round bastions with chhatris, square pylons with
// jharokhas, pierced jaali screens, or twin slender minarets.
export function makeGateway({ name, sub = '', color = '#2f6bff', variant = 'bastion', w = 11, h = 8.4, a = 2.45, spring = 3.6, depth = 2.2, stone = 'pink' } = {}) {
  const g = new THREE.Group();
  g.name = 'gateway';
  const wall = stoneMat(stone);
  const trim = stone === 'lime' || stone === 'white' ? M.blush : M.lime;
  g.add(archSlab(w, h, a, spring, depth, wall));
  // lime outline and a recessed second frame round the opening, front and back
  const ring = (outer, inner) => {
    const s = pathFrom(cuspedArchPoints(outer, spring + (outer - a) * 0.4, 7, 0.16), THREE.Shape);
    s.holes.push(pathFrom(cuspedArchPoints(inner, spring + (inner - a) * 0.4, 7, 0.16)));
    return new THREE.ShapeGeometry(s, 4);
  };
  const rimGeo = ring(a + 0.24, a);
  const revealGeo = ring(a + 0.6, a + 0.32);
  for (const side of [1, -1]) {
    const z = side * (depth / 2 + 0.012);
    const rim = new THREE.Mesh(rimGeo, trim);
    rim.position.z = z;
    if (side < 0) rim.rotation.y = Math.PI;
    const rev = new THREE.Mesh(revealGeo, solid(color, { roughness: 0.6 }));
    rev.position.z = z + side * 0.004;
    if (side < 0) rev.rotation.y = Math.PI;
    g.add(rim, rev);
    // pilasters either side of the opening, standing proud of the face
    for (const sx of [-1, 1]) {
      g.add(mesh(new THREE.BoxGeometry(0.5, spring + 0.6, 0.22), trim, sx * (a + 1.25), (spring + 0.6) / 2, side * (depth / 2 + 0.1)));
      g.add(mesh(new THREE.BoxGeometry(0.72, 0.2, 0.34), trim, sx * (a + 1.25), spring + 0.7, side * (depth / 2 + 0.14)));
    }
  }
  // plinth, cornice and merlons
  g.add(mesh(new THREE.BoxGeometry(w + 0.4, 0.5, depth + 0.4), trim, 0, 0.25, 0));
  g.add(mesh(new THREE.BoxGeometry(w + 0.6, 0.32, depth + 0.6), trim, 0, h + 0.16, 0));
  for (let x = -w / 2 + 0.35; x <= w / 2 - 0.3; x += 0.78) {
    g.add(mesh(new THREE.BoxGeometry(0.42, 0.42, depth + 0.1), wall, x, h + 0.53, 0));
    g.add(mesh(new THREE.ConeGeometry(0.24, 0.32, 4), wall, x, h + 0.9, 0).rotateY(Math.PI / 4));
  }
  // the name on the frieze, both faces
  // a cusped arch peaks at about spring + 1.33a; the frieze starts above the coloured reveal
  const revealTop = spring + 0.24 + (a + 0.6) * 1.36;
  const plH = Math.max(0.7, Math.min(1.45, h - revealTop - 0.15));
  const plW = Math.min(w - 1.2, plH * 6.6);
  const tex = plaqueTexture(name, sub, color);
  for (const side of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(plW, plH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
    pl.position.set(0, (revealTop + h) / 2 + 0.02, side * (depth / 2 + 0.03));
    if (side < 0) pl.rotation.y = Math.PI;
    pl.userData.decor = false;
    g.add(pl);
  }
  // the flanks
  const colliders = [];
  for (let x = a + 0.5; x <= w / 2; x += 0.9) for (const sx of [-1, 1]) colliders.push([sx * x, 0, 0.6]);
  for (const sx of [-1, 1]) {
    const fx = sx * (w / 2 + 1.05);
    if (variant === 'bastion') {
      g.add(mesh(new THREE.CylinderGeometry(1.15, 1.35, h + 0.6, 20), wall, fx, (h + 0.6) / 2, 0));
      g.add(mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.3, 20), trim, fx, h + 0.75, 0));
      g.add(mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.3, 20), trim, fx, 0.15, 0));
      const c = makeChhatri(1.05, TOKENS.stone.lime);
      c.position.set(fx, h + 0.9, 0);
      g.add(c);
      colliders.push([fx, 0, 1.4]);
    } else if (variant === 'pylon') {
      const ph = h + 1.4;
      g.add(mesh(new THREE.BoxGeometry(1.9, ph, depth + 0.5), wall, fx, ph / 2, 0));
      g.add(mesh(new THREE.BoxGeometry(2.1, 0.3, depth + 0.7), trim, fx, ph + 0.15, 0));
      // a jharokha balcony on the approach face
      const jz = depth / 2 + 0.25 + 0.4;
      g.add(mesh(new THREE.BoxGeometry(1.3, 0.16, 0.8), trim, fx, h * 0.55, jz - 0.15));
      g.add(mesh(new THREE.BoxGeometry(1.0, 1.0, 0.08), solid(color, { roughness: 0.5 }), fx, h * 0.55 + 0.62, jz - 0.5));
      const jc = makeChhatri(0.6, TOKENS.stone.lime);
      jc.position.set(fx, h * 0.55 + 1.2, jz - 0.15);
      g.add(jc);
      const top = makeChhatri(0.85, TOKENS.stone.lime);
      top.position.set(fx, ph + 0.3, 0);
      g.add(top);
      colliders.push([fx, 0, 1.3]);
    } else if (variant === 'screen') {
      // pierced jaali screens stepping down from the gate, with chhatri finials on the posts
      const jw = 3.4;
      const jh = 2.6;
      const jaali = new THREE.Mesh(new THREE.PlaneGeometry(jw, jh), jaaliMat(color));
      jaali.position.set(sx * (w / 2 + jw / 2 + 0.1), jh / 2 + 0.35, 0);
      g.add(jaali);
      g.add(mesh(new THREE.BoxGeometry(jw + 0.3, 0.35, 0.5), trim, sx * (w / 2 + jw / 2 + 0.1), 0.17, 0));
      g.add(mesh(new THREE.BoxGeometry(jw + 0.3, 0.18, 0.4), trim, sx * (w / 2 + jw / 2 + 0.1), jh + 0.44, 0));
      const px = sx * (w / 2 + jw + 0.35);
      g.add(mesh(new THREE.BoxGeometry(0.5, jh + 0.9, 0.5), wall, px, (jh + 0.9) / 2, 0));
      const c = makeChhatri(0.45, TOKENS.stone.lime);
      c.position.set(px, jh + 0.9, 0);
      g.add(c);
      for (let x = w / 2 + 0.4; x <= w / 2 + jw + 0.4; x += 0.9) colliders.push([sx * x, 0, 0.45]);
    } else if (variant === 'twin') {
      const mh = h + 3.6;
      g.add(mesh(new THREE.CylinderGeometry(0.42, 0.55, mh, 14), wall, fx * 0.96, mh / 2, 0));
      for (const y of [h * 0.5, h + 0.4]) g.add(mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.16, 14), trim, fx * 0.96, y, 0));
      const cap = makeChhatri(0.7, TOKENS.stone.white);
      cap.position.set(fx * 0.96, mh, 0);
      g.add(cap);
      colliders.push([fx * 0.96, 0, 0.7]);
    }
  }
  return { g, colliders, opening: a };
}

const jaaliCache = {};
function jaaliMat(color) {
  return (jaaliCache[color] ||= (() => {
    const t = canvasTexture(256, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = TOKENS.stone.lime;
      c.fillRect(0, 0, w, h);
      // an eight-pointed star lattice, cut out
      c.globalCompositeOperation = 'destination-out';
      const n = 4;
      const s = w / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const cx = i * s + s / 2;
          const cy = j * s + s / 2;
          c.beginPath();
          for (let k = 0; k < 16; k++) {
            const r = k % 2 ? s * 0.2 : s * 0.4;
            const a = (k / 16) * Math.PI * 2;
            c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }
          c.fill();
        }
      c.globalCompositeOperation = 'source-over';
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2.4, 1.8);
    return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.75, color: new THREE.Color('#ffffff').lerp(new THREE.Color(color), 0.08) });
  })());
}

// ---------- exhibits ----------
// The featured project stands in a carved frame: sandstone pilasters, a cornice with a scalloped
// valance and two little chhatris, on a stepped plinth with a planting bed in front.
export function makeExhibitFrame(W, H, lift, color, stone = 'pink') {
  const g = new THREE.Group();
  const wall = stoneMat(stone);
  const half = W / 2 + 0.55;
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.62, lift + H + 0.9, 0.62), wall, sx * half, (lift + H + 0.9) / 2, -0.05));
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.22, 0.8), M.lime, sx * half, lift + H + 1.0, -0.05));
    const c = makeChhatri(0.5, TOKENS.stone.lime);
    c.position.set(sx * half, lift + H + 1.1, -0.05);
    g.add(c);
  }
  g.add(mesh(new THREE.BoxGeometry(W + 1.9, 0.34, 0.75), M.lime, 0, lift + H + 0.6, -0.05));
  g.add(mesh(new THREE.BoxGeometry(W + 1.5, 0.08, 0.06), solid(color, { roughness: 0.5 }), 0, lift + H + 0.4, 0.33));
  // stepped plinth
  g.add(mesh(new THREE.BoxGeometry(W + 2.2, 0.28, 1.6), wall, 0, 0.14, 0.15));
  g.add(mesh(new THREE.BoxGeometry(W + 1.6, 0.22, 1.1), M.lime, 0, 0.39, 0.05));
  return g;
}

// ---------- the plaza floor ----------
// A chowk inlay in the department's colour: a sandstone ring, a lime band, radiating petals and a
// small central star. It breaks up the bright paving and gives each plaza its own floor.
const inlayCache = {};
export function inlayTexture(color) {
  return (inlayCache[color] ||= canvasTexture(1024, 1024, (c, w) => {
    const cx = w / 2;
    c.clearRect(0, 0, w, w);
    const ring = (r0, r1, fill) => {
      c.beginPath();
      c.arc(cx, cx, r1, 0, Math.PI * 2);
      c.arc(cx, cx, r0, 0, Math.PI * 2, true);
      c.fillStyle = fill;
      c.fill();
    };
    ring(470, 505, TOKENS.stone.pink);
    ring(452, 466, color);
    ring(300, 316, TOKENS.stone.pink);
    // sixteen petals between the rings
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      c.save();
      c.translate(cx + Math.cos(a) * 385, cx + Math.sin(a) * 385);
      c.rotate(a);
      c.beginPath();
      c.ellipse(0, 0, 62, 22, 0, 0, Math.PI * 2);
      c.fillStyle = k % 2 ? TOKENS.stone.pink : color;
      c.globalAlpha = k % 2 ? 0.9 : 0.55;
      c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
    // an eight-pointed star in the middle
    c.beginPath();
    for (let k = 0; k < 16; k++) {
      const r = k % 2 ? 70 : 150;
      const a = (k / 16) * Math.PI * 2;
      c.lineTo(cx + Math.cos(a) * r, cx + Math.sin(a) * r);
    }
    c.closePath();
    c.fillStyle = color;
    c.globalAlpha = 0.45;
    c.fill();
    c.globalAlpha = 1;
  }));
}
export function makeInlay(radius, color) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshStandardMaterial({ map: inlayTexture(color), transparent: true, depthWrite: false, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.receiveShadow = true;
  m.userData.decor = true;
  return m;
}

// ---------- street furniture ----------
export function makeLantern(h = 3.1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.35, 8), M.lime, 0, 0.17, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, h, 8), M.bronze, 0, h / 2 + 0.3, 0));
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), M.bronze, 0, h + 0.3, 0));
  const lamp = mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.42, 6), lanternGlow, 0, h + 0.55, 0, false);
  g.add(lamp);
  const cap = makeChhatri(0.32, TOKENS.stone.lime);
  cap.position.y = h + 0.74;
  g.add(cap);
  return g;
}
export function makeBench() {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.34, 0.42, 0.5), M.pink, sx * 0.75, 0.21, 0));
  g.add(mesh(new THREE.BoxGeometry(2.0, 0.12, 0.6), M.lime, 0, 0.48, 0));
  g.add(mesh(new THREE.BoxGeometry(2.0, 0.42, 0.1), M.lime, 0, 0.78, -0.28));
  return g;
}
// a low stone-kerbed bed: shrubs, a few flowering clumps, the odd small tree; palettes keep the
// colour intentional (warm, cool, white or green-only)
const PALETTES = {
  warm: ['#ff8f3a', '#ffc73a', '#e8505b'],
  cool: ['#b18cf0', '#7aa7ff', '#ffffff'],
  white: ['#ffffff', '#f7e6ff', '#fff3c4'],
  pink: ['#ff7fb1', '#ffd1e3', '#ffffff'],
  green: [],
};
export function makeBed(w, d, palette = 'warm', seed = 1, { tree = false } = {}) {
  const g = new THREE.Group();
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.add(mesh(new THREE.BoxGeometry(w, 0.32, d), M.lime, 0, 0.16, 0));
  g.add(mesh(new THREE.BoxGeometry(w - 0.24, 0.06, d - 0.24), M.soil, 0, 0.33, 0, false));
  const shrubs = Math.max(2, Math.round((w * d) / 1.6));
  for (let k = 0; k < shrubs; k++) {
    const r = 0.28 + rnd() * 0.28;
    const m = mesh(new THREE.IcosahedronGeometry(r, 0), rnd() < 0.5 ? M.leaf : M.leafDark, (rnd() - 0.5) * (w - 0.7), 0.36 + r * 0.7, (rnd() - 0.5) * (d - 0.7));
    m.scale.y = 0.8;
    g.add(m);
  }
  const cols = PALETTES[palette] || [];
  if (cols.length) {
    const clumps = Math.round((w * d) / 1.1);
    for (let k = 0; k < clumps; k++) {
      const col = cols[Math.floor(rnd() * cols.length)];
      const cx = (rnd() - 0.5) * (w - 0.6);
      const cz = (rnd() - 0.5) * (d - 0.6);
      for (let j = 0; j < 3; j++) g.add(mesh(new THREE.IcosahedronGeometry(0.11, 0), solid(col, { roughness: 0.6 }), cx + (rnd() - 0.5) * 0.35, 0.62 + rnd() * 0.25, cz + (rnd() - 0.5) * 0.35, false));
    }
  }
  if (tree) {
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.8, 6), solid('#6e5038'), 0, 1.2, 0));
    const crown = mesh(new THREE.IcosahedronGeometry(1.0, 1), M.leafDark, 0, 2.6, 0);
    crown.scale.set(1, 0.85, 1);
    g.add(crown);
  }
  return g;
}
export function makeLowWall(len, h = 0.9, stone = 'pink') {
  const g = new THREE.Group();
  const wall = stoneMat(stone);
  g.add(mesh(new THREE.BoxGeometry(len, h, 0.45), wall, 0, h / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(len + 0.1, 0.12, 0.6), M.lime, 0, h + 0.06, 0));
  for (let x = -len / 2 + 0.3; x <= len / 2 - 0.25; x += 0.9) g.add(mesh(new THREE.BoxGeometry(0.34, 0.26, 0.4), wall, x, h + 0.25, 0));
  return g;
}
// a seating pavilion: a raised plinth, four columns, a chhatri roof; benches inside
export function makePavilion(s = 1.6) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2.9 * s, 0.4, 2.9 * s), M.pink, 0, 0.2, 0));
  g.add(mesh(new THREE.BoxGeometry(2.6 * s, 0.08, 2.6 * s), M.lime, 0, 0.44, 0));
  const c = makeChhatri(s * 1.1, TOKENS.stone.lime);
  c.position.y = 0.48;
  g.add(c);
  const b = makeBench();
  b.scale.setScalar(0.8);
  b.position.set(0, 0.48, -0.4 * s);
  g.add(b);
  return g;
}
// Level 3 wayfinding: a bronze post with painted arms pointing to places
export function makeFingerpost(entries) {
  const g = new THREE.Group();
  g.name = 'fingerpost';
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.3, 8), M.lime, 0, 0.15, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.3, 8), M.bronze, 0, 1.95, 0));
  const top = makeChhatri(0.3, TOKENS.stone.lime);
  top.position.y = 3.55;
  g.add(top);
  entries.slice(0, 4).forEach((e, k) => {
    const tex = canvasTexture(640, 128, (c, w, h) => {
      c.fillStyle = '#f7f1e6';
      c.fillRect(0, 0, w, h);
      c.fillStyle = e.color;
      c.fillRect(0, 0, 18, h);
      c.fillStyle = TOKENS.ink;
      c.textBaseline = 'middle';
      fit(c, e.label, { weight: 700, size: 58, min: 30, family: FONT.sans, maxW: w - 110 });
      c.fillText(e.label, 40, h / 2 + 2);
      c.fillStyle = e.color;
      c.font = `700 64px ${FONT.sans}`;
      c.fillText('›', w - 60, h / 2);
    });
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
    const arm = new THREE.Group();
    arm.position.y = 3.05 - k * 0.42;
    // an arm points along its world direction [dx, dz]
    arm.rotation.y = Math.atan2(-e.to[1], e.to[0]);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.32, 0.05), [M.lime, M.lime, M.lime, M.lime, mat, mat]);
    board.position.x = 0.85;
    arm.add(board);
    g.add(arm);
  });
  return g;
}

// ---------- the six department arenas ----------
// gate: gateway parameters · hero / boards: [deg, r, scale?] exhibits · wall: overflow poster wall
// landmark: [x, z, rotY] anchor for the department's activity scene (its sculpture and its people)
// dome, work (monitor wall + desk), homes: [deg, r] · lead: the department lead's spot
// walk: a stroller's loop round the plaza edge · belief: the belief sign outside the gate
// beds: [deg, r, w, d, palette, tree?] · lamps, benches: [deg, r] · walls: [deg, r, len]
// pavilion: [deg, r] · ringGate: lanterns marking where the ring road enters
export const ARENAS = {
  brand: {
    gate: { variant: 'bastion', w: 12, h: 9.5, a: 2.5, spring: 3.7, depth: 2.4, stone: 'pink' },
    hero: [196, 15.2],
    boards: [[142, 13.2], [114, 12.6]],
    landmark: [0, -1, 0],
    dome: [262, 18],
    work: { wall: [96, 16], desk: [86, 12.2] },
    homes: [[222, 20], [160, 20.5]],
    lead: [-3, 6.8],
    walk: [[-6.5, 5.5], [-9, 0], [-6.8, -6]],
    belief: [30, 18.5],
    beds: [[196, 13.1, 6.6, 1.1, 'warm'], [40, 12.6, 3.2, 1.4, 'warm', true], [320, 12.6, 3.2, 1.4, 'cool'], [248, 12.2, 2.6, 1.2, 'green', true]],
    lamps: [[36, 10.3], [324, 10.3], [150, 10.4], [210, 10.4]],
    benches: [[238, 8.6], [128, 8.6]],
    walls: [[176, 19.5, 6]],
  },
  pmm: {
    gate: { variant: 'screen', w: 9.6, h: 9, a: 2.4, spring: 3.4, depth: 1.8, stone: 'lime' },
    hero: [150, 14.8],
    boards: [[212, 13.6], [238, 13]],
    landmark: [0, 0, 0],
    dome: [264, 18.5],
    work: { wall: [104, 15.6], desk: [96, 11.4] },
    homes: [[180, 21], [126, 20]],
    lead: [3, 6.8],
    walk: [[6.5, 5.5], [9, 0], [6.8, -6]],
    belief: [330, 18.5],
    beds: [[150, 12.7, 6.4, 1.1, 'cool'], [36, 12.4, 3, 1.3, 'white', true], [324, 12.4, 3, 1.3, 'cool'], [196, 9.9, 2.4, 1, 'green']],
    lamps: [[36, 10.2], [324, 10.2], [124, 10.4], [236, 10.4]],
    benches: [[200, 8.6], [160, 8.6]],
    walls: [],
  },
  product: {
    gate: { variant: 'pylon', w: 10.4, h: 9.2, a: 2.45, spring: 3.5, depth: 2.2, stone: 'lime' },
    hero: [206, 15.4],
    boards: [[118, 12.8], [96, 13.6]],
    landmark: [0, 0, 0],
    dome: [252, 18],
    work: { wall: [272, 15.6], desk: [262, 11.6] },
    homes: [[166, 20.5], [228, 21]],
    lead: [3.2, 7],
    walk: [[-6.5, 5.5], [-8.8, -1], [-5, -7]],
    belief: [30, 18.5],
    beds: [[206, 13.3, 6.6, 1.1, 'cool'], [40, 12.5, 3, 1.3, 'pink', true], [320, 12.5, 3, 1.3, 'white'], [150, 11.6, 2.4, 1.1, 'green', true]],
    lamps: [[36, 10.3], [324, 10.3], [140, 10.4], [228, 10.4]],
    benches: [[240, 8.8]],
    pavilion: [146, 15.8],
    walls: [],
  },
  social: {
    gate: { variant: 'twin', w: 10, h: 9.1, a: 2.4, spring: 3.5, depth: 2, stone: 'blush' },
    hero: [150, 15],
    boards: [[212, 13.8], [238, 13.2]],
    wall: [112, 15.2],
    landmark: [0, 0, 0],
    dome: [264, 18.5],
    work: { wall: [280, 15.4], desk: [270, 11.4] },
    homes: [[182, 21.5], [130, 21]],
    lead: [-3.2, 6.8],
    walk: [[6.5, 5.5], [8.5, 0.5], [6.5, -6]],
    belief: [330, 18.5],
    beds: [[150, 12.9, 6.4, 1.1, 'pink'], [40, 12.5, 3, 1.3, 'pink', true], [320, 12.5, 3, 1.3, 'white'], [196, 10.2, 2.4, 1, 'pink']],
    lamps: [[36, 10.2], [324, 10.2], [128, 10.3], [232, 10.3]],
    benches: [[160, 8.6]],
    walls: [],
  },
  copy: {
    gate: { variant: 'pylon', w: 11.4, h: 9.5, a: 2.5, spring: 3.7, depth: 2.4, stone: 'ochre' },
    hero: [122, 13.8],
    boards: [[238, 13.8]],
    landmark: [0, 0, 0],
    dome: [180, 21.5],
    work: { wall: [94, 16], desk: [86, 12] },
    homes: [[142, 21], [218, 21]],
    lead: [3, 6.8],
    walk: [[-6.5, 5.5], [-9, 0.5], [-7, -5.5]],
    belief: [30, 18.5],
    beds: [[122, 11.8, 5.4, 1.1, 'warm'], [238, 11.8, 4, 1.1, 'warm'], [40, 12.5, 3, 1.3, 'warm', true], [320, 12.5, 3, 1.3, 'white', true]],
    lamps: [[36, 10.3], [324, 10.3], [160, 10.5], [200, 10.5]],
    benches: [[214, 8.8]],
    // a formal court: low walls closing the back on either side of the bench
    walls: [[152, 17.6, 6], [208, 17.6, 6]],
  },
  mentorship: {
    gate: { variant: 'pylon', w: 11.4, h: 9.5, a: 2.5, spring: 3.7, depth: 2.4, stone: 'blush' },
    hero: [122, 13.8],
    boards: [[238, 13.8]],
    landmark: [0, 0, 0],
    dome: [180, 21.5],
    work: { wall: [94, 16], desk: [86, 12] },
    homes: [[142, 21], [218, 21]],
    lead: [3, 6.8],
    walk: [[-6.5, 5.5], [-9, 0.5], [-7, -5.5]],
    belief: [30, 18.5],
    beds: [[122, 11.8, 5.4, 1.1, 'warm'], [238, 11.8, 4, 1.1, 'warm'], [40, 12.5, 3, 1.3, 'warm', true], [320, 12.5, 3, 1.3, 'white', true]],
    lamps: [[36, 10.3], [324, 10.3], [160, 10.5], [200, 10.5]],
    benches: [[214, 8.8]],
    // a formal court: low walls closing the back on either side of the bench
    walls: [[152, 17.6, 6], [208, 17.6, 6]],
  },
  design: {
    gate: { variant: 'bastion', w: 10.2, h: 9, a: 2.4, spring: 3.4, depth: 2, stone: 'ochre' },
    hero: [206, 15.4],
    boards: [[126, 13.2], [102, 13.6]],
    landmark: [0, 0, 0],
    dome: [256, 18],
    work: { wall: [278, 15.6], desk: [268, 11.6] },
    homes: [[166, 20.5], [232, 21]],
    lead: [-3, 6.8],
    walk: [[6.5, 5.5], [9, 0], [6.5, -6]],
    belief: [330, 18.5],
    beds: [[206, 13.3, 6.6, 1.1, 'warm'], [40, 12.5, 3, 1.3, 'warm', true], [320, 12.5, 3, 1.3, 'cool'], [150, 11.4, 2.4, 1.1, 'green', true]],
    lamps: [[36, 10.3], [324, 10.3], [148, 10.4], [232, 10.4]],
    benches: [[160, 8.8]],
    pavilion: [244, 14.6],
    walls: [],
  },
};

// Lay the shared furniture of an arena out from its config: gateway, ring-road thresholds,
// planting, lamps, benches, low walls and the pavilion. Exhibits, landmark and people are placed
// by the hamlet builder, which knows the department's content.
export function furnishArena(g, h, C, { collider, gateZ = 16 }) {
  g.add(makeInlay(9.3, h.color));
  const gw = makeGateway({ name: h.name, sub: h.place, color: h.color, ...C.gate });
  gw.g.position.set(0, 0, gateZ);
  g.add(gw.g);
  for (const [x, , r] of gw.colliders) collider(g, r, x, gateZ);
  // lanterns either side of the gate on the approach, and where the ring road comes in
  for (const sx of [-1, 1]) {
    const l = makeLantern(3);
    l.position.set(sx * 3.2, 0, gateZ + C.gate.depth / 2 + 1.6);
    g.add(l);
    collider(g, 0.35, sx * 3.2, gateZ + C.gate.depth / 2 + 1.6);
    for (const side of [-1, 1]) {
      // two lanterns frame each ring-road entry, 2.6 m either side of its centreline
      const deg = sx * 60;
      const [cx, cz] = P(deg, 11.4);
      const a = THREE.MathUtils.degToRad(deg);
      const nx = Math.cos(a) * side * 2.9;
      const nz = -Math.sin(a) * side * 2.9;
      const tl = makeLantern(2.6);
      tl.position.set(cx + nx, 0, cz + nz);
      g.add(tl);
      collider(g, 0.35, cx + nx, cz + nz);
    }
  }
  let seed = 1;
  for (const [deg, r, w, d, pal, tree] of C.beds || []) {
    const [x, z] = P(deg, r);
    const b = makeBed(w, d, pal, seed++, { tree });
    b.position.set(x, 0, z);
    b.rotation.y = faceTo(x, z, 0, 0);
    g.add(b);
    for (let k = -(w / 2) + 0.6; k <= w / 2 - 0.5; k += 1.2) {
      const rx = x + Math.cos(b.rotation.y) * k;
      const rz = z - Math.sin(b.rotation.y) * k;
      collider(g, Math.min(0.75, d / 2 + 0.1), rx, rz);
    }
  }
  // flanking beds outside the gate, framing the approach
  for (const sx of [-1, 1]) {
    const b = makeBed(3.6, 1.5, C.beds?.[1]?.[4] || 'warm', 40 + sx, { tree: sx > 0 });
    b.position.set(sx * 6.4, 0, gateZ + 2.4);
    g.add(b);
    collider(g, 0.8, sx * 5.6, gateZ + 2.4);
    collider(g, 0.8, sx * 7.2, gateZ + 2.4);
  }
  for (const [deg, r] of C.lamps || []) {
    const [x, z] = P(deg, r);
    const l = makeLantern(3.1);
    l.position.set(x, 0, z);
    g.add(l);
    collider(g, 0.35, x, z);
  }
  for (const [deg, r] of C.benches || []) {
    const [x, z] = P(deg, r);
    const b = makeBench();
    b.position.set(x, 0, z);
    b.rotation.y = faceTo(x, z, 0, 0);
    g.add(b);
    collider(g, 0.9, x, z);
  }
  for (const [deg, r, len] of C.walls || []) {
    const [x, z] = P(deg, r);
    const w = makeLowWall(len);
    w.position.set(x, 0, z);
    w.rotation.y = faceTo(x, z, 0, 0);
    g.add(w);
    for (let k = -len / 2 + 0.4; k <= len / 2 - 0.3; k += 0.8) collider(g, 0.4, x + Math.cos(w.rotation.y) * k, z - Math.sin(w.rotation.y) * k);
  }
  if (C.pavilion) {
    const [x, z] = P(...C.pavilion);
    const pv = makePavilion(1.5);
    pv.position.set(x, 0, z);
    pv.rotation.y = faceTo(x, z, 0, 0);
    g.add(pv);
    collider(g, 2.2, x, z);
  }
}

// ---------- wayfinding ----------
// Fingerposts where people decide where to go: round the tree's plaza (one per spoke, naming the
// department it leads to and the place in the pocket beside it), at the landward end of every
// ferry pier, and where the Gallery's lane leaves the ring road.
export function buildWayfinding(scene, { places, piers, colliders, groundAt }) {
  const byId = Object.fromEntries(places.map((p) => [p.id, p]));
  const dirTo = (x, z, p) => {
    const dx = p.x - x;
    const dz = p.z - z;
    const l = Math.hypot(dx, dz) || 1;
    return [dx / l, dz / l];
  };
  const post = (x, z, ids) => {
    const entries = ids.map((id) => byId[id]).filter(Boolean).map((p) => ({ label: p.name, color: p.color, to: dirTo(x, z, p) }));
    if (!entries.length) return;
    const f = makeFingerpost(entries);
    f.position.set(x, groundAt(x, z), z);
    scene.add(f);
    colliders.push({ x, z, r: 0.35 });
  };
  const depts = places.filter((p) => p.angle !== undefined && p.reach === 22);
  const pockets = places.filter((p) => ['fun', 'home', 'ai', 'lab'].includes(p.id));
  for (const d of depts) {
    const a = d.angle;
    // 12.5 m out along the spoke, 4 m to its right
    const x = Math.cos(a) * 12.5 - Math.sin(a) * 4;
    const z = Math.sin(a) * 12.5 + Math.cos(a) * 4;
    const near = pockets.reduce((b, p) => (Math.hypot(p.x - x, p.z - z) < Math.hypot(b.x - x, b.z - z) ? p : b));
    post(x, z, [d.id, near.id]);
  }
  for (const pr of piers) {
    const a = THREE.MathUtils.degToRad(pr.deg);
    const r = pr.land - 3;
    const x = Math.cos(a) * r - Math.sin(a) * 3.2;
    const z = Math.sin(a) * r + Math.cos(a) * 3.2;
    const nearest = (list) => list.reduce((b, p) => (Math.hypot(p.x - x, p.z - z) < Math.hypot(b.x - x, b.z - z) ? p : b));
    post(x, z, ['hq', nearest(depts).id, nearest([...pockets, byId.gallery].filter(Boolean)).id]);
  }
  const gal = byId.gallery;
  if (gal) {
    const f = gal.facing;
    const [fx, fz] = [Math.sin(f), Math.cos(f)];
    // where the lane meets the ring road: beside it, a little way up
    const lx = gal.x + fx * (Math.hypot(gal.x, gal.z) - 61);
    const lz = gal.z + fz * (Math.hypot(gal.x, gal.z) - 61);
    post(lx - fz * 3.6 - fx * 3, lz + fx * 3.6 - fz * 3, ['gallery', 'hq']);
  }
}
