import OpenAI from 'openai';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Configuration variables
const DIRECTUS_URL = process.env.DIRECTUS_URL
const DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_AUTH_TOKEN

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// Helper function to split text into chunks by paragraphs or sentences
function splitText(text, maxLength) {
  const sentenceEndings = ['.', '!', '?']; // Sentence ending characters
  let chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxLength, text.length);
    let lastBreakIndex = startIndex; // Store the last index of a sentence or paragraph break

    // Look for the closest sentence or paragraph break within the current chunk
    for (let i = startIndex; i < endIndex; i++) {
      if (text[i] === '\n' || (sentenceEndings.includes(text[i]) && text[i + 1] && text[i + 1] === ' ')) {
        lastBreakIndex = i + 1;
      }
    }
    
    // If a sentence or paragraph ending was found, use it as the split point
    if (lastBreakIndex > startIndex) {
      chunks.push(text.substring(startIndex, lastBreakIndex));
      startIndex = lastBreakIndex;
    } else {
      // If no suitable break was found within the maxLength, look for the next possible break
      let nextBreakIndex = text.indexOf('\n', endIndex) || text.length;
      for (const ending of sentenceEndings) {
        let nextSentenceIndex = text.indexOf(ending + ' ', endIndex);
        if (nextSentenceIndex !== -1 && (nextSentenceIndex < nextBreakIndex || nextBreakIndex === -1)) {
          nextBreakIndex = nextSentenceIndex + 1;
        }
      }

      // Split at nextBreakIndex or at the end of text if no break is found
      nextBreakIndex = nextBreakIndex !== -1 ? nextBreakIndex : text.length;
      chunks.push(text.substring(startIndex, nextBreakIndex));
      startIndex = nextBreakIndex;
    }
  }

  return chunks;
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


// Main function to run the process
async function runProcess(bodyres) {
  try {
    // Read an item from the Directus collection with the specified ID
    const article = await readDirectusItem(bodyres.collection, bodyres.id);
    console.log('Retrieved article:', article);

    // Extract the content and date updated from the article
    const { text_to_speech, date_updated } = article.data;

    // An array to hold all speech buffers
    let allSpeechBuffers = [];

    // Check the content length and split if necessary
    if (text_to_speech.length > 4096) {
      const chunks = splitText(text_to_speech, 4096);

   // Process each chunk to generate speech
   for (const chunk of chunks) {
    console.log(chunk.length);
    const buffer = await generateSpeech(chunk);
    allSpeechBuffers.push(buffer);
  }

      // for (const chunk of chunks) {
      //   console.log(chunk.length);
      //   await generateAndUploadSpeech(chunk, date_updated, bodyres);
      // }
    } else {
      // await generateAndUploadSpeech(text_to_speech, date_updated, bodyres);
      const buffer = await generateSpeech(content);
      allSpeechBuffers.push(buffer);
    }
     // Concatenate all speech buffers into a single buffer
     const combinedBuffer = Buffer.concat(allSpeechBuffers);

      // Upload combined buffer
    const uploadResult = await uploadBuffer(combinedBuffer, bodyres, date_updated);
    return uploadResult;

  } catch (error) {
    console.error('Error in processing article and generating speech:', error);
  }
}

async function generateSpeech(text) {
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "shimmer",
    input: text,
  });

  // Check the response is OK
  if (response.status !== 200) {
    throw new Error('Failed to generate speech from OpenAI.');
  }

  // Collect stream data into a buffer for the chunk
  const chunks = [];
  for await (const chunk of response.body) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks); // Return the single speech buffer for one chunk
}

async function uploadBuffer(buffer, bodyres, date_updated) {
  // Create form-data instance
  const form = new FormData();
  form.append('file', buffer, {
    filename: bodyres.collection + '_' + bodyres.id + '_' + date_updated + '.mp3',
    contentType: 'audio/mpeg',
    knownLength: buffer.length
  });

  const directusFileEndpoint = DIRECTUS_URL + '/files';

  // Prepare the request headers with the Bearer token
  const headers = {
    'Authorization': 'Bearer ' + DIRECTUS_AUTH_TOKEN, // replace with an actual token
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

export default async (req, context) => {
  const bodyres = await req.json();
  console.log(bodyres);
  await runProcess(bodyres); // Start the process using the body of the request
};


//////

// async function generateAndUploadSpeech(text,date_updated,bodyres) {
//   const response = await openai.audio.speech.create({
//     model: "tts-1-hd",
//     voice: "shimmer",
//     input: text,
//   });

//   // Check the response is OK
//   if (response.status !== 200) {
//     throw new Error('Failed to generate speech from OpenAI.');
//   }

//   // Collect stream data into a buffer
//   const chunks = [];
//   for await (const chunk of response.body) {
//     chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
//   }
//   const buffer = Buffer.concat(chunks);

//   // Create form-data instance
//   const form = new FormData();
//   form.append('file', buffer, {
//     filename: bodyres.collection + '_' + bodyres.id +'_'+date_updated+'.mp3', // The filename
//     contentType: 'audio/mpeg', // The MIME type of the audio
//     knownLength: buffer.length // Optional, necessary for some setups to calculate Content-Length
//   });

//   const directusFileEndpoint = DIRECTUS_URL + '/files';

//   // Prepare the request headers with the Bearer token
//   const headers = {
//     'Authorization': 'Bearer ' + DIRECTUS_AUTH_TOKEN, // replace with an actual token
//   };

//   // Merge the headers from form-data with Directus token
//   const finalHeaders = { ...form.getHeaders(), ...headers };

//   // Make the request to Directus to upload the file
//   const fileResponse = await fetch(directusFileEndpoint, {
//     method: 'POST',
//     body: form,
//     headers: finalHeaders
//   });

//   if (!fileResponse.ok) {
//     const errorBody = await fileResponse.text();
//     throw new Error(`Error uploading file: ${errorBody}`);
//   }

//   const directusResponse = await fileResponse.json();

//   return directusResponse;
// }
