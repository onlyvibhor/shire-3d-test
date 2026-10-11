// Riding Vibhor's bicycle: pedal, brake, steer and lean into corners; slopes slow you down or speed you up;
// hop with Space; hit something hard (or land badly) and you're thrown off, the bike skids onto its side,
// and you can walk back and get on again. The bike lives outside Home and stays wherever you leave it.
import * as THREE from 'three';
import { makeBicycle } from './jaipur.js';
import { hit } from './characters.js';
import { sfx } from './audio.js';

const WHEELBASE = 1.06;
const G = 9.8;

export function createRide({ scene, player, state, colliders, npcs, groundAt, walkY, heightAt, SEA_LEVEL, jettyAt, onFerry, ui, home }) {
  const bike = makeBicycle('#2f6bff');
  // the rider and the bike lean and pitch together inside this frame
  const rig = new THREE.Group();
  const lean = new THREE.Group();
  rig.add(lean);
  scene.add(rig);
  lean.add(bike);
  // a little ring so the parked bike is easy to spot
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.9, 32), new THREE.MeshBasicMaterial({ color: '#2f6bff', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.05;
  rig.add(marker);

  const R = {
    active: false,
    v: 0, // forward speed, m/s
    heading: home.heading,
    steer: 0,
    leanAngle: 0,
    pitch: 0,
    vy: 0,
    air: 0,
    fallen: null, // { side, t } while the bike lies on its side
    stunUntil: 0,
    crankDist: 0,
  };
  const pos = new THREE.Vector3(home.x, 0, home.z);
  const ground = (x, z) => {
    const d = onFerry(x, z);
    if (d !== null) return d;
    const j = jettyAt(x, z);
    return j ? j.y : walkY(x, z);
  };
  const water = (x, z) => !jettyAt(x, z) && onFerry(x, z) === null && heightAt(x, z) < SEA_LEVEL + 0.5;
  function place() {
    rig.position.set(pos.x, ground(pos.x, pos.z) + R.air, pos.z);
    rig.rotation.y = R.heading;
    lean.rotation.set(R.pitch, 0, R.leanAngle, 'YXZ');
  }
  // parked: standing on its kickstand, leaning a touch
  function park() {
    R.leanAngle = 0.12;
    R.pitch = 0;
    R.air = 0;
    place();
  }
  park();

  // the thing you walk up to and press E on
  const interact = { kind: 'ride', label: 'Your bicycle', verb: 'Ride', x: pos.x, z: pos.z };

  function mount() {
    if (R.active || state.indoor) return;
    R.fallen = null;
    R.active = true;
    R.v = 0;
    R.steer = 0;
    R.vy = 0;
    R.air = 0;
    player.react = null;
    player.parts.tilt.quaternion.identity();
    lean.add(player.root);
    player.root.position.set(0, 0, 0);
    player.root.rotation.set(0, 0, 0);
    player.mount = bike.userData.mount;
    state.pos.set(pos.x, ground(pos.x, pos.z), pos.z);
    state.heading = R.heading;
    state.target = null;
    marker.visible = false;
    sfx('bell');
    ui.toast('<b>🚲 On your bike.</b> <kbd>W</kbd> pedal · <kbd>S</kbd> brake · <kbd>A</kbd><kbd>D</kbd> steer · <kbd>Space</kbd> hop · <kbd>B</kbd> bell · <kbd>X</kbd> get off', 5200, { quiet: true });
    document.body.classList.add('is-riding');
  }

  function release(dir) {
    // put the player back in the world where the bike is
    scene.add(player.root);
    player.mount = null;
    R.active = false;
    document.body.classList.remove('is-riding');
    const side = new THREE.Vector3(Math.cos(R.heading), 0, -Math.sin(R.heading)).multiplyScalar(dir);
    state.pos.set(pos.x + side.x * 0.9, 0, pos.z + side.z * 0.9);
    state.pos.y = ground(state.pos.x, state.pos.z);
    state.heading = R.heading;
    state.speed = 0;
  }

  function dismount() {
    if (!R.active) return;
    release(1);
    R.v = 0;
    park();
    marker.visible = true;
  }

  function crash(t, why) {
    if (!R.active) return;
    const speed = Math.abs(R.v);
    release(0);
    // thrown forward off the bike
    const fwd = new THREE.Vector3(Math.sin(R.heading), 0, Math.cos(R.heading));
    state.pos.addScaledVector(fwd, 1.1 + speed * 0.12);
    state.pos.y = ground(state.pos.x, state.pos.z);
    state.vy = 3;
    hit(player, 'fall', new THREE.Vector3(0, 0, 1), t);
    R.stunUntil = t + 2.6;
    R.fallen = { side: R.leanAngle >= 0 ? 1 : -1, t, slide: R.v * 0.6 };
    R.v = 0;
    marker.visible = true;
    sfx('crash');
    ui.toast(`<b>💥 ${why}</b> You came off the bike. Walk back to it and press <kbd>E</kbd> to get on again.`, 5200, { quiet: true });
  }

  // summon the bike next to you (from Home's panel) and hop on
  function bring() {
    if (state.indoor) return false;
    const fwd = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
    pos.set(state.pos.x + fwd.x * 1.5, 0, state.pos.z + fwd.z * 1.5);
    R.heading = state.heading;
    R.fallen = null;
    park();
    mount();
    return true;
  }

  const tmp = new THREE.Vector3();
  function update(t, dt, keys) {
    // a bike on the ground slides to a stop and lies on its side
    if (R.fallen) {
      const f = R.fallen;
      const u = Math.min(1, (t - f.t) / 0.45);
      R.leanAngle = THREE.MathUtils.lerp(R.leanAngle, f.side * 1.42, u);
      if (f.slide > 0.05) {
        pos.x += Math.sin(R.heading) * f.slide * dt;
        pos.z += Math.cos(R.heading) * f.slide * dt;
        f.slide *= Math.exp(-dt * 3);
      }
      R.air = Math.max(0, R.air - dt * 4);
      place();
      rig.position.y -= Math.abs(Math.sin(R.leanAngle)) * 0.05;
    }
    // while you're on it, the bike shouldn't offer itself as something to ride
    interact.x = R.active ? 1e6 : pos.x;
    interact.z = R.active ? 1e6 : pos.z;
    interact.verb = R.fallen ? 'Pick it up and ride' : 'Ride';
    interact.label = R.fallen ? 'Your bicycle (on its side)' : 'Your bicycle';
    marker.material.opacity = 0.35 + Math.sin(t * 3) * 0.2;
    if (!R.active) return;

    const fwdKey = keys.has('w') || keys.has('arrowup');
    const brake = keys.has('s') || keys.has('arrowdown');
    const left = keys.has('a') || keys.has('arrowleft');
    const right = keys.has('d') || keys.has('arrowright');
    const sprint = keys.has('shift');
    const grounded = R.air <= 0.001;

    // pedalling, braking, rolling resistance and air drag
    let acc = 0;
    if (fwdKey && grounded) acc += sprint ? 3.4 : 2.2;
    if (brake) acc += R.v > 0.2 ? -7 : R.v > -1.6 ? -1.6 : 0;
    acc -= Math.sign(R.v) * (0.25 + 0.035 * R.v * R.v);
    // slope: compare the ground under each wheel
    const fx = pos.x + Math.sin(R.heading) * 0.53;
    const fz = pos.z + Math.cos(R.heading) * 0.53;
    const bx = pos.x - Math.sin(R.heading) * 0.53;
    const bz = pos.z - Math.cos(R.heading) * 0.53;
    const slope = Math.atan2(ground(fx, fz) - ground(bx, bz), WHEELBASE);
    if (grounded) acc -= G * Math.sin(slope) * 0.85;
    R.v += acc * dt;
    // pedalling can't push past a cruising speed (sprinting a bit more); hills can still run you faster
    const top = sprint ? 11 : 8;
    if (fwdKey && R.v > top) R.v -= (R.v - top) * Math.min(1, dt * 2);
    R.v = THREE.MathUtils.clamp(R.v, -2, 16);
    if (Math.abs(R.v) < 0.05 && !fwdKey) R.v = 0;

    // steering: tighter at low speed, gentle at speed; the bike leans into the turn
    const maxSteer = 0.55 / (1 + Math.abs(R.v) * 0.45);
    const want = (left ? 1 : 0) - (right ? 1 : 0);
    R.steer = THREE.MathUtils.lerp(R.steer, want * maxSteer, Math.min(1, dt * 6));
    const yawRate = (R.v * Math.tan(R.steer)) / WHEELBASE;
    R.heading += yawRate * dt;
    const leanTarget = THREE.MathUtils.clamp(-Math.atan((R.v * yawRate) / G), -0.62, 0.62);
    R.leanAngle = THREE.MathUtils.lerp(R.leanAngle, leanTarget + Math.sin(t * 1.7) * 0.01 * Math.min(1, R.v), Math.min(1, dt * 5));
    R.pitch = THREE.MathUtils.lerp(R.pitch, -slope, Math.min(1, dt * 8));

    // hop
    if (keys.has(' ') && grounded) {
      R.vy = 4.6;
      sfx('jump');
    }
    if (keys.has('b')) sfx('bell', { gap: 0.6 });

    // move, with collisions against the world
    const step = R.v * dt;
    let nx = pos.x + Math.sin(R.heading) * step;
    let nz = pos.z + Math.cos(R.heading) * step;
    if (water(nx, nz)) {
      if (Math.abs(R.v) > 6) return crash(t, 'Splash!');
      R.v = 0;
      nx = pos.x;
      nz = pos.z;
    }
    for (const c of colliders) {
      if (c.box) {
        const b = c.box;
        if (nx > b.minX - 0.4 && nx < b.maxX + 0.4 && nz > b.minZ - 0.4 && nz < b.maxZ + 0.4) {
          if (Math.abs(R.v) > 5.5) return crash(t, 'Crash!');
          nx = pos.x;
          nz = pos.z;
          R.v *= -0.2;
        }
        continue;
      }
      const dx = nx - c.x;
      const dz = nz - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + 0.42;
      if (d < min && d > 1e-4) {
        // how hard are we riding into it? head-on and fast throws you off; a glancing touch just slides you along
        const nxu = dx / d;
        const nzu = dz / d;
        const into = -(Math.sin(R.heading) * nxu + Math.cos(R.heading) * nzu) * R.v;
        if (into > 5.5) return crash(t, 'Crash!');
        nx = c.x + nxu * min;
        nz = c.z + nzu * min;
        if (into > 0) R.v *= into > 2.5 ? 0.45 : 0.85;
      }
    }
    // people: a light brush knocks them over; at speed you go over too
    for (const n of npcs) {
      if (!n.p.root.visible) continue;
      n.p.root.getWorldPosition(tmp);
      if (Math.hypot(tmp.x - nx, tmp.z - nz) < 0.7 && Math.abs(tmp.y - state.pos.y) < 1.5 && Math.abs(R.v) > 6.5) return crash(t, 'Whoa!');
    }
    pos.x = nx;
    pos.z = nz;

    // gravity and landing
    if (R.vy !== 0 || R.air > 0) {
      R.vy -= 18 * dt;
      R.air += R.vy * dt;
      if (R.air <= 0) {
        if (R.vy < -9 || Math.abs(R.leanAngle) > 0.5) {
          R.air = 0;
          R.vy = 0;
          return crash(t, 'Bad landing!');
        }
        if (R.vy < -4) sfx('land');
        R.air = 0;
        R.vy = 0;
      }
    }
    // flying off a drop: keep the airborne height relative to falling ground
    place();

    // the rider pedals in step with the distance travelled
    bike.userData.spin(step);
    player.crank = bike.userData.crank();
    state.pos.set(pos.x, rig.position.y, pos.z);
    state.heading = R.heading;
    state.speed = Math.abs(R.v);
    state.air = R.air;
  }

  return {
    get active() {
      return R.active;
    },
    get speed() {
      return R.v;
    },
    get stunned() {
      return R.stunUntil;
    },
    get pedaling() {
      return R.active && R.v > 0.3;
    },
    interact,
    mount,
    dismount,
    bring,
    update,
    pos,
  };
}
