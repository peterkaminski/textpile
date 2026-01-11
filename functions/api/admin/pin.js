// Admin: Pin/unpin posts
import { timingSafeEqual } from "../../lib/auth.js";
import { checkKvNamespace } from "../../lib/kv.js";

export async function onRequestPost({ request, env }) {
  const kvError = checkKvNamespace(env);
  if (kvError) return kvError;

  const token = env.ADMIN_TOKEN;
  if (!token) {
    return Response.json({ error: "ADMIN_TOKEN not configured." }, { status: 501 });
  }

  let data;
  try { data = await request.json(); }
  catch { return Response.json({ error: "Expected JSON body." }, { status: 400 }); }

  const providedToken = (data?.token || "").trim();
  if (!providedToken || !(await timingSafeEqual(providedToken, token))) {
    return Response.json({ error: "Invalid admin token." }, { status: 403 });
  }

  const id = String(data?.id || "").trim();
  if (!id) return Response.json({ error: "id required." }, { status: 400 });

  const pinned = data?.pinned === true;

  // Get the post to update its metadata
  const result = await env.KV.getWithMetadata(`post:${id}`);
  if (!result.value || !result.metadata) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  const metadata = result.metadata;
  metadata.pinned = pinned;

  // Calculate remaining TTL from expiresAt
  const expiresAt = new Date(metadata.expiresAt);
  const now = new Date();
  const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

  // Update the post with new metadata and preserve TTL
  await env.KV.put(`post:${id}`, result.value, {
    expirationTtl: remainingSeconds,
    metadata: metadata
  });

  // Update index
  const rawIndex = await env.KV.get("index");
  let index = rawIndex ? JSON.parse(rawIndex) : [];

  // Filter out expired entries
  const nowTimestamp = Date.now();
  index = index.filter(item => {
    if (!item.expiresAt) return true; // Keep items without expiry (legacy)
    return new Date(item.expiresAt).getTime() > nowTimestamp;
  });

  // Find and update the post in the index
  const entry = index.find(item => item.id === id);
  if (entry) {
    entry.pinned = pinned;
  }

  // Sort: pinned first, then by date
  index.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  await env.KV.put("index", JSON.stringify(index));

  return Response.json({
    success: true,
    message: pinned ? "Post pinned successfully." : "Post unpinned successfully.",
    pinned: pinned
  }, { status: 200 });
}
