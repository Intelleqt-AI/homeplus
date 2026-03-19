import { supabase } from '@/integrations/supabase/client';
import { isDemoMode, mockEvents, mockProperty, mockCover } from '@/lib/mockData';

// add new event
export const addNewEvent = async event => {
  if (isDemoMode()) {
    // In demo mode, simulate event creation success
    return { data: { id: `demo-event-${Date.now()}`, ...event } };
  }

  const { data, error } = await supabase.from('event').insert(event);
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
  return { data };
};

// add new property
export const getProperty = async () => {
  if (isDemoMode()) {
    // Return mock property data
    return { data: mockProperty };
  }

  const { data, error } = await supabase.from('property').select('*').single();
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
  return { data };
};

//  get all event
export const getEvents = async () => {
  if (isDemoMode()) {
    // Return mock events data
    return { data: mockEvents };
  }

  const { data, error } = await supabase.from('event').select('*');
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
  return { data };
};

// Upload Cover
export const uploadCover = async ({ file, id, metadata }) => {
  if (isDemoMode()) {
    // In demo mode, simulate cover upload success
    return {
      path: `${id}/cover.jpg`,
      id: `demo-cover-${Date.now()}`,
    };
  }

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
