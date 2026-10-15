// Screens that play a playlist on their own: no controls, nothing to click. One component serves
// the giant vertical social feed (posts scroll up one after another, like a phone feed) and the
// small monitors and launch screens (images crossfade). Media loads only when someone is near,
// videos play only while they are on screen and in range, and the canvas is redrawn only during a
// transition or a video frame.
import * as THREE from 'three';

const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (x) => x * x * (3 - 2 * x);

function loadItem(it) {
  if (it.el) return;
  if (it.kind === 'video') {
    const v = document.createElement('video');
    v.src = it.src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.addEventListener('loadeddata', () => (it.ready = true));
    it.el = v;
  } else {
    const im = new Image();
    im.onload = () => (it.ready = true);
    im.onerror = () => (it.failed = true);
    im.src = it.src;
    it.el = im;
  }
}

// draw media into a rectangle, cropped to fill it (cover) or fitted inside it (contain)
function drawMedia(c, it, x, y, w, h, fit = 'cover', zoom = 1) {
  const el = it.el;
  const iw = it.kind === 'video' ? el.videoWidth : el.naturalWidth;
  const ih = it.kind === 'video' ? el.videoHeight : el.naturalHeight;
  if (!it.ready || !iw) {
    c.fillStyle = '#1d2026';
    c.fillRect(x, y, w, h);
    return;
  }
  const s = (fit === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih)) * zoom;
  const dw = iw * s;
  const dh = ih * s;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.drawImage(el, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  c.restore();
}

/**
 * w, h: the screen's size in metres · items: [{ src, kind: 'image'|'video', caption, sub, hold }]
 * mode: 'scroll' (a feed) or 'fade' · draw(c, W, H, item, x, y) lays an item out (default: full bleed)
 * overlay(c, W, H, index, count, t) paints fixed chrome on top
 */
export function makePlaylistScreen({ w, h, px = 768, items, mode = 'fade', hold = 6, trans = 1.1, draw, overlay, fit = 'cover', bg = '#0e1013' }) {
  const W = px;
  const H = Math.round((px * h) / w);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.userData.dynamic = true;
  mesh.userData.noFit = true;
  const list = items.map((it) => ({ ...it, hold: it.hold ?? hold }));
  const slot = list.map((it) => it.hold + trans);
  const total = slot.reduce((a, b) => a + b, 0);
  const paintItem = (it, x, y, zoom) => {
    if (draw) draw(c, W, H, it, x, y, zoom);
    else drawMedia(c, it, x, y, W, H, it.fit || fit, zoom);
  };
  let loaded = false;
  let lastDraw = -1;
  let lastKey = '';
  let playing = null;
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  return {
    mesh,
    update(t, on) {
      if (!on) {
        if (playing) {
          playing.el.pause();
          playing = null;
        }
        return;
      }
      if (!loaded) {
        loaded = true;
        list.forEach(loadItem);
      }
      // where we are in the playlist
      let k = REDUCED ? 0 : t % total;
      let i = 0;
      while (k > slot[i]) k -= slot[i++];
      i = Math.min(i, list.length - 1);
      const cur = list[i];
      const next = list[(i + 1) % list.length];
      const moving = k > cur.hold;
      const f = moving ? ease(Math.min(1, (k - cur.hold) / trans)) : 0;
      // only the item on screen plays
      const want = cur.kind === 'video' ? cur : moving && next.kind === 'video' ? next : null;
      if (want !== playing) {
        playing?.el.pause();
        playing = want;
        if (playing) playing.el.play().catch(() => {});
      }
      // redraw while something moves: a transition, a video, or a slow push-in on a still
      const busy = moving || !!playing;
      const key = `${i}|${cur.ready}|${next.ready}`;
      const due = busy ? t - lastDraw > 1 / 24 : key !== lastKey || t - lastDraw > (REDUCED ? 99 : 1 / 8);
      if (!due) return;
      lastDraw = t;
      lastKey = key;
      const zoom = REDUCED || cur.kind === 'video' ? 1 : 1 + Math.min(1, k / cur.hold) * 0.035;
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      if (mode === 'scroll') {
        const dy = -f * H;
        paintItem(cur, 0, dy, zoom);
        if (moving) paintItem(next, 0, dy + H, 1);
      } else {
        paintItem(cur, 0, 0, zoom);
        if (moving) {
          c.globalAlpha = f;
          paintItem(next, 0, 0, 1);
          c.globalAlpha = 1;
        }
      }
      overlay?.(c, W, H, moving && f > 0.5 ? (i + 1) % list.length : i, list.length, t);
      tex.needsUpdate = true;
    },
  };
}

