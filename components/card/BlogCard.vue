<template>
  <div class="blogcard-container" @click="$emit('click')">
    <div class="blogcard-image-wrapper">
      <img :src="imageUrl" :alt="title" class="blogcard-image" />
    </div>

    <div class="blogcard-content">
      <Text
        v-if="tag"
        as="span"
        size="xs"
        weight="bold"
        color="tag-primary"
        class="blogcard-tag"
        transform="uppercase"
        fontFamily="inria"
      >
        {{ tag }}
      </Text>

      <!-- Blog card title -->
      <Text
        as="h3"
        size="xl"
        weight="extrabold"
        fontFamily="inria"
        color="text-dark"
        lineHeight="relaxed"
        class="blogcard-title"
      >
        {{ title }}
      </Text>

      <!-- Blog card excerpt -->
      <Text
        as="p"
        size="base"
        weight="medium"
        color="text-primary"
        lineHeight="normal"
        class="blogcard-excerpt"
      >
        {{ excerpt }}
      </Text>

      <!-- Blog card meta -->
      <Text
        v-if="date"
        as="p"
        size="xs"
        fontStyle="italic"
        class="blogcard-meta"
      >
        Published on
        <Text as="span" size="xs" weight="bold" fontStyle="italic">
          {{ formattedDate }}
        </Text>
        <template v-if="author && author !== 'Reboot Democracy Team'">
          by
          <Text as="span" size="xs" weight="bold" fontStyle="italic">
            {{ author }}
          </Text>
        </template>
      </Text>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  excerpt: string;
  imageUrl: string;
  tag?: string;
  author?: string;
  date?: Date;
}>();

const formattedDate = props.date
  ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(props.date)
  : "";
</script>

<style scoped>
.blogcard-container {
  cursor: pointer;
  width: 300px;
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;
  background-color: #fff;
}

.blogcard-container:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.blogcard-image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.blogcard-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blogcard-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.blogcard-tag {
  background-color: #feebe3;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.blogcard-tag:hover {
  background-color: #f5d1c2;
}

.blogcard-title {
  font-size: 1.25rem;
  color: #003366;
  font-family: var(--font-habibi);
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.4em * 3);
}

.blogcard-excerpt {
  font-size: 1rem;
  font-family: var(--font-habibi);
  color: #555;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.5em * 4);
}

.blogcard-meta {
  font-size: 0.875rem;
  color: #777;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
</style>
