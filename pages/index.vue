<template>
  <div class="home-page">
    <!-- HERO SECTION -->
    <Hero
      title="Rebooting Democracy in the Age of AI"
      subtitle="Insights on AI, Governance and Democracy"
    />

    <!-- SEARCH RESULTS -->
    <section class="home-section" v-if="showSearchResults" aria-label="Search Results">
      <div class="container">
        <GlobalSearch />
      </div>
    </section>

    <!-- MAIN CONTENT -->
    <main v-else>
      <!-- FEATURED POSTS SECTION -->
      <section class="home-section home-featured" aria-labelledby="featured-posts-heading">
        <div class="home-container">
          <!-- Screen reader only heading -->
          <h2 id="featured-posts-heading" class="sr-only">Featured and Recent Posts</h2>
          
          <div class="home-featured-wrapper">
            <!-- FEATURED POST -->
            <FeatureCard
              v-if="featuredPost"
              class="featured-column"
              :imageUrl="getImageUrl(featuredPost.image)"
              :tag="getTag(featuredPost)"
              :title="featuredPost.title || 'Untitled'"
              :description="featuredPost.one_line || featuredPost.excerpt"
              :date="featuredPost.date || ''"
              :author="getAuthorName(featuredPost)"
              :aria-label="`Featured post: ${featuredPost.title || 'Untitled'} by ${getAuthorName(featuredPost)}`"
              @click="navigateToBlogPost(featuredPost)"
              @keydown="handleKeyboardNavigation($event, () => navigateToBlogPost(featuredPost))"
            />

            <!-- RECENT POSTS -->
            <div class="postcards-column" role="list" aria-label="Recent posts">
              <PostCard
                v-for="(item, index) in latestThreePosts"
                :key="`post-${index}`"
                :tag="getTag(item)"
                :titleText="item.title"
                :excerpt="item.excerpt || ''"
                :imageUrl="getImageUrl(item.image)"
                :author="getAuthorName(item)"
                :date="item.date"
                :isFeatured="false"
                :hoverable="true"
                role="listitem"
                :aria-label="`Post: ${item.title} by ${getAuthorName(item)}, published ${formatDate(item.date)}`"
                @click="navigateToBlogPost(item)"
                @keydown="handleKeyboardNavigation($event, () => navigateToBlogPost(item))"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- SUBSCRIPTION SECTION (Full Width) -->
      <section class="home-section home-subscription" aria-labelledby="subscription-heading">
        <div class="container">
          <div class="subscription-content-wrapper">
            <div class="subscription-text">
              <Text
                as="h2"
                id="subscription-heading"
                size="4xl"
                weight="bold"
                color="text-primary-light"
                fontFamily="sora"
                lineHeight="extra-loose"
                class="subscription-title"
              >
                Subscribe for Updates
              </Text>
              <Text
                as="p"
                weight="normal"
                color="text-primary-light"
                fontFamily="habibi"
                lineHeight="normal"
                class="subscription-description"
              >
                A weekly curation of new findings and developments on innovation
                in governance
              </Text>
            </div>
            <Button
              class="btn-header"
              variant="secondary"
              height="50px"
              :onClick="onClick"
              aria-label="Sign up for weekly updates about democracy and governance"
            >
              Sign up for updates
            </Button>
          </div>
        </div>
      </section>

      <!-- BLOG POSTS SECTION -->
      <section class="home-section home-blog" aria-labelledby="blog-posts-heading">
        <div class="container">
          <!-- Screen reader only heading -->
          <h2 id="blog-posts-heading" class="sr-only">Blog Posts and News</h2>
          
          <TabSwitch
            :tabs="tabOptions"
            :tagOptions="tagOptions"
            :authorOptions="authorOptions"
            :selectedTag="selectedTag"
            :selectedAuthor="selectedAuthor"
            @tab-changed="handleTabChange"
            @tag-filter="handleTagFilter"
            @author-filter="handleAuthorFilter"
          >
            <template #latest-posts>
              <div
                v-if="!isLoading && displayPosts.length"
                class="blog-posts-section"
                role="region"
                aria-label="Posts and news"
              >
                <div class="blog-card-grid" role="list">
                  <article
                    v-for="(post, index) in displayPosts.slice(0, 9)"
                    :key="post.id || `post-${index}`"
                    class="custom-card"
                    role="listitem"
                    tabindex="0"
                    @click="handlePostClick(post)"
                    @keydown="handleKeyboardNavigation($event, () => handlePostClick(post))"
                    :aria-label="`${post.type === 'news' ? 'News item' : 'Blog post'}: ${post.title} by ${getAuthorName(post)}, published ${formatDate(post.date)}`"
                  >
                    <div class="card-image" :style="{ '--bg-image': `url(${getImageUrl(post.image)})` }">
                      <img 
                        :src="getImageUrl(post.image)" 
                        :alt="`Featured image for ${post.title}`"
                        loading="lazy"
                      />
                    </div>
                    <div class="card-content">
                      <Text
                        v-if="getTag(post)"
                        as="span"
                        size="xs"
                        weight="bold"
                        transform="uppercase"
                        fontFamily="sora"
                        class="featured-card__tag"
                        :color="'tag-primary'"
                        role="text"
                        :aria-label="`Category: ${getTag(post)}`"
                      >
                        {{ getTag(post) }}
                      </Text>
                      <Text
                        as="h3"
                        size="xl"
                        weight="bold"
                        fontFamily="sora"
                        lineHeight="relaxed"
                        class="card-title"
                      >
                        {{ post.title }}
                      </Text>
                      <Text
                        as="p"
                        size="base"
                        weight="medium"
                        color="text-primary"
                        class="card-description"
                        fontFamily="habibi"
                        lineHeight="normal"
                      >
                        {{ post.excerpt }}
                      </Text>
                      <Text
                        as="span"
                        size="xs"
                        fontStyle="italic"
                        weight="bold"
                        fontFamily="habibi"
                        class="card-meta"
                        v-if="post.date"
                        role="text"
                        :aria-label="`Published on ${formatDate(post.date)} by ${getAuthorName(post)}`"
                      >
                        Published on
                        <Text
                          as="span"
                          size="xs"
                          weight="bold"
                          fontStyle="italic"
                          fontFamily="sora"
                        >
                          {{ formatDate(post.date) }}
                        </Text>
                        <template
                          v-if="getAuthorName(post) !== 'Reboot Democracy Team'"
                        >
                          by
                          <Text
                            as="span"
                            size="xs"
                            weight="bold"
                            fontStyle="italic"
                            fontFamily="sora"
                          >
                            {{ getAuthorName(post) }}
                          </Text>
                        </template>
                      </Text>
                    </div>
                  </article>
                </div>
                <div class="view-all-container">
                  <button
                    class="base__button base__button--secondary"
                    @click="navigateToAllPosts"
                    @keydown="handleKeyboardNavigation($event, navigateToAllPosts)"
                    aria-label="View all posts"
                  >
                    <span class="base__btn-slot">View All Posts</span>
                  </button>
                </div>
              </div>

              <!-- Loading state with proper accessibility -->
              <div 
                v-else-if="isLoading" 
                class="loading-state"
                role="status"
                aria-live="polite"
                aria-label="Loading posts"
              >
                <div class="loading-spinner" aria-hidden="true"></div>
                <span class="sr-only">Loading posts, please wait</span>
              </div>

              <!-- Empty state -->
              <div 
                v-else 
                class="empty-state"
                role="status"
                aria-live="polite"
              >
                <p>No posts available at this time.</p>
              </div>
            </template>
          </TabSwitch>
        </div>
      </section>

      <!-- COLLABORATORS SECTION -->
      <section v-if="false" class="home-section home-collaborators" aria-labelledby="collaborators-heading">
        <div class="blog-collab-container">
          <!-- BLOG COLLABORATORS HEADING -->
          <div class="curator-and-button">
            <Text
              as="h3"
              id="collaborators-heading"
              size="2xl"
              weight="bold"
              fontFamily="sora"
              lineHeight="extra-loose"
              color="text-dark"
              class="new-blog-collab"
            >
              Blog Collaborators
            </Text>
            <button
              class="base__button base__button--secondary"
              @click="router.push('/about#team-editorial-section')"
              @keydown="handleKeyboardNavigation($event, () => router.push('/about#team-editorial-section'))"
              aria-label="Learn more about our team members"
            >
              <span class="base__btn-slot">Meet Our Team</span>
            </button>
          </div>

          <!-- BLOG COLLABORATORS -->
          <div class="blog-collaborators-wrapper">
            <div class="collaborators-flex-grid" role="region" aria-label="Featured curator">
              <CuratorBadge
                name="Beth Simone Noveck"
                title="Director at Burnes Center and the Govlab"
                imageUrl="/images/Beth_Simone_Noveck.png"
              />
            </div>
            <div class="collaborators-fixed-grid" role="list" aria-label="Blog collaborators">
              <AuthorBadge
                v-for="author in flattenedCollaborators"
                :key="author.name"
                v-bind="author"
                role="listitem"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { format } from "date-fns";
