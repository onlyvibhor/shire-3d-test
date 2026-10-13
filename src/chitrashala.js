// The Gallery: a Chitrashala, the painted courtyard of a Rajput palace, recast as the island's art
// quarter, and kept open. A square of pale stone with no walls to get in the way: on three sides
// a row of framed exhibits stands free on sandstone easels, facing in, with a slim lime pillar
// between each pair, so from anywhere in the square (and from any camera angle) you see the work.
// The fourth side is the way in, marked by two pillars and a name stone. A charbagh garden fills
// the middle, kept low: crossing water channels, a lotus fountain and beds of flowers.
// Every frame runs a slideshow of real project screenshots and opens that project when clicked.
import * as THREE from 'three';
import { GALLERY } from './data.js';
import { LIME } from './jaipur.js';
import { solid, mesh, glow } from './materials.js';
import { rng } from './world.js';
import { makeBench, plaqueTexture, TOKENS } from './arena.js';
import { makePerson, animate } from './characters.js';

const S = 12; // half the square's side
const BAYS = 5;
const EDGE = 0.9; // how far in from the square's edge the row of exhibits stands
const PILLAR_H = 3.6;

// what hangs where: each side's playlists, one per bay (by project slug)
const WALLS = {
  back: { pool: 'land', title: 'Films & campaigns', bays: [['t20'], ['btb', 'ace'], ['trial'], ['ring', 'magic-checkout'], ['money', 'passport', 'intl', 'conv', 'whatsapp']] },
  left: { pool: 'port', title: 'The art series', bays: [['birds'], ['eyes'], ['absolut'], ['habitats'], ['grofers']] },
  right: { pool: 'land', title: 'Grofers years & the toolkit', bays: [['love-story', 'winter-foods'], ['diwali-2020', 'afsaane'], ['unskippable', 'grofery', 'grofers'], ['toolkit', 'social-gen'], ['ai-works', 'mentor']] },
};

