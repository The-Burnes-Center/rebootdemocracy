<template>
  <Card variant="default" size="medium" :hoverable="true" class="desktop-view">
    <!-- Desktop View -->
    <div class="upcomingcard__layout">
      <div class="upcomingcard__header">
        <div v-if="imageUrl" class="upcomingcard__image">
          <img :src="imageUrl" :alt="title" />
        </div>
        <div class="upcomingcard__content">
          <Text
            as="span"
            size="base"
            align="right"
            weight="extrabold"
            lineHeight="normal"
            color="text-primary"
            class="upcomingcard__tag"
          >
            Upcoming Event
          </Text>
          <Text
            as="span"
            size="xl"
            align="right"
            lineHeight="relaxed"
            weight="normal"
            class="upcomingcard__title"
          >
            {{ title }}
          </Text>

          <Button variant="primary" width="123px" height="36px" @click="onClick"
            >Register</Button
          >
        </div>
      </div>

      <div class="upcomingcard__details" v-if="excerpt">
        <BodyText
          size="base"
          weight="normal"
          align="right"
          :lineClamp="4"
          margin="none"
          class="upcomingcard__excerpt"
        >
          {{ excerpt }}
        </BodyText>
      </div>
    </div>
  </Card>

  <!-- Mobile View -->
 <Card variant="default" size="small" :hoverable="true" class="mobile-view">
    <div class="upcomingcard__mobile-layout">
      <div class="upcomingcard__mobile-content-container">
        <div class="upcomingcard__mobile-image-wrapper" v-if="imageUrl">
          <img :src="imageUrl" :alt="title" />
        </div>
        <div class="upcomingcard__mobile-content">
          <Text
            as="span"
            size="base"
            align="right"
            weight="extrabold"
            lineHeight="normal"
            color="text-primary"
            class="upcomingcard__tag"
          >
            Upcoming Event
          </Text>
          <Text
            as="span"
            size="xl"
            align="left"
            lineHeight="relaxed"
            weight="normal"
            class="upcomingcard__title"
          >
            {{ title }}
          </Text>
          <BodyText
            size="base"
            weight="normal"
            align="left"
            margin="none"
            lineClamp="4"
            class="upcomingcard__excerpt"
          >
            {{ excerpt }}
          </BodyText>
        </div>
      </div>
            <div class="upcomingcard__mobile-button">
        <Button variant="primary" width="100%" @click="onClick" class="base__button base__button--primary">
          <span class="base__btn-slot">Register</span>
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
interface UpcomingCardProps {
  title?: string;
  excerpt?: string;
  imageUrl?: string;
  backgroundColor?: string;
  tagColor?: string;
  onClick?: () => void;
}

const props = withDefaults(defineProps<UpcomingCardProps>(), {
  title: "",
  excerpt: "",
  imageUrl: "",
  backgroundColor: "#FFFFFF",
  tagColor: "",
  onClick: undefined,
});

const handleClick = () => {
  props.onClick ? props.onClick() : console.log("Card clicked");
};
</script>
