// Admin: Import posts from JSONL
import { timingSafeEqual } from "../../lib/auth.js";
import { checkKvNamespace } from "../../lib/kv.js";

export async function onRequestPost({ request, env }) {
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

  let data;
  try {
    data = await request.text();
  } catch {
    return Response.json({ error: "Expected JSONL content." }, { status: 400 });
  }

  const lines = data.trim().split("\n");
  let imported = 0;
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const post = JSON.parse(lines[i]);

      if (!post.id || !post.body) {
        errors.push(`Line ${i + 1}: Missing id or body`);
        continue;
      }

      // Calculate TTL if expiresAt is in the future
      let expirationTtl = null;
      if (post.expiresAt) {
        const expiryTime = new Date(post.expiresAt).getTime();
        const now = Date.now();
        if (expiryTime > now) {
          expirationTtl = Math.floor((expiryTime - now) / 1000);
        }
      }

      const metadata = {
        createdAt: post.createdAt,
        title: post.title || null,
        expiresAt: post.expiresAt,
        pinned: post.pinned || false,
      };

      const options = { metadata };
      if (expirationTtl) {
        options.expirationTtl = expirationTtl;
      }

      await env.KV.put(`post:${post.id}`, post.body, options);
      imported++;
    } catch (err) {
      errors.push(`Line ${i + 1}: ${err.message}`);
    }
  }

  // Rebuild index
  const postsList = await env.KV.list({ prefix: "post:" });
  const index = [];

  for (const key of postsList.keys) {
    const result = await env.KV.getWithMetadata(key.name);
    if (result.metadata) {
      const id = key.name.replace("post:", "");
      index.push({
        id,
        title: result.metadata.title,
        createdAt: result.metadata.createdAt,
        expiresAt: result.metadata.expiresAt,
        pinned: result.metadata.pinned || false,
        url: `/p/${id}`,
      });
    }
  }

  // Sort: pinned first, then by date
  index.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  await env.KV.put("index", JSON.stringify(index.slice(0, 10000)));

  return Response.json({
    success: true,
    imported,
    total: lines.length,
    errors: errors.length > 0 ? errors : null,
  });
}
