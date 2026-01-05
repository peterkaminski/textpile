function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function formatDateTime(dateString, dateFormat = "medium", timeFormat = "short") {
  if (!dateString) return "";
  const date = new Date(dateString);

  const dateFormatMap = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  };

  const timeFormatMap = {
    short: { hour: "numeric", minute: "2-digit" },
    medium: { hour: "numeric", minute: "2-digit", second: "2-digit" },
  };

  const dateOptions = dateFormatMap[dateFormat] || dateFormatMap.medium;
  const timeOptions = timeFormatMap[timeFormat] || timeFormatMap.short;

  const datePart = date.toLocaleDateString("en-US", dateOptions);
  const timePart = date.toLocaleTimeString("en-US", timeOptions);

  return `${datePart} ${timePart}`;
}

function renderFooter(adminEmail) {
  if (!adminEmail) return "";
  return `
    <hr />
    <footer class="site-footer">
      <p class="small">
        Questions? Contact <a href="mailto:${escapeHtml(adminEmail)}">${escapeHtml(adminEmail)}</a>
      </p>
    </footer>
  `;
}

export async function onRequestGet({ params, env }) {
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
  const dateFormat = env.DATE_FORMAT || "medium";
  const timeFormat = env.TIME_FORMAT || "short";
  const adminEmail = env.ADMIN_EMAIL || null;

  // Check if post has expired
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    const formattedExpiry = formatDateTime(expiresAt, dateFormat, timeFormat);
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
    <h1>Post Expired</h1>
    <div class="actions">
      <a href="/">Home</a>
      <a href="/submit">Add Post</a>
    </div>
  </header>

  <div class="card">
    <h2>This Textpile item has expired.</h2>
    <p>Textpile does not retain backups.</p>
    <p>If you need the text, ask the original author or check your own records.</p>
    <p class="meta">Post ID: ${escapeHtml(id)}</p>
    <p class="meta">Expired: ${escapeHtml(formattedExpiry)}</p>
  </div>

  ${renderFooter(adminEmail)}
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
  const formattedDate = formatDateTime(createdAt, dateFormat, timeFormat);
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
    <h1>${escapeHtml(title || "(untitled)")}</h1>
    <div class="actions">
      <a href="/">Home</a>
      <a href="/submit">Add Post</a>
    </div>
  </header>

  <div class="meta">${escapeHtml(formattedDate)} · ${escapeHtml(id)}</div>
  <hr />

  <article id="content"></article>

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    const raw = ${JSON.stringify(body)};
    document.getElementById("content").innerHTML = marked.parse(raw);
  </script>

  ${renderFooter(adminEmail)}
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
