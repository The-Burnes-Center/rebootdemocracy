/**
 * Nitro Configuration for Netlify Deployment
 * 
 * This file configures Nitro (Nuxt's server engine) to deploy to Netlify.
 * 
 * Preset: 'netlify'
 * - Generates Netlify-compatible serverless functions
 * - Works with ISR route rules defined in nuxt.config.ts
 * - Automatically handles routing and function generation
 * 
 * Note: 'netlify_builder' preset is deprecated and causes module export errors.
 * The modern 'netlify' preset is the recommended approach for Nuxt 3/4 on Netlify.
 * 
 * References:
 * - Nitro Netlify Preset: https://nitro.build/deploy/providers/netlify
 * - Netlify Functions: https://docs.netlify.com/functions/overview/
 */
export default defineNitroConfig({
  preset: 'netlify'
})
