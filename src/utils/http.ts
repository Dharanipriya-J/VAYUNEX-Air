/**
 * Performs a `fetch` that is automatically aborted after `timeoutMs`
 * and resolves to parsed JSON. Throws on network errors, timeouts,
 * and non-2xx responses so callers can fall back gracefully.
 */
export async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number,
  init: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
