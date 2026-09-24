import { Angle, CampaignBrief, CourseFacts, Offer, Segment } from '../types';

/**
 * Everything a template prints on the ad. Built deterministically from the
 * course fact library, then editable in the Content panel. Numbers only ever
 * come from `approvedClaims`; names only from `confirmed` faculty.
 */
export type TemplateId = 'faculty-hero' | 'product-light' | 'hook-fullbleed' | 'offer-stack';

export interface AdContent {
  template: TemplateId;
  hook: string; // first hook line(s), rendered in white/navy
  hookAccent: string; // second part, rendered in gold
  courseTitle: string; // e.g. "OBGYN MD"
  courseSubtitle: string; // e.g. "Residency + Super Speciality"
  facultyName: string; // "" hides every faculty element
  facultyCredentials: string;
  facultyRole: string;
  tagline: string;
  proofs: string[]; // up to 3, each must be an approved claim
  offer: string; // badge text, "" hides it
  priceNow: string;
  priceWas: string;
  dateLine: string;
  cta: string;
  badge: string; // audience strip, e.g. "For Residency & NEET SS"
}

export const TEMPLATE_META: Record<TemplateId, { name: string; description: string; bestFor: Angle[] }> = {
  'faculty-hero': {
    name: 'Faculty Hero',
    description: 'Navy, hook headline, course card, faculty photo with credential card, proof row, full-width CTA bar.',
    bestFor: [Angle.Faculty, Angle.Urgency],
  },
  'product-light': {
    name: 'Product Showcase',
    description: 'Light clinical look: big two-tone course title, faculty pill, CTA pill, AI study scene below.',
    bestFor: [Angle.Demo, Angle.Curriculum, Angle.Free],
  },
  'hook-fullbleed': {
    name: 'Full-bleed Hook',
    description: 'AI photo edge to edge with a navy fade, bold hook, proof chips and CTA bar. Thumb-stop first.',
    bestFor: [Angle.Result, Angle.Social],
  },
  'offer-stack': {
    name: 'Offer & Price',
    description: 'Offer badge, price with strike-through, feature checklist, CTA bar. For sale windows.',
    bestFor: [Angle.Price],
  },
};

export function defaultTemplateForAngle(angle: Angle): TemplateId {
  const hit = (Object.keys(TEMPLATE_META) as TemplateId[]).find((t) => TEMPLATE_META[t].bestFor.includes(angle));
  return hit || 'faculty-hero';
}

const HOOKS: Record<Angle, [string, string]> = {
  [Angle.Faculty]: ['Learn it from', 'the specialist.'],
  [Angle.Result]: ['High-yield prep.', 'Exam-aligned.'],
  [Angle.Demo]: ['See how the', 'course works.'],
  [Angle.Price]: ['Premium prep.', 'Honest price.'],
  [Angle.Urgency]: ['Your exam is', 'closer than it feels.'],
  [Angle.Social]: ['Built by clinicians,', 'for clinicians.'],
  [Angle.Free]: ['Start free.', 'Decide later.'],
  [Angle.Curriculum]: ['Every topic.', 'In the right order.'],
};

const TAGLINES: Record<Angle, string> = {
  [Angle.Faculty]: 'Structured learning. Expert guidance.',
  [Angle.Result]: 'Built from real exam patterns.',
  [Angle.Demo]: 'Videos, QBank, notes and Dr. Wise AI in one app.',
  [Angle.Price]: 'Everything you need, one plan.',
  [Angle.Urgency]: 'Finishable revision, not an endless syllabus.',
  [Angle.Social]: 'Backed by Jaypee Brothers Medical Publishers.',
  [Angle.Free]: 'Try the course before you commit.',
  [Angle.Curriculum]: 'Finishable, not exhaustive.',
};

const CTA_BY_TYPE: Record<string, string> = {
  SALES: 'Enrol Now',
  LEADS: 'Book a Free Demo',
  CHATSHOW: 'Reserve Your Seat',
  WA: 'Chat on WhatsApp',
  APP: 'Download the App',
  RMK: 'Complete Your Enrolment',
  BRAND: 'Explore Courses',
};

