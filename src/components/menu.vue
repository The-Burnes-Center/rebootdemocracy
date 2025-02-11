<template>
  <div id="menuIsland" class="menu-component">

    <!--
      MOBILE MENU
      Displayed ONLY at screens <= 786px (handled via media query)
    -->
    <div class="mobile-menu">
      <i class="fa-solid fa-bars bars" @click="toggleMenu"></i>
      <!--
        The ".menu" and ".menu-shadow" CSS classes are your existing classes.
        We keep them. You can style them (or rename) as desired.
      -->
      <div :class="['menu-shadow', 'menu', { open: menuOpen }]" v-show="menuOpen">
        <a href="/about">About Us</a>
        <a href="/">Blog</a>
        <a href="/events">Events</a>
        <div class="dropdown">
          <button class="dropbtn" @click.prevent="toggleDropdown">
            Our Work
            <i :class="['fa-regular', dropdownOpen ? 'fa-angle-up' : 'fa-angle-down']"></i>
          </button>
          <div class="dropdown-content" v-show="dropdownOpen">
            <a href="/our-engagements">Engagements</a>
            <a href="/our-research">Research</a>
            <a href="/our-writing">Writing</a>
            <a href="/our-teaching">Teaching</a>
            <a href="/more-resources">More Resources</a>
          </div>
        </div>
        <a href="/signup" class="btn btn-small btn-primary">Sign up</a>
      </div>
    </div>

    <!--
      DESKTOP MENU
      Displayed ONLY at screens > 786px (handled via media query)
    -->
    <div class="desktop-menu">
      <div class="menu">
        <a href="/about">About Us</a>
        <a href="/">Blog</a>
        <a href="/events">Events</a>
        <div class="dropdown">
          <button class="dropbtn">
            Our Work
            <i class="fa-regular fa-angle-down"></i>
          </button>
          <div class="dropdown-content">
            <a href="/our-engagements">Engagements</a>
            <a href="/our-research">Research</a>
            <a href="/our-writing">Writing</a>
            <a href="/our-teaching">Teaching</a>
            <a href="/more-resources">More Resources</a>
          </div>
        </div>
        <a href="/signup" class="btn btn-small btn-primary">Sign up</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      menuOpen: false,
      dropdownOpen: false
    };
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
      // Close the dropdown automatically when user closes the main menu
      if (!this.menuOpen) {
        this.dropdownOpen = false;
      }
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    }
  }
};
</script>

<style scoped>
/* 
  By default, we hide the mobile menu for large screens...
  and show the desktop menu. 
*/
.mobile-menu {
  display: none;
}
.desktop-menu {
  display: block;
}

/* 
  For screens up to 786px wide, show the mobile menu and 
  hide the desktop menu. Adjust 786px to whatever breakpoint you prefer.
*/
@media (max-width: 786px) {
  .mobile-menu {
    display: block;
  }
  .desktop-menu {
    display: none;
  }
}

/* Example styles for your “menu-shadow” or “menu open” states:

   This is up to you to style. The main point is the pure-CSS 
   approach for switching mobile/desktop via media queries.
*/

.menu-component {
  /* your container styling... */
}
.menu {
  /* shared menu styling... */
}
.menu.open {
  /* open state styling for the mobile menu, if you want transitions, etc. */
}
.menu-shadow {
  /* maybe a dark background overlay or something similar for mobile? */
}

/* .dropdown, .dropbtn, .dropdown-content, etc... */
.dropdown {
  position: relative;
  display: inline-block;
}
.dropbtn {
  /* your styling for the button */
}
.dropdown-content {
  /* typically position: absolute; etc. */
}
</style>