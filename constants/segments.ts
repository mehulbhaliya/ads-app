import { Segment } from '../types';

export interface SegmentPreset {
  id: Segment;
  name: string;
  visualRegister: string;
  leadWith: string;
  neverDo: string;
  prompt: string;
}

export const SEGMENT_PRESETS: Record<Segment, SegmentPreset> = {
  PG: {
    id: 'PG',
    name: 'PostGrad MD/MS & Super Speciality',
    visualRegister: 'Focused, time-poor, specialty-specific, clinical',
    leadWith: 'The named specialist in their exact specialty, high-yield over comprehensive',
    neverDo: 'Broad claims that do not name the specialty; hour-count-led positioning',
    prompt: `**BUYER SEGMENT: POSTGRAD RESIDENCY & SUPER SPECIALITY (PG)**
The audience consists of busy Indian MD/MS postgrad residents, registrars, and super-speciality candidates with extreme time constraints.
- **Subject & Age:** 25-34 years old working resident doctors. Serious, clinically focused, mature demeanor wearing authentic clean scrubs or unadorned white coat.
- **Visual Tone:** Deep, restrained clinical confidence. High-contrast authentic hospital and department backgrounds with shallow depth of field.
- **Energy:** Disciplined, high-yield, no frivolous ornamentation.
- **Never include:** undergrad university party atmospheres, generic stethoscope-around-neck stock poses, or vague generalized medical symbols.`,
  },
  PROF: {
    id: 'PROF',
    name: 'Practising Clinicians & Certifications',
    visualRegister: 'Restrained, credible, premium, adult',
    leadWith: 'Credentials, curriculum rigour, career mobility, Jaypee lineage',
    neverDo: 'Topper or rank-style social proof; discount-led framing',
    prompt: `**BUYER SEGMENT: PRACTISING CLINICIANS & FELLOWS (PROF)**
Audience comprises established doctors, consultants, and specialists pursuing advanced procedural certifications (MRCOG, IVF, Ultrasound, Surgical Oncology).
- **Subject & Age:** 30-50+ years old practising physicians and surgeons. Experienced, confident, dignified posture.
- **Visual Tone:** Sophisticated, premium, collegiate medical authority. Executive clinical suites, modern operating theatres, high-end seminar environments.
- **Energy:** Measured, authoritative, prestigious.
- **Never include:** juvenile exam topper framing, countdown rush graphics, or price-slashing aesthetics that degrade clinical stature.`,
  },
  FMGE: {
    id: 'FMGE',
    name: 'Foreign Medical Graduates',
    visualRegister: 'Reassuring, warm, steady, calm',
    leadWith: 'Pass-rate confidence, steady revision rhythm, mutual support',
    neverDo: '"Become a doctor" framing—they already are licensed doctors',
    prompt: `**BUYER SEGMENT: FOREIGN MEDICAL GRADUATES (FMGE)**
Audience has already completed their medical degree abroad and is preparing to clear the licensing exam in India.
- **Subject & Age:** 24-30 years old qualified doctors. Relieved, determined, dignified.
- **Visual Tone:** Warm, reassuring, uplifting. Clear daylight, welcoming modern clinical study centers.
- **Critical Rule:** NEVER treat them as high school or undergrad students. They are graduate doctors preparing for Indian council licensing.`,
  },
  UG: {
    id: 'UG',
    name: 'Undergraduate MBBS',
    visualRegister: 'Higher energy, brighter, peer-aged subjects, more saturated',
    leadWith: 'Peer proof, top ranks, comprehensive conceptual clarity',
    neverDo: 'Sombre corporate restraint',
    prompt: `**BUYER SEGMENT: UNDERGRADUATE MBBS (UG)**
First to final year medical students seeking high-yield concept mastery for university exams and foundational NEET-PG prep.
- **Subject & Age:** 19-24 years old medical college students in lecture halls, anatomy/dissection tables, or hostel study spaces.
- **Visual Tone:** Vibrant, optimistic, dynamic natural lighting. Clean campus atmosphere with energetic peer camaraderie.`,
  },
  INT: {
    id: 'INT',
    name: 'Compulsory Rotatory Interns',
    visualRegister: 'Active duty, shift-work reality, pragmatic',
    leadWith: 'On-duty revision, clinical pearls, ward emergency tools',
    neverDo: 'Leisurely library daydreaming poses',
    prompt: `**BUYER SEGMENT: MEDICAL INTERNS (INT)**
Interns running 24-36 hour shifts with exhausted pockets of revision time between casualty calls and ward duties.
- **Subject & Age:** 23-26 years old active intern doctors on hospital corridors or emergency desk. Practical scrubs and ID lanyard (text-free).`,
  },
  NURS: {
    id: 'NURS',
    name: 'Nursing & Allied Health',
    visualRegister: 'Hands-on patient care, bedside competence',
    leadWith: 'Procedure protocols, critical care nursing, patient safety',
    neverDo: 'Doctor-centric hierarchy',
    prompt: `**BUYER SEGMENT: NURSING & ALLIED HEALTHCARE (NURS)**
Professional nursing staff and critical care specialists advancing their bedside and clinical procedural competencies.`,
  },
  DENT: {
    id: 'DENT',
    name: 'Dental Surgery (BDS / MDS)',
    visualRegister: 'Precision operatory, maxillofacial & aesthetic focus',
    leadWith: 'Implantology, orthodontics, case-based prosthodontics',
    neverDo: 'General hospital emergency room tropes',
    prompt: `**BUYER SEGMENT: DENTAL SURGERY & SPECIALITIES (DENT)**
Dental clinicians and MDS residents focusing on specialized clinical operatory procedures and aesthetic dental medicine.`,
  },
};
