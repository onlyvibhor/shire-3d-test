// The light island: the same portfolio on a phone-sized budget.
//
// The full island builds terrain, thousands of meshes, interiors and hundreds of large textures;
// that is more than iPhone Safari allows a page, so it never opens there. This version keeps the
// island's plan and every piece of content (the departments, each project's case study, About,
// the Journal, campaigns, trophies, the hidden places, the tour and the map) and draws the world
// with a few hundred simple shapes: a plaza and a gate for each team, its work on billboards, the
// jamun tree at the centre, a guide at each department and you, walking between them.
import { capRenderer } from '../compat.js';
import * as THREE from 'three';
import { step, finishLoading, hideLoader } from '../loading.js';
import { loadFonts } from '../type.js';
import { startAudio, sfx, updateAudio } from '../audio.js';
import '../style.css';
import '../theme.css';
import '../mobile.css';
import { OWNER, PILLARS, PROJECTS, AWARDS, CONTACT, FAVOURITES, TOOLS, AWARD_LIST, CAREERS, NPC_TALK } from '../data.js';
import { onPhone } from '../loadplan.js';
import { makePillar } from '../pillars.js';
import { placeSignPairs } from '../signpairs.js';
import { PLACES, PATHS, POND, coastR } from './layout.js';
import { makePerson, animate } from '../characters.js';
import { createUI } from '../ui.js';
import { createQuest } from '../quest.js';
import { createMapView } from '../mapview.js';
import { buildExtras } from './extras.js';
import { mergeByMaterial } from './merge.js';
import { isTouch, stick, initTouch, goLandscape, resetStick } from '../touch.js';

document.body.classList.add('is-mini');

// ---------- Renderer, scene, light ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'default' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
capRenderer(renderer);
const scene = new THREE.Scene();
const SKY = { day: ['#bfe3f5', '#e9f4f8'], sunset: ['#f2b38b', '#f7dcc2'], night: ['#16233d', '#24324f'] };
scene.background = new THREE.Color(SKY.day[0]);
scene.fog = new THREE.Fog(SKY.day[1], 120, 340);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 900);
const hemi = new THREE.HemisphereLight('#ffffff', '#6f8f4f', 1.25);
const sun = new THREE.DirectionalLight('#fff4e0', 1.7);
sun.position.set(60, 120, 40);
scene.add(hemi, sun);

const LAMBERT = new Map();
const mat = (color, extra = {}) => {
  const key = color + JSON.stringify(extra);
  if (!LAMBERT.has(key)) LAMBERT.set(key, new THREE.MeshLambertMaterial({ color, ...extra }));
  return LAMBERT.get(key);
};
const mesh = (geo, m, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  return o;
};
const solids = []; // circles you can't walk into: [x, z, r]

await step('Raising the island', 0.1);
await loadFonts();

