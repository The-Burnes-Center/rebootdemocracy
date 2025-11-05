# Webhook Setup for Partial SSG

This setup uses a Directus webhook that sends the blog entry ID to Netlify's build hook, triggering a partial build that only regenerates the specific blog route.

## How It Works

1. **Directus webhook** triggers when a blog post is created/updated
2. **Webhook payload** contains the blog entry ID (e.g., `{ "id": "abc-123" }`)
3. **Netlify build hook** receives the payload and triggers a build
4. **Build script** reads the blog entry ID from environment variables
5. **Only that specific route** is regenerated

## Setting Up the Directus Webhook

### Option 1: Directus Webhook → Netlify Build Hook (Recommended)

1. **In Directus**:
   - Go to Settings → Webhooks
   - Create a new webhook
   - **Event**: `items.update` (and/or `items.create`)
   - **Collection**: `reboot_democracy_blog`
   - **Method**: POST
   - **URL**: Your Netlify build hook URL
   - **Headers**: `Content-Type: application/json`
   - **Payload**: 
     ```json
     {
       "id": "{{ $trigger.key }}"
     }
     ```
     (This sends the blog entry ID in the payload)

2. **In Netlify**:
   - Go to Site Settings → Build & deploy → Build hooks
   - Create a new build hook (if you don't have one)
   - Copy the build hook URL
   - Use this URL in the Directus webhook

### Option 2: Custom Webhook Handler

If you need more control, you can create a Netlify function that:
1. Receives the webhook from Directus
2. Extracts the blog entry ID
3. Triggers a build with the ID as an environment variable

## Environment Variables

The build script looks for the blog entry ID in these environment variables (in order):

1. `BLOG_ENTRY_ID` - Direct ID (e.g., `"abc-123"`)
2. `INCOMING_HOOK_BODY` - JSON payload from Netlify build hook (e.g., `'{"id":"abc-123"}'`)

The script will automatically parse JSON from `INCOMING_HOOK_BODY` and extract the `id` field.

## Payload Formats Supported

The script supports these payload formats:

```json
// Simple ID
{ "id": "abc-123" }

// With BLOG_ENTRY_ID field
{ "BLOG_ENTRY_ID": "abc-123" }

// Nested payload
{ "payload": { "id": "abc-123" } }
```

## Testing

### Test with Build Hook

1. **Get the blog entry ID** from Directus (copy the UUID of a blog post)
2. **Trigger build hook** with payload:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"id":"your-blog-entry-id"}' \
     https://api.netlify.com/build_hooks/YOUR_BUILD_HOOK_ID
   ```
3. **Check build logs** - should show:
   ```
   📝 Blog entry ID from webhook: your-blog-entry-id
   ✅ Found 1 changed blog route(s)
      Routes: /blog/your-slug
   ```

### Test Locally

```bash
# Set environment variable
export BLOG_ENTRY_ID="your-blog-entry-id"

# Run the script
node scripts/partial-build.mjs
```

## Benefits

- **Faster builds**: Only regenerates the changed blog route
- **Accurate**: Knows exactly which route changed (no comparison needed)
- **Efficient**: Single Directus query instead of fetching all posts
- **Real-time**: Immediate regeneration when content changes

## Fallback Behavior

If no blog entry ID is provided (e.g., scheduled builds or manual triggers):
- Falls back to automatic change detection
- Compares all blog routes with cached manifest
- Regenerates all changed routes

