<template>
  <section
    class="postcard__container"
    :style="{
      '--card-bg-color': backgroundColor,
       '--tag-color': tagColor || '#5C69AB'
    }"
  >
    <div class="postcard__card">
         <div v-if="imageUrl" class="postcard__image">
          <img :src="imageUrl" :alt="title" />
        </div>

        <div class="postcard__content">
            <div>
              <div v-if="tag" class="postcard__tag">{{ tag }}</div>
              <h3 v-if="title" class="postcard__title">{{ title }}</h3>
            </div>
            <div class="postcard__details">
               <div v-if="excerpt" class="postcard__excerpt">{{ excerpt }}</div>
              <div v-if="date || author" class="postcard__meta">
                Published on <span class="date-author-text"> {{ formatDate(date) }}</span>
                by <span v-if="author" class="date-author-text"> {{ author }}</span>
            </div>
            </div>
        </div>
    </div>
  </section>
</template>

<script setup lang="ts">

import { format, parseISO } from "date-fns";

interface CardProps {
  tag?: string;
  title?: string;
  author?: string;
  excerpt?: string;
  imageUrl?: string;
  date?: Date | string;
  backgroundColor?: string;
  tagColor?: string;
}

const props = withDefaults(defineProps<CardProps>(), {
  tag: "",
  title: "",
  author: "",
  excerpt: "",
  imageUrl: "",
  date: new Date(), 
  backgroundColor: "#FFFFFF",
  tagColor: ""
});

const formatDate = (dateValue: Date | string) => {
  if (!dateValue) return "unknown date";

  try {
    const date =
      typeof dateValue === "string" ? parseISO(dateValue) : dateValue;
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "invalid date";
  }
};
</script>
