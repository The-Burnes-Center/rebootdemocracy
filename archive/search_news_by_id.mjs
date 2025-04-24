// search_news_by_id.mjs (v1.24 safe — no .withSort)
// -------------------------------------------------------------
// Retrieve all RebootWeeklyNewsItem objects that belong to one
// Directus edition (directusId).
// Usage:
//   node search_news_by_id.mjs --id 62 --limit 20
// -------------------------------------------------------------
// ENV needed (Vite style):
//   VITE_WEAVIATE_HOST, VITE_WEAVIATE_APIKEY, VITE_OPENAI_API_KEY

import 'dotenv/config';
import weaviate from 'weaviate-ts-client';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**************** CLI *****************/
const { id, limit } = yargs(hideBin(process.argv))
  .option('id',    { type: 'number', demandOption: true, describe: 'Directus edition id' })
  .option('limit', { type: 'number', default: 20 })
  .parse();

/**************** Weaviate client *****/
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

/**************** Query ***************/
const NEWS_FIELDS = `
  title
  directusId
  itemDirectusId
  itemTitle
  itemDescription
  itemAuthor
  itemCategory
  itemPublication
  itemUrl
  _additional { id }
`;

(async () => {
  try {
    const out = await wv.graphql
      .get()
      .withClassName('RebootWeeklyNewsItem')
      .withFields(NEWS_FIELDS)
      .withWhere({ path: ['directusId'], operator: 'Equal', valueInt: id })
      .withLimit(limit)
      .do();

    console.log(JSON.stringify(out.data.Get.RebootWeeklyNewsItem, null, 2));
  } catch (err) {
    console.error('Query failed:', err.message || err);
    process.exit(1);
  }
})();
