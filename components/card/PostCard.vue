<template>
  <!--Used reusable container card by passing variant and size-->
  <Card
    size="extra-large"
    :variant="'default'"
    :hoverable="hoverable"
    class="desktop-view"
  >
    <section class="postcard__container">
      <!--image-->
      <div class="postcard__content">
        <div v-if="imageUrl" class="postcard__image">
          <img :src="imageUrl" :alt="titleText" />
        </div>

        <div class="postcard__text-content">
          <div>
            <!--tag-->
            <Tag
              v-if="tag"
              lineHeight="normal"
              margin="none"
              size="xs"
              :index="tagIndex"
              >{{ tag }}</Tag
            >

            <!--title-->
            <TitleText v-if="titleText" size="xl" :lineClamp="2" :level="'h3'">
              {{ titleText }}
            </TitleText>
          </div>

          <!--excerpt-->
          <div class="postcard__details">
            <BodyText
              v-if="excerpt"
              size="base"
              lineHeight="normal"
              :lineClamp="3"
            >
              {{ excerpt }}
            </BodyText>

            <!--meta info-->
            <div v-if="date || author" class="postcard__meta">
              <Text size="xs" weight="normal" fontStyle="italic">
                <template v-if="author">
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
    size="small"
    :variant="'default'"
    :hoverable="hoverable"
    class="mobile-view"
  >
    <section class="postcard__container">
      <!--image-->
      <div class="postcard__content">
        <div v-if="imageUrl" class="postcard__image">
          <img :src="imageUrl" :alt="titleText" />
        </div>

        <div class="postcard__text-content">
          <div>
            <!--tag-->
            <Tag
              v-if="tag"
              weight="normal"
              lineHeight="normal"
              margin="none"
              size="xs"
              :index="tagIndex"
              >{{ tag }}</Tag
            >

            <!--title-->
            <TitleText v-if="titleText" size="xl" :lineClamp="2" :level="'h3'">
              {{ titleText }}
            </TitleText>
          </div>

          <!--excerpt-->
          <div class="postcard__details">
            <BodyText
              v-if="excerpt"
              size="base"
              lineHeight="normal"
              :lineClamp="3"
            >
              {{ excerpt }}
            </BodyText>

            <!--meta info-->
            <div v-if="date || author" class="postcard__meta">
              <Text size="xs" weight="normal" fontStyle="italic">
                Published on
                <Text as="span" size="xs" weight="bold" fontStyle="italic">{{
                  formatDate(date)
                }}</Text>
                <template v-if="author">
                  by
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
});

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
