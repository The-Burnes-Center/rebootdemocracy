# Stale-While-Revalidate and On-Demand Revalidation

## How Stale-While-Revalidate Works

**stale-while-revalidate** is a cache directive that allows Netlify to:

1. **Serve stale content immediately** (if available in cache)
2. **Regenerate fresh content in the background**
3. **Serve the fresh content on subsequent requests**

### Example Timeline

```
Time 0: Page cached with content "Version A"
Time 60: Cache expires (max-age=60)
Time 61: User requests page
  → Netlify serves "Version A" (stale) immediately
  → Netlify triggers regeneration in background
  → New content "Version B" is generated
Time 62: Next user requests page
  → Netlify serves "Version B" (fresh) from cache
```

## Current Implementation vs. Stale-While-Revalidate

### Current Approach (Cache Purge + Regeneration)

```
1. Purge cache (invalidate old content)
2. Wait for purge propagation (~1-10 seconds)
3. Request page (cache miss → server generates new content)
4. Cache new content
5. Serve new content
```

**Pros:**
- ✅ Users get fresh content immediately after regeneration
- ✅ No stale content served after revalidation

**Cons:**
- ❌ Users wait for regeneration (no instant response)
- ❌ Requires waiting for purge propagation

### Alternative: Stale-While-Revalidate Approach

```
1. Trigger regeneration (without purging)
2. Netlify serves stale content immediately
3. Regeneration happens in background
4. New content cached
5. Subsequent requests get fresh content
```

**Pros:**
- ✅ Instant response (serves stale content immediately)
- ✅ No waiting for purge propagation
- ✅ Better user experience (no loading delay)

**Cons:**
- ❌ First user after revalidation sees old content
- ❌ Doesn't work if cache is still valid (won't regenerate)

## The Problem with Stale-While-Revalidate for On-Demand Revalidation

**Key Issue**: stale-while-revalidate only works when the cache is **expired** (stale).

- If cache is still valid (not expired), regeneration won't trigger
- For on-demand revalidation (when content changes), we need to force regeneration even if cache is valid
- This is why we need to **purge first** to invalidate the cache

## Can We Use Stale-While-Revalidate?

**Yes, but with a hybrid approach:**

1. **Don't purge immediately** - Let stale-while-revalidate handle serving stale while regenerating
2. **Trigger regeneration** - Make a request that forces regeneration
3. **Wait for regeneration** - Poll until fresh content is cached
4. **Result**: Users get stale content immediately, then fresh content on next request

However, this requires:
- Cache to be expired (stale) for regeneration to trigger
- Or: We still need to purge to force regeneration when cache is valid

## Recommended Approach

For **on-demand revalidation** (when content changes), we want fresh content immediately:

1. **Purge cache** - Invalidate old content
2. **Regenerate** - Generate new content
3. **Cache new content** - Store fresh content
4. **Serve fresh content** - Users get updated content

The current implementation is correct for on-demand revalidation because:
- We want fresh content immediately when content changes
- We don't want to serve stale content after a manual revalidation
- Users expect updated content after triggering revalidation

## When to Use Stale-While-Revalidate

Stale-while-revalidate is ideal for:
- **Time-based regeneration** (TTL expires naturally)
- **Background updates** (when freshness isn't critical)
- **Performance optimization** (serve stale while regenerating)

But for **on-demand revalidation** (manual triggers), we want:
- **Immediate fresh content** (not stale content)
- **Guaranteed updates** (not dependent on cache expiration)

## Current Configuration

Our `nuxt.config.ts` uses:
```typescript
"Netlify-CDN-Cache-Control": "public, max-age=31536000, stale-while-revalidate=31536000, durable"
```

This means:
- Cache is valid for 1 year (`max-age=31536000`)
- Can serve stale for 1 year while revalidating (`stale-while-revalidate=31536000`)
- But for on-demand revalidation, we still purge to force immediate regeneration

## Summary

**stale-while-revalidate** is great for:
- Automatic time-based regeneration
- Serving content while background updates happen
- Performance optimization

**Cache purge + regeneration** is needed for:
- On-demand revalidation (manual triggers)
- Immediate content updates
- Guaranteed fresh content after revalidation

The current implementation is correct for on-demand revalidation use cases.

