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
  // Family members: who added it. Left undefined when the API omits it.
  created_by: ev.created_by as { id: string; name?: string; first_name?: string; last_name?: string; email?: string } | null | undefined,
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
    // "No compliance type" is '' on the backend; 'none' is not a valid choice (400).
    compliance_type: [event.complianceType, event.compliance_type].find(v => v && v !== 'none') ?? '',
    requires_trade: event.isRequireTrade ?? event.requires_trade ?? false,
    trade: event.trade ?? '',
    trade_category: event.tradeCategory ?? event.trade_category ?? '',
    description: event.description ?? '',
  };

  if (event.time) payload.time = event.time;
  if (event.property) payload.property = event.property;
  // 'completed' logs work already done (a record, never an overdue task).
  if (event.status) payload.status = event.status;

  const { data: res } = await apiClient.post('/api/v1/events/', payload);
  return { data: normEvent(res.data) };
};

export const getEvents = async (propertyId?: string | null) => {
  const path = propertyId ? `/api/v1/events/?property=${propertyId}` : '/api/v1/events/';
  const events = await fetchAllPages(path);
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

export const getMotTasks = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/mot/tasks/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
  return (res.data ?? res) as any[];
};

export const enableMotTemplate = async (
  templateId: string,
  lastCompletedDate: string,
  propertyId?: string | null,
) => {
  const body: Record<string, unknown> = { templateId, lastCompletedDate };
  if (propertyId) body.property = propertyId;
  const { data: res } = await apiClient.post('/api/v1/mot/tasks/', body);
  return res.data ?? res;
};

export const disableMotTemplate = async (templateId: string, propertyId?: string | null) => {
  await apiClient.delete(`/api/v1/mot/tasks/${templateId}/`, {
    params: propertyId ? { property: propertyId } : undefined,
  });
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

/** GET /api/v1/mot/tasks/ — the user's generated MOT tasks, scoped to one property. */
export const fetchMotTasks = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/mot/tasks/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
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

/** DELETE /api/v1/mot/tasks/{templateId}/ — remove the task + its linked event, scoped to one property. */
export const deleteMotTask = async (templateId: string, propertyId?: string | null) => {
  await apiClient.delete(`/api/v1/mot/tasks/${templateId}/`, {
    params: propertyId ? { property: propertyId } : undefined,
  });
  return { ok: true };
};

/** GET /api/v1/mot/last-completed/ — { templateId: 'YYYY-MM-DD' } for hydration, scoped to one property. */
export const fetchLastCompleted = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/mot/last-completed/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
  return { data: (res.data ?? {}) as Record<string, string> };
};

/** GET /api/v1/mot/score/ — { score, baseScore, max, breakdown, answers }, scoped to one property. */
export const fetchMotScore = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/mot/score/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
  return { data: res.data };
};

/** PUT /api/v1/mot/score/ — persist a step's answers for one property, returns recomputed score. */
export const updateMotScore = async (
  step: 'A' | 'B' | 'C',
  answers: Record<string, boolean>,
  propertyId?: string | null,
) => {
  const body: Record<string, unknown> = { step, answers };
  if (propertyId) body.property = propertyId;
  const { data: res } = await apiClient.put('/api/v1/mot/score/', body);
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

/** GET /api/v1/documents/summary/ — counts for the dashboard status mini-cards, scoped to one property. */
export const fetchDocumentSummary = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/documents/summary/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
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
export const fetchAnnualSpend = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/insights/annual-spend/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
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
export const fetchTimeline = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/insights/timeline/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
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
export const fetchAttention = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/insights/attention/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
  return { data: (res.data ?? { items: [], total: 0 }) as { items: AttentionItem[]; total: number } };
};

// ─── TradePilot — quotes in ───────────────────────────────────────────────────

export type QuoteRow = {
  bid_id: string;
  trader_id: string | null;
  name: string;
  rating: number | null;
  jobs: number;
  amount: number;
  price: string;
  tag: string | null;
  tag_kind: 'best_deal' | 'best_price' | 'top_rated' | 'closest' | null;
  highlight: boolean;
  profile_photo_url: string | null;
  score: number | null;
  distance_km: number | null;
};

export type QuotesSummary = {
  job: { id: string; title: string; trade: string; location: string; trades_responded: number; avg_response: string; unassigned?: boolean } | null;
  quotes: QuoteRow[];
  recommended_bid_id: string | null;
};

