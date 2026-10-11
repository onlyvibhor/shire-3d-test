// Out in the woods: a hidden smoker who shares a drag, and a T-rex who guards the trees.
import * as THREE from 'three';
import { groundAt, SEA_LEVEL } from './world.js';
import { solid, mesh, glow, canvasTexture } from './materials.js';
import { makePerson, animate, hit } from './characters.js';

const deg = THREE.MathUtils.degToRad;
const polar = (a, r) => ({ x: Math.cos(a) * r, z: Math.sin(a) * r });
// the radius where the woods are, at a given angle: on land, past the ring road
function woodsRadius(a, want) {
  for (let r = want; r > 100; r -= 2) {
    const { x, z } = polar(a, r);
    if (groundAt(x, z) > SEA_LEVEL + 3) return r;
  }
  return 100;
}

// ---------- Smoke puffs ----------

function makePuffs(scene, n = 14) {
  const geo = new THREE.IcosahedronGeometry(0.12, 1);
  const list = [];
  for (let k = 0; k < n; k++) {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#e9edf2', transparent: true, opacity: 0, depthWrite: false, roughness: 1 }));
    m.visible = false;
    scene.add(m);
    list.push({ m, life: 0, v: new THREE.Vector3() });
  }
  let next = 0;
  return {
    emit(p, strength = 1) {
      const s = list[next++ % list.length];
      s.m.position.copy(p);
      s.v.set((Math.random() - 0.5) * 0.3, 0.35 + Math.random() * 0.25, (Math.random() - 0.5) * 0.3).multiplyScalar(strength);
      s.life = 1;
      s.m.visible = true;
    },
    update(dt) {
      for (const s of list) {
        if (s.life <= 0) continue;
        s.life -= dt * 0.45;
        s.m.position.addScaledVector(s.v, dt);
        s.m.scale.setScalar(1 + (1 - s.life) * 4);
        s.m.material.opacity = Math.max(0, s.life) * 0.45;
        if (s.life <= 0) s.m.visible = false;
      }
    },
  };
}

// ---------- The smoker ----------

function makeCigarette() {
  const g = new THREE.Group();
  const stick = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 6), solid('#f7f5ef'), 0, 0, 0, false);
  stick.rotation.x = Math.PI / 2;
  const filter = mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.025, 6), solid('#d9a25b'), 0, 0, -0.055, false);
  filter.rotation.x = Math.PI / 2;
  const tip = mesh(new THREE.SphereGeometry(0.009, 6, 4), glow('#ff6a1a', 3), 0, 0, 0.047, false);
  g.add(stick, filter, tip);
  g.userData.tip = tip;
  return g;
}
const HAND = new THREE.Vector3(0, -0.34, 0.04);

function buildSmoker(scene, ctx) {
  const a = deg(62);
  const r = woodsRadius(a, 127);
  const { x, z } = polar(a, r);
  const g = new THREE.Group();
  g.position.set(x, groundAt(x, z), z);
  g.rotation.y = Math.atan2(x, z); // faces out to sea, back to the village
  scene.add(g);
  // a fallen log to sit on, hidden in a thicket
  const log = mesh(new THREE.CylinderGeometry(0.28, 0.32, 2.4, 10), solid('#6e5038', { roughness: 1 }), 0, 0.28, 0);
  log.rotation.z = Math.PI / 2;
  g.add(log);
  const leaf = solid('#3a7d2c', { roughness: 0.9, flatShading: true });
  const leaf2 = solid('#4f9a33', { roughness: 0.9, flatShading: true });
  // bushes all round, with one narrow gap at the back
  for (let k = 0; k < 14; k++) {
    const t = (k / 14) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(t - Math.PI), Math.cos(t - Math.PI))) < 0.35) continue;
    const d = 2.3 + (k % 3) * 0.35;
    g.add(mesh(new THREE.IcosahedronGeometry(0.9 + (k % 4) * 0.2, 1), k % 2 ? leaf : leaf2, Math.sin(t) * d, 0.7, Math.cos(t) * d));
  }
  for (let k = 0; k < 5; k++) {
    const t = (k / 5) * Math.PI * 2 + 0.3;
    const tr = new THREE.Group();
    tr.position.set(Math.sin(t) * 4.2, 0, Math.cos(t) * 4.2);
    tr.add(mesh(new THREE.CylinderGeometry(0.22, 0.34, 3, 7), solid('#6e5038'), 0, 1.5, 0));
    tr.add(mesh(new THREE.IcosahedronGeometry(2, 1), k % 2 ? leaf : leaf2, 0, 4, 0));
    g.add(tr);
    ctx.colliderList.push({ x: x + Math.sin(t + g.rotation.y) * 4.2, z: z + Math.cos(t + g.rotation.y) * 4.2, r: 0.5 });
  }
  const p = makePerson({ seed: 0.57, style: 'streetwear', top: '#2a2f38', outer: '#5b4636', pants: '#3b3f46', hairStyle: 'crop', beard: true, noBag: true, accessory: 'cap' });
  p.root.position.set(0, 0.06, 0.15);
  g.add(p.root);
  p.offer = 0;
  const cig = makeCigarette();
  cig.position.copy(HAND);
  p.parts.armR.elbow.add(cig);
  ctx.npcs.push({ p, dept: 'social', name: 'Someone in the bushes', lines: ['Psst. Don’t tell HR I’m out here.', 'Want a drag? Take it, then pass it back.', 'Best ideas come on a break. Worst ones too.'] });
  return { g, p, cig, pos: new THREE.Vector3(x, g.position.y, z) };
}

