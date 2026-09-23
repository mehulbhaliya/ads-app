import { GoogleGenAI } from '@google/genai';
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
  onProgress?: (index: number, total: number, status: string) => void
): Promise<GeneratedCreative[]> {
  const variantAxes = [
    'Baseline Brief (Direct Specification)',
    'Alternative Environmental Context (Hospital Corridor & Case Discussion Setting)',
    'Compositional Shift (Subject Left / Quiet Copy Zone Right)',
    'Clinical Artefact & Textbook Focus',
    'Raking Warm Ambient Light with High Contrast',
    'Action-Oriented Clinical Ward Reality',
  ].slice(0, count);

  const results: GeneratedCreative[] = [];
  const apiKey = (process.env as any).GEMINI_API_KEY || (process.env as any).API_KEY;

  for (let i = 0; i < variantAxes.length; i++) {
    const axis = variantAxes[i];
    onProgress?.(i + 1, count, `Assembling prompt for Variant ${i + 1}: ${axis}`);

    const assembly = assembleImagePrompt(brief, masterRatio, axis);
    let base64Image = '';

    if (apiKey) {
      try {
        onProgress?.(i + 1, count, `Generating visual base via Gemini 2.5 Flash Image...`);
        const ai = new GoogleGenAI({ apiKey });
        const parts: any[] = [...assembly.imageParts, { text: assembly.fullPromptText }];

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: parts,
          config: {
            // @ts-ignore
            aspectRatio: masterRatio,
          },
        });

        // Parse image output from response candidate parts
        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`Variant ${i + 1} API image generation failed, falling back to procedural studio base:`, err);
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
    });
  }

  return results;
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
