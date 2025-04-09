<template>
  <section class="innovateus__container">
    <div class="innovateus__content">
      <div class="innovateus__logo">
        <img 
          src="/images/innovate-us-logo.svg" 
          alt="InnovateUS Logo" 
          class="innovateus__logo-image"
        />
      </div>
      
      <Text 
        as="p" 
        size="base" 
        weight="normal" 
        align="center" 
        class="innovateus__description"
      >
        {{ description }}
      </Text>
      
      <Button
        variant="primary"
        width="123px"
        height="36px"
        :onClick="handleLearnMoreClick"
      >{{ buttonLabel }}</Button>
    </div>
  </section>
</template>

<script setup lang="ts">
interface InnovateUsCardProps {
  description?: string;
  buttonLabel?: string;
  learnMoreUrl?: string;
}

const props = withDefaults(defineProps<InnovateUsCardProps>(), {
  description: "InnovateUS provides no-cost, at-your-own pace, and live learning. on data, digital, innovation, and AI skills for public service professionals like you.",
  buttonLabel: "Learn more",
  learnMoreUrl: "#"
});

const handleLearnMoreClick = () => {
  if (props.learnMoreUrl) {
    window.open(props.learnMoreUrl, "_blank");
  }
};
</script>