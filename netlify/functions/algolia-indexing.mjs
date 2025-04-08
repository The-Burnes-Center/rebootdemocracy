import { algoliasearch } from 'algoliasearch';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configuration
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;
const DIRECTUS_URL = "https://dev.thegovlab.com";
const DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_AUTH_TOKEN;

// Initialize Algolia client
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

// Helpers
function getStringByteLength(str) {
  return Buffer.byteLength(str, 'utf8');
}

function stripHtml(html) {
  return html.replace(/<\/?[^>]+(>|$)/g, ""); // Very basic HTML tag remover
}

// Function to transform a Directus record into Algolia records
function transform(record) {
  const maxChunkSize = 8192; // 8 KB per chunk in bytes
  const { content, ...nonContentFields } = record;

  if (content) {
    const plainText = stripHtml(content); // Remove HTML tags
    const baseRecord = { ...nonContentFields };
    const words = plainText.split(' ');

    let currentChunk = '';
    let currentSize = 0;
    let part = 0;
    const records = [];

    for (const word of words) {
      const wordWithSpace = word + ' ';
      const wordSize = getStringByteLength(wordWithSpace);

      // If appending the word would exceed the max chunk size, then push the current chunk
      if (currentSize + wordSize > maxChunkSize && currentChunk !== '') {
        records.push({
          ...baseRecord,
          objectID: `${record.id}_part${part}`,
          content: currentChunk.trim(),
          part,
        });
        part++;
        currentChunk = wordWithSpace;
        currentSize = wordSize;
      } else {
        currentChunk += wordWithSpace;
        currentSize += wordSize;
      }
    }

    if (currentChunk.trim() !== '') {
      records.push({
        ...baseRecord,
        objectID: `${record.id}_part${part}`,
        content: currentChunk.trim(),
        part,
      });
    }

    console.log(`Content transformed into ${records.length} record chunks with each below ${maxChunkSize} bytes.`);
    return records;
  }

  return [{
    ...nonContentFields,
    objectID: `${record.id}_part0`,
    content: '',
    part: 0,
  }];
}

function transformWeeklyNews(record) {
  return record.items.map(item => {
    const objectID = `${record.id}_${item.reboot_democracy_weekly_news_items_id.id}`;
    return {
      objectID,
      author: record.author,
      date: record.date,
      title: record.title,
      summary: record.summary,
      edition: record.edition,
      id: record.id,
      item: item.reboot_democracy_weekly_news_items_id
    };
  });
}

async function fetchWeeklyNewsItem(collection, itemId) {
  const response = await fetch(`${DIRECTUS_URL}/items/${collection}/${itemId}?fields=id,title,summary,author,edition,status,date,items.reboot_democracy_weekly_news_items_id.*`, {
    headers: {
      Authorization: `Bearer ${DIRECTUS_AUTH_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch weekly news item from Directus: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

// Handle upsert for weekly news
async function handleWeeklyNewsUpsert(collection, itemId) {
  const item = await fetchWeeklyNewsItem(collection, itemId);
  if (item.status !== 'published') {
    console.log(`Item ${itemId} is not published. Skipping indexing.`);
    return;
  }

  const records = transformWeeklyNews(item);

  await client.saveObjects({
    indexName: 'reboot-news-that-caught-our-eye-test',
    objects: records,
  });

  console.log(`Indexed weekly news item ${itemId} with ${records.length} records.`);
}

// Handle delete for weekly news
async function handleWeeklyNewsDelete(itemId) {
  const response = await client.search({
    requests: [{
      indexName: 'reboot-news-that-caught-our-eye-test',
      query: '',
      filters: `id:${itemId}`,
      attributesToRetrieve: ['objectID'],
      hitsPerPage: 1000,
      distinct: false,
    }],
  });

  const hits = response.results && response.results[0] ? response.results[0].hits : [];
  console.log(hits)
  
  if (hits.length > 0) {
    const objectIDs = hits.map(hit => hit.objectID);
    await client.deleteObjects({
      indexName: 'reboot-news-that-caught-our-eye-test',
      objectIDs,
    });
    console.log(`Deleted ${objectIDs.length} weekly news records for item ${itemId}.`);
  } else {
    console.log(`No weekly news records found for item ${itemId}.`);
  }
}

// Fetch a single Directus item
async function fetchDirectusItem(collection, itemId) {
  console.log(collection, itemId);
  const response = await fetch(`${DIRECTUS_URL}/items/${collection}/${itemId}?fields=id,status,image,authors.team_id.*,title,content,slug,fullURL`, {
    headers: {
      Authorization: `Bearer ${DIRECTUS_AUTH_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch item from Directus: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

// Handle new or updated items
async function handleUpsert(collection, itemId) {
  const item = await fetchDirectusItem(collection, itemId);

  if (item.status !== 'published') {
    console.log(`Item ${itemId} is not published. Skipping indexing.`);
    return;
  }

  const records = transform(item);

  console.log('Generated Records:', records.map(r => ({
    part: r.part,
    size: getStringByteLength(r.content),
    preview: r.content.slice(0, 60) + '...',
    authors: JSON.stringify(r.authors[0])
  })));
  console.log('Generated Records:', records)

  await client.saveObjects({
    indexName: ALGOLIA_INDEX_NAME,
    objects: records,
  });

  console.log(`Indexed item ${itemId} with ${records.length} records.`);
}

// Handle deleted items
async function handleDelete(itemId) {
  const response = await client.search({
    requests: [{
      indexName: ALGOLIA_INDEX_NAME,
      query: '',
      filters: `id:${itemId}`,
      attributesToRetrieve: ['objectID'],
      hitsPerPage: 1000,
      distinct: false,
    }],
  });
  console.log("Hits found for deletion:", response);
  const hits = response.results && response.results[0] ? response.results[0].hits : [];
  console.log("Hits found for deletion:", hits);

  if (hits.length > 0) {
    const objectIDs = hits.map(hit => hit.objectID);
    await client.deleteObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objectIDs,
    });
    console.log(`Deleted ${objectIDs.length} records for item ${itemId}.`);
  } else {
    console.log(`No records found for item ${itemId}.`);
  }
}

// Webhook handler
// Updated webhook handler
export default async (req, context) => {
  
    // const req2 = { collection: "reboot_democracy_blog", id: "28374", action: "reboot_democracy_blog.items.update" };
  try {
    // const { id: itemId, action } = req2;
    const { id: itemId, action } = await req.json();
    const [collection, , event] = action.split('.');

    switch (collection) {
      case 'reboot_democracy_blog':
        switch (event) {
          case 'create':
            await handleUpsert(collection, itemId);
            break;
          case 'update':
            await handleDelete(itemId);
            await handleUpsert(collection, itemId);
            break;
          case 'delete':
            await handleDelete(itemId);
            break;
          default:
            console.log(`Unhandled event for reboot_democracy_blog: ${event}`);
        }
        break;

      case 'reboot_democracy_weekly_news':
        switch (event) {
          case 'create':
            await handleWeeklyNewsUpsert(collection, itemId);
            break;
          case 'update':
            await handleWeeklyNewsDelete(itemId);
            await handleWeeklyNewsUpsert(collection, itemId);
            break;
          case 'delete':
            await handleWeeklyNewsDelete(itemId);
            break;
          default:
            console.log(`Unhandled event for reboot_democracy_weekly_news: ${event}`);
        }
        break;

      default:
        console.log(`Unhandled collection: ${collection}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
};