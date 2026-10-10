import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HAMLETS, LAB } from './data.js';
import { windMaterial, canvasTexture } from './materials.js';

// ---------- Layout ----------

export const HAMLET_RADIUS = 72;
export const WORLD_RADIUS = 178;
export const WATER_LEVEL = -1.6;
export const ROAD_HALF = 2.6;

HAMLETS.forEach((h, i) => {
  const a = -Math.PI / 2 + (i / HAMLETS.length) * Math.PI * 2;
  h.angle = a;
  h.x = Math.cos(a) * HAMLET_RADIUS;
  h.z = Math.sin(a) * HAMLET_RADIUS;
});

const pondAngle = (HAMLETS[0].angle + HAMLETS[1].angle) / 2;
export const POND = { x: Math.cos(pondAngle) * 42, z: Math.sin(pondAngle) * 42, r: 9 };
LAB.angle = pondAngle;
LAB.x = Math.cos(pondAngle) * 25;
LAB.z = Math.sin(pondAngle) * 25;

export const PATHS = [];
HAMLETS.forEach((h, i) => {
  const n = HAMLETS[(i + 1) % HAMLETS.length];
  PATHS.push([0, 0, h.x, h.z]);
  PATHS.push([h.x, h.z, n.x, n.z]);
});

export function distToSegment(px, pz, [ax, az, bx, bz]) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
export function distToPath(x, z) {
  let d = Infinity;
  for (const s of PATHS) d = Math.min(d, distToSegment(x, z, s));
  return d;
}

// ---------- Height field ----------

export const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function rawHeight(x, z) {
  let h =
    2.0 * Math.sin(x * 0.035) * Math.cos(z * 0.03) +
    1.3 * Math.sin(x * 0.07 + 1.3) * Math.sin(z * 0.06 + 0.7) +
    0.45 * Math.sin(x * 0.15 + z * 0.11);
  const r = Math.hypot(x, z);
  h += 6 * Math.exp(-(r * r) / (2 * 22 * 22)); // the Party Tree hill
  // Big rolling green hills around the valley, like a postcard.
  const outer = smooth(95, 150, r);
  h += outer * (7 + 6 * Math.sin(Math.atan2(z, x) * 5 + 1.2) + 4 * Math.sin(x * 0.045) * Math.cos(z * 0.05));
  h += Math.pow(Math.max(0, r - 150) * 0.2, 1.55);
  return h;
}

const CENTER_LEVEL = rawHeight(0, 0);
HAMLETS.forEach((h) => (h.y = rawHeight(h.x, h.z)));
LAB.y = rawHeight(LAB.x, LAB.z);

export function heightAt(x, z) {
  let h = rawHeight(x, z);
  h = THREE.MathUtils.lerp(CENTER_LEVEL, h, smooth(9, 17, Math.hypot(x, z)));
  for (const hm of HAMLETS) h = THREE.MathUtils.lerp(hm.y, h, smooth(16, 28, Math.hypot(x - hm.x, z - hm.z)));
  h = THREE.MathUtils.lerp(LAB.y, h, smooth(7, 12, Math.hypot(x - LAB.x, z - LAB.z)));
  // Roads are gently levelled so they read as built paths.
  const pd = distToPath(x, z);
  if (pd < 6) h -= (1 - smooth(ROAD_HALF, 6, pd)) * 0.12;
  const pdist = Math.hypot(x - POND.x, z - POND.z);
  h -= 4.5 * (1 - smooth(0, POND.r * 1.3, pdist));
  return h;
}

export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Places where nothing should grow (plazas, roads, water).
function isClearing(x, z, pad = 0) {
  if (Math.hypot(x, z) < 10 + pad) return true;
  if (Math.hypot(x - LAB.x, z - LAB.z) < 7 + pad) return true;
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.5 + pad) return true;
  for (const h of HAMLETS) if (Math.hypot(x - h.x, z - h.z) < 9 + pad) return true;
  return distToPath(x, z) < ROAD_HALF + 0.4 + pad;
}

// ---------- Sky ----------

const SKY = { top: '#1f7fd1', mid: '#7cc4f0', horizon: '#e4f4fb' };

