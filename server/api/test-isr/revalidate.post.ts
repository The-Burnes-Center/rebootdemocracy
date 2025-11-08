// On-demand revalidation endpoint for ISR test page
// Call this endpoint to immediately regenerate the /test-isr page

import { purgeCache } from '@netlify/functions'

export default defineEventHandler(async (event) => {
  try {
    // Check if we're in local development
    const isLocal = process.env.NODE_ENV === 'development' || !process.env.NETLIFY
    
    // Get Netlify auth token from environment
    const authToken = process.env.NETLIFY_AUTH_TOKEN
    
    if (isLocal && !authToken) {
      // In local development, simulate cache purge
      console.log('🔧 Local development: Simulating cache purge for /test-isr')
      return {
        success: true,
        message: 'Local development: Cache purge simulated (not available locally)',
        purged: true,
        local: true,
        timestamp: new Date().toISOString()
      }
    }
    
    if (!authToken) {
      console.warn('⚠️ NETLIFY_AUTH_TOKEN not found - cache purge will not work')
      return {
        success: false,
        message: 'NETLIFY_AUTH_TOKEN not configured. Set it in Netlify environment variables.',
        purged: false
      }
    }

    // Purge cache for the test-isr page
    // We can purge by path or by tag
    const purgeResult = await purgeCache({
      tags: ['test-isr'], // Tag-based purge
      paths: ['/test-isr'] // Path-based purge (more reliable)
    })

    console.log('✅ Cache purged for /test-isr:', purgeResult)

    return {
      success: true,
      message: 'Cache purged successfully - next request will regenerate the page',
      purged: true,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('❌ Error purging cache:', error)
    return {
      success: false,
      message: error.message || 'Failed to purge cache',
      purged: false,
      error: error.toString()
    }
  }
})

