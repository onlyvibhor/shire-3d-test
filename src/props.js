import * as THREE from 'three';
import { WHITE_METAL, BRUSHED, CHROME, GLASS, DARK, WOOD, solid, glow, mesh, canvasTexture } from './materials.js';
import { projectPlateTexture, fillFit } from './type.js';

const loader = new THREE.TextureLoader();
const texCache = {};
export function imageTexture(src, aspect) {
  const key = src + aspect;
  if (texCache[key]) return texCache[key];
  const tex = loader.load(src, (t) => {
    const ia = t.image.width / t.image.height;
    if (ia > aspect) {
      t.repeat.set(aspect / ia, 1);
      t.offset.set((1 - aspect / ia) / 2, 0);
    } else {
      t.repeat.set(1, ia / aspect);
      t.offset.set(0, (1 - ia / aspect) / 2);
    }
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return (texCache[key] = tex);
}
export const screenMat = (src, aspect) => new THREE.MeshBasicMaterial({ map: imageTexture(src, aspect), toneMapped: false });

// ---------- Geodesic-style dome ----------
const FACETED = new THREE.MeshPhysicalMaterial({ color: '#f1f4f7', metalness: 0.5, roughness: 0.25, clearcoat: 1, flatShading: true });

export function makeDome(radius, color, { glass = false } = {}) {
  const g = new THREE.Group();
  const shell = mesh(new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), glass ? GLASS : FACETED);
  g.add(shell);
  if (glass) {
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.SphereGeometry(radius * 1.002, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)),
      new THREE.LineBasicMaterial({ color: '#ffffff' })
    );
    g.add(frame);
  }
  const base = mesh(new THREE.CylinderGeometry(radius * 1.04, radius * 1.08, 0.6, 32), BRUSHED, 0, 0.3, 0);
  g.add(base);
  const band = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.05, 0.08, 6, 48), glow(color, 2));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.65;
  g.add(band);
  // entrance
  const door = mesh(new THREE.BoxGeometry(radius * 0.5, radius * 0.6, radius * 0.5), FACETED, 0, radius * 0.3, radius * 0.9);
  g.add(door);
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 0.32, radius * 0.48), glow('#fff3cf', 1.2));
  doorGlow.position.set(0, radius * 0.26, radius * 1.151);
  g.add(doorGlow);
  // ring of round windows
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const w = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.09, 12), glow('#fff3cf', 1.2));
    const y = radius * 0.42;
    const rr = Math.sqrt(radius * radius - y * y) + 0.02;
    w.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
    w.lookAt(w.position.clone().multiplyScalar(2));
    g.add(w);
  }
  const spire = mesh(new THREE.CylinderGeometry(0.05, 0.12, radius * 0.4, 6), CHROME, 0, radius * 1.18, 0);
  g.add(spire);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glow(color, 3));
  tip.position.y = radius * 1.4;
  g.add(tip);
  return g;
}