// ---------- The island ----------
{
  const water = mesh(new THREE.CircleGeometry(700, 48), new THREE.MeshBasicMaterial({ color: '#69bfd8' }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.6;
  scene.add(water);
  const outline = (inset) => {
    const s = new THREE.Shape();
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      const r = coastR(a) - inset;
      // the shape is drawn in x/y and laid flat, so y here becomes -z
      k ? s.lineTo(Math.cos(a) * r, -Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, -Math.sin(a) * r);
    }
    return s;
  };
  const sand = mesh(new THREE.ShapeGeometry(outline(0), 4), mat('#ecdcae'));
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.25;
  const grass = mesh(new THREE.ShapeGeometry(outline(7), 4), mat('#86c95c'));
  grass.rotation.x = -Math.PI / 2;
  scene.add(sand, grass);
  // the roads, as flat ribbons
  const roadMat = mat('#f2ece0');
  for (const [ax, az, bx, bz, half] of PATHS) {
    const len = Math.hypot(bx - ax, bz - az);
    const r = mesh(new THREE.PlaneGeometry(half * 2, len), roadMat, (ax + bx) / 2, 0.03, (az + bz) / 2);
    r.rotation.x = -Math.PI / 2;
    r.rotation.z = Math.atan2(bx - ax, bz - az);
    scene.add(r);
  }
  // the pond by the Night Lab
  const pond = mesh(new THREE.CircleGeometry(POND.r, 32), mat('#4fb4d8'), POND.x, 0.06, POND.z);
  pond.rotation.x = -Math.PI / 2;
  scene.add(pond);
  // a scatter of low-poly trees round the edge, merged into one mesh per material
  const trunks = [];
  const crowns = [];
  const rnd = (() => {
    let s = 7;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();
  const nearRoad = (x, z) => PATHS.some(([ax, az, bx, bz]) => {
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - (ax + t * dx), z - (az + t * dz)) < 6;
  });
  const nearPlace = (x, z) => PLACES.some((p) => Math.hypot(x - p.x, z - p.z) < (p.id === 'hq' ? 16 : 15));
  for (let k = 0; k < 140; k++) {
    const a = rnd() * Math.PI * 2;
    const r = 30 + rnd() * (coastR(a) - 44);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (nearRoad(x, z) || nearPlace(x, z) || Math.hypot(x - POND.x, z - POND.z) < 12) continue;
    const s = 0.8 + rnd() * 0.8;
    const t = new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 2.4 * s, 6);
    t.translate(x, 1.2 * s, z);
    trunks.push(t);
    const c = new THREE.IcosahedronGeometry(1.8 * s, 0);
    c.translate(x, 3.4 * s, z);
    crowns.push(c);
    solids.push([x, z, 0.8 * s]);
  }
  const merge = (geos) => {
    // a tiny merge (no addons): positions + normals, non-indexed
    const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
    let n = 0;
    for (const g of parts) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3);
    const nor = new Float32Array(n * 3);
    let o = 0;
    for (const g of parts) {
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      o += g.attributes.position.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    return out;
  };
  scene.add(new THREE.Mesh(merge(trunks), mat('#8a6446')));
  scene.add(new THREE.Mesh(merge(crowns), mat('#4f9a45', { flatShading: true })));
}

await step('Building the places', 0.35);

// ---------- The places ----------
const loader = new THREE.TextureLoader();
const boards = []; // { mesh, slug, x, z }
const landmarks = []; // { mesh, place }
const facingTree = (p) => Math.atan2(-p.x, -p.z);

function billboard(slug, x, z, ry, w = 5.6) {
  const pr = PROJECTS[slug];
  if (!pr) return;
  const h = w * 0.62;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  const legs = mat('#2a2f34');
  g.add(mesh(new THREE.BoxGeometry(0.18, 2, 0.18), legs, -w * 0.36, 1, 0), mesh(new THREE.BoxGeometry(0.18, 2, 0.18), legs, w * 0.36, 1, 0));
  g.add(mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.16), mat('#1e2226'), 0, 2 + h / 2, -0.05));
  const tex = loader.load(pr.images[0], (t) => (t.colorSpace = THREE.SRGBColorSpace));
  const face = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: '#ffffff' }), 0, 2 + h / 2, 0.04);
  face.userData.slug = slug;
  g.add(face);
  scene.add(g);
  boards.push({ mesh: face, slug, x, z, title: pr.title });
  solids.push([x, z, w * 0.42]);
}

function gate(p, r) {
  // a gate in the team's colour, facing the tree
  const g = new THREE.Group();
  const a = facingTree(p);
  g.position.set(p.x + Math.sin(a) * r, 0, p.z + Math.cos(a) * r);
  g.rotation.y = a;
  const c = mat(p.color);
  g.add(mesh(new THREE.BoxGeometry(0.8, 5, 0.8), c, -3.2, 2.5, 0), mesh(new THREE.BoxGeometry(0.8, 5, 0.8), c, 3.2, 2.5, 0));
  g.add(mesh(new THREE.BoxGeometry(8, 0.9, 1), c, 0, 5.2, 0));
  g.add(mesh(new THREE.BoxGeometry(6, 0.18, 0.2), mat('#ffffff'), 0, 4.6, 0.5));
  scene.add(g);
  landmarks.push({ mesh: g, place: p });
  const gx = g.position.x;
  const gz = g.position.z;
  solids.push([gx + Math.cos(a) * 3.2, gz - Math.sin(a) * 3.2, 0.7], [gx - Math.cos(a) * 3.2, gz + Math.sin(a) * 3.2, 0.7]);
}

function house(p, { body = '#f3ece0', roof = p.color, w = 7, d = 6, h = 3.6 } = {}) {
  const g = new THREE.Group();
  g.position.set(p.x, 0, p.z);
  g.rotation.y = p.facing ?? facingTree(p);
  g.add(mesh(new THREE.BoxGeometry(w, h, d), mat(body), 0, h / 2, 0));
  const rf = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.3, 2.6, 4), mat(roof, { flatShading: true }), 0, h + 1.3, 0);
  rf.rotation.y = Math.PI / 4;
  g.add(rf);
  g.add(mesh(new THREE.PlaneGeometry(1.4, 2.2), mat('#3a2f27'), 0, 1.1, d / 2 + 0.01));
  scene.add(g);
  landmarks.push({ mesh: g, place: p });
  solids.push([p.x, p.z, Math.max(w, d) * 0.62]);
}

