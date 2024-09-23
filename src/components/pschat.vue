<template>
    <div :class="['chatbot-app', !botOpen ? 'chatbot-app-closed' : 'chatbot-app']">
   
  <div class="bot-icon" @click="openFunc" v-if="!botOpen">
    <i class="fa-solid fa-message-bot"></i>
  </div>
  <div class="assitant-chat" v-if="botOpen">
    <div class="bot-header">
      <h4>The Reboot Bot<br><div style="font-size: 0.9rem; font-weight: 400">Your Personal Participatory Democracy Assistant <br><div style="font-size: 0.7rem; font-weight: 600">powered by <a target="_blank" href="https://github.com/CitizensFoundation/policy-synth?tab=readme-ov-file#rag-chatbot">PolicySynth RAG</a></div></div></h4><br>
     
      <i @click="closeFunc" class="fa-regular fa-circle-xmark bot-close"></i>
    </div>
    <div class="chat-window" ref="chatWindow">
      <div class="welcome-message">
        <p class="bot-welcome-message">Welcome to the Reboot Democracy Bot. Trained on research and writing from the GovLab and the Reboot Blog, I answer your questions about technology, governance and democracy.</p>
        <p>Type a question you have about AI, democracy and governance in the box below. Here are some sample prompts to get you started!</p>
        <div class="button-grid">
          <a class="prompt-button" v-for="(question, index) in sampleQuestions" :key="index" @click="submitSamplePrompt(question)">{{ question }}</a>
        </div>
      </div>
      <div v-for="message in messages" :key="message.id" :class="['message', message.type]">
      <div v-if="message.type === 'user'" class="user-message">
        {{ message.content }}
      </div>
      <div v-else class="bot-message">
        <div v-html="renderMarkdown(message.content)"></div>
        <div v-if="message.sourceDocuments && message.sourceDocuments.length > 0" class="source-documents">
          <h4>Sources:</h4>
          <ul>
            <li v-for="(source, index) in message.sourceDocuments" :key="index">
              <a :href="source.url" target="_blank">{{ source.title }}</a>
            </li>
          </ul>
        </div>
      </div>
      
    </div>
    
    </div>
    
    <div class="input-area">
      
      <div v-if="isLoading"  class="loader"></div>
  <textarea
    v-model="userInput"
    placeholder="Ask a question here!"
  @keyup.enter.exact="sendMessage"
  
  class="chat-input"
  ></textarea>
  <button 
    @click="sendMessage" 
    class="submit-button" 
    :disabled="isLoading"
  >
    <i class="fas fa-paper-plane"></i>
  </button>
</div>
<div style="display: flex; flex-direction: column; align-items: left; justify-content: left; ">
  
    <p class="bot-attribution"><i>AI model used: GPT-4o by OpenAI</i><br>The use of this chatbot is governed by <a href="https://openai.com/policies" target="blank">OpenAI's terms of use</a>. <br>Do not enter any personally identifiable information.</p>
    <p class="bot-feedback">Have feedback about this tool? Email us at hello@thegovlab.org</p>

</div>
    </div>
    </div>
</template>


