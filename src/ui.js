import { socialRow } from './icons.js';
import { createCaseStudy } from './casestudy.js';
import { sfx, audioSettings, setLevel, toggleMute, onAudioChange, startAudio } from './audio.js';
import { LEADER, LENSES, PLAYS, METHOD, CAREERS, PROJECTS as ALL_PROJECTS } from './data.js';
import about from './content/about.json';
import { GLYPH, isCompact, isPortraitPhone, COMPACT, createArrival, createProfileCard, createRotate, createBrowse, sheetGestures, keepPlace, placeLine, isTouch } from './mobile.js';
import { goLandscape, resetStick } from './touch.js';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createUI({ owner, pillars, places, projects, awards, contact, favourites, tools = [], awardList = [], onEnter, onTour, onOverview, onTravel, onTourStep, onExitTour, onTime, onWalk, onRide, onPromptTap, onBriefs, onHomeVisit, onExitRoom, onPlan }) {
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
  document.querySelectorAll('[data-owner-short]').forEach((el) => (el.textContent = owner.short));

  // ----- Title screen: the three numbers under the menu -----
  $('#title-stats').innerHTML = owner.numbers.map((n) => `<div><dt>${esc(n.value)}</dt><dd>${esc(n.label)}</dd></div>`).join('');
  // Soft ticks under the pointer and a click on every control
  const CONTROL = 'button, .btn, .work, .label, .dot, .legend li, [role="button"], a, .cs-vbox';
  let hovered = null;
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.(CONTROL);
    if (el && el !== hovered) sfx('hover');
    hovered = el;
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest?.(CONTROL)) sfx('click');
  }, true);

  // ----- Title screen menu -----
  $('#btn-enter').addEventListener('click', () => explore());
  $('#btn-tour').addEventListener('click', () => onTour());
  $('#btn-about-intro').addEventListener('click', () => openAbout(undefined, { full: true }));
  $('#btn-hire-intro').addEventListener('click', () => openAbout('contact'));
  // the portrait welcome on phones: explore the island, or browse the work as a publication
  document.querySelectorAll('[data-explore-island]').forEach((b) => b.addEventListener('click', () => explore()));
  document.querySelectorAll('[data-browse-work]').forEach((b) => b.addEventListener('click', () => browse.open()));
  document.querySelectorAll('[data-about-full]').forEach((b) => b.addEventListener('click', () => openAbout(undefined, { full: true })));
  document.querySelectorAll('[data-hire-full]').forEach((b) => b.addEventListener('click', () => openAbout('contact')));
  $('#btn-brief-intro').addEventListener('click', () => {
    onEnter();
    setTimeout(() => openJournal('campaigns'), 250);
  });

  // ----- The rail: every in-game control in one place -----
  $('#btn-about').addEventListener('click', () => openAbout());
  $('#btn-overview').addEventListener('click', onOverview);
  $('#btn-map').addEventListener('click', onOverview);
  $('#btn-map').addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && onOverview());
  $('#btn-walk').addEventListener('click', () => onWalk?.());
  $('#btn-tour-hud').addEventListener('click', () => (mode === 'tour' ? onExitTour() : onTour()));
  $('#btn-hire').addEventListener('click', () => openAbout('contact'));
  $('#btn-time').addEventListener('click', () => onTime());
  $('#btn-journal').addEventListener('click', () => toggleJournal());

  // ----- Time & sky card: the clock now, then the next few hours -----
  const skyIcon = (h) => (h >= 6.5 && h < 17 ? '☀️' : h >= 17 && h < 19 ? '🌅' : h >= 5 && h < 6.5 ? '🌄' : '🌙');
  const skyWord = (h) => (h >= 5 && h < 12 ? 'Morning' : h >= 12 && h < 17 ? 'Afternoon' : h >= 17 && h < 19.5 ? 'Golden hour' : 'Night');
  const fmt = (h) => `${String(Math.floor(h) % 24).padStart(2, '0')}:00`;
  let clockText = '';
  let hourShown = -1;
  let modeLabel = 'Auto';
  const setClock = (t, hour = 9.5) => {
    if (t !== clockText) $('#clock').textContent = clockText = t;
    const h = Math.floor(hour);
    if (h === hourShown) return;
    hourShown = h;
    $('#clock-icon').textContent = skyIcon(hour);
    $('#btn-time').title = `${skyWord(hour)} · ${modeLabel}. Time of day (L)`;
  };
  const setTimeMode = (m) => {
    modeLabel = m.label;
    hourShown = -1;
    toast(`<b>${m.icon} ${m.label}</b> ${m.id === 'auto' ? 'A full day passes every 8 minutes.' : 'Time of day locked.'} Press <kbd>L</kbd> to change.`, 3000, { quiet: true });
  };

  // ----- Sound popover -----
  const soundEl = $('#sound');
  const syncSound = (st = audioSettings()) => {
    soundEl.querySelectorAll('[data-level]').forEach((inp) => {
      inp.value = st[inp.dataset.level];
      inp.style.setProperty('--v', `${st[inp.dataset.level] * 100}%`);
    });
    $('#sound-mute').textContent = st.muted ? 'Unmute' : 'Mute';
    $('#btn-sound').classList.toggle('is-muted', st.muted);
    $('#btn-sound span').textContent = st.muted ? 'Muted' : 'Sound';
  };
  syncSound();
  onAudioChange(syncSound);
  $('#btn-sound').addEventListener('click', (e) => {
    e.stopPropagation();
    startAudio();
    soundEl.classList.toggle('is-open');
    document.body.classList.remove('show-keys');
    toggleJournal(false);
  });
  $('#sound-mute').addEventListener('click', () => toggleMute());
  soundEl.addEventListener('input', (e) => {
    const k = e.target.dataset?.level;
    if (k) setLevel(k, +e.target.value);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#sound, #btn-sound')) soundEl.classList.remove('is-open');
    if (!e.target.closest('#keys, #btn-keys')) document.body.classList.remove('show-keys');
    if (!e.target.closest('#journal, #btn-journal, #scene') && journalEl.classList.contains('is-open')) toggleJournal(false);
  });
  $('#btn-keys').addEventListener('click', (e) => {
    e.stopPropagation();
    soundEl.classList.remove('is-open');
    toggleJournal(false);
    document.body.classList.toggle('show-keys');
  });
  // ----- More: on phones the utilities fold into one menu, so the rail stays short -----
  const moreEl = $('#more');
  const MORE = [
    ['btn-walk', 'Explore', 'Walk freely'],
    ['btn-tour-hud', 'Guided tour', 'Every place, one after another'],
    ['btn-cam', 'Camera', ''],
    ['btn-time', 'Time of day', ''],
    ['btn-sound', 'Sound', 'Music, ambience, effects'],
    ['btn-hire', 'Work with me', 'Roles, projects or a hello'],
  ];
  function renderMore() {
    moreEl.innerHTML = `<header class="more__head"><b>More</b><button class="close" data-close aria-label="Close">×</button></header>
      <div class="more__list">${MORE.map(([id, name, sub]) => {
        const b = document.getElementById(id);
        const ic = b.querySelector('svg, #clock-icon')?.outerHTML.replace('id="clock-icon"', '') || '';
        const now = b.querySelector('span')?.textContent || '';
        return `<button class="more__row${b.classList.contains('is-active') ? ' is-on' : ''}${id === 'btn-hire' ? ' more__row--accent' : ''}" data-for="${id}"><i>${ic}</i><span><b>${esc(name)}</b><em>${esc(sub || now)}</em></span></button>`;
      }).join('')}</div>`;
  }
  function toggleMore(force) {
    const open = force ?? !moreEl.classList.contains('is-open');
    if (open) {
      renderMore();
      toggleJournal(false);
      soundEl.classList.remove('is-open');
    }
    moreEl.classList.toggle('is-open', open);
    $('#btn-more').classList.toggle('is-active', open);
  }
  $('#btn-more').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMore();
  });
  moreEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return toggleMore(false);
    const row = e.target.closest('[data-for]');
    if (!row) return;
    toggleMore(false);
    document.getElementById(row.dataset.for).click();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#more, #btn-more')) toggleMore(false);
  });

  // ----- Journal: missions, campaigns and secrets, together -----
  const journalEl = $('#journal');
  let journalTab = 'missions';
  let quest = null;
  let campaigns = [0, 0];
  let hidden = { n: 0, total: 0, spots: [] };
  const ICON = {
    places: '🧭', files: '📂', ship: '📁', hidden: '✨', trophy: '🏆',
  };
  function missionRows() {
    return [
      { id: 'places', label: 'Meet every department', n: visited.size, total: places.length },
      { id: 'files', label: 'Open project files', n: viewed.size, total: totalProjects },
      ...(campaigns[1] ? [{ id: 'ship', label: 'Ship the campaigns', n: campaigns[0], total: campaigns[1], tab: 'campaigns' }] : []),
      ...(hidden.total ? [{ id: 'hidden', label: 'Find the hidden places', n: hidden.n, total: hidden.total, tab: 'secrets' }] : []),
      { id: 'trophy', label: 'Find the golden trophies', n: trophies.size, total: awards.length, tab: 'secrets' },
    ];
  }
  function renderMissions() {
    const rows = missionRows();
    const pct = Math.round((rows.reduce((a, r) => a + Math.min(1, r.n / r.total), 0) / rows.length) * 100);
    $('#journal-badge').textContent = `${pct}%`;
    $('#btn-journal').style.setProperty('--p', pct / 100);
    if (journalEl.classList.contains('is-open')) renderJournal();
  }
  const bar = (n, total) => `<i class="jbar" style="--p:${Math.min(1, n / total)}"></i>`;
  function renderJournal() {
    const rows = missionRows();
    const pct = Math.round((rows.reduce((a, r) => a + Math.min(1, r.n / r.total), 0) / rows.length) * 100);
    const briefs = quest?.briefs() || [];
    const secretsFound = hidden.n + trophies.size;
    const secretsTotal = hidden.total + awards.length;
    const tabs = [
      ['missions', 'Missions', `${rows.filter((r) => r.n >= r.total).length}/${rows.length}`],
      ['campaigns', 'Campaigns', `${campaigns[0]}/${briefs.length}`],
      ['secrets', 'Secrets', `${secretsFound}/${secretsTotal}`],
    ];
    let body = '';
    if (journalTab === 'missions') {
      body = `<ul class="jlist">${rows
        .map((r) => `<li><button class="jrow${r.n >= r.total ? ' is-done' : ''}" ${r.tab ? `data-tab="${r.tab}"` : ''}>
            <i class="jrow__icon">${ICON[r.id]}</i><span><b>${r.label}</b>${bar(r.n, r.total)}</span><em>${r.n}/${r.total}</em></button>
            ${r.id === 'places' ? `<div class="jdots">${places.map((p) => `<button class="jdot${visited.has(p.id) ? ' is-on' : ''}" data-go="${p.id}" style="--c:${p.color}" title="${esc(p.name)}">${esc(p.name)}</button>`).join('')}</div>` : ''}</li>`)
        .join('')}</ul>`;
    } else if (journalTab === 'campaigns') {
      body = `<p class="jnote">Real briefs. Carry one to every team it went through and see how it was cracked.</p>
        <ul class="jlist">${briefs
          .map((b) => `<li class="jbrief${b.done ? ' is-done' : ''}${b.active ? ' is-active' : ''}" style="--c:${b.color}">
            <p class="jbrief__client">${esc(b.client)} · ${esc(b.year)}</p>
            <b>${esc(b.title)}</b>
            <p class="jbrief__route">${b.route.map(esc).join(' → ')}</p>
            ${b.active
              ? `<div class="jbrief__row"><span>Carrying · stop ${b.step + 1} of ${b.stops}</span><button class="linkish" data-drop>Drop it</button></div>`
              : `<button class="jbrief__go" data-brief="${b.id}">${b.done ? '✓ Shipped · run it again' : `Take this brief · ${b.stops} stops`}</button>`}
          </li>`)
          .join('')}</ul>`;
    } else {
      body = `<h4 class="jh">Hidden places <em>${hidden.n}/${hidden.total}</em></h4>
        <ul class="jlist">${hidden.spots
          .map((h) => `<li class="jsecret${h.found ? ' is-found' : ''}"><i>${h.found ? '✨' : '?'}</i><span><b>${h.found ? esc(h.org) : 'Somewhere off the paths'}</b><em>${h.found ? esc(h.years) : 'A place from the past, hidden on the island'}</em></span></li>`)
          .join('')}</ul>
        <h4 class="jh">Golden trophies <em>${trophies.size}/${awards.length}</em></h4>
        <ul class="jlist">${awards
          .map((a) => `<li class="jsecret${trophies.has(a.id) ? ' is-found' : ''}"><i>${trophies.has(a.id) ? '🏆' : '?'}</i><span><b>${trophies.has(a.id) ? esc(a.name) : 'A golden trophy'}</b><em>${trophies.has(a.id) ? esc(a.detail) : 'Glinting somewhere in the village'}</em></span></li>`)
          .join('')}</ul>`;
    }
    journalEl.innerHTML = `
      <header class="jhead"><span class="jring" style="--p:${pct / 100}"><b>${pct}%</b></span><div><b>Journal</b><em>Your progress on the island</em></div><button class="close" data-close aria-label="Close">×</button></header>
      <div class="jtabs" role="tablist">${tabs.map(([id, name, n]) => `<button role="tab" class="${id === journalTab ? 'is-on' : ''}" data-tab="${id}">${name}<em>${n}</em></button>`).join('')}</div>
      <div class="jbody">${body}</div>`;
  }
  journalEl.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab], [data-go], [data-brief], [data-drop], [data-close]');
    if (!t) return;
    if (t.dataset.close !== undefined) return toggleJournal(false);
    if (t.dataset.tab) {
      journalTab = t.dataset.tab;
      return renderJournal();
    }
    if (t.dataset.go) {
      toggleJournal(false);
      return onTravel(t.dataset.go);
    }
    if (t.dataset.brief) {
      toggleJournal(false);
      return quest?.start(t.dataset.brief);
    }
    if (t.dataset.drop !== undefined) {
      quest?.cancel();
      renderJournal();
    }
  });
  function toggleJournal(force, tab) {
    const open = force ?? !journalEl.classList.contains('is-open');
    if (tab) journalTab = tab;
    if (open === journalEl.classList.contains('is-open') && !tab) return;
    if (open) {
      renderJournal();
      soundEl.classList.remove('is-open');
      document.body.classList.remove('show-keys');
    }
    if (open !== journalEl.classList.contains('is-open')) sfx(open ? 'open' : 'close');
    journalEl.classList.toggle('is-open', open);
    $('#btn-journal').classList.toggle('is-active', open);
  }
  const openJournal = (tab) => toggleJournal(true, tab);
  const toggleMissions = () => toggleJournal(undefined, journalEl.classList.contains('is-open') ? undefined : 'missions');
  renderMissions();

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
  // phones: arriving somewhere (or a tour stop) shows a small card; the drawer is one tap away
  const arrival = createArrival({ onOpen: (p) => showPlace(p, { expand: true, ...(mode === 'tour' ? tourAt : {}) }) });
  let tourAt = {};
  function showPlace(p, opts = {}) {
    const { tour = false, index = 0, total = 0, auto = false, expand = false } = opts;
    if (tour) {
      tourAt = { tour, index, total };
      const tl = $('#tour-label');
      if (tl) tl.innerHTML = `<b>${index + 1}/${total}</b> ${esc(p.name)}`;
    }
    if (isCompact() && !expand && (auto || tour)) {
      if (panel.classList.contains('is-open')) hidePlace();
      markVisited(p.id);
      arrival.show(p, { tour, index, total });
      return;
    }
    arrival.hide();
    if (!panel.classList.contains('is-open') || panel.dataset.id !== p.id) sfx('open');
    panel.dataset.id = p.id;
    panel.dataset.kind = 'place';
    lastPlace = { p, opts };
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
          <svg class="work__go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>`;
      })
      .join('');
    hidePass();
    const howTitle = { hq: 'What I do', lab: 'What happens here', home: 'About me', fun: 'After hours' }[p.id] || 'How I work with this team';
    const how = `<ul>${p.how.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>${p.makes ? `<div class="chips">${p.makes.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div>` : ''}`;
    const nums = p.id === 'home' || p.id === 'hq' ? `<div class="numbers">${owner.numbers.map((n) => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('')}</div>` : '';
    const homeBtns = p.id === 'home' ? `<button class="btn btn--wide" data-contact>✉️ Write to Vibhor</button><button class="btn btn--wide btn--ghost" data-ride>🚲 Ride my bicycle</button>` : '';
    const foot = tour
      ? `<p class="step">Stop ${index + 1} of ${total}</p>`
      : `<div class="actions">
          <button class="btn btn--ghost" data-next="${next.id}">Next: ${esc(next.name)} →</button>
          <button class="btn" data-hire>Hire me</button>
        </div>`;
    if (isCompact()) {
      // the drawer: who, one line, then straight to the work; the rest folds away
      const { count } = placeLine(p);
      panel.innerHTML = `
        <i class="sheet-grip" aria-hidden="true"></i>
        <header class="dr-head">
          <i class="place__glyph">${GLYPH[p.id] || '📍'}</i>
          <div><b>${esc(p.name)}</b><em>${esc([p.place, count].filter(Boolean).join(' · '))}</em></div>
          <button class="close" aria-label="Close">×</button>
        </header>
        <div class="dr-body">
          <p class="dr-lead">${esc(p.lead)}</p>
          ${work ? `<p class="dr-h">Work shipped together <span>${p.projects.length}</span></p><div class="works">${work}</div>` : ''}
          <details class="dr-more"${work ? '' : ' open'}><summary>${howTitle}</summary>${how}${nums}</details>
          ${p.id === 'fun' ? `<details class="dr-more"><summary>Films &amp; favourites</summary>${funExtra()}</details>` : ''}
          ${homeBtns}
          ${foot}
        </div>`;
    } else {
      panel.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      ${placeHead(p)}
      <div class="card-head"><b>${howTitle}</b></div>
      ${how}
      ${work ? `<div class="card-head"><b>Work shipped together</b><span>${p.projects.length} ${p.projects.length === 1 ? 'project' : 'projects'}</span></div><div class="works">${work}</div>` : ''}
      ${p.id === 'fun' ? funExtra() : ''}
      ${nums}${homeBtns}
      ${foot}`;
    }
    panel.querySelector('.close').onclick = () => hidePlace();
    panel.querySelector('[data-next]')?.addEventListener('click', (e) => onTravel(e.currentTarget.dataset.next));
    panel.querySelector('[data-hire]')?.addEventListener('click', () => toggleHire(true));
    panel.querySelector('[data-contact]')?.addEventListener('click', () => toggleHire(true, true));
    panel.querySelector('[data-ride]')?.addEventListener('click', () => {
      hidePlace();
      onRide?.();
    });
    panel.querySelectorAll('[data-project]').forEach((b) => b.addEventListener('click', () => openProject(b.dataset.project)));
    openPanel();
    markVisited(p.id);
  }
  let lastPlace = null;
  function openPanel() {
    panel.scrollTop = 0;
    panel.querySelector('.dr-body')?.scrollTo(0, 0);
    panel.classList.remove('is-full');
    panel.classList.add('is-open');
    document.body.classList.add('panel-open');
    if (isPortraitPhone()) resetStick();
  }
  sheetGestures(panel, { onClose: () => hidePlace() });
  // turning the phone between the drawer layouts redraws it in the right shape
  COMPACT.addEventListener('change', () => {
    if (panel.classList.contains('is-open') && panel.dataset.kind === 'place' && lastPlace) showPlace(lastPlace.p, { ...lastPlace.opts, expand: true });
  });
  function funExtra() {
    const list = (title, items) =>
      items.length ? `<h3>${title}</h3><ul class="favs">${items.map((i) => `<li><b>${esc(i.title)}</b>${i.year ? ` <em>${esc(i.year)}</em>` : ''}${i.note ? `<span>${esc(i.note)}</span>` : ''}</li>`).join('')}</ul>` : '';
    return list('Films & references that shaped the work', favourites.influences) + list('Favourite films', favourites.films) + list('Favourite shows', favourites.shows);
  }
  // Generic info panels: the AI stack, the awards, writing and leadership notes.
  function showInfo(kind) {
    if (kind === 'playbook') return openPlaybook();
    const C = { tools: '#00c2ff', awards: '#f5b700', leadership: '#e0786a' }[kind];
    let body = '';
    if (kind === 'tools') {
      body = `<p class="eyebrow">AI Lab · The stack</p><h2>Tools the studio builds with</h2>
        <p class="lead">Models are ingredients. The product is the interface and the system wrapped around them.</p>
        <div class="tool-grid">${tools.map((t) => `<div class="tool-chip"><b>${esc(t.name)}</b><span>${esc(t.use)}</span></div>`).join('')}</div>`;
    } else if (kind === 'awards') {
      body = `<p class="eyebrow">Recognition</p><h2>Awards & recognition</h2>
        <div class="award-list">${awardList.map((a) => `<div class="award ${a.tier}"><span>🏆</span><div><b>${esc(a.title)} · ${esc(a.category)}</b><em>${esc(a.show)} ${esc(a.year)}${a.project ? ` · ${esc(projects[a.project].title)}` : ' · Razorpay Creative & Design Team'}</em></div></div>`).join('')}</div>`;
    } else if (kind === 'leadership') {
      body = `<p class="eyebrow">From the bookshelf</p><h2>Leadership notes & writing</h2>
        <ul>${['Keep widening the toolkit', 'Make goals measurable', 'Build a culture that can take risks', 'Design for the business, not just the brief'].map((x) => `<li>${x}</li>`).join('')}</ul>
        <h3>Writing</h3><div class="works">${owner.writing.map((w) => `<a class="work work--text" href="${esc(w.url)}" target="_blank" rel="noopener"><span><b>${esc(w.title)}</b><em>${esc(w.date)} ↗</em></span></a>`).join('')}</div>
        <h3>Teaching</h3><ul>${owner.teaching.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    }
    hidePass();
    sfx('open');
    panel.style.setProperty('--c', C);
    panel.dataset.kind = 'info';
    panel.innerHTML = isCompact()
      ? `<i class="sheet-grip" aria-hidden="true"></i><header class="dr-head dr-head--bare"><button class="close" aria-label="Close">×</button></header><div class="dr-body dr-info">${body}</div>`
      : `<button class="close" aria-label="Close">×</button>${body}`;
    panel.querySelector('.close').onclick = () => hidePlace();
    arrival.hide();
    openPanel();
  }

  // Fade to black and back, for doors.
  const fader = $('#fader');
  let fading = false;
  function fade(cb) {
    if (fading) return false;
    fading = true;
    fader.classList.add('is-on');
    setTimeout(() => {
      cb();
      setTimeout(() => {
        fader.classList.remove('is-on');
        fading = false;
      }, 120);
    }, 380);
    return true;
  }
  const indoorEl = $('#indoor');
  indoorEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-exit]')) onExitRoom?.();
    else if (e.target.closest('[data-plan]')) onPlan?.();
  });
  // ----- Room guide: the room's story as chapters, following you round -----
  const guideEl = document.createElement('aside');
  guideEl.id = 'guide';
  guideEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(guideEl);
  let guideKey = '';
  // phones: the guide is one line (room · chapter); a tap opens the whole story
  guideEl.addEventListener('click', () => {
    if (!isCompact()) return;
    guideEl.classList.toggle('is-open');
    const m = guideEl.querySelector('.guide__more');
    if (m) m.textContent = guideEl.classList.contains('is-open') ? 'Hide' : 'View story';
  });
  function setGuide(s, roomId) {
    const key = `${roomId}|${s.current}|${s.next}|${s.seen.length}`;
    if (key === guideKey) return;
    const reached = s.seen.length;
    if (guideKey && reached && guideKey.split('|')[3] !== String(reached)) sfx('tick');
    guideKey = key;
    const n = s.chapters.length;
    const cur = s.current >= 0 ? s.chapters[s.current] : null;
    const nxt = s.next >= 0 ? s.chapters[s.next] : null;
    guideEl.innerHTML = `
      <p class="guide__top"><span>${esc(s.title)}</span><b>${reached}/${n}</b><em class="guide__more">${guideEl.classList.contains('is-open') ? 'Hide' : 'View story'}</em></p>
      ${cur ? `<p class="guide__ch">Chapter ${s.current + 1}</p><h3>${esc(cur.title)}</h3><p class="guide__line">${esc(cur.line)}</p>` : `<h3>${esc(s.intro)}</h3><p class="guide__line">Walk through the rooms: each numbered medallion in the floor marks a stop. The floor plan shows the way.</p>`}
      <ol class="guide__dots">${s.chapters.map((c, k) => `<li class="${s.seen.includes(k) ? 'is-seen' : ''} ${k === s.current ? 'is-now' : ''} ${k === s.next ? 'is-next' : ''}" title="${esc(c.title)}">${k + 1}</li>`).join('')}</ol>
      <p class="guide__next">${nxt ? `Next: <b>${s.next + 1} · ${esc(nxt.title)}</b>` : 'Story complete. Exit to the island whenever you like.'}</p>`;
  }

  function setIndoor(place) {
    document.body.classList.toggle('is-indoor', !!place);
    guideKey = '';
    guideEl.innerHTML = '';
    if (!place) {
      indoorEl.innerHTML = '';
      $('#btn-overview span').textContent = 'Map';
      $('#map-title').textContent = 'Vibhor’s island';
      $('#map-sub').textContent = 'Exploring';
    }
    if (place) {
      indoorEl.style.setProperty('--c', place.color);
      indoorEl.innerHTML = `<button class="ri ri--exit" data-exit title="Leave ${esc(place.name)} by the front door (Esc)"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4.5H6.5v15H13"/><path d="M10.5 12h9m-3-3 3 3-3 3"/></svg><span>Exit</span></button>`;
      $('#btn-overview span').textContent = 'Plan';
      $('#map-title').textContent = place.name;
      $('#map-sub').textContent = 'Inside · floor plan';
      toast(`<b>Welcome to ${esc(place.name)}.</b> Walk through the rooms, tap anything to walk up to it, or open the floor plan.`, 4500);
    }
  }

  // The place "pass": a ticket with the department's name, numbers and a colour stub
  const passEl = $('#pass');
  // the head of a place card: its name, where it is and what it is, then the numbers, all in one block
  function placeHead(p) {
    const kind = { hq: 'Island pass', home: 'Home pass', fun: 'Playground pass', lab: 'Night Lab pass', ai: 'Lab pass', awards: 'Hall pass' }[p.id] || 'Department pass';
    const makes = p.makes || [];
    return `<header class="place">
      <div class="place__top"><i class="place__glyph">${GLYPH[p.id] || '📍'}</i><span class="place__kind">${kind}<em>${esc(p.place)}</em></span></div>
      <h2>${esc(p.name)}</h2>
      <p class="place__lead">${esc(p.lead)}</p>
      <ul class="place__stats">
        <li><b>${esc(p.count ?? p.projects.length)}</b><span>${esc(p.countLabel ?? (p.projects.length === 1 ? 'project' : 'projects'))}</span></li>
        ${makes[0] ? `<li><b>${esc(makes[0])}</b><span>${esc(makes[1] || 'craft')}</span></li>` : ''}
        <li><b>${visited.has(p.id) ? 'Again' : 'New'}</b><span>visit</span></li>
      </ul>
    </header>`;
  }
  function renderPass(p) {
    const kind = { hq: 'Island pass', home: 'Home pass', fun: 'Playground pass', lab: 'Night Lab pass', ai: 'Lab pass', awards: 'Hall pass' }[p.id] || 'Department pass';
    const makes = p.makes || [];
    passEl.style.setProperty('--c', p.color);
    passEl.innerHTML = `
      <div class="pass__main">
        <p class="pass__eyebrow">${kind}</p>
        <h2>${esc(p.name)}</h2>
        <p class="pass__place">${esc(p.place)}</p>
        <p class="pass__lead">${esc(p.lead)}</p>
        <ul class="pass__stats">
          <li><b>${p.projects.length}</b><span>${p.projects.length === 1 ? 'project' : 'projects'}</span></li>
          ${makes[0] ? `<li><b>${esc(makes[0])}</b><span>${esc(makes[1] || 'craft')}</span></li>` : ''}
          <li><b>${visited.has(p.id) ? 'Again' : 'New'}</b><span>visit</span></li>
        </ul>
      </div>
      <div class="pass__stub"><span>${GLYPH[p.id] || '📍'}</span><i></i></div>`;
    passEl.classList.add('is-open');
    $('#map-title').textContent = p.name;
    $('#map-sub').textContent = p.place;
  }
  function hidePass() {
    passEl.classList.remove('is-open');
    if (!document.body.classList.contains('is-indoor')) {
      $('#map-title').textContent = 'Vibhor’s island';
      $('#map-sub').textContent = 'Exploring';
    }
  }

  function hidePlace({ auto = false } = {}) {
    if (panel.classList.contains('is-open')) sfx('close');
    hidePass();
    // leaving a place takes its arrival card with it; closing the drawer by hand leaves the tour card
    if (auto || mode !== 'tour') arrival.hide();
    panel.classList.remove('is-open', 'is-full');
    document.body.classList.remove('panel-open');
  }
  function markVisited(id) {
    if (visited.has(id)) return;
    visited.add(id);
    renderMissions();
    if (visited.size === places.length)
      setTimeout(() => toast(`<b>You’ve met the whole organisation.</b><br>Every team, one voice. That’s the job. <a href="#" data-hire-link>Let’s talk →</a>`, 9000, { priority: 2, kind: 'reward' }), 1500);
  }

  // ----- Case studies -----
  const caseStudy = createCaseStudy({
    projects,
    places,
    onOpen: (slug) => {
      if (!viewed.has(slug)) {
        viewed.add(slug);
        renderMissions();
      }
    },
  });
  const openProject = (slug) => caseStudy.open(slug);
  const stepGallery = () => {};

  // ----- Prompt & speech -----
  const promptEl = $('#prompt');
  let promptSlug = null;
  let promptAction = null;
  function prompt(thing) {
    promptAction = thing;
    if (!thing) {
      promptEl.classList.remove('is-open');
      return;
    }
    const key = thing.verb + thing.label;
    if (promptEl.dataset.key !== key) {
      promptEl.dataset.key = key;
      sfx('prompt');
      promptEl.innerHTML = `<kbd>E</kbd><span>${esc(thing.verb)}</span><b>${esc(thing.label)}</b>`;
    }
    promptEl.classList.add('is-open');
  }
  promptEl.addEventListener('click', () => {
    const a = promptAction;
    if (!a) return;
    if (onPromptTap) return onPromptTap(a);
    if (a.kind === 'project') openProject(a.slug);
    else if (a.kind === 'contact') toggleHire(true, true);
    else if (a.kind === 'home' || a.kind === 'fun') showPlace(places.find((p) => p.id === a.kind));
  });

  // Thought bubbles over nearby villagers (a small pool of elements).
  const thoughtRoot = $('#thoughts');
  const pool = [];
  function thoughts(list) {
    while (pool.length < list.length) {
      const el = document.createElement('div');
      el.className = 'thought';
      thoughtRoot.appendChild(el);
      pool.push(el);
    }
    pool.forEach((el, i) => {
      const b = list[i];
      if (!b) {
        el.classList.remove('is-open');
        return;
      }
      if (el.dataset.text !== b.text) {
        el.dataset.text = b.text;
        el.textContent = b.text;
      }
      el.style.setProperty('--c', b.color);
      el.style.transform = `translate(${b.x}px, ${b.y}px) translate(-50%, -100%) scale(${b.scale})`;
      el.classList.add('is-open');
    });
  }

  const speechEl = $('#speech');
  function speech(s) {
    if (!s) {
      speechEl.classList.remove('is-open');
      return;
    }
    if (speechEl.dataset.text !== s.text + (s.thought || '')) {
      speechEl.dataset.text = s.text + (s.thought || '');
      speechEl.innerHTML = `<small>${esc(s.name)}</small>${esc(s.text)}${s.thought && s.thought !== s.text ? `<em class="speech__thought">💭 ${esc(s.thought)}</em>` : ''}`;
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
    sfx('trophy');
    renderMissions();
    toast(`<b>🏆 Trophy found! ${trophies.size}/${awards.length}</b><br>${esc(award.name)}: ${esc(award.detail)}`, 6500, { priority: 2, kind: 'reward' });
    if (trophies.size === awards.length) setTimeout(() => toast('<b>All trophies found.</b><br>The work wins rooms. <a href="#" data-hire-link>Hire me →</a>', 8000, { priority: 2, kind: 'reward' }), 6800);
  }

  // ----- Toast -----
  // One notice at a time. A more important one replaces a lesser one; an equal one waits its turn;
  // a trivial one (quiet) is dropped if something is already showing. Tap a notice to dismiss it.
  const toastEl = $('#toast');
  let toastTimer = 0;
  let toastNow = null;
  const toastQueue = [];
  function toast(html, ms = 4000, { quiet = false, priority = quiet ? 0 : 1, kind = '' } = {}) {
    const item = { html, ms, quiet, priority, kind };
    if (toastNow) {
      if (priority < toastNow.priority) {
        if (priority > 0 && toastQueue.length < 3) toastQueue.push(item);
        return;
      }
      if (priority === toastNow.priority && priority > 0 && toastNow.html !== html && performance.now() - toastNow.at < 1500) {
        if (toastQueue.length < 3) toastQueue.push(item);
        return;
      }
    }
    showToast(item);
  }
  function showToast(item) {
    if (!item.quiet) sfx('toast');
    item.at = performance.now();
    toastNow = item;
    toastEl.innerHTML = item.html;
    toastEl.dataset.kind = item.kind || (/🏆/.test(item.html) ? 'reward' : '');
    toastEl.classList.add('is-open');
    toastEl.querySelector('[data-hire-link]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleHire(true);
    });
    clearTimeout(toastTimer);
    // phones: shorter, so the island is back sooner (rewards keep a little longer)
    const ms = isCompact() ? Math.min(item.ms, toastEl.dataset.kind === 'reward' ? 5200 : 3800) : item.ms;
    toastTimer = setTimeout(endToast, ms);
  }
  function endToast() {
    clearTimeout(toastTimer);
    toastEl.classList.remove('is-open');
    toastNow = null;
    const next = toastQueue.shift();
    if (next) toastTimer = setTimeout(() => showToast(next), 260);
  }
  toastEl.addEventListener('click', (e) => {
    if (!e.target.closest('a')) endToast();
  });

  // ----- About: the one page about Vibhor. Hire me, Home and the name card all open it -----
  const aboutEl = $('#about');
  const md = (t) => esc(t).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const fact = (label) => about.facts.find((f) => f.label === label)?.value || '';
  const hireList = owner.hireFor
    .replace(/\.$/, '')
    .split(/;\s*/)
    .map((x) => x.replace(/^and /, ''))
    .map((x) => x[0].toUpperCase() + x.slice(1));
  const shows = [...new Set(awardList.map((a) => a.show))];
  const SECTIONS = [
    ['impact', 'Impact'],
    ['awards', 'Awards'],
    ['path', 'Path'],
    ['bring', 'What I bring'],
    ['lead', 'How I lead'],
    ['teach', 'Mentoring'],
    ['after', 'After hours'],
    ['contact', 'Work with me'],
  ];
  aboutEl.querySelector('.about').innerHTML = `
    <button class="close" data-close aria-label="Close">×</button>
    <nav class="about__bar" aria-label="Chapters">
      <div class="about__chips">${SECTIONS.filter(([id]) => id !== 'contact').map(([id, name]) => `<button data-jump="${id}">${name}</button>`).join('')}</div>
      <button class="about__barbtn about__barbtn--accent" data-jump="contact" aria-label="Contact">✉️<span> Contact</span></button>
      <button class="about__barbtn" data-close aria-label="Close">×</button>
    </nav>
    <aside class="about__side">
      <figure class="about__portrait"><img src="${esc(owner.portrait)}" alt="${esc(owner.name)}" /><figcaption>${esc(about.portrait_caption)}</figcaption></figure>
      <h2>${esc(owner.name)}</h2>
      <p class="about__role">${esc(owner.role)}</p>
      <div class="about__btns">
        <button class="btn btn--accent" data-jump="contact">✉️ Write to me</button>
        <button class="btn btn--ghost" data-home-visit>🏡 Walk to Home</button>
        <button class="btn btn--ghost" data-home-ride>🚲 Ride my bicycle</button>
      </div>
      <nav class="about__toc">${SECTIONS.map(([id, name]) => `<button data-jump="${id}">${name}</button>`).join('')}</nav>
    </aside>
    <div class="about__main">
      <header class="about__hero">
        <p class="about__eyebrow">About</p>
        <h1>${md(about.headline)}</h1>
        <p class="about__lead">${esc(owner.tagline)}</p>
        <dl class="about__facts">${['Currently', 'Based', 'Education'].map((l) => `<div><dt>${l}</dt><dd>${esc(fact(l))}</dd></div>`).join('')}</dl>
      </header>

      <section id="ab-impact">
        <h3 class="about__h">Impact</h3>
        <div class="bento">${LEADER.impact.map((n, k) => `<div class="bento__tile${k === 0 || k === 4 ? ' is-wide' : ''}"><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('')}</div>
        <h4 class="about__sub">Numbers the work moved</h4>
        <div class="results">${owner.results.map((r) => `<button class="result" data-open="${r.slug}"><b>${esc(r.value)}</b><span>${esc(r.label)}</span><em>${esc(ALL_PROJECTS[r.slug].title)} →</em></button>`).join('')}</div>
      </section>

      <section id="ab-awards">
        <h3 class="about__h">Awards</h3>
        <div class="about__awards">
        <div class="awards__big"><b>${awardList.length}</b><span>awards in 2026</span><em>${shows.map(esc).join(' · ')}</em></div>
        <div class="awards__list">${shows
          .map((show) => `<div class="awards__show"><p>${esc(show)}</p><ul>${awardList
            .filter((a) => a.show === show)
            .map((a) => `<li class="is-${a.tier}"><b>${esc(a.title)}</b><span>${esc(a.category)}</span>${a.project ? `<button class="linkish" data-open="${a.project}">${esc(ALL_PROJECTS[a.project].title)}</button>` : '<em>The team</em>'}</li>`)
            .join('')}</ul></div>`)
          .join('')}</div>
        </div>
      </section>

      <section id="ab-path">
        <h3 class="about__h">Path</h3>
        <ol class="tl">${about.timeline.items.map((i) => `<li><span>${esc(i.years)}</span><b>${esc(i.org)}</b><em>${esc(i.role)}</em></li>`).join('')}</ol>
      </section>

      <section id="ab-bring">
        <h3 class="about__h">What I bring</h3>
        <div class="bento bento--5">${pillars.map((p) => `<div class="bento__tile bento__tile--text"><i>${esc(p.rune)}</i><b>${esc(p.name)}</b><span>${esc(p.text)}</span></div>`).join('')}</div>
      </section>

      <section id="ab-lead">
        <h3 class="about__h">How I lead</h3>
        <ol class="nums">${about.leadership.items.map((i) => `<li>${esc(i.title)}</li>`).join('')}</ol>
        <ul class="ticks">${LEADER.people.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="about__row"><button class="btn btn--ghost" data-playbook>Open the campaign playbook →</button></div>
        <h4 class="about__sub">Writing</h4>
        <ul class="links">${owner.writing.map((w) => `<li><a href="${esc(w.url)}" target="_blank" rel="noopener"><b>${esc(w.title)}</b><em>${esc(w.date)} ↗</em></a></li>`).join('')}</ul>
      </section>

      <section id="ab-teach">
        <h3 class="about__h">Mentoring &amp; talks</h3>
        <ul class="ticks">${owner.teaching.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <blockquote class="about__quote">“${esc(LEADER.quote.text)}”<cite>${esc(LEADER.quote.who)}</cite></blockquote>
      </section>

      <section id="ab-after">
        <h3 class="about__h">After hours</h3>
        <div class="chips">${['AI art', 'Stop-motion animation', 'Found-object art', 'Quirky content for Instagram'].map((c) => `<span class="chip">${c}</span>`).join('')}</div>
        <div class="gallery">${owner.gallery.map((g) => `<figure><img src="${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy" /><figcaption>${esc(g.caption)}</figcaption></figure>`).join('')}</div>
      </section>

      <section id="ab-contact" class="about__contact">
        <h3 class="about__h">Work with me</h3>
        <ul class="ticks">${hireList.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        <div class="about__links">${socialRow(owner.links, owner.email)}</div>
        <form id="contact-form" class="contact-form">
          <div class="cf-row">
            <label>Your name<input id="cf-name" name="name" required autocomplete="name" autocapitalize="words" enterkeyhint="next" /></label>
            <label>Email<input name="email" type="email" inputmode="email" required autocomplete="email" autocapitalize="off" spellcheck="false" enterkeyhint="next" /></label>
          </div>
          <label>I’d like to talk about<select id="cf-intent" name="intent">${contact.intents.map((i) => `<option>${esc(i)}</option>`).join('')}</select></label>
          <label>Message<textarea name="message" rows="3" required enterkeyhint="send" placeholder="Tell me what you’re building…"></textarea></label>
          <label class="cf-trap" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off" /></label>
          <div class="cf-foot"><button class="btn" type="submit">Send message</button><span id="cf-status"></span></div>
        </form>
      </section>
    </div>`;
  const aboutOpen = () => aboutEl.classList.contains('is-open');
  // one scroller: the right-hand column on wide screens, the whole page on phones and narrow windows
  const ABOUT_NARROW = matchMedia('(max-width: 860px), (max-height: 540px) and (orientation: landscape)');
  const aboutScroller = () => (ABOUT_NARROW.matches ? aboutEl.querySelector('.about') : aboutEl.querySelector('.about__main'));
  const aboutSections = () => [...aboutEl.querySelectorAll('.about__main > section')];
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
  function jump(id) {
    const target = aboutEl.querySelector(`#ab-${id}`);
    if (!target) return;
    const sc = aboutScroller();
    const bar = ABOUT_NARROW.matches ? aboutEl.querySelector('.about__bar').offsetHeight : 0;
    const top = target.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - bar - 12;
    sc.scrollTo({ top, behavior: REDUCED.matches ? 'auto' : 'smooth' });
  }
  // the chapter bar follows the reading, and the reading survives the phone turning
  const aboutPlace = keepPlace(aboutScroller, aboutSections, aboutOpen);
  let chipOn = '';
  const onAboutScroll = () => {
    aboutPlace.measure();
    const sc = aboutScroller();
    const top = sc.getBoundingClientRect().top + 90;
    let cur = '';
    for (const sec of aboutSections()) if (sec.getBoundingClientRect().top <= top) cur = sec.id.slice(3);
    if (cur === chipOn) return;
    chipOn = cur;
    aboutEl.querySelectorAll('.about__chips button').forEach((b) => {
      const on = b.dataset.jump === cur;
      b.classList.toggle('is-on', on);
      if (on && ABOUT_NARROW.matches) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    });
  };
  aboutEl.querySelector('.about').addEventListener('scroll', onAboutScroll, { passive: true });
  aboutEl.querySelector('.about__main').addEventListener('scroll', onAboutScroll, { passive: true });
  // the quick profile: on phones, About from the game is a card first, the full page on request
  const profileCard = createProfileCard({
    owner,
    onFull: () => openAbout(undefined, { full: true }),
    onContact: () => openAbout('contact'),
    onHome: () => onHomeVisit?.(),
  });
  function openAbout(section, { full = false } = {}) {
    if (isCompact() && !section && !full && mode !== 'intro' && !aboutOpen()) {
      arrival.hide();
      if (panel.classList.contains('is-open')) hidePlace();
      toggleJournal(false);
      sfx('open');
      return profileCard.open();
    }
    profileCard.close();
    if (!aboutOpen()) {
      aboutEl.classList.add('is-open');
      document.body.classList.add('about-open');
      resetStick();
      sfx('open');
      aboutEl.querySelector('.about__main').scrollTop = 0;
      aboutEl.querySelector('.about').scrollTop = 0;
    }
    if (section) setTimeout(() => {
      jump(section);
      // phones: don't throw the keyboard up over the page; the form is right there to tap
      if (section === 'contact' && !isTouch) $('#cf-name').focus({ preventScroll: true });
    }, 120);
  }
  function closeAbout() {
    if (!aboutOpen()) return;
    aboutEl.classList.remove('is-open');
    document.body.classList.remove('about-open');
    sfx('close');
  }
  // the old entry points, kept as names the rest of the game calls
  const toggleHire = (force) => ((force ?? !aboutOpen()) ? openAbout('contact') : closeAbout());
  const openHome = () => openAbout();
  const openSplash = () => openAbout();
  aboutEl.addEventListener('click', (e) => {
    if (e.target === aboutEl || e.target.closest('[data-close]')) return closeAbout();
    const j = e.target.closest('[data-jump]');
    if (j) return jump(j.dataset.jump);
    const o = e.target.closest('[data-open]');
    if (o) {
      closeAbout();
      return openProject(o.dataset.open);
    }
    if (e.target.closest('[data-playbook]')) {
      closeAbout();
      return openPlaybook();
    }
    if (e.target.closest('[data-home-visit]')) {
      closeAbout();
      onHomeVisit?.();
    } else if (e.target.closest('[data-home-ride]')) {
      closeAbout();
      onRide?.();
    }
  });

  // ----- Career sheets: the hidden Grofers and Razorpay pavilions -----
  const careerEl = document.createElement('div');
  careerEl.id = 'career';
  careerEl.className = 'modal';
  careerEl.setAttribute('role', 'dialog');
  careerEl.setAttribute('aria-modal', 'true');
  careerEl.innerHTML = '<div class="sheet sheet--career"><button class="close" data-close aria-label="Close">×</button><aside class="sheet__side"></aside><div class="sheet__main"></div></div>';
  document.body.appendChild(careerEl);
  function openCareer(id) {
    const c = CAREERS[id];
    if (!c) return;
    const sheet = careerEl.querySelector('.sheet');
    sheet.style.setProperty('--c', c.color);
    sheet.querySelector('.sheet__side').innerHTML = `
      <div class="career__badge" style="background:${c.color}">${id === 'razorpay' ? '₹' : '🛍️'}</div>
      <p class="eyebrow">${esc(c.years)} · found ${esc(c.place.toLowerCase())}</p>
      <h2>${esc(c.org)}</h2>
      <p class="sheet__role">${esc(c.role)}</p>
      <ul class="people">${c.did.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`;
    sheet.querySelector('.sheet__main').innerHTML = `
      <p class="sheet__tagline">${esc(c.headline)}</p>
      <div class="sheet__body">${c.story.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      <h3 class="sheet__h">The work from those years <span>${c.projects.length} projects</span></h3>
      <div class="career__works">${c.projects
        .map((slug) => {
          const pr = ALL_PROJECTS[slug];
          return `<button class="career__work" data-open="${slug}"><img src="${esc(pr.images[0])}" alt="" loading="lazy" /><span><em>${esc(pr.year)} · ${esc(pr.role)}</em><b>${esc(pr.title)}</b><i>${esc(pr.tagline)}</i></span></button>`;
        })
        .join('')}</div>`;
    careerEl.classList.add('is-open');
    sheet.querySelector('.sheet__main').scrollTop = 0;
    sfx('open');
  }
  function closeCareer() {
    if (!careerEl.classList.contains('is-open')) return;
    careerEl.classList.remove('is-open');
    sfx('close');
  }
  careerEl.addEventListener('click', (e) => {
    if (e.target === careerEl || e.target.closest('[data-close]')) return closeCareer();
    const o = e.target.closest('[data-open]');
    if (o) {
      closeCareer();
      openProject(o.dataset.open);
    }
  });

  // ----- The campaign playbook -----
  const playbook = $('#playbook');
  let lensFilter = 'all';
  function renderPlaybook() {
    const slugs = Object.keys(PLAYS).filter((s) => lensFilter === 'all' || PLAYS[s].lenses[lensFilter]);
    $('#playbook-body').innerHTML = `
      <p class="eyebrow">How I crack a campaign</p>
      <h2 class="sheet__title">The campaign playbook</h2>
      <p class="sheet__line">Every brief has to do four things. Here is how each campaign did them, in the words of the case studies.</p>
      <div class="lens-row lens-row--filter">
        <button class="${lensFilter === 'all' ? 'is-on' : ''}" data-lens="all" style="--l:#ffffff"><b>All campaigns</b><span>${Object.keys(PLAYS).length} plays</span></button>
        ${LENSES.map((l) => `<button class="${lensFilter === l.id ? 'is-on' : ''}" data-lens="${l.id}" style="--l:${l.color}"><b>${l.icon} ${esc(l.name)}</b><span>${esc(l.ask)}</span></button>`).join('')}
      </div>
      <h3 class="sheet__h">The studio method</h3>
      <ol class="method">${METHOD.map((m) => `<li><b>${esc(m.step)}</b><span>${esc(m.line)}</span></li>`).join('')}</ol>
      <div class="plays">${slugs
        .map((slug) => {
          const pl = PLAYS[slug];
          const pr = ALL_PROJECTS[slug];
          const shown = LENSES.filter((l) => pl.lenses[l.id] && (lensFilter === 'all' || l.id === lensFilter));
          return `<article class="play">
            <img src="${esc(pr.images[0])}" alt="" loading="lazy" />
            <div class="play__body">
              <p class="play__kind">${esc(pl.kind)} · ${esc(pr.client)} · ${esc(pr.year)}</p>
              <h4>${esc(pr.title)}</h4>
              <dl><dt>Problem</dt><dd>${esc(pl.problem)}</dd><dt>Idea</dt><dd>${esc(pl.idea)}</dd><dt>Craft</dt><dd>${esc(pl.craft)}</dd></dl>
              <div class="play__lenses">${shown.map((l) => `<p style="--l:${l.color}"><b>${esc(l.name)}</b> ${esc(pl.lenses[l.id])}</p>`).join('')}</div>
              <button class="linkish" data-open="${slug}">Open the case study →</button>
            </div>
          </article>`;
        })
        .join('')}</div>`;
  }
  function openPlaybook() {
    renderPlaybook();
    playbook.classList.add('is-open');
    playbook.querySelector('.sheet').scrollTop = 0;
    sfx('open');
  }
  function closePlaybook() {
    if (!playbook.classList.contains('is-open')) return;
    playbook.classList.remove('is-open');
    sfx('close');
  }
  playbook.addEventListener('click', (e) => {
    if (e.target === playbook || e.target.closest('[data-close]')) return closePlaybook();
    const lens = e.target.closest('[data-lens]');
    if (lens) {
      lensFilter = lens.dataset.lens;
      renderPlaybook();
      sfx('click');
      return;
    }
    const o = e.target.closest('[data-open]');
    if (o) {
      closePlaybook();
      openProject(o.dataset.open);
    }
  });

  // Contact form: each message becomes a row in the responses Google Sheet (see CONTACT in data.js).
  const cform = $('#contact-form');
  // phones: keep the field you're typing in above the keyboard
  cform.addEventListener('focusin', (e) => {
    if (!isTouch || !e.target.matches('input, textarea, select')) return;
    setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
  });
  cform.addEventListener('invalid', () => {
    const st = $('#cf-status');
    st.textContent = 'Please add your name, a valid email and a message.';
    st.dataset.state = 'error';
  }, true);
  cform.addEventListener('input', () => {
    if ($('#cf-status').dataset.state === 'error') {
      $('#cf-status').textContent = '';
      delete $('#cf-status').dataset.state;
    }
  });
  cform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const status = $('#cf-status');
    const button = f.querySelector('button[type="submit"]');
    status.dataset.state = 'ok';
    if (!contact.endpoint) {
      status.textContent = `The form isn’t connected yet. Write to ${owner.email} in the meantime.`;
      status.dataset.state = 'error';
      return;
    }
    // the Google Apps Script web app takes a plain form post (no CORS preflight); its reply can't be
    // read from here, so a post that reaches it counts as sent
    const data = new URLSearchParams({
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      intent: f.intent.value,
      message: f.message.value.trim(),
      website: f.website.value,
      page: location.href,
    });
    status.textContent = 'Sending…';
    button.disabled = true;
    try {
      await fetch(contact.endpoint, { method: 'POST', mode: 'no-cors', body: data });
      status.textContent = 'Sent! Vibhor will get back to you soon.';
      f.reset();
      toast('<b>✉️ Message sent.</b> Thanks for writing!', 4000, { priority: 2, kind: 'success' });
    } catch {
      status.textContent = 'Couldn’t send just now. Check your connection and try again.';
      status.dataset.state = 'error';
    } finally {
      button.disabled = false;
    }
  });
  // ----- Web popup: games, films and pages inside the island instead of a new tab -----
  const webpop = $('#webpop');
  const webFrame = $('#webpop-frame');
  function openWeb(url, title = '') {
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    webFrame.src = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` : url;
    $('#webpop-title').textContent = title || url.replace(/^https?:\/\//, '').split('/')[0];
    $('#webpop-open').href = url;
    webpop.classList.add('is-open');
  }
  function closeWeb() {
    webpop.classList.remove('is-open');
    setTimeout(() => {
      if (!webpop.classList.contains('is-open')) webFrame.src = 'about:blank';
    }, 300);
  }
  webpop.addEventListener('click', (e) => {
    if (e.target === webpop || e.target.closest('[data-close]')) closeWeb();
  });
  // links that can live in a popup open there; the rest (Behance, LinkedIn…) still need a tab
  const POPPABLE = /youtube\.com\/watch|youtu\.be\/|razorpay\.com\/m\/|\.pdf($|\?)/i;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.id === 'webpop-open' || !POPPABLE.test(a.href) || a.href.includes('github.com')) return;
    e.preventDefault();
    openWeb(a.href, a.dataset.title || a.textContent.replace('↗', '').trim());
  });

  // ----- Phones: explore (with the invitation to turn sideways), or browse the work -----
  const canRotateForMe = isTouch && !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) && !!screen.orientation?.lock;
  const rotate = createRotate({
    places,
    canFullscreen: canRotateForMe,
    onLandscape: () => onEnter(),
    onPortrait: () => onEnter({ portrait: true }),
    onBrowse: () => browse.open(),
    onFullscreen: () => goLandscape(),
  });
  function explore() {
    if (browse.isOpen()) browse.close();
    // phones held upright: once a visit, show why landscape is worth it; never block the way in
    if (isTouch && isPortraitPhone()) {
      if (!rotate.seen()) return rotate.show();
      return onEnter({ portrait: true });
    }
    onEnter();
  }
  const browse = createBrowse({
    owner,
    places,
    projects,
    careers: CAREERS,
    onProject: (slug) => openProject(slug),
    onAbout: () => openAbout(undefined, { full: true }),
    onCareer: (id) => openCareer(id),
    onPlaybook: () => openPlaybook(),
    onContact: () => openAbout('contact'),
    onExplore: () => explore(),
  });

  const overlays = [
    { isOpen: () => careerEl.classList.contains('is-open'), close: closeCareer },
    { isOpen: () => playbook.classList.contains('is-open'), close: closePlaybook },
    { isOpen: aboutOpen, close: closeAbout },
    { isOpen: () => browse.isOpen(), close: () => browse.close() },
  ];
  function closeOverlays() {
    if (profileCard.isOpen()) {
      profileCard.close();
      return true;
    }
    if (moreEl.classList.contains('is-open')) {
      toggleMore(false);
      return true;
    }
    for (const o of overlays) {
      if (o.isOpen()) {
        o.close();
        return true;
      }
    }
    if (webpop.classList.contains('is-open')) {
      closeWeb();
      return true;
    }
    if (caseStudy.isOpen()) {
      caseStudy.close();
      return true;
    }
    if (journalEl.classList.contains('is-open')) {
      toggleJournal(false);
      return true;
    }
    return false;
  }
  const modalOpen = () => overlays.some((o) => o.isOpen()) || caseStudy.isOpen() || webpop.classList.contains('is-open');

  // ----- Tour -----
  $('#tour-prev').addEventListener('click', () => onTourStep(-1));
  $('#tour-next').addEventListener('click', () => onTourStep(1));
  $('#tour-exit').addEventListener('click', onExitTour);
  const setTourProgress = (f) => ($('#tour-progress').style.transform = `scaleX(${f})`);

  function setMode(m) {
    mode = m;
    document.body.dataset.mode = m;
    $('#btn-overview').classList.toggle('is-active', m === 'overview');
    $('#btn-walk').classList.toggle('is-active', m === 'walk');
    $('#btn-tour-hud').classList.toggle('is-active', m === 'tour');
    $('#btn-tour-hud').querySelector('span').textContent = m === 'tour' ? 'End tour' : 'Tour';
    if (m === 'overview') toast('<b>Bird’s-eye view.</b> Drag to orbit, scroll to zoom, click a label to fly in.', 4500);
    if (m === 'walk' && !setMode.welcomed) {
      setMode.welcomed = true;
      toast('<b>Welcome to the village.</b><br>Walk up to a billboard to open a project. Your <b>Journal</b> (<kbd>J</kbd>) holds missions, campaign briefs and the island’s secrets.', 7000);
    }
  }
  // Cards that lean towards the pointer
  document.querySelectorAll('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${x * 6}deg`);
      el.style.setProperty('--rx', `${-y * 5}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
    });
  });

  function ready() {
    document.body.classList.add('is-ready');
    document.body.dataset.mode = mode;
  }

  const api = {
    setGuide, placeLabel, showPlace, hidePlace, toast, toggleHire, toggleMissions, closeOverlays, modalOpen, setMode, setTourProgress,
    ready, openProject, openWeb, openSplash, openAbout, openJournal, toggleJournal, stepGallery, prompt, speech, thoughts, collectTrophy, visited, setClock, setTimeMode, showInfo, fade, setIndoor,
    addOverlay: (o) => overlays.push(o),
    openHome,
    openPlaybook,
    openCareer,
    onHidden: (n, total, spots = []) => {
      hidden = { n, total, spots };
      renderMissions();
    },
    attachQuest: (q) => {
      quest = q;
      renderMissions();
    },
    refreshJournal: () => journalEl.classList.contains('is-open') && renderJournal(),
    onCampaigns: (n, total) => {
      campaigns = [n, total];
      renderMissions();
    },
  };
  return api;
}
