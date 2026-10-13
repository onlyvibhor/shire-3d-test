// Jaipur on the island: cusped Rajput arches, chhatris, the Jantar Mantar observatory,
// Nahargarh-style fort walls on the ridge, a pink old-city bazaar, bicycles and Sankranti kites.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HAMLETS } from './data.js';
import { groundAt, walkY, rng, coastR, JANTAR, BAZAAR } from './world.js';
import { solid, mesh, canvasTexture, deepMerge, WHITE_METAL, DARK, WOOD } from './materials.js';
import { FONT, fit, fitWrap, wrap } from './type.js';
import { makePerson, animate } from './characters.js';
import { sfx } from './audio.js';
import { playerPos } from './village.js';

export const PINK = '#df8a6c';
export const OCHRE = '#f7913a';
export const SAND = '#f6bf78';
export const LIME = '#f6efe0';

function collider(parent, r, x = 0, z = 0) {
  const o = new THREE.Object3D();
  o.position.set(x, 0, z);
  o.userData.collider = r;
  parent.add(o);
}

// ---------- The cusped (multifoil) arch ----------

// Outline of a pointed, scalloped arch opening: from (-a, 0) up to the spring line, round the lobes, down to (a, 0).
export function cuspedArchPoints(a, spring, lobes = 7, depth = 0.16) {
  const R = 1.25 * a;
  const cx = -a + R;
  const phi = Math.acos((a - R) / R);
  const left = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = Math.PI - (i / N) * (Math.PI - phi);
    left.push([cx + R * Math.cos(t), spring + R * Math.sin(t)]);
  }
  const curve = [...left, ...left.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
  // resample into lobes that bite outward into the wall, leaving sharp cusps between them
  const pts = [[-a, 0]];
  const per = (curve.length - 1) / lobes;
  for (let l = 0; l < lobes; l++) {
    const i0 = Math.round(l * per);
    const i1 = Math.round((l + 1) * per);
    const [x0, y0] = curve[i0];
    const [x1, y1] = curve[i1];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    let nx = mx - 0;
    let ny = my - spring * 0.6;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const span = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 0; s <= 6; s++) {
      const u = s / 6;
      const bump = Math.sin(u * Math.PI) * span * depth * 2.2;
      pts.push([x0 + (x1 - x0) * u + nx * bump, y0 + (y1 - y0) * u + ny * bump]);
    }
  }
  pts.push([a, 0]);
  return pts;
}

export function pathFrom(points, PathClass = THREE.Path) {
  const p = new PathClass();
  p.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) p.lineTo(points[i][0], points[i][1]);
  p.closePath();
  return p;
}

// A wall slab with a cusped arch cut through it.
export function archSlab(w, h, a, spring, depth, mat, { lobes = 7 } = {}) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h);
  s.lineTo(-w / 2, h);
  s.closePath();
  const hole = cuspedArchPoints(a, spring, lobes);
  // lift the hole a hair so the slab keeps a closed bottom edge either side
  s.holes.push(pathFrom(hole.map(([x, y]) => [x, Math.max(y, 0.001)])));
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 });
  geo.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geo, mat);
}

// ---------- Painted textures ----------

const texCache = {};
// Yellow plaster with rows of blind arched niches, like the observatory walls.
function nicheTexture(base, shade) {
  const key = base + shade;
  return (texCache[key] ||= (() => {
    const t = canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = base;
      c.fillRect(0, 0, w, h);
      c.fillStyle = shade;
      const a = cuspedArchPoints(46, 120, 5, 0.12);
      c.beginPath();
      a.forEach(([x, y], i) => (i ? c.lineTo(w / 2 + x, h - 30 - y) : c.moveTo(w / 2 + x, h - 30 - y)));
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(0, h - 14, w, 4);
      c.fillStyle = 'rgba(80,40,10,0.08)';
      for (let k = 0; k < 40; k++) c.fillRect((k * 53) % w, (k * 97) % h, 30, 2);
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  })());
}
const matCache = {};
export function nicheMat(rx, ry, base = SAND, shade = '#c99a4c') {
  const key = `${rx}|${ry}|${base}`;
  return (matCache[key] ||= (() => {
    const map = nicheTexture(base, shade).clone();
    map.repeat.set(rx, ry);
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, roughness: 0.9, emissive: base, emissiveIntensity: 0.1 });
  })());
}

// The painted flower panels either side of a palace door.
function floralTexture(bg = '#f1cf5a') {
  return (texCache['floral' + bg] ||= canvasTexture(256, 384, (c, w, h) => {
    c.fillStyle = '#f7f0dc';
    c.fillRect(0, 0, w, h);
    c.fillStyle = bg;
    c.fillRect(18, 18, w - 36, h - 36);
    c.strokeStyle = '#3d5f9e';
    c.lineWidth = 8;
    c.strokeRect(10, 10, w - 20, h - 20);
    c.strokeStyle = '#2f6b3a';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(w / 2, h - 40);
    c.bezierCurveTo(w / 2 - 30, h * 0.6, w / 2 + 30, h * 0.4, w / 2, 70);
    c.stroke();
    const flower = (x, y, col) => {
      c.fillStyle = col;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        c.beginPath();
        c.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#f2c94c';
      c.beginPath();
      c.arc(x, y, 5, 0, Math.PI * 2);
      c.fill();
    };
    [[w / 2, 70, '#d64545'], [w / 2 - 50, 140, '#e48b78'], [w / 2 + 50, 170, '#d64545'], [w / 2 - 45, 240, '#7b5cff'], [w / 2 + 48, 270, '#e48b78'], [w / 2, 320, '#d64545']].forEach(([x, y, col]) => {
      c.strokeStyle = '#2f6b3a';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(w / 2, y + 10);
      c.lineTo(x, y);
      c.stroke();
      flower(x, y, col);
    });
  }));
}

// ---------- Chhatri: the little domed pavilion on every Rajput roofline ----------

