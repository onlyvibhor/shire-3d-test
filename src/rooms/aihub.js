// The AI Hub: how the studio turns AI into tools the whole team uses. Six connected rooms around a
// tall holographic atrium:
//   Atrium — the studio's AI core, its three principles, a little studio bot
//   Image-generation lab — Founder Image Generator (one photo in, a library out), Product Image
//                          Generator and the Advanced Image Editor, input → tool → output
//   Automation workshop — the T20 pipeline on a conveyor, and Social Content Gen
//   Tools collection — the studio's stack, sorted into what each tool is for
//   Demonstration theatre — the AI design workshops, on stage
//   Experimental sandbox — the Cinematography Tool's lenses and grades, and AI Works
import * as THREE from 'three';
import { PROJECTS, TOOLS, AIHUB } from '../data.js';
import { screenMat } from '../props.js';
import { solid, glow, mesh, WHITE_METAL, BRUSHED, DARK, GLASS } from '../materials.js';
import { FONT, fit, wrap, fillFit } from '../type.js';
import { rng } from '../world.js';
import {
  makeShell, partition, zone, addThing, addCollider, addBox, addFootprint, addNpc, person, clickable, plate, lamp, plant, framed, bigScreen, tileTexture,
  floorPatch, table, stool, chair, faceTo, sofa,
} from './kit.js';

const C = AIHUB.color;
const V = '#7b5cff';

// The stack, sorted by what each tool does in the studio (from each tool's own use).
export const TOOL_GROUPS = [
  ['Ideation and reasoning', ['Gemini & AI Studio', 'ChatGPT', 'Claude']],
  ['Image creation', ['Nano Banana API', 'Midjourney', 'Adobe Firefly', 'Stable Diffusion + ControlNet', 'Ideogram']],
  ['Film and motion', ['RunwayML', 'Kling', 'Veo 2', 'Higgsfield']],
  ['3D production', ['Blender & Spline']],
  ['Voice and audio', ['ElevenLabs', 'Suno AI']],
  ['Workflow automation', ['Replit']],
  ['Finishing and production', ['Topaz Labs', 'Photoshop · After Effects · Illustrator']],
];

// a workstation: a desk, a screen showing the tool, its name above
function station(room, x, z, ry, { name, sub, img, slug, person: who }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.06, 1.0), WHITE_METAL, 0, 0.95, 0.35));
  for (const sx of [-1.1, 1.1]) g.add(mesh(new THREE.BoxGeometry(0.06, 0.92, 0.8), BRUSHED, sx, 0.46, 0.35));
  g.add(mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), BRUSHED, 0, 1.55, -0.1));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.56), screenMat(img, 2.6 / 1.56));
  scr.position.set(0, 2.55, -0.02);
  g.add(mesh(new THREE.BoxGeometry(2.72, 1.68, 0.06), DARK, 0, 2.55, -0.07, false), scr);
  clickable(room, scr, { kind: 'project', slug });
  const title = plate(2.7, 0.5, (c, w, h) => {
    c.fillStyle = '#0b1222';
    c.fillRect(0, 0, w, h);
    c.fillStyle = C;
    c.fillRect(0, h - 5, w, 5);
    c.fillStyle = '#ffffff';
    c.font = `700 ${h * 0.36}px ${FONT.sans}`;
    fillFit(c, name, 18, h * 0.45, w - 36);
    c.fillStyle = '#8fb3d9';
    c.font = `500 ${h * 0.24}px ${FONT.sans}`;
    fillFit(c, sub, 18, h * 0.82, w - 36);
  });
  title.position.set(0, 3.65, -0.02);
  g.add(title);
  // a keyboard and a tablet on the desk
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.03, 0.22), DARK, 0, 0.995, 0.45, false));
  g.add(mesh(new THREE.BoxGeometry(0.34, 0.02, 0.26), solid('#1b2338'), 0.75, 0.99, 0.4, false));
  room.group.add(g);
  addFootprint(room, x, z, 2.5, 1.3, ry);
  return g;
}

