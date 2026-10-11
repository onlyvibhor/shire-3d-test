// Sound for the island, made live with the Web Audio API: generative music per place (a tanpura-and-santoor raga by day,
// a hush by night, lo-fi at home, synth arps in the AI Hub, arcade bounce in the Playhouse, a fanfare in the Hall of Fame),
// ambience that follows where you are (wind, sea, birds, crickets, the murmur of a busy hamlet, the woods), sound effects
// for every interaction, and the soundtracks of a few of Vibhor's films playing where those films live.
// Nothing plays until the visitor clicks or presses a key, as browsers require.

const BUSES = ['music', 'ambience', 'sfx', 'films'];
const DEFAULTS = { master: 0.8, music: 0.5, ambience: 0.65, sfx: 0.7, films: 0.75, muted: false };
const KEY = 'shire-audio';
const MAKEUP = 2.6; // the synths are written quiet; this brings the mix up to a comfortable level before the limiter

let ctx = null;
let out = null; // master gain
const bus = {};
let reverb = null;
let noise = null; // { white, pink, brown } buffers
const listener = { x: 0, y: 0, z: 0, yaw: 0 };
const settings = { ...DEFAULTS };
try {
  Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || '{}'));
} catch {
  // storage may be blocked; the defaults are fine
}
const subscribers = new Set();

export const audioSettings = () => ({ ...settings });
export function onAudioChange(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
  subscribers.forEach((fn) => fn(audioSettings()));
}
function applyLevels(ramp = 0.15) {
  if (!ctx) return;
  const now = ctx.currentTime;
  out.gain.setTargetAtTime(settings.muted ? 0 : settings.master * MAKEUP, now, ramp);
  for (const b of BUSES) bus[b].gain.setTargetAtTime(settings[b], now, ramp);
}
export function setLevel(name, v) {
  settings[name] = Math.max(0, Math.min(1, v));
  if (name !== 'muted' && settings.muted && v > 0) settings.muted = false;
  applyLevels();
  save();
}
export function toggleMute(force) {
  settings.muted = force ?? !settings.muted;
  applyLevels();
  save();
}

// ---------- Setup ----------

function makeNoise(kind) {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') d[i] = w;
    else if (kind === 'pink') {
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    } else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  return buf;
}

