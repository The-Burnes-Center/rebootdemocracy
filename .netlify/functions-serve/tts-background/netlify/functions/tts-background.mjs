
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/tts-background.mjs
import OpenAI from "openai";
import FormData from "form-data";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
var DIRECTUS_URL = process.env.DIRECTUS_URL;
var DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_AUTH_TOKEN;
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
async function directusFetch(endpoint, method = "GET", body = null) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const headers = {
    "Authorization": `Bearer ${DIRECTUS_AUTH_TOKEN}`,
    "Content-Type": "application/json"
  };
  const options = {
    method,
    headers
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
async function readDirectusItem(collection, itemId) {
  const endpoint = `/items/${collection}/${itemId}?fields=*.*,authors.team_id.*`;
  return directusFetch(endpoint);
}
async function runProcess(bodyres) {
  try {
    let getFullName = function(author) {
      return `${author.team_id.First_Name} ${author.team_id.Last_Name}`;
    }, joinAuthorNames = function(authors2) {
      if (authors2.length === 1) {
        return getFullName(authors2[0]);
      } else {
        return authors2.map(getFullName).join(", ").replace(/, (?=[^,]+$)/, " and ");
      }
    };
    const article = await readDirectusItem(bodyres.collection, bodyres.id);
    const { content, slug, title, authors, audio_version } = article.data;
    let textContent = `${title} 
 ${joinAuthorNames(authors).length > 0 ? "\nby" : ""} ${joinAuthorNames(authors)} 
${extractTextFromHTML(content)}`;
    let allSpeechBuffers = [];
    if (textContent.length > 4096) {
      const chunks = splitText(textContent, 4096);
      for (const chunk of chunks) {
        console.log(chunk.length);
        const buffer = await generateSpeech(chunk);
        allSpeechBuffers.push(buffer);
      }
    } else {
      const buffer = await generateSpeech(textContent);
      allSpeechBuffers.push(buffer);
    }
    const combinedBuffer = Buffer.concat(allSpeechBuffers);
    const uploadResult = await uploadBuffer(combinedBuffer, slug, audio_version);
    const updateResult = await updateArticleWithAudioId(bodyres.collection, bodyres.id, uploadResult.data.id);
    return updateResult;
  } catch (error) {
    console.error("Error in processing article and generating speech:", error);
  }
}
async function generateSpeech(text) {
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "shimmer",
    input: text
  });
  if (response.status !== 200) {
    throw new Error("Failed to generate speech from OpenAI.");
  }
  const chunks = [];
  for await (const chunk of response.body) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
