<template>
  <div class="api-demo">
    <div class="hero">
      <h1>OpenAI Realtime API + MCP Demo</h1>
      <p>Search through Reboot Democracy content using OpenAI with MCP integration</p>
    </div>

    <div class="demo-container">
      <div class="prompt-section">
        <h2>Enter your search prompt:</h2>
        <textarea
          v-model="prompt"
          placeholder="Search for all articles about: Democracy - in the reboot democracy and news that caught our eye collection, return links and title and content fields and the Full URL in JSON format"
          class="prompt-input"
          rows="4"
        ></textarea>
        <button 
          @click="sendPrompt" 
          :disabled="!prompt.trim() || isLoading"
          class="send-button"
        >
          {{ isLoading ? 'Searching...' : 'Search Content' }}
        </button>
      </div>

      <div class="response-section" v-if="response">
        <h3>Response:</h3>
        <div class="response-content">
          <pre>{{ JSON.stringify(response, null, 2) }}</pre>
        </div>
      </div>

      <div class="error-section" v-if="error">
        <h3>Error:</h3>
        <div class="error-content">
          <pre>{{ error }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ApiDemo',
  data() {
    return {
      prompt: 'Search for all articles about: Democracy - in the reboot democracy and news that caught our eye collection, return links and title and content fields and the Full URL in JSON format',
      isLoading: false,
      response: null,
      error: null
    }
  },
  methods: {
    async sendPrompt() {
      if (!this.prompt.trim()) return;
      
      this.isLoading = true;
      this.error = null;
      this.response = null;

      try {
        console.log('Sending prompt:', this.prompt);
        
        const response = await fetch('/.netlify/functions/openai-realtime-mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: this.prompt
          })
        });

        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.error || data.message || `HTTP ${response.status}`);
        }

        this.response = data;
      } catch (err) {
        this.error = err.message;
        console.error('Error:', err);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.api-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  color: #666;
}

.demo-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
}

.prompt-section {
  margin-bottom: 2rem;
}

.prompt-section h2 {
  margin-bottom: 1rem;
  color: #333;
}

.prompt-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 1rem;
}

.prompt-input:focus {
  outline: none;
  border-color: #007bff;
}

.send-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #0056b3;
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.response-section, .error-section {
  margin-top: 2rem;
}

.response-section h3, .error-section h3 {
  margin-bottom: 1rem;
  color: #333;
}

.response-content, .error-content {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
}

.response-content pre, .error-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-content {
  background: #f8d7da;
  border-color: #f5c6cb;
}

.error-content pre {
  color: #721c24;
}
</style>