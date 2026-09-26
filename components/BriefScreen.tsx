import React from 'react';
import {
  CampaignBrief,
  Angle,
  Segment,
  Offer,
  CampaignType,
  CampaignObjective,
  TargetingType,
  RefImage,
  ImageRole,
  MasterRatio,
} from '../types';
import { TAXONOMY, PRODUCT_LABELS, GEO_LABELS, TARGETING_LABELS, OBJECTIVE_LABELS } from '../constants/taxonomy';
import { ANGLE_PRESETS } from '../constants/angles';
import { SEGMENT_PRESETS } from '../constants/segments';
import { COURSE_FACTS, getCourseByCode } from '../constants/courseFacts';
import { COMPETITOR_PATTERNS } from '../constants/competitorPatterns';
import {
  Sparkles,
  Layers,
  FileCheck,
  AlertTriangle,
  Upload,
  BookOpen,
  Info,
  CheckCircle2,
  Trash2,
  HelpCircle,
} from 'lucide-react';

interface BriefScreenProps {
  brief: CampaignBrief;
  onChangeBrief: (updated: CampaignBrief) => void;
  masterRatio: MasterRatio;
  onChangeMasterRatio: (ratio: MasterRatio) => void;
  onStartGenerating: () => void;
  isGenerating: boolean;
  onOpenMcpBridge: () => void;
}

