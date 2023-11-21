<script>

import { Directus } from '@directus/sdk';

export default {
  data() {
    return {
      modalData: [],
      directus: new Directus('https://content.thegovlab.com/'),
    }
  },
  created() {
    this.fetchModal();
  },
  methods: {
    closeFunc() {
      this.$emit('close');
    },
    btnFunct(button_url)
    {

      localStorage.setItem("Reboot Democracy","off");
      window.open(button_url,'_self')
    },
    fetchModal: function fetchModal() {
    
      this.directus
      .items('reboot_democracy_modal')
      .readByQuery({
         meta: 'total_count',
         limit: -1,
         fields: [
          '*.*'
       ]
      })
      .then((item) => {
      this.modalData =  item.data;
      });
    }

  }
}
</script>
<template>
<div class="modal-bg">
  <div class="modal-section">
    <!-- <span @click="closeFunc" class="modal-close">close</span> -->
    <i @click="closeFunc" class="fa-regular fa-circle-xmark modal-close"></i>
    <div class="row">
      
        <h3>{{modalData.title}}</h3>
        <p>{{modalData.content}}</p>
         <a @click="btnFunct(modalData.button_url)" :href="modalData.button_url" class="btn btn-primary btn-medium">{{modalData.button_text}}</a>


    </div>
  </div>
  </div>
</template>
