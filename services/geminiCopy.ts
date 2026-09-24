import { GoogleGenAI } from '@google/genai';
import { splitCourseName, confirmedFaculty } from './adContent';
import { getGeminiApiKey } from '../utils/apiKey';
import { CampaignBrief, MetaAdCopy } from '../types';

const BANNED_WORDS = [
  'diploma',
  'dive into',
  'game-changing',
  'leverage',
  'synergize',
  'circle back',
  'touch base',
  'straightforward',
  'great results',
  'top-rated',
  'strong performance',
  'marrow',
  'prepladder',
  'cerebellum',
  'doctutorials',
];

export function validateCopyRules(
  copy: { primaryText: string; headline: string; description: string },
  brief: CampaignBrief
): string[] {
  const errors: string[] = [];
  const textToCheck = `${copy.primaryText} ${copy.headline} ${copy.description}`.toLowerCase();

  // Em dash check
  if (/[—–]/.test(copy.primaryText + copy.headline + copy.description)) {
    errors.push('Em dashes (—) or en dashes (–) detected. Use commas, colons or periods.');
  }

  // Banned words check
  for (const word of BANNED_WORDS) {
    if (textToCheck.includes(word)) {
      errors.push(`Violates rule: Contains prohibited term "${word}".`);
    }
  }

  // MRCOG live-cohort framing check
  if (brief.product === 'MRCOG') {
    const livePatterns = ['join us on', 'batch', 'live session', 'cohort starts', 'starting on'];
    for (const pat of livePatterns) {
      if (textToCheck.includes(pat)) {
        errors.push(`MRCOG violation: MRCOG courses are self-paced and recorded. Never use live-cohort framing ("${pat}").`);
      }
    }
  }

  // Check unconfirmed faculty names
  if (brief.course) {
    const disputedFaculty = brief.course.facultyNames.filter((f) => f.spellingConfidence !== 'confirmed');
    for (const f of disputedFaculty) {
      if (textToCheck.includes(f.name.toLowerCase())) {
        errors.push(`Faculty name "${f.name}" has disputed/unknown spelling confidence. Do not print in copy.`);
      }
    }

    if (brief.course.chiefEditor && brief.course.chiefEditor.spellingConfidence !== 'confirmed') {
      if (textToCheck.includes(brief.course.chiefEditor.name.toLowerCase())) {
        errors.push(`Chief editor name "${brief.course.chiefEditor.name}" is disputed. Do not print in copy.`);
      }
    }
  }

  // Character limit validation
  if (copy.headline.length > 40) {
    errors.push(`Headline (${copy.headline.length} chars) exceeds 40-character hard limit.`);
  }
  if (copy.description.length > 27) {
    errors.push(`Description (${copy.description.length} chars) exceeds 27-character limit.`);
  }

  return errors;
}

