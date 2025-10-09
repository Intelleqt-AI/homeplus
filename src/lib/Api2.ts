import { supabase } from '@/integrations/supabase/client';

// add new event
export const addNewEvent = async event => {
  const { data, error } = await supabase.from('event').insert(event);
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
  return { data };
};

// add new property
export const getProperty = async () => {
  const { data, error } = await supabase.from('property').select('*').single();
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
  return { data };
};

//  get all event
export const getEvents = async () => {
  const { data, error } = await supabase.from('event').select('*');
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
  return { data };
};

// Upload Cover
export const uploadCover = async ({ file, id, metadata }) => {
  if (!file) throw new Error('No file provided.');

  // Get file extension (e.g. .jpg, .png)
  const extension = file.name.substring(file.name.lastIndexOf('.'));
  // Always name it "cover" with same extension
  const filePath = `${id}/cover${extension}`;

  // Upload and overwrite if exists
  const { data, error } = await supabase.storage.from('user-docs').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true, // replaces the existing cover
    metadata,
  });

  if (error) throw error;
  return data;
};
