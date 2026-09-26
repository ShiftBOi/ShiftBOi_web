export function moveItemById<T extends { id: string }>(
  list: T[],
  fromId: string,
  toId: string,
): T[] {
  const from = list.findIndex((item) => item.id === fromId);
  const to = list.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0 || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function moveItemToIndex<T extends { id: string }>(
  list: T[],
  fromId: string,
  toIndex: number,
): T[] {
  const from = list.findIndex((item) => item.id === fromId);
  if (from < 0) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  const clamped = Math.max(0, Math.min(toIndex, next.length));
  next.splice(clamped, 0, item);
  return next;
}

export async function persistFeaturedOrder(ids: string[]) {
  const results = await Promise.all(
    ids.map(async (id, index) => {
      const res = await fetch(`/api/cms/projects/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: index }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `Failed to save order for ${id}`);
      }
      return true;
    }),
  );
  return results;
}
