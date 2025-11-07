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
import { EventEmitter } from 'events';

// Lazy load Nitro modules using dynamic import to avoid CommonJS/ESM bundling issues
let nitroHandler;
let createEvent;

async function loadNitro() {
  if (!nitroHandler) {
    // Import the Nitro server handler
    // The path is relative to the netlify/functions directory
    // In Netlify's build environment, .output is in the project root
    console.log('Loading Nitro handler from .output/server/server.mjs...');
    const nitroModule = await import('../../.output/server/server.mjs');
    console.log('Nitro module loaded, exports:', Object.keys(nitroModule));
    nitroHandler = nitroModule.default;
    console.log('Nitro handler loaded, type:', typeof nitroHandler, 'isFunction:', typeof nitroHandler === 'function');
    
    // Import createEvent from nitro chunks
    // createEvent is not exported, but we can access it via dynamic import
    const nitroChunks = await import('../../.output/server/chunks/nitro/nitro.mjs');
    // Try to access createEvent - it might be available in the module namespace
    // If not, we'll create an H3 event manually
    createEvent = nitroChunks.createEvent;
    console.log('createEvent available:', typeof createEvent === 'function');
  }
  return { nitroHandler, createEvent };
}

// Netlify function handler
export const handler = async (event, context) => {
  // Debug logging to understand the event structure
  console.log('Netlify event received:', {
    path: event.path,
    rawPath: event.rawPath,
    httpMethod: event.httpMethod,
    headers: event.headers ? Object.keys(event.headers) : null,
    queryStringParameters: event.queryStringParameters,
  });
  
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
  // Netlify Functions 2.0 uses event.rawPath, older versions use event.path
  let path = event.rawPath || event.path || '/';
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Don't sanitize the path - Nitro will handle it
  // The path should be a valid URL path (starts with /, can have query string)
  // Nitro's getRequestURL normalizes the path, so we don't need to sanitize it
  
  // Add query string if present
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
    const queryString = new URLSearchParams(event.queryStringParameters).toString();
    if (queryString) {
      path += '?' + queryString;
    }
  }
  
  // Validate that path is valid for URL construction
  // Path should be a valid URL path (starts with /, can have query string)
  if (!path || path === '') {
    path = '/';
  }
  
  // Debug logging for URL construction
  console.log('URL construction values:', {
    path,
    validHost,
    validProtocol,
    baseUrl: `${validProtocol}://${validHost}`,
  });

  // Create a mock Node.js IncomingMessage
  // IncomingMessage extends Readable, so we need to ensure it's properly initialized
  const req = Object.create(IncomingMessage.prototype);
  // Mix in Readable prototype methods to ensure stream functionality
  Object.assign(req, Readable.prototype);
  // Initialize Readable stream state by creating a new state object
  // We can't just copy _readableState because it's a reference
  // Instead, we'll create a minimal state object
  const tempReadable = new Readable();
  req._readableState = {
    ...tempReadable._readableState,
    objectMode: false,
    highWaterMark: 16384,
    buffer: [],
    length: 0,
    pipes: null,
    pipesCount: 0,
    flowing: null,
    ended: false,
    endEmitted: false,
    reading: false,
    sync: true,
    needReadable: false,
    emittedReadable: false,
    readableListening: false,
    resumeScheduled: false,
    paused: false,
    autoDestroy: true,
    destroyed: false,
    errored: null,
    closed: false,
    closeEmitted: false,
    defaultEncoding: 'utf8',
    allowHalfOpen: true,
  };
  req.method = event.httpMethod || 'GET';
  req.url = path;
  req.originalUrl = path; // Nitro uses originalUrl
  
  // Normalize headers to lowercase (Node.js headers are case-insensitive but Nitro expects lowercase)
  const normalizedHeaders = {};
  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      normalizedHeaders[key.toLowerCase()] = value;
    }
  }
  req.headers = normalizedHeaders;
  
  // Set host header - Nitro's getRequestHost looks for lowercase 'host'
  req.headers.host = validHost;
  // Set x-forwarded-host header - Nitro's getRequestHost with xForwardedHost: true checks this first
  req.headers['x-forwarded-host'] = validHost;
  // Set protocol header - Nitro's getRequestProtocol looks for lowercase 'x-forwarded-proto'
  req.headers['x-forwarded-proto'] = validProtocol;
  
  // Debug: Verify headers are set correctly
  console.log('Request headers set:', {
    host: req.headers.host,
    'x-forwarded-host': req.headers['x-forwarded-host'],
    'x-forwarded-proto': req.headers['x-forwarded-proto'],
    connectionEncrypted: req.connection?.encrypted,
  });
  
  // Test URL construction to catch errors early
  try {
    const testUrl = new URL(path, `${validProtocol}://${validHost}`);
    console.log('URL construction test successful:', testUrl.href);
  } catch (err) {
    console.error('URL construction test failed:', err.message, {
      path,
      protocol: validProtocol,
      host: validHost,
      baseUrl: `${validProtocol}://${validHost}`,
    });
    throw err;
  }
  
  // Add required properties for IncomingMessage
  req.httpVersion = '1.1';
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;
  
  // Create a mock connection object for protocol detection
  // Nitro's getRequestProtocol checks req.connection?.encrypted
  // We need to ensure the connection object is properly set and accessible
  const mockConnection = {
    encrypted: validProtocol === 'https',
  };
  
  // Set both socket and connection to the same mock object
  // Some code paths check req.socket, others check req.connection
  req.socket = mockConnection;
  req.connection = mockConnection;
  
  // Ensure the connection object is properly accessible
  // Use Object.defineProperty to make it non-configurable and ensure it's read correctly
  Object.defineProperty(req, 'connection', {
    value: mockConnection,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  
  Object.defineProperty(req, 'socket', {
    value: mockConnection,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  
  // Handle body - H3's readBody reads from the request stream itself
  // We need to make the request readable by pushing data to it
  // Push data synchronously but ensure stream is ready
  if (event.body) {
    // Convert body to string if it's not already
    const bodyString = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    // Also set content-length header if not already set
    if (!req.headers['content-length']) {
      req.headers['content-length'] = String(Buffer.byteLength(bodyString, 'utf8'));
    }
    // Ensure stream is in the right state before pushing
    // Reset stream state to ensure it's ready to be read
    if (req._readableState) {
      req._readableState.ended = false;
      req._readableState.endEmitted = false;
      req._readableState.reading = false;
      req._readableState.flowing = null;
    }
    // Push data to the stream
    const bodyBuffer = Buffer.from(bodyString, 'utf8');
    req.push(bodyBuffer);
    // Emit 'readable' event so H3's readBody knows data is available
    if (req._readableState && !req._readableState.reading) {
      req._readableState.needReadable = false;
      req._readableState.emittedReadable = true;
      // Emit readable event
      if (typeof req.emit === 'function') {
        req.emit('readable');
      }
    }
    req.push(null); // Signal end of stream
  } else {
    // No body - signal end of stream immediately
    req.push(null);
  }

  // Create a mock Node.js ServerResponse
  // Use Object.create to avoid setting read-only properties
  // ServerResponse extends OutgoingMessage extends Stream extends EventEmitter
  // So Object.create(ServerResponse.prototype) should give us EventEmitter methods
  const res = Object.create(ServerResponse.prototype);
  // Ensure EventEmitter methods are available by mixing in the prototype
  // This ensures we can emit events even if the prototype chain isn't fully initialized
  Object.assign(res, EventEmitter.prototype);
  // Initialize EventEmitter instance state by creating a temporary instance
  // and copying its internal state (event listeners array, etc.)
  const tempEmitter = new EventEmitter();
  // Copy the internal event emitter state
  res._events = tempEmitter._events || {};
  res._eventsCount = tempEmitter._eventsCount || 0;
  res._maxListeners = tempEmitter._maxListeners || EventEmitter.defaultMaxListeners;
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
    // Emit 'finish' event so the promise resolves
    // Use setImmediate to ensure this happens after any synchronous operations
    setImmediate(() => {
      res.emit('finish');
    });
    if (callback) callback();
    return res;
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
  // IMPORTANT: The url property should be the full URL, not just the path
  // Nitro's getRequestURL might call new URL() with just the path, which fails
  const fullUrl = `${validProtocol}://${validHost}${path}`;
  
  let h3Event;
  if (nitroCreateEvent && typeof nitroCreateEvent === 'function') {
    try {
      h3Event = nitroCreateEvent(req, res);
      // Ensure the URL is set to the full URL
      if (h3Event) {
        h3Event.url = fullUrl;
      }
      console.log('H3 event created successfully via createEvent');
    } catch (err) {
      // If createEvent fails, create H3 event manually
      console.warn('createEvent failed, creating H3 event manually:', err);
      h3Event = {
        node: { req, res },
        path: path.split('?')[0],
        method: req.method,
        headers: req.headers,
        url: fullUrl, // Use full URL instead of just path
      };
    }
  } else {
    // Create H3 event manually
    console.log('createEvent not available, creating H3 event manually');
    h3Event = {
      node: { req, res },
      path: path.split('?')[0],
      method: req.method,
      headers: req.headers,
      url: fullUrl, // Use full URL instead of just path
    };
  }
  
  // Debug: Check what getRequestHost and getRequestProtocol would return
  console.log('H3 event created:', {
    hasNode: !!h3Event.node,
    hasReq: !!h3Event.node?.req,
    hasRes: !!h3Event.node?.res,
    reqHost: h3Event.node?.req?.headers?.host,
    reqXForwardedHost: h3Event.node?.req?.headers?.['x-forwarded-host'],
    reqProto: h3Event.node?.req?.headers?.['x-forwarded-proto'],
    reqConnection: h3Event.node?.req?.connection,
    path: h3Event.path,
    url: h3Event.url, // Should be full URL now
    fullUrl: fullUrl, // The full URL we constructed
  });

  // Call the Nitro handler
  // Wrap in try-catch to handle any synchronous errors
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Request timeout after 30 seconds');
        if (!_finished) {
          res.end();
        }
        reject(new Error('Request timeout'));
      }, 30000); // 30 second timeout

      res.on('finish', () => {
        clearTimeout(timeout);
        console.log('Response finished');
        resolve();
      });
      
      res.on('error', (err) => {
        clearTimeout(timeout);
        console.error('Response error:', err);
        reject(err);
      });

      // Call the Nitro handler with the H3 event
      console.log('Calling Nitro handler...');
      console.log('Nitro handler type:', typeof nitroHandler, 'isFunction:', typeof nitroHandler === 'function');
      
      if (!nitroHandler || typeof nitroHandler !== 'function') {
        const error = new Error('Nitro handler is not a function');
        console.error('Nitro handler error:', error);
        clearTimeout(timeout);
        reject(error);
        return;
      }
      
      try {
        console.log('About to call nitroHandler with h3Event:', {
          hasNode: !!h3Event.node,
          hasReq: !!h3Event.node?.req,
          hasRes: !!h3Event.node?.res,
          path: h3Event.path,
          url: h3Event.url,
        });
        const result = nitroHandler(h3Event);
        console.log('Nitro handler called, result type:', typeof result, 'isPromise:', result && typeof result.then === 'function');
        
        if (result && typeof result.then === 'function') {
          // Handler returned a promise
          result
            .then((response) => {
              console.log('Nitro handler promise resolved');
              if (!_finished) {
                res.end();
              }
            })
            .catch((err) => {
              console.error('Nitro handler promise rejected:', err);
              clearTimeout(timeout);
              reject(err);
            });
        } else {
          // Handler returned synchronously
          console.log('Nitro handler returned synchronously');
          if (!_finished) {
            res.end();
          }
        }
      } catch (err) {
        // Synchronous error from handler
        console.error('Nitro handler threw synchronous error:', err);
        clearTimeout(timeout);
        reject(err);
      }
    });
  } catch (err) {
    console.error('Error in handler wrapper:', err);
    // If we get here, the handler failed
    // Return an error response
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NETLIFY_DEV ? err.stack : undefined,
      }),
    };
  }

  // Return Netlify function response
  return {
    statusCode,
    headers: responseHeaders,
    body: responseBody,
  };
};
