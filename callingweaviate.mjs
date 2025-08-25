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
  .option('limit', { type: 'number', default: 3 })
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
const BLOG_FIELDS = `title authors directusId fullUrl content _additional { id distance }`;
//const NEWS_FIELDS = `title directusId itemDescription _additional { id distance }`;
const NEWS_FIELDS = "";

/**************** Helper to run a BM25 query ****************/
async function bm25Hits(className, fields) {
  return wv.graphql
    .get()
    .withClassName(className)
    .withFields(fields)
    .withBm25({ query })
    .withLimit(limit)
    .do()
    .then(res => res.data.Get[className] || [])
    .catch(() => []);
}

/**************** Helper to run a nearText query ****************/
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

/**************** Main search **************************/
(async () => {
  // 1. Try BM25 keyword search first
  const [blogBM25, newsBM25] = await Promise.all([
    bm25Hits('RebootBlogPostChunk', BLOG_FIELDS),
    bm25Hits('RebootWeeklyNewsItem', NEWS_FIELDS)
  ]);
  let results = [...blogBM25, ...newsBM25];

  // 2. If BM25 found results, use them; else fallback to nearText
  if (results.length === 0) {
    const [blogHits, newsHits] = await Promise.all([
      nearTextHits('RebootBlogPostChunk', BLOG_FIELDS),
      nearTextHits('RebootWeeklyNewsItem', NEWS_FIELDS)
    ]);
    results = [...blogHits, ...newsHits];
  }

  // Sort by distance if present
  results.sort((a, b) => (a._additional?.distance ?? 1) - (b._additional?.distance ?? 1));

  // Limit to requested number of results
  const finalResults = results.slice(0, limit);

  console.log(JSON.stringify(finalResults, null, 2));
})();