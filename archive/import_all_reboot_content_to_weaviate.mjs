// import_all_reboot_content_to_weaviate.mjs (UUID + RFC3339 dates)
// -------------------------------------------------------------
// Fetches *published* blog posts + weekly‑news editions from
// Directus and indexes them into Weaviate (only).
// • Generates UUID‑v5 IDs acceptable to Weaviate.
// • Normalises all date strings to RFC3339 (UTC) to satisfy schema.
// -------------------------------------------------------------
// Expected env (Vite style):
//   DIRECTUS_URL, DIRECTUS_AUTH_TOKEN
//   VITE_WEAVIATE_HOST, VITE_WEAVIATE_APIKEY, VITE_OPENAI_API_KEY
// -------------------------------------------------------------
//   npm i dotenv weaviate-ts-client@1 html-to-text node-fetch@3 uuid
//   node import_all_reboot_content_to_weaviate.mjs

import 'dotenv/config';
import weaviate from 'weaviate-ts-client';
import { htmlToText } from 'html-to-text';
import fetch from 'node-fetch';
import { v5 as uuidv5 } from 'uuid';

/****************  Constants  ***********************************/
const UUID_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const makeUuid = (str) => uuidv5(str, UUID_NS);
const MAX_CHUNK_BYTES = 7000;

/****************  ENV validation  ******************************/
const DIRECTUS_URL        = process.env.DIRECTUS_URL;
const DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_AUTH_TOKEN;
if (!DIRECTUS_URL || !DIRECTUS_AUTH_TOKEN) {
  console.error('❌  DIRECTUS_URL and DIRECTUS_AUTH_TOKEN must be set');
  process.exit(1);
}

/****************  Weaviate client  *****************************/
function resolveHost() {
  if (process.env.VITE_WEAVIATE_HOST) {
    const raw = process.env.VITE_WEAVIATE_HOST.trim();
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      return { scheme: u.protocol.replace(':', ''), host: u.port ? `${u.hostname}:${u.port}` : u.hostname };
    }
    return { scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https', host: raw };
  }
  console.warn('⚠️  VITE_WEAVIATE_HOST not set – defaulting to http://localhost:8080');
  return { scheme: 'http', host: 'localhost:8080' };
}

const { scheme, host } = resolveHost();
const wvClient = weaviate.client({
  scheme,
  host,
  apiKey: process.env.VITE_WEAVIATE_APIKEY ? new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY) : undefined,
  headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY || '' },
});

/****************  Helper functions  ****************************/
const byteLen = (s) => Buffer.byteLength(s, 'utf8');
const stripHtml = (h) => htmlToText(h || '', { wordwrap: false, selectors: [{ selector: 'a', options: { ignoreHref: true } }] });
const toRFC3339 = (d) => {
  if (!d) return null;
  if (/[zZ]|[+-]\d\d:\d\d$/.test(d)) return d; // already RFC3339
  return new Date(d + 'Z').toISOString();         // assume UTC midnight
};

async function fetchAll(collection, fields) {
  const url = new URL(`${DIRECTUS_URL}/items/${collection}`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('filter[status][_eq]', 'published');
  url.searchParams.set('limit', '-1');
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${DIRECTUS_AUTH_TOKEN}` } });
  if (!r.ok) throw new Error(`${collection} ${r.status}`);
  return (await r.json()).data;
}

/****************  Transformations  *****************************/
function chunkBlog(post) {
  const plain = stripHtml(post.content);
  const words = plain.split(' ');
  let part = 0, cur = '', curBytes = 0;
  const chunks = [];
  for (const w of words) {
    const blk = w + ' ';
    const b   = byteLen(blk);
    if (curBytes + b > MAX_CHUNK_BYTES && cur) {
      chunks.push({ ...post, part, contentPlain: cur.trim(), objectId: `${post.id}_part${part}` });
      part++; cur = blk; curBytes = b;
    } else { cur += blk; curBytes += b; }
  }
  if (cur.trim()) chunks.push({ ...post, part, contentPlain: cur.trim(), objectId: `${post.id}_part${part}` });
  return chunks;
}

function flattenNews(edition) {
  return (edition.items || []).map(({ reboot_democracy_weekly_news_items_id: n = {} }) => ({
    directusId: edition.id,
    objectId: `${edition.id}_${n.id}`,
    title: edition.title,
    summary: edition.summary,
    author: edition.author,
    date: toRFC3339(edition.date),
    edition: edition.edition,
    itemDirectusId: n.id,
    itemTitle: n.title || n.headline || '',
    itemDescription: n.excerpt || n.summary || '',
    itemAuthor: n.author,
    itemCategory: n.category,
    itemPublication: n.publication,
    itemUrl: n.url || '',
    itemImage: n.image_id || '',
  }));
}

/****************  Importers  ***********************************/
async function importBlogs() {
  const fields = 'id,status,image.id,image.filename_disk,date,Tags,authors.team_id.*,title,content,slug,excerpt,fullURL,audio_version.filename_disk';
  const posts  = await fetchAll('reboot_democracy_blog', fields);
  let n = 0;
  for (const p of posts) {
    const baseAuthors = (p.authors || []).map(a => `${a.team_id.First_Name} ${a.team_id.Last_Name}`);
    for (const c of chunkBlog(p)) {
      await wvClient.data.creator()
        .withClassName('RebootBlogPostChunk')
        .withId(makeUuid(c.objectId))
        .withProperties({
          objectId: c.objectId,
          directusId: c.id,
          title: c.title,
          excerpt: c.excerpt,
          content: c.contentPlain,
          tags: c.Tags,
          authors: baseAuthors,
          date: toRFC3339(c.date),
          slug: c.slug,
          status: c.status,
          fullUrl: c.fullURL,
          part: c.part,
          audioFilename: c.audio_version?.filename_disk || null,
          imageFilename: c.image?.filename_disk || null,
          imageId: c.image?.id || null,
        }).do();
      n++;
    }
  }
  console.log(`✓ Blog import done (${n} chunks)`);
}

async function importNews() {
  const fields = 'id,title,summary,author,edition,status,date,items.reboot_democracy_weekly_news_items_id.*';
  const editions = await fetchAll('reboot_democracy_weekly_news', fields);
  let n = 0;
  for (const ed of editions) {
    for (const itm of flattenNews(ed)) {
      await wvClient.data.creator()
        .withClassName('RebootWeeklyNewsItem')
        .withId(makeUuid(itm.objectId))
        .withProperties(itm)
        .do();
      n++;
    }
  }
  console.log(`✓ Weekly news import done (${n} items)`);
}

/****************  Main  ****************************************/
(async () => {
  try {
    await importBlogs();
    await importNews();
    console.log(`✅  Imported into Weaviate at ${scheme}://${host}`);
  } catch (e) {
    console.error('❌  Import failed:', e.message || e);
    process.exit(1);
  }
})();
