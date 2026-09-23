/**
 * Low-level canvas drawing helpers shared by the ad templates.
 * Everything is measured before it is drawn so text never overlaps:
 * templates stack blocks and shrink them together until they fit.
 */

export const FONTS = {
  display: '"Archivo Black", "Arial Black", sans-serif', // heavy caps grotesk: hooks, course names
  numeric: '"Anton", Impact, sans-serif', // discount numbers / prices
  heading: '"Poppins", "Segoe UI", sans-serif', // names, CTA, chips
  body: '"Poppins", "Segoe UI", sans-serif',
};

/** Ensures web fonts are ready before drawing (canvas does not wait on its own). */
export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined' || !(document as any).fonts) return;
  const specs = [
    '400 40px "Archivo Black"',
    '400 40px "Anton"',
    '400 20px "Poppins"',
    '500 20px "Poppins"',
    '600 20px "Poppins"',
    '700 20px "Poppins"',
    '800 20px "Poppins"',
  ];
  try {
    await Promise.all(specs.map((s) => (document as any).fonts.load(s)));
  } catch {
    // Fall back to system fonts; layout still fits because we measure.
  }
}

export type Ctx = CanvasRenderingContext2D;

export function font(weight: number | string, size: number, family: string): string {
  return `${weight} ${Math.round(size)}px ${family}`;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function withShadow(ctx: Ctx, blur: number, offsetY: number, color: string, draw: () => void) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = offsetY;
  draw();
  ctx.restore();
}

