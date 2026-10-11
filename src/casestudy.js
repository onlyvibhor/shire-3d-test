// Full-screen case studies, rendered from the portfolio repo's own content JSON
// and styled after its case page (big type, mono labels, generous spacing).
import toolkit from './content/toolkit.json';
import mentorship from './content/mentorship.json';
import { PROJECTS as PROJECT_META, PLAYS, LENSES } from './data.js';
import { sfx } from './audio.js';

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

const fbVideo = (id) => `https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Fblinkit.india%2Fvideos%2F${id}%2F&show_text=false&width=268&t=0`;
const fbPost = (id) => `https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fblinkit.india%2Fposts%2F${id}&show_text=true&width=500`;

// The Modern Junkyard films, each as its own short case
function stopMotion(slug, titleLines, yt, caption) {
  const m = PROJECT_META[slug];
  return {
    title: m.title,
    title_lines: titleLines,
    client: m.client,
    role: m.role,
    year: m.year,
    category: 'Stop motion',
    tagline: m.tagline,
    cover: { image: m.images[0] },
    sections: [
      { type: 'video', url: `https://www.youtube.com/watch?v=${yt}`, caption },
      { type: 'text', label: 'The film', body: m.summary },
      { type: 'text', label: 'The studio', title: 'Modern Junkyard', body: 'My stop-motion studio: small and playful work, made one frame at a time. A paper-craft world for UrbanClap, vegetables that skateboard, juggle and dance, typography written in wool, and short animations for festivals and campaigns.' },
    ],
    links: [{ label: 'Watch on YouTube', url: `https://www.youtube.com/watch?v=${yt}` }, { label: 'Modern Junkyard on YouTube', url: 'https://www.youtube.com/@modernjunkyard606' }],
  };
}