<script>
import { ref, watch, onMounted } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default {
  setup() {
    const botOpen = ref(false);
    const messages = ref([]);
    const userInput = ref('');
    const isLoading = ref(false);
    const sampleQuestions = ref([
       "Can you give me examples of case studies or pilot projects where AI has been successfully integrated into public engagement?",
      "How can AI help in addressing misinformation during election campaigns?",
      "Can you summarize the latest research on AI and participatory decision-making in urban planning?"
    ]);

    onMounted(() => {
      if (!sessionStorage.getItem('chatSessionActive')) {
        // This is a new session, clear localStorage
        localStorage.removeItem('chatbotState');
        sessionStorage.setItem('chatSessionActive', 'true');
      } else {
        // This is an existing session, load saved state
        const savedState = localStorage.getItem('chatbotState');
        if (savedState) {
          const { botOpen: savedBotOpen, messages: savedMessages } = JSON.parse(savedState);
          botOpen.value = savedBotOpen;
          messages.value = savedMessages;
        }
      }
    });

    // Save state when it changes
    watch([botOpen, messages], () => {
      localStorage.setItem('chatbotState', JSON.stringify({
        botOpen: botOpen.value,
        messages: messages.value
      }));
    }, { deep: true });

    const openFunc = () => {
      botOpen.value = true;
    };

    const closeFunc = () => {
      botOpen.value = false;
    };

    const renderMarkdown = (text) => {
      const rawHtml = marked(text);
      return DOMPurify.sanitize(rawHtml);
    };


    const sendMessage = async () => {
  if (userInput.value.trim() === '' || isLoading.value) return;

  isLoading.value = true;
  messages.value.push({ type: 'user', content: userInput.value });
  const botMessage = { type: 'bot', content: '', sourceDocuments: [] };
  messages.value.push(botMessage);

  try {
    // Include the conversation history in the request
    const response = await fetch('/.netlify/functions/pschat', {
      method: 'POST',
      body: JSON.stringify({ message: userInput.value, conversation: messages.value }),
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
          try {
            const data = JSON.parse(jsonStr);
            if (data.content) {
              botMessage.content += data.content;
            } else if (data.sourceDocuments) {
              console.log("Source documents:", data.sourceDocuments);
              botMessage.sourceDocuments = data.sourceDocuments;
            }
          } catch (parseError) {
            const partialMatch = jsonStr.match(/"content":"(.+?)"/);
            if (partialMatch) {
              botMessage.content += partialMatch[1];
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
    botMessage.content = 'Sorry, an error occurred.';
  } finally {
    userInput.value = '';
    isLoading.value = false;
    scrollToBottom();
    // Trigger the watcher to save the updated messages
    messages.value = [...messages.value];
  }
};


    const submitSamplePrompt = (question) => {
      userInput.value = question;
      sendMessage();
    };

    const scrollToBottom = () => {
      const chatWindow = document.querySelector('.chat-window');
      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    };

    return {
      botOpen,
      messages,
      userInput,
      isLoading,
      sampleQuestions,
      openFunc,
      closeFunc,
      renderMarkdown,
      sendMessage,
      submitSamplePrompt
    };
  }
};
</script>

<style scoped>
.chatbot-app-closed {
  z-index: 200;
  height: 65px;
  width: 65px;
}

.chat-window {
  max-height: 500px;
  overflow-y: auto;
  
}

.welcome-message {
  margin-bottom: 20px;
}

.button-grid {
  display: grid;
  /* grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); */
  gap: 10px;
  margin-bottom: 20px;
}

.prompt-button {
  background: none;
  border: 1px solid rgb(11, 202, 196);
  color: rgb(4, 120, 127);
  padding: 10px;
  text-align: left;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s, color 0.3s;
}

.prompt-button:hover {
  background-color: rgb(11, 202, 196);
  color: white;
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
  max-width: 100%;
}


.bot-message p {
  margin: 0 0 10px 0;
}

.bot-message ul, .bot-message ol {
  margin: 0 0 10px 0;
  padding-left: 20px;
}

.bot-message pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}

.bot-message code {
  background-color: #f4f4f4;
  padding: 2px 4px;
  border-radius: 3px;
}



.btn-dark-blue {
  background-color: rgb(11, 202, 196);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.btn-dark-blue:disabled {
  background-color: #cccccc;
}

.loader {
  /* Add your loader styles here */
}

.bot-feedback, .bot-attribution {
  font-size: 0.8em;
  
  text-align: left;
}

.input-area {
  display: flex;
  position: relative;
  scrollbar-width: none;
  flex-direction: column;
  /* padding: 10px; */
  /* margin-top: 20px; */
}

.chat-input {
  width: 100%;
  padding: 10px;
  
  border: 1px solid #ccc;
  border-radius: 20px;
  /* resize: none; */
  height: 80px;
  scrollbar-width: none;
  background-color: white;
  font-size: 14px;
  line-height: 20px; /* Helps with vertical alignment */
}

.submit-button {
  position: absolute;
    right: 5px;
    
    top: 15px;
    /* transform: translateY(-50%); */
    background-color: rgb(11, 202, 196);
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.3s;
    z-index: 1;
}

.submit-button:hover {
  background-color: rgb(9, 180, 175); /* Slightly darker shade for hover */
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.submit-button i {
  font-size: 14px;
}


</style>