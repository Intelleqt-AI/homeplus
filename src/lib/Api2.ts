import apiClient from '@/lib/apiClient';

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
  const { data: res } = await apiClient.get('/api/v1/events/');
  const events: any[] = res.data ?? res.results ?? [];
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

/** Mark an event completed. Optional actual_cost/notes (we don't surface them yet). */
export const completeEvent = async (eventId: string) => {
  const { data: res } = await apiClient.post(`/api/v1/events/${eventId}/complete/`, {});
  return { data: res?.data ? normEvent(res.data) : null };
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
};

/** GET /api/v1/documents/summary/ — counts for the dashboard status mini-cards. */
export const fetchDocumentSummary = async () => {
  const { data: res } = await apiClient.get('/api/v1/documents/summary/');
  return { data: (res.data ?? {}) as DocumentSummary };
};
