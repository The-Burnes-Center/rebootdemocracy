
<script>
import MenuComponent from "../components/menu.vue";
export default {
  components: {
    "menu-comp": MenuComponent
  }
}
</script>

<template>
<div class="footer-section">
  <div class="footer-contents">
    <div class="footer-icons">
      <div class="footer-iconset-1">
        <div class="icon"><i class="fa-sharp fa-solid fa-bullseye-pointer"></i></div>
        <div class="icon"><i class="fa-solid fa-lightbulb-exclamation-on"></i></div>
      </div>
      <div class="wordmark"><img src="../assets/wordmark_dark.svg"></div>
       <div class="footer-iconset-1">
        <div class="icon"><i class="fa-sharp fa-solid fa-cubes"></i></div>
        <div class="icon"><i class="fa-sharp fa-solid fa-clipboard-list-check"></i></div>
      </div>
    </div>
    <div class="separator-line">
      
    </div>
    <div class="footer-menu">
      <menu-comp :menutype="'footermenu'"></menu-comp>
    </div>
  </div>
</div>
<div class="cc-license">
  <img src="../assets/cc.png">
  <p>This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.</p>
</div>
</template>