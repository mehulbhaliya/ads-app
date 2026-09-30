import { Ratio } from '../types';
import { BRAND } from '../constants/brand';
import { AdContent, TemplateId } from './adContent';
import { LogoAssets } from '../utils/logo';
import {
  Ctx,
  FONTS,
  font,
  fitText,
  drawLines,
  fillRound,
  roundRect,
  withShadow,
  drawCover,
  drawIcon,
  iconForClaim,
  drawArrow,
  drawRichLine,
  measureRich,
  FittedText,
} from './adRender';

/**
 * Finished-ad templates modelled on DigiNerve's own best creatives
 * (MRCOG Part 1 series) plus competitor layout patterns. Each template draws
 * the complete ad (background, AI visual, logo, text, CTA) for any ratio.
 */

export const AD_SIZES: Record<Ratio, { width: number; height: number; label: string; platform: string }> = {
  '4:5': { width: 1080, height: 1350, label: 'Feed 4:5', platform: 'Meta feed (primary)' },
  '1:1': { width: 1080, height: 1080, label: 'Square 1:1', platform: 'Meta feed · Google Display' },
  '9:16': { width: 1080, height: 1920, label: 'Story 9:16', platform: 'Meta Stories · Reels' },
  '1.91:1': { width: 1200, height: 628, label: 'Landscape 1.91:1', platform: 'Google Display · link ads' },
};

export interface TemplateAssets {
  base?: HTMLImageElement | null; // AI visual
  faculty?: HTMLImageElement | null; // real faculty photo (brand lock)
  logo?: LogoAssets | null;
}

interface Frame {
  W: number;
  H: number;
  u: number; // 1 unit = W/1080 (or H-based on landscape)
  ratio: Ratio;
  safeTop: number; // y where content may start
  safeBottom: number; // y where content must end
  pad: number; // side padding
}

const C = {
  navy: BRAND.navy,
  navyDeep: BRAND.navyDeep,
  gold: BRAND.gold,
  goldDeep: '#E88810', // headline orange on light backgrounds (house style)
  cta: '#F8A830', // CTA amber with navy text (house style)
  tint: BRAND.tintLight,
  white: BRAND.surface,
  success: BRAND.success,
  ink: '#0E1B2E',
};

function frameFor(ratio: Ratio): Frame {
  const { width: W, height: H } = AD_SIZES[ratio];
  const u = ratio === '1.91:1' ? H / 628 : W / 1080;
  // Stories: keep clear of the profile bar (top ~12%) and reply bar (bottom ~18%).
  const safeTop = ratio === '9:16' ? H * 0.12 : H * 0.045;
  const safeBottom = ratio === '9:16' ? H * 0.82 : H - H * 0.045;
  return { W, H, u, ratio, safeTop, safeBottom, pad: (ratio === '1.91:1' ? 40 : 60) * u };
}

/* ------------------------------------------------------------------ */
/* Stack layout: measure every block, shrink together until they fit. */
/* ------------------------------------------------------------------ */

interface Block {
  measure: (s: number) => number;
  draw: (y: number, s: number) => void;
  gapAfter?: number; // unscaled units
}

function layoutStack(blocks: Block[], top: number, available: number, u: number, align: 'top' | 'center' | 'bottom' | 'auto' = 'top') {
  const live = blocks.filter(Boolean);
  let s = 1;
  let total = 0;
  for (; s >= 0.5; s -= 0.04) {
    total = live.reduce((acc, b, i) => acc + b.measure(s) + (i < live.length - 1 ? (b.gapAfter ?? 24) * u * s : 0), 0);
    if (total <= available) break;
  }
  // 'auto': top-aligned, but centred when more than a fifth of the space would sit empty.
  const mode = align === 'auto' ? (available - total > available * 0.2 ? 'center' : 'top') : align;
  let y = mode === 'top' ? top : mode === 'center' ? top + (available - total) / 2 : top + available - total;
  for (let i = 0; i < live.length; i++) {
    const b = live[i];
    const h = b.measure(s);
    b.draw(y, s);
    y += h + (i < live.length - 1 ? (b.gapAfter ?? 24) * u * s : 0);
  }
  return s;
}

/* ---------------------------- Shared parts ---------------------------- */

function drawLogo(ctx: Ctx, logo: LogoAssets | null | undefined, x: number, y: number, w: number, dark: boolean) {
  if (logo) {
    const img = dark ? logo.dark : logo.light;
    ctx.drawImage(img, x, y, w, w / logo.aspect);
    return w / logo.aspect;
  }
  // Typeset fallback wordmark.
  const size = w * 0.24;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = font(800, size, FONTS.heading);
  ctx.fillStyle = dark ? C.white : C.navy;
  ctx.fillText('digi', x, y);
  const dw = ctx.measureText('digi').width;
  ctx.fillStyle = dark ? C.white : C.gold; // full white on dark, never white + gold
  ctx.fillText('nerve', x + dw, y);
  ctx.font = font(500, size * 0.36, FONTS.body);
  ctx.fillStyle = dark ? C.white : C.navy;
  ctx.fillText('A Jaypee Initiative', x + w * 0.3, y + size * 1.05);
  return size * 1.5;
}

