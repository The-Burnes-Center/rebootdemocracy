<!-- components/ChatWidget.vue - Redesigned to match site design system -->
<template>
  <ClientOnly>
    <div class="chat-container chatbot-app" :class="{ open: isOpen, sending: busy }">
      <!-- FAB toggle button -->
      <button
        v-if="!isOpen"
        class="fab"
        :class="{ 'fab-pulse': !isOpen }"
        @click="toggleOpen"
        aria-label="Open chat"
      >
        <span class="bot-icon">
          <i class="fa-solid fa-message-bot"></i>
        </span>
      </button>

      <!-- Backdrop -->
      <transition name="fade">
        <div v-if="isOpen" class="backdrop" @click="isOpen = false" />
      </transition>

      <!-- Chat Panel -->
      <transition name="slide-up">
        <div v-if="isOpen" class="panel">
          <!-- Header -->
          <header class="chat-header">
            <div class="header-content">
              <h2 class="header-title">Reboot Democracy Bot</h2>
              <p class="header-subtitle">
                Enhanced by research from the GovLab and the Reboot Blog. Ask about AI, governance and democracy.
              </p>
            </div>
            <div class="header-badges" style="position: relative; z-index: 2;">
              <div class="kebab-container" ref="menuRef">
                <button
                  class="icon-button"
                  @click="toggleMenu"
                  :aria-expanded="showMenu ? 'true' : 'false'"
                  aria-haspopup="menu"
                  title="More actions"
                  aria-label="More actions"
                >
                  <i class="fa-solid fa-ellipsis"></i>
                </button>
                <transition name="fade">
                  <div v-if="showMenu" class="dropdown-menu" role="menu">
                    <button class="menu-item danger" role="menuitem" @click="handleClear">Clear conversation</button>
                  </div>
                </transition>
              </div>
              <button class="icon-button" @click="isOpen = false" title="Close" aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </header>

          <!-- Messages Container -->
          <section class="messages" ref="msgList">
            <!-- Welcome Message -->
            <div class="welcome-message">
              <div class="welcome-top compact">
                <div class="welcome-icon">
                  <i class="fa-solid fa-message-bot"></i>
                </div>
                <div class="welcome-heading">
                  <h3 class="welcome-title">Welcome</h3>
                  <p class="welcome-subtitle">Ask about AI, governance and democracy</p>
                </div>
              </div>
              <div class="welcome-body compact">
                <p class="welcome-text">
                  Welcome to the Reboot Democracy Bot. Trained on research and writing from the GovLab and the Reboot Blog, I answer your questions about technology, governance and democracy.
                </p>
                <p class="welcome-text">
                  Type a question you have about AI, democracy and governance in the box below. Here are some sample prompts to get you started!
                </p>
              </div>
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
                  <i class="fa-solid fa-message-bot"></i>
                </div>
                <!-- Show loading indicator if message is empty and busy, otherwise show content -->
                <div v-if="!m.text && busy" class="loading-message">
                  <div class="loading-spinner"></div>
                  <div class="loading-text">
                    <span class="loading-title">Reboot Democracy Bot is thinking...</span>
                    <span class="loading-subtitle">Searching through research and crafting a response</span>
                  </div>
                </div>
                <div v-else class="bot-content" v-html="md(m.text)" />
                <div v-if="m.sources?.length" class="sources">
                  <h4 class="sources-title">Sources:</h4>
                  <ul class="sources-list">
                    <li v-for="(s, j) in m.sources" :key="j" class="source-item">
                      <a :href="s.url" target="_blank" class="source-link">{{ s.title }}</a>
                    </li>
                  </ul>
                </div>
                <div class="message-actions" v-if="m.text">
                  <!-- <button class="download-docx" @click="downloadDocx(m, i)" :title="'Download this answer as .docx'">
                    <i class="fa-solid fa-file-word"></i>
                    <span>Download .docx</span>
                  </button> -->
                </div>
              </div>
            </div>
          </section>

          <!-- Input Area -->
          <footer class="input-area">
            <div class="input-container">
              <textarea
                ref="textareaRef"
                v-model="draft"
                rows="1"
                @keydown.enter.exact.prevent="send"
                @keydown.shift.enter.stop
                @input="autoGrow"
                :disabled="busy"
                placeholder="Type your question about AI, democracy, or governance..."
                :class="['message-textarea', { sending: busy }]"
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
            <!-- helper row removed; clear action moved to header kebab -->
          </footer>
        </div>
      </transition>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { marked } from "marked";
