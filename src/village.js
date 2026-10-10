import * as THREE from 'three';
import { HAMLETS, PILLARS, CENTER, LAB, PROJECTS, AWARDS } from './data.js';
import { heightAt, rng } from './world.js';
import { makePerson, giveProp, animate } from './characters.js';
import { makeArch } from './landmarks.js';
import { WHITE_METAL, BRUSHED, CHROME, GLASS, GOLD, WOOD, DARK, MOUND, WINDOW_GLOW, CONCRETE, solid, glow, mesh, canvasTexture, deepMerge } from './materials.js';

const loader = new THREE.TextureLoader();
const texCache = {};
function coverTexture(src, aspect) {
  const key = src + aspect;
  if (texCache[key]) return texCache[key];
  const tex = loader.load(src, (t) => {
    const ia = t.image.width / t.image.height;
    if (ia > aspect) {
      t.repeat.set(aspect / ia, 1);
      t.offset.set((1 - aspect / ia) / 2, 0);
    } else {
      t.repeat.set(1, ia / aspect);
      t.offset.set(0, (1 - ia / aspect) / 2);
    }
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return (texCache[key] = tex);
}

function collider(parent, r, x = 0, z = 0) {
  const o = new THREE.Object3D();
  o.position.set(x, 0, z);
  o.userData.collider = r;
  parent.add(o);
}

// ---------- Hobbit hole, now with white-metal trim ----------

const A = 4.8, B = 3.1, C = 4.2;
const onMound = (x, y) => C * Math.sqrt(Math.max(0, 1 - (x / A) ** 2 - (y / B) ** 2));

export function makeHobbitHole(doorColor, scale = 1, r = Math.random) {
  const g = new THREE.Group();
  const mound = mesh(new THREE.SphereGeometry(1, 32, 20), MOUND);
  mound.scale.set(A, B, C);
  g.add(mound);
  const surround = mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.7, 32), WHITE_METAL);
  surround.rotation.x = Math.PI / 2;
  surround.position.set(0, 1.15, 3.6);
  const lip = mesh(new THREE.SphereGeometry(1.7, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), MOUND);
  lip.scale.set(1.15, 0.5, 0.75);
  lip.position.set(0, 2.45, 3.55);
  const door = mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.14, 32), new THREE.MeshPhysicalMaterial({ color: doorColor, roughness: 0.3, clearcoat: 1 }));
  door.rotation.x = Math.PI / 2;
  door.position.set(0, 1.15, 4.47);
  const ring = mesh(new THREE.TorusGeometry(1.16, 0.1, 10, 40), CHROME);
  ring.position.set(0, 1.15, 4.5);
  const knob = mesh(new THREE.SphereGeometry(0.12, 12, 10), GOLD, 0, 1.15, 4.6);
  const step = mesh(new THREE.BoxGeometry(2.4, 0.2, 1), CONCRETE, 0, 0.1, 4.95);
  g.add(surround, lip, door, ring, knob, step);
  for (const sx of [-1, 1]) {
    const x = sx * 2.7;
    const y = 1.2;
    const z = onMound(x, y);
    const n = new THREE.Vector3(x / (A * A), y / (B * B), z / (C * C)).normalize();
    const win = new THREE.Group();
    win.position.set(x, y, z).addScaledVector(n, 0.05);
    win.lookAt(win.position.clone().add(n));
    const frame = mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 24), CHROME);
    const glass = mesh(new THREE.CircleGeometry(0.46, 24), WINDOW_GLOW);
    win.add(frame, glass);
    g.add(win);
  }
  const cy = B * Math.sqrt(1 - (1.6 / A) ** 2 - (1.2 / C) ** 2);
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.4, 12), BRUSHED, 1.6, cy + 0.4, -1.2));
  const smoke = new THREE.Object3D();
  smoke.position.set(1.6, cy + 1.2, -1.2);
  smoke.name = 'chimneyTop';
  g.add(smoke);
  const flowers = ['#b18cf0', '#ffffff', '#f7c948', '#ff8fb1'];
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2;
    const x = Math.cos(a) * 2.8;
    const z = Math.sin(a) * 2.4 - 0.5;
    const y = B * Math.sqrt(Math.max(0, 1 - (x / A) ** 2 - (z / C) ** 2));
    g.add(mesh(new THREE.IcosahedronGeometry(0.35 + r() * 0.35, 1), solid(i % 3 ? '#4f9a33' : flowers[i % 4], { flatShading: true }), x, y, z));
  }
  g.scale.setScalar(scale);
  collider(g, 4.4);
  return g;
}

// ---------- Walkers ----------

class Walker {
  constructor(parent, person, points, opts = {}) {
    this.p = person;
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
    person.root.position.set(x, this.heightFn ? this.heightFn(x, z) : 0, z);
    parent.add(person.root);
  }
  update(t, dt) {
    const root = this.p.root;
    if (this.wait > 0) {
      this.wait -= dt;
      animate(this.p, this.action === 'carry' ? 'carry' : this.idle, t, 0);
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
      let diff = Math.atan2(dx, dz) - root.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      root.rotation.y += diff * Math.min(1, dt * 8);
    }
    if (this.heightFn) root.position.y = this.heightFn(root.position.x, root.position.z);
    animate(this.p, this.action, t, this.speed);
  }
}

