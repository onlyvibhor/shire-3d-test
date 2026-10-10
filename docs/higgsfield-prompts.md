# Higgsfield prompt pack

Higgsfield wasn't connected in the session that built this version, so everything in the village is made in code.
These prompts produce assets that slot straight in. The look to match is the Razorpay Magic Checkout hero:
bright cyan sky with big cumulus clouds, lush green rolling hills, lavender meadows, and shiny white-metal
monoliths, arches and props.

## 1. Skybox (highest impact)

**Use:** `public/assets/sky.jpg`, then set `ASSETS.skybox = 'assets/sky.jpg'` in `src/data.js`.

> Equirectangular 360° panorama, 2:1, 8K. Bright clear cyan-blue summer sky, saturated near the zenith and
> fading to a pale misty blue at the horizon. Large fluffy cumulus clouds, sunlit white tops with soft
> blue-grey undersides, mostly in the lower third. Distant rolling green hills and soft blue mountains on the
> horizon line. Late-morning sun at about 40° elevation. No buildings, no people, no text, no lens flare.
> Stylised photoreal, like a premium fintech brand film.

## 2. Hero intro film (loading screen and social)

> Cinematic drone shot over a lush green valley shaped like a small Shire village. Round hobbit-hole homes are
> set into grassy mounds with polished white-metal doorframes. White chrome monoliths and arches line pale
> stone roads, and lavender fields run across the hillsides. An elevated white monorail loops around the
> valley and a giant floating silver rupee coin turns slowly in the sky. Villagers in blue, teal, pink, amber
> and orange work in six small plazas. Camera glides from high above down towards a giant party tree at the
> centre. Bright cyan sky, cumulus clouds, glossy reflections, 24 fps, 10 seconds.

## 3. Player avatar turnaround (to model or rig later)

**Reference:** `public/work/profile.jpg`

> Character turnaround sheet (front, three-quarter, side, back) of a stylised-realistic South Asian man in
> his mid-thirties. Short black hair, neatly trimmed full beard, warm medium-brown skin. Cream linen
> short-sleeve shirt, dark slim trousers, white sneakers, black wristwatch on the left wrist. Friendly,
> confident expression. Game-ready proportions like a modern open-world game character. Neutral light-grey
> background, even studio lighting.

## 4. Department villagers (one sheet per team)

> Six stylised-realistic game characters standing side by side, diverse Indian creative professionals in
> modern casual workwear, each with a lanyard badge. Brand marketing in royal blue, product marketing in teal,
> product and web in violet, social media in pink, content and copy in amber, design studio in orange.
> Turnaround-ready poses, neutral background.

## 5. Billboard and kiosk backdrops

> Glossy white-metal outdoor billboard frame on two slim chrome legs, standing in a green meadow with a
> lavender field behind and a bright cyan sky with cumulus clouds. Blank screen area, front view, photoreal
> product render, soft shadows.

## 6. Ground textures (tileable, 2K)

- **Grass:** "Seamless tileable texture, lush short meadow grass from above, saturated green with
  yellow-green highlights, tiny white and purple wildflowers, even lighting, no shadows."
- **Path:** "Seamless tileable texture, pale smooth concrete pavement with faint brushed lines,
  off-white, even lighting."

## Where generated files go

| Asset | Path | Hook |
| --- | --- | --- |
| Skybox | `public/assets/sky.jpg` | `ASSETS.skybox` in `src/data.js` |
| Intro film | `public/assets/intro.mp4` | add a `<video>` to `#loader` in `index.html` |
| Textures | `public/assets/*.jpg` | replace the materials in `src/materials.js` |
