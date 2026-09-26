import React, { useState, useEffect, useMemo } from 'react';
import { AngleIdea, CampaignBrief, GeneratedCreative, MasterRatio, MetaAdCopy, LearningStore, StudioProject } from './types';
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
import { loadProjects, saveProjects, loadActiveProjectId, saveActiveProjectId, newProject, planIsStale } from './services/projects';
import { AdStudio } from './components/AdStudio';
import { VariantGrid } from './components/VariantGrid';
import { CopyPanel } from './components/CopyPanel';
import { NamingPanel } from './components/NamingPanel';
import { PerformanceImport } from './components/PerformanceImport';
import { LearningLibraryView } from './components/LearningLibraryView';
import { McpPromptBridge } from './components/McpPromptBridge';
import { FeedbackModal } from './components/FeedbackModal';
import { GeminiKeyChip } from './components/GeminiKeyChip';
import { BrainstormTab } from './components/BrainstormTab';
import { TestPlanTab } from './components/TestPlanTab';
import { Sparkles, Palette, Rocket, Award, Lightbulb, FlaskConical, Check, ArrowRight, Plus, Loader2 } from 'lucide-react';

type StudioTab = 'brainstorm' | 'plan' | 'creatives' | 'launch' | 'learn';

const LOGO_STORAGE_KEY = 'diginerve_custom_logo_v1';

// Today's date as DDMMYY / MMYY for the naming convention.
const TODAY = new Date();
const DD = String(TODAY.getDate()).padStart(2, '0');
const MM = String(TODAY.getMonth() + 1).padStart(2, '0');
const YY = String(TODAY.getFullYear()).slice(-2);

const BASE_BRIEF: CampaignBrief = {
  brand: 'DN',
  type: 'SALES',
  platform: 'META',
  objective: 'LP',
  segment: 'PG',
  product: 'OBGMD',
  geo: 'IN',
  targeting: 'INT',
  audience: 'PG-DOCTORS',
  launchMonth: `${MM}${YY}`,
  launchDate: `${DD}${MM}${YY}`,
  angle: Angle.Faculty,
  // Playbook r7: cold creatives lead with one idea, not a coupon.
  offer: 'NOOFFER',
  course: COURSE_FACTS[0],
  references: [],
  userNotes: '',
};

const courseLabel = (code: string) => (COURSE_FACTS.find((c) => c.courseCode === code)?.courseName || code).replace(/\(.*?\)/g, '').trim();

/** The Creatives step turns an approved angle into a brief for the existing ad engine. */
function briefFromAngle(project: StudioProject, angle: AngleIdea): CampaignBrief {
  const course = COURSE_FACTS.find((c) => c.courseCode === project.courseCode) || COURSE_FACTS[0];
  return {
    ...BASE_BRIEF,
    type: project.goal,
    product: course.courseCode,
    segment: course.segment,
    course,
    angle: angle.templateAngle,
    audience: (angle.persona || 'PG-DOCTORS').toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 20),
    userNotes: `Approved angle: ${angle.name}. ${angle.insight} Visual concept: ${angle.visualIdea}. The element to highlight: ${angle.placementFocus}. Lead hook: "${angle.hooks[0] || angle.name}".`,
  };
}

/** Variant 1 uses the layout that fits the angle; variants 2+ try other proven layouts. */
function templatesForVariants(angle: Angle, count: number): TemplateId[] {
  const first = defaultTemplateForAngle(angle);
  const rest = (Object.keys(TEMPLATE_META) as TemplateId[]).filter((t) => t !== first);
  return Array.from({ length: count }, (_, i) => [first, ...rest][i % 4]);
}

const STEPS: { id: StudioTab; label: string; icon: React.ReactNode }[] = [
  { id: 'brainstorm', label: 'Brainstorm', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: 'plan', label: 'Test plan', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: 'creatives', label: 'Creatives', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'launch', label: 'Launch pack', icon: <Rocket className="w-3.5 h-3.5" /> },
  { id: 'learn', label: 'Learn', icon: <Award className="w-3.5 h-3.5" /> },
];