// ---------- Billboards: the projects, in the world ----------

function metricSprite(value, label, color) {
  const tex = canvasTexture(512, 220, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const rr = 36;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, rr);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '800 108px "Bricolage Grotesque", Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, w / 2, 122, w - 40);
    ctx.fillStyle = '#334155';
    ctx.font = '600 36px Inter, sans-serif';
    ctx.fillText(label, w / 2, 176, w - 40);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(3.0, 1.29, 1);
  return s;
}

function titleTexture(text, color) {
  return canvasTexture(1024, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 14, h);
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 58px "Bricolage Grotesque", Inter, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 40, h / 2 + 3, w - 80);
  });
}

function makeBillboard(slug, color, ctx, size = 1) {
  const p = PROJECTS[slug];
  const g = new THREE.Group();
  const W = 4.6 * size;
  const H = 2.85 * size;
  const lift = 1.2 + size * 0.3;
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.22, lift + H, 0.22), WHITE_METAL, sx * (W / 2 - 0.4), (lift + H) / 2, -0.12));
  g.add(mesh(new THREE.BoxGeometry(W + 0.3, H + 0.3, 0.2), WHITE_METAL, 0, lift + H / 2, 0));
  const img = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: coverTexture(p.images[0], W / H), toneMapped: false })
  );
  img.position.set(0, lift + H / 2, 0.105);
  img.userData.slug = slug;
  img.userData.dynamic = true;
  g.add(img);
  const title = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.3, (W + 0.3) / 8), new THREE.MeshBasicMaterial({ map: titleTexture(p.title, color), toneMapped: false }));
  title.position.set(0, lift - 0.33, 0.12);
  title.userData.slug = slug;
  title.userData.dynamic = true;
  g.add(title);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.06, 0.06), glow(color, 2.5));
  strip.position.set(0, lift + H + 0.18, 0.08);
  g.add(strip);
  if (p.metrics[0]) {
    const s = metricSprite(p.metrics[0][0], p.metrics[0][1], color);
    s.position.set(0, lift + H + 1.25, 0);
    g.add(s);
    ctx.sprites.push({ s, base: s.position.y, ph: Math.random() * 6 });
  }
  ctx.clickables.push(img, title);
  collider(g, W / 2 - 0.2, 0, 0);
  return g;
}

// ---------- Text bubbles that float up (questions, likes) ----------

function bubbleTexture(text, bg, fg = '#0f172a') {
  return canvasTexture(512, 160, (ctx, w, h) => {
    ctx.font = '600 44px Inter, sans-serif';
    const tw = Math.min(w - 40, ctx.measureText(text).width + 60);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect((w - tw) / 2, 20, tw, 96, 48);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 14, 112);
    ctx.lineTo(w / 2, 140);
    ctx.lineTo(w / 2 + 14, 112);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, 70, w - 80);
  });
}

function floaters(g, ctx, items, area, height = 7) {
  const r = rng(items.length * 13);
  const list = items.map((text, k) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTexture(text.t, text.bg, text.fg), transparent: true, depthWrite: false }));
    s.scale.set(text.w ?? 2.6, (text.w ?? 2.6) * 0.31, 1);
    g.add(s);
    return { s, x: area.x + (r() - 0.5) * area.w, z: area.z + (r() - 0.5) * area.d, off: k / items.length };
  });
  ctx.updaters.push({
    update: (t) => {
      for (const f of list) {
        const k = (t * 0.07 + f.off) % 1;
        f.s.position.set(f.x + Math.sin(t * 0.8 + f.off * 9) * 0.4, 2 + k * height, f.z);
        f.s.material.opacity = Math.min(1, k * 5) * (1 - k);
      }
    },
  });
}

// ---------- Hamlets ----------