/** GET /api/v1/jobs/quotes-summary/ — the dashboard "quotes in" panel (real bids). */
export const fetchQuotesSummary = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/jobs/quotes-summary/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
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
  actor?: { id: string; name?: string } | null; // family members: who did it
};

const normActivity = (a: any): ActivityItem => ({
  id: a.id,
  type: a.type ?? '',
  text: a.text ?? '',
  sub: a.sub ?? '',
  good: Boolean(a.good),
  timestamp: a.timestamp ?? null,
  actor: a.actor ?? null,
});


/** GET /api/v1/notifications/recent/ — dashboard "Recent activity" feed (real notifications). */
export const fetchRecentActivity = async (limit = 6, propertyId?: string | null) => {
  const property = propertyId ? `&property=${propertyId}` : '';
  const { data: res } = await apiClient.get(`/api/v1/notifications/recent/?limit=${limit}${property}`);
  const items: any[] = res.data ?? res.results ?? [];
  return { data: items.map(normActivity) };
};

// ─── Energy & EPC ─────────────────────────────────────────────────────────────

export type EpcRecommendation = {
  title: string;
  detail: string;
  saving: string;
  /** Register only: e.g. "£1,500 - £2,700". */
  indicativeCost?: string;
  /** Register only: SAP score / band after this improvement. */
  ratingAfter?: number | null;
  bandAfter?: string | null;
};

export type EpcFeature = { name: string; description: string; rating: number | null };
export type EpcCostLine = { current: number | null; potential: number | null };

export type EpcDetails = {
  address?: string;
  postcode?: string;
  propertyType?: string;
  floorArea?: number | null;
  co2Current?: number | null;
  co2Potential?: number | null;
  energyUseCurrent?: number | null;
  costs?: {
    heating?: EpcCostLine;
    hot_water?: EpcCostLine;
    lighting?: EpcCostLine;
    total_current?: number | null;
    total_potential?: number | null;
  };
  features?: EpcFeature[];
};

export type EpcAssessment = {
  id: string;
  currentBand: string;
  currentScore: number | null;
  potentialBand: string | null;
  potentialScore: number | null;
  validUntil: string | null;     // ISO date
  assessmentDate: string | null; // ISO date (inspection)
  recommendations: EpcRecommendation[];
  documentName: string | null;
  isEstimate: boolean;           // true = AI best-effort estimate, not a real certificate
  /** 'register' = official GOV.UK EPC register; 'upload' = read by AI from a file. */
  source: 'register' | 'upload';
  certificateNumber: string | null;
  registrationDate: string | null;
  checkedAt: string | null;
  govUrl: string | null;
  details: EpcDetails;
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
        indicativeCost: r.indicative_cost ?? '',
        ratingAfter: r.rating_after ?? null,
        bandAfter: r.band_after ?? null,
      }))
    : [],
  documentName: e.document_name ?? null,
  isEstimate: e.is_estimate ?? false,
  source: e.source === 'register' ? 'register' : 'upload',
  certificateNumber: e.certificate_number || null,
  registrationDate: e.registration_date ?? null,
  checkedAt: e.checked_at ?? null,
  govUrl: e.gov_url ?? null,
  details: {
    address: e.details?.address ?? undefined,
    postcode: e.details?.postcode ?? undefined,
    propertyType: e.details?.property_type ?? undefined,
    floorArea: e.details?.floor_area ?? null,
    co2Current: e.details?.co2_current ?? null,
    co2Potential: e.details?.co2_potential ?? null,
    energyUseCurrent: e.details?.energy_use_current ?? null,
    costs: e.details?.costs ?? undefined,
    features: Array.isArray(e.details?.features) ? e.details.features : [],
  },
});

// GOV.UK EPC register: find this home's certificate, link it, re-check it.

export type EpcSearchResult = {
  certificateNumber: string;
  uprn: string;
  address: string;
  postTown: string;
  postcode: string;
  band: string | null;
  registrationDate: string | null;
  validUntil: string | null;
  expired: boolean;
  linked: boolean;
};

export type EpcSearchStatus = 'ok' | 'not_found' | 'invalid_postcode' | 'unavailable';

export type EpcSearchResponse = {
  status: EpcSearchStatus;
  postcode: string;
  results: EpcSearchResult[];
  suggested: string | null;
  linked: string | null;
};

