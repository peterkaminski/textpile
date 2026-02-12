// Render post detail page
import { marked } from "marked";
import { formatDateTime } from "../../public/date-formatter.js";
import { escapeHtml } from "../lib/escape.js";
import { checkKvNamespace } from "../lib/kv.js";

marked.setOptions({
  gfm: true,
  breaks: true,
});

function sanitizeFilename(name) {
  const safe = String(name || "untitled")
    .replace(/[\/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 200);
  return safe || "untitled";
}

function stripMarkdown(markdown) {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[#>\-+*\s]+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function generateExcerpt(markdown, maxLength = 200) {
  const text = stripMarkdown(markdown);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function safeJson(value) {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

function getBaseUrl(request, env) {
  if (env.BASE_URL) {
    return String(env.BASE_URL).replace(/\/+$/, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function wantsPlainText(request, format) {
  if (format === "text") return true;

  const accept = (request.headers.get("accept") || "").toLowerCase();
  return accept.includes("text/plain");
}

function wantsMarkdown(request, format) {
  if (format === "markdown") return true;

  const accept = (request.headers.get("accept") || "").toLowerCase();
  return accept.includes("text/markdown") || accept.includes("text/x-markdown");
}

export async function onRequestGet({ params, env, request }) {
  const kvError = checkKvNamespace(env);
  if (kvError) return kvError;

  const id = params.id;

  // Single KV fetch with metadata
  const result = await env.KV.getWithMetadata(`post:${id}`, { type: "text" });

  if (!result.value) {
    return new Response("Not found", { status: 404 });
  }

  const body = result.value;
  const metadata = result.metadata || {};
  const title = metadata.title || null;
  const createdAt = metadata.createdAt || null;
  const expiresAt = metadata.expiresAt || null;

  // Get config from env
  const dateFormat = env.DATE_FORMAT || "YYYY-MM-DD";
  const timeFormat = env.TIME_FORMAT || "HH:mm";

  // Check if post has expired
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    const formattedExpiry = formatDateTime(expiresAt, dateFormat, timeFormat, "en-US");
    const expiredHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <title>Post Expired</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header>
    <a id="instance-name" class="instance-name" href="/">Textpile</a>
    <nav class="actions" aria-label="Site navigation">
      <a href="/">Home</a>
      <span class="separator" aria-hidden="true">&middot;</span>
      <a href="/about">About</a>
      <span class="separator" aria-hidden="true">&middot;</span>
      <a href="/add">Add Post</a>
    </nav>
  </header>

  <main id="main-content">
    <h1>Post Expired</h1>

    <article class="card">
      <h2>This Textpile item has expired.</h2>
      <p>Textpile does not retain backups.</p>
      <p>If you need the text, ask the original author or check your own records.</p>
      <p class="meta">Post ID: ${escapeHtml(id)}</p>
      <p class="meta">Expired: ${escapeHtml(formattedExpiry)}</p>
    </article>
  </main>

  <script type="module">
    import { initPage } from '/textpile-utils.js';
    await initPage({ pageTitle: "Post Expired" });
  </script>
</body>
</html>`;

    return new Response(expiredHtml, {
      status: 410,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const requestUrl = new URL(request.url);
  const format = (requestUrl.searchParams.get("format") || "").toLowerCase();

  if (wantsPlainText(request, format) || wantsMarkdown(request, format)) {
    const preferredPlain = wantsPlainText(request, format);
    const contentType = preferredPlain ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8";
    const filename = `${sanitizeFilename(title || id)}.${preferredPlain ? "txt" : "md"}`;

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": `inline; filename="${filename}"`,
        "cache-control": "no-store",
        "vary": "Accept",
      },
    });
  }

  const baseUrl = getBaseUrl(request, env);
  const postPath = `/p/${encodeURIComponent(id)}`;
  const canonicalUrl = `${baseUrl}${postPath}`;

  // Server-render markdown for bots, no-JS clients, and faster first paint.
  const renderedBody = marked.parse(body);

  const formattedDate = createdAt
    ? formatDateTime(createdAt, dateFormat, timeFormat, "en-US")
    : "Unknown";

  let formattedExpiry = null;
  let daysRemaining = null;
  if (expiresAt) {
    formattedExpiry = formatDateTime(expiresAt, dateFormat, timeFormat, "en-US");
    const msRemaining = new Date(expiresAt).getTime() - Date.now();
    daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  }

  const expirationInfo = formattedExpiry && daysRemaining > 0 ? ` · Expires ${formattedExpiry}` : "";
  const excerpt = generateExcerpt(body, 200);
  const postTitle = title || "(untitled)";
  const instanceName = env.INSTANCE_NAME || "Textpile";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: postTitle,
    datePublished: createdAt,
    dateModified: createdAt,
    expires: expiresAt || undefined,
    author: {
      "@type": "Organization",
      name: "Anonymous",
    },
    publisher: {
      "@type": "Organization",
      name: instanceName,
      url: baseUrl,
    },
    articleBody: body,
    url: canonicalUrl,
    identifier: id,
    mainEntityOfPage: canonicalUrl,
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <title>${escapeHtml(postTitle)}</title>
  <meta name="description" content="${escapeHtml(excerpt)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="home" href="${baseUrl}/" />
  <link rel="alternate" type="text/markdown" href="${escapeHtml(postPath)}?format=markdown" />
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="${baseUrl}/feed.xml" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(postTitle)}" />
  <meta property="og:description" content="${escapeHtml(excerpt)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="${escapeHtml(instanceName)}" />
  ${createdAt ? `<meta property="article:published_time" content="${escapeHtml(createdAt)}" />` : ""}
  ${expiresAt ? `<meta property="article:expiration_time" content="${escapeHtml(expiresAt)}" />` : ""}

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(postTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(excerpt)}" />

  <script type="application/ld+json">${safeJson(jsonLd)}</script>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header>
    <a id="instance-name" class="instance-name" href="/">Textpile</a>
    <nav class="actions" aria-label="Site navigation">
      <a href="/">Home</a>
      <span class="separator" aria-hidden="true">&middot;</span>
      <a href="/about">About</a>
      <span class="separator" aria-hidden="true">&middot;</span>
      <a href="/add">Add Post</a>
    </nav>
  </header>

  <main id="main-content">
    <article id="content" class="post-content">
      <header>
        <h1>${escapeHtml(postTitle)}</h1>
        <dl class="meta post-meta-list">
          <dt>Created</dt>
          <dd><time datetime="${escapeHtml(createdAt || "")}">${escapeHtml(formattedDate)}</time>${escapeHtml(expirationInfo)} · ${escapeHtml(id)}</dd>
        </dl>
      </header>

      <div id="expiration-banner"></div>

      <div class="actions" style="margin: 12px 0; gap: 0.2em;">
        <button id="toggle-render-btn">View as plain text</button>
        <button id="copy-btn">Copy text</button>
        <button id="copy-url-btn">Copy URL</button>
        <button id="copy-title-url-btn">Copy Title and URL</button>
        <button id="download-btn">Download</button>
        <span id="copy-msg" class="small"></span>
      </div>

      <hr />

      <div id="post-body">${renderedBody}</div>
    </article>
  </main>

  <script type="module">
    import { initPage } from '/textpile-utils.js';

    // Initialize page with title
    await initPage({ pageTitle: ${safeJson(postTitle)} });
  </script>
  <script>
    const raw = ${safeJson(body)};
    const rendered = ${safeJson(renderedBody)};
    const expiresAt = ${safeJson(expiresAt)};
    const content = document.getElementById('post-body');
    let renderMode = 'formatted';

    function render() {
      if (renderMode === 'formatted') {
        content.innerHTML = rendered;
        document.getElementById('toggle-render-btn').textContent = 'View as plain text';
      } else {
        content.textContent = '';
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.textContent = raw;
        content.appendChild(pre);
        document.getElementById('toggle-render-btn').textContent = 'View formatted';
      }
    }

    document.getElementById('toggle-render-btn').addEventListener('click', () => {
      renderMode = renderMode === 'formatted' ? 'plain' : 'formatted';
      render();
    });

    document.getElementById('copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(raw);
        const msg = document.getElementById('copy-msg');
        msg.textContent = 'Copied!';
        setTimeout(() => msg.textContent = '', 2000);
      } catch (err) {
        alert('Failed to copy: ' + err.message);
      }
    });

    document.getElementById('copy-url-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const msg = document.getElementById('copy-msg');
        msg.textContent = 'URL copied!';
        setTimeout(() => msg.textContent = '', 2000);
      } catch (err) {
        alert('Failed to copy URL: ' + err.message);
      }
    });

    async function fetchConfig() {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        return data.config;
      } catch (err) {
        console.error('Failed to fetch config:', err);
        return {};
      }
    }

    function isTemplateString(format) {
      return format.includes('$' + '{');
    }

    function isValidTemplate(format) {
      const placeholderRegex = /\\$\\{(\\w+)\\}/g;
      const matches = [...format.matchAll(placeholderRegex)];

      for (const match of matches) {
        if (match[1] !== 'title' && match[1] !== 'url') {
          return false;
        }
      }

      if (format.length > 500) {
        return false;
      }

      return true;
    }

    function formatTitleAndUrl(input) {
      const resolvedTitle = input.title && input.title.trim()
        ? input.title.trim()
        : 'Post from ' + input.instanceName;

      if (input.format === 'markdown') return '[' + resolvedTitle + '](' + input.url + ')';
      if (input.format === 'multiline') return '"' + resolvedTitle + '"\\n' + input.url;
      if (input.format === 'plain') return resolvedTitle + ' - ' + input.url;

      if (isTemplateString(input.format) && isValidTemplate(input.format)) {
        return input.format
          .replaceAll('$' + '{title}', resolvedTitle)
          .replaceAll('$' + '{url}', input.url);
      }

      console.warn('Invalid COPY_TITLE_AND_URL_FORMAT; falling back to plain');
      return resolvedTitle + ' - ' + input.url;
    }

    document.getElementById('copy-title-url-btn').addEventListener('click', async () => {
      try {
        const config = await fetchConfig();
        const postTitle = ${safeJson(title)};
        const postUrl = window.location.href;
        const format = config.copyTitleAndUrlFormat || 'plain';
        const instanceName = config.instanceName || 'Textpile';

        const formattedText = formatTitleAndUrl({
          title: postTitle,
          url: postUrl,
          format: format,
          instanceName: instanceName
        });

        await navigator.clipboard.writeText(formattedText);
        const msg = document.getElementById('copy-msg');
        msg.textContent = 'Copied!';
        setTimeout(() => msg.textContent = '', 2000);
      } catch (err) {
        alert('Failed to copy: ' + err.message);
      }
    });

    document.getElementById('download-btn').addEventListener('click', () => {
      try {
        const postTitle = ${safeJson(title)};
        const postId = ${safeJson(id)};

        let filename = postTitle || 'untitled';
        filename = filename
          .replace(/[/\\:*?"<>|]/g, '-')
          .replace(/\\s+/g, ' ')
          .trim()
          .replace(/^\\.+/, '')
          .substring(0, 200);

        if (!filename) {
          filename = postId;
        }

        filename = filename + '.md';

        const blob = new Blob([raw], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const msg = document.getElementById('copy-msg');
        msg.textContent = 'Downloaded!';
        setTimeout(() => msg.textContent = '', 2000);
      } catch (err) {
        alert('Failed to download: ' + err.message);
      }
    });

    if (expiresAt) {
      const banner = document.getElementById('expiration-banner');
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      const msRemaining = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0) {
        let message;
        let bannerClass = 'info-banner';

        if (daysRemaining <= 7) {
          message = '⚠️ This post will expire in <strong>' + daysRemaining + ' day' + (daysRemaining === 1 ? '' : 's') + '</strong>. Save it now if you want to keep it.';
          bannerClass = 'info-banner warning';
        } else {
          message = 'This post will expire in <strong>' + daysRemaining + ' days</strong>. Save it now if you want to keep it.';
        }

        banner.innerHTML = '<div class="' + bannerClass + '">' + message + '</div>';
      }
    }

    render();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "link": `<${postPath}?format=markdown>; rel="alternate"; type="text/markdown"`,
      "vary": "Accept",
    },
  });
}
