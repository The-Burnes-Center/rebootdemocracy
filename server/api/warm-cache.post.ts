/**
 * Cache Warm-Up API Endpoint
 * 
 * This endpoint supports two modes:
 * 
 * 1. FULL WARM-UP (after deploy): Warms home, blog listing, and last N blog posts
 *    POST /api/warm-cache
 *    Body (optional): { limit: 40 }
 * 
 * 2. SINGLE PAGE WARM-UP (after revalidation): Warms specific page + home + blog listing
 *    POST /api/warm-cache
 *    Body: { tag: "blog/my-slug" } or { slug: "my-slug" }
 * 
 * PURPOSE: 
 * - After deployment: Pre-populate cache with important pages and recent posts
 * - After revalidation: Warm up the specific page + home + blog listing (not the full 40)
 * 
 * USAGE:
 * # Full warm-up (after deploy)
 * curl -X POST https://your-site.netlify.app/api/warm-cache
 * 
 * # Single page warm-up (after revalidation)
 * curl -X POST https://your-site.netlify.app/api/warm-cache -d '{"tag": "blog/my-slug"}'
 * 
 * WHAT GETS WARMED:
 * - Full mode: Home page, blog listing, and last N blog posts (default: 40)
 * - Single mode: Home page, blog listing, and the specific blog post (NOT the full 40)
 */

const DIRECTUS_URL = 'https://directus.theburnescenter.org/items/reboot_democracy_blog/'
const DEFAULT_LIMIT = 40

export default defineEventHandler(async (event) => {
  try {
    // Get limit from request body or use default
    const body = await readBody(event).catch(() => ({}))
    
    // Get site URL from headers or environment
    const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL
    const protocol = event.headers.get("x-forwarded-proto") || "https"
    const siteUrl = `${protocol}://${host}`
    
    // Check if this is a single page warm-up (after revalidation) or full warm-up (after deploy)
    const tag = body?.tag || body?.payload?.tag || body?.data?.tag
    const slug = body?.slug || body?.payload?.slug || body?.data?.slug
    
    // Determine mode: if tag or slug is provided, do single page warm-up
    const isSinglePageWarmUp = !!(tag || slug)
    
    if (isSinglePageWarmUp) {
      // Extract slug from tag if tag is provided (e.g., "blog/my-slug" -> "my-slug")
      const targetSlug = slug || (tag?.startsWith("blog/") ? tag.replace("blog/", "") : null)
      
      if (!targetSlug) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid tag or slug. Expected format: { tag: 'blog/my-slug' } or { slug: 'my-slug' }",
        })
      }
      
      console.log(`🔥 Starting single page cache warm-up for: /blog/${targetSlug}`)
      console.log(`📍 Site URL: ${siteUrl}`)
    } else {
      const limit = parseInt(body?.limit || process.env.CACHE_WARM_LIMIT || DEFAULT_LIMIT)
      console.log(`🔥 Starting full cache warm-up for home page, blog listing, and ${limit} blog posts...`)
      console.log(`📍 Site URL: ${siteUrl}`)
    }
    
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
    
    if (isSinglePageWarmUp) {
      // SINGLE PAGE MODE: Warm up the specific page that was revalidated + home + blog listing
      // (but NOT the full 40 posts - those are only warmed up after deploy)
      const targetSlug = slug || (tag?.startsWith("blog/") ? tag.replace("blog/", "") : null)
      
      if (!targetSlug) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid tag or slug. Expected format: { tag: 'blog/my-slug' } or { slug: 'my-slug' }",
        })
      }
      
      // Step 1: Warm up home page
      console.log(`🏠 Warming up home page...`)
      await warmUpPage('/', 'home')
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Step 2: Warm up blog listing page
      console.log(`📝 Warming up blog listing page...`)
      await warmUpPage('/blog', 'blog-listing')
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Step 3: Warm up the specific blog post
      console.log(`🔥 Warming up specific blog post: /blog/${targetSlug}`)
      await warmUpPage(`/blog/${targetSlug}`, 'blog-post', targetSlug)
      
      const totalPages = 3 // home + blog listing + specific blog post
      console.log(`✅ Single page cache warm-up complete!`)
      console.log(`   - Total pages: ${totalPages} (home + blog listing + blog post)`)
      console.log(`   - Succeeded: ${totalSuccessCount}`)
      console.log(`   - Failed: ${totalErrorCount}`)
      
      setResponseStatus(event, 200)
      return {
        message: "Single page cache warm-up completed",
        mode: "single",
        tag: tag || `blog/${targetSlug}`,
        slug: targetSlug,
        total: totalPages,
        succeeded: totalSuccessCount,
        failed: totalErrorCount,
        breakdown: {
          home: results.filter(r => r.type === 'home').length,
          blogListing: results.filter(r => r.type === 'blog-listing').length,
          blogPost: results.filter(r => r.type === 'blog-post').length,
        },
        results: results,
      }
    } else {
      // FULL WARM-UP MODE: Warm up home, blog listing, and last N posts (after deploy)
      const limit = parseInt(body?.limit || process.env.CACHE_WARM_LIMIT || DEFAULT_LIMIT)
      
      // Step 1: Warm up home page
      console.log(`🏠 Warming up home page...`)
      await warmUpPage('/', 'home')
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Step 2: Warm up blog listing page
      console.log(`📝 Warming up blog listing page...`)
      await warmUpPage('/blog', 'blog-listing')
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Step 3: Fetch last N blog posts from Directus
      // NOTE: This only warms up the most recent posts by date (default: 40).
      // This is for after-deploy warm-up. For individual post revalidation,
      // use single page mode with tag/slug parameter.
      console.log(`📡 Fetching last ${limit} blog posts from Directus...`)
      const queryParams = new URLSearchParams({
        'fields': 'slug',
        'sort': '-date', // Most recent posts first
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
      console.log(`✅ Full cache warm-up complete!`)
      console.log(`   - Total pages: ${totalPages} (home + blog listing + ${posts.length} blog posts)`)
      console.log(`   - Succeeded: ${totalSuccessCount}`)
      console.log(`   - Failed: ${totalErrorCount}`)
      
      setResponseStatus(event, 200)
      return {
        message: "Full cache warm-up completed",
        mode: "full",
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

