// The leadership layer of the island: the brief board under the jamun tree (the studio method on
// one side, the campaigns you can run on the other) and the campaign threads, glowing strings in
// the sky that link every team a campaign passed through, like kite strings over Jaipur.
import * as THREE from 'three';
import { makeSignboard, INDIGO } from './jaipur.js';
import { FONT, fit, fitWrap, wrap } from './type.js';
import { CENTER, METHOD, CAMPAIGNS, PROJECTS } from './data.js';

export const CAMPAIGN_COLORS = { trial: '#f2a516', t20: '#2f6bff', ring: '#7b5cff', money: '#00a79d' };

function methodSide(c, w, h) {
  const pad = 96;
  c.textBaseline = 'top';
  c.fillStyle = CENTER.color;
  c.fillRect(pad, 104, 46, 12);
  c.fillStyle = INDIGO;
  if ('letterSpacing' in c) c.letterSpacing = '5px';
  fit(c, 'HOW A BRIEF MOVES THROUGH THE STUDIO', { weight: 400, size: 30, min: 16, family: FONT.mono, maxW: w - pad * 2 - 70 });
  c.fillText('HOW A BRIEF MOVES THROUGH THE STUDIO', pad + 66, 96);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.fillStyle = '#2a1d14';
  fit(c, 'The studio method', { weight: 800, size: 104, min: 50, maxW: w - pad * 2 });
  c.fillText('The studio method', pad, 150);
  // six steps in a 3 × 2 grid, each a numbered card
  const top = 300;
  const gap = 28;
  const cw = (w - pad * 2 - gap * 2) / 3;
  const ch = (h - top - 150 - gap) / 2;
  METHOD.forEach((m, i) => {
    const x = pad + (i % 3) * (cw + gap);
    const y = top + Math.floor(i / 3) * (ch + gap);
    c.fillStyle = 'rgba(34,64,138,0.07)';
    c.fillRect(x, y, cw, ch);
    c.fillStyle = INDIGO;
    c.fillRect(x, y, 8, ch);
    c.fillStyle = CENTER.color;
    c.font = `700 34px ${FONT.mono}`;
    c.fillText(String(i + 1).padStart(2, '0'), x + 32, y + 26);
    c.fillStyle = '#2a1d14';
    fit(c, m.step, { weight: 800, size: 60, min: 30, maxW: cw - 130 });
    c.fillText(m.step, x + 104, y + 16);
    c.fillStyle = '#5b4637';
    c.font = `500 34px ${FONT.sans}`;
    wrap(c, m.line, cw - 64, 3).forEach((l, k) => c.fillText(l, x + 32, y + 98 + k * 44));
  });
  c.fillStyle = INDIGO;
  c.textAlign = 'right';
  c.font = `italic 400 50px ${FONT.serif}`;
  c.fillText('— Vibhor', w - pad, h - 124);
  c.textAlign = 'left';
  c.font = `600 34px ${FONT.sans}`;
  c.fillStyle = '#8a5a2b';
  c.fillText('Walk round the board to pick up a brief →', pad, h - 116);
}

