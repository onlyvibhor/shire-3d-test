import * as THREE from 'three';
import { HAMLETS, PILLARS, CENTER, LAB, PROJECTS, AWARDS, HOME, FUN, FAVOURITES, OWNER, AIHUB, HALL, BELIEFS } from './data.js';
import { groundAt, walkY, rng, PATHS, ROAD_HALF, distToPath, SURFACE, BAZAAR } from './world.js';
import { makeDome, makeDrone, makeScooter, makeDesk, makeMonitorWall, dashboardTexture, makeCafe, makeAdBoard, screenMat } from './props.js';
import { makePerson, giveProp, animate } from './characters.js';
import { buildCreatures } from './creatures.js';
import { makePillar } from './pillars.js';
import { projectPlateTexture, metricTexture, signPlateTexture, FONT, fit, fitWrap, fillFit } from './type.js';
import { buildTraffic } from './traffic.js';
import { buildJaipur, makePol, cuspedArchPoints, makeBeliefSign, PINK as JAIPUR_PINK, OCHRE } from './jaipur.js';
import { ARENAS, P, faceTo, furnishArena, makeExhibitFrame, TOKENS } from './arena.js';
import { WHITE_METAL, BRUSHED, CHROME, GLASS, GOLD, WOOD, DARK, MOUND, WINDOW_GLOW, CONCRETE, solid, glow, mesh, canvasTexture, deepMerge, mergeStatic } from './materials.js';

// The player's position, shared so walking villagers can step aside.
export const playerPos = new THREE.Vector3(1e6, 0, 1e6);
const spV = new THREE.Vector3();
const _wp = new THREE.Vector3();

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

export class Walker {
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
    if (this.p.react && this.p.react.type !== 'wave') {
      animate(this.p, this.idle, t, 0);
      return;
    }
    if (this.wait > 0) {
      this.wait -= dt;
      animate(this.p, this.action === 'carry' ? 'carry' : this.idle, t, 0);
      return;
    }
    const [tx, tz] = this.points[this.idx];
    const dx = tx - root.position.x;
    const dz = tz - root.position.z;
    const d = Math.hypot(dx, dz);
    // wait politely if the player is standing right in the way
    root.getWorldPosition(_wp);
    const px = playerPos.x - _wp.x;
    const pz = playerPos.z - _wp.z;
    const pd = Math.hypot(px, pz);
    if (pd < 1.3 && Math.abs(playerPos.y - _wp.y) < 1.5 && Math.sin(root.rotation.y + root.parent.rotation.y) * px + Math.cos(root.rotation.y + root.parent.rotation.y) * pz > 0.2) {
      animate(this.p, this.action === 'walk' || this.action === 'carry' ? 'idle' : this.action, t, 0);
      return;
    }
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
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: metricTexture(value, label, color), transparent: true, depthWrite: false }));
  s.scale.set(2.9, 1.18, 1);
  return s;
}

// the old one-line title strip, kept for the few places that only have a name
function titleTexture(text, color) {
  return projectPlateTexture({ title: text }, color, 8);
}

function makeBillboard(slug, color, ctx, size = 1, { plainBack = false } = {}) {
  const p = PROJECTS[slug];
  const g = new THREE.Group();
  g.name = `billboard:${slug}`;
  const W = 4.6 * size;
  const H = 2.85 * size;
  const lift = 1.2 + size * 0.3;
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.22, lift, 0.16), WHITE_METAL, sx * (W / 2 - 0.4), lift / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(W + 0.3, H + 0.3, 0.2), WHITE_METAL, 0, lift + H / 2, 0));
  const img = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: coverTexture(p.images[0], W / H), toneMapped: false })
  );
  img.position.set(0, lift + H / 2, 0.105);
  // hamlet billboards face the plaza; their backs face the hamlet's buildings, so they stay plain
  const imgBack = plainBack ? new THREE.Mesh(img.geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.55), roughness: 0.7 })) : img.clone();
  imgBack.position.z = -0.105;
  imgBack.rotation.y = Math.PI;
  imgBack.userData = { slug, dynamic: true };
  g.add(imgBack);
  ctx.clickables.push(imgBack);
  img.userData.slug = slug;
  img.userData.dynamic = true;
  g.add(img);
  // the project's name plate under the picture: client and year, then the title, big
  const plateH = (W + 0.3) / 4.6;
  const title = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.3, plateH), new THREE.MeshBasicMaterial({ map: projectPlateTexture(p, color, 4.6), toneMapped: false }));
  title.position.set(0, lift - 0.04 - plateH / 2, 0.12);
  const titleBack = plainBack ? new THREE.Mesh(title.geometry, imgBack.material) : title.clone();
  titleBack.position.z = plainBack ? -0.11 : 0.11;
  titleBack.rotation.y = Math.PI;
  titleBack.userData = { slug, dynamic: true };
  g.add(titleBack);
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

// A wall of smaller posters, for departments with more work than billboard slots
function wallHeaderTexture(text, sub, color) {
  return canvasTexture(900, 700, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    const lines = text.split('\n');
    const size = Math.min(...lines.map((l) => fit(ctx, l, { weight: 800, size: 130, min: 50, maxW: w - 120 })));
    ctx.font = `800 ${size}px ${FONT.display}`;
    lines.forEach((line, k) => ctx.fillText(line, 60, 70 + k * size * 1.02));
    ctx.font = `500 40px ${FONT.sans}`;
    ctx.fillText(sub, 60, h - 100);
  });
}

