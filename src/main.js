import { capRenderer } from './compat.js'; // first: Safari fixes and the phone texture limit
import * as THREE from 'three';
import { step, finishLoading, hideLoader } from './loading.js';
import { loadFonts } from './type.js';
import { startAudio, sfx, updateAudio, addFilm, audioDebug } from './audio.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import './style.css';
import './theme.css';
import './mobile.css';
import { OWNER, PILLARS, CENTER, HAMLETS, DEPARTMENTS, LAB, HOME, FUN, AIHUB, HALL, PROJECTS, AWARDS, ASSETS, NPC_TALK, CONTACT, FAVOURITES, TOOLS, AWARD_LIST } from './data.js';
import {
  buildSky, makeSkyMaterial, buildClouds, buildTerrain, buildGrass, buildLavender, buildFlowers, buildMountains, buildTrees, buildPollen,
  heightAt, groundAt, walkY, POND, PATHS, WORLD_RADIUS, buildOcean, SEA_LEVEL, coastR, onPaving, BAZAAR, distToPath,
} from './world.js';
import { buildMonoliths, buildSkyRail, buildFloatingProps, buildStreetLamps, buildCoast, PIERS } from './landmarks.js';
import { buildInteriors } from './interiors.js';
import { createDayNight } from './daynight.js';
import { buildVillage, playerPos, setSolids, Walker } from './village.js';
import { makePerson, animate, hit } from './characters.js';
import { createUI } from './ui.js';
import { createRide } from './ride.js';
import { buildStory } from './story.js';
import { buildGallery } from './gallery.js';
import { declutter } from './declutter.js';
import { buildHidden } from './hidden.js';
import { buildPond } from './pond.js';
import { buildWayfinding } from './arena.js';
import { snapshotMatrices, groundFit } from './groundfit.js';
import galleryLayout from './content/gallery-layout.json';
import { createQuest } from './quest.js';
import { createNav } from './nav.js';
import { buildGrid, findPath } from './pathfind.js';
import { createMapView } from './mapview.js';
import { isTouch, stick, stickKeys, initTouch, goLandscape, resetStick } from './touch.js';

// ---------- Renderer, scene, light ----------

const canvas = document.getElementById('scene');
// Lighter settings for phones and weak GPUs (or force with ?lite).
const LITE = new URLSearchParams(location.search).has('lite') || matchMedia('(hover: none)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1.25 : 1.75));
capRenderer(renderer);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#d3e9f4', 170, 620);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 2000);

// Environment map from the sky, so the white metal reflects blue sky and green land.
const ISLAND_ENV = { tex: null, room: null };
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), makeSkyMaterial()));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(100, 32), new THREE.MeshBasicMaterial({ color: '#5d9a3c' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -8;
  envScene.add(ground);
  scene.environment = ISLAND_ENV.tex = pmrem.fromScene(envScene, 0.03).texture;
  scene.environmentIntensity = 1.0;
  // indoors, metals reflect a warm neutral room instead of sky and grass (gold stays gold)
  ISLAND_ENV.room = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
}
if (ASSETS.skybox) {
  new THREE.TextureLoader().load(ASSETS.skybox, (t) => {
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
  });
}

const hemi = new THREE.HemisphereLight('#cfe9ff', '#4f7d32', 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 3.3);
const SUN_DIR = new THREE.Vector3(0.55, 0.62, 0.35).normalize();
sun.castShadow = true;
sun.shadow.mapSize.setScalar(LITE ? 1024 : 2048);
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
function setShadowRange(r) {
  const c = sun.shadow.camera;
  c.left = c.bottom = -r;
  c.right = c.top = r;
  c.near = 1;
  c.far = 500;
  c.updateProjectionMatrix();
}
setShadowRange(50);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.5, 0.95);
if (!LITE) composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- World ----------

// Everything on the island lives in `outdoor`, so it can be hidden when you step inside a building.
await step('Setting the type', 0.02);
await loadFonts(); // signs and labels are painted with these fonts, so they must be here first
await step('Raising the island', 0.05);
const outdoor = new THREE.Group();
outdoor.name = 'outdoor';
scene.add(outdoor);
// name whatever a builder adds to the island after the builder
function named(name, fn) {
  const before = new Set(outdoor.children);
  const out = fn();
  for (const o of outdoor.children) if (!before.has(o) && !o.name) o.name = name;
  return out;
}
const sky = named('sky', () => buildSky(outdoor));
const updateClouds = named('clouds', () => buildClouds(outdoor));
const { terrain } = named('terrain', () => buildTerrain(outdoor));
const ocean = named('ocean', () => buildOcean(outdoor));
await step('Planting grass and flowers', 0.18);
const grassWind = buildGrass(outdoor, LITE ? 60000 : 180000);
const lavWind = buildLavender(outdoor, LITE ? 6000 : 14000);
const flowerWind = buildFlowers(outdoor, LITE ? 4000 : 10000);
await step('Growing the woods', 0.3);
named('mountains', () => buildMountains(outdoor));
const colliders = [];
const trees = named('trees', () => buildTrees(outdoor, colliders));
const monoliths = named('monoliths', () => buildMonoliths(outdoor, colliders));
const updateRail = named('skyrail', () => buildSkyRail(outdoor, colliders));
const pond = named('pond', () => buildPond(outdoor, colliders));
const lampSpots = named('lamps', () => buildStreetLamps(outdoor, colliders));
await step('Building the piers', 0.38);
const coast = named('coast', () => buildCoast(outdoor, colliders));
const updateProps = named('floating-props', () => buildFloatingProps(outdoor));
const updatePollen = named('pollen', () => buildPollen(outdoor));
await step('Building the hamlets', 0.45);
const village = buildVillage(outdoor);
const dayNight = createDayNight({ scene, root: outdoor, sun, hemi, sky, renderer, bloom, ocean: ocean });
await step('Furnishing the rooms', 0.78);
const rooms = buildInteriors(scene);
for (const room of Object.values(rooms)) room.interactables.push({ kind: 'exit', label: 'Back to the island', verb: 'Exit', reach: 1.4, x: room.origin.x + room.exit.x, z: room.origin.z + room.exit.z });
colliders.push(...village.colliders);

// ---------- Player: Vibhor ----------

const player = makePerson({
  seed: 0.31, style: 'linen', fem: false, skin: '#a8754f', hair: '#141010', hairStyle: 'quiff', beard: true, top: '#efe7d6', outer: null,
  pants: '#363b46', shoes: '#f4f4f2', sleeves: 'rolled', watch: true, accessory: 'none', noBag: true, scale: 1.02,
});
const halo = new THREE.Mesh(
  new THREE.RingGeometry(0.6, 0.78, 40),
  new THREE.MeshBasicMaterial({ color: '#2f6bff', transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })
);
halo.rotation.x = -Math.PI / 2;
halo.position.y = 0.05;
player.root.add(halo);
scene.add(player.root);

const marker = new THREE.Mesh(
  new THREE.RingGeometry(0.35, 0.55, 28),
  new THREE.MeshBasicMaterial({ color: '#2f6bff', transparent: true, opacity: 0.85, depthWrite: false })
);
marker.rotation.x = -Math.PI / 2;
marker.visible = false;
scene.add(marker);

const state = {
  mode: 'intro',
  pos: new THREE.Vector3(0, 0, 15),
  vy: 0,
  air: 0,
  heading: Math.PI,
  speed: 0,
  target: null,
  yaw: 0,
  pitch: 0.3,
  dist: 7,
  ovYaw: 0.6,
  ovPitch: 0.95,
  ovDist: 190,
  tourIndex: 0,
  tourT: 0,
};
state.pos.y = heightAt(state.pos.x, state.pos.z);


// ---------- The bicycle: parked outside Home, ridden anywhere outdoors ----------
const ride = (() => {
  const rot = HOME.facing; // Home's front faces its lane
  const lx = 3.6;
  const lz = 3.2;
  const home = { x: HOME.x + lx * Math.cos(rot) + lz * Math.sin(rot), z: HOME.z - lx * Math.sin(rot) + lz * Math.cos(rot), heading: rot };
  return createRide({ scene: outdoor, player, state, colliders, npcs: village.npcs, groundAt, walkY, heightAt, SEA_LEVEL, jettyAt: (x, z) => jettyAt(x, z), onFerry: (x, z) => coast.onFerry(x, z), ui: { toast: (...a) => ui.toast(...a) }, home });
})();
village.interactables.push(ride.interact);

// ---------- Places ----------

const PLACES = [
  { ...CENTER, x: 0, z: 0, y: heightAt(0, 0), reach: 16 },
  ...DEPARTMENTS.map((h) => ({ ...h, reach: 22 })),
  { ...LAB, reach: 9 },
  { ...FUN, reach: 16 },
  { ...HOME, reach: 16 },
  { ...AIHUB, reach: 17 },
  { ...HALL, reach: 16 },
];

