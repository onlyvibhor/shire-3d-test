// Two hidden places, off every path: the Grofers years in the woods (an orange pavilion with a
// giant grocery bag on its roof, the Grofers logo turning above) and the Razorpay years by the sea
// (a white pavilion with the Razorpay logo turning above it). Each is an open ring of columns with that
// era's work on screens inside, a signboard, and a career sheet you open at its centre.
import * as THREE from 'three';
import manifest from './content/billboards.json';
import { CAREERS, PROJECTS } from './data.js';
import { groundAt, coastR, SEA_LEVEL } from './world.js';
import { WHITE_METAL, solid, glow, mesh, canvasTexture } from './materials.js';
import { makeSignboard, makeChhatri, INDIGO, PINK } from './jaipur.js';
import { FONT, fit, fitWrap, projectPlateTexture } from './type.js';
import { razorpayLogo, grofersLogo } from './logo3d.js';

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

// ---------- Grofers: orange, a giant grocery bag on top, vegetables round the plinth ----------
function buildGrofers(clickables) {
  const C = CAREERS.grofers;
  const orange = solid('#f7913a', { roughness: 0.75, emissive: '#f7913a', emissiveIntensity: 0.12 });
  const deep = solid('#e06f1c', { roughness: 0.8 });
  const g = pavilion({ career: C, columnMat: orange, ringMat: deep, plinthMat: solid('#f3e3c4', { roughness: 0.9 }), accent: C.color, clickables });
  // a giant grocery bag on the roof: kraft paper with an orange band, rope handles and the week's
  // shopping poking out of the top
  const leaf = solid('#4f9a33', { roughness: 0.7 });
  const kraft = solid('#ecc48c', { roughness: 0.85, emissive: '#5a3a14', emissiveIntensity: 0.25 });
  const kraftDark = solid('#d4a468', { roughness: 0.85, emissive: '#5a3a14', emissiveIntensity: 0.2 });
  const print = canvasTexture(512, 360, (c, w, h) => {
    c.fillStyle = '#ecc48c';
    c.fillRect(0, 0, w, h);
    // paper fibres
    for (let k = 0; k < 220; k++) {
      c.fillStyle = `rgba(120,85,40,${0.04 + Math.random() * 0.06})`;
      c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 30, 1);
    }
    c.fillStyle = '#ff7f1f';
    c.fillRect(0, h * 0.42, w, h * 0.3);
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 92px ${FONT.display}`;
    c.fillText('grofers', w / 2, h * 0.57);
  });
  const printMat = new THREE.MeshStandardMaterial({ map: print, roughness: 0.85, emissive: '#ffffff', emissiveMap: print, emissiveIntensity: 0.22 });
  const BW = 6.6;
  const BD = 4.2;
  const BH = 4.6;
  const bagGeo = new THREE.BoxGeometry(BW, BH, BD, 1, 4, 1);
  // a slight flare towards the top, like a filled paper bag
  const bp = bagGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const t = (bp.getY(i) + BH / 2) / BH;
    const f = 0.94 + 0.08 * t;
    bp.setX(i, bp.getX(i) * f);
    bp.setZ(i, bp.getZ(i) * f);
  }
  bagGeo.computeVertexNormals();
  const inside = solid('#5a4126', { roughness: 1 });
  const bag = new THREE.Mesh(bagGeo, [kraft, kraft, inside, kraft, printMat, printMat]);
  bag.position.y = 5.3 + BH / 2;
  bag.castShadow = true;
  g.add(bag);
  const top = 5.3 + BH;
  // folded rim
  g.add(mesh(new THREE.BoxGeometry(BW * 1.03, 0.28, BD * 1.03), kraftDark, 0, top - 0.14, 0));
  // rope handles on the two long faces
  const rope = solid('#7a5634', { roughness: 0.8 });
  for (const sz of [-1, 1]) {
    const h = mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 24, Math.PI), rope, 0, top - 0.05, sz * (BD * 0.51 + 0.02));
    g.add(h);
  }
  // the shopping: leafy greens, carrots, a milk bottle and a bunch of bananas
  for (let k = 0; k < 7; k++) {
    const l = mesh(new THREE.SphereGeometry(0.7, 10, 8), k % 2 ? leaf : solid('#62ad3d', { roughness: 0.7 }), -1.8 + (k % 4) * 0.5, top + 0.35 + (k % 3) * 0.2, -0.9 + Math.floor(k / 4) * 0.9);
    l.scale.set(1, 0.7, 0.9);
    g.add(l);
  }
  for (const [x, z, rz] of [[0.6, -0.8, -0.35], [1.1, -0.4, -0.55]]) {
    const ct = new THREE.Group();
    const body = mesh(new THREE.ConeGeometry(0.28, 2.2, 10), solid('#f26a1b', { roughness: 0.6 }), 0, 0, 0);
    body.rotation.x = Math.PI;
    ct.add(body);
    for (let k = 0; k < 4; k++) {
      const l = mesh(new THREE.ConeGeometry(0.07, 0.8, 5), leaf, Math.cos(k * 1.6) * 0.08, 1.45, Math.sin(k * 1.6) * 0.08);
      l.rotation.set(Math.sin(k * 1.6) * 0.4, 0, Math.cos(k * 1.6) * 0.4);
      ct.add(l);
    }
    ct.position.set(x, top + 0.6, z);
    ct.rotation.z = rz;
    g.add(ct);
  }
  const milk = new THREE.Group();
  milk.add(mesh(new THREE.CylinderGeometry(0.42, 0.45, 1.8, 16), solid('#f7f7f2', { roughness: 0.4 }), 0, 0, 0));
  milk.add(mesh(new THREE.CylinderGeometry(0.26, 0.4, 0.35, 16), solid('#f7f7f2', { roughness: 0.4 }), 0, 1.07, 0));
  milk.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.18, 16), solid('#2f6bff', { roughness: 0.5 }), 0, 1.33, 0));
  milk.position.set(1.9, top + 0.3, 0.7);
  milk.rotation.z = -0.15;
  g.add(milk);
  const banana = solid('#f4d23c', { roughness: 0.55 });
  for (let k = 0; k < 4; k++) {
    const b = mesh(new THREE.TorusGeometry(0.75, 0.16, 8, 16, Math.PI * 0.75), banana, -0.4 + k * 0.12, top + 0.55, 0.9 + k * 0.08);
    b.rotation.set(0.3, 0.4 + k * 0.12, 0.6 + k * 0.1);
    g.add(b);
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
  carrot.userData.onGround = true;
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
  tomato.userData.onGround = true;
  g.add(tomato);
  const gourd = new THREE.Group();
  const gb = mesh(new THREE.SphereGeometry(0.9, 18, 12), solid('#7fb53a', { roughness: 0.6 }), 0, 0.85, 0);
  const gt = mesh(new THREE.SphereGeometry(0.55, 16, 10), solid('#8cc044', { roughness: 0.6 }), 0, 2.0, 0);
  gourd.add(gb, gt, mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6), solid('#6b4a2f'), 0, 2.7, 0));
  gourd.position.set(-7.6, 0, -4.8);
  gourd.userData.onGround = true;
  g.add(gourd);
  // the Grofers logo, from the brand artwork, turning slowly above the bag
  const logo = grofersLogo(8.5);
  logo.userData.baseY = 13.4;
  logo.position.y = logo.userData.baseY;
  g.add(logo);
  return { g, career: C, coin: logo, colliders: [[-8.6, 3.4, 0.8], [8.4, 2.8, 1.2], [-7.6, -4.8, 1.0]] };
}

// ---------- Razorpay: white and blue, the logo turning above ----------
function buildRazorpay(clickables) {
  const C = CAREERS.razorpay;
  const blue = solid('#2f6bff', { roughness: 0.4, metalness: 0.2, emissive: '#2f6bff', emissiveIntensity: 0.15 });
  const g = pavilion({ career: C, columnMat: WHITE_METAL, ringMat: blue, plinthMat: solid('#eef2f7', { roughness: 0.6 }), accent: C.color, clickables });
  // a shallow glass roof under the logo
  g.add(mesh(new THREE.CylinderGeometry(5.9, 6.3, 0.3, 48), new THREE.MeshStandardMaterial({ color: '#cfe6ff', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.6, depthWrite: false }), 0, 5.65, 0, false));
  // the Razorpay logo, from the brand artwork, turning slowly above the roof
  const coin = razorpayLogo(9);
  coin.userData.baseY = 9.2;
  coin.position.y = coin.userData.baseY;
  g.add(coin);
  // a slim mast from the roof to the logo
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.6, 10), WHITE_METAL, 0, 7.1, 0));
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
    // the giant vegetables stand on the meadow round the plinth, not at plinth height
    for (const c of g.children) {
      if (!c.userData.onGround) continue;
      const w = c.getWorldPosition(new THREE.Vector3());
      c.position.y = groundAt(w.x, w.z) - g.position.y - 0.1;
    }
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
        c.rotation.y = t * 0.35;
        c.position.y = c.userData.baseY + Math.sin(t * 1.2) * 0.25;
      }
    },
  };
}
