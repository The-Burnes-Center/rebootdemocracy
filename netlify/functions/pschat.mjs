const weaviate = require('weaviate-ts-client');
const { OpenAI } = require("openai");

// Setup weaviate client with fallbacks
const weaviateClient = weaviate.client({
  scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https',
  host: process.env.VITE_WEAVIATE_HOST || 'your-weaviate-cluster-url.weaviate.network',
  apiKey: new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY),
  headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY }
});

// Setup OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

async function searchChunksWithReferences(query) {
  console.log('Searching for:', query);
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

  try {
    // First, try a simple nearText search without any where clause
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

    console.log("No results found with nearText, falling back to basic search");

    // If nearText fails, try a basic search without using any potentially problematic operators
    const basicQuery = weaviateClient.graphql
      .get()
      .withClassName("RagDocumentChunk")
      .withFields(searchFields)
      .withLimit(10);

    const basicResults = await basicQuery.do();

    if (basicResults.data.Get.RagDocumentChunk && basicResults.data.Get.RagDocumentChunk.length > 0) {
      // If we get results, filter them client-side
      return basicResults.data.Get.RagDocumentChunk.filter(chunk => 
        chunk.compressedContent && (
          chunk.compressedContent.toLowerCase().includes(query.toLowerCase()) ||
          chunk.title.toLowerCase().includes(query.toLowerCase())
        )
      );
    }

    // If we still don't have results, return an empty array
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

function limitMostRelevantSiblingChunks(results, limit = 2) {
  if (!results || !Array.isArray(results)) {
    return [];
  }
  return results.map(chunk => {
    if (!chunk) return null;
    const safeChunk = { ...chunk };
    if (safeChunk.mostRelevantSiblingChunks && Array.isArray(safeChunk.mostRelevantSiblingChunks)) {
      safeChunk.mostRelevantSiblingChunks = safeChunk.mostRelevantSiblingChunks
        .filter(sibling => sibling != null)
        .slice(0, limit);
    } else {
      safeChunk.mostRelevantSiblingChunks = [];
    }
    return safeChunk;
  }).filter(chunk => chunk != null);
}

// Updated formatSearchResults function
function formatSearchResults(results) {
  if (!results || results.length === 0) {
    return "No specific information found in the database.";
  }
  return results.map(chunk => `
    Title: ${chunk.title || 'N/A'}
    Content: ${chunk.compressedContent ? chunk.compressedContent.substring(0, 150) + '...' : 'N/A'}
    Relevance: ${chunk.relevanceEloRating || 'N/A'}
    Quality: ${chunk.qualityEloRating || 'N/A'}
    Source: ${chunk.inDocument && chunk.inDocument[0] ? `${chunk.inDocument[0].title || 'N/A'} (${chunk.inDocument[0].url || 'N/A'})` : 'N/A'}
  `.trim()).join('\n\n');
}

// Function handler compatible with Netlify Functions
async function functionHandler(event, context) {
  console.log('Function invoked');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log('Received event body:', event.body);

  try {
    const { message, conversation } = JSON.parse(event.body);
    
    console.log('Parsed message:', message);
    console.log('Conversation length:', conversation?.length || 0);

    const searchResults = await searchChunksWithReferences(message);
    console.log('Search results received:', searchResults?.length || 0);

    const limitedResults = limitMostRelevantSiblingChunks(searchResults);
    const formattedResults = formatSearchResults(limitedResults);

    // Construct the OpenAI messages array
    const messages = [];

    // Add the updated system message
    const systemMessage = `You are the Rebooting Democracy chatbot, a friendly AI that helps users find information from a large database of documents.

Instructions:
- The user will ask a question, we will search a large database in a vector store and bring information connected to the user question into your <CONTEXT_TO_ANSWER_USERS_QUESTION_FROM> to provide a thoughtful answer from.
- If not enough information is available, you can ask the user for more information.
- Never provide information that is not backed by your context or is common knowledge.
- Look carefully at all in your context before you present the information to the user.
- Be optimistic and cheerful but keep a professional nordic style of voice.
- For longer outputs use bullet points and markdown to make the information easy to read.
- Do not reference your contexts and the different document sources just provide the information based on those sources.
- For all document sources we will provide the user with those you do not need to link or reference them.
- If there are inline links in the actual document chunks, you can provide those to the user in a markdown link format.
- Use markdown to format your answers, always use formatting so the response comes alive to the user.
- Keep your answers short and to the point except when the user asks for detail.
`;

    messages.push({ role: "system", content: systemMessage });

    // Map conversation messages to OpenAI messages
    // Exclude the last placeholder bot message
    if (conversation && Array.isArray(conversation)) {
      const mappedConversation = conversation.slice(0, -1).map(msg => {
        if (msg.type === 'user') {
          return { role: 'user', content: msg.content };
        } else if (msg.type === 'bot') {
          return { role: 'assistant', content: msg.content };
        }
        return null;
      }).filter(msg => msg != null);

      messages.push(...mappedConversation);
    }

    // Add the latest user message with context
    const userMessageContent = `<LATEST_USER_QUESTION>
Question: ${message}
</LATEST_USER_QUESTION>

<CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>
${formattedResults}
</CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>

Your thoughtful answer in markdown:
`;

    messages.push({ role: 'user', content: userMessageContent });

    console.log('Sending request to OpenAI...');

    // Non-streaming version for compatibility
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 2048,
      temperature: 0.0,
    });

    console.log('Received response from OpenAI');

    // Extract content from response
    const content = response.choices[0]?.message?.content || 'I could not generate a response.';

    // Prepare source documents for citation
    const sourceDocuments = limitedResults.length > 0 
      ? Array.from(new Map(limitedResults.map(result => {
          const doc = result.inDocument && result.inDocument[0];
          return [
            doc ? doc.url : 'N/A',
            {
              title: doc ? doc.title : 'N/A',
              url: doc ? doc.url : 'N/A'
            }
          ];
        })).values())
      : [];

    // Format response as SSE-compatible string
    const eventData = [
      `data: ${JSON.stringify({ content })}\n\n`,
      `data: ${JSON.stringify({ sourceDocuments })}\n\n`,
      `data: [DONE]\n\n`
    ].join('');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: eventData
    };

  } catch (error) {
    console.error('Error processing message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred processing your message' })
    };
  }
}

// Export for Netlify Functions
exports.handler = functionHandler;

// Also export as named export for local server route
module.exports = {
  handler: functionHandler
};