// Level 3 wayfinding: fingerposts at the tree, at the piers and at the Gallery's lane
named('wayfinding', () => buildWayfinding(outdoor, { places: PLACES, piers: PIERS, colliders, groundAt }));

// the place card and pass open only once you're properly inside a place, not on its outskirts
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
  return best;
}

function leaveRoomNow() {
  nav.leaveNow();
}

function travelTo(id) {
  const p = PLACES.find((q) => q.id === id);
  if (!p) return;
  if (ride.active) ride.dismount();
  leaveRoomNow();
  let x, z;
  if (p.id === 'hq') {
    x = 0;
    z = 15;
  } else if (['lab', 'home', 'fun', 'ai', 'awards'].includes(p.id)) {
    // arrive on the place's own lane, a few steps short of its front
    const back = p.id === 'lab' ? 7 : p.id === 'home' ? 14 : p.id === 'gallery' ? 17 : 20;
    const f = p.facing ?? Math.atan2(-p.x, -p.z);
    x = p.x + Math.sin(f) * back;
    z = p.z + Math.cos(f) * back;
  } else {
    x = p.x - Math.cos(p.angle) * 8;
    z = p.z - Math.sin(p.angle) * 8;
  }
  state.pos.set(x, walkY(x, z), z);
  const dx = p.x - x;
  const dz = p.z - z;
  state.heading = Math.atan2(dx, dz);
  state.yaw = Math.atan2(-dx, -dz);
  state.pitch = camPreset.pitch;
  state.dist = camPreset.dist;
  clearRoute();
  nav.guard = null;
  setMode('walk', { snap: true });
}

// the brief board and the campaign threads over the island
const story = buildStory(outdoor, { colliders, interactables: village.interactables, clickables: village.clickables, groundAt, places: PLACES });
story.board.name = 'brief-board';
// two hidden places, off the paths: the Grofers years in the woods, the Razorpay years by the sea
const hidden = buildHidden(outdoor, { colliders, interactables: village.interactables, clickables: village.clickables });
// clear the trees and monoliths standing where they were built (the Gallery courtyard too)
for (const sp of hidden.spots) {
  for (const it of trees.items) if (!it.out && Math.hypot(it.x - sp.x, it.z - sp.z) < (sp.clear ?? 12)) ((it.out = true), trees.hide(it));
  for (const it of monoliths.items) {
    if (it.out || Math.hypot(it.x - sp.x, it.z - sp.z) > (sp.clear ?? 13)) continue;
    it.out = true;
    for (const m of it.meshes) m.parent?.remove(m);
    const k = colliders.indexOf(it.collider);
    if (k >= 0) colliders.splice(k, 1);
  }
}
// no tree or monolith may stand in front of a sign: once before the gallery is placed (so it has
// room) and once after (for the gallery's own screens)
const clutter = { trees, monoliths: { ...monoliths, colliders } };
declutter(outdoor, clutter, { merge: false });
// screens, towers and lamp banners full of the work, in a layout solved so nothing hides anything
// else (re-solve with ?solve after moving things on the island)
// The roadside screens, rotating towers and lamp banners have moved into the Gallery courtyard;
// what stays out on the island is the pair of hill boards seen from across it.
const gallery = buildGallery(outdoor, { colliders, lamps: lampSpots, clickables: village.clickables, layout: galleryLayout.filter((it) => it.type === 'hill'), solve: new URLSearchParams(location.search).has('solve') });
declutter(outdoor, clutter);
// every walking villager now routes round (and is kept out of) the island's solid footprints
setSolids(colliders);

// ---------- UI ----------

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
    // on phones in landscape, ask for full screen (Android Chrome honours it; iPhone Safari can't);
    // someone who chose to stay upright isn't swung round
    if (isTouch && !portrait) goLandscape();
    setMode('walk');
  },
  onPromptTap: (a) => act(a),
  onBriefs: () => quest.openChooser(),
  onHomeVisit: () => travelTo('home'),
  onTour: () => setMode('tour'),
  onWalk: () => setMode('walk'),
  onRide: () => {
    if (state.indoor) act({ kind: 'ride-out' });
    else ride.bring();
  },
  onOverview: () => openMap(),
  onExitRoom: () => exitRoom(),
  onPlan: () => mapView.open('plan'),
  onTravel: (id) => travelTo(id),
  onTourStep: (d) => tourStep(d),
  onExitTour: () => travelTo(PLACES[state.tourIndex].id),
  onTime: () => {
    ui.setTimeMode(dayNight.cycle());
    sfx('time');
  },
});

// Run a campaign: carry a real brief through every team it went through
const quest = createQuest({
  scene: outdoor,
  places: PLACES,
  ui,
  camera,
  groundAt,
  travelTo: (id) => travelTo(id),
  openProject: (slug) => ui.openProject(slug),
  openWeb: (url, title) => ui.openWeb(url, title),
});
ui.addOverlay({ isOpen: quest.isOpen, close: quest.closeChooser });

// ---------- Navigation: where you are, and the only way in and out of the buildings ----------
const nav = createNav({
  state, rooms, places: PLACES, scene, hemi, outdoor, ui, sfx, dayNight, walkY, setShadowRange,
  islandEnv: () => ISLAND_ENV.tex,
  applyIndoorLight: (room) => applyIndoorLight(room),
  now: () => elapsed,
  beforeTransition: () => {
    keys.clear();
    marker.visible = false;
  },
  afterTransition: (dir, room) => {
    lastPlaceId = null;
    snapCamera = true;
    marker.visible = false;
    if (dir === 'in') {
      const cam = nav.entry(room.id)?.camera || { dist: 5.5, pitch: 0.5 };
      state.pitch = Math.min(camPreset.pitch, cam.pitch);
      state.dist = Math.min(camPreset.dist, cam.dist);
      ui.setIndoor(PLACES.find((p) => p.id === room.id));
    } else ui.setIndoor(null);
  },
});
nav.register(village.interactables);

// the map card: presentation only. Indoors it opens on the floor plan; it never moves you.
const zoneAt = (room, lx, lz) => room.plan?.zones?.find((z) => lx >= z.x0 && lx <= z.x1 && lz >= z.z0 && lz <= z.z1) || null;
const mapView = createMapView({
  places: PLACES,
  paths: PATHS,
  pond: POND,
  coastR,
  rooms,
  getState: () => {
    const room = state.indoor;
    const lx = room ? state.pos.x - room.origin.x : 0;
    const lz = room ? state.pos.z - room.origin.z : 0;
    const zn = room ? zoneAt(room, lx, lz) : null;
    return {
      room, lx, lz, x: state.pos.x, z: state.pos.z, heading: state.heading,
      zone: zn?.id, zoneName: zn?.name,
      door: room ? nav.entry(room.id)?.door : null,
      people: room ? (room.residents || []).map((r) => ({ x: r.pos.x - room.origin.x, z: r.pos.z - room.origin.z, color: r.color })) : [],
    };
  },
  onTravel: (id) => {
    if (state.indoor?.id === id) return;
    travelTo(id);
  },
  onWalkTo: (x, z, name) => {
    if (state.mode !== 'walk') setMode('walk');
    if (goTo(x, z).length) ui.toast(`<b>Walking to ${name}.</b>`, 1800, { quiet: true });
  },
  onOpen: () => nav.setPresentation('map'),
  onClose: () => nav.setPresentation('play'),
});
ui.addOverlay({ isOpen: mapView.isOpen, close: mapView.close });
function openMap() {
  if (state.indoor) return mapView.isOpen() ? mapView.close() : mapView.open('plan');
  setMode(state.mode === 'overview' ? 'walk' : 'overview');
}
ui.onCampaigns(quest.shipped(), quest.total);
const hiddenList = () => hidden.spots.map((sp) => ({ org: sp.career.org, years: sp.career.years, found: found.has(sp.id) }));
const found = (() => {
  try {
    return new Set(JSON.parse(localStorage.getItem('shire-found') || '[]'));
  } catch {
    return new Set();
  }
})();
ui.onHidden(found.size, hidden.spots.length, hiddenList());
ui.attachQuest(quest);

function setMode(mode, { snap = false } = {}) {
  const prev = state.mode;
  if (mode !== 'walk' && ride.active) ride.dismount();
  // the bird's-eye view is of the island: from inside a building, the map card opens instead and
  // you stay exactly where you are
  if (mode === 'overview' && state.indoor) return mapView.open('island');
  if (mode === 'tour') leaveRoomNow();
  state.mode = mode;
  ui.setMode(mode);
  setShadowRange(mode === 'walk' ? 50 : 150);
  if (mode === 'tour') {
    if (prev !== 'tour') state.tourIndex = 0;
    state.tourT = 0;
    ui.showPlace(PLACES[state.tourIndex], { tour: true, index: state.tourIndex, total: PLACES.length });
  }
  if (mode === 'walk') {
    ui.hidePlace();
    lastPlaceId = null;
  }
  if (mode === 'overview') ui.hidePlace();
  if (snap) snapCamera = true;
}

