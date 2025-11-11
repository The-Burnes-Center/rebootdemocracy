# Warm-Up Script Setup

This document explains how to set up automatic page warm-up after deployment to ensure ISR pages are cached immediately.

## Overview

After a successful deployment, the warm-up script makes requests to ISR pages (like `/test-isr`) to trigger their first generation and caching. This ensures:

- Pages are cached immediately after deployment
- First user doesn't experience cold start latency
- CDN cache is populated with fresh content

## Setup Instructions

### Option 1: Netlify Deploy Notifications (Recommended)

**Important**: Deploy Notifications must be configured in the Netlify Dashboard - they cannot be configured via `netlify.toml`.

1. Go to **Netlify Dashboard** → Your Site → **Site Settings** → **Build & Deploy** → **Deploy Notifications**

2. Click **Add notification**

3. Configure:
   - **Event**: Select "Deploy succeeded"
   - **URL**: `https://your-site.netlify.app/api/warm-up`
     - Replace `your-site` with your actual site name
     - For branch deploys, use the branch-specific URL: `https://branch-name--your-site.netlify.app/api/warm-up`
   - **Method**: POST
   - **Headers** (optional): 
     ```
     Content-Type: application/json
     ```

4. Save the notification

5. **Verify Setup**:
   - Check that the notification appears in the list
   - The URL should be accessible (test with curl below)

6. Test by triggering a new deployment - check function logs for warm-up activity

### Verify Warm-Up Endpoint Works

Before setting up the notification, test the endpoint manually:

```bash
# Test the warm-up endpoint
curl -X POST https://your-site.netlify.app/api/warm-up

# Should return JSON with results
```

Check Netlify Function logs for:
```
🔥 Warm-up endpoint called
🔥 Starting warm-up for 1 page(s) after deployment...
Warming up: https://your-site.netlify.app/test-isr
✅ /test-isr: 200 (2879 bytes)
🔥 Warm-up complete: 1/1 pages warmed up successfully
```

### Option 2: Manual Trigger

You can also trigger warm-up manually:

```bash
curl -X POST https://your-site.netlify.app/api/warm-up
```

### Option 3: GitHub Actions / CI/CD

If you use GitHub Actions or other CI/CD, add a step after deployment:

```yaml
- name: Warm up ISR pages
  run: |
    curl -X POST https://your-site.netlify.app/api/warm-up
```

## How It Works

1. **Deployment completes** on Netlify
2. **Deploy Notification** triggers POST request to `/api/warm-up`
3. **Warm-up endpoint** makes GET requests to configured pages:
   - `/test-isr`
   - (Add more pages as needed)
4. **Each request** triggers serverless function to generate page
5. **Generated pages** are cached on Netlify CDN
6. **Subsequent users** get cached responses immediately

## Configuration

### Adding More Pages

Edit `server/api/warm-up.post.ts`:

```typescript
const pagesToWarmUp = [
  "/test-isr",
  "/blog/some-post",  // Add your ISR pages here
  "/another-page",
]
```

### Customizing Warm-Up

The warm-up script:
- Makes GET requests to each configured page
- Includes `X-Warm-Up: true` header (useful for logging)
- Logs results for monitoring
- Returns summary of successful/failed warm-ups

## Monitoring

Check Netlify Function logs to see warm-up activity:

```
🔥 Starting warm-up for 1 page(s) after deployment...
Warming up: https://your-site.netlify.app/test-isr
✅ /test-isr: 200 (2879 bytes)
🔥 Warm-up complete: 1/1 pages warmed up successfully
```

## Troubleshooting

### Warm-up not triggering after deployment

**Symptoms**: No logs showing warm-up function was called after deployment

**Solutions**:

1. **Verify Deploy Notification is configured**:
   - Go to Netlify Dashboard → Site Settings → Build & Deploy → Deploy Notifications
   - Check that a notification exists with:
     - Event: "Deploy succeeded"
     - URL: `https://your-site.netlify.app/api/warm-up`
     - Method: POST

2. **Check URL is correct**:
   - For production: `https://your-site.netlify.app/api/warm-up`
   - For branch deploys: `https://branch-name--your-site.netlify.app/api/warm-up`
   - Make sure the URL matches your actual site domain

3. **Test endpoint manually**:
   ```bash
   curl -X POST https://your-site.netlify.app/api/warm-up
   ```
   - Should return JSON response
   - Check function logs for warm-up activity

4. **Check Deploy Notification logs**:
   - Netlify Dashboard → Site Settings → Build & Deploy → Deploy Notifications
   - Click on your notification to see delivery logs
   - Look for failed delivery attempts

5. **Verify function exists**:
   - Check that `/api/warm-up` endpoint is accessible
   - Should return 200 status code

### Pages not warming up

1. **Check function logs**: Look for errors in the warm-up function
   - Should see: `🔥 Warm-up endpoint called`
   - Should see: `🔥 Starting warm-up for X page(s)...`
   - Should see: `✅ /test-isr: 200 (XXXX bytes)`

2. **Verify pages exist**: Ensure the pages are accessible
   - Test: `curl https://your-site.netlify.app/test-isr`

3. **Check ISR configuration**: Verify pages have `isr: true` in `nuxt.config.ts`

### Timeout errors

- Warm-up runs after deployment, so it should have time to complete
- If timeouts occur, check Netlify function timeout settings
- Consider reducing number of pages warmed up simultaneously

### Deploy Notification not working

If Deploy Notifications aren't triggering:

1. **Check notification is enabled**: Make sure it's not disabled
2. **Check event type**: Must be "Deploy succeeded" (not "Deploy started")
3. **Try manual trigger**: Test the endpoint manually to verify it works
4. **Check Netlify status**: Sometimes notifications can be delayed
5. **Alternative**: Use a build hook or GitHub Actions to trigger warm-up

## Benefits

- **Faster first load**: Pages are pre-cached, so first user gets fast response
- **Better SEO**: Search engines get cached pages immediately
- **Reduced cold starts**: Serverless functions are warmed up
- **Improved UX**: No waiting for first page generation

