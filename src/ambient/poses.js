// Actions for the department production scenes: the reel dances, a camera crew, a seated actor,
// people at monitors, boards and tables. Each poses the body from neutral (see characters.js pose):
// shoulders turn on x to raise an arm forward (negative is up) and on z to raise it to the side
// (right arm positive, left arm negative); elbows bend on negative x; knees bend on positive x.
// p.actT is the time since the actor's current job began (set by the scene controller), and
// p.beatT the scene's shared music clock, so dancers stay on the same count.
import * as THREE from 'three';
import { registerPose, reach, LEG } from '../characters.js';

const ease = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// a hit on the beat: most of the move happens in the middle of the count, so poses read as steps
const hit = (f) => ease(clamp01((f - 0.12) / 0.7));

// Legs planted at given feet under a lowered, shifted pelvis (two-bone reach on each side).
function plant(parts, drop = 0, footL = [0, 0], footR = [0, 0]) {
  const { hips, legL, legR } = parts;
  hips.position.y = 0.95 - drop;
  for (const [leg, [fx, fz]] of [[legL, footL], [legR, footR]]) {
    // the foot's sideways offset from its hip joint swings the leg out (right leg +z, left -z)
    const dx = fx - hips.position.x;
    const dy = -(hips.position.y - 0.06);
    const [h, k] = reach(LEG, dy, fz - hips.position.z, 1);
    leg.hip.rotation.set(h, 0, Math.atan2(dx, -dy));
    leg.knee.rotation.x = k;
  }
}
function arm(a, [x, z, el]) {
  a.shoulder.rotation.x = x;
  a.shoulder.rotation.z = z;
  a.elbow.rotation.x = el;
}
function sitLegs(parts, open = 0.15) {
  const { hips, legL, legR } = parts;
  hips.position.y = 0.5;
  legL.hip.rotation.set(-1.3, 0, -open);
  legR.hip.rotation.set(-1.3, 0, open);
  legL.knee.rotation.x = legR.knee.rotation.x = 1.25;
}

// ---------- the reel dance ----------
// Eight counts, each a held shape the dancer hits on the beat: [hipsX, drop, hipsYaw, chestTilt,
// headDown, headTilt, left arm, right arm, left foot x, right foot x]. Arms are [x, z, elbow].
const HIP = [0.25, -0.62, -1.95]; // hand on hip, left side (mirrored for the right)
const DANCE = [
  [0, 0.04, 0, 0, 0.04, 0, [-0.2, -0.22, -0.6], [-0.2, 0.22, -0.6], 0, 0],
  [0.07, 0.07, -0.12, -0.12, -0.1, -0.14, HIP, [-2.45, 0.55, -0.1], 0, 0.26],
  [0, 0.09, 0, 0, 0.12, 0, [-1.25, 0.32, -1.55], [-1.25, -0.32, -1.55], 0, 0],
  [-0.07, 0.07, 0.12, 0.12, -0.1, 0.14, [-2.45, -0.55, -0.1], [HIP[0], -HIP[1], HIP[2]], -0.26, 0],
  [0, 0.02, 0, 0, -0.18, 0, [-2.7, -0.42, -0.12], [-2.7, 0.42, -0.12], -0.12, 0.12],
  [0.03, 0.06, 0.26, -0.05, 0, 0.05, [-0.05, -1.5, -0.2], [-0.05, 1.5, -0.2], -0.12, 0.12],
  [0, 0.08, -0.22, 0.06, 0.06, 0.16, [-1.6, -0.18, -2.25], [-1.6, 0.18, -2.25], 0, 0],
  [0, 0.05, 0, 0, 0.1, -0.04, HIP, [-1.52, 0.1, -0.06], 0, 0],
];
const mirror = (k) => [-k[0], k[1], -k[2], -k[3], k[4], -k[5], [k[7][0], -k[7][1], k[7][2]], [k[6][0], -k[6][1], k[6][2]], -k[9], -k[8]];
// the second dancer answers the lead: same counts in another order, mirrored
const DANCE_B = [0, 3, 2, 1, 6, 5, 4, 7].map((i) => mirror(DANCE[i]));
const lerp = THREE.MathUtils.lerp;
const lerp3 = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];

