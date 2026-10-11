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
};

// The centre of the village: Communication Design HQ under the jamun tree.
export const CENTER = {
  id: 'hq',
  name: 'Communication Design HQ',
  place: 'The Jamun Tree',
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
    projects: ['social-gen', 'razorbae', 'grofery', 'afsaane', 'love-story', 'winter-foods', 'unskippable', 'diwali-2020'],
    wallTitle: 'Grofers\nsocial\n2017–20',
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
  projects: ['ai-works', 'habitats', 'absolut'],
  quotes: ['Every landscape here started as an animal silhouette.', 'Warhol loved the Absolut bottle. So did ControlNet.'],
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
  name: 'The Playhouse',
  place: 'Hobbies & entertainment',
  color: '#ff9f1c',
  lead: 'After hours: AI art, stop motion, found-object art, and quirky little things for Instagram.',
  how: [
    'Stop-motion animation on a tabletop set',
    'Found-object art: everyday things turned into small vessels of emotion',
    'AI art experiments with Stable Diffusion, ControlNet and Midjourney',
    'Fun, quirky content for Instagram, from introspective musings to one-liners',
  ],
  makes: ['Stop motion', 'Found objects', 'Collage', 'Instagram'],
  projects: ['modern-junkyard', 'urbanclap', 'veggie-people', 'holi-stop-motion', 'valentines-week', 'winter-foods', 'power', 'birds', 'eyes'],
  quotes: ['Grab some popcorn. The screen is showing the studio’s films.', 'Want the arcade? Back in the Ring started as a game idea.'],
};

// The AI Hub: where design and AI become tools and automations for the whole organisation.
export const AIHUB = {
  id: 'ai',
  name: 'AI Hub',
  place: 'Innovation & automation lab',
  color: '#00c2ff',
  lead: 'Design plus AI, turned into tools the whole organisation uses. Repetitive work becomes a button; designers ship what used to wait in a queue.',
  how: [
    'Automate the set tasks: one founder photo in, a 4K campaign library out',
    'Scale production: 81 TV films, a newspaper front page and 200+ posts from one pipeline',
    'Make AI easy to learn: interfaces, not prompts, so beginners are productive on day one',
    'Let designers ship interactive web, landing pages and games themselves',
  ],
  makes: ['In-house AI tools', 'Automation pipelines', 'AI workshops'],
  projects: ['toolkit', 'social-gen', 'razorbae', 'mentor'],
  quotes: ['Prompts are inputs. Tools are modules. Systems create consistency.', 'Every tool here started as a task we were tired of repeating.'],
};

// The Hall of Fame: every award, with the work that won it.
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
    ],
    asks: [
      'Can Social Content Gen do Hindi and Tamil posts next?',
      'Shall we co-create a new AI avatar series?',
      'Could we run another Wall of Laughter, for founders this time?',
    ],
  },
  copy: {
    roles: ['Copywriter', 'Scriptwriter', 'Content strategist'],
    thoughts: [
      'Idea: Panchatantra season two, for payroll?',
      'Objective: find the insight before the headline.',
      'AI: a voice-and-tone checker on every draft?',
      'Next: scripts that start from customer interviews.',
    ],
    asks: [
      'Can we pair a writer and a designer from day one?',
      'Could the courtroom from Trial become a series?',
      'Will you art-direct our next script read?',
    ],
  },
  design: {
    roles: ['Designer', 'Motion designer', '3D artist', 'Design intern'],
    thoughts: [
      'Idea: a motion tool next to the Cinematography Tool?',
      'Objective: every deck on the new design language.',
      'AI: teach the Founder tool some new poses.',
      'Crit is Friday. Bring work in progress!',
    ],
    asks: [
      'Vibhor, could you review my portfolio this week?',
      'Can I join the next AI design workshop?',
      'Can we pair on the next tool for the studio?',
    ],
  },
  hq: {
    roles: ['Studio designer', 'Studio producer', 'Visiting marketer'],
    thoughts: ['Coffee first, then ideas.', 'What would make this award-worthy?', 'Objective: ship it on Friday.', 'AI: what can we automate next?'],
    asks: ['Got a minute for a quick crit?', 'Can the studio take one more brief this sprint?', 'Want to grab a filter coffee and jam on ideas?'],
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
