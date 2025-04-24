// import_all_reboot_content_to_weaviate.mjs (v4 – purge‑then‑import)
// -------------------------------------------------------------
// • Purges ALL objects in RebootBlogPostChunk and
//   RebootWeeklyNewsItem first, then re‑imports everything.
// • Handles up to ~10k objects per class (adjust CHUNK_LIMIT if
//   you have more).
// -------------------------------------------------------------
//   node import_all_reboot_content_to_weaviate.mjs

import 'dotenv/config';
import weaviate from 'weaviate-ts-client';
import { htmlToText } from 'html-to-text';
import fetch from 'node-fetch';
import { v5 as uuidv5 } from 'uuid';

const UUID_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const makeUuid = (s) => uuidv5(s, UUID_NS);
const MAX_CHUNK_BYTES = 7000;
const CHUNK_LIMIT = 2000;            // delete batch size

const { DIRECTUS_URL, DIRECTUS_AUTH_TOKEN } = process.env;
if (!DIRECTUS_URL || !DIRECTUS_AUTH_TOKEN) throw new Error('DIRECTUS_URL and DIRECTUS_AUTH_TOKEN required');

function resolveHost() { const raw = process.env.VITE_WEAVIATE_HOST?.trim(); if (raw && /^https?:\/\//i.test(raw)) { const u = new URL(raw); return { scheme: u.protocol.replace(':', ''), host: u.port ? `${u.hostname}:${u.port}` : u.hostname }; } return { scheme: process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https', host: raw || 'localhost:8080' } }
const { scheme, host } = resolveHost();

const wv = weaviate.client({ scheme, host, apiKey: process.env.VITE_WEAVIATE_APIKEY ? new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY) : undefined, headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY || '' } });

/************** helpers ****************************************/
const strip = (h) => htmlToText(h || '', { wordwrap: false, selectors: [{ selector: 'a', options: { ignoreHref: true } }] });
const bytes = (s) => Buffer.byteLength(s, 'utf8');
const toRFC = (d) => !d ? null : /[zZ]|[+-]\d\d:\d\d$/.test(d) ? d : new Date(d + 'Z').toISOString();

async function fetchAll(col, fields) { const url = new URL(`${DIRECTUS_URL}/items/${col}`); url.searchParams.set('fields', fields); url.searchParams.set('filter[status][_eq]', 'published'); url.searchParams.set('limit', '-1'); const r = await fetch(url, { headers: { Authorization: `Bearer ${DIRECTUS_AUTH_TOKEN}` } }); if (!r.ok) throw new Error(`${col} ${r.status}`); return (await r.json()).data; }

async function purgeClass(className) {
  let total = 0, round = 0;
  while (true) {
    const res = await wv.graphql.get().withClassName(className).withFields('_additional { id }').withLimit(CHUNK_LIMIT).do();
    const ids = (res.data.Get[className] || []).map(o => o._additional.id);
    if (ids.length === 0) break;
    for (const id of ids) { await wv.data.deleter().withClassName(className).withId(id).do(); }
    total += ids.length; round++;
    if (ids.length < CHUNK_LIMIT) break;
  }
  console.log(`✗ Purged ${total} objects from ${className}`);
}

function chunkBlog(p) { const words = strip(p.content).split(' '); let part = 0, cur = '', curB = 0; const out = []; for (const w of words) { const blk = w + ' '; const b = bytes(blk); if (curB + b > MAX_CHUNK_BYTES && cur) { out.push({ ...p, part, contentPlain: cur.trim(), objectId: `${p.id}_part${part}` }); part++; cur = blk; curB = b; } else { cur += blk; curB += b; } } if (cur.trim()) out.push({ ...p, part, contentPlain: cur.trim(), objectId: `${p.id}_part${part}` }); return out; }

function flattenNews(ed) { return (ed.items || []).map(({ reboot_democracy_weekly_news_items_id: n = {} }) => ({ directusId: ed.id, objectId: `${ed.id}_${n.id}`, title: ed.title, summary: ed.summary, author: ed.author, date: toRFC(ed.date), edition: ed.edition, itemTitle: n.title || n.headline || '', itemDescription: n.description || n.excerpt || n.summary || '', itemAuthor: n.author || '', itemCategory: n.category || '', itemDate: toRFC(n.date), itemDirectusId: n.id || null, itemPublication: n.publication || '', itemUrl: n.url || '', itemImage: n.image_id || '' })); }

async function importBlogs() { const f = 'id,status,image.id,image.filename_disk,date,Tags,authors.team_id.*,title,content,slug,excerpt,fullURL,audio_version.filename_disk'; const posts = await fetchAll('reboot_democracy_blog', f); let n = 0; for (const p of posts) { const authors = (p.authors || []).map(a => `${a.team_id.First_Name} ${a.team_id.Last_Name}`); for (const c of chunkBlog(p)) { await wv.data.creator().withClassName('RebootBlogPostChunk').withId(makeUuid(c.objectId)).withProperties({ ...c, content: c.contentPlain, tags: c.Tags, authors, date: toRFC(c.date) }).do(); n++; } } console.log(`✓ Blog import ${n}`); }

async function importNews() { const f = 'id,title,summary,author,edition,status,date,items.reboot_democracy_weekly_news_items_id.*'; const eds = await fetchAll('reboot_democracy_weekly_news', f); let n = 0; for (const ed of eds) { for (const itm of flattenNews(ed)) { await wv.data.creator().withClassName('RebootWeeklyNewsItem').withId(makeUuid(itm.objectId)).withProperties(itm).do(); n++; } } console.log(`✓ News import ${n}`); }

(async () => {
  try {
    //await purgeClass('RebootBlogPostChunk');
    await purgeClass('RebootWeeklyNewsItem');
    //await importBlogs();
    await importNews();
    console.log(`✅ finished at ${scheme}://${host}`);
  } catch (e) { console.error('import failed', e); process.exit(1); }
})();
