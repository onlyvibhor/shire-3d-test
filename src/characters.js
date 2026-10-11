import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Stylised-realistic people, ~1.8 units tall, built from smooth primitives.
const SKINS = ['#c68b5e', '#a8714a', '#8d5a3b', '#d9a27a', '#b57f57', '#e0b48f', '#9b6644'];
const HAIRS = ['#151210', '#1f1712', '#2b1d14', '#3b2a1e', '#0e0e10'];
const PANTS = ['#2b3445', '#1f2633', '#5b5446', '#33415c', '#3d3a36', '#c9b99a'];
const NEUTRAL_TOPS = ['#f4f1ea', '#e9edf2', '#d7dde5', '#2b2f36', '#c9d6e3'];

const geoCache = {};
const G = (key, make) => (geoCache[key] ||= make());

const pick = (arr, s) => arr[Math.floor(s * 997) % arr.length];

const PERSON_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, envMapIntensity: 0.45, transparent: false });
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _c = new THREE.Color();

// Collects primitive pieces per joint, then merges each joint into one vertex-coloured mesh.
class Rig {
  constructor() {
    this.parts = new Map();
  }
  add(parent, geo, color, x = 0, y = 0, z = 0, { s = [1, 1, 1], r = [0, 0, 0] } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    _m.compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(r[0], r[1], r[2])), new THREE.Vector3(s[0], s[1], s[2]));
    g.applyMatrix4(_m);
    _c.set(color);
    const n = g.attributes.position.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) cols.set([_c.r, _c.g, _c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    if (!this.parts.has(parent)) this.parts.set(parent, []);
    this.parts.get(parent).push(g);
  }
  build() {
    for (const [parent, geos] of this.parts) {
      const m = new THREE.Mesh(mergeGeometries(geos), PERSON_MAT);
      m.castShadow = true;
      parent.add(m);
      geos.forEach((g) => g.dispose());
    }
  }
}

// Curated outfits: [top, outer layer, bottoms, shoes]. Colours are picked to look styled, not random.
const LOOKS = {
  blazer: [['#f5f2ec', '#1f2a44', '#2b2f36', '#3a2418'], ['#ffffff', '#c2a27c', '#f1ece2', '#f4f4f2'], ['#1b1b1f', '#e9e2d6', '#1b1b1f', '#1b1b1f'], ['#f7d9c4', '#5b6b4f', '#e8e1d3', '#6b4a2f']],
  overshirt: [['#f4f1ea', '#7a8b6f', '#2f3542', '#f4f4f2'], ['#1f2937', '#d6b48a', '#3b3f46', '#f4f4f2'], ['#ffffff', '#3c5a7a', '#c9b99a', '#2b1d14']],
  hoodie: [['#e9e4f5', '#7b5cff', '#1f2633', '#f4f4f2'], ['#f2f2f2', '#2f6bff', '#2b2f36', '#ffffff'], ['#fff', '#ff9f1c', '#3a3f4a', '#1b1b1f']],
  kurta: [['#f6e7c8', '#f6e7c8', '#f8f4ea', '#c9a23a'], ['#e48b78', '#e48b78', '#f8f4ea', '#c9a23a'], ['#2f4f6b', '#2f4f6b', '#f1ece2', '#6b4a2f'], ['#f2c94c', '#f2c94c', '#ffffff', '#c9a23a']],
  dress: [['#ff8fb1', '#ff8fb1', '#ff8fb1', '#f4f4f2'], ['#1f2937', '#1f2937', '#1f2937', '#c9a23a'], ['#7b5cff', '#7b5cff', '#7b5cff', '#f4f4f2'], ['#00a79d', '#00a79d', '#00a79d', '#e9e2d6']],
  streetwear: [['#ffffff', null, '#6b6f5a', '#f4f4f2'], ['#1b1b1f', null, '#c9b99a', '#ffffff'], ['#ff4f8b', null, '#1f2633', '#ffffff'], ['#f2c94c', null, '#3a3f4a', '#1b1b1f']],
  techwear: [['#2b2f36', '#111827', '#1f2937', '#111827'], ['#e5e7eb', '#374151', '#111827', '#ffffff']],
  linen: [['#efe7d6', null, '#363b46', '#f4f4f2']],
};
const STYLES = ['blazer', 'overshirt', 'hoodie', 'kurta', 'dress', 'streetwear', 'techwear', 'blazer', 'overshirt', 'streetwear'];
const HAIR_M = ['crop', 'quiff', 'fade', 'curly', 'wavy'];
const HAIR_F = ['long', 'bun', 'pony', 'curly', 'wavy'];

function lathe(points, open = 0) {
  const pts = points.map(([r, y]) => new THREE.Vector2(r, y));
  return open ? new THREE.LatheGeometry(pts, 24, open, Math.PI * 2 - open * 2) : new THREE.LatheGeometry(pts, 24);
}
// torso profiles from the waist (y=0) up to the base of the neck
const TORSO_M = [[0.155, 0], [0.165, 0.08], [0.182, 0.2], [0.2, 0.33], [0.212, 0.43], [0.198, 0.5], [0.13, 0.555], [0.06, 0.58]];
const TORSO_F = [[0.128, 0], [0.13, 0.1], [0.152, 0.22], [0.17, 0.32], [0.178, 0.42], [0.168, 0.5], [0.11, 0.55], [0.05, 0.57]];
const grow = (prof, k) => prof.map(([r, y]) => [r * k, y]);

