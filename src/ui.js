const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createUI({ owner, pillars, places, projects, awards, onEnter, onTour, onOverview, onTravel, onTourStep, onExitTour }) {
  const visited = new Set();
  const viewed = new Set();
  const trophies = new Set();
  const totalProjects = Object.keys(projects).length;
  let mode = 'intro';

  // ----- Owner -----
  document.title = `${owner.name} · ${owner.short}`;
  document.querySelectorAll('[data-owner-name]').forEach((el) => (el.textContent = owner.name));
  document.querySelectorAll('[data-owner-role]').forEach((el) => (el.textContent = owner.role));
  document.querySelectorAll('[data-owner-tagline]').forEach((el) => (el.textContent = owner.tagline));
  document.querySelectorAll('[data-owner-intro]').forEach((el) => (el.textContent = owner.intro));
  document.querySelectorAll('[data-owner-portrait]').forEach((el) => (el.src = owner.portrait));

  // ----- Intro -----
  $('#intro-legend').innerHTML = places
    .filter((p) => p.id !== 'hq')
    .map((p) => `<li><i style="background:${p.color}"></i><b>${esc(p.name)}</b><span>${esc(p.place)} · ${p.projects.length} projects</span></li>`)
    .join('');
  $('#intro-awards').innerHTML = awards.map((a) => `<li><span>🏆</span>${esc(a.name)}<em>${esc(a.detail)}</em></li>`).join('');
  $('#btn-enter').addEventListener('click', onEnter);
  $('#btn-tour').addEventListener('click', onTour);

  // ----- HUD -----
  $('#btn-overview').addEventListener('click', onOverview);
  $('#btn-tour-hud').addEventListener('click', () => (mode === 'tour' ? onExitTour() : onTour()));
  $('#btn-hire').addEventListener('click', () => toggleHire(true));
  $('#missions-toggle').addEventListener('click', () => toggleMissions());
  $('#visited-dots').innerHTML = places
    .map((p, i) => `<button class="dot" data-id="${p.id}" style="--c:${p.color}" title="${i} · ${esc(p.name)}"></button>`)
    .join('');
  $('#visited-dots').addEventListener('click', (e) => {
    const id = e.target.dataset?.id;
    if (id) onTravel(id);
  });
  function renderMissions() {
    const rows = [
      ['Meet every department', visited.size, places.length],
      ['Open project files', viewed.size, totalProjects],
      ['Find the golden trophies', trophies.size, awards.length],
    ];
    $('#mission-list').innerHTML = rows
      .map(([label, n, total]) => `<li class="${n >= total ? 'is-done' : ''}"><span>${label}</span><b>${n}/${total}</b><i style="--p:${n / total}"></i></li>`)
      .join('');
  }
  renderMissions();
  function toggleMissions(force) {
    $('#missions').classList.toggle('is-collapsed', force === undefined ? undefined : !force);
  }

  // ----- Labels -----
  const labels = {};
  for (const p of places) {
    const el = document.createElement('button');
    el.className = 'label' + (p.id === 'hq' ? ' label--hq' : '');
    el.style.setProperty('--c', p.color);
    el.innerHTML = `<span class="label__name">${esc(p.name)}</span><span class="label__team">${esc(p.place)}</span>`;
    el.addEventListener('click', () => onTravel(p.id));
    $('#labels').appendChild(el);
    labels[p.id] = el;
  }
  function placeLabel(id, x, y, visible, dist) {
    const el = labels[id];
    el.classList.toggle('is-hidden', !visible);
    if (!visible) return;
    const s = Math.max(0.72, Math.min(1.1, 100 / dist));
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${s})`;
  }

  // ----- Department panel -----
  const panel = $('#panel');
  function showPlace(p, { tour = false, index = 0, total = 0 } = {}) {
    const idx = places.findIndex((q) => q.id === p.id);
    const next = places[(idx + 1) % places.length];
    panel.style.setProperty('--c', p.color);
    const work = p.projects
      .map((slug) => {
        const pr = projects[slug];
        const m = pr.metrics[0];
        return `<button class="work" data-project="${slug}">
          <img src="${pr.images[0]}" alt="" loading="lazy" />
          <span><b>${esc(pr.title)}</b><em>${m ? `${esc(m[0])} ${esc(m[1])}` : esc(pr.client)}</em></span>
        </button>`;
      })
      .join('');
    panel.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <p class="eyebrow">${p.id === 'hq' ? 'Home base' : 'Department'} · ${esc(p.place)}</p>
      <h2>${esc(p.name)}</h2>
      <p class="lead">${esc(p.lead)}</p>
      <h3>${p.id === 'hq' ? 'What I do' : p.id === 'lab' ? 'What happens here' : 'How I work with this team'}</h3>
      <ul>${p.how.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      ${p.makes ? `<div class="chips">${p.makes.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div>` : ''}
      ${work ? `<h3>Work shipped together</h3><div class="works">${work}</div>` : ''}
      ${p.id === 'hq' ? `<div class="numbers">${owner.numbers.map((n) => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('')}</div>` : ''}
      ${
        tour
          ? `<p class="step">Stop ${index + 1} of ${total}</p>`
          : `<div class="actions">
              <button class="btn btn--ghost" data-next="${next.id}">Next: ${esc(next.name)} →</button>
              <button class="btn" data-hire>Hire me</button>
            </div>`
      }`;
    panel.querySelector('.close').onclick = () => hidePlace();
    panel.querySelector('[data-next]')?.addEventListener('click', (e) => onTravel(e.currentTarget.dataset.next));
    panel.querySelector('[data-hire]')?.addEventListener('click', () => toggleHire(true));
    panel.querySelectorAll('[data-project]').forEach((b) => b.addEventListener('click', () => openProject(b.dataset.project)));
    panel.scrollTop = 0;
    panel.classList.add('is-open');
    markVisited(p.id);
  }
  function hidePlace() {
    panel.classList.remove('is-open');
  }
  function markVisited(id) {
    if (visited.has(id)) return;
    visited.add(id);
    document.querySelector(`.dot[data-id="${id}"]`)?.classList.add('is-visited');
    renderMissions();
    if (visited.size === places.length)
      setTimeout(() => toast(`<b>You’ve met the whole organisation.</b><br>Every team, one voice. That’s the job. <a href="#" data-hire-link>Let’s talk →</a>`, 9000), 1500);
  }

  // ----- Project modal -----
  const modal = $('#project');
  let gallery = [];
  let gi = 0;
  function openProject(slug) {
    const p = projects[slug];
    if (!p) return;
    gallery = p.images;
    gi = 0;
    const place = places.find((q) => q.projects.includes(slug));
    modal.style.setProperty('--c', place?.color || '#2f6bff');
    modal.querySelector('.project__card').innerHTML = `
      <button class="close" data-close aria-label="Close">×</button>
      <div class="project__media">
        <img id="project-img" src="${gallery[0]}" alt="${esc(p.title)}" />
        ${gallery.length > 1 ? `<button class="nav prev" data-step="-1" aria-label="Previous image">‹</button><button class="nav next" data-step="1" aria-label="Next image">›</button><div class="pips">${gallery.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
      </div>
      <div class="project__body">
        <p class="eyebrow">${esc(place ? place.name : '')} · ${esc(p.client)} · ${esc(p.year)}</p>
        <h2>${esc(p.title)}</h2>
        <p class="tagline">${esc(p.tagline)}</p>
        ${p.metrics.length ? `<div class="metrics">${p.metrics.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
        <p>${esc(p.summary)}</p>
        ${p.awards ? `<ul class="awards">${p.awards.map((a) => `<li>🏆 ${esc(a)}</li>`).join('')}</ul>` : ''}
        <p class="role"><span>My role</span>${esc(p.role)}</p>
        <div class="actions">
          <a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener">Full case study ↗</a>
          ${p.extra ? `<a class="btn btn--ghost" href="${esc(p.extra.href)}" target="_blank" rel="noopener">${esc(p.extra.label)} ↗</a>` : ''}
        </div>
      </div>`;
    modal.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => stepGallery(Number(b.dataset.step))));
    modal.classList.add('is-open');
    if (!viewed.has(slug)) {
      viewed.add(slug);
      renderMissions();
    }
  }
  function stepGallery(d) {
    if (gallery.length < 2) return;
    gi = (gi + d + gallery.length) % gallery.length;
    $('#project-img').src = gallery[gi];
    modal.querySelectorAll('.pips i').forEach((el, i) => el.classList.toggle('on', i === gi));
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) modal.classList.remove('is-open');
  });

  // ----- Prompt & speech -----
  const promptEl = $('#prompt');
  let promptSlug = null;
  function prompt(title) {
    if (!title) {
      promptEl.classList.remove('is-open');
      promptSlug = null;
      return;
    }
    if (promptEl.dataset.title !== title) {
      promptEl.dataset.title = title;
      promptEl.innerHTML = `<kbd>E</kbd><span>View project</span><b>${esc(title)}</b>`;
      promptSlug = Object.keys(projects).find((k) => projects[k].title === title);
    }
    promptEl.classList.add('is-open');
  }
  promptEl.addEventListener('click', () => promptSlug && openProject(promptSlug));

  const speechEl = $('#speech');
  function speech(s) {
    if (!s) {
      speechEl.classList.remove('is-open');
      return;
    }
    if (speechEl.dataset.text !== s.text) {
      speechEl.dataset.text = s.text;
      speechEl.innerHTML = `<small>${esc(s.name)}</small>${esc(s.text)}`;
      speechEl.style.setProperty('--c', s.color);
    }
    let x = s.x;
    if (panel.classList.contains('is-open') && window.innerWidth > 640) x = Math.min(x, window.innerWidth - 560);
    speechEl.style.transform = `translate(${x}px, ${s.y}px) translate(-50%, -100%)`;
    speechEl.classList.add('is-open');
  }

  // ----- Trophies -----
  function collectTrophy(award) {
    trophies.add(award.id);
    renderMissions();
    toast(`<b>🏆 Trophy found! ${trophies.size}/${awards.length}</b><br>${esc(award.name)}: ${esc(award.detail)}`, 6500);
    if (trophies.size === awards.length) setTimeout(() => toast('<b>All trophies found.</b><br>The work wins rooms. <a href="#" data-hire-link>Hire me →</a>', 8000), 6800);
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
  $('#hire-numbers').innerHTML = owner.numbers.map((n) => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('');
  $('#hire-pillars').innerHTML = pillars.map((p) => `<li><span class="rune">${esc(p.rune)}</span><div><b>${esc(p.name)}</b><p>${esc(p.text)}</p></div></li>`).join('');
  $('#hire-path').innerHTML = owner.path.map((p) => `<li><span>${esc(p.years)}</span><b>${esc(p.org)}</b><p>${esc(p.role)}</p></li>`).join('');
  $('#hire-awards').innerHTML = awards.map((a) => `<li>🏆 <b>${esc(a.name)}</b> ${esc(a.detail)}</li>`).join('');
  $('#hire-links').innerHTML =
    `<a class="btn" href="mailto:${esc(owner.email)}">${esc(owner.email)}</a>` +
    owner.links.map((l) => `<a class="btn btn--ghost" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  hire.addEventListener('click', (e) => {
    if (e.target === hire || e.target.closest('[data-close]')) toggleHire(false);
  });
  function toggleHire(force) {
    hire.classList.toggle('is-open', force ?? !hire.classList.contains('is-open'));
  }
  function closeOverlays() {
    for (const el of [modal, hire]) {
      if (el.classList.contains('is-open')) {
        el.classList.remove('is-open');
        return true;
      }
    }
    return false;
  }
  const modalOpen = () => modal.classList.contains('is-open') || hire.classList.contains('is-open');

  // ----- Tour -----
  $('#tour-prev').addEventListener('click', () => onTourStep(-1));
  $('#tour-next').addEventListener('click', () => onTourStep(1));
  $('#tour-exit').addEventListener('click', onExitTour);
  const setTourProgress = (f) => ($('#tour-progress').style.transform = `scaleX(${f})`);

  function setMode(m) {
    mode = m;
    document.body.dataset.mode = m;
    $('#btn-overview').classList.toggle('is-active', m === 'overview');
    $('#btn-tour-hud').classList.toggle('is-active', m === 'tour');
    $('#btn-tour-hud').querySelector('span').textContent = m === 'tour' ? 'Exit tour' : 'Tour';
    if (m === 'overview') toast('<b>Bird’s-eye view.</b> Drag to orbit, scroll to zoom, click a label to fly in.', 4500);
    if (m === 'walk' && !setMode.welcomed) {
      setMode.welcomed = true;
      toast('<b>Welcome to the village.</b><br>Walk up to a billboard and press <kbd>E</kbd> to open a project.', 6000);
    }
  }
  function ready() {
    document.body.classList.add('is-ready');
    document.body.dataset.mode = mode;
  }

  return {
    placeLabel, showPlace, hidePlace, toast, toggleHire, toggleMissions, closeOverlays, modalOpen, setMode, setTourProgress,
    ready, openProject, stepGallery, prompt, speech, collectTrophy, visited,
  };
}
