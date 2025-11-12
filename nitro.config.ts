// Nitro configuration for Netlify deployment
// Following Answer Overflow example: https://www.answeroverflow.com/m/1306962492647538760
// Note: netlify_builder preset is deprecated, but using it to match the exact example
// Modern approach would use 'netlify' preset with isr route rules
export default defineNitroConfig({
  preset: 'netlify_builder'
})

