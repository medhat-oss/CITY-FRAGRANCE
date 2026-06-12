const pendingPromises = new Map<string, Promise<unknown>>();

export function dedupFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const key = url;
  if (pendingPromises.has(key)) {
    return pendingPromises.get(key) as Promise<T>;
  }
  const p = fetch(url, options)
    .then((res) => res.json() as Promise<T>)
    .finally(() => pendingPromises.delete(key));
  pendingPromises.set(key, p);
  return p;
}
