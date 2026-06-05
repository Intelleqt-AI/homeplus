// MOT tasks are now persisted on the backend (apps.homemot) and surfaced on the
// calendar/dashboard via /api/v1/events/ (each task creates a linked Event).
// This module only keeps the shared type — all data access lives in
// src/lib/Api2.ts (fetchMotTasks / upsertMotTask / deleteMotTask / etc.).

import type { TaskTemplate, TradeRoute } from '@/lib/taskTemplates';

export interface MotTask {
  /** Server id (UUID) */
  id: string;
  /** Template slug the task was generated from */
  templateId: string;
  title: string;
  /** ISO date YYYY-MM-DD — when the next occurrence is due */
  date: string;
  /** ISO date YYYY-MM-DD — when the user should be reminded */
  reminderDate: string;
  /** The date the user said it was last done */
  lastCompletedDate: string;
  category: TaskTemplate['category'];
  frequencyMonths: number | null;
  tradeRoute: TradeRoute | null;
  /** overdue | action_required | scheduled (server-computed) */
  status?: string;
  createdAt: string;
}
