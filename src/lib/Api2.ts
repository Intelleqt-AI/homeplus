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
