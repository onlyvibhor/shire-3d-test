// All portfolio content lives here. Source: onlyvibhor/portfolio-staging (mirrors the Behance case studies).

const img = (name) => `work/${name}.jpg`;

export const OWNER = {
  name: 'Vibhor Mathur',
  role: 'Communication Design Senior Manager, Razorpay',
  short: 'Creative leader · Razorpay',
  tagline: 'I turn one photograph into a full production, and a handful of designers into a studio that ships it.',
  intro:
    'Every organisation is a village. Brand, product marketing, product, social, content and design each keep their own hamlet, craft and rhythm. My job is the roads between them. Walk the village, meet each department, and see the work we shipped together.',
  email: 'onlyvibhor@gmail.com',
  portrait: img('profile'),
  links: [
    { label: 'Behance', href: 'https://www.behance.net/onlyvibhor' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/onlyvibhor/' },
    { label: 'Instagram', href: 'https://www.instagram.com/onlyvibhor/' },
    { label: 'ADPList', href: 'https://adplist.org/mentors/vibhor-mathur' },
  ],
  numbers: [
    { value: '11', label: 'years in consumer commerce and fintech' },
    { value: '10+', label: 'product lines on one deck design language' },
    { value: '4', label: 'in-house AI tools used on live campaigns' },
  ],
  path: [
    { years: '2021 – now', org: 'Razorpay', role: 'Communication Design Senior Manager. Payments, RazorpayX and POS.' },
    { years: '2015 – 2021', org: 'Grofers (now Blinkit)', role: 'Associate Director, Marketing Design. Built and led the creative team.' },
    { years: '2010 – 2014', org: 'GEC Bikaner', role: 'B.Tech, Computer Engineering. Self-taught designer from Jaipur.' },
  ],
};

// Recognition: each one is a trophy hidden somewhere in the village.
export const AWARDS = [
  { id: 'shorty', name: 'Shorty Awards 2026', detail: 'Winner, Generative AI · Gold Honor, Financial Services', project: 'trial' },
  { id: 'kyoorius', name: 'Kyoorius Creative Awards 2026', detail: 'First List: Film Craft, and Use of Technology & AI', project: 'trial' },
  { id: 'et-gold', name: 'ET Brand Disruption Awards 2026', detail: 'Gold, Most Disruptive Creative & Design Team (Razorpay)', project: null },
  { id: 'et-silver', name: 'ET Brand Disruption Awards 2026', detail: 'Silver, Most Disruptive B2B Campaign', project: 'trial' },
];

// The five standing stones around the Party Tree.
export const PILLARS = [
  { id: 'better', name: 'Make it better', rune: '✦', text: 'One visual system and storytelling method across Payments, RazorpayX and POS.' },
  { id: 'award', name: 'Award-winning', rune: '★', text: 'Shorty Awards winner, Kyoorius First List, ET Brand Disruption Gold for the design team.' },
  { id: 'scale', name: 'Scale', rune: '❖', text: '81 TV films, a newspaper front page and 200+ posts from one AI pipeline.' },
  { id: 'automate', name: 'Automate', rune: '⚙', text: 'Set tasks become buttons: one founder photo in, a 4K campaign library out.' },
  { id: 'innovate', name: 'Innovate', rune: '✺', text: '100% AI-led TVCs on IPL and the T20 World Cup. Zero live-action shoots.' },
];

export const PROJECTS = {
  t20: {
    title: "Backing India's Start-Up Champions",
    client: 'Razorpay × T20 World Cup',
    year: '2026',
    role: 'Art Direction',
    tagline: 'India celebrates cricketers and founders equally. Only one gets a stadium. We built one for both.',
    summary:
      '81 television films, a newspaper front page and 200+ social posts for 20 founders, with no cameras, sets or lights. A custom avatar tool turned one photo per founder into a whole campaign library, lit three ways for every match slot.',
    metrics: [['81', 'TV films'], ['8.1M', 'unique viewers'], ['133%', 'lift in purchase intent'], ['200+', 'social posts']],
    images: [img('t20-1'), img('t20-5'), img('t20-3')],
    link: 'https://www.behance.net/gallery/254656865/Backing-Indias-Start-Up-Champions-T20-Campaign',
  },
  btb: {
    title: 'Break To Build',
    client: 'Razorpay × JioHotstar, IPL 2026',
    year: '2026',
    role: 'Art & Creative Direction',
    tagline: 'Thirty founders. Thirty ad films. Zero shoots.',
    summary:
      'A 100% AI experiment in making a TVC. Founders photographed once, then broken through glass, walls and ceilings in cinematic films. A launch film, 30 founder films, teasers and music, AI-led end to end.',
    metrics: [['30', 'AI-led ad films'], ['30', 'founders'], ['1', 'photo per founder'], ['0', 'live-action shoots']],
    images: [img('btb-1')],
    link: 'https://www.behance.net/gallery/254665051/Break-To-Build-Razorpay-IPL-Campaign',
  },
  ace: {
    title: 'Agentic Commerce Engine',
    client: 'Razorpay · Global Fintech Fest 2026',
    year: '2026',
    role: 'Art Direction',
    tagline: "One founder's POV, one continuous world, one integration.",
    summary:
      'A 100% AI-made launch film for the Razorpay Agentic Commerce Stack. The world shifts from a grand marble hall to a glowing tech studio as complexity gives way to the agentic era.',
    metrics: [['100%', 'AI-made'], ['1', 'continuous world']],
    images: [img('ace-cover')],
    link: 'https://www.behance.net/gallery/255895063/Agentic-Commerce-Engine-Launch-Video',
  },
  intl: {
    title: 'International Payments Launch Video',
    client: 'Razorpay',
    year: '2023',
    role: 'Design & Motion',
    tagline: 'Global e-commerce payments, made simple to follow in under a minute.',
    summary:
      'A 40 to 60 second motion graphics film demystifying how international businesses accept payments from India and settle in their own currency.',
    metrics: [['1000+', 'organic views'], ['40–60s', 'film']],
    images: [img('intl-cover')],
    link: 'https://www.behance.net/gallery/185746781/Razorpay-International-Payments-Launch-Video',
  },
  money: {
    title: 'MoneySaver Export Account',
    client: 'Razorpay International Payments',
    year: '2023',
    role: 'Campaign lead',
    tagline: "India's first PA/PG with an OPGSP compliant solution, launched with an AI-made film.",
    summary: 'A launch film and digital media strategy for Indian exporters, made entirely with AI design tools.',
    metrics: [['438K+', 'views'], ['29.1M', 'media reach'], ['70+', 'quality leads'], ['313K', 'BTS impressions']],
    images: [img('money-hero')],
    link: 'https://www.behance.net/gallery/185754027/MoneySaver-Export-Account-AI-Gen-campaign',
  },
  passport: {
    title: 'Passport For Your Product',
    client: 'Razorpay International Payments',
    year: '2023',
    role: 'Campaign lead',
    tagline: 'Borderless business, made to feel effortless.',
    summary:
      'A launch campaign whose entire design identity was built with a new AI workflow, then taken to YouTube, LinkedIn and Meta.',
    metrics: [['50%', 'LinkedIn view-through'], ['94', 'leads'], ['35%', 'lower buy rates'], ['60K+', 'BTS impressions']],
    images: [img('passport-cover'), img('passport-ads')],
    link: 'https://www.behance.net/gallery/185756345/Passport-For-Your-Products-AI-Gen-Campaign',
  },
  whatsapp: {
    title: 'Payments on WhatsApp: Melancholy',
    client: 'Razorpay',
    year: '2023',
    role: 'Campaign lead',
    tagline: 'The silent stories of abandoned carts. Shop. Don’t abandon.',
    summary:
      'Three concepts came out of brainstorms with marketing and design. "Melancholy" told sad stories of abandoned carts with AI imagery, then turned them into stories of completion.',
    metrics: [['95K+', 'impressions'], ['10%', 'Twitter engagement'], ['2000+', 'businesses interested']],
    images: [img('whatsapp-cover')],
    link: 'https://www.behance.net/gallery/185779105/Razorpay-Payments-on-WhatsApp',
  },
  'magic-checkout': {
    title: 'Magic Checkout Landing Page',
    client: 'Razorpay',
    year: '2026',
    role: 'Art Direction · Web Design',
    tagline: "It's not just a checkout. It's engineered magic.",
    summary:
      'An immersive page where you experience what checkout does instead of reading features. Four stories play out on floating islands, then the world turns into a wireframe to reveal the science underneath.',
    metrics: [['4', 'floating story islands'], ['1', 'world, magic to wireframe']],
    images: [img('magic-cover'), img('magic-page')],
    link: 'https://www.behance.net/gallery/254362459/Magic-Checkout-Landing-Page',
  },
  ring: {
    title: 'Back in the Ring',
    client: 'Razorpay Netbanking',
    year: '2026',
    role: 'Creative Direction',
    tagline: 'A fallen champion, written off by one-tap payments, gets its redemption arc.',
    summary:
      'A boxing-film trailer, a parallax landing page and a playable game, built end to end in-house. Every opponent you beat unlocks a new Netbanking feature.',
    metrics: [['3', 'pieces: film, arena, game'], ['100%', 'AI characters']],
    images: [img('ring-cover')],
    link: 'https://www.behance.net/gallery/254798253/Back-in-the-ring-Netbanking-Comeback-Razorpay',
  },
  conv: {
    title: 'Magic Conversations',
    client: 'Razorpay Magic Checkout',
    year: '2023',
    role: 'Design team lead',
    tagline: 'Two merchants on how Magic Checkout changed their business.',
    summary:
      'Testimonial films with Isak Fragrances and VS Mani Filter Coffees, shot and edited by a team of young designers learning the craft, including a fully remote shoot over Zoom.',
    metrics: [['2', 'merchant films']],
    images: [img('conv-cover')],
    link: 'https://www.behance.net/gallery/185745413/Magic-Conversations-Videos',
  },
  trial: {
    title: 'Trial of the Century',
    client: 'RazorpayX Payroll',
    year: '2025',
    role: 'Art Direction',
    tagline: "An animal courtroom puts HR's most dreaded monthly question on trial.",
    summary:
      'For employees, Salary Day is the best day of the month. For HR, it is a week-long nightmare. We put repeated payslip questions on trial in a Panchatantra-style courtroom, with a nod to the "sawaal pe sawaal" scene from Damini, plus the Wall of Laughter for HRs to share their funniest salary questions.',
    metrics: [['2.1M+', 'impressions'], ['8.64%', 'engagement, 4× B2B avg'], ['13%', 'lead uplift'], ['16%', 'traffic surge']],
    awards: ['Shorty Awards: Winner, Generative AI', 'Kyoorius 2026: First List', 'ET Brand Disruption: Silver'],
    images: [img('trial-1'), img('trial-3'), img('trial-4')],
    link: 'https://www.behance.net/gallery/254333269/Trial-of-the-century',
    extra: { label: 'Watch the film', href: 'https://www.youtube.com/watch?v=uDeZ0zKgVqY' },
  },
  'social-gen': {
    title: 'Social Content Gen',
    client: 'Razorpay Communication Design',
    year: '2026',
    role: 'Tool & system design',
    tagline: 'A founder photo and a business story in. A campaign-ready post out.',
    summary:
      'A high-volume, personalised post creator with preset clothing, pose, lighting and background. It carried the T20 campaign into 200+ extended posts, including founders who never appeared on TV.',
    metrics: [['200+', 'posts, one pipeline']],
    images: [img('social-1'), img('social-posts'), img('social-flow')],
    link: 'https://www.behance.net/onlyvibhor',
  },
  razorbae: {
    title: 'Razorbae, the AI avatar',
    client: 'Razorpay social',
    year: '2025',
    role: 'Creative system',
    tagline: 'Shot once. Trained into a system.',
    summary: 'A brand avatar captured once, then trained into a repeatable system for always-on reels.',
    metrics: [['129', 'reels'], ['6.55M', 'views']],
    images: [img('social-posts')],
    link: 'https://www.behance.net/onlyvibhor',
  },
  toolkit: {
    title: 'The Studio AI Toolkit',
    client: 'Razorpay design team',
    year: '2025–26',
    role: 'Built with the team',
    tagline: 'Tools that make the work, built by the people who make the work.',
    summary:
      'Cinematography Tool (20+ lenses, 100+ grades), Product Image Generator, Advanced Image Editor for continuity, and Founder Image Generator: one photo in, 4K campaign library out. Built in Gemini Studio on the Nano Banana API, used on live campaigns.',
    metrics: [['4', 'AI tools in production'], ['20+', 'lens simulations'], ['100+', 'colour grades']],
    images: [img('cine-ui'), img('founder-grid'), img('prod-1'), img('cine-1')],
    link: 'https://www.behance.net/onlyvibhor',
  },
  grofers: {
    title: 'Grofers Logo Guidelines',
    client: 'Grofers (now Blinkit)',
    year: '2021',
    role: 'Art Direction · Graphic Design',
    tagline: 'One way for every team to use the logo.',
    summary: 'Clear space, colourways, placement, typographic hierarchy and in-app creative templates for Grofers.',
    metrics: [['6+', 'years leading marketing design']],
    images: [img('grofers-cover'), img('grofers-2')],
    link: 'https://www.behance.net/gallery/123079157/grofers-logo-guidelines',
  },
  mentor: {
    title: 'Mentoring & Workshops',
    client: 'ADPList, GrowthSchool, Designland',
    year: '2023–26',
    role: 'Mentor',
    tagline: 'Sharing what I’ve learned, one designer at a time.',
    summary:
      '60-minute one-to-one sessions on ADPList, plus workshops on AI design workflows: "Revolutionizing Design Workflows with AI: Razorpay’s Success Story" for GrowthSchool and Designland.',
    metrics: [['33', 'ADPList sessions'], ['31h', 'mentoring']],
    images: [img('talk-growthschool'), img('talk-room')],
    link: 'https://adplist.org/mentors/vibhor-mathur',
  },
  habitats: {
    title: 'Habitats without the life',
    client: 'Personal · AI art',
    year: '2023',
    role: 'Artist',
    tagline: 'Landscapes that carry the silhouette of the creatures that belong in them.',
    summary: 'Stable Diffusion + ControlNet landscapes grown from animal silhouettes: bear, camel, elephant, rhino.',
    metrics: [],
    images: [img('habitats-02'), img('habitats-05'), img('habitats-08')],
    link: 'https://www.onlyvibhor.com/post/habitats-without-the-life',
  },
  absolut: {
    title: 'Absolut Landscapes',
    client: 'Personal · AI art',
    year: '2023',
    role: 'Artist',
    tagline: 'A modern AI take on a campaign built around one bottle shape.',
    summary: 'The Absolut bottle as the structure of a landscape, made with ControlNet (Canny).',
    metrics: [],
    images: [img('absolut-4'), img('absolut-1')],
    link: 'https://www.onlyvibhor.com/post/stable-diffusion-ai-and-controlnet',
  },
  aiexp: {
    title: 'AI Experiments',
    client: 'Personal · AI art',
    year: '2023',
    role: 'Artist',
    tagline: 'AI images, videos and animations.',
    summary: 'Midjourney, Stable Diffusion, RunwayML, PIKA Labs and Kaiber AI experiments.',
    metrics: [],
    images: [img('aiexp-10'), img('aiexp-11')],
    link: 'https://www.behance.net/gallery/185757595/AI-Experiments',
  },
};

// The centre of the village: Communication Design HQ under the Party Tree.
export const CENTER = {
  id: 'hq',
  name: 'Communication Design HQ',
  place: 'The Party Tree',
  color: '#d9a441',
  lead: 'Where every department meets. My team sits here, connecting briefs, words, pixels and launches into one story.',
  how: [
    'Lead Communication Design across Payments, RazorpayX and POS',
    'Brand films, keynote videos, landing pages, sales decks, social and product imagery',
    'Stories that start from data, consumer interviews and what past campaigns taught us',
    'Hire, coach and grow designers into a studio',
  ],
  projects: [],
  quotes: [
    'Welcome! Every road from here leads to a team we make work with.',
    'Find the four golden trophies hidden around the village.',
    'Press O for a bird’s-eye view, or T for the guided tour.',
  ],
};

// Each hamlet is one department. `activity` picks the props and what the villagers do.
export const HAMLETS = [
  {
    id: 'brand',
    name: 'Brand Marketing',
    place: 'The Arena',
    color: '#2f6bff',
    activity: 'arena',
    lead: 'Tentpole moments on the biggest stages: IPL, the T20 World Cup, Global Fintech Fest.',
    how: [
      'Turn the campaign idea into a film, broadcast and print system',
      'Art-direct AI-led TVCs end to end, with brand managers and agency partners',
      'One visual language from the TV spot to the newspaper front page',
    ],
    makes: ['Brand films', 'TVCs', 'Print', 'Event films'],
    projects: ['t20', 'btb', 'ace'],
    quotes: [
      '81 films across 20 match days. Not one camera, set or light.',
      'Thirty founders, one photograph each. We broke glass, walls and ceilings.',
      'The GFF launch film was 100% AI: one founder’s POV, one continuous world.',
    ],
  },
  {
    id: 'pmm',
    name: 'Product Marketing',
    place: 'Launch Field',
    color: '#00a79d',
    activity: 'launch',
    lead: 'Every launch needs a story people can follow in under a minute.',
    how: [
      'Launch films that explain complex payments simply',
      'Campaign identities for new products, built with AI workflows',
      'Digital media plans with PMMs across YouTube, LinkedIn and Meta',
    ],
    makes: ['Launch videos', 'Campaign identity', 'Performance ads'],
    projects: ['money', 'passport', 'intl'],
    quotes: [
      'MoneySaver reached 29.1 million people across 32+ stories.',
      'Passport For Your Product: 50% view-through on LinkedIn.',
      'Explaining international payments in under a minute? Done.',
    ],
  },
  {
    id: 'product',
    name: 'Product & Web',
    place: 'Magic Isles',
    color: '#7b5cff',
    activity: 'isles',
    lead: 'Where products become experiences you can play with.',
    how: [
      'Landing pages designed as worlds, not feature lists',
      'Playable campaign games and parallax stories, shipped by designers',
      'Merchant stories that show the product working in real businesses',
    ],
    makes: ['Landing pages', 'Web games', 'Product films'],
    projects: ['magic-checkout', 'ring', 'conv'],
    quotes: [
      'Magic Checkout: four floating islands, one product story.',
      'Netbanking got a redemption arc. Beat an opponent, unlock a feature.',
      'We shot a merchant film entirely over Zoom.',
    ],
  },
  {
    id: 'social',
    name: 'Social Media',
    place: 'Beacon Hill',
    color: '#ff4f8b',
    activity: 'beacon',
    lead: 'Always on, high volume, and still on-brand.',
    how: [
      'Pipelines that turn one founder photo and a story into a finished post',
      'AI avatars captured once and used for months of reels',
      'Community moments people want to join, like the Wall of Laughter',
    ],
    makes: ['Reels', 'Founder posts', 'Community'],
    projects: ['social-gen', 'razorbae'],
    quotes: [
      'Razorbae was shot once: 129 reels and 6.55M views later...',
      '200+ posts for T20, including founders who weren’t on TV.',
      'HRs shared their funniest salary questions on the Wall of Laughter.',
    ],
  },
  {
    id: 'copy',
    name: 'Content & Copy',
    place: "Scribes' Court",
    color: '#f2a516',
    activity: 'court',
    lead: 'Stories start from data, interviews and what past campaigns taught us.',
    how: [
      'Find the insight: for HR, Salary Day is a week-long nightmare',
      'Build worlds with writers: an animal courtroom, the melancholy of abandoned carts',
      'Keep one voice across film, social and landing pages',
    ],
    makes: ['Scripts', 'Campaign ideas', 'Voice & tone'],
    projects: ['trial', 'whatsapp'],
    quotes: [
      'Sawaal pe sawaal! The payslip questions are on trial.',
      '8.64% engagement: four times the B2B fintech average.',
      'Shop. Don’t abandon.',
    ],
  },
  {
    id: 'design',
    name: 'Design Studio',
    place: 'The Workshop',
    color: '#ff7a3d',
    activity: 'studio',
    lead: 'A handful of designers, working like a studio.',
    how: [
      'Four in-house AI tools the whole team uses on live campaigns',
      'A deck design language used across 10+ product lines',
      'Crits, workshops and mentoring: 33 one-to-one ADPList sessions',
    ],
    makes: ['AI tools', 'Design systems', 'People'],
    projects: ['toolkit', 'grofers', 'mentor'],
    quotes: [
      'Pick the lens, set the light, choose the grade. The tool does the rest.',
      'One founder photo in, a 4K campaign library out.',
      'Prompts are inputs. Tools are modules. Systems create consistency.',
    ],
  },
];

// A quiet spot by the pond: after-hours art.
export const LAB = {
  id: 'lab',
  name: 'The Night Lab',
  place: 'By the pond',
  color: '#3fb6d9',
  lead: 'After hours: AI art, stop motion and found objects.',
  how: ['Personal experiments that feed the day job', 'Stable Diffusion, ControlNet, Midjourney, Runway'],
  makes: ['AI art', 'Stop motion'],
  projects: ['habitats', 'absolut', 'aiexp'],
  quotes: ['Every landscape here started as an animal silhouette.', 'Warhol loved the Absolut bottle. So did ControlNet.'],
};

// Optional generated assets (e.g. from Higgsfield). Drop files in public/assets and set paths here.
export const ASSETS = {
  skybox: null, // equirectangular panorama, e.g. 'assets/sky.jpg'
};
