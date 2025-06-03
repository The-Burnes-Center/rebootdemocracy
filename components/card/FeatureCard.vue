<template>
  <Card
    class="featured-card"
    variant="featured"
    size="semimedium"
    :hoverable="true"
    role="article"
  >
    <img :src="imageUrl" :alt="title" class="featured-card__image" />

    <div class="featured-card__body">
      <Text
        as="p"
        size="base"
        weight="extrabold"
        color="tag-primary"
        marginBottom="xs"
        class="clamp-1"
      >
        {{ tag }}
      </Text>

      <Text
        as="h3"
        size="3xl"
        weight="bold"
        fontFamily="inria"
        lineHeight="extra-loose"
        marginBottom="sm"
        class="clamp-3 textclass"
        
      >
        {{ title }}
      </Text>

      <Text
        as="p"
        size="lg"
        weight="semibold"
        fontFamily="inter"
        lineHeight="relaxed"
        marginBottom="sm"
        class="clamp-6"
      >
        {{ description }}
      </Text>

      <Text
        as="p"
        size="sm"
        color="text-tertiary"
        weight="medium"
        fontStyle="italic"
        class="clamp-3"
      >
        Published on <em>{{ formattedDate }}</em> by <strong>{{ author }}</strong>
      </Text>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { format, parseISO } from "date-fns";

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
  props.date ? format(parseISO(props.date), "MMMM d, yyyy") : "Unknown Date"
);
</script>
