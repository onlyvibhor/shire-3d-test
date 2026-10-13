import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// People, ~1.8 units tall. Every body part and garment is a "loft": a stack of elliptical rings
// joined into one smooth surface, so torsos, limbs, collars, lapels, skirts and shoes have real
// shape instead of being capsules. Garments are layered a few millimetres apart so nothing
// flickers, and each joint (spine, neck, wrists, fingers, ankles) is its own bone.

const LITE = typeof location !== 'undefined' && (new URLSearchParams(location.search).has('lite') || (typeof matchMedia !== 'undefined' && matchMedia('(hover: none)').matches));
const SEG = LITE ? 12 : 18; // around the body
const SEGS = LITE ? 8 : 11; // around small parts

const SKINS = ['#c68b5e', '#a8714a', '#8d5a3b', '#d9a27a', '#b57f57', '#e0b48f', '#9b6644'];
const HAIRS = ['#151210', '#1f1712', '#2b1d14', '#3b2a1e', '#0e0e10'];

const pick = (arr, s) => arr[Math.floor(s * 997) % arr.length];
const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getStyle();
const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k).getStyle();

// One material for the whole person; roughness comes per vertex (skin, cloth, leather, eyes).
export const PERSON_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, envMapIntensity: 0.45 });
PERSON_MAT.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float rough;\nvarying float vRough;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRough = rough;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vRough;').replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vRough;');
};
PERSON_MAT.customProgramCacheKey = () => 'person-rough';

const R = { skin: 0.55, cloth: 0.88, knit: 0.95, denim: 0.8, leather: 0.42, hair: 0.58, eye: 0.15, metal: 0.3, sole: 0.7 };

// ---------- geometry ----------

// rings: [y, rx, rz, cz = 0, shade = 1, cx = 0], listed bottom to top. Angles run from the front (+z)
// towards +x. `a0/a1(i)` limit each ring to an arc (open garments, lapels, panels); `wave(θ, i)`
// scales the radius (pleats, folds); `flip` turns it inside out (linings).
function loft(rings, { segs = SEG, a0, a1, cap0 = true, cap1 = true, flip = false, wave } = {}) {
  const full = !a0;
  const per = full ? segs : segs + 1;
  const pos = [];
  const sh = [];
  rings.forEach(([y, rx, rz, cz = 0, k = 1, cx = 0], i) => {
    const s = full ? 0 : a0(i);
    const e = full ? Math.PI * 2 : a1(i);
    for (let j = 0; j < per; j++) {
      const th = s + ((e - s) * j) / segs;
      const w = wave ? wave(th, i) : 1;
      pos.push(cx + Math.sin(th) * rx * w, y, cz + Math.cos(th) * rz * w);
      sh.push(k);
    }
  });
  const idx = [];
  const V = (i, j) => i * per + (full ? j % segs : j);
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const a = V(i, j);
      const b = V(i, j + 1);
      const c = V(i + 1, j);
      const d = V(i + 1, j + 1);
      if (flip) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  }
  if (full) {
    for (const [ring, top] of [[0, false], [rings.length - 1, true]]) {
      if ((top && !cap1) || (!top && !cap0)) continue;
      const [y, , , cz = 0, k = 1, cx = 0] = rings[ring];
      const c = pos.length / 3;
      pos.push(cx, y, cz);
      sh.push(k);
      for (let j = 0; j < segs; j++) {
        const a = V(ring, j);
        const b = V(ring, j + 1);
        if (top !== flip) idx.push(c, a, b);
        else idx.push(c, b, a);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('shade', new THREE.Float32BufferAttribute(sh, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// a round limb from a top-to-bottom profile [y, r, cz, shade]
const limb = (prof, o = {}) => loft(prof.slice().reverse().map(([y, r, cz = 0, k = 1]) => [y, r, r, cz, k]), { segs: SEGS + 2, ...o });
// the same rings, pushed out by d (a garment over a body part)
const inflate = (rings, d, dz = d) => rings.map(([y, rx, rz, cz = 0, k = 1, cx = 0]) => [y, rx + d, rz + dz, cz, k, cx]);
// linear interpolation of a ring list at height y
function ringAt(rings, y) {
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i];
    const b = rings[i + 1];
    if (y >= a[0] && y <= b[0]) {
      const t = (y - a[0]) / (b[0] - a[0] || 1);
      return a.map((v, k) => (k === 0 ? y : (v ?? (k === 4 ? 1 : 0)) + ((b[k] ?? (k === 4 ? 1 : 0)) - (v ?? (k === 4 ? 1 : 0))) * t));
    }
  }
  const r = (y < rings[0][0] ? rings[0] : rings[rings.length - 1]).slice();
  r[0] = y;
  return r;
}
// z of a ring list's front surface at height y and sideways offset x, pushed out by d
function surfZ(rings, y, x = 0, d = 0) {
  const r = ringAt(rings, y);
  const rx = r[1] + d;
  return (r[3] || 0) + (r[2] + d) * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
}
// resample a ring list between y0 and y1 (n rings), so garments can stop and start anywhere
function slice(rings, y0, y1, n = 7) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(ringAt(rings, y0 + ((y1 - y0) * i) / (n - 1)));
  return out;
}
// make a hanging piece start exactly where the garment above it ends, so there is no ledge
function tuck(rings, above, y = 0.05) {
  const a = ringAt(above, y);
  const out = rings.filter((r) => r[0] < y - 0.012);
  out.push([y - 0.012, (ringAt(rings, y - 0.012)[1] + a[1]) / 2, (ringAt(rings, y - 0.012)[2] + a[2]) / 2, a[3]]);
  out.push([y, a[1] - 0.002, a[2] - 0.002, a[3]]);
  out.push([y + 0.03, a[1] - 0.006, a[2] - 0.006, a[3]]);
  return out;
}
// a shoe-like loft along +z: rings [z, halfWidth, halfHeight, yCentre, shade]
function along(rings, o = {}) {
  const g = loft(rings.map(([z, w, h, yc, k = 1]) => [z, w, h, -yc, k]), { segs: SEGS + 1, ...o });
  g.rotateX(Math.PI / 2);
  return g;
}

const cache = new Map();
const C = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

// ---------- the rig: pieces collected per bone, merged into one mesh per bone ----------
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _c = new THREE.Color();
class Rig {
  constructor() {
    this.parts = new Map();
  }
  add(bone, geo, color, x = 0, y = 0, z = 0, { s = [1, 1, 1], r = [0, 0, 0], rough = R.cloth } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    _m.compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(r[0], r[1], r[2])), new THREE.Vector3(s[0], s[1], s[2]));
    g.applyMatrix4(_m);
    _c.set(color);
    const n = g.attributes.position.count;
    const cols = new Float32Array(n * 3);
    const ro = new Float32Array(n).fill(rough);
    const sh = g.attributes.shade;
    for (let i = 0; i < n; i++) {
      const k = sh ? sh.getX(i) : 1;
      cols[i * 3] = _c.r * k;
      cols[i * 3 + 1] = _c.g * k;
      cols[i * 3 + 2] = _c.b * k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.setAttribute('rough', new THREE.BufferAttribute(ro, 1));
    g.deleteAttribute('shade');
    g.deleteAttribute('uv');
    if (!this.parts.has(bone)) this.parts.set(bone, []);
    this.parts.get(bone).push(g);
  }
  // One skinned mesh per person: every piece is moved into the root's space at the rest pose and
  // weighted fully to its bone, so the whole body is a single draw call that the bones deform.
  build(root) {
    root.updateMatrixWorld(true);
    const bones = [...this.parts.keys()];
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const all = [];
    const m = new THREE.Matrix4();
    bones.forEach((bone, bi) => {
      m.multiplyMatrices(inv, bone.matrixWorld);
      for (const g of this.parts.get(bone)) {
        g.applyMatrix4(m);
        const n = g.attributes.position.count;
        const si = new Uint16Array(n * 4);
        const sw = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) {
          si[i * 4] = bi;
          sw[i * 4] = 1;
        }
        g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
        g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
        all.push(g);
      }
    });
    const geo = mergeGeometries(all);
    all.forEach((g) => g.dispose());
    const mesh = new THREE.SkinnedMesh(geo, PERSON_MAT);
    mesh.castShadow = true;
    mesh.name = 'person';
    mesh.userData.dynamic = true; // never folded into a static merge
    root.add(mesh);
    root.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(bones));
    // a generous fixed bound, so culling never has to re-pose the skeleton
    geo.computeBoundingSphere();
    mesh.boundingSphere = geo.boundingSphere.clone();
    mesh.boundingSphere.radius += 0.6;
    return mesh;
  }
}

// ---------- the body ----------

