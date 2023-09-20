

<template>
<div class="footer-section">
  <div class="footer-contents">
    <div class="logo-section footer-col">
      <div class="wordmark">
        Reboot Democracy
      </div>
      <p>A Project By</p>
      <img @click="$router.push('/')" src="../assets/the-govlab-logo-white.svg">
      <img @click="$router.push('/')" src="../assets/burnes-center-logo.png">
    </div>
    <div class="footer-col">
      <h4>Our Work</h4>
       <a href="/our-engagements">Equitable Engagement Lab</a>
       <a href="../">Workplace and Democracy</a>
       <a href="../">Media and Democracy</a>
    </div>
    <div class="footer-col">
      <h4>Resources</h4>
       <a href="/event">Reboot Democracy Lecture Series</a>
       <a href="../">Case Studies</a>
       <a href="../">Research Questions</a>
       <a href="../">Writing</a>
       <a href="../">Teaching</a>
    </div>
    <div class="footer-col">
      <h4>About the GovLab</h4>
       <a href="../">Our Work</a>
       <a href="../">Our People</a>
       <a href="../">Careers</a>
       <a href="../">Join the Lab</a>
    </div>
  </div>
</div>
<div class="cc-license">
  <img src="../assets/cc.png">
  <p>This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.</p>
</div>
</template>