export default defineEventHandler(async (event) => {
  try {
    // Log that warm-up was triggered
    console.log("🔥 Warm-up endpoint called")
    console.log("Request headers:", Object.fromEntries(event.headers.entries()))
    
    // Get the site URL from headers or environment
    const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || "localhost:8888"
    const protocol = event.headers.get("x-forwarded-proto") || "http"
    const siteUrl = `${protocol}://${host}`
    
    console.log(`Site URL: ${siteUrl}`)
    
    // Pages to warm up after deployment
    const pagesToWarmUp = [
      "/test-isr",
      // Add more ISR pages here as needed
    ]
    
    console.log(`🔥 Starting warm-up for ${pagesToWarmUp.length} page(s) after deployment...`)
    
    const results = []
    
    for (const path of pagesToWarmUp) {
      try {
        const url = `${siteUrl}${path}`
        console.log(`Warming up: ${url}`)
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Netlify-Warm-Up/1.0",
            "X-Warm-Up": "true",
          },
        })
        
        const status = response.status
        const text = await response.text()
        const hasContent = text.length > 0
        
        results.push({
          path,
          status,
          success: status === 200 && hasContent,
          contentLength: text.length,
        })
        
        console.log(`✅ ${path}: ${status} (${text.length} bytes)`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`❌ Failed to warm up ${path}:`, errorMsg)
        results.push({
          path,
          status: 0,
          success: false,
          error: errorMsg,
        })
      }
    }
    
    const successCount = results.filter((r) => r.success).length
    const totalCount = results.length
    
    console.log(`🔥 Warm-up complete: ${successCount}/${totalCount} pages warmed up successfully`)
    
    setResponseStatus(event, 200)
    return {
      message: "Warm-up completed",
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
      },
    }
  } catch (error) {
    console.error("Warm-up error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    throw createError({
      statusCode: 500,
      statusMessage: `Warm-up failed: ${errorMessage}`,
    })
  }
})

