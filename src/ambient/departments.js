// The departments at work: a production scene in each arena, built in the arena's own frame
// (the gateway is at +z, the plaza is the 9.3 m circle round the origin, the work is round the
// back half). Everything here is background activity: nobody to talk to, nothing to click,
// nothing that stops you walking round it.
import * as THREE from 'three';
import { makePerson, giveProp } from '../characters.js';
import { mesh, solid, glow, canvasTexture, lightPool, mergeStatic, WHITE_METAL, BRUSHED, CHROME, WOOD, DARK } from '../materials.js';
import { FONT, fitWrap } from '../type.js';
import { PROJECTS, PLAYS, CAMPAIGNS } from '../data.js';
import { createScene } from './scene.js';
import { makePlaylistScreen, feedPost, feedOverlay } from './media.js';
import * as K from './props.js';
import './poses.js';

const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const place = (parent, o, x, z, rot = 0, y = 0) => {
  o.position.set(x, y, z);
  o.rotation.y = rot;
  parent.add(o);
  return o;
};
// the same playlist screen material shown on a second, smaller display (a mirror of the output)
const mirrorMat = (screen) => new THREE.MeshBasicMaterial({ map: screen.mesh.material.map, toneMapped: false });

// Bake a set's still equipment into as few meshes as possible: every static piece (not inside
// anything that moves) is lifted out of its little prop group into the set and merged by material,
// so a stand made of six parts costs one draw call shared with every other stand. Things that move
// are marked userData.dynamic and keep their own meshes. Called before the crew arrive.
function bake(S) {
  S.updateMatrixWorld(true);
  const still = [];
  S.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.dynamic || o.userData.noFit || Array.isArray(o.material)) return;
    for (let q = o.parent; q && q !== S; q = q.parent) if (q.userData.dynamic) return;
    still.push(o);
  });
  for (const m of still) S.attach(m);
  mergeStatic(S);
}

function crew(r, accent, opts = {}) {
  return makePerson({ accent, seed: r(), ...opts });
}

// ===================================================================================
// SOCIAL · The reel studio
// Creators dancing a reel for a phone on a tripod between two ring lights, a camera operator, a
// director, a stylist with a make-up station, the social lead at the output monitor, and behind
// it all a giant vertical screen scrolling through real posts from the department's work.
// ===================================================================================
const FEED = [
  { src: 'work/social-1.jpg', caption: 'Backing India’s Start-Up Champions', sub: 'Razorpay', year: 'T20 World Cup · 2026', color: '#1a4fd6' },
  { src: 'work/bh/emotions-stickers-4.jpg', caption: 'Emotions of Women (Grocery Saga)', sub: 'Grofers', year: 'Sticker designs · 2022', color: '#f2a516' },
  { src: 'behance/winter-foods/6.jpg', caption: 'Winter Foods', sub: 'Grofers', year: 'Knitted in wool, shot in stop motion · 2020', color: '#3f7a4c' },
  { src: 'assets/vid/lab/power-love-sq.mp4', kind: 'video', caption: 'Power', sub: 'Found-object art', year: 'Everyday electrical accessories · 2021', color: '#e8503a', hold: 8 },
  { src: 'work/bh/rakhi-1.jpg', caption: 'Grofers Rakhi Campaign', sub: 'Grofers', year: 'Social · 2018', color: '#d6336c', fit: 'contain' },
  { src: 'work/bh/emotions-stickers-10.jpg', caption: 'Emotions of Women (Grocery Saga)', sub: 'Grofers', year: 'Sticker designs · 2022', color: '#f2a516' },
  { src: 'work/bh/love-story-1.jpg', caption: 'Love Story', sub: 'Grofers', year: 'Valentine’s Day · 2019', color: '#e8505b', fit: 'contain' },
  { src: 'assets/vid/lab/eyes-03.mp4', kind: 'video', caption: 'Eyes', sub: 'Digital collage', year: 'An emotion diary · 2021', color: '#7b5cff', hold: 8 },
  { src: 'behance/winter-foods/3.jpg', caption: 'Winter Foods', sub: 'Grofers', year: '#SardiyonKaSwad · 2020', color: '#3f7a4c' },
  { src: 'work/bh/diwali-2020-1.jpg', caption: 'Ek Diye Se Do Ghar Roshan', sub: 'Grofers', year: 'Diwali · 2020', color: '#c2410c', fit: 'contain' },
  { src: 'work/bh/emotions-stickers-12.jpg', caption: 'Emotions of Women (Grocery Saga)', sub: 'Grofers', year: 'Sticker designs · 2022', color: '#f2a516' },
];