const chhatriParts = {};
export function makeChhatri(s = 1, color = LIME) {
  const g = new THREE.Group();
  const mat = solid(color, { roughness: 0.75 });
  g.add(mesh(new THREE.BoxGeometry(1.5 * s, 0.14 * s, 1.5 * s), mat, 0, 0.07 * s, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(mesh(new THREE.CylinderGeometry(0.06 * s, 0.07 * s, 0.9 * s, 8), mat, x * 0.6 * s, 0.6 * s, z * 0.6 * s));
  g.add(mesh(new THREE.BoxGeometry(1.6 * s, 0.12 * s, 1.6 * s), mat, 0, 1.1 * s, 0));
  const domeGeo = (chhatriParts.dome ||= new THREE.LatheGeometry(
    [[0, 0], [0.62, 0], [0.66, 0.12], [0.6, 0.36], [0.42, 0.62], [0.16, 0.82], [0.06, 0.9], [0, 0.92]].map(([x, y]) => new THREE.Vector2(x, y)),
    16
  ));
  const dome = new THREE.Mesh(domeGeo, mat);
  dome.scale.setScalar(s);
  dome.position.y = 1.16 * s;
  dome.castShadow = true;
  g.add(dome);
  g.add(mesh(new THREE.ConeGeometry(0.05 * s, 0.4 * s, 6), solid('#c99a3a', { metalness: 0.6, roughness: 0.35 }), 0, 2.25 * s, 0));
  return g;
}

// A Rajput gateway (pol): a thick slab with a cusped arch, painted panels, niches and chhatris.
export function makePol({ w = 9, h = 8, a = 2.2, spring = 3.4, depth = 1.6, color = OCHRE, accent = '#3d5f9e', chhatris = true, panels = true } = {}) {
  const g = new THREE.Group();
  g.name = 'gate';
  // a little warm self-light keeps sandstone from going olive under the green bounce light
  const wallMat = solid(color, { roughness: 0.85, emissive: color, emissiveIntensity: 0.2 });
  g.add(archSlab(w, h, a, spring, depth, wallMat));
  // a white lime outline around the opening, front and back
  const rim = cuspedArchPoints(a + 0.22, spring, 7, 0.16);
  const inner = cuspedArchPoints(a, spring, 7, 0.16);
  const ringShape = pathFrom(rim, THREE.Shape);
  ringShape.holes.push(pathFrom(inner));
  const ringGeo = new THREE.ShapeGeometry(ringShape, 4);
  for (const z of [depth / 2 + 0.01, -depth / 2 - 0.01]) {
    const m = new THREE.Mesh(ringGeo, solid(LIME));
    m.position.z = z;
    if (z < 0) m.rotation.y = Math.PI;
    g.add(m);
  }
  // cornice and parapet
  g.add(mesh(new THREE.BoxGeometry(w + 0.5, 0.35, depth + 0.5), solid(LIME), 0, h + 0.17, 0));
  for (let x = -w / 2 + 0.3; x <= w / 2 - 0.2; x += 0.75) g.add(mesh(new THREE.BoxGeometry(0.4, 0.45, depth + 0.2), wallMat, x, h + 0.57, 0));
  // painted flower panels and blind niches either side of the arch
  if (panels) {
    const pw = Math.min(1.4, (w / 2 - a - 0.6) * 0.8);
    if (pw > 0.5) {
      for (const sx of [-1, 1]) {
        for (const z of [depth / 2 + 0.02, -depth / 2 - 0.02]) {
          const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, pw * 1.5), new THREE.MeshStandardMaterial({ map: floralTexture(), roughness: 0.8 }));
          p.userData.decor = true;
          p.position.set(sx * (a + 0.5 + (w / 2 - a - 0.5) / 2), spring * 0.55, z);
          if (z < 0) p.rotation.y = Math.PI;
          g.add(p);
        }
      }
    }
    // a small jharokha window above the arch
    const jw = new THREE.Group();
    jw.position.set(0, spring + 1.25 * a + 0.6, depth / 2);
    jw.add(mesh(new THREE.BoxGeometry(1.1, 0.12, 0.45), solid(LIME), 0, 0, 0.18));
    jw.add(mesh(new THREE.BoxGeometry(0.8, 0.7, 0.06), solid(accent), 0, 0.45, 0.03));
    const jd = makeChhatri(0.45, LIME);
    jd.position.set(0, 0.8, 0.12);
    jw.add(jd);
    if (spring + 1.25 * a + 2 < h) {
      g.add(jw);
      // and the same window on the back face, so the gate is finished from both sides
      const back = jw.clone();
      back.position.z = -depth / 2;
      back.rotation.y = Math.PI;
      g.add(back);
    }
  }
  if (chhatris) {
    for (const sx of [-1, 1]) {
      const c = makeChhatri(0.9);
      c.position.set(sx * (w / 2 - 0.6), h + 0.35, 0);
      g.add(c);
    }
  }
  return g;
}

// ---------- Belief signs: a Rajput signboard per place ----------
// Pink sandstone posts with chhatri finials, a cusped crest, and a painted panel in the style of Jaipur's
// blue pottery: cream ground, indigo borders, flowers in the corners, and the belief set in big type.

export const INDIGO = '#22408a';
function flower(c, x, y, r, petal = INDIGO, heart = '#19a7a1') {
  c.fillStyle = petal;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    c.beginPath();
    c.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, r * 0.2, a, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = heart;
  c.beginPath();
  c.arc(x, y, r * 0.3, 0, Math.PI * 2);
  c.fill();
}
function paintedPanel(w, h, draw) {
  return canvasTexture(w, h, (c) => {
    c.fillStyle = '#f6ead2';
    c.fillRect(0, 0, w, h);
    // a little texture in the plaster
    for (let k = 0; k < 500; k++) {
      c.fillStyle = k % 2 ? 'rgba(120,90,50,0.035)' : 'rgba(255,255,255,0.25)';
      c.fillRect((k * 131) % w, (k * 71) % h, 3 + (k % 5), 2);
    }
    // double indigo border, flowers in the corners
    c.strokeStyle = INDIGO;
    c.lineWidth = 10;
    c.strokeRect(26, 26, w - 52, h - 52);
    c.lineWidth = 3;
    c.strokeRect(46, 46, w - 92, h - 92);
    for (const [x, y] of [[46, 46], [w - 46, 46], [46, h - 46], [w - 46, h - 46]]) flower(c, x, y, 30);
    draw(c, w, h);
  });
}
// A Jaipur signboard: pink sandstone posts with chhatri finials, a cusped crest and painted
// panels front and back. `front` and `back` draw on canvases (c, w, h) with the cream ground ready.
export function makeSignboard({ name = 'signboard', color = '#d9a441', W = 3.3, H = 2.05, y0 = 1.0, res = 1500, front, back }) {
  const g = new THREE.Group();
  g.name = name;
  const stone = solid(PINK, { roughness: 0.85, emissive: PINK, emissiveIntensity: 0.12 });
  const lime = solid(LIME, { roughness: 0.8 });
  // posts with caps and chhatri finials
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.32, y0 + H + 0.35, 0.32), stone, sx * (W / 2 + 0.06), (y0 + H + 0.35) / 2, 0));
    g.add(mesh(new THREE.BoxGeometry(0.44, 0.12, 0.44), lime, sx * (W / 2 + 0.06), y0 + H + 0.41, 0));
    const c = makeChhatri(0.32, LIME);
    c.position.set(sx * (W / 2 + 0.06), y0 + H + 0.47, 0);
    g.add(c);
    g.add(mesh(new THREE.BoxGeometry(0.44, 0.18, 0.44), lime, sx * (W / 2 + 0.06), 0.09, 0));
  }
  // the frame: a sandstone board with a cusped crest rising from its top edge
  const crest = cuspedArchPoints(0.62, 0, 5, 0.14);
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-W / 2, 0);
  frameShape.lineTo(W / 2, 0);
  frameShape.lineTo(W / 2, H);
  frameShape.lineTo(0.62, H);
  for (let i = crest.length - 1; i >= 0; i--) frameShape.lineTo(crest[i][0], H + crest[i][1] * 0.55);
  frameShape.lineTo(-W / 2, H);
  frameShape.closePath();
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.14, bevelEnabled: false });
  frameGeo.translate(0, y0, -0.07);
  g.add(new THREE.Mesh(frameGeo, stone));
  // lime-white moulding round the panel
  g.add(mesh(new THREE.BoxGeometry(W - 0.12, 0.06, 0.2), lime, 0, y0 + 0.08, 0));
  g.add(mesh(new THREE.BoxGeometry(W - 0.12, 0.06, 0.2), lime, 0, y0 + H - 0.08, 0));
  // the crest medallion carries the department's colour
  const med = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: color, emissiveIntensity: 0.15 }));
  for (const z of [0.075, -0.075]) {
    const m = med.clone();
    m.position.set(0, y0 + H + 0.26, z);
    if (z < 0) m.rotation.y = Math.PI;
    g.add(m);
  }
  const PW = W - 0.26;
  const PH = H - 0.26;
  const frontTex = paintedPanel(res, Math.round((res * PH) / PW), front);
  const backTex = paintedPanel(res, Math.round((res * PH) / PW), back);
  for (const [tex, z, ry] of [[frontTex, 0.076, 0], [backTex, -0.076, Math.PI]]) {
    // a touch of self-light keeps the painted panel cream, not grey, when it's in shade
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.32 }));
    m.userData.back = z < 0; // the back only carries the place's name
    m.position.set(0, y0 + H / 2, z);
    m.rotation.y = ry;
    m.userData.dynamic = true;
    g.add(m);
  }
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return g;
}

