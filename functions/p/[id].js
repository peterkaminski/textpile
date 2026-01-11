// Render post detail page
import { formatDateTime } from "../../public/date-formatter.js";
import { escapeHtml } from "../lib/escape.js";
import { checkKvNamespace } from "../lib/kv.js";

export async function onRequestGet({ params, env }) {
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
    const formattedExpiry = formatDateTime(expiresAt, dateFormat, timeFormat, 'en-US');
    const expiredHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Post Expired</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <header>
    <a id="instance-name" class="instance-name" href="/">Textpile</a>
    <div class="actions">
      <a href="/">Home</a>
      <span class="separator" aria-hidden="true">&middot;</span>
      <a href="/about">About</a>
      <span class="separator" aria-hidden="true">&middot;</span>
      <a href="/add">Add Post</a>
    </div>
  </header>

  <h1>Post Expired</h1>

  <div class="card">
    <h2>This Textpile item has expired.</h2>
    <p>Textpile does not retain backups.</p>
    <p>If you need the text, ask the original author or check your own records.</p>
    <p class="meta">Post ID: ${escapeHtml(id)}</p>
    <p class="meta">Expired: ${escapeHtml(formattedExpiry)}</p>
  </div>

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

  // Render Markdown client-side using marked (CDN) to keep the function tiny.
  const formattedDate = formatDateTime(createdAt, dateFormat, timeFormat, 'en-US');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title || "Post")}</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <header>
    <a id="instance-name" class="instance-name" href="/">Textpile</a>
    <div class="actions">
      <a href="/">Home</a>
      <span class="separator" aria-hidden="true">&middot;</span>
      <a href="/about">About</a>
      <span class="separator" aria-hidden="true">&middot;</span>
      <a href="/add">Add Post</a>
    </div>
  </header>

  <h1>${escapeHtml(title || "(untitled)")}</h1>

  <div class="meta">${escapeHtml(formattedDate)} · ${escapeHtml(id)}</div>

  <div class="actions" style="margin: 12px 0;">
    <button id="toggle-render-btn">View as plain text</button>
    <button id="copy-btn">Copy text</button>
    <button id="copy-url-btn">Copy URL</button>
    <span id="copy-msg" class="small"></span>
  </div>

  <hr />

  <article id="content"></article>

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script type="module">
    import { initPage } from '/textpile-utils.js';

    // Initialize page with title
    await initPage({ pageTitle: ${JSON.stringify(title || "Post")} });
  </script>
  <script>
    const raw = ${JSON.stringify(body)};
    const content = document.getElementById("content");
    let renderMode = "formatted";

    function render() {
      if (renderMode === "formatted") {
        content.innerHTML = marked.parse(raw);
        document.getElementById("toggle-render-btn").textContent = "View as plain text";
      } else {
        content.innerHTML = \`<pre style="white-space: pre-wrap;">\${raw}</pre>\`;
        document.getElementById("toggle-render-btn").textContent = "View formatted";
      }
    }

    render();

    document.getElementById("toggle-render-btn").addEventListener("click", () => {
      renderMode = renderMode === "formatted" ? "plain" : "formatted";
      render();
    });

    document.getElementById("copy-btn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(raw);
        const msg = document.getElementById("copy-msg");
        msg.textContent = "Copied!";
        setTimeout(() => msg.textContent = "", 2000);
      } catch (err) {
        alert("Failed to copy: " + err.message);
      }
    });

    document.getElementById("copy-url-btn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const msg = document.getElementById("copy-msg");
        msg.textContent = "URL copied!";
        setTimeout(() => msg.textContent = "", 2000);
      } catch (err) {
        alert("Failed to copy URL: " + err.message);
      }
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
