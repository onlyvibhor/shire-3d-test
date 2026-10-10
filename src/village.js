import * as THREE from 'three';
import { HAMLETS, PILLARS, CENTER } from './data.js';
import { heightAt, rng } from './world.js';
import { makeFolk, animate } from './characters.js';

const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const STONE = M('#9a978c', { flatShading: true });
const WOOD = M('#7a5333');
const DARK_WOOD = M('#553620');
const MOUND = M('#6c9c3f');
const WINDOW_GLOW = M('#ffd98a', { emissive: '#ffb444', emissiveIntensity: 0.8 });
const BRASS = M('#d7b04a', { metalness: 0.7, roughness: 0.35 });

function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function collider(parent, r, x = 0, z = 0) {
  const o = new THREE.Object3D();
  o.position.set(x, 0, z);
  o.userData.collider = r;
  parent.add(o);
}

function textTexture(text, { w = 512, h = 160, bg = '#6b4a2f', fg = '#f6e7c1', font = '600 64px Cinzel, Georgia, serif' } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = fg;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 4, w - 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---------- Hobbit hole ----------

const A = 4.8, B = 3.1, C = 4.2; // mound ellipsoid radii
const onMound = (x, y) => C * Math.sqrt(Math.max(0, 1 - (x / A) ** 2 - (y / B) ** 2));

export function makeHobbitHole(doorColor, scale = 1, r = Math.random) {
  const g = new THREE.Group();
  const mound = mesh(new THREE.SphereGeometry(1, 28, 18), MOUND);
  mound.scale.set(A, B, C);
  g.add(mound);

  // Stone surround and round door
  const surround = mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.7, 22), STONE);
  surround.rotation.x = Math.PI / 2;
  surround.position.set(0, 1.15, 3.6);
  const lip = mesh(new THREE.SphereGeometry(1.7, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), MOUND);
  lip.scale.set(1.15, 0.5, 0.75);
  lip.position.set(0, 2.45, 3.55);
  const door = mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.14, 26), M(doorColor));
  door.rotation.x = Math.PI / 2;
  door.position.set(0, 1.15, 4.47);
  const ring = mesh(new THREE.TorusGeometry(1.16, 0.12, 8, 26), DARK_WOOD);
  ring.position.set(0, 1.15, 4.5);
  const knob = mesh(new THREE.SphereGeometry(0.12, 10, 8), BRASS, 0, 1.15, 4.6);
  const step = mesh(new THREE.BoxGeometry(2.2, 0.2, 0.9), STONE, 0, 0.1, 4.9);
  g.add(surround, lip, door, ring, knob, step);
  for (let i = 0; i < 6; i++) {
    const plank = mesh(new THREE.BoxGeometry(0.04, 1.9, 0.05), DARK_WOOD, -0.75 + i * 0.3, 1.15, 4.55);
    plank.scale.y = Math.sqrt(Math.max(0.05, 1 - ((-0.75 + i * 0.3) / 1.08) ** 2));
    g.add(plank);
  }

  // Round windows that glow warmly
  for (const sx of [-1, 1]) {
    const x = sx * 2.7;
    const y = 1.2;
    const z = onMound(x, y);
    const n = new THREE.Vector3(x / (A * A), y / (B * B), z / (C * C)).normalize();
    const win = new THREE.Group();
    win.position.set(x, y, z).addScaledVector(n, 0.05);
    win.lookAt(win.position.clone().add(n));
    const frame = mesh(new THREE.TorusGeometry(0.5, 0.09, 8, 20), DARK_WOOD);
    const glass = mesh(new THREE.CircleGeometry(0.46, 20), WINDOW_GLOW);
    const bar = mesh(new THREE.BoxGeometry(0.06, 0.9, 0.04), DARK_WOOD);
    const bar2 = bar.clone();
    bar2.rotation.z = Math.PI / 2;
    win.add(frame, glass, bar, bar2);
    g.add(win);
  }

  // Chimney + smoke marker
  const cy = B * Math.sqrt(1 - (1.6 / A) ** 2 - (1.2 / C) ** 2);
  const chimney = mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.4, 8), STONE, 1.6, cy + 0.4, -1.2);
  g.add(chimney);
  const smoke = new THREE.Object3D();
  smoke.position.set(1.6, cy + 1.2, -1.2);
  smoke.name = 'chimneyTop';
  g.add(smoke);

  // Shrubs and flowers on the roof
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2;
    const x = Math.cos(a) * 2.6;
    const z = Math.sin(a) * 2.2 - 0.6;
    const y = B * Math.sqrt(Math.max(0, 1 - (x / A) ** 2 - (z / C) ** 2));
    const bush = mesh(new THREE.IcosahedronGeometry(0.5 + r() * 0.4, 0), M(r() < 0.5 ? '#4e8a32' : '#5f9b38', { flatShading: true }), x, y, z);
    g.add(bush);
  }
  // Little picket fence arc in front
  for (let i = -4; i <= 4; i++) {
    if (Math.abs(i) < 2) continue;
    const a = i * 0.16;
    const post = mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), M('#efe6cf'), Math.sin(a) * 6.2, 0.35, Math.cos(a) * 6.2 - 0.6);
    g.add(post);
  }

  g.scale.setScalar(scale);
  collider(g, 4.3);
  return g;
}

