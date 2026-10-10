# Vibhor Mathur: a portfolio you can walk through

A 3D open-world portfolio that plays in the browser. The organisation is a Shire-style village, styled after the
Razorpay Magic Checkout world: a bright cyan sky, lush hills, lavender meadows, and shiny white-metal monoliths.
Each department is a hamlet. Its villagers are at work, and the projects we shipped together stand on
billboards in its square.

| Hamlet | Department | Projects in the square |
| --- | --- | --- |
| The Party Tree (centre) | Communication Design HQ | About, numbers, path, five standing stones |
| The Arena | Brand Marketing | Start-Up Champions (T20), Break To Build, Agentic Commerce Engine |
| Launch Field | Product Marketing | MoneySaver Export Account, Passport For Your Product, International Payments |
| Magic Isles | Product & Web | Magic Checkout landing page, Back in the Ring, Magic Conversations |
| Beacon Hill | Social Media | Social Content Gen, Razorbae AI avatar |
| Scribes' Court | Content & Copy | Trial of the Century, Payments on WhatsApp |
| The Workshop | Design Studio | AI Toolkit, Grofers logo guidelines, Mentoring |
| The Night Lab (by the pond) | After hours | Habitats, Absolut Landscapes, AI Experiments |
| Jaipur Pink House | Vibhor's home | About, path, trophy cabinet, mailbox with a contact form |
| The Playhouse | Hobbies & entertainment | Open-air cinema, stop-motion table, found-object art, arcade, poster wall |

Each hamlet has its own scene:
- **The Arena:** founders are filmed on a cricket pitch.
- **Magic Isles:** storefronts float on islands, and two boxers spar in a ring for Netbanking.
- **Scribes' Court:** an animal courtroom where payslip questions float up as speech bubbles.
- **Beacon Hill:** creators film reels under a glowing beacon.
- **The Workshop:** kiosks show the in-house AI tools.

Four golden trophies, one for each award, are hidden around the valley. Each one you find appears in the
trophy cabinet at home.

Villagers think out loud about their next idea, their next objective, or AI in their field. Walk up to one and they
ask you about something they'd like to work on with Vibhor. They turn to look at you, wave back when you press
**F**, and fall over if you run into them.

The valley runs on a day-and-night cycle: a full day every 8 minutes, or press **L** to lock it to day, sunset or
night. At night, street lamps, windows and screens light up.

Delivery drones fly between the teams, scooters ride the ring road, and you'll find a filter-coffee bar and a
video wall at HQ, domes across the hills, and big roadside ad boards for the campaigns.

Opening a project shows the full case study from the portfolio repo (`src/content/`), styled like the repo's own
case pages.

## Play

- **WASD / arrows** walk, **Shift** run, **Space** jump, **drag** to look, **scroll** to zoom.
- **Click or tap** the ground to walk there. Click a billboard (or walk up and press **E**) to open a project.
- **E** interact, **F** wave, **L** day/night, **O** bird's-eye overview, **T** guided tour, **H** hire-me and contact, **M** objectives, **0–9** fast travel.
- Add `?lite` to the URL for a lighter mode. Phones get it automatically.

## Edit

- **Text and projects:** village copy, villager lines (`NPC_TALK`) and favourites (`FAVOURITES`) are in
  [`src/data.js`](src/data.js). Case studies are in `src/content/` (copied from `portfolio-staging`), and their
  media in `public/assets/`.
- **Contact form:** set `CONTACT.endpoint` in `src/data.js` to a form service URL (for example Formspree) to send
  messages from the page. Without one, the form opens the visitor's email app with the message filled in.
- **Higgsfield assets:** see [`docs/higgsfield-prompts.md`](docs/higgsfield-prompts.md) for ready-to-use prompts
  (skybox, intro film, avatar, textures) and where to drop the files.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## Code map

- `src/world.js`: terrain, roads, sky, clouds, wind-blown grass (180k blades), lavender, trees.
- `src/landmarks.js`: white-metal monoliths, arches, the sky rail with pods, floating coin/cart/wallet.
- `src/village.js`: hamlets, home, Playhouse, billboards, café, drones, scooters, NPCs, trophies.
- `src/props.js`: domes, drones, scooters, desks, monitor walls, dashboards, café, ad boards.
- `src/daynight.js`: time of day, sky, stars and moon, night lights.
- `src/casestudy.js`: the full-screen case-study viewer.
- `src/characters.js`: procedural people, their animations, look-at, and knock-down rag-doll reactions.
- `src/main.js`: renderer, bloom, camera, controls, interactions.
- `src/ui.js`: HUD, panels, project modal.
