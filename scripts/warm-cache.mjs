#!/usr/bin/env node

/**
 * Post-Deploy Cache Warm-Up Script
 * 
 * This script automatically warms up the cache for the last 40 blog posts
 * after a successful deployment. It calls the /api/warm-cache endpoint.
 * 
 * Usage:
 * - Run manually: npm run warm-cache
 * - Or configure in netlify.toml to run automatically after deploy
 */

const SITE_URL = process.env.NETLIFY_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL
const LIMIT = process.env.CACHE_WARM_LIMIT || 40

if (!SITE_URL) {
  console.error('❌ Error: Site URL not found. Set NETLIFY_SITE_URL, URL, or DEPLOY_PRIME_URL environment variable.')
  process.exit(1)
}

console.log(`🔥 Starting automatic cache warm-up for ${LIMIT} blog posts...`)
console.log(`📍 Site URL: ${SITE_URL}`)

// Wait a few seconds for the site to be fully live after deployment
const WAIT_TIME = 5000 // 5 seconds
console.log(`⏳ Waiting ${WAIT_TIME / 1000}s for site to be fully live...`)
await new Promise(resolve => setTimeout(resolve, WAIT_TIME))

try {
  const warmCacheUrl = `${SITE_URL}/api/warm-cache`
  console.log(`📡 Calling: ${warmCacheUrl}`)
  
  const response = await fetch(warmCacheUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ limit: parseInt(LIMIT) }),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }
  
    const result = await response.json()
  
  console.log(`✅ Cache warm-up complete!`)
  console.log(`   - Total posts: ${result.total}`)
  console.log(`   - Succeeded: ${result.succeeded}`)
  console.log(`   - Failed: ${result.failed}`)
  
  if (result.failed > 0) {
    console.warn(`⚠️  ${result.failed} posts failed to warm up. Check logs for details.`)
    // Don't exit with error - partial success is acceptable
  }
  
  process.exit(0)
} catch (error) {
  console.error('❌ Cache warm-up failed:', error.message)
  // Don't fail the deployment if warm-up fails
  console.warn('⚠️  Continuing despite warm-up failure (non-critical)')
  process.exit(0) // Exit with success so deployment isn't marked as failed
}
