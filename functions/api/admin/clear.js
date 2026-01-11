// Admin: Clear all posts
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