function fitTwoTone(
  ctx: Ctx,
  a: string,
  b: string,
  maxWidth: number,
  maxSize: number,
  maxLines: number,
  family = FONTS.display,
  weight: number | string = 400
): { A: FittedText; B: FittedText } {
  for (let size = maxSize; size >= 18; size -= Math.max(1, size * 0.04)) {
    const A = fitText(ctx, a, { family, weight, maxWidth, maxSize: size, minSize: size, maxLines: 6, lineHeight: 1.04, uppercase: true });
    const B = fitText(ctx, b, { family, weight, maxWidth, maxSize: size, minSize: size, maxLines: 6, lineHeight: 1.04, uppercase: true });
    const lines = (a ? A.lines.length : 0) + (b ? B.lines.length : 0);
    if (lines <= maxLines && A.width <= maxWidth && B.width <= maxWidth) return { A, B };
  }
  const A = fitText(ctx, a, { family, weight, maxWidth, maxSize: 18, minSize: 18, maxLines: 3, lineHeight: 1.04, uppercase: true });
  const B = fitText(ctx, b, { family, weight, maxWidth, maxSize: 18, minSize: 18, maxLines: 3, lineHeight: 1.04, uppercase: true });
  return { A, B };
}

function hookBlock(ctx: Ctx, c: AdContent, x: number, width: number, maxSize: number, maxLines: number, colorA: string, colorB: string): Block {
  const fit = (s: number) => fitTwoTone(ctx, c.hook, c.hookAccent, width, maxSize * s, maxLines);
  return {
    measure: (s) => {
      if (!c.hook && !c.hookAccent) return 0;
      const { A, B } = fit(s);
      return (c.hook ? A.height : 0) + (c.hookAccent ? B.height : 0);
    },
    draw: (y, s) => {
      if (!c.hook && !c.hookAccent) return;
      const { A, B } = fit(s);
      if (c.hook) drawLines(ctx, A, x, y, { family: FONTS.display, weight: 400, color: colorA });
      if (c.hookAccent) drawLines(ctx, B, x, y + (c.hook ? A.height : 0), { family: FONTS.display, weight: 400, color: colorB });
    },
  };
}

function barBlock(ctx: Ctx, x: number, w: number, h: number, color: string): Block {
  return {
    measure: (s) => h * s,
    draw: (y, s) => fillRound(ctx, x, y, w, h * s, (h * s) / 2, color),
  };
}

function textBlock(
  ctx: Ctx,
  text: string,
  x: number,
  width: number,
  opts: { family: string; weight: number; size: number; color: string; maxLines?: number; uppercase?: boolean; lineHeight?: number }
): Block {
  const fit = (s: number) =>
    fitText(ctx, text, {
      family: opts.family,
      weight: opts.weight,
      maxWidth: width,
      maxSize: opts.size * s,
      minSize: Math.max(12, opts.size * s * 0.6),
      maxLines: opts.maxLines ?? 2,
      uppercase: opts.uppercase,
      lineHeight: opts.lineHeight ?? 1.2,
    });
  return {
    measure: (s) => (text ? fit(s).height : 0),
    draw: (y, s) => text && drawLines(ctx, fit(s), x, y, { family: opts.family, weight: opts.weight, color: opts.color }),
  };
}

/** "With **Dr Name**" pill. */
function pillBlock(ctx: Ctx, rich: string, x: number, maxW: number, size: number, bg: string, color: string, boldColor: string): Block {
  const dims = (s: number) => {
    let sz = size * s;
    let w = measureRich(ctx, rich, sz, FONTS.heading, 500, 700);
    while (w > maxW - sz * 1.6 && sz > 12) {
      sz -= 1;
      w = measureRich(ctx, rich, sz, FONTS.heading, 500, 700);
    }
    return { sz, w: w + sz * 1.6, h: sz * 1.9 };
  };
  return {
    measure: (s) => (rich ? dims(s).h : 0),
    draw: (y, s) => {
      if (!rich) return;
      const d = dims(s);
      fillRound(ctx, x, y, d.w, d.h, d.h * 0.28, bg);
      drawRichLine(ctx, rich, x + d.sz * 0.8, y + d.h / 2, d.sz, { family: FONTS.heading, weight: 500, boldWeight: 700, color, boldColor });
    },
  };
}

function ctaPillBlock(ctx: Ctx, text: string, x: number, maxW: number, size: number): Block {
  const dims = (s: number) => {
    const sz = size * s;
    ctx.font = font(800, sz, FONTS.heading);
    const tw = Math.min(ctx.measureText(text.toUpperCase()).width, maxW - sz * 3.4);
    return { sz, w: tw + sz * 3.4, h: sz * 2.4, tw };
  };
  return {
    measure: (s) => dims(s).h,
    draw: (y, s) => {
      const d = dims(s);
      withShadow(ctx, 18 * s, 6 * s, 'rgba(224,138,30,0.35)', () => fillRound(ctx, x, y, d.w, d.h, d.h / 2, C.cta));
      ctx.font = font(800, d.sz, FONTS.heading);
      ctx.fillStyle = C.navyDeep;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(text.toUpperCase(), x + d.sz * 1.1, y + d.h / 2, d.tw);
      drawArrow(ctx, x + d.sz * 1.1 + d.tw + d.sz * 0.6, y + d.h / 2, d.sz * 0.9, C.navyDeep);
    },
  };
}