function plaza(p, r) {
  const ring = mesh(new THREE.RingGeometry(r - 0.6, r, 48), mat(p.color), p.x, 0.05, p.z);
  ring.rotation.x = -Math.PI / 2;
  const fill = mesh(new THREE.CircleGeometry(r - 0.6, 48), mat('#f7f3ea'), p.x, 0.045, p.z);
  fill.rotation.x = -Math.PI / 2;
  scene.add(ring, fill);
}

// boards on an arc behind the place, facing back towards the tree
function arcOfBoards(p, slugs, r, spread = 1.5) {
  const back = Math.atan2(p.x, p.z); // pointing away from the tree
  const n = slugs.length;
  slugs.forEach((slug, k) => {
    const off = n > 1 ? (k / (n - 1) - 0.5) * spread : 0;
    const a = back + off;
    billboard(slug, p.x + Math.sin(a) * r, p.z + Math.cos(a) * r, a + Math.PI);
  });
}

for (const p of PLACES) {
  if (p.id === 'hq') {
    // the jamun tree: Creative Direction & Culture
    plaza(p, 11);
    const t = new THREE.Group();
    t.add(mesh(new THREE.CylinderGeometry(0.9, 1.3, 6, 8), mat('#6d4c35'), 0, 3, 0));
    for (const [x, y, z, s] of [[0, 8, 0, 4.4], [2.6, 7, 1.2, 3], [-2.4, 7.2, -1, 3.2], [0.6, 9.8, -1.6, 2.8]]) t.add(mesh(new THREE.IcosahedronGeometry(s, 0), mat('#3f7f3a', { flatShading: true }), x, y, z));
    t.position.set(0, 0, -2);
    scene.add(t);
    landmarks.push({ mesh: t, place: p });
    solids.push([0, -2, 2.2]);
    continue;
  }
  const dept = p.reach === 22;
  if (dept) {
    // the plaza's middle is kept clear for the team's production scene (streamed in as you come
    // near, see extras.js); the gate faces the tree and the work stands round the back
    plaza(p, 12);
    gate(p, 13.5);
    arcOfBoards(p, p.projects.slice(0, 6), 16, 2.3);
  } else {
    plaza(p, p.id === 'lab' ? 7 : 9);
    if (p.id === 'ai') {
      const dome = mesh(new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e9eef2'), p.x, 0, p.z);
      scene.add(dome);
      scene.add(mesh(new THREE.TorusGeometry(5.05, 0.25, 6, 32), mat(p.color), p.x, 0.25, p.z).rotateX(Math.PI / 2));
      landmarks.push({ mesh: dome, place: p });
      solids.push([p.x, p.z, 5.2]);
    } else if (p.id === 'awards') {
      const ob = mesh(new THREE.CylinderGeometry(0.6, 1.4, 9, 4), mat('#f5b700', { flatShading: true }), p.x, 4.5, p.z);
      scene.add(ob);
      landmarks.push({ mesh: ob, place: p });
      solids.push([p.x, p.z, 1.6]);
    } else if (p.id === 'lab') {
      const bench = mesh(new THREE.BoxGeometry(3, 0.5, 0.8), mat('#8a6446'), p.x, 0.5, p.z);
      bench.rotation.y = facingTree(p);
      scene.add(bench);
      landmarks.push({ mesh: bench, place: p });
    } else {
      house(p, { roof: p.id === 'home' ? '#e58fa0' : p.color });
    }
    if (p.projects.length) arcOfBoards(p, p.projects.slice(0, 3), p.id === 'lab' ? 6.5 : 9.5, 1.3);
  }
}

// ---------- The guides: one person at each team, who talks as you pass ----------
const guides = [];
for (const p of onPhone('guides') ? PLACES.filter((q) => q.reach === 22) : []) {
  const g = makePerson({ seed: (Math.abs(p.x * 0.013 + p.z * 0.007) + 0.37) % 1, accent: p.color });
  const a = facingTree(p);
  g.root.position.set(p.x + Math.sin(a) * 11 + Math.cos(a) * 5, 0, p.z + Math.cos(a) * 11 - Math.sin(a) * 5);
  g.root.rotation.y = a;
  scene.add(g.root);
  guides.push({ p: g, place: p, lines: p.quotes || [], asks: NPC_TALK[p.id]?.asks || [] });
  solids.push([g.root.position.x, g.root.position.z, 0.5]);
}

// ---------- More of the full island: meadow, lamps, kites, villagers, the teams at work ----------
await step('Planting the meadow', 0.45);
const extras = buildExtras(scene, { PATHS, PLACES, POND, coastR, lite: Math.min(screen.width, screen.height) < 380 });

// ---------- The sculptures round the tree, and each place's pair of signs at its gate ----------
const pillarAnim = [];
const stones = [];
if (onPhone('sculptures'))
  PILLARS.forEach((pl, k) => {
    const a = THREE.MathUtils.degToRad(-120 + 36 + k * 72);
    const x = Math.cos(a) * 9.8;
    const z = Math.sin(a) * 9.8 - 2; // round the tree, which stands a little back
    const s = makePillar(pl, pillarAnim);
    s.position.set(x, 0, z);
    s.rotation.y = Math.atan2(-x, -(z + 2)); // facing the tree, its name tag on the tree side
    scene.add(s);
    solids.push([x, z, 1.4]);
    stones.push({ pillar: pl, x, z });
  });
if (onPhone('signs')) {
  const cols = [];
  // built apart, then baked into a few meshes: 22 boards of ~30 parts each would cost the phone
  // 600+ draw calls
  const signGroup = new THREE.Group();
  placeSignPairs(signGroup, {
    departments: PLACES.filter((q) => q.reach === 22),
    // the light island's gate stands 13.5 m out: the signs a little past it, towards the tree
    deptEntrance: (h) => {
      const u = new THREE.Vector3(-h.x, 0, -h.z).normalize();
      return { e: new THREE.Vector3(h.x, 0, h.z).addScaledVector(u, 20), u };
    },
    lamps: extras.lamps,
    colliders: cols,
  });
  scene.add(mergeByMaterial(signGroup));
  for (const c of cols) solids.push([c.x, c.z, c.r]);
}

// ---------- Trophies and the hidden places ----------
const trophyMeshes = [];
(onPhone('trophies') ? AWARDS : []).forEach((aw, k) => {
  // between the departments, a little off the ring road
  const a = -Math.PI / 2 + ((k + 0.5) / 6) * Math.PI * 2 + 0.6;
  const r = 52;
  const g = new THREE.Group();
  const gold = mat('#f5b700', { emissive: '#7a5a00', emissiveIntensity: 0.4 });
  g.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.35, 12), gold, 0, 0.18, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), gold, 0, 0.6, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.15, 0.7, 14), gold, 0, 1.2, 0));
  g.position.set(Math.cos(a) * r, 0.4, Math.sin(a) * r);
  scene.add(g);
  trophyMeshes.push({ g, award: aw, taken: false });
});
const HIDDEN = (onPhone('hidden') ? Object.values(CAREERS) : []).map((c, k) => {
  const a = k ? 2.4 : -0.9;
  const r = coastR(a) - 22;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  house({ x, z, color: c.color, facing: Math.atan2(-x, -z) }, { roof: c.color, w: 5, d: 4.5, h: 3 });
  landmarks.pop(); // not a place: found by walking up to it
  return { id: c.id, career: c, x, z };
});
const FOUND_KEY = 'shire-mini-found';
const found = (() => {
  try {
    return new Set(JSON.parse(localStorage.getItem(FOUND_KEY) || '[]'));
  } catch {
    return new Set();
  }
})();
const hiddenList = () => HIDDEN.map((h) => ({ org: h.career.org, years: h.career.years, found: found.has(h.id) }));

