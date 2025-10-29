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
export const uploadFileWithMetadata = async ({ file, id, metadata }) => {
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
  // 1️⃣ List all files inside the user's folder
  const { data: files, error } = await supabase.storage.from('user-docs').list(id);

  if (error) throw error;

  // 2️⃣ Fetch metadata + public URL for each file
  const filesWithMetadata = await Promise.all(
    files.map(async file => {
      const filePath = `${id}/${file.name}`;
      const storage = supabase.storage.from('user-docs');

      // Get metadata
      const { data: metadata, error: metaError } = await storage.info(filePath);
      if (metaError) {
        console.error(`Metadata fetch failed for ${file.name}:`, metaError.message);
      }

      // Get public URL
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

export const deleteFile = async ({ id, fileName }) => {
  const filePath = `${id}/${fileName}`;
  console.log(filePath);

  const { data, error } = await supabase.storage.from('user-docs').remove([filePath]); // remove() expects an array of file paths

  if (error) {
    console.error(`Failed to delete file ${fileName}:`, error.message);
    return false;
  }

  return true;
};

export const updateUserInfo = async ({ userData }) => {
  console.log('Payload to Supabase:', userData);
  const { data, error } = await supabase.auth.updateUser(userData);

  if (error) throw error;
  return data;
};

// src/api/getLeads.ts
export const fetchLeads = async () => {
  const res = await fetch('https://bozuxpzratqjsjqgjchq.supabase.co/functions/v1/get-services', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvenV4cHpyYXRxanNqcWdqY2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzY3ODMsImV4cCI6MjA3MjY1Mjc4M30.X25eruOvP6dZlxRwrzJdIB_nRoms_vH2ZOCNaA_a76E`, // keep existing auth header
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || 'Failed to fetch leads');
  }

  return res.json();
};

export const modifyBid = async ({ bid_id, status, lead_id, isApproved }) => {
  const res = await fetch('https://bozuxpzratqjsjqgjchq.supabase.co/functions/v1/modify-bid', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvenV4cHpyYXRxanNqcWdqY2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzY3ODMsImV4cCI6MjA3MjY1Mjc4M30.X25eruOvP6dZlxRwrzJdIB_nRoms_vH2ZOCNaA_a76E`,
    },
    body: JSON.stringify({ bid_id, status, lead_id, isApproved }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to modify bid');
  return data;
};

export const createJob = async job => {
  const res = await fetch('https://bozuxpzratqjsjqgjchq.supabase.co/functions/v1/create-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvenV4cHpyYXRxanNqcWdqY2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzY3ODMsImV4cCI6MjA3MjY1Mjc4M30.X25eruOvP6dZlxRwrzJdIB_nRoms_vH2ZOCNaA_a76E`,
    },
    body: JSON.stringify(job),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create job');
  return data;
};
