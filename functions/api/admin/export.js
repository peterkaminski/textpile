// Admin: Export all posts as JSONL
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

export async function onRequestGet({ request, env }) {
  const token = env.ADMIN_TOKEN;
  if (!token) {
    return Response.json({ error: "ADMIN_TOKEN not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("Authorization");
  const providedToken = authHeader?.replace("Bearer ", "") || "";

  if (!providedToken || !(await timingSafeEqual(providedToken, token))) {
    return Response.json({ error: "Invalid admin token." }, { status: 403 });
  }

  // Export all posts as JSONL
  const postsList = await env.KV.list({ prefix: "post:" });
  const lines = [];

  for (const key of postsList.keys) {
    const result = await env.KV.getWithMetadata(key.name, { type: "text" });
    if (result.value) {
      const id = key.name.replace("post:", "");
      const metadata = result.metadata || {};
      const entry = {
        id,
        title: metadata.title || null,
        body: result.value,
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
        pinned: metadata.pinned || false,
      };
      lines.push(JSON.stringify(entry));
    }
  }

  const jsonl = lines.join("\n");

  return new Response(jsonl, {
    headers: {
      "Content-Type": "application/jsonlines",
      "Content-Disposition": `attachment; filename="textpile-export-${new Date().toISOString().split('T')[0]}.jsonl"`,
    },
  });
}
