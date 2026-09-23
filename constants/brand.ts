import { BrandColorToken } from '../types';

export const BRAND = {
  navy: '#16345E', // primary, wordmark, CTA fill, price text
  navyDeep: '#0C2038', // footer, heavy overlays, background
  gold: '#F0A63C', // accent, the "nerve" in the wordmark, highlight only
  tintLight: '#EAF4FB', // section grounds, stat blocks
  surface: '#FFFFFF',
  success: '#1D9A66', // feature checkmarks
} as const;

export const BRAND_IDENTITY = {
  name: 'DigiNerve',
  parentCompany: 'Jaypee Brothers Medical Publishers',
  officialEndorsement: 'A Jaypee Enterprise',
  publisherHeritage: '55+ Years of Medical Publishing',
  tagline: 'Empowering Clinicians with Evidence-Based Mastery',
} as const;

export const BRAND_CONTACT = {
  phone: '+91-8800-418-418',
  email: 'marketing@diginerve.com',
  bannedEmail: 'support@diginerve.com',
} as const;

export const SAFE_ZONES = {
  '3:4': {
    copyZone: 'lower 38%',
    description: 'lower 38% of the canvas',
    reserve: 'none',
  },
  '9:16': {
    copyZone: 'middle band (y: 0.20 to 0.62)',
    description: 'middle band between y 0.20 and 0.62',
    reserve: 'top 14% and bottom 20% are UI chrome, keep fully empty',
  },
} as const;

export const TYPOGRAPHY = {
  headingFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  bodyFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

export function getBrandHex(token: BrandColorToken): string {
  return BRAND[token] || BRAND.navy;
}
