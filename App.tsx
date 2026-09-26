import React, { useState, useEffect } from 'react';
import { CampaignBrief, GeneratedCreative, MasterRatio, MetaAdCopy, LearningStore } from './types';
import { COURSE_FACTS } from './constants/courseFacts';
import { Angle } from './types';
import { generateCreativeVariants } from './services/geminiImage';
import { generateMetaCopy } from './services/geminiCopy';
import {
  loadLearningStore,
  saveLearningStore,
  loadCreatives,
  saveCreatives,
  recordFeedback,
  initStorage,
} from './services/learning';
import { AdContent, TemplateId, TEMPLATE_META, buildDefaultContent, defaultTemplateForAngle } from './services/adContent';
import { BriefScreen } from './components/BriefScreen';
import { AdStudio } from './components/AdStudio';
import { VariantGrid } from './components/VariantGrid';
import { CopyPanel } from './components/CopyPanel';
import { NamingPanel } from './components/NamingPanel';
import { PerformanceImport } from './components/PerformanceImport';
import { LearningLibraryView } from './components/LearningLibraryView';
import { McpPromptBridge } from './components/McpPromptBridge';
import { FeedbackModal } from './components/FeedbackModal';
import { GeminiKeyChip } from './components/GeminiKeyChip';
import { Sparkles, Palette, FileText, Tag, Award, ClipboardList, Check, ArrowRight } from 'lucide-react';

type StudioTab = 'brief' | 'canvas' | 'copy' | 'naming' | 'learning';

const LOGO_STORAGE_KEY = 'diginerve_custom_logo_v1';

// Today's date as DDMMYY / MMYY for the naming convention.
const TODAY = new Date();
const DD = String(TODAY.getDate()).padStart(2, '0');
const MM = String(TODAY.getMonth() + 1).padStart(2, '0');
const YY = String(TODAY.getFullYear()).slice(-2);

const INITIAL_BRIEF: CampaignBrief = {
  brand: 'DN',
  type: 'SALES',
  platform: 'META',
  objective: 'LP',
  segment: 'PG',
  product: 'OBGMD',
  geo: 'IN',
  targeting: 'INT',
  audience: 'OBGYN-RESIDENTS',
  launchMonth: `${MM}${YY}`,
  launchDate: `${DD}${MM}${YY}`,
  angle: Angle.Faculty,
  // Playbook r7: cold creatives lead with one idea, not a coupon.
  offer: 'NOOFFER',
  course: COURSE_FACTS[0], // OBGYN MD
  references: [],
  userNotes: '',
};

/** Variant 1 uses the layout that fits the angle; variants 2+ try other proven layouts. */
function templatesForVariants(angle: Angle, count: number): TemplateId[] {
  const first = defaultTemplateForAngle(angle);
  const rest = (Object.keys(TEMPLATE_META) as TemplateId[]).filter((t) => t !== first);
  return Array.from({ length: count }, (_, i) => [first, ...rest][i % 4]);
}

