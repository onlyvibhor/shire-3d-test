// Every room tells its story in chapters. Each chapter is a stop on the floor: a numbered marker
// you walk onto, a lectern placard with its title and one line, and the exhibit it stands in front
// of. A dashed path in the room's colour links the stops in order from the door; the next stop you
// haven't reached glows and pulses; a guide card on screen follows along. All text comes from the
// portfolio's own content.
import * as THREE from 'three';
import { AWARD_LIST } from './data.js';
import { canvasTexture, solid } from './materials.js';
import { FONT, fit, wrap } from './type.js';

// [x, z] are in room coordinates (origin at the room's centre, the door at +z)
export const STORIES = {
  ai: {
    title: 'Inside the AI Hub',
    intro: 'How the studio turns AI into tools the whole team uses.',
    chapters: [
      { at: [0, 8.8], title: 'Three principles', line: 'Prompts are inputs. Tools are modules. Systems create consistency.' },
      { at: [0, 3.4], title: 'The core', line: 'Tools first: models are ingredients, the product is the interface around them.' },
      { at: [9.6, 5.4], title: 'One photo in, a library out', line: 'The T20 pipeline: 81 films and 200+ posts from one system.' },
      { at: [-2, -7.8], title: 'Four in-house tools', line: 'Cinematography, product images, image editing and founder images. Open any station.' },
      { at: [-13.4, -1], title: 'The stack', line: 'The tools the studio builds with, every day.' },
      { at: [-12.6, 5.6], title: 'Teaching it', line: 'AI design workshops: the methods, shared with the community.' },
    ],
  },
  home: {
    title: 'Vibhor’s home',
    intro: 'A walk through the person behind the work.',
    chapters: [
      { at: [0, -5.6], title: 'The path', line: 'From Jaipur and an engineering degree to Grofers, then Razorpay.' },
      { at: [-8.6, -4], title: 'How I lead', line: 'Leadership notes and writing, from the bookshelf.' },
      { at: [-9, 1.2], title: 'The campaign playbook', line: 'The four things every campaign has to do, each with a real example.' },
      { at: [-5.8, 5.2], title: 'Mentoring corner', line: 'Crits, workshops and one-to-one sessions.' },
      { at: [4.2, 3.4], title: 'The work desk', line: 'On the screen: Break To Build.' },
      { at: [8.4, -3], title: 'Recognition', line: 'The trophy cabinet: awards for the work and the team.' },
      { at: [7.2, 6], title: 'Write to me', line: 'The typewriter sends a message to Vibhor.' },
    ],
  },
  fun: {
    title: 'The Playhouse',
    intro: 'Films, stop motion, found objects and a game: the work made for fun.',
    chapters: [
      { at: [8.2, 3.4], title: 'Now showing', line: 'The studio’s films on the big screen. Take a seat.' },
      { at: [10.2, -3.2], title: 'Found-object art', line: 'Power: art made from what was lying around.' },
      { at: [-8.4, -4.4], title: 'The stop-motion studio', line: 'Modern Junkyard: puppets that move one frame at a time.' },
      { at: [-10.8, -8.6], title: 'Frame by frame', line: 'Winter Foods and All Things A, for Grofers and UrbanClap.' },
      { at: [-12, -0.2], title: 'Films & references', line: 'The films and shows that shaped the work.' },
      { at: [-10.6, 6.6], title: 'The arcade', line: 'Back in the Ring: the Netbanking game. Press E to play.' },
    ],
  },
  awards: {
    title: 'The Hall of Fame',
    intro: `${AWARD_LIST.length} awards in 2026, for the work and for the team.`,
    chapters: [
      { at: [0, 9], title: 'The red carpet', line: 'Every award here was won by the studio, on real briefs.' },
      { at: [8.2, 3.2], title: 'ET Brand Disruption', line: 'Gold: Most Disruptive Creative & Design Team.' },
      { at: [8.2, -1.4], title: 'Kyoorius Creative Awards', line: 'First List for Film Craft, and for Use of Technology & AI.' },
      { at: [-8.2, -3.8], title: 'The Shorty Awards', line: 'Winner for Generative AI, Gold Honor and a finalist spot.' },
      { at: [0, -6.4], title: 'Trial of the Century', line: 'The animal courtroom that won them: on the stage.' },
    ],
  },
};

