// More of the work, everywhere you look: roadside screens lifted over the verges, three-sided
// rotating towers in the gaps between departments, and banners on the street lamps. Every face
// runs a slideshow of real project screenshots (case studies, Behance, YouTube posters) and opens
// that project when clicked. Nothing stands in the way: screens sit above head height on thin
// posts set back from the roads, and every spot is checked against roads, buildings and the sea.
import * as THREE from 'three';
import manifest from './content/billboards.json';
import { PROJECTS, CENTER, DEPARTMENTS, HAMLETS, LAB, FUN, HOME, AIHUB } from './data.js';
import { PATHS, ROAD_HALF, SEA_LEVEL, groundAt, distToSegment, ZONES, POND, JANTAR, BAZAAR } from './world.js';
import { WHITE_METAL, DARK, mesh, glow } from './materials.js';
import { projectPlateTexture } from './type.js';

const LITE = new URLSearchParams(location.search).has('lite') || matchMedia('(hover: none)').matches;
const PLACES = [CENTER, ...DEPARTMENTS, LAB, FUN, HOME, AIHUB];
const colorOf = (slug) => PLACES.find((p) => p.projects?.includes(slug))?.color || CENTER.color;

// ---------- textures: loaded on demand, the least recently shown dropped when there are too many ----------
const loader = new THREE.TextureLoader();
const cache = new Map(); // src → { tex, used, users }
const MAX = LITE ? 22 : 40;
let clock = 0;
function texFor(src) {
  const file = LITE ? src.replace('assets/img/bb/', 'assets/img/bb/s/') : src;
  let e = cache.get(file);
  if (!e) {
    const tex = loader.load(file);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = LITE ? 2 : 6;
    e = { tex, used: clock, users: 0 };
    cache.set(file, e);
    if (cache.size > MAX) {
      const idle = [...cache.entries()].filter(([, v]) => v.users === 0).sort((a, b) => a[1].used - b[1].used);
      for (const [k, v] of idle.slice(0, cache.size - MAX)) {
        v.tex.dispose();
        cache.delete(k);
      }
    }
  }
  e.used = clock;
  return e;
}
const plates = new Map();
function plateFor(slug, aspect) {
  const key = slug + aspect;
  if (!plates.has(key)) plates.set(key, projectPlateTexture(PROJECTS[slug], colorOf(slug), aspect));
  return plates.get(key);
}

// A face: an image plane, a name plate, and the playlist it cycles through.
class Face {
  constructor(img, plate, list, plateAspect, start) {
    this.img = img;
    this.plate = plate;
    this.list = list;
    this.plateAspect = plateAspect;
    this.i = start % list.length;
    this.next = 4 + Math.random() * 8;
    this.fade = 0;
    this.entry = null;
    this.show(this.i);
  }
  show(i) {
    const item = this.list[i];
    const e = texFor(item.src);
    if (this.entry) this.entry.users--;
    e.users++;
    this.entry = e;
    this.img.material.map = e.tex;
    this.img.material.needsUpdate = true;
    this.img.userData.slug = item.slug;
    if (this.plate) {
      this.plate.material.map = plateFor(item.slug, this.plateAspect);
      this.plate.material.needsUpdate = true;
      this.plate.userData.slug = item.slug;
    }
  }
  update(dt, near) {
    if (!near) return;
    this.next -= dt;
    if (this.next < 0.3 && this.next > 0) {
      // dip to black and back, swapping the picture in the dark
      const k = this.next / 0.3;
      this.img.material.color.setScalar(k);
    } else if (this.next <= 0) {
      this.i = (this.i + 1) % this.list.length;
      this.show(this.i);
      this.next = 8 + Math.random() * 5;
      this.fade = 0.3;
    }
    if (this.fade > 0) {
      this.fade = Math.max(0, this.fade - dt);
      this.img.material.color.setScalar(1 - this.fade / 0.3);
    }
  }
}

