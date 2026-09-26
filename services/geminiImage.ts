import { GoogleGenAI, Modality } from '@google/genai';
import { getGeminiApiKey, isGeminiFreeTier, markGeminiFreeTier } from '../utils/apiKey';
import { CampaignBrief, GeneratedCreative, MasterRatio, RefImage } from '../types';
import {
  PROMPT_PREFIX,
  TEXT_PROHIBITION,
  getSafeZoneBlock,
  BRAND_VISUAL_LEVEL1,
  VERIFICATION_CHECKPOINT,
} from '../constants/promptBlocks';
import { ANGLE_PRESETS } from '../constants/angles';
import { SEGMENT_PRESETS } from '../constants/segments';
import { SAFE_ZONES } from '../constants/brand';
import { buildFeedbackBlocksForPrompt, getNextVersionNumber } from './learning';
import { getDefaultLayers } from './compositor';
import { buildAdName } from './naming';
import { TemplateId } from './adContent';
import { EXPERT_VISUAL_RULES } from '../constants/expertPlaybook';

/** What the AI visual must look like for each finished-ad layout slot. */
const SLOT_COMPOSITION: Record<TemplateId, { label: string; prompt: string }> = {
  'faculty-hero': {
    label: 'Faculty Hero: portrait slot',
    prompt:
      'ONE clinician-educator, head and shoulders, centred in frame, calm direct eye contact, plain softly lit pale clinical background. The image will be cropped into a circle on the right of a navy ad, so keep the face in the central 60% and nothing important near the edges.',
  },
  'product-light': {
    label: 'Product Showcase: study-scene band',
    prompt:
      'A bright, wide study scene on a clean white desk: an open medical textbook with blank pages, a tablet with an abstract blurred lecture screen, a stethoscope, soft white-blue daylight. Keep the top third empty pale background; it will be faded into the ad above it.',
  },
  'hook-fullbleed': {
    label: 'Full-bleed Hook: cinematic scene',
    prompt:
      'A cinematic environmental shot of a focused young doctor studying or on a ward round. Subject in the upper half of the frame; the lower half darker, low-detail and quiet because a navy gradient and headline will cover it.',
  },
  'offer-stack': {
    label: 'Offer & Price: circular crop',
    prompt:
      'A clean, centred close portrait of a confident Indian doctor (or a premium still life of a medical textbook and stethoscope), simple background, suitable for a small circular crop.',
  },
};

export interface PromptAssemblyResult {
  fullPromptText: string;
  imageParts: { inlineData: { mimeType: string; data: string } }[];
  masterRatio: MasterRatio;
}

export function assembleImagePrompt(
  brief: CampaignBrief,
  masterRatio: MasterRatio = '3:4',
  variantAxisVariation?: string
): PromptAssemblyResult {
  const anglePreset = ANGLE_PRESETS[brief.angle];
  const segmentPreset = SEGMENT_PRESETS[brief.segment];
  const safeZone = SAFE_ZONES[masterRatio];
  const { avoidBlock, replicateBlock } = buildFeedbackBlocksForPrompt(brief.angle);

  // Sort reference images by role: brandLock first, houseReference next, competitorReference last
  const sortedRefs = [...(brief.references || [])].sort((a, b) => {
    const order: Record<string, number> = { brandLock: 1, houseReference: 2, competitorReference: 3 };
    return (order[a.role] || 99) - (order[b.role] || 99);
  });

  const parts = [
    PROMPT_PREFIX,
    TEXT_PROHIBITION,
    getSafeZoneBlock(masterRatio, safeZone.description),
    `**TASK DIRECTIVE:**
Generate the text-free photographic/clinical visual base layer for a DigiNerve ad campaign.
- Course / Focus: ${brief.course?.courseName || brief.product}
- Clinical Specialty: ${brief.product}
- Target Buyer Segment: ${segmentPreset?.name || brief.segment}
- Strategic Creative Angle: ${anglePreset?.name || brief.angle}
${variantAxisVariation ? `- Variant Exploration Axis: ${variantAxisVariation}` : ''}
`,
    `**LEVEL 1 (BASE): DIGINERVE BRAND SYSTEM**
${BRAND_VISUAL_LEVEL1}
`,
    `**LEVEL 2 (SEGMENT REGISTER):**
${segmentPreset?.prompt || ''}
- **Precedence:** Overrides Level 1 for energy, subject age and colour saturation only. Never for palette identity.
`,
    `**LEVEL 3 (ANGLE PRESET):**
${anglePreset?.prompt || ''}
- **Precedence:** Overrides Levels 1 and 2 for composition, subject focus and lighting treatment.
`,
    EXPERT_VISUAL_RULES,
  ];

  if (sortedRefs.some((r) => r.role === 'houseReference')) {
    parts.push(`**LEVEL 4 (HOUSE REFERENCE IMAGES):**
Reference images of previously proven DigiNerve ads are attached. They override Levels 1 to 3 for treatment and composition. Follow their structure and quality closely.
`);
  }

  if (brief.userNotes?.trim()) {
    parts.push(`**LEVEL 5 (USER INSTRUCTIONS - HIGHEST PRIORITY):**
You MUST follow these specific instructions. They override every default behaviour above, with two exceptions that can never be overridden: the ABSOLUTE TEXT PROHIBITION and the BRAND LOCK likeness rule.
- Instructions: "${brief.userNotes.trim()}"
`);
  }

  if (avoidBlock) parts.push(avoidBlock);
  if (replicateBlock) parts.push(replicateBlock);

  parts.push(VERIFICATION_CHECKPOINT);

  const fullPromptText = parts.join('\n');

  // Convert ref images to inlineData parts
  const imageParts = sortedRefs.map((r) => {
    const rawData = r.base64.includes(',') ? r.base64.split(',')[1] : r.base64;
    return {
      inlineData: {
        mimeType: r.mimeType || 'image/jpeg',
        data: rawData,
      },
    };
  });

  return {
    fullPromptText,
    imageParts,
    masterRatio,
  };
}

