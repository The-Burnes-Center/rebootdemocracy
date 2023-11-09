import OpenAI from 'openai';
import FormData from 'form-data';
import fetch from 'node-fetch';

export default async (req, context) => {
        const bodyres = await req.json();
        console.log(bodyres);
        console.log(bodyres.slug);

        
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
                  filename: bodyres.slug+'.mp3', // The filename
                  contentType: 'audio/mpeg', // The MIME type of the audio
                  knownLength: buffer.length // Optional, necessary for some setups to calculate Content-Length
                });
              
                const directusFileEndpoint = process.env.DIRECTUS_URL+'/files';
              
                // Prepare the request headers with the Bearer token
                const headers = {
                  'Authorization': 'Bearer '+process.env.DIRECTUS_AUTH_TOKEN, // replace with an actual token
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
              
              // Call the function with your desired text
              generateAndUploadSpeech(bodyres.content).catch(console.error);

};