import { Angle, Segment } from '../types';

export interface DNBrandTag {
  id: string;
  label: string;
  subtext: string;
  category: 'trust' | 'curriculum' | 'offer' | 'format';
  bgToken: 'navy' | 'navyDeep' | 'gold' | 'tintLight' | 'surface' | 'success';
  textColor: 'navy' | 'navyDeep' | 'gold' | 'tintLight' | 'surface' | 'success';
  iconName: string;
  recommendedRole: string;
}

export interface CreativeStyleRule {
  id: string;
  category: string;
  ruleTitle: string;
  description: string;
  diginerveStandard: string;
  competitorContrast: string;
  conversionImpact: string;
}

export interface ReferenceCreative {
  id: string;
  title: string;
  source: 'DigiNerve House Winner' | 'Competitor Audited Long-Runner';
  brand: string;
  angle: Angle;
  targetSegment: Segment;
  courseCode: string;
  runningDays: number;
  previewSvg: string; // inline SVG rendering of the composition
  visualStyling: {
    compositionType: 'Faculty Authority' | 'Clinical Artefact' | 'Real App UI' | 'Physical Notes Flatlay' | 'Problem-First Ward Scenario' | 'Score & Revision Plan';
    lighting: string;
    dominantPalette: string[];
    safeZoneCoverage: string;
    doctorTreatment: string;
  };
  keyLevers: string[];
  stylingAnalysis: {
    whatWorks: string;
    cognitiveTrigger: string;
    proofStructure: string;
    ctaStrategy: string;
  };
  diginerveAdaptationStrategy: {
    adaptationMove: string;
    recommendedClaims: string[];
    caution: string;
  };
}

export interface CompetitorProfile {
  id: string;
  name: string;
  coreAudience: string;
  creativeStylingDna: string;
  primaryAngles: Angle[];
  longestRunningMotifs: string[];
  vulnerabilities: string[];
  diginerveCounterStrategy: string;
  presetBrief: {
    angle: Angle;
    headline: string;
    subhead: string;
    proofClaim: string;
    brandTag: string;
    cta: string;
    offer: 'FLAT40' | 'FLAT30' | 'FREETRIAL' | 'NOOFFER';
  };
}

// 1. OFFICIAL DIGINERVE BRAND TAGS & ENDORSEMENT BADGES
export const OFFICIAL_BRAND_TAGS: DNBrandTag[] = [
  {
    id: 'jaypee_enterprise',
    label: 'A Jaypee Enterprise',
    subtext: '55+ Years of Medical Publishing Trust',
    category: 'trust',
    bgToken: 'navyDeep',
    textColor: 'gold',
    iconName: 'ShieldCheck',
    recommendedRole: 'Official Brand Endorsement',
  },
  {
    id: 'verified_faculty',
    label: 'Verified Faculty',
    subtext: 'Chief Editors & Authors of Standard Textbooks',
    category: 'trust',
    bgToken: 'tintLight',
    textColor: 'navy',
    iconName: 'Award',
    recommendedRole: 'Faculty Authority Proof',
  },
  {
    id: 'nmc_compliant',
    label: 'NMC / NBE Curriculum Compliant',
    subtext: 'Competency-Based Medical Education (CBME)',
    category: 'curriculum',
    bgToken: 'tintLight',
    textColor: 'navy',
    iconName: 'BookOpen',
    recommendedRole: 'Curriculum Trust',
  },
  {
    id: 'osce_ready',
    label: 'Clinical OSCE Station Ready',
    subtext: 'High-Yield Clinical Instruments & Stations',
    category: 'curriculum',
    bgToken: 'navy',
    textColor: 'surface',
    iconName: 'Activity',
    recommendedRole: 'Clinical Skills Callout',
  },
  {
    id: 'jaypee_library',
    label: 'Jaypee Clinical Library',
    subtext: 'Directly Integrated with Standard Indian Textbooks',
    category: 'curriculum',
    bgToken: 'navyDeep',
    textColor: 'tintLight',
    iconName: 'FileText',
    recommendedRole: 'Publisher Heritage',
  },
  {
    id: 'flat40_offer',
    label: 'Early Bird: FLAT 40% OFF',
    subtext: 'Apply Coupon: FLAT40 at Checkout',
    category: 'offer',
    bgToken: 'gold',
    textColor: 'navyDeep',
    iconName: 'Tag',
    recommendedRole: 'Conversion Catalyst',
  },
  {
    id: 'free_osce_booklet',
    label: 'Free OSCE Clinical Booklet',
    subtext: 'Instant PDF Download + Video Station Access',
    category: 'format',
    bgToken: 'success',
    textColor: 'surface',
    iconName: 'Download',
    recommendedRole: 'Lead Generation Magnet',
  },
];