// ---------- The T-rex ----------

function makeRex() {
  const root = new THREE.Group();
  const skin = solid('#7d6b3b', { roughness: 0.85, flatShading: true });
  const dark = solid('#4a3d22', { roughness: 0.9, flatShading: true });
  const belly = solid('#cdbb8a', { roughness: 0.9, flatShading: true });
  const bone = solid('#f4efe2', { roughness: 0.5 });
  const body = new THREE.Group();
  body.position.y = 3.0;
  root.add(body);
  const torso = mesh(new THREE.SphereGeometry(1, 14, 10), skin, 0, 0, 0.2);
  torso.scale.set(1.25, 1.35, 2.6);
  const tummy = mesh(new THREE.SphereGeometry(1, 12, 8), belly, 0, -0.35, 0.5);
  tummy.scale.set(1.08, 1.05, 2.1);
  body.add(torso, tummy);
  for (let k = 0; k < 6; k++) body.add(mesh(new THREE.ConeGeometry(0.16, 0.4, 4), dark, 0, 1.3 - Math.abs(k - 2) * 0.05, 1.6 - k * 0.7));
  // neck and head
  const neck = mesh(new THREE.CylinderGeometry(0.62, 0.85, 1.6, 10), skin, 0, 0.9, 2.3);
  neck.rotation.x = 0.85;
  body.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 1.45, 3.05);
  body.add(head);
  head.add(mesh(new THREE.BoxGeometry(1.15, 1.0, 1.4), skin, 0, 0.1, 0.1));
  head.add(mesh(new THREE.BoxGeometry(1.0, 0.6, 1.5), skin, 0, 0.05, 1.3));
  head.add(mesh(new THREE.BoxGeometry(1.2, 0.18, 0.5), dark, 0, 0.62, 0.2));
  for (const sx of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.13, 10, 8), solid('#f2c94c'), sx * 0.58, 0.32, 0.35));
    head.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), solid('#111'), sx * 0.64, 0.33, 0.38));
    head.add(mesh(new THREE.SphereGeometry(0.05, 6, 4), dark, sx * 0.25, 0.32, 2.02));
  }
  for (let k = 0; k < 7; k++) for (const sx of [-1, 1]) head.add(mesh(new THREE.ConeGeometry(0.06, 0.2, 4), bone, sx * 0.44, -0.3, 0.75 + k * 0.17).rotateX(Math.PI));
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.3, 0.2);
  head.add(jaw);
  jaw.add(mesh(new THREE.BoxGeometry(0.9, 0.3, 1.7), belly, 0, -0.18, 0.85));
  jaw.add(mesh(new THREE.BoxGeometry(0.7, 0.05, 1.5), solid('#a33a3a'), 0, -0.02, 0.85));
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) jaw.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 4), bone, sx * 0.38, 0.05, 0.4 + k * 0.2));
  // little arms
  const arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(sx * 0.9, -0.1, 1.9);
    arm.add(mesh(new THREE.CapsuleGeometry(0.12, 0.45, 4, 8), skin, 0, -0.25, 0.1).rotateX(0.9));
    for (const cx of [-0.05, 0.05]) arm.add(mesh(new THREE.ConeGeometry(0.035, 0.14, 4), bone, cx, -0.45, 0.35).rotateX(1.6));
    body.add(arm);
    arms.push(arm);
  }
  // tail: a chain of segments that sways
  const tail = [];
  let parent = body;
  let z = -2.2;
  [[0.95, 0.62, 2.2], [0.62, 0.36, 2.1], [0.36, 0.1, 2.0]].forEach(([r0, r1, len], k) => {
    const seg = new THREE.Group();
    seg.position.set(0, k ? 0 : 0.15, z);
    const m = mesh(new THREE.CylinderGeometry(r1, r0, len, 10), k ? skin : skin, 0, 0, -len / 2);
    m.rotation.x = Math.PI / 2;
    seg.add(m);
    seg.add(mesh(new THREE.ConeGeometry(0.1, 0.3, 4), dark, 0, r0 * 0.9, -len * 0.4));
    parent.add(seg);
    tail.push(seg);
    parent = seg;
    z = -len;
  });
  // legs
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.95, -0.1, -0.2);
    body.add(hip);
    const thigh = mesh(new THREE.CapsuleGeometry(0.55, 1.1, 4, 10), skin, 0, -0.7, 0.15);
    thigh.rotation.x = -0.25;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.set(0, -1.45, 0.35);
    hip.add(knee);
    knee.add(mesh(new THREE.CapsuleGeometry(0.3, 0.9, 4, 8), skin, 0, -0.55, -0.2).rotateX(0.35));
    const foot = new THREE.Group();
    foot.position.set(0, -1.25, -0.35);
    knee.add(foot);
    foot.add(mesh(new THREE.BoxGeometry(0.75, 0.28, 1.1), dark, 0, -0.1, 0.35));
    for (const cx of [-0.25, 0, 0.25]) foot.add(mesh(new THREE.ConeGeometry(0.07, 0.25, 4), bone, cx, -0.12, 0.98).rotateX(Math.PI / 2));
    legs.push({ hip, knee, foot });
  }
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return { root, body, head, jaw, arms, tail, legs };
}

