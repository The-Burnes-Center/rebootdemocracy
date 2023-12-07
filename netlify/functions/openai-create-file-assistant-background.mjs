// create and adding to assistant 
// Upload a file with an "assistants" purpose

import OpenAI from "openai";
import FormData from "form-data";
import axios from "axios";


const DIRECTUS_URL = process.env.DIRECTUS_URL
const DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_AUTH_TOKEN
const REBOOT_DEMOCRACY_ASSISTANT_ID = process.env.REBOOT_DEMOCRACY_ASSISTANT_ID

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to make requests to Directus API
async function directusFetch(endpoint, method = 'GET', body = null) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${DIRECTUS_AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Directus API request failed: ${response.status} - ${errorDetails}`);
  }

  return response.json();
}

// Function to read an item from a collection by ID
async function readDirectusItem(collection, itemId) {
    const endpoint = `/items/${collection}/${itemId}?fields=id,slug,content,excerpt,title,date_created,authors.team_id.*`;
    return directusFetch(endpoint);
  }

  async function retrieveFiles(assistantFiles,tempname, type) {

    const filePromises = assistantFiles.data.map(async (f) => {
      
      const file = await openai.files.retrieve(f.id);

        if(file.filename == tempname)
        {
          console.log(type, f.id, file.filename)
          if(type == 'assistant')
          {
            const deletedAssistantFile = await openai.beta.assistants.files.del(
              "asst_XBK7BcSwGLtDv4PVvN5nKFaB",
              file.id
            );
          }else if(type == 'all')
          {
            const file = await openai.files.del(f.id);
          }

        }
      return file; // This will allow you to use the file data outside, if needed
    });
    return Promise.all(filePromises);
  }

async function main(bodyres) {
  // Write JSON to a file
  // var bodyres = {collection:"reboot_democracy_blog",id:28180}
  const article = await readDirectusItem(bodyres.collection, bodyres.id);
  const { slug  } = article.data;

  if(bodyres.collection == 'blog') article.data['link']= "https://blog.thegovlab.org/"+slug;
  if(bodyres.collection == 'reboot_democracy_blog')  article.data['link']= "https://rebootdemocracy.ai/blog/"+slug;

  
  var tempname =  bodyres.collection+'_'+slug + '.json';
  const allFiles = await openai.files.list();
  const assistantFiles = await openai.beta.assistants.files.list(
    "asst_XBK7BcSwGLtDv4PVvN5nKFaB"
  );

  const assistantFielsPurge = await retrieveFiles(assistantFiles,tempname, 'assisstant');

  console.log(`purge of ${tempname} done in assistant`)

  // const allFielsPurge = retrieveFiles(allFiles,tempname, 'all');

  console.log(`purge of ${tempname} done in all files`)
  
  

  const buffer = Buffer.from(JSON.stringify(article.data), 'utf-8');

  try {
      // Upload the file
      const formData = new FormData();
      formData.append('file', buffer, bodyres.collection+'_'+slug + '.json');
      formData.append('purpose', 'assistants');

      // Merge custom headers with form-data headers
      const headers = {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      };

      // Use axios to send the request
      const response = await axios.post('https://api.openai.com/v1/files', formData, { headers });
  
      // Handle the file upload response
      const file = response.data;
  
      // Attach the file to the assistant
      const assistantId = "asst_XBK7BcSwGLtDv4PVvN5nKFaB";
      const myAssistantFile = await openai.beta.assistants.files.create(
        assistantId,
        { file_id: file.id }
      );
  
      console.log('Assistant file created:', myAssistantFile);
  } catch (error) {
      console.error('Error:', error);
  }
}

export default async (req, context) => {
    const bodyres = await req.json();
    await main(bodyres);
  };
  


