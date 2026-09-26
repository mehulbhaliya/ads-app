/**
 * Expert rules distilled from Mehul's NotebookLM notebooks (Meta ads course,
 * Alex Hormozi, CRO - CXL), a 95-design competitor audit and live Meta
 * results, filtered for DigiNerve compliance. Source of truth:
 * Cowork OS / Performance Marketing Resources / DigiNerve-Meta-Expert-Playbook.md
 * and 20260925_Creative-Angle-and-Hook-Bank_Ortho-Peds-Ophthal.md.
 * Update both together after each learning round.
 */
import type { AdContent } from '../services/adContent';

export const PLAYBOOK_VERSION = '2026-09-26 r7';

/**
 * Angle test order for cold, risk-averse doctors. r7: exam urgency is for
 * Crash courses only; Comprehensive courses never assume the buyer's sitting.
 */
export const ANGLE_TEST_ORDER = [
  'Author teaches: the faculty who wrote the Jaypee textbook now teaches it (our unique lane)',
  'Busy moment: name the exact moment (post-call, 3 AM, between OPD patients) and how the course fits it',
  'Belief breaking: "you don\'t need more videos, you need the right ones" / depth over shortcuts',
  'Show the product mechanic or ward value: PYQs inside the lecture, dosing chart, DxTx flowchart, image quiz',
  'Value stack: everything in one course (printed books, lectures, Qbank, mocks), risk reduced',
];

/** Competitor-audit whitespace DigiNerve can own (25-Sep-2026 audit of ~95 designs). */
export const OPEN_LANES = [
  'Faculty who authored the textbook (competitors only borrow other publishers\' covers)',
  'Self-paced as the fix for a duty rotation (every competitor sells live batches with dates)',
  'Useful on tonight\'s ward, not only in the exam',
  'University practical exam: long case, short case, viva',
  'Specialty-native image quiz: X-ray, fundus, slit-lamp, CTG',
  'Honest time maths: hours over the plan = minutes a day',
];

/** Reusable hook formulas for busy doctors. */
export const HOOK_FORMULAS = [
  '[Post-call / 3 AM / Between OPD patients]. [What they need]. [How the course gives it].',
  '[X] hours over your [6/12]-month plan = [Y] minutes a day.',
  'Useful on tonight\'s ward, not just in the exam: [specific tool].',
  'Learn [specialty] from the doctor who wrote [book].',
  '[Real clinical image]. Your consultant will ask you this. Would you get it?',
  'You don\'t need [more videos]. You need [the specific thing].',
  'No batch dates. No missed live classes. Recorded, self-paced, yours on any rotation.',
];

/** Injected into the copy prompt. */
export const EXPERT_COPY_RULES = `EXPERT PLAYBOOK (${PLAYBOOK_VERSION}), apply to every concept:
- Say the OUTCOME or the PAIN for the named AVATAR first ("MRCOG Part 1 candidates:", "Busy OBGYN residents:"), then the system and proof, then the offer. Never lead with a discount, coupon or bonus.
- Situation hooks: name the exact exam and a specific moment in the doctor's day (post-call, night duty, between OPD patients, 3 AM on the ward). The creative is the targeting.
- Hook formulas that work for busy doctors: ${HOOK_FORMULAS.map((h) => `"${h}"`).join(' | ')}.
- Own these lanes competitors leave open: ${OPEN_LANES.join('; ')}.
- Primary text may run long for this high-ticket, risk-averse audience, but the hook must land in the first 125 characters (visible before "See more"). Structure: hook, problem, solution, proof/authority (faculty + verified numbers), self-paced fit for their rotation, CTA.
- Headline: the core benefit in under 40 characters. Clear beats clever.
- Description: risk reduction or what is included.
- Name faculty by their verified credential (author of X, Head of Y), never "Top-Rated" or "Trusted by thousands".
- Comprehensive / long-plan courses: never assume the exam sitting or use countdowns. Countdowns belong to Crash courses only.
- The 5 concepts must use these 5 different angles, in this order: ${ANGLE_TEST_ORDER.map((a, i) => `(${i + 1}) ${a}`).join('; ')}.
- Outcome claims (pass rate, "2X your chances") only with a measured footnote: "*[sitting]: X of Y subscribers passed vs overall Z%". Never: pass guarantees, "first attempt" promises, ratings, student counts, salary promises, bonuses, rupee "values" or free trials unless they appear in the approved claims.`;

