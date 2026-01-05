// Admin: Clear all posts
async function timingSafeEqual(a, b) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  if (crypto.subtle) {
    const aKey = await crypto.subtle.importKey("raw", aBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const bKey = await crypto.subtle.importKey("raw", bBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const aHash = await crypto.subtle.sign("HMAC", aKey, new Uint8Array(1));
    const bHash = await crypto.subtle.sign("HMAC", bKey, new Uint8Array(1));
    return new Uint8Array(aHash).every((byte, i) => byte === new Uint8Array(bHash)[i]);
  }
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) result |= aBytes[i] ^ bBytes[i];
  return result === 0;
}

export async function onRequestPost({ request, env }) {
  const token = env.ADMIN_TOKEN;
  if (!token) {
    return Response.json({ error: "ADMIN_TOKEN not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("Authorization");
  const providedToken = authHeader?.replace("Bearer ", "") || "";

  if (!providedToken || !(await timingSafeEqual(providedToken, token))) {
    return Response.json({ error: "Invalid admin token." }, { status: 403 });
  }

  // Delete all posts
  const postsList = await env.KV.list({ prefix: "post:" });
  let deleted = 0;

  for (const key of postsList.keys) {
    await env.KV.delete(key.name);
    deleted++;
  }

  // Reset index
  await env.KV.put("index", "[]");

  return Response.json({
    success: true,
    message: "All posts cleared.",
    deleted,
  });
}
