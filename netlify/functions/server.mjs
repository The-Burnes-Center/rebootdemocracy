// Netlify function wrapper for Nitro
// Based on Nuxt 4 ISR guide: https://dev.to/blamsa0mine/implementing-incremental-static-regeneration-isr-in-nuxt-4-the-complete-guide-2j7h
// Nitro's handler is already a Node.js listener, so we just need to convert Netlify events to Node.js req/res

import { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';

// Lazy load Nitro handler
let nitroHandler;

async function loadNitro() {
  if (!nitroHandler) {
    console.log('Loading Nitro handler from .output/server/server.mjs...');
    // Nitro generates server.mjs for Netlify preset that exports the handler
    const serverModule = await import('../../.output/server/server.mjs');
    console.log('Nitro module loaded, exports:', Object.keys(serverModule));
    nitroHandler = serverModule.default;
    if (!nitroHandler || typeof nitroHandler !== 'function') {
      throw new Error('Nitro handler not found or invalid');
    }
    console.log('Nitro handler loaded successfully, type:', typeof nitroHandler);
  }
  return nitroHandler;
}

export const handler = async (event, context) => {
  console.log('Netlify event received:', {
    path: event.path,
    rawPath: event.rawPath,
    httpMethod: event.httpMethod,
  });
  
  const nitroHandler = await loadNitro();
  
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
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Add query string
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
    const queryString = new URLSearchParams(event.queryStringParameters).toString();
    if (queryString && !path.includes('?')) {
      path += '?' + queryString;
    }
  }
  
  // Create full URL (Nitro needs this for URL parsing)
  const fullUrl = `${protocol}://${host}${path}`;
  
  // Create Node.js request object
  const req = Object.create(IncomingMessage.prototype);
  Object.assign(req, Readable.prototype);
  
  // Initialize readable state
  const tempReadable = new Readable();
  req._readableState = tempReadable._readableState;
  
  // Set request properties
  req.method = event.httpMethod || 'GET';
  req.url = fullUrl; // Full URL for Nitro's URL parsing
  req.originalUrl = path; // Path for routing
  req.path = path.split('?')[0];
  
  // Set headers (normalize to lowercase)
  const headers = {};
  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      headers[key.toLowerCase()] = value;
    }
  }
  req.headers = headers;
  req.headers.host = host;
  req.headers['x-forwarded-host'] = host;
  req.headers['x-forwarded-proto'] = protocol;
  
  // Set HTTP version
  req.httpVersion = '1.1';
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;
  
  // Set connection for protocol detection
  const connection = { encrypted: protocol === 'https' };
  Object.defineProperty(req, 'connection', {
    value: connection,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(req, 'socket', {
    value: connection,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  
  // Handle request body
  if (event.body) {
    const bodyString = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    const bodyBuffer = Buffer.from(bodyString, 'utf8');
    req.push(bodyBuffer);
    req.push(null);
  } else {
    req.push(null);
  }
  
  // Create Node.js response object
  const res = Object.create(ServerResponse.prototype);
  EventEmitter.call(res);
  Object.setPrototypeOf(res, EventEmitter.prototype);
  res.req = req;
  res.statusCode = 200;
  res.statusMessage = 'OK';
  
  // Track response state
  let _headersSent = false;
  let _finished = false;
  let responseBody = '';
  let statusCode = 200;
  const responseHeaders = {};
  
  // Define response properties
  Object.defineProperty(res, 'headersSent', {
    get: () => _headersSent,
    configurable: true,
  });
  
  Object.defineProperty(res, 'finished', {
    get: () => _finished,
    configurable: true,
  });
  
  // Implement response methods
  res.write = function(chunk, encoding, callback) {
    if (chunk) {
      const chunkStr = Buffer.isBuffer(chunk) ? chunk.toString(encoding || 'utf8') : chunk.toString();
      responseBody += chunkStr;
    }
    if (callback) {
      callback();
    }
    return true;
  };
  
  res.end = function(chunk, encoding, callback) {
    if (chunk) {
      const chunkStr = Buffer.isBuffer(chunk) ? chunk.toString(encoding || 'utf8') : chunk.toString();
      responseBody += chunkStr;
    }
    if (!_finished) {
      _finished = true;
      _headersSent = true;
      res.emit('finish');
    }
    if (callback) {
      callback();
    }
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
  
  // Call Nitro handler and wait for response
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('Request timeout after 30 seconds');
      if (!_finished) {
        res.end();
      }
      reject(new Error('Request timeout'));
    }, 30000);
    
    res.on('finish', () => {
      clearTimeout(timeout);
      console.log('Response finished, body length:', responseBody.length, 'status:', statusCode);
      resolve({
        statusCode,
        headers: responseHeaders,
        body: responseBody,
      });
    });
    
    res.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    
    try {
      // Call Nitro handler - it's a Node.js listener
      nitroHandler(req, res);
    } catch (err) {
      console.error('Handler threw error:', err);
      clearTimeout(timeout);
      if (!_finished) {
        res.end();
      }
      reject(err);
    }
  });
};
