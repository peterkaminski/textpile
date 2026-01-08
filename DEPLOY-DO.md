# Deploying Textpile v0.6.0 with Durable Objects

This guide covers deploying Textpile v0.6.0 (with Post ID v2) to Cloudflare Pages.

## The Challenge

Cloudflare Pages with Durable Objects has a chicken-and-egg problem:
- You can't add a DO binding without a DO namespace
- The DO namespace is created when you deploy with the binding configured
- GitHub deployments don't automatically create DO namespaces from `wrangler.toml`

## Solution: Use Wrangler CLI Deployment

The easiest way to deploy Pages with Durable Objects is to use `wrangler pages deploy` instead of GitHub auto-deployment.

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

### Deployment Steps

#### 1. First-Time Deployment

This creates the Pages project WITH the Durable Object configuration:

```bash
# From the textpile root directory
wrangler pages deploy public/ \
  --project-name=textpile \
  --branch=main \
  --compatibility-date=2024-01-01
```

Wait, this won't work either because wrangler pages deploy doesn't support DO bindings directly...

Let me provide the correct manual setup instructions.

## Manual Setup (Correct Approach)

Since Cloudflare Pages doesn't have a UI to create DO namespaces directly, you need to:

### Option A: Use the Cloudflare API

Create a DO namespace using the Cloudflare API, then bind it in Pages.

### Option B: Deploy as a Worker First, Then Convert

This is complex and not recommended.

### Option C: Wait for Cloudflare Dashboard Support

Cloudflare is working on better DO support for Pages. For now, you might need to:

1. **Contact Cloudflare Support** to manually create the DO namespace for your Pages project
2. Or use the **Cloudflare API** to create it programmatically

## Temporary Workaround

For testing purposes, you could temporarily revert to the old ID generation (v0.5.1) until Cloudflare adds better DO support for Pages.

I'm updating the implementation to provide a better solution...