export function buildSocialStudio(g, { color, collider, r, playerPos, updaters }) {
  const S = new THREE.Group();
  S.name = 'scene:social';
  g.add(S);

  // ---- the giant vertical screen: a 9:16 feed in a white enclosure, on a plinth ----
  const feed = makePlaylistScreen({ w: 3.15, h: 5.6, px: 576, items: FEED, mode: 'scroll', hold: 6, trans: 1.0, draw: feedPost, overlay: feedOverlay(color), bg: '#ffffff' });
  const tower = new THREE.Group();
  place(S, tower, 0, -9.7, 0);
  const base = 1.25;
  tower.add(mesh(new THREE.BoxGeometry(4.3, 0.42, 1.5), WHITE_METAL, 0, 0.21, 0));
  tower.add(mesh(new THREE.BoxGeometry(3.95, 0.12, 1.25), solid(color, { roughness: 0.5 }), 0, 0.48, 0));
  for (const sx of [-1, 1]) tower.add(mesh(new THREE.BoxGeometry(0.36, base + 5.9, 0.62), WHITE_METAL, sx * 1.86, (base + 5.9) / 2, -0.05));
  tower.add(mesh(new THREE.BoxGeometry(3.7, 6.05, 0.26), solid('#f4f5f7', { metalness: 0.3, roughness: 0.35 }), 0, base + 2.9, -0.2));
  tower.add(mesh(new THREE.BoxGeometry(4.1, 0.28, 0.7), WHITE_METAL, 0, base + 6.0, -0.05));
  // a fine pink light line round the screen, and the department's glyph on the crown
  const edge = glow(color, 1.6);
  for (const sx of [-1, 1]) tower.add(mesh(new THREE.BoxGeometry(0.035, 5.75, 0.04), edge, sx * 1.64, base + 2.85, -0.04, false));
  for (const y of [base + 0.0, base + 5.72]) tower.add(mesh(new THREE.BoxGeometry(3.32, 0.035, 0.04), edge, 0, y, -0.04, false));
  feed.mesh.position.set(0, base + 2.86, -0.055);
  tower.add(feed.mesh);
  const heart = new THREE.Shape();
  heart.moveTo(0, -0.18);
  heart.bezierCurveTo(-0.32, 0.02, -0.18, 0.28, 0, 0.12);
  heart.bezierCurveTo(0.18, 0.28, 0.32, 0.02, 0, -0.18);
  const hm = mesh(new THREE.ExtrudeGeometry(heart, { depth: 0.06, bevelEnabled: false }), glow(color, 2), 0, base + 6.42, 0, false);
  hm.userData.dynamic = true;
  tower.add(hm);
  for (const x of [-1.4, 0, 1.4]) collider(S, 0.9, x, -9.7);

  // ---- the set: two creators on their marks, lights and the phone in front ----
  const markZ = -4.6;
  // a taped floor mark and a soft pink circle the dancers stay inside
  const markTex = canvasTexture(256, 256, (c, w) => {
    c.strokeStyle = 'rgba(255,79,139,0.85)';
    c.lineWidth = 6;
    c.setLineDash([18, 12]);
    c.beginPath();
    c.arc(w / 2, w / 2, w / 2 - 8, 0, Math.PI * 2);
    c.stroke();
  });
  const markDisc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshBasicMaterial({ map: markTex, transparent: true, depthWrite: false }));
  markDisc.rotation.x = -Math.PI / 2;
  markDisc.position.set(0.1, 0.02, markZ);
  S.add(markDisc);
  // the phone on its tripod, between two ring lights, all aimed at the marks
  const phone = place(S, K.phoneRig(mirrorMat(feed), 1.42), 0.1, -1.55, Math.PI);
  const tally = mesh(new THREE.SphereGeometry(0.018, 8, 6), K.M.tally, 0, 0.21, 0.0, false);
  tally.userData.dynamic = true;
  phone.userData.head.add(tally);
  phone.userData.head.userData.dynamic = true;
  for (const sx of [-1, 1]) {
    const x = sx * 1.35;
    const rl = place(S, K.ringLight(1.62, { r: 0.26, phone: false }), x, -1.95, face(x, -1.95, 0.1, markZ));
    rl.add(K.sandbag().translateZ(-0.05));
    collider(S, 0.38, x, -1.95);
  }
  collider(S, 0.42, 0.1, -1.55);
  // a hair light behind the creators, a reflector filling from the right, a spare tripod
  place(S, K.ledPanel(0.55, 0.3, 1.9), -2.3, -7.4, face(-2.3, -7.4, 0, markZ));
  collider(S, 0.4, -2.3, -7.4);
  place(S, K.reflector(0.42, 1.0), 2.3, -6.9, face(2.3, -6.9, 0, markZ));
  collider(S, 0.4, 2.3, -6.9);
  const spare = place(S, K.tripod(1.1, { spread: 0.05 }), 3.85, -5.55, 0.3);
  spare.rotation.z = 0.04;
  // kit: a cart, a battery case, cable along the edge of the set
  place(S, K.cart(0.86, 0.48, 0.86), 3.7, -6.7, -0.4);
  collider(S, 0.6, 3.7, -6.7);
  place(S, K.hardCase(0.5, 0.26, 0.34), 3.05, -7.7, 0.2);
  place(S, K.cableCoil(0.2), 1.0, -7.3);
  S.add(K.cableRun([[0.1, -1.55], [0.9, -2.6], [2.0, -6.0], [3.4, -6.6]]));
  // make-up station: a folding table, a mirror ringed with bulbs, a stool
  const mk = new THREE.Group();
  place(S, mk, -3.75, -4.7, face(-3.75, -4.7, 0, -4.7) + Math.PI);
  mk.add(K.table(1.0, 0.5, 0.76));
  mk.add(mesh(new THREE.BoxGeometry(0.62, 0.5, 0.03), K.M.black, 0, 1.05, -0.2));
  mk.add(mesh(new THREE.PlaneGeometry(0.54, 0.42), solid('#cfd7df', { metalness: 1, roughness: 0.08 }), 0, 1.05, -0.183, false));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    mk.add(mesh(new THREE.SphereGeometry(0.022, 6, 4), K.M.led, Math.cos(a) * 0.33, 1.05 + Math.sin(a) * 0.27, -0.17, false));
  }
  for (const [x, c] of [[-0.3, '#e8505b'], [-0.2, '#f2a516'], [0.25, '#2c3037']]) mk.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8), solid(c), x, 0.8, 0.05, false));
  mk.add(K.stool(0.5).translateZ(0.55));
  collider(S, 0.75, -3.75, -4.7);
  // the output monitor the social lead checks the takes on
  const outMon = new THREE.Group();
  place(S, outMon, 3.3, -1.35, face(3.3, -1.35, 4.15, -0.65));
  outMon.add(K.cStand(1.25, { arm: 0 }));
  outMon.add(K.deskMonitor(mirrorMat(feed), 0.34, 0.6).translateY(1.2));
  collider(S, 0.4, 3.3, -1.35);

  // ---- the people ----
  const pink = color;
  const lead = crew(r, pink, { fem: true, style: 'streetwear', top: '#ff4f8b', pants: '#1d2033', hairStyle: 'bun', noBag: true, accessory: 'none' });
  const second = crew(r, pink, { fem: false, style: 'streetwear', top: '#ffffff', pants: '#2b3a67', noBag: true, accessory: 'none', beard: false });
  const op = crew(r, pink, { style: 'techwear', noBag: true });
  const director = crew(r, pink, { style: 'overshirt', top: '#2a2f38' });
  const stylist = crew(r, pink, { fem: true, style: 'kurta', noBag: true });
  const socialLead = crew(r, pink, { fem: true, style: 'blazer' });
  giveProp(socialLead, 'phone');
  const L = [-0.5, markZ];
  const R = [0.75, markZ - 0.25];
  const toCam = face(0, markZ, 0.1, -1.55);
  const dirSpot = [2.85, -3.0];
  const styHome = [-3.2, -5.25];
  bake(S);
  const scene = createScene({
    color,
    anchor: S,
    cycle: 30,
    playerPos,
    actors: [
      { p: lead, who: 'Creator', say: "We're shooting a reel: on the beat, eight counts, one take.", at: L, face: toCam, steps: [
        { t: 0, do: 'idle' }, { t: 3.2, do: 'relax' }, { t: 4.0, do: 'dance' }, { t: 16.0, do: 'relax' }, { t: 21.0, do: 'idle', face: toCam + 0.6 }, { t: 25.0, do: 'idle', face: toCam },
      ] },
      { p: second, who: 'Creator', say: "I hit my mark and keep the energy up for the take.", at: R, face: toCam, steps: [
        { t: 0, do: 'relax' }, { t: 4.0, do: 'dance2' }, { t: 16.3, do: 'relax' }, { t: 18.0, do: 'discuss', face: face(R[0], R[1], dirSpot[0], dirSpot[1]) }, { t: 23.0, do: 'idle', face: toCam },
      ] },
      { p: op, who: 'Camera operator', say: "I'm framing the reel on the phone rig and keeping it in focus.", at: [0.1, -0.85], face: Math.PI, steps: [
        { t: 0, do: 'monitor' }, { t: 1.2, do: 'adjust' }, { t: 3.0, do: 'monitor' }, { t: 16.2, do: 'phoneup' }, { t: 19.0, do: 'monitor' }, { t: 27.0, do: 'adjust' }, { t: 28.6, do: 'monitor' },
      ] },
      { p: director, who: 'Director', say: "I'm calling the takes and watching playback on the monitor.", at: dirSpot, face: face(dirSpot[0], dirSpot[1], 0.1, markZ), steps: [
        { t: 0, do: 'direct' }, { t: 2.6, do: 'listen' }, { t: 16.0, do: 'applaud' }, { t: 17.6, do: 'direct' }, { t: 20.0, do: 'monitor', to: [3.55, -0.45], face: face(3.55, -0.45, 3.3, -1.35) }, { t: 25.0, do: 'listen', to: dirSpot, face: face(dirSpot[0], dirSpot[1], 0.1, markZ) },
      ] },
      { p: stylist, who: 'Stylist', say: "I'm checking outfits and props before the next take.", at: styHome, face: face(styHome[0], styHome[1], -3.75, -4.7), steps: [
        { t: 0, do: 'inspect' }, { t: 7.0, do: 'listen', face: face(styHome[0], styHome[1], 0, markZ) }, { t: 15.0, do: 'inspect', face: face(styHome[0], styHome[1], -3.75, -4.7) }, { t: 19.2, do: 'inspect', to: [-1.3, markZ + 0.15], face: face(-1.3, markZ + 0.15, L[0], L[1]) }, { t: 24.2, do: 'idle', to: styHome, face: face(styHome[0], styHome[1], -3.75, -4.7) },
      ] },
      { p: socialLead, who: 'Social lead', say: "I'm watching the cut on my phone and planning when it goes out.", at: [4.15, -0.65], face: face(4.15, -0.65, 3.3, -1.35), steps: [
        { t: 0, do: 'phone' }, { t: 8.0, do: 'listen', face: face(4.15, -0.65, 0.1, markZ) }, { t: 14.0, do: 'phone', face: face(4.15, -0.65, 3.3, -1.35) }, { t: 20.6, do: 'discuss' }, { t: 25.5, do: 'phone' },
      ] },
    ],
    tick: (c, t) => {
      const rolling = c > 4 && c < 16;
      tally.visible = rolling && Math.sin(t * 6) > -0.4;
      // the operator nudges the framing while setting up
      phone.userData.head.rotation.y = c > 1.2 && c < 3.0 ? Math.sin((c - 1.2) * 3.5) * 0.06 : 0;
      hm.scale.setScalar(1 + (rolling ? Math.max(0, Math.sin(t * 7)) * 0.12 : 0));
    },
    screens: [feed],
  });
  for (const [x, z] of [L, R, [0.1, -0.85], dirSpot, styHome, [4.15, -0.65]]) collider(S, 0.32, x, z);
  // a pool of light on the set once the sun goes
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), lightPool('#ffd9ec', 0.3));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.1, 0.03, markZ + 0.6);
  S.add(pool);
  updaters.push(scene);
  return S;
}

// ===================================================================================
// BRAND · The TV commercial shoot
// A living-room set built on a riser, an actor on the sofa talking to a cinema camera, the
// cinematographer and focus puller on it, a boom operator, a lighting technician with a softbox,
// LED, diffusion and a flag, the slate, and the director at a monitoring station to one side
// watching the takes (the monitors play stills from the department's own films).
// ===================================================================================
const BRAND_REEL = [
  'work/bh/btb-1.jpg', 'work/bh/t20-1.jpg', 'work/bh/btb-3.jpg', 'work/bh/grofers-brand-films-1.jpg', 'work/bh/t20-4.jpg',
  'work/bh/btb-5.jpg', 'work/bh/moms-priceless-1.jpg', 'work/bh/t20-6.jpg', 'work/bh/timeformom-1.jpg', 'work/bh/btb-7.jpg',
].map((src) => ({ src }));

// a flat of the set: front painted, the back showing its timber bracing like a real studio flat
function flat(w, h, paint) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, h, 0.08), paint, 0, h / 2, 0));
  const ply = solid('#c9a77a', { roughness: 0.9 });
  g.add(mesh(new THREE.BoxGeometry(w, h, 0.02), ply, 0, h / 2, -0.05));
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) g.add(mesh(new THREE.BoxGeometry(0.06, h, 0.08), WOOD, x, h / 2, -0.1));
  for (const y of [0.4, h - 0.4]) g.add(mesh(new THREE.BoxGeometry(w, 0.06, 0.08), WOOD, 0, y, -0.1));
  // stage braces propping it up from behind, weighted with sandbags
  for (const x of [-w / 3, w / 3]) {
    g.add(K.rod([x, h * 0.7, -0.12], [x, 0.02, -1.1], 0.03, WOOD, 4));
    g.add(K.sandbag().translateX(x).translateZ(-1.0));
  }
  return g;
}

