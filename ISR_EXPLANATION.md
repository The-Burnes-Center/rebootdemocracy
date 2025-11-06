# ISR (Incremental Static Regeneration) - How It Works

## Overview

Blog posts now use **ISR** (`isr: true`) instead of prerendering. This means pages are generated **on-demand** via serverless functions, not at build time.

## How ISR Regeneration Works

### 1. **Initial Build**
- Pages are **NOT prerendered** at build time
- Pages are generated on **first request** via serverless function (Nuxt Nitro)
- Generated pages are cached at the CDN edge with cache tags

### 2. **When Content Changes**
- Webhook at `/api/blog/revalidate` purges cache for specific page(s)
- Cache is cleared for the specified blog post ID(s)
- **No full build is triggered** - only the cache is purged

### 3. **Page Regeneration**
- On the **next request** to that page, it regenerates via **serverless function** (Nuxt Nitro)
- Regeneration happens at the **edge** (Netlify's CDN/serverless infrastructure)
- **Only that specific page regenerates**, not the entire site
- **Metadata (title, etc.) updates automatically** because it's a fresh render from the serverless function

## Key Points

### ✅ What ISR Does:
- Pages regenerate **on-demand** via serverless function (not a full build)
- Only the **specific page** regenerates (not the entire site)
- Regeneration happens at the **edge** (Netlify's CDN/serverless infrastructure)
- **Metadata updates automatically** (title, description, etc.) because it's a fresh render
- **No atomic deploy needed** - pages regenerate individually

### ❌ What ISR Doesn't Do:
- Pages are **NOT prerendered** at build time
- Pages don't exist until the **first request**
- Initial build doesn't generate blog post pages

## Trade-offs

### Pros:
- ✅ Fast updates: Only changed pages regenerate (not full build)
- ✅ Efficient: No need to rebuild entire site
- ✅ On-demand: Pages regenerate when needed
- ✅ Metadata updates: Title, description, etc. update automatically

### Cons:
- ⚠️ Initial SEO: Pages don't exist until first request
- ⚠️ First request: May be slower (page generation happens on first request)

## Solution: Warm-up Script

To ensure all blog posts are generated immediately after deployment (for SEO), you can run the warm-up script:

```bash
# After deployment, run:
tsx scripts/warm-up-blog-posts.ts
```

This script:
1. Fetches all published blog posts from Directus
2. Makes requests to each blog post page
3. Triggers page generation via ISR
4. Caches all pages at the CDN edge

## How to Use

### Initial Deployment:
1. Build completes (blog posts are NOT prerendered)
2. Deploy to Netlify
3. (Optional) Run warm-up script to generate all pages
4. All pages are now cached at the edge

### When Content Changes:
1. Directus webhook triggers `/api/blog/revalidate`
2. Cache is purged for specific blog post ID(s)
3. On next request, page regenerates via serverless function
4. Updated content is served and cached

## Example Flow

```
1. Initial Build:
   - Build completes
   - Blog posts are NOT prerendered
   - Site is deployed

2. First Request to /blog/my-post:
   - Request hits Netlify
   - Page doesn't exist in cache
   - Serverless function (Nuxt Nitro) generates the page
   - Page is cached at CDN edge with cache tag (blog post ID)
   - Page is served to user

3. Content Update in Directus:
   - Blog post title changes from "Old Title" to "New Title"
   - Directus webhook triggers: POST /api/blog/revalidate
   - Body: { "blogIds": [28150] }
   - Cache is purged for blog post ID 28150

4. Next Request to /blog/my-post:
   - Request hits Netlify
   - Cache is empty (was purged)
   - Serverless function (Nuxt Nitro) regenerates the page
   - New title "New Title" is rendered
   - Page is cached at CDN edge again
   - Updated page is served to user
```

## Configuration

### `nuxt.config.ts`:
```typescript
routeRules: {
  '/blog/**': { 
    isr: true,  // ISR: Pages generated on-demand via serverless function
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': 'public, max-age=31536000, stale-while-revalidate=31536000, durable'
    }
  }
}
```

### Webhook Endpoint (`server/api/blog/revalidate.post.ts`):
- Accepts: `{ "blogIds": [28150] }` or `{ "id": 28150 }`
- Purges cache for specified blog post ID(s)
- Pages regenerate on next request via ISR

## Questions Answered

### Q: How is the page regenerated?
**A:** Via serverless function (Nuxt Nitro) at the edge, not a full build.

### Q: Does metadata (title) update?
**A:** Yes, automatically. The page is freshly rendered from the serverless function, so all metadata updates.

### Q: Is it regenerated in a triggered build?
**A:** No, it's regenerated on the next request via serverless function (not a build).

### Q: Only that page regenerates?
**A:** Yes, only the specific page(s) with purged cache tags regenerate.
