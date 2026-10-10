import * as THREE from 'three';
import { HAMLETS } from './data.js';
import { heightAt, rng, distToPath, ROAD_HALF, POND } from './world.js';
import { WHITE_METAL, BRUSHED, CHROME, CONCRETE, GLASS, mesh, canvasTexture, glow, mergeStatic } from './materials.js';

// White-metal monoliths, fluted columns and arches lining the roads.
export function buildMonoliths(world, colliders) {
  const r = rng(17);
  const scene = new THREE.Group();
  world.add(scene);
  const slabGeo = new THREE.BoxGeometry(1, 1, 1);
  const fluted = new THREE.CylinderGeometry(1, 1, 1, 22, 1);
  HAMLETS.forEach((h) => {
    const ca = Math.cos(h.angle);
    const sa = Math.sin(h.angle);
    // along each spoke road
    for (let k = 0; k < 5; k++) {
      const d = 18 + k * 9.5 + r() * 2;
      const side = k % 2 ? 1 : -1;
      const off = ROAD_HALF + 2.2 + r() * 3;
      const x = ca * d - sa * off * side;
      const z = sa * d + ca * off * side;
      const y = heightAt(x, z);
      if (r() < 0.6) {
        const w = 1.2 + r() * 1.4;
        const hgt = 4 + r() * 7;
        const s = mesh(slabGeo, WHITE_METAL, x, y + hgt / 2 - 0.3, z);
        s.scale.set(w, hgt, 0.7 + r() * 0.6);
        s.rotation.y = h.angle + (r() - 0.5) * 0.5;
        scene.add(s);
        colliders.push({ x, z, r: w * 0.7 });
      } else {
        const hgt = 3 + r() * 6;
        const rad = 0.7 + r() * 0.5;
        const c = mesh(fluted, BRUSHED, x, y + hgt / 2 - 0.2, z);
        c.scale.set(rad, hgt, rad);
        c.material = BRUSHED;
        scene.add(c);
        const cap = mesh(slabGeo, WHITE_METAL, x, y + hgt, z);
        cap.scale.set(rad * 2.4, 0.35, rad * 2.4);
        scene.add(cap);
        colliders.push({ x, z, r: rad + 0.2 });
      }
    }
  });
  // A few big free-standing slabs on the hills, for silhouette.
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2;
    const d = 95 + r() * 65;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (distToPath(x, z) < 8 || HAMLETS.some((h) => Math.hypot(x - h.x, z - h.z) < 26)) continue;
    const hgt = 10 + r() * 16;
    const w = 2 + r() * 3;
    const s = mesh(slabGeo, WHITE_METAL, x, heightAt(x, z) + hgt / 2 - 1, z);
    s.scale.set(w, hgt, 1.2 + r());
    s.rotation.y = r() * Math.PI;
    scene.add(s);
    colliders.push({ x, z, r: w * 0.7 });
  }
  mergeStatic(scene);
}

// An arch gate in white metal. Faces +Z. Width ~9, height 9, opening ~5.8.
export function makeArch(color, label) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-4.4, 0);
  shape.lineTo(4.4, 0);
  shape.lineTo(4.4, 9);
  shape.lineTo(-4.4, 9);
  shape.lineTo(-4.4, 0);
  const hole = new THREE.Path();
  hole.moveTo(-2.9, 0);
  hole.lineTo(2.9, 0);
  hole.lineTo(2.9, 4.3);
  hole.absarc(0, 4.3, 2.9, 0, Math.PI, false);
  hole.lineTo(-2.9, 0);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2, curveSegments: 24 });
  geo.translate(0, 0, -0.6);
  g.add(mesh(geo, WHITE_METAL));
  // glowing inner trim in the department colour
  const trim = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.07, 8, 32, Math.PI), glow(color, 2.5));
  trim.position.set(0, 4.3, 0.62);
  g.add(trim);
  for (const sx of [-2.9, 2.9]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.3, 0.12), glow(color, 2.5));
    bar.position.set(sx, 2.15, 0.62);
    g.add(bar);
  }
  if (label) {
    const tex = canvasTexture(1024, 160, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1b2433';
      ctx.font = '700 84px "Bricolage Grotesque", Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label.toUpperCase(), w / 2, h / 2 + 4, w - 40);
    });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.25), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    plate.position.set(0, 8.05, 0.7);
    g.add(plate);
  }
  return g;
}

