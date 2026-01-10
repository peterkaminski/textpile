# Textpile Installation Guide

This guide walks through deploying Textpile on Cloudflare Pages with KV storage.

## Prerequisites

- GitHub account
- Cloudflare account (free tier works fine)
- Git installed locally (if deploying from local repository)

## Deployment Steps

### 1. Prepare Your Repository

**Option A: Fork or clone this repository**
```bash
git clone https://github.com/YOUR_USERNAME/textpile.git
cd textpile
```

**Option B: Already have this repository locally**
- Ensure all files are committed
- Push to GitHub if not already there

### 2. Create a Cloudflare KV Namespace

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers KV**
3. Click **+ Create Instance**
4. Name it (e.g., `TEXTPILE_STORAGE` or `COMMUNITY_PASTES`)
5. Click **Add**
6. Note the namespace ID for later

### 3. Create a Cloudflare Pages Project

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Click **Create application** → **Pages** → **Connect to Git**
3. Authorize Cloudflare to access your GitHub account
4. Select your Textpile repository
5. Configure build settings:
   - **Framework preset**: None
   - **Build command**: *(leave blank)*
   - **Build output directory**: `public`
6. Click **Save and Deploy**

### 4. Bind the KV Namespace

1. In your Pages project, go to **Settings** → **Functions**
2. Scroll to **KV namespace bindings**
3. Click **Add binding**
4. Configure:
   - **Variable name**: `KV` (must be exactly this)
   - **KV namespace**: Select the namespace you created in step 2
5. Click **Save**

### 5. Configure Environment Variables (Optional)

Navigate to **Settings** → **Environment variables**

**For complete configuration reference**, see **[CONFIGURATION.md](CONFIGURATION.md)** - comprehensive documentation of all environment variables with examples, defaults, and best practices.

**Quick setup instructions** for the most common variables are below:

#### Optional: Submit Token (Anti-Spam)

To require a shared token for submissions:

1. Click **Add variable**
2. **Variable name**: `ADD_POST_PASSWORD`
3. **Value**: A secret string (e.g., generate with `openssl rand -hex 32`)
4. **Environment**: Production (and Preview if desired)
5. Click **Save**

**Behavior:**
- If set, users must provide this token when submitting
- Share the token privately with your community members
- If not set, submissions are open to everyone

#### Optional: Admin Token (Admin Interface & Quick Takedown)

To enable the admin interface at `/admin` and `/api/remove` endpoint:

1. Click **Add variable**
2. **Variable name**: `ADMIN_TOKEN`
3. **Value**: A different secret string (e.g., generate with `openssl rand -hex 32`)
4. **Environment**: Production
5. Click **Save**

**Admin Interface:**
- Visit `https://YOURDOMAIN/admin` to access the admin panel
- Enter your ADMIN_TOKEN to authenticate
- Manage posts, export/import data, view storage statistics

**API Usage:**
```bash
curl -X POST https://YOURDOMAIN/api/remove \
  -H 'content-type: application/json' \
  -d '{"id":"POST_ID","token":"YOUR_ADMIN_TOKEN"}'
```

#### Optional: Community Name

Customize the community name shown throughout the site:

1. Click **Add variable**
2. **Variable name**: `COMMUNITY_NAME`
3. **Value**: Your community name (e.g., "Acme Research Team")
4. **Environment**: Production
5. Click **Save**

**Default**: "the community"

#### Optional: Admin Email

Display a contact email in the footer of all pages:

1. Click **Add variable**
2. **Variable name**: `ADMIN_EMAIL`
3. **Value**: Your contact email (e.g., "admin@example.com")
4. **Environment**: Production
5. Click **Save**

**Default**: No footer shown (if not set)

#### Optional: Default Retention Period

Set the default retention window selected in the submit form:

1. Click **Add variable**
2. **Variable name**: `DEFAULT_RETENTION`
3. **Value**: One of: `1week`, `1month`, `3months`, `6months`, `1year`
4. **Environment**: Production
5. Click **Save**

**Default**: `1month`

#### Optional: Date and Time Formatting

Customize how dates and times are displayed:

**Date Format:**
1. Click **Add variable**
2. **Variable name**: `DATE_FORMAT`
3. **Value**: One of: `short`, `medium`, `long`, `full`
4. **Environment**: Production
5. Click **Save**

**Examples:**
- `short`: 1/4/26
- `medium`: Jan 4, 2026 (default)
- `long`: January 4, 2026
- `full`: Saturday, January 4, 2026

**Time Format:**
1. Click **Add variable**
2. **Variable name**: `TIME_FORMAT`
3. **Value**: One of: `short`, `medium`
4. **Environment**: Production
5. Click **Save**