// 2. DIGINERVE CREATIVE STYLING DNA & RULES
export const DIGINERVE_STYLING_RULES: CreativeStyleRule[] = [
  {
    id: 'rule_visual_hierarchy',
    category: 'Composition & Grid',
    ruleTitle: 'The 3-Tier Vertical Rule (Quiet Zone Architecture)',
    description: 'Every DigiNerve ad separates branding, visual evidence, and text layers to ensure zero visual noise.',
    diginerveStandard: 'Top 15% for Brand Lock (Wordmark + "A Jaypee Enterprise") & Offer Tag. Middle 47% for authentic clinical hero. Lower 38% reserved for gradient-backed copy safe zone.',
    competitorContrast: 'Competitors frequently crowd the entire canvas with edge-to-edge typography, reducing perceived medical premium value.',
    conversionImpact: '+28% higher dwell time on mobile feed; prevents headline collision with focal subjects.',
  },
  {
    id: 'rule_color_psychology',
    category: 'Color System',
    ruleTitle: 'Navy Academic Authority with Nerve Gold Sparks',
    description: 'DigiNerve uses trust-building deep navy grounds balanced with precise gold accent highlights.',
    diginerveStandard: 'DigiNerve Navy (#16345E) & Deep Midnight (#0C2038) anchor 75% of visual weight. Nerve Gold (#F0A63C) is strictly reserved for key conversion levers, logo accent, and CTA borders.',
    competitorContrast: 'DocTutorials leans into heavy cyan/teal; Cerebellum uses high-contrast neon yellow/black. DigiNerve maintains textbook-grade academic dignity.',
    conversionImpact: 'Establishes Jaypee legacy credibility instantly, critical for post-graduate clinicians and consultants.',
  },
  {
    id: 'rule_clinical_realism',
    category: 'Subject & Photography',
    ruleTitle: 'Real Clinical Demeanor, Zero Stock Smiles',
    description: 'Doctors reject generic stock models posing with crossed arms and fake smiles.',
    diginerveStandard: 'Clinicians shown mid-rounds, reviewing case imaging, examining clinical instruments, or holding authentic Jaypee textbooks. Natural Indian skin tones, authentic clinical scrubs/white coat.',
    competitorContrast: 'Generic ads use US/European stock photos of smiling actors with stethoscopes on backwards, instantly losing medical trust.',
    conversionImpact: 'Passes the "Physician Bullshit Detector" in under 1.2 seconds of feed scrolling.',
  },
  {
    id: 'rule_fact_grounding',
    category: 'Copy & Claims',
    ruleTitle: 'Strict Fact Grounding from Approved Course Specs',
    description: 'Every number must be corroborated by course records; no exaggerated topper scores.',
    diginerveStandard: 'Only verified counts (e.g. "500+ Video Lectures", "3,500+ Practice Questions", "Dr. Chaitanya Inamdar"). If price is listed, strike-through must match actual catalogue.',
    competitorContrast: 'Competitors claim "100% strike rate in exam" or unverified "All AIR 1-10 are our students", which triggers skepticism among seasoned MD residents.',
    conversionImpact: 'Builds institutional respect and protects Jaypee\'s 55-year publisher reputation.',
  },
  {
    id: 'rule_safe_zones',
    category: 'Safe Zones & Legibility',
    ruleTitle: 'Strict 4:5 Feed & 9:16 Story Chrome Avoidance',
    description: 'Ad elements must not be obscured by platform UI chrome or captions.',
    diginerveStandard: 'For 9:16 (Stories/Reels), top 14% and bottom 20% remain completely empty of critical text/CTA to prevent overlay by Instagram account handle and audio pill.',
    competitorContrast: '34% of competitor story ads suffer from CTA buttons being clipped by the "Swipe Up" or "Send Message" bar.',
    conversionImpact: 'Eliminates lost clicks due to obscured call-to-action buttons.',
  },
];

