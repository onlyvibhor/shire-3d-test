// The phone layer: the pieces of interface that only exist on small screens, built so the island
// stays the main thing you look at.
//
//   level 1  the arrival card: a small note when you walk into a place, gone in a few seconds
//   level 2  the quick profile: who Vibhor is, in one card
//   level 3  drawers: a side drawer in landscape, a bottom sheet in portrait (a place's work)
//   level 4  reading: the full profile, case studies, the playbook (only when you ask for them)
//
// Plus the portrait welcome, "Browse my work" (the same content as a mobile publication, no 3D),
// and the invitation to turn the phone, which only appears once you choose to explore.
import { socialRow } from './icons.js';
import { isTouch } from './touch.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// the one definition of "phone layout": narrow, or a landscape screen too short for side panels
export const COMPACT = matchMedia('(max-width: 760px), (max-height: 540px) and (orientation: landscape)');
export const PORTRAIT = matchMedia('(orientation: portrait)');
export const isCompact = () => COMPACT.matches;
export const isPortraitPhone = () => COMPACT.matches && PORTRAIT.matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

// body classes the rest of the interface (and the CSS) can lean on
function syncBody() {
  document.body.classList.toggle('is-compact', COMPACT.matches);
  document.body.classList.toggle('is-portrait', PORTRAIT.matches);
}
syncBody();
COMPACT.addEventListener('change', syncBody);
PORTRAIT.addEventListener('change', syncBody);

// a per-visit memory (sessionStorage), so a second visitor on the same phone is still welcomed
const session = {
  get: (k) => {
    try {
      return sessionStorage.getItem('shire.' + k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      sessionStorage.setItem('shire.' + k, v);
    } catch {
      /* private mode: forget it */
    }
  },
};

export const GLYPH = { gallery: '🖼️', hq: '🌳', brand: '🎬', pmm: '🚀', product: '🧩', social: '📣', copy: '✍️', design: '🎨', mentorship: '🎓', lab: '🌙', fun: '🍿', home: '🏡', ai: '🤖', awards: '🏆' };

// what a place is, in one line: its numbers and what it makes (all from the place's own data)
export function placeLine(p) {
  const n = p.count ?? p.projects.length;
  const what = p.countLabel ?? (n === 1 ? 'project' : 'projects');
  const makes = (p.makes || []).slice(0, 3).join(' · ');
  return { count: n ? `${n} ${what}` : '', makes };
}

// ---------------------------------------------------------------------------------------------
// Level 1: the arrival card
// ---------------------------------------------------------------------------------------------
export function createArrival({ onOpen }) {
  const el = document.createElement('aside');
  el.id = 'arrive';
  el.setAttribute('aria-live', 'polite');
  document.body.appendChild(el);
  let timer = 0;
  let current = null;
  const seen = new Map(); // place id → when its card last showed

  function show(p, { tour = false, index = 0, total = 0, force = false } = {}) {
    const now = performance.now();
    // walking back and forth over a boundary shouldn't keep announcing the same place
    if (!tour && !force && now - (seen.get(p.id) || -1e9) < 45000) return false;
    seen.set(p.id, now);
    current = p;
    const { count, makes } = placeLine(p);
    const hasWork = p.projects.length > 0;
    el.style.setProperty('--c', p.color);
    el.innerHTML = `
      <button class="arrive__body" data-open>
        <i class="arrive__glyph">${GLYPH[p.id] || '📍'}</i>
        <span class="arrive__text">
          ${tour ? `<small>Stop ${index + 1} of ${total}</small>` : ''}
          <b>${esc(p.name)}</b>
          <em>${hasWork ? esc([count, makes].filter(Boolean).join(' · ')) : esc(p.lead)}</em>
        </span>
      </button>
      <div class="arrive__row">
        <button class="arrive__go" data-open>${hasWork ? 'Explore work' : 'Discover more'} <span aria-hidden="true">→</span></button>
        <button class="arrive__x" data-dismiss aria-label="Dismiss">×</button>
      </div>`;
    el.classList.toggle('is-tour', tour);
    el.classList.remove('is-open');
    void el.offsetWidth;
    el.classList.add('is-open');
    document.body.classList.add('arrive-on');
    clearTimeout(timer);
    // a tour stop stays up while you're there; a walk-in fades after a few seconds
    if (!tour) timer = setTimeout(hide, 4200);
    return true;
  }
  function hide() {
    clearTimeout(timer);
    el.classList.remove('is-open');
    document.body.classList.remove('arrive-on');
  }
  // holding a finger on it keeps it there
  el.addEventListener('pointerdown', () => clearTimeout(timer));
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-dismiss]')) return hide();
    if (e.target.closest('[data-open]') && current) {
      hide();
      onOpen(current);
    }
  });
  return { show, hide, isOpen: () => el.classList.contains('is-open'), forget: (id) => seen.delete(id) };
}