/** GET /properties/{id}/epc/search/?postcode= — homes with a certificate in a postcode. */
export const searchEpcRegister = async (propertyId: string, postcode?: string): Promise<EpcSearchResponse> => {
  const { data: res } = await apiClient.get(`/api/v1/properties/${propertyId}/epc/search/`, {
    params: postcode ? { postcode } : undefined,
  });
  const d = res.data ?? {};
  return {
    status: d.status ?? 'not_found',
    postcode: d.postcode ?? '',
    suggested: d.suggested ?? null,
    linked: d.linked ?? null,
    results: (d.results ?? []).map((r: any) => ({
      certificateNumber: r.certificate_number,
      uprn: r.uprn ?? '',
      address: r.address ?? '',
      postTown: r.post_town ?? '',
      postcode: r.postcode ?? '',
      band: r.band ?? null,
      registrationDate: r.registration_date ?? null,
      validUntil: r.valid_until ?? null,
      expired: !!r.expired,
      linked: !!r.linked,
    })),
  };
};

const epcLinkPayload = (res: any): { assessment: EpcAssessment | null; status?: string } => ({
  assessment: res?.data?.assessment ? normEpc(res.data.assessment) : null,
  status: res?.data?.status,
});

/** POST /properties/{id}/epc/link/ — make this register certificate the property's EPC. */
export const linkEpcCertificate = async (propertyId: string, certificateNumber: string) => {
  const { data: res } = await apiClient.post(`/api/v1/properties/${propertyId}/epc/link/`, {
    certificate_number: certificateNumber,
  });
  return epcLinkPayload(res);
};

/** DELETE /properties/{id}/epc/link/ — "this isn't my home". */
export const unlinkEpcCertificate = async (propertyId: string) => {
  const { data: res } = await apiClient.delete(`/api/v1/properties/${propertyId}/epc/link/`);
  return epcLinkPayload(res);
};

/** POST /properties/{id}/epc/refresh/ — look for a newer certificate now. */
export const refreshEpcCertificate = async (propertyId: string) => {
  const { data: res } = await apiClient.post(`/api/v1/properties/${propertyId}/epc/refresh/`, {});
  return epcLinkPayload(res) as { assessment: EpcAssessment | null; status: 'updated' | 'unchanged' | 'not_linked' | 'not_found' };
};

/**
 * GET /api/v1/insights/epc/ — latest AI-generated EPC rating for one property's
 * Energy & EPC card. Returns null until an EPC certificate has been analysed.
 */
export const fetchEpc = async (propertyId?: string | null) => {
  const { data: res } = await apiClient.get('/api/v1/insights/epc/', {
    params: propertyId ? { property: propertyId } : undefined,
  });
  const payload = res.data ?? null;
  return { data: payload ? normEpc(payload) : null };
};

/** POST /api/v1/documents/{id}/analyze-epc/ — (re-)run AI analysis on an EPC doc. */
export const reanalyzeEpc = async (documentId: string) => {
  const { data: res } = await apiClient.post(`/api/v1/documents/${documentId}/analyze-epc/`, {});
  return { data: res.data ? normEpc(res.data) : null };
};

// ─── System health ────────────────────────────────────────────────────────────


/** Where a date came from: a vault document, a calendar reminder, Home MOT, or logged work. */
export type SystemHealthSource = {
  kind: 'document' | 'reminder' | 'completed' | 'home_mot' | 'job';
  label: string;
  document_id?: string;
  event_id?: string;
};

export type SystemHealthFactor = {
  key: 'certificates' | 'service' | 'jobs' | 'checks';
  label: string;
  weight: number;           // nominal weight (40/30/20/10)
  share: number | null;     // share of this score after unmeasured factors drop out
  score: number | null;     // 0–100, null when there is no data for it
  summary: string;          // why — or how to start measuring it
};

export type SystemHealthCertificate = {
  type: string;
  label: string;
  required: boolean;
  requirement: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing' | 'undated';
  expires: string | null;   // ISO date
  days_left: number | null;
  source: SystemHealthSource | null;
  /** document = verified; logged (marked done in the calendar) and self_reported (Home MOT) are not. */
  evidence: 'document' | 'logged' | 'self_reported' | null;
  verified: boolean;
  /** False: optional for this home and lapsed — shown for reference, not scored. */
  counts: boolean;
  /** A newer logged / self-reported check than the document on file ('' when none). */
  note: string;
};

