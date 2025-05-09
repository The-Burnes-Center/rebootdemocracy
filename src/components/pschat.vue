<template>
  <div :class="['chatbot-app', !botOpen ? 'chatbot-app-closed' : 'chatbot-app']">
    <div class="bot-icon" @click="openFunc" v-if="!botOpen">
      <i class="fa-solid fa-message-bot"></i>
    </div>
    <div class="assitant-chat" v-if="botOpen">
      <div class="bot-header">
        <h4>
          The Reboot Bot
          <br>
          <div style="font-size: 0.9rem; font-weight: 400">
            Your Personal Participatory Democracy Assistant
            <br>
          </div>
        </h4>
        <br>
        <i @click="closeFunc" class="fa-regular fa-circle-xmark bot-close"></i>
      </div>
      <div class="chat-window" ref="chatWindow">
        <div class="welcome-message">
          <p class="bot-welcome-message">
            Welcome to the Reboot Democracy Bot. Trained on research and writing from the GovLab and the Reboot Blog, I answer your questions about technology, governance and democracy.
            <br><br>
            Type a question you have about AI, democracy and governance in the box below. Here are some sample prompts to get you started!
          </p>
          <div class="button-grid">
            <a class="prompt-button" v-for="(question, index) in sampleQuestions" :key="index" @click="submitSamplePrompt(question)">
              {{ question }}
            </a>
          </div>
        </div>
    <div v-for="(message, index) in messages" :key="index" :class="['message', message.type]">
    <div v-if="message.type === 'user'" class="user-message">
      {{ message.content }}
    </div>
    <div v-else class="bot-message">
      <div v-if="message.content">
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
      <div v-else class="typing-indicator">
        <!-- Loader/spinner -->
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  </div>
      </div>
      <div style="font-size: 0.7rem; font-weight: 600; padding: 5px">
      powered by <a target="_blank" href="https://github.com/CitizensFoundation/policy-synth?tab=readme-ov-file#rag-chatbot">PolicySynth RAG</a>
      </div>
      <div class="input-area">
        <form @submit.prevent="sendMessage">
          <textarea
  v-model="userInput"
  :placeholder="isLoading ? 'Generating response...' : 'Ask a question here!'"
  :disabled="isLoading"
  class="chat-input"
  @keydown.enter="handleEnterKey"
></textarea>
          <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>

      <div style="display: flex; flex-direction: column; align-items: left; justify-content: left;">
        <p class="bot-attribution">
          <i>AI model used: GPT-4o by OpenAI</i>
          The use of this chatbot is governed by <a href="https://openai.com/policies" target="blank">OpenAI's terms of use</a>.
          Do not enter any personally identifiable information. Have feedback about this tool? Email us at hello@thegovlab.org
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, nextTick } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import debounce from 'lodash/debounce';
import '../styles/components/pschat.css';

export default {
  setup() {
    // Existing reactive variables
    const botOpen = ref(false);
    const messages = ref([]);
    const userInput = ref('');
    const isLoading = ref(false);
    const chatWindow = ref(null); // Reference to the chat window
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
    watch(messages, () => {
  // scrollToBottom();
}, { deep: true, flush: 'post' });

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

    const handleEnterKey = (event) => {
      if (!event.shiftKey && !isLoading.value) {
        event.preventDefault();
        sendMessage();
      }
    };

    const sendMessage = async () => {
      if (userInput.value.trim() === '' || isLoading.value) return;

      const messageContent = userInput.value;
      userInput.value = '';
      isLoading.value = true;

      // Push the user's message
      messages.value.push({ type: 'user', content: messageContent });
      scrollToBottom();

      // Create a bot message with empty content
      const botMessage = { type: 'bot', content: '', sourceDocuments: [] };
      messages.value.push(botMessage);

      try {
        // Fetch the bot's response
        const response = await fetch('/.netlify/functions/pschat', {
          method: 'POST',
          body: JSON.stringify({ message: messageContent, conversation: messages.value }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Read the streamed response
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
        isLoading.value = false;
        // Update messages to reflect new content
        messages.value = [...messages.value];
      }
    };

    const submitSamplePrompt = (question) => {
      userInput.value = question;
      sendMessage();
    };

    const scrollToBottom = debounce(() => {
  nextTick(() => {
    if (chatWindow.value) {
      chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
    }
  });
}, 50); // Adjust the delay as needed

    return {
      botOpen,
      messages,
      userInput,
      isLoading,
      chatWindow,
      sampleQuestions,
      handleEnterKey,
      openFunc,
      closeFunc,
      renderMarkdown,
      scrollToBottom,
      sendMessage,
      submitSamplePrompt
    };
  }
};
</script>
