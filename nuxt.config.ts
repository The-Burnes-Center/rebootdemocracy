export default defineNuxtConfig({
  compatibilityDate: "2024-11-13",
  future: {
    compatibilityVersion: 4,
  },
  nitro: {
    preset: "netlify",
    output: {
      dir: ".output",
      publicDir: ".output/public",
    },
    // Generate _redirects file for Netlify
    prerender: {
      routes: ["/"],
    },
  },
  hooks: {
    "nitro:build:public-assets"(nitro) {
      // Add redirects to _redirects file for ISR and API routes
      const redirectsPath = nitro.options.output.publicDir + "/_redirects"
      const fs = require("fs")
      const redirects = `# Nitro serverless function redirects
/* /.netlify/functions/server 200
`
      fs.writeFileSync(redirectsPath, redirects)
    },
  },
  routeRules: {
    // Homepage - prerender
    "/": { prerender: true },
    // ISR test page - using isr: true as per Netlify docs
    "/test-isr": {
      isr: true,
    },
  },
})
