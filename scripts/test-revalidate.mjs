#!/usr/bin/env node

/**
 * Test script for the /api/blog/revalidate endpoint
 * 
 * Usage:
 *   Local: node scripts/test-revalidate.mjs
 *   Production: node scripts/test-revalidate.mjs --url https://your-site.netlify.app
 */

const BASE_URL = process.argv.includes('--url') 
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:8888';

const TEST_BLOG_ID = process.argv.includes('--id')
  ? process.argv[process.argv.indexOf('--id') + 1]
  : '28150';

async function testRevalidate() {
  const url = `${BASE_URL}/api/blog/revalidate`;
  
  console.log('🧪 Testing revalidate endpoint...');
  console.log(`📍 URL: ${url}`);
  console.log(`📝 Blog ID: ${TEST_BLOG_ID}`);
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blogIds: [TEST_BLOG_ID]
      })
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${contentType}`);
    console.log('');

    if (isJson) {
      const data = await response.json();
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
    } else {
      const text = await response.text();
      const preview = text.substring(0, 500);
      
      console.log('❌ Response (HTML/Text):');
      console.log(preview);
      if (text.length > 500) {
        console.log('... (truncated)');
      }
      console.log('');
      console.log('❌ ERROR: Endpoint returned HTML instead of JSON!');
      console.log('   This means the endpoint is not being handled by the serverless function.');
      console.log('   The catch-all redirect is likely catching /api/* routes.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('This could mean:');
    console.error('  1. The server is not running (for local testing)');
    console.error('  2. The URL is incorrect');
    console.error('  3. There is a network error');
    process.exit(1);
  }
}

testRevalidate();

