import { allocatePostIdKv } from '../lib/idAllocator.js';
import { checkKvNamespace } from '../lib/kv.js';

function nowIso() {
  return new Date().toISOString();
}

function clampTitle(title) {
  if (!title) return null;
  const t = String(title).trim().slice(0, 140);
  return t.length ? t : null;
}

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

// Map retention window names to seconds
const EXPIRY_MAP = {
  "1week": 7 * 24 * 60 * 60,
  "1month": 30 * 24 * 60 * 60,
  "3months": 90 * 24 * 60 * 60,
  "6months": 180 * 24 * 60 * 60,
  "1year": 365 * 24 * 60 * 60,
};

export async function onRequestPost({ request, env }) {
  const kvError = checkKvNamespace(env);
  if (kvError) return kvError;

  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON body." }, { status: 400 });
  }

  // Optional shared token gate: if ADD_POST_PASSWORD is set, require it.
  const required = env.ADD_POST_PASSWORD;
  if (required) {
    const token = (data?.token ? String(data.token) : "").trim();
    if (!token || !(await timingSafeEqual(token, required))) {
      return Response.json({ error: "Add post password required or invalid." }, { status: 403 });
    }
  }

  const body = data?.body;
  if (typeof body !== "string" || body.trim().length === 0) {
    return Response.json({ error: "Body is required." }, { status: 400 });
  }

  // Check post size
  const maxPostSize = parseInt(env.MAX_POST_SIZE) || 1048576; // 1 MB default
  const bodySize = new Blob([body]).size;
  if (bodySize > maxPostSize) {
    const sizeMB = (bodySize / 1048576).toFixed(2);
    const maxMB = (maxPostSize / 1048576).toFixed(2);
    return Response.json({
      error: `Post too large: ${sizeMB} MB (max ${maxMB} MB). Please reduce content size.`
    }, { status: 413 });
  }

  // Validate and get expiry period
  const expiryKey = data?.expiry || "1month"; // Default to 1 month
  const expirySeconds = EXPIRY_MAP[expiryKey];
  if (!expirySeconds) {
    return Response.json({ error: "Invalid expiry period. Must be one of: 1week, 1month, 3months, 6months, 1year." }, { status: 400 });
  }

  // No author identity accepted/stored. Title only.
  const title = clampTitle(data?.title);
  const pinned = data?.pinned === true; // Only accept explicit true
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();

  // Allocate unique ID using KV claim+verify protocol
  let id, allocToken;
  try {
    const allocation = await allocatePostIdKv(env.KV);
    id = allocation.id;
    allocToken = allocation.allocToken;
  } catch (err) {
    console.error('ID allocation failed:', err.message);
    return Response.json({
      error: 'Failed to allocate post ID. Please try again.'
    }, { status: 503 });
  }

  const url = `/p/${encodeURIComponent(id)}`;

  // Store post with TTL and metadata (including allocToken for verification)
  await env.KV.put(`post:${id}`, body, {
    expirationTtl: expirySeconds,
    metadata: { createdAt, title, expiresAt, pinned, allocToken }
  });

  // Verify post write (minimum cache TTL)
  const verifyResult = await env.KV.getWithMetadata(`post:${id}`, { cacheTtl: 30 });
  if (!verifyResult.value || !verifyResult.metadata) {
    console.error('Post write verification failed: post not found');
    return Response.json({
      error: 'Failed to create post. Please try again.'
    }, { status: 503 });
  }

  if (verifyResult.metadata.allocToken !== allocToken) {
    console.error('Post write verification failed: allocToken mismatch');
    return Response.json({
      error: 'Failed to create post (race condition). Please try again.'
    }, { status: 503 });
  }

  // Update index (prepend newest). Cap for sanity.
  // NOTE: Race condition possible if multiple posts added simultaneously.
  // For low-traffic sites, this is acceptable. Index will eventually be consistent.
  // If strict ordering is required, consider using Durable Objects or atomic operations.
  const rawIndex = await env.KV.get("index");
  let index = rawIndex ? JSON.parse(rawIndex) : [];

  // Filter out expired entries before adding new entry
  const now = Date.now();
  index = index.filter(item => {
    if (!item.expiresAt) return true; // Keep items without expiry (legacy)
    return new Date(item.expiresAt).getTime() > now;
  });

  const entry = { id, title, createdAt, expiresAt, pinned, url };

  // Sort: pinned first, then by date
  const next = [entry, ...index];
  next.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  await env.KV.put("index", JSON.stringify(next.slice(0, 10000)));

  return Response.json({ success: true, id, url }, { status: 201 });
}