function makeCampaignWall(slugs, color, ctx, header) {
  return named('campaign-wall', makeCampaignWallInner(slugs, color, ctx, header));
}
const named = (name, o) => ((o.name = name), o);
function makeCampaignWallInner(slugs, color, ctx, header) {
  const g = new THREE.Group();
  const cols = 3;
  const PW = 2.2;
  const PH = 1.72;
  const gap = 0.32;
  const rowH = PH + 0.62;
  const base = 0.85;
  const W = cols * PW + (cols + 1) * gap;
  const rows = Math.ceil((slugs.length + 1) / cols);
  const H = rows * rowH + gap;
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.24, base + H, 0.2), WHITE_METAL, sx * (W / 2 - 0.3), (base + H) / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(W, H, 0.18), WHITE_METAL, 0, base + H / 2, 0));
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.06), glow(color, 2.5));
  strip.position.set(0, base + H + 0.06, 0.08);
  g.add(strip);
  const cells = [{ header: true }, ...slugs.map((slug) => ({ slug }))];
  // the back faces away from the plaza, into the hamlet's buildings, so it stays a plain panel
  // in the department's colour (nothing on it to be covered); only the front carries the work
  const backMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.55), roughness: 0.7 });
  const both = (m, y, x, z) => {
    m.position.set(x, y, z);
    const back = new THREE.Mesh(m.geometry, backMat);
    back.position.set(x, y, -z);
    back.rotation.y = Math.PI;
    back.userData = { dynamic: true };
    g.add(m, back);
    return m;
  };
  cells.forEach((c, k) => {
    const col = k % cols;
    const row = Math.floor(k / cols);
    const x = -W / 2 + gap + PW / 2 + col * (PW + gap);
    const y = base + H - gap - row * rowH - PH / 2;
    if (c.header) {
      both(new THREE.Mesh(new THREE.PlaneGeometry(PW, PH + 0.42), new THREE.MeshBasicMaterial({ map: wallHeaderTexture(header.title, header.sub, color), toneMapped: false })), y - 0.21, x, 0.1);
      return;
    }
    const p = PROJECTS[c.slug];
    const img = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: coverTexture(p.images[0], PW / PH), toneMapped: false }));
    img.userData = { slug: c.slug, dynamic: true };
    const title = new THREE.Mesh(new THREE.PlaneGeometry(PW, PW / 4.4), new THREE.MeshBasicMaterial({ map: projectPlateTexture(p, color, 4.4), toneMapped: false }));
    title.userData = { slug: c.slug, dynamic: true };
    ctx.clickables.push(img, both(img, y, x, 0.1), title, both(title, y - PH / 2 - 0.03 - PW / 8.8, x, 0.1));
    const marker = new THREE.Object3D();
    marker.position.set(x + (row ? 0.6 : -0.6), 0, 1.6); // stagger so stacked posters each have a spot
    marker.userData.project = c.slug;
    g.add(marker);
  });
  for (const x of [-W / 3, 0, W / 3]) collider(g, W / 6 + 0.1, x, 0);
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
    fillFit(ctx, text, w / 2, 70, w - 80);
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
  // they only rise while you're in the plaza; from the road the hamlet stays quiet
  const centre = new THREE.Vector3();
  ctx.updaters.push({
    update: (t) => {
      g.getWorldPosition(centre);
      const here = Math.hypot(centre.x - playerPos.x, centre.z - playerPos.z) < 13;
      for (const f of list) {
        f.s.visible = here;
        if (!here) continue;
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
  g.position.set(h.x, h.y + SURFACE, h.z);
  g.rotation.y = Math.atan2(-Math.cos(h.angle), -Math.sin(h.angle)); // local +Z faces the centre
  scene.add(g);
  const U = ctx.updaters;
  let Q = g; // where person() puts people: the arena, or the landmark scene while building it
  const person = (action, x, z, rotY, extra = {}) => {
    const p = makePerson({ accent: h.color, seed: r(), ...extra });
    p.root.position.set(x, extra.y ?? 0, z);
    p.root.rotation.y = rotY;
    Q.add(p.root);
    U.push({ update: (t) => animate(p, action, t) });
    if (extra.npc !== false) ctx.npcs.push({ p, dept: h.id });
    return p;
  };
  const walker = (pts, opts = {}) => {
    const p = makePerson({ accent: h.color, seed: r() });
    U.push(new Walker(Q, p, pts, { offset: r(), ...opts }));
    ctx.npcs.push({ p, dept: h.id });
    return p;
  };
  const face = (x, z, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

  // The arena is laid out from its entry in ARENAS (src/arena.js): gateway, exhibits, landmark,
  // workspace, homes, people, planting and furniture.
  const C = ARENAS[h.id];
  const at = ([deg, r]) => P(deg, r);
  furnishArena(g, h, C, { collider });

  // homes on the quiet edge behind the plaza
  C.homes.forEach(([deg, r], k) => {
    const [x, z] = at([deg, r]);
    const hole = makeHobbitHole(k === 0 ? h.color : ['#2f6b3a', '#c9a23a', '#a8432f', '#3d5f9e'][Math.floor(r * 7) % 4], 0.95, rng(300 + i * 5 + k));
    hole.position.set(x, -0.25, z);
    hole.rotation.y = faceTo(x, z, 0, 0);
    g.add(hole);
  });

  // what I believe about working with this team, on a Jaipur signboard outside the gateway,
  // turned towards people walking up the spoke
  {
    const [x, z] = at(C.belief);
    const belief = makeBeliefSign(h, BELIEFS[h.id]);
    const bRot = faceTo(x, z, x * 0.3, 40);
    belief.position.set(x, 0, z);
    belief.rotation.y = bRot;
    g.add(belief);
    for (const d of [-1.71, 1.71]) collider(g, 0.35, x + Math.cos(bRot) * d, z - Math.sin(bRot) * d);
  }

  // Exhibits: the featured project in a carved frame where the entry sightline lands, the rest
  // along a short viewing route round the plaza edge, each turned to the people walking it
  const look = [0, 3.5];
  const exhibit = (slug, [deg, r], size, hero = false) => {
    const [x, z] = at([deg, r]);
    const b = makeBillboard(slug, h.color, ctx, size, { plainBack: true });
    const rot = faceTo(x, z, look[0], hero ? 12 : look[1]);
    b.position.set(x, hero ? 0.62 : 0, z);
    b.rotation.y = rot;
    b.userData.hero = hero;
    g.add(b);
    if (hero) {
      const W = 4.6 * size;
      const fr = makeExhibitFrame(W, 2.85 * size, 1.2 + size * 0.3 + 0.62, h.color, C.gate.stone === 'lime' ? 'blush' : C.gate.stone);
      fr.position.set(x, 0, z);
      fr.rotation.y = rot;
      g.add(fr);
      for (const sx of [-1, 1]) collider(g, 0.5, x + Math.cos(rot) * sx * (W / 2 + 0.55), z - Math.sin(rot) * sx * (W / 2 + 0.55));
    }
    const marker = new THREE.Object3D();
    marker.position.set(x * 0.72, 0, z * 0.72);
    marker.userData.project = slug;
    g.add(marker);
  };
  const [heroSlug, ...rest] = h.projects;
  exhibit(heroSlug, C.hero, TOKENS.hero, true);
  const onBoards = rest.slice(0, C.boards.length);
  onBoards.forEach((slug, k) => exhibit(slug, C.boards[k], TOKENS.board));
  const extra = rest.slice(C.boards.length);
  if (extra.length && C.wall) {
    // the rest of the department's work on a poster wall
    const [x, z] = at(C.wall);
    const wall = makeCampaignWall(extra, h.color, ctx, { title: h.wallTitle || 'More\nwork', sub: `${extra.length} more · press E` });
    wall.position.set(x, 0, z);
    wall.rotation.y = faceTo(x, z, 0, 0);
    g.add(wall);
  }

  // Department lead, with things to say, just inside the gate and off the walking line
  const lead = person('talk', C.lead[0], C.lead[1], faceTo(C.lead[0], C.lead[1], 0, 16), { top: h.color, npc: false });
  ctx.npcs.push({ p: lead, dept: h.id, lines: h.quotes, name: `${h.name} lead` });

  // A dome to one side, and a workspace (monitor wall and a desk) on the other.
  {
    const [x, z] = at(C.dome);
    const dome = makeDome(3.8, h.color);
    dome.position.set(x, 0, z);
    dome.rotation.y = faceTo(x, z, 0, 0);
    g.add(dome);
    collider(g, 4, x, z);
  }
  const dash = (k) => new THREE.MeshBasicMaterial({ map: dashboardTexture(h.name, h.color, PROJECTS[h.projects[k % h.projects.length]].metrics, i * 7 + k), toneMapped: false });
  const [wx, wz] = at(C.work.wall);
  const wall = makeMonitorWall([dash(0), dash(1), screenMat(PROJECTS[h.projects[0]].images[0], 2.4 / 1.35)], h.color, 3);
  wall.position.set(wx, 0, wz);
  wall.rotation.y = faceTo(wx, wz, 0, 0);
  wall.scale.setScalar(0.9);
  g.add(wall);
  collider(g, 2.2, wx, wz);
  const [dx, dz] = at(C.work.desk);
  const desk = makeDesk([dash(2), screenMat(PROJECTS[h.projects[1 % h.projects.length]].images[0], 0.92 / 0.52)], h.color);
  desk.position.set(dx, 0, dz);
  desk.rotation.y = faceTo(dx, dz, wx, wz) + Math.PI;
  g.add(desk);
  collider(g, 1.2, dx, dz);
  const typer = makePerson({ accent: h.color, seed: r() });
  typer.root.position.set(0, 0, 0.75);
  typer.root.rotation.y = Math.PI;
  desk.add(typer.root);
  U.push({ update: (t) => animate(typer, 'type', t) });
  ctx.npcs.push({ p: typer, dept: h.id });

  // the department's own scene (its sculpture and the people at work round it) is anchored where
  // the config puts it
  const L = new THREE.Group();
  L.position.set(C.landmark[0], 0, C.landmark[1]);
  L.rotation.y = C.landmark[2] || 0;
  g.add(L);
  Q = L;

  switch (h.activity) {
    case 'arena': {
      // A cricket pitch where founders are being filmed for the T20 spots.
      L.add(mesh(new THREE.BoxGeometry(2.2, 0.04, 9), solid('#d8c79a'), 0, 0.02, -0.5, false));
      for (const z of [-4.5, 3.5]) for (const x of [-0.18, 0, 0.18]) L.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), solid('#f3ead0'), x, 0.38, z));
      person('cheer', 0, -3, 0, { top: '#1a4fd6', pants: '#1a4fd6', beard: true });
      const cam = person('camera', 2.6, 0.5, face(2.6, 0.5, 0, -3));
      giveProp(cam, 'camera');
      person('point', -2.6, 1, face(-2.6, 1, 0, -3));
      person('talk', -3.4, -1.2, face(-3.4, -1.2, 0, -3), {});
      // floodlight masts at the back corners of the pitch, clear of the ring road
      for (const sx of [-1, 1]) {
        const x = sx * 7.2;
        const mz = -4.5;
        L.add(mesh(new THREE.CylinderGeometry(0.18, 0.28, 11, 10), WHITE_METAL, x, 5.5, mz));
        const panel = mesh(new THREE.BoxGeometry(2.2, 1.3, 0.3), WHITE_METAL, x, 11.2, mz);
        panel.rotation.y = face(x, mz);
        L.add(panel);
        const lights = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.0), glow('#ffffff', 4));
        lights.position.set(x - Math.sin(face(x, mz)) * 0.17, 11.2, mz - Math.cos(face(x, mz)) * 0.17);
        lights.rotation.y = face(x, mz) + Math.PI;
        L.add(lights);
        collider(L, 0.5, x, mz);
      }
      giveProp(walker([[-6, 5.5], [6, 5.5]], { action: 'carry', pause: 1.5 }), 'parcel', '#e9d5a6');
      break;
    }
    case 'launch': {
      // Globe sculpture: international payments, everywhere.
      const globe = new THREE.Group();
      // centrepieces stand at the back of the plaza, between and behind the two rear billboards,
      // so they frame the work instead of standing in front of it
      globe.position.set(0, 4.2, -12);
      globe.add(mesh(new THREE.SphereGeometry(1.5, 32, 20), glow(h.color, 0.6)));
      for (let k = 0; k < 4; k++) {
        const ring = mesh(new THREE.TorusGeometry(2.1, 0.07, 8, 64), CHROME);
        ring.rotation.y = (k * Math.PI) / 4;
        globe.add(ring);
      }
      const eq = mesh(new THREE.TorusGeometry(2.3, 0.09, 8, 64), WHITE_METAL);
      eq.rotation.x = Math.PI / 2;
      globe.add(eq);
      L.add(globe);
      L.add(mesh(new THREE.CylinderGeometry(0.9, 1.3, 2.2, 24), WHITE_METAL, 0, 1.1, -12));
      collider(L, 1.6, 0, -12);
      const deskX = -7;
      L.add(mesh(new THREE.BoxGeometry(1.6, 0.08, 0.8), WHITE_METAL, deskX, 1.05, -1.5));
      L.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.05, 8), BRUSHED, deskX, 0.52, -1.5));
      const lap = mesh(new THREE.BoxGeometry(0.5, 0.32, 0.02), DARK, deskX, 1.27, -1.4);
      lap.rotation.x = -0.25;
      L.add(lap);
      collider(L, 0.9, deskX, -1.5);
      person('type', deskX, -2.15, 0);
      person('present', -1.8, -1.2, face(-1.8, -1.2, 0, 6));
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
        // the skirt at the envelope's mouth, a burner, and ropes down to the basket corners
        const skirt = mesh(new THREE.CylinderGeometry(0.75, 0.45, 0.5, 16, 1, true), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, side: THREE.DoubleSide }), 0, -2.45, 0);
        b.add(skirt, mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 10), DARK, 0, -2.75, 0));
        const top = new THREE.Vector3();
        const bot = new THREE.Vector3();
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          top.set(sx * 0.33, -2.45, sz * 0.33);
          bot.set(sx * 0.42, -3.1, sz * 0.42);
          const len = top.distanceTo(bot);
          const rope = mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 4), DARK, (top.x + bot.x) / 2, (top.y + bot.y) / 2, (top.z + bot.z) / 2, false);
          rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
          b.add(rope);
        }
        b.position.set(x, y, z);
        L.add(b);
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
      for (const [x, y, z, s] of [[-8, 7, -11.5, 1], [8, 7.5, -11.5, 1.1], [0, 9.5, -13, 1.3]]) {
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
        L.add(isle);
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
      L.add(ringG);
      collider(L, 3.2, 0, 2);
      const b1 = makePerson({ seed: r(), style: 'streetwear', top: '#c0392b', outer: null, accessory: 'none', noBag: true, fem: false });
      const b2 = makePerson({ seed: r(), style: 'streetwear', top: '#1a4fd6', outer: null, accessory: 'none', noBag: true, fem: false });
      giveProp(b1, 'glove', '#c0392b');
      giveProp(b2, 'glove', '#1a4fd6');
      b1.root.position.set(-0.7, 0.62, 2);
      b2.root.position.set(0.7, 0.62, 2);
      b1.root.rotation.y = Math.PI / 2;
      b2.root.rotation.y = -Math.PI / 2;
      b2.phase += 0.35;
      L.add(b1.root, b2.root);
      U.push({ update: (t) => (animate(b1, 'box', t), animate(b2, 'box', t)) });
      ctx.npcs.push({ p: b1, dept: h.id }, { p: b2, dept: h.id });
      person('cheer', -3.6, 4.6, face(-3.6, 4.6, 0, 2));
      person('cheer', 3.6, 4.8, face(3.6, 4.8, 0, 2));
      U.push({ update: (t) => isles.forEach(({ isle, y, ph }) => (isle.position.y = y + Math.sin(t * 0.7 + ph) * 0.5)) });
      break;
    }
    case 'beacon': {
      const tower = new THREE.Group();
      tower.position.set(0, 0, -12);
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
      L.add(tower);
      collider(L, 2, 0, -12);
      // Ring light and creators filming reels
      const rl = new THREE.Group();
      rl.position.set(4.2, 0, 2.2);
      rl.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), DARK, 0, 0.8, 0));
      const ringLight = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 32), glow('#ffffff', 3));
      ringLight.position.y = 1.75;
      rl.add(ringLight);
      rl.rotation.y = face(4.2, 2.2, 2.6, 4.4);
      L.add(rl);
      const creator = person('phone', 2.6, 4.4, face(2.6, 4.4, 4.2, 2.2), { longHair: true });
      giveProp(creator, 'phone');
      const c2 = person('phone', -3, 1.5, face(-3, 1.5, 0, -12));
      giveProp(c2, 'phone');
      person('wave', -1.5, 4, Math.PI * 0.1);
      person('cheer', 1.6, -0.6, face(1.6, -0.6, -3, 1.5));
      floaters(L, ctx, [
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
      L.add(mesh(new THREE.BoxGeometry(5, 0.5, 3), WHITE_METAL, 0, 0.25, -12));
      L.add(mesh(new THREE.BoxGeometry(4.4, 1.4, 0.6), WHITE_METAL, 0, 1.2, -10.9));
      L.add(mesh(new THREE.BoxGeometry(4.5, 0.1, 0.9), WOOD, 0, 1.95, -11));
      const crest = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), glow(h.color, 1.5));
      crest.position.set(0, 1.2, -10.58);
      L.add(crest);
      collider(L, 2.6, 0, -11.5);
      const judge = person('gavel', 0, -11.9, 0, { y: 0.5, top: '#1b1f2a', beard: true });
      giveProp(judge, 'gavel');
      // counsel at their lecterns, low and to either side so the billboards behind stay clear
      for (const sx of [-1, 1]) {
        L.add(mesh(new THREE.BoxGeometry(1, 1.1, 0.8), WHITE_METAL, sx * 2.2, 0.55, -6.5));
        collider(L, 0.7, sx * 2.2, -6.5);
        person('talk', sx * 2.2, -5.6, Math.PI);
      }
      for (const sx of [-1, 1]) {
        const x = sx * 6.3;
        const dz = -2.6;
        L.add(mesh(new THREE.BoxGeometry(1.5, 0.08, 0.8), WOOD, x, 0.85, dz));
        for (const lx of [-0.65, 0.65]) L.add(mesh(new THREE.BoxGeometry(0.06, 0.85, 0.7), BRUSHED, x + lx, 0.42, dz));
        L.add(mesh(new THREE.BoxGeometry(0.45, 0.04, 0.6), solid('#fbfaf5'), x, 0.92, dz));
        collider(L, 0.9, x, dz);
        person('write', x, dz - 0.9, 0);
      }
      floaters(L, ctx, [
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
        ['prod-1', -5.6, -5.4],
        ['social-flow', 5.6, -5.4],
      ];
      for (const [img, x, z] of tools) {
        const k = new THREE.Group();
        k.position.set(x, 0, z);
        k.rotation.y = face(x, z, 0, z);
        k.add(mesh(new THREE.BoxGeometry(1.8, 0.08, 0.9), WHITE_METAL, 0, 1.05, 0));
        k.add(mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), BRUSHED, 0, 0.52, 0));
        k.add(mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), DARK, 0, 1.75, -0.32));
        // monitor stand and foot, and a base plate for the pedestal
        k.add(mesh(new THREE.BoxGeometry(0.1, 0.18, 0.06), BRUSHED, 0, 1.17, -0.32));
        k.add(mesh(new THREE.BoxGeometry(0.4, 0.02, 0.24), BRUSHED, 0, 1.1, -0.28));
        k.add(mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.05, 16), BRUSHED, 0, 0.025, 0));
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: coverTexture(`work/${img}.jpg`, 1.5 / 0.9), toneMapped: false }));
        screen.position.set(0, 1.75, -0.285);
        k.add(screen);
        const screenBack = screen.clone();
        screenBack.position.z = -0.355;
        screenBack.rotation.y = Math.PI;
        k.add(screenBack);
        L.add(k);
        collider(L, 1, x, z);
        const designer = makePerson({ accent: h.color, seed: r() });
        designer.root.position.set(0, 0, 0.85);
        designer.root.rotation.y = Math.PI;
        k.add(designer.root);
        U.push({ update: (t) => animate(designer, 'type', t) });
        ctx.npcs.push({ p: designer, dept: h.id });
      }
      // Colour wheel sculpture
      const wheel = new THREE.Group();
      wheel.position.set(0, 4, -12);
      for (let k = 0; k < 16; k++) {
        const seg = new THREE.Mesh(
          new THREE.CircleGeometry(2, 6, (k / 16) * Math.PI * 2, (Math.PI * 2) / 16),
          new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHSL(k / 16, 0.75, 0.55), side: THREE.DoubleSide, clearcoat: 1, roughness: 0.3 })
        );
        wheel.add(seg);
      }
      wheel.add(mesh(new THREE.TorusGeometry(2.05, 0.12, 10, 48), CHROME));
      L.add(wheel);
      L.add(mesh(new THREE.CylinderGeometry(0.15, 0.3, 4, 12), WHITE_METAL, 0, 2, -12.2));
      collider(L, 0.6, 0, -12.2);
      // Cinema camera on a tripod, aimed at a product
      L.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.9, 24), WHITE_METAL, 1.5, 0.45, -2.5));
      L.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), solid(h.color), 1.5, 1.05, -2.5));
      collider(L, 0.8, 1.5, -2.5);
      const tri = new THREE.Group();
      tri.position.set(-1.5, 0, -0.5);
      for (let k = 0; k < 3; k++) {
        const leg = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6), DARK, Math.cos(k * 2.1) * 0.3, 0.7, Math.sin(k * 2.1) * 0.3);
        leg.rotation.set(Math.sin(k * 2.1) * 0.35, 0, -Math.cos(k * 2.1) * 0.35);
        tri.add(leg);
      }
      tri.add(mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), DARK, 0, 1.55, 0));
      tri.rotation.y = face(-1.5, -0.5, 1.5, -2.5);
      L.add(tri);
      person('present', -2.2, 1.6, face(-2.2, 1.6, 1.5, -2.5));
      U.push({ update: (t) => (wheel.rotation.z = t * 0.25) });
      break;
    }
  }
  Q = g;
  walker(C.walk, { pause: 2.5 });
  deepMerge(g);
}

