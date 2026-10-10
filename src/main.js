import * as THREE from 'three';
import './style.css';
import { OWNER, PILLARS, CENTER, HAMLETS } from './data.js';
import { buildSky, buildTerrain, buildMountains, buildTrees, buildFlowers, buildPollen, heightAt, POND, PATHS, WORLD_RADIUS } from './world.js';
import { buildVillage } from './village.js';
import { makeFolk, animate } from './characters.js';
import { createUI } from './ui.js';

// ---------- Renderer & scene ----------

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#e9dcc0', 80, 340);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.3, 1400);

const hemi = new THREE.HemisphereLight('#cfe6ff', '#6b7a3a', 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe2b0', 3.0);
const SUN_DIR = new THREE.Vector3(0.55, 0.75, 0.35).normalize();
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
function setShadowRange(r) {
  const c = sun.shadow.camera;
  c.left = c.bottom = -r;
  c.right = c.top = r;
  c.near = 1;
  c.far = 400;
  c.updateProjectionMatrix();
}
setShadowRange(55);

buildSky(scene);
const { terrain } = buildTerrain(scene);
buildMountains(scene);
const colliders = [];
buildTrees(scene, colliders);
buildFlowers(scene);
const updatePollen = buildPollen(scene);
const village = buildVillage(scene);
colliders.push(...village.colliders);

// ---------- Player ----------

const player = makeFolk({ vest: CENTER.color, shirt: '#f6efd9', cloak: '#3e5a2e', hair: '#5a3a22', seed: 0.31 });
const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 14), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
scarf.rotation.x = Math.PI / 2;
scarf.position.y = 1.0;
player.parts.body.add(scarf);
// A soft ring under the player so you can always find yourself.
const halo = new THREE.Mesh(
  new THREE.RingGeometry(0.7, 0.9, 32),
  new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.6, depthWrite: false })
);
halo.rotation.x = -Math.PI / 2;
halo.position.y = 0.06;
player.root.add(halo);
scene.add(player.root);

const marker = new THREE.Mesh(
  new THREE.RingGeometry(0.35, 0.55, 24),
  new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false })
);
marker.rotation.x = -Math.PI / 2;
marker.visible = false;
scene.add(marker);

const state = {
  mode: 'intro', // intro | walk | overview | tour
  pos: new THREE.Vector3(0, 0, 14),
  heading: Math.PI,
  speed: 0,
  target: null,
  yaw: 0,
  pitch: 0.38,
  dist: 9,
  ovYaw: 0.6,
  ovPitch: 0.95,
  ovDist: 175,
  tourIndex: 0,
  tourT: 0,
};
state.pos.y = heightAt(state.pos.x, state.pos.z);

// ---------- Places ----------

const PLACES = [
  { ...CENTER, x: 0, z: 0, y: heightAt(0, 0) },
  ...HAMLETS.map((h) => ({ ...h })),
];

