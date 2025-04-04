<template>
  <div class="hero__container">
    <div class="hero__content">
      <Text 
        as="h1" 
        :size="'2xl'" 
        :weight="'light'" 
        :fontFamily="'inria'" 
        class="hero__title"
      >
        {{ title }}
      </Text>
      <Text 
        as="p" 
        :size="'xs'" 
        :weight="'bold'" 
        :fontFamily="'inria'" 
        class="hero__subtitle"
      >
        {{ subtitle }}
      </Text>
    </div>
    
    <div class="hero__partners">
      <div class="hero__partner hero__first-partner">
        <img :src="firstPartnerLogo" :alt="firstPartnerAlt" />
      </div>
      <div class="hero__partner hero__second-partner">
        <img :src="secondPartnerLogo" :alt="secondPartnerAlt" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface HeroProps {
  title: string;
  subtitle: string;
  firstPartnerLogo: string;
  firstPartnerAlt: string;
  secondPartnerLogo: string;
  secondPartnerAlt: string;
}

const props = withDefaults(defineProps<HeroProps>(), {
  title: "Rebooting Democracy in the Age of AI",
  subtitle: "Insights on AI, Governance and Democracy",
  firstPartnerLogo: "",
  firstPartnerAlt: "First Partner Logo",
  secondPartnerLogo: "",
  secondPartnerAlt: "Second Partner Logo"
});
</script>