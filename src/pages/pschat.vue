<template>
    <div class="chat-container">
      <div class="welcome-message">
        <h2>Welcome to the Reboot Democracy Bot</h2>
        <p>Trained on research and writing from the GovLab and the Reboot Blog, I answer your questions about technology, governance and democracy. Type a question you have about AI, democracy and governance in the box below.</p>
        <h3>Sample Questions:</h3>
        <ul class="sample-questions">
          <li v-for="(question, index) in sampleQuestions" :key="index">
            <button @click="useQuestion(question)" class="sample-question-btn">{{ question }}</button>
          </li>
        </ul>
      </div>
      <div class="message-list">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.sender]">
          <div v-if="message.sender === 'user'" class="user-message">
            {{ message.text }}
          </div>
          <div v-else class="bot-message">
            <div v-if="message.text" v-html="renderMarkdown(message.text)"></div>
            <div v-if="message.sources && message.sources.length > 0" class="sources">
              <h4>Sources:</h4>
              <ul>
                <li v-for="(source, idx) in message.sources" :key="idx">
                  <a :href="source.url" target="_blank">{{ source.title }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="input-area">
        <input
          v-model="inputMessage"
          @keyup.enter="sendMessage"
          placeholder="Type your message..."
          :disabled="isLoading"
        />
        <button @click="sendMessage" :disabled="isLoading">
          {{ isLoading ? 'Sending...' : 'Send' }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  
  export default {
    setup() {
      const messages = ref([]);
      const inputMessage = ref('');
      const isLoading = ref(false);
      const sampleQuestions = ref([
        "Can you summarize the latest research on AI and participatory decision-making in urban planning?",
        "Can you give me examples of case studies or pilot projects where AI has been successfully integrated into public engagement?",
        "How can AI help in addressing misinformation during election campaigns?"
      ]);
  
      const renderMarkdown = (text) => {
        const rawHtml = marked(text);
        return DOMPurify.sanitize(rawHtml);
      };
  
      const sendMessage = async () => {
        if (inputMessage.value.trim() === '' || isLoading.value) return;
  
        isLoading.value = true;
        messages.value.push({ sender: 'user', text: inputMessage.value });
        const botMessage = { sender: 'bot', text: '' };
        messages.value.push(botMessage);
  
        try {
          const response = await fetch('/.netlify/functions/pschat', {
            method: 'POST',
            body: JSON.stringify({ message: inputMessage.value }),
            headers: { 'Content-Type': 'application/json' }
          });
  
          if (!response.ok) throw new Error('Network response was not ok');
  
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
  
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                console.log("Raw JSON string:", jsonStr);
                try {
                  const data = JSON.parse(jsonStr);
                  console.log("Parsed data:", data);
                  if (data.content) {
                    botMessage.text += data.content;
                  } else if (data.sourceDocuments) {
                    botMessage.sources = data.sourceDocuments;
                  }
                } catch (parseError) {
                  console.error("JSON Parse Error:", parseError);
                  console.error("Problematic JSON string:", jsonStr);
                  // Attempt to salvage partial content
                  const partialMatch = jsonStr.match(/"content":"(.+?)"/);
                  if (partialMatch) {
                    botMessage.text += partialMatch[1];
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error:', error);
          botMessage.text = 'Sorry, an error occurred.';
        } finally {
          inputMessage.value = '';
          isLoading.value = false;
        }
      };
  
      const useQuestion = (question) => {
        inputMessage.value = question;
        sendMessage();
      };
  
      return {
        messages,
        inputMessage,
        isLoading,
        sampleQuestions,
        sendMessage,
        useQuestion,
        renderMarkdown
      };
    }
  }
  </script>
  
  <style scoped>
  .chat-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    font-family: Arial, sans-serif;
  }
  
  .welcome-message {
    margin-bottom: 20px;
  }
  
  .sample-questions {
    list-style-type: none;
    padding: 0;
  }
  
  .sample-question-btn {
    background: none;
    border: none;
    color: #007bff;
    text-decoration: underline;
    cursor: pointer;
    padding: 5px 0;
    text-align: left;
    font-size: 1em;
  }
  
  .message-list {
    max-height: 500px;
    overflow-y: auto;
    margin-bottom: 20px;
  }
  
  .message {
    margin-bottom: 15px;
  }
  
  .user-message {
    background-color: #e6f2ff;
    padding: 10px;
    border-radius: 10px;
    max-width: 70%;
    margin-left: auto;
  }
  
  .bot-message {
    background-color: #f0f0f0;
    padding: 10px;
    border-radius: 10px;
    max-width: 70%;
  }
  
  .bot-message :deep(p) {
    margin: 0 0 10px 0;
  }
  
  .bot-message :deep(ul), .bot-message :deep(ol) {
    margin: 0 0 10px 0;
    padding-left: 20px;
  }
  
  .bot-message :deep(h1), .bot-message :deep(h2), .bot-message :deep(h3), .bot-message :deep(h4), .bot-message :deep(h5), .bot-message :deep(h6) {
    margin: 10px 0;
  }
  
  .bot-message :deep(code) {
    background-color: #f8f8f8;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
  }
  
  .bot-message :deep(pre) {
    background-color: #f8f8f8;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  .bot-message :deep(blockquote) {
    border-left: 4px solid #ccc;
    margin: 0;
    padding-left: 10px;
    color: #666;
  }
  
  .sources {
    margin-top: 10px;
    font-size: 0.9em;
  }
  
  .sources h4 {
    margin-bottom: 5px;
  }
  
  .sources ul {
    padding-left: 20px;
  }
  
  .input-area {
    display: flex;
  }
  
  input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px 0 0 5px;
  }
  
  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 0 5px 5px 0;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #cccccc;
  }
  </style>