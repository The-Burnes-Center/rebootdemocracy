/**
 * Netlify Function wrapper for Nuxt Nitro server
 * 
 * This function imports the Nitro server code from .output/server/server.mjs
 * and exposes it as a Netlify serverless function.
 * 
 * With nitro.preset: 'netlify', Nitro should automatically create this,
 * but if it doesn't, this manual wrapper ensures the function is available.
 * 
 * The Nitro server exports a default handler that processes all requests,
 * including /api/* routes.
 */

// Import the Nitro server handler
// The path is relative to the netlify/functions directory
// In Netlify's build environment, .output is in the project root
import nitroHandler from '../../.output/server/server.mjs';

// Export the handler for Netlify
// The default export from server.mjs is the Nitro handler
export const handler = nitroHandler;

