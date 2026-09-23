import { CampaignBrief, NamingResult } from '../types';
import { TAXONOMY } from '../constants/taxonomy';

export function buildCampaignName(brief: CampaignBrief): string {
  const parts = [
    brief.brand,
    brief.type,
    brief.platform,
    brief.objective,
    brief.segment,
    brief.product,
    brief.geo,
    brief.launchMonth,
  ];
  return parts.join('_');
}

export function buildAdSetName(brief: CampaignBrief): string {
  // sanitize audience: uppercase, alphanumeric and hyphens only
  const cleanAudience = (brief.audience || 'PGDOCTORS')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
  const parts = [brief.targeting, cleanAudience, brief.geo, brief.launchDate];
  return parts.join('_');
}

export function buildAdName(
  format: string,
  angle: string,
  offer: string,
  versionNum: number,
  launchDate: string
): string {
  const vStr = `V${versionNum}`;
  const parts = [format, angle, offer, vStr, launchDate];
  return parts.join('_');
}

export function validateNaming(
  campaignName: string,
  adSetName: string,
  adName: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const checkNoIllegalChars = (name: string, label: string) => {
    if (/[\s,|/[\]'"+–—]/.test(name)) {
      errors.push(
        `${label} contains illegal characters (spaces, commas, slashes, pipes, brackets, or dashes). Use underscore between tokens and hyphen only within tokens.`
      );
    }
    if (name.includes('Copy') || name.includes('– Copy') || name.includes('- Copy')) {
      errors.push(`${label} contains 'Copy'. Duplication tags are strictly forbidden.`);
    }
    if (/\bNA\b/.test(name)) {
      errors.push(`${label} contains 'NA'. Remove non-applicable segments entirely.`);
    }
    if (name !== name.toUpperCase()) {
      errors.push(`${label} must be strictly UPPERCASE.`);
    }
  };

  // Length constraints
  if (campaignName.length > 45) {
    errors.push(`Campaign name (${campaignName.length} chars) exceeds 45 char ceiling.`);
  }
  if (adSetName.length > 40) {
    errors.push(`Ad set name (${adSetName.length} chars) exceeds 40 char ceiling.`);
  }
  if (adName.length > 40) {
    errors.push(`Ad name (${adName.length} chars) exceeds 40 char ceiling.`);
  }

  checkNoIllegalChars(campaignName, 'Campaign');
  checkNoIllegalChars(adSetName, 'Ad Set');
  checkNoIllegalChars(adName, 'Ad');

  // Validate campaign tokens
  const campTokens = campaignName.split('_');
  if (campTokens.length !== 8) {
    errors.push(`Campaign name must have exactly 8 underscore-separated segments.`);
  } else {
    const [brand, type, plat, obj, seg, prod, geo, mmyy] = campTokens;
    if (!TAXONOMY.BRAND.includes(brand as any)) errors.push(`Unknown BRAND code: ${brand}`);
    if (!TAXONOMY.TYPE.includes(type as any)) errors.push(`Unknown TYPE code: ${type}`);
    if (!TAXONOMY.PLATFORM.includes(plat as any)) errors.push(`Unknown PLATFORM code: ${plat}`);
    if (!TAXONOMY.OBJECTIVE.includes(obj as any)) errors.push(`Unknown OBJECTIVE code: ${obj}`);
    if (!TAXONOMY.SEGMENT.includes(seg as any)) errors.push(`Unknown SEGMENT code: ${seg}`);
    if (!TAXONOMY.PRODUCT.includes(prod as any)) errors.push(`Unknown PRODUCT code: ${prod}`);
    if (!TAXONOMY.GEO.includes(geo as any)) errors.push(`Unknown GEO code: ${geo}`);
    if (!/^\d{4}$/.test(mmyy)) errors.push(`Campaign launch date must be MMYY (4 digits, e.g. 0926)`);
  }

  // Validate ad set tokens
  const adSetTokens = adSetName.split('_');
  if (adSetTokens.length !== 4) {
    errors.push(`Ad Set name must have exactly 4 underscore-separated segments.`);
  } else {
    const [targeting, , geo, ddmmyy] = adSetTokens;
    if (!TAXONOMY.TARGETING.includes(targeting as any)) errors.push(`Unknown TARGETING code: ${targeting}`);
    if (!TAXONOMY.GEO.includes(geo as any)) errors.push(`Unknown GEO code: ${geo}`);
    if (!/^\d{6}$/.test(ddmmyy)) errors.push(`Ad Set launch date must be DDMMYY (6 digits, e.g. 220926)`);
  }

  // Validate ad tokens
  const adTokens = adName.split('_');
  if (adTokens.length !== 5) {
    errors.push(`Ad name must have exactly 5 underscore-separated segments.`);
  } else {
    const [format, angle, offer, version, ddmmyy] = adTokens;
    if (!TAXONOMY.FORMAT.includes(format as any)) errors.push(`Unknown FORMAT code: ${format}`);
    if (!TAXONOMY.ANGLE.includes(angle as any)) errors.push(`Unknown ANGLE code: ${angle}`);
    if (!TAXONOMY.OFFER.includes(offer as any)) errors.push(`Unknown OFFER code: ${offer}`);
    if (!/^V\d+$/.test(version)) errors.push(`Ad version must be V followed by number, e.g. V1, V2`);
    if (!/^\d{6}$/.test(ddmmyy)) errors.push(`Ad launch date must be DDMMYY (6 digits, e.g. 220926)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildTrackingTemplate(campaignName: string, adSetName: string, adName: string): string {
  return `utm_source={{site_source_name}}&utm_medium=lp&utm_campaign={{campaign.name}}&utm_id={{campaign.id}}&utm_adgroup={{adset.name}}&adgroup_id={{adset.id}}&utm_content={{ad.name}}&ad_id={{ad.id}}&utm_placement={{placement}}&sub_source=landing_page`;
}

export function buildLandingPageUrl(brief: CampaignBrief): string {
  const seg = brief.segment.toLowerCase();
  const prod = brief.product.toLowerCase();
  if (brief.type === 'CHATSHOW') {
    return `https://www.diginerve.com/lp/chatshow/${prod}-${brief.launchDate}/`;
  }
  return `https://www.diginerve.com/lp/${seg}/${prod}/`;
}

export function buildWhatsAppLink(campaignName: string): string {
  const phone = '918800418418';
  const encodedText = encodeURIComponent(`Hi DigiNerve - ref:${campaignName}|{{ad.id}}`);
  return `https://wa.me/${phone}?text=${encodedText}`;
}

export function getFullNamingPackage(
  brief: CampaignBrief,
  versionNum: number = 1
): NamingResult {
  const campaignName = buildCampaignName(brief);
  const adSetName = buildAdSetName(brief);
  const adName = buildAdName('IMG', brief.angle, brief.offer, versionNum, brief.launchDate);
  const validation = validateNaming(campaignName, adSetName, adName);

  return {
    campaignName,
    adSetName,
    adName,
    campaignLength: campaignName.length,
    adSetLength: adSetName.length,
    adLength: adName.length,
    valid: validation.valid,
    errors: validation.errors,
    trackingTemplate: buildTrackingTemplate(campaignName, adSetName, adName),
    landingPageUrl: buildLandingPageUrl(brief),
    waLink: buildWhatsAppLink(campaignName),
  };
}
