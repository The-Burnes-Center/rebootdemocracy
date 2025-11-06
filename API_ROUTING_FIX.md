# API Routing Fix - Explicit Redirect for /api/* Routes

## Problem

The `/api/*` routes were returning 404 HTML pages in production, even though:
- Nitro serverless function exists at `.output/server/index.mjs`
- `nitro.preset: 'netlify'` is configured
- Server routes exist in `server/api/`

## Root Cause

The catch-all redirect `from = "/*" to = "/index.html"` was catching `/api/*` routes before Nitro's serverless function could handle them, even with the path exclusion `conditions = {Path = ["!/api/*"]}`.

## Solution

Added an **explicit redirect** for `/api/*` routes to the Nitro serverless function:

```toml
[[redirects]]
from = "/api/*"
to = "/.netlify/functions/server"
status = 200
force = true
```

This ensures:
1. `/api/*` routes are explicitly redirected to the Nitro serverless function
2. The `force = true` flag ensures this redirect takes precedence over the catch-all
3. The catch-all redirect no longer needs path exclusions

## Changes Made

1. **`netlify.toml`**:
   - Added explicit redirect for `/api/*` to `/.netlify/functions/server` with `force = true`
   - Removed path exclusion from catch-all redirect (no longer needed)

## Testing After Deploy

After deploying, test the following endpoints:

```bash
# Test simple GET endpoint
curl https://nuxt4-isr-cache-tags--burnesblogtemplate.netlify.app/api/test

# Expected: JSON response
# {
#   "success": true,
#   "message": "Server route is working!",
#   "path": "/api/test",
#   "method": "GET"
# }

# Test simple POST endpoint
curl -X POST https://nuxt4-isr-cache-tags--burnesblogtemplate.netlify.app/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test revalidate endpoint
curl -X POST https://nuxt4-isr-cache-tags--burnesblogtemplate.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'

# Expected: JSON response
# {
#   "success": true,
#   "message": "Cache purged for 1 blog post(s)",
#   "purgedIds": ["28150"]
# }
```

## How It Works

1. **Request to `/api/test`**:
   - Netlify matches the explicit redirect `from = "/api/*"`
   - Redirects to `/.netlify/functions/server` with the original path preserved
   - Nitro serverless function handles the request
   - Returns JSON response

2. **Request to `/blog/some-slug`**:
   - No redirect match
   - Falls through to catch-all redirect `from = "/*"`
   - Serves `/index.html` for client-side routing

## Important Notes

- The explicit redirect with `force = true` ensures `/api/*` routes are handled **before** the catch-all redirect
- Netlify processes redirects in order, so the explicit `/api/*` redirect comes first
- The Nitro serverless function is automatically created by Nitro when using `nitro.preset: 'netlify'`
- The function is deployed at `/.netlify/functions/server` by Netlify

## If It Still Doesn't Work

If `/api/*` routes still return 404 after deploying:

1. **Check the deploy log** for any errors related to function deployment
2. **Verify the Nitro serverless function exists** in the deploy:
   - Look for `/.netlify/functions/server` in the deploy file browser
   - Check if `index.mjs` exists in `.output/server/` after build
3. **Check function logs** in Netlify dashboard:
   - Go to **Functions** → **server** → **Logs**
   - See if requests are reaching the function
4. **Verify the redirect is active**:
   - Check `netlify.toml` in the deployed site
   - Ensure the redirect is present and correctly formatted

