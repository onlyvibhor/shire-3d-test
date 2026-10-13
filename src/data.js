// All portfolio content lives here. Source: onlyvibhor/portfolio-staging (mirrors the Behance case studies).

const img = (name) => `work/${name}.jpg`;

export const OWNER = {
  name: 'Vibhor Mathur',
  role: 'Communication Design Senior Manager, Razorpay',
  short: 'Creative director & design leader',
  tagline: 'I turn brand briefs into campaigns through design, build tools that scale the visuals, and have fun doing it.',
  intro:
    'Every organisation is a village. Brand, product marketing, product, social, content and design each keep their own hamlet, craft and rhythm. My job is the roads between them. Walk the village, meet each department, and see the work we shipped together.',
  email: 'onlyvibhor@gmail.com',
  portrait: img('profile'),
  links: [
    { label: 'Behance', href: 'https://www.behance.net/onlyvibhor' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/onlyvibhor/' },
    { label: 'Instagram', href: 'https://www.instagram.com/onlyvibhor/' },
    { label: 'ADPList', href: 'https://adplist.org/mentors/vibhor-mathur' },
    { label: 'YouTube', href: 'https://www.youtube.com/channel/UCYz6bkPGCR3gapGpoDKuSDg' },
    { label: 'Profile (PDF)', href: 'assets/docs/vibhor-mathur-profile.pdf' },
  ],
  hireFor:
    'Creative and art direction for brand films, launch videos and campaigns; AI-native film and campaign production; interactive landing pages and games; building and leading in-house design teams and visual systems; custom AI design tools for studios; and design mentoring or workshops on AI in design.',
  results: [
    { value: '8.1M', label: 'unique viewers', slug: 't20' },
    { value: '2.1M+', label: 'impressions', slug: 'trial' },
    { value: '81', label: 'TV films, no cameras', slug: 't20' },
    { value: '133%', label: 'lift in purchase intent', slug: 't20' },
    { value: '30', label: 'AI ad films, one photo each', slug: 'btb' },
    { value: '29.1M', label: 'media reach for a launch', slug: 'money' },
  ],
  teaching: [
    'ADPList: one-to-one design mentor',
    'GrowthSchool: mentor and webinar host',
    'Samanvaya (Rotaract 3191) at BMS College of Engineering: design in brand building, 2023',
    'IIIT-Delhi E-Summit: fireside chat on design leadership, 2024',
    'AI in art and design workshop: image, video and AI-assisted UI, 2024',
    'AI design workshops for Whole Truth Foods and Wolfkrafft',
    'JK Lakshmipat University, Jaipur: short course on generative AI design',
  ],
  writing: [
    { title: 'Embracing Creative Leadership in 2025: Strategies for In-House Design Teams', date: 'Apr 2024', url: 'https://www.onlyvibhor.com/post/setting-up-design-lead-goals-for-2025' },
    { title: 'Navigating the Frontier of Creativity: The Potential of AI in Art and Design', date: 'Mar 2024', url: 'https://www.onlyvibhor.com/post/navigating-the-frontier-of-creativity-unveiling-the-potential-of-ai-in-art-and-design' },
    { title: 'Habitats without the life', date: 'Dec 2023', url: 'https://www.onlyvibhor.com/post/habitats-without-the-life' },
    { title: 'Stable Diffusion AI and ControlNet', date: 'Nov 2023', url: 'https://www.onlyvibhor.com/post/stable-diffusion-ai-and-controlnet' },
  ],
  gallery: [
    { image: 'assets/img/about/on-set.jpg', caption: 'On set' },
    { image: 'assets/img/about/brand-disruption-awards-2026.jpg', caption: 'ET Brand Disruption Awards 2026' },
    { image: 'assets/img/about/reimagine-awards-stage.jpg', caption: 'On stage at the Reimagine Awards' },
    { image: 'assets/img/mentor/photo.jpg', caption: 'Presenting at a workshop' },
    { image: 'assets/img/mentor/iiitd-panel.jpg', caption: 'IIIT-Delhi E-Summit' },
    { image: 'assets/img/mentor/samanvaya-talk.jpg', caption: 'Samanvaya workshop, Bengaluru' },
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

// What Vibhor believes, one line per place, in his own words (from his leadership notes,
// the portfolio's about page and each department's description). Shown on Jaipur-style signs.
export const BELIEFS = {
  hq: { title: 'Design for the business, not just the brief.', body: 'Work in step with brand marketing, so the output reflects company goals, not only creative ambition.' },
  brand: { title: 'One visual language, from the TV spot to the newspaper front page.', body: 'Turn the campaign idea into a film, broadcast and print system.' },
  pmm: { title: 'Every launch needs a story people can follow in under a minute.', body: 'Launch films that explain complex payments simply.' },
  social: { title: 'Always on, high volume, and still on-brand.', body: 'Every festival and every moment is a new conversation with the feed.' },
  mentorship: { title: 'Keep widening the toolkit.', body: 'Continuous learning keeps a team competitive, and engaged. Teach what the studio is learning.' },
  lab: { title: 'Everyday objects can be small vessels of emotion and meaning.', body: 'Personal experiments that feed the day job.' },
  fun: { title: 'Have fun doing it.', body: 'Stop motion, found objects and quirky little things, after hours.' },
  home: { title: 'Build a culture that can take risks.', body: 'Turn brainstorms into hubs of collaboration, where trying something bold does not mean fearing failure.' },
  ai: { title: 'Interfaces, not prompts.', body: 'Make AI easy to learn, so beginners are productive on day one.' },
  awards: { title: 'Make goals measurable.', body: 'Use analytics not only to validate creative work but to show how it contributes to the company.' },
};

// The five pillars around the jamun tree.
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
    repo: 'agentic-commerce-engine',
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
    repo: 'international-payments',
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
    repo: 'moneysaver-export-account',
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
    repo: 'passport-for-your-products',
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
    repo: 'payments-on-whatsapp',
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
    images: [img('ring-cover'), 'assets/img/p/ring-poster.jpg', 'assets/img/p/ring-art-direction.jpg'],
    link: 'https://www.behance.net/gallery/254798253/Back-in-the-ring-Netbanking-Comeback-Razorpay',
    play: { label: 'Play the Netbanking game', url: 'https://razorpay.com/m/backinthering/#game' },
  },
  conv: {
    repo: 'magic-conversations',
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
  grofery: {
    title: 'Grofery Talks',
    client: 'Grofers (now Blinkit)',
    year: '2021',
    role: 'Co-created with Anurag Gupta',
    tagline: 'Find out what your everyday groceries do when you are not around.',
    summary:
      'A slice-of-life animated comic series for Grofers, where everyday groceries come alive when nobody is watching. The episodes ran on Grofers’ social channels.',
    metrics: [['5', 'animated episodes']],
    images: [img('grofery-cover')],
    link: 'https://www.behance.net/gallery/125711823/Comic-Series-Grofery-Talks',
  },
  afsaane: {
    title: 'Afsaane Aam ke',
    client: 'Grofers',
    year: '2018',
    role: 'With Zahid Shaikh & Snehlata Maurya',
    tagline: 'A mango’s journey to the top of the app.',
    summary:
      'An Instagram Stories campaign for Grofers about a mango that becomes a top product on the app, and all the quality checks it goes through to get there.',
    metrics: [],
    images: ['behance/afsaane/cover.jpg'],
    link: 'https://www.behance.net/gallery/68487363/Afsaane-Aam-ke-Digital-Campaign',
  },
  'love-story': {
    title: 'Love Story',
    client: 'Grofers',
    year: '2019',
    role: 'Campaign idea, art direction & animation',
    tagline: 'A Valentine’s Day campaign for Grofers.',
    summary:
      'A Valentine’s Day social campaign for Grofers. Campaign idea by Vibhor Mathur and Zahid Shaikh, copy by Meera Pawar, illustrations by Shrijan Bhattacharya, art direction and animation by Vibhor Mathur.',
    metrics: [],
    images: ['behance/love-story/cover.jpg'],
    link: 'https://www.behance.net/gallery/123231821/Love-Story-Valentines-Day-Grofers',
  },
  'winter-foods': {
    title: 'Winter Foods',
    client: 'Grofers',
    year: '2020',
    role: 'Senior Creative',
    tagline: 'Winter foods, knitted in wool and shot in stop motion.',
    summary:
      'A stop-motion craft campaign for Grofers’ winter foods. Creative design by Snehlata Maurya and Arif Jamal, copy by Meera Pawar, with Vibhor Mathur as senior creative.',
    metrics: [],
    images: ['behance/winter-foods/cover.jpg'],
    link: 'https://www.behance.net/gallery/88918687/Winters-Foods-stop-motion',
  },
  unskippable: {
    title: 'Unskippable',
    client: 'Grofers',
    year: '2017',
    role: 'With Sneh Shruti & Harsh Vardhan',
    tagline: 'Running out of anything? Order from Grofers.',
    summary: 'Six-second YouTube bumper ads for Grofers: running out of anything, order from Grofers.',
    metrics: [['5', 'YouTube bumpers']],
    images: ['behance/unskippable/cover.jpg'],
    link: 'https://www.behance.net/gallery/50154055/Youtube-Unskippable-ads',
  },
  'diwali-2020': {
    title: 'Ek Diye Se Do Ghar Roshan',
    client: 'Grofers',
    year: '2020',
    role: 'Diwali social campaign',
    tagline: 'One diya lights up two homes.',
    summary:
      'A Diwali campaign that gave local potters a platform on Grofers to sell their diyas, idols and planters, in the season their livelihood depends on.',
    metrics: [],
    images: ['behance/diwali-2020/cover.jpg'],
    link: 'https://www.behance.net/gallery/122959875/diwali-social-campaign-grofers-2020',
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
    repo: 'grofers-logo-guidelines',
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
  'ai-works': {
    title: 'AI Works',
    client: 'Personal · AI film & art',
    year: 'Ongoing',
    role: 'Artist & director',
    tagline: 'Rajasthan in Midjourney, a red reel, and a few short films.',
    summary: 'A Rajasthan series shot in Midjourney and a red reel, followed by short films, an abstract short and an AI ad.',
    metrics: [],
    images: ['assets/img/ai/ai-works-cover.jpg', 'assets/img/ai/midjourney-1.jpg', 'assets/img/ai/midjourney-2.jpg'],
    link: 'https://www.instagram.com/onlyvibhor/',
  },
  'modern-junkyard': {
    title: 'Modern Junkyard',
    client: 'Stop-motion studio',
    year: '2017–2018',
    role: 'Co-founder · Animator',
    tagline: 'Our studio of stop motion, with an UrbanClap film at its heart.',
    summary: 'An April Fool film for UrbanClap, dancing vegetables, wool typography and a Holi film for Grofers, all frame by frame.',
    metrics: [],
    images: ['assets/img/lab/modern-junkyard-urbanclap.jpg'],
    link: 'https://www.youtube.com/@modernjunkyard606',
  },
  urbanclap: {
    title: 'All Things A',
    client: 'UrbanClap',
    year: '2017–2018',
    role: 'Modern Junkyard · stop motion',
    tagline: 'An April Fool digital film, set in a paper-craft room.',
    summary: 'A 41-second stop-motion digital film for UrbanClap’s April Fool’s, set in a paper-craft room, with a doll in a saree introduced on screen as Aunty.',
    metrics: [['41s', 'stop-motion film']],
    images: ['assets/img/lab/modern-junkyard-urbanclap.jpg'],
    link: 'https://www.youtube.com/watch?v=JS8qOYDIngM',
  },
  'veggie-people': {
    title: 'Veggie People',
    client: 'Modern Junkyard',
    year: '2017–2018',
    role: 'Stop motion',
    tagline: 'Vegetables with personalities.',
    summary: 'A stop-motion series that gives everyday produce a life of its own: Lettuce Dance, Citrush Ride, Skateboarding Loki, Juggling with Peace / Peas and Walking Banana.',
    metrics: [],
    images: ['assets/img/lab/modern-junkyard-lettuce.jpg'],
    link: 'https://www.youtube.com/watch?v=rhfcFDIY9Ss',
  },
  'holi-stop-motion': {
    title: 'Happy Holi',
    client: 'Grofers',
    year: '2017–2018',
    role: 'Modern Junkyard · stop motion',
    tagline: 'A Holi greeting built from colour powder and petals.',
    summary: 'A short stop-motion film made for Grofers for Holi, where the greeting is built from colour and petals. It has over 11,000 views on YouTube.',
    metrics: [['11K+', 'YouTube views']],
    images: ['assets/img/lab/modern-junkyard-holi.jpg'],
    link: 'https://www.youtube.com/watch?v=IApjyY245Us',
  },
  'valentines-week': {
    title: 'Valentines Week 2018',
    client: 'Modern Junkyard',
    year: '2018',
    role: 'Stop motion',
    tagline: 'A week of small animations, one for each day.',
    summary: 'Valentine’s week 2018, told as a grid of Instagram posts: one stop-motion animation for each day, including Hug Day and Kiss Day.',
    metrics: [['7', 'days, 7 animations']],
    images: ['assets/img/lab/modern-junkyard-valentines.jpg'],
    link: 'https://www.youtube.com/watch?v=a1UiBuCb8zI',
  },
  power: {
    title: 'Power',
    client: 'Found-object art',
    year: '2021',
    role: 'Artist',
    tagline: 'Finding inner power in everyday electrical accessories.',
    summary: 'Assemblages of sockets, switches and wires with words, where electrical power becomes a metaphor for courage, inspiration and instinct.',
    metrics: [],
    images: ['assets/img/lab/power-1.jpg', 'assets/img/lab/power-2.jpg', 'assets/img/lab/power-3.jpg'],
    link: 'https://www.terrain.art/discover/artists/onlyvibhor',
  },
  birds: {
    title: 'Birds',
    client: 'Digital collage · Illustration',
    year: '2018–2020',
    role: 'Artist',
    tagline: 'Three years of one subject, in three different languages.',
    summary: 'Animated birds: collages of flowers, leaves and fruit, surreal city-and-nature scenes, and birds drawn in single white lines.',
    metrics: [],
    images: ['assets/img/lab/birds-v08.jpg', 'assets/img/lab/birds-15.jpg', 'assets/img/lab/birds-16.jpg'],
    link: 'https://www.onlyvibhor.com/birds',
  },
  eyes: {
    title: 'Eyes',
    client: 'Digital collage',
    year: '2021',
    role: 'Artist',
    tagline: 'An emotion diary, told through the sense we trust most.',
    summary: 'Thirty animated collages about emotions, dreams, fears and the lessons we learn through our eyes.',
    metrics: [['30', 'animated collages']],
    images: ['assets/img/lab/eyes-v05.jpg'],
    link: 'https://www.onlyvibhor.com/eyes',
  },

  // ---- AI Lab films and images (from the AI Works page) ----
  khwaab: {
    title: 'Khwaab',
    client: 'Personal · AI film',
    year: 'Ongoing',
    role: 'Director',
    tagline: 'An AI video.',
    summary: 'Khwaab: an AI video, one of the longer pieces on YouTube.',
    metrics: [],
    images: ['assets/img/ai/yt-sFg0CfD6G34.jpg'],
    link: 'https://www.youtube.com/watch?v=sFg0CfD6G34',
  },
  houseparty: {
    title: 'Houseparty',
    client: 'Personal · AI short',
    year: 'Ongoing',
    role: 'Director',
    tagline: 'An abstract AI short, with Socketman.',
    summary: 'A character with a retro monitor for a head runs through a room of pigeons and old electronics. Socketman echoes the electrical-accessory world of the Power series.',
    metrics: [],
    images: ['assets/img/ai/yt-xMpj-Kd6zQ0.jpg', 'assets/img/hero-houseparty-poster.jpg'],
    video: 'assets/vid/hero/houseparty.mp4',
    link: 'https://www.youtube.com/watch?v=xMpj-Kd6zQ0',
  },
  'undying-light': {
    title: 'Undying Light',
    client: 'Personal · AI short film',
    year: 'Ongoing',
    role: 'Director',
    tagline: 'A Diwali clash between light and darkness.',
    summary: 'A short film where zombies haunt the vibrant streets of Jaipur, fully generated using AI tools. Making it taught me how much sound design matters in cinematic video: atmosphere, emotion, character voices, foley, music and sync all carry the film as much as the picture.',
    metrics: [],
    images: ['assets/img/ai/yt-J-qqFTV3qxc.jpg'],
    link: 'https://www.youtube.com/watch?v=J-qqFTV3qxc',
  },
  'jaipur-ai': {
    title: 'Rajasthan in Midjourney',
    client: 'Personal · AI images',
    year: 'Ongoing',
    role: 'Artist',
    tagline: 'Seven frames of Rajasthan, shot in Midjourney.',
    summary: 'Pink stone facades, shafts of light and lone figures: a seven-image series set in Rajasthan, made entirely in Midjourney. It first ran as an Instagram carousel.',
    metrics: [['7', 'frames']],
    images: ['assets/img/ai/midjourney-1.jpg', 'assets/img/ai/midjourney-2.jpg', 'assets/img/ai/midjourney-3.jpg', 'assets/img/ai/midjourney-4.jpg', 'assets/img/ai/midjourney-5.jpg', 'assets/img/ai/midjourney-6.jpg', 'assets/img/ai/midjourney-7.jpg'],
    link: 'https://www.instagram.com/onlyvibhor/',
  },
  // ---- Mentorship: talks and workshops (from the mentorship page) ----
  'mentor-samanvaya': { title: 'Design in brand building', client: 'Samanvaya, Rotaract District 3191', year: '2023', role: 'Workshop', tagline: 'My first live workshop.', summary: 'My first live workshop: how design builds a brand, for 30 to 40 college design students at BMS College of Engineering, Bengaluru. 27 Aug 2023.', metrics: [], images: ['assets/img/mentor/samanvaya-poster.jpg', 'assets/img/mentor/samanvaya-talk.jpg', 'assets/img/mentor/samanvaya-class.jpg'], link: 'https://www.linkedin.com/feed/update/urn:li:ugcPost:7108524630130233344/' },
  'mentor-growthschool': { title: 'Revolutionizing Design Workflows with AI: Razorpay’s Success Story', client: 'GrowthSchool', year: '2023', role: 'Webinar', tagline: 'How Razorpay’s design team uses AI.', summary: 'A 90-minute free session on how Razorpay’s design team uses AI. 9 Sept 2023.', metrics: [], images: ['assets/img/mentor/growthschool.jpg', 'work/talk-growthschool.jpg'], link: 'https://adplist.org/mentors/vibhor-mathur' },
  'mentor-iiitd': { title: 'Design leadership fireside chat', client: 'IIIT-Delhi E-Summit', year: '2024', role: 'Panel', tagline: 'The journey of young designers.', summary: 'A fireside chat with Sushant Ajnikar, Mini Gautam and Anshul Patria on the journey of young designers, design processes, brand building and strategic design in high-growth startups. 16 Mar 2024.', metrics: [], images: ['assets/img/mentor/iiitd-panel-poster.jpg', 'assets/img/mentor/iiitd-panel.jpg', 'assets/img/mentor/iiitd-room.jpg'], link: 'https://www.linkedin.com/posts/onlyvibhor_futureofdesign-designinindia-ugcPost-7178051869905182721-0cdu/' },
  'mentor-designland': { title: 'Revolutionizing Design Workflows with AI', client: 'Designland', year: '2024', role: 'Virtual session', tagline: 'AI models, prompts and design workflows.', summary: 'A one-hour free virtual session covering AI models, crafting prompts and integrating AI into design workflows. 27 April 2024.', metrics: [], images: ['assets/img/mentor/designland.jpg', 'assets/img/mentor/designland-session.jpg'], link: 'https://www.linkedin.com/feed/update/urn:li:ugcPost:7190406843943256064/' },
  'mentor-xtended': { title: 'AI in Design: A Silent Revolution', client: 'xtended Pack Collective', year: '', role: 'Workshop', tagline: 'The future design world, with AI.', summary: 'Exploring the future design world with the power of AI.', metrics: [], images: ['assets/img/mentor/extended.jpg'], link: 'https://adplist.org/mentors/vibhor-mathur' },
  'mentor-designtank': { title: 'Design Tank, Season 2', client: 'Design Tank', year: '', role: 'Mentor', tagline: 'Portfolio feedback and mentorship.', summary: 'Portfolio feedback and mentorship alongside Fatema Raja and Amit Patel.', metrics: [], images: ['assets/img/mentor/designtank.jpg'], link: 'https://adplist.org/mentors/vibhor-mathur' },
  'mentor-groundbreakin': { title: 'The Groundbreakin Podcast, episode 046', client: 'Groundbreakin', year: '', role: 'Podcast', tagline: 'A podcast conversation about design.', summary: 'A podcast conversation about design.', metrics: [], images: ['assets/img/mentor/groundbreakin.jpg', 'assets/img/mentor/podcast.jpg'], link: 'https://adplist.org/mentors/vibhor-mathur' },
  // ---- Product launches on razorpay.com (cards only: the pages could not be captured here) ----
  upi: { title: 'Razorpay UPI', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'razorpay.com/upi', summary: 'Listed with the product launches. The page lives at razorpay.com/upi.', metrics: [], images: ['work/launch/upi.jpg'], link: 'https://razorpay.com/upi/', card: true },
  'upi-autopay': { title: 'Razorpay UPI Autopay', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'razorpay.com/upi-autopay', summary: 'Listed with the product launches. The page lives at razorpay.com/upi-autopay.', metrics: [], images: ['work/launch/upi-autopay.jpg'], link: 'https://razorpay.com/upi-autopay/', card: true },
  'digital-billing': { title: 'Razorpay Digital Billing', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'razorpay.com/digital-billing', summary: 'Listed with the product launches. The page lives at razorpay.com/digital-billing.', metrics: [], images: ['work/launch/digital-billing.jpg'], link: 'https://razorpay.com/digital-billing/', card: true },
  'agent-studio': { title: 'Razorpay Agent Studio', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'razorpay.com/agent-studio', summary: 'Listed with the product launches. The page lives at razorpay.com/agent-studio.', metrics: [], images: ['work/launch/agent-studio.jpg'], link: 'https://razorpay.com/agent-studio/', card: true },
  'launch-film-1': { title: 'Launch film 1', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'On YouTube', summary: 'Listed with the product launches; it opens on YouTube.', metrics: [], images: ['work/launch/launch-film-1.jpg'], link: 'https://www.youtube.com/watch?v=_o2QX5M_fhk', card: true },
  'launch-film-2': { title: 'Launch film 2', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'On YouTube', summary: 'Listed with the product launches; it opens on YouTube.', metrics: [], images: ['work/launch/launch-film-2.jpg'], link: 'https://www.youtube.com/watch?v=JXOzdo9S4F8', card: true },
  'launch-film-3': { title: 'Launch film 3', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'On YouTube', summary: 'Listed with the product launches; it opens on YouTube.', metrics: [], images: ['work/launch/launch-film-3.jpg'], link: 'https://www.youtube.com/watch?v=jpDzJMBPVas', card: true },
  'launch-post-1': { title: 'Launch post 1', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'On LinkedIn', summary: 'Listed with the product launches; it opens on LinkedIn.', metrics: [], images: ['work/launch/launch-post-1.jpg'], link: 'https://lnkd.in/p/gtcv3kws', card: true },
  'launch-post-2': { title: 'Launch post 2', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'On LinkedIn', summary: 'Listed with the product launches; it opens on LinkedIn.', metrics: [], images: ['work/launch/launch-post-2.jpg'], link: 'https://lnkd.in/p/gPDYCRuh', card: true },
  'launch-post-3': { title: 'Launch post 3', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'On LinkedIn', summary: 'Listed with the product launches; it opens on LinkedIn.', metrics: [], images: ['work/launch/launch-post-3.jpg'], link: 'https://lnkd.in/p/g3Q3X_PC', card: true },
  'launch-post-4': { title: 'Launch post 4', client: 'Razorpay', year: '', role: 'Product launch', tagline: 'On LinkedIn', summary: 'Listed with the product launches; it opens on LinkedIn.', metrics: [], images: ['work/launch/launch-post-4.jpg'], link: 'https://lnkd.in/p/gPxxPdbu', card: true },
  // ---- From Behance (imported: see src/content/projects/<slug>.json for the full case) ----
  'grofers-corporate': { title: "Grofers Corporate Films", client: 'Grofers (now Blinkit)', year: '2022', role: '', tagline: "Brief - We were asked to conceptualize and produce corporate films for grofers to presented in corporate events and digital medias. Films were based on growth o", summary: "Brief - We were asked to conceptualize and produce corporate films for grofers to presented in corporate events and digital medias. Films were based on growth of manufacturers who are working on grofers FMCG range of products.\n\n#GrowWithGrofers", metrics: [], images: ["work/bh/grofers-corporate-1.jpg"], link: 'https://www.behance.net/gallery/142589589/grofers-corporate-films' },
  'grofers-brand-films': { title: "Grofers Brand Campaign Films", client: 'Grofers (now Blinkit)', year: '2022', role: '', tagline: "Brief - We are asked to think of advertising films to promote grofers' customer promises on digital mediums. We wrote this funny banter between a non-grofers cu", summary: "Brief - We are asked to think of advertising films to promote grofers' customer promises on digital mediums. We wrote this funny banter between a non-grofers customer and a grofers customer talking about how the grofers service affects them, presented through a unique visual style of non-animated objects talking to each other.", metrics: [], images: ["work/bh/grofers-brand-films-1.jpg"], link: 'https://www.behance.net/gallery/142588745/grofers-brand-campaign-films' },
  'moms-priceless': { title: "Moms Make It Priceless", client: 'Grofers (now Blinkit)', year: '2022', role: '', tagline: "Client: grofers", summary: "Mothers Day Campaign\n\nClient: grofers\nIdea: Zahid Shaikh, Vibhor Mathur\nProduced: Shutterhead Films\n\n153k Views\n7.6k Likes\n339 Comments", metrics: [], images: ["work/bh/moms-priceless-1.jpg"], link: 'https://www.behance.net/gallery/152242623/Moms-Make-it-Priceless-Social-Campaign' },
  'timeformom': { title: "#TimeForMom", client: 'Grofers (now Blinkit)', year: '2021', role: '', tagline: "#TimeForMom", summary: "#TimeForMom\n\n\nWith managing kids, their jobs, household work, buying groceries - Indian moms have a lot in their plate. As Grofers, we solve for atleast one of their huge list.", metrics: [], images: ["work/bh/timeformom-1.jpg"], link: 'https://www.behance.net/gallery/122915851/TimeForMom-Mothers-Day-campaign-for-Grofers' },
  'rakhi': { title: "Grofers Rakhi Campaign", client: 'Grofers (now Blinkit)', year: '2018', role: '', tagline: "Grofers Rakhi Social Media Campaign", summary: "Grofers Rakhi Social Media Campaign\n\n\nRakshabandhan is the festival celebrated to cherish the siblings relationship. We created this campaign to celebrate the joy of the festival between siblings who live away from each other and only get to meet on the festival. This campaign was made in collaboration with KitKat and we cracked the idea of #throwbackthursday with Rakhi to create the campaign.", metrics: [], images: ["work/bh/rakhi-1.jpg", "work/bh/rakhi-2.jpg"], link: 'https://www.behance.net/gallery/69398709/Grofers-Rakhi-Social-Media-Campaign' },
  'emotions-stickers': { title: "Emotions of Women (Grocery Saga)", client: 'Grofers (now Blinkit)', year: '2022', role: '', tagline: "Emotions of Women (Grocery Saga) - Sticker Designs", summary: "Emotions of Women (Grocery Saga) - Sticker Designs", metrics: [], images: ["work/bh/emotions-stickers-1.jpg", "work/bh/emotions-stickers-2.jpg", "work/bh/emotions-stickers-3.jpg", "work/bh/emotions-stickers-4.jpg", "work/bh/emotions-stickers-5.jpg", "work/bh/emotions-stickers-6.jpg", "work/bh/emotions-stickers-7.jpg", "work/bh/emotions-stickers-8.jpg", "work/bh/emotions-stickers-9.jpg", "work/bh/emotions-stickers-10.jpg", "work/bh/emotions-stickers-11.jpg", "work/bh/emotions-stickers-12.jpg", "work/bh/emotions-stickers-13.jpg", "work/bh/emotions-stickers-14.jpg"], link: 'https://www.behance.net/gallery/122778533/Emotions-of-Women-Grocery-Saga-Sticker-Designs' },
  'diwali-recipes': { title: "Diwali Recipe Videos", client: 'Grofers (now Blinkit)', year: '2022', role: '', tagline: "​​​​​​​Director : Zahid Shaikh", summary: "Recipes Videos for grofers\n\n​​​​​​​Director : Zahid Shaikh\nProduced, DOP, Edit : Vibhor Mathur", metrics: [], images: ["work/bh/diwali-recipes-1.jpg", "work/bh/diwali-recipes-2.jpg"], link: 'https://www.behance.net/gallery/152241955/Diwali-Recipe-Videos' },
};

// The centre of the village: Communication Design HQ under the jamun tree.
export const CENTER = {
  id: 'hq',
  name: 'Creative Direction & Culture',
  place: 'The Jamun Tree',
  color: '#d9a441',
  lead: 'No projects here: this is how the studio thinks. The culture, values, art and systems I bring to every team, under the tree where every road starts.',
  how: [
    'Design for the business, not just the brief',
    'Build a culture that can take risks: brainstorms as hubs of collaboration, where trying something bold does not mean fearing failure',
    'Keep widening the toolkit: continuous learning keeps a team competitive, and engaged',
    'Production systems, not one-offs: one idea carried across the film, the page, the feed and the front page',
    'Make goals measurable',
  ],
  makes: ['Creative direction', 'Studio culture', 'Systems', 'Art'],
  projects: [],
  count: '5',
  countLabel: 'beliefs',
  quotes: [
    'Welcome! Every road from here leads to a part of the work.',
    'The board under the tree is how a brief moves through the studio.',
    'Find the four golden trophies hidden around the village.',
    'Press O for a bird’s-eye view, or T for the guided tour.',
  ],
};

// Each hamlet is one department. `activity` picks the props and what the villagers do.
// Six slots round the tree make the village's plan (its roads, the pond, the bazaar all hang off
// them). Four hold departments; the two marked `empty` are the corners the AI Lab and the Hall of Fame stand on.
export const HAMLETS = [
  {
    id: 'brand',
    name: 'Brand',
    place: 'The Arena',
    color: '#2f6bff',
    activity: 'arena',
    lead: 'Advertising and brand love: TVCs, brand films, print and newspaper ads, OOH and billboards.',
    how: [
      'Turn the campaign idea into a film, broadcast and print system',
      'Art-direct AI-led TVCs end to end, with brand managers and agency partners',
      'One visual language from the TV spot to the newspaper front page and the billboard',
    ],
    makes: ['TVCs', 'Brand films', 'Print & newspaper', 'OOH & billboards'],
    projects: ['btb', 't20', 'grofers-brand-films', 'moms-priceless', 'timeformom', 'grofers-corporate'],
    wallTitle: 'More\nbrand\nwork',
    quotes: [
      '81 films across 20 match days. Not one camera, set or light.',
      'Thirty founders, one photograph each. We broke glass, walls and ceilings.',
      'Brand love is built one film, one billboard, one front page at a time.',
    ],
  },
  {
    id: 'pmm',
    name: 'Product Launches',
    place: 'Launch Field',
    color: '#00a79d',
    activity: 'launch',
    lead: 'Launches of digital and physical products: GTM campaigns, launch videos, landing pages and marketing collaterals.',
    how: [
      'Launch films that explain complex payments simply',
      'Landing pages designed as worlds, not feature lists, and even a playable game',
      'Campaign identities and collaterals for new products, built with AI workflows',
    ],
    makes: ['Launch videos', 'Landing pages', 'GTM campaigns', 'Collaterals'],
    projects: ['ring', 'magic-checkout', 'ace', 'trial', 'passport', 'whatsapp', 'money', 'upi', 'upi-autopay', 'digital-billing', 'agent-studio', 'launch-film-1', 'launch-film-2', 'launch-film-3', 'launch-post-1', 'launch-post-2', 'launch-post-3', 'launch-post-4'],
    wallTitle: 'More\nlaunches',
    quotes: [
      'Netbanking got a redemption arc. Beat an opponent, unlock a feature.',
      'MoneySaver reached 29.1 million people across 32+ stories.',
      'Passport For Your Product: 50% view-through on LinkedIn.',
    ],
  },
  { id: 'product', empty: true, name: 'Hall of Fame corner', color: '#f5b700' },
  {
    id: 'social',
    name: 'Social',
    place: 'Beacon Hill',
    color: '#ff4f8b',
    activity: 'beacon',
    lead: 'Facebook and Instagram: content and engagement campaigns people want to join.',
    how: [
      'Always-on content that stays on-brand at high volume',
      'Festival and moment campaigns: Rakhi, Diwali, Valentine’s Day',
      'Stop motion, comics, stickers and recipe videos made for the feed',
    ],
    makes: ['Instagram', 'Facebook', 'Engagement', 'Stop motion'],
    projects: ['t20', 'rakhi', 'winter-foods', 'emotions-stickers', 'love-story', 'diwali-2020', 'diwali-recipes', 'grofery', 'conv'],
    wallTitle: 'More\nsocial\nwork',
    quotes: [
      '200+ posts for T20, including founders who weren’t on TV.',
      'Groceries come alive when nobody is watching. That was Grofery Talks.',
      'Every festival is a new conversation with the feed.',
    ],
  },
  {
    id: 'mentorship',
    name: 'Mentorship',
    place: 'The Mentors’ Court',
    color: '#f2a516',
    activity: 'mentor',
    lead: 'Sharing what I’ve learned, one designer at a time: one-to-one mentoring, workshops on AI in design, talks and panels.',
    how: [
      '60-minute one-to-one sessions on ADPList: 33 sessions, 31 hours',
      'Workshops on AI in design, from GrowthSchool and Designland to college classrooms',
      'Panels, podcasts and portfolio reviews',
    ],
    makes: ['One-to-one mentoring', 'Workshops', 'Talks', 'Panels'],
    projects: ['mentor', 'mentor-samanvaya', 'mentor-growthschool', 'mentor-iiitd', 'mentor-designland', 'mentor-xtended', 'mentor-designtank', 'mentor-groundbreakin'],
    wallTitle: 'Talks &\nworkshops',
    quotes: [
      'He felt more like an elder brother than just a mentor.',
      'Bring your portfolio. We’ll find where to push next.',
      'Workshops teach what the studio is learning.',
    ],
  },
  { id: 'design', empty: true, name: 'AI Lab corner', color: '#00c2ff' },
];
export const DEPARTMENTS = HAMLETS.filter((h) => !h.empty);

// A quiet spot by the pond: after-hours art.
export const LAB = {
  id: 'lab',
  name: 'The Night Lab',
  place: 'By the pond',
  color: '#3fb6d9',
  lead: 'After hours, by the water: art to sit with. Found objects, Eyes, Birds and three AI films.',
  how: ['Personal art that feeds the day job', 'Sit on the bench and watch the work, one piece at a time'],
  makes: ['Found-object art', 'Art series', 'AI films'],
  projects: ['power', 'eyes', 'birds', 'khwaab', 'houseparty', 'undying-light'],
  quotes: ['Sit for a while. The screen changes when you’re ready.', 'Everyday objects can be small vessels of emotion and meaning.'],
};

// Vibhor's home: about, path, and a way to reach him.
export const HOME = {
  id: 'home',
  name: 'Vibhor’s Home',
  place: 'Jaipur Pink House',
  color: '#e0786a',
  lead: 'Self-taught designer from Jaipur, engineer by degree, now in Bengaluru. Knock on the door, or drop a note in the mailbox.',
  how: [
    'Designing narratives by day, crafting emotions through art by night',
    'Eleven years across consumer commerce and fintech: Grofers (now Blinkit), then Razorpay',
    'Open to conversations about creative leadership, AI-native studios and award-worthy work',
  ],
  makes: ['Creative leadership', 'AI-native production', 'Mentoring'],
  projects: [],
  quotes: ['Welcome home! The mailbox by the gate goes straight to Vibhor’s inbox.', 'The pink walls are a nod to Jaipur, where it all started.'],
};

// The entertainment and hobby zone.
export const FUN = {
  id: 'fun',
  name: 'The Playground',
  place: 'Art & play',
  color: '#ff9f1c',
  lead: 'The work made for fun: the art series Eyes and Birds, found-object art, and stop motion.',
  how: [
    'Stop-motion animation on a tabletop set: All Things A and the Modern Junkyard films',
    'Found-object art: everyday things turned into small vessels of emotion',
    'Eyes and Birds: art series, one frame at a time',
  ],
  makes: ['Stop motion', 'Found objects', 'Art series'],
  projects: ['eyes', 'birds', 'power', 'urbanclap', 'modern-junkyard', 'veggie-people', 'holi-stop-motion', 'valentines-week'],
  quotes: ['Grab some popcorn. The screen is showing the stop-motion films.', 'Eyes and Birds play in the gallery, frame by frame.'],
};

// The AI Hub: where design and AI become tools and automations for the whole organisation.
export const AIHUB = {
  id: 'ai',
  name: 'AI Lab',
  place: 'Tools, films & automation',
  color: '#00c2ff',
  lead: 'Design plus AI, turned into tools the whole organisation uses. Repetitive work becomes a button; designers ship what used to wait in a queue.',
  how: [
    'Automate the set tasks: one founder photo in, a 4K campaign library out',
    'Scale production: 81 TV films, a newspaper front page and 200+ posts from one pipeline',
    'Make AI easy to learn: interfaces, not prompts, so beginners are productive on day one',
    'Let designers ship interactive web, landing pages and games themselves',
  ],
  makes: ['In-house AI tools', 'Automation pipelines', 'AI films', 'AI images'],
  projects: ['toolkit', 'undying-light', 'khwaab', 'houseparty', 'jaipur-ai'],
  quotes: ['Prompts are inputs. Tools are modules. Systems create consistency.', 'Every tool here started as a task we were tired of repeating.'],
};

export const HALL = {
  id: 'awards',
  name: 'Hall of Fame',
  place: 'Awards & recognition',
  color: '#f5b700',
  lead: 'Work that wins rooms, juries and, more importantly, customers.',
  how: [
    'Trial of the Century: Shorty Awards winner for Generative AI',
    'Kyoorius 2026 First List for Film Craft and Use of Technology & AI',
    'ET Brand Disruption Gold for the Razorpay Creative & Design Team',
  ],
  makes: ['Shorty Awards', 'Kyoorius', 'ET Brand Disruption'],
  projects: ['trial', 't20', 'btb'],
  quotes: ['Every trophy here started as a brief nobody thought could be fun.', 'The animal courtroom took home the Shorty for Generative AI.'],
};

export const AWARD_LIST = [
  { show: 'Shorty Awards', year: '2026', title: 'Winner', category: 'Generative AI', project: 'trial', tier: 'gold' },
  { show: 'Shorty Awards', year: '2026', title: 'Gold Honor', category: 'Financial Services', project: 'trial', tier: 'gold' },
  { show: 'Shorty Awards', year: '2026', title: 'Finalist', category: 'Community Engagement', project: 'trial', tier: 'silver' },
  { show: 'Kyoorius Creative Awards', year: '2026', title: 'First List', category: 'Film Craft', project: 'trial', tier: 'silver' },
  { show: 'Kyoorius Creative Awards', year: '2026', title: 'First List', category: 'Use of Technology & AI', project: 'trial', tier: 'silver' },
  { show: 'ET Brand Disruption Awards', year: '2026', title: 'Gold', category: 'Most Disruptive Creative & Design Team', project: null, tier: 'gold' },
  { show: 'ET Brand Disruption Awards', year: '2026', title: 'Silver', category: 'Most Disruptive B2B Campaign', project: 'trial', tier: 'silver' },
];

// The AI stack used across the studio's tools and films (from the portfolio's toolkit and case studies).
export const TOOLS = [
  { name: 'Gemini & AI Studio', use: 'Tool interfaces and reasoning' },
  { name: 'Nano Banana API', use: 'Image generation and editing inside the tools' },
  { name: 'Midjourney', use: 'Concept art and campaign worlds' },
  { name: 'ChatGPT', use: 'Scripts, prompts and pipelines' },
  { name: 'Claude', use: 'Writing and building tools' },
  { name: 'Replit', use: 'Shipping tools and web experiences' },
  { name: 'RunwayML', use: 'AI video' },
  { name: 'Kling', use: 'AI video' },
  { name: 'Veo 2', use: 'AI video' },
  { name: 'Higgsfield', use: 'Cinematic AI video' },
  { name: 'ElevenLabs', use: 'Voice' },
  { name: 'Suno AI', use: 'Music' },
  { name: 'Topaz Labs', use: 'Upscaling' },
  { name: 'Adobe Firefly', use: 'Generative fill and edits' },
  { name: 'Stable Diffusion + ControlNet', use: 'Controlled image generation' },
  { name: 'Ideogram', use: 'Type in images' },
  { name: 'Blender & Spline', use: '3D' },
  { name: 'Photoshop · After Effects · Illustrator', use: 'Finishing' },
];

// Films, shows and references. `influences` are documented in the case studies.
// Add personal favourites to `films` / `shows` as { title, year, note } and they appear on the poster wall.
export const FAVOURITES = {
  influences: [
    { title: 'Damini', year: '1993', note: 'Its "sawaal pe sawaal" courtroom scene inspired Trial of the Century.' },
    { title: 'Panchatantra', year: 'Fables', note: 'The animal courtroom of Trial of the Century draws on these stories.' },
    { title: 'Absolut × Warhol', year: '1985', note: 'The bottle-as-canvas campaign behind Absolut Landscapes.' },
  ],
  films: [],
  shows: [],
};

// Contact form. Set `endpoint` to a form service URL (e.g. Formspree) to send in-page; otherwise it opens email.
export const CONTACT = {
  endpoint: '',
  intents: ['A full-time role', 'A project or collaboration', 'Mentoring', 'A talk or workshop', 'Just saying hi'],
};

// Optional generated assets (e.g. from Higgsfield). Drop files in public/assets and set paths here.
export const ASSETS = {
  skybox: null, // equirectangular panorama, e.g. 'assets/sky.jpg'
};

// What villagers think about (their next idea, objective, or AI in their field),
// and what they ask when you walk up to them.
export const NPC_TALK = {
  brand: {
    roles: ['Brand manager', 'Creative director', 'Film producer', 'Brand strategist'],
    thoughts: [
      'Next idea: a founder stadium for IPL 2027?',
      'Objective: one visual language from TV to print.',
      'AI: could we pre-viz every TVC in a day?',
      'What if the jersey became the whole campaign?',
      'Next tentpole is GFF. Needs a film people talk about.',
      '81 films from one pipeline. Our own design team built it.',
      'Same founder, same costume: TV, print and social all match.',
    ],
    asks: [
      'Vibhor! Can we storyboard the next tentpole film together?',
      'Could your team turn our brand book into an AI style system?',
      'Want to do another 100% AI launch film with us?',
    ],
  },
  pmm: {
    roles: ['Product marketing manager', 'Growth marketer', 'Media planner'],
    thoughts: [
      'Objective: explain the new product in 45 seconds.',
      'AI: product shots without booking a studio?',
      'Idea: a launch film for every persona.',
      'Next: performance ads that still look premium.',
      'MoneySaver: our biggest launch on our own channels.',
      'The BTS film became content too. 313K impressions!',
    ],
    asks: [
      'Can we use the Product Image Generator for our next launch?',
      'Help us crack the story for the next exporter launch?',
      'Could the studio make 20 ad variants by Friday?',
    ],
  },
  product: {
    roles: ['Product manager', 'Web designer', 'Frontend engineer', 'Merchant success'],
    thoughts: [
      'Idea: a checkout you can actually play with.',
      'Objective: turn the feature list into a world.',
      'AI: designers shipping landing pages without a dev queue?',
      'Next relaunch could be a game. Again?',
      'A 30-second UI brief became a film, a page and a game.',
      'Magic on the surface, science underneath.',
    ],
    asks: [
      'Can our next landing page be a game, like Back in the Ring?',
      'Vibhor, can design own the motion on our launch page?',
      'Could we film more merchant stories this quarter?',
    ],
  },
  social: {
    roles: ['Social lead', 'Creator', 'Community manager'],
    thoughts: [
      'Idea: Razorbae, season two?',
      'Objective: 30 posts a week, all on-brand.',
      'AI: auto-cut reels straight from the TVC?',
      'Next trend: founder POV videos.',
      'One founder photo in, a finished post out.',
      'The Wall of Laughter got HRs talking. Anonymously.',
    ],
    asks: [
      'Can Social Content Gen do Hindi and Tamil posts next?',
      'Shall we co-create a new AI avatar series?',
      'Could we run another Wall of Laughter, for founders this time?',
    ],
  },
  mentorship: {
    roles: ['Mentee', 'Design student', 'Workshop attendee', 'Young designer'],
    thoughts: [
      'Bring the portfolio. Ask what to push next.',
      'Objective: understand what is expected of a designer.',
      'AI: how do I bring it into my design workflow?',
      'Next: present my work with more confidence.',
      'The workshop on AI in design changed how I start a brief.',
    ],
    asks: [
      'Vibhor, could you review my portfolio this week?',
      'Can I book a session on ADPList?',
      'Will you run the AI in design workshop again?',
    ],
  },
  design: {
    roles: ['Designer', 'Motion designer', '3D artist', 'Design intern'],
    thoughts: [
      'Idea: a motion tool next to the Cinematography Tool?',
      'Objective: every deck on the new design language.',
      'AI: teach the Founder tool some new poses.',
      'Crit is Friday. Bring work in progress!',
      'I directed my first merchant film. Over Zoom.',
      'Prompts are inputs. Tools are modules. Systems create consistency.',
    ],
    asks: [
      'Vibhor, could you review my portfolio this week?',
      'Can I join the next AI design workshop?',
      'Can we pair on the next tool for the studio?',
    ],
  },
  hq: {
    roles: ['Studio designer', 'Studio producer', 'Visiting marketer'],
    thoughts: ['Coffee first, then ideas.', 'What would make this award-worthy?', 'Does this brief serve the business?', 'AI: what can we automate next?', 'One idea, every touchpoint.', 'How do we measure this one?'],
    asks: ['Got a minute for a quick crit?', 'New brief on the board: which team does it go to first?', 'Want to grab a filter coffee and jam on ideas?'],
  },
  awards: {
    roles: ['Awards curator', 'Visiting juror', 'Creative director'],
    thoughts: ['Which entry goes in next year?', 'Craft and results. Juries want both.', 'Idea: a case film for every big campaign.'],
    asks: ['Vibhor, can we write the awards entry for the IPL campaign together?', 'Would you judge the student design awards this year?'],
  },
  ai: {
    roles: ['AI designer', 'Automation engineer', 'Prompt designer', 'Workshop lead'],
    thoughts: [
      'Next tool: a motion generator for social cut-downs?',
      'Objective: every repeating task becomes a button.',
      'AI: can the Founder tool keep faces consistent at 8K?',
      'Workshop next week: AI for beginners.',
      'What if Veo and the Cinematography Tool talked to each other?',
    ],
    asks: [
      'Vibhor, can we turn the deck builder into an AI tool next?',
      'Could you review the new pipeline before we ship it to marketing?',
      'Want to co-host the next AI design workshop?',
    ],
  },
  lab: {
    roles: ['Artist'],
    thoughts: ['What shape hides inside this landscape?', 'Stop motion tonight?'],
    asks: ['Want to try a ControlNet experiment together?'],
  },
  home: {
    roles: ['Neighbour', 'Visitor'],
    thoughts: ['I should write to Vibhor about that project.', 'Nice pink walls. Very Jaipur.'],
    asks: ['Are you here to see Vibhor? The mailbox is by the gate.'],
  },
  fun: {
    roles: ['Movie buff', 'Stop-motion animator', 'Gamer'],
    thoughts: ['One more frame... 24 per second is a lot.', 'Popcorn break!', 'High score: Back in the Ring, level 3.'],
    asks: ['Want to animate a scene with me?', 'Seen the studio’s films on the big screen yet?'],
  },
};

// ---------------------------------------------------------------------------
// The creative leader: what changes beyond any one team. Every line below is
// taken from the about page, the leadership notes and the case studies.
// ---------------------------------------------------------------------------
export const LEADER = {
  eyebrow: 'Creative leadership',
  title: 'One studio. Every team. One story.',
  line: 'My job is the roads between the teams: one idea carried from the brief to the film, the landing page, the feed and the front page, so a growing company sounds like one brand.',
  impact: [
    { value: '3', label: 'businesses on one visual system', text: 'One visual system and one way of telling stories across Payments, RazorpayX and POS.' },
    { value: '10+', label: 'product lines on one deck language', text: 'A deck design language now used across more than ten product lines and business units.' },
    { value: '4', label: 'in-house AI tools', text: 'Tools the whole team uses on live campaigns: repetitive work becomes a button.' },
    { value: '1→3', label: 'brief to film, page and game', text: 'Back in the Ring: a brief for a 30-second UI video became a trailer, a landing page and a playable game, built in-house.' },
    { value: '81', label: 'TV films from one pipeline', text: 'Production systems, not one-offs: one pipeline made 81 TV films, a newspaper front page and 200+ posts.' },
    { value: 'Gold', label: 'ET Brand Disruption, the team', text: 'Most Disruptive Creative & Design Team, 2026: the award is for the studio, not one campaign.' },
  ],
  people: [
    'Hired and developed the creative team at Grofers, and directed external production partners.',
    'Hire, coach and grow designers into a studio at Razorpay: designers who now direct films and ship pages.',
    'Mentor on ADPList and GrowthSchool; AI design workshops and talks from IIIT-Delhi to JK Lakshmipat University.',
  ],
  quote: { text: 'He felt more like an elder brother than just a mentor.', who: 'Vibhu Kapil, visual and motion designer, on ADPList' },
};

// The four things every campaign has to do. Each project's play says how it did them.
export const LENSES = [
  { id: 'work', name: 'Make it work', icon: '⚙', color: '#00c2ff', ask: 'Can it be made, on time, at the scale the business needs?' },
  { id: 'convert', name: 'Convert', icon: '↗', color: '#12c98a', ask: 'Does it move the number the business cares about?' },
  { id: 'impress', name: 'Leave an impression', icon: '✺', color: '#ff4f8b', ask: 'Will people remember it, share it and talk about it?' },
  { id: 'brand', name: 'Shape the brand', icon: '◆', color: '#f5b700', ask: 'Does it make the brand look like the company it wants to become?' },
];

// How a brief moves through the studio: painted on the board at the jamun tree.
export const METHOD = [
  { step: 'Brief', line: 'Design for the business, not just the brief.' },
  { step: 'Insight', line: 'Start from data, consumer interviews and what past campaigns taught us.' },
  { step: 'Idea', line: 'One idea across every touchpoint: film, page, game, feed, print.' },
  { step: 'Craft', line: 'AI is the production medium. Every frame is still directed.' },
  { step: 'Scale', line: 'Build repeatable production systems, not one-offs.' },
  { step: 'Proof', line: 'Make goals measurable.' },
];

// How each campaign was cracked: the problem, the idea, the craft, and what it did on each lens.
export const PLAYS = {
  t20: {
    kind: 'Tentpole brand campaign',
    problem: 'India celebrates cricketers and founders equally. Only one gets a stadium.',
    idea: 'Put founders on the screen cricket fans are already watching, with a stadium, a jersey and a player card.',
    craft: 'A custom avatar tool turned one photo per founder into a campaign library, lit three ways for every match slot.',
    lenses: {
      work: '81 TV films across 20 match dates. No cameras, sets or lights.',
      convert: '133% lift in purchase intent.',
      impress: '8.1M unique viewers and 928K LinkedIn impressions.',
      brand: 'Designed to look like the broadcast, not interrupt it: founders who belonged on that screen.',
    },
  },
  btb: {
    kind: 'Tentpole brand film',
    problem: 'Thirty busy founders in one frame, breaking glass, walls and ceilings: almost impossible to shoot.',
    idea: 'Make breaking through literal. Each film opens on what a founder was told, and ends with "did it anyway".',
    craft: 'AI-led end to end, not AI-assisted: one photograph per founder, 30 founder films, a launch film, teasers and music.',
    lenses: {
      work: 'Thirty founders. One frame. Zero logistics, zero live-action shoots.',
      impress: 'IPL 2026 on JioHotstar, one of the biggest stages in Indian marketing.',
      brand: 'Razorpay backing the founders who were told it would never work.',
    },
  },
  ace: {
    kind: 'Launch film',
    problem: 'Introduce one integration for agentic commerce, on an incredibly tight timeline.',
    idea: 'One founder’s POV in one continuous world, from a grand marble hall to a glowing tech studio.',
    craft: 'Every environment, character and frame made with AI, and directed like a full-scale production.',
    lenses: {
      work: 'Built under an incredibly tight timeline for GFF 2026.',
      brand: 'A locked, high-contrast visual style: complexity giving way to the agentic era.',
    },
  },
  intl: {
    kind: 'Product explainer',
    problem: 'International payments are technical and hard to follow.',
    idea: 'Demystify global e-commerce payments in under a minute.',
    craft: 'A 40 to 60 second motion graphics film in Illustrator and After Effects.',
    lenses: { work: 'Complex financial processes, turned into one clear story.', impress: '1000+ organic views.' },
  },
  money: {
    kind: 'Product launch',
    problem: 'A high-stakes launch: India’s first PA/PG with an OPGSP compliant solution, for exporters.',
    idea: 'An AI-made launch film, and a media plan that showed the AI workflow in the open.',
    craft: 'Midjourney, Studio D-ID and ElevenLabs, then a behind-the-scenes film on LinkedIn.',
    lenses: {
      convert: '70+ quality leads, and an 89.62% engagement rate on the launch blog.',
      impress: '438K+ views: the biggest product launch on Razorpay’s own channels. 29.1M media reach.',
      brand: 'The behind-the-scenes post reached 313K people: the process became content too.',
    },
  },
  passport: {
    kind: 'Brand campaign for a launch',
    problem: 'Make borderless business feel effortless.',
    idea: 'A distinctive campaign identity built with a new AI workflow.',
    craft: 'Taken to YouTube, LinkedIn and Meta, with a behind-the-scenes film.',
    lenses: {
      convert: '94 leads and 35% lower buy rates.',
      impress: '50% view-through on LinkedIn; 60K+ impressions for the BTS film.',
      brand: 'Positioned Razorpay as a forerunner in fintech, showing effortless global expansion.',
    },
  },
  whatsapp: {
    kind: 'Product launch',
    problem: 'Launch payments on WhatsApp, and make people feel something about a cart.',
    idea: '"Melancholy": the silent stories of abandoned carts, turned into stories of completion. Shop. Don’t abandon.',
    craft: 'Three concepts from brainstorms with marketing and design; AI imagery; led from concept to completion.',
    lenses: {
      convert: '2000+ businesses interested in the product.',
      impress: '95K+ impressions; 10% engagement on Twitter, 4.5% on LinkedIn.',
    },
  },
  'magic-checkout': {
    kind: 'Conversion landing page',
    problem: 'Checkout technology is complex, and feature lists don’t sell it.',
    idea: 'Don’t explain checkout. Let people feel it.',
    craft: 'Four stories on floating islands, then the world turns into a wireframe to reveal the science underneath.',
    lenses: {
      convert: 'Built around four outcomes a merchant cares about: conversion, COD control, purchase intent, loyalty.',
      impress: 'Micro-animations that make every interaction feel alive.',
      brand: 'Magic on the surface. Science underneath.',
    },
  },
  ring: {
    kind: 'Relaunch: film, page and game',
    problem: 'Netbanking felt like an old champion, written off in the age of one-tap UPI and cards.',
    idea: 'A comeback story: a boxing film, not a product update. One idea across a trailer, a landing page and a game.',
    craft: 'A fully in-house, fully AI-made trailer. Claude kept shots consistent as creative director; one colour grade per act.',
    lenses: {
      work: 'A brief for a 30-second UI video became a trailer, a landing page and a playable game.',
      convert: 'The page hands off from emotion to proof; every opponent you beat unlocks a feature.',
      impress: 'Don’t just watch the comeback. Play it.',
      brand: 'No faces: NETBANKING on the robe, RAZORPAY on the jacket. The brand is the hero of every frame.',
    },
  },
  conv: {
    kind: 'Proof: merchant films',
    problem: 'Merchants trust other merchants more than claims.',
    idea: 'Let them say it in their own words: Isak Fragrances and VS Mani Filter Coffees.',
    craft: 'A remote shoot over Zoom and an on-site shoot, by young designers learning to direct.',
    lenses: { work: 'Designers learning to direct, one shot at a time.', convert: 'Real businesses on how Magic Checkout changed their sales.' },
  },
  trial: {
    kind: 'B2B awareness campaign',
    problem: 'HR is the right audience for Payroll, and notoriously hard to engage.',
    idea: 'For HR, Salary Day is a week-long nightmare. Put the repetition on trial, in an animal courtroom after the Panchatantra and Damini’s "sawaal pe sawaal".',
    craft: 'An AI film, plus the Wall of Laughter: an anonymous board where HRs shared their funniest salary questions.',
    lenses: {
      convert: '13% lead uplift and a 16% traffic surge.',
      impress: '2.1M+ impressions; 8.64% engagement, four times the B2B fintech average.',
      brand: 'The story moved from "HR failure" to "systemic gap", and startups across HR joined in.',
    },
  },
  'social-gen': {
    kind: 'Production system',
    problem: 'A tentpole campaign needs hundreds of on-brand posts, fast.',
    idea: 'Turn the design session into a pipeline.',
    craft: 'A founder photo and business story in; preset clothing, pose, light and background; a campaign-ready post out.',
    lenses: { work: '200+ posts from one pipeline, including founders who never appeared on TV.' },
  },
  razorbae: {
    kind: 'Always-on system',
    problem: 'Always-on social needs a face, every week.',
    idea: 'Shoot a brand avatar once, then train it into a system.',
    craft: 'A repeatable AI avatar pipeline for reels.',
    lenses: { work: 'Captured once, used for months.', impress: '129 reels and 6.55M views.' },
  },
  toolkit: {
    kind: 'Studio tools',
    problem: 'The same set tasks, every campaign.',
    idea: 'Tools that make the work, built by the people who make the work.',
    craft: 'Cinematography Tool, Product Image Generator, Advanced Image Editor and Founder Image Generator.',
    lenses: { work: '4 AI tools in production on live campaigns.', brand: '20+ lenses and 100+ grades, so every campaign keeps its look.' },
  },
  'diwali-2020': {
    kind: 'Purpose-led social',
    problem: 'Local potters depend on the Diwali season.',
    idea: 'Ek diye se do ghar roshan: one diya lights up two homes.',
    craft: 'A social campaign that gave potters a platform on Grofers for their diyas, idols and planters.',
    lenses: { brand: 'A grocery app that lit up the homes of the people who made the diyas.' },
  },
};

// Run a campaign: pick up a brief at the jamun tree and carry it through the teams it really went through.
export const CAMPAIGNS = [
  {
    id: 'trial',
    slug: 'trial',
    title: 'Trial of the Century',
    brief: 'RazorpayX Payroll needs HR professionals to notice it. They rarely engage with branded content.',
    stops: [
      { place: 'hq', title: 'Find the insight', text: 'For employees, Salary Day is the best day of the month. For HR it is a week-long nightmare: the same payslip questions, every month.' },
      { place: 'hq', title: 'Crack the idea', text: 'If the same questions come back every month, the system needs fixing, not the people. Put the repetition on trial, in an animal courtroom.', near: true },
      { place: 'ai', title: 'Make it with AI', text: 'An animal courtroom inspired by the Panchatantra and the "sawaal pe sawaal" scene from Damini, made as an AI film.' },
      { place: 'social', title: 'Give HR a voice', text: 'The Wall of Laughter: an anonymous board where HRs shared the funniest salary questions they had ever received.' },
      { place: 'pmm', title: 'Launch it, win the room', text: 'Launched for RazorpayX Payroll; Shorty Awards winner for Generative AI, Kyoorius First List, ET Brand Disruption Silver.' },
    ],
  },
  {
    id: 't20',
    slug: 't20',
    title: 'Start-Up Champions',
    brief: 'Back India’s start-up founders during the T20 World Cup, when the whole country is watching.',
    stops: [
      { place: 'brand', title: 'The idea', text: 'Treat founders the way the country treats cricketers: a stadium, a jersey and a player card.' },
      { place: 'ai', title: 'Build the pipeline', text: 'A custom avatar tool on the Nano Banana API and Gemini: one photo per founder in, a 4K campaign library out.' },
      { place: 'brand', title: 'Go on air', text: '81 TV films across 20 match dates, each founder lit three ways to match the match slot. Zero shoots.' },
      { place: 'social', title: 'Scale it', text: '200+ social posts from the same pipeline, including founders who never appeared on TV. Then the newspaper front page.' },
    ],
  },
  {
    id: 'ring',
    slug: 'ring',
    title: 'Back in the Ring',
    brief: 'Bring Netbanking back into the conversation, in the age of one-tap UPI. The brief was a 30-second UI video.',
    stops: [
      { place: 'hq', title: 'Reframe it', text: 'Not a legacy payment method: an old champion, written off by everyone, making its comeback.' },
      { place: 'ai', title: 'Shoot without a camera', text: 'A fully in-house, AI-made boxing trailer. Claude as a consistent creative director; one colour world for every act.' },
      { place: 'pmm', title: 'From emotion to proof', text: 'A parallax landing page that lands each feature like a fresh combo.' },
      { place: 'fun', title: 'Make it playable', text: 'A browser boxing game: each opponent is an old Netbanking frustration, each win unlocks a feature.' },
    ],
  },
  {
    id: 'money',
    slug: 'money',
    title: 'MoneySaver launch',
    brief: 'Launch India’s first PA/PG with an OPGSP compliant solution, for Indian exporters.',
    stops: [
      { place: 'pmm', title: 'Frame the launch', text: 'Open a bank account in your choice of country in under 5 seconds; save up to 50% on transfer charges.' },
      { place: 'ai', title: 'Make the film with AI', text: 'Midjourney, Studio D-ID and ElevenLabs: a launch film made entirely with AI design tools.' },
      { place: 'social', title: 'Show the process', text: 'A behind-the-scenes film of the AI workflow: 313K impressions on LinkedIn.' },
      { place: 'hq', title: 'Measure it', text: '438K+ views, 29.1M media reach across 32+ stories, 70+ quality leads.' },
    ],
  },
];

// Two hidden places: one for each chapter of the career, found off the paths (in the woods and by the
// sea). Every line is from the about page, its timeline and the projects of that time.
export const CAREERS = {
  grofers: {
    id: 'grofers',
    org: 'Grofers (now Blinkit)',
    years: 'Mar 2015 — Oct 2021',
    role: 'Associate Director, Marketing Design · Gurugram',
    color: '#f7913a',
    place: 'In the woods',
    headline: 'Over six years in marketing design, and a creative team built along the way.',
    story: [
      'At Grofers, which became Blinkit, I spent over six years in marketing design: integrated campaigns around the app’s recurring sale events, social content, app visual identities, and the hiring and development of a creative team. I left as Associate Director in October 2021.',
    ],
    did: [
      'Integrated advertising for recurring sale events, social campaigns and app visual identities.',
      'Hired and developed the creative team and directed external production partners.',
      'One way for every team to use the logo: the Grofers logo guidelines.',
      'Social campaigns: a mango’s journey to the top of the app, a Valentine’s love story, winter foods knitted in wool and shot in stop motion, and a Diwali campaign that gave local potters a platform.',
    ],
    projects: ['grofers', 'grofery', 'afsaane', 'love-story', 'winter-foods', 'unskippable', 'diwali-2020'],
  },
  razorpay: {
    id: 'razorpay',
    org: 'Razorpay',
    years: 'Oct 2021 — Now',
    role: 'Communication Design Senior Manager · Bengaluru',
    color: '#2f6bff',
    place: 'By the sea',
    headline: 'One visual system across Payments, RazorpayX and POS.',
    story: [
      'Since then I’ve led Communication Design at Razorpay across Payments, RazorpayX and POS. The work is brand films, keynote videos, landing pages, sales decks, social campaigns and product imagery, held together by one visual system and a way of telling stories that starts from data, consumer interviews and what past campaigns taught us.',
      'A lot of that work is now AI-native. Trial of the Century, the animal-courtroom film for RazorpayX Payroll, won Generative AI at the Shorty Awards. Break To Build turned one photograph of each of thirty founders into thirty ad films. Both ran as repeatable production systems rather than one-offs, and the design team now uses four in-house AI tools on live campaigns.',
    ],
    did: [
      'Leads Communication Design across Payments, RazorpayX and POS.',
      'Established a deck design language now used across more than ten product lines and business units.',
      'Four in-house AI tools the whole team uses on live campaigns.',
      'ET Brand Disruption Gold 2026 for the Razorpay Creative & Design Team.',
    ],
    projects: ['t20', 'btb', 'ring', 'trial', 'ace', 'magic-checkout', 'money', 'passport', 'whatsapp', 'intl', 'conv', 'toolkit', 'social-gen', 'razorbae'],
  },
};
