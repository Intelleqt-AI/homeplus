/** Friendly message for an HTTP 429 (throttled) axios error, or null for any other error. */
export function throttledMessage(err: unknown): string | null {
  const res = (err as { response?: { status?: number; headers?: Record<string, string | undefined> } })?.response;
  if (res?.status !== 429) return null;
  const wait = Math.ceil(Number(res.headers?.['retry-after']));
  return wait > 0
    ? `Too many attempts. Please wait ${wait} second${wait === 1 ? '' : 's'} and try again.`
    : 'Too many attempts. Please wait a minute and try again.';
}
