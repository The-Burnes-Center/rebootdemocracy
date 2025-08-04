<!-- components/ChatWidget.vue -->
<template>
  <ClientOnly>
    <div class="chat-container chatbot-app" :class="{ open }">
      <!-- FAB toggle  -->
      <button class="fab" :class="{ 'fab-pulse': !open }" @click="open = !open">
        <span v-if="!open"
          ><div class="bot-icon">
            <i class="fa-solid fa-message-bot"></i></div></span
        ><span v-else
          ><i class="fa-regular fa-circle-xmark bot-close"></i
        ></span>
      </button>

      <!-- Panel -->
      <transition name="slide-up">
        <div v-if="open" class="panel">
          <header class="welcome">
            <h2>Reboot Democracy Bot</h2>
            <p>
              Enhanced by research from the GovLab and the Reboot Blog. Ask
              about AI, governance and democracy.
            </p>
          </header>

          <section class="messages" ref="msgList">
            <div class="welcome-message">
              <p>
                Welcome to the Reboot Democracy Bot. Trained on research and
                writing from the GovLab and the Reboot Blog, I answer your
                questions about technology, governance and democracy.
              </p>
              <p>
                Type a question you have about AI, democracy and governance in
                the box below. Here are some sample prompts to get you started!
              </p>
            </div>
            <div class="bot-message">
              <div v-for="(q, i) in sample" :key="i">
                <button class="prompt-button" @click="useSample(q)">
                  {{ q }}
                </button>
              </div>
            </div>
            <div v-for="(m, i) in msgs" :key="i" :class="['msg', m.sender]">
              <p v-if="m.sender === 'user'" class="user-message">
                {{ m.text }}
              </p>
              <div v-else v-html="md(m.text)" />
              <div v-if="m.sources?.length" class="sources">
                <strong>Sources:</strong>
                <ul>
                  <li v-for="(s, j) in m.sources" :key="j">
                    <a :href="s.url" target="_blank">{{ s.title }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </section>

                    <footer class="input-bar">
            <div class="input-container">
              <input
                v-model="draft"
                @keyup.enter="send"
                :disabled="busy"
                placeholder="Type your question…"
              />
              <button class="send-icon-btn" @click="send" :disabled="busy">
                <span v-if="busy" class="loading-dots-small">
                  <span class="dot">.</span><span class="dot">.</span
                  ><span class="dot">.</span>
                </span>
                <span v-else><i class="fas fa-paper-plane"></i></span>
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

const md = (t: string) => DOMPurify.sanitize(marked.parse(t));

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
        ".msg.bot:last-child"
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
  display: flex;
  flex-direction: row;
  position: fixed;
  right: 30px;
  bottom: 30px;
  justify-content: flex-end;
  align-items: flex-end;

  z-index: 200;
}

/* Hide the chat container when not open */
.chat-container {
  margin: 0 auto;
  padding: 20px;

  border-radius: 5px;

  font-family: var(--font-inria);

  /* Remove scroll here, move to .messages */
  /* overflow-y: scroll; */
  display: flex;
  flex-direction: column;
}
.input-bar {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* Make the messages section scrollable */
.messages {
  flex: 1 1 auto;
  max-height: 55vh;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
  background-color: white !important;
  border: 1px solid #ccc;
}

/* Panel layout */
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* FAB button always visible */
.fab {
  position: absolute;
  top: 20px;
  z-index: 1001;
  width: 35px;
  height: 35px;
  outline: none;  background: none;
  color: rgba(1, 42, 55, 1);
  font-size: 1.2em;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Add these properties to ensure it stays circular */
  min-width: 40px;
  min-height: 40px;
  max-width: 40px;
  max-height: 40px;
  overflow: hidden;
}
.fab:focus,
.fab:active {
  outline: none;
  border: none;
  box-shadow: none;
}
.fab-pulse {
  top: 5px !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 50% !important;

  min-width: 50px !important;
  min-height: 50px !important;
  max-width: 50px !important;
  max-height: 50px !important;
  background: rgba(1, 42, 55, 1) !important;
  color: white !important;
  border: none !important;
  font-size: 1.4em !important;
  transform: scale(1);
  animation: pulse 2s infinite;
}

/* Add styling for the bot icon to ensure it doesn't stretch the button */
.bot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1em;
}

