<template>
  <footer class="footer">
    <div class="footer__container">
      <!-- Left side - Navigation links -->
      <div class="footer__nav">
        <NuxtLink to="/" class="footer__link">About</NuxtLink>
        <NuxtLink to="/blog" class="footer__link">Blog</NuxtLink>
        <NuxtLink to="/events" class="footer__link">Events</NuxtLink>
        <NuxtLink to="/our-work" class="footer__link">Our Work</NuxtLink>
        <NuxtLink to="/signup" class="footer__link">Sign up</NuxtLink>
      </div>

      <!-- Middle - Text content -->
      <div class="footer__content">
        <div class="footer__text-block">
          <p>
            A new paper by Joshua Levine and Tim Hwang explores how different nations approach AI policy and copyright regulation, and also what's at stake in the battle for technological dominance.
          </p>
        </div>
        <div class="footer__text-block">
          <p>
            A new paper by Joshua Levine and Tim Hwang explores how different nations approach AI policy and copyright regulation, and also what's at stake in the battle for technological dominance.
          </p>
        </div>
      </div>

      <!-- Right side - Logos -->
      <div class="footer__logos">
        <div class="footer__logo">
          <img src="/images/burnes-logo-blues-1.png" alt="Burnes Center for Social Change" />
        </div>
        <div class="footer__logo">
          <img src="/images/the-govlab-logo-white.png" alt="The GovLab" />
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No additional script needed for this component
</script>