export function makeBeliefSign(place, belief) {
  // front: the belief. back: the place's name
  const front = (c, w, h) => {
    const pad = 104;
    c.textBaseline = 'top';
    // measure the block (eyebrow, belief, supporting line) and centre it in the panel
    const { size, lines } = fitWrap(c, belief.title, { weight: 800, size: 126, min: 54, maxW: w - pad * 2, maxLines: 3 });
    const lh = size * 1.04;
    c.font = `500 42px ${FONT.sans}`;
    const body = wrap(c, belief.body, w - pad * 2 - 40, 2);
    const blockH = 44 + lines.length * lh + 26 + body.length * 54;
    let y = Math.max(96, (h - 70 - blockH) / 2);
    // eyebrow: a short rule in the place's colour, then the label in indigo
    c.fillStyle = place.color;
    c.fillRect(pad, y + 8, 46, 12);
    c.fillStyle = INDIGO;
    if ('letterSpacing' in c) c.letterSpacing = '5px';
    const eyebrow = `WHAT I BELIEVE · ${place.name.toUpperCase()}`;
    fit(c, eyebrow, { weight: 400, size: 32, min: 16, family: FONT.mono, maxW: w - pad * 2 - 70 });
    c.fillText(eyebrow, pad + 66, y);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    y += 64;
    c.fillStyle = '#2a1d14';
    c.font = `800 ${size}px ${FONT.display}`;
    lines.forEach((l, i) => c.fillText(l, pad, y + i * lh));
    y += lines.length * lh + 26;
    c.fillStyle = '#6b5444';
    c.font = `500 42px ${FONT.sans}`;
    body.forEach((l, i) => c.fillText(l, pad, y + i * 54));
    c.fillStyle = INDIGO;
    c.textAlign = 'right';
    c.font = `italic 400 54px ${FONT.serif}`;
    c.fillText('— Vibhor', w - pad, h - 128);
  };
  const back = (c, w, h) => {
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#2a1d14';
    fit(c, place.name, { weight: 800, size: 120, min: 50, maxW: w - 220 });
    c.fillText(place.name, w / 2, h * 0.44);
    c.fillStyle = place.color;
    fit(c, place.place, { weight: 600, size: 46, min: 24, family: FONT.sans, maxW: w - 260 });
    c.fillText(place.place, w / 2, h * 0.64);
  };
  return makeSignboard({ name: `belief-${place.id}`, color: place.color, front, back });
}

// ---------- Jantar Mantar ----------

// A gnomon: a right-angled wall whose sloping edge points at the pole star, with stairs up the slope.
function makeGnomon(L, latitude = 27, thick = 2.2) {
  const g = new THREE.Group();
  const H = L * Math.tan(THREE.MathUtils.degToRad(latitude));
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(L, 0);
  s.lineTo(L, H);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  geo.translate(-L / 2, 0, -thick / 2);
  geo.rotateY(-Math.PI / 2); // slope runs along +z
  const wall = new THREE.Mesh(geo, nicheMat(Math.max(2, Math.round(L / 3)), Math.max(1, Math.round(H / 3.5))));
  wall.castShadow = wall.receiveShadow = true;
  g.add(wall);
  // stairs up the hypotenuse, with low parapets
  const steps = Math.round(L / 0.7);
  const stepMat = solid('#d9b26a', { roughness: 0.9 });
  const stepGeos = [];
  for (let k = 0; k < steps; k++) {
    const u = (k + 0.5) / steps;
    const b = new THREE.BoxGeometry(thick * 0.6, 0.16, L / steps);
    b.translate(0, u * H + 0.02, -L / 2 + u * L);
    stepGeos.push(b);
  }
  const stair = new THREE.Mesh(mergeGeometries(stepGeos), stepMat);
  g.add(stair);
  const len = Math.hypot(L, H);
  for (const sx of [-1, 1]) {
    const rail = mesh(new THREE.BoxGeometry(0.22, 0.45, len), solid(LIME), sx * (thick / 2 - 0.11), H / 2 + 0.25, 0);
    rail.rotation.x = -Math.atan2(H, L);
    g.add(rail);
  }
  const top = makeChhatri(1.1, SAND);
  top.position.set(0, H + 0.1, L / 2 - 0.9);
  g.add(top);
  return { g, H };
}

// A curved marble quadrant: the scale the gnomon's shadow falls on.
function makeQuadrant(R, width, side) {
  const g = new THREE.Group();
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, width, 40, 1, true, 0, Math.PI),
    new THREE.MeshStandardMaterial({
      color: '#f4efe6',
      roughness: 0.4,
      side: THREE.DoubleSide,
      map: canvasTexture(512, 64, (c, w, h) => {
        c.fillStyle = '#f4efe6';
        c.fillRect(0, 0, w, h);
        c.fillStyle = '#5b4a3a';
        for (let k = 0; k <= 60; k++) c.fillRect((k / 60) * w - 1, 0, 2, k % 5 ? h * 0.35 : h * 0.7);
      }),
    })
  );
  band.rotation.z = -Math.PI / 2; // hangs like a bowl below the gnomon's edge
  g.add(band);
  // supporting walls under the arc
  for (let k = 0; k <= 6; k++) {
    const t = (k / 6) * Math.PI;
    const y = R - Math.sin(t) * R;
    const z = Math.cos(t) * R;
    if (y < 0.4) continue;
    g.add(mesh(new THREE.BoxGeometry(width, y, 0.6), nicheMat(1, 1), 0, y / 2 - R, z));
  }
  return g;
}

function makeJaiPrakash(R = 2.8) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(R + 0.5, R + 0.7, 1.3, 32), nicheMat(6, 1), 0, 0.65, 0));
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      side: THREE.BackSide,
      roughness: 0.4,
      map: canvasTexture(256, 128, (c, w, h) => {
        c.fillStyle = '#f4efe6';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#7a634c';
        c.lineWidth = 2;
        for (let k = 0; k < 12; k++) {
          c.beginPath();
          c.moveTo((k / 12) * w, 0);
          c.lineTo((k / 12) * w, h);
          c.stroke();
        }
        for (let k = 1; k < 5; k++) {
          c.beginPath();
          c.moveTo(0, (k / 5) * h);
          c.lineTo(w, (k / 5) * h);
          c.stroke();
        }
      }),
    })
  );
  bowl.position.y = 1.32;
  g.add(bowl);
  g.add(mesh(new THREE.TorusGeometry(R + 0.1, 0.12, 8, 40), solid(LIME), 0, 1.32, 0).rotateX(Math.PI / 2));
  // cross-wires with the little ring whose shadow marks the sun
  for (const ry of [0, Math.PI / 2]) {
    const w = mesh(new THREE.CylinderGeometry(0.015, 0.015, R * 2.2, 4), DARK, 0, 1.4, 0);
    w.rotation.set(0, ry, Math.PI / 2);
    g.add(w);
  }
  g.add(mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 16), DARK, 0, 1.4, 0).rotateX(Math.PI / 2));
  return g;
}

function makeRamYantra(R = 3.6, H = 3.4) {
  const g = new THREE.Group();
  const n = 12;
  const mat = nicheMat(1, 1);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const p = mesh(new THREE.BoxGeometry(0.7, H, 0.6), mat, Math.cos(a) * R, H / 2, Math.sin(a) * R);
    p.rotation.y = -a;
    g.add(p);
    // the graduated floor sectors between the pillars
    const sec = mesh(new THREE.BoxGeometry(R - 0.7, 0.5, 0.5), solid('#f4efe6', { roughness: 0.5 }), Math.cos(a + Math.PI / n) * (R / 2 + 0.2), 0.25, Math.sin(a + Math.PI / n) * (R / 2 + 0.2));
    sec.rotation.y = -(a + Math.PI / n);
    g.add(sec);
  }
  g.add(mesh(new THREE.CylinderGeometry(R + 0.45, R + 0.45, 0.35, 32, 1, true), solid(SAND, { side: THREE.DoubleSide }), 0, H + 0.17, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.35, 0.4, H * 0.9, 12), solid('#f4efe6'), 0, H * 0.45, 0));
  return g;
}