export function buildChitrashala(scene, { gallery, colliders, npcs }) {
  const g = new THREE.Group();
  g.name = 'gallery-court';
  g.position.set(GALLERY.x, GALLERY.y + 0.03, GALLERY.z);
  g.rotation.y = GALLERY.facing;
  scene.add(g);
  g.updateMatrix();
  const col = (r, x, z) => {
    const v = new THREE.Vector3(x, 0, z).applyMatrix4(g.matrix);
    colliders.push({ x: v.x, z: v.z, r });
  };
  const color = GALLERY.color;
  const pink = solid(TOKENS.stone.pink, { roughness: 0.82 });
  const lime = solid(LIME, { roughness: 0.75 });
  const brass = solid(TOKENS.brass, { metalness: 0.5, roughness: 0.35 });

  // the square: pale stone with a sandstone border
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * S, 2 * S), solid('#efe8dc', { roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  g.add(floor);
  for (const [x, z, w, d] of [[0, -S, 2 * S + 0.6, 0.6], [0, S, 2 * S + 0.6, 0.6], [-S, 0, 0.6, 2 * S], [S, 0, 0.6, 2 * S]]) g.add(mesh(new THREE.BoxGeometry(w, 0.14, d), pink, x, 0.07, z, false));

  // a slim lime pillar: base, shaft, lotus capital, and an urn of flowers on top (see growFlora)
  const pillar = (parent, x, z, h = PILLAR_H) => {
    parent.add(mesh(new THREE.BoxGeometry(0.62, 0.32, 0.62), pink, x, 0.16, z));
    parent.add(mesh(new THREE.CylinderGeometry(0.17, 0.21, h - 0.62, 14), lime, x, 0.32 + (h - 0.62) / 2, z));
    parent.add(mesh(new THREE.CylinderGeometry(0.34, 0.2, 0.18, 14), lime, x, h - 0.21, z));
    parent.add(mesh(new THREE.BoxGeometry(0.56, 0.12, 0.56), pink, x, h - 0.06, z));
    parent.add(mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.26, 12), solid('#c4683c', { roughness: 0.85 }), x, h + 0.13, z));
  };

  // three rows of exhibits; in each side's frame x runs along the side and +z faces into the square
  const sides = [
    { key: 'back', x: 0, z: -S, rot: 0 },
    { key: 'left', x: -S, z: 0, rot: Math.PI / 2 },
    { key: 'right', x: S, z: 0, rot: -Math.PI / 2 },
  ];
  const inner = 2 * S - 2 * EDGE - 1.4;
  const bayW = inner / BAYS;
  const v = new THREE.Vector3();
  const pillars = []; // in side frames, for the climbers
  for (const sd of sides) {
    const W = WALLS[sd.key];
    const row = new THREE.Group();
    row.position.set(sd.x, 0, sd.z);
    row.rotation.y = sd.rot;
    g.add(row);
    row.updateMatrix();
    const toCourt = (x, z) => v.set(x, 0, z).applyMatrix4(row.matrix);
    for (let b = 0; b <= BAYS; b++) {
      const px = -inner / 2 + bayW * b;
      pillar(row, px, EDGE);
      pillars.push({ side: sd, x: px, z: EDGE });
      toCourt(px, EDGE);
      col(0.4, v.x, v.z);
    }
    // the side's title on a slim lintel over its middle bay
    const lx = 0;
    row.add(mesh(new THREE.BoxGeometry(bayW + 0.3, 0.16, 0.24), lime, lx, PILLAR_H + 0.02, EDGE));
    const title = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.74), new THREE.MeshStandardMaterial({ map: plaqueTexture(W.title, 'The Gallery', color), roughness: 0.7 }));
    title.position.set(lx, PILLAR_H + 0.5, EDGE + 0.02);
    title.userData.decor = true;
    row.add(title, mesh(new THREE.BoxGeometry(3.5, 0.82, 0.06), pink, lx, PILLAR_H + 0.5, EDGE - 0.03));
    // one exhibit per bay, standing free on a sandstone easel between the pillars
    W.bays.forEach((slugs, b) => {
      const bx = -inner / 2 + bayW * (b + 0.5);
      const port = W.pool === 'port';
      const fw = port ? 1.5 : 2.8;
      const fh = port ? fw * 1.5 : fw * (9 / 16);
      const cy = port ? 1.95 : 2.0;
      const bw = fw + 0.5;
      const bh = fh + (port ? 0.5 : 1.1);
      // the easel: a sandstone board on a low plinth, its back finished for anyone outside
      row.add(mesh(new THREE.BoxGeometry(bw + 0.1, 0.36, 0.7), pink, bx, 0.18, EDGE));
      row.add(mesh(new THREE.BoxGeometry(bw, bh, 0.16), solid(TOKENS.stone.blush, { roughness: 0.8 }), bx, cy - (port ? 0 : 0.27), EDGE));
      row.add(mesh(new THREE.BoxGeometry(bw + 0.08, 0.08, 0.22), lime, bx, cy - (port ? 0 : 0.27) + bh / 2 + 0.04, EDGE));
      // the frame and the picture
      row.add(mesh(new THREE.BoxGeometry(fw + 0.2, fh + 0.2, 0.08), solid('#2b2420', { roughness: 0.5 }), bx, cy, EDGE + 0.1));
      row.add(mesh(new THREE.BoxGeometry(fw + 0.3, 0.05, 0.1), brass, bx, cy + fh / 2 + 0.14, EDGE + 0.11));
      const img = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshBasicMaterial({ toneMapped: false }));
      img.position.set(bx, cy, EDGE + 0.145);
      img.userData.dynamic = true;
      row.add(img);
      let plate = null;
      if (!port) {
        plate = new THREE.Mesh(new THREE.PlaneGeometry(fw, fw / 5), new THREE.MeshBasicMaterial({ toneMapped: false }));
        plate.position.set(bx, cy - fh / 2 - fw / 10 - 0.08, EDGE + 0.1);
        plate.userData.dynamic = true;
        row.add(plate);
      }
      toCourt(bx, EDGE + 0.145).applyMatrix4(g.matrix);
      gallery.exhibit(img, plate, { pool: W.pool, slugs, x: v.x, z: v.z });
      row.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), glow('#ffd58a', 1.6), bx, cy + fh / 2 + 0.3, EDGE + 0.14, false));
      for (const dx of [-bw / 3, 0, bw / 3]) {
        toCourt(bx + dx, EDGE);
        col(0.5, v.x, v.z);
      }
    });
  }

  // the way in: two taller pillars and a name stone, nothing overhead
  const front = new THREE.Group();
  front.position.set(0, 0, S);
  g.add(front);
  for (const sx of [-1, 1]) {
    pillar(front, sx * 3.2, -EDGE, PILLAR_H + 0.8);
    pillars.push({ side: { x: 0, z: S, rot: Math.PI }, x: -sx * 3.2, z: EDGE });
    col(0.4, sx * 3.2, S - EDGE);
  }
  const nameStone = new THREE.Group();
  nameStone.position.set(-5.6, 0, S + 0.9);
  nameStone.add(mesh(new THREE.BoxGeometry(3.6, 0.4, 0.8), pink, 0, 0.2, 0));
  nameStone.add(mesh(new THREE.BoxGeometry(3.4, 1.1, 0.24), solid(TOKENS.stone.blush, { roughness: 0.8 }), 0, 0.95, 0));
  const name = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.69), new THREE.MeshStandardMaterial({ map: plaqueTexture(GALLERY.name, GALLERY.place, color), roughness: 0.7 }));
  name.position.set(0, 0.95, 0.13);
  name.userData.decor = true;
  nameStone.add(name);
  g.add(nameStone);
  col(0.9, -6.4, S + 0.9);
  col(0.9, -4.8, S + 0.9);

  // ----- the flowers: on the pillars, at their feet, in the beds -----
  const flora = growFlora(g, { sides, pillars, inner });
  for (const [x, z, r] of flora.colliders) col(r, x, z);

  // the charbagh: four low flower beds, crossing water channels, a lotus fountain
  const water = solid('#5fb3c9', { roughness: 0.1, metalness: 0.1, emissive: '#1d6b80', emissiveIntensity: 0.15 });
  for (const [w, d] of [[11.4, 0.7], [0.7, 11.4]]) {
    g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.12, d + 0.3), lime, 0, 0.06, 0, false));
    g.add(mesh(new THREE.BoxGeometry(w, 0.04, d), water, 0, 0.13, 0, false));
  }
  // low lawns in a clipped hedge, so the walls stay in view from anywhere in the court; a small
  // flowering tree in the two far quadrants
  const lawn = solid('#6db347', { roughness: 0.95 });
  const hedge = solid('#4f9a37', { roughness: 0.85 });
  [[-3.4, -3.4, false], [3.4, -3.4, false], [-3.4, 3.4, false], [3.4, 3.4, false]].forEach(([x, z, tree]) => {
    g.add(mesh(new THREE.BoxGeometry(4.1, 0.08, 4.1), lawn, x, 0.04, z, false));
    for (const [w, d, ox, oz] of [[4.3, 0.32, 0, 2.05], [4.3, 0.32, 0, -2.05], [0.32, 4.3, 2.05, 0], [0.32, 4.3, -2.05, 0]]) g.add(mesh(new THREE.BoxGeometry(w, 0.42, d), hedge, x + ox, 0.21, z + oz));
    if (tree) {
      const tx = x + Math.sign(x) * 1.1;
      const tz = z + Math.sign(z) * 1.1;
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.6, 6), solid('#6e5038'), tx, 0.8, tz));
      // a small amaltas or kachnar: a few blossom clouds rather than one ball
      const bloomMat = solid(z > 0 ? '#f7c948' : '#f2a7c3', { roughness: 0.75, flatShading: true });
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const puff = mesh(new THREE.IcosahedronGeometry(0.34 + (k % 3) * 0.06, 1), bloomMat, tx + Math.cos(a) * 0.45, 2.0 + (k % 2) * 0.35, tz + Math.sin(a) * 0.45);
        puff.scale.y = 0.8;
        g.add(puff);
      }
      g.add(mesh(new THREE.IcosahedronGeometry(0.42, 1), bloomMat, tx, 2.45, tz));
    }
    col(2.1, x, z);
  });
  // the fountain: an octagonal basin, a lotus bowl, a thin jet
  g.add(mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.42, 8), pink, 0, 0.21, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.05, 8), water, 0, 0.42, 0, false));
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.9, 10), lime, 0, 0.8, 0));
  const lotus = new THREE.Group();
  lotus.position.y = 1.25;
  for (let k = 0; k < 10; k++) {
    const p = mesh(new THREE.SphereGeometry(0.3, 10, 6), solid('#f6b5c8', { roughness: 0.55 }), Math.sin((k / 10) * Math.PI * 2) * 0.32, 0.1, Math.cos((k / 10) * Math.PI * 2) * 0.32, false);
    p.scale.set(0.45, 0.35, 1.2);
    p.rotation.set(-0.6, (k / 10) * Math.PI * 2, 0, 'YXZ');
    lotus.add(p);
  }
  lotus.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), solid('#ffd54a'), 0, 0.2, 0, false));
  g.add(lotus);
  const jet = mesh(new THREE.CylinderGeometry(0.03, 0.06, 1.1, 6), new THREE.MeshStandardMaterial({ color: '#e8f8ff', transparent: true, opacity: 0.6, roughness: 0.1 }), 0, 1.95, 0, false);
  jet.userData.dynamic = true;
  g.add(jet);
  col(1.7, 0, 0);

  // benches facing the walls, lanterns at the garden's corners
  for (const [x, z, tx, tz] of [[0, -6.6, 0, -S], [-6.6, 0, -S, 0], [6.6, 0, S, 0], [-4.5, 7.2, -4.5, 0]]) {
    const b = makeBench();
    b.position.set(x, 0, z);
    b.rotation.y = Math.atan2(tx - x, tz - z);
    g.add(b);
    col(0.9, x, z);
  }
  // visitors: a pair reading the films wall, one in front of the art, a guide at the gate
  const updaters = [];
  const person = (action, x, z, tx, tz, extra = {}) => {
    const p = makePerson({ accent: color, seed: Math.abs(Math.sin(x * 7.1 + z * 13.3)), ...extra });
    p.root.position.set(x, 0, z);
    p.root.rotation.y = Math.atan2(tx - x, tz - z);
    g.add(p.root);
    updaters.push((t) => animate(p, action, t));
    return p;
  };
  const a = person('think', -2.2, -S + EDGE + 2.0, -2.6, -S);
  const b = person('point', -0.9, -S + EDGE + 1.8, -0.2, -S, { longHair: true });
  const c = person('idle', -S + EDGE + 1.9, -2.4, -S, -2.4);
  const guide = person('talk', 4.6, S - 1.6, 0, S + 4, { top: color });
  npcs.push({ p: a, dept: 'gallery' }, { p: b, dept: 'gallery' }, { p: c, dept: 'gallery' }, { p: guide, dept: 'gallery', lines: GALLERY.quotes, name: 'Gallery guide' });

  return {
    group: g,
    update(t) {
      for (const u of updaters) u(t);
      jet.scale.y = 0.85 + Math.sin(t * 6) * 0.15;
      lotus.rotation.y = t * 0.15;
    },
  };
}