function nearestPlace(x, z) {
  let best = null;
  let bd = Infinity;
  for (const p of PLACES) {
    const d = Math.hypot(x - p.x, z - p.z);
    const reach = p.id === 'hall' ? 16 : 22;
    if (d < reach && d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
}

function travelTo(id) {
  const p = PLACES.find((q) => q.id === id);
  if (!p) return;
  let x, z;
  if (p.id === 'hall') {
    x = 0;
    z = 14;
  } else {
    x = p.x - Math.cos(p.angle) * 10;
    z = p.z - Math.sin(p.angle) * 10;
  }
  state.pos.set(x, heightAt(x, z), z);
  const dx = p.x - x;
  const dz = p.z - z;
  state.heading = Math.atan2(dx, dz);
  state.yaw = Math.atan2(-dx, -dz);
  state.pitch = 0.32;
  state.target = null;
  setMode('walk', { snap: true });
}

// ---------- UI ----------

const ui = createUI({
  owner: OWNER,
  pillars: PILLARS,
  places: PLACES,
  onEnter: () => setMode('walk'),
  onTour: () => setMode('tour'),
  onOverview: () => setMode(state.mode === 'overview' ? 'walk' : 'overview'),
  onTravel: (id) => travelTo(id),
  onTourStep: (d) => tourStep(d),
  onExitTour: () => {
    travelTo(PLACES[state.tourIndex].id);
  },
});

function setMode(mode, { snap = false } = {}) {
  const prev = state.mode;
  state.mode = mode;
  ui.setMode(mode);
  setShadowRange(mode === 'walk' ? 55 : 140);
  if (mode === 'tour') {
    state.tourIndex = prev === 'tour' ? state.tourIndex : 0;
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
window.addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  const k = e.key.toLowerCase();
  keys.add(k);
  if (state.mode === 'intro') {
    if (k === 'enter' || k === ' ') setMode('walk');
    return;
  }
  if (k === 'o') setMode(state.mode === 'overview' ? 'walk' : 'overview');
  else if (k === 't') setMode(state.mode === 'tour' ? 'walk' : 'tour');
  else if (k === 'h') ui.toggleHire();
  else if (k === 'escape') {
    if (ui.closeOverlays()) return;
    if (state.mode === 'tour') travelTo(PLACES[state.tourIndex].id);
    else if (state.mode === 'overview') setMode('walk');
    else ui.hidePlace(true);
  } else if (/^[0-6]$/.test(k)) travelTo(PLACES[Number(k)].id);
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
  if (!pointers.has(e.pointerId)) return;
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
    state.ovPitch = THREE.MathUtils.clamp(state.ovPitch + dy * 0.004, 0.35, 1.45);
  } else if (state.mode === 'walk') {
    state.yaw -= dx * 0.006;
    state.pitch = THREE.MathUtils.clamp(state.pitch + dy * 0.004, 0.05, 1.2);
  }
});
const raycaster = new THREE.Raycaster();
canvas.addEventListener('pointerup', (e) => {
  pointers.delete(e.pointerId);
  if (drag && !drag.moved && (state.mode === 'walk' || state.mode === 'overview')) {
    const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(terrain)[0];
    if (hit && Math.hypot(hit.point.x, hit.point.z) < WORLD_RADIUS) {
      state.target = hit.point.clone();
      marker.visible = true;
    }
  }
  if (pointers.size === 0) drag = null;
});
canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
function zoom(delta) {
  if (state.mode === 'overview') state.ovDist = THREE.MathUtils.clamp(state.ovDist * (1 + delta * 0.001), 60, 300);
  else if (state.mode === 'walk') state.dist = THREE.MathUtils.clamp(state.dist * (1 + delta * 0.001), 3.5, 28);
}
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom(e.deltaY);
}, { passive: false });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Simulation ----------

const PLAYER_R = 0.5;
function movePlayer(dt) {
  let ix = 0;
  let iz = 0;
  if (state.mode === 'walk' || state.mode === 'overview') {
    if (keys.has('w') || keys.has('arrowup')) iz += 1;
    if (keys.has('s') || keys.has('arrowdown')) iz -= 1;
    if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
    if (keys.has('d') || keys.has('arrowright')) ix += 1;
    if (state.mode === 'walk') {
      if (keys.has('q')) state.yaw += dt * 1.8;
      if (keys.has('e')) state.yaw -= dt * 1.8;
    }
  }
  const yaw = state.mode === 'overview' ? state.ovYaw : state.yaw;
  let dir = null;
  if (ix || iz) {
    state.target = null;
    marker.visible = false;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    dir = new THREE.Vector2(fx * iz + rx * ix, fz * iz + rz * ix).normalize();
  } else if (state.target) {
    const dx = state.target.x - state.pos.x;
    const dz = state.target.z - state.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.4) {
      state.target = null;
      marker.visible = false;
    } else dir = new THREE.Vector2(dx / d, dz / d);
  }
  const running = keys.has('shift') || (state.target && state.pos.distanceTo(state.target) > 20);
  const want = dir ? (running ? 9 : 4.5) : 0;
  state.speed = THREE.MathUtils.lerp(state.speed, want, Math.min(1, dt * 8));
  if (dir) {
    let diff = Math.atan2(dir.x, dir.y) - state.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    state.heading += diff * Math.min(1, dt * 10);
  }
  if (state.speed > 0.01) {
    state.pos.x += Math.sin(state.heading) * state.speed * dt;
    state.pos.z += Math.cos(state.heading) * state.speed * dt;
  }
  for (const c of colliders) {
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
  const r = Math.hypot(state.pos.x, state.pos.z);
  if (r > WORLD_RADIUS) {
    state.pos.x *= WORLD_RADIUS / r;
    state.pos.z *= WORLD_RADIUS / r;
  }
  state.pos.y = Math.max(heightAt(state.pos.x, state.pos.z), -2.4);
  player.root.position.copy(state.pos);
  player.root.rotation.y = state.heading;
  animate(player, 'walk', elapsed, state.speed);
  if (state.target) {
    marker.position.set(state.target.x, heightAt(state.target.x, state.target.z) + 0.08, state.target.z);
    marker.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.15);
  }
}

