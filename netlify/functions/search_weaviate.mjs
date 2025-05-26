import weaviate from 'weaviate-ts-client';
import { OpenAI } from "openai";

const weaviateClient = weaviate.client({
  scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https',
  host: process.env.VITE_WEAVIATE_HOST_ORIGINAL || 'your-weaviate-cluster-url.weaviate.network',
  apiKey: new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY),
  headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY }
});

const openaiClient = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

async function getBlogSlugsByEmbedding(query) {
  const searchFields = `
    title
    uncompressedContent
    shortSummary
    fullSummary
    _additional { id distance certainty }
    inDocument {
      ... on RagDocument {
        url
      }
    }
  `;

  try {
    // Perform a nearText search in Weaviate with a where clause
    const nearTextQuery = weaviateClient.graphql
      .get()
      .withClassName("RagDocumentChunk")
      .withFields(searchFields)
      .withNearText({
        concepts: [query],
        // Optional: adjust parameters like certainty or distance
        distance: 0.8,
        
      })
      .withWhere({
        path: ["inDocument", "RagDocument", "url"],
        operator: "Like",
        valueString: "https://rebootdemocracy.ai/blog%",
      })
      .withLimit(20); // Increase limit if needed

      

    const nearTextResults = await nearTextQuery.do();
    console.log(nearTextResults);
    if (
      nearTextResults.data.Get.RagDocumentChunk &&
      nearTextResults.data.Get.RagDocumentChunk.length > 0
    ) {
      // Extract slugs from the results
      const slugs = nearTextResults.data.Get.RagDocumentChunk
        .map((chunk) => {
          const url = chunk.inDocument[0]?.url;
          if (url && url.startsWith("https://rebootdemocracy.ai/blog/")) {
            // Extract the slug from the URL
            return url.replace("https://rebootdemocracy.ai/blog/", "").replace(/\/$/, "");
          }
          return null;
        })
        .filter((slug) => slug !== null);

      // Remove duplicate slugs
      const uniqueSlugs = [...new Set(slugs)];

      return uniqueSlugs;
    }

    console.log("No results found with nearText, falling back to basic search");

    // If nearText fails, perform a basic textual search with the same where clause
    const basicQuery = weaviateClient.graphql
      .get()
      .withClassName("RagDocumentChunk")
      .withFields(searchFields)
      .withWhere({
        path: ["inDocument", "RagDocument", "url"],
        operator: "Like",
        valueString: "https://rebootdemocracy.ai/blog%",
      })
      .withLimit(20); // Increase limit if needed

    const basicResults = await basicQuery.do();

    if (
      basicResults.data.Get.RagDocumentChunk &&
      basicResults.data.Get.RagDocumentChunk.length > 0
    ) {
      // Filter results client-side based on the query
      const filteredChunks = basicResults.data.Get.RagDocumentChunk.filter((chunk) =>
        chunk.uncompressedContent
          ?.toLowerCase()
          .includes(query.toLowerCase())
      );

      // Extract slugs from the filtered results
      const slugs = filteredChunks
        .map((chunk) => {
          const url = chunk.inDocument[0]?.url;
          if (url && url.startsWith("https://rebootdemocracy.ai/blog/")) {
            // Extract the slug from the URL
            return url.replace("https://rebootdemocracy.ai/blog/", "").replace(/\/$/, "");
          }
          return null;
        })
        .filter((slug) => slug !== null);

      // Remove duplicate slugs
      const uniqueSlugs = [...new Set(slugs)];

      return uniqueSlugs;
    }

    // Return an empty array if no results are found
    return [];
  } catch (err) {
    console.error("Error in getBlogSlugsByEmbedding:", err);
    if (err.response && err.response.errors) {
      console.error(
        "GraphQL Errors:",
        JSON.stringify(err.response.errors, null, 2)
      );
    }
    // Return an empty array instead of throwing an error
    return [];
  }
}

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { query } = JSON.parse(event.body);

  if (!query) {
    return { statusCode: 400, body: 'Bad Request: Missing "query" parameter' };
  }

  
  try {
    // console.log('Received query:', query);

    const slugs = await getBlogSlugsByEmbedding(query);
    console.log(slugs)

    return {
      statusCode: 200,
      body: JSON.stringify({ slugs }),
    };
  } catch (error) {
    console.error('Error processing query:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred processing your request' })
    };
  }
}