// Playlists: the work of the nearest department first, then everything else, so each road
// previews where it leads while the island as a whole shows the full range.
function playlist(pool, near, seed) {
  const own = pool.filter((x) => near?.projects?.includes(x.slug));
  const rest = pool.filter((x) => !own.includes(x));
  // a deterministic shuffle, different for every face
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const shuffled = rest.map((x) => [rnd(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return [...own, ...shuffled];
}
const nearestPlace = (x, z) => PLACES.filter((p) => p.x !== undefined).reduce((b, p) => (Math.hypot(p.x - x, p.z - z) < Math.hypot(b.x - x, b.z - z) ? p : b));

// ---------- placement checks ----------
function clear(x, z, r, colliders, { road = ROAD_HALF + 1.2 } = {}) {
  if (groundAt(x, z) < SEA_LEVEL + 1.5) return false;
  for (const seg of PATHS) if (distToSegment(x, z, seg) < road) return false;
  for (const c of colliders) {
    if (c.box) {
      const b = c.box;
      if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) return false;
    } else if (Math.hypot(x - c.x, z - c.z) < c.r + r) return false;
  }
  return true;
}
// big things the panels themselves must not cut through, even high up
const KEEP_OUT = () => [
  ...HAMLETS.map((h) => ({ x: h.x, z: h.z, r: 15 })),
  ...ZONES.map((z) => ({ x: z.x, z: z.z, r: 13 })),
  { x: 0, z: 0, r: 17 },
  { x: LAB.x, z: LAB.z, r: 11 },
  { x: POND.x, z: POND.z, r: POND.bank + 1 },
  { x: JANTAR.x, z: JANTAR.z, r: JANTAR.r + 3 },
  // the bazaar street: a chain of circles along it rather than one huge one
  ...[0, 0.25, 0.5, 0.75, 1].map((t) => ({ x: BAZAAR.ax + (BAZAAR.bx - BAZAAR.ax) * t, z: BAZAAR.az + (BAZAAR.bz - BAZAAR.az) * t, r: 11 })),
];
const outside = (x, z, r, zones) => zones.every((k) => Math.hypot(x - k.x, z - k.z) > k.r + r);

// ---------- models ----------
const frameMat = WHITE_METAL;
function screen(W, H, double = true) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(W + 0.3, H + 0.3, 0.24), frameMat, 0, 0, 0));
  const mk = (z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ toneMapped: false }));
    m.position.z = z;
    m.rotation.y = ry;
    m.userData.dynamic = true;
    g.add(m);
    return m;
  };
  const front = mk(0.125, 0);
  const back = double ? mk(-0.125, Math.PI) : null;
  return { g, front, back };
}
function plateMesh(W, aspect, z, ry) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, W / aspect), new THREE.MeshBasicMaterial({ toneMapped: false }));
  m.position.z = z;
  m.rotation.y = ry;
  m.userData.dynamic = true;
  return m;
}

// A roadside screen: two posts, a 16:9 panel lifted over the verge, a name plate, a light strip.
function roadsideScreen(color) {
  const W = 7.2;
  const H = 4.05;
  const lift = 4.6;
  const g = new THREE.Group();
  g.name = 'gal-road';
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.17, lift + H / 2, 10), frameMat, sx * 2.5, (lift + H / 2) / 2, -0.25));
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), DARK, sx * 2.5, 0.06, -0.25));
  }
  g.add(mesh(new THREE.BoxGeometry(5.6, 0.14, 0.14), frameMat, 0, lift - 0.25, -0.25));
  const s = screen(W, H);
  s.g.position.y = lift + 0.75 + H / 2;
  g.add(s.g);
  const plateW = 4.2;
  const pf = plateMesh(plateW, 5, 0.14, 0);
  const pb = plateMesh(plateW, 5, -0.14, Math.PI);
  const plateY = lift + 0.75 - H / 2 - 0.15 - plateW / 10 - 0.03 + H / 2;
  pf.position.set(-W / 2 + plateW / 2, plateY, 0);
  pb.position.set(W / 2 - plateW / 2, plateY, 0);
  g.add(pf, pb);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.08, 0.3), glow(color, 2.2));
  strip.position.y = lift + 0.75 + H + 0.2;
  g.add(strip);
  return { g, faces: [[s.front, pf], [s.back, pb]] };
}

