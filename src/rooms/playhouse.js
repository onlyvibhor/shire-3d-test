// The Playhouse: the work made for fun, as one continuous building of six connected rooms.
//   Lobby — the popcorn counter and its host, the neon sign, the way into everything
//   Cinema — tiered seats in the dark and a big screen; pick the film at the selector by the door
//   Stop-motion workshop — Modern Junkyard: a miniature set, puppets, a camera on its tripod
//   Found-object art — Power: sockets, switches and wires, on plinths under spotlights
//   Arcade — modelled cabinets; Back in the Ring is playable
//   Creative lounge — sofas, beanbags and the wall of films and references
import * as THREE from 'three';
import { PROJECTS, FAVOURITES, FUN } from '../data.js';
import { screenMat } from '../props.js';
import { solid, glow, mesh, DARK } from '../materials.js';
import { FONT, wrap, fillFit } from '../type.js';
import { giveProp } from '../characters.js';
import { rng } from '../world.js';
import {
  makeShell, partition, zone, addThing, addCollider, addBox, addFootprint, addNpc, person, clickable, plate, lamp, sofa, armchair, coffeeTable,
  plant, floorLamp, rug, plinth, framed, bigScreen, tileTexture, floorPatch, shelf, table, stool, counter, faceTo,
} from './kit.js';

const C = FUN.color;
const PINK = '#ff4f8b';
const PLUM = '#2b1d3a';

