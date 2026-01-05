// Textpile client-side utilities
// Shared functions for configuration and formatting

// Global config (loaded on page load)
let CONFIG = {
  instanceName: "Textpile",
  communityName: "the community",
  adminEmail: null,
  defaultRetention: "1month",
  dateFormat: "medium",
  timeFormat: "short",
  textpileVersion: "0.3.1",
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
  footer.className = "site-footer";

  let footerHTML = '<hr /><p class="small">';

  // Footer format: "This is an instance of Textpile {version}, operated by {email}."
  footerHTML += 'This is an instance of ';
  footerHTML += `<a href="https://github.com/peterkaminski/textpile">Textpile ${escapeHtml(CONFIG.textpileVersion)}</a>`;

  if (CONFIG.adminEmail) {
    footerHTML += `, operated by <a href="mailto:${escapeHtml(CONFIG.adminEmail)}">${escapeHtml(CONFIG.adminEmail)}</a>`;
  }

  footerHTML += '.</p>';
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
