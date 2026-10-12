// Two hidden places, off every path: the Grofers years in the woods (an orange pavilion under an
// onion dome, the vegetable and the Jaipur roofline in one) and the Razorpay years by the sea (a
// white pavilion with a giant ₹ coin turning above it). Each is an open ring of columns with that
// era's work on screens inside, a signboard, and a career sheet you open at its centre.
import * as THREE from 'three';
import manifest from './content/billboards.json';
import { CAREERS, PROJECTS } from './data.js';
import { groundAt, coastR, SEA_LEVEL } from './world.js';
import { WHITE_METAL, GOLD, solid, glow, mesh, canvasTexture } from './materials.js';
import { makeSignboard, makeChhatri, INDIGO, PINK } from './jaipur.js';
import { FONT, fit, fitWrap, projectPlateTexture } from './type.js';

const loader = new THREE.TextureLoader();
const LITE = new URLSearchParams(location.search).has('lite') || matchMedia('(hover: none)').matches;
function imageFor(slug) {
  const item = manifest.land.find((x) => x.slug === slug);
  const src = item ? (LITE ? item.src.replace('assets/img/bb/', 'assets/img/bb/s/') : item.src) : PROJECTS[slug].images[0];
  const t = loader.load(src);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// where a place can stand: the highest ground under its plinth, and how much it slopes
function siteAt(x, z, r) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const y = groundAt(x + Math.cos(a) * r, z + Math.sin(a) * r);
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  const yc = groundAt(x, z);
  return { lo: Math.min(lo, yc), hi: Math.max(hi, yc) };
}

// the shared shell: a stepped plinth, a ring of columns, an entablature, screens in the back bays
function pavilion({ career, columnMat, ringMat, plinthMat, accent, clickables }) {
  const g = new THREE.Group();
  const R = 5.6;
  // plinth with a skirt that runs into the ground, so it never floats on a slope
  g.add(mesh(new THREE.CylinderGeometry(7.2, 7.6, 3, 40), plinthMat, 0, -1.35, 0));
  g.add(mesh(new THREE.CylinderGeometry(7.9, 8.3, 0.18, 40), plinthMat, 0, -0.18, 0));
  // eight columns; the bay facing the island is the way in
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.sin(a) * R;
    const z = Math.cos(a) * R;
    g.add(mesh(new THREE.CylinderGeometry(0.26, 0.3, 4.4, 14), columnMat, x, 2.35, z));
    g.add(mesh(new THREE.BoxGeometry(0.75, 0.22, 0.75), plinthMat, x, 0.2, z));
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), plinthMat, x, 4.6, z));
  }
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.55, R + 0.55, 0.7, 48, 1, true), ringMat);
  ring.position.y = 5;
  ring.material.side = THREE.DoubleSide;
  g.add(ring);
  g.add(mesh(new THREE.CylinderGeometry(R + 0.75, R + 0.75, 0.16, 48), plinthMat, 0, 5.42, 0));
  const strip = new THREE.Mesh(new THREE.TorusGeometry(R + 0.57, 0.05, 6, 64), glow(accent, 2));
  strip.rotation.x = Math.PI / 2;
  strip.position.y = 4.68;
  g.add(strip);
  // the era's work on screens in the five back bays, facing in
  const bays = [3, 4, 5, 6, 7].map((k) => (k / 8) * Math.PI * 2);
  career.projects.slice(0, bays.length).forEach((slug, i) => {
    const a = bays[i];
    const x = Math.sin(a) * (R - 0.15);
    const z = Math.cos(a) * (R - 0.15);
    const panel = new THREE.Group();
    panel.position.set(x, 0, z);
    panel.rotation.y = a + Math.PI;
    panel.add(mesh(new THREE.BoxGeometry(3.95, 2.45, 0.12), WHITE_METAL, 0, 2.55, -0.08));
    const img = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.08), new THREE.MeshBasicMaterial({ map: imageFor(slug), toneMapped: false }));
    img.position.set(0, 2.7, 0);
    img.userData = { slug, dynamic: true };
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 0.74), new THREE.MeshBasicMaterial({ map: projectPlateTexture(PROJECTS[slug], accent, 5), toneMapped: false }));
    plate.position.set(0, 1.3, 0.01);
    plate.userData = { slug, dynamic: true };
    panel.add(img, plate);
    clickables.push(img, plate);
    g.add(panel);
  });
  return g;
}

