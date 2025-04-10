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

      <!-- Results counter and filter controls in a fixed-height container -->
      <div class="results-and-filter">
        <div class="results-count">
          <Text 
            as="span" 
            fontFamily="inter" 
            size="base" 
            color="text-primary" 
            weight="medium"
          >
            Showing {{ displayedPosts.length }} of {{ filteredPosts.length }} results
            <template v-if="selectedCategory">
              in category "{{ selectedCategory }}"
            </template>
            <template v-if="selectedAuthor">
              by author "{{ selectedAuthor }}"
            </template>
          </Text>
        </div>
        
        <div v-if="selectedCategory || selectedAuthor" class="filter-actions">
          <Button variant="secondary" size="small" @click="clearFilters">Clear Filter</Button>
        </div>
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
        <span v-if="selectedCategory">No posts found in category "{{ selectedCategory }}"</span>
        <span v-else-if="selectedAuthor">No posts found by author "{{ selectedAuthor }}"</span>
        <span v-else>No blog posts found.</span>
      </div>
      
      <!-- Show More button appears when there are more posts to load -->
      <div v-if="!isLoading && hasMorePosts" class="btn-mid">
        <Button
          variant="primary"
          width="140px"
          height="36px"
          @click="loadMorePosts"
        >
          Show More
        </Button>
      </div>
    </article>

    <aside class="right-content">
      <!-- Categories section -->
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

      <!-- Authors section -->
      <Text
        as="h2"
        fontFamily="inter"
        size="lg"
        color="text-primary"
        weight="bold"
        align="left"
        class="section-title"
      >
        Authors
      </Text>

      <!-- Display list of authors with post counts -->
      <div v-if="isAuthorsLoading" class="loading-tags">Loading authors...</div>
      <div v-else class="author-list">
        <div 
          v-for="author in filteredAuthors" 
          :key="author.id" 
          class="author-item"
          :class="{ 'author-item--active': selectedAuthor === author.name }"
          @click="selectAuthor(author.name)"
        >
          <ListCategory :title="author.name" :number="author.count" />
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
const filteredPosts = ref<BlogPost[]>([]); // Posts filtered by current category or author
const displayedPosts = ref<BlogPost[]>([]); // Posts currently displayed
const isLoading = ref(true);
const latestEvent = ref<Event | null>(null);
const isEventLoading = ref(true);
const dataFetchError = ref<string | null>(null);
const selectedCategory = ref<string | null>(null);
const selectedAuthor = ref<string | null>(null);
const currentPage = ref(1);

// Category state
interface Category {
  id: string;
  name: string;
  count: number;
}

// Author state
interface Author {
  id: string;
  name: string;
  count: number;
}

const tags = ref<Category[]>([]);
const authors = ref<Author[]>([]);
const isTagsLoading = ref(true);
const isAuthorsLoading = ref(true);

// Computed property to check if there are more posts to load
const hasMorePosts = computed(() => {
  return displayedPosts.value.length < filteredPosts.value.length;
});