// A hill board: a big 16:9 screen on a lattice of two masts, readable from across the island.
function hillBoard(color) {
  const W = 12.8;
  const H = 7.2;
  const lift = 5.5;
  const g = new THREE.Group();
  g.name = 'gal-hill';
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.3, lift + H * 0.7, 10), frameMat, sx * 4.2, (lift + H * 0.7) / 2, -0.4));
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), DARK, sx * 4.2, 0.1, -0.4));
  }
  for (const y of [lift * 0.45, lift - 0.2]) g.add(mesh(new THREE.BoxGeometry(8.8, 0.16, 0.16), frameMat, 0, y, -0.4));
  // one-sided: the back faces the woods and the sea, where nobody stands
  const s = screen(W, H, false);
  s.g.position.y = lift + 1.0 + H / 2;
  g.add(s.g);
  const plateW = 6.2;
  const plateY = lift + 1.0 - 0.15 - plateW / 10 - 0.03;
  const pf = plateMesh(plateW, 5, 0.14, 0);
  pf.position.set(-W / 2 + plateW / 2, plateY, 0);
  g.add(pf);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.12, 0.3), glow(color, 2.2));
  strip.position.y = lift + 1.0 + H + 0.22;
  g.add(strip);
  return { g, faces: [[s.front, pf]] };
}

// A three-sided tower: a mast and a slowly turning prism of screens high above the rooftops.
function tower(color) {
  const g = new THREE.Group();
  g.name = 'gal-tower';
  const W = 6.4;
  const H = 3.6;
  const base = 13;
  g.add(mesh(new THREE.CylinderGeometry(0.32, 0.5, base + 0.5, 14), frameMat, 0, (base + 0.5) / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.35, 18), DARK, 0, 0.17, 0));
  const head = new THREE.Group();
  head.position.y = base + 0.5;
  g.add(head);
  const apothem = W / (2 * Math.sqrt(3)) + 0.18;
  const faces = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const s = screen(W, H, false);
    s.g.position.set(Math.sin(a) * apothem, H / 2 + 0.2, Math.cos(a) * apothem);
    s.g.rotation.y = a;
    head.add(s.g);
    const pl = plateMesh(W * 0.62, 5, 0.14, 0);
    pl.position.set(-W / 2 + W * 0.31, -H / 2 - 0.15 - (W * 0.62) / 10 - 0.03, 0);
    s.g.add(pl);
    faces.push([s.front, pl]);
  }
  for (const y of [-0.62, H + 0.4]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(apothem * 2 + 0.1, apothem * 2 + 0.1, 0.12, 3), glow(color, 2.2));
    ring.position.y = y;
    ring.rotation.y = Math.PI / 3;
    head.add(ring);
  }
  return { g, faces, head };
}

// A lamp-post banner: a bracket and a portrait banner either side, above head height.
function banner() {
  const g = new THREE.Group();
  g.name = 'gal-banner';
  const W = 1.05;
  const H = W * 1.5;
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.05, W + 0.2), frameMat, 0, 4.15, -(W / 2 + 0.12)));
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.05, W + 0.2), frameMat, 0, 4.15 - H - 0.05, -(W / 2 + 0.12)));
  const mk = (ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.FrontSide }));
    m.position.set(ry ? -0.012 : 0.012, 4.12 - H / 2, -(W / 2 + 0.15));
    m.rotation.y = Math.PI / 2 + ry;
    m.userData.dynamic = true;
    g.add(m);
    return m;
  };
  return { g, faces: [[mk(0), null], [mk(Math.PI), null]] };
}