// ---------------------------------------------------------------------------------------------
// Bottom sheets: drag the handle up to expand, down to close; the close button always works too
// ---------------------------------------------------------------------------------------------
export function sheetGestures(el, { onClose, handle = '.sheet-grip, .dr-head, .pcard__head' }) {
  let start = null;
  el.addEventListener('pointerdown', (e) => {
    if (!isPortraitPhone() || !e.target.closest(handle) || e.target.closest('button:not(.sheet-grip)')) return;
    start = { y: e.clientY, t: performance.now(), id: e.pointerId, h: el.getBoundingClientRect().height };
    el.setPointerCapture?.(e.pointerId);
    el.classList.add('is-dragging');
  });
  el.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dy = e.clientY - start.y;
    el.style.setProperty('--drag', `${Math.max(-40, dy)}px`);
  });
  const end = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dy = e.clientY - start.y;
    const v = dy / Math.max(1, performance.now() - start.t);
    el.classList.remove('is-dragging');
    el.style.removeProperty('--drag');
    if (dy > 90 || v > 0.6) {
      if (el.classList.contains('is-full') && dy < 220) el.classList.remove('is-full');
      else onClose();
    } else if (dy < -40 || (Math.abs(dy) < 6 && e.target.closest('.sheet-grip'))) el.classList.toggle('is-full', dy < -40 ? true : !el.classList.contains('is-full'));
    start = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

// ---------------------------------------------------------------------------------------------
// Level 2: the quick profile
// ---------------------------------------------------------------------------------------------
export function createProfileCard({ owner, onFull, onContact, onHome, onClose }) {
  const el = document.createElement('aside');
  el.id = 'pcard';
  el.className = 'mdrawer';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', `About ${owner.name}`);
  el.innerHTML = `
    <i class="sheet-grip" aria-hidden="true"></i>
    <header class="pcard__head">
      <img src="${esc(owner.portrait)}" alt="" />
      <div><b>${esc(owner.name)}</b><em>${esc(owner.role)}</em></div>
      <button class="close" data-close aria-label="Close">×</button>
    </header>
    <p class="pcard__intro">${esc(owner.tagline)}</p>
    <dl class="pcard__nums">${owner.numbers.map((n) => `<div><dt>${esc(n.value)}</dt><dd>${esc(n.label)}</dd></div>`).join('')}</dl>
    <div class="pcard__btns">
      <button class="btn btn--accent" data-full>View full profile <span aria-hidden="true">→</span></button>
      <button class="btn btn--ghost" data-contact>✉️ Contact</button>
      <button class="btn btn--ghost" data-home>🏡 Walk to Home</button>
    </div>`;
  document.body.appendChild(el);
  const isOpen = () => el.classList.contains('is-open');
  const close = () => {
    if (!isOpen()) return;
    el.classList.remove('is-open', 'is-full');
    document.body.classList.remove('pcard-open');
    onClose?.();
  };
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return close();
    if (e.target.closest('[data-full]')) {
      close();
      onFull();
    } else if (e.target.closest('[data-contact]')) {
      close();
      onContact();
    } else if (e.target.closest('[data-home]')) {
      close();
      onHome();
    }
  });
  sheetGestures(el, { onClose: close });
  return {
    open() {
      el.classList.add('is-open');
      document.body.classList.add('pcard-open');
    },
    close,
    isOpen,
  };
}

