import { checkKvNamespace } from "../lib/kv.js";

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

  await env.KV.delete(`post:${id}`);

  const rawIndex = await env.KV.get("index");
  const index = rawIndex ? JSON.parse(rawIndex) : [];

  // Filter out deleted post AND expired entries
  const now = Date.now();
  const next = index.filter((it) => {
    if (it?.id === id) return false; // Remove deleted post
    if (!it?.expiresAt) return true; // Keep items without expiry (legacy)
    return new Date(it.expiresAt).getTime() > now; // Remove expired
  });

  await env.KV.put("index", JSON.stringify(next));

  return Response.json({ success: true, message: "Post removed successfully." }, { status: 200 });
}