// Elevated white rail that loops round the village, with pods gliding on it.
export function buildSkyRail(scene, colliders) {
  const pts = [];
  const N = 48;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rad = 104 + Math.sin(a * 3) * 6;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    pts.push(new THREE.Vector3(x, 0, z));
  }
  // smooth height a fixed distance above a smoothed ground line
  const ys = pts.map((p) => heightAt(p.x, p.z));
  pts.forEach((p, i) => {
    let s = 0;
    for (let k = -3; k <= 3; k++) s = Math.max(s, ys[(i + k + N) % N]);
    p.y = s + 8;
  });
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const beam = mesh(new THREE.TubeGeometry(curve, 480, 0.75, 12, true), WHITE_METAL);
  scene.add(beam);
  const rail = mesh(new THREE.TubeGeometry(curve, 480, 0.12, 6, true), CHROME);
  rail.position.y = 0.85;
  scene.add(rail);
  const pillarGeo = new THREE.CylinderGeometry(0.45, 0.7, 1, 12);
  const pillars = new THREE.Group();
  scene.add(pillars);
  for (let i = 0; i < 64; i++) {
    const p = curve.getPointAt(i / 64);
    if (distToPath(p.x, p.z) < ROAD_HALF + 1.5) continue;
    const g = heightAt(p.x, p.z);
    const hgt = p.y - g;
    const pil = mesh(pillarGeo, BRUSHED, p.x, g + hgt / 2 - 0.4, p.z);
    pil.scale.y = hgt;
    pillars.add(pil);
    colliders.push({ x: p.x, z: p.z, r: 0.8 });
  }
  mergeStatic(pillars);
  const pods = [];
  const podColors = ['#2f6bff', '#ff4f8b', '#00a79d'];
  for (let i = 0; i < 3; i++) {
    const pod = new THREE.Group();
    const body = mesh(new THREE.CapsuleGeometry(1.1, 3.2, 6, 16), WHITE_METAL);
    body.rotation.x = Math.PI / 2;
    const win = mesh(new THREE.CapsuleGeometry(1.12, 2.4, 6, 16, 0), GLASS);
    win.rotation.x = Math.PI / 2;
    win.scale.set(1.0, 1, 0.55);
    win.position.y = 0.35;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.06, 6, 24), glow(podColors[i], 2));
    stripe.position.z = 1.2;
    pod.add(body, win, stripe);
    scene.add(pod);
    pods.push({ pod, off: i / 3 });
  }
  const tmp = new THREE.Vector3();
  return (t) => {
    for (const { pod, off } of pods) {
      const u = (((t * 0.012 + off) % 1) + 1) % 1;
      const p = curve.getPointAt(u);
      pod.position.set(p.x, p.y + 1.9, p.z);
      tmp.copy(curve.getTangentAt(u)).add(pod.position);
      pod.lookAt(tmp);
    }
  };
}

