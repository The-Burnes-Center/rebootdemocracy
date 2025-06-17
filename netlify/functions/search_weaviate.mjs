// ... existing imports ...
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

// ... existing code ...

// async function searchWeaviate(className, fields, query) {
//   // 1️⃣ Attempt fast keyword search (BM25)
//   try {
//     const bm25Query = weaviateClient.graphql
//       .get()
//       .withClassName(className)
//       .withFields(fields)
//       .withBm25({ query })
//       .withLimit(20);

//     const bm25Res = await bm25Query.do();
//     const bm25Hits = bm25Res?.data?.Get?.[className] ?? [];
//     if (bm25Hits.length > 0) {
//       return bm25Hits;
//     }
//   } catch (bm25Err) {
//     console.warn(`BM25 search failed for ${className}:`, bm25Err);
//   }

//   // 2️⃣ Fallback to semantic vector search
//   try {
//     const nearTextQuery = weaviateClient.graphql
//       .get()
//       .withClassName(className)
//       .withFields(fields)
//       .withNearText({
//         concepts: [query],
//         distance: 0.8,
//       })
//       .withLimit(20);

//     const vecRes = await nearTextQuery.do();
//     return vecRes?.data?.Get?.[className] ?? [];
//   } catch (vecErr) {
//     console.error(`nearText search failed for ${className}:`, vecErr);
//     return [];
//   }
// }

// ... existing code ...

// async function getCombinedResults(query) {
//   // Run both BM25 searches in parallel
//   const [bm25WeeklyNews, bm25BlogPosts] = await Promise.all([
//     searchWeaviateBM25('RebootWeeklyNewsItem', weeklyNewsItemFields, query),
//     searchWeaviateBM25('RebootBlogPostChunk', blogPostChunkFields, query)
//   ]);

//   // Prepare promises for nearText only if BM25 returned no results
//   const nearTextPromises = [];
//   if (bm25WeeklyNews.length === 0) {
//     nearTextPromises.push(
//       searchWeaviateNearText('RebootWeeklyNewsItem', weeklyNewsItemFields, query)
//     );
//   } else {
//     nearTextPromises.push(Promise.resolve([]));
//   }
//   if (bm25BlogPosts.length === 0) {
//     nearTextPromises.push(
//       searchWeaviateNearText('RebootBlogPostChunk', blogPostChunkFields, query)
//     );
//   } else {
//     nearTextPromises.push(Promise.resolve([]));
//   }

//   const [nearTextWeeklyNews, nearTextBlogPosts] = await Promise.all(nearTextPromises);

//   // Use BM25 results if present, otherwise use nearText results
//   const weeklyNewsResults = bm25WeeklyNews.length > 0 ? bm25WeeklyNews : nearTextWeeklyNews;
//   const blogPostResults = bm25BlogPosts.length > 0 ? bm25BlogPosts : nearTextBlogPosts;

//   // Tag results
//   const blogPosts = blogPostResults.map(item => ({ ...item, _type: 'blogPost' }));
//   const weeklyNews = weeklyNewsResults.map(item => ({ ...item, _type: 'weeklyNews' }));
// console.log(weeklyNews);
//   // Optionally sort each group by date descending
//   // blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
//   // weeklyNews.sort((a, b) => new Date(b.date || b.itemDate) - new Date(a.date || a.itemDate));

//   // Blog posts first, then weekly news
//   const allResults = [...blogPosts, ...weeklyNews];

//   return allResults;
// }

// Helper for BM25 search
async function searchWeaviateBM25(className, fields, query) {
  try {
    const bm25Query = weaviateClient.graphql
      .get()
      .withClassName(className)
      .withFields(fields)
      .withBm25({ query })
      .withLimit(20);

    const bm25Res = await bm25Query.do();
    return bm25Res?.data?.Get?.[className] ?? [];
  } catch (bm25Err) {
    console.warn(`BM25 search failed for ${className}:`, bm25Err);
    return [];
  }
}

// Helper for nearText (vector) search
async function searchWeaviateNearText(className, fields, query) {
  try {
    const nearTextQuery = weaviateClient.graphql
      .get()
      .withClassName(className)
      .withFields(fields)
      .withNearText({ concepts: [query] })
      .withLimit(20);

    const vecRes = await nearTextQuery.do();
    return vecRes?.data?.Get?.[className] ?? [];
  } catch (vecErr) {
    console.error(`nearText search failed for ${className}:`, vecErr);
    return [];
  }
}

// Function to boost exact matches to the top if all scores are null
function boostExactMatches(results, query) {
  const lowerQuery = query.toLowerCase();
  return results.sort((a, b) => {
    const aText = JSON.stringify(a).toLowerCase();
    const bText = JSON.stringify(b).toLowerCase();
    const aExact = aText.includes(lowerQuery);
    const bExact = bText.includes(lowerQuery);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
}

// Helper to remove duplicates by objectId or directusId
function dedupeResults(results) {
  const seen = new Set();
  return results.filter(item => {
    const id = item.objectId || item.directusId || JSON.stringify(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// Enhanced ranking: combine certainty and exact match boosting
function rankResults(results, query) {
  const lowerQuery = query.toLowerCase();
  return results.sort((a, b) => {
    const aText = JSON.stringify(a).toLowerCase();
    const bText = JSON.stringify(b).toLowerCase();
    const aExact = aText.includes(lowerQuery);
    const bExact = bText.includes(lowerQuery);
    const aScore = (a._additional?.certainty || 0) + (aExact ? 2 : 0);
    const bScore = (b._additional?.certainty || 0) + (bExact ? 2 : 0);
    return bScore - aScore;
  });
}

// Enhanced getCombinedResults: always run both BM25 and vector, merge, dedupe, rank, add metadata (no pagination)
async function getCombinedResults(query) {
  // Run both BM25 and vector searches in parallel
  const [bm25WeeklyNews, bm25BlogPosts, vecWeeklyNews, vecBlogPosts] = await Promise.all([
    searchWeaviateBM25('RebootWeeklyNewsItem', weeklyNewsItemFields, query),
    searchWeaviateBM25('RebootBlogPostChunk', blogPostChunkFields, query),
    searchWeaviateNearText('RebootWeeklyNewsItem', weeklyNewsItemFields, query),
    searchWeaviateNearText('RebootBlogPostChunk', blogPostChunkFields, query)
  ]);

  // Tag results
  const blogPosts = [...bm25BlogPosts, ...vecBlogPosts].map(item => ({ ...item, _type: 'blogPost' }));
  const weeklyNews = [...bm25WeeklyNews, ...vecWeeklyNews].map(item => ({ ...item, _type: 'weeklyNews' }));

  // Merge and dedupe
  let allResults = dedupeResults([...blogPosts, ...weeklyNews]);

  // Rank
  allResults = rankResults(allResults, query);

  // Metadata
  const metadata = {
    searchType: 'hybrid',
    totalResults: allResults.length,
    contentTypes: {
      blogPosts: blogPosts.length,
      weeklyNews: weeklyNews.length
    }
  };

  return { results: allResults, metadata };
}

// Example usage (uncomment to test):
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { query } = JSON.parse(event.body);

  if (!query) {
    return { statusCode: 400, body: 'Bad Request: Missing "query" parameter' };
  }

  try {
    const { results, metadata } = await getCombinedResults(query);
    return {
      statusCode: 200,
      body: JSON.stringify({ results, metadata }),
    };
  } catch (error) {
    console.error('Error processing query:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred processing your request' })
    };
  }
}