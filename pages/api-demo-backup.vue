<template>
  <div class="api-demo-page">
    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <Text
            as="h1"
            size="5xl"
            weight="bold"
            fontFamily="sora"
            lineHeight="extra-loose"
            color="text-dark"
            class="hero-title"
          >
            OpenAI Realtime API & MCP Interface Demo
          </Text>
          <Text
            as="p"
            size="xl"
            weight="medium"
            fontFamily="habibi"
            lineHeight="relaxed"
            color="text-primary"
            class="hero-subtitle"
          >
            Interactive demonstration of OpenAI's Realtime API with MCP (Model Context Protocol) integration
          </Text>
        </div>
      </div>
    </section>

    <!-- API INTERFACE SECTION -->
    <section class="api-interface-section">
      <div class="container">
        <div class="interface-wrapper">
          <!-- CONFIGURATION PANEL -->
          <div class="config-panel">
            <Text
              as="h2"
              size="2xl"
              weight="bold"
              fontFamily="sora"
              class="panel-title"
            >
              Configuration
            </Text>
            
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
                <Button
                  v-if="!isConnected"
                  variant="primary"
                  :onClick="connectToAPI"
                  :disabled="!canConnect"
                  class="connect-btn"
                >
                  Connect to APIs
                </Button>
                <Button
                  v-else
                  variant="secondary"
                  :onClick="disconnectFromAPI"
                  class="disconnect-btn"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </div>

          <!-- CHAT INTERFACE -->
          <div class="chat-panel">
            <Text
              as="h2"
              size="2xl"
              weight="bold"
              fontFamily="sora"
              class="panel-title"
            >
              Interactive Chat
            </Text>

            <!-- MESSAGES DISPLAY -->
            <div class="messages-container" ref="messagesContainer">
              <div
                v-for="(message, index) in messages"
                :key="index"
                :class="['message', `message-${message.role}`]"
              >
                <div class="message-header">
                  <Text
                    as="span"
                    size="sm"
                    weight="bold"
                    fontFamily="sora"
                    :color="message.role === 'user' ? 'text-primary' : 'text-secondary'"
                  >
                    {{ message.role === 'user' ? 'You' : 'Assistant' }}
                  </Text>
                  <Text
                    as="span"
                    size="xs"
                    weight="normal"
                    fontFamily="sora"
                    color="text-muted"
                    class="message-time"
                  >
                    {{ formatTime(message.timestamp) }}
                  </Text>
                </div>
                <div class="message-content">
                  <Text
                    as="div"
                    size="base"
                    weight="normal"
                    fontFamily="habibi"
                    lineHeight="relaxed"
                    class="message-text"
                    v-html="formatMessageContent(message.content)"
                  />
                </div>
              </div>

              <!-- LOADING INDICATOR -->
              <div v-if="isLoading" class="loading-message">
                <div class="loading-spinner" aria-hidden="true"></div>
                <Text
                  as="span"
                  size="sm"
                  weight="medium"
                  fontFamily="sora"
                  color="text-muted"
                >
                  AI is thinking...
                </Text>
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
                <Button
                  variant="primary"
                  :onClick="sendMessage"
                  :disabled="!currentMessage.trim() || !isConnected || isLoading"
                  class="send-btn"
                >
                  Send
                </Button>
              </div>
              
              <!-- EXAMPLE PROMPTS -->
              <div class="example-prompts">
                <Text
                  as="span"
                  size="sm"
                  weight="medium"
                  fontFamily="sora"
                  color="text-muted"
                  class="prompts-label"
                >
                  Try these examples:
                </Text>
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
              <Text
                as="h3"
                size="lg"
                weight="bold"
                fontFamily="sora"
                class="status-title"
              >
                Connection Status
              </Text>
              <Text
                as="p"
                size="base"
                weight="normal"
                fontFamily="habibi"
                color="text-muted"
              >
                {{ isConnected ? 'Connected to OpenAI & MCP' : 'Disconnected' }}
              </Text>
            </div>
          </div>

          <div class="status-card">
            <div class="status-info">
              <Text
                as="h3"
                size="lg"
                weight="bold"
                fontFamily="sora"
                class="status-title"
              >
                Messages Sent
              </Text>
              <Text
                as="p"
                size="base"
                weight="normal"
                fontFamily="habibi"
                color="text-muted"
              >
                {{ messageCount }} messages
              </Text>
            </div>
          </div>

          <div class="status-card">
            <div class="status-info">
              <Text
                as="h3"
                size="lg"
                weight="bold"
                fontFamily="sora"
                class="status-title"
              >
                API Response Time
              </Text>
              <Text
                as="p"
                size="base"
                weight="normal"
                fontFamily="habibi"
                color="text-muted"
              >
                {{ lastResponseTime ? `${lastResponseTime}ms` : 'N/A' }}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TECHNICAL DETAILS SECTION -->
    <section class="technical-section">
      <div class="container">
        <Text
          as="h2"
          size="3xl"
          weight="bold"
          fontFamily="sora"
          lineHeight="extra-loose"
          class="section-title"
        >
          Technical Implementation
        </Text>
        
        <div class="code-examples">
          <div class="code-block">
            <Text
              as="h3"
              size="lg"
              weight="bold"
              fontFamily="sora"
              class="code-title"
            >
              OpenAI Realtime API Request
            </Text>
            <pre class="code-content"><code>{{ openaiExample }}</code></pre>
          </div>

          <div class="code-block">
            <Text
              as="h3"
              size="lg"
              weight="bold"
              fontFamily="sora"
              class="code-title"
            >
              MCP Server Configuration
            </Text>
            <pre class="code-content"><code>{{ mcpExample }}</code></pre>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useHead } from '@unhead/vue'

