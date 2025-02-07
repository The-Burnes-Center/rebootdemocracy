<template>
  <div class="menu-component">
    <!-- Mobile Menu -->
    <div v-if="screenWidth === 'mobile'">
      <i class="fa-solid fa-bars bars" @click="toggleMenu"></i>
      <div :class="['menu-shadow', 'menu', { 'open': menuOpen }]" v-show="menuOpen">
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

    <!-- Desktop Menu (Unchanged) -->
    <div v-else>
      <div class="menu">
        <a href="/about">About Us</a>
        <a href="/">Blog</a>
        <a href="/events">Events</a>
        <div class="dropdown">
          <button class="dropbtn">Our Work 
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
  props: ['menutype'],
  data() {
    return {
      menuOpen: false,
      dropdownOpen: false,
      screenWidth: 'desktop'
    }
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
      if (!this.menuOpen) {
        this.dropdownOpen = false; // Close dropdown when closing menu
      }
    },
    toggleDropdown() {
      if (this.screenWidth === 'mobile') {
        this.dropdownOpen = !this.dropdownOpen;
      }
    },
    updateScreenWidth() {
      this.screenWidth = window.innerWidth < 786 ? 'mobile' : 'desktop';
      if (this.screenWidth === 'desktop') {
        this.dropdownOpen = false; // Reset dropdown state when switching to desktop
      }
    }
  },
  mounted() {
    this.updateScreenWidth();
    window.addEventListener('resize', this.updateScreenWidth);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateScreenWidth);
  }
}
</script>