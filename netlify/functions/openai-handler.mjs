import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, data } = JSON.parse(event.body);

    let response;
    switch (action) {
      case 'createThread':
        response = await openai.beta.threads.create();
        break;
      case 'sendMessage':
        response = await openai.beta.threads.messages.create(data.threadId, data.message);
        break;
      case 'createRun':
        response = await openai.beta.threads.runs.create(data.threadId, data.runData);
        break;
      case 'retrieveRun':
        response = await openai.beta.threads.runs.retrieve(data.threadId, data.runId);
        break;
      case 'submitToolOutputs':
        response = await openai.beta.threads.runs.submitToolOutputs(data.threadId, data.runId, data.toolOutputs);
        break;
      case 'listMessages':
        response = await openai.beta.threads.messages.list(data.threadId);
        break;
      default:
        return { statusCode: 400, body: 'Invalid action' };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
