import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HAMLETS, LAB, HOME, FUN, AIHUB, HALL } from './data.js';
import { windMaterial, canvasTexture } from './materials.js';

// ---------- Layout ----------

export const HAMLET_RADIUS = 72;
export const WORLD_RADIUS = 175;
export const WATER_LEVEL = -1.0;
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

// Home and the Playhouse sit inside the ring, between hamlets.
for (const [place, i] of [[FUN, 2], [HALL, 3], [HOME, 4], [AIHUB, 5]]) {
  const a = HAMLETS[i].angle + Math.PI / 6;
  place.angle = a;
  place.x = Math.cos(a) * 40;
  place.z = Math.sin(a) * 40;
}
export const ZONES = [HOME, FUN, AIHUB, HALL];

// Jaipur on the island: Jantar Mantar in the free slot between the Lab and the Playhouse,
// and the old-city bazaar along the ring road past Home.
export const JANTAR = { x: 40, z: 0, r: 13 };
export const BAZAAR = (() => {
  const a = HAMLETS[4];
  const b = HAMLETS[5];
  const L = Math.hypot(b.x - a.x, b.z - a.z);
  const u = (L / 2 - 16) / L;
  return { ax: a.x + (b.x - a.x) * u, az: a.z + (b.z - a.z) * u, bx: b.x - (b.x - a.x) * u, bz: b.z - (b.z - a.z) * u, side: -1 };
})();

export const PATHS = [];
HAMLETS.forEach((h, i) => {
  const n = HAMLETS[(i + 1) % HAMLETS.length];
  PATHS.push([0, 0, h.x, h.z]);
  PATHS.push([h.x, h.z, n.x, n.z]);
});
// Branch paths from the nearest spoke into each inner zone, keeping the centre plaza clear.
for (const [z, i, r, edge] of [[FUN, 2, 32, 11], [HALL, 3, 32, 11], [HOME, 4, 32, 11], [AIHUB, 5, 32, 11], [LAB, 1, 19, 5.5]]) {
  const a = HAMLETS[i].angle;
  const sx = Math.cos(a) * r;
  const sz = Math.sin(a) * r;
  const dx = z.x - sx;
  const dz = z.z - sz;
  const l = Math.hypot(dx, dz);
  PATHS.push([sx, sz, z.x - (dx / l) * edge, z.z - (dz / l) * edge]);
}

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

// The island's coastline radius at a given angle.
export const SEA_LEVEL = -1.0;
export function coastR(a) {
  return 152 + 9 * Math.sin(3 * a + 1) + 6 * Math.sin(5 * a + 0.4) + 3 * Math.sin(9 * a);
}

function rawHeight(x, z) {
  let h =
    2.0 * Math.sin(x * 0.035) * Math.cos(z * 0.03) +
    1.3 * Math.sin(x * 0.07 + 1.3) * Math.sin(z * 0.06 + 0.7) +
    0.45 * Math.sin(x * 0.15 + z * 0.11);
  const r = Math.hypot(x, z);
  const a = Math.atan2(z, x);
  const R = coastR(a);
  h += 6 * Math.exp(-(r * r) / (2 * 22 * 22)); // the Party Tree hill
  // A ring of rolling green hills, easing down to the beaches.
  const ring = smooth(92, 118, r) * (1 - smooth(R - 30, R - 12, r));
  h += ring * (6 + 4 * Math.sin(a * 5 + 1.2) + 3 * Math.sin(x * 0.045) * Math.cos(z * 0.05));
  h += 2.5; // keep the inland meadows comfortably above the sea
  // Beach, then the sea floor.
  const coast = smooth(R - 14, R + 16, r);
  h = THREE.MathUtils.lerp(h, -10, coast);
  return h;
}

const CENTER_LEVEL = rawHeight(0, 0);
// Small level pads for things built on the Party Tree hill (the café and the video wall).
export const PADS = [
  { x: 16.5, z: 0, r: 6 },
  { x: Math.cos((120 * Math.PI) / 180) * 15.5, z: Math.sin((120 * Math.PI) / 180) * 15.5, r: 4.5 },
].map((p) => ({ ...p, y: rawHeight(p.x, p.z) }));
HAMLETS.forEach((h) => (h.y = rawHeight(h.x, h.z)));
LAB.y = rawHeight(LAB.x, LAB.z);
for (const z of ZONES) z.y = rawHeight(z.x, z.z);
JANTAR.y = rawHeight(JANTAR.x, JANTAR.z);