/** Injected into the image prompt as its own level. */
export const EXPERT_VISUAL_RULES = `**LEVEL 3B (EXPERT CREATIVE PLAYBOOK ${PLAYBOOK_VERSION}):**
- ONE idea per ad: one hero element (a single big verifiable number, a faculty portrait, a product-in-use scene or a clinical image), not a grid of six stats.
- Real human presence wins: a clinician-educator or a resident doctor in clinical attire, direct and credible, never a generic stock look. Named faculty must be their real, approved photo composited in, never generated.
- Specialty-native visuals: X-ray view box (ortho), slit lamp / fundus (ophthal), paediatric ward and dosing chart (peds), labour ward / exam paper (OBGYN, MRCOG). Never generate radiographs or clinical images meant as teaching content.
- Show the product in use (a lecture on a tablet, flashcards on a phone, printed books, mock paper) instead of listing features.
- Leave one calm, uncluttered zone for a short headline: the finished ad keeps on-image text under about 20% of the area; max 3 proof points on the image.
- Theme by product so audiences can tell them apart: Crash / urgency ads use the dark navy theme with a white logo; Comprehensive / depth ads use the light theme (white to ice blue, navy text, gold highlight) with the original blue and yellow logo.
- Each variant must be a genuinely different visual concept (different subject, setting or moment), not a colour or crop tweak, so Meta treats them as distinct ads.
- Palette stays navy / white / slate with one warm yellow-amber accent. No coupon badge on cold-audience creatives.`;

/**
 * Non-blocking advice from the playbook. Unlike validateContent, these never
 * stop an export; they flag what the experts would change.
 */
export function expertAdvice(content: AdContent): string[] {
  const advice: string[] = [];
  const onImage = [
    content.hook,
    content.hookAccent,
    content.courseTitle,
    content.courseSubtitle,
    content.tagline,
    content.offer,
    content.dateLine,
    content.cta,
    content.badge,
    content.facultyName,
    content.facultyCredentials,
    content.facultyRole,
    ...content.proofs,
    content.priceNow,
    content.priceWas,
  ].filter(Boolean).join(' ');
  const words = onImage.split(/\s+/).filter(Boolean).length;
  if (words > 40) {
    advice.push(
      `About ${words} words on the image. Experts keep on-image text under ~20% of the area: move proof lines into the primary text and keep hook, face, one badge and the CTA.`
    );
  }
  if (content.priceNow || content.priceWas) {
    advice.push('Price is on the creative. Lead with the outcome and keep the price for the landing page (house rule and Hormozi: discount-first attracts bargain hunters).');
  }
  if (content.offer && !content.hook.trim()) {
    advice.push('The offer has no outcome hook above it. Say the result for the avatar first, then the offer.');
  }
  if (/coupon|% off|\boff\b.*code/i.test(onImage)) {
    advice.push('Coupon on the image. The fatigued July ads led with 10% + 10% coupons: keep coupons for retargeting or the primary text, and lead cold ads with one idea.');
  }
  if (/top[- ]rated|trusted by thousands|best (course|faculty)|no\.?\s?1\b/i.test(onImage)) {
    advice.push('Vague superlative ("Top-Rated", "Trusted by thousands"). Replace it with the faculty\'s verified credential, e.g. "author of Musculoskeletal Examination".');
  }
  if (content.proofs.length > 3) {
    advice.push('More than 3 proof points. One idea per ad: keep one hero number and at most 3 proofs on the image.');
  }
  if (content.proofs.length === 3 && words > 30) {
    advice.push('Three proof chips plus copy is dense for a static. Test a text-light version (hook + faculty + one badge) against this one.');
  }
  return advice;
}