// ---------- Drone ----------
// A delivery quadcopter: a sleek shell, four X arms with motors and two-blade props, landing legs and a camera.
export function makeDrone(color = '#2f6bff', parcel = false) {
  const g = new THREE.Group();
  const shell = new THREE.MeshPhysicalMaterial({ color: '#eef2f6', metalness: 0.3, roughness: 0.3, clearcoat: 1 });
  const grey = solid('#3a4049', { roughness: 0.5, metalness: 0.3 });
  const blade = solid('#20242b', { roughness: 0.5 });
  // body: a rounded top shell over a darker belly, with a coloured stripe
  const top = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), shell);
  top.scale.set(0.2, 0.1, 0.3);
  top.position.y = 0.02;
  g.add(top);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), grey);
  belly.scale.set(0.2, 0.07, 0.3);
  belly.position.y = 0.02;
  g.add(belly);
  const stripe = mesh(new THREE.TorusGeometry(1, 0.05, 6, 32), solid(color), 0, 0.025, 0);
  stripe.rotation.x = Math.PI / 2;
  stripe.scale.set(0.205, 0.305, 0.25);
  g.add(stripe);
  const rotors = [];
  for (const [x, z] of [[0.36, 0.32], [-0.36, 0.32], [0.36, -0.32], [-0.36, -0.32]]) {
    const len = Math.hypot(x, z);
    const arm = mesh(new THREE.BoxGeometry(0.045, 0.035, len), grey, x / 2, 0.02, z / 2);
    arm.rotation.y = Math.atan2(x, z);
    g.add(arm);
    g.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.07, 14), grey, x, 0.05, z));
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8), solid('#c9ced6', { metalness: 0.8, roughness: 0.3 }), x, 0.1, z));
    const prop = new THREE.Group();
    prop.position.set(x, 0.11, z);
    for (const sgn of [-1, 1]) {
      const b = mesh(new THREE.BoxGeometry(0.035, 0.006, 0.17), blade, 0, 0, sgn * 0.09, false);
      b.rotation.z = sgn * 0.18; // a little pitch on each blade
      prop.add(b);
    }
    g.add(prop);
    rotors.push(prop);
    // landing leg under each arm
    const leg = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), grey, x * 0.75, -0.06, z * 0.75, false);
    g.add(leg);
  }
  // gimbal camera at the front, nav lights
  g.add(mesh(new THREE.SphereGeometry(0.045, 12, 10), grey, 0, -0.04, 0.24));
  g.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 10), solid('#0b0d10', { roughness: 0.1, metalness: 0.6 }), 0, -0.04, 0.285, false).rotateX(Math.PI / 2));
  g.add(mesh(new THREE.SphereGeometry(0.018, 8, 6), glow('#e5484d', 1.2), -0.36, 0.04, 0.36, false));
  g.add(mesh(new THREE.SphereGeometry(0.018, 8, 6), glow('#22c55e', 1.2), 0.36, 0.04, 0.36, false));
  g.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), glow(color, 1.4), 0, 0.12, -0.2, false));
  if (parcel) {
    g.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.42, 4), grey, 0, -0.27, 0, false));
    const box = new THREE.Group();
    box.position.y = -0.62;
    box.add(mesh(new THREE.BoxGeometry(0.36, 0.28, 0.36), solid('#d9b98a', { roughness: 0.9 }), 0, 0, 0));
    box.add(mesh(new THREE.BoxGeometry(0.365, 0.285, 0.06), solid(color), 0, 0, 0, false));
    g.add(box);
  }
  g.scale.setScalar(1.6);
  g.userData.rotors = rotors;
  return g;
}

