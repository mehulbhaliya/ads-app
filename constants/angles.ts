import { Angle } from '../types';

export interface AnglePreset {
  id: Angle;
  name: string;
  funnelStage: 'discover' | 'consider' | 'decide';
  description: string;
  prompt: string;
  referenceMotifIds: string[];
}

export const ANGLE_PRESETS: Record<Angle, AnglePreset> = {
  [Angle.Faculty]: {
    id: Angle.Faculty,
    name: 'Named faculty authority',
    funnelStage: 'consider',
    description: 'Senior clinician-teacher in real department environment. Human authority before feature lists.',
    referenceMotifIds: ['faculty-face-primary'],
    prompt: `**ANGLE PROFILE: NAMED FACULTY AUTHORITY**
A single named medical educator is the subject and the entire source of authority in this frame.
- **Subject & Pose:** Shoot them as a working clinician-teacher, not a corporate portrait. Three-quarter angle, direct eye contact with the lens, natural authority rather than a posed smile. The subject occupies the upper or side portion of the frame so the copy zone stays clear.
- **Environment:** A real teaching or clinical setting rendered shallow and non-specific behind them, suggesting a department corridor, seminar room or ward without naming any institution.
- **Lighting:** Soft key from camera left with gentle fill. Clinical in cleanliness but warm in tone. Never the flat overlit look of stock medical photography.
- **Wardrobe:** A plain white coat or plain professional clothing with no visible text, badge or embroidery.
- **Must never be:** a stock clinician, a generic archetype of a doctor, or a group shot when the promise is about one specialty. This must feel like a specific person.`,
  },
  [Angle.Urgency]: {
    id: Angle.Urgency,
    name: 'Closing window',
    funnelStage: 'decide',
    description: 'Tighter crop, raking directional light, momentum without distress.',
    referenceMotifIds: [],
    prompt: `**ANGLE PROFILE: CLOSING WINDOW**
The frame communicates a closing window through composition and light alone, because no text or graphic device may be rendered.
- **Light & Crop:** Directional light raking across the frame, a compressed and slightly tighter crop than default, elevated contrast to create tension.
- **Subject:** Where a subject is present they are mid-action and forward-leaning, caught in motion rather than posed, conveying a student working against a deadline.
- **Colour:** Grades cooler in the shadows, with DigiNerve gold reserved as a single warm accent of light, never as a flood.
- **Must never include:** a clock, calendar, hourglass, countdown, timer or sand motif, since these are literal cliches and cannot be rendered as text anyway.
- **Must never convey:** panic, distress or exhaustion in a human subject. The register is focused momentum, not anxiety. The copy zone stays the calmest region of the frame so the deadline placed there reads instantly.`,
  },
  [Angle.Curriculum]: {
    id: Angle.Curriculum,
    name: 'Narrow clinical topic & resource',
    funnelStage: 'discover',
    description: 'Hero clinical asset, printed notes, OSCE instruments or textbook stack with material richness.',
    referenceMotifIds: ['narrow-clinical-topic-resource', 'physical-learning-asset', 'credential-and-hands-on-grid'],
    prompt: `**ANGLE PROFILE: CURRICULUM & CLINICAL RESOURCE**
The frame focuses on tangible clinical learning artefacts: an authentic medical case study sheet, printed clinical manual, or diagnostic station tools rendered with rich tactile detail.
- **Composition:** Clean flatlay or dramatic 45-degree angle table perspective. The clinical artifact sits cleanly in the focal zone, surrounded by generous negative space for overlaid copy and proof chips.
- **Environment:** Medical study desk, library wood table, or quiet doctor's console with subtle diagnostic instruments (stethoscope, penlight) arranged organically.
- **Lighting:** Natural warm desk lamp illumination mixed with cool clinical room ambient light, producing elegant rim highlights on paper textures and instruments.
- **Must never include:** generic floating 3D graphs, fake bar charts, rendered text on the book/sheet, or cartoon educational vector shapes. Keep it completely grounded in physical reality.`,
  },
  [Angle.Demo]: {
    id: Angle.Demo,
    name: 'One large real product screen',
    funnelStage: 'consider',
    description: 'Tablet/device showing authentic clinical workflow with abstract UI (no text) in quiet space.',
    referenceMotifIds: ['large-real-app-screen'],
    prompt: `**ANGLE PROFILE: LARGE PRODUCT & WORKFLOW DEMO**
Demonstrates the digital learning tool or QBank experience in actual doctor use without rendering legible UI text.
- **Subject & Action:** A resident doctor holding a tablet or interacting with a sleek workstation display, seen from an over-the-shoulder or side-profile angle. The screen interface shows realistic medical video waveform or anatomical imaging structures without alphanumeric text.
- **Composition:** The device screen and interaction occupy roughly 60% of the visual field, positioned so that the designated copy zone remains soft and unobstructed.
- **Lighting:** Crisp display glow illuminating the doctor's thoughtful expression, with ambient hospital or residency room depth.
- **Must never include:** fabricated miniature fake phone floating mockups, neon holographic UI projections, or illegible lorem-ipsum gibberish on screen.`,
  },
  [Angle.Result]: {
    id: Angle.Result,
    name: 'Outcome & verified achievement',
    funnelStage: 'consider',
    description: 'Authentic learner in triumphant yet composed residency celebration; zero stock smiles.',
    referenceMotifIds: ['result-proof-with-behaviour'],
    prompt: `**ANGLE PROFILE: OUTCOME & VERIFIED ACHIEVEMENT**
Communicates the feeling of hard-earned milestone achievement (qualifying exam, residency admission, fellowship attainment).
- **Subject:** A young Indian resident or doctor in white coat holding their stethoscope or notes, expressing quiet confidence and relief. Authentic demeanor, natural posture, no theatrical victory poses.
- **Environment:** Hospital entrance corridor, academic convocation lawn, or quiet post-shift lounge with natural daylight.
- **Lighting:** Warm golden hour or high-key optimistic soft daylight. Dignified, uplifting, professional.
- **Must never include:** fabricated scorecards, floating gold medals, confetti, trophy illustrations, or rank badges rendered into the image. All proof numbers are composited by the layout engine.`,
  },
  [Angle.Price]: {
    id: Angle.Price,
    name: 'Value through production quality',
    funnelStage: 'decide',
    description: 'Material richness and premium stature conveying exceptional return on investment.',
    referenceMotifIds: ['single-offer-card'],
    prompt: `**ANGLE PROFILE: VALUE & MATERIAL RICHNESS**
Value is communicated through exquisite production quality, deep clinical pedigree, and substantial resource completeness.
- **Composition:** High-end architectural framing of medical learning: leather-bound reference books, precision diagnostic instrument, and sleek tablet arranged in harmonious balance.
- **Palette & Lighting:** Deep navy slate background with warm golden directional accents, evoking the 55+ year Jaypee medical publishing heritage.
- **Must never include:** discount tags, percentage ribbons, sale burst stickers, coin stacks, rupee graphics, or slash-price stickers rendered by the model. The offer badge is handled purely by the vector compositor.`,
  },
  [Angle.Social]: {
    id: Angle.Social,
    name: "Resident's real problem & peer connection",
    funnelStage: 'discover',
    description: 'Relatable time-poor resident friction between ward rounds or post-duty revision.',
    referenceMotifIds: ['resident-problem-before-product'],
    prompt: `**ANGLE PROFILE: RESIDENT PROBLEM & PEER CONNECTION**
Portrays the genuine daily reality of an Indian medical resident balancing intense ward duties with rigorous exam preparation.
- **Subject:** A resident doctor pausing during a break at the duty room desk, reviewing clinical notes on a tablet with concentrated focus.
- **Mood & Pose:** Relatable, earnest, tired but driven; forward-leaning concentration. Not dramatized despair or burnout.
- **Environment:** Real residency duty room, nurse station counter, or hospital cafeteria corner with authentic atmosphere.
- **Must never convey:** panic, clinical distress, or despair. Must never look like an American generic medical drama or high school stock study photo.`,
  },
  [Angle.Free]: {
    id: Angle.Free,
    name: 'Low-commitment open invitation',
    funnelStage: 'discover',
    description: 'Inviting, accessible, open composition highlighting a free trial or clinical guide.',
    referenceMotifIds: ['narrow-clinical-topic-resource'],
    prompt: `**ANGLE PROFILE: LOW-COMMITMENT INVITATION**
Warm, accessible and welcoming aesthetic lowering the barrier for doctors to experience DigiNerve clinical content.
- **Composition:** Open, uncluttered framing with generous negative space. A welcoming doctor or an open digital tablet positioned invitingly toward the viewer.
- **Lighting:** Bright, friendly natural light with soft pastel ambient fills, maintaining professional clinical credibility.
- **Must never include:** tacky "FREE" sticker ribbons, gift box graphics, or cartoon starbursts. The free trial badge and CTA are typeset by the system.`,
  },
};
