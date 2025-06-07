<!-- Vue Component -->
<template>
  <Card
    class="featured-card"
    variant="featured"
    size="semimedium"
    :hoverable="true"
    role="article"
  >
    <div class="featured-card__image-wrapper">
      <img :src="imageUrl" :alt="title" class="featured-card__image" />
    </div>

    <div class="featured-card__body">
      <div class="featured-card__content">
          <Text
            size="xs"
            weight="extrabold"
            class="featured-card__tag"
            transform="uppercase"
            fontFamily="inter"
            color="tag-primary"
          >
            {{ tag }}
          </Text>
        <Text
          as="h3"
          size="3xl"
          weight="bold"
          fontFamily="inria"
          class="featured-card__title clamp-3"
        >
          {{ title }}
        </Text>

        <Text
          as="p"
          size="base"
          weight="medium"
          fontFamily="inter"
          color="text-primary-light"
          class="featured-card__description clamp-5"
        >
          {{ description }}
        </Text>
      </div>

      <div class="featured-card__footer">
        <div class="featured-card__author-info">
          <div class="featured-card__meta-text">
            <Text as="p" size="sm" class="featured-card__author-name">
              {{ author }}
            </Text>
            <Text as="p" size="xs" class="featured-card__date">
              {{ formattedDate }}
            </Text>
          </div>
        </div>
        <div class="featured-card__read-more">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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

const formattedDate = computed(() =>
  props.date ? format(parseISO(props.date), "MMM d, yyyy") : "Unknown Date"
);
</script>
