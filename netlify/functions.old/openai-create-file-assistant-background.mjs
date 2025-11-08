// create and adding to assistant 
// Upload a file with an "assistants" purpose

import OpenAI from "openai";
import FormData from "form-data";
import axios from "axios";


const DIRECTUS_URL = process.env.DIRECTUS_URL
const REBOOT_DEMOCRACY_ASSISTANT_ID = process.env.REBOOT_DEMOCRACY_ASSISTANT_ID


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to make requests to Directus API
async function directusFetch(endpoint, method = 'GET', body = null) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const headers = {
    // 'Authorization': `Bearer ${DIRECTUS_AUTH_TOKEN}`,
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
async function readDirectusItem(collection) {
    // const endpoint = `/items/${collection}/${itemId}?fields=id,slug,content,excerpt,title,date_created,authors.team_id.*`;
    const endpoint = `/items/${collection}?limit=-1&fields=id,slug,content,excerpt,title,date,authors.team_id.*&sort=-date&filter={ "status": { "_eq": "published" }}`;
    return directusFetch(endpoint);
  }

  async function retrieveFiles(openAiFiles, tempname, type) {
    let fileDetails = [];

    for (const f of openAiFiles.data) {
        const file = await openai.files.retrieve(f.id);

        if (file.filename === tempname) {
            console.log(type, f.id, file.filename);

            if (type === 'assistant') {
                const deletedAssistantFile = await openai.beta.assistants.files.del(
                  REBOOT_DEMOCRACY_ASSISTANT_ID,
                    f.id
                );
                console.log(deletedAssistantFile);
            } else if (type === 'all') {
                const deletedFile = await openai.files.del(f.id);
                console.log(deletedFile);
            }
        }

        fileDetails.push(file); // This will allow you to use the file data outside, if needed
    }

    return fileDetails;
}

async function main() {
// async function main(bodyres) {
  // Write JSON to a file
  var bodyres = {collection:"reboot_democracy_blog"}
  const article = await readDirectusItem(bodyres.collection);  
  
  article.data.map((e,i)=>{
    if(bodyres.collection == 'blog') article.data[i]['link']= "https://blog.thegovlab.org/"+e.slug;
    if(bodyres.collection == 'reboot_democracy_blog')  article.data[i]['link']= "https://rebootdemocracy.ai/blog/"+e.slug;
  })
  
  var tempname =  'reboot_democracy_blog_entries_2024.txt';
  const allFiles = await openai.files.list();
  const assistantFiles = await openai.beta.assistants.files.list(
    REBOOT_DEMOCRACY_ASSISTANT_ID
  );

  const assistantFielsPurge = await retrieveFiles(assistantFiles,tempname, 'assistant');

  console.log(`purge of ${tempname} done in assistant`)

  const allFielsPurge = await retrieveFiles(allFiles,tempname, 'all');

  console.log(`purge of ${tempname} done in all files`)
  console.log("article",article.data[0].date,article.data[0].link,);
  
    // Convert JSON data to plain text format
    let textContent = article.data.map(e => 
      `Date: ${e.date}\n` +
      `Title: ${e.title}\n` +
      `Link: ${e.link}\n` +
      `Link: ${e.slug}\n` +
      `Content: ${e.content}\n` // Assuming each entry has a 'content' field
    ).join("\n\n");
      
    const buffer = Buffer.from(textContent, 'utf-8');

  try {
      // Upload the file
      const formData = new FormData();
      formData.append('file', buffer, 'reboot_democracy_blog_entries_2024.txt');
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
      const myAssistantFile = await openai.beta.assistants.files.create(
        REBOOT_DEMOCRACY_ASSISTANT_ID,
        { file_id: file.id }
      );
  
      console.log('Assistant file created:', myAssistantFile);
  } catch (error) {
      console.error('Error:', error);
  }
}

export default async (req, context) => {
    // const bodyres = await req.json();
    // await main(bodyres);
    await main();
  };
  

