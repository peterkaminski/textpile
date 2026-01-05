// Returns public configuration variables
import { TEXTPILE_VERSION } from "../../public/version.js";

export async function onRequestGet({ env }) {
  return Response.json({
    success: true,
    config: {
      instanceName: env.INSTANCE_NAME || "Textpile",
      communityName: env.COMMUNITY_NAME || "the community",
      adminEmail: env.ADMIN_EMAIL || null,
      defaultRetention: env.DEFAULT_RETENTION || "1month",
      dateFormat: env.DATE_FORMAT || "medium",  // short, medium, long, full
      timeFormat: env.TIME_FORMAT || "short",   // short (no seconds), medium (with seconds)
      textpileVersion: TEXTPILE_VERSION,
    }
  }, {
    headers: {
      "cache-control": "public, max-age=300",  // Cache for 5 minutes
    },
  });
}
