// rebootContentSearch.js
// Netlify serverless function for searching Reboot Democracy content stored in Weaviate
// Performs BM25 keyword search first, falls back to nearText, and filters for exact matches.

import weaviate from 'weaviate-ts-client';
import { OpenAI } from 'openai';

/*************************
 *  Client initialisation *
 *************************/
// Debug environment variables
console.log('Environment variables:', {
  VITE_WEAVIATE_HTTP_SCHEME: process.env.VITE_WEAVIATE_HTTP_SCHEME,
  VITE_WEAVIATE_HOST: process.env.VITE_WEAVIATE_HOST,
  VITE_WEAVIATE_APIKEY: process.env.VITE_WEAVIATE_APIKEY ? 'SET' : 'NOT SET',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'
});

// Use local Weaviate instance
const weaviateClient = weaviate.client({
  scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'http',
  host: process.env.VITE_WEAVIATE_HOST?.replace(/^https?:\/\//, '').replace(/\/$/, '') || '45.55.162.220:8888',
  apiKey: new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY || 'APIKEY'),
  headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY }
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**********************
 *  GraphQL fieldsets *
 **********************/
// Updated field sets to match the actual migrated schema
const weeklyNewsItemFields = `
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

// Add fields for the additional collections that exist in the migrated instance
const ragDocumentFields = `
  title
  description
  shortDescription
  fullDescriptionOfAllContents
  compressedFullDescriptionOfAllContents
  url
  date
  lastModified
  primaryCategory
  secondaryCategory
  contentType
  _additional { id distance certainty }
`;

const ragDocumentChunkFields = `
  title
  uncompressedContent
  compressedContent
  shortSummary
  fullSummary
  mainExternalUrlFound
  metaData
  metaDataFields
  _additional { id distance certainty }
`;

const youtubeVideoFields = `
  videoId
  url
  title
  text
  start_seconds
  end_seconds
  source
  _additional { id distance certainty }
`;



/*********************************************
 *  Search helper – BM25 then nearText       *
 *********************************************/
async function searchWeaviate(className, fields, query) {
  // Special handling for YouTube videos to exclude "innovate-us" category
  if (className === 'Youtube_videos') {
    // 1️⃣ Attempt fast keyword search (BM25) with category filter
    try {
      const bm25Query = weaviateClient.graphql
        .get()
        .withClassName(className)
        .withFields(fields)
        .withBm25({ query })
        .withWhere({
          path: ['category'],
          operator: 'Equal',
          valueText: 'reboot'
        })
        .withLimit(5);

      const bm25Res = await bm25Query.do();
      const bm25Hits = bm25Res?.data?.Get?.[className] ?? [];
      
      if (bm25Hits.length > 0) {
        console.log(`YouTube BM25 search (excluding innovate-us) found ${bm25Hits.length} results for query: "${query}"`);
        return bm25Hits.map(h => ({ ...h, _className: className }));
      }

    } catch (bm25Err) {
      console.warn(`BM25 search failed for ${className}:`, bm25Err);
    }

    // 2️⃣ Fallback to semantic vector search with category filter
    try {
      const nearTextQuery = weaviateClient.graphql
        .get()
        .withClassName(className)
        .withFields(fields)
        .withNearText({ concepts: [query] })
        .withWhere({
          path: ['category'],
          operator: 'Equal',
          valueText: 'reboot'
        })
        .withLimit(5);

      const vecRes = await nearTextQuery.do();
      const vecHits = vecRes?.data?.Get?.[className] ?? [];
      console.log(`YouTube nearText search (excluding innovate-us) found ${vecHits.length} results for query: "${query}"`);
      return vecHits.map(h => ({ ...h, _className: className }));
    } catch (vecErr) {
      console.error(`nearText search failed for ${className}:`, vecErr);
      return [];
    }
  }

  // Regular search for other collections (no category filtering)
  // 1️⃣ Attempt fast keyword search (BM25)
  try {
    const bm25Query = weaviateClient.graphql
      .get()
      .withClassName(className)
      .withFields(fields)
      .withBm25({ query })
      .withLimit(5);

    const bm25Res = await bm25Query.do();
    const bm25Hits = bm25Res?.data?.Get?.[className] ?? [];
    
    if (bm25Hits.length > 0) {
      return bm25Hits.map(h => ({ ...h, _className: className }));
    }

  } catch (bm25Err) {
    console.warn(`BM25 search failed for ${className}:`, bm25Err);
  }

  // 2️⃣ Fallback to semantic vector search
  try {
    const nearTextQuery = weaviateClient.graphql
      .get()
      .withClassName(className)
      .withFields(fields)
      .withNearText({ concepts: [query] })
      .withLimit(5);

    const vecRes = await nearTextQuery.do();
    const vecHits = vecRes?.data?.Get?.[className] ?? [];
    return vecHits.map(h => ({ ...h, _className: className }));
  } catch (vecErr) {
    console.error(`nearText search failed for ${className}:`, vecErr);
    return [];
  }
}

/*********************************************
 *  Main search wrapper used by the function *
 *********************************************/
export async function searchContent(query) {
  try {
    // Search across all available collections in the migrated instance
    console.log('Starting search for query:', query);
    const [newsHits, blogHits, ragDocHits, ragChunkHits, youtubeHits] = await Promise.all([
      searchWeaviate('RebootWeeklyNewsItem', weeklyNewsItemFields, query),
      searchWeaviate('RebootBlogPostChunk',  blogPostChunkFields,  query),
      searchWeaviate('RagDocument',          ragDocumentFields,    query),
      searchWeaviate('RagDocumentChunk',     ragDocumentChunkFields, query),
      searchWeaviate('Youtube_videos',       youtubeVideoFields,    query).catch(err => {
        console.error('YouTube search failed:', err);
        return [];
      })
    ]);
    
    const allResults = [...newsHits, ...blogHits, ...ragDocHits, ...ragChunkHits, ...youtubeHits];
    
    console.log('YouTube hits found:', youtubeHits.length);
    console.log('YouTube hits details:', youtubeHits);
    
    // Debug: Show text content of YouTube videos
    youtubeHits.forEach((hit, index) => {
      console.log(`YouTube video ${index + 1}:`, {
        title: hit.title,
        start_seconds: hit.start_seconds,
        end_seconds: hit.end_seconds,
        text_preview: hit.text ? hit.text.substring(0, 200) + '...' : 'No text content',
        videoId: hit.videoId
      });
    });
    console.log('Total results:', allResults.length);

    // 1. Filter for exact matches in relevant fields
    const lowerQuery = query.toLowerCase();
    const isExactMatch = (hit) => {
      // Check if any field contains the query (case-insensitive)
      const searchableFields = [
        hit.content,
        hit.title,
        hit.itemDescription,
        hit.description,
        hit.shortDescription,
        hit.fullDescriptionOfAllContents,
        hit.uncompressedContent,
        hit.shortSummary,
        hit.fullSummary,
        hit.question,
        hit.answer,
        hit.itemAuthor,
        hit.author,
        hit.text, // YouTube video transcript text
        hit.source, // YouTube video source
        ...(Array.isArray(hit.authors) ? hit.authors : [])
      ].filter(Boolean); // Remove null/undefined values

      return searchableFields.some(field => 
        field.toLowerCase().includes(lowerQuery)
      );
    };
    const exactMatches = allResults.filter(isExactMatch);
    console.log('Total results:', allResults.length);
    console.log('Exact matches:', exactMatches.length);

    // 2. Take up to 5, prioritizing exact matches
    let topChunks = [];
    if (exactMatches.length > 0) {
      // Sort exact matches by distance/certainty
      topChunks = exactMatches.sort((a, b) => (a._additional?.distance ?? 1) - (b._additional?.distance ?? 1));
      console.log('Using exact matches');
    } else {
      // If no exact matches, use top 5 by distance/certainty
      topChunks = allResults.sort((a, b) => (a._additional?.distance ?? 1) - (b._additional?.distance ?? 1));
      console.log('Using all results (no exact matches)');
    }

    // Take top 5 results for main content
    const finalResults = topChunks.slice(0, 5);
    console.log('Final search results count:', finalResults.length);
    console.log('Final search results types:', finalResults.map(r => r._className));
    
    // Return both search results and YouTube videos separately
    return {
      searchResults: finalResults,
      youtubeVideos: youtubeHits
    };
  } catch (error) {
    console.error('Error while querying Weaviate:', error);
    return {
      searchResults: [],
      youtubeVideos: []
    };
  }
}

/*********************
 *  Format utilities *
 *********************/
function formatSearchResults(results) {
  if (!results?.length) {
    return 'No specific information found in the database.';
  }

  return results.map(r => {
    switch (r._className) {
      case 'RebootWeeklyNewsItem':
        return `\n**${r.itemTitle || r.title || 'Untitled'}**\n- *Publication*: ${r.itemPublication || 'N/A'}\n- *Author*: ${r.itemAuthor || r.author || 'N/A'}\n- *Date*: ${(r.itemDate || r.date || 'N/A').toString().substring(0, 10)}\n- *Content*: ${r.itemDescription || r.summary || ''}\n- *URL*: ${r.itemUrl || 'N/A'}`.trim();
      case 'RebootBlogPostChunk':
        return `\n**${r.title || 'Untitled'}**\n- *Authors*: ${(r.authors || []).join(', ') || 'N/A'}\n- *Date*: ${(r.date || 'N/A').toString().substring(0, 10)}\n- *Content*: ${r.content || ''}\n- *URL*: ${r.fullUrl || 'N/A'}`.trim();
      case 'RagDocument':
        return `\n**${r.title || 'Untitled'}**\n- *Category*: ${r.primaryCategory || r.secondaryCategory || 'N/A'}\n- *Date*: ${(r.date || r.lastModified || 'N/A').toString().substring(0, 10)}\n- *Content*: ${r.shortDescription || r.description || r.fullDescriptionOfAllContents || ''}\n- *URL*: ${r.url || 'N/A'}`.trim();
      case 'RagDocumentChunk':
        return `\n**${r.title || 'Untitled'}**\n- *Content*: ${r.shortSummary || r.fullSummary || r.uncompressedContent || r.compressedContent || ''}\n- *URL*: ${r.mainExternalUrlFound || 'N/A'}`.trim();
      case 'Youtube_videos':
        const startTime = r.start_seconds ? Math.floor(r.start_seconds) : 0;
        const endTime = r.end_seconds ? Math.floor(r.end_seconds) : startTime + 30;
        // Convert to youtu.be format with timestamp
        const videoUrl = r.videoId ? `https://youtu.be/${r.videoId}&t=${startTime}` : 'N/A';
        // Format time as minutes:seconds
        const formatTime = (seconds) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs.toString().padStart(2, '0')} min`;
        };
        return `\n**${r.title || 'YouTube Video'}**\n- *Video ID*: ${r.videoId || 'N/A'}\n- *Content*: ${r.text || ''}\n- *Time*: ${formatTime(startTime)} - ${formatTime(endTime)}\n- *Video URL*: ${videoUrl}`.trim();

      default:
        return '';
    }
  }).join('\n\n');
}

/************************************************
 *  Netlify serverless function handler export  *
 ************************************************/
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { message, conversation } = JSON.parse(event.body || '{}');

  try {
    const searchData = await searchContent(message);
    const searchResults = searchData.searchResults || searchData; // Handle both old and new format
    const youtubeVideos = searchData.youtubeVideos || [];
    const formattedResults = formatSearchResults(searchResults);
    console.log('Search query:', message);
    console.log('Number of search results:', searchResults.length);
    console.log('Number of YouTube videos:', youtubeVideos.length);
    console.log('Formatted results:', formattedResults);
    /********************************
     * Build messages for GPT model *
     ********************************/
    const systemMessage = `You are the Rebooting Democracy chatbot, a friendly AI that helps users find information from a large database of documents.

