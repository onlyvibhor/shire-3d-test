// Typography for text painted onto 3D surfaces: real fonts (loaded before anything is drawn),
// text that shrinks to fit instead of being squashed, proper wrapping, and a few shared plates
// (project titles, metrics, signs) so every label in the world reads the same way.
import { canvasTexture } from './materials.js';

export const FONT = {
  display: '"Bricolage Grotesque", "Inter Tight", Inter, system-ui, sans-serif',
  sans: 'Inter, system-ui, -apple-system, sans-serif',
  mono: '"DM Mono", ui-monospace, Menlo, monospace',
  serif: '"Instrument Serif", Georgia, serif',
};

// Canvas text drawn before a web font arrives silently falls back to a system font, so wait for them first.
export async function loadFonts(timeout = 5000) {
  if (!document.fonts?.load) return;
  const wanted = [
    `800 64px ${FONT.display}`,
    `700 64px ${FONT.display}`,
    `600 64px ${FONT.display}`,
    `500 32px ${FONT.sans}`,
    `600 32px ${FONT.sans}`,
    `700 32px ${FONT.sans}`,
    `400 32px ${FONT.mono}`,
    `italic 400 40px ${FONT.serif}`,
  ];
  await Promise.race([Promise.all(wanted.map((f) => document.fonts.load(f).catch(() => null))), new Promise((r) => setTimeout(r, timeout))]);
}

const setFont = (ctx, weight, size, family, style = '') => (ctx.font = `${style} ${weight} ${size}px ${family}`.trim());
function track(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

// The largest size (≤ size, ≥ min) at which text fits maxW on one line. Sets ctx.font and returns the size.
export function fit(ctx, text, { weight = 700, size = 64, min = 14, family = FONT.display, maxW, style = '' }) {
  let s = size;
  setFont(ctx, weight, s, family, style);
  while (s > min && ctx.measureText(text).width > maxW) {
    s -= Math.max(1, s * 0.04);
    setFont(ctx, weight, s, family, style);
  }
  return s;
}

// Break text into at most maxLines lines of maxW; the last line gets an ellipsis if it had to be cut.
export function wrap(ctx, text, maxW, maxLines = 3) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines) {
        line = '';
        let last = lines[maxLines - 1];
        while (ctx.measureText(`${last}…`).width > maxW && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '));
        lines[maxLines - 1] = `${last}…`;
        break;
      }
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Wrap text into a box: try sizes from big to small until it fits in maxLines.
export function fitWrap(ctx, text, { weight = 700, size = 72, min = 22, family = FONT.display, maxW, maxLines = 2, style = '' }) {
  let s = size;
  for (;;) {
    setFont(ctx, weight, s, family, style);
    const lines = wrap(ctx, text, maxW, 99);
    if (lines.length <= maxLines || s <= min) return { size: s, lines: lines.length <= maxLines ? lines : wrap(ctx, text, maxW, maxLines) };
    s -= Math.max(1, s * 0.06);
  }
}

// ---------- Shared plates ----------

// A project's name plate on a billboard: a dark bar with the client and year in small caps, the title big and clear.
export function projectPlateTexture(p, color, aspect = 5) {
  const W = 1600;
  const H = Math.round(W / aspect);
  return canvasTexture(W, H, (c, w, h) => {
    c.fillStyle = '#0d1426';
    c.fillRect(0, 0, w, h);
    c.fillStyle = color;
    c.fillRect(0, 0, 18, h);
    c.fillRect(18, 0, w - 18, 5);
    const pad = 56;
    const eyebrow = [p.client, p.year].filter(Boolean).join(' · ').toUpperCase();
    c.fillStyle = color;
    track(c, 3);
    fit(c, eyebrow, { weight: 400, size: Math.round(h * 0.13), min: 16, family: FONT.mono, maxW: w - pad * 2 });
    c.textBaseline = 'top';
    c.fillText(eyebrow, pad, h * 0.14);
    track(c, 0);
    c.fillStyle = '#ffffff';
    const { size, lines } = fitWrap(c, p.title, { weight: 700, size: Math.round(h * 0.36), min: Math.round(h * 0.18), maxW: w - pad * 2, maxLines: 2 });
    const lh = size * 1.02;
    const top = h * 0.34 + (lines.length === 1 ? (h * 0.58 - lh) / 2 : 0);
    lines.forEach((l, i) => c.fillText(l, pad, top + i * lh));
  });
}

// A floating number with its label: the metric above a billboard.
export function metricTexture(value, label, color) {
  return canvasTexture(640, 260, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.fillRect(10, 10, w - 20, h - 20);
    c.fillStyle = color;
    c.fillRect(10, h - 22, w - 20, 12);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = color;
    fit(c, value, { weight: 800, size: 124, min: 40, maxW: w - 70 });
    c.fillText(value, w / 2, 142);
    c.fillStyle = '#334155';
    fit(c, label, { weight: 600, size: 40, min: 18, family: FONT.sans, maxW: w - 70 });
    c.fillText(label, w / 2, 204);
  });
}

// A title-and-subtitle sign (dome entrances, gateways): centred, crisp, sharp-cornered.
export function signPlateTexture(title, sub, color, { dark = true, aspect = 4 } = {}) {
  const W = 1600;
  const H = Math.round(W / aspect);
  return canvasTexture(W, H, (c, w, h) => {
    c.fillStyle = dark ? '#0d1426' : '#ffffff';
    c.fillRect(0, 0, w, h);
    c.fillStyle = color;
    c.fillRect(0, h - 16, w, 16);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = dark ? '#ffffff' : '#0d1426';
    track(c, 2);
    fit(c, title.toUpperCase(), { weight: 800, size: Math.round(h * 0.42), min: 24, maxW: w - 120 });
    c.fillText(title.toUpperCase(), w / 2, h * 0.42);
    track(c, 0);
    if (sub) {
      c.fillStyle = dark ? 'rgba(226,234,255,0.8)' : color;
      fit(c, sub, { weight: 500, size: Math.round(h * 0.15), min: 16, family: FONT.sans, maxW: w - 160 });
      c.fillText(sub, w / 2, h * 0.76);
    }
  });
}

// Drop-in for ctx.fillText(text, x, y, maxW): when text is too wide it scales the font size down
// instead of squeezing the letters, which is what the canvas does by default.
export function fillFit(ctx, text, x, y, maxW) {
  const w = ctx.measureText(text).width;
  if (!maxW || w <= maxW) return ctx.fillText(text, x, y);
  const font = ctx.font;
  const m = font.match(/(\d+(?:\.\d+)?)px/);
  if (!m) return ctx.fillText(text, x, y, maxW);
  ctx.font = font.replace(m[0], `${((parseFloat(m[1]) * maxW) / w).toFixed(1)}px`);
  ctx.fillText(text, x, y);
  ctx.font = font;
}
