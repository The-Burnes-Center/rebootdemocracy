import weaviate from 'weaviate-ts-client';
import { OpenAI } from "openai";
import axios from 'axios';


const weaviateClient = weaviate.client({
  scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https',
  host: process.env.VITE_WEAVIATE_HOST,
  apiKey: new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY),
  headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY }
});

const openaiClient = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

const mainStreamingSystemPrompt = `You are the Rebooting Democracy chatbot a friendly AI that helps users find information from a large database of documents.

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

const mainStreamingUserPrompt = (latestQuestion, context) => `<LATEST_USER_QUESTION>
${latestQuestion}</LATEST_USER_QUESTION>

<CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>
${context}
</CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>

Your thoughtful answer in markdown:
`;

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
          _additional { id }
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
  
  async function saveAnswerToWeaviate(question, answer, sourceDocuments, retrievalContext) {
    try {
      const result = await weaviateClient.data
        .creator()
        .withClassName('RDChatbotAnswer')
        .withProperties({
          question: question,
          answer: answer,
          timestamp: new Date().toISOString(),
          sourceDocuments: sourceDocuments.map(doc => ({
            beacon: `weaviate://localhost/RagDocument/${doc.id}`
          })),
          retrievalContext: retrievalContext,
          // evaluationResults will be added later, so we'll leave it out for now
        })
        .do();
      console.log('Answer saved to Weaviate:', result);
      return result.id; // Return the ID of the created object
    } catch (error) {
      console.error('Error saving answer to Weaviate:', error);
    }
  }

  import { URL } from 'url';

async function deepEvaluateUserRequest(entryIndex) {
    console.log('CHATBOT_SERVER_URL:', process.env.CHATBOT_SERVER_URL);
    const baseUrl = new URL(process.env.CHATBOT_SERVER_URL);
    const webhookUrl = new URL('/webhook/hooks/eval-users', baseUrl).toString();
    console.log('Webhook URL:', webhookUrl);
    
    const data = {
        entry_key: entryIndex,
        message: 'message send'
    };
    try {
        const response = await axios.post(webhookUrl, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log('Webhook triggered successfully:', response.data);
        
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const responseData = await response.json();
        console.log('Webhook triggered successfully:', responseData);
    }
    catch (error) {
        console.error('Error triggering webhook:', error);
        console.error('Error details:', error.response ? error.response.data : error.message);
        if (error.cause) {
            console.error('Error cause:', error.cause);
        }
    }
}
  
  export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
  
    const { message } = JSON.parse(event.body);
  
    try {
      console.log('Received message:', message);
  
      const searchResults = await searchChunksWithReferences(message);
      const limitedResults = limitMostRelevantSiblingChunks(searchResults);
      const formattedResults = formatSearchResults(limitedResults);
  
      const messages = [
        { role: "system", content: mainStreamingSystemPrompt },
        { role: "user", content: mainStreamingUserPrompt(message, formattedResults) }
      ];
  
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
  
      let fullAnswer = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullAnswer += content;
        context.res.body += `data: ${JSON.stringify({ content })}\n\n`;
        await new Promise(resolve => context.awsRequestId ? resolve() : context.awsLambda.context.succeed(context.res));
      }
  
      const sourceDocuments = limitedResults.length > 0 
      ? limitedResults.map(result => {
          const doc = result.inDocument && result.inDocument[0];
          return {
            id: doc ? doc._additional.id : 'N/A',
            title: doc ? doc.title : 'N/A',
            url: doc ? doc.url : 'N/A'
          };
        })
      : [];
  
      context.res.body += `data: ${JSON.stringify({ sourceDocuments })}\n\n`;
      context.res.body += `data: [DONE]\n\n`;
  
      // Save the answer to Weaviate
      const answerId = await saveAnswerToWeaviate(message, fullAnswer, sourceDocuments, formattedResults);
      console.log('Answer ID:', answerId);
    //   await deepEvaluateUserRequest(answerId);

      // Prepare deepeval test case
      const deepevaltestCase = {
        query: message,
        actual_output: fullAnswer,
        retrieval_context: formattedResults,
        timestamp: new Date().toISOString()
      };
    
      // Here you would typically send this to your evaluation endpoint
      // For demonstration, we'll just log it
      console.log('Deepeval test case:', deepevaltestCase);
    
    //   console.log('Results:', context.res);
      return context.res;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'An error occurred processing your message' })
      };
    }
  }