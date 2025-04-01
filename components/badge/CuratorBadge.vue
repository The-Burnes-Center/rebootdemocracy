<template>
  <div class="curator-badge">
    <div class="curator-badge__left">
      <div class="curator-badge__image-container">
        <img 
          :src="imageUrl" 
          :alt="name" 
          class="curator-badge__image" 
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
      >
        Curated by
      </Text>
      
      <Text 
        as="h3" 
        size="base" 
        weight="bold" 
        class="curator-badge__name"
      >
        {{ name }}
      </Text>
      
      <Text 
        as="p" 
        size="xs" 
        weight="normal" 
        class="curator-badge__title"
      >
        {{ title }}
      </Text>
      
      <Text 
        as="p" 
        size="xs" 
        weight="normal"
        fontStyle="italic"
        class="curator-badge__more"
      >
        {{ moreInfo }}
      </Text>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CuratorBadgeProps {
  name: string;
  title: string;
  imageUrl: string;
  moreInfo?: string;
}

const props = withDefaults(defineProps<CuratorBadgeProps>(), {
  moreInfo: "More incredible things done in their career"
});
</script>