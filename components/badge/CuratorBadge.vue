<template>
  <div class="curator-badge" role="region" aria-label="Featured curator">
    <div class="curator-badge__left">
      <div class="curator-badge__image-container">
        <img 
          :src="imageUrl"
          :alt="`Photo of ${name}, ${title}`"
          class="curator-badge__image"
          loading="lazy"
        />
      </div>
    </div>
    <div class="curator-badge__content">
      <Text 
        as="span"
        size="xs"
        weight="bold"
        fontStyle="italic"
        class="curator-badge__label"
        fontFamily="merriweather"
        role="text"
      >
        Curated by
      </Text>
      
      <Text 
        as="h3"
        size="base"
        weight="bold"
        class="curator-badge__name"
        fontFamily="sora"
      >
        {{ name }}
      </Text>
      
      <Text 
        as="p"
        size="xs"
        weight="normal"
        class="curator-badge__title"
        fontFamily="merriweather"
        role="text"
        :aria-label="`Position: ${title}`"
      >
        {{ title }}
      </Text>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CuratorBadgeProps {
  name: string;
  title: string;
  imageUrl: string;
}

const props = defineProps<CuratorBadgeProps>();
</script>
