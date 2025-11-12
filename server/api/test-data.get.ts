/**
 * Test Data API Endpoint
 * 
 * This endpoint returns dynamic data that changes on each request.
 * It's used by the ISR test page to demonstrate that API data is
 * fetched during SSR and cached with the page.
 * 
 * The data includes:
 * - A timestamp of when the data was generated
 * - A random quote or message
 * - A random number
 * 
 * This endpoint is called during SSR, so the data is embedded in
 * the cached page. When the page is regenerated (after cache purge),
 * this endpoint is called again and new data is fetched.
 * 
 * Usage:
 * GET /api/test-data
 * 
 * Returns:
 * {
 *   timestamp: "2024-11-12T12:34:56.789Z",
 *   message: "Random message",
 *   randomValue: 1234
 * }
 */
export default defineEventHandler(async (event) => {
  // Generate dynamic data that changes on each request
  const timestamp = new Date().toISOString()
  
  // Random messages to show data changes
  const messages = [
    "The future belongs to those who believe in the beauty of their dreams.",
    "It is during our darkest moments that we must focus to see the light.",
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The only impossible journey is the one you never begin.",
    "In the middle of difficulty lies opportunity.",
    "Life is what happens to you while you're busy making other plans.",
    "The way to get started is to quit talking and begin doing.",
  ]
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]
  const randomValue = Math.floor(Math.random() * 10000)
  
  // Log when this endpoint is called (useful for debugging)
  console.log(`[API] Test data generated at ${timestamp} with value ${randomValue}`)
  
  return {
    timestamp,
    message: randomMessage,
    randomValue,
    generatedAt: new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'medium'
    })
  }
})

