// More of the work, everywhere you look: roadside screens lifted over the verges, three-sided
// rotating towers in the gaps between departments, and banners on the street lamps. Every face
// runs a slideshow of real project screenshots (case studies, Behance, YouTube posters) and opens
// that project when clicked. Nothing stands in the way: screens sit above head height on thin
// posts set back from the roads, and every spot is checked against roads, buildings and the sea.
import * as THREE from 'three';
import manifest from './content/billboards.json';
import { PROJECTS, CENTER, HAMLETS, LAB, FUN, HOME, AIHUB, HALL } from './data.js';
import { PATHS, ROAD_HALF, SEA_LEVEL, groundAt, distToSegment, ZONES, POND, JANTAR, BAZAAR } from './world.js';
import { WHITE_METAL, DARK, mesh, glow } from './materials.js';
import { projectPlateTexture } from './type.js';

const LITE = new URLSearchParams(location.search).has('lite') || matchMedia('(hover: none)').matches;
const PLACES = [CENTER, ...HAMLETS, LAB, FUN, HOME, AIHUB, HALL];
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
  { x: LAB.x, z: LAB.z, r: 9 },
  { x: POND.x, z: POND.z, r: POND.r + 3 },
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
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.3, lift + H * 0.7, 10), frameMat, sx * 4.2, (lift + H * 0.7) / 2, -0.4));
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), DARK, sx * 4.2, 0.1, -0.4));
  }
  for (const y of [lift * 0.45, lift - 0.2]) g.add(mesh(new THREE.BoxGeometry(8.8, 0.16, 0.16), frameMat, 0, y, -0.4));
  const s = screen(W, H);
  s.g.position.y = lift + 1.0 + H / 2;
  g.add(s.g);
  const plateW = 6.2;
  const plateY = lift + 1.0 - 0.15 - plateW / 10 - 0.03;
  const pf = plateMesh(plateW, 5, 0.14, 0);
  const pb = plateMesh(plateW, 5, -0.14, Math.PI);
  pf.position.set(-W / 2 + plateW / 2, plateY, 0);
  pb.position.set(W / 2 - plateW / 2, plateY, 0);
  g.add(pf, pb);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.12, 0.3), glow(color, 2.2));
  strip.position.y = lift + 1.0 + H + 0.22;
  g.add(strip);
  return { g, faces: [[s.front, pf], [s.back, pb]] };
}