function makeImpulse(seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

let started = false;
// Call from a user gesture. Safe to call many times.
export function startAudio() {
  if (started) {
    if (ctx?.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  started = true;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 4;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;
  out = ctx.createGain();
  out.gain.value = 0;
  out.connect(comp).connect(ctx.destination);
  for (const b of BUSES) {
    bus[b] = ctx.createGain();
    bus[b].connect(out);
  }
  reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(2.8, 2.6);
  const rvGain = ctx.createGain();
  rvGain.gain.value = 0.55;
  reverb.connect(rvGain).connect(out);
  noise = { white: makeNoise('white'), pink: makeNoise('pink'), brown: makeNoise('brown') };
  applyLevels(0.6);
  buildAmbience();
  music.start();
  films.start();
}

// ---------- Small helpers ----------

const now = () => ctx.currentTime;
function loopNoise(kind) {
  const s = ctx.createBufferSource();
  s.buffer = noise[kind];
  s.loop = true;
  s.loopStart = Math.random();
  s.start(0, Math.random() * 2);
  return s;
}
function envGain(t, a, peak, d, dest) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  g.connect(dest);
  return g;
}
// pan and distance falloff for a sound at a world position
function spatial(pos, range, dest) {
  const p = ctx.createStereoPanner();
  const g = ctx.createGain();
  p.connect(g).connect(dest);
  if (!pos) return { input: p, gain: g, level: 1 };
  const dx = pos.x - listener.x;
  const dz = pos.z - listener.z;
  const d = Math.hypot(dx, dz, (pos.y ?? listener.y) - listener.y);
  const level = Math.max(0, 1 - d / range) ** 1.6;
  g.gain.value = level;
  // the camera looks along (-sin yaw, -cos yaw); right is (cos yaw, -sin yaw)
  const rx = Math.cos(listener.yaw);
  const rz = -Math.sin(listener.yaw);
  p.pan.value = d > 0.5 ? Math.max(-0.85, Math.min(0.85, (dx * rx + dz * rz) / d)) : 0;
  return { input: p, gain: g, level };
}
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

function tone({ type = 'sine', f, f2, t = now(), a = 0.005, d = 0.2, v = 0.3, dest, detune = 0, filter }) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
  o.detune.value = detune;
  let node = o;
  if (filter) {
    const fl = ctx.createBiquadFilter();
    fl.type = filter.type || 'lowpass';
    fl.frequency.setValueAtTime(filter.f, t);
    if (filter.f2) fl.frequency.exponentialRampToValueAtTime(filter.f2, t + a + d);
    fl.Q.value = filter.q ?? 0.7;
    o.connect(fl);
    node = fl;
  }
  node.connect(envGain(t, a, v, d, dest));
  o.start(t);
  o.stop(t + a + d + 0.05);
}
function burst({ kind = 'white', t = now(), a = 0.003, d = 0.15, v = 0.3, dest, f = 1000, f2, q = 1, type = 'bandpass', rate = 1 }) {
  const s = ctx.createBufferSource();
  s.buffer = noise[kind];
  s.playbackRate.value = rate;
  const fl = ctx.createBiquadFilter();
  fl.type = type;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
  fl.Q.value = q;
  s.connect(fl).connect(envGain(t, a, v, d, dest));
  s.start(t, Math.random() * 2);
  s.stop(t + a + d + 0.05);
}

// ---------- Sound effects ----------

const lastPlayed = {};
const SFX = {
  // interface
  hover: (o) => tone({ type: 'sine', f: 1900, d: 0.04, v: 0.05, dest: o }),
  click: (o) => {
    tone({ type: 'triangle', f: 880, f2: 660, d: 0.06, v: 0.12, dest: o });
    burst({ d: 0.02, v: 0.05, f: 4000, dest: o });
  },
  open: (o) => {
    burst({ kind: 'pink', a: 0.05, d: 0.28, v: 0.14, f: 500, f2: 2600, q: 0.8, dest: o });
    tone({ f: 660, t: now() + 0.06, d: 0.25, v: 0.07, dest: o });
    tone({ f: 990, t: now() + 0.12, d: 0.3, v: 0.05, dest: o });
  },
  close: (o) => burst({ kind: 'pink', a: 0.02, d: 0.22, v: 0.1, f: 2400, f2: 400, q: 0.8, dest: o }),
  prompt: (o) => tone({ type: 'sine', f: 1320, f2: 1760, d: 0.08, v: 0.06, dest: o }),
  toast: (o) => {
    tone({ f: 1046, d: 0.12, v: 0.07, dest: o });
    tone({ f: 1568, t: now() + 0.07, d: 0.18, v: 0.06, dest: o });
  },
  interact: (o) => {
    tone({ type: 'triangle', f: 784, d: 0.14, v: 0.12, dest: o });
    tone({ type: 'triangle', f: 1175, t: now() + 0.08, d: 0.22, v: 0.1, dest: o });
  },
  project: (o) => {
    burst({ kind: 'pink', a: 0.08, d: 0.45, v: 0.13, f: 300, f2: 3000, q: 0.6, dest: o });
    [0, 4, 7, 12].forEach((n, i) => tone({ type: 'triangle', f: midi(72 + n), t: now() + 0.1 + i * 0.05, d: 0.4, v: 0.06, dest: o }));
  },
  time: (o) => [0, 7, 12].forEach((n, i) => tone({ f: midi(79 + n), t: now() + i * 0.06, d: 0.5, v: 0.05, dest: o })),
  camera: (o) => {
    burst({ d: 0.03, v: 0.12, f: 3000, dest: o });
    burst({ t: now() + 0.07, d: 0.04, v: 0.1, f: 2200, dest: o });
  },
  trophy: (o) => [0, 4, 7, 11, 14, 19].forEach((n, i) => tone({ type: 'triangle', f: midi(76 + n), t: now() + i * 0.07, d: 0.5, v: 0.07, dest: o })),
  // body
  jump: (o) => burst({ kind: 'pink', d: 0.12, v: 0.12, f: 900, f2: 1600, dest: o }),
  land: (o) => {
    tone({ f: 110, f2: 55, d: 0.12, v: 0.25, dest: o });
    burst({ kind: 'brown', d: 0.12, v: 0.3, f: 300, type: 'lowpass', dest: o });
  },
  bump: (o) => {
    tone({ type: 'triangle', f: 330, f2: 180, d: 0.18, v: 0.12, dest: o });
    burst({ kind: 'pink', d: 0.08, v: 0.15, f: 600, dest: o });
  },
  wave: (o) => [0, 5].forEach((n, i) => tone({ f: midi(81 + n), f2: midi(83 + n), t: now() + i * 0.16, a: 0.03, d: 0.16, v: 0.06, dest: o })),
  step: (o, { surface = 'grass', run = false } = {}) => {
    const v = run ? 0.16 : 0.1;
    const r = 0.85 + Math.random() * 0.3;
    if (surface === 'wood') {
      tone({ type: 'triangle', f: 180 * r, f2: 120, d: 0.07, v: v * 1.2, dest: o });
      burst({ kind: 'pink', d: 0.05, v: v * 0.6, f: 900 * r, dest: o });
    } else if (surface === 'path' || surface === 'indoor') {
      burst({ kind: 'white', d: 0.05, v: v * 0.8, f: 2400 * r, q: 1.4, dest: o });
      burst({ kind: 'pink', d: 0.04, v: v * 0.5, f: 500 * r, dest: o });
    } else if (surface === 'sand') {
      burst({ kind: 'white', a: 0.01, d: 0.1, v: v * 0.7, f: 3500 * r, q: 0.5, type: 'highpass', dest: o });
    } else {
      burst({ kind: 'pink', a: 0.005, d: 0.09, v: v * 0.9, f: 1300 * r, q: 0.6, dest: o });
    }
  },
  // the world
  enter: (o) => {
    burst({ kind: 'pink', a: 0.15, d: 0.6, v: 0.16, f: 200, f2: 1800, q: 0.5, dest: o });
    tone({ f: 70, f2: 50, t: now() + 0.4, d: 0.4, v: 0.3, dest: o });
  },
  exit: (o) => burst({ kind: 'pink', a: 0.1, d: 0.6, v: 0.14, f: 1800, f2: 200, q: 0.5, dest: o }),
  kick: (o) => {
    tone({ f: 140, f2: 60, d: 0.12, v: 0.4, dest: o });
    burst({ d: 0.03, v: 0.2, f: 1800, dest: o });
  },
  goal: (o) => {
    burst({ kind: 'pink', a: 0.3, d: 1.6, v: 0.18, f: 900, q: 0.4, dest: o });
    [0, 4, 7, 12, 16].forEach((n, i) => tone({ type: 'square', f: midi(67 + n), t: now() + i * 0.09, d: 0.25, v: 0.035, dest: o, filter: { f: 2500 } }));
  },
  roar: (o) => {
    const t = now();
    [55, 58, 82].forEach((f, i) => tone({ type: 'sawtooth', f, f2: f * 0.6, t, a: 0.25, d: 1.6, v: 0.18 - i * 0.04, dest: o, filter: { f: 900, f2: 300 }, detune: i * 12 }));
    burst({ kind: 'brown', t, a: 0.2, d: 1.5, v: 0.5, f: 500, f2: 200, q: 0.7, dest: o });
    burst({ kind: 'pink', t, a: 0.2, d: 1.2, v: 0.15, f: 1500, f2: 600, q: 1.2, dest: o });
  },
  stomp: (o) => {
    tone({ f: 48, f2: 30, d: 0.35, v: 0.5, dest: o });
    burst({ kind: 'brown', d: 0.3, v: 0.4, f: 180, type: 'lowpass', dest: o });
  },
  chomp: (o) => {
    burst({ kind: 'white', d: 0.06, v: 0.3, f: 1200, dest: o });
    tone({ f: 120, f2: 60, t: now() + 0.05, d: 0.2, v: 0.35, dest: o });
  },
  horn: (o) => {
    const t = now();
    for (const [f, dt] of [[110, 0], [110, 0.9]]) {
      tone({ type: 'sawtooth', f, t: t + dt, a: 0.08, d: 0.7, v: 0.12, dest: o, filter: { f: 700 } });
      tone({ type: 'sawtooth', f: f * 1.5, t: t + dt, a: 0.08, d: 0.7, v: 0.07, dest: o, filter: { f: 900 } });
    }
  },
  bell: (o) => [0, 0.12].forEach((dt) => {
    tone({ f: 2400, t: now() + dt, d: 0.5, v: 0.08, dest: o });
    tone({ f: 3530, t: now() + dt, d: 0.35, v: 0.04, dest: o });
  }),
  puff: (o) => burst({ kind: 'pink', a: 0.25, d: 0.9, v: 0.12, f: 900, f2: 500, q: 0.4, dest: o }),
  sip: (o) => burst({ kind: 'pink', a: 0.05, d: 0.35, v: 0.08, f: 1800, f2: 900, q: 2, dest: o }),
  purr: (o) => {
    const t = now();
    for (let k = 0; k < 6; k++) burst({ kind: 'brown', t: t + k * 0.11, a: 0.03, d: 0.08, v: 0.22, f: 120, q: 1.5, dest: o });
  },
  splash: (o) => burst({ kind: 'white', a: 0.01, d: 0.5, v: 0.2, f: 1800, f2: 600, q: 0.5, dest: o }),
};

// play(name, { pos, range, ...args }) — pos makes it positional
export function sfx(name, opts = {}) {
  if (!ctx || ctx.state !== 'running' || !SFX[name]) return;
  const gap = opts.gap ?? (name === 'hover' ? 0.06 : name === 'step' ? 0 : 0.03);
  const t = now();
  if (lastPlayed[name] && t - lastPlayed[name] < gap) return;
  lastPlayed[name] = t;
  const sp = spatial(opts.pos, opts.range ?? 45, bus.sfx);
  if (sp.level < 0.01) return;
  if (opts.reverb) {
    const send = ctx.createGain();
    send.gain.value = opts.reverb;
    sp.gain.connect(send).connect(reverb);
  }
  SFX[name](sp.input, opts);
}

// ---------- Ambience ----------

const amb = {};
function ambLayer(kind, filterType, f, q) {
  const src = loopNoise(kind);
  const fl = ctx.createBiquadFilter();
  fl.type = filterType;
  fl.frequency.value = f;
  fl.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(fl).connect(g).connect(bus.ambience);
  return { src, fl, g };
}
function buildAmbience() {
  amb.wind = ambLayer('brown', 'bandpass', 420, 0.5);
  amb.sea = ambLayer('brown', 'lowpass', 520, 0.4);
  amb.crowd = ambLayer('pink', 'bandpass', 900, 1.1);
  amb.leaves = ambLayer('white', 'highpass', 3800, 0.4);
  amb.room = ambLayer('brown', 'lowpass', 180, 0.5);
  amb.buzz = (() => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 190;
    const o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.value = 197;
    const fl = ctx.createBiquadFilter();
    fl.type = 'bandpass';
    fl.frequency.value = 900;
    fl.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(fl);
    o2.connect(fl);
    fl.connect(g).connect(bus.ambience);
    o.start();
    o2.start();
    return { g };
  })();
  // crickets: a high tone gated in quick trains
  amb.crickets = (() => {
    const o = ctx.createOscillator();
    o.frequency.value = 4400;
    const gate = ctx.createGain();
    gate.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 28;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain).connect(gate.gain);
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(gate).connect(g).connect(bus.ambience);
    o.start();
    lfo.start();
    return { g, gate };
  })();
}