export function makeSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(SKY.top) },
      mid: { value: new THREE.Color(SKY.mid) },
      horizon: { value: new THREE.Color(SKY.horizon) },
      sunDir: { value: new THREE.Vector3(0.55, 0.62, 0.35).normalize() },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 sunDir; varying vec3 vP;
      void main(){
        float y = vP.y;
        vec3 c = mix(horizon, mid, smoothstep(-0.03, 0.22, y));
        c = mix(c, top, smoothstep(0.22, 0.85, y));
        float s = max(dot(normalize(vP), sunDir), 0.0);
        c += vec3(1.0, 0.95, 0.85) * (pow(s, 600.0) * 3.0 + pow(s, 12.0) * 0.18);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function buildSky(scene) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(950, 32, 16), makeSkyMaterial());
  sky.renderOrder = -1;
  scene.add(sky);
  return sky;
}

// Soft cumulus clouds painted on canvas, placed on a ring around the valley.
function cloudTexture(seed) {
  const r = rng(seed);
  return canvasTexture(512, 256, (ctx, w, h) => {
    const puffs = [];
    const n = 22 + Math.floor(r() * 10);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = w * (0.12 + t * 0.76) + (r() - 0.5) * 40;
      const big = Math.sin(t * Math.PI);
      const rad = 30 + big * 70 * (0.6 + r() * 0.5);
      const y = h * 0.78 - rad * (0.55 + r() * 0.35);
      puffs.push({ x, y, rad });
    }
    // shadowed base
    for (const p of puffs) {
      const g = ctx.createRadialGradient(p.x, p.y + p.rad * 0.25, 0, p.x, p.y + p.rad * 0.25, p.rad);
      g.addColorStop(0, 'rgba(176,196,214,0.9)');
      g.addColorStop(0.7, 'rgba(190,208,224,0.55)');
      g.addColorStop(1, 'rgba(200,215,230,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y + p.rad * 0.25, p.rad, 0, Math.PI * 2);
      ctx.fill();
    }
    // sunlit tops
    for (const p of puffs) {
      const g = ctx.createRadialGradient(p.x - p.rad * 0.2, p.y - p.rad * 0.3, 0, p.x, p.y, p.rad * 0.95);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.6, 'rgba(250,252,255,0.85)');
      g.addColorStop(1, 'rgba(240,246,252,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.rad * 0.95, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function buildClouds(scene) {
  const r = rng(21);
  const textures = [1, 2, 3, 4, 5].map(cloudTexture);
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const mat = new THREE.SpriteMaterial({ map: textures[i % textures.length], fog: false, depthWrite: false, transparent: true });
    const s = new THREE.Sprite(mat);
    const a = r() * Math.PI * 2;
    const d = 380 + r() * 260;
    const scale = 140 + r() * 180;
    s.scale.set(scale, scale * 0.5, 1);
    s.position.set(Math.cos(a) * d, 70 + r() * 110, Math.sin(a) * d);
    s.userData = { a, d, speed: 0.004 + r() * 0.006 };
    scene.add(s);
    clouds.push(s);
  }
  return (t) => {
    for (const c of clouds) {
      const a = c.userData.a + t * c.userData.speed;
      c.position.x = Math.cos(a) * c.userData.d;
      c.position.z = Math.sin(a) * c.userData.d;
    }
  };
}

// ---------- Ground ----------

export function buildTerrain(scene) {
  const size = 640;
  const geo = new THREE.PlaneGeometry(size, size, 256, 256);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const deep = new THREE.Color('#3f8a2c');
  const lush = new THREE.Color('#5fae38');
  const sunny = new THREE.Color('#9ccf4c');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const n = 0.5 + 0.5 * Math.sin(x * 0.11 + Math.cos(z * 0.09) * 2.0) * Math.cos(z * 0.07);
    c.copy(deep).lerp(lush, 0.45 + n * 0.45);
    c.lerp(sunny, Math.max(0, Math.sin(x * 0.03 + 2) * Math.sin(z * 0.025 + 1)) * 0.45 + Math.max(0, y - 6) * 0.015);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  terrain.receiveShadow = true;
  terrain.name = 'terrain';
  scene.add(terrain);

  // Roads as real ribbons, so their edges stay crisp at any distance.
  const roadMat = new THREE.MeshStandardMaterial({ color: '#eceee9', roughness: 0.85 });
  const ribbons = [];
  for (const [ax, az, bx, bz] of PATHS) {
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.ceil(len / 1.5);
    const nx = -(bz - az) / len;
    const nz = (bx - ax) / len;
    const pos = [];
    const idx = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const px = ax + (bx - ax) * t;
      const pz = az + (bz - az) * t;
      for (const side of [-1, 1]) {
        const x = px + nx * ROAD_HALF * side;
        const z = pz + nz * ROAD_HALF * side;
        pos.push(x, Math.max(heightAt(x, z), heightAt(px, pz)) + 0.07, z);
      }
      if (k < steps) {
        const i = k * 2;
        idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    ribbons.push(g);
  }
  const plaza = (x, z, rad, y) => {
    const g = new THREE.CircleGeometry(rad, 48);
    g.rotateX(-Math.PI / 2);
    g.translate(x, y + 0.09, z);
    g.deleteAttribute('uv');
    ribbons.push(g);
  };
  for (const h of HAMLETS) plaza(h.x, h.z, 9.4, h.y);
  plaza(0, 0, 9.2, heightAt(0, 0));
  plaza(LAB.x, LAB.z, 6.6, LAB.y);
  for (const g of ribbons) if (g.attributes.uv) g.deleteAttribute('uv');
  const roads = new THREE.Mesh(mergeGeometries(ribbons.map((g) => (g.index ? g.toNonIndexed() : g))), roadMat);
  roads.receiveShadow = true;
  scene.add(roads);

  // Road curbs: thin white-metal edging along every road.
  const curbGeo = [];
  for (const [ax, az, bx, bz] of PATHS) {
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.floor(len / 3);
    const nx = -(bz - az) / len;
    const nz = (bx - ax) / len;
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const px = ax + (bx - ax) * t;
      const pz = az + (bz - az) * t;
      for (const side of [-1, 1]) {
        const x = px + nx * (ROAD_HALF + 0.1) * side;
        const z = pz + nz * (ROAD_HALF + 0.1) * side;
        if (isClearing(x, z, -ROAD_HALF - 1) && distToPath(x, z) > ROAD_HALF + 1) continue;
        if (Math.hypot(x, z) < 11 || HAMLETS.some((h) => Math.hypot(x - h.x, z - h.z) < 10)) continue;
        const g = new THREE.BoxGeometry(0.18, 0.14, 3.05);
        g.rotateY(Math.atan2(bx - ax, bz - az));
        g.translate(x, heightAt(x, z) + 0.05, z);
        curbGeo.push(g);
      }
    }
  }
  const curbs = new THREE.Mesh(mergeGeometries(curbGeo), new THREE.MeshPhysicalMaterial({ color: '#f4f6f8', metalness: 0.4, roughness: 0.3 }));
  curbs.receiveShadow = true;
  scene.add(curbs);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(POND.r * 1.5, 48),
    new THREE.MeshPhysicalMaterial({ color: '#4fb4d8', roughness: 0.04, metalness: 0.15, transparent: true, opacity: 0.9, clearcoat: 1 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(POND.x, WATER_LEVEL, POND.z);
  scene.add(water);
  return { terrain };
}

// ---------- Grass: ~180k wind-blown blades in one draw call ----------

export function buildGrass(scene, count = 180000) {
  const r = rng(8);
  const blade = new THREE.BufferGeometry();
  const ys = [0, 0.35, 0.7, 1];
  const ws = [0.07, 0.055, 0.03, 0];
  const verts = [];
  const cols = [];
  const base = new THREE.Color('#2f6e21');
  const tip = new THREE.Color('#b6e06a');
  ys.forEach((y, i) => {
    const c = base.clone().lerp(tip, y);
    if (ws[i] === 0) {
      verts.push(0, y, 0);
      cols.push(c.r, c.g, c.b);
    } else {
      verts.push(-ws[i], y, 0, ws[i], y, 0);
      cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
  });
  blade.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  blade.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  blade.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6]);
  blade.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(7).fill([0, 1, 0.3]).flat(), 3));

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 });
  const wind = windMaterial(mat, { strength: 0.32 });
  const mesh = new THREE.InstancedMesh(blade, mat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  let i = 0;
  let guard = 0;
  while (i < count && guard++ < count * 4) {
    const a = r() * Math.PI * 2;
    const d = 4 + Math.sqrt(r()) * 172;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (isClearing(x, z)) continue;
    const y = heightAt(x, z);
    if (y < WATER_LEVEL + 0.3) continue;
    const h = 0.35 + r() * 0.5 + smooth(60, 150, d) * 0.5;
    q.setFromAxisAngle(up, r() * Math.PI);
    m.compose(new THREE.Vector3(x, y - 0.05, z), q, new THREE.Vector3(1 + r() * 0.6, h, 1));
    mesh.setMatrixAt(i, m);
    const v = 0.85 + r() * 0.3;
    mesh.setColorAt(i, col.setRGB(v * (0.9 + r() * 0.2), v, v * (0.85 + r() * 0.2)));
    i++;
  }
  mesh.count = i;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return wind;
}