const SYNTH = {
  grofery: () => ({
    title: 'Grofery Talks',
    title_lines: 'Grofery\nTalks',
    client: 'Grofers (now Blinkit)',
    role: 'Co-created with Anurag Gupta',
    year: '2021',
    category: 'Animated comic series · Social',
    tagline: 'Find out what your everyday groceries do *when you are not around.*',
    cover: { image: 'work/grofery-cover.jpg' },
    sections: [
      {
        type: 'text',
        label: 'The idea',
        title: 'A slice of life, from the groceries’ point of view.',
        body: 'Grofery Talks is an animated comic series for Grofers: everyday groceries come alive and get up to things while nobody is watching. Each episode is a short, funny insight into the products people order every day.',
      },
      { type: 'embeds', label: 'The episodes', items: ['782742652437290', '532523954572299', '875528089719648', '3494605870643090', '831575707749511'].map((id) => ({ src: fbVideo(id), w: 268, h: 476 })) },
      { type: 'embeds', label: 'On the Grofers page', items: ['1719934011535182', '1720727664789150'].map((id) => ({ src: fbPost(id), w: 500, h: 620 })) },
      { type: 'tools', label: 'Tags', items: ['Advertising', 'Content', 'Food', 'Funny', 'Grocery', 'Insight', 'Slice of life', 'Video'] },
    ],
    team: [{ name: 'Anurag Gupta', role: 'Co-owner' }, { name: 'Vibhor Mathur', role: 'Co-owner' }],
    links: [{ label: 'Behance project', url: 'https://www.behance.net/gallery/125711823/Comic-Series-Grofery-Talks' }],
  }),
  afsaane: () => ({
    title: 'Afsaane Aam ke',
    title_lines: 'Afsaane\nAam ke',
    client: 'Grofers',
    role: 'With Zahid Shaikh & Snehlata Maurya',
    year: '2018',
    category: 'Instagram Stories · Motion',
    tagline: 'A mango’s journey *to the top of the app.*',
    cover: { image: 'behance/afsaane/cover.jpg' },
    sections: [
      {
        type: 'text',
        label: 'The brief',
        title: 'Show the quality of the mangoes on Grofers.',
        body: 'To increase awareness about the quality of mangoes available on the Grofers app, we created a campaign made for Instagram Stories: a mango becomes a top product on the app, and the story follows all the quality checks it goes through to reach the top.',
      },
      { type: 'video', url: 'https://www.youtube.com/watch?v=XRloLpiUg7c', caption: 'The story, in full' },
      { type: 'clips', label: 'Story frames', columns: 3, clips: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '12', '13', '15'].map((n) => ({ video: `behance/afsaane/${n}.mp4` })) },
      { type: 'tools', label: 'Tags', items: ['Motion graphics', 'Character', 'Animation', 'After Effects', 'Social media', 'Mango season'] },
    ],
    team: [{ name: 'Zahid Shaikh', role: 'Co-owner' }, { name: 'Vibhor Mathur', role: 'Co-owner' }, { name: 'Snehlata Maurya', role: 'Co-owner' }],
    links: [{ label: 'Behance project', url: 'https://www.behance.net/gallery/68487363/Afsaane-Aam-ke-Digital-Campaign' }],
  }),
  'love-story': () => ({
    title: 'Love Story',
    title_lines: 'Love\nStory',
    client: 'Grofers',
    role: 'Campaign idea, art direction, animation',
    year: '2019',
    category: 'Valentine’s Day · Social',
    tagline: 'Grofers’ *Valentine’s Day* campaign.',
    cover: { image: 'behance/love-story/cover.jpg' },
    sections: [
      { type: 'image', image: 'behance/love-story/1.jpg', size: 'wide' },
      { type: 'image', image: 'behance/love-story/2.jpg', size: 'wide' },
      { type: 'image', image: 'behance/love-story/3.jpg', size: 'wide' },
      { type: 'image', image: 'behance/love-story/4.jpg', size: 'wide' },
      { type: 'tools', label: 'Tags', items: ['Campaign', 'Instagram', 'Love', 'Social media campaign', 'Valentine’s Day'] },
    ],
    team: [
      { name: 'Vibhor Mathur', role: 'Campaign idea, art direction, animation' },
      { name: 'Zahid Shaikh', role: 'Campaign idea' },
      { name: 'Meera Pawar', role: 'Copywriter' },
      { name: 'Shrijan Bhattacharya', role: 'Illustrations' },
    ],
    links: [{ label: 'Behance project', url: 'https://www.behance.net/gallery/123231821/Love-Story-Valentines-Day-Grofers' }],
  }),
  'winter-foods': () => ({
    title: 'Winter Foods',
    title_lines: 'Winter\nFoods',
    client: 'Grofers',
    role: 'Senior Creative',
    year: '2020',
    category: 'Stop motion · Craft',
    tagline: 'Winter foods, *knitted in wool.*',
    cover: { image: 'behance/winter-foods/cover.jpg' },
    sections: [
      { type: 'image', image: 'behance/winter-foods/1.jpg', size: 'wide' },
      { type: 'embeds', label: 'The films', items: ['QR7oHPbR3nj', 'F-BtqD2I2eT', '4WUtZyvu9Ly', 'Lt9PJ3UYmjM', 'FzH8vbds7k4'].map((id) => ({ src: `https://www-ccv.adobe.io/v1/player/ccv/${id}/embed?api_key=behance1&bgcolor=%23191919`, w: 360, h: 360 })) },
      { type: 'image_grid', columns: 2, images: ['3', '4', '5', '6'].map((n) => ({ image: `behance/winter-foods/${n}.jpg` })) },
      { type: 'tools', label: 'Tags', items: ['Stop motion', 'Craft', 'Wool', 'Typography', 'Motion graphics', 'Photoshop', 'Food'] },
    ],
    team: [
      { name: 'Snehlata Maurya', role: 'Creative Designer' },
      { name: 'Arif Jamal', role: 'Creative Designer' },
      { name: 'Vibhor Mathur', role: 'Senior Creative' },
      { name: 'Meera Pawar', role: 'Copywriter' },
    ],
    links: [{ label: 'Behance project', url: 'https://www.behance.net/gallery/88918687/Winters-Foods-stop-motion' }],
  }),
  unskippable: () => ({
    title: 'YouTube Unskippable ads',
    title_lines: 'Unskip-\npable',
    client: 'Grofers',
    role: 'With Sneh Shruti & Harsh Vardhan',
    year: '2017',
    category: 'YouTube bumper ads',
    tagline: 'Running out of anything? *Order from Grofers.*',
    cover: { image: 'behance/unskippable/cover.jpg' },
    sections: [
      { type: 'statement', text: 'Running out of anything, *order from Grofers.*' },
      ...['nnPT91iSoHs', 'n3iXAbqivtA', 'eUeEX8P8WMQ', 'v9hwiqITOFg', 'Snz-vp0lpPg'].map((id, k) => ({ type: 'video', url: `https://www.youtube.com/watch?v=${id}`, caption: `Bumper ${k + 1}` })),
      { type: 'tools', label: 'Tags', items: ['YouTube', 'Bumper', 'Digital', 'Unskippable'] },
    ],
    team: [{ name: 'Vibhor Mathur', role: 'Co-owner' }, { name: 'Sneh Shruti', role: 'Co-owner' }, { name: 'Harsh Vardhan', role: 'Co-owner' }],
    links: [{ label: 'Behance project', url: 'https://www.behance.net/gallery/50154055/Youtube-Unskippable-ads' }],
  }),
  'diwali-2020': () => ({
    title: 'Ek Diye Se Do Ghar Roshan',
    title_lines: 'Ek Diye Se\nDo Ghar Roshan',
    client: 'Grofers',
    role: 'Diwali social campaign',
    year: '2020',
    category: 'Festive · Cause · Social',
    tagline: 'One diya *lights up two homes.*',
    cover: { image: 'behance/diwali-2020/cover.jpg' },
    sections: [
      { type: 'image', image: 'behance/diwali-2020/1.jpg', size: 'wide' },
      {
        type: 'text',
        label: 'Background',
        title: 'The potters’ markets cities forgot.',
        body: 'Every city has at least one market where local potters live, make and sell their mud and clay diyas, god idols, planters and more. With migration between cities and shopping shifting to convenience, most people living in the city have lost track of where these markets are. They are the cheapest source for these goods, and Diwali is the season these potters earn their living, yet they lose a lot of money on unsold goods or never get a proper platform to sell.',
      },
      { type: 'text', label: 'Objective', title: 'Help local potters earn more this festive season.', body: 'Give local potters a platform on Grofers to sell their products during the festival season.' },
      {
        type: 'steps',
        label: 'Communication',
        title: 'Two stages.',
        items: [
          { title: 'Awareness', body: 'Create awareness about the local potters’ produce, and how Grofers supports their cause by bringing them and customers together.' },
          { title: 'Follow-up', body: 'Remind people about the cause, and ask them to buy from Grofers.' },
        ],
      },
      { type: 'statement', text: 'Campaign idea: *Ek Diye Se Do Ghar Roshan.*' },
      { type: 'video', url: 'https://www.youtube.com/watch?v=rqRZSCynXso', caption: 'The Diwali film' },
      { type: 'tools', label: 'Tags', items: ['Diwali', 'Potters', 'Social', 'Cause'] },
    ],
    links: [{ label: 'Behance project', url: 'https://www.behance.net/gallery/122959875/diwali-social-campaign-grofers-2020' }],
  }),
  urbanclap: () => stopMotion('urbanclap', 'All Things\nA', 'JS8qOYDIngM', 'UrbanClap All Things A: April Fool digital film'),
  'veggie-people': () => stopMotion('veggie-people', 'Veggie\nPeople', 'rhfcFDIY9Ss', 'Lettuce Dance'),
  'holi-stop-motion': () => stopMotion('holi-stop-motion', 'Happy\nHoli', 'IApjyY245Us', 'Grofers Holi Stop Motion Animation'),
  'valentines-week': () => stopMotion('valentines-week', 'Valentines\nWeek 2018', 'a1UiBuCb8zI', 'Valentines Week 2018'),
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
    case 'embeds':
      return `<section class="cs-blk"><div class="cs-row"><h4>${esc(b.label || '')}</h4><div></div></div><div class="cs-embeds">${(b.items || []).map((e) => `<div class="cs-embed" style="--w:${e.w}px;--ar:${e.w}/${e.h}"><iframe src="${esc(e.src)}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen title="Embedded post"></iframe></div>`).join('')}</div></section>`;
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
    const allLinks = [...(meta.play ? [meta.play] : []), ...(p.links || [])];
    const links = list('Links', allLinks.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener"><span>${esc(l.label)}</span><span aria-hidden="true">↗</span></a></li>`));
    // how it was cracked: the problem, the idea, the craft, and what it did on each lens
    const pl = PLAYS[slug];
    const cracked = pl
      ? `<section class="cs-crack">
          <div class="cs-crack__head"><h4>How it was cracked</h4><span>${esc(pl.kind)}</span></div>
          <div class="cs-crack__steps">
            <div><span>The problem</span><p>${esc(pl.problem)}</p></div>
            <div><span>The idea</span><p>${esc(pl.idea)}</p></div>
            <div><span>The craft</span><p>${esc(pl.craft)}</p></div>
          </div>
          <div class="cs-crack__lenses">${LENSES.filter((l) => pl.lenses[l.id]).map((l) => `<div style="--l:${l.color}"><span>${l.icon} ${esc(l.name)}</span><p>${esc(pl.lenses[l.id])}</p></div>`).join('')}</div>
        </section>`
      : '';
    const idx = order.indexOf(slug);
    const nextSlug = order[(idx + 1) % order.length];
    const cover = p.cover?.image || meta.images[0];

    root.style.setProperty('--accent', color);
    root.innerHTML = `
      <div class="cs-bar">
        <span class="cs-crumb"><i style="background:${color}"></i>${esc(place?.name || '')} · ${esc(place?.place || '')}</span>
        <button class="cs-close" data-close>Close <kbd>Esc</kbd></button>
      </div>
      <article class="cs">
        <section class="cs-hero">
          <h1>${lines.map((t) => `<span>${esc(t)}</span>`).join('')}</h1>
          <div class="cs-meta">${metaRows.filter((m) => m[1]).map((m) => `<div><span>${m[0]}</span>${esc(m[1])}</div>`).join('')}</div>
        </section>
        ${cover ? `<div class="cs-cover"><img src="${esc(cover)}" alt="${esc(p.title)}" /></div>` : ''}
        ${p.tagline ? `<p class="cs-hook">${inline(p.tagline)}</p>` : ''}
        ${meta.play ? `<div class="cs-play-cta"><a class="btn btn--big" href="${esc(meta.play.url)}" target="_blank" rel="noopener">🎮 ${esc(meta.play.label)} ↗</a></div>` : ''}
        ${cracked}
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
    document.getElementById('case-backdrop').onclick = close;
    root.querySelector('[data-next]').onclick = (e) => open(e.currentTarget.dataset.next);
    root.scrollTop = 0;
    if (!root.classList.contains('is-open')) sfx('project');
    root.classList.add('is-open');
    document.getElementById('case-backdrop')?.classList.add('is-open');
    onOpen?.(slug);
  }

  function close() {
    if (root.classList.contains('is-open')) sfx('close');
    root.classList.remove('is-open');
    document.getElementById('case-backdrop')?.classList.remove('is-open');
    root.querySelectorAll('video').forEach((v) => v.pause());
    setTimeout(() => {
      if (!root.classList.contains('is-open')) root.innerHTML = '';
    }, 400);
  }

  return { open, close, isOpen: () => root.classList.contains('is-open') };
}