export async function generateMetaCopy(brief: CampaignBrief): Promise<MetaAdCopy[]> {
  if (!brief.course) {
    throw new Error('Copy generation refused: Course facts are mandatory for factual grounding.');
  }

  // Prepare approved claims
  const approvedClaimsList = brief.course.approvedClaims
    .filter((c) => !c.conflict)
    .map((c) => c.claim);

  const highlights = brief.course.curriculumHighlights.slice(0, 4);

  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a compliance-first senior copywriter for DigiNerve (Jaypee Brothers Medical Publishers) writing Meta ad copy for Indian doctors.

COURSE: ${brief.course.courseName}
SEGMENT: ${brief.segment}
ANGLE: ${brief.angle}
OFFER: ${({ FLAT40: 'Flat 40% off', FLAT30: 'Flat 30% off', FREETRIAL: 'Free trial', FEST: 'Festive offer', LAUNCH: 'Launch offer', NOOFFER: 'No offer, do not mention discounts' } as Record<string, string>)[brief.offer] || brief.offer} (write it in plain words, never as a code)
APPROVED NUMERIC CLAIMS (YOU CAN ONLY USE NUMBERS FROM THIS EXACT LIST, NO OTHER NUMBERS):
${approvedClaimsList.map((c) => `- "${c}"`).join('\n')}

CURRICULUM HIGHLIGHTS:
${highlights.map((h) => `- ${h}`).join('\n')}

MANDATORY LIMITS:
- Primary text: Maximum 125 chars before truncation. Hook within the first 90 chars.
- Headline: Maximum 40 chars hard ceiling (27 chars preferred).
- Description: Maximum 27 chars.
- CTA: Must be one of ["SIGN_UP", "APPLY_NOW", "BOOK_NOW", "SHOP_NOW", "LEARN_MORE", "WHATSAPP_MESSAGE"].

ABSOLUTE NEGATIVE RULES (INSTANT FAILURE IF VIOLATED):
- NO "diploma" (DigiNerve sells MD/MS prep and clinical certifications, never diplomas).
- NO live cohort framing on MRCOG (recorded & self-paced only).
- NO vague fluff ("great results", "top-rated").
- NO em-dashes (—). Use periods, colons or commas.
- NO competitor names (Marrow, PrepLadder, etc.). Use "typical alternative platform".
- NO words: "dive into", "game-changing", "leverage", "synergize", "circle back", "straightforward".

Generate 5 distinct, high-converting concept options formatted as strict JSON:
[
  {
    "conceptName": "Clinical Hook",
    "primaryText": "Exact text...",
    "headline": "Exact headline...",
    "description": "Short...",
    "cta": "SIGN_UP",
    "groundedFacts": ["fact 1 used"]
  }
]
`;

      // gemini-2.5-flash is closed to new keys; use the rolling alias, then a lite fallback.
      let response: any = null;
      let lastErr: any = null;
      for (const model of ['gemini-flash-latest', 'gemini-3.1-flash-lite']) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });
          break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!response) throw lastErr;

      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => {
          const pt = item.primaryText || '';
          const hl = item.headline || '';
          const desc = item.description || '';
          const errs = validateCopyRules({ primaryText: pt, headline: hl, description: desc }, brief);

          return {
            id: `copy_${Date.now()}_${idx}`,
            conceptName: item.conceptName || `Concept ${idx + 1}`,
            primaryText: pt,
            primaryTextLength: pt.length,
            primaryTextValid: pt.length <= 125,
            headline: hl,
            headlineLength: hl.length,
            headlineValid: hl.length <= 40,
            description: desc,
            descriptionLength: desc.length,
            descriptionValid: desc.length <= 27,
            cta: item.cta || getRecommendedCta(brief.type),
            groundedFacts: item.groundedFacts || approvedClaimsList.slice(0, 2),
            validationErrors: errs,
          };
        });
      }
    } catch (e) {
      console.warn('Gemini Copy API call encountered error, falling back to verified deterministic synthesizer:', e);
    }
  }

  // High-fidelity verified deterministic copy synthesizer
  return generateCuratedGroundCopy(brief, approvedClaimsList);
}

export function getRecommendedCta(type: string): 'SIGN_UP' | 'APPLY_NOW' | 'BOOK_NOW' | 'SHOP_NOW' | 'LEARN_MORE' | 'WHATSAPP_MESSAGE' {
  switch (type) {
    case 'LEADS':
      return 'SIGN_UP';
    case 'CHATSHOW':
      return 'BOOK_NOW';
    case 'SALES':
      return 'SHOP_NOW';
    case 'WA':
      return 'WHATSAPP_MESSAGE';
    default:
      return 'LEARN_MORE';
  }
}

function generateCuratedGroundCopy(brief: CampaignBrief, claims: string[]): MetaAdCopy[] {
  const claim1 = claims[0] || 'Content from Jaypee Brothers Medical Publishers';
  const claim2 = claims[1] || 'high-yield, exam-aligned revision';
  // Human course name ("OBGYN MD"), never the internal product code.
  const courseShort = splitCourseName(brief.course?.courseName || brief.product)[0].replace(/^Cracking\s+/i, '');
  const lead = confirmedFaculty(brief.course)[0]?.name;

  const concepts: { name: string; pt: string; hl: string; desc: string; cta: any }[] = [
    {
      name: 'Faculty & Rigour',
      pt: lead
        ? `Learn ${courseShort} from ${lead}. ${claim1}. Structured, exam-aligned revision.`
        : `Learn ${courseShort} from specialists who teach it daily. ${claim1}. Structured revision.`,
      hl: `${courseShort}: Learn From Specialists`,
      desc: 'Backed by Jaypee',
      cta: getRecommendedCta(brief.type),
    },
    {
      name: 'High-Yield Focus',
      pt: `Built for busy residents: ${claim1} and ${claim2}. Finishable, not exhaustive.`,
      hl: `High-Yield ${courseShort} Prep`,
      desc: 'Start your revision',
      cta: getRecommendedCta(brief.type),
    },
    {
      name: 'Factual Proof',
      pt: `${claim1}. ${claim2}. Every topic mapped to real exam patterns.`,
      hl: `${courseShort}, Mapped to the Exam`,
      desc: 'See the curriculum',
      cta: getRecommendedCta(brief.type),
    },
    {
      name: 'Exam Readiness',
      pt: `Tired of endless question banks? Focus on ${claim2} with clear diagnosis-to-treatment pathways.`,
      hl: `Exam-Ready ${courseShort}`,
      desc: 'Revise with a plan',
      cta: getRecommendedCta(brief.type),
    },
    {
      name: 'Publisher Pedigree',
      pt: `From Jaypee Brothers Medical Publishers, now as a ${courseShort} course. ${claim1}.`,
      hl: `${courseShort} by DigiNerve`,
      desc: 'View plans and demo',
      cta: getRecommendedCta(brief.type),
    },
  ];

  return concepts.map((c, i) => {
    const errs = validateCopyRules({ primaryText: c.pt, headline: c.hl, description: c.desc }, brief);
    return {
      id: `synth_${Date.now()}_${i}`,
      conceptName: c.name,
      primaryText: c.pt,
      primaryTextLength: c.pt.length,
      primaryTextValid: c.pt.length <= 125,
      headline: c.hl,
      headlineLength: c.hl.length,
      headlineValid: c.hl.length <= 40,
      description: c.desc,
      descriptionLength: c.desc.length,
      descriptionValid: c.desc.length <= 27,
      cta: c.cta,
      groundedFacts: [claim1, claim2],
      validationErrors: errs,
    };
  });
}