const env = { birdsAt: 0, crickT: 0 };
function setLevelSmooth(node, v, tc = 0.6) {
  node.gain.setTargetAtTime(v, now(), tc);
}
function chirp(pan, level) {
  const t = now();
  const sp = ctx.createStereoPanner();
  sp.pan.value = pan;
  sp.connect(bus.ambience);
  const base = 2600 + Math.random() * 2400;
  const notes = 2 + Math.floor(Math.random() * 4);
  for (let k = 0; k < notes; k++) {
    const s = t + k * (0.07 + Math.random() * 0.05);
    tone({ f: base * (0.9 + Math.random() * 0.3), f2: base * (1.1 + Math.random() * 0.5), t: s, a: 0.005, d: 0.06 + Math.random() * 0.05, v: 0.05 * level, dest: sp });
  }
}

// ---------- Generative music ----------

const THEMES = {
  // Yaman by day: tanpura drone on D with santoor-like plucks
  day: { bpm: 70, root: 50, scale: [0, 2, 4, 6, 7, 9, 11], chords: [[0, 4, 7, 11], [9, 12, 16, 19], [7, 11, 14, 18], [2, 6, 9, 12]], drone: true, pluck: 0.32, pad: 0.05, swing: 0.1 },
  night: { bpm: 56, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], chords: [[0, 3, 7, 10], [-2, 2, 5, 9], [-4, 0, 3, 7], [-5, -2, 2, 5]], drone: true, pluck: 0.16, pad: 0.06, swing: 0 },
  intro: { bpm: 64, root: 50, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]], drone: true, pluck: 0.2, pad: 0.06, swing: 0 },
  home: { bpm: 78, root: 53, scale: [0, 2, 4, 5, 7, 9, 11], chords: [[0, 4, 7, 11, 14], [-1, 2, 5, 9], [-3, 0, 3, 7, 10], [-5, -1, 2, 5, 9]], keys: true, beat: 'lofi', bass: true, pluck: 0.1 },
  ai: { bpm: 108, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], chords: [[0, 3, 7, 14], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 9]], arp: true, pad: 0.04, beat: 'pulse', bass: true },
  fun: { bpm: 124, root: 60, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], chip: true, beat: 'arcade', bass: true },
  awards: { bpm: 62, root: 48, scale: [0, 2, 4, 5, 7, 9, 11], chords: [[0, 4, 7, 12], [-3, 0, 4, 9], [5, 9, 12, 17], [7, 11, 14, 19]], brass: true, pad: 0.07, timpani: true },
};

