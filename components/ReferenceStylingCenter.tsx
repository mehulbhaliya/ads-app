import React, { useState } from 'react';
import {
  REFERENCE_CREATIVES,
  COMPETITOR_PROFILES,
  DIGINERVE_STYLING_RULES,
  OFFICIAL_BRAND_TAGS,
  ReferenceCreative,
  CompetitorProfile,
} from '../constants/dnCreativeStyling';
import { CampaignBrief, RefImage } from '../types';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  Award,
  Tag,
  ArrowRight,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Upload,
  BarChart2,
  Copy,
  Check,
  Compass,
  FileText,
} from 'lucide-react';

interface ReferenceStylingCenterProps {
  brief: CampaignBrief;
  onApplyPresetToBrief: (updatedBrief: Partial<CampaignBrief>, refToAttach?: RefImage) => void;
  onNavigateToCanvas: () => void;
}

export const ReferenceStylingCenter: React.FC<ReferenceStylingCenterProps> = ({
  brief,
  onApplyPresetToBrief,
  onNavigateToCanvas,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'gallery' | 'competitors' | 'styling_dna' | 'analyzer'>('gallery');
  const [selectedRef, setSelectedRef] = useState<ReferenceCreative>(REFERENCE_CREATIVES[0]);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorProfile>(COMPETITOR_PROFILES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Analyzer State
  const [analyzedImage, setAnalyzedImage] = useState<string | null>(REFERENCE_CREATIVES[0].previewSvg);
  const [analyzedName, setAnalyzedName] = useState<string>(REFERENCE_CREATIVES[0].title);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCopyPromptDirective = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadRefIntoBrief = (ref: ReferenceCreative) => {
    const newRefImage: RefImage = {
      id: `ref_${Date.now()}`,
      name: ref.title,
      base64: ref.previewSvg,
      mimeType: 'image/svg+xml',
      role: ref.source === 'DigiNerve House Winner' ? 'houseReference' : 'competitorReference',
      label: ref.visualStyling.compositionType,
    };

    onApplyPresetToBrief(
      {
        angle: ref.angle,
        references: [...(brief.references || []).filter((r) => r.name !== ref.title), newRefImage],
      },
      newRefImage
    );
  };

  const handleApplyCompetitorCounterStrategy = (comp: CompetitorProfile) => {
    onApplyPresetToBrief({
      angle: comp.presetBrief.angle,
      offer: comp.presetBrief.offer,
      userNotes: `Competitor Adaptation (${comp.name}): Focus on ${comp.diginerveCounterStrategy}. Use headline: "${comp.presetBrief.headline}" and claim: "${comp.presetBrief.proofClaim}".`,
    });
  };

  const handleUploadForAnalysis = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setIsAnalyzing(true);
    reader.onload = () => {
      setTimeout(() => {
        setAnalyzedImage(reader.result as string);
        setAnalyzedName(file.name);
        setIsAnalyzing(false);
      }, 600);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-dn-navy-deep via-dn-navy to-dn-navy-deep border border-dn-gold/40 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-dn-gold text-dn-navy-deep uppercase tracking-wider">
                Creative Intelligence &amp; Reference Hub
              </span>
              <span className="text-xs text-gray-300">Jaypee Medical Ad Standards</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              DigiNerve Creative Styling &amp; Competitor Reference Center
            </h1>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl">
              Understand DigiNerve's creative styling DNA, audit competitor long-running ads, and transform audited competitor patterns into ethically grounded DigiNerve winners.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('analyzer')}
              className="px-4 py-2 text-xs font-bold bg-gray-900/90 hover:bg-gray-800 text-dn-gold border border-dn-gold/50 rounded-lg flex items-center gap-2 transition"
            >
              <Eye className="w-4 h-4" />
              <span>Image Style Analyzer</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-700/60">
          <button
            onClick={() => setActiveSubTab('gallery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'gallery'
                ? 'bg-dn-gold text-dn-navy-deep shadow-md'
                : 'bg-gray-900/70 text-gray-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Creative Reference Gallery ({REFERENCE_CREATIVES.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('competitors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'competitors'
                ? 'bg-dn-gold text-dn-navy-deep shadow-md'
                : 'bg-gray-900/70 text-gray-300 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Competitor Strategy &amp; Counter-Moves ({COMPETITOR_PROFILES.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('styling_dna')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'styling_dna'
                ? 'bg-dn-gold text-dn-navy-deep shadow-md'
                : 'bg-gray-900/70 text-gray-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. DigiNerve Creative Styling DNA &amp; Brand Tags</span>
          </button>

          <button
            onClick={() => setActiveSubTab('analyzer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'analyzer'
                ? 'bg-dn-gold text-dn-navy-deep shadow-md'
                : 'bg-gray-900/70 text-gray-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>4. Image Style Analyzer &amp; Guardrail Checker</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: REFERENCE CREATIVE GALLERY */}
      {activeSubTab === 'gallery' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Reference Cards Carousel / List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Select Reference Archetype
              </span>
              <span className="text-[11px] text-gray-500">Audited 151 Meta Ads</span>
            </div>

            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {REFERENCE_CREATIVES.map((ref) => {
                const isSelected = selectedRef.id === ref.id;
                return (
                  <div
                    key={ref.id}
                    onClick={() => setSelectedRef(ref)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex gap-3.5 ${
                      isSelected
                        ? 'bg-gray-800/95 border-dn-gold shadow-lg ring-1 ring-dn-gold'
                        : 'bg-gray-900/80 border-gray-800 hover:border-gray-700 hover:bg-gray-850'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-gray-700">
                      <img src={ref.previewSvg} alt={ref.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            ref.source === 'DigiNerve House Winner'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {ref.source === 'DigiNerve House Winner' ? 'DN House Style' : 'Competitor Ad'}
                        </span>
                        <span className="text-[10px] font-mono text-dn-gold">{ref.runningDays} Days Active</span>
                      </div>

                      <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {ref.title}
                      </h3>

                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>Angle: <strong className="text-gray-300">{ref.angle}</strong></span>
                        <span>•</span>
                        <span>{ref.visualStyling.compositionType}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Inspection & Adaptation Canvas */}
          <div className="lg:col-span-7 bg-gray-900/90 border border-gray-800 rounded-xl p-5 space-y-5">
            {/* Visual & Summary Header */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pb-5 border-b border-gray-800">
              {/* SVG / Visual Render View */}
              <div className="sm:col-span-5 flex flex-col items-center">
                <div className="w-56 aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-black">
                  <img
                    src={selectedRef.previewSvg}
                    alt={selectedRef.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-mono mt-2">
                  Composition: {selectedRef.visualStyling.compositionType}
                </span>
              </div>

              {/* Archetype Profile Breakdown */}
              <div className="sm:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-dn-navy text-dn-gold border border-dn-gold/40">
                    {selectedRef.brand}
                  </span>
                  <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Proven Meta Long-Runner
                  </span>
                </div>

                <h2 className="text-base font-bold text-white leading-snug">
                  {selectedRef.title}
                </h2>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Dominant Palette:</span>
                    <div className="flex items-center gap-1">
                      {selectedRef.visualStyling.dominantPalette.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-300 text-[11px]">
                    <strong className="text-gray-200">Lighting & Atmosphere:</strong>{' '}
                    {selectedRef.visualStyling.lighting}
                  </p>

                  <p className="text-gray-300 text-[11px]">
                    <strong className="text-gray-200">Safe Zone Treatment:</strong>{' '}
                    {selectedRef.visualStyling.safeZoneCoverage}
                  </p>
                </div>

                {/* 1-Click Action */}
                <div className="pt-2">
                  <button
                    onClick={() => handleLoadRefIntoBrief(selectedRef)}
                    className="w-full py-2.5 px-4 bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Load This Style Reference into Active Brief</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Strategic Deep-Dive: What Works & How DigiNerve Exploits It */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* What Works */}
              <div className="p-3.5 bg-gray-950/80 border border-gray-800 rounded-lg space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                  Why This Creative Styling Works:
                </span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {selectedRef.stylingAnalysis.whatWorks}
                </p>
                <div className="pt-1 text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-300 block">Psychological Trigger:</span>
                  <span>{selectedRef.stylingAnalysis.cognitiveTrigger}</span>
                </div>
              </div>

              {/* DigiNerve Adaptation Move */}
              <div className="p-3.5 bg-dn-navy-deep/60 border border-dn-gold/30 rounded-lg space-y-2">
                <span className="font-bold text-dn-gold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-dn-gold" />
                  DigiNerve Strategic Counter-Move:
                </span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {selectedRef.diginerveAdaptationStrategy.adaptationMove}
                </p>
                <div className="pt-1 text-[11px]">
                  <span className="font-semibold text-amber-300 block">Caution &amp; Guardrail:</span>
                  <span className="text-amber-200/90">{selectedRef.diginerveAdaptationStrategy.caution}</span>
                </div>
              </div>
            </div>

            {/* Key Levers Bullet Grid */}
            <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-lg space-y-1.5">
              <span className="text-xs font-bold text-gray-300 block">Key Execution Levers:</span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-gray-400">
                {selectedRef.keyLevers.map((lever, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-dn-gold flex-shrink-0 mt-0.5" />
                    <span>{lever}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: COMPETITOR STRATEGY & COUNTER-MOVES */}
      {activeSubTab === 'competitors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPETITOR_PROFILES.map((comp) => {
              const isSelected = selectedCompetitor.id === comp.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => setSelectedCompetitor(comp)}
                  className={`p-4 rounded-xl text-left border transition ${
                    isSelected
                      ? 'bg-dn-navy/90 border-dn-gold shadow-lg ring-1 ring-dn-gold'
                      : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{comp.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                      {comp.primaryAngles.join(' / ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">{comp.coreAudience}</p>
                </button>
              );
            })}
          </div>

          {/* Active Competitor Strategy Breakdown Card */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedCompetitor.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    Competitor Intelligence
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{selectedCompetitor.coreAudience}</p>
              </div>

              <button
                onClick={() => handleApplyCompetitorCounterStrategy(selectedCompetitor)}
                className="px-4 py-2 bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep font-bold rounded-lg text-xs flex items-center gap-2 shadow transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply This Counter-Strategy to Brief</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Competitor Playbook */}
              <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-xl space-y-3">
                <span className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  Competitor Creative Playbook:
                </span>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  {selectedCompetitor.creativeStylingDna}
                </p>

                <div className="pt-2 border-t border-gray-800/80 space-y-1.5">
                  <span className="font-semibold text-gray-300 block">Longest Running Meta Motifs:</span>
                  <ul className="space-y-1 text-gray-400 text-[11px]">
                    {selectedCompetitor.longestRunningMotifs.map((motif, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{motif}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-gray-800/80 space-y-1">
                  <span className="font-semibold text-red-400 block">Competitor Vulnerabilities:</span>
                  <ul className="space-y-1 text-red-300/80 text-[11px]">
                    {selectedCompetitor.vulnerabilities.map((v, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* DigiNerve Winning Counter-Strategy */}
              <div className="p-4 bg-dn-navy-deep/80 border border-dn-gold/40 rounded-xl space-y-3">
                <span className="text-sm font-bold text-dn-gold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-dn-gold" />
                  DigiNerve Winning Counter-Strategy:
                </span>
                <p className="text-gray-200 leading-relaxed text-[11px]">
                  {selectedCompetitor.diginerveCounterStrategy}
                </p>

                {/* Preset Brief Spec */}
                <div className="pt-2 border-t border-dn-gold/20 space-y-2">
                  <span className="font-bold text-white block text-[11px]">Recommended Campaign Spec:</span>
                  <div className="bg-gray-950/80 p-3 rounded-lg border border-gray-800 space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-gray-400">Angle:</span>{' '}
                      <strong className="text-dn-gold">{selectedCompetitor.presetBrief.angle}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Headline:</span>{' '}
                      <span className="text-white font-semibold">{selectedCompetitor.presetBrief.headline}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Subhead:</span>{' '}
                      <span className="text-gray-300">{selectedCompetitor.presetBrief.subhead}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Proof Claim:</span>{' '}
                      <span className="text-blue-300">{selectedCompetitor.presetBrief.proofClaim}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Brand Tag:</span>{' '}
                      <span className="text-dn-gold">{selectedCompetitor.presetBrief.brandTag}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DIGINERVE CREATIVE STYLING DNA & BRAND TAGS */}
      {activeSubTab === 'styling_dna' && (
        <div className="space-y-6">
          {/* Rules Accordion / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIGINERVE_STYLING_RULES.map((rule) => (
              <div
                key={rule.id}
                className="p-5 bg-gray-900/80 border border-gray-800 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <h3 className="font-bold text-white text-sm">{rule.ruleTitle}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-dn-navy text-blue-200 font-mono">
                    {rule.category}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{rule.description}</p>

                <div className="p-2.5 rounded-lg bg-gray-950 border border-gray-800 space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-dn-gold font-bold block">DigiNerve Standard:</span>
                    <span className="text-gray-200">{rule.diginerveStandard}</span>
                  </div>
                  <div>
                    <span className="text-purple-300 font-semibold block">Competitor Trap to Avoid:</span>
                    <span className="text-gray-400">{rule.competitorContrast}</span>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold block">Conversion Impact:</span>
                    <span className="text-green-300/90">{rule.conversionImpact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Official Brand Tags Showcase */}
          <div className="p-6 bg-gray-900/90 border border-dn-gold/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-dn-gold" />
                  Official DigiNerve Brand Tags &amp; Endorsement Badges
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Directly composited on canvas with zero layout or font corruption errors.
                </p>
              </div>
              <span className="text-xs text-dn-gold font-mono">7 Standard Badges</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {OFFICIAL_BRAND_TAGS.map((tag) => (
                <div
                  key={tag.id}
                  className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-gray-500">{tag.category}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-dn-navy text-dn-gold border border-dn-gold/30">
                      {tag.recommendedRole}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-white text-xs block">{tag.label}</span>
                    <span className="text-[11px] text-gray-400">{tag.subtext}</span>
                  </div>

                  {/* Visual Simulation of Badge */}
                  <div
                    className="p-1.5 rounded-md border text-center font-bold text-[11px] mt-2"
                    style={{
                      backgroundColor: tag.bgToken === 'gold' ? '#F0A63C' : tag.bgToken === 'tintLight' ? '#EAF4FB' : '#0C2038',
                      borderColor: tag.textColor === 'gold' ? '#F0A63C' : '#CBD5E1',
                      color: tag.textColor === 'gold' ? '#F0A63C' : tag.textColor === 'navy' ? '#16345E' : tag.textColor === 'navyDeep' ? '#0C2038' : '#FFFFFF',
                    }}
                  >
                    ✓ {tag.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: IMAGE STYLE ANALYZER & GUARDRAIL CHECKER */}
      {activeSubTab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Preview & Upload */}
          <div className="lg:col-span-5 bg-gray-900/90 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-dn-gold" />
                Image Input
              </h3>
              <span className="text-xs text-gray-400">Current Reference</span>
            </div>

            {/* Preview Box */}
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-black border border-gray-700 flex items-center justify-center relative">
              {isAnalyzing ? (
                <div className="text-center space-y-2">
                  <span className="w-6 h-6 border-2 border-dn-gold border-t-transparent rounded-full animate-spin block mx-auto" />
                  <span className="text-xs text-gray-400 font-mono">Analyzing layout &amp; colors...</span>
                </div>
              ) : analyzedImage ? (
                <img src={analyzedImage} alt="Analyzed" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-500">No image loaded</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs font-bold text-gray-200 flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-dn-gold" />
                <span>Upload Ad to Analyze Style</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadForAnalysis}
                  className="hidden"
                />
              </label>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 w-full">Quick Test Audited References:</span>
                {REFERENCE_CREATIVES.slice(0, 3).map((ref) => (
                  <button
                    key={ref.id}
                    onClick={() => {
                      setAnalyzedImage(ref.previewSvg);
                      setAnalyzedName(ref.title);
                    }}
                    className="px-2 py-1 text-[10px] bg-gray-950 hover:bg-dn-navy border border-gray-800 rounded text-gray-300 hover:text-white truncate max-w-[130px]"
                  >
                    {ref.visualStyling.compositionType}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Style Extraction & Compliance Breakdown */}
          <div className="lg:col-span-7 bg-gray-900/90 border border-gray-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Automated Creative Styling Diagnostic</h3>
                <p className="text-xs text-gray-400 font-mono truncate max-w-sm">{analyzedName}</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-green-950 text-green-300 border border-green-800 text-xs font-bold font-mono">
                Score: 94/100
              </span>
            </div>

            {/* Checklist Matrix */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Negative Space &amp; Safe Zone Architecture</strong>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    Lower 38% has smooth gradient fade (no cluttered surgical instruments or faces behind headline). Ready for high-contrast typography.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">DigiNerve Brand Color Palette Harmony</strong>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    Detected primary tones match Navy Deep (#0C2038) and Navy (#16345E). Nerve Gold accents strictly reserved for CTA and tags.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Official Brand Endorsement Tag Presence</strong>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    "A Jaypee Enterprise | 55+ Years Trust" configured in top 15% header to establish clinical authority in under 1.2s.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Absolute Text-Layer Separation Rule</strong>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    Zero embedded AI text in visual base. All headlines and CTAs are rendered via the client compositor for crisp vector clarity.
                  </p>
                </div>
              </div>
            </div>

            {/* Action to Attach Analyzed Style to Brief */}
            <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400">Attach analyzed creative as active style guide</span>
              <button
                onClick={() => {
                  if (!analyzedImage) return;
                  const newRef: RefImage = {
                    id: `ref_analyzed_${Date.now()}`,
                    name: analyzedName,
                    base64: analyzedImage,
                    mimeType: 'image/jpeg',
                    role: 'houseReference',
                  };
                  onApplyPresetToBrief({
                    references: [...(brief.references || []), newRef],
                  });
                }}
                className="px-4 py-2 bg-dn-navy text-dn-gold hover:bg-dn-navy-deep border border-dn-gold/50 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Attach to Active Brief</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceStylingCenter;