import type { BlogPost } from "@/types/index.ts";
import { fetchAllBlogPosts } from "~/composables/fetchBlogData";
import { fetchWeeklyNewsItems } from "~/composables/fetchWeeklyNews";
import { 
  fetchPostsByAuthor, 
  getAuthorName as getAuthorNameUtil,
  getAllAuthors 
} from "~/composables/useAuthorPosts";

const router = useRouter();
const { resetSearch, showSearchResults } = useSearchState();

useHead({
  title: 'Reboot Democracy - AI for Participatory Democracy',
  meta: [
    { 
      name: 'description', 
      content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to better governance, better outcomes, increased trust in institutions, and in one another. As researchers we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` 
    },
    { property: 'og:title', content: 'Reboot Democracy - AI for Participatory Democracy' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://rebootdemocracy.ai' },
    { 
      property: 'og:description', 
      content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to better governance, better outcomes, increased trust in institutions, and in one another. As researchers we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` 
    },
    { property: 'og:image', content: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3?width=1200&height=630&fit=cover&format=jpg' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:title', content: 'RebootDemocracy.AI' },
    { 
      name: 'twitter:description', 
      content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to better governance, better outcomes, increased trust in institutions, and in one another. As researchers we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` 
    },
    { name: 'twitter:image', content: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3?width=1200&height=630&fit=cover&format=jpg' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ],
});

// State
const selectedTag = ref("All Topics");
const selectedAuthor = ref("All Authors");
const displayPosts = ref<any[]>([]);
const isLoadingState = ref(false);

const DIRECTUS_URL = "https://burnes-center.directus.app/";

// Data fetching
const { data: latestCombinedPosts } = await useAsyncData(
  "latest-combined-posts",
  fetchLatestCombinedPosts
);

const { data: allBlogPosts } = await useAsyncData("homepage-blogs", () =>
  fetchBlogData()
);

const { data: allTags } = await useAsyncData(
  "homepage-tags",
  fetchAllUniqueTags
);

const { data: authorListData } = await useAsyncData(
  "homepage-author-list",
  getAllAuthors
);

const { data: featuredContributors } = await useAsyncData(
  "featured-contributors",
  fetchFeaturedContributors
);

// Computed properties
const featuredPost = computed(() => latestCombinedPosts.value?.[0] || null);
const latestThreePosts = computed(
  () => latestCombinedPosts.value?.slice(1, 4) || []
);
const tagOptions = computed(() => ["All Topics", ...(allTags.value || [])]);
const authorOptions = computed(() => [
  "All Authors",
  ...(authorListData.value || []),
]);
const isLoading = computed(() => isLoadingState.value);

const tabOptions = computed(() => [
  { title: "Latest Posts", name: "latest-posts" },
  {
    title: "News That Caught Our Eye",
    name: "latest-posts", // Use the same template as Latest Posts
  },
  { title: "Events", name: "events", url: "/events", external: true },
]);

const flattenedCollaborators = computed(
  () =>
    featuredContributors.value?.map((member) => ({
      name: `${member.First_Name} ${member.Last_Name}`,
      title: member.Title,
      imageUrl: member.Headshot?.id
        ? `https://burnes-center.directus.app/assets/${member.Headshot.id}`
        : "/images/fallbackperson.png",
    })) || []
);