const music = {
  theme: null,
  gains: {},
  next: 0,
  stepIx: 0,
  timer: null,
  start() {
    this.next = now() + 0.1;
    this.timer = setInterval(() => this.schedule(), 40);
  },
  gainFor(id) {
    if (!this.gains[id]) {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(bus.music);
      const send = ctx.createGain();
      send.gain.value = 0.35;
      g.connect(send).connect(reverb);
      this.gains[id] = g;
    }
    return this.gains[id];
  },
  set(id) {
    if (!ctx || id === this.theme) return;
    const t = now();
    for (const [k, g] of Object.entries(this.gains)) if (k !== id) g.gain.setTargetAtTime(0, t, 1.2);
    this.gainFor(id).gain.setTargetAtTime(1, t, 1.4);
    this.theme = id;
    this.stepIx = 0;
  },
  schedule() {
    if (!this.theme || ctx.state !== 'running') return;
    const th = THEMES[this.theme];
    const spb = 60 / th.bpm / 2; // eighth notes
    while (this.next < now() + 0.25) {
      this.play(th, this.stepIx, this.next, spb);
      this.stepIx++;
      this.next += spb * (th.swing && this.stepIx % 2 ? 1 + th.swing : th.swing ? 1 - th.swing : 1);
    }
  },
  play(th, i, t, spb) {
    const dest = this.gainFor(this.theme);
    const bar = Math.floor(i / 8);
    const beat = i % 8;
    const chord = th.chords[bar % th.chords.length];
    const R = th.root;
    // tanpura: Pa, Sa, Sa, low Sa, one string per beat, long and buzzy
    if (th.drone && beat % 2 === 0) {
      const n = [R + 7, R + 12, R + 12, R][(beat / 2) % 4];
      tone({ type: 'sawtooth', f: midi(n - 12), t, a: 0.02, d: spb * 7, v: 0.035, dest, filter: { type: 'bandpass', f: 900, f2: 300, q: 1.2 } });
      tone({ type: 'sine', f: midi(n - 12), t, a: 0.02, d: spb * 7, v: 0.04, dest });
    }
    // pads: one chord a bar, slow swell
    if (th.pad && beat === 0) {
      for (const c of chord) {
        tone({ type: 'sawtooth', f: midi(R + c), t, a: spb * 3, d: spb * 6, v: th.pad * 0.5, dest, detune: -6, filter: { f: 900 } });
        tone({ type: 'sawtooth', f: midi(R + c), t, a: spb * 3, d: spb * 6, v: th.pad * 0.5, dest, detune: 6, filter: { f: 900 } });
      }
    }
    // santoor-ish plucks: hammered, bright, quickly fading, from the raga's notes
    if (th.pluck && Math.random() < th.pluck) {
      const deg = th.scale[Math.floor(Math.random() * th.scale.length)];
      const n = R + 12 + deg + (Math.random() < 0.3 ? 12 : 0);
      tone({ type: 'triangle', f: midi(n), t, a: 0.003, d: 0.9, v: 0.06, dest });
      tone({ type: 'sine', f: midi(n + 12), t, a: 0.002, d: 0.35, v: 0.025, dest });
      if (Math.random() < 0.4) tone({ type: 'triangle', f: midi(n), t: t + spb * 0.5, a: 0.003, d: 0.6, v: 0.03, dest });
    }
    // lo-fi electric piano
    if (th.keys && (beat === 0 || beat === 3 || beat === 6)) {
      for (const c of chord) {
        const f = midi(R + c);
        tone({ type: 'sine', f, t, a: 0.01, d: spb * 3.5, v: 0.045, dest, filter: { f: 1800 } });
        tone({ type: 'sine', f: f * 2, t, a: 0.005, d: spb * 1.5, v: 0.012, dest });
      }
    }
    // AI Hub arpeggio: sixteenths through the chord, filter breathing
    if (th.arp) {
      for (const half of [0, 1]) {
        const k = beat * 2 + half;
        const c = chord[k % chord.length] + (k % 8 >= 4 ? 12 : 0);
        const cut = 1200 + Math.sin((i + half / 2) * 0.2) * 900;
        tone({ type: 'square', f: midi(R + 12 + c), t: t + half * spb * 0.5, a: 0.003, d: spb * 0.45, v: 0.035, dest, filter: { f: cut, q: 4 } });
      }
    }
    // Playhouse chiptune: a bouncy line on the pentatonic
    if (th.chip && Math.random() < 0.75) {
      const deg = th.scale[(beat * 3 + bar * 2 + (Math.random() < 0.3 ? 1 : 0)) % th.scale.length];
      tone({ type: 'square', f: midi(R + 12 + deg), t, a: 0.002, d: spb * 0.8, v: 0.03, dest, filter: { f: 3000 } });
    }
    // brass swells for the Hall of Fame
    if (th.brass && beat === 0) {
      for (const c of chord) tone({ type: 'sawtooth', f: midi(R + c), t, a: spb * 2, d: spb * 6, v: 0.03, dest, filter: { f: 400, f2: 1600, q: 0.8 } });
    }
    if (th.timpani && (beat === 0 || (beat === 6 && bar % 2))) tone({ f: midi(R - 12 + chord[0]), f2: midi(R - 13 + chord[0]), t, a: 0.005, d: 0.9, v: 0.18, dest });
    // bass
    if (th.bass && (beat === 0 || beat === 4 || (th.beat === 'arcade' && beat % 2 === 0))) {
      tone({ type: 'sine', f: midi(R - 12 + chord[0] + (th.beat === 'arcade' && beat % 4 === 2 ? 12 : 0)), t, a: 0.01, d: spb * 1.6, v: 0.12, dest });
    }
    // drums
    if (th.beat) {
      const kick = () => tone({ f: 120, f2: 45, t, a: 0.002, d: 0.22, v: th.beat === 'lofi' ? 0.22 : 0.18, dest });
      const hat = (v) => burst({ t, d: 0.03, v, f: 8000, type: 'highpass', dest });
      const snare = (v) => {
        burst({ kind: 'pink', t, d: 0.14, v, f: 1800, q: 0.7, dest });
        tone({ type: 'triangle', f: 190, f2: 150, t, d: 0.08, v: v * 0.6, dest });
      };
      if (th.beat === 'lofi') {
        if (beat === 0 || beat === 5) kick();
        if (beat === 2 || beat === 6) snare(0.06);
        hat(beat % 2 ? 0.012 : 0.02);
      } else if (th.beat === 'pulse') {
        if (beat % 2 === 0) kick();
        if (beat % 2 === 1) hat(0.018);
      } else {
        if (beat % 4 === 0) kick();
        if (beat % 4 === 2) snare(0.07);
        hat(0.015);
      }
    }
  },
};