function tourStep(d) {
  state.tourIndex = (state.tourIndex + d + PLACES.length) % PLACES.length;
  state.tourT = 0;
  ui.showPlace(PLACES[state.tourIndex], { tour: true, index: state.tourIndex, total: PLACES.length });
}

// ---------- Sound ----------
// Browsers only allow sound after a click or key press; the first one starts the engine.
for (const ev of ['pointerdown', 'keydown', 'touchstart', 'touchend', 'click']) window.addEventListener(ev, startAudio, { passive: true });
// the soundtracks of Vibhor's films, playing where those films live on the island
{
  const at = (room, x, z) => ({ x: room.origin.x + x, z: room.origin.z + z });
  addFilm({ url: 'audio/lab-time.m4a', pos: { x: LAB.x, z: LAB.z }, radius: 18, gain: 0.7 });
  addFilm({ url: 'audio/ai-creator.m4a', room: 'ai', pos: at(rooms.ai, 0, -14), radius: 14, gain: 0.55 });
  const fs = rooms.fun.sounds || { ring: [-13.8, 7.1], power: [13, -4] };
  addFilm({ url: 'audio/ring-game.m4a', room: 'fun', pos: at(rooms.fun, ...fs.ring), radius: 8, gain: 0.8 });
  addFilm({ url: 'audio/power.m4a', room: 'fun', pos: at(rooms.fun, ...fs.power), radius: 9, gain: 2.2 });
}
const rideSpeedEl = document.getElementById('ride-speed');
const audioState = { pos: new THREE.Vector3(), yaw: 0, room: null, night: 0, speed: 0, running: false, surface: 'grass', coastDist: 100, crowd: 0, woods: 0, droneDist: 999, mode: 'intro', air: 0 };
const camDir = new THREE.Vector3();
function feedAudio(dt) {
  const A = audioState;
  const x = state.pos.x;
  const z = state.pos.z;
  A.pos.copy(state.pos);
  camera.getWorldDirection(camDir);
  A.yaw = Math.atan2(-camDir.x, -camDir.z);
  A.room = state.indoor ? state.indoor.id : null;
  A.night = dayNight.state.night;
  A.speed = state.speed;
  A.running = state.speed > 6;
  A.riding = ride.active;
  A.pedaling = ride.active && keys.has('w');
  A.air = state.air;
  A.mode = state.mode;
  const r = Math.hypot(x, z);
  A.coastDist = coastR(Math.atan2(z, x)) - r;
  A.surface = state.indoor ? 'indoor' : coast.onFerry(x, z) !== null || jettyAt(x, z) ? 'wood' : onPaving(x, z) ? 'path' : groundAt(x, z) < SEA_LEVEL + 2.6 ? 'sand' : 'grass';
  let near = Infinity;
  for (const h of HAMLETS) near = Math.min(near, Math.hypot(x - h.x, z - h.z));
  const bz = Math.hypot(x - (BAZAAR.ax + BAZAAR.bx) / 2, z - (BAZAAR.az + BAZAAR.bz) / 2);
  A.crowd = Math.max(Math.max(0, 1 - near / 40), Math.max(0, 1 - bz / 30) * 1.3);
  A.woods = Math.max(0, Math.min(1, (r - 100) / 14));
  let dd = Infinity;
  for (const d of village.drones) dd = Math.min(dd, d.position.distanceTo(state.pos));
  A.droneDist = dd;
  updateAudio(A, dt);
}

// ---------- Input ----------

const keys = new Set();
let nearThing = null;
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (ui.modalOpen()) {
    if (k === 'escape') ui.closeOverlays();
    else if (k === 'arrowright' || k === 'arrowleft') ui.stepGallery(k === 'arrowright' ? 1 : -1);
    return;
  }
  // seated in front of the art: ← → move between the works, E opens the one in view
  const focus = state.seat?.focus;
  if (focus && (k === 'arrowleft' || k === 'arrowright' || k === 'e' || k === 'enter')) {
    if (k === 'e' || k === 'enter') ui.openProject(focus.targets[focus.index].slug);
    else {
      focus.index = (focus.index + (k === 'arrowright' ? 1 : -1) + focus.targets.length) % focus.targets.length;
      showFocus(focus);
    }
    e.preventDefault();
    return;
  }
  keys.add(k);
  if (state.mode === 'intro') {
    if (k === 'enter' || k === ' ') setMode('walk');
    return;
  }
  if (k === 'o') openMap();
  else if (k === 't') setMode(state.mode === 'tour' ? 'walk' : 'tour');
  else if (k === 'h') ui.toggleHire();
  else if (k === 'i') showHome();
  else if (k === 'c') setCameraPreset();
  else if (k === 'm') ui.toggleMissions();
  else if (k === 'j') quest.openChooser();
  else if (k === 'l') {
    ui.setTimeMode(dayNight.cycle());
    sfx('time');
  }
  else if (ride.active && (k === 'x' || k === 'e')) {
    // on the bike, E still works for things right beside you when you've stopped
    if (k === 'e' && nearThing && nearThing.kind !== 'ride' && Math.abs(ride.speed) < 1.5) act(nearThing);
    else ride.dismount();
  }
  else if ((k === 'e' || k === 'enter') && nearThing) act(nearThing);
  else if (k === 'f' && state.mode === 'walk') waveAtNeighbours();
  else if (k === ' ' && state.mode === 'walk' && state.air === 0 && !ride.active) {
    state.vy = 6.5;
    sfx('jump');
  }
  else if (k === 'escape') {
    if (ui.closeOverlays()) return;
    if (state.indoor) exitRoom();
    else if (state.mode === 'tour') travelTo(PLACES[state.tourIndex].id);
    else if (state.mode === 'overview') setMode('walk');
    else ui.hidePlace();
  } else if (/^[0-9]$/.test(k) && PLACES[Number(k)]) travelTo(PLACES[Number(k)].id);
  else if (state.mode === 'tour' && (k === 'arrowright' || k === 'arrowleft')) tourStep(k === 'arrowright' ? 1 : -1);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

// ---------- Touch ----------
let touchHop = false;
let modalWas = false;
initTouch({
  onJump: () => {
    if (ride.active) touchHop = true;
    else if (state.mode === 'walk' && state.air === 0) {
      state.vy = 6.5;
      sfx('jump');
    }
  },
  onBell: () => sfx('bell', { gap: 0.4 }),
  onGetOff: () => ride.dismount(),
  onUse: () => {
    if (nearThing) act(nearThing);
  },
  isRiding: () => ride.active,
});
window.addEventListener('blur', () => keys.clear());

const pointers = new Map();
let drag = null;
let pinchDist = 0;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    drag = null;
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) {
    hover(e);
    return;
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    zoom((pinchDist - d) * 4);
    pinchDist = d;
    return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
  if (state.mode === 'overview') {
    state.ovYaw -= dx * 0.005;
    state.ovPitch = THREE.MathUtils.clamp(state.ovPitch + dy * 0.004, 0.3, 1.45);
  } else if (state.mode === 'walk') {
    state.yaw -= dx * 0.006;
    state.pitch = THREE.MathUtils.clamp(state.pitch + dy * 0.004, -0.15, 1.2);
  }
});
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(e) {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  // inside, walls stop the pick: you can't click through one to something in the next room
  const wall = state.indoor?.blockers?.length ? raycaster.intersectObjects(state.indoor.blockers, false)[0] : null;
  const wd = wall ? wall.distance : Infinity;
  let h = raycaster.intersectObjects(state.indoor ? state.indoor.clickables : village.clickables, false)[0];
  let ground = raycaster.intersectObject(state.indoor ? state.indoor.floor : terrain)[0];
  if (h && h.distance > wd) h = null;
  if (ground && ground.distance > wd) ground = null;
  if (h && (!ground || h.distance < ground.distance)) {
    const ud = h.object.userData;
    const normal = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : null;
    return { action: ud.action || { kind: 'project', slug: ud.slug }, at: h.point, normal };
  }
  return ground ? { point: ground.point } : null;
}
let lastHover = 0;
// clicking a thing: if you're beside it, use it; otherwise walk up to it first, then turn and use it
// `normal` is the clicked surface's facing: you walk to a spot in front of it, never round the back
// of a wall to the nearest point on the other side
function useFromAfar(action, at, normal) {
  if (!at || state.mode !== 'walk' || ride.active || action.kind === 'exit') return act(action);
  const d = Math.hypot(at.x - state.pos.x, at.z - state.pos.z);
  const reach = action.kind === 'enter' ? 1.6 : 2.6;
  const facing = normal && Math.hypot(normal.x, normal.z) > 0.5 ? normal : null;
  const inFront = !facing || (state.pos.x - at.x) * facing.x + (state.pos.z - at.z) * facing.z > 0;
  if (d < reach + 0.4 && inFront) {
    state.heading = Math.atan2(at.x - state.pos.x, at.z - state.pos.z);
    return act(action);
  }
  // doors: walk to the doorway itself, so you go in the way you would on foot
  const door = action.kind === 'enter' ? nav.entry(action.room)?.door : null;
  let tx = door ? door.x : at.x;
  let tz = door ? door.z : at.z;
  if (!door && facing) {
    const l = Math.hypot(facing.x, facing.z);
    tx += (facing.x / l) * 1.4;
    tz += (facing.z / l) * 1.4;
  }
  goTo(tx, tz, { action, x: tx, z: tz, fx: at.x, fz: at.z, reach: facing ? 1.0 : reach });
}
function hover(e) {
  const now = performance.now();
  if (now - lastHover < 80 || state.mode === 'intro') return;
  lastHover = now;
  canvas.style.cursor = pick(e)?.action ? 'pointer' : '';
}
canvas.addEventListener('pointerup', (e) => {
  pointers.delete(e.pointerId);
  if (drag && !drag.moved && (state.mode === 'walk' || state.mode === 'overview')) {
    const res = pick(e);
    if (res?.action) useFromAfar(res.action, res.at, res.normal);
    else if (res?.point && (state.indoor || heightAt(res.point.x, res.point.z) > SEA_LEVEL + 0.5 || jettyAt(res.point.x, res.point.z) || coast.onFerry(res.point.x, res.point.z) !== null)) {
      goTo(res.point.x, res.point.z);
    }
  }
  if (pointers.size === 0) drag = null;
});
canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
function zoom(delta) {
  if (state.mode === 'overview') state.ovDist = THREE.MathUtils.clamp(state.ovDist * (1 + delta * 0.001), 60, 320);
  else if (state.mode === 'walk') state.dist = THREE.MathUtils.clamp(state.dist * (1 + delta * 0.001), 2.8, 30);
}
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom(e.deltaY);
}, { passive: false });

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}
window.addEventListener('resize', resize);
// phones report the new size a beat after rotating; iOS also resizes as the toolbars show and hide
window.addEventListener('orientationchange', () => setTimeout(resize, 350));
window.visualViewport?.addEventListener('resize', resize);