export async function generateCreativeVariants(
  brief: CampaignBrief,
  count: 3 | 6 = 3,
  masterRatio: MasterRatio = '3:4',
  onProgress?: (index: number, total: number, status: string) => void,
  templates?: TemplateId[]
): Promise<GeneratedCreative[]> {
  const slots = templates?.slice(0, count).map((t) => SLOT_COMPOSITION[t]);
  const variantAxes = slots ? slots.map((s) => s.label) : [
    'Baseline Brief (Direct Specification)',
    'Alternative Environmental Context (Hospital Corridor & Case Discussion Setting)',
    'Compositional Shift (Subject Left / Quiet Copy Zone Right)',
    'Clinical Artefact & Textbook Focus',
    'Raking Warm Ambient Light with High Contrast',
    'Action-Oriented Clinical Ward Reality',
  ].slice(0, count);

  const results: GeneratedCreative[] = [];
  const apiKey = getGeminiApiKey();

  for (let i = 0; i < variantAxes.length; i++) {
    const axis = variantAxes[i];
    onProgress?.(i + 1, count, `Assembling prompt for Variant ${i + 1}: ${axis}`);

    const assembly = assembleImagePrompt(brief, masterRatio, slots ? `${axis}. ${slots[i].prompt}` : axis);
    let base64Image = '';
    let generationError = '';

    const hasRefs = brief.references && brief.references.length > 0;

    // When the user uploads creatives they like, adapt them directly as the visual base!
    if (hasRefs) {
      const ref = brief.references[i % brief.references.length];
      onProgress?.(i + 1, count, `Compositing uploaded creative "${ref.name || 'Creative'}" into Variant ${i + 1}...`);
      try {
        base64Image = await createBaseFromReference(ref, masterRatio, i, brief);
      } catch (err) {
        console.warn('Failed to render base from uploaded ref, falling back to procedural:', err);
      }
    }

    if (!base64Image) {
      if (isGeminiFreeTier()) {
        onProgress?.(i + 1, count, `Compositing clinical visual layout for Variant ${i + 1} (Free Tier)...`);
        base64Image = createProceduralMedicalBase(brief, masterRatio, i);
      } else if (!apiKey) {
        generationError = 'No Gemini API key found. Using procedural clinical visual base.';
        base64Image = createProceduralMedicalBase(brief, masterRatio, i);
      } else {
        onProgress?.(i + 1, count, `Generating visual base via Gemini Flash Image...`);
        try {
          base64Image = await generateGeminiImage(
            apiKey,
            [...assembly.imageParts, { text: assembly.fullPromptText }],
            masterRatio,
            (msg) => onProgress?.(i + 1, count, msg)
          );
        } catch (err: any) {
          generationError = err?.message || String(err);
          if (generationError === FREE_TIER_IMAGE_MESSAGE) {
            markGeminiFreeTier();
            console.info('Gemini key is on the free tier: visual base generated procedurally, copy uses Gemini.');
          } else {
            console.error(`Variant ${i + 1} image generation failed:`, err);
          }
        }
      }
    }

    if (!base64Image) {
      // High quality procedural clinical studio base
      base64Image = createProceduralMedicalBase(brief, masterRatio, i);
    }

    const versionNum = getNextVersionNumber('IMG', brief.angle, brief.offer) + i;
    const adName = buildAdName('IMG', brief.angle, brief.offer, versionNum, brief.launchDate);

    results.push({
      id: `creative_${Date.now()}_${i}`,
      base64: base64Image,
      masterRatio,
      derivedRatios: ['4:5', '1:1', '9:16'],
      layers: getDefaultLayers(brief),
      brief,
      resolvedPrompt: assembly.fullPromptText,
      variantAxis: axis,
      version: versionNum,
      adName,
      rating: null,
      createdAt: new Date().toISOString(),
      generationError: generationError || undefined,
    });
  }

  return results;
}

