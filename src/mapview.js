// The map: a card over the game that shows where you are. It's presentation only, so opening it
// never moves you, changes the scene or takes you out of a building. Two tabs:
//   This building — the floor plan of the building you're in: its rooms, walls and open passages.
//                   Tap a room to walk there (round the walls, through the passages).
//   Island        — the whole island. Tap a place to travel there (leaving the building properly,
//                   by its door, if you're inside one).
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createMapView({ places, paths, pond, coastR, getState, rooms, onTravel, onWalkTo, onOpen, onClose }) {
  const el = document.createElement('div');
  el.id = 'mapview';
  el.className = 'modal';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Map');
  el.innerHTML = `
    <div class="mapview__card">
      <header class="mapview__head">
        <div><b id="mv-title">Map</b><span id="mv-sub"></span></div>
        <div class="mapview__tabs" role="tablist">
          <button class="pill" data-tab="plan" role="tab">This building</button>
          <button class="pill" data-tab="island" role="tab">Island</button>
        </div>
        <button class="close" data-close aria-label="Close map">×</button>
      </header>
      <div class="mapview__body">
        <canvas id="mv-canvas" width="640" height="520"></canvas>
        <ul id="mv-list" class="mapview__list"></ul>
      </div>
      <p class="mapview__foot" id="mv-foot"></p>
    </div>`;
  document.body.appendChild(el);
  const canvas = el.querySelector('#mv-canvas');
  const ctx = canvas.getContext('2d');
  const list = el.querySelector('#mv-list');
  let tab = 'island';
  let hits = []; // clickable regions in canvas pixels: { x, y, r | rect, go }

  const isOpen = () => el.classList.contains('is-open');
  function open(which) {
    const s = getState();
    tab = which || (s.room ? 'plan' : 'island');
    el.classList.add('is-open');
    onOpen?.();
    render();
  }
  function close() {
    if (!isOpen()) return;
    el.classList.remove('is-open');
    onClose?.();
  }
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-close]')) close();
    const t = e.target.closest('[data-tab]');
    if (t && !t.disabled) {
      tab = t.dataset.tab;
      render();
    }
    const go = e.target.closest('[data-go]');
    if (go) choose(JSON.parse(go.dataset.go));
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    let best = null;
    let bd = Infinity;
    for (const h of hits) {
      if (h.rect) {
        const [x0, y0, x1, y1] = h.rect;
        if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
          best = h;
          bd = 0;
        }
      } else {
        const d = Math.hypot(x - h.x, y - h.y);
        if (d < h.r && d < bd) {
          bd = d;
          best = h;
        }
      }
    }
    if (best) choose(best.go);
  });
  function choose(go) {
    close();
    if (go.travel) onTravel(go.travel);
    else if (go.walk) onWalkTo(go.walk[0], go.walk[1], go.name);
  }

  function render() {
    const s = getState();
    const room = s.room;
    el.querySelectorAll('[data-tab]').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.tab === tab);
      if (b.dataset.tab === 'plan') b.disabled = !room;
    });
    if (tab === 'plan' && !room) tab = 'island';
    hits = [];
    if (tab === 'plan') drawPlan(room, s);
    else drawIsland(s);
  }

  // ----- the floor plan of the building you're in -----
  function drawPlan(room, s) {
    const place = places.find((p) => p.id === room.id);
    const W = canvas.width;
    const H = canvas.height;
    const pad = 34;
    const sc = Math.min((W - pad * 2) / room.w, (H - pad * 2 - 24) / room.d);
    const X = (x) => W / 2 + x * sc;
    const Z = (z) => (H - 24) / 2 + z * sc;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#15181b';
    ctx.fillRect(0, 0, W, H);
    // floor
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(X(-room.w / 2), Z(-room.d / 2), room.w * sc, room.d * sc);
    const zones = room.plan?.zones || [];
    const color = place?.color || '#3dd36d';
    zones.forEach((zn, k) => {
      ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)';
      const here = s.zone === zn.id;
      if (here) ctx.fillStyle = hexA(color, 0.28);
      ctx.fillRect(X(zn.x0), Z(zn.z0), (zn.x1 - zn.x0) * sc, (zn.z1 - zn.z0) * sc);
      hits.push({ rect: [X(zn.x0), Z(zn.z0), X(zn.x1), Z(zn.z1)], go: { walk: [room.origin.x + zn.at[0], room.origin.z + zn.at[1]], name: zn.name } });
    });
    // outer walls, with the doorway at the front
    ctx.strokeStyle = '#e9e6df';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const hw = room.w / 2;
    const hd = room.d / 2;
    const door = 1.5;
    line([[-door, hd], [-hw, hd], [-hw, -hd], [hw, -hd], [hw, hd], [door, hd]]);
    // inner walls: the open gaps between them are the passages
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(233,230,223,0.85)';
    for (const [ax, az, bx, bz] of room.plan?.walls || []) line([[ax, az], [bx, bz]]);
    // the way out
    ctx.fillStyle = '#3dd36d';
    ctx.fillRect(X(-door), Z(hd) - 3, door * 2 * sc, 6);
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT TO ISLAND', X(0), Z(hd) + 18);
    // room names
    ctx.textBaseline = 'middle';
    zones.forEach((zn) => {
      const cx = X((zn.x0 + zn.x1) / 2);
      const cy = Z((zn.z0 + zn.z1) / 2);
      ctx.font = `700 ${Math.max(11, Math.min(15, sc * 0.9))}px Inter, sans-serif`;
      ctx.fillStyle = s.zone === zn.id ? '#ffffff' : 'rgba(255,255,255,0.82)';
      wrapText(zn.name, cx, cy, (zn.x1 - zn.x0) * sc - 8);
    });
    // people who live here
    for (const p of s.people || []) {
      ctx.fillStyle = p.color || '#f4c95d';
      ctx.beginPath();
      ctx.arc(X(p.x), Z(p.z), 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // you
    arrow(X(s.lx), Z(s.lz), s.heading, '#ffffff', '#2f6bff');
    function line(pts) {
      ctx.beginPath();
      pts.forEach(([x, z], k) => (k ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
      ctx.stroke();
    }
    el.querySelector('#mv-title').textContent = place?.name || 'Inside';
    el.querySelector('#mv-sub').textContent = s.zoneName ? `You’re in: ${s.zoneName}` : 'Floor plan';
    list.innerHTML = zones.map((zn) => `<li><button class="${s.zone === zn.id ? 'is-here' : ''}" data-go='${esc(JSON.stringify({ walk: [room.origin.x + zn.at[0], room.origin.z + zn.at[1]], name: zn.name }))}'><i style="--c:${color}"></i><span>${esc(zn.name)}</span><em>${esc(zn.note || '')}</em></button></li>`).join('');
    el.querySelector('#mv-foot').innerHTML = 'Tap a room to walk there. The <b>Exit to island</b> button leaves by the front door.';
  }

  // ----- the island -----
  function drawIsland(s) {
    const W = canvas.width;
    const H = canvas.height;
    const R = 132;
    const sc = Math.min(W, H - 10) / (R * 2);
    const X = (x) => W / 2 + x * sc;
    const Z = (z) => H / 2 + z * sc;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#4f9fc4';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e8d9a8';
    ctx.beginPath();
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      const r = coastR(a);
      const x = X(Math.cos(a) * r);
      const y = Z(Math.sin(a) * r);
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.fill();
    ctx.fillStyle = '#6fae47';
    ctx.beginPath();
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      const r = coastR(a) - 6;
      const x = X(Math.cos(a) * r);
      const y = Z(Math.sin(a) * r);
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.fill();
    ctx.strokeStyle = '#f4f1e6';
    ctx.lineCap = 'round';
    for (const [ax, az, bx, bz, half] of paths) {
      ctx.lineWidth = Math.max(2, (half || 2) * sc * 1.6);
      ctx.beginPath();
      ctx.moveTo(X(ax), Z(az));
      ctx.lineTo(X(bx), Z(bz));
      ctx.stroke();
    }
    ctx.fillStyle = '#4fb4d8';
    ctx.beginPath();
    ctx.arc(X(pond.x), Z(pond.z), pond.r * 1.15 * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of places) {
      const x = X(p.x);
      const y = Z(p.z);
      const here = s.room ? s.room.id === p.id : false;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = here ? '#ffffff' : 'rgba(0,0,0,0.35)';
      ctx.lineWidth = here ? 4 : 2;
      ctx.beginPath();
      ctx.arc(x, y, here ? 11 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.font = '700 11px Inter, sans-serif';
      const label = p.name.length > 18 ? p.name.slice(0, 17) + '…' : p.name;
      const tw = ctx.measureText(label).width + 10;
      ctx.fillStyle = 'rgba(20,23,26,0.82)';
      ctx.fillRect(x - tw / 2, y + 12, tw, 16);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x, y + 20);
      hits.push({ x, y: y + 6, r: 22, go: { travel: p.id } });
    }
    // you: on the island, or inside a building (shown at its door)
    const at = s.room ? s.door : { x: s.x, z: s.z };
    if (at) arrow(X(at.x), Z(at.z), s.room ? 0 : s.heading, '#ffffff', '#2f6bff');
    el.querySelector('#mv-title').textContent = 'Vibhor’s island';
    el.querySelector('#mv-sub').textContent = s.room ? `You’re inside ${places.find((p) => p.id === s.room.id)?.name || 'a building'}` : 'Tap a place to travel';
    list.innerHTML = places.map((p) => `<li><button data-go='${esc(JSON.stringify({ travel: p.id }))}' class="${s.room?.id === p.id ? 'is-here' : ''}"><i style="--c:${p.color}"></i><span>${esc(p.name)}</span><em>${esc(p.place || '')}</em></button></li>`).join('');
    el.querySelector('#mv-foot').innerHTML = s.room ? 'Looking doesn’t move you. Tap a place to leave this building by its door and travel there.' : 'Tap a place to travel there.';
  }

  function arrow(x, y, heading, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI - heading);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function wrapText(text, cx, cy, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    lines.forEach((l, k) => ctx.fillText(l, cx, cy + (k - (lines.length - 1) / 2) * 16));
  }
  const hexA = (hex, a) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  return { el, open, close, isOpen, render };
}
