<template>
  <section
    class="upcomingcard__container"
    :style="{
      '--card-bg-color': backgroundColor,
      '--tag-color': tagColor || '#5C69AB',
    }"
  >
    <!-- Desktop View -->
    <div class="upcomingcard__card desktop-view">
      <div class="upcomingcard__header">
        <div v-if="imageUrl" class="upcomingcard__image">
          <img :src="imageUrl" :alt="title" />
        </div>
        <div class="upcomingcard__content">
          <div class="upcomingcard__tag">Upcoming Event</div>
          <h3 v-if="title" class="upcomingcard__title">{{ title }}</h3>
          <Button
            label="Register"
            bgColor="#0D63EB"
            textColor="#0d63eb"
            borderColor="#0d63eb"
            :opacity="0.2"
            :onClick="handleClick"
          />
        </div>
      </div>
      <div class="upcomingcard__details">
        <div v-if="excerpt" class="upcomingcard__excerpt">{{ excerpt }}</div>
      </div>
    </div>

    <!-- Mobile View -->
    <div class="upcomingcard__card mobile-view">
      <div class="upcomingcard__mobile-image-wrapper">
        <div v-if="imageUrl" class="upcomingcard__mobile-image">
          <img :src="imageUrl" :alt="title" />
        </div>
      </div>
      
      <div class="upcomingcard__mobile-content">
        <div class="upcomingcard__tag">Upcoming Event</div>
        <h3 v-if="title" class="upcomingcard__title">{{ title }}</h3>
        
        <div v-if="excerpt" class="upcomingcard__excerpt">{{ excerpt }}</div>
        
        <div class="upcomingcard__mobile-button">
          <Button
            label="Register"
            bgColor="#0D63EB"
            textColor="#0d63eb"
            borderColor="#0d63eb"
            :opacity="0.2"
            :onClick="handleClick"
            class="full-width-button"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface CardProps {
  title?: string;
  excerpt?: string;
  imageUrl?: string;
  backgroundColor?: string;
  tagColor?: string;
  handleClick?: () => void;
}

const props = withDefaults(defineProps<CardProps>(), {
  title: "",
  excerpt: "",
  imageUrl: "",
  backgroundColor: "#FFFFFF",
  tagColor: "",
});

const handleClick = () => {
  props.handleClick ? props.handleClick() : console.log('Card clicked');
};
</script>