function dance(p, parts, ph, set) {
  const { hips, chest, head, armL, armR } = parts;
  const beat = (p.beatT ?? ph) * 1.9; // about 114 beats a minute
  const c = Math.floor(beat);
  const f = hit(beat - c);
  const A = set[((c % 8) + 8) % 8];
  const B = set[(((c + 1) % 8) + 8) % 8];
  const k = A.map((v, i) => (Array.isArray(v) ? lerp3(v, B[i], f) : lerp(v, B[i], f)));
  // the groove under it all: a knee bounce on every beat and a little shoulder roll
  const bounce = Math.abs(Math.sin(beat * Math.PI)) * 0.025;
  hips.position.x = k[0];
  hips.rotation.y = k[2];
  chest.rotation.z = k[3] + Math.sin(beat * Math.PI) * 0.03;
  chest.rotation.y = -k[2] * 0.6;
  head.rotation.x = k[4] + Math.sin(beat * Math.PI * 2) * 0.04;
  head.rotation.z = k[5];
  arm(armL, k[6]);
  arm(armR, k[7]);
  plant(parts, k[1] + bounce, [k[8], 0], [k[9], 0]);
}
registerPose('dance', (p, parts, ph) => dance(p, parts, ph, DANCE), [0.15, 0.15]);
registerPose('dance2', (p, parts, ph) => dance(p, parts, ph, DANCE_B), [0.15, 0.15]);

// between takes: hands on hips, catching breath, a glance around
registerPose('relax', (p, { head, chest, armL, armR, hips }, ph) => {
  arm(armL, HIP);
  arm(armR, [HIP[0], -HIP[1], HIP[2]]);
  chest.rotation.x = Math.sin(ph * 2.6) * 0.03;
  head.rotation.y = Math.sin(ph * 0.5) * 0.35;
  hips.rotation.y = Math.sin(ph * 0.3) * 0.08;
});

// ---------- camera crew ----------
// behind a camera on a tripod: right hand on the pan bar, left on the lens, eye to the viewfinder
registerPose('cinecam', (p, { chest, head, hips, armL, armR, legL, legR }, ph) => {
  chest.rotation.x = 0.2;
  head.rotation.x = 0.12;
  arm(armR, [-0.55, 0.32, -0.55]);
  arm(armL, [-1.1, -0.05, -0.95 + Math.sin(ph * 1.7) * 0.04]);
  hips.rotation.y = Math.sin(ph * 0.22) * 0.05;
  legL.hip.rotation.x = -0.12;
  legR.hip.rotation.x = 0.12;
  legL.knee.rotation.x = legR.knee.rotation.x = 0.12;
  hips.position.y = 0.935;
}, [1.1, 1.2]);
// beside the camera, hand on the follow focus, eyes on the monitor
registerPose('focus', (p, { head, armL, armR, chest }, ph) => {
  arm(armL, [-1.15, -0.25, -0.55]);
  armL.elbow.rotation.y = Math.sin(ph * 1.3) * 0.15;
  arm(armR, [-0.35, 0.2, -1.4]);
  head.rotation.y = 0.45 + Math.sin(ph * 0.4) * 0.08;
  head.rotation.x = 0.08;
  chest.rotation.y = 0.12;
}, [1.0, 0.8]);
// a boom held overhead in both hands, aimed forward and down at the talent
registerPose('boom', (p, { head, chest, hips, armL, armR, legL, legR }, ph) => {
  const sway = Math.sin(ph * 0.35) * 0.04;
  arm(armR, [-2.5 + sway, 0.18, -0.35]);
  arm(armL, [-2.2 + sway, -0.22, -0.5]);
  head.rotation.x = -0.3;
  chest.rotation.x = -0.05;
  legL.hip.rotation.z = -0.08;
  legR.hip.rotation.z = 0.08;
  hips.rotation.y = sway * 0.5;
}, [1.3, 1.3]);
// the slate: raise the board in front of the lens, clap at 0.9 s, lower it again
registerPose('slate', (p, { head, armL, armR }) => {
  const a = p.actT ?? 0;
  const up = ease(clamp01(a / 0.5)) * (1 - ease(clamp01((a - 1.5) / 0.6)));
  arm(armL, [-0.2 - up * 1.15, -0.1, -0.5 - up * 0.65]);
  // the right hand holds the clapstick open, then snaps it shut
  const snap = a > 0.85 && a < 1.0 ? 1 - (a - 0.85) / 0.15 : a >= 1.0 ? 0 : 1;
  arm(armR, [-0.2 - up * 1.3, 0.1 - up * 0.25, -0.5 - up * (0.75 + snap * 0.25)]);
  head.rotation.x = 0.05 + up * 0.05;
}, [1.2, 1.0]);

