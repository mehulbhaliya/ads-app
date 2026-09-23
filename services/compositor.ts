import { Ratio, MasterRatio, TextLayer, CampaignBrief, BrandColorToken } from '../types';
import { BRAND, BRAND_IDENTITY } from '../constants/brand';

export const RATIO_DIMENSIONS: Record<Ratio, { width: number; height: number; label: string }> = {
  '4:5': { width: 1080, height: 1350, label: 'Meta Primary Feed (4:5)' },
  '1:1': { width: 1080, height: 1080, label: 'Meta Square Feed (1:1)' },
  '9:16': { width: 1080, height: 1920, label: 'Meta Story / Reel (9:16)' },
  '1.91:1': { width: 1200, height: 628, label: 'Landscape Link (1.91:1)' },
};

export function getDefaultLayers(brief: CampaignBrief): TextLayer[] {
  const claim =
    brief.course?.approvedClaims?.find((c) => !c.conflict)?.claim || '55+ Years Jaypee Medical Publishing';

  const layers: TextLayer[] = [
    {
      id: 'layer_logo',
      role: 'logo',
      content: 'DigiNerve',
      tagline: 'A JAYPEE ENTERPRISE',
      logoVariant: 'full',
      token: 'navyDeep',
      fontSize: 22,
      fontWeight: 'bold',
      x: 0.08,
      y: 0.07,
      maxWidthPct: 45,
      align: 'left',
      locked: false,
    },
    {
      id: 'layer_brand_tag',
      role: 'brandTag',
      content: 'A Jaypee Enterprise | 55+ Years Trust',
      badgeStyle: 'official',
      token: 'gold',
      bgToken: 'navyDeep',
      fontSize: 12,
      fontWeight: 'bold',
      x: 0.62,
      y: 0.07,
      maxWidthPct: 35,
      align: 'right',
      locked: false,
    },
    {
      id: 'layer_proof',
      role: 'proofChip',
      content: claim,
      token: 'navy',
      bgToken: 'tintLight',
      fontSize: 13,
      fontWeight: 'semibold',
      x: 0.08,
      y: 0.63,
      maxWidthPct: 84,
      align: 'left',
      locked: false,
    },
    {
      id: 'layer_headline',
      role: 'headline',
      content: `${brief.product} Clinical Residency`,
      token: 'navyDeep',
      fontSize: 32,
      fontWeight: 'bold',
      x: 0.08,
      y: 0.71,
      maxWidthPct: 84,
      align: 'left',
      locked: false,
    },
    {
      id: 'layer_subhead',
      role: 'subhead',
      content: `Master ${brief.course?.courseName || brief.product} with standard protocols & exam OSCE.`,
      token: 'navy',
      fontSize: 16,
      fontWeight: 'normal',
      x: 0.08,
      y: 0.81,
      maxWidthPct: 84,
      align: 'left',
      locked: false,
    },
    {
      id: 'layer_cta',
      role: 'cta',
      content: brief.type === 'CHATSHOW' ? 'BOOK LIVE PASS' : 'EXPLORE CURRICULUM',
      token: 'surface',
      bgToken: 'navy',
      fontSize: 15,
      fontWeight: 'bold',
      x: 0.08,
      y: 0.90,
      maxWidthPct: 45,
      align: 'center',
      locked: false,
    },
  ];

  if (brief.offer && brief.offer !== 'NOOFFER') {
    layers.push({
      id: 'layer_offer',
      role: 'offerBadge',
      content: brief.offer === 'FLAT40' ? 'FLAT 40% OFF' : brief.offer,
      token: 'navyDeep',
      bgToken: 'gold',
      fontSize: 13,
      fontWeight: 'bold',
      x: 0.64,
      y: 0.90,
      maxWidthPct: 30,
      align: 'center',
      locked: false,
    });
  }

  return layers;
}

/**
 * Draws the authentic DigiNerve brand emblem (neural pulse node with radiating arc)
 */
function drawDigiNerveEmblem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  accentColor: string,
  primaryColor: string
): void {
  ctx.save();
  // Central pulse node
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Outer orbital pulse arcs
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(x, y, size * 0.52, -Math.PI * 0.7, Math.PI * 0.2);
  ctx.stroke();

  ctx.strokeStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.76, Math.PI * 0.3, Math.PI * 1.2);
  ctx.stroke();

  ctx.restore();
}

