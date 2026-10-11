import * as THREE from 'three';
import { cuspedArchPoints, makeChhatri } from './jaipur.js';
import { HAMLETS } from './data.js';
import { groundAt, walkY, rng, distToPath, ROAD_HALF, POND, PATHS, ZONES, coastR, SEA_LEVEL, SURFACE } from './world.js';
import { WHITE_METAL, BRUSHED, CHROME, CONCRETE, GLASS, DARK as DARK_RAIL, mesh, canvasTexture, glow, mergeStatic, lightPool, solid } from './materials.js';

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
      const y = groundAt(x, z);
      if (distToPath(x, z) < ROAD_HALF + 1.6 || ZONES.some((zn) => Math.hypot(x - zn.x, z - zn.z) < 16)) continue;
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
    const d = 92 + r() * 38;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (distToPath(x, z) < 8 || HAMLETS.some((h) => Math.hypot(x - h.x, z - h.z) < 26) || ZONES.some((zn) => Math.hypot(x - zn.x, z - zn.z) < 22)) continue;
    const hgt = 10 + r() * 16;
    const w = 2 + r() * 3;
    const s = mesh(slabGeo, WHITE_METAL, x, groundAt(x, z) + hgt / 2 - 1, z);
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
  // a cusped Rajput arch, as on Jaipur's city gates
  const pts = cuspedArchPoints(2.9, 3.4, 9, 0.14);
  const hole = new THREE.Path();
  hole.moveTo(pts[0][0], 0.001);
  for (const [x, y] of pts.slice(1)) hole.lineTo(x, Math.max(y, 0.001));
  hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2, curveSegments: 24 });
  geo.translate(0, 0, -0.6);
  g.add(mesh(geo, WHITE_METAL));
  // glowing inner trim in the department colour
  const curve = new THREE.CatmullRomCurve3(pts.slice(1, -1).map(([x, y]) => new THREE.Vector3(x, y, 0.66)));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.07, 6, false), glow(color, 2.5)));
  for (const sx of [-1, 1]) {
    const c = makeChhatri(1.15);
    c.position.set(sx * 3.5, 9.05, 0);
    g.add(c);
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
  const ys = pts.map((p) => groundAt(p.x, p.z));
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
    const g = groundAt(p.x, p.z);
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
    it.base = new THREE.Vector3(x, groundAt(x, z) + it.h, z);
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
  ring.position.set(POND.x, groundAt(POND.x + POND.r * 1.38, POND.z) - 0.1, POND.z);
  scene.add(ring);
}

// Street lamps along every road; their heads glow and pool light on the road at night.
export function buildStreetLamps(world, colliders) {
  const group = new THREE.Group();
  const pools = new THREE.Group();
  world.add(group, pools);
  const head = glow('#fff1c9', 1.6);
  const poolMat = lightPool('#ffd99a', 0.38);
  const poolGeo = new THREE.PlaneGeometry(7, 7);
  poolGeo.rotateX(-Math.PI / 2);
  for (const [ax, az, bx, bz] of PATHS) {
    const len = Math.hypot(bx - ax, bz - az);
    const nx = -(bz - az) / len;
    const nz = (bx - ax) / len;
    for (let d = 16, k = 0; d < len - 12; d += 15, k++) {
      const t = d / len;
      const side = k % 2 ? 1 : -1;
      const x = ax + (bx - ax) * t + nx * (ROAD_HALF + 0.7) * side;
      const z = az + (bz - az) * t + nz * (ROAD_HALF + 0.7) * side;
      if (Math.hypot(x, z) < 12 || HAMLETS.some((h) => Math.hypot(x - h.x, z - h.z) < 16) || ZONES.some((zn) => Math.hypot(x - zn.x, z - zn.z) < 14)) continue;
      const y = groundAt(x, z);
      const lamp = new THREE.Group();
      lamp.position.set(x, y, z);
      lamp.rotation.y = Math.atan2(-nx * side, -nz * side);
      lamp.add(mesh(new THREE.CylinderGeometry(0.07, 0.11, 4.6, 8), WHITE_METAL, 0, 2.3, 0));
      lamp.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 1.3), WHITE_METAL, 0, 4.55, 0.6));
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.6), head);
      h.position.set(0, 4.47, 1.15);
      lamp.add(h);
      group.add(lamp);
      const pool = new THREE.Mesh(poolGeo, poolMat);
      const px = x - nx * side * 1.1;
      const pz = z - nz * side * 1.1;
      pool.position.set(px, groundAt(px, pz) + 0.12, pz);
      pools.add(pool);
      colliders.push({ x, z, r: 0.25 });
    }
  }
  for (const lamp of group.children) {
    lamp.updateMatrix();
  }
  // bake lamps into a couple of meshes
  const flat = new THREE.Group();
  group.updateMatrixWorld(true);
  for (const lamp of [...group.children]) {
    for (const m of [...lamp.children]) {
      m.applyMatrix4(lamp.matrix);
      flat.add(m);
    }
  }
  world.remove(group);
  world.add(flat);
  mergeStatic(flat);
  mergeStatic(pools);
}

