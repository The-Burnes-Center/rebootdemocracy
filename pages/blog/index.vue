<template>
  <div class="all-posts-page">
  <Hero
    title="Rebooting Democracy in the Age of AI"
    subtitle="Insights on AI, Governance and Democracy"
    firstPartnerLogo="/images/burnes-logo-blues-1.png"
    firstPartnerAlt="Burnes Center for Social Change"
    secondPartnerLogo="/images/the-govlab-logo-white.png"
    secondPartnerAlt="The GovLab"
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
    <article class="left-content">
      <div v-if="isLoading" class="loading">Loading blogs...</div>

      <!-- Show Clear Filter button when category is selected -->
      <div v-if="selectedCategory" class="filter-actions">
        <Button variant="secondary" size="small" @click="clearCategoryFilter">Clear Filter</Button>
      </div>

      <!-- Display filtered blogs when loaded -->
      <div v-if="!isLoading && displayedPosts.length > 0" class="blog-list">
        <PostCard
          v-for="(post, index) in displayedPosts"
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
      <div v-else-if="!isLoading" class="no-blogs">
        {{ selectedCategory ? `No posts found in category "${selectedCategory}"` : 'No blog posts found.' }}
      </div>
      
      <!-- Show More button appears when there are more posts to load -->
      <div v-if="!isLoading && hasMorePosts" class="btn-mid">
        <Button
          variant="primary"
          width="123px"
          height="36px"
          @click="loadMorePosts"
        >
          Show More
        </Button>
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
        Category
      </Text>

      <!-- Display list of categories with post counts -->
      <div v-if="isTagsLoading" class="loading-tags">Loading categories...</div>
      <div v-else class="category-list">
        <div 
          v-for="tag in tags" 
          :key="tag.id" 
          class="category-item"
          :class="{ 'category-item--active': selectedCategory === tag.name }"
          @click="selectCategory(tag.name)"
        >
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
</div>  
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { BlogPost, Event } from "@/types/index.ts";
import { useDirectusClient } from '~/composables/useDirectusClient';

// Constants
const directusUrl = "https://content.thegovlab.com";
const router = useRouter();
const POSTS_PER_PAGE = 7; // Number of posts to display initially and load more

// State
const allPosts = ref<BlogPost[]>([]); // All blog posts
const filteredPosts = ref<BlogPost[]>([]); // Posts filtered by current category
const displayedPosts = ref<BlogPost[]>([]); // Posts currently displayed
const isLoading = ref(true);
const latestEvent = ref<Event | null>(null);
const isEventLoading = ref(true);
const dataFetchError = ref<string | null>(null);
const selectedCategory = ref<string | null>(null);
const currentPage = ref(1);

// Category state
interface Category {
  id: string;
  name: string;
  count: number;
}
const tags = ref<Category[]>([]);
const isTagsLoading = ref(true);

// Computed property to check if there are more posts to load
const hasMorePosts = computed(() => {
  const currentSource = selectedCategory.value ? filteredPosts.value : allPosts.value;
  return displayedPosts.value.length < currentSource.length;
});

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
  router.push("/blog"); // Navigate to all blogs page
};

// Function to load more posts (pagination)
const loadMorePosts = () => {
  if (!hasMorePosts.value) return;
  
  currentPage.value++;
  const startIndex = (currentPage.value - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  
  // Get posts from either filtered list or all posts
  const sourceList = selectedCategory.value ? filteredPosts.value : allPosts.value;
  const newPosts = sourceList.slice(startIndex, endIndex);
  
  displayedPosts.value = [...displayedPosts.value, ...newPosts];
};

// Category selection handlers
const selectCategory = (category: string) => {
  selectedCategory.value = category;
  
  // Filter all posts by the selected category
  filteredPosts.value = allPosts.value.filter(post => 
    post.Tags && Array.isArray(post.Tags) && post.Tags.includes(category)
  );
  
  // Reset pagination and show first page of filtered posts
  currentPage.value = 1;
  displayedPosts.value = filteredPosts.value.slice(0, POSTS_PER_PAGE);
  
  // Optionally, scroll to top when changing categories
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const clearCategoryFilter = () => {
  selectedCategory.value = null;
  filteredPosts.value = [];
  
  // Reset to initial page of all posts
  currentPage.value = 1;
  displayedPosts.value = allPosts.value.slice(0, POSTS_PER_PAGE);
};

// Function to fetch all blog posts
const fetchAllBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const { directus, readItems } = useDirectusClient();
    
    const filter = {
      _and: [
        { status: { _eq: 'published' } },
        { date: { _lte: '$NOW(-5 hours)' } }
      ]
    };
    
    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: -1, // Get all posts, if API supports it
        sort: ['-date'], // Sort by date descending
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*'
        ],
        filter
      })
    );
    
    return response as BlogPost[];
  } catch (error) {
    console.error('Error fetching all blog posts:', error);
    return [];
  }
};

// Function to fetch all tags with their counts
const fetchAllTags = async (): Promise<Category[]> => {
  try {
    const blogPosts = await fetchAllBlogPosts();
    allPosts.value = blogPosts;
    
    // Set the initially displayed posts (first page)
    displayedPosts.value = blogPosts.slice(0, POSTS_PER_PAGE);
    
    // Extract all tags with their counts
    return extractTagsWithCounts(blogPosts);
  } catch (error) {
    console.error('Error fetching all tags:', error);
    return [];
  }
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

// Load all required data
const loadInitialData = async () => {
  try {
    isLoading.value = true;
    isEventLoading.value = true;
    isTagsLoading.value = true;

    // Fetch event data and all tags (which includes fetching all posts)
    const [eventData, allTags] = await Promise.all([
      fetchLatestPastEvent(),
      fetchAllTags()
    ]);

    // Set event data
    latestEvent.value = Array.isArray(eventData)
      ? null
      : (eventData as Event | null);
    
    // Set all tags from all blog posts
    tags.value = allTags;
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
.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.category-item {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.category-item:hover {
  background-color: #f5f5f5;
}

.category-item--active {
  background-color: #e6f0ff;
  font-weight: bold;
}

.loading-tags {
  padding: 1rem;
  text-align: center;
  color: #666;
}
</style>