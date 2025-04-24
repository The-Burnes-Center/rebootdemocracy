// search_reboot_chunks.mjs
// -------------------------------------------------------------
// CLI tool: search blog‑post chunks + weekly‑news items in Weaviate
// with a natural‑language query.  Prints the top hits as CLI JSON.
// -------------------------------------------------------------
//   ENV (Vite style) needed:
//     VITE_WEAVIATE_HOST, VITE_WEAVIATE_APIKEY, VITE_OPENAI_API_KEY
//   npm i dotenv weaviate-ts-client@1 yargs
//   node search_reboot_chunks.mjs --q "digital skills training"

import 'dotenv/config';
import weaviate from 'weaviate-ts-client';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**************** CLI arg ******************************/
const { q: query, limit } = yargs(hideBin(process.argv))
  .option('q', { alias: 'query', type: 'string', demandOption: true, describe: 'Search query' })
  .option('limit', { type: 'number', default: 10 })
  .help()
  .argv;

/**************** Weaviate client **********************/
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
  headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY || '' },
});

/**************** Fields *******************************/
// const BLOG_FIELDS = `title excerpt part slug fullUrl date content objectId directusId _additional { id distance }`;
const BLOG_FIELDS = `title directusId _additional { id distance }`;
// const NEWS_FIELDS = `title summary itemTitle itemDescription edition date _additional { id distance }`;
const NEWS_FIELDS = `title directusId _additional { id distance }`;

/**************** Helper to run a query ****************/
async function nearTextHits(className, fields) {
  return wv.graphql
    .get()
    .withClassName(className)
    .withFields(fields)
    .withNearText({ concepts: [query] })
    .withLimit(limit)
    .do()
    .then(res => res.data.Get[className] || [])
    .catch(() => []);
}

/**************** Fallback keyword filter **************/
function keywordFilter(hits, prop) {
  const needle = query.toLowerCase();
  return hits.filter(h => (h[prop] || '').toLowerCase().includes(needle));
}

/**************** Main search **************************/
(async () => {
  const blogHits = await nearTextHits('RebootBlogPostChunk', BLOG_FIELDS);
  const newsHits = await nearTextHits('RebootWeeklyNewsItem', NEWS_FIELDS);

  let results = [...blogHits, ...newsHits];

  // Simple fallback if both sets empty
  if (results.length === 0) {
    const [blogRaw, newsRaw] = await Promise.all([
      // wv.graphql.get().withClassName('RebootBlogPostChunk').withFields(BLOG_FIELDS).withLimit(5).do(),
      wv.graphql.get().withClassName('RebootWeeklyNewsItem').withFields(NEWS_FIELDS).withLimit(5).do(),
    ]);
    const b = keywordFilter(blogRaw.data.Get.RebootBlogPostChunk || [], 'content');
    const n = keywordFilter(newsRaw.data.Get.RebootWeeklyNewsItem || [], 'itemDescription');
    results = [...b, ...n].slice(0, limit);
  }

  // Sort by distance if present
  results.sort((a, b) => (a._additional?.distance ?? 1) - (b._additional?.distance ?? 1));

  console.log(JSON.stringify(results, null, 2));
})();