// a signboard out front: org, years, role, and what to do here
function careerSign(career) {
  const front = (c, w, h) => {
    const pad = 96;
    c.textBaseline = 'top';
    c.fillStyle = career.color;
    c.fillRect(pad, 104, 46, 12);
    c.fillStyle = INDIGO;
    if ('letterSpacing' in c) c.letterSpacing = '5px';
    fit(c, `${career.years.toUpperCase()} · ${career.place.toUpperCase()}`, { weight: 400, size: 32, min: 16, family: FONT.mono, maxW: w - pad * 2 - 70 });
    c.fillText(`${career.years.toUpperCase()} · ${career.place.toUpperCase()}`, pad + 66, 96);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = '#2a1d14';
    fit(c, career.org, { weight: 800, size: 130, min: 60, maxW: w - pad * 2 });
    c.fillText(career.org, pad, 158);
    c.fillStyle = '#5b4637';
    fit(c, career.role, { weight: 600, size: 46, min: 24, family: FONT.sans, maxW: w - pad * 2 });
    c.fillText(career.role, pad, 320);
    c.fillStyle = '#2a1d14';
    const { size, lines } = fitWrap(c, career.headline, { weight: 700, size: 56, min: 34, maxW: w - pad * 2, maxLines: 2, family: FONT.display });
    lines.forEach((l, i) => c.fillText(l, pad, 410 + i * size * 1.1));
    c.fillStyle = career.color;
    c.font = `600 36px ${FONT.sans}`;
    c.fillText('Step inside and press E to read the story →', pad, h - 132);
  };
  const back = (c, w, h) => {
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#2a1d14';
    fit(c, career.org, { weight: 800, size: 120, min: 50, maxW: w - 220 });
    c.fillText(career.org, w / 2, h * 0.44);
    c.fillStyle = career.color;
    fit(c, career.years, { weight: 600, size: 46, min: 24, family: FONT.sans, maxW: w - 260 });
    c.fillText(career.years, w / 2, h * 0.64);
  };
  return makeSignboard({ name: `career-sign-${career.id}`, color: career.color, W: 3.6, H: 2.2, front, back });
}

