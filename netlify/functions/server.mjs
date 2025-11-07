/**
 * Netlify Function wrapper for Nuxt Nitro server
 * 
 * IMPORTANT: The import path `../../.output/server/server.mjs` is resolved
 * during the BUILD/BUNDLING phase, not at runtime. Here's how it works:
 * 
 * 1. During build: Netlify runs `npm run build`, which creates `.output/server/server.mjs`
 * 2. During bundling: Netlify's esbuild bundles `netlify/functions/server.mjs` and resolves
 *    the import `../../.output/server/server.mjs`, including all the code in the bundle
 * 3. At runtime: The bundled function doesn't need `.output` anymore - it's all in the bundle
 * 
 * The `.output` directory is NOT in the `dist` folder because:
 * - `dist` (`.output/public/`) contains only static assets (HTML, CSS, JS, images)
 * - Functions are deployed separately to Netlify's serverless function environment
 * - The bundled function code is deployed as a separate artifact
 * 
 * This wrapper uses Nitro's built-in Netlify handler.
 */

// Import the Nitro server handler
// The path is relative to the netlify/functions directory
// In Netlify's build environment, .output is in the project root
// This import is resolved during BUILD/BUNDLING, not at runtime
import nitroHandler from '../../.output/server/server.mjs';

// Export the handler for Netlify
// With nitro.preset: 'netlify', the default export should be a Netlify-compatible handler
export const handler = nitroHandler;

