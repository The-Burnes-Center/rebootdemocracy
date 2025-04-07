<template>
  <Hero
    title="Rebooting Democracy in the Age of AI"
    subtitle="Insights on AI, Governance and Democracy"
    firstPartnerLogo="/images/burnes-logo-blues-1.png"
    firstPartnerAlt="Burnes Center for Social Change"
    secondPartnerLogo="/images/the-govlab-logo-white.png"
    secondPartnerAlt="The GovLab"
  />

  <section class="page-layout">
    <article class="left-content">
      <div v-if="isLoading" class="loading">Loading blogs...</div>

      <!-- Display blogs when loaded -->
      <div v-else-if="postData.length > 0" class="blog-list">
        <PostCard
          v-for="(post, index) in postData"
          :key="post.id"
          :tag="getPostTag(post)"
          :titleText="post.title"
          :author="getAuthorName(post)"
          :excerpt="post.excerpt || ''"
          :imageUrl="getImageUrl(post.image)"
          :date="new Date(post.date)"
          :tagIndex="index % 5"
          variant="default"
          :hoverable="true"
        />
      </div>
      <!-- No blogs found message -->
      <div v-else class="no-blogs">No blog posts found.</div>
      <div class="btn-mid">
        <Button
          variant="primary"
          width="123px"
          height="36px"
          @click="handleBtnClick"
          >View All</Button
        >
      </div>
    </article>

    <aside class="right-content">
      <Text
        as="h2"
        fontFamily="inter"
        size="lg"
        color="text-primary"
        weight="bold"
        align="left"
      >
        Category</Text
      >

      <!-- Display list of categories with post counts -->
      <div v-if="isTagsLoading" class="loading-tags">Loading categories...</div>
      <div v-else class="category-list">
        <div v-for="tag in tags" :key="tag.id" class="category-item">
          <ListCategory :title="tag.name" :number="tag.count" />
        </div>
      </div>

      <!-- Event section with loading state -->
      <div v-if="isEventLoading" class="loading">Loading event...</div>
      <UpcomingCard
        v-else-if="latestEvent"
        :title="latestEvent.title"
        :excerpt="latestEvent.description"
        :imageUrl="getImageUrl(latestEvent.thumbnail)"
        :onClick="() => latestEvent && handleEventClick(latestEvent)"
      />

      <SignUpButtonWidget
        title="Sign Up for updates"
        placeholder="Enter your email"
        buttonLabel="Sign Up"
        backgroundColor="#F9F9F9"
      />
    </aside>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { BlogPost, Event } from "@/types/index.ts";

// Constants
const directusUrl = "https://content.thegovlab.com";
const router = useRouter();

// State
const postData = ref<BlogPost[]>([]);
const isLoading = ref(true);
const latestEvent = ref<Event | null>(null);
const isEventLoading = ref(true);
const dataFetchError = ref<string | null>(null);

// Category state
interface Category {
  id: string;
  name: string;
  count: number;
}
const tags = ref<Category[]>([]);
const isTagsLoading = ref(true);

// No need for filtered posts since we're just displaying categories

// Methods
function getImageUrl(image: any, width: number = 512): string {
  if (!image?.filename_disk) {
    return "/images/exampleImage.png";
  }

  // Construct URL with width parameter
  return `${directusUrl}/assets/${image.filename_disk}?width=${width}`;
}

const getAuthorName = (post: BlogPost): string => {
  if (post.authors?.[0]?.team_id) {
    const author = post.authors[0].team_id;
    return `${author.First_Name} ${author.Last_Name}`;
  }
  return "Unknown Author";
};

const getPostTag = (post: BlogPost): string => {
  return post.Tags?.[0] || "Blog";
};

const handleEventClick = (event: Event | null) => {
  if (!event?.link) {
    console.log("Event clicked, but no URL available");
    return;
  }
  window.open(event.link, "_blank");
};

const handleBtnClick = () => {
  router.push("/blog"); // Assuming there's a /blog route for all blogs
};

// Extract tags from blog posts
const extractTagsWithCounts = (posts: BlogPost[]) => {
  if (!posts || posts.length === 0) {
    return [];
  }

  // Create a map to count occurrences of each tag
  const tagCounts = new Map<string, number>();

  // Count occurrences of each tag across all posts
  posts.forEach((post) => {
    if (post.Tags && Array.isArray(post.Tags)) {
      post.Tags.forEach((tag) => {
        const count = tagCounts.get(tag) || 0;
        tagCounts.set(tag, count + 1);
      });
    }
  });

  // Convert the map to an array of tag objects
  const tagArray = Array.from(tagCounts.entries()).map(([name, count]) => ({
    id: name, // Using the tag name as the ID since we don't have separate IDs
    name,
    count,
  }));

  // Sort by count (descending)
  return tagArray.sort((a, b) => b.count - a.count);
};

// No filtering needed since we're just displaying categories

// Load all required data concurrently
const loadInitialData = async () => {
  try {
    isLoading.value = true;
    isEventLoading.value = true;
    isTagsLoading.value = true;

    // Fetch event and blog data in parallel
    const [eventData, blogData] = await Promise.all([
      fetchLatestPastEvent(),
      fetchBlogData(),
    ]);

    // Set event data
    latestEvent.value = Array.isArray(eventData)
      ? null
      : (eventData as Event | null);

    // Set blog data
    postData.value = blogData;
    console.log("Blogs loaded:", blogData);

    // Extract tags from blog posts
    tags.value = extractTagsWithCounts(blogData);
  } catch (error) {
    console.error("Error loading initial data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  } finally {
    isLoading.value = false;
    isEventLoading.value = false;
    isTagsLoading.value = false;
  }
};

onMounted(loadInitialData);
</script>

<style scoped>


.blog-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.btn-mid {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.loading,
.loading-tags {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.no-blogs {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.category-item {
  display: flex;
  align-items: center;
}

.category-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.category-checkbox input {
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .page-layout {
    flex-direction: column;
  }
}
</style>