export function renderAdToCanvas(
  canvas: HTMLCanvasElement,
  baseImage: HTMLImageElement,
  layers: TextLayer[],
  targetRatio: Ratio,
  masterRatio: MasterRatio
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const targetDim = RATIO_DIMENSIONS[targetRatio];
  canvas.width = targetDim.width;
  canvas.height = targetDim.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Calculate Crop from base image to target ratio
  const imgW = baseImage.naturalWidth || baseImage.width || 1080;
  const imgH = baseImage.naturalHeight || baseImage.height || 1440;

  const targetAspect = targetDim.width / targetDim.height;
  const imgAspect = imgW / imgH;

  let sX = 0,
    sY = 0,
    sW = imgW,
    sH = imgH;

  if (imgAspect > targetAspect) {
    // Image is wider than target
    sW = imgH * targetAspect;
    sX = (imgW - sW) / 2;
  } else {
    // Image is taller than target
    sH = imgW / targetAspect;
    sY = (imgH - sH) / 2;
  }

  // Draw visual base image
  ctx.drawImage(baseImage, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);

  // Subtle bottom gradient for copy legibility
  const grad = ctx.createLinearGradient(0, canvas.height * 0.52, 0, canvas.height);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.3, 'rgba(234, 244, 251, 0.75)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.96)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, canvas.height * 0.52, canvas.width, canvas.height * 0.48);

  // 2. Render Text & Graphic Layers
  const scale = canvas.width / 400; // Base reference scale

  for (const layer of layers) {
    const fontSize = layer.fontSize * (scale * 0.9);
    const x = layer.x * canvas.width;
    const y = layer.y * canvas.height;
    const maxWidth = (layer.maxWidthPct / 100) * canvas.width;

    const fontStyle = `${layer.fontWeight === 'bold' ? '800' : layer.fontWeight === 'semibold' ? '600' : '400'} ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.font = fontStyle;

    const colorHex = BRAND[layer.token] || BRAND.navy;
    const bgHex = layer.bgToken && layer.bgToken !== 'transparent' ? BRAND[layer.bgToken as BrandColorToken] : null;

    // Special Rendering for Logo
    if (layer.role === 'logo') {
      ctx.save();
      const emblemSize = fontSize * 1.4;
      const emblemX = x + emblemSize * 0.5;
      const emblemY = y + fontSize * 0.5;

      const primaryWordColor = layer.logoVariant === 'light' ? '#FFFFFF' : (BRAND[layer.token] || BRAND.navyDeep);
      const accentWordColor = BRAND.gold;

      // Draw emblem
      drawDigiNerveEmblem(ctx, emblemX, emblemY, emblemSize, accentWordColor, primaryWordColor);

      // Draw Wordmark
      const textStartX = emblemX + emblemSize * 0.75;
      ctx.font = `800 ${fontSize * 1.15}px system-ui, sans-serif`;
      ctx.fillStyle = primaryWordColor;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('Digi', textStartX, emblemY - (layer.tagline ? fontSize * 0.2 : 0));

      const digiMetrics = ctx.measureText('Digi');
      ctx.fillStyle = accentWordColor;
      ctx.fillText('Nerve', textStartX + digiMetrics.width, emblemY - (layer.tagline ? fontSize * 0.2 : 0));

      // Draw Tagline beneath wordmark
      const taglineText = layer.tagline || BRAND_IDENTITY.officialEndorsement.toUpperCase();
      if (layer.logoVariant !== 'compact' && taglineText) {
        ctx.font = `700 ${fontSize * 0.42}px system-ui, sans-serif`;
        ctx.fillStyle = layer.logoVariant === 'light' ? '#94A3B8' : BRAND.navy;
        ctx.letterSpacing = '1px';
        ctx.fillText(taglineText, textStartX, emblemY + fontSize * 0.55);
      }

      ctx.restore();
      continue;
    }

    // Special Rendering for Brand Tags
    if (layer.role === 'brandTag') {
      ctx.save();
      ctx.font = `700 ${fontSize * 0.85}px system-ui, sans-serif`;
      const textMetrics = ctx.measureText(layer.content);
      const padX = fontSize * 0.8;
      const padY = fontSize * 0.4;
      const boxW = Math.min(maxWidth, textMetrics.width + padX * 2 + fontSize);
      const boxH = fontSize * 1.5;
      const cornerRadius = 6 * scale;

      let drawX = x;
      if (layer.align === 'center') drawX = x - boxW / 2;
      else if (layer.align === 'right') drawX = x - boxW;

      // Container background
      ctx.fillStyle = bgHex || BRAND.navyDeep;
      ctx.beginPath();
      ctx.roundRect(drawX, y - fontSize * 0.8, boxW, boxH, cornerRadius);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = colorHex || BRAND.gold;
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();

      // Mini verification tick / emblem
      const iconX = drawX + fontSize * 0.7;
      const iconY = y - fontSize * 0.8 + boxH / 2;
      ctx.fillStyle = colorHex || BRAND.gold;
      ctx.beginPath();
      ctx.arc(iconX, iconY, fontSize * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Tag text
      ctx.fillStyle = colorHex || '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(layer.content, iconX + fontSize * 0.5, iconY);

      ctx.restore();
      continue;
    }

    // Special chip / badge / CTA styling
    if (bgHex) {
      ctx.save();
      const textMetrics = ctx.measureText(layer.content);
      const padX = fontSize * 0.9;
      const padY = fontSize * 0.45;
      const boxW = Math.min(maxWidth, textMetrics.width + padX * 2);
      const boxH = fontSize + padY * 2;
      const cornerRadius = layer.role === 'cta' ? 8 * scale : 6 * scale;

      let drawX = x;
      if (layer.align === 'center') drawX = x - boxW / 2;
      else if (layer.align === 'right') drawX = x - boxW;

      ctx.fillStyle = bgHex;
      ctx.beginPath();
      ctx.roundRect(drawX, y - fontSize, boxW, boxH, cornerRadius);
      ctx.fill();

      if (layer.role === 'proofChip') {
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Add subtle green check icon inside proof chip
        ctx.fillStyle = BRAND.success;
        ctx.beginPath();
        ctx.arc(drawX + padX * 0.6, y - fontSize + boxH / 2, fontSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colorHex;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.content, drawX + padX * 1.1, y - fontSize + boxH / 2);
      } else {
        ctx.fillStyle = colorHex;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.content, drawX + boxW / 2, y - fontSize + boxH / 2);
      }

      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = colorHex;
      ctx.textAlign = layer.align;
      ctx.textBaseline = 'top';

      // Multiline wrapping
      wrapText(ctx, layer.content, x, y, maxWidth, fontSize * 1.3, layer.align);
      ctx.restore();
    }
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' | 'right'
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

export function exportCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
