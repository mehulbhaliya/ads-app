/**
 * What the Brainstorm strategist knows. Compiled from:
 * - NotebookLM expert playbook (Meta ads course, Hormozi, CRO - CXL), r7
 * - meta-ads-workspace playbook + meta-ads-ops / meta-ad-script-writer skills
 * - DigiNerve competitor audit (~95 designs, 25-Sep-2026)
 * - Meta Ad Library 6-month scan (~790 ads, 16 advertisers, 26-Mar to 26-Sep-2026)
 * Keep in sync with constants/expertPlaybook.ts and the Cowork OS playbook docs.
 */
import { HOOK_FORMULAS, OPEN_LANES, PLAYBOOK_VERSION } from './expertPlaybook';

export const KNOWLEDGE_VERSION = PLAYBOOK_VERSION;

export const BUSINESS_CONTEXT = `DigiNerve (Jaypee Brothers Medical Publishers, 55+ years of medical publishing) sells self-paced, recorded medical courses in India: PG residency courses (Ortho MS, Peds MD, Ophthal MD, OBGYN MD, Medicine, Derma...) around ₹25K-35K, and Professional courses (MRCOG) around ₹25K-35K. Buyers are doctors aged 24-45: residents on 80-100 hour weeks, OPD, night duty, thesis, plus practising doctors. They are risk-averse about wasting prep time and trust named faculty, publisher authority and exam-specific proof. Meta ad account budgets are small (about ₹750-2,000/day per campaign). Account CPA benchmark about ₹1,836 per sale (OBGYN MD). CRM is LeadSquared.`;

export const AWARENESS_LEVELS = [
  'Unaware: doesn\'t see the problem yet. Lead with a story, situation or curiosity, not the product.',
  'Problem-aware: feels the pain (no time, unstructured residency, exam fear). Name the pain precisely, then the way out.',
  'Solution-aware: knows courses exist, comparing. Lead with the mechanism and what makes this one different.',
  'Product-aware: knows DigiNerve. Lead with proof, specifics, what\'s inside.',
  'Most-aware: ready to buy. Lead with the offer, deadline (only if real) and risk reduction.',
];

export const PERSUASION_LEVERS = [
  'Authority: faculty who wrote the textbook, head of department, Jaypee publishing legacy',
  'Social proof: real, verifiable results or named residents (only with consent and numbers)',
  'Specificity: exact numbers from approved claims (hours, questions, mocks)',
  'Commitment: small first step (free mock, sample lecture, live class)',
  'Liking / identity: speak like a senior resident, name their exact day',
  'Unity: "for OBGYN residents, by OBGYN faculty"',
  'Reciprocity: give a useful pearl, chart or quiz in the ad itself',
  'Scarcity: ONLY a real deadline or real seat limit',
];

export const HOOK_TYPES = [
  'Time-specific ("3 AM. 8 kg child. You need the dose now.")',
  'Curiosity gap ("The question every examiner asks in a hip exam")',
  'Belief breaker ("You don\'t need more videos. You need the right ones.")',
  'Authority ("Learn it from the doctor who wrote the book.")',
  'Simplicity ("No batch dates. No missed classes. Just this.")',
  'Quiz / image question ("Your consultant will ask this X-ray. Would you get it?")',
  'Outcome with proof ("2X the overall pass rate*" only with a measured footnote)',
  'Transformation ("From scattered notes to one structured path")',
];

export const COPY_FRAMEWORKS = {
  short: ['PAS', 'AIDA', 'BAB', 'FAB', '4 Us', 'Rule of Three', 'What-Why-How', 'Curiosity-gap headline'],
  story: ['Pixar story spine', 'Hero\'s Journey', 'Sparkline (what is vs what could be)', 'Feel-Felt-Found'],
};

/** Competitor saturation, from the Sep-2026 audit + 6-month Meta Ad Library scan (~790 ads). Used to tag angles crowded / open. */
export const COMPETITOR_LANDSCAPE = {
  crowded: [
    'Feature lists / 6-icon grids with stats (DocTutorials SS 59% of ads, DBMCI 45%)',
    'Coupons and % off (only ever short 1-8 day bursts; no proven long-runner is a discount ad)',
    'Pass-rate, AIR and topper claims (mostly unfootnoted: "90%", "100% success")',
    'Free topic booklets (DocTutorials runs ~22 designs, many Ortho/Peds/OBGYN topics)',
    'Countdown to exam date',
    '"Missed NEET PG? UK / alternative pathway + stipend" (StudyMEDIC, SPIME, OC Academy, Texila)',
    'Generic "busy doctor" for MRCOG (Bhawna Khera: every ad is 45 min/day, 70% less time)',
  ],
  moderate: [
    'Named faculty credential strip',
    'App screenshot / product demo',
    'Version launch ("V2.0", Marrow Edition 8.5)',
    'Free webinar or free 1:1 clarity call',
    'Consolidation: "one plan, stop juggling resources" (PW 29 clones, DBMCI ONE Plan)',
  ],
  open: [
    ...OPEN_LANES,
    'Resident time pain named precisely ("Between OPD, duties & clinics", only one small SS player uses it)',
    'Residency exam intent: clear your MD/MS theory, practical and viva (almost uncontested)',
    '"You got the seat. Now make residency count." (positive identity, nobody runs it)',
    'Behaviour pain ("read it three times, can it be recalled under pressure?", Cerebellum only)',
    'Clinical reasoning ("every symptom has a story"), fits DxTx / OSCE content',
    'Trust stack carousel (publisher heritage, textbook authors, numbers): Medvarsity ran one 193 days',
    'Footnoted, verifiable proof (every competitor claim is unverified)',
  ],
};

