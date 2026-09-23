import React, { useState, useEffect } from 'react';
import {
  CampaignBrief,
  GeneratedCreative,
  Ratio,
  MasterRatio,
  MetaAdCopy,
  LearningStore,
} from './types';
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
import { BriefScreen } from './components/BriefScreen';
import { CreativeCanvas } from './components/CreativeCanvas';
import { LayerPanel } from './components/LayerPanel';
import { VariantGrid } from './components/VariantGrid';
import { CopyPanel } from './components/CopyPanel';
import { NamingPanel } from './components/NamingPanel';
import { PerformanceImport } from './components/PerformanceImport';
import { LearningLibraryView } from './components/LearningLibraryView';
import { McpPromptBridge } from './components/McpPromptBridge';
import { FeedbackModal } from './components/FeedbackModal';
import {
  Sparkles,
  Layers,
  FileText,
  Tag,
  Award,
  TrendingUp,
  Layout,
  ExternalLink,
} from 'lucide-react';

type StudioTab = 'brief' | 'canvas' | 'copy' | 'naming' | 'learning';

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
  launchMonth: '0926',
  launchDate: '220926',
  angle: Angle.Faculty,
  offer: 'FLAT40',
  course: COURSE_FACTS[0], // OBGYN MD
  references: [],
  userNotes: '',
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('brief');
  const [brief, setBrief] = useState<CampaignBrief>(INITIAL_BRIEF);
  const [masterRatio, setMasterRatio] = useState<MasterRatio>('3:4');
  const [selectedRatio, setSelectedRatio] = useState<Ratio>('4:5');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Creatives & Variants
  const [creatives, setCreatives] = useState<GeneratedCreative[]>([]);
  const [activeCreativeId, setActiveCreativeId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

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

  // Load persisted state on mount
  useEffect(() => {
    const savedCreatives = loadCreatives();
    if (savedCreatives.length > 0) {
      setCreatives(savedCreatives);
      setActiveCreativeId(savedCreatives[0].id);
    } else {
      // Generate initial variants
      handleGenerateVariants();
    }

    // Hydrate from high-capacity IndexedDB for complete assets
    initStorage((syncedCreatives, syncedStore) => {
      if (syncedCreatives.length > 0) {
        setCreatives(syncedCreatives);
        setActiveCreativeId((prev) =>
          prev && syncedCreatives.some((c) => c.id === prev) ? prev : syncedCreatives[0].id
        );
      }
      if (syncedStore) {
        setLearningStore(syncedStore);
      }
    });
  }, []);

  const activeCreative = creatives.find((c) => c.id === activeCreativeId) || creatives[0];

  const handleGenerateVariants = async () => {
    setIsGenerating(true);
    setGenerationStatus('Synthesizing brief and assembling prompt scaffold...');
    try {
      const generated = await generateCreativeVariants(
        brief,
        3,
        masterRatio,
        (curr, tot, msg) => setGenerationStatus(`[${curr}/${tot}] ${msg}`)
      );
      setCreatives(generated);
      if (generated.length > 0) {
        setActiveCreativeId(generated[0].id);
        saveCreatives(generated);
      }
      // Also generate initial copy options for the brief
      handleGenerateCopy();
      setActiveTab('canvas');
    } catch (e) {
      console.error('Variant generation encountered an error:', e);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleGenerateCopy = async () => {
    setIsLoadingCopy(true);
    try {
      const copies = await generateMetaCopy(brief);
      setCopyOptions(copies);
    } catch (e) {
      console.error('Failed to generate copy:', e);
    } finally {
      setIsLoadingCopy(false);
    }
  };

  const handleUpdateActiveLayers = (updatedLayers: any[]) => {
    if (!activeCreative) return;
    const updated = creatives.map((c) =>
      c.id === activeCreative.id ? { ...c, layers: updatedLayers } : c
    );
    setCreatives(updated);
    saveCreatives(updated);
  };

  const handlePushToCanvas = (headline: string, subhead: string) => {
    if (!activeCreative) return;
    const newLayers = activeCreative.layers.map((l) => {
      if (l.role === 'headline') return { ...l, content: headline };
      if (l.role === 'subhead') return { ...l, content: subhead };
      return l;
    });
    handleUpdateActiveLayers(newLayers);
    setActiveTab('canvas');
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
      setCreatives((prev) => prev.map((c) => (c.id === updatedCreative.id ? updatedCreative : c)));
    }
    setLearningStore(store);
  };

  const handleImportMcpImage = (base64Image: string) => {
    if (!activeCreative) return;
    const updated = creatives.map((c) =>
      c.id === activeCreative.id ? { ...c, base64: base64Image } : c
    );
    setCreatives(updated);
    saveCreatives(updated);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      {/* Primary Top Header */}
      <header className="sticky top-0 z-40 bg-dn-navy-deep/95 backdrop-blur-md border-b border-gray-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand Wordmark & Tagline */}
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xl font-black tracking-tight">
              <span className="text-white">Digi</span>
              <span className="text-dn-gold">Nerve</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-gray-700" />
            <span className="text-xs text-gray-300 font-medium hidden sm:inline">
              Ad Creative Studio <span className="text-[10px] text-dn-gold font-mono px-1 rounded bg-black/40">v2.0</span>
            </span>
          </div>

          {/* Navigation Flow Tabs */}
          <nav className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('brief')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'brief'
                  ? 'bg-dn-navy text-dn-gold border border-dn-gold/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>1. Brief</span>
            </button>

            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'canvas'
                  ? 'bg-dn-navy text-dn-gold border border-dn-gold/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Studio Canvas</span>
            </button>

            <button
              onClick={() => setActiveTab('copy')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'copy'
                  ? 'bg-dn-navy text-dn-gold border border-dn-gold/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Meta Copy</span>
            </button>

            <button
              onClick={() => setActiveTab('naming')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'naming'
                  ? 'bg-dn-navy text-dn-gold border border-dn-gold/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>4. Naming & URLs</span>
            </button>

            <button
              onClick={() => setActiveTab('learning')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'learning'
                  ? 'bg-dn-navy text-dn-gold border border-dn-gold/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>5. Learning Loop</span>
            </button>
          </nav>

          {/* Quick MCP Bridge trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMcpModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-600/60 rounded-lg flex items-center gap-1.5 transition shadow-sm"
              title="Open direct OpenArt MCP Server bridge (https://mcp.openart.ai/mcp)"
            >
              <Sparkles className="w-3.5 h-3.5 text-dn-gold" />
              <span className="hidden md:inline">OpenArt MCP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Generation Progress Bar */}
      {isGenerating && (
        <div className="bg-dn-navy text-dn-gold px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b border-dn-gold/30">
          <span className="w-3 h-3 rounded-full border-2 border-dn-gold border-t-transparent animate-spin" />
          <span>{generationStatus || 'Generating creative variants...'}</span>
        </div>
      )}

      {/* Main View Area */}
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
            {/* Variant Grid Selector (One Axis Fan-Out) */}
            {creatives.length > 0 && (
              <VariantGrid
                variants={creatives}
                activeVariantId={activeCreativeId}
                onSelectVariant={setActiveCreativeId}
                onRateVariant={handleOpenFeedback}
              />
            )}

            {/* Canvas & Layer Inspector 2-Column Split */}
            {activeCreative ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <CreativeCanvas
                    creative={activeCreative}
                    selectedRatio={selectedRatio}
                    onChangeRatio={setSelectedRatio}
                    selectedLayerId={selectedLayerId}
                    onSelectLayer={setSelectedLayerId}
                    onUpdateLayers={handleUpdateActiveLayers}
                    onOpenMcpBridge={() => setMcpModalOpen(true)}
                  />
                </div>

                <div className="lg:col-span-5">
                  <LayerPanel
                    layers={activeCreative.layers}
                    onChangeLayers={handleUpdateActiveLayers}
                    selectedLayerId={selectedLayerId}
                    onSelectLayer={setSelectedLayerId}
                    course={brief.course}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p>No creatives generated yet.</p>
                <button
                  onClick={handleGenerateVariants}
                  className="mt-3 px-4 py-2 bg-dn-gold text-dn-navy-deep font-bold rounded-lg text-xs"
                >
                  Generate First Variants
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'copy' && (
          <CopyPanel
            brief={brief}
            copyOptions={copyOptions}
            onGenerateCopy={handleGenerateCopy}
            isLoading={isLoadingCopy}
            onPushToCanvas={handlePushToCanvas}
          />
        )}

        {activeTab === 'naming' && (
          <NamingPanel brief={brief} versionNum={activeCreative?.version || 1} />
        )}

        {activeTab === 'learning' && (
          <div className="space-y-8">
            <PerformanceImport
              onRefreshCreatives={() => setCreatives(loadCreatives())}
            />
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

      {/* Modals */}
      <McpPromptBridge
        brief={brief}
        masterRatio={masterRatio}
        isOpen={mcpModalOpen}
        onClose={() => setMcpModalOpen(false)}
        onImportGeneratedImage={handleImportMcpImage}
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
