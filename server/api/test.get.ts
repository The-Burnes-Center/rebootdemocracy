export default defineEventHandler((event) => {
  return {
    message: "API endpoint is working",
    timestamp: new Date().toISOString(),
  }
})