function drawCtaBar(ctx: Ctx, text: string, x: number, y: number, w: number, h: number) {
  withShadow(ctx, 20, 8, 'rgba(0,0,0,0.25)', () => fillRound(ctx, x, y, w, h, h * 0.28, C.cta));
  const f = fitText(ctx, text, { family: FONTS.heading, weight: 800, maxWidth: w - h * 2, maxSize: h * 0.42, minSize: 14, maxLines: 1, uppercase: true });
  ctx.font = font(800, f.size, FONTS.heading);
  const tw = ctx.measureText(f.lines[0] || '').width;
  const arrow = f.size * 0.9;
  const startX = x + (w - tw - arrow - f.size * 0.5) / 2;
  ctx.fillStyle = C.navyDeep;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(f.lines[0] || '', startX, y + h / 2);
  drawArrow(ctx, startX + tw + f.size * 0.5, y + h / 2, arrow, C.navyDeep);
}

/** Row of up to 3 proof tiles: icon circle + text with the number emphasised. */
function drawProofRow(
  ctx: Ctx,
  proofs: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  style: 'light' | 'glass'
) {
  const items = proofs.filter((p) => p.trim()).slice(0, 3);
  if (!items.length) return;
  const gap = h * 0.14;
  const tileW = (w - gap * (items.length - 1)) / items.length;
  // House chip style: the number big ("2,000+"), the label smaller underneath,
  // both at one size across all chips so they read as a set.
  const split = (t: string) => {
    const m = t.match(/^([\d,.]+\+?)\s+(.*)$/);
    return m ? { num: m[1], label: m[2] } : { num: '', label: t };
  };
  const r0 = h * 0.3;
  const textW0 = tileW - (h * 0.16 + 2 * r0 + h * 0.14) - h * 0.12;
  const parts = items.map(split);
  const numSize = Math.min(
    ...parts.filter((q) => q.num).map((q) => fitText(ctx, q.num, { family: FONTS.heading, weight: 800, maxWidth: textW0, maxSize: h * 0.3, minSize: 12, maxLines: 1 }).size),
    h * 0.3
  );
  const labelSize = Math.min(
    ...parts.map((q) => fitText(ctx, q.label, { family: FONTS.heading, weight: 600, maxWidth: textW0, maxSize: h * 0.17, minSize: 10, maxLines: q.num ? 2 : 3, lineHeight: 1.12 }).size)
  );
  items.forEach((p, i) => {
    const tx = x + i * (tileW + gap);
    if (style === 'light') {
      withShadow(ctx, 14, 4, 'rgba(0,0,0,0.18)', () => fillRound(ctx, tx, y, tileW, h, h * 0.16, C.white));
    } else {
      fillRound(ctx, tx, y, tileW, h, h * 0.16, 'rgba(255,255,255,0.12)');
      roundRect(ctx, tx, y, tileW, h, h * 0.16);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    const r = h * 0.3;
    const cx = tx + h * 0.16 + r;
    const cy = y + h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = style === 'light' ? C.navy : C.gold;
    ctx.fill();
    drawIcon(ctx, iconForClaim(p), cx, cy, r * 1.1, style === 'light' ? C.white : C.navyDeep);

    const textX = cx + r + h * 0.14;
    const textW = tx + tileW - textX - h * 0.12;
    const q = parts[i];
    const color = style === 'light' ? C.navyDeep : C.white;
    const labelFit = fitText(ctx, q.label, { family: FONTS.heading, weight: 600, maxWidth: textW, maxSize: labelSize, minSize: labelSize, maxLines: q.num ? 2 : 3, lineHeight: 1.12 });
    const numH = q.num ? numSize * 1.1 : 0;
    let ty = y + (h - numH - labelFit.height) / 2;
    if (q.num) {
      ctx.font = font(800, numSize, FONTS.heading);
      ctx.fillStyle = style === 'light' ? C.navyDeep : C.gold;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(q.num, textX, ty, textW);
      ty += numH;
    }
    drawLines(ctx, labelFit, textX, ty, { family: FONTS.heading, weight: 600, color });
  });
}

function drawCredentialCard(ctx: Ctx, c: AdContent, x: number, y: number, w: number, maxH: number) {
  if (!c.facultyName) return 0;
  const p = w * 0.07;
  const name = fitText(ctx, c.facultyName, { family: FONTS.heading, weight: 700, maxWidth: w - 2 * p, maxSize: w * 0.085, minSize: 12, maxLines: 1 });
  const cred = c.facultyCredentials
    ? fitText(ctx, c.facultyCredentials, { family: FONTS.body, weight: 500, maxWidth: w - 2 * p, maxSize: w * 0.05, minSize: 10, maxLines: 2 })
    : null;
  const role = c.facultyRole
    ? fitText(ctx, c.facultyRole, { family: FONTS.body, weight: 500, maxWidth: w - 2 * p, maxSize: w * 0.045, minSize: 10, maxLines: 2 })
    : null;
  const h = Math.min(maxH, p * 2 + name.height + (cred ? cred.height + p * 0.3 : 0) + (role ? role.height + p * 0.9 : 0));
  const top = y - h;
  withShadow(ctx, 18, 6, 'rgba(0,0,0,0.25)', () => fillRound(ctx, x, top, w, h, w * 0.04, C.white));
  let cy = top + p;
  drawLines(ctx, name, x + p, cy, { family: FONTS.heading, weight: 700, color: C.navyDeep });
  cy += name.height + p * 0.3;
  if (cred) {
    drawLines(ctx, cred, x + p, cy, { family: FONTS.body, weight: 500, color: C.ink });
    cy += cred.height + p * 0.3;
  }
  if (role) {
    ctx.fillStyle = C.gold;
    ctx.fillRect(x + p, cy, w - 2 * p, 3);
    cy += p * 0.6;
    drawLines(ctx, role, x + p, cy, { family: FONTS.body, weight: 500, color: C.ink });
  }
  return h;
}

function drawOfferBadge(ctx: Ctx, text: string, rightX: number, y: number, size: number) {
  if (!text) return;
  ctx.font = font(400, size, FONTS.display);
  const tw = ctx.measureText(text.toUpperCase()).width;
  const w = tw + size * 1.4;
  const h = size * 1.7;
  withShadow(ctx, 16, 6, 'rgba(0,0,0,0.3)', () => fillRound(ctx, rightX - w, y, w, h, h * 0.22, C.gold));
  ctx.fillStyle = C.navyDeep;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text.toUpperCase(), rightX - w / 2, y + h / 2 + size * 0.04);
}