// ---------- The Night Lab by the pond ----------

function buildLab(scene, ctx) {
  const g = new THREE.Group();
  g.position.set(LAB.x, LAB.y + SURFACE, LAB.z);
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
  ctx.npcs.push({ p: artist, dept: 'lab', lines: LAB.quotes, name: 'The artist' });
  // the lab's sign stands by the path in (which arrives behind the pavilion), clear of the billboards
  const labSign = makeBeliefSign(LAB, BELIEFS.lab);
  const lRot = -2.3;
  labSign.position.set(-9.4, 0, 1.2);
  labSign.rotation.y = lRot;
  g.add(labSign);
  for (const d of [-1.71, 1.71]) collider(g, 0.35, -9.4 + Math.cos(lRot) * d, 1.2 - Math.sin(lRot) * d);
  deepMerge(g);
}

// ---------- Centre: the jamun tree, HQ hall, the five pillars ----------

// A jamun tree, like the one at Vibhor's childhood home: grey-brown bark, spreading limbs,
// a dense glossy dark-green crown, purple-black fruit, and fallen jamuns staining the ground.
function barkTexture() {
  const t = canvasTexture(128, 256, (c, w, h) => {
    c.fillStyle = '#6a5a4c';
    c.fillRect(0, 0, w, h);
    for (let k = 0; k < 70; k++) {
      c.fillStyle = k % 3 ? 'rgba(40,30,22,0.35)' : 'rgba(170,155,135,0.25)';
      const x = (k * 37) % w;
      c.fillRect(x, (k * 53) % h, 2 + (k % 3), 30 + (k % 5) * 18);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}
function buildJamun(g, r) {
  const bark = new THREE.MeshStandardMaterial({ map: barkTexture(), roughness: 0.95 });
  const tree = new THREE.Group();
  g.add(tree);
  // trunk with flared roots
  const trunk = mesh(new THREE.CylinderGeometry(0.72, 1.15, 5.6, 14), bark, 0, 2.8, 0);
  trunk.rotation.z = 0.04;
  tree.add(trunk);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    const root = mesh(new THREE.CylinderGeometry(0.12, 0.42, 1.9, 7), bark, Math.cos(a) * 1.05, 0.35, Math.sin(a) * 1.05);
    root.rotation.set(Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15);
    tree.add(root);
  }
  // spreading limbs, each ending in a clump of the crown
  const greens = ['#2c5a2a', '#356b2f', '#264f27', '#3f7a34', '#2f6330'];
  const leafMats = greens.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.05, flatShading: true }));
  const crownPts = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + r() * 0.4;
    const len = 3.4 + r() * 1.4;
    const tilt = 0.75 + r() * 0.25;
    const base = new THREE.Vector3(0, 4.4 + r() * 1.2, 0);
    const dir = new THREE.Vector3(Math.cos(a) * Math.sin(tilt), Math.cos(tilt), Math.sin(a) * Math.sin(tilt));
    const end = base.clone().addScaledVector(dir, len);
    const limb = mesh(new THREE.CylinderGeometry(0.16, 0.36, len, 8), bark, 0, 0, 0);
    limb.position.copy(base).add(end).multiplyScalar(0.5);
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    tree.add(limb);
    crownPts.push(end);
  }
  // the dense crown: a broad dome of overlapping clumps
  for (let k = 0; k < 26; k++) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 5.6;
    const y = 9.2 + (1 - (rr / 5.6) ** 2) * 2.6 + (r() - 0.5) * 0.8;
    const clump = mesh(new THREE.IcosahedronGeometry(2.0 + r() * 1.2, 1), leafMats[k % leafMats.length], Math.cos(a) * rr, y, Math.sin(a) * rr);
    clump.scale.y = 0.78;
    tree.add(clump);
  }
  for (const p of crownPts) tree.add(mesh(new THREE.IcosahedronGeometry(1.9 + r() * 0.6, 1), leafMats[Math.floor(r() * leafMats.length)], p.x, p.y + 0.8, p.z));
  // jamun fruit: glossy purple-black, in clusters on the outside of the crown
  const fruitGeo = new THREE.SphereGeometry(0.11, 8, 6);
  fruitGeo.scale(1, 1.25, 1);
  const fruitMat = new THREE.MeshPhysicalMaterial({ color: '#3a1846', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
  const fruits = new THREE.InstancedMesh(fruitGeo, fruitMat, 420);
  const m4 = new THREE.Matrix4();
  const v = new THREE.Vector3();
  let n = 0;
  for (let c = 0; c < 60 && n < 420; c++) {
    const a = r() * Math.PI * 2;
    const rr = 3.2 + r() * 3.4;
    const y = 8.0 + (1 - (Math.min(rr, 6) / 6) ** 2) * 3.4 + r() * 0.6;
    const cx = Math.cos(a) * rr;
    const cz = Math.sin(a) * rr;
    for (let k = 0; k < 7 && n < 420; k++) {
      v.set(cx + (r() - 0.5) * 0.45, y - r() * 0.35, cz + (r() - 0.5) * 0.45);
      m4.makeTranslation(v.x, v.y, v.z);
      fruits.setMatrixAt(n++, m4);
    }
  }
  fruits.count = n;
  fruits.castShadow = true;
  tree.add(fruits);
  // fallen jamuns and their purple stains under the tree
  const fallen = new THREE.InstancedMesh(fruitGeo, fruitMat, 50);
  const stain = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 12), new THREE.MeshStandardMaterial({ color: '#6b3a70', roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }), 24);
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  for (let k = 0; k < 50; k++) {
    const a = r() * Math.PI * 2;
    const rr = 1.8 + r() * 5.2;
    m4.compose(v.set(Math.cos(a) * rr, 0.09, Math.sin(a) * rr), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2), new THREE.Vector3(1, 1, 1));
    fallen.setMatrixAt(k, m4);
  }
  for (let k = 0; k < 24; k++) {
    const a = r() * Math.PI * 2;
    const rr = 1.8 + r() * 5;
    const sc = 0.12 + r() * 0.28;
    m4.compose(v.set(Math.cos(a) * rr, 0.035, Math.sin(a) * rr), q, new THREE.Vector3(sc, sc * (0.7 + r() * 0.5), 1));
    stain.setMatrixAt(k, m4);
  }
  tree.add(fallen, stain);
  // a small wooden sign by the trunk
  const sign = new THREE.Group();
  sign.position.set(0, 0, 2.6);
  sign.add(mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), WOOD, 0, 0.5, 0));
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.55),
    new THREE.MeshBasicMaterial({
      toneMapped: false,
      side: THREE.DoubleSide,
      map: canvasTexture(480, 176, (c, w, h) => {
        c.fillStyle = '#7a5a3c';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#5a3f28';
        c.lineWidth = 8;
        c.strokeRect(4, 4, w - 8, h - 8);
        c.fillStyle = '#fff3dc';
        c.font = '800 54px "Bricolage Grotesque", Inter, sans-serif';
        c.fillText('Jamun tree', 28, 78);
        c.font = '500 26px Inter, sans-serif';
        c.fillText('from my childhood home', 30, 128);
      }),
    })
  );
  board.position.y = 1.15;
  board.userData.dynamic = true;
  sign.add(board);
  const info = new THREE.Object3D();
  info.position.set(0, 0, 3.4);
  info.userData.interact = { kind: 'toast', label: 'The jamun tree', verb: 'Read', text: '<b>🌳 The jamun tree.</b> A jamun like the one at Vibhor’s childhood home. Every road on the island starts under its branches.' };
  sign.add(info);
  g.add(sign);
}


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
  const y0 = groundAt(0, 0) + SURFACE;
  const g = new THREE.Group();
  g.position.y = y0;
  scene.add(g);

  buildJamun(g, r);
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
  hall.position.set(hx, groundAt(hx, hz) - y0 - 0.6, hz);
  hall.rotation.y = Math.atan2(-hx, -hz);
  g.add(hall);

  ctx.stones = [];
  const pillarAnim = [];
  PILLARS.forEach((p, k) => {
    const a = THREE.MathUtils.degToRad(-120 + 36 + k * 72);
    const x = Math.cos(a) * 9.8;
    const z = Math.sin(a) * 9.8;
    const s = makePillar(p, pillarAnim);
    s.position.set(x, groundAt(x, z) - y0 - 0.05, z);
    s.rotation.y = Math.atan2(x, z); // plaque faces out, toward the roads
    g.add(s);
    collider(g, 1.4, x, z);
    ctx.stones.push({ pillar: p, x, z });
  });

  const mix = HAMLETS.map((h) => h.color);
  [[3.6, 3.2], [-3.9, 2.4], [2.4, -4.1], [-2.8, -4.2], [5.2, -0.6]].forEach(([x, z], k) => {
    const p = makePerson({ accent: mix[k % mix.length], seed: r() });
    p.root.position.set(x, 0, z);
    p.root.rotation.y = Math.atan2(-x, -z) + 0.6;
    g.add(p.root);
    const act = ['talk', 'cheer', 'talk', 'point', 'talk'][k];
    ctx.updaters.push({ update: (t) => animate(p, act, t) });
    ctx.npcs.push(k === 0 ? { p, dept: 'hq', lines: CENTER.quotes, name: 'Studio host' } : { p, dept: 'hq' });
  });
  // under the jamun tree, by the road you arrive on
  {
    const a = THREE.MathUtils.degToRad(102.4);
    const x = Math.cos(a) * 21;
    const z = Math.sin(a) * 21;
    const hqSign = makeBeliefSign(CENTER, BELIEFS.hq);
    const rot = Math.atan2(0 - x, 30 - z);
    hqSign.position.set(x, groundAt(x, z) - y0, z);
    hqSign.rotation.y = rot;
    g.add(hqSign);
    for (const d of [-1.71, 1.71]) collider(g, 0.35, x + Math.cos(rot) * d, z - Math.sin(rot) * d);
  }
  deepMerge(g);
  ctx.updaters.push({
    update: (t) => {
      halo.rotation.z = t * 0.05;
      halo.position.y = 7.2 + Math.sin(t * 0.8) * 0.25;
      haloGlow.position.y = halo.position.y - 0.2;
      for (const f of pillarAnim) f(t);
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
    new THREE.MeshBasicMaterial({ color: '#ffd84a', transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  beam.position.y = 30;
  return { g, beam };
}

function buildTrophies(scene, ctx) {
  const spots = [
    [HAMLETS[0].angle + Math.PI / 6, 118],
    [HAMLETS[2].angle + Math.PI / 6, 122],
    [HAMLETS[3].angle + Math.PI / 6, 126],
    [HAMLETS[4].angle + Math.PI / 6, 120],
  ];
  ctx.trophies = AWARDS.map((award, k) => {
    const [a, d] = spots[k];
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const y = groundAt(x, z);
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

function ringRoute() {
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
  return ring;
}

function buildCouriers(scene, ctx) {
  const r = rng(77);
  HAMLETS.forEach((h) => {
    const ca = Math.cos(h.angle);
    const sa = Math.sin(h.angle);
    const p = makePerson({ accent: h.color, seed: r(), top: h.color });
    giveProp(p, 'parcel', '#e9d5a6');
    ctx.npcs.push({ p, dept: h.id });
    ctx.updaters.push(
      new Walker(scene, p, [[ca * 11 + sa * 1.2, sa * 11 - ca * 1.2], [h.x - ca * 15 + sa * 1.2, h.z - sa * 15 - ca * 1.2]], {
        action: 'carry',
        speed: 2.1,
        pause: 3,
        heightFn: walkY,
        offset: r() * 4,
      })
    );
  });
  const ring = ringRoute();
  for (let k = 0; k < 3; k++) {
    const p = makePerson({ accent: HAMLETS[k * 2].color, seed: r() });
    const w = new Walker(scene, p, ring, { loop: true, speed: 2.4, pause: 0.4, heightFn: walkY, idle: 'wave' });
    w.idx = (k * 6 + 1) % ring.length;
    const [x, z] = ring[k * 6];
    p.root.position.set(x, groundAt(x, z), z);
    ctx.updaters.push(w);
    ctx.npcs.push({ p, dept: 'hq' });
  }
}

// ---------- Vibhor's home: Jaipur pink house, mailbox, trophy cabinet ----------

const PINK = new THREE.MeshStandardMaterial({ color: '#e48b78', roughness: 0.85 });
const CREAM = new THREE.MeshStandardMaterial({ color: '#f6e6d2', roughness: 0.7 });

function archWindow(w, h, mat) {
  // cusped, like the arches of the pink city
  const pts = cuspedArchPoints(w / 2, h - 0.61 * w, 5, 0.14);
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) s.lineTo(x, y);
  s.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(s), mat);
}

function textPanel(lines, color, w = 512, h = 640) {
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, 14);
    let y = 90;
    for (const [text, size, weight, col] of lines) {
      ctx.fillStyle = col || '#0f172a';
      ctx.font = `${weight || 600} ${size}px ${size > 40 ? '"Bricolage Grotesque", ' : ''}Inter, sans-serif`;
      // simple word wrap
      const words = text.split(' ');
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > w - 70 && line) {
          ctx.fillText(line, 36, y);
          y += size * 1.25;
          line = word;
        } else line = test;
      }
      ctx.fillText(line, 36, y);
      y += size * 1.25 + 18;
    }
  });
}

