<script>
export default {
  props: {
    modalData: {
      type: Object,
      required: true
    }
  },
  methods: {
    closeFunc() {
      this.$emit('close');
    },
    btnFunct(button_url) {
      localStorage.setItem("Reboot Democracy", "off");
      window.open(button_url, '_self');
    }
  }
}
</script>

<template>
  <div class="modal-bg">
    <div class="modal-section">
      <i @click="closeFunc" class="fa-regular fa-circle-xmark modal-close"></i>
      <div class="row">
        <h3>{{ modalData.title }}</h3>
        <div class="modal-content" v-html="modalData.content"></div>
        <a @click="btnFunct(modalData.button_url)" :href="modalData.button_url" class="btn btn-primary btn-medium">{{ modalData.button_text }}</a>
      </div>
    </div>
  </div>
</template>