// ---------- Walkers (villagers with routes) ----------

class Walker {
  constructor(parent, folk, points, opts = {}) {
    this.folk = folk;
    this.points = points;
    this.speed = opts.speed ?? 1.4;
    this.pause = opts.pause ?? 2;
    this.loop = opts.loop ?? false;
    this.action = opts.action ?? 'walk';
    this.idle = opts.idle ?? 'talk';
    this.heightFn = opts.heightFn ?? null;
    this.idx = 1;
    this.dir = 1;
    this.wait = (opts.offset ?? 0) * this.pause;
    const [x, z] = points[0];
    folk.root.position.set(x, this.heightFn ? this.heightFn(x, z) : 0, z);
    parent.add(folk.root);
  }
  update(t, dt) {
    const root = this.folk.root;
    if (this.wait > 0) {
      this.wait -= dt;
      animate(this.folk, this.idle, t);
      return;
    }
    const [tx, tz] = this.points[this.idx];
    const dx = tx - root.position.x;
    const dz = tz - root.position.z;
    const d = Math.hypot(dx, dz);
    const step = this.speed * dt;
    if (d <= step) {
      root.position.x = tx;
      root.position.z = tz;
      this.wait = this.pause;
      if (this.loop) this.idx = (this.idx + 1) % this.points.length;
      else {
        if (this.idx + this.dir >= this.points.length || this.idx + this.dir < 0) this.dir *= -1;
        this.idx += this.dir;
      }
    } else {
      root.position.x += (dx / d) * step;
      root.position.z += (dz / d) * step;
      const target = Math.atan2(dx, dz);
      let diff = target - root.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      root.rotation.y += diff * Math.min(1, dt * 8);
    }
    if (this.heightFn) root.position.y = this.heightFn(root.position.x, root.position.z);
    animate(this.folk, this.action, t, this.speed);
  }
}

function staticFolk(parent, list, opts, x, z, rotY, action) {
  const f = makeFolk(opts);
  f.root.position.set(x, 0, z);
  f.root.rotation.y = rotY;
  parent.add(f.root);
  list.push({ update: (t) => animate(f, action, t) });
  return f;
}

function parcel(folk, color) {
  const box = mesh(new THREE.BoxGeometry(0.45, 0.35, 0.35), M(color), 0, 0.72, 0.45);
  folk.parts.body.add(box);
}

// ---------- Activity props ----------

function addStall(g, x, z, color, r) {
  const s = new THREE.Group();
  s.position.set(x, 0, z);
  s.rotation.y = Math.atan2(-x, -z);
  s.add(mesh(new THREE.BoxGeometry(3, 0.15, 1.4), WOOD, 0, 0.95, 0));
  s.add(mesh(new THREE.BoxGeometry(2.8, 0.85, 1.2), DARK_WOOD, 0, 0.45, 0));
  for (const px of [-1.4, 1.4]) for (const pz of [-0.6, 0.6]) s.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), WOOD, px, 1.3, pz));
  for (let i = 0; i < 6; i++) {
    const stripe = mesh(new THREE.BoxGeometry(0.52, 0.06, 1.9), M(i % 2 ? '#f4ecd8' : color), -1.3 + i * 0.52, 2.6, 0.15);
    stripe.rotation.x = -0.25;
    s.add(stripe);
  }
  const goods = ['#e05a3a', '#f2c94c', '#7cb342', '#c47a3b'];
  for (let i = 0; i < 7; i++) s.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), M(goods[Math.floor(r() * 4)]), -1.1 + r() * 2.2, 1.15, 0.1 + r() * 0.35));
  g.add(s);
  collider(g, 1.6, x, z);
}

function addDesk(g, x, z) {
  const d = new THREE.Group();
  d.position.set(x, 0, z);
  d.add(mesh(new THREE.BoxGeometry(1.4, 0.1, 0.8), WOOD, 0, 0.8, 0));
  for (const px of [-0.6, 0.6]) for (const pz of [-0.3, 0.3]) d.add(mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), DARK_WOOD, px, 0.4, pz));
  for (let i = 0; i < 3; i++) d.add(mesh(new THREE.BoxGeometry(0.42, 0.03, 0.55), M('#f6f0dc'), -0.35 + i * 0.05, 0.87 + i * 0.03, 0));
  d.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 8), M('#1f1f2b'), 0.45, 0.92, 0.15));
  const quill = mesh(new THREE.ConeGeometry(0.06, 0.6, 5), M('#ffffff'), 0.45, 1.2, 0.15);
  quill.rotation.z = -0.4;
  d.add(quill);
  g.add(d);
  collider(g, 0.9, x, z);
}

