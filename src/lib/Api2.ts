import apiClient from '@/lib/apiClient';

// ─── Pagination-proof list fetching ──────────────────────────────────────────

/**
 * Fetch EVERY row of a list endpoint, whichever shape the server returns:
 *   - success envelope `{data: [...]}` (unpaginated viewsets)
 *   - DRF page `{count, next, results}` (paginated viewsets) — follows `next`
 *     links until exhausted.
 * Per-user collections are small (≤ a few hundred rows), so at page_size=100
 * this is 1–2 requests in practice. Without this, any account with more rows
 * than the server page size silently loses data off page 1 (calendar events,
 * documents, job leads).
 */
export const fetchAllPages = async (path: string): Promise<any[]> => {
  const sep = path.includes('?') ? '&' : '?';
  let url: string | null = `${path}${sep}page_size=100`;
  const out: any[] = [];
  for (let guard = 0; url && guard < 30; guard++) {
    const { data: res } = await apiClient.get(url);
    const body = res?.data ?? res;
    if (Array.isArray(body)) {
      out.push(...body);
      break;
    }
    out.push(...(body?.results ?? []));
    url = body?.next ?? null; // absolute URL; axios uses it verbatim (same API origin)
  }
  return out;
};

// ─── Events ──────────────────────────────────────────────────────────────────

const normEvent = (ev: any) => ({
  id: ev.id,
  title: ev.title,
  date: ev.date ? new Date(ev.date).toISOString() : null,
  time: ev.time ?? null,
  eventType: ev.event_type
    ? ev.event_type.charAt(0).toUpperCase() + ev.event_type.slice(1)
    : 'Maintenance',
  type: ev.compliance_type && ev.compliance_type !== 'none'
    ? 'compliance'
    : ev.requires_trade
    ? 'service'
    : 'reminder',
  priority: ev.priority ?? 'medium',
  status: ev.status ?? 'pending',
  // Server-computed, date-aware escalation (action_required/overdue/scheduled)
  // and the reminder fire date. Drives the calendar highlight + Get Quotes.
  actionStatus: ev.action_status ?? ev.status ?? 'pending',
  reminderDate: ev.reminder_date ?? null,
  recurring: ev.recurring ?? 'never',
  compliance_type: ev.compliance_type ?? 'none',
  complianceType: ev.compliance_type ?? 'none',
  isRequireTrade: ev.requires_trade ?? false,
  requires_trade: ev.requires_trade ?? false,
  // Trade taxonomy (slug form, e.g. 'gas_engineer', 'gas_engineer_boilers').
  // Empty for reminders + legacy events with no trade set.
  trade: ev.trade ?? '',
  tradeCategory: ev.trade_category ?? '',
  description: ev.description ?? '',
  notes: ev.notes ?? '',
  property: ev.property ?? null,
  created_at: ev.created_at,
  updated_at: ev.updated_at,
});