// ---------- the social feed's look ----------
const ICON = {
  heart: 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z',
  comment: 'M4 5h16v11H9l-5 4z',
  share: 'M21 3 3 10.5l7 2.5 2.5 7z',
};
function icon(c, name, x, y, s, fill) {
  c.save();
  c.translate(x, y);
  c.scale(s / 24, s / 24);
  const p = new Path2D(ICON[name]);
  if (fill) {
    c.fillStyle = fill;
    c.fill(p);
  } else {
    c.lineWidth = 2;
    c.lineJoin = 'round';
    c.strokeStyle = '#ffffff';
    c.stroke(p);
  }
  c.restore();
}
const font = (w, s) => `${w} ${s}px Inter, system-ui, sans-serif`;

// one post laid out as it appears in a vertical feed: who it's for, the media square, the caption
export function feedPost(c, W, H, it, x, y, zoom = 1) {
  c.fillStyle = '#ffffff';
  c.fillRect(x, y, W, H);
  const pad = W * 0.05;
  // header: an avatar disc in the post's colour and the client's name
  const top = y + H * 0.1;
  c.fillStyle = it.color || '#ff4f8b';
  c.beginPath();
  c.arc(x + pad + 26, top, 26, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = font(800, 24);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText((it.sub || '?')[0].toUpperCase(), x + pad + 26, top + 1);
  c.textAlign = 'left';
  c.fillStyle = '#121418';
  c.font = font(700, 30);
  c.fillText(it.sub || '', x + pad + 66, top);
  // the decorative Follow pill
  const pw = 128;
  c.fillStyle = it.color || '#ff4f8b';
  c.beginPath();
  c.roundRect(x + W - pw - pad, top - 24, pw, 48, 24);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = font(700, 24);
  c.textAlign = 'center';
  c.fillText('Follow', x + W - pw / 2 - pad, top + 1);
  c.textAlign = 'left';
  // the media, square (or the shape it was made in, up to 4:5)
  const mw = W;
  const mh = Math.min(W * 1.25, H * 0.62);
  const my = top + 46;
  drawMedia(c, it, x, my, mw, mh, it.fit || 'cover', zoom);
  // the action row and the caption
  const ay = my + mh + 22;
  icon(c, 'heart', x + pad, ay, 40, '#ff3b5c');
  icon(c, 'comment', x + pad + 62, ay + 2, 38);
  icon(c, 'share', x + pad + 124, ay + 2, 38);
  c.fillStyle = '#121418';
  c.font = font(800, 32);
  c.textBaseline = 'top';
  c.fillText(it.caption || '', x + pad, ay + 62, W - pad * 2);
  if (it.year) {
    c.fillStyle = '#6b7079';
    c.font = font(500, 26);
    c.fillText(it.year, x + pad, ay + 104);
  }
  c.textBaseline = 'alphabetic';
}

// fixed chrome over the scrolling feed: a status bar and how far through the playlist we are
export function feedOverlay(color) {
  return (c, W, H, i, n) => {
    c.fillStyle = 'rgba(255,255,255,0.94)';
    c.fillRect(0, 0, W, H * 0.045);
    c.fillStyle = '#121418';
    c.font = font(700, 24);
    c.textBaseline = 'middle';
    c.fillText('Feed', W * 0.05, H * 0.024);
    // progress through the playlist
    const seg = (W * 0.6) / n;
    for (let k = 0; k < n; k++) {
      c.fillStyle = k === i ? color : 'rgba(18,20,24,0.18)';
      c.beginPath();
      c.roundRect(W * 0.2 + k * seg + 2, H - 30, seg - 4, 8, 4);
      c.fill();
    }
    c.textBaseline = 'alphabetic';
  };
}