function buildJantarMantar(scene, ctx) {
  const g = new THREE.Group();
  const baseY = groundAt(JANTAR.x, JANTAR.z);
  g.position.set(JANTAR.x, baseY, JANTAR.z);
  g.rotation.y = Math.atan2(JANTAR.x, JANTAR.z) + Math.PI; // the long gnomon points back at the village centre
  scene.add(g);
  // a red sandstone courtyard
  const court = new THREE.Mesh(
    new THREE.CircleGeometry(JANTAR.r, 48),
    new THREE.MeshStandardMaterial({
      roughness: 0.95,
      map: canvasTexture(512, 512, (c, w) => {
        c.fillStyle = '#c9785a';
        c.fillRect(0, 0, w, w);
        c.strokeStyle = 'rgba(255,240,220,0.35)';
        c.lineWidth = 3;
        for (let k = 0; k < w; k += 32) {
          c.beginPath();
          c.moveTo(k, 0);
          c.lineTo(k, w);
          c.moveTo(0, k);
          c.lineTo(w, k);
          c.stroke();
        }
      }),
    })
  );
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.04;
  court.receiveShadow = true;
  g.add(court);
  // stone curb so the courtyard sits on any slope
  g.add(mesh(new THREE.CylinderGeometry(JANTAR.r, JANTAR.r + 0.3, 1.6, 48, 1, true), solid('#b8684c', { side: THREE.DoubleSide }), 0, -0.76, 0, false));

  // Samrat Yantra: the giant sundial
  const L = 18;
  const sam = makeGnomon(L);
  sam.g.position.set(0, 0, 1);
  g.add(sam.g);
  for (const sx of [-1, 1]) {
    const q = makeQuadrant(5.2, 1.4, sx);
    q.position.set(sx * 4.6, 5.6, 1 - L * 0.12);
    q.rotation.x = -THREE.MathUtils.degToRad(27);
    g.add(q);
    collider(g, 1.4, sx * 4.6, 1 - L * 0.12);
    collider(g, 1.4, sx * 4.6, 1 - L * 0.12 + 3.5);
    collider(g, 1.4, sx * 4.6, 1 - L * 0.12 - 3.5);
  }
  for (let k = 0; k <= 8; k++) collider(g, 1.3, 0, 1 - L / 2 + (k / 8) * L);

  // Laghu Samrat and a pair of small Rashivalaya gnomons
  const small = makeGnomon(6, 27, 1);
  small.g.position.set(-8.5, 0, -5);
  small.g.rotation.y = 0.3;
  g.add(small.g);
  for (let k = 0; k <= 3; k++) collider(g, 0.8, -8.5 + Math.sin(0.3) * (k * 2 - 3), -5 + Math.cos(0.3) * (k * 2 - 3));
  [[8.6, -6.2, -0.4], [9.6, 4.6, 0.5]].forEach(([x, z, ry]) => {
    const r = makeGnomon(3.6, 20 + Math.abs(ry) * 20, 0.8);
    r.g.position.set(x, 0, z);
    r.g.rotation.y = ry;
    g.add(r.g);
    collider(g, 1.4, x, z);
  });

  // Jai Prakash bowls and the Ram Yantra
  const jp = makeJaiPrakash();
  jp.position.set(-8, 0, 6.5);
  g.add(jp);
  collider(g, 3.4, -8, 6.5);
  const ram = makeRamYantra();
  ram.position.set(7, 0, -0.5);
  ram.scale.setScalar(0.8);
  g.add(ram);
  collider(g, 3.2, 7, -0.5);

  // an info stone and a stargazer
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.1),
    new THREE.MeshBasicMaterial({
      toneMapped: false,
      map: canvasTexture(768, 280, (c, w, h) => {
        c.fillStyle = '#7a3b2a';
        c.fillRect(0, 0, w, h);
        c.fillStyle = '#ffe9c2';
        c.font = '800 70px "Bricolage Grotesque", Inter, sans-serif';
        c.fillText('JANTAR MANTAR', 34, 100);
        c.font = '500 34px Inter, sans-serif';
        c.fillText('Stone instruments that read the sky', 34, 170);
        c.fillText('Press E to learn more', 34, 228);
      }),
    })
  );
  plaque.position.set(-3.4, 1.5, 11.8);
  plaque.userData.dynamic = true;
  g.add(plaque, mesh(new THREE.BoxGeometry(3.3, 2.1, 0.3), solid('#b8684c'), -3.4, 1.05, 11.6));
  const info = new THREE.Object3D();
  info.position.set(-3.4, 0, 12.8);
  info.userData.interact = {
    kind: 'toast',
    label: 'Jantar Mantar',
    verb: 'Read',
    text: '<b>🔭 Jantar Mantar, Jaipur.</b> Built by Sawai Jai Singh II in the 1700s. The Samrat Yantra is one of the world’s largest sundials, and its shadow still tells local time to within seconds.',
  };
  g.add(info);
  const star = makePerson({ seed: 0.61, style: 'kurta', accent: OCHRE });
  star.root.position.set(3.2, 0.04, 9.5);
  star.root.rotation.y = Math.PI + 0.4;
  g.add(star.root);
  ctx.updaters.push({ update: (t) => animate(star, 'point', t) });
  ctx.npcs.push({ p: star, dept: 'design', name: 'The astronomer', lines: ['The shadow says it’s almost time for chai.', 'Built in stone, so the measurements never drift. Good design system.'] });
  deepMerge(g);
}

// ---------- Fort walls on the ridge: Nahargarh and Amer ----------

