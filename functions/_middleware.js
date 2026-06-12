// Optional site-wide HTTP Basic Auth.
//
// Opt-in: set both BASIC_AUTH_USER and BASIC_AUTH_PASS environment
// variables to enable. When either is unset, requests pass through
// unchanged. Covers all routes — pages, API endpoints, RSS feed, and
// static assets.
//
// Implemented as Pages Functions middleware rather than an advanced-mode
// _worker.js: a _worker.js in the build output directory would disable
// the functions/ directory entirely.

export async function onRequest({ request, env, next }) {
  const user = env.BASIC_AUTH_USER || "";
  const pass = env.BASIC_AUTH_PASS || "";

  // Feature disabled - pass through.
  if (!user || !pass) return next();

  const auth = request.headers.get("Authorization") || "";
  if (!isValidBasicAuth(auth, user, pass)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Restricted", charset="UTF-8"',
        "Cache-Control": "no-store",
      },
    });
  }

  return next();
}

function isValidBasicAuth(authHeader, expectedUser, expectedPass) {
  const [scheme, encoded] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return false;

  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }

  const idx = decoded.indexOf(":");
  if (idx < 0) return false;

  const u = decoded.slice(0, idx);
  const p = decoded.slice(idx + 1);

  return timingSafeEqual(u, expectedUser) && timingSafeEqual(p, expectedPass);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
