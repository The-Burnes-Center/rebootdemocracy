# Server Function Setup - Manual Wrapper

## Problem

With `nitro.preset: 'netlify'`, Nitro should automatically create a Netlify function wrapper, but it's not doing so. The Nitro server code exists in `.output/server/server.mjs`, but there's no function in `netlify/functions/` for Netlify to deploy.

## Solution

Created a manual function wrapper in `netlify/functions/server.mjs` that imports the Nitro server handler from `.output/server/server.mjs`.

## File Structure

```
project-root/
├── netlify/
│   └── functions/
│       └── server.mjs          ← Manual wrapper (NEW)
├── .output/
│   └── server/
│       ├── server.mjs          ← Nitro server handler (auto-generated)
│       ├── main.mjs            ← Nitro main entry
│       └── index.mjs           ← Nitro index
```

## How It Works

1. **Nitro Build**: When you run `npm run build`, Nitro creates the server code in `.output/server/server.mjs`
2. **Function Wrapper**: The manual wrapper in `netlify/functions/server.mjs` imports the Nitro handler
3. **Netlify Deployment**: Netlify deploys the function from `netlify/functions/` to `/.netlify/functions/server`
4. **Request Handling**: Requests to `/api/*` are redirected to `/.netlify/functions/server` (via `netlify.toml` redirect)
5. **Nitro Processing**: The Nitro handler processes the request and returns the response

## The Wrapper Code

```javascript
// netlify/functions/server.mjs
import nitroHandler from '../../.output/server/server.mjs';

export const handler = nitroHandler;
```

## Path Resolution

- **From**: `netlify/functions/server.mjs`
- **To**: `.output/server/server.mjs`
- **Path**: `../../.output/server/server.mjs`
  - `../` = up to `netlify/`
  - `../../` = up to project root
  - `.output/server/server.mjs` = target file

## Testing

After deploying, test the function:

```bash
# Test simple GET endpoint
curl https://your-site.netlify.app/api/test

# Test revalidate endpoint
curl -X POST https://your-site.netlify.app/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"blogIds": [28150]}'
```

## Why This Is Needed

With `nitro.preset: 'netlify'`, Nitro should automatically create the function wrapper, but it's not doing so. This manual wrapper ensures the function is available for Netlify to deploy.

## Future Improvements

If Nitro starts automatically creating the function wrapper in `.output/netlify/functions/server.mjs`, we can:
1. Remove this manual wrapper
2. Update `netlify.toml` to point `functions` to `.output/netlify/functions` instead of `netlify/functions`

## Important Notes

- The function wrapper must be in `netlify/functions/` (as specified in `netlify.toml`)
- The path to `.output/server/server.mjs` is relative to `netlify/functions/`
- The Nitro handler is the default export from `server.mjs`
- This wrapper simply re-exports the Nitro handler as a Netlify function

