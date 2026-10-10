import * as THREE from 'three';
import { NIGHT_GLOWS, NIGHT_POOLS } from './materials.js';

// Lighting keyframes by hour of day.
const KEYS = [
  { h: 0, top: '#08122a', mid: '#15244a', hor: '#2d3d66', sun: '#9fb6ff', sunI: 0.55, hemiI: 0.32, fog: '#18264a', exp: 0.95, env: 0.22, night: 1 },
  { h: 5, top: '#0b1736', mid: '#1f2f5c', hor: '#3c4c78', sun: '#9fb6ff', sunI: 0.5, hemiI: 0.35, fog: '#1e2c52', exp: 0.95, env: 0.25, night: 1 },
  { h: 6.3, top: '#3a69b2', mid: '#e3a58e', hor: '#ffcf9f', sun: '#ffb27a', sunI: 1.3, hemiI: 0.7, fog: '#e6c3ae', exp: 0.95, env: 0.6, night: 0.35 },
  { h: 8, top: '#2a86d6', mid: '#8ccbf0', hor: '#e8f5fb', sun: '#fff1d6', sunI: 2.8, hemiI: 1.0, fog: '#d3e9f4', exp: 0.92, env: 0.95, night: 0 },
  { h: 12, top: '#1f7fd1', mid: '#7cc4f0', hor: '#e4f4fb', sun: '#fff8ec', sunI: 3.2, hemiI: 1.05, fog: '#d3e9f4', exp: 0.9, env: 1, night: 0 },
  { h: 16, top: '#2479cc', mid: '#86c3ea', hor: '#f2efe0', sun: '#ffe7c2', sunI: 2.9, hemiI: 0.95, fog: '#dde8ea', exp: 0.92, env: 0.95, night: 0 },
  { h: 17.7, top: '#3a74c0', mid: '#eeb489', hor: '#ffd49c', sun: '#ffaf5c', sunI: 2.3, hemiI: 0.75, fog: '#efcfab', exp: 0.95, env: 0.75, night: 0.1 },
  { h: 19.2, top: '#233a74', mid: '#a96b8c', hor: '#f0905f', sun: '#ff7a4a', sunI: 0.9, hemiI: 0.5, fog: '#8c6f8f', exp: 0.95, env: 0.45, night: 0.6 },
  { h: 20.6, top: '#0b1736', mid: '#1c2b57', hor: '#34456f', sun: '#9fb6ff', sunI: 0.55, hemiI: 0.34, fog: '#1d2b51', exp: 0.95, env: 0.25, night: 1 },
  { h: 24, top: '#08122a', mid: '#15244a', hor: '#2d3d66', sun: '#9fb6ff', sunI: 0.55, hemiI: 0.32, fog: '#18264a', exp: 0.95, env: 0.22, night: 1 },
];
const COLOR_KEYS = ['top', 'mid', 'hor', 'sun', 'fog'];
const parsed = KEYS.map((k) => {
  const o = { ...k };
  for (const c of COLOR_KEYS) o[c] = new THREE.Color(k[c]);
  return o;
});

function sample(h) {
  let i = 0;
  while (i < parsed.length - 2 && parsed[i + 1].h <= h) i++;
  const a = parsed[i];
  const b = parsed[i + 1];
  const t = THREE.MathUtils.smoothstep(h, a.h, b.h);
  const out = {};
  for (const k of Object.keys(a)) {
    if (k === 'h') continue;
    out[k] = a[k].isColor ? a[k].clone().lerp(b[k], t) : THREE.MathUtils.lerp(a[k], b[k], t);
  }
  return out;
}

export const TIME_MODES = [
  { id: 'auto', label: 'Auto', icon: '🔄' },
  { id: 'day', label: 'Day', icon: '☀️', hour: 11.5 },
  { id: 'sunset', label: 'Sunset', icon: '🌅', hour: 18.2 },
  { id: 'night', label: 'Night', icon: '🌙', hour: 22 },
];

export function createDayNight({ scene, root = scene, sun, hemi, sky, renderer, bloom, ocean }) {
  const state = { hour: 9.5, mode: 0, night: 0, sunDir: new THREE.Vector3() };

  // Stars
  const N = 1500;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random();
    const v = Math.random() * 0.9 + 0.08;
    const th = u * Math.PI * 2;
    const ph = Math.acos(1 - v);
    pos.set([Math.sin(ph) * Math.cos(th) * 850, Math.cos(ph) * 850, Math.sin(ph) * Math.sin(th) * 850], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  root.add(stars);

  // Moon
  const moonTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,245,1)');
    g.addColorStop(0.35, 'rgba(240,244,255,1)');
    g.addColorStop(0.42, 'rgba(200,215,255,0.35)');
    g.addColorStop(1, 'rgba(200,215,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, transparent: true, depthWrite: false, opacity: 0 }));
  moon.scale.set(90, 90, 1);
  root.add(moon);

  const skyU = sky.material.uniforms;
  const moonDir = new THREE.Vector3(-0.45, 0.62, -0.4).normalize();

  function apply() {
    const s = sample(state.hour);
    state.night = s.night;
    skyU.top.value.copy(s.top);
    skyU.mid.value.copy(s.mid);
    skyU.horizon.value.copy(s.hor);
    // Sun arc from east (6h) to west (18h); the moon takes over at night.
    const a = ((state.hour - 6) / 12) * Math.PI;
    const el = Math.sin(a);
    if (el > 0.06) state.sunDir.set(Math.cos(a) * 0.85, el, 0.35).normalize();
    else state.sunDir.copy(moonDir);
    skyU.sunDir.value.copy(el > 0.02 ? state.sunDir : new THREE.Vector3(0, -1, 0));
    sun.color.copy(s.sun);
    sun.intensity = s.sunI;
    hemi.intensity = s.hemiI;
    hemi.color.copy(s.mid).lerp(new THREE.Color('#cfe9ff'), 0.5);
    scene.fog.color.copy(s.fog);
    renderer.toneMappingExposure = s.exp;
    scene.environmentIntensity = s.env;
    starMat.opacity = s.night * 0.95;
    moon.material.opacity = s.night;
    moon.position.copy(moonDir).multiplyScalar(800);
    if (bloom) {
      bloom.strength = 0.12 + s.night * 0.38;
      bloom.threshold = 0.96 - s.night * 0.22;
    }
    for (const m of NIGHT_GLOWS) m.emissiveIntensity = m.userData.base * (0.3 + s.night * 0.95);
    for (const m of NIGHT_POOLS) m.opacity = s.night * m.userData.base;
    if (ocean) {
      ocean.uniforms.uSun.value.copy(state.sunDir);
      ocean.uniforms.uNight.value = s.night;
      ocean.uniforms.uSky.value.copy(s.hor).lerp(s.mid, 0.4);
    }
  }

  function update(dt) {
    const mode = TIME_MODES[state.mode];
    if (mode.id === 'auto') state.hour = (state.hour + dt * (24 / 480)) % 24; // a full day every 8 minutes
    else {
      const diff = mode.hour - state.hour;
      state.hour += Math.sign(diff) * Math.min(Math.abs(diff), Math.max(Math.abs(diff) * dt * 1.5, dt * 2));
    }
    apply();
  }

  function cycle() {
    state.mode = (state.mode + 1) % TIME_MODES.length;
    return TIME_MODES[state.mode];
  }

  apply();
  return { state, update, cycle, label: () => {
    const h = Math.floor(state.hour);
    const m = Math.floor((state.hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  } };
}
