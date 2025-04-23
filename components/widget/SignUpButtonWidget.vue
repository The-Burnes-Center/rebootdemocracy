<template>
  <section
    class="signup__container"
    :style="{
      '--bg-color': backgroundColor
    }"
  >
    <div class="signup__content">
      <h3 class="signup__title">{{ title }}</h3>
      
      <form 
        class="signup__form"
        action="https://innovate-us.us14.list-manage.com/subscribe/post?u=36f840aa1f979805ce7b81fa7&amp;id=cb864aff13&amp;f_id=003bf8e0f0"
        method="post"
        id="mc-embedded-subscribe-form"
        name="mc-embedded-subscribe-form"
        target="_self"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <input 
          type="email" 
          name="EMAIL"
          class="signup__input required" 
          id="mce-EMAIL"
          :placeholder="placeholder"
          v-model="email"
          required
        />
        
        <!-- Honeypot field to prevent spam -->
        <div aria-hidden="true" style="position: absolute; left: -5000px;">
          <input type="text" name="b_36f840aa1f979805ce7b81fa7_cb864aff13" tabindex="-1" v-model="honeypot">
        </div>
        
        <div v-if="emailError" class="error-message">{{ emailError }}</div>
        
        <Button
          variant="primary"
          width="100%"
          height="36px"
          type="submit"
        >{{ buttonLabel }}</Button>
      </form>
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
const honeypot = ref('');
const emailError = ref('');

const validateEmail = () => {
  // Reset error first
  emailError.value = '';
  
  // Get the email value
  const emailValue = email.value.trim();
  
  // Check if email is empty
  if (emailValue === '') {
    emailError.value = 'Email address is required';
    return false;
  }
  
  // Check if email is valid using a basic pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(emailValue)) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }
  
  return true;
};

const handleSubmit = (event: Event) => {
  // Validate before submission
  if (!validateEmail()) {
    return;
  }
  
  // If validation passes, submit the form
  const form = event.target as HTMLFormElement;
  form.submit();
  
  // Reset form after submission
  email.value = '';
};
</script>