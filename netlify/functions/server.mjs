// Simple Netlify function wrapper for Nitro
// This imports Nitro's handler and converts Netlify events to Node.js req/res

import { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';

// Lazy load Nitro handler
let nitroHandler;

async function loadNitro() {
  if (!nitroHandler) {
    const nitroModule = await import('../../.output/server/server.mjs');
    nitroHandler = nitroModule.default;
  }
  return nitroHandler;
}

export const handler = async (event, context) => {
  const nitroHandler = await loadNitro();
  
  // Get host and protocol from event
  const host = event.headers?.host || 
               event.headers?.['x-forwarded-host'] || 
               'localhost';
  const protocol = event.headers?.['x-forwarded-proto'] || 
                   event.headers?.['x-forwarded-protocol'] || 
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
  
  // Create full URL for req.url (Nitro needs this)
  const fullUrl = `${protocol}://${host}${path}`;
  
  // Create minimal Node.js request object
  const req = Object.create(IncomingMessage.prototype);
  Object.assign(req, Readable.prototype);
  
  // Initialize readable state
  const tempReadable = new Readable();
  req._readableState = tempReadable._readableState;
  
  // Set request properties
  req.method = event.httpMethod || 'GET';
  req.url = fullUrl; // Full URL for Nitro
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
  req.connection = connection;
  req.socket = connection;
  
  // Handle request body
  if (event.body) {
    const bodyString = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    const bodyBuffer = Buffer.from(bodyString, 'utf8');
    req.push(bodyBuffer);
    req.push(null);
  } else {
    req.push(null);
  }
  
  // Create minimal Node.js response object
  const res = Object.create(ServerResponse.prototype);
  // Properly initialize EventEmitter
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
  res.write = function(chunk) {
    if (chunk) {
      responseBody += chunk.toString();
    }
    return true;
  };
  
  res.end = function(chunk) {
    if (chunk) {
      responseBody += chunk.toString();
    }
    if (!_finished) {
      _finished = true;
      _headersSent = true;
      // Emit finish event immediately
      res.emit('finish');
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
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('Request timeout after 30 seconds');
      if (!_finished) {
        res.end();
      }
      reject(new Error('Request timeout'));
    }, 30000);
    
    res.on('finish', () => {
      clearTimeout(timeout);
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
      // Call Nitro handler - it's a Node.js listener that writes to res
      const result = nitroHandler(req, res);
      
      // If handler returns a promise, await it
      if (result && typeof result.then === 'function') {
        try {
          await result;
          // Handler promise resolved - check if response finished
          // If not, wait a bit more for async operations to complete
          await new Promise(resolve => setTimeout(resolve, 50));
          
          if (!_finished) {
            console.warn('Handler promise resolved but response not finished - ending manually');
            res.end();
          }
        } catch (err) {
          console.error('Handler promise rejected:', err);
          clearTimeout(timeout);
          if (!_finished) {
            res.end();
          }
          reject(err);
        }
      } else {
        // Handler is synchronous - give it a moment to finish
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (!_finished) {
          console.warn('Synchronous handler did not finish - ending manually');
          res.end();
        }
      }
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
