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

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
// Helpers
const getStringByteLength = str => Buffer.byteLength(str, 'utf8');

// Add this missing helper function:
const stripHtml = html => html.replace(/<\/?[^>]+(>|$)/g, "");

const COLLECTION_CONFIG = {
  reboot_democracy_blog: {
    fields: 'id,status,image,authors.team_id.*,title,content,slug,excerpt,fullURL',
    transform: transformBlogItem,
  },
  reboot_democracy_weekly_news: {
    fields: 'id,title,summary,author,edition,status,date,items.reboot_democracy_weekly_news_items_id.*',
    transform: transformWeeklyNewsItem,
  },
};

// Generic fetch function
async function fetchItem(collection, itemId, fields) {
  const response = await fetch(`${DIRECTUS_URL}/items/${collection}/${itemId}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${DIRECTUS_AUTH_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch item from Directus: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

// Transform functions
function transformBlogItem(record) {
  const maxChunkSize = 7000;
  const { content, ...nonContentFields } = record;

  if (!content) {
    return [{ ...nonContentFields, objectID: `${record.id}_part0`, content: '', part: 0 }];
  }

  const plainText = stripHtml(content);
  const words = plainText.split(' ');
  const records = [];
  let currentChunk = '';
  let currentSize = 0;
  let part = 0;

  for (const word of words) {
    const wordWithSpace = word + ' ';
    const wordSize = getStringByteLength(wordWithSpace);

    if (currentSize + wordSize > maxChunkSize && currentChunk !== '') {
      records.push({ ...nonContentFields, objectID: `${record.id}_part${part}`, content: currentChunk.trim(), part });
      part++;
      currentChunk = wordWithSpace;
      currentSize = wordSize;
    } else {
      currentChunk += wordWithSpace;
      currentSize += wordSize;
    }
  }

  if (currentChunk.trim() !== '') {
    records.push({ ...nonContentFields, objectID: `${record.id}_part${part}`, content: currentChunk.trim(), part });
  }

  return records;
}

function transformWeeklyNewsItem(record) {
  return record.items.map(item => ({
    objectID: `${record.id}_${item.reboot_democracy_weekly_news_items_id.id}`,
    author: record.author,
    date: record.date,
    title: record.title,
    summary: record.summary,
    edition: record.edition,
    id: record.id,
    item: item.reboot_democracy_weekly_news_items_id,
  }));
}

// Generic upsert handler
async function handleUpsert(collection, itemId) {
  const config = COLLECTION_CONFIG[collection];
  if (!config) throw new Error(`No config found for collection: ${collection}`);

  const item = await fetchItem(collection, itemId, config.fields);
  if (item.status && item.status !== 'published') {
    console.log(`Item ${itemId} is not published. Skipping indexing.`);
    return;
  }

  const records = config.transform(item);
  await client.saveObjects({ indexName: collection, objects: records });

  console.log(`Indexed item ${itemId} into ${collection} with ${records.length} records.`);
}

// Generic delete handler
async function handleDelete(collection, itemId) {
  const response = await client.search({
    requests: [{
      indexName: collection,
      query: '',
      filters: `id:${itemId}`,
      attributesToRetrieve: ['objectID'],
      hitsPerPage: 1000,
      distinct: false,
    }],
  });
console.log(response)

  const hits = response.results?.[0]?.hits || [];
  if (hits.length > 0) {
    const objectIDs = hits.map(hit => hit.objectID);
    await client.deleteObjects({ indexName: collection, objectIDs });
    console.log(`Deleted ${objectIDs.length} records for item ${itemId} from ${collection}.`);
  } else {
    console.log(`No records found for item ${itemId} in ${collection}.`);
  }
}

// Simplified webhook handler
export default async (req, context) => {
  try {
    // Uncomment the next line in production to extract the request payload.
    const { id: itemId, action } = await req.json();

    // Test payload for local testing:
    // const testPayload = { collection: "reboot_democracy_weekly_news", id: "62", action: "reboot_democracy_weekly_news.items.update" };
    // const { id: itemId, action } = testPayload;
    const [collection, , event] = action.split('.');

    if (!COLLECTION_CONFIG[collection]) {
      console.log(`Unhandled collection: ${collection}`);
      return;
    }

    switch (event) {
      case 'create':
        await handleUpsert(collection, itemId);
        break;
      case 'update':
        await handleDelete(collection, itemId);
        await handleUpsert(collection, itemId);
        break;
      case 'delete':
        await handleDelete(collection, itemId);
        break;
      default:
        console.log(`Unhandled event: ${event}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
};