// ---------------------------------------------------------------------------------------------
// A miniature of the island, drawn from the places' real positions
// ---------------------------------------------------------------------------------------------
export function islandSVG(places) {
  const pts = places.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.z));
  const R = Math.max(60, ...pts.map((p) => Math.hypot(p.x, p.z))) * 1.18;
  const sx = (x) => 100 + (x / R) * 78;
  const sy = (z) => 100 + (z / R) * 78;
  // a soft, irregular coastline
  const coast = Array.from({ length: 28 }, (_, k) => {
    const a = (k / 28) * Math.PI * 2;
    const r = 84 + Math.sin(a * 3 + 0.6) * 5 + Math.cos(a * 5) * 3;
    return `${(100 + Math.cos(a) * r).toFixed(1)},${(100 + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  const roads = pts.filter((p) => p.id !== 'hq').map((p) => `<path d="M100 100 L${sx(p.x).toFixed(1)} ${sy(p.z).toFixed(1)}" />`).join('');
  const dots = pts
    .map((p) => (p.id === 'hq'
      ? `<g transform="translate(100 100)"><circle r="9" fill="#2f7d3a"/><circle r="5.5" cy="-2" fill="#49a356"/></g>`
      : `<g transform="translate(${sx(p.x).toFixed(1)} ${sy(p.z).toFixed(1)})"><circle r="7" fill="${esc(p.color)}"/><circle r="2.6" fill="#fff"/></g>`))
    .join('');
  return `<svg class="island-mini" viewBox="0 0 200 200" aria-hidden="true">
    <defs><radialGradient id="im-sea" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#7fd3e6"/><stop offset="1" stop-color="#3a9fc0"/></radialGradient></defs>
    <rect width="200" height="200" fill="url(#im-sea)"/>
    <polygon points="${coast}" fill="#f0dfb2"/>
    <polygon points="${coast}" fill="#8fd16a" transform="translate(100 100) scale(.9) translate(-100 -100)"/>
    <g fill="none" stroke="#f6efe2" stroke-width="3" stroke-linecap="round">${roads}</g>
    ${dots}
  </svg>`;
}

// ---------------------------------------------------------------------------------------------
// "A bigger world needs a wider view": shown once, when someone chooses to explore in portrait
// ---------------------------------------------------------------------------------------------
export function createRotate({ places, canFullscreen, onLandscape, onPortrait, onBrowse, onFullscreen }) {
  const el = document.getElementById('rotate');
  el.innerHTML = `
    <div class="rot">
      <div class="rot__art" aria-hidden="true">
        <div class="rot__phone"><div class="rot__screen">${islandSVG(places)}</div><i class="rot__notch"></i></div>
        <span class="rot__arrow"><svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 0 1 12-5l1.5 1.5M18.5 4v4.5H14" /></svg></span>
      </div>
      <p class="rot__eyebrow">Best in landscape</p>
      <h2>A bigger world needs a wider view.</h2>
      <p class="rot__lead">Rotate your phone to explore the island, walk between creative teams, and discover the projects.</p>
      <div class="rot__actions">
        ${canFullscreen ? '<button class="mcta mcta--primary" data-full>Rotate for me <span aria-hidden="true">→</span></button>' : ''}
        <button class="mcta" data-portrait>Continue in portrait</button>
        <button class="linkbtn" data-browse>Browse my work instead</button>
      </div>
    </div>`;
  let on = false;
  const LAND = matchMedia('(orientation: landscape)');
  const done = () => session.set('rotate', 'done');
  function show() {
    on = true;
    done();
    el.classList.add('is-open');
    document.body.classList.add('rotate-on');
  }
  function hide() {
    on = false;
    el.classList.remove('is-open');
    document.body.classList.remove('rotate-on');
  }
  LAND.addEventListener('change', () => {
    if (!on || !LAND.matches) return;
    hide();
    onLandscape();
  });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-full]')) onFullscreen();
    else if (e.target.closest('[data-portrait]')) {
      hide();
      onPortrait();
    } else if (e.target.closest('[data-browse]')) {
      hide();
      onBrowse();
    }
  });
  return { show, hide, isOpen: () => on, seen: () => session.get('rotate') === 'done' };
}

// ---------------------------------------------------------------------------------------------
// Browse my work: the portfolio as a mobile publication, reading the same data as the island
// ---------------------------------------------------------------------------------------------
export function createBrowse({ owner, places, projects, careers, onProject, onAbout, onCareer, onPlaybook, onContact, onExplore }) {
  const el = document.createElement('div');
  el.id = 'browse';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Browse the work');
  const withWork = places.filter((p) => p.projects.length);
  const card = (slug) => {
    const pr = projects[slug];
    if (!pr) return '';
    const m = pr.metrics?.[0];
    return `<button class="bw-card" data-project="${esc(slug)}">
      <span class="bw-card__img"><img src="${esc(pr.images[0])}" alt="" loading="lazy" decoding="async" /></span>
      <b>${esc(pr.title)}</b>
      <em>${m ? `${esc(m[0])} ${esc(m[1])}` : `${esc(pr.client)} · ${esc(pr.year)}`}</em>
    </button>`;
  };
  el.innerHTML = `
    <header class="bw-bar">
      <img src="${esc(owner.portrait)}" alt="" />
      <div><b>${esc(owner.name)}</b><em>${esc(owner.short)}</em></div>
      <button class="bw-island" data-explore>3D island</button>
      <button class="close" data-close aria-label="Back">×</button>
    </header>
    <nav class="bw-chips" aria-label="Sections">
      ${withWork.map((p) => `<button data-jump="${esc(p.id)}" style="--c:${esc(p.color)}">${esc(p.name)}</button>`).join('')}
      <button data-jump="career">Career</button>
      <button data-jump="contact">Contact</button>
    </nav>
    <div class="bw-scroll">
      <section class="bw-hero">
        <p class="bw-eyebrow">${esc(owner.role)}</p>
        <h1>Selected work</h1>
        <p class="bw-lead">${esc(owner.tagline)}</p>
        <dl class="bw-nums">${owner.numbers.map((n) => `<div><dt>${esc(n.value)}</dt><dd>${esc(n.label)}</dd></div>`).join('')}</dl>
      </section>
      ${withWork
        .map((p) => `<section class="bw-dept" id="bw-${esc(p.id)}" style="--c:${esc(p.color)}">
          <header><i>${GLYPH[p.id] || '📍'}</i><div><h2>${esc(p.name)}</h2><p>${esc(placeLine(p).count)}${p.makes ? ` · ${esc(p.makes.slice(0, 3).join(' · '))}` : ''}</p></div></header>
          <p class="bw-dept__lead">${esc(p.lead)}</p>
          <div class="bw-row">${p.projects.map(card).join('')}</div>
        </section>`)
        .join('')}
      <section class="bw-dept" id="bw-career">
        <header><i>🧭</i><div><h2>Career</h2><p>The companies and the work from those years</p></div></header>
        <div class="bw-list">${Object.values(careers)
          .map((c) => `<button class="bw-item" data-career="${esc(c.id)}" style="--c:${esc(c.color)}"><span><b>${esc(c.org)}</b><em>${esc(c.years)} · ${esc(c.role)}</em></span><i aria-hidden="true">→</i></button>`)
          .join('')}
          <button class="bw-item" data-about><span><b>Full profile</b><em>Impact, awards, path, leadership and mentoring</em></span><i aria-hidden="true">→</i></button>
          <button class="bw-item" data-playbook><span><b>The campaign playbook</b><em>How each campaign was cracked</em></span><i aria-hidden="true">→</i></button>
        </div>
      </section>
      <section class="bw-dept bw-contact" id="bw-contact">
        <h2>Work with me</h2>
        <p>${esc(owner.hireFor)}</p>
        <div class="bw-actions">
          <button class="mcta mcta--primary" data-contact>Write to Vibhor <span aria-hidden="true">→</span></button>
        </div>
        ${socialRow(owner.links, owner.email)}
      </section>
      <button class="bw-explore" data-explore>
        <span class="bw-explore__art">${islandSVG(places)}</span>
        <span><b>Explore the 3D island</b><em>Walk between the teams and find the work where it was made.</em></span>
      </button>
    </div>`;
  document.body.appendChild(el);
  const scroller = el.querySelector('.bw-scroll');
  const isOpen = () => el.classList.contains('is-open');
  let onCloseCb = null;
  function open({ onClose } = {}) {
    onCloseCb = onClose || null;
    el.classList.add('is-open');
    document.body.classList.add('browse-open');
  }
  function close() {
    if (!isOpen()) return;
    el.classList.remove('is-open');
    document.body.classList.remove('browse-open');
    onCloseCb?.();
  }
  el.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.dataset.close !== undefined) close();
    else if (t.dataset.explore !== undefined) {
      close();
      onExplore();
    } else if (t.dataset.project) onProject(t.dataset.project);
    else if (t.dataset.career) onCareer(t.dataset.career);
    else if (t.dataset.about !== undefined) onAbout();
    else if (t.dataset.playbook !== undefined) onPlaybook();
    else if (t.dataset.contact !== undefined) onContact();
    else if (t.dataset.jump) {
      const sec = el.querySelector(`#bw-${t.dataset.jump}`);
      if (sec) scroller.scrollTo({ top: sec.offsetTop - 8, behavior: REDUCED.matches ? 'auto' : 'smooth' });
    }
  });
  return { open, close, isOpen };
}

