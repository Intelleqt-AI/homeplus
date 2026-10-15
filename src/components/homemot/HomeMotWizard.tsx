import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Shield, FileText, Wrench, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { templatesForStep, type TaskTemplate } from '@/lib/taskTemplates';
import {
  deleteMotTask,
  fetchMotTemplates,
  updateMotScore,
  upsertMotTask,
} from '@/lib/Api2';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type HomeMotStep = 'A' | 'B' | 'C';

interface WizardQuestion {
  id: string;
  text: string;
  hint?: string;
  /** When set, ticking this question creates a recurring task from the template. */
  templateId?: string;
  placeholder?: boolean;
}

interface WizardConfig {
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Shield;
  pointsPerYes: number;
  maxPoints: number;
  questions: WizardQuestion[];
}

const questionsFromStep = (step: 'A' | 'C'): WizardQuestion[] =>
  templatesForStep(step).map((t) => ({
    id: t.id,
    text: t.question,
    hint: t.hint,
    templateId: t.id,
  }));

export const STEP_CONFIG: Record<HomeMotStep, WizardConfig> = {
  A: {
    title: 'Step A — Quick Compliance check',
    subtitle: '60 seconds · up to ~15 Compliance points',
    description:
      "Tick the items that are currently true. Each yes earns 50% of the item's points and books a follow-up.",
    icon: Shield,
    pointsPerYes: 2.14,
    maxPoints: 15,
    questions: questionsFromStep('A'),
  },
  B: {
    // Documents step — no recurring-task generation; placeholders pending product.
    title: 'Step B — Quick Documents check',
    subtitle: '60 seconds · up to ~15 Documents points',
    description: 'Tick what you have. Upload later.',
    icon: FileText,
    pointsPerYes: 1.5,
    maxPoints: 15,
    questions: [
      { id: 'b1', text: 'Buildings insurance policy', placeholder: true },
      { id: 'b2', text: 'Contents insurance policy', placeholder: true },
      { id: 'b3', text: 'Boiler service record / Gas Safe certificate', placeholder: true },
      { id: 'b4', text: 'EICR (Electrical Installation Condition Report)', placeholder: true },
      { id: 'b5', text: 'EPC (Energy Performance Certificate)', placeholder: true },
      { id: 'b6', text: 'Mortgage agreement / title deeds', placeholder: true },
      { id: 'b7', text: 'Property floor plan or survey', placeholder: true },
      { id: 'b8', text: 'Appliance warranties / receipts', placeholder: true },
      { id: 'b9', text: 'Council tax bill / utility account details', placeholder: true },
      { id: 'b10', text: 'Tenancy / leasehold documents (if applicable)', placeholder: true },
    ],
  },
  C: {
    title: 'Step C — Quick Maintenance check',
    subtitle: '60 seconds · up to ~15 Maintenance points',
    description: 'Tick what applies. Each yes earns points and creates a forward-looking task.',
    icon: Wrench,
    pointsPerYes: 2.5,
    maxPoints: 15,
    questions: questionsFromStep('C'),
  },
};

interface HomeMotWizardProps {
  step: HomeMotStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAnswers?: Record<string, boolean>;
  initialDates?: Record<string, string>;
  onSave?: (
    step: HomeMotStep,
    answers: Record<string, boolean>,
    dates: Record<string, string>
  ) => void;
  /** Which property this check's tasks/score belong to. */
  propertyId?: string | null;
  /** Question to scroll to and highlight (e.g. "boiler-service" from System Health). */
  focusQuestion?: string | null;
}

const todayIso = () => new Date().toISOString().split('T')[0];

