// Every building tells its story in chapters, one per room or exhibit. Each chapter is a stop: a
// small numbered medallion in the floor in front of what it's about. The next one you haven't
// reached breathes gently; a guide card on screen follows along. All text comes from the
// portfolio's own content.
import * as THREE from 'three';
import { canvasTexture } from './materials.js';
import { FONT } from './type.js';

// [x, z] are in room coordinates (origin at the room's centre, the door at +z)
export const STORIES = {
  ai: {
    title: 'Inside the AI Lab',
    intro: 'How the studio turns AI into tools the whole team uses.',
    chapters: [
      { at: [0, 11.4], title: 'Three principles', line: 'Prompts are inputs. Tools are modules. Systems create consistency.' },
      { at: [-14.6, 9.0], title: 'One photo in, a library out', line: 'The image-generation lab: Founder Image Generator, Product Image Generator, Advanced Image Editor.' },
      { at: [13.4, 12.6], title: 'The T20 pipeline', line: '81 TV films and 200+ posts from one automated pipeline.' },
      { at: [-14.5, -1.6], title: 'The stack', line: 'Every tool the studio builds with, sorted by what it’s for.' },
      { at: [15.2, -2.4], title: 'The sandbox', line: 'Lenses and grades from the Cinematography Tool, and Rajasthan in Midjourney.' },
      { at: [0, -14.6], title: 'The AI films', line: 'Undying Light, Khwaab and Houseparty, on the big screen.' },
    ],
  },
  home: {
    title: 'Vibhor’s home',
    intro: 'A walk through the person behind the work.',
    chapters: [
      { at: [3.2, 10.6], title: 'Come in', line: 'Filter coffee, a sleeping cat, and the bicycle by the door.' },
      { at: [-10.2, 9.4], title: 'Game night', line: 'Nikita’s corner: Hollow Knight, then Silksong. And a mini football pitch.' },
      { at: [1, -11.6], title: 'The path', line: 'From Jaipur and an engineering degree to Grofers, then Razorpay.' },
      { at: [-13.6, -7.2], title: 'The campaign playbook', line: 'The four things every campaign has to do, each with a real example.' },
      { at: [-7.6, 1.0], title: 'Mentoring corner', line: 'Crits, workshops and one-to-one sessions on ADPList.' },
      { at: [13.2, -6.4], title: 'Recognition', line: 'The trophy cabinet: awards for the work and the team.' },
      { at: [9.6, 1.0], title: 'Write to me', line: 'The typewriter sends a message to Vibhor.' },
    ],
  },
  fun: {
    title: 'The Playground',
    intro: 'Stop motion, found objects and the art series: the work made for fun.',
    chapters: [
      { at: [1.6, 14.4], title: 'The lobby', line: 'Popcorn first. The cinema is through the arch under the neon sign.' },
      { at: [-1, 3.4], title: 'Now showing', line: 'The stop-motion films: pick one at the selector and it goes up on the big screen.' },
      { at: [9, 4.6], title: 'Modern Junkyard', line: 'The stop-motion studio: puppets that move one frame at a time.' },
      { at: [11, -8.4], title: 'Power', line: 'Found-object art: sockets, switches and wires, as courage and instinct.' },
      { at: [14.4, 15.2], title: 'The art series', line: 'Eyes, Birds, Power and All Things A, one cabinet each.' },
      { at: [-14.6, 14.8], title: 'Films & references', line: 'The films and stories that shaped the work, in the lounge.' },
    ],
  },
};

const numberTex = {};
function markerTexture(n, color, dark) {
  const key = n + color + dark;
  return (numberTex[key] ||= canvasTexture(128, 128, (c, w) => {
    c.clearRect(0, 0, w, w);
    c.beginPath();
    c.arc(w / 2, w / 2, w * 0.44, 0, Math.PI * 2);
    c.fillStyle = dark ? 'rgba(20,18,16,0.55)' : 'rgba(255,250,240,0.55)';
    c.fill();
    c.lineWidth = 6;
    c.strokeStyle = color;
    c.stroke();
    c.fillStyle = color;
    c.font = `700 ${w * 0.46}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(n), w / 2, w / 2 + 3);
  }));
}

// Add a room's story: a small numbered medallion set into the floor at each stop. Only the next
// stop you haven't seen breathes a little; the guide card on screen does the talking, so the
// floors stay clear. Returns a controller the game updates with the player's room position.
export function addStory(room, id, color, { dark = true } = {}) {
  const story = STORIES[id];
  if (!story) return null;
  const g = new THREE.Group();
  g.name = 'story';
  room.group.add(g);
  const n = story.chapters.length;
  const markers = [];
  story.chapters.forEach((ch, k) => {
    const [x, z] = ch.at;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({ map: markerTexture(k + 1, color, dark), transparent: true, depthWrite: false, opacity: 0.8 }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, 0.022, z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.38, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.021, z);
    disc.userData.dynamic = ring.userData.dynamic = true;
    g.add(disc, ring);
    markers.push({ disc, ring, x, z });
  });

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
        const pulse = Math.sin(t * 2.4) * 0.5 + 0.5;
        m.ring.scale.setScalar(isNext ? 1 + pulse * 0.25 : 1);
        m.ring.material.opacity = isNext ? 0.25 + pulse * 0.3 : 0;
        m.disc.material.opacity = seen.has(k) && !isNext ? 0.45 : 0.8;
      });
      return { title: story.title, intro: story.intro, chapters: story.chapters, current, next, seen: [...seen] };
    },
  };
}