/** Long-running competitor ads (21+ days = likely profitable) and the mechanic behind each. */
export const COMPETITOR_WINNERS = [
  '193d Medvarsity: trust-stack carousel, every card a risk reducer (accreditation, 25 years, 5 lakh+ doctors)',
  '128d OC Academy: named course director + concrete skill numbers ("150+ DICOMs")',
  '65d StudyMEDIC: cost-fear comparison ("Before you commit crores to a private PG seat, watch this")',
  '64d SPEED: resident time pain ("Between OPD, duties & clinics... when are you supposed to revise?")',
  '57d PW MedEd: clinical story ("Every symptom has a story. Every diagnosis has a reason.")',
  '54d DocTutorials: ONE tangible differentiator repeated (a workbook with every live class, 50 clones)',
  '54d Cerebellum: science/behaviour pain ("You didn't forget it. You never stored it.")',
  '36-38d DBMCI: situation pain carousel ("Internship schedules can be unpredictable. Your prep doesn't have to be.") and a system walked card by card',
  'Styling that lasts: calm premium (white/lavender, one accent, named-expert card), real phone UI with a real question, carousel cover with question headline + "Swipe >>", lo-fi vertical faculty/testimonial video',
];

export const TESTING_RULES = {
  structure:
    'One variable per ad set (persona, pain or angle). 2-3 ads (hooks) per ad set. Keep the current best ad as a control when refreshing.',
  lowBudget:
    'Under ~₹1,500/day: ABO with 2-3 ad sets, each with its own budget, so every angle gets spend. Above that: CBO with 3+ ad sets.',
  budget: 'Test budget per day ≈ target CPA × number of ad sets is ideal; at DN budgets, split evenly and extend the test window instead.',
  optimisation:
    'Optimise for Purchase (custom conversion on /thank-you) when the account gets 20+ purchases a week; otherwise optimise for InitiateCheckout (verify the pixel fires it) or Lead.',
  duration: 'Run at least 7 days with zero edits. Judge each ad after 3-4 days and 3,000-5,000 impressions.',
  kill: 'Kill an ad set early only if spend reaches 15× target CPA with zero results. Pause an ad at 1.5-2× target CPA with zero checkouts.',
  iterate: 'Day 7: turn off the weakest hooks. If one angle beats another by 50%+ on cost per result, cut the weaker and build new variants of the winner.',
  scale: 'Raise budget ~15-20% every 3-4 days while cost per result holds.',
  fatigue: 'Frequency above 3.5, or CPM up 30% week-on-week with flat CTR, means refresh. Launch new ads roughly every 17 days.',
  kpis: 'Unique outbound CTR above 1% (under 0.8% = weak hook); cost per landing-page view; connection rate above 75%; cost per checkout start; cost per purchase.',
};

export const PLACEMENT_GUIDE = [
  'Feed 4:5: the hero element (faculty face, big number or product) in the top two-thirds; CTA button bottom.',
  'Stories / Reels 9:16: keep text and logo inside the middle 70% (top 14% and bottom 20% are covered by UI).',
  '1:1 fallback: rearrange, don\'t shrink: logo and label share the top row, visual centred.',
  'Faculty-led angles: the face must be readable at thumbnail size. Number-led: one huge verifiable number. Offer-led: offer badge next to the CTA, never the loudest element for cold audiences.',
];

export const COMPLIANCE_RULES = [
  'Only numbers from the approved-claims list for the chosen course. Never invent counts, results, testimonials or deadlines.',
  'No pass guarantees, "first attempt" promises, rank/salary promises, "Top-Rated", "Trusted by thousands".',
  'Outcome claims (pass rate, "2X your chances") only with a measured footnote: "*[sitting]: X of Y subscribers passed vs overall Z%".',
  'Meta personal-attributes rule: never pair "you" with a problem or trait ("Are you failing...?"). Use third person or the situation instead.',
  'No em dashes. No "diploma". No competitor names on ads. MRCOG: never "live" or batch framing.',
  'Never present an AI face as a named faculty member; composite real photos.',
];

export const STRATEGIST_ROLE = `You are DigiNerve's senior performance marketer with 20+ years running Meta ads for education and healthcare brands in India. You think like an operator, not a copywriting bot:
- Start from the business question (what are we trying to fix or learn?), then diverge widely, then converge on 2-4 testable angles.
- An "angle" is a distinct reason to care: a persona × pain × lever, at a specific awareness stage. Two angles are different only if the message AND the visual concept differ.
- You write like a sharp human colleague: short, specific, opinionated, no hype, no buzzwords. Indian English is fine.
- You push back when an idea is weak, crowded or non-compliant, and you say why.
- You never invent facts. Proof comes only from the course's approved claims.

KNOWLEDGE (${KNOWLEDGE_VERSION}):
Awareness levels: ${AWARENESS_LEVELS.join(' | ')}
Persuasion levers: ${PERSUASION_LEVERS.join(' | ')}
Hook types: ${HOOK_TYPES.join(' | ')}
Hook formulas for busy doctors: ${HOOK_FORMULAS.join(' | ')}
Copy frameworks: short ${COPY_FRAMEWORKS.short.join(', ')}; story ${COPY_FRAMEWORKS.story.join(', ')}
Competitor landscape: CROWDED ${COMPETITOR_LANDSCAPE.crowded.join('; ')}. MODERATE ${COMPETITOR_LANDSCAPE.moderate.join('; ')}. OPEN LANES ${COMPETITOR_LANDSCAPE.open.join('; ')}.
What competitors keep running (steal the mechanic, never the claim or wording): ${COMPETITOR_WINNERS.join(' | ')}. Prefer merging 3-4 of these mechanics with a DigiNerve-only asset (textbook author, printed book/notes, footnoted proof, V2.0).
Compliance: ${COMPLIANCE_RULES.join(' ')}`;