function buildFort(scene, ctx) {
  const wallMat = nicheMat(2, 1, '#e3b56a', '#cf9a4c');
  const capMat = solid('#d6a659', { roughness: 0.9 });
  const from = THREE.MathUtils.degToRad(246);
  const to = THREE.MathUtils.degToRad(326);
  const radiusAt = (a) => {
    const rail = 104 + Math.sin(a * 3) * 6;
    return Math.max(rail + 7, Math.min(121, coastR(a) - 22));
  };
  const pts = [];
  for (let a = from; a <= to + 1e-6; a += THREE.MathUtils.degToRad(1.5)) {
    const r = radiusAt(a);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    pts.push({ x, z, y: groundAt(x, z), a });
  }
  const wallGeos = [];
  const capGeos = [];
  const H = 4.4;
  const T = 1.6;
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    const len = Math.hypot(q.x - p.x, q.z - p.z) + 0.3;
    const yb = Math.min(p.y, q.y) - 2.5;
    const yt = Math.max(p.y, q.y) + H;
    const b = new THREE.BoxGeometry(T, yt - yb, len);
    const m = new THREE.Matrix4().makeRotationY(Math.atan2(q.x - p.x, q.z - p.z));
    m.setPosition((p.x + q.x) / 2, (yb + yt) / 2, (p.z + q.z) / 2);
    b.applyMatrix4(m);
    wallGeos.push(b);
    // merlons on top
    const n = Math.max(1, Math.floor(len / 1.1));
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n;
      const mer = new THREE.BoxGeometry(T + 0.15, 0.7, 0.55);
      const mm = new THREE.Matrix4().makeRotationY(Math.atan2(q.x - p.x, q.z - p.z));
      mm.setPosition(p.x + (q.x - p.x) * u, yt + 0.35, p.z + (q.z - p.z) * u);
      mer.applyMatrix4(mm);
      capGeos.push(mer);
    }
    const steps = Math.ceil(len / 2.2);
    for (let k = 0; k < steps; k++) {
      const u = k / steps;
      ctx.colliderList.push({ x: p.x + (q.x - p.x) * u, z: p.z + (q.z - p.z) * u, r: 1.2 });
    }
  }
  const wall = new THREE.Mesh(mergeGeometries(wallGeos), wallMat);
  wall.castShadow = wall.receiveShadow = true;
  scene.add(wall, new THREE.Mesh(mergeGeometries(capGeos), capMat));
  // round bastions with chhatris along the wall
  for (let i = 0; i < pts.length; i += 7) {
    const p = pts[i];
    const b = new THREE.Group();
    b.position.set(p.x, p.y - 2.5, p.z);
    b.add(mesh(new THREE.CylinderGeometry(2.6, 3.1, H + 4.4, 18), nicheMat(4, 1, '#e3b56a', '#cf9a4c'), 0, (H + 4.4) / 2, 0));
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      b.add(mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), capMat, Math.cos(a) * 2.45, H + 4.75, Math.sin(a) * 2.45));
    }
    if ((i / 7) % 2 === 0) {
      const c = makeChhatri(1.5, '#f1dcae');
      c.position.y = H + 4.4;
      b.add(c);
    }
    scene.add(b);
    deepMerge(b);
    ctx.colliderList.push({ x: p.x, z: p.z, r: 3 });
  }
  // the palace on the ridge, Amer-style: stacked ochre terraces with jharokhas and chhatris
  const pa = THREE.MathUtils.degToRad(288);
  const pr = radiusAt(pa) - 9;
  const px = Math.cos(pa) * pr;
  const pz = Math.sin(pa) * pr;
  const palace = new THREE.Group();
  const py = Math.min(groundAt(px - 6, pz), groundAt(px + 6, pz), groundAt(px, pz - 4), groundAt(px, pz + 4));
  palace.position.set(px, py - 1.5, pz);
  palace.rotation.y = Math.atan2(-px, -pz);
  const tiers = [[20, 7, 11], [15, 5.5, 8], [9, 4.5, 6]];
  let y = 0;
  tiers.forEach(([w, h, d], k) => {
    palace.add(mesh(new THREE.BoxGeometry(w, h, d), nicheMat(Math.round(w / 2.5), Math.round(h / 2.5), k === 1 ? '#efc56c' : '#e6b65e', '#c58b3e'), 0, y + h / 2, -k * 1.2));
    palace.add(mesh(new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4), solid(LIME), 0, y + h + 0.15, -k * 1.2));
    for (const sx of [-1, 1]) {
      const c = makeChhatri(1.3 - k * 0.15, '#f6e6c0');
      c.position.set(sx * (w / 2 - 1), y + h + 0.3, -k * 1.2 + d / 2 - 1);
      palace.add(c);
    }
    y += h + 0.3;
  });
  const crown = makeChhatri(2.2, '#f6e6c0');
  crown.position.set(0, y, -2.4);
  palace.add(crown);
  const gate = makePol({ w: 7, h: 6.5, a: 1.8, spring: 2.6, depth: 1.2, color: '#efc56c' });
  gate.position.set(0, 1.5, 5.9);
  palace.add(gate);
  scene.add(palace);
  deepMerge(palace);
  ctx.colliderList.push({ x: px, z: pz, r: 9 });
  const info = new THREE.Object3D();
  info.position.set(px - Math.cos(pa) * 13, 0, pz - Math.sin(pa) * 13);
  info.userData.interact = {
    kind: 'toast',
    label: 'The fort on the ridge',
    verb: 'Look out',
    text: '<b>🏰 Nahargarh and Amer.</b> Jaipur’s forts sit on the Aravalli ridge, with walls running for kilometres over the hills. This one keeps watch over the island.',
  };
  scene.add(info);
}

// ---------- The old-city bazaar ----------

const GOODS = ['#d64545', '#f2c94c', '#2f6bff', '#00a79d', '#e48b78', '#7b5cff', '#ff9f1c', '#2f6b3a'];

function awningTexture(a, b) {
  return (texCache['aw' + a + b] ||= canvasTexture(128, 64, (c, w, h) => {
    for (let k = 0; k < 8; k++) {
      c.fillStyle = k % 2 ? a : b;
      c.fillRect((k * w) / 8, 0, w / 8, h);
    }
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.fillRect(0, h - 8, w, 8);
  }));
}

function makeShopfront(r, w = 4.2) {
  const g = new THREE.Group();
  const H = 6.4;
  const D = 4;
  // pink facade with a cusped arch shopfront at street level and two jharokhas above
  g.add(archSlab(w, H, 1.35, 1.7, 0.5, solid(PINK, { roughness: 0.85 })));
  g.add(mesh(new THREE.BoxGeometry(w, H, D), solid('#c97a5e'), 0, H / 2, -D / 2 - 0.25));
  g.add(mesh(new THREE.BoxGeometry(w - 0.6, 0.06, 0.3), solid(LIME), 0, 4.25, 0.3));
  // white lime outlines, the old city's signature
  for (const x of [-w / 2 + 0.12, w / 2 - 0.12]) g.add(mesh(new THREE.BoxGeometry(0.12, H, 0.1), solid(LIME), x, H / 2, 0.27));
  g.add(mesh(new THREE.BoxGeometry(w + 0.2, 0.3, 0.7), solid(LIME), 0, H + 0.15, 0));
  for (let x = -w / 2 + 0.25; x < w / 2; x += 0.6) g.add(mesh(new THREE.BoxGeometry(0.3, 0.4, 0.5), solid(PINK), x, H + 0.5, 0));
  const jh = new THREE.Group();
  jh.position.set(0, 4.5, 0.25);
  jh.add(mesh(new THREE.BoxGeometry(1.5, 0.12, 0.6), solid(LIME), 0, 0, 0.25));
  jh.add(mesh(new THREE.BoxGeometry(1.2, 1.0, 0.08), solid(['#3d5f9e', '#2f6b3a', '#7a3b2a'][Math.floor(r() * 3)]), 0, 0.6, 0.05));
  for (const x of [-0.55, 0.55]) jh.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), solid(LIME), x, 0.6, 0.45));
  jh.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 16, 1, false, 0, Math.PI), solid(LIME), 0, 1.25, 0.25).rotateX(-Math.PI / 2));
  g.add(jh);
  // striped awning over the shop
  const aw = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, 1.5), new THREE.MeshStandardMaterial({ map: awningTexture(GOODS[Math.floor(r() * 8)], '#fff6e5'), side: THREE.DoubleSide, roughness: 0.9 }));
  aw.position.set(0, 3.55, 0.95);
  aw.rotation.x = -1.05;
  g.add(aw);
  // goods: stacked boxes, bolts of cloth, brass pots
  const counter = mesh(new THREE.BoxGeometry(w - 1.2, 0.8, 0.8), WOOD, 0, 0.4, 0.9);
  g.add(counter);
  for (let k = 0; k < 6; k++) {
    const kind = r();
    const x = -w / 2 + 0.9 + (k / 5) * (w - 1.8);
    if (kind < 0.4) g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 10), solid(GOODS[Math.floor(r() * 8)]), x, 0.92, 0.9).rotateZ(Math.PI / 2));
    else if (kind < 0.7) g.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), solid('#c99a3a', { metalness: 0.7, roughness: 0.3 }), x, 0.95, 0.9));
    else g.add(mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), solid(GOODS[Math.floor(r() * 8)]), x, 0.93, 0.9));
  }
  // bougainvillea spilling over the parapet
  const bloom = solid(['#d6247a', '#e0457b', '#c2185b'][Math.floor(r() * 3)], { roughness: 0.9, flatShading: true });
  for (let k = 0; k < 5; k++) g.add(mesh(new THREE.IcosahedronGeometry(0.35 + r() * 0.25, 0), bloom, -w / 2 + r() * w, H - 0.3 - r() * 1.4, 0.35));
  return g;
}

