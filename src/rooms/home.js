// Vibhor's home: a Jaipur house of warm cream walls, pale pink sandstone arches, wood floors, olive
// and brass. Six rooms, one continuous interior, opened to each other by scalloped arches:
//   Entrance & living room — the bicycle by the door, the sofa, filter coffee and a sleeping cat
//   Gaming lounge — the TV and the sofa where Nikita plays, and a mini football pitch
//   Kitchen & dining — the counter, the table, the kettle
//   Creative workspace — the work desk, the campaign playbook, the mentoring corner
//   Career library — the path from Jaipur to Razorpay, the portrait, leadership notes, a reading chair
//   Personal collection — the trophy cabinet, photographs, and the typewriter that writes to Vibhor
// Nikita lives here and moves between the rooms on her own (see nikita.js).
import * as THREE from 'three';
import { PROJECTS, OWNER, AWARDS, HOME, LENSES, PLAYS } from '../data.js';
import { screenMat, makeDesk, dashboardTexture } from '../props.js';
import { solid, mesh, canvasTexture, WHITE_METAL, BRUSHED, DARK, GOLD } from '../materials.js';
import { FONT, fit, wrap, fillFit } from '../type.js';
import { makePerson } from '../characters.js';
import { makeBicycle } from '../jaipur.js';
import { playerPos } from '../village.js';
import { sfx } from '../audio.js';
import { rng } from '../world.js';
import {
  makeShell, partition, zone, addThing, addCollider, addBox, addFootprint, addNpc, clickable, plate, lamp, sofa, armchair, coffeeTable, plant,
  floorLamp, rug, framed, bigScreen, plankTexture, floorPatch, shelf, table, chair, counter, pendant, niche, local, faceTo,
} from './kit.js';
import { addNikita } from './nikita.js';

const C = HOME.color;
const CREAM = '#f4e9db';
const SAND = '#e8b4a0';
const OLIVE = '#6b7a3a';
const BRASS = '#c9a24a';