function standingPanel(tex, action) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2.1, 2.7, 0.12), WHITE_METAL, 0, 1.75, -0.08));
  for (const x of [-0.8, 0.8]) g.add(mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), BRUSHED, x, 0.25, -0.08));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 2.55), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  face.position.set(0, 1.75, 0.0);
  face.userData.action = action;
  face.userData.dynamic = true;
  g.add(face);
  return { g, face };
}

function buildHome(scene, ctx) {
  const H = HOME;
  const r = rng(404);
  const g = new THREE.Group();
  g.position.set(H.x, H.y + SURFACE, H.z);
  g.rotation.y = H.facing; // the front faces where its lane arrives
  scene.add(g);
  const face = (x, z, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

  // Main house: two storeys of Jaipur pink with cream jharokha windows.
  g.add(mesh(new THREE.BoxGeometry(13, 7, 7), PINK, 0, 3.5, -7));
  g.add(mesh(new THREE.BoxGeometry(13.6, 0.4, 7.6), CREAM, 0, 7.2, -7));
  g.add(mesh(new THREE.BoxGeometry(13.4, 0.3, 7.4), CREAM, 0, 3.6, -7));
  for (let k = 0; k < 13; k++) g.add(mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), CREAM, -6.3 + k * 1.05, 7.7, -3.6));
  // jharokhas upstairs
  for (const x of [-4.2, 0, 4.2]) {
    g.add(mesh(new THREE.BoxGeometry(2.2, 2.2, 0.9), CREAM, x, 5.4, -3.2));
    const win = archWindow(1.3, 1.7, WINDOW_GLOW);
    win.position.set(x, 4.45, -2.74);
    g.add(win);
    const cap = mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), CREAM, x, 6.5, -3.2);
    cap.scale.set(1.2, 0.7, 0.6);
    g.add(cap);
  }
  // arched doorway and ground floor windows
  const doorFrame = archWindow(3, 3.6, CREAM);
  doorFrame.position.set(0, 0, -3.48);
  g.add(doorFrame);
  const door = archWindow(2.4, 3.2, new THREE.MeshPhysicalMaterial({ color: '#2f6b3a', roughness: 0.35, clearcoat: 1 }));
  door.position.set(0, 0, -3.46);
  g.add(door);
  g.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), GOLD, 0.6, 1.6, -3.4));
  for (const x of [-4.2, 4.2]) {
    const w = archWindow(1.5, 2, WINDOW_GLOW);
    w.position.set(x, 0.9, -3.47);
    g.add(w);
  }
  // the back and the two sides are finished too: arched windows on both floors with cream sills,
  // and cream pilasters at the corners
  const sideWin = (x, y, z, ry, w, h) => {
    const win = archWindow(w, h, WINDOW_GLOW);
    win.position.set(x, y, z);
    win.rotation.y = ry;
    g.add(win);
    const sill = mesh(new THREE.BoxGeometry(w + 0.4, 0.14, 0.3), CREAM, 0, y - 0.07, 0, false);
    sill.position.set(x + Math.sin(ry) * 0.12, y - 0.07, z + Math.cos(ry) * 0.12);
    sill.rotation.y = ry;
    g.add(sill);
  };
  for (const x of [-4.2, 0, 4.2]) {
    sideWin(x, 0.9, -10.52, Math.PI, 1.5, 2);
    sideWin(x, 4.45, -10.52, Math.PI, 1.3, 1.7);
  }
  for (const sx of [-1, 1])
    for (const z of [-5.3, -8.7]) {
      sideWin(sx * 6.52, 0.9, z, (sx * Math.PI) / 2, 1.3, 2);
      sideWin(sx * 6.52, 4.45, z, (sx * Math.PI) / 2, 1.2, 1.7);
    }
  for (const sx of [-1, 1]) for (const z of [-3.5, -10.5]) g.add(mesh(new THREE.BoxGeometry(0.55, 7, 0.55), CREAM, sx * 6.5, 3.5, z));

  // rooftop: a modern white dome between two chhatris
  const top = makeDome(2.6, H.color);
  top.position.set(0, 7.4, -8);
  g.add(top);
  for (const x of [-5.5, 5.5]) {
    for (const [cx, cz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), CREAM, x + cx, 8.1, -5 + cz));
    g.add(mesh(new THREE.BoxGeometry(1.7, 0.18, 1.7), CREAM, x, 8.85, -5));
    const chh = mesh(new THREE.SphereGeometry(0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), PINK, x, 8.9, -5);
    chh.scale.y = 1.15;
    g.add(chh);
  }
  collider(g, 4.6, -4.2, -7);
  collider(g, 4.6, 4.2, -7);
  collider(g, 3.5, 0, -8.5);

  // Glass greenhouse dome
  const green = makeDome(3, H.color, { glass: true });
  green.position.set(9, 0, -4);
  g.add(green);
  for (let k = 0; k < 6; k++) g.add(mesh(new THREE.IcosahedronGeometry(0.5 + r() * 0.4, 1), solid('#4f9a33', { flatShading: true }), 9 + (r() - 0.5) * 3, 0.6, -4 + (r() - 0.5) * 3));
  collider(g, 3.2, 9, -4);

  // Front garden, gate and mailbox
  for (const x of [-3.3, 3.3]) {
    g.add(mesh(new THREE.BoxGeometry(0.8, 2.6, 0.8), PINK, x, 1.3, 9.5));
    g.add(mesh(new THREE.BoxGeometry(1, 0.25, 1), CREAM, x, 2.7, 9.5));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), glow('#fff1c9', 2)).translateX(x).translateY(3.05).translateZ(9.5));
    collider(g, 0.6, x, 9.5);
  }
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.9, 0.6), PINK, sx * (4.4 + k * 1.15), 0.45, 9.5));
      collider(g, 0.55, sx * (4.4 + k * 1.15), 9.5);
    }
  }
  const box = new THREE.Group();
  box.position.set(4.8, 0, 7.6);
  box.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), WHITE_METAL, 0, 0.6, 0));
  const mb = mesh(new THREE.BoxGeometry(0.55, 0.45, 0.7), solid('#d64545'), 0, 1.4, 0);
  mb.userData.action = { kind: 'contact' };
  mb.userData.dynamic = true;
  box.add(mb);
  box.add(mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), solid('#ffd84a'), 0.3, 1.6, 0.1));
  g.add(box);
  collider(g, 0.4, 4.8, 7.6);
  ctx.clickables.push(mb);
  const mbMarker = new THREE.Object3D();
  mbMarker.position.set(4.8, 0, 7.6);
  mbMarker.userData.interact = { kind: 'contact', label: 'Write to Vibhor', verb: 'Open mailbox' };
  g.add(mbMarker);

  // Garden beds
  const flowers = ['#ff8fb1', '#ffd84a', '#b18cf0', '#ffffff'];
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(3.4, 0.35, 1.4), CREAM, sx * 6.5, 0.18, 5.5));
    collider(g, 0.8, sx * 5.6, 5.5);
    collider(g, 0.8, sx * 7.4, 5.5);
    for (let k = 0; k < 10; k++) g.add(mesh(new THREE.IcosahedronGeometry(0.18, 0), solid(flowers[k % 4]), sx * 6.5 + (r() - 0.5) * 3, 0.5, 5.5 + (r() - 0.5) * 1.1));
  }

  // The front door leads inside
  const doorMarker = new THREE.Object3D();
  doorMarker.position.set(0, 0, -2.0);
  doorMarker.userData.interact = { kind: 'enter', room: 'home', label: 'Vibhor’s Home', verb: 'Go inside' };
  g.add(doorMarker);
  door.userData.action = { kind: 'enter', room: 'home' };
  door.userData.dynamic = true;
  ctx.clickables.push(door);
  const welcome = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.5),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(1024, 196, (c, w, h) => {
        c.fillStyle = '#f6e6d2';
        c.fillRect(0, 0, w, h);
        c.fillStyle = '#7a3b2e';
        c.font = '700 96px "Bricolage Grotesque", Inter, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('Welcome · Swagat', w / 2, h / 2 + 6);
      }),
      toneMapped: false,
    })
  );
  welcome.position.set(0, 3.95, -3.4);
  welcome.userData.dynamic = true;
  g.add(welcome);

  // A visitor reading the panels and one waiting by the mailbox
  const v1 = makePerson({ accent: H.color, seed: r() });
  v1.root.position.set(-6.2, 0, 2);
  v1.root.rotation.y = face(-6.2, 2, 0, -3);
  g.add(v1.root);
  const v2 = makePerson({ accent: H.color, seed: r(), longHair: true });
  v2.root.position.set(3.6, 0, 8.6);
  v2.root.rotation.y = face(3.6, 8.6, 4.8, 7.6);
  g.add(v2.root);
  ctx.updaters.push({ update: (t) => (animate(v1, 'think', t), animate(v2, 'idle', t)) });
  ctx.npcs.push({ p: v1, dept: 'home' }, { p: v2, dept: 'home', lines: H.quotes, name: 'Neighbour' });

  deepMerge(g);
  // what I believe, on a Jaipur signboard in the front yard
  const homeSign = makeBeliefSign(H, BELIEFS.home);
  homeSign.position.set(-5.2, 0, 4.2);
  homeSign.rotation.y = 0.4;
  g.add(homeSign);
  collider(g, 0.35, -6.8, 3.6);
  collider(g, 0.35, -3.6, 4.8);
}