export function makePerson(opts = {}) {
  const seed = opts.seed ?? Math.random();
  const pickS = (arr, m) => arr[Math.floor(((seed * m) % 1) * arr.length)];
  const style = opts.style || (opts.top && !opts.style ? 'overshirt' : pickS(STYLES, 7.13));
  const fem = opts.fem ?? (style === 'dress' || (opts.longHair ?? (seed * 7) % 1 < 0.45));
  const look = pickS(LOOKS[style] || LOOKS.overshirt, 3.7);
  const skin = opts.skin || pick(SKINS, seed);
  const hair = opts.hair || pick(HAIRS, seed * 1.7);
  const top = opts.top || look[0];
  const outer = opts.outer !== undefined ? opts.outer : look[1];
  const pants = opts.pants || look[2];
  const shoes = opts.shoes || look[3];
  const accent = opts.accent || '#2f6bff';
  const hairStyle = opts.hairStyle || (opts.longHair === false ? pickS(HAIR_M, 5.3) : fem ? pickS(HAIR_F, 5.3) : pickS(HAIR_M, 5.3));
  const beard = opts.beard ?? (!fem && (seed * 11) % 1 < 0.55);
  const sleeves = opts.sleeves ?? (style === 'streetwear' || style === 'dress' ? 'short' : style === 'linen' ? 'rolled' : 'long');
  const rig = new Rig();

  const root = new THREE.Group();
  const tilt = new THREE.Group();
  root.add(tilt);
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  tilt.add(hips);
  const chest = new THREE.Group();
  hips.add(chest);
  const torsoProf = fem ? TORSO_F : TORSO_M;
  const shoulderX = fem ? 0.215 : 0.245;

  // ----- pelvis / lower garment -----
  rig.add(hips, lathe([[0.0, -0.13], [0.13, -0.13], [fem ? 0.172 : 0.162, -0.06], [fem ? 0.16 : 0.158, 0.02], [0.15, 0.06]]), pants, 0, 0, 0, { s: [1, 1, 0.72] });
  if (style === 'dress' || style === 'kurta') {
    const len = style === 'dress' ? 0.5 : 0.62;
    const flare = style === 'dress' ? 0.3 : 0.24;
    rig.add(hips, lathe([[0.16, 0.05], [0.185, -0.1], [flare * 0.85, -len * 0.6], [flare, -len], [0.0, -len]]), outer || top, 0, 0, 0, { s: [1, 1, 0.8] });
    if (style === 'kurta') rig.add(hips, G('hem', () => new THREE.TorusGeometry(0.24, 0.012, 4, 24)), accent, 0, -0.6, 0, { r: [Math.PI / 2, 0, 0], s: [1, 0.8, 1] });
  }
  // ----- torso and layers -----
  rig.add(chest, lathe(torsoProf), top, 0, 0.0, 0, { s: [1, 1, 0.62] });
  if (style === 'streetwear') rig.add(chest, lathe(grow(torsoProf, 1.09)), top, 0, -0.02, 0, { s: [1, 1, 0.66] });
  if (outer && style !== 'kurta' && style !== 'dress') {
    const open = style === 'hoodie' ? 0 : 0.42;
    rig.add(chest, lathe(grow(torsoProf.slice(0, 7), 1.07), open), outer, 0, -0.03, 0, { s: [1, 1, 0.66] });
    if (style === 'blazer' || style === 'overshirt' || style === 'techwear') {
      for (const sx of [-1, 1]) rig.add(chest, G('lapel', () => new THREE.BoxGeometry(0.05, 0.22, 0.015)), outer, sx * 0.075, 0.42, 0.14, { r: [0.25, 0, sx * 0.35] });
    }
    if (style === 'hoodie') {
      rig.add(chest, G('hood', () => new THREE.TorusGeometry(0.12, 0.05, 8, 16, Math.PI * 1.4)), outer, 0, 0.56, -0.05, { r: [Math.PI / 2 + 0.3, 0, Math.PI * 0.8] });
      rig.add(chest, G('pocket', () => new THREE.BoxGeometry(0.2, 0.09, 0.02)), outer, 0, 0.12, 0.125);
      for (const sx of [-1, 1]) rig.add(chest, G('string', () => new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4)), '#ffffff', sx * 0.04, 0.45, 0.13);
    }
    if (style === 'techwear') rig.add(chest, G('strap', () => new THREE.BoxGeometry(0.035, 0.62, 0.02)), accent, 0, 0.27, 0.13, { r: [0, 0, 0.7] });
  }
  if (style === 'kurta') {
    rig.add(chest, G('placket', () => new THREE.BoxGeometry(0.03, 0.22, 0.01)), accent, 0, 0.42, 0.122);
    if (fem) rig.add(chest, G('dupatta', () => new THREE.TorusGeometry(0.2, 0.025, 6, 20, Math.PI)), accent, 0, 0.45, 0.02, { r: [0.4, 0, 0.6] });
  }
  if (style === 'linen' || style === 'overshirt') {
    for (const sx of [-1, 1]) rig.add(chest, G('collar', () => new THREE.BoxGeometry(0.075, 0.035, 0.05)), style === 'linen' ? top : outer, sx * 0.055, 0.565, 0.065, { r: [0.3, 0, sx * 0.5] });
  }
  if (opts.lanyard) rig.add(chest, G('badge', () => new THREE.BoxGeometry(0.06, 0.08, 0.01)), '#ffffff', 0.08, 0.36, 0.13);
  // tote bag
  if (!opts.noBag && (seed * 23) % 1 < 0.22) {
    rig.add(chest, G('tote', () => new THREE.BoxGeometry(0.24, 0.28, 0.06)), pickS(['#e9e2d6', '#1b1b1f', accent], 2.9), -0.27, 0.05, -0.02, { r: [0, 0, 0.1] });
    rig.add(chest, G('totestrap', () => new THREE.BoxGeometry(0.02, 0.5, 0.02)), '#3a2a1e', -0.23, 0.36, -0.01, { r: [0, 0, 0.1] });
  }

  // ----- neck and head -----
  rig.add(chest, G('neck', () => new THREE.CylinderGeometry(0.048, 0.058, 0.13, 10)), skin, 0, 0.62, 0);
  const head = new THREE.Group();
  head.position.y = 0.77;
  chest.add(head);
  rig.add(head, G('head2', () => new THREE.SphereGeometry(0.112, 22, 18)), skin, 0, 0, 0, { s: [0.9, 1.12, 0.98] });
  rig.add(head, G('jaw', () => new THREE.SphereGeometry(0.08, 14, 10)), skin, 0, -0.06, 0.03, { s: [1, 0.8, 0.95] });
  const eyeW = G('eyeW', () => new THREE.SphereGeometry(0.018, 8, 6));
  const iris = G('iris', () => new THREE.SphereGeometry(0.011, 8, 6));
  for (const sx of [-1, 1]) {
    rig.add(head, eyeW, '#f7f5f0', sx * 0.039, 0.018, 0.088);
    rig.add(head, iris, '#2a1a10', sx * 0.039, 0.018, 0.103);
    rig.add(head, G('brow2', () => new THREE.BoxGeometry(0.042, 0.009, 0.012)), hair, sx * 0.04, 0.048, 0.1, { r: [0, 0, sx * -0.12] });
    rig.add(head, G('ear2', () => new THREE.SphereGeometry(0.024, 8, 6)), skin, sx * 0.1, 0, -0.005, { s: [0.5, 1, 0.8] });
  }
  rig.add(head, G('nose2', () => new THREE.ConeGeometry(0.017, 0.045, 6)), skin, 0, -0.005, 0.112, { r: [Math.PI / 2 - 0.3, 0, 0] });
  rig.add(head, G('lips', () => new THREE.SphereGeometry(0.024, 10, 6)), new THREE.Color(skin).multiplyScalar(0.72).getStyle(), 0, -0.052, 0.097, { s: [1.1, 0.4, 0.5] });
  // hair
  const H = (geo, x, y, z, o) => rig.add(head, geo, hair, x, y, z, o);
  const cap = G('cap2', () => new THREE.SphereGeometry(0.118, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.55));
  switch (hairStyle) {
    case 'quiff':
      H(cap, 0, 0.015, -0.008, { s: [0.97, 1.05, 1.04], r: [-0.22, 0, 0] });
      H(G('quiff', () => new THREE.SphereGeometry(0.07, 14, 10)), 0, 0.1, 0.05, { s: [1.3, 0.7, 1] });
      break;
    case 'fade':
      H(cap, 0, 0.03, -0.01, { s: [0.92, 0.95, 1.0], r: [-0.25, 0, 0] });
      H(G('top', () => new THREE.SphereGeometry(0.075, 14, 10)), 0, 0.095, 0.02, { s: [1.1, 0.55, 1.2] });
      break;
    case 'curly':
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const ring = k % 2 ? 0.085 : 0.06;
        H(G('curl', () => new THREE.SphereGeometry(0.045, 8, 6)), Math.cos(a) * ring, 0.07 + (k % 3) * 0.015, Math.sin(a) * ring - 0.015);
      }
      H(cap, 0, 0.02, -0.01, { s: [1.02, 1.05, 1.05], r: [-0.2, 0, 0] });
      break;
    case 'long':
      H(cap, 0, 0.015, -0.006, { s: [1, 1.08, 1.05], r: [-0.18, 0, 0] });
      H(G('long2', () => new THREE.CapsuleGeometry(0.1, 0.24, 4, 12)), 0, -0.13, -0.055, { s: [1.12, 1, 0.55] });
      for (const sx of [-1, 1]) H(G('side', () => new THREE.CapsuleGeometry(0.035, 0.16, 4, 8)), sx * 0.095, -0.08, 0.02);
      break;
    case 'bun':
      H(cap, 0, 0.015, -0.006, { s: [0.98, 1.06, 1.04], r: [-0.18, 0, 0] });
      H(G('bun', () => new THREE.SphereGeometry(0.055, 14, 10)), 0, 0.11, -0.07);
      break;
    case 'pony':
      H(cap, 0, 0.015, -0.006, { s: [0.98, 1.06, 1.04], r: [-0.18, 0, 0] });
      H(G('ponyk', () => new THREE.SphereGeometry(0.035, 10, 8)), 0, 0.05, -0.115);
      H(G('ponyt', () => new THREE.CapsuleGeometry(0.035, 0.2, 4, 8)), 0, -0.07, -0.13, { r: [0.25, 0, 0] });
      break;
    case 'wavy':
      H(cap, 0, 0.02, -0.006, { s: [1.02, 1.08, 1.06], r: [-0.2, 0, 0] });
      for (let k = 0; k < 5; k++) H(G('wave', () => new THREE.SphereGeometry(0.04, 10, 8)), -0.07 + k * 0.035, 0.1 + Math.sin(k * 1.7) * 0.01, 0.05);
      if (fem) H(G('long2', () => new THREE.CapsuleGeometry(0.1, 0.24, 4, 12)), 0, -0.1, -0.06, { s: [1.15, 0.85, 0.55] });
      break;
    default:
      H(cap, 0, 0.02, -0.008, { s: [0.97, 1.08, 1.04], r: [-0.2, 0, 0] });
  }
  if (beard) {
    // a trimmed beard along the jaw, softened towards the skin tone
    const beardCol = new THREE.Color(hair).lerp(new THREE.Color(skin), 0.25).getStyle();
    rig.add(head, G('beard3', () => new THREE.SphereGeometry(0.1, 18, 10, -Math.PI * 0.12, Math.PI * 1.24, Math.PI * 0.6, Math.PI * 0.33)), beardCol, 0, -0.008, 0.006, { s: [0.95, 1.12, 1.0] });
    rig.add(head, G('chin', () => new THREE.SphereGeometry(0.035, 10, 8)), beardCol, 0, -0.085, 0.07, { s: [1.3, 0.8, 0.8] });
    rig.add(head, G('stache2', () => new THREE.CapsuleGeometry(0.008, 0.045, 4, 6)), beardCol, 0, -0.036, 0.106, { r: [0, 0, Math.PI / 2] });
  }
  // accessories
  const acc = opts.accessory ?? pickS(['none', 'glasses', 'none', 'cap', 'earrings', 'shades', 'none', 'headphones', 'beanie'], 9.7);
  if (acc === 'glasses' || acc === 'shades') {
    const rim = acc === 'shades' ? '#111111' : '#2b2b2b';
    for (const sx of [-1, 1]) {
      rig.add(head, G('rim', () => new THREE.TorusGeometry(0.026, 0.005, 6, 16)), rim, sx * 0.04, 0.018, 0.112);
      if (acc === 'shades') rig.add(head, G('lens', () => new THREE.CircleGeometry(0.025, 14)), '#0d0d0f', sx * 0.04, 0.018, 0.114);
      rig.add(head, G('arm', () => new THREE.BoxGeometry(0.004, 0.004, 0.09)), rim, sx * 0.075, 0.02, 0.07);
    }
    rig.add(head, G('bridge', () => new THREE.BoxGeometry(0.025, 0.004, 0.004)), rim, 0, 0.022, 0.114);
  } else if (acc === 'cap' && !fem) {
    rig.add(head, G('capc', () => new THREE.SphereGeometry(0.122, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)), accent, 0, 0.03, -0.005, { s: [1, 0.95, 1.05] });
    rig.add(head, G('brim', () => new THREE.CylinderGeometry(0.08, 0.08, 0.012, 16, 1, false, -Math.PI / 2, Math.PI)), accent, 0, 0.045, 0.11, { s: [1.2, 1, 1] });
  } else if (acc === 'beanie') {
    rig.add(head, G('beanie', () => new THREE.SphereGeometry(0.125, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)), pickS(['#e48b78', '#2f4f6b', '#f2c94c', '#1b1b1f'], 4.1), 0, 0.04, -0.01, { s: [1, 1.15, 1.05] });
  } else if (acc === 'earrings' && fem) {
    for (const sx of [-1, 1]) rig.add(head, G('ear-ring', () => new THREE.TorusGeometry(0.014, 0.004, 6, 12)), '#d9b04a', sx * 0.103, -0.04, 0);
  } else if (acc === 'headphones') {
    rig.add(head, G('band', () => new THREE.TorusGeometry(0.125, 0.012, 6, 20, Math.PI)), '#1b1b1f', 0, 0.02, 0, { r: [0, 0, 0] });
    for (const sx of [-1, 1]) rig.add(head, G('cup', () => new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14)), '#1b1b1f', sx * 0.12, 0.0, 0, { r: [0, 0, Math.PI / 2] });
  }

  // ----- arms -----
  const sleeveCol = outer && style !== 'kurta' && style !== 'dress' ? outer : top;
  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * shoulderX, 0.5, 0);
    rig.add(shoulder, G('delt', () => new THREE.SphereGeometry(0.06, 12, 10)), sleeveCol, side * -0.012, -0.03, 0, { s: [0.95, 1.1, 0.9] });
    rig.add(shoulder, G('upper2', () => new THREE.CapsuleGeometry(fem ? 0.046 : 0.054, 0.21, 4, 10)), sleeves === 'short' ? skin : sleeveCol, 0, -0.15, 0);
    if (sleeves === 'short') rig.add(shoulder, G('sleeve', () => new THREE.CylinderGeometry(0.065, 0.06, 0.12, 12)), sleeveCol, 0, -0.06, 0);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    rig.add(elbow, G('fore2', () => new THREE.CapsuleGeometry(fem ? 0.038 : 0.044, 0.2, 4, 10)), sleeves === 'long' ? sleeveCol : skin, 0, -0.13, 0);
    if (sleeves === 'rolled') rig.add(elbow, G('cuff', () => new THREE.CylinderGeometry(0.052, 0.05, 0.06, 12)), sleeveCol, 0, -0.02, 0);
    if (sleeves === 'long') rig.add(elbow, G('cuffl', () => new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12)), style === 'blazer' ? top : sleeveCol, 0, -0.245, 0);
    rig.add(elbow, G('palm', () => new THREE.SphereGeometry(0.045, 10, 8)), skin, 0, -0.29, 0.005, { s: [0.75, 1.15, 0.55] });
    rig.add(elbow, G('thumb', () => new THREE.CapsuleGeometry(0.013, 0.035, 4, 6)), skin, side * -0.03, -0.27, 0.025, { r: [0.4, 0, side * 0.5] });
    chest.add(shoulder);
    return { shoulder, elbow };
  };
  const makeLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * (fem ? 0.088 : 0.095), -0.03, 0);
    const wide = style === 'streetwear' ? 1.25 : 1;
    const bareLeg = style === 'dress';
    rig.add(hip, G('thigh2', () => new THREE.CapsuleGeometry(0.074, 0.3, 4, 10)), bareLeg ? skin : pants, 0, -0.22, 0, { s: [wide, 1, wide] });
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    rig.add(knee, G('shin2', () => new THREE.CapsuleGeometry(0.058, 0.3, 4, 10)), bareLeg ? skin : pants, 0, -0.2, 0, { s: [wide, 1, wide] });
    if (style === 'blazer' || style === 'linen') rig.add(knee, G('trcuff', () => new THREE.CylinderGeometry(0.064, 0.064, 0.03, 12)), pants, 0, -0.38, 0);
    // shoes: sneakers get a white sole
    const shoeKind = style === 'kurta' ? 'jutti' : style === 'blazer' && (seed * 3) % 1 < 0.6 ? 'loafer' : style === 'techwear' ? 'boot' : 'sneaker';
    if (shoeKind === 'boot') rig.add(knee, G('boot', () => new THREE.CylinderGeometry(0.068, 0.072, 0.18, 12)), shoes, 0, -0.36, 0);
    rig.add(knee, G('shoe2', () => new THREE.SphereGeometry(0.068, 12, 8)), shoeKind === 'sneaker' ? shoes : shoeKind === 'jutti' ? '#c9a23a' : shoes, 0, -0.435, 0.045, { s: [0.95, 0.62, 1.75] });
    if (shoeKind === 'sneaker' || shoeKind === 'boot') rig.add(knee, G('sole', () => new THREE.BoxGeometry(0.12, 0.03, 0.25)), '#f7f7f5', 0, -0.47, 0.045);
    hips.add(hip);
    return { hip, knee };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  if (opts.watch || (seed * 31) % 1 < 0.3) rig.add(armL.elbow, G('watch2', () => new THREE.TorusGeometry(0.046, 0.013, 6, 14)), opts.watch ? '#1a1a1a' : '#c9a23a', 0, -0.235, 0, { r: [Math.PI / 2, 0, 0] });
  rig.build();

  const scale = opts.scale ?? (fem ? 0.94 : 0.98) + ((seed * 17) % 1) * 0.08;
  root.scale.setScalar(scale);
  return { root, parts: { tilt, hips, chest, head, armL, armR, legL, legR }, phase: seed * 10, props: {}, look: 0, lookW: 0, react: null };
}

