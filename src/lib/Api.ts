import apiClient, { BASE_URL } from '@/lib/apiClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Capitalize first letter of a string (e.g. 'insurance' → 'Insurance') */
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

/**
 * Normalize a Django Document object to the legacy Supabase shape so that
 * Documents.tsx, docsUploadDialog.tsx, etc. continue to work without changes.
 *
 * Legacy shape:
 *   { id, name, metadata: { createdAt, metadata: { type, category, status } }, publicUrl }
 *
 * publicUrl is set to the presigned download endpoint URL so Downloads work.
 */
const normDoc = (doc: any) => ({
  id: doc.id,
  name: doc.name,
  metadata: {
    createdAt: doc.uploaded_at,
    metadata: {
      type: cap(doc.doc_type),
      category: doc.category,
      status: doc.expires_at ?? null,   // expiry date string or null
    },
  },
  // Presigned URL is fetched lazily via GET /documents/{id}/download/
  // Store the doc id here so consumers can request the URL when needed.
  publicUrl: null,
  // Extra field used by Documents.tsx download button (see updated page)
  _docId: doc.id,
});

// ─── Properties ──────────────────────────────────────────────────────────────

export const addNewProperty = async (property: any) => {
  const payload = {
    address: property.address || '',
    postcode: property.postcode || property.post_code || '',
    property_type: (property.property_type || property.type || 'other').toLowerCase().replace(' ', '_'),
    role: (property.role || 'homeowner').toLowerCase(),
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
  };

  const { data: res } = await apiClient.post('/api/v1/properties/', payload);
  return { data: res.data };
};

// ─── Documents ───────────────────────────────────────────────────────────────

/** Upload a document (multipart) — replaces uploadFileWithMetadata */
export const uploadFileWithMetadata = async ({
  file,
  id: _userId,
  metadata,
}: {
  file: File;
  id: string;
  metadata: { type?: string; status?: any; category?: string; name?: string };
}) => {
  const form = new FormData();
  form.append('file', file);
  form.append('name', metadata?.name || file.name);
  // form.append('doc_type', (metadata?.type || 'other').toLowerCase());
  // form.append('category', (metadata?.category || 'home').toLowerCase());
  if (metadata?.status) {
    // status holds the expiry date (Date object or date string)
    const d = metadata.status instanceof Date ? metadata.status : new Date(metadata.status);
    if (!isNaN(d.getTime())) {
      form.append('expires_at', d.toISOString().split('T')[0]);
    }
  }

  const { data: res } = await apiClient.post('/api/v1/documents/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return normDoc(res.data);
};

/** List documents — replaces listFilesWithMetadata.
 *  The `id` param is ignored (backend scopes to the authenticated user).
 *  When called with a path containing '/cover' it returns the property cover — handled in Api2.ts.
 */
export const listFilesWithMetadata = async (_id: string) => {
  const { data: res } = await apiClient.get('/api/v1/documents/');
  const docs: any[] = res.data ?? res.results ?? [];
  return docs.map(normDoc);
};

/** Delete a document by its UUID — replaces deleteFile */
export const deleteFile = async ({ id, fileName }: { id: string; fileName?: string }) => {
  // `id` is now the document UUID (not the user id).
  // fileName is accepted for backwards-compat but not used.
  await apiClient.delete(`/api/v1/documents/${id}/`);
  return true;
};

/** Get a presigned download URL for a document */
export const getDocumentDownloadUrl = async (docId: string): Promise<string> => {
  const { data: res } = await apiClient.get(`/api/v1/documents/${docId}/download/`);
  return res.data.url as string;
};

// ─── User ─────────────────────────────────────────────────────────────────────

/** Update the authenticated user's profile — replaces updateUserInfo */
export const updateUserInfo = async ({ userData }: { userData: any }) => {
  // Support both the old Supabase shape { data: { full_name } }
  // and a direct { first_name, last_name, profile: {...} } shape.
  let payload: any = {};

  if (userData?.data) {
    // Old Supabase shape: { data: { full_name, ... } }
    const { full_name, first_name, last_name, ...rest } = userData.data;
    if (full_name) {
      const parts = full_name.trim().split(' ');
      payload.first_name = parts[0] || '';
      payload.last_name = parts.slice(1).join(' ') || '';
    }
    if (first_name) payload.first_name = first_name;
    if (last_name) payload.last_name = last_name;
    if (rest.location || rest.postcode || rest.property_type) {
      payload.profile = {};
      if (rest.location) payload.profile.location = rest.location;
      if (rest.postcode) payload.profile.postcode = String(rest.postcode);
      if (rest.property_type) payload.profile.property_type = rest.property_type;
    }
  } else {
    payload = userData;
  }

  const { data: res } = await apiClient.patch('/api/v1/auth/me/', payload);
  return { user: res.data };
};

// ─── Jobs / Leads ─────────────────────────────────────────────────────────────

/**
 * Normalize a Django JobLead to the legacy shape used by JobLeads.tsx:
 * { id, name, service, location, value, homeID, isApproved, updated_at, bids: [...] }
 */
const normLead = (job: any) => ({
  id: job.id,
  name: job.title,
  service: cap(job.service),
  location: job.location,
  value: job.budget_min && job.budget_max
    ? `£${job.budget_min}-${job.budget_max}`
    : job.budget_min
    ? `£${job.budget_min}+`
    : 'POA',
  homeID: null,           // scoped by auth — filter handled server-side
  isApproved: job.is_approved,
  status: job.status,
  updated_at: job.updated_at,
  bids: (job.bids || []).map((b: any) => ({
    id: b.id,
    proposedValue: parseFloat(b.proposed_value),
    status: b.status,
    Available: b.availability,
    bid_by: b.id,
    bidder: {
      first_name: b.bidder_name?.split(' ')[0] || '',
      last_name: b.bidder_name?.split(' ').slice(1).join(' ') || '',
      email: b.bidder_email,
    },
  })),
});

export const fetchLeads = async () => {
  const { data: res } = await apiClient.get('/api/v1/jobs/');
  const jobs: any[] = res.data ?? res.results ?? [];
  return jobs.map(normLead);
};

export const modifyBid = async ({
  bid_id,
  status,
  lead_id,
  isApproved: _isApproved,
}: {
  bid_id: string;
  status: string;
  lead_id: string;
  isApproved?: boolean;
}) => {
  const { data: res } = await apiClient.patch(`/api/v1/jobs/${lead_id}/bids/${bid_id}/`, {
    status,
  });
  return res;
};

export const createJob = async (job: any) => {
  const payload = {
    title: job.title || job.trade || job.name || 'New Job',
    service: (job.service || job.trade || 'general').toLowerCase(),
    description: job.description || '',
    location: job.location || '',
    budget_min: job.budget_min || job.rate || null,
    budget_max: job.budget_max || null,
  };

  const { data: res } = await apiClient.post('/api/v1/jobs/', payload);
  return { success: true, ...res.data };
};
