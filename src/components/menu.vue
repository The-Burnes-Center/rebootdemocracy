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
        <a href="../">About Us</a>
        <div class="dropdown">
          <button class="dropbtn">Our Work 
           <i class="fa-regular fa-angle-down"></i>
          </button>
            <div class="dropdown-content">
              <a href="">Engagements</a>
              <a href="">Case Studies</a>
               <a href="">Teaching</a>
            </div>
        </div>
        <a href="" class="btn btn-small btn-primary">Join Us</a>
      </div>
</template>