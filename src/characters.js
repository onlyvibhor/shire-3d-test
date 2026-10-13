import * as THREE from 'three';
import { makePerson, CHEST_Y, SHOULDER_Y } from './charbody.js';

export { makePerson };

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
  } else if (kind === 'book') {
    m = new THREE.Group();
    const cover = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const paper = new THREE.MeshStandardMaterial({ color: '#f6f1e6', roughness: 0.9 });
    for (const sx of [-1, 1]) {
      const half = new THREE.Group();
      half.rotation.z = sx * 0.35;
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.006, 0.17), cover);
      c.position.x = sx * 0.062;
      const pg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.16), paper);
      pg.position.set(sx * 0.06, 0.008, 0);
      half.add(c, pg);
      m.add(half);
    }
    m.position.set(-0.08, -0.36, 0.1);
    m.rotation.x = -0.9;
  }
  m.traverse((o) => (o.castShadow = true));
  hand.add(m);
  person.gripR = true;
  return m;
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
  settle(p, action);
}

// Spread the poses over the extra bones: part of every chest bend goes to the spine, part of every
// head turn to the neck; feet stay level with the ground; fingers relax, or grip what the hand holds.
const SPINE_SHARE = 0.45;
const NECK_SHARE = 0.4;
const GRIP = { phone: [0, 1.25], coffee: [0, 1.3], camera: [1.1, 1.2], gavel: [0, 1.35], cycle: [1.2, 1.2], scoot: [1.2, 1.2], ride: [1.1, 1.1], game: [1.0, 1.0], box: [1.6, 1.6], kite: [1.2, 1.2], smoke: [0.4, 0.9], puff: [0.3, 0.9], present: [0.3, 0.15], point: [0.4, 0.2], wave: [0.3, 0.05] };
function settle(p, action) {
  const { spine, chest, neck, head, armL, armR, legL, legR } = p.parts;
  if (!spine) return;
  spine.rotation.set(chest.rotation.x * SPINE_SHARE, chest.rotation.y * SPINE_SHARE, chest.rotation.z * SPINE_SHARE);
  chest.rotation.set(chest.rotation.x * (1 - SPINE_SHARE), chest.rotation.y * (1 - SPINE_SHARE), chest.rotation.z * (1 - SPINE_SHARE));
  neck.rotation.set(head.rotation.x * NECK_SHARE, head.rotation.y * NECK_SHARE, head.rotation.z * NECK_SHARE);
  head.rotation.set(head.rotation.x * (1 - NECK_SHARE), head.rotation.y * (1 - NECK_SHARE), head.rotation.z * (1 - NECK_SHARE));
  const lying = p.react && p.react.type === 'fall';
  // cloth bones follow the leg that pushes them: the front half with the leading thigh, the back with the trailing one
  const fwd = Math.min(legL.hip.rotation.x, legR.hip.rotation.x, 0);
  const back = Math.max(legL.hip.rotation.x, legR.hip.rotation.x, 0);
  p.parts.skirtF.rotation.x = Math.max(fwd * p.skirtK, -p.skirtMax);
  // seated, the front of a long garment gathers on the lap instead of reaching past the knees
  p.parts.skirtF.scale.y = THREE.MathUtils.clamp(1 + (fwd + 0.7) * 0.6, 0.62, 1);
  p.parts.skirtB.rotation.x = Math.min(back * p.skirtK * 0.85, p.skirtMax);
  for (const leg of [legL, legR]) {
    // keep the sole parallel to the ground (a little toe-off when the leg trails behind)
    const pitch = leg.hip.rotation.x + leg.knee.rotation.x;
    leg.ankle.rotation.x = lying ? 0.3 : THREE.MathUtils.clamp(-pitch + Math.max(0, leg.hip.rotation.x) * 0.5, -0.7, 0.8);
  }
  const g = GRIP[action] || (p.gripR ? [0.35, 1.2] : [0.35, 0.35]);
  for (const [arm, k] of [[armL, g[0]], [armR, p.gripR && !GRIP[action] ? 1.2 : g[1]]]) {
    const curl = lying ? 0.6 : k;
    arm.fingers.rotation.z = -arm.side * curl * 0.75;
    arm.tips.rotation.z = -arm.side * curl * 0.9;
    // the wrist follows the forearm a touch, so the hand doesn't look bolted on
    arm.wrist.rotation.x = THREE.MathUtils.clamp(-arm.elbow.rotation.x * 0.12, -0.3, 0.3);
  }
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

// Two-bone reach in the side plane: the angles that put the end of a limb at (dy, dz) from its root joint.
// bend = +1 bends the middle joint like a knee (forward), -1 like an elbow.
const LEG = [0.44, 0.45];
const ARM = [0.3, 0.29];
function reach([L1, L2], dy, dz, bend) {
  let D = Math.hypot(dy, dz);
  D = Math.min(Math.max(D, Math.abs(L1 - L2) + 1e-3), L1 + L2 - 1e-3);
  const phi = Math.atan2(-dz, -dy);
  const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
  const g = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1));
  return bend > 0 ? [phi - a, Math.PI - g] : [phi + a, -(Math.PI - g)];
}

