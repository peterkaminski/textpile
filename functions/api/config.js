// Returns public configuration variables
import { TEXTPILE_VERSION } from "../../public/version.js";

export async function onRequestGet({ env }) {
  return Response.json({
    success: true,
    config: {
      instanceName: env.INSTANCE_NAME || "INSTANCE_NAME",
      communityName: env.COMMUNITY_NAME || "COMMUNITY_NAME",
      adminEmail: env.ADMIN_EMAIL || "ADMIN_EMAIL",
      defaultRetention: env.DEFAULT_RETENTION || "1month",
      dateFormat: env.DATE_FORMAT || "YYYY-MM-DD",  // ICU format string (e.g., "DD/MM/YYYY", "YYYY年MM月DD日")
      timeFormat: env.TIME_FORMAT || "HH:mm",       // ICU format string (e.g., "h:mm a", "HH:mm:ss")
      textpileVersion: TEXTPILE_VERSION,
    }
  }, {
    headers: {
      "cache-control": "public, max-age=300",  // Cache for 5 minutes
    },
  });
}