// Page metadata
useHead({
  title: 'OpenAI Realtime API & MCP Demo - Reboot Democracy',
  meta: [
    { 
      name: 'description', 
      content: 'Interactive demonstration of OpenAI Realtime API with MCP (Model Context Protocol) integration for democracy and governance research.' 
    },
    { property: 'og:title', content: 'OpenAI Realtime API & MCP Demo' },
    { property: 'og:description', content: 'Interactive demonstration of OpenAI Realtime API with MCP integration' },
    { property: 'og:type', content: 'website' }
  ],
})

// Reactive state
const apiKey = ref('')
const mcpServerUrl = ref('https://directus.theburnescenter.org/mcp')
const mcpToken = ref('')
const isConnected = ref(false)
const isLoading = ref(false)
const currentMessage = ref('')
const messages = ref<Array<{
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}>>([])
const messageCount = ref(0)
const lastResponseTime = ref<number | null>(null)
const messagesContainer = ref<HTMLElement>()

// Example prompts
const examplePrompts = ref([
  'Search for articles about democracy in the reboot democracy collection',
  'Find recent news about AI governance',
  'What are the latest developments in participatory democracy?',
  'Search for content related to digital governance'
])

// Computed properties
const canConnect = computed(() => {
  return apiKey.value.trim() && mcpServerUrl.value.trim() && mcpToken.value.trim()
})

// Code examples
const openaiExample = ref(`curl https://api.openai.com/v1/responses \\
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
}'`)

const mcpExample = ref(`{
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
}`)

// Methods
const connectToAPI = async () => {
  if (!canConnect.value) return
  
  try {
    isLoading.value = true
    
    // Test the API connection with a simple message
    const response = await fetch('/.netlify/functions/openai-realtime-mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, please confirm you are working correctly.',
        apiKey: apiKey.value,
        mcpServerUrl: mcpServerUrl.value,
        mcpToken: mcpToken.value
      })
    })
    
    if (!response.ok) {
      throw new Error(`Connection failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    isConnected.value = true
    
    // Add welcome message
    addMessage('assistant', 'Hello! I\'m connected to the OpenAI Realtime API with MCP integration. I can help you search through the Reboot Democracy content and answer questions about democracy, AI, and governance. What would you like to explore?')
    
  } catch (error) {
    console.error('Connection failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    addMessage('assistant', `Sorry, I couldn't connect to the APIs: ${errorMessage}. Please check your credentials and try again.`)
  } finally {
    isLoading.value = false
  }
}

