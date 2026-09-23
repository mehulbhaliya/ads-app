import React, { useMemo, useRef, useState } from 'react';
import { CampaignBrief, GeneratedCreative, Ratio } from '../types';
import {
  AdContent,
  TemplateId,
  TEMPLATE_META,
  chipClaims,
  confirmedFaculty,
  courseVariants,
  validateContent,
} from '../services/adContent';
import { AD_SIZES, renderAd, canvasToBlob } from '../services/adTemplates';
import { AdPreview, useBrandAssets } from './AdPreview';
import { loadImage } from '../utils/logo';
import {
  Download,
  RefreshCw,
  Sparkles,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Type,
  UserRound,
  BadgeCheck,
  Tag,
  LayoutTemplate,
} from 'lucide-react';

interface AdStudioProps {
  creative: GeneratedCreative;
  brief: CampaignBrief;
  content: AdContent;
  onChangeContent: (content: AdContent) => void;
  onChangeFacultyPhoto: (dataUrl: string | undefined) => void;
  logoSrc?: string | null;
  onChangeLogo: (dataUrl: string | undefined) => void;
  onRegenerate: () => void;
  onOpenOpenArt: () => void;
  isGenerating: boolean;
}

const EXPORT_RATIOS: Ratio[] = ['4:5', '1:1', '9:16', '1.91:1'];

const CTA_OPTIONS = [
  'Enrol Now',
  'Start Your Final Revision',
  'Book a Free Demo',
  'Start Free Trial',
  'Reserve Your Seat',
  'Chat on WhatsApp',
  'Download the App',
  'Explore the Course',
];

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="flex items-center justify-between text-[11px] font-semibold text-gray-300 mb-1">
      <span>{label}</span>
      {hint && <span className="font-mono text-gray-500 font-normal">{hint}</span>}
    </span>
    {children}
  </label>
);

const inputCls =
  'w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-dn-gold focus:outline-none focus:ring-1 focus:ring-dn-gold/40';

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 space-y-3">
    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-200 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    {children}
  </section>
);

