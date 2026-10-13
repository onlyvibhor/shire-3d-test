// The Hall of Fame: the Golden Gallery. One continuous interior of five connected rooms, opened to
// each other by scalloped Rajput arches:
//   A  Foyer — the HALL OF FAME lettering and a statement trophy, a host to greet you
//   B  Awards gallery — every 2026 award from AWARD_LIST in a lit niche, the team award on a plinth
//   C  Hero campaign gallery — Trial of the Century: the film, its stills, its numbers
//   D  Photography wall — the award nights, framed
//   E  Lounge — somewhere to sit
// Charcoal, champagne gold and ivory. Every label comes from the portfolio's own data.
import * as THREE from 'three';
import { AWARD_LIST, PROJECTS, PLAYS, OWNER, HALL } from '../data.js';
import { screenMat } from '../props.js';
import { solid, glow, mesh } from '../materials.js';
import { FONT, fit, wrap } from '../type.js';
import { giveProp } from '../characters.js';
import { rng } from '../world.js';
import {
  makeShell, partition, zone, addThing, addNpc, person, clickable, plate, lamp, sofa, armchair, coffeeTable, plant, floorLamp, rug, plinth, framed,
  bigScreen, niche, marbleTexture, floorPatch, pendant, faceTo,
} from './kit.js';

const CHARCOAL = '#2a2830';
const GOLD_C = '#d9b77a';
const IVORY = '#f3ecdf';
const CHAMPAGNE = new THREE.MeshPhysicalMaterial({ color: '#e2c48a', metalness: 0.7, roughness: 0.32, emissive: '#4a3514', emissiveIntensity: 0.3 });
const CASE_GLASS = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false });

function trophy(tier, scale = 1) {
  const mat = tier === 'gold'
    ? new THREE.MeshPhysicalMaterial({ color: '#f2c75c', metalness: 1, roughness: 0.18, emissive: '#5a3a00', emissiveIntensity: 0.3 })
    : new THREE.MeshPhysicalMaterial({ color: '#e6ebf2', metalness: 1, roughness: 0.15 });
  const g = new THREE.Group();
  const pts = [[0, 0], [0.32, 0], [0.32, 0.12], [0.1, 0.18], [0.07, 0.6], [0.14, 0.72], [0.36, 0.95], [0.4, 1.4], [0.34, 1.42], [0.18, 1.05], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 28), mat));
  for (const sx of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), mat);
    h.position.set(sx * 0.42, 1.15, 0);
    h.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(h);
  }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), mat);
  star.position.y = 1.62;
  g.add(star);
  g.scale.setScalar(scale);
  g.traverse((o) => {
    o.castShadow = true;
    o.userData.dynamic = true;
  });
  return g;
}

const awardText = (a) => `<b>🏆 ${a.show} ${a.year}</b><br>${a.title}: ${a.category}${a.project ? ` · for ${PROJECTS[a.project].title}` : ' · for the Razorpay Creative & Design Team'}`;

// the plaque under each award: show, result, category, and what it was for
function awardPlaque(a, w = 1.7, h = 0.9) {
  return plate(w, h, (c, cw, ch) => {
    c.fillStyle = '#16151a';
    c.fillRect(0, 0, cw, ch);
    c.strokeStyle = GOLD_C;
    c.lineWidth = 4;
    c.strokeRect(10, 10, cw - 20, ch - 20);
    const tone = a.tier === 'gold' ? '#f2d58c' : '#dfe5ec';
    c.fillStyle = tone;
    c.font = `600 ${ch * 0.1}px ${FONT.mono}`;
    c.fillText(`${a.show.toUpperCase()} · ${a.year}`, 30, ch * 0.22);
    c.fillStyle = '#ffffff';
    fit(c, a.title, { weight: 800, size: ch * 0.22, min: ch * 0.14, family: FONT.display, maxW: cw - 60 });
    c.fillText(a.title, 30, ch * 0.47);
    c.fillStyle = '#d8d0c0';
    c.font = `500 ${ch * 0.1}px ${FONT.sans}`;
    wrap(c, a.category, cw - 60, 2).forEach((l, k) => c.fillText(l, 30, ch * 0.64 + k * ch * 0.12));
    c.fillStyle = tone;
    fit(c, a.project ? `for ${PROJECTS[a.project].title}` : 'for the Creative & Design Team', { weight: 600, size: ch * 0.095, min: ch * 0.07, family: FONT.sans, maxW: cw - 60 });
    c.fillText(a.project ? `for ${PROJECTS[a.project].title}` : 'for the Creative & Design Team', 30, ch * 0.9);
  }, { res: 300 });
}

