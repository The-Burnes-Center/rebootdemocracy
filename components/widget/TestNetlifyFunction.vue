<script setup>
import { ref } from 'vue';

const message = ref('Hello from the test component!');
const response = ref('');
const isLoading = ref(false);
const error = ref('');

async function testNetlifyFunction() {
  isLoading.value = true;
  error.value = '';
  response.value = 'Sending request...';
  
  try {
    console.log('Testing connection to /.netlify/functions/pschat');
    
    const result = await fetch('/.netlify/functions/pschat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: message.value,
        conversation: []
      })
    });
    
    console.log('Response status:', result.status);
    console.log('Response headers:', Object.fromEntries([...result.headers.entries()]));
    
    if (!result.ok) {
      const errorText = await result.text();
      console.error('Error response:', errorText);
      throw new Error(`Server returned ${result.status}: ${result.statusText}`);
    }
    
    // Try to parse as JSON first
    try {
      const jsonData = await result.json();
      response.value = 'Success! Received JSON response:\n' + JSON.stringify(jsonData, null, 2);
    } catch (jsonError) {
      // If not JSON, get as text
      const textData = await result.text();
      response.value = 'Success! Received text response:\n' + textData;
    }
  } catch (e) {
    console.error('Error:', e);
    error.value = e.message;
    response.value = '';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="test-container">
    <h2>Netlify Function Test (.netlify/functions)</h2>
    
    <div class="input-section">
      <input v-model="message" placeholder="Test message" />
      <button @click="testNetlifyFunction" :disabled="isLoading">
        {{ isLoading ? 'Testing...' : 'Test Connection' }}
      </button>
    </div>
    
    <div v-if="error" class="error-box">
      <strong>Error:</strong> {{ error }}
    </div>
    
    <div v-if="response" class="response-box">
      <pre>{{ response }}</pre>
    </div>
  </div>
</template>

<style scoped>
.test-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.input-section {
  display: flex;
  margin-bottom: 15px;
}

input {
  flex: 1;
  padding: 8px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 8px 15px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
}

.error-box {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.response-box {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>