// ---------- You ----------
const player = makePerson({
  seed: 0.31, style: 'linen', fem: false, skin: '#a8754f', hair: '#141010', hairStyle: 'quiff', beard: true, top: '#efe7d6', outer: null,
  pants: '#363b46', shoes: '#f4f4f2', sleeves: 'rolled', watch: true, accessory: 'none', noBag: true, scale: 1.02,
});
scene.add(player.root);
const halo = mesh(new THREE.RingGeometry(0.6, 0.78, 32), new THREE.MeshBasicMaterial({ color: '#2f6bff', transparent: true, opacity: 0.5, depthWrite: false }));
halo.rotation.x = -Math.PI / 2;
halo.position.y = 0.06;
scene.add(halo);

const state = { y: 0, vy: 0, mode: 'intro', pos: new THREE.Vector3(0, 0, 15), heading: Math.PI, yaw: 0, dist: 9, height: 4.2, speed: 0, target: null, tourIndex: 0, night: 0 };
const CAMS = [
  { label: 'Classic', dist: 9, height: 4.2 },
  { label: 'Close', dist: 6, height: 2.8 },
  { label: 'Wide', dist: 14, height: 7 },
];
let camI = 0;

// ---------- Interface: the same as the full island ----------
await step('Opening the doors', 0.6);
const ui = createUI({
  owner: OWNER,
  pillars: PILLARS,
  places: PLACES,
  projects: PROJECTS,
  awards: AWARDS,
  contact: CONTACT,
  favourites: FAVOURITES,
  tools: TOOLS,
  awardList: AWARD_LIST,
  onEnter: ({ portrait = false } = {}) => {
    if (isTouch && !portrait) goLandscape();
    setMode('walk');
  },
  onPromptTap: (a) => act(a),
  onBriefs: () => quest.openChooser(),
  onHomeVisit: () => travelTo('home'),
  onTour: () => setMode('tour'),
  onWalk: () => setMode('walk'),
  onRide: () => ui.toast('<b>🚲 The bicycle lives on the full island.</b> Open it on a laptop to ride.', 3200, { quiet: true }),
  onOverview: () => mapView.open('island'),
  onExitRoom: () => {},
  onPlan: () => mapView.open('island'),
  onTravel: (id) => travelTo(id),
  onTourStep: (d) => tourStep(d),
  onExitTour: () => travelTo(PLACES[state.tourIndex].id),
  onTime: () => cycleTime(),
});
const quest = createQuest({
  scene,
  places: PLACES,
  ui,
  camera,
  groundAt: () => 0,
  travelTo: (id) => travelTo(id),
  openProject: (slug) => ui.openProject(slug),
  openWeb: (url, title) => ui.openWeb(url, title),
});
ui.addOverlay({ isOpen: quest.isOpen, close: quest.closeChooser });
ui.attachQuest(quest);
ui.onCampaigns(quest.shipped(), quest.total);
ui.onHidden(found.size, HIDDEN.length, hiddenList());
const mapView = createMapView({
  places: PLACES,
  paths: PATHS,
  pond: POND,
  coastR,
  rooms: {},
  getState: () => ({ room: null, x: state.pos.x, z: state.pos.z, heading: state.heading }),
  onTravel: (go) => travelTo(go.travel ?? go),
  onWalkTo: () => {},
  onOpen: () => {},
  onClose: () => {},
});
ui.addOverlay({ isOpen: mapView.isOpen, close: mapView.close });
// the journey to the full island, for phones that can carry it
document.querySelectorAll('[data-full-island]').forEach((b) => b.addEventListener('click', () => {
  const u = new URL(location.href);
  u.searchParams.delete('mini');
  u.searchParams.set('full', '');
  location.href = u.toString().replace('full=', 'full');
}));