export const BriefScreen: React.FC<BriefScreenProps> = ({
  brief,
  onChangeBrief,
  masterRatio,
  onChangeMasterRatio,
  onStartGenerating,
  isGenerating,
  onOpenMcpBridge,
}) => {
  const activeAngle = ANGLE_PRESETS[brief.angle];
  const activeSegment = SEGMENT_PRESETS[brief.segment];
  const course = brief.course;

  const handleProductChange = (prodCode: string) => {
    const matchedCourse = getCourseByCode(prodCode);
    onChangeBrief({
      ...brief,
      product: prodCode,
      course: matchedCourse || {
        courseCode: prodCode,
        courseName: PRODUCT_LABELS[prodCode] || prodCode,
        segment: brief.segment,
        facultyNames: [],
        curriculumHighlights: [],
        approvedClaims: [{ claim: '55+ Years Jaypee Medical Publishing', conflict: false }],
        cautions: [],
      },
    });
  };

  const handleAddRefImage = (e: React.ChangeEvent<HTMLInputElement>, role: ImageRole) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newRef: RefImage = {
        id: `ref_${Date.now()}`,
        name: file.name,
        base64,
        mimeType: file.type || 'image/jpeg',
        role,
      };
      onChangeBrief({
        ...brief,
        references: [...(brief.references || []), newRef],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveRefImage = (id: string) => {
    onChangeBrief({
      ...brief,
      references: (brief.references || []).filter((r) => r.id !== id),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-dn-navy-deep via-dn-navy to-dn-navy-deep border border-gray-700/60 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-dn-gold/15 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-dn-gold text-dn-navy-deep uppercase tracking-wider">
                Production Line v2.0
              </span>
              <span className="text-xs text-gray-300">Jaypee Medical Education</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Start with the brief
            </h1>
            <p className="text-sm text-gray-300 mt-1 max-w-2xl">
              Pick the course, angle and offer. You get 3 finished ads in proven DigiNerve layouts (logo, headline, faculty, approved proof, CTA), plus Meta copy and compliant names, ready to export for Meta and Google.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenMcpBridge}
                className="px-4 py-2.5 text-xs font-semibold bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-lg flex items-center gap-2 transition"
                title="View & copy prompt for external MCP tools"
              >
                <Layers className="w-4 h-4 text-dn-gold" />
                <span>OpenArt Prompt</span>
              </button>
              <button
                onClick={onStartGenerating}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep font-bold rounded-lg shadow-lg flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGenerating
                    ? 'Generating Variants...'
                    : brief.references && brief.references.length > 0
                    ? `Generate 3 Variants from ${brief.references.length} Uploaded Creative${brief.references.length > 1 ? 's' : ''}`
                    : 'Generate 3 Variants'}
                </span>
              </button>
            </div>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {brief.references && brief.references.length > 0
                ? `${brief.references.length} Uploaded creative${brief.references.length > 1 ? 's' : ''} will be adapted into ad variants`
                : 'Free Tier: Gemini 3.8 Flash Copy + Branded Visual Layouts'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Brief Configuration & Live Grounding Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Campaign Hierarchy */}
          <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-dn-navy text-dn-gold flex items-center justify-center text-xs font-bold">1</span>
                Campaign Hierarchy & Product
              </h2>
              <span className="text-xs text-gray-400">Taxonomy Standard v1.0</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Brand</label>
                <select
                  value={brief.brand}
                  onChange={(e) => onChangeBrief({ ...brief, brand: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.BRAND.map((b) => (
                    <option key={b} value={b}>{b} — {b === 'DN' ? 'DigiNerve' : b === 'JP' ? 'Jaypee Brothers' : 'Ras'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Campaign Type</label>
                <select
                  value={brief.type}
                  onChange={(e) => onChangeBrief({ ...brief, type: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.TYPE.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Platform</label>
                <select
                  value={brief.platform}
                  onChange={(e) => onChangeBrief({ ...brief, platform: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.PLATFORM.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Campaign Objective</label>
                <select
                  value={brief.objective}
                  onChange={(e) => onChangeBrief({ ...brief, objective: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.OBJECTIVE.map((obj) => (
                    <option key={obj} value={obj}>{obj} ({OBJECTIVE_LABELS[obj] || obj})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Buyer Segment</label>
                <select
                  value={brief.segment}
                  onChange={(e) => onChangeBrief({ ...brief, segment: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.SEGMENT.map((seg) => (
                    <option key={seg} value={seg}>{seg} — {SEGMENT_PRESETS[seg]?.name || seg}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Selection with Auto-load */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Medical Course / Product (Auto-loads Factual Library)
              </label>
              <select
                value={brief.product}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-medium focus:border-dn-gold focus:outline-none"
              >
                {TAXONOMY.PRODUCT.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod} — {PRODUCT_LABELS[prod] || prod}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Targeting</label>
                <select
                  value={brief.targeting}
                  onChange={(e) => onChangeBrief({ ...brief, targeting: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.TARGETING.map((tar) => (
                    <option key={tar} value={tar}>{tar} ({TARGETING_LABELS[tar] || tar})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Geo Location</label>
                <select
                  value={brief.geo}
                  onChange={(e) => onChangeBrief({ ...brief, geo: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.GEO.map((g) => (
                    <option key={g} value={g}>{g} — {GEO_LABELS[g] || g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Launch Date (DDMMYY)</label>
                <input
                  type="text"
                  value={brief.launchDate}
                  onChange={(e) => onChangeBrief({ ...brief, launchDate: e.target.value.toUpperCase() })}
                  maxLength={6}
                  placeholder="220926"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Creative Angle & Offer */}
          <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-dn-navy text-dn-gold flex items-center justify-center text-xs font-bold">2</span>
                Creative Angle & Offer
              </h2>
              <span className="text-xs text-dn-gold font-medium">{activeAngle?.funnelStage.toUpperCase()} FUNNEL</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Creative Angle Preset</label>
                <select
                  value={brief.angle}
                  onChange={(e) => onChangeBrief({ ...brief, angle: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-medium focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.ANGLE.map((ang) => (
                    <option key={ang} value={ang}>
                      {ang} — {ANGLE_PRESETS[ang]?.name || ang}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">{activeAngle?.description}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Offer Tier</label>
                <select
                  value={brief.offer}
                  onChange={(e) => onChangeBrief({ ...brief, offer: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-dn-gold focus:outline-none"
                >
                  {TAXONOMY.OFFER.map((off) => (
                    <option key={off} value={off}>{off}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Rendered as high-contrast badge in vector layer</p>
              </div>
            </div>

            {/* Master Ratio Selection */}
            <div className="pt-2 border-t border-gray-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-300 block">Master Generation Ratio</span>
                <span className="text-xs text-gray-400">
                  {masterRatio === '3:4' ? '3:4 (Derives 4:5 Feed & 1:1 Square)' : '9:16 (Native Story/Reel)'}
                </span>
              </div>
              <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
                <button
                  type="button"
                  onClick={() => onChangeMasterRatio('3:4')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${masterRatio === '3:4' ? 'bg-dn-navy text-dn-gold border border-dn-gold/30' : 'text-gray-400 hover:text-white'}`}
                >
                  3:4 (Feed Master)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMasterRatio('9:16')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${masterRatio === '9:16' ? 'bg-dn-navy text-dn-gold border border-dn-gold/30' : 'text-gray-400 hover:text-white'}`}
                >
                  9:16 (Story Master)
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Level 5 High-Priority Instructions */}
          <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-dn-navy text-dn-gold flex items-center justify-center text-xs font-bold">3</span>
                Level 5: High-Priority Instructions
              </h2>
              <span className="text-xs text-dn-gold">Overrides all defaults</span>
            </div>
            <textarea
              rows={3}
              value={brief.userNotes || ''}
              onChange={(e) => onChangeBrief({ ...brief, userNotes: e.target.value })}
              placeholder="e.g. Focus on pediatric emergency resuscitation setting. Emphasize Dr. Piyush Gupta residency clinical module. Use warm corridor key light."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-dn-gold focus:outline-none"
            />
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-gray-400" />
              Cannot override the Absolute Text Prohibition or Brand Lock likeness rule.
            </p>
          </div>

          {/* Section 4: Positional Reference Assets by Role */}
          <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-dn-navy text-dn-gold flex items-center justify-center text-xs font-bold">4</span>
                Reference Assets by Role
              </h2>
              <span className="text-xs text-gray-400">Positional image-role contract</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Brand Lock */}
              <label className="border border-dashed border-blue-500/50 hover:border-blue-400 bg-blue-950/20 hover:bg-blue-950/40 p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer text-center transition">
                <Upload className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-xs font-bold text-blue-200">1. Brand Lock</span>
                <span className="text-[10px] text-gray-400">100% likeness (Faculty/UI)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAddRefImage(e, 'brandLock')}
                  className="hidden"
                />
              </label>

              {/* House Reference */}
              <label className="border border-dashed border-dn-gold/50 hover:border-dn-gold bg-amber-950/20 hover:bg-amber-950/40 p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer text-center transition">
                <Upload className="w-5 h-5 text-dn-gold mb-1" />
                <span className="text-xs font-bold text-amber-200">2. House Reference</span>
                <span className="text-[10px] text-gray-400">DigiNerve proven winners</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAddRefImage(e, 'houseReference')}
                  className="hidden"
                />
              </label>

              {/* Competitor Reference */}
              <label className="border border-dashed border-gray-600 hover:border-gray-500 bg-gray-900/50 hover:bg-gray-900 p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer text-center transition">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs font-bold text-gray-300">3. Competitor Ref</span>
                <span className="text-[10px] text-gray-400">Structure only (No text/claims)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAddRefImage(e, 'competitorReference')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded References List */}
            {brief.references && brief.references.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Attached Creatives ({brief.references.length}) · Ready to generate new variants
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {brief.references.map((ref) => (
                    <div
                      key={ref.id}
                      className="flex items-center justify-between p-2 bg-gray-900/80 border border-gray-700 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img src={ref.base64} alt={ref.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        <div className="truncate">
                          <p className="text-gray-200 font-medium truncate">{ref.name}</p>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded ${
                              ref.role === 'brandLock'
                                ? 'bg-blue-900 text-blue-300'
                                : ref.role === 'houseReference'
                                ? 'bg-amber-900 text-amber-300'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {ref.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveRefImage(ref.id)}
                        className="text-gray-400 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grounded Fact Library & Competitor Pattern Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Grounded Facts Card */}
          <div className="bg-gray-800/80 border border-dn-navy rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-dn-gold" />
                <h3 className="text-sm font-bold text-white">Course Fact Grounding</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-dn-navy text-blue-200 font-mono">
                {course?.courseCode}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block">Catalog Name:</span>
                <p className="text-white font-medium">{course?.courseName}</p>
              </div>

              {course?.priceCurrent && (
                <div>
                  <span className="text-gray-400 block">List Price (Verified):</span>
                  <p className="text-dn-gold font-bold text-sm">{course.priceCurrent}</p>
                </div>
              )}

              {/* Chief Editor Caution */}
              {course?.chiefEditor && (
                <div
                  className={`p-2.5 rounded-lg border ${
                    course.chiefEditor.conflict
                      ? 'bg-red-950/30 border-red-800 text-red-200'
                      : 'bg-gray-900 border-gray-700 text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {course.chiefEditor.conflict ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    )}
                    <span>Chief Editor: {course.chiefEditor.name}</span>
                  </div>
                  {course.chiefEditor.conflictDetail && (
                    <p className="text-[11px] text-red-300">{course.chiefEditor.conflictDetail}</p>
                  )}
                </div>
              )}

              {/* Approved Claims */}
              <div>
                <span className="text-gray-400 block mb-1 font-semibold">
                  Approved Numeric Claims ({course?.approvedClaims?.length || 0}):
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {course?.approvedClaims?.map((claim, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border text-[11px] flex items-start gap-2 ${
                        claim.conflict
                          ? 'bg-red-900/20 border-red-800 text-red-200 line-through opacity-60'
                          : 'bg-gray-900 border-gray-700/80 text-gray-200'
                      }`}
                      title={claim.locator || claim.sourceFile}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${claim.conflict ? 'text-red-400' : 'text-dn-gold'}`} />
                      <div className="flex-1">
                        <span className="font-semibold">{claim.claim}</span>
                        {claim.locator && <span className="text-gray-400 block text-[10px]">{claim.locator}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Cautions */}
              {course?.cautions && course.cautions.length > 0 && (
                <div className="pt-2 border-t border-gray-700">
                  <span className="text-amber-400 font-semibold block mb-1">Course Cautions:</span>
                  <ul className="list-disc pl-4 space-y-1 text-gray-300 text-[11px]">
                    {course.cautions.slice(0, 3).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Competitor Evidence / Angle Motif Card */}
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 shadow-lg space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-700 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-green-400" />
                Competitor Pattern Evidence
              </h3>
              <span className="text-[10px] text-gray-400">151 Meta Ad Audit</span>
            </div>

            {activeAngle && activeAngle.referenceMotifIds.length > 0 ? (
              <div className="space-y-2">
                {activeAngle.referenceMotifIds.map((mId) => {
                  const motif = COMPETITOR_PATTERNS.motifs.find((m) => m.id === mId);
                  if (!motif) return null;
                  return (
                    <div key={mId} className="bg-gray-900/90 border border-gray-700 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-dn-gold text-xs">{motif.label}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-950 text-green-300">
                          {motif.evidence.strength}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[11px] leading-relaxed">{motif.whyItWorks}</p>
                      <div className="bg-dn-navy-deep/80 p-2 rounded text-[11px] border border-blue-900/50">
                        <span className="text-blue-300 font-semibold block">DigiNerve Adaptation:</span>
                        <p className="text-gray-300">{motif.diginerveAdaptation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 italic">
                Direct conversion angle. Focus on clean negative space and strict factual authority.
              </p>
            )}

            <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-700/60 space-y-1 text-[11px]">
              <span className="font-semibold text-gray-300 block">Universal Long-Runner Rule:</span>
              <p className="text-gray-400">
                One dominant promise readable without opening caption. Proof is concrete (never vague). Placement variants reuse same message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefScreen;
