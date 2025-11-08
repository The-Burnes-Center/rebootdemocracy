// directus_webhook_to_weaviate.mjs
// -------------------------------------------------------------
// Netlify‑style webhook handler: receives a Directus webhook
// payload (collection, id, action) and indexes *one* blog post or
// weekly‑news edition into **Weaviate only**.
// -------------------------------------------------------------
// • Uses the same chunking / flattening logic as the bulk importer
//   (UUID‑v5 IDs, RFC3339 dates).
// • Upsert = delete old objects for that id, then (re)create.
// • Delete = remove all objects belonging to that Directus id.
// -------------------------------------------------------------
// ENV (Vite naming):
//   DIRECTUS_URL, DIRECTUS_AUTH_TOKEN
//   VITE_WEAVIATE_HOST, VITE_WEAVIATE_APIKEY, VITE_OPENAI_API_KEY
// -------------------------------------------------------------
// Exported async function `handler(req, context)` – drop into
// Netlify functions folder or adapt for other runtimes.
// -------------------------------------------------------------

import 'dotenv/config';
import weaviate from 'weaviate-ts-client';
import { htmlToText } from 'html-to-text';
import fetch from 'node-fetch';
import { v5 as uuidv5 } from 'uuid';

/****************  Constants & helpers  *************************/
const UUID_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const makeUuid = (s) => uuidv5(s, UUID_NS);
const MAX_CHUNK_BYTES = 7000;
const byteLen = (s) => Buffer.byteLength(s, 'utf8');
const stripHtml = (h) => htmlToText(h || '', { wordwrap: false, selectors: [{ selector: 'a', options: { ignoreHref: true } }] });
const toRFC3339 = (d) => (!d ? null : /[zZ]|[+-]\d\d:\d\d$/.test(d) ? d : new Date(d + 'Z').toISOString());

/****************  Env & clients  *******************************/
const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_AUTH_TOKEN;

function resolveHost() {
  const raw = process.env.VITE_WEAVIATE_HOST?.trim();
  if (!raw) return { scheme: 'http', host: 'localhost:8080' };
  if (/^https?:\/\//i.test(raw)) {
    const u = new URL(raw);
    return { scheme: u.protocol.replace(':', ''), host: u.port ? `${u.hostname}:${u.port}` : u.hostname };
  }
  return { scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https', host: raw };
}
const { scheme, host } = resolveHost();
const wv = weaviate.client({
  scheme,
  host,
  apiKey: process.env.VITE_WEAVIATE_APIKEY ? new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY) : undefined,
  headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '' },
});

/****************  Directus fetch one item **********************/
async function fetchItemOnce(collection, id, fields) {
  const url = `${DIRECTUS_URL}/items/${collection}/${id}?fields=${fields}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${DIRECTUS_AUTH_TOKEN}` } });
  if (!res.ok) throw new Error(`${collection} ${id} ${res.status}`);
  return (await res.json()).data;
}

/****************  Transformations *****************************/
function chunkBlog(post) {
  const { content, ...meta } = post;
  const plain = stripHtml(content);
  const words = plain.split(' ');
  let part = 0, cur = '', curBytes = 0;
  const out = [];
  for (const w of words) {
    const blk = w + ' ';
    const b = byteLen(blk);
    if (curBytes + b > MAX_CHUNK_BYTES && cur) {
      out.push({ ...meta, contentPlain: cur.trim(), part, objectId: `${post.id}_part${part}` });
      part++; cur = blk; curBytes = b;
    } else { cur += blk; curBytes += b; }
  }
  if (cur.trim()) out.push({ ...meta, contentPlain: cur.trim(), part, objectId: `${post.id}_part${part}` });
  return out;
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



/****************  Upsert & delete ******************************/
async function deleteByDirectusId(className, directusId) {
  // fetch UUIDs whose directusId equals value, then delete
  const where = { path: ['directusId'], operator: 'Equal', valueInt: parseInt(directusId, 10) };
  const res = await wv.graphql.get().withClassName(className).withFields('_additional { id }').withWhere(where).withLimit(200).do();
  const hits = res.data.Get[className] || [];
  for (const h of hits) {
    await wv.data.deleter().withClassName(className).withId(h._additional.id).do();
  }
}

async function upsertBlog(id) {
  const fields = 'id,status,image.id,image.filename_disk,date,Tags,authors.team_id.*,title,content,slug,excerpt,fullURL,audio_version.filename_disk';
  const rec = await fetchItemOnce('reboot_democracy_blog', id, fields);
  if (rec.status !== 'published') return;
  await deleteByDirectusId('RebootBlogPostChunk', id);
  const authorsText = (rec.authors || []).map(a => `${a.team_id.First_Name} ${a.team_id.Last_Name}`);
  for (const c of chunkBlog(rec)) {
    await wv.data.creator()
      .withClassName('RebootBlogPostChunk')
      .withId(makeUuid(c.objectId))
      .withProperties({
        objectId: c.objectId,
        directusId: c.id,
        title: c.title,
        excerpt: c.excerpt,
        content: c.contentPlain,
        tags: c.Tags,
        authors: authorsText,
        date: toRFC3339(c.date),
        slug: c.slug,
        status: c.status,
        fullUrl: c.fullURL,
        part: c.part,
        audioFilename: c.audio_version?.filename_disk || null,
        imageFilename: c.image?.filename_disk || null,
        imageId: c.image?.id || null,
      }).do();
  }
  console.log(`✓ Blog ${id} indexed (${rec.title})`);
}

async function upsertWeeklyNews(id) {
  const fields = 'id,title,summary,author,edition,status,date,items.reboot_democracy_weekly_news_items_id.*';
  const rec = await fetchItemOnce('reboot_democracy_weekly_news', id, fields);
  if (rec.status !== 'published') return;
  await deleteByDirectusId('RebootWeeklyNewsItem', id);
  for (const itm of flattenNews(rec)) {
    await wv.data.creator()
      .withClassName('RebootWeeklyNewsItem')
      .withId(makeUuid(itm.objectId))
      .withProperties(itm)
      .do();
  }
  console.log(`✓ Weekly news edition ${id} indexed`);
}

async function deleteById(collection, id) {
  if (collection === 'reboot_democracy_blog') {
    await deleteByDirectusId('RebootBlogPostChunk', id);
  } else {
    await deleteByDirectusId('RebootWeeklyNewsItem', id);
  }
  console.log(`✓ Deleted all objects for ${collection} ${id}`);
}

/****************  Netlify handler ******************************/
export async function handler(event) {
  try {
        const testPayload = { collection: "reboot_democracy_blog", id: "28156", action: "reboot_democracy_blog.items.update" };
    const { id: itemId, action } = testPayload;
    // const { id: itemId, action } = JSON.parse(event.body);
    const [collection, , eventType] = action.split('.');

    if (!['reboot_democracy_blog', 'reboot_democracy_weekly_news'].includes(collection)) {
      return { statusCode: 200, body: 'ignored' };
    }

    switch (eventType) {
      case 'create':
        collection === 'reboot_democracy_blog' ? await upsertBlog(itemId) : await upsertWeeklyNews(itemId);
        break;
      case 'update':
        await deleteById(collection, itemId);
        collection === 'reboot_democracy_blog' ? await upsertBlog(itemId) : await upsertWeeklyNews(itemId);
        break;
      case 'delete':
        await deleteById(collection, itemId);
        break;
      default:
        console.log('Unhandled event:', eventType);
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, body: 'error' };
  }
}
