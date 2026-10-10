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

const PERSON_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.68 });
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
    const g = geo.clone();
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

export function makePerson(opts = {}) {
  const seed = opts.seed ?? Math.random();
  const skin = opts.skin || pick(SKINS, seed);
  const hair = opts.hair || pick(HAIRS, seed * 1.7);
  const top = opts.top || (seed % 0.5 < 0.28 ? opts.accent : pick(NEUTRAL_TOPS, seed * 2.3)) || '#e9edf2';
  const pants = opts.pants || pick(PANTS, seed * 3.1);
  const longHair = opts.longHair ?? (seed * 7) % 1 < 0.45;
  const beard = opts.beard ?? (!longHair && (seed * 11) % 1 < 0.5);
  const sleeves = opts.sleeves ?? ((seed * 13) % 1 < 0.5 ? 'long' : 'short');
  const accent = opts.accent || '#2f6bff';
  const rig = new Rig();

  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  root.add(hips);
  const chest = new THREE.Group();
  hips.add(chest);

  rig.add(hips, G('pelvis', () => new THREE.CapsuleGeometry(0.15, 0.14, 4, 10)), pants, 0, 0, 0, { r: [0, 0, Math.PI / 2], s: [1, 1, 0.8] });
  rig.add(chest, G('torso', () => new THREE.CylinderGeometry(0.205, 0.165, 0.52, 14)), top, 0, 0.29, 0, { s: [1, 1, 0.72] });
  rig.add(chest, G('shoulders', () => new THREE.CapsuleGeometry(0.1, 0.32, 4, 10)), top, 0, 0.5, 0, { r: [0, 0, Math.PI / 2], s: [1, 1, 0.85] });
  if (opts.lanyard !== false) {
    rig.add(chest, G('lanyard', () => new THREE.TorusGeometry(0.13, 0.012, 4, 16, Math.PI)), accent, 0, 0.5, 0.06, { r: [Math.PI / 2 + 0.6, 0, Math.PI] });
    rig.add(chest, G('badge', () => new THREE.BoxGeometry(0.07, 0.09, 0.01)), '#ffffff', 0, 0.33, 0.13);
  }
  rig.add(chest, G('neck', () => new THREE.CylinderGeometry(0.055, 0.065, 0.12, 8)), skin, 0, 0.6, 0);
  const head = new THREE.Group();
  head.position.y = 0.76;
  chest.add(head);
  rig.add(head, G('head', () => new THREE.SphereGeometry(0.115, 18, 14)), skin, 0, 0, 0, { s: [0.92, 1.1, 1] });
  rig.add(head, G('hair', () => new THREE.SphereGeometry(0.122, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)), hair, 0, 0.02, -0.008, { s: [0.96, 1.12, 1.04], r: [-0.18, 0, 0] });
  if (longHair) rig.add(head, G('longhair', () => new THREE.CapsuleGeometry(0.1, 0.22, 4, 10)), hair, 0, -0.1, -0.06, { s: [1.05, 1, 0.6] });
  if (beard) rig.add(head, G('beard', () => new THREE.SphereGeometry(0.108, 14, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45)), hair, 0, 0, 0.012, { s: [0.93, 1.12, 1.02] });
  const eye = G('eye', () => new THREE.SphereGeometry(0.014, 6, 6));
  rig.add(head, eye, '#141414', -0.04, 0.02, 0.1);
  rig.add(head, eye, '#141414', 0.04, 0.02, 0.1);
  const brow = G('brow', () => new THREE.BoxGeometry(0.045, 0.01, 0.01));
  rig.add(head, brow, hair, -0.04, 0.05, 0.105);
  rig.add(head, brow, hair, 0.04, 0.05, 0.105);
  rig.add(head, G('nose', () => new THREE.ConeGeometry(0.018, 0.05, 6)), skin, 0, -0.005, 0.118, { r: [Math.PI / 2, 0, 0] });
  const ear = G('ear', () => new THREE.SphereGeometry(0.025, 6, 6));
  rig.add(head, ear, skin, -0.105, 0, 0);
  rig.add(head, ear, skin, 0.105, 0, 0);

  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.25, 0.5, 0);
    rig.add(shoulder, G('upper', () => new THREE.CapsuleGeometry(0.055, 0.2, 4, 8)), top, 0, -0.15, 0);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    rig.add(elbow, G('fore', () => new THREE.CapsuleGeometry(0.045, 0.2, 4, 8)), sleeves === 'long' ? top : skin, 0, -0.13, 0);
    rig.add(elbow, G('hand', () => new THREE.SphereGeometry(0.05, 8, 6)), skin, 0, -0.29, 0.01, { s: [0.8, 1.15, 0.7] });
    chest.add(shoulder);
    return { shoulder, elbow };
  };
  const makeLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.095, -0.03, 0);
    rig.add(hip, G('thigh', () => new THREE.CapsuleGeometry(0.075, 0.3, 4, 8)), pants, 0, -0.22, 0);
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    rig.add(knee, G('shin', () => new THREE.CapsuleGeometry(0.06, 0.3, 4, 8)), pants, 0, -0.2, 0);
    rig.add(knee, G('shoe', () => new THREE.SphereGeometry(0.07, 10, 8)), opts.shoes || '#f2f2f0', 0, -0.44, 0.04, { s: [0.95, 0.65, 1.7] });
    hips.add(hip);
    return { hip, knee };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  if (opts.watch) rig.add(armL.elbow, G('watch', () => new THREE.TorusGeometry(0.048, 0.014, 6, 12)), '#1a1a1a', 0, -0.24, 0, { r: [Math.PI / 2, 0, 0] });
  rig.build();

  const scale = opts.scale ?? 0.95 + ((seed * 17) % 1) * 0.1;
  root.scale.setScalar(scale);
  return { root, parts: { hips, chest, head, armL, armR, legL, legR }, phase: seed * 10, props: {} };
}

// Attach a small prop to the right hand (phone, camera, laptop...).
export function giveProp(person, kind, color = '#1c1f26') {
  const hand = person.parts.armR.elbow;
  let m;
  if (kind === 'phone') {
    m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.012), new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 }));
    m.position.set(0, -0.33, 0.04);
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
  } else if (kind === 'parcel') {
    m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    m.position.set(-0.25, 0.15, 0.32);
    person.parts.chest.add(m);
    return;
  }
  m.traverse((o) => (o.castShadow = true));
  hand.add(m);
}

/** Pose a person for an action at time t. `speed` drives the walk/run cycle. */
export function animate(p, action, t, speed = 0) {
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
    hips.position.y = 0.95 - 0.03 * a + Math.abs(c) * (0.035 + run * 0.05) * a;
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