// ---------- Lavender meadows on the hillsides ----------

export function buildLavender(scene, count = 14000) {
  const r = rng(31);
  const stem = new THREE.CylinderGeometry(0.012, 0.018, 0.55, 3);
  stem.translate(0, 0.275, 0);
  const head = new THREE.CapsuleGeometry(0.05, 0.22, 2, 5);
  head.translate(0, 0.66, 0);
  const paint = (g, color) => {
    const c = new THREE.Color(color);
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill([c.r, c.g, c.b]).flat(), 3));
    return g;
  };
  const geo = mergeGeometries([paint(stem.toNonIndexed(), '#4f7d34'), paint(head.toNonIndexed(), '#ffffff')]);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  const wind = windMaterial(mat, { strength: 0.18 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const shades = ['#9b7fe0', '#b18cf0', '#8a6fd6', '#c4a6f5', '#d9a6e8'];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const patches = [];
  for (let p = 0; p < 34; p++) {
    const a = r() * Math.PI * 2;
    const d = 28 + r() * 130;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (isClearing(x, z, 5)) {
      p--;
      continue;
    }
    patches.push({ x, z, rad: 5 + r() * 9 });
  }
  let i = 0;
  let guard = 0;
  while (i < count && guard++ < count * 5) {
    const p = patches[Math.floor(r() * patches.length)];
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * p.rad;
    const x = p.x + Math.cos(a) * d * 1.4;
    const z = p.z + Math.sin(a) * d;
    if (isClearing(x, z)) continue;
    const s = 0.8 + r() * 0.7;
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3));
    m.compose(new THREE.Vector3(x, heightAt(x, z) - 0.05, z), q, new THREE.Vector3(s, s, s));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.set(shades[Math.floor(r() * shades.length)]));
    i++;
  }
  mesh.count = i;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return wind;
}