// ---------- The Playhouse: films, stop motion, found objects, arcade ----------

function posterTexture(item, color, kind) {
  return canvasTexture(400, 600, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = '#ffd84a';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText(kind.toUpperCase(), 40, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 54px "Bricolage Grotesque", Inter, sans-serif';
    const words = item.title.split(' ');
    let y = 300;
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > w - 80 && line) {
        ctx.fillText(line, 40, y);
        y += 60;
        line = word;
      } else line = test;
    }
    ctx.fillText(line, 40, y);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '500 26px Inter, sans-serif';
    ctx.fillText(item.year || '', 40, y + 50);
  });
}

function signTexture(text, sub, color, dark = true) {
  return canvasTexture(1024, 256, (c, w, h) => {
    c.fillStyle = dark ? '#0f172a' : '#ffffff';
    c.beginPath();
    c.roundRect(0, 0, w, h, 60);
    c.fill();
    c.fillStyle = color;
    c.fillRect(60, h - 22, w - 120, 8);
    c.fillStyle = dark ? '#ffffff' : '#0f172a';
    c.font = '800 112px "Bricolage Grotesque", Inter, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    fillFit(c, text, w / 2, h * 0.42, w - 80);
    c.fillStyle = color;
    c.font = '600 40px Inter, sans-serif';
    fillFit(c, sub, w / 2, h * 0.78, w - 80);
  });
}