// ---------- performers ----------
// on a sofa, talking to the lens: hands shaping the line, a nod, an emphatic open hand at its end
registerPose('actsit', (p, parts, ph) => {
  const { head, chest, armL, armR } = parts;
  sitLegs(parts, 0.12);
  const a = p.actT ?? ph;
  const line = a % 6.4; // one line every 6.4 s
  const talk = line < 5.2 ? 1 : 0.2;
  const emph = ease(clamp01((line - 4.1) / 0.5)) * (1 - ease(clamp01((line - 5.1) / 0.6)));
  chest.rotation.x = -0.06 + emph * 0.08 + Math.sin(ph * 0.7) * 0.02;
  head.rotation.y = Math.sin(ph * 0.9) * 0.12 * talk;
  head.rotation.x = Math.sin(ph * 2.3) * 0.05 * talk - emph * 0.06;
  head.rotation.z = Math.sin(ph * 1.1) * 0.05;
  arm(armL, [-0.45 + Math.sin(ph * 2.1) * 0.12 * talk, 0.12, -1.05 + Math.sin(ph * 2.7) * 0.15 * talk]);
  arm(armR, [-0.55 - emph * 0.6 + Math.sin(ph * 2.4 + 1) * 0.15 * talk, -0.1 + emph * 0.55, -1.15 + emph * 0.75 + Math.sin(ph * 3.1) * 0.12 * talk]);
}, [0.3, 0.1]);
// seated, between takes
registerPose('sitrest', (p, parts, ph) => {
  sitLegs(parts, 0.15);
  arm(parts.armL, [-0.3, 0.05, -0.8]);
  arm(parts.armR, [-0.3, -0.05, -0.8]);
  parts.chest.rotation.x = -0.15;
  parts.head.rotation.y = Math.sin(ph * 0.35) * 0.3;
});