// ---------- Player movement ----------

const PLAYER_R = 0.45;
const dir = new THREE.Vector2();

// ----- Routes: click somewhere and walk there; click something and walk up to it, then use it -----
let routeStall = 0;
let routeBest = Infinity;
const grids = {};
const gridFor = (room) => (grids[room.id] ||= buildGrid(room, PLAYER_R - 0.04));
function clearRoute() {
  state.path = null;
  state.target = null;
  state.pending = null;
  marker.visible = false;
}
// walk to (x, z); indoors the route goes round walls and furniture, through the open passages
function goTo(x, z, pending = null) {
  let path = [{ x, z }];
  if (state.indoor) path = findPath(gridFor(state.indoor), state.pos.x, state.pos.z, x, z) || [];
  state.path = path;
  state.pending = pending;
  routeStall = 0;
  routeBest = Infinity;
  const end = path[path.length - 1];
  state.target = end ? new THREE.Vector3(end.x, 0, end.z) : null;
  marker.visible = !!end && !pending;
  if (!end && pending) arrive();
  return path;
}
function arrive(stuck = false) {
  const p = state.pending;
  state.path = null;
  state.target = null;
  marker.visible = false;
  if (!p) return;
  state.pending = null;
  // only use it if you actually got there (or near enough that it's plainly what you meant)
  const d = Math.hypot(p.x - state.pos.x, p.z - state.pos.z);
  if (stuck && d > p.reach + 2.5) {
    ui.toast('<b>Can’t get any closer.</b> Walk round, or press <kbd>E</kbd> when you’re beside it.', 2400, { quiet: true });
    return;
  }
  state.heading = Math.atan2((p.fx ?? p.x) - state.pos.x, (p.fz ?? p.z) - state.pos.z);
  state.speed = 0; // stop, turn to it, use it
  act(p.action);
}
function movePlayer(dt) {
  let rideKeys = ui.modalOpen() || state.mode !== 'walk' ? new Set() : stickKeys(keys);
  if (touchHop) {
    rideKeys = new Set(rideKeys).add(' ');
    touchHop = false;
  }
  ride.update(elapsed, dt, rideKeys);
  if (ride.active) {
    animate(player, 'cycle', elapsed, state.speed);
    halo.visible = false;
    return;
  }
  let ix = 0;
  let iz = 0;
  const playing = (state.mode === 'walk' || state.mode === 'overview') && elapsed > ride.stunned;
  // an overlay opening over a held thumb-stick lets go of it, so you don't walk off on closing it
  const modalNow = ui.modalOpen();
  if (modalNow && !modalWas) resetStick();
  modalWas = modalNow;
  if (playing && !modalNow) {
    if (keys.has('w') || keys.has('arrowup')) iz += 1;
    if (keys.has('s') || keys.has('arrowdown')) iz -= 1;
    if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
    if (keys.has('d') || keys.has('arrowright')) ix += 1;
    if (state.mode === 'walk') {
      if (keys.has('q')) state.yaw += dt * 1.8;
      if (keys.has('e') && !nearThing) state.yaw -= dt * 1.8;
    }
    // the thumb-stick: analog, so a gentle push walks slowly
    if (stick.active) {
      ix = stick.x;
      iz = stick.y;
    }
  }
  if (state.seat) {
    if (ix || iz || state.path?.length || state.mode !== 'walk') {
      // up you get, a step forward off the seat
      state.pos.x += Math.sin(state.heading) * 0.7;
      state.pos.z += Math.cos(state.heading) * 0.7;
      state.seat = null;
      state.forcePose = null;
    } else {
      state.pos.x = state.seat.x;
      state.pos.z = state.seat.z;
      state.heading = state.seat.heading;
      state.speed = 0;
      state.pos.y = (state.indoor ? state.indoor.origin.y : walkY(state.pos.x, state.pos.z)) + (state.seat.y || 0);
      player.root.position.copy(state.pos);
      player.root.rotation.y = state.heading;
      animate(player, state.forcePose, elapsed, 0);
      halo.visible = false;
      return;
    }
  }
  const stickMag = stick.active ? Math.min(1, Math.hypot(stick.x, stick.y)) : 1;
  const yaw = state.mode === 'overview' ? state.ovYaw : state.yaw;
  let moving = false;
  if (ix || iz) {
    clearRoute();
    dir.set(-Math.sin(yaw) * iz + Math.cos(yaw) * ix, -Math.cos(yaw) * iz - Math.sin(yaw) * ix).normalize();
    moving = true;
  } else if (state.path?.length) {
    // following a route: through the open passages, one waypoint at a time
    const wp = state.path[0];
    const dx = wp.x - state.pos.x;
    const dz = wp.z - state.pos.z;
    const d = Math.hypot(dx, dz);
    const last = state.path.length === 1;
    if (d < (last ? 0.35 : 0.55)) {
      state.path.shift();
      routeStall = 0;
      routeBest = Infinity;
      if (!state.path.length) arrive();
    } else {
      dir.set(dx / d, dz / d);
      moving = true;
      // stuck against something the route didn't know about (a person, a bike): give up gracefully
      if (d > routeBest - 0.02) routeStall += dt;
      else {
        routeBest = d;
        routeStall = 0;
      }
      if (routeStall > 0.9) {
        arrive(true);
        moving = false;
      }
    }
  }
  // close enough to what you clicked: turn to it and use it
  if (state.pending && Math.hypot(state.pending.x - state.pos.x, state.pending.z - state.pos.z) < state.pending.reach) {
    arrive();
    moving = false;
  }
  const running = keys.has('shift') || (stick.active && stickMag > 0.93) || (state.target && !state.indoor && Math.hypot(state.target.x - state.pos.x, state.target.z - state.pos.z) > 18);
  const want = moving ? (running ? 9 : 4.2 * Math.max(0.35, stickMag)) : 0;
  state.speed = THREE.MathUtils.lerp(state.speed, want, Math.min(1, dt * 7));
  if (moving) {
    let diff = Math.atan2(dir.x, dir.y) - state.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    state.heading += diff * Math.min(1, dt * 10);
  }
  const prevX = state.pos.x;
  const prevZ = state.pos.z;
  if (state.speed > 0.01) {
    state.pos.x += Math.sin(state.heading) * state.speed * dt;
    state.pos.z += Math.cos(state.heading) * state.speed * dt;
  }
  const room = state.indoor;
  for (const c of room ? room.colliders : colliders) {
    if (c.box) {
      const b = c.box;
      if (state.pos.x > b.minX - PLAYER_R && state.pos.x < b.maxX + PLAYER_R && state.pos.z > b.minZ - PLAYER_R && state.pos.z < b.maxZ + PLAYER_R) {
        // push out along the shallowest axis
        const pushes = [b.minX - PLAYER_R - state.pos.x, b.maxX + PLAYER_R - state.pos.x, b.minZ - PLAYER_R - state.pos.z, b.maxZ + PLAYER_R - state.pos.z];
        const k = pushes.reduce((best, v, i) => (Math.abs(v) < Math.abs(pushes[best]) ? i : best), 0);
        if (k < 2) state.pos.x += pushes[k];
        else state.pos.z += pushes[k];
      }
      continue;
    }
    const dx = state.pos.x - c.x;
    const dz = state.pos.z - c.z;
    const min = c.r + PLAYER_R;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      state.pos.x = c.x + (dx / d) * min;
      state.pos.z = c.z + (dz / d) * min;
    }
  }
  let ground;
  if (room) {
    const b = room.bounds;
    const lx = state.pos.x - room.origin.x;
    const lz = state.pos.z - room.origin.z;
    // walking out through the door takes you back outside
    if (nav.walkedOut(lx, lz)) exitRoom();
    // the exit may already have happened (no fade to wait for): you're outside now, leave it be
    if (state.indoor !== room) return;
    state.pos.x = room.origin.x + THREE.MathUtils.clamp(lx, b.minX, b.maxX);
    state.pos.z = room.origin.z + THREE.MathUtils.clamp(lz, b.minZ, b.maxZ);
    ground = room.origin.y;
  } else {
    const deckY = coast.onFerry(state.pos.x, state.pos.z);
    const onJetty = jettyAt(state.pos.x, state.pos.z);
    if (!onJetty && deckY === null && heightAt(state.pos.x, state.pos.z) < SEA_LEVEL + 0.5) {
      // the sea stops you at the water's edge
      state.pos.x = prevX;
      state.pos.z = prevZ;
      clearRoute();
    }
    const pier = jettyAt(state.pos.x, state.pos.z);
    const deck = coast.onFerry(state.pos.x, state.pos.z);
    ground = deck !== null ? deck : pier ? pier.y : walkY(state.pos.x, state.pos.z);
    // standing on a hidden pavilion's plinth
    for (const sp of hidden.spots) if (Math.hypot(state.pos.x - sp.x, state.pos.z - sp.z) < 7.6) ground = Math.max(ground, sp.y + 0.15);
  }
  state.vy -= 18 * dt;
  state.air += state.vy * dt;
  if (state.air <= 0) {
    if (state.vy < -4) sfx('land');
    state.air = 0;
    state.vy = Math.max(0, state.vy);
  }
  state.pos.y = ground + state.air;
  player.root.position.copy(state.pos);
  player.root.rotation.y = state.heading;
  animate(player, state.forcePose && state.speed < 1 ? state.forcePose : state.air > 0.05 ? 'jump' : 'walk', elapsed, state.speed);
  halo.visible = state.air < 0.05;
  if (state.target) {
    marker.position.set(state.target.x, (state.indoor ? state.indoor.origin.y : walkY(state.target.x, state.target.z)) + 0.05, state.target.z);
    marker.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.15);
  }
}