function buildHamlet(scene, h, i, ctx) {
  const r = rng(100 + i * 17);
  const g = new THREE.Group();
  g.position.set(h.x, h.y, h.z);
  g.rotation.y = Math.atan2(-Math.cos(h.angle), -Math.sin(h.angle)); // local +Z faces the centre
  scene.add(g);
  const U = ctx.updaters;
  const person = (action, x, z, rotY, extra = {}) => {
    const p = makePerson({ accent: h.color, seed: r(), ...extra });
    p.root.position.set(x, extra.y ?? 0, z);
    p.root.rotation.y = rotY;
    g.add(p.root);
    U.push({ update: (t) => animate(p, action, t) });
    return p;
  };
  const walker = (pts, opts = {}) => {
    const p = makePerson({ accent: h.color, seed: r() });
    U.push(new Walker(g, p, pts, { offset: r(), ...opts }));
    return p;
  };
  const face = (x, z, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

  // Homes behind the plaza
  [-55, 0, 55].forEach((deg, k) => {
    const t = THREE.MathUtils.degToRad(deg);
    const hole = makeHobbitHole(k === 1 ? h.color : ['#2f6b3a', '#c9a23a', '#a8432f', '#3d5f9e'][Math.floor(r() * 4)], 0.95, r);
    hole.position.set(Math.sin(t) * 17, -0.25, -Math.cos(t) * 17);
    hole.rotation.y = -t;
    g.add(hole);
  });

  // Gateway arch on the road from the centre
  const arch = makeArch(h.color, h.name);
  arch.position.set(0, 0, 14.5);
  g.add(arch);
  collider(g, 1.1, -3.7, 14.5);
  collider(g, 1.1, 3.7, 14.5);

  // Projects on billboards around the plaza
  const slots = [-30, 30, -82, 82];
  h.projects.forEach((slug, k) => {
    const t = THREE.MathUtils.degToRad(slots[k]);
    const x = Math.sin(t) * 11;
    const z = -Math.cos(t) * 11;
    const b = makeBillboard(slug, h.color, ctx, 1.2);
    b.position.set(x, 0, z);
    b.rotation.y = face(x, z);
    g.add(b);
    const marker = new THREE.Object3D();
    marker.position.set(x * 0.78, 0, z * 0.78);
    marker.userData.project = slug;
    g.add(marker);
  });

  // Department lead, with things to say
  const leadPos = { x: 2.6, z: 7.5 };
  const lead = person('talk', leadPos.x, leadPos.z, face(leadPos.x, leadPos.z, 0, 14), { top: h.color });
  ctx.speakers.push({ id: h.id, obj: lead.parts.head, lines: h.quotes, color: h.color, name: `${h.name} lead` });

  switch (h.activity) {
    case 'arena': {
      // A cricket pitch where founders are being filmed for the T20 spots.
      g.add(mesh(new THREE.BoxGeometry(2.2, 0.04, 9), solid('#d8c79a'), 0, 0.02, -0.5, false));
      for (const z of [-4.5, 3.5]) for (const x of [-0.18, 0, 0.18]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), solid('#f3ead0'), x, 0.38, z));
      person('cheer', 0, -3, 0, { top: '#1a4fd6', pants: '#1a4fd6', beard: true });
      const cam = person('camera', 2.6, 0.5, face(2.6, 0.5, 0, -3));
      giveProp(cam, 'camera');
      person('point', -2.6, 1, face(-2.6, 1, 0, -3));
      person('talk', -3.4, -1.2, face(-3.4, -1.2, 0, -3), {});
      for (const sx of [-1, 1]) {
        const x = sx * 7.5;
        g.add(mesh(new THREE.CylinderGeometry(0.18, 0.28, 11, 10), WHITE_METAL, x, 5.5, 4));
        const panel = mesh(new THREE.BoxGeometry(2.2, 1.3, 0.3), WHITE_METAL, x, 11.2, 4);
        panel.rotation.y = face(x, 4);
        g.add(panel);
        const lights = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.0), glow('#ffffff', 4));
        lights.position.set(x - sx * 0.1, 11.2, 4 - 0.17);
        lights.rotation.y = face(x, 4) + Math.PI;
        g.add(lights);
        collider(g, 0.5, x, 4);
      }
      giveProp(walker([[-6, 5.5], [6, 5.5]], { action: 'carry', pause: 1.5 }), 'parcel', '#e9d5a6');
      break;
    }
    case 'launch': {
      // Globe sculpture: international payments, everywhere.
      const globe = new THREE.Group();
      globe.position.set(0, 4.2, -3.5);
      globe.add(mesh(new THREE.SphereGeometry(1.5, 32, 20), glow(h.color, 0.6)));
      for (let k = 0; k < 4; k++) {
        const ring = mesh(new THREE.TorusGeometry(2.1, 0.07, 8, 64), CHROME);
        ring.rotation.y = (k * Math.PI) / 4;
        globe.add(ring);
      }
      const eq = mesh(new THREE.TorusGeometry(2.3, 0.09, 8, 64), WHITE_METAL);
      eq.rotation.x = Math.PI / 2;
      globe.add(eq);
      g.add(globe);
      g.add(mesh(new THREE.CylinderGeometry(0.9, 1.3, 2.2, 24), WHITE_METAL, 0, 1.1, -3.5));
      collider(g, 1.6, 0, -3.5);
      const deskX = 5;
      g.add(mesh(new THREE.BoxGeometry(1.6, 0.08, 0.8), WHITE_METAL, deskX, 1.05, 2));
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.05, 8), BRUSHED, deskX, 0.52, 2));
      const lap = mesh(new THREE.BoxGeometry(0.5, 0.32, 0.02), DARK, deskX, 1.27, 2.1);
      lap.rotation.x = -0.25;
      g.add(lap);
      collider(g, 0.9, deskX, 2);
      person('type', deskX, 1.35, 0);
      person('present', -1.8, -1.2, face(-1.8, -1.2, 0, 4));
      person('talk', -3.5, 2.5, face(-3.5, 2.5, -1.8, -1.2));
      person('talk', -1.2, 3.4, face(-1.2, 3.4, -1.8, -1.2));
      // Hot air balloons: launches going up
      const balloons = [];
      for (const [x, y, z, c] of [[6, 13, -2, h.color], [-7, 16, 1, '#ffffff']]) {
        const b = new THREE.Group();
        const env = mesh(new THREE.SphereGeometry(2, 24, 18), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.6 }));
        env.scale.y = 1.2;
        const band = mesh(new THREE.TorusGeometry(1.95, 0.12, 8, 32), CHROME);
        band.rotation.x = Math.PI / 2;
        b.add(env, band, mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), WOOD, 0, -3.4, 0));
        b.position.set(x, y, z);
        g.add(b);
        balloons.push({ b, y });
      }
      U.push({
        update: (t) => {
          globe.rotation.y = t * 0.3;
          balloons.forEach(({ b, y }, k) => {
            b.position.y = y + Math.sin(t * 0.4 + k * 2) * 2.5;
            b.rotation.y = t * 0.1;
          });
        },
      });
      break;
    }
    case 'isles': {
      // Floating islands with mini storefronts, like the Magic Checkout page.
      const isles = [];
      for (const [x, y, z, s] of [[-6, 4.5, 1, 1], [6, 5.5, -1, 1.1], [0, 8, -5, 1.3]]) {
        const isle = new THREE.Group();
        const top = mesh(new THREE.CylinderGeometry(1.8 * s, 1.8 * s, 0.4, 24), solid('#69b443'));
        const rock = mesh(new THREE.ConeGeometry(1.8 * s, 2.4 * s, 10), solid('#cfc8bb', { flatShading: true }), 0, -1.4 * s, 0);
        rock.rotation.x = Math.PI;
        const shop = mesh(new THREE.BoxGeometry(1.4 * s, 1.1 * s, 0.9 * s), WHITE_METAL, 0, 0.75 * s, 0);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0 * s, 0.6 * s), glow(h.color, 1.2));
        screen.position.set(0, 0.8 * s, 0.46 * s);
        const awning = mesh(new THREE.BoxGeometry(1.6 * s, 0.08, 0.6 * s), solid(h.color), 0, 1.38 * s, 0.4 * s);
        awning.rotation.x = 0.3;
        isle.add(top, rock, shop, screen, awning);
        isle.position.set(x, y, z);
        isle.rotation.y = face(x, z, 0, 8);
        g.add(isle);
        isles.push({ isle, y, ph: x });
      }
      // Boxing ring: Back in the Ring
      const ringG = new THREE.Group();
      ringG.position.set(0, 0, 2);
      ringG.add(mesh(new THREE.BoxGeometry(5, 0.6, 5), WHITE_METAL, 0, 0.3, 0));
      ringG.add(mesh(new THREE.BoxGeometry(4.8, 0.05, 4.8), solid('#1d2b4f'), 0, 0.62, 0, false));
      for (const [x, z] of [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]]) ringG.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 10), CHROME, x, 1.4, z));
      for (const y of [1.15, 1.6, 2.0]) {
        for (const [x, z, rot] of [[0, -2.3, 0], [0, 2.3, 0], [-2.3, 0, Math.PI / 2], [2.3, 0, Math.PI / 2]]) {
          const rope = mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.6, 6), glow(h.color, 1.2), x, y, z);
          rope.rotation.set(0, rot, Math.PI / 2);
          ringG.add(rope);
        }
      }
      g.add(ringG);
      collider(g, 3.2, 0, 2);
      const b1 = makePerson({ seed: r(), top: '#c0392b', sleeves: 'short', lanyard: false });
      const b2 = makePerson({ seed: r(), top: '#1a4fd6', sleeves: 'short', lanyard: false });
      giveProp(b1, 'glove', '#c0392b');
      giveProp(b2, 'glove', '#1a4fd6');
      b1.root.position.set(-0.7, 0.62, 2);
      b2.root.position.set(0.7, 0.62, 2);
      b1.root.rotation.y = Math.PI / 2;
      b2.root.rotation.y = -Math.PI / 2;
      b2.phase += 0.35;
      g.add(b1.root, b2.root);
      U.push({ update: (t) => (animate(b1, 'box', t), animate(b2, 'box', t)) });
      person('cheer', -3.6, 4.6, face(-3.6, 4.6, 0, 2));
      person('cheer', 3.6, 4.8, face(3.6, 4.8, 0, 2));
      U.push({ update: (t) => isles.forEach(({ isle, y, ph }) => (isle.position.y = y + Math.sin(t * 0.7 + ph) * 0.5)) });
      break;
    }
    case 'beacon': {
      const tower = new THREE.Group();
      tower.position.set(0, 0, -4);
      tower.add(mesh(new THREE.CylinderGeometry(0.9, 1.7, 11, 24), WHITE_METAL, 0, 5.5, 0));
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.12, 10, 48), glow(h.color, 3));
      halo.position.y = 11.6;
      halo.rotation.x = Math.PI / 2;
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 2), glow(h.color, 4));
      core.position.y = 12.2;
      halo.userData.dynamic = core.userData.dynamic = true;
      tower.add(halo, core);
      const light = new THREE.PointLight(h.color, 40, 30, 2);
      light.position.y = 12;
      tower.add(light);
      g.add(tower);
      collider(g, 2, 0, -4);
      // Ring light and creators filming reels
      const rl = new THREE.Group();
      rl.position.set(4.2, 0, 2.2);
      rl.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), DARK, 0, 0.8, 0));
      const ringLight = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 32), glow('#ffffff', 3));
      ringLight.position.y = 1.75;
      rl.add(ringLight);
      rl.rotation.y = face(4.2, 2.2, 2.6, 4.4);
      g.add(rl);
      const creator = person('phone', 2.6, 4.4, face(2.6, 4.4, 4.2, 2.2), { longHair: true });
      giveProp(creator, 'phone');
      const c2 = person('phone', -3, 1.5, face(-3, 1.5, 0, -4));
      giveProp(c2, 'phone');
      person('wave', -1.5, 4, Math.PI * 0.1);
      person('cheer', 1.6, -0.6, face(1.6, -0.6, -3, 1.5));
      floaters(g, ctx, [
        { t: '♥ 6.55M', bg: '#ff4f8b', fg: '#ffffff' },
        { t: '129 reels', bg: '#ffffff' },
        { t: '♥ ♥ ♥', bg: '#ff4f8b', fg: '#ffffff', w: 1.6 },
        { t: '200+ posts', bg: '#ffffff' },
        { t: '💬 New comment', bg: '#ffffff' },
        { t: '♥', bg: '#ff4f8b', fg: '#ffffff', w: 1 },
      ], { x: 0, z: -1, w: 10, d: 6 }, 10);
      U.push({
        update: (t) => {
          halo.rotation.z = t * 0.8;
          halo.position.y = 11.6 + Math.sin(t * 2) * 0.2;
          core.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
          light.intensity = 35 + Math.sin(t * 3) * 10;
        },
      });
      break;
    }
    case 'court': {
      // The animal courtroom of Trial of the Century.
      g.add(mesh(new THREE.BoxGeometry(5, 0.5, 3), WHITE_METAL, 0, 0.25, -5.5));
      g.add(mesh(new THREE.BoxGeometry(4.4, 1.4, 0.6), WHITE_METAL, 0, 1.2, -4.4));
      g.add(mesh(new THREE.BoxGeometry(4.5, 0.1, 0.9), WOOD, 0, 1.95, -4.5));
      const crest = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), glow(h.color, 1.5));
      crest.position.set(0, 1.2, -4.08);
      g.add(crest);
      collider(g, 2.6, 0, -5);
      const judge = person('gavel', 0, -5.4, 0, { y: 0.5, top: '#1b1f2a', beard: true });
      giveProp(judge, 'gavel');
      for (const sx of [-1, 1]) {
        g.add(mesh(new THREE.BoxGeometry(1, 1.1, 0.8), WHITE_METAL, sx * 3, 0.55, 0));
        collider(g, 0.7, sx * 3, 0);
        person('talk', sx * 3, 0.9, Math.PI);
      }
      for (const sx of [-1, 1]) {
        const x = sx * 6.3;
        g.add(mesh(new THREE.BoxGeometry(1.5, 0.08, 0.8), WOOD, x, 0.85, 3));
        for (const lx of [-0.65, 0.65]) g.add(mesh(new THREE.BoxGeometry(0.06, 0.85, 0.7), BRUSHED, x + lx, 0.42, 3));
        g.add(mesh(new THREE.BoxGeometry(0.45, 0.04, 0.6), solid('#fbfaf5'), x, 0.92, 3));
        collider(g, 0.9, x, 3);
        person('write', x, 2.1, 0);
      }
      floaters(g, ctx, [
        { t: 'Why did my salary change?', bg: '#ffffff', w: 3.6 },
        { t: 'What is this deduction?', bg: '#ffffff', w: 3.4 },
        { t: 'Sawaal pe sawaal!', bg: h.color, w: 3 },
        { t: 'Objection!', bg: '#ffffff', w: 2.2 },
        { t: 'Shop. Don’t abandon.', bg: h.color, w: 3.2 },
      ], { x: 0, z: -2, w: 9, d: 5 }, 8);
      break;
    }
    case 'studio': {
      // Tool kiosks: each screen shows one of the in-house AI tools.
      const tools = [
        ['cine-ui', -5.2, -1.5],
        ['founder-grid', 5.2, -1.5],
        ['prod-1', -5.6, 3.4],
        ['social-flow', 5.6, 3.4],
      ];
      for (const [img, x, z] of tools) {
        const k = new THREE.Group();
        k.position.set(x, 0, z);
        k.rotation.y = face(x, z, 0, z);
        k.add(mesh(new THREE.BoxGeometry(1.8, 0.08, 0.9), WHITE_METAL, 0, 1.05, 0));
        k.add(mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), BRUSHED, 0, 0.52, 0));
        k.add(mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), DARK, 0, 1.75, -0.32));
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: coverTexture(`work/${img}.jpg`, 1.5 / 0.9), toneMapped: false }));
        screen.position.set(0, 1.75, -0.285);
        k.add(screen);
        g.add(k);
        collider(g, 1, x, z);
        const designer = makePerson({ accent: h.color, seed: r() });
        designer.root.position.set(0, 0, 0.85);
        designer.root.rotation.y = Math.PI;
        k.add(designer.root);
        U.push({ update: (t) => animate(designer, 'type', t) });
      }
      // Colour wheel sculpture
      const wheel = new THREE.Group();
      wheel.position.set(0, 4, -6);
      for (let k = 0; k < 16; k++) {
        const seg = new THREE.Mesh(
          new THREE.CircleGeometry(2, 6, (k / 16) * Math.PI * 2, (Math.PI * 2) / 16),
          new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHSL(k / 16, 0.75, 0.55), side: THREE.DoubleSide, clearcoat: 1, roughness: 0.3 })
        );
        wheel.add(seg);
      }
      wheel.add(mesh(new THREE.TorusGeometry(2.05, 0.12, 10, 48), CHROME));
      g.add(wheel);
      g.add(mesh(new THREE.CylinderGeometry(0.15, 0.3, 4, 12), WHITE_METAL, 0, 2, -6.2));
      collider(g, 0.6, 0, -6.2);
      // Cinema camera on a tripod, aimed at a product
      g.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.9, 24), WHITE_METAL, 1.5, 0.45, -2.5));
      g.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), solid(h.color), 1.5, 1.05, -2.5));
      collider(g, 0.8, 1.5, -2.5);
      const tri = new THREE.Group();
      tri.position.set(-1.5, 0, -0.5);
      for (let k = 0; k < 3; k++) {
        const leg = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6), DARK, Math.cos(k * 2.1) * 0.3, 0.7, Math.sin(k * 2.1) * 0.3);
        leg.rotation.set(Math.sin(k * 2.1) * 0.35, 0, -Math.cos(k * 2.1) * 0.35);
        tri.add(leg);
      }
      tri.add(mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), DARK, 0, 1.55, 0));
      tri.rotation.y = face(-1.5, -0.5, 1.5, -2.5);
      g.add(tri);
      person('present', -2.2, 1.6, face(-2.2, 1.6, 1.5, -2.5));
      U.push({ update: (t) => (wheel.rotation.z = t * 0.25) });
      break;
    }
  }
  walker([[-7.5, 6.5], [-2, 8.5], [7, 7]], { pause: 2.5 });
  deepMerge(g);
}