export function buildAIHub(origin) {
  const W = 38;
  const D = 40;
  const floorTex = tileTexture('#0b1222', '#0d1428', 8, 'rgba(0,194,255,0.3)');
  floorTex.repeat.set(9, 10);
  const room = makeShell({
    id: 'ai',
    origin,
    w: W,
    d: D,
    h: 10,
    floor: new THREE.MeshPhysicalMaterial({ map: floorTex, roughness: 0.25, metalness: 0.3, clearcoat: 1, emissive: '#00c2ff', emissiveMap: floorTex, emissiveIntensity: 0.18 }),
    wall: new THREE.MeshStandardMaterial({ color: '#111b30', roughness: 0.6 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#0a1020', roughness: 0.8 }),
    trim: glow(C, 1.4),
    doorColor: '#dff6ff',
  });
  const g = room.group;
  const r = rng(901);
  const WALL = new THREE.MeshStandardMaterial({ color: '#16223d', roughness: 0.5, metalness: 0.2 });
  const TRIM = glow(C, 1.2);
  const PH = 6;
  const sign = (t) => ({ signColor: '#bfefff', signInk: 'rgba(6,14,30,0.85)', signs: t });

  // ----- the plan -----
  partition(room, { axis: 'z', at: -9, from: -8, to: 20, h: PH, mat: WALL, trim: TRIM, openings: [{ at: 13, w: 3.2, style: 'round', ...sign({ pos: 'Image lab' }) }, { at: -1, w: 3.2, style: 'round', ...sign({ pos: 'Tools collection' }) }] });
  partition(room, { axis: 'z', at: 9, from: -8, to: 20, h: PH, mat: WALL, trim: TRIM, openings: [{ at: 13, w: 3.2, style: 'round', ...sign({ neg: 'Automation workshop' }) }, { at: -1, w: 3.2, style: 'round', ...sign({ neg: 'Experimental sandbox' }) }] });
  partition(room, { axis: 'x', at: 6, from: -19, to: -9, h: PH, mat: WALL, trim: TRIM, openings: [{ at: -10.45, w: 2.3, style: 'round' }] });
  partition(room, { axis: 'x', at: 6, from: 9, to: 19, h: PH, mat: WALL, trim: TRIM, openings: [{ at: 14, w: 3, style: 'round' }] });
  partition(room, { axis: 'x', at: -8, from: -19, to: 19, h: PH, mat: WALL, trim: TRIM, openings: [{ at: 0, w: 6, style: 'round', ...sign({ pos: 'Demonstration theatre' }) }, { at: 17.2, w: 2.8, style: 'round' }] });
  zone(room, 'atrium', 'Atrium', -9, -8, 9, 20, [0, 11], 'The AI core');
  zone(room, 'imagelab', 'Image-generation lab', -19, 6, -9, 20, [-14, 12], 'Input → tool → output');
  zone(room, 'tools', 'Tools collection', -19, -8, -9, 6, [-13.5, -1], 'The stack, by what it’s for');
  zone(room, 'automation', 'Automation workshop', 9, 6, 19, 20, [13.5, 12], 'The T20 pipeline');
  zone(room, 'sandbox', 'Experimental sandbox', 9, -8, 19, 6, [13.5, -1], 'Lenses, grades, AI films');
  zone(room, 'theatre', 'Demonstration theatre', -19, -20, 19, -8, [0, -10], 'Workshops on stage');

  // ===== Atrium: the core =====
  const core = new THREE.Group();
  core.position.set(0, 0, 4);
  core.add(mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.8, 32), WHITE_METAL, 0, 0.4, 0));
  core.add(new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.05, 8, 64), glow(C, 3)).rotateX(Math.PI / 2).translateZ(-0.82));
  const brain = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: C, wireframe: true, transparent: true, opacity: 0.85 }));
  brain.position.y = 3.6;
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 16), glow(V, 3));
  inner.position.y = 3.6;
  const rings = [0, 1, 2].map((k) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1 + k * 0.38, 0.03, 6, 80), glow(k === 1 ? V : C, 2.5));
    ring.position.y = 3.6;
    ring.userData.dynamic = true;
    core.add(ring);
    return ring;
  });
  brain.userData.dynamic = inner.userData.dynamic = true;
  core.add(brain, inner);
  // a light column rising from the core to the ceiling
  core.add(mesh(new THREE.CylinderGeometry(0.9, 1.6, 9.2, 32, 1, true), new THREE.MeshBasicMaterial({ color: C, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), 0, 5, 0, false));
  const coreLabel = plate(3.6, 0.7, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,194,255,0.16)';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#e6fbff';
    c.font = `800 ${h * 0.5}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('STUDIO AI · CORE', w / 2, h / 2 + 2);
  }, { transparent: true });
  coreLabel.position.set(0, 6.4, 0);
  core.add(coreLabel);
  g.add(core);
  addCollider(room, 0, 4, 2.7);
  room.updaters.push({
    update: (t) => {
      brain.rotation.set(t * 0.3, t * 0.5, 0);
      inner.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08);
      rings.forEach((ring, k) => ring.rotation.set(Math.PI / 2 + Math.sin(t * 0.6 + k) * 0.6, t * (0.3 + k * 0.15), 0));
      coreLabel.lookAt(room.origin.x, 6.4, room.origin.z + 30);
    },
  });
  addThing(room, 0, 7.4, { kind: 'place', id: 'ai', label: 'The AI Hub', verb: 'About this lab' });
  // the three principles, floating over the way in
  ['Prompts are inputs', 'Tools are modules', 'Systems create consistency'].forEach((text, k) => {
    const panel = new THREE.Group();
    panel.position.set(-5.4 + k * 5.4, 4.4, 13.2);
    panel.add(mesh(new THREE.BoxGeometry(4.4, 1.5, 0.06), GLASS, 0, 0, -0.04, false));
    const label = plate(4.2, 1.3, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = C;
      c.font = `600 ${h * 0.16}px ${FONT.mono}`;
      c.fillText(`PRINCIPLE 0${k + 1}`, 24, h * 0.3);
      c.fillStyle = '#ffffff';
      fit(c, text, { weight: 800, size: h * 0.3, min: h * 0.18, family: FONT.display, maxW: w - 48 });
      c.fillText(text, 24, h * 0.72);
    }, { transparent: true });
    label.position.z = -0.005;
    label.rotation.y = Math.PI;
    panel.add(label);
    panel.rotation.y = Math.PI;
    g.add(panel);
    room.updaters.push({ update: (t) => (panel.position.y = 4.4 + Math.sin(t * 1.2 + k) * 0.1) });
  });
  // the studio bot, circling the core
  const bot = new THREE.Group();
  bot.add(mesh(new THREE.SphereGeometry(0.35, 20, 14), WHITE_METAL));
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 10, -0.9, 1.8, 1.1, 0.8), glow(C, 2));
  visor.position.z = 0.08;
  bot.add(visor);
  bot.traverse((o) => (o.userData.dynamic = true));
  g.add(bot);
  room.updaters.push({
    update: (t) => {
      const a = t * 0.5;
      bot.position.set(Math.cos(a) * 4.4, 2.2 + Math.sin(t * 2) * 0.2, 4 + Math.sin(a) * 4.4);
      bot.rotation.y = -a;
    },
  });
  // ceiling light panels over the atrium
  for (let k = -1; k <= 1; k++) g.add(mesh(new THREE.BoxGeometry(4, 0.04, 1.2), glow('#dff6ff', 1.3), k * 5.5, 9.95, 6, false));
  lamp(room, 0, 6.5, 6, '#bfefff', 8, 16);
  addNpc(room, person({ seed: r(), style: 'blazer', accent: C }), 3.6, 15.4, faceTo(3.6, 15.4, 0, 19), 'talk', 'ai', { lines: AIHUB.quotes, name: 'Hub guide' });

  // ===== Image-generation lab =====
  floorPatch(room, -14, 13, 9.6, 13.6, new THREE.MeshStandardMaterial({ color: '#0f1830', roughness: 0.4, metalness: 0.2 }));
  // the founder image generator, as a workflow on the back wall: one photo in, a library out
  const flow = plate(7.4, 3.4, (c, w, h) => {
    c.fillStyle = '#0b1222';
    c.fillRect(0, 0, w, h);
    c.fillStyle = C;
    c.font = `600 ${h * 0.06}px ${FONT.mono}`;
    c.fillText('FOUNDER IMAGE GENERATOR', 40, h * 0.11);
    c.fillStyle = '#ffffff';
    c.font = `800 ${h * 0.09}px ${FONT.display}`;
    c.fillText('One photo in. A 4K campaign library out.', 40, h * 0.22);
    c.fillStyle = '#8fb3d9';
    c.font = `600 ${h * 0.05}px ${FONT.sans}`;
    const cols = [['INPUT', 0.08], ['THE TOOL', 0.38], ['OUTPUT', 0.7]];
    for (const [t, x] of cols) c.fillText(t, w * x, h * 0.34);
    c.strokeStyle = C;
    c.lineWidth = 8;
    for (const [x0, x1] of [[0.25, 0.31], [0.63, 0.67]]) {
      c.beginPath();
      c.moveTo(w * x0, h * 0.64);
      c.lineTo(w * x1, h * 0.64);
      c.lineTo(w * x1 - 26, h * 0.6);
      c.moveTo(w * x1, h * 0.64);
      c.lineTo(w * x1 - 26, h * 0.68);
      c.stroke();
    }
  }, { res: 200 });
  flow.position.set(-15.1, 3.3, 6.17);
  g.add(flow);
  const fIn = framed(room, -17.7, 2.9, 6.2, 0, 1.3, 1.67, screenMat('work/profile.jpg', 1.3 / 1.67), { frame: C, border: 0.04 });
  const fTool = framed(room, -15.3, 2.9, 6.2, 0, 2.2, 1.36, screenMat('work/founder-grid.jpg', 2.2 / 1.36), { frame: '#1b2338', border: 0.05 });
  const outs = ['assets/img/tools/founder-1.jpg', 'assets/img/tools/founder-2.jpg', 'work/t20-1.jpg', 'work/social-1.jpg'];
  outs.forEach((src, k) => {
    const f = framed(room, -13.3 + (k % 2) * 0.95, 3.4 - Math.floor(k / 2) * 1.0, 6.2, 0, 0.85, 0.9, screenMat(src, 0.95), { frame: C, border: 0.03 });
    clickable(room, f.pic, { kind: 'project', slug: 'toolkit' });
  });
  for (const f of [fIn, fTool]) clickable(room, f.pic, { kind: 'project', slug: 'toolkit' });
  station(room, -17.4, 15.2, Math.PI / 2, { name: 'Product Image Generator', sub: 'Virtual product photography', img: 'work/prod-ui.jpg', slug: 'toolkit' });
  station(room, -17.4, 10.4, Math.PI / 2, { name: 'Advanced Image Editor', sub: 'Continuity across angles and faces', img: 'work/edit-ui.jpg', slug: 'toolkit' });
  addThing(room, -15.2, 8.0, { kind: 'project', slug: 'toolkit', label: 'Founder Image Generator: one photo in, a library out', verb: 'Open the toolkit' });
  addThing(room, -15.6, 15.2, { kind: 'project', slug: 'toolkit', label: 'Product Image Generator', verb: 'Open tool' });
  addThing(room, -15.6, 10.4, { kind: 'project', slug: 'toolkit', label: 'Advanced Image Editor', verb: 'Open tool' });
  addNpc(room, person({ seed: r(), style: 'techwear', accent: C }), -16.3, 14.6, -Math.PI / 2, 'type', 'ai');
  // the product image generator's subject: a product on a turntable under a softbox
  const turn = new THREE.Group();
  turn.position.set(-11.4, 0, 16.2);
  turn.add(mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.9, 24), WHITE_METAL, 0, 0.45, 0));
  const prod = new THREE.Group();
  prod.position.y = 0.92;
  prod.add(mesh(new THREE.BoxGeometry(0.34, 0.5, 0.22), solid('#2f6bff', { roughness: 0.3 }), 0, 0.25, 0));
  prod.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), solid('#f4f4f2'), 0, 0.54, 0));
  prod.traverse((o) => (o.userData.dynamic = true));
  turn.add(prod);
  turn.add(mesh(new THREE.BoxGeometry(0.9, 0.9, 0.08), glow('#ffffff', 1.8), 0.9, 2.2, -0.4, false).rotateY(-0.7).rotateX(-0.4));
  g.add(turn);
  addCollider(room, -11.4, 16.2, 0.7);
  room.updaters.push({ update: (t) => (prod.rotation.y = t * 0.8) });
  lamp(room, -14, 5, 13, '#bfefff', 5, 10);

  // ===== Automation workshop: the T20 pipeline =====
  floorPatch(room, 14, 13, 9.6, 13.6, new THREE.MeshStandardMaterial({ color: '#101a33', roughness: 0.5 }));
  const belt = new THREE.Group();
  belt.position.set(14, 0, 15.6);
  belt.rotation.y = Math.PI / 2;
  belt.add(mesh(new THREE.BoxGeometry(1.8, 0.9, 8), DARK, 0, 0.45, 0));
  belt.add(mesh(new THREE.BoxGeometry(1.6, 0.05, 8), solid('#1f2a44', { roughness: 0.5 }), 0, 0.93, 0));
  for (const sx of [-0.92, 0.92]) belt.add(mesh(new THREE.BoxGeometry(0.06, 0.06, 8), glow(C, 1.6), sx, 0.95, 0, false));
  const machine = mesh(new THREE.BoxGeometry(2.6, 2.4, 2.4), WHITE_METAL, 0, 2.1, 0);
  belt.add(machine);
  for (const sz of [-1.21, 1.21]) belt.add(mesh(new THREE.PlaneGeometry(1.6, 0.5), glow(C, 3), 0, 1.3, sz, false).rotateY(sz > 0 ? 0 : Math.PI));
  const mlabel = plate(2.4, 0.8, (c, w, h) => {
    c.fillStyle = '#0b1222';
    c.fillRect(0, 0, w, h);
    c.fillStyle = C;
    c.font = `700 ${h * 0.2}px ${FONT.mono}`;
    fillFit(c, 'SOCIAL CONTENT GEN', 20, h * 0.36, w - 40);
    c.fillStyle = '#ffffff';
    c.font = `800 ${h * 0.28}px ${FONT.display}`;
    fillFit(c, '200+ posts, one pipeline', 20, h * 0.76, w - 40);
  });
  mlabel.position.set(1.31, 2.7, 0);
  mlabel.rotation.y = Math.PI / 2;
  belt.add(mlabel);
  const cardMats = ['work/profile.jpg', 'work/t20-1.jpg', 'work/social-1.jpg', 'work/t20-5.jpg', 'work/t20-3.jpg'].map((src) => screenMat(src, 0.7));
  const cards = [];
  for (let k = 0; k < 10; k++) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), cardMats[0]);
    card.rotation.x = -Math.PI / 2;
    card.userData.dynamic = true;
    belt.add(card);
    cards.push({ card, off: k / 10 });
  }
  g.add(belt);
  addBox(room, 10, 14.6, 18, 16.6);
  room.updaters.push({
    update: (t) => {
      for (const { card, off } of cards) {
        const u = (t * 0.06 + off) % 1;
        const z = 3.8 - u * 7.6;
        card.position.set(0, 0.97 + (Math.abs(z) < 1.3 ? -5 : 0), z);
        card.material = z > 0 ? cardMats[0] : cardMats[1 + Math.floor((off * 10) % 4)];
      }
    },
  });
  // the campaign it made, on the side wall
  const t20 = PROJECTS.t20;
  t20.images.forEach((src, k) => {
    const f = framed(room, 18.9, 3.4, 17.6 - k * 3.0, -Math.PI / 2, 2.6, 1.46, screenMat(src, 16 / 9), { frame: C, border: 0.04 });
    clickable(room, f.pic, { kind: 'project', slug: 't20' });
  });
  const t20panel = plate(4.4, 1.6, (c, w, h) => {
    c.fillStyle = '#0b1222';
    c.fillRect(0, 0, w, h);
    c.fillStyle = C;
    c.font = `600 ${h * 0.1}px ${FONT.mono}`;
    c.fillText('THE T20 PIPELINE', 30, h * 0.18);
    c.fillStyle = '#ffffff';
    fit(c, t20.title, { weight: 800, size: h * 0.15, min: h * 0.1, family: FONT.display, maxW: w - 60 });
    c.fillText(t20.title, 30, h * 0.38);
    t20.metrics.forEach(([v, l], k) => {
      const x = 30 + k * ((w - 60) / 4);
      c.fillStyle = '#ffffff';
      c.font = `800 ${h * 0.2}px ${FONT.display}`;
      c.fillText(v, x, h * 0.7);
      c.fillStyle = '#8fb3d9';
      c.font = `500 ${h * 0.075}px ${FONT.sans}`;
      wrap(c, l, (w - 60) / 4 - 16, 2).forEach((ln, i) => c.fillText(ln, x, h * 0.82 + i * h * 0.09));
    });
  });
  t20panel.position.set(14, 3.6, 19.88);
  t20panel.rotation.y = Math.PI;
  g.add(t20panel);
  clickable(room, t20panel, { kind: 'project', slug: 't20' });
  addThing(room, 14, 13.4, { kind: 'project', slug: 't20', label: 'The T20 pipeline: 81 films, 200+ posts', verb: 'See it in action' });
  addThing(room, 10.6, 17.8, { kind: 'project', slug: 'social-gen', label: 'Social Content Gen: a founder photo in, a post out', verb: 'Open' });
  addNpc(room, person({ seed: r(), style: 'techwear', accent: C }), 12.2, 13.2, faceTo(12.2, 13.2, 14, 15.6), 'present', 'ai', { name: 'Pipeline engineer', lines: ['One photo per founder. Three lighting set-ups per match slot. The belt never stops.', '200+ posts came off this line, including founders who never appeared on TV.'] });
  lamp(room, 14, 5, 13, '#bfefff', 5, 10);

  // ===== Tools collection =====
  floorPatch(room, -14, -1, 9.6, 13.6, new THREE.MeshStandardMaterial({ color: '#0d1530', roughness: 0.6 }));
  // seven bays along the outer wall and the back partition, one per kind of work
  const byName = Object.fromEntries(TOOLS.map((t) => [t.name, t]));
  const palette = [C, V, '#ff4f8b', '#f2a516', '#00a79d', '#9be86a', '#e6ebf2'];
  TOOL_GROUPS.forEach(([cat, names], k) => {
    const onSide = k < 4;
    const x = onSide ? -18.88 : -16.6 + (k - 4) * 2.9;
    const z = onSide ? 4.3 - k * 3.15 : -7.82;
    const ry = onSide ? Math.PI / 2 : 0;
    const tools = names.map((n) => byName[n]).filter(Boolean);
    const pw = onSide ? 2.9 : 2.7;
    const p = plate(pw, 3.3, (c, w, h) => {
      c.fillStyle = '#0d1730';
      c.fillRect(0, 0, w, h);
      c.fillStyle = palette[k];
      c.fillRect(0, 0, w, 10);
      c.font = `600 ${h * 0.045}px ${FONT.mono}`;
      c.fillText(`0${k + 1}`, 28, h * 0.08);
      c.fillStyle = '#ffffff';
      fit(c, cat, { weight: 800, size: h * 0.07, min: h * 0.045, family: FONT.display, maxW: w - 56 });
      c.fillText(cat, 28, h * 0.16);
      let y = h * 0.26;
      for (const t of tools) {
        c.fillStyle = 'rgba(255,255,255,0.07)';
        c.beginPath();
        c.roundRect(20, y - h * 0.05, w - 40, h * 0.12, 14);
        c.fill();
        c.fillStyle = palette[k];
        c.beginPath();
        c.arc(46, y + h * 0.01, 9, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.font = `700 ${h * 0.036}px ${FONT.sans}`;
        fillFit(c, t.name, 66, y, w - 100);
        c.fillStyle = '#9fb0cc';
        c.font = `500 ${h * 0.028}px ${FONT.sans}`;
        fillFit(c, t.use, 66, y + h * 0.04, w - 100);
        y += h * 0.135;
      }
    }, { res: 220 });
    p.position.set(x, 3.0, z);
    p.rotation.y = ry;
    g.add(p);
    g.add(mesh(new THREE.BoxGeometry(pw + 0.12, 3.42, 0.04), glow(palette[k], 0.8), x + (onSide ? -0.03 : 0), 3.0, z - (onSide ? 0 : 0.03), false).rotateY(ry));
    clickable(room, p, { kind: 'tools' });
  });
  addThing(room, -14.5, -1, { kind: 'tools', label: 'The tools collection', verb: 'See every tool' });
  // a low bench in the middle to sit and read
  g.add(mesh(new THREE.BoxGeometry(3, 0.45, 0.7), solid('#1b2338'), -13.4, 0.225, 0.4));
  addBox(room, -14.9, 0.05, -11.9, 0.75);
  addNpc(room, person({ seed: r(), style: 'hoodie', accent: C }), -12.4, -3.6, faceTo(-12.4, -3.6, -14, -7.8), 'think', 'ai');
  lamp(room, -14, 5, -1, '#bfefff', 5, 10);

  // ===== Experimental sandbox =====
  floorPatch(room, 14, -1, 9.6, 13.6, new THREE.MeshStandardMaterial({ color: '#160f2e', roughness: 0.5 }));
  // the Cinematography Tool: a wall of lenses and a light rig on a test subject
  const lensWall = new THREE.Group();
  lensWall.position.set(18.85, 0, -1);
  lensWall.rotation.y = -Math.PI / 2;
  lensWall.add(mesh(new THREE.BoxGeometry(6.4, 3.4, 0.12), solid('#111a30'), 0, 2.8, -0.05));
  for (let k = 0; k < 20; k++) {
    const lx = -2.8 + (k % 10) * 0.62;
    const ly = 3.6 - Math.floor(k / 10) * 1.0;
    const len = mesh(new THREE.CylinderGeometry(0.2 + (k % 3) * 0.03, 0.22, 0.3 + (k % 4) * 0.1, 18), solid('#1a1a1a', { metalness: 0.6, roughness: 0.35 }), lx, ly, 0.2);
    len.rotation.x = Math.PI / 2;
    lensWall.add(len);
    lensWall.add(mesh(new THREE.CircleGeometry(0.15, 18), glow(k % 2 ? V : C, 1.2), lx, ly, 0.36 + (k % 4) * 0.05, false));
  }
  const lensHead = plate(6.2, 0.5, (c, w, h) => {
    c.fillStyle = '#0b1222';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff';
    c.font = `700 ${h * 0.46}px ${FONT.sans}`;
    c.textBaseline = 'middle';
    c.fillText('CINEMATOGRAPHY TOOL · 20+ lenses · 100+ grades', 20, h / 2 + 1);
  });
  lensHead.position.set(0, 4.75, 0.02);
  lensWall.add(lensHead);
  g.add(lensWall);
  const cine = framed(room, 18.88, 3.0, 4.0, -Math.PI / 2, 2.6, 1.21, screenMat('work/cine-ui.jpg', 2.6 / 1.21), { frame: '#1b2338', border: 0.04 });
  clickable(room, cine.pic, { kind: 'project', slug: 'toolkit' });
  addThing(room, 16.6, -1, { kind: 'project', slug: 'toolkit', label: 'Cinematography Tool: lenses and grades', verb: 'Open tool' });
  // AI Works: the Rajasthan series and the films, on a curved screen
  PROJECTS['ai-works'].images.forEach((src, k) => {
    const f = framed(room, 10.4 + k * 2.1, 3.2, -7.82, 0, 1.9, 1.3, screenMat(src, 1.9 / 1.3), { frame: V, border: 0.04 });
    clickable(room, f.pic, { kind: 'project', slug: 'ai-works' });
  });
  addThing(room, 12.5, -5.6, { kind: 'project', slug: 'ai-works', label: 'AI Works: Rajasthan in Midjourney, and short films', verb: 'Open' });
  // a holo table in the middle, with a hovering model turning over it
  const holo = new THREE.Group();
  holo.position.set(12.6, 0, 0.6);
  holo.add(mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.95, 28), WHITE_METAL, 0, 0.475, 0));
  holo.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.03, 28), glow(C, 1.6), 0, 0.96, 0, false));
  const model = new THREE.Mesh(new THREE.TorusKnotGeometry(0.32, 0.1, 80, 10), new THREE.MeshBasicMaterial({ color: V, wireframe: true, transparent: true, opacity: 0.8 }));
  model.position.y = 1.7;
  model.userData.dynamic = true;
  holo.add(model);
  g.add(holo);
  addCollider(room, 12.6, 0.6, 1.15);
  room.updaters.push({ update: (t) => model.rotation.set(t * 0.4, t * 0.7, 0) });
  addNpc(room, person({ seed: r(), style: 'streetwear', accent: V }), 11.2, 2.0, faceTo(11.2, 2.0, 12.6, 0.6), 'think', 'ai', { name: 'Experimenter', lines: ['Some of these become tools. Most become lessons.', 'Every lens on that wall is simulated. Pick one and the grade follows.'] });
  lamp(room, 14, 5, -1, '#c9b8ff', 5, 10);

  // ===== Demonstration theatre: the workshops =====
  floorPatch(room, 0, -14, 37.6, 11.6, new THREE.MeshStandardMaterial({ color: '#0c1326', roughness: 0.7 }));
  g.add(mesh(new THREE.BoxGeometry(14, 0.4, 3.0), solid('#16223d'), 0, 0.2, -18.4));
  g.add(mesh(new THREE.BoxGeometry(14.04, 0.04, 0.06), glow(C, 1.6), 0, 0.4, -16.9, false));
  addBox(room, -7, -20, 7, -16.9);
  const talk = bigScreen(room, 0, 4.4, -D / 2 + 0.1, 0, 10.4, 5.85, screenMat('work/talk-growthschool.jpg', 16 / 9));
  clickable(room, talk.screen, { kind: 'project', slug: 'mentor' });
  const mentor = PROJECTS.mentor;
  const talkInfo = plate(4.6, 2.6, (c, w, h) => {
    c.fillStyle = '#0b1222';
    c.fillRect(0, 0, w, h);
    c.fillStyle = C;
    c.font = `600 ${h * 0.07}px ${FONT.mono}`;
    c.fillText('AI DESIGN WORKSHOPS', 32, h * 0.14);
    c.fillStyle = '#ffffff';
    c.font = `600 ${h * 0.075}px ${FONT.sans}`;
    wrap(c, '“Revolutionizing Design Workflows with AI: Razorpay’s Success Story”, for GrowthSchool and Designland.', w - 64, 4).forEach((l, k) => c.fillText(l, 32, h * 0.3 + k * h * 0.1));
    mentor.metrics.forEach(([v, l], k) => {
      c.fillStyle = '#ffffff';
      c.font = `800 ${h * 0.16}px ${FONT.display}`;
      c.fillText(v, 32 + k * (w / 2), h * 0.82);
      c.fillStyle = '#8fb3d9';
      c.font = `500 ${h * 0.06}px ${FONT.sans}`;
      c.fillText(l, 32 + k * (w / 2), h * 0.93);
    });
  });
  talkInfo.position.set(-11, 3.6, -D / 2 + 0.12);
  g.add(talkInfo);
  clickable(room, talkInfo, { kind: 'project', slug: 'mentor' });
  const room2 = framed(room, 11, 3.6, -D / 2 + 0.1, 0, 4.4, 2.6, screenMat('work/talk-room.jpg', 4.4 / 2.6), { frame: C, border: 0.04 });
  clickable(room, room2.pic, { kind: 'project', slug: 'mentor' });
  addNpc(room, person({ seed: r(), style: 'blazer', accent: C }), -2.4, -18.0, 0.25, 'present', 'ai', { y: 0.4, lines: AIHUB.quotes, name: 'Workshop lead' });
  addThing(room, 0, -14.4, { kind: 'project', slug: 'mentor', label: 'AI design workshops', verb: 'Open' });
  // the audience: three rows of chairs
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 8; k++) {
      const x = -7.7 + k * 2.2;
      const z = -14.2 + row * 1.7;
      chair(room, x, z, Math.PI, { color: '#2a3654' });
      if ((k + row * 3) % 4 === 1) addNpc(room, person({ seed: r(), accent: C }), x, z - 0.05, Math.PI, 'sit', 'ai', { y: 0.02 });
    }
  }
  lamp(room, 0, 6, -15, '#bfefff', 6, 14);
  for (const x of [-18, 18]) plant(room, x, -9, { s: 1.1, pot: '#16223d', leaf: '#3f8a6a' });
  return room;
}
