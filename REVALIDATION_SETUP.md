# Cache Revalidation Setup

## How It Works

The ISR test page now includes a "Revalidate Cache" button that allows you to manually purge the cache and regenerate the page.

## Setup Required

For cache revalidation to work in **production**, you need to set the `NETLIFY_AUTH_TOKEN` environment variable in your Netlify site settings.

### Steps:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new variable:
   - **Key**: `NETLIFY_AUTH_TOKEN`
   - **Value**: Your Netlify API token (get it from [Netlify User Settings → Applications](https://app.netlify.com/user/applications))

## How to Use

1. Visit `/test-isr` page
2. Note the random number displayed
3. Click the "Revalidate Cache" button
4. The page will reload and show a new random number (confirming the cache was purged and the page regenerated)

## Testing Locally

When testing locally with `netlify dev`, the revalidation endpoint will work but may show a warning if `NETLIFY_AUTH_TOKEN` is not set. This is expected and won't prevent local testing.

## API Endpoint

The revalidation endpoint is available at `/api/revalidate` and accepts:

```json
{
  "tag": "test-isr",  // Cache tag to purge
  "path": "/test-isr"  // Path to purge (optional)
}
```

You can also trigger revalidation via curl:

```bash
curl -X POST https://your-site.netlify.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"tag": "test-isr", "path": "/test-isr"}'
```

