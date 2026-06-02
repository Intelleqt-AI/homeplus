import { useEffect, useMemo, useState } from 'react';
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
import { templatesForStep, getTemplate, type TaskTemplate } from '@/lib/taskTemplates';
import { buildTask, persistGeneratedTasks, removeMotTaskByTemplate } from '@/lib/motTasks';
import { useQueryClient } from '@tanstack/react-query';

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
}

const todayIso = () => new Date().toISOString().split('T')[0];

const HomeMotWizard = ({
  step,
  open,
  onOpenChange,
  initialAnswers,
  initialDates,
  onSave,
}: HomeMotWizardProps) => {
  const config = step ? STEP_CONFIG[step] : null;
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const wizardQueryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setAnswers(initialAnswers ?? {});
      setDates(initialDates ?? {});
    }
  }, [open, step, initialAnswers, initialDates]);

  // Live-sync MOT-generated tasks whenever the user toggles a tick or changes
  // a date. Persisting on Save still happens via handleSave, but we no longer
  // require it — the task lands on the calendar the moment a date is added.
  useEffect(() => {
    if (!config || !step) return;
    for (const q of config.questions) {
      if (!q.templateId) continue;
      const template = getTemplate(q.templateId);
      if (!template) continue;
      const date = dates[q.id];
      if (answers[q.id] && date) {
        persistGeneratedTasks([buildTask(template, date)]);
      } else {
        removeMotTaskByTemplate(q.templateId);
      }
    }
    // Refresh anything that lists events (calendar grid, upcoming list, etc).
    wizardQueryClient.invalidateQueries({ queryKey: ['event'] });
  }, [answers, dates, config, step, wizardQueryClient]);

  const yesCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  if (!config) return null;

  const Icon = config.icon;
  const estimatedPoints = Math.min(
    config.maxPoints,
    Math.round(yesCount * config.pointsPerYes * 10) / 10
  );

  const tickedTemplateQuestions = config.questions.filter(
    (q) => answers[q.id] && q.templateId
  );
  const tasksToGenerate = tickedTemplateQuestions.length;

  const toggle = (id: string, templateId?: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // When ticking a template-backed item with no date yet, seed today.
      if (next[id] && templateId && !dates[id]) {
        setDates((d) => ({ ...d, [id]: todayIso() }));
      }
      return next;
    });
  };

  const setDate = (id: string, value: string) =>
    setDates((prev) => ({ ...prev, [id]: value }));

  const handleSave = () => {
    if (!step) return;

    // Generate + persist recurring tasks from the ticked template-backed answers.
    const generated = tickedTemplateQuestions
      .map((q) => {
        const template = templatesForStep(step === 'B' ? 'A' : step).find(
          (t) => t.id === q.templateId
        ) as TaskTemplate | undefined;
        if (!template) return null;
        return buildTask(template, dates[q.id] ?? todayIso());
      })
      .filter(Boolean) as ReturnType<typeof buildTask>[];

    if (generated.length) persistGeneratedTasks(generated);
    onSave?.(step, answers, dates);

    const label =
      step === 'A' ? 'Compliance' : step === 'B' ? 'Documents' : 'Maintenance';
    if (generated.length) {
      toast.success(
        `${label} check saved — +${estimatedPoints} pts · ${generated.length} task${generated.length === 1 ? '' : 's'} scheduled`
      );
    } else {
      toast.success(`${label} check saved — +${estimatedPoints} pts`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-[#FEF9E7] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
            </div>
            <div className="text-left">
              <DialogTitle className="text-[#1A1A1A] text-lg font-semibold">
                {config.title}
              </DialogTitle>
              <p className="text-[#6B6B6B] text-xs mt-0.5">{config.subtitle}</p>
            </div>
          </div>
          <p className="text-[#6B6B6B] text-sm pt-2">{config.description}</p>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {config.questions.map((q) => {
            const checked = !!answers[q.id];
            const template = q.templateId
              ? templatesForStep('A').concat(templatesForStep('C')).find((t) => t.id === q.templateId)
              : null;
            return (
              <div
                key={q.id}
                className={`rounded-[12px] border transition-colors ${
                  checked
                    ? 'bg-[#FEF9E7] border-[#FBBF24]'
                    : 'bg-white border-[#E8E8E3] hover:bg-[#F5F5F0]'
                }`}
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
                    {q.placeholder && (
                      <p className="text-[10px] text-[#A1A1A1] mt-1 italic">
                        placeholder wording — confirm with product
                      </p>
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
                        onChange={(e) => setDate(q.id, e.target.value)}
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

        <div className="flex items-center justify-between border-t border-[#E8E8E3] pt-4">
          <div className="text-sm text-[#6B6B6B]">
            <span className="text-[#1A1A1A] font-semibold">{yesCount}</span> of{' '}
            {config.questions.length} ticked
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
                task{tasksToGenerate === 1 ? '' : 's'} to schedule
              </>
            )}
          </div>
          <div className="flex gap-2">
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