// ---------- visibility, for solving the layout ----------
// A display surface is a vertical textured plane. Its visibility is the share of sight lines that
// reach it unblocked, from eye height, 8, 14 and 22 m in front, straight on and 25° either side.
function makeVisibility(scene, colliders) {
  const outdoor = scene;
  const ray = new THREE.Raycaster();
  const v = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  // the object a surface belongs to (so its own frame never counts as blocking it)
  const unitOf = (o) => {
    for (let p = o.parent; p && p !== outdoor; p = p.parent) if (p.userData.unit) return p;
    for (let p = o.parent; p && p !== outdoor; p = p.parent) if (p.name && p.parent !== outdoor) return p;
    return o;
  };
  const isOccluder = (o) => {
    if (!o.isMesh || (o.isInstancedMesh && o.count > 2000) || o.isSkinnedMesh || o.isPoints || o.isSprite) return false;
    const m = o.material;
    if (!m || m.depthWrite === false || (m.transparent && (m.opacity ?? 1) < 0.6)) return false;
    const g = o.geometry;
    const n = g.index ? g.index.count : g.attributes.position.count;
    if (n > 150000) return false; // the terrain
    if (!g.boundingSphere) g.computeBoundingSphere();
    return g.boundingSphere.radius > 0.25;
  };
  let occ = [];
  const refresh = () => {
    occ = [];
    outdoor.updateMatrixWorld(true);
    outdoor.traverse((o) => {
      if (!isOccluder(o)) return;
      let vis = true;
      for (let p = o; p; p = p.parent) if (!p.visible) vis = false;
      if (!vis) return;
      const c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld);
      o.matrixWorld.decompose(v, q, sc);
      occ.push({ o, c, r: o.geometry.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z) });
    });
  };
  const surfacesIn = (root) => {
    const out = [];
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh || o.geometry.type !== 'PlaneGeometry' || o.userData.decor || o.userData.back) return;
      const m = o.material;
      if (!m || !(m.map || o.userData.slug !== undefined)) return;
      o.matrixWorld.decompose(v, q, sc);
      const n = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      const w = o.geometry.parameters.width * sc.x;
      const h = o.geometry.parameters.height * sc.y;
      if (Math.abs(n.y) < 0.6 && w * h > 0.9) out.push({ o, c: v.clone(), n, w, h, q: q.clone() });
    });
    return out;
  };
  const standable = (x, z) => groundAt(x, z) > SEA_LEVEL + 0.5 && !colliders.some((c) => (c.box ? x > c.box.minX && x < c.box.maxX && z > c.box.minZ && z < c.box.maxZ : Math.hypot(x - c.x, z - c.z) < c.r));
  const Y = new THREE.Vector3(0, 1, 0);
  const label = (o) => { const n = []; for (let p = o; p && p !== outdoor; p = p.parent) if (p.name) n.unshift(p.name); return n.join('>') || o.type; };
  function score(s, extra = null, why = null, dists = s.dists || [8, 14, 22]) {
    const own = unitOf(s.o);
    const hn = new THREE.Vector3(s.n.x, 0, s.n.z).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(s.q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(s.q);
    const samples = [[0, 0], [-0.35, 0.3], [0.35, 0.3], [-0.35, -0.3], [0.35, -0.3]].map(([a, b]) => s.c.clone().addScaledVector(right, a * s.w).addScaledVector(up, b * s.h));
    const reach = dists[dists.length - 1] + 4;
    const near = occ.filter((e) => e.c.distanceTo(s.c) < reach + e.r).map((e) => e.o);
    const list = extra ? near.concat(extra) : near;
    let tot = 0;
    let ok = 0;
    for (const d of dists) {
      for (const yaw of [-0.44, 0, 0.44]) {
        const dir = hn.clone().applyAxisAngle(Y, yaw);
        const ex = s.c.x + dir.x * d;
        const ez = s.c.z + dir.z * d;
        if (!standable(ex, ez)) continue;
        const eye = new THREE.Vector3(ex, groundAt(ex, ez) + 1.7, ez);
        for (const t of samples) {
          const to = t.clone().sub(eye);
          const L = to.length();
          ray.set(eye, to.normalize());
          ray.near = 0.3;
          ray.far = L - 0.25;
          const hit = ray.intersectObjects(list, false).find((h) => unitOf(h.object) !== own);
          tot++;
          if (!hit) ok++;
          else if (why) why[label(hit.object)] = (why[label(hit.object)] || 0) + 1;
        }
      }
    }
    return tot ? ok / tot : 1;
  }
  refresh();
  return { refresh, surfacesIn, score, occluders: () => occ };
}

