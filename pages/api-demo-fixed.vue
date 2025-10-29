<template>
  <div class="api-demo-page">
    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            OpenAI Realtime API & MCP Interface Demo
          </h1>
          <p class="hero-subtitle">
            Interactive demonstration of OpenAI's Realtime API with MCP (Model Context Protocol) integration
          </p>
        </div>
      </div>
    </section>

    <!-- API INTERFACE SECTION -->
    <section class="api-interface-section">
      <div class="container">
        <div class="interface-wrapper">
          <!-- CONFIGURATION PANEL -->
          <div class="config-panel">
            <h2 class="panel-title">Configuration</h2>
            
            <div class="config-form">
              <div class="form-group">
                <label for="api-key" class="form-label">OpenAI API Key</label>
                <input
                  id="api-key"
                  v-model="apiKey"
                  type="password"
                  class="form-input"
                  placeholder="Enter your OpenAI API key"
                  :disabled="isConnected"
                />
              </div>

              <div class="form-group">
                <label for="mcp-server" class="form-label">MCP Server URL</label>
                <input
                  id="mcp-server"
                  v-model="mcpServerUrl"
                  type="url"
                  class="form-input"
                  placeholder="https://directus.theburnescenter.org/mcp"
                  :disabled="isConnected"
                />
              </div>

              <div class="form-group">
                <label for="mcp-token" class="form-label">MCP Authorization Token</label>
                <input
                  id="mcp-token"
                  v-model="mcpToken"
                  type="password"
                  class="form-input"
                  placeholder="Enter MCP authorization token"
                  :disabled="isConnected"
                />
              </div>

              <div class="button-group">
                <button
                  v-if="!isConnected"
                  @click="connectToAPI"
                  :disabled="!canConnect"
                  class="connect-btn"
                >
                  Connect to APIs
                </button>
                <button
                  v-else
                  @click="disconnectFromAPI"
                  class="disconnect-btn"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          <!-- CHAT INTERFACE -->
          <div class="chat-panel">
            <h2 class="panel-title">Interactive Chat</h2>

            <!-- MESSAGES DISPLAY -->
            <div class="messages-container" ref="messagesContainer">
              <div
                v-for="(message, index) in messages"
                :key="index"
                :class="['message', `message-${message.role}`]"
              >
                <div class="message-header">
                  <span class="message-role">{{ message.role === 'user' ? 'You' : 'Assistant' }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="message-content">
                  <div class="message-text" v-html="formatMessageContent(message.content)"></div>
                </div>
              </div>

              <!-- LOADING INDICATOR -->
              <div v-if="isLoading" class="loading-message">
                <div class="loading-spinner" aria-hidden="true"></div>
                <span>AI is thinking...</span>
              </div>
            </div>

            <!-- INPUT AREA -->
            <div class="input-area">
              <div class="input-wrapper">
                <textarea
                  v-model="currentMessage"
                  class="message-input"
                  placeholder="Ask a question about democracy, AI, or governance..."
                  rows="3"
                  :disabled="!isConnected || isLoading"
                  @keydown="handleKeyDown"
                />
                <button
                  @click="sendMessage"
                  :disabled="!currentMessage.trim() || !isConnected || isLoading"
                  class="send-btn"
                >
                  Send
                </button>
              </div>
              
              <!-- EXAMPLE PROMPTS -->
              <div class="example-prompts">
                <span class="prompts-label">Try these examples:</span>
                <div class="prompt-buttons">
                  <button
                    v-for="prompt in examplePrompts"
                    :key="prompt"
                    class="prompt-btn"
                    @click="useExamplePrompt(prompt)"
                    :disabled="!isConnected || isLoading"
                  >
                    {{ prompt }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- API STATUS SECTION -->
    <section class="status-section">
      <div class="container">
        <div class="status-grid">
          <div class="status-card">
            <div class="status-indicator" :class="{ 'connected': isConnected }">
              <div class="status-dot"></div>
            </div>
            <div class="status-info">
              <h3 class="status-title">Connection Status</h3>
              <p>{{ isConnected ? 'Connected to OpenAI & MCP' : 'Disconnected' }}</p>
            </div>
          </div>

          <div class="status-card">
            <div class="status-info">
              <h3 class="status-title">Messages Sent</h3>
              <p>{{ messageCount }} messages</p>
            </div>
          </div>

          <div class="status-card">
            <div class="status-info">
              <h3 class="status-title">API Response Time</h3>
              <p>{{ lastResponseTime ? `${lastResponseTime}ms` : 'N/A' }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TECHNICAL DETAILS SECTION -->
    <section class="technical-section">
      <div class="container">
        <h2 class="section-title">Technical Implementation</h2>
        
        <div class="code-examples">
          <div class="code-block">
            <h3 class="code-title">OpenAI Realtime API Request</h3>
            <pre class="code-content"><code>{{ openaiExample }}</code></pre>
          </div>

          <div class="code-block">
            <h3 class="code-title">MCP Server Configuration</h3>
            <pre class="code-content"><code>{{ mcpExample }}</code></pre>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ApiDemo',
  data() {
    return {
      apiKey: '',
      mcpServerUrl: 'https://directus.theburnescenter.org/mcp',
      mcpToken: '',
      isConnected: false,
      isLoading: false,
      currentMessage: '',
      messages: [] as Array<{
        role: 'user' | 'assistant'
        content: string
        timestamp: Date
      }>,
      messageCount: 0,
      lastResponseTime: null as number | null,
      messagesContainer: null as HTMLElement | null,
      examplePrompts: [
        'Search for articles about democracy in the reboot democracy collection',
        'Find recent news about AI governance',
        'What are the latest developments in participatory democracy?',
        'Search for content related to digital governance'
      ],
      openaiExample: `curl https://api.openai.com/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${OPENAI_API_KEY}" \\
  -d '{
  "model": "gpt-4.1",
  "input": [
    {
      "role": "system",
      "content": [
        {
          "type": "input_text",
          "text": "You are a research assistant that searches MCP servers to find answers to your questions."
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "Search for all articles about: Democracy - in the reboot democracy and news that caught our eye collection"
        }
      ]
    }
  ],
  "tools": [
    {
      "type": "mcp",
      "server_label": "Burnes_Directus",
      "server_url": "https://directus.theburnescenter.org/mcp",
      "headers": {
        "Authorization": "Bearer \${MCP_TOKEN}"
      },
      "allowed_tools": ["search", "fetch"],
      "require_approval": "never"
    }
  ]
}'`,
      mcpExample: `{
  "server_label": "Burnes_Directus",
  "server_url": "https://directus.theburnescenter.org/mcp",
  "headers": {
    "Authorization": "Bearer \${MCP_TOKEN}"
  },
  "allowed_tools": [
    "search",
    "fetch",
    "items.read",
    "items.create",
    "items.update"
  ],
  "require_approval": "never"
}`
    }
  },
  computed: {
    canConnect() {
      return this.apiKey.trim() && this.mcpServerUrl.trim() && this.mcpToken.trim()
    }
  },
  methods: {
    async connectToAPI() {
      if (!this.canConnect) return
      
      try {
        this.isLoading = true
        
        // Test the API connection with a simple message
        const response = await fetch('/.netlify/functions/openai-realtime-mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Hello, please confirm you are working correctly.',
            apiKey: this.apiKey,
            mcpServerUrl: this.mcpServerUrl,
            mcpToken: this.mcpToken
          })
        })
        
        if (!response.ok) {
          throw new Error(`Connection failed: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        this.isConnected = true
        
        // Add welcome message
        this.addMessage('assistant', 'Hello! I\'m connected to the OpenAI Realtime API with MCP integration. I can help you search through the Reboot Democracy content and answer questions about democracy, AI, and governance. What would you like to explore?')
        
      } catch (error) {
        console.error('Connection failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.addMessage('assistant', `Sorry, I couldn't connect to the APIs: ${errorMessage}. Please check your credentials and try again.`)
      } finally {
        this.isLoading = false
      }
    },
    
    disconnectFromAPI() {
      this.isConnected = false
      this.messages = []
      this.messageCount = 0
      this.lastResponseTime = null
    },
    
    async sendMessage() {
      if (!this.currentMessage.trim() || !this.isConnected) return
      
      const userMessage = this.currentMessage.trim()
      this.currentMessage = ''
      
      // Add user message
      this.addMessage('user', userMessage)
      
      // Call API
      await this.callAPI(userMessage)
    },
    
    async callAPI(userMessage: string) {
      this.isLoading = true
      const startTime = Date.now()
      
      try {
        // Call the actual Netlify function
        const response = await fetch('/.netlify/functions/openai-realtime-mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            apiKey: this.apiKey,
            mcpServerUrl: this.mcpServerUrl,
            mcpToken: this.mcpToken
          })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        const responseTime = Date.now() - startTime
        this.lastResponseTime = responseTime
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        this.addMessage('assistant', data.message)
        
      } catch (error) {
        console.error('API call failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        this.addMessage('assistant', `Sorry, I encountered an error while processing your request: ${errorMessage}. Please check your API credentials and try again.`)
      } finally {
        this.isLoading = false
      }
    },
    
    addMessage(role: 'user' | 'assistant', content: string) {
      this.messages.push({
        role,
        content,
        timestamp: new Date()
      })
      
      if (role === 'user') {
        this.messageCount++
      }
      
      // Scroll to bottom
      this.$nextTick(() => {
        if (this.messagesContainer) {
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
        }
      })
    },
    
    useExamplePrompt(prompt: string) {
      this.currentMessage = prompt
    },
    
    handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.sendMessage()
      }
    },
    
    formatTime(timestamp: Date): string {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    
    formatMessageContent(content: string): string {
      // Simple formatting for demonstration
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
    }
  },
  
  mounted() {
    // Pre-fill with example values for demo purposes
    this.apiKey = process.env.OPENAI_API_KEY || ''
    this.mcpToken = process.env.MCP_TOKEN || ''
  }
})
</script>