// an arcade cabinet, its front to +z: side art, a marquee, a tilted screen, a control deck
function cabinet(room, x, z, ry, { body = '#1d2b4f', art = PINK, marquee = 'ARCADE', img, action }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  const bm = solid(body, { roughness: 0.5 });
  const am = solid(art, { roughness: 0.5 });
  // the body: a profile extruded across the cabinet's width
  const s = new THREE.Shape();
  s.moveTo(-0.45, 0);
  s.lineTo(0.45, 0);
  s.lineTo(0.45, 0.95);
  s.lineTo(0.62, 1.05);
  s.lineTo(0.5, 1.2);
  s.lineTo(0.22, 1.85);
  s.lineTo(0.3, 2.3);
  s.lineTo(-0.45, 2.3);
  s.lineTo(-0.45, 0);
  const side = new THREE.ExtrudeGeometry(s, { depth: 0.82, bevelEnabled: false });
  side.translate(0, 0, -0.41);
  const shell = new THREE.Mesh(side, [am, bm]);
  shell.rotation.y = -Math.PI / 2;
  shell.castShadow = true;
  g.add(shell);
  // marquee
  const mq = plate(0.8, 0.26, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, art);
    gr.addColorStop(1, '#ffd08a');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#160e22';
    c.font = `800 ${h * 0.56}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    fillFit(c, marquee, w / 2, h / 2 + 2, w - 16);
  });
  mq.position.set(0, 2.12, 0.31);
  mq.rotation.x = -0.2;
  g.add(mq);
  // the screen, tilted back
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.52), screenMat(img, 0.66 / 0.52));
  sc.position.set(0, 1.55, 0.37);
  sc.rotation.x = -0.4;
  g.add(sc);
  clickable(room, sc, action);
  // controls: a stick and buttons on the deck
  g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), DARK, -0.18, 1.18, 0.5, false));
  g.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), solid('#e5484d'), -0.18, 1.25, 0.5, false));
  for (let k = 0; k < 4; k++) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10), solid(['#ffd84a', '#2f6bff', '#00a79d', PINK][k]), 0.02 + (k % 2) * 0.1, 1.15, 0.45 + Math.floor(k / 2) * 0.08, false));
  room.group.add(g);
  addFootprint(room, x, z, 1.0, 1.0, ry);
  return g;
}

export function buildPlayhouse(origin) {
  const W = 36;
  const D = 40;
  const carpet = tileTexture('#2a1830', '#26152c', 12, 'rgba(255,159,28,0.08)');
  carpet.repeat.set(6, 7);
  const room = makeShell({
    id: 'fun',
    origin,
    w: W,
    d: D,
    h: 9,
    floor: new THREE.MeshStandardMaterial({ map: carpet, roughness: 1 }),
    wall: new THREE.MeshStandardMaterial({ color: PLUM, roughness: 0.9 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#160e22', roughness: 1 }),
    trim: glow(PINK, 1.4),
    doorColor: '#ffe2b0',
  });
  const g = room.group;
  const r = rng(903);
  const WALL = new THREE.MeshStandardMaterial({ color: '#36254a', roughness: 0.85 });
  const TRIM = solid('#ff9f1c', { roughness: 0.5, emissive: '#ff9f1c', emissiveIntensity: 0.25 });
  const PH = 6.2;

  // ----- the plan -----
  const sg = (t) => ({ signColor: '#ffd08a', signs: t });
  partition(room, { axis: 'z', at: -7, from: 8, to: 20, h: PH, mat: WALL, trim: TRIM, openings: [{ at: 14, w: 3.2, style: 'round', ...sg({ pos: 'Creative lounge' }) }] });
  partition(room, { axis: 'z', at: 7, from: 8, to: 20, h: PH, mat: WALL, trim: TRIM, openings: [{ at: 14, w: 3.2, style: 'round', ...sg({ neg: 'Arcade' }) }] });
  partition(room, { axis: 'x', at: 8, from: -18, to: 18, h: PH, mat: WALL, trim: TRIM, openings: [{ at: -3, w: 3.4, style: 'round' }, { at: -12.5, w: 3, style: 'round', ...sg({ pos: 'Cinema' }) }, { at: 12, w: 3, style: 'round', ...sg({ pos: 'Stop-motion workshop' }) }] });
  partition(room, { axis: 'z', at: 4, from: -20, to: 8, h: PH, mat: WALL, trim: TRIM, openings: [{ at: 1, w: 3, style: 'round', ...sg({ neg: 'Workshop', pos: 'Cinema' }) }, { at: -14, w: 3, style: 'round', ...sg({ neg: 'Found-object art' }) }] });
  partition(room, { axis: 'x', at: -6, from: 4, to: 18, h: PH, mat: WALL, trim: TRIM, openings: [{ at: 11, w: 3, style: 'round', ...sg({ pos: 'Power: found objects', neg: 'Workshop' }) }] });
  zone(room, 'lobby', 'Lobby', -7, 8, 7, 20, [0, 15.5], 'Popcorn and the way in');
  zone(room, 'lounge', 'Creative lounge', -18, 8, -7, 20, [-12.5, 13], 'Films and references');
  zone(room, 'arcade', 'Arcade', 7, 8, 18, 20, [12, 14], 'Back in the Ring: play it');
  zone(room, 'cinema', 'Cinema', -18, -20, 4, 8, [-1, 4.4], 'Take a seat; pick a film');
  zone(room, 'workshop', 'Stop-motion workshop', 4, -6, 18, 8, [9, 1.5], 'Modern Junkyard');
  zone(room, 'objects', 'Found-object art', 4, -20, 18, -6, [11, -9.5], 'Power');

  // ===== Lobby =====
  floorPatch(room, 0, 14, 13.6, 11.6, new THREE.MeshStandardMaterial({ map: (() => { const t = tileTexture('#3a1d3f', '#2a1630', 8, 'rgba(255,79,139,0.2)'); t.repeat.set(3, 3); return t; })(), roughness: 0.6 }));
  const neon = plate(6.4, 1.1, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.shadowColor = C;
    c.shadowBlur = 24;
    c.fillStyle = '#ffd08a';
    c.font = `800 ${h * 0.66}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('PLAYHOUSE', w / 2, h / 2 + 4);
  }, { transparent: true });
  neon.position.set(-3, 5.55, 8.18);
  g.add(neon);
  const nowSign = plate(3.4, 0.5, (c, w, h) => {
    c.fillStyle = '#160e22';
    c.fillRect(0, 0, w, h);
    c.fillStyle = PINK;
    c.font = `700 ${h * 0.5}px ${FONT.sans}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('CINEMA  ·  NOW SHOWING', w / 2, h / 2 + 1);
  });
  nowSign.position.set(-3, 4.65, 8.18);
  g.add(nowSign);
  // the popcorn counter, its host behind it
  const pc = counter(room, 3.6, 12.6, -Math.PI / 2, { w: 4, d: 1.1, body: '#d64545', top: '#f4f1ea' });
  pc.add(mesh(new THREE.BoxGeometry(1.2, 1.3, 0.9), new THREE.MeshPhysicalMaterial({ color: '#fff4d6', transparent: true, opacity: 0.35, roughness: 0.05 }), -1, 1.6, -0.1, false));
  for (let k = 0; k < 30; k++) pc.add(mesh(new THREE.IcosahedronGeometry(0.07, 0), solid('#fff4c2'), -1 + (r() - 0.5) * 1, 1.05 + r() * 0.75, -0.1 + (r() - 0.5) * 0.7, false));
  for (let k = 0; k < 4; k++) pc.add(mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.32, 12), solid(k % 2 ? '#ffffff' : '#d64545'), 0.5 + k * 0.32, 1.08, 0.2));
  const pop = plate(1.8, 0.5, (c, w, h) => {
    c.fillStyle = '#ffd84a';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#7a1414';
    c.font = `800 ${h * 0.6}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('POPCORN', w / 2, h / 2 + 2);
  });
  pop.position.set(3.6 - 0.56, 2.7, 12.6);
  pop.rotation.y = -Math.PI / 2;
  g.add(pop);
  addNpc(room, person({ seed: r(), top: '#d64545', accent: C }), 5.0, 12.6, -Math.PI / 2, 'talk', 'fun', { lines: FUN.quotes, name: 'Playhouse host' });
  addThing(room, 2.2, 12.6, { kind: 'toast', label: 'Popcorn', verb: 'Grab some', text: '<b>🍿 Popcorn!</b> Best enjoyed in the cinema, through the arch with the neon sign.' });
  for (const x of [-5.8, 5.8]) plant(room, x, 19, { s: 1.1, pot: '#36254a', leaf: '#5aa04a' });
  lamp(room, 0, 5.2, 14, '#ffd9a8', 7, 11);

  // ===== Cinema =====
  // dark walls, a big screen at the back, four tiers of seats
  floorPatch(room, -7, -6, 22, 28, solid('#1a0f22', { roughness: 1 }), 0.01);
  const films = ['trial', 'ring', 'btb', 'ace', 't20', 'magic-checkout'];
  const mats = films.map((s) => screenMat(PROJECTS[s].images[0], 16 / 9));
  const scr = bigScreen(room, -7, 4.4, -D / 2 + 0.1, 0, 14.4, 8.1, mats[0], { bezel: '#07060a' });
  let current = 0;
  let picked = -1;
  clickable(room, scr.screen, { kind: 'project', slug: films[0] });
  const showFilm = (k, chosen = false) => {
    current = k;
    if (chosen) picked = k;
    scr.screen.material = mats[k];
    scr.screen.userData.action = { kind: 'project', slug: films[k] };
    tiles.forEach((t, i) => (t.ring.visible = i === k));
  };
  room.updaters.push({
    update: (t) => {
      // until someone picks a film, the screen runs the programme
      if (picked < 0) {
        const k = Math.floor(t / 8) % films.length;
        if (k !== current) showFilm(k);
      }
    },
  });
  // curtains either side of the screen
  const curtain = solid('#7a1426', { roughness: 1 });
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 6; k++) g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 8.8, 10), curtain, -7 + sx * (7.6 + k * 0.3), 4.4, -D / 2 + 0.35 + (k % 2) * 0.1));
  }
  g.add(mesh(new THREE.BoxGeometry(15.2, 0.6, 0.4), curtain, -7, 8.7, -D / 2 + 0.4, false));
  room.colliders.push({ x: 0, z: 0, r: 0, box: { minX: origin.x - 18, maxX: origin.x + 4, minZ: origin.z - D / 2, maxZ: origin.z - D / 2 + 1.0 } });
  // tiered seating: four rows of six, stepping up towards the back
  const seat = solid('#b3263c', { roughness: 0.9 });
  const riser = solid('#2a1834', { roughness: 1 });
  for (let row = 0; row < 4; row++) {
    const z = -9 + row * 2.6;
    const y = row * 0.32;
    if (row) {
      g.add(mesh(new THREE.BoxGeometry(14.4, y, 2.6), riser, -7.6, y / 2, z));
      g.add(mesh(new THREE.BoxGeometry(14.4, 0.04, 0.06), glow('#ffd08a', 1.4), -7.6, y + 0.01, z + 1.3, false));
    }
    for (let k = 0; k < 6; k++) {
      const x = -13.1 + k * 2.2;
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.42, 0.8), seat, x, y + 0.42, z - 0.05));
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.85, 0.16), seat, x, y + 0.85, z + 0.37));
      for (const sx of [-0.5, 0.5]) g.add(mesh(new THREE.BoxGeometry(0.08, 0.6, 0.7), riser, x + sx, y + 0.5, z));
      if ((k + row) % 3 === 0) {
        const p = person({ seed: r(), accent: C });
        if (k % 2) giveProp(p, 'cup', '#ffd84a');
        addNpc(room, p, x, z - 0.1, Math.PI, 'sit', 'fun', { y: y + 0.12 });
      }
    }
    room.colliders.push({ x: 0, z: 0, r: 0, box: { minX: origin.x - 14.8, maxX: origin.x - 0.4, minZ: origin.z + z - 0.65, maxZ: origin.z + z + 0.65 } });
  }
  // the film selector by the cinema's entrance: six tiles, tap one to put it on the big screen
  const tiles = [];
  const sel = new THREE.Group();
  sel.position.set(1.6, 0, 3.4);
  sel.rotation.y = -Math.PI / 2;
  sel.add(mesh(new THREE.BoxGeometry(3.6, 2.6, 0.16), solid('#160e22'), 0, 1.75, -0.08));
  sel.add(mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), DARK, 0, 0.25, -0.08));
  const head = plate(3.4, 0.4, (c, w, h) => {
    c.fillStyle = '#160e22';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd08a';
    c.font = `700 ${h * 0.5}px ${FONT.sans}`;
    c.textBaseline = 'middle';
    c.fillText('PICK A FILM FOR THE BIG SCREEN', 16, h / 2 + 1);
  });
  head.position.set(0, 2.8, 0.01);
  sel.add(head);
  films.forEach((slug, k) => {
    const tx = -1.1 + (k % 3) * 1.1;
    const ty = 2.15 - Math.floor(k / 3) * 0.95;
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.56), screenMat(PROJECTS[slug].images[0], 16 / 9));
    tile.position.set(tx, ty, 0.012);
    sel.add(tile);
    const cap = plate(1.0, 0.2, (c, w, h) => {
      c.fillStyle = '#160e22';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffffff';
      c.font = `600 ${h * 0.55}px ${FONT.sans}`;
      c.textBaseline = 'middle';
      fillFit(c, PROJECTS[slug].title, 8, h / 2 + 1, w - 16);
    });
    cap.position.set(tx, ty - 0.39, 0.012);
    sel.add(cap);
    const ring = mesh(new THREE.BoxGeometry(1.08, 0.64, 0.01), glow(PINK, 2), tx, ty, 0.004, false);
    ring.visible = k === 0;
    ring.userData.dynamic = true;
    sel.add(ring);
    tiles.push({ tile, ring });
    clickable(room, tile, { kind: 'call', label: PROJECTS[slug].title, fn: () => {
      showFilm(k, true);
      window.__shire?.ui?.toast(`<b>🎬 Now showing: ${PROJECTS[slug].title}.</b> Take a seat, or press <kbd>E</kbd> at the screen to open it.`, 3200);
    } });
  });
  g.add(sel);
  addBox(room, 1.4, 1.6, 1.8, 5.2);
  addThing(room, 0.2, 3.4, { kind: 'call', label: 'Film selector: put the next film on', verb: 'Next film', fn: () => {
    const k = (current + 1) % films.length;
    showFilm(k, true);
    window.__shire?.ui?.toast(`<b>🎬 Now showing: ${PROJECTS[films[k]].title}.</b>`, 2400);
  } });
  addThing(room, -7, -16.4, { kind: 'screen', label: 'The big screen', verb: 'Open this film', screen: scr.screen });
  // wall sconces, dim
  for (const z of [-14, -6, 2]) for (const x of [-17.9, 3.75]) g.add(mesh(new THREE.BoxGeometry(0.1, 0.5, 0.3), glow('#ff9f6a', 1.2), x, 3.2, z, false));
  lamp(room, -7, 6, -4, '#ff9f6a', 3, 14);

  // ===== Stop-motion workshop: Modern Junkyard =====
  floorPatch(room, 11, 1, 13.6, 13.6, new THREE.MeshStandardMaterial({ color: '#4a3a2c', roughness: 0.9 }));
  // the miniature set on a big table: a little junkyard street in clay
  const set = table(room, 11, 2, 0, { w: 3.6, d: 2.0, h: 0.9, top: '#8a5f3a' });
  const clay = ['#ff8fb1', '#ffd84a', '#7b5cff', '#00a79d', '#e5484d'];
  set.add(mesh(new THREE.BoxGeometry(3.4, 1.5, 0.05), solid('#bfe3ff'), 0, 1.65, -0.95));
  set.add(mesh(new THREE.BoxGeometry(3.4, 0.02, 1.8), solid('#c7b28a'), 0, 0.92, 0, false));
  for (let k = 0; k < 6; k++) set.add(mesh(new THREE.BoxGeometry(0.35 + r() * 0.2, 0.3 + r() * 0.5, 0.35), solid(['#9c8a72', '#6f7b86', '#b5523b'][k % 3], { roughness: 1 }), -1.4 + k * 0.55, 1.1 + r() * 0.1, -0.6));
  set.add(mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), solid('#2b2b2b'), 1.2, 1.1, 0.3));
  const puppets = [];
  for (let k = 0; k < 4; k++) {
    const pu = new THREE.Group();
    pu.position.set(-0.9 + k * 0.6, 0.93, 0.1);
    pu.add(mesh(new THREE.CapsuleGeometry(0.08, 0.14, 4, 8), solid(clay[k], { roughness: 1 }), 0, 0.14, 0));
    pu.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), solid(clay[k], { roughness: 1 }), 0, 0.32, 0));
    set.add(pu);
    puppets.push(pu);
  }
  room.updaters.push({
    update: (t) => {
      const frame = Math.floor(t * 4);
      puppets.forEach((pu, k) => {
        pu.position.x = -0.9 + k * 0.6 + Math.sin(frame * 0.4 + k) * 0.08;
        pu.rotation.y = Math.sin(frame * 0.3 + k) * 0.5;
      });
    },
  });
  // the camera on its tripod, and a softbox, both on proper three-legged stands
  const tripod = (x, z, top, withCam) => {
    const tg = new THREE.Group();
    tg.position.set(x, 0, z);
    tg.add(mesh(new THREE.CylinderGeometry(0.02, 0.025, top, 6), DARK, 0, top / 2, 0));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const leg = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 5), DARK, Math.cos(a) * 0.25, 0.38, Math.sin(a) * 0.25);
      leg.rotation.set(Math.sin(a) * 0.62, 0, -Math.cos(a) * 0.62);
      tg.add(leg);
    }
    if (withCam) {
      tg.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.18), DARK, 0, top + 0.1, 0));
      const lens = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 12), solid('#111'), 0, top + 0.1, -0.16);
      lens.rotation.x = Math.PI / 2;
      tg.add(lens);
    }
    g.add(tg);
    addCollider(room, x, z, 0.35);
    return tg;
  };
  tripod(11, 4.4, 1.55, true);
  const sb = tripod(13.6, 4.0, 2.0, false);
  const soft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), glow('#ffffff', 2));
  soft.position.set(0, 2.25, 0);
  soft.rotation.set(-0.5, 0.5, 0);
  sb.add(soft);
  lamp(room, 12.6, 2.5, 3, '#fff6e0', 4, 6);
  // shelves of clay, armatures and tools
  const sh = shelf(room, 17.55, 1, -Math.PI / 2, { w: 3.2, h: 2.2, rows: 3, fill: 'none', wood: '#6b4a2c' });
  for (let k = 0; k < 18; k++) sh.add(mesh(new THREE.SphereGeometry(0.08 + r() * 0.05, 8, 6), solid(clay[k % 5], { roughness: 1 }), -1.3 + (k % 6) * 0.5, 0.17 + Math.floor(k / 6) * 0.7, 0));
  // the films, frame by frame, on the workshop's walls
  const smFilms = ['urbanclap', 'veggie-people', 'holi-stop-motion', 'valentines-week', 'winter-foods', 'modern-junkyard'];
  smFilms.forEach((slug, k) => {
    const onBack = k < 3;
    const x = onBack ? 6.6 + k * 2.9 : 17.92;
    const z = onBack ? -5.8 : 6.4 - (k - 3) * 2.2;
    const ry = onBack ? 0 : -Math.PI / 2;
    const y = onBack ? 2.6 : 4.4;
    const f = framed(room, x, y, z + (onBack ? 0.17 : 0), ry, 2.3, 1.38, screenMat(PROJECTS[slug].images[0], 2.3 / 1.38), { frame: '#ff9f1c', border: 0.06 });
    if (!onBack) f.group.position.y = 4.6 - (k - 3) * 0 ;
    clickable(room, f.pic, { kind: 'project', slug });
    const cap = plate(2.3, 0.28, (c, w, h) => {
      c.fillStyle = '#160e22';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffd08a';
      c.font = `700 ${h * 0.52}px ${FONT.sans}`;
      c.textBaseline = 'middle';
      fillFit(c, PROJECTS[slug].title, 12, h / 2 + 1, w - 24);
    });
    cap.position.copy(f.group.position).add(new THREE.Vector3(onBack ? 0 : -0.04, -0.88, onBack ? 0.04 : 0));
    cap.rotation.y = ry;
    g.add(cap);
  });
  addThing(room, 11, 5.6, { kind: 'project', slug: 'modern-junkyard', label: 'Modern Junkyard: the stop-motion studio', verb: 'Open' });
  addThing(room, 9.5, -4.2, { kind: 'project', slug: 'urbanclap', label: 'Stop motion: All Things A for UrbanClap', verb: 'Open' });
  addThing(room, 16, -1.2, { kind: 'project', slug: 'winter-foods', label: 'Stop motion: Winter Foods', verb: 'Open' });
  addNpc(room, person({ seed: r(), style: 'kurta', accent: C }), 9.2, 3.6, faceTo(9.2, 3.6, 10.6, 2), 'think', 'fun', { name: 'Animator', lines: ['Don’t bump the table: we’re mid-shot.', 'One frame, nudge the puppet, another frame. That’s the whole trick, and the whole week.'] });

  // ===== Found-object art: Power =====
  floorPatch(room, 11, -13, 13.6, 13.6, new THREE.MeshStandardMaterial({ color: '#efe9e0', roughness: 0.85 }));
  const gallery = new THREE.MeshStandardMaterial({ color: '#f4f0ea', roughness: 0.9 });
  for (const [x, z, w, d] of [[17.95, -13, 0.05, 13.6], [11, -19.95, 13.6, 0.05]]) g.add(mesh(new THREE.BoxGeometry(w, 6, d), gallery, x, 3, z, false));
  // assemblages of sockets, switches and wires, as in the series
  const plateM = solid('#f6f4ef', { roughness: 0.5 });
  const brass = solid('#c9a24a', { metalness: 0.8, roughness: 0.3 });
  const wire = solid('#1e1e1e', { roughness: 0.6 });
  const sculptures = [
    (a) => {
      a.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), plateM, 0, 0.45, 0));
      for (const [x, y] of [[-0.1, 0.52], [0.1, 0.52], [0, 0.36]]) a.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), wire, x, y, 0.04).rotateX(Math.PI / 2));
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.2, 0.03), new THREE.Vector3(0.2, 0.05, 0.1), new THREE.Vector3(-0.1, 0.02, 0.2), new THREE.Vector3(0.15, 0.6, 0.15)]);
      a.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.018, 6), wire));
    },
    (a) => {
      for (let k = 0; k < 4; k++) {
        const s = mesh(new THREE.BoxGeometry(0.22, 0.32, 0.05), plateM, (k % 2) * 0.26 - 0.13, 0.25 + Math.floor(k / 2) * 0.36, 0);
        s.rotation.z = (k - 1.5) * 0.08;
        a.add(s);
        a.add(mesh(new THREE.BoxGeometry(0.06, 0.12, 0.04), brass, s.position.x, s.position.y, 0.04));
      }
    },
    (a) => {
      a.add(mesh(new THREE.TorusKnotGeometry(0.22, 0.02, 90, 6, 2, 5), wire, 0, 0.45, 0));
      a.add(mesh(new THREE.BoxGeometry(0.3, 0.3, 0.06), plateM, 0, 0.45, 0));
      a.add(mesh(new THREE.SphereGeometry(0.06, 12, 8), glow('#ffd84a', 2.5), 0, 0.82, 0));
    },
  ];
  sculptures.forEach((make, k) => {
    const x = 7.8 + k * 3.2;
    const z = -11.2 + (k % 2) * 1.4;
    plinth(room, x, z, { w: 0.9, h: 1.1, color: '#f4f0ea', top: solid('#e3ddd2') });
    const art = new THREE.Group();
    art.position.set(x, 1.12, z);
    make(art);
    art.traverse((o) => (o.userData.dynamic = true));
    g.add(art);
    room.updaters.push({ update: (t) => (art.rotation.y = Math.sin(t * 0.4 + k) * 0.5) });
    clickable(room, art.children[0], { kind: 'project', slug: 'power' });
    g.add(mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.3, 14), DARK, x, 6.1, z, false));
  });
  PROJECTS.power.images.forEach((src, k) => {
    const f = framed(room, 7.6 + k * 4, 3.0, -19.85, 0, 2.4, 2.4, screenMat(src, 1), { frame: '#1a1814', border: 0.05, mat: '#ffffff' });
    clickable(room, f.pic, { kind: 'project', slug: 'power' });
  });
  const powerLabel = plate(2.4, 1.2, (c, w, h) => {
    c.fillStyle = '#f4f0ea';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#1d1814';
    c.font = `800 ${h * 0.2}px ${FONT.display}`;
    c.fillText('Power', 28, h * 0.26);
    c.fillStyle = '#6a5d50';
    c.font = `500 ${h * 0.09}px ${FONT.mono}`;
    c.fillText(`FOUND-OBJECT ART · ${PROJECTS.power.year}`, 28, h * 0.42);
    c.fillStyle = '#3b332c';
    c.font = `500 ${h * 0.1}px ${FONT.sans}`;
    wrap(c, PROJECTS.power.summary, w - 56, 4).forEach((l, k) => c.fillText(l, 28, h * 0.6 + k * h * 0.12));
  });
  powerLabel.position.set(17.9, 2.4, -13);
  powerLabel.rotation.y = -Math.PI / 2;
  g.add(powerLabel);
  clickable(room, powerLabel, { kind: 'project', slug: 'power' });
  addThing(room, 11, -8.6, { kind: 'project', slug: 'power', label: 'Power: found-object art', verb: 'Open' });
  addNpc(room, person({ seed: r(), style: 'dress', accent: C }), 13.8, -9.4, faceTo(13.8, -9.4, 14.2, -11.2), 'think', 'fun');
  lamp(room, 11, 5.5, -12.5, '#fff6e6', 6, 11);

  // ===== Arcade =====
  floorPatch(room, 12.5, 14, 10.6, 11.6, new THREE.MeshStandardMaterial({ map: (() => { const t = tileTexture('#151a3a', '#1d1240', 10, 'rgba(0,229,255,0.35)'); t.repeat.set(2, 2); return t; })(), roughness: 0.4, emissive: '#1a0f3a', emissiveIntensity: 0.4 }));
  const ring = PROJECTS.ring;
  cabinet(room, 17.2, 16.5, -Math.PI / 2, { body: '#3a1d4f', art: PINK, marquee: 'BACK IN THE RING', img: 'work/ring-cover.jpg', action: { kind: 'link', url: ring.play.url, title: ring.play.label } });
  cabinet(room, 17.2, 14.9, -Math.PI / 2, { body: '#1d2b4f', art: '#00e5ff', marquee: 'BACK IN THE RING', img: ring.images[1], action: { kind: 'link', url: ring.play.url, title: ring.play.label } });
  cabinet(room, 17.2, 13.3, -Math.PI / 2, { body: '#1d4f3a', art: '#ffd84a', marquee: 'TRIAL', img: 'work/trial-1.jpg', action: { kind: 'project', slug: 'trial' } });
  cabinet(room, 17.2, 11.7, -Math.PI / 2, { body: '#4f1d2b', art: '#ff9f1c', marquee: 'MAGIC CHECKOUT', img: 'work/magic-cover.jpg', action: { kind: 'project', slug: 'magic-checkout' } });
  addThing(room, 15.7, 15.7, { kind: 'link', url: ring.play.url, title: ring.play.label, label: 'Arcade: Back in the Ring, the Netbanking game', verb: 'Play the game' });
  addThing(room, 15.7, 13.3, { kind: 'project', slug: 'trial', label: 'Trial of the Century', verb: 'Open' });
  addThing(room, 15.7, 11.7, { kind: 'project', slug: 'magic-checkout', label: 'Magic Checkout', verb: 'Open' });
  // the ring poster and the case study on the front wall
  const rp = framed(room, 12.2, 3.2, D / 2 - 0.08, Math.PI, 2.2, 3.1, screenMat(ring.images[1], 2.2 / 3.1), { frame: PINK, border: 0.07 });
  clickable(room, rp.pic, { kind: 'project', slug: 'ring' });
  addThing(room, 12.2, 18.2, { kind: 'project', slug: 'ring', label: 'Back in the Ring: the case study', verb: 'Open' });
  const gamer = person({ seed: r(), style: 'streetwear', accent: C });
  addNpc(room, gamer, 16.1, 13.3, Math.PI / 2, 'type', 'fun', { name: 'Arcade regular', lines: ['Every opponent you beat unlocks a Netbanking feature. I’m on round four.', 'The Back in the Ring cabinets open the real game. Press E at one.'] });
  for (let k = 0; k < 2; k++) stool(room, 14.6, 16.5 - k * 3.2, { color: PINK });
  for (const [x, col] of [[8.2, PINK], [9.4, '#00e5ff']]) g.add(mesh(new THREE.BoxGeometry(0.06, 5.4, 0.06), glow(col, 2.4), x, 2.9, 19.9, false));
  lamp(room, 12.5, 4.6, 14.5, '#b07bff', 6, 10);

  // ===== Creative lounge =====
  rug(room, -12.5, 13.6, 7, 5.2, ['#5a2a4a', '#ffd08a', '#2f6b5a']);
  sofa(room, -12.5, 16.5, Math.PI, { w: 3.4, color: '#e0703a', cushion: '#f08a4f' });
  armchair(room, -16.2, 13.2, Math.PI / 2, { color: '#7b5cff' });
  coffeeTable(room, -12.5, 13.6, 0, { w: 1.7, d: 0.8, top: '#2b1d3a' });
  // beanbags
  for (const [x, z, col] of [[-9.4, 12.2, '#ffd84a'], [-10.4, 10.4, '#00a79d']]) {
    const bb = mesh(new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), solid(col, { roughness: 1 }), x, 0.0, z);
    bb.scale.y = 0.95;
    g.add(bb);
    addCollider(room, x, z, 0.55);
  }
  floorLamp(room, -17, 18.8, { color: '#ffd9a8' });
  plant(room, -17, 9, { s: 1.1, pot: '#36254a' });
  // the wall of films and references: the ones that shaped the work
  const items = [
    ...FAVOURITES.influences.map((i) => ({ ...i, kind: 'Inspired the work' })),
    ...FAVOURITES.films.map((i) => ({ ...i, kind: 'Favourite film' })),
    ...FAVOURITES.shows.map((i) => ({ ...i, kind: 'Favourite show' })),
  ];
  items.forEach((item, k) => {
    const poster = plate(1.5, 2.25, (c, w, h) => {
      const grad = c.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, ['#ff9f1c', PINK, '#7b5cff', '#00a79d'][k % 4]);
      c.fillStyle = grad;
      c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 6;
      c.strokeRect(16, 16, w - 32, h - 32);
      c.fillStyle = '#ffd84a';
      c.font = `600 ${w * 0.055}px ${FONT.sans}`;
      c.fillText(item.kind.toUpperCase(), 36, 70);
      c.fillStyle = '#ffffff';
      c.font = `800 ${w * 0.13}px ${FONT.display}`;
      const lines = wrap(c, item.title, w - 72, 3);
      lines.forEach((l, i) => c.fillText(l, 36, h * 0.5 + i * w * 0.15));
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.font = `500 ${w * 0.06}px ${FONT.sans}`;
      c.fillText(item.year || '', 36, h * 0.5 + lines.length * w * 0.15 + 10);
      c.font = `500 ${w * 0.05}px ${FONT.sans}`;
      wrap(c, item.note || '', w - 72, 5).forEach((l, i) => c.fillText(l, 36, h * 0.74 + i * w * 0.07));
    });
    poster.position.set(-17.93, 3, 11 + k * 2.0);
    poster.rotation.y = Math.PI / 2;
    g.add(poster);
    clickable(room, poster, { kind: 'poster', item });
  });
  addThing(room, -16.2, 15, { kind: 'place', id: 'fun', label: 'Films & references', verb: 'See all' });
  addNpc(room, person({ seed: r(), style: 'hoodie', accent: C }), -13.2, 16.45, Math.PI, 'sit', 'fun', { y: 0.02, name: 'Writer', lines: ['Damini’s “sawaal pe sawaal” scene is where Trial of the Century’s courtroom began.', 'Every story on that wall left a fingerprint on the work.'] });
  lamp(room, -12.5, 5, 14, '#ffd9a8', 5, 10);

  room.sounds = { ring: [16.5, 16.5], power: [11, -12] };
  return room;
}