import DOMPurify from "dompurify";
// Note: We'll dynamically import these in the click handler to be safe in SSR
// import { saveAs } from "file-saver"; // Moved to dynamic import
// import htmlDocx from "html-docx-js-typescript"; // Also moved to dynamic import

const draft = ref("");
const msgs = ref<{ sender: "user" | "bot"; text: string; sources?: any[] }[]>(
  []
);
const busy = ref<boolean>(false);
const isOpen = ref<boolean>(false);
const sample = [
  "Can you summarize the latest research on AI and participatory decision-making in urban planning?",
  "Give me case studies where AI was integrated into public engagement.",
  "How can AI help address misinformation during election campaigns?",
];

const md = (t: string) => DOMPurify.sanitize(marked.parse(t) as string);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildDocHtml(message: { text: string; sources?: Array<{ title?: string; url?: string }> }): string {
  const contentHtml = md(message.text);
  const sourcesSection = (message.sources?.length ?? 0) > 0
    ? `<h3>Sources</h3><ol>` +
      message.sources!
        .map((s) => `<li><a href="${s.url ?? "#"}">${escapeHtml(s.title || s.url || "Source")}</a></li>`)
        .join("") +
      `</ol>`
    : "";

  const timestamp = new Date().toLocaleString();

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Reboot Democracy Bot – Answer</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; color:#111827; line-height:1.6; }
        h1,h2,h3 { color:#003366; margin: 0.6em 0 0.4em; }
        a { color:#0d63eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .header { border-left:4px solid #003366; padding:12px 16px; background:#f8f9fa; margin-bottom:16px; }
        .meta { font-size:12px; color:#6b7280; }
        .answer { font-size:14px; }
        blockquote{ border-left:4px solid #e5e7eb; margin:8px 0; padding-left:12px; color:#6b7280; font-style:italic; }
        code{ background:#f3f4f6; padding:2px 6px; border-radius:4px; color:#dc2626; }
        pre{ background:#f3f4f6; padding:12px; border-radius:6px; overflow-x:auto; }
        .sources{ margin-top:16px; border-top:1px solid #e5e7eb; padding-top:8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Reboot Democracy Bot – Answer</h2>
        <div class="meta">${escapeHtml(timestamp)}</div>
      </div>
      <main class="answer">${contentHtml}${sourcesSection ? `<div class="sources">${sourcesSection}</div>` : ""}</main>
    </body>
  </html>`;
}

async function downloadDocx(message: { text: string; sources?: any[] }, index: number): Promise<void> {
  try {
    const html = buildDocHtml(message);
    // Try serverless export first for maximum compatibility/quality
    const resp = await fetch('/.netlify/functions/export_docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, fileName: `reboot-answer-${index + 1}` })
    });

    if (resp.ok) {
      // Prefer binary path – Netlify decodes base64 when isBase64Encoded = true
      const buf = await resp.arrayBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      // Dynamic import for client-side only
      const { saveAs } = await import('file-saver');
      saveAs(blob, `reboot-answer-${index + 1}.docx`);
      return;
    }

    // Fallback to client-side .doc export if serverless fails
    const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
    
    // Dynamic import for client-side only
    const { saveAs } = await import('file-saver');
    saveAs(htmlBlob, `reboot-answer-${index + 1}.doc`);
  } catch (error) {
    console.error("Failed to export DOCX:", error);
    alert("Sorry, the download failed. Please try again.");
  }
}

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const chatSessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
const userMessageCount = ref<number>(0);
const botMessageCount = ref<number>(0);
const exchangeCount = ref<number>(0);
const hasEmittedConversationStart = ref<boolean>(false);

function gtagSafe(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, {
      chat_session_id: chatSessionId,
      ...params,
    });
  }
}
const showMenu = ref<boolean>(false);
const menuRef = ref<HTMLElement | null>(null);

function autoGrow() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

function toggleOpen() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    gtagSafe("chatbot_open", { ui: "fab" });
  } else {
    gtagSafe("chatbot_close", {
      user_messages: userMessageCount.value,
      bot_messages: botMessageCount.value,
      exchanges: exchangeCount.value,
    });
  }
}

function clearChat() {
  msgs.value = [];
  draft.value = "";
  nextTick(() => autoGrow());
}

// Removed manual dismiss; welcome stays visible but compact

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function handleClear() {
  clearChat();
  showMenu.value = false;
}

function onKeydownWindow(e: KeyboardEvent) {
  if (e.key === "Escape" && isOpen.value) {
    isOpen.value = false;
  }
  if (e.key === "Escape" && showMenu.value) {
    showMenu.value = false;
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydownWindow);
  document.addEventListener("click", onClickOutside, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydownWindow);
  document.removeEventListener("click", onClickOutside, true);
});

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

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      nextTick(() => {
        textareaRef.value?.focus();
        autoGrow();
      });
    }
  }
);

function onClickOutside(e: Event) {
  if (!showMenu.value) return;
  const target = e.target as Node;
  if (menuRef.value && !menuRef.value.contains(target)) {
    showMenu.value = false;
  }
}

/** Send a message to Netlify Function and stream back */
async function send() {
  if (!draft.value.trim() || busy.value) return;
  busy.value = true;

  // 1. push user line
  msgs.value.push({ sender: "user", text: draft.value });
  userMessageCount.value += 1;
  if (!hasEmittedConversationStart.value) {
    hasEmittedConversationStart.value = true;
    gtagSafe("chatbot_conversation_started", {});
  }
  gtagSafe("chatbot_message_user", { user_messages: userMessageCount.value });
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
    // Count completed bot reply and emit exchange
    if ((bot.text || "").trim().length > 0) {
      botMessageCount.value += 1;
      exchangeCount.value = Math.min(userMessageCount.value, botMessageCount.value);
      gtagSafe("chatbot_message_bot", { bot_messages: botMessageCount.value });
      gtagSafe("chatbot_exchange", { exchanges: exchangeCount.value });
    }
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

/* When open, ensure the chatbot overlays site header/menus */
.chatbot-app.open {
  z-index: 9999;
}

/* Backdrop */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* FAB Button – original rounded gradient pill */
.fab {
  min-width: 60px;
  height: 60px;
  border-radius: 9999px;
  border: none;
  background: #0d63eb;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(13, 99, 235, 0.32), 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
  position: relative;
  z-index: 1001;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(13, 99, 235, 0.42), 0 3px 10px rgba(0, 0, 0, 0.08);
  filter: brightness(1.02);
}

.fab:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 12px 30px rgba(13, 99, 235, 0.34), 0 2px 10px rgba(0,0,0,0.08);
  filter: brightness(1.02);
}

.fab-pulse {
  animation: fabBreath 1.8s ease-in-out infinite;
}

.fab-pulse::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  pointer-events: none;
  box-shadow: 0 0 0 0 rgba(1, 56, 114, 0.46); 
  animation: fabRing 1.8s ease-out infinite;
}

@keyframes fabBreath {
  0% {
    transform: scale(0.95);
  }
  70% {
    transform: scale(1);
  }
  100% {
    transform: scale(0.95);
  }
}

@keyframes fabRing {
  0% {
    box-shadow: 0 0 0 0 rgba(1, 56, 114, 0.46);
  }
  70% {
    box-shadow: 0 0 0 14px rgba(1, 56, 114, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(1, 56, 114, 0);
  }
}

.fab:focus-visible {
  box-shadow:
    0 0 0 3px rgba(13, 99, 235, 0.22),
    0 8px 18px rgba(13, 99, 235, 0.42),
    0 3px 10px rgba(0, 0, 0, 0.08);
}

.close-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  font-size: 0.95rem;
}

.fab-label { display: none; }

.bot-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: transparent;
  border: none;
  box-shadow: none;
}

.bot-icon i {
  font-size: 1.35rem;
  line-height: 1;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}

/* Chat Panel */
.panel {
  width: 600px;
  height: 600px;
  background: rgba(255, 255, 255, 0.82);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 20px;
  position: relative;
}

.chatbot-app.open .panel {
  height: calc(100vh - 40px);
  margin-bottom: 0;
}

.panel-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(255,255,255,0.9);
  border: 1px solid #e5e7eb;
  color: #111827;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  z-index: 1;
}

.panel-close:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

/* Header */
.chat-header {
  background: linear-gradient(135deg, #003266 0%, #004080 50%, #005999 100%);
  color: white;
  padding: 14px 14px;
  border-radius: 16px 16px 0 0;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 8px 12px;
}

.header-title {
  font-family: var(--font-sora);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.header-subtitle {
  font-family: var(--font-habibi);
  font-size: 1rem;
  font-weight: 400;
  margin: 0;
  line-height: 1.4;
  opacity: 0.9;
}

.header-badges {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.kebab-container { position: relative; }

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 36px;
  min-width: 140px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  padding: 4px;
  z-index: 1002;
}

.menu-item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
  font-family: var(--font-habibi);
  font-size: 0.8rem;
  color: #111827;
  cursor: pointer;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.danger {
  color: #b91c1c;
}

.badge {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  font-family: var(--font-habibi);
  font-weight: 700;
  font-size: 1rem;
  padding: 4px 8px;
  border-radius: 9999px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.icon-button {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.28);
}

/* Messages Container */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(180deg, rgba(248, 249, 250, 0.85) 0%, rgba(248, 249, 250, 1) 100%);
}

/* Welcome Message */
.welcome-message {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 14px 40px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
}

.welcome-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #003266 0%, #004080 50%, #005999 100%);
  color: #ffffff;
}

.welcome-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.welcome-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-title {
  margin: 0;
  font-family: var(--font-sora);
  font-weight: 600;
  font-size: 1.25rem;
}

.welcome-subtitle {
  margin: 0;
  font-family: var(--font-habibi);
  font-size: 1rem;
  opacity: 0.9;
}

.welcome-dismiss {
  margin-left: auto;
  background: rgba(255,255,255,0.16);
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.35);
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.welcome-dismiss:hover {
  background: rgba(255,255,255,0.28);
}

.welcome-body {
  background: #ffffff;
  padding: 10px 12px 12px 12px;
}

.welcome-text {
  font-family: var(--font-habibi);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 8px 0;
  color: #1f2937;
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
  background: #f8fbff;
  border: 1px solid #cfe0ff;
  border-radius: 10px;
  padding: 12px 14px 12px 40px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.1s ease;
  font-family: var(--font-sora);
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.45;
  color: #0f1e3a;
  position: relative;
}

.sample-button:hover {
  border-color: #0d63eb;
  background: #eaf3ff;
  color: #0d63eb;
  transform: translateY(-1px);
}

.sample-button::before {
  content: "→";
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #0d63eb;
  font-size: 0.9rem;
}

.sample-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(13, 99, 235, 0.18);
  border-color: #0d63eb;
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
  font-size: 1rem;
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
  background: #ffffff;
  padding: 14px 16px;
  border-radius: 14px 14px 14px 6px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  flex: 1;
  position: relative;
}

/* Subtle speech-bubble pointer */
.bot-content::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 16px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #ffffff; /* match bubble bg */
}

.bot-content::after {
  content: "";
  position: absolute;
  left: -9px;
  top: 16px;
  width: 0;
  height: 0;
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
  border-right: 9px solid #e5e7eb; 
}

/* Tighter, readable typography inside the bot bubble */
.bot-content :deep(p),
.bot-content :deep(li) {
  color: #1f2937;
}

.bot-content :deep(a) {
  color: #0d63eb;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.bot-content :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 12px 0;
}

.bot-content :deep(p) {
  font-family: var(--font-habibi);
  font-size: 1rem;
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
  font-family: var(--font-habibi);
  font-weight: 600;
  margin: 12px 0 8px 0;
  color: #111827;
}

/* Enforce Sora for h2 and h3 in chatbot */
.bot-content :deep(h2),
.bot-content :deep(h3) {
  font-family: var(--font-sora);
  font-weight: 600;
}

.bot-content :deep(ul),
.bot-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.bot-content :deep(li) {
  font-family: var(--font-habibi);
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 4px;
}

.bot-content :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-habibi);
  font-size: 1rem;
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

.message-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.download-docx {
  background: white;
  border: 1px solid #e5e7eb;
  color: #003366;
  border-radius: 6px;
  padding: 6px 10px;
  font-family: var(--font-habibi);
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-docx:hover {
  border-color: #0d63eb;
  color: #0d63eb;
  background: #f0f7ff;
}

/* Sources */
.sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.sources-title {
  font-family: var(--font-habibi);
  font-size: 1rem;
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
  font-size: 1rem;
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
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid #e5e7eb;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.message-textarea {
  width: 100%;
  max-height: 160px;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  font-family: var(--font-habibi);
  font-size: 1rem;
  line-height: 1.45;
  background: white;
  outline: none;
  resize: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.message-textarea:focus {
  border-color: #0d63eb;
  box-shadow: 0 0 0 3px rgba(13, 99, 235, 0.1);
}

.message-textarea::placeholder {
  color: #9ca3af;
}

/* While sending/disabled */
.message-textarea.sending,
.message-textarea:disabled {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

/* Visual feedback while sending */
.message-textarea.sending,
.message-textarea:disabled {
  border-color: #0d63eb;
  box-shadow: 0 0 0 3px rgba(13, 99, 235, 0.12);
  background-image: linear-gradient(90deg, rgba(13,99,235,0.05), rgba(13,99,235,0.0));
  background-size: 200% 100%;
  animation: sendingPulse 1.2s ease-in-out infinite;
}

@keyframes sendingPulse {
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 0%; }
}

.message-input {
  width: 100%;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 24px;
  font-family: var(--font-habibi);
  font-size: 1rem;
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
  background: linear-gradient(135deg, #0d63eb 0%, #0056cc 100%);
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
  filter: brightness(1.05);
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

/* Loading Message Styles */
.loading-message {
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 4px solid #003366;
  animation: pulse-gentle 2s ease-in-out infinite;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #003366;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

.loading-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.loading-title {
  font-family: var(--font-habibi);
  font-size: 1rem;
  font-weight: 600;
  color: #003366;
  line-height: 1.2;
}

.loading-subtitle {
  font-family: var(--font-habibi);
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.3;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse-gentle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.01);
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
    right: 12px;
    left: auto;
    bottom: 12px;
    align-items: flex-end; 
  }
  
  .fab {
    width: 44px;
    min-width: 44px;
    height: 44px;
    font-size: 1rem;
    box-shadow: 0 4px 10px rgba(13, 99, 235, 0.28), 0 1px 4px rgba(0,0,0,0.06);
    align-self: flex-end; /* ensure the FAB stays sized to content */
  }

  .bot-icon {
    width: 22px;
    height: 22px;
  }

  .bot-icon i {
    font-size: 1.05rem;
  }

  .panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    max-width: none;
    height: 78vh; 
    margin: 0;
    border-radius: 16px 16px 0 0;
    border: 1px solid #e5e7eb;
    box-shadow: 0 -8px 24px rgba(0,0,0,0.12);
    z-index: 10005;
    overflow: hidden;
  }
  .chat-header {
    padding-top: calc(14px + env(safe-area-inset-top));
  }
  
  .fab {
    min-width: 56px;
    height: 56px;
    font-size: 1.25rem;
  }
  
  .messages {
    padding: 16px;
    padding-bottom: 8px; 
  }
  
  .input-area {
    padding: 12px 12px 16px 12px;
  }
}

@media (max-width: 480px) {
  .panel {
    width: 100vw;
    height: 100dvh;
    top: 0;
    bottom: 0;
  }
  .chat-header {
    padding-top: calc(14px + env(safe-area-inset-top));
  }
  
  .user-message {
    max-width: 85%;
  }
  
  .bot-message {
    max-width: 95%;
  }
}

.helper-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hint {
  font-family: var(--font-habibi);
  font-size: 0.75rem;
  color: #6b7280;
}

.clear-button {
  background: white;
  border: 1px solid #e5e7eb;
  color: #003366;
  border-radius: 8px;
  padding: 6px 10px;
  font-family: var(--font-habibi);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover:not(:disabled) {
  border-color: #0d63eb;
  color: #0d63eb;
  background: #f0f7ff;
}
</style>

