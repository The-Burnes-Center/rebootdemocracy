<template>
  <Card
    class="featured-card"
    variant="featured"
    size="semimedium"
    :hoverable="true"
    role="article"
    :aria-label="`Featured article: ${title} by ${author}`"
    tabindex="0"
    @click="$emit('click')"
    @keydown="handleKeydown"
  >
    <div class="featured-card__image-wrapper">
      <img 
        :src="imageUrl" 
        :alt="`Featured image for article: ${title}`" 
        class="featured-card__image"
        loading="lazy"
      />
    </div>
    
    <div class="featured-card__body">
      <div class="featured-card__content">
        <Text
          size="xs"
          weight="extrabold"
          class="featured-card__tag"
          transform="uppercase"
          fontFamily="sora"
          color="tag-primary"
          role="text"
          :aria-label="`Category: ${tag}`"
        >
          {{ tag }}
        </Text>
        <Text
          as="h3"
          size="3xl"
          weight="bold"
          fontFamily="sora"
          class="featured-card__title clamp-3"
          lineHeight="more-loose"
          id="featured-title"
        >
          {{ title }}
        </Text>
        
        <Text
          as="p"
          size="1.5xl"
          weight="medium"
          fontFamily="habibi"
          color="text-primary-light"
          class="featured-card__description clamp-4"
          lineHeight="loose"
          aria-describedby="featured-title"
        >
          {{ description }}
        </Text>
      </div>
      
      <div class="featured-card__footer">
        <div class="featured-card__author-info">
          <div class="featured-card__meta-text">
            <Text 
              as="p" 
              size="sm" 
              class="featured-card__author-name"
              role="text"
              :aria-label="`Author: ${author}`"
            >
              {{ author }}
            </Text>
            <Text 
              as="p" 
              size="xs" 
              class="featured-card__date" 
              fontFamily="sora"
              :aria-label="`Published on ${formattedDate}`"
            >
              {{ formattedDate }}
            </Text>
          </div>
        </div>
        <div class="featured-card__read-more" aria-label="Read more">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { format, parseISO } from "date-fns";
import { computed } from "vue";

interface Props {
  imageUrl: string;
  tag: string;
  title: string;
  description: string;
  date: string;
  author: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['click', 'keydown']);

const formattedDate = computed(() =>
  props.date ? format(parseISO(props.date), "MMM d, yyyy") : "Unknown Date"
);

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emit('click', event);
  }
  emit('keydown', event);
};
</script>