// A thela: the four-wheeled hand cart of every Indian street. A planked deck on two axles, spoked
// wooden wheels with iron tyres, push handles at the back, a striped canopy on four poles.
export function makeThela(kind = 'chai', color = '#7a3b2a') {
  const g = new THREE.Group();
  const deckY = 0.82;
  const iron = solid('#2a2622', { roughness: 0.6, metalness: 0.5 });
  const plank = solid('#9a6b3f', { roughness: 0.85 });
  const plankDark = solid('#7a5230', { roughness: 0.85 });
  // deck: planks with a raised rim
  for (let k = 0; k < 6; k++) g.add(mesh(new THREE.BoxGeometry(1.8, 0.05, 0.16), k % 2 ? plank : plankDark, 0, deckY, -0.42 + k * 0.168));
  for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(1.84, 0.1, 0.05), plankDark, 0, deckY + 0.06, sz * 0.5));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.05, 0.1, 1.04), plankDark, sx * 0.92, deckY + 0.06, 0));
  // chassis rails under the deck
  for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(2.2, 0.07, 0.07), iron, -0.1, deckY - 0.07, sz * 0.36));
  // push handles past the back end
  for (const sz of [-1, 1]) {
    const h = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8), plankDark, -1.32, deckY - 0.04, sz * 0.36);
    h.rotation.z = Math.PI / 2;
    g.add(h);
  }
  // two axles, four wheels: spokes, hub, wooden felloe and an iron tyre
  const R = 0.36;
  const wheel = () => {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.028, 8, 28), iron));
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R - 0.035, 0.03, 6, 28), plankDark));
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), iron);
    hub.rotation.x = Math.PI / 2;
    w.add(hub);
    for (let k = 0; k < 10; k++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, R - 0.06, 6), plank);
      const a = (k / 10) * Math.PI * 2;
      sp.position.set(Math.cos(a) * (R / 2 - 0.01), Math.sin(a) * (R / 2 - 0.01), 0);
      sp.rotation.z = a - Math.PI / 2;
      w.add(sp);
    }
    w.traverse((o) => (o.castShadow = true));
    return w;
  };
  for (const ax of [-0.62, 0.62]) {
    const axle = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8), iron, ax, R, 0);
    axle.rotation.x = Math.PI / 2;
    g.add(axle);
    // a leaf spring from the axle up to the rail
    for (const sz of [-1, 1]) {
      g.add(mesh(new THREE.BoxGeometry(0.4, 0.04, 0.05), iron, ax, deckY - 0.12, sz * 0.36));
      g.add(mesh(new THREE.BoxGeometry(0.05, deckY - 0.12 - R, 0.05), iron, ax, (deckY - 0.12 + R) / 2, sz * 0.36));
    }
    for (const sz of [-1, 1]) {
      const w = wheel();
      w.position.set(ax, R, sz * 0.58);
      g.add(w);
    }
  }
  // canopy: four poles and a striped awning
  for (const [px, pz] of [[-0.85, -0.45], [0.85, -0.45], [-0.85, 0.45], [0.85, 0.45]]) g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.15, 8), iron, px, deckY + 0.6, pz));
  const top = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.25), new THREE.MeshStandardMaterial({ map: awningTexture('#d64545', '#fff6e5'), side: THREE.DoubleSide }));
  top.position.set(0, deckY + 1.2, 0);
  top.rotation.x = -Math.PI / 2;
  top.castShadow = true;
  g.add(top);
  // the goods
  if (kind === 'chai') {
    // a brass kettle on a stove, glasses on a tray, a jar of rusks
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.18, 14), iron, -0.45, deckY + 0.12, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 16), solid('#c9a23a', { roughness: 0.3, metalness: 0.7 }), -0.45, deckY + 0.32, 0));
    const spout = mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.16, 8), solid('#c9a23a', { roughness: 0.3, metalness: 0.7 }), -0.3, deckY + 0.36, 0);
    spout.rotation.z = -0.9;
    g.add(spout);
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.32), solid('#b7b7b7', { roughness: 0.3, metalness: 0.7 }), 0.25, deckY + 0.04, 0));
    for (let k = 0; k < 8; k++) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.08, 10), solid('#f4efe6', { roughness: 0.2 }), 0.08 + (k % 4) * 0.11, deckY + 0.09, -0.08 + Math.floor(k / 4) * 0.16));
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 14), solid('#cfe8f3', { roughness: 0.1 }), 0.65, deckY + 0.15, 0.2));
  } else {
    // marigold garlands heaped on the deck and hanging from the canopy
    for (let k = 0; k < 6; k++) {
      const ring = mesh(new THREE.TorusGeometry(0.16, 0.06, 6, 14), solid(k % 2 ? '#ff9f1c' : '#f2c94c'), -0.6 + k * 0.24, deckY + 0.1, 0);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
    }
    for (let k = 0; k < 5; k++) g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), solid(k % 2 ? '#ff9f1c' : '#f2c94c'), -0.7 + k * 0.35, deckY + 0.92, 0.47));
  }
  return g;
}

function buildBazaar(scene, ctx) {
  const r = rng(1729);
  const { ax, az, bx, bz, side } = BAZAAR;
  const dx = bx - ax;
  const dz = bz - az;
  const L = Math.hypot(dx, dz);
  const ux = dx / L;
  const uz = dz / L;
  // the road's normal, pointing to the side the shops stand on
  const nx = -uz * side;
  const nz = ux * side;
  const facing = Math.atan2(-nx, -nz);
  const w = 4.2;
  const count = Math.floor(L / w);
  for (let k = 0; k < count; k++) {
    const t = (k + 0.5) * w;
    const x = ax + ux * t + nx * 6.2;
    const z = az + uz * t + nz * 6.2;
    const shop = makeShopfront(r, w);
    const ys = [groundAt(x, z), groundAt(x - nx * 4, z - nz * 4), groundAt(x + ux * 2, z + uz * 2), groundAt(x - ux * 2, z - uz * 2)];
    shop.position.set(x, Math.min(...ys) - 0.05, z);
    shop.rotation.y = facing;
    // a plinth so no shop floats on the slope
    shop.add(mesh(new THREE.BoxGeometry(w, 3, 4.6), solid('#b8684c'), 0, -1.5 + 0.06, -1.9));
    scene.add(shop);
    deepMerge(shop);
    ctx.colliderList.push({ x: x - nx * 1.6, z: z - nz * 1.6, r: 2.2 });
  }
  // city gates at both ends, spanning the road like Tripolia and Sanganeri gate
  for (const t of [-2.5, L + 2.5]) {
    const x = ax + ux * t;
    const z = az + uz * t;
    const gate = makePol({ w: 13, h: 9.5, a: 3.6, spring: 4.4, depth: 2.2, color: PINK, accent: '#3d5f9e' });
    gate.position.set(x, groundAt(x, z) - 0.2, z);
    gate.rotation.y = Math.atan2(ux, uz);
    gate.add(mesh(new THREE.BoxGeometry(13, 3, 2.2), solid('#b8684c'), 0, -1.4, 0));
    scene.add(gate);
    deepMerge(gate);
    for (const s of [-1, 1]) ctx.colliderList.push({ x: x + nx * s * 5.3, z: z + nz * s * 5.3, r: 1.5 });
  }
  // a chai stall and a flower seller on the inner verge
  const sellers = [
    { t: L * 0.3, label: 'Chai stall', text: '<b>☕ Cutting chai.</b> Masala, extra adrak, in a little glass. The bazaar runs on it.', top: '#7a3b2a' },
    { t: L * 0.62, label: 'Flower seller', text: '<b>🌼 Marigold garlands.</b> Fresh this morning, for the shop doors and the temple steps.', top: '#e2b04f' },
  ];
  for (const s of sellers) {
    const x = ax + ux * s.t - nx * 5.6;
    const z = az + uz * s.t - nz * 5.6;
    const cart = makeThela(s.top === '#e2b04f' ? 'flowers' : 'chai', s.top);
    cart.position.set(x, groundAt(x, z), z);
    cart.rotation.y = facing + Math.PI;
    scene.add(cart);
    const vendor = makePerson({ seed: r(), style: 'kurta', top: s.top, accent: s.top });
    vendor.root.position.set(x - nx * 1.2, groundAt(x - nx * 1.2, z - nz * 1.2), z - nz * 1.2);
    vendor.root.rotation.y = facing;
    scene.add(vendor.root);
    ctx.updaters.push({ update: (t) => animate(vendor, 'talk', t) });
    ctx.npcs.push({ p: vendor, dept: 'brand', name: s.label, lines: ['Aaiye, aaiye! Best in the old city.', 'Bhaiya, one for you? Fresh, fresh!'] });
    const m = new THREE.Object3D();
    m.position.set(x + nx * 1.4, 0, z + nz * 1.4);
    m.userData.interact = { kind: 'toast', label: s.label, verb: 'Stop by', text: s.text };
    scene.add(m);
    ctx.colliderList.push({ x, z, r: 1.2 });
  }
  // shoppers strolling the street
  for (let k = 0; k < 4; k++) {
    const p = makePerson({ seed: r(), accent: GOODS[k] });
    const off = (k % 2 ? 1 : -1) * 1.4;
    const pts = [[ax + ux * 2 + nx * off, az + uz * 2 + nz * off], [bx - ux * 2 + nx * off, bz - uz * 2 + nz * off]];
    ctx.updaters.push(new ctx.Walker(scene, p, k % 2 ? pts.reverse() : pts, { speed: 1.1 + r() * 0.4, pause: 3, offset: r(), heightFn: walkY }));
    ctx.npcs.push({ p, dept: 'brand' });
  }
  const sign = new THREE.Object3D();
  sign.position.set(ax + ux * L * 0.5, 0, az + uz * L * 0.5);
  sign.userData.interact = { kind: 'toast', label: 'Johari Bazaar', verb: 'Look around', text: '<b>🛍️ The pink city bazaar.</b> Arched shopfronts, jharokhas and white lime outlines, painted pink since 1876 to welcome a royal visit.' };
  scene.add(sign);
}