// ---------- Camera ----------

const camPos = new THREE.Vector3(120, 90, 120);
const camLook = new THREE.Vector3();
let snapCamera = false;
const desiredPos = new THREE.Vector3();
const desiredLook = new THREE.Vector3();

function orbitPoint(out, center, yaw, pitch, dist) {
  return out.set(
    center.x + Math.sin(yaw) * Math.cos(pitch) * dist,
    center.y + Math.sin(pitch) * dist,
    center.z + Math.cos(yaw) * Math.cos(pitch) * dist
  );
}

function updateCamera(dt, t) {
  let k = 4;
  if (state.mode === 'intro') {
    desiredLook.set(0, 4, 0);
    orbitPoint(desiredPos, desiredLook, t * 0.04 + 0.6, 0.55, 150);
    k = 1.5;
  } else if (state.mode === 'overview') {
    desiredLook.set(state.pos.x * 0.35, 0, state.pos.z * 0.35);
    orbitPoint(desiredPos, desiredLook, state.ovYaw, state.ovPitch, state.ovDist);
    k = 3;
  } else if (state.mode === 'tour') {
    const p = PLACES[state.tourIndex];
    state.tourT += dt;
    desiredLook.set(p.x, p.y + 3, p.z);
    const base = p.id === 'hall' ? 0.6 : Math.atan2(-Math.cos(p.angle), -Math.sin(p.angle));
    orbitPoint(desiredPos, desiredLook, base + Math.sin(state.tourT * 0.12) * 0.7, 0.42, p.id === 'hall' ? 34 : 30);
    k = 1.6;
    ui.setTourProgress(Math.min(1, state.tourT / 9));
    if (state.tourT > 9) tourStep(1);
  } else {
    // Gently swing the camera behind the player while walking.
    if (state.speed > 0.5 && !drag) {
      const behind = state.heading + Math.PI;
      let diff = behind - state.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      state.yaw += diff * Math.min(1, dt * 0.9);
    }
    desiredLook.set(state.pos.x, state.pos.y + 1.4, state.pos.z);
    orbitPoint(desiredPos, desiredLook, state.yaw, state.pitch, state.dist);
    const ground = heightAt(desiredPos.x, desiredPos.z) + 1.0;
    if (desiredPos.y < ground) desiredPos.y = ground;
    k = 6;
  }
  const a = snapCamera ? 1 : 1 - Math.exp(-dt * k);
  snapCamera = false;
  camPos.lerp(desiredPos, a);
  camLook.lerp(desiredLook, a);
  camera.position.copy(camPos);
  camera.lookAt(camLook);

  // Fog and shadows follow the view.
  const far = state.mode === 'walk' ? 340 : 700;
  const near = state.mode === 'walk' ? 80 : 220;
  scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, far, 1 - Math.exp(-dt * 2));
  scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, near, 1 - Math.exp(-dt * 2));
  const focus = state.mode === 'walk' ? state.pos : camLook;
  sun.target.position.copy(focus);
  sun.position.copy(focus).addScaledVector(SUN_DIR, 150);
}

// ---------- Proximity: panels and standing stones ----------

let lastPlaceId = null;
let lastStone = null;
function updateProximity() {
  if (state.mode !== 'walk') return;
  const p = nearestPlace(state.pos.x, state.pos.z);
  const id = p ? p.id : null;
  if (id !== lastPlaceId) {
    lastPlaceId = id;
    if (p) ui.showPlace(p);
    else ui.hidePlace();
  }
  let stone = null;
  for (const s of village.stones) {
    if (Math.hypot(state.pos.x - s.x, state.pos.z - (s.z)) < 3.4) stone = s;
  }
  if (stone !== lastStone) {
    lastStone = stone;
    if (stone) ui.toast(`<b>${stone.pillar.rune} ${stone.pillar.name}</b><br>${stone.pillar.text}`, 6000);
  }
}

