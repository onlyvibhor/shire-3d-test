// Run a campaign: take a brief from the board under the jamun tree, then carry it through every
// team it really went through. A beacon marks the next team, an arrow at the edge of the screen
// points the way, and each stop tells what happened there. The last stop ships the campaign and
// shows how it did on the four lenses: make it work, convert, leave an impression, shape the brand.
import * as THREE from 'three';
import { sfx } from './audio.js';
import { CAMPAIGNS, PLAYS, LENSES, PROJECTS } from './data.js';
import { CAMPAIGN_COLORS } from './story.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const $ = (s) => document.querySelector(s);
const STORE = 'shire-campaigns';

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORE) || '[]'));
  } catch {
    return new Set();
  }
}
function save(set) {
  try {
    localStorage.setItem(STORE, JSON.stringify([...set]));
  } catch {
    // private mode: progress lasts for this visit only
  }
}

function makeBeacon() {
  const g = new THREE.Group();
  // a tall column of light, brightest at the base
  const colGeo = new THREE.CylinderGeometry(1.1, 1.6, 46, 24, 1, true);
  colGeo.translate(0, 23, 0);
  const colMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color('#ffffff') }, uTime: { value: 0 } },
    vertexShader: 'varying float vY; void main(){ vY = position.y / 46.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader:
      'uniform vec3 uColor; uniform float uTime; varying float vY; void main(){ float a = pow(1.0 - vY, 2.2) * 0.55 + 0.06 * sin(vY * 40.0 - uTime * 4.0) * (1.0 - vY); gl_FragColor = vec4(uColor, max(a, 0.0)); }',
  });
  const col = new THREE.Mesh(colGeo, colMat);
  col.frustumCulled = false;
  g.add(col);
  // a ring that pulses on the ground
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.8, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.15;
  g.add(ring);
  // the brief itself, a folder turning in the air
  const folder = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 0.06), new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: 0.6, emissive: '#fff4dc', emissiveIntensity: 0.35 }));
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.22, 0.08), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
  band.position.y = 0.3;
  folder.add(paper, band);
  folder.position.y = 7;
  g.add(folder);
  g.visible = false;
  return { g, colMat, ringMat, ring, folder, band };
}

