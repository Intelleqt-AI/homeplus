import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from './supabaseFunctions';

// --- Types ---

interface PropertyPayload {
  address: string;
  type: string;
  bedrooms: string;
  role: string;
  [key: string]: unknown;
}

interface FileUploadParams {
  file: File;
  id: string;
  metadata: Record<string, string>;
}

interface ModifyBidPayload {
  bid_id: string;
  status: string;
  lead_id: string;
  isApproved: boolean;
}

// --- Property ---

export const addNewProperty = async (property: PropertyPayload) => {
  const { data, error } = await supabase.from('property').insert(property);
  if (error) throw new Error(error.message);
  return { data };
};

// --- Files ---

export const uploadFileWithMetadata = async ({ file, id, metadata }: FileUploadParams) => {
  const filePath = `${id}/${file.name}`;

  const { data, error } = await supabase.storage.from('user-docs').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    metadata,
  });

  if (error) throw error;
  return data;
};

export const listFilesWithMetadata = async (id: string) => {
  const { data: files, error } = await supabase.storage.from('user-docs').list(id);

  if (error) throw error;

  const filesWithMetadata = await Promise.all(
    files.map(async file => {
      const filePath = `${id}/${file.name}`;
      const storage = supabase.storage.from('user-docs');

      const { data: metadata, error: metaError } = await storage.info(filePath);
      if (metaError) {
        console.error(`Metadata fetch failed for ${file.name}:`, metaError.message);
      }

      const { data: publicUrlData } = storage.getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;

      return {
        ...file,
        metadata: metadata || null,
        publicUrl,
      };
    })
  );

  return filesWithMetadata;
};

export const deleteFile = async ({ id, fileName }: { id: string; fileName: string }) => {
  const filePath = `${id}/${fileName}`;
  const { error } = await supabase.storage.from('user-docs').remove([filePath]);

  if (error) {
    console.error(`Failed to delete file ${fileName}:`, error.message);
    return false;
  }

  return true;
};

// --- User ---

export const updateUserInfo = async ({ userData }: { userData: Record<string, unknown> }) => {
  const { data, error } = await supabase.auth.updateUser(userData);
  if (error) throw error;
  return data;
};

// --- Edge Functions (Trade Pilot integration) ---

export const fetchLeads = () => callEdgeFunction('get-services');

export const modifyBid = async ({ bid_id, status, lead_id, isApproved }: ModifyBidPayload) =>
  callEdgeFunction('modify-bid', { method: 'POST', body: { bid_id, status, lead_id, isApproved } });

export const createJob = async (job: Record<string, unknown>) =>
  callEdgeFunction('create-job', { method: 'POST', body: job });
