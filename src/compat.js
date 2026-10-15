// Loaded before everything else. Two things iPhones need:
//
// 1. Older Safari (before iOS 16) has no CanvasRenderingContext2D.roundRect; the signs and screens
//    are painted with it, so without this the island stops building half way and never opens.
// 2. Memory. iOS Safari reloads (or quietly kills) a page whose WebGL textures grow past what the
//    phone allows, which looks like "the game doesn't open". At full resolution the island's photos
//    and painted boards come to about a gigabyte of texture. On touch devices every image is shrunk
//    as it arrives (and the full-size original let go), and the renderer is told the same limit so
//    anything painted in code is shrunk on its way to the GPU too.
import * as THREE from 'three';

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r = 0) {
    const rad = Math.max(0, Math.min(Array.isArray(r) ? r[0] ?? 0 : typeof r === 'object' ? r.x ?? 0 : r, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

const touch = typeof matchMedia !== 'undefined' && (matchMedia('(hover: none)').matches || matchMedia('(pointer: coarse)').matches);
const shortSide = typeof screen !== 'undefined' ? Math.min(screen.width, screen.height) : 1000;
// phones get 768 px textures, tablets 1024, desktops whatever the GPU allows
export const TEXTURE_CAP = new URLSearchParams(location.search).has('fulltex') ? Infinity : touch ? (shortSide < 600 ? 768 : 1024) : Infinity;

function shrink(texture) {
  const im = texture.image;
  if (!im) return;
  const w = im.naturalWidth || im.width;
  const h = im.naturalHeight || im.height;
  if (!w || !h || Math.max(w, h) <= TEXTURE_CAP) return;
  const s = TEXTURE_CAP / Math.max(w, h);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * s));
  c.height = Math.max(1, Math.round(h * s));
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  texture.image = c; // the full-size image is no longer referenced and can be freed
  texture.needsUpdate = true;
}

if (TEXTURE_CAP !== Infinity) {
  const load = THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {
    return load.call(this, url, (t) => {
      try {
        shrink(t);
      } catch {
        /* a tainted or odd image: upload it as it is */
      }
      onLoad?.(t);
    }, onProgress, onError);
  };
}

// the same limit for the renderer, so canvases painted in code are scaled down at upload; and if
// the phone takes the WebGL context away (memory pressure), say so rather than freezing
export function capRenderer(renderer) {
  if (TEXTURE_CAP !== Infinity) renderer.capabilities.maxTextureSize = Math.min(renderer.capabilities.maxTextureSize, TEXTURE_CAP);
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    window.__shireFail?.('The phone ran short of graphics memory and paused the island.');
  });
}
