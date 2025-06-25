<template>
  <div class="home-page">
    <!-- HERO SECTION -->
    <Hero
      title="Rebooting Democracy in the Age of AI"
      subtitle="Insights on AI, Governance and Democracy"
    />

    <!-- SEARCH RESULTS -->
    <section class="home-featured-row" v-if="showSearchResults">
      <GlobalSearch />
    </section>

    <!-- FEATURED + BLOG CARDS -->
    <section class="home-featured-row" v-else>
      <div class="home-featured-wrapper">
        <!-- FEATURED POST -->
        <FeatureCard
          v-if="featuredPost"
          class="featured-column"
          :imageUrl="
            'image' in featuredPost && featuredPost.image?.id
              ? getImageUrl(featuredPost.image)
              : '/images/exampleImage.png'
          "
          :tag="featuredPost.Tags?.[0] || featuredPost.category"
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
            :excerpt="'excerpt' in item ? item.excerpt : ''"
            :imageUrl="
              'image' in item && item.image
                ? getImageUrl(item.image)
                : '/images/exampleImage.png'
            "
            :author="getAuthorName(item)"
            :date="item.date"
            :isFeatured="false"
            :hoverable="true"
            @click="navigateToBlogPost(item)"
          />
        </div>
      </div>

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
          <span class="base__btn-slot"> Meet Our Team </span>
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

      <!-- BLOG POSTS WITH FILTERS -->
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
            <div class="blog-card-grid grid-layout">
              <div
                v-for="(post, index) in displayPosts.slice(0, 12)"
                :key="post.id || `post-${index}`"
                class="custom-card"
                @click.prevent="handlePostClick(post)"
                style="cursor: pointer"
              >
                <div class="card-image">
                  <img
                    :src="
                      'image' in post && post.image?.id
                        ? getImageUrl(post.image)
                        : '/images/exampleImage.png'
                    "
                    :alt="post.title"
                  />
                </div>

                <div class="card-content">
                  <Text
                    as="span"
                    size="xs"
                    weight="bold"
                    transform="uppercase"
                    fontFamily="inter"
                    class="featured-card__tag"
                    :color="'tag-primary'"
                  >
                    {{ post.Tags?.[0] || "Blog" }}
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
                  >
                    {{ post.excerpt }}
                  </Text>

                  <Text
                    as="p"
                    size="xs"
                    fontStyle="italic"
                    class="card-meta"
                    v-if="post.date"
                  >
                    Published on
                    <Text as="span" size="xs" weight="bold" fontStyle="italic">
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
                <span class="base__btn-slot"> View All Posts </span>
              </button>
            </div>
          </div>
        </template>
      </TabSwitch>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { format } from "date-fns";
import type { BlogPost, NewsItem } from "@/types/index.ts";
import { fetchAllBlogPosts } from "~/composables/fetchBlogData";
import { fetchWeeklyNewsItems } from "~/composables/fetchWeeklyNews";

const router = useRouter();
const { resetSearch, showSearchResults, searchQuery } = useSearchState();

const selectedTag = ref("All Topics");
const selectedAuthor = ref("All Authors");
const displayPosts = ref<BlogPost[]>([]);
const isLoadingState = ref(false);
const DIRECTUS_URL = "https://burnes-center.directus.app/";

// Keep track of dynamically fetched posts by author
const authorPostsCache = ref<Map<string, BlogPost[]>>(new Map());

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
const { data: latestWeeklyNews } = await useAsyncData(
  "weekly-news",
  fetchLatestWeeklyNews
);

// NEW: Fetch complete author list from all posts
const { data: authorListData } = await useAsyncData(
  "homepage-author-list",
  async () => {
    try {
      // Fetch all blog posts to extract complete author list
      const allPosts = await fetchAllBlogPosts();

      // Extract authors with counts
      const authorCounts = new Map<string, number>();

      allPosts.forEach((post) => {
        if ("authors" in post && post.authors) {
          const authorName = getAuthorName(post);
          if (
            authorName !== "Unknown Author" &&
            authorName !== "Reboot Democracy Team"
          ) {
            authorCounts.set(
              authorName,
              (authorCounts.get(authorName) || 0) + 1
            );
          }
        }
      });

      // Return sorted author names
      return Array.from(authorCounts.keys()).sort();
    } catch (error) {
      console.error("Error fetching author list:", error);
      return [];
    }
  }
);

// UPDATED: Use the complete author list
const allAuthors = computed(() => {
  return authorListData.value || [];
});

const flattenedCollaborators = computed(() => {
  return collaborators.flat();
});

function getTag(item: any): string {
  if (item.Tags && Array.isArray(item.Tags) && item.Tags.length > 0) {
    return item.Tags[0];
  }
  if (item.category) {
    return item.category;
  }
  if (item.type === "news") {
    return "News that caught our eye";
  }
  return "Blog";
}
const featuredPost = computed(() => latestCombinedPosts.value?.[0] || null);
const latestThreePosts = computed(
  () => latestCombinedPosts.value?.slice(1, 4) || []
);
const tagOptions = computed(() => ["All Topics", ...(allTags.value || [])]);
const isLoading = computed(() => isLoadingState.value);
const authorOptions = computed(() => ["All Authors", ...allAuthors.value]);

const weeklyNewsUrl = computed(() => {
  let edition = null;

  if (latestWeeklyNews.value?.edition) {
    edition = latestWeeklyNews.value.edition;
  } else if (latestWeeklyNews.value?.id) {
    edition = latestWeeklyNews.value.id;
  } else {
    const newsPost = latestCombinedPosts.value?.find(
      (post: { type: string; }) => post.type === "news"
    );
    if (newsPost?.edition) {
      edition = newsPost.edition;
    } else if (newsPost?.id) {
      edition = newsPost.id;
    }
  }
  if (edition) {
    const cleanEdition = String(edition).replace(/\D/g, "");
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
    disabled:
      !latestWeeklyNews.value?.edition &&
      !latestCombinedPosts.value?.find((post: { type: string; }) => post.type === "news"),
  },
  { title: "Events", name: "events", url: "/events", external: true },
]);

