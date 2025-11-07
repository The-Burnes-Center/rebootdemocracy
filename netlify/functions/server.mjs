/**
 * Netlify Function wrapper for Nuxt Nitro server
 * 
 * IMPORTANT: The import path `../../.output/server/server.mjs` is resolved
 * during the BUILD/BUNDLING phase, not at runtime. Here's how it works:
 * 
 * 1. During build: Netlify runs `npm run build`, which creates `.output/server/server.mjs`
 * 2. During bundling: Netlify's esbuild bundles `netlify/functions/server.mjs` and resolves
 *    the import `../../.output/server/server.mjs`, including all the code in the bundle
 * 3. At runtime: The bundled function doesn't need `.output` anymore - it's all in the bundle
 * 
 * The `.output` directory is NOT in the `dist` folder because:
 * - `dist` (`.output/public/`) contains only static assets (HTML, CSS, JS, images)
 * - Functions are deployed separately to Netlify's serverless function environment
 * - The bundled function code is deployed as a separate artifact
 * 
 * This wrapper converts Netlify function events to Node.js HTTP requests
 * and uses Nitro's handler to process them.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';

// Lazy load Nitro modules using dynamic import to avoid CommonJS/ESM bundling issues
let nitroHandler;
let createEvent;

async function loadNitro() {
  if (!nitroHandler) {
    // Import the Nitro server handler
    // The path is relative to the netlify/functions directory
    // In Netlify's build environment, .output is in the project root
    const nitroModule = await import('../../.output/server/server.mjs');
    nitroHandler = nitroModule.default;
    
    // Import createEvent from nitro chunks
    // createEvent is not exported, but we can access it via dynamic import
    const nitroChunks = await import('../../.output/server/chunks/nitro/nitro.mjs');
    // Try to access createEvent - it might be available in the module namespace
    // If not, we'll create an H3 event manually
    createEvent = nitroChunks.createEvent;
  }
  return { nitroHandler, createEvent };
}

// Netlify function handler
export const handler = async (event, context) => {
  // Load Nitro modules
  const { nitroHandler, createEvent: nitroCreateEvent } = await loadNitro();
  
  // Build the full URL from Netlify event
  // Netlify event structure: event.path, event.httpMethod, event.headers, event.queryStringParameters
  // Nitro's getRequestHost and getRequestProtocol look for specific headers
  // We need to provide valid host and protocol for URL construction
  const host = event.headers?.host || 
               event.headers?.['x-forwarded-host'] || 
               event.headers?.['Host'] ||
               event.headers?.['host'] ||
               event.headers?.['X-Forwarded-Host'] ||
               'localhost';
  
  // Ensure host is valid (not empty, has proper format)
  // Nitro's getRequestURL creates a URL from path and base URL
  // The host must be a valid domain for URL construction
  let validHost = host && host.trim() ? host.trim() : null;
  
  // If host is missing or invalid, try to get it from Netlify environment
  // Netlify provides the site URL in environment variables
  if (!validHost || validHost === 'localhost' || validHost === '') {
    // Try to get host from Netlify environment variables
    const netlifyHost = process.env.URL || 
                       process.env.DEPLOY_PRIME_URL || 
                       process.env.CONTEXT?.site?.url;
    
    if (netlifyHost) {
      // Extract host from URL (e.g., "https://example.netlify.app" -> "example.netlify.app")
      try {
        const url = new URL(netlifyHost);
        validHost = url.host;
      } catch {
        // If URL parsing fails, use the host as-is
        validHost = netlifyHost.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      }
    } else {
      // Fallback to a valid domain for URL construction
      // This is just for URL construction - the actual request will work
      validHost = 'netlify.app';
    }
  }
  
  const protocol = event.headers?.['x-forwarded-proto'] || 
                   event.headers?.['X-Forwarded-Proto'] ||
                   event.headers?.['x-forwarded-protocol'] ||
                   'https';
  
  // Ensure protocol is valid
  const validProtocol = (protocol === 'http' || protocol === 'https') ? protocol : 'https';
  
  // Construct path with query string
  // event.path might be the full path or just the pathname
  let path = event.path || event.rawPath || '/';
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Add query string if present
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
    const queryString = new URLSearchParams(event.queryStringParameters).toString();
    path += '?' + queryString;
  }

  // Create a mock Node.js IncomingMessage
  const req = Object.create(IncomingMessage.prototype);
  req.method = event.httpMethod || 'GET';
  req.url = path;
  req.originalUrl = path; // Nitro uses originalUrl
  req.headers = { ...event.headers };
  // Set host header - Nitro's getRequestHost looks for this
  req.headers.host = validHost;
  // Set protocol header - Nitro's getRequestProtocol looks for this
  req.headers['x-forwarded-proto'] = validProtocol;
  
  // Add required properties for IncomingMessage
  req.httpVersion = '1.1';
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;
  req.socket = null;
  req.connection = null;
  
  // Handle body
  if (event.body) {
    const bodyStream = new Readable();
    bodyStream.push(event.body);
    bodyStream.push(null);
    req.body = bodyStream;
  }

  // Create a mock Node.js ServerResponse
  // Use Object.create to avoid setting read-only properties
  const res = Object.create(ServerResponse.prototype);
  res.req = req;
  res.statusCode = 200;
  res.statusMessage = 'OK';
  
  // Track state internally (don't set read-only properties)
  let _headersSent = false;
  let _finished = false;
  let responseBody = '';
  let statusCode = 200;
  const responseHeaders = {};

  // Override getters for read-only properties
  Object.defineProperty(res, 'headersSent', {
    get: () => _headersSent,
    configurable: true,
  });

  Object.defineProperty(res, 'finished', {
    get: () => _finished,
    configurable: true,
  });

  // Override write methods to capture response
  res.write = function(chunk, encoding, callback) {
    if (chunk) {
      responseBody += chunk.toString();
    }
    return true;
  };

  res.end = function(chunk, encoding, callback) {
    if (chunk) {
      responseBody += chunk.toString();
    }
    _finished = true;
    if (callback) callback();
  };

  res.writeHead = function(code, statusMessage, headersObj) {
    statusCode = code;
    if (typeof statusMessage === 'object') {
      headersObj = statusMessage;
    }
    if (headersObj) {
      Object.assign(responseHeaders, headersObj);
    }
    res.statusCode = code;
    res.statusMessage = statusMessage || 'OK';
    _headersSent = true;
    return res;
  };

  res.setHeader = function(name, value) {
    responseHeaders[name] = value;
    return res;
  };

  res.getHeader = function(name) {
    return responseHeaders[name];
  };

  res.removeHeader = function(name) {
    delete responseHeaders[name];
    return res;
  };

  // Create H3 event from Node.js req/res
  // Nitro's createEvent function creates an H3 event with proper structure
  // If createEvent is not available, we need to create it manually
  let h3Event;
  if (nitroCreateEvent && typeof nitroCreateEvent === 'function') {
    try {
      h3Event = nitroCreateEvent(req, res);
    } catch (err) {
      // If createEvent fails, create H3 event manually
      console.warn('createEvent failed, creating H3 event manually:', err);
      h3Event = {
        node: { req, res },
        path: path.split('?')[0],
        method: req.method,
        headers: req.headers,
        url: path,
      };
    }
  } else {
    // Create H3 event manually
    h3Event = {
      node: { req, res },
      path: path.split('?')[0],
      method: req.method,
      headers: req.headers,
      url: path,
    };
  }

  // Call the Nitro handler
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 30000); // 30 second timeout

    res.on('finish', () => {
      clearTimeout(timeout);
      resolve();
    });
    
    res.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    try {
      // Call the Nitro handler with the H3 event
      const result = nitroHandler(h3Event);
      if (result && typeof result.then === 'function') {
        result.then(() => {
          if (!_finished) {
            res.end();
          }
        }).catch(reject);
      } else if (!_finished) {
        res.end();
      }
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });

  // Return Netlify function response
  return {
    statusCode,
    headers: responseHeaders,
    body: responseBody,
  };
};
