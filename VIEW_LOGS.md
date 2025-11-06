# How to View Function Logs

## 1. Netlify Dashboard (Easiest)

1. Go to your Netlify site dashboard
2. Click on **"Functions"** in the left sidebar
3. Click on **"Logs"** tab
4. Filter by function name: `api-blog-revalidate` or search for `/api/blog/revalidate`
5. Or go to: `https://app.netlify.com/sites/[your-site-name]/functions`

Alternatively:
- Go to **"Deploys"** → Click on latest deploy → **"Functions"** tab
- You'll see all function invocations with their logs

## 2. Netlify CLI (Real-time) - Requires Authentication

**First, you need to link your site:**

```bash
# Login to Netlify (opens browser)
netlify login

# Link your site to this directory
netlify link
# OR initialize if not linked
netlify init
```

**Then view logs:**

```bash
# Stream all function logs to the console
netlify logs:function

# Stream logs for a specific function (by name)
netlify logs:function api-blog-revalidate

# Filter by log level (info, warn, error, etc.)
netlify logs:function api-blog-revalidate -l info warn error

# View deploy logs (build logs)
netlify logs:deploy

# Alternative alias (also works)
netlify logs:functions
```

## 3. Test Locally with `netlify dev` (Easiest for Local Testing)

**This is the best way to test and see logs locally:**

```bash
# Start Netlify dev server (shows logs in terminal)
netlify dev

# In another terminal, test the webhook
curl -X POST http://localhost:8888/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"id": 28150}'
```

**Or test with a file:**

```bash
# Create test payload
echo '{"id": 28150}' > test-payload.json

# Test the webhook
curl -X POST http://localhost:8888/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

**You'll see logs directly in the `netlify dev` terminal output!**

## 4. View Logs in Netlify Dashboard URL

Direct URL format:
```
https://app.netlify.com/sites/[your-site-name]/functions/[function-name]
```

For your function:
```
https://app.netlify.com/sites/[your-site-name]/functions/api-blog-revalidate
```

## What to Look For

The function logs will show:
- Incoming webhook payload
- Parsed blog IDs
- Cache purge results
- Any errors that occur

## Improving Logs

The function already has `console.error` for errors. You can add more detailed logging by adding `console.log` statements for debugging.