export function heightAt(x, z) {
  let h = rawHeight(x, z);
  h = THREE.MathUtils.lerp(CENTER_LEVEL, h, smooth(9, 17, Math.hypot(x, z)));
  for (const p of PADS) h = THREE.MathUtils.lerp(p.y, h, smooth(p.r, p.r + 5, Math.hypot(x - p.x, z - p.z)));
  for (const hm of HAMLETS) h = THREE.MathUtils.lerp(hm.y, h, smooth(16, 28, Math.hypot(x - hm.x, z - hm.z)));
  h = THREE.MathUtils.lerp(LAB.y, h, smooth(7, 12, Math.hypot(x - LAB.x, z - LAB.z)));
  for (const zn of ZONES) h = THREE.MathUtils.lerp(zn.y, h, smooth(14, 22, Math.hypot(x - zn.x, z - zn.z)));
  h = THREE.MathUtils.lerp(JANTAR.y, h, smooth(JANTAR.r + 1, JANTAR.r + 8, Math.hypot(x - JANTAR.x, z - JANTAR.z)));
  const pdist = Math.hypot(x - POND.x, z - POND.z);
  h -= 6.5 * (1 - smooth(0, POND.r * 1.3, pdist));
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

// ---------- The ground as rendered ----------
// The terrain is a triangle mesh on a 2.5-unit grid, so its surface differs slightly from heightAt between
// vertices. Characters and props use groundAt, which samples the same triangles the GPU draws.
const GRID = { size: 640, n: 256, heights: null };
export const SURFACE = 0.03; // roads and plazas sit this far above the grass

export function groundAt(x, z) {
  const H = GRID.heights;
  if (!H) return heightAt(x, z);
  const s = GRID.size / GRID.n;
  const fx = (x + GRID.size / 2) / s;
  const fz = (z + GRID.size / 2) / s;
  const ix = Math.min(GRID.n - 1, Math.max(0, Math.floor(fx)));
  const iz = Math.min(GRID.n - 1, Math.max(0, Math.floor(fz)));
  const u = Math.min(1, Math.max(0, fx - ix));
  const v = Math.min(1, Math.max(0, fz - iz));
  const row = GRID.n + 1;
  const h00 = H[iz * row + ix];
  const h10 = H[iz * row + ix + 1];
  const h01 = H[(iz + 1) * row + ix];
  const h11 = H[(iz + 1) * row + ix + 1];
  // PlaneGeometry splits each cell along the (x0,z1)-(x1,z0) diagonal
  if (u + v <= 1) return h00 + u * (h10 - h00) + v * (h01 - h00);
  return h11 + (1 - u) * (h01 - h11) + (1 - v) * (h10 - h11);
}

// Is this point on a paved surface (road or plaza)?
export function onPaving(x, z) {
  if (distToPath(x, z) < ROAD_HALF) return true;
  if (Math.hypot(x, z) < 9.2) return true;
  if (Math.hypot(x - LAB.x, z - LAB.z) < 6.6) return true;
  for (const h of HAMLETS) if (Math.hypot(x - h.x, z - h.z) < 9.4) return true;
  for (const zn of ZONES) if (Math.hypot(x - zn.x, z - zn.z) < 12.5) return true;
  return false;
}

// Where feet should stand: the rendered ground, plus the paving thickness when on a road or plaza.
export function walkY(x, z) {
  return groundAt(x, z) + (onPaving(x, z) ? SURFACE : 0);
}

// Places where nothing should grow (plazas, roads, water).
function isClearing(x, z, pad = 0) {
  if (Math.hypot(x, z) < 10 + pad) return true;
  if (Math.hypot(x - LAB.x, z - LAB.z) < 7 + pad) return true;
  for (const zn of ZONES) if (Math.hypot(x - zn.x, z - zn.z) < 13 + pad) return true;
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.5 + pad) return true;
  for (const h of HAMLETS) if (Math.hypot(x - h.x, z - h.z) < 9 + pad) return true;
  if (Math.hypot(x - JANTAR.x, z - JANTAR.z) < JANTAR.r + 2 + pad) return true;
  if (distToSegment(x, z, [BAZAAR.ax, BAZAAR.az, BAZAAR.bx, BAZAAR.bz]) < 11 + pad) return true;
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
  const heights = new Float32Array(257 * 257);
  const step = size / 256;
  for (let iz = 0; iz <= 256; iz++) for (let ix = 0; ix <= 256; ix++) heights[iz * 257 + ix] = heightAt(ix * step - size / 2, iz * step - size / 2);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const deep = new THREE.Color('#3f8a2c');
  const sand = new THREE.Color('#ecdcb0');
  const wetSand = new THREE.Color('#bfa77a');
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
    // sandy beaches and wet sand under the shallows
    c.lerp(sand, 1 - smooth(SEA_LEVEL + 0.9, SEA_LEVEL + 2.2, y));
    c.lerp(wetSand, 1 - smooth(SEA_LEVEL - 1.5, SEA_LEVEL + 0.2, y));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  GRID.heights = heights;
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  terrain.receiveShadow = true;
  terrain.name = 'terrain';
  scene.add(terrain);

  // Roads as real ribbons, so their edges stay crisp at any distance.
  const roadMat = new THREE.MeshStandardMaterial({ color: '#d9dcd5', roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const ribbons = [];
  for (const [ax, az, bx, bz] of PATHS) {
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.ceil(len / 1.25);
    const nx = -(bz - az) / len;
    const nz = (bx - ax) / len;
    const pos = [];
    const idx = [];
    const across = [-1, -0.5, 0, 0.5, 1]; // several vertices across so the road follows cross-slopes
    const W = across.length;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const px = ax + (bx - ax) * t;
      const pz = az + (bz - az) * t;
      for (const side of across) {
        const x = px + nx * ROAD_HALF * side;
        const z = pz + nz * ROAD_HALF * side;
        pos.push(x, groundAt(x, z) + SURFACE, z);
      }
      if (k < steps) {
        for (let j = 0; j < W - 1; j++) {
          const i = k * W + j;
          idx.push(i, i + 1, i + W, i + 1, i + W + 1, i + W);
        }
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
    g.translate(x, y + SURFACE + 0.004, z);
    g.deleteAttribute('uv');
    ribbons.push(g);
  };
  for (const h of HAMLETS) plaza(h.x, h.z, 9.4, h.y);
  plaza(0, 0, 9.2, heightAt(0, 0));
  plaza(LAB.x, LAB.z, 6.6, LAB.y);
  for (const zn of ZONES) plaza(zn.x, zn.z, 12.5, zn.y);
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
        g.translate(x, groundAt(x, z) + 0.05, z);
        curbGeo.push(g);
      }
    }
  }
  const curbs = new THREE.Mesh(mergeGeometries(curbGeo), new THREE.MeshPhysicalMaterial({ color: '#f4f6f8', metalness: 0.4, roughness: 0.3 }));
  curbs.receiveShadow = true;
  scene.add(curbs);

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
    const d = 4 + Math.sqrt(r()) * 165;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (isClearing(x, z)) continue;
    const y = heightAt(x, z);
    if (y < WATER_LEVEL + 0.3 || y < SEA_LEVEL + 2.2) continue;
    const h = 0.35 + r() * 0.5 + smooth(60, 150, d) * 0.5;
    q.setFromAxisAngle(up, r() * Math.PI);
    m.compose(new THREE.Vector3(x, groundAt(x, z) - 0.03, z), q, new THREE.Vector3(1 + r() * 0.6, h, 1));
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
    if (isClearing(x, z) || heightAt(x, z) < SEA_LEVEL + 2.4) continue;
    const s = 0.8 + r() * 0.7;
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3));
    m.compose(new THREE.Vector3(x, groundAt(x, z) - 0.03, z), q, new THREE.Vector3(s, s, s));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.set(shades[Math.floor(r() * shades.length)]));
    i++;
  }
  mesh.count = i;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return wind;
}

