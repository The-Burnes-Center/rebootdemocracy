# Partial SSG for Blog Routes

This setup implements partial Static Site Generation (SSG) for blog routes, significantly reducing build times by only regenerating blog posts that have changed.

## How It Works

### 1. **Change Detection** (`get-changed-blog-routes.ts`)
- Compares current blog routes from Directus with a cached manifest from the previous build
- Identifies new or changed blog routes
- Saves the current state to a manifest file for the next build

### 2. **Partial Build Script** (`partial-build.mjs`)
- Detects changed blog routes using the change detection script
- Restores previous build output from Netlify's build cache
- Runs Nuxt generate with `PARTIAL_BUILD=true` environment variable
- Only changed blog routes are regenerated
- Caches the new build output for the next build

### 3. **Nuxt Configuration** (`nuxt.config.ts`)
- Checks for `PARTIAL_BUILD` environment variable
- If partial build mode:
  - Only adds changed blog routes to the prerender list
  - Preserves all other routes from the cached build
- If full build mode:
  - Regenerates all blog routes (first build or when cache is missing)

### 4. **Netlify Configuration** (`netlify.toml`)
- Uses the partial build script instead of direct `nuxt generate`
- Configures build cache to preserve `.netlify/cache` directory
- Cache persists between builds, allowing incremental updates

## Build Flow

```
1. Netlify starts build
   ↓
2. Restore .netlify/cache from previous build (if exists)
   ↓
3. Run get-changed-blog-routes.ts
   - Fetches current blog routes from Directus
   - Compares with cached manifest
   - Identifies changed routes
   - Saves new manifest
   ↓
4. Restore .output/public from cache (if exists and partial build)
   ↓
5. Run Nuxt generate with PARTIAL_BUILD=true (if changed routes found)
   - Only regenerates changed blog routes
   - Preserves all other static files
   ↓
6. Cache .output/public for next build
```

## Benefits

- **Faster Builds**: Only regenerates changed blog posts, not all routes
- **Reduced Build Time**: From minutes to seconds for small updates
- **Cost Savings**: Less build time = lower Netlify build minutes usage
- **Automatic Fallback**: Falls back to full build if cache is missing

## First Build

On the first build (no cache exists):
- All blog routes will be regenerated (full build)
- Cache will be created for subsequent builds

## Forcing Full Build

To force a full build (useful for testing or when cache is corrupted):
1. Remove `PARTIAL_BUILD=true` from the build command
2. Or delete the `.netlify/cache` directory in Netlify's build settings

## Configuration

The setup is configured in:
- `netlify.toml`: Build command and cache paths
- `nuxt.config.ts`: Partial build detection and route configuration
- `scripts/partial-build.mjs`: Build orchestration logic
- `scripts/get-changed-blog-routes.ts`: Change detection logic

## Notes

- Only blog routes (`/blog/**`) are optimized for partial builds
- Other routes (categories, news, etc.) are still regenerated on each build
- The cache is stored in `.netlify/cache` and is managed by Netlify's build cache system
- Cache persists between builds on Netlify automatically

