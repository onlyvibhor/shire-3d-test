// The pond near the Night Lab: a level terrace, a fine-grained grassy bank sloping to a ring of
// river stones, sandstone ghat steps facing the Lab, still teal water with drifting ripples, lily
// pads with a few pink lotuses, reeds and cattails swaying on the far bank, and koi circling.
import * as THREE from 'three';
import { POND, GHAT, pondBank, groundColor, rng } from './world.js';
import { mesh, solid, canvasTexture } from './materials.js';
import { SAND } from './jaipur.js';

const TAU = Math.PI * 2;

function waterMaps() {
  const map = canvasTexture(512, 512, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#13525e');
    g.addColorStop(0.55, '#1f6f78');
    g.addColorStop(0.86, '#3f9a98');
    g.addColorStop(1, '#79c2ae');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  // a tiling ripple normal map, drawn from a sum of soft waves
  const N = 128;
  const data = new Uint8Array(N * N * 4);
  const hgt = (x, y) =>
    Math.sin((x / N) * TAU * 3 + Math.sin((y / N) * TAU * 2) * 0.8) * 0.5 +
    Math.sin((y / N) * TAU * 4 + (x / N) * TAU) * 0.35 +
    Math.sin(((x + y) / N) * TAU * 5) * 0.15;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = hgt(x + 1, y) - hgt(x - 1, y);
      const dy = hgt(x, y + 1) - hgt(x, y - 1);
      const v = new THREE.Vector3(-dx * 2.2, -dy * 2.2, 1).normalize();
      const i = (y * N + x) * 4;
      data[i] = (v.x * 0.5 + 0.5) * 255;
      data[i + 1] = (v.y * 0.5 + 0.5) * 255;
      data[i + 2] = (v.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const normal = new THREE.DataTexture(data, N, N);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(2.2, 2.2);
  normal.needsUpdate = true;
  return { map, normal };
}

// a fine radial mesh for the bank, coloured from the meadow down to damp earth and pebbles
function bankMesh() {
  const RINGS = 22;
  const SEG = 160;
  const inner = POND.r - 0.6;
  const pos = [];
  const col = [];
  const idx = [];
  const c = new THREE.Color();
  const earth = new THREE.Color('#6d5a3c');
  const pebble = new THREE.Color('#a39782');
  for (let i = 0; i <= RINGS; i++) {
    const r = inner + (POND.bank - inner) * Math.pow(i / RINGS, 0.8);
    for (let j = 0; j < SEG; j++) {
      const a = (j / SEG) * TAU;
      const x = POND.x + Math.cos(a) * r;
      const z = POND.z + Math.sin(a) * r;
      const y = pondBank(x, z);
      pos.push(x, y, z);
      groundColor(x, z, y, c);
      // damp earth near the water, with a pebbly band right at the waterline
      const wet = 1 - THREE.MathUtils.smoothstep(r, POND.r + 0.2, POND.r + 1.6);
      c.lerp(earth, wet * 0.85);
      const n = Math.sin(a * 37) * Math.sin(a * 23 + r * 3);
      if (r < POND.r + 0.7 && n > 0.1) c.lerp(pebble, 0.6);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < RINGS; i++)
    for (let j = 0; j < SEG; j++) {
      const a = i * SEG + j;
      const b = i * SEG + ((j + 1) % SEG);
      idx.push(a, a + SEG, b, b, a + SEG, b + SEG);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  m.receiveShadow = true;
  return m;
}

export function buildPond(scene, colliders) {
  const g = new THREE.Group();
  g.name = 'pond';
  scene.add(g);
  const rand = rng(91);
  const W = POND.water;
  const at = (a, r) => [POND.x + Math.cos(a) * r, POND.z + Math.sin(a) * r];

  g.add(bankMesh());

  // the water
  const { map, normal } = waterMaps();
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(POND.r + 0.3, 96),
    new THREE.MeshStandardMaterial({ map, normalMap: normal, normalScale: new THREE.Vector2(0.18, 0.18), roughness: 0.08, metalness: 0.1, envMapIntensity: 1.2 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(POND.x, W, POND.z);
  water.receiveShadow = true;
  g.add(water);

  // river stones along the waterline, leaving the ghat clear
  const stoneGeo = new THREE.IcosahedronGeometry(1, 1);
  const stones = new THREE.InstancedMesh(stoneGeo, new THREE.MeshStandardMaterial({ roughness: 0.85 }), 46);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const tones = ['#b9ad98', '#9d9282', '#c8bda6', '#8f8778', '#d2c4a8'].map((h) => new THREE.Color(h));
  let n = 0;
  for (let k = 0; k < 46; k++) {
    const a = (k / 46) * TAU + rand() * 0.08;
    if (Math.abs(Math.atan2(Math.sin(a - POND.ghat), Math.cos(a - POND.ghat))) < 0.42) continue;
    const r = POND.r + 0.15 + rand() * 0.7;
    const [x, z] = at(a, r);
    const s = 0.2 + rand() * 0.24;
    e.set(rand() * 0.6, rand() * TAU, rand() * 0.6);
    m4.compose(new THREE.Vector3(x, pondBank(x, z) + s * 0.05, z), q.setFromEuler(e), new THREE.Vector3(s * 1.3, s * 0.6, s));
    stones.setMatrixAt(n, m4);
    stones.setColorAt(n, tones[n % tones.length]);
    n++;
  }
  stones.count = n;
  stones.castShadow = stones.receiveShadow = true;
  g.add(stones);

  // sandstone ghat: four steps down to the water, with a low chhatri-topped post either side
  const stoneMat = solid(SAND, { roughness: 0.75 });
  const edgeMat = solid('#e8a866', { roughness: 0.7 });
  const ghat = new THREE.Group();
  ghat.position.set(POND.x, 0, POND.z);
  ghat.rotation.y = -POND.ghat + Math.PI / 2;
  g.add(ghat);
  // local +z points from the pond centre towards the Lab
  const span = GHAT.outer - GHAT.inner;
  for (let k = 0; k < 4; k++) {
    const z0 = GHAT.outer - (span / 4) * (k + 1);
    const top = POND.y + 0.12 - k * 0.2;
    const depth = span / 4;
    const b = mesh(new THREE.BoxGeometry(GHAT.half * 2, top - (W - 1.2), depth + 0.02), stoneMat, 0, (top + W - 1.2) / 2 + 0.02, z0 + depth / 2);
    ghat.add(b);
    ghat.add(mesh(new THREE.BoxGeometry(GHAT.half * 2, 0.05, 0.12), edgeMat, 0, top + 0.045, z0 + 0.06, false));
  }
  for (const sx of [-1, 1]) {
    const x = sx * (GHAT.half + 0.25);
    const z = GHAT.outer - 0.4;
    const y = POND.y;
    const wall = mesh(new THREE.BoxGeometry(0.5, 0.9, span + 0.4), stoneMat, x, y - 0.1, GHAT.inner + span / 2 + 0.1);
    ghat.add(wall);
    ghat.add(mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), stoneMat, x, y + 0.55, z));
    ghat.add(mesh(new THREE.BoxGeometry(0.62, 0.08, 0.62), edgeMat, x, y + 1.14, z));
    // four tiny pillars and a dome: a miniature chhatri
    for (const [px, pz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) ghat.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 6), stoneMat, x + px, y + 1.35, z + pz, false));
    ghat.add(mesh(new THREE.BoxGeometry(0.56, 0.06, 0.56), edgeMat, x, y + 1.55, z, false));
    ghat.add(mesh(new THREE.SphereGeometry(0.24, 14, 8, 0, TAU, 0, Math.PI / 2), stoneMat, x, y + 1.58, z, false));
    // a small diya on the post
    const diya = mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffb347', emissiveIntensity: 2 }), x, y + 1.24, z, false);
    ghat.add(diya);
  }
  // the walls are solid; the steps themselves can be walked down to the water
  g.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  for (const sx of [-1, 1])
    for (const z of [GHAT.inner + 0.4, GHAT.inner + span / 2, GHAT.outer - 0.4]) {
      v.set(sx * (GHAT.half + 0.25), 0, z).applyMatrix4(ghat.matrixWorld);
      colliders.push({ x: v.x, z: v.z, r: 0.35 });
    }

  // lily pads and lotuses
  const padMat = solid('#4e9a3a', { roughness: 0.55, side: THREE.DoubleSide });
  const padMat2 = solid('#6cb04a', { roughness: 0.55, side: THREE.DoubleSide });
  const petal = solid('#f59ab8', { roughness: 0.5, emissive: '#f06f9c', emissiveIntensity: 0.12 });
  const heart = solid('#ffd54a', { roughness: 0.5 });
  const pads = [];
  const clusters = [[POND.ghat + 2.2, 4.4], [POND.ghat + 3.6, 5.2], [POND.ghat - 1.6, 3.6]];
  for (const [ca, cr] of clusters) {
    const [cx, cz] = at(ca, cr);
    for (let k = 0; k < 6; k++) {
      const r = 0.35 + rand() * 0.4;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(r, 18, 0.4, TAU - 0.4), rand() < 0.5 ? padMat : padMat2);
      pad.rotation.set(-Math.PI / 2, 0, rand() * TAU);
      const a = rand() * TAU;
      const d = rand() * 1.8;
      pad.position.set(cx + Math.cos(a) * d, W + 0.02 + k * 0.002, cz + Math.sin(a) * d);
      g.add(pad);
      pads.push(pad);
      if (k < 2) {
        const lotus = new THREE.Group();
        for (let p = 0; p < 8; p++) {
          const pe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), petal);
          pe.scale.set(0.55, 0.3, 1.4);
          const pa = (p / 8) * TAU;
          pe.position.set(Math.sin(pa) * 0.09, 0.08, Math.cos(pa) * 0.09);
          pe.rotation.set(-0.7, pa, 0, 'YXZ');
          lotus.add(pe);
        }
        lotus.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), heart));
        lotus.children[lotus.children.length - 1].position.y = 0.1;
        lotus.position.copy(pad.position);
        lotus.position.y += 0.01;
        g.add(lotus);
      }
    }
  }

  // reeds and cattails on the far bank, away from the ghat
  const reedMat = solid('#5f8f3a', { roughness: 0.8, side: THREE.DoubleSide });
  const reedMat2 = solid('#7aa548', { roughness: 0.8, side: THREE.DoubleSide });
  const tailMat = solid('#6b4426', { roughness: 0.9 });
  const reeds = [];
  for (const off of [Math.PI - 0.5, Math.PI + 0.15, Math.PI + 0.85, Math.PI - 1.3]) {
    const a = POND.ghat + off;
    const [cx, cz] = at(a, POND.r + 0.25);
    const tuft = new THREE.Group();
    tuft.position.set(cx, W - 0.1, cz);
    for (let k = 0; k < 14; k++) {
      const h = 1.1 + rand() * 0.9;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 4), rand() < 0.5 ? reedMat : reedMat2);
      const ba = rand() * TAU;
      const bd = rand() * 0.7;
      blade.position.set(Math.cos(ba) * bd, h / 2, Math.sin(ba) * bd);
      blade.rotation.set((rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3);
      tuft.add(blade);
    }
    for (let k = 0; k < 3; k++) {
      const h = 1.5 + rand() * 0.5;
      const ba = rand() * TAU;
      const bd = rand() * 0.5;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, h, 4), reedMat);
      stem.position.set(Math.cos(ba) * bd, h / 2, Math.sin(ba) * bd);
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.22, 3, 6), tailMat);
      tail.position.set(Math.cos(ba) * bd, h + 0.02, Math.sin(ba) * bd);
      tuft.add(stem, tail);
    }
    g.add(tuft);
    reeds.push({ tuft, ph: rand() * TAU });
  }

  // koi: small orange, white and gold fish circling just under the surface
  const koiCols = [['#ff7a2f', '#ffffff'], ['#ffffff', '#ff5a2a'], ['#ffb43a', '#ffe9c4'], ['#ff6a3d', '#2a2a2a'], ['#fff3e0', '#ff8a3a']];
  const fish = [];
  for (let k = 0; k < 5; k++) {
    const [body, spot] = koiCols[k];
    const f = new THREE.Group();
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), solid(body, { roughness: 0.4 }));
    b.scale.set(0.8, 0.45, 2.4);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), solid(spot, { roughness: 0.4 }));
    s.scale.set(1, 0.5, 1.6);
    s.position.set(0, 0.03, 0.06);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 3), solid(body, { roughness: 0.4, side: THREE.DoubleSide }));
    tail.rotation.x = -Math.PI / 2;
    tail.scale.set(1, 1, 0.25);
    tail.position.z = -0.36;
    f.add(b, s, tail);
    g.add(f);
    fish.push({ f, tail, r: 1.6 + k * 1.05, sp: (0.18 + rand() * 0.12) * (k % 2 ? -1 : 1), ph: rand() * TAU, wob: rand() * TAU });
  }

  // the water blocks the way; the ghat steps lead right to its edge
  colliders.push({ x: POND.x, z: POND.z, r: POND.r + 0.2 });

  return {
    update(t) {
      normal.offset.set(t * 0.012, t * 0.008);
      for (const { f, tail, r, sp, ph, wob } of fish) {
        const a = ph + t * sp;
        const rr = r + Math.sin(t * 0.3 + wob) * 0.6;
        f.position.set(POND.x + Math.cos(a) * rr, W - 0.004 + Math.sin(t * 0.7 + wob) * 0.012, POND.z + Math.sin(a) * rr);
        // face along the circle
        f.rotation.y = Math.atan2(-Math.sin(a) * Math.sign(sp), Math.cos(a) * Math.sign(sp));
        tail.rotation.y = Math.sin(t * 6 + wob) * 0.35;
      }
      for (let i = 0; i < pads.length; i++) pads[i].position.y = W + 0.02 + i * 0.002 + Math.sin(t * 0.8 + i) * 0.006;
      for (const { tuft, ph } of reeds) {
        tuft.rotation.z = Math.sin(t * 0.9 + ph) * 0.04;
        tuft.rotation.x = Math.cos(t * 0.7 + ph) * 0.03;
      }
    },
  };
}
