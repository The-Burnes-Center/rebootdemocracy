/**
 * Warm Cache Endpoint - Set Cache Tags for Recent Blog Posts
 * 
 * PURPOSE: After deploying the cache-tag plugin, this endpoint ensures that
 * the last N blog posts have cache tags set by triggering ISR generation.
 * 
 * HOW IT WORKS:
 * 1. Fetches the last N blog posts from Directus (ordered by date)
 * 2. For each post, makes a request to /blog/{slug}
 * 3. This triggers ISR generation with the cache tag set by the plugin
 * 4. The cached response includes the Netlify-Cache-Tag header
 * 
 * USAGE:
 * POST /api/warm-cache
 * Body: { limit: 40 } (optional, defaults to 40)
 * 
 * This should be called once after deployment to ensure existing blog posts
 * have cache tags set for on-demand revalidation.
 */

export default defineEventHandler(async (event) => {
  try {
    // Get limit from request body (default to 40)
    const body = await readBody(event).catch(() => ({}))
    const limit = body?.limit || 40
    
    console.log(`🔥 Starting cache warm-up for last ${limit} blog posts...`)
    
    // Fetch last N blog posts from Directus
    const queryParams = new URLSearchParams({
      'fields': 'slug,date',
      'sort': '-date', // Most recent first
      'limit': limit.toString(),
      'filter[status][_eq]': 'published', // Only published posts
    })
    const directusUrl = `https://directus.theburnescenter.org/items/reboot_democracy_blog/?${queryParams.toString()}`
    const response = await fetch(directusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Directus API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    const posts = data?.data || []
    
    if (posts.length === 0) {
      return {
        message: 'No blog posts found',
        warmed: 0,
        posts: [],
      }
    }
    
    console.log(`📋 Found ${posts.length} blog posts to warm up`)
    
    // Get site URL for making requests
    const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || "localhost:8888"
    const protocol = event.headers.get("x-forwarded-proto") || "http"
    const siteUrl = `${protocol}://${host}`
    
    // Warm up cache for each post
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const post of posts) {
      if (!post.slug) {
        console.warn(`⚠️ Skipping post without slug:`, post)
        continue
      }
      
      const blogUrl = `${siteUrl}/blog/${post.slug}`
      const cacheTag = `blog/${post.slug}`
      
      try {
        // Make request to trigger ISR generation with cache tag
        // The cache-tag plugin will set the Netlify-Cache-Tag header
        const blogResponse = await fetch(blogUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Netlify-Cache-Warm-Up/1.0',
            // Don't use cache-busting - we want to cache the response
          },
        })
        
        if (blogResponse.ok) {
          // Check if cache tag header was set (may not be visible in response, but it's set)
          const cacheTagHeader = blogResponse.headers.get("Netlify-Cache-Tag")
          const cacheStatus = blogResponse.headers.get("Cache-Status") || "unknown"
          
          successCount++
          results.push({
            slug: post.slug,
            url: blogUrl,
            tag: cacheTag,
            status: blogResponse.status,
            cacheTagSet: !!cacheTagHeader,
            cacheStatus,
            success: true,
          })
          
          console.log(`✅ Warmed cache for: ${cacheTag} (status: ${blogResponse.status}, cache: ${cacheStatus})`)
        } else {
          errorCount++
          results.push({
            slug: post.slug,
            url: blogUrl,
            tag: cacheTag,
            status: blogResponse.status,
            success: false,
            error: `HTTP ${blogResponse.status}`,
          })
          
          console.warn(`⚠️ Failed to warm cache for: ${cacheTag} (status: ${blogResponse.status})`)
        }
      } catch (error) {
        errorCount++
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.push({
          slug: post.slug,
          url: blogUrl,
          tag: cacheTag,
          success: false,
          error: errorMsg,
        })
        
        console.error(`❌ Error warming cache for: ${cacheTag} - ${errorMsg}`)
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`🔥 Cache warm-up complete: ${successCount} succeeded, ${errorCount} failed`)
    
    return {
      message: `Cache warm-up complete for ${posts.length} blog posts`,
      limit,
      total: posts.length,
      succeeded: successCount,
      failed: errorCount,
      results,
    }
  } catch (error) {
    console.error("Cache warm-up error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    throw createError({
      statusCode: 500,
      statusMessage: `Cache warm-up failed: ${errorMessage}`,
    })
  }
})

