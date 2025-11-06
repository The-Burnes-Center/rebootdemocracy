# Simple Example - Minimal Setup

## The Problem

The `/api/*` routes aren't being handled by the Nitro serverless function.

## Simple Test Endpoints

I've created two simple test endpoints:

1. **GET** `/api/test` - Simple test endpoint
2. **POST** `/api/test` - Simple POST test endpoint

## Test Commands

```bash
# Test GET
curl https://partial-ssg--burnesblogtemplate.netlify.app/api/test

# Test POST  
curl -X POST https://partial-ssg--burnesblogtemplate.netlify.app/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test revalidate
curl -X POST https://partial-ssg--burnesblogtemplate.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```

## Current Configuration

- `nitro.preset: 'netlify'` in `nuxt.config.ts`
- Redirect `/api/*` to `/.netlify/functions/server` in `netlify.toml`
- Catch-all redirect excludes `/api/*`

## If Test Endpoints Don't Work

The issue is likely:
1. The redirect isn't working correctly
2. Nitro serverless function isn't being created properly
3. The catch-all redirect is catching `/api/*` before the redirect

## Next Steps

1. Deploy and test the simple endpoints first
2. If they work, the revalidate endpoint should work too
3. If they don't work, we need to fix the redirect configuration