// the pier under (x, z), if any
function jettyAt(x, z) {
  for (const j of coast.piers) {
    const px = x - j.x0;
    const pz = z - j.z0;
    const along = px * j.dx + pz * j.dz;
    const lateral = Math.abs(px * j.dz - pz * j.dx);
    if (along > -1 && along < j.len && lateral < j.half) return j;
  }
  return null;
}

// ---------- Going indoors ----------

const INDOOR = {
  ai: { bg: '#060b16', hemi: ['#cfe9ff', '#24315a', 1.45], sun: ['#e6f4ff', 1.9], exp: 1.08, bloom: [0.28, 0.84] },
  home: { bg: '#f4e9db', hemi: ['#fff1de', '#e2c6ae', 1.4], sun: ['#ffe6c4', 2.2], exp: 1.0, bloom: [0.12, 0.95], env: 0.5 },
  fun: { bg: '#120a1c', hemi: ['#ffd9f0', '#3a2244', 1.3], sun: ['#ffd7a8', 1.7], exp: 1.12, bloom: [0.3, 0.82] },
  awards: { bg: '#121119', hemi: ['#fff4dc', '#4a4236', 1.45], sun: ['#fff1cf', 2.4], exp: 1.05, bloom: [0.22, 0.88], env: 0.7 },
};
function applyIndoorLight(room) {
  const L = INDOOR[room.id];
  scene.fog = null;
  scene.background = new THREE.Color(L.bg);
  scene.environment = ISLAND_ENV.room;
  hemi.color.set(L.hemi[0]);
  hemi.groundColor.set(L.hemi[1]);
  hemi.intensity = L.hemi[2];
  sun.color.set(L.sun[0]);
  sun.intensity = L.sun[1];
  renderer.toneMappingExposure = L.exp;
  scene.environmentIntensity = L.env ?? 0.6;
  bloom.strength = L.bloom[0];
  bloom.threshold = L.bloom[1];
  sun.target.position.set(room.origin.x, 0, room.origin.z);
  sun.position.set(room.origin.x + 6, 40, room.origin.z + 10);
}

function enterRoom(id) {
  if (ride.active) ride.dismount();
  nav.enter(id);
}

function exitRoom() {
  nav.exit();
}

// ---------- Camera ----------

const camPos = new THREE.Vector3(140, 100, 140);
const camLook = new THREE.Vector3();
let snapCamera = false;
const camRay = new THREE.Raycaster();
const camDirV = new THREE.Vector3();
const desiredPos = new THREE.Vector3();
const desiredLook = new THREE.Vector3();
// Three camera presets, cycled with C or the HUD camera button
const CAMERAS = [
  { id: 'close', label: 'Close', dist: 3.4, pitch: 0.1, shoulder: 0.75, lookY: 1.55, fov: 62 },
  { id: 'classic', label: 'Classic', dist: 7, pitch: 0.3, shoulder: 0.6, lookY: 1.6, fov: 55 },
  { id: 'drone', label: 'Drone', dist: 22, pitch: 1.12, shoulder: 0, lookY: 1.0, fov: 50 },
];
let camPreset = CAMERAS[1];
function setCameraPreset(next) {
  camPreset = next ?? CAMERAS[(CAMERAS.indexOf(camPreset) + 1) % CAMERAS.length];
  state.dist = camPreset.dist;
  state.pitch = camPreset.pitch;
  document.querySelector('#btn-cam span').textContent = camPreset.label;
  sfx('camera');
  if (state.mode === 'walk') ui.toast(`<b>🎥 ${camPreset.label} camera</b>`, 1400, { quiet: true });
}
document.getElementById('btn-cam').addEventListener('click', () => setCameraPreset());

const orbitPoint = (out, c, yaw, pitch, dist) =>
  out.set(c.x + Math.sin(yaw) * Math.cos(pitch) * dist, c.y + Math.sin(pitch) * dist, c.z + Math.cos(yaw) * Math.cos(pitch) * dist);