const disconnectFromAPI = () => {
  isConnected.value = false
  messages.value = []
  messageCount.value = 0
  lastResponseTime.value = null
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || !isConnected.value) return
  
  const userMessage = currentMessage.value.trim()
  currentMessage.value = ''
  
  // Add user message
  addMessage('user', userMessage)
  
  // Simulate API call
  await simulateAPIResponse(userMessage)
}

const simulateAPIResponse = async (userMessage: string) => {
  isLoading.value = true
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
        apiKey: apiKey.value,
        mcpServerUrl: mcpServerUrl.value,
        mcpToken: mcpToken.value
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    const responseTime = Date.now() - startTime
    lastResponseTime.value = responseTime
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    addMessage('assistant', data.message)
    
  } catch (error) {
    console.error('API call failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    addMessage('assistant', `Sorry, I encountered an error while processing your request: ${errorMessage}. Please check your API credentials and try again.`)
  } finally {
    isLoading.value = false
  }
}

const generateContextualResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('democracy')) {
    return `I found several articles about democracy in our collection. Based on the MCP search results, here are some key findings:

**Recent Articles on Democracy:**
- "Digital Democracy in Practice" - A comprehensive analysis of how technology is reshaping democratic participation
- "AI and Democratic Governance" - Exploring the intersection of artificial intelligence and democratic processes
- "Participatory Democracy in the Digital Age" - Case studies from various implementations

**Key Insights:**
- Digital tools are enabling new forms of citizen engagement
- AI can help process large volumes of public input
- There's growing interest in deliberative democracy models

Would you like me to search for more specific aspects of democracy or explore any particular angle?`
  }
  
  if (lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence')) {
    return `Great question about AI! I found several relevant articles in our collection:

**AI and Governance Articles:**
- "AI for Public Good" - Examining how AI can serve democratic purposes
- "Algorithmic Transparency in Government" - The importance of explainable AI in public sector
- "Machine Learning for Policy Analysis" - Using AI to analyze policy impacts

**Current Trends:**
- Increased focus on AI ethics in government
- Growing use of AI for public consultation
- Challenges around algorithmic bias and fairness

The research shows that AI has significant potential to enhance democratic processes when implemented thoughtfully. What specific aspect of AI and governance interests you most?`
  }
  
  if (lowerMessage.includes('governance')) {
    return `I found extensive content on governance in our collection:

**Governance Innovation Articles:**
- "Digital Governance Models" - Comparative analysis of different approaches
- "Citizen Engagement in Policy Making" - Case studies from various countries
- "Technology-Enhanced Democracy" - Tools and platforms for democratic participation

**Key Themes:**
- Digital transformation of government services
- Citizen participation in policy development
- Transparency and accountability mechanisms
- International best practices in digital governance

Our research covers both theoretical frameworks and practical implementations. Would you like to dive deeper into any specific governance topic?`
  }
  
  // Default response
  return `I understand you're interested in "${message}". Let me search through our Reboot Democracy collection to find relevant content.

Based on the MCP search results, I can help you explore:
- Articles and research papers
- News and current developments
- Case studies and best practices
- Policy analysis and recommendations

What specific aspect would you like me to focus on? I can search for more targeted information or provide a broader overview of the topic.`
}

const addMessage = (role: 'user' | 'assistant', content: string) => {
  messages.value.push({
    role,
    content,
    timestamp: new Date()
  })
  
  if (role === 'user') {
    messageCount.value++
  }
  
  // Scroll to bottom
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const useExamplePrompt = (prompt: string) => {
  currentMessage.value = prompt
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const formatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatMessageContent = (content: string): string => {
  // Simple formatting for demonstration
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// Initialize with demo data
onMounted(() => {
  // Pre-fill with example values for demo purposes
  apiKey.value = process.env.OPENAI_API_KEY || ''
  mcpToken.value = process.env.MCP_TOKEN || ''
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
  color: white !important;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.9) !important;
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

.message-time {
  font-size: 0.75rem;
}

.message-content {
  line-height: 1.6;
}

.message-text {
  color: #374151;
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
}

.example-prompts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.prompts-label {
  font-size: 0.875rem;
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
