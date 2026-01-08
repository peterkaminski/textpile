// Timing-safe string comparison to prevent timing attacks
async function timingSafeEqual(a, b) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  // Use crypto.subtle for constant-time comparison if available
  if (crypto.subtle) {
    const aKey = await crypto.subtle.importKey("raw", aBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const bKey = await crypto.subtle.importKey("raw", bBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const aHash = await crypto.subtle.sign("HMAC", aKey, new Uint8Array(1));
    const bHash = await crypto.subtle.sign("HMAC", bKey, new Uint8Array(1));
    return new Uint8Array(aHash).every((byte, i) => byte === new Uint8Array(bHash)[i]);
  }

  // Fallback: constant-time comparison
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

export async function onRequestPost({ request, env }) {
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