**Examples:**
- `short`: 1:23 PM (default, no seconds)
- `medium`: 1:23:45 PM (with seconds)

#### Optional: Size Limits

Control maximum post and total storage sizes:

**Maximum Post Size:**
1. Click **Add variable**
2. **Variable name**: `MAX_POST_SIZE`
3. **Value**: Size in bytes (default: `1048576` = 1 MB)
4. **Environment**: Production
5. Click **Save**

**Maximum KV Storage:**
1. Click **Add variable**
2. **Variable name**: `MAX_KV_SIZE`
3. **Value**: Size in bytes (default: `1048576000` = 1000 MB)
4. **Environment**: Production
5. Click **Save**

**Note**: The admin interface uses MAX_KV_SIZE to calculate storage usage and show warnings at 80% and 95% capacity.

### 6. Verify Deployment

1. Wait for the deployment to complete (usually < 1 minute)
2. Visit your Pages URL (e.g., `textpile.pages.dev`)
3. You should see the Textpile home page
4. Try adding a test post via `/add`
5. Verify it appears on the home page and can be viewed

## Local Development (Optional)

To test Textpile locally before deploying:

### Install Wrangler CLI

```bash
npm install -g wrangler
```

### Create Local KV Namespace

```bash
wrangler kv:namespace create KV --preview
```

### Run Development Server

```bash
wrangler pages dev public/ --kv=KV
```

This starts a local server (usually at `http://localhost:8788`) with KV bindings.

### Test Local Environment Variables

Create a `.dev.vars` file (automatically gitignored):

```
ADD_POST_PASSWORD=your-test-token
ADMIN_TOKEN=your-admin-token
```

Wrangler will automatically load these during local development.

## Post-Installation Configuration

### Custom Domain (Optional)

1. In Pages project settings, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

### Monitoring

Cloudflare Pages provides built-in analytics:
- **Analytics** tab shows traffic and requests
- **Functions** tab shows function invocations and errors
- **Logs** available via `wrangler pages deployment tail`

## Troubleshooting

### 500 errors after deployment (Most Common)

**Symptom**: Homepage shows "Failed to load posts" with 500 error, or submit fails with 500 error.

**Cause**: KV namespace binding was added but site wasn't redeployed afterward.

**Solution**:
1. Verify KV binding exists: Settings → Functions → KV namespace bindings
2. **Redeploy the site**:
   - Go to Deployments tab
   - Click "Retry deployment" on latest deployment
   - OR push a new commit to trigger deployment
3. Wait for deployment to complete (~1 minute)
4. Test: Visit `https://your-site.pages.dev/api/index` - should return `{"success":true,"items":[]}`

**Important**: Bindings only apply to NEW deployments, not existing ones. Always redeploy after changing bindings.

### "KV is not defined" error

- Verify the KV binding variable name is exactly `KV`
- Ensure namespace is bound in Settings → Functions
- Redeploy after adding the binding (see above)

### Add post password not working

- Check that `ADD_POST_PASSWORD` is set in environment variables
- Verify you're using Production environment variables
- Redeploy after adding variables

### Posts not appearing

- Check browser console for JavaScript errors
- Verify `/api/index` returns valid JSON
- Check Cloudflare Pages Functions logs for errors

### Local development not working

- Ensure Wrangler is installed: `wrangler --version`
- Create preview KV namespace: `wrangler kv:namespace create KV --preview`
- Check `.dev.vars` file is in the project root

## Updating Textpile

To deploy updates:

1. Pull latest changes from the repository
2. Push to your GitHub repository
3. Cloudflare Pages automatically redeploys

Or manually trigger a deployment:
- **Deployments** → **Create deployment** → select branch

## Uninstallation

To completely remove Textpile:

1. Delete the Pages project (Settings → Delete project)
2. Delete the KV namespace (Workers & Pages → KV → Delete)
3. Remove custom domain DNS records if configured
4. Optionally delete the GitHub repository

**Note:** All content in KV will be permanently deleted.

## Security Considerations

- **Never commit** `.dev.vars` or actual tokens to git
- Use strong random values for `ADD_POST_PASSWORD` and `ADMIN_TOKEN`
- Consider enabling Cloudflare Access for additional protection
- Monitor Functions logs for suspicious activity
- Set up rate limiting if spam becomes an issue (Cloudflare dashboard)

## Support

For issues or questions:
- Check the [README.md](README.md) for project overview
- Review the [User's Guide.md](User's%20Guide.md) for usage information
- File issues on the GitHub repository
