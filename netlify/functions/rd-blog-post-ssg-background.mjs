// netlify/functions/rd-blog-post-ssg-background.mjs
import axios from 'axios';

export async function handler(event, context) {
  try {
       
    // const { slug } = JSON.parse(event.body);
    const slug  = "ai-use-cases-parliament-ipu";
    console.log(slug)
    const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
    const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

    const response = await axios.post(
      `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/builds`,
      {
        clear_cache: false,
        context: 'production',
        env: {
          SLUG_TO_BUILD: slug,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}`,
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Build triggered successfully' }),
    };
  } catch (error) {
    console.error('Error triggering build:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to trigger build' }),
    };
  }
}