// ---------- Delivery scooter (rider sits on it) ----------
// A step-through Indian scooter: leg shield, floorboard, cushioned seat, small wheels, and a delivery box on the back.
export function makeScooter(color) {
  const g = new THREE.Group();
  const body = new THREE.MeshPhysicalMaterial({ color, metalness: 0.2, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2 });
  const trim = solid('#1d2129', { roughness: 0.6 });
  const tyre = solid('#16181d', { roughness: 0.9 });
  const steel = solid('#c9ced6', { metalness: 0.85, roughness: 0.25 });
  const R = 0.25;
  const wheel = (z) => {
    const w = new THREE.Group();
    w.position.set(0, R, z);
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R - 0.055, 0.055, 10, 24), tyre).rotateY(Math.PI / 2));
    w.add(mesh(new THREE.CylinderGeometry(R - 0.09, R - 0.09, 0.07, 18), steel, 0, 0, 0, false).rotateZ(Math.PI / 2));
    w.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10), trim, 0, 0, 0, false).rotateZ(Math.PI / 2));
    g.add(w);
    return w;
  };
  const wheels = [wheel(-0.6), wheel(0.64)];
  // rear body: the rounded cowl over the engine
  const cowl = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), body);
  cowl.scale.set(0.21, 0.2, 0.46);
  cowl.position.set(0, 0.56, -0.38);
  cowl.castShadow = true;
  g.add(cowl);
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.16, 0.5), body, 0, 0.44, -0.34));
  // engine and exhaust on the right
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.18, 0.36), trim, 0.06, 0.3, -0.48));
  const pipe = mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.5, 10), steel, 0.17, 0.27, -0.62);
  pipe.rotation.x = Math.PI / 2 - 0.15;
  g.add(pipe);
  // floorboard and the curved leg shield
  g.add(mesh(new THREE.BoxGeometry(0.34, 0.06, 0.52), trim, 0, 0.3, 0.12));
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.66, 20, 1, true, -Math.PI / 2 - 0.9, 1.8), body);
  shield.material.side = THREE.DoubleSide;
  shield.position.set(0, 0.62, 0.36);
  shield.rotation.x = -0.18;
  shield.castShadow = true;
  g.add(shield);
  // front nose and mudguard over the front wheel
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), body);
  nose.scale.set(0.17, 0.3, 0.12);
  nose.position.set(0, 0.62, 0.56);
  g.add(nose);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.06, 6, 18, Math.PI * 0.6), body);
  guard.rotation.set(0, Math.PI / 2, 0);
  guard.rotation.x = -0.35;
  guard.position.set(0, R, 0.64);
  g.add(guard);
  // fork, steering column, handlebar cover with headlight, grips and mirrors
  for (const x of [-0.07, 0.07]) {
    const f = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), steel, x, 0.5, 0.6);
    f.rotation.x = 0.28;
    g.add(f);
  }
  const col = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), trim, 0, 0.86, 0.47);
  col.rotation.x = 0.28;
  g.add(col);
  const head = new THREE.Group();
  head.position.set(0, 1.04, 0.41);
  g.add(head);
  const cover = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), body);
  cover.scale.set(0.2, 0.08, 0.12);
  head.add(cover);
  head.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 16), glow('#fff2c6', 0.8), 0, 0, 0.12).rotateX(Math.PI / 2));
  const bar = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 8), steel, 0, -0.01, -0.03);
  bar.rotation.z = Math.PI / 2;
  head.add(bar);
  for (const sx of [-1, 1]) {
    const grip = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.11, 8), trim, sx * 0.31, -0.01, -0.03);
    grip.rotation.z = Math.PI / 2;
    head.add(grip);
    const stalk = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 4), steel, sx * 0.17, 0.1, -0.02, false);
    stalk.rotation.z = -sx * 0.4;
    head.add(stalk);
    head.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 12), trim, sx * 0.22, 0.2, -0.02, false).rotateX(Math.PI / 2));
  }
  // seat with a grab rail
  const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.42, 6, 12), solid('#24262b', { roughness: 0.7 }));
  seat.rotation.x = Math.PI / 2;
  seat.scale.set(1, 1, 0.5);
  seat.position.set(0, 0.78, -0.32);
  g.add(seat);
  g.add(mesh(new THREE.TorusGeometry(0.12, 0.012, 6, 14, Math.PI), steel, 0, 0.8, -0.66, false).rotateX(-Math.PI / 2));
  // tail light and number plate
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.05, 0.03), glow('#e5484d', 0.8), 0, 0.6, -0.85, false));
  g.add(mesh(new THREE.BoxGeometry(0.18, 0.1, 0.01), solid('#f2c94c'), 0, 0.48, -0.86, false));
  // the delivery box on a rack: brand colour with a white band
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.03, 0.32), steel, 0, 0.84, -0.68));
  const box = new THREE.Group();
  box.position.set(0, 1.08, -0.72);
  box.add(mesh(new THREE.BoxGeometry(0.46, 0.44, 0.44), solid(color, { roughness: 0.6 }), 0, 0, 0));
  box.add(mesh(new THREE.BoxGeometry(0.465, 0.07, 0.445), solid('#ffffff'), 0, 0.06, 0, false));
  box.add(mesh(new THREE.BoxGeometry(0.47, 0.03, 0.45), trim, 0, 0.21, 0, false));
  g.add(box);
  g.userData.spin = (d) => {
    for (const w of wheels) w.rotation.x += d / R;
  };
  g.userData.mount = {
    seatY: 0.86,
    seatZ: -0.3,
    gripY: 1.03,
    gripZ: 0.38,
    lean: 0.08,
    // feet flat on the floorboard
    foot: (side) => [0.36, 0.14 + (side > 0 ? 0.02 : 0)],
  };
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return g;
}

