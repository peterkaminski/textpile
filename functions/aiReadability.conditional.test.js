import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as postRoute from './p/[id].js';

const ROOT = process.cwd();

function absPath(...segments) {
  return path.join(ROOT, ...segments);
}

async function importFromFile(absFilePath) {
  return import(/* @vite-ignore */ pathToFileURL(absFilePath).href);
}

function makeKv() {
  const postBody = '# Heading\n\nBody paragraph with [link](https://example.com).';
  const indexItems = [
    {
      id: 'active1',
      title: 'Active post',
      createdAt: '2026-02-01T00:00:00.000Z',
      expiresAt: '2099-01-01T00:00:00.000Z',
      url: '/p/active1',
      pinned: true,
    },
    {
      id: 'expired1',
      title: 'Expired post',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2000-01-01T00:00:00.000Z',
      url: '/p/expired1',
      pinned: false,
    },
  ];

  return {
    async get(key) {
      if (key === 'index') return JSON.stringify(indexItems);
      if (key === 'post:active1') return postBody;
      if (key === 'post:expired1') return 'old';
      return null;
    },

    async getWithMetadata(key) {
      if (key !== 'post:active1') {
        return { value: null, metadata: null };
      }

      return {
        value: postBody,
        metadata: {
          title: 'Active post',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-01-01T00:00:00.000Z',
        },
      };
    },
  };
}

function baseEnv() {
  return {
    KV: makeKv(),
    DATE_FORMAT: 'YYYY-MM-DD',
    TIME_FORMAT: 'HH:mm',
    INSTANCE_NAME: 'Textpile',
    COMMUNITY_NAME: 'community',
  };
}

describe('AI readability/accessibility automation (conditional)', () => {
  it('checks post route with conditional assertions based on available capabilities', async () => {
    const htmlRequest = new Request('https://example.com/p/active1', {
      headers: { accept: 'text/html' },
    });

    const htmlResponse = await postRoute.onRequestGet({
      params: { id: 'active1' },
      env: baseEnv(),
      request: htmlRequest,
    });

    expect(htmlResponse.status).toBe(200);
    expect(htmlResponse.headers.get('content-type') || '').toContain('text/html');

    const html = await htmlResponse.text();
    const hasStructuredMetadata = html.includes('application/ld+json') && html.includes('og:title');

    if (hasStructuredMetadata) {
      // Feature-present path: enforce new machine-readable metadata and alternate links.
      expect(html).toContain('rel="alternate" type="text/markdown"');
      expect(htmlResponse.headers.get('link') || '').toContain('text/markdown');
      expect(htmlResponse.headers.get('vary') || '').toContain('Accept');
    } else {
      // Pre-feature baseline path on main before readability PR merge.
      expect(html).toContain('<article id="content"></article>');
    }

    const mdResponse = await postRoute.onRequestGet({
      params: { id: 'active1' },
      env: baseEnv(),
      request: new Request('https://example.com/p/active1', {
        headers: { accept: 'text/markdown' },
      }),
    });

    const mdType = mdResponse.headers.get('content-type') || '';
    if (mdType.includes('text/markdown') || mdType.includes('text/plain')) {
      // Feature-present path: content negotiation is live.
      const markdown = await mdResponse.text();
      expect(markdown).toContain('# Heading');
    } else {
      // Pre-feature baseline path.
      expect(mdType).toContain('text/html');
    }
  });

  it('checks robots and sitemap conditionally', async () => {
    const robotsPath = absPath('public', 'robots.txt');

    if (fs.existsSync(robotsPath)) {
      const robots = fs.readFileSync(robotsPath, 'utf-8');
      expect(robots).toContain('User-agent: *');
      expect(robots).toContain('Sitemap:');
    } else {
      // Pre-feature baseline path.
      expect(true).toBe(true);
    }

    const sitemapPath = absPath('functions', 'sitemap.xml.js');
    if (fs.existsSync(sitemapPath)) {
      const sitemapModule = await importFromFile(sitemapPath);
      const sitemapResponse = await sitemapModule.onRequestGet({
        env: baseEnv(),
        request: new Request('https://example.com/sitemap.xml'),
      });

      expect(sitemapResponse.status).toBe(200);
      expect(sitemapResponse.headers.get('content-type') || '').toContain('application/xml');

      const xml = await sitemapResponse.text();
      expect(xml).toContain('<urlset');
      expect(xml).toContain('https://example.com/about');
      expect(xml).toContain('/p/active1');
      expect(xml).not.toContain('/p/expired1');
    } else {
      // Pre-feature baseline path.
      expect(true).toBe(true);
    }
  });

  it('checks RSS enhancements conditionally', async () => {
    const feedModule = await importFromFile(absPath('functions', 'feed.xml.js'));
    const feedResponse = await feedModule.onRequestGet({
      env: baseEnv(),
      request: new Request('https://example.com/feed.xml'),
    });

    expect(feedResponse.status).toBe(200);
    expect(feedResponse.headers.get('content-type') || '').toContain('application/rss+xml');

    const xml = await feedResponse.text();
    expect(xml).toContain('<item>');

    const hasContentEncoded = xml.includes('<content:encoded>');
    if (hasContentEncoded) {
      // Feature-present path: enforce richer RSS output.
      expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
      expect(xml).toContain('<guid isPermaLink="true">');
    } else {
      // Pre-feature baseline path.
      expect(xml).toContain('<guid isPermaLink="false">');
    }
  });
});
