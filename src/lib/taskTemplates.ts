// Pre-loaded task templates that drive the Home MOT wizard and the
// auto-generated recurring tasks / reminders / Find-a-trade routes.
//
// Each template is the canonical definition of a recurring home task:
// • the wizard exposes it as a tickable question
// • the task generator builds a calendar event from it with the correct
//   next-due date + lead-time reminder
// • the calendar surfaces a Find-a-Trade CTA when `tradeRoute` is set

export type TaskCategory = 'Safety' | 'Maintenance' | 'Financial' | 'Household';

export interface TradeRoute {
  /** Slug matching TRADE_OPTIONS in tradeCategories.ts */
  trade: string;
  /** Sub-category slug, optional */
  tradeCategory?: string;
  /** Human-friendly label shown in the UI */
  label: string;
}

export interface TaskTemplate {
  id: string;
  label: string;
  /** Wording shown when the template is offered as a wizard question */
  question: string;
  /** Wording for the inline "when was this last done?" prompt */
  datePromptLabel: string;
  category: TaskCategory;
  /** Recurrence in months. null = one-off (e.g. mortgage fix expiry). */
  frequencyMonths: number | null;
  /** Days before the next-due date to fire the reminder. */
  reminderLeadDays: number;
  /** Trade routing, or null if it's a DIY / one-tap / external-API item. */
  tradeRoute: TradeRoute | null;
  /** Hint shown under the question, optional. */
  hint?: string;
  /** Which MOT wizard step this template belongs to. */
  motStep: 'A' | 'C';
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  // ── Step A · Compliance / Safety ────────────────────────────────────────
  {
    id: 'boiler-service',
    label: 'Annual boiler service',
    question: 'Has your boiler been serviced in the last 12 months?',
    datePromptLabel: 'When was it last serviced?',
    category: 'Maintenance',
    frequencyMonths: 12,
    reminderLeadDays: 20,
    tradeRoute: {
      trade: 'gas_engineer',
      tradeCategory: 'gas_engineer_boilers',
      label: 'Gas Safe engineer',
    },
    hint: 'Best done Aug–Sep before heating season',
    motStep: 'A',
  },
  {
    id: 'gas-safety-check',
    label: 'Annual gas safety check',
    question: 'Have you had a gas safety check this year?',
    datePromptLabel: 'When was the last gas safety check?',
    category: 'Safety',
    frequencyMonths: 12,
    reminderLeadDays: 30,
    tradeRoute: {
      trade: 'gas_engineer',
      tradeCategory: 'gas_engineer_safety',
      label: 'Gas Safe engineer',
    },
    motStep: 'A',
  },
  {
    id: 'smoke-alarm-test',
    label: 'Test smoke alarms',
    question: 'Have your smoke alarms been tested in the last 30 days?',
    datePromptLabel: 'When did you last test them?',
    category: 'Safety',
    frequencyMonths: 1,
    reminderLeadDays: 3,
    tradeRoute: null,
    hint: 'One-tap to log — typically the 1st Sunday of the month',
    motStep: 'A',
  },
  {
    id: 'co-alarm-test',
    label: 'Test CO alarm',
    question: 'Do you have a CO alarm and is it tested?',
    datePromptLabel: 'When did you last test it?',
    category: 'Safety',
    frequencyMonths: 1,
    reminderLeadDays: 3,
    tradeRoute: null,
    hint: 'Test alongside smoke alarms',
    motStep: 'A',
  },
  {
    id: 'eicr-check',
    label: 'EICR (electrical inspection)',
    question: 'Have you had an EICR in the last 10 years (or done a visual electrical check)?',
    datePromptLabel: 'When was the last EICR?',
    category: 'Safety',
    frequencyMonths: 120,
    reminderLeadDays: 60,
    tradeRoute: {
      trade: 'electrical',
      tradeCategory: 'electrical_testing_certificates',
      label: 'Qualified electrician',
    },
    hint: 'Every 5 years for landlords, 10 years for homeowners',
    motStep: 'A',
  },
  {
    id: 'buildings-insurance',
    label: 'Buildings insurance renewal',
    question: 'Do you have buildings insurance in force?',
    datePromptLabel: 'When does the current policy renew?',
    category: 'Financial',
    frequencyMonths: 12,
    reminderLeadDays: 30,
    tradeRoute: {
      trade: 'other',
      label: 'Insurance broker partner',
    },
    motStep: 'A',
  },
  {
    id: 'home-safety-walk',
    label: '10-minute home safety walk',
    question: 'Have you done a 10-minute home safety walk this year?',
    datePromptLabel: 'When did you last do the safety walk?',
    category: 'Safety',
    frequencyMonths: 12,
    reminderLeadDays: 14,
    tradeRoute: null,
    motStep: 'A',
  },

  // ── Step C · Maintenance / Household / Financial ────────────────────────
  {
    id: 'gutter-clean',
    label: 'Clean gutters before autumn rains',
    question: 'Have you had the gutters cleaned in the last 12 months?',
    datePromptLabel: 'When were they last cleaned?',
    category: 'Maintenance',
    frequencyMonths: 12,
    reminderLeadDays: 30,
    tradeRoute: {
      trade: 'roofing',
      tradeCategory: 'roofing_gutters_fascias_soffits',
      label: 'Gutter cleaner',
    },
    hint: 'Best done mid-Sep before autumn rain',
    motStep: 'C',
  },
  {
    id: 'bleed-radiators',
    label: 'Bleed radiators before heating season',
    question: 'Have you bled the radiators before the heating season?',
    datePromptLabel: 'When did you last bleed them?',
    category: 'Maintenance',
    frequencyMonths: 12,
    reminderLeadDays: 14,
    tradeRoute: null,
    hint: 'DIY — best done late Oct',
    motStep: 'C',
  },
  {
    id: 'mortgage-fix-expiry',
    label: 'Mortgage fix expiring — start shopping rates',
    question: 'Is your mortgage on a fixed rate?',
    datePromptLabel: 'When does the fixed period end?',
    category: 'Financial',
    frequencyMonths: null,
    reminderLeadDays: 180,
    tradeRoute: {
      trade: 'other',
      label: 'Mortgage broker partner',
    },
    motStep: 'C',
  },
  {
    id: 'boiler-warranty-expiry',
    label: 'Boiler warranty expiry — plan replacement / extension',
    question: 'Is your boiler under warranty?',
    datePromptLabel: 'When does the warranty expire?',
    category: 'Financial',
    frequencyMonths: null,
    reminderLeadDays: 90,
    tradeRoute: {
      trade: 'gas_engineer',
      tradeCategory: 'gas_engineer_boilers',
      label: 'Gas Safe engineer (if replacing)',
    },
    motStep: 'C',
  },
  {
    id: 'bin-collection',
    label: 'Bin collection day',
    question: 'Do you want bin-day reminders enabled?',
    datePromptLabel: 'When is the next collection?',
    category: 'Household',
    frequencyMonths: null, // weekly — handled differently below
    reminderLeadDays: 1,
    tradeRoute: null,
    hint: 'Auto-pulled from council API when live',
    motStep: 'C',
  },
];

export const getTemplate = (id: string) =>
  TASK_TEMPLATES.find((t) => t.id === id);

export const templatesForStep = (step: 'A' | 'C') =>
  TASK_TEMPLATES.filter((t) => t.motStep === step);
