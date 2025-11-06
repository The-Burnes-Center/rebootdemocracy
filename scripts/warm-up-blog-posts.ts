/**
 * Warm-up script for ISR blog posts
 * 
 * This script generates all blog posts on initial build by making requests to each page.
 * With ISR, pages are generated on first request and cached at the edge.
 * 
 * Usage: Run after build completes to ensure all blog posts are generated.
 * 
 * For Netlify: Add to build command or run as a post-build step
 */

import { fetchAllBlogPosts } from '../composables/fetchBlogData';

async function warmUpBlogPosts() {
  try {
    console.log('🔥 Warming up blog posts for ISR...');
    
    // Fetch all published blog posts
    const blogPosts = await fetchAllBlogPosts();
    console.log(`Found ${blogPosts.length} blog posts to warm up`);
    
    if (blogPosts.length === 0) {
      console.log('No blog posts found, skipping warm-up');
      return;
    }
    
    // Base URL for requests
    // In Netlify build, use the preview URL or local server
    const baseUrl = process.env.NETLIFY_PREVIEW_URL || 
                    process.env.DEPLOY_PRIME_URL || 
                    'http://localhost:8888';
    
    console.log(`Using base URL: ${baseUrl}`);
    
    // Warm up each blog post by making a request
    const warmUpPromises = blogPosts.map(async (post) => {
      if (!post.slug) {
        console.warn(`Skipping blog post without slug: ${post.id}`);
        return;
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
        } else {
          console.warn(`⚠️  Failed to warm up: /blog/${post.slug} (Status: ${response.status})`);
        }
      } catch (error) {
        console.error(`❌ Error warming up /blog/${post.slug}:`, error);
      }
    });
    
    // Wait for all warm-up requests to complete
    await Promise.all(warmUpPromises);
    
    console.log(`✅ Warm-up complete! ${blogPosts.length} blog posts generated`);
  } catch (error) {
    console.error('❌ Error during warm-up:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1] || '')) {
  warmUpBlogPosts();
}

export { warmUpBlogPosts };

