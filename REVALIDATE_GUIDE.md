# How to Revalidate a Specific Blog Post

When a blog post is updated in Directus, you can revalidate (regenerate) that specific page using the revalidate endpoint.

## Quick Reference

### Single Blog Post

```bash
curl -X POST https://your-site.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```

### Multiple Blog Posts

```bash
curl -X POST https://your-site.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150, 28151, 28152]}'
```

## How It Works

1. **Cache is purged** for the specified blog post ID(s)
2. **Page regenerates** on the next request via ISR (serverless function)
3. **Only that specific page** regenerates, not the entire site
4. **Metadata updates automatically** (title, description, etc.)

## Supported ID Formats

The endpoint accepts multiple formats:

```json
// Format 1: blogIds array (recommended)
{"blogIds": [28150]}

// Format 2: blogIds single value
{"blogIds": 28150}

// Format 3: blogEntryId
{"blogEntryId": 28150}

// Format 4: id
{"id": 28150}

// Format 5: payload.id (for Directus webhooks)
{"payload": {"id": 28150}}

// Format 6: Array of IDs directly
[28150, 28151]
```

## Directus Webhook Setup

To automatically revalidate when content changes in Directus:

1. **Go to Directus** → **Settings** → **Webhooks**
2. **Create a new webhook** or edit existing
3. **Trigger**: Select **Item Update** (or **Item Create**)
4. **Collection**: Select `reboot_democracy_blog`
5. **URL**: `https://your-site.netlify.app/api/blog/revalidate`
6. **Method**: `POST`
7. **Headers**: 
   - `Content-Type: application/json`
   - (Optional) `x-directus-webhook-secret: your-secret` (if configured)
8. **Body**: 
   ```json
   {
     "blogIds": ["{{$trigger.payload.id}}"]
   }
   ```

## Optional: Webhook Secret

If you want to secure the endpoint, set `DIRECTUS_WEBHOOK_SECRET` in Netlify environment variables, then include it in the webhook headers:

**Header**: `x-directus-webhook-secret: your-secret`

Or use Authorization header:

**Header**: `Authorization: Bearer your-secret`

## Response

### Success (202 Accepted)

```json
{
  "success": true,
  "message": "Cache purged for 1 blog post(s). Pages will regenerate on next request via ISR.",
  "purgedIds": ["28150"],
  "regeneration": "on-demand"
}
```

### Error (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Missing blog entry ID(s) in request body. Expected: id, blogIds, blogEntryId, payload.id, or array of IDs"
}
```

## Testing Locally

```bash
# Start local server
netlify dev

# In another terminal, test revalidation
curl -X POST http://localhost:8888/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```

## What Happens After Revalidation

1. ✅ Cache is purged for the specified blog post ID(s)
2. ✅ On the **next request** to that page, it regenerates via ISR
3. ✅ Updated content is served and cached at the edge
4. ✅ Only that specific page regenerates (not the entire site)

## Example: Revalidating After Content Update

```bash
# 1. Update blog post in Directus (ID: 28150)
# 2. Revalidate the page
curl -X POST https://your-site.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'

# 3. Visit the page - it will show updated content
# https://your-site.netlify.app/blog/your-post-slug
```

## Troubleshooting

### 404 Error
- Make sure the endpoint URL is correct: `/api/blog/revalidate`
- Check that the site is deployed and accessible

### 401 Unauthorized
- If you configured `DIRECTUS_WEBHOOK_SECRET`, make sure the webhook includes the secret in headers
- Check that the secret matches in both Directus and Netlify

### Page Not Updating
- Wait a moment after revalidation (cache purge takes a few seconds)
- Make sure you're visiting the correct URL
- Check that the blog post ID matches the cache tag set in the page component

### Multiple IDs Not Working
- Make sure IDs are in an array: `{"blogIds": [28150, 28151]}`
- Check that all IDs are valid blog post IDs

