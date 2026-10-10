# Brand Shire: a walkable portfolio

A portfolio you can walk through. The organisation is a little Shire-style village. Each team is a community
with its own hamlet, and they're all busy at their craft. You play the design leader: walk the roads between
them, watch them work, and see where brand design comes in.

| Hamlet | Team | What's happening |
| --- | --- | --- |
| The Party Tree (centre) | Brand design leadership | Teams meet under the tree. Five standing stones hold the five promises, and the leader's hall sits on the hill |
| Market Square | Marketing managers | Stalls, a campaign notice board, traders and porters |
| Scribes' Row | Copywriters | Writers at desks, a voice-and-tone book, and pages drifting into the sky |
| Painters' Glade | Designers | Painters at easels whose canvases change colour, and a spinning colour wheel |
| Beacon Hill | Social media | A burning beacon, a circling flock of messenger pigeons, and runners carrying news |
| Banner Hall | Brand marketing | Waving brand banners and a loom weaving the brand book |
| The Mill Works | Product | A windmill, turning gears, blacksmiths, and a launch balloon |

Couriers walk every road between the centre and the hamlets, and travellers go round the ring road visiting
each community, so you can watch the cross-team communication happen.

## Controls

- **WASD / arrows** walk, **Shift** run, **Q/E** or drag to turn the camera, **scroll** to zoom
- **Click / tap the ground** to walk there
- **O** bird's-eye overview, **T** guided cinematic tour, **H** hire-me card
- **0–6** fast travel (or click a floating label or one of the progress dots)

Walk into a hamlet and its story card opens. A counter tracks how many communities you've met, and when you've
met all of them you get a call to action.

## Make it yours

All the copy is in [`src/data.js`](src/data.js): your name, role, tagline, email, links, the five pillars, and each
team's text. Swap in your real case studies and numbers there.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # static site in dist/ (relative paths, so it works on GitHub Pages, Netlify, Vercel...)
```

Everything is made in code with [three.js](https://threejs.org): no models or textures to download, and about
155 KB gzipped.
