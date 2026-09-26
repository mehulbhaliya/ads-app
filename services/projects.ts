import { StudioProject } from '../types';

const KEY = 'dn_studio_projects_v1';
const ACTIVE_KEY = 'dn_studio_active_project_v1';

export function loadProjects(): StudioProject[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveProjects(projects: StudioProject[]): void {
  try {
    // Reference images can be large: keep only the last 3 per chat so storage doesn't overflow.
    const slim = projects.map((p) => ({
      ...p,
      chat: p.chat.map((m, i) => (i < p.chat.length - 3 && m.images ? { ...m, images: undefined } : m)),
    }));
    localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    /* storage full or blocked: the project lives for this session only */
  }
}

export function loadActiveProjectId(): string {
  try {
    return localStorage.getItem(ACTIVE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function newProject(courseCode: string, courseLabel: string): StudioProject {
  const now = new Date().toISOString();
  return {
    id: `p_${Date.now().toString(36)}`,
    name: `${courseLabel} · ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
    courseCode,
    goal: 'SALES',
    dailyBudget: 750,
    targetCpa: 0,
    chat: [],
    angles: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** True when the approved plan no longer matches the starred angles. */
export function planIsStale(p: StudioProject): boolean {
  if (!p.plan) return false;
  const starred = p.angles.filter((a) => a.starred).map((a) => a.id).sort().join(',');
  return starred !== [...p.plan.basedOn].sort().join(',');
}
