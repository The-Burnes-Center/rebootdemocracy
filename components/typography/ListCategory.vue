<template>
  <div class="list-category">
     <Text
        as="span"
        fontFamily="sora"
        size="lg"
        color="link-primary"
        weight="bold"
        align="center"
      >
        {{ title }}
      </Text>
      <Text
        as="span"
        fontFamily="sora"
        size="lg"
        color="link-primary"
        weight="medium"
        align="center"
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

