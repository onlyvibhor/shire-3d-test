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

Each hamlet has its own scene:
- **The Arena:** founders are filmed on a cricket pitch.
- **Magic Isles:** storefronts float on islands, and two boxers spar in a ring for Netbanking.
- **Scribes' Court:** an animal courtroom where payslip questions float up as speech bubbles.
- **Beacon Hill:** creators film reels under a glowing beacon.
- **The Workshop:** kiosks show the in-house AI tools.

Four golden trophies, one for each award, are hidden around the valley.

## Play

- **WASD / arrows** walk, **Shift** run, **Space** jump, **drag** to look, **scroll** to zoom.
- **Click or tap** the ground to walk there. Click a billboard (or walk up and press **E**) to open a project.
- **O** bird's-eye overview, **T** guided cinematic tour, **H** hire-me card, **M** objectives, **0–7** fast travel.
- Add `?lite` to the URL for a lighter mode. Phones get it automatically.

## Edit

- **Text and projects:** all copy is in [`src/data.js`](src/data.js). Project images are in `public/work/`.
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
- `src/village.js`: hamlets, billboards, department props, NPCs, trophies.
- `src/characters.js`: procedural people and their animations.
- `src/main.js`: renderer, bloom, camera, controls, interactions.
- `src/ui.js`: HUD, panels, project modal.