// ---------- The Night Lab by the pond ----------

function buildLab(scene, ctx) {
  const g = new THREE.Group();
  g.position.set(LAB.x, LAB.y, LAB.z);
  g.rotation.y = Math.atan2(-LAB.x, -LAB.z) + Math.PI; // faces the pond
  scene.add(g);
  // glass pavilion
  for (const [x, z] of [[-3.5, -2.5], [3.5, -2.5], [-3.5, 2.5], [3.5, 2.5]]) {
    g.add(mesh(new THREE.BoxGeometry(0.2, 3.6, 0.2), WHITE_METAL, x, 1.8, z));
    collider(g, 0.3, x, z);
  }
  g.add(mesh(new THREE.BoxGeometry(7.6, 0.25, 5.6), WHITE_METAL, 0, 3.7, 0));
  const roof = mesh(new THREE.BoxGeometry(7.2, 0.05, 5.2), GLASS, 0, 3.85, 0, false);
  g.add(roof);
  g.add(mesh(new THREE.BoxGeometry(7.4, 0.12, 5.4), CONCRETE, 0, 0.06, 0, false));
  LAB.projects.forEach((slug, k) => {
    const b = makeBillboard(slug, LAB.color, ctx, 0.62);
    const x = (k - 1) * 3.2;
    b.position.set(x, 0.1, -1.8);
    g.add(b);
    const marker = new THREE.Object3D();
    marker.position.set(x, 0, 0.5);
    marker.userData.project = slug;
    g.add(marker);
  });
  const artist = makePerson({ accent: LAB.color, seed: 0.77, top: '#2b2f36' });
  artist.root.position.set(2.6, 0, 1.6);
  artist.root.rotation.y = Math.PI + 0.5;
  g.add(artist.root);
  ctx.updaters.push({ update: (t) => animate(artist, 'present', t) });
  ctx.speakers.push({ id: 'lab', obj: artist.parts.head, lines: LAB.quotes, color: LAB.color, name: 'The artist' });
  deepMerge(g);
}