// ---------- Grofers: orange, an onion dome, vegetables growing round the plinth ----------
function buildGrofers(clickables) {
  const C = CAREERS.grofers;
  const orange = solid('#f7913a', { roughness: 0.75, emissive: '#f7913a', emissiveIntensity: 0.12 });
  const deep = solid('#e06f1c', { roughness: 0.8 });
  const g = pavilion({ career: C, columnMat: orange, ringMat: deep, plinthMat: solid('#f3e3c4', { roughness: 0.9 }), accent: C.color, clickables });
  // the onion dome: a lathe with the bulb and the pointed neck of an onion, striped like its skins
  const prof = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const y = t * 6.2;
    const r = Math.max(0.02, 4.6 * Math.sin(Math.PI * Math.min(1, t * 1.25)) ** 0.75 * (1 - t * 0.35) + (t < 0.08 ? 1.6 * (1 - t / 0.08) : 0));
    prof.push(new THREE.Vector2(t > 0.96 ? 0.02 : r, y));
  }
  const skins = canvasTexture(512, 64, (c, w, h) => {
    for (let k = 0; k < 16; k++) {
      c.fillStyle = k % 2 ? '#b2366b' : '#c94a7c';
      c.fillRect((k / 16) * w, 0, w / 16 + 1, h);
      c.fillStyle = 'rgba(255,230,240,0.35)';
      c.fillRect((k / 16) * w + w / 32, 0, 2, h);
    }
  });
  const dome = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), new THREE.MeshStandardMaterial({ map: skins, roughness: 0.45, emissive: '#7a1f48', emissiveIntensity: 0.15 }));
  dome.position.y = 5.5;
  dome.castShadow = true;
  g.add(dome);
  // green shoots from the tip
  const leaf = solid('#4f9a33', { roughness: 0.7 });
  for (let k = 0; k < 4; k++) {
    const s = mesh(new THREE.ConeGeometry(0.16, 2.2, 6), leaf, Math.cos(k * 1.6) * 0.25, 12.4, Math.sin(k * 1.6) * 0.25);
    s.rotation.set(Math.sin(k * 1.6) * 0.35, 0, Math.cos(k * 1.6) * 0.35);
    g.add(s);
  }
  // giant vegetables planted round the plinth
  const carrot = new THREE.Group();
  carrot.add(mesh(new THREE.ConeGeometry(0.55, 3.2, 10), solid('#f26a1b', { roughness: 0.6 }), 0, 1.0, 0));
  carrot.children[0].rotation.x = Math.PI;
  for (let k = 0; k < 5; k++) {
    const l = mesh(new THREE.ConeGeometry(0.12, 1.4, 5), leaf, Math.cos(k * 1.25) * 0.18, 3.1, Math.sin(k * 1.25) * 0.18);
    l.rotation.set(Math.sin(k * 1.25) * 0.4, 0, Math.cos(k * 1.25) * 0.4);
    carrot.add(l);
  }
  carrot.position.set(-8.6, 0, 3.4);
  carrot.rotation.z = 0.25;
  g.add(carrot);
  const tomato = new THREE.Group();
  const tm = mesh(new THREE.SphereGeometry(1.15, 24, 16), solid('#d93a2b', { roughness: 0.35 }), 0, 1.05, 0);
  tm.scale.y = 0.82;
  tomato.add(tm);
  for (let k = 0; k < 5; k++) {
    const s = mesh(new THREE.BoxGeometry(0.12, 0.05, 0.6), leaf, Math.cos(k * 1.26) * 0.28, 2.0, Math.sin(k * 1.26) * 0.28);
    s.rotation.y = -k * 1.26;
    tomato.add(s);
  }
  tomato.position.set(8.4, 0, 2.8);
  g.add(tomato);
  const gourd = new THREE.Group();
  const gb = mesh(new THREE.SphereGeometry(0.9, 18, 12), solid('#7fb53a', { roughness: 0.6 }), 0, 0.85, 0);
  const gt = mesh(new THREE.SphereGeometry(0.55, 16, 10), solid('#8cc044', { roughness: 0.6 }), 0, 2.0, 0);
  gourd.add(gb, gt, mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6), solid('#6b4a2f'), 0, 2.7, 0));
  gourd.position.set(-7.6, 0, -4.8);
  g.add(gourd);
  return { g, career: C, colliders: [[-8.6, 3.4, 0.8], [8.4, 2.8, 1.2], [-7.6, -4.8, 1.0]] };
}

// ---------- Razorpay: white and blue, a ₹ coin turning above ----------
function coinFace() {
  return canvasTexture(512, 512, (c, w, h) => {
    const g = c.createRadialGradient(w * 0.4, h * 0.35, 20, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffe08a');
    g.addColorStop(1, '#c99a2e');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(120,80,10,0.55)';
    c.lineWidth = 10;
    c.beginPath();
    c.arc(w / 2, h / 2, w / 2 - 26, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#8a5f12';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    // the ₹ drawn as strokes, since not every font carries the glyph
    const rupee = (dx, dy, colour) => {
      c.save();
      c.translate(dx, dy);
      c.strokeStyle = colour;
      c.lineWidth = 30;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(176, 140); c.lineTo(340, 140); // top bar
      c.moveTo(176, 196); c.lineTo(340, 196); // second bar
      c.moveTo(176, 140); c.lineTo(236, 140); // the bowl
      c.bezierCurveTo(318, 140, 318, 262, 236, 262);
      c.lineTo(180, 262);
      c.lineTo(322, 392); // the leg
      c.stroke();
      c.restore();
    };
    rupee(6, 8, '#8a5f12');
    rupee(0, 0, '#fff2c4');
    c.fillStyle = '#7a520c';
    c.font = `600 34px ${FONT.mono}`;
    c.fillText('RAZORPAY · 2021', w / 2, h - 70);
  });
}
function buildRazorpay(clickables) {
  const C = CAREERS.razorpay;
  const blue = solid('#2f6bff', { roughness: 0.4, metalness: 0.2, emissive: '#2f6bff', emissiveIntensity: 0.15 });
  const g = pavilion({ career: C, columnMat: WHITE_METAL, ringMat: blue, plinthMat: solid('#eef2f7', { roughness: 0.6 }), accent: C.color, clickables });
  // a shallow glass roof under the coin
  g.add(mesh(new THREE.CylinderGeometry(5.9, 6.3, 0.3, 48), new THREE.MeshPhysicalMaterial({ color: '#cfe6ff', roughness: 0.1, transmission: 0.4, transparent: true, opacity: 0.7 }), 0, 5.65, 0, false));
  // the coin, upright, turning slowly
  const coin = new THREE.Group();
  coin.position.y = 10.2;
  const face = coinFace();
  // the cap's UVs turn with the disc; turn the face back upright
  face.center.set(0.5, 0.5);
  face.rotation = Math.PI / 2;
  const faceMat = new THREE.MeshStandardMaterial({ map: face, roughness: 0.3, metalness: 0.6, emissive: '#6b4a10', emissiveIntensity: 0.2 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.5, 64), [GOLD, faceMat, faceMat]);
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  coin.add(disc);
  // reeded edge
  const reed = new THREE.Mesh(new THREE.TorusGeometry(3.22, 0.06, 6, 96), GOLD);
  coin.add(reed);
  g.add(coin);
  // a slim mast from the roof to the coin
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 10), WHITE_METAL, 0, 6.6, 0));
  return { g, career: C, coin, colliders: [] };
}

