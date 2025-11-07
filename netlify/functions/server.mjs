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
  const host = event.headers?.host || 
               event.headers?.['x-forwarded-host'] || 
               event.headers?.['Host'] ||
               'localhost';
  const protocol = event.headers?.['x-forwarded-proto'] || 'https';
  
  // Construct path with query string
  let path = event.path || '/';
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
    const queryString = new URLSearchParams(event.queryStringParameters).toString();
    path += '?' + queryString;
  }

  // Create a mock Node.js IncomingMessage
  const req = Object.create(IncomingMessage.prototype);
  req.method = event.httpMethod || 'GET';
  req.url = path;
  req.headers = { ...event.headers };
  req.headers.host = host;
  
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
  // If createEvent is available, use it; otherwise create manually
  let h3Event;
  if (nitroCreateEvent && typeof nitroCreateEvent === 'function') {
    h3Event = nitroCreateEvent(req, res);
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