// ---------- Films: the soundtracks of Vibhor's films, playing where they live ----------

const films = {
  list: [],
  start() {
    for (const f of this.list) this.wire(f);
  },
  add(def) {
    const f = { ...def, el: null, node: null, playing: false };
    this.list.push(f);
    if (ctx) this.wire(f);
  },
  wire(f) {
    // AAC where the browser has it, Opus/WebM otherwise (some Chromium builds ship without AAC)
    const probe = document.createElement('audio');
    const url = probe.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? f.url : f.url.replace(/\.m4a$/, '.webm');
    const el = new Audio(url);
    el.loop = true;
    el.preload = 'none';
    el.crossOrigin = 'anonymous';
    const src = ctx.createMediaElementSource(el);
    const pan = ctx.createStereoPanner();
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(pan).connect(g).connect(bus.films);
    Object.assign(f, { el, pan, g });
  },
  update(room) {
    for (const f of this.list) {
      if (!f.el) continue;
      const here = (f.room || null) === (room || null);
      const dx = f.pos.x - listener.x;
      const dz = f.pos.z - listener.z;
      const d = here ? Math.hypot(dx, dz) : Infinity;
      const level = here ? Math.max(0, 1 - d / f.radius) ** 1.4 * (f.gain ?? 1) : 0;
      f.g.gain.setTargetAtTime(level, now(), 0.3);
      const rx = Math.cos(listener.yaw);
      const rz = -Math.sin(listener.yaw);
      f.pan.pan.setTargetAtTime(d > 0.5 && d < Infinity ? Math.max(-0.7, Math.min(0.7, (dx * rx + dz * rz) / d)) : 0, now(), 0.2);
      if (level > 0.005 && !f.playing) {
        f.playing = true;
        f.el.play().catch(() => (f.playing = false));
      } else if (level <= 0.001 && f.playing && d > f.radius + 6) {
        f.playing = false;
        f.el.pause();
      }
    }
  },
};
export const addFilm = (def) => films.add(def);

