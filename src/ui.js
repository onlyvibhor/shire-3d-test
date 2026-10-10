const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createUI({ owner, pillars, places, onEnter, onTour, onOverview, onTravel, onTourStep, onExitTour }) {
  const pillarById = Object.fromEntries(pillars.map((p) => [p.id, p]));
  const visited = new Set();
  let currentPlace = null;
  let mode = 'intro';

  // ----- Owner details -----
  document.title = `${owner.name} · ${owner.role}`;
  document.querySelectorAll('[data-owner-name]').forEach((el) => (el.textContent = owner.name));
  document.querySelectorAll('[data-owner-role]').forEach((el) => (el.textContent = owner.role));
  document.querySelectorAll('[data-owner-tagline]').forEach((el) => (el.textContent = owner.tagline));

  // ----- Intro -----
  $('#intro-legend').innerHTML = places
    .filter((p) => p.id !== 'hall')
    .map((p) => `<li><i style="background:${p.color}"></i><b>${esc(p.name)}</b><span>${esc(p.team)}</span></li>`)
    .join('');
  $('#btn-enter').addEventListener('click', onEnter);
  $('#btn-tour').addEventListener('click', onTour);

  // ----- HUD -----
  $('#btn-overview').addEventListener('click', onOverview);
  $('#btn-tour-hud').addEventListener('click', () => (mode === 'tour' ? onExitTour() : onTour()));
  $('#btn-hire').addEventListener('click', () => toggleHire(true));
  $('#visited-dots').innerHTML = places.map((p) => `<button class="dot" data-id="${p.id}" style="--c:${p.color}" title="${esc(p.name)} · ${esc(p.team)}"></button>`).join('');
  $('#visited-dots').addEventListener('click', (e) => {
    const id = e.target.dataset?.id;
    if (id) onTravel(id);
  });

  // ----- Labels -----
  const labels = {};
  const labelRoot = $('#labels');
  for (const p of places) {
    const el = document.createElement('button');
    el.className = 'label' + (p.id === 'hall' ? ' label--hall' : '');
    el.style.setProperty('--c', p.color);
    el.innerHTML = `<span class="label__name">${esc(p.name)}</span><span class="label__team">${esc(p.team)}</span>`;
    el.addEventListener('click', () => onTravel(p.id));
    labelRoot.appendChild(el);
    labels[p.id] = el;
  }
  function placeLabel(id, x, y, visible, dist) {
    const el = labels[id];
    el.classList.toggle('is-hidden', !visible);
    if (!visible) return;
    const s = Math.max(0.7, Math.min(1.1, 90 / dist));
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${s})`;
  }

  // ----- Place panel -----
  const panel = $('#panel');
  function showPlace(p, { tour = false, index = 0, total = 0 } = {}) {
    currentPlace = p;
    const chips = p.pillars.map((id) => `<span class="chip">${esc(pillarById[id].rune)} ${esc(pillarById[id].name)}</span>`).join('');
    const idx = places.findIndex((q) => q.id === p.id);
    const next = places[(idx + 1) % places.length];
    panel.style.setProperty('--c', p.color);
    panel.innerHTML = `
      <button class="panel__close" aria-label="Close">×</button>
      <p class="eyebrow">${p.id === 'hall' ? 'The centre of the village' : 'Community'} · ${esc(p.team)}</p>
      <h2>${esc(p.name)}</h2>
      <p class="lead">${esc(p.lead)}</p>
      <h3>What they craft</h3>
      <p>${esc(p.crafts)}</p>
      <h3>${p.id === 'hall' ? 'What I do here' : 'Where I come in'}</h3>
      <ul>${p.role.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <div class="chips">${chips}</div>
      ${
        tour
          ? `<p class="panel__step">Stop ${index + 1} of ${total}</p>`
          : `<div class="panel__actions">
              <button class="btn btn--ghost" data-next="${next.id}">Next: ${esc(next.name)} →</button>
              <button class="btn" data-hire>Hire me</button>
            </div>`
      }`;
    panel.querySelector('.panel__close').onclick = () => hidePlace(true);
    panel.querySelector('[data-next]')?.addEventListener('click', (e) => onTravel(e.currentTarget.dataset.next));
    panel.querySelector('[data-hire]')?.addEventListener('click', () => toggleHire(true));
    panel.classList.add('is-open');
    markVisited(p.id);
  }
  function hidePlace() {
    panel.classList.remove('is-open');
    currentPlace = null;
  }

  function markVisited(id) {
    if (visited.has(id)) return;
    visited.add(id);
    document.querySelector(`.dot[data-id="${id}"]`)?.classList.add('is-visited');
    $('#visited-count').textContent = `${visited.size}/${places.length}`;
    if (visited.size === places.length) {
      setTimeout(
        () => toast(`<b>You’ve met the whole village.</b><br>Every team, one voice. That’s the job. <a href="#" data-hire-link>Let’s talk →</a>`, 9000),
        1500
      );
    }
  }

  // ----- Toast -----
  const toastEl = $('#toast');
  let toastTimer = 0;
  function toast(html, ms = 4000) {
    toastEl.innerHTML = html;
    toastEl.classList.add('is-open');
    toastEl.querySelector('[data-hire-link]')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleHire(true);
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-open'), ms);
  }

  // ----- Hire modal -----
  const hire = $('#hire');
  $('#hire-pillars').innerHTML = pillars
    .map((p) => `<li><span class="rune">${esc(p.rune)}</span><div><b>${esc(p.name)}</b><p>${esc(p.text)}</p></div></li>`)
    .join('');
  $('#hire-links').innerHTML =
    `<a class="btn" href="mailto:${esc(owner.email)}">${esc(owner.email)}</a>` +
    owner.links.map((l) => `<a class="btn btn--ghost" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  hire.addEventListener('click', (e) => {
    if (e.target === hire || e.target.closest('[data-close]')) toggleHire(false);
  });
  function toggleHire(force) {
    const open = force ?? !hire.classList.contains('is-open');
    hire.classList.toggle('is-open', open);
  }
  function closeOverlays() {
    if (hire.classList.contains('is-open')) {
      toggleHire(false);
      return true;
    }
    return false;
  }

  // ----- Tour bar -----
  $('#tour-prev').addEventListener('click', () => onTourStep(-1));
  $('#tour-next').addEventListener('click', () => onTourStep(1));
  $('#tour-exit').addEventListener('click', onExitTour);
  function setTourProgress(f) {
    $('#tour-progress').style.transform = `scaleX(${f})`;
  }

  // ----- Mode -----
  function setMode(m) {
    mode = m;
    document.body.dataset.mode = m;
    $('#btn-overview').classList.toggle('is-active', m === 'overview');
    $('#btn-tour-hud').classList.toggle('is-active', m === 'tour');
    $('#btn-tour-hud').querySelector('span').textContent = m === 'tour' ? 'Exit tour' : 'Tour';
    if (m === 'overview') toast('<b>Bird’s-eye view.</b> Drag to orbit, scroll to zoom, click a label to fly in.', 4500);
  }

  function ready() {
    document.body.classList.add('is-ready');
    document.body.dataset.mode = mode;
  }

  return { placeLabel, showPlace, hidePlace, toast, toggleHire, closeOverlays, setMode, setTourProgress, ready, visited, get current() { return currentPlace; } };
}
