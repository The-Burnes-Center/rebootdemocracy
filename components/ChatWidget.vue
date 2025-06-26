<!-- components/ChatWidget.vue -->
<template>
  <ClientOnly>
    <div class="chat-container chatbot-app" :class="{ open }">
      <!-- FAB toggle  -->
      <button class="fab" @click="open = !open">
        <span v-if="!open"><div class="bot-icon"><i class="fa-solid fa-message-bot"></i></div></span><span v-else>✕</span>
      </button>

      <!-- Panel -->
      <transition name="slide-up">
        <div v-if="open" class="panel">
          <header class="welcome">
            <h2>Reboot Democracy Bot</h2>
            <p>
              Enhanced by research from the GovLab and the Reboot Blog.
              Ask about AI, governance and democracy.
            </p>
         
          </header>

          <section class="messages" ref="msgList">
            <h3>Sample questions</h3>
            <div class="bot-message">
              <div v-for="(q, i) in sample" :key="i">
                <button class="prompt-button" @click="useSample(q)">{{ q }}</button>
              </div>
            </div>
            <div v-for="(m, i) in msgs" :key="i"
                 :class="['msg', m.sender]">
              <p v-if="m.sender==='user'" class="user-message">{{ m.text }}</p>
              <div v-else v-html="md(m.text)"/>
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
            <input v-model="draft"
                   @keyup.enter="send"
                   :disabled="busy"
                   placeholder="Type your question…" />
                   <button @click="send" :disabled="busy">
  <span v-if="busy" class="loading-dots">
    <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
  </span>
  <span v-else>Send</span>
</button>
          </footer>
        </div>
      </transition>
    </div>
  </ClientOnly>
</template>
<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const draft   = ref('')
const msgs    = ref<{sender:'user'|'bot',text:string,sources?:any[]}[]>([])
const busy    = ref(false)
const open    = ref(false)
const sample  = [
  'Can you summarize the latest research on AI and participatory decision-making in urban planning?',
  'Give me case studies where AI was integrated into public engagement.',
  'How can AI help address misinformation during election campaigns?'
]

const md = (t:string) => DOMPurify.sanitize(marked.parse(t))

/** Scroll chat to bottom each update */
const msgList = ref<HTMLDivElement>()
  watch(() => msgs.value.length, () => {
  nextTick(() => {
    msgList.value?.scrollTo({ top: msgList.value.scrollHeight + 60})
  })
})

/** Send a message to Netlify Function and stream back */
async function send () {
  if (!draft.value.trim() || busy.value) return
  busy.value = true

  // 1. push user line
  msgs.value.push({ sender:'user', text:draft.value })
  await nextTick()
  msgList.value?.scrollTo({ top: msgList.value.scrollHeight + 60 })

  const bot = { sender:'bot', text:'' } as any
  msgs.value.push(bot)
  await nextTick()
  msgList.value?.scrollTo({ top: msgList.value.scrollHeight + 60 })

  try {
    // 2. map conversation so Lambda can reuse context
    const convo = msgs.value.map(m => ({
      type: m.sender === 'user' ? 'user' : 'bot',
      content: m.text
    }))

    const res = await fetch('/.netlify/functions/chatbot_reboot', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ message: draft.value, conversation: convo })
    })
    if (!res.ok) {
      // Try to read the error body for more info
      let errorText = ''
      try {
        errorText = await res.text()
      } catch (e) {
        errorText = '(Could not read error body)'
      }
      console.error('Fetch failed:', {
        status: res.status,
        statusText: res.statusText,
        errorBody: errorText
      })
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
    }
    console.log(res);
    // 3. streaming loop (unchanged)
    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      for (const raw of decoder.decode(value).split('\n\n')) {
        if (!raw.startsWith('data: ')) continue
        const chunk = raw.slice(6).trim()
        if (!chunk || chunk === '[DONE]') continue
        const payload = JSON.parse(chunk)
        if (payload.content) bot.text += payload.content
        if (payload.sourceDocuments) bot.sources = payload.sourceDocuments
      }
    }
    
    // 4. Scroll to show beginning of the answer
    await nextTick()
    setTimeout(() => {
      const botMessageElement = msgList.value?.querySelector('.msg.bot:last-child')
      if (botMessageElement) {
        botMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
    
  } catch (err) {
    // Print as much info as possible
    console.error('ChatWidget send() error:', err)
    if (err instanceof Error && err.stack) {
      console.error('Stack trace:', err.stack)
    }
  } finally {
    draft.value = ''
    busy.value  = false
  }
}


function useSample(q:string) { draft.value = q; send() }
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
  flex-direction: row;
  
}
/* Make the messages section scrollable */
.messages {
  flex: 1 1 auto;
  max-height: 55vh;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 5px; /* for scrollbar */
  border:1px solid #ccc;

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
  /* bottom: 40px; */
  z-index: 201;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  font-size: 1.5em;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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

/* Add styling for the bot icon to ensure it doesn't stretch the button */
.bot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* Hide the chat window and background when not open */
.open {
  width: 100%;
  max-width: 800px;
  height: 85%;
  border: 1px solid #ccc;
  background: white;
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
  bottom:5em;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
}

    
.welcome {
    border-bottom:1px solid #ccc;
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
    font-weight:600;
    padding: 10px;
    color:#0d63eb;
        border-radius: 10px;
    max-width: 70%;
    margin-left: auto;
    font-size:large;
  }
  
  .bot-message {
    /* background-color: #f0f0f0; */
    padding: 10px;
    border-radius: 10px;
    max-width: 90%;

  }

  .prompt-button
  {
    background: #f0f0f0;
    /* border: 1px solid #007bff; */
    color: #007bff;
    padding: 10px;
    text-align: left;
    cursor: pointer;
    border-radius: 5px;
    margin:10px;
    transition: background-color .3s, color .3s;
    font-weight: 700;
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
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px 0 0 5px;
    width:70%;
  }
  
  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 0 5px 5px 0;
    cursor: pointer;
    height: 42px; /* Fixed height to prevent size changes */
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px; /* Ensure minimum width */
  }
  
  button:disabled {
    background-color: #cccccc;
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
  color: #007bff; /* Blue color for dots */
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
  0%, 80%, 100% { 
    opacity: 0; 
    color: #007bff; /* Blue when visible */
  }
  40% { 
    opacity: 1; 
    color: #ffffff; /* White when fully visible */
  }
}
  </style>