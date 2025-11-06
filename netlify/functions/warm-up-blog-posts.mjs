/**
 * Netlify Function to trigger warm-up after deployment
 * 
 * This function can be:
 * 1. Called via scheduled function (runs after deployment)
 * 2. Called via deploy notifications
 * 3. Called manually via POST request
 * 
 * It calls the Nuxt server API endpoint /api/warm-up to warm up all blog posts
 */

export const handler = async (event, context) => {
  try {
    // Get the site URL (Netlify provides this)
    const siteUrl = process.env.URL || 
                    process.env.DEPLOY_PRIME_URL || 
                    'https://burnesblogtemplate.netlify.app';
    
    console.log(`🔥 Triggering warm-up for blog posts at ${siteUrl}`);
    
    // Call the Nuxt server API endpoint
    const warmUpUrl = `${siteUrl}/api/warm-up`;
    
    const response = await fetch(warmUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Warm-Up-Function/1.0',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Warm-up failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Warm-up completed:', result);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Warm-up triggered successfully',
        result,
      }),
    };
  } catch (error) {
    console.error('❌ Error triggering warm-up:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

