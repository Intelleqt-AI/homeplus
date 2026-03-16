const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const FUNCTIONS_KEY = import.meta.env.VITE_SUPABASE_FUNCTIONS_KEY;

export async function callEdgeFunction(
  functionName: string,
  options?: { method?: string; body?: unknown }
) {
  const res = await fetch(`${FUNCTIONS_URL}/functions/v1/${functionName}`, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FUNCTIONS_KEY}`,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Failed to call ${functionName}`);
  return data;
}
