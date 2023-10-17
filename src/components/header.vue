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
        <img @click="$router.push('../')" src="../assets/the-govlab-logo-white.svg">
        <img @click="$router.push('../')" src="../assets/burnes-center-logo.png">
        
      </div>
      <div class="wordmark">
        Reboot<br>Democracy<br>.AI
      </div>
    </div>
      <menu-comp></menu-comp>
  </div>
</template>