// ---------- Desk with monitors ----------
export function makeDesk(screens = [], color = '#2f6bff') {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.07, 0.9), WHITE_METAL, 0, 0.92, 0));
  for (const x of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.06, 0.92, 0.8), BRUSHED, x, 0.46, 0));
  screens.slice(0, 2).forEach((tex, i) => {
    const x = screens.length > 1 ? (i - 0.5) * 1.0 : 0;
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), DARK, x, 1.13, -0.3));
    g.add(mesh(new THREE.BoxGeometry(0.98, 0.58, 0.05), DARK, x, 1.55, -0.3));
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.52), tex);
    s.position.set(x, 1.55, -0.27);
    const back = s.clone();
    back.position.z = -0.33;
    back.rotation.y = Math.PI;
    g.add(s, back);
  });
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.18), DARK, 0, 0.96, 0.15));
  const mug = mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 10), solid(color), 0.75, 1.0, 0.15);
  g.add(mug);
  return g;
}

// ---------- Dashboards drawn on canvas ----------
export function dashboardTexture(title, color, metrics = [], seed = 1) {
  return canvasTexture(1024, 576, (ctx, w, h) => {
    let s = seed;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    ctx.fillStyle = '#0d1424';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, 8);
    ctx.fillStyle = '#e8eef8';
    ctx.font = '700 40px Inter, sans-serif';
    ctx.fillText(title, 40, 70);
    ctx.fillStyle = '#7d8aa5';
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText('LIVE · campaign dashboard', 40, 104);
    metrics.slice(0, 3).forEach(([v, l], i) => {
      const x = 40 + i * 320;
      ctx.fillStyle = '#16203a';
      ctx.beginPath();
      ctx.roundRect(x, 130, 300, 130, 16);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = '800 56px Inter, sans-serif';
      fillFit(ctx, v, x + 22, 200, 260);
      ctx.fillStyle = '#9fb0cc';
      ctx.font = '500 20px Inter, sans-serif';
      fillFit(ctx, l, x + 22, 236, 260);
    });
    // bars
    for (let i = 0; i < 14; i++) {
      const bh = 40 + r() * 190;
      ctx.fillStyle = i % 3 ? '#2a3a5c' : color;
      ctx.fillRect(40 + i * 34, h - 40 - bh, 22, bh);
    }
    // line
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    let y = h - 90;
    for (let i = 0; i <= 10; i++) {
      y = Math.max(300, Math.min(h - 50, y - 20 + r() * 30 - i * 2));
      const x = 560 + i * 42;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  });
}

export function makeMonitorWall(textures, color, cols = 3) {
  const g = new THREE.Group();
  const rows = Math.ceil(textures.length / cols);
  const W = 2.4;
  const H = 1.35;
  const total = cols * W + (cols - 1) * 0.08;
  g.add(mesh(new THREE.BoxGeometry(total + 0.4, rows * H + 0.4, 0.2), DARK, 0, 1.4 + (rows * H) / 2, -0.12));
  textures.forEach((tex, i) => {
    const c = i % cols;
    const rr = Math.floor(i / cols);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(W, H), tex);
    s.position.set(-total / 2 + W / 2 + c * (W + 0.08), 1.6 + (rows - 1 - rr) * (H + 0.06) + H / 2 - 0.2, 0.0);
    const back = s.clone();
    back.position.z = -0.225;
    back.rotation.y = Math.PI;
    g.add(s, back);
  });
  for (const x of [-total / 2 + 0.3, total / 2 - 0.3]) g.add(mesh(new THREE.BoxGeometry(0.2, 1.6, 0.2), WHITE_METAL, x, 0.8, -0.12));
  const strip = new THREE.Mesh(new THREE.BoxGeometry(total + 0.4, 0.06, 0.06), glow(color, 2.5));
  strip.position.set(0, 1.45 + rows * H + 0.2, 0);
  g.add(strip);
  return g;
}

