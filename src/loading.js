// The loading screen: one thin bar driven by real work, so the island appears all at once, fully dressed.
// 0–60% building the world, 60–95% textures, 95–100% fonts and shader warm-up.
import * as THREE from 'three';

const fill = document.getElementById('ld-fill');
const stepEl = document.getElementById('ld-step');
const pctEl = document.getElementById('ld-pct');
let shown = 0;
let build = 0;
let tex = 0;
let finish = 0;

function render(label) {
  const p = Math.min(1, build * 0.6 + tex * 0.35 + finish * 0.05);
  shown = Math.max(shown, p); // never goes backwards
  document.body.classList.add('is-loading');
  if (fill) fill.style.transform = `scaleX(${shown})`;
  if (pctEl) pctEl.textContent = `${Math.round(shown * 100)}%`;
  if (label && stepEl) stepEl.textContent = label;
}

// Textures: every TextureLoader in the app goes through the default manager.
const T = { total: 0, done: 0, waiters: [] };
const settle = () => {
  if (T.done >= T.total) T.waiters.splice(0).forEach((r) => r());
};
const mgr = THREE.DefaultLoadingManager;
mgr.onStart = (_url, loaded, total) => {
  T.total = Math.max(T.total, total);
};
mgr.onProgress = (_url, loaded, total) => {
  T.total = Math.max(T.total, total);
  T.done = loaded;
  tex = T.total ? loaded / T.total : 1;
  if (build >= 1) render('Painting the billboards');
  settle();
};
mgr.onError = () => {
  T.done += 1;
  settle();
};
mgr.onLoad = () => {
  T.done = T.total;
  tex = 1;
  settle();
};

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const timeout = (ms) => new Promise((r) => setTimeout(r, ms));

// A build step: show it, then yield so the bar actually paints before the next chunk of work.
export async function step(label, progress) {
  build = progress;
  render(label);
  await nextFrame();
}

// Wait for textures, fonts and shaders, then let the page reveal itself.
export async function finishLoading({ renderer, scene, camera, render: draw }) {
  build = 1;
  render('Painting the billboards');
  if (T.done < T.total) await Promise.race([new Promise((r) => T.waiters.push(r)), timeout(15000)]);
  tex = 1;
  render('Setting the type');
  await Promise.race([document.fonts?.ready ?? Promise.resolve(), timeout(4000)]);
  finish = 0.5;
  render('Lighting the scene');
  try {
    if (renderer.compileAsync) await Promise.race([renderer.compileAsync(scene, camera), timeout(8000)]);
  } catch {
    // warm-up is a nicety; the first frames will compile whatever is left
  }
  draw?.();
  await nextFrame();
  finish = 1;
  render('Ready');
  await timeout(250);
}

// Fade out and remove the loader once the world is ready.
export function hideLoader() {
  const el = document.getElementById('loader');
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');
  if (el) setTimeout(() => el.remove(), 900);
}
