// Touch controls for phones and tablets: a floating thumb-stick on the left half of the screen,
// action buttons on the right, and landscape handling (full screen + orientation lock where the
// browser allows it, a "turn your phone" card where it doesn't, as on iPhone Safari).
export const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches || (navigator.maxTouchPoints > 1 && !matchMedia('(hover: hover)').matches);

// analog input from the stick: x right, y forward, both -1..1
export const stick = { x: 0, y: 0, active: false };

// translate the stick into keyboard keys, for systems that read keys (the bicycle)
export function stickKeys(keys) {
  if (!stick.active) return keys;
  const k = new Set(keys);
  if (stick.y > 0.3) k.add('w');
  if (stick.y < -0.4) k.add('s');
  if (stick.x < -0.3) k.add('a');
  if (stick.x > 0.3) k.add('d');
  if (stick.y > 0.92) k.add('shift');
  return k;
}

export function goLandscape() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  const lock = () => screen.orientation?.lock?.('landscape').catch(() => {});
  try {
    if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
      const p = req.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(lock).catch(() => {});
      else lock();
    } else lock();
  } catch {
    // not allowed here (iPhone Safari); the rotate card covers it
  }
}

export function initTouch({ onJump, onBell, onGetOff, onUse, isRiding }) {
  // landscape card for phones held upright
  const rotate = document.getElementById('rotate');
  const canFull = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  rotate.querySelector('[data-full]').hidden = !canFull;
  rotate.querySelector('[data-full]').addEventListener('click', goLandscape);
  rotate.querySelector('[data-anyway]').addEventListener('click', () => document.body.classList.add('portrait-ok'));
  if (!isTouch) return;
  document.body.classList.add('is-touch');

  // ----- the stick -----
  const zone = document.getElementById('stick-zone');
  const base = document.getElementById('stick');
  const knob = base.querySelector('i');
  const R = 52;
  let id = null;
  let ox = 0;
  let oy = 0;
  const move = (x, y) => {
    let dx = x - ox;
    let dy = y - oy;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx *= R / d;
      dy *= R / d;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    stick.x = dx / R;
    stick.y = -dy / R;
    stick.active = Math.hypot(stick.x, stick.y) > 0.12;
  };
  zone.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    id = e.pointerId;
    zone.setPointerCapture(id);
    ox = e.clientX;
    oy = e.clientY;
    base.style.left = `${ox}px`;
    base.style.top = `${oy}px`;
    base.classList.add('is-on');
    move(ox, oy);
    e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId === id) move(e.clientX, e.clientY);
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    stick.x = stick.y = 0;
    stick.active = false;
    knob.style.transform = '';
    base.classList.remove('is-on');
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);

  // ----- buttons -----
  const btn = (sel, fn) => {
    const el = document.querySelector(sel);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add('is-down');
      fn();
    });
    const up = () => el.classList.remove('is-down');
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  };
  btn('#tb-jump', onJump);
  btn('#tb-use', onUse);
  btn('#tb-bell', onBell);
  btn('#tb-off', onGetOff);
  // the Use button mirrors the on-screen prompt
  const prompt = document.getElementById('prompt');
  const use = document.getElementById('tb-use');
  new MutationObserver(() => use.classList.toggle('is-ready', prompt.classList.contains('is-open'))).observe(prompt, { attributes: true, attributeFilter: ['class'] });
  // riding swaps the button set
  setInterval(() => document.body.classList.toggle('touch-riding', !!isRiding()), 250);

  // iOS Safari: stop the page itself from pinch-zooming or bouncing; the game handles pinch for the camera
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
}