function photoSource(a: TemplateAssets) {
  return a.faculty || a.base || null;
}

function drawPhotoPlaceholder(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#D6E7F5');
  g.addColorStop(1, '#A9C8E4');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(22,52,94,0.35)';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.4, Math.min(w, h) * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.82, Math.min(w, h) * 0.3, Math.min(w, h) * 0.2, 0, Math.PI, 0);
  ctx.fill();
}

/* ------------------------------ Templates ------------------------------ */

function facultyHero(ctx: Ctx, f: Frame, c: AdContent, a: TemplateAssets) {
  const { W, H, u, pad } = f;
  const story = f.ratio === '9:16';
  const land = f.ratio === '1.91:1';

  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, C.navy);
  bg.addColorStop(1, C.navyDeep);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Photo inside a large soft circle (right side, or top on stories).
  const circle = story
    ? { cx: W * 0.62, cy: f.safeTop + W * 0.33 + 10 * u, r: W * 0.33 }
    : land
    ? { cx: W * 0.84, cy: H * 0.5, r: H * 0.46 }
    : { cx: W * 0.84, cy: H * (f.ratio === '1:1' ? 0.34 : 0.31), r: W * 0.37 };
  ctx.save();
  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.r + 26 * u, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(234,244,251,0.10)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2);
  ctx.clip();
  const src = photoSource(a);
  const box = { x: circle.cx - circle.r, y: circle.cy - circle.r, w: circle.r * 2, h: circle.r * 2 };
  if (src) drawCover(ctx, src, box.x, box.y, box.w, box.h, 0.5, 0.3);
  else drawPhotoPlaceholder(ctx, box.x, box.y, box.w, box.h);
  ctx.restore();

  // Text column stays left of the photo circle.
  const colX = pad;
  const colW = story ? W - 2 * pad : land ? W * 0.46 : W * 0.42;

  // Bottom band: CTA bar + proof row (landscape: CTA under the text column only).
  const ctaH = (land ? 64 : story ? 120 : 108) * u;
  const ctaY = f.safeBottom - ctaH;
  drawCtaBar(ctx, c.cta, pad, ctaY, land ? colW : W - 2 * pad, ctaH);
  const hasProofs = c.proofs.some((p) => p.trim()) && !land;
  const proofH = (story ? 150 : 140) * u;
  const proofY = ctaY - proofH - 24 * u;
  if (hasProofs) drawProofRow(ctx, c.proofs, pad, proofY, W - 2 * pad, proofH, 'light');

  // Credential card over the photo, always right of the text column.
  const colRight = colX + colW;
  const cardW = story ? W * 0.52 : Math.min(W * (land ? 0.3 : 0.44), W - pad - colRight - 24 * u);
  const cardBottom = story ? circle.cy + circle.r * 0.95 : land ? H - pad : (hasProofs ? proofY : ctaY) - 22 * u;
  if (c.facultyName) drawCredentialCard(ctx, c, W - pad - cardW, cardBottom, cardW, 220 * u);

  // Left column stack.
  const top = story ? circle.cy + circle.r + 40 * u : f.safeTop;
  const bottom = (hasProofs ? proofY : ctaY) - 30 * u;

  const blocks: Block[] = [];
  let stackTop = top;
  let logoBottom = 0;
  if (!story) {
    // Logo pinned top-right (house rule); the text column starts below the logo band.
    const lw = W * (land ? 0.2 : 0.27);
    const lh = drawLogo(ctx, a.logo, W - pad - lw, top, lw, true);
    logoBottom = top + lh;
    stackTop = top + lh + 34 * u;
  }
  blocks.push({ ...hookBlock(ctx, c, colX, colW, (land ? 58 : 100) * u, land ? 4 : 5, C.white, C.gold), gapAfter: 18 });
  blocks.push({ ...barBlock(ctx, colX, W * 0.2, 7 * u, C.gold), gapAfter: 28 });

  // Course card.
  const cardPad = 26 * u;
  const titleFit = (s: number) =>
    fitText(ctx, c.courseTitle, { family: FONTS.display, weight: 400, maxWidth: colW - 2 * cardPad, maxSize: (land ? 46 : 72) * u * s, minSize: 16, maxLines: 2, uppercase: true, lineHeight: 1.02 });
  const subFit = (s: number) =>
    fitText(ctx, c.courseSubtitle, { family: FONTS.display, weight: 400, maxWidth: colW - 2 * cardPad, maxSize: (land ? 30 : 44) * u * s, minSize: 14, maxLines: 2, uppercase: true, lineHeight: 1.05 });
  const pill = c.facultyName ? `With **${c.facultyName}**` : '';
  const pb = pillBlock(ctx, pill, colX + cardPad, colW - 2 * cardPad, 30 * u, C.tint, C.navyDeep, C.navyDeep);
  const courseCardH = (s: number) =>
    cardPad * 2 + titleFit(s).height + (c.courseSubtitle ? subFit(s).height + 6 * u : 0) + (pill ? pb.measure(s) + 18 * u * s : 0);
  if (c.courseTitle) {
    blocks.push({
      measure: courseCardH,
      draw: (y, s) => {
        const h = courseCardH(s);
        withShadow(ctx, 20, 8, 'rgba(0,0,0,0.3)', () => fillRound(ctx, colX, y, colW, h, 22 * u, C.white));
        let cy = y + cardPad;
        const tf = titleFit(s);
        drawLines(ctx, tf, colX + cardPad, cy, { family: FONTS.display, weight: 400, color: C.navyDeep });
        cy += tf.height + 6 * u;
        if (c.courseSubtitle) {
          const sf = subFit(s);
          drawLines(ctx, sf, colX + cardPad, cy, { family: FONTS.display, weight: 400, color: C.navy });
          cy += sf.height;
        }
        if (pill) pb.draw(cy + 18 * u * s, s);
      },
      gapAfter: 26,
    });
  }
  if (c.dateLine) {
    blocks.push(datePillBlock(ctx, c.dateLine, colX, colW, 30 * u));
  }
  layoutStack(blocks, stackTop, bottom - stackTop, u, story ? 'center' : 'auto');

  if (story) {
    const lw = W * 0.3;
    logoBottom = f.safeTop - 10 * u + drawLogo(ctx, a.logo, W - pad - lw, f.safeTop - 10 * u, lw, true);
  }
  // Offer badge sits under the logo so the two never collide.
  if (c.offer) drawOfferBadge(ctx, c.offer, W - pad, logoBottom + 18 * u, (land ? 26 : 38) * u);
}

