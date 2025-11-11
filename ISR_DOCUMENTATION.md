# ISR (Incremental Static Regeneration) Implementation Documentation

This document describes the ISR implementation for the Nuxt application deployed on Netlify. The system allows for on-demand cache revalidation, enabling pages to be regenerated when content changes without requiring a full site rebuild.

## Overview

The ISR implementation uses:
- **Nuxt 3.14.159** with Nuxt 4 compatibility mode enabled (`compatibilityVersion: 4`)
- **Netlify CDN caching** with cache tags for granular invalidation
- **On-demand revalidation** via API endpoint that purges cache and triggers regeneration
- **Durable cache directive** for shared cache across Netlify edge nodes
- **@netlify/functions 5.1.0** for cache purge API

## Architecture

### Components

1. **ISR Test Page** (`pages/test-isr.vue`)
   - Displays a random number that changes only when cache is revalidated
   - Provides UI button to trigger manual revalidation
   - Uses `useState` to persist random number across requests until revalidation

2. **Revalidation API Endpoint** (`server/api/revalidate.post.ts`)
   - Handles cache purging via Netlify's `purgeCache` API
   - Triggers page regeneration after cache purge
   - Implements rate limit handling and retry logic

3. **Cache Tag Plugin** (`server/plugins/cache-tag.ts`)
   - Automatically sets `Netlify-Cache-Tag` header for ISR routes
   - Enables granular cache invalidation by tag

4. **Nuxt Configuration** (`nuxt.config.ts`)
   - Configures ISR route rules with cache headers
   - Sets up durable cache for better performance

## How It Works

### 1. Initial Page Load

When a user first visits `/test-isr`:
1. Netlify CDN checks for cached version
2. If not cached, request goes to serverless function
3. Nuxt SSR generates page with random number
4. Response is cached on Netlify CDN with:
   - `Netlify-Cache-Tag: test-isr` header
   - `Netlify-CDN-Cache-Control: public, max-age=31536000, stale-while-revalidate=31536000, durable`
5. Subsequent requests are served from CDN cache

### 2. Cache Revalidation Flow

When revalidation is triggered (via button click or webhook):

```
1. Client calls POST /api/revalidate
   ↓
2. API endpoint purges cache by tag and path
   ↓
3. Wait 1.5 seconds for initial propagation
   ↓
4. Make 2 bypass requests with query params to warm up server
   ↓
5. Wait 5 seconds for cache purge to fully propagate across CDN
   ↓
6. Make 5 regeneration requests with unique query params
   (These ensure server generates new content)
   ↓
7. Client reloads page after 8 seconds
   ↓
8. Next request hits server (cache is purged), generates new content
   ↓
9. New content is cached on CDN
```

### 3. Cache Purge Process


The revalidation endpoint performs:

1. **Tag-based purge**: `purgeCache({ tags: ['test-isr'] })`
   - Invalidates all cached objects tagged with `test-isr`
   - Works across all deploy contexts

2. **Path-based purge**: `purgeCache({ paths: ['/test-isr'] })`
   - Invalidates cached objects for the specific path
   - Provides additional invalidation method

3. **Rate limit handling**:
   - Netlify allows 2 purges per tag/path every 5 seconds
   - If rate limit hit, logs warning but continues
   - Regeneration will still work even if purge is throttled

### 4. Regeneration Strategy

After cache purge:
1. **Bypass requests** (2 requests with `?_bypass=timestamp`):
   - Bypass CDN cache to ensure server generates new content
   - Warm up the serverless function

2. **Wait period** (5 seconds):
   - Allows cache purge to propagate across Netlify's distributed CDN
   - According to Netlify docs: "On-demand invalidation across the entire network takes just a few seconds"

3. **Regeneration requests** (5 requests with `?_force_regen=timestamp`):
   - Each request has unique query params (creates separate cache entries)
   - Ensures server generates fresh content
   - Logs the random number from each response for verification

4. **Client reload** (after 8 seconds):
   - Reloads the base path (no query params)
   - Since cache is purged, request hits server
   - Server generates new content with new random number
   - New content is cached on CDN

## Key Files

### `pages/test-isr.vue`

**Purpose**: ISR test page that demonstrates cache revalidation

**Key Features**:
- Generates random number on SSR using `useState("test-isr-id", ...)`
- Number persists until cache is revalidated
- Provides revalidation button with loading states
- Reloads page after 8 seconds to see new cached content

**Random Number Generation**:
```typescript
const id = useState("test-isr-id", () => {
  const randomNum = Math.floor(Math.random() * 10000)
  console.log(`[SSR] Generated new random number: ${randomNum}`)
  return randomNum
})
```

