import { checkKvNamespace } from "../lib/kv.js";

export async function onRequestGet({ env }) {
  const kvError = checkKvNamespace(env);
  if (kvError) return kvError;

  const raw = await env.KV.get("index");
  const items = raw ? JSON.parse(raw) : [];

  // Filter out expired items
  const now = Date.now();
  let activeItems = items.filter(item => {
    if (!item.expiresAt) return true; // Keep items without expiry (legacy)
    return new Date(item.expiresAt).getTime() > now;
  });

  // Ensure pinned posts are sorted first
  activeItems.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Cleanup: if expired items were found, write back the cleaned index
  if (activeItems.length < items.length) {
    await env.KV.put("index", JSON.stringify(activeItems));
  }

  return Response.json({ success: true, items: activeItems }, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
