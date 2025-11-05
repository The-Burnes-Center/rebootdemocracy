import weaviate from 'weaviate-ts-client';
import dotenv from 'dotenv';

dotenv.config();

const weaviateClient = weaviate.client({
  scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https',
  host: process.env.VITE_WEAVIATE_HOST,
  apiKey: new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY),
  headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY }
});

const slug = 'hamburgs-secret-weapon-for-participatory-democracy-open-source-ai';

async function findObject() {
  try {
    console.log(`Searching for slug: ${slug}`);
    console.log('Trying exact match, then partial match...\n');
    
    // Try exact match first
    let result = await weaviateClient.graphql
      .get()
      .withClassName('RebootBlogPostChunk')
      .withFields(`
        title
        excerpt
        content
        tags
        authors
        date
        slug
        status
        fullUrl
        imageFilename
        imageId
        _additional { id }
      `)
      .withWhere({
        path: ['slug'],
        operator: 'Equal',
        valueString: slug
      })
      .withLimit(10)
      .do();

    let chunks = result.data.Get.RebootBlogPostChunk || [];
    
    // If no exact match, try Contains (partial match)
    if (chunks.length === 0) {
      console.log('No exact match, trying partial match...\n');
      result = await weaviateClient.graphql
        .get()
        .withClassName('RebootBlogPostChunk')
        .withFields(`
          title
          excerpt
          content
          tags
          authors
          date
          slug
          status
          fullUrl
          imageFilename
          imageId
          _additional { id }
        `)
        .withWhere({
          path: ['slug'],
          operator: 'Contains',
          valueString: slug
        })
        .withLimit(10)
        .do();
      
      chunks = result.data.Get.RebootBlogPostChunk || [];
    }
    
    // Also search in fullUrl field
    if (chunks.length === 0) {
      console.log('Trying to find by fullUrl...\n');
      result = await weaviateClient.graphql
        .get()
        .withClassName('RebootBlogPostChunk')
        .withFields(`
          title
          excerpt
          content
          tags
          authors
          date
          slug
          status
          fullUrl
          imageFilename
          imageId
          _additional { id }
        `)
        .withWhere({
          path: ['fullUrl'],
          operator: 'Contains',
          valueString: slug
        })
        .withLimit(10)
        .do();
      
      chunks = result.data.Get.RebootBlogPostChunk || [];
    }
    
    // Also search by BM25 in all fields
    if (chunks.length === 0) {
      console.log('Trying BM25 search across all fields...\n');
      result = await weaviateClient.graphql
        .get()
        .withClassName('RebootBlogPostChunk')
        .withFields(`
          title
          excerpt
          content
          tags
          authors
          date
          slug
          status
          fullUrl
          imageFilename
          imageId
          _additional { id }
        `)
        .withBm25({ query: slug })
        .withLimit(10)
        .do();
      
      chunks = result.data.Get.RebootBlogPostChunk || [];
    }
    
    if (chunks.length === 0) {
      console.log('❌ No results found with that slug in any search method');
      console.log('Searching for similar slugs...\n');
      
      // Try searching for "hamburg" to see what comes up
      result = await weaviateClient.graphql
        .get()
        .withClassName('RebootBlogPostChunk')
        .withFields('title slug fullUrl')
        .withBm25({ query: 'hamburg' })
        .withLimit(5)
        .do();
      
      const similarChunks = result.data.Get.RebootBlogPostChunk || [];
      if (similarChunks.length > 0) {
        console.log(`Found ${similarChunks.length} similar results with "hamburg":`);
        similarChunks.forEach((chunk, index) => {
          console.log(`${index + 1}. "${chunk.title}" - Slug: ${chunk.slug}`);
        });
      }
    } else {
      console.log(`✅ Found ${chunks.length} chunk(s) with that slug:\n`);
      chunks.forEach((chunk, index) => {
        console.log(`=== Chunk ${index + 1} ===`);
        console.log('ID:', chunk._additional?.id);
        console.log('Title:', chunk.title);
        console.log('Slug:', chunk.slug);
        console.log('Status:', chunk.status);
        console.log('Date:', chunk.date);
        console.log('Authors:', JSON.stringify(chunk.authors, null, 2));
        console.log('Tags:', JSON.stringify(chunk.tags, null, 2));
        console.log('Image Filename:', chunk.imageFilename);
        console.log('Image ID:', chunk.imageId);
        console.log('Full URL:', chunk.fullUrl);
        console.log('Content length:', chunk.content?.length || 0, 'characters');
        console.log('Excerpt:', chunk.excerpt?.substring(0, 200) || '');
      });
      
      // Show full JSON
      console.log('\n=== Full JSON ===');
      console.log(JSON.stringify(chunks, null, 2));
    }
  } catch (error) {
    console.error('Error querying Weaviate:', error);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

findObject();