// ---------- Bicycles ----------

// A classic Indian roadster: diamond frame, upright bars, mudguards, carrier basket, cranks that turn.
export function makeBicycle(color = '#1f2937') {
  const g = new THREE.Group();
  const frame = solid(color, { metalness: 0.5, roughness: 0.35 });
  const tyre = solid('#17191e', { roughness: 0.85 });
  const steel = solid('#c9ced6', { metalness: 0.85, roughness: 0.25 });
  const black = solid('#22252b', { roughness: 0.6 });
  const R = 0.34;
  const P = {
    rear: [0, R, -0.53],
    front: [0, R, 0.53],
    bb: [0, 0.29, -0.05],
    seatTop: [0, 0.8, -0.24],
    headTop: [0, 0.84, 0.4],
    headBot: [0, 0.64, 0.45],
  };
  const tube = (a, b, r = 0.018, mat = frame, dx = 0) => {
    const va = new THREE.Vector3(a[0] + dx, a[1], a[2]);
    const vb = new THREE.Vector3(b[0] + dx, b[1], b[2]);
    const m = mesh(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 8), mat, 0, 0, 0, false);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    g.add(m);
  };
  // wheels: tyre, rim, hub, spokes
  const wheels = [];
  for (const z of [P.rear[2], P.front[2]]) {
    const w = new THREE.Group();
    w.position.set(0, R, z);
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.022, 8, 36), tyre).rotateY(Math.PI / 2));
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R - 0.045, 0.01, 6, 36), steel).rotateY(Math.PI / 2));
    w.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 10), steel, 0, 0, 0, false).rotateZ(Math.PI / 2));
    for (let k = 0; k < 18; k++) {
      const sp = mesh(new THREE.CylinderGeometry(0.003, 0.003, R * 2 - 0.09, 3), steel, 0, 0, 0, false);
      sp.rotation.x = (k / 18) * Math.PI;
      sp.rotation.z = (k % 2 ? 1 : -1) * 0.05;
      w.add(sp);
    }
    g.add(w);
    wheels.push(w);
  }
  // mudguards
  for (const z of [P.rear[2], P.front[2]]) {
    const guard = new THREE.Mesh(new THREE.TorusGeometry(R + 0.03, 0.03, 4, 24, Math.PI * 0.55), black);
    guard.scale.set(1, 1, 0.9);
    guard.rotation.set(0, Math.PI / 2, 0);
    guard.position.set(0, R, z);
    guard.rotation.x = z < 0 ? 0.25 : -0.05;
    g.add(guard);
  }
  // the diamond frame
  for (const dx of [-0.055, 0.055]) {
    tube(P.bb, P.rear, 0.012, frame, dx);
    tube(P.seatTop, P.rear, 0.012, frame, dx);
  }
  tube(P.bb, P.seatTop, 0.02);
  tube(P.seatTop, P.headTop, 0.019);
  tube(P.bb, P.headBot, 0.022);
  tube(P.headBot, P.headTop, 0.026);
  for (const dx of [-0.045, 0.045]) tube(P.headBot, P.front, 0.012, frame, dx);
  // seat post, sprung saddle
  tube(P.seatTop, [0, 0.88, -0.27], 0.012, steel);
  const saddle = new THREE.Group();
  saddle.position.set(0, 0.9, -0.28);
  saddle.add(mesh(new THREE.BoxGeometry(0.17, 0.05, 0.13), solid('#3b2a1e', { roughness: 0.5 }), 0, 0, -0.03));
  saddle.add(mesh(new THREE.BoxGeometry(0.07, 0.04, 0.14), solid('#3b2a1e', { roughness: 0.5 }), 0, 0, 0.1));
  for (const x of [-0.06, 0.06]) saddle.add(mesh(new THREE.TorusGeometry(0.018, 0.005, 4, 8), steel, x, -0.04, -0.07, false));
  g.add(saddle);
  // stem and swept-back roadster bars with black grips
  tube(P.headTop, [0, 0.98, 0.41], 0.014, steel);
  tube([-0.2, 0.98, 0.41], [0.2, 0.98, 0.41], 0.012, steel);
  for (const sx of [-1, 1]) {
    tube([sx * 0.2, 0.98, 0.41], [sx * 0.29, 0.985, 0.33], 0.012, steel);
    const grip = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), black, sx * 0.31, 0.985, 0.32, false);
    grip.rotation.z = Math.PI / 2;
    g.add(grip);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10), steel, 0.12, 0.99, 0.41, false));
  // front carrier with a cane basket
  tube(P.headBot, [0, 0.8, 0.62], 0.008, steel);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.26), solid('#b98a4a', { roughness: 1 }));
  basket.position.set(0, 0.86, 0.66);
  g.add(basket);
  // rear carrier rack
  tube([-0.07, 0.62, -0.62], [-0.07, 0.62, -0.32], 0.008, steel);
  tube([0.07, 0.62, -0.62], [0.07, 0.62, -0.32], 0.008, steel);
  for (const dx of [-0.07, 0.07]) tube([dx, 0.62, -0.6], [dx, R, -0.53], 0.007, steel);
  // chainring, chain and the turning cranks with pedals
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 6, 24), steel);
  ring.rotation.y = Math.PI / 2;
  ring.position.set(0.075, P.bb[1], P.bb[2]);
  g.add(ring);
  for (const dy of [0.095, -0.095]) tube([0.075, P.bb[1] + dy, P.bb[2]], [0.075, R + dy * 0.45, P.rear[2]], 0.006, black);
  g.add(mesh(new THREE.BoxGeometry(0.02, 0.14, 0.42), black, 0.085, P.bb[1] + 0.02, -0.29, false));
  const crank = new THREE.Group();
  crank.position.set(0, P.bb[1], P.bb[2]);
  const pedals = [];
  for (const side of [-1, 1]) {
    const arm = mesh(new THREE.BoxGeometry(0.02, 0.17, 0.03), steel, side * 0.095, side * 0.085, 0, false);
    crank.add(arm);
    const pedal = new THREE.Group();
    pedal.position.set(side * 0.14, side * 0.17, 0);
    pedal.add(mesh(new THREE.BoxGeometry(0.09, 0.022, 0.06), black, 0, 0, 0, false));
    crank.add(pedal);
    pedals.push(pedal);
  }
  g.add(crank);
  // kickstand, folded up
  tube([-0.06, P.bb[1] - 0.02, -0.12], [-0.08, 0.12, -0.4], 0.008, steel);
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  let crankAngle = 0;
  g.userData.spin = (d) => {
    for (const w of wheels) w.rotation.x += d / R;
    crankAngle += d / (R * 2.4);
    crank.rotation.x = crankAngle;
    for (const pd of pedals) pd.rotation.x = -crankAngle; // pedals stay level
  };
  g.userData.crank = () => crankAngle;
  // where a rider's hips, hands and feet go
  g.userData.mount = {
    seatY: 0.92,
    seatZ: -0.3,
    gripY: 0.985,
    gripZ: 0.32,
    lean: 0.32,
    foot: (side, c) => [P.bb[1] + side * 0.17 * Math.cos(c) + 0.035, P.bb[2] + side * 0.17 * Math.sin(c)],
  };
  return g;
}

