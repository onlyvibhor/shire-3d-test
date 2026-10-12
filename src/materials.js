import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Shared looks. The scene's environment map (set in main.js) gives the metals their shine.
export const WHITE_METAL = new THREE.MeshPhysicalMaterial({
  color: '#eef2f6',
  metalness: 0.55,
  roughness: 0.22,
  clearcoat: 1,
  clearcoatRoughness: 0.15,
});
export const BRUSHED = new THREE.MeshPhysicalMaterial({ color: '#dfe5ea', metalness: 0.7, roughness: 0.38 });
export const CHROME = new THREE.MeshPhysicalMaterial({ color: '#f5f7fa', metalness: 1, roughness: 0.08 });
export const CONCRETE = new THREE.MeshStandardMaterial({ color: '#e6e7e2', roughness: 0.9 });
// Tinted, mirror-like glass. Opaque on purpose: see-through glass sorts badly against people and props,
// so it reads as glass through its reflections instead.
export const GLASS = new THREE.MeshPhysicalMaterial({
  color: '#bfe2f7',
  metalness: 0.35,
  roughness: 0.06,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  envMapIntensity: 1.4,
});
export const GOLD = new THREE.MeshPhysicalMaterial({ color: '#ffcf4a', metalness: 1, roughness: 0.18, emissive: '#7a4a00', emissiveIntensity: 0.35 });
export const WOOD = new THREE.MeshStandardMaterial({ color: '#8a6440', roughness: 0.8 });
export const DARK = new THREE.MeshStandardMaterial({ color: '#2a2f38', roughness: 0.5, metalness: 0.3 });
export const MOUND = new THREE.MeshStandardMaterial({ color: '#5f9e3a', roughness: 0.95 });
// Emissive materials that brighten at night, and additive light pools under lamps.
export const NIGHT_GLOWS = new Set();
export const NIGHT_POOLS = new Set();
const nightGlow = (m) => {
  m.userData.base = m.emissiveIntensity;
  NIGHT_GLOWS.add(m);
  return m;
};
export const WINDOW_GLOW = nightGlow(new THREE.MeshStandardMaterial({ color: '#fff3cf', emissive: '#ffcf7a', emissiveIntensity: 0.75 }));

const cache = {};
export const solid = (color, extra = {}) => {
  const key = color + JSON.stringify(extra);
  return (cache[key] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra }));
};
export const glow = (color, intensity = 2) => {
  // near-white lights bloom the most, so they get dimmed hardest
  const c = new THREE.Color(color);
  const white = Math.min(c.r, c.g, c.b);
  const k = white > 0.75 ? 0.32 : white > 0.5 ? 0.45 : 0.6;
  const m = solid(color, { emissive: color, emissiveIntensity: intensity * k });
  if (!NIGHT_GLOWS.has(m)) nightGlow(m);
  return m;
};
export function lightPool(color = '#ffd99a', base = 0.26) {
  const m = new THREE.MeshBasicMaterial({ color, map: poolTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  m.userData.base = base;
  NIGHT_POOLS.add(m);
  return m;
}
let _pool;
function poolTexture() {
  return (_pool ||= canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }));
}

export function mesh(geo, material, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Adds a gentle wind sway to instanced foliage (grass, lavender).
export function windMaterial(base, { strength = 0.25 } = {}) {
  const uniforms = { uTime: { value: 0 } };
  base.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 rootW = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float gust = sin(uTime * 0.6 + rootW.x * 0.03 + rootW.z * 0.02) * 0.5 + 0.5;
        float sway = sin(uTime * 1.9 + rootW.x * 0.35 + rootW.z * 0.27) * (0.6 + gust)
                   + sin(uTime * 3.3 + rootW.x * 0.9) * 0.25;
        float k = position.y * position.y;
        transformed.x += sway * ${strength.toFixed(3)} * k;
        transformed.z += sway * ${(strength * 0.5).toFixed(3)} * k;`
      );
  };
  return uniforms;
}

// Merge a group's static child meshes that share a material into one mesh each (fewer draw calls).
// ?nomerge keeps every piece separate (for auditing the scene)
const NO_MERGE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('nomerge');
export function mergeStatic(group) {
  if (NO_MERGE) return;
  const buckets = new Map();
  for (const child of group.children) {
    if (!child.isMesh || child.userData.dynamic || Array.isArray(child.material) || child.isInstancedMesh) continue;
    if (!buckets.has(child.material)) buckets.set(child.material, []);
    buckets.get(child.material).push(child);
  }
  for (const [material, meshes] of buckets) {
    if (meshes.length < 2) continue;
    const geos = meshes.map((m) => {
      m.updateMatrix();
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      g.applyMatrix4(m.matrix);
      return g;
    });
    const names = ['position', 'normal', 'uv'].filter((n) => geos.every((g) => g.attributes[n]));
    for (const g of geos) for (const n of Object.keys(g.attributes)) if (!names.includes(n)) g.deleteAttribute(n);
    const merged = mergeGeometries(geos);
    const pieces = geos.map((g) => g.attributes.position.count);
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const out = new THREE.Mesh(merged, material);
    out.userData.pieces = pieces; // so the ground fit can still treat each piece on its own
    out.castShadow = meshes.some((m) => m.castShadow);
    out.receiveShadow = true;
    for (const m of meshes) group.remove(m);
    group.add(out);
  }
}

export function deepMerge(obj) {
  for (const child of [...obj.children]) if (!child.isMesh && child.children.length) deepMerge(child);
  mergeStatic(obj);
}
