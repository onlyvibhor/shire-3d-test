// The five pillars round the jamun tree, each shaped like its own idea:
// Make it better (a rough stack refined into a gem), Award-winning (a trophy column),
// Scale (one cube multiplying as it rises), Automate (turning gears and a conveyor),
// Innovate (a spiral climbing to a light bulb). Each faces the tree, its name on a tag under it.
import * as THREE from 'three';
import { WHITE_METAL, CHROME, GOLD, CONCRETE, solid, glow, mesh, canvasTexture } from './materials.js';
import { fillFit } from './type.js';

export const PILLAR_STYLE = {
  better: { color: '#3d7bff', icon: '✦' },
  award: { color: '#f5b700', icon: '★' },
  scale: { color: '#12c2a0', icon: '❖' },
  automate: { color: '#ff8a3d', icon: '⚙' },
  innovate: { color: '#a26bff', icon: '✺' },
};

function plinth(color) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.35, 8), CONCRETE, 0, 0.17, 0));
  // a skirt into the ground, for when the plinth stands on a slope
  g.add(mesh(new THREE.CylinderGeometry(1.5, 1.56, 1.2, 8), CONCRETE, 0, -0.6, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.06, 8), glow(color, 1.1), 0, 0.37, 0, false));
  // turned an eighth so a flat face looks straight ahead, where the name tag goes
  g.rotation.y = Math.PI / 8;
  return g;
}

// The name tag on the plinth's front face, right under the sculpture: its mark and its name
function tag(p, color) {
  const tex = canvasTexture(640, 176, (c, w, h) => {
    c.fillStyle = '#0f172a';
    c.fillRect(0, 0, w, h);
    c.fillStyle = color;
    c.fillRect(0, h - 12, w, 12);
    c.textBaseline = 'middle';
    c.font = '700 84px "Bricolage Grotesque", Inter, sans-serif';
    c.fillStyle = color;
    c.fillText(PILLAR_STYLE[p.id].icon, 34, h / 2 - 4);
    c.fillStyle = '#ffffff';
    c.font = '800 70px "Bricolage Grotesque", Inter, sans-serif';
    fillFit(c, p.name, 130, h / 2 - 2, w - 160);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.275), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  // the plinth's front face leans back a little, and the tag lies on it
  m.position.set(0, 0.18, 1.335);
  m.rotation.x = -0.38;
  m.userData.dynamic = true; // keep it its own mesh (and out of the ground fit)
  m.userData.noFit = true;
  return m;
}

// ---------- Make it better: rough at the base, refined at the top ----------
function better(color, anim) {
  const g = new THREE.Group();
  const steps = 6;
  const tower = new THREE.Group();
  for (let k = 0; k < steps; k++) {
    const u = k / (steps - 1);
    const size = 1.15 - u * 0.45;
    // each block is smoother, shinier and closer to the brand colour than the one below it
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#8a8f98').lerp(new THREE.Color(color), u * 0.55).lerp(new THREE.Color('#ffffff'), u * 0.25),
      roughness: 0.95 - u * 0.85,
      metalness: u * 0.7,
      clearcoat: u,
      flatShading: k < 2,
    });
    const geo = k < 2 ? new THREE.DodecahedronGeometry(size * 0.72, 0) : new THREE.BoxGeometry(size, 0.48, size);
    const b = mesh(geo, mat, 0, 0.62 + k * 0.52, 0);
    b.rotation.y = k * 0.32;
    if (k < 2) b.scale.set(1, 0.6, 1);
    tower.add(b);
  }
  g.add(tower);
  // the finished idea: a cut gem
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshPhysicalMaterial({ color, metalness: 0.2, roughness: 0.05, clearcoat: 1, emissive: color, emissiveIntensity: 0.35 }));
  gem.position.y = 4.0;
  gem.scale.y = 1.4;
  gem.userData.dynamic = true;
  g.add(gem);
  anim.push((t) => {
    gem.rotation.y = t * 0.8;
    gem.position.y = 4.0 + Math.sin(t * 1.4) * 0.08;
  });
  return g;
}

