import * as THREE from 'three';

const SKINS = ['#f1c9a5', '#e0ac85', '#c68a62', '#9c6a48', '#f6d7bd'];
const HAIRS = ['#5a3a22', '#3b2516', '#a5682f', '#d9b36a', '#2b2b2b', '#8c4a2f'];
const geoCache = {};
const g = (key, make) => (geoCache[key] ||= make());
const matCache = {};
const mat = (color) => (matCache[color] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));

/**
 * A little round-bodied villager. Faces +Z. About 1.4 units tall.
 * Returns { root, parts } where parts can be posed by animate().
 */
export function makeFolk({ vest = '#4f7cc9', shirt = '#efe6cf', skin, hair, cloak = null, seed = Math.random() } = {}) {
  skin ||= SKINS[Math.floor(seed * 97) % SKINS.length];
  hair ||= HAIRS[Math.floor(seed * 131) % HAIRS.length];
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const torso = new THREE.Mesh(g('torso', () => new THREE.CylinderGeometry(0.3, 0.42, 0.7, 10)), mat(shirt));
  torso.position.y = 0.75;
  const vestM = new THREE.Mesh(g('vest', () => new THREE.CylinderGeometry(0.33, 0.44, 0.46, 10, 1, true)), mat(vest));
  vestM.position.y = 0.82;
  const head = new THREE.Group();
  head.position.y = 1.22;
  const face = new THREE.Mesh(g('head', () => new THREE.SphereGeometry(0.28, 14, 10)), mat(skin));
  const hairM = new THREE.Mesh(g('hair', () => new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)), mat(hair));
  hairM.position.y = 0.04;
  hairM.rotation.x = -0.25;
  const eyeGeo = g('eye', () => new THREE.SphereGeometry(0.035, 6, 6));
  const eyeL = new THREE.Mesh(eyeGeo, mat('#2a1d14'));
  eyeL.position.set(-0.1, 0.03, 0.25);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.1;
  head.add(face, hairM, eyeL, eyeR);

  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.38, 1.0, 0);
    const arm = new THREE.Mesh(g('arm', () => new THREE.CapsuleGeometry(0.08, 0.38, 4, 8)), mat(shirt));
    arm.position.y = -0.25;
    const hand = new THREE.Mesh(g('hand', () => new THREE.SphereGeometry(0.085, 8, 6)), mat(skin));
    hand.position.y = -0.5;
    pivot.add(arm, hand);
    pivot.rotation.z = side * 0.12;
    return pivot;
  };
  const makeLeg = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.15, 0.42, 0);
    const leg = new THREE.Mesh(g('leg', () => new THREE.CapsuleGeometry(0.09, 0.22, 4, 8)), mat('#6b5a3e'));
    leg.position.y = -0.2;
    // Big hairy hobbit feet.
    const foot = new THREE.Mesh(g('foot', () => new THREE.SphereGeometry(0.13, 8, 6)), mat(skin));
    foot.scale.set(1, 0.6, 1.6);
    foot.position.set(0, -0.38, 0.06);
    pivot.add(leg, foot);
    return pivot;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  body.add(torso, vestM, head, armL, armR, legL, legR);

  if (cloak) {
    const c = new THREE.Mesh(
      g('cloak', () => new THREE.ConeGeometry(0.55, 1.05, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8)),
      new THREE.MeshStandardMaterial({ color: cloak, side: THREE.DoubleSide, roughness: 0.9 })
    );
    c.position.set(0, 0.68, -0.05);
    c.rotation.y = Math.PI;
    body.add(c);
    const hood = new THREE.Mesh(g('hood', () => new THREE.TorusGeometry(0.24, 0.08, 6, 12)), mat(cloak));
    hood.position.set(0, 1.04, -0.05);
    hood.rotation.x = Math.PI / 2;
    body.add(hood);
  }

  root.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return { root, parts: { body, head, armL, armR, legL, legR }, phase: seed * 10 };
}

/** Pose a villager for the given action at time t. `speed` is used for walking. */
export function animate(folk, action, t, speed = 0) {
  const { body, head, armL, armR, legL, legR } = folk.parts;
  const p = t + folk.phase;
  // reset
  armL.rotation.set(0, 0, -0.12);
  armR.rotation.set(0, 0, 0.12);
  legL.rotation.set(0, 0, 0);
  legR.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
  body.position.y = 0;
  body.rotation.set(0, 0, 0);

  switch (action) {
    case 'walk':
    case 'carry': {
      const f = speed > 0.01 ? Math.min(1, speed / 3) : 0;
      const w = p * (6 + speed * 1.8);
      legL.rotation.x = Math.sin(w) * 0.8 * f;
      legR.rotation.x = -Math.sin(w) * 0.8 * f;
      body.position.y = Math.abs(Math.sin(w)) * 0.07 * f;
      if (action === 'carry') {
        armL.rotation.x = armR.rotation.x = -1.2;
      } else {
        armL.rotation.x = -Math.sin(w) * 0.7 * f;
        armR.rotation.x = Math.sin(w) * 0.7 * f;
      }
      if (f === 0) body.position.y = Math.sin(p * 2) * 0.015;
      break;
    }
    case 'write':
      head.rotation.x = 0.35;
      armR.rotation.x = -1.1 + Math.sin(p * 9) * 0.08;
      armR.rotation.z = 0.25 + Math.sin(p * 4.5) * 0.15;
      armL.rotation.x = -0.9;
      break;
    case 'paint':
      armR.rotation.x = -1.6 + Math.sin(p * 2.2) * 0.35;
      armR.rotation.z = Math.sin(p * 3.1) * 0.4;
      armL.rotation.x = -0.6;
      head.rotation.y = Math.sin(p * 0.7) * 0.2;
      break;
    case 'hammer': {
      const k = (Math.sin(p * 5) + 1) / 2;
      armR.rotation.x = -0.6 - k * 2.0;
      body.rotation.x = 0.1 + (1 - k) * 0.08;
      head.rotation.x = 0.25;
      break;
    }
    case 'talk':
      armL.rotation.x = -0.5 + Math.sin(p * 2.5) * 0.4;
      armR.rotation.x = -0.4 + Math.sin(p * 3.2 + 1) * 0.5;
      armR.rotation.z = 0.4;
      head.rotation.y = Math.sin(p * 0.9) * 0.35;
      body.rotation.z = Math.sin(p * 1.3) * 0.04;
      break;
    case 'wave':
      armR.rotation.x = -2.8;
      armR.rotation.z = 0.3 + Math.sin(p * 7) * 0.35;
      head.rotation.x = -0.25;
      break;
    case 'point':
      armR.rotation.x = -1.5;
      armR.rotation.z = 0.1 + Math.sin(p * 1.5) * 0.2;
      armL.rotation.z = -0.5;
      head.rotation.y = Math.sin(p * 0.6) * 0.4;
      break;
    case 'cheer':
      armL.rotation.x = armR.rotation.x = -2.8;
      body.position.y = Math.max(0, Math.sin(p * 5)) * 0.15;
      break;
    default:
      body.position.y = Math.sin(p * 2) * 0.015;
  }
}
