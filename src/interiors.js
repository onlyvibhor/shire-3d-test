import * as THREE from 'three';
import { PROJECTS, TOOLS, FAVOURITES, OWNER, AWARDS, AIHUB, HOME, FUN, HALL, AWARD_LIST } from './data.js';
import { makePerson, animate, giveProp } from './characters.js';
import { screenMat, makeDesk, dashboardTexture } from './props.js';
import { WHITE_METAL, BRUSHED, CHROME, GLASS, GOLD, WOOD, DARK, solid, glow, mesh, canvasTexture, deepMerge } from './materials.js';
import { rng } from './world.js';

// Indoor sets live far from the island; entering one hides the outdoors and relights the scene.

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(' ');
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lineH;
      line = w;
    } else line = t;
  }
  ctx.fillText(line, x, y);
  return y + lineH;
}

function plate(w, h, draw, opts = {}) {
  const tex = canvasTexture(Math.round(w * 256), Math.round(h * 256), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: !!opts.transparent, toneMapped: false }));
  m.userData.dynamic = true;
  return m;
}

function gridTexture(bg, line, cells = 8) {
  const t = canvasTexture(512, 512, (ctx, w) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = line;
    ctx.lineWidth = 3;
    for (let i = 0; i <= cells; i++) {
      const p = (i / cells) * w;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, w);
      ctx.moveTo(0, p);
      ctx.lineTo(w, p);
      ctx.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function plankTexture() {
  const t = canvasTexture(512, 512, (ctx, w) => {
    const tones = ['#b98a5c', '#a97a4e', '#c39468', '#b08254'];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = tones[i % 4];
      ctx.fillRect(0, i * 64, w, 64);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, i * 64, w, 2);
      ctx.fillRect(((i * 197) % 400) + 40, i * 64, 2, 64);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// A box room: floor, four walls with a door gap in the +Z wall, a ceiling.
function makeRoom({ id, origin, w, d, h, floor, wall, ceiling, trim, doorColor }) {
  const g = new THREE.Group();
  g.position.copy(origin);
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  g.add(floorMesh);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = h;
  g.add(ceil);
  const wallGeo = (len) => new THREE.PlaneGeometry(len, h);
  const back = new THREE.Mesh(wallGeo(w), wall);
  back.position.set(0, h / 2, -d / 2);
  const left = new THREE.Mesh(wallGeo(d), wall);
  left.position.set(-w / 2, h / 2, 0);
  left.rotation.y = Math.PI / 2;
  const right = new THREE.Mesh(wallGeo(d), wall);
  right.position.set(w / 2, h / 2, 0);
  right.rotation.y = -Math.PI / 2;
  const doorW = 3;
  const seg = (w - doorW) / 2;
  const fl = new THREE.Mesh(wallGeo(seg), wall);
  fl.position.set(-w / 2 + seg / 2, h / 2, d / 2);
  fl.rotation.y = Math.PI;
  const fr = fl.clone();
  fr.position.x = w / 2 - seg / 2;
  const lintel = new THREE.Mesh(new THREE.PlaneGeometry(doorW, h - 3.6), wall);
  lintel.position.set(0, 3.6 + (h - 3.6) / 2, d / 2);
  lintel.rotation.y = Math.PI;
  for (const m of [back, left, right, fl, fr, lintel]) {
    m.receiveShadow = true;
    g.add(m);
  }
  // skirting trim
  for (const [x, z, len, ry] of [[0, -d / 2 + 0.06, w, 0], [-w / 2 + 0.06, 0, d, Math.PI / 2], [w / 2 - 0.06, 0, d, Math.PI / 2]]) {
    const s = mesh(new THREE.BoxGeometry(len, 0.18, 0.12), trim, x, 0.09, z, false);
    s.rotation.y = ry;
    g.add(s);
  }
  // the way out
  const door = new THREE.Mesh(new THREE.PlaneGeometry(doorW, 3.6), glow(doorColor, 1.2));
  door.position.set(0, 1.8, d / 2 - 0.02);
  door.rotation.y = Math.PI;
  g.add(door);
  const exitSign = plate(1.4, 0.4, (ctx, cw, ch) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#4ade80';
    ctx.font = `700 ${ch * 0.6}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT ⟶ ISLAND', cw / 2, ch / 2 + 2);
  });
  exitSign.position.set(0, 4.0, d / 2 - 0.05);
  exitSign.rotation.y = Math.PI;
  g.add(exitSign);
  return {
    id,
    group: g,
    origin: origin.clone(),
    w,
    d,
    h,
    floor: floorMesh,
    bounds: { minX: -w / 2 + 0.6, maxX: w / 2 - 0.6, minZ: -d / 2 + 0.6, maxZ: d / 2 - 0.6 },
    spawn: { x: 0, z: d / 2 - 2.5, heading: Math.PI },
    exit: { x: 0, z: d / 2 - 0.8 },
    colliders: [],
    interactables: [],
    clickables: [],
    npcs: [],
    updaters: [],
    projects: [],
  };
}

const local = (room, x, z) => ({ x: room.origin.x + x, z: room.origin.z + z });
function addCollider(room, x, z, r) {
  room.colliders.push({ ...local(room, x, z), r });
}
function addThing(room, x, z, thing) {
  room.interactables.push({ ...thing, ...local(room, x, z) });
}
function addNpc(room, p, x, z, rotY, action, dept, extra = {}) {
  p.root.position.set(x, extra.y ?? 0, z);
  p.root.rotation.y = rotY;
  room.group.add(p.root);
  room.updaters.push({ update: (t) => animate(p, action, t) });
  room.npcs.push({ p, dept, ...extra });
  return p;
}
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

// ---------- AI Hub ----------

function buildAIHub(origin) {
  const C = AIHUB.color;
  const floorTex = gridTexture('#0b1222', 'rgba(0,194,255,0.35)', 8);
  floorTex.repeat.set(8, 6);
  const room = makeRoom({
    id: 'ai',
    origin,
    w: 34,
    d: 26,
    h: 9,
    floor: new THREE.MeshPhysicalMaterial({ map: floorTex, roughness: 0.2, metalness: 0.3, clearcoat: 1, emissive: '#00c2ff', emissiveMap: floorTex, emissiveIntensity: 0.25 }),
    wall: new THREE.MeshStandardMaterial({ color: '#111b30', roughness: 0.6 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#0a1020', roughness: 0.8 }),
    trim: glow(C, 1.6),
    doorColor: C,
  });
  const g = room.group;
  const r = rng(901);
  // light strips on the walls and ceiling panels
  for (let k = -3; k <= 3; k++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 7, 0.08), glow(k % 2 ? '#7b5cff' : C, 2));
    strip.position.set(k * 4.6, 4.5, -12.95);
    g.add(strip);
  }
  for (let k = -2; k <= 2; k++) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.2), glow('#dff6ff', 1.4));
    panel.rotation.x = Math.PI / 2;
    panel.position.set(k * 6.5, 8.95, 0);
    g.add(panel);
  }

  // Holographic core
  const core = new THREE.Group();
  core.position.set(0, 0, -1);
  core.add(mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.8, 32), WHITE_METAL, 0, 0.4, 0));
  core.add(new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.05, 8, 64), glow(C, 3)).rotateX(Math.PI / 2).translateZ(-0.82));
  const brain = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), new THREE.MeshBasicMaterial({ color: C, wireframe: true, transparent: true, opacity: 0.85 }));
  brain.position.y = 3.2;
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 16), glow('#7b5cff', 3));
  inner.position.y = 3.2;
  const rings = [0, 1, 2].map((k) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2 + k * 0.35, 0.03, 6, 80), glow(k === 1 ? '#7b5cff' : C, 2.5));
    ring.position.y = 3.2;
    ring.userData.dynamic = true;
    core.add(ring);
    return ring;
  });
  brain.userData.dynamic = inner.userData.dynamic = true;
  core.add(brain, inner);
  const coreLabel = plate(3.4, 0.7, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,194,255,0.18)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e6fbff';
    ctx.font = `800 ${h * 0.5}px "Bricolage Grotesque", Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STUDIO AI · CORE', w / 2, h / 2 + 2);
  }, { transparent: true });
  coreLabel.position.set(0, 5.6, 0);
  core.add(coreLabel);
  g.add(core);
  addCollider(room, 0, -1, 2.7);
  room.updaters.push({
    update: (t) => {
      brain.rotation.set(t * 0.3, t * 0.5, 0);
      inner.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08);
      rings.forEach((ring, k) => ring.rotation.set(Math.PI / 2 + Math.sin(t * 0.6 + k) * 0.6, t * (0.3 + k * 0.15), 0));
      coreLabel.lookAt(room.origin.x, 5.6, room.origin.z + 20);
    },
  });
  addThing(room, 0, 2.6, { kind: 'place', id: 'ai', label: 'The AI Hub', verb: 'About this lab' });

  // Tool stations along the back wall
  const stations = [
    ['Cinematography Tool', '20+ lenses · light · 100+ grades', 'work/cine-ui.jpg', 'toolkit'],
    ['Product Image Generator', 'Virtual product photography', 'work/prod-ui.jpg', 'toolkit'],
    ['Advanced Image Editor', 'Continuity across angles and faces', 'work/edit-ui.jpg', 'toolkit'],
    ['Founder Image Generator', 'One photo in, 4K library out', 'work/founder-grid.jpg', 'toolkit'],
  ];
  stations.forEach(([name, sub, img, slug], k) => {
    const x = -12 + k * 8;
    const z = -11;
    const st = new THREE.Group();
    st.position.set(x, 0, z);
    st.add(mesh(new THREE.BoxGeometry(4.2, 2.6, 0.2), DARK, 0, 3.1, -0.1));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), screenMat(img, 4 / 2.4));
    screen.position.set(0, 3.1, 0.01);
    screen.userData.action = { kind: 'project', slug };
    screen.userData.dynamic = true;
    st.add(screen);
    room.clickables.push(screen);
    st.add(mesh(new THREE.BoxGeometry(0.2, 1.8, 0.2), BRUSHED, 0, 0.9, -0.1));
    st.add(mesh(new THREE.BoxGeometry(2.6, 0.08, 1), WHITE_METAL, 0, 1.05, 0.6));
    const title = plate(4.2, 0.6, (ctx, w, h) => {
      ctx.fillStyle = '#0b1222';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C;
      ctx.fillRect(0, h - 6, w, 6);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${h * 0.36}px Inter, sans-serif`;
      ctx.fillText(name, 24, h * 0.45);
      ctx.fillStyle = '#8fb3d9';
      ctx.font = `500 ${h * 0.24}px Inter, sans-serif`;
      ctx.fillText(sub, 24, h * 0.82);
    });
    title.position.set(0, 4.75, 0.02);
    st.add(title);
    g.add(st);
    addCollider(room, x, z + 0.4, 1.5);
    addThing(room, x, z + 2.2, { kind: 'project', slug, label: name, verb: 'Open tool' });
    if (k % 2 === 0) {
      const p = makePerson({ accent: C, seed: r(), top: ['#1f2937', '#e5e7eb'][k / 2], style: 'techwear' });
      addNpc(room, p, x + 0.6, z + 1.6, Math.PI, 'type', 'ai');
    }
  });

  // The stack: tool wall on the left
  const stack = plate(14, 6, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0d1730');
    grad.addColorStop(1, '#1b1240');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${h * 0.09}px "Bricolage Grotesque", Inter, sans-serif`;
    ctx.fillText('The stack', 60, h * 0.13);
    ctx.fillStyle = '#8fb3d9';
    ctx.font = `500 ${h * 0.035}px Inter, sans-serif`;
    ctx.fillText('Tools the studio builds with, every day', 60, h * 0.19);
    const cols = 3;
    const cw = (w - 120) / cols;
    TOOLS.forEach((tool, i) => {
      const cx = 60 + (i % cols) * cw;
      const cy = h * 0.25 + Math.floor(i / cols) * h * 0.122;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw - 24, h * 0.105, 18);
      ctx.fill();
      ctx.fillStyle = ['#00c2ff', '#7b5cff', '#ff4f8b', '#f2a516', '#00a79d'][i % 5];
      ctx.beginPath();
      ctx.arc(cx + 34, cy + h * 0.052, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${h * 0.034}px Inter, sans-serif`;
      ctx.fillText(tool.name, cx + 62, cy + h * 0.047, cw - 100);
      ctx.fillStyle = '#9fb0cc';
      ctx.font = `500 ${h * 0.024}px Inter, sans-serif`;
      ctx.fillText(tool.use, cx + 62, cy + h * 0.083, cw - 100);
    });
  });
  stack.position.set(-16.9, 4.2, -1);
  stack.rotation.y = Math.PI / 2;
  g.add(stack);
  addThing(room, -15, -1, { kind: 'tools', label: 'The stack', verb: 'See the tools' });

  // Automation conveyor: one photo in, a campaign library out
  const belt = new THREE.Group();
  belt.position.set(12.5, 0, 0);
  belt.add(mesh(new THREE.BoxGeometry(2, 0.9, 16), DARK, 0, 0.45, 0));
  const beltTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 16), new THREE.MeshStandardMaterial({ color: '#1f2a44', roughness: 0.5 }));
  beltTop.position.y = 0.93;
  belt.add(beltTop);
  const machine = mesh(new THREE.BoxGeometry(2.8, 2.6, 2.6), WHITE_METAL, 0, 2.1, 0);
  belt.add(machine);
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), glow(C, 3));
  slit.position.set(-1.41, 1.5, 0);
  slit.rotation.y = -Math.PI / 2;
  belt.add(slit);
  const mlabel = plate(2.6, 0.9, (ctx, w, h) => {
    ctx.fillStyle = '#0b1222';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C;
    ctx.font = `700 ${h * 0.2}px Inter, sans-serif`;
    ctx.fillText('FOUNDER IMAGE GENERATOR', 20, h * 0.35, w - 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${h * 0.28}px "Bricolage Grotesque", Inter, sans-serif`;
    ctx.fillText('1 photo → 4K library', 20, h * 0.75, w - 40);
  });
  mlabel.position.set(-1.42, 2.8, 0);
  mlabel.rotation.y = -Math.PI / 2;
  belt.add(mlabel);
  const inFrame = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), screenMat('work/profile.jpg', 0.8));
  inFrame.position.set(-1.02, 1.9, 7.3);
  inFrame.rotation.y = -Math.PI / 2;
  belt.add(inFrame);
  const cardMats = ['assets/img/tools/founder-1.jpg', 'assets/img/tools/founder-2.jpg', 'work/social-1.jpg', 'work/t20-1.jpg'].map((src) => screenMat(src, 0.7));
  const cards = [];
  for (let k = 0; k < 10; k++) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.25), cardMats[k % cardMats.length]);
    card.rotation.x = -Math.PI / 2;
    card.userData.dynamic = true;
    belt.add(card);
    cards.push({ card, off: k / 10 });
  }
  const pile = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 1.3), cardMats[k % 4]);
    c.position.set((r() - 0.5) * 0.2, 0.95 + k * 0.05, -7.3 + (r() - 0.5) * 0.2);
    c.rotation.y = (r() - 0.5) * 0.5;
    pile.add(c);
  }
  belt.add(pile);
  g.add(belt);
  addCollider(room, 12.5, -5, 1.4);
  addCollider(room, 12.5, 0, 1.9);
  addCollider(room, 12.5, 5, 1.4);
  addThing(room, 10.4, 3.5, { kind: 'project', slug: 't20', label: 'The T20 pipeline: 81 films, 200+ posts', verb: 'See it in action' });
  room.updaters.push({
    update: (t) => {
      for (const { card, off } of cards) {
        const u = (t * 0.06 + off) % 1;
        const z = 7 - u * 14;
        card.position.set(0, 0.97 + (Math.abs(z) < 1.4 ? -5 : 0), z);
        card.material = z > 0 ? cardMats[0] : cardMats[Math.floor((off * 10) % 4)];
      }
    },
  });
  const engineer = makePerson({ accent: C, seed: r(), style: 'techwear' });
  addNpc(room, engineer, 10.2, -2.5, Math.PI / 2, 'present', 'ai');

  // Principles as floating glass panels near the entrance
  ['Prompts are inputs', 'Tools are modules', 'Systems create consistency'].forEach((text, k) => {
    const x = -7 + k * 7;
    const panel = new THREE.Group();
    panel.position.set(x, 3.6, 6.2);
    panel.rotation.y = Math.PI;
    panel.add(mesh(new THREE.BoxGeometry(4.2, 1.5, 0.06), GLASS, 0, 0, 0, false));
    const label = plate(4, 1.3, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C;
      ctx.font = `600 ${h * 0.16}px Inter, sans-serif`;
      ctx.fillText(`PRINCIPLE 0${k + 1}`, 24, h * 0.3);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${h * 0.3}px "Bricolage Grotesque", Inter, sans-serif`;
      ctx.fillText(text, 24, h * 0.72, w - 48);
    }, { transparent: true });
    label.position.z = -0.05;
    label.rotation.y = Math.PI;
    panel.add(label);
    g.add(panel);
    room.updaters.push({ update: (t) => (panel.position.y = 3.6 + Math.sin(t * 1.2 + k) * 0.12) });
  });

  // Workshop corner
  const talk = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.6), screenMat('work/talk-growthschool.jpg', 4.4 / 2.6));
  talk.position.set(-16.9, 3, 9);
  talk.rotation.y = Math.PI / 2;
  talk.userData.action = { kind: 'project', slug: 'mentor' };
  talk.userData.dynamic = true;
  g.add(talk);
  room.clickables.push(talk);
  for (let row = 0; row < 2; row++) {
    for (let k = 0; k < 3; k++) {
      const x = -12 + row * 2;
      const z = 7.4 + k * 1.3;
      g.add(mesh(new THREE.BoxGeometry(0.7, 0.45, 0.7), solid('#2a3654'), x, 0.45, z));
      g.add(mesh(new THREE.BoxGeometry(0.1, 0.7, 0.7), solid('#2a3654'), x + 0.32, 0.9, z));
      if ((row + k) % 2 === 0) addNpc(room, makePerson({ seed: r(), accent: C }), x, z, -Math.PI / 2, 'sit', 'ai');
    }
  }
  const lead = makePerson({ accent: C, seed: r(), style: 'blazer' });
  addNpc(room, lead, -15.2, 6.8, Math.PI / 2, 'present', 'ai', { lines: AIHUB.quotes, name: 'Workshop lead' });
  addThing(room, -13.5, 9, { kind: 'project', slug: 'mentor', label: 'AI design workshops', verb: 'Open' });
  addCollider(room, -11, 8.7, 2.2);

  // A little studio bot that follows its loop around the core
  const bot = new THREE.Group();
  bot.add(mesh(new THREE.SphereGeometry(0.35, 20, 14), WHITE_METAL));
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 10, -0.9, 1.8, 1.1, 0.8), glow(C, 2));
  visor.position.z = 0.08;
  bot.add(visor);
  g.add(bot);
  room.updaters.push({
    update: (t) => {
      const a = t * 0.5;
      bot.position.set(Math.cos(a) * 4.2, 2.2 + Math.sin(t * 2) * 0.2, -1 + Math.sin(a) * 4.2);
      bot.rotation.y = -a;
    },
  });
  return room;
}

// ---------- Home ----------

function buildHomeInterior(origin) {
  const C = HOME.color;
  const planks = plankTexture();
  planks.repeat.set(4, 3);
  const room = makeRoom({
    id: 'home',
    origin,
    w: 24,
    d: 18,
    h: 6.5,
    floor: new THREE.MeshStandardMaterial({ map: planks, roughness: 0.6 }),
    wall: new THREE.MeshStandardMaterial({ color: '#f4e9db', roughness: 0.9 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#fbf7f1', roughness: 0.9 }),
    trim: solid('#e48b78'),
    doorColor: '#fff3cf',
  });
  const g = room.group;
  const r = rng(902);
  const PINK = solid('#e48b78');
  // pink dado and jharokha niches
  for (const [x, z, len, ry] of [[0, -8.97, 24, 0], [-11.97, 0, 18, Math.PI / 2], [11.97, 0, 18, -Math.PI / 2]]) {
    const dado = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.2), PINK);
    dado.position.set(x, 0.6, z);
    dado.rotation.y = ry;
    g.add(dado);
  }
  const arch = (x, z, ry) => {
    const s = new THREE.Shape();
    s.moveTo(-0.8, 0);
    s.lineTo(0.8, 0);
    s.lineTo(0.8, 1.6);
    s.absarc(0, 1.6, 0.8, 0, Math.PI, false);
    s.lineTo(-0.8, 0);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 16), glow('#ffe3b0', 1.1));
    m.position.set(x, 2.2, z);
    m.rotation.y = ry;
    g.add(m);
  };
  arch(-11.95, -5, Math.PI / 2);
  arch(-11.95, 5.5, Math.PI / 2);
  arch(11.95, 6, -Math.PI / 2);

  // Portrait and the path on the back wall
  const portrait = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), screenMat(OWNER.portrait, 1));
  portrait.position.set(0, 3.4, -8.94);
  portrait.userData.action = { kind: 'hire' };
  portrait.userData.dynamic = true;
  g.add(portrait, mesh(new THREE.BoxGeometry(2.9, 2.9, 0.08), WOOD, 0, 3.4, -8.98, false));
  room.clickables.push(portrait);
  const frames = [
    ['2010 – 14', 'GEC Bikaner', 'B.Tech, Computer Engineering. Self-taught designer on the side.'],
    ['2015 – 21', 'Grofers (Blinkit)', 'Associate Director, Marketing Design. Built the creative team.'],
    ['2021 – now', 'Razorpay', 'Communication Design Senior Manager across Payments, RazorpayX, POS.'],
    ['How I lead', 'Notes', 'Widen the toolkit. Measurable goals. Room to take risks. Design for the business.'],
  ];
  frames.forEach(([years, org, text], k) => {
    const x = [-8.2, -4.6, 4.6, 8.2][k];
    const f = plate(2.6, 2.0, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C;
      ctx.fillRect(0, 0, w, 10);
      ctx.fillStyle = C;
      ctx.font = `700 ${h * 0.09}px Inter, sans-serif`;
      ctx.fillText(years, 28, h * 0.2);
      ctx.fillStyle = '#0f172a';
      ctx.font = `800 ${h * 0.13}px "Bricolage Grotesque", Inter, sans-serif`;
      ctx.fillText(org, 28, h * 0.38, w - 56);
      ctx.fillStyle = '#475569';
      ctx.font = `500 ${h * 0.075}px Inter, sans-serif`;
      wrapText(ctx, text, 28, h * 0.55, w - 56, h * 0.1);
    });
    f.position.set(x, 3.3, -8.94);
    g.add(f, mesh(new THREE.BoxGeometry(2.8, 2.2, 0.06), WOOD, x, 3.3, -8.98, false));
  });
  addThing(room, 0, -6.8, { kind: 'hire', label: 'Vibhor’s story', verb: 'Read' });

  // Trophy cabinet on the right wall
  const cab = new THREE.Group();
  cab.position.set(11.2, 0, -3.5);
  cab.rotation.y = -Math.PI / 2;
  cab.add(mesh(new THREE.BoxGeometry(3.6, 0.9, 1), WHITE_METAL, 0, 0.45, 0));
  cab.add(mesh(new THREE.BoxGeometry(3.6, 1.8, 1), GLASS, 0, 1.8, 0, false));
  const cups = [];
  const plaque = plate(3.4, 0.5, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd84a';
    ctx.font = `700 ${h * 0.45}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RECOGNITION · find all four on the island', w / 2, h / 2 + 2, w - 30);
  });
  plaque.position.set(0, 3.0, 0.02);
  cab.add(plaque);
  for (let k = 0; k < AWARDS.length; k++) {
    const cup = new THREE.Group();
    const pts = [[0, 0], [0.2, 0], [0.07, 0.08], [0.06, 0.32], [0.22, 0.45], [0.25, 0.72], [0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
    cup.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 20), GOLD));
    cup.position.set(-1.25 + k * 0.83, 0.95, 0);
    cup.visible = false;
    cup.userData.dynamic = true;
    cab.add(cup);
    cups.push(cup);
  }
  g.add(cab);
  addCollider(room, 11.2, -3.5, 1.9);
  addThing(room, 9.6, -3.5, { kind: 'awards', label: 'Trophy cabinet', verb: 'See recognition' });

  // Living area: rug, sofa, coffee table, and a sleepy cat
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshStandardMaterial({
    map: canvasTexture(512, 512, (ctx, w) => {
      ctx.fillStyle = '#c0563f';
      ctx.fillRect(0, 0, w, w);
      ctx.strokeStyle = '#f2c94c';
      ctx.lineWidth = 10;
      for (let k = 1; k < 6; k++) {
        ctx.beginPath();
        ctx.arc(w / 2, w / 2, k * 42, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#2f6b3a';
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(w / 2 + Math.cos(a) * 200, w / 2 + Math.sin(a) * 200, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }),
    roughness: 1,
  }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-6, 0.02, 0.5);
  g.add(rug);
  const sofaMat = solid('#2f4f6b', { roughness: 0.95 });
  g.add(mesh(new THREE.BoxGeometry(4.2, 0.55, 1.4), sofaMat, -6, 0.42, -2.4));
  g.add(mesh(new THREE.BoxGeometry(4.2, 0.9, 0.35), sofaMat, -6, 0.95, -3.0));
  for (const x of [-8.05, -3.95]) g.add(mesh(new THREE.BoxGeometry(0.3, 0.75, 1.4), sofaMat, x, 0.6, -2.4));
  for (const x of [-7, -5]) g.add(mesh(new THREE.BoxGeometry(0.7, 0.5, 0.18), solid(x < -6 ? '#f2c94c' : '#e48b78'), x, 0.95, -2.75));
  addCollider(room, -6, -2.5, 2.1);
  g.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 32), WOOD, -6, 0.5, 0.6));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.46, 8), BRUSHED, -6, 0.23, 0.6));
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.14, 12), solid('#d9d4c7', { metalness: 0.7, roughness: 0.3 }), -5.8, 0.61, 0.5));
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 14), solid('#d9d4c7', { metalness: 0.7, roughness: 0.3 }), -5.8, 0.56, 0.5));
  addCollider(room, -6, 0.6, 0.9);
  addThing(room, -6, 1.8, { kind: 'toast', label: 'Bengaluru filter coffee', verb: 'Take a sip', text: '<b>☕ Filter coffee.</b> Most good ideas in this house start here.' });
  const cat = new THREE.Group();
  cat.position.set(-7.1, 0.72, -2.3);
  const fur = solid('#e8a35c', { roughness: 1 });
  const body = mesh(new THREE.CapsuleGeometry(0.2, 0.35, 4, 10), fur);
  body.rotation.z = Math.PI / 2;
  cat.add(body);
  cat.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), fur, 0.36, 0.05, 0.05));
  for (const z of [-0.05, 0.14]) cat.add(mesh(new THREE.ConeGeometry(0.05, 0.1, 6), fur, 0.42, 0.2, z));
  const tail = mesh(new THREE.CapsuleGeometry(0.04, 0.4, 4, 6), fur, -0.35, 0, 0.18);
  tail.rotation.set(Math.PI / 2, 0.4, 0);
  cat.add(tail);
  g.add(cat);
  room.updaters.push({ update: (t) => (body.scale.y = 1 + Math.sin(t * 1.6) * 0.06) });
  addThing(room, -6.8, -1.2, { kind: 'toast', label: 'The cat', verb: 'Pet', text: '<b>🐈 Purr.</b> The studio’s most senior creative director, asleep on the job.' });

  // Work desk with his screens
  const desk = makeDesk([new THREE.MeshBasicMaterial({ map: dashboardTexture('Studio this week', C, [['4', 'films in edit'], ['12', 'decks'], ['2', 'launches']], 3), toneMapped: false }), screenMat('work/btb-1.jpg', 0.92 / 0.52)], C);
  desk.position.set(6.5, 0, 2.5);
  desk.rotation.y = Math.PI / 2;
  g.add(desk);
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), solid('#1f2937'), 5.6, 0.45, 2.5));
  addCollider(room, 6.5, 2.5, 1.3);
  addThing(room, 5.2, 2.5, { kind: 'project', slug: 'btb', label: 'On the screen: Break To Build', verb: 'Open' });

  // Bookshelf on the left wall
  const shelf = new THREE.Group();
  shelf.position.set(-11.4, 0, -4.8);
  shelf.rotation.y = Math.PI / 2;
  shelf.add(mesh(new THREE.BoxGeometry(3.4, 3.6, 0.7), WOOD, 0, 1.8, -0.1));
  const bookCols = ['#e48b78', '#2f6bff', '#f2c94c', '#00a79d', '#7b5cff', '#1f2937', '#ffffff'];
  for (let row = 0; row < 4; row++) {
    let x = -1.5;
    while (x < 1.4) {
      const bw = 0.12 + r() * 0.12;
      const bh = 0.5 + r() * 0.25;
      shelf.add(mesh(new THREE.BoxGeometry(bw, bh, 0.5), solid(bookCols[Math.floor(r() * bookCols.length)]), x + bw / 2, 0.35 + row * 0.85 + bh / 2, 0.15, false));
      x += bw + 0.02;
    }
  }
  g.add(shelf);
  addCollider(room, -11.4, -4.8, 1.7);
  addThing(room, -9.8, -4.8, { kind: 'leadership', label: 'Leadership notes', verb: 'Read' });

  // Mentoring corner
  for (const [x, ry] of [[-8, Math.PI / 2 + 0.5], [-5.6, -Math.PI / 2 - 0.5]]) {
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), solid('#f2c94c', { roughness: 0.95 }), x, 0.4, 6.2));
    const back = mesh(new THREE.BoxGeometry(0.9, 0.8, 0.2), solid('#f2c94c', { roughness: 0.95 }), x + (x < -7 ? -0.38 : 0.38), 0.9, 6.2);
    back.rotation.y = Math.PI / 2;
    g.add(back);
  }
  const mentee = makePerson({ seed: r(), style: 'hoodie', accent: '#7b5cff' });
  addNpc(room, mentee, -5.6, 6.2, -Math.PI / 2, 'sit', 'home', { lines: ['Thank you for the session! Could you also look at my case study?', 'Your workshop is why I started using AI in my work.'], name: 'Mentee' });
  const adp = plate(2.2, 1.2, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd84a';
    ctx.font = `800 ${h * 0.26}px "Bricolage Grotesque", Inter, sans-serif`;
    ctx.fillText('33 sessions', 24, h * 0.42);
    ctx.fillStyle = '#ffffff';
    ctx.font = `500 ${h * 0.13}px Inter, sans-serif`;
    ctx.fillText('One-to-one mentoring on ADPList', 24, h * 0.68);
  });
  adp.position.set(-11.94, 2.8, 8);
  adp.rotation.y = Math.PI / 2;
  g.add(adp);
  addCollider(room, -6.8, 6.2, 1.8);
  addThing(room, -6.8, 4.6, { kind: 'project', slug: 'mentor', label: 'Mentoring corner', verb: 'Open' });

  // Writing desk with a typewriter: the contact form
  const wd = new THREE.Group();
  wd.position.set(8, 0, 6.6);
  wd.add(mesh(new THREE.BoxGeometry(2, 0.08, 1), WOOD, 0, 0.9, 0));
  for (const [x, z] of [[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]]) wd.add(mesh(new THREE.BoxGeometry(0.07, 0.9, 0.07), DARK, x, 0.45, z));
  wd.add(mesh(new THREE.BoxGeometry(0.8, 0.22, 0.6), solid('#d64545', { roughness: 0.4, metalness: 0.3 }), 0, 1.05, 0));
  wd.add(mesh(new THREE.BoxGeometry(0.5, 0.4, 0.02), solid('#fffaf0'), 0, 1.33, -0.18));
  const note = plate(1.6, 0.5, (ctx, w, h) => {
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.font = `700 ${h * 0.38}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✉️  Write to Vibhor', w / 2, h / 2 + 2);
  });
  note.position.set(0, 1.85, -0.45);
  wd.add(note);
  g.add(wd);
  addCollider(room, 8, 6.6, 1.1);
  addThing(room, 8, 5.2, { kind: 'contact', label: 'Write to Vibhor', verb: 'Use the typewriter' });

  // Photo wall: on set and on stage
  OWNER.gallery.slice(0, 3).forEach((gph, k) => {
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), screenMat(gph.image, 1.5));
    ph.position.set(11.94, 3.4, 2 + k * 2.6 - 2.6);
    ph.rotation.y = -Math.PI / 2;
    ph.userData.dynamic = true;
    g.add(ph);
  });
  addThing(room, 10.4, 2, { kind: 'hire', label: 'Photos: on set and on stage', verb: 'More about Vibhor' });

  // Plants
  for (const [x, z] of [[-11, -8], [11, -8], [-11, 8.2], [10.8, 3]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 16), solid('#f6e6d2'), x, 0.3, z));
    for (let k = 0; k < 5; k++) g.add(mesh(new THREE.IcosahedronGeometry(0.35, 1), solid('#4f9a33', { flatShading: true }), x + (r() - 0.5) * 0.5, 0.9 + r() * 0.8, z + (r() - 0.5) * 0.5));
    addCollider(room, x, z, 0.5);
  }
  room.cups = cups;
  return room;
}

// ---------- Playhouse ----------

function buildPlayhouseInterior(origin) {
  const C = FUN.color;
  const carpet = gridTexture('#2a1830', 'rgba(255,159,28,0.12)', 12);
  carpet.repeat.set(6, 5);
  const room = makeRoom({
    id: 'fun',
    origin,
    w: 30,
    d: 24,
    h: 9,
    floor: new THREE.MeshStandardMaterial({ map: carpet, roughness: 1 }),
    wall: new THREE.MeshStandardMaterial({ color: '#2b1d3a', roughness: 0.9 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#160e22', roughness: 1 }),
    trim: glow('#ff4f8b', 1.6),
    doorColor: C,
  });
  const g = room.group;
  const r = rng(903);
  // neon strips and ceiling stars
  for (const [y, col] of [[7.6, '#ff4f8b'], [7.9, C]]) {
    for (const [x, z, len, ry] of [[0, -11.95, 30, 0], [-14.95, 0, 24, Math.PI / 2], [14.95, 0, 24, Math.PI / 2]]) {
      const n = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), glow(col, 2.5));
      n.position.set(x, y, z);
      n.rotation.y = ry;
      g.add(n);
    }
  }
  for (let k = 0; k < 60; k++) g.add(mesh(new THREE.SphereGeometry(0.05, 6, 4), glow('#fff4c2', 3), (r() - 0.5) * 28, 8.9, (r() - 0.5) * 22, false));

  // The big screen
  const films = ['trial', 'ring', 'btb', 'ace', 't20', 'magic-checkout'];
  const mats = films.map((s) => screenMat(PROJECTS[s].images[0], 16 / 9));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), mats[0]);
  screen.position.set(0, 4.6, -11.9);
  screen.userData.action = { kind: 'project', slug: films[0] };
  screen.userData.dynamic = true;
  g.add(screen, mesh(new THREE.BoxGeometry(16.6, 9.6, 0.1), DARK, 0, 4.6, -11.97, false));
  room.clickables.push(screen);
  room.updaters.push({
    update: (t) => {
      const k = Math.floor(t / 7) % mats.length;
      if (screen.material !== mats[k]) {
        screen.material = mats[k];
        screen.userData.action = { kind: 'project', slug: films[k] };
      }
    },
  });
  addThing(room, 0, -6, { kind: 'screen', label: 'Now showing: the studio’s films', verb: 'Watch', screen });

  // Seats on stepped risers
  const seat = solid('#b3263c', { roughness: 0.9 });
  for (let row = 0; row < 3; row++) {
    const z = -3 + row * 2.6;
    const y = row * 0.35;
    if (row) g.add(mesh(new THREE.BoxGeometry(14, y, 2.6), solid('#3a2650'), 0, y / 2, z));
    for (let k = 0; k < 6; k++) {
      const x = -5.5 + k * 2.2;
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.45, 0.85), seat, x, y + 0.42, z));
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.9, 0.18), seat, x, y + 0.9, z + 0.42));
      if ((k + row) % 3 === 0) {
        const p = makePerson({ seed: r(), accent: C });
        if (k % 2) giveProp(p, 'cup', '#ffd84a');
        addNpc(room, p, x, z - 0.05, Math.PI, 'sit', 'fun', { y: y + 0.12 });
      }
    }
    room.colliders.push({ ...local(room, 0, z), r: 0, box: { minX: origin.x - 7, maxX: origin.x + 7, minZ: origin.z + z - 0.6, maxZ: origin.z + z + 0.6 } });
  }

  // Popcorn counter
  const pc = new THREE.Group();
  pc.position.set(11.5, 0, 8.5);
  pc.rotation.y = -Math.PI / 2;
  pc.add(mesh(new THREE.BoxGeometry(4, 1.1, 1.2), solid('#d64545'), 0, 0.55, 0));
  pc.add(mesh(new THREE.BoxGeometry(4.1, 0.08, 1.3), WHITE_METAL, 0, 1.13, 0));
  pc.add(mesh(new THREE.BoxGeometry(1.2, 1.3, 0.9), GLASS, -1, 1.85, -0.1, false));
  for (let k = 0; k < 24; k++) pc.add(mesh(new THREE.IcosahedronGeometry(0.08, 0), solid('#fff4c2'), -1 + (r() - 0.5) * 1, 1.4 + r() * 0.9, -0.1 + (r() - 0.5) * 0.7, false));
  for (let k = 0; k < 4; k++) pc.add(mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.35, 10), solid(k % 2 ? '#ffffff' : '#d64545'), 0.6 + k * 0.32, 1.35, 0.2));
  g.add(pc);
  addCollider(room, 11.5, 8.5, 1.5);
  addCollider(room, 11.5, 6.8, 0.8);
  addCollider(room, 11.5, 10.2, 0.8);
  addNpc(room, makePerson({ seed: r(), top: '#d64545', accent: C }), 13.2, 8.5, -Math.PI / 2, 'talk', 'fun', { lines: FUN.quotes, name: 'Playhouse host' });
  addThing(room, 9.7, 8.5, { kind: 'toast', label: 'Popcorn', verb: 'Grab some', text: '<b>🍿 Popcorn!</b> Best enjoyed with the studio’s films on the big screen.' });

  // Arcade corner: Back in the Ring, the game
  for (let k = 0; k < 3; k++) {
    const cab = new THREE.Group();
    const z = 5.5 + k * 1.6;
    cab.position.set(-13.8, 0, z);
    cab.rotation.y = Math.PI / 2;
    cab.add(mesh(new THREE.BoxGeometry(1.2, 2.2, 0.9), solid(['#1d2b4f', '#3a1d4f', '#1d4f3a'][k]), 0, 1.1, 0));
    cab.add(mesh(new THREE.BoxGeometry(1.25, 0.12, 0.6), solid(C), 0, 1.2, 0.5));
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.75), screenMat(k === 1 ? 'work/ring-cover.jpg' : k ? 'work/magic-cover.jpg' : 'work/trial-1.jpg', 0.95 / 0.75));
    sc.position.set(0, 1.7, 0.455);
    sc.userData.action = { kind: 'project', slug: ['trial', 'ring', 'magic-checkout'][k] };
    sc.userData.dynamic = true;
    cab.add(sc);
    room.clickables.push(sc);
    g.add(cab);
    addCollider(room, -13.8, z, 0.8);
  }
  addNpc(room, makePerson({ seed: r(), style: 'streetwear', accent: C }), -12.6, 7.1, -Math.PI / 2, 'type', 'fun');
  addThing(room, -12, 5.5, { kind: 'project', slug: 'ring', label: 'Arcade: Back in the Ring', verb: 'Play' });

  // Stop-motion studio
  const sm = new THREE.Group();
  sm.position.set(-11, 0, -7);
  sm.add(mesh(new THREE.BoxGeometry(3, 0.08, 1.8), WOOD, 0, 0.95, 0));
  for (const [x, z] of [[-1.4, -0.8], [1.4, -0.8], [-1.4, 0.8], [1.4, 0.8]]) sm.add(mesh(new THREE.BoxGeometry(0.07, 0.95, 0.07), DARK, x, 0.47, z));
  sm.add(mesh(new THREE.BoxGeometry(2.9, 1.3, 0.05), solid('#bfe3ff'), 0, 1.65, -0.85));
  const clay = ['#ff8fb1', '#ffd84a', '#7b5cff', '#00a79d'];
  const puppets = [];
  for (let k = 0; k < 4; k++) {
    const pu = new THREE.Group();
    pu.position.set(-0.9 + k * 0.6, 1.0, -0.1);
    pu.add(mesh(new THREE.CapsuleGeometry(0.08, 0.14, 4, 8), solid(clay[k], { roughness: 1 }), 0, 0.12, 0));
    pu.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), solid(clay[k], { roughness: 1 }), 0, 0.3, 0));
    sm.add(pu);
    puppets.push(pu);
  }
  sm.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.35), DARK, 0, 2.3, 0.9));
  sm.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), DARK, 0, 1.6, 1.05));
  const soft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), glow('#ffffff', 2));
  soft.position.set(1.3, 2.4, 0.6);
  soft.rotation.x = -0.6;
  sm.add(soft);
  g.add(sm);
  addCollider(room, -11, -7, 1.9);
  // the puppets move one frame at a time
  room.updaters.push({
    update: (t) => {
      const frame = Math.floor(t * 4);
      puppets.forEach((pu, k) => {
        pu.position.x = -0.9 + k * 0.6 + Math.sin(frame * 0.4 + k) * 0.08;
        pu.rotation.y = Math.sin(frame * 0.3 + k) * 0.5;
      });
    },
  });
  addNpc(room, makePerson({ seed: r(), style: 'kurta', accent: C }), -9.2, -6.2, -Math.PI / 2 - 0.4, 'think', 'fun');
  addThing(room, -9.4, -5.4, { kind: 'project', slug: 'modern-junkyard', label: 'Modern Junkyard: the stop-motion studio', verb: 'Open' });

  // Found-object gallery
  const objects = [
    () => [mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.35, 16), solid('#ffffff'), 0, 0.2, 0), mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16, Math.PI), solid('#ffffff'), 0.3, 0.22, 0)],
    () => [mesh(new THREE.TorusKnotGeometry(0.3, 0.06, 64, 8), CHROME, 0, 0.45, 0)],
    () => [mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), solid('#ff9f1c'), 0, 0.1, 0), mesh(new THREE.ConeGeometry(0.14, 0.45, 8), solid('#2f6bff'), 0.1, 0.4, 0), mesh(new THREE.SphereGeometry(0.12, 12, 8), solid('#e5484d'), -0.15, 0.3, 0)],
  ];
  objects.forEach((make, k) => {
    const z = -8 + k * 4;
    const ped = new THREE.Group();
    ped.position.set(13, 0, z);
    ped.add(mesh(new THREE.BoxGeometry(1, 1.2, 1), WHITE_METAL, 0, 0.6, 0));
    const art = new THREE.Group();
    art.position.y = 1.2;
    for (const m of make()) art.add(m);
    ped.add(art);
    const spot = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.5, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fff4c2', transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }));
    spot.position.y = 3.2;
    ped.add(spot);
    g.add(ped);
    addCollider(room, 13, z, 0.8);
    room.updaters.push({ update: (t) => (art.rotation.y = t * 0.4 + k) });
  });
  addThing(room, 11.3, -4, { kind: 'project', slug: 'power', label: 'Power: found-object art', verb: 'Open' });

  // Poster wall of films and references
  const items = [
    ...FAVOURITES.influences.map((i) => ({ ...i, kind: 'Inspired the work' })),
    ...FAVOURITES.films.map((i) => ({ ...i, kind: 'Favourite film' })),
    ...FAVOURITES.shows.map((i) => ({ ...i, kind: 'Favourite show' })),
  ];
  items.forEach((item, k) => {
    const poster = plate(1.5, 2.25, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, ['#ff9f1c', '#ff4f8b', '#7b5cff', '#00a79d'][k % 4]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, w - 32, h - 32);
      ctx.fillStyle = '#ffd84a';
      ctx.font = `600 ${w * 0.055}px Inter, sans-serif`;
      ctx.fillText(item.kind.toUpperCase(), 36, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${w * 0.13}px "Bricolage Grotesque", Inter, sans-serif`;
      const y = wrapText(ctx, item.title, 36, h * 0.5, w - 72, w * 0.15);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `500 ${w * 0.06}px Inter, sans-serif`;
      ctx.fillText(item.year || '', 36, y + 10);
    });
    poster.position.set(-14.94, 3, -2 + k * 1.9);
    poster.rotation.y = Math.PI / 2;
    poster.userData.action = { kind: 'poster', item };
    g.add(poster);
    room.clickables.push(poster);
  });
  addThing(room, -13.3, -0.2, { kind: 'place', id: 'fun', label: 'Films & references', verb: 'See all' });

  // Neon sign above the door, inside
  const neon = plate(6, 1.2, (ctx, w, h) => {
    ctx.fillStyle = '#160e22';
    ctx.fillRect(0, 0, w, h);
    ctx.shadowColor = C;
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffd08a';
    ctx.font = `800 ${h * 0.62}px "Bricolage Grotesque", Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLAYHOUSE', w / 2, h / 2 + 4);
  });
  neon.position.set(0, 6.4, 11.94);
  neon.rotation.y = Math.PI;
  g.add(neon);
  return room;
}


// ---------- Hall of Fame ----------

function trophyMesh(tier) {
  const mat = tier === 'gold' ? GOLD : new THREE.MeshPhysicalMaterial({ color: '#e6ebf2', metalness: 1, roughness: 0.15 });
  const g = new THREE.Group();
  const pts = [[0, 0], [0.32, 0], [0.32, 0.12], [0.1, 0.18], [0.07, 0.6], [0.14, 0.72], [0.36, 0.95], [0.4, 1.4], [0.34, 1.42], [0.18, 1.05], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 28), mat));
  for (const sx of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), mat);
    h.position.set(sx * 0.42, 1.15, 0);
    h.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(h);
  }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), mat);
  star.position.y = 1.62;
  g.add(star);
  g.traverse((o) => (o.castShadow = true));
  return g;
}

function buildHallInterior(origin) {
  const C = HALL.color;
  const marble = canvasTexture(512, 512, (ctx, w) => {
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = 'rgba(160,150,130,0.25)';
    for (let k = 0; k < 18; k++) {
      ctx.lineWidth = 1 + (k % 3);
      ctx.beginPath();
      let x = (k * 97) % w;
      ctx.moveTo(x, 0);
      for (let y = 0; y < w; y += 32) ctx.lineTo((x += Math.sin(y * 0.05 + k) * 14), y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, w);
  });
  marble.wrapS = marble.wrapT = THREE.RepeatWrapping;
  marble.repeat.set(6, 5);
  const room = makeRoom({
    id: 'awards',
    origin,
    w: 28,
    d: 26,
    h: 10,
    floor: new THREE.MeshPhysicalMaterial({ map: marble, roughness: 0.15, clearcoat: 1 }),
    wall: new THREE.MeshStandardMaterial({ color: '#1b1a24', roughness: 0.7 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#121119', roughness: 1 }),
    trim: GOLD,
    doorColor: C,
  });
  const g = room.group;
  const r = rng(904);
  // red carpet from the door to the stage
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3, 20), solid('#a3182f', { roughness: 1 }));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.02, 2);
  g.add(carpet);
  for (const x of [-1.6, 1.6]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 20), GOLD);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, 0.025, 2);
    g.add(edge);
  }
  // gold wall bands
  for (const y of [1.2, 8.6]) {
    for (const [x, z, len, ry] of [[0, -12.95, 28, 0], [-13.95, 0, 26, Math.PI / 2], [13.95, 0, 26, Math.PI / 2]]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.05), GOLD);
      band.position.set(x, y, z);
      band.rotation.y = ry;
      g.add(band);
    }
  }
  // Title
  const title = plate(12, 1.8, (ctx, w, h) => {
    ctx.fillStyle = '#1b1a24';
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#f7d774');
    grad.addColorStop(0.5, '#fff3c4');
    grad.addColorStop(1, '#d9a441');
    ctx.fillStyle = grad;
    ctx.font = `800 ${h * 0.5}px "Bricolage Grotesque", Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HALL OF FAME', w / 2, h * 0.42);
    ctx.fillStyle = '#c9c3b3';
    ctx.font = `500 ${h * 0.16}px Inter, sans-serif`;
    ctx.fillText('Awards & recognition for the work and the team', w / 2, h * 0.82);
  });
  title.position.set(0, 7.6, -12.93);
  g.add(title);
  // Stage with the award-winning film
  g.add(mesh(new THREE.BoxGeometry(12, 0.5, 4), solid('#26242f'), 0, 0.25, -10.5));
  const film = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 5.4), screenMat(PROJECTS.trial.images[0], 9.6 / 5.4));
  film.position.set(0, 3.9, -12.9);
  film.userData.action = { kind: 'project', slug: 'trial' };
  film.userData.dynamic = true;
  g.add(film, mesh(new THREE.BoxGeometry(10, 5.8, 0.06), GOLD, 0, 3.9, -12.96, false));
  room.clickables.push(film);
  room.colliders.push({ x: 0, z: 0, r: 0, box: { minX: origin.x - 6, maxX: origin.x + 6, minZ: origin.z - 12.5, maxZ: origin.z - 8.5 } });
  addThing(room, 0, -7.6, { kind: 'project', slug: 'trial', label: 'Trial of the Century: the award winner', verb: 'Open case study' });
  // Hero trophy on the stage
  const hero = trophyMesh('gold');
  hero.scale.setScalar(1.8);
  hero.position.set(4.6, 0.5, -10);
  g.add(hero);
  // Award pedestals along both walls
  AWARD_LIST.forEach((a, k) => {
    const side = k % 2 ? 1 : -1;
    const z = -6 + Math.floor(k / 2) * 4.6;
    const x = side * 10.5;
    const ped = new THREE.Group();
    ped.position.set(x, 0, z);
    ped.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    ped.add(mesh(new THREE.BoxGeometry(1.4, 1.3, 1.4), solid('#26242f'), 0, 0.65, 0));
    ped.add(mesh(new THREE.BoxGeometry(1.5, 0.06, 1.5), GOLD, 0, 1.32, 0));
    const tr = trophyMesh(a.tier);
    tr.position.y = 1.35;
    tr.userData.dynamic = true;
    ped.add(tr);
    const glass = mesh(new THREE.BoxGeometry(1.3, 2.1, 1.3), GLASS, 0, 2.4, 0, false);
    ped.add(glass);
    const card = plate(2.6, 1.5, (ctx, w, h) => {
      ctx.fillStyle = '#1b1a24';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = a.tier === 'gold' ? '#f7d774' : '#dfe5ec';
      ctx.fillRect(0, 0, w, 10);
      ctx.font = `600 ${h * 0.09}px Inter, sans-serif`;
      ctx.fillText(`${a.show.toUpperCase()} · ${a.year}`, 28, h * 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${h * 0.2}px "Bricolage Grotesque", Inter, sans-serif`;
      ctx.fillText(a.title, 28, h * 0.43);
      ctx.fillStyle = '#c9c3b3';
      ctx.font = `500 ${h * 0.1}px Inter, sans-serif`;
      const y = wrapText(ctx, a.category, 28, h * 0.62, w - 56, h * 0.12);
      ctx.fillStyle = a.tier === 'gold' ? '#f7d774' : '#dfe5ec';
      ctx.font = `600 ${h * 0.085}px Inter, sans-serif`;
      ctx.fillText(a.project ? `for ${PROJECTS[a.project].title}` : 'for the Razorpay Creative & Design Team', 28, Math.min(y + 4, h * 0.92), w - 56);
    });
    card.position.set(0, 2.1, 1.4);
    card.userData.action = a.project ? { kind: 'project', slug: a.project } : { kind: 'toast', text: `<b>🏆 ${a.show} ${a.year}</b><br>${a.title}: ${a.category}` };
    ped.add(card);
    room.clickables.push(card);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1, 6, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 6.5;
    ped.add(beam);
    g.add(ped);
    addCollider(room, x, z, 1.1);
    addThing(room, x - side * 2.2, z, {
      kind: a.project ? 'project' : 'toast',
      slug: a.project,
      text: `<b>🏆 ${a.show} ${a.year}</b><br>${a.title}: ${a.category}`,
      label: `${a.show}: ${a.title}`,
      verb: a.project ? 'See the winning work' : 'Read',
    });
    room.updaters.push({ update: (t) => (tr.rotation.y = t * 0.5 + k) });
  });
  // Photos from the award nights
  [['assets/img/about/brand-disruption-awards-2026.jpg', -9.5], ['assets/img/about/reimagine-awards-stage.jpg', 9.5]].forEach(([src, x]) => {
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.8), screenMat(src, 4.2 / 2.8));
    ph.position.set(x, 4.6, -12.93);
    ph.userData.dynamic = true;
    g.add(ph, mesh(new THREE.BoxGeometry(4.5, 3.1, 0.05), GOLD, x, 4.6, -12.97, false));
  });

  // Curator and a visiting juror
  addNpc(room, makePerson({ seed: r(), style: 'blazer', accent: C, top: '#1f2937' }), -2.6, -7.2, 0.3, 'present', 'awards', { lines: HALL.quotes, name: 'Awards curator' });
  addNpc(room, makePerson({ seed: r(), style: 'dress', accent: C }), 6.5, 3, -Math.PI / 2, 'think', 'awards');
  addNpc(room, makePerson({ seed: r(), style: 'kurta', accent: C }), -6.5, 6, Math.PI / 2, 'coffee', 'awards');
  room.updaters.push({ update: (t) => (hero.rotation.y = t * 0.3) });
  return room;
}

export function buildInteriors(root) {
  const rooms = {
    ai: buildAIHub(new THREE.Vector3(3000, 0, 0)),
    home: buildHomeInterior(new THREE.Vector3(3000, 0, 400)),
    fun: buildPlayhouseInterior(new THREE.Vector3(3000, 0, 800)),
    awards: buildHallInterior(new THREE.Vector3(3000, 0, 1200)),
  };
  for (const room of Object.values(rooms)) {
    room.group.visible = false;
    root.add(room.group);
    deepMerge(room.group);
  }
  return rooms;
}