const STEPS: { id: StudioTab; label: string; icon: React.ReactNode }[] = [
  { id: 'brief', label: 'Brief', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { id: 'canvas', label: 'Design & Export', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'copy', label: 'Meta Copy', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'naming', label: 'Names & UTMs', icon: <Tag className="w-3.5 h-3.5" /> },
  { id: 'learning', label: 'Learning Loop', icon: <Award className="w-3.5 h-3.5" /> },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('brief');
  const [brief, setBrief] = useState<CampaignBrief>(INITIAL_BRIEF);
  const [masterRatio, setMasterRatio] = useState<MasterRatio>('3:4');
  const [logoSrc, setLogoSrc] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem(LOGO_STORAGE_KEY) || undefined;
    } catch {
      return undefined;
    }
  });

  // Creatives & Variants
  const [creatives, setCreatives] = useState<GeneratedCreative[]>([]);
  const [activeCreativeId, setActiveCreativeId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationError, setGenerationError] = useState<string>('');

  // Copy Options
  const [copyOptions, setCopyOptions] = useState<MetaAdCopy[]>([]);
  const [isLoadingCopy, setIsLoadingCopy] = useState(false);

  // Learning Store
  const [learningStore, setLearningStore] = useState<LearningStore>(loadLearningStore());

  // Modals
  const [mcpModalOpen, setMcpModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<'good' | 'bad' | null>(null);

  // Load persisted state on mount. No auto-generation: each image costs quota.
  useEffect(() => {
    const savedCreatives = loadCreatives();
    if (savedCreatives.length > 0) {
      setCreatives(savedCreatives);
      setActiveCreativeId(savedCreatives[0].id);
    }
    initStorage((syncedCreatives, syncedStore) => {
      if (syncedCreatives.length > 0) {
        setCreatives(syncedCreatives);
        setActiveCreativeId((prev) => (prev && syncedCreatives.some((c) => c.id === prev) ? prev : syncedCreatives[0].id));
      }
      if (syncedStore) setLearningStore(syncedStore);
    });
  }, []);

  const activeCreative = creatives.find((c) => c.id === activeCreativeId) || creatives[0];

  // Fill the copy tab on first visit so it is never an empty screen.
  useEffect(() => {
    if (activeTab === 'copy' && copyOptions.length === 0 && !isLoadingCopy) handleGenerateCopy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const activeBrief = activeCreative?.brief || brief;
  const activeContent: AdContent | undefined = activeCreative
    ? activeCreative.content || buildDefaultContent(activeCreative.brief)
    : undefined;

  const updateCreative = (id: string, patch: Partial<GeneratedCreative>) => {
    setCreatives((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      saveCreatives(next);
      return next;
    });
  };

  const handleGenerateVariants = async () => {
    setIsGenerating(true);
    setGenerationError('');
    setGenerationStatus('Assembling the brand prompt scaffold...');
    try {
      const templates = templatesForVariants(brief.angle, 3);
      const generated = await generateCreativeVariants(
        brief,
        3,
        masterRatio,
        (curr, tot, msg) => setGenerationStatus(`[${curr}/${tot}] ${msg}`),
        templates
      );
      const withContent = generated.map((c, i) => ({ ...c, content: buildDefaultContent(brief, templates[i]) }));
      setCreatives(withContent);
      const failed = withContent.filter((c) => c.generationError);
      if (failed.length > 0) {
        setGenerationError(
          `${failed.length} of ${withContent.length} AI visuals could not be generated, so a neutral placeholder photo is used. Reason: ${failed[0].generationError}`
        );
      }
      if (withContent.length > 0) {
        setActiveCreativeId(withContent[0].id);
        saveCreatives(withContent);
      }
      handleGenerateCopy(brief);
      setActiveTab('canvas');
    } catch (e: any) {
      console.error('Variant generation encountered an error:', e);
      setGenerationError(e?.message || 'Variant generation failed.');
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleGenerateCopy = async (forBrief?: CampaignBrief) => {
    setIsLoadingCopy(true);
    try {
      setCopyOptions(await generateMetaCopy(forBrief || activeCreative?.brief || brief));
    } catch (e) {
      console.error('Failed to generate copy:', e);
    } finally {
      setIsLoadingCopy(false);
    }
  };

  const handleChangeContent = (content: AdContent) => {
    if (activeCreative) updateCreative(activeCreative.id, { content });
  };

  const handlePushToCanvas = (headline: string, subhead: string) => {
    if (!activeCreative || !activeContent) return;
    handleChangeContent({ ...activeContent, hook: headline, hookAccent: '', tagline: subhead || activeContent.tagline });
    setActiveTab('canvas');
  };

  const handleChangeLogo = (dataUrl: string | undefined) => {
    setLogoSrc(dataUrl);
    try {
      if (dataUrl) localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
      else localStorage.removeItem(LOGO_STORAGE_KEY);
    } catch {
      // Too large for localStorage: keep for this session only.
    }
  };

  const handleOpenFeedback = (id: string, rating: 'good' | 'bad') => {
    setFeedbackTargetId(id);
    setFeedbackRating(rating);
    setFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = (notes: string) => {
    if (!feedbackTargetId || !feedbackRating) return;
    const { updatedCreative, store } = recordFeedback(feedbackTargetId, feedbackRating, notes);
    if (updatedCreative) {
      setCreatives((prev) => prev.map((c) => (c.id === updatedCreative.id ? { ...c, ...updatedCreative, content: c.content, facultyPhoto: c.facultyPhoto } : c)));
    }
    setLearningStore(store);
  };

  const handleImportMcpImage = (image: string) => {
    if (activeCreative) updateCreative(activeCreative.id, { base64: image, generationError: undefined });
  };

  const stepDone = (id: StudioTab) => (id === 'brief' ? creatives.length > 0 : false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      <header className="sticky top-0 z-40 bg-dn-navy-deep/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xl font-black tracking-tight leading-none">
              <span className="text-white">digi</span>
              <span className="text-dn-gold">nerve</span>
            </div>
            <div className="h-5 w-px bg-gray-700" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Ad Creative Studio</div>
              <div className="text-[10px] text-gray-400">Brief → on-brand ads → Meta & Google ready</div>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
          <GeminiKeyChip />
          <nav className="flex items-center gap-1 overflow-x-auto -mx-1 px-1" aria-label="Workflow steps">
            {STEPS.map((s, i) => {
              const active = activeTab === s.id;
              const disabled = s.id !== 'brief' && s.id !== 'learning' && creatives.length === 0;
              return (
                <React.Fragment key={s.id}>
                  {i > 0 && <ArrowRight className="w-3 h-3 text-gray-700 flex-shrink-0" />}
                  <button
                    onClick={() => !disabled && setActiveTab(s.id)}
                    disabled={disabled}
                    title={disabled ? 'Generate creatives from the brief first' : undefined}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                      active
                        ? 'bg-dn-gold text-dn-navy-deep border-dn-gold'
                        : disabled
                        ? 'text-gray-600 border-transparent cursor-not-allowed'
                        : 'text-gray-300 border-gray-800 hover:border-gray-600 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center ${
                        active ? 'bg-dn-navy-deep text-dn-gold' : stepDone(s.id) ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {stepDone(s.id) && !active ? <Check className="w-2.5 h-2.5" /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
          </div>
        </div>
      </header>

      {isGenerating && (
        <div className="bg-dn-navy text-dn-gold px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b border-dn-gold/30">
          <span className="w-3 h-3 rounded-full border-2 border-dn-gold border-t-transparent animate-spin" />
          <span>{generationStatus || 'Generating creative variants...'}</span>
        </div>
      )}

      {generationError && !isGenerating && (
        <div className="bg-amber-950/80 text-amber-100 px-4 py-2 text-xs flex items-center justify-center gap-3 border-b border-amber-800">
          <span>{generationError}</span>
          <button onClick={() => setGenerationError('')} className="underline text-amber-300 hover:text-white flex-shrink-0">
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6">
        {activeTab === 'brief' && (
          <BriefScreen
            brief={brief}
            onChangeBrief={setBrief}
            masterRatio={masterRatio}
            onChangeMasterRatio={setMasterRatio}
            onStartGenerating={handleGenerateVariants}
            isGenerating={isGenerating}
            onOpenMcpBridge={() => setMcpModalOpen(true)}
          />
        )}

        {activeTab === 'canvas' && (
          <div className="space-y-6">
            {creatives.length > 0 && (
              <VariantGrid
                variants={creatives}
                activeVariantId={activeCreative?.id || ''}
                onSelectVariant={setActiveCreativeId}
                onRateVariant={handleOpenFeedback}
                logoSrc={logoSrc}
              />
            )}
            {activeCreative && activeContent ? (
              <AdStudio
                creative={activeCreative}
                brief={activeBrief}
                content={activeContent}
                onChangeContent={handleChangeContent}
                onChangeFacultyPhoto={(photo) => updateCreative(activeCreative.id, { facultyPhoto: photo })}
                logoSrc={logoSrc}
                onChangeLogo={handleChangeLogo}
                onRegenerate={handleGenerateVariants}
                onOpenOpenArt={() => setMcpModalOpen(true)}
                isGenerating={isGenerating}
              />
            ) : (
              <div className="text-center py-20 text-gray-400 border border-dashed border-gray-800 rounded-2xl">
                <Sparkles className="w-8 h-8 text-dn-gold mx-auto mb-3" />
                <p className="text-sm">No creatives yet. Fill in the brief, then generate.</p>
                <button
                  onClick={() => setActiveTab('brief')}
                  className="mt-4 px-4 py-2 bg-dn-gold text-dn-navy-deep font-bold rounded-lg text-xs"
                >
                  Go to the brief
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'copy' && (
          <CopyPanel
            brief={activeBrief}
            copyOptions={copyOptions}
            onGenerateCopy={() => handleGenerateCopy()}
            isLoading={isLoadingCopy}
            onPushToCanvas={handlePushToCanvas}
          />
        )}

        {activeTab === 'naming' && <NamingPanel brief={activeBrief} versionNum={activeCreative?.version || 1} />}

        {activeTab === 'learning' && (
          <div className="space-y-8">
            <PerformanceImport onRefreshCreatives={() => setCreatives(loadCreatives())} />
            <LearningLibraryView
              store={learningStore}
              onUpdateStore={(updated) => {
                setLearningStore(updated);
                saveLearningStore(updated);
              }}
            />
          </div>
        )}
      </main>

      <McpPromptBridge
        brief={activeBrief}
        masterRatio={masterRatio}
        isOpen={mcpModalOpen}
        onClose={() => setMcpModalOpen(false)}
        onImportGeneratedImage={handleImportMcpImage}
        promptOverride={activeCreative?.resolvedPrompt}
      />

      <FeedbackModal
        creative={creatives.find((c) => c.id === feedbackTargetId) || null}
        rating={feedbackRating}
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  );
};

export default App;
