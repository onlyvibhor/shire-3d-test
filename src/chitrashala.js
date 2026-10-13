// The Gallery: a Chitrashala, the painted courtyard of a Rajput palace, recast as the island's art
// quarter. A square chowk behind a pylon gateway; pink sandstone walls with a lime-white cusped
// arcade on three sides; a framed exhibit in every bay, curated by wall (films and campaigns at
// the back, the art series on one side, the Grofers years and the studio's tools on the other);
// and a charbagh garden in the middle, with crossing water channels and a lotus fountain.
// Every frame runs a slideshow of real project screenshots and opens that project when clicked.
// It's a garden as much as a gallery: bougainvillea and jasmine climb every wall and pier and spill
// over the top, a flowering pergola shades the walk under the arcade (wide enough to stroll), pots
// of flowers stand between the arches and the charbagh's beds are carpets of marigolds and roses.
import * as THREE from 'three';
import { GALLERY } from './data.js';
import { archSlab, LIME } from './jaipur.js';
import { solid, mesh, glow } from './materials.js';
import { rng } from './world.js';
import { makeGateway, makeLowWall, makeBench, makeLantern, plaqueTexture, TOKENS } from './arena.js';
import { makePerson, animate } from './characters.js';

const S = 12; // half the courtyard's side
const WALL_H = 4.4;
const ARCADE = 3.1; // depth of the colonnade in front of each wall: a walk you can stroll down
const BAYS = 5;

