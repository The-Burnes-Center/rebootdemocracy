# Warm-Up Script Setup

The warm-up script generates all blog posts **automatically after each deployment** to ensure they're cached at the edge for SEO.

## How It Works

1. **After deployment**, all blog posts are "warmed up" by making requests to each page
2. With ISR, pages are generated on first request and cached at the CDN edge
3. This ensures all blog posts exist immediately after deployment (good for SEO)

## ✅ Setup: Netlify Deploy Notifications (Automatic)

This is the **recommended and primary method** - it runs automatically after each successful deployment.

### Step-by-Step Setup

1. **Go to Netlify Dashboard**
   - Navigate to your site
   - Click **Site settings** (gear icon)

2. **Open Deploy Notifications**
   - Go to **Build & deploy** → **Deploy notifications**
   - Scroll down to **Outgoing webhooks**

3. **Add New Webhook**
   - Click **Add notification**
   - Select **Outgoing webhook**

4. **Configure Webhook**
   - **Webhook URL**: `https://your-site.netlify.app/.netlify/functions/warm-up-blog-posts`
     - Replace `your-site.netlify.app` with your actual Netlify site URL
     - Example: `https://burnesblogtemplate.netlify.app/.netlify/functions/warm-up-blog-posts`
   - **Event**: Select **Deploy succeeded** ✅
   - **Branch**: Leave empty (runs for all branches) or specify a branch
   - Click **Save**

5. **Done!** 🎉
   - Every time a deployment succeeds, Netlify will automatically call the warm-up function
   - All blog posts will be generated and cached at the edge
   - Check the function logs to see warm-up results

### How to Find Your Site URL

- Your site URL is shown in the Netlify Dashboard (top of the page)
- Or check your `netlify.toml` or site settings
- Format: `https://your-site-name.netlify.app`

### Verify It's Working

After the next deployment:
1. Go to **Functions** → **warm-up-blog-posts** in Netlify Dashboard
2. Check the **Logs** tab to see warm-up activity
3. You should see logs showing blog posts being warmed up

### What Happens Automatically

1. ✅ Build completes successfully
2. ✅ Netlify triggers deploy notification
3. ✅ Webhook calls `/.netlify/functions/warm-up-blog-posts`
4. ✅ Function calls `/api/warm-up` Nuxt server API
5. ✅ All blog posts are generated via ISR and cached at edge
6. ✅ All pages are now available for SEO/bots

## Alternative Options

### Option 2: Scheduled Function

The warm-up function can also run on a schedule (already configured). This is a backup option but less ideal since it doesn't run immediately after deployment.

**Configuration in `netlify.toml`:**
```toml
[functions.warm-up-blog-posts]
schedule = "0 * * * *"  # Runs every hour
```

**Note**: Deploy Notifications (Option 1) is preferred because it runs immediately after deployment.

### Option 3: Manual Trigger

You can manually trigger the warm-up for testing:

```bash
# Via Nuxt server API (recommended)
curl -X POST https://your-site.netlify.app/api/warm-up

# Via Netlify Function
curl -X POST https://your-site.netlify.app/.netlify/functions/warm-up-blog-posts
```

## Endpoints

### Nuxt Server API: `/api/warm-up`
- **Method**: POST
- **Description**: Warm-up endpoint that generates all blog posts
- **Returns**: JSON with warm-up results

### Netlify Function: `/.netlify/functions/warm-up-blog-posts`
- **Method**: POST (or GET)
- **Description**: Netlify Function that calls the Nuxt server API endpoint
- **Returns**: JSON with warm-up results

## How to Test Locally

1. Start your local server:
   ```bash
   npm run dev
   # or
   netlify dev
   ```

2. Call the warm-up endpoint:
   ```bash
   curl -X POST http://localhost:8888/api/warm-up
   ```

3. Check the logs to see which blog posts were warmed up.

## What Happens During Warm-Up

1. Fetches all published blog posts from Directus
2. Makes a GET request to each blog post page (`/blog/{slug}`)
3. With ISR, each request triggers page generation via serverless function
4. Generated pages are cached at the CDN edge with cache tags
5. All blog posts are now available immediately after deployment

## Troubleshooting

### Warm-up fails with 404
- Make sure the site is deployed and accessible
- Check that the base URL is correct (uses `URL` or `DEPLOY_PRIME_URL` environment variable)

### Warm-up takes too long
- The warm-up runs in parallel for all blog posts
- For sites with many blog posts, this may take a few minutes
- This is normal and expected

### Pages still not generated after warm-up
- Check the logs to see if warm-up requests succeeded
- Verify that ISR is enabled in `nuxt.config.ts` (`isr: true` for `/blog/**`)
- Make sure the pages are accessible at the correct URLs

## Summary

✅ **Use Deploy Notifications (Option 1)** - This is the recommended setup:
- ✅ Runs automatically after each successful deployment
- ✅ No manual intervention needed
- ✅ Ensures all pages are generated immediately after deployment
- ✅ Perfect for production use

**For testing/development**, use **Manual Trigger (Option 3)** to test the warm-up functionality.

