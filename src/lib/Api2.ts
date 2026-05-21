import apiClient from '@/lib/apiClient';

// ─── Events ──────────────────────────────────────────────────────────────────

/**
 * Normalize a Django Event to the legacy shape used by the calendar/dashboard.
 * Legacy: { id, title, date, time, eventType, type, priority, cost, recurring,
 *           description, isRequireTrade, complianceType, status }
 */
const normEvent = (ev: any) => ({
  id: ev.id,
  title: ev.title,
  // Keep ISO date string — components already parse this
  date: ev.date ? new Date(ev.date).toISOString() : null,
  time: ev.time ?? null,
  // Legacy components use `eventType` (PascalCase display value)
  eventType: ev.event_type
    ? ev.event_type.charAt(0).toUpperCase() + ev.event_type.slice(1)
    : 'Maintenance',
  // Legacy `type` field (reminder / service / compliance)
  type: ev.compliance_type && ev.compliance_type !== 'none'
    ? 'compliance'
    : ev.requires_trade
    ? 'service'
    : 'reminder',
  priority: ev.priority ?? 'medium',
  status: ev.status ?? 'pending',
  cost: ev.estimated_cost ? parseFloat(ev.estimated_cost) : 0,
  actual_cost: ev.actual_cost ? parseFloat(ev.actual_cost) : null,
  recurring: ev.recurring ?? 'never',
  compliance_type: ev.compliance_type ?? 'none',
  complianceType: ev.compliance_type ?? 'none',
  isRequireTrade: ev.requires_trade ?? false,
  requires_trade: ev.requires_trade ?? false,
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
    estimated_cost: event.cost ?? event.estimated_cost ?? 0,
    recurring: event.recurring ?? 'never',
    compliance_type: event.complianceType || event.compliance_type || 'none',
    requires_trade: event.isRequireTrade ?? event.requires_trade ?? false,
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
