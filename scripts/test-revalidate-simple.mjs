#!/usr/bin/env node
/**
 * Simple test script for the /api/blog/revalidate endpoint
 * 
 * Usage:
 *   Local: node scripts/test-revalidate-simple.mjs http://localhost:8888
 *   Production: node scripts/test-revalidate-simple.mjs https://your-site.netlify.app
 */

const BASE_URL = process.argv[2] || 'http://localhost:8888';
const url = `${BASE_URL}/api/blog/revalidate`;

console.log('🧪 Testing revalidate endpoint...');
console.log(`📍 URL: ${url}`);
console.log('');

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ blogIds: [28150] })
})
  .then(async (res) => {
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    console.log(`📊 Status: ${res.status} ${res.statusText}`);
    console.log(`📋 Content-Type: ${contentType}`);
    console.log('');
    
    const text = await res.text();
    
    if (isJson) {
      try {
        const data = JSON.parse(text);
        console.log('✅ Response (JSON):');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success) {
          console.log('');
          console.log('✅ SUCCESS: Endpoint is working correctly!');
      process.exit(0);
        } else {
          console.log('');
          console.log('⚠️  WARNING: Endpoint returned success: false');
          process.exit(1);
        }
      } catch (e) {
        console.log('❌ Response (Text):');
        console.log(text.substring(0, 500));
        console.log('');
        console.log('❌ ERROR: Response claims to be JSON but parsing failed');
        process.exit(1);
      }
    } else {
      console.log('❌ Response (HTML/Text):');
      console.log(text.substring(0, 500));
      if (text.length > 500) {
        console.log('... (truncated)');
      }
      console.log('');
      console.log('❌ ERROR: Endpoint returned HTML instead of JSON!');
      console.log('   This means the endpoint is not being handled by the serverless function.');
      console.log('   The catch-all redirect is likely catching /api/* routes.');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ ERROR:', err.message);
    console.error('');
    console.error('This could mean:');
    console.error('  1. The server is not running (for local testing)');
    console.error('  2. The URL is incorrect');
    console.error('  3. There is a network error');
    process.exit(1);
  });
