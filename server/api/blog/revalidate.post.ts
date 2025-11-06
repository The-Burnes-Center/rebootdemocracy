// Simple revalidate endpoint - minimal version
import { purgeCache } from '@netlify/functions';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' });
  }

  try {
    const body = await readBody(event);
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
    await purgeCache({ tags: blogIds });
    console.log(`Cache purged successfully`);

    return {
      success: true,
      message: `Cache purged for ${blogIds.length} blog post(s)`,
      purgedIds: blogIds,
    };
  } catch (error: any) {
    console.error('Error in revalidate endpoint:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error',
    });
  }
});
