// Nikita lives in the house. She isn't a statue on the sofa: she has a day. A weighted routine picks
// what she does next (a game on the sofa, a cup of something in the kitchen, a book in the library
// chair, a look out at the garden), and she walks there on the house's own walking routes, through
// the open archways, never through a wall or a sofa. While she's settled she looks up when you come
// close; walk up and you can talk, or, while she's playing, sit beside her and watch.
import * as THREE from 'three';
import { animate, giveProp } from '../characters.js';
import { buildGrid, findPath } from '../pathfind.js';
import { playerPos } from '../village.js';

const WALK = 1.15; // m/s: an unhurried walk round the house

export function addNikita(room, p, { spots, lines, color = '#6b7a3a', start = 0 }) {
  const g = room.group;
  const O = room.origin;
  g.add(p.root);
  const props = {
    controller: giveProp(p, 'controller', '#ececf0'),
    cup: null,
    book: null,
  };
  // one hand can only hold one thing: build each prop on its own, then show the one in use
  props.controller.visible = false;
  props.cup = giveProp(p, 'cup', '#f4efe6');
  props.cup.visible = false;
  props.book = giveProp(p, 'book', '#6b7a3a');
  props.book.visible = false;
  const show = (k) => {
    for (const [key, m] of Object.entries(props)) if (m) m.visible = key === k;
  };

  const me = {
    p,
    name: 'Nikita',
    dept: 'home',
    lines,
    pos: new THREE.Vector3(),
    color,
    spot: null,
    mode: 'settled', // 'settled' | 'leaving' | 'walking' | 'arriving'
    path: [],
    until: 0,
    pauseUntil: 0,
    blend: 0,
    from: new THREE.Vector3(),
    fromRot: 0,
    log: [],
    playerPos,
    t: 0,
  };
  room.npcs.push(me);
  room.residents.push(me);
  let grid = null;
  const L = new THREE.Vector3();

  function settleAt(s, t) {
    me.spot = s;
    me.mode = 'settled';
    me.until = t + s.dur[0] + Math.random() * (s.dur[1] - s.dur[0]);
    p.root.position.set(s.sit.x, s.sit.y || 0, s.sit.z);
    p.root.rotation.y = s.sit.rot;
    show(s.prop);
  }
  // pick what to do next: weighted, never the same thing twice running
  function pick() {
    const options = spots.filter((s) => s !== me.spot);
    const total = options.reduce((a, s) => a + s.weight, 0);
    let x = Math.random() * total;
    for (const s of options) if ((x -= s.weight) <= 0) return s;
    return options[0];
  }
  function routeTo(s) {
    grid ||= buildGrid(room, 0.32);
    const a = me.spot ? me.spot.at : [p.root.position.x, p.root.position.z];
    const pts = findPath(grid, O.x + a[0], O.z + a[1], O.x + s.at[0], O.z + s.at[1]);
    return pts ? pts.map((q) => ({ x: q.x - O.x, z: q.z - O.z })) : null;
  }

  settleAt(spots[start], 0);
  me.until = 20 + Math.random() * 20;

  room.updaters.push({
    update: (t, dt = 1 / 60) => {
      dt = Math.min(dt, 0.05);
      me.t = t;
      const pr = p.root.position;
      me.pos.set(O.x + pr.x, O.y, O.z + pr.z);
      if (me.mode === 'settled') {
        animate(p, me.spot.pose, t, 0);
        if (t > me.until && t > me.pauseUntil) {
          const next = pick();
          const path = routeTo(next);
          if (!path) {
            me.until = t + 5;
            return;
          }
          me.next = next;
          me.path = path;
          me.log.push(`${t.toFixed(1)} ${me.spot.id} -> ${next.id}`);
          // stand up and step out to where the walk begins
          me.mode = 'leaving';
          me.blend = 0;
          me.from.copy(pr);
          me.fromRot = p.root.rotation.y;
          show(null);
        }
        return;
      }
      if (me.mode === 'leaving' || me.mode === 'arriving') {
        // a short eased move between the seat and the floor beside it
        me.blend = Math.min(1, me.blend + dt / 0.6);
        const e = me.blend * me.blend * (3 - 2 * me.blend);
        const s = me.mode === 'leaving' ? me.spot : me.next;
        const a = me.mode === 'leaving' ? { x: me.from.x, z: me.from.z, y: me.from.y } : { x: s.at[0], z: s.at[1], y: 0 };
        const b = me.mode === 'leaving' ? { x: s.at[0], z: s.at[1], y: 0 } : { x: s.sit.x, z: s.sit.z, y: s.sit.y || 0 };
        pr.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e, a.z + (b.z - a.z) * e);
        if (me.mode === 'arriving') {
          let d = s.sit.rot - me.fromRot;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          p.root.rotation.y = me.fromRot + d * e;
          animate(p, me.blend > 0.6 ? s.pose : 'idle', t, 0);
        } else animate(p, 'idle', t, 0);
        if (me.blend >= 1) {
          if (me.mode === 'leaving') me.mode = 'walking';
          else settleAt(s, t);
        }
        return;
      }
      // walking the route, one waypoint at a time
      if (t < me.pauseUntil) {
        animate(p, 'idle', t, 0);
        return;
      }
      const wp = me.path[0];
      if (!wp) {
        me.mode = 'arriving';
        me.blend = 0;
        me.fromRot = p.root.rotation.y;
        return;
      }
      const dx = wp.x - pr.x;
      const dz = wp.z - pr.z;
      const d = Math.hypot(dx, dz);
      // give way: if you're standing right in her path, she waits for you to move
      L.set(O.x + pr.x + (dx / (d || 1)) * 0.7, 0, O.z + pr.z + (dz / (d || 1)) * 0.7);
      if (me.playerPos && Math.hypot(me.playerPos.x - L.x, me.playerPos.z - L.z) < 0.6) {
        animate(p, 'idle', t, 0);
        return;
      }
      if (d < 0.12) {
        me.path.shift();
        return;
      }
      const step = Math.min(d, WALK * dt);
      pr.x += (dx / d) * step;
      pr.z += (dz / d) * step;
      pr.y = 0;
      let want = Math.atan2(dx, dz) - p.root.rotation.y;
      want = Math.atan2(Math.sin(want), Math.cos(want));
      p.root.rotation.y += want * Math.min(1, dt * 8);
      animate(p, 'walk', t, WALK);
    },
  });

  // walking up to her: talk, or sit with her while she plays
  let said = 0;
  const talk = {
    kind: 'call',
    label: 'Nikita',
    verb: 'Talk',
    x: 0,
    z: 0,
    fn: () => {
      me.pauseUntil = Math.max(me.pauseUntil, me.t + 6);
      window.__shire?.ui?.toast(`<b>Nikita</b><br>${lines[said++ % lines.length]}`, 5200);
    },
  };
  room.interactables.push(talk);
  const sitWith = { kind: 'sit', label: 'Sit and watch Nikita play', verb: 'Sit down', x: 0, z: 0, seat: null };
  room.updaters.push({
    update: () => {
      talk.x = me.pos.x;
      talk.z = me.pos.z;
      const s = me.mode === 'settled' ? me.spot : null;
      talk.verb = s?.id === 'game' ? 'Talk (she’s mid-boss-fight)' : 'Talk';
      // the other seat on the sofa, offered only while she's playing
      if (s?.watch && !room.interactables.includes(sitWith)) {
        sitWith.seat = { x: O.x + s.watch.x, z: O.z + s.watch.z, heading: s.watch.rot, y: s.sit.y || 0, pose: 'sit' };
        sitWith.x = O.x + s.watch.approach[0];
        sitWith.z = O.z + s.watch.approach[1];
        room.interactables.push(sitWith);
      } else if (!s?.watch && room.interactables.includes(sitWith)) room.interactables.splice(room.interactables.indexOf(sitWith), 1);
    },
  });
  return me;
}
