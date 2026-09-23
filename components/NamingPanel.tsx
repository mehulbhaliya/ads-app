import React, { useState } from 'react';
import { CampaignBrief, NamingResult } from '../types';
import { getFullNamingPackage } from '../services/naming';
import { Tag, CheckCircle2, AlertTriangle, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface NamingPanelProps {
  brief: CampaignBrief;
  versionNum: number;
}

const PRE_LAUNCH_CHECKS = [
  '1. Campaign, Ad Set and Ad names follow DigiNerve Standard v1.0 exactly',
  '2. All codes in names match the approved dictionary in uppercase',
  '3. No "Copy" or "– Copy" exists anywhere in ad or ad set names',
  '4. Lengths are within limits: Campaign <=45 chars, Ad Set <=40, Ad <=40',
  '5. Date format is MMYY at campaign level, DDMMYY below',
  '6. Meta URL tracking template is placed in Destination Tracking URL parameters',
  '7. Landing page slug matches product and campaign type (/lp/{segment}/{product}/)',
  '8. Copy contains NO "diploma" and NO unconfirmed faculty names',
  '9. All numeric claims match that course’s approvedClaims list exactly',
  '10. [CRITICAL] Clicked preview link in Meta Ads Manager to verify utm_content lands cleanly',
  '11. [CRITICAL] Submitted an end-to-end test lead to verify LeadSquared receives mx_utm_content',
];

export const NamingPanel: React.FC<NamingPanelProps> = ({ brief, versionNum }) => {
  const naming: NamingResult = getFullNamingPackage(brief, versionNum);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyFullPackage = () => {
    const pkg = `=== DIGINERVE LAUNCH PACKAGE ===
CAMPAIGN NAME (${naming.campaignLength}/45 chars):
${naming.campaignName}

AD SET NAME (${naming.adSetLength}/40 chars):
${naming.adSetName}

AD NAME (${naming.adLength}/40 chars):
${naming.adName}

LANDING PAGE URL:
${naming.landingPageUrl}

TRACKING TEMPLATE (URL Parameters):
${naming.trackingTemplate}

VALIDATION STATUS:
${naming.valid ? 'PASSED (Compliant with Standard v1.0)' : 'FAILED: ' + naming.errors.join(', ')}
`;
    handleCopy(pkg, 'fullPackage');
  };

  return (
    <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-5 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-700 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-dn-gold" />
            Compliant Naming & Tracking Architecture
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            DigiNerve Standard v1.0: Values flow into LeadSquared mx_utm_content automatically.
          </p>
        </div>

        <button
          onClick={handleCopyFullPackage}
          className="px-3.5 py-1.5 bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition"
        >
          {copiedKey === 'fullPackage' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedKey === 'fullPackage' ? 'Package Copied' : 'Copy Launch Package'}</span>
        </button>
      </div>

      {/* Naming Fields */}
      <div className="space-y-3 text-xs">
        {/* Campaign Name */}
        <div className="bg-gray-900/90 border border-gray-700/80 p-3 rounded-lg space-y-1">
          <div className="flex justify-between items-center text-gray-400 font-semibold text-[11px]">
            <span>CAMPAIGN NAME</span>
            <span className={`font-mono ${naming.campaignLength <= 45 ? 'text-green-400' : 'text-red-400'}`}>
              {naming.campaignLength}/45 chars
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-mono font-bold select-all break-all">{naming.campaignName}</span>
            <button
              onClick={() => handleCopy(naming.campaignName, 'camp')}
              className="p-1 text-gray-400 hover:text-white"
            >
              {copiedKey === 'camp' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Ad Set Name */}
        <div className="bg-gray-900/90 border border-gray-700/80 p-3 rounded-lg space-y-1">
          <div className="flex justify-between items-center text-gray-400 font-semibold text-[11px]">
            <span>AD SET NAME</span>
            <span className={`font-mono ${naming.adSetLength <= 40 ? 'text-green-400' : 'text-red-400'}`}>
              {naming.adSetLength}/40 chars
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-mono font-bold select-all break-all">{naming.adSetName}</span>
            <button
              onClick={() => handleCopy(naming.adSetName, 'adset')}
              className="p-1 text-gray-400 hover:text-white"
            >
              {copiedKey === 'adset' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Ad Name */}
        <div className="bg-gray-900/90 border border-gray-700/80 p-3 rounded-lg space-y-1">
          <div className="flex justify-between items-center text-gray-400 font-semibold text-[11px]">
            <span>AD NAME (Auto-Incremented V{versionNum})</span>
            <span className={`font-mono ${naming.adLength <= 40 ? 'text-green-400' : 'text-red-400'}`}>
              {naming.adLength}/40 chars
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-mono font-bold select-all break-all">{naming.adName}</span>
            <button
              onClick={() => handleCopy(naming.adName, 'ad')}
              className="p-1 text-gray-400 hover:text-white"
            >
              {copiedKey === 'ad' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Validation Status Block */}
      <div
        className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
          naming.valid
            ? 'bg-green-950/30 border-green-800/80 text-green-200'
            : 'bg-red-950/30 border-red-800/80 text-red-200'
        }`}
      >
        {naming.valid ? (
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <span className="font-bold">
            {naming.valid ? 'Taxonomy Validation Passed' : 'Naming Errors Detected (Export Blocked)'}
          </span>
          {!naming.valid && (
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-red-300">
              {naming.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Destination Tracking & Landing Page URL */}
      <div className="space-y-3 text-xs">
        {/* Landing Page URL */}
        <div className="bg-gray-900/90 border border-gray-700/80 p-3 rounded-lg space-y-1">
          <span className="text-gray-400 font-semibold block text-[11px]">DESTINATION LANDING PAGE</span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-dn-gold font-mono break-all">{naming.landingPageUrl}</span>
            <button
              onClick={() => handleCopy(naming.landingPageUrl, 'lp')}
              className="p-1 text-gray-400 hover:text-white"
            >
              {copiedKey === 'lp' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tracking Template */}
        {brief.objective === 'INSTANTFORM' ? (
          <div className="bg-amber-950/30 border border-amber-800 p-3 rounded-lg text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Instant Form Notice: No URL Parameter Exists</span>
            </div>
            <p className="text-[11px] text-amber-300">
              Attribution flows through the LeadSquared Meta connector. Confirm the 4 hidden field mappings: utm_source, utm_medium, utm_campaign, and utm_content.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900/90 border border-gray-700/80 p-3 rounded-lg space-y-1">
            <div className="flex justify-between items-center text-gray-400 font-semibold text-[11px]">
              <span>META URL PARAMETERS (Tracking Template)</span>
              <span className="text-gray-400">Bulk edit at AD level</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-gray-300 font-mono text-[11px] break-all leading-relaxed bg-black/40 p-2 rounded w-full">
                {naming.trackingTemplate}
              </p>
              <button
                onClick={() => handleCopy(naming.trackingTemplate, 'utm')}
                className="p-1 text-gray-400 hover:text-white flex-shrink-0"
              >
                {copiedKey === 'utm' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Pre-Launch Checklist */}
      <div className="bg-gray-900/90 border border-gray-700/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Interactive Pre-Launch Checklist
          </h4>
          <span className="text-[11px] text-gray-400">
            {Object.values(checkedItems).filter(Boolean).length}/{PRE_LAUNCH_CHECKS.length} Complete
          </span>
        </div>

        <div className="space-y-1.5">
          {PRE_LAUNCH_CHECKS.map((check, idx) => {
            const isChecked = !!checkedItems[idx];
            const isCritical = idx >= 9;

            return (
              <label
                key={idx}
                className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition text-[11px] ${
                  isChecked ? 'bg-green-950/20 text-gray-300' : isCritical ? 'bg-amber-950/20 text-amber-200 font-semibold' : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheck(idx)}
                  className="mt-0.5 accent-dn-gold"
                />
                <span className={isChecked ? 'line-through opacity-70' : ''}>{check}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NamingPanel;
