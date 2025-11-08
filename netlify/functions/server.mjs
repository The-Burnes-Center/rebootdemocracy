// Simple Netlify function wrapper for Nitro
// Based on Nuxt 4 ISR guide: https://dev.to/blamsa0mine/implementing-incremental-static-regeneration-isr-in-nuxt-4-the-complete-guide-2j7h

let nitroHandler;

async function loadNitro() {
  if (!nitroHandler) {
    const serverModule = await import('../../.output/server/server.mjs');
    nitroHandler = serverModule.default;
    if (!nitroHandler || typeof nitroHandler !== 'function') {
      throw new Error('Nitro handler not found');
    }
  }
  return nitroHandler;
}

export const handler = async (event, context) => {
  const nitroHandler = await loadNitro();
  
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
  
  // Use Node.js http module to create proper req/res
  const { IncomingMessage, ServerResponse } = await import('node:http');
  const { Readable } = await import('node:stream');
  const { EventEmitter } = await import('node:events');
  
  // Create request
  const req = Object.create(IncomingMessage.prototype);
  Object.assign(req, Readable.prototype);
  
  const tempReadable = new Readable();
  req._readableState = tempReadable._readableState;
  
  req.method = event.httpMethod || 'GET';
  req.url = fullUrl;
  req.originalUrl = path;
  req.path = path.split('?')[0];
  
  // Set headers
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
  
  req.httpVersion = '1.1';
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;
  
  const connection = { encrypted: protocol === 'https' };
  Object.defineProperty(req, 'connection', { value: connection, writable: false, enumerable: true, configurable: false });
  Object.defineProperty(req, 'socket', { value: connection, writable: false, enumerable: true, configurable: false });
  
  // Handle body
  if (event.body) {
    const bodyString = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    const bodyBuffer = Buffer.from(bodyString, 'utf8');
    req.push(bodyBuffer);
    req.push(null);
  } else {
    req.push(null);
  }
  
  // Create response
  const res = Object.create(ServerResponse.prototype);
  EventEmitter.call(res);
  Object.setPrototypeOf(res, EventEmitter.prototype);
  res.req = req;
  res.statusCode = 200;
  res.statusMessage = 'OK';
  
  // Track response
  let _finished = false;
  let responseBody = '';
  let statusCode = 200;
  const responseHeaders = {};
  
  Object.defineProperty(res, 'finished', {
    get: () => _finished,
    configurable: true,
  });
  
  Object.defineProperty(res, 'headersSent', {
    get: () => _finished,
    configurable: true,
  });
  
  res.write = function(chunk, encoding, callback) {
    if (chunk) {
      responseBody += Buffer.isBuffer(chunk) ? chunk.toString(encoding || 'utf8') : chunk.toString();
    }
    if (callback) callback();
    return true;
  };
  
  res.end = function(chunk, encoding, callback) {
    if (chunk) {
      responseBody += Buffer.isBuffer(chunk) ? chunk.toString(encoding || 'utf8') : chunk.toString();
    }
    if (!_finished) {
      _finished = true;
      res.emit('finish');
    }
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
      console.error('Request timeout after 30 seconds, body length:', responseBody.length);
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
      console.error('Response error:', err);
      reject(err);
    });
    
    try {
      // Call Nitro handler - it's a Node.js listener
      console.log('Calling Nitro handler...');
      nitroHandler(req, res);
      console.log('Nitro handler called, waiting for response...');
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