displayPosts.value = allBlogPosts.value || [];

const collaborators = [
  [
    {
      name: "Audrey Tang",
      title: "Taiwan's first Minister of Digital Affairs",
      imageUrl: "/images/Audrey_Tang.png",
    },
    {
      name: "Dane Gambrell",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Dane_Gambrell.png",
    },
    {
      name: "Tiago C. Peixoto",
      title: "Senior Public Sector Specialist",
      imageUrl: "/images/Tiago_C_Peixoto.png",
    },
    {
      name: "Giulio Quaggiotto",
      title: "Head of UNDP's Strategic Innovation unit",
      imageUrl: "/images/Giulio_Quaggiotto.png",
    },
    {
      name: "Jacob Kemp",
      title: "AI & Social Impact Fellow",
      imageUrl: "/images/Jacob_Kemp.png",
    },
  ],
  [
    {
      name: "Seth Harris",
      title: "Senior Fellow at Burnes Center",
      imageUrl: "/images/Seth_Harris.png",
    },
    {
      name: "Hannah Hetzer",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Hannah_Hetzer.png",
    },
    {
      name: "Bonnie McGilpin",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Bonnie_McGilpin.png",
    },
    {
      name: "Anirudh Dinesh",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Anirudh_Dinesh.png",
    },
  ],
];

function formatDate(dateValue: Date | string): string {
  try {
    return format(new Date(dateValue), "MMMM d, yyyy");
  } catch {
    return "";
  }
}

function getImageUrl(image: any): string {
  if (!image?.id) return "";
  return `${DIRECTUS_URL}assets/${image.id}?width=800`;
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

  // Handle weekly news with single author string
  if (post.authors && typeof post.authors === "string") {
    return post.authors;
  }

  // Handle legacy author field
  if (post.author && typeof post.author === "string") {
    return post.author;
  }

  return "Reboot Democracy Team";
}

function navigateToBlogPost(post: any): void {
  try {
    // Handle blog posts
    if (post.type === "blog" || (!post.type && post.slug)) {
      if (post.slug) {
        router.push(`/blog/${post.slug}`);
      } else {
        console.error("Blog post missing slug:", post);
      }
    }
    // Handle weekly news
    else if (post.type === "news" || post.edition) {
      const edition = String(post.edition || post.id || "").replace(/\D/g, "");
      if (edition) {
        console.log(
          "Navigating to news post:",
          `/newsthatcaughtoureye/${edition}`
        );
        router.push(`/newsthatcaughtoureye/${edition}`);
      } else {
        console.error("News post missing edition:", post);
      }
    }
    // Handle posts with direct URL
    else if (post.url) {
      router.push(post.url);
    } else if (post.slug || post.id) {
      const identifier = post.slug || post.id;
      console.log("Fallback navigation to:", `/blog/${identifier}`);
      router.push(`/blog/${identifier}`);
    } else {
      console.error("Unable to determine navigation path for post:", post);
    }
  } catch (error) {
    console.error("Navigation error:", error, post);
  }
}

function handlePostClick(post: any, event?: Event): void {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  navigateToBlogPost(post);
}

// UPDATED: Include author in navigation query
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

async function fetchPostsByAuthor(authorName: string): Promise<BlogPost[]> {
  // Check cache first
  if (authorPostsCache.value.has(authorName)) {
    return authorPostsCache.value.get(authorName) || [];
  }

  try {
    // Fetch all posts and filter by author
    const allPosts = await fetchAllBlogPosts();
    const authorPosts = allPosts.filter((post) => {
      const postAuthor = getAuthorName(post);
      return postAuthor === authorName;
    });

    // Cache the results
    authorPostsCache.value.set(authorName, authorPosts);

    return authorPosts;
  } catch (error) {
    console.error(`Error fetching posts for author ${authorName}:`, error);
    return [];
  }
}

// UPDATED: Apply filters to handle both tag and author filtering
async function applyFilters(): Promise<void> {
  isLoadingState.value = true;

  try {
    let filteredPosts: BlogPost[] = [];

    // If filtering by author, fetch posts for that specific author
    if (selectedAuthor.value !== "All Authors") {
      // Fetch posts for the selected author
      const authorPosts = await fetchPostsByAuthor(selectedAuthor.value);

      // If also filtering by tag, filter the author's posts
      if (selectedTag.value !== "All Topics") {
        filteredPosts = authorPosts.filter((post) =>
          post.Tags?.includes(selectedTag.value)
        );

        // Also check news items if filtering by tag
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
      // Only tag filter is active
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
      // No filters, show initial posts
      displayPosts.value = allBlogPosts.value || [];
      return;
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

// UPDATED: Use applyFilters for tag filtering
async function handleTagFilter(tag: string): Promise<void> {
  selectedTag.value = tag;
  await applyFilters();
}

// UPDATED: Use applyFilters for author filtering
async function handleAuthorFilter(author: string): Promise<void> {
  selectedAuthor.value = author;
  await applyFilters();
}

onMounted(() => {
  resetSearch();

  // Temporary debug to see what's happening
  console.log("=== WEEKLY NEWS DEBUG ===");
  console.log("latestWeeklyNews:", latestWeeklyNews.value);
  console.log(
    "latestCombinedPosts news:",
    latestCombinedPosts.value?.filter((p: { type: string; }) => p.type === "news")
  );
  console.log("Final weeklyNewsUrl:", weeklyNewsUrl.value);
});
</script>
