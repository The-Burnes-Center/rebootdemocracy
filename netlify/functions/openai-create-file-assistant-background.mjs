// create and adding to assistant 
// Upload a file with an "assistants" purpose

import OpenAI from "openai";
import fs from "fs";
import { Readable } from 'stream';


const DIRECTUS_URL = process.env.DIRECTUS_URL
const DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_AUTH_TOKEN

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
    const endpoint = `/items/${collection}/${itemId}?fields=*.*,authors.team_id.*`;
    return directusFetch(endpoint);
  }


async function main(bodyres) {
  // Write JSON to a file

  const article = await readDirectusItem(bodyres.collection, bodyres.id);
  const { slug } = article.data;
  
  if(bodyres.collection == 'blog') article.data['link']= "https://blog.thegovlab.org/"+slug;
  if(bodyres.collection == 'reboot_democracy_blog')  article.data['link']= "https://rebootdemocracy.ai/blog/"+slug;

  console.log(article.data);
  const jsonStream = Readable.from(JSON.stringify(article.data));

  try {
      // Upload the file
      const file = await openai.files.create({
          file: jsonStream,
          purpose: "assistants",
      });

      // Attach the file to the assistant
      const assistantId = process.env.REBOOT_DEMOCRACY_ASSISTANT_ID; // Replace with your actual assistant ID
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
  