/** Greedy word wrap. Long single words are kept whole (caller shrinks font instead). */
export function wrapLines(ctx: Ctx, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    const pieces: string[] = [];
    for (const w of words) {
      if (ctx.measureText(w).width <= maxWidth) pieces.push(w);
      else pieces.push(...w.split(/(?<=[\/\-×])/)); // break long tokens after / - ×
    }
    for (const word of pieces) {
      const glue = line && !/[\/\-×]$/.test(line) ? ' ' : '';
      const test = line ? `${line}${glue}${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

export interface FittedText {
  lines: string[];
  size: number;
  lineHeight: number;
  height: number;
  width: number;
}

/**
 * Largest font size (<= maxSize) at which `text` wraps into <= maxLines lines,
 * every line fits maxWidth, and (optionally) total height <= maxHeight.
 */
export function fitText(
  ctx: Ctx,
  text: string,
  opts: {
    family: string;
    weight: number | string;
    maxWidth: number;
    maxSize: number;
    minSize?: number;
    maxLines?: number;
    maxHeight?: number;
    lineHeight?: number; // multiple of size
    uppercase?: boolean;
  }
): FittedText {
  const t = opts.uppercase ? text.toUpperCase() : text;
  const minSize = opts.minSize ?? 10;
  const lh = opts.lineHeight ?? 1.15;
  const maxLines = opts.maxLines ?? 3;
  let size = opts.maxSize;
  for (; size >= minSize; size -= Math.max(1, size * 0.04)) {
    ctx.font = font(opts.weight, size, opts.family);
    const lines = wrapLines(ctx, t, opts.maxWidth);
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    const height = lines.length * size * lh;
    if (lines.length <= maxLines && widest <= opts.maxWidth && (!opts.maxHeight || height <= opts.maxHeight)) {
      return { lines, size, lineHeight: size * lh, height, width: widest };
    }
  }
  size = minSize;
  ctx.font = font(opts.weight, size, opts.family);
  const lines = wrapLines(ctx, t, opts.maxWidth).slice(0, maxLines);
  return {
    lines,
    size,
    lineHeight: size * lh,
    height: lines.length * size * lh,
    width: Math.max(0, ...lines.map((l) => ctx.measureText(l).width)),
  };
}

export function drawLines(
  ctx: Ctx,
  f: FittedText,
  x: number,
  y: number,
  opts: { family: string; weight: number | string; color: string; align?: CanvasTextAlign; colors?: string[] }
) {
  ctx.font = font(opts.weight, f.size, opts.family);
  ctx.textBaseline = 'top';
  ctx.textAlign = opts.align ?? 'left';
  f.lines.forEach((line, i) => {
    ctx.fillStyle = opts.colors?.[i] ?? opts.color;
    // Nudge cap height so the visual top matches y for display faces.
    ctx.fillText(line, x, y + i * f.lineHeight + (f.lineHeight - f.size) * 0.5);
  });
}

/**
 * Draws a text run where segments wrapped in **double asterisks** are bold,
 * on one line (used for "With **Dr Name**" and chip values).
 */
export function drawRichLine(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  opts: { family: string; weight: number; boldWeight: number; color: string; boldColor?: string }
): number {
  const parts = text.split(/(\*\*[^*]+\*\*)/).filter(Boolean);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let cx = x;
  for (const p of parts) {
    const bold = p.startsWith('**');
    const s = bold ? p.slice(2, -2) : p;
    ctx.font = font(bold ? opts.boldWeight : opts.weight, size, opts.family);
    ctx.fillStyle = bold ? opts.boldColor ?? opts.color : opts.color;
    ctx.fillText(s, cx, y);
    cx += ctx.measureText(s).width;
  }
  return cx - x;
}

export function measureRich(ctx: Ctx, text: string, size: number, family: string, weight: number, boldWeight: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/).filter(Boolean);
  let w = 0;
  for (const p of parts) {
    const bold = p.startsWith('**');
    ctx.font = font(bold ? boldWeight : weight, size, family);
    w += ctx.measureText(bold ? p.slice(2, -2) : p).width;
  }
  return w;
}

/** Draws an image scaled to cover the box, cropped around focus (0..1). */
export function drawCover(
  ctx: Ctx,
  img: CanvasImageSource & { width: number; height: number },
  x: number,
  y: number,
  w: number,
  h: number,
  focusX = 0.5,
  focusY = 0.4
) {
  const iw = (img as any).naturalWidth || img.width;
  const ih = (img as any).naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.min(Math.max(0, iw * focusX - sw / 2), iw - sw);
  const sy = Math.min(Math.max(0, ih * focusY - sh / 2), ih - sh);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Simple line icons drawn in a unit box, stroked in `color`. */
export type IconName = 'clock' | 'cards' | 'doc' | 'check' | 'calendar' | 'video' | 'book' | 'star' | 'users' | 'bolt';

export function drawIcon(ctx: Ctx, name: IconName, cx: number, cy: number, size: number, color: string) {
  const s = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (name) {
    case 'clock':
      ctx.arc(12, 12, 9, 0, Math.PI * 2);
      ctx.moveTo(12, 7);
      ctx.lineTo(12, 12);
      ctx.lineTo(15.5, 14);
      break;
    case 'cards':
      ctx.rect(3, 8, 14, 11);
      ctx.moveTo(6, 5);
      ctx.lineTo(20, 5);
      ctx.lineTo(20, 16);
      break;
    case 'doc':
      ctx.rect(5, 3, 14, 18);
      ctx.moveTo(8, 8);
      ctx.lineTo(16, 8);
      ctx.moveTo(8, 12);
      ctx.lineTo(16, 12);
      ctx.moveTo(8, 16);
      ctx.lineTo(13, 16);
      break;
    case 'check':
      ctx.moveTo(4, 12.5);
      ctx.lineTo(9.5, 18);
      ctx.lineTo(20, 6);
      break;
    case 'calendar':
      ctx.rect(3, 5, 18, 16);
      ctx.moveTo(3, 10);
      ctx.lineTo(21, 10);
      ctx.moveTo(8, 3);
      ctx.lineTo(8, 7);
      ctx.moveTo(16, 3);
      ctx.lineTo(16, 7);
      break;
    case 'video':
      ctx.rect(2, 6, 14, 12);
      ctx.moveTo(16, 10);
      ctx.lineTo(22, 7);
      ctx.lineTo(22, 17);
      ctx.lineTo(16, 14);
      break;
    case 'book':
      ctx.moveTo(12, 6);
      ctx.lineTo(12, 20);
      ctx.moveTo(12, 6);
      ctx.quadraticCurveTo(7, 3, 3, 5);
      ctx.lineTo(3, 19);
      ctx.quadraticCurveTo(7, 17, 12, 20);
      ctx.quadraticCurveTo(17, 17, 21, 19);
      ctx.lineTo(21, 5);
      ctx.quadraticCurveTo(17, 3, 12, 6);
      break;
    case 'star':
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const b = a + Math.PI / 5;
        ctx.lineTo(12 + 9 * Math.cos(a), 12 + 9 * Math.sin(a));
        ctx.lineTo(12 + 4 * Math.cos(b), 12 + 4 * Math.sin(b));
      }
      ctx.closePath();
      break;
    case 'users':
      ctx.arc(9, 8, 3.5, 0, Math.PI * 2);
      ctx.moveTo(2.5, 20);
      ctx.quadraticCurveTo(9, 11, 15.5, 20);
      ctx.moveTo(17.5, 4.8);
      ctx.arc(16, 8, 3.2, -1.1, 1.3);
      ctx.moveTo(18, 13);
      ctx.quadraticCurveTo(21, 15, 22, 20);
      break;
    case 'bolt':
      ctx.moveTo(13, 2);
      ctx.lineTo(4, 14);
      ctx.lineTo(11, 14);
      ctx.lineTo(10, 22);
      ctx.lineTo(20, 9);
      ctx.lineTo(13, 9);
      ctx.closePath();
      break;
  }
  ctx.stroke();
  ctx.restore();
}

/** Picks a sensible icon for a proof chip from its wording. */
export function iconForClaim(text: string): IconName {
  const t = text.toLowerCase();
  if (/hour|hrs|video|lecture/.test(t)) return 'clock';
  if (/flashcard|card|osce|dxtx|tool/.test(t)) return 'cards';
  if (/question|mcq|qbank|mock|paper|recall/.test(t)) return 'doc';
  if (/note|topic|reference|book|textbook|trial/.test(t)) return 'book';
  if (/faculty|mentor|contributor|expert/.test(t)) return 'users';
  if (/year|trust|jaypee/.test(t)) return 'star';
  return 'check';
}

/** Arrow glyph drawn after CTA text. */
export function drawArrow(ctx: Ctx, x: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.14);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, cy);
  ctx.lineTo(x + size, cy);
  ctx.moveTo(x + size * 0.58, cy - size * 0.4);
  ctx.lineTo(x + size, cy);
  ctx.lineTo(x + size * 0.58, cy + size * 0.4);
  ctx.stroke();
  ctx.restore();
}