The `useState` with a static key ensures:
- Same number is used for all requests to the cached version
- New number is generated only when page is regenerated on server (after cache purge)

### `server/api/revalidate.post.ts`

**Purpose**: API endpoint for on-demand cache revalidation

**Request Body**:
```typescript
{
  tag: "test-isr",  // Cache tag to purge
  path: "/test-isr" // Path to purge
}
```

**Process**:
1. Validates `NETLIFY_AUTH_TOKEN` is configured
2. Dynamically imports `@netlify/functions` package
3. Purges cache by tag (if provided)
4. Purges cache by path (if provided)
5. Makes bypass requests to warm up server
6. Waits 5 seconds for cache purge propagation
7. Makes 5 regeneration requests with unique query params
8. Returns success response

**Error Handling**:
- Missing auth token: Returns simulated success (for local dev)
- Rate limit errors: Logs warning, continues with regeneration
- Auth errors: Returns 401 with helpful message
- Other errors: Returns 500 with error message

### `server/plugins/cache-tag.ts`

**Purpose**: Server plugin that sets cache tags for ISR routes

**Functionality**:
- Intercepts all server requests
- Checks if request is for `/test-isr` route
- Sets `Netlify-Cache-Tag: test-isr` header
- Only runs during SSR (not during prerendering)

**Why it's needed**:
- Cache tags enable granular invalidation
- Without tags, you'd need to purge entire site cache
- Tags allow targeting specific pages for revalidation

### `nuxt.config.ts`

**Purpose**: Nuxt configuration with ISR route rules

**Key Configuration**:
```typescript
export default defineNuxtConfig({
  compatibilityDate: "2024-11-13",
  future: {
    compatibilityVersion: 4,  // Opt into Nuxt 4 features while on Nuxt 3
  },
  routeRules: {
    "/": { prerender: true },
    "/test-isr": {
      isr: true,
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, stale-while-revalidate=31536000, durable",
      },
    },
  },
})
```

**Note**: The project uses Nuxt 3.14.159 with `compatibilityVersion: 4` to enable Nuxt 4 features (like ISR) while remaining on Nuxt 3.

**Cache Headers Explained**:
- `Cache-Control: public, max-age=0, must-revalidate`
  - Tells browsers to always revalidate with server
  - Doesn't affect Netlify CDN caching

- `Netlify-CDN-Cache-Control: public, max-age=31536000, stale-while-revalidate=31536000, durable`
  - `public`: Cache on CDN
  - `max-age=31536000`: Consider fresh for 1 year (effectively never stale)
  - `stale-while-revalidate=31536000`: Serve stale content while revalidating (1 year)
  - `durable`: Store in shared durable cache across edge nodes

## Configuration Files

### package.json

```json
{
  "name": "nuxt-isr-minimal",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@netlify/functions": "^5.1.0",
    "nuxt": "^3.14.159",
    "vue": "latest",
    "vue-router": "latest"
  }
}
```

**Key Dependencies**:
- `nuxt: ^3.14.159` - Nuxt 3 framework (with Nuxt 4 compatibility mode via `compatibilityVersion: 4`)
- `@netlify/functions: ^5.1.0` - Netlify Functions SDK for cache purge API
- `vue: latest` - Vue.js framework
- `vue-router: latest` - Vue Router

**Scripts**:
- `build`: Builds the Nuxt application for production
- `dev`: Starts development server
- `preview`: Preview production build locally
- `postinstall`: Runs `nuxt prepare` after npm install

### netlify.toml

```toml
[build]
command = "npm run build"
publish = "dist"

[build.environment]
NODE_VERSION = "20.19.0"
```

**Configuration**:
- **Build command**: `npm run build` (runs `nuxt build`)
- **Publish directory**: `dist` (Nuxt 3 default output directory)
- **Node.js version**: 20.19.0

## Environment Variables

### Required

- `NETLIFY_AUTH_TOKEN`: Personal access token for Netlify API
  - Used for cache purge operations
  - Get from: Netlify Dashboard → User Settings → Applications → Personal access tokens
  - Set in: Netlify Site Settings → Environment Variables

### Optional

- None required for basic functionality
- Missing `NETLIFY_AUTH_TOKEN` will result in simulated cache purge (for local dev)

## Usage

### Manual Revalidation (Testing)

1. Visit `/test-isr` page
2. Note the random number displayed
3. Click "Revalidate Cache" button
4. Wait 8 seconds for page to reload
5. Verify new random number is displayed

### Programmatic Revalidation (Production)