function updateCamera(dt, t) {
  let k = 4;
  if (state.mode === 'intro') {
    desiredLook.set(0, 6, 0);
    orbitPoint(desiredPos, desiredLook, t * 0.035 + 0.6, 0.42, 165);
    k = 1.5;
  } else if (state.mode === 'overview') {
    desiredLook.set(state.pos.x * 0.35, 0, state.pos.z * 0.35);
    orbitPoint(desiredPos, desiredLook, state.ovYaw, state.ovPitch, state.ovDist);
    k = 3;
  } else if (state.mode === 'tour') {
    const p = PLACES[state.tourIndex];
    state.tourT += dt;
    desiredLook.set(p.x, p.y + 3.5, p.z);
    const base = p.angle !== undefined ? Math.atan2(-Math.cos(p.angle), -Math.sin(p.angle)) : 0.6;
    const dist = p.id === 'hq' ? 34 : p.id === 'lab' ? 16 : 28;
    orbitPoint(desiredPos, desiredLook, base + Math.sin(state.tourT * 0.12) * 0.7, 0.36, dist);
    k = 1.6;
    ui.setTourProgress(Math.min(1, state.tourT / 10));
    if (state.tourT > 10) tourStep(1);
  } else {
    if (state.speed > 0.5 && !drag) {
      let diff = state.heading + Math.PI - state.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      // on the bike the camera chases harder, so corners stay readable
      state.yaw += diff * Math.min(1, dt * (ride.active ? 2.6 : 0.9));
    }
    desiredLook.set(state.pos.x, state.pos.y + camPreset.lookY - (ride.active ? 0.2 : 0), state.pos.z);
    // riding pulls the camera back a little as you pick up speed
    const rideBack = ride.active ? 1.2 + Math.min(3, state.speed * 0.25) : 0;
    orbitPoint(desiredPos, desiredLook, state.yaw, state.pitch, state.dist + rideBack);
    // over-the-shoulder offset, GTA style
    desiredPos.x += Math.cos(state.yaw) * camPreset.shoulder;
    desiredPos.z -= Math.sin(state.yaw) * camPreset.shoulder;
    if (camPreset.shoulder) {
      desiredLook.x += Math.cos(state.yaw) * camPreset.shoulder * 0.5;
      desiredLook.z -= Math.sin(state.yaw) * camPreset.shoulder * 0.5;
    }
    if (state.indoor) {
      const R = state.indoor;
      desiredPos.x = R.origin.x + THREE.MathUtils.clamp(desiredPos.x - R.origin.x, -R.w / 2 + 0.4, R.w / 2 - 0.4);
      desiredPos.z = R.origin.z + THREE.MathUtils.clamp(desiredPos.z - R.origin.z, -R.d / 2 + 0.4, R.d / 2 - 0.4);
      desiredPos.y = THREE.MathUtils.clamp(desiredPos.y, R.origin.y + 0.6, R.origin.y + R.h - 0.5);
      // inner walls: never let one come between the camera and you; pull in in front of it instead
      if (R.blockers?.length) {
        camRay.set(desiredLook, camDirV.subVectors(desiredPos, desiredLook).normalize());
        camRay.far = desiredPos.distanceTo(desiredLook);
        const hitWall = camRay.intersectObjects(R.blockers, false)[0];
        if (hitWall) desiredPos.copy(desiredLook).addScaledVector(camDirV, Math.max(0.6, hitWall.distance - 0.35));
      }
    } else {
      const ground = groundAt(desiredPos.x, desiredPos.z) + 0.8;
      if (desiredPos.y < ground) desiredPos.y = ground;
    }
    k = 7;
  }
  // seated in front of the art: the camera settles on one work at a time
  if (state.seat?.focus && state.mode === 'walk') {
    const ft = state.seat.focus.targets[state.seat.focus.index];
    desiredPos.fromArray(ft.pos);
    desiredLook.fromArray(ft.look);
    k = 2.2;
  }
  // a fixed shot, for screenshots and debugging: __shire.state.shot = { pos: [x, y, z], look: [x, y, z] }
  if (state.shot) {
    desiredPos.fromArray(state.shot.pos);
    desiredLook.fromArray(state.shot.look);
    snapCamera = true;
  }
  const a = snapCamera ? 1 : 1 - Math.exp(-dt * k);
  snapCamera = false;
  camPos.lerp(desiredPos, a);
  camLook.lerp(desiredLook, a);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  const fov = state.mode === 'walk' ? camPreset.fov + (ride.active ? Math.min(12, state.speed * 0.9) : 0) : 55;
  if (Math.abs(camera.fov - fov) > 0.05) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 1 - Math.exp(-dt * 5));
    camera.updateProjectionMatrix();
  }

  const far = state.mode === 'walk' ? 620 : 950;
  const near = state.mode === 'walk' ? 170 : 320;
  if (state.indoor) return;
  scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, far, 1 - Math.exp(-dt * 2));
  scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, near, 1 - Math.exp(-dt * 2));
  const focus = state.mode === 'walk' ? state.pos : camLook;
  sun.target.position.copy(focus);
  sun.position.copy(focus).addScaledVector(dayNight.state.sunDir, 200);
}

// ---------- Proximity: departments, projects, stones, trophies, chatter ----------

let lastPlaceId = null;
let lastStone = null;
const tmpV = new THREE.Vector3();
function updateProximity(t) {
  if (state.mode !== 'walk') {
    ui.prompt(null);
    nearThing = null;
    ui.speech(null);
    ui.thoughts([]);
    return;
  }
  let p = state.indoor ? PLACES.find((q) => q.id === state.indoor.id) : nearestPlace(state.pos.x, state.pos.z);
  // you're in a place from 60% of its reach and stay in it until 75%: standing on the edge
  // doesn't make it come and go
  if (!state.indoor && !p && lastPlaceId) {
    const was = PLACES.find((q) => q.id === lastPlaceId);
    if (was && Math.hypot(state.pos.x - was.x, state.pos.z - was.z) < was.reach * 0.75) p = was;
  }
  const id = p ? p.id : null;
  if (id !== lastPlaceId) {
    lastPlaceId = id;
    // indoors the room's guide card tells the story, so the place card only opens on request;
    // on phones walking in shows a small arrival card rather than the whole panel
    if (p && !state.indoor) ui.showPlace(p, { auto: true });
    else ui.hidePlace({ auto: true });
  }
  // things to interact with: project billboards, the mailbox, the poster wall...
  let best = null;
  let bd = 3;
  for (const pr of state.indoor ? [] : village.projects) {
    const d = Math.hypot(state.pos.x - pr.x, state.pos.z - pr.z);
    if (d < bd) {
      bd = d;
      best = { kind: 'project', slug: pr.slug, label: PROJECTS[pr.slug].title, verb: 'View project' };
    }
  }
  for (const it of state.indoor ? state.indoor.interactables : village.interactables) {
    const d = Math.hypot(state.pos.x - it.x, state.pos.z - it.z);
    if (d < (it.reach ? Math.min(bd, it.reach) : bd)) {
      bd = d;
      best = it;
    }
  }
  nearThing = best;
  // walking right up to a door takes you inside
  if (nav.shouldWalkIn(best, bd)) enterRoom(best.room);
  ui.prompt(best);
  // stones
  let stone = null;
  for (const s of village.stones) if (Math.hypot(state.pos.x - s.x, state.pos.z - s.z) < 2.6) stone = s;
  if (stone !== lastStone) {
    lastStone = stone;
    if (stone) ui.toast(`<b>${stone.pillar.rune} ${stone.pillar.name}</b><br>${stone.pillar.text}`, 6000);
  }
  // hidden places: the first time you find one
  if (!state.indoor) {
    for (const sp of hidden.spots) {
      if (found.has(sp.id) || Math.hypot(state.pos.x - sp.x, state.pos.z - sp.z) > 14) continue;
      found.add(sp.id);
      try {
        localStorage.setItem('shire-found', JSON.stringify([...found]));
      } catch {}
      sfx('trophy');
      ui.toast(`<b>✨ You found a hidden place: ${sp.career.org}.</b><br>${sp.career.years}. Step inside and press <kbd>E</kbd>. (${found.size}/${hidden.spots.length})`, 6500, { priority: 2, kind: 'reward' });
      ui.onHidden(found.size, hidden.spots.length, hiddenList());
    }
  }
  // trophies
  if (!state.indoor) village.trophies.forEach((tr, i) => {
    if (tr.collected) return;
    if (Math.hypot(state.pos.x - tr.x, state.pos.z - tr.z) < 2.6) {
      tr.collected = true;
      tr.g.visible = false;
      tr.beam.visible = false;
      if (rooms.home.cups[i]) rooms.home.cups[i].visible = true;
      ui.collectTrophy(tr.award);
    }
  });
  updateNpcs(t);
}

// ---------- Villagers: look at you, think, ask, and fall over when you run into them ----------

const npcPos = new THREE.Vector3();
const npcQuat = new THREE.Quaternion();
const tmpDir = new THREE.Vector3();
const allNpcs = [...village.npcs, ...Object.values(rooms).flatMap((r) => r.npcs)];
allNpcs.forEach((n, i) => {
  n.i = i;
  n.talk = NPC_TALK[n.dept] || NPC_TALK.hq;
  n.role = n.name || n.talk.roles[i % n.talk.roles.length];
  n.color = PLACES.find((p) => p.id === n.dept)?.color || CENTER.color;
  n.deptName = PLACES.find((p) => p.id === n.dept)?.name || '';
});

