# Quick Setup: Automatic Warm-Up After Deployment

## 🚀 One-Time Setup (5 minutes)

### Step 1: Go to Netlify Dashboard
1. Navigate to your site on Netlify
2. Click **Site settings** (gear icon)

### Step 2: Configure Deploy Notification
1. Go to **Build & deploy** → **Deploy notifications**
2. Scroll to **Outgoing webhooks**
3. Click **Add notification**
4. Select **Outgoing webhook**

### Step 3: Set Webhook URL
**Webhook URL**: `https://your-site.netlify.app/.netlify/functions/warm-up-blog-posts`

Replace `your-site.netlify.app` with your actual Netlify site URL.

**Example**: If your site is `https://burnesblogtemplate.netlify.app`, use:
```
https://burnesblogtemplate.netlify.app/.netlify/functions/warm-up-blog-posts
```

### Step 4: Configure Event
- **Event**: Select **Deploy succeeded** ✅
- **Branch**: Leave empty (runs for all branches) or specify a branch
- Click **Save**

## ✅ Done!

Now, every time a deployment succeeds:
1. ✅ Netlify automatically calls the warm-up function
2. ✅ All blog posts are generated via ISR
3. ✅ All pages are cached at the edge for SEO

## Verify It's Working

After your next deployment:
1. Go to **Functions** → **warm-up-blog-posts** in Netlify Dashboard
2. Check the **Logs** tab
3. You should see logs showing blog posts being warmed up

## Need Help?

See `WARM_UP_SETUP.md` for detailed documentation and troubleshooting.