function buildBicycles(scene, ctx) {
  const r = rng(2611);
  const colours = ['#1f2937', '#2f6bff', '#d64545', '#00a79d', '#7b5cff', '#2f6b3a'];
  // parked by each hamlet's plaza, and in the bazaar
  HAMLETS.forEach((h, i) => {
    for (let k = 0; k < 2; k++) {
      const a = h.angle + Math.PI + (k ? 0.5 : -0.5);
      const x = h.x + Math.cos(a) * 9 + Math.cos(h.angle + Math.PI / 2) * 1.2;
      const z = h.z + Math.sin(a) * 9 + Math.sin(h.angle + Math.PI / 2) * 1.2;
      const b = makeBicycle(colours[(i + k) % colours.length]);
      b.position.set(x, walkY(x, z), z);
      b.rotation.set(0, a + 0.4, 0.22);
      scene.add(b);
    }
  });
  // riders doing the ring road, the slow way
  const ring = [];
  HAMLETS.forEach((h, i) => {
    const n = HAMLETS[(i + 1) % HAMLETS.length];
    for (const u of [0.25, 0.5, 0.75]) ring.push([h.x + (n.x - h.x) * u, h.z + (n.z - h.z) * u]);
    ring.push([h.x - Math.cos(h.angle) * 12, h.z - Math.sin(h.angle) * 12]);
  });
  for (let k = 0; k < 4; k++) {
    const p = makePerson({ seed: r(), accent: colours[k] });
    const bike = makeBicycle(colours[(k + 2) % colours.length]);
    bike.scale.setScalar(1 / p.root.scale.x);
    bike.position.y = 0;
    p.root.add(bike);
    p.mount = bike.userData.mount;
    const w = new ctx.Walker(scene, p, ring, { loop: true, speed: 3.4, pause: 0.01, heightFn: walkY, action: 'cycle', idle: 'cycle' });
    w.idx = (k * 6 + 1) % ring.length;
    const [x, z] = ring[(k * 6) % ring.length];
    p.root.position.set(x, walkY(x, z), z);
    const last = new THREE.Vector3().copy(p.root.position);
    ctx.updaters.push(w, {
      update: () => {
        bike.userData.spin(p.root.position.distanceTo(last));
        // a ring of the bell when they pass you
        if (p.root.position.distanceTo(playerPos) < 7 && Math.random() < 0.02) sfx('bell', { pos: p.root.position, range: 30, gap: 4 });
        p.crank = bike.userData.crank();
        last.copy(p.root.position);
      },
    });
    ctx.npcs.push({ p, dept: HAMLETS[k].id, rider: true });
  }
}

// ---------- Makar Sankranti: kites over the island ----------

function kiteTexture(a, b) {
  return canvasTexture(64, 64, (c, w) => {
    c.fillStyle = a;
    c.beginPath();
    c.moveTo(w / 2, 0);
    c.lineTo(w, w / 2);
    c.lineTo(w / 2, w);
    c.lineTo(0, w / 2);
    c.fill();
    c.fillStyle = b;
    c.beginPath();
    c.moveTo(w / 2, 0);
    c.lineTo(w, w / 2);
    c.lineTo(w / 2, w / 2);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.35)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w / 2, 0);
    c.lineTo(w / 2, w);
    c.moveTo(0, w / 2);
    c.lineTo(w, w / 2);
    c.stroke();
  });
}

function buildKites(scene, ctx) {
  const r = rng(1401);
  const pairs = [['#d64545', '#f2c94c'], ['#2f6bff', '#ffffff'], ['#00a79d', '#ff9f1c'], ['#7b5cff', '#ff4f8b'], ['#f2c94c', '#2f6b3a'], ['#ff4f8b', '#2f6bff']];
  const kites = [];
  const lineMat = new THREE.LineBasicMaterial({ color: '#f8fafc', transparent: true, opacity: 0.55 });
  const flyers = [];
  // one or two flyers on the slopes behind every hamlet
  HAMLETS.forEach((h, i) => {
    for (let k = 0; k < 2; k++) {
      const a = h.angle + (k ? 0.22 : -0.2);
      const d = 72 + 19 + k * 3;
      flyers.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, dept: h.id, seed: i * 2 + k });
    }
  });
  // a ring of rooftop-style flyers round the jamun tree hill
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.5;
    flyers.push({ x: Math.cos(a) * 24, z: Math.sin(a) * 24, dept: HAMLETS[k].id, seed: 30 + k });
  }
  // and a few at Jantar Mantar and the bazaar
  flyers.push({ x: JANTAR.x + 10, z: JANTAR.z + 10, dept: 'design', seed: 20 }, { x: BAZAAR.ax + 4, z: BAZAAR.az - 4, dept: 'brand', seed: 21 });
  for (const f of flyers) {
    const p = makePerson({ seed: r(), accent: pairs[f.seed % pairs.length][0] });
    const y = walkY(f.x, f.z);
    p.root.position.set(f.x, y, f.z);
    // face the wind, which blows out to sea from the centre
    const wind = Math.atan2(f.x, f.z);
    p.root.rotation.y = wind;
    scene.add(p.root);
    ctx.npcs.push({ p, dept: f.dept, lines: ['Kai po che! 🪁', 'Watch the manjha, it’s sharp.', 'Sankranti on the rooftops is the best day in Jaipur.'] });
    const [c1, c2] = pairs[f.seed % pairs.length];
    const kite = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: kiteTexture(c1, c2), side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }));
    kite.userData.decor = true;
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.6), new THREE.MeshBasicMaterial({ color: c2, side: THREE.DoubleSide }));
    tail.position.y = -1.7;
    kite.add(tail);
    scene.add(kite);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new THREE.Vector3()));
    const line = new THREE.Line(lineGeo, lineMat);
    line.frustumCulled = false;
    scene.add(line);
    const len = 16 + r() * 12;
    const ph = r() * 10;
    kites.push({ p, kite, line, len, ph, wind, hand: new THREE.Vector3() });
  }
  const hand = new THREE.Vector3();
  ctx.updaters.push({
    update: (t) => {
      for (const k of kites) {
        animate(k.p, 'kite', t);
        k.p.parts.armR.elbow.getWorldPosition(hand);
        const sway = Math.sin(t * 0.7 + k.ph) * 0.25;
        const a = k.wind + sway;
        const up = 0.75 + Math.sin(t * 0.5 + k.ph) * 0.12;
        const kx = hand.x + Math.sin(a) * Math.cos(up) * k.len;
        const ky = hand.y + Math.sin(up) * k.len;
        const kz = hand.z + Math.cos(a) * Math.cos(up) * k.len;
        k.kite.position.set(kx, ky, kz);
        k.kite.rotation.set(0, a, Math.PI / 4 + Math.sin(t * 2.3 + k.ph) * 0.3);
        // a sagging string
        const pos = k.line.geometry.attributes.position;
        for (let i = 0; i < 12; i++) {
          const u = i / 11;
          pos.setXYZ(i, hand.x + (kx - hand.x) * u, hand.y + (ky - hand.y) * u - Math.sin(u * Math.PI) * k.len * 0.08, hand.z + (kz - hand.z) * u);
        }
        pos.needsUpdate = true;
      }
    },
  });
}

// ---------- Public ----------

export function buildJaipur(scene, ctx) {
  buildJantarMantar(scene, ctx);
  buildFort(scene, ctx);
  buildBazaar(scene, ctx);
  buildBicycles(scene, ctx);
  buildKites(scene, ctx);
}
