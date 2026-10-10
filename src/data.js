// All portfolio copy lives here. Swap the placeholders for your own details.

export const OWNER = {
  name: 'Your Name',
  role: 'Brand Design Lead',
  tagline: 'I design the systems that let a whole organisation speak as one.',
  email: 'hello@yourname.com',
  links: [
    { label: 'LinkedIn', href: '#' },
    { label: 'Case studies', href: '#' },
    { label: 'CV', href: '#' },
  ],
};

// The five promises — also the five standing stones around the Party Tree.
export const PILLARS = [
  {
    id: 'better',
    name: 'Make it better',
    rune: '✦',
    text: 'Raise the craft bar on every touchpoint, from a launch film to a push notification.',
  },
  {
    id: 'award',
    name: 'Award-winning',
    rune: '★',
    text: 'Work bold enough to win rooms, juries and, more importantly, customers.',
  },
  {
    id: 'scale',
    name: 'Scale',
    rune: '❖',
    text: 'Brand systems, templates and rituals so ten teams can ship like one.',
  },
  {
    id: 'automate',
    name: 'Automate',
    rune: '⚙',
    text: 'Take the repetitive work off people: generative templates, AI-assisted pipelines, smart handoffs.',
  },
  {
    id: 'innovate',
    name: 'Innovate',
    rune: '✺',
    text: 'New formats, new channels and new tools, tried early and shipped safely.',
  },
];

// The centre of the village: the design leader's hall under the Party Tree.
export const CENTER = {
  id: 'hall',
  name: 'The Party Tree',
  team: 'Brand design leadership',
  color: '#d9a441',
  lead: 'Where every community meets. I sit here: connecting briefs, voices, pixels and launches into one story.',
  crafts: 'The shared brand system, the creative rituals, and the bridges between teams.',
  role: [
    'Turn org strategy into a brand platform every team can build on',
    'Run the creative rituals: crits, launch rooms, retros',
    'Own the system: guidelines, design tokens, templates, tooling',
    'Coach people and grow the craft across disciplines',
  ],
  pillars: ['better', 'award', 'scale', 'automate', 'innovate'],
};

// Each hamlet is one team. `activity` picks the props and what the villagers do.
export const HAMLETS = [
  {
    id: 'market',
    name: 'Market Square',
    team: 'Marketing managers',
    color: '#e0703a',
    activity: 'market',
    lead: 'Stalls of briefs, launches and campaigns, traded every day.',
    crafts: 'Go-to-market plans, campaign briefs, launch calendars, results.',
    role: [
      'Turn briefs into creative platforms that last more than one campaign',
      'Campaign toolkits so every market launches on-brand, on day one',
      'Measure creative effectiveness alongside the media numbers',
    ],
    pillars: ['scale', 'better'],
  },
  {
    id: 'scribes',
    name: "Scribes' Row",
    team: 'Copywriters',
    color: '#4f7cc9',
    activity: 'scribes',
    lead: 'Quills scratching. The voice of the village is written here.',
    crafts: 'Voice and tone, messaging hierarchies, headlines, UX writing.',
    role: [
      'Pair words and visuals from the first sketch, not the last handoff',
      'A living voice and tone system with examples, not rules',
      'AI-assisted drafting tuned to our voice, with writers in charge',
    ],
    pillars: ['better', 'automate'],
  },
  {
    id: 'painters',
    name: 'Painters’ Glade',
    team: 'Designers',
    color: '#c64f8f',
    activity: 'painters',
    lead: 'Easels in the sun. Colour, type and motion, crafted by hand.',
    crafts: 'Identity, campaigns, illustration, motion, design systems.',
    role: [
      'Set the craft bar and the critique culture',
      'Brand design system: tokens, components, motion principles',
      'Room to experiment, so the best ideas reach the awards shortlist',
    ],
    pillars: ['award', 'innovate'],
  },
  {
    id: 'beacon',
    name: 'Beacon Hill',
    team: 'Social media',
    color: '#e8c33a',
    activity: 'beacon',
    lead: 'The beacon never sleeps. Messages fly out by the flock.',
    crafts: 'Always-on content, community, trends, creator partnerships.',
    role: [
      'Social-first brand assets that flex across formats at speed',
      'Template engines and automation for high-volume content',
      'Fast lanes for reacting to culture without breaking the brand',
    ],
    pillars: ['automate', 'scale'],
  },
  {
    id: 'banners',
    name: 'Banner Hall',
    team: 'Brand marketing',
    color: '#8a5cc7',
    activity: 'banners',
    lead: 'Where the village’s story is woven into banners everyone flies.',
    crafts: 'Brand platform, positioning, brand campaigns, guidelines.',
    role: [
      'Translate positioning into an identity people feel',
      'Flagship brand campaigns built for craft and for effect',
      'Guidelines people actually use, built as a product',
    ],
    pillars: ['award', 'better'],
  },
  {
    id: 'workshop',
    name: 'The Mill Works',
    team: 'Product',
    color: '#3f9e7a',
    activity: 'workshop',
    lead: 'The mill turns. Features are forged, launched and improved.',
    crafts: 'Product UI, onboarding, in-product comms, launches.',
    role: [
      'One brand from ad to app: shared tokens between brand and product',
      'Launch narratives designed alongside the roadmap',
      'Prototype new brand experiences inside the product',
    ],
    pillars: ['innovate', 'scale'],
  },
];