// ---------- Café ----------
export function makeCafe(color = '#7a4a2a') {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(3.4, 1.05, 1.2), WHITE_METAL, 0, 0.52, 0));
  g.add(mesh(new THREE.BoxGeometry(3.5, 0.08, 1.3), WOOD, 0, 1.08, 0));
  for (const x of [-1.6, 1.6]) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), WHITE_METAL, x, 1.4, -0.5));
  for (let i = 0; i < 7; i++) {
    const stripe = mesh(new THREE.BoxGeometry(0.52, 0.06, 1.9), solid(i % 2 ? '#fbf5ea' : color), -1.56 + i * 0.52, 2.85, 0.1);
    stripe.rotation.x = -0.22;
    g.add(stripe);
  }
  // espresso machine
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.55, 0.45), CHROME, -0.8, 1.4, -0.25));
  g.add(mesh(new THREE.BoxGeometry(0.82, 0.08, 0.47), solid(color), -0.8, 1.7, -0.25));
  // cups
  for (let i = 0; i < 5; i++) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.13, 10), solid('#ffffff'), 0.2 + i * 0.22, 1.18, 0.35));
  // menu board
  const menu = canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#20262f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f6e7c1';
    ctx.font = '700 46px "Bricolage Grotesque", Inter, sans-serif';
    ctx.fillText('Filter Coffee Bar', 28, 64);
    ctx.font = '500 30px Inter, sans-serif';
    const items = [['Bengaluru filter coffee', '₹40'], ['Cold brew', '₹120'], ['Masala chai', '₹30'], ['Idea espresso', 'free']];
    items.forEach(([n, p], i) => {
      ctx.fillText(n, 28, 130 + i * 48);
      ctx.fillText(p, w - 120, 130 + i * 48);
    });
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ map: menu, toneMapped: false }));
  board.position.set(0.9, 2.05, -0.48);
  g.add(board);
  // stools and tables
  for (const [x, z] of [[-2.6, 2.2], [0, 2.8], [2.6, 2.2]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 20), WHITE_METAL, x, 0.95, z));
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.95, 8), CHROME, x, 0.47, z));
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 10), solid('#ffffff'), x + 0.15, 1.04, z));
  }
  return g;
}

// ---------- Roadside ad billboard ----------
export function makeAdBoard(src, color, title) {
  const g = new THREE.Group();
  g.name = 'adboard';
  const W = 10;
  const H = 5.6;
  for (const x of [-3, 3]) g.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 6.5, 10), WHITE_METAL, x, 3.25, -0.3));
  g.add(mesh(new THREE.BoxGeometry(W + 0.5, H + 0.5, 0.35), WHITE_METAL, 0, 6.5 + H / 2, -0.2));
  const img = new THREE.Mesh(new THREE.PlaneGeometry(W, H), screenMat(src, W / H));
  img.position.set(0, 6.5 + H / 2, 0.0);
  const imgBack = img.clone();
  imgBack.position.z = -0.38;
  imgBack.rotation.y = Math.PI;
  g.add(img, imgBack);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.1, 0.1), glow(color, 2.5));
  strip.position.set(0, 6.5 + H + 0.32, -0.02);
  g.add(strip);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.12), new THREE.MeshBasicMaterial({ map: projectPlateTexture({ title, client: 'Now showing' }, color, 5), toneMapped: false }));
  tag.position.set(-W / 2 + 2.8, 6.5 - 0.42, 0.02);
  const tagBack = tag.clone();
  tagBack.position.set(W / 2 - 2.8, 6.5 - 0.42, -0.4);
  tagBack.rotation.y = Math.PI;
  g.add(tag, tagBack);
  img.userData.dynamic = tag.userData.dynamic = imgBack.userData.dynamic = tagBack.userData.dynamic = true;
  return { g, img, tag, imgBack, tagBack };
}