export function buildBrandShoot(g, { color, collider, r, playerPos, updaters }) {
  const S = new THREE.Group();
  S.name = 'scene:brand';
  g.add(S);
  // ---- the set: riser, an L of flats, sofa, rug, tables, lamp, plant, art ----
  const set = new THREE.Group();
  place(S, set, -3.9, -4.9, 0);
  const riserH = 0.22;
  set.add(mesh(new THREE.BoxGeometry(3.6, riserH, 3.4), solid('#3a3f47', { roughness: 0.8 }), 0, riserH / 2, 0));
  set.add(mesh(new THREE.BoxGeometry(3.56, 0.01, 3.36), solid('#c8a57c', { roughness: 0.7 }), 0, riserH + 0.005, 0, false));
  const wallPaint = solid('#e9e1d3', { roughness: 0.85 });
  place(set, flat(3.4, 2.7, wallPaint), -1.72, 0, Math.PI / 2, riserH);
  place(set, flat(2.2, 2.7, wallPaint), -0.6, -1.66, 0, riserH);
  // a framed print from the department's own campaign on each wall
  const art = (src, w, h) => {
    const f = new THREE.Group();
    f.add(mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.04), solid('#2b2219'), 0, 0, 0));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(src, (t) => (t.colorSpace = THREE.SRGBColorSpace)), toneMapped: false }));
    pic.position.z = 0.025;
    f.add(pic);
    return f;
  };
  place(set, art('work/bh/btb-2.jpg', 1.1, 0.7), -1.66, 0.1, Math.PI / 2, riserH + 1.75);
  place(set, art('work/bh/t20-5.jpg', 0.7, 0.5), -0.6, -1.6, 0, riserH + 1.7);
  // rug, sofa, cushions, coffee table, side table and a lit floor lamp
  set.add(mesh(new THREE.BoxGeometry(2.2, 0.012, 1.7), solid('#b4513d', { roughness: 0.95 }), 0.0, riserH + 0.012, 0.1, false));
  const sofa = new THREE.Group();
  place(set, sofa, -1.18, 0.1, Math.PI / 2, riserH);
  const fabric = solid('#3d5f7a', { roughness: 0.9 });
  sofa.add(mesh(new THREE.BoxGeometry(2.0, 0.24, 0.85), fabric, 0, 0.27, 0));
  sofa.add(mesh(new THREE.BoxGeometry(2.0, 0.55, 0.2), fabric, 0, 0.55, -0.34));
  for (const sx of [-1, 1]) sofa.add(mesh(new THREE.BoxGeometry(0.2, 0.42, 0.85), fabric, sx * 0.95, 0.36, 0));
  for (const sx of [-0.45, 0.45]) sofa.add(mesh(new THREE.BoxGeometry(0.82, 0.1, 0.62), solid('#4a7290', { roughness: 0.9 }), sx, 0.44, 0.06));
  for (const [x, c] of [[-0.75, '#e8b04a'], [0.72, '#f2efe7']]) {
    const cu = mesh(new THREE.BoxGeometry(0.36, 0.34, 0.12), solid(c, { roughness: 0.9 }), x, 0.62, -0.18);
    cu.rotation.z = x * 0.15;
    sofa.add(cu);
  }
  for (const [x, z] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) sofa.add(mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.15, 6), WOOD, x, 0.075, z));
  const ct = new THREE.Group();
  place(set, ct, 0.05, 0.1, 0, riserH);
  ct.add(mesh(new THREE.BoxGeometry(0.55, 0.04, 1.0), WOOD, 0, 0.4, 0));
  for (const [x, z] of [[-0.24, -0.45], [0.24, -0.45], [-0.24, 0.45], [0.24, 0.45]]) ct.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), DARK, x, 0.2, z));
  ct.add(K.cup('#f4efe7').translateY(0.42).translateZ(-0.2));
  ct.add(K.papers(2, 0.18, 0.24).translateY(0.42).translateZ(0.2));
  set.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16), WOOD, -1.3, riserH + 0.25, 1.38));
  const lamp = new THREE.Group();
  place(set, lamp, -1.35, -1.25, 0, riserH);
  lamp.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.03, 12), DARK, 0, 0.015, 0));
  lamp.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6), BRUSHED, 0, 0.77, 0));
  lamp.add(mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.28, 16, 1, true), glow('#ffe2b0', 1.4), 0, 1.6, 0, false));
  const plant = new THREE.Group();
  place(set, plant, -1.35, 1.4, 0, riserH + 0.5);
  for (let k = 0; k < 7; k++) {
    const leaf = mesh(new THREE.IcosahedronGeometry(0.16, 0), solid('#3f8a3a', { flatShading: true }), Math.sin(k * 2.4) * 0.14, 0.2 + (k % 3) * 0.12, Math.cos(k * 2.4) * 0.14);
    leaf.scale.set(1, 1.5, 0.6);
    plant.add(leaf);
  }
  // the riser is off limits: four circles reach its corners
  for (const x of [-0.9, 0.9]) for (const z of [-0.85, 0.85]) collider(S, 1.25, -3.9 + x, -4.9 + z);

  // ---- the actor, on the sofa facing the camera (+x) ----
  const actorSpot = [-5.05, -4.8];
  const actor = crew(r, color, { style: 'linen', fem: false, top: '#f3efe6', pants: '#2b3245', beard: true, noBag: true, accessory: 'none' });
  // ---- the camera: a cinema camera on sticks, lens on the actor ----
  const camAt = [-1.15, -4.75];
  const camRot = face(camAt[0], camAt[1], actorSpot[0], actorSpot[1]);
  const preview = makePlaylistScreen({ w: 0.56, h: 0.33, px: 320, items: BRAND_REEL, hold: 5, trans: 0.8 });
  const camera = place(S, K.cinemaCamera(new THREE.MeshBasicMaterial({ map: preview.mesh.material.map, toneMapped: false }), 1.42), camAt[0], camAt[1], camRot);
  collider(S, 0.6, camAt[0], camAt[1]);
  // positions round the camera in its own frame: behind it on the pan bar, and beside the lens
  const camLocal = (lx, lz) => [camAt[0] + lx * Math.cos(camRot) + lz * Math.sin(camRot), camAt[1] - lx * Math.sin(camRot) + lz * Math.cos(camRot)];
  const opSpot = camLocal(0.3, -0.95);
  const fpSpot = camLocal(-0.62, -0.05);
  // ---- lights: a big softbox key from the front, an LED fill, diffusion, a flag and a reflector ----
  const key = place(S, K.softbox(1.1, 0.8, 2.15), -2.2, -2.2, face(-2.2, -2.2, actorSpot[0], actorSpot[1]));
  key.add(K.sandbag().translateX(0.3));
  collider(S, 0.55, -2.2, -2.2);
  place(S, K.frameOnStand(1.0, 1.0, 1.15), -3.2, -2.65, face(-3.2, -2.65, actorSpot[0], actorSpot[1]));
  collider(S, 0.45, -3.2, -2.65);
  const fill = place(S, K.ledPanel(0.7, 0.42, 1.95), -2.3, -7.3, face(-2.3, -7.3, actorSpot[0], actorSpot[1]));
  fill.add(K.sandbag().translateX(-0.3));
  collider(S, 0.5, -2.3, -7.3);
  place(S, K.frameOnStand(0.8, 0.6, 1.9, { flag: true }), -1.5, -6.6, face(-1.5, -6.6, actorSpot[0], actorSpot[1]) + 0.6);
  collider(S, 0.4, -1.5, -6.6);
  place(S, K.reflector(0.45, 0.75), -2.7, -6.15, face(-2.7, -6.15, actorSpot[0], actorSpot[1]));
  // ---- sound: the boom operator stands off the set's front edge, mic over the actor ----
  const boomSpot = [-3.35, -2.0];
  const boomOp = crew(r, color, { style: 'hoodie', accessory: 'headphones', noBag: true });
  const pole = K.boomPole(3.3, 0.85);
  pole.position.set(0, 1.86, 0.18);
  pole.userData.dynamic = true;
  boomOp.root.add(pole);
  // ---- the director's monitoring station, to the right of camera ----
  const dt = new THREE.Group();
  place(S, dt, 2.35, -4.4, Math.PI / 2);
  dt.add(K.table(1.5, 0.7, 0.76, solid('#2c3037', { roughness: 0.6 })));
  const monA = makePlaylistScreen({ w: 0.56, h: 0.33, px: 384, items: BRAND_REEL, hold: 5, trans: 0.8 });
  const monB = makePlaylistScreen({ w: 0.56, h: 0.33, px: 384, items: BRAND_REEL.slice(5).concat(BRAND_REEL.slice(0, 5)), hold: 6, trans: 0.8 });
  for (const [x, scr] of [[-0.33, monA], [0.33, monB]]) {
    const m = K.deskMonitor(null, 0.56, 0.33);
    scr.mesh.position.set(0, 0.12 + 0.165, 0.005);
    m.add(scr.mesh);
    // hoods so the director can see in daylight
    m.add(mesh(new THREE.BoxGeometry(0.62, 0.02, 0.18), K.M.black, 0, 0.47, 0.08));
    for (const sx of [-1, 1]) m.add(mesh(new THREE.BoxGeometry(0.02, 0.36, 0.18), K.M.black, sx * 0.3, 0.29, 0.08));
    place(dt, m, x, -0.12, Math.PI, 0.76);
  }
  dt.add(K.headphones().translateY(0.77).translateX(0.55).translateZ(0.15));
  dt.add(K.papers(4).translateY(0.77).translateX(-0.5).translateZ(0.12));
  dt.add(K.cup('#d23a3a').translateY(0.76).translateX(0.2).translateZ(0.25));
  place(S, K.directorChair('#1f2329'), 3.05, -4.35, -Math.PI / 2);
  place(S, K.directorChair('#1f2329'), 3.0, -3.55, -Math.PI / 2);
  place(S, K.hardCase(0.55, 0.32, 0.38), 2.55, -5.55, 0.3);
  collider(S, 0.9, 2.45, -4.4);
  collider(S, 0.4, 3.05, -4.35);
  // a shot list on an easel and the kit cart behind the station
  const easel = new THREE.Group();
  place(S, easel, 1.6, -6.4, face(1.6, -6.4, 3.0, -4.0));
  easel.add(K.rod([-0.35, 0, 0.2], [0, 1.7, 0], 0.02, WOOD, 4));
  easel.add(K.rod([0.35, 0, 0.2], [0, 1.7, 0], 0.02, WOOD, 4));
  easel.add(K.rod([0, 0, -0.35], [0, 1.6, -0.02], 0.02, WOOD, 4));
  const listTex = canvasTexture(384, 512, (c, w, h) => {
    c.fillStyle = '#fbfaf6';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#16191c';
    c.font = `700 34px ${FONT.sans}`;
    c.fillText('SHOT LIST', 28, 56);
    c.fillStyle = color;
    c.fillRect(28, 72, 120, 6);
    c.font = `500 24px ${FONT.sans}`;
    c.fillStyle = '#3a3f47';
    ['1  WIDE · living room', '2  MID · to camera', '3  CLOSE · the line', '4  INSERT · hands', '5  CUTAWAY · reaction'].forEach((l, k) => {
      c.fillText(l, 28, 130 + k * 64);
      c.strokeStyle = '#d6d2c8';
      c.beginPath();
      c.moveTo(28, 148 + k * 64);
      c.lineTo(w - 28, 148 + k * 64);
      c.stroke();
    });
  });
  easel.add(mesh(new THREE.PlaneGeometry(0.75, 1.0), new THREE.MeshStandardMaterial({ map: listTex, roughness: 0.8 }), 0, 1.15, 0.12, false));
  collider(S, 0.45, 1.6, -6.4);
  place(S, K.cart(0.9, 0.5, 0.88), 0.5, -7.3, 0.2);
  collider(S, 0.6, 0.5, -7.3);
  place(S, K.hardCase(0.7, 0.3, 0.45), -0.55, -7.85, -0.2);
  place(S, K.cableCoil(0.24), 0.9, -3.4);
  S.add(K.cableRun([camAt, [0.2, -5.6], [1.9, -5.0]]));
  S.add(K.cableRun([[-2.2, -2.2], [-1.6, -1.6], [0.6, -1.3]]));
  // ---- the crew ----
  const dop = crew(r, color, { style: 'techwear', accessory: 'cap', noBag: true });
  const puller = crew(r, color, { style: 'hoodie', noBag: true });
  const director = crew(r, color, { style: 'overshirt', top: '#1f2a44', beard: true });
  const producer = crew(r, color, { style: 'blazer', fem: true });
  const gaffer = crew(r, color, { style: 'streetwear', top: '#2b2f36', accessory: 'cap', noBag: true });
  const pa = crew(r, color, { style: 'streetwear', fem: true, noBag: true, accessory: 'none' });
  const slate = K.clapperboard();
  slate.userData.dynamic = true;
  pa.root.add(slate);
  const dirSeat = [3.05, -4.25];
  const toDesk = face(dirSeat[0], dirSeat[1], 2.35, -4.4);
  const paWait = [-0.4, -6.25];
  const paIn = [-2.0, -4.78];
  const gafferHome = [-1.5, -1.95];
  bake(S);
  const scene = createScene({
    color,
    anchor: S,
    cycle: 36,
    offset: 7,
    playerPos,
    actors: [
      { p: actor, who: 'Actor', say: "I'm on set for the TV commercial, waiting for 'action'.", at: actorSpot, face: Math.PI / 2, y: riserH + 0.02, steps: [
        { t: 0, do: 'sitrest' }, { t: 7.6, do: 'actsit' }, { t: 21.6, do: 'sitrest' },
      ] },
      { p: dop, who: 'Cinematographer', say: "I'm lighting and framing the living-room scene for the film.", at: opSpot, face: camRot, steps: [
        { t: 0, do: 'cinecam' }, { t: 23.0, do: 'monitor', to: [2.6, -3.35], face: face(2.6, -3.35, 2.35, -4.4) }, { t: 30.0, do: 'cinecam', to: opSpot, face: camRot },
      ] },
      { p: puller, who: 'Focus puller', say: "I keep the actor sharp while the camera moves.", at: fpSpot, face: camRot - 0.9, steps: [
        { t: 0, do: 'focus' }, { t: 23.5, do: 'listen' }, { t: 31.0, do: 'focus' },
      ] },
      { p: boomOp, who: 'Sound recordist', say: "Boom up, mic just out of frame: I'm recording the dialogue.", at: boomSpot, face: face(boomSpot[0], boomSpot[1], actorSpot[0], actorSpot[1]), steps: [
        { t: 0, do: 'listen' }, { t: 4.6, do: 'boom' }, { t: 22.6, do: 'listen' },
      ] },
      { p: gaffer, who: 'Gaffer', say: "I'm setting the lights so the set looks like an evening at home.", at: gafferHome, face: face(gafferHome[0], gafferHome[1], -2.2, -2.2), steps: [
        { t: 0, do: 'adjust' }, { t: 4.2, do: 'listen', face: face(gafferHome[0], gafferHome[1], actorSpot[0], actorSpot[1]) },
        { t: 24.5, do: 'adjust', to: [-1.9, -6.75], face: face(-1.9, -6.75, -2.3, -7.3) }, { t: 30.5, do: 'listen', to: gafferHome, face: face(gafferHome[0], gafferHome[1], actorSpot[0], actorSpot[1]) },
      ] },
      { p: pa, who: 'Clapper loader', say: "I mark every take with the slate so the edit can find it.", at: paWait, face: face(paWait[0], paWait[1], camAt[0], camAt[1]), steps: [
        { t: 0, do: 'idle' }, { t: 4.4, do: 'idle', to: paIn, face: face(paIn[0], paIn[1], camAt[0], camAt[1]) }, { t: 6.3, do: 'slate' }, { t: 8.6, do: 'idle', to: paWait, face: face(paWait[0], paWait[1], camAt[0], camAt[1]) },
      ] },
      { p: director, who: 'Director', say: "I'm watching the take on the monitors and giving notes.", at: dirSeat, face: toDesk, y: 0.02, steps: [
        { t: 0, do: 'monsit' }, { t: 2.5, do: 'direct' }, { t: 4.4, do: 'monsit' }, { t: 21.8, do: 'direct' }, { t: 24.0, do: 'discuss', face: face(dirSeat[0], dirSeat[1], 2.6, -3.35) }, { t: 30.2, do: 'monsit', face: toDesk },
      ] },
      { p: producer, who: 'Producer', say: "I'm keeping the shoot on schedule and the shot list moving.", at: [3.45, -3.2], face: face(3.45, -3.2, 2.35, -4.4), steps: [
        { t: 0, do: 'listen' }, { t: 12.0, do: 'phone' }, { t: 20.0, do: 'listen' }, { t: 24.4, do: 'applaud' }, { t: 26.0, do: 'listen' },
      ] },
    ],
    tick: (c, t) => {
      const rolling = c > 7.2 && c < 21.8;
      camera.userData.tally.visible = rolling;
      // a slow push and drift while rolling; a framing check before the take
      camera.userData.pan.rotation.y = rolling ? Math.sin((c - 7.2) * 0.25) * 0.05 : c < 6 ? Math.sin(c * 1.4) * 0.03 : 0;
      camera.userData.tilt.rotation.x = rolling ? -0.02 - (c - 7.2) * 0.001 : 0;
      // the boom comes up from resting on the ground for the take, and goes down after
      const up = Math.min(1, Math.max(0, (c - 4.6) / 0.9)) * (1 - Math.min(1, Math.max(0, (c - 22.6) / 0.9)));
      pole.rotation.x = (1 - up) * -1.25;
      pole.position.set(0.18 * (1 - up), 1.2 + up * 0.66, 0.18);
      // the slate: up in front of the lens, sticks open, clap, and away
      const a = c - 6.3;
      const shown = a > 0 && a < 2.2;
      const lift = shown ? Math.min(1, a / 0.5) * (1 - Math.max(0, Math.min(1, (a - 1.5) / 0.6))) : 0;
      slate.position.set(-0.05 + (1 - lift) * 0.22, 0.95 + lift * 0.5, 0.25 + lift * 0.22);
      slate.rotation.set(-0.2 * (1 - lift), 0, (1 - lift) * 0.5);
      slate.userData.stick.rotation.z = a > 0.2 && a < 0.9 ? 0.55 : 0;
    },
    screens: [monA, monB, preview],
  });
  for (const [x, z] of [boomSpot, gafferHome, paWait, [3.45, -3.2]]) collider(S, 0.32, x, z);
  // pools of set light at dusk
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), lightPool('#ffe3b8', 0.32));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(-3.6, riserH + 0.03, -4.8);
  S.add(pool);
  updaters.push(scene);
  return S;
}

