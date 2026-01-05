// Textpile client-side utilities
// Shared functions for configuration and formatting

// Global config (loaded on page load)
let CONFIG = {
  communityName: "the community",
  adminEmail: null,
  defaultRetention: "1month",
  dateFormat: "medium",
  timeFormat: "short",
};

// Load configuration from API
export async function loadConfig() {
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config) {
        CONFIG = data.config;
      }
    }
  } catch (err) {
    console.warn("Failed to load config, using defaults", err);
  }
  return CONFIG;
}

// Get config value
export function getConfig(key) {
  return CONFIG[key];
}

// Format date according to config
export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  const dateFormatMap = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },  // 1/4/26
    medium: { month: "short", day: "numeric", year: "numeric" },   // Jan 4, 2026
    long: { month: "long", day: "numeric", year: "numeric" },      // January 4, 2026
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" }, // Saturday, January 4, 2026
  };

  const dateOptions = dateFormatMap[CONFIG.dateFormat] || dateFormatMap.medium;
  return date.toLocaleDateString("en-US", dateOptions);
}

// Format time according to config
export function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  const timeFormatMap = {
    short: { hour: "numeric", minute: "2-digit" },               // 1:23 PM
    medium: { hour: "numeric", minute: "2-digit", second: "2-digit" }, // 1:23:45 PM
  };

  const timeOptions = timeFormatMap[CONFIG.timeFormat] || timeFormatMap.short;
  return date.toLocaleTimeString("en-US", timeOptions);
}

// Format date and time together
export function formatDateTime(dateString) {
  if (!dateString) return "";
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

// Apply community name to page
export function applyCommunityName() {
  const elements = document.querySelectorAll('[id="community-name"]');
  elements.forEach(el => {
    el.textContent = CONFIG.communityName;
  });
}

// Add footer to page if admin email is configured
export function addFooter() {
  if (!CONFIG.adminEmail) return;

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <hr />
    <p class="small">
      Questions? Contact <a href="mailto:${escapeHtml(CONFIG.adminEmail)}">${escapeHtml(CONFIG.adminEmail)}</a>
    </p>
  `;
  document.body.appendChild(footer);
}

// HTML escape helper
function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

// Initialize page with config
export async function initPage() {
  await loadConfig();
  applyCommunityName();
  addFooter();
}
