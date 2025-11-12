// Nitro configuration for Netlify deployment
// Using 'netlify' preset (netlify_builder is deprecated and causes module export errors)
// The 'netlify' preset works with isr route rules in nuxt.config.ts
export default defineNitroConfig({
  preset: 'netlify'
})