// Helper to generate clean illustrative vector previews
function generateSvgPreview(
  bgGradStart: string,
  bgGradEnd: string,
  accentColor: string,
  headline: string,
  chipText: string,
  archetype: 'faculty' | 'app' | 'book' | 'case'
): string {
  const iconMarkup =
    archetype === 'faculty'
      ? `<circle cx="200" cy="110" r="45" fill="#EAF4FB" opacity="0.85"/>
         <path d="M140 210 Q200 150 260 210 Z" fill="#EAF4FB" opacity="0.85"/>
         <path d="M190 135 L200 160 L210 135" stroke="#16345E" stroke-width="3" fill="none"/>
         <circle cx="200" cy="170" r="8" fill="#F0A63C"/>`
      : archetype === 'app'
      ? `<rect x="130" y="60" width="140" height="150" rx="12" fill="#0C2038" stroke="#F0A63C" stroke-width="2"/>
         <rect x="145" y="80" width="110" height="14" rx="4" fill="#EAF4FB" opacity="0.6"/>
         <rect x="145" y="105" width="80" height="8" rx="3" fill="#38BDF8"/>
         <circle cx="160" cy="140" r="16" fill="#1D9A66"/>
         <rect x="185" y="132" width="70" height="6" rx="3" fill="#FFFFFF"/>
         <rect x="185" y="144" width="50" height="5" rx="3" fill="#94A3B8"/>
         <rect x="145" y="175" width="110" height="20" rx="6" fill="#16345E"/>`
      : archetype === 'book'
      ? `<rect x="120" y="80" width="160" height="110" rx="6" fill="#16345E" stroke="#F0A63C" stroke-width="2"/>
         <rect x="135" y="95" width="130" height="20" rx="3" fill="#F0A63C"/>
         <text x="145" y="109" font-size="9" font-family="sans-serif" font-weight="bold" fill="#0C2038">JAYPEE CLINICAL</text>
         <rect x="135" y="125" width="100" height="6" rx="2" fill="#EAF4FB" opacity="0.7"/>
         <rect x="135" y="138" width="120" height="6" rx="2" fill="#EAF4FB" opacity="0.5"/>
         <rect x="135" y="151" width="80" height="6" rx="2" fill="#EAF4FB" opacity="0.5"/>
         <rect x="100" y="110" width="150" height="85" rx="6" fill="#0C2038" opacity="0.8" transform="rotate(-6 100 110)"/>`
      : `<rect x="110" y="65" width="180" height="135" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
         <circle cx="160" cy="120" r="28" fill="#1E293B" stroke="#F0A63C" stroke-width="1.5"/>
         <path d="M150 120 L158 128 L175 110" stroke="#1D9A66" stroke-width="3" fill="none"/>
         <rect x="205" y="95" width="70" height="8" rx="3" fill="#EAF4FB"/>
         <rect x="205" y="112" width="60" height="6" rx="3" fill="#94A3B8"/>
         <rect x="205" y="128" width="50" height="6" rx="3" fill="#F0A63C"/>
         <rect x="125" y="160" width="150" height="24" rx="6" fill="#16345E"/>`;

  return `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bgGradStart}"/>
          <stop offset="55%" stop-color="${bgGradEnd}"/>
          <stop offset="100%" stop-color="#FFFFFF"/>
        </linearGradient>
        <linearGradient id="copyFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bgGradEnd}" stop-opacity="0"/>
          <stop offset="35%" stop-color="#EAF4FB" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="1"/>
        </linearGradient>
      </defs>
      
      <!-- Background Ground -->
      <rect width="400" height="500" fill="url(#bg)"/>
      
      <!-- Top Brand Header -->
      <text x="24" y="38" font-size="20" font-family="system-ui, sans-serif" font-weight="800" fill="#FFFFFF">Digi<tspan fill="#F0A63C">Nerve</tspan></text>
      <rect x="220" y="22" width="156" height="24" rx="6" fill="#0C2038" stroke="#F0A63C" stroke-width="1"/>
      <text x="298" y="38" font-size="10" font-family="system-ui, sans-serif" font-weight="700" fill="#F0A63C" text-anchor="middle">A JAYPEE ENTERPRISE</text>
      
      <!-- Visual Midground Hero -->
      <g transform="translate(0, 10)">
        ${iconMarkup}
      </g>
      
      <!-- Quiet Copy Zone Overlay (Bottom 38%) -->
      <rect x="0" y="270" width="400" height="230" fill="url(#copyFade)"/>
      
      <!-- Proof Chip -->
      <rect x="24" y="295" width="220" height="22" rx="6" fill="#EAF4FB" stroke="#CBD5E1" stroke-width="1.2"/>
      <circle cx="36" cy="306" r="4" fill="#1D9A66"/>
      <text x="48" y="310" font-size="10" font-family="system-ui, sans-serif" font-weight="700" fill="#16345E">${chipText}</text>
      
      <!-- Bold Benefit Headline -->
      <text x="24" y="348" font-size="20" font-family="system-ui, sans-serif" font-weight="800" fill="#0C2038">${headline}</text>
      
      <!-- Subhead -->
      <text x="24" y="378" font-size="12" font-family="system-ui, sans-serif" fill="#16345E">Clinical case breakdowns, Jaypee faculty lectures &amp; OSCE.</text>
      <text x="24" y="396" font-size="12" font-family="system-ui, sans-serif" fill="#16345E">Master standard protocols with zero exam ambiguity.</text>
      
      <!-- CTA Button -->
      <rect x="24" y="425" width="170" height="42" rx="8" fill="#16345E"/>
      <text x="109" y="451" font-size="13" font-family="system-ui, sans-serif" font-weight="700" fill="#FFFFFF" text-anchor="middle">EXPLORE CURRICULUM</text>
      
      <!-- Offer Tag (Bottom Right) -->
      <rect x="270" y="428" width="105" height="36" rx="8" fill="#F0A63C"/>
      <text x="322" y="445" font-size="10" font-family="system-ui, sans-serif" font-weight="800" fill="#0C2038" text-anchor="middle">FLAT 40% OFF</text>
      <text x="322" y="457" font-size="8" font-family="system-ui, sans-serif" font-weight="700" fill="#0C2038" text-anchor="middle">CODE: FLAT40</text>
    </svg>
  `);
}

