import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '../utils/apiKey';
import {
  Angle,
  AngleIdea,
  AwarenessStage,
  ChatMsg,
  CourseFacts,
  PlacementFocus,
  StudioProject,
  TestPlan,
  PlanAdSet,
} from '../types';
import { BUSINESS_CONTEXT, STRATEGIST_ROLE, TESTING_RULES, PLACEMENT_GUIDE } from '../constants/strategistKnowledge';
import { ANGLE_TEST_ORDER } from '../constants/expertPlaybook';
import { confirmedFaculty } from './adContent';

const TEXT_MODELS = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Facts the strategist may use for one course. */
export function courseBrief(course: CourseFacts): string {
  const claims = course.approvedClaims.filter((c) => !c.conflict).map((c) => `- ${c.claim}${c.scope ? ` [${c.scope} only]` : ''}`);
  const faculty = confirmedFaculty(course).map((f) => `${f.name}${f.role ? ` (${f.role})` : ''}`);
  const editor = course.chiefEditor && course.chiefEditor.spellingConfidence === 'confirmed' ? `${course.chiefEditor.name}${course.chiefEditor.role ? `, ${course.chiefEditor.role}` : ''}` : '';
  return `COURSE: ${course.courseName} (${course.courseCode}, segment ${course.segment})
Chief editor / lead faculty: ${editor || faculty[0] || 'not confirmed, do not name faculty'}
Other confirmed faculty: ${faculty.join('; ') || 'none'}
Curriculum highlights: ${course.curriculumHighlights.join('; ') || 'none listed'}
APPROVED CLAIMS (the only numbers and facts you may use as proof):
${claims.join('\n') || '- none: use no numbers'}
Course cautions: ${course.cautions.join(' | ') || 'none'}`;
}

function projectContext(project: StudioProject): string {
  const angles = project.angles.length
    ? project.angles.map((a) => `- ${a.name}${a.starred ? ' (STARRED)' : ''}: ${a.insight}`).join('\n')
    : '- none yet';
  return `PROJECT: ${project.name}. Goal: ${project.goal === 'SALES' ? 'course sales on the product page' : 'leads'}. Budget about ₹${project.dailyBudget}/day. Target CPA about ₹${project.targetCpa}.
ANGLES SO FAR:
${angles}`;
}