const HomeMotWizard = ({
  step,
  open,
  onOpenChange,
  initialAnswers,
  initialDates,
  onSave,
  propertyId,
  focusQuestion,
}: HomeMotWizardProps) => {
  const config = step ? STEP_CONFIG[step] : null;
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  // Canonical templates from the backend (network-visible). Falls back to the
  // bundled static catalog while loading / on error — same data as the seed.
  const { data: tplData } = useQuery({
    queryKey: ['mot-templates'],
    queryFn: fetchMotTemplates,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const templates = useMemo<TaskTemplate[]>(() => {
    const fetched = tplData?.data;
    if (Array.isArray(fetched) && fetched.length) return fetched as TaskTemplate[];
    return [...templatesForStep('A'), ...templatesForStep('C')];
  }, [tplData]);

  // Active-step questions: A/C are template-driven; B keeps static placeholders.
  const questions = useMemo<WizardQuestion[]>(() => {
    if (!step) return [];
    if (step === 'B') return STEP_CONFIG.B.questions;
    return templates
      .filter((t) => t.motStep === step)
      .map((t) => ({ id: t.id, text: t.question, hint: t.hint, templateId: t.id }));
  }, [step, templates]);

  // Hold the latest initial values without making them effect deps. Otherwise
  // the dashboard recreating these objects (`?? {}`) or refetching after a
  // mutation would re-run the reset and wipe an in-progress tick (auto-untick).
  const initialAnswersRef = useRef(initialAnswers);
  const initialDatesRef = useRef(initialDates);
  const questionsRef = useRef(questions);
  initialAnswersRef.current = initialAnswers;
  initialDatesRef.current = initialDates;
  questionsRef.current = questions;

  // Hydrate only when the dialog opens or the step changes — not on prop identity.
  // Only this step's questions: stray keys from old data must not count or be re-saved.
  useEffect(() => {
    if (open) {
      const ids = new Set(questionsRef.current.map((q) => q.id));
      setAnswers(
        Object.fromEntries(Object.entries(initialAnswersRef.current ?? {}).filter(([id]) => ids.has(id)))
      );
      setDates(initialDatesRef.current ?? {});
    }
  }, [open, step]);

  // Refresh everything that depends on MOT data after a task mutation: the
  // calendar/dashboard events (linked Event), the task list, hydration dates and
  // System Health (a saved "yes" with its date is one of its records).
  const invalidateTasks = () => {
    ['event', 'mot-tasks', 'mot-last-completed', 'systems-health'].forEach((key) =>
      qc.invalidateQueries({ queryKey: [key] })
    );
  };

  const upsertMut = useMutation({
    mutationFn: (vars: { templateId: string; lastCompletedDate: string }) =>
      upsertMotTask({ ...vars, property: propertyId }),
    onSuccess: invalidateTasks,
    onError: () => toast.error("Couldn't schedule that task"),
  });
  const deleteMut = useMutation({
    mutationFn: (templateId: string) => deleteMotTask(templateId, propertyId),
    onSuccess: invalidateTasks,
    onError: () => toast.error("Couldn't remove that task"),
  });
  const scoreMut = useMutation({
    mutationFn: ({ step: s, answers: a }: { step: HomeMotStep; answers: Record<string, boolean> }) =>
      updateMotScore(s, a, propertyId),
    onSuccess: () => ['mot-score', 'systems-health'].forEach((key) => qc.invalidateQueries({ queryKey: [key] })),
  });

  const yesCount = useMemo(
    () => questions.filter((q) => answers[q.id]).length,
    [answers, questions]
  );

  // Bring the question System Health pointed at into view once the dialog has opened.
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !focusQuestion) return;
    const t = window.setTimeout(
      () => focusRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      250
    );
    return () => window.clearTimeout(t);
  }, [open, focusQuestion, questions.length]);

  if (!config || !step) return null;

  const Icon = config.icon;
  const estimatedPoints = Math.min(
    config.maxPoints,
    Math.round(yesCount * config.pointsPerYes * 10) / 10
  );

  const tickedTemplateQuestions = questions.filter(
    (q) => answers[q.id] && q.templateId
  );
  const tasksToGenerate = tickedTemplateQuestions.length;

  // Tick/untick a question. Template-backed items POST (upsert) on tick and
  // DELETE on untick — one precise API call per user action.
  const toggle = (id: string, templateId?: string) => {
    const willCheck = !answers[id];
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!templateId) return; // Step B placeholders are scoring-only.
    if (willCheck) {
      const date = dates[id] ?? todayIso();
      if (!dates[id]) setDates((prev) => ({ ...prev, [id]: date }));
      upsertMut.mutate({ templateId, lastCompletedDate: date });
    } else {
      deleteMut.mutate(templateId);
    }
  };

  // Change the last-completed date → re-upsert (server recomputes next-due).
  const setDate = (id: string, value: string, templateId?: string) => {
    setDates((prev) => ({ ...prev, [id]: value }));
    if (templateId && answers[id]) {
      upsertMut.mutate({ templateId, lastCompletedDate: value });
    }
  };

  const handleSave = () => {
    // Tasks are already persisted live on tick/date-change; Save just commits
    // the step's answers to the score.
    // Only this step's questions, as answered (untouched ones stay "not answered").
    const ids = new Set(questions.map((q) => q.id));
    const own = Object.fromEntries(Object.entries(answers).filter(([id]) => ids.has(id)));
    scoreMut.mutate({ step, answers: own });
    onSave?.(step, own, dates);

    const label =
      step === 'A' ? 'Compliance' : step === 'B' ? 'Documents' : 'Maintenance';
    toast.success(`${label} check saved — +${estimatedPoints} pts`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#FEF9E7] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-[#1A1A1A] text-lg font-semibold">
                {config.title}
              </DialogTitle>
              <p className="text-[#6B6B6B] text-xs mt-0.5">{config.subtitle}</p>
            </div>
          </div>
          <p className="text-[#6B6B6B] text-sm pt-2">{config.description}</p>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {questions.map((q) => {
            const checked = !!answers[q.id];
            const template = q.templateId
              ? templates.find((t) => t.id === q.templateId)
              : null;
            return (
              <div
                key={q.id}
                ref={q.id === focusQuestion ? focusRef : undefined}
                data-question={q.id}
                className={`rounded-[12px] border transition-colors ${
                  checked
                    ? 'bg-[#FEF9E7] border-[#FBBF24]'
                    : 'bg-white border-[#E8E8E3] hover:bg-[#F5F5F0]'
                }${q.id === focusQuestion ? ' ring-2 ring-[#FBBF24] ring-offset-2' : ''}`}
              >
                <label
                  htmlFor={q.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <Checkbox
                    id={q.id}
                    checked={checked}
                    onCheckedChange={() => toggle(q.id, q.templateId)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1A1A1A] leading-snug">
                      {q.text}
                    </p>
                    {q.hint && (
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">{q.hint}</p>
                    )}
                  </div>
                </label>

                {/* Inline date capture + task preview when ticked */}
                {checked && template && (
                  <div className="px-3 pb-3 pl-12">
                    <div className="bg-white border border-[#FBBF24]/40 rounded-[10px] p-3">
                      <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                        {template.datePromptLabel}
                      </label>
                      <Input
                        type="date"
                        value={dates[q.id] ?? todayIso()}
                        onChange={(e) => setDate(q.id, e.target.value, q.templateId)}
                        className="h-9 text-sm"
                      />
                      <div className="mt-2 text-[11px] text-[#6B6B6B] flex items-start gap-1.5">
                        <Wand2 className="w-3 h-3 mt-0.5 text-[#FBBF24] shrink-0" />
                        <span>
                          We'll set up{' '}
                          <span className="text-[#1A1A1A] font-medium">
                            {template.label}
                          </span>{' '}
                          {template.frequencyMonths === 1
                            ? 'monthly'
                            : template.frequencyMonths === 12
                              ? 'yearly'
                              : template.frequencyMonths
                                ? `every ${template.frequencyMonths} months`
                                : 'as a one-off'}
                          {' '}with a reminder{' '}
                          <span className="text-[#1A1A1A] font-medium">
                            {template.reminderLeadDays} days
                          </span>{' '}
                          before it's due.
                          {template.tradeRoute && (
                            <>
                              {' '}You'll get a one-tap{' '}
                              <span className="text-[#1A1A1A] font-medium">
                                Find a trade
                              </span>{' '}
                              option to book a{' '}
                              <span className="text-[#1A1A1A] font-medium">
                                {template.tradeRoute.label}
                              </span>
                              .
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-[#E8E8E3] pt-4">
          <div className="text-sm text-[#6B6B6B]">
            <span className="text-[#1A1A1A] font-semibold">{yesCount}</span> of{' '}
            {questions.length} ticked
            <span className="mx-2 text-[#E8E8E3]">·</span>
            <span className="text-[#1A1A1A] font-semibold">
              +{estimatedPoints}
            </span>{' '}
            / {config.maxPoints} pts
            {tasksToGenerate > 0 && (
              <>
                <span className="mx-2 text-[#E8E8E3]">·</span>
                <span className="text-[#1A1A1A] font-semibold">
                  {tasksToGenerate}
                </span>{' '}
                task{tasksToGenerate === 1 ? '' : 's'} scheduled
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-full h-9 px-4 text-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full h-9 px-4 text-sm bg-[#1A1A1A] text-white hover:bg-[#333333]"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HomeMotWizard;
