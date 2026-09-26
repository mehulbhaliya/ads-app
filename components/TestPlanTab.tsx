import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, RefreshCw, AlertTriangle, FlaskConical } from 'lucide-react';
import { CourseFacts, StudioProject, TestPlan } from '../types';
import { buildTestPlan } from '../services/strategist';
import { planIsStale } from '../services/projects';

interface Props {
  project: StudioProject;
  course: CourseFacts;
  onChange: (p: StudioProject) => void;
  onBack: () => void;
  onNext: () => void;
}

export const TestPlanTab: React.FC<Props> = ({ project, course, onChange, onBack, onNext }) => {
  const [busy, setBusy] = useState(false);
  const plan = project.plan;
  const stale = planIsStale(project);
  const starred = project.angles.filter((a) => a.starred);

  const build = async () => {
    setBusy(true);
    try {
      const p = await buildTestPlan(project, course);
      onChange({ ...project, plan: p, updatedAt: new Date().toISOString() });
    } finally {
      setBusy(false);
    }
  };

  const setPlan = (patch: Partial<TestPlan>) => plan && onChange({ ...project, plan: { ...plan, ...patch, approved: false } });

  if (starred.length === 0) {
    return (
      <Empty>
        Star 2-4 angles in Brainstorm first.
        <button onClick={onBack} className="mt-4 px-4 py-2 rounded-lg bg-dn-gold text-dn-navy-deep text-xs font-bold">Go to Brainstorm</button>
      </Empty>
    );
  }

  if (!plan) {
    return (
      <Empty>
        <FlaskConical className="w-8 h-8 text-dn-gold mx-auto mb-3" />
        <p className="text-sm text-gray-300">
          Ready to plan a test of {starred.length} angle{starred.length > 1 ? 's' : ''}: <span className="text-white">{starred.map((a) => a.name).join(', ')}</span>.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          ₹{project.dailyBudget}/day · {project.goal === 'SALES' ? 'Sales' : 'Leads'}. One angle per ad set, 2-3 hooks per ad set, playbook rules for budget, KPIs and kill/scale.
        </p>
        <button onClick={build} disabled={busy} className="mt-5 px-5 py-2.5 rounded-lg bg-dn-gold text-dn-navy-deep text-sm font-bold inline-flex items-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Build the test plan
        </button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {stale && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-700 bg-amber-950/60 px-4 py-2 text-xs text-amber-100">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Your starred angles changed since this plan was built.</span>
          <button onClick={build} disabled={busy} className="flex items-center gap-1 underline">
            <RefreshCw className="w-3 h-3" /> Rebuild plan
          </button>
        </div>
      )}

      {/* Campaign summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Objective" value={plan.objective} />
        <Stat label="Structure" value={`${plan.budgetType} · ₹${plan.dailyBudget}/day · ${plan.adSets.length} ad sets`} />
        <Stat label="Optimise for" value={plan.optimisationEvent} />
        <Stat label="Test window" value={`${plan.durationDays} days, no edits`} />
      </div>

      <Card title="Campaign">
        <Mono>{plan.campaignName}</Mono>
        <p className="text-xs text-gray-400 mt-2">Bidding: {plan.bidStrategy}</p>
        <p className="text-xs text-gray-400">Placements: {plan.placements}</p>
      </Card>

      {/* Ad sets */}
      <div className="grid md:grid-cols-2 gap-3">
        {plan.adSets.map((s, si) => (
          <Card key={s.id} title={`Ad set ${si + 1}: ${s.angleName}`}>
            <Mono>{s.name}</Mono>
            <p className="text-xs text-gray-400 mt-2">
              <span className="text-gray-500">Variable:</span> {s.variable}
              {plan.budgetType === 'ABO' && <> · <span className="text-gray-500">Budget:</span> ₹{s.dailyBudget}/day</>}
            </p>
            <p className="text-xs text-gray-400"><span className="text-gray-500">Audience:</span> {s.audience}</p>
            <div className="mt-3 space-y-2">
              {s.ads.map((ad, ai) => (
                <div key={ai} className="rounded-lg bg-gray-950 border border-gray-800 p-2">
                  <div className="text-[10px] font-mono text-gray-500">{ad.name} · {ad.format}</div>
                  <input
                    value={ad.hook}
                    onChange={(e) => {
                      const adSets = plan.adSets.map((x, xi) => (xi !== si ? x : { ...x, ads: x.ads.map((y, yi) => (yi === ai ? { ...y, hook: e.target.value } : y)) }));
                      setPlan({ adSets });
                    }}
                    className="w-full bg-transparent text-sm text-amber-50 outline-none mt-0.5"
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Hypotheses">
        <div className="space-y-2">
          {plan.hypotheses.map((h, i) => (
            <div key={i} className="text-xs">
              <div className="text-gray-500">{h.angleName}</div>
              <textarea
                value={h.hypothesis}
                onChange={(e) => setPlan({ hypotheses: plan.hypotheses.map((x, xi) => (xi === i ? { ...x, hypothesis: e.target.value } : x)) })}
                rows={2}
                className="w-full bg-gray-950 border border-gray-800 rounded-md px-2 py-1 text-gray-200 outline-none focus:border-dn-gold"
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card title="How we judge it">
          <p className="text-xs text-white mb-2">Primary KPI: {plan.primaryKpi}</p>
          <ul className="text-xs text-gray-300 list-disc ml-4 space-y-1">{plan.checkpoints.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </Card>
        <Card title="Decision rules">
          <ul className="text-xs text-gray-300 space-y-1.5">
            <li><b className="text-red-300">Kill:</b> {plan.rules.kill}</li>
            <li><b className="text-amber-300">Iterate:</b> {plan.rules.iterate}</li>
            <li><b className="text-green-300">Scale:</b> {plan.rules.scale}</li>
            <li><b className="text-sky-300">Fatigue:</b> {plan.rules.fatigue}</li>
          </ul>
        </Card>
      </div>

      <Card title="Placements: what each size must highlight">
        <ul className="text-xs text-gray-300 list-disc ml-4 space-y-1">{plan.placementNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      </Card>

      {plan.missingInfo.length > 0 && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-100">
          <div className="font-semibold mb-1">Before launch</div>
          <ul className="list-disc ml-4 space-y-0.5">{plan.missingInfo.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={build} disabled={busy} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Rebuild from angles
        </button>
        {plan.approved && !stale ? (
          <button onClick={onNext} className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Approved · Make creatives <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              onChange({ ...project, plan: { ...plan, approved: true } });
              onNext();
            }}
            disabled={stale}
            className="px-5 py-2.5 rounded-lg bg-dn-gold text-dn-navy-deep text-sm font-bold flex items-center gap-2 disabled:opacity-40"
          >
            Approve plan <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-xl mx-auto text-center py-20 border border-dashed border-gray-800 rounded-2xl px-6 text-gray-400 text-sm flex flex-col items-center">{children}</div>
);
const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
    <div className="text-xs font-semibold text-dn-gold mb-2">{title}</div>
    {children}
  </div>
);
const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
    <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
    <div className="text-xs text-white mt-1">{value}</div>
  </div>
);
const Mono: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-[11px] text-gray-300 bg-gray-950 border border-gray-800 rounded px-2 py-1 break-all">{children}</div>
);