// ---------- Modes, travel, tour ----------
function setMode(mode) {
  state.mode = mode;
  ui.setMode(mode);
  if (mode === 'tour') {
    state.tourIndex = 0;
    goTour();
  } else if (mode === 'walk') {
    ui.hidePlace();
    lastPlaceId = null;
  }
}
function placeFront(p) {
  if (p.id === 'hq') return [0, 15];
  const a = facingTree(p);
  const back = p.reach === 22 ? 19 : p.id === 'lab' ? 9 : 13;
  return [p.x + Math.sin(a) * back, p.z + Math.cos(a) * back];
}
function teleport(x, z, lookX, lookZ) {
  state.pos.set(x, 0, z);
  state.heading = Math.atan2(lookX - x, lookZ - z);
  state.yaw = Math.atan2(-(lookX - x), -(lookZ - z));
  state.target = null;
  snap = true;
}
function travelTo(id) {
  const p = PLACES.find((q) => q.id === id);
  if (!p) return;
  const [x, z] = placeFront(p);
  ui.fade(() => {
    teleport(x, z, p.x, p.z);
    if (state.mode !== 'walk') setMode('walk');
  });
}
function goTour() {
  const p = PLACES[state.tourIndex];
  const [x, z] = placeFront(p);
  teleport(x, z, p.x, p.z);
  ui.showPlace(p, { tour: true, index: state.tourIndex, total: PLACES.length });
  ui.setTourProgress((state.tourIndex + 1) / PLACES.length);
}
function tourStep(d) {
  state.tourIndex = (state.tourIndex + d + PLACES.length) % PLACES.length;
  ui.fade(goTour);
}

// ---------- Time of day: three looks ----------
const TIMES = [
  { id: 'day', label: 'Day', icon: '☀️', hour: 11.5 },
  { id: 'sunset', label: 'Sunset', icon: '🌅', hour: 18.2 },
  { id: 'night', label: 'Night', icon: '🌙', hour: 22 },
];
let timeI = 0;
function applyTime() {
  const t = TIMES[timeI];
  scene.background.set(SKY[t.id][0]);
  scene.fog.color.set(SKY[t.id][1]);
  hemi.intensity = t.id === 'night' ? 0.55 : t.id === 'sunset' ? 1.0 : 1.25;
  sun.intensity = t.id === 'night' ? 0.25 : t.id === 'sunset' ? 1.2 : 1.7;
  sun.color.set(t.id === 'sunset' ? '#ffb27a' : t.id === 'night' ? '#9fb4ff' : '#fff4e0');
  state.night = t.id === 'night' ? 1 : 0;
  extras.setNight(state.night);
  const h = Math.floor(t.hour);
  ui.setClock(`${String(h).padStart(2, '0')}:${String(Math.round((t.hour - h) * 60)).padStart(2, '0')}`, t.hour);
}
function cycleTime() {
  timeI = (timeI + 1) % TIMES.length;
  applyTime();
  ui.setTimeMode(TIMES[timeI]);
  sfx('time');
}
applyTime();
document.getElementById('btn-cam').addEventListener('click', () => {
  camI = (camI + 1) % CAMS.length;
  ui.toast(`<b>🎥 ${CAMS[camI].label} camera</b>`, 1400, { quiet: true });
});