<style scoped>
.api-demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section */
.hero-section {
  padding: 4rem 0 2rem;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  margin-bottom: 1rem;
  color: white;
  font-size: 3rem;
  font-weight: bold;
  font-family: var(--font-sora);
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  font-family: var(--font-habibi);
}

/* API Interface Section */
.api-interface-section {
  padding: 3rem 0;
}

.interface-wrapper {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 768px) {
  .interface-wrapper {
    grid-template-columns: 1fr;
  }
}

/* Configuration Panel */
.config-panel {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.panel-title {
  margin-bottom: 1.5rem;
  color: #1a202c;
  font-size: 1.5rem;
  font-weight: bold;
  font-family: var(--font-sora);
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-family: var(--font-sora);
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: var(--font-habibi);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
}

.button-group {
  margin-top: 1rem;
}

.connect-btn,
.disconnect-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-family: var(--font-sora);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.connect-btn {
  background: #667eea;
  color: white;
}

.connect-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.connect-btn:disabled {
  background: #e2e8f0;
  color: #9ca3af;
  cursor: not-allowed;
}

.disconnect-btn {
  background: #ef4444;
  color: white;
}

.disconnect-btn:hover {
  background: #dc2626;
}

/* Chat Panel */
.chat-panel {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 600px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.message {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
}

.message-user {
  background: #f0f9ff;
  border-left: 4px solid #0ea5e9;
}

.message-assistant {
  background: #f8fafc;
  border-left: 4px solid #10b981;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-role {
  font-weight: bold;
  font-family: var(--font-sora);
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: var(--font-sora);
}

.message-content {
  line-height: 1.6;
}

.message-text {
  color: #374151;
  font-family: var(--font-habibi);
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Input Area */
.input-area {
  margin-top: auto;
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: var(--font-habibi);
  font-size: 1rem;
  resize: vertical;
  min-height: 60px;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.message-input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
}

.send-btn {
  align-self: flex-end;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: var(--font-sora);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.send-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.send-btn:disabled {
  background: #e2e8f0;
  color: #9ca3af;
  cursor: not-allowed;
}

.example-prompts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.prompts-label {
  font-size: 0.875rem;
  font-family: var(--font-sora);
  color: #6b7280;
}

.prompt-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.prompt-btn {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: var(--font-sora);
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prompt-btn:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.prompt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Status Section */
.status-section {
  padding: 3rem 0;
  background: white;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.status-indicator {
  position: relative;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  transition: background-color 0.3s ease;
}

.status-indicator.connected .status-dot {
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-title {
  margin-bottom: 0.25rem;
  color: #1a202c;
  font-size: 1.125rem;
  font-weight: bold;
  font-family: var(--font-sora);
}

/* Technical Section */
.technical-section {
  padding: 3rem 0;
  background: #f8fafc;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
  color: #1a202c;
  font-size: 2rem;
  font-weight: bold;
  font-family: var(--font-sora);
}

.code-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.code-block {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.code-title {
  margin-bottom: 1rem;
  color: #1a202c;
  font-size: 1.125rem;
  font-weight: bold;
  font-family: var(--font-sora);
}

.code-content {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.code-content code {
  color: inherit;
  background: none;
  padding: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 0 1rem;
  }
  
  .api-interface-section,
  .status-section,
  .technical-section {
    padding: 2rem 0;
  }
  
  .code-examples {
    grid-template-columns: 1fr;
  }
  
  .prompt-buttons {
    flex-direction: column;
  }
  
  .prompt-btn {
    text-align: left;
  }
}
</style>
