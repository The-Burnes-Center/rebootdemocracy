// File: reboot_democracy/rebootdemocracy/netlify/functions/blog_content_search.mjs

import weaviate from 'weaviate-ts-client';
import { OpenAI } from "openai";

// Initialize Weaviate client
const weaviateClient = weaviate.client({
  scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https',
  host: process.env.VITE_WEAVIATE_HOST || 'your-weaviate-cluster-url.weaviate.network',
  apiKey: new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY),
  headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY }
});

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

// Function to search chunks with references
async function searchChunksWithReferences(query) {
  const searchFields = `
    title
    chunkIndex
    chapterIndex
    compressedContent
    relevanceEloRating
    qualityEloRating
    substanceEloRating
    _additional { id distance certainty }
    inDocument {
      ... on RagDocument {
        title
        url
        shortDescription
      }
    }
    mostRelevantSiblingChunks {
      ... on RagDocumentChunk {
        title
        chapterIndex
        compressedContent
      }
    }
  `;

  console.log('query', query);

  try {
    // Perform a nearText search
    const nearTextQuery = weaviateClient.graphql
      .get()
      .withClassName("RagDocumentChunk")
      .withFields(searchFields)
      .withNearText({ concepts: [query] })
      .withLimit(10);

    const nearTextResults = await nearTextQuery.do();

    if (nearTextResults.data.Get.RagDocumentChunk && nearTextResults.data.Get.RagDocumentChunk.length > 0) {
      return nearTextResults.data.Get.RagDocumentChunk;
    }

    console.log("No results found with nearText, returning empty array.");

    return [];

  } catch (err) {
    console.error("Error in searchChunksWithReferences:", err);
    if (err.response && err.response.errors) {
      console.error("GraphQL Errors:", JSON.stringify(err.response.errors, null, 2));
    }
    // In case of error, return an empty array instead of throwing
    return [];
  }
}

// Function to format search results
function formatSearchResults(results) {
  if (!results || results.length === 0) {
    return "No specific information found in the database.";
  }
  return results.map(chunk => `
    Title: ${chunk.title || 'N/A'}
    Content: ${chunk.compressedContent ? chunk.compressedContent.substring(0, 150) + '...' : 'N/A'}
    Source: ${chunk.inDocument && chunk.inDocument[0] ? `${chunk.inDocument[0].title || 'N/A'} (${chunk.inDocument[0].url || 'N/A'})` : 'N/A'}
  `.trim()).join('\n\n');
}

// Netlify handler function
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log('Received event:', event);
  console.log('Received event body:', event.body);

  let message;
  try {
    ({ message } = JSON.parse(event.body || '{}'));
    if (!message) {
      throw new Error('No message provided in request body.');
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body or missing message parameter.' }),
    };
  }

  try {
    console.log('Received message:', message);

    const searchResults = await searchChunksWithReferences(message);

    const formattedResults = formatSearchResults(searchResults);

    // Construct the OpenAI messages array
    const messages = [];

    // Adjusted system message and instructions
    const systemMessage = `You are an assistant that provides detailed information based on the user's query by leveraging a database of documents.

Instructions:
- Use the context provided in <CONTEXT_TO_ANSWER_USERS_QUESTION_FROM> to generate a comprehensive and informative answer to the user's question.
- Do not mention the context directly; instead, seamlessly integrate the information into your response.
- If no context is provided in <CONTEXT_TO_ANSWER_USERS_QUESTION_FROM> refer the user to the search results below on this page.
- Do not ask the user for more information.
- Use markdown formatting to enhance readability, including bullet points, headings, and links where appropriate.
- Keep your tone professional and informative.
`;

    messages.push({ role: "system", content: systemMessage });

    // Add the user message with context
    const userMessageContent = `<LATEST_USER_QUESTION>
Question: ${message}
</LATEST_USER_QUESTION>

<CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>
${formattedResults}
</CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>

Your comprehensive answer in markdown:
`;

messages.push({ role: 'user', content: userMessageContent });

// Proceed with generating the response
const stream = await openaiClient.chat.completions.create({
  model: "gpt-4o",
  messages,
  max_tokens: 2048,
  temperature: 0.0,
  stream: true,
});

// Set up streaming response
context.res = {
  statusCode: 200,
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  },
  body: ''
};

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  context.res.body += `data: ${JSON.stringify({ content })}\n\n`;
  await new Promise(resolve => context.awsRequestId ? resolve() : context.awsLambda.context.succeed(context.res));
}

context.res.body += `data: [DONE]\n\n`;

console.log('Results:', context.res);
return context.res;

} catch (error) {
console.error('Error processing message:', error);
return {
  statusCode: 500,
  body: JSON.stringify({ error: 'An error occurred processing your message' })
};
}
}