// Attach a small prop to the right hand (phone, camera, laptop...).
export function giveProp(person, kind, color = '#1c1f26') {
  const hand = person.parts.armR.elbow;
  let m;
  if (kind === 'phone') {
    m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.012), new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 }));
    m.position.set(0, -0.33, 0.04);
  } else if (kind === 'controller') {
    m = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.035, 0.075), mat);
    const gripL = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.05, 3, 8), mat);
    const gripR = gripL.clone();
    gripL.position.set(-0.07, -0.01, -0.035);
    gripR.position.set(0.07, -0.01, -0.035);
    gripL.rotation.x = gripR.rotation.x = Math.PI / 2;
    m.add(body, gripL, gripR);
    m.position.set(0.11, -0.34, 0.05);
  } else if (kind === 'camera') {
    m = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.36), new THREE.MeshStandardMaterial({ color: '#202329', roughness: 0.4 }));
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.2, 14), new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.2, metalness: 0.6 }));
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.26;
    m.add(body, lens);
    m.position.set(0.02, -0.25, 0.12);
  } else if (kind === 'gavel' || kind === 'hammer') {
    m = new THREE.Group();
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), new THREE.MeshStandardMaterial({ color: '#6b4a2f' }));
    h.rotation.x = Math.PI / 2;
    h.position.z = 0.12;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 10), new THREE.MeshStandardMaterial({ color: '#4a3020' }));
    top.rotation.z = Math.PI / 2;
    top.position.z = 0.27;
    m.add(h, top);
    m.position.set(0, -0.3, 0);
  } else if (kind === 'glove') {
    for (const arm of [person.parts.armL, person.parts.armR]) {
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
      gl.position.set(0, -0.3, 0.01);
      arm.elbow.add(gl);
    }
    return;
  } else if (kind === 'cup') {
    m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.12, 10), new THREE.MeshStandardMaterial({ color: color === '#1c1f26' ? '#ffffff' : color, roughness: 0.5 }));
    m.position.set(0, -0.32, 0.05);
  } else if (kind === 'parcel') {
    m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    m.position.set(-0.25, 0.15, 0.32);
    person.parts.chest.add(m);
    return;
  }
  m.traverse((o) => (o.castShadow = true));
  hand.add(m);
}