// Computed property to filter authors with more than 1 post
const filteredAuthors = computed(() => {
  return authors.value.filter(author => author.count > 1);
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
  router.push("/blog");
};

// Function to load more posts (pagination)
const loadMorePosts = () => {
  if (!hasMorePosts.value) return;
  
  currentPage.value++;
  const startIndex = (currentPage.value - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  
  const newPosts = filteredPosts.value.slice(startIndex, endIndex);
  displayedPosts.value = [...displayedPosts.value, ...newPosts];
};

// Update the filtered posts based on current filters
const updateFilteredPosts = () => {
  let filtered = allPosts.value;
  
  // Apply category filter if selected
  if (selectedCategory.value) {
    filtered = filtered.filter(post => 
      post.Tags && Array.isArray(post.Tags) && post.Tags.includes(selectedCategory.value)
    );
  }
  
  // Apply author filter if selected
  if (selectedAuthor.value) {
    filtered = filtered.filter(post => {
      const authorName = getAuthorName(post);
      return authorName === selectedAuthor.value;
    });
  }
  
  filteredPosts.value = filtered;
  
  // Reset pagination and show first page of filtered posts
  currentPage.value = 1;
  displayedPosts.value = filteredPosts.value.slice(0, POSTS_PER_PAGE);
};

// Category selection handlers
const selectCategory = (category: string) => {
  // Clear other filters
  selectedAuthor.value = null;
  
  // Set new category
  selectedCategory.value = category;
  
  // Update displayed posts
  updateFilteredPosts();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Author selection handlers
const selectAuthor = (author: string) => {
  // Clear other filters
  selectedCategory.value = null;
  
  // Set new author
  selectedAuthor.value = author;
  
  // Update displayed posts
  updateFilteredPosts();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Clear all filters
const clearFilters = () => {
  selectedCategory.value = null;
  selectedAuthor.value = null;
  
  // Reset filtered posts to all posts
  filteredPosts.value = allPosts.value;
  
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
        limit: -1, // Get all posts
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

// Extract authors from blog posts
const extractAuthorsWithCounts = (posts: BlogPost[]) => {
  if (!posts || posts.length === 0) {
    return [];
  }

  // Create a map to count occurrences of each author
  const authorCounts = new Map<string, number>();

  // Count occurrences of each author across all posts
  posts.forEach((post) => {
    const authorName = getAuthorName(post);
    if (authorName !== "Unknown Author") {
      const count = authorCounts.get(authorName) || 0;
      authorCounts.set(authorName, count + 1);
    }
  });

  // Convert the map to an array of author objects
  const authorArray = Array.from(authorCounts.entries()).map(([name, count]) => ({
    id: name, // Using the author name as the ID
    name,
    count,
  }));

  // Sort alphabetically by author name
  return authorArray.sort((a, b) => a.name.localeCompare(b.name));
};

// Function to fetch all data
const fetchAllData = async () => {
  try {
    isLoading.value = true;
    isTagsLoading.value = true;
    isAuthorsLoading.value = true;
    
    // Fetch all blog posts
    const blogPosts = await fetchAllBlogPosts();
    
    // Store all blog posts
    allPosts.value = blogPosts;
    filteredPosts.value = blogPosts;
    
    // Set the initially displayed posts (first page)
    displayedPosts.value = blogPosts.slice(0, POSTS_PER_PAGE);
    
    // Extract tags and authors
    tags.value = extractTagsWithCounts(blogPosts);
    authors.value = extractAuthorsWithCounts(blogPosts);
    
    return {
      posts: blogPosts,
      tags: tags.value,
      authors: authors.value
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      posts: [],
      tags: [],
      authors: []
    };
  } finally {
    isLoading.value = false;
    isTagsLoading.value = false;
    isAuthorsLoading.value = false;
  }
};

// Load all required data
const loadInitialData = async () => {
  try {
    isEventLoading.value = true;

    // Fetch event data and all blog data in parallel
    const [eventData, blogData] = await Promise.all([
      fetchLatestPastEvent(),
      fetchAllData()
    ]);

    // Set event data
    latestEvent.value = Array.isArray(eventData)
      ? null
      : (eventData as Event | null);
  } catch (error) {
    console.error("Error loading initial data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  } finally {
    isEventLoading.value = false;
  }
};

onMounted(loadInitialData);
</script>

<style scoped>
.results-and-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  min-height: 36px; /* Fixed height to prevent content jumping */
}

.results-count {
  flex: 1;
}

.filter-actions {
  flex-shrink: 0;
}

.section-title {
  margin-top: 2rem;
  margin-bottom: 0.5rem;
}

.category-list, .author-list {
  margin-bottom: 1.5rem;
}

.category-item, .author-item {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.category-item:hover, .author-item:hover {
  background-color: #f5f5f5;
}

.category-item--active, .author-item--active {
  background-color: #e6f0ff;
  font-weight: bold;
}

.loading-tags {
  padding: 1rem;
  text-align: center;
  color: #666;
}
</style>