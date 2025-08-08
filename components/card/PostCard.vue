<template>
  <!--Desktop view-->
  <Card
    size="large"
    :variant="'default'"
    :hoverable="hoverable"
    :class="['desktop-view', { 'featured-post': isFeatured }]"
    :aria-label="`Article: ${titleText} by ${author}, published ${formatDate(date)}`"
    role="article"
    tabindex="0"
    @click="$emit('click')"
    @keydown="handleKeydown"
  >
    <section class="postcard__container">
      <div class="postcard__content">
        <div v-if="imageUrl" class="postcard__image">
          <img 
            :src="imageUrl" 
            :alt="`Article image for ${titleText}`"
            loading="lazy"
          />
        </div>

        <div class="postcard__text-content">
          <div>
            <div class="tag-container">
              <Tag
                v-if="tag"
                as="span"
                size="xs"
                weight="bold"
                transform="uppercase"
                fontFamily="sora"
                class="featured-card__tag"
                :color="'tag-primary'"
                role="text"
                :aria-label="`Category: ${tag}`"
              >{{ tag }}</Tag>
              <span v-if="isFeatured" class="tag-separator" aria-hidden="true">|</span>
              <Tag
                v-if="isFeatured"
                lineHeight="normal"
                margin="none"
                size="xs"
                :index="0"
                role="text"
                aria-label="This is a featured post"
              >Featured</Tag>

              <TitleText
                v-if="titleText"
                size="xl"
                :lineClamp="2"
                :level="'h3'"
                weight="bold"
                fontFamily="sora"
                color="text-dark"
              >
                {{ titleText }}
              </TitleText>
            </div>
          </div>

          <div class="postcard__details">
            <BodyText
              v-if="excerpt"
              size="base"
              lineHeight="normal"
              :lineClamp="2"
              weight="medium"
              fontFamily="habibi"
              role="text"
              :aria-label="`Article excerpt: ${excerpt}`"
            >
              {{ excerpt }}
            </BodyText>

            <div v-if="date || author" class="postcard__meta">
              <Text 
                size="xs" 
                weight="normal" 
                fontStyle="italic" 
                fontFamily="habibi"
                role="text"
                :aria-label="`Published on ${formatDate(date)} by ${author}`"
              >
                <template v-if="date && author">
                  Published on
                  <Text 
                    as="span" 
                    size="xs" 
                    weight="bold" 
                    fontStyle="italic" 
                    fontFamily="sora"
                  >{{ formatDate(date) }}</Text>
                  by
                  <Text as="span" size="xs" weight="bold" fontStyle="italic" fontFamily="sora">{{ author }}</Text>
                </template>
                <template v-else-if="date">
                  Published on
                  <Text 
                    as="span" 
                    size="xs" 
                    weight="bold" 
                    fontStyle="italic" 
                    fontFamily="habibi"
                  >{{ formatDate(date) }}</Text>
                </template>
                <template v-else-if="author">
                  Published by
                  <Text as="span" size="xs" weight="bold" fontStyle="italic" fontFamily="habibi">{{ author }}</Text>
                </template>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Card>

  <!--Mobile view with same accessibility enhancements-->
  <Card
    size="large"
    :variant="'default'"
    :hoverable="hoverable"
    :class="['mobile-view', { 'featured-post': isFeatured }]"
    :aria-label="`Article: ${titleText} by ${author}, published ${formatDate(date)}`"
    role="article" 
    tabindex="0"
    @click="$emit('click')"
    @keydown="handleKeydown"
  >
    <!-- Mobile view content similar to desktop with same accessibility features -->
    <section class="postcard__container">
      <div class="postcard__content">
        <div v-if="imageUrl" class="postcard__image">
          <img 
            :src="imageUrl" 
            :alt="`Article image for ${titleText}`"
            loading="lazy"
          />
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
                fontFamily="sora"
                class="featured-card__tag"
                :color="'tag-primary'"
                :index="tagIndex"
                >{{ tag }}</Tag
              >
              <span v-if="isFeatured" class="tag-separator">|</span>
              <Tag
                v-if="isFeatured"
                lineHeight="normal"
                margin="none"
                size="xs"
                fontFamily="sora"
                :index="0"
                >Featured</Tag
              >
            </div>

            <!--title-->
            <TitleText
              v-if="titleText"
               size="xl"
                :lineClamp="2"
                :level="'h3'"
                weight="bold"
                fontFamily="sora"
                color="text-dark"
            >
              {{ titleText }}
            </TitleText>
          </div>

          <!--excerpt-->
          <div class="postcard__details">
            <BodyText
              v-if="excerpt"
               size="base"
              lineHeight="normal"
              :lineClamp="2"
              weight="medium"
              fontFamily="habibi"
            >
              {{ excerpt }}
            </BodyText>

            <!--meta info-->
            <div v-if="date || author" class="postcard__meta">
              <Text size="xs" weight="normal" fontStyle="italic">
                <!-- If both date and author exist -->
                <template v-if="date && author">
                  Published on
                  <Text as="span" size="xs" weight="bold" fontStyle="italic"  fontFamily="sora">{{
                    formatDate(date)
                  }}</Text>
                  by
                  <Text as="span" size="xs" weight="bold" fontStyle="italic"  fontFamily="sora">{{
                    author
                  }}</Text>
                </template>

                <!-- If only date exists -->
                <template v-else-if="date">
                  Published on
                  <Text as="span" size="xs" weight="bold" fontStyle="italic"  fontFamily="sora">{{
                    formatDate(date)
                  }}</Text>
                </template>

                <!-- If only author exists -->
                <template v-else-if="author">
                  Published by
                  <Text as="span" size="xs" weight="bold" fontStyle="italic" fontFamily="sora">{{
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
  isFeatured?: boolean;
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
  isFeatured: false,
});

const emit = defineEmits(["click", "keydown"]);

const formatDate = (dateValue: Date | string) => {
  if (!dateValue) return "unknown date";
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : dateValue || new Date();
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "invalid date";
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emit('click', event);
  }
  emit('keydown', event);
};
</script>