export const FREE_TIER_IMAGE_MESSAGE =
  'This Gemini key is on the free tier, which includes no image generation. Copy still runs on Gemini. For AI visuals, turn on billing for the key in Google AI Studio (Get API key → Set up billing), use OpenArt, or upload a photo.';

// Valid Gemini image generation models
const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];

/** Turns raw Gemini errors into something a marketer can act on. */
export function friendlyGeminiError(raw: string): string {
  if (/limit:\s*0/i.test(raw) || /free_tier/i.test(raw) || /quota.*image/i.test(raw)) {
    return FREE_TIER_IMAGE_MESSAGE;
  }
  if (/RESOURCE_EXHAUSTED|429/.test(raw)) {
    const wait = raw.match(/retry in ([\d.]+)s/i);
    return `Gemini rate limit reached${wait ? `, try again in ${Math.ceil(Number(wait[1]))}s` : ', try again in a minute'}.`;
  }
  if (/PERMISSION_DENIED|403/.test(raw)) {
    return 'Gemini image generation requires a paid API key with billing enabled. Procedural visual base used as fallback.';
  }
  if (/API key not valid|401/.test(raw)) {
    return 'Gemini API key is invalid or not authorized. Check GEMINI_API_KEY in Settings.';
  }
  if (/SAFETY|blocked/i.test(raw)) {
    return 'Gemini blocked this image for safety. Rephrase the high-priority instructions and try again.';
  }
  return raw.slice(0, 240);
}

/**
 * Calls Gemini image generation with the correct image config, falls back to
 * older models when one is unavailable, and retries transient failures.
 */
