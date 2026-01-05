// Textpile client-side utilities
// Shared functions for configuration and formatting
import { TEXTPILE_VERSION } from "./version.js";
import { formatDate as formatDateICU, formatTime as formatTimeICU, formatDateTime as formatDateTimeICU } from "./date-formatter.js";

// Global config (loaded on page load)
let CONFIG = {
  instanceName: "Textpile",
  communityName: "the community",
  adminEmail: null,
  defaultRetention: "1month",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "HH:mm",
  textpileVersion: TEXTPILE_VERSION,
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
  return formatDateICU(dateString, CONFIG.dateFormat, 'en-US');
}

// Format time according to config
export function formatTime(dateString) {
  return formatTimeICU(dateString, CONFIG.timeFormat, 'en-US');
}

// Format date and time together
export function formatDateTime(dateString) {
  return formatDateTimeICU(dateString, CONFIG.dateFormat, CONFIG.timeFormat, 'en-US');
}

// Apply community name to page
export function applyCommunityName() {
  const elements = document.querySelectorAll('[id="community-name"]');
  elements.forEach(el => {
    el.textContent = CONFIG.communityName;
  });
}

// Update page title with instance name
export function updatePageTitle(pageTitle) {
  if (pageTitle) {
    document.title = `${pageTitle} - ${CONFIG.instanceName}`;
  } else {
    document.title = CONFIG.instanceName;
  }
}

// Update H1 with instance name (for homepage)
export function updateH1WithInstanceName() {
  const h1 = document.querySelector("header h1");
  if (h1 && h1.textContent === "Textpile") {
    h1.textContent = CONFIG.instanceName;
  }
}

// Add footer to page
export function addFooter() {
  const footer = document.createElement("footer");
  footer.className = "small";

  let footerHTML = '<hr />';

  // Footer format: "{instance_name} · operated by {email}\nInstance of Textpile {version}"
  footerHTML += `<strong>${escapeHtml(CONFIG.instanceName)}</strong>`;

  if (CONFIG.adminEmail) {
    footerHTML += ` &middot; operated by <a href="mailto:${escapeHtml(CONFIG.adminEmail)}">${escapeHtml(CONFIG.adminEmail)}</a>`;
  }

  footerHTML += '<br>';
  footerHTML += 'Instance of ';
  footerHTML += `<a href="https://github.com/peterkaminski/textpile">Textpile ${escapeHtml(CONFIG.textpileVersion)}</a>`;

  footer.innerHTML = footerHTML;
  document.body.appendChild(footer);
}

// HTML escape helper
function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

// Initialize page with config
// Options:
//   pageTitle: string - page title to append to instance name (e.g., "Add Post")
//   updateH1: boolean - whether to update H1 with instance name (for homepage)
export async function initPage(options = {}) {
  await loadConfig();
  applyCommunityName();

  if (options.pageTitle) {
    updatePageTitle(options.pageTitle);
  } else if (options.updateH1) {
    updateH1WithInstanceName();
  }

  addFooter();
}