// ---------- Centre: Party Tree, HQ hall, standing stones ----------

function runeTexture(rune) {
  return canvasTexture(128, 128, (x) => {
    x.fillStyle = '#000';
    x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#fff';
    x.font = 'bold 88px serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(rune, 64, 70);
  });
}

function buildCentre(scene, ctx) {
  const r = rng(1);
  const y0 = heightAt(0, 0);
  const g = new THREE.Group();
  g.position.y = y0;
  scene.add(g);

  g.add(mesh(new THREE.CylinderGeometry(0.9, 1.6, 8, 12), solid('#6e5038', { flatShading: true }), 0, 4, 0));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const root = mesh(new THREE.CylinderGeometry(0.2, 0.5, 2.4, 6), solid('#6e5038'), Math.cos(a) * 1.4, 0.4, Math.sin(a) * 1.4);
    root.rotation.set(Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0);
    g.add(root);
  }
  const leaves = ['#4f9a33', '#5fae38', '#3f8a2c', '#79bf45'];
  for (let k = 0; k < 12; k++) {
    const a = r() * Math.PI * 2;
    const d = k === 0 ? 0 : 2.5 + r() * 3;
    g.add(mesh(new THREE.IcosahedronGeometry(2.8 + r() * 1.8, 1), solid(leaves[k % 4], { flatShading: true }), Math.cos(a) * d, 9.5 + r() * 3, Math.sin(a) * d));
  }
  collider(g, 1.9);
  // Floating halo ring around the canopy
  const halo = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.16, 12, 96), WHITE_METAL);
  halo.position.y = 7.2;
  halo.rotation.x = Math.PI / 2;
  g.add(halo);
  const haloGlow = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.05, 6, 96), glow('#ffd36b', 3));
  haloGlow.position.y = 7.0;
  haloGlow.rotation.x = Math.PI / 2;
  g.add(haloGlow);
  halo.userData.dynamic = haloGlow.userData.dynamic = true;
  const lanternMat = glow('#ffe7a3', 2);
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    g.add(mesh(new THREE.SphereGeometry(0.15, 10, 8), lanternMat, Math.cos(a) * 7.5, 6.6, Math.sin(a) * 7.5, false));
  }

  // HQ hall: a grand hobbit hole
  const ha = THREE.MathUtils.degToRad(-120);
  const hx = Math.cos(ha) * 18;
  const hz = Math.sin(ha) * 18;
  const hall = makeHobbitHole(CENTER.color, 1.45, r);
  hall.position.set(hx, heightAt(hx, hz) - y0 - 0.6, hz);
  hall.rotation.y = Math.atan2(-hx, -hz);
  g.add(hall);

  ctx.stones = [];
  PILLARS.forEach((p, k) => {
    const a = THREE.MathUtils.degToRad(-120 + 36 + k * 72);
    const x = Math.cos(a) * 9.6;
    const z = Math.sin(a) * 9.6;
    const s = new THREE.Group();
    s.position.set(x, heightAt(x, z) - y0 - 0.2, z);
    s.rotation.y = Math.atan2(x, z);
    s.add(mesh(new THREE.BoxGeometry(1.3, 3.4, 0.6), WHITE_METAL, 0, 1.7, 0));
    const runeMat = new THREE.MeshBasicMaterial({ color: '#ffc93c', alphaMap: runeTexture(p.rune), transparent: true, toneMapped: false });
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), runeMat);
    rune.position.set(0, 2.1, 0.31);
    s.add(rune);
    g.add(s);
    collider(g, 0.8, x, z);
    ctx.stones.push({ pillar: p, x, z, mat: runeMat });
  });

  const mix = HAMLETS.map((h) => h.color);
  [[3.6, 3.2], [-3.9, 2.4], [2.4, -4.1], [-2.8, -4.2], [5.2, -0.6]].forEach(([x, z], k) => {
    const p = makePerson({ accent: mix[k % mix.length], seed: r() });
    p.root.position.set(x, 0, z);
    p.root.rotation.y = Math.atan2(-x, -z) + 0.6;
    g.add(p.root);
    const act = ['talk', 'cheer', 'talk', 'point', 'talk'][k];
    ctx.updaters.push({ update: (t) => animate(p, act, t) });
    if (k === 0) ctx.speakers.push({ id: 'hq', obj: p.parts.head, lines: CENTER.quotes, color: CENTER.color, name: 'Studio host' });
  });
  deepMerge(g);
  ctx.updaters.push({
    update: (t) => {
      halo.rotation.z = t * 0.05;
      halo.position.y = 7.2 + Math.sin(t * 0.8) * 0.25;
      haloGlow.position.y = halo.position.y - 0.2;
      for (const st of ctx.stones) st.mat.opacity = 0.7 + Math.sin(t * 2 + st.x) * 0.3;
    },
  });
}

