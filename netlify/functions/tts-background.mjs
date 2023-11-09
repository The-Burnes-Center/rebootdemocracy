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
              async function generateAndUploadSpeech(text,date_updated) {
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
                  filename: bodyres.collection+'_'+bodyres.id+'_'+date_updated+'.mp3', // The filename
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
                  try {
                    // Read an article from the 'articles' collection with the provided ID
                    const article = await readDirectusItem('articles', articleId);
                    console.log('Retrieved article:', article);
                
                    // Extract the content and date updated from the article
                    const { content, date_updated } = article.data;
                
                    // Check the content length and split if necessary
                    if (content.length > 4096) {
                      const chunks = splitText(content, 4096);
                      for (const chunk of chunks) {
                        await generateAndUploadSpeech(chunk, date_updated);
                      }
                    } else {
                      await generateAndUploadSpeech(content, date_updated);
                    }
                  } catch (error) {
                    console.error('Error in processing article and generating speech:', error);
                  }
                } catch (error) {
                  console.error('Error in process:', error);
                }
              }
              
              // Start the process
              runProcess();


              //// hELPER FUNCTION 

              // Helper function to split text into chunks by paragraphs or sentences
function splitText(text, maxLength) {
  const sentenceEndings = /[.!?]\s/; // Define sentence ending characters
  let chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + maxLength;
    if (endIndex < text.length) {
      // Find the last sentence ending before the maxLength
      let lastSentenceEnd = text.lastIndexOf(sentenceEndings, endIndex) + 1;
      // If there's no sentence ending, find the next one
      if (lastSentenceEnd <= startIndex) {
        lastSentenceEnd = text.indexOf(sentenceEndings, endIndex) + 1 || text.length;
      }
      // Add the chunk and increment the startIndex
      chunks.push(text.substring(startIndex, lastSentenceEnd));
      startIndex = lastSentenceEnd;
    } else {
      // Add the rest of the text as the last chunk
      chunks.push(text.substring(startIndex));
      break;
    }
  }

  return chunks;
}


              /////////////
              

};