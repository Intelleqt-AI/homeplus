import { supabase } from '@/integrations/supabase/client';

// --- Types ---

interface EventPayload {
  title: string;
  date: string | null;
  eventType: string;
  priority: string;
  cost: number;
  recurring: string;
  complianceType: string;
  isRequireTrade: boolean;
  description: string;
  [key: string]: unknown;
}

interface CoverUploadParams {
  file: File;
  id: string;
  metadata: Record<string, string>;
}

// --- Events ---

export const addNewEvent = async (event: EventPayload) => {
  const { data, error } = await supabase.from('event').insert(event);
  if (error) throw new Error(error.message);
  return { data };
};

export const getEvents = async () => {
  const { data, error } = await supabase.from('event').select('*');
  if (error) throw new Error(error.message);
  return { data };
};

// --- Property ---

export const getProperty = async () => {
  const { data, error } = await supabase.from('property').select('*').single();
  if (error) throw new Error(error.message);
  return { data };
};

// --- Cover Image ---

export const uploadCover = async ({ file, id, metadata }: CoverUploadParams) => {
  if (!file) throw new Error('No file provided.');

  const extension = file.name.substring(file.name.lastIndexOf('.'));
  const filePath = `${id}/cover${extension}`;

  const { data, error } = await supabase.storage.from('user-docs').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    metadata,
  });

  if (error) throw error;
  return data;
};