// ---------- Trees ----------

export function buildTrees(scene, colliders) {
  const r = rng(42);
  const spots = [];
  let guard = 0;
  while (spots.length < 300 && guard++ < 20000) {
    const a = r() * Math.PI * 2;
    const d = 22 + Math.sqrt(r()) * 168;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (isClearing(x, z, 3)) continue;
    if (HAMLETS.some((h) => Math.hypot(x - h.x, z - h.z) < 27)) continue;
    if (Math.hypot(x, z) < 26) continue;
    if (d < 110 && r() < 0.6) continue;
    spots.push({ x, z, s: 0.8 + r() * 0.7, kind: r() < 0.35 ? 'poplar' : 'round', rot: r() * 6, hue: r() });
  }
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 2.6, 7);
  trunkGeo.translate(0, 1.3, 0);
  const blobs = [];
  for (const [x, y, z, s] of [[0, 3.8, 0, 2.1], [1.2, 3.3, 0.4, 1.4], [-1.1, 3.4, -0.3, 1.5], [0.2, 4.9, -0.2, 1.4], [-0.3, 3.2, 1.1, 1.2]]) {
    const g = new THREE.IcosahedronGeometry(s, 1);
    g.translate(x, y, z);
    blobs.push(g);
  }
  const roundGeo = mergeGeometries(blobs);
  const poplarGeo = new THREE.SphereGeometry(1.1, 10, 12);
  poplarGeo.scale(1, 3.2, 1);
  poplarGeo.translate(0, 4.6, 0);

  const leaf = new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
  const trunk = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: '#6e5038' }), spots.length);
  const rounds = spots.filter((s) => s.kind === 'round');
  const poplars = spots.filter((s) => s.kind === 'poplar');
  const roundMesh = new THREE.InstancedMesh(roundGeo, leaf, rounds.length);
  const poplarMesh = new THREE.InstancedMesh(poplarGeo, leaf.clone(), poplars.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const greens = ['#3f8f2e', '#4fa336', '#357e2c', '#62b03c', '#2e6e2a'];
  const up = new THREE.Vector3(0, 1, 0);
  spots.forEach((s, i) => {
    q.setFromAxisAngle(up, s.rot);
    m.compose(new THREE.Vector3(s.x, heightAt(s.x, s.z) - 0.1, s.z), q, new THREE.Vector3(s.s, s.s, s.s));
    trunk.setMatrixAt(i, m);
    colliders.push({ x: s.x, z: s.z, r: 0.6 * s.s });
  });
  rounds.forEach((s, i) => {
    q.setFromAxisAngle(up, s.rot);
    m.compose(new THREE.Vector3(s.x, heightAt(s.x, s.z) - 0.1, s.z), q, new THREE.Vector3(s.s, s.s, s.s));
    roundMesh.setMatrixAt(i, m);
    roundMesh.setColorAt(i, col.set(greens[Math.floor(s.hue * 4)]));
  });
  poplars.forEach((s, i) => {
    q.setFromAxisAngle(up, s.rot);
    m.compose(new THREE.Vector3(s.x, heightAt(s.x, s.z) - 0.1, s.z), q, new THREE.Vector3(s.s, s.s, s.s));
    poplarMesh.setMatrixAt(i, m);
    poplarMesh.setColorAt(i, col.set(greens[1 + Math.floor(s.hue * 4)]));
  });
  for (const im of [trunk, roundMesh, poplarMesh]) {
    im.castShadow = true;
    im.receiveShadow = true;
    scene.add(im);
  }
}

