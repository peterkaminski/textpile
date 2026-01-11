// RSS feed for recent posts
import { escapeXml } from "./lib/escape.js";

export async function onRequestGet({ env, request }) {
  const rawIndex = await env.KV.get("index");
  const items = rawIndex ? JSON.parse(rawIndex) : [];

  // Filter out expired items
  const now = Date.now();
  const activeItems = items.filter(item => {
    if (!item.expiresAt) return true;
    return new Date(item.expiresAt).getTime() > now;
  });

  // Take first 50 posts
  const recentItems = activeItems.slice(0, 50);

  // Get base URL from request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const communityName = env.COMMUNITY_NAME || "COMMUNITY_NAME";

  const rssItems = recentItems.map(item => {
    const pubDate = item.createdAt ? new Date(item.createdAt).toUTCString() : new Date().toUTCString();
    const title = item.title || "(untitled)";
    const link = `${baseUrl}${item.url}`;
    const guid = item.id;

    return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(title)}</description>
    </item>`.trim();
  }).join("\n");

  const buildDate = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Textpile - ${escapeXml(communityName)}</title>
    <link>${baseUrl}/</link>
    <description>Long-form posts for ${escapeXml(communityName)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes
    },
  });
}
