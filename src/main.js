import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';
import { OWNER, PILLARS, CENTER, HAMLETS, LAB, HOME, FUN, AIHUB, HALL, PROJECTS, AWARDS, ASSETS, NPC_TALK, CONTACT, FAVOURITES, TOOLS, AWARD_LIST } from './data.js';
import {
  buildSky, makeSkyMaterial, buildClouds, buildTerrain, buildGrass, buildLavender, buildFlowers, buildMountains, buildTrees, buildPollen,
  heightAt, groundAt, walkY, POND, PATHS, WORLD_RADIUS, buildOcean, SEA_LEVEL, coastR,
} from './world.js';
import { buildMonoliths, buildSkyRail, buildFloatingProps, buildStreetLamps, buildCoast } from './landmarks.js';
import { buildInteriors } from './interiors.js';
import { createDayNight } from './daynight.js';
import { buildVillage, playerPos } from './village.js';
import { makePerson, animate, hit } from './characters.js';
import { createUI } from './ui.js';

// ---------- Renderer, scene, light ----------

const canvas = document.getElementById('scene');
// Lighter settings for phones and weak GPUs (or force with ?lite).
const LITE = new URLSearchParams(location.search).has('lite') || matchMedia('(hover: none)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1.25 : 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#d3e9f4', 170, 620);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 2000);

// Environment map from the sky, so the white metal reflects blue sky and green land.
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), makeSkyMaterial()));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(100, 32), new THREE.MeshBasicMaterial({ color: '#5d9a3c' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -8;
  envScene.add(ground);
  scene.environment = pmrem.fromScene(envScene, 0.03).texture;
  scene.environmentIntensity = 1.0;
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
const outdoor = new THREE.Group();
scene.add(outdoor);
const sky = buildSky(outdoor);
const updateClouds = buildClouds(outdoor);
const { terrain } = buildTerrain(outdoor);
const ocean = buildOcean(outdoor);
const grassWind = buildGrass(outdoor, LITE ? 60000 : 180000);
const lavWind = buildLavender(outdoor, LITE ? 6000 : 14000);
const flowerWind = buildFlowers(outdoor, LITE ? 4000 : 10000);
buildMountains(outdoor);
const colliders = [];
buildTrees(outdoor, colliders);
buildMonoliths(outdoor, colliders);
const updateRail = buildSkyRail(outdoor, colliders);
buildStreetLamps(outdoor, colliders);
const coast = buildCoast(outdoor, colliders);
const updateProps = buildFloatingProps(outdoor);
const updatePollen = buildPollen(outdoor);
const village = buildVillage(outdoor);
const dayNight = createDayNight({ scene, root: outdoor, sun, hemi, sky, renderer, bloom, ocean: ocean });
const rooms = buildInteriors(scene);
for (const room of Object.values(rooms)) room.interactables.push({ kind: 'exit', label: 'Back to the island', verb: 'Exit', x: room.origin.x + room.exit.x, z: room.origin.z + room.exit.z });
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

// ---------- Places ----------

const PLACES = [
  { ...CENTER, x: 0, z: 0, y: heightAt(0, 0), reach: 16 },
  ...HAMLETS.map((h) => ({ ...h, reach: 22 })),
  { ...LAB, reach: 9 },
  { ...FUN, reach: 16 },
  { ...HOME, reach: 16 },
  { ...AIHUB, reach: 17 },
  { ...HALL, reach: 16 },
];

function nearestPlace(x, z) {
  let best = null;
  let bd = Infinity;
  for (const p of PLACES) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < p.reach && d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
}

function leaveRoomNow() {
  if (!state.indoor) return;
  state.indoor.group.visible = false;
  outdoor.visible = true;
  state.indoor = null;
  scene.fog = savedFog;
  scene.background = null;
  hemi.groundColor.set('#4f7d32');
  ui.setIndoor(null);
}

function travelTo(id) {
  const p = PLACES.find((q) => q.id === id);
  if (!p) return;
  leaveRoomNow();
  let x, z;
  if (p.id === 'hq') {
    x = 0;
    z = 15;
  } else if (['lab', 'home', 'fun', 'ai', 'awards'].includes(p.id)) {
    const a = Math.atan2(p.z, p.x);
    const back = p.id === 'lab' ? 7 : p.id === 'home' ? 14 : 20;
    x = p.x - Math.cos(a) * back;
    z = p.z - Math.sin(a) * back;
  } else {
    x = p.x - Math.cos(p.angle) * 8;
    z = p.z - Math.sin(p.angle) * 8;
  }
  state.pos.set(x, walkY(x, z), z);
  const dx = p.x - x;
  const dz = p.z - z;
  state.heading = Math.atan2(dx, dz);
  state.yaw = Math.atan2(-dx, -dz);
  state.pitch = 0.3;
  state.dist = Math.min(state.dist, 6.5);
  state.target = null;
  marker.visible = false;
  setMode('walk', { snap: true });
}

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
  onEnter: () => setMode('walk'),
  onTour: () => setMode('tour'),
  onOverview: () => setMode(state.mode === 'overview' ? 'walk' : 'overview'),
  onTravel: (id) => travelTo(id),
  onTourStep: (d) => tourStep(d),
  onExitTour: () => travelTo(PLACES[state.tourIndex].id),
  onTime: () => ui.setTimeMode(dayNight.cycle()),
});

