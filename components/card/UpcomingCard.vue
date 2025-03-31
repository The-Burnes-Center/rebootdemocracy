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

          <Button variant="primary" width="123px" height="36px"
            >Register</Button
          >
        </div>
      </div>

      <div class="upcomingcard__details" v-if="excerpt">
        <BodyText
          size="base"
          weight="normal"
          align="right"
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
    <div class="upcomingcard__layout">
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
          class="upcomingcard__excerpt"
        >
          {{ excerpt }}
        </BodyText>
        <div class="upcomingcard__mobile-button">
          <Button variant="primary" width="100%">Register</Button>
        </div>
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
