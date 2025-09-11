// No import needed for fetch in Node 18+
export const handler = async () => {
  const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL ||
    'https://api.netlify.com/build_hooks/68a37704c986d01a0c654ce2';

  try {
    const response = await fetch(buildHookUrl, { method: 'POST' });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Build triggered' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