export const AdStudio: React.FC<AdStudioProps> = ({
  creative,
  brief,
  content,
  onChangeContent,
  onChangeFacultyPhoto,
  logoSrc,
  onChangeLogo,
  onRegenerate,
  onOpenOpenArt,
  isGenerating,
}) => {
  const [ratio, setRatio] = useState<Ratio>('4:5');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [claimsVerified, setClaimsVerified] = useState(false);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const { logo } = useBrandAssets(logoSrc);

  const course = brief.course;
  const faculty = useMemo(() => confirmedFaculty(course), [course]);
  const claims = useMemo(() => chipClaims(course), [course]);
  const variants = useMemo(() => courseVariants(course), [course]);
  const errors = useMemo(() => validateContent(content, course), [content, course]);
  const unapprovedOnly = errors.length > 0 && errors.every((e) => e.startsWith('Proof "'));
  const blocked = errors.length > 0 && !(unapprovedOnly && claimsVerified);

  const set = (patch: Partial<AdContent>) => onChangeContent({ ...content, ...patch });

  const toggleProof = (claim: string) => {
    const has = content.proofs.includes(claim);
    if (has) set({ proofs: content.proofs.filter((p) => p !== claim) });
    else if (content.proofs.length < 3) set({ proofs: [...content.proofs, claim] });
  };

  const facultySrc = creative.facultyPhoto || brief.references.find((r) => r.role === 'brandLock')?.base64;
  const baseIsPlaceholder = !!creative.generationError;

  const handleExport = async (targets: Ratio[]) => {
    if (blocked) return;
    setExporting(true);
    setExportMsg('');
    try {
      const [base, fac] = await Promise.all([
        creative.base64 && !baseIsPlaceholder ? loadImage(creative.base64).catch(() => null) : Promise.resolve(null),
        facultySrc ? loadImage(facultySrc).catch(() => null) : Promise.resolve(null),
      ]);
      for (const r of targets) {
        const canvas = document.createElement('canvas');
        renderAd(canvas, r, content, { base, faculty: fac, logo });
        const blob = await canvasToBlob(canvas);
        if (!blob) throw new Error('Could not encode PNG');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creative.adName}_${r.replace(':', 'x').replace('.', '')}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        await new Promise((res) => setTimeout(res, 350)); // browsers throttle rapid multi-downloads
      }
      setExportMsg(`Downloaded ${targets.length} PNG${targets.length > 1 ? 's' : ''} named ${creative.adName}_<size>.png`);
    } catch (e: any) {
      setExportMsg(`Export failed: ${e.message || e}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Preview column */}
      <div className="xl:col-span-7 min-w-0 space-y-4 xl:sticky xl:top-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 text-xs">
            {EXPORT_RATIOS.map((r) => (
              <button
                key={r}
                onClick={() => setRatio(r)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  ratio === r ? 'bg-dn-gold text-dn-navy-deep' : 'text-gray-400 hover:text-white'
                }`}
                title={AD_SIZES[r].platform}
              >
                {AD_SIZES[r].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              New AI visuals
            </button>
            <button
              onClick={onOpenOpenArt}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-950/50 hover:bg-purple-900/60 text-purple-100 border border-purple-700/60 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-dn-gold" />
              OpenArt visual
            </button>
          </div>
        </div>

        <div className="bg-[repeating-conic-gradient(#1f2937_0%_25%,#111827_0%_50%)] bg-[length:24px_24px] rounded-2xl p-4 border border-gray-800 flex justify-center">
          <div className={ratio === '9:16' ? 'w-full max-w-[340px]' : ratio === '1.91:1' ? 'w-full' : 'w-full max-w-[520px]'}>
            <div className="rounded-lg overflow-hidden shadow-2xl ring-1 ring-black/40">
              <AdPreview
                content={content}
                ratio={ratio}
                baseSrc={baseIsPlaceholder ? null : creative.base64}
                facultySrc={facultySrc}
                logoSrc={logoSrc}
                canvasRef={previewRef}
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 text-center">
          {AD_SIZES[ratio].width} × {AD_SIZES[ratio].height}px · {AD_SIZES[ratio].platform}
          {ratio === '9:16' && ' · top 12% and bottom 18% kept clear for story UI'}
        </p>

        {/* Export */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
          {errors.length > 0 ? (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Fix before export
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              {unapprovedOnly && (
                <label className="flex items-center gap-2 pt-1 text-red-100">
                  <input type="checkbox" checked={claimsVerified} onChange={(e) => setClaimsVerified(e.target.checked)} />
                  I have verified these claims with the course team
                </label>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-green-950/50 border border-green-800 text-green-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Brand and claim checks passed. Ready to export.
            </div>
          )}
          {baseIsPlaceholder && (
            <p className="text-[11px] text-amber-300">
              No AI visual yet ({creative.generationError}). The ad uses a neutral placeholder photo until you regenerate or upload a faculty photo.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport(['4:5', '1:1', '9:16'])}
              disabled={blocked || exporting}
              className="flex-1 min-w-[180px] px-4 py-2.5 rounded-lg bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Meta set (4:5, 1:1, 9:16)'}
            </button>
            <button
              onClick={() => handleExport([ratio])}
              disabled={blocked || exporting}
              className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              This size only
            </button>
            <button
              onClick={() => handleExport(['1:1', '1.91:1', '4:5'])}
              disabled={blocked || exporting}
              className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Google set
            </button>
          </div>
          <p className="text-[11px] text-gray-400 font-mono break-all">
            File names: {creative.adName}_4x5.png · _1x1.png · _9x16.png
          </p>
          {exportMsg && <p className="text-xs text-green-300">{exportMsg}</p>}
        </div>
      </div>

      {/* Editor column */}
      <div className="xl:col-span-5 min-w-0 space-y-4">
        <Section icon={<LayoutTemplate className="w-4 h-4 text-dn-gold" />} title="Layout">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(TEMPLATE_META) as TemplateId[]).map((t) => {
              const meta = TEMPLATE_META[t];
              const active = content.template === t;
              const recommended = meta.bestFor.includes(brief.angle);
              return (
                <button
                  key={t}
                  onClick={() => set({ template: t })}
                  className={`min-w-0 text-left rounded-lg border p-2 transition ${
                    active ? 'border-dn-gold bg-dn-gold/10' : 'border-gray-700 hover:border-gray-500 bg-gray-950/60'
                  }`}
                >
                  <div className="rounded overflow-hidden mb-1.5 pointer-events-none">
                    <AdPreview
                      content={{ ...content, template: t }}
                      ratio="1:1"
                      baseSrc={baseIsPlaceholder ? null : creative.base64}
                      facultySrc={facultySrc}
                      logoSrc={logoSrc}
                    />
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    {meta.name}
                    {recommended && <span className="text-[9px] px-1 rounded bg-dn-gold text-dn-navy-deep">FITS ANGLE</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 leading-snug">{meta.description}</div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section icon={<Type className="w-4 h-4 text-dn-gold" />} title="Headline & course">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hook (white)" hint={`${content.hook.length}`}>
              <input className={inputCls} value={content.hook} onChange={(e) => set({ hook: e.target.value })} />
            </Field>
            <Field label="Hook accent (gold)" hint={`${content.hookAccent.length}`}>
              <input className={inputCls} value={content.hookAccent} onChange={(e) => set({ hookAccent: e.target.value })} />
            </Field>
          </div>
          {variants.length > 0 && (
            <Field label="Course variant" hint="sets title, subtitle, price">
              <select
                className={inputCls}
                value={variants.find((v) => v.title === content.courseTitle && v.subtitle === content.courseSubtitle)?.id || ''}
                onChange={(e) => {
                  const v = variants.find((x) => x.id === e.target.value);
                  if (v) set({ courseTitle: v.title, courseSubtitle: v.subtitle, priceNow: v.price });
                }}
              >
                <option value="">Custom</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} · {v.subtitle} · {v.price} ({v.duration})
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course title">
              <input className={inputCls} value={content.courseTitle} onChange={(e) => set({ courseTitle: e.target.value })} />
            </Field>
            <Field label="Subtitle">
              <input className={inputCls} value={content.courseSubtitle} onChange={(e) => set({ courseSubtitle: e.target.value })} />
            </Field>
          </div>
          <Field label="Tagline" hint={`${content.tagline.length}/60`}>
            <input className={inputCls} value={content.tagline} maxLength={80} onChange={(e) => set({ tagline: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Call to action">
              <input className={inputCls} list="cta-options" value={content.cta} onChange={(e) => set({ cta: e.target.value })} />
              <datalist id="cta-options">
                {CTA_OPTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Audience strip">
              <input className={inputCls} value={content.badge} onChange={(e) => set({ badge: e.target.value })} />
            </Field>
          </div>
        </Section>

        <Section icon={<UserRound className="w-4 h-4 text-dn-gold" />} title="Faculty">
          <Field label="Faculty (confirmed names only)">
            <select
              className={inputCls}
              value={content.facultyName}
              onChange={(e) => {
                const f = faculty.find((x) => x.name === e.target.value);
                set({ facultyName: f?.name || '', facultyRole: f?.role || '', facultyCredentials: f?.credentials || '' });
              }}
            >
              <option value="">No faculty on this ad</option>
              {faculty.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                  {f.role ? ` · ${f.role}` : ''}
                </option>
              ))}
            </select>
          </Field>
          {faculty.length === 0 && (
            <p className="text-[11px] text-amber-300">No confirmed faculty in the library for this course. Names stay off the ad until confirmed internally.</p>
          )}
          {content.facultyName && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Credentials">
                <input className={inputCls} value={content.facultyCredentials} placeholder="MBBS, MD (OBGYN)" onChange={(e) => set({ facultyCredentials: e.target.value })} />
              </Field>
              <Field label="Role line">
                <input className={inputCls} value={content.facultyRole} onChange={(e) => set({ facultyRole: e.target.value })} />
              </Field>
            </div>
          )}
          <div className="flex items-center gap-3">
            {facultySrc ? (
              <img src={facultySrc} alt="Faculty" className="w-14 h-14 rounded-lg object-cover border border-gray-700" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-950 border border-dashed border-gray-700 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <label className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              {facultySrc ? 'Replace photo' : 'Upload faculty photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) onChangeFacultyPhoto(await readFile(f));
                  e.target.value = '';
                }}
              />
            </label>
            {creative.facultyPhoto && (
              <button onClick={() => onChangeFacultyPhoto(undefined)} className="text-xs text-red-300 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-500">A real photo always beats an AI face. Without one, the AI visual fills the photo area.</p>
        </Section>

        <Section icon={<BadgeCheck className="w-4 h-4 text-dn-gold" />} title={`Proof chips (${content.proofs.length}/3)`}>
          {claims.length === 0 ? (
            <p className="text-[11px] text-gray-400">No approved numeric claims in the library for this course, so the proof row is hidden.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {claims.map((c) => {
                const on = content.proofs.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleProof(c)}
                    disabled={!on && content.proofs.length >= 3}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition disabled:opacity-40 ${
                      on ? 'border-dn-gold bg-dn-gold/10 text-white' : 'border-gray-800 bg-gray-950/60 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {on ? '✓ ' : ''}
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        <Section icon={<Tag className="w-4 h-4 text-dn-gold" />} title="Offer, price & date">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Offer badge">
              <input className={inputCls} value={content.offer} placeholder="FLAT 40% OFF" onChange={(e) => set({ offer: e.target.value })} />
            </Field>
            <Field label="Date line">
              <input className={inputCls} value={content.dateLine} placeholder="Exam: **19 January 2027**" onChange={(e) => set({ dateLine: e.target.value })} />
            </Field>
            <Field label="Price">
              <input className={inputCls} value={content.priceNow} placeholder="₹24,999" onChange={(e) => set({ priceNow: e.target.value })} />
            </Field>
            <Field label="Struck price">
              <input className={inputCls} value={content.priceWas} placeholder="₹41,999" onChange={(e) => set({ priceWas: e.target.value })} />
            </Field>
          </div>
          <p className="text-[10px] text-gray-500">Wrap words in **double asterisks** in the date line to highlight them in gold. Check the offer calendar before shipping a discount.</p>
        </Section>

        <Section icon={<ImageIcon className="w-4 h-4 text-dn-gold" />} title="Logo">
          <div className="flex items-center gap-3">
            <div className="h-12 px-3 rounded-lg bg-white flex items-center">
              {logo ? <img src={logo.light.toDataURL()} alt="Logo" className="h-8" /> : <span className="text-xs text-gray-500">loading</span>}
            </div>
            <div className="h-12 px-3 rounded-lg bg-dn-navy flex items-center">
              {logo && <img src={logo.dark.toDataURL()} alt="Logo on navy" className="h-8" />}
            </div>
            <label className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white cursor-pointer">
              Replace
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) onChangeLogo(await readFile(f));
                  e.target.value = '';
                }}
              />
            </label>
            {logoSrc && (
              <button onClick={() => onChangeLogo(undefined)} className="text-xs text-gray-400 hover:underline">
                Reset
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-500">Upload any logo on a white background. It is cropped and cut out automatically, with a white version made for navy layouts.</p>
        </Section>
      </div>
    </div>
  );
};