function datePillBlock(ctx: Ctx, text: string, x: number, maxW: number, size: number): Block {
  const dims = (s: number) => {
    const sz = size * s;
    ctx.font = font(600, sz, FONTS.heading);
    const tw = Math.min(ctx.measureText(text).width, maxW - sz * 4.4);
    return { sz, tw, h: sz * 2.3, w: tw + sz * 4.4 };
  };
  return {
    measure: (s) => dims(s).h,
    draw: (y, s) => {
      const d = dims(s);
      roundRect(ctx, x, y, d.w, d.h, d.h / 2);
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      const r = d.h * 0.42;
      ctx.beginPath();
      ctx.arc(x + d.h / 2, y + d.h / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = C.gold;
      ctx.fill();
      drawIcon(ctx, 'calendar', x + d.h / 2, y + d.h / 2, r * 1.1, C.navyDeep);
      drawRichLine(ctx, text, x + d.h + d.sz * 0.5, y + d.h / 2, d.sz, { family: FONTS.heading, weight: 600, boldWeight: 700, color: C.white, boldColor: C.gold });
    },
  };
}

function productLight(ctx: Ctx, f: Frame, c: AdContent, a: TemplateAssets) {
  const { W, H, u, pad } = f;
  const story = f.ratio === '9:16';
  const land = f.ratio === '1.91:1';

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#FFFFFF');
  bg.addColorStop(1, C.tint);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Dot grid accent.
  ctx.fillStyle = 'rgba(22,52,94,0.18)';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    ctx.beginPath();
    ctx.arc(W - pad - j * 38 * u, pad * 0.9 + i * 38 * u + (story ? f.safeTop : 0), 6 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  // AI scene along the bottom (or right third on landscape), fading into the background.
  const sceneTop = land ? 0 : story ? H * 0.56 : H * (f.ratio === '1:1' ? 0.6 : 0.58);
  const sceneX = land ? W * 0.58 : 0;
  const sceneW = land ? W * 0.42 : W;
  const sceneH = land ? H : H - sceneTop;
  if (a.base) drawCover(ctx, a.base, sceneX, sceneTop, sceneW, sceneH, 0.5, 0.55);
  else drawPhotoPlaceholder(ctx, sceneX, sceneTop, sceneW, sceneH);
  const fade = land ? ctx.createLinearGradient(sceneX, 0, sceneX + sceneW * 0.35, 0) : ctx.createLinearGradient(0, sceneTop, 0, sceneTop + sceneH * 0.3);
  fade.addColorStop(0, land ? '#F5FAFD' : '#F3F8FC');
  fade.addColorStop(1, 'rgba(243,248,252,0)');
  ctx.fillStyle = fade;
  if (land) ctx.fillRect(sceneX, 0, sceneW * 0.35, H);
  else ctx.fillRect(0, sceneTop, W, sceneH * 0.3);

  // Portrait card top-right when there is a faculty photo.
  const showCard = !!a.faculty && !land;
  const cardW = story ? W * 0.38 : W * 0.34;
  const cardH = cardW * 1.12;
  const cardX = W - pad - cardW;
  const cardY = story ? f.safeTop + 40 * u : H * 0.16; // below the top-right logo
  if (showCard) {
    withShadow(ctx, 24, 8, 'rgba(22,52,94,0.25)', () => fillRound(ctx, cardX - 8 * u, cardY - 8 * u, cardW + 16 * u, cardH + 16 * u, 34 * u, C.white));
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, 28 * u);
    ctx.clip();
    drawCover(ctx, a.faculty!, cardX, cardY, cardW, cardH, 0.5, 0.3);
    ctx.restore();
  }

  const colX = pad;
  const colW = land ? W * 0.52 : showCard && !story ? W * 0.56 : W - 2 * pad;
  const top = story ? f.safeTop + (showCard ? cardH + 70 * u : 0) : pad;
  const bottom = land ? H - pad : sceneTop + (story ? 0 : 20 * u);

  const blocks: Block[] = [];
  const logoW = (land ? 0.2 : 0.3) * W;
  blocks.push({ measure: (s) => (logoW * s) / (a.logo?.aspect || 2.8), draw: (y, s) => drawLogo(ctx, a.logo, W - pad - logoW * s, y, logoW * s, false), gapAfter: 14 });
  if (c.badge) blocks.push({ ...pillBlock(ctx, c.badge, colX, colW, 24 * u, C.navy, C.white, C.white), gapAfter: 34 });
  blocks.push({
    ...textBlock(ctx, c.courseTitle, colX, colW, { family: FONTS.display, weight: 400, size: (land ? 64 : 118) * u, color: C.navyDeep, maxLines: 2, uppercase: true, lineHeight: 1.0 }),
    gapAfter: 4,
  });
  if (c.courseSubtitle) {
    blocks.push({
      ...textBlock(ctx, c.courseSubtitle, colX, colW, { family: FONTS.display, weight: 400, size: (land ? 40 : 66) * u, color: C.goldDeep, maxLines: 2, uppercase: true, lineHeight: 1.02 }),
      gapAfter: 26,
    });
  }
  if (c.facultyName) blocks.push({ ...pillBlock(ctx, `With **${c.facultyName}**`, colX, colW, 36 * u, '#DCEBF7', C.navyDeep, C.navyDeep), gapAfter: 20 });
  blocks.push({ ...barBlock(ctx, colX, colW * 0.8, 5 * u, C.gold), gapAfter: 20 });
  if (c.tagline) blocks.push({ ...textBlock(ctx, c.tagline, colX, colW, { family: FONTS.body, weight: 500, size: 34 * u, color: C.navyDeep, maxLines: 2 }), gapAfter: 26 });
  blocks.push(ctaPillBlock(ctx, c.cta, colX, colW, 34 * u));
  layoutStack(blocks, top, bottom - top, u, 'top');

  if (c.offer) drawOfferBadge(ctx, c.offer, W - pad, sceneTop + 24 * u, (land ? 26 : 40) * u);
}

function hookFullbleed(ctx: Ctx, f: Frame, c: AdContent, a: TemplateAssets) {
  const { W, H, u, pad } = f;
  const land = f.ratio === '1.91:1';
  const src = a.base || a.faculty;
  if (src) drawCover(ctx, src, 0, 0, W, H, land ? 0.7 : 0.5, 0.3);
  else drawPhotoPlaceholder(ctx, 0, 0, W, H);

  const topFade = ctx.createLinearGradient(0, 0, 0, H * 0.25);
  topFade.addColorStop(0, 'rgba(12,32,56,0.75)');
  topFade.addColorStop(1, 'rgba(12,32,56,0)');
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, W, H * 0.25);

  if (land) {
    const side = ctx.createLinearGradient(0, 0, W * 0.72, 0);
    side.addColorStop(0, 'rgba(12,32,56,0.97)');
    side.addColorStop(0.7, 'rgba(12,32,56,0.85)');
    side.addColorStop(1, 'rgba(12,32,56,0)');
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, W, H);
  } else {
    const start = H * (f.ratio === '9:16' ? 0.3 : 0.28);
    const g = ctx.createLinearGradient(0, start, 0, H);
    g.addColorStop(0, 'rgba(12,32,56,0)');
    g.addColorStop(0.35, 'rgba(12,32,56,0.88)');
    g.addColorStop(1, 'rgba(12,32,56,0.98)');
    ctx.fillStyle = g;
    ctx.fillRect(0, start, W, H - start);
  }

  const fbLogoW = W * (land ? 0.18 : 0.28);
  const fbLogoH = drawLogo(ctx, a.logo, W - pad - fbLogoW, f.safeTop, fbLogoW, true);
  if (c.offer) drawOfferBadge(ctx, c.offer, W - pad, f.safeTop + fbLogoH + 18 * u, (land ? 24 : 38) * u);

  const ctaH = (land ? 64 : 108) * u;
  const colW = land ? W * 0.55 : W - 2 * pad;
  const ctaW = land ? colW : W - 2 * pad;
  const ctaY = f.safeBottom - ctaH;
  drawCtaBar(ctx, c.cta, pad, ctaY, ctaW, ctaH);
  const proofH = 132 * u;
  const hasProofs = !land && c.proofs.some((p) => p.trim());
  const proofY = ctaY - proofH - 22 * u;
  if (hasProofs) drawProofRow(ctx, c.proofs, pad, proofY, W - 2 * pad, proofH, 'glass');

  const courseLine = [c.courseTitle, c.courseSubtitle].filter(Boolean).join(' · ');
  const blocks: Block[] = [
    { ...hookBlock(ctx, c, pad, colW, (land ? 58 : 120) * u, 4, C.white, C.gold), gapAfter: 18 },
    { ...barBlock(ctx, pad, W * 0.18, 7 * u, C.gold), gapAfter: 20 },
    { ...textBlock(ctx, courseLine, pad, colW, { family: FONTS.heading, weight: 700, size: (land ? 26 : 38) * u, color: C.white, maxLines: 2 }), gapAfter: 10 },
  ];
  if (c.facultyName) blocks.push(textBlock(ctx, `With ${c.facultyName}`, pad, colW, { family: FONTS.heading, weight: 500, size: (land ? 22 : 32) * u, color: C.tint, maxLines: 1 }));
  const bottom = (hasProofs ? proofY : ctaY) - 30 * u;
  const top = land ? f.safeTop + H * 0.18 : H * 0.42;
  layoutStack(blocks, top, bottom - top, u, 'bottom');
}