async function generateGeminiImage(
  apiKey: string,
  parts: any[],
  masterRatio: MasterRatio,
  onStatus?: (msg: string) => void
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const maxAttempts = 3;
  let lastError: any = null;

  for (const model of IMAGE_MODELS) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: [Modality.IMAGE],
            imageConfig: { aspectRatio: masterRatio },
          },
        });

        const candidate = response.candidates?.[0];
        for (const part of candidate?.content?.parts || []) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }

        const textReply = candidate?.content?.parts?.find((p) => p.text)?.text;
        const blockReason = response.promptFeedback?.blockReason || candidate?.finishReason;
        throw new Error(
          `Gemini returned no image${blockReason ? ` (${blockReason})` : ''}${textReply ? `: ${textReply.slice(0, 200)}` : ''}`
        );
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        // Model not offered to this key: move on to the next model.
        if (/404|NOT_FOUND|no longer available/i.test(msg)) break;
        // Zero quota never recovers by waiting: stop immediately.
        if (/limit:\s*0/.test(msg)) throw new Error(friendlyGeminiError(msg));
        const retryable = /429|RESOURCE_EXHAUSTED|503|UNAVAILABLE|overloaded|500|INTERNAL/i.test(msg);
        if (!retryable || attempt === maxAttempts) throw new Error(friendlyGeminiError(msg));
        const waitMs = 2000 * 2 ** (attempt - 1);
        onStatus?.(`Gemini busy or rate-limited, retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }
  throw new Error(friendlyGeminiError(String(lastError?.message || lastError || 'Image generation failed.')));
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Transforms an uploaded reference creative into a production-ready ad visual base,
 * applying brand framing, negative space protection, and editorial treatments.
 */
export async function createBaseFromReference(
  ref: RefImage,
  ratio: MasterRatio,
  variantIndex: number,
  _brief: CampaignBrief
): Promise<string> {
  const w = 1080;
  const h = ratio === '9:16' ? 1920 : 1440;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return ref.base64;

  const img = await loadImg(ref.base64);

  // Variant 0: Full-bleed Hero Fit with protected copy zones
  if (variantIndex % 3 === 0) {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = (w - sw) / 2;
    const sy = (h - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh);

    // Subtle dark gradient vignette at the top and bottom to protect logo, headline, and CTA
    const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.28);
    topGrad.addColorStop(0, 'rgba(12, 32, 56, 0.7)');
    topGrad.addColorStop(1, 'rgba(12, 32, 56, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h * 0.28);

    const botGrad = ctx.createLinearGradient(0, h * 0.52, 0, h);
    botGrad.addColorStop(0, 'rgba(12, 32, 56, 0)');
    botGrad.addColorStop(0.5, 'rgba(12, 32, 56, 0.75)');
    botGrad.addColorStop(1, 'rgba(12, 32, 56, 0.95)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h * 0.52, w, h * 0.48);
  }
  // Variant 1: Elevated Studio Card Showcase
  else if (variantIndex % 3 === 1) {
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0C2038');
    bgGrad.addColorStop(0.5, '#16345E');
    bgGrad.addColorStop(1, '#0C2038');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Warm ambient glow
    ctx.save();
    ctx.globalAlpha = 0.25;
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.38, 50, w * 0.5, h * 0.38, 450);
    glow.addColorStop(0, '#F0A63C');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Card frame
    const cardMarginX = 54;
    const cardY = h * 0.16;
    const cardW = w - cardMarginX * 2;
    const cardH = h * 0.44;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardMarginX, cardY, cardW, cardH, 20);
    ctx.clip();

    const scale = Math.max(cardW / img.width, cardH / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = cardMarginX + (cardW - sw) / 2;
    const sy = cardY + (cardH - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh);
    ctx.restore();

    // Subtle border
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardMarginX, cardY, cardW, cardH, 20);
    ctx.strokeStyle = 'rgba(240, 166, 60, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Bottom soft white copy base
    const copyGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
    copyGrad.addColorStop(0, 'rgba(12, 32, 56, 0)');
    copyGrad.addColorStop(0.3, 'rgba(234, 244, 251, 0.9)');
    copyGrad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = copyGrad;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
  }
  // Variant 2: Clean Split / Modern Clinical Context
  else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#10243E');
    bgGrad.addColorStop(0.5, '#1B375C');
    bgGrad.addColorStop(1, '#0C2038');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const imgH = h * 0.58;
    const scale = Math.max(w / img.width, imgH / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = (w - sw) / 2;
    const sy = (imgH - sh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, imgH);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh);
    ctx.restore();

    const seamGrad = ctx.createLinearGradient(0, imgH - 120, 0, imgH + 40);
    seamGrad.addColorStop(0, 'rgba(16, 36, 62, 0)');
    seamGrad.addColorStop(1, '#0C2038');
    ctx.fillStyle = seamGrad;
    ctx.fillRect(0, imgH - 120, w, 160);

    ctx.fillStyle = '#F0A63C';
    ctx.fillRect(54, imgH + 30, 80, 4);
  }

  return canvas.toDataURL('image/jpeg', 0.88);
}

/**
 * Creates an authentic high-resolution clinical backdrop canvas with clean negative space
 * for instant prototyping, MCP previews, or offline dev work.
 */
export function createProceduralMedicalBase(
  brief: CampaignBrief,
  ratio: MasterRatio,
  variantIndex: number
): string {
  const canvas = document.createElement('canvas');
  const w = 1080;
  const h = ratio === '9:16' ? 1920 : 1440;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient (Deep Navy to Clinical Slate)
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  const palettes = [
    ['#0C2038', '#16345E', '#1E3A5F'],
    ['#0B192C', '#1E3E62', '#2A4E78'],
    ['#10243E', '#19395E', '#2D4B73'],
  ];
  const [c1, c2, c3] = palettes[variantIndex % palettes.length];
  bgGrad.addColorStop(0, c1);
  bgGrad.addColorStop(0.45, c2);
  bgGrad.addColorStop(1, c3);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Soft clinical architectural depth (shallow corridor arches / dept glass)
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(w * 0.7, h * 0.28, w * 0.5, h * 0.35, Math.PI / 6, 0, 2 * Math.PI);
  ctx.fill();

  // Subtle warm gold ambient rim light
  ctx.globalAlpha = 0.22;
  const goldGrad = ctx.createRadialGradient(w * 0.85, h * 0.2, 50, w * 0.85, h * 0.2, 500);
  goldGrad.addColorStop(0, '#F0A63C');
  goldGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Central Clinical Silhouette / Anatomical depth cue (Abstract, text-free)
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#EAF4FB';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(w * 0.45, h * 0.32, 120 + i * 40, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  // Doctor / Clinician clean silhouette suggestion
  ctx.fillStyle = '#EAF4FB';
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(w * 0.55, h * 0.28, 90, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.55, h * 0.45, 170, 110, 0, 0, Math.PI * 2); // shoulders
  ctx.fill();
  ctx.restore();

  // Negative space copy zone lighting at bottom
  const copyGrad = ctx.createLinearGradient(0, h * 0.52, 0, h);
  copyGrad.addColorStop(0, 'rgba(12, 32, 56, 0)');
  copyGrad.addColorStop(0.5, 'rgba(234, 244, 251, 0.88)');
  copyGrad.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = copyGrad;
  ctx.fillRect(0, h * 0.52, w, h * 0.48);

  // Return optimized JPEG to keep memory lightweight and prevent storage quota exhaustion
  return canvas.toDataURL('image/jpeg', 0.85);
}