const OFFER_TEXT: Record<Offer, string> = {
  FLAT40: 'FLAT 40% OFF',
  FLAT30: 'FLAT 30% OFF',
  FREETRIAL: 'FREE TRIAL',
  FEST: 'FESTIVE OFFER',
  LAUNCH: 'LAUNCH OFFER',
  NOOFFER: '',
};

const BADGE_BY_SEGMENT: Record<Segment, string> = {
  PG: 'For Residency & NEET SS',
  UG: 'For MBBS & NEET PG',
  INT: 'For Interns & NEET PG',
  FMGE: 'For FMGE Aspirants',
  PROF: 'For Practising Doctors',
  NURS: 'For Nursing Professionals',
  DENT: 'For Dental Professionals',
};

/** "OBGYN MD (Residency + Super Speciality)" -> ["OBGYN MD", "Residency + Super Speciality"] */
export function splitCourseName(name: string): [string, string] {
  const clean = name.replace(/\s+—\s+V\d.*$/i, '').trim();
  const paren = clean.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (paren) return [paren[1].trim(), paren[2].trim()];
  const dash = clean.split(/\s+[—–-]\s+/);
  if (dash.length > 1) return [dash[0].trim(), dash.slice(1).join(' ').trim()];
  return [clean, ''];
}

export interface CourseVariant {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  duration: string;
  source: string; // the approved claim it came from
}

/**
 * Course variants declared as approved claims like
 * "Cracking MRCOG - Part 1 - Crash: ₹24,999.00, 3 Months".
 */
export function courseVariants(course?: CourseFacts): CourseVariant[] {
  const out: CourseVariant[] = [];
  for (const c of course?.approvedClaims || []) {
    if (c.conflict) continue;
    const m = c.claim.match(/^(.+?):\s*(₹\s?[\d,]+)(?:\.\d+)?,\s*(.+)$/);
    if (!m) continue;
    const parts = m[1].split(/\s+[-–]\s+|\s+(?=Part\s+\d)/).map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    const brand = parts[0].replace(/^Cracking\s+/i, '');
    const part = parts.find((p) => /^Part\s+\d/i.test(p)) || '';
    const kind = parts.filter((p) => p !== parts[0] && p !== part).join(' ');
    out.push({
      id: m[1],
      title: [brand, part].filter(Boolean).join(' '),
      subtitle: kind ? `${kind} Course` : '',
      price: m[2].replace(/\s/, ''),
      duration: m[3].trim(),
      source: c.claim,
    });
  }
  return out;
}

/** Approved, conflict-free claims that make good chips (no prices, no brand-level). */
export function chipClaims(course?: CourseFacts): string[] {
  return (course?.approvedClaims || [])
    .filter((c) => !c.conflict && !/₹|rs\.?\s?\d|price/i.test(c.claim) && c.scope !== 'brand-level')
    .map((c) => c.claim);
}

/** House style for library text shown on ads: no em dashes. */
export function houseStyle(text = ''): string {
  return text.replace(/\s*—\s*/g, ', ').replace(/\s+/g, ' ').trim();
}

export function confirmedFaculty(course?: CourseFacts) {
  const list: { name: string; role?: string; credentials?: string }[] = [];
  const ce = course?.chiefEditor;
  if (ce && ce.spellingConfidence === 'confirmed' && !ce.conflict) {
    list.push({ name: ce.name, role: houseStyle(ce.designation || ce.role), credentials: houseStyle(ce.credentials) });
  }
  for (const f of course?.facultyNames || []) {
    if (f.spellingConfidence === 'confirmed' && !f.conflict && !list.some((l) => l.name === f.name)) {
      list.push({ name: f.name, role: houseStyle(f.role) });
    }
  }
  return list;
}

/** A single list price for this course, or "" when unknown or a range. */
function listPrice(course?: CourseFacts): string {
  const current = String(course?.priceCurrent ?? '');
  if (!current || /\bto\b|–|-\s*₹|across/i.test(current)) return '';
  const m = current.match(/₹\s?[\d,]+/);
  return m ? m[0].replace(/\s/, '') : '';
}

