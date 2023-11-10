import OpenAI from 'openai';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Configuration variables
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
    const { content, slug, title   } = article.data;
    
    let textContent = title+' \n '+extractTextFromHTML(content);
    
    // An array to hold all speech buffers
    let allSpeechBuffers = [];
    
    // Check the content length and split if necessary
    if (textContent.length > 4096) {
      const chunks = splitText(textContent, 4096);

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
    const uploadResult = await uploadBuffer(combinedBuffer, slug);
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

async function uploadBuffer(buffer, slug) {
  // Create form-data instance
  const form = new FormData();
  form.append('file', buffer, {
    filename: slug + '.mp3',
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


///// HELPER ///// 
// Function to extract text from HTML
function extractTextFromHTML(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  function walkNode(node, text = '') {
    // Skip script, style, img, and figcaption tags
    if (node.nodeType === 1 && ['SCRIPT', 'STYLE', 'IMG', 'FIGCAPTION'].includes(node.tagName)) {
      return text;
    }

    if (node.nodeType === 3) { // Text node
      text += node.textContent;
    } else if (node.nodeType === 1) { // Element
      if (['P', 'BR', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName)) {
        text += node.textContent + '\n'; // Add a newline for block-level elements
      } else {
        // Otherwise recursively check for text nodes
        for (const childNode of node.childNodes) {
          text = walkNode(childNode, text);
        }
      }
    }
    return text;
  }

  return walkNode(document.body);
}

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