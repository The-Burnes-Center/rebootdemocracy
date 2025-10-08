// -----------------------------------------------------------------------------
// ingest_and_index.mjs
//  • Node ≥18 (ESM) – run by your serverless function / webhook runtime
//  • ENV VARS required:
//      ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, DIRECTUS_URL,
//      DIRECTUS_AUTH_TOKEN
// -----------------------------------------------------------------------------

import { algoliasearch } from 'algoliasearch';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// ─── Config ───────────────────────────────────────────────────────────────────
const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  DIRECTUS_URL,
  DIRECTUS_AUTH_TOKEN
} = process.env;

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

// ─── Generic helpers ──────────────────────────────────────────────────────────
const getStringByteLength = (str) => Buffer.byteLength(str, 'utf8');
const stripHtml = (html) => html.replace(/<\/?[^>]+(>|$)/g, '');

// ─── Eastern-time epoch helpers (no external library) ────────────────────────
function isEasternDST(dUTC) {
  const y = dUTC.getUTCFullYear();

  // DST starts: 2nd Sunday in March @ 02:00 ET → 07:00 UTC (still EST) :contentReference[oaicite:0]{index=0}
  const march1 = new Date(Date.UTC(y, 2, 1));
  const secondSunday = 1 + ((7 - march1.getUTCDay()) % 7) + 7;
  const dstStartUTC = Date.UTC(y, 2, secondSunday, 7);

  // DST ends: 1st Sunday in Nov @ 02:00 ET → 06:00 UTC (still EDT) :contentReference[oaicite:1]{index=1}
  const nov1 = new Date(Date.UTC(y, 10, 1));
  const firstSunday = 1 + ((7 - nov1.getUTCDay()) % 7);
  const dstEndUTC = Date.UTC(y, 10, firstSunday, 6);

  return dUTC.getTime() >= dstStartUTC && dUTC.getTime() < dstEndUTC;
}

/**
 * Convert an ISO-8601 string that represents *Eastern wall-clock time*
 * into Unix-seconds epoch (DST-aware). Returns null on parse error.
 */
function isoToEpoch(iso) {
  if (typeof iso !== 'string' || !iso.trim()) return null;
  const m = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (!m) return null;

  const [, Y, M, D, h, mnt, s = '0'] = m;
  const millisUTC = Date.UTC(+Y, +M - 1, +D, +h, +mnt, +s); // use UTC() :contentReference[oaicite:2]{index=2}
  const offset = isEasternDST(new Date(millisUTC)) ? 4 * 3600 : 5 * 3600; // EDT/EST :contentReference[oaicite:3]{index=3}
  return Math.floor(millisUTC / 1000) + offset;
}

// ─── Collection-specific config ──────────────────────────────────────────────
const COLLECTION_CONFIG = {
  reboot_democracy_blog: {
    fields:
      'id,status,image.id,image.filename_disk,date,Tags,authors.team_id.*,title,content,slug,excerpt,fullURL,audio_version.filename_disk',
    transform: transformBlogItem,
  },
  reboot_democracy_weekly_news: {
    fields:
      'id,title,summary,author,edition,status,date,items.reboot_democracy_weekly_news_items_id.*',
    transform: transformWeeklyNewsItem,
  },
};

// ─── Directus fetcher ────────────────────────────────────────────────────────
async function fetchItem(collection, itemId, fields) {
  const res = await fetch(
    `${DIRECTUS_URL}/items/${collection}/${itemId}?fields=${fields}`,
    { headers: { Authorization: `Bearer ${DIRECTUS_AUTH_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`Directus fetch failed: ${res.statusText}`);
  return (await res.json()).data;
}

// ─── Transform functions ─────────────────────────────────────────────────────
function transformBlogItem(record) {
  const maxChunk = 7000;
  const { content = '', date, ...rest } = record;
  const epoch = isoToEpoch(date);
  const base = { ...rest, date, date_at_epoch: epoch };

  // chunk HTML-stripped content if needed
  const words = stripHtml(content).split(' ');
  const out = [];
  let chunk = '', size = 0, part = 0;

  for (const w of words) {
    const plus = w + ' ';
    const bytes = getStringByteLength(plus);
    if (size + bytes > maxChunk && chunk) {
      out.push({ ...base, objectID: `${record.id}_part${part}`, content: chunk.trim(), part });
      part++; chunk = plus; size = bytes;
    } else {
      chunk += plus; size += bytes;
    }
  }
  if (chunk.trim()) {
    out.push({ ...base, objectID: `${record.id}_part${part}`, content: chunk.trim(), part });
  }
  return out;
}

function transformWeeklyNewsItem(record) {
  const epoch = isoToEpoch(record.date);
  return record.items.map(i => ({
    objectID: `${record.id}_${i.reboot_democracy_weekly_news_items_id.id}`,
    id: record.id,
    author: record.author,
    title: record.title,
    summary: record.summary,
    edition: record.edition,
    date: record.date,
    date_at_epoch: epoch,
    item: i.reboot_democracy_weekly_news_items_id,
  }));
}

// ─── Algolia upsert / delete helpers ─────────────────────────────────────────
async function handleUpsert(collection, itemId) {
  const cfg = COLLECTION_CONFIG[collection];
  const item = await fetchItem(collection, itemId, cfg.fields);

  const objects = cfg.transform(item);
  await client.saveObjects({ indexName: collection, objects }); // v5 saveObjects :contentReference[oaicite:4]{index=4}
  console.log(`Indexed ${objects.length} record(s) for ${itemId}`);
}

async function handleDelete(collection, itemId) {
  const { results } = await client.search({
    requests: [{
      indexName: collection,
      query: '',
      filters: `id:${itemId}`,
      attributesToRetrieve: ['objectID'],
      hitsPerPage: 1000,
      distinct: false,
    }],
  }); // search API v5 :contentReference[oaicite:5]{index=5}

  const hits = results?.[0]?.hits ?? [];
  if (!hits.length) return;

  await client.deleteObjects({
    indexName: collection,
    objectIDs: hits.map(h => h.objectID),
  });
  console.log(`Deleted ${hits.length} record(s) for ${itemId}`);
}

// ─── Webhook entry ───────────────────────────────────────────────────────────
export default async (req, ctx) => {
  try {
    const { id: itemId, action } = await req.json();
    const [collection, , event] = action.split('.');

    if (!COLLECTION_CONFIG[collection]) {
      console.log(`Unhandled collection: ${collection}`); return;
    }

    if (event === 'create')            await handleUpsert(collection, itemId);
    else if (event === 'update') {     await handleDelete(collection, itemId);
                                        await handleUpsert(collection, itemId); }
    else if (event === 'delete')       await handleDelete(collection, itemId);
    else                               console.log(`Unhandled event: ${event}`);
  } catch (err) {
    console.error('Webhook error:', err);
  }
};