// ---------- Per-frame update ----------
// s: { pos, yaw, room, night, speed, running, surface, coastDist, crowd, woods, droneDist, mode, air }
let stepPhase = 0;
export function updateAudio(s, dt) {
  if (!ctx || ctx.state !== 'running') return;
  listener.x = s.pos.x;
  listener.y = s.pos.y;
  listener.z = s.pos.z;
  listener.yaw = s.yaw;
  const t = now();
  const outside = !s.room;
  const day = 1 - s.night;
  // music follows the place, and outdoors the time of day
  music.set(s.mode === 'intro' ? 'intro' : s.room ? s.room : s.night > 0.55 ? 'night' : 'day');
  // ambience levels
  const height = Math.max(0, Math.min(1, (s.pos.y - 4) / 14));
  setLevelSmooth(amb.wind.g, outside ? 0.05 + height * 0.12 + Math.max(0, 1 - s.coastDist / 40) * 0.06 : 0);
  amb.wind.fl.frequency.setTargetAtTime(380 + Math.sin(t * 0.13) * 140 + Math.sin(t * 0.41) * 60, t, 0.5);
  const sea = outside ? Math.max(0, 1 - Math.max(0, s.coastDist) / 55) : 0;
  setLevelSmooth(amb.sea.g, sea * (0.22 + Math.max(0, Math.sin(t * 0.35)) * 0.18));
  setLevelSmooth(amb.crowd.g, outside ? s.crowd * (0.05 + Math.abs(Math.sin(t * 1.7) * Math.sin(t * 0.63)) * 0.05) * (0.4 + day * 0.6) : 0, 0.3);
  setLevelSmooth(amb.leaves.g, outside ? s.woods * (0.015 + Math.max(0, Math.sin(t * 0.5 + Math.sin(t * 1.3))) * 0.03) : 0, 0.4);
  setLevelSmooth(amb.room.g, s.room ? 0.05 : 0, 0.8);
  setLevelSmooth(amb.buzz.g, outside ? Math.max(0, 1 - s.droneDist / 22) ** 2 * 0.05 : 0, 0.2);
  setLevelSmooth(amb.crickets.g, outside ? s.night * 0.012 * (0.6 + 0.4 * Math.sin(t * 0.3)) : 0, 0.8);
  // birds by day, more of them away from the crowds
  if (outside && day > 0.3 && t > env.birdsAt) {
    chirp(Math.random() * 1.6 - 0.8, day * (0.5 + s.woods * 0.5));
    env.birdsAt = t + 0.6 + Math.random() * (3.5 - s.woods * 2);
  }
  // footsteps
  if (s.speed > 0.6 && s.air < 0.05 && s.mode === 'walk') {
    stepPhase += (s.speed * dt) / (s.running ? 1.35 : 0.78);
    if (stepPhase >= 1) {
      stepPhase -= 1;
      sfx('step', { surface: s.surface, run: s.running });
    }
  } else stepPhase = 0.6;
  films.update(s.room);
}

// for debugging and tests
export function audioDebug() {
  let rms = 0;
  if (ctx) {
    if (!audioDebug.an) {
      audioDebug.an = ctx.createAnalyser();
      audioDebug.an.fftSize = 2048;
      out.connect(audioDebug.an);
    }
    const buf = new Float32Array(2048);
    audioDebug.an.getFloatTimeDomainData(buf);
    rms = Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length);
  }
  return { state: ctx?.state ?? 'off', rms: +rms.toFixed(4), theme: music.theme, films: films.list.map((f) => ({ url: f.url, playing: f.playing, gain: f.g ? +f.g.gain.value.toFixed(3) : 0 })) };
}
