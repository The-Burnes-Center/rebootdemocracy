export default defineEventHandler(async (event) => {
  // Simulate some dynamic data
  const timestamp = new Date().toISOString()
  
  return {
    message: 'This is ISR test data',
    timestamp,
    random: Math.floor(Math.random() * 1000)
  }
})
