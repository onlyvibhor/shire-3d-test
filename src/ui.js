import { createCaseStudy } from './casestudy.js';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createUI({ owner, pillars, places, projects, awards, contact, favourites, tools = [], awardList = [], onEnter, onTour, onOverview, onTravel, onTourStep, onExitTour, onTime }) {
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
  $('#intro-awards').innerHTML = awards.map((a) => `<li><span>🏆</span>${esc(a.name)}<em>${esc(a.detail)}</em></li>`).join('');
  $('#btn-enter').addEventListener('click', onEnter);
  $('#btn-tour').addEventListener('click', onTour);

  // ----- HUD -----
  $('#btn-overview').addEventListener('click', onOverview);
  $('#btn-tour-hud').addEventListener('click', () => (mode === 'tour' ? onExitTour() : onTour()));
  $('#btn-hire').addEventListener('click', () => toggleHire(true));
  $('#btn-time').addEventListener('click', () => onTime());
  const clockEl = $('#btn-time b');
  let clockText = '';
  const setClock = (t) => {
    if (t !== clockText) clockEl.textContent = clockText = t;
  };
  const setTimeMode = (m) => {
    $('#btn-time span').textContent = `${m.icon} ${m.label}`;
    toast(`<b>${m.icon} ${m.label}</b> ${m.id === 'auto' ? 'A full day passes every 8 minutes.' : 'Time of day locked.'} Press <kbd>L</kbd> to change.`, 3000);
  };
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
      <p class="eyebrow">${{ hq: 'Home base', home: 'Home', fun: 'Hobbies', lab: 'Studio' }[p.id] || 'Department'} · ${esc(p.place)}</p>
      <h2>${esc(p.name)}</h2>
      <p class="lead">${esc(p.lead)}</p>
      <h3>${{ hq: 'What I do', lab: 'What happens here', home: 'About me', fun: 'After hours' }[p.id] || 'How I work with this team'}</h3>
      <ul>${p.how.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      ${p.makes ? `<div class="chips">${p.makes.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div>` : ''}
      ${work ? `<h3>Work shipped together</h3><div class="works">${work}</div>` : ''}
      ${p.id === 'fun' ? funExtra() : ''}
      ${p.id === 'home' ? `<div class="numbers">${owner.numbers.map((n) => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('')}</div><button class="btn btn--wide" data-contact>✉️ Write to Vibhor</button>` : ''}
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
    if (place) {
      indoorEl.style.setProperty('--c', place.color);
      indoorEl.innerHTML = `<i></i><span>Inside</span><b>${esc(place.name)}</b><em>Walk out the door or press <kbd>Esc</kbd> to leave</em>`;
      toast(`<b>Welcome to ${esc(place.name)}.</b> Walk around and press <kbd>E</kbd> near anything that glows.`, 4500);
    }
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
      promptEl.innerHTML = `<kbd>E</kbd><span>${esc(thing.verb)}</span><b>${esc(thing.label)}</b>`;
    }
    promptEl.classList.add('is-open');
  }
  promptEl.addEventListener('click', () => {
    const a = promptAction;
    if (!a) return;
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
  $('#hire-for').textContent = owner.hireFor;
  $('#hire-results').innerHTML = owner.results.map((r) => `<button class="result" data-slug="${r.slug}"><b>${esc(r.value)}</b><span>${esc(r.label)}</span></button>`).join('');
  $('#hire-results').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slug]');
    if (b) {
      toggleHire(false);
      openProject(b.dataset.slug);
    }
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
    hire.classList.toggle('is-open', force ?? !hire.classList.contains('is-open'));
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

  function closeOverlays() {
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
  const modalOpen = () => caseStudy.isOpen() || hire.classList.contains('is-open') || webpop.classList.contains('is-open');

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

  return {
    placeLabel, showPlace, hidePlace, toast, toggleHire, toggleMissions, closeOverlays, modalOpen, setMode, setTourProgress,
    ready, openProject, openWeb, stepGallery, prompt, speech, thoughts, collectTrophy, visited, setClock, setTimeMode, showInfo, fade, setIndoor,
  };
}