.bot-close {
  color: var(--teal-rich);
  cursor: pointer;
  right: 10px;
  position: absolute;
  font-size: 1.2em;
  top: 2px;
}

.welcome-message {
  padding: 0.8rem;
  font-size: 14px;
  font-weight: 300;
  background-color: rgba(224, 248, 255, 1);
}
.welcome h2 {
  font-weight: 600;
  font-size: 1.5rem;
  margin: 0;
}
.welcome p {
  font-weight: 300;
  font-size: 12px;
  margin: 0;
  line-height: 1.5;
  padding: 0.5rem 0rem; 
}
/* Hide the chat window and background when not open */
.open {
  width: 100%;
  max-width: 800px;
  height: 85%;
  border: 1px solid #ccc;
  background: rgba(224, 248, 255, 1);
  width: 30%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .open {
    width: 100%;
    max-width: 340px;
    height: 85%;
    border: 1px solid #ccc;
    background: white;
    bottom: 5em;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
}

.welcome {
  border-bottom: 1px solid #ccc;
}

.welcome-message {
  margin-bottom: 5px;
  font-family: var(--font-habibi);
  font-size: 12px;
  font-weight: 300;
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
  background-color: #f4f4f4;
  font-weight: 600;
  padding: 20px 15px;
  color: #000000;
  border-radius: 10px;
  max-width: 90%;
  margin-left: auto;
  font-size: 12px;
  font-family: var(--font-habibi);
}

.bot-message {
  /* background-color: #f0f0f0; */
  padding: 10px;
  border-radius: 10px;
  max-width: 90%;
}

.prompt-button {
  background: none;
  border: 2px solid rgb(11, 202, 196);
  color: #04787f;
  padding: 20px 10px;
  margin: 10px 0;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 2px;
  line-height: 1.25;
  transition: background-color 0.3s, color 0.3s;
  font-size: 12px;
  font-family: var(--font-inria);
  font-weight: 600;
}

.prompt-button:hover {
  background-color: rgba(11, 202, 196, 0.1);
  border-color: rgb(11, 202, 196);
}

.bot-message :deep(p) {
  margin: 0 0 10px 0;
}

.bot-message :deep(ul),
.bot-message :deep(ol) {
  margin: 0 0 10px 0;
  padding-left: 20px;
}

.bot-message :deep(h1),
.bot-message :deep(h2),
.bot-message :deep(h3),
.bot-message :deep(h4),
.bot-message :deep(h5),
.bot-message :deep(h6) {
  margin: 10px 0;
}

.bot-message :deep(code) {
  background-color: #f8f8f8;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: var(--font-inria);
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
   width: 100%;
   padding: 15px 50px 15px 20px;
   border: 1px solid #ccc;
   border-radius: 20px;
   height: 80px;
   background-color: #fff;
   font-size: 14px;
   line-height: 20px;
   margin-bottom: 0;
   resize: none;
   outline: none;
 }

input:focus {
  border-color: rgba(1, 42, 55, 0.5);
  box-shadow: 0 0 0 2px rgba(1, 42, 55, 0.1);
}

.send-icon-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #0bcac4;
  color: #000000;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  transition: background-color 0.2s;
}

.send-icon-btn:hover:not(:disabled) {
  background: rgba(107, 173, 193, 0.8);
}

.send-icon-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading-dots-small {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
}

.loading-dots-small .dot {
  animation: blink 1.4s infinite both;
  font-size: 1.2em;
  color: white;
  line-height: 1;
  display: inline-block;
}

.loading-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 2px;
  height: 100%;
  width: 100%;
}

.loading-dots .dot {
  animation: blink 1.4s infinite both;
  font-size: 1.8em;
  color: #007bff;
  line-height: 1;
  display: inline-block;
  height: 1em; /* Fixed height */
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0;
    color: #007bff; /* Blue when visible */
  }
  40% {
    opacity: 1;
    color: #ffffff; /* White when fully visible */
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}
</style>