// ---------- Trophies to collect ----------

function makeTrophy() {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.55, 0], [0.55, 0.12], [0.18, 0.2], [0.12, 0.7], [0.2, 0.85], [0.55, 1.05], [0.62, 1.6], [0.56, 1.62], [0.3, 1.2], [0, 1.15]].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = mesh(new THREE.LatheGeometry(pts, 32), GOLD);
  for (const sx of [-1, 1]) {
    const handle = mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16, Math.PI), GOLD, sx * 0.6, 1.3, 0);
    handle.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(handle);
  }
  g.add(cup);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 60, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: '#ffd84a', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  beam.position.y = 30;
  return { g, beam };
}

function buildTrophies(scene, ctx) {
  const spots = [
    [HAMLETS[0].angle + Math.PI / 6, 118],
    [HAMLETS[2].angle + Math.PI / 6, 122],
    [HAMLETS[3].angle + Math.PI / 6, 150],
    [HAMLETS[4].angle + Math.PI / 6, 120],
  ];
  ctx.trophies = AWARDS.map((award, k) => {
    const [a, d] = spots[k];
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const y = heightAt(x, z);
    const base = mesh(new THREE.CylinderGeometry(1.1, 1.3, 1, 24), WHITE_METAL, x, y + 0.4, z);
    scene.add(base);
    const { g, beam } = makeTrophy();
    g.position.set(x, y + 1.1, z);
    scene.add(g);
    beam.position.set(x, y + 30, z);
    scene.add(beam);
    return { award, x, z, y, g, beam, base, collected: false };
  });
  ctx.updaters.push({
    update: (t) => {
      for (const tr of ctx.trophies) {
        if (tr.collected) continue;
        tr.g.rotation.y = t * 1.2;
        tr.g.position.y = tr.y + 1.3 + Math.sin(t * 2 + tr.x) * 0.2;
      }
    },
  });
}