// where each kind of screen is meant to be read from: roadside screens by people walking up the
// road, towers and hill boards from across the island, banners from a few steps away
const VIEW = { road: [8, 14, 22], banner: [5, 9, 14], tower: [16, 28, 42], hill: [22, 36, 52] };

// Every placement is data: { type, x, z, y, rot }. A saved layout (src/content/gallery-layout.json)
// is placed as is; with ?solve the layout is worked out again, keeping a spot only if its screens
// are clearly visible and it doesn't hide any other sign or screen on the island.
export function buildGallery(scene, { colliders, lamps = [], clickables, layout = null, solve = false }) {
  const land = manifest.land;
  const port = manifest.port;
  const faces = [];
  const towers = [];
  const placed = [];
  let seed = 1;
  const addFaces = (list, pool, x, z, plateAspect) => {
    const near = nearestPlace(x, z);
    const made = [];
    for (const [img, plate] of list) {
      // the first few pictures are the nearby department's; each face starts at a different one
      // and neighbours are spread through the list, so no two screens side by side match
      const pl = playlist(pool, near, seed);
      const own = pl.filter((x) => near?.projects?.includes(x.slug)).length;
      const start = seed % 2 === 0 && own ? (seed >> 1) % own : own + ((seed * 7) % Math.max(1, pl.length - own));
      seed++;
      const f = new Face(img, plate, pl, plateAspect, start);
      f.pos = new THREE.Vector3(x, 0, z);
      made.push(f);
    }
    return made;
  };
  // build one item; returns what's needed to keep it or take it back out
  function make(item) {
    const { type, x, z, rot } = item;
    const color = colorOf(playlist(land, nearestPlace(x, z), 0)[0].slug);
    let b;
    let posts = [];
    if (type === 'road') {
      b = roadsideScreen(color);
      posts = [-2.5, 2.5].map((d) => [x + Math.cos(rot) * d, z - Math.sin(rot) * d, 0.3]);
    } else if (type === 'hill') {
      b = hillBoard(color);
      posts = [-4.2, 4.2].map((d) => [x + Math.cos(rot) * d, z - Math.sin(rot) * d, 0.45]);
    } else if (type === 'tower') {
      b = tower(color);
      posts = [[x, z, 0.6]];
    } else {
      b = banner();
    }
    const y = item.y ?? (posts.length ? Math.min(...posts.map(([px, pz]) => groundAt(px, pz))) - 0.15 : 0);
    b.g.userData.unit = true;
    b.g.position.set(x, y, z);
    b.g.rotation.y = type === 'tower' ? 0 : rot;
    if (type === 'tower') b.head.rotation.y = rot;
    scene.add(b.g);
    const fs = addFaces(b.faces, type === 'banner' ? port : land, x, z, type === 'banner' ? 0 : 5);
    return { b, fs, posts, y };
  }
  function keep(item, m) {
    for (const f of m.fs) {
      faces.push(f);
      clickables.push(f.img);
      if (f.plate) clickables.push(f.plate);
    }
    if (item.type === 'tower') towers.push(m.b);
    for (const [px, pz, r] of m.posts) colliders.push({ x: px, z: pz, r });
    placed.push({ ...item, y: +m.y.toFixed(2), kind: item.type });
  }
  function drop(m) {
    scene.remove(m.b.g);
    for (const f of m.fs) if (f.entry) f.entry.users--;
  }

  if (!solve) {
    for (const item of layout || []) keep(item, make(item));
  } else {
    const vis = makeVisibility(scene, colliders);
    const zones = KEEP_OUT();
    const farEnough = (x, z, d) => placed.every((p) => Math.hypot(p.x - x, p.z - z) > d);
    // every sign and screen already on the island, with its visibility before anything is added
    const signs = vis.surfacesIn(scene).map((s) => ({ ...s, base: null }));
    const baseOf = (s) => (s.base ??= vis.score(s));
    const stats = { tried: 0, geometry: 0, hidden: 0, hides: 0, kept: 0 };
    const tryItem = (item, { minOwn = 0.85, spacing = 20, postR = 0.9, road = ROAD_HALF + 1.0, zoneR = 3 } = {}) => {
      stats.tried++;
      const { x, z, rot, type } = item;
      if (!outside(x, z, zoneR, zones) || !farEnough(x, z, spacing)) return (stats.geometry++, false);
      const postsXZ = type === 'road' ? [-2.5, 2.5] : type === 'hill' ? [-4.2, 4.2] : [0];
      if (type !== 'banner' && !postsXZ.every((d) => clear(x + Math.cos(rot) * d * (type === 'tower' ? 0 : 1), z - Math.sin(rot) * d * (type === 'tower' ? 0 : 1), postR, colliders, { road }))) return (stats.geometry++, false);
      const m = make(item);
      m.b.g.userData.unit = true;
      const dists = VIEW[type];
      const mine = vis.surfacesIn(m.b.g).map((x) => ({ ...x, dists }));
      vis.refresh();
      // 1) its own screens must be clearly visible (a tower is checked at two turns of its head)
      const turns = type === 'tower' ? [rot, rot + Math.PI / 3] : [rot];
      // (a tower turns, so it is judged on the average over its faces and two turns of its head)
      let ownOk = true;
      const all = [];
      for (const r of turns) {
        if (type === 'tower') {
          m.b.head.rotation.y = r;
          vis.refresh();
        }
        for (const s of vis.surfacesIn(m.b.g)) {
          const why = {};
          const sc = vis.score(s, null, why, dists);
          all.push(sc);
          if (type !== 'tower' && sc < minOwn) ownOk = false;
        }
      }
      if (type === 'tower' && all.reduce((a, b) => a + b, 0) / all.length < minOwn) ownOk = false;
      if (!ownOk) {
        drop(m);
        vis.refresh();
        return (stats.hidden++, false);
      }
      // 2) it must not take visibility away from any sign or screen nearby
      let hurts = false;
      for (const r of turns) {
        if (type === 'tower') {
          m.b.head.rotation.y = r;
          vis.refresh();
        }
        for (const s of signs) {
          if (s.c.distanceTo(m.b.g.position) > 40 || mine.some((x) => x.o === s.o)) continue;
          const before = baseOf(s);
          if (before - vis.score(s) > 0.04) {
            hurts = true;
            break;
          }
        }
        if (hurts) break;
      }
      if (hurts) {
        drop(m);
        vis.refresh();
        return (stats.hides++, false);
      }
      if (type === 'tower') m.b.head.rotation.y = rot;
      keep(item, m);
      // its screens join the list everything after it must respect
      for (const s of vis.surfacesIn(m.b.g)) signs.push({ ...s, dists, base: vis.score(s, null, null, dists) });
      stats.kept++;
      return true;
    };
    // towers first: one in each gap between departments, several spots tried for each
    HAMLETS.forEach((h, i) => {
      for (const [da, r] of [[Math.PI / 6, 57], [Math.PI / 6 + 0.18, 54], [Math.PI / 6 - 0.18, 54], [Math.PI / 6 + 0.1, 62], [Math.PI / 6 - 0.1, 62], [Math.PI / 6, 86]]) {
        const a = h.angle + da;
        if (tryItem({ type: 'tower', x: +(Math.cos(a) * r).toFixed(2), z: +(Math.sin(a) * r).toFixed(2), rot: i }, { spacing: 18, postR: 1.4, road: ROAD_HALF + 1.2, zoneR: 6, minOwn: 0.8 })) break;
      }
    });
    // hill boards beyond the ring road, facing the island
    for (let k = 0; k < 30; k++) {
      const a = (k / 30) * Math.PI * 2 + 0.07;
      for (const r of [93, 89, 97, 85]) {
        const x = +(Math.cos(a) * r).toFixed(2);
        const z = +(Math.sin(a) * r).toFixed(2);
        if (tryItem({ type: 'hill', x, z, rot: Math.atan2(-x, -z) }, { spacing: 28, postR: 1.4, road: ROAD_HALF + 2.5, zoneR: 7, minOwn: 0.8 })) break;
      }
    }
    // roadside screens: candidates every 9 m on both sides of every road
    for (const seg of PATHS) {
      const [ax, az, bx, bz] = seg;
      const len = Math.hypot(bx - ax, bz - az);
      const ux = (bx - ax) / len;
      const uz = (bz - az) / len;
      const nx = -uz;
      const nz = ux;
      const n = Math.floor(len / 9);
      for (let kk = 2; kk < n * 2 - 1; kk++) {
        const k = kk >> 1;
        const t = k / n;
        const side = (k + kk + Math.round(Math.abs(ax) + Math.abs(az))) % 2 ? 1 : -1;
        const off = ROAD_HALF + 4.2;
        const x = ax + (bx - ax) * t + nx * off * side;
        const z = az + (bz - az) * t + nz * off * side;
        // facing back down the road, turned 35° towards it, so people walking up see it
        const fx = -ux * Math.cos(0.6) - nx * side * Math.sin(0.6);
        const fz = -uz * Math.cos(0.6) - nz * side * Math.sin(0.6);
        tryItem({ type: 'road', x: +x.toFixed(2), z: +z.toFixed(2), rot: +Math.atan2(fx, fz).toFixed(4) }, { spacing: 24 });
      }
    }
    // banners on street lamps (hung above head height, so only their visibility matters)
    lamps.forEach((l, k) => {
      if (k % 2) return;
      tryItem({ type: 'banner', x: +l.x.toFixed(2), z: +l.z.toFixed(2), y: +l.y.toFixed(2), rot: +l.rot.toFixed(4) }, { spacing: 12, zoneR: -100, minOwn: 0.75 });
    });
    console.log('gallery solve', JSON.stringify(stats));
    window.__galleryLayout = placed.map(({ type, x, z, y, rot }) => ({ type, x, z, y, rot }));
  }

  // only screens near the camera change pictures; the rest hold still and cost nothing
  const cam = new THREE.Vector3();
  function update(t, dt, camera, visible) {
    clock = t;
    for (const tw of towers) tw.head.rotation.y += dt * 0.12;
    if (!visible) return;
    camera.getWorldPosition(cam);
    for (const f of faces) f.update(dt, Math.hypot(f.pos.x - cam.x, f.pos.z - cam.z) < (LITE ? 90 : 140));
  }
  // a framed exhibit somewhere else on the island (the Gallery courtyard): an image plane and an
  // optional name plate that cycle through a curated playlist, by project slug
  function exhibit(img, plate, { pool = 'land', slugs = null, x = 0, z = 0, plateAspect = 5 } = {}) {
    const all = manifest[pool];
    const picked = slugs ? all.filter((i) => slugs.includes(i.slug)) : all;
    const list = picked.length ? picked : all;
    const f = new Face(img, plate, list, plateAspect, (seed++ * 5) % list.length);
    f.pos = new THREE.Vector3(x, 0, z);
    faces.push(f);
    clickables.push(img);
    if (plate) clickables.push(plate);
    return f;
  }
  return { update, placed, faces, towers, exhibit, cacheSize: () => cache.size };
}
