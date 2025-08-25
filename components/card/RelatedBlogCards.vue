<template>
  <section
    v-if="relatedBlogs.length"
    class="related-posts-section blog-related-posts"
  >
    <Text
      fontFamily="sora"
      size="4xl"
      weight="bold"
      class="section-heading"
      lineHeight="extra-loose"
    >
      Related Articles
    </Text>
    <div class="related-posts-list grid-layout">
      <template v-for="(post, index) in relatedBlogs" :key="post.id">
        <!-- Mobile Version -->
        <Card
          v-if="isMobile"
          size="small"
          :variant="'default'"
          :hoverable="true"
          class="mobile-view"
          @click="navigateTo(`/blog/${post.slug}`)"
        >
          <section class="postcard__container">
            <div class="postcard__content">
              <div v-if="post.image?.id" class="postcard__image">
                <img
                  :src="`https://burnes-center.directus.app/assets/${post.image.id}?width=600`"
                  :alt="post.title"
                />
              </div>
              <div class="postcard__text-content">
                  <Tag
                    v-if="post.Tags?.[0]"
                    weight="extrabold"
                    size="xs"
                    :index="index"
                    fontFamily="sora"
                    class="featured-card__tag"
                  >
                    {{ post.Tags[0] }}
                  </Tag>
                  <TitleText size="xl" weight="bold" fontFamily="sora"  color="text-dark" lineHeight="relaxed" class="blogcard-title" :lineClamp="2" :level="'h3'">{{
                    post.title
                  }}</TitleText>
                <div class="postcard__details">
                  <BodyText size="base" :lineClamp="3">{{ post.excerpt }}</BodyText>
                  <div class="postcard__meta">
                    <Text size="xs" weight="normal" fontStyle="italic" fontFamily="habibi" >
                      <template v-if="post.date && post.authors?.[0]?.team_id">
                        Published on
                        <Text
                           as="span"
                          size="xs"
                          weight="bold"
                          fontStyle="italic"
                          fontFamily="sora"
                          >{{ formatDate(post.date) }}</Text
                        >
                        by
                        <Text
                           as="span"
                          size="xs"
                          weight="bold"
                          fontStyle="italic"
                          fontFamily="sora"
                          >{{ getAuthorName(post.authors[0].team_id) }}</Text
                        >
                      </template>
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Card>

        <!-- Desktop Version -->
        <Card
          v-else
          size="normal"
          :variant="'default'"
          :hoverable="true"
          @click="router.push(`/blog/${post.slug}`)"
        >
          <section class="postcard__container">
            <div class="postcard__content">
              <div v-if="post.image?.id" class="postcard__image">
                <img
                  :src="`https://burnes-center.directus.app/assets/${post.image.id}?width=600`"
                  :alt="post.title"
                />
              </div>
              <div class="postcard__text-content">
                <div>
                  <Tag
                    v-if="post.Tags?.[0]"
                    weight="extrabold"
                    size="xs"
                    :index="index"
                    fontFamily="sora"
                    class="featured-card__tag"
                    >{{ post.Tags[0] }}</Tag
                  >
                  <TitleText size="xl" weight="bold" fontFamily="sora"  color="text-dark" lineHeight="relaxed" class="blogcard-title" :lineClamp="2" :level="'h3'">{{
                    post.title
                  }}</TitleText>
                </div>
                <div class="postcard__details">
                  <BodyText size="base" :lineClamp="3">{{
                    post.excerpt
                  }}</BodyText>
                  <div class="postcard__meta">
                    <Text size="xs" weight="normal" fontStyle="italic" fontFamily="habibi">
                      <template v-if="post.date && post.authors?.[0]?.team_id">
                        Published on
                        <Text
                          as="span"
                          size="xs"
                          weight="bold"
                          fontStyle="italic"
                          fontFamily="sora"
                          >{{ formatDate(post.date) }}</Text
                        >
                        by
                        <Text
                          as="span"
                          size="xs"
                          weight="bold"
                          fontStyle="italic"
                          fontFamily="sora"
                          >{{ getAuthorName(post.authors[0].team_id) }}</Text
                        >
                      </template>
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Card>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { BlogPost } from "@/types/BlogPost";
import { format } from "date-fns";
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";

const props = defineProps<{
  relatedBlogs: BlogPost[];
}>();

const router = useRouter();

// Responsive flag
const isMobile = ref(false);

onMounted(() => {
  isMobile.value = window.innerWidth <= 768;
  window.addEventListener("resize", () => {
    isMobile.value = window.innerWidth <= 768;
  });
});

function formatDate(dateValue: Date | string) {
  if (!dateValue) return "unknown date";
  try {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return format(date, "MMMM d, yyyy");
  } catch {
    return "invalid date";
  }
}

function getAuthorName(author: any): string {
  if (!author) return "Unknown Author";
  return `${author.First_Name || ""} ${author.Last_Name || ""}`.trim();
}
</script>

<style scoped>
@media (min-width: 769px) {
  .postcard__text-content > div {
    display: flex;
    flex-direction: column;
    gap: 6px; 
  }
}
</style>
