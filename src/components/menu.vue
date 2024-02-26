<script>
export default {
  props: [
    'menutype'
  ],
  data() {
    return {
      menutoggle: true,
      screenWidth: window.innerWidth <786 ? 'mobile' : 'desktop'
    }
  },
    methods: {
    getDimensions() {
      this.screenWidth = document.documentElement.clientWidth<786 ? 'mobile' : 'desktop';
    }
  },
  mounted() {
    window.addEventListener('resize', this.getDimensions);
  },
  unmounted() {
    window.removeEventListener('resize', this.getDimensions);
  },
}
</script>

<template>
       <i class="fa-solid fa-bars bars" @click="menutoggle =!menutoggle"></i>
      <div :class="[screenWidth=='mobile' ? 'menu-shadow' : '', 'menu']" v-show="screenWidth=='mobile' && !menutoggle ? true : screenWidth=='desktop' || menutype == 'footermenu'? true : false ">
        <a href="http://thegovlab.org/beth-simone-noveck.html" target="_blank">About Us</a>
        <a href="/blog">Blog</a>
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
        <!-- <a href="/team">Our Team</a> -->
        <a href="/signup" class="btn btn-small btn-primary">Sign up</a>
      </div>
</template>