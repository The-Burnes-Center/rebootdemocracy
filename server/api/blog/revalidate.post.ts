import { purgeCache } from '@netlify/functions';

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' });
  }

  try {
    const body = await readBody(event);
    
    // Log incoming webhook for debugging
    console.log('Webhook received:', JSON.stringify(body, null, 2));
    
    // Support both single ID and array of IDs
    // Accepts: id, blogIds, blogEntryId, payload.id, or array of IDs
    let blogIds: string[] = [];
    
    if (body.blogIds) {
      // Support blogIds field (array or single value)
      const blogIdsValue = body.blogIds;
      blogIds = Array.isArray(blogIdsValue)
        ? blogIdsValue.map((id: any) => String(id))
        : [String(blogIdsValue)];
    } else if (body.blogEntryId) {
      // Support blogEntryId field (array or single value)
      const blogEntryIdValue = body.blogEntryId;
      blogIds = Array.isArray(blogEntryIdValue)
        ? blogEntryIdValue.map((id: any) => String(id))
        : [String(blogEntryIdValue)];
    } else if (Array.isArray(body.id)) {
      blogIds = body.id.map((id: any) => String(id));
    } else if (body.id) {
      blogIds = [String(body.id)];
    } else if (body.payload?.id) {
      // Support nested payload format
      const payloadId = body.payload.id;
      blogIds = Array.isArray(payloadId) 
        ? payloadId.map((id: any) => String(id))
        : [String(payloadId)];
    } else if (Array.isArray(body)) {
      // Support array of IDs directly
      blogIds = body.map((id: any) => String(id));
    } else {
      throw createError({ 
        statusCode: 400, 
        message: 'Missing blog entry ID(s) in request body. Expected: id, blogIds, blogEntryId, payload.id, or array of IDs' 
      });
    }

    // Optional: Validate webhook secret if configured
    const config = useRuntimeConfig();
    const webhookSecret = config.directusWebhookSecret || process.env.DIRECTUS_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      const providedSecret = event.headers.get('x-directus-webhook-secret') || 
                            event.headers.get('authorization')?.replace('Bearer ', '');
      
      if (providedSecret !== webhookSecret) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
      }
    }

    // Purge cache for all provided blog post IDs
    // Each blog post page is tagged with its ID in the Netlify-Cache-Tag header
    console.log(`Purging cache for blog post IDs: ${blogIds.join(', ')}`);
    await purgeCache({ tags: blogIds });
    console.log(`Successfully purged cache for ${blogIds.length} blog post(s)`);

    // Return success response
    setResponseStatus(event, 202);
    return {
      success: true,
      message: `Cache purged for ${blogIds.length} blog post(s)`,
      purgedIds: blogIds,
    };
  } catch (error: any) {
    console.error('Error purging cache:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error',
    });
  }
});

