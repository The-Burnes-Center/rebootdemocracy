# Nitro Netlify Setup Research

## Current Understanding

Based on research and codebase analysis:

### How Nitro's Netlify Preset Works

1. **Automatic Detection**: Nitro automatically detects the Netlify environment and configures itself accordingly when `preset: 'netlify'` is set in `nuxt.config.ts`.

2. **Output Structure**: 
   - Nitro builds the serverless function to `.output/server/server.mjs`
   - This file exports a default handler that should work with Netlify Functions
   - The function is configured with `path: "/*"` to handle all routes

3. **Netlify Configuration**:
   - Netlify expects functions in `netlify/functions/` directory (as specified in `netlify.toml`)
   - The publish directory is `.output/public/` (static files)
   - Functions directory is `netlify/functions/` (serverless functions)

### The Problem

**Nitro does NOT automatically copy the function from `.output/server/server.mjs` to `netlify/functions/server.mjs`**

This means:
- Nitro creates the function in `.output/server/server.mjs`
- Netlify looks for functions in `netlify/functions/`
- We need to bridge this gap

### Current Solution (Manual Wrapper)

We're currently using a manual wrapper function at `netlify/functions/server.mjs` that:
1. Imports the Nitro handler from `.output/server/server.mjs`
2. Converts Netlify's event/context to Node.js req/res objects
3. Converts Node.js req/res to H3 events
4. Calls the Nitro handler

**This approach is correct but complex** because:
- Netlify Functions 2.0 uses a different event structure than Node.js HTTP
- Nitro expects H3 events (which are built on Node.js req/res)
- We need to manually bridge these different event structures

### Alternative Approaches

#### Option 1: Use Nitro's Built-in Netlify Function Generation (Recommended)

Nitro might have a way to automatically generate the Netlify function. Let's check if there's a build hook or configuration that copies the function.

**Investigation needed:**
- Check if Nitro has a post-build hook that copies functions
- Check if there's a `nitro.output.netlify` configuration option
- Check if we need to use `nitro.experimental.netlify` or similar

#### Option 2: Simplify the Wrapper Function

Instead of manually converting events, we could:
- Use Nitro's built-in Netlify adapter (if it exists)
- Use a simpler event conversion approach
- Leverage Nitro's `toNodeListener` if available

#### Option 3: Use Netlify Edge Functions

Switch to `preset: 'netlify_edge'` which might have better integration:
- Edge Functions use a different runtime (Deno-based)
- Might have better Nitro support
- Different event structure (closer to H3)

### Current Issues with Manual Wrapper

1. **URL Construction Error**: `TypeError: Invalid URL` when Nitro tries to create URLs
   - Likely because the base URL (`${protocol}://${host}`) is invalid
   - We're setting headers correctly, but Nitro might be reading them differently

2. **Event Conversion Complexity**: 
   - Netlify Functions 2.0 event structure is different from Node.js HTTP
   - We're manually creating mock req/res objects
   - This is error-prone and complex

### Recommendations

1. **Short-term**: Fix the URL construction issue in the current wrapper
   - Ensure headers are set correctly (lowercase, proper values)
   - Ensure connection object is properly accessible
   - Add more debug logging to identify the exact issue

2. **Medium-term**: Investigate if Nitro has built-in Netlify function generation
   - Check Nitro's source code or documentation
   - Look for post-build hooks or configuration options
   - Consider contributing to Nitro if this feature is missing

3. **Long-term**: Consider switching to Netlify Edge Functions
   - Better integration with Nitro
   - Simpler event structure
   - Better performance (edge distribution)

### Next Steps

1. Continue debugging the current wrapper function
2. Research Nitro's source code for Netlify preset implementation
3. Check if there's a simpler way to bridge Netlify Functions and Nitro
4. Consider testing with `netlify_edge` preset to see if it works better