// Heights in hip space: the waist pivot is y = 0.
const CHEST_Y = 0.22; // spine → chest bend
const NECK_Y = 0.59;
const HEAD_Y = 0.765;
const SHOULDER_Y = 0.495;
const HIP_X = (fem) => (fem ? 0.084 : 0.088);
// widen garment rings that hang over the hips so the thighs never poke through them
function clearThighs(rings, fem, wide, pad = 0.012) {
  return rings.map((r) => {
    const yl = r[0] + 0.03; // hip-local height
    const tr = ringAt(THIGH.map(([y, rr]) => [y, rr, rr]).reverse(), Math.min(0.03, Math.max(-0.45, yl)))[1];
    const t = (tr + 0.013) * wide + pad; // the clothed thigh's radius plus a margin
    const out = r.slice();
    if (yl < 0.02) {
      const hx = HIP_X(fem);
      out[1] = Math.max(out[1], hx + t);
      // the ellipse must also reach past the thigh's front and back where the thigh actually is
      const k = Math.sqrt(Math.max(0.05, 1 - (hx / out[1]) ** 2));
      out[2] = Math.max(out[2], (t + Math.abs(out[3] || 0)) / k);
    }
    return out;
  });
}

// torso rings [y, rx, rz, cz, shade]
const TORSO = {
  m: [[0.0, 0.148, 0.103, 0.0], [0.08, 0.155, 0.106, 0.004], [0.18, 0.168, 0.113, 0.012], [0.28, 0.18, 0.12, 0.018], [0.36, 0.187, 0.122, 0.016], [0.43, 0.19, 0.114, 0.004], [0.48, 0.186, 0.104, -0.006], [0.52, 0.168, 0.093, -0.012], [0.555, 0.13, 0.08, -0.014], [0.58, 0.085, 0.066, -0.01], [0.6, 0.06, 0.056, -0.004]],
  f: [[0.0, 0.124, 0.09, 0.0], [0.08, 0.128, 0.093, 0.003], [0.18, 0.14, 0.098, 0.01], [0.26, 0.152, 0.108, 0.02], [0.32, 0.16, 0.12, 0.03], [0.38, 0.162, 0.112, 0.022], [0.44, 0.164, 0.1, 0.004], [0.49, 0.16, 0.091, -0.006], [0.53, 0.142, 0.082, -0.011], [0.56, 0.104, 0.069, -0.011], [0.58, 0.07, 0.055, -0.008], [0.595, 0.05, 0.048, -0.004]],
};
const PELVIS = {
  m: [[-0.17, 0.04, 0.04, -0.012], [-0.15, 0.1, 0.075, -0.012], [-0.1, 0.148, 0.1, -0.01], [-0.04, 0.156, 0.106, -0.006], [0.02, 0.152, 0.105, -0.002], [0.05, 0.149, 0.103, 0.0]],
  f: [[-0.17, 0.04, 0.04, -0.014], [-0.15, 0.11, 0.078, -0.014], [-0.1, 0.164, 0.104, -0.014], [-0.04, 0.168, 0.105, -0.01], [0.02, 0.138, 0.095, -0.003], [0.05, 0.127, 0.091, 0.0]],
};
// limbs, top to bottom: [y, r, cz, shade]
const THIGH = [[0.03, 0.05], [0.0, 0.074], [-0.07, 0.083], [-0.2, 0.073], [-0.34, 0.062, 0.004], [-0.43, 0.05, 0.006], [-0.45, 0.044, 0.006]];
const SHIN = [[0.025, 0.044, 0.004], [0.0, 0.05, 0.003], [-0.07, 0.057, -0.006], [-0.15, 0.056, -0.01], [-0.28, 0.044, -0.004], [-0.4, 0.036], [-0.43, 0.035]];
const UPPER = [[0.06, 0.02], [0.045, 0.042], [0.015, 0.054], [-0.04, 0.055], [-0.15, 0.049], [-0.26, 0.042], [-0.29, 0.037], [-0.31, 0.03]];
const FORE = [[0.02, 0.032], [0.0, 0.037], [-0.06, 0.044, -0.004], [-0.16, 0.036], [-0.24, 0.029], [-0.255, 0.028]];
const HEAD = {
  m: [[-0.128, 0.026, 0.028, 0.05], [-0.105, 0.056, 0.058, 0.03], [-0.075, 0.073, 0.083, 0.014], [-0.04, 0.083, 0.096, 0.006], [-0.005, 0.087, 0.102, 0.0], [0.035, 0.089, 0.104, -0.004], [0.075, 0.085, 0.1, -0.009], [0.105, 0.07, 0.083, -0.013], [0.128, 0.04, 0.048, -0.016], [0.139, 0.0, 0.0, -0.016]],
  f: [[-0.122, 0.022, 0.024, 0.044], [-0.1, 0.05, 0.054, 0.028], [-0.072, 0.067, 0.08, 0.013], [-0.04, 0.079, 0.094, 0.006], [-0.005, 0.084, 0.1, 0.0], [0.035, 0.087, 0.103, -0.004], [0.075, 0.083, 0.099, -0.009], [0.105, 0.068, 0.082, -0.013], [0.128, 0.039, 0.047, -0.016], [0.139, 0.0, 0.0, -0.016]],
};

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
  const sleeves = opts.sleeves ?? (style === 'streetwear' || style === 'dress' ? 'short' : style === 'linen' ? 'rolled' : style === 'overshirt' && (seed * 13) % 1 < 0.4 ? 'rolled' : 'long');
  const sex = fem ? 'f' : 'm';
  const K = sex + style; // cache key prefix for shapes that differ by build and style
  const rig = new Rig();
  const add = (bone, key, make, color, x, y, z, o) => rig.add(bone, C(key, make), color, x, y, z, o);

  // ----- bones -----
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  root.add(tilt);
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  tilt.add(hips);
  const spine = new THREE.Group();
  hips.add(spine);
  // cloth bones: whatever hangs below the waist is cut into a front and a back half that swing
  // with the legs, so stepping forward lifts the hem instead of pushing a knee through it
  const PIV = -0.03;
  const skirtF = new THREE.Group();
  const skirtB = new THREE.Group();
  skirtF.position.y = skirtB.position.y = PIV;
  hips.add(skirtF, skirtB);
  const chest = new THREE.Group();
  chest.position.y = CHEST_Y;
  spine.add(chest);
  const neck = new THREE.Group();
  neck.position.set(0, NECK_Y - CHEST_Y, -0.004);
  chest.add(neck);
  const head = new THREE.Group();
  head.position.set(0, HEAD_Y - NECK_Y, 0.012);
  neck.add(head);

  const torso = TORSO[sex];
  const pelvis = PELVIS[sex];
  const shoulderX = fem ? 0.188 : 0.214;
  const jacket = outer && ['blazer', 'overshirt', 'techwear', 'hoodie'].includes(style);
  const tucked = style === 'blazer' || style === 'kurta' || style === 'dress';
  const legWide = style === 'streetwear' ? 1.14 : style === 'kurta' ? 0.9 : 1;
  // torso pieces go on the spine below CHEST_Y and on the chest above it
  const torsoAdd = (key, rings, color, o = {}, d = 0) => {
    const lo = rings.filter((r) => r[0] <= CHEST_Y + 0.001);
    const hi = rings.filter((r) => r[0] >= CHEST_Y - 0.001);
    const cut = ringAt(rings, CHEST_Y);
    const loR = lo[lo.length - 1][0] < CHEST_Y - 0.001 ? [...lo, cut] : lo;
    const hiR = hi[0][0] > CHEST_Y + 0.001 ? [cut, ...hi] : hi;
    if (loR.length > 1) add(spine, key + 'lo', () => loft(loR, { ...o, cap1: false }), color, 0, 0, 0, { rough: o.rough ?? R.cloth });
    if (hiR.length > 1) add(chest, key + 'hi', () => loft(hiR, { ...o, cap0: false }), color, 0, -CHEST_Y, 0, { rough: o.rough ?? R.cloth });
    // a hidden filler at the bend, so leaning never opens a gap
    if (d >= 0) add(chest, key + 'fill', () => new THREE.SphereGeometry(1, SEG, 6), color, 0, 0, cut[3], { s: [cut[1] - 0.006, 0.05, cut[2] - 0.006], rough: o.rough ?? R.cloth });
  };
  const fine = (rings, n = LITE ? 8 : 11) => slice(rings, rings[0][0], rings[rings.length - 1][0], n);
  // a hanging garment split onto the cloth bones; the back half sits a hair inside the front
  // so the two overlap cleanly at the side seams
  const drape = (key, rings, color, o = {}) => {
    const ov = 0.14;
    const A0 = o.a0 || (() => 0);
    const A1 = o.a1 || (() => Math.PI * 2);
    const segs = Math.round(SEG / 2) + 3;
    const sh = rings.map((r) => [r[0] - PIV, ...r.slice(1)]);
    const parts = [
      [skirtF, 'fr', A0, () => Math.PI / 2 + ov, 0],
      [skirtF, 'fl', () => Math.PI * 1.5 - ov, A1, 0],
      [skirtB, 'b', () => Math.PI / 2 - ov, () => Math.PI * 1.5 + ov, 0.003],
    ];
    for (const [bone, sfx, a0, a1, inset] of parts) {
      const rr = sh.map((r) => [r[0], r[1] - inset, r[2] - inset, ...r.slice(3)]);
      add(bone, key + sfx, () => loft(rr, { wave: o.wave, a0, a1, segs, cap0: false, cap1: false }), color, 0, 0, 0, { rough: o.rough ?? R.cloth });
      if (o.lining !== false) add(bone, key + sfx + 'in', () => loft(rr.map((r) => [r[0], r[1] - 0.005, r[2] - 0.005, r[3], 0.58, r[5]]), { wave: o.wave, a0, a1, segs, flip: true, cap0: false, cap1: false }), color, 0, 0, 0, { rough: o.rough ?? R.cloth });
    }
  };

  // ===== lower body =====
  const pantsRough = style === 'streetwear' || style === 'overshirt' ? R.denim : R.cloth;
  const seat = style === 'dress' ? inflate(pelvis, 0.004) : inflate(pelvis, 0.012);
  add(hips, K + 'pelvis', () => loft(fine(seat, 9)), style === 'dress' ? top : pants, 0, 0, 0, { rough: pantsRough });
  if (style === 'blazer') {
    // a belt where it shows: tucked shirts under an open jacket
    {
      add(hips, K + 'belt', () => loft(slice(inflate(pelvis, 0.017), 0.012, 0.046, 3), { cap0: false, cap1: false }), style === 'streetwear' ? '#1b1b1f' : '#3a2418', 0, 0, 0, { rough: R.leather });
      add(hips, 'buckle', () => new THREE.BoxGeometry(0.044, 0.03, 0.01), '#c9b27a', 0, 0.029, surfZ(pelvis, 0.03, 0, 0.02), { rough: R.metal });
    }
  }
  // the fly seam on trousers
  if (style !== 'dress' && style !== 'kurta') {
    add(hips, K + 'fly', () => new THREE.BoxGeometry(0.006, 0.1, 0.006), shade(pants, 0.8), 0.012, -0.05, ringAt(seat, -0.05)[2] + ringAt(seat, -0.05)[3] - 0.001);
  }

  const makeLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * HIP_X(fem), -0.03, 0);
    hips.add(hip);
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    const ankle = new THREE.Group();
    ankle.position.y = -0.43;
    knee.add(ankle);
    const bare = style === 'dress';
    const legCol = bare ? skin : pants;
    const lr = bare ? R.skin : pantsRough;
    if (bare) {
      add(hip, K + 'thighS', () => limb(THIGH), skin, 0, 0, 0, { rough: R.skin });
      add(knee, 'kneeS', () => new THREE.SphereGeometry(0.054, SEGS, 7), skin, 0, 0, 0.004, { rough: R.skin });
      add(knee, 'shinS', () => limb(SHIN), skin, 0, 0, 0, { rough: R.skin });
    } else {
      // trousers: a fuller thigh, a straight leg, a crease of shade behind the knee
      const thighP = THIGH.map(([y, r, cz = 0]) => [y, (r + 0.013) * legWide, cz, 1]);
      add(hip, K + 'thighP', () => limb(thighP), legCol, 0, 0, 0, { rough: lr });
      add(knee, K + 'kneeP', () => new THREE.SphereGeometry(0.068 * legWide, SEGS + 1, 7), legCol, 0, 0, 0.002, { rough: lr });
      const slim = style === 'kurta';
      const shinP = (slim
        ? [[0.03, 0.054], [0.0, 0.062], [-0.1, 0.064], [-0.22, 0.056], [-0.32, 0.048], [-0.39, 0.046, 0, 0.88], [-0.405, 0.046, 0, 0.9]]
        : [[0.03, 0.056], [0.0, 0.064], [-0.1, 0.067], [-0.22, 0.064], [-0.32, 0.062], [-0.39, 0.061, 0, 0.93], [-0.405, 0.061, 0, 0.9]]
      ).map(([y, r, cz = 0, k = 1]) => [y, r * legWide, cz, k]);
      add(knee, K + 'shinP', () => limb(shinP, { cap0: false }), legCol, 0, 0, 0, { rough: lr });
      add(knee, K + 'shinPin', () => limb(shinP.slice(-3).map(([y, r, cz, k]) => [y, r - 0.004, cz, 0.6]), { flip: true, cap0: false, cap1: false }), legCol, 0, 0, 0, { rough: lr });
      if (slim) for (let k = 0; k < 3; k++) add(knee, 'gather' + k, () => new THREE.TorusGeometry(0.047, 0.005, 6, SEGS + 3), shade(legCol, 0.93), 0, -0.3 - k * 0.03, 0, { r: [Math.PI / 2, 0, 0] });
      if (style === 'streetwear') add(hip, 'cargo', () => new THREE.BoxGeometry(0.03, 0.12, 0.1), shade(legCol, 0.92), side * 0.1, -0.24, 0.0, { rough: lr });
      if (style === 'techwear') add(hip, 'cargoT', () => new THREE.BoxGeometry(0.028, 0.11, 0.09), shade(legCol, 0.85), side * 0.088, -0.25, 0.01, { rough: lr });
    }
    // shoes
    const kind = style === 'kurta' ? 'jutti' : style === 'blazer' && (seed * 3) % 1 < 0.6 ? 'loafer' : style === 'techwear' ? 'boot' : style === 'dress' ? 'flat' : 'sneaker';
    addShoe(ankle, kind);
    return { hip, knee, ankle };
  };
  const addShoe = (ankle, kind) => {
    const sole = kind === 'sneaker' ? '#f7f7f5' : kind === 'boot' ? '#1b1b1f' : kind === 'jutti' ? '#6b4a2f' : '#2a1d14';
    const up = kind === 'jutti' ? '#c9a23a' : shoes;
    const hi = kind === 'boot' ? 1.0 : kind === 'sneaker' ? 0.8 : 0.55;
    const len = kind === 'jutti' ? 1.06 : 1;
    const upper = [[-0.066, 0.028, 0.032 * hi, 0.006], [-0.052, 0.04, 0.046 * hi, 0.012], [-0.02, 0.045, 0.052 * hi, 0.012], [0.04, 0.048, 0.04 * hi, -0.006], [0.1, 0.051, 0.03, -0.018], [0.155, 0.047, 0.024, -0.024], [0.19 * len, 0.036, 0.019, -0.028, 0.95], [0.212 * len, 0.016, 0.01, -0.032, 0.95]];
    add(ankle, 'shoeU' + kind, () => along(upper), up, 0, 0, 0, { rough: kind === 'sneaker' ? 0.7 : R.leather });
    if (kind !== 'jutti' && kind !== 'flat') {
      const soleR = [[-0.07, 0.03, 0.012, -0.043], [-0.055, 0.044, 0.013, -0.043], [0.0, 0.049, 0.013, -0.043], [0.1, 0.057, 0.013, -0.043], [0.17, 0.052, 0.012, -0.042], [0.205, 0.04, 0.011, -0.041], [0.222, 0.018, 0.008, -0.04]];
      add(ankle, 'sole' + kind, () => along(soleR.map(([z, w, h, y]) => [z, w + (kind === 'boot' ? 0.004 : 0), h * (kind === 'loafer' ? 0.6 : 1), y])), sole, 0, 0, 0, { rough: R.sole });
    } else {
      add(ankle, 'soleThin', () => along([[-0.064, 0.028, 0.006, -0.046], [0.0, 0.044, 0.006, -0.046], [0.12, 0.05, 0.006, -0.046], [0.2, 0.03, 0.005, -0.045], [0.215, 0.012, 0.004, -0.045]]), sole, 0, 0, 0, { rough: R.sole });
    }
    if (kind === 'sneaker') {
      add(ankle, 'laces', () => new THREE.BoxGeometry(0.03, 0.006, 0.07), '#ffffff', 0, 0.006, 0.07, { r: [-0.35, 0, 0] });
      add(ankle, 'heeltab', () => new THREE.BoxGeometry(0.02, 0.03, 0.01), shade(up, 0.8), 0, 0.03, -0.068);
    }
    if (kind === 'boot') {
      add(ankle, 'shaft', () => limb([[0.1, 0.044], [0.04, 0.045], [-0.01, 0.046]], { cap0: false }), up, 0, 0, -0.005, { rough: R.leather });
      add(ankle, 'bootlace', () => new THREE.BoxGeometry(0.026, 0.008, 0.09), '#e5e7eb', 0, 0.02, 0.05, { r: [-0.7, 0, 0] });
    }
    if (kind === 'loafer') add(ankle, 'apron', () => new THREE.TorusGeometry(0.03, 0.004, 4, 14, Math.PI), shade(up, 0.75), 0, 0.0, 0.11, { r: [-Math.PI / 2 + 0.35, 0, 0], s: [1, 1.6, 1] });
    if (kind === 'jutti') for (let k = 0; k < 3; k++) add(ankle, 'jutti' + k, () => new THREE.SphereGeometry(0.006, 6, 4), accent, (k - 1) * 0.016, -0.004, 0.12, { rough: R.metal });
  };

  // ===== torso =====
  const bodyCol = style === 'dress' ? skin : top; // the base layer is the shirt; a dress sits over skin
  const baseRough = style === 'dress' ? R.skin : style === 'streetwear' ? R.knit : R.cloth;
  const tee = style === 'streetwear';
  const base = tee ? torso.map(([y, rx, rz, cz]) => [y, rx + 0.022, rz + 0.016, cz]) : inflate(torso, 0.004);
  // shirts open at the neck show a little skin
  const openNeck = style === 'linen' || style === 'overshirt' || (style === 'blazer' && (seed * 5) % 1 < 0.5);
  if (openNeck) add(chest, K + 'vskin', () => loft(slice(inflate(torso, -0.002), 0.42, 0.59, 5), { a0: () => -0.5, a1: () => 0.5 }), skin, 0, -CHEST_Y, 0, { rough: R.skin });
  torsoAdd(K + 'base', fine(base), bodyCol, openNeck ? { a0: (i) => (i > 10 ? 0.18 * (i - 10) : 0) + 0.0001, a1: (i) => Math.PI * 2 - (i > 10 ? 0.18 * (i - 10) : 0), rough: baseRough } : { rough: baseRough });
  // untucked hems hang over the hips
  if (!tucked && style !== 'techwear') {
    const hemCol = jacket && style === 'hoodie' ? outer : bodyCol;
    const d = tee ? 0.03 : style === 'hoodie' ? 0.034 : 0.022;
    const above = style === 'hoodie' ? inflate(torso, 0.02) : base;
    const hem = tuck(clearThighs(slice(inflate(pelvis, d), -0.1, 0.05, 6), fem, legWide), above).map((r, i) => [r[0], r[1], r[2], r[3], i === 0 ? 0.9 : 1]);
    drape(K + 'hem', hem, hemCol, { rough: style === 'hoodie' ? R.knit : baseRough });
    if (style === 'hoodie') drape(K + 'rib', slice(hem, -0.1, -0.07, 3).map((r) => [r[0] - 0.004, r[1] + 0.004, r[2] + 0.004, r[3], 0.88]), hemCol, { rough: R.knit, lining: false });
  }
  // buttons and placket on shirts
  if (style === 'linen' || style === 'blazer' || style === 'overshirt' || style === 'kurta') {
    const col = style === 'blazer' || style === 'overshirt' ? top : bodyCol;
    const yTop = style === 'kurta' ? 0.56 : openNeck ? 0.44 : 0.55;
    const yBot = style === 'kurta' ? 0.36 : 0.02;
    add(chest, K + 'placket', () => loft(slice(inflate(base, 0.002), yBot, yTop, 6).map((r) => [...r.slice(0, 4), 0.94]), { a0: () => -0.07, a1: () => 0.07, segs: 2 }), style === 'kurta' ? accent : col, 0, -CHEST_Y, 0);
    for (let y = yBot + 0.03; y < yTop; y += style === 'kurta' ? 0.05 : 0.085) {
      const r = ringAt(base, y);
      const bone = y < CHEST_Y ? spine : chest;
      add(bone, 'btn', () => new THREE.SphereGeometry(0.006, 6, 4), style === 'kurta' ? '#c9a23a' : shade(col, 0.82), 0, y - (bone === chest ? CHEST_Y : 0), r[2] + r[3] + 0.004, { s: [1, 1, 0.5], rough: R.metal });
    }
  }
  // collars
  if (style === 'linen' || style === 'overshirt' || style === 'blazer') {
    const col = style === 'overshirt' ? outer : top;
    const b0 = ringAt(inflate(torso, 0.01), 0.57);
    const band = [b0, [0.6, b0[1] * 0.86, b0[2] * 0.95, b0[3] + 0.004], [0.625, b0[1] * 0.8, b0[2] * 0.9, b0[3] + 0.006]];
    add(chest, K + 'collar', () => loft(band, { a0: () => openNeck ? 0.35 : 0.08, a1: () => Math.PI * 2 - (openNeck ? 0.35 : 0.08), segs: SEG }), col, 0, -CHEST_Y, 0);
    add(chest, K + 'collarIn', () => loft(band.map((r) => [r[0], r[1] - 0.004, r[2] - 0.004, r[3], 0.7]), { a0: () => openNeck ? 0.35 : 0.08, a1: () => Math.PI * 2 - (openNeck ? 0.35 : 0.08), flip: true }), col, 0, -CHEST_Y, 0);
    for (const sx of [-1, 1]) add(chest, 'cpoint' + (openNeck ? 'o' : 'c'), () => new THREE.BoxGeometry(0.05, 0.055, 0.006), shade(col, 0.97), sx * (openNeck ? 0.055 : 0.03), 0.56 - CHEST_Y, surfZ(torso, 0.56, sx * (openNeck ? 0.055 : 0.03), 0.014), { r: [-0.5, sx * 0.25, sx * (openNeck ? 0.75 : 0.45)] });
  }
  if (style === 'kurta') {
    const b0 = ringAt(inflate(torso, 0.01), 0.575);
    const band = [b0, [0.605, b0[1] * 0.84, b0[2] * 0.94, b0[3] + 0.004], [0.625, b0[1] * 0.8, b0[2] * 0.9, b0[3] + 0.006]];
    add(chest, K + 'mandarin', () => loft(band, { a0: () => 0.1, a1: () => Math.PI * 2 - 0.1 }), accent, 0, -CHEST_Y, 0);
  }
  if (tee) add(chest, K + 'crew', () => new THREE.TorusGeometry(0.062, 0.008, 6, SEG), shade(bodyCol, 0.9), 0, 0.583 - CHEST_Y, -0.006, { r: [Math.PI / 2 - 0.12, 0, 0], s: [1.05, 0.95, 1], rough: R.knit });
  if (tee) add(chest, 'print', () => new THREE.BoxGeometry(0.12, 0.1, 0.004), accent, 0, 0.36 - CHEST_Y, surfZ(base, 0.36, 0, 0.002), { r: [-0.08, 0, 0] });

  // ----- jackets and outer layers -----
  if (jacket) {
    const lenHip = style === 'blazer' ? -0.17 : style === 'overshirt' ? -0.12 : style === 'techwear' ? -0.12 : -0.1;
    const d = style === 'hoodie' ? 0.02 : style === 'techwear' ? 0.022 : 0.016;
    const gap = style === 'hoodie' || style === 'techwear' ? () => 0 : style === 'blazer' ? (y) => (y > 0.42 ? 0.5 + (y - 0.42) * 1.2 : y > 0.18 ? 0.06 + ((y - 0.18) / 0.24) * 0.44 : 0.06 + (0.18 - y) * 1.5) : (y) => (y > 0.44 ? 0.3 + (y - 0.44) * 1.5 : 0.07 + Math.max(0, 0.1 - y) * 0.6);
    const shell = fine(inflate(torso, d).filter((r) => r[0] <= 0.57), 14);
    const opts = style === 'hoodie' || style === 'techwear' ? { rough: style === 'hoodie' ? R.knit : 0.6 } : { a0: (i) => gap(shell[i][0]), a1: (i) => Math.PI * 2 - gap(shell[i][0]), rough: R.cloth };
    torsoAdd(K + 'jacket', shell, outer, opts, -1);
    if (!opts.a0) add(chest, K + 'jfill', () => new THREE.SphereGeometry(1, SEG, 6), outer, 0, 0, ringAt(shell, CHEST_Y)[3], { s: [ringAt(shell, CHEST_Y)[1] - 0.004, 0.05, ringAt(shell, CHEST_Y)[2] - 0.004] });
    else torsoAdd(K + 'jlining', shell.map((r) => [r[0], r[1] - 0.004, r[2] - 0.004, r[3], 0.6]), outer, { a0: (i) => gap(shell[i][0]), a1: (i) => Math.PI * 2 - gap(shell[i][0]), flip: true }, -1);
    // the jacket's hip skirt
    const skirt = tuck(clearThighs(slice(inflate(pelvis, d + 0.014), lenHip, 0.06, 6), fem, legWide, 0.02), inflate(torso, d), 0.04).map((r, i) => [r[0], r[1] + (i === 0 ? 0.006 : 0), r[2] + (i === 0 ? 0.004 : 0), r[3], i === 0 ? 0.94 : 1]);
    const sk = opts.a0 ? { a0: (i) => gap(skirt[i][0]) + 0.05, a1: (i) => Math.PI * 2 - gap(skirt[i][0]) - 0.05 } : {};
    drape(K + 'jskirt', skirt, outer, { ...sk, rough: opts.rough });
    if (style === 'blazer') {
      // notched lapels lying on the chest
      const lap = slice(inflate(torso, d + 0.006), 0.2, 0.56, 9);
      const w = (y) => (y < 0.24 ? 0.05 + (y - 0.2) * 3 : y < 0.47 ? 0.17 + (y - 0.24) * 1.1 : y < 0.5 ? 0.12 : 0.2);
      for (const sx of [-1, 1]) {
        const a0 = sx > 0 ? (i) => gap(lap[i][0]) : (i) => Math.PI * 2 - gap(lap[i][0]) - w(lap[i][0]);
        const a1 = sx > 0 ? (i) => gap(lap[i][0]) + w(lap[i][0]) : (i) => Math.PI * 2 - gap(lap[i][0]);
        add(chest, K + 'lapel' + sx, () => loft(lap.map((r) => [...r.slice(0, 4), 0.9]), { a0, a1, segs: 4 }), outer, 0, -CHEST_Y, 0);
      }
      // buttons, flap pockets and a pocket square
      for (const y of [0.17, 0.09]) add(spine, 'jbtn', () => new THREE.CylinderGeometry(0.009, 0.009, 0.005, 10), shade(outer, 0.6), 0.0, y, ringAt(shell, y)[2] + ringAt(shell, y)[3] + 0.004, { r: [Math.PI / 2, 0, 0], rough: R.metal });
      for (const sx of [-1, 1]) {
        const r = ringAt(skirt, -0.05);
        add(skirtF, 'flap', () => new THREE.BoxGeometry(0.09, 0.03, 0.01), shade(outer, 0.92), sx * r[1] * 0.62, -0.05 - PIV, surfZ(skirt, -0.05, r[1] * 0.62, 0.004), { r: [0, sx * 0.6, 0] });
      }
      const pr = ringAt(shell, 0.42);
      add(chest, 'square', () => new THREE.BoxGeometry(0.05, 0.02, 0.006), accent, -pr[1] * 0.5, 0.425 - CHEST_Y, surfZ(shell, 0.425, pr[1] * 0.5, 0.003), { r: [0, -0.45, 0.06] });
      if ((seed * 19) % 1 < 0.35) add(chest, 'tie', () => loft([[0.18, 0.004, 0.003, 0, 1], [0.24, 0.022, 0.004], [0.5, 0.014, 0.004], [0.54, 0.016, 0.006]], { segs: 6 }), accent, 0, -CHEST_Y, 0.004);
    }
    if (style === 'overshirt') {
      for (const sx of [-1, 1]) {
        const r = ringAt(shell, 0.4);
        add(chest, 'opocket', () => new THREE.BoxGeometry(0.075, 0.085, 0.008), shade(outer, 0.95), sx * r[1] * 0.45, 0.4 - CHEST_Y, surfZ(shell, 0.4, r[1] * 0.45, 0.002), { r: [-0.05, sx * 0.45, 0] });
        add(chest, 'oflap', () => new THREE.BoxGeometry(0.08, 0.025, 0.012), shade(outer, 0.85), sx * r[1] * 0.45, 0.445 - CHEST_Y, surfZ(shell, 0.445, r[1] * 0.45, 0.005), { r: [-0.1, sx * 0.45, 0] });
      }
    }
    if (style === 'hoodie') {
      // kangaroo pocket, a hood lying on the shoulders, drawstrings and ribbed cuffs
      const kp = slice(inflate(torso, d + 0.004), 0.02, 0.17, 4);
      add(spine, K + 'kanga', () => loft(kp.map((r, i) => [...r.slice(0, 4), i === kp.length - 1 ? 0.88 : 0.97]), { a0: (i) => -0.85 + i * 0.07, a1: (i) => 0.85 - i * 0.07, segs: 8 }), outer, 0, 0, 0, { rough: R.knit });
      add(chest, 'hood' + sex, () => new THREE.TorusGeometry(0.115, 0.042, 10, SEG, Math.PI * 1.35), shade(outer, 0.95), 0, 0.565 - CHEST_Y, -0.03, { r: [Math.PI / 2 + 0.35, 0, Math.PI * 1.825], s: [1.1, 1.05, 1], rough: R.knit });
      for (const sx of [-1, 1]) {
        add(chest, 'dstring', () => new THREE.CylinderGeometry(0.004, 0.004, 0.13, 5), '#f4f4f2', sx * 0.035, 0.44 - CHEST_Y, surfZ(shell, 0.44, 0.035, 0.005));
        add(chest, 'aglet', () => new THREE.CylinderGeometry(0.006, 0.006, 0.02, 6), '#c9c9c9', sx * 0.035, 0.37 - CHEST_Y, surfZ(shell, 0.37, 0.035, 0.007), { rough: R.metal });
      }
    }
    if (style === 'techwear') {
      // zip, high collar, chest pocket zip and a sling bag
      add(chest, K + 'tcollar', () => loft([[0.55, 0.07, 0.066, -0.004], [0.6, 0.066, 0.062, -0.002], [0.64, 0.064, 0.06, 0.0]], { cap0: false, cap1: false }), outer, 0, -CHEST_Y, 0, { rough: 0.6 });
      add(chest, K + 'tcollarIn', () => loft([[0.55, 0.066, 0.062, -0.004], [0.64, 0.06, 0.056, 0.0]], { cap0: false, cap1: false, flip: true }), shade(outer, 0.6), 0, -CHEST_Y, 0);
      add(chest, K + 'zip', () => loft(slice(inflate(torso, d + 0.002), CHEST_Y, 0.55, 6), { a0: () => -0.025, a1: () => 0.025, segs: 1 }), '#9ca3af', 0, -CHEST_Y, 0, { rough: R.metal });
      add(spine, K + 'zipL', () => loft(slice(inflate(torso, d + 0.002), 0.0, CHEST_Y, 4), { a0: () => -0.025, a1: () => 0.025, segs: 1 }), '#9ca3af', 0, 0, 0, { rough: R.metal });
      add(chest, 'strap', () => new THREE.BoxGeometry(0.035, 0.6, 0.012), accent, 0.0, 0.3 - CHEST_Y, surfZ(shell, 0.3, 0, 0.008), { r: [0, 0, 0.72] });
      add(spine, 'sling', () => new THREE.BoxGeometry(0.17, 0.11, 0.06), '#1b1b1f', -0.1, 0.06, surfZ(shell, 0.06, 0.1, 0.03), { r: [0, 0, 0.2], rough: 0.5 });
    }
  }
  // kurta: a long tunic with side slits and an embroidered hem; a dupatta for women
  if (style === 'kurta') {
    const flare = (y) => Math.max(0, -y - 0.05) * 0.18;
    const body = clearThighs(slice(inflate(pelvis, 0.026), -0.17, 0.05, 6), fem, legWide, 0.016);
    const long = [[-0.62, 0.198, 0.15, -0.01], [-0.45, 0.19, 0.142, -0.01], [-0.3, 0.183, 0.135, -0.008], ...body].map(([y, rx, rz, cz, k = 1]) => [y, rx + flare(y), rz + flare(y) * 0.6, cz, y < -0.58 ? 0.94 : k]);
    const all = clearThighs(slice(long, -0.62, 0.05, 14), fem, legWide, 0.03);
    const upper = all.filter((r) => r[0] >= -0.37);
    const lower = all.filter((r) => r[0] <= -0.36);
    drape(K + 'kurtaU', upper, top);
    const half = 1.47;
    const sh = (rr) => rr.map((r) => [r[0] - PIV, ...r.slice(1)]);
    for (const [c, label, bone] of [[0, 'F', skirtF], [Math.PI, 'B', skirtB]]) {
      const lw = sh(lower).map((r) => (label === 'B' ? [r[0], r[1] - 0.003, r[2] - 0.003, ...r.slice(3)] : r));
      add(bone, K + 'kurta' + label, () => loft(lw, { a0: () => c - half, a1: () => c + half }), top, 0, 0, 0);
      add(bone, K + 'kurtaIn' + label, () => loft(lw.map((r) => [r[0], r[1] - 0.005, r[2] - 0.005, r[3], 0.6]), { a0: () => c - half, a1: () => c + half, flip: true }), top, 0, 0, 0);
      add(bone, K + 'border' + label, () => loft(slice(inflate(lw, 0.002), -0.62 - PIV, -0.585 - PIV, 2), { a0: () => c - half, a1: () => c + half }), accent, 0, 0, 0);
    }
    if (fem) add(chest, 'dupatta', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.14, 0.3, 0.14), new THREE.Vector3(0.05, 0.42, 0.15), new THREE.Vector3(-0.12, 0.56, 0.08), new THREE.Vector3(-0.2, 0.55, -0.06), new THREE.Vector3(-0.17, 0.3, -0.13), new THREE.Vector3(-0.15, 0.05, -0.12)]), 40, 0.022, 6), accent, 0, -CHEST_Y, 0, { s: [1, 1, 1] });
  }
  // dress: a fitted bodice over the skin torso and a pleated skirt
  if (style === 'dress') {
    const bod = fine(inflate(torso, 0.008).filter((r) => r[0] <= 0.5), 12);
    torsoAdd(K + 'bodice', bod, top, { rough: R.cloth });
    add(chest, K + 'bodiceTop', () => loft(slice(inflate(torso, 0.0085), 0.48, 0.52, 3), { a0: () => 0.75, a1: () => Math.PI * 2 - 0.75 }), top, 0, -CHEST_Y, 0);
    add(spine, K + 'sash', () => loft(slice(inflate(torso, 0.012), 0.0, 0.04, 2), { cap0: false, cap1: false }), accent, 0, 0, 0);
    const sk = [[-0.5, 0.3, 0.26, 0.0, 0.92], [-0.38, 0.262, 0.226, 0.0], [-0.22, 0.212, 0.18, -0.004], [-0.08, 0.17, 0.13, -0.006], [0.03, 0.14, 0.104, -0.004]];
    const pleat = (th, i) => 1 + Math.sin(th * 9) * 0.035 * (1 - i / (sk.length - 1));
    drape(K + 'skirt', fine(sk, 8), top, { wave: (th, i) => pleat(th, i / 1.75) });
  }
  if (opts.lanyard) add(chest, 'badge', () => new THREE.BoxGeometry(0.06, 0.08, 0.008), '#ffffff', 0.08, 0.36 - CHEST_Y, surfZ(base, 0.36, 0.08, 0.02));
  // tote bag on the shoulder
  if (!opts.noBag && (seed * 23) % 1 < 0.22) {
    const col = pickS(['#e9e2d6', '#1b1b1f', accent], 2.9);
    add(spine, 'tote', () => loft([[-0.14, 0.12, 0.03], [0.14, 0.13, 0.034]], { segs: 8 }), col, -0.27 + (fem ? 0.03 : 0), 0.05, -0.02, { r: [0, 0, 0.1] });
    add(chest, 'totestrap', () => new THREE.BoxGeometry(0.02, 0.36, 0.012), shade(col, 0.8), -0.23 + (fem ? 0.03 : 0), 0.18, -0.01, { r: [0, 0, 0.1] });
  }

  // ===== neck and head =====
  add(neck, sex + 'neck', () => limb(fem ? [[0.13, 0.045, 0.006], [0.06, 0.047], [0.0, 0.054, -0.004], [-0.03, 0.06, -0.006]] : [[0.13, 0.053, 0.006], [0.06, 0.056], [0.0, 0.063, -0.006], [-0.03, 0.07, -0.008]]), skin, 0, 0, 0, { rough: R.skin });
  if (!fem) add(neck, 'adam', () => new THREE.SphereGeometry(0.012, 8, 6), skin, 0, 0.06, 0.046, { s: [1, 1.3, 0.8], rough: R.skin });
  const hr = HEAD[sex];
  add(head, sex + 'skull', () => loft(fine(hr, LITE ? 11 : 14), { segs: LITE ? 12 : 22 }), skin, 0, 0, 0, { rough: R.skin });
  // face
  const lip = mix(skin, '#8a3a3a', fem ? 0.38 : 0.22);
  const ez = surfZ(hr, 0.016, 0.037) - 0.008;
  const bz = surfZ(hr, 0.046, 0.039) + 0.003;
  for (const sx of [-1, 1]) {
    add(head, 'eyeW', () => new THREE.SphereGeometry(0.0155, 8, 6), '#f4f1ea', sx * 0.037, 0.016, ez, { rough: R.eye });
    add(head, 'iris', () => new THREE.CircleGeometry(0.0085, 14), '#3a2414', sx * 0.037, 0.016, ez + 0.0153, { rough: R.eye });
    add(head, 'pupil', () => new THREE.CircleGeometry(0.0042, 10), '#0a0706', sx * 0.037, 0.016, ez + 0.0157, { rough: R.eye });
    add(head, 'glint', () => new THREE.CircleGeometry(0.0018, 6), '#ffffff', sx * 0.037 + 0.003, 0.019, ez + 0.0159, { rough: R.eye });
    add(head, 'lid', () => new THREE.SphereGeometry(0.0172, 10, 4, 0, Math.PI * 2, 0, Math.PI * 0.42), shade(skin, 0.9), sx * 0.037, 0.017, ez - 0.0005, { r: [0.35, 0, 0], rough: R.skin });
    add(head, 'lidLow', () => new THREE.SphereGeometry(0.0166, 10, 2, 0, Math.PI * 2, Math.PI * 0.72, Math.PI * 0.2), skin, sx * 0.037, 0.016, ez - 0.0002, { rough: R.skin });
    add(head, 'brow' + sex, () => new THREE.CapsuleGeometry(fem ? 0.0042 : 0.006, 0.028, 2, 4), hair, sx * 0.039, 0.046, bz, { r: [0, sx * 0.25, Math.PI / 2 + sx * 0.12], rough: R.hair });
    if (!LITE) add(head, 'ear', () => new THREE.TorusGeometry(0.019, 0.0075, 4, 10), skin, sx * 0.086, 0.002, -0.008, { r: [0, sx * 1.35, 0], s: [0.8, 1.3, 1], rough: R.skin });
    add(head, 'earF', () => new THREE.SphereGeometry(0.017, 6, 4), shade(skin, 0.94), sx * 0.083, 0.0, -0.008, { s: [0.45, 1.15, 0.9], rough: R.skin });
    add(head, 'ala', () => new THREE.SphereGeometry(0.0105, 6, 4), skin, sx * 0.014, -0.028, 0.106, { rough: R.skin });
  }
  add(head, 'bridge', () => new THREE.CylinderGeometry(0.0085, 0.014, 0.046, 8), skin, 0, -0.004, 0.106, { r: [-0.38, 0, 0], rough: R.skin });
  add(head, 'tip', () => new THREE.SphereGeometry(0.0135, 8, 6), skin, 0, -0.026, 0.115, { rough: R.skin });
  add(head, 'lipU', () => new THREE.CapsuleGeometry(0.0075, 0.026, 2, 6), lip, 0, -0.054, 0.1, { r: [0, 0, Math.PI / 2], s: [1, 1, 0.8], rough: 0.45 });
  add(head, 'lipL', () => new THREE.CapsuleGeometry(0.0085, 0.022, 2, 6), lip, 0, -0.066, 0.098, { r: [0, 0, Math.PI / 2], s: [1, 1, 0.8], rough: 0.45 });
  add(head, 'mouth', () => new THREE.BoxGeometry(0.034, 0.002, 0.004), shade(lip, 0.5), 0, -0.0605, 0.1045, { rough: 0.5 });

  // hair: a shell hugging the skull with a hairline, plus the style's volume
  const H = (key, make, x = 0, y = 0, z = 0, o = {}) => add(head, key, make, hair, x, y, z, { rough: R.hair, ...o });
  const shell = (d, yb, face = 1.15, line = 0.068, key = '') =>
    H(`shell${sex}${d}${yb}${face}${line}${key}`, () => {
      const rr = slice(inflate(hr, d), yb, 0.138, 10);
      const g = (i) => (rr[i][0] < line ? face : rr[i][0] < line + 0.03 ? face * (1 - (rr[i][0] - line) / 0.03) : 0);
      return loft(rr, { a0: (i) => g(i) + 0.0001, a1: (i) => Math.PI * 2 - g(i) - 0.0001, segs: LITE ? 14 : 20 });
    });
  switch (hairStyle) {
    case 'quiff':
      shell(0.007, -0.03);
      H('quiff', () => new THREE.SphereGeometry(0.06, 14, 10), 0, 0.105, 0.045, { s: [1.35, 0.62, 1.05], r: [-0.3, 0, 0] });
      break;
    case 'fade':
      shell(0.004, -0.03, 1.15, 0.068, 'f');
      H('fadetop', () => new THREE.SphereGeometry(0.075, 14, 10), 0, 0.098, 0.015, { s: [1.12, 0.52, 1.25] });
      break;
    case 'curly':
      shell(0.01, -0.02);
      for (let k = 0; k < (LITE ? 22 : 30); k++) {
        // a golden-angle spiral over the top of the head
        const a = k * 2.39996;
        const t = Math.sqrt((k + 0.5) / (LITE ? 22 : 30));
        // curls stay above the hairline at the front and fall lower at the back and sides
        const drop = Math.cos(a) > 0 ? 0.05 + (1 - Math.cos(a)) * 0.05 : 0.1;
        const y = 0.13 - t * drop;
        const rr = ringAt(hr, y);
        const narrow = Math.sqrt(Math.max(0, 1 - ((y - 0.13) / 0.14) ** 2)) * 0.6 + 0.4;
        H('curl', () => new THREE.IcosahedronGeometry(0.022, LITE ? 0 : 1), Math.sin(a) * (rr[1] + 0.006) * Math.min(1, t * 1.1) * narrow, y + 0.012, rr[3] + Math.cos(a) * (rr[2] + 0.006) * Math.min(1, t * 1.1) * narrow);
      }
      break;
    case 'bob':
      // a chin-length bob: the hair falls straight to the jaw all round, framing the face, with a
      // soft side-swept fringe
      shell(0.011, -0.105, 1.0, 0.06, 'bob');
      H('bobfringe', () => new THREE.SphereGeometry(0.06, 14, 10), 0.012, 0.1, 0.05, { s: [1.3, 0.42, 0.9], r: [-0.25, 0, 0.12] });
      for (const sx of [-1, 1]) H('bobend' + sx, () => new THREE.SphereGeometry(0.03, 10, 8), sx * 0.088, -0.085, -0.005, { s: [0.8, 0.7, 1.4] });
      break;
    case 'long':
    case 'wavy':
    case 'bun':
    case 'pony':
    case 'crop':
    default: {
      const long = hairStyle === 'long' || (hairStyle === 'wavy' && fem);
      shell(0.008, long ? -0.075 : -0.03, long ? 0.95 : 1.15, long ? 0.06 : 0.068);
      if (long) {
        // the back fall: from the crown down past the shoulders, open towards the face
        const fall = [[-0.36, 0.1, 0.05, -0.07, 0.9], [-0.25, 0.108, 0.06, -0.075], [-0.12, 0.104, 0.075, -0.06], [-0.02, 0.098, 0.1, -0.03], [0.06, 0.098, 0.112, -0.016]];
        const lim = { a0: (i) => Math.PI / 2 + 0.25 - (i > 2 ? 0.5 : 0), a1: (i) => Math.PI * 1.5 - 0.25 + (i > 2 ? 0.5 : 0), segs: 14 };
        H('fall' + sex, () => loft(fine(fall, 8), { ...lim, wave: hairStyle === 'wavy' ? (th) => 1 + Math.sin(th * 7) * 0.05 : undefined }));
        H('fallIn' + sex, () => loft(fine(fall, 8).map((r) => [r[0], r[1] - 0.005, r[2] - 0.005, r[3], 0.6]), { ...lim, flip: true }));
      }
      if (hairStyle === 'bun') {
        H('bun', () => new THREE.SphereGeometry(0.05, 14, 10), 0, 0.105, -0.075, { s: [1, 0.9, 1] });
        add(head, 'bunband', () => new THREE.TorusGeometry(0.036, 0.007, 6, 14), accent, 0, 0.088, -0.064, { r: [1.1, 0, 0] });
      }
      if (hairStyle === 'pony') {
        H('ponyk', () => new THREE.SphereGeometry(0.03, 10, 8), 0, 0.055, -0.112);
        add(head, 'ponyband', () => new THREE.TorusGeometry(0.022, 0.006, 6, 12), accent, 0, 0.05, -0.122, { r: [0.4, 0, 0] });
        H('ponyt', () => limb([[0.0, 0.028], [-0.08, 0.034], [-0.18, 0.024], [-0.24, 0.01]]), 0, 0.04, -0.13, { r: [0.25, 0, 0] });
      }
      if (hairStyle === 'wavy') for (let k = 0; k < 6; k++) H('wave', () => new THREE.SphereGeometry(0.034, 10, 8), -0.075 + k * 0.03, 0.108 + Math.sin(k * 1.7) * 0.008, 0.048, { s: [1, 0.8, 1] });
      if (hairStyle === 'crop') H('cropfr', () => new THREE.SphereGeometry(0.05, 12, 8), 0, 0.105, 0.04, { s: [1.4, 0.45, 1] });
    }
  }
  if (beard) {
    const bc = mix(hair, skin, 0.22);
    // chin and jaw, then the cheeks on either side of the mouth up to the sideburns
    add(head, 'beardC' + sex, () => loft(slice(inflate(hr, 0.005), -0.13, -0.074, 5), { a0: () => -1.6, a1: () => 1.6, segs: 16 }), bc, 0, 0, 0, { rough: R.hair });
    const edge = (i) => 0.36 + i * 0.11;
    for (const sx of [-1, 1]) add(head, 'beardS' + sx + sex, () => loft(slice(inflate(hr, 0.005), -0.076, 0.004, 6), sx > 0 ? { a0: edge, a1: () => 1.62, segs: 8 } : { a0: () => -1.62, a1: (i) => -edge(i), segs: 8 }), bc, 0, 0, 0, { rough: R.hair });
    add(head, 'stache', () => new THREE.CapsuleGeometry(0.0075, 0.044, 4, 8), bc, 0, -0.043, 0.104, { r: [0, 0, Math.PI / 2], rough: R.hair });
  }
  // accessories
  const acc = opts.accessory ?? pickS(['none', 'glasses', 'none', 'cap', 'earrings', 'shades', 'none', 'headphones', 'beanie'], 9.7);
  if (acc === 'glasses' || acc === 'shades') {
    const rim = acc === 'shades' ? '#111111' : '#2b2b2b';
    for (const sx of [-1, 1]) {
      add(head, 'rim', () => new THREE.TorusGeometry(0.022, 0.0035, 6, 18), rim, sx * 0.037, 0.016, 0.112, { s: [1.15, 0.9, 1], rough: R.metal });
      if (acc === 'shades') add(head, 'lens', () => new THREE.CircleGeometry(0.022, 16), '#0d0d0f', sx * 0.037, 0.016, 0.113, { s: [1.15, 0.9, 1], rough: R.eye });
      add(head, 'temple', () => new THREE.BoxGeometry(0.003, 0.003, 0.11), rim, sx * 0.083, 0.02, 0.058, { r: [0, sx * 0.06, 0], rough: R.metal });
    }
    add(head, 'bridgeG', () => new THREE.BoxGeometry(0.024, 0.003, 0.003), rim, 0, 0.022, 0.113, { rough: R.metal });
  } else if (acc === 'cap' && !fem) {
    add(head, 'capc', () => loft(slice(inflate(hr, 0.014), 0.035, 0.139, 6), { segs: SEG }), accent, 0, 0, 0);
    add(head, 'brim', () => new THREE.CylinderGeometry(0.075, 0.078, 0.008, 18, 1, false, -Math.PI / 2, Math.PI), shade(accent, 0.85), 0, 0.045, 0.1, { s: [1.15, 1, 1.05], r: [0.12, 0, 0] });
    add(head, 'capbtn', () => new THREE.SphereGeometry(0.01, 8, 6), shade(accent, 0.8), 0, 0.142, -0.014);
  } else if (acc === 'beanie') {
    const col = pickS(['#e48b78', '#2f4f6b', '#f2c94c', '#1b1b1f'], 4.1);
    add(head, 'beanie' + sex, () => loft([...slice(inflate(hr, 0.015), 0.04, 0.139, 6), [0.15, 0.0, 0.0, -0.016]], { segs: SEG, wave: (th) => 1 + Math.sin(th * 18) * 0.012 }), col, 0, 0, 0, { rough: R.knit });
    add(head, 'cuffB' + sex, () => loft(slice(inflate(hr, 0.019), 0.035, 0.065, 2), { cap0: false, cap1: false }), shade(col, 0.9), 0, 0, 0, { rough: R.knit });
  } else if (acc === 'earrings' && fem) {
    for (const sx of [-1, 1]) add(head, 'ear-ring', () => new THREE.TorusGeometry(0.012, 0.0028, 6, 14), '#d9b04a', sx * 0.09, -0.035, -0.004, { r: [0, sx * 1.3, 0], rough: R.metal });
  } else if (acc === 'headphones') {
    add(head, 'band', () => new THREE.TorusGeometry(0.117, 0.01, 6, 24, Math.PI), '#1b1b1f', 0, 0.02, -0.01, { rough: 0.4 });
    for (const sx of [-1, 1]) add(head, 'cup', () => new THREE.CylinderGeometry(0.038, 0.038, 0.03, 16), '#1b1b1f', sx * 0.1, 0.0, -0.01, { r: [0, 0, Math.PI / 2], rough: 0.4 });
  }

  // ===== arms =====
  const sleeveCol = jacket ? outer : style === 'kurta' || style === 'dress' ? top : top;
  const armKind = sleeves;
  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * shoulderX, SHOULDER_Y - CHEST_Y, -0.006);
    chest.add(shoulder);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    const wrist = new THREE.Group();
    wrist.position.y = -0.255;
    elbow.add(wrist);
    const u = fem ? 0.88 : 1;
    const upper = UPPER.map(([y, r, cz = 0]) => [y, r * u, cz]);
    const fore = FORE.map(([y, r, cz = 0]) => [y, r * u, cz]);
    // shoulder cap (deltoid), in the sleeve colour unless the arm is bare
    const bareShoulder = false;
    add(shoulder, sex + 'delt' + (bareShoulder ? 's' : ''), () => new THREE.SphereGeometry(0.058 * u, SEGS, 7), bareShoulder ? skin : sleeveCol, side * -0.012, -0.02, 0, { s: [1, 1.0, 0.92], rough: bareShoulder ? R.skin : R.cloth });
    if (armKind === 'long') {
      const su = upper.map(([y, r, cz]) => [y, y > 0.03 ? r + 0.01 : Math.min(r + 0.013, y < -0.28 ? 0.05 * u : 1), cz]);
      add(shoulder, K + 'slvU', () => limb(su), sleeveCol, 0, 0, 0);
      add(elbow, K + 'elbS', () => new THREE.SphereGeometry(0.056 * u, SEGS, 7), sleeveCol, 0, 0, 0);
      const sf = [[0.02, 0.044 * u], [0.0, 0.05 * u], [-0.08, 0.052 * u, -0.002], [-0.18, 0.047 * u], [-0.235, 0.044 * u, 0, 0.92]];
      add(elbow, K + 'slvF', () => limb(sf, { cap0: false }), sleeveCol, 0, 0, 0);
      add(elbow, K + 'slvFin', () => limb(sf.slice(-2).map(([y, r, cz, k]) => [y, r - 0.004, cz, 0.6]), { flip: true, cap0: false, cap1: false }), sleeveCol, 0, 0, 0);
      add(elbow, K + 'foreS', () => limb(fore.filter((r) => r[0] < -0.2)), skin, 0, 0, 0, { rough: R.skin });
      // shirt cuff under a jacket sleeve; ribbed cuffs on knits
      if (style === 'blazer') add(elbow, 'shirtcuff', () => limb([[-0.22, 0.042], [-0.25, 0.04]]), top, 0, 0, 0);
      if (style === 'hoodie') add(elbow, 'ribcuff' + sex, () => limb([[-0.215, 0.046 * u, 0, 0.88], [-0.25, 0.038 * u, 0, 0.88]]), sleeveCol, 0, 0, 0, { rough: R.knit });
    } else {
      // bare forearm (and upper arm for short sleeves)
      const shortArm = armKind === 'short';
      add(shoulder, sex + 'upperS' + shortArm, () => limb(shortArm ? upper.filter((r) => r[0] <= -0.04) : upper), skin, 0, 0, 0, { rough: R.skin });
      add(elbow, sex + 'elbowS', () => new THREE.SphereGeometry(0.04 * u, SEGS, 7), skin, 0, 0, 0, { rough: R.skin });
      add(elbow, sex + 'foreS', () => limb(fore), skin, 0, 0, 0, { rough: R.skin });
      if (armKind === 'short' || armKind === 'cap') {
        const len = armKind === 'cap' ? -0.07 : tee ? -0.2 : -0.14;
        const wide = tee ? 0.022 : 0.012;
        const ss = [[0.04, upper[0][1] + wide + 0.006], [-0.05, upper[1][1] + wide], [len, (tee ? 0.072 : 0.06) * u, 0, 0.94]];
        add(shoulder, K + 'slvS', () => limb(ss, { cap0: false }), sleeveCol, 0, 0, 0, { rough: baseRough === R.skin ? R.cloth : baseRough });
        add(shoulder, K + 'slvSin', () => limb(ss.map(([y, r, cz, k]) => [y, r - 0.004, cz, 0.55]), { flip: true, cap0: false, cap1: false }), sleeveCol, 0, 0, 0);
      } else if (armKind === 'rolled') {
        const su = upper.map(([y, r, cz]) => [y, y > 0.03 ? r + 0.01 : Math.min(r + 0.013, y < -0.28 ? 0.05 * u : 1), cz]);
        add(shoulder, K + 'slvU', () => limb(su), sleeveCol, 0, 0, 0);
        add(elbow, K + 'elbS', () => new THREE.SphereGeometry(0.056 * u, SEGS, 7), sleeveCol, 0, 0, 0);
        // the rolled cuff: a fat ring of cloth with the sleeve tucked inside it
        add(elbow, 'roll' + sex, () => new THREE.TorusGeometry(0.047 * u, 0.017, 10, SEGS + 4), shade(sleeveCol, 0.96), 0, -0.05, 0, { r: [Math.PI / 2, 0, 0] });
        add(elbow, 'rollB' + sex, () => limb([[0.02, 0.046 * u], [-0.04, 0.044 * u]], { cap0: false }), sleeveCol, 0, 0, 0);
      }
    }
    // the hand: palm, two-bone fingers that curl, and a thumb
    const fingers = new THREE.Group();
    fingers.position.set(0, -0.082, 0.004);
    wrist.add(fingers);
    const tips = new THREE.Group();
    tips.position.y = -0.03;
    fingers.add(tips);
    add(wrist, sex + 'palm', () => loft([[-0.088, 0.013, 0.036, 0.004], [-0.06, 0.016, 0.042, 0.004], [-0.025, 0.017, 0.038, 0.002], [0.0, 0.016, 0.028, 0.0]], { segs: 10 }), skin, 0, 0, 0, { s: [u, u, u], rough: R.skin });
    if (LITE) {
      // on phones: the four fingers as one shaped block per joint
      add(fingers, 'mitt' + sex, () => loft([[-0.034, 0.008, 0.03, 0.0], [-0.012, 0.009, 0.036, 0.0], [0.0, 0.009, 0.035, 0.0]], { segs: 8 }), skin, 0, 0, 0, { s: [u, u, u], rough: R.skin });
      add(tips, 'mittT' + sex, () => loft([[-0.028, 0.006, 0.02, 0.0], [-0.01, 0.008, 0.032, 0.0], [0.004, 0.008, 0.034, 0.0]], { segs: 8 }), skin, 0, 0, 0, { s: [u, u, u], rough: R.skin });
    } else {
      for (let k = 0; k < 4; k++) {
        const z = (0.027 - k * 0.018) * u;
        const L = [0.03, 0.033, 0.031, 0.025][k] * u;
        add(fingers, 'fing' + k + sex, () => new THREE.CapsuleGeometry(0.0085 * u, L, 2, 5), skin, 0, -L / 2, z, { rough: R.skin });
        add(tips, 'tip' + k + sex, () => new THREE.CapsuleGeometry(0.0078 * u, L * 0.75, 2, 5), skin, 0, -L * 0.4 + 0.004, z, { rough: R.skin });
      }
    }
    add(wrist, 'thumb' + sex, () => new THREE.CapsuleGeometry(0.0098 * u, 0.04 * u, 3, 6), skin, side * -0.013, -0.045, 0.035 * u, { r: [0.55, 0, side * 0.35], rough: R.skin });
    return { shoulder, elbow, wrist, fingers, tips, side };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  if (opts.watch || (seed * 31) % 1 < 0.3) {
    add(armL.elbow, 'watch', () => new THREE.TorusGeometry(0.034, 0.008, 6, 16), opts.watch ? '#1a1a1a' : '#c9a23a', 0, -0.225, 0, { r: [Math.PI / 2, 0, 0], s: [1, 1.1, 1], rough: R.metal });
    add(armL.elbow, 'watchface', () => new THREE.CylinderGeometry(0.014, 0.014, 0.006, 14), '#e5e7eb', -0.033, -0.225, 0.0, { r: [0, 0, Math.PI / 2], rough: R.eye });
  }
  rig.build(root);

  const scale = opts.scale ?? (fem ? 0.94 : 0.98) + ((seed * 17) % 1) * 0.08;
  root.scale.setScalar(scale);
  return { root, parts: { tilt, hips, spine, chest, neck, head, armL, armR, legL, legR, skirtF, skirtB }, skirtK: style === 'kurta' || style === 'dress' ? 0.92 : 0.8, skirtMax: style === 'kurta' || style === 'dress' ? 1.4 : 0.45, phase: seed * 10, props: {}, look: 0, lookW: 0, react: null };
}

export { CHEST_Y, SHOULDER_Y };