// ---------- Flowers: marigold verges, rose and jasmine beds round the plazas, wildflower meadows ----------

export function buildFlowers(scene, count = 9000) {
  const r = rng(77);
  const paint = (g, color) => {
    const c = new THREE.Color(color);
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill([c.r, c.g, c.b]).flat(), 3));
    return g;
  };
  // a little clump: three blooms on stems over a few leaves
  const parts = [];
  for (const [x, z, h] of [[0, 0, 0.7], [0.14, 0.08, 0.58], [-0.1, 0.12, 0.5]]) {
    const stem = new THREE.CylinderGeometry(0.015, 0.02, h, 3);
    stem.translate(x, h / 2, z);
    const head = new THREE.IcosahedronGeometry(0.15, 1);
    head.scale(1, 0.62, 1);
    head.translate(x, h + 0.04, z);
    parts.push(paint(stem.toNonIndexed(), '#5c8f3a'), paint(head.toNonIndexed(), '#ffffff'));
  }
  for (let k = 0; k < 3; k++) {
    const leaf = new THREE.ConeGeometry(0.09, 0.3, 3);
    leaf.rotateZ(1.0);
    leaf.translate(0.12, 0.12, 0);
    leaf.rotateY((k / 3) * Math.PI * 2);
    parts.push(paint(leaf.toNonIndexed(), '#4c8a30'));
  }
  const geo = mergeGeometries(parts);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, flatShading: true });
  const wind = windMaterial(mat, { strength: 0.14 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const MARIGOLD = ['#ff9f1c', '#ffb703', '#f77f00', '#ffd23f'];
  const BEDS = ['#e63946', '#ff4f8b', '#ffffff', '#ffd6e0', '#d6247a', '#ffb703'];
  const WILD = ['#ffffff', '#ffd23f', '#c4a6f5', '#ff8fb1', '#7bdff2'];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  let i = 0;
  const plant = (x, z, palette, s = 1) => {
    if (i >= count || isClearing(x, z) || heightAt(x, z) < SEA_LEVEL + 2.4) return;
    const k = s * (1.0 + r() * 0.6);
    q.setFromEuler(e.set((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3));
    m.compose(v.set(x, groundAt(x, z) - 0.02, z), q, sc.set(k, k, k));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.set(palette[Math.floor(r() * palette.length)]));
    i++;
  };
  const budget = (f) => Math.floor(count * f);
  // marigold verges along the roads
  for (let n = 0, guard = 0; n < budget(0.4) && guard < count * 20; guard++) {
    const seg = PATHS[Math.floor(r() * PATHS.length)];
    const u = r();
    const dx = seg[2] - seg[0];
    const dz = seg[3] - seg[1];
    const L = Math.hypot(dx, dz) || 1;
    const side = r() < 0.5 ? -1 : 1;
    const off = ROAD_HALF + 0.8 + r() * 1.3;
    const x = seg[0] + dx * u + (-dz / L) * off * side;
    const z = seg[1] + dz * u + (dx / L) * off * side;
    if (distToPath(x, z) < ROAD_HALF + 0.6) continue;
    const before = i;
    plant(x, z, MARIGOLD, 0.95);
    if (i > before) n++;
  }
  // rose and jasmine beds ringing the plazas and domes
  const rings = [
    ...HAMLETS.map((h) => ({ x: h.x, z: h.z, r0: 12.5, r1: 15 })),
    ...ZONES.map((zn) => ({ x: zn.x, z: zn.z, r0: 13.5, r1: 16 })),
    { x: JANTAR.x, z: JANTAR.z, r0: JANTAR.r + 2.2, r1: JANTAR.r + 4 },
    { x: 0, z: 0, r0: 10.5, r1: 13 },
  ];
  for (let n = 0; n < budget(0.3); n++) {
    const g = rings[Math.floor(r() * rings.length)];
    const a = r() * Math.PI * 2;
    const d = g.r0 + r() * (g.r1 - g.r0);
    plant(g.x + Math.cos(a) * d, g.z + Math.sin(a) * d, BEDS, 1.1);
  }
  // wildflower meadows out on the hills
  const patches = [];
  for (let p = 0, guard = 0; p < 40 && guard < 4000; guard++) {
    const a = r() * Math.PI * 2;
    const d = 30 + r() * 120;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (isClearing(x, z, 4)) continue;
    patches.push({ x, z, rad: 4 + r() * 7 });
    p++;
  }
  while (i < count && patches.length) {
    const p = patches[Math.floor(r() * patches.length)];
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * p.rad;
    const before = i;
    plant(p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, WILD, 0.85);
    if (i === before && r() < 0.02) break;
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
    if (isClearing(x, z, 3) || heightAt(x, z) < SEA_LEVEL + 2.6) continue;
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
    m.compose(new THREE.Vector3(s.x, groundAt(s.x, s.z) - 0.15, s.z), q, new THREE.Vector3(s.s, s.s, s.s));
    trunk.setMatrixAt(i, m);
    colliders.push({ x: s.x, z: s.z, r: 0.6 * s.s });
  });
  rounds.forEach((s, i) => {
    q.setFromAxisAngle(up, s.rot);
    m.compose(new THREE.Vector3(s.x, groundAt(s.x, s.z) - 0.15, s.z), q, new THREE.Vector3(s.s, s.s, s.s));
    roundMesh.setMatrixAt(i, m);
    roundMesh.setColorAt(i, col.set(greens[Math.floor(s.hue * 4)]));
  });
  poplars.forEach((s, i) => {
    q.setFromAxisAngle(up, s.rot);
    m.compose(new THREE.Vector3(s.x, groundAt(s.x, s.z) - 0.15, s.z), q, new THREE.Vector3(s.s, s.s, s.s));
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
    if (r() < 0.45) continue; // gaps of open sea between the far islands
    const a = (i / 40) * Math.PI * 2 + r() * 0.1;
    const d = 420 + r() * 120;
    const h = 60 + r() * 90;
    const rad = 50 + r() * 40;
    const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 8), mat);
    m.position.set(Math.cos(a) * d, h / 2 - 12, Math.sin(a) * d);
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

// ---------- The sea ----------

export function buildOcean(scene) {
  const mat = new THREE.ShaderMaterial({
    fog: true,
    transparent: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color('#0f6fa6') },
        uShallow: { value: new THREE.Color('#3cc6d8') },
        uSky: { value: new THREE.Color('#bfe6ff') },
        uSun: { value: new THREE.Vector3(0.5, 0.6, 0.3).normalize() },
        uNight: { value: 0 },
      },
    ]),
    vertexShader: `
      uniform float uTime;
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        vec4 w = modelMatrix * vec4(p, 1.0);
        float r = length(w.xz);
        w.y += (sin(w.x * 0.08 + uTime * 0.9) + sin(w.z * 0.11 - uTime * 0.7)) * 0.18 * smoothstep(150.0, 260.0, r);
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uSun; uniform float uNight;
      varying vec3 vW;
      #include <fog_pars_fragment>
      float coastR(float a) { return 152.0 + 9.0 * sin(3.0 * a + 1.0) + 6.0 * sin(5.0 * a + 0.4) + 3.0 * sin(9.0 * a); }
      void main() {
        float t = uTime;
        vec2 p = vW.xz;
        // layered waves for the normal
        vec2 g = vec2(0.0);
        g += vec2(cos(p.x * 0.21 + t * 1.3), 0.0) * 0.20;
        g += vec2(0.0, cos(p.y * 0.17 - t * 1.1)) * 0.20;
        g += vec2(cos((p.x + p.y) * 0.43 + t * 2.1)) * 0.08;
        g += vec2(cos((p.x - p.y) * 0.9 - t * 2.7)) * 0.04;
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 v = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        float r = length(p);
        float R = coastR(atan(p.y, p.x));
        float shore = 1.0 - smoothstep(R - 4.0, R + 34.0, r);
        vec3 col = mix(uDeep, uShallow, shore * 0.85);
        col = mix(col, uSky, fres * 0.6);
        vec3 h = normalize(uSun + v);
        float spec = pow(max(dot(n, h), 0.0), 220.0) * (1.0 - uNight * 0.8);
        col += vec3(1.0, 0.97, 0.9) * spec * 2.5;
        // foam where waves meet the beach
        float band = 1.0 - smoothstep(0.0, 6.0, abs(r - (R + 4.0 + sin(t * 0.8 + atan(p.y, p.x) * 12.0) * 1.2)));
        float foam = band * (0.55 + 0.45 * sin(r * 1.7 - t * 2.4 + sin(p.x * 0.3) * 2.0));
        col = mix(col, vec3(1.0), clamp(foam, 0.0, 1.0) * 0.8);
        col *= mix(1.0, 0.35, uNight);
        gl_FragColor = vec4(col, 0.94);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 200, 200), mat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = SEA_LEVEL;
  scene.add(sea);
  return mat;
}
