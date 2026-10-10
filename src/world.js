import * as THREE from 'three';
import { HAMLETS } from './data.js';

// ---------- Layout ----------

export const HAMLET_RADIUS = 72;
export const WORLD_RADIUS = 175;
export const WATER_LEVEL = -1.6;

HAMLETS.forEach((h, i) => {
  const a = -Math.PI / 2 + (i / HAMLETS.length) * Math.PI * 2;
  h.angle = a;
  h.x = Math.cos(a) * HAMLET_RADIUS;
  h.z = Math.sin(a) * HAMLET_RADIUS;
});

// Pond sits between the first two hamlets, inside the ring road.
const pondAngle = (HAMLETS[0].angle + HAMLETS[1].angle) / 2;
export const POND = { x: Math.cos(pondAngle) * 40, z: Math.sin(pondAngle) * 40, r: 9 };

// Path segments: spokes from the centre plus a ring between hamlets.
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

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function rawHeight(x, z) {
  let h =
    2.2 * Math.sin(x * 0.035) * Math.cos(z * 0.03) +
    1.4 * Math.sin(x * 0.07 + 1.3) * Math.sin(z * 0.06 + 0.7) +
    0.5 * Math.sin(x * 0.15 + z * 0.11);
  const r = Math.hypot(x, z);
  h += 6 * Math.exp(-(r * r) / (2 * 22 * 22)); // the Party Tree hill
  h += Math.pow(Math.max(0, r - 140) * 0.18, 1.6); // valley rim
  return h;
}

const CENTER_LEVEL = rawHeight(0, 0);
HAMLETS.forEach((h) => (h.y = rawHeight(h.x, h.z)));

export function heightAt(x, z) {
  let h = rawHeight(x, z);
  h = THREE.MathUtils.lerp(CENTER_LEVEL, h, smooth(9, 17, Math.hypot(x, z)));
  for (const hm of HAMLETS) {
    h = THREE.MathUtils.lerp(hm.y, h, smooth(15, 27, Math.hypot(x - hm.x, z - hm.z)));
  }
  const pd = Math.hypot(x - POND.x, z - POND.z);
  h -= 4.5 * (1 - smooth(0, POND.r * 1.3, pd));
  return h;
}

// Deterministic randomness so the village looks the same on every visit.
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

// ---------- Scene pieces ----------

export function buildSky(scene) {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color('#5d9bd6') },
      mid: { value: new THREE.Color('#bcd9ea') },
      horizon: { value: new THREE.Color('#f6dcaa') },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vP;
      void main(){ float y = vP.y;
        vec3 c = mix(horizon, mid, smoothstep(-0.02, 0.18, y));
        c = mix(c, top, smoothstep(0.18, 0.75, y));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.renderOrder = -1;
  scene.add(sky);
  return sky;
}

export function buildTerrain(scene) {
  const size = 620;
  const geo = new THREE.PlaneGeometry(size, size, 230, 230);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grassA = new THREE.Color('#79a843');
  const grassB = new THREE.Color('#5b8a34');
  const meadow = new THREE.Color('#a3b850');
  const dirt = new THREE.Color('#a4825a');
  const sand = new THREE.Color('#c9b98a');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const n = 0.5 + 0.5 * Math.sin(x * 0.21 + Math.cos(z * 0.17) * 2.0) * Math.cos(z * 0.13);
    c.copy(grassA).lerp(grassB, n * 0.8);
    c.lerp(meadow, Math.max(0, Math.sin(x * 0.05 + 2) * Math.sin(z * 0.04)) * 0.5);
    const pd = distToPath(x, z);
    c.lerp(dirt, 1 - smooth(1.4, 3.0, pd));
    for (const h of HAMLETS) {
      const d = Math.hypot(x - h.x, z - h.z);
      c.lerp(dirt, (1 - smooth(5, 8, d)) * 0.85);
    }
    c.lerp(dirt, (1 - smooth(5, 8.5, Math.hypot(x, z))) * 0.7);
    c.lerp(sand, (1 - smooth(POND.r * 1.1, POND.r * 1.6, Math.hypot(x - POND.x, z - POND.z))) * 0.8);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  scene.add(mesh);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(POND.r * 1.5, 40),
    new THREE.MeshStandardMaterial({ color: '#4c8fb5', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(POND.x, WATER_LEVEL, POND.z);
  scene.add(water);

  // Lily pads
  const r = rng(11);
  const padMat = new THREE.MeshStandardMaterial({ color: '#4f8a3a' });
  for (let i = 0; i < 9; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.5 + r() * 0.4, 10, 0.4, Math.PI * 1.85), padMat);
    pad.rotation.x = -Math.PI / 2;
    const a = r() * Math.PI * 2;
    const d = r() * POND.r;
    pad.position.set(POND.x + Math.cos(a) * d, WATER_LEVEL + 0.02, POND.z + Math.sin(a) * d);
    pad.rotation.z = r() * 6;
    scene.add(pad);
  }
  return { terrain: mesh, water };
}