function addEasel(g, x, z, rotY) {
  const e = new THREE.Group();
  e.position.set(x, 0, z);
  e.rotation.y = rotY;
  for (const [lx, lz, rx, rz] of [[-0.45, 0.15, 0, 0.15], [0.45, 0.15, 0, -0.15], [0, -0.45, -0.3, 0]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 5), WOOD, lx, 1.0, lz);
    leg.rotation.set(rx, 0, rz);
    e.add(leg);
  }
  const canvasMat = M('#ffffff');
  e.add(mesh(new THREE.BoxGeometry(1.4, 1.05, 0.05), M('#f7f1e1'), 0, 1.45, 0.25));
  const paint = mesh(new THREE.PlaneGeometry(1.1, 0.8), canvasMat, 0, 1.45, 0.28);
  e.add(paint);
  g.add(e);
  collider(g, 0.7, x, z);
  return canvasMat;
}

function addColorWheel(g, x, z) {
  const w = new THREE.Group();
  w.position.set(x, 3.2, z);
  const disc = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const seg = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 4, (i / 12) * Math.PI * 2, (Math.PI * 2) / 12),
      M(new THREE.Color().setHSL(i / 12, 0.7, 0.55).getStyle(), { side: THREE.DoubleSide })
    );
    disc.add(seg);
  }
  disc.add(mesh(new THREE.CircleGeometry(0.4, 16), M('#ffffff'), 0, 0, 0.01));
  w.add(disc);
  g.add(w);
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 6), DARK_WOOD, x, 1.6, z - 0.1));
  collider(g, 0.6, x, z);
  return disc;
}

function makeBird(color = '#dfe3e6') {
  const b = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.22, 8, 6), M(color));
  body.scale.set(0.8, 0.8, 1.5);
  const head = mesh(new THREE.SphereGeometry(0.13, 8, 6), M('#8a95a3'), 0, 0.12, 0.3);
  const wingGeo = new THREE.BoxGeometry(0.7, 0.03, 0.28);
  wingGeo.translate(0.35, 0, 0);
  const wl = new THREE.Mesh(wingGeo, M(color));
  const wr = new THREE.Mesh(wingGeo, M(color));
  wr.rotation.y = Math.PI;
  b.add(body, head, wl, wr);
  b.userData = { wl, wr };
  return b;
}

function addFlag(g, x, z, color, flags) {
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 6), WOOD, x, 3.5, z));
  g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), BRASS, x, 7.05, z));
  const geo = new THREE.PlaneGeometry(2.6, 1.6, 14, 6);
  geo.translate(1.3, 0, 0);
  const flag = new THREE.Mesh(geo, M(color, { side: THREE.DoubleSide }));
  flag.position.set(x, 6.1, z);
  flag.castShadow = true;
  g.add(flag);
  flags.push({ geo, base: geo.attributes.position.array.slice(), seed: x + z });
  collider(g, 0.4, x, z);
}

function makeGear(radius, teeth, color) {
  const gear = new THREE.Group();
  gear.add(mesh(new THREE.CylinderGeometry(radius, radius, 0.3, 20), M(color, { metalness: 0.4 })));
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.35), M(color, { metalness: 0.4 }), Math.cos(a) * radius, 0, Math.sin(a) * radius);
    tooth.rotation.y = -a;
    gear.add(tooth);
  }
  gear.rotation.x = Math.PI / 2;
  return gear;
}

