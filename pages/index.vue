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
          class="textclass new-blog-collab"
        >
          Blog Collaborators
        </Text>
        <button
          class="base__button base__button--secondary"
          @click="router.push('/about#team-grid')"
        >
          <span class="base__btn-slot"> Meet Our Team → </span>
        </button>
      </div>

      <!-- BLOG COLLABORATORS -->
      <div class="blog-collaborators-wrapper">
        <div class="collaborators-flex-grid">
          <CuratorBadge
            name="Beth Simone Noveck"
            title="Director at Burnes Center and the Govlab"
            imageUrl="/images/Beth_Simone_Noveck.png"
            moreText="More incredible things done in their career"
          />
        </div>

        <div class="collaborators-fixed-grid">
          <div
            class="collaborators-row"
            v-for="(row, rowIndex) in collaborators"
            :key="`row-${rowIndex}`"
          >
            <AuthorBadge
              v-for="author in row"
              :key="author.name"
              v-bind="author"
            />
          </div>
        </div>
      </div>

      <!-- BLOG POSTS WITH FILTERS -->
      <TabSwitch
        :tabs="tabOptions"
        :tagOptions="tagOptions"
        :selectedTag="selectedTag"
        @tab-changed="handleTabChange"
        @tag-filter="handleTagFilter"
      >
        <template #latest-posts>
          <div
            v-if="!isLoading && displayPosts.length"
            class="blog-posts-section"
          >
            <div class="blog-card-grid grid-layout">
              <div
                v-for="(post, index) in displayPosts.slice(0, 12)"
                :key="post.id"
                class="custom-card"
                @click="navigateToBlogPost(post)"
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
                    size="sm"
                    weight="extrabold"
                    class="category-tag"
                    :style="{ color: index % 2 === 0 ? '#003366' : '#2F4F4F' }"
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
                <span class="base__btn-slot">
                  View All Posts
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
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

const router = useRouter();
const { resetSearch, showSearchResults, searchQuery } = useSearchState();

const selectedTag = ref("All Topics");
const displayPosts = ref<BlogPost[]>([]);
const isLoadingState = ref(false);
const DIRECTUS_URL = "https://directus.theburnescenter.org";

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

function getTag(item: BlogPost | NewsItem): string {
  if ('Tags' in item && Array.isArray(item.Tags) && item.Tags.length > 0) {
    return item.Tags[0];
  }
  return item.category || 'Blog';
}

const featuredPost = computed(() => latestCombinedPosts.value?.[0] || null);
const latestThreePosts = computed(() => latestCombinedPosts.value || []);
const tagOptions = computed(() => ["All Topics", ...(allTags.value || [])]);
const isLoading = computed(() => isLoadingState.value);

const weeklyNewsUrl = computed(() => {
  const edition = latestWeeklyNews.value?.edition || "51";
  return `/newsthatcaughtoureye/${String(edition).replace(/\D/g, "")}`;
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
  return `${DIRECTUS_URL}/assets/${image.id}?width=800`;
}

function getAuthorName(post: BlogPost | NewsItem): string {
  if ("authors" in post && post.authors?.length) {
    const authors = post.authors
      .map((author) => {
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

  if ("author" in post && post.author) {
    return post.author;
  }

  return "Reboot Democracy Team";
}

function navigateToBlogPost(post: BlogPost | NewsItem): void {
  if ("slug" in post && post.slug) router.push(`/blog/${post.slug}`);
  else if ("url" in post && post.url) window.location.href = post.url;
}

function navigateToAllPosts(): void {
  const query =
    selectedTag.value !== "All Topics"
      ? { category: encodeURIComponent(selectedTag.value) }
      : {};
  router.push({ path: "/blog", query });
}

function handleTabChange(_: number, name: string): void {
  if (name === "latest-posts") resetSearch();
}

async function handleTagFilter(tag: string): Promise<void> {
  selectedTag.value = tag;
  isLoadingState.value = true;

  try {
    if (tag === "All Topics") {
      displayPosts.value = allBlogPosts.value || [];
    } else {
      const [blogs, newsItems] = await Promise.all([
        fetchAllBlogPosts(),
        fetchWeeklyNewsItems(),
      ]);

      const filteredBlogs = blogs.filter((post) => post.Tags?.includes(tag));
      const filteredNews = newsItems
        .filter((n) => n.category === tag)
        .map(
          (n) =>
            ({
              ...n,
              id: n.url || `news-${Date.now()}`,
              Tags: n.category ? [n.category] : [],
            } as unknown as BlogPost)
        );

      const combined = [...filteredBlogs, ...filteredNews].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      displayPosts.value = combined.slice(0, 20);
    }
  } catch (error) {
    console.error("Error filtering posts:", error);
    displayPosts.value = [];
  } finally {
    isLoadingState.value = false;
  }
}

onMounted(resetSearch);
</script>