function initialProjects(): { list: StudioProject[]; active: string } {
  let list = loadProjects();
  if (list.length === 0) list = [newProject(COURSE_FACTS[0].courseCode, courseLabel(COURSE_FACTS[0].courseCode))];
  const saved = loadActiveProjectId();
  return { list, active: list.some((p) => p.id === saved) ? saved : list[0].id };
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('brainstorm');
  const [projects, setProjects] = useState<StudioProject[]>(() => initialProjects().list);
  const [activeProjectId, setActiveProjectId] = useState<string>(() => initialProjects().active);
  const project = projects.find((p) => p.id === activeProjectId) || projects[0];
  const course = useMemo(() => COURSE_FACTS.find((c) => c.courseCode === project.courseCode) || COURSE_FACTS[0], [project.courseCode]);

  const [masterRatio] = useState<MasterRatio>('3:4');
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
  const [generatingAngleId, setGeneratingAngleId] = useState<string>('');
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationError, setGenerationError] = useState<string>('');
  const [lastBrief, setLastBrief] = useState<CampaignBrief>(BASE_BRIEF);

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

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);
  useEffect(() => {
    saveActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  // Load persisted creatives on mount. No auto-generation: each image costs quota.
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

  const updateProject = (p: StudioProject) => setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  const createProject = () => {
    const p = newProject(project.courseCode, courseLabel(project.courseCode));
    setProjects((prev) => [p, ...prev]);
    setActiveProjectId(p.id);
    setActiveTab('brainstorm');
  };

  const activeCreative = creatives.find((c) => c.id === activeCreativeId) || creatives[0];
  const activeBrief = activeCreative?.brief || lastBrief;
  const activeContent: AdContent | undefined = activeCreative
    ? activeCreative.content || buildDefaultContent(activeCreative.brief)
    : undefined;

  const planApproved = Boolean(project.plan?.approved) && !planIsStale(project);
  const approvedAngles = project.angles.filter((a) => project.plan?.basedOn.includes(a.id));

  const updateCreative = (id: string, patch: Partial<GeneratedCreative>) => {
    setCreatives((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      saveCreatives(next);
      return next;
    });
  };

  const handleGenerateForAngle = async (angle?: AngleIdea) => {
    const brief = angle ? briefFromAngle(project, angle) : activeBrief;
    setLastBrief(brief);
    setIsGenerating(true);
    setGeneratingAngleId(angle?.id || '');
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
      const withContent = generated.map((c, i) => {
        const base = buildDefaultContent(brief, templates[i]);
        const hook = angle?.hooks[i % Math.max(1, angle.hooks.length)];
        return { ...c, content: hook ? { ...base, hook, hookAccent: '' } : base };
      });
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
      setCopyOptions([]);
    } catch (e: any) {
      console.error('Variant generation encountered an error:', e);
      setGenerationError(e?.message || 'Variant generation failed.');
    } finally {
      setIsGenerating(false);
      setGeneratingAngleId('');
      setGenerationStatus('');
    }
  };

  const handleGenerateCopy = async () => {
    setIsLoadingCopy(true);
    try {
      setCopyOptions(await generateMetaCopy(activeBrief));
    } catch (e) {
      console.error('Failed to generate copy:', e);
    } finally {
      setIsLoadingCopy(false);
    }
  };

  // Copy is generated only for approved creatives, on first visit to the Launch pack.
  useEffect(() => {
    if (activeTab === 'launch' && creatives.length > 0 && copyOptions.length === 0 && !isLoadingCopy) handleGenerateCopy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleChangeContent = (content: AdContent) => {
    if (activeCreative) updateCreative(activeCreative.id, { content });
  };

  const handlePushToCanvas = (headline: string, subhead: string) => {
    if (!activeCreative || !activeContent) return;
    handleChangeContent({ ...activeContent, hook: headline, hookAccent: '', tagline: subhead || activeContent.tagline });
    setActiveTab('creatives');
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

  const stepDone = (id: StudioTab) =>
    id === 'brainstorm' ? project.angles.some((a) => a.starred) : id === 'plan' ? planApproved : id === 'creatives' ? creatives.length > 0 : false;
  const stepLocked = (id: StudioTab) => (id === 'creatives' || id === 'launch' ? !planApproved && creatives.length === 0 : false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      <header className="sticky top-0 z-40 bg-dn-navy-deep/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-xl font-black tracking-tight leading-none">
              <span className="text-white">digi</span>
              <span className="text-dn-gold">nerve</span>
            </div>
            <div className="h-5 w-px bg-gray-700" />
            <select
              value={project.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white max-w-[220px] truncate outline-none"
              title="Project"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">
                  {p.name}
                </option>
              ))}
            </select>
            <button onClick={createProject} className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md border border-gray-700 text-gray-300 hover:border-gray-500" title="New project">
              <Plus className="w-3 h-3" /> New
            </button>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <GeminiKeyChip />
            <nav className="flex items-center gap-1 overflow-x-auto -mx-1 px-1" aria-label="Workflow steps">
              {STEPS.map((s, i) => {
                const active = activeTab === s.id;
                const locked = stepLocked(s.id);
                return (
                  <React.Fragment key={s.id}>
                    {i > 0 && <ArrowRight className="w-3 h-3 text-gray-700 flex-shrink-0" />}
                    <button
                      onClick={() => !locked && setActiveTab(s.id)}
                      disabled={locked}
                      title={locked ? 'Approve a test plan first' : undefined}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                        active
                          ? 'bg-dn-gold text-dn-navy-deep border-dn-gold'
                          : locked
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
          <span>{generationStatus || 'Generating creative concepts...'}</span>
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
        {activeTab === 'brainstorm' && (
          <BrainstormTab project={project} course={course} onChange={updateProject} onNext={() => setActiveTab('plan')} />
        )}

        {activeTab === 'plan' && (
          <TestPlanTab
            project={project}
            course={course}
            onChange={updateProject}
            onBack={() => setActiveTab('brainstorm')}
            onNext={() => setActiveTab('creatives')}
          />
        )}

        {activeTab === 'creatives' && (
          <div className="space-y-6">
            {/* Approved angles: generate concepts only for these */}
            {approvedAngles.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
                <div className="text-xs font-semibold text-dn-gold mb-2">Approved angles · generate concepts for one at a time</div>
                <div className="flex flex-wrap gap-2">
                  {approvedAngles.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleGenerateForAngle(a)}
                      disabled={isGenerating}
                      className="text-left px-3 py-2 rounded-lg border border-gray-700 hover:border-dn-gold disabled:opacity-50 max-w-xs"
                    >
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        {generatingAngleId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-dn-gold" />}
                        {a.name}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">“{a.hooks[0]}”</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                onRegenerate={() => handleGenerateForAngle(approvedAngles.find((a) => a.templateAngle === activeBrief.angle))}
                onOpenOpenArt={() => setMcpModalOpen(true)}
                isGenerating={isGenerating}
              />
            ) : (
              <div className="text-center py-16 text-gray-400 border border-dashed border-gray-800 rounded-2xl">
                <Sparkles className="w-8 h-8 text-dn-gold mx-auto mb-3" />
                <p className="text-sm">
                  {approvedAngles.length ? 'Pick an approved angle above to generate 3 concepts.' : 'Approve a test plan first, then generate concepts per angle.'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'launch' && (
          <div className="space-y-6">
            <CopyPanel
              brief={activeBrief}
              copyOptions={copyOptions}
              onGenerateCopy={() => handleGenerateCopy()}
              isLoading={isLoadingCopy}
              onPushToCanvas={handlePushToCanvas}
            />
            <NamingPanel brief={activeBrief} versionNum={activeCreative?.version || 1} />
          </div>
        )}

        {activeTab === 'learn' && (
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
