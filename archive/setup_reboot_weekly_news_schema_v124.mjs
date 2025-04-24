// setup_reboot_weekly_news_schema_v124.mjs (v2 – extended fields)
// -------------------------------------------------------------
// Adds missing item‑level fields (author, category, date, etc.)
// to the existing RebootWeeklyNewsItem class, or creates the
// class from scratch if it’s not present yet.
// -------------------------------------------------------------
// 1. npm i weaviate-ts-client@1 dotenv
// 2. node setup_reboot_weekly_news_schema_v124.mjs

import 'dotenv/config';
import weaviate from 'weaviate-ts-client';

/****************  Resolve connection  ****************/
function resolve() {
  const raw = process.env.VITE_WEAVIATE_HOST || process.env.WEAVIATE_URL;
  if (raw && /^https?:\/\//.test(raw)) {
    const u = new URL(raw);
    return { scheme: u.protocol.replace(':',''), host: u.port?`${u.hostname}:${u.port}`:u.hostname };
  }
  return { scheme: 'http', host: 'localhost:8080' };
}
const { scheme, host } = resolve();

const client = weaviate.client({
  scheme,
  host,
  apiKey: process.env.VITE_WEAVIATE_APIKEY ? new weaviate.ApiKey(process.env.VITE_WEAVIATE_APIKEY) : undefined,
  headers: { 'X-OpenAI-Api-Key': process.env.VITE_OPENAI_API_KEY || '' }
});

/****************  Helpers  ***************************/
async function ensureClass(def) {
  const schema = await client.schema.getter().do();
  const exists = schema.classes?.some(c=>c.class===def.class);
  if (!exists) {
    console.log('Creating class …');
    await client.schema.classCreator().withClass(def).do();
  } else {
    console.log('Class exists – will patch properties');
  }
}

async function ensureProp(className, prop) {
  const cur = await client.schema.getter().do();
  const cls = cur.classes.find(c=>c.class===className);
  if (cls.properties?.some(p=>p.name===prop.name)) return; // already there
  await client.schema.propertyCreator().withClassName(className).withProperty(prop).do();
  console.log('Added prop', prop.name);
}

/****************  Base class definition **************/
const baseClass = {
  class: 'RebootWeeklyNewsItem',
  description: 'Single item inside a Reboot Democracy Weekly News edition',
  vectorizer: 'text2vec-openai',
  moduleConfig: { 'text2vec-openai': { vectorizeClassName: false } },
  properties: [
    { name: 'directusId', dataType:['int'],  moduleConfig:{'text2vec-openai':{skip:true}} },
    { name: 'objectId',   dataType:['text'], moduleConfig:{'text2vec-openai':{skip:true}} },

    { name: 'title',   dataType:['text'] },
    { name: 'summary', dataType:['text'] },
    { name: 'author',  dataType:['text'] },
    { name: 'date',    dataType:['date'] },
    { name: 'edition', dataType:['text'], moduleConfig:{'text2vec-openai':{skip:true}} },

    { name: 'itemTitle',       dataType:['text'] },
    { name: 'itemDescription', dataType:['text'] },
    { name: 'itemAuthor',      dataType:['text'] },
    { name: 'itemCategory',    dataType:['text'] },
    { name: 'itemDate',        dataType:['date'] },
    { name: 'itemDirectusId',  dataType:['int'],  moduleConfig:{'text2vec-openai':{skip:true}} },
    { name: 'itemPublication', dataType:['text'] },
    { name: 'itemUrl',         dataType:['text'] },
    { name: 'itemImage',       dataType:['text'], moduleConfig:{'text2vec-openai':{skip:true}} }
  ]
};

/****************  Main  ******************************/
(async()=>{
  try {
    await ensureClass(baseClass);
    for (const p of baseClass.properties) await ensureProp(baseClass.class, p);
    console.log(`✓ Schema ensured at ${scheme}://${host}`);
  } catch(e){
    console.error('Schema update failed:',e.message||e);
    process.exit(1);
  }
})();