/** Pose a person for an action at time t, then layer look-at and physical reactions on top. */
export function animate(p, action, t, speed = 0) {
  const r = p.react;
  if (r && r.type === 'wave' && t - r.t0 < 2.4) pose(p, 'wave', t, 0);
  else pose(p, action, t, speed);
  if (p.lookW > 0.01) {
    p.parts.head.rotation.y = THREE.MathUtils.lerp(p.parts.head.rotation.y, p.look, p.lookW);
    p.parts.chest.rotation.y += p.look * 0.25 * p.lookW;
  }
  applyReaction(p, t);
}

// Knock someone over (`fall`) or shove them (`stumble`). `dir` is a unit vector in the person's local space.
export function hit(p, type, dir, t) {
  if (p.react && (p.react.type === 'fall' || p.react.type === 'stumble') && t - p.react.t0 < (p.react.type === 'fall' ? 4.2 : 1.2)) return false;
  p.react = { type, t0: t, dir: dir.clone().setY(0).normalize(), theta: 0, omega: type === 'fall' ? 3.2 : 0, last: t };
  return true;
}

const _axis = new THREE.Vector3();
function applyReaction(p, t) {
  const r = p.react;
  const { tilt, head, armL, armR, legL, legR, chest } = p.parts;
  if (!r || r.type === 'wave') {
    tilt.quaternion.identity();
    return;
  }
  const tau = t - r.t0;
  const dt = Math.min(0.05, Math.max(0, t - r.last));
  r.last = t;
  let theta = 0;
  if (r.type === 'stumble') {
    if (tau > 1.2) {
      p.react = null;
      tilt.quaternion.identity();
      return;
    }
    theta = 0.42 * Math.exp(-3.5 * tau) * Math.sin(tau * 9);
    const flail = Math.exp(-3 * tau);
    armL.shoulder.rotation.z -= 1.2 * flail;
    armR.shoulder.rotation.z += 1.2 * flail;
    head.rotation.x -= 0.4 * flail;
  } else {
    // A simple inverted-pendulum fall, a limp rag-doll on the ground, then getting back up.
    const LIE = Math.PI / 2 - 0.08;
    if (tau < 2.8) {
      r.omega += 9 * Math.sin(Math.max(0.05, r.theta)) * dt;
      r.theta += r.omega * dt;
      if (r.theta > LIE) {
        r.theta = LIE;
        r.omega = -r.omega * 0.22;
      }
      theta = r.theta;
    } else if (tau < 4.0) {
      const k = (tau - 2.8) / 1.2;
      theta = LIE * (1 - k * k * (3 - 2 * k));
    } else {
      p.react = null;
      tilt.quaternion.identity();
      return;
    }
    const limp = THREE.MathUtils.clamp(theta / LIE, 0, 1);
    const bounce = Math.exp(-4 * Math.max(0, tau - 0.35)) * Math.sin(tau * 16);
    armL.shoulder.rotation.set(-0.3 * limp, 0, -(1.3 + bounce * 0.4) * limp);
    armR.shoulder.rotation.set(-0.2 * limp, 0, (1.2 - bounce * 0.4) * limp);
    armL.elbow.rotation.x = -0.4 * limp;
    armR.elbow.rotation.x = -0.6 * limp;
    legL.hip.rotation.set(0.15 * limp, 0, -0.18 * limp);
    legR.hip.rotation.set(-0.25 * limp, 0, 0.12 * limp);
    legL.knee.rotation.x = 0.35 * limp;
    legR.knee.rotation.x = 0.15 * limp;
    head.rotation.x = (0.35 + bounce * 0.3) * limp;
    chest.rotation.x = 0.1 * limp;
  }
  _axis.set(r.dir.z, 0, -r.dir.x).normalize();
  tilt.quaternion.setFromAxisAngle(_axis, theta);
}

