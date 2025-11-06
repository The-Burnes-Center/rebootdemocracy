# Understanding ISR vs Prerendering for SEO

## The Problem You Encountered

When using `isr: true` alone:
- ❌ Pages are **NOT** prerendered at build time
- ❌ Pages are generated on **first request** at the Netlify edge
- ❌ Bots and search engines may not see content immediately
- ❌ Pages show "not found" until first request generates them

## The Solution: Hybrid Approach

We use **prerender + cache tags** instead of pure ISR:

### ✅ What We're Doing Now

1. **Prerender at build time** (`prerender: true`)
   - Pages are generated during build
   - Full HTML with meta information exists immediately
   - Accessible to bots/search engines right after deploy
   - Works exactly like your original SSG setup

2. **Cache tags for on-demand invalidation**
   - Each page is tagged with its blog post ID
   - When content changes, webhook purges cache by tag
   - Next request regenerates the page with fresh content
   - No need for full rebuilds

3. **Cache headers for CDN behavior**
   - `Netlify-CDN-Cache-Control` with `stale-while-revalidate`
   - CDN caches pages but allows revalidation
   - When cache is purged, page regenerates on next request

## How It Works

### Build Time
1. `nuxt generate` runs
2. All blog posts are prerendered as static HTML files
3. Each page includes cache tag headers (blog post ID)
4. Files are deployed to Netlify CDN

### Runtime (Content Update)
1. Blog post updated in Directus
2. Webhook triggers `/api/blog/revalidate`
3. Function calls `purgeCache({ tags: [blogPostId] })`
4. Netlify CDN cache is invalidated for that specific page
5. Next request to that page:
   - CDN doesn't have cached version
   - Request goes to Netlify serverless function
   - Page regenerates with fresh content
   - New version cached at CDN

### SEO & Bot Access
- ✅ Pages exist at build time (prerendered)
- ✅ Bots can crawl immediately after deploy
- ✅ Full meta information available
- ✅ No waiting for first request
- ✅ Works exactly like traditional SSG for SEO

## Why Not Pure ISR?

**ISR (`isr: true`) alone:**
- Pages don't exist until first request
- Bots might not see content
- "Not found" errors until page is generated
- Not ideal for SEO-heavy sites

**Our Hybrid Approach:**
- Pages prerendered at build (SEO-friendly)
- Cache invalidation on-demand (fast updates)
- Best of both worlds

## Testing

1. **Deploy** - All pages should be prerendered
2. **Check deploy files** - Should see HTML files in deploy browser
3. **Visit page** - Should work immediately (not "not found")
4. **Update content** - Trigger webhook
5. **Visit page again** - Should show updated content (regenerated)

## Cache Tag Behavior

The cache tag is set in `pages/blog/[slug].vue`:
```typescript
event.node.res.setHeader('Netlify-Cache-Tag', String(blogPost.id));
```

This works during:
- ✅ Prerendering (build time)
- ✅ Runtime generation (after cache purge)

Both scenarios set the cache tag, allowing webhook-based invalidation.