export function buildHome(origin) {
  const W = 32;
  const D = 30;
  const planks = plankTexture(['#c39468', '#b98a5c', '#caa074', '#b48455']);
  planks.repeat.set(6, 6);
  const room = makeShell({
    id: 'home',
    origin,
    w: W,
    d: D,
    h: 6.5,
    floor: new THREE.MeshStandardMaterial({ map: planks, roughness: 0.6 }),
    wall: new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.9 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#fbf7f1', roughness: 0.9 }),
    trim: solid(SAND),
    doorColor: '#fff3cf',
  });
  const g = room.group;
  const r = rng(902);
  const SANDSTONE = new THREE.MeshStandardMaterial({ color: SAND, roughness: 0.85 });
  const BRASS_M = solid(BRASS, { metalness: 0.75, roughness: 0.3 });
  const WOOD = solid('#7a5232', { roughness: 0.6 });
  const PH = 4.3;
  const sign = (t) => ({ signColor: '#3b2a1c', signInk: 'rgba(251,246,238,0.9)', signs: t });

  // ----- the plan -----
  partition(room, { axis: 'z', at: -6, from: 3, to: 15, h: PH, mat: SANDSTONE, trim: BRASS_M, openings: [{ at: 9, w: 3.4, ...sign({ pos: 'Gaming lounge' }) }] });
  partition(room, { axis: 'z', at: 8, from: 3, to: 15, h: PH, mat: SANDSTONE, trim: BRASS_M, openings: [{ at: 9, w: 3.4, ...sign({ neg: 'Kitchen & dining' }) }] });
  partition(room, { axis: 'x', at: 3, from: -16, to: 16, h: PH, mat: SANDSTONE, trim: BRASS_M, openings: [{ at: -12.6, w: 2.6, ...sign({ pos: 'Workspace' }) }, { at: 1, w: 3.4, ...sign({ pos: 'Library' }) }, { at: 12, w: 2.6, ...sign({ pos: 'Collection' }) }] });
  partition(room, { axis: 'z', at: -4, from: -15, to: 3, h: PH, mat: SANDSTONE, trim: BRASS_M, openings: [{ at: -6, w: 2.8 }] });
  partition(room, { axis: 'z', at: 6, from: -15, to: 3, h: PH, mat: SANDSTONE, trim: BRASS_M, openings: [{ at: -6, w: 2.8 }] });
  zone(room, 'living', 'Entrance & living room', -6, 3, 8, 15, [2.6, 10.8], 'Coffee, the cat, the bicycle');
  zone(room, 'gaming', 'Gaming lounge', -16, 3, -6, 15, [-9.6, 11.6], 'Nikita’s game night, mini football');
  zone(room, 'kitchen', 'Kitchen & dining', 8, 3, 16, 15, [11.6, 11.8], 'The counter and the table');
  zone(room, 'workspace', 'Creative workspace', -16, -15, -4, 3, [-9.6, -4], 'The desk, the playbook, mentoring');
  zone(room, 'library', 'Career library', -4, -15, 6, 3, [1, -6], 'The path, and how I lead');
  zone(room, 'collection', 'Personal collection', 6, -15, 16, 3, [11, -6], 'Trophies, photos, the typewriter');

  // a pink dado and a brass picture rail round the outer walls
  for (const [x, z, len, ry] of [[0, -D / 2 + 0.03, W, 0], [-W / 2 + 0.03, 0, D, Math.PI / 2], [W / 2 - 0.03, 0, D, -Math.PI / 2]]) {
    const dado = mesh(new THREE.BoxGeometry(len, 1.1, 0.03), SANDSTONE, x, 0.55, z, false);
    dado.rotation.y = ry;
    g.add(dado);
    const rail = mesh(new THREE.BoxGeometry(len, 0.05, 0.05), BRASS_M, x, 4.6, z, false);
    rail.rotation.y = ry;
    g.add(rail);
  }
  // pendant lamps through the house
  for (const [x, z] of [[2.5, 8], [-11, 9], [12, 8.4], [-10, -6], [1, -6], [11, -6]]) pendant(room, x, z, 3.9, { color: '#ffe2b0', shade: BRASS, r: 0.32 });
  for (const [x, z] of [[2.5, 8], [-11, 9], [12, 8.4], [-10, -6], [1, -6], [11, -6]]) lamp(room, x, 3.6, z, '#ffdcae', 4, 9);

  // ===== Entrance & living room =====
  rug(room, 0, 13.4, 2.6, 1.4, ['#6b7a3a', '#e8c27a', '#b5523b']);
  // the bicycle, parked by the door; your ride waits outside
  const bike = makeBicycle('#2f6bff');
  bike.position.set(5.2, 0, 14.2);
  bike.rotation.y = Math.PI / 2;
  g.add(bike);
  addBox(room, 4.2, 13.8, 6.2, 14.6);
  addThing(room, 4.6, 12.8, { kind: 'ride-out', label: 'Your bicycle: go for a ride on the island', verb: 'Ride out' });
  // a console table and a mirror by the door
  table(room, -3.6, 14.5, 0, { w: 1.8, d: 0.45, h: 0.85, top: '#7a5232' });
  niche(room, -3.6, 14.98, Math.PI, { w: 1.2, h: 1.5, y: 1.3, depth: 0.12, frame: BRASS_M, back: '#d8e2e6', light: '#fff3d6' });
  plant(room, -5.2, 14.2, { s: 1.1, pot: SAND, leaf: '#4f7a33' });
  // the living room: sofa, coffee table, armchair, TV on the arch wall
  rug(room, 5.0, 6.8, 5.6, 4.2, ['#b5523b', '#e8c27a', OLIVE]);
  sofa(room, 5.0, 8.9, Math.PI, { w: 2.9, color: OLIVE, cushion: '#7d8c48' });
  armchair(room, 7.0, 5.4, -Math.PI / 2, { color: '#c98b5a' });
  coffeeTable(room, 5.0, 6.7, 0, { w: 1.4, d: 0.7, top: '#7a5232' });
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.14, 12), solid('#d9d4c7', { metalness: 0.7, roughness: 0.3 }), 5.2, 0.52, 6.6));
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 14), solid('#d9d4c7', { metalness: 0.7, roughness: 0.3 }), 5.2, 0.47, 6.6));
  addThing(room, 3.4, 6.7, { kind: 'toast', label: 'Bengaluru filter coffee', verb: 'Take a sip', text: '<b>☕ Filter coffee.</b> Most good ideas in this house start here.' });
  const tv = bigScreen(room, 5.0, 2.0, 3.2, 0, 2.6, 1.46, screenMat('work/btb-1.jpg', 16 / 9));
  clickable(room, tv.screen, { kind: 'project', slug: 'btb' });
  g.add(mesh(new THREE.BoxGeometry(2.8, 0.5, 0.45), WOOD, 5.0, 0.25, 3.45));
  addBox(room, 3.6, 3.16, 6.4, 3.7);
  // the cat, asleep on the sofa
  const cat = new THREE.Group();
  cat.position.set(4.0, 0.6, 9.0);
  cat.rotation.y = 0.4;
  const fur = solid('#e8a35c', { roughness: 1 });
  const body = mesh(new THREE.CapsuleGeometry(0.2, 0.35, 4, 10), fur);
  body.rotation.z = Math.PI / 2;
  cat.add(body);
  cat.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), fur, 0.36, 0.05, 0.05));
  for (const z of [-0.05, 0.14]) cat.add(mesh(new THREE.ConeGeometry(0.05, 0.1, 6), fur, 0.42, 0.2, z));
  const tail = mesh(new THREE.CapsuleGeometry(0.04, 0.4, 4, 6), fur, -0.35, 0, 0.18);
  tail.rotation.set(Math.PI / 2, 0.4, 0);
  cat.add(tail);
  cat.traverse((o) => (o.userData.dynamic = true));
  g.add(cat);
  room.updaters.push({ update: (t) => (body.scale.y = 1 + Math.sin(t * 1.6) * 0.06) });
  addThing(room, 3.6, 10.2, { kind: 'toast', label: 'The cat', verb: 'Pet', text: '<b>🐈 Purr.</b> The studio’s most senior creative director, asleep on the job.' });
  floorLamp(room, 7.2, 10.2, { color: '#ffe2b0', stem: BRASS });
  plant(room, 7.2, 14.2, { s: 1.2, pot: SAND, leaf: '#4f8a3a' });
  addNpc(room, makePerson({ seed: 0.52, style: 'kurta', accent: C }), -2.8, 10.6, faceTo(-2.8, 10.6, 0, 14), 'talk', 'home', { lines: HOME.quotes, name: 'Neighbour' });

  // ===== Gaming lounge =====
  rug(room, -12.6, 11.6, 4.6, 5.4, ['#3d5f9e', '#e8c27a', '#2f5b4a']);
  const gameCanvas = document.createElement('canvas');
  gameCanvas.width = 512;
  gameCanvas.height = 288;
  const gameTex = new THREE.CanvasTexture(gameCanvas);
  gameTex.colorSpace = THREE.SRGBColorSpace;
  const gtv = bigScreen(room, -15.86, 2.0, 11.6, Math.PI / 2, 3.2, 1.8, new THREE.MeshBasicMaterial({ map: gameTex, toneMapped: false }));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 3.0), WOOD, -15.65, 0.25, 11.6));
  g.add(mesh(new THREE.BoxGeometry(0.32, 0.08, 0.4), solid('#f4f4f4'), -15.6, 0.54, 10.6, false));
  addBox(room, -16, 10.1, -15.4, 13.1);
  sofa(room, -12.4, 11.6, -Math.PI / 2, { w: 2.9, color: '#3d5f9e', cushion: '#5b7bb8' });
  const bean = mesh(new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), solid('#e0703a', { roughness: 1 }), -13.6, 0, 14.2);
  g.add(bean);
  addCollider(room, -13.6, 14.2, 0.55);
  // a little, hand-drawn take on a bug-kingdom platformer, alternating with a red-cloaked sequel
  const drawGame = (t) => {
    const c = gameCanvas.getContext('2d');
    const W = 512;
    const H = 288;
    const sequel = Math.floor(t / 18) % 2 === 1;
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, sequel ? '#2a1214' : '#0b1a2e');
    sky.addColorStop(1, sequel ? '#6b3a22' : '#1d3b52');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);
    const scroll = (t * 30) % W;
    // far silhouettes
    c.fillStyle = sequel ? 'rgba(20,6,8,0.6)' : 'rgba(6,14,26,0.65)';
    for (let k = -1; k < 7; k++) {
      const x = k * 90 - (scroll * 0.4) % 90;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + 30, 70 + (k % 3) * 25);
      c.lineTo(x + 60, 0);
      c.fill();
      c.fillRect(x + 20, H - 110 - (k % 2) * 30, 22, 120);
    }
    // glowing motes
    for (let k = 0; k < 18; k++) {
      const x = (k * 71 - scroll * 0.7 + W * 4) % W;
      const y = (k * 43 + Math.sin(t + k) * 12) % (H - 60);
      c.fillStyle = sequel ? 'rgba(255,190,110,0.8)' : 'rgba(170,230,255,0.8)';
      c.beginPath();
      c.arc(x, y, 1.6 + (k % 3), 0, Math.PI * 2);
      c.fill();
    }
    // ground and platforms
    c.fillStyle = sequel ? '#1a0c0a' : '#08111c';
    c.fillRect(0, H - 46, W, 46);
    for (let k = -1; k < 5; k++) {
      const x = k * 150 - (scroll % 150);
      c.fillRect(x + 40, H - 120 - (k % 2) * 40, 80, 10);
    }
    // the hero: a small horned white mask in a dark (or red) cloak
    const hop = Math.abs(Math.sin(t * 3)) * 28;
    const hx = 170;
    const hy = H - 46 - hop;
    c.fillStyle = sequel ? '#b3262e' : '#1c2333';
    c.beginPath();
    c.moveTo(hx - 13, hy);
    c.lineTo(hx + 13, hy);
    c.lineTo(hx + 8, hy - 26);
    c.lineTo(hx - 8, hy - 26);
    c.fill();
    c.fillStyle = '#f4f1ea';
    c.beginPath();
    c.ellipse(hx, hy - 34, 10, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(hx - 8, hy - 40);
    c.lineTo(hx - 12, hy - 62);
    c.lineTo(hx - 3, hy - 44);
    c.moveTo(hx + 8, hy - 40);
    c.lineTo(hx + 12, hy - 62);
    c.lineTo(hx + 3, hy - 44);
    c.fill();
    c.fillStyle = '#05070c';
    c.beginPath();
    c.ellipse(hx - 4, hy - 33, 2.6, 4.4, 0, 0, Math.PI * 2);
    c.ellipse(hx + 4, hy - 33, 2.6, 4.4, 0, 0, Math.PI * 2);
    c.fill();
    // nail / needle slash
    if (Math.sin(t * 2.4) > 0.6) {
      c.strokeStyle = 'rgba(255,255,255,0.9)';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(hx + 18, hy - 24, 26, -1.1, 1.0);
      c.stroke();
    }
    // a crawling bug
    const bx = 320 - ((t * 40) % 200);
    c.fillStyle = sequel ? '#d98a3a' : '#e07a3a';
    c.beginPath();
    c.ellipse(bx, H - 54, 16, 9, 0, Math.PI, 0);
    c.fill();
    // HUD: masks and a soul vessel
    c.fillStyle = 'rgba(255,255,255,0.92)';
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      c.ellipse(64 + k * 20, 26, 6, 8, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.arc(32, 30, 16, 0, Math.PI * 2);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillRect(18, 30, 28, 14);
    gameTex.needsUpdate = true;
  };
  let lastDraw = -1;
  room.updaters.push({
    update: (t) => {
      if (t - lastDraw < 1 / 12) return;
      lastDraw = t;
      drawGame(t);
    },
  });
  drawGame(0);
  // Mini football: run into the ball (or press E) and score into the net
  const goal = { x: -8.0, z: 4.3, half: 1.2, depth: 0.9, h: 1.25 };
  const net = new THREE.Group();
  net.position.set(goal.x, 0, goal.z);
  for (const sx of [-1, 1]) net.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, goal.h, 10), WHITE_METAL, sx * goal.half, goal.h / 2, 0));
  const bar = mesh(new THREE.CylinderGeometry(0.05, 0.05, goal.half * 2 + 0.1, 10), WHITE_METAL, 0, goal.h, 0);
  bar.rotation.z = Math.PI / 2;
  net.add(bar);
  const netTex = canvasTexture(128, 128, (ctx, w) => {
    ctx.clearRect(0, 0, w, w);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    for (let k = 0; k <= w; k += 16) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, w);
      ctx.moveTo(0, k);
      ctx.lineTo(w, k);
      ctx.stroke();
    }
  });
  netTex.wrapS = netTex.wrapT = THREE.RepeatWrapping;
  const netMat = (rx, ry) => {
    const tx = netTex.clone();
    tx.repeat.set(rx, ry);
    tx.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map: tx, alphaTest: 0.4, side: THREE.DoubleSide, color: '#e9eef5' });
  };
  const netBack = new THREE.Mesh(new THREE.PlaneGeometry(goal.half * 2, goal.h), netMat(4, 2.2));
  netBack.position.set(0, goal.h / 2, -goal.depth);
  const netTop = new THREE.Mesh(new THREE.PlaneGeometry(goal.half * 2, goal.depth), netMat(4, 1.6));
  netTop.rotation.x = Math.PI / 2;
  netTop.position.set(0, goal.h, -goal.depth / 2);
  net.add(netBack, netTop);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(goal.depth, goal.h), netMat(1.6, 2.2));
    side.rotation.y = Math.PI / 2;
    side.position.set(sx * goal.half, goal.h / 2, -goal.depth / 2);
    net.add(side);
  }
  for (const m of net.children) m.userData.dynamic = true;
  g.add(net);
  addCollider(room, goal.x - goal.half, goal.z, 0.15);
  addCollider(room, goal.x + goal.half, goal.z, 0.15);
  room.colliders.push({ ...local(room, goal.x, goal.z - goal.depth / 2), r: 0, noBall: true, box: { minX: origin.x + goal.x - goal.half - 0.1, maxX: origin.x + goal.x + goal.half + 0.1, minZ: origin.z + goal.z - goal.depth - 0.1, maxZ: origin.z + goal.z - 0.15 } });
  // pitch markings on the floor
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 6.2), new THREE.MeshStandardMaterial({
    map: canvasTexture(256, 284, (ctx, w, h) => {
      ctx.fillStyle = '#3f8f4a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#479d52';
      for (let k = 0; k < 8; k += 2) ctx.fillRect(0, (k * h) / 8, w, h / 8);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.strokeRect(w * 0.22, 6, w * 0.56, h * 0.2);
      ctx.beginPath();
      ctx.arc(w / 2, h - 6, w * 0.18, Math.PI, 0);
      ctx.stroke();
    }),
    roughness: 1,
  }));
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.set(goal.x, 0.015, goal.z + 3.1);
  g.add(pitch);
  // the scoreboard
  const scoreTex = canvasTexture(512, 160, () => {});
  const drawScore = (n, msg) => {
    const ctx = scoreTex.image.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = '#4ade80';
    ctx.font = '700 34px Inter, sans-serif';
    ctx.fillText(msg, 28, 58);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 64px "Bricolage Grotesque", Inter, sans-serif';
    ctx.fillText(`GOALS  ${n}`, 28, 130);
    scoreTex.needsUpdate = true;
  };
  drawScore(0, 'MINI FOOTBALL · kick it in');
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.69), new THREE.MeshBasicMaterial({ map: scoreTex, toneMapped: false }));
  board.position.set(goal.x, 2.25, 3.18);
  board.userData.dynamic = true;
  g.add(board);

  const R = 0.2;
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(R, 1), new THREE.MeshStandardMaterial({
    map: canvasTexture(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#111827';
      for (let k = 0; k < 10; k++) {
        ctx.beginPath();
        ctx.arc((k * 53) % w, (k * 37) % h, 13, 0, Math.PI * 2);
        ctx.fill();
      }
    }),
    roughness: 0.5,
    flatShading: true,
  }));
  ball.castShadow = true;
  ball.userData.dynamic = true;
  g.add(ball);
  const home = { x: goal.x - 0.6, z: goal.z + 4.2 };
  const B = { x: home.x, z: home.z, y: R, vx: 0, vz: 0, vy: 0 };
  const prev = { x: 0, z: 0, ok: false };
  let goals = 0;
  let resetAt = 0;
  const axis = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const kickThing = {
    kind: 'kick',
    label: 'Mini football',
    verb: 'Kick',
    x: 0,
    z: 0,
    kick: (heading) => {
      const px = playerPos.x - origin.x;
      const pz = playerPos.z - origin.z;
      // aim at the goal when close enough, otherwise kick the way you face
      let dx = goal.x - B.x;
      let dz = goal.z - 0.4 - B.z;
      if (Math.hypot(B.x - px, B.z - pz) > 2.6) return;
      if (Math.hypot(dx, dz) > 7) {
        dx = Math.sin(heading);
        dz = Math.cos(heading);
      }
      const L = Math.hypot(dx, dz) || 1;
      sfx('kick');
      B.vx = (dx / L) * 7.5;
      B.vz = (dz / L) * 7.5;
      B.vy = 1.6;
    },
  };
  room.interactables.push(kickThing);
  room.updaters.push({
    update: (t, dt = 1 / 60) => {
      const px = playerPos.x - origin.x;
      const pz = playerPos.z - origin.z;
      const pvx = prev.ok ? (px - prev.x) / Math.max(dt, 1e-3) : 0;
      const pvz = prev.ok ? (pz - prev.z) / Math.max(dt, 1e-3) : 0;
      prev.x = px;
      prev.z = pz;
      prev.ok = true;
      if (resetAt && t > resetAt) {
        Object.assign(B, { x: home.x, z: home.z, y: R + 0.6, vx: 0, vz: 0, vy: 0 });
        resetAt = 0;
      }
      // the player's feet
      const dx = B.x - px;
      const dz = B.z - pz;
      const d = Math.hypot(dx, dz);
      if (d < 0.6 && d > 1e-4 && B.y < 0.9) {
        const nx = dx / d;
        const nz = dz / d;
        B.x = px + nx * 0.6;
        B.z = pz + nz * 0.6;
        const ps = Math.hypot(pvx, pvz);
        const want = Math.max(2.2, Math.min(ps, 12) * 1.6);
        const vn = B.vx * nx + B.vz * nz;
        if (vn < want) {
          if (want - vn > 2) sfx('kick', { gap: 0.25 });
          B.vx += nx * (want - vn);
          B.vz += nz * (want - vn);
          if (ps > 4) B.vy = Math.max(B.vy, 1.2);
        }
      }
      // gravity, bounce, rolling friction
      B.vy -= 9.8 * dt;
      B.y += B.vy * dt;
      if (B.y < R) {
        B.y = R;
        B.vy = Math.abs(B.vy) > 1 ? -B.vy * 0.45 : 0;
      }
      const f = Math.exp(-(B.y <= R + 0.01 ? 0.8 : 0.1) * dt);
      B.vx *= f;
      B.vz *= f;
      let nxp = B.x + B.vx * dt;
      let nzp = B.z + B.vz * dt;
      // the goal: scored once it crosses the line between the posts
      const inMouth = Math.abs(nxp - goal.x) < goal.half - R && B.y < goal.h;
      if (B.z >= goal.z && nzp < goal.z) {
        if (inMouth && !resetAt) {
          goals += 1;
          sfx('goal');
          drawScore(goals, ['GOAL!', 'GOOOAL!', 'Top corner!', 'Back of the net!'][goals % 4]);
          window.__shire?.ui?.toast(`<b>⚽ Goal!</b> That’s ${goals} in the living room.`, 2600);
          resetAt = t + 1.6;
        } else if (!inMouth) {
          B.vz = -B.vz * 0.6;
          nzp = goal.z + 0.01;
        }
      }
      if (nzp < goal.z) {
        // inside the net: bounce off its sides and back
        if (Math.abs(nxp - goal.x) > goal.half - R) {
          B.vx = -B.vx * 0.3;
          nxp = goal.x + Math.sign(nxp - goal.x) * (goal.half - R);
        }
        if (nzp < goal.z - goal.depth + R) {
          B.vz = -B.vz * 0.2;
          nzp = goal.z - goal.depth + R;
        }
      }
      // walls and furniture
      const lim = { x: room.w / 2 - R - 0.1, z: room.d / 2 - R - 0.1 };
      if (Math.abs(nxp) > lim.x) {
        B.vx = -B.vx * 0.7;
        nxp = Math.sign(nxp) * lim.x;
      }
      if (Math.abs(nzp) > lim.z) {
        B.vz = -B.vz * 0.7;
        nzp = Math.sign(nzp) * lim.z;
      }
      for (const c of room.colliders) {
        if (c.box || !c.r) continue;
        const cx = c.x - origin.x;
        const cz = c.z - origin.z;
        const ex = nxp - cx;
        const ez = nzp - cz;
        const ed = Math.hypot(ex, ez);
        const min = c.r + R;
        if (ed < min && ed > 1e-4) {
          const nx = ex / ed;
          const nz = ez / ed;
          nxp = cx + nx * min;
          nzp = cz + nz * min;
          const vn = B.vx * nx + B.vz * nz;
          if (vn < 0) {
            B.vx -= 1.7 * vn * nx;
            B.vz -= 1.7 * vn * nz;
          }
        }
      }
      // walls and anything boxy: bounce off the side it hit
      for (const c of room.colliders) {
        if (!c.box || c.noBall) continue;
        const x0 = c.box.minX - origin.x - R;
        const x1 = c.box.maxX - origin.x + R;
        const z0 = c.box.minZ - origin.z - R;
        const z1 = c.box.maxZ - origin.z + R;
        if (nxp <= x0 || nxp >= x1 || nzp <= z0 || nzp >= z1) continue;
        const push = [x0 - nxp, x1 - nxp, z0 - nzp, z1 - nzp];
        const k = push.reduce((best, v, i) => (Math.abs(v) < Math.abs(push[best]) ? i : best), 0);
        if (k < 2) {
          nxp += push[k];
          B.vx = -B.vx * 0.6;
        } else {
          nzp += push[k];
          B.vz = -B.vz * 0.6;
        }
      }
      const moved = Math.hypot(nxp - B.x, nzp - B.z);
      if (moved > 1e-5) {
        axis.set(nzp - B.z, 0, -(nxp - B.x)).normalize();
        q.setFromAxisAngle(axis, moved / R);
        ball.quaternion.premultiply(q);
      }
      B.x = nxp;
      B.z = nzp;
      ball.position.set(B.x, B.y, B.z);
      kickThing.x = origin.x + B.x;
      kickThing.z = origin.z + B.z;
    },
  });


  // ===== Kitchen & dining =====
  floorPatch(room, 12, 9, 7.6, 11.6, new THREE.MeshStandardMaterial({ map: (() => { const t = canvasTexture(256, 256, (c, w) => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { c.fillStyle = (i + j) % 2 ? '#efe4d2' : '#d9c3a5'; c.fillRect(i * 64, j * 64, 64, 64); c.fillStyle = (i + j) % 2 ? '#c8503c' : OLIVE; c.beginPath(); c.arc(i * 64 + 32, j * 64 + 32, 9, 0, Math.PI * 2); c.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 6); return t; })(), roughness: 0.5 }));
  const kc = counter(room, 15.6, 8.6, -Math.PI / 2, { w: 7.2, d: 0.7, body: OLIVE, top: '#f4f1ea' });
  // upper cabinets, a hob, a sink, a kettle and the coffee things
  g.add(mesh(new THREE.BoxGeometry(0.4, 0.9, 7.0), solid('#f4ecdf'), 15.78, 3.1, 8.6));
  for (let k = 0; k < 6; k++) g.add(mesh(new THREE.BoxGeometry(0.02, 0.04, 0.3), BRASS_M, 15.57, 2.8, 5.6 + k * 1.2, false));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.8), solid('#1e1e1e'), 15.55, 0.935, 6.6, false));
  for (const dz of [-0.2, 0.2]) g.add(mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 18), solid('#555'), 15.55, 0.95, 6.6 + dz, false).rotateX(Math.PI / 2));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.7), BRUSHED, 15.55, 0.92, 10.4, false));
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.24, 14), solid('#c8503c', { roughness: 0.4 }), 15.5, 1.07, 8.4));
  for (let k = 0; k < 3; k++) g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 12), solid(['#e8c27a', '#f4efe6', '#b5523b'][k]), 15.6, 1.06, 11.6 + k * 0.22));
  const fridge = mesh(new THREE.BoxGeometry(0.8, 2.1, 0.8), solid('#e9e4da', { roughness: 0.35 }), 15.5, 1.05, 13.8);
  g.add(fridge);
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.8, 0.04), BRASS_M, 15.08, 1.3, 13.5, false));
  addBox(room, 15.1, 13.4, 16, 14.2);
  addThing(room, 14.4, 8.4, { kind: 'toast', label: 'The kitchen', verb: 'Put the kettle on', text: '<b>🫖 The kettle’s on.</b> Chai or filter coffee: this house runs on both.' });
  table(room, 11.4, 8.6, Math.PI / 2, { w: 2.2, d: 1.1, top: '#7a5232', chairs: 4, chairColor: OLIVE });
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.12, 16), solid('#e8c27a'), 11.4, 0.85, 8.6));
  for (let k = 0; k < 4; k++) g.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), solid(['#e5484d', '#ffb02e', '#9be86a', '#e5484d'][k]), 11.4 + Math.cos(k * 1.6) * 0.08, 0.93, 8.6 + Math.sin(k * 1.6) * 0.08, false));
  plant(room, 9.0, 14.2, { s: 1.0, pot: SAND });

  // ===== Creative workspace =====
  const desk = makeDesk([new THREE.MeshBasicMaterial({ map: dashboardTexture('Studio this week', C, [['4', 'films in edit'], ['12', 'decks'], ['2', 'launches']], 3), toneMapped: false }), screenMat('work/btb-1.jpg', 0.92 / 0.52)], C);
  desk.position.set(-10.5, 0, -13.6);
  desk.rotation.y = Math.PI;
  g.add(desk);
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), solid('#1f2937'), -10.5, 0.45, -12.6));
  addFootprint(room, -10.5, -13.7, 2.6, 1.3, 0);
  addThing(room, -10.5, -11.6, { kind: 'project', slug: 'btb', label: 'On the screen: Break To Build', verb: 'Open' });
  // The campaign playbook: a pinboard of the four things every campaign has to do, each with a real example
  {
    const EX = { work: 't20', convert: 'trial', impress: 'money', brand: 'ring' };
    const W = 5.2;
    const H = 2.7;
    const tex = canvasTexture(2080, 1080, (c, w, h) => {
      c.fillStyle = '#c99a6a';
      c.fillRect(0, 0, w, h);
      for (let k = 0; k < 2400; k++) {
        c.fillStyle = k % 3 ? 'rgba(90,55,25,0.08)' : 'rgba(255,240,210,0.1)';
        c.fillRect((k * 197) % w, (k * 89) % h, 3, 3);
      }
      c.fillStyle = '#fffaf0';
      c.fillRect(60, 50, 980, 150);
      c.fillStyle = '#0f172a';
      c.textBaseline = 'top';
      c.font = `400 30px ${FONT.mono}`;
      c.fillText('HOW I CRACK A CAMPAIGN', 96, 74);
      fit(c, 'The campaign playbook', { weight: 800, size: 74, min: 40, maxW: 900 });
      c.fillText('The campaign playbook', 96, 112);
      const cw = (w - 120 - 3 * 36) / 4;
      LENSES.forEach((l, i) => {
        const x = 60 + i * (cw + 36);
        const y = 250;
        const ch = h - y - 60;
        c.save();
        c.translate(x + cw / 2, y + ch / 2);
        c.rotate((i % 2 ? 1 : -1) * 0.012);
        c.translate(-(x + cw / 2), -(y + ch / 2));
        c.fillStyle = 'rgba(0,0,0,0.18)';
        c.fillRect(x + 8, y + 10, cw, ch);
        c.fillStyle = '#fffaf0';
        c.fillRect(x, y, cw, ch);
        c.fillStyle = l.color;
        c.fillRect(x, y, cw, 16);
        c.fillStyle = '#c0392b';
        c.beginPath();
        c.arc(x + cw / 2, y + 40, 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#0f172a';
        fit(c, l.name, { weight: 800, size: 52, min: 30, maxW: cw - 56 });
        c.fillText(l.name, x + 28, y + 70);
        c.fillStyle = '#475569';
        c.font = `500 30px ${FONT.sans}`;
        let yy = y + 140;
        for (const line of wrap(c, l.ask, cw - 56, 3)) {
          c.fillText(line, x + 28, yy);
          yy += 40;
        }
        yy += 26;
        const slug = EX[l.id];
        c.fillStyle = l.color;
        c.font = `500 26px ${FONT.mono}`;
        fit(c, PROJECTS[slug].title.toUpperCase(), { weight: 500, size: 26, min: 16, family: FONT.mono, maxW: cw - 56 });
        c.fillText(PROJECTS[slug].title.toUpperCase(), x + 28, yy);
        yy += 44;
        c.fillStyle = '#0f172a';
        c.font = `700 34px ${FONT.sans}`;
        for (const line of wrap(c, PLAYS[slug].lenses[l.id], cw - 56, 5)) {
          c.fillText(line, x + 28, yy);
          yy += 44;
        }
        c.restore();
      });
    });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25 }));
    board.position.set(-15.9, 2.6, -7.2);
    board.rotation.y = Math.PI / 2;
    board.userData = { dynamic: true, action: { kind: 'playbook' } };
    g.add(board, mesh(new THREE.BoxGeometry(0.08, H + 0.2, W + 0.2), WOOD, -15.96, 2.6, -7.2, false));
    room.clickables.push(board);
    addThing(room, -14.3, -7.2, { kind: 'playbook', label: 'The campaign playbook', verb: 'Read' });
  }

  // the mentoring corner: two chairs and a mentee
  rug(room, -7.6, -1.2, 3.4, 2.6, ['#e8c27a', '#b5523b', OLIVE]);
  armchair(room, -8.8, -1.0, Math.PI / 2, { color: '#e8c27a' });
  armchair(room, -6.4, -1.0, -Math.PI / 2, { color: '#e8c27a' });
  coffeeTable(room, -7.6, -1.0, 0, { w: 0.7, round: true, top: '#7a5232' });
  addNpc(room, makePerson({ seed: r(), style: 'hoodie', accent: '#7b5cff' }), -6.5, -1.0, -Math.PI / 2, 'sit', 'home', { y: 0.02, lines: ['Thank you for the session! Could you also look at my case study?', 'Your workshop is why I started using AI in my work.'], name: 'Mentee' });
  const adp = plate(2.2, 1.2, (c, w, h) => {
    c.fillStyle = '#3b2a1c';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd84a';
    c.font = `800 ${h * 0.26}px ${FONT.display}`;
    c.fillText(`${PROJECTS.mentor.metrics[0][0]} sessions`, 24, h * 0.42);
    c.fillStyle = '#ffffff';
    c.font = `500 ${h * 0.13}px ${FONT.sans}`;
    c.fillText('One-to-one mentoring on ADPList', 24, h * 0.68);
  });
  adp.position.set(-4.18, 2.4, -1.0);
  adp.rotation.y = -Math.PI / 2;
  g.add(adp);
  clickable(room, adp, { kind: 'project', slug: 'mentor' });
  addThing(room, -7.6, 0.6, { kind: 'project', slug: 'mentor', label: 'Mentoring corner', verb: 'Open' });
  plant(room, -15.2, -14.2, { s: 1.2, pot: SAND });
  plant(room, -4.9, -14.2, { s: 0.9, pot: SAND });

  // ===== Career library =====
  // the portrait and the path, on the library's back wall and along its side
  const portrait = framed(room, 1, 2.6, -D / 2 + 0.06, 0, 2.4, 2.4, screenMat(OWNER.portrait, 1), { frame: '#7a5232', border: 0.1 });
  clickable(room, portrait.pic, { kind: 'hire' });
  addThing(room, 1, -12.6, { kind: 'hire', label: 'Vibhor’s story', verb: 'Read' });
  const frames = [
    ['2010 – 14', 'GEC Bikaner', 'B.Tech, Computer Engineering. Self-taught designer on the side.'],
    ['2015 – 21', 'Grofers (Blinkit)', 'Associate Director, Marketing Design. Built the creative team.'],
    ['2021 – now', 'Razorpay', 'Communication Design Senior Manager across Payments, RazorpayX, POS.'],
    ['How I lead', 'Notes', 'Widen the toolkit. Measurable goals. Room to take risks. Design for the business.'],
  ];
  frames.forEach(([years, org, text], k) => {
    const z = [-12.8, -9.6, -2.4, 0.6][k];
    const f = plate(2.2, 1.7, (c, w, h) => {
      c.fillStyle = '#fffaf2';
      c.fillRect(0, 0, w, h);
      c.fillStyle = C;
      c.fillRect(0, 0, w, 10);
      c.font = `700 ${h * 0.09}px ${FONT.sans}`;
      c.fillText(years, 26, h * 0.2);
      c.fillStyle = '#1d1814';
      fit(c, org, { weight: 800, size: h * 0.13, min: h * 0.09, family: FONT.display, maxW: w - 52 });
      c.fillText(org, 26, h * 0.38);
      c.fillStyle = '#4a3f36';
      c.font = `500 ${h * 0.075}px ${FONT.sans}`;
      wrap(c, text, w - 52, 4).forEach((l, i) => c.fillText(l, 26, h * 0.55 + i * h * 0.1));
    });
    f.position.set(-3.78, 2.4, z);
    f.rotation.y = Math.PI / 2;
    g.add(f, mesh(new THREE.BoxGeometry(0.05, 1.86, 2.36), WOOD, -3.815, 2.4, z, false));
    clickable(room, f, k === 3 ? { kind: 'leadership' } : { kind: 'hire' });
  });
  const shelfR = rng(77);
  for (const z of [-12.6, -9.6, -2.4, 0.6]) shelf(room, 5.6, z, -Math.PI / 2, { w: 2.6, h: 3.0, rows: 5, r: shelfR, wood: '#6b4a2c' });
  addThing(room, 4.2, -11, { kind: 'leadership', label: 'Leadership notes', verb: 'Read' });
  // the reading chair, a lamp and a side table: Nikita reads here too
  rug(room, 1.0, -8.6, 3.6, 3.0, ['#2f5b4a', '#e8c27a', '#b5523b']);
  armchair(room, 2.2, -9.4, -Math.PI / 2 + 0.5, { color: OLIVE });
  floorLamp(room, 3.4, -10.6, { color: '#ffe2b0', stem: BRASS });
  coffeeTable(room, 0.6, -8.0, 0, { w: 0.6, round: true, top: '#7a5232' });

  // ===== Personal collection =====
  // the trophy cabinet: the four you find out on the island appear here
  const cab = new THREE.Group();
  cab.position.set(15.4, 0, -6.4);
  cab.rotation.y = -Math.PI / 2;
  cab.add(mesh(new THREE.BoxGeometry(3.6, 0.9, 0.9), solid('#7a5232'), 0, 0.45, 0));
  cab.add(mesh(new THREE.BoxGeometry(3.6, 1.8, 0.04), solid('#5a3b22'), 0, 1.8, -0.43, false));
  cab.add(mesh(new THREE.BoxGeometry(3.56, 1.78, 0.86), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false }), 0, 1.8, 0, false));
  for (const sx of [-1.78, -0.6, 0.6, 1.78]) cab.add(mesh(new THREE.BoxGeometry(0.05, 1.8, 0.05), BRASS_M, sx, 1.8, 0.43, false));
  cab.add(mesh(new THREE.BoxGeometry(3.6, 0.04, 0.86), solid('#5a3b22'), 0, 1.8, 0, false));
  cab.add(mesh(new THREE.BoxGeometry(3.7, 0.08, 1.0), BRASS_M, 0, 2.74, 0, false));
  const cups = [];
  const plaque = plate(3.4, 0.5, (c, w, h) => {
    c.fillStyle = '#3b2a1c';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd84a';
    c.font = `700 ${h * 0.45}px ${FONT.sans}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    fillFit(c, 'RECOGNITION · find all four on the island', w / 2, h / 2 + 2, w - 30);
  });
  plaque.position.set(0, 3.1, 0.02);
  cab.add(plaque);
  for (let k = 0; k < AWARDS.length; k++) {
    const cup = new THREE.Group();
    const pts = [[0, 0], [0.2, 0], [0.07, 0.08], [0.06, 0.32], [0.22, 0.45], [0.25, 0.72], [0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
    cup.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 20), GOLD));
    cup.position.set(-1.25 + k * 0.83, 0.95, 0.46);
    cup.visible = false;
    cup.userData.dynamic = true;
    cab.add(cup);
    cups.push(cup);
  }
  g.add(cab);
  addFootprint(room, 15.4, -6.4, 3.6, 0.9, -Math.PI / 2);
  addThing(room, 13.8, -6.4, { kind: 'awards', label: 'Trophy cabinet', verb: 'See recognition' });
  // photographs: on set and on stage
  OWNER.gallery.slice(0, 3).forEach((ph, k) => {
    const f = framed(room, 8.2 + k * 2.9, 2.6, -D / 2 + 0.06, 0, 2.5, 1.66, screenMat(ph.image, 1.5), { frame: '#2b2118', border: 0.06, mat: '#fbf6ee' });
    clickable(room, f.pic, { kind: 'toast', text: `<b>📷 ${ph.caption}</b>` });
  });
  addThing(room, 11, -12.4, { kind: 'hire', label: 'Photos: on set and on stage', verb: 'More about Vibhor' });
  // the writing desk with a typewriter: the contact form
  const wd = new THREE.Group();
  wd.position.set(9.6, 0, -1.2);
  wd.add(mesh(new THREE.BoxGeometry(2, 0.08, 1), solid('#7a5232'), 0, 0.9, 0));
  for (const [x, z] of [[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]]) wd.add(mesh(new THREE.BoxGeometry(0.07, 0.9, 0.07), DARK, x, 0.45, z));
  wd.add(mesh(new THREE.BoxGeometry(0.8, 0.22, 0.6), solid('#d64545', { roughness: 0.4, metalness: 0.3 }), 0, 1.05, 0));
  wd.add(mesh(new THREE.BoxGeometry(0.5, 0.4, 0.02), solid('#fffaf0'), 0, 1.33, -0.18));
  const note = plate(1.6, 0.5, (c, w, h) => {
    c.fillStyle = '#fffaf0';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#1d1814';
    c.font = `700 ${h * 0.38}px ${FONT.sans}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('✉️  Write to Vibhor', w / 2, h / 2 + 2);
  });
  note.position.set(0, 1.85, -0.45);
  wd.add(note);
  g.add(wd);
  clickable(room, note, { kind: 'contact' });
  addFootprint(room, 9.6, -1.2, 2.1, 1.1, 0);
  addThing(room, 9.6, 0.4, { kind: 'contact', label: 'Write to Vibhor', verb: 'Use the typewriter' });
  chair(room, 9.6, -0.2, Math.PI, { color: OLIVE });
  plant(room, 15.2, -14.2, { s: 1.2, pot: SAND });
  plant(room, 6.9, 2.2, { s: 0.9, pot: SAND });

  // ===== Nikita =====
  const nikita = makePerson({ seed: 0.31, fem: true, style: 'dress', hairStyle: 'bob', hair: '#1b1412', top: '#6b7a3a', accent: '#c9a24a', noBag: true });
  addNikita(room, nikita, {
    lines: [
      'Hi! I’m Nikita: product designer, from Jodhpur, and Vibhor’s wife.',
      'Shh, boss fight. Silksong does not pause for small talk.',
      'Hollow Knight first, now Silksong. One more bench, then I’m done. Probably.',
      'Jodhpur is the blue city, Jaipur the pink one. This house is a bit of both.',
      'As a product designer, I have notes on this game’s map UI. Good notes.',
    ],
    spots: [
      // on the sofa in the gaming lounge, controller in hand, facing the TV; the other seat is free
      { id: 'game', weight: 5, dur: [40, 75], pose: 'game', prop: 'controller', at: [-11.2, 11.0], sit: { x: -12.45, z: 11.0, rot: -Math.PI / 2, y: 0.02 }, watch: { x: -12.45, z: 12.2, rot: -Math.PI / 2, approach: [-11.1, 12.4] } },
      // the kitchen counter with a cup
      { id: 'kitchen', weight: 2, dur: [14, 22], pose: 'coffee', prop: 'cup', at: [14.6, 7.6], sit: { x: 14.75, z: 7.6, rot: Math.PI / 2 } },
      // the reading chair in the library
      { id: 'read', weight: 2.5, dur: [25, 45], pose: 'read', prop: 'book', at: [1.0, -9.0], sit: { x: 2.12, z: -9.36, rot: -Math.PI / 2 + 0.5, y: 0.02 } },
      // a look out of the living-room window by the plant
      { id: 'window', weight: 1, dur: [8, 14], pose: 'idle', prop: null, at: [6.2, 13.2], sit: { x: 6.2, z: 13.4, rot: 0.6 } },
    ],
  });

  room.cups = cups;
  return room;
}
