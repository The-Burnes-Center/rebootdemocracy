import OpenAI from 'openai';
import FormData from 'form-data';
import fetch from 'node-fetch';


export default async (req, context) => {
        const bodyres = await req.json();
        console.log(bodyres);

              // Configuration variables
              const DIRECTUS_URL = process.env.DIRECTUS_URL 
              const DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_AUTH_TOKEN 
        
        const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
              });
              
              async function generateAndUploadSpeech(text) {
                const response = await openai.audio.speech.create({
                  model: "tts-1-hd",
                  voice: "shimmer",
                  input: text,
                });
              
                // Check the response is OK
                if (response.status !== 200) {
                  throw new Error('Failed to generate speech from OpenAI.');
                }
              
                // Collect stream data into a buffer
                const chunks = [];
                for await (const chunk of response.body) {
                  chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
                }
                const buffer = Buffer.concat(chunks);
              
                // Create form-data instance
                const form = new FormData();
                form.append('file', buffer, {
                  filename: bodyres.collection+'_'+bodyres.id+'.mp3', // The filename
                  contentType: 'audio/mpeg', // The MIME type of the audio
                  knownLength: buffer.length // Optional, necessary for some setups to calculate Content-Length
                });
              
                const directusFileEndpoint = DIRECTUS_URL+'/files';
              
                // Prepare the request headers with the Bearer token
                const headers = {
                  'Authorization': 'Bearer '+DIRECTUS_AUTH_TOKEN, // replace with an actual token
                };
              
                // Merge the headers from form-data with Directus token
                const finalHeaders = { ...form.getHeaders(), ...headers };
              
                // Make the request to Directus to upload the file
                const fileResponse = await fetch(directusFileEndpoint, {
                    method: 'POST',
                    body: form,
                    headers: finalHeaders
                });
              
                if (!fileResponse.ok) {
                    const errorBody = await fileResponse.text();
                    throw new Error(`Error uploading file: ${errorBody}`);
                }
              
                const directusResponse = await fileResponse.json();
              
                return directusResponse;
              }
              


              
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
                const endpoint = `/items/${collection}/${itemId}`;
                return directusFetch(endpoint);
              }
              
              // Function to upload speech (placeholder, replace with your actual implementation)
              async function generateAndUploadSpeech(text) {
                const response = await openai.audio.speech.create({
                  model: "tts-1-hd",
                  voice: "shimmer",
                  input: text,
                });
              
                // Check the response is OK
                if (response.status !== 200) {
                  throw new Error('Failed to generate speech from OpenAI.');
                }
              
                // Collect stream data into a buffer
                const chunks = [];
                for await (const chunk of response.body) {
                  chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
                }
                const buffer = Buffer.concat(chunks);
              
                // Create form-data instance
                const form = new FormData();
                form.append('file', buffer, {
                  filename: bodyres.collection+'_'+bodyres.id+'.mp3', // The filename
                  contentType: 'audio/mpeg', // The MIME type of the audio
                  knownLength: buffer.length // Optional, necessary for some setups to calculate Content-Length
                });
              
                const directusFileEndpoint =DIRECTUS_URL+'/files';
              
                // Prepare the request headers with the Bearer token
                const headers = {
                  'Authorization': 'Bearer '+DIRECTUS_AUTH_TOKEN, // replace with an actual token
                };
              
                // Merge the headers from form-data with Directus token
                const finalHeaders = { ...form.getHeaders(), ...headers };
              
                // Make the request to Directus to upload the file
                const fileResponse = await fetch(directusFileEndpoint, {
                    method: 'POST',
                    body: form,
                    headers: finalHeaders
                });
              
                if (!fileResponse.ok) {
                    const errorBody = await fileResponse.text();
                    throw new Error(`Error uploading file: ${errorBody}`);
                }
              
                const directusResponse = await fileResponse.json();
              
                return directusResponse;
              }
              
              // Main function to run the process
              async function runProcess() {
                try {
                  // Read an item from the 'articles' collection with an ID of 5
                  const article = await readDirectusItem(bodyres.collection, bodyres.id);
                  console.log('Retrieved article:', article);
                  
                  // Extract the content field from the article
                  const content = article.data.text_to_speech; // Adjust 'content' to the field you want
              
                  // Call the next function with the article content
                  await generateAndUploadSpeech(content);
                } catch (error) {
                  console.error('Error in process:', error);
                }
              }
              
              // Start the process
              runProcess();


              /////////////
              

};