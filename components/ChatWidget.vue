<!-- components/ChatWidget.vue - Redesigned to match site design system -->
<template>
  <ClientOnly>
    <div class="chat-container chatbot-app" :class="{ open }">
      <!-- FAB toggle button -->
      <button class="fab" :class="{ 'fab-pulse': !open }" @click="open = !open">
        <span v-if="!open" class="bot-icon">
          <i class="fa-solid fa-comments"></i>
        </span>
        <span v-else class="close-icon">
          <i class="fa-solid fa-times"></i>
        </span>
      </button>

      <!-- Chat Panel -->
      <transition name="slide-up">
        <div v-if="open" class="panel">
          <!-- Header -->
          <header class="chat-header">
            <div class="header-content">
              <h2 class="header-title">Reboot Democracy Bot</h2>
              <p class="header-subtitle">
                Enhanced by research from the GovLab and the Reboot Blog. Ask about AI, governance and democracy.
              </p>
            </div>
          </header>

          <!-- Messages Container -->
          <section class="messages" ref="msgList">
            <!-- Welcome Message -->
            <div class="welcome-message">
              <p class="welcome-text">
                Welcome to the Reboot Democracy Bot. Trained on research and writing from the GovLab and the Reboot Blog, I answer your questions about technology, governance and democracy.
              </p>
              <p class="welcome-text">
                Type a question you have about AI, democracy and governance in the box below. Here are some sample prompts to get you started!
              </p>
            </div>
            
            <!-- Sample Questions -->
            <div class="sample-questions">
              <div v-for="(q, i) in sample" :key="i" class="sample-question">
                <button class="sample-button" @click="useSample(q)">
                  {{ q }}
                </button>
              </div>
            </div>
            
            <!-- Chat Messages -->
            <div v-for="(m, i) in msgs" :key="i" :class="['message', m.sender]">
              <div v-if="m.sender === 'user'" class="user-message">
                {{ m.text }}
              </div>
              <div v-else class="bot-message">
                <div class="bot-avatar">
                  <i class="fa-solid fa-robot"></i>
                </div>
                <div class="bot-content" v-html="md(m.text)" />
                <div v-if="m.sources?.length" class="sources">
                  <h4 class="sources-title">Sources:</h4>
                  <ul class="sources-list">
                    <li v-for="(s, j) in m.sources" :key="j" class="source-item">
                      <a :href="s.url" target="_blank" class="source-link">{{ s.title }}</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <!-- Input Area -->
          <footer class="input-area">
            <div class="input-container">
              <input
                v-model="draft"
                @keyup.enter="send"
                :disabled="busy"
                placeholder="Type your question about AI, democracy, or governance..."
                class="message-input"
              />
              <button class="send-button" @click="send" :disabled="busy">
                <span v-if="busy" class="loading-dots">
                  <span class="dot">.</span>
                  <span class="dot">.</span>
                  <span class="dot">.</span>
                </span>
                <span v-else class="send-icon">
                  <i class="fa-solid fa-paper-plane"></i>
                </span>
              </button>
            </div>
          </footer>
        </div>
      </transition>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { marked } from "marked";
import DOMPurify from "dompurify";

const draft = ref("");
const msgs = ref<{ sender: "user" | "bot"; text: string; sources?: any[] }[]>(
  []
);
const busy = ref(false);
const open = ref(false);
const sample = [
  "Can you summarize the latest research on AI and participatory decision-making in urban planning?",
  "Give me case studies where AI was integrated into public engagement.",
  "How can AI help address misinformation during election campaigns?",
];

const md = (t: string) => DOMPurify.sanitize(marked.parse(t) as string);

/** Scroll chat to bottom each update */
const msgList = ref<HTMLDivElement>();
watch(
  () => msgs.value.length,
  () => {
    nextTick(() => {
      msgList.value?.scrollTo({ top: msgList.value.scrollHeight + 60 });
    });
  }
);

/** Send a message to Netlify Function and stream back */
async function send() {
  if (!draft.value.trim() || busy.value) return;
  busy.value = true;

  // 1. push user line
  msgs.value.push({ sender: "user", text: draft.value });
  await nextTick();
  msgList.value?.scrollTo({ top: msgList.value.scrollHeight + 60 });

  const bot = { sender: "bot", text: "" } as any;
  msgs.value.push(bot);
  await nextTick();
  msgList.value?.scrollTo({ top: msgList.value.scrollHeight + 60 });

  try {
    // 2. map conversation so Lambda can reuse context
    const convo = msgs.value.map((m) => ({
      type: m.sender === "user" ? "user" : "bot",
      content: m.text,
    }));

    const res = await fetch("/.netlify/functions/chatbot_reboot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: draft.value, conversation: convo }),
    });
    if (!res.ok) {
      // Try to read the error body for more info
      let errorText = "";
      try {
        errorText = await res.text();
      } catch (e) {
        errorText = "(Could not read error body)";
      }
      console.error("Fetch failed:", {
        status: res.status,
        statusText: res.statusText,
        errorBody: errorText,
      });
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    console.log(res);
    // 3. streaming loop (unchanged)
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const raw of decoder.decode(value).split("\n\n")) {
        if (!raw.startsWith("data: ")) continue;
        const chunk = raw.slice(6).trim();
        if (!chunk || chunk === "[DONE]") continue;
        const payload = JSON.parse(chunk);
        if (payload.content) bot.text += payload.content;
        if (payload.sourceDocuments) bot.sources = payload.sourceDocuments;
      }
    }

    // 4. Scroll to show beginning of the answer
    await nextTick();
    setTimeout(() => {
      const botMessageElement = msgList.value?.querySelector(
        ".message.bot:last-child"
      );
      if (botMessageElement) {
        botMessageElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  } catch (err) {
    // Print as much info as possible
    console.error("ChatWidget send() error:", err);
    if (err instanceof Error && err.stack) {
      console.error("Stack trace:", err.stack);
    }
  } finally {
    draft.value = "";
    busy.value = false;
  }
}

function useSample(q: string) {
  draft.value = q;
  send();
}
</script>

<style scoped>
.chatbot-app {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* FAB Button */
.fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: #0d63eb;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 4px 12px rgba(13, 99, 235, 0.3);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1001;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0px 6px 16px rgba(13, 99, 235, 0.4);
}

.fab-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0px 4px 12px rgba(13, 99, 235, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0px 6px 20px rgba(13, 99, 235, 0.5);
  }
  100% {
    transform: scale(1);
    box-shadow: 0px 4px 12px rgba(13, 99, 235, 0.3);
  }
}

