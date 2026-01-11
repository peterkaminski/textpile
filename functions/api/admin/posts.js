// Admin: List all posts with metadata
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

  // List all posts
  const postsList = await env.KV.list({ prefix: "post:" });
  const posts = [];

  for (const key of postsList.keys) {
    const result = await env.KV.getWithMetadata(key.name, { type: "text" });
    if (result.value) {
      const id = key.name.replace("post:", "");
      const metadata = result.metadata || {};
      posts.push({
        id,
        title: metadata.title || "(untitled)",
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
        pinned: metadata.pinned || false,
        size: new Blob([result.value]).size,
        url: `/p/${id}`,
      });
    }
  }

  // Sort by creation date, newest first
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return Response.json({ success: true, posts });
}
