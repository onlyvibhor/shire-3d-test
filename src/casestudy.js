// Full-screen case studies, rendered from the portfolio repo's own content JSON
// and styled after its case page (big type, mono labels, generous spacing).
import toolkit from './content/toolkit.json';
import mentorship from './content/mentorship.json';

const projectFiles = import.meta.glob('./content/projects/*.json', { eager: true, import: 'default' });
const expFiles = import.meta.glob('./content/experiments/*.json', { eager: true, import: 'default' });
const REPO = {};
for (const d of [...Object.values(projectFiles), ...Object.values(expFiles)]) REPO[d.slug] = d;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
function md(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*[-*] /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*] /, ''))}</li>`).join('')}</ul>`;
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    })
    .join('');
}
const pad2 = (n) => String(n).padStart(2, '0');

// Synthesised case studies for entries that only exist on the toolkit / mentorship pages.
function toolCase(tool, extra = {}) {
  return {
    title: tool.name,
    title_lines: tool.name,
    client: 'Razorpay Communication Design',
    role: 'Built with the studio',
    year: '2025–26',
    category: tool.tag,
    tagline: tool.body,
    cover: { image: tool.hero },
    sections: [
      { type: 'steps', label: 'What it does', title: tool.tag, items: tool.bullets.map((b) => ({ title: b, body: '' })) },
      { type: 'tools', label: 'Built with', items: [tool.built_with] },
      { type: 'image_grid', columns: 2, images: tool.gallery.map((image) => ({ image })) },
    ],
    ...extra,
  };
}

const SYNTH = {
  toolkit: () => ({
    title: 'The Studio AI Toolkit',
    title_lines: 'Studio\nAI Toolkit',
    client: 'Razorpay design team',
    role: 'Built with the team',
    year: '2025–26',
    category: 'In-house AI tools',
    tagline: toolkit.headline,
    cover: { image: toolkit.tools[0].hero },
    sections: [
      { type: 'text', label: 'The idea', title: 'AI is not only a way to make images.', body: toolkit.intro },
      { type: 'steps', label: 'Principles', title: 'How the tools are built.', items: toolkit.principles },
      ...toolkit.tools.flatMap((t) => [
        { type: 'text', label: t.tag, title: t.name, body: `${t.body}\n\n${t.bullets.map((b) => `- ${b}`).join('\n')}\n\n*Built with ${t.built_with}.*` },
        { type: 'image_grid', columns: 2, images: [{ image: t.hero }, ...t.gallery.slice(0, 3).map((image) => ({ image }))] },
      ]),
      { type: 'steps', label: 'What it changed', title: 'Four things the toolkit unlocked.', items: toolkit.pillars.map((p) => ({ title: p.title, body: p.body })) },
    ],
    links: [{ label: 'Behance', url: 'https://www.behance.net/onlyvibhor' }],
  }),
  'social-gen': () => toolCase(toolkit.tools.find((t) => t.name === 'Social Content Gen'), {
    metrics: [{ value: '200+', label: 'campaign-ready posts for the T20 campaign' }],
  }),
  razorbae: () => ({
    title: 'Razorbae, the AI avatar',
    title_lines: 'Razorbae',
    client: 'Razorpay social',
    role: 'Creative system',
    year: '2025',
    category: 'AI avatar · Reels',
    tagline: 'Shot once. *Trained into a system.*',
    metrics: [{ value: '129', label: 'reels' }, { value: '6.55M', label: 'views' }],
    sections: [
      { type: 'text', label: 'The idea', title: 'A brand avatar that never needs a reshoot.', body: 'A presenter captured once, then trained into a repeatable system, so the social team can publish always-on reels without booking a shoot every week.' },
      { type: 'image', image: 'assets/img/tools/social-posts.jpg', caption: 'The same pipeline thinking powers the studio’s social tools', size: 'wide' },
    ],
  }),
  mentor: () => ({
    title: 'Mentoring & Workshops',
    title_lines: 'Mentoring\n& Workshops',
    client: 'ADPList, GrowthSchool, Designland',
    role: 'Mentor',
    year: '2023–26',
    category: 'Teaching',
    tagline: mentorship.headline,
    cover: { image: 'assets/img/mentor/room.jpg' },
    metrics: mentorship.numbers,
    sections: [
      { type: 'text', label: mentorship.oneonone.label, title: mentorship.oneonone.title, body: mentorship.oneonone.body },
      { type: 'tools', label: 'Topics', items: mentorship.oneonone.topics },
      ...mentorship.voices.items.map((v) => ({ type: 'quote', text: v.text, who: v.who })),
      { type: 'steps', label: mentorship.events.label, title: mentorship.events.title, items: mentorship.events.items.map((e) => ({ title: e.title, body: [e.host, e.type, e.date].filter(Boolean).join(' · ') + '. ' + e.detail })) },
      { type: 'image_grid', columns: 3, images: mentorship.events.items.slice(0, 6).map((e) => ({ image: e.image, caption: e.host })) },
    ],
    links: [{ label: 'Book a session on ADPList', url: 'https://adplist.org/mentors/vibhor-mathur' }],
  }),
};