// ---------- Input: the stick, keys, drag to look, tap to walk or open ----------
const keys = new Set();
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (ui.modalOpen()) {
    if (k === 'escape') ui.closeOverlays();
    return;
  }
  keys.add(k);
  if (state.mode === 'intro') {
    if (k === 'enter' || k === ' ') setMode('walk');
    return;
  }
  if (k === 'escape' && !ui.closeOverlays()) ui.hidePlace();
  else if ((k === 'e' || k === 'enter') && nearThing) act(nearThing);
  else if (k === ' ') jump();
  else if (k === 'o') mapView.open('island');
  else if (k === 'j') ui.toggleJournal();
  else if (k === 'i') ui.openAbout();
  else if (k === 't') setMode(state.mode === 'tour' ? 'walk' : 'tour');
  else if (state.mode === 'tour' && (k === 'arrowright' || k === 'arrowleft')) tourStep(k === 'arrowright' ? 1 : -1);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
for (const ev of ['pointerdown', 'keydown', 'touchstart', 'touchend', 'click']) addEventListener(ev, startAudio, { passive: true });

function jump() {
  if (state.mode !== 'walk' || state.y > 0.01) return;
  state.vy = 6.5;
  sfx('jump');
}
initTouch({
  onJump: jump,
  onBell: () => {},
  onGetOff: () => {},
  onUse: () => nearThing && act(nearThing),
  isRiding: () => false,
});
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x;
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.moved = true;
  if (drag.moved && state.mode !== 'intro') state.yaw -= dx * 0.006;
});
canvas.addEventListener('pointerup', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const tap = !drag.moved;
  drag = null;
  if (!tap || state.mode === 'intro' || ui.modalOpen()) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects([...boards.map((b) => b.mesh), ...landmarks.map((l) => l.mesh)], true)[0];
  if (hit) {
    let o = hit.object;
    while (o && !o.userData.slug && !landmarks.some((l) => l.mesh === o)) o = o.parent;
    if (o?.userData.slug) return ui.openProject(o.userData.slug);
    const lm = landmarks.find((l) => l.mesh === o);
    if (lm) return ui.showPlace(lm.place, { expand: true });
  }
  // the ground: walk there
  const g = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), g) && g.distanceTo(state.pos) < 80) state.target = [g.x, g.z];
});
canvas.addEventListener('pointercancel', () => (drag = null));

// ---------- Things to use ----------
let nearThing = null;
function act(a) {
  if (a.kind === 'project') ui.openProject(a.slug);
  else if (a.kind === 'career') ui.openCareer(a.id);
  else if (a.kind === 'place') ui.showPlace(PLACES.find((p) => p.id === a.id), { expand: true });
}

// ---------- The loop ----------
let lastPlaceId = null;
let snap = true;
const clock = new THREE.Clock();
const camPos = new THREE.Vector3();
const look = new THREE.Vector3();
const v = new THREE.Vector3();
const audioState = { pos: new THREE.Vector3(), yaw: 0, room: null, night: 0, speed: 0, running: false, surface: 'grass', coastDist: 100, crowd: 0, woods: 0, droneDist: 999, mode: 'intro', air: 0, riding: false, pedaling: false };
let modalWas = false;

function nearestPlace(x, z) {
  let best = null;
  let bd = Infinity;
  for (const p of PLACES) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < p.reach * 0.6 && d < bd) {
      bd = d;
      best = p;
    }
  }
  if (!best && lastPlaceId) {
    const was = PLACES.find((q) => q.id === lastPlaceId);
    if (was && Math.hypot(x - was.x, z - was.z) < was.reach * 0.75) best = was;
  }
  return best;
}

