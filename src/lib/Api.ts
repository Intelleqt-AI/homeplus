import apiClient, { BASE_URL } from '@/lib/apiClient';

// ─── Generic CRUD ─────────────────────────────────────────────────────────────

const handleError = (error: any): never => {
  const err: any = new Error(
    error.response ? `HTTP error! status: ${error.response.status}` : error.message
  );
  if (error.response) err.response = error.response;
  throw err;
};

export const fetchData = async <T = any>(url: string): Promise<T> => {
  if (!url) throw new Error('No URL provided');
  try {
    const { data: res } = await apiClient.get<T>(url);
    return res;
  } catch (error) { handleError(error); }
};

export const postData = async <T = any>({ url, data, config = {} }: { url: string; data?: any; config?: any }): Promise<T> => {
  if (!url) throw new Error('No post URL provided');
  try {
    const { data: res } = await apiClient.post<T>(url, data, config);
    return res;
  } catch (error) { handleError(error); }
};

export const deleteData = async <T = any>({ url, data }: { url: string; data?: any }): Promise<T> => {
  if (!url) throw new Error('No URL provided');
  try {
    const { data: res } = await apiClient.delete<T>(url, data ? { data } : undefined);
    return res;
  } catch (error) { handleError(error); }
};

export const putData = async <T = any>({ url, data }: { url: string; data?: any }): Promise<T> => {
  if (!url) throw new Error('No put URL provided');
  try {
    const { data: res } = await apiClient.put<T>(url, data);
    return res;
  } catch (error) { handleError(error); }
};

export const patchData = async <T = any>({ url, data }: { url: string; data?: any }): Promise<T> => {
  if (!url) throw new Error('No patch URL provided');
  try {
    const { data: res } = await apiClient.patch<T>(url, data);
    return res;
  } catch (error) { handleError(error); }
};