function tapestryTexture(color) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 384;
  const x = c.getContext('2d');
  x.fillStyle = color;
  x.fillRect(0, 0, 256, 384);
  x.fillStyle = '#e8c35a';
  x.fillRect(0, 0, 256, 18);
  x.fillRect(0, 366, 256, 18);
  x.beginPath();
  x.arc(128, 160, 70, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = color;
  x.beginPath();
  x.arc(128, 160, 48, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#f6efd9';
  x.font = '600 34px Cinzel, Georgia, serif';
  x.textAlign = 'center';
  x.fillText('ONE VOICE', 128, 290);
  x.font = '22px Georgia, serif';
  x.fillText('· brand book ·', 128, 325);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Hamlet builder ----------

function buildHamlet(scene, h, i, ctx) {
  const r = rng(100 + i * 17);
  const g = new THREE.Group();
  g.position.set(h.x, h.y, h.z);
  g.rotation.y = Math.atan2(-Math.cos(h.angle), -Math.sin(h.angle)); // local +Z faces the Party Tree
  scene.add(g);
  const updaters = ctx.updaters;
  const folk = (action, x, z, rotY, extra = {}) =>
    staticFolk(g, updaters, { vest: h.color, seed: r(), ...extra }, x, z, rotY, action);

  // Homes
  const doorColors = [h.color, '#2f6b3a', '#c9a23a', '#a8432f', '#3d5f9e'];
  [-55, 0, 55].forEach((deg, k) => {
    const t = THREE.MathUtils.degToRad(deg);
    const hole = makeHobbitHole(k === 1 ? h.color : doorColors[1 + Math.floor(r() * 4)], 0.9 + r() * 0.15, r);
    hole.position.set(Math.sin(t) * 14, -0.25, -Math.cos(t) * 14);
    hole.rotation.y = -t;
    g.add(hole);
  });

  // Signpost at the entrance
  const sign = new THREE.Group();
  sign.position.set(3.2, 0, 10);
  sign.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.6, 6), WOOD, 0, 1.3, 0));
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.8, 0.1),
    [WOOD, WOOD, WOOD, WOOD, new THREE.MeshStandardMaterial({ map: textTexture(h.name) }), WOOD]
  );
  board.position.set(0, 2.2, 0.08);
  board.castShadow = true;
  sign.add(board);
  g.add(sign);
  collider(g, 0.4, 3.2, 10);

  // Lantern posts
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.4, 6), DARK_WOOD, sx * 7.5, 1.2, 6));
    g.add(mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), WINDOW_GLOW, sx * 7.5, 2.55, 6));
  }

  const walk = (pts, opts) => {
    const f = makeFolk({ vest: h.color, seed: r() });
    const w = new Walker(g, f, pts, { offset: r(), ...opts });
    updaters.push(w);
    return f;
  };

  switch (h.activity) {
    case 'market': {
      addStall(g, -5.5, -2, h.color, r);
      addStall(g, 0, -6, h.color, r);
      addStall(g, 5.5, -2, h.color, r);
      folk('talk', -6.3, -2.6, Math.atan2(5.5, 2), {});
      folk('talk', 0, -7, 0, {});
      folk('talk', 6.3, -2.6, Math.atan2(-5.5, 2), {});
      // Campaign notice board
      const nb = new THREE.Group();
      nb.position.set(0, 0, 3.5);
      nb.add(mesh(new THREE.BoxGeometry(3, 1.8, 0.12), WOOD, 0, 1.8, 0));
      for (const px of [-1.4, 1.4]) nb.add(mesh(new THREE.BoxGeometry(0.14, 2.8, 0.14), DARK_WOOD, px, 1.4, 0));
      const notes = ['#f6efd9', '#f2c94c', '#e86f8a', '#8fc1e3', '#b6d98a'];
      for (let k = 0; k < 9; k++) {
        const n = mesh(new THREE.PlaneGeometry(0.55, 0.42), M(notes[k % 5]), -1.05 + (k % 4) * 0.7, 2.3 - Math.floor(k / 4) * 0.55, 0.07);
        n.rotation.z = (r() - 0.5) * 0.2;
        nb.add(n);
      }
      g.add(nb);
      collider(g, 1.6, 0, 3.5);
      folk('point', 1.2, 5.4, Math.PI, {});
      folk('talk', -1.0, 5.6, Math.PI + 0.3, {});
      walk([[-3, 1], [3, 1], [3, -3.5], [-3, -3.5]], { loop: true, pause: 1.2, speed: 1.2 });
      const c = walk([[-7, 4], [7, 4]], { action: 'carry', pause: 1.5 });
      parcel(c, '#c47a3b');
      for (let k = 0; k < 6; k++) g.add(mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), WOOD, -8 + r() * 16, 0.3, -8 + r() * 2));
      break;
    }
    case 'scribes': {
      const desks = [[-3, -1.5], [3, -1.5], [-3, 2.5], [3, 2.5]];
      for (const [x, z] of desks) {
        addDesk(g, x, z);
        folk('write', x, z - 0.95, 0, {});
      }
      // Lectern with the voice & tone book
      g.add(mesh(new THREE.CylinderGeometry(0.15, 0.3, 1.3, 6), DARK_WOOD, 0, 0.65, -6));
      const book = mesh(new THREE.BoxGeometry(1.1, 0.12, 0.8), M('#7d2f2f'), 0, 1.4, -6);
      book.rotation.x = 0.35;
      g.add(book);
      const pages = mesh(new THREE.BoxGeometry(1.0, 0.04, 0.72), M('#f6f0dc'), 0, 1.48, -5.97);
      pages.rotation.x = 0.35;
      g.add(pages);
      collider(g, 0.6, 0, -6);
      folk('talk', 0, -7.2, 0, {});
      const c = walk([[-5.5, -4], [5.5, -4], [5.5, 5], [-5.5, 5]], { loop: true, action: 'carry', pause: 1 });
      parcel(c, '#f6f0dc');
      // Words drifting up from the desks
      const letterMat = M('#fffaf0', { side: THREE.DoubleSide, emissive: '#fff4d0', emissiveIntensity: 0.3 });
      const letters = [];
      for (let k = 0; k < 10; k++) {
        const l = mesh(new THREE.PlaneGeometry(0.35, 0.25), letterMat);
        g.add(l);
        letters.push({ l, d: desks[k % 4], s: r() * 6 });
      }
      updaters.push({
        update: (t) => {
          for (const { l, d, s } of letters) {
            const k = ((t * 0.18 + s / 6) % 1 + 1) % 1;
            l.position.set(d[0] + Math.sin(t + s) * 1.2 * k, 1.2 + k * 9, d[1] + Math.cos(t * 0.7 + s) * 1.2 * k);
            l.rotation.set(t + s, t * 0.8, s);
            l.scale.setScalar(1 - k * 0.7);
          }
        },
      });
      break;
    }
    case 'painters': {
      // Easels in an arc facing the middle of the glade; painters stand beside them.
      const spots = [-70, -25, 25, 70].map((d) => THREE.MathUtils.degToRad(d));
      const canvases = spots.map((a, k) => {
        const x = Math.sin(a) * 5.5;
        const z = -Math.cos(a) * 5.5 + 1.5;
        const face = Math.atan2(-x, 1.5 - z);
        const mat = addEasel(g, x, z, face);
        const side = a < 0 ? 1 : -1;
        const px = x + Math.cos(face) * 1.1 * side + Math.sin(face) * 0.7;
        const pz = z - Math.sin(face) * 1.1 * side + Math.cos(face) * 0.7;
        folk('paint', px, pz, Math.atan2(x - px, z - pz), {});
        return { mat, hue: k / 4 };
      });
      const wheel = addColorWheel(g, 0, -7);
      folk('point', 1.6, -5, Math.PI + 0.4, {});
      walk([[-6, 5], [0, 6.5], [6, 5]], { pause: 2.5 });
      updaters.push({
        update: (t) => {
          wheel.rotation.z = t * 0.25;
          for (const c of canvases) c.mat.color.setHSL((c.hue + t * 0.03) % 1, 0.6, 0.6);
        },
      });
      break;
    }
    case 'beacon': {
      const tower = mesh(new THREE.CylinderGeometry(1.5, 2.0, 8, 8), STONE, 0, 4, -5);
      g.add(tower);
      g.add(mesh(new THREE.CylinderGeometry(1.4, 0.9, 0.7, 10), M('#4a4a4a', { metalness: 0.5 }), 0, 8.35, -5));
      g.add(mesh(new THREE.BoxGeometry(1.1, 1.8, 0.2), DARK_WOOD, 0, 0.9, -3.05));
      collider(g, 2.2, 0, -5);
      const flames = [];
      const fireMat = M('#ffb02e', { emissive: '#ff7a1a', emissiveIntensity: 2.2 });
      const coreMat = M('#ffe27a', { emissive: '#ffd24a', emissiveIntensity: 2.5 });
      for (let k = 0; k < 3; k++) {
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.75 - k * 0.2, 2.2 - k * 0.4, 7), k === 2 ? coreMat : fireMat);
        fl.position.set((k - 1) * 0.3, 9.4, -5);
        g.add(fl);
        flames.push(fl);
      }
      const light = new THREE.PointLight('#ff9a3c', 60, 30, 2);
      light.position.set(0, 10, -5);
      g.add(light);
      // Pigeon coop
      g.add(mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), WOOD, 4.5, 0.6, -3));
      const roof = mesh(new THREE.ConeGeometry(1.3, 0.8, 4), M('#a8432f'), 4.5, 1.6, -3);
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      collider(g, 1.1, 4.5, -3);
      folk('wave', -2.5, -1, 0.3, {});
      folk('cheer', 2.2, 1, -0.4, {});
      folk('talk', -1.2, 2.5, Math.PI - 0.4, {});
      const c1 = walk([[-1.5, -2.6], [-6, 6]], { action: 'carry', pause: 1.5 });
      parcel(c1, h.color);
      const c2 = walk([[1.5, -2.6], [6.5, 5.5]], { action: 'carry', pause: 2 });
      parcel(c2, '#f6f0dc');
      // Circling flock
      const birds = [];
      for (let k = 0; k < 12; k++) {
        const b = makeBird(k % 4 ? '#e9ecef' : '#9fa9b5');
        g.add(b);
        birds.push({ b, rad: 4 + r() * 8, hgt: 10 + r() * 7, sp: 0.5 + r() * 0.5, ph: r() * 6 });
      }
      updaters.push({
        update: (t) => {
          flames.forEach((f, k) => {
            const s = 1 + Math.sin(t * 13 + k * 2) * 0.12 + Math.sin(t * 7.3 + k) * 0.08;
            f.scale.set(s, 1 + Math.sin(t * 9 + k) * 0.2, s);
            f.rotation.y = t * (k + 1);
          });
          light.intensity = 55 + Math.sin(t * 17) * 8 + Math.sin(t * 5) * 6;
          for (const { b, rad, hgt, sp, ph } of birds) {
            const a = t * sp + ph;
            b.position.set(Math.cos(a) * rad, hgt + Math.sin(a * 2) * 0.8, -5 + Math.sin(a) * rad);
            b.rotation.y = -a;
            const flap = Math.sin(t * 14 + ph) * 0.7;
            b.userData.wl.rotation.z = flap;
            b.userData.wr.rotation.z = -flap;
          }
        },
      });
      ctx.beacon = g;
      break;
    }
    case 'banners': {
      const palette = [h.color, '#e8c35a', '#f6efd9', '#2f6b3a', '#a8432f'];
      [-6, -3, 0, 3, 6].forEach((x, k) => addFlag(g, x, -7 + Math.abs(x) * 0.35, palette[k], ctx.flags));
      // Tapestry loom: the brand book woven by hand
      const loom = new THREE.Group();
      loom.position.set(0, 0, -1.5);
      for (const px of [-1.6, 1.6]) loom.add(mesh(new THREE.BoxGeometry(0.2, 4.2, 0.2), DARK_WOOD, px, 2.1, 0));
      loom.add(mesh(new THREE.BoxGeometry(3.6, 0.2, 0.25), DARK_WOOD, 0, 4.1, 0));
      const tap = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.6), new THREE.MeshStandardMaterial({ map: tapestryTexture(h.color), side: THREE.DoubleSide }));
      tap.position.set(0, 2.2, 0);
      tap.castShadow = true;
      loom.add(tap);
      g.add(loom);
      collider(g, 1.8, 0, -1.5);
      folk('write', -0.8, 0.0, Math.PI, {});
      folk('write', 0.8, 0.0, Math.PI, {});
      folk('point', -3.5, 3, Math.PI - 0.6, {});
      folk('cheer', 3.4, 3.2, Math.PI + 0.5, {});
      const c = walk([[-7, 3], [-2, 6], [5, 5.5]], { action: 'carry', pause: 2 });
      parcel(c, '#e8c35a');
      break;
    }
    case 'workshop': {
      // Windmill
      const mill = new THREE.Group();
      mill.position.set(-1, 0, -8);
      mill.add(mesh(new THREE.CylinderGeometry(1.6, 2.6, 8, 8), M('#e8dcc0', { flatShading: true }), 0, 4, 0));
      mill.add(mesh(new THREE.ConeGeometry(2.1, 2.2, 8), M('#8a4a2f', { flatShading: true }), 0, 9.1, 0));
      mill.add(mesh(new THREE.BoxGeometry(1, 1.8, 0.2), DARK_WOOD, 0, 0.9, 2.45));
      const sails = new THREE.Group();
      sails.position.set(0, 7.2, 2.0);
      for (let k = 0; k < 4; k++) {
        const arm = new THREE.Group();
        arm.rotation.z = (k * Math.PI) / 2;
        arm.add(mesh(new THREE.BoxGeometry(0.18, 5.2, 0.12), DARK_WOOD, 0, 2.6, 0));
        arm.add(mesh(new THREE.BoxGeometry(1.1, 4, 0.05), M('#f4ecd8'), 0.65, 3, 0));
        sails.add(arm);
      }
      sails.add(mesh(new THREE.SphereGeometry(0.35, 8, 6), DARK_WOOD));
      mill.add(sails);
      g.add(mill);
      collider(g, 2.8, -1, -8);
      // Gears and anvils
      const gearA = makeGear(1.1, 10, '#8f8f8f');
      gearA.position.set(5, 2.2, -4);
      const gearB = makeGear(0.7, 7, h.color);
      gearB.position.set(6.6, 2.9, -4);
      g.add(gearA, gearB, mesh(new THREE.BoxGeometry(3.6, 0.2, 0.4), DARK_WOOD, 5.8, 1.1, -4.3));
      collider(g, 1.4, 5.8, -4.2);
      for (const [x, z] of [[3, 1], [-4, 0]]) {
        g.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.7, 8), DARK_WOOD, x, 0.35, z));
        g.add(mesh(new THREE.BoxGeometry(0.9, 0.3, 0.4), M('#7d7f86', { metalness: 0.6, roughness: 0.4 }), x, 0.82, z));
        const horn = mesh(new THREE.ConeGeometry(0.17, 0.4, 6), M('#7d7f86', { metalness: 0.6, roughness: 0.4 }), x + 0.62, 0.86, z);
        horn.rotation.z = Math.PI / 2;
        g.add(horn);
        collider(g, 0.6, x, z);
        const smith = folk('hammer', x, z - 0.9, 0, {});
        const hammer = new THREE.Group();
        hammer.position.y = -0.55;
        hammer.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), WOOD, 0, 0, 0.18));
        hammer.children[0].rotation.x = Math.PI / 2;
        hammer.add(mesh(new THREE.BoxGeometry(0.14, 0.14, 0.26), M('#55575d', { metalness: 0.7 }), 0, 0, 0.42));
        hammer.children[1].rotation.x = Math.PI / 2;
        smith.parts.armR.add(hammer);
      }
      // Launch balloon
      const balloon = new THREE.Group();
      const env = mesh(new THREE.SphereGeometry(1.8, 16, 12), M(h.color));
      env.scale.y = 1.2;
      const band = mesh(new THREE.TorusGeometry(1.75, 0.12, 6, 20), M('#e8c35a'));
      band.rotation.x = Math.PI / 2;
      const basket = mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), WOOD, 0, -3.2, 0);
      balloon.add(env, band, basket);
      for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) {
        const rope = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), DARK_WOOD, x * 1.6, -2.2, z * 1.6);
        balloon.add(rope);
      }
      balloon.position.set(5, 12, 4);
      g.add(balloon);
      folk('cheer', 6, 4, Math.PI, {});
      const c = walk([[0, 4], [-1, -5.2]], { action: 'carry', pause: 1.8 });
      parcel(c, '#c9a23a');
      updaters.push({
        update: (t) => {
          sails.rotation.z = t * 0.6;
          gearA.rotation.y = t * 0.8;
          gearB.rotation.y = -t * 0.8 * (10 / 7) + 0.3;
          balloon.position.y = 11 + Math.sin(t * 0.4) * 2.5;
          balloon.rotation.y = t * 0.1;
        },
      });
      break;
    }
  }
}