// A three-sided tower: a mast and a slowly turning prism of screens high above the rooftops.
function tower(color) {
  const g = new THREE.Group();
  const W = 6.4;
  const H = 3.6;
  const base = 10.5;
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

export function buildGallery(scene, { colliders, lamps = [], clickables }) {
  const land = manifest.land;
  const port = manifest.port;
  const faces = [];
  const towers = [];
  const placed = [];
  const zones = KEEP_OUT();
  let seed = 1;
  const addFaces = (list, pool, x, z, plateAspect) => {
    const near = nearestPlace(x, z);
    for (const [img, plate] of list) {
      // the first few pictures are the nearby department's; each face starts at a different one
      // and neighbours are spread through the list, so no two screens side by side match
      const list = playlist(pool, near, seed);
      const own = list.filter((x) => near?.projects?.includes(x.slug)).length;
      const start = seed % 2 === 0 && own ? (seed >> 1) % own : own + ((seed * 7) % Math.max(1, list.length - own));
      seed++;
      const f = new Face(img, plate, list, plateAspect, start);
      faces.push(f);
      clickables.push(img);
      if (plate) clickables.push(plate);
      f.pos = new THREE.Vector3(x, 0, z);
    }
  };
  const farEnough = (x, z, d) => placed.every((p) => Math.hypot(p.x - x, p.z - z) > d);

  // ----- rotating towers in the gaps between departments -----
  HAMLETS.forEach((h, i) => {
    for (const [da, r] of [[Math.PI / 6, 57], [Math.PI / 6 + 0.18, 54], [Math.PI / 6 - 0.18, 54], [Math.PI / 6, 86]]) {
      const a = h.angle + da;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!outside(x, z, 6, zones) || !farEnough(x, z, 18) || !clear(x, z, 1.4, colliders)) continue;
      const tw = tower(h.color);
      tw.g.position.set(x, groundAt(x, z) - 0.1, z);
      tw.head.rotation.y = i;
      scene.add(tw.g);
      addFaces(tw.faces, land, x, z, 5);
      towers.push(tw);
      colliders.push({ x, z, r: 0.6 });
      placed.push({ x, z, kind: 'tower' });
      break;
    }
  });

  // ----- roadside screens along every road, on alternating sides -----
  for (const seg of PATHS) {
    const [ax, az, bx, bz] = seg;
    const len = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / len;
    const uz = (bz - az) / len;
    const nx = -uz;
    const nz = ux;
    // candidates every 9 m, alternating sides; the spacing rule keeps the ones that fit
    const n = Math.floor(len / 9);
    for (let kk = 2; kk < n * 2 - 1; kk++) {
      const k = kk >> 1;
      const t = k / n;
      const side = (k + kk + Math.round(Math.abs(ax) + Math.abs(az))) % 2 ? 1 : -1;
      const off = ROAD_HALF + 4.2;
      const x = ax + (bx - ax) * t + nx * off * side;
      const z = az + (bz - az) * t + nz * off * side;
      // the panel faces back down the road, turned 35° towards it, so people walking up see it
      const fx = -ux * Math.cos(0.6) - nx * side * Math.sin(0.6);
      const fz = -uz * Math.cos(0.6) - nz * side * Math.sin(0.6);
      const facing = Math.atan2(fx, fz);
      const px = Math.cos(facing) * 2.5;
      const pz = -Math.sin(facing) * 2.5;
      const posts = [[x + px, z + pz], [x - px, z - pz]];
      if (!outside(x, z, 3, zones) || !farEnough(x, z, 21)) continue;
      if (!posts.every(([qx, qz]) => clear(qx, qz, 0.9, colliders, { road: ROAD_HALF + 1.0 }))) continue;
      const b = roadsideScreen(colorOf(playlist(land, nearestPlace(x, z), 0)[0].slug));
      const y = Math.min(groundAt(posts[0][0], posts[0][1]), groundAt(posts[1][0], posts[1][1])) - 0.15;
      b.g.position.set(x, y, z);
      b.g.rotation.y = facing;
      scene.add(b.g);
      addFaces(b.faces, land, x, z, 5);
      for (const [qx, qz] of posts) colliders.push({ x: qx, z: qz, r: 0.3 });
      placed.push({ x, z, kind: 'road' });
    }
  }

  // ----- big boards on the hills beyond the ring road, facing the island -----
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2 + 0.07;
    for (const r of [93, 89, 97]) {
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const facing = Math.atan2(-x, -z);
      const px = Math.cos(facing) * 4.2;
      const pz = -Math.sin(facing) * 4.2;
      const posts = [[x + px, z + pz], [x - px, z - pz]];
      if (!outside(x, z, 7, zones) || !farEnough(x, z, 30)) continue;
      if (!posts.every(([qx, qz]) => clear(qx, qz, 1.4, colliders, { road: ROAD_HALF + 2.5 }))) continue;
      const b = hillBoard(colorOf(playlist(land, nearestPlace(x, z), 0)[0].slug));
      const y = Math.min(groundAt(posts[0][0], posts[0][1]), groundAt(posts[1][0], posts[1][1])) - 0.2;
      b.g.position.set(x, y, z);
      b.g.rotation.y = facing;
      scene.add(b.g);
      addFaces(b.faces, land, x, z, 5);
      for (const [qx, qz] of posts) colliders.push({ x: qx, z: qz, r: 0.45 });
      placed.push({ x, z, kind: 'hill' });
      break;
    }
  }

  // ----- banners on every other street lamp -----
  lamps.forEach((l, k) => {
    if (k % 2) return;
    const b = banner();
    b.g.position.set(l.x, l.y, l.z);
    b.g.rotation.y = l.rot;
    scene.add(b.g);
    addFaces(b.faces, port, l.x, l.z, 0);
  });

  // only screens near the camera change pictures; the rest hold still and cost nothing
  const cam = new THREE.Vector3();
  function update(t, dt, camera, visible) {
    clock = t;
    for (const tw of towers) tw.head.rotation.y += dt * 0.12;
    if (!visible) return;
    camera.getWorldPosition(cam);
    for (const f of faces) f.update(dt, Math.hypot(f.pos.x - cam.x, f.pos.z - cam.z) < (LITE ? 90 : 140));
  }
  return { update, placed, faces, towers, cacheSize: () => cache.size };
}
