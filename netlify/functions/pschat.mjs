import weaviate from 'weaviate-ts-client';
import { OpenAI } from "openai";

const weaviateClient = weaviate.client({
  scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https',
  host: process.env.VITE_WEAVIATE_HOST || 'your-weaviate-cluster-url.weaviate.network',
  apiKey: new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY),
  headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY }
});

const openaiClient = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

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
  
  // Updated handler function
  export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
  
    const { message } = JSON.parse(event.body);
  
    try {
      console.log('Received message:', message);
  
      const searchResults = await searchChunksWithReferences(message);
    //   console.log('Search results:', JSON.stringify(searchResults, null, 2));
  
      const limitedResults = limitMostRelevantSiblingChunks(searchResults);
    //   console.log('Limited results:', JSON.stringify(limitedResults, null, 2));
  
      const formattedResults = formatSearchResults(limitedResults);
      //console.log('Formatted results:', formattedResults);
  
      const messages = [
        { role: "system", content: "You are the Rebooting Democracy chatbot, a friendly AI that helps users find information from a large database of documents. Use the following information to answer the user's question. Be concise and accurate. If no specific information is found, provide a general answer based on your knowledge." },
        { role: "user", content: `Question: ${message}\n\nContext:\n${formattedResults}\n\nYour thoughtful answer:` }
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
  
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        context.res.body += `data: ${JSON.stringify({ content })}\n\n`;
        await new Promise(resolve => context.awsRequestId ? resolve() : context.awsLambda.context.succeed(context.res));
      }
  
      // Send the source documents as the final message
      const sourceDocuments = limitedResults.length > 0 ? limitedResults.map(result => ({
        title: result.inDocument && result.inDocument[0] ? result.inDocument[0].title : 'N/A',
        url: result.inDocument && result.inDocument[0] ? result.inDocument[0].url : 'N/A'
      })) : [];
    //   console.log('Source documents:', JSON.stringify(sourceDocuments, null, 2));
      context.res.body += `data: ${JSON.stringify({ sourceDocuments })}\n\n`;
      context.res.body += `data: [DONE]\n\n`;
      
      console.log('Results:',context.res);
      return context.res;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'An error occurred processing your message' })
      };
    }
  }