const numberTex = {};
function markerTexture(n, color) {
  const key = n + color;
  return (numberTex[key] ||= canvasTexture(256, 256, (c, w) => {
    c.clearRect(0, 0, w, w);
    c.beginPath();
    c.arc(w / 2, w / 2, w * 0.46, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    c.lineWidth = 10;
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.stroke();
    c.fillStyle = '#ffffff';
    c.font = `800 ${w * 0.5}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(n), w / 2, w / 2 + 6);
  }));
}
function placardTexture(n, total, ch, color, dark) {
  return canvasTexture(1100, 640, (c, w, h) => {
    c.fillStyle = dark ? '#141821' : '#fbf6ee';
    c.fillRect(0, 0, w, h);
    c.fillStyle = color;
    c.fillRect(0, 0, w, 16);
    c.beginPath();
    c.arc(96, 128, 58, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = `800 64px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(n), 96, 132);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = dark ? 'rgba(255,255,255,0.6)' : 'rgba(30,24,20,0.55)';
    c.font = `600 30px ${FONT.mono}`;
    c.fillText(`CHAPTER ${n} OF ${total}`, 180, 112);
    c.fillStyle = dark ? '#ffffff' : '#1d1814';
    fit(c, ch.title, { weight: 800, size: 64, min: 40, family: FONT.display, maxW: w - 220 });
    c.fillText(ch.title, 180, 176);
    c.fillStyle = dark ? 'rgba(255,255,255,0.86)' : '#3b332c';
    c.font = `500 42px ${FONT.sans}`;
    wrap(c, ch.line, w - 120, 4).forEach((l, i) => c.fillText(l, 60, 300 + i * 60));
    c.fillStyle = color;
    c.font = `700 30px ${FONT.sans}`;
    c.fillText('Press E near the exhibit to open it', 60, h - 50);
  });
}

// Add a room's story: markers, lecterns, the path. Returns a controller the game updates with
// the player's position in room coordinates; it reports what the guide card should show.
export function addStory(room, id, color, { dark = true } = {}) {
  const story = STORIES[id];
  if (!story) return null;
  const g = new THREE.Group();
  g.name = 'story';
  room.group.add(g);
  const n = story.chapters.length;
  const markers = [];
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false });
  story.chapters.forEach((ch, k) => {
    const [x, z] = ch.at;
    // the marker: a numbered disc on the floor and a ring that pulses when it's the next stop
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40), new THREE.MeshBasicMaterial({ map: markerTexture(k + 1, color), transparent: true, depthWrite: false, toneMapped: false }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, 0.04, z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.9, 48), ringMat.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.035, z);
    disc.userData.dynamic = ring.userData.dynamic = true;
    g.add(disc, ring);
    // the lectern: beside the marker, its placard tilted up to the reader, facing the way in
    const prev = k ? story.chapters[k - 1].at : [0, room.d / 2];
    const face = Math.atan2(prev[0] - x, prev[1] - z);
    const lec = new THREE.Group();
    lec.position.set(x + Math.cos(face) * 1.25, 0, z - Math.sin(face) * 1.25);
    lec.rotation.y = face;
    lec.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), solid('#2a2f38', { metalness: 0.4, roughness: 0.5 })).translateY(0.5));
    lec.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.36), solid('#2a2f38', { metalness: 0.4, roughness: 0.5 })).translateY(0.025));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.73), new THREE.MeshBasicMaterial({ map: placardTexture(k + 1, n, ch, color, dark), toneMapped: false }));
    board.position.set(0, 1.18, 0.06);
    board.rotation.x = -0.5;
    board.userData.dynamic = true;
    lec.add(board);
    lec.add(new THREE.Mesh(new THREE.BoxGeometry(1.33, 0.81, 0.04), solid('#2a2f38')).translateY(1.18).translateZ(0.03).rotateX(-0.5));
    g.add(lec);
    room.colliders.push({ x: room.origin.x + lec.position.x, z: room.origin.z + lec.position.z, r: 0.3 });
    markers.push({ disc, ring, x, z });
  });
  // the path: dashes from the door to the first stop, then stop to stop
  const pts = [[0, room.d / 2 - 2.5], ...story.chapters.map((c) => c.at)];
  const dashMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false });
  const dashGeo = new THREE.PlaneGeometry(0.14, 0.42);
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const rot = Math.atan2(bx - ax, bz - az);
    for (let d = 1.1; d < len - 1.1; d += 0.8) {
      const t = d / len;
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.order = 'YXZ';
      dash.rotation.y = rot;
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(ax + (bx - ax) * t, 0.03, az + (bz - az) * t);
      g.add(dash);
    }
  }

  const seen = new Set();
  let current = -1;
  return {
    story,
    // px, pz: the player's position in room coordinates
    update(t, px, pz) {
      for (let k = 0; k < n; k++) {
        const m = markers[k];
        if (Math.hypot(px - m.x, pz - m.z) < 1.7) {
          current = k;
          seen.add(k);
        }
      }
      let next = -1;
      for (let k = 0; k < n; k++) if (!seen.has(k)) { next = k; break; }
      markers.forEach((m, k) => {
        const isNext = k === next;
        const s = isNext ? 1 + (Math.sin(t * 4) * 0.5 + 0.5) * 0.35 : 1;
        m.ring.scale.setScalar(s);
        m.ring.material.opacity = isNext ? 0.9 : seen.has(k) ? 0.18 : 0.35;
        m.disc.material.opacity = seen.has(k) && !isNext ? 0.7 : 1;
      });
      return { title: story.title, intro: story.intro, chapters: story.chapters, current, next, seen: [...seen] };
    },
  };
}
