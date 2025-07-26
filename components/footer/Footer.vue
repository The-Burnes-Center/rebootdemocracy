<template>
  <footer class="footer" role="contentinfo">
    <div class="footer__container">
      <nav class="footer__nav" role="navigation" aria-label="Footer navigation">
        <NuxtLink
          to="/about"
          class="footer__link"
          aria-label="Learn more about our organization"
        >
          About
        </NuxtLink>
        <NuxtLink
          to="/blog"
          class="footer__link"
          aria-label="Read our blog posts"
        >
          Blog
        </NuxtLink>
        <NuxtLink
          to="/events"
          class="footer__link"
          aria-label="View upcoming events"
        >
          Events
        </NuxtLink>
        <NuxtLink
          to="/signup"
          class="footer__link"
          aria-label="Sign up for updates"
        >
          Sign up
        </NuxtLink>
      </nav>

      <!-- Middle - Text content -->
      <div class="footer__content">
        <div class="footer__text-block">
          <p>
            We use artificial intelligence to help institutions and communities
            solve problems together. We believe that artificial intelligence can
            and should be harnessed to strengthen participatory democracy. Done
            well, participation and engagement lead to Better governance, Better
            outcomes, Increased trust in institutions and in one another.
          </p>
        </div>
        <div class="footer__text-block">
          <p>
            As researchers we want to understand how best to "do democracy" in
            practice. Emboldened by the advent of generative AI, we are excited
            about the future possibilities for reimagining democracy in practice
            and at scale.
          </p>
        </div>
      </div>

      <!-- Right side - Logos -->
      <div class="footer__logos">
        <div class="footer__logo">
          <!-- Enhanced logo links with focus support -->
          <a
            href="https://burnes.northeastern.edu/"
            class="footer__logo-link"
            aria-label="Visit Burnes Center for Social Change website"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/images/burnes-branding-v4-bunes-center-logo-blue.svg"
              alt="Burnes Center for Social Change logo"
              tabindex="-1"
              role="presentation"
            />
          </a>
        </div>
        <div class="footer__logo">
          <a
            href="https://thegovlab.org/"
            class="footer__logo-link"
            aria-label="Visit The GovLab website"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/images/the-govlab-logo.svg"
              alt="The GovLab logo"
              tabindex="-1"
              role="presentation"
            />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer__link:focus {
  outline: none;
  box-shadow: 0 0 0 1px #4a6b8a;
}

.footer__logo-link:focus {
  outline: none;
  box-shadow: 0 0 0 2px #4a6b8a; 
  border-radius: 4px;
}

.footer__logo-link:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.footer__logo-link {
  display: inline-block;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
}

.footer__logo-link img {
  display: block;
  pointer-events: none;
  max-width: 100%;
  height: auto;
}

.footer__logo-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (prefers-contrast: high) {
  .footer__link:focus,
  .footer__logo-link:focus {
    box-shadow: 0 0 0 1px #000000;
  }
}

.footer__logo-link:focus-visible {
  box-shadow: 0 0 0 1px #4a6b8a;
}

.footer__logo-link:focus:not(:focus-visible) {
  box-shadow: none;
}
</style>