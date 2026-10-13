// The Gallery: a Chitrashala, the painted courtyard of a Rajput palace, recast as the island's art
// quarter. A square chowk behind a pylon gateway; pink sandstone walls with a lime-white cusped
// arcade on three sides; a framed exhibit in every bay, curated by wall (films and campaigns at
// the back, the art series on one side, the Grofers years and the studio's tools on the other);
// and a charbagh garden in the middle, with crossing water channels and a lotus fountain.
// Every frame runs a slideshow of real project screenshots and opens that project when clicked.
import * as THREE from 'three';
import { GALLERY } from './data.js';
import { archSlab, LIME } from './jaipur.js';
import { solid, mesh, glow } from './materials.js';
import { makeGateway, makeLowWall, makeBed, makeBench, makeLantern, plaqueTexture, TOKENS } from './arena.js';
import { makePerson, animate } from './characters.js';

const S = 10.5; // half the courtyard's side
const WALL_H = 4.4;
const ARCADE = 1.9; // depth of the colonnade in front of each wall
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
    wall.add(mesh(new THREE.BoxGeometry(inner + 0.2, 0.16, ARCADE + 0.4), lime, 0, 4.13, ARCADE / 2));
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

  // the charbagh: four planted quadrants, crossing water channels, a lotus fountain
  const water = solid('#5fb3c9', { roughness: 0.1, metalness: 0.1, emissive: '#1d6b80', emissiveIntensity: 0.15 });
  for (const [w, d] of [[11.4, 0.7], [0.7, 11.4]]) {
    g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.12, d + 0.3), lime, 0, 0.06, 0, false));
    g.add(mesh(new THREE.BoxGeometry(w, 0.04, d), water, 0, 0.13, 0, false));
  }
  [[-3.4, -3.4, 'green', true], [3.4, -3.4, 'pink', false], [-3.4, 3.4, 'white', false], [3.4, 3.4, 'green', true]].forEach(([x, z, pal, tree], k) => {
    const bed = makeBed(4.1, 4.1, pal, 70 + k, { tree });
    bed.position.set(x, 0, z);
    g.add(bed);
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
  const a = person('think', -2.2, -7.6, -2.6, -S);
  const b = person('point', -0.9, -7.8, -0.2, -S, { longHair: true });
  const c = person('idle', -7.4, -2.4, -S, -2.4);
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
