<template>
  <div class="submenu">
    <h3>Deferred Submenu</h3>
    <p>Enter a number to compute prime numbers up to that value:</p>
    <input
      type="number"
      v-model.number="limit"
      min="2"
      placeholder="Enter a number"
    />
    <button @click="computePrimes" :disabled="loading">
      {{ loading ? 'Computing...' : 'Compute Primes' }}
    </button>
    <div v-if="computationResult.length">
      <h4>Primes up to {{ limit }}:</h4>
      <div class="results">
        <span v-for="(num, i) in computationResult" :key="i">{{ num }}<span v-if="i < computationResult.length - 1">, </span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const limit = ref<number>(10000)
const computationResult = ref<number[]>([])
const loading = ref(false)

// A simple (inefficient) prime checker for demonstration purposes.
function isPrime(n: number): boolean {
  if (n < 2) return false
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false
  }
  return true
}

async function computePrimes() {
  loading.value = true
  computationResult.value = []
  const result: number[] = []

  // Simulate heavy computation by checking every number up to limit.
  for (let i = 2; i <= limit.value; i++) {
    if (isPrime(i)) {
      result.push(i)
    }
  }

  // Optional: simulate additional delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  computationResult.value = result
  loading.value = false
}
</script>

<style scoped>
.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #f7f7f7;
  border: 1px solid #ccc;
  padding: 1rem;
  width: 300px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.submenu input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.submenu button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.submenu button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
.results {
  margin-top: 1rem;
  max-height: 150px;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.3;
}
</style>
