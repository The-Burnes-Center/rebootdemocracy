import { handler } from '../../netlify/functions/pschat.js';

export default defineEventHandler(async (event) => {
  // Get the request body
  const body = await readBody(event);
  
  // Mock the Netlify function event structure
  const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify(body),
    headers: getRequestHeaders(event)
  };
  
  // Call the Netlify function handler
  try {
    const result = await handler(mockEvent, {});
    
    // Set response headers
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        setResponseHeader(event, key, value);
      });
    }
    
    // Set response status
    setResponseStatus(event, result.statusCode);
    
    // Return the response body
    return result.body;
  } catch (error) {
    console.error('Error in pschat function:', error);
    setResponseStatus(event, 500);
    return JSON.stringify({ error: 'An error occurred processing your message' });
  }
});