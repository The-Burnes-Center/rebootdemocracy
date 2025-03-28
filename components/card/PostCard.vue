<template>
  <div 
    class="card" 
    :style="{
      '--card-bg-color': backgroundColor,
      '--card-border-color': borderColor
    }"
  >
    <div v-if="imageUrl || defaultImage" class="card__image">
      <img :src="imageUrl || defaultImage" :alt="title" />
    </div>
    
    <div class="card__content">
      <div v-if="tag" class="card__tag">{{ tag }}</div>
      
      <h3 v-if="title" class="card__title">{{ title }}</h3>
      
      <div v-if="excerpt" class="card__excerpt">{{ excerpt }}</div>
      
      <div v-if="date || author" class="card__meta">
        Published on {{ formatDate(date) }} {{ author ? `by ${author}` : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import defaultImage from "/images/exampleImage.png";
import { format, parseISO } from 'date-fns';

interface CardProps {
  tag?: string;
  title?: string;
  author?: string;
  excerpt?: string;
  imageUrl?: string;
  date?: Date | string;
  backgroundColor?: string;
  borderColor?: string;
}

const props = withDefaults(defineProps<CardProps>(), {
  tag: "",
  title: "",
  author: "",
  excerpt: "",
  imageUrl: "",
  date: new Date(), // Default to current date
  backgroundColor: "#FFFFFF",
  borderColor: "#e0e0e0"
});

const formatDate = (dateValue: Date | string) => {
  if (!dateValue) return 'unknown date';
  
  try {
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
    return format(date, 'MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'invalid date';
  }
};
</script>