export const patchFormData = async <T = any>({ url, data }: { url: string; data: FormData }): Promise<T> => {
  if (!url) throw new Error('No patch URL provided');
  try {
    const { data: res } = await apiClient.patch<T>(url, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res;
  } catch (error) { handleError(error); }
};

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
export type NormDoc = {
  id: string;
  name: string;
  category: string;
  doc_type: string;
  expires_at: string | null;
  is_expired: boolean;
  notes: string;
  file_size: number;
  content_type: string;
  file_name: string;
  uploaded_at: string;
  updated_at: string;
  property: string | null;
  property_address: string | null;
  _docId: string;
  // Legacy compat — homePack.tsx and HomePlusDashboard.tsx use these
  publicUrl: null;
  metadata: {
    createdAt: string;
    metadata: { type: string; category: string; status: string | null };
  };
};

const normDoc = (doc: any): NormDoc => ({
  id: doc.id,
  name: doc.name,
  category: doc.category ?? 'other',
  doc_type: doc.doc_type ?? 'other',
  expires_at: doc.expires_at ?? null,
  is_expired: doc.is_expired ?? false,
  notes: doc.notes ?? '',
  file_size: doc.file_size ?? 0,
  content_type: doc.content_type ?? '',
  file_name: doc.file_name ?? '',
  uploaded_at: doc.uploaded_at,
  updated_at: doc.updated_at,
  property: doc.property ?? null,
  property_address: doc.property_address ?? null,
  _docId: doc.id,
  publicUrl: null,
  metadata: {
    createdAt: doc.uploaded_at,
    metadata: {
      type: cap(doc.doc_type),
      category: doc.category,
      status: doc.expires_at ?? null,
    },
  },
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

export type DocumentFilters = {
  category?: string;
  doc_type?: string;
  search?: string;
  ordering?: string;
};

export type DocumentUpdatePayload = {
  name?: string;
  category?: string;
  doc_type?: string;
  expires_at?: string | null;
  notes?: string;
  property?: string | null;
};

/** Fetch documents with optional server-side filters */
export const fetchDocuments = async (filters: DocumentFilters = {}): Promise<NormDoc[]> => {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.doc_type)  params.set('doc_type', filters.doc_type);
  if (filters.search)    params.set('search', filters.search);
  if (filters.ordering)  params.set('ordering', filters.ordering);
  const qs = params.toString();
  const { data: res } = await apiClient.get(`/api/v1/documents/${qs ? `?${qs}` : ''}`);
  const docs = (res.data ?? res.results ?? []) as unknown[];
  return docs.map(normDoc);
};

/** Update doc metadata (PATCH — file cannot be replaced) */
export const updateDocument = async (id: string, data: DocumentUpdatePayload): Promise<NormDoc> => {
  const { data: res } = await apiClient.patch(`/api/v1/documents/${id}/`, data);
  return normDoc(res.data);
};

/** Docs expiring within 30 days */
export const fetchExpiringDocuments = async (): Promise<NormDoc[]> => {
  const { data: res } = await apiClient.get('/api/v1/documents/expiring/');
  const docs = (res.data ?? res.results ?? []) as unknown[];
  return docs.map(normDoc);
};

/** Upload a document (multipart/form-data) */
export const uploadFileWithMetadata = async ({
  file,
  id: _userId,
  metadata,
}: {
  file: File;
  id: string;
  metadata: { type?: string; status?: Date | string | null; category?: string; name?: string; notes?: string };
}): Promise<NormDoc> => {
  const form = new FormData();
  form.append('file', file);
  form.append('name', metadata?.name || file.name);
  form.append('doc_type', (metadata?.type || 'other').toLowerCase());
  form.append('category', (metadata?.category || 'other').toLowerCase());
  if (metadata?.notes?.trim()) form.append('notes', metadata.notes.trim());
  if (metadata?.status) {
    const d = metadata.status instanceof Date ? metadata.status : new Date(metadata.status);
    if (!isNaN(d.getTime())) form.append('expires_at', d.toISOString().split('T')[0]);
  }
  const { data: res } = await apiClient.post('/api/v1/documents/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return normDoc(res.data);
};

/** List documents — legacy wrapper used by homePack.tsx / HomePlusDashboard.tsx */
export const listFilesWithMetadata = async (_id?: string): Promise<NormDoc[]> => {
  const { data: res } = await apiClient.get('/api/v1/documents/');
  const docs = (res.data ?? res.results ?? []) as unknown[];
  return docs.map(normDoc);
};

/** Delete a document by UUID */
export const deleteFile = async ({ id }: { id: string; fileName?: string }): Promise<boolean> => {
  await apiClient.delete(`/api/v1/documents/${id}/`);
  return true;
};

/** Get presigned download URL (TTL 1 hour) */
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
  service: cap(job.trade),
  trade: job.trade || 'other',
  category: job.category || '',
  location: job.location || '',
  postcode: job.postcode || '',
  description: job.description || '',
  priority: job.priority || 'medium',
  urgency: job.urgency || 'normal',
  budget_min: job.budget_min ?? null,
  budget_max: job.budget_max ?? null,
  preferred_date: job.preferred_date ?? null,
  property: job.property ?? null,
  value: job.budget_min && job.budget_max
    ? `£${parseFloat(job.budget_min).toFixed(0)}–£${parseFloat(job.budget_max).toFixed(0)}`
    : job.budget_min
    ? `£${parseFloat(job.budget_min).toFixed(0)}+`
    : 'POA',
  homeID: null,
  isApproved: job.is_approved,
  status: job.status,
  answers: job.answers || {},
  created_by: job.created_by || null,
  created_at: job.created_at,
  updated_at: job.updated_at,
  bids: (job.bids || []).map((b: any) => ({
    id: b.id,
    proposedValue: parseFloat(b.amount ?? 0),
    status: b.status,
    Available: b.availability,
    bid_by: b.tradepilot_bidder || b.id,
    description: b.description || '',
    contractor_phone: b.contractor_phone || '',
    company_name: b.company_name || '',
    rating: b.rating ?? null,
    rating_comment: b.rating_comment || '',
    rating_is_anonymous: b.rating_is_anonymous ?? false,
    rated_at: b.rated_at ?? null,
    bidder: {
      first_name: b.contractor_name?.split(' ')[0] || '',
      last_name: b.contractor_name?.split(' ').slice(1).join(' ') || '',
      email: b.contractor_email || '',
    },
    tradepilot_profile: b.tradepilot_profile || null,
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
  const payload: Record<string, any> = {
    service: (job.service || job.trade || 'other').toLowerCase(),
    category: job.category || '',
    description: job.description || '',
    location: job.location || '',
    postcode: job.postcode || '',
    priority: job.priority || 'medium',
    urgency: job.urgency || 'normal',
    answers: job.answers || {},
  };
  if (job.property) payload.property = job.property;
  if (job.title) payload.title = job.title;
  if (job.budget_min) payload.budget_min = job.budget_min;
  if (job.budget_max) payload.budget_max = job.budget_max;
  if (job.budget) payload.budget = job.budget;
  if (job.preferred_date) payload.preferred_date = job.preferred_date;
  if (job.budget_min || job.rate) payload.budget_min = payload.budget_min ?? job.rate;

  const { data: res } = await apiClient.post('/api/v1/jobs/', payload);
  return { success: true, ...(res.data ?? {}) };
};

export const updateJob = async (id: string, data: Record<string, unknown>) => {
  const { data: res } = await apiClient.patch(`/api/v1/jobs/${id}/`, data);
  return normLead(res.data);
};

export const deleteJob = async (id: string): Promise<boolean> => {
  await apiClient.delete(`/api/v1/jobs/${id}/`);
  return true;
};

export const rateBid = async ({
  job_id,
  bid_id,
  rating,
  rating_comment,
  is_anonymous,
}: {
  job_id: string;
  bid_id: string;
  rating: number;
  rating_comment: string;
  is_anonymous: boolean;
}) => {
  const { data: res } = await apiClient.post(`/api/v1/jobs/${job_id}/bids/${bid_id}/rate/`, {
    rating,
    rating_comment,
    is_anonymous,
  });
  return res;
};