// ---------- Labels & minimap ----------

const anchor = new THREE.Vector3();
function updateLabels() {
  for (const p of PLACES) {
    anchor.set(p.x, p.y + (p.id === 'hall' ? 16 : 11), p.z);
    const dist = anchor.distanceTo(camera.position);
    anchor.project(camera);
    const visible = anchor.z < 1 && Math.abs(anchor.x) < 1.1 && Math.abs(anchor.y) < 1.1 && state.mode !== 'intro';
    const near = state.mode === 'walk' && lastPlaceId === p.id;
    ui.placeLabel(p.id, (anchor.x * 0.5 + 0.5) * window.innerWidth, (-anchor.y * 0.5 + 0.5) * window.innerHeight, visible && !near && dist < 420, dist);
  }
}

const mini = document.getElementById('minimap');
const mctx = mini.getContext('2d');
function drawMinimap() {
  const S = mini.width;
  const scale = (S / 2 - 8) / 125;
  const cx = S / 2;
  mctx.clearRect(0, 0, S, S);
  mctx.save();
  mctx.beginPath();
  mctx.arc(cx, cx, S / 2 - 2, 0, Math.PI * 2);
  mctx.fillStyle = '#6f9a46';
  mctx.fill();
  mctx.clip();
  mctx.strokeStyle = '#c9a874';
  mctx.lineWidth = 3;
  for (const [ax, az, bx, bz] of PATHS) {
    mctx.beginPath();
    mctx.moveTo(cx + ax * scale, cx + az * scale);
    mctx.lineTo(cx + bx * scale, cx + bz * scale);
    mctx.stroke();
  }
  mctx.fillStyle = '#5b9cc6';
  mctx.beginPath();
  mctx.arc(cx + POND.x * scale, cx + POND.z * scale, POND.r * scale, 0, Math.PI * 2);
  mctx.fill();
  for (const p of PLACES) {
    mctx.fillStyle = p.color;
    mctx.strokeStyle = '#2d2418';
    mctx.lineWidth = 2;
    mctx.beginPath();
    mctx.arc(cx + p.x * scale, cx + p.z * scale, p.id === 'hall' ? 8 : 7, 0, Math.PI * 2);
    mctx.fill();
    mctx.stroke();
    if (ui.visited.has(p.id)) {
      mctx.fillStyle = '#fff';
      mctx.font = 'bold 9px Inter, sans-serif';
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillText('✓', cx + p.x * scale, cx + p.z * scale + 0.5);
    }
  }
  // camera view cone
  const yaw = state.mode === 'overview' ? state.ovYaw : state.yaw;
  const px = cx + state.pos.x * scale;
  const pz = cx + state.pos.z * scale;
  mctx.fillStyle = 'rgba(255,255,255,0.18)';
  mctx.beginPath();
  mctx.moveTo(px, pz);
  mctx.arc(px, pz, 34, Math.atan2(-Math.cos(yaw), -Math.sin(yaw)) - 0.45, Math.atan2(-Math.cos(yaw), -Math.sin(yaw)) + 0.45);
  mctx.closePath();
  mctx.fill();
  // player arrow
  mctx.save();
  mctx.translate(px, pz);
  mctx.rotate(-state.heading + Math.PI);
  mctx.fillStyle = '#ffe08a';
  mctx.strokeStyle = '#2d2418';
  mctx.lineWidth = 1.5;
  mctx.beginPath();
  mctx.moveTo(0, -7);
  mctx.lineTo(5, 5);
  mctx.lineTo(0, 2.5);
  mctx.lineTo(-5, 5);
  mctx.closePath();
  mctx.fill();
  mctx.stroke();
  mctx.restore();
  mctx.restore();
}

// ---------- Loop ----------

const timer = new THREE.Timer();
timer.connect(document);
let elapsed = 0;
function frame(now) {
  timer.update(now);
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = (elapsed = timer.getElapsed());
  movePlayer(dt);
  village.update(t, dt);
  updatePollen(t);
  updateCamera(dt, t);
  updateProximity();
  updateLabels();
  drawMinimap();
  halo.material.opacity = 0.35 + Math.sin(t * 3) * 0.2;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
ui.ready();

// Handy for debugging and screenshots.
window.__shire = { state, setMode, travelTo };