// A big walk-in dome: the door leads to an indoor set.
function buildZoneDome(scene, ctx, place, { radius = 10, glass = false, extras } = {}) {
  const r = rng(place.id.length * 97);
  const g = new THREE.Group();
  g.position.set(place.x, place.y + SURFACE, place.z);
  g.rotation.y = place.facing;
  scene.add(g);
  const dome = makeDome(radius, place.color, { glass });
  dome.position.z = -2;
  g.add(dome);
  collider(g, radius + 0.2, 0, -2);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({ map: signPlateTexture(place.name, place.place, place.color), toneMapped: false }));
  sign.name = 'dome-sign';
  // glowing archway and a path of lights to the door
  const doorZ = -2 + radius * 1.15;
  // the name crowns the gatehouse, above the parapet and between its chhatris, so the gate never hides it
  const gateH = radius * 0.82 - 0.3;
  sign.position.set(0, gateH + 0.35 + 0.45 + 1.75 / 2 + 0.25, doorZ + 0.35 + 0.12);
  sign.userData.dynamic = true;
  g.add(sign);
  const signBack = new THREE.Mesh(new THREE.BoxGeometry(7.3, 2.05, 0.2), solid('#f6efe0', { roughness: 0.8 }));
  signBack.position.set(0, sign.position.y, doorZ + 0.35);
  g.add(signBack);
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.22, 0.6, 0.22), solid('#f6efe0'), sx * 3.2, gateH + 0.35 + 0.45 + 0.1, doorZ + 0.35));
  // a Rajput gatehouse in front of the door, painted panels and all
  const pol = makePol({ w: radius * 1.05, h: radius * 0.82, a: radius * 0.24, spring: radius * 0.3, depth: 1.1, color: place === HOME ? JAIPUR_PINK : OCHRE, accent: place.color });
  pol.position.set(0, -0.3, doorZ + 0.35);
  g.add(pol);
  for (const sx of [-1, 1]) collider(g, 1.1, sx * radius * 0.42, doorZ + 0.35);
  for (let k = 0; k < 4; k++) {
    for (const sx of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 10), glow(place.color, 2), sx * 2.2, 0.25, doorZ + 1.5 + k * 2.2));
  }
  const marker = new THREE.Object3D();
  marker.position.set(0, 0, doorZ + 1.2);
  marker.userData.interact = { kind: 'enter', room: place.id, label: place.name, verb: 'Go inside' };
  g.add(marker);
  const doorHit = new THREE.Mesh(new THREE.PlaneGeometry(radius * 0.5, radius * 0.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  doorHit.position.set(0, radius * 0.3, doorZ + 0.06);
  doorHit.userData.action = { kind: 'enter', room: place.id };
  doorHit.userData.dynamic = true;
  g.add(doorHit);
  ctx.clickables.push(doorHit);
  // a greeter by the door
  const p = makePerson({ accent: place.color, seed: r(), style: ['blazer', 'streetwear', 'kurta'][place.id.length % 3] });
  p.root.position.set(3.2, 0, doorZ + 2.2);
  p.root.rotation.y = Math.atan2(-3.2, 4);
  g.add(p.root);
  ctx.updaters.push({ update: (t) => animate(p, 'talk', t) });
  ctx.npcs.push({ p, dept: place.id, lines: place.quotes, name: `${place.name} host` });
  if (BELIEFS[place.id]) {
    // at the end of the branch path that brings people here from the spoke road, a step to its
    // side and turned to face them: the first thing you read on the way in, clear of the gate
    const a = place.angle - Math.PI / 6;
    const th = g.rotation.y;
    const dx = Math.cos(a) * 32 - place.x;
    const dz = Math.sin(a) * 32 - place.z;
    const L = Math.hypot(dx, dz);
    const ux = dx / L;
    const uz = dz / L;
    const wx = ux * 15.5 + uz * 3.6;
    const wz = uz * 15.5 - ux * 3.6;
    // into the dome group's own frame
    const sx = wx * Math.cos(th) - wz * Math.sin(th);
    const sz = wx * Math.sin(th) + wz * Math.cos(th);
    const lux = ux * Math.cos(th) - uz * Math.sin(th);
    const luz = ux * Math.sin(th) + uz * Math.cos(th);
    const rot = Math.atan2(lux, luz);
    const sign = makeBeliefSign(place, BELIEFS[place.id]);
    sign.position.set(sx, 0, sz);
    sign.rotation.y = rot;
    g.add(sign);
    for (const d of [-1.71, 1.71]) collider(g, 0.35, sx + Math.cos(rot) * d, sz - Math.sin(rot) * d);
  }
  extras?.(g, doorZ, r);
  deepMerge(g);
}

function buildPlayhouse(scene, ctx) {
  buildZoneDome(scene, ctx, FUN, {
    radius: 10,
    extras: (g, doorZ) => {
      // popcorn cart outside
      const pop = new THREE.Group();
      pop.position.set(-6, 0, doorZ + 3);
      pop.add(mesh(new THREE.BoxGeometry(1.6, 1, 1), solid('#d64545'), 0, 0.8, 0));
      for (let k = 0; k < 6; k++) pop.add(mesh(new THREE.BoxGeometry(0.28, 0.06, 1.3), solid(k % 2 ? '#ffffff' : '#d64545'), -0.7 + k * 0.28, 2.3, 0));
      for (const x of [-0.7, 0.7]) pop.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), WHITE_METAL, x, 1.65, 0));
      g.add(pop);
      collider(g, 1.1, -6, doorZ + 3);
    },
  });
}