async function uploadBuffer(buffer, slug, audio_version) {
  const form = new FormData();
  form.append("file", buffer, {
    filename: slug + ".mp3",
    contentType: "audio/mpeg",
    knownLength: buffer.length
  });
  const directusFileEndpoint = DIRECTUS_URL + "/files" + (audio_version ? "/" + audio_version.id : "");
  const headers = {
    "Authorization": "Bearer " + DIRECTUS_AUTH_TOKEN
    // replace with an actual token
  };
  const finalHeaders = { ...form.getHeaders(), ...headers };
  const fileResponse = await fetch(directusFileEndpoint, {
    method: audio_version ? "PATCH" : "POST",
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
async function updateArticleWithAudioId(collection, itemId, audioFileId) {
  const directusItemEndpoint = DIRECTUS_URL + "/items/" + collection + "/" + itemId;
  const updateData = {
    audio_version: audioFileId
  };
  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + DIRECTUS_AUTH_TOKEN
  };
  const response = await fetch(directusItemEndpoint, {
    method: "PATCH",
    body: JSON.stringify(updateData),
    headers
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error updating item: ${errorBody}`);
  }
  const jsonResponse = await response.json();
  return jsonResponse;
}
var tts_background_default = async (req, context) => {
  const bodyres = await req.json();
  console.log(bodyres);
  await runProcess(bodyres);
};
function extractTextFromHTML(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  function walkNode(node, text = "") {
    if (node.nodeType === 1 && ["SCRIPT", "STYLE", "IMG", "FIGCAPTION"].includes(node.tagName)) {
      return text;
    }
    if (node.nodeType === 3) {
      text += node.textContent;
    } else if (node.nodeType === 1) {
      if (["P", "BR", "DIV", "LI", "H1", "H2", "H3", "H4", "H5", "H6"].includes(node.tagName)) {
        text += node.textContent + "\n";
      } else {
        for (const childNode of node.childNodes) {
          text = walkNode(childNode, text);
        }
      }
    }
    return text;
  }
  return walkNode(document.body);
}
function splitText(text, maxLength) {
  const sentenceEndings = [".", "!", "?"];
  let chunks = [];
  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxLength, text.length);
    let lastBreakIndex = startIndex;
    for (let i = startIndex; i < endIndex; i++) {
      if (text[i] === "\n" || sentenceEndings.includes(text[i]) && text[i + 1] && text[i + 1] === " ") {
        lastBreakIndex = i + 1;
      }
    }
    if (lastBreakIndex > startIndex) {
      chunks.push(text.substring(startIndex, lastBreakIndex));
      startIndex = lastBreakIndex;
    } else {
      let nextBreakIndex = text.indexOf("\n", endIndex) || text.length;
      for (const ending of sentenceEndings) {
        let nextSentenceIndex = text.indexOf(ending + " ", endIndex);
        if (nextSentenceIndex !== -1 && (nextSentenceIndex < nextBreakIndex || nextBreakIndex === -1)) {
          nextBreakIndex = nextSentenceIndex + 1;
        }
      }
      nextBreakIndex = nextBreakIndex !== -1 ? nextBreakIndex : text.length;
      chunks.push(text.substring(startIndex, nextBreakIndex));
      startIndex = nextBreakIndex;
    }
  }
  return chunks;
}
export {
  tts_background_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvdHRzLWJhY2tncm91bmQubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgT3BlbkFJIGZyb20gJ29wZW5haSc7XG5pbXBvcnQgRm9ybURhdGEgZnJvbSAnZm9ybS1kYXRhJztcbmltcG9ydCBmZXRjaCBmcm9tICdub2RlLWZldGNoJztcbmltcG9ydCB7IEpTRE9NIH0gZnJvbSAnanNkb20nO1xuXG4vLyBDb25maWd1cmF0aW9uIHZhcmlhYmxlc1xuY29uc3QgRElSRUNUVVNfVVJMID0gcHJvY2Vzcy5lbnYuRElSRUNUVVNfVVJMXG5jb25zdCBESVJFQ1RVU19BVVRIX1RPS0VOID0gcHJvY2Vzcy5lbnYuRElSRUNUVVNfQVVUSF9UT0tFTlxuXG5jb25zdCBvcGVuYWkgPSBuZXcgT3BlbkFJKHtcbiAgYXBpS2V5OiBwcm9jZXNzLmVudi5PUEVOQUlfQVBJX0tFWSxcbn0pO1xuXG5cblxuLy8gRnVuY3Rpb24gdG8gbWFrZSByZXF1ZXN0cyB0byBEaXJlY3R1cyBBUElcbmFzeW5jIGZ1bmN0aW9uIGRpcmVjdHVzRmV0Y2goZW5kcG9pbnQsIG1ldGhvZCA9ICdHRVQnLCBib2R5ID0gbnVsbCkge1xuICBjb25zdCB1cmwgPSBgJHtESVJFQ1RVU19VUkx9JHtlbmRwb2ludH1gO1xuICBjb25zdCBoZWFkZXJzID0ge1xuICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke0RJUkVDVFVTX0FVVEhfVE9LRU59YCxcbiAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICB9O1xuXG4gIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgbWV0aG9kLFxuICAgIGhlYWRlcnMsXG4gIH07XG5cbiAgaWYgKGJvZHkpIHtcbiAgICBvcHRpb25zLmJvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5KTtcbiAgfVxuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCBvcHRpb25zKTtcblxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgY29uc3QgZXJyb3JEZXRhaWxzID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgIHRocm93IG5ldyBFcnJvcihgRGlyZWN0dXMgQVBJIHJlcXVlc3QgZmFpbGVkOiAke3Jlc3BvbnNlLnN0YXR1c30gLSAke2Vycm9yRGV0YWlsc31gKTtcbiAgfVxuXG4gIHJldHVybiByZXNwb25zZS5qc29uKCk7XG59XG5cbi8vIEZ1bmN0aW9uIHRvIHJlYWQgYW4gaXRlbSBmcm9tIGEgY29sbGVjdGlvbiBieSBJRFxuYXN5bmMgZnVuY3Rpb24gcmVhZERpcmVjdHVzSXRlbShjb2xsZWN0aW9uLCBpdGVtSWQpIHtcbiAgY29uc3QgZW5kcG9pbnQgPSBgL2l0ZW1zLyR7Y29sbGVjdGlvbn0vJHtpdGVtSWR9P2ZpZWxkcz0qLiosYXV0aG9ycy50ZWFtX2lkLipgO1xuICByZXR1cm4gZGlyZWN0dXNGZXRjaChlbmRwb2ludCk7XG59XG5cblxuLy8gTWFpbiBmdW5jdGlvbiB0byBydW4gdGhlIHByb2Nlc3NcbmFzeW5jIGZ1bmN0aW9uIHJ1blByb2Nlc3MoYm9keXJlcykge1xuICAvLyBhc3luYyBmdW5jdGlvbiBydW5Qcm9jZXNzKCkge1xuICAvLyAgdmFyICBib2R5cmVzPSB7Y29sbGVjdGlvbjpcInJlYm9vdF9kZW1vY3JhY3lfYmxvZ1wiLCBpZDpcIjI4MTgyXCJ9XG4gIHRyeSB7XG4gICAgLy8gUmVhZCBhbiBpdGVtIGZyb20gdGhlIERpcmVjdHVzIGNvbGxlY3Rpb24gd2l0aCB0aGUgc3BlY2lmaWVkIElEXG4gICAgY29uc3QgYXJ0aWNsZSA9IGF3YWl0IHJlYWREaXJlY3R1c0l0ZW0oYm9keXJlcy5jb2xsZWN0aW9uLCBib2R5cmVzLmlkKTtcblxuICAgIC8vIEV4dHJhY3QgdGhlIGNvbnRlbnQgYW5kIGRhdGUgdXBkYXRlZCBmcm9tIHRoZSBhcnRpY2xlXG4gICAgY29uc3QgeyBjb250ZW50LCBzbHVnLCB0aXRsZSAsIGF1dGhvcnMsIGF1ZGlvX3ZlcnNpb24gICB9ID0gYXJ0aWNsZS5kYXRhO1xuICBcbiAgXG4gICAgLy8gRnVuY3Rpb24gdG8gZXh0cmFjdCB0aGUgZnVsbCBuYW1lIGZyb20gYW4gYXV0aG9yIG9iamVjdFxuICAgICAgZnVuY3Rpb24gZ2V0RnVsbE5hbWUoYXV0aG9yKSB7XG4gICAgICAgIHJldHVybiBgJHthdXRob3IudGVhbV9pZC5GaXJzdF9OYW1lfSAke2F1dGhvci50ZWFtX2lkLkxhc3RfTmFtZX1gO1xuICAgICAgfVxuXG4gICAgICAvLyBGdW5jdGlvbiB0byBqb2luIGF1dGhvciBuYW1lcyB3aXRoIGNvbW1hcyBhbmQgXCJhbmRcIlxuICAgICAgZnVuY3Rpb24gam9pbkF1dGhvck5hbWVzKGF1dGhvcnMpIHtcbiAgICAgICAgaWYgKGF1dGhvcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgLy8gT25seSBvbmUgYXV0aG9yLCBzbyBqdXN0IHJldHVybiB0aGUgZnVsbCBuYW1lXG4gICAgICAgICAgcmV0dXJuIGdldEZ1bGxOYW1lKGF1dGhvcnNbMF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEpvaW4gbXVsdGlwbGUgYXV0aG9ycyB3aXRoIGNvbW1hcyBhbmQgcmVwbGFjZSB0aGUgbGFzdCBjb21tYSB3aXRoIFwiYW5kXCJcbiAgICAgICAgICByZXR1cm4gYXV0aG9ycy5tYXAoZ2V0RnVsbE5hbWUpLmpvaW4oJywgJykucmVwbGFjZSgvLCAoPz1bXixdKyQpLywgJyBhbmQgJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBcbiAgICBsZXQgdGV4dENvbnRlbnQgPSBgJHt0aXRsZX0gXFxuICR7am9pbkF1dGhvck5hbWVzKGF1dGhvcnMpLmxlbmd0aD4wPydcXG5ieSc6Jyd9ICR7am9pbkF1dGhvck5hbWVzKGF1dGhvcnMpfSBcXG4ke2V4dHJhY3RUZXh0RnJvbUhUTUwoY29udGVudCl9YDtcbiAgICBcbiAgICAvLyBBbiBhcnJheSB0byBob2xkIGFsbCBzcGVlY2ggYnVmZmVyc1xuICAgIGxldCBhbGxTcGVlY2hCdWZmZXJzID0gW107XG4gICAgXG4gICAgLy8gQ2hlY2sgdGhlIGNvbnRlbnQgbGVuZ3RoIGFuZCBzcGxpdCBpZiBuZWNlc3NhcnlcbiAgICBpZiAodGV4dENvbnRlbnQubGVuZ3RoID4gNDA5Nikge1xuICAgICAgY29uc3QgY2h1bmtzID0gc3BsaXRUZXh0KHRleHRDb250ZW50LCA0MDk2KTtcbiAgICAgIFxuICAgLy8gUHJvY2VzcyBlYWNoIGNodW5rIHRvIGdlbmVyYXRlIHNwZWVjaFxuICAgZm9yIChjb25zdCBjaHVuayBvZiBjaHVua3MpIHtcbiAgICBjb25zb2xlLmxvZyhjaHVuay5sZW5ndGgpO1xuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IGdlbmVyYXRlU3BlZWNoKGNodW5rKTtcbiAgICBhbGxTcGVlY2hCdWZmZXJzLnB1c2goYnVmZmVyKTtcbiAgfVxuXG4gICAgICAvLyBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuICAgICAgLy8gICBjb25zb2xlLmxvZyhjaHVuay5sZW5ndGgpO1xuICAgICAgLy8gICBhd2FpdCBnZW5lcmF0ZUFuZFVwbG9hZFNwZWVjaChjaHVuaywgZGF0ZV91cGRhdGVkLCBib2R5cmVzKTtcbiAgICAgIC8vIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYXdhaXQgZ2VuZXJhdGVBbmRVcGxvYWRTcGVlY2godGV4dF90b19zcGVlY2gsIGRhdGVfdXBkYXRlZCwgYm9keXJlcyk7XG4gICAgICBjb25zdCBidWZmZXIgPSBhd2FpdCBnZW5lcmF0ZVNwZWVjaCh0ZXh0Q29udGVudCk7XG4gICAgICBcbiAgICAgIGFsbFNwZWVjaEJ1ZmZlcnMucHVzaChidWZmZXIpO1xuICAgIH1cbiAgICAgLy8gQ29uY2F0ZW5hdGUgYWxsIHNwZWVjaCBidWZmZXJzIGludG8gYSBzaW5nbGUgYnVmZmVyXG4gICAgIGNvbnN0IGNvbWJpbmVkQnVmZmVyID0gQnVmZmVyLmNvbmNhdChhbGxTcGVlY2hCdWZmZXJzKTtcblxuICAgICAgLy8gVXBsb2FkIGNvbWJpbmVkIGJ1ZmZlclxuICAgICAgXG4gICAgY29uc3QgdXBsb2FkUmVzdWx0ID0gYXdhaXQgdXBsb2FkQnVmZmVyKGNvbWJpbmVkQnVmZmVyLCBzbHVnLCBhdWRpb192ZXJzaW9uKTtcbiAgICBcbiAgICAgIC8vIFVwZGF0ZSB0aGUgYXJ0aWNsZSB3aXRoIHRoZSBhdWRpbyBmaWxlIElEXG4gICAgICBjb25zdCB1cGRhdGVSZXN1bHQgPSBhd2FpdCB1cGRhdGVBcnRpY2xlV2l0aEF1ZGlvSWQoYm9keXJlcy5jb2xsZWN0aW9uLCBib2R5cmVzLmlkLCB1cGxvYWRSZXN1bHQuZGF0YS5pZCk7XG4gICAgXG4gICAgICByZXR1cm4gdXBkYXRlUmVzdWx0O1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gcHJvY2Vzc2luZyBhcnRpY2xlIGFuZCBnZW5lcmF0aW5nIHNwZWVjaDonLCBlcnJvcik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVTcGVlY2godGV4dCkge1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IG9wZW5haS5hdWRpby5zcGVlY2guY3JlYXRlKHtcbiAgICBtb2RlbDogXCJ0dHMtMS1oZFwiLFxuICAgIHZvaWNlOiBcInNoaW1tZXJcIixcbiAgICBpbnB1dDogdGV4dCxcbiAgfSk7XG5cbiAgLy8gQ2hlY2sgdGhlIHJlc3BvbnNlIGlzIE9LXG4gIGlmIChyZXNwb25zZS5zdGF0dXMgIT09IDIwMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGdlbmVyYXRlIHNwZWVjaCBmcm9tIE9wZW5BSS4nKTtcbiAgfVxuXG4gIC8vIENvbGxlY3Qgc3RyZWFtIGRhdGEgaW50byBhIGJ1ZmZlciBmb3IgdGhlIGNodW5rXG4gIGNvbnN0IGNodW5rcyA9IFtdO1xuICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlc3BvbnNlLmJvZHkpIHtcbiAgICBjaHVua3MucHVzaChjaHVuayBpbnN0YW5jZW9mIEJ1ZmZlciA/IGNodW5rIDogQnVmZmVyLmZyb20oY2h1bmspKTtcbiAgfVxuICByZXR1cm4gQnVmZmVyLmNvbmNhdChjaHVua3MpOyAvLyBSZXR1cm4gdGhlIHNpbmdsZSBzcGVlY2ggYnVmZmVyIGZvciBvbmUgY2h1bmtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBsb2FkQnVmZmVyKGJ1ZmZlciwgc2x1ZywgYXVkaW9fdmVyc2lvbikge1xuICAvLyBDcmVhdGUgZm9ybS1kYXRhIGluc3RhbmNlXG4gXG4gIGNvbnN0IGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgZm9ybS5hcHBlbmQoJ2ZpbGUnLCBidWZmZXIsIHtcbiAgICBmaWxlbmFtZTogc2x1ZyArICcubXAzJyxcbiAgICBjb250ZW50VHlwZTogJ2F1ZGlvL21wZWcnLFxuICAgIGtub3duTGVuZ3RoOiBidWZmZXIubGVuZ3RoXG4gIH0pO1xuXG4gIGNvbnN0IGRpcmVjdHVzRmlsZUVuZHBvaW50ID0gRElSRUNUVVNfVVJMICsgJy9maWxlcycgKyAoYXVkaW9fdmVyc2lvbj8nLycrYXVkaW9fdmVyc2lvbi5pZDonJykgO1xuICBcbiAgLy8gUHJlcGFyZSB0aGUgcmVxdWVzdCBoZWFkZXJzIHdpdGggdGhlIEJlYXJlciB0b2tlblxuICBjb25zdCBoZWFkZXJzID0ge1xuICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgRElSRUNUVVNfQVVUSF9UT0tFTiwgLy8gcmVwbGFjZSB3aXRoIGFuIGFjdHVhbCB0b2tlblxuICB9O1xuXG4gIC8vIE1lcmdlIHRoZSBoZWFkZXJzIGZyb20gZm9ybS1kYXRhIHdpdGggRGlyZWN0dXMgdG9rZW5cbiAgY29uc3QgZmluYWxIZWFkZXJzID0geyAuLi5mb3JtLmdldEhlYWRlcnMoKSwgLi4uaGVhZGVycyB9O1xuXG4gIC8vIE1ha2UgdGhlIHJlcXVlc3QgdG8gRGlyZWN0dXMgdG8gdXBsb2FkIHRoZSBmaWxlXG4gIGNvbnN0IGZpbGVSZXNwb25zZSA9IGF3YWl0IGZldGNoKGRpcmVjdHVzRmlsZUVuZHBvaW50LCB7XG4gICAgbWV0aG9kOiBhdWRpb192ZXJzaW9uPydQQVRDSCc6J1BPU1QnLFxuICAgIGJvZHk6IGZvcm0sXG4gICAgaGVhZGVyczogZmluYWxIZWFkZXJzXG4gIH0pO1xuXG4gIGlmICghZmlsZVJlc3BvbnNlLm9rKSB7XG4gICAgY29uc3QgZXJyb3JCb2R5ID0gYXdhaXQgZmlsZVJlc3BvbnNlLnRleHQoKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHVwbG9hZGluZyBmaWxlOiAke2Vycm9yQm9keX1gKTtcbiAgfVxuXG4gIGNvbnN0IGRpcmVjdHVzUmVzcG9uc2UgPSBhd2FpdCBmaWxlUmVzcG9uc2UuanNvbigpO1xuXG4gIHJldHVybiBkaXJlY3R1c1Jlc3BvbnNlO1xufVxuXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVBcnRpY2xlV2l0aEF1ZGlvSWQoY29sbGVjdGlvbiwgaXRlbUlkLCBhdWRpb0ZpbGVJZCkge1xuICBjb25zdCBkaXJlY3R1c0l0ZW1FbmRwb2ludCA9IERJUkVDVFVTX1VSTCArICcvaXRlbXMvJyArIGNvbGxlY3Rpb24gKyAnLycgKyBpdGVtSWQ7XG5cbiAgY29uc3QgdXBkYXRlRGF0YSA9IHtcbiAgICBhdWRpb192ZXJzaW9uOiBhdWRpb0ZpbGVJZFxuICB9O1xuXG4gIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIERJUkVDVFVTX0FVVEhfVE9LRU5cbiAgfTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGRpcmVjdHVzSXRlbUVuZHBvaW50LCB7XG4gICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHVwZGF0ZURhdGEpLFxuICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgfSk7XG5cbiAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgIGNvbnN0IGVycm9yQm9keSA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHVwZGF0aW5nIGl0ZW06ICR7ZXJyb3JCb2R5fWApO1xuICB9XG5cbiAgY29uc3QganNvblJlc3BvbnNlID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICByZXR1cm4ganNvblJlc3BvbnNlO1xufVxuXG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXEsIGNvbnRleHQpID0+IHtcbiAgY29uc3QgYm9keXJlcyA9IGF3YWl0IHJlcS5qc29uKCk7XG4gIGNvbnNvbGUubG9nKGJvZHlyZXMpO1xuICBhd2FpdCBydW5Qcm9jZXNzKGJvZHlyZXMpOyAvLyBTdGFydCB0aGUgcHJvY2VzcyB1c2luZyB0aGUgYm9keSBvZiB0aGUgcmVxdWVzdFxufTtcblxuXG4vLy8vLyBIRUxQRVIgLy8vLy8gXG4vLyBGdW5jdGlvbiB0byBleHRyYWN0IHRleHQgZnJvbSBIVE1MXG5mdW5jdGlvbiBleHRyYWN0VGV4dEZyb21IVE1MKGh0bWwpIHtcbiAgY29uc3QgZG9tID0gbmV3IEpTRE9NKGh0bWwpO1xuICBjb25zdCBkb2N1bWVudCA9IGRvbS53aW5kb3cuZG9jdW1lbnQ7XG5cbiAgZnVuY3Rpb24gd2Fsa05vZGUobm9kZSwgdGV4dCA9ICcnKSB7XG4gICAgLy8gU2tpcCBzY3JpcHQsIHN0eWxlLCBpbWcsIGFuZCBmaWdjYXB0aW9uIHRhZ3NcbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBbJ1NDUklQVCcsICdTVFlMRScsICdJTUcnLCAnRklHQ0FQVElPTiddLmluY2x1ZGVzKG5vZGUudGFnTmFtZSkpIHtcbiAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cblxuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7IC8vIFRleHQgbm9kZVxuICAgICAgdGV4dCArPSBub2RlLnRleHRDb250ZW50O1xuICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkgeyAvLyBFbGVtZW50XG4gICAgICBpZiAoWydQJywgJ0JSJywgJ0RJVicsICdMSScsICdIMScsICdIMicsICdIMycsICdINCcsICdINScsICdINiddLmluY2x1ZGVzKG5vZGUudGFnTmFtZSkpIHtcbiAgICAgICAgdGV4dCArPSBub2RlLnRleHRDb250ZW50ICsgJ1xcbic7IC8vIEFkZCBhIG5ld2xpbmUgZm9yIGJsb2NrLWxldmVsIGVsZW1lbnRzXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBPdGhlcndpc2UgcmVjdXJzaXZlbHkgY2hlY2sgZm9yIHRleHQgbm9kZXNcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZE5vZGUgb2Ygbm9kZS5jaGlsZE5vZGVzKSB7XG4gICAgICAgICAgdGV4dCA9IHdhbGtOb2RlKGNoaWxkTm9kZSwgdGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICByZXR1cm4gd2Fsa05vZGUoZG9jdW1lbnQuYm9keSk7XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBzcGxpdCB0ZXh0IGludG8gY2h1bmtzIGJ5IHBhcmFncmFwaHMgb3Igc2VudGVuY2VzXG5mdW5jdGlvbiBzcGxpdFRleHQodGV4dCwgbWF4TGVuZ3RoKSB7XG4gIGNvbnN0IHNlbnRlbmNlRW5kaW5ncyA9IFsnLicsICchJywgJz8nXTsgLy8gU2VudGVuY2UgZW5kaW5nIGNoYXJhY3RlcnNcbiAgbGV0IGNodW5rcyA9IFtdO1xuICBsZXQgc3RhcnRJbmRleCA9IDA7XG5cbiAgd2hpbGUgKHN0YXJ0SW5kZXggPCB0ZXh0Lmxlbmd0aCkge1xuICAgIGxldCBlbmRJbmRleCA9IE1hdGgubWluKHN0YXJ0SW5kZXggKyBtYXhMZW5ndGgsIHRleHQubGVuZ3RoKTtcbiAgICBsZXQgbGFzdEJyZWFrSW5kZXggPSBzdGFydEluZGV4OyAvLyBTdG9yZSB0aGUgbGFzdCBpbmRleCBvZiBhIHNlbnRlbmNlIG9yIHBhcmFncmFwaCBicmVha1xuXG4gICAgLy8gTG9vayBmb3IgdGhlIGNsb3Nlc3Qgc2VudGVuY2Ugb3IgcGFyYWdyYXBoIGJyZWFrIHdpdGhpbiB0aGUgY3VycmVudCBjaHVua1xuICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgZW5kSW5kZXg7IGkrKykge1xuICAgICAgaWYgKHRleHRbaV0gPT09ICdcXG4nIHx8IChzZW50ZW5jZUVuZGluZ3MuaW5jbHVkZXModGV4dFtpXSkgJiYgdGV4dFtpICsgMV0gJiYgdGV4dFtpICsgMV0gPT09ICcgJykpIHtcbiAgICAgICAgbGFzdEJyZWFrSW5kZXggPSBpICsgMTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gSWYgYSBzZW50ZW5jZSBvciBwYXJhZ3JhcGggZW5kaW5nIHdhcyBmb3VuZCwgdXNlIGl0IGFzIHRoZSBzcGxpdCBwb2ludFxuICAgIGlmIChsYXN0QnJlYWtJbmRleCA+IHN0YXJ0SW5kZXgpIHtcbiAgICAgIGNodW5rcy5wdXNoKHRleHQuc3Vic3RyaW5nKHN0YXJ0SW5kZXgsIGxhc3RCcmVha0luZGV4KSk7XG4gICAgICBzdGFydEluZGV4ID0gbGFzdEJyZWFrSW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIG5vIHN1aXRhYmxlIGJyZWFrIHdhcyBmb3VuZCB3aXRoaW4gdGhlIG1heExlbmd0aCwgbG9vayBmb3IgdGhlIG5leHQgcG9zc2libGUgYnJlYWtcbiAgICAgIGxldCBuZXh0QnJlYWtJbmRleCA9IHRleHQuaW5kZXhPZignXFxuJywgZW5kSW5kZXgpIHx8IHRleHQubGVuZ3RoO1xuICAgICAgZm9yIChjb25zdCBlbmRpbmcgb2Ygc2VudGVuY2VFbmRpbmdzKSB7XG4gICAgICAgIGxldCBuZXh0U2VudGVuY2VJbmRleCA9IHRleHQuaW5kZXhPZihlbmRpbmcgKyAnICcsIGVuZEluZGV4KTtcbiAgICAgICAgaWYgKG5leHRTZW50ZW5jZUluZGV4ICE9PSAtMSAmJiAobmV4dFNlbnRlbmNlSW5kZXggPCBuZXh0QnJlYWtJbmRleCB8fCBuZXh0QnJlYWtJbmRleCA9PT0gLTEpKSB7XG4gICAgICAgICAgbmV4dEJyZWFrSW5kZXggPSBuZXh0U2VudGVuY2VJbmRleCArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU3BsaXQgYXQgbmV4dEJyZWFrSW5kZXggb3IgYXQgdGhlIGVuZCBvZiB0ZXh0IGlmIG5vIGJyZWFrIGlzIGZvdW5kXG4gICAgICBuZXh0QnJlYWtJbmRleCA9IG5leHRCcmVha0luZGV4ICE9PSAtMSA/IG5leHRCcmVha0luZGV4IDogdGV4dC5sZW5ndGg7XG4gICAgICBjaHVua3MucHVzaCh0ZXh0LnN1YnN0cmluZyhzdGFydEluZGV4LCBuZXh0QnJlYWtJbmRleCkpO1xuICAgICAgc3RhcnRJbmRleCA9IG5leHRCcmVha0luZGV4O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjaHVua3M7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrRXhpc3RpbmdGaWxlKGNvbGxlY3Rpb24sIGNvbGxlY3Rpb25JZCkge1xuICAvLyBEZWZpbmUgdGhlIGVuZHBvaW50IHRvIHNlYXJjaCBmb3IgZmlsZXMgd2l0aCB0aGUgc3BlY2lmaWVkIHRhZ3NcbiAgY29uc3QgcXVlcnkgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHtcbiAgICAnZmlsdGVyW3RhZ3NdW19jb250YWluc10nOiBbY29sbGVjdGlvbiwgY29sbGVjdGlvbklkXS5qb2luKCcsJylcbiAgfSk7XG4gIGNvbnN0IGRpcmVjdHVzRmlsZVNlYXJjaEVuZHBvaW50ID0gRElSRUNUVVNfVVJMICsgJy9maWxlcz8nICsgcXVlcnkudG9TdHJpbmcoKTtcblxuICBjb25zdCBoZWFkZXJzID0ge1xuICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgRElSRUNUVVNfQVVUSF9UT0tFTlxuICB9O1xuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZGlyZWN0dXNGaWxlU2VhcmNoRW5kcG9pbnQsIHsgaGVhZGVycyB9KTtcbiAgXG4gIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICBjb25zdCBlcnJvckJvZHkgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBzZWFyY2hpbmcgZm9yIGZpbGU6ICR7ZXJyb3JCb2R5fWApO1xuICB9XG5cbiAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgcmV0dXJuIGRhdGEuZGF0YSAmJiBkYXRhLmRhdGEubGVuZ3RoID4gMCA/IGRhdGEuZGF0YVswXSA6IG51bGw7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBQUEsT0FBTyxZQUFZO0FBQ25CLE9BQU8sY0FBYztBQUNyQixPQUFPLFdBQVc7QUFDbEIsU0FBUyxhQUFhO0FBR3RCLElBQU0sZUFBZSxRQUFRLElBQUk7QUFDakMsSUFBTSxzQkFBc0IsUUFBUSxJQUFJO0FBRXhDLElBQU0sU0FBUyxJQUFJLE9BQU87QUFBQSxFQUN4QixRQUFRLFFBQVEsSUFBSTtBQUN0QixDQUFDO0FBS0QsZUFBZSxjQUFjLFVBQVUsU0FBUyxPQUFPLE9BQU8sTUFBTTtBQUNsRSxRQUFNLE1BQU0sR0FBRyxZQUFZLEdBQUcsUUFBUTtBQUN0QyxRQUFNLFVBQVU7QUFBQSxJQUNkLGlCQUFpQixVQUFVLG1CQUFtQjtBQUFBLElBQzlDLGdCQUFnQjtBQUFBLEVBQ2xCO0FBRUEsUUFBTSxVQUFVO0FBQUEsSUFDZDtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBRUEsTUFBSSxNQUFNO0FBQ1IsWUFBUSxPQUFPLEtBQUssVUFBVSxJQUFJO0FBQUEsRUFDcEM7QUFFQSxRQUFNLFdBQVcsTUFBTSxNQUFNLEtBQUssT0FBTztBQUV6QyxNQUFJLENBQUMsU0FBUyxJQUFJO0FBQ2hCLFVBQU0sZUFBZSxNQUFNLFNBQVMsS0FBSztBQUN6QyxVQUFNLElBQUksTUFBTSxnQ0FBZ0MsU0FBUyxNQUFNLE1BQU0sWUFBWSxFQUFFO0FBQUEsRUFDckY7QUFFQSxTQUFPLFNBQVMsS0FBSztBQUN2QjtBQUdBLGVBQWUsaUJBQWlCLFlBQVksUUFBUTtBQUNsRCxRQUFNLFdBQVcsVUFBVSxVQUFVLElBQUksTUFBTTtBQUMvQyxTQUFPLGNBQWMsUUFBUTtBQUMvQjtBQUlBLGVBQWUsV0FBVyxT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SyxhQUFhLEdBQUc7QUFDOUIsVUFBSSxDQUFDLEtBQUssTUFBTSxPQUFPLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLElBQUksRUFBRSxTQUFTLEtBQUssT0FBTyxHQUFHO0FBQ3ZGLGdCQUFRLEtBQUssY0FBYztBQUFBLE1BQzdCLE9BQU87QUFFTCxtQkFBVyxhQUFhLEtBQUssWUFBWTtBQUN2QyxpQkFBTyxTQUFTLFdBQVcsSUFBSTtBQUFBLFFBQ2pDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUVBLFNBQU8sU0FBUyxTQUFTLElBQUk7QUFDL0I7QUFHQSxTQUFTLFVBQVUsTUFBTSxXQUFXO0FBQ2xDLFFBQU0sa0JBQWtCLENBQUMsS0FBSyxLQUFLLEdBQUc7QUFDdEMsTUFBSSxTQUFTLENBQUM7QUFDZCxNQUFJLGFBQWE7QUFFakIsU0FBTyxhQUFhLEtBQUssUUFBUTtBQUMvQixRQUFJLFdBQVcsS0FBSyxJQUFJLGFBQWEsV0FBVyxLQUFLLE1BQU07QUFDM0QsUUFBSSxpQkFBaUI7QUFHckIsYUFBUyxJQUFJLFlBQVksSUFBSSxVQUFVLEtBQUs7QUFDMUMsVUFBSSxLQUFLLENBQUMsTUFBTSxRQUFTLGdCQUFnQixTQUFTLEtBQUssQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLEtBQU07QUFDakcseUJBQWlCLElBQUk7QUFBQSxNQUN2QjtBQUFBLElBQ0Y7QUFHQSxRQUFJLGlCQUFpQixZQUFZO0FBQy9CLGFBQU8sS0FBSyxLQUFLLFVBQVUsWUFBWSxjQUFjLENBQUM7QUFDdEQsbUJBQWE7QUFBQSxJQUNmLE9BQU87QUFFTCxVQUFJLGlCQUFpQixLQUFLLFFBQVEsTUFBTSxRQUFRLEtBQUssS0FBSztBQUMxRCxpQkFBVyxVQUFVLGlCQUFpQjtBQUNwQyxZQUFJLG9CQUFvQixLQUFLLFFBQVEsU0FBUyxLQUFLLFFBQVE7QUFDM0QsWUFBSSxzQkFBc0IsT0FBTyxvQkFBb0Isa0JBQWtCLG1CQUFtQixLQUFLO0FBQzdGLDJCQUFpQixvQkFBb0I7QUFBQSxRQUN2QztBQUFBLE1BQ0Y7QUFHQSx1QkFBaUIsbUJBQW1CLEtBQUssaUJBQWlCLEtBQUs7QUFDL0QsYUFBTyxLQUFLLEtBQUssVUFBVSxZQUFZLGNBQWMsQ0FBQztBQUN0RCxtQkFBYTtBQUFBLElBQ2Y7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUNUOyIsCiAgIm5hbWVzIjogWyJhdXRob3JzIl0KfQo=