// Giant floating commerce props, a wink to the Razorpay Magic Checkout world.
export function buildFloatingProps(scene) {
  const items = [];
  // Rupee coin
  const faceTex = canvasTexture(512, 512, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 20, w / 2, w / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#cfd6dd');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = '#b8c1ca';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(w / 2, w / 2, w / 2 - 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#aab4bf';
    ctx.font = '700 300px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹', w / 2, w / 2 + 14);
  });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: faceTex, metalness: 0.6, roughness: 0.25, clearcoat: 1 });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.8, 64), [BRUSHED, faceMat, faceMat]);
  coin.castShadow = true;
  const coinG = new THREE.Group();
  coin.rotation.x = Math.PI / 2;
  coinG.add(coin);
  items.push({ obj: coinG, a: -1.25, d: 120, h: 14, spin: 0.4 });

  // Shopping cart in chrome wire
  const cart = new THREE.Group();
  const wire = new THREE.CylinderGeometry(0.06, 0.06, 1, 6);
  const bar = (x1, y1, z1, x2, y2, z2) => {
    const a = new THREE.Vector3(x1, y1, z1);
    const b = new THREE.Vector3(x2, y2, z2);
    const m = mesh(wire, CHROME);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.scale.y = a.distanceTo(b);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    cart.add(m);
  };
  for (let i = 0; i <= 6; i++) {
    const x = -1.5 + i * 0.5;
    bar(x, 1, -1, x * 1.15, 2.4, -1.25);
    bar(x, 1, 1, x * 1.15, 2.4, 1.25);
    bar(x, 1, -1, x, 1, 1);
  }
  for (let i = 0; i <= 4; i++) {
    const z = -1 + i * 0.5;
    bar(-1.5, 1, z, -1.72, 2.4, z * 1.25);
    bar(1.5, 1, z, 1.72, 2.4, z * 1.25);
  }
  bar(-1.72, 2.4, -1.25, 1.72, 2.4, -1.25);
  bar(-1.72, 2.4, 1.25, 1.72, 2.4, 1.25);
  bar(1.72, 2.4, -1.25, 2.5, 2.9, -1.25);
  bar(1.72, 2.4, 1.25, 2.5, 2.9, 1.25);
  bar(2.5, 2.9, -1.25, 2.5, 2.9, 1.25);
  for (const [x, z] of [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]]) {
    bar(x, 1, z, x, 0.3, z);
    const wheel = mesh(new THREE.TorusGeometry(0.22, 0.08, 8, 16), CHROME, x, 0.25, z);
    cart.add(wheel);
  }
  cart.scale.setScalar(1.6);
  items.push({ obj: cart, a: 0.95, d: 128, h: 10, spin: 0.15 });

  // Wallet
  const wallet = new THREE.Group();
  wallet.add(mesh(new THREE.BoxGeometry(5, 3.4, 0.8), WHITE_METAL));
  const flap = mesh(new THREE.BoxGeometry(5.04, 1.3, 0.86), BRUSHED, 0, 0.6, 0.02);
  wallet.add(flap);
  wallet.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 20), CHROME, 1.6, 0.55, 0.5));
  wallet.children[2].rotation.x = Math.PI / 2;
  items.push({ obj: wallet, a: 2.7, d: 122, h: 13, spin: 0.25 });

  // Shopping bag
  const bag = new THREE.Group();
  bag.add(mesh(new THREE.BoxGeometry(3, 3.6, 1.6), WHITE_METAL));
  const handle = mesh(new THREE.TorusGeometry(0.7, 0.09, 8, 20, Math.PI), CHROME, 0, 1.8, 0);
  bag.add(handle);
  items.push({ obj: bag, a: 4.4, d: 118, h: 11, spin: 0.3 });

  for (const it of items) {
    const x = Math.cos(it.a) * it.d;
    const z = Math.sin(it.a) * it.d;
    it.base = new THREE.Vector3(x, heightAt(x, z) + it.h, z);
    it.obj.position.copy(it.base);
    scene.add(it.obj);
  }
  return (t) => {
    for (const it of items) {
      it.obj.position.y = it.base.y + Math.sin(t * 0.6 + it.a) * 1.2;
      it.obj.rotation.y = t * it.spin + it.a;
      it.obj.rotation.z = Math.sin(t * 0.4 + it.a) * 0.08;
    }
  };
}

// Small decking + stone ring around the pond.
export function buildPondEdge(scene) {
  const ring = mesh(new THREE.TorusGeometry(POND.r * 1.38, 0.35, 8, 48), CONCRETE);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(POND.x, heightAt(POND.x + POND.r * 1.38, POND.z) - 0.1, POND.z);
  scene.add(ring);
}