Instructions:
- The user will ask a question, and we will search a large database in a vector store and bring information connected to the user question into your <CONTEXT_TO_ANSWER_USERS_QUESTION_FROM> to provide a thoughtful answer from.
- If not enough information is available, you can ask the user for more information.
- Never provide information that is not backed by your context or is common knowledge.
- Look carefully at all in your context before you present the information to the user.
- **If the context contains a direct mention of the user’s query (e.g., a person’s name), focus your answer on that information first.**
- **When searching for a person's name, check both the content and the author fields in the search results. If you find articles written by that person or mentioning that person, highlight this information prominently.**
- **CRITICAL: If the search results show information about the person (even if it's not the first result), you must include that information in your response.**
- Be optimistic and cheerful but keep a professional nordic style of voice.
- For longer outputs use bullet points and markdown to make the information easy to read.
- Do not reference your contexts and the different document sources—just provide the information based on those sources.
- For all document sources we will provide the user with those; you do not need to link or reference them.
- If there are inline links in the actual document chunks, you can provide those to the user in a markdown link format.
- Use markdown to format your answers; always use formatting so the response comes alive to the user.
- Keep your answers short and to the point except when the user asks for detail.`;

    const messages = [{ role: 'system', content: systemMessage }];

    // Append previous conversation (excluding placeholder last bot message)
    if (Array.isArray(conversation)) {
      messages.push(
        ...conversation.slice(0, -1).flatMap(m => {
          if (m.type === 'user') return { role: 'user', content: m.content };
          if (m.type === 'bot')  return { role: 'assistant', content: m.content };
          return [];
        })
      );
    }

    // Latest user question with context
    messages.push({
      role: 'user',
      content: `<LATEST_USER_QUESTION>\nQuestion: ${message}\n</LATEST_USER_QUESTION>\n\n<CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>\n${formattedResults}\n</CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>\n\nYour thoughtful answer in markdown:`
    });

    
    /*************************
     *  Stream GPT response  *
     *************************/
    const stream = await openaiClient.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      // max_completion_tokens: 2048,
      // temperature: 0.0,
      // store: true
      stream: true
    });

    // Prepare streaming response
    context.res = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      },
      body: ''
    };

    for await (const chunk of stream) {
      const contentPart = chunk.choices?.[0]?.delta?.content || '';
      context.res.body += `data: ${JSON.stringify({ content: contentPart })}\n\n`;
      await new Promise(resolve => context.awsRequestId ? resolve() : context.awsLambda.context.succeed(context.res));
    }

    /****************************
     *  Send source documents   *
     ****************************/
    console.log('Processing source documents for', searchResults.length, 'results');
    console.log('YouTube videos found for sources:', youtubeVideos.length);
    
    let sourceDocuments = searchResults.flatMap(r => {
      console.log('Processing result:', r._className, r.title || r.itemTitle || 'No title');
      
      if (r._className === 'RebootWeeklyNewsItem') {
        return r.itemUrl ? [{ title: r.itemTitle || r.title, url: r.itemUrl }] : [];
      }
      if (r._className === 'RebootBlogPostChunk') {
        return r.fullUrl ? [{ title: r.title, url: r.fullUrl }] : [];
      }
      if (r._className === 'RagDocument') {
        return r.url ? [{ title: r.title, url: r.url }] : [];
      }
      if (r._className === 'RagDocumentChunk') {
        return r.mainExternalUrlFound ? [{ title: r.title, url: r.mainExternalUrlFound }] : [];
      }
      if (r._className === 'Youtube_videos') {
        const startTime = r.start_seconds ? Math.floor(r.start_seconds) : 0;
        // Convert YouTube URL to youtu.be format with timestamp
        let videoUrl = null;
        if (r.url && r.videoId) {
          // Extract video ID and create youtu.be URL with timestamp
          videoUrl = `https://youtu.be/${r.videoId}&t=${startTime}`;
        }
        // Format time as minutes:seconds
        const formatTime = (seconds) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs.toString().padStart(2, '0')} min`;
        };
        console.log('YouTube video found:', { title: r.title, originalUrl: r.url, videoId: r.videoId, startTime, videoUrl });
        const videoDoc = videoUrl ? [{ 
          title: `${r.title || 'YouTube Video'} (${formatTime(startTime)})`, 
          url: videoUrl,
          type: 'video'
        }] : [];
        console.log('YouTube video document created:', videoDoc);
        return videoDoc;
      }

      return [];
    });

// Add YouTube videos to source documents
const youtubeSourceDocuments = youtubeVideos.map(r => {
  const startTime = r.start_seconds ? Math.floor(r.start_seconds) : 0;
  const videoUrl = r.videoId ? `https://youtu.be/${r.videoId}&t=${startTime}` : null;
  // Format time as minutes:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  };
  console.log('YouTube video for sources:', { title: r.title, videoId: r.videoId, startTime, videoUrl });
  return videoUrl ? { 
    title: `${r.title || 'YouTube Video'} (${formatTime(startTime)})`, 
    url: videoUrl,
    type: 'video'
  } : null;
}).filter(Boolean);

console.log('YouTube source documents created:', youtubeSourceDocuments.length);

// Combine regular sources with YouTube videos
sourceDocuments = [...sourceDocuments, ...youtubeSourceDocuments];

// Deduplicate by URL, preserving order
console.log('Source documents before deduplication:', sourceDocuments.length);
const seen = new Set();
sourceDocuments = sourceDocuments.filter(doc => {
  if (seen.has(doc.url)) return false;
  seen.add(doc.url);
  return true;
});

console.log('Source documents after deduplication:', sourceDocuments.length);

// Limit to 10 links
sourceDocuments = sourceDocuments.slice(0, 10);

console.log('Source documents being sent:', sourceDocuments);

context.res.body += `data: ${JSON.stringify({ sourceDocuments })}\n\n`;
context.res.body += 'data: [DONE]\n\n';

return context.res;
  } catch (error) {
    console.error('Error processing message:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'An error occurred processing your message' }) };
  }
}