export type SystemHealthJob = {
  title: string;
  date: string;             // ISO date
  event_id: string;
  priority?: string;
  missed?: number;          // overdue occurrences of a recurring reminder
  stale?: string;           // why an overdue reminder looks done already ('' when it counts)
  /** A Home MOT reminder the user never confirmed: a schedule, not a record of work. */
  reminder_only?: boolean;
};

/** A Post a Job draft, built by the backend from the home's records (slugs, not labels). */
export type SystemQuoteDraft = {
  title: string;
  trade?: string;
  trade_category?: string;
  description?: string;
  timeframe?: string;
  priority?: 'low' | 'medium' | 'high';
  /** Answers we already know, keyed by question output_key (exact option strings). */
  answers?: Record<string, string>;
};

/** What to upload: name, discipline, document type and category (slugs). */
export type SystemUploadDraft = { name?: string; discipline?: string; doc_type?: string; category?: string };

/** A calendar entry to create: work already done, a task, or a reminder. */
export type SystemEventDraft = {
  mode: 'done' | 'task' | 'reminder';
  title: string;
  type?: string;
  trade?: string;
  trade_category?: string;
  compliance_type?: string;
  date?: string;            // ISO date
  description?: string;
};

/** Everything the form an action opens needs; which keys are set depends on the action's kind. */
export type SystemActionPrefill = Partial<SystemQuoteDraft> & SystemUploadDraft & {
  event_id?: string;
  view?: 'detail' | 'complete';
  new_event?: SystemEventDraft;
  step?: 'A' | 'B' | 'C';
  focus?: string;           // Home MOT question to highlight
  document_id?: string;
  open?: 'preview' | 'edit';
  property_id?: string;
  field?: string;              // Settings → Properties field to highlight (HighlightField)
};

export type SystemHealthAction = {
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  kind: 'upload' | 'quote' | 'calendar' | 'mot' | 'documents' | 'epc' | 'property';
  prefill?: SystemActionPrefill;
  trade?: string;
  trade_category?: string;
  event_id?: string;
  document_id?: string;
  step?: 'A' | 'B' | 'C';
};

export type SystemHealthDetails = {
  /** `rented`: letting rules apply (the user is the landlord or the tenant). */
  context: { role: string | null; heating_type: string | null; rented: boolean };
  /** Rated only from the user's own Home MOT answers: held at 75 until a record confirms it. */
  self_reported_only: boolean;
  /** What the score rests on, e.g. ["1 certificate", "2 Home MOT answers"]; [] when not rated. */
  basis: string[];
  /** low = one kind of record, medium = two, high = three or more; null when not rated. */
  confidence: 'low' | 'medium' | 'high' | null;
  factors: SystemHealthFactor[];
  /** safety: a lapsing/lapsed safety certificate; self_reported: only Home MOT answers back the score. */
  cap: { limit: number; reason: string; kind: 'safety' | 'self_reported'; uncapped: number; applied: boolean } | null;
  certificates: SystemHealthCertificate[];
  service: {
    label: string;
    verb: string;
    interval_months: number | null;
    last: string | null;
    months_ago: number | null;
    source: SystemHealthSource | null;
    due: string | null;
    status: 'ok' | 'due_soon' | 'overdue' | 'unknown';
    evidence: 'document' | 'job' | 'self_reported' | null;
    /** True when the inspection record is the certificate itself (an EICR in the vault). */
    from_certificate: boolean;
  } | null;
  jobs: { overdue: SystemHealthJob[]; upcoming: SystemHealthJob[]; done: { title: string; date: string; event_id?: string }[] };
  upcoming: { date: string; label: string; kind: 'certificate' | 'service' | 'job'; reminder_only?: boolean }[];
  checks: { slug: string; label: string; ticked: boolean | null }[];
  documents: { id: string; name: string; expires: string | null; status: 'valid' | 'expiring' | 'expired' | 'no_expiry' }[];
  epc: { name: string; description: string; rating: number | null; rating_label: string }[];
  actions: SystemHealthAction[];
  /** The footer buttons: the most urgent quote, the certificate to upload, and logging this system's work. */
  shortcuts?: { quote?: SystemQuoteDraft; upload?: SystemUploadDraft; log_work?: SystemEventDraft };
};

