export enum Angle {
  Faculty = 'FACULTY',
  Result = 'RESULT',
  Demo = 'DEMO',
  Price = 'PRICE',
  Urgency = 'URGENCY',
  Social = 'SOCIAL',
  Free = 'FREE',
  Curriculum = 'CURRICULUM',
}

export type Segment = 'UG' | 'PG' | 'INT' | 'FMGE' | 'PROF' | 'NURS' | 'DENT';
export type Offer = 'FLAT40' | 'FLAT30' | 'FREETRIAL' | 'FEST' | 'LAUNCH' | 'NOOFFER';
export type Format = 'IMG' | 'VID' | 'CAR' | 'COL' | 'RSA' | 'DCO';
export type CampaignType = 'LEADS' | 'CHATSHOW' | 'SALES' | 'WA' | 'APP' | 'RMK' | 'BRAND';
export type Platform = 'META' | 'GOOG' | 'YT' | 'WA' | 'EM' | 'SMS' | 'INF' | 'ORG' | 'OFF';
export type CampaignObjective =
  | 'INSTANTFORM'
  | 'LP'
  | 'CTWA'
  | 'APPINSTALL'
  | 'VIDEO'
  | 'SEARCH'
  | 'PMAX'
  | 'DISPLAY'
  | 'DEMANDGEN';
export type TargetingType = 'INT' | 'LAL' | 'CUS' | 'OPEN' | 'ADV' | 'DATA' | 'RMK';
export type Ratio = '1:1' | '4:5' | '9:16' | '1.91:1';
export type MasterRatio = '3:4' | '9:16';
export type ImageRole = 'brandLock' | 'houseReference' | 'competitorReference';

export interface RefImage {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  role: ImageRole;
  label?: string;
}

export interface ApprovedClaim {
  claim: string;
  sourceFile?: string;
  locator?: string;
  corroboratedBy?: string;
  conflict?: boolean;
  conflictDetail?: string;
  note?: string;
  scope?: string;
  provenanceWarning?: string;
}

export interface CourseFaculty {
  name: string;
  role?: string;
  spellingConfidence: 'confirmed' | 'disputed' | 'unknown';
  conflict?: boolean;
  conflictDetail?: string;
  note?: string;
}

export interface CourseFacts {
  courseCode: string;
  courseName: string; // exact catalog name, never abbreviated in copy
  segment: Segment;
  dataQuality?: string;
  chiefEditor?: {
    name: string;
    role?: string;
    credentials?: string;
    designation?: string;
    spellingConfidence: 'confirmed' | 'disputed' | 'unknown';
    conflict?: boolean;
    conflictDetail?: string;
  };
  facultyNames: CourseFaculty[];
  referenceTextbook?: string | string[] | { value: string; conflict: boolean; conflictDetail?: string };
  priceCurrent?: string | number | null;
  priceStruck?: string | number | null;
  priceNotes?: string;
  curriculumHighlights: string[];
  approvedClaims: ApprovedClaim[]; // the ONLY numbers copy may use
  testimonials?: { quote: string; attribution: string; rightsStatus?: string }[];
  competitorContrast?: { claim: string; note?: string; conflict?: boolean; conflictDetail?: string; publicUseNote?: string }[];
  cautions: string[]; // course-specific copy bans
  sessionDate?: string; // chat show / live class only
}

export interface CampaignBrief {
  brand: 'DN' | 'JP' | 'RAS';
  type: CampaignType;
  platform: 'META' | 'GOOG' | 'YT' | 'WA';
  objective: CampaignObjective;
  segment: Segment;
  product: string; // PRODUCT code
  geo: string; // GEO code
  targeting: TargetingType;
  audience: string;
  launchMonth: string; // MMYY
  launchDate: string; // DDMMYY
  angle: Angle;
  offer: Offer;
  course: CourseFacts;
  references: RefImage[];
  userNotes?: string; // LEVEL 5, highest priority instructions
}

export type BrandColorToken = 'navy' | 'navyDeep' | 'gold' | 'tintLight' | 'surface' | 'success';

export interface TextLayer {
  id: string;
  role: 'headline' | 'subhead' | 'proofChip' | 'offerBadge' | 'cta' | 'logo' | 'facultyName' | 'brandTag';
  content: string;
  tagline?: string;
  logoVariant?: 'full' | 'compact' | 'light' | 'dark' | 'badge';
  badgeStyle?: 'pill' | 'rectangular' | 'outline' | 'official';
  token: BrandColorToken;
  bgToken?: BrandColorToken | 'transparent';
  fontSize: number; // in pt/px scale
  fontWeight: 'bold' | 'semibold' | 'normal';
  x: number; // normalised 0..1 so layout survives ratio changes
  y: number; // normalised 0..1
  maxWidthPct: number; // 0..100
  align: 'left' | 'center' | 'right';
  locked: boolean;
}

export interface GeneratedCreative {
  id: string;
  base64: string; // the text-free AI visual base
  masterRatio: MasterRatio;
  derivedRatios: Ratio[];
  layers: TextLayer[];
  brief: CampaignBrief;
  resolvedPrompt: string; // exact text sent to model/MCP
  variantAxis: string;
  version: number;
  adName: string;
  rating: 'good' | 'bad' | null;
  feedbackNotes?: string;
  performance?: AdPerformance;
  createdAt: string;
  generationError?: string;
}

export interface AdPerformance {
  adName: string; // join key, matches utm_content / mx_utm_content
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  leads?: number;
  cpl?: number;
  purchases?: number;
  cpa?: number;
  importedAt: string;
}

export interface LearningStore {
  avoid: { id: string; angle: Angle; note: string; createdAt: string }[];
  replicate: { id: string; angle: Angle; note: string; exemplarId: string; createdAt: string }[];
  exemplars: { id: string; angle: Angle; base64: string; resolvedPrompt: string; promotions: number; createdAt: string }[];
  houseStyleLocks: { id: string; name: string; angle: Angle; base64: string; createdAt: string }[];
}

export interface MetaAdCopy {
  id: string;
  conceptName: string;
  primaryText: string;
  primaryTextLength: number;
  primaryTextValid: boolean;
  headline: string;
  headlineLength: number;
  headlineValid: boolean;
  description: string;
  descriptionLength: number;
  descriptionValid: boolean;
  cta: 'SIGN_UP' | 'APPLY_NOW' | 'BOOK_NOW' | 'SHOP_NOW' | 'LEARN_MORE' | 'WHATSAPP_MESSAGE';
  groundedFacts: string[];
  validationErrors: string[];
}

export interface NamingResult {
  campaignName: string;
  adSetName: string;
  adName: string;
  campaignLength: number;
  adSetLength: number;
  adLength: number;
  valid: boolean;
  errors: string[];
  trackingTemplate: string;
  landingPageUrl: string;
  waLink?: string;
}

// Legacy compatibility for any existing imports
export interface ImageData {
  file: File;
  base64: string;
  mimeType: string;
}

export enum TaskType {
  RoomStaging = 'Room Staging',
  CatalogAngle = 'Catalog Angle Generator',
  ShadeFinish = 'Shade Finish Render',
  Countertop = 'Countertop Replacement',
}

export interface GeneratedImage {
  id: string;
  base64: string;
  sourceTask: TaskType;
}
