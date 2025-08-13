<template>
  <div class="list-category">
     <Text
        as="span"
        fontFamily="sora"
        size="lg"
        color="link-primary"
        weight="bold"
        align="left"
        class="list-category__title"
      >
        {{ title }}
      </Text>
      <Text
        as="span"
        fontFamily="sora"
        size="lg"
        color="link-primary"
        weight="medium"
        align="left"
        class="list-category__count-badge"
      >
        ({{ number }})
      </Text>
    </div>
</template>

<script lang="ts" setup>

interface Props {
  title: string;
  number: number;
}

// Set default values
const props = withDefaults(defineProps<Props>(), {
  title: "AI and Lawmaking",
  number: 65
});
</script>

<style scoped>
.list-category {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  column-gap: 0.5rem;
  width: 100%;
}

.list-category__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-category__count-badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  background-color: #eaf2ff;
  color: #003366;
}
</style>

