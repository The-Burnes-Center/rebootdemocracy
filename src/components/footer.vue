<!-- src/components/footer.vue -->
<script lang="ts" setup>
function navigateHome() {
  window.location.href = "https://rebootdemocracy.ai";
}
</script>

<template>
  <div class="footer-section">
    <div class="footer-contents">
      <div class="logo-section footer-col">
        <div @click="navigateHome" class="wordmark">
          Reboot Democracy
        </div>
        <p>A Project Of</p>
        <a href="http://thegovlab.org" target="_blank">
          <img src="../assets/the-govlab-logo-white.svg" />
        </a>
        <a href="http://burnes.northeastern.edu" target="_blank">
          <img src="../assets/burnes-center-logo.png" />
        </a>
      </div>
      <!-- Rest of the footer content -->
    </div>
    <div class="cc-license">
      <img src="../assets/cc.png" />
      <p>
        This work is licensed under a Creative Commons Attribution-ShareAlike
        4.0 International License.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Your styles here */
</style>