// Accessibility: Keyboard navigation handler
function handleKeyboardNavigation(event: KeyboardEvent, callback: () => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
}

// Utility functions
function formatDate(dateValue: Date | string): string {
  try {
    return format(new Date(dateValue), "MMMM d, yyyy");
  } catch {
    return "";
  }
}

function getImageUrl(image: any): string {
  if (!image?.id) return "/images/exampleImage.png";
  return `${DIRECTUS_URL}assets/${image.id}?width=800`;
}

function getTag(item: any): string {
  // If a specific tag is selected and the item contains that tag, show it
  if (selectedTag.value !== "All Topics" && item.Tags?.includes(selectedTag.value)) {
    return selectedTag.value;
  }
  
  // Otherwise fall back to the original logic
  if (item.Tags?.[0]) return item.Tags[0];
  if (item.category) return item.category;
  if (item.type === "news") return "News That Caught Our Eye";
  return "";
}

// Use the utility function from the composable
function getAuthorName(post: any): string {
  return getAuthorNameUtil(post);
}



// Navigation functions
function navigateToBlogPost(post: any): void {
  try {
    if (post.type === "blog" || (!post.type && post.slug)) {
      if (post.slug) {
        router.push(`/blog/${post.slug}`);
        return;
      }
    }

    if (post.type === "news" || post.edition) {
      const edition = String(post.edition || post.id || "").replace(/\D/g, "");
      if (edition) {
        router.push(`/newsthatcaughtoureye/${edition}`);
        return;
      }
    }

    if (post.url) {
      router.push(post.url);
      return;
    }

    if (post.slug || post.id) {
      router.push(`/blog/${post.slug || post.id}`);
      return;
    }

    console.error("Unable to determine navigation path for post:", post);
  } catch (error) {
    console.error("Navigation error:", error, post);
  }
}

