import { createCaseStudy } from './casestudy.js';
import { sfx, audioSettings, setLevel, toggleMute, onAudioChange, startAudio } from './audio.js';
import { LEADER, LENSES, PLAYS, METHOD, PROJECTS as ALL_PROJECTS } from './data.js';
import about from './content/about.json';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createUI({ owner, pillars, places, projects, awards, contact, favourites, tools = [], awardList = [], onEnter, onTour, onOverview, onTravel, onTourStep, onExitTour, onTime, onWalk, onRide, onPromptTap, onBriefs, onHomeVisit }) {
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
    .map((p) => `<li><i style="background:${p.color}"></i><b>${esc(p.name)}</b><span>${esc(p.place)}${p.projects.length ? ` · ${p.projects.length} projects` : ""}</span></li>`)
    .join('');
  const statHtml = (list) => list.map((n) => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('');
  const impactHtml = (list) => list.map((n) => `<div class="impact__item"><b>${esc(n.value)}</b><span>${esc(n.label)}</span><p>${esc(n.text)}</p></div>`).join('');
  $('#intro-numbers').innerHTML = statHtml(owner.numbers);
  $('#intro-leader-title').textContent = LEADER.title;
  $('#intro-leader-line').textContent = LEADER.line;
  $('#intro-impact').innerHTML = impactHtml(LEADER.impact);
  $('#intro-awards').innerHTML = awards.map((a) => `<li><span>🏆</span>${esc(a.name)}<em>${esc(a.detail)}</em></li>`).join('');
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

  // The splash card doubles as the about-me card: the name chip in the HUD reopens it over the game.
  const enterBtn = $('#btn-enter');
  const enterLabel = enterBtn.textContent;
  const splashOpen = () => document.body.classList.contains('splash-open');
  function openSplash() {
    sfx('open');
    document.body.classList.add('splash-open');
    enterBtn.textContent = 'Back to the island';
  }
  function closeSplash() {
    document.body.classList.remove('splash-open');
    enterBtn.textContent = enterLabel;
  }
  enterBtn.addEventListener('click', () => (splashOpen() ? closeSplash() : onEnter()));
  $('#btn-tour').addEventListener('click', () => {
    closeSplash();
    onTour();
  });
  $('#splash-close').addEventListener('click', closeSplash);
  $('#btn-brief-intro').addEventListener('click', () => {
    if (splashOpen()) closeSplash();
    else onEnter();
    setTimeout(() => onBriefs?.(), 250);
  });
  $('.hud__brand').addEventListener('click', openSplash);
  $('#intro').addEventListener('click', (e) => {
    if (e.target.id === 'intro' && splashOpen()) closeSplash();
  });

  // ----- HUD -----
  $('#btn-overview').addEventListener('click', onOverview);
  $('#btn-map').addEventListener('click', onOverview);
  $('#btn-walk').addEventListener('click', () => onWalk?.());
  $('#btn-tour-hud').addEventListener('click', () => (mode === 'tour' ? onExitTour() : onTour()));
  $('#btn-hire').addEventListener('click', () => toggleHire(true));
  $('#btn-about').addEventListener('click', () => openSplash());
  $('#btn-contact').addEventListener('click', () => toggleHire(true, true));
  $('#btn-time').addEventListener('click', () => onTime());

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
    $('#clock-label').textContent = `${skyWord(hour)} · ${modeLabel}`;
    $('#hours').innerHTML = [0, 3, 6, 9, 12]
      .map((d, i) => {
        const hh = (h + d) % 24;
        return `<li><span>${i ? fmt(hh) : 'Now'}</span><i>${skyIcon(hh + 0.5)}</i></li>`;
      })
      .join('');
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
  });
  $('#sound-mute').addEventListener('click', () => toggleMute());
  soundEl.addEventListener('input', (e) => {
    const k = e.target.dataset?.level;
    if (k) setLevel(k, +e.target.value);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#sound, #btn-sound')) soundEl.classList.remove('is-open');
    if (!e.target.closest('#keys, #btn-keys')) document.body.classList.remove('show-keys');
  });
  $('#btn-keys').addEventListener('click', (e) => {
    e.stopPropagation();
    soundEl.classList.remove('is-open');
    document.body.classList.toggle('show-keys');
  });
  $('#missions-toggle').addEventListener('click', () => toggleMissions());
  $('#visited-dots').innerHTML = places
    .map((p, i) => `<button class="dot" data-id="${p.id}" style="--c:${p.color}" title="${i} · ${esc(p.name)}"></button>`)
    .join('');
  $('#visited-dots').addEventListener('click', (e) => {
    const id = e.target.dataset?.id;
    if (id) onTravel(id);
  });
  let campaigns = [0, 0];
  function renderMissions() {
    const rows = [
      ...(campaigns[1] ? [['Ship campaigns', campaigns[0], campaigns[1]]] : []),
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
    if (!panel.classList.contains('is-open') || panel.dataset.id !== p.id) sfx('open');
    panel.dataset.id = p.id;
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
    renderPass(p);
    panel.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <div class="card-head"><b>${{ hq: 'What I do', lab: 'What happens here', home: 'About me', fun: 'After hours' }[p.id] || 'How I work with this team'}</b></div>
      <ul>${p.how.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      ${p.makes ? `<div class="chips">${p.makes.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div>` : ''}
      ${work ? `<div class="card-head"><b>Work shipped together</b><span>${p.projects.length} ${p.projects.length === 1 ? 'project' : 'projects'}</span></div><div class="works">${work}</div>` : ''}
      ${p.id === 'fun' ? funExtra() : ''}
      ${p.id === 'home' ? `<div class="numbers">${owner.numbers.map((n) => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('')}</div><button class="btn btn--wide" data-contact>✉️ Write to Vibhor</button><button class="btn btn--wide btn--ghost" data-ride>🚲 Ride my bicycle</button>` : ''}
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
    panel.querySelector('[data-contact]')?.addEventListener('click', () => toggleHire(true, true));
    panel.querySelector('[data-ride]')?.addEventListener('click', () => {
      hidePlace();
      onRide?.();
    });
    panel.querySelectorAll('[data-project]').forEach((b) => b.addEventListener('click', () => openProject(b.dataset.project)));
    panel.scrollTop = 0;
    panel.classList.add('is-open');
    markVisited(p.id);
  }
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
      body = `<p class="eyebrow">AI Hub · The stack</p><h2>Tools the studio builds with</h2>
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
    panel.innerHTML = `<button class="close" aria-label="Close">×</button>${body}`;
    panel.querySelector('.close').onclick = () => hidePlace();
    panel.scrollTop = 0;
    panel.classList.add('is-open');
  }

  // Fade to black and back, for doors.
  const fader = $('#fader');
  let fading = false;
  function fade(cb) {
    if (fading) return;
    fading = true;
    fader.classList.add('is-on');
    setTimeout(() => {
      cb();
      setTimeout(() => {
        fader.classList.remove('is-on');
        fading = false;
      }, 120);
    }, 380);
  }
  const indoorEl = $('#indoor');
  function setIndoor(place) {
    document.body.classList.toggle('is-indoor', !!place);
    if (!place) {
      $('#map-title').textContent = 'Vibhor’s island';
      $('#map-sub').textContent = 'Exploring';
    }
    if (place) {
      indoorEl.style.setProperty('--c', place.color);
      indoorEl.innerHTML = `<i></i><span>Inside</span><b>${esc(place.name)}</b><em>Walk out the door or press <kbd>Esc</kbd> to leave</em>`;
      $('#map-title').textContent = place.name;
      $('#map-sub').textContent = 'Inside · floor plan';
      toast(`<b>Welcome to ${esc(place.name)}.</b> Walk around and press <kbd>E</kbd> near anything that glows.`, 4500);
    }
  }

  // The place "pass": a ticket with the department's name, numbers and a colour stub
  const passEl = $('#pass');
  const GLYPH = { hq: '🌳', brand: '🎬', pmm: '🚀', product: '🧩', social: '📣', copy: '✍️', design: '🎨', lab: '🌙', fun: '🍿', home: '🏡', ai: '🤖', awards: '🏆' };
  function renderPass(p) {
    const kind = { hq: 'Island pass', home: 'Home pass', fun: 'Playhouse pass', lab: 'Studio pass', ai: 'Hub pass', awards: 'Hall pass' }[p.id] || 'Department pass';
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

  function hidePlace() {
    if (panel.classList.contains('is-open')) sfx('close');
    hidePass();
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
    sfx('trophy');
    renderMissions();
    toast(`<b>🏆 Trophy found! ${trophies.size}/${awards.length}</b><br>${esc(award.name)}: ${esc(award.detail)}`, 6500);
    if (trophies.size === awards.length) setTimeout(() => toast('<b>All trophies found.</b><br>The work wins rooms. <a href="#" data-hire-link>Hire me →</a>', 8000), 6800);
  }

  // ----- Toast -----
  const toastEl = $('#toast');
  let toastTimer = 0;
  function toast(html, ms = 4000, { quiet = false } = {}) {
    if (!quiet) sfx('toast');
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
  // ----- Home: the about-me postcard -----
  const homepop = $('#homepop');
  const md = (t) => esc(t).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  $('#home-headline').innerHTML = md(about.headline);
  $('#home-intro').innerHTML = about.intro.map((p) => `<p>${md(p)}</p>`).join('');
  $('#home-numbers').innerHTML = statHtml(owner.numbers);
  $('#home-path').innerHTML = about.timeline.items.map((i) => `<li><span>${esc(i.years)}</span><b>${esc(i.org)}</b><em>${esc(i.role)}</em><p>${esc(i.note)}</p></li>`).join('');
  $('#home-notes').innerHTML = about.leadership.items.map((i, k) => `<div><span>${String(k + 1).padStart(2, '0')}</span><b>${esc(i.title)}</b><p>${esc(i.body)}</p></div>`).join('');
  $('#home-after').textContent = about.studio.body.split('\n')[0];
  function openHome() {
    if (homepop.classList.contains('is-open')) return;
    homepop.classList.add('is-open');
    homepop.querySelector('.sheet').scrollTop = 0;
    sfx('open');
  }
  function closeHome() {
    if (!homepop.classList.contains('is-open')) return;
    homepop.classList.remove('is-open');
    sfx('close');
  }
  homepop.addEventListener('click', (e) => {
    if (e.target === homepop || e.target.closest('[data-close]')) closeHome();
    else if (e.target.closest('[data-home-visit]')) {
      closeHome();
      onHomeVisit?.();
    } else if (e.target.closest('[data-home-ride]')) {
      closeHome();
      onRide?.();
    } else if (e.target.closest('[data-home-write]')) {
      closeHome();
      toggleHire(true, true);
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

  $('#hire-for').textContent = owner.hireFor;
  $('#hire-results').innerHTML = owner.results.map((r) => `<button class="result" data-slug="${r.slug}"><b>${esc(r.value)}</b><span>${esc(r.label)}</span></button>`).join('');
  $('#hire-results').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slug]');
    if (b) {
      toggleHire(false);
      openProject(b.dataset.slug);
    }
  });
  $('#hire-leader-line').textContent = LEADER.line;
  $('#hire-impact').innerHTML = impactHtml(LEADER.impact);
  $('#hire-lenses').innerHTML = LENSES.map((l) => `<div style="--l:${l.color}"><b>${l.icon} ${esc(l.name)}</b><span>${esc(l.ask)}</span></div>`).join('');
  $('#hire-people').innerHTML = LEADER.people.map((t) => `<li>${esc(t)}</li>`).join('');
  $('#hire-quote').innerHTML = `“${esc(LEADER.quote.text)}”<cite>${esc(LEADER.quote.who)}</cite>`;
  hire.querySelector('[data-playbook]').addEventListener('click', () => {
    toggleHire(false);
    openPlaybook();
  });
  $('#hire-gallery').innerHTML = owner.gallery.map((g) => `<figure><img src="${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy" /><figcaption>${esc(g.caption)}</figcaption></figure>`).join('');
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
  function toggleHire(force, focusForm = false) {
    const was = hire.classList.contains('is-open');
    hire.classList.toggle('is-open', force ?? !was);
    if (was !== hire.classList.contains('is-open')) sfx(was ? 'close' : 'open');
    if (focusForm && hire.classList.contains('is-open')) {
      setTimeout(() => {
        $('#contact-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        $('#cf-name').focus({ preventScroll: true });
      }, 250);
    }
  }
  // Contact form: posts to a form endpoint if configured, otherwise composes an email.
  $('#cf-intent').innerHTML = contact.intents.map((i) => `<option>${esc(i)}</option>`).join('');
  $('#contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const data = { name: f.name.value.trim(), email: f.email.value.trim(), intent: f.intent.value, message: f.message.value.trim() };
    const status = $('#cf-status');
    if (contact.endpoint) {
      status.textContent = 'Sending…';
      try {
        const res = await fetch(contact.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error(res.status);
        status.textContent = 'Sent! Vibhor will get back to you soon.';
        f.reset();
        toast('<b>✉️ Message sent.</b> Thanks for writing!', 4000);
        return;
      } catch {
        status.textContent = 'Could not send from here, opening your email app instead.';
      }
    }
    const subject = `${data.intent} · from ${data.name || 'the village'}`;
    const body = `${data.message}\n\n${data.name}${data.email ? ` (${data.email})` : ''}`;
    location.href = `mailto:${owner.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app should open with the message ready to send.';
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

  const overlays = [
    { isOpen: () => playbook.classList.contains('is-open'), close: closePlaybook },
    { isOpen: () => homepop.classList.contains('is-open'), close: closeHome },
  ];
  function closeOverlays() {
    for (const o of overlays) {
      if (o.isOpen()) {
        o.close();
        return true;
      }
    }
    if (splashOpen()) {
      closeSplash();
      return true;
    }
    if (webpop.classList.contains('is-open')) {
      closeWeb();
      return true;
    }
    if (caseStudy.isOpen()) {
      caseStudy.close();
      return true;
    }
    for (const el of [hire]) {
      if (el.classList.contains('is-open')) {
        el.classList.remove('is-open');
        return true;
      }
    }
    return false;
  }
  const modalOpen = () => overlays.some((o) => o.isOpen()) || splashOpen() || caseStudy.isOpen() || hire.classList.contains('is-open') || webpop.classList.contains('is-open');

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
    $('#btn-tour-hud').querySelector('span').textContent = m === 'tour' ? 'Exit tour' : 'Tour';
    if (m === 'overview') toast('<b>Bird’s-eye view.</b> Drag to orbit, scroll to zoom, click a label to fly in.', 4500);
    if (m === 'walk' && !setMode.welcomed) {
      setMode.welcomed = true;
      toast('<b>Welcome to the village.</b><br>Walk up to a billboard to open a project, or pick up a brief from the board under the jamun tree (<kbd>J</kbd>) and carry it across the teams.', 7000);
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
    placeLabel, showPlace, hidePlace, toast, toggleHire, toggleMissions, closeOverlays, modalOpen, setMode, setTourProgress,
    ready, openProject, openWeb, openSplash, stepGallery, prompt, speech, thoughts, collectTrophy, visited, setClock, setTimeMode, showInfo, fade, setIndoor,
    addOverlay: (o) => overlays.push(o),
    openHome,
    openPlaybook,
    onCampaigns: (n, total) => {
      campaigns = [n, total];
      renderMissions();
    },
  };
  return api;
}
