<script setup lang="ts">
definePageMeta({
  layout: "blog",
});

import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { BlogPost } from "@/types/BlogPost";
import { format } from "date-fns";

const { showSearchResults, setIndexNames, resetSearch } = useSearchState();

const route = useRoute();
const router = useRouter();

const blogslug = computed(() => route.params.slug as string);
const blog = ref<BlogPost | null>(null);
const isLoading = ref(true);

// Function to get image URL with fallback
function getImageUrl(image: any, width: number = 600): string {
  if (!image?.filename_disk) {
    return "/images/exampleImage.png";
  }
  return `https://content.thegovlab.com/assets/${image.filename_disk}?width=${width}`;
}

// Function to get author name
function getAuthorName(author: any): string {
  if (!author) return "Unknown Author";
  return `${author.First_Name || ""} ${author.Last_Name || ""}`.trim();
}

// Function to format date using date-fns (consistent with your PostCard)
function formatDate(dateValue: Date | string) {
  if (!dateValue) return "unknown date";
  try {
    const date =
      typeof dateValue === "string"
        ? new Date(dateValue)
        : dateValue || new Date();
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "invalid date";
  }
}

// Reset search results when component is mounted
onMounted(async () => {
  // Reset the search first
  resetSearch();
  
  setIndexNames([
    "reboot_democracy_blog",
    "reboot_democracy_weekly_news"
  ]);
  try {
    isLoading.value = true;
    if (blogslug.value) {
      blog.value = await fetchBlogBySlug(blogslug.value);
    }
  } catch (error) {
    console.error("Error loading blog post:", error);
  } finally {
    isLoading.value = false;
  }
});

// Clean up when navigating away from this component
onBeforeUnmount(() => {
  // Also reset search when leaving the page
  resetSearch();
});
</script>

<template>
  <div class="blog-detail">
    <section class="page-layout-blog">
      <article class="left-content-blog">
        <GlobalSearch v-if="showSearchResults" />

        <!-- Loading state -->
        <template v-else>
          <div v-if="isLoading" class="loading">
            <div class="loading-spinner"></div>
            <Text size="base" weight="medium" align="center"
              >Loading blog post...</Text
            >
          </div>

          <!-- Error state -->
          <div v-else-if="!blog" class="error-message">
            <TitleText level="h2" size="xl" align="center"
              >Blog post not found</TitleText
            >
            <Button @click="router.push('/blog')" variant="primary">
              Back to Blogs
            </Button>
          </div>

          <!-- Blog content -->
          <template v-else>
            <button class="blog-back-btn" @click="router.push('/blog')">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                class="icon"
              >
                <path
                  d="M15.7957 18.7041C16.0071 18.9154 16.1258 19.2021 16.1258 19.5009C16.1258 19.7998 16.0071 20.0865 15.7957 20.2978C15.5844 20.5092 15.2977 20.6279 14.9989 20.6279C14.7 20.6279 14.4133 20.5092 14.202 20.2978L6.70198 12.7978C6.5971 12.6933 6.51388 12.5691 6.4571 12.4324C6.40032 12.2956 6.37109 12.149 6.37109 12.0009C6.37109 11.8529 6.40032 11.7063 6.4571 11.5695C6.51388 11.4328 6.5971 11.3086 6.70198 11.2041L14.202 3.70406C14.4133 3.49272 14.7 3.37399 14.9989 3.37399C15.2977 3.37399 15.5844 3.49272 15.7957 3.70406C16.0071 3.91541 16.1258 4.20205 16.1258 4.50094C16.1258 4.79982 16.0071 5.08647 15.7957 5.29781L9.09354 12L15.7957 18.7041Z"
                  fill="black"
                />
              </svg>
              <Text as="span" size="sm" weight="medium">Blog</Text>
            </button>

            <!-- Blog title -->
            <TitleText
              :level="'h1'"
              size="5xl"
              weight="medium"
              class="blog-title"
              fontFamily="inria"
              lineHeight="super-loose"
              style="{letter-spacing: normal}""
            >
              {{ blog.title }}
            </TitleText>

            <!-- Publication info (date and author) -->
            <div class="publication-info">
              <Text size="sm" weight="normal" fontStyle="italic">
                Published on
                <Text as="span" size="sm" weight="bold" fontStyle="italic">
                  {{ formatDate(blog.date) }}
                </Text>
                <template
                  v-if="
                    blog.authors &&
                    blog.authors.length > 0 &&
                    blog.authors[0]?.team_id
                  "
                >
                  by
                  <Text as="span" size="sm" weight="bold" fontStyle="italic">
                    {{ getAuthorName(blog.authors[0].team_id) }}
                  </Text>
                </template>
              </Text>
            </div>

            <!-- Excerpt -->
            <div v-if="blog.excerpt" class="blog-excerpt">
              <BodyText
                size="lg"
                fontFamily="inria"
                lineHeight="relaxed"
                fontStyle="italic"
              >
                {{ blog.excerpt }}
              </BodyText>
            </div>

            <blockquote class="quote-block">
              " AI in a manner that fosters public trust and confidence while
              protecting privacy, civil rights, civil liberties, and American
              values."
              <span class="quote-block-footer"
                >— John Smith, Software Engineer</span
              >
            </blockquote>

            <!-- Blog content -->
            <div class="blog-content-container">
              <div class="blog-content" v-html="blog.content"></div>
            </div>
          </template>
        </template>
      </article>

      <!-- Sidebar content -->
      <aside class="right-content-blog" v-if="blog && blog.authors && blog.authors.length > 0 && blog.authors[0]?.team_id">
        <!-- Author card -->
        <!-- <AuthorCard
          :author="blog.authors[0]"
          :image="getImageUrl(blog.authors[0]?.team_id?.image)"
          :name="getAuthorName(blog.authors[0]?.team_id)"
          :bio="blog.authors[0]?.team_id?.bio"
        /> -->

        <!-- Sign up widget -->
        <SignUpButtonWidget
          title="Sign Up for updates"
          placeholder="Enter your email"
          buttonLabel="Sign Up"
          backgroundColor="#F9F9F9"
        />
      </aside>
    </section>
  </div>
</template>