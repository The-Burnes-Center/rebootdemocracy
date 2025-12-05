/**
 * Cache Warm-Up API Endpoint
 * 
 * This endpoint warms up the cache for the home page, blog listing page, and the last N blog posts
 * by fetching them from Directus and making requests to each URL to trigger ISR generation and caching.
 * 
 * PURPOSE: After deployment, call this endpoint to pre-populate the cache with the most
 * important pages (home, blog listing) and recent blog posts, ensuring fast response times for users.
 * 
 * USAGE:
 * POST /api/warm-cache
 * Body (optional): { limit: 40 }
 * 
 * Or via curl:
 * curl -X POST https://your-site.netlify.app/api/warm-cache
 * 
 * Or via Netlify webhook/function after deploy
 * 
 * WHAT GETS WARMED:
 * - Home page (/)
 * - Blog listing page (/blog)
 * - Last N blog posts (/blog/{slug})
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
    
    console.log(`🔥 Starting cache warm-up for home page, blog listing, and ${limit} blog posts...`)
    console.log(`📍 Site URL: ${siteUrl}`)
    
    // Track results for all pages
    let totalSuccessCount = 0
    let totalErrorCount = 0
    const results: Array<{ 
      path: string; 
      type: 'home' | 'blog-listing' | 'blog-post'; 
      status: number; 
      cached: boolean; 
      error?: string;
      slug?: string;
    }> = []
    
    /**
     * Helper: Warm up a single page
     * 
     * Makes a request to the page URL to trigger ISR generation and cache the response.
     */
    const warmUpPage = async (path: string, type: 'home' | 'blog-listing' | 'blog-post', slug?: string) => {
      const pageUrl = `${siteUrl}${path}`
      
      try {
        // Make request to trigger ISR generation and cache the page
        const pageResponse = await fetch(pageUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Netlify-Cache-Warm-Up/1.0',
            // Don't use cache-busting - we want to cache the response
          },
        })
        
        if (pageResponse.ok) {
          const cacheStatus = pageResponse.headers.get("Cache-Status") || "unknown"
          const isCached = cacheStatus.includes('hit') && !cacheStatus.includes('fwd=stale')
          totalSuccessCount++
          results.push({
            path,
            type,
            status: pageResponse.status,
            cached: isCached,
            ...(slug && { slug }),
          })
          console.log(`✅ Warmed: ${path} (status: ${pageResponse.status}, cache: ${cacheStatus})`)
          return { success: true, cached: isCached }
        } else {
          totalErrorCount++
          const errorMsg = `HTTP ${pageResponse.status}`
          results.push({
            path,
            type,
            status: pageResponse.status,
            cached: false,
            error: errorMsg,
            ...(slug && { slug }),
          })
          console.warn(`⚠️  Failed: ${path} (status: ${pageResponse.status})`)
          return { success: false, cached: false }
        }
      } catch (error) {
        totalErrorCount++
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.push({
          path,
          type,
          status: 0,
          cached: false,
          error: errorMsg,
          ...(slug && { slug }),
        })
        console.error(`❌ Error warming ${path}: ${errorMsg}`)
        return { success: false, cached: false }
      }
    }
    
    // Step 1: Warm up home page
    console.log(`🏠 Warming up home page...`)
    await warmUpPage('/', 'home')
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Step 2: Warm up blog listing page
    console.log(`📝 Warming up blog listing page...`)
    await warmUpPage('/blog', 'blog-listing')
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Step 3: Fetch last N blog posts from Directus
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
    } else {
      console.log(`📋 Found ${posts.length} blog posts to warm up`)
      
      // Step 4: Warm up cache for each blog post
      for (const post of posts) {
        if (!post.slug) {
          console.warn(`⚠️  Skipping post without slug:`, post)
          continue
        }
        
        await warmUpPage(`/blog/${post.slug}`, 'blog-post', post.slug)
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    const totalPages = 2 + posts.length // home + blog listing + blog posts
    console.log(`✅ Cache warm-up complete!`)
    console.log(`   - Total pages: ${totalPages} (home + blog listing + ${posts.length} blog posts)`)
    console.log(`   - Succeeded: ${totalSuccessCount}`)
    console.log(`   - Failed: ${totalErrorCount}`)
    
    setResponseStatus(event, 200)
    return {
      message: "Cache warm-up completed",
      total: totalPages,
      succeeded: totalSuccessCount,
      failed: totalErrorCount,
      breakdown: {
        home: results.filter(r => r.type === 'home').length,
        blogListing: results.filter(r => r.type === 'blog-listing').length,
        blogPosts: results.filter(r => r.type === 'blog-post').length,
      },
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

