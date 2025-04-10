<template>
  <div class="all-posts-page">
    <Hero
      title="Rebooting Democracy in the Age of AI"
      subtitle="Insights on AI, Governance and Democracy"
    />

    <div class="curator-badge-overlay">
      <CuratorBadge
        name="Beth Simone Noveck"
        title="Director at Burnes Center and the Govlab"
        imageUrl="/images/Beth_Simone_Noveck.png"
        moreText="More incredible things Beth done in in her"
      />
    </div>

    <section class="page-layout">
      <!-- Main content -->
      <article class="left-content" :class="{ 'search-active': showSearchResults }">
        <GlobalSearch v-if="showSearchResults" />

        <template v-else>
          <!-- Loading state -->
          <div v-if="isLoading" class="loading">
            <div class="loading-spinner"></div>
            <div>Loading blogs...</div>
          </div>

          <!-- Blog list -->
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

          <!-- No blogs found -->
          <div v-else class="no-blogs">No blog posts found.</div>

          <!-- View All button -->
          <div class="btn-mid" v-if="allBlogsLoaded">
            <Button
              variant="primary"
              width="123px"
              height="36px"
              @click="handleBtnClick"
            >
              View All
            </Button>
          </div>
        </template>
      </article>

      <!-- Sidebar -->
      <aside class="right-content">
        <Text
          as="h2"
          fontFamily="inter"
          size="lg"
          color="text-primary"
          weight="bold"
          align="left"
        >
          Category
        </Text>

        <!-- Categories -->
        <div v-if="isTagsLoading" class="loading-tags">
          Loading categories...
        </div>
        <div v-else class="category-list">
          <div v-for="tag in tags" :key="tag.id" class="category-item">
            <ListCategory :title="tag.name" :number="tag.count" />
          </div>
        </div>

        <!-- Event Card -->
        <div v-if="isEventLoading" class="loading">Loading event...</div>
        <UpcomingCard
          v-if="latestEvent"
          :title="latestEvent.title"
          :excerpt="latestEvent.description"
          :imageUrl="getImageUrl(latestEvent.thumbnail)"
          :onClick="() => handleEventClick(latestEvent)"
          :buttonLabel="isFutureEvent ? 'Register' : 'Watch'"
          :cardTitle="isFutureEvent ? 'Upcoming Event' : 'Featured Event'"
        />

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

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { BlogPost, Event } from "@/types/index.ts";
import { fetchUpcomingEvent } from "~/composables/fetchLatestPastEvent";

// Constants
const directusUrl = "https://content.thegovlab.com";
const router = useRouter();
const { showSearchResults } = useSearchState();


// State
const postData = ref<BlogPost[]>([]);
const isLoading = ref(true);
const latestEvent = ref<Event | null>(null);
const isEventLoading = ref(true);
const isFutureEvent = ref(true);
const allBlogsLoaded = ref(false);

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

function getAuthorName(post: BlogPost): string {
  const author = post.authors?.[0]?.team_id;
  return author ? `${author.First_Name} ${author.Last_Name}` : "Unknown Author";
}

function getPostTag(post: BlogPost): string {
  return post.Tags?.[0] || "Blog";
}

function handleEventClick(event: Event | null) {
  if (!event?.link) return;
  window.open(event.link, "_blank");
}

function handleBtnClick() {
  router.push("/blog");
}

<<<<<<< Updated upstream
=======
const fetchAllTags = async (): Promise<Category[]> => {
  try {
    isTagsLoading.value = true;
    const { directus, readItems } = useDirectusClient();
    
    // Fetch all published posts to get their tags
    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: -1, // Get all posts, if API supports it
        fields: ['Tags'], // Only fetch the Tags field
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _lte: '$NOW(-5 hours)' } }
          ]
        }
      })
    );
    
    // Extract all tags with their counts
    const blogPosts = response as BlogPost[];
    return extractTagsWithCounts(blogPosts);
  } catch (error) {
    console.error('Error fetching all tags:', error);
    return [];
  } finally {
    isTagsLoading.value = false;
  }
};

// Extract tags from blog posts
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream

// Data loading
async function loadAllBlogs() {
=======
const loadInitialData = async () => {
>>>>>>> Stashed changes
  try {
    isLoading.value = true;
    const featured = await fetchFeaturedBlog();
    const allBlogs = await fetchBlogData();

<<<<<<< Updated upstream
    const remainingBlogs = featured
      ? allBlogs.filter((blog) => blog.id !== featured.id)
      : allBlogs;
=======
    // Run these requests in parallel
    const [eventData, blogData, allTags] = await Promise.all([
      fetchLatestPastEvent(),
      fetchBlogData(),
      fetchAllTags() // New function to get all tags
    ]);
>>>>>>> Stashed changes

    postData.value = featured ? [featured, ...remainingBlogs] : remainingBlogs;
    allBlogsLoaded.value = true;

<<<<<<< Updated upstream
    tags.value = extractTagsWithCounts(postData.value);
=======
    // Set blog data for display
    postData.value = blogData;
    
    // Set tags from ALL blog posts, not just current page
    tags.value = allTags;
>>>>>>> Stashed changes
  } catch (error) {
    console.error("Failed to load blogs:", error);
    postData.value = [];
    tags.value = [];
  } finally {
    isLoading.value = false;
<<<<<<< Updated upstream
    isTagsLoading.value = false; 
=======
    isEventLoading.value = false;
    // Note: isTagsLoading is already set to false in fetchAllTags
>>>>>>> Stashed changes
  }
}


async function loadEventData() {
  try {
    let event = await fetchUpcomingEvent();
    if (event) {
      isFutureEvent.value = true;
      latestEvent.value = event;
    } else {
      event = await fetchLatestPastEvent();
      isFutureEvent.value = false;
      latestEvent.value = event;
    }
  } catch (error) {
    console.error("Failed to load event:", error);
  } finally {
    isEventLoading.value = false;
  }
}

onMounted(async () => {
  await loadAllBlogs();
  await loadEventData();
});
</script>
