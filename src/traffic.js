// The org at work between teams: people carrying fresh briefs, chasing approvals and pairing up,
// and the chatter overhead: envelopes, likes, messages and posts flying from hamlet to hamlet.
import * as THREE from 'three';
import { HAMLETS } from './data.js';
import { walkY, rng } from './world.js';
import { canvasTexture } from './materials.js';
import { makePerson, giveProp } from './characters.js';
import { playerPos } from './village.js';

// ---------- A floating tag above a walker, e.g. "📄 Brief → Brand" ----------

function tagTexture(icon, text, color) {
  return canvasTexture(512, 112, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.font = '700 40px Inter, sans-serif';
    const tw = Math.min(w - 8, c.measureText(text).width + 110);
    const x0 = (w - tw) / 2;
    c.fillStyle = 'rgba(15,23,42,0.86)';
    c.fillRect(x0, 10, tw, 76);
    c.fillStyle = color;
    c.fillRect(x0, 10, 10, 76);
    drawIcon(c, icon, x0 + 50, 48, 22, color);
    c.fillStyle = '#ffffff';
    c.textBaseline = 'middle';
    c.fillText(text, x0 + 86, 50, tw - 100);
    c.fillStyle = 'rgba(15,23,42,0.86)';
    c.beginPath();
    c.moveTo(w / 2 - 12, 86);
    c.lineTo(w / 2, 104);
    c.lineTo(w / 2 + 12, 86);
    c.fill();
  });
}

