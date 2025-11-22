/**
 * Cache Warm-Up API Endpoint
 * 
 * This endpoint warms up the cache for the last N blog posts by fetching them from Directus
 * and making requests to each blog URL to trigger ISR generation and caching.
 * 
 * PURPOSE: After deployment, call this endpoint to pre-populate the cache with the most
 * recent blog posts, ensuring fast response times for users.
 * 
 * USAGE:
 * POST /api/warm-cache
 * Body (optional): { limit: 40 }
 * 
 * Or via curl:
 * curl -X POST https://your-site.netlify.app/api/warm-cache
 * 
 * Or via Netlify webhook/function after deploy
 */

const DIRECTUS_URL = 'https://directus.theburnescenter.org/items/reboot_democracy_blog/'
const DEFAULT_LIMIT = 40

export default defineEventHandler(async (event) => {
  try {
    // Get limit from request body or use default
    const body = await readBody(event).catch(() => ({}))
    const limit = parseInt(body?.limit || process.env.CACHE_WARM_LIMIT || DEFAULT_LIMIT)
    
    // Get site URL from headers or environment
    const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL
    const protocol = event.headers.get("x-forwarded-proto") || "https"
    const siteUrl = `${protocol}://${host}`
    
    console.log(`🔥 Starting cache warm-up for ${limit} blog posts...`)
    console.log(`📍 Site URL: ${siteUrl}`)
    
    // Fetch last N blog posts from Directus
    console.log(`📡 Fetching last ${limit} blog posts from Directus...`)
    const queryParams = new URLSearchParams({
      'fields': 'slug',
      'sort': '-date',
      'limit': limit.toString(),
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
      setResponseStatus(event, 200)
      return {
        message: "No blog posts found to warm up",
        total: 0,
        succeeded: 0,
        failed: 0,
      }
    }
    
    console.log(`📋 Found ${posts.length} blog posts to warm up`)
    
    // Warm up cache for each post
    let successCount = 0
    let errorCount = 0
    const results: Array<{ slug: string; status: number; cached: boolean; error?: string }> = []
    
    for (const post of posts) {
      if (!post.slug) {
        console.warn(`⚠️  Skipping post without slug:`, post)
        continue
      }
      
      const blogUrl = `${siteUrl}/blog/${post.slug}`
      
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
          const isCached = cacheStatus.includes('hit') && !cacheStatus.includes('fwd=stale')
          successCount++
          results.push({
            slug: post.slug,
            status: blogResponse.status,
            cached: isCached,
          })
          console.log(`✅ Warmed: /blog/${post.slug} (status: ${blogResponse.status}, cache: ${cacheStatus})`)
        } else {
          errorCount++
          const errorMsg = `HTTP ${blogResponse.status}`
          results.push({
            slug: post.slug,
            status: blogResponse.status,
            cached: false,
            error: errorMsg,
          })
          console.warn(`⚠️  Failed: /blog/${post.slug} (status: ${blogResponse.status})`)
        }
      } catch (error) {
        errorCount++
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.push({
          slug: post.slug,
          status: 0,
          cached: false,
          error: errorMsg,
        })
        console.error(`❌ Error warming /blog/${post.slug}: ${errorMsg}`)
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log(`✅ Cache warm-up complete!`)
    console.log(`   - Total posts: ${posts.length}`)
    console.log(`   - Succeeded: ${successCount}`)
    console.log(`   - Failed: ${errorCount}`)
    
    setResponseStatus(event, 200)
    return {
      message: "Cache warm-up completed",
      total: posts.length,
      succeeded: successCount,
      failed: errorCount,
      results: results,
    }
  } catch (error) {
    console.error('❌ Cache warm-up failed:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    setResponseStatus(event, 500)
    return {
      message: "Cache warm-up failed",
      error: errorMessage,
    }
  }
})