function offerStack(ctx: Ctx, f: Frame, c: AdContent, a: TemplateAssets) {
  const { W, H, u, pad } = f;
  const story = f.ratio === '9:16';
  const land = f.ratio === '1.91:1';

  ctx.fillStyle = C.navyDeep;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.15, 10, W * 0.85, H * 0.15, W * 0.8);
  glow.addColorStop(0, 'rgba(240,166,60,0.30)');
  glow.addColorStop(1, 'rgba(240,166,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Round photo with gold ring.
  const src = photoSource(a);
  const circ = story
    ? { cx: W * 0.5, cy: H * 0.57, r: W * 0.19 }
    : land
    ? { cx: W * 0.82, cy: H * 0.57, r: H * 0.36 } // lowered to clear the top-right logo
    : { cx: W * 0.8, cy: H * (f.ratio === '1:1' ? 0.5 : 0.52), r: W * 0.17 };
  ctx.beginPath();
  ctx.arc(circ.cx, circ.cy, circ.r + 12 * u, 0, Math.PI * 2);
  ctx.fillStyle = C.gold;
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(circ.cx, circ.cy, circ.r, 0, Math.PI * 2);
  ctx.clip();
  const box = { x: circ.cx - circ.r, y: circ.cy - circ.r, w: circ.r * 2, h: circ.r * 2 };
  if (src) drawCover(ctx, src, box.x, box.y, box.w, box.h, 0.5, 0.35);
  else drawPhotoPlaceholder(ctx, box.x, box.y, box.w, box.h);
  ctx.restore();

  const ctaH = (land ? 64 : 110) * u;
  const ctaY = f.safeBottom - ctaH;
  drawCtaBar(ctx, c.cta, pad, ctaY, land ? W * 0.6 : W - 2 * pad, ctaH);

  const colX = pad;
  const colW = story ? W - 2 * pad : land ? W * 0.6 : W * 0.5;
  const top = f.safeTop;
  const bottom = story ? circ.cy - circ.r - 40 * u : ctaY - 30 * u;

  const blocks: Block[] = [];
  blocks.push({ measure: (s) => (W * (land ? 0.18 : 0.27) * s) / (a.logo?.aspect || 2.8), draw: (y, s) => drawLogo(ctx, a.logo, W - pad - W * (land ? 0.18 : 0.27) * s, y, W * (land ? 0.18 : 0.27) * s, true), gapAfter: 36 });
  if (c.offer) {
    blocks.push({
      measure: (s) => (land ? 44 : 64) * u * s * 1.7,
      draw: (y, s) => {
        const size = (land ? 44 : 64) * u * s;
        ctx.font = font(400, size, FONTS.display);
        const tw = Math.min(ctx.measureText(c.offer.toUpperCase()).width, colW - size * 1.2);
        const w = tw + size * 1.2;
        withShadow(ctx, 18, 6, 'rgba(0,0,0,0.35)', () => fillRound(ctx, colX, y, w, size * 1.7, size * 0.3, C.gold));
        ctx.fillStyle = C.navyDeep;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(c.offer.toUpperCase(), colX + size * 0.6, y + size * 0.87, tw);
      },
      gapAfter: 30,
    });
  }
  blocks.push({ ...textBlock(ctx, c.courseTitle, colX, colW, { family: FONTS.display, weight: 400, size: (land ? 56 : 96) * u, color: C.white, maxLines: 2, uppercase: true, lineHeight: 1.0 }), gapAfter: 4 });
  if (c.courseSubtitle) blocks.push({ ...textBlock(ctx, c.courseSubtitle, colX, colW, { family: FONTS.display, weight: 400, size: (land ? 34 : 50) * u, color: C.gold, maxLines: 2, uppercase: true, lineHeight: 1.04 }), gapAfter: 26 });
  if (c.priceNow) {
    blocks.push({
      measure: (s) => (land ? 50 : 84) * u * s * 1.1,
      draw: (y, s) => {
        const size = (land ? 50 : 84) * u * s;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = font(400, size, FONTS.numeric);
        ctx.fillStyle = C.gold;
        ctx.fillText(c.priceNow, colX, y);
        let x = colX + ctx.measureText(c.priceNow).width + size * 0.3;
        if (c.priceWas) {
          ctx.font = font(600, size * 0.42, FONTS.heading);
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          const pw = ctx.measureText(c.priceWas).width;
          const py = y + size * 0.42;
          ctx.fillText(c.priceWas, x, py);
          ctx.fillRect(x, py + size * 0.22, pw, Math.max(2, size * 0.04));
          x += pw;
        }
      },
      gapAfter: 26,
    });
  }
  const checks = c.proofs.filter((p) => p.trim()).slice(0, 3);
  checks.forEach((p, i) => {
    const size = (land ? 22 : 32) * u;
    blocks.push({
      measure: (s) => {
        const ft = fitText(ctx, p, { family: FONTS.heading, weight: 600, maxWidth: colW - size * 2.2 * s, maxSize: size * s, minSize: 12, maxLines: 2 });
        return Math.max(size * 1.6 * s, ft.height);
      },
      draw: (y, s) => {
        const r = size * 0.72 * s;
        ctx.beginPath();
        ctx.arc(colX + r, y + r, r, 0, Math.PI * 2);
        ctx.fillStyle = C.success;
        ctx.fill();
        drawIcon(ctx, 'check', colX + r, y + r, r * 1.2, C.white);
        const ft = fitText(ctx, p, { family: FONTS.heading, weight: 600, maxWidth: colW - size * 2.2 * s, maxSize: size * s, minSize: 12, maxLines: 2 });
        drawLines(ctx, ft, colX + size * 2.1 * s, y + Math.max(0, r - ft.lineHeight / 2), { family: FONTS.heading, weight: 600, color: C.white });
      },
      gapAfter: i === checks.length - 1 ? 0 : 16,
    });
  });
  layoutStack(blocks, top, bottom - top, u, 'top');

  if (c.facultyName && !land) {
    const nameY = circ.cy + circ.r + 26 * u;
    const ft = fitText(ctx, c.facultyName, { family: FONTS.heading, weight: 700, maxWidth: circ.r * 2.6, maxSize: 30 * u, minSize: 12, maxLines: 1 });
    ctx.save();
    ctx.textAlign = 'center';
    drawLines(ctx, ft, circ.cx, nameY, { family: FONTS.heading, weight: 700, color: C.white, align: 'center' });
    ctx.restore();
  }
}

const TEMPLATES: Record<TemplateId, (ctx: Ctx, f: Frame, c: AdContent, a: TemplateAssets) => void> = {
  'faculty-hero': facultyHero,
  'product-light': productLight,
  'hook-fullbleed': hookFullbleed,
  'offer-stack': offerStack,
};

/** Renders a finished ad into `canvas` at the full export size for `ratio`. */
export function renderAd(canvas: HTMLCanvasElement, ratio: Ratio, content: AdContent, assets: TemplateAssets) {
  const f = frameFor(ratio);
  canvas.width = f.W;
  canvas.height = f.H;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, f.W, f.H);
  ctx.save();
  (TEMPLATES[content.template] || facultyHero)(ctx, f, content, assets);
  ctx.restore();
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