// Small vector icons, drawn by hand so they look the same everywhere (no emoji fonts needed).
function drawIcon(c, kind, x, y, s, color = '#2f6bff') {
  c.save();
  c.translate(x, y);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  switch (kind) {
    case 'mail':
      c.fillStyle = '#ffffff';
      c.fillRect(-s, -s * 0.68, s * 2, s * 1.36);
      c.strokeStyle = color;
      c.lineWidth = s * 0.16;
      c.strokeRect(-s, -s * 0.68, s * 2, s * 1.36);
      c.beginPath();
      c.moveTo(-s, -s * 0.68);
      c.lineTo(0, s * 0.15);
      c.lineTo(s, -s * 0.68);
      c.stroke();
      break;
    case 'heart':
      c.fillStyle = '#ff3b6b';
      c.beginPath();
      c.moveTo(0, s * 0.9);
      c.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.7, -s * 1.1, 0, -s * 0.35);
      c.bezierCurveTo(s * 0.7, -s * 1.1, s * 1.4, -s * 0.1, 0, s * 0.9);
      c.fill();
      break;
    case 'chat':
      c.fillStyle = '#22c55e';
      c.beginPath();
      c.ellipse(0, -s * 0.1, s, s * 0.78, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(-s * 0.5, s * 0.45);
      c.lineTo(-s * 0.85, s * 1.0);
      c.lineTo(-s * 0.05, s * 0.6);
      c.fill();
      c.fillStyle = '#ffffff';
      for (const dx of [-0.45, 0, 0.45]) {
        c.beginPath();
        c.arc(dx * s, -s * 0.1, s * 0.13, 0, Math.PI * 2);
        c.fill();
      }
      break;
    case 'post':
      // a little bird, for posts and tweets
      c.fillStyle = '#1d9bf0';
      c.beginPath();
      c.ellipse(0, s * 0.1, s * 0.75, s * 0.55, -0.2, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(s * 0.55, -s * 0.35, s * 0.36, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(s * 0.85, -s * 0.38);
      c.lineTo(s * 1.25, -s * 0.28);
      c.lineTo(s * 0.85, -s * 0.18);
      c.fill();
      c.beginPath();
      c.moveTo(-s * 0.2, -s * 0.1);
      c.quadraticCurveTo(-s * 1.2, -s * 1.1, -s * 0.9, s * 0.1);
      c.fill();
      break;
    case 'bell':
      c.fillStyle = '#f5b700';
      c.beginPath();
      c.moveTo(-s * 0.85, s * 0.55);
      c.quadraticCurveTo(-s * 0.7, -s * 0.9, 0, -s * 0.9);
      c.quadraticCurveTo(s * 0.7, -s * 0.9, s * 0.85, s * 0.55);
      c.closePath();
      c.fill();
      c.beginPath();
      c.arc(0, s * 0.72, s * 0.22, 0, Math.PI * 2);
      c.fill();
      break;
    case 'check':
      c.fillStyle = '#22c55e';
      c.beginPath();
      c.arc(0, 0, s, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = s * 0.28;
      c.beginPath();
      c.moveTo(-s * 0.45, 0);
      c.lineTo(-s * 0.1, s * 0.38);
      c.lineTo(s * 0.5, -s * 0.38);
      c.stroke();
      break;
    case 'doc':
      c.fillStyle = '#ffffff';
      c.fillRect(-s * 0.7, -s, s * 1.4, s * 2);
      c.fillStyle = color;
      for (let k = 0; k < 4; k++) c.fillRect(-s * 0.45, -s * 0.6 + k * s * 0.4, s * (k === 3 ? 0.5 : 0.9), s * 0.13);
      break;
    case 'link':
      c.strokeStyle = '#a78bfa';
      c.lineWidth = s * 0.3;
      for (const dx of [-0.35, 0.35]) {
        c.beginPath();
        c.ellipse(dx * s, 0, s * 0.55, s * 0.36, 0, 0, Math.PI * 2);
        c.stroke();
      }
      break;
  }
  c.restore();
}

function iconTexture(kind) {
  return canvasTexture(128, 128, (c, w) => {
    c.clearRect(0, 0, w, w);
    // a white disc behind, so every icon reads against sky and grass
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.beginPath();
    c.arc(w / 2, w / 2, w * 0.46, 0, Math.PI * 2);
    c.fill();
    drawIcon(c, kind, w / 2, w / 2 + 2, w * 0.24);
  });
}

// ---------- People between teams ----------

const ERRANDS = {
  brief: {
    icon: 'doc',
    tag: (a, b) => `Fresh brief → ${b.name}`,
    lines: (a, b) => [`Fresh brief from ${a.name} for ${b.name}. Deadline’s Friday.`, `Can ${b.name} turn this around by Monday? Asking for a launch.`, `One-pager, clear objective, real audience. A good brief saves a week.`],
    thoughts: (a, b) => [`Is this brief clear enough for ${b.name}?`, 'One problem, one audience, one message.', 'Attach the references. Always attach the references.'],
  },
  approval: {
    icon: 'check',
    tag: (a, b) => `Chasing approval: ${b.name}`,
    lines: (a, b) => [`Need a sign-off from ${b.name} before the 5 pm review.`, 'Third follow-up today. Approvals are a sport.', `If ${b.name} approves now, we ship tonight.`],
    thoughts: () => ['Version 7 final final. Please be the one.', 'Legal said “minor changes”. Famous last words.', 'Approved is a beautiful word.'],
  },
  collab: {
    icon: 'link',
    tag: (a, b) => `${a.name} × ${b.name}`,
    lines: (a, b) => [`${a.name} and ${b.name}, pairing on the launch: one story, every channel.`, 'Let’s put the brief, the copy and the design in one room.', 'Collaboration beats handoffs. Every time.'],
    thoughts: (a, b) => [`What does ${b.name} need from us?`, 'Shared doc, shared goal, shared credit.', 'Ten minutes together saves ten emails.'],
  },
};

// A route from one hamlet to another along the roads: out of the plaza, down the spoke, round the centre, up the other spoke.
function routeBetween(a, b, lane) {
  const pts = [];
  const along = (h, d, off) => [h.x - Math.cos(h.angle) * d + Math.sin(h.angle) * off, h.z - Math.sin(h.angle) * d - Math.cos(h.angle) * off];
  const gap = Math.abs(HAMLETS.indexOf(a) - HAMLETS.indexOf(b));
  const adjacent = gap === 1 || gap === HAMLETS.length - 1;
  if (adjacent) {
    // the ring road between neighbours
    for (const u of [0.18, 0.5, 0.82]) {
      const x = a.x + (b.x - a.x) * u;
      const z = a.z + (b.z - a.z) * u;
      const L = Math.hypot(b.x - a.x, b.z - a.z);
      pts.push([x + (-(b.z - a.z) / L) * lane, z + ((b.x - a.x) / L) * lane]);
    }
    return pts;
  }
  pts.push(along(a, 12, lane), along(a, 40, lane));
  // round the edge of the central plaza, the short way
  let d = b.angle - a.angle;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  for (let k = 0; k <= 4; k++) {
    const t = a.angle + (d * k) / 4;
    pts.push([Math.cos(t) * (12 + lane), Math.sin(t) * (12 + lane)]);
  }
  pts.push(along(b, 40, -lane), along(b, 12, -lane));
  return pts;
}

export function buildTraffic(scene, ctx) {
  const r = rng(4242);
  const H = HAMLETS;
  const jobs = [
    ['brief', 4, 0], // Content & Copy → Brand
    ['brief', 2, 5], // Product → Design
    ['brief', 1, 3], // PMM → Social
    ['approval', 5, 1], // Design → PMM
    ['approval', 3, 2], // Social → Product
    ['approval', 0, 4], // Brand → Content & Copy
    ['collab', 0, 1],
    ['collab', 3, 4],
  ];
  jobs.forEach(([kind, ai, bi], k) => {
    const a = H[ai % H.length];
    const b = H[bi % H.length];
    const E = ERRANDS[kind];
    const pair = kind === 'collab' ? 2 : 1;
    const off = r();
    for (let m = 0; m < pair; m++) {
      const p = makePerson({ seed: r(), accent: (m ? b : a).color, top: m ? undefined : a.color });
      if (kind === 'brief') giveProp(p, 'parcel', '#f4efe2');
      else if (kind === 'approval') giveProp(p, 'phone');
      const lane = (m ? 0.7 : -0.7) + (kind === 'approval' ? 0.5 : 0);
      const walker = new ctx.Walker(scene, p, routeBetween(a, b, lane), {
        action: kind === 'brief' ? 'carry' : 'walk',
        idle: kind === 'collab' ? 'talk' : kind === 'approval' ? 'phone' : 'talk',
        speed: kind === 'approval' ? 2.6 : 1.7,
        pause: kind === 'approval' ? 1.5 : 4,
        heightFn: walkY,
        offset: off, // a collab pair sets off together
      });
      ctx.updaters.push(walker);
      // the tag above their head flips with the direction they're walking
      if (m === 0) {
        const there = new THREE.SpriteMaterial({ map: tagTexture(E.icon, E.tag(a, b), a.color), transparent: true, depthWrite: false });
        const back = new THREE.SpriteMaterial({ map: tagTexture(E.icon, kind === 'collab' ? E.tag(a, b) : kind === 'brief' ? `Brief delivered ✓ back to ${a.name}` : `Approved ✓ back to ${a.name}`, a.color), transparent: true, depthWrite: false });
        const tag = new THREE.Sprite(there);
        tag.scale.set(1.9, 0.42, 1);
        tag.position.y = 2.55;
        p.root.add(tag);
        const wp = new THREE.Vector3();
        ctx.updaters.push({
          update: () => {
            tag.material = walker.dir > 0 ? there : back;
            // the tag shows only as you come up to them; right beside them the speech bubble says it
            p.root.getWorldPosition(wp);
            const d = wp.distanceTo(playerPos);
            tag.visible = false; // what they're doing is in their speech bubble when you stop to talk
          },
        });
      }
      ctx.npcs.push({ p, dept: a.id, name: kind === 'brief' ? `Brief runner · ${a.name}` : kind === 'approval' ? `Approval chaser · ${a.name}` : `${a.name} × ${b.name}`, lines: E.lines(a, b), thoughts: E.thoughts(a, b) });
    }
  });

  // ---------- Chatter overhead ----------
  const kinds = ['mail', 'heart', 'chat', 'post', 'bell', 'mail', 'heart', 'chat'];
  const mats = Object.fromEntries([...new Set(kinds)].map((k) => [k, new THREE.SpriteMaterial({ map: iconTexture(k), transparent: true, depthWrite: false })]));
  const flyers = [];
  for (let k = 0; k < 44; k++) {
    const a = H[Math.floor(r() * H.length)];
    let b = H[Math.floor(r() * H.length)];
    if (b === a) b = H[(H.indexOf(a) + 2) % H.length];
    const kind = kinds[k % kinds.length];
    const s = new THREE.Sprite(mats[kind].clone());
    s.scale.setScalar(1.3);
    scene.add(s);
    flyers.push({ s, a, b, ph: r(), period: 7 + r() * 6, h: 10 + r() * 10, base: 2.1 + r() * 0.6 });
  }
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  ctx.updaters.push({
    update: (t) => {
      for (const f of flyers) {
        const u = ((t / f.period + f.ph) % 1 + 1) % 1;
        from.set(f.a.x, f.a.y + 6, f.a.z);
        to.set(f.b.x, f.b.y + 6, f.b.z);
        f.s.position.lerpVectors(from, to, u);
        f.s.position.y += Math.sin(u * Math.PI) * f.h;
        f.s.position.x += Math.sin(t * 2 + f.ph * 9) * 0.4;
        const fade = Math.min(1, u * 8, (1 - u) * 8);
        // the org's chatter is felt around you, not painted across the whole sky
        const far = Math.hypot(f.s.position.x - playerPos.x, f.s.position.z - playerPos.z);
        f.s.material.opacity = fade * THREE.MathUtils.clamp((40 - far) / 15, 0, 1);
        f.s.visible = f.s.material.opacity > 0.01;
        f.s.scale.setScalar(f.base * (0.6 + fade * 0.4) * (1 + Math.sin(t * 4 + f.ph * 20) * 0.06));
        // when one lands, it picks a new destination: the org never stops talking
        if (u < f.last) {
          f.a = f.b;
          f.b = H[(H.indexOf(f.b) + 1 + Math.floor(Math.random() * 4)) % H.length];
        }
        f.last = u;
      }
    },
  });
}
