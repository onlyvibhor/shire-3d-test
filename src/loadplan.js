// What the island is made of, in three stacks, and what an iPhone gets of each.
//
// Every element has a priority (0 = the portfolio doesn't work without it … 3 = atmosphere), a
// rough memory cost, and an iPhone decision:
//   load   - built on the light island (src/mini) at start
//   stream - built on the light island only while you're near it, taken down when you leave
//   skip   - full island only (laptops, desktops, capable Android phones); on an iPhone its
//            content is still reachable through the interface (drawers, case studies, About)
//
// The full island builds everything. The light island asks `onPhone(id)` before building a piece,
// so this file is the one place to change what phones carry. `?tier=N` caps the priority (for
// testing a lighter or heavier phone build).
export const STACKS = {
  content: {
    label: 'Projects & content',
    items: [
      { id: 'billboards', label: 'Project billboards (cover image per project)', p: 0, cost: 'med', iphone: 'load', note: 'Up to 6 per team, 768 px covers, tap opens the case study' },
      { id: 'places', label: 'Plazas, gates and place labels', p: 0, cost: 'low', iphone: 'load' },
      { id: 'campaigns', label: 'Campaign beacons and briefs', p: 0, cost: 'low', iphone: 'load', note: 'Run a campaign from the Journal' },
      { id: 'signs', label: 'Belief and name sign pairs at each gate', p: 1, cost: 'low', iphone: 'load' },
      { id: 'sculptures', label: 'The five sculptures round the tree', p: 1, cost: 'med', iphone: 'load' },
      { id: 'trophies', label: 'Golden trophies to find', p: 1, cost: 'low', iphone: 'load' },
      { id: 'hidden', label: 'Hidden career places', p: 1, cost: 'low', iphone: 'load', note: 'Simple pavilions on the phone' },
      { id: 'dept-scenes', label: 'Department production scenes (reel shoot, TVC, launch, review)', p: 2, cost: 'high', iphone: 'stream', note: 'One at a time, as you approach a team' },
      { id: 'interiors', label: 'Walk-in interiors: Home, AI Lab, Hall of Fame, Playhouse', p: 2, cost: 'high', iphone: 'skip', note: 'Their content opens from each place’s drawer' },
      { id: 'campaign-wall', label: 'Brief board and campaign wall under the tree', p: 2, cost: 'med', iphone: 'skip', note: 'Same briefs in the Journal' },
      { id: 'gallery-hills', label: 'Hill billboards across the island', p: 3, cost: 'med', iphone: 'skip' },
      { id: 'night-lab-screen', label: 'Night Lab film screen and bench', p: 3, cost: 'med', iphone: 'skip' },
    ],
  },
  environment: {
    label: 'Environment',
    items: [
      { id: 'ground', label: 'Island, sand, sea and roads', p: 0, cost: 'low', iphone: 'load' },
      { id: 'tree', label: 'The jamun tree', p: 0, cost: 'low', iphone: 'load' },
      { id: 'trees', label: 'Low-poly trees (merged)', p: 1, cost: 'low', iphone: 'load' },
      { id: 'meadow', label: 'Grass and flowers (instanced)', p: 2, cost: 'low', iphone: 'load', note: 'Half density on small phones' },
      { id: 'lamps', label: 'Street lamps, lit at night', p: 2, cost: 'low', iphone: 'load' },
      { id: 'kites', label: 'Sankranti kites', p: 2, cost: 'low', iphone: 'load' },
      { id: 'clouds', label: 'Drifting clouds', p: 3, cost: 'low', iphone: 'load' },
      { id: 'terrain', label: 'Hills and terrain height field', p: 2, cost: 'high', iphone: 'skip', note: 'The phone island is flat' },
      { id: 'grass-shader', label: 'Wind-blown grass, lavender and flower fields (60k+ blades)', p: 3, cost: 'high', iphone: 'skip' },
      { id: 'jaipur', label: 'Jaipur architecture: palace, bazaar, city gates, Jantar Mantar', p: 2, cost: 'high', iphone: 'skip' },
      { id: 'coast', label: 'Ferry, piers and lighthouse', p: 3, cost: 'med', iphone: 'skip' },
      { id: 'mountains', label: 'Mountains, sky rail, monoliths, hill domes', p: 3, cost: 'med', iphone: 'skip' },
      { id: 'fx', label: 'Shadows, bloom, pollen, chimney smoke, floating props', p: 3, cost: 'high', iphone: 'skip' },
    ],
  },
  people: {
    label: 'People & life',
    items: [
      { id: 'player', label: 'You', p: 0, cost: 'low', iphone: 'load' },
      { id: 'guides', label: 'A guide at each department (talks and asks)', p: 1, cost: 'low', iphone: 'load' },
      { id: 'crew', label: 'The crews at work in the department scenes', p: 2, cost: 'med', iphone: 'stream', note: 'Come with their scene' },
      { id: 'villagers', label: 'Villagers walking the roads', p: 2, cost: 'med', iphone: 'load', note: '8–14 people, animated only up close' },
      { id: 'riders', label: 'Delivery scooters and cyclists', p: 3, cost: 'med', iphone: 'skip' },
      { id: 'traffic', label: 'Couriers, drones and the chatter overhead', p: 3, cost: 'med', iphone: 'skip' },
      { id: 'creatures', label: 'The T-rex and the hidden smoker', p: 3, cost: 'med', iphone: 'skip' },
      { id: 'bicycle', label: 'Your bicycle', p: 3, cost: 'med', iphone: 'skip' },
    ],
  },
};

const TIER = (() => {
  const t = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('tier');
  return t === null ? 3 : Math.max(0, Math.min(3, +t));
})();
const BY_ID = new Map(Object.values(STACKS).flatMap((s) => s.items).map((i) => [i.id, i]));

// should the light island build this? ('stream' counts: it's built, just not all at once)
export function onPhone(id) {
  const it = BY_ID.get(id);
  if (!it) return false;
  return it.iphone !== 'skip' && it.p <= TIER;
}