// where the two pavilions stand; worked out from the terrain alone, so other builders (the sky
// rail) can keep their own pieces out of the way
let SITES = null;
export function hiddenSites() {
  if (SITES) return SITES;
  const deg = THREE.MathUtils.degToRad;
  SITES = [];
  // the Grofers years: deep in the north-east woods
  {
    const a = deg(38);
    let r = 126;
    for (; r > 112; r -= 2) {
      const s = siteAt(Math.cos(a) * r, Math.sin(a) * r, 8.5);
      if (s.lo > SEA_LEVEL + 3 && s.hi - s.lo < 3) break;
    }
    SITES.push({ id: 'grofers', x: Math.cos(a) * r, z: Math.sin(a) * r });
  }
  // the Razorpay years: on the shore, looking out to sea
  {
    const a = deg(20);
    let r = coastR(a) - 12;
    for (; r > coastR(a) - 30; r -= 1) {
      const s = siteAt(Math.cos(a) * r, Math.sin(a) * r, 8.5);
      if (s.lo > SEA_LEVEL + 1.4 && s.hi - s.lo < 3) break;
    }
    SITES.push({ id: 'razorpay', x: Math.cos(a) * r, z: Math.sin(a) * r });
  }
  return SITES;
}

export function buildHidden(scene, { colliders, interactables, clickables }) {
  const BUILD = { grofers: buildGrofers, razorpay: buildRazorpay };
  const places = hiddenSites().map((s) => ({ ...s, build: BUILD[s.id] }));
  const spots = [];
  const spinning = [];
  for (const p of places) {
    const { g, career, coin, colliders: extra } = p.build(clickables);
    const site = siteAt(p.x, p.z, 7.5);
    g.position.set(p.x, site.hi + 0.15, p.z);
    // the way in faces the island
    const rot = Math.atan2(-p.x, -p.z);
    g.rotation.y = rot;
    g.name = `hidden:${career.id}`;
    scene.add(g);
    const sign = careerSign(career);
    sign.position.set(0, 0, 10.5);
    g.add(sign);
    g.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    const toWorld = (x, z) => v.set(x, 0, z).applyMatrix4(g.matrixWorld).clone();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const w = toWorld(Math.sin(a) * 5.6, Math.cos(a) * 5.6);
      colliders.push({ x: w.x, z: w.z, r: 0.42 });
    }
    for (const [x, z, r] of extra) {
      const w = toWorld(x, z);
      colliders.push({ x: w.x, z: w.z, r });
    }
    for (const d of [-1.86, 1.86]) {
      const w = toWorld(d, 10.5);
      colliders.push({ x: w.x, z: w.z, r: 0.35 });
    }
    const centre = toWorld(0, 0);
    interactables.push({ kind: 'career', id: career.id, label: `${career.org}, ${career.years}`, verb: 'Read the story', x: centre.x, z: centre.z });
    const front = toWorld(0, 9.2);
    interactables.push({ kind: 'career', id: career.id, label: career.org, verb: 'Read the story', x: front.x, z: front.z });
    spots.push({ id: career.id, x: centre.x, z: centre.z, y: g.position.y, career, group: g });
    if (coin) spinning.push(coin);
  }
  return {
    spots,
    update(t) {
      for (const c of spinning) {
        c.rotation.y = t * 0.6;
        c.position.y = 10.2 + Math.sin(t * 1.2) * 0.25;
      }
    },
  };
}
