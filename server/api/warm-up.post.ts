/**
 * Warm-up endpoint for ISR blog posts
 * 
 * This endpoint generates all blog posts by making requests to each page.
 * With ISR, pages are generated on first request and cached at the edge.
 * 
 * This endpoint can be called:
 * - After deployment (via Netlify deploy notifications)
 * - Via scheduled function
 * - Manually via POST request
 */

import { fetchAllBlogPosts } from '~/composables/fetchBlogData';

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' });
  }

  try {
    console.log('🔥 Starting warm-up for ISR blog posts...');
    
    // Fetch all published blog posts
    const blogPosts = await fetchAllBlogPosts();
    console.log(`Found ${blogPosts.length} blog posts to warm up`);
    
    if (blogPosts.length === 0) {
      console.log('No blog posts found, skipping warm-up');
      return {
        success: true,
        message: 'No blog posts found, skipping warm-up',
        warmedUp: 0,
      };
    }
    
    // Base URL for requests
    // Use the current site URL (Netlify provides this via environment variables)
    const baseUrl = process.env.URL || 
                    process.env.DEPLOY_PRIME_URL || 
                    process.env.NETLIFY_PREVIEW_URL ||
                    'http://localhost:8888';
    
    console.log(`Using base URL: ${baseUrl}`);
    
    // Warm up each blog post by making a request
    const results = await Promise.allSettled(
      blogPosts.map(async (post) => {
        if (!post.slug) {
          console.warn(`Skipping blog post without slug: ${post.id}`);
          return { slug: post.slug, id: post.id, status: 'skipped' };
        }
        
        const url = `${baseUrl}/blog/${post.slug}`;
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Netlify-ISR-Warm-Up/1.0',
            },
          });
          
          if (response.ok) {
            console.log(`✅ Warmed up: /blog/${post.slug} (ID: ${post.id})`);
            return { slug: post.slug, id: post.id, status: 'success' };
          } else {
            console.warn(`⚠️  Failed to warm up: /blog/${post.slug} (Status: ${response.status})`);
            return { slug: post.slug, id: post.id, status: 'failed', statusCode: response.status };
          }
        } catch (error: any) {
          console.error(`❌ Error warming up /blog/${post.slug}:`, error);
          return { slug: post.slug, id: post.id, status: 'error', error: error.message };
        }
      })
    );
    
    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 'success')).length;
    
    console.log(`✅ Warm-up complete! ${successful} successful, ${failed} failed out of ${blogPosts.length} total`);
    
    return {
      success: true,
      message: `Warm-up complete: ${successful} successful, ${failed} failed`,
      total: blogPosts.length,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason }),
    };
  } catch (error: any) {
    console.error('❌ Error during warm-up:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error during warm-up',
    });
  }
});