function poseRex(rex, t, speed, mood) {
  const { body, head, jaw, arms, tail, legs } = rex;
  const gait = t * (1.4 + speed * 0.55);
  const stride = Math.min(1, speed / 3);
  legs.forEach((l, k) => {
    const s = Math.sin(gait + k * Math.PI);
    l.hip.rotation.x = s * 0.55 * stride;
    l.knee.rotation.x = Math.max(0, -Math.cos(gait + k * Math.PI)) * 0.7 * stride;
    l.foot.rotation.x = -l.hip.rotation.x - l.knee.rotation.x * 0.5;
  });
  body.position.y = 3.0 + Math.abs(Math.sin(gait)) * 0.12 * stride;
  body.rotation.z = Math.sin(gait) * 0.04 * stride;
  body.rotation.x = mood === 'chase' ? 0.12 : 0.02;
  tail.forEach((s, k) => {
    s.rotation.y = Math.sin(t * 1.6 - k * 0.7) * (0.15 + k * 0.08);
    s.rotation.x = -0.05 + k * 0.04;
  });
  arms.forEach((a, k) => (a.rotation.x = Math.sin(t * 3 + k) * 0.25));
  let open = 0.08 + Math.max(0, Math.sin(t * 0.9)) * 0.1;
  head.rotation.x = Math.sin(t * 0.8) * 0.05;
  head.rotation.y = Math.sin(t * 0.5) * 0.2;
  if (mood === 'chase') open = 0.35 + Math.sin(t * 6) * 0.1;
  if (mood === 'roar') {
    open = 0.85;
    head.rotation.x = -0.45 + Math.sin(t * 20) * 0.03;
    head.rotation.y = 0;
  }
  if (mood === 'eat') {
    open = Math.abs(Math.sin(t * 9)) * 0.8;
    head.rotation.x = 0.35;
  }
  jaw.rotation.x = open;
}

