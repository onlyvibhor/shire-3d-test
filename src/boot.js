// Which island to open. Everyone gets the full island, except where we know it can't load:
//   - iPhones and iPads: every browser there is Safari underneath, and Safari gives a page less
//     memory than the full island needs;
//   - devices that say they have very little memory, or no WebGL2;
//   - a device where the full island already failed to load (the page was killed or reloaded
//     before it was ready) - the next visit opens the light island instead of failing again.
// ?full or ?mini in the address overrides all of this.
const q = new URLSearchParams(location.search);
const KEY = 'shire-boot';
const store = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  },
  set(v) {
    try {
      if (v) localStorage.setItem(KEY, JSON.stringify(v));
      else localStorage.removeItem(KEY);
    } catch {
      /* private mode: no memory of failures */
    }
  },
};

const ios = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const lowMemory = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
const noWebGL2 = (() => {
  try {
    return !document.createElement('canvas').getContext('webgl2');
  } catch {
    return true;
  }
})();
// the full island started here before and never got ready: either the page came straight back
// within two minutes (a browser reloading a page it killed), or it has happened twice today
const last = store.get();
const age = last ? Date.now() - last.t : Infinity;
const failedBefore = !!(last && last.mode === 'full' && ((age < 120e3) || (last.n >= 2 && age < 864e5)));

let mini;
if (q.has('mini')) mini = true;
else if (q.has('full')) mini = false;
else mini = ios || lowMemory || noWebGL2 || failedBefore;

if (mini) {
  import('./mini/main.js');
} else {
  // remember that the full island is loading; cleared once it's ready
  store.set({ mode: 'full', t: Date.now(), n: (last?.mode === 'full' && age < 864e5 ? last.n || 1 : 0) + 1 });
  new MutationObserver((_, obs) => {
    if (document.body.classList.contains('is-ready')) {
      store.set(null);
      obs.disconnect();
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // if it fails visibly, offer the light island right there
  document.body.classList.add('can-go-light');
  import('./main.js');
}
