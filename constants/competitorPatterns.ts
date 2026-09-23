export interface CompetitorMotif {
  id: string;
  label: string;
  mapsToAngle: string;
  funnelStage: 'discover' | 'consider' | 'decide';
  evidence: {
    advertisers: string[];
    runtimeSignal: string;
    strength: string;
  };
  whyItWorks: string;
  competitorExecution: string;
  diginerveAdaptation: string;
  visualDirection: string;
  proofToPair: string;
  cta: string;
  caution?: string;
  segmentRestriction?: string;
}

export const COMPETITOR_PATTERNS = {
  universalLongRunnerRules: [
    'One dominant promise is readable without opening the caption.',
    'Product or course specificity appears early: exam, specialty, feature or named resource.',
    'Proof is concrete: score, rank, price, duration, curriculum count, accreditation or named faculty.',
    'The CTA matches the funnel stage: Download/Register for cold, Sign Up/Enrol for course-intent.',
    'Placement variants reuse the same message rather than changing the proposition by size.',
  ],
  motifs: [
    {
      id: 'narrow-clinical-topic-resource',
      label: 'Narrow clinical topic plus a named resource',
      mapsToAngle: 'CURRICULUM',
      funnelStage: 'discover',
      evidence: {
        advertisers: ['DocTutorials Residency', 'DBMCI One', 'Testbook.com'],
        runtimeSignal: 'A comparable DocTutorials Residency topic/resource creative ran 62 days in audit',
        strength: 'strongest',
      },
      whyItWorks:
        'The topic is recognisable before the product is explained. A real question or booklet gives the click a tangible reason, and specialty relevance is signalled before course consideration is asked for.',
      competitorExecution:
        "Narrowly named free booklets such as 'CNS Simplified' and 'Emergency Contraception Simplified', with an explicit 'Download the Free Booklet' CTA.",
      diginerveAdaptation:
        "One narrowly scoped resource per specialty, branded from Jaypee's clinical library. OBGYN: a real OSCE instrument question. Pediatrics: a real chest X-ray station. Ophthalmology: a real keratitis clinical-features lesson.",
      visualDirection: 'Single clinical artefact as hero, shot clean and large. Quiet surround. No feature list.',
      proofToPair: 'Name the Jaypee title, author or faculty editor the resource was built from. Never a generic badge.',
      cta: 'Download the clinical guide',
    },
    {
      id: 'large-real-app-screen',
      label: 'One large, real product screen',
      mapsToAngle: 'DEMO',
      funnelStage: 'consider',
      evidence: {
        advertisers: ['DBMCI One', 'DocTutorials'],
        runtimeSignal: 'Product-demonstration creative dominates the 30+ day direct-medical set',
        strength: 'strongest',
      },
      whyItWorks:
        'The interface is proof that the course exists and can actually be used. Clearest separator between long-runners and short-runners.',
      competitorExecution: 'Real QBank screens, daily-goal workflows, live class UI, faculty-solved questions.',
      diginerveAdaptation:
        'A current DigiNerve lesson, QBank or Clinical Pulse screen at near-full width, with learning action beside it. Never fabricated miniature mockups.',
      visualDirection: 'Screen occupies 55 to 70 percent of frame. Device framing minimal. Copy zone kept flat and quiet.',
      proofToPair: 'One verified content count from approvedClaims.',
      cta: 'See how the plan works',
    },
    {
      id: 'faculty-face-primary',
      label: 'Named faculty as the primary image',
      mapsToAngle: 'FACULTY',
      funnelStage: 'consider',
      evidence: {
        advertisers: ['DBMCI One', 'Texila Postgraduate Medicine', 'MRCOG Courses by Bhawna Khera'],
        runtimeSignal: 'Texila 69 days, MRCOG 47 days. Long-runners consistently carry named clinician authority',
        strength: 'strong',
      },
      whyItWorks:
        'Human authority lands before any feature list. Identifiable faces signal depth in that exact specialty.',
      competitorExecution: 'Faculty group shots for breadth, single portrait for named specialty lead.',
      diginerveAdaptation:
        "Lead with the named chief editor for that specialty, plus one sourced qualification. This is DigiNerve's most defensible and least-used angle.",
      visualDirection: 'Three-quarter angle, direct eye contact, real teaching/clinical setting rendered shallow behind. Plain white coat, no visible badge.',
      proofToPair: 'Faculty credential plus the Jaypee textbook they authored.',
      cta: 'Review the curriculum',
    },
    {
      id: 'physical-learning-asset',
      label: 'Physical learning asset, books and printed notes',
      mapsToAngle: 'CURRICULUM',
      funnelStage: 'consider',
      evidence: {
        advertisers: ['DocTutorials', 'STEM-S'],
        runtimeSignal: 'Recurring in reference set; strong tangible trust driver',
        strength: 'moderate',
      },
      whyItWorks:
        'A course becomes tangible when actual notes or book are pictured. The textbook connection is a genuine trust asset.',
      competitorExecution: 'Dark premium product composition with books and notes stacked as hero.',
      diginerveAdaptation:
        'Use actual DigiNerve printed-note covers and pages. Where a course maps to a Jaypee title, name that title accurately.',
      visualDirection: 'Flatlay or stacked composition, premium dark ground, raking light for material richness.',
      proofToPair: 'The named Jaypee title and author.',
      cta: 'Explore the course',
    },
    {
      id: 'resident-problem-before-product',
      label: "Resident's real problem, stated before the product",
      mapsToAngle: 'SOCIAL',
      funnelStage: 'discover',
      evidence: {
        advertisers: ['Study MRCOG', 'NPrep', 'Cerebellum Academy'],
        runtimeSignal: 'Problem-first openings consistently outperform generic product promises',
        strength: 'strong',
      },
      whyItWorks:
        'Opens with a situation the learner recognises. Works because PG buyer is time-poor and identifies through friction, not features.',
      competitorExecution: "Ward-round flatlay, after-duty study line, 'your brain forgets 56% in 1 hour'.",
      diginerveAdaptation:
        'OBGYN: OSCE revision between rounds. Pediatrics: review clinical station after a shift. Calm, credible language. Never claim false time-savings.',
      visualDirection: 'Environmental, real workday context. Subject mid-action, forward-leaning, never distressed or exhausted.',
      proofToPair: 'One curriculum specific that answers the friction.',
      cta: 'See the revision plan',
    },
    {
      id: 'result-proof-with-behaviour',
      label: 'Result proof paired with the behaviour behind it',
      mapsToAngle: 'RESULT',
      funnelStage: 'consider',
      evidence: {
        advertisers: ['Cerebellum Academy', 'DBMCI One'],
        runtimeSignal: 'Score proof paired with PYQ revision behaviour',
        strength: 'strong, but segment-bound',
      },
      whyItWorks:
        'A score wall alone is interchangeable. Pairing the result with the specific study behaviour makes the claim credible and usable.',
      competitorExecution: 'Learner photo and score, then exact study behaviour, then feature enabling it.',
      diginerveAdaptation: 'Use only verified result data. Strongest for FMGE and UnderGrad. Never apply topper proof to Professional.',
      visualDirection: 'Real learner, real score card, no stock imagery.',
      proofToPair: 'Verified score plus named study behaviour.',
      cta: 'See the revision plan',
    },
    {
      id: 'single-offer-card',
      label: 'One clear offer card beside the product',
      mapsToAngle: 'PRICE',
      funnelStage: 'decide',
      evidence: {
        advertisers: ['DBMCI One'],
        runtimeSignal: 'Retargeting champion; low friction conversion',
        strength: 'moderate, retargeting only',
      },
      whyItWorks: 'Single high-contrast offer reads without requiring viewer to parse a feature list.',
      competitorExecution: 'One offer card set against real product image.',
      diginerveAdaptation:
        'Warm retargeting only. Pair one course count and product image with an active coupon code. Avoid fake deadline claims.',
      visualDirection: 'Product left, single offer block right. No secondary clutter.',
      proofToPair: 'One verified content count.',
      cta: 'Enrol now',
    },
  ] as CompetitorMotif[],
  cautions: [
    {
      id: 'dense-feature-grid',
      rule: 'Keep feature grids for landing pages. For a single static ad, promote one proof point and one learning action.',
    },
    {
      id: 'generic-doctor-stock',
      rule: 'Never ship a stock clinician. Use a real named faculty member, or an artefact, or a real product screen.',
    },
    {
      id: 'discount-first-mega-offer',
      rule: 'Offer-led creative is a retargeting format, never the first prospecting concept for doctors.',
    },
    {
      id: 'borrowed-claims',
      rule: 'Never port a competitor claim. Every number must come from that course’s own approvedClaims list.',
    },
  ],
};