// Distant blue mountains for depth.
export function buildMountains(scene) {
  const r = rng(3);
  const mat = new THREE.MeshStandardMaterial({ color: '#7fa7b8', flatShading: true, roughness: 1 });
  const snow = new THREE.MeshStandardMaterial({ color: '#f3f7fa', flatShading: true });
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + r() * 0.1;
    const d = 330 + r() * 80;
    const h = 60 + r() * 90;
    const rad = 50 + r() * 40;
    const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 8), mat);
    m.position.set(Math.cos(a) * d, h / 2 - 6, Math.sin(a) * d);
    m.rotation.y = r() * 3;
    scene.add(m);
    if (h > 110) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.3, h * 0.3, 8), snow);
      cap.position.y = h * 0.35;
      m.add(cap);
    }
  }
}

// Sunlit pollen drifting through the air.
export function buildPollen(scene) {
  const count = 700;
  const pos = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const r = rng(5);
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 160;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    pos.set([x, heightAt(x, z) + 0.5 + r() * 7, z], i * 3);
    seeds[i] = r() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const base = pos.slice();
  const dot = canvasTexture(32, 32, (ctx) => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  });
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: '#fff6c8', size: 0.28, map: dot, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  scene.add(pts);
  return (t) => {
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      pos[i * 3] = base[i * 3] + Math.sin(t * 0.3 + s) * 1.5;
      pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.5 + s * 2) * 0.6;
      pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.25 + s) * 1.5;
    }
    geo.attributes.position.needsUpdate = true;
  };
}