// ---------- Award-winning: a fluted column carrying a trophy ----------
function award(color, anim) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.42, 0.5, 2.4, 20), WHITE_METAL, 0, 1.6, 0));
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    g.add(mesh(new THREE.BoxGeometry(0.05, 2.3, 0.05), solid('#dfe5ea', { metalness: 0.6, roughness: 0.3 }), Math.cos(a) * 0.45, 1.6, Math.sin(a) * 0.45, false));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.18, 20), WHITE_METAL, 0, 2.86, 0));
  // the cup
  const cup = new THREE.LatheGeometry(
    [[0, 0], [0.3, 0], [0.12, 0.08], [0.1, 0.34], [0.2, 0.42], [0.5, 0.62], [0.58, 1.05], [0.54, 1.08], [0.45, 0.7], [0, 0.55]].map(([x, y]) => new THREE.Vector2(x, y)),
    32
  );
  g.add(mesh(cup, GOLD, 0, 2.95, 0));
  for (const sx of [-1, 1]) {
    const handle = mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 20, Math.PI * 1.2), GOLD, sx * 0.6, 3.7, 0);
    handle.rotation.z = sx > 0 ? -Math.PI * 0.6 : Math.PI * 1.6;
    g.add(handle);
  }
  // laurel ring round the column
  const leaf = solid('#5f9e3a', { roughness: 0.6 });
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    const l = mesh(new THREE.SphereGeometry(0.11, 8, 6), leaf, Math.cos(a) * 0.62, 2.35 + Math.sin(a * 3) * 0.04, Math.sin(a) * 0.62, false);
    l.scale.set(0.6, 0.4, 1.3);
    l.rotation.y = -a;
    g.add(l);
  }
  // a spinning star above
  const star = new THREE.Shape();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 0.16 : 0.38;
    const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
    if (k) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(star, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }), new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.2, emissive: color, emissiveIntensity: 0.3 }));
  starMesh.position.y = 4.55;
  starMesh.userData.dynamic = true;
  g.add(starMesh);
  anim.push((t) => (starMesh.rotation.y = t * 1.1));
  return g;
}

// ---------- Scale: one cube that multiplies as it rises ----------
function scale(color, anim) {
  const g = new THREE.Group();
  const accent = new THREE.MeshPhysicalMaterial({ color, metalness: 0.3, roughness: 0.25, clearcoat: 1 });
  const cube = new THREE.BoxGeometry(1, 1, 1);
  // layer n is an n×n grid of smaller cubes: 1, 4, 9, 16
  let y = 0.55;
  [1, 2, 3, 4].forEach((n, k) => {
    const s = 0.62 - k * 0.1;
    const span = n * s * 1.08;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const m = mesh(cube, k === 0 ? accent : WHITE_METAL, -span / 2 + (i + 0.5) * s * 1.08, y + s / 2, -span / 2 + (j + 0.5) * s * 1.08);
        m.scale.setScalar(s);
        g.add(m);
      }
    }
    y += s * 1.08 + 0.18;
    // a slim spine between layers
    if (k < 3) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8), CHROME, 0, y - 0.1, 0));
  });
  // and the curve it draws: bars that grow round the base
  const bars = [];
  for (let k = 0; k < 5; k++) {
    const a = -0.9 + k * 0.45;
    const b = mesh(new THREE.BoxGeometry(0.14, 1, 0.14), accent, Math.sin(a) * 1.15, 0, Math.cos(a) * 1.15 * -1);
    b.userData.dynamic = true;
    b.userData.h = 0.3 + k * 0.35;
    g.add(b);
    bars.push(b);
  }
  anim.push((t) => {
    bars.forEach((b, k) => {
      const h = b.userData.h * (0.85 + 0.15 * Math.sin(t * 1.5 + k * 0.6));
      b.scale.y = h;
      b.position.y = 0.4 + h / 2;
    });
  });
  return g;
}

