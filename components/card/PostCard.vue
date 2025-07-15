<template>
  <!--Used reusable container card by passing variant and size-->
  <Card
    size="large"
    :variant="'default'"
    :hoverable="hoverable"
    :class="['desktop-view', { 'featured-post': isFeatured }]"
    @click="$emit('click')"
  >
    <section class="postcard__container">
      <!--image-->
      <div class="postcard__content">
        <div v-if="imageUrl" class="postcard__image">
          <img :src="imageUrl" :alt="titleText" />
        </div>

        <div class="postcard__text-content">
          <div>
            <!--tag with featured badge-->
            <div class="tag-container">
              <Tag
                v-if="tag"
                 as="span"
                size="xs"
                weight="bold"
                transform="uppercase"
                fontFamily="inter"
                class="featured-card__tag"
                :color="'tag-primary'"
                >{{ tag }}</Tag
              >
              <span v-if="isFeatured" class="tag-separator">|</span>
              <Tag
                v-if="isFeatured"
                lineHeight="normal"
                margin="none"
                size="xs"
                :index="0"
                >Featured</Tag
              >

                 <!--title-->
            <TitleText
              v-if="titleText"
              size="xl"
              :lineClamp="2"
              :level="'h3'"
              weight="bold"
              class="textclass"
            >
              {{ titleText }}
            </TitleText>
            </div>

         
          </div>

          <!--excerpt-->
          <div class="postcard__details">
            <BodyText
              v-if="excerpt"
              size="base"
              lineHeight="normal"
              :lineClamp="2"
              weight="medium"
            >
              {{ excerpt }}
            </BodyText>

            <!--meta info-->
            <div v-if="date || author" class="postcard__meta">
              <Text size="xs" weight="normal" fontStyle="italic">
                <!-- If both date and author exist -->
                <template v-if="date && author">
                  Published on
                  <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                    formatDate(date)
                  }}</Text>
                  by
                  <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                    author
                  }}</Text>
                </template>

                <!-- If only date exists -->
                <template v-else-if="date">
                  Published on
                  <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                    formatDate(date)
                  }}</Text>
                </template>

                <!-- If only author exists -->
                <template v-else-if="author">
                  Published by
                  <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                    author
                  }}</Text>
                </template>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Card>

  <!--Mobile view-->
  <Card
    size="large"
    :variant="'default'"
    :hoverable="hoverable"
    :class="['mobile-view', { 'featured-post': isFeatured }]"
    @click="$emit('click')"
  >
    <section class="postcard__container">
      <!--image-->
      <div class="postcard__content">
        <div v-if="imageUrl" class="postcard__image">
          <img :src="imageUrl" :alt="titleText" />
        </div>

        <div class="postcard__text-content">
          <div>
            <!--tag with featured badge-->
            <div class="tag-container">
              <Tag
                v-if="tag"
                weight="normal"
                lineHeight="normal"
                margin="none"
                size="xs"
                :index="tagIndex"
                >{{ tag }}</Tag
              >
              <span v-if="isFeatured" class="tag-separator">|</span>
              <Tag
                v-if="isFeatured"
                lineHeight="normal"
                margin="none"
                size="xs"
                :index="0"
                >Featured</Tag
              >
            </div>

            <!--title-->
            <TitleText
              v-if="titleText"
              size="lg"
              :lineClamp="2"
              :level="'h3'"
              weight="medium"
            >
              {{ titleText }}
            </TitleText>
          </div>

          <!--excerpt-->
          <div class="postcard__details">
            <BodyText
              v-if="excerpt"
              size="lg"
              weight="medium"
              lineHeight="extraRelaxed"
              :lineClamp="2"
            >
              {{ excerpt }}
            </BodyText>

            <!--meta info-->
            <div v-if="date || author" class="postcard__meta">
              <Text size="xs" weight="normal" fontStyle="italic">
                <!-- If both date and author exist -->
                <template v-if="date && author">
                  Published on
                  <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                    formatDate(date)
                  }}</Text>
                  by
                  <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                    author
                  }}</Text>
                </template>

                <!-- If only date exists -->
                <template v-else-if="date">
                  Published on
                  <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                    formatDate(date)
                  }}</Text>
                </template>

                <!-- If only author exists -->
                <template v-else-if="author">
                  Published by
                  <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                    author
                  }}</Text>
                </template>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Card>
</template>

<script setup lang="ts">
import { format, parseISO } from "date-fns";

interface PostCardProps {
  tag?: string;
  titleText?: string;
  author?: string;
  excerpt?: string;
  imageUrl?: string;
  date?: Date | string;
  tagIndex?: number;
  variant?: "default" | "outline" | "flat";
  hoverable?: boolean;
  isFeatured?: boolean; // New prop to indicate if blog post is featured
}

const props = withDefaults(defineProps<PostCardProps>(), {
  tag: "",
  titleText: "",
  author: "",
  excerpt: "",
  imageUrl: "",
  date: undefined,
  tagIndex: 0,
  variant: "default",
  hoverable: false,
  isFeatured: false, // Default to not featured
});

const emit = defineEmits(["click"]);

const formatDate = (dateValue: Date | string) => {
  if (!dateValue) return "unknown date";
  try {
    const date =
      typeof dateValue === "string"
        ? parseISO(dateValue)
        : dateValue || new Date();
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "invalid date";
  }
};
</script>