// ---------- Centre: Party Tree, Hall and standing stones ----------

function runeTexture(rune) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#000';
  x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#fff';
  x.font = 'bold 92px serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(rune, 64, 70);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function buildCentre(scene, ctx) {
  const r = rng(1);
  const y0 = heightAt(0, 0);
  const g = new THREE.Group();
  g.position.y = y0;
  scene.add(g);

  // The Party Tree
  const trunk = mesh(new THREE.CylinderGeometry(0.9, 1.5, 8, 9), M('#6b4a2f', { flatShading: true }), 0, 4, 0);
  g.add(trunk);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const root = mesh(new THREE.CylinderGeometry(0.2, 0.5, 2.4, 6), M('#6b4a2f'), Math.cos(a) * 1.3, 0.4, Math.sin(a) * 1.3);
    root.rotation.set(Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0);
    g.add(root);
  }
  const leafCols = ['#4f8a32', '#5f9b38', '#6aa63f'];
  for (let k = 0; k < 9; k++) {
    const a = r() * Math.PI * 2;
    const d = k === 0 ? 0 : 2.5 + r() * 2.5;
    const blob = mesh(new THREE.IcosahedronGeometry(3 + r() * 1.6, 1), M(leafCols[k % 3], { flatShading: true }), Math.cos(a) * d, 9.5 + r() * 2.5, Math.sin(a) * d);
    g.add(blob);
  }
  collider(g, 1.8);
  // Lantern garland
  const lanternMat = M('#ffe7a3', { emissive: '#ffbf4a', emissiveIntensity: 1.6 });
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    g.add(mesh(new THREE.SphereGeometry(0.17, 8, 6), lanternMat, Math.cos(a) * 5.6, 6.6 + Math.sin(k * 1.7) * 0.4, Math.sin(a) * 5.6));
  }
  const glow = new THREE.PointLight('#ffc062', 40, 22, 2);
  glow.position.set(0, 6, 0);
  g.add(glow);

  // The leader's hall: a grand hobbit hole on the hillside
  const ha = THREE.MathUtils.degToRad(-120);
  const hx = Math.cos(ha) * 18;
  const hz = Math.sin(ha) * 18;
  const hall = makeHobbitHole('#2f6b3a', 1.45, r);
  hall.position.set(hx, heightAt(hx, hz) - y0 - 0.6, hz);
  hall.rotation.y = Math.atan2(-hx, -hz);
  g.add(hall);

  // Five standing stones, one per promise
  ctx.stones = [];
  PILLARS.forEach((p, k) => {
    const a = THREE.MathUtils.degToRad(-120 + 36 + k * 72);
    const x = Math.cos(a) * 9.5;
    const z = Math.sin(a) * 9.5;
    const s = new THREE.Group();
    s.position.set(x, heightAt(x, z) - y0 - 0.2, z);
    s.rotation.y = Math.atan2(x, z);
    s.add(mesh(new THREE.BoxGeometry(1.2, 2.8, 0.7), STONE, 0, 1.4, 0));
    s.add(mesh(new THREE.BoxGeometry(1.0, 0.4, 0.6), STONE, 0.1, 2.9, 0));
    const tex = runeTexture(p.rune);
    const runeMat = new THREE.MeshBasicMaterial({ color: '#ffd36b', alphaMap: tex, transparent: true });
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), runeMat);
    rune.position.set(0, 1.7, 0.36);
    s.add(rune);
    s.rotation.z = (r() - 0.5) * 0.08;
    g.add(s);
    collider(g, 0.8, x, z);
    ctx.stones.push({ pillar: p, x, z, mat: runeMat });
  });

  // Cross-team villagers mingling under the tree
  const mix = HAMLETS.map((h) => h.color);
  const spots = [[3.5, 3], [-3.8, 2.2], [2.2, -4], [-2.6, -4.2], [5.2, -0.6]];
  spots.forEach(([x, z], k) => {
    const f = makeFolk({ vest: mix[k % mix.length], seed: r() });
    f.root.position.set(x, 0, z);
    f.root.rotation.y = Math.atan2(-x, -z) + 0.6;
    g.add(f.root);
    const act = ['talk', 'cheer', 'talk', 'point', 'talk'][k];
    ctx.updaters.push({ update: (t) => animate(f, act, t) });
  });
  ctx.updaters.push({
    update: (t) => {
      glow.intensity = 36 + Math.sin(t * 2) * 6;
      for (const st of ctx.stones) st.mat.opacity = 0.65 + Math.sin(t * 2 + st.x) * 0.3;
    },
  });
}

