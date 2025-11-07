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
 * and uses Nitro's toNodeListener to handle them.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import { URL } from 'url';

// Import the Nitro server handler
// The path is relative to the netlify/functions directory
// In Netlify's build environment, .output is in the project root
// This import is resolved during BUILD/BUNDLING, not at runtime
import nitroApp from '../../.output/server/server.mjs';
import { toNodeListener } from '../../.output/server/chunks/nitro/nitro.mjs';

// Convert Nitro app to Node.js listener
const nodeListener = toNodeListener(nitroApp);

// Netlify function handler
export const handler = async (event, context) => {
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

  // Create full URL
  const fullUrl = `${protocol}://${host}${path}`;
  
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
  const res = Object.create(ServerResponse.prototype);
  res.req = req;
  res.statusCode = 200;
  res.statusMessage = 'OK';
  res.headers = {};
  res.headersSent = false;
  res.finished = false;
  
  let responseBody = '';
  let statusCode = 200;
  const responseHeaders = {};

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
    res.finished = true;
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
    res.headersSent = true;
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

  // Call the Node.js listener
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
      nodeListener(req, res);
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
