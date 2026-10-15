// The production scenes' director: background actors working to a shared clock.
//
// Each actor has a list of jobs on the scene's cycle: { t, do, to?, face?, speed? }. At time t the
// actor eases out of the last job into the new one; with `to` it first walks there, then turns to
// `face`. Everything is worked out from the cycle time alone, so a scene can be updated every frame
// close up, a few times a second further away, or not at all out of sight, and it is always in the
// right place when you come back. Actors here are scenery: they are never registered as people
// you can talk to, and they never take control of anything.
import * as THREE from 'three';
import { animateBlend } from '../characters.js';

const BLEND = 0.6; // seconds to ease from one job into the next
const TURN = 0.6; // seconds to turn to face the work after walking somewhere

const angleLerp = (a, b, f) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * f;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function prepare(actor) {
  const steps = actor.steps.slice().sort((a, b) => a.t - b.t);
  let pos = actor.at.slice();
  let face = actor.face ?? 0;
  for (const s of steps) {
    s.from = pos;
    s.fromFace = face;
    if (s.to) {
      s.dist = Math.hypot(s.to[0] - pos[0], s.to[1] - pos[1]);
      s.walk = s.dist / (s.speed ?? 1.25);
      s.heading = Math.atan2(s.to[0] - pos[0], s.to[1] - pos[1]);
      pos = s.to;
    } else s.walk = 0;
    if (s.face !== undefined) face = s.face;
    s.endFace = face;
    s.endPos = pos;
  }
  actor.steps = steps;
  return actor;
}

// where the actor is, which way they face, and what they are doing at cycle time c
function stateAt(actor, c) {
  const S = actor.steps;
  let i = S.length - 1;
  for (let k = 0; k < S.length; k++) if (S[k].t <= c) i = k;
  const s = S[i];
  const prev = S[(i - 1 + S.length) % S.length];
  let since = c - s.t;
  if (since < 0) since += actor.cycle; // before the first job of the loop: still in the last one
  if (s.walk && since < s.walk) {
    const f = since / s.walk;
    return { x: s.from[0] + (s.to[0] - s.from[0]) * f, z: s.from[1] + (s.to[1] - s.from[1]) * f, face: angleLerp(s.fromFace, s.heading, clamp01(since / 0.35)), action: s.walkAs ?? actor.walkAs ?? 'walk', speed: s.speed ?? 1.25, from: prev.do, w: clamp01(since / 0.3), actT: since };
  }
  const settled = since - s.walk;
  const face = s.walk ? angleLerp(s.heading, s.endFace, clamp01(settled / TURN)) : angleLerp(s.fromFace, s.endFace, clamp01(settled / TURN));
  return { x: s.endPos[0], z: s.endPos[1], face, action: s.do, speed: 0, from: s.walk ? 'idle' : prev.do, w: clamp01(settled / BLEND), actT: settled };
}

/**
 * anchor: the group the scene lives in (its frame is the actors' frame)
 * cycle: seconds in one loop of the scene; offset shifts the loop so neighbours don't sync
 * actors: [{ p, at, face, steps }] · tick(c, t, lod): animates the equipment · screens: [{ update(t, on) }]
 */
export function createScene({ anchor, cycle, offset = 0, actors = [], tick = null, screens = [], playerPos }) {
  for (const a of actors) {
    a.cycle = cycle;
    a.p.root.userData.ambient = true; // scenery, never one of the people you can talk to
    prepare(a);
    anchor.add(a.p.root);
    const s0 = stateAt(a, 0);
    a.p.root.position.set(s0.x, a.y ?? 0, s0.z);
    a.p.root.rotation.y = s0.face;
  }
  const world = new THREE.Vector3();
  let located = false;
  let last = -1;
  return {
    actors,
    update(t) {
      if (!located) {
        anchor.updateWorldMatrix(true, false);
        anchor.getWorldPosition(world);
        located = true;
      }
      const d = Math.hypot(world.x - playerPos.x, world.z - playerPos.z);
      // full rate close up, fewer updates further out, none out of range (or while you're indoors,
      // where the player is far away from the island)
      const every = d < 38 ? 0 : d < 70 ? 0.1 : d < 110 ? 0.5 : Infinity;
      for (const sc of screens) sc.update(t, d < 75);
      if (every === Infinity || t - last < every) return;
      last = t;
      const c = (((t + offset) % cycle) + cycle) % cycle;
      for (const a of actors) {
        const st = stateAt(a, c);
        const r = a.p.root;
        r.position.x = st.x;
        r.position.z = st.z;
        r.rotation.y = st.face;
        a.p.actT = st.actT;
        a.p.beatT = c;
        animateBlend(a.p, st.from, st.action, st.w, t, st.speed);
      }
      tick?.(c, t, d < 38 ? 2 : d < 70 ? 1 : 0);
    },
  };
}