// ---------- Couriers ----------

function buildCouriers(scene, ctx) {
  const r = rng(77);
  HAMLETS.forEach((h) => {
    const ca = Math.cos(h.angle);
    const sa = Math.sin(h.angle);
    const p = makePerson({ accent: h.color, seed: r(), top: h.color });
    giveProp(p, 'parcel', '#e9d5a6');
    ctx.updaters.push(
      new Walker(scene, p, [[ca * 11 + sa * 1.2, sa * 11 - ca * 1.2], [h.x - ca * 15 + sa * 1.2, h.z - sa * 15 - ca * 1.2]], {
        action: 'carry',
        speed: 2.1,
        pause: 3,
        heightFn: heightAt,
        offset: r() * 4,
      })
    );
  });
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
    ring.push(toward(p, 14), [h.x - Math.cos(h.angle) * 10, h.z - Math.sin(h.angle) * 10], toward(n, 14));
  });
  for (let k = 0; k < 3; k++) {
    const p = makePerson({ accent: HAMLETS[k * 2].color, seed: r() });
    const w = new Walker(scene, p, ring, { loop: true, speed: 2.4, pause: 0.4, heightFn: heightAt, idle: 'wave' });
    w.idx = (k * 6 + 1) % ring.length;
    const [x, z] = ring[k * 6];
    p.root.position.set(x, heightAt(x, z), z);
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
  const geo = new THREE.IcosahedronGeometry(0.35, 1);
  const puffs = [];
  emitters.forEach((e, k) => {
    for (let j = 0; j < 3; j++) {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#f4f6f8', transparent: true, depthWrite: false }));
      scene.add(m);
      puffs.push({ m, e, off: j / 3 + k * 0.13 });
    }
  });
  return (t) => {
    for (const { m, e, off } of puffs) {
      const k = (t * 0.2 + off) % 1;
      m.position.set(e.x + Math.sin(k * 3 + off * 9) * 0.6 + k * 1.5, e.y + k * 5, e.z + k * 0.8);
      m.scale.setScalar(0.6 + k * 2.2);
      m.material.opacity = 0.5 * (1 - k) * Math.min(1, k * 6);
    }
  };
}

