// Admin endpoint: Get environment variables configuration
import { timingSafeEqual } from "../../lib/auth.js";

export async function onRequestGet({ env, request }) {
  // Require admin authentication
  const adminToken = env.ADMIN_TOKEN;
  if (!adminToken) {
    return Response.json({ error: "Admin functionality not configured." }, { status: 403 });
  }

  // Check Authorization header
  const authHeader = request.headers.get("Authorization");
  const providedToken = authHeader?.replace("Bearer ", "")?.trim() || "";
  
  if (!providedToken || !(await timingSafeEqual(providedToken, adminToken))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Build environment variables list
  const envVars = [
    {
      category: "Identity & Branding",
      variables: [
        {
          name: "INSTANCE_NAME",
          value: env.INSTANCE_NAME || "(unset)",
          possibleValues: "Any string",
          description: "Name of this Textpile instance"
        },
        {
          name: "COMMUNITY_NAME",
          value: env.COMMUNITY_NAME || "(unset)",
          possibleValues: "Any string",
          description: "Community or group using this instance"
        },
        {
          name: "ADMIN_EMAIL",
          value: env.ADMIN_EMAIL || "(unset)",
          possibleValues: "Email address",
          description: "Contact email shown in footer"
        }
      ]
    },
    {
      category: "Access Control",
      variables: [
        {
          name: "ADD_POST_PASSWORD",
          value: env.ADD_POST_PASSWORD || "(unset)",
          possibleValues: "Random string",
          description: "Shared password for adding posts"
        },
        {
          name: "ADMIN_TOKEN",
          value: env.ADMIN_TOKEN || "(unset)",
          possibleValues: "Random string",
          description: "Admin access token"
        }
      ]
    },
    {
      category: "Content Retention",
      variables: [
        {
          name: "DEFAULT_RETENTION",
          value: env.DEFAULT_RETENTION || "(unset)",
          possibleValues: "1week, 1month, 3months, 6months, 1year",
          description: "Default retention period for new posts"
        }
      ]
    },
    {
      category: "Display & Formatting",
      variables: [
        {
          name: "DATE_FORMAT",
          value: env.DATE_FORMAT || "(unset)",
          possibleValues: "Date format string (e.g., 'YYYY-MM-DD', 'MMM D, YYYY')",
          description: "Date display format"
        },
        {
          name: "TIME_FORMAT",
          value: env.TIME_FORMAT || "(unset)",
          possibleValues: "Time format string (e.g., 'HH:mm', 'h:mm a')",
          description: "Time display format"
        }
      ]
    }
  ];

  return Response.json({
    success: true,
    envVars
  });
}