function videoHTML(b) {
  const url = b.url || '';
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  let inner = '';
  if (yt) {
    inner = `<div class="cs-vbox" data-embed="https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1">
      <img src="https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg" alt="" loading="lazy" />
      <button class="cs-play" type="button" aria-label="Play video"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg></button></div>`;
  } else if (url) {
    inner = `<div class="cs-vbox"><video src="${esc(url)}" muted loop playsinline autoplay preload="metadata"></video></div>`;
  }
  return `<figure class="cs-blk cs-video">${inner}${b.caption ? `<figcaption class="cs-cap">${esc(b.caption)}</figcaption>` : ''}</figure>`;
}

function block(b) {
  switch (b.type) {
    case 'text':
      return `<section class="cs-blk"><div class="cs-row"><h4>${esc(b.label)}</h4><div>${b.title ? `<h3>${inline(b.title)}</h3>` : ''}${b.body ? `<div class="cs-prose">${md(b.body)}</div>` : ''}</div></div></section>`;
    case 'statement':
      return `<section class="cs-blk"><p class="cs-stmt">${inline(b.text)}</p></section>`;
    case 'image':
      return `<figure class="cs-blk cs-img size-${esc(b.size || 'wide')}"><img src="${esc(b.image)}" alt="${esc(b.caption || '')}" loading="lazy" />${b.caption ? `<figcaption class="cs-cap">${esc(b.caption)}</figcaption>` : ''}</figure>`;
    case 'image_grid':
      return `<section class="cs-blk"><div class="cs-grid" style="--cols:${parseInt(b.columns, 10) || 2}">${(b.images || []).map((im) => `<figure><img src="${esc(im.image)}" alt="${esc(im.caption || '')}" loading="lazy" />${im.caption ? `<figcaption class="cs-cap">${esc(im.caption)}</figcaption>` : ''}</figure>`).join('')}</div></section>`;
    case 'video':
      return videoHTML(b);
    case 'clips':
      return `<section class="cs-blk"><div class="cs-grid" style="--cols:${parseInt(b.columns, 10) || 2}">${(b.clips || []).map((c) => `<figure><div class="cs-vbox"><video src="${esc(c.video)}" muted loop playsinline autoplay preload="metadata"></video></div>${c.caption ? `<figcaption class="cs-cap">${esc(c.caption)}</figcaption>` : ''}</figure>`).join('')}</div></section>`;
    case 'steps':
      return `<section class="cs-blk"><div class="cs-row"><h4>${esc(b.label)}</h4><div>${b.title ? `<h3>${inline(b.title)}</h3>` : ''}</div></div><div class="cs-steps">${(b.items || []).map((s, i) => `<div class="cs-step"><div><span class="n">${pad2(i + 1)}</span><h5>${esc(s.title)}</h5></div><div>${s.body ? `<p>${inline(s.body)}</p>` : ''}${s.tools ? `<p class="tl">${esc(s.tools)}</p>` : ''}</div></div>`).join('')}</div></section>`;
    case 'tools':
      return `<section class="cs-blk"><div class="cs-row"><h4>${esc(b.label || 'Stack')}</h4><div class="cs-chips">${(b.items || []).map((t) => `<span>${esc(typeof t === 'string' ? t : t.tool || t.name)}</span>`).join('')}</div></div></section>`;
    case 'metrics':
      return `<section class="cs-blk"><div class="cs-row"><h4>${esc(b.label)}</h4><div class="cs-metrics">${(b.items || []).map((m) => `<div><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('')}</div></div></section>`;
    case 'quote':
      return `<section class="cs-blk"><q class="cs-quote">${inline(b.text)}</q>${b.who ? `<p class="cs-who">${esc(b.who)}</p>` : ''}</section>`;
    default:
      return '';
  }
}

export function createCaseStudy({ projects, places, onOpen }) {
  const root = document.getElementById('case');
  const order = places.flatMap((p) => p.projects);

  function resolve(slug) {
    const meta = projects[slug];
    if (!meta) return null;
    if (SYNTH[slug]) return SYNTH[slug]();
    const repo = REPO[meta.repo || slug];
    if (repo) return repo;
    return { title: meta.title, client: meta.client, year: meta.year, role: meta.role, tagline: meta.tagline, cover: { image: meta.images[0] }, sections: [{ type: 'text', label: 'Summary', body: meta.summary }] };
  }

  function open(slug) {
    const p = resolve(slug);
    const meta = projects[slug];
    if (!p) return;
    const place = places.find((q) => q.projects.includes(slug));
    const color = place?.color || '#2d5bff';
    const isExp = !!REPO[meta.repo || slug]?.medium;
    const lines = String(p.title_lines || p.title).split('\n');
    const metaRows = isExp
      ? [['Medium', (p.medium || []).join(', ')], ['Tools', p.tools], ['Year', p.year], ['Type', 'Experiment']]
      : [['Client', p.client], ['Role', p.role], ['Year', p.year], ['Type', p.category]];
    const metrics = (p.metrics || []).length
      ? `<div class="cs-metrics cs-metrics--top">${p.metrics.map((m) => `<div><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('')}</div>`
      : '';
    const list = (title, rows) => (rows.length ? `<div><h4>${title}</h4><ul>${rows.join('')}</ul></div>` : '');
    const team = list('Team', (p.team || []).map((t) => `<li><span>${esc(t.name)}</span><span>${esc(t.role)}</span></li>`));
    const awards = list('Recognition', (p.awards || []).map((a) => `<li><span>${esc(a.title)}</span><span>${esc(a.detail)}</span></li>`));
    const links = list('Links', (p.links || []).map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener"><span>${esc(l.label)}</span><span aria-hidden="true">↗</span></a></li>`));
    const idx = order.indexOf(slug);
    const nextSlug = order[(idx + 1) % order.length];
    const cover = p.cover?.image || meta.images[0];

    root.style.setProperty('--accent', color);
    root.innerHTML = `
      <div class="cs-bar">
        <span class="cs-crumb"><i style="background:${color}"></i>${esc(place?.name || '')} · ${esc(place?.place || '')}</span>
        <button class="cs-close" data-close>Back to the village <kbd>Esc</kbd></button>
      </div>
      <article class="cs">
        <section class="cs-hero">
          <h1>${lines.map((t) => `<span>${esc(t)}</span>`).join('')}</h1>
          <div class="cs-meta">${metaRows.filter((m) => m[1]).map((m) => `<div><span>${m[0]}</span>${esc(m[1])}</div>`).join('')}</div>
        </section>
        ${cover ? `<div class="cs-cover"><img src="${esc(cover)}" alt="${esc(p.title)}" /></div>` : ''}
        ${p.tagline ? `<p class="cs-hook">${inline(p.tagline)}</p>` : ''}
        ${metrics}
        ${(p.sections || []).filter((b) => !(b.type === 'image' && b.image === cover)).map(block).join('')}
        ${team || awards || links ? `<section class="cs-end">${team}${awards}${links}</section>` : ''}
        <button class="cs-next" data-next="${nextSlug}"><span>Next project</span><b>${esc(projects[nextSlug].title)}</b></button>
      </article>`;
    root.querySelectorAll('.cs-vbox[data-embed]').forEach((box) =>
      box.querySelector('.cs-play').addEventListener('click', () => {
        const f = document.createElement('iframe');
        f.src = box.dataset.embed;
        f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
        f.allowFullscreen = true;
        f.title = 'Video player';
        box.innerHTML = '';
        box.appendChild(f);
      })
    );
    root.querySelector('[data-close]').onclick = close;
    root.querySelector('[data-next]').onclick = (e) => open(e.currentTarget.dataset.next);
    root.scrollTop = 0;
    root.classList.add('is-open');
    onOpen?.(slug);
  }

  function close() {
    root.classList.remove('is-open');
    root.querySelectorAll('video').forEach((v) => v.pause());
    setTimeout(() => {
      if (!root.classList.contains('is-open')) root.innerHTML = '';
    }, 400);
  }

  return { open, close, isOpen: () => root.classList.contains('is-open') };
}
