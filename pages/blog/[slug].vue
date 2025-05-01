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
              <Text as="span" size="sm" weight="extradarkbold" marginLeft="sm"
                >Blog</Text
              >
            </button>

            <!-- Blog title -->
            <TitleText
              :level="'h1'"
              size="5xl"
              weight="medium"
              class="blog-title"
              fontFamily="inria"
              lineHeight="super-loose"
              style="letter-spacing: normal"
            >
              {{ blog.title }}
            </TitleText>

            <!-- Category eyebrow - Now clickable -->
            <div
              v-if="blog.Tags && blog.Tags.length > 0"
              class="blog-category-eyebrow"
            >
              <span
                v-for="(tag, index) in blog.Tags"
                :key="index"
                class="category-tag"
                @click="navigateToCategory(tag)"
              >
                {{ tag }}
              </span>
            </div>

            <!-- Excerpt -->
            <div v-if="blog.excerpt" class="blog-excerpt">
              <p class="excerpt-paragraph">
                {{ blog.excerpt }}
              </p>
            </div>

            <!-- Publication info (date and author) -->
            <div class="publication-info">
              <Text size="sm" weight="normal" fontStyle="italic">
                Published on
                <Text as="span" size="sm" weight="bold" fontStyle="italic">
                  {{ formatDate(blog.date) }}
                </Text>
                <template v-if="blog.authors && blog.authors.length > 0">
                  by
                  <Text as="span" size="sm" weight="bold" fontStyle="italic">
                    {{ getAuthorsDisplayText(blog.authors) }}
                  </Text>
                </template>
              </Text>
            </div>

            <!-- Audio component -->
            <div class="audio-version" v-if="blog?.audio_version">
              <p dir="ltr">
                <em>Listen to the AI-generated audio version of this piece.</em>
              </p>
              <AudioPlayer
                :audioSrc="`https://content.thegovlab.com/assets/${blog.audio_version.id}`"
              />
            </div>

            <!-- Blog content -->
            <div class="blog-content-container">
              <div class="blog-content" v-html="blog.content"></div>
            </div>
          </template>
        </template>
      </article>

      <!-- Sidebar content -->
      <aside
        class="right-content-blog"
        v-if="blog && blog.authors && blog.authors.length > 0"
      >
        <div class="share-widget-mobile">
          <ShareWidget
            url="https://rebootdemocracy.ai/blog/your-post-slug"
            title="Your post title"
            description="A brief description of your content"
            align="center"
          />
        </div>

        <!-- Author cards (multiple) -->
        <div v-for="(author, index) in blog.authors" :key="index">
          <AuthorCard
            :author="author"
            :imageUrl="getAuthorImageUrl(author?.team_id)"
            :name="getAuthorName(author?.team_id)"
            :bio="getAuthorBio(author?.team_id)"
          />
        </div>

        <!-- Sign up widget -->
        <SignUpButtonWidget
          title="Sign Up for updates"
          placeholder="Enter your email"
          buttonLabel="Sign Up"
          backgroundColor="#F9F9F9"
        />
        <div class="share-widget-desktop">
          <ShareWidget
            url="https://rebootdemocracy.ai/blog/your-post-slug"
            title="Your post title"
            description="A brief description of your content"
          />
        </div>
      </aside>
    </section>
  </div>
  <!--Related Articles section-->
  <RelatedBlogCards :relatedBlogs="relatedBlogs" />
</template>

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

const {
  data: blog,
  pending,
  error,
} = await useAsyncData(`blog-${route.params.slug}`, async () => {
  if (!route.params.slug) return null;
  return await fetchBlogBySlug(route.params.slug as string);
});

if (import.meta.server) {
  useSeoMeta({
    title: "RebootDemocracy.AI",
    description:
      "RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.",
    ogTitle: "RebootDemocracy.AI",
    ogDescription:
      "RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.",
    ogImage: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b",
    ogUrl: `https://rebootdemocracy.ai/blog/${route.params.slug}`,
    twitterCard: "summary_large_image",
  });
}


useSeoMeta({
  title: () => blog.value?.title || "RebootDemocracy.AI",
  description: () =>
    blog.value?.excerpt ||
    `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to:

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another

As researchers, we want to understand how best to “do democracy” in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`,
  ogTitle: () => blog.value?.title || "RebootDemocracy.AI",
  ogDescription: () =>
    blog.value?.excerpt ||
    `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to:

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another

As researchers, we want to understand how best to “do democracy” in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`,
  ogImage: () =>
    blog.value?.image
      ? getImageUrl(blog.value.image)
      : "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b",
  ogUrl: () =>
    `https://rebootdemocracy.ai/blog/${route.params.slug}`,
  twitterCard: "summary_large_image",
});


const isLoading = ref(true);
const relatedBlogs = ref<BlogPost[]>([]);

// Function to navigate to blogs filtered by category
function navigateToCategory(category: string) {
  router.push({
    path: "/blog",
    query: { category },
  });
}

// Function to get image URL with fallback
function getAuthorImageUrl(authorData: any, width: number = 600): string {
  if (!authorData || !authorData.Headshot || !authorData.Headshot.id) {
    return "/images/exampleImage.png";
  }
  return `https://content.thegovlab.com/assets/${authorData.Headshot.id}?width=${width}`;
}

// Function to get author name
function getAuthorName(author: any): string {
  if (!author) return "Unknown Author";
  return `${author.First_Name || ""} ${author.Last_Name || ""}`.trim();
}

// Function to get author bio
function getAuthorBio(author: any): string {
  if (!author) return "Reboot Democracy contributor";
  const name = getAuthorName(author);
  return `${name} works at the Burnes Center for Social Change and writes on Reboot Democracy about how AI impacts public service delivery, lawmaking and research`;
}

// Function to format multiple authors for display
function getAuthorsDisplayText(authors: any[]): string {
  if (!authors || authors.length === 0) return "Unknown Author";

  return authors
    .map((author) => getAuthorName(author.team_id))
    .filter((name) => name.trim() !== "")
    .join(", ");
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
  resetSearch();
  setIndexNames(["reboot_democracy_blog", "reboot_democracy_weekly_news"]);

  try {
    isLoading.value = true;
    if (blogslug.value) {
    
      if (blog.value?.Tags?.length) {
        relatedBlogs.value = await fetchRelatedBlogsByTags(
          blog.value.Tags,
          blogslug.value
        );
      }
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
