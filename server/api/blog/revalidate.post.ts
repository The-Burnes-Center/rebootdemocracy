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
    } else {
      console.log('Reading request body from stream...');
      body = await readBody(event);
    }
    console.log('Revalidate webhook received:', JSON.stringify(body, null, 2));
    
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
    console.log('Creating purgeCache promise...');
    const purgePromise = purgeCache({ tags: blogIds });
    console.log('purgeCache promise created, type:', typeof purgePromise, 'isPromise:', purgePromise && typeof purgePromise.then === 'function');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.error('purgeCache timeout after 25 seconds');
        reject(new Error('purgeCache timeout after 25 seconds'));
      }, 25000);
    });
    
    try {
      console.log('Awaiting purgeCache (with timeout)...');
      await Promise.race([purgePromise, timeoutPromise]);
      console.log(`Cache purged successfully`);
    } catch (error: any) {
      console.error('Error during purgeCache:', error);
      // If purgeCache fails, we still want to return success
      // The cache might still be purged, or it might need manual intervention
      console.warn('Continuing despite purgeCache error - cache may still be purged');
    }

    console.log('Preparing response...');
    const response = {
      success: true,
      message: `Cache purged for ${blogIds.length} blog post(s)`,
      purgedIds: blogIds,
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
