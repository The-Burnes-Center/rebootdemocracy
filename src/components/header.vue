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
        <div @click="navigateHome" class="wordmark">RebootDemocracy.AI</div>
      </div>
    </div>
      <menu-comp></menu-comp>
  </div>
</template>