.close-icon {
  font-size: 1.2rem;
}

/* Chat Panel */
.panel {
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 20px;
}

/* Header */
.chat-header {
  background: linear-gradient(135deg, #003266 0%, #004080 50%, #005999 100%);
  color: white;
  padding: 20px;
  border-radius: 12px 12px 0 0;
}

.header-title {
  font-family: var(--font-inria);
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.header-subtitle {
  font-family: var(--font-habibi);
  font-size: 0.875rem;
  font-weight: 400;
  margin: 0;
  line-height: 1.4;
  opacity: 0.9;
}

/* Messages Container */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

/* Welcome Message */
.welcome-message {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #0d63eb;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.06);
}

.welcome-text {
  font-family: var(--font-habibi);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 12px 0;
  color: #374151;
}

.welcome-text:last-child {
  margin-bottom: 0;
}

/* Sample Questions */
.sample-questions {
  margin-bottom: 20px;
}

.sample-question {
  margin-bottom: 8px;
}

.sample-button {
  width: 100%;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-habibi);
  font-size: 0.875rem;
  line-height: 1.4;
  color: #374151;
}

.sample-button:hover {
  border-color: #0d63eb;
  background: #f0f7ff;
  color: #0d63eb;
}

/* Messages */
.message {
  margin-bottom: 16px;
}

.user-message {
  background: #0d63eb;
  color: white;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  max-width: 80%;
  margin-left: auto;
  font-family: var(--font-habibi);
  font-size: 0.875rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.bot-message {
  display: flex;
  gap: 12px;
  max-width: 90%;
  flex-direction: column;
}

.bot-avatar {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.bot-content {
  background: white;
  padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
}

.bot-content :deep(p) {
  font-family: var(--font-habibi);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 8px 0;
  color: #374151;
}

.bot-content :deep(p:last-child) {
  margin-bottom: 0;
}

.bot-content :deep(h1),
.bot-content :deep(h2),
.bot-content :deep(h3),
.bot-content :deep(h4),
.bot-content :deep(h5),
.bot-content :deep(h6) {
  font-family: var(--font-inria);
  font-weight: 600;
  margin: 12px 0 8px 0;
  color: #111827;
}

.bot-content :deep(ul),
.bot-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.bot-content :deep(li) {
  font-family: var(--font-habibi);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 4px;
}

.bot-content :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-inria);
  font-size: 0.8rem;
  color: #dc2626;
}

.bot-content :deep(pre) {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.bot-content :deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  margin: 8px 0;
  padding-left: 12px;
  color: #6b7280;
  font-style: italic;
}

/* Sources */
.sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.sources-title {
  font-family: var(--font-inria);
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sources-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.source-item {
  margin-bottom: 4px;
}

.source-link {
  font-family: var(--font-habibi);
  font-size: 0.75rem;
  color: #0d63eb;
  text-decoration: none;
  line-height: 1.4;
}

.source-link:hover {
  text-decoration: underline;
}

/* Input Area */
.input-area {
  padding: 20px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.message-input {
  width: 100%;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 24px;
  font-family: var(--font-habibi);
  font-size: 0.875rem;
  line-height: 1.4;
  background: white;
  outline: none;
  transition: border-color 0.2s ease;
}

.message-input:focus {
  border-color: #0d63eb;
  box-shadow: 0 0 0 3px rgba(13, 99, 235, 0.1);
}

.message-input::placeholder {
  color: #9ca3af;
}

.send-button {
  position: absolute;
  right: 6px;
  width: 36px;
  height: 36px;
  background: #0d63eb;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-button:hover:not(:disabled) {
  background: #0056cc;
  transform: scale(1.05);
}

.send-button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
}

.send-icon {
  font-size: 0.875rem;
}

/* Loading Animation */
.loading-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.dot {
  animation: blink 1.4s infinite both;
  font-size: 1rem;
  color: white;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 80%, 100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}

/* Slide Up Animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .chatbot-app {
    right: 20px;
    bottom: 20px;
  }
  
  .panel {
    width: calc(100vw - 40px);
    max-width: 400px;
    height: 70vh;
  }
  
  .fab {
    width: 56px;
    height: 56px;
    font-size: 1.25rem;
  }
  
  .messages {
    padding: 16px;
  }
  
  .input-area {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .panel {
    width: calc(100vw - 20px);
    height: 80vh;
  }
  
  .user-message {
    max-width: 85%;
  }
  
  .bot-message {
    max-width: 95%;
  }
}
</style>