export function createQuest({ scene, places, ui, camera, groundAt, travelTo, openProject, openWeb }) {
  const shipped = load();
  const beacon = makeBeacon();
  scene.add(beacon.g);
  const P = (id) => places.find((p) => p.id === id);
  let active = null; // { cp, i }
  let card = null; // the stop card currently shown
  let readyAt = 0; // stops wait a moment after the last card, in real seconds
  let clock = 0;

  // ---------- DOM ----------
  const tracker = document.createElement('section');
  tracker.id = 'quest';
  tracker.setAttribute('aria-live', 'polite');
  document.body.appendChild(tracker);
  const arrow = document.createElement('div');
  arrow.id = 'quest-arrow';
  arrow.innerHTML = '<i></i><span></span>';
  document.body.appendChild(arrow);
  const stage = document.createElement('section');
  stage.id = 'stage';
  stage.setAttribute('role', 'dialog');
  document.body.appendChild(stage);
  // The briefs live in the Journal (ui.js): this module keeps the campaign state and hands the
  // Journal what it needs to list them.
  function briefs() {
    return CAMPAIGNS.map((cp) => {
      const pr = PROJECTS[cp.slug];
      return {
        id: cp.id,
        title: cp.title,
        brief: cp.brief,
        client: pr.client,
        year: pr.year,
        color: CAMPAIGN_COLORS[cp.id],
        stops: cp.stops.length,
        route: [...new Set(cp.stops.map((s) => P(s.place).name))],
        done: shipped.has(cp.id),
        active: active?.cp.id === cp.id,
        step: active?.cp.id === cp.id ? active.i : 0,
      };
    });
  }
  function openChooser() {
    ui.openJournal?.('campaigns');
  }
  function closeChooser() {}

  function renderTracker() {
    if (!active) {
      tracker.classList.remove('is-open');
      document.body.classList.remove('quest-on');
      return;
    }
    const { cp, i } = active;
    const stop = cp.stops[i];
    const place = P(stop.place);
    tracker.style.setProperty('--c', CAMPAIGN_COLORS[cp.id]);
    tracker.innerHTML = `
      <div class="quest__top"><span>Campaign · ${esc(cp.title)}</span><button data-drop aria-label="Drop the brief" title="Drop the brief">×</button></div>
      <p class="quest__next"><b>${esc(stop.title)}</b> <span>at ${esc(place.name)}</span> <em id="quest-dist"></em></p>
      <ol class="quest__steps">${cp.stops.map((_, k) => `<li class="${k < i ? 'is-done' : k === i ? 'is-now' : ''}"></li>`).join('')}</ol>
      <button class="quest__go" data-go>Take me there</button>`;
    tracker.querySelector('[data-drop]').onclick = () => cancel();
    tracker.querySelector('[data-go]').onclick = () => travelTo(stop.place);
    tracker.classList.add('is-open');
    document.body.classList.add('quest-on');
    // the beacon moves to the next team
    const col = new THREE.Color(place.color);
    beacon.colMat.uniforms.uColor.value.copy(col);
    beacon.ringMat.color.copy(col);
    beacon.band.material.color.copy(col);
    beacon.g.position.set(place.x, groundAt(place.x, place.z), place.z);
  }

  function start(id) {
    const cp = CAMPAIGNS.find((c) => c.id === id);
    if (!cp) return;
    active = { cp, i: 0 };
    hideStage();
    sfx('stamp');
    ui.toast(`<b>📁 Brief taken: ${esc(cp.title)}.</b><br>Follow the light to ${esc(P(cp.stops[0].place).name)}.`, 4500, { priority: 2 });
    renderTracker();
    ui.refreshJournal?.();
    readyAt = clock + 1.2;
  }
  function cancel() {
    if (!active) return;
    active = null;
    hideStage();
    renderTracker();
    beacon.g.visible = false;
    arrow.classList.remove('is-open');
    ui.refreshJournal?.();
    ui.toast('<b>Brief dropped.</b> Pick another from your Journal, or the board under the jamun tree.', 3000, { quiet: true });
  }

  // ---------- stop cards ----------
  function hideStage() {
    stage.classList.remove('is-open', 'is-final');
    card = null;
  }
  function showStop(cp, i) {
    const stop = cp.stops[i];
    const place = P(stop.place);
    const last = i === cp.stops.length - 1;
    card = { cp, i };
    stage.style.setProperty('--c', place.color);
    stage.innerHTML = `
      <div class="stage__stamp">${i + 1}/${cp.stops.length}</div>
      <p class="eyebrow">${esc(cp.title)} · ${esc(place.name)}</p>
      <h3>${esc(stop.title)}</h3>
      <p>${esc(stop.text)}</p>
      <div class="stage__actions"><button class="btn" data-next>${last ? 'Ship the campaign' : 'Next stop →'}</button><button class="btn btn--ghost" data-case>Case study</button></div>`;
    stage.querySelector('[data-next]').onclick = () => advance();
    stage.querySelector('[data-case]').onclick = () => openProject(cp.slug);
    stage.classList.add('is-open');
    sfx('stamp');
  }
  function advance() {
    if (!card) return;
    const { cp, i } = card;
    hideStage();
    if (i >= cp.stops.length - 1) return finish(cp);
    active = { cp, i: i + 1 };
    renderTracker();
    const next = cp.stops[i + 1];
    // a stop in the same place opens straight away; otherwise the beacon moves on
    readyAt = clock + (next.place === cp.stops[i].place ? 0.35 : 1.0);
  }
  function finish(cp) {
    active = null;
    shipped.add(cp.id);
    save(shipped);
    renderTracker();
    beacon.g.visible = false;
    arrow.classList.remove('is-open');
    const play = PLAYS[cp.slug] || {};
    const pr = PROJECTS[cp.slug];
    stage.style.setProperty('--c', CAMPAIGN_COLORS[cp.id]);
    stage.classList.add('is-final');
    stage.innerHTML = `
      <button class="close" data-close aria-label="Close">×</button>
      <div class="stage__shipped">Shipped</div>
      <p class="eyebrow">${esc(pr.client)} · ${esc(pr.year)}</p>
      <h3>${esc(cp.title)}</h3>
      <p class="stage__idea">${esc(play.idea || pr.tagline)}</p>
      <div class="lenses">${LENSES.map((l) => (play.lenses?.[l.id] ? `<div style="--l:${l.color}"><span>${l.icon} ${esc(l.name)}</span><p>${esc(play.lenses[l.id])}</p></div>` : '')).join('')}</div>
      <div class="stage__actions">
        <button class="btn" data-case>Open the case study</button>
        ${pr.play ? `<button class="btn btn--ghost" data-play>${esc(pr.play.label)}</button>` : ''}
        <button class="btn btn--ghost" data-more>${shipped.size < CAMPAIGNS.length ? 'Next brief' : 'All briefs'}</button>
      </div>
      <p class="stage__count">${shipped.size}/${CAMPAIGNS.length} campaigns shipped</p>`;
    stage.querySelector('[data-close]').onclick = () => closeFinal();
    stage.querySelector('[data-case]').onclick = () => {
      closeFinal();
      openProject(cp.slug);
    };
    stage.querySelector('[data-play]')?.addEventListener('click', () => openWeb(pr.play.url, pr.play.label));
    stage.querySelector('[data-more]').onclick = () => {
      closeFinal();
      openChooser();
    };
    stage.classList.add('is-open');
    sfx('trophy');
    ui.onCampaigns?.(shipped.size, CAMPAIGNS.length);
    if (shipped.size === CAMPAIGNS.length) setTimeout(() => ui.toast('<b>Every brief shipped.</b><br>One studio, every team, one story. <a href="#" data-hire-link>Let’s work together →</a>', 9000, { priority: 2, kind: 'reward' }), 1200);
  }
  function closeFinal() {
    stage.classList.remove('is-open', 'is-final');
  }

  // ---------- per frame ----------
  const v = new THREE.Vector3();
  function update(t, dt, { pos, indoorId, mode, blocked }) {
    clock = t;
    beacon.colMat.uniforms.uTime.value = t;
    if (!active) return;
    const stop = active.cp.stops[active.i];
    const place = P(stop.place);
    beacon.g.visible = !indoorId;
    const s = 1 + ((t * 0.8) % 1) * 0.6;
    beacon.ring.scale.setScalar(s);
    beacon.ringMat.opacity = 0.8 * (1 - ((t * 0.8) % 1));
    beacon.folder.rotation.y = t * 1.4;
    beacon.folder.position.y = 7 + Math.sin(t * 2) * 0.35;
    const d = Math.hypot(pos.x - place.x, pos.z - place.z);
    // domed buildings are big: arriving at the door counts. Hamlets and the Lab need you in the square.
    const reach = { lab: 9.5, ai: 24, awards: 24, fun: 24, home: 22 }[place.id] || Math.min(16, place.reach * 0.8);
    const there = indoorId ? indoorId === place.id : d < reach;
    const distEl = document.getElementById('quest-dist');
    if (distEl) distEl.textContent = there ? 'You’re here' : indoorId ? 'Head outside' : `${Math.round(d)} m`;
    if (there && !card && t >= readyAt && mode === 'walk' && !blocked) showStop(active.cp, active.i);
    // the arrow: over the beacon when it's on screen, pinned to the edge when it isn't
    if (mode === 'intro' || indoorId || there) {
      arrow.classList.remove('is-open');
      return;
    }
    v.set(place.x, groundAt(place.x, place.z) + 9, place.z).project(camera);
    let sx = v.x;
    let sy = v.y;
    const behind = v.z > 1;
    if (behind) {
      sx = -sx;
      sy = -sy;
    }
    const onScreen = !behind && Math.abs(sx) < 0.88 && Math.abs(sy) < 0.8;
    if (!onScreen) {
      const m = Math.max(Math.abs(sx) / 0.88, Math.abs(sy) / 0.8, 1e-3);
      sx /= m;
      sy /= m;
      if (behind && Math.abs(sx) < 0.2 && Math.abs(sy) < 0.2) sy = -0.8;
    }
    const W = window.innerWidth;
    const H = window.innerHeight;
    arrow.style.transform = `translate(${(sx * 0.5 + 0.5) * W}px, ${(-sy * 0.5 + 0.5) * H}px) translate(-50%, -50%)`;
    arrow.style.setProperty('--rot', onScreen ? '90deg' : `${Math.atan2(-sy, sx)}rad`);
    arrow.style.setProperty('--c', place.color);
    arrow.querySelector('span').textContent = `${Math.round(d)} m`;
    arrow.classList.toggle('is-edge', !onScreen);
    arrow.classList.add('is-open');
  }

  return {
    update,
    openChooser,
    closeChooser,
    start,
    cancel,
    isOpen: () => false,
    briefs,
    activeId: () => active?.cp.id || null,
    shipped: () => shipped.size,
    total: CAMPAIGNS.length,
  };
}
