import { supabase } from '@/integrations/supabase/client';

// add new property
export const addNewProperty = async property => {
  const { data, error } = await supabase.from('property').insert(property);
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
  return { data };
};

// Upload files
export const uploadFileWithMetadata = async (file: File, id, metadata: Record<string, string>) => {
  const filePath = `${id}/${file.name}`; // path in the bucket

  const { data, error } = await supabase.storage.from('user-docs').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    metadata, // send metadata here
  });

  if (error) throw error;
  return data;
};

// Fetch files with metadata
export const listFilesWithMetadata = async id => {
  const { data: files, error } = await supabase.storage.from('user-docs').list(id);
  if (error) throw error;

  const filesWithMetadata = await Promise.all(
    files.map(async file => {
      const meta = await (supabase.storage.from('user-docs') as any).getMetadata(`${id}/${file.name}`);
      return { ...file, metadata: meta.data };
    })
  );

  return filesWithMetadata;
};
