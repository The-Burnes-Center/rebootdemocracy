// Simple test POST endpoint
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return {
    success: true,
    message: 'POST endpoint is working!',
    received: body,
  };
});