function setMode(mode, { snap = false } = {}) {
  const prev = state.mode;
  if (mode === 'overview' || mode === 'tour') leaveRoomNow();
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
  keys.add(k);
  if (state.mode === 'intro') {
    if (k === 'enter' || k === ' ') setMode('walk');
    return;
  }
  if (k === 'o') setMode(state.mode === 'overview' ? 'walk' : 'overview');
  else if (k === 't') setMode(state.mode === 'tour' ? 'walk' : 'tour');
  else if (k === 'h') ui.toggleHire();
  else if (k === 'i') showHome();
  else if (k === 'm') ui.toggleMissions();
  else if (k === 'l') ui.setTimeMode(dayNight.cycle());
  else if ((k === 'e' || k === 'enter') && nearThing) act(nearThing);
  else if (k === 'f' && state.mode === 'walk') waveAtNeighbours();
  else if (k === ' ' && state.mode === 'walk' && state.air === 0) state.vy = 6.5;
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
  const h = raycaster.intersectObjects(state.indoor ? state.indoor.clickables : village.clickables, false)[0];
  const ground = raycaster.intersectObject(state.indoor ? state.indoor.floor : terrain)[0];
  if (h && (!ground || h.distance < ground.distance)) {
    const ud = h.object.userData;
    return { action: ud.action || { kind: 'project', slug: ud.slug } };
  }
  return ground ? { point: ground.point } : null;
}
let lastHover = 0;
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
    if (res?.action) act(res.action);
    else if (res?.point && (state.indoor || heightAt(res.point.x, res.point.z) > SEA_LEVEL + 0.5 || jettyAt(res.point.x, res.point.z) || coast.onFerry(res.point.x, res.point.z) !== null)) {
      state.target = res.point.clone();
      marker.visible = true;
    }
  }
  if (pointers.size === 0) drag = null;
});
canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
function zoom(delta) {
  if (state.mode === 'overview') state.ovDist = THREE.MathUtils.clamp(state.ovDist * (1 + delta * 0.001), 60, 320);
  else if (state.mode === 'walk') state.dist = THREE.MathUtils.clamp(state.dist * (1 + delta * 0.001), 3, 26);
}
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom(e.deltaY);
}, { passive: false });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Player movement ----------

