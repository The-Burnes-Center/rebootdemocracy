# Minimal Nuxt 4 ISR Test

This is a minimal setup to test Incremental Static Regeneration (ISR) with Nuxt 4 on Netlify.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
npm run dev
```

3. Build:
```bash
npm run build
```

## Testing ISR

1. Visit `/test-isr` - this page uses ISR with cache tags
2. Click "Revalidate Cache" to purge the cache
3. Reload the page to see new data

## Revalidation

To revalidate via API:
```bash
curl "http://localhost:8888/.netlify/functions/revalidate?tag=test-isr"
```

## Files

- `pages/test-isr.vue` - ISR test page
- `server/api/test-isr.get.ts` - API endpoint that returns dynamic data
- `netlify/functions/revalidate.js` - Cache purging function
- `nuxt.config.ts` - Minimal Nuxt 4 config with ISR route rules