function handlePostClick(post: any): void {
  navigateToBlogPost(post);
}

function navigateToAllPosts(): void {
  const query: Record<string, string> = {};

  if (selectedTag.value !== "All Topics") {
    query.category = encodeURIComponent(selectedTag.value);
  }
  if (selectedAuthor.value !== "All Authors") {
    query.author = encodeURIComponent(selectedAuthor.value);
  }

 router.push({ path: "/blog", query }).then(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}

async function handleTabChange(index: number, name: string): Promise<void> {
  resetSearch();
  
  if (index === 1) {
    selectedTag.value = "News That Caught Our Eye";
    selectedAuthor.value = "All Authors"; // Reset author filter
    await applyFilters();
  } else if (index === 0) {
    selectedTag.value = "All Topics";
    selectedAuthor.value = "All Authors";
    await applyFilters();
  }
}

const onClick = (): void => {
  router.push("/signup");
};

async function applyFilters(): Promise<void> {
  isLoadingState.value = true;

  try {
    let filteredPosts: any[] = [];

    if (selectedAuthor.value !== "All Authors") {
      const authorPosts = await fetchPostsByAuthor(selectedAuthor.value);

      if (selectedTag.value !== "All Topics") {
        filteredPosts = authorPosts.filter((post) => {
          if (post.type === 'blog') {
            return post.Tags?.includes(selectedTag.value);
          } else if (post.type === 'news') {
            if (selectedTag.value === "News That Caught Our Eye") {
              return true;
            }
            return post.category === selectedTag.value || 
                   post.Tags?.includes(selectedTag.value);
          }
          return false;
        });
      } else {
        filteredPosts = authorPosts;
      }
    } else if (selectedTag.value !== "All Topics") {
      const [blogs, newsItems] = await Promise.all([
        fetchAllBlogPosts(),
        fetchWeeklyNewsItems(),
      ]);

      const filteredBlogs = blogs.filter((post) =>
        post.Tags?.includes(selectedTag.value)
      );

      const filteredNews = newsItems
        .filter((n) => {
                      if (selectedTag.value === "News That Caught Our Eye") {
              return true;
            }
          return n.category === selectedTag.value;
        })
        .map((n) => ({
          ...n,
          id: n.id || `news-${Date.now()}`,
          Tags: n.category ? [n.category] : ["News That Caught Our Eye"],
        }));

      // Combine blogs and news
      filteredPosts = [...filteredBlogs, ...filteredNews];
    } else {
      const [blogs, newsItems] = await Promise.all([
        allBlogPosts.value || [],
        fetchWeeklyNewsItems(),
      ]);
      
      const formattedNews = newsItems.map((n) => ({
        ...n,
        id: n.id || `news-${Date.now()}`,
        Tags: n.category ? [n.category] : ["News That Caught Our Eye"],
      }));

      filteredPosts = [...blogs, ...formattedNews];
    }

    // Sort by date
    filteredPosts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    displayPosts.value = filteredPosts.slice(0, 20);
  } catch (error) {
    console.error("Error filtering posts:", error);
    displayPosts.value = [];
  } finally {
    isLoadingState.value = false;
  }
}

async function handleTagFilter(tag: string): Promise<void> {
  selectedTag.value = tag;
  await applyFilters();
}

async function handleAuthorFilter(author: string): Promise<void> {
  selectedAuthor.value = author;
  await applyFilters();
}

// Initialize
onMounted(async () => {
  resetSearch();
  
  // Load all posts (blogs + news) together
  try {
    const [blogs, newsItems] = await Promise.all([
      allBlogPosts.value || [],
      fetchWeeklyNewsItems(),
    ]);
    
    const formattedNews = newsItems.map((n) => ({
      ...n,
      id: n.id || `news-${Date.now()}`,
      Tags: n.category ? [n.category] : ["News That Caught Our Eye"],
    }));

    // Combine and sort by date
    const allPosts = [...blogs, ...formattedNews];
    allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    displayPosts.value = allPosts;
  } catch (error) {
    console.error("Error loading posts:", error);
    displayPosts.value = allBlogPosts.value || [];
  }
});
</script>

<style>
.blog-collab-container {
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus styles for keyboard navigation */
.custom-card:focus,
button:focus,
[tabindex="0"]:focus {
  outline: 1px solid grey;
  outline-offset: 2px;
}

/* Loading state styles */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #f3f4f6;
  border-top: 1px solid gray;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty state styles */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

/* Enhanced hover and focus states */
.custom-card:hover,
.custom-card:focus-within {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
}

/* Skip link for keyboard users */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: grey;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
  border-radius: 4px;
}

.skip-link:focus {
  top: 6px;
}
</style>