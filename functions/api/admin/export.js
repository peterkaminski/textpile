// Admin: Export all posts as JSONL
import { timingSafeEqual } from "../../lib/auth.js";
import { checkKvNamespace } from "../../lib/kv.js";

export async function onRequestGet({ request, env }) {
  const kvError = checkKvNamespace(env);
  if (kvError) return kvError;

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