function pose(p, action, t, speed = 0) {
  const { hips, chest, head, armL, armR, legL, legR } = p.parts;
  const ph = t + p.phase;
  // neutral
  hips.position.y = 0.95;
  hips.rotation.set(0, 0, 0);
  chest.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
  for (const a of [armL, armR]) {
    a.shoulder.rotation.set(0, 0, 0);
    a.elbow.rotation.set(-0.12, 0, 0);
  }
  armL.shoulder.rotation.z = -0.08;
  armR.shoulder.rotation.z = 0.08;
  for (const l of [legL, legR]) {
    l.hip.rotation.set(0, 0, 0);
    l.knee.rotation.set(0, 0, 0);
  }
  const breathe = Math.sin(ph * 1.8) * 0.012;
  chest.rotation.x = breathe;

  if (action === 'walk' || action === 'carry') {
    const a = Math.min(1, speed / 2.2);
    if (a < 0.05) {
      if (action === 'carry') carryArms(armL, armR);
      return;
    }
    const run = THREE.MathUtils.clamp((speed - 4.5) / 3, 0, 1);
    const w = ph * (4.2 + speed * 1.05);
    const s = Math.sin(w);
    const c = Math.cos(w);
    const amp = 0.5 + run * 0.35;
    legL.hip.rotation.x = -s * amp * a;
    legR.hip.rotation.x = s * amp * a;
    legL.knee.rotation.x = (Math.max(0, c) * (0.9 + run * 0.7) + 0.08) * a;
    legR.knee.rotation.x = (Math.max(0, -c) * (0.9 + run * 0.7) + 0.08) * a;
    hips.position.y = 0.95 + Math.abs(c) * (0.03 + run * 0.045) * a;
    hips.rotation.y = s * 0.08 * a;
    chest.rotation.y = -s * 0.14 * a;
    chest.rotation.x = 0.04 + run * 0.18;
    if (action === 'carry') carryArms(armL, armR);
    else {
      armL.shoulder.rotation.x = s * (0.45 + run * 0.5) * a;
      armR.shoulder.rotation.x = -s * (0.45 + run * 0.5) * a;
      armL.elbow.rotation.x = -0.25 - run * 1.0 - Math.max(0, -s) * 0.3;
      armR.elbow.rotation.x = -0.25 - run * 1.0 - Math.max(0, s) * 0.3;
    }
    return;
  }

  switch (action) {
    case 'type':
      head.rotation.x = 0.28;
      for (const [arm, k] of [[armL, 0], [armR, 1.3]]) {
        arm.shoulder.rotation.x = -0.45;
        arm.elbow.rotation.x = -1.05 + Math.sin(ph * 14 + k) * 0.05;
      }
      armL.shoulder.rotation.z = 0.12;
      armR.shoulder.rotation.z = -0.12;
      break;
    case 'write':
      head.rotation.x = 0.4;
      chest.rotation.x = 0.15;
      armR.shoulder.rotation.x = -0.55;
      armR.elbow.rotation.x = -1.1 + Math.sin(ph * 9) * 0.07;
      armR.shoulder.rotation.z = Math.sin(ph * 4) * 0.08 - 0.1;
      armL.shoulder.rotation.x = -0.4;
      armL.elbow.rotation.x = -1.2;
      break;
    case 'present':
      armR.shoulder.rotation.x = -1.35 + Math.sin(ph * 0.9) * 0.15;
      armR.shoulder.rotation.z = 0.35 + Math.sin(ph * 0.6) * 0.25;
      armR.elbow.rotation.x = -0.2;
      armL.shoulder.rotation.z = -0.35;
      armL.elbow.rotation.x = -1.6;
      armL.shoulder.rotation.x = 0.2;
      head.rotation.y = Math.sin(ph * 0.5) * 0.5;
      break;
    case 'talk':
      armL.shoulder.rotation.x = -0.35 + Math.sin(ph * 2.5) * 0.25;
      armL.elbow.rotation.x = -1.0 + Math.sin(ph * 3) * 0.2;
      armR.shoulder.rotation.x = -0.3 + Math.sin(ph * 2.1 + 1) * 0.3;
      armR.elbow.rotation.x = -0.9 + Math.sin(ph * 2.7) * 0.25;
      head.rotation.y = Math.sin(ph * 0.8) * 0.3;
      head.rotation.z = Math.sin(ph * 1.1) * 0.05;
      chest.rotation.y = Math.sin(ph * 0.7) * 0.08;
      break;
    case 'phone':
      armR.shoulder.rotation.x = -1.25;
      armR.shoulder.rotation.z = 0.3;
      armR.elbow.rotation.x = -1.2 + Math.sin(ph * 1.3) * 0.05;
      armL.shoulder.rotation.z = -0.1;
      head.rotation.y = -0.2;
      head.rotation.x = 0.05;
      hips.rotation.y = Math.sin(ph * 0.6) * 0.15;
      break;
    case 'camera':
      armR.shoulder.rotation.x = -1.2;
      armR.shoulder.rotation.z = 0.15;
      armR.elbow.rotation.x = -1.7;
      armL.shoulder.rotation.x = -1.0;
      armL.shoulder.rotation.z = -0.3;
      armL.elbow.rotation.x = -1.3;
      head.rotation.x = 0.1;
      hips.rotation.y = Math.sin(ph * 0.35) * 0.45;
      legL.knee.rotation.x = 0.15;
      legR.knee.rotation.x = 0.15;
      hips.position.y = 0.93;
      break;
    case 'gavel': {
      const k = Math.max(0, Math.sin(ph * 3));
      armR.shoulder.rotation.x = -0.6 - k * 1.2;
      armR.elbow.rotation.x = -0.8;
      head.rotation.x = 0.2;
      armL.shoulder.rotation.x = -0.6;
      armL.elbow.rotation.x = -1.2;
      break;
    }
    case 'box': {
      const jab = Math.max(0, Math.sin(ph * 4.5));
      const cross = Math.max(0, Math.sin(ph * 4.5 + Math.PI));
      hips.position.y = 0.9 + Math.abs(Math.sin(ph * 6)) * 0.04;
      legL.hip.rotation.x = -0.35;
      legR.hip.rotation.x = 0.25;
      legL.knee.rotation.x = 0.35;
      legR.knee.rotation.x = 0.4;
      chest.rotation.y = (jab - cross) * 0.3;
      armL.shoulder.rotation.x = -1.2 - jab * 0.35;
      armL.elbow.rotation.x = -1.9 + jab * 1.7;
      armR.shoulder.rotation.x = -1.2 - cross * 0.35;
      armR.elbow.rotation.x = -1.9 + cross * 1.7;
      armL.shoulder.rotation.z = 0.2;
      armR.shoulder.rotation.z = -0.2;
      break;
    }
    case 'wave':
      armR.shoulder.rotation.z = 2.5;
      armR.elbow.rotation.z = 0;
      armR.elbow.rotation.x = -0.3 + Math.sin(ph * 7) * 0.35;
      head.rotation.x = -0.15;
      break;
    case 'point':
      armR.shoulder.rotation.x = -1.45;
      armR.shoulder.rotation.z = 0.15 + Math.sin(ph * 1.2) * 0.15;
      armR.elbow.rotation.x = -0.05;
      armL.shoulder.rotation.z = -0.3;
      head.rotation.y = Math.sin(ph * 0.6) * 0.35;
      break;
    case 'cheer': {
      const j = Math.max(0, Math.sin(ph * 5));
      armL.shoulder.rotation.z = -2.6;
      armR.shoulder.rotation.z = 2.6;
      armL.elbow.rotation.x = armR.elbow.rotation.x = -0.3;
      hips.position.y = 0.95 + j * 0.12;
      legL.knee.rotation.x = legR.knee.rotation.x = (1 - j) * 0.3;
      break;
    }
    case 'ride':
      hips.position.y = 0.78;
      legL.hip.rotation.set(-1.35, 0, -0.12);
      legR.hip.rotation.set(-1.35, 0, 0.12);
      legL.knee.rotation.x = 1.45;
      legR.knee.rotation.x = 1.45;
      armL.shoulder.rotation.x = armR.shoulder.rotation.x = -1.0;
      armL.elbow.rotation.x = armR.elbow.rotation.x = -0.45;
      armL.shoulder.rotation.z = 0.25;
      armR.shoulder.rotation.z = -0.25;
      chest.rotation.x = 0.18;
      break;
    case 'sit':
      hips.position.y = 0.5;
      legL.hip.rotation.set(-1.3, 0, -0.15);
      legR.hip.rotation.set(-1.3, 0, 0.15);
      legL.knee.rotation.x = 1.25;
      legR.knee.rotation.x = 1.25;
      armL.shoulder.rotation.x = armR.shoulder.rotation.x = -0.35;
      armL.elbow.rotation.x = armR.elbow.rotation.x = -0.9;
      chest.rotation.x = -0.12;
      head.rotation.y = Math.sin(ph * 0.3) * 0.15;
      break;
    case 'game': {
      // sitting, controller in both hands, leaning into the boss fight
      const lean = Math.max(0, Math.sin(ph * 0.45)) * 0.18;
      hips.position.y = 0.5;
      legL.hip.rotation.set(-1.3, 0, -0.12);
      legR.hip.rotation.set(-1.3, 0, 0.12);
      legL.knee.rotation.x = legR.knee.rotation.x = 1.25;
      chest.rotation.x = -0.05 + lean;
      head.rotation.x = 0.12 - lean * 0.5;
      armL.shoulder.rotation.set(-0.75 - lean, 0, 0.32);
      armR.shoulder.rotation.set(-0.75 - lean, 0, -0.32);
      armL.elbow.rotation.x = -1.0 + Math.sin(ph * 11) * 0.04;
      armR.elbow.rotation.x = -1.0 + Math.sin(ph * 13 + 1) * 0.05;
      break;
    }
    case 'smoke': {
      // sitting on a log; a slow drag now and then, or holding it out to share
      hips.position.y = 0.55;
      legL.hip.rotation.set(-1.25, 0, -0.2);
      legR.hip.rotation.set(-1.25, 0, 0.2);
      legL.knee.rotation.x = legR.knee.rotation.x = 1.3;
      chest.rotation.x = 0.12;
      armL.shoulder.rotation.set(-0.5, 0, 0.1);
      armL.elbow.rotation.x = -0.9;
      if (p.offer) {
        armR.shoulder.rotation.set(-1.25 * p.offer, 0, -0.1);
        armR.elbow.rotation.x = -0.15;
        head.rotation.y = 0.2;
      } else {
        const drag = Math.max(0, Math.sin(ph * 0.5)) ** 8;
        armR.shoulder.rotation.set(-0.45 - drag * 1.0, 0, -0.2);
        armR.elbow.rotation.x = -1.3 - drag * 0.75;
        head.rotation.x = -drag * 0.2 + 0.1;
      }
      break;
    }
    case 'puff':
      // standing, cigarette at the lips, chin up
      armR.shoulder.rotation.set(-1.35, 0, -0.25);
      armR.elbow.rotation.x = -1.95;
      head.rotation.x = -0.18;
      armL.shoulder.rotation.z = -0.15;
      break;
    case 'kite':
      // both hands up, tugging the string (Sankranti on the rooftops)
      head.rotation.x = -0.45;
      chest.rotation.x = -0.08;
      armL.shoulder.rotation.set(-2.0 + Math.sin(ph * 2.2) * 0.12, 0, 0.18);
      armR.shoulder.rotation.set(-1.6 + Math.sin(ph * 2.2 + 0.6) * 0.18, 0, -0.18);
      armL.elbow.rotation.x = -0.25;
      armR.elbow.rotation.x = -0.45 + Math.max(0, Math.sin(ph * 2.2)) * 0.3;
      break;
    case 'jump':
      legL.hip.rotation.x = -0.6;
      legR.hip.rotation.x = -0.2;
      legL.knee.rotation.x = 1.1;
      legR.knee.rotation.x = 0.7;
      armL.shoulder.rotation.z = -1.2;
      armR.shoulder.rotation.z = 1.2;
      armL.elbow.rotation.x = armR.elbow.rotation.x = -0.5;
      break;
    case 'coffee': {
      const sip = Math.max(0, Math.sin(ph * 0.7)) ** 6;
      armR.shoulder.rotation.x = -0.5 - sip * 0.9;
      armR.elbow.rotation.x = -1.5 - sip * 0.5;
      armR.shoulder.rotation.z = -0.15;
      head.rotation.x = -sip * 0.25;
      head.rotation.y = Math.sin(ph * 0.4) * 0.3;
      break;
    }
    case 'think':
      armR.shoulder.rotation.x = -0.65;
      armR.shoulder.rotation.z = -0.25;
      armR.elbow.rotation.x = -2.1;
      armL.shoulder.rotation.x = -0.45;
      armL.shoulder.rotation.z = 0.35;
      armL.elbow.rotation.x = -1.45;
      head.rotation.x = -0.18;
      head.rotation.z = Math.sin(ph * 0.5) * 0.1;
      head.rotation.y = Math.sin(ph * 0.3) * 0.25;
      break;
    case 'idle':
    default:
      head.rotation.y = Math.sin(ph * 0.4) * 0.3;
      armL.shoulder.rotation.x = Math.sin(ph * 0.9) * 0.04;
      armR.shoulder.rotation.x = -Math.sin(ph * 0.9) * 0.04;
  }
}

function carryArms(armL, armR) {
  for (const a of [armL, armR]) {
    a.shoulder.rotation.x = -0.75;
    a.elbow.rotation.x = -0.9;
  }
  armL.shoulder.rotation.z = 0.2;
  armR.shoulder.rotation.z = -0.2;
}