function updateNpcs(t) {
  let asker = null;
  // someone speaks only when you've stopped right beside them, as if you'd come to talk
  let ad = state.speed < 1.5 ? 1.6 : 0;
  for (const n of state.indoor ? state.indoor.npcs : village.npcs) {
    if (!n.p.root.visible) continue; // eaten by the T-rex, back after lunch
    n.p.root.getWorldPosition(npcPos);
    const dx = npcPos.x - state.pos.x;
    const dz = npcPos.z - state.pos.z;
    const d = Math.hypot(dx, dz);
    n.d = d;
    // bumping into people
    if (d < 0.8 && state.speed > 1.2 && Math.abs(npcPos.y - state.pos.y) < 1.5) {
      n.p.root.getWorldQuaternion(npcQuat);
      tmpDir.set(dx, 0, dz).normalize().applyQuaternion(npcQuat.invert());
      const type = state.speed > 6 || n.rider ? 'fall' : 'stumble';
      if (hit(n.p, type, tmpDir, elapsed)) {
        sfx('bump');
        state.speed *= 0.3;
        if (type === 'fall') ui.toast(`<b>Oops!</b> You knocked over a ${n.role.toLowerCase()}. They’ll be fine.`, 2500);
      }
    }
    // people are solid: you can't walk through them
    if (d < 0.72 && d > 1e-4 && !(n.p.react && n.p.react.type === 'fall') && Math.abs(npcPos.y - state.pos.y) < 1.5) {
      const push = 0.72 - d;
      state.pos.x -= (dx / d) * push;
      state.pos.z -= (dz / d) * push;
    }
    // look at the player when close
    if (d < 7 && !n.p.react) {
      n.p.root.getWorldQuaternion(npcQuat);
      tmpDir.set(-dx, 0, -dz).applyQuaternion(npcQuat.invert());
      n.p.look = THREE.MathUtils.clamp(Math.atan2(tmpDir.x, tmpDir.z), -1.2, 1.2);
      n.p.lookW = Math.min(1, n.p.lookW + 0.08);
    } else n.p.lookW = Math.max(0, n.p.lookW - 0.05);
    if (d < ad && !n.rider) {
      ad = d;
      asker = n;
    }
  }
  // only the person you walk up to says anything: what they'd ask you, and what's on their mind
  if (asker) {
    npcPos.copy(asker.p.parts.head.getWorldPosition(npcPos));
    npcPos.y += 0.45;
    npcPos.project(camera);
    // one line at a time, and who's talking in plain words: a named guide by name, anyone else
    // by the team they belong to (people walk between teams, so the plaza alone doesn't say)
    const lines = asker.lines || asker.talk.asks;
    const text = lines[(asker.i + Math.floor(elapsed / 6)) % lines.length];
    const name = asker.lines ? asker.role : asker.deptName ? `${asker.deptName} team` : asker.role;
    if (npcPos.z < 1) ui.speech({ text, name, color: asker.color, x: (npcPos.x * 0.5 + 0.5) * innerWidth, y: (-npcPos.y * 0.5 + 0.5) * innerHeight });
    else ui.speech(null);
  } else ui.speech(null);
  ui.thoughts([]);
}

function waveAtNeighbours() {
  sfx('wave');
  let n = 0;
  for (const v of state.indoor ? state.indoor.npcs : village.npcs) {
    if (v.d < 9 && !v.p.react) {
      v.p.react = { type: 'wave', t0: elapsed };
      n++;
    }
  }
  ui.toast(n ? `<b>👋 You waved.</b> ${n} ${n === 1 ? 'person waves' : 'people wave'} back.` : '<b>👋</b> Nobody close enough to wave back.', 2200);
}

// About Vibhor: the one about page, reachable from anywhere
function showHome() {
  ui.openAbout();
}

// sitting down somewhere (beside Nikita on the sofa): any move gets you up again
function sitDown(seat) {
  if (!seat) return;
  clearRoute();
  state.seat = seat;
  state.pos.set(seat.x, state.pos.y, seat.z);
  state.heading = seat.heading;
  state.yaw = seat.heading + Math.PI;
  state.speed = 0;
  state.forcePose = seat.pose || 'sit';
  if (seat.focus) showFocus(seat.focus);
  else ui.toast('<b>You sit down.</b> Move to get up again.', 2200, { quiet: true });
}
function showFocus(focus) {
  const t = focus.targets[focus.index];
  ui.toast(`<b>${t.title}</b><br>${focus.index + 1} of ${focus.targets.length} · <kbd>←</kbd> <kbd>→</kbd> next · <kbd>E</kbd> open · <kbd>W</kbd> get up`, 6000, { quiet: true });
}

function act(a) {
  if (!a) return;
  if (a.kind !== 'enter' && a.kind !== 'exit' && a.kind !== 'project') sfx('interact');
  if (a.label === 'The cat') sfx('purr');
  if (a.kind === 'ride') return ride.mount();
  if (a.kind === 'ride-out') {
    exitRoom();
    setTimeout(() => ride.bring(), 700);
    return;
  }
  if (/coffee|chai/i.test(a.label || '')) sfx('sip');
  if (a.kind === 'project') ui.openProject(a.slug);
  else if (a.kind === 'contact') ui.toggleHire(true, true);
  else if (a.kind === 'home') ui.showPlace(PLACES.find((p) => p.id === 'home'));
  else if (a.kind === 'fun') ui.showPlace(PLACES.find((p) => p.id === 'fun'));
  else if (a.kind === 'poster') ui.toast(`<b>${a.item.title}</b> ${a.item.year ? `(${a.item.year})` : ''}<br>${a.item.note || ''}`, 6000);
  else if (a.kind === 'enter') enterRoom(a.room);
  else if (a.kind === 'exit') exitRoom();
  else if (a.kind === 'toast') ui.toast(a.text, 5000);
  else if (a.kind === 'call') a.fn?.();
  else if (a.kind === 'sit') sitDown(a.seat);
  else if (a.kind === 'kick') a.kick(state.heading);
  else if (a.kind === 'link') ui.openWeb(a.url, a.title || a.label);
  else if (a.kind === 'hire') ui.toggleHire(true);
  else if (a.kind === 'place') ui.showPlace(PLACES.find((p) => p.id === a.id));
  else if (a.kind === 'screen') ui.openProject(a.screen.userData.action.slug);
  else if (['tools', 'awards', 'leadership', 'playbook'].includes(a.kind)) ui.showInfo(a.kind);
  else if (a.kind === 'briefs') quest.openChooser();
  else if (a.kind === 'career') ui.openCareer(a.id);
}

// ---------- Labels & minimap ----------

const anchor = new THREE.Vector3();
function updateLabels() {
  for (const p of PLACES) {
    anchor.set(p.x, p.y + (p.id === 'hq' ? 17 : p.id === 'lab' ? 7 : 13), p.z);
    const dist = anchor.distanceTo(camera.position);
    anchor.project(camera);
    const visible = !state.indoor && anchor.z < 1 && Math.abs(anchor.x) < 1.1 && Math.abs(anchor.y) < 1.1 && state.mode !== 'intro';
    const near = state.mode === 'walk' && lastPlaceId === p.id;
    // walking, a place's name appears only as you approach it (the bird's-eye map still shows them all)
    const range = state.mode === 'walk' ? 30 : 480;
    ui.placeLabel(p.id, (anchor.x * 0.5 + 0.5) * window.innerWidth, (-anchor.y * 0.5 + 0.5) * window.innerHeight, visible && !near && dist < range, dist);
  }
}