function buildAIHubDome(scene, ctx) {
  buildZoneDome(scene, ctx, AIHUB, {
    radius: 11,
    glass: true,
    extras: (g) => {
      // floating data cubes orbiting the dome
      const cubes = [];
      for (let k = 0; k < 10; k++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), glow(k % 2 ? AIHUB.color : '#7b5cff', 2.5));
        c.userData.dynamic = true;
        g.add(c);
        cubes.push(c);
      }
      ctx.updaters.push({
        update: (t) =>
          cubes.forEach((c, k) => {
            const a = t * 0.3 + (k / cubes.length) * Math.PI * 2;
            c.position.set(Math.cos(a) * 13, 6 + Math.sin(t + k) * 1.5, -2 + Math.sin(a) * 13);
            c.rotation.set(t + k, t * 0.7, 0);
          }),
      });
    },
  });
}

function buildHallDome(scene, ctx) {
  buildZoneDome(scene, ctx, HALL, {
    radius: 10,
    extras: (g, doorZ) => {
      // golden columns and a giant trophy on the roof
      for (const sx of [-1, 1]) {
        g.add(mesh(new THREE.CylinderGeometry(0.45, 0.5, 7, 20), GOLD, sx * 4.2, 3.5, doorZ + 0.8));
        g.add(mesh(new THREE.BoxGeometry(1.4, 0.4, 1.4), GOLD, sx * 4.2, 7.1, doorZ + 0.8));
      }
      const pts = [[0, 0], [1.2, 0], [0.4, 0.5], [0.3, 1.8], [1.1, 2.4], [1.3, 3.8], [0, 3.4]].map(([x, y]) => new THREE.Vector2(x, y));
      const cup = mesh(new THREE.LatheGeometry(pts, 32), GOLD, 0, 12.2, -2);
      cup.userData.dynamic = true;
      g.add(cup);
      ctx.updaters.push({ update: (t) => (cup.rotation.y = t * 0.4) });
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3, 9), solid('#a3182f', { roughness: 1 }));
      carpet.rotation.x = -Math.PI / 2;
      carpet.position.set(0, 0.12, doorZ + 4.5);
      g.add(carpet);
    },
  });
}

// ---------- Café and video wall at HQ ----------

function buildCafeAndWall(scene, ctx) {
  const r = rng(606);
  const cx = 16.5;
  const cz = 0;
  const cafe = makeCafe('#7a4a2a');
  cafe.position.set(cx, groundAt(cx, cz), cz);
  cafe.rotation.y = Math.atan2(-cx, -cz);
  scene.add(cafe);
  ctx.colliderList.push({ x: cx, z: cz, r: 1.9 });
  const barista = makePerson({ seed: r(), top: '#2b2f36', accent: '#7a4a2a' });
  barista.root.position.set(0, 0, -0.9);
  cafe.add(barista.root);
  giveProp(barista, 'cup');
  const customers = [];
  for (const [x, z] of [[-2.6, 3.0], [2.6, 3.0]]) {
    const c = makePerson({ seed: r(), accent: HAMLETS[Math.floor(r() * 6)].color });
    c.root.position.set(x, 0, z);
    c.root.rotation.y = Math.PI + (x > 0 ? 0.6 : -0.6);
    giveProp(c, 'cup');
    cafe.add(c.root);
    customers.push(c);
    ctx.npcs.push({ p: c, dept: 'hq' });
  }
  ctx.npcs.push({ p: barista, dept: 'hq', lines: ['Filter coffee? It’s on the house for anyone who brings an idea.', 'Most campaigns here started over a cup of coffee.'], name: 'Barista' });
  ctx.updaters.push({ update: (t) => (animate(barista, 'talk', t), customers.forEach((c) => animate(c, 'coffee', t))) });
  // steam
  const steamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false });
  const puffs = [];
  for (let k = 0; k < 4; k++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), steamMat.clone());
    cafe.add(m);
    puffs.push(m);
  }
  ctx.updaters.push({
    update: (t) =>
      puffs.forEach((m, k) => {
        const u = (t * 0.5 + k / 4) % 1;
        m.position.set(-0.8 + Math.sin(u * 6) * 0.05, 1.8 + u * 0.9, -0.25);
        m.scale.setScalar(1 + u * 2);
        m.material.opacity = 0.35 * (1 - u);
      }),
  });

  // Video wall of the studio's work
  const a = THREE.MathUtils.degToRad(120);
  const wx = Math.cos(a) * 15.5;
  const wz = Math.sin(a) * 15.5;
  const shots = ['t20', 'trial', 'btb', 'magic-checkout', 'ring', 'ace'].map((slug) => screenMat(PROJECTS[slug].images[0], 2.4 / 1.35));
  const wall = makeMonitorWall(shots, CENTER.color, 3);
  wall.position.set(wx, groundAt(wx, wz), wz);
  wall.rotation.y = Math.atan2(-wx, -wz);
  scene.add(wall);
  ctx.colliderList.push({ x: wx, z: wz, r: 2.5 });
}

// ---------- Roadside ad boards ----------