// ---------- Couriers: the threads between teams ----------

function buildCouriers(scene, ctx) {
  const r = rng(77);
  HAMLETS.forEach((h, i) => {
    const ca = Math.cos(h.angle);
    const sa = Math.sin(h.angle);
    const f = makeFolk({ vest: h.color, seed: r() });
    parcel(f, i % 2 ? '#f6efd9' : CENTER.color);
    ctx.updaters.push(
      new Walker(scene, f, [[ca * 7 + sa * 0.8, sa * 7 - ca * 0.8], [h.x - ca * 11 + sa * 0.8, h.z - sa * 11 - ca * 0.8]], {
        action: 'carry',
        speed: 2.2,
        pause: 3,
        heightFn: heightAt,
        offset: r() * 4,
      })
    );
  });
  // Travellers on the ring road, visiting every community in turn.
  const ring = [];
  HAMLETS.forEach((h, i) => {
    const p = HAMLETS[(i + HAMLETS.length - 1) % HAMLETS.length];
    const n = HAMLETS[(i + 1) % HAMLETS.length];
    const toward = (o, d) => {
      const dx = o.x - h.x;
      const dz = o.z - h.z;
      const l = Math.hypot(dx, dz);
      return [h.x + (dx / l) * d, h.z + (dz / l) * d];
    };
    ring.push(toward(p, 12), [h.x - Math.cos(h.angle) * 9.5, h.z - Math.sin(h.angle) * 9.5], toward(n, 12));
  });
  for (let k = 0; k < 3; k++) {
    const f = makeFolk({ vest: HAMLETS[k * 2].color, cloak: '#556b3a', seed: r() });
    const w = new Walker(scene, f, ring, { loop: true, speed: 2.4, pause: 0.4, heightFn: heightAt, idle: 'wave' });
    w.idx = (k * 6 + 1) % ring.length;
    const [x, z] = ring[k * 6];
    f.root.position.set(x, heightAt(x, z), z);
    ctx.updaters.push(w);
  }
}

