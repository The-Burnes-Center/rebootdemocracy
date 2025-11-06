# ISR Migration Guide

This branch implements **Incremental Static Regeneration (ISR) with cache tags** instead of manual partial builds.

## What Changed

### Before (Manual Partial Builds)
- Manual cache restoration after `nuxt generate`
- Complex partial build scripts
- Required detecting changed routes and restoring cached files
- Two caches: Nuxt build cache + manual Netlify cache

### After (ISR with Cache Tags)
- **No manual cache restoration needed** - Netlify handles it automatically
- Pages generated on first request and cached at CDN edge
- On-demand revalidation via webhooks
- Simple, standards-based approach

## How It Works

1. **ISR Configuration** (`nuxt.config.ts`)
   - Blog routes use `isr: true` instead of `prerender: true`
   - Pages are NOT prerendered at build time
   - First request generates the page, subsequent requests served from CDN cache

2. **Cache Tags** (`pages/blog/[slug].vue`)
   - Each blog post page is tagged with its Directus ID
   - Tag is set via `Netlify-Cache-Tag` header
   - Allows fine-grained cache invalidation

3. **Webhook Endpoint** (`server/api/blog/revalidate.post.ts`)
   - Receives webhook from Directus when blog post is updated
   - Purges cache for specific blog post ID(s) using `purgeCache({ tags: [id] })`
   - Supports single ID or array of IDs

4. **Build Process** (`netlify.toml`)
   - Simplified to standard `npm run generate`
   - No partial build scripts needed
   - ISR handles caching automatically

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @netlify/functions
```

### 2. Configure Webhook in Directus
Point your Directus webhook to:
```
https://your-site.netlify.app/api/blog/revalidate
```

**Webhook Payload Format:**
```json
{
  "id": 28150
}
```

Or for multiple posts:
```json
{
  "id": [28150, 28151, 28152]
}
```

### 3. Optional: Set Webhook Secret
If you want to secure the webhook endpoint, set:
```bash
# In Netlify environment variables
DIRECTUS_WEBHOOK_SECRET=your-secret-here
```

Then configure Directus webhook to send:
- Header: `X-Directus-Webhook-Secret` or `Authorization: Bearer your-secret-here`

## Benefits

1. **Simpler**: No manual cache management
2. **Faster builds**: No need to prerender all blog posts at build time
3. **Real-time updates**: Cache invalidation happens immediately when content changes
4. **Standards-based**: Uses HTTP headers and CDN caching
5. **No build scripts**: Just standard Nuxt generate

## Migration Notes

- The old partial build scripts (`scripts/partial-build.mjs`, `scripts/get-changed-blog-routes.ts`) are **not removed** but **not used** anymore
- You can remove them if you want to clean up after confirming ISR works
- The `nitro:config` hook with partial build logic is still present but not needed - can be removed

## Testing

1. Deploy this branch to Netlify
2. Visit a blog post URL - it should generate on first request
3. Visit again - should be served from cache (check `Cache-Status` header)
4. Update a blog post in Directus (trigger webhook)
5. Visit the blog post again - should regenerate with new content

## References

- [Netlify ISR Guide](https://developers.netlify.com/guides/isr-and-advanced-caching-with-nuxt-v4-on-netlify/)
- [Nuxt 4 Documentation](https://nuxt.com/docs/getting-started/upgrade#nuxt-4)

