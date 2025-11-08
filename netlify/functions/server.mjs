// Simple Netlify function wrapper for Nitro
// Uses Nitro's localFetch instead of the handler directly
// Based on Nuxt 4 ISR guide: https://dev.to/blamsa0mine/implementing-incremental-static-regeneration-isr-in-nuxt-4-the-complete-guide-2j7h

let localFetch;

async function loadNitro() {
  if (!localFetch) {
    const indexModule = await import('../../.output/server/index.mjs');
    localFetch = indexModule.localFetch;
    if (!localFetch || typeof localFetch !== 'function') {
      throw new Error('Nitro localFetch not found');
    }
  }
  return localFetch;
}

export const handler = async (event, context) => {
  const localFetch = await loadNitro();
  
  // Get host and protocol
  const host = event.headers?.host || event.headers?.['x-forwarded-host'] || 'localhost';
  const protocol = event.headers?.['x-forwarded-proto'] || 'https';
  
  // Get path
  let path = event.rawPath || event.path || '/';
  if (!path.startsWith('/')) path = '/' + path;
  
  // Add query string
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
    const queryString = new URLSearchParams(event.queryStringParameters).toString();
    if (queryString && !path.includes('?')) path += '?' + queryString;
  }
  
  // Create full URL
  const fullUrl = `${protocol}://${host}${path}`;
  
  // Build request options
  const requestOptions = {
    method: event.httpMethod || 'GET',
    headers: event.headers || {},
  };
  
  // Add body for POST/PUT/PATCH
  if (event.body && ['POST', 'PUT', 'PATCH'].includes(event.httpMethod)) {
    requestOptions.body = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    if (!requestOptions.headers['content-type']) {
      requestOptions.headers['content-type'] = 'application/json';
    }
  }
  
  try {
    console.log('Calling Nitro localFetch for:', fullUrl);
    
    // Use Nitro's localFetch - it handles the request internally
    const response = await localFetch(fullUrl, requestOptions);
    
    console.log('Nitro response received, status:', response.status);
    
    // Get response body
    const body = await response.text();
    
    console.log('Response body length:', body.length);
    
    // Convert Headers object to plain object
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    return {
      statusCode: response.status,
      headers,
      body,
    };
  } catch (error) {
    console.error('Error calling Nitro localFetch:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};
