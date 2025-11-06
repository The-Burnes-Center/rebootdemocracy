# Webhook Testing Guide

## How to Test the Revalidate Endpoint

### 1. Local Testing (Development)

```bash
# Start the local dev server
netlify dev --port 8888

# In another terminal, test the endpoint
curl -X POST http://localhost:8888/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cache purged for 1 blog post(s). Pages will regenerate on next request via ISR.",
  "purgedIds": ["28150"],
  "regeneration": "on-demand"
}
```

### 2. Production Testing

After deploying to Netlify, test the production endpoint:

```bash
curl -X POST https://your-site.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```

**Replace `your-site.netlify.app` with your actual Netlify site URL.**

**Expected Response:** Same JSON response as above.

### 3. Testing with Directus Webhook

#### Step 1: Configure Directus Webhook

1. Go to your Directus admin panel
2. Navigate to **Settings** → **Webhooks**
3. Click **Create Webhook**
4. Configure:
   - **Name**: `Revalidate Blog Post`
   - **Method**: `POST`
   - **URL**: `https://your-site.netlify.app/api/blog/revalidate`
   - **Status**: `Active`
   - **Collections**: Select `reboot_democracy_blog`
   - **Actions**: Select `update` (and optionally `create`, `delete`)

#### Step 2: Configure Webhook Payload

In the webhook configuration, set the **Payload** to send the blog post ID:

**Option 1: Simple ID**
```json
{
  "blogIds": ["{{$trigger.payload.id}}"]
}
```

**Option 2: Multiple IDs (if updating multiple posts)**
```json
{
  "blogIds": ["{{$trigger.payload.id}}"]
}
```

**Option 3: Using Directus Webhook Variables**
```json
{
  "blogIds": [{{$trigger.payload.id}}]
}
```

#### Step 3: Optional - Add Webhook Secret

If you want to secure the webhook:

1. **Set environment variable in Netlify:**
   - Go to **Site settings** → **Environment variables**
   - Add: `DIRECTUS_WEBHOOK_SECRET` = `your-secret-key`

2. **Add to Directus webhook:**
   - In the webhook configuration, add a custom header:
     - **Header Name**: `x-directus-webhook-secret`
     - **Header Value**: `your-secret-key`

### 4. Verify It's Working

#### Check Netlify Function Logs

1. Go to **Netlify Dashboard** → Your site → **Functions** tab
2. Click on the function (should be `server` or similar)
3. View the logs to see webhook requests

#### Check Cache Purge

After triggering the webhook:
1. Visit the blog post URL: `https://your-site.netlify.app/blog/your-slug`
2. The page should regenerate with fresh content
3. Check the page source - it should have the updated content

### 5. Troubleshooting

#### Issue: Endpoint returns HTML instead of JSON

**Solution:** The redirect configuration in `netlify.toml` should include:
```toml
[[redirects]]
from = "/api/*"
to = "/.netlify/functions/server"
status = 200
force = true
```

#### Issue: "Missing blog entry ID(s)"

**Solution:** Check the webhook payload format. It should include one of:
- `{"blogIds": [28150]}`
- `{"id": 28150}`
- `{"blogEntryId": 28150}`
- `{"payload": {"id": 28150}}`

#### Issue: Cache not purging

**Solution:** 
1. Verify the blog post ID matches the cache tag
2. Check Netlify function logs for errors
3. Ensure `@netlify/functions` package is installed
4. Verify the `purgeCache` function is being called

### 6. Manual Cache Purge (Alternative)

If the webhook isn't working, you can manually purge the cache:

```bash
curl -X POST https://your-site.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150, 28151]}'
```

### 7. Testing Multiple Blog Posts

To revalidate multiple blog posts at once:

```bash
curl -X POST https://your-site.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150, 28151, 28152]}'
```

## Summary

✅ **Local**: Works automatically (no cache, always fresh)  
✅ **Production**: Requires webhook to purge CDN cache  
✅ **Webhook**: Configure in Directus to send blog post ID  
✅ **Testing**: Use `curl` to test the endpoint manually  