export function buildDefaultContent(brief: CampaignBrief, template?: TemplateId): AdContent {
  const course = brief.course;
  const variant = courseVariants(course)[0];
  let [title, subtitle] = splitCourseName(course?.courseName || brief.product);
  if (variant) {
    title = variant.title;
    subtitle = variant.subtitle;
  } else if (/variants?:|×/.test(subtitle)) {
    subtitle = '';
  }
  const lead = course?.chiefEditor && course.chiefEditor.spellingConfidence === 'confirmed' && !course.chiefEditor.conflict
    ? course.chiefEditor
    : undefined;
  const [hook, hookAccent] = HOOKS[brief.angle] || HOOKS[Angle.Faculty];
  const struck = course?.priceStruck ? String(course.priceStruck).match(/₹\s?[\d,]+/)?.[0] || '' : '';

  return {
    template: template || defaultTemplateForAngle(brief.angle),
    hook,
    hookAccent,
    courseTitle: houseStyle(title),
    courseSubtitle: houseStyle(subtitle),
    facultyName: lead?.name || '',
    facultyCredentials: houseStyle(lead?.credentials),
    facultyRole: houseStyle(lead?.designation || lead?.role),
    tagline: TAGLINES[brief.angle] || TAGLINES[Angle.Faculty],
    proofs: chipClaims(course).slice(0, 3),
    offer: OFFER_TEXT[brief.offer] ?? '',
    priceNow: variant ? variant.price : listPrice(course),
    priceWas: struck,
    dateLine: course?.sessionDate ? `Live: ${course.sessionDate}` : '',
    cta: CTA_BY_TYPE[brief.type] || 'Enrol Now',
    badge: BADGE_BY_SEGMENT[brief.segment] || '',
  };
}

/** Returns human-readable problems that must be fixed before export. */
export function validateContent(
  content: AdContent,
  course?: CourseFacts,
  photos: { hasFacultyPhoto?: boolean; hasAiVisual?: boolean } = {}
): string[] {
  const errors: string[] = [];
  // An AI-generated face beside a real doctor's name reads as that doctor.
  if (content.facultyName && !photos.hasFacultyPhoto && photos.hasAiVisual && content.template !== 'product-light') {
    errors.push(
      `The photo is AI-generated, but the ad names ${content.facultyName}. Upload their real photo, or set Faculty to "No faculty on this ad".`
    );
  }
  const approved = new Set((course?.approvedClaims || []).filter((c) => !c.conflict).map((c) => c.claim));
  content.proofs.forEach((p) => {
    if (p.trim() && !approved.has(p)) errors.push(`Proof "${p}" is not an approved claim for this course.`);
  });
  const allText = [
    content.hook,
    content.hookAccent,
    content.courseTitle,
    content.courseSubtitle,
    content.tagline,
    content.cta,
    content.offer,
    content.dateLine,
    content.facultyRole,
  ].join(' ');
  if (/diploma/i.test(allText)) errors.push('"Diploma" is banned: DigiNerve sells no diplomas.');
  if (/—/.test(allText)) errors.push('Em dashes are banned in ad copy. Use a comma, colon or period.');
  if (/\b(dive into|game-changing|leverage|synergi[sz]e|straightforward)\b/i.test(allText)) {
    errors.push('Contains a banned buzzword (dive into, game-changing, leverage, synergize, straightforward).');
  }
  if (/marrow|prepladder|doctutorial|cerebellum|amboss/i.test(allText)) {
    errors.push('Competitor names cannot appear on the creative.');
  }
  if (content.facultyName) {
    const ok = confirmedFaculty(course).some((f) => f.name === content.facultyName);
    if (!ok) errors.push(`Faculty "${content.facultyName}" is not confirmed in the course library. Confirm internally before use.`);
  }
  if (course?.courseCode === 'MRCOG' && /join us on|batch starts|live session|live class|live cohort/i.test(allText)) {
    errors.push('MRCOG is self-paced and recorded: no live or batch framing.');
  }
  const hookHasNumber = /\d/.test(`${content.hook} ${content.hookAccent} ${content.tagline}`);
  if (hookHasNumber) {
    const nums = `${content.hook} ${content.hookAccent} ${content.tagline}`.match(/[\d,]+\+?/g) || [];
    const claimText = [...approved].join(' ');
    nums.forEach((n) => {
      if (!claimText.includes(n.replace(/\+$/, ''))) errors.push(`Number "${n}" in the headline is not in this course's approved claims.`);
    });
  }
  return errors;
}
