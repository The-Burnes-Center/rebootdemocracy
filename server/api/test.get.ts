// Simple test endpoint to verify server routes work
export default defineEventHandler((event) => {
  return {
    success: true,
    message: 'Server route is working!',
    path: event.path,
    method: event.method,
  };
});