export const addNewEvent = async (event: any) => {
  const payload: any = {
    title: event.title,
    date: event.date
      ? new Date(event.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    event_type: (event.eventType || event.event_type || 'maintenance').toLowerCase(),
    priority: event.priority ?? 'medium',
    recurring: event.recurring ?? 'never',
    compliance_type: event.complianceType || event.compliance_type || 'none',
    requires_trade: event.isRequireTrade ?? event.requires_trade ?? false,
    trade: event.trade ?? '',
    trade_category: event.tradeCategory ?? event.trade_category ?? '',
    description: event.description ?? '',
  };

  if (event.time) payload.time = event.time;
  if (event.property) payload.property = event.property;

  const { data: res } = await apiClient.post('/api/v1/events/', payload);
  return { data: normEvent(res.data) };
};

export const getEvents = async () => {
  const events = await fetchAllPages('/api/v1/events/');
  return { data: events.map(normEvent) };
};

/**
 * Delete an event.
 *
 * For recurring events the caller chooses what to delete:
 *   - 'this'             — only this occurrence (chain auto-promotes if root)
 *   - 'this_and_future'  — this + all later non-completed siblings; stops the series
 *   - 'all'              — root + every non-completed sibling (completed history preserved)
 *
 * Non-recurring events ignore the scope.
 */
export type DeleteScope = 'this' | 'this_and_future' | 'all';

export const deleteEvent = async (eventId: string, scope: DeleteScope = 'this') => {
  await apiClient.delete(`/api/v1/events/${eventId}/?scope=${scope}`);
  return { ok: true };
};

/** Mark an event completed, optionally recording what it cost (feeds Annual Spend). */
export const completeEvent = async (eventId: string, actualCost?: number | null) => {
  const body = actualCost != null ? { actual_cost: actualCost } : {};
  const { data: res } = await apiClient.post(`/api/v1/events/${eventId}/complete/`, body);
  return { data: res?.data ? normEvent(res.data) : null };
};

/** Snooze an event by pushing its date forward by 1, 7, or 14 days. */
export const snoozeEvent = async (eventId: string, days: 1 | 7 | 14) => {
  const { data: res } = await apiClient.post(`/api/v1/events/${eventId}/snooze/`, { days });
  return { data: res?.data ? normEvent(res.data) : null };
};

export const exportDocumentPack = async (documentIds: string[]): Promise<void> => {
  const response = await apiClient.post(
    '/api/v1/documents/export-pack/',
    { document_ids: documentIds },
    { responseType: 'blob' },
  );
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'homeplus-home-pack.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ─── MOT Templates & Tasks ───────────────────────────────────────────────────

export const getMotTemplates = async () => {
  const { data: res } = await apiClient.get('/api/v1/mot/templates/');
  return (res.data ?? res) as any[];
};

export const getMotTasks = async () => {
  const { data: res } = await apiClient.get('/api/v1/mot/tasks/');
  return (res.data ?? res) as any[];
};

export const enableMotTemplate = async (templateId: string, lastCompletedDate: string) => {
  const { data: res } = await apiClient.post('/api/v1/mot/tasks/', {
    templateId,
    lastCompletedDate,
  });
  return res.data ?? res;
};

export const disableMotTemplate = async (templateId: string) => {
  await apiClient.delete(`/api/v1/mot/tasks/${templateId}/`);
};

// ─── Properties ──────────────────────────────────────────────────────────────

/**
 * Normalize a Django Property to the legacy shape:
 * { id, user_id, address, type, bedrooms, bathrooms, role }
 */
const normProperty = (prop: any) => ({
  id: prop.id,
  user_id: null,               // not returned by Django — not needed
  address: prop.address,
  type: prop.property_type,    // legacy used `type`
  property_type: prop.property_type,
  postcode: prop.postcode,
  bedrooms: prop.bedrooms,
  bathrooms: prop.bathrooms,
  role: prop.role,
  cover_image: prop.cover_image ?? null,
  cover_image_url: prop.cover_image_url ?? null,
  created_at: prop.created_at,
});

export const getProperty = async () => {
  const { data: res } = await apiClient.get('/api/v1/properties/');
  const list: any[] = res.data ?? res.results ?? [];
  // Return the first property (most apps have one primary property)
  const prop = list[0] ?? null;
  return { data: prop ? normProperty(prop) : null };
};

// ─── Cover Image ─────────────────────────────────────────────────────────────

/**
 * Upload a property cover image.
 * Legacy call: uploadCover({ file, id: propertyId, metadata })
 *
 * We first need the property id. If `id` is the user id (old Supabase path),
 * we fall back to fetching the first property.
 */
export const uploadCover = async ({
  file,
  id,
  metadata: _metadata,
}: {
  file: File;
  id: string;
  metadata?: any;
}) => {
  if (!file) throw new Error('No file provided.');

  // `id` may be a property UUID or a user UUID (legacy).
  // Try using it as a property id directly; on 404 fall back to fetching properties.
  let propertyId = id;

  try {
    const { data: propRes } = await apiClient.get(`/api/v1/properties/${id}/`);
    propertyId = propRes.data?.id ?? id;
  } catch {
    // id is not a property id — fetch the first property
    try {
      const { data: listRes } = await apiClient.get('/api/v1/properties/');
      const list: any[] = listRes.data ?? listRes.results ?? [];
      if (list.length > 0) {
        propertyId = list[0].id;
      }
    } catch {
      // proceed with original id
    }
  }

  const form = new FormData();
  form.append('file', file);

  const { data: res } = await apiClient.post(
    `/api/v1/properties/${propertyId}/cover-image/`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return { path: res.data?.cover_image, id: propertyId };
};

/**
 * getCoverImage returns a normalized array matching the legacy shape used by
 * HomePlusDashboard:
 * [{ id, name, publicUrl, metadata: { mimetype } }]
 */
export const getCoverImage = async (propertyId: string) => {
  try {
    const { data: res } = await apiClient.get(
      `/api/v1/properties/${propertyId}/cover-image/`
    );
    const url = res.data?.url;
    if (!url) return [];
    return [
      {
        id: `cover-${propertyId}`,
        name: 'cover.jpg',
        publicUrl: url,
        metadata: { mimetype: 'image/jpeg' },
      },
    ];
  } catch {
    return [];
  }
};

// ─── Home MOT ──────────────────────────────────────────────────────────────────
// All MOT data now comes from the backend (apps.homemot). Tasks also create a
// linked calendar Event server-side, so the calendar/dashboard pick them up via
// getEvents() — no separate client merge needed.

/** GET /api/v1/mot/templates/ — the 12 canonical task templates (camelCase). */
export const fetchMotTemplates = async () => {
  const { data: res } = await apiClient.get('/api/v1/mot/templates/');
  const templates: unknown[] = res.data ?? res.results ?? [];
  return { data: templates };
};

/** GET /api/v1/mot/tasks/ — the user's generated MOT tasks. */
export const fetchMotTasks = async () => {
  const { data: res } = await apiClient.get('/api/v1/mot/tasks/');
  const tasks: unknown[] = res.data ?? res.results ?? [];
  return { data: tasks };
};

/**
 * POST /api/v1/mot/tasks/ — upsert a MOT task (replace by template id). The
 * server computes next-due + reminder and syncs the linked calendar Event.
 */
export const upsertMotTask = async (payload: {
  templateId: string;
  lastCompletedDate: string;
  property?: string | null;
}) => {
  const body: Record<string, unknown> = {
    templateId: payload.templateId,
    lastCompletedDate: payload.lastCompletedDate,
  };
  if (payload.property) body.property = payload.property;
  const { data: res } = await apiClient.post('/api/v1/mot/tasks/', body);
  return { data: res.data };
};

/** DELETE /api/v1/mot/tasks/{templateId}/ — remove the task + its linked event. */
export const deleteMotTask = async (templateId: string) => {
  await apiClient.delete(`/api/v1/mot/tasks/${templateId}/`);
  return { ok: true };
};

/** GET /api/v1/mot/last-completed/ — { templateId: 'YYYY-MM-DD' } for hydration. */
export const fetchLastCompleted = async () => {
  const { data: res } = await apiClient.get('/api/v1/mot/last-completed/');
  return { data: (res.data ?? {}) as Record<string, string> };
};

/** GET /api/v1/mot/score/ — { score, baseScore, max, breakdown, answers }. */
export const fetchMotScore = async () => {
  const { data: res } = await apiClient.get('/api/v1/mot/score/');
  return { data: res.data };
};

/** PUT /api/v1/mot/score/ — persist a step's answers, returns recomputed score. */
export const updateMotScore = async (
  step: 'A' | 'B' | 'C',
  answers: Record<string, boolean>
) => {
  const { data: res } = await apiClient.put('/api/v1/mot/score/', { step, answers });
  return { data: res.data };
};

// ─── Documents summary ───────────────────────────────────────────────────────

export type DocumentSummary = {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  /** Per-category document counts keyed by backend `discipline` slug. */
  by_discipline?: Record<string, number>;
};

/** GET /api/v1/documents/summary/ — counts for the dashboard status mini-cards. */
export const fetchDocumentSummary = async () => {
  const { data: res } = await apiClient.get('/api/v1/documents/summary/');
  return { data: (res.data ?? {}) as DocumentSummary };
};

// ─── Annual spend tracker ────────────────────────────────────────────────────

export type SpendCategory = { key: string; label: string; amount: number; color: string };

export type AnnualSpendYear = {
  year: number;
  total: number;
  invoice_count: number;
  delta_vs_prev: number | null;
  bars: number[]; // 12 monthly sums, Jan..Dec
  categories: SpendCategory[];
};

export type AnnualSpend = { default_year: number; years: AnnualSpendYear[] };

/** GET /api/v1/insights/annual-spend/ — per-year spend totals, monthly bars and
 *  category split for the dashboard Annual Spend Tracker. */
export const fetchAnnualSpend = async () => {
  const { data: res } = await apiClient.get('/api/v1/insights/annual-spend/');
  return { data: (res.data ?? { default_year: new Date().getFullYear(), years: [] }) as AnnualSpend };
};

// ─── 12-week timeline ─────────────────────────────────────────────────────────

export type TimelineNode = {
  label: string;
  diff_days: number;
  tone: 'good' | 'warn' | 'now' | 'future';
  date: string;
};

/** GET /api/v1/insights/timeline/ — dashboard 12-week timeline nodes (real events). */
export const fetchTimeline = async () => {
  const { data: res } = await apiClient.get('/api/v1/insights/timeline/');
  return { data: (res.data ?? { nodes: [] }) as { nodes: TimelineNode[]; window_weeks?: number } };
};

// ─── Needs attention ──────────────────────────────────────────────────────────

export type AttentionItem = {
  tone: 'danger' | 'warning' | 'neutral';
  tag: string;
  icon: string;
  title: string;
  sub: string;
  cta: string;
  meta: string;
  path: string;
};

/** GET /api/v1/insights/attention/ — dashboard "Needs attention" feed (real events + docs). */
export const fetchAttention = async () => {
  const { data: res } = await apiClient.get('/api/v1/insights/attention/');
  return { data: (res.data ?? { items: [], total: 0 }) as { items: AttentionItem[]; total: number } };
};

// ─── TradePilot — quotes in ───────────────────────────────────────────────────

export type QuoteRow = {
  bid_id: string;
  name: string;
  rating: number | null;
  jobs: number;
  amount: number;
  price: string;
  tag: string | null;
  tag_kind: 'best_price' | 'fastest' | 'top_rated' | null;
  highlight: boolean;
  profile_photo_url: string | null;
};

export type QuotesSummary = {
  job: { id: string; title: string; trade: string; location: string; trades_responded: number; avg_response: string } | null;
  quotes: QuoteRow[];
  recommended_bid_id: string | null;
};

/** GET /api/v1/jobs/quotes-summary/ — the dashboard "quotes in" panel (real bids). */
export const fetchQuotesSummary = async () => {
  const { data: res } = await apiClient.get('/api/v1/jobs/quotes-summary/');
  return { data: (res.data ?? { job: null, quotes: [], recommended_bid_id: null }) as QuotesSummary };
};

/** POST /api/v1/jobs/{id}/decline-quotes/ — reject all pending bids on a job. */
export const declineQuotes = async (jobId: string) => {
  const { data: res } = await apiClient.post(`/api/v1/jobs/${jobId}/decline-quotes/`, {});
  return res;
};

// ─── Recent activity ──────────────────────────────────────────────────────────

export type ActivityItem = {
  id: string;
  type: string;          // notification type key, drives the icon (e.g. 'new_quote')
  text: string;          // main line
  sub: string;           // secondary line
  good: boolean;         // positive outcome → green accent
  timestamp: string | null; // ISO; formatted to relative time in the UI
};

const normActivity = (a: any): ActivityItem => ({
  id: a.id,
  type: a.type ?? '',
  text: a.text ?? '',
  sub: a.sub ?? '',
  good: Boolean(a.good),
  timestamp: a.timestamp ?? null,
});

/** GET /api/v1/notifications/recent/ — dashboard "Recent activity" feed (real notifications). */
export const fetchRecentActivity = async (limit = 6) => {
  const { data: res } = await apiClient.get(`/api/v1/notifications/recent/?limit=${limit}`);
  const items: any[] = res.data ?? res.results ?? [];
  return { data: items.map(normActivity) };
};

// ─── Energy & EPC (AI rating) ─────────────────────────────────────────────────

export type EpcRecommendation = { title: string; detail: string; saving: string };

export type EpcAssessment = {
  id: string;
  currentBand: string;
  currentScore: number | null;
  potentialBand: string | null;
  potentialScore: number | null;
  validUntil: string | null;     // ISO date
  assessmentDate: string | null; // ISO date
  recommendations: EpcRecommendation[];
  documentName: string | null;
  isEstimate: boolean;           // true = AI best-effort estimate, not a real certificate
};

const normEpc = (e: any): EpcAssessment => ({
  id: e.id,
  currentBand: e.current_band ?? '',
  currentScore: e.current_score ?? null,
  potentialBand: e.potential_band ?? null,
  potentialScore: e.potential_score ?? null,
  validUntil: e.valid_until ?? null,
  assessmentDate: e.assessment_date ?? null,
  recommendations: Array.isArray(e.recommendations)
    ? e.recommendations.map((r: any) => ({
        title: r.title ?? '',
        detail: r.detail ?? '',
        saving: r.saving ?? '',
      }))
    : [],
  documentName: e.document_name ?? null,
  isEstimate: e.is_estimate ?? false,
});

/**
 * GET /api/v1/insights/epc/ — latest AI-generated EPC rating for the dashboard
 * Energy & EPC card. Returns null until an EPC certificate has been analysed.
 */
export const fetchEpc = async () => {
  const { data: res } = await apiClient.get('/api/v1/insights/epc/');
  const payload = res.data ?? null;
  return { data: payload ? normEpc(payload) : null };
};

/** POST /api/v1/documents/{id}/analyze-epc/ — (re-)run AI analysis on an EPC doc. */
export const reanalyzeEpc = async (documentId: string) => {
  const { data: res } = await apiClient.post(`/api/v1/documents/${documentId}/analyze-epc/`, {});
  return { data: res.data ? normEpc(res.data) : null };
};

// ─── System health ────────────────────────────────────────────────────────────

export type SystemHealthRec = { title: string; detail: string; saving?: string };

export type SystemHealth = {
  key: string;
  name: string;
  score: number;            // 0–100, deterministic predictive Health Index
  last: string;             // e.g. "Serviced 04 Jun 2026"
  next: string;             // e.g. "Next due May 2027"
  note: string;             // AI-enriched when available, else deterministic
  tone?: 'good' | 'warn' | 'poor';
  status?: 'ok' | 'due_soon' | 'overdue';  // predictive status
  forecast?: string;        // e.g. "Service due in ~2 months" ('' when ok)
  risk?: string;            // AI: what could go wrong if ignored
  recommendations?: SystemHealthRec[];  // AI: prioritized next actions
};

/**
 * GET /api/v1/insights/systems-health/ — per-system condition for the dashboard
 * "System health" card. Returns only the systems the user has data for; an empty
 * array means the card should show its empty state.
 */
export const fetchSystemsHealth = async () => {
  const { data: res } = await apiClient.get('/api/v1/insights/systems-health/');
  return { data: (Array.isArray(res.data) ? res.data : []) as SystemHealth[] };
};
