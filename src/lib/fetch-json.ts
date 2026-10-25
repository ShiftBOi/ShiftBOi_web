export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(input, init);
  const text = await res.text();
  let data = {} as T;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new Error(
        res.ok
          ? "Invalid JSON from server"
          : `Request failed (${res.status}): ${text.slice(0, 120)}`
      );
    }
  } else if (!res.ok) {
    throw new Error(`Request failed (${res.status}) with empty body`);
  }
  return { ok: res.ok, status: res.status, data };
}