// ---------------------------------------------------------------------------------------------
// Keep a reading surface's place when the phone turns: remember which section is at the top and
// how far into it, and put it back after the layout reflows
// ---------------------------------------------------------------------------------------------
export function keepPlace(getScroller, sections, isOpen) {
  let anchor = null;
  const measure = () => {
    const sc = getScroller();
    if (!sc) return;
    const top = sc.getBoundingClientRect().top;
    let best = null;
    for (const s of sections()) {
      const r = s.getBoundingClientRect();
      if (r.top - top <= 80) best = { el: s, into: (top + 80 - r.top) / Math.max(1, r.height) };
    }
    anchor = best;
  };
  let raf = 0;
  const restore = () => {
    if (!isOpen() || !anchor) return;
    const sc = getScroller();
    const r = anchor.el.getBoundingClientRect();
    const top = sc.getBoundingClientRect().top;
    sc.scrollTop += r.top - top - 80 + anchor.into * r.height;
  };
  let lastW = innerWidth;
  let lastH = innerHeight;
  addEventListener('resize', () => {
    // the keyboard opening changes the height only: leave the scroll alone then
    if (innerWidth === lastW) {
      lastH = innerHeight;
      return;
    }
    lastW = innerWidth;
    lastH = innerHeight;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => requestAnimationFrame(restore));
  });
  return { measure, get lastH() { return lastH; } };
}

export { isTouch, session };