function move(dt) {
  let ix = 0;
  let iz = 0;
  if (keys.has('w') || keys.has('arrowup')) iz += 1;
  if (keys.has('s') || keys.has('arrowdown')) iz -= 1;
  if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
  if (keys.has('d') || keys.has('arrowright')) ix += 1;
  if (stick.active) {
    ix += stick.x;
    iz += stick.y;
  }
  const fx = -Math.sin(state.yaw);
  const fz = -Math.cos(state.yaw);
  let mx = fx * iz + -fz * ix;
  let mz = fz * iz + fx * ix;
  let mag = Math.min(1, Math.hypot(mx, mz));
  if (mag > 0.05) state.target = null;
  else if (state.target) {
    const dx = state.target[0] - state.pos.x;
    const dz = state.target[1] - state.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.6) state.target = null;
    else {
      mx = dx / d;
      mz = dz / d;
      mag = Math.min(1, d / 2);
    }
  }
  const run = keys.has('shift') || (stick.active && Math.hypot(stick.x, stick.y) > 0.92);
  const speed = mag > 0.05 ? (run ? 11 : 6.5) * mag : 0;
  state.speed += (speed - state.speed) * Math.min(1, dt * 10);
  if (mag > 0.05) {
    const want = Math.atan2(mx, mz);
    const d = Math.atan2(Math.sin(want - state.heading), Math.cos(want - state.heading));
    state.heading += d * Math.min(1, dt * 12);
    const l = Math.hypot(mx, mz) || 1;
    state.pos.x += (mx / l) * state.speed * dt;
    state.pos.z += (mz / l) * state.speed * dt;
  }
  // stay on the island, and out of the solid things
  const a = Math.atan2(state.pos.z, state.pos.x);
  const r = Math.hypot(state.pos.x, state.pos.z);
  const edge = coastR(a) - 9;
  if (r > edge) state.pos.multiplyScalar(edge / r);
  for (const [x, z, rr] of solids.concat(extras.solids)) {
    const dx = state.pos.x - x;
    const dz = state.pos.z - z;
    const d = Math.hypot(dx, dz);
    const min = rr + 0.45;
    if (d < min && d > 1e-4) {
      state.pos.x = x + (dx / d) * min;
      state.pos.z = z + (dz / d) * min;
    }
  }
}