// 3. CURATED REFERENCE CREATIVES & STYLING ARTIFACTS
export const REFERENCE_CREATIVES: ReferenceCreative[] = [
  {
    id: 'ref_dn_faculty_textbook',
    title: 'DigiNerve Standard: Chief Faculty Authority with Jaypee Textbook',
    source: 'DigiNerve House Winner',
    brand: 'DigiNerve (Jaypee)',
    angle: Angle.Faculty,
    targetSegment: 'PG',
    courseCode: 'OBGMD',
    runningDays: 68,
    previewSvg: generateSvgPreview(
      '#0C2038',
      '#16345E',
      '#F0A63C',
      'Learn OBGYN From The Master Author',
      'Chief Editor: Dr. Chaitanya Inamdar',
      'faculty'
    ),
    visualStyling: {
      compositionType: 'Faculty Authority',
      lighting: 'Warm key light with shallow hospital library background',
      dominantPalette: ['#16345E', '#0C2038', '#F0A63C', '#EAF4FB'],
      safeZoneCoverage: 'Lower 38% reserved for gradient copy backing',
      doctorTreatment: 'Authentic clinical doctor in white coat holding textbook; natural posture, no stock smile',
    },
    keyLevers: [
      'Chief author portrait builds immediate peer-to-peer physician trust',
      'Jaypee textbook endorsement visible as physical proof',
      'Clear verified claim: "285+ Video Lectures & Live Chat Shows"',
      'No stock imagery: direct eye-line authority',
    ],
    stylingAnalysis: {
      whatWorks: 'Indian MD/MS residents buy textbooks authored by senior professors; seeing the exact author teach the video course eliminates hesitation.',
      cognitiveTrigger: 'Authority Bias + Academic Precedent (Jaypee brand trust)',
      proofStructure: 'Named Faculty Credential -> Standard Textbook Title -> Video Course Curriculum',
      ctaStrategy: 'Soft commitment: "Explore Curriculum" instead of aggressive "Buy Now"',
    },
    diginerveAdaptationStrategy: {
      adaptationMove: 'Always pair the faculty photo with their authored Jaypee textbook title and institutional background (AIIMS/KEM/PGI).',
      recommendedClaims: ['Author of Standard Obstetrics Manual', 'Over 25+ Years Teaching PG Residents'],
      caution: 'Never use generic AI faces; likeness must be strictly verified against official faculty headshots.',
    },
  },
  {
    id: 'ref_doctutorials_narrow_osce',
    title: 'DocTutorials Competitor Analysis: Narrow Clinical Topic Booklet',
    source: 'Competitor Audited Long-Runner',
    brand: 'DocTutorials Residency',
    angle: Angle.Curriculum,
    targetSegment: 'PG',
    courseCode: 'OBGMD',
    runningDays: 62,
    previewSvg: generateSvgPreview(
      '#0B192C',
      '#1E3E62',
      '#38BDF8',
      'Emergency Contraception & OSCE Protocol',
      'Free Clinical Resident Booklet',
      'case'
    ),
    visualStyling: {
      compositionType: 'Clinical Artefact',
      lighting: 'Cool blue clinical spotlight on diagnostic case report',
      dominantPalette: ['#0B192C', '#1E3E62', '#38BDF8', '#FFFFFF'],
      safeZoneCoverage: 'Lower 35% copy band, quiet dark slate ground',
      doctorTreatment: 'No doctor visible; clinical diagnostic instrument and specimen report are the hero',
    },
    keyLevers: [
      'Focuses on ONE narrow, high-friction clinical topic instead of selling the entire course',
      'High perceived value: "Download Free Booklet"',
      'Zero commercial fluff in the headline: reads like a hospital ward guide',
      'Ultra-long ad lifespan (62 consecutive days active on Meta)',
    ],
    stylingAnalysis: {
      whatWorks: 'Residents scrolling Instagram during ward duties ignore generic sales pitches, but stop immediately for a specific clinical case station (e.g. Cardiotocography or OSCE Breech).',
      cognitiveTrigger: 'Specificity heuristic + Loss aversion (avoiding ward embarrassment)',
      proofStructure: 'Narrow Clinical Dilemma -> Verified Management Flowchart -> Full Course Depth',
      ctaStrategy: 'Low-friction Lead Gen: "Download Clinical Guide"',
    },
    diginerveAdaptationStrategy: {
      adaptationMove: 'DigiNerve can dominate this angle because Jaypee owns the definitive clinical textbooks! Create "OSCE Station Guides" directly branded from Jaypee clinical authors.',
      recommendedClaims: ['Extracted from Jaypee Clinical Residency Library', 'Includes 15 High-Yield OSCE Flowcharts'],
      caution: 'Do not port DocTutorials teal branding; use DigiNerve Navy and Amber Gold.',
    },
  },
  {
    id: 'ref_dbmci_app_screen',
    title: 'DBMCI One Competitor Analysis: Real Product Interface & Streak',
    source: 'Competitor Audited Long-Runner',
    brand: 'DBMCI One',
    angle: Angle.Demo,
    targetSegment: 'PG',
    courseCode: 'SURGMS',
    runningDays: 45,
    previewSvg: generateSvgPreview(
      '#111827',
      '#1E293B',
      '#10B981',
      'Daily 20-MCQ Habit for Post-Duty Hours',
      'Real In-App QBank Interface',
      'app'
    ),
    visualStyling: {
      compositionType: 'Real App UI',
      lighting: 'High-contrast mobile mockup with vibrant status pill and solved question',
      dominantPalette: ['#111827', '#1E293B', '#10B981', '#FFFFFF'],
      safeZoneCoverage: 'Bottom 40% clean split with action headline',
      doctorTreatment: 'Device held in hands wearing surgical scrubs; focal blur on ward background',
    },
    keyLevers: [
      'Showcases the ACTUAL app interface, proving the product is modern and fast',
      'Solves the #1 resident objection: "I have no time to study during residency"',
      'Demonstrates interactive bookmarking, explanations, and daily streaks',
      'Runs consistently in retargeting and cold consideration',
    ],
    stylingAnalysis: {
      whatWorks: 'Seeing the actual software eliminates buyer uncertainty. Demonstrating a bite-sized habit (20 MCQs/day) feels achievable after an exhausting 14-hour hospital shift.',
      cognitiveTrigger: 'Friction Reduction & Implementation Intentions ("I can do this in 15 mins")',
      proofStructure: 'Realistic Shift Dilemma -> 15-Minute Daily Workflow -> Pass Guarantee Proof',
      ctaStrategy: 'Action oriented: "Start Free Interactive Trial"',
    },
    diginerveAdaptationStrategy: {
      adaptationMove: 'Showcase DigiNerve\'s actual Clinical Pulse feature and interactive video bookmarking on an authentic iPad/phone layout with Jaypee explanations.',
      recommendedClaims: ['3,500+ Questions with Jaypee Textbook Explanations', '15-Min Clinical Case Stations'],
      caution: 'Do not use fake synthetic mockups; use pixel-accurate DigiNerve app captures.',
    },
  },
  {
    id: 'ref_dn_physical_notes_books',
    title: 'DigiNerve Standard: Physical Printed Notes & Jaypee Textbook Bundle',
    source: 'DigiNerve House Winner',
    brand: 'DigiNerve (Jaypee)',
    angle: Angle.Curriculum,
    targetSegment: 'PROF',
    courseCode: 'PEDMD',
    runningDays: 54,
    previewSvg: generateSvgPreview(
      '#0C2038',
      '#16345E',
      '#F0A63C',
      'Printed Notes Delivered to Your Door',
      'Jaypee Medical Publisher Quality',
      'book'
    ),
    visualStyling: {
      compositionType: 'Physical Notes Flatlay',
      lighting: 'Rich raking studio light highlighting book paper texture, foil embossing, and crisp printing',
      dominantPalette: ['#0C2038', '#16345E', '#F0A63C', '#EAF4FB'],
      safeZoneCoverage: 'Lower 38% quiet white-tinted gradient',
      doctorTreatment: 'Desk flatlay with Littmann stethoscope, highlighters, and open Jaypee clinical pages',
    },
    keyLevers: [
      'Tangible physical asset dramatically increases perceived transaction value',
      'Jaypee\'s print legacy is an unassailable defensive moat against pure-digital startups',
      'High-yield spiral notes shown open to high-resolution anatomical illustrations',
      'Very strong for Undergrad and Professional courses',
    ],
    stylingAnalysis: {
      whatWorks: 'Medical students and residents get screen fatigue. Offering tangible, professionally printed spiral notes bound with medical illustrations turns a software subscription into a physical treasure.',
      cognitiveTrigger: 'Endowment Effect & Tangibility Premium (Physical > Digital)',
      proofStructure: 'Printed Notes Delivered -> Aligned with 450+ Hours Video -> Lifetime Revision Books',
      ctaStrategy: 'Clear value call: "Get Video + Hardcopy Notes"',
    },
    diginerveAdaptationStrategy: {
      adaptationMove: 'Feature the physical Jaypee printed note cover prominently alongside the course. Emphasize "Hardcopy shipped to your hospital / college".',
      recommendedClaims: ['High-Yield Illustrated Printed Notes Included', 'Authored by AIIMS & PGI Faculty'],
      caution: 'Ensure shipping timelines and courier policies are clear in the landing page.',
    },
  },
  {
    id: 'ref_cerebellum_resident_problem',
    title: 'Cerebellum Competitor Analysis: Resident Problem-First Ward Hook',
    source: 'Competitor Audited Long-Runner',
    brand: 'Cerebellum Academy',
    angle: Angle.Social,
    targetSegment: 'PG',
    courseCode: 'MEDMD',
    runningDays: 71,
    previewSvg: generateSvgPreview(
      '#18181B',
      '#27272A',
      '#EAB308',
      'Post-Duty Revision in 30 Mins',
      'High-Yield BTR System',
      'case'
    ),
    visualStyling: {
      compositionType: 'Problem-First Ward Scenario',
      lighting: 'Moody, realistic hospital duty room lighting with warm desk lamp',
      dominantPalette: ['#18181B', '#27272A', '#EAB308', '#F4F4F5'],
      safeZoneCoverage: 'Bottom 38% contrast card',
      doctorTreatment: 'Resident leaning over desk after shift, studying with coffee cup; determined, not defeated',
    },
    keyLevers: [
      'Empathetic opening that mirrors the exact daily exhaustion of junior residents',
      'Rejection of unrealistic 10-hour study plans; offers rapid 30-min targeted recall',
      'High social resonance in doctor communities and WhatsApp groups',
    ],
    stylingAnalysis: {
      whatWorks: 'Speaking directly to the resident\'s lived reality creates instant emotional alignment before discussing course features.',
      cognitiveTrigger: 'In-group Empathy + Relief Framing',
      proofStructure: 'Recognise the Duty Burnout -> Provide Focused 30-min Solution -> Verified Result',
      ctaStrategy: 'Supportive CTA: "See the Rapid Revision Plan"',
    },
    diginerveAdaptationStrategy: {
      adaptationMove: 'Adapt with DigiNerve\'s "Clinical Case Rapid Rounds" or "Between-Shifts OSCE Review". Use calm, respectable tone, never despair.',
      recommendedClaims: ['Designed for Busy Clinical Shifts', 'Bite-Sized 15-Minute Video Modules'],
      caution: 'Never portray doctors as broken or incompetent; maintain dignity and focus on clinical excellence.',
    },
  },
];