// ---------- Automate: gears that turn and a conveyor that never stops ----------
function gearShape(r, teeth, depth = 0.12) {
  const s = new THREE.Shape();
  for (let k = 0; k < teeth * 2; k++) {
    const a0 = (k / (teeth * 2)) * Math.PI * 2;
    const a1 = ((k + 1) / (teeth * 2)) * Math.PI * 2;
    const rr = k % 2 ? r : r + depth;
    if (k === 0) s.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
    else s.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
    s.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, r * 0.32, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}
function automate(color, anim) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.34, 3.6, 0.34), solid('#2a2f38', { metalness: 0.5, roughness: 0.4 }), 0, 2.2, -0.15));
  const accent = new THREE.MeshPhysicalMaterial({ color, metalness: 0.6, roughness: 0.3 });
  const gears = [];
  // three meshing gears up the mast, turning in alternate directions
  [[0.62, 14, 0, 1.5, 1], [0.42, 10, 0.86, 2.4, -1], [0.55, 12, 0.05, 3.35, 1]].forEach(([r, teeth, x, y, dir], k) => {
    const gear = new THREE.Group();
    gear.position.set(x, y, 0.1);
    gear.userData.dynamic = true;
    const geo = new THREE.ExtrudeGeometry(gearShape(r, teeth), { depth: 0.16, bevelEnabled: false });
    geo.translate(0, 0, -0.08);
    gear.add(new THREE.Mesh(geo, k === 1 ? accent : CHROME));
    gear.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), solid('#2a2f38'), 0, 0, 0, false).rotateX(Math.PI / 2));
    g.add(gear);
    gears.push({ gear, speed: (dir * 0.9) / r });
  });
  // a conveyor at the foot: plain blocks in, finished (coloured) boxes out
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.08, 0.5), solid('#2a2f38'), 0, 0.62, 0.75));
  for (const x of [-1.05, 1.05]) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10), CHROME, x, 0.62, 0.75, false).rotateX(Math.PI / 2));
  const items = [];
  for (let k = 0; k < 4; k++) {
    const it = mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), WHITE_METAL, 0, 0.78, 0.75);
    it.userData.dynamic = true;
    g.add(it);
    items.push(it);
  }
  const done = accent;
  anim.push((t) => {
    for (const { gear, speed } of gears) gear.rotation.z = t * speed;
    items.forEach((it, k) => {
      const u = (t * 0.25 + k / items.length) % 1;
      it.position.x = -1.0 + u * 2.0;
      it.material = u > 0.5 ? done : WHITE_METAL;
      it.rotation.y = u > 0.5 ? 0.25 : 0;
    });
  });
  return g;
}

// ---------- Innovate: a spiral that climbs to a light bulb ----------
function innovate(color, anim) {
  const g = new THREE.Group();
  const accent = new THREE.MeshPhysicalMaterial({ color, metalness: 0.4, roughness: 0.3, clearcoat: 1 });
  // a ribbon of steps spiralling up round a slim core
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.9, 10), CHROME, 0, 1.85, 0));
  for (let k = 0; k < 22; k++) {
    const a = k * 0.55;
    const step = mesh(new THREE.BoxGeometry(0.55, 0.06, 0.2), k % 2 ? accent : WHITE_METAL, Math.cos(a) * 0.38, 0.6 + k * 0.12, Math.sin(a) * 0.38);
    step.rotation.y = -a;
    g.add(step);
  }
  // the bulb: a screw base and a glass globe with a glowing filament
  for (let k = 0; k < 4; k++) g.add(mesh(new THREE.CylinderGeometry(0.3 - k * 0.01, 0.3 - k * 0.01, 0.08, 18), CHROME, 0, 3.35 + k * 0.1, 0));
  const globe = new THREE.LatheGeometry(
    [[0.3, 0], [0.34, 0.12], [0.55, 0.45], [0.6, 0.75], [0.5, 1.05], [0.28, 1.2], [0, 1.24]].map(([x, y]) => new THREE.Vector2(x, y)),
    28
  );
  const glass = new THREE.MeshPhysicalMaterial({ color: '#fff6dc', roughness: 0.1, metalness: 0, clearcoat: 1, emissive: '#ffd58a', emissiveIntensity: 0.55 });
  const bulb = mesh(globe, glass, 0, 3.72, 0);
  bulb.userData.dynamic = true;
  g.add(bulb);
  const fil = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 20, Math.PI), glow(color, 1.6));
  fil.position.y = 4.25;
  fil.userData.dynamic = true;
  g.add(fil);
  anim.push((t) => {
    const k = 0.5 + Math.sin(t * 2.2) * 0.12 + (Math.sin(t * 13) > 0.97 ? 0.15 : 0);
    glass.emissiveIntensity = k;
    fil.rotation.y = t * 0.6;
  });
  return g;
}

const BUILD = { better, award, scale, automate, innovate };

export function makePillar(p, anim) {
  const st = PILLAR_STYLE[p.id] || PILLAR_STYLE.better;
  const g = new THREE.Group();
  g.name = 'pillar';
  g.add(plinth(st.color));
  g.add((BUILD[p.id] || better)(st.color, anim));
  // its name on a tag right under it, on the face that looks at the tree
  g.add(tag(p, st.color));
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return g;
}
