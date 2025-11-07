// Simple revalidate endpoint - minimal version
console.log('Revalidate endpoint module loaded');

import { purgeCache } from '@netlify/functions';

console.log('purgeCache imported, type:', typeof purgeCache);

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

    // Purge cache
    console.log(`Purging cache for blog IDs: ${blogIds.join(', ')}`);
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
    
    const purgeOptions: { tags: string[]; token?: string } = { tags: blogIds };
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

    console.log('Preparing response...');
    const response = {
      success: purgeSucceeded,
      message: purgeSucceeded 
        ? `Cache purged for ${blogIds.length} blog post(s)`
        : `Cache purge initiated for ${blogIds.length} blog post(s) (may still be in progress)`,
      purgedIds: blogIds,
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