export function buildMountains(scene) {
  const r = rng(3);
  const mat = new THREE.MeshStandardMaterial({ color: '#7d9b8a', flatShading: true, roughness: 1 });
  const snow = new THREE.MeshStandardMaterial({ color: '#eef2f2', flatShading: true });
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + r() * 0.08;
    const d = 250 + r() * 50;
    const h = 30 + r() * 55;
    const rad = 28 + r() * 22;
    const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7), mat);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    m.position.set(x, heightAt(x, z) + h / 2 - 4, z);
    m.rotation.y = r() * 3;
    scene.add(m);
    if (h > 65) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.28, h * 0.28, 7), snow);
      cap.position.set(0, h * 0.36, 0);
      m.add(cap);
    }
  }
}

// Instanced forest with clearings around hamlets, paths and the pond.
export function buildTrees(scene, colliders) {
  const r = rng(42);
  const spots = [];
  let guard = 0;
  while (spots.length < 340 && guard++ < 20000) {
    const a = r() * Math.PI * 2;
    const d = 20 + Math.sqrt(r()) * 175;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (Math.hypot(x, z) < 26) continue;
    if (distToPath(x, z) < 4.5) continue;
    if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 5) continue;
    if (HAMLETS.some((h) => Math.hypot(x - h.x, z - h.z) < 27)) continue;
    // Thicker woods towards the edge, open meadows inside.
    if (d < 110 && r() < 0.55) continue;
    spots.push({ x, z, s: 0.8 + r() * 0.8, pine: d > 120 ? r() < 0.6 : r() < 0.2, rot: r() * 6, hue: r() });
  }

  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.4, 6);
  trunkGeo.translate(0, 1.2, 0);
  const roundGeo = new THREE.IcosahedronGeometry(2, 0);
  roundGeo.translate(0, 3.6, 0);
  const pineGeo = new THREE.ConeGeometry(1.7, 5, 7);
  pineGeo.translate(0, 4.2, 0);

  const trunk = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: '#6b4a2f' }), spots.length);
  const rounds = spots.filter((s) => !s.pine);
  const pines = spots.filter((s) => s.pine);
  const roundMesh = new THREE.InstancedMesh(roundGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), rounds.length);
  const pineMesh = new THREE.InstancedMesh(pineGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), pines.length);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const greens = ['#4e8a32', '#5f9b38', '#3f7a35', '#76a63d', '#2f6a3a'];
  spots.forEach((s, i) => {
    const y = heightAt(s.x, s.z) - 0.1;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rot);
    m.compose(new THREE.Vector3(s.x, y, s.z), q, new THREE.Vector3(s.s, s.s, s.s));
    trunk.setMatrixAt(i, m);
    colliders.push({ x: s.x, z: s.z, r: 0.7 * s.s });
  });
  rounds.forEach((s, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rot);
    m.compose(new THREE.Vector3(s.x, heightAt(s.x, s.z) - 0.1, s.z), q, new THREE.Vector3(s.s, s.s * (0.9 + s.hue * 0.3), s.s));
    roundMesh.setMatrixAt(i, m);
    roundMesh.setColorAt(i, col.set(greens[Math.floor(s.hue * greens.length)]));
  });
  pines.forEach((s, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rot);
    m.compose(new THREE.Vector3(s.x, heightAt(s.x, s.z) - 0.1, s.z), q, new THREE.Vector3(s.s, s.s * 1.1, s.s));
    pineMesh.setMatrixAt(i, m);
    pineMesh.setColorAt(i, col.set(greens[4 - Math.floor(s.hue * 2)]));
  });
  for (const im of [trunk, roundMesh, pineMesh]) {
    im.castShadow = true;
    im.receiveShadow = true;
    scene.add(im);
  }
}

// Flowers and tall grass tufts scattered through the meadows.
export function buildFlowers(scene) {
  const r = rng(99);
  const count = 1400;
  const geo = new THREE.IcosahedronGeometry(0.12, 0);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), count);
  const palette = ['#f2c94c', '#e86f8a', '#b38ddb', '#f29e4c', '#e85a5a', '#fff3b8'];
  const m = new THREE.Matrix4();
  const col = new THREE.Color();
  let i = 0;
  while (i < count) {
    const a = r() * Math.PI * 2;
    const d = 6 + r() * 150;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (distToPath(x, z) < 2.5) continue;
    const y = heightAt(x, z);
    if (y < WATER_LEVEL + 0.4) continue;
    const s = 0.6 + r() * 0.7;
    m.makeScale(s, s, s).setPosition(x, y + 0.15, z);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.set(palette[Math.floor(r() * palette.length)]));
    i++;
  }
  scene.add(mesh);
}

// Drifting golden pollen / fireflies.
export function buildPollen(scene) {
  const count = 600;
  const pos = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const r = rng(5);
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 160;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    pos.set([x, heightAt(x, z) + 0.5 + r() * 6, z], i * 3);
    seeds[i] = r() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const base = pos.slice();
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const dctx = dot.getContext('2d');
  const grad = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 32, 32);
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: '#fff1b0',
      size: 0.3,
      map: new THREE.CanvasTexture(dot),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
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
