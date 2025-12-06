#!/usr/bin/env node

/**
 * Post-Deploy Cache Warm-Up Script
 * 
 * This script automatically warms up the cache for the last N blog posts
 * after a successful deployment by fetching them from Directus and calling each URL.
 * 
 * Usage:
 * - Run manually: npm run warm-cache
 * - Or configure in netlify.toml to run automatically after deploy
 */

const SITE_URL = process.env.NETLIFY_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL
const LIMIT = parseInt(process.env.CACHE_WARM_LIMIT || 40)
const DIRECTUS_URL = 'https://directus.theburnescenter.org/items/reboot_democracy_blog/'

if (!SITE_URL) {
  console.error('❌ Error: Site URL not found. Set NETLIFY_SITE_URL, URL, or DEPLOY_PRIME_URL environment variable.')
  process.exit(1)
}

console.log(`🔥 Starting automatic cache warm-up for ${LIMIT} blog posts...`)
console.log(`📍 Site URL: ${SITE_URL}`)

// Wait a few seconds for the site to be fully live after deployment
const WAIT_TIME = 10000 // 10 seconds - give more time for server handler to be ready
console.log(`⏳ Waiting ${WAIT_TIME / 1000}s for site to be fully live...`)
await new Promise(resolve => setTimeout(resolve, WAIT_TIME))

try {
  // Fetch last N blog posts from Directus
  console.log(`📡 Fetching last ${LIMIT} blog posts from Directus...`)
  const queryParams = new URLSearchParams({
    'fields': 'slug',
    'sort': '-date',
    'limit': LIMIT.toString(),
    'filter[status][_eq]': 'published',
  })
  const directusUrl = `${DIRECTUS_URL}?${queryParams.toString()}`
  
  
  const directusResponse = await fetch(directusUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!directusResponse.ok) {
    const errorText = await directusResponse.text()
    throw new Error(`Directus API error: ${directusResponse.status} - ${errorText}`)
  }
  
  const directusData = await directusResponse.json()
  const posts = directusData?.data || []
  
  if (posts.length === 0) {
    console.warn('⚠️  No blog posts found to warm up')
    process.exit(0)
  }
  
  console.log(`📋 Found ${posts.length} blog posts to warm up`)
  
  // Warm up cache for each post
  let successCount = 0
  let errorCount = 0
  
  for (const post of posts) {
    if (!post.slug) {
      console.warn(`⚠️  Skipping post without slug:`, post)
      continue
    }
    
    const blogUrl = `${SITE_URL}/blog/${post.slug}`
    
    try {
      // Make request to trigger ISR generation and cache the page
      const blogResponse = await fetch(blogUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Netlify-Cache-Warm-Up/1.0',
          // Don't use cache-busting - we want to cache the response
        },
      })
      
      if (blogResponse.ok) {
        const cacheStatus = blogResponse.headers.get("Cache-Status") || "unknown"
        successCount++
        console.log(`✅ Warmed: /blog/${post.slug} (status: ${blogResponse.status}, cache: ${cacheStatus})`)
      } else {
        errorCount++
        console.warn(`⚠️  Failed: /blog/${post.slug} (status: ${blogResponse.status})`)
      }
    } catch (error) {
      errorCount++
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`❌ Error warming /blog/${post.slug}: ${errorMsg}`)
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log(`✅ Cache warm-up complete!`)
  console.log(`   - Total posts: ${posts.length}`)
  console.log(`   - Succeeded: ${successCount}`)
  console.log(`   - Failed: ${errorCount}`)
  
  if (errorCount > 0) {
    console.warn(`⚠️  ${errorCount} posts failed to warm up. Check logs for details.`)
  }
  
  process.exit(0)
} catch (error) {
  console.error('❌ Cache warm-up failed:', error.message)
  // Don't fail the deployment if warm-up fails
  console.warn('⚠️  Continuing despite warm-up failure (non-critical)')
  process.exit(0) // Exit with success so deployment isn't marked as failed
}
