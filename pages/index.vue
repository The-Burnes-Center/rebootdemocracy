<template>
  <div class="home-page">
    <!-- HERO SECTION -->
    <Hero
      title="Rebooting Democracy in the Age of AI"
      subtitle="Insights on AI, Governance and Democracy"
    />

    <!-- SEARCH RESULTS -->
    <section class="home-section" v-if="showSearchResults">
      <div class="container">
        <GlobalSearch />
      </div>
    </section>

    <!-- MAIN CONTENT -->
    <template v-else>
      <!-- FEATURED POSTS SECTION -->
      <section class="home-section home-featured">
        <div class="home-container">
          <div class="home-featured-wrapper">
            <!-- FEATURED POST -->
            <FeatureCard
              v-if="featuredPost"
              class="featured-column"
              :imageUrl="getImageUrl(featuredPost.image)"
              :tag="getTag(featuredPost)"
              :title="featuredPost.title || 'Untitled'"
              :description="featuredPost.excerpt || ''"
              :date="featuredPost.date || ''"
              :author="getAuthorName(featuredPost)"
              @click="navigateToBlogPost(featuredPost)"
            />

            <!-- RECENT POSTS -->
            <div class="postcards-column">
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
                @click="navigateToBlogPost(item)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- SUBSCRIPTION SECTION (Full Width) -->
      <section class="home-section home-subscription">
        <div class="container">
          <div class="subscription-content-wrapper">
            <div class="subscription-text">
              <Text
                as="h2"
                size="4xl"
                weight="bold"
                color="text-primary-light"
                fontFamily="inria"
                lineHeight="loose"
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
            >
              Sign up for updates
            </Button>
          </div>
        </div>
      </section>

      <!-- BLOG POSTS SECTION -->
      <section class="home-section home-blog">
        <div class="container">
          <TabSwitch
            :tabs="tabOptions"
            :tagOptions="tagOptions"
            :authorOptions="authorOptions"
            :selectedTag="selectedTag"
            @tab-changed="handleTabChange"
            @tag-filter="handleTagFilter"
            @author-filter="handleAuthorFilter"
          >
            <template #latest-posts>
              <div
                v-if="!isLoading && displayPosts.length"
                class="blog-posts-section"
              >
                <div class="blog-card-grid">
                  <div
                    v-for="(post, index) in displayPosts.slice(0, 9)"
                    :key="post.id || `post-${index}`"
                    class="custom-card"
                    @click="handlePostClick(post)"
                    style="cursor: pointer"
                  >
                    <div class="card-image">
                      <img :src="getImageUrl(post.image)" :alt="post.title" />
                    </div>
                    <div class="card-content">
                      <Text
                        as="span"
                        size="xs"
                        weight="bold"
                        transform="uppercase"
                        fontFamily="inria"
                        class="featured-card__tag"
                        :color="'tag-primary'"
                      >
                        {{ getTag(post) }}
                      </Text>
                      <Text
                        as="h3"
                        size="xl"
                        weight="bold"
                        fontFamily="inria"
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
                  </div>
                </div>
                <div class="view-all-container">
                  <button
                    class="base__button base__button--secondary"
                    @click="navigateToAllPosts"
                  >
                    <span class="base__btn-slot">View All Posts</span>
                  </button>
                </div>
              </div>
            </template>
          </TabSwitch>
        </div>
      </section>

      <!-- COLLABORATORS SECTION -->
      <section class="home-section home-collaborators">
        <div class="blog-collab-container">
          <!-- BLOG COLLABORATORS HEADING -->
          <div class="curator-and-button">
            <Text
              as="h3"
              size="2xl"
              weight="bold"
              fontFamily="inria"
              lineHeight="extra-loose"
              color="text-dark"
              class="new-blog-collab"
            >
              Blog Collaborators
            </Text>
            <button
              class="base__button base__button--secondary"
              @click="router.push('/about#team-grid')"
            >
              <span class="base__btn-slot">Meet Our Team</span>
            </button>
          </div>

          <!-- BLOG COLLABORATORS -->
          <div class="blog-collaborators-wrapper">
            <div class="collaborators-flex-grid">
              <CuratorBadge
                name="Beth Simone Noveck"
                title="Director at Burnes Center and the Govlab"
                imageUrl="/images/Beth_Simone_Noveck.png"
              />
            </div>
            <div class="collaborators-fixed-grid">
              <AuthorBadge
                v-for="author in flattenedCollaborators"
                :key="author.name"
                v-bind="author"
              />
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { format } from "date-fns";
import type { BlogPost } from "@/types/index.ts";
import { fetchAllBlogPosts } from "~/composables/fetchBlogData";
import { fetchWeeklyNewsItems } from "~/composables/fetchWeeklyNews";