// what hangs where: each wall's playlists, one per bay (by project slug)
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
  const col = (r, x, z) => {
    const v = new THREE.Vector3(x, 0, z).applyMatrix4(g.matrix);
    colliders.push({ x: v.x, z: v.z, r });
  };
  g.updateMatrix();
  const color = GALLERY.color;
  const pink = solid(TOKENS.stone.pink, { roughness: 0.82 });
  const lime = solid(LIME, { roughness: 0.75 });

  // the floor: pale stone inside the walls
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * S - 0.6, 2 * S - 0.6), solid('#efe8dc', { roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  g.add(floor);

  // walls: back, two sides, and the front either side of the gate
  const wallRun = (x, z, len, rot) => {
    const w = makeLowWall(len, WALL_H, 'pink');
    w.position.set(x, 0, z);
    w.rotation.y = rot;
    g.add(w);
    for (let k = -len / 2 + 0.4; k <= len / 2 - 0.3; k += 0.8) col(0.45, x + Math.cos(rot) * k, z - Math.sin(rot) * k);
  };
  wallRun(0, -S, 2 * S, 0);
  wallRun(-S, 0, 2 * S, Math.PI / 2);
  wallRun(S, 0, 2 * S, Math.PI / 2);
  const gateHalf = 3.4;
  const seg = S - gateHalf;
  wallRun(-(gateHalf + seg / 2), S, seg, 0);
  wallRun(gateHalf + seg / 2, S, seg, 0);
  const gate = makeGateway({ name: GALLERY.name, sub: GALLERY.place, color, variant: 'pylon', w: 6.8, h: 8.3, a: 2.1, spring: 3.1, depth: 1.6, stone: 'blush' });
  gate.g.position.set(0, 0, S);
  g.add(gate.g);
  for (const [x, , r] of gate.colliders) col(r, x, S);

  // the arcade and its exhibits, one wall at a time: wall frame = local x along the wall, the
  // wall's inner face towards +z
  const sides = [
    { key: 'back', x: 0, z: -S, rot: 0 },
    { key: 'left', x: -S, z: 0, rot: Math.PI / 2 },
    { key: 'right', x: S, z: 0, rot: -Math.PI / 2 },
  ];
  const inner = 2 * S - 1.2;
  const bayW = inner / BAYS;
  const v = new THREE.Vector3();
  for (const sd of sides) {
    const W = WALLS[sd.key];
    const wall = new THREE.Group();
    wall.position.set(sd.x, 0, sd.z);
    wall.rotation.y = sd.rot;
    g.add(wall);
    // the colonnade: a cusped arch per bay, a lime band and a flat roof back to the wall
    for (let b = 0; b < BAYS; b++) {
      const bx = -inner / 2 + bayW * (b + 0.5);
      const arch = archSlab(bayW, 3.9, 1.32, 1.95, 0.36, lime);
      arch.position.set(bx, 0, ARCADE);
      wall.add(arch);
    }
    wall.add(mesh(new THREE.BoxGeometry(inner + 0.2, 0.22, 0.5), solid(color, { roughness: 0.6 }), 0, 4.0, ARCADE));
    // a pergola over the walk instead of a solid roof: lime beams from the wall to the arcade,
    // with the climbers running over them, so the walk is dappled rather than dark
    wall.add(mesh(new THREE.BoxGeometry(inner + 0.2, 0.18, 0.22), lime, 0, 4.18, 0.3));
    for (let x = -inner / 2; x <= inner / 2 + 0.01; x += 0.76) wall.add(mesh(new THREE.BoxGeometry(0.12, 0.14, ARCADE + 0.1), lime, x, 4.2, ARCADE / 2 + 0.2));
    for (const z of [ARCADE * 0.36, ARCADE * 0.7]) wall.add(mesh(new THREE.BoxGeometry(inner + 0.2, 0.06, 0.06), lime, 0, 4.3, z));
    // piers between the bays block the way, the arch openings don't
    for (let b = 0; b <= BAYS; b++) {
      v.set(-inner / 2 + bayW * b, 0, ARCADE).applyEuler(wall.rotation).add(wall.position);
      col(0.4, v.x, v.z);
    }
    // the wall's title over its middle bay, on the arcade
    const title = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.95), new THREE.MeshStandardMaterial({ map: plaqueTexture(W.title, 'The Gallery', color), roughness: 0.7 }));
    title.position.set(0, 4.62, ARCADE + 0.02);
    title.userData.decor = true;
    wall.add(title);
    // exhibits on the wall's inner face, one per bay
    W.bays.forEach((slugs, b) => {
      const bx = -inner / 2 + bayW * (b + 0.5);
      const port = W.pool === 'port';
      const fw = port ? 1.35 : 2.75;
      const fh = port ? fw * 1.5 : fw * (9 / 16);
      const cy = port ? 2.05 : 2.15;
      wall.add(mesh(new THREE.BoxGeometry(fw + 0.24, fh + 0.24, 0.1), solid('#2b2420', { roughness: 0.5 }), bx, cy, 0.3));
      wall.add(mesh(new THREE.BoxGeometry(fw + 0.36, 0.06, 0.12), solid(TOKENS.brass, { metalness: 0.5, roughness: 0.35 }), bx, cy + fh / 2 + 0.16, 0.31));
      const img = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshBasicMaterial({ toneMapped: false }));
      img.position.set(bx, cy, 0.36);
      img.userData.dynamic = true;
      wall.add(img);
      let plate = null;
      if (!port) {
        plate = new THREE.Mesh(new THREE.PlaneGeometry(fw, fw / 5), new THREE.MeshBasicMaterial({ toneMapped: false }));
        plate.position.set(bx, cy - fh / 2 - fw / 10 - 0.08, 0.36);
        plate.userData.dynamic = true;
        wall.add(plate);
      }
      wall.updateMatrix();
      v.set(bx, 0, 0.36).applyMatrix4(wall.matrix).applyMatrix4(g.matrix);
      gallery.exhibit(img, plate, { pool: W.pool, slugs, x: v.x, z: v.z });
      // a small brass lamp over every frame
      wall.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), glow('#ffd58a', 1.6), bx, cy + fh / 2 + 0.32, 0.42, false));
    });
  }

  // ----- the climbers: bougainvillea, jasmine and a few marigold baskets, all instanced -----
  const flora = growFlora(g, { sides, inner, bayW, gateHalf });
  for (const [x, z, r] of flora.colliders) col(r, x, z);

  // the charbagh: four planted quadrants, crossing water channels, a lotus fountain
  const water = solid('#5fb3c9', { roughness: 0.1, metalness: 0.1, emissive: '#1d6b80', emissiveIntensity: 0.15 });
  for (const [w, d] of [[11.4, 0.7], [0.7, 11.4]]) {
    g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.12, d + 0.3), lime, 0, 0.06, 0, false));
    g.add(mesh(new THREE.BoxGeometry(w, 0.04, d), water, 0, 0.13, 0, false));
  }
  // low lawns in a clipped hedge, so the walls stay in view from anywhere in the court; a small
  // flowering tree in the two far quadrants
  const lawn = solid('#6db347', { roughness: 0.95 });
  const hedge = solid('#4f9a37', { roughness: 0.85 });
  [[-3.4, -3.4, true], [3.4, -3.4, true], [-3.4, 3.4, true], [3.4, 3.4, true]].forEach(([x, z, tree]) => {
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
    col(1.4, x + Math.sign(x) * 1.2, z + Math.sign(z) * 1.2);
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
  for (const [x, z] of [[-6.2, -6.2], [6.2, -6.2], [-6.2, 6.2], [6.2, 6.2]]) {
    const l = makeLantern(2.9);
    l.position.set(x, 0, z);
    g.add(l);
    col(0.35, x, z);
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
  const a = person('think', -2.2, -S + 1.7, -2.6, -S);
  const b = person('point', -0.9, -S + 1.5, -0.2, -S, { longHair: true });
  const c = person('idle', -S + 1.6, -2.4, -S, -2.4);
  const guide = person('talk', 2.2, 7.2, 0, 14, { top: color });
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

function growFlora(g, { sides, inner, bayW, gateHalf }) {
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
  // frame: a matrix taking a wall's local frame (x along it, +z into the court) to the court's
  // a bougainvillea head: a few bracts bunched together, not a lone speck
  const cluster = (frame, x, y, z, size, color, n = 4) => {
    for (let k = 0; k < n; k++) add(blooms, frame, x + (r() - 0.5) * 0.11, y + (r() - 0.5) * 0.09, z + (r() - 0.5) * 0.08, size * (0.7 + r() * 0.5), color);
  };
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
  // a climber on a flat face: leaves thick at the bottom of a strip, blossom clusters through it
  const climb = (frame, x0, x1, y0, y1, z, { flowers = BOUGAIN, n = 70, bloom = 0.45, out = 1 } = {}) => {
    const count = Math.round(n * density * ((x1 - x0) * (y1 - y0)) / 3);
    for (let k = 0; k < count; k++) {
      // denser and wider towards the top, where the stems spread out
      const t = Math.sqrt(r());
      const y = y0 + (y1 - y0) * t;
      const spread = 0.35 + 0.65 * t;
      const cx = (x0 + x1) / 2;
      const x = cx + (r() - 0.5) * (x1 - x0) * spread;
      const zz = z + out * (0.03 + r() * 0.12);
      add(leaves, frame, x, y, zz, 0.75 + r() * 0.6, pick(LEAF));
      if (r() < bloom) cluster(frame, x, y, zz + out * 0.06, 0.8 + r() * 0.5, pick(flowers));
    }
  };
  // round a pier: a spiral of leaves and flowers up a column
  const wrap = (frame, x, z, rad, y1, flowers) => {
    const count = Math.round(200 * density);
    for (let k = 0; k < count; k++) {
      const y = r() * y1;
      const a = r() * Math.PI * 2;
      const rr = rad + 0.04 + r() * 0.1;
      add(leaves, frame, x + Math.cos(a) * rr, y, z + Math.sin(a) * rr, 0.75 + r() * 0.5, pick(LEAF));
      if (r() < 0.25 + (y / y1) * 0.25) cluster(frame, x + Math.cos(a) * (rr + 0.05), y, z + Math.sin(a) * (rr + 0.05), 0.8 + r() * 0.4, pick(flowers), 3);
    }
  };
  // strands trailing down from a ledge
  const trail = (frame, x0, x1, y, z, { minLen = 0.3, maxLen = 1.2, flowers = BOUGAIN, step = 0.22, out = 1 } = {}) => {
    for (let x = x0; x <= x1; x += step / density) {
      const len = minLen + r() * (maxLen - minLen);
      const sx = x + (r() - 0.5) * 0.12;
      for (let d = 0; d < len; d += 0.09) {
        const zz = z + out * (0.02 + Math.sin(d * 3) * 0.04);
        add(leaves, frame, sx + (r() - 0.5) * 0.08, y - d, zz, 0.6 + r() * 0.4, pick(LEAF));
        if (r() < 0.3) cluster(frame, sx, y - d - 0.03, zz + out * 0.05, 0.8 + r() * 0.4, pick(flowers), 3);
      }
    }
  };
  // a canopy along a beam: what grows over the pergola
  const canopy = (frame, x0, x1, z0, z1, y) => {
    const count = Math.round(((x1 - x0) * (z1 - z0)) * 14 * density);
    for (let k = 0; k < count; k++) {
      const x = x0 + r() * (x1 - x0);
      const z = z0 + r() * (z1 - z0);
      add(leaves, frame, x, y + r() * 0.22, z, 0.8 + r() * 0.6, pick(LEAF));
      if (r() < 0.35) cluster(frame, x, y + 0.12 + r() * 0.15, z, 0.9 + r() * 0.4, pick(r() < 0.75 ? BOUGAIN : JASMINE));
    }
  };

  const frame = new THREE.Matrix4();
  const wallFrame = (x, z, rot) => {
    frame.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), new THREE.Vector3(1, 1, 1));
    return frame.clone();
  };
  const face = 0.24; // the inner face of a wall, from its centre line
  for (const sd of sides) {
    const F = wallFrame(sd.x, sd.z, sd.rot);
    const flowers = sd.key === 'left' ? JASMINE : BOUGAIN;
    // up the wall between the frames, and over the top of it
    const half = (WALLS[sd.key].pool === 'port' ? bayW - 1.9 : bayW - 3.3) / 2;
    for (let b = 0; b <= 5; b++) {
      const bx = -inner / 2 + bayW * b;
      const w = b === 0 || b === 5 ? half * 0.8 : half;
      climb(F, bx - w, bx + w, 0, 4.4, face, { flowers: b % 2 ? flowers : BOUGAIN, n: 190, bloom: 0.3 });
    }
    // and a few climbers up the outside too
    for (let b = 0; b <= 5; b += 2) climb(F, -inner / 2 + bayW * b - 0.6, -inner / 2 + bayW * b + 0.6, 0, 4.4, -face, { n: 110, out: -1, bloom: 0.3 });
    trail(F, -inner / 2, inner / 2, 4.35, face, { minLen: 0.2, maxLen: 0.9, flowers });
    // and spilling over the outside, for anyone walking round the court
    trail(F, -inner / 2, inner / 2, 4.35, -face, { minLen: 0.4, maxLen: 1.8, flowers: BOUGAIN, out: -1, step: 0.3 });
    // round every pier of the arcade, and trailing from the arcade's band between the arches
    for (let b = 0; b <= 5; b++) {
      const bx = -inner / 2 + bayW * b;
      wrap(F, bx, ARCADE, 0.52, 3.9, b % 2 ? JASMINE : BOUGAIN);
      // pots of flowers on the garden side of each pier
      if (b > 0 && b < 5) pot(F, bx, ARCADE + 0.75, b % 2 ? MARIGOLD : ROSE);
    }
    trail(F, -inner / 2, inner / 2, 3.95, ARCADE + 0.28, { minLen: 0.15, maxLen: 0.55, flowers });
    // over the pergola
    canopy(F, -inner / 2, inner / 2, 0.2, ARCADE + 0.2, 4.28);
  }
  // the front wall, inside and out, either side of the gate
  for (const sx of [-1, 1]) {
    const F = wallFrame(0, S, Math.PI);
    const x0 = sx > 0 ? -S + 0.4 : gateHalf + 0.6;
    const x1 = sx > 0 ? -gateHalf - 0.6 : S - 0.4;
    for (let x = x0 + 0.8; x < x1; x += 2.6) climb(F, x - 0.7, x + 0.7, 0, 4.4, face, { n: 170, bloom: 0.3 });
    trail(F, x0, x1, 4.35, face, { maxLen: 1.0 });
    trail(F, x0, x1, 4.35, -face, { maxLen: 1.6, out: -1, step: 0.3 });
    // big urns of marigolds just inside the gate
    pot(new THREE.Matrix4(), sx * (gateHalf + 0.9), S - 1.0, MARIGOLD, 1.35);
  }
  function pot(F, x, z, flowers, s = 1) {
    const pp = new THREE.Vector3(x, 0, z).applyMatrix4(F);
    const tp = new THREE.Group();
    tp.position.copy(pp);
    const clay = solid('#c4683c', { roughness: 0.85 });
    tp.add(mesh(new THREE.CylinderGeometry(0.38 * s, 0.26 * s, 0.6 * s, 14), clay, 0, 0.3 * s, 0));
    tp.add(mesh(new THREE.TorusGeometry(0.38 * s, 0.05 * s, 6, 16), clay, 0, 0.6 * s, 0).rotateX(Math.PI / 2));
    g.add(tp);
    colliders.push([pp.x, pp.z, 0.45 * s]);
    for (let k = 0; k < 60 * density * s; k++) {
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * 0.45 * s;
      const y = 0.62 * s + (1 - rr / (0.45 * s)) * 0.4 * s + r() * 0.15;
      add(leaves, null, pp.x + Math.cos(a) * rr, y, pp.z + Math.sin(a) * rr, 0.8 + r() * 0.5, pick(LEAF));
      if (r() < 0.6) add(blooms, null, pp.x + Math.cos(a) * rr, y + 0.06, pp.z + Math.sin(a) * rr, 0.9 + r() * 0.6, pick(flowers));
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
  // fallen petals along the walks under the arcades
  for (const sd of sides) {
    const F = wallFrame(sd.x, sd.z, sd.rot);
    for (let k = 0; k < 160 * density; k++) add(petals, F, (r() - 0.5) * inner, 0.035, 0.6 + r() * (ARCADE - 0.2), 0.5 + r() * 0.5, pick(sd.key === 'left' ? JASMINE : BOUGAIN), true);
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