// ---------- Chimney smoke ----------

function buildSmoke(scene) {
  scene.updateMatrixWorld(true);
  const emitters = [];
  scene.traverse((o) => {
    if (o.name === 'chimneyTop') emitters.push(o.getWorldPosition(new THREE.Vector3()));
  });
  const geo = new THREE.IcosahedronGeometry(0.35, 0);
  const puffs = [];
  emitters.forEach((e, k) => {
    for (let j = 0; j < 5; j++) {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#e8e4dc', transparent: true, depthWrite: false, flatShading: true }));
      scene.add(m);
      puffs.push({ m, e, off: j / 5 + k * 0.13 });
    }
  });
  return (t) => {
    for (const { m, e, off } of puffs) {
      const k = (t * 0.22 + off) % 1;
      m.position.set(e.x + Math.sin(k * 3 + off * 9) * 0.6 + k * 1.5, e.y + k * 5, e.z + k * 0.8);
      m.scale.setScalar(0.6 + k * 2.2);
      m.material.opacity = 0.55 * (1 - k) * Math.min(1, k * 6);
      m.rotation.set(k * 2, off * 7, 0);
    }
  };
}

// ---------- Public ----------

export function buildVillage(scene) {
  const ctx = { updaters: [], flags: [], stones: [] };
  HAMLETS.forEach((h, i) => buildHamlet(scene, h, i, ctx));
  buildCentre(scene, ctx);
  buildCouriers(scene, ctx);
  const smoke = buildSmoke(scene);

  // Gather colliders in world space.
  scene.updateMatrixWorld(true);
  const colliders = [];
  const v = new THREE.Vector3();
  scene.traverse((o) => {
    if (o.userData.collider) {
      o.getWorldPosition(v);
      const s = o.parent.getWorldScale(new THREE.Vector3()).x;
      colliders.push({ x: v.x, z: v.z, r: o.userData.collider * s });
    }
  });

  const update = (t, dt) => {
    for (const u of ctx.updaters) u.update(t, dt);
    for (const f of ctx.flags) {
      const p = f.geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        const x = f.base[i];
        p[i + 2] = Math.sin(x * 2.2 - t * 5 + f.seed) * 0.22 * x;
        p[i + 1] = f.base[i + 1] - x * 0.05;
      }
      f.geo.attributes.position.needsUpdate = true;
      f.geo.computeVertexNormals();
    }
    smoke(t);
  };

  return { update, colliders, stones: ctx.stones };
}
