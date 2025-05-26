// ... existing imports ...
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

const weeklyNewsItemFields = `
  directusId
  objectId
  title
  summary
  author
  date
  edition
  itemTitle
  itemDescription
  itemAuthor
  itemCategory
  itemDate
  itemPublication
  itemUrl
  itemImage
  _additional { id distance certainty }
`;

const blogPostChunkFields = `
  directusId
  objectId
  title
  excerpt
  content
  tags
  authors
  date
  slug
  fullUrl
  part
  audioFilename
  imageFilename
  imageId
  _additional { id distance certainty }
`;

async function searchWeaviate(className, fields, query) {
  try {
    const nearTextQuery = weaviateClient.graphql
      .get()
      .withClassName(className)
      .withFields(fields)
      .withNearText({
        concepts: [query],
        distance: 0.8,
      })
      .withLimit(20);

    const results = await nearTextQuery.do();
    return results.data.Get[className] || [];
  } catch (err) {
    console.error(`Error searching ${className}:`, err);
    return [];
  }
}

async function getCombinedResults(query) {
  // Search both classes in parallel
  const [weeklyNewsResults, blogPostResults] = await Promise.all([
    searchWeaviate('RebootWeeklyNewsItem', weeklyNewsItemFields, query),
    searchWeaviate('RebootBlogPostChunk', blogPostChunkFields, query)
  ]);

  // Extract unique URLs
  const weeklyNewsUrls = weeklyNewsResults
    .map(item => {
      if (item.edition) {
        return `https://rebootdemocracy.ai/newsthatcaughtoureye/${item.edition}`;
      }
      return null;
    })
    .filter(Boolean);

  const blogPostSlugs = blogPostResults
    .map(item => {
      // Prefer fullUrl if available, else use slug
      if (item.fullUrl) return item.fullUrl;
      if (item.slug) return `https://rebootdemocracy.ai/blog/${item.slug}`;
      return null;
    })
    .filter(Boolean);

  // Combine and deduplicate
  const allLinks = Array.from(new Set([...weeklyNewsUrls, ...blogPostSlugs]));
  console.log(allLinks)
  return allLinks;
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
    const links = await getCombinedResults(query);
    return {
      statusCode: 200,
      body: JSON.stringify({ links }),
    };
  } catch (error) {
    console.error('Error processing query:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred processing your request' })
    };
  }
}