function briefsSide(c, w, h) {
  const pad = 96;
  c.textBaseline = 'top';
  c.fillStyle = '#e0786a';
  c.fillRect(pad, 104, 46, 12);
  c.fillStyle = INDIGO;
  if ('letterSpacing' in c) c.letterSpacing = '5px';
  c.font = `400 30px ${FONT.mono}`;
  c.fillText('RUN A CAMPAIGN', pad + 66, 96);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.fillStyle = '#2a1d14';
  fit(c, 'Pick up a brief', { weight: 800, size: 104, min: 50, maxW: w - pad * 2 });
  c.fillText('Pick up a brief', pad, 150);
  // four brief cards pinned to the board
  const top = 300;
  const gap = 28;
  const cw = (w - pad * 2 - gap) / 2;
  const ch = (h - top - 150 - gap) / 2;
  CAMPAIGNS.forEach((cp, i) => {
    const x = pad + (i % 2) * (cw + gap);
    const y = top + Math.floor(i / 2) * (ch + gap);
    const col = CAMPAIGN_COLORS[cp.id] || CENTER.color;
    c.fillStyle = '#fffaf0';
    c.fillRect(x, y, cw, ch);
    c.strokeStyle = 'rgba(42,29,20,0.18)';
    c.lineWidth = 2;
    c.strokeRect(x, y, cw, ch);
    c.fillStyle = col;
    c.fillRect(x, y, cw, 12);
    // a pin
    c.fillStyle = '#c0392b';
    c.beginPath();
    c.arc(x + cw / 2, y + 30, 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = col;
    c.font = `500 26px ${FONT.mono}`;
    const client = PROJECTS[cp.slug].client.toUpperCase();
    fit(c, client, { weight: 500, size: 26, min: 14, family: FONT.mono, maxW: cw - 64 });
    c.fillText(client, x + 32, y + 56);
    c.fillStyle = '#2a1d14';
    const t = fitWrap(c, cp.title, { weight: 800, size: 56, min: 30, maxW: cw - 64, maxLines: 1 });
    c.fillText(t.lines[0], x + 32, y + 94);
    c.fillStyle = '#5b4637';
    c.font = `500 30px ${FONT.sans}`;
    wrap(c, cp.brief, cw - 64, 3).forEach((l, k) => c.fillText(l, x + 32, y + 166 + k * 40));
  });
  c.fillStyle = '#8a5a2b';
  c.font = `600 34px ${FONT.sans}`;
  c.fillText('Press E (or tap the board) to take a brief', pad, h - 116);
}

export function buildStory(scene, { colliders, interactables, clickables, groundAt, places }) {
  // ---- the brief board, beside the road you arrive on ----
  const a = THREE.MathUtils.degToRad(70);
  const bx = Math.cos(a) * 14.2;
  const bz = Math.sin(a) * 14.2;
  const board = makeSignboard({ name: 'brief-board', color: CENTER.color, W: 4.8, H: 2.9, y0: 0.9, res: 2000, front: methodSide, back: briefsSide });
  board.position.set(bx, groundAt(bx, bz), bz);
  const rot = Math.atan2(0 - bx, 24 - bz); // faces the arrival road
  board.rotation.y = rot;
  scene.add(board);
  const action = { kind: 'briefs' };
  board.traverse((o) => {
    if (o.isMesh) {
      o.userData.action = action;
      clickables.push(o);
    }
  });
  for (const sx of [-1, 1]) colliders.push({ x: bx + Math.cos(rot) * sx * 2.46, z: bz - Math.sin(rot) * sx * 2.46, r: 0.4 });
  colliders.push({ x: bx, z: bz, r: 0.5 });
  for (const side of [1, -1]) {
    interactables.push({ kind: 'briefs', label: side > 0 ? 'The studio method' : 'The brief board', verb: 'Pick up a brief', x: bx + Math.sin(rot) * 1.4 * side, z: bz + Math.cos(rot) * 1.4 * side });
  }

  // ---- campaign threads: one glowing string per hop between teams ----
  const P = (id) => places.find((p) => p.id === id);
  const threads = [];
  const packetGeo = new THREE.OctahedronGeometry(0.75, 0);
  CAMPAIGNS.forEach((cp, ci) => {
    const color = CAMPAIGN_COLORS[cp.id] || '#ffffff';
    const route = ['hq'];
    for (const s of cp.stops) if (route[route.length - 1] !== s.place) route.push(s.place);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false, fog: true });
    const packetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45), toneMapped: false, transparent: true, opacity: 0.85 });
    const group = new THREE.Group();
    group.name = `thread-${cp.id}`;
    const curves = [];
    for (let k = 0; k < route.length - 1; k++) {
      const A = P(route[k]);
      const B = P(route[k + 1]);
      const lift = 15 + ci * 2.2;
      const a3 = new THREE.Vector3(A.x, groundAt(A.x, A.z) + lift, A.z);
      const b3 = new THREE.Vector3(B.x, groundAt(B.x, B.z) + lift, B.z);
      const d = a3.distanceTo(b3);
      const mid = a3.clone().lerp(b3, 0.5);
      mid.y += 6 + d * 0.18;
      // nudge sideways so campaigns sharing a hop don't overlap
      const side = new THREE.Vector3(-(b3.z - a3.z), 0, b3.x - a3.x).normalize().multiplyScalar((ci - 1.5) * 2.4);
      mid.add(side);
      const curve = new THREE.QuadraticBezierCurve3(a3, mid, b3);
      curves.push(curve);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.17, 6, false), mat);
      group.add(tube);
    }
    const packets = [];
    curves.forEach((curve, k) => {
      for (let j = 0; j < 2; j++) {
        const m = new THREE.Mesh(packetGeo, packetMat);
        m.userData.phase = j * 0.5 + k * 0.13;
        m.userData.curve = curve;
        group.add(m);
        packets.push(m);
      }
    });
    scene.add(group);
    threads.push({ id: cp.id, group, mat, packetMat, packets, color });
  });

  const tmp = new THREE.Vector3();
  function update(t, activeId) {
    for (const th of threads) {
      const on = activeId === th.id;
      const target = activeId ? (on ? 0.95 : 0.1) : 0.32;
      th.mat.opacity += (target - th.mat.opacity) * 0.06;
      th.packetMat.opacity = activeId && !on ? 0.2 : 0.9;
      const speed = on ? 0.16 : 0.06;
      for (const m of th.packets) {
        const u = (t * speed + m.userData.phase) % 1;
        m.userData.curve.getPointAt(u, tmp);
        m.position.copy(tmp);
        m.rotation.y = t * 2;
        m.scale.setScalar(on ? 1.5 : 1);
      }
    }
  }
  return { update, board };
}