function buildRex(scene, ctx) {
  const rex = makeRex();
  const homeA = deg(150);
  const home = polar(homeA, woodsRadius(homeA, 124));
  rex.root.position.set(home.x, groundAt(home.x, home.z), home.z);
  scene.add(rex.root);
  // a warning sign where the woods begin
  const sa = deg(150);
  const sp = polar(sa, 104);
  const sign = new THREE.Group();
  sign.position.set(sp.x, groundAt(sp.x, sp.z), sp.z);
  sign.rotation.y = Math.atan2(-sp.x, -sp.z);
  sign.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), solid('#6e5038'), 0, 1.2, 0));
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.2),
    new THREE.MeshBasicMaterial({
      toneMapped: false,
      side: THREE.DoubleSide,
      map: canvasTexture(440, 240, (c, w, h) => {
        c.fillStyle = '#f2c94c';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#111';
        c.lineWidth = 12;
        c.strokeRect(6, 6, w - 12, h - 12);
        c.fillStyle = '#111';
        c.font = '800 56px "Bricolage Grotesque", Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('⚠ T-REX', w / 2, 100);
        c.font = '600 30px Inter, sans-serif';
        c.fillText('in the woods. Run.', w / 2, 170);
      }),
    })
  );
  board.position.y = 2.2;
  sign.add(board);
  scene.add(sign);
  const info = new THREE.Object3D();
  info.position.set(sp.x, 0, sp.z);
  info.userData.interact = { kind: 'toast', label: 'Warning sign', verb: 'Read', text: '<b>🦖 Beware of the T-rex.</b> It guards these woods and shoves trespassers out. Usually. Every so often it follows people into town and gets hungry. Hold Shift to run.' };
  scene.add(info);
  return { rex, home, homeA };
}

// ---------- Public ----------

