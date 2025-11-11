# Warm-Up Script Setup

This document explains how to set up automatic page warm-up after deployment to ensure ISR pages are cached immediately.

## Overview

After a successful deployment, the warm-up script makes requests to ISR pages (like `/test-isr`) to trigger their first generation and caching. This ensures:

- Pages are cached immediately after deployment
- First user doesn't experience cold start latency
- CDN cache is populated with fresh content

## Setup Instructions

### Option 1: Netlify Deploy Notifications (Recommended)

1. Go to **Netlify Dashboard** → Your Site → **Site Settings** → **Build & Deploy** → **Deploy Notifications**

2. Click **Add notification**

3. Configure:
   - **Event**: Select "Deploy succeeded"
   - **URL**: `https://your-site.netlify.app/api/warm-up`
   - **Method**: POST
   - **Headers**: 
     ```
     Content-Type: application/json
     ```

4. Save the notification

5. Test by triggering a new deployment - the warm-up should run automatically

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

### Warm-up not triggering

1. **Check Deploy Notification**: Verify it's configured correctly in Netlify Dashboard
2. **Check URL**: Ensure the URL matches your site's domain
3. **Check Logs**: Look for warm-up function invocations in Netlify Function logs

### Pages not warming up

1. **Check function logs**: Look for errors in the warm-up function
2. **Verify pages exist**: Ensure the pages are accessible
3. **Check ISR configuration**: Verify pages have `isr: true` in `nuxt.config.ts`

### Timeout errors

- Warm-up runs after deployment, so it should have time to complete
- If timeouts occur, check Netlify function timeout settings
- Consider reducing number of pages warmed up simultaneously

## Benefits

- **Faster first load**: Pages are pre-cached, so first user gets fast response
- **Better SEO**: Search engines get cached pages immediately
- **Reduced cold starts**: Serverless functions are warmed up
- **Improved UX**: No waiting for first page generation