async function callText(ai: GoogleGenAI, contents: any, config: any) {
  let lastErr: any = null;
  for (const model of TEXT_MODELS) {
    try {
      return await ai.models.generateContent({ model, contents, config });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Live competitor / market research with Google Search grounding. */
async function research(ai: GoogleGenAI, course: CourseFacts, question: string): Promise<{ notes: string; sources: { title: string; url: string }[] }> {
  const prompt = `Research for a Meta ads brainstorm. Course: ${course.courseName} (India, doctors). Question from the marketer: "${question}".
Find what competitors (Marrow, PrepLadder, DocTutorials, DBMCI/eGurukul, Cerebellum, StudyMEDIC, Bhawna Khera MRCOG, BMJ OnExam and others relevant to this specialty) are currently advertising or promoting for this course or exam: angles, hooks, offers, formats, proof they use, and any resident pain points discussed publicly. Be concrete and brief. Note dates where you can.`;
  const res = await callText(ai, prompt, { tools: [{ googleSearch: {} }] });
  const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = chunks
    .map((c: any) => ({ title: c.web?.title || c.web?.uri || 'source', url: c.web?.uri || '' }))
    .filter((s: any) => s.url)
    .slice(0, 8);
  return { notes: res.text || '', sources };
}

/** House rule: no em or en dashes in ad copy. */
const noDash = (t: string) => t.replace(/\s*[—–]\s*/g, ', ');

const AWARENESS: AwarenessStage[] = ['unaware', 'problem-aware', 'solution-aware', 'product-aware', 'most-aware'];
const FOCUS: PlacementFocus[] = ['faculty', 'number', 'product', 'offer', 'clinical-image', 'situation'];
const TEMPLATE_ANGLES = Object.values(Angle) as string[];

/** Keeps only proof lines that match an approved claim; flags the rest. */
function checkProof(proof: string[], course: CourseFacts): { proof: string[]; dropped: string[] } {
  const approved = course.approvedClaims.filter((c) => !c.conflict).map((c) => c.claim.toLowerCase());
  const kept: string[] = [];
  const dropped: string[] = [];
  for (const p of proof || []) {
    const lp = p.toLowerCase();
    const nums = lp.match(/\d[\d,]*\+?/g) || [];
    const ok = approved.some((a) => a.includes(lp) || lp.includes(a) || (nums.length > 0 && nums.every((n) => a.includes(n))));
    (ok ? kept : dropped).push(p);
  }
  return { proof: kept, dropped };
}

function normaliseAngle(raw: any, course: CourseFacts, source: AngleIdea['source']): AngleIdea {
  const { proof, dropped } = checkProof(Array.isArray(raw.proof) ? raw.proof : [], course);
  const risks: string[] = Array.isArray(raw.risks) ? raw.risks.filter(Boolean) : [];
  if (dropped.length) risks.push(`Removed unverified proof: ${dropped.join('; ')}`);
  return {
    id: uid(),
    name: noDash(String(raw.name || 'Untitled angle')).slice(0, 80),
    insight: String(raw.insight || ''),
    persona: String(raw.persona || ''),
    awareness: AWARENESS.includes(raw.awareness) ? raw.awareness : 'problem-aware',
    lever: String(raw.lever || ''),
    framework: String(raw.framework || 'PAS'),
    hooks: (Array.isArray(raw.hooks) ? raw.hooks : []).map((h: any) => noDash(String(h))).filter(Boolean).slice(0, 3),
    proof,
    visualIdea: String(raw.visualIdea || ''),
    placementFocus: FOCUS.includes(raw.placementFocus) ? raw.placementFocus : 'faculty',
    saturation: ['open', 'moderate', 'crowded'].includes(raw.saturation) ? raw.saturation : 'moderate',
    risks,
    templateAngle: (TEMPLATE_ANGLES.includes(raw.templateAngle) ? raw.templateAngle : 'FACULTY') as Angle,
    starred: false,
    source: raw.source === 'your-idea' || raw.source === 'reference' ? raw.source : source,
  };
}

const ANGLE_SCHEMA_HINT = `{"name":"short name","insight":"why it could work, 1-2 sentences","persona":"who exactly","awareness":"unaware|problem-aware|solution-aware|product-aware|most-aware","lever":"persuasion lever or hook type","framework":"PAS|AIDA|BAB|4 Us|Rule of Three|Pixar story spine|...","hooks":["hook 1","hook 2","hook 3"],"proof":["approved claims only, verbatim"],"visualIdea":"one concrete visual concept","placementFocus":"faculty|number|product|offer|clinical-image|situation","saturation":"open|moderate|crowded","risks":["compliance or execution risks"],"templateAngle":"FACULTY|RESULT|DEMO|PRICE|URGENCY|SOCIAL|FREE|CURRICULUM","source":"strategist|your-idea|reference"}`;

export interface StrategistResult {
  reply: string;
  newAngles: AngleIdea[];
  sources?: { title: string; url: string }[];
}

/**
 * One brainstorm turn. The strategist answers like a colleague and, when it
 * has ideas worth testing, returns them as angle cards.
 */
export async function strategistTurn(
  project: StudioProject,
  course: CourseFacts,
  userText: string,
  images: string[] = [],
  opts: { search?: boolean } = {}
): Promise<StrategistResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return offlineTurn(project, course, userText);

  const ai = new GoogleGenAI({ apiKey });
  let researchNotes = '';
  let sources: { title: string; url: string }[] | undefined;
  if (opts.search) {
    try {
      const r = await research(ai, course, userText || `What is working for ${course.courseName} ads right now?`);
      researchNotes = r.notes;
      sources = r.sources;
    } catch (e) {
      researchNotes = '(Live search was unavailable this time.)';
    }
  }

  const history = project.chat
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'MEHUL' : 'YOU'}: ${m.text}${m.images?.length ? ` [attached ${m.images.length} reference ad image(s)]` : ''}`)
    .join('\n');
  const firstTurn = project.angles.length === 0;

  const instructions = `${STRATEGIST_ROLE}

BUSINESS CONTEXT: ${BUSINESS_CONTEXT}

${courseBrief(course)}

${projectContext(project)}

${researchNotes ? `LIVE RESEARCH NOTES (from web search just now; treat as signals, verify before claiming):\n${researchNotes}\n` : ''}
CONVERSATION SO FAR:
${history || '(new conversation)'}

MEHUL NOW SAYS: "${userText}"${images.length ? `\nHe attached ${images.length} reference ad image(s): deconstruct each (angle, hook, awareness stage, proof device, layout, what to adapt for DigiNerve and what not to copy).` : ''}

HOW TO RESPOND:
- Reply like a senior colleague in 60-160 words. Be specific to this course and audience. If something he suggests is weak, crowded or non-compliant, say so and offer a better version.
- ${firstTurn ? 'This is the first turn: give 8-10 genuinely different angle ideas right away (different personas, pains, levers and awareness stages; include at least 3 from the OPEN LANES), then end your reply with 2-3 short numbered questions that would sharpen the next round (e.g. which year of residency, what the current ads look like, any real results we can use). Return 8-10 items in newAngles.' : 'Only add new angle cards when he asks for ideas, gives a new idea or reference, or when you have a clearly better angle. If he asks to change an existing angle, return the improved version as a new card with a clear name.'}
- If he gave his own idea or a reference, turn it into a proper angle card (source "your-idea" or "reference").
- Proof must be copied verbatim from APPROVED CLAIMS. Never invent numbers, testimonials or deadlines.
- Suggested default angle order for cold doctors: ${ANGLE_TEST_ORDER.join(' | ')}.

Return ONLY JSON: {"reply":"your message","newAngles":[${ANGLE_SCHEMA_HINT}]}`;

  const parts: any[] = images.map((d) => ({
    inlineData: { mimeType: d.slice(5, d.indexOf(';')) || 'image/png', data: d.split(',')[1] || '' },
  }));
  parts.push({ text: instructions });

  const res = await callText(ai, [{ role: 'user', parts }], { responseMimeType: 'application/json', temperature: 0.9 });
  let parsed: any = {};
  try {
    parsed = JSON.parse(res.text || '{}');
  } catch {
    parsed = { reply: res.text || '', newAngles: [] };
  }
  let raw: any[] = Array.isArray(parsed.newAngles) ? parsed.newAngles : [];

  // First round must be wide: top up to at least 8 genuinely different angles.
  if (firstTurn && raw.length < 8) {
    try {
      const more = await callText(
        ai,
        `${STRATEGIST_ROLE}

BUSINESS CONTEXT: ${BUSINESS_CONTEXT}

${courseBrief(course)}

We already have these angles: ${raw.map((a) => a.name).join('; ') || 'none'}.
Give ${8 - raw.length + 2} MORE angles that are clearly different from these (different persona, pain, lever or awareness stage; use the OPEN LANES and at least one unaware/story angle and one most-aware/offer angle). Proof only from APPROVED CLAIMS, verbatim.
Return ONLY JSON: {"newAngles":[${ANGLE_SCHEMA_HINT}]}`,
        { responseMimeType: 'application/json', temperature: 1 }
      );
      const extra = JSON.parse(more.text || '{}');
      if (Array.isArray(extra.newAngles)) raw = [...raw, ...extra.newAngles];
    } catch {
      /* keep what we have */
    }
  }

  return {
    reply: String(parsed.reply || 'Here are some directions.'),
    newAngles: raw.map((a: any) => normaliseAngle(a, course, 'strategist')),
    sources,
  };
}

/** Without a key: a solid starter set built from the playbook, so the app is never empty. */
function offlineTurn(project: StudioProject, course: CourseFacts, userText: string): StrategistResult {
  if (project.angles.length > 0) {
    return {
      reply: 'I need a Gemini key to think this through with you (click the key chip in the header). Meanwhile, star the starter angles that fit and move to the Test plan.',
      newAngles: [],
    };
  }
  const claims = course.approvedClaims.filter((c) => !c.conflict).map((c) => c.claim);
  const lead = confirmedFaculty(course)[0]?.name || course.chiefEditor?.name || 'the lead faculty';
  const short = course.courseName.replace(/\(.*?\)/g, '').trim();
  const starters: any[] = [
    { name: 'The author teaches', insight: `Doctors trust the person who wrote the textbook. ${lead} teaching it is proof competitors cannot copy.`, persona: 'Residents comparing courses', awareness: 'solution-aware', lever: 'Authority', framework: 'FAB', hooks: [`Learn ${short} from the doctor who wrote the book.`], proof: claims.slice(0, 2), visualIdea: 'Real faculty portrait beside the real textbook cover', placementFocus: 'faculty', saturation: 'open', templateAngle: 'FACULTY' },
    { name: 'The exact busy moment', insight: 'Naming the exact moment in a resident\'s day (post-call, between OPD patients) makes the ad feel written for them.', persona: 'Residents on heavy duty rotations', awareness: 'problem-aware', lever: 'Time-specific hook', framework: 'PAS', hooks: ['Post-call, 20 minutes, one topic. That\'s how residency prep should work.'], proof: claims.slice(0, 1), visualIdea: 'Resident in scrubs with a phone in a dim duty room', placementFocus: 'situation', saturation: 'moderate', templateAngle: 'SOCIAL' },
    { name: 'Not more, the right ones', insight: 'Content bloat is the top complaint about competitors. Selling finishable depth breaks the "more hours = better" belief.', persona: 'Residents overwhelmed by long playlists', awareness: 'solution-aware', lever: 'Belief breaker', framework: 'BAB', hooks: ['You don\'t need 500 videos. You need the ones that match your wards.'], proof: claims.slice(0, 2), visualIdea: 'Crossed-out endless playlist vs one clean module path', placementFocus: 'product', saturation: 'open', templateAngle: 'CURRICULUM' },
    { name: 'Show the product working', insight: 'Showing one mechanic (a question inside the lecture, a flowchart) is more believable than a feature list.', persona: 'Product-aware residents', awareness: 'product-aware', lever: 'Specificity', framework: 'What-Why-How', hooks: ['See how the exam question appears right where the concept is taught.'], proof: claims.slice(0, 3), visualIdea: 'Phone/tablet showing the lecture UI with one feature highlighted', placementFocus: 'product', saturation: 'moderate', templateAngle: 'DEMO' },
    { name: 'Everything in one course', insight: 'Bundling beats discounting: show everything the course includes as one package.', persona: 'Most-aware comparers', awareness: 'most-aware', lever: 'Value stack', framework: 'Rule of Three', hooks: [`Everything ${short} asks for. One course.`], proof: claims.slice(0, 3), visualIdea: 'Flat-lay of tablet, notes and question bank', placementFocus: 'product', saturation: 'moderate', templateAngle: 'CURRICULUM' },
  ];
  return {
    reply: `Gemini isn't connected, so here are 5 starter angles from the playbook for ${short}. Add a key (header chip) and I'll brainstorm properly: ask questions, read your references and research competitors.`,
    newAngles: starters.map((a) => normaliseAngle(a, course, 'strategist')),
  };
}

// ---------- Test plan ----------

const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18);

function today() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return { ddmmyy: `${dd}${mm}${yy}`, mmyy: `${mm}${yy}` };
}

/**
 * Builds the test plan from the starred angles using the playbook's rules.
 * Structure, budget and rules are computed here; the strategist only sharpens
 * the hypotheses when a key is available.
 */
export async function buildTestPlan(project: StudioProject, course: CourseFacts): Promise<TestPlan> {
  const starred = project.angles.filter((a) => a.starred);
  const { ddmmyy, mmyy } = today();
  const budget = Math.max(300, project.dailyBudget || 750);
  const abo = budget < 1500;
  const perSet = Math.round(budget / Math.max(1, starred.length));
  const cpa = project.targetCpa || 1836;
  const campaignName = `DN_${project.goal}_META_LP_${course.segment}_${course.courseCode}_IN_${mmyy}`;

  const adSets: PlanAdSet[] = starred.map((a, i) => ({
    id: a.id,
    name: `INT_${slug(a.name)}_IN_${ddmmyy}`,
    angleId: a.id,
    angleName: a.name,
    variable: `Angle: ${a.name} (${a.lever})`,
    audience: `${a.persona || 'Target doctors'}. Advantage+ audience with suggestions (job titles, specialty education, medical education interest); exclude existing buyers.`,
    dailyBudget: abo ? perSet : 0,
    ads: (a.hooks.length ? a.hooks : [a.name]).slice(0, 3).map((h, j) => ({
      name: `IMG_${a.templateAngle}_NOOFFER_V${j + 1}_${ddmmyy}`,
      hook: h,
      format: j === 0 ? 'Static 4:5 / 9:16 / 1:1' : 'Static (hook variant)',
    })),
  }));

  let hypotheses = starred.map((a) => ({
    angleName: a.name,
    hypothesis: `If we lead with "${a.name}" (${a.lever}) for ${a.persona || 'this audience'}, cost per ${project.goal === 'SALES' ? 'checkout start' : 'lead'} will beat the current ads because ${a.insight.charAt(0).toLowerCase()}${a.insight.slice(1)}`,
  }));

  const apiKey = getGeminiApiKey();
  if (apiKey && starred.length) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await callText(
        ai,
        `${STRATEGIST_ROLE}\n\n${courseBrief(course)}\n\nWrite one crisp test hypothesis per angle in the form "If we ..., then ... will ..., because ...", measurable on Meta (${project.goal === 'SALES' ? 'cost per checkout start / purchase' : 'cost per lead'}). Angles:\n${starred.map((a) => `- ${a.name}: ${a.insight} (persona: ${a.persona}; lever: ${a.lever})`).join('\n')}\nReturn ONLY JSON: {"hypotheses":[{"angleName":"...","hypothesis":"..."}]}`,
        { responseMimeType: 'application/json', temperature: 0.4 }
      );
      const parsed = JSON.parse(res.text || '{}');
      if (Array.isArray(parsed.hypotheses) && parsed.hypotheses.length) hypotheses = parsed.hypotheses;
    } catch {
      /* keep the rule-based hypotheses */
    }
  }

  const missing: string[] = [];
  if (!project.targetCpa) missing.push('Target CPA for this course (using the ₹1,836 account benchmark for now).');
  // Budget sanity, the way a senior buyer would flag it.
  const perAd = perSet / Math.max(1, Math.min(3, ...adSets.map((s) => s.ads.length)));
  if (starred.length > 0 && perSet < 350) {
    missing.push(
      `Budget is thin: ₹${perSet}/day per ad set (about ₹${Math.round(perAd)} per ad). Either test ${Math.max(2, Math.floor(budget / 375))} angles, cut to 2 hooks per ad set, or raise to ₹${starred.length * 375}/day so each angle can reach 3,000-5,000 impressions per ad within the test window.`
    );
  }
  if (budget * 7 < 15 * cpa) {
    missing.push(
      `At ₹${budget}/day the 15× CPA kill threshold (₹${(15 * cpa).toLocaleString('en-IN')}) is never reached in 7 days. Use the day-7 read instead: after 7 days (about ₹${(perSet * 7).toLocaleString('en-IN')} per ad set), pause any ad set with zero ${project.goal === 'SALES' ? 'checkout starts' : 'leads'} and unique outbound CTR under 0.8%.`
    );
  }
  missing.push('Confirm the pixel fires the optimisation event on this product page before launch.');
  missing.push('Upload the buyers list as an exclusion audience.');

  return {
    createdAt: new Date().toISOString(),
    basedOn: starred.map((a) => a.id),
    objective: project.goal === 'SALES' ? 'Sales (website)' : 'Leads (website form / landing page)',
    optimisationEvent:
      project.goal === 'SALES'
        ? 'Purchase (custom conversion: /thank-you). Switch to InitiateCheckout if the account gets under 20 purchases a week.'
        : 'Lead (landing-page form submit)',
    campaignName,
    budgetType: abo ? 'ABO' : 'CBO',
    dailyBudget: budget,
    bidStrategy: 'Highest volume (no cap) while learning; add a cost-per-result goal only after 50 results.',
    placements: 'Advantage+ placements, with placement asset customisation: 4:5 Feed, 9:16 Stories/Reels, 1:1 fallback. Audience Network off.',
    adSets,
    hypotheses,
    durationDays: 7,
    primaryKpi: project.goal === 'SALES' ? `Cost per checkout start, then cost per purchase (target ≈ ₹${cpa})` : `Cost per lead (target ≈ ₹${cpa})`,
    checkpoints: [
      'Day 1-3: delivery, CPM ₹200-400, unique outbound CTR above 1% (under 0.8% = weak hook).',
      'Day 3-4 and 3,000-5,000 impressions per ad: first read on each hook.',
      `Day 7: verdict per angle on ${project.goal === 'SALES' ? 'cost per checkout start / purchase' : 'cost per lead'}.`,
    ],
    rules: {
      kill: `${TESTING_RULES.kill} (15× ₹${cpa} = ₹${(15 * cpa).toLocaleString('en-IN')}).`,
      iterate: TESTING_RULES.iterate,
      scale: TESTING_RULES.scale,
      fatigue: TESTING_RULES.fatigue,
    },
    placementNotes: PLACEMENT_GUIDE,
    missingInfo: missing,
    approved: false,
  };
}

export function newChatMsg(role: ChatMsg['role'], text: string, extra: Partial<ChatMsg> = {}): ChatMsg {
  return { id: uid(), role, text, createdAt: new Date().toISOString(), ...extra };
}