function buildAdBoards(scene, ctx) {
  const ads = [['t20', 't20-1'], ['money', 'money-hero'], ['magic-checkout', 'magic-cover'], ['social-gen', 'social-1'], ['trial', 'trial-1'], ['toolkit', 'cine-ui']];
  HAMLETS.forEach((h, i) => {
    const [slug, img] = ads[i];
    const ca = Math.cos(h.angle);
    const sa = Math.sin(h.angle);
    // on the side of the spoke away from the domes (they sit at +30° from each spoke), far enough
    // out that the next ring of buildings is behind the viewer, not behind the board
    const d = 52;
    // whichever side of the road is further from the domes and the bazaar
    const spot = (sd) => [ca * d - sa * 9 * sd, sa * d + ca * 9 * sd];
    const clearance = ([px, pz]) => Math.min(...[HOME, FUN, AIHUB, HALL].map((zn) => Math.hypot(px - zn.x, pz - zn.z)), ...[0, 0.5, 1].map((t) => Math.hypot(px - (BAZAAR.ax + (BAZAAR.bx - BAZAAR.ax) * t), pz - (BAZAAR.az + (BAZAAR.bz - BAZAAR.az) * t))));
    const side = clearance(spot(1)) >= clearance(spot(-1)) ? 1 : -1;
    const [x, z] = spot(side);
    const { g, img: m, tag, imgBack, tagBack } = makeAdBoard(`work/${img}.jpg`, h.color, PROJECTS[slug].title);
    imgBack.userData.slug = tagBack.userData.slug = slug;
    ctx.clickables.push(imgBack, tagBack);
    g.position.set(x, groundAt(x, z) - 0.2, z);
    // face the road, angled towards traffic coming from the centre
    const tx = ca * 30;
    const tz = sa * 30;
    g.rotation.y = Math.atan2(tx - x, tz - z);
    m.userData.slug = slug;
    tag.userData.slug = slug;
    scene.add(g);
    ctx.clickables.push(m, tag);
    g.updateMatrixWorld(true);
    for (const px of [-3, 3]) {
      const v = new THREE.Vector3(px, 0, -0.3).applyMatrix4(g.matrixWorld);
      ctx.colliderList.push({ x: v.x, z: v.z, r: 0.4 });
    }
    mergeStatic(g);
  });
}

// ---------- Big domes on the hills ----------

function buildHillDomes(scene) {
  const spots = [[-150, 127, 8], [-15, 128, 8], [95, 128, 9], [225, 126, 8]];
  const colors = ['#2f6bff', '#00a79d', '#ff4f8b', '#7b5cff'];
  spots.forEach(([deg, d, rad], k) => {
    const a = THREE.MathUtils.degToRad(deg);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const dome = makeDome(rad, colors[k], { glass: k % 2 === 1 });
    dome.position.set(x, groundAt(x, z) - 0.6, z);
    dome.rotation.y = Math.atan2(-x, -z);
    scene.add(dome);
    deepMerge(dome);
  });
}

// ---------- Drones ----------

function buildDrones(scene, ctx) {
  const drones = [];
  const hq = new THREE.Vector3(0, groundAt(0, 0) + 16, 0);
  // Delivery runs from HQ to every hamlet and the two inner zones
  const targets = [...HAMLETS, HOME, FUN, AIHUB, HALL];
  targets.forEach((h, k) => {
    const d = makeDrone(h.color, true);
    scene.add(d);
    const dest = new THREE.Vector3(h.x * 0.92, (h.y ?? groundAt(h.x, h.z)) + 7, h.z * 0.92);
    drones.push({ d, kind: 'route', a: hq.clone().add(new THREE.Vector3(Math.cos(k) * 4, 0, Math.sin(k) * 4)), b: dest, off: k / targets.length, period: 26 + k * 2 });
  });
  // Film drones circling the Arena shoot
  const arena = HAMLETS[0];
  for (let k = 0; k < 2; k++) {
    const d = makeDrone('#ff3b3b');
    scene.add(d);
    drones.push({ d, kind: 'orbit', c: new THREE.Vector3(arena.x, arena.y + 5 + k * 2, arena.z), rad: 6 + k * 3, speed: 0.35 + k * 0.2, ph: k * 2 });
  }
  ctx.drones = drones.map((it) => it.d);
  const prev = new THREE.Vector3();
  ctx.updaters.push({
    update: (t) => {
      for (const it of drones) {
        const { d } = it;
        prev.copy(d.position);
        if (it.kind === 'route') {
          const u = ((t / it.period + it.off) % 1);
          const s = u < 0.5 ? u * 2 : 2 - u * 2; // there and back
          const e = s * s * (3 - 2 * s);
          d.position.lerpVectors(it.a, it.b, e);
          d.position.y += Math.sin(e * Math.PI) * 6;
        } else {
          const a = t * it.speed + it.ph;
          d.position.set(it.c.x + Math.cos(a) * it.rad, it.c.y + Math.sin(t * 1.3 + it.ph) * 0.6, it.c.z + Math.sin(a) * it.rad);
        }
        const vx = d.position.x - prev.x;
        const vz = d.position.z - prev.z;
        if (vx * vx + vz * vz > 1e-6) d.rotation.y = Math.atan2(vx, vz);
        d.rotation.x = Math.min(0.3, Math.hypot(vx, vz) * 2);
        for (const rot of d.userData.rotors) rot.rotation.y = t * 40;
      }
    },
  });
}

// ---------- Delivery scooters on the ring road ----------

function buildScooters(scene, ctx) {
  const r = rng(808);
  const ring = ringRoute();
  for (let k = 0; k < 3; k++) {
    const h = HAMLETS[(k * 2 + 1) % 6];
    const p = makePerson({ seed: r(), accent: h.color, top: h.color });
    const sc = makeScooter(h.color);
    sc.scale.setScalar(1 / p.root.scale.x);
    p.root.add(sc);
    p.mount = sc.userData.mount;
    const w = new Walker(scene, p, ring, { loop: true, speed: 7, pause: 0.05, heightFn: walkY, action: 'scoot', idle: 'scoot' });
    w.idx = (k * 6 + 3) % ring.length;
    const [x, z] = ring[(k * 6 + 2) % ring.length];
    p.root.position.set(x, groundAt(x, z), z);
    const last = new THREE.Vector3().copy(p.root.position);
    ctx.updaters.push(w, {
      update: () => {
        sc.userData.spin(p.root.position.distanceTo(last));
        last.copy(p.root.position);
      },
    });
    ctx.npcs.push({ p, dept: h.id, rider: true });
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
  const ctx = { updaters: [], stones: [], npcs: [], clickables: [], sprites: [], trophies: [], colliderList: [] };
  // every top-level object gets the name of the builder that made it (for layout and visibility checks)
  const tag = (name, fn) => {
    const before = new Set(scene.children);
    const out = fn();
    for (const o of scene.children) if (!before.has(o) && !o.name) o.name = name;
    return out;
  };
  HAMLETS.forEach((h, i) => tag(`hamlet:${h.id}`, () => buildHamlet(scene, h, i, ctx)));
  tag('lab', () => buildLab(scene, ctx));
  tag('centre', () => buildCentre(scene, ctx));
  tag('trophies', () => buildTrophies(scene, ctx));
  tag('couriers', () => buildCouriers(scene, ctx));
  tag('home', () => buildHome(scene, ctx));
  tag('playhouse', () => buildPlayhouse(scene, ctx));
  tag('aihub', () => buildAIHubDome(scene, ctx));
  tag('hall', () => buildHallDome(scene, ctx));
  tag('cafe-wall', () => buildCafeAndWall(scene, ctx));
  // (the roadside 'now showing' boards are gone: each department's gateway and hero exhibit now
  // announce its work, and the boards crowded the approaches)
  tag('hill-domes', () => buildHillDomes(scene));
  tag('drones', () => buildDrones(scene, ctx));
  tag('scooters', () => buildScooters(scene, ctx));
  ctx.Walker = Walker;
  tag('jaipur', () => buildJaipur(scene, ctx));
  tag('traffic', () => buildTraffic(scene, ctx));
  const creatures = tag('creatures', () => buildCreatures(scene, ctx));
  const smoke = tag('smoke', () => buildSmoke(scene));

  scene.updateMatrixWorld(true);
  const colliders = [];
  const projects = [];
  const interactables = [];
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
    if (o.userData.interact) {
      o.getWorldPosition(v);
      interactables.push({ ...o.userData.interact, x: v.x, z: v.z });
    }
  });
  colliders.push(...ctx.colliderList);

  const update = (t, dt) => {
    for (const u of ctx.updaters) u.update(t, dt);
    // the floating numbers above billboards show only when you're near that billboard
    for (const sp of ctx.sprites) {
      sp.s.position.y = sp.base + Math.sin(t * 1.5 + sp.ph) * 0.12;
      sp.s.getWorldPosition(spV);
      sp.s.visible = Math.hypot(spV.x - playerPos.x, spV.z - playerPos.z) < 12;
    }
    smoke(t);
  };

  return { update, colliders, stones: ctx.stones, npcs: ctx.npcs, clickables: ctx.clickables, trophies: ctx.trophies, projects, interactables, creatures, drones: ctx.drones || [] };
}
