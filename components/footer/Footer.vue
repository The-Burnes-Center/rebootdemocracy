<template>
  <footer class="footer">
    <div class="footer__container">
      <!-- Left side - Navigation links -->
      <div class="footer__nav">
        <NuxtLink to="/about" class="footer__link">About</NuxtLink>
        <NuxtLink to="/blog" class="footer__link">Blog</NuxtLink>
        <NuxtLink to="/events" class="footer__link">Events</NuxtLink>
        <NuxtLink to="/signup" class="footer__link">Sign up</NuxtLink>
      </div>

      <!-- Middle - Text content -->
      <div class="footer__content">
        <div class="footer__text-block">
          <p>
          We use artificial intelligence to help institutions and communities solve problems together. We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to Better governance, Better outcomes, Increased trust in institutions and in one another. 
          </p>
        </div>
        <div class="footer__text-block">
          <p>
            As researchers we want to understand how best to “do democracy” in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.
          </p>
        </div>
      </div>

      <!-- Right side - Logos -->
      <div class="footer__logos">
        <div class="footer__logo">
          <img src="/images/burnes-branding-v4-bunes-center-logo-blue.svg" alt="Burnes Center for Social Change" />
        </div>
        <div class="footer__logo">
          <img src="/images/the-govlab-logo.svg" alt="The GovLab" />
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No additional script needed for this component
</script>