export type SystemHealth = {
  key: string;
  name: string;
  /** False when nothing real is recorded yet (see SystemHealthUnrated). */
  rated?: boolean;
  score: number;            // 0–100, deterministic predictive Health Index
  last: string;             // e.g. "Serviced 04 Jun 2026"
  next: string;             // e.g. "Next due May 2027"
  note: string;             // one-line summary from the home's records
  /** Official EPC element ratings for this system, e.g. "EPC: main heating good". Info only. */
  epc_note?: string;
  tone?: 'good' | 'warn' | 'poor';
  status?: 'ok' | 'due_soon' | 'overdue';  // predictive status
  forecast?: string;        // e.g. "Service due in ~2 months" ('' when ok)
  /** Statutory record missing for a rented home, e.g. "Gas safety certificate — required for rented homes, none on file". */
  flag?: string;
  /** The single most important fact for a dashboard row, e.g. "Gas safety certificate expired 6 Apr 2026". */
  headline?: string;
  headline_tone?: 'poor' | 'warn' | 'good' | 'muted';
  /** Deterministic breakdown behind the score (absent on older backends). */
  details?: SystemHealthDetails;
};

/** A system with no real record yet (certificate, logged service, finished job or Home MOT answer). */
export type SystemHealthUnrated = Omit<SystemHealth, 'score' | 'tone' | 'status'> & {
  rated: false;
  score: null;
  tone: null;
  status: 'unrated';
};

export type SystemHealthItem = SystemHealth | SystemHealthUnrated;

export const isRatedSystem = (s: SystemHealthItem): s is SystemHealth => s.rated !== false;

/**
 * GET /api/v1/insights/systems-health/ — per-system condition for the dashboard
 * "System health" card. By default only systems with real records (rated); with
 * `includeUnrated` the others too (`rated: false`, `score: null`) so the card can
 * say what is missing.
 */
export const fetchSystemsHealth = async (propertyId?: string | null, includeUnrated = false) => {
  const params: Record<string, string> = {};
  if (propertyId) params.property = propertyId;
  if (includeUnrated) params.include_unrated = '1';
  const { data: res } = await apiClient.get('/api/v1/insights/systems-health/', { params });
  return { data: (Array.isArray(res.data) ? res.data : []) as SystemHealthItem[] };
};

// ─── PRS Database readiness (let homes) ───────────────────────────────────────

export type PrsStatus = 'done' | 'missing' | 'undated' | 'expired' | 'expiring' | 'below_minimum' | 'not_needed';

/** One checklist row; `actions` reuse the System Health action shape (runSystemAction). */
export type PrsItem = { key: string; label: string; status: PrsStatus; detail: string; actions: SystemHealthAction[] };

export type PrsDeadline = {
  opens: string; final_deadline: string; fee_gbp: number; update_days: number;
  summary: string; keep_current: string; gov_url: string;
};

export type PrsChecklist = {
  property_id: string;
  property_name: string;
  /** Only a let home (role Landlord) has to register. */
  applicable: boolean;
  role: string;
  ready: boolean;
  done: number;
  total: number;
  percent: number;
  details: PrsItem[];
  certificates: PrsItem[];
  registration: {
    registered: boolean; number: string; registered_at: string | null;
    status: 'done' | 'ready' | 'not_ready'; detail: string;
  };
  deadline: PrsDeadline;
};

export type PrsSummary = {
  homes: { property_id: string; property_name: string; ready: boolean; done: number; total: number;
    percent: number; registered: boolean; todo: string[] }[];
  deadline: PrsDeadline;
};

/** GET /properties/{id}/prs-checklist/ */
export const fetchPrsChecklist = async (propertyId: string) => {
  const { data: res } = await apiClient.get(`/api/v1/properties/${propertyId}/prs-checklist/`);
  return res.data as PrsChecklist;
};

/** GET /properties/prs-summary/ — every let home the caller can see. */
export const fetchPrsSummary = async () => {
  const { data: res } = await apiClient.get('/api/v1/properties/prs-summary/');
  return res.data as PrsSummary;
};

// ─── Calendar subscription feed ───────────────────────────────────────────────

export type CalendarFeedLinks = { url: string; webcal_url: string };

/** The caller's private .ics subscription links (created on first request). */
export const getCalendarFeedLinks = async (): Promise<CalendarFeedLinks> => {
  const { data: res } = await apiClient.get('/api/v1/events/feed-token/');
  return res.data as CalendarFeedLinks;
};

/** Issue a new token — every previously shared link stops working. */
export const rotateCalendarFeedLink = async (): Promise<CalendarFeedLinks> => {
  const { data: res } = await apiClient.post('/api/v1/events/feed-token/');
  return res.data as CalendarFeedLinks;
};
