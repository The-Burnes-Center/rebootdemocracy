# Minimal Example - How It Should Work

## The Setup

1. **Nuxt Config**: `nitro.preset: 'netlify'` in `nuxt.config.ts`
2. **Server Route**: `server/api/test.get.ts` - simple test endpoint
3. **Netlify Config**: NO explicit redirect for `/api/*` - Nitro handles it automatically

## How It Works

With `nitro.preset: 'netlify'`:
- Nitro automatically creates a serverless function at `/.netlify/functions/server`
- This function handles ALL server routes (including `/api/*`)
- Netlify processes functions BEFORE redirects
- So `/api/*` routes are handled by Nitro BEFORE the catch-all redirect

## The Problem

The catch-all redirect `from = "/*"` is catching `/api/*` routes before Nitro can handle them.

## The Solution

Add `conditions = {Path = ["!/api/*"]}` to the catch-all redirect to exclude `/api/*` routes.

## Test After Deploying

```bash
# Test simple GET
curl https://nuxt4-isr-cache-tags--burnesblogtemplate.netlify.app/api/test

# Test simple POST
curl -X POST https://nuxt4-isr-cache-tags--burnesblogtemplate.netlify.app/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test revalidate
curl -X POST https://nuxt4-isr-cache-tags--burnesblogtemplate.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```