const mini = document.getElementById('minimap');
const mctx = mini.getContext('2d');
function drawMinimap() {
  const S = mini.width;
  const cx = S / 2;
  if (state.indoor) {
    // floor plan of the room you're in
    const R = state.indoor;
    const sc = (S - 40) / Math.max(R.w, R.d);
    mctx.save();
    mctx.clearRect(0, 0, S, S);
    mctx.beginPath();
    mctx.rect(0, 0, S, S);
    mctx.clip();
    mctx.fillStyle = '#0f172a';
    mctx.fillRect(0, 0, S, S);
    mctx.translate(cx, cx);
    mctx.fillStyle = 'rgba(255,255,255,0.08)';
    mctx.strokeStyle = 'rgba(255,255,255,0.6)';
    mctx.lineWidth = 2;
    mctx.fillRect((-R.w / 2) * sc, (-R.d / 2) * sc, R.w * sc, R.d * sc);
    // the rooms, the one you're in lit up, and the walls between them
    const lx = state.pos.x - R.origin.x;
    const lz = state.pos.z - R.origin.z;
    for (const zn of R.plan?.zones || []) {
      const here = lx >= zn.x0 && lx <= zn.x1 && lz >= zn.z0 && lz <= zn.z1;
      mctx.fillStyle = here ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.04)';
      mctx.fillRect(zn.x0 * sc, zn.z0 * sc, (zn.x1 - zn.x0) * sc, (zn.z1 - zn.z0) * sc);
    }
    mctx.strokeRect((-R.w / 2) * sc, (-R.d / 2) * sc, R.w * sc, R.d * sc);
    mctx.beginPath();
    for (const [ax, az, bx, bz] of R.plan?.walls || []) {
      mctx.moveTo(ax * sc, az * sc);
      mctx.lineTo(bx * sc, bz * sc);
    }
    mctx.stroke();
    for (const res of R.residents || []) {
      mctx.fillStyle = res.color || '#f4c95d';
      mctx.beginPath();
      mctx.arc((res.pos.x - R.origin.x) * sc, (res.pos.z - R.origin.z) * sc, 4, 0, Math.PI * 2);
      mctx.fill();
    }
    mctx.fillStyle = '#4ade80';
    mctx.fillRect(-1.5 * sc, (R.d / 2) * sc - 3, 3 * sc, 6);
    for (const it of R.interactables) {
      if (it.kind === 'call' || it.kind === 'sit' || it.kind === 'kick') continue;
      mctx.fillStyle = it.kind === 'exit' ? '#4ade80' : PLACES.find((p) => p.id === R.id)?.color || '#fff';
      mctx.beginPath();
      mctx.arc((it.x - R.origin.x) * sc, (it.z - R.origin.z) * sc, 2.5, 0, Math.PI * 2);
      mctx.fill();
    }
    mctx.translate((state.pos.x - R.origin.x) * sc, (state.pos.z - R.origin.z) * sc);
    mctx.rotate(Math.PI - state.heading);
    mctx.fillStyle = '#ffffff';
    mctx.beginPath();
    mctx.moveTo(0, -8);
    mctx.lineTo(6, 6);
    mctx.lineTo(0, 3);
    mctx.lineTo(-6, 6);
    mctx.closePath();
    mctx.fill();
    mctx.restore();
    return;
  }
  // GTA-style: the map rotates with the camera and is centred on the player.
  const scale = (S / 2) / 70;
  const yaw = state.mode === 'overview' ? state.ovYaw : state.yaw;
  mctx.save();
  mctx.clearRect(0, 0, S, S);
  mctx.beginPath();
  mctx.rect(0, 0, S, S);
  mctx.clip();
  mctx.fillStyle = '#5fa53b';
  mctx.fillRect(0, 0, S, S);
  mctx.translate(cx, cx);
  mctx.rotate(yaw);
  mctx.scale(scale, scale);
  mctx.translate(-state.pos.x, -state.pos.z);
  mctx.fillStyle = 'rgba(160,140,220,0.35)';
  mctx.strokeStyle = '#f2f3ef';
  mctx.lineWidth = 5.2;
  mctx.lineCap = 'round';
  for (const [ax, az, bx, bz] of PATHS) {
    mctx.beginPath();
    mctx.moveTo(ax, az);
    mctx.lineTo(bx, bz);
    mctx.stroke();
  }
  mctx.strokeStyle = 'rgba(255,255,255,0.55)';
  mctx.lineWidth = 1.5;
  mctx.beginPath();
  mctx.arc(0, 0, 104, 0, Math.PI * 2);
  mctx.stroke();
  mctx.fillStyle = '#4fb4d8';
  mctx.beginPath();
  mctx.arc(POND.x, POND.z, POND.r * 1.15, 0, Math.PI * 2);
  mctx.fill();
  for (const p of PLACES) {
    mctx.fillStyle = p.color;
    mctx.strokeStyle = '#ffffff';
    mctx.lineWidth = 2;
    mctx.beginPath();
    mctx.arc(p.x, p.z, p.id === 'lab' ? 4 : 7, 0, Math.PI * 2);
    mctx.fill();
    mctx.stroke();
  }
  for (const tr of village.trophies) {
    if (tr.collected) continue;
    mctx.fillStyle = '#ffcf3a';
    mctx.strokeStyle = '#7a4a00';
    mctx.beginPath();
    mctx.moveTo(tr.x, tr.z - 4.5);
    mctx.lineTo(tr.x + 4, tr.z + 3);
    mctx.lineTo(tr.x - 4, tr.z + 3);
    mctx.closePath();
    mctx.fill();
    mctx.stroke();
  }
  mctx.restore();
  // player arrow (fixed at centre)
  mctx.save();
  mctx.translate(cx, cx);
  mctx.rotate(Math.PI - state.heading + yaw);
  mctx.fillStyle = '#ffffff';
  mctx.strokeStyle = '#2f6bff';
  mctx.lineWidth = 2;
  mctx.beginPath();
  mctx.moveTo(0, -9);
  mctx.lineTo(6.5, 7);
  mctx.lineTo(0, 3.5);
  mctx.lineTo(-6.5, 7);
  mctx.closePath();
  mctx.fill();
  mctx.stroke();
  mctx.restore();
  // north marker
  const nx = cx + Math.sin(yaw) * (cx - 13);
  const ny = cx - Math.cos(yaw) * (cx - 13);
  mctx.fillStyle = '#0f172a';
  mctx.beginPath();
  mctx.arc(nx, ny, 9, 0, Math.PI * 2);
  mctx.fill();
  mctx.fillStyle = '#fff';
  mctx.font = '700 11px Inter, sans-serif';
  mctx.textAlign = 'center';
  mctx.textBaseline = 'middle';
  mctx.fillText('N', nx, ny + 0.5);
}

// ---------- Loop ----------

const timer = new THREE.Timer();
timer.connect(document);
let elapsed = 0;
let mapDrawn = 0;
function frame() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = (elapsed = timer.getElapsed());
  movePlayer(dt);
  village.update(t, dt);
  village.creatures.update(t, dt, { state, player, ui, npcs: village.npcs, respawn: () => travelTo('hq') });
  grassWind.uTime.value = t;
  lavWind.uTime.value = t;
  flowerWind.uTime.value = t;
  if (!state.indoor) dayNight.update(dt);
  else {
    for (const u of state.indoor.updaters) u.update(t, dt);
    // the room's story: which chapter you're at, and which one glows next
    const r = state.indoor;
    if (r.story) ui.setGuide(r.story.update(t, state.pos.x - r.origin.x, state.pos.z - r.origin.z), r.id);
  }
  ui.setClock(dayNight.label(), dayNight.state.hour);
  ocean.uniforms.uTime.value = t;
  const docked = coast.update(t, dayNight.state.night, dt, state.indoor || !player.root.visible ? null : state.pos);
  if (docked) sfx('horn', { pos: coast.ferryBoat.position, range: 160 });
  if (docked && !state.indoor) {
    const f = coast.ferryBoat.position;
    if (coast.ferry.onboard) ui.toast(`<b>⛴ ${docked}.</b> Step off onto the pier, or stay aboard for the next stop.`, 3500);
    else if (Math.hypot(f.x - state.pos.x, f.z - state.pos.z) < 25) ui.toast(`<b>⛴ The ferry is in at ${docked}.</b> Walk to the end of the pier to board.`, 3500);
  }
  updateClouds(t);
  updateRail(t);
  updateProps(t);
  updatePollen(t);
  story.update(t, quest.activeId());
  hidden.update(t);
  pond.update(t);
  gallery.update(t, dt, camera, !state.indoor);
  quest.update(t, dt, { pos: state.pos, indoorId: state.indoor?.id || null, mode: state.mode, blocked: ui.modalOpen() });
  playerPos.copy(state.pos);
  updateCamera(dt, t);
  feedAudio(dt);
  if (ride.active) rideSpeedEl.textContent = `${Math.round(Math.abs(ride.speed) * 3.6)}`;
  updateProximity(t);
  updateLabels();
  drawMinimap();
  // the map card follows along while it's open (Nikita moves; so might you, along a route)
  if (mapView.isOpen() && t - mapDrawn > 0.3) {
    mapDrawn = t;
    mapView.render();
  }
  halo.material.opacity = state.indoor ? 0.22 + Math.sin(t * 3) * 0.08 : 0.35 + Math.sin(t * 3) * 0.2;
  halo.scale.setScalar(state.indoor ? 0.62 : 1);
  // once everything has run for a moment, fit the static pieces to the terrain
  if (fitPending && ++fitFrames > 30 && t > 0.8) {
    fitPending = false;
    fitResult = groundFit(outdoor, fitSnap, groundAt);
    fitDone();
  }
  composer.render();
  requestAnimationFrame(frame);
}
await step('Waking everyone up', 0.95);
// signboards stand where a builder put them, often at their building's floor height several metres
// away; seat each on the highest ground under its posts (the fit then stretches the lower post)
{
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  const signs = [];
  outdoor.traverse((o) => {
    if (/^(belief-|career-sign-|signboard|brief-board)/.test(o.name) && !o.userData.dynamic) signs.push(o);
  });
  outdoor.updateMatrixWorld(true);
  for (const o of signs) {
    box.setFromObject(o);
    const base = o.getWorldPosition(new THREE.Vector3());
    let hi = -Infinity;
    for (const [x, z] of [[box.min.x, box.min.z], [box.max.x, box.min.z], [box.min.x, box.max.z], [box.max.x, box.max.z], [base.x, base.z]]) hi = Math.max(hi, walkY(x, z));
    if (Math.abs(hi - base.y) < 0.02) continue;
    v.set(base.x, hi, base.z);
    o.parent.worldToLocal(v);
    o.position.y = v.y;
    o.updateMatrixWorld(true);
  }
}
const fitSnap = snapshotMatrices(outdoor);
let fitPending = true;
let fitFrames = 0;
let fitResult = 0;
let fitDone;
const fitted = new Promise((r) => (fitDone = r));
requestAnimationFrame(frame);
await finishLoading({ renderer, scene, camera, render: () => composer.render() });
await fitted;
hideLoader();
ui.ready();

window.__shire = { places: PLACES, Walker, useFromAfar, act, pathfind: { buildGrid, findPath }, sitDown, elapsed: () => elapsed, keys, nav, mapView, goTo, distToPath, PATHS, fit: () => fitResult, hidden, colliders, gallery, quest, story, ride, audioDebug, state, setMode, travelTo, ui, renderer, scene, dayNight, village, rooms, coast, enterRoom, exitRoom, walkY, groundAt, THREE };
