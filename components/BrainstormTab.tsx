import React, { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Globe, Star, X, ArrowRight, Sparkles, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
import { AngleIdea, CourseFacts, StudioProject } from '../types';
import { COURSE_FACTS } from '../constants/courseFacts';
import { newChatMsg, strategistTurn } from '../services/strategist';

interface Props {
  project: StudioProject;
  course: CourseFacts;
  onChange: (p: StudioProject) => void;
  onNext: () => void;
}

const QUICK_STARTS = [
  'Give me angle ideas for a first test',
  'Our current ads are fatigued. What should we test next?',
  'Which angles are competitors NOT using for this course?',
];

const SAT_STYLE: Record<AngleIdea['saturation'], string> = {
  open: 'bg-green-950 text-green-300 border-green-800',
  moderate: 'bg-gray-800 text-gray-300 border-gray-700',
  crowded: 'bg-red-950 text-red-300 border-red-800',
};

export const BrainstormTab: React.FC<Props> = ({ project, course, onChange, onNext }) => {
  const [draft, setDraft] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [search, setSearch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chatEnd = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project.chat.length, busy]);

  const starred = project.angles.filter((a) => a.starred);

  const send = async (text: string) => {
    const msg = text.trim() || (images.length ? 'Analyse this reference ad and turn it into angles for this course.' : '');
    if (!msg || busy) return;
    setError('');
    const userMsg = newChatMsg('user', msg, images.length ? { images } : {});
    const withUser = { ...project, chat: [...project.chat, userMsg], updatedAt: new Date().toISOString() };
    onChange(withUser);
    setDraft('');
    setImages([]);
    setBusy(true);
    try {
      const res = await strategistTurn(project, course, msg, userMsg.images || [], { search });
      onChange({
        ...withUser,
        chat: [...withUser.chat, newChatMsg('strategist', res.reply, res.sources?.length ? { sources: res.sources } : {})],
        angles: [...res.newAngles, ...withUser.angles],
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e?.message?.slice(0, 200) || 'The strategist could not answer. Try again.');
    } finally {
      setBusy(false);
      setSearch(false);
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files)
      .slice(0, 3)
      .forEach((f) => {
        const r = new FileReader();
        r.onload = () => setImages((prev) => [...prev, String(r.result)].slice(0, 3));
        r.readAsDataURL(f);
      });
  };

  const patchAngle = (id: string, patch: Partial<AngleIdea>) =>
    onChange({ ...project, angles: project.angles.map((a) => (a.id === id ? { ...a, ...patch } : a)), updatedAt: new Date().toISOString() });
  const removeAngle = (id: string) => onChange({ ...project, angles: project.angles.filter((a) => a.id !== id) });

  return (
    <div className="space-y-4">
      {/* Setup: the only inputs this step needs */}
      <div className="flex flex-wrap items-end gap-3 bg-gray-900/60 border border-gray-800 rounded-xl p-3">
        <label className="text-[11px] text-gray-400">
          Course
          <select
            value={project.courseCode}
            onChange={(e) => {
              const code = e.target.value;
              const label = (COURSE_FACTS.find((c) => c.courseCode === code)?.courseName || code).replace(/\(.*?\)/g, '').trim();
              // A fresh project takes the course's name; a started one keeps its name.
              const fresh = project.chat.length === 0 && project.angles.length === 0;
              onChange({ ...project, courseCode: code, name: fresh ? `${label} · ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : project.name });
            }}
            className="block mt-1 bg-gray-950 border border-gray-700 rounded-md px-2 py-1.5 text-sm text-white max-w-[260px]"
          >
            {COURSE_FACTS.map((c) => (
              <option key={c.courseCode} value={c.courseCode}>
                {c.courseName.replace(/\(.*?\)/g, '').trim()}
              </option>
            ))}
          </select>
        </label>
        <div className="text-[11px] text-gray-400">
          Goal
          <div className="mt-1 flex rounded-md border border-gray-700 overflow-hidden">
            {(['SALES', 'LEADS'] as const).map((g) => (
              <button
                key={g}
                onClick={() => onChange({ ...project, goal: g })}
                className={`px-3 py-1.5 text-xs font-semibold ${project.goal === g ? 'bg-dn-gold text-dn-navy-deep' : 'bg-gray-950 text-gray-300'}`}
              >
                {g === 'SALES' ? 'Sales' : 'Leads'}
              </button>
            ))}
          </div>
        </div>
        <label className="text-[11px] text-gray-400">
          Budget ₹/day
          <input
            type="number"
            value={project.dailyBudget}
            onChange={(e) => onChange({ ...project, dailyBudget: Number(e.target.value) || 0 })}
            className="block mt-1 w-24 bg-gray-950 border border-gray-700 rounded-md px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label className="text-[11px] text-gray-400">
          Target CPA ₹ <span className="text-gray-600">(optional)</span>
          <input
            type="number"
            value={project.targetCpa || ''}
            placeholder="1836"
            onChange={(e) => onChange({ ...project, targetCpa: Number(e.target.value) || 0 })}
            className="block mt-1 w-24 bg-gray-950 border border-gray-700 rounded-md px-2 py-1.5 text-sm text-white"
          />
        </label>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Chat */}
        <section className="lg:col-span-2 flex flex-col bg-gray-900/60 border border-gray-800 rounded-xl h-[70vh]">
          <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-dn-gold" /> Strategist
            <span className="text-[10px] font-normal text-gray-500">senior performance marketer · knows the playbook and your course facts</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {project.chat.length === 0 && (
              <div className="text-sm text-gray-400 space-y-3">
                <p>Tell me what's on your mind: an idea, a problem ("CPA is rising"), or attach a competitor ad you liked. Or start with:</p>
                <div className="flex flex-col gap-2">
                  {QUICK_STARTS.map((q) => (
                    <button key={q} onClick={() => send(q)} className="text-left text-xs px-3 py-2 rounded-lg border border-gray-700 hover:border-dn-gold text-gray-200">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {project.chat.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-dn-gold/15 text-amber-50 border border-dn-gold/30' : 'bg-gray-800 text-gray-100'}`}>
                  {m.images?.length ? (
                    <div className="flex gap-1 mb-2">
                      {m.images.map((src, i) => (
                        <img key={i} src={src} alt="reference ad" className="h-16 rounded border border-gray-700" />
                      ))}
                    </div>
                  ) : null}
                  {m.text}
                  {m.sources?.length ? (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400 space-y-0.5">
                      {m.sources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noreferrer" className="block truncate hover:text-dn-gold">
                          ↗ {s.title}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {search ? 'Researching competitors, then thinking...' : 'Thinking...'}
              </div>
            )}
            {error && <div className="text-xs text-red-300">{error}</div>}
            <div ref={chatEnd} />
          </div>
          <div className="border-t border-gray-800 p-3 space-y-2">
            {images.length > 0 && (
              <div className="flex gap-2">
                {images.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="attachment" className="h-12 rounded border border-gray-700" />
                    <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 bg-gray-900 rounded-full">
                      <X className="w-3.5 h-3.5 text-gray-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={2}
                placeholder="Share an idea, a problem or a reference..."
                className="flex-1 resize-none bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-dn-gold"
              />
              <button onClick={() => send(draft)} disabled={busy} className="p-2.5 rounded-lg bg-dn-gold text-dn-navy-deep disabled:opacity-50" title="Send">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md border border-gray-700 text-gray-300 hover:border-gray-500">
                <Paperclip className="w-3 h-3" /> Reference ad
              </button>
              <button
                onClick={() => setSearch((s) => !s)}
                className={`text-[11px] flex items-center gap-1 px-2 py-1 rounded-md border ${search ? 'border-sky-500 text-sky-300 bg-sky-950/50' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
                title="Search the web for current competitor ads before answering (uses more quota)"
              >
                <Globe className="w-3 h-3" /> Research competitors {search ? 'on' : ''}
              </button>
            </div>
          </div>
        </section>

        {/* Angle cards */}
        <section className="lg:col-span-3 flex flex-col h-[70vh]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-white">
              Angle ideas <span className="text-gray-500 font-normal">({project.angles.length})</span>
            </div>
            <div className="text-[11px] text-gray-400">Star 2-4 angles worth testing</div>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {project.angles.length === 0 && (
              <div className="h-full flex items-center justify-center text-sm text-gray-500 border border-dashed border-gray-800 rounded-xl">
                Angle ideas appear here as we talk.
              </div>
            )}
            {project.angles.map((a) => (
              <AngleCard key={a.id} angle={a} onStar={() => patchAngle(a.id, { starred: !a.starred })} onRemove={() => removeAngle(a.id)} />
            ))}
          </div>
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-gray-800 mt-2">
            <div className="text-[11px] text-gray-400">
              {starred.length === 0
                ? 'No angles starred yet.'
                : starred.length > 4
                ? `${starred.length} starred. At ₹${project.dailyBudget}/day, 2-4 angles give each enough spend to judge.`
                : `${starred.length} starred: ${starred.map((a) => a.name).join(', ')}`}
            </div>
            <button
              onClick={onNext}
              disabled={starred.length === 0}
              className="px-4 py-2 rounded-lg bg-dn-gold text-dn-navy-deep text-sm font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Plan the test <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const AngleCard: React.FC<{ angle: AngleIdea; onStar: () => void; onRemove: () => void }> = ({ angle: a, onStar, onRemove }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border p-3 bg-gray-900/70 ${a.starred ? 'border-dn-gold' : 'border-gray-800'}`}>
      <div className="flex items-start gap-2">
        <button onClick={onStar} title={a.starred ? 'Unstar' : 'Star to test'} className="mt-0.5">
          <Star className={`w-5 h-5 ${a.starred ? 'fill-dn-gold text-dn-gold' : 'text-gray-500 hover:text-dn-gold'}`} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-white">{a.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SAT_STYLE[a.saturation]}`}>{a.saturation === 'open' ? 'open lane' : a.saturation}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{a.awareness}</span>
            {a.lever && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{a.lever}</span>}
            {a.source !== 'strategist' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300">{a.source === 'reference' ? 'from reference' : 'your idea'}</span>}
          </div>
          <p className="text-xs text-gray-300 mt-1">{a.insight}</p>
          {a.hooks[0] && <p className="text-sm text-amber-100 mt-2">“{a.hooks[0]}”</p>}
          <button onClick={() => setOpen(!open)} className="mt-2 text-[11px] text-gray-400 hover:text-white flex items-center gap-1">
            <ChevronDown className={`w-3 h-3 transition ${open ? 'rotate-180' : ''}`} /> {open ? 'Less' : 'Hooks, proof, visual'}
          </button>
          {open && (
            <div className="mt-2 space-y-2 text-xs text-gray-300">
              {a.persona && <div><span className="text-gray-500">Persona:</span> {a.persona}</div>}
              {a.hooks.length > 1 && (
                <div>
                  <span className="text-gray-500">Hooks:</span>
                  <ul className="list-disc ml-4">{a.hooks.map((h, i) => <li key={i}>{h}</li>)}</ul>
                </div>
              )}
              {a.proof.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {a.proof.map((p, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-green-950 text-green-300 text-[10px]">{p}</span>)}
                </div>
              )}
              {a.visualIdea && <div><span className="text-gray-500">Visual:</span> {a.visualIdea} <span className="text-gray-500">· highlight {a.placementFocus}</span></div>}
              <div><span className="text-gray-500">Copy framework:</span> {a.framework}</div>
            </div>
          )}
          {a.risks.length > 0 && (
            <div className="mt-2 text-[11px] text-amber-300 flex gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {a.risks.join(' · ')}
            </div>
          )}
        </div>
        <button onClick={onRemove} title="Remove" className="text-gray-600 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