export function buildCreatures(scene, ctx) {
  const puffs = makePuffs(scene);
  const smoker = buildSmoker(scene, ctx);
  const { rex, home, homeA } = buildRex(scene, ctx);
  const R = {
    state: 'roam', // roam | chase | roar | return | eat
    target: null,
    speed: 0,
    heading: 0,
    timer: 0,
    calm: 0,
    rampage: false,
    chaseT: 0,
    eatenPlayerAt: 0,
  };
  const eaten = []; // npcs waiting to come back
  const S = { phase: 'idle', t: 0, cool: 0 };
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const mouth = new THREE.Vector3();
  const inTerritory = (x, z) => {
    const a = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    let d = a - homeA;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return Math.abs(d) < deg(48) && r > 100;
  };
  const pickRoam = () => {
    for (let k = 0; k < 20; k++) {
      const a = homeA + (Math.random() - 0.5) * deg(80);
      const r = 110 + Math.random() * 22;
      const p = polar(a, r);
      if (groundAt(p.x, p.z) > SEA_LEVEL + 3) return p;
    }
    return { ...home };
  };

  function update(t, dt, api) {
    const { state, player, ui, respawn, npcs } = api;
    puffs.update(dt);

    // --- the smoker ---
    if (S.cool > 0) S.cool -= dt;
    const sd = Math.hypot(state.pos.x - smoker.pos.x, state.pos.z - smoker.pos.z);
    const handOf = (p, out) => p.parts.armR.elbow.localToWorld(out.copy(HAND));
    if (S.phase === 'idle') {
      animate(smoker.p, 'smoke', t);
      if (Math.sin(t * 0.5 + 0.3) > 0.97) puffs.emit(smoker.p.parts.head.getWorldPosition(tmp).add(tmp2.set(0, 0.05, 0.12)), 0.6);
      if (sd < 2.4 && S.cool <= 0 && !state.indoor) {
        S.phase = 'offer';
        S.t = 0;
        ui.toast('<b>🚬 Psst.</b> Someone in the bushes holds out a cigarette.', 2600);
      }
    } else {
      S.t += dt;
      const abort = sd > 4.5 && S.phase !== 'back';
      if (abort && S.phase !== 'offer') {
        S.phase = 'back';
        S.t = 0;
      }
      if (S.phase === 'offer') {
        smoker.p.offer = Math.min(1, S.t / 0.8);
        if (abort) {
          S.phase = 'back';
          S.t = 0;
        } else if (S.t > 1.0) {
          S.phase = 'pass';
          S.t = 0;
          scene.attach(smoker.cig);
        }
      } else if (S.phase === 'pass') {
        const u = Math.min(1, S.t / 0.6);
        handOf(smoker.p, tmp);
        handOf(player, tmp2);
        smoker.cig.position.lerpVectors(tmp, tmp2, u);
        if (u >= 1) {
          player.parts.armR.elbow.attach(smoker.cig);
          smoker.cig.position.copy(HAND);
          smoker.cig.rotation.set(0, 0, 0);
          S.phase = 'puff';
          S.t = 0;
        }
      } else if (S.phase === 'puff') {
        state.forcePose = 'puff';
        smoker.p.offer = Math.max(0, 1 - S.t * 2);
        if (S.t > 1.3 && S.t < 2.6 && Math.random() < dt * 9) puffs.emit(player.parts.head.getWorldPosition(tmp).add(tmp2.set(0, 0.02, 0)), 1.2);
        if (S.t > 2.6) {
          state.forcePose = null;
          S.phase = 'back';
          S.t = 0;
          scene.attach(smoker.cig);
          ui.toast('<b>💨 *puff*</b> You pass it back. He nods. Some ideas need a minute away from the screen.', 4200);
        }
      } else if (S.phase === 'back') {
        state.forcePose = null;
        smoker.p.offer = Math.min(1, 0.5 + S.t);
        if (smoker.cig.parent !== scene) scene.attach(smoker.cig);
        const u = Math.min(1, S.t / 0.6);
        smoker.cig.getWorldPosition(tmp2);
        handOf(smoker.p, tmp);
        smoker.cig.position.lerp(tmp, u);
        if (u >= 1) {
          smoker.p.parts.armR.elbow.attach(smoker.cig);
          smoker.cig.position.copy(HAND);
          smoker.cig.rotation.set(0, 0, 0);
          smoker.p.offer = 0;
          S.phase = 'idle';
          S.cool = 20;
        }
      }
      animate(smoker.p, 'smoke', t);
    }

    // --- eaten people come back after a while ---
    for (let k = eaten.length - 1; k >= 0; k--) {
      if (t > eaten[k].back) {
        eaten[k].n.p.root.visible = true;
        eaten.splice(k, 1);
      }
    }

    // --- the T-rex ---
    const root = rex.root;
    const px = state.pos.x;
    const pz = state.pos.z;
    const dx = px - root.position.x;
    const dz = pz - root.position.z;
    const pd = Math.hypot(dx, dz);
    const outdoors = !state.indoor && state.mode === 'walk';
    if (R.calm > 0) R.calm -= dt;
    let want = 0;
    let goal = null;
    switch (R.state) {
      case 'roam':
        if (!R.target || Math.hypot(R.target.x - root.position.x, R.target.z - root.position.z) < 2) {
          R.timer -= dt;
          if (R.timer <= 0) {
            R.target = pickRoam();
            R.timer = 2 + Math.random() * 4;
          }
        } else {
          goal = R.target;
          want = 2.2;
        }
        if (outdoors && R.calm <= 0 && pd < 24 && inTerritory(px, pz)) {
          R.state = 'chase';
          R.chaseT = 0;
          R.rampage = Math.random() < 0.2;
          ui.toast(R.rampage ? '<b>🦖 ROOOAR!</b> The T-rex looks hungry. RUN!' : '<b>🦖 ROAR!</b> The T-rex wants you out of its woods.', 2600);
        }
        break;
      case 'chase': {
        R.chaseT += dt;
        goal = { x: px, z: pz };
        want = R.rampage ? 7.4 : 6.6;
        const escaped = !outdoors || pd > (R.rampage ? 55 : 34) || (!R.rampage && !inTerritory(px, pz) && pd > 8) || R.chaseT > (R.rampage ? 45 : 20);
        if (escaped) {
          R.state = 'return';
          R.calm = 8;
          if (outdoors && pd > 20) ui.toast('<b>Phew.</b> The T-rex gives up and stomps back to the woods.', 2600);
        } else if (pd < 2.9) {
          if (R.rampage) {
            R.state = 'eat';
            R.timer = 1.6;
            R.eatenPlayerAt = t;
            player.root.visible = false;
            ui.toast('<b>🦖 CHOMP.</b> The T-rex ate you. Back to the Party Tree…', 3200);
          } else {
            // the shove: a big knock back and a hop
            const k = 1 / Math.max(pd, 0.01);
            R.push = { x: dx * k, z: dz * k, v: 16 };
            state.vy = Math.max(state.vy, 5.5);
            R.state = 'roar';
            R.timer = 1.6;
            R.calm = 6;
            ui.toast('<b>🦖 SHOVE!</b> The T-rex knocked you out of its woods.', 2600);
          }
        }
        break;
      }
      case 'roar':
        R.timer -= dt;
        if (R.timer <= 0) R.state = 'return';
        break;
      case 'eat':
        R.timer -= dt;
        rex.head.getWorldPosition(mouth);
        if (!player.root.visible) state.pos.set(mouth.x, state.pos.y, mouth.z);
        if (R.timer <= 0) {
          if (!player.root.visible) {
            player.root.visible = true;
            respawn();
          }
          R.state = R.chaseT > 0 && R.rampage && R.eatenPlayerAt === t ? 'return' : 'return';
          R.calm = 14;
        }
        break;
      case 'return':
        goal = home;
        want = 4;
        if (Math.hypot(home.x - root.position.x, home.z - root.position.z) < 3) {
          R.state = 'roam';
          R.target = null;
        }
        if (outdoors && R.calm <= 0 && pd < 18 && inTerritory(px, pz)) {
          R.state = 'chase';
          R.chaseT = 0;
          R.rampage = Math.random() < 0.2;
        }
        break;
    }
    // the shove carries the player for a moment
    if (R.push && R.push.v > 0.2) {
      state.pos.x += R.push.x * R.push.v * dt;
      state.pos.z += R.push.z * R.push.v * dt;
      R.push.v *= Math.exp(-dt * 3.5);
    }
    // walk toward the goal
    if (goal) {
      const gx = goal.x - root.position.x;
      const gz = goal.z - root.position.z;
      const gd = Math.hypot(gx, gz);
      if (gd > 0.5) {
        let diff = Math.atan2(gx, gz) - R.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        R.heading += diff * Math.min(1, dt * 2.5);
      }
    }
    R.speed = THREE.MathUtils.lerp(R.speed, goal ? want : 0, Math.min(1, dt * 2));
    const nx = root.position.x + Math.sin(R.heading) * R.speed * dt;
    const nz = root.position.z + Math.cos(R.heading) * R.speed * dt;
    if (groundAt(nx, nz) > SEA_LEVEL + 1.5) {
      root.position.x = nx;
      root.position.z = nz;
    }
    root.position.y = groundAt(root.position.x, root.position.z);
    root.rotation.y = R.heading;
    poseRex(rex, t, R.speed, R.state === 'chase' ? 'chase' : R.state === 'roar' ? 'roar' : R.state === 'eat' ? 'eat' : 'calm');

    // it shoves (or, when hungry, eats) anyone else in its way
    if (R.speed > 1.5) {
      rex.head.getWorldPosition(mouth);
      for (const n of npcs) {
        if (!n.p.root.visible || n.p === smoker.p) continue;
        n.p.root.getWorldPosition(tmp);
        const d = Math.hypot(tmp.x - mouth.x, tmp.z - mouth.z);
        if (d > 2.6) continue;
        if (R.rampage && R.state === 'chase') {
          n.p.root.visible = false;
          eaten.push({ n, back: t + 30 });
          ui.toast(`<b>🦖 Gulp.</b> The T-rex ate ${n.role ? `a ${n.role.toLowerCase()}` : 'someone'}. They’ll be back after lunch.`, 2600);
        } else if (!n.p.react) {
          n.p.root.getWorldQuaternion(new THREE.Quaternion());
          hit(n.p, 'fall', tmp2.set(Math.sin(R.heading), 0, Math.cos(R.heading)), t);
        }
      }
    }
  }

  return { update, rex: rex.root, smoker: smoker.p, state: R, smokerState: S, smokerPos: smoker.pos };
}
