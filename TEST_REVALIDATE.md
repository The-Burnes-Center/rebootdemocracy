# Testing the Revalidate Endpoint

## The Issue

The endpoint `/api/blog/revalidate` is returning 404 locally with `netlify dev`. This is likely because:

1. **Route is registered**: The route `/api/blog/revalidate` IS registered in the Nitro serverless function (confirmed in `.output/server/index.mjs`)
2. **Function not found**: When calling `/.netlify/functions/server`, it returns "Function not found..."
3. **Local dev limitation**: `netlify dev` might not fully simulate how Nitro's serverless function works in production

## Testing

### Local Testing (with netlify dev running)

```bash
# Test the endpoint directly
node scripts/test-revalidate-simple.mjs http://localhost:8888

# Or use curl
curl -X POST http://localhost:8888/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```

### Production Testing (RECOMMENDED)

After deploying, test with:

```bash
node scripts/test-revalidate-simple.mjs https://partial-ssg--burnesblogtemplate.netlify.app
```

## Expected Behavior

- **Local**: May return 404 (known limitation of `netlify dev`)
- **Production**: Should return JSON with `success: true`

## Configuration

The current configuration:
- Explicit redirect for `/api/*` to `/.netlify/functions/server`
- Catch-all redirect excludes `/api/*` routes
- Route is registered in Nitro serverless function

## Next Steps

1. **Deploy to production** and test there
2. If it works in production, the local 404 is just a `netlify dev` limitation
3. If it doesn't work in production, we may need to adjust the redirect configuration