```bash
curl -X POST https://your-site.netlify.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"tag": "test-isr", "path": "/test-isr"}'
```

### Webhook Integration

Set up a webhook from your CMS (e.g., Directus) to call the revalidation endpoint when content changes:

```
POST https://your-site.netlify.app/api/revalidate
Content-Type: application/json

{
  "tag": "test-isr",
  "path": "/test-isr"
}
```

## How Cache Keys Work

Netlify caches URLs with query parameters separately from the base path:

- `/test-isr` → Base path cache entry
- `/test-isr?_bypass=123` → Separate cache entry
- `/test-isr?_force_regen=456` → Separate cache entry

This is why:
1. Bypass/regeneration requests with query params don't affect base path cache
2. We need to wait for cache purge, then rely on next natural request to update base path
3. The base path request (after purge) hits the server and generates new content

## Rate Limits

According to Netlify documentation:
- **Cache purge rate limit**: 2 purges per tag/path every 5 seconds
- If exceeded, returns 429 error
- Current implementation logs warning but continues (regeneration still works)

## Performance Characteristics

### Cache Hit Performance
- **First request**: ~700-1000ms (serverless function invocation)
- **Cached requests**: ~10-50ms (served from CDN)

### Revalidation Performance
- **Cache purge**: ~800-1000ms
- **Total revalidation time**: ~13-14 seconds
  - 1.5s initial wait
  - 2 bypass requests (~2s)
  - 5s cache propagation wait
  - 5 regeneration requests (~5s)
  - Client reload after 8s

### Durable Cache Benefits
- Reduces function invocations across edge nodes
- Faster response times for edge cache misses
- Lower costs (fewer function invocations)

## Troubleshooting

### Page shows same number after revalidation

**Possible causes**:
1. Cache purge didn't propagate (wait longer)
2. Browser cache (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
3. Rate limit hit (check logs for warnings)

**Solution**: Check Netlify function logs for:
- `✅ Cache purged successfully` messages
- `✅ Regeneration X - number: XXXX` messages
- `[SSR] Generated new random number: XXXX` on final reload

### Rate limit errors

**Symptoms**: Logs show `⚠️ Rate limit hit`

**Solution**: 
- Wait 5+ seconds between revalidation attempts
- Current implementation handles this gracefully (continues with regeneration)

### Missing NETLIFY_AUTH_TOKEN

**Symptoms**: Logs show `NETLIFY_AUTH_TOKEN not set - cache purge will be simulated`

**Solution**:
1. Get token from Netlify Dashboard
2. Add to Netlify Site Settings → Environment Variables
3. Redeploy site

## Post-Deployment Warm-Up

After deployment, ISR pages need to be generated on first request. To avoid cold starts for the first user, a warm-up script can be triggered automatically.

### Setup

1. **Warm-up Endpoint**: `POST /api/warm-up`
   - Automatically requests ISR pages to trigger caching
   - Configurable list of pages to warm up
   - Returns summary of successful/failed warm-ups

2. **Netlify Deploy Notification**:
   - Configure in Netlify Dashboard → Site Settings → Build & Deploy → Deploy Notifications
   - URL: `https://your-site.netlify.app/api/warm-up`
   - Event: "Deploy succeeded"
   - This automatically triggers warm-up after each successful deployment

See `WARM_UP_SETUP.md` for detailed setup instructions.

### How It Works

```
1. Deployment completes
   ↓
2. Netlify Deploy Notification triggers
   ↓
3. POST /api/warm-up is called
   ↓
4. Script makes GET requests to configured ISR pages
   ↓
5. Each request triggers serverless function
   ↓
6. Generated pages are cached on CDN
   ↓
7. First user gets cached response immediately
```

## Future Improvements

1. **Reduce revalidation time**: Could optimize timing based on actual CDN propagation
2. **Batch revalidation**: Support multiple paths/tags in single request
3. **Webhook security**: Add authentication for webhook requests
4. **Monitoring**: Add metrics for cache hit rates and revalidation success
5. **Automatic warm-up**: Already implemented - see Post-Deployment Warm-Up section above

## References

- [Netlify Caching Documentation](https://docs.netlify.com/build/caching/overview/)
- [Netlify Cache Tags and Purge API](https://www.netlify.com/blog/cache-tags-and-purge-api-on-netlify/)
- [Nuxt 3 ISR Documentation](https://nuxt.com/docs/guide/concepts/rendering#incremental-static-regeneration-isr)
- [Nuxt 4 Compatibility Mode](https://nuxt.com/docs/getting-started/upgrade#compatibility-version)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)

