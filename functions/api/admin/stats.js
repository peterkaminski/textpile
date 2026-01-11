// Admin: Get storage statistics
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
  const totalPosts = postsList.keys.length;

  // Estimate storage (rough)
  let estimatedSize = 0;
  for (const key of postsList.keys.slice(0, 100)) { // Sample first 100
    const post = await env.KV.get(key.name, { type: "text" });
    if (post) estimatedSize += new Blob([post]).size;
  }
  const avgPostSize = totalPosts > 0 ? estimatedSize / Math.min(100, totalPosts) : 0;
  const totalEstimatedSize = Math.round(avgPostSize * totalPosts);

  // Get index size
  const indexData = await env.KV.get("index");
  const indexSize = indexData ? new Blob([indexData]).size : 0;

  // Calculate limits
  const maxKvSize = parseInt(env.MAX_KV_SIZE) || 1048576000; // 1 GB default
  const percentageUsed = (totalEstimatedSize / maxKvSize) * 100;

  return Response.json({
    success: true,
    stats: {
      totalPosts,
      estimatedSize: totalEstimatedSize,
      indexSize,
      maxKvSize,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      warning: percentageUsed > 80,
      critical: percentageUsed > 95,
    }
  });
}
