// Simple API endpoint that returns changing data for ISR testing
export default defineEventHandler(async (event) => {
  // Return current timestamp - this will change on each request
  return {
    timestamp: new Date().toISOString(),
    message: 'This data changes on each request',
    generatedAt: Date.now()
  }
})

