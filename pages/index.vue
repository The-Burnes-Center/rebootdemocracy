<template>
  <section class="page-layout">
    <article class="left-content">
      <!-- Show loading state -->
      <div v-if="isLoading" class="loading">Loading blogs...</div>

      <TabSwitch
        :tabs="[
          { title: 'Latest Posts', name: 'latest-posts' },
          {
            title: 'News that caught our eye',
            name: 'news',
            url: 'https://rebootdemocracy.ai/blog/news-that-caught-our-eye-51',
            external: true,
          },
          {
            title: 'Events',
            name: 'events',
            url: 'https://rebootdemocracy.ai/events',
            external: true,
          },
        ]"
        @tab-changed="handleTabChange"
      >
        <!-- Content for "Latest Posts" tab -->
        <template #latest-posts>
          <article class="left-content">
            <!-- Show loading state -->
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
                :imageUrl="
                  post.image?.filename_disk
                    ? `${directusUrl}/assets/${post.image.filename_disk}`
                    : '/images/default.png'
                "
                :date="new Date(post.date)"
                :tagIndex="index % 5"
                variant="default"
                :hoverable="true"
              />
            </div>
            <!-- No blogs found message -->
            <div v-else class="no-blogs">No blog posts found.</div>
          </article>
        </template>
      </TabSwitch>
    </article>

    <aside class="right-content">
      <AuthorBadge
        name="Tiago C. Peixoto"
        title="Senior Public Sector Specialist"
        imageUrl="/images/exampleImage.png"
      />
      <Text
        as="a"
        href="/team"
        size="sm"
        fontFamily="inria"
        align="center"
        weight="extrabold"
        lineHeight="normal"
        color="link-primary"

      >
        Meet Our Team
      </Text>
      <UpcomingCard
        title="Copyright, AI, and Great Power Competition"
        excerpt="A new paper by Joshua Levine and Tim Hwang explores how different nations approach AI policy and copyright regulation, and also what's at stake in the battle for technological dominance.!"
        imageUrl="/images/exampleImage.png"
        :onClick="handleRegisterClick"
      />
      <SignUpButtonWidget
        title="Sign Up for updates"
        placeholder="Enter your email"
        buttonLabel="Sign Up"
        backgroundColor="#F9F9F9"
      />
      <CuratorBadge
        name="Beth Simone Noveck"
        title="Director at Burnes Center and the Govlab"
        imageUrl="/images/exampleImage.png"
        moreText="More incredible things Beth done in in her"
      />
      <!-- <AuthorCard
        name="Clara Langevin"
        title="AI Policy Specialist"
        bio="Clara Langevin is an AI Policy Specialist on the Emerging Technologies team. She focuses on promoting responsible AI adoption across different sectors and creating policy guidance on AI and data ethics, transparency, and explainability."
        imageUrl="/images/exampleImage.png"
        articlesLink="/authors/clara-langevin"
      /> -->
    </aside>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import type { BlogPost, Author } from "@/types";

// Set your Directus URL
const directusUrl = "https://content.thegovlab.com";
const postData = ref<BlogPost[]>([]);
const isLoading = ref(true);
const activeTab = ref(0);

// Function to handle tab changes
const handleTabChange = (index: number, name: string) => {
  console.log(`Tab changed to: ${name} (index: ${index})`);
  activeTab.value = index;

  // Only load blog data when on the "Latest Posts" tab
  if (name === "latest-posts" && postData.value.length === 0) {
    loadAllBlogs();
  }
};

// Function to handle register button click
const handleRegisterClick = () => {
  console.log("Register button clicked");
};

// Helper function to get author name
const getAuthorName = (post: BlogPost): string => {
  if (post.authors && post.authors.length > 0 && post.authors[0].team_id) {
    const author = post.authors[0].team_id;
    return `${author.First_Name} ${author.Last_Name}`;
  }
  return "Unknown Author";
};

const getPostTag = (post: BlogPost): string => {
  if (post.Tags && post.Tags.length > 0) {
    console.log("Post tags:", post.Tags);
    return post.Tags[0];
  }
  // Fallback to a default tag
  return "Blog";
};

// Function to load all blogs
const loadAllBlogs = async () => {
  try {
    isLoading.value = true;
    const data = await fetchBlogData();
    postData.value = data || [];
    console.log("Loaded blog posts:", postData.value);
  } catch (error) {
    console.error("Failed to load blogs:", error);
    postData.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Load blogs when component is mounted and the active tab is 'Latest Posts'
onMounted(() => {
  // Only load blog data if we're starting on the first tab
  if (activeTab.value === 0) {
    loadAllBlogs();
  }
});
</script>
