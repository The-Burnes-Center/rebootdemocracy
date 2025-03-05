<script>
import MenuComponent from "../components/menu.vue";
export default {
  components: {
    "menu-comp": MenuComponent
  },
  methods: {
    navigateHome() {

    window.location.href = "https://rebootdemocracy.ai";
    }
  }
}
</script>
<template>
  <div class="header-section">
    <div class="logo-section">
      <div class="logo">
      <a href="http://thegovlab.org" target="_blank"><img src="../assets/the-govlab-logo-white.svg"></a>
      <a href="http://burnes.northeastern.edu" target="_blank"><img src="../assets/burnes-logo.png"></a>      
      </div>
    </div>
      <menu-comp></menu-comp>
  </div>
</template>