const PLAYER_R = 0.45;
const dir = new THREE.Vector2();
function movePlayer(dt) {
  let ix = 0;
  let iz = 0;
  const playing = state.mode === 'walk' || state.mode === 'overview';
  if (playing && !ui.modalOpen()) {
    if (keys.has('w') || keys.has('arrowup')) iz += 1;
    if (keys.has('s') || keys.has('arrowdown')) iz -= 1;
    if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
    if (keys.has('d') || keys.has('arrowright')) ix += 1;
    if (state.mode === 'walk') {
      if (keys.has('q')) state.yaw += dt * 1.8;
      if (keys.has('e') && !nearThing) state.yaw -= dt * 1.8;
    }
  }
  const yaw = state.mode === 'overview' ? state.ovYaw : state.yaw;
  let moving = false;
  if (ix || iz) {
    state.target = null;
    marker.visible = false;
    dir.set(-Math.sin(yaw) * iz + Math.cos(yaw) * ix, -Math.cos(yaw) * iz - Math.sin(yaw) * ix).normalize();
    moving = true;
  } else if (state.target) {
    const dx = state.target.x - state.pos.x;
    const dz = state.target.z - state.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.4) {
      state.target = null;
      marker.visible = false;
    } else {
      dir.set(dx / d, dz / d);
      moving = true;
    }
  }
  const running = keys.has('shift') || (state.target && Math.hypot(state.target.x - state.pos.x, state.target.z - state.pos.z) > 18);
  const want = moving ? (running ? 9 : 4.2) : 0;
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
    if (lz > b.maxZ && Math.abs(lx) < 1.4 && state.speed > 0.5 && Math.cos(state.heading) > 0.3) exitRoom();
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
      state.target = null;
      marker.visible = false;
    }
    const pier = jettyAt(state.pos.x, state.pos.z);
    const deck = coast.onFerry(state.pos.x, state.pos.z);
    ground = deck !== null ? deck : pier ? pier.y : walkY(state.pos.x, state.pos.z);
  }
  state.vy -= 18 * dt;
  state.air += state.vy * dt;
  if (state.air <= 0) {
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

const savedFog = scene.fog;
const INDOOR = {
  ai: { bg: '#060b16', hemi: ['#cfe9ff', '#1a2440', 1.0], sun: ['#e6f4ff', 1.6], exp: 1.0, bloom: [0.3, 0.82] },
  home: { bg: '#f4e9db', hemi: ['#fff1de', '#8a6a4a', 1.35], sun: ['#ffe6c4', 2.2], exp: 1.0, bloom: [0.12, 0.95] },
  fun: { bg: '#120a1c', hemi: ['#ffd9f0', '#2a1630', 0.85], sun: ['#ffd7a8', 1.3], exp: 1.05, bloom: [0.32, 0.8] },
  awards: { bg: '#121119', hemi: ['#fff4dc', '#2a2620', 1.0], sun: ['#fff1cf', 2.4], exp: 1.0, bloom: [0.22, 0.88] },
};
function applyIndoorLight(room) {
  const L = INDOOR[room.id];
  scene.fog = null;
  scene.background = new THREE.Color(L.bg);
  hemi.color.set(L.hemi[0]);
  hemi.groundColor.set(L.hemi[1]);
  hemi.intensity = L.hemi[2];
  sun.color.set(L.sun[0]);
  sun.intensity = L.sun[1];
  renderer.toneMappingExposure = L.exp;
  scene.environmentIntensity = 0.55;
  bloom.strength = L.bloom[0];
  bloom.threshold = L.bloom[1];
  sun.target.position.set(room.origin.x, 0, room.origin.z);
  sun.position.set(room.origin.x + 6, 40, room.origin.z + 10);
}

function enterRoom(id) {
  const room = rooms[id];
  if (!room || state.indoor) return;
  ui.fade(() => {
    state.outdoorReturn = { x: state.pos.x, z: state.pos.z, heading: state.heading + Math.PI, yaw: state.yaw + Math.PI };
    state.indoor = room;
    outdoor.visible = false;
    room.group.visible = true;
    state.pos.set(room.origin.x + room.spawn.x, room.origin.y, room.origin.z + room.spawn.z);
    state.heading = room.spawn.heading;
    state.yaw = 0;
    state.pitch = 0.28;
    state.dist = Math.min(state.dist, 5.5);
    state.target = null;
    marker.visible = false;
    setShadowRange(24);
    applyIndoorLight(room);
    lastPlaceId = null;
    snapCamera = true;
    const place = PLACES.find((p) => p.id === id);
    ui.setIndoor(place);
  });
}

function exitRoom() {
  const room = state.indoor;
  if (!room) return;
  ui.fade(() => {
    room.group.visible = false;
    outdoor.visible = true;
    state.indoor = null;
    scene.fog = savedFog;
    scene.background = null;
    hemi.groundColor.set('#4f7d32');
    const back = state.outdoorReturn;
    if (back) {
      // step out a little from the door, facing away from it
      state.pos.set(back.x + Math.sin(back.heading) * 1.5, 0, back.z + Math.cos(back.heading) * 1.5);
      state.heading = back.heading;
      state.yaw = back.yaw;
    }
    state.pos.y = walkY(state.pos.x, state.pos.z);
    setShadowRange(50);
    lastPlaceId = null;
    snapCamera = true;
    ui.setIndoor(null);
  });
}

// ---------- Camera ----------

const camPos = new THREE.Vector3(140, 100, 140);
const camLook = new THREE.Vector3();
let snapCamera = false;
const desiredPos = new THREE.Vector3();
const desiredLook = new THREE.Vector3();
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
      state.yaw += diff * Math.min(1, dt * 0.9);
    }
    desiredLook.set(state.pos.x, state.pos.y + 1.6, state.pos.z);
    orbitPoint(desiredPos, desiredLook, state.yaw, state.pitch, state.dist);
    // over-the-shoulder offset, GTA style
    desiredPos.x += Math.cos(state.yaw) * 0.6;
    desiredPos.z -= Math.sin(state.yaw) * 0.6;
    if (state.indoor) {
      const R = state.indoor;
      desiredPos.x = R.origin.x + THREE.MathUtils.clamp(desiredPos.x - R.origin.x, -R.w / 2 + 0.4, R.w / 2 - 0.4);
      desiredPos.z = R.origin.z + THREE.MathUtils.clamp(desiredPos.z - R.origin.z, -R.d / 2 + 0.4, R.d / 2 - 0.4);
      desiredPos.y = THREE.MathUtils.clamp(desiredPos.y, R.origin.y + 0.6, R.origin.y + R.h - 0.5);
    } else {
      const ground = groundAt(desiredPos.x, desiredPos.z) + 0.8;
      if (desiredPos.y < ground) desiredPos.y = ground;
    }
    k = 7;
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
  const p = state.indoor ? PLACES.find((q) => q.id === state.indoor.id) : nearestPlace(state.pos.x, state.pos.z);
  const id = p ? p.id : null;
  if (id !== lastPlaceId) {
    lastPlaceId = id;
    if (p) ui.showPlace(p);
    else ui.hidePlace();
  }
  // things to interact with: project billboards, the mailbox, the poster wall...
  let best = null;
  let bd = 4.5;
  for (const pr of state.indoor ? [] : village.projects) {
    const d = Math.hypot(state.pos.x - pr.x, state.pos.z - pr.z);
    if (d < bd) {
      bd = d;
      best = { kind: 'project', slug: pr.slug, label: PROJECTS[pr.slug].title, verb: 'View project' };
    }
  }
  for (const it of state.indoor ? state.indoor.interactables : village.interactables) {
    const d = Math.hypot(state.pos.x - it.x, state.pos.z - it.z);
    if (d < bd) {
      bd = d;
      best = it;
    }
  }
  nearThing = best;
  // walking right up to a door takes you inside
  if (best?.kind === 'enter' && bd < 1.0 && state.speed > 0.5) enterRoom(best.room);
  ui.prompt(best);
  // stones
  let stone = null;
  for (const s of village.stones) if (Math.hypot(state.pos.x - s.x, state.pos.z - s.z) < 3.4) stone = s;
  if (stone !== lastStone) {
    lastStone = stone;
    if (stone) ui.toast(`<b>${stone.pillar.rune} ${stone.pillar.name}</b><br>${stone.pillar.text}`, 6000);
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
  const near = [];
  let asker = null;
  let ad = 3.4;
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
    if (d < 18) near.push(n);
    if (d < ad && !n.rider) {
      ad = d;
      asker = n;
    }
  }
  // the closest person speaks; a few others show what they're thinking about
  if (asker) {
    npcPos.copy(asker.p.parts.head.getWorldPosition(npcPos));
    npcPos.y += 0.45;
    npcPos.project(camera);
    const lines = asker.lines || asker.talk.asks;
    const text = lines[(asker.i + Math.floor(elapsed / 6)) % lines.length];
    if (npcPos.z < 1) ui.speech({ text, name: `${asker.role}${asker.deptName && !asker.lines ? ' · ' + asker.deptName : ''}`, color: asker.color, x: (npcPos.x * 0.5 + 0.5) * innerWidth, y: (-npcPos.y * 0.5 + 0.5) * innerHeight });
    else ui.speech(null);
  } else ui.speech(null);
  near.sort((a, b) => a.d - b.d);
  const bubbles = [];
  for (const n of near) {
    if (n === asker || n.d < 3 || bubbles.length >= 5) continue;
    n.p.parts.head.getWorldPosition(npcPos);
    npcPos.y += 0.5;
    npcPos.project(camera);
    if (npcPos.z > 1 || Math.abs(npcPos.x) > 0.95 || Math.abs(npcPos.y) > 0.95) continue;
    const th = n.talk.thoughts;
    bubbles.push({
      text: th[(n.i * 3 + Math.floor((t + n.i * 1.7) / 8)) % th.length],
      color: n.color,
      x: (npcPos.x * 0.5 + 0.5) * innerWidth,
      y: (-npcPos.y * 0.5 + 0.5) * innerHeight,
      scale: THREE.MathUtils.clamp(1.25 - n.d / 22, 0.6, 1),
    });
  }
  ui.thoughts(bubbles);
}

