#!/usr/bin/env node
// Test the endpoint directly
const BASE_URL = process.argv[2] || 'http://localhost:8888';
const url = `${BASE_URL}/api/blog/revalidate`;

console.log('Testing:', url);

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ blogIds: [28150] })
})
  .then(async (res) => {
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    console.log('Response:', text.substring(0, 300));
    
    if (res.status === 200 || res.status === 202) {
      try {
        const data = JSON.parse(text);
        if (data.success) {
          console.log('\n✅ SUCCESS!');
          process.exit(0);
        }
      } catch (e) {
        // Not JSON
      }
    }
    console.log('\n❌ FAILED');
    process.exit(1);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
