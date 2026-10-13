// The navigation controller: the one place that decides where the player is and how they move
// between the island and the buildings. It keeps three things apart:
//   location     — 'island', or the id of the building you're inside
//   movement     — 'free' (walking, riding) or 'transition' (a door fade in progress)
//   presentation — 'play' or 'map' (a map overlay that never moves you)
// Every building registers its door on the island (the doorway, a safe spot to step out to and
// which way to face), its interior arrival (spawn and facing) and its interior bounds. Going in and
// out always uses those, never wherever you happened to be standing, and the island's lighting is
// restored in full on the way out.

const EXIT_STEP = 3.6; // metres out from the doorway to the safe exit point
const REARM_DIST = 4.4; // walk this far from a door before walking into it takes you inside again
const REARM_TIME = 1.2; // seconds after leaving before any door can take you in again

export function createNav(d) {
  const { state, rooms, places, scene, hemi, outdoor, ui, sfx } = d;
  const entries = {};
  const nav = {
    location: 'island',
    movement: 'free',
    presentation: 'play',
    entries,
    guard: null, // { id, t } — the door you just came out of
    log: [],
  };

  // ----- registry -----
  // doors: the 'enter' interactables the island's builders left at each building's doorway
  function register(interactables) {
    for (const it of interactables) {
      if (it.kind !== 'enter' || !rooms[it.room] || entries[it.room]) continue;
      const p = places.find((q) => q.id === it.room);
      // the front faces the building's lane; fall back to facing away from the building's centre
      const f = p?.facing ?? Math.atan2(it.x - (p?.x ?? 0), it.z - (p?.z ?? 0));
      const out = { x: Math.sin(f), z: Math.cos(f) };
      const room = rooms[it.room];
      entries[it.room] = {
        id: it.room,
        door: { x: it.x, z: it.z },
        out,
        exit: { x: it.x + out.x * EXIT_STEP, z: it.z + out.z * EXIT_STEP, heading: f },
        arrival: { x: room.origin.x + room.spawn.x, z: room.origin.z + room.spawn.z, heading: room.spawn.heading },
        bounds: room.bounds,
        room,
      };
    }
    return entries;
  }

  const say = (msg) => {
    nav.log.push(`${(d.now?.() ?? 0).toFixed(2)} ${msg}`);
    if (nav.log.length > 40) nav.log.shift();
  };

  // ----- the island's look, restored in full on the way out -----
  const savedFog = scene.fog;
  const groundColor = hemi.groundColor.clone();
  function applyIsland() {
    scene.fog = savedFog;
    scene.background = null;
    hemi.groundColor.copy(groundColor);
    d.dayNight.update(0); // sun, hemisphere, exposure, environment and bloom for the current hour
    d.setShadowRange(50);
  }

  // ----- the re-entry guard -----
  // After stepping out you can't be pulled straight back in: walking into a door only takes you
  // inside once you've been out a moment AND have walked well clear of it first (hysteresis).
  function canWalkIn(id) {
    const g = nav.guard;
    if (nav.movement !== 'free' || nav.location !== 'island') return false;
    if (!g) return true;
    const e = entries[g.id];
    const far = e ? Math.hypot(state.pos.x - e.door.x, state.pos.z - e.door.z) > REARM_DIST : true;
    if (far && d.now() - g.t > REARM_TIME) {
      nav.guard = null;
      return true;
    }
    return g.id !== id && d.now() - g.t > REARM_TIME;
  }
  // walking into a door: close to it, moving, and heading into it rather than past it
  function shouldWalkIn(it, dist) {
    if (it?.kind !== 'enter' || dist > 1.1 || state.speed < 0.5 || !canWalkIn(it.room)) return false;
    const e = entries[it.room];
    if (!e) return true;
    return Math.sin(state.heading) * -e.out.x + Math.cos(state.heading) * -e.out.z > 0.2;
  }

  // ----- transitions -----
  function place(x, z, heading, y) {
    state.pos.set(x, y, z);
    state.heading = heading;
    state.yaw = heading + Math.PI; // the camera sits behind you
    state.speed = 0;
    state.vy = 0;
    state.air = 0;
    state.target = null;
    state.path = null;
    state.pending = null;
    state.seat = null;
    state.forcePose = null;
  }

  function enter(id, { fade = true } = {}) {
    const e = entries[id];
    const room = rooms[id];
    if (!room || nav.location !== 'island' || nav.movement !== 'free') return false;
    d.beforeTransition?.();
    nav.movement = 'transition';
    sfx('enter');
    say(`enter ${id}`);
    const go = () => {
      nav.location = id;
      state.indoor = room;
      outdoor.visible = false;
      for (const r of Object.values(rooms)) r.group.visible = r === room;
      const a = e ? e.arrival : { x: room.origin.x + room.spawn.x, z: room.origin.z + room.spawn.z, heading: room.spawn.heading };
      place(a.x, a.z, a.heading, room.origin.y);
      d.applyIndoorLight(room);
      d.setShadowRange(Math.max(room.w, room.d) / 2 + 3);
      d.afterTransition?.('in', room);
      nav.movement = 'free';
    };
    // a fade already running (another door, the travel card) never strands you mid-transition
    if (!fade || ui.fade(go) === false) go();
    return true;
  }

  // leave the building you're in, by its registered door, to its safe exit point
  function exit({ fade = true, quiet = false } = {}) {
    if (nav.location === 'island' || nav.movement !== 'free') return false;
    const id = nav.location;
    const room = rooms[id];
    d.beforeTransition?.();
    nav.movement = 'transition';
    if (!quiet) sfx('exit');
    say(`exit ${id}`);
    const go = () => {
      room.group.visible = false;
      outdoor.visible = true;
      state.indoor = null;
      nav.location = 'island';
      applyIsland();
      const e = entries[id];
      if (e) place(e.exit.x, e.exit.z, e.exit.heading, d.walkY(e.exit.x, e.exit.z));
      nav.guard = { id, t: d.now() };
      d.afterTransition?.('out', room);
      nav.movement = 'free';
    };
    // a fade already running (another door, the travel card) never strands you mid-transition
    if (!fade || ui.fade(go) === false) go();
    return true;
  }

  // for travel, tours and the bird's-eye view: leave at once, no fade, then the caller moves you
  function leaveNow() {
    if (nav.location === 'island') return;
    exit({ fade: false, quiet: true });
  }

  // the map is presentation only: opening or closing it never changes where you are
  function setPresentation(p) {
    nav.presentation = p;
    say(`presentation ${p}`);
  }

  // inside a building: walking back out through the doorway
  function walkedOut(lx, lz) {
    const room = state.indoor;
    if (!room || nav.movement !== 'free') return false;
    return lz > room.bounds.maxZ && Math.abs(lx) < 1.4 && state.speed > 0.5 && Math.cos(state.heading) > 0.3;
  }

  return Object.assign(nav, { register, enter, exit, leaveNow, canWalkIn, shouldWalkIn, walkedOut, setPresentation, applyIsland, entry: (id) => entries[id] });
}