// ===================================================================================
// PRODUCT LAUNCHES · The launch command centre, with a digital experience lab
// A small launch on a stage at the back (a presenter, the big screen, side panels, a podium and an
// audience), the team preparing collateral at a standing table, and on the other side the
// product-experience lab: a checkout flow wall from Magic Checkout being walked through, a
// developer, a user test with a researcher, a responsive bench and a motion station.
// ===================================================================================
const LAUNCH_REEL = ['work/intl-cover.jpg', 'work/money-hero.jpg', 'work/magic-cover.jpg', 'work/whatsapp-cover.jpg', 'work/passport-cover.jpg', 'work/ace-cover.jpg', 'work/ring-cover.jpg'].map((src) => ({ src }));
const CHECKOUT_FLOW = [
  ['01', 'Land', 'work/bh/magic-checkout-1.jpg'],
  ['02', 'Pick a product', 'work/bh/magic-checkout-7.jpg'],
  ['03', 'Checkout', 'work/bh/magic-checkout-8.jpg'],
  ['04', 'Pay', 'work/bh/magic-checkout-10.jpg'],
];

export function buildLaunchCentre(g, { color, collider, r, playerPos, updaters }) {
  const S = new THREE.Group();
  S.name = 'scene:pmm';
  g.add(S);
  const tex = (src) => {
    const t = new THREE.TextureLoader().load(src);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  // ---- the launch stage ----
  const stage = new THREE.Group();
  place(S, stage, 0, -8.5, 0);
  stage.add(mesh(new THREE.BoxGeometry(6.2, 0.3, 2.5), WHITE_METAL, 0, 0.15, 0));
  stage.add(mesh(new THREE.BoxGeometry(6.2, 0.04, 0.06), glow(color, 1.8), 0, 0.3, 1.25, false));
  const big = makePlaylistScreen({ w: 4.4, h: 2.475, px: 896, items: LAUNCH_REEL, hold: 6, trans: 1.0 });
  stage.add(mesh(new THREE.BoxGeometry(4.7, 2.75, 0.18), K.M.black, 0, 0.3 + 0.95 + 1.24, -0.95));
  big.mesh.position.set(0, 0.3 + 0.95 + 1.24, -0.855);
  stage.add(big.mesh);
  for (const sx of [-1, 1]) stage.add(mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), WHITE_METAL, sx * 2.25, 0.3 + 1.3 - 0.2, -1.0));
  const sides = [];
  for (const sx of [-1, 1]) {
    const panel = makePlaylistScreen({ w: 1.1, h: 1.95, px: 320, items: sx < 0 ? [{ src: 'work/passport-ads.jpg' }, { src: 'work/bh/money-1.jpg' }] : [{ src: 'work/bh/magic-checkout-10.jpg' }, { src: 'work/bh/ace-1.jpg' }], hold: 7, trans: 1.2 });
    const p = new THREE.Group();
    place(stage, p, sx * 3.05, -0.55, -sx * 0.45, 0.3);
    p.add(mesh(new THREE.BoxGeometry(1.25, 2.1, 0.12), WHITE_METAL, 0, 1.25, -0.07));
    panel.mesh.position.set(0, 1.25, 0.0);
    p.add(panel.mesh);
    sides.push(panel);
  }
  // the podium with the product on it
  const pod = new THREE.Group();
  place(stage, pod, 1.75, 0.45, -0.35, 0.3);
  pod.add(mesh(new THREE.BoxGeometry(0.6, 1.05, 0.45), WHITE_METAL, 0, 0.52, 0));
  pod.add(mesh(new THREE.BoxGeometry(0.62, 0.04, 0.5), solid(color, { roughness: 0.4 }), 0, 1.06, 0));
  pod.add(mesh(new THREE.BoxGeometry(0.16, 0.012, 0.31), K.M.graphite, 0, 1.09, 0, false));
  collider(S, 3.3, 0, -8.7);
  collider(S, 1.0, 2.6, -8.1);
  collider(S, 1.0, -2.6, -8.1);
  // the audience: two short rows of stools facing the stage
  const seats = [];
  for (const [row, z] of [[0, -5.35], [1, -4.35]]) for (const x of [-1.5, -0.5, 0.5, 1.5]) {
    const sx = x + row * 0.25;
    place(S, K.stool(0.46, row ? '#e8e2d6' : color), sx, z);
    seats.push([sx, z]);
    collider(S, 0.3, sx, z);
  }

  // ---- the launch team at a standing table ----
  const tbl = new THREE.Group();
  const tAt = [4.7, -3.2];
  place(S, tbl, tAt[0], tAt[1], face(tAt[0], tAt[1], 0, 0));
  tbl.add(K.table(1.7, 0.8, 1.02));
  tbl.add(K.laptop(new THREE.MeshBasicMaterial({ map: tex('work/money-hero.jpg'), toneMapped: false })).translateY(1.02).translateX(-0.45));
  tbl.add(K.papers(5).translateY(1.02).translateX(0.25));
  tbl.add(K.papers(3, 0.3, 0.42).translateY(1.02).translateX(0.55).translateZ(-0.1));
  for (const [x, src] of [[0.0, 'work/bh/passport-4.jpg'], [0.2, 'work/bh/money-6.jpg']]) {
    const card = mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshStandardMaterial({ map: tex(src), roughness: 0.7 }), x, 1.03, 0.22, false);
    card.rotation.x = -Math.PI / 2;
    card.rotation.z = x * 2;
    tbl.add(card);
  }
  collider(S, 1.0, tAt[0], tAt[1]);
  const artAt = [6.1, -4.75];
  const art = new THREE.Group();
  place(S, art, artAt[0], artAt[1], face(artAt[0], artAt[1], 3.0, -1.5));
  art.add(K.cStand(1.2, { arm: 0 }));
  const artScreen = makePlaylistScreen({ w: 1.0, h: 0.62, px: 384, items: [{ src: 'work/passport-cover.jpg' }, { src: 'work/intl-cover.jpg' }, { src: 'work/whatsapp-cover.jpg' }], hold: 5, trans: 0.9 });
  art.add(mesh(new THREE.BoxGeometry(1.06, 0.68, 0.04), K.M.black, 0, 1.55, -0.03));
  artScreen.mesh.position.set(0, 1.55, 0.0);
  art.add(artScreen.mesh);
  collider(S, 0.45, artAt[0], artAt[1]);

  // ---- launch visualisation: payments flying round the globe ----
  const orbits = [];
  for (let k = 0; k < 5; k++) {
    const d = mesh(new THREE.SphereGeometry(0.11, 8, 6), glow(k % 2 ? '#ffffff' : color, 2.4), 0, 0, 0, false);
    d.userData.dynamic = true;
    S.add(d);
    orbits.push({ d, tilt: 0.4 + k * 0.5, sp: 0.35 + k * 0.07, ph: k * 1.3 });
  }

  // ---- the product experience lab (left) ----
  const wallAt = [-6.7, -3.4];
  const wall = new THREE.Group();
  const wallRot = face(wallAt[0], wallAt[1], -1.0, 0.8);
  place(S, wall, wallAt[0], wallAt[1], wallRot);
  const panelW = 1.2;
  const frames = [];
  CHECKOUT_FLOW.forEach(([n, label, src], k) => {
    const a = (k - 1.5) * 0.2;
    const x = Math.sin(a) * 6 * 0.0 + (k - 1.5) * (panelW + 0.12);
    const z = -Math.cos(a) * 0.4 + 0.4;
    const p = new THREE.Group();
    place(wall, p, x, z, -a, 0);
    p.add(mesh(new THREE.BoxGeometry(panelW + 0.1, 1.75, 0.1), WHITE_METAL, 0, 1.55, -0.06));
    p.add(mesh(new THREE.PlaneGeometry(panelW, panelW), new THREE.MeshBasicMaterial({ map: tex(src), toneMapped: false }), 0, 1.45, 0.002, false));
    const lab = canvasTexture(384, 96, (c, w, h) => {
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, w, h);
      c.fillStyle = color;
      c.font = `800 40px ${FONT.sans}`;
      c.fillText(n, 18, 62);
      c.fillStyle = '#16191c';
      c.font = `700 34px ${FONT.sans}`;
      c.fillText(label, 88, 60);
    });
    p.add(mesh(new THREE.PlaneGeometry(panelW, panelW / 4), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false }), 0, 2.27, 0.002, false));
    const hl = mesh(new THREE.BoxGeometry(panelW + 0.12, 0.05, 0.03), glow(color, 2.2), 0, 0.82, 0.02, false);
    hl.userData.dynamic = true;
    p.add(hl);
    p.add(mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), BRUSHED, 0, 0.36, -0.06));
    frames.push(hl);
  });
  wall.add(mesh(new THREE.BoxGeometry(5.6, 0.08, 0.6), WHITE_METAL, 0, 0.04, 0.1));
  const cursor = mesh(new THREE.CircleGeometry(0.07, 16), glow('#ffffff', 2.6), 0, 1.45, 0.06, false);
  cursor.userData.dynamic = true;
  wall.add(cursor);
  for (const x of [-2, 0, 2]) {
    const [cx, cz] = [wallAt[0] + x * Math.cos(wallRot), wallAt[1] - x * Math.sin(wallRot)];
    collider(S, 1.05, cx, cz);
  }
  // the developer's workstation, facing the wall
  const devAt = [-3.7, -1.25];
  const dev = new THREE.Group();
  place(S, dev, devAt[0], devAt[1], face(devAt[0], devAt[1], wallAt[0], wallAt[1]));
  dev.add(K.table(1.3, 0.65, 0.74));
  dev.add(K.deskMonitor(new THREE.MeshBasicMaterial({ map: tex('work/magic-page.jpg'), toneMapped: false }), 0.5, 0.3).translateY(0.74).translateX(-0.3).translateZ(-0.15));
  dev.add(K.deskMonitor(new THREE.MeshBasicMaterial({ map: tex('work/bh/magic-checkout-5.jpg'), toneMapped: false }), 0.5, 0.3).translateY(0.74).translateX(0.3).translateZ(-0.15));
  dev.add(K.stool(0.5).translateZ(0.55));
  collider(S, 0.8, devAt[0], devAt[1]);
  // the user test: a participant with a phone at a small table, a researcher taking notes
  const testAt = [-5.2, 1.15];
  const tt = new THREE.Group();
  place(S, tt, testAt[0], testAt[1], 0);
  tt.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), WHITE_METAL, 0, 0.73, 0));
  tt.add(mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.72, 10), BRUSHED, 0, 0.36, 0));
  tt.add(K.papers(2, 0.2, 0.28).translateY(0.75).translateX(0.15));
  place(S, K.stool(0.48), testAt[0] - 0.6, testAt[1] + 0.05);
  collider(S, 0.7, testAt[0], testAt[1]);
  // the responsive bench: one screen at desktop, tablet and phone sizes, changing together
  const benchAt = [-7.6, 0.2];
  const bench = new THREE.Group();
  place(S, bench, benchAt[0], benchAt[1], face(benchAt[0], benchAt[1], -3.0, 1.5));
  bench.add(K.table(1.8, 0.7, 0.78));
  const sync = (items, w, h) => makePlaylistScreen({ w, h, px: 360, items: items.map((src) => ({ src })), hold: 4.5, trans: 0.7 });
  const desk = sync(['work/bh/magic-checkout-1.jpg', 'work/bh/magic-checkout-5.jpg'], 0.62, 0.38);
  const tab = sync(['work/bh/magic-checkout-7.jpg', 'work/bh/magic-checkout-8.jpg'], 0.3, 0.4);
  const phn = sync(['work/bh/magic-checkout-10.jpg', 'work/bh/magic-checkout-9.jpg'], 0.14, 0.28);
  const dm = K.deskMonitor(null, 0.62, 0.38);
  desk.mesh.position.set(0, 0.12 + 0.19, 0.004);
  dm.add(desk.mesh);
  place(bench, dm, -0.5, -0.1, 0, 0.78);
  for (const [scr, x, w, h] of [[tab, 0.32, 0.3, 0.4], [phn, 0.72, 0.14, 0.28]]) {
    const st = new THREE.Group();
    place(bench, st, x, 0, 0, 0.78);
    st.add(mesh(new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.02), K.M.graphite, 0, h / 2 + 0.06, -0.01));
    st.add(mesh(new THREE.BoxGeometry(0.1, 0.06, 0.12), K.M.graphite, 0, 0.03, -0.04));
    scr.mesh.position.set(0, h / 2 + 0.06, 0.001);
    st.add(scr.mesh);
    st.rotation.x = -0.12;
  }
  collider(S, 1.0, benchAt[0], benchAt[1]);
  // the motion station: a monitor looping a micro-interaction from the Magic Checkout page
  const motAt = [-8.4, -2.4];
  const mot = new THREE.Group();
  place(S, mot, motAt[0], motAt[1], face(motAt[0], motAt[1], -6.6, -1.2));
  mot.add(K.table(1.0, 0.6, 1.0));
  const motion = makePlaylistScreen({ w: 0.62, h: 0.62, px: 360, items: [{ src: 'assets/vid/magic-14.mp4', kind: 'video', hold: 9 }, { src: 'assets/vid/magic-12.mp4', kind: 'video', hold: 9 }], hold: 9, trans: 0.6, fit: 'contain' });
  const mm = K.deskMonitor(null, 0.62, 0.62);
  motion.mesh.position.set(0, 0.12 + 0.31, 0.004);
  mm.add(motion.mesh);
  place(mot, mm, 0, -0.12, 0, 1.0);
  collider(S, 0.6, motAt[0], motAt[1]);

  // ---- the people ----
  const presenter = crew(r, color, { style: 'blazer', fem: true, top: '#0f2a3a' });
  const ppl = (o = {}) => crew(r, color, o);
  const aud = [ppl(), ppl({ fem: true }), ppl({ style: 'kurta' })];
  const standing = ppl({ style: 'overshirt' });
  const pmm = ppl({ style: 'blazer' });
  const partner = ppl({ fem: true, style: 'overshirt' });
  const designer = ppl({ style: 'streetwear', accessory: 'cap' });
  const runner = ppl({ style: 'hoodie', noBag: true });
  giveProp(runner, 'parcel', '#e8e1d2');
  const devP = ppl({ style: 'hoodie', accessory: 'glasses' });
  const user = ppl({ fem: true, style: 'streetwear' });
  giveProp(user, 'phone');
  const researcher = ppl({ style: 'linen' });
  const uxDesigner = ppl({ fem: true, style: 'blazer', top: color });
  const motionP = ppl({ style: 'techwear' });
  const toStage = (x, z) => face(x, z, 0, -8.5);
  const deckSpot = [-0.6, -8.35];
  const actors = [
    { p: presenter, who: 'Presenter', say: "I'm walking the room through the launch on the big screen.", at: deckSpot, face: 0, y: 0.3, steps: [{ t: 0, do: 'keynote' }, { t: 26, do: 'idle', face: -0.5 }, { t: 28.5, do: 'keynote', face: 0 }] },
    ...aud.map((p, k) => ({ p, who: 'In the audience', say: "Watching the launch keynote.", at: seats[[0, 2, 5][k]], face: toStage(...seats[[0, 2, 5][k]]), y: -0.02, steps: [{ t: 0, do: 'sit' }, { t: 25.6 + k * 0.3, do: 'sitrest' }, { t: 29 + k * 0.2, do: 'sit' }] })),
    { p: standing, who: 'Product manager', say: "I'm watching how the room reacts to the launch.", at: [2.9, -5.0], face: toStage(2.9, -5.0), steps: [{ t: 0, do: 'listen' }, { t: 25.8, do: 'applaud' }, { t: 28.0, do: 'listen' }] },
    { p: pmm, who: 'Product marketer', say: "We're going through the launch plan, channel by channel.", at: [4.15, -2.55], face: face(4.15, -2.55, tAt[0], tAt[1]), steps: [{ t: 0, do: 'monitor' }, { t: 9, do: 'discuss', face: face(4.15, -2.55, 5.45, -2.5) }, { t: 17, do: 'monitor', face: face(4.15, -2.55, tAt[0], tAt[1]) }] },
    { p: partner, who: 'Launch partner', say: "I'm here for the go-to-market review.", at: [5.45, -2.5], face: face(5.45, -2.5, tAt[0], tAt[1]), steps: [{ t: 0, do: 'listen' }, { t: 9, do: 'listen', face: face(5.45, -2.5, 4.15, -2.55) }, { t: 17, do: 'monitor', face: face(5.45, -2.5, tAt[0], tAt[1]) }] },
    { p: designer, who: 'Designer', say: "I'm reviewing the launch visuals on the screen.", at: [6.55, -4.05], face: face(6.55, -4.05, artAt[0], artAt[1]), steps: [{ t: 0, do: 'point' }, { t: 8, do: 'think' }, { t: 14, do: 'point' }, { t: 22, do: 'listen' }] },
    { p: runner, who: 'Runner', say: "Bringing fresh prints over to the stage.", at: [3.9, -3.75], face: face(3.9, -3.75, 3.0, -7.4), walkAs: 'carry', steps: [{ t: 0, do: 'idle' }, { t: 4, do: 'idle', to: [3.1, -6.95], face: toStage(3.1, -6.95) }, { t: 12, do: 'idle', to: [3.9, -3.75], face: face(3.9, -3.75, tAt[0], tAt[1]) }] },
    { p: devP, who: 'Front-end developer', say: "I'm building the checkout pages you see on the wall.", at: [devAt[0] + 0.45 * Math.sin(face(devAt[0], devAt[1], wallAt[0], wallAt[1]) + Math.PI), devAt[1] + 0.45 * Math.cos(face(devAt[0], devAt[1], wallAt[0], wallAt[1]) + Math.PI)], face: face(devAt[0], devAt[1], wallAt[0], wallAt[1]), y: 0.02, steps: [{ t: 0, do: 'typesit' }] },
    { p: user, who: 'Test user', say: "I'm trying the checkout on my phone while they watch.", at: [testAt[0] - 0.6, testAt[1] + 0.05], face: Math.PI / 2, y: 0.0, steps: [{ t: 0, do: 'sitphone' }] },
    { p: researcher, who: 'UX researcher', say: "I'm noting where the test user hesitates.", at: [testAt[0] + 0.15, testAt[1] + 1.0], face: face(testAt[0] + 0.15, testAt[1] + 1.0, testAt[0] - 0.6, testAt[1]), steps: [{ t: 0, do: 'write' }, { t: 10, do: 'listen' }, { t: 16, do: 'write' }] },
    { p: uxDesigner, who: 'UX designer', say: "I'm walking the team through the checkout flow, step by step.", at: [-5.05, -2.25], face: face(-5.05, -2.25, wallAt[0], wallAt[1]), steps: [{ t: 0, do: 'point' }, { t: 7, do: 'discuss', face: face(-5.05, -2.25, -3.9, -2.1) }, { t: 15, do: 'point', face: face(-5.05, -2.25, wallAt[0], wallAt[1]) }, { t: 23, do: 'think' }] },
    { p: motionP, who: 'Motion designer', say: "I'm animating the product clips for the launch.", at: [-7.75, -1.75], face: face(-7.75, -1.75, motAt[0], motAt[1]), steps: [{ t: 0, do: 'monitor' }, { t: 12, do: 'think' }, { t: 18, do: 'monitor' }] },
  ];
  bake(S);
  const scene = createScene({
    color,
    anchor: S,
    cycle: 30,
    offset: 13,
    playerPos,
    actors,
    tick: (c, t) => {
      // the flow wall: one step lit at a time, a cursor gliding to the next
      const step = Math.floor((t / 2.6) % 4);
      const f = (t / 2.6) % 1;
      frames.forEach((hl, k) => (hl.visible = k === step));
      const from = (step - 1.5) * (panelW + 0.12);
      const to = ((step + 1) % 4 - 1.5) * (panelW + 0.12);
      const glide = f > 0.75 ? (f - 0.75) / 0.25 : 0;
      cursor.position.set(from + (to - from) * glide * glide * (3 - 2 * glide) + 0.25, 1.3 + Math.sin(t * 2) * 0.05, 0.5);
      // payments circling the globe behind the stage
      for (const o of orbits) {
        const a = t * o.sp + o.ph;
        o.d.position.set(Math.cos(a) * 2.6, 4.2 + 2.2 + Math.sin(a) * Math.sin(o.tilt) * 2.6, -12 + Math.sin(a) * Math.cos(o.tilt) * 2.6);
      }
    },
    screens: [big, ...sides, artScreen, desk, tab, phn, motion],
  });
  for (const a of actors.slice(4)) if (a.steps.length && !a.steps.some((s) => s.to)) collider(S, 0.3, a.at[0], a.at[1]);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), lightPool('#d6f4f2', 0.3));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.32, -8.3);
  S.add(pool);
  updaters.push(scene);
  return S;
}

