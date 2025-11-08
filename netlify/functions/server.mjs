// Netlify function wrapper for Nitro
// Based on Nuxt 4 ISR guide: https://dev.to/blamsa0mine/implementing-incremental-static-regeneration-isr-in-nuxt-4-the-complete-guide-2j7h
// 
// IMPORTANT: We cannot import from .output/server/index.mjs because it has file:// imports
// that can't be bundled. Instead, we use Nitro's generated handler from .output/server/server.mjs
// which is designed for Netlify preset.

let nitroHandler;

async function loadNitro() {
  if (!nitroHandler) {
    console.log('Loading Nitro handler from .output/server/server.mjs...');
    // Nitro generates server.mjs for Netlify preset that exports the handler
    const serverModule = await import('../../.output/server/server.mjs');
    console.log('Nitro module loaded, exports:', Object.keys(serverModule));
    nitroHandler = serverModule.default || serverModule.handler || serverModule;
    if (!nitroHandler || typeof nitroHandler !== 'function') {
      throw new Error('Nitro handler not found or invalid');
    }
    console.log('Nitro handler loaded successfully, type:', typeof nitroHandler);
  }
  return nitroHandler;
}

export const handler = async (event, context) => {
  const handlerFn = await loadNitro();
  
  // Get host and protocol
  const host = event.headers?.host || 
               event.headers?.['x-forwarded-host'] || 
               event.headers?.['Host'] ||
               'localhost';
  const protocol = event.headers?.['x-forwarded-proto'] || 
                   event.headers?.['X-Forwarded-Proto'] ||
                   'https';
  
  // Get path
  let path = event.rawPath || event.path || '/';
  if (!path.startsWith('/')) path = '/' + path;
  
  // Add query string
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
    const queryString = new URLSearchParams(event.queryStringParameters).toString();
    if (queryString && !path.includes('?')) path += '?' + queryString;
  }
  
  // Create full URL (Nitro needs this for URL parsing)
  const fullUrl = `${protocol}://${host}${path}`;
  
  // Create a simple request object that Nitro can handle
  // Nitro's Netlify preset handler expects a Netlify event-like object
  const nitroEvent = {
    httpMethod: event.httpMethod || 'GET',
    path: path,
    rawPath: path,
    queryStringParameters: event.queryStringParameters || {},
    headers: event.headers || {},
    body: event.body || null,
    isBase64Encoded: event.isBase64Encoded || false,
    requestContext: event.requestContext || {},
  };
  
  try {
    console.log('Calling Nitro handler for:', fullUrl);
    
    // Call Nitro's handler - it should return a response object
    const result = await handlerFn(nitroEvent, context);
    
    console.log('Nitro handler returned, status:', result?.statusCode || result?.status);
    
    // Nitro's handler should return a Netlify-compatible response
    return result;
  } catch (error) {
    console.error('Error calling Nitro handler:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};
