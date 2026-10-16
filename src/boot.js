// Which island to open. Phones and tablets get the light island (src/mini): the full one needs
// more memory than iPhone Safari gives a page. Laptops and desktops get the full island.
// ?full or ?mini in the address overrides the choice either way.
const q = new URLSearchParams(location.search);
const touch = matchMedia('(hover: none)').matches || matchMedia('(pointer: coarse)').matches;
const mini = q.has('mini') || (!q.has('full') && touch);
if (mini) import('./mini/main.js');
else import('./main.js');
