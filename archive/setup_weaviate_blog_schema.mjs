// setup_reboot_blog_schema_v124.mjs (loads .env)
// -------------------------------------------------------------
// For Weaviate v1.24.1 + weaviate‑ts‑client@1.x
// • Loads environment variables from a local .env file via `dotenv`
// • Accepts WEAVIATE_URL   *or* VITE_WEAVIATE_HOST/_SCHEME, etc.
// -------------------------------------------------------------
//   npm i weaviate-ts-client@1 dotenv
//   echo "WEAVIATE_URL=http://localhost:8080" > .env
//   node setup_reboot_blog_schema_v124.mjs

import 'dotenv/config';              // zero‑config .env loader (ESM‑friendly)
import weaviate from 'weaviate-ts-client';

/************** 1 · Resolve connection params *******************/
function resolveConnection() {
  /* Priority 1: explicit full URL */
  if (process.env.WEAVIATE_URL) {
    const { protocol, hostname, port } = new URL(process.env.WEAVIATE_URL);
    return { scheme: protocol.replace(':', ''), host: port ? `${hostname}:${port}` : hostname };
  }

  /* Priority 2: Vite / Netlify style variables */
  if (process.env.VITE_WEAVIATE_HOST) {
    const raw = process.env.VITE_WEAVIATE_HOST.trim();
    if (/^https?:\/\//i.test(raw)) {
      const { protocol, hostname, port } = new URL(raw);
      return { scheme: protocol.replace(':', ''), host: port ? `${hostname}:${port}` : hostname };
    }
    const scheme = process.env.VITE_WEAVIATE_HTTP_SCHEME || 'https';
    return { scheme, host: raw };
  }

  /* Priority 3: individual pieces */
  const scheme = process.env.WEAVIATE_SCHEME || 'http';
  const host   = process.env.WEAVIATE_HOST   || 'localhost';
  const port   = process.env.WEAVIATE_PORT   || '8080';
  return { scheme, host: port ? `${host}:${port}` : host };
}

const { scheme, host } = resolveConnection();
const apiKeyHeader = process.env.WEAVIATE_API_KEY || process.env.VITE_WEAVIATE_APIKEY
  ? new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || process.env.VITE_WEAVIATE_APIKEY)
  : undefined;

const client = weaviate.client({
  scheme,
  host,
  apiKey: apiKeyHeader,
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '',
  },
});

/************** 2 · Idempotent schema creator *******************/
async function ensureClass(def) {
  const schema = await client.schema.getter().do();
  const exists = schema.classes?.some((c) => c.class === def.class);
  if (exists) {
    console.log(`✔  ${def.class} already exists`);
  } else {
    console.log(`➜  Creating ${def.class} …`);
    await client.schema.classCreator().withClass(def).do();
    console.log('✔  created');
  }
}

/************** 3 · Main ****************************************/
(async () => {
  try {
    await ensureClass({
      class: 'RebootBlogPostChunk',
      description: 'Chunked Reboot Democracy blog article (Directus)',
      vectorizer: 'text2vec-openai',
      moduleConfig: { 'text2vec-openai': { vectorizeClassName: false } },
      properties: [
        { name: 'directusId', dataType: ['int'],  moduleConfig: { 'text2vec-openai': { skip: true } } },
        { name: 'objectId',   dataType: ['text'], moduleConfig: { 'text2vec-openai': { skip: true } } },
        { name: 'title',       dataType: ['text'] },
        { name: 'excerpt',     dataType: ['text'] },
        { name: 'content',     dataType: ['text'] },
        { name: 'tags',        dataType: ['text[]'] },
        { name: 'authors',     dataType: ['text[]'] },
        { name: 'date',        dataType: ['date'] },
        { name: 'slug',        dataType: ['text'], moduleConfig: { 'text2vec-openai': { skip: true } } },
        { name: 'status',      dataType: ['text'], moduleConfig: { 'text2vec-openai': { skip: true } } },
        { name: 'fullUrl',     dataType: ['text'], moduleConfig: { 'text2vec-openai': { skip: true } } },
        { name: 'part',        dataType: ['int'],  moduleConfig: { 'text2vec-openai': { skip: true } } },
        { name: 'audioFilename', dataType: ['text'], moduleConfig: { 'text2vec-openai': { skip: true } } },
        { name: 'imageFilename', dataType: ['text'], moduleConfig: { 'text2vec-openai': { skip: true } } },
        { name: 'imageId',       dataType: ['text'], moduleConfig: { 'text2vec-openai': { skip: true } } },
      ],
    });
    console.log(`✓ Schema ensured at ${scheme}://${host}`);
  } catch (err) {
    console.error('✖  Failed to connect or create schema');
    console.error('   Host:', `${scheme}://${host}`);
    console.error('   Error:', err.message || err);
    process.exitCode = 1;
  }
})();
