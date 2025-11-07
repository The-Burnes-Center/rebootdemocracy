// Simple revalidate endpoint - minimal version
console.log('Revalidate endpoint module loaded');

import { purgeCache } from '@netlify/functions';
import { createDirectus, rest, readItems } from '@directus/sdk';

console.log('purgeCache imported, type:', typeof purgeCache);

// Directus client for fetching blog slugs
const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

export default defineEventHandler(async (event) => {
  console.log('Revalidate endpoint called, method:', event.method);
  console.log('Event details:', {
    method: event.method,
    path: event.path,
    url: event.node?.req?.url,
  });
  
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' });
  }

  try {
    // Check if body is already available on the event (set by wrapper)
    let body;
    if (event.body !== undefined && event.body !== null) {
      console.log('Using body from event.body (pre-parsed by wrapper)');
      body = event.body;
      // If body is a string, parse it
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (err) {
          console.warn('Failed to parse body string:', err);
        }
      }
    } else {
      console.log('Reading request body from stream...');
      body = await readBody(event);
      // If body is a string, parse it
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (err) {
          console.warn('Failed to parse body string:', err);
        }
      }
    }
    console.log('Revalidate webhook received:', JSON.stringify(body, null, 2));
    console.log('Body type:', typeof body, 'isObject:', typeof body === 'object');
    
    // Extract blog IDs - support multiple formats
    let blogIds: string[] = [];
    
    if (body.blogIds) {
      blogIds = Array.isArray(body.blogIds) 
        ? body.blogIds.map((id: any) => String(id))
        : [String(body.blogIds)];
    } else if (body.id) {
      blogIds = Array.isArray(body.id) 
        ? body.id.map((id: any) => String(id))
        : [String(body.id)];
    } else {
      throw createError({ 
        statusCode: 400, 
        message: 'Missing blogIds or id in request body' 
      });
    }

    // Fetch blog slugs from Directus using the IDs
    console.log(`Fetching blog slugs for IDs: ${blogIds.join(', ')}`);
    const blogPaths: string[] = [];
    
    try {
      const blogPosts = await directus.request(
        readItems('reboot_democracy_blog', {
          filter: {
            id: { _in: blogIds }
          },
          fields: ['id', 'slug']
        })
      );
      
      for (const post of blogPosts) {
        if (post.slug) {
          blogPaths.push(`/blog/${post.slug}`);
        }
      }
      
      console.log(`Found ${blogPaths.length} blog paths to purge:`, blogPaths);
    } catch (error: any) {
      console.error('Error fetching blog slugs:', error);
      // Continue with tag-based purge as fallback
      console.warn('Falling back to tag-based cache purge');
    }

    // Purge cache by path (more reliable than tags for prerendered pages)
    // Also purge by tag as fallback
    console.log(`Purging cache for blog paths: ${blogPaths.join(', ')}`);
    console.log(`Also purging by tags: ${blogIds.join(', ')}`);
    console.log('About to call purgeCache...');
    console.log('purgeCache type:', typeof purgeCache, 'isFunction:', typeof purgeCache === 'function');
    
    // Wrap purgeCache in a timeout to prevent hanging
    // Get Netlify token from environment
    // purgeCache requires a Netlify personal access token
    // Set this as an environment variable in Netlify: NETLIFY_AUTH_TOKEN
    const netlifyToken = process.env.NETLIFY_AUTH_TOKEN;
    
    console.log('Creating purgeCache promise...');
    console.log('Netlify token available:', !!netlifyToken);
    
    if (!netlifyToken) {
      console.warn('NETLIFY_AUTH_TOKEN not found in environment. Cache purge may fail.');
      console.warn('To fix: Set NETLIFY_AUTH_TOKEN as an environment variable in Netlify with your personal access token.');
    }
    
    // Purge by path (for prerendered static files) AND by tag (for ISR pages)
    const purgeOptions: { paths?: string[]; tags?: string[]; token?: string } = {};
    if (blogPaths.length > 0) {
      purgeOptions.paths = blogPaths;
    }
    // Also purge by tag as fallback for ISR pages
    purgeOptions.tags = blogIds;
    if (netlifyToken) {
      purgeOptions.token = netlifyToken;
    }
    
    const purgePromise = purgeCache(purgeOptions);
    console.log('purgeCache promise created, type:', typeof purgePromise, 'isPromise:', purgePromise && typeof purgePromise.then === 'function');
    
    // Set timeout to 10 seconds (purgeCache should be fast, typically < 1 second)
    // If it takes longer, something is wrong and we should fail fast
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.warn('purgeCache timeout after 10 seconds - cache purge may still be in progress');
        reject(new Error('purgeCache timeout after 10 seconds'));
      }, 10000);
    });
    
    let purgeSucceeded = false;
    try {
      console.log('Awaiting purgeCache (with 10s timeout)...');
      await Promise.race([
        purgePromise.then((result) => {
          // Clear timeout when purgeCache succeeds
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          return result;
        }),
        timeoutPromise
      ]);
      purgeSucceeded = true;
      console.log(`Cache purged successfully`);
    } catch (error: any) {
      // Clear timeout on error too
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      console.error('Error during purgeCache:', error);
      // Note: purgeCache might still succeed even if the promise times out
      // The cache purge is asynchronous and may complete after the timeout
      // We'll return a warning but still indicate the request was processed
      console.warn('purgeCache timed out or failed, but cache purge may still be in progress');
    }

    // After cache purge, trigger regeneration by fetching each blog post URL
    // This ensures pages are regenerated immediately, not waiting for the next user request
    if (purgeSucceeded && blogPaths.length > 0) {
      console.log(`Triggering regeneration for ${blogPaths.length} blog post(s)...`);
      
      // Get the site URL from the request headers (most reliable)
      // Use the host from the incoming request to ensure we're hitting the correct deploy
      const requestHost = event.node?.req?.headers?.host || 
                         event.headers?.host ||
                         'nuxt4-isr-cache-tags--burnesblogtemplate.netlify.app';
      
      // Construct the full URL using the request host
      const protocol = event.node?.req?.headers?.['x-forwarded-proto'] || 
                       event.headers?.['x-forwarded-proto'] ||
                       'https';
      const siteUrl = `${protocol}://${requestHost}`;
      
      console.log(`Using site URL for regeneration: ${siteUrl}`);
      
      // Fetch each blog post URL to trigger regeneration
      // Don't await - fire and forget so we don't block the response
      const regenerationPromises = blogPaths.map(async (path) => {
        try {
          const url = `${siteUrl}${path}`;
          console.log(`Fetching ${url} to trigger regeneration...`);
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Netlify-ISR-Regeneration/1.0',
              'X-Netlify-Cache-Purge': 'true', // Custom header to identify regeneration requests
              'Cache-Control': 'no-cache', // Ensure we get a fresh response
            },
          });
          console.log(`Regeneration triggered for ${path}: ${response.status} ${response.statusText}`);
          
          // Check if response is OK (200-299)
          const isSuccess = response.ok;
          if (!isSuccess) {
            console.warn(`Regeneration failed for ${path}: ${response.status} ${response.statusText}`);
            // Try to read response body for more details
            try {
              const text = await response.text();
              console.warn(`Response body: ${text.substring(0, 200)}`);
            } catch (e) {
              // Ignore errors reading response
            }
          }
          
          return { path, status: response.status, success: isSuccess };
        } catch (error: any) {
          console.error(`Error triggering regeneration for ${path}:`, error.message);
          console.error(`Error stack:`, error.stack);
          return { path, status: 0, success: false, error: error.message };
        }
      });
      
      // Wait a short delay after cache purge to ensure CDN has processed the purge
      // Then trigger regeneration
      setTimeout(() => {
        // Fire and forget - don't wait for regeneration to complete
        // This allows the webhook to return quickly while regeneration happens in the background
        Promise.all(regenerationPromises).then((results) => {
          const successful = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success);
          console.log(`Regeneration complete: ${successful}/${results.length} pages regenerated successfully`);
          if (failed.length > 0) {
            console.warn(`Failed regenerations:`, failed.map(r => ({ path: r.path, status: r.status, error: r.error })));
          }
        }).catch((error) => {
          console.error('Error during regeneration:', error);
        });
      }, 2000); // Wait 2 seconds after cache purge for CDN to process
      
      console.log(`Regeneration triggered for ${blogPaths.length} blog post(s) (running in background after 2s delay)`);
    }

    console.log('Preparing response...');
    const response = {
      success: purgeSucceeded,
      message: purgeSucceeded 
        ? `Cache purged and regeneration triggered for ${blogIds.length} blog post(s)`
        : `Cache purge initiated for ${blogIds.length} blog post(s) (may still be in progress)`,
      purgedIds: blogIds,
      purgedPaths: blogPaths,
      regenerationTriggered: purgeSucceeded && blogPaths.length > 0,
      warning: purgeSucceeded ? undefined : 'Cache purge timed out but may still complete asynchronously',
    };
    console.log('Returning response:', JSON.stringify(response));
    return response;
  } catch (error: any) {
    console.error('Error in revalidate endpoint:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error',
    });
  }
});