// ===================================================================================
// MENTORSHIP · The crit and the writers' wall
// A portfolio review in the middle of the court: a shared table covered in printed work, swatches,
// type studies and a small prototype, a pin-up board, a creative lead presenting and the team round
// it. To one side, an editorial wall where a campaign is built card by card, Brief → Problem → Idea
// → Craft → Campaign, in the words of the case studies, with a writer at it and a partner pointing.
// ===================================================================================
const PINUPS = ['work/bh/t20-4.jpg', 'work/bh/emotions-stickers-7.jpg', 'work/ring-cover.jpg', 'work/bh/love-story-1.jpg', 'work/bh/btb-4.jpg', 'work/bh/passport-1.jpg'];

function editorialTexture(color) {
  const W = 2048;
  const H = 980;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const imgs = {};
  const cols = ['Brief', 'Problem', 'Idea', 'Craft', 'Campaign'];
  const colW = (W - 120) / 5;
  // draw campaign cp with the first `shown` cards pinned (the last one landing at `drop` 0..1)
  const paint = (cp, shown, drop) => {
    const pl = PLAYS[cp.slug] || {};
    const pr = PROJECTS[cp.slug];
    c.fillStyle = '#f6f1e6';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#16191c';
    c.font = `800 54px ${FONT.display}`;
    c.fillText('How a campaign gets written', 60, 86);
    c.fillStyle = color;
    c.font = `700 36px ${FONT.sans}`;
    c.fillText(pr.title, 60, 140);
    cols.forEach((name, k) => {
      const x = 60 + k * colW;
      c.fillStyle = '#6b6457';
      c.font = `700 30px ${FONT.sans}`;
      c.fillText(`${String(k + 1).padStart(2, '0')}  ${name.toUpperCase()}`, x + 14, 214);
      if (k < 4) {
        c.fillStyle = '#c9bfae';
        c.fillText('→', x + colW - 36, 214);
      }
      if (k >= shown) {
        c.strokeStyle = '#d9cfbd';
        c.setLineDash([12, 10]);
        c.lineWidth = 3;
        c.strokeRect(x + 10, 250, colW - 30, 650);
        c.setLineDash([]);
        return;
      }
      const lift = k === shown - 1 ? (1 - drop) * 40 : 0;
      const y = 250 - lift;
      c.save();
      c.translate(x + colW / 2, y + 325);
      c.rotate(((k % 2 ? 1 : -1) * 0.8 * Math.PI) / 180);
      c.translate(-(x + colW / 2), -(y + 325));
      c.fillStyle = 'rgba(0,0,0,0.08)';
      c.fillRect(x + 18, y + 10, colW - 30, 650);
      c.fillStyle = k === 4 ? '#16191c' : '#ffffff';
      c.fillRect(x + 10, y, colW - 30, 650);
      c.fillStyle = color;
      c.beginPath();
      c.arc(x + colW / 2 - 10, y + 22, 13, 0, Math.PI * 2);
      c.fill();
      if (k === 4) {
        const src = pr.images[0];
        const im = (imgs[src] ||= Object.assign(new Image(), { src }));
        if (im.complete && im.naturalWidth) {
          const bw = colW - 70;
          const bh = bw * 0.75;
          const s = Math.max(bw / im.naturalWidth, bh / im.naturalHeight);
          c.save();
          c.beginPath();
          c.rect(x + 30, y + 60, bw, bh);
          c.clip();
          c.drawImage(im, x + 30 + (bw - im.naturalWidth * s) / 2, y + 60 + (bh - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
          c.restore();
        }
        c.fillStyle = '#ffffff';
        const tw = fitWrap(c, pr.title, { weight: 800, size: 44, min: 28, family: FONT.display, maxW: colW - 70, maxLines: 3 });
        tw.lines.forEach((l, i) => c.fillText(l, x + 30, y + 360 + i * tw.size * 1.15));
        c.fillStyle = '#b9bec7';
        c.font = `500 28px ${FONT.sans}`;
        c.fillText(`${pr.client}`.slice(0, 26), x + 30, y + 560);
        c.fillText(`${pr.year}`, x + 30, y + 600);
      } else {
        const text = [cp.brief, pl.problem, pl.idea, pl.craft][k] || '';
        c.fillStyle = '#16191c';
        const tw = fitWrap(c, text, { weight: 600, size: 38, min: 24, family: FONT.sans, maxW: colW - 70, maxLines: 9 });
        tw.lines.forEach((l, i) => c.fillText(l, x + 30, y + 90 + i * tw.size * 1.3));
      }
      c.restore();
    });
    tex.needsUpdate = true;
  };
  return { tex, paint };
}

export function buildMentorStudio(g, { color, collider, r, playerPos, updaters }) {
  const S = new THREE.Group();
  S.name = 'scene:mentorship';
  g.add(S);
  const tex = (src) => {
    const t = new THREE.TextureLoader().load(src);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  // ---- the crit table ----
  const tAt = [0.2, -1.4];
  const tbl = new THREE.Group();
  place(S, tbl, tAt[0], tAt[1], 0);
  tbl.add(K.table(2.5, 1.15, 0.94, solid('#f4efe6', { roughness: 0.8 })));
  // printed work laid out, a colour fan, type studies, a small prototype
  PINUPS.forEach((src, k) => {
    const card = mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshStandardMaterial({ map: tex(src), roughness: 0.75 }), -0.95 + (k % 4) * 0.5 + (k > 3 ? 0.25 : 0), 0.945, -0.25 + Math.floor(k / 4) * 0.45, false);
    card.rotation.x = -Math.PI / 2;
    card.rotation.z = (k % 2 ? 1 : -1) * 0.08;
    tbl.add(card);
  });
  ['#ff4f8b', '#f2a516', '#3d7bff', '#12c98a', '#16191c', '#e8e2d6'].forEach((col, k) => {
    const sw = mesh(new THREE.BoxGeometry(0.05, 0.004, 0.2), solid(col, { roughness: 0.6 }), 0.95, 0.95 + k * 0.004, 0.25, false);
    sw.rotation.y = -0.5 + k * 0.18;
    sw.position.x += Math.sin(-0.5 + k * 0.18) * 0.1;
    tbl.add(sw);
  });
  const typeTex = canvasTexture(512, 360, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#16191c';
    c.font = `800 150px ${FONT.display}`;
    c.fillText('Aa', 30, 170);
    c.font = `italic 400 64px 'Instrument Serif', serif`;
    c.fillText('Aa', 300, 160);
    c.font = `500 30px ${FONT.sans}`;
    c.fillText('Inter Tight 800 · Instrument Serif', 30, 250);
    c.fillStyle = color;
    c.fillRect(30, 290, 180, 14);
  });
  const ty = mesh(new THREE.PlaneGeometry(0.36, 0.25), new THREE.MeshStandardMaterial({ map: typeTex, roughness: 0.8 }), 0.6, 0.946, 0.3, false);
  ty.rotation.x = -Math.PI / 2;
  tbl.add(ty);
  const proto = mesh(new THREE.IcosahedronGeometry(0.11, 0), solid(color, { flatShading: true, roughness: 0.5 }), -0.85, 1.06, 0.3);
  proto.userData.dynamic = true;
  tbl.add(proto);
  tbl.add(K.laptop(new THREE.MeshBasicMaterial({ map: tex('work/bh/emotions-stickers-1.jpg'), toneMapped: false })).translateY(0.94).translateX(0.95).translateZ(-0.25));
  collider(S, 0.85, tAt[0] - 0.65, tAt[1]);
  collider(S, 0.85, tAt[0] + 0.65, tAt[1]);
  // ---- the pin-up board ----
  const bAt = [-3.2, -2.6];
  const board = new THREE.Group();
  const bRot = face(bAt[0], bAt[1], 0.8, 1.6);
  place(S, board, bAt[0], bAt[1], bRot);
  board.add(mesh(new THREE.BoxGeometry(2.5, 1.6, 0.06), solid('#cdb894', { roughness: 0.95 }), 0, 1.45, 0));
  for (const sx of [-1, 1]) board.add(mesh(new THREE.BoxGeometry(0.07, 2.25, 0.07), WOOD, sx * 1.2, 1.12, -0.06));
  PINUPS.forEach((src, k) => {
    const p = mesh(new THREE.PlaneGeometry(0.66, 0.48), new THREE.MeshBasicMaterial({ map: tex(src), toneMapped: false }), -0.82 + (k % 3) * 0.82, 1.83 - Math.floor(k / 3) * 0.72, 0.035, false);
    p.rotation.z = (k % 2 ? 1 : -1) * 0.025;
    board.add(p);
    board.add(mesh(new THREE.SphereGeometry(0.018, 6, 4), solid(['#ff4f8b', '#f2a516', '#3d7bff'][k % 3]), p.position.x, p.position.y + 0.21, 0.05, false));
  });
  // sticky notes on the critique
  [[-1.1, 1.05, '#ffe066'], [0.95, 1.12, '#ffb3c7'], [0.1, 0.98, '#b8f0d3']].forEach(([x, y, col]) => board.add(mesh(new THREE.PlaneGeometry(0.14, 0.14), solid(col, { roughness: 0.9 }), x, y, 0.036, false)));
  collider(S, 0.9, bAt[0] + 0.7 * Math.cos(bRot), bAt[1] - 0.7 * Math.sin(bRot));
  collider(S, 0.9, bAt[0] - 0.7 * Math.cos(bRot), bAt[1] + 0.7 * Math.sin(bRot));
  // ---- the writers' wall ----
  const wAt = [7.0, 1.8];
  const wall = new THREE.Group();
  const wRot = face(wAt[0], wAt[1], 0, 2.6);
  place(S, wall, wAt[0], wAt[1], wRot);
  const ed = editorialTexture(color);
  const plays = CAMPAIGNS.filter((cp) => PLAYS[cp.slug] && PROJECTS[cp.slug]);
  ed.paint(plays[0], 5, 1);
  wall.add(mesh(new THREE.BoxGeometry(4.9, 2.45, 0.1), WHITE_METAL, 0, 1.68, -0.06));
  wall.add(mesh(new THREE.PlaneGeometry(4.7, 2.25), new THREE.MeshBasicMaterial({ map: ed.tex, toneMapped: false }), 0, 1.68, 0.002, false));
  for (const sx of [-1, 1]) wall.add(mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), WHITE_METAL, sx * 2.2, 0.25, -0.06));
  wall.add(mesh(new THREE.BoxGeometry(4.9, 0.05, 0.03), glow(color, 1.8), 0, 2.93, -0.02, false));
  for (const x of [-1.6, 0, 1.6]) collider(S, 0.9, wAt[0] + x * Math.cos(wRot), wAt[1] - x * Math.sin(wRot));
  // a writer's table beside it
  const wtAt = [5.4, 3.9];
  const wt = new THREE.Group();
  place(S, wt, wtAt[0], wtAt[1], face(wtAt[0], wtAt[1], wAt[0], wAt[1]));
  wt.add(K.table(1.2, 0.65, 0.75));
  wt.add(K.laptop(new THREE.MeshBasicMaterial({ map: tex('work/bh/love-story-1.jpg'), toneMapped: false })).translateY(0.75).translateZ(0.05));
  wt.add(K.papers(6).translateY(0.75).translateX(0.38));
  wt.add(K.cup('#f2a516').translateY(0.75).translateX(-0.42));
  wt.add(K.stool(0.5).translateZ(0.55));
  collider(S, 0.75, wtAt[0], wtAt[1]);

  // ---- the people ----
  const ppl = (o = {}) => crew(r, color, o);
  const leadP = ppl({ style: 'blazer', top: color, beard: true });
  const designerP = ppl({ fem: true, style: 'overshirt' });
  const junior = ppl({ style: 'streetwear', accessory: 'glasses' });
  const mentee = ppl({ fem: true, style: 'kurta' });
  const coord = ppl({ style: 'linen' });
  const writer = ppl({ fem: true, style: 'overshirt', accessory: 'glasses' });
  const partner = ppl({ style: 'hoodie' });
  const scribe = ppl({ style: 'overshirt' });
  const boardFace = (x, z) => face(x, z, bAt[0], bAt[1]);
  const wallFace = (x, z) => face(x, z, wAt[0], wAt[1]);
  const wtSeat = [wtAt[0] + 0.55 * Math.sin(face(wtAt[0], wtAt[1], wAt[0], wAt[1]) + Math.PI), wtAt[1] + 0.55 * Math.cos(face(wtAt[0], wtAt[1], wAt[0], wAt[1]) + Math.PI)];
  const actors = [
    { p: leadP, who: 'Creative lead', say: "I'm presenting the work on the pin-up board for the review.", at: [-2.05, -1.55], face: boardFace(-2.05, -1.55), steps: [{ t: 0, do: 'present' }, { t: 7, do: 'discuss', face: face(-2.05, -1.55, tAt[0], tAt[1]) }, { t: 14, do: 'point', face: boardFace(-2.05, -1.55) }, { t: 19, do: 'present' }] },
    { p: designerP, who: 'Designer', say: "My work is up on the board. I'm taking the feedback.", at: [-2.75, -1.0], face: boardFace(-2.75, -1.0), steps: [{ t: 0, do: 'listen' }, { t: 9, do: 'point' }, { t: 13, do: 'discuss', face: face(-2.75, -1.0, -2.05, -1.55) }, { t: 20, do: 'listen', face: boardFace(-2.75, -1.0) }] },
    { p: junior, who: 'Junior designer', say: "I'm writing down every note from the crit.", at: [0.75, -0.55], face: face(0.75, -0.55, tAt[0], tAt[1] - 1), steps: [{ t: 0, do: 'write' }, { t: 6, do: 'listen', face: face(0.75, -0.55, -2.05, -1.55) }, { t: 12, do: 'write', face: face(0.75, -0.55, tAt[0], tAt[1] - 1) }] },
    { p: mentee, who: 'Mentee', say: "I'm studying the prints on the table up close.", at: [1.85, -1.6], face: face(1.85, -1.6, tAt[0], tAt[1]), steps: [{ t: 0, do: 'listen' }, { t: 10, do: 'inspect' }, { t: 16, do: 'discuss', face: face(1.85, -1.6, -2.05, -1.55) }, { t: 22, do: 'listen', face: face(1.85, -1.6, tAt[0], tAt[1]) }] },
    { p: coord, who: 'Studio coordinator', say: "I'm keeping track of the review and who's up next.", at: [-0.9, -0.5], face: face(-0.9, -0.5, tAt[0], tAt[1]), steps: [{ t: 0, do: 'monitor' }, { t: 5, do: 'idle', to: [5.3, 1.05], face: wallFace(5.3, 1.05) }, { t: 10.5, do: 'listen' }, { t: 15, do: 'idle', to: [-0.9, -0.5], face: face(-0.9, -0.5, tAt[0], tAt[1]) }, { t: 20.5, do: 'monitor' }] },
    { p: writer, who: 'Copywriter', say: "I'm writing the campaign up on the wall: brief, problem, idea, craft.", at: [6.3, 0.95], face: wallFace(6.3, 0.95), steps: [{ t: 0, do: 'writeboard' }, { t: 9, do: 'think' }, { t: 13, do: 'writeboard' }] },
    { p: partner, who: 'Strategist', say: "I'm talking the idea through with the writer.", at: [5.9, 2.75], face: wallFace(5.9, 2.75), steps: [{ t: 0, do: 'listen' }, { t: 6, do: 'discuss' }, { t: 14, do: 'point' }, { t: 18, do: 'listen' }] },
    { p: scribe, who: 'Writer', say: "I'm typing up the campaign story.", at: wtSeat, face: face(wtAt[0], wtAt[1], wAt[0], wAt[1]) + Math.PI + Math.PI, y: 0.02, steps: [{ t: 0, do: 'typesit' }, { t: 11, do: 'sitrest' }, { t: 14, do: 'typesit' }] },
  ];
  let shownKey = '';
  bake(S);
  const scene = createScene({
    color,
    anchor: S,
    cycle: 24,
    offset: 3,
    playerPos,
    actors,
    tick: (c, t) => {
      proto.rotation.y = t * 0.4;
      // one campaign every 15 s: the cards go up one by one, then it holds
      const n = Math.floor(t / 15) % plays.length;
      const k = t % 15;
      const shown = Math.min(5, 1 + Math.floor(k / 1.6));
      const drop = Math.min(1, (k % 1.6) / 0.5);
      const key = `${n}|${shown}|${shown < 5 || k < 8.5 ? Math.round(drop * 4) : 'h'}`;
      if (key !== shownKey) {
        shownKey = key;
        ed.paint(plays[n], shown, shown < 5 || k < 8.5 ? drop : 1);
      }
    },
  });
  for (const a of actors) if (!a.steps.some((s) => s.to)) collider(S, 0.3, a.at[0], a.at[1]);
  updaters.push(scene);
  return S;
}
