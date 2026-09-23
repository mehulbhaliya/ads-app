/**
 * Turns a logo on a white background (JPG/PNG) into two transparent canvases:
 *  - `light`: original colours, for light backgrounds
 *  - `dark`:  navy/blue ink recoloured to white (gold kept), for navy backgrounds
 * Crops to the ink bounding box and drops a trailing solid badge band
 * (e.g. "For Residency & NEET SS") unless `keepBadge` is set.
 */

export interface LogoAssets {
  light: HTMLCanvasElement;
  dark: HTMLCanvasElement;
  aspect: number; // width / height
}

import { DEFAULT_LOGO_DATA_URL } from './logoData';

export const DEFAULT_LOGO_SRC = DEFAULT_LOGO_DATA_URL;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

// Coloured or genuinely dark pixels only, so thin grey frames/outlines are ignored.
const isInk = (r: number, g: number, b: number) => {
  const lo = Math.min(r, g, b);
  return lo < 200 && (Math.max(r, g, b) - lo > 40 || lo < 90);
};

export function extractLogo(img: HTMLImageElement, keepBadge = false): LogoAssets {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  const sctx = src.getContext('2d', { willReadFrequently: true })!;
  sctx.drawImage(img, 0, 0);
  const data = sctx.getImageData(0, 0, w, h).data;

  // Ignore a 12% margin so a circular frame/outline around the logo is skipped.
  const mx = Math.round(w * 0.12);
  const my = Math.round(h * 0.12);

  // Row occupancy inside the inner region.
  const rows: number[] = [];
  for (let y = my; y < h - my; y++) {
    let count = 0;
    for (let x = mx; x < w - mx; x++) {
      const i = (y * w + x) * 4;
      if (isInk(data[i], data[i + 1], data[i + 2])) count++;
    }
    rows[y] = count;
  }

  // Rows need a few ink pixels so JPEG noise specks don't count.
  const minRowInk = Math.max(3, Math.round(w * 0.004));

  // Split into bands separated by >= 1.5% of height of empty rows.
  const gap = Math.max(4, Math.round(h * 0.015));
  const bands: { y0: number; y1: number; density: number }[] = [];
  let start = -1;
  let empty = 0;
  for (let y = my; y < h - my; y++) {
    if (rows[y] >= minRowInk) {
      if (start < 0) start = y;
      empty = 0;
    } else if (start >= 0) {
      empty++;
      if (empty >= gap) {
        bands.push({ y0: start, y1: y - empty, density: 0 });
        start = -1;
        empty = 0;
      }
    }
  }
  if (start >= 0) bands.push({ y0: start, y1: h - my - 1, density: 0 });
  // Drop slivers thinner than 1% of the height (noise, hairlines).
  for (let i = bands.length - 1; i >= 0; i--) {
    if (bands[i].y1 - bands[i].y0 < h * 0.01) bands.splice(i, 1);
  }
  if (bands.length === 0) throw new Error('No logo ink found in image.');

  // Bounding x per band and fill density; a solid badge has density > 0.45.
  const bandBox = (b: { y0: number; y1: number }) => {
    let x0 = w;
    let x1 = 0;
    let ink = 0;
    for (let y = b.y0; y <= b.y1; y++) {
      for (let x = mx; x < w - mx; x++) {
        const i = (y * w + x) * 4;
        if (isInk(data[i], data[i + 1], data[i + 2])) {
          ink++;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
        }
      }
    }
    return { x0, x1, density: ink / Math.max(1, (x1 - x0 + 1) * (b.y1 - b.y0 + 1)) };
  };

  let used = bands;
  if (!keepBadge && bands.length > 1 && bandBox(bands[bands.length - 1]).density > 0.45) {
    used = bands.slice(0, -1);
  }

  let x0 = w;
  let x1 = 0;
  for (const b of used) {
    const bb = bandBox(b);
    x0 = Math.min(x0, bb.x0);
    x1 = Math.max(x1, bb.x1);
  }
  const pad = Math.round(w * 0.01);
  const cx = Math.max(0, x0 - pad);
  const cy = Math.max(0, used[0].y0 - pad);
  const cw = Math.min(w, x1 + pad) - cx;
  const ch = Math.min(h, used[used.length - 1].y1 + pad) - cy;

  const make = (toWhite: boolean) => {
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext('2d')!;
    const out = ctx.createImageData(cw, ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const si = ((y + cy) * w + (x + cx)) * 4;
        const di = (y * cw + x) * 4;
        const r = data[si];
        const g = data[si + 1];
        const b = data[si + 2];
        // Alpha from distance to white, then un-blend the colour from white.
        const a = Math.min(1, ((255 - Math.min(r, g, b)) / 255) * 1.35);
        if (a < 0.04) continue;
        let fr = (r - (1 - a) * 255) / a;
        let fg = (g - (1 - a) * 255) / a;
        let fb = (b - (1 - a) * 255) / a;
        if (toWhite && fb > fr + 20) {
          // Navy/blue ink -> white; gold (r > b) stays gold.
          fr = fg = fb = 255;
        }
        out.data[di] = Math.max(0, Math.min(255, fr));
        out.data[di + 1] = Math.max(0, Math.min(255, fg));
        out.data[di + 2] = Math.max(0, Math.min(255, fb));
        out.data[di + 3] = Math.round(a * 255);
      }
    }
    ctx.putImageData(out, 0, 0);
    return c;
  };

  return { light: make(false), dark: make(true), aspect: cw / ch };
}

let cached: Promise<LogoAssets> | null = null;
let cachedSrc = '';

/** Loads and processes a logo once per source; defaults to the bundled DigiNerve logo. */
export function getLogoAssets(src: string = DEFAULT_LOGO_SRC): Promise<LogoAssets> {
  if (!cached || cachedSrc !== src) {
    cachedSrc = src;
    cached = loadImage(src).then((img) => extractLogo(img));
    cached.catch(() => {
      cached = null;
    });
  }
  return cached;
}
