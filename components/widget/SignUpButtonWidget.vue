<template>
  <section
    class="signup__container"
    :style="{
      '--bg-color': backgroundColor
    }"
  >
    <div class="signup__content">
      <h3 class="signup__title">{{ title }}</h3>
      
      <div class="signup__form">
        <input 
          type="email" 
          class="signup__input" 
          :placeholder="placeholder"
          v-model="email"
        />
        
        <Button
          variant="primary"
          width="100%"
          height="36px"
          :onClick="handleSignUp"
        >{{ buttonLabel }}</Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface SignUpProps {
  title?: string;
  placeholder?: string;
  buttonLabel?: string;
  backgroundColor?: string;
}

const props = withDefaults(defineProps<SignUpProps>(), {
  title: "Sign up for updates",
  placeholder: "Your email address",
  buttonLabel: "Sign up",
  backgroundColor: "#FFFFFF"
});

const email = ref('');

const handleSignUp = () => {
  if (email.value) {
    console.log('Signing up with email:', email.value);
    // Here you would typically call an API to handle the subscription
    email.value = ''; // Reset the input field
  }
};
</script>