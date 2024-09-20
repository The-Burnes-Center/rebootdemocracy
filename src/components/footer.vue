
<script>
export default {
  methods: {
    navigateHome() {

    window.location.href = "https://rebootdemocracy.ai";
    }
  }
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
      <a href="http://thegovlab.org" target="_blank"><img src="../assets/the-govlab-logo-white.svg"></a>
      <a href="http://burnes.northeastern.edu" target="_blank"><img src="../assets/burnes-center-logo.png"></a>
    </div>
    <div class="footer-col">
      <h4>Our Work</h4>
       <a href="/our-engagements">Equitable Engagement Lab</a>
       <a href="https://poweratwork.us/" target="_blank">Workplace and Democracy</a>
       <a href="../">Media and Democracy</a>
    </div>
    <div class="footer-col">
      <h4>Resources</h4>
       <a href="/events">Reboot Democracy Lecture Series</a>
       <a href="/our-research">Case Studies</a>
       <a href="/our-research">Research Questions</a>
       <a href="/our-writing">Writing</a>
       <a href="/our-teaching">Teaching</a>
    </div>
    <div class="footer-col">
      <h4>About Reboot Democracy</h4>
       <a href="../">Our Work</a>
       <a href="/team">Our People</a>
       <!-- <a href="../">Careers</a> -->
       <!-- <a href="../">Join the Lab</a> -->
    </div>
  </div>
</div>
<div class="cc-license">
  <img src="../assets/cc.png">
  <p>This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.</p>
</div>
</template>