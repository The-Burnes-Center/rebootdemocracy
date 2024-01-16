<script>
import MenuComponent from "../components/menu.vue";
export default {
  components: {
    "menu-comp": MenuComponent
  },
}
</script>
<template>
  <div class="header-section">
    <div class="logo-section">
      <div class="logo">
      <a href="http://thegovlab.org" target="_blank"><img src="../assets/the-govlab-logo-white.svg"></a>
      <a href="http://burnes.northeastern.edu" target="_blank"><img src="../assets/burnes-center-logo.png"></a>
        
      </div>
      <div @click="$router.push('../')"  class="wordmark">
        Reboot<br>Democracy<br>.AI
      </div>
    </div>
      <menu-comp></menu-comp>
  </div>
</template>