// ---------- Public ----------

export function buildVillage(scene) {
  const ctx = { updaters: [], stones: [], speakers: [], clickables: [], sprites: [], trophies: [] };
  HAMLETS.forEach((h, i) => buildHamlet(scene, h, i, ctx));
  buildLab(scene, ctx);
  buildCentre(scene, ctx);
  buildTrophies(scene, ctx);
  buildCouriers(scene, ctx);
  const smoke = buildSmoke(scene);

  scene.updateMatrixWorld(true);
  const colliders = [];
  const projects = [];
  const v = new THREE.Vector3();
  scene.traverse((o) => {
    if (o.userData.collider) {
      o.getWorldPosition(v);
      const s = o.parent.getWorldScale(new THREE.Vector3()).x;
      colliders.push({ x: v.x, z: v.z, r: o.userData.collider * s });
    }
    if (o.userData.project) {
      o.getWorldPosition(v);
      projects.push({ slug: o.userData.project, x: v.x, z: v.z });
    }
  });

  const update = (t, dt) => {
    for (const u of ctx.updaters) u.update(t, dt);
    for (const sp of ctx.sprites) sp.s.position.y = sp.base + Math.sin(t * 1.5 + sp.ph) * 0.12;
    smoke(t);
  };

  return { update, colliders, stones: ctx.stones, speakers: ctx.speakers, clickables: ctx.clickables, trophies: ctx.trophies, projects };
}