// Seated on a vehicle: hips on the saddle, hands on the grips, feet on the pedals or the floorboard.
// The vehicle hangs under the person's root at 1/scale, so its points are divided by the root's scale.
function mountPose(p, ph) {
  const { hips, chest, head, armL, armR, legL, legR } = p.parts;
  const m = p.mount;
  const k = 1 / p.root.scale.x;
  hips.position.y = (m.seatY + 0.11) * k;
  hips.position.z = m.seatZ * k;
  const lean = m.lean;
  chest.rotation.x = lean;
  head.rotation.x = -lean * 0.8;
  // feet
  for (const [leg, side] of [[legL, -1], [legR, 1]]) {
    const [fy, fz] = m.foot(side, p.crank ?? ph * 4);
    const [h, kn] = reach(LEG, fy * k - (hips.position.y - 0.03), fz * k - hips.position.z, 1);
    leg.hip.rotation.set(h, 0, side * -0.06);
    leg.knee.rotation.x = kn;
  }
  // hands: target in the chest's (leaning) frame. The lean is shared by the spine and the chest
  // (see settle), so the shoulder sits on a two-link chain from the hips.
  const sy = hips.position.y + CHEST_Y * Math.cos(SPINE_SHARE * lean) + (SHOULDER_Y - CHEST_Y) * Math.cos(lean);
  const sz = hips.position.z + CHEST_Y * Math.sin(SPINE_SHARE * lean) + (SHOULDER_Y - CHEST_Y) * Math.sin(lean);
  const dy = m.gripY * k - sy;
  const dz = m.gripZ * k - sz;
  const ry = dy * Math.cos(-lean) - dz * Math.sin(-lean);
  const rz = dy * Math.sin(-lean) + dz * Math.cos(-lean);
  for (const [arm, side] of [[armL, -1], [armR, 1]]) {
    const [sh, el] = reach(ARM, ry, rz, -1);
    arm.shoulder.rotation.set(sh, 0, side * -0.08);
    arm.elbow.rotation.x = el;
  }
}

function pose(p, action, t, speed = 0) {
  const { hips, chest, head, armL, armR, legL, legR } = p.parts;
  const ph = t + p.phase;
  // neutral
  hips.position.y = 0.95;
  hips.position.z = 0;
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
    case 'cycle':
    case 'scoot':
      if (p.mount) {
        mountPose(p, ph);
        break;
      }
    // falls through: no vehicle, so sit as if riding
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
    case 'read':
      // sitting, a book held open in both hands, eyes down on the page
      hips.position.y = 0.5;
      legL.hip.rotation.set(-1.3, 0, -0.12);
      legR.hip.rotation.set(-1.25, 0.15, 0.1);
      legL.knee.rotation.x = 1.2;
      legR.knee.rotation.x = 1.3;
      chest.rotation.x = 0.06;
      head.rotation.x = 0.38 + Math.sin(ph * 0.2) * 0.03;
      head.rotation.y = Math.sin(ph * 0.5) * 0.08;
      armL.shoulder.rotation.set(-0.55, 0, 0.3);
      armR.shoulder.rotation.set(-0.55, 0, -0.3);
      armL.elbow.rotation.x = armR.elbow.rotation.x = -1.2;
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