// ---------- Coast: a jetty with a bobbing sailboat, and a lighthouse ----------

export function buildCoast(scene, colliders) {
  const deck = new THREE.MeshStandardMaterial({ color: '#b08a5f', roughness: 0.85 });
  const ja = THREE.MathUtils.degToRad(60);
  const R = coastR(ja);
  const jetty = new THREE.Group();
  const start = R - 10;
  jetty.position.set(Math.cos(ja) * start, 0, Math.sin(ja) * start);
  jetty.rotation.y = Math.atan2(Math.cos(ja), Math.sin(ja));
  const len = 34;
  const topY = SEA_LEVEL + 1.3;
  for (let k = 0; k < len / 2; k++) {
    const z = k * 2;
    jetty.add(mesh(new THREE.BoxGeometry(3.4, 0.2, 1.9), deck, 0, topY, z));
    if (k % 2 === 0) for (const x of [-1.6, 1.6]) jetty.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 4, 8), deck, x, topY - 1.8, z));
  }
  for (const x of [-1.65, 1.65]) jetty.add(mesh(new THREE.BoxGeometry(0.1, 0.1, len), WHITE_METAL, x, topY + 0.7, len / 2 - 1));
  for (let k = 0; k < 6; k++) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), glow('#fff1c9', 2));
    lamp.position.set(k % 2 ? 1.65 : -1.65, topY + 1.0, 2 + k * 6);
    jetty.add(lamp);
  }
  scene.add(jetty);
  mergeStatic(jetty);
  // Walkable deck for the player (an oriented strip).
  const jettyInfo = { x0: jetty.position.x, z0: jetty.position.z, dx: Math.cos(ja), dz: Math.sin(ja), len: len - 1, half: 1.5, y: topY + 0.1 };

  // Sailboat moored at the end
  const boat = new THREE.Group();
  const hull = mesh(new THREE.CylinderGeometry(1.3, 0.7, 5.5, 16, 1, false, 0, Math.PI), WHITE_METAL);
  hull.rotation.set(Math.PI / 2, 0, Math.PI);
  hull.position.y = 0.2;
  boat.add(hull);
  boat.add(mesh(new THREE.BoxGeometry(2.4, 0.15, 5.2), deck, 0, 0.25, 0));
  boat.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 7, 8), CHROME, 0, 3.7, 0.4));
  const sail = new THREE.Shape();
  sail.moveTo(0, 0);
  sail.lineTo(0, 6.2);
  sail.lineTo(-2.8, 0.2);
  sail.lineTo(0, 0);
  const sailMesh = new THREE.Mesh(new THREE.ShapeGeometry(sail), new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.6 }));
  sailMesh.position.set(0, 0.6, 0.4);
  sailMesh.rotation.y = Math.PI / 2;
  sailMesh.castShadow = true;
  boat.add(sailMesh);
  boat.add(mesh(new THREE.BoxGeometry(2.42, 0.18, 0.4), glow('#2f6bff', 1.5), 0, 0.55, 2.2));
  const bd = start + len + 3;
  boat.position.set(Math.cos(ja) * bd + Math.cos(ja + Math.PI / 2) * 4, SEA_LEVEL + 0.2, Math.sin(ja) * bd + Math.sin(ja + Math.PI / 2) * 4);
  boat.rotation.y = jetty.rotation.y;
  scene.add(boat);

  // Lighthouse on a rocky point
  const la = THREE.MathUtils.degToRad(205);
  const lr = coastR(la) - 6;
  const lx = Math.cos(la) * lr;
  const lz = Math.sin(la) * lr;
  const ly = Math.max(groundAt(lx, lz), SEA_LEVEL + 0.5);
  const lh = new THREE.Group();
  lh.position.set(lx, ly, lz);
  for (let k = 0; k < 5; k++) {
    const seg = mesh(new THREE.CylinderGeometry(1.6 - k * 0.18, 1.78 - k * 0.18, 2.4, 20), k % 2 ? solid('#e5484d') : WHITE_METAL, 0, 1.2 + k * 2.4, 0);
    lh.add(seg);
  }
  lh.add(mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 20), DARK_RAIL, 0, 12.1, 0));
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.2, 16), glow('#fff4c2', 3));
  lamp.position.y = 12.8;
  lh.add(lamp);
  lh.add(mesh(new THREE.ConeGeometry(1.25, 1.2, 20), solid('#e5484d'), 0, 14, 0));
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(3, 26, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: '#fff4c2', transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.x = 13;
  const beamPivot = new THREE.Group();
  beamPivot.position.y = 12.8;
  beamPivot.add(beam);
  lh.add(beamPivot);
  scene.add(lh);
  colliders.push({ x: lx, z: lz, r: 2 });

  return {
    jetty: jettyInfo,
    update: (t, night) => {
      boat.position.y = SEA_LEVEL + 0.2 + Math.sin(t * 1.1) * 0.15;
      boat.rotation.z = Math.sin(t * 0.9) * 0.05;
      boat.rotation.x = Math.sin(t * 0.7) * 0.03;
      beamPivot.rotation.y = t * 0.6;
      beam.material.opacity = 0.02 + night * 0.1;
    },
  };
}