export function buildHall(origin) {
  const W = 34;
  const D = 40;
  const marble = marbleTexture(IVORY, 'rgba(150,130,100,0.22)');
  marble.repeat.set(7, 8);
  const room = makeShell({
    id: 'awards',
    origin,
    w: W,
    d: D,
    h: 9,
    floor: new THREE.MeshPhysicalMaterial({ map: marble, roughness: 0.2, clearcoat: 0.8 }),
    wall: new THREE.MeshStandardMaterial({ color: CHARCOAL, roughness: 0.75 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#141317', roughness: 1 }),
    trim: CHAMPAGNE,
    doorColor: '#fff3d6',
  });
  const g = room.group;
  const r = rng(904);
  const WALL = new THREE.MeshStandardMaterial({ color: '#3a3640', roughness: 0.7 });
  const PH = 7; // partition height: the ceiling floats above, so the rooms read as one hall

  // ----- the plan -----
  const sg = (t) => ({ signColor: '#f2d58c', signs: t });
  partition(room, { axis: 'z', at: -7, from: 8, to: 20, h: PH, mat: WALL, trim: CHAMPAGNE, openings: [{ at: 14, w: 3.2, ...sg({ pos: 'Lounge' }) }] });
  partition(room, { axis: 'z', at: 7, from: 8, to: 20, h: PH, mat: WALL, trim: CHAMPAGNE, openings: [{ at: 14, w: 3.2, ...sg({ neg: 'Photography wall' }) }] });
  partition(room, { axis: 'x', at: 8, from: -17, to: 17, h: PH, mat: WALL, trim: CHAMPAGNE, openings: [{ at: 0, w: 4.4 }, { at: -12, w: 3 }, { at: 12, w: 3 }] });
  partition(room, { axis: 'x', at: -6, from: -17, to: 17, h: PH, mat: WALL, trim: CHAMPAGNE, openings: [{ at: 0, w: 6, ...sg({ pos: 'Trial of the Century' }) }, { at: -12, w: 3 }, { at: 12, w: 3 }] });
  zone(room, 'foyer', 'Foyer', -7, 8, 7, 20, [0, 16.5], 'The statement trophy');
  zone(room, 'lounge', 'Lounge', -17, 8, -7, 20, [-12, 13], 'Sit for a while');
  zone(room, 'photos', 'Photography wall', 7, 8, 17, 20, [12, 13], 'The award nights');
  zone(room, 'gallery', 'Awards gallery', -17, -6, 17, 8, [0, 3], `${AWARD_LIST.length} awards, 2026`);
  zone(room, 'hero', 'Trial of the Century', -17, -20, 17, -6, [0, -10], 'The award-winning campaign');

  // floors: a charcoal runner from the door to the hero screen, ivory marble either side
  const runner = solid('#2a2630', { roughness: 1 });
  floorPatch(room, 0, 5, 3.2, 30, runner);
  for (const x of [-1.7, 1.7]) floorPatch(room, x, 5, 0.1, 30, CHAMPAGNE, 0.016);

  // champagne bands along the outer walls
  for (const y of [1.0, 7.6]) {
    for (const [x, z, len, ry] of [[0, -D / 2 + 0.04, W, 0], [-W / 2 + 0.04, 0, D, Math.PI / 2], [W / 2 - 0.04, 0, D, Math.PI / 2]]) {
      const band = mesh(new THREE.BoxGeometry(len, 0.08, 0.04), CHAMPAGNE, x, y, z, false);
      band.rotation.y = ry;
      g.add(band);
    }
  }

  // ===== A: the foyer =====
  // HALL OF FAME in gold over the grand arch, facing the door
  const title = plate(11, 1.5, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const grad = c.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#c99a4a');
    grad.addColorStop(0.5, '#fff0c8');
    grad.addColorStop(1, '#c99a4a');
    c.fillStyle = grad;
    c.font = `800 ${h * 0.56}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.letterSpacing = `${h * 0.06}px`;
    c.fillText('HALL OF FAME', w / 2, h * 0.4);
    c.letterSpacing = '0px';
    c.fillStyle = '#d8d0c0';
    c.font = `500 ${h * 0.15}px ${FONT.sans}`;
    c.fillText(`${AWARD_LIST.length} awards in 2026, for the work and for the team`, w / 2, h * 0.86);
  }, { transparent: true, res: 200 });
  title.position.set(0, 6.15, 8.18);
  g.add(title);
  // the statement trophy: a tall gold cup on a stepped plinth, lit from above
  plinth(room, 0, 13.5, { w: 1.6, h: 0.5, color: '#2a2630', top: CHAMPAGNE, collide: false });
  plinth(room, 0, 13.5, { w: 1.1, h: 1.25, color: '#1f1d24', top: CHAMPAGNE });
  const hero = trophy('gold', 1.5);
  hero.position.set(0, 1.28, 13.5);
  g.add(hero);
  room.updaters.push({ update: (t) => (hero.rotation.y = t * 0.3) });
  pendant(room, 0, 13.5, 5.6, { color: '#fff1cf', shade: GOLD_C, r: 0.45 });
  lamp(room, 0, 5, 13.5, '#ffe8bd', 9, 10);
  addThing(room, 0, 15.2, { kind: 'place', id: 'awards', label: 'The Hall of Fame', verb: 'About the hall' });
  // the host
  addNpc(room, person({ seed: r(), style: 'blazer', accent: GOLD_C, top: '#1f1d24' }), 2.6, 16.2, faceTo(2.6, 16.2, 0, 19), 'talk', 'awards', { lines: HALL.quotes, name: 'Hall host' });
  for (const sx of [-1, 1]) plant(room, sx * 5.6, 18.6, { s: 1.2, pot: '#2a2630', leaf: '#3f6e3a' });

  // ===== B: the awards gallery =====
  // the walls between niches are clad in a deep panel, so each niche reads as cut into the wall
  const clad = new THREE.MeshStandardMaterial({ color: '#2a2730', roughness: 0.6 });
  const shows = [AWARD_LIST.filter((a) => a.show === 'Shorty Awards'), AWARD_LIST.filter((a) => a.show !== 'Shorty Awards' && a.project)];
  const team = AWARD_LIST.find((a) => !a.project);
  [-1, 1].forEach((side, s) => {
    const list = shows[s];
    const wallX = side * (W / 2);
    const faceX = wallX - side * 0.5; // the niches' front
    const span = 12.6;
    const step = span / list.length;
    const zs = list.map((_, k) => 6.6 - step * (k + 0.5) - 0.3);
    // cladding: one deep panel along the wall with the niches in it
    g.add(mesh(new THREE.BoxGeometry(0.5, 4.4, span + 0.4), clad, wallX - side * 0.25, 2.2, 0.6, false));
    g.add(mesh(new THREE.BoxGeometry(0.62, 0.1, span + 0.5), CHAMPAGNE, wallX - side * 0.29, 4.45, 0.6, false));
    room.colliders.push({ x: room.origin.x + wallX - side * 0.25, z: room.origin.z + 0.6, r: 0, box: { minX: room.origin.x + Math.min(wallX, wallX - side * 0.5), maxX: room.origin.x + Math.max(wallX, wallX - side * 0.5), minZ: room.origin.z + 0.6 - span / 2 - 0.2, maxZ: room.origin.z + 0.6 + span / 2 + 0.2 } });
    // the show's name above its awards
    const head = plate(6, 0.62, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#f2d58c';
      c.font = `700 ${h * 0.5}px ${FONT.display}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(s === 0 ? 'THE SHORTY AWARDS · 2026' : 'KYOORIUS · ET BRAND DISRUPTION · 2026', w / 2, h / 2);
    }, { transparent: true });
    head.position.set(faceX - side * 0.02, 5.1, 0.6);
    head.rotation.y = -side * Math.PI / 2;
    g.add(head);
    list.forEach((a, k) => {
      const z = zs[k];
      niche(room, faceX + side * 0.01, z, -side * Math.PI / 2, { w: 1.5, h: 2.0, y: 1.6, depth: 0.42, frame: CHAMPAGNE, back: '#2f2a24' });
      const tr = trophy(a.tier, 0.85);
      tr.position.set(wallX - side * 0.28, 1.66, z);
      g.add(tr);
      room.updaters.push({ update: (t) => (tr.rotation.y = t * 0.45 + k) });
      const pq = awardPlaque(a);
      pq.position.set(faceX - side * 0.015, 0.95, z);
      pq.rotation.y = -side * Math.PI / 2;
      g.add(pq);
      clickable(room, pq, { kind: 'project', slug: a.project });
      addThing(room, faceX - side * 1.3, z, { kind: 'project', slug: a.project, label: `${a.show}: ${a.title}, ${a.category}`, verb: 'See the winning work' });
    });
    lamp(room, faceX - side * 3, 5.5, 1, '#ffe8bd', 7, 11);
  });
  // the team award, on a plinth in a glass case in the middle of the gallery
  plinth(room, 0, 1, { w: 1.3, h: 1.1, color: '#1f1d24', top: CHAMPAGNE });
  const teamCup = trophy('gold', 1.0);
  teamCup.position.set(0, 1.13, 1);
  g.add(teamCup);
  g.add(mesh(new THREE.BoxGeometry(1.2, 1.9, 1.2), CASE_GLASS, 0, 2.08, 1, false));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(mesh(new THREE.BoxGeometry(0.03, 1.9, 0.03), CHAMPAGNE, sx * 0.6, 2.08, 1 + sz * 0.6, false));
  g.add(mesh(new THREE.BoxGeometry(1.26, 0.04, 1.26), CHAMPAGNE, 0, 3.04, 1, false));
  room.updaters.push({ update: (t) => (teamCup.rotation.y = -t * 0.35) });
  for (const sz of [1, -1]) {
    const pq = awardPlaque(team, 1.5, 0.8);
    pq.position.set(0, 0.6, 1 + sz * 0.67);
    pq.rotation.y = sz > 0 ? 0 : Math.PI;
    g.add(pq);
    clickable(room, pq, { kind: 'toast', text: awardText(team) });
  }
  addThing(room, 0, 2.9, { kind: 'toast', text: awardText(team), label: `${team.show}: ${team.title}, ${team.category}`, verb: 'Read' });
  pendant(room, 0, 1, 5.2, { color: '#fff1cf', shade: GOLD_C, r: 0.35 });
  // viewers
  addNpc(room, person({ seed: r(), style: 'dress', accent: GOLD_C }), -11.6, 3.4, faceTo(-11.6, 3.4, -17, 3.4), 'think', 'awards');
  addNpc(room, person({ seed: r(), style: 'kurta', accent: GOLD_C }), 12.2, -1.6, faceTo(12.2, -1.6, 17, -1.6), 'think', 'awards');
  // benches down the middle, facing each wall
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.6, 0.45, 2.6), solid('#2a2630', { roughness: 0.9 }), sx * 6, 0.225, 1));
    g.add(mesh(new THREE.BoxGeometry(0.64, 0.05, 2.64), CHAMPAGNE, sx * 6, 0.47, 1, false));
    room.colliders.push({ x: 0, z: 0, r: 0, box: { minX: room.origin.x + sx * 6 - 0.32, maxX: room.origin.x + sx * 6 + 0.32, minZ: room.origin.z - 0.3, maxZ: room.origin.z + 2.3 } });
  }

  // ===== C: the hero campaign gallery: Trial of the Century =====
  const P = PROJECTS.trial;
  const film = bigScreen(room, 0, 3.9, -D / 2 + 0.12, 0, 11.2, 6.3, screenMat(P.images[0], 16 / 9));
  clickable(room, film.screen, { kind: 'project', slug: 'trial' });
  g.add(mesh(new THREE.BoxGeometry(11.9, 7.0, 0.06), CHAMPAGNE, 0, 3.9, -D / 2 + 0.05, false));
  // a low stage under the screen
  g.add(mesh(new THREE.BoxGeometry(13, 0.35, 2.2), solid('#25232a'), 0, 0.175, -D / 2 + 1.1));
  g.add(mesh(new THREE.BoxGeometry(13.04, 0.04, 0.06), CHAMPAGNE, 0, 0.35, -D / 2 + 2.2, false));
  room.colliders.push({ x: 0, z: 0, r: 0, box: { minX: room.origin.x - 6.5, maxX: room.origin.x + 6.5, minZ: room.origin.z - D / 2, maxZ: room.origin.z - D / 2 + 2.2 } });
  addThing(room, 0, -14.6, { kind: 'project', slug: 'trial', label: 'Trial of the Century: the award-winning campaign', verb: 'Open case study' });
  // the campaign's stills, framed down both side walls
  P.images.forEach((src, k) => {
    const side = k % 2 ? 1 : -1;
    const z = -9.2 - Math.floor(k / 2) * 5.2 - (side > 0 ? 2.6 : 0);
    const f = framed(room, side * (W / 2 - 0.08), 3.4, z, -side * Math.PI / 2, 3.6, 2.03, screenMat(src, 16 / 9), { frame: CHAMPAGNE, border: 0.1 });
    clickable(room, f.pic, { kind: 'project', slug: 'trial' });
  });
  // the story and the numbers, on two tall panels either side of the screen
  const play = PLAYS.trial;
  const panel = (lines, x) => {
    const p = plate(3.4, 4.4, (c, w, h) => {
      c.fillStyle = '#16151a';
      c.fillRect(0, 0, w, h);
      c.fillStyle = GOLD_C;
      c.fillRect(0, 0, w, 8);
      let y = 70;
      for (const [kind, text] of lines) {
        if (kind === 'kicker') {
          c.fillStyle = '#f2d58c';
          c.font = `600 30px ${FONT.mono}`;
          c.fillText(text, 48, y);
          y += 50;
        } else if (kind === 'big') {
          c.fillStyle = '#ffffff';
          fit(c, text[0], { weight: 800, size: 92, min: 50, family: FONT.display, maxW: w - 96 });
          c.fillText(text[0], 48, y + 64);
          c.fillStyle = '#d8d0c0';
          c.font = `500 32px ${FONT.sans}`;
          c.fillText(text[1], 48, y + 110);
          y += 160;
        } else {
          c.fillStyle = kind === 'title' ? '#ffffff' : '#d8d0c0';
          c.font = kind === 'title' ? `800 56px ${FONT.display}` : `500 34px ${FONT.sans}`;
          for (const l of wrap(c, text, w - 96, 8)) {
            c.fillText(l, 48, y);
            y += kind === 'title' ? 66 : 46;
          }
          y += 20;
        }
      }
    }, { res: 256 });
    p.position.set(x, 3.4, -D / 2 + 0.14);
    g.add(p);
    clickable(room, p, { kind: 'project', slug: 'trial' });
  };
  panel([['kicker', `${P.client.toUpperCase()} · ${P.year}`], ['title', P.title], ['text', play.idea], ['text', play.craft]], -10.6);
  panel([['kicker', 'WHAT IT DID'], ...P.metrics.map((m) => ['big', m])], 10.6);
  // two rows of seats facing the film, and a seated guest
  for (const z of [-11.6, -9.4]) for (const x of [-3.2, 3.2]) sofa(room, x, z, Math.PI, { w: 2.8, color: '#3a2f3f', cushion: '#4a3b50', legs: '#c9a24a' });
  addNpc(room, person({ seed: r(), style: 'blazer', accent: GOLD_C }), 3.9, -11.55, Math.PI, 'sit', 'awards', { y: 0.02 });
  lamp(room, 0, 6, -14, '#ffe2b0', 6, 12);

  // ===== D: the photography wall =====
  const nights = OWNER.gallery.slice(0, 6);
  nights.forEach((ph, k) => {
    // three on the side wall, three on the front wall's inner face
    const onSide = k < 3;
    const x = onSide ? W / 2 - 0.06 : 9.4 + (k - 3) * 2.5;
    const z = onSide ? 17.5 - k * 3.4 : D / 2 - 0.06;
    const ry = onSide ? -Math.PI / 2 : Math.PI;
    const f = framed(room, x, 3.0, z, ry, k < 3 ? 2.8 : 2.0, k < 3 ? 1.9 : 1.4, screenMat(ph.image, 1.5), { frame: '#1a1814', border: 0.06, mat: IVORY });
    f.pic.userData.dynamic = true;
    const cap = plate(k < 3 ? 2.8 : 2.0, 0.28, (c, w, h) => {
      c.fillStyle = CHARCOAL;
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#d8d0c0';
      c.font = `500 ${h * 0.5}px ${FONT.sans}`;
      c.textBaseline = 'middle';
      c.fillText(ph.caption, 12, h / 2 + 1);
    });
    cap.position.copy(f.group.position).add(new THREE.Vector3(onSide ? -0.04 : 0, k < 3 ? -1.25 : -1.0, onSide ? 0 : -0.04));
    cap.rotation.y = ry;
    g.add(cap);
    clickable(room, f.pic, { kind: 'toast', text: `<b>📷 ${ph.caption}</b>` });
  });
  addThing(room, 13.5, 14, { kind: 'hire', label: 'Photographs: the award nights and the stage', verb: 'More about Vibhor' });
  const photographer = person({ seed: r(), style: 'streetwear', accent: GOLD_C });
  giveProp(photographer, 'camera');
  addNpc(room, photographer, 11.2, 12.2, faceTo(11.2, 12.2, 17, 14), 'camera', 'awards', { name: 'Photographer', lines: ['Hold still. The light on that frame is perfect.', 'Those frames are from the award nights. The stage one is my favourite.'] });
  plant(room, 8.2, 19, { s: 1.1, pot: '#2a2630' });
  lamp(room, 12, 5, 14, '#fff1d8', 5, 9);

  // ===== E: the lounge =====
  rug(room, -12, 14, 6.4, 5, ['#2a2630', GOLD_C, '#4a3b50']);
  sofa(room, -12, 16.6, Math.PI, { w: 3.2, color: '#4a3b50', cushion: '#5b4a62', legs: '#c9a24a' });
  armchair(room, -15, 13.4, Math.PI / 2, { color: '#c9a24a' });
  armchair(room, -9, 13.4, -Math.PI / 2, { color: '#c9a24a' });
  coffeeTable(room, -12, 14.2, 0, { w: 1.6, round: true, top: '#2a2630', legs: '#c9a24a' });
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.28, 10), glow('#fff1cf', 1.2), -11.8, 0.6, 14.2, false));
  floorLamp(room, -16, 18.6, { color: '#ffe2a8', stem: '#c9a24a' });
  plant(room, -16, 9.2, { s: 1.1, pot: '#2a2630' });
  addNpc(room, person({ seed: r(), style: 'dress', accent: GOLD_C }), -9.4, 15.6, faceTo(-9.4, 15.6, -12, 14.2), 'coffee', 'awards', { name: 'Guest', lines: ['I came for the film and stayed for the trophies.', 'Have you seen the courtroom on the big screen? Through the arches, at the back.'] });
  addThing(room, -12, 12.4, { kind: 'toast', label: 'The lounge', verb: 'Sit for a while', text: '<b>🛋️ The lounge.</b> Take a seat. The awards gallery is through the arch.' });

  return room;
}
