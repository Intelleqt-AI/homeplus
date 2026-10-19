import type { ElementType } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { CalendarDays, FileText, Home, Leaf, ListChecks, Upload, Wrench } from 'lucide-react';
import { TRADE_OPTIONS, getTradeCategoryLabel } from '@/lib/tradeCategories';
import type { QuotePrefill } from '@/components/topbar/Quote';
import type { HomeMotStep } from '@/components/homemot/HomeMotWizard';
import type {
  SystemActionPrefill, SystemEventDraft, SystemHealthAction, SystemQuoteDraft, SystemUploadDraft,
} from '@/lib/Api2';

// System → the trade a generic "Get quotes" goes to (older backends send no draft).
export const SYSTEM_TRADE: Record<string, string> = {
  heating: 'gas_engineer', electrical: 'electrical', plumbing: 'plumbing', roof: 'roofing', safety: 'electrical',
};

export const ACTION_BUTTON: Record<SystemHealthAction['kind'], { label: string; icon: ElementType }> = {
  upload: { label: 'Upload', icon: Upload },
  quote: { label: 'Get quotes', icon: Wrench },
  calendar: { label: 'Open calendar', icon: CalendarDays },
  mot: { label: 'Open check', icon: ListChecks },
  documents: { label: 'Open documents', icon: FileText },
  epc: { label: 'View EPC', icon: Leaf },
  property: { label: 'Edit home', icon: Home },
};

// Deep links: each page opens the item, then clears the params.
export const eventLink = (id: string, view: 'detail' | 'complete' = 'detail') =>
  `/dashboard/calendar?event=${encodeURIComponent(id)}&view=${view}`;
export const documentLink = (id: string, open: 'preview' | 'edit' = 'preview') =>
  `/dashboard/documents?doc=${encodeURIComponent(id)}&open=${open}`;
/** The Log work page: earlier tasks still open, optionally for one system. */
export const logWorkLink = (system?: string) =>
  `/dashboard/log-work${system ? `?system=${encodeURIComponent(system)}` : ''}`;
export const propertyEditLink = (id: string, field?: string) =>
  `/dashboard/settings?tab=properties&edit=${encodeURIComponent(id)}${field ? `&field=${field}` : ''}`;

export type SystemActionHandlers = {
  navigate: NavigateFunction;
  propertyId?: string | null;
  onUpload: (draft?: SystemUploadDraft) => void;
  onQuote: (prefill: QuotePrefill) => void;
  onMot: (step: HomeMotStep, focus?: string) => void;
  /** Open Add Event prefilled: a task or a reminder. */
  onLogWork: (draft: SystemEventDraft) => void;
};

/** "Post a Job" prefill from a backend draft: trade/category slugs → the labels Quote.tsx expects. */
export const quotePrefillFromDraft = (draft: SystemQuoteDraft, propertyId?: string | null): QuotePrefill => ({
  title: draft.title,
  service: TRADE_OPTIONS.find(o => o.value === draft.trade)?.label,
  category: draft.trade_category ? getTradeCategoryLabel(draft.trade_category) : undefined,
  property: propertyId ?? undefined,
  description: draft.description,
  timeframe: draft.timeframe,
  priority: draft.priority,
  answers: draft.answers,
});

/** Run one "What to do next" step — shared by the details dialog and the dashboard rows. */
export function runSystemAction(action: SystemHealthAction, systemKey: string, h: SystemActionHandlers) {
  const p: SystemActionPrefill = action.prefill ?? {};
  switch (action.kind) {
    case 'upload':
      return h.onUpload({ name: p.name, discipline: p.discipline, doc_type: p.doc_type, category: p.category });
    case 'quote': {
      const draft: SystemQuoteDraft = p.title
        ? { ...p, title: p.title }
        : { title: action.title, trade: action.trade || SYSTEM_TRADE[systemKey], trade_category: action.trade_category };
      return h.onQuote(quotePrefillFromDraft(draft, h.propertyId));
    }
    case 'mot':
      return h.onMot(p.step ?? action.step ?? 'A', p.focus);
    case 'documents': {
      const id = p.document_id ?? action.document_id;
      return h.navigate(id ? documentLink(id, p.open) : '/dashboard/documents');
    }
    case 'epc':
      return h.navigate('/dashboard/energy');
    case 'property': {
      const id = p.property_id ?? h.propertyId;
      return h.navigate(id ? propertyEditLink(id, p.field) : '/dashboard/settings?tab=properties');
    }
    default: {
      if (p.log_work) return h.navigate(logWorkLink(p.log_work));
      if (p.new_event) return h.onLogWork(p.new_event);
      const id = p.event_id ?? action.event_id;
      return h.navigate(id ? eventLink(id, p.view) : '/dashboard/calendar');
    }
  }
}