const router = useRouter();
const { resetSearch, showSearchResults } = useSearchState();

// State
const selectedTag = ref("All Topics");
const selectedAuthor = ref("All Authors");
const displayPosts = ref<BlogPost[]>([]);
const isLoadingState = ref(false);
const authorPostsCache = ref<Map<string, BlogPost[]>>(new Map());

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
  async () => {
    try {
      const allPosts = await fetchAllBlogPosts();
      const authorCounts = new Map<string, number>();

      allPosts.forEach((post) => {
        const authorName = getAuthorName(post);
        if (
          authorName !== "Unknown Author" &&
          authorName !== "Reboot Democracy Team"
        ) {
          authorCounts.set(authorName, (authorCounts.get(authorName) || 0) + 1);
        }
      });

      return Array.from(authorCounts.keys()).sort();
    } catch (error) {
      console.error("Error fetching author list:", error);
      return [];
    }
  }
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

const weeklyNewsUrl = computed(() => {
  const newsItems =
    latestCombinedPosts.value?.filter((post) => post.type === "news") || [];
  const latestNews = newsItems.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  if (latestNews?.edition) {
    const cleanEdition = String(latestNews.edition).replace(/\D/g, "");
    return `/newsthatcaughtoureye/${cleanEdition}`;
  }

  return `/newsthatcaughtoureye/51`;
});

const tabOptions = computed(() => [
  { title: "Latest Posts", name: "latest-posts" },
  {
    title: "News that caught our eye",
    name: "news",
    url: weeklyNewsUrl.value,
    external: true,
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
  if (item.Tags?.[0]) return item.Tags[0];
  if (item.category) return item.category;
  if (item.type === "news") return "News that caught our eye";
  return "Blog";
}

function getAuthorName(post: any): string {
  // Handle blog posts with authors array
  if (post.authors && Array.isArray(post.authors) && post.authors.length > 0) {
    const authors = post.authors
      .map((author: any) => {
        if (author.team_id) {
          return `${author.team_id.First_Name} ${author.team_id.Last_Name}`;
        }
        return null;
      })
      .filter(Boolean);

    if (authors.length === 1) return authors[0] || "Reboot Democracy Team";
    if (authors.length > 1) {
      const lastAuthor = authors.pop();
      return `${authors.join(", ")} and ${lastAuthor}`;
    }
  }

  // Handle string authors
  if (typeof post.authors === "string") return post.authors;
  if (typeof post.author === "string") return post.author;

  return "Reboot Democracy Team";
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

  router.push({ path: "/blog", query });
}

function handleTabChange(_: number, name: string): void {
  if (name === "latest-posts") resetSearch();
}

const onClick = (): void => {
  window.location.href = "/signup";
};

// Filtering functions
async function fetchPostsByAuthor(authorName: string): Promise<BlogPost[]> {
  if (authorPostsCache.value.has(authorName)) {
    return authorPostsCache.value.get(authorName) || [];
  }

  try {
    const allPosts = await fetchAllBlogPosts();
    const authorPosts = allPosts.filter((post) => {
      return getAuthorName(post) === authorName;
    });

    authorPostsCache.value.set(authorName, authorPosts);
    return authorPosts;
  } catch (error) {
    console.error(`Error fetching posts for author ${authorName}:`, error);
    return [];
  }
}

async function applyFilters(): Promise<void> {
  isLoadingState.value = true;

  try {
    let filteredPosts: BlogPost[] = [];

    if (selectedAuthor.value !== "All Authors") {
      const authorPosts = await fetchPostsByAuthor(selectedAuthor.value);

      if (selectedTag.value !== "All Topics") {
        filteredPosts = authorPosts.filter((post) =>
          post.Tags?.includes(selectedTag.value)
        );

        const newsItems = await fetchWeeklyNewsItems();
        const filteredNews = newsItems
          .filter(
            (n) =>
              n.category === selectedTag.value &&
              getAuthorName(n) === selectedAuthor.value
          )
          .map(
            (n) =>
              ({
                ...n,
                id: n.url || `news-${Date.now()}`,
                Tags: n.category ? [n.category] : [],
              } as unknown as BlogPost)
          );

        filteredPosts = [...filteredPosts, ...filteredNews];
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
        .filter((n) => n.category === selectedTag.value)
        .map(
          (n) =>
            ({
              ...n,
              id: n.url || `news-${Date.now()}`,
              Tags: n.category ? [n.category] : [],
            } as unknown as BlogPost)
        );

      filteredPosts = [...filteredBlogs, ...filteredNews];
    } else {
      displayPosts.value = allBlogPosts.value || [];
      return;
    }

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
onMounted(() => {
  resetSearch();
  displayPosts.value = allBlogPosts.value || [];
});
</script>

<style>
.blog-collab-container {
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}
</style>
