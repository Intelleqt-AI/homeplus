// DEV BYPASS: localStorage-backed store for MOT-generated tasks while the
// scoring + scheduling backend isn't live. Each generated task carries the
// originating template id so the wizard can hydrate previously-saved dates.

import { getTemplate, type TaskTemplate, type TradeRoute } from '@/lib/taskTemplates';

const STORAGE_KEY = 'homeplus.mot.tasks';

export interface MotTask {
  /** Unique id (locally generated) */
  id: string;
  /** Template id the task was generated from */
  templateId: string;
  title: string;
  /** ISO date string YYYY-MM-DD — when the next occurrence is due */
  date: string;
  /** ISO date string YYYY-MM-DD — when the user should be reminded */
  reminderDate: string;
  /** The date the user said it was last done */
  lastCompletedDate: string;
  category: TaskTemplate['category'];
  /** Recurrence in months, or null if one-off */
  frequencyMonths: number | null;
  tradeRoute: TradeRoute | null;
  createdAt: string;
}

const readAll = (): MotTask[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MotTask[]) : [];
  } catch {
    return [];
  }
};

const writeAll = (tasks: MotTask[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const genId = () => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `mot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const addMonths = (iso: string, months: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

/**
 * Build the next-due task from a template and the user-supplied last-completed date.
 * For weekly cadences (bin collection) we treat `frequencyMonths` as null and just
 * carry the date forward — UI can show "next Mon" / etc.
 */
export const buildTask = (
  template: TaskTemplate,
  lastCompletedDate: string
): MotTask => {
  const nextDate =
    template.frequencyMonths != null
      ? addMonths(lastCompletedDate, template.frequencyMonths)
      : lastCompletedDate; // one-off — use the supplied date as-is
  const reminderDate = addDays(nextDate, -template.reminderLeadDays);
  return {
    id: genId(),
    templateId: template.id,
    title: template.label,
    date: nextDate,
    reminderDate,
    lastCompletedDate,
    category: template.category,
    frequencyMonths: template.frequencyMonths,
    tradeRoute: template.tradeRoute,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Persist a batch of generated tasks. For each template id we replace any
 * previously-generated task so re-running the wizard with a new date moves
 * the existing task instead of duplicating it.
 */
export const persistGeneratedTasks = (tasks: MotTask[]) => {
  const existing = readAll();
  const incomingTemplateIds = new Set(tasks.map((t) => t.templateId));
  const kept = existing.filter((t) => !incomingTemplateIds.has(t.templateId));
  writeAll([...kept, ...tasks]);
};

export const getMotTasks = (): MotTask[] => readAll();

/** Last-completed dates keyed by template id (used by the wizard to hydrate). */
export const getLastCompletedDates = (): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const t of readAll()) out[t.templateId] = t.lastCompletedDate;
  return out;
};

export const removeMotTaskByTemplate = (templateId: string) => {
  writeAll(readAll().filter((t) => t.templateId !== templateId));
};

/** Convenience: shape an MotTask like the calendar's Event row. */
export const motTaskAsEvent = (t: MotTask) => {
  const tmpl = getTemplate(t.templateId);
  return {
    id: t.id,
    title: t.title,
    date: t.date,
    type: t.category.toLowerCase(),
    recurring:
      t.frequencyMonths === 1
        ? 'monthly'
        : t.frequencyMonths === 12
          ? 'annually'
          : t.frequencyMonths === 120
            ? 'every-10-years'
            : 'never',
    description: tmpl?.hint ?? '',
    motSourceTemplate: t.templateId,
    motTradeRoute: t.tradeRoute,
    reminderDate: t.reminderDate,
  };
};