let lastStone = null;
function proximity(t) {
  if (state.mode !== 'walk') {
    ui.prompt(null);
    nearThing = null;
    ui.speech(null);
    return;
  }
  const p = nearestPlace(state.pos.x, state.pos.z);
  const id = p ? p.id : null;
  if (id !== lastPlaceId) {
    lastPlaceId = id;
    if (p) ui.showPlace(p, { auto: true });
    else ui.hidePlace({ auto: true });
  }
  // the nearest billboard or hidden place within reach
  let best = null;
  let bd = 4.5;
  for (const b of boards) {
    const d = Math.hypot(state.pos.x - b.x, state.pos.z - b.z);
    if (d < bd) {
      bd = d;
      best = { kind: 'project', slug: b.slug, label: b.title, verb: 'View project' };
    }
  }
  for (const h of HIDDEN) {
    const d = Math.hypot(state.pos.x - h.x, state.pos.z - h.z);
    if (d < 7) {
      if (!found.has(h.id)) {
        found.add(h.id);
        try {
          localStorage.setItem(FOUND_KEY, JSON.stringify([...found]));
        } catch {
          /* private mode */
        }
        sfx('trophy');
        ui.toast(`<b>✨ You found a hidden place: ${h.career.org}.</b><br>${h.career.years}. Step up to it and tap Use. (${found.size}/${HIDDEN.length})`, 6500, { priority: 2, kind: 'reward' });
        ui.onHidden(found.size, HIDDEN.length, hiddenList());
      }
      if (d < bd + 3) best = { kind: 'career', id: h.id, label: h.career.org, verb: 'Step inside' };
    }
  }
  nearThing = best;
  ui.prompt(best);
  // the sculptures round the tree: stand by one to read it
  let stone = null;
  for (const st of stones) if (Math.hypot(state.pos.x - st.x, state.pos.z - st.z) < 2.8) stone = st;
  if (stone !== lastStone) {
    lastStone = stone;
    if (stone) ui.toast(`<b>${stone.pillar.rune} ${stone.pillar.name}</b><br>${stone.pillar.text}`, 6000);
  }
  // trophies
  for (const tr of trophyMeshes) {
    if (tr.taken) continue;
    tr.g.rotation.y = t * 1.5;
    tr.g.position.y = 0.4 + Math.sin(t * 2 + tr.g.position.x) * 0.15;
    if (Math.hypot(state.pos.x - tr.g.position.x, state.pos.z - tr.g.position.z) < 2.2) {
      tr.taken = true;
      tr.g.visible = false;
      ui.collectTrophy(tr.award);
    }
  }
  // the guide nearest you says something from the team's own lines
  let say = null;
  for (const g of guides) {
    const d = g.p.root.position.distanceTo(state.pos);
    if (d < 7 && (g.lines.length || g.asks.length)) {
      v.copy(g.p.root.position).setY(2.3).project(camera);
      // a line about the team, then a work question for you, turn about
      const turn = Math.floor(t / 6);
      const asking = g.asks.length && (turn % 2 === 1 || !g.lines.length);
      const pool = asking ? g.asks : g.lines;
      if (v.z < 1) say = { name: asking ? `${g.place.name} lead asks you` : `${g.place.name} lead`, text: pool[Math.floor(turn / 2) % pool.length], color: g.place.color, x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
    }
  }
  ui.speech(say);
}

function labels() {
  for (const p of PLACES) {
    v.set(p.x, p.reach === 22 ? 7.5 : 6, p.z).project(camera);
    const dist = camera.position.distanceTo(v.set(p.x, 3, p.z));
    v.set(p.x, p.reach === 22 ? 7.5 : 6, p.z).project(camera);
    const visible = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
    const range = state.mode === 'walk' ? 70 : 480;
    ui.placeLabel(p.id, (v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight, visible && lastPlaceId !== p.id && dist < range, dist);
  }
}

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  const modalNow = ui.modalOpen();
  if (modalNow && !modalWas) resetStick();
  modalWas = modalNow;
  if (state.mode === 'walk' && !modalNow) move(dt);
  else state.speed *= 0.8;
  if (state.y > 0 || state.vy > 0) {
    state.vy -= 18 * dt;
    state.y = Math.max(0, state.y + state.vy * dt);
    if (state.y === 0) state.vy = 0;
  }
  player.root.position.copy(state.pos);
  player.root.position.y = state.y;
  player.root.rotation.y = state.heading;
  player.root.visible = state.mode !== 'intro';
  halo.position.set(state.pos.x, 0.06, state.pos.z);
  halo.visible = player.root.visible;
  animate(player, state.y > 0.05 ? 'jump' : 'walk', t, state.speed);
  for (const g of guides) animate(g.p, Math.hypot(g.p.root.position.x - state.pos.x, g.p.root.position.z - state.pos.z) < 7 ? 'talk' : 'idle', t, 0);

  // the camera: a slow orbit over the island on the title screen, behind you otherwise
  if (state.mode === 'intro') {
    const a = t * 0.05;
    camPos.set(Math.sin(a) * 120, 70, Math.cos(a) * 120);
    look.set(0, 0, 0);
  } else {
    const c = CAMS[camI];
    camPos.set(state.pos.x + Math.sin(state.yaw) * c.dist, c.height, state.pos.z + Math.cos(state.yaw) * c.dist);
    look.set(state.pos.x, 1.5, state.pos.z);
  }
  // a fixed shot, for screenshots and debugging: __shire.state.shot = { pos: [x, y, z], look: [x, y, z] }
  if (state.shot) {
    camPos.fromArray(state.shot.pos);
    look.fromArray(state.shot.look);
    snap = true;
  }
  if (snap) {
    camera.position.copy(camPos);
    snap = false;
  } else camera.position.lerp(camPos, Math.min(1, dt * (state.mode === 'intro' ? 1 : 6)));
  camera.lookAt(look);

  for (const f of pillarAnim) f(t);
  extras.update(t, dt, state.mode === 'intro' ? camera.position : state.pos, state.mode !== 'intro');
  proximity(t);
  labels();
  quest.update(t, dt, { pos: state.pos, indoorId: null, mode: state.mode, blocked: modalNow });

  const A = audioState;
  A.pos.copy(state.pos);
  A.yaw = state.yaw;
  A.night = state.night;
  A.speed = state.speed;
  A.running = state.speed > 8;
  A.mode = state.mode;
  A.surface = 'grass';
  A.coastDist = coastR(Math.atan2(state.pos.z, state.pos.x)) - Math.hypot(state.pos.x, state.pos.z);
  A.crowd = Math.max(0, 1 - Math.min(...PLACES.map((p) => Math.hypot(state.pos.x - p.x, state.pos.z - p.z))) / 40);
  try {
    updateAudio(A, dt);
  } catch {
    /* sound is a nicety */
  }
  renderer.render(scene, camera);
}

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 350));

await step('Painting the billboards', 0.9);
await finishLoading({ renderer, scene, camera, render: () => renderer.render(scene, camera) });
renderer.setAnimationLoop(frame);
hideLoader();
ui.ready();

window.__shire = { mini: true, ui, state, setMode, travelTo, places: PLACES, scene, renderer, mapView, quest };