function waveAtNeighbours() {
  let n = 0;
  for (const v of state.indoor ? state.indoor.npcs : village.npcs) {
    if (v.d < 9 && !v.p.react) {
      v.p.react = { type: 'wave', t0: elapsed };
      n++;
    }
  }
  ui.toast(n ? `<b>👋 You waved.</b> ${n} ${n === 1 ? 'person waves' : 'people wave'} back.` : '<b>👋</b> Nobody close enough to wave back.', 2200);
}

// The Home button: the about-me panel, reachable from anywhere
function showHome() {
  ui.showPlace(PLACES.find((p) => p.id === 'home'));
}
document.getElementById('btn-home').addEventListener('click', showHome);

function act(a) {
  if (!a) return;
  if (a.kind === 'project') ui.openProject(a.slug);
  else if (a.kind === 'contact') ui.toggleHire(true, true);
  else if (a.kind === 'home') ui.showPlace(PLACES.find((p) => p.id === 'home'));
  else if (a.kind === 'fun') ui.showPlace(PLACES.find((p) => p.id === 'fun'));
  else if (a.kind === 'poster') ui.toast(`<b>${a.item.title}</b> ${a.item.year ? `(${a.item.year})` : ''}<br>${a.item.note || ''}`, 6000);
  else if (a.kind === 'enter') enterRoom(a.room);
  else if (a.kind === 'exit') exitRoom();
  else if (a.kind === 'toast') ui.toast(a.text, 5000);
  else if (a.kind === 'kick') a.kick(state.heading);
  else if (a.kind === 'link') ui.openWeb(a.url, a.title || a.label);
  else if (a.kind === 'hire') ui.toggleHire(true);
  else if (a.kind === 'place') ui.showPlace(PLACES.find((p) => p.id === a.id));
  else if (a.kind === 'screen') ui.openProject(a.screen.userData.action.slug);
  else if (['tools', 'awards', 'leadership'].includes(a.kind)) ui.showInfo(a.kind);
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
    ui.placeLabel(p.id, (anchor.x * 0.5 + 0.5) * window.innerWidth, (-anchor.y * 0.5 + 0.5) * window.innerHeight, visible && !near && dist < 480, dist);
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
    mctx.strokeRect((-R.w / 2) * sc, (-R.d / 2) * sc, R.w * sc, R.d * sc);
    mctx.fillStyle = '#4ade80';
    mctx.fillRect(-1.5 * sc, (R.d / 2) * sc - 3, 3 * sc, 6);
    for (const it of R.interactables) {
      mctx.fillStyle = it.kind === 'exit' ? '#4ade80' : PLACES.find((p) => p.id === R.id)?.color || '#fff';
      mctx.beginPath();
      mctx.arc((it.x - R.origin.x) * sc, (it.z - R.origin.z) * sc, 3.5, 0, Math.PI * 2);
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
  mctx.arc(POND.x, POND.z, POND.r * 1.4, 0, Math.PI * 2);
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
  else for (const u of state.indoor.updaters) u.update(t, dt);
  ui.setClock(dayNight.label());
  ocean.uniforms.uTime.value = t;
  const docked = coast.update(t, dayNight.state.night, dt, state.indoor || !player.root.visible ? null : state.pos);
  if (docked && !state.indoor) {
    const f = coast.ferryBoat.position;
    if (coast.ferry.onboard) ui.toast(`<b>⛴ ${docked}.</b> Step off onto the pier, or stay aboard for the next stop.`, 3500);
    else if (Math.hypot(f.x - state.pos.x, f.z - state.pos.z) < 60) ui.toast(`<b>⛴ The ferry is in at ${docked}.</b> Walk to the end of the pier to board.`, 3500);
  }
  updateClouds(t);
  updateRail(t);
  updateProps(t);
  updatePollen(t);
  playerPos.copy(state.pos);
  updateCamera(dt, t);
  updateProximity(t);
  updateLabels();
  drawMinimap();
  halo.material.opacity = 0.35 + Math.sin(t * 3) * 0.2;
  composer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
ui.ready();

window.__shire = { state, setMode, travelTo, ui, renderer, scene, dayNight, village, rooms, coast, enterRoom, exitRoom, walkY, groundAt, THREE };
