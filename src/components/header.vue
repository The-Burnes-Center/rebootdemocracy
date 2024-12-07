<!-- src/components/header.vue -->
<script lang="ts" setup>
import MenuComponent from "../components/menu.vue";

function navigateHome() {
  window.location.href = "https://rebootdemocracy.ai";
}
</script>

<template>
  <div class="header-section">
    <div class="logo-section">
      <div class="logo">
        <a href="http://thegovlab.org" target="_blank">
          <img src="../assets/the-govlab-logo-white.svg" />
        </a>
        <a href="http://burnes.northeastern.edu" target="_blank">
          <img src="../assets/burnes-center-logo.png" />
        </a>
      </div>
      <div @click="navigateHome" class="wordmark">
        Reboot<br />Democracy<br />.AI
      </div>
    </div>
    <MenuComponent></MenuComponent>
  </div>
</template>

<style scoped>
/* Your styles here */
</style>