// ---------- Flowers ----------
// Everything that grows here is instanced: one mesh of leaves and one of blossoms for the whole
// courtyard, coloured per instance, so a garden of thousands of flowers costs a few draw calls.
const LITE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('lite');
const LEAF = ['#3f7f2e', '#4f9a37', '#5aa845', '#2f6b28', '#6bb24a'];
const BOUGAIN = ['#d6247a', '#e84a9a', '#f58fb8', '#c2186b', '#ff6fae'];
const JASMINE = ['#fff8ec', '#fffdf6', '#f6eedd'];
const MARIGOLD = ['#f59a1b', '#ffb02e', '#ffc531', '#f07c12'];
const ROSE = ['#e5484d', '#ff8a8a', '#ffd1dc', '#c81e3a'];
const LILAC = ['#9b5fc0', '#b48ad8'];

function growFlora(g, { pillars }) {
  const r = rng(731);
  const leaves = [];
  const blooms = [];
  const petals = [];
  const colliders = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const density = LITE ? 0.5 : 1;
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const add = (list, frame, x, y, z, size, color, flat = false) => {
    e.set(r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2);
    if (flat) e.set(-Math.PI / 2, 0, r() * Math.PI * 2);
    q.setFromEuler(e);
    p.set(x, y, z);
    if (frame) p.applyMatrix4(frame);
    sc.setScalar(size);
    m.compose(p, q, sc);
    list.push([m.clone(), color]);
  };
  // a bougainvillea head: a few bracts bunched together
  const cluster = (frame, x, y, z, size, color, n = 4) => {
    for (let k = 0; k < n; k++) add(blooms, frame, x + (r() - 0.5) * 0.11, y + (r() - 0.5) * 0.09, z + (r() - 0.5) * 0.08, size * (0.7 + r() * 0.5), color);
  };
  const frameOf = (sd) => new THREE.Matrix4().compose(new THREE.Vector3(sd.x, 0, sd.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd.rot, 0)), new THREE.Vector3(1, 1, 1));
  // a climber spiralling up each pillar, thin enough to keep its shape, and an urn of flowers on top
  for (const pl of pillars) {
    const F = frameOf(pl.side);
    const tall = pl.side.rot === Math.PI ? PILLAR_H + 0.8 : PILLAR_H;
    const flowers = pl.side.key === 'left' ? JASMINE : BOUGAIN;
    for (let k = 0; k < 70 * density; k++) {
      const y = 0.35 + r() * (tall - 0.7);
      const a = y * 2.4 + (r() - 0.5) * 1.2;
      const rr = 0.24 + r() * 0.06;
      add(leaves, F, pl.x + Math.cos(a) * rr, y, pl.z + Math.sin(a) * rr, 0.6 + r() * 0.4, pick(LEAF));
      if (r() < 0.25) cluster(F, pl.x + Math.cos(a) * (rr + 0.05), y, pl.z + Math.sin(a) * (rr + 0.05), 0.75, pick(flowers), 3);
    }
    for (let k = 0; k < 40 * density; k++) {
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * 0.3;
      const y = tall + 0.28 + (1 - rr / 0.3) * 0.22 + r() * 0.1;
      add(leaves, F, pl.x + Math.cos(a) * rr, y, pl.z + Math.sin(a) * rr, 0.7 + r() * 0.4, pick(LEAF));
      if (r() < 0.55) cluster(F, pl.x + Math.cos(a) * rr, y + 0.05, pl.z + Math.sin(a) * rr, 0.8, pick(r() < 0.5 ? MARIGOLD : flowers), 2);
    }
    // a few trailing strands down from the urn
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + r();
      for (let d = 0; d < 0.5 + r() * 0.6; d += 0.09) {
        add(leaves, F, pl.x + Math.cos(a) * 0.3, tall + 0.2 - d, pl.z + Math.sin(a) * 0.3, 0.55, pick(LEAF));
        if (r() < 0.3) add(blooms, F, pl.x + Math.cos(a) * 0.33, tall + 0.18 - d, pl.z + Math.sin(a) * 0.33, 0.8, pick(flowers));
      }
    }
  }
  // two big urns of marigolds just inside the way in
  for (const sx of [-1, 1]) pot(sx * 4.6, S - 1.6, MARIGOLD, 1.35);
  function pot(x, z, flowers, s = 1) {
    const tp = new THREE.Group();
    tp.position.set(x, 0, z);
    const clay = solid('#c4683c', { roughness: 0.85 });
    tp.add(mesh(new THREE.CylinderGeometry(0.38 * s, 0.26 * s, 0.6 * s, 14), clay, 0, 0.3 * s, 0));
    tp.add(mesh(new THREE.TorusGeometry(0.38 * s, 0.05 * s, 6, 16), clay, 0, 0.6 * s, 0).rotateX(Math.PI / 2));
    g.add(tp);
    colliders.push([x, z, 0.45 * s]);
    for (let k = 0; k < 60 * density * s; k++) {
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * 0.45 * s;
      const y = 0.62 * s + (1 - rr / (0.45 * s)) * 0.4 * s + r() * 0.15;
      add(leaves, null, x + Math.cos(a) * rr, y, z + Math.sin(a) * rr, 0.8 + r() * 0.5, pick(LEAF));
      if (r() < 0.6) add(blooms, null, x + Math.cos(a) * rr, y + 0.06, z + Math.sin(a) * rr, 0.9 + r() * 0.6, pick(flowers));
    }
  }

  // the charbagh's beds: carpets of flowers inside the clipped hedges, in bands of colour
  for (const [qx, qz] of [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]]) {
    const palettes = [MARIGOLD, ROSE, LILAC, JASMINE, BOUGAIN];
    for (let k = 0; k < 340 * density; k++) {
      const x = qx + (r() - 0.5) * 3.7;
      const z = qz + (r() - 0.5) * 3.7;
      const ring = Math.floor(Math.max(Math.abs(x - qx), Math.abs(z - qz)) / 0.4);
      add(leaves, null, x, 0.12 + r() * 0.12, z, 0.7 + r() * 0.4, pick(LEAF));
      if (r() < 0.75) add(blooms, null, x, 0.22 + r() * 0.12, z, 0.9 + r() * 0.6, pick(palettes[(ring + (qx > 0 ? 1 : 0) + (qz > 0 ? 2 : 0)) % palettes.length]));
    }
    // flowers along the hedge tops
    for (let k = 0; k < 60 * density; k++) {
      const side = Math.floor(r() * 4);
      const u = (r() - 0.5) * 4.2;
      const [x, z] = side === 0 ? [qx + u, qz + 2.05] : side === 1 ? [qx + u, qz - 2.05] : side === 2 ? [qx + 2.05, qz + u] : [qx - 2.05, qz + u];
      add(blooms, null, x, 0.44, z, 0.8 + r() * 0.5, pick(qz > 0 ? MARIGOLD : BOUGAIN));
    }
  }
  // lotus pads and a few lotuses on the channels
  for (let k = 0; k < 26; k++) {
    const along = (r() - 0.5) * 10.6;
    const [x, z] = k % 2 ? [along, (r() - 0.5) * 0.4] : [(r() - 0.5) * 0.4, along];
    if (Math.hypot(x, z) < 1.8) continue;
    add(petals, null, x, 0.16, z, 3 + r() * 1.6, '#4f9a37', true);
    if (r() < 0.35) add(blooms, null, x, 0.2, z, 1.6, '#f6b5c8');
  }
  const leafGeo = new THREE.OctahedronGeometry(0.1, 0);
  leafGeo.scale(1, 0.3, 1.7);
  const bloomGeo = new THREE.IcosahedronGeometry(0.055, 0);
  const petalGeo = new THREE.CircleGeometry(0.05, 6);
  const inst = (list, geo, mat, name) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    const c = new THREE.Color();
    list.forEach(([mm, col], i) => {
      im.setMatrixAt(i, mm);
      im.setColorAt(i, c.set(col));
    });
    im.instanceMatrix.needsUpdate = true;
    im.instanceColor.needsUpdate = true;
    im.castShadow = name === 'leaves';
    im.receiveShadow = true;
    im.name = name;
    im.userData.dynamic = true;
    im.frustumCulled = false;
    g.add(im);
  };
  inst(leaves, leafGeo, new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), 'leaves');
  inst(blooms, bloomGeo, new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true, emissive: '#2a0a14', emissiveIntensity: 0.15 }), 'blooms');
  inst(petals, petalGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }), 'petals');
  return { colliders, count: leaves.length + blooms.length + petals.length };
}