// ---------- crew and teams ----------
// both hands up at a lamp head, tightening a knuckle
registerPose('adjust', (p, { head, armL, armR, chest }, ph) => {
  arm(armR, [-2.05, 0.12, -0.6 + Math.sin(ph * 4) * 0.08]);
  arm(armL, [-1.9, -0.12, -0.75 + Math.sin(ph * 3.3 + 1) * 0.08]);
  armR.elbow.rotation.y = Math.sin(ph * 2) * 0.2;
  head.rotation.x = -0.28;
  chest.rotation.x = -0.04;
}, [1.0, 1.0]);
// standing at a table, leaning in to a screen, hands on the edge
registerPose('monitor', (p, { head, chest, armL, armR }, ph) => {
  chest.rotation.x = 0.28;
  head.rotation.x = 0.1;
  head.rotation.y = Math.sin(ph * 0.4) * 0.12;
  arm(armL, [-0.55, 0.1, -0.45]);
  arm(armR, [-0.55, -0.1, -0.45]);
});
// seated at a monitor, chin in hand, watching the take
registerPose('monsit', (p, parts, ph) => {
  sitLegs(parts, 0.18);
  parts.chest.rotation.x = 0.22;
  parts.head.rotation.x = -0.05;
  parts.head.rotation.y = Math.sin(ph * 0.3) * 0.08;
  arm(parts.armR, [-0.75, -0.25, -2.0]);
  arm(parts.armL, [-0.55, 0.3, -1.3]);
});
// seated, typing
registerPose('typesit', (p, parts, ph) => {
  sitLegs(parts, 0.12);
  parts.head.rotation.x = 0.25;
  arm(parts.armL, [-0.55, 0.12, -1.05 + Math.sin(ph * 14) * 0.05]);
  arm(parts.armR, [-0.55, -0.12, -1.05 + Math.sin(ph * 14 + 1.3) * 0.05]);
});
// a director calling the shot: a sweep of the arm, then the flat-hand "cut"
registerPose('direct', (p, { head, chest, armL, armR }, ph) => {
  const a = p.actT ?? ph;
  const s = ease(clamp01(a / 0.6));
  arm(armR, [-1.4 * s, 0.15 + Math.sin(a * 2.2) * 0.35 * s, -0.25]);
  arm(armL, [-0.4, -0.35, -1.5]);
  head.rotation.y = Math.sin(a * 0.9) * 0.25;
  chest.rotation.y = Math.sin(a * 1.1) * 0.08;
}, [0.6, 0.05]);
// writing on a board at head height: small strokes, a step back now and then
registerPose('writeboard', (p, { head, chest, armL, armR }, ph) => {
  const w = Math.sin(ph * 0.25) > -0.6 ? 1 : 0;
  arm(armR, [-1.95 * w - 0.3 * (1 - w), 0.32, -0.55 + Math.sin(ph * 7) * 0.06 * w]);
  armR.shoulder.rotation.y = Math.sin(ph * 3.5) * 0.15 * w;
  arm(armL, [-0.3, -0.15, -0.6]);
  head.rotation.x = -0.12 * w;
  chest.rotation.x = -0.03;
}, [0.3, 1.2]);
// turning an object over in both hands, studying it
registerPose('inspect', (p, { head, chest, hips, armL, armR }, ph) => {
  arm(armL, [-0.95, 0.45, -1.35]);
  arm(armR, [-0.95, -0.45, -1.35]);
  armL.elbow.rotation.y = armR.elbow.rotation.y = Math.sin(ph * 0.7) * 0.25;
  head.rotation.x = 0.32;
  head.rotation.z = Math.sin(ph * 0.5) * 0.08;
  hips.rotation.y = Math.sin(ph * 0.4) * 0.12;
  chest.rotation.x = 0.06;
}, [1.0, 1.0]);
// applause
registerPose('applaud', (p, { head, armL, armR }, ph) => {
  const c = Math.abs(Math.sin(ph * 9));
  arm(armL, [-1.05, 0.38 + c * 0.12, -1.2]);
  arm(armR, [-1.05, -0.38 - c * 0.12, -1.2]);
  head.rotation.x = -0.05;
  head.rotation.y = Math.sin(ph * 0.6) * 0.15;
}, [0.2, 0.2]);
// arms folded, listening; a slow nod now and then
registerPose('listen', (p, { head, armL, armR, hips }, ph) => {
  arm(armL, [-0.62, 0.62, -1.95]);
  arm(armR, [-0.55, -0.6, -1.9]);
  head.rotation.x = Math.max(0, Math.sin(ph * 1.6)) ** 6 * 0.18;
  head.rotation.y = Math.sin(ph * 0.3) * 0.15;
  hips.rotation.y = Math.sin(ph * 0.25) * 0.06;
});
// in a discussion: explaining with both hands, then pointing at the work
registerPose('discuss', (p, { head, chest, armL, armR }, ph) => {
  const pointing = Math.sin(ph * 0.45) > 0.5;
  if (pointing) {
    arm(armR, [-1.3, 0.25, -0.1]);
    arm(armL, [-0.3, -0.2, -0.9]);
    head.rotation.y = 0.25;
  } else {
    arm(armL, [-0.5 + Math.sin(ph * 2.6) * 0.25, 0.1, -1.1 + Math.sin(ph * 3.2) * 0.2]);
    arm(armR, [-0.55 + Math.sin(ph * 2.2 + 1) * 0.25, -0.1, -1.0 + Math.sin(ph * 2.9) * 0.2]);
    head.rotation.y = Math.sin(ph * 0.8) * 0.25;
  }
  chest.rotation.y = Math.sin(ph * 0.6) * 0.08;
}, [0.4, 0.3]);
// holding a phone up in portrait, framing a shot (a creator checking the take)
registerPose('phoneup', (p, { head, armL, armR }, ph) => {
  arm(armR, [-1.45, 0.05, -0.75]);
  arm(armL, [-1.35, -0.05, -0.8]);
  head.rotation.x = 0.06;
  head.rotation.y = Math.sin(ph * 0.4) * 0.05;
}, [1.1, 1.2]);
// presenting on a stage: an open hand to the screen behind, then back to the room
registerPose('keynote', (p, { head, chest, hips, armL, armR }, ph) => {
  const a = (p.actT ?? ph) % 9;
  const toScreen = a > 3 && a < 6 ? ease(clamp01((a - 3) / 0.6)) * (1 - ease(clamp01((a - 5.4) / 0.6))) : 0;
  hips.rotation.y = toScreen * 0.6;
  chest.rotation.y = toScreen * 0.3;
  head.rotation.y = toScreen * 0.6 + Math.sin(ph * 0.5) * 0.15 * (1 - toScreen);
  arm(armR, [-0.55 - toScreen * 0.85 + Math.sin(ph * 2) * 0.12 * (1 - toScreen), -0.15 + toScreen * 0.75, -1.1 + toScreen * 0.9]);
  arm(armL, [-0.45 + Math.sin(ph * 2.4) * 0.15, 0.1, -1.2 + Math.sin(ph * 2.8) * 0.15]);
}, [0.4, 0.1]);

// seated with a phone in both hands: a user trying a flow while someone watches
registerPose('sitphone', (p, parts, ph) => {
  sitLegs(parts, 0.12);
  parts.chest.rotation.x = 0.12;
  parts.head.rotation.x = 0.35 + Math.sin(ph * 0.4) * 0.04;
  arm(parts.armR, [-0.85, -0.12, -1.35 + Math.sin(ph * 5) * 0.03]);
  arm(parts.armL, [-0.8, 0.12, -1.3]);
}, [1.0, 1.2]);