// 4. STRATEGIC COMPETITOR PROFILES & DIGINERVE COUNTER-STRATEGIES
export const COMPETITOR_PROFILES: CompetitorProfile[] = [
  {
    id: 'comp_doctutorials',
    name: 'DocTutorials Residency',
    coreAudience: 'MD/MS/DNB Residents preparing for theory & practical OSCE exams',
    creativeStylingDna: 'Clinical booklet lead-magnets, surgical station case studies, cyan/navy palette, high-density feature points.',
    primaryAngles: [Angle.Curriculum, Angle.Free],
    longestRunningMotifs: [
      'Narrow clinical topic booklets ("Emergency Contraception Simplified", "ECG Guide")',
      'OSCE practical station checklist with instruments',
      'Faculty clinical case review snippets',
    ],
    vulnerabilities: [
      'Does not own a 55-year legacy medical publishing house like Jaypee',
      'Booklets can feel ad-hoc without formal editorial peer-review',
      'Lacks the deep institutional faculty author network of Jaypee Brothers',
    ],
    diginerveCounterStrategy: 'Beat them at their own game: Release official "Jaypee Clinical Guides" authored by textbook editors. Offer free OSCE sample chapters backed by the gold-standard Jaypee stamp.',
    presetBrief: {
      angle: Angle.Curriculum,
      headline: 'OBGYN Clinical Residency: OSCE & High-Yield Case Guide',
      subhead: 'Master complex clinical stations with standard Jaypee protocols and video demonstrations.',
      proofClaim: 'Authored by Standard Jaypee Textbook Editors',
      brandTag: 'A Jaypee Enterprise | 55+ Years of Trust',
      cta: 'EXPLORE CLINICAL GUIDE',
      offer: 'FLAT40',
    },
  },
  {
    id: 'comp_dbmci',
    name: 'DBMCI One',
    coreAudience: 'NEET PG, INI-CET, and Resident Doctors wanting daily question habits',
    creativeStylingDna: 'Large real app screenshots, daily goal streaks, question solving workflows, dark mode UI with emerald accents.',
    primaryAngles: [Angle.Demo, Angle.Price],
    longestRunningMotifs: [
      'Real QBank screen occupying 65% of canvas with interactive options',
      'Daily 20-question habit challenge for night duty shifts',
      'Retargeting single-offer cards with aggressive discount codes',
    ],
    vulnerabilities: [
      'Questions often lack deep textbook explanations and clinical citations',
      'Frequent UI changes make app experience inconsistent',
      'Over-reliance on heavy discounts devalues brand equity',
    ],
    diginerveCounterStrategy: 'Highlight DigiNerve\'s Clinical Pulse and video-synchronized QBank where every single MCQ explanation is cross-referenced to standard Jaypee textbooks.',
    presetBrief: {
      angle: Angle.Demo,
      headline: 'Interactive Clinical QBank with Jaypee Textbook Citations',
      subhead: 'Every question explained with page references to standard clinical textbooks.',
      proofClaim: '3,500+ Verified Clinical MCQs & Case Vignettes',
      brandTag: 'NMC / NBE Curriculum Compliant',
      cta: 'TEST YOUR CLINICAL HABIT',
      offer: 'FREETRIAL',
    },
  },
  {
    id: 'comp_cerebellum',
    name: 'Cerebellum Academy',
    coreAudience: 'NEET PG / INI-CET aspirants seeking rapid revision and topper techniques',
    creativeStylingDna: 'High-energy faculty faces, black and bright yellow/gold contrast, scorecards paired with study routines, emotional connection.',
    primaryAngles: [Angle.Faculty, Angle.Result, Angle.Social],
    longestRunningMotifs: [
      'Celebrity faculty posing in action (Dr. Gobind Rai Garg, Dr. Zainab Vora)',
      'Scorecards paired with exact revision behaviour',
      'Motivational ward round hooks',
    ],
    vulnerabilities: [
      'Heavy focus on exam recall rather than long-term clinical ward competence',
      'Less relevant for post-MBBS senior residents and practicing clinicians',
      'Can feel overwhelming with exam pressure rhetoric',
    ],
    diginerveCounterStrategy: 'Position DigiNerve as the serious clinician\'s lifelong partner: "From Residency to Senior Consultant". Focus on actual patient management, OSCE skills, and Jaypee academic rigour.',
    presetBrief: {
      angle: Angle.Faculty,
      headline: 'Learn from the Clinicians Who Write the Textbooks',
      subhead: 'Beyond rote exam tricks: build clinical diagnosis mastery for OPD and ward rounds.',
      proofClaim: '55+ Years Jaypee Medical Publishing Authority',
      brandTag: 'Verified Medical Faculty',
      cta: 'REVIEW RESIDENCY PLAN',
      offer: 'FLAT40',
    },
  },
  {
    id: 'comp_texila_mrcog',
    name: 'Texila & MRCOG Courses',
    coreAudience: 'International medical post-graduates and Royal College aspirants',
    creativeStylingDna: 'High-authority solo faculty portraits, elegant serif typography, clean clinical white coats, 60+ days running ads.',
    primaryAngles: [Angle.Faculty, Angle.Urgency],
    longestRunningMotifs: [
      'Distinguished clinician looking directly into camera with quiet academic background',
      'Named Royal College credentials (FRCOG, MRCP, MD)',
      'Clear batch commencement dates',
    ],
    vulnerabilities: [
      'High price point creates steep drop-off at landing page',
      'Limited digital self-serve tools; reliant on aggressive sales counselors',
    ],
    diginerveCounterStrategy: 'Deliver Royal College and Post-Graduate grade clinical curriculum at transparent, accessible pricing with instant app access and Jaypee learning materials.',
    presetBrief: {
      angle: Angle.Faculty,
      headline: 'Post-Graduate Masterclass Series by Royal College Mentors',
      subhead: 'Direct case-based training with accredited clinicians and Jaypee clinical atlases.',
      proofClaim: 'Accredited Curriculum with Live Chat Shows',
      brandTag: 'A Jaypee Enterprise | 55+ Years of Trust',
      cta: 'ENROL IN MASTERCLASS',
      offer: 'FLAT40',
    },
  },
];
