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
            <Button variant="primary" width="123px" height="36px" @click="handleBtnClick"
            >View All</Button>
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
        Category</Text>
      <ListCategory
        title="Lawmaking"
        :number="65"
      />
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
import { ref, onMounted } from "vue";
import type { BlogPost, Event } from "@/types/index.ts";


// Constants
const directusUrl = "https://content.thegovlab.com";

// State
const postData = ref<BlogPost[]>([]);
const isLoading = ref(true);
const latestEvent = ref<Event | null>(null);
const isEventLoading = ref(true);
const dataFetchError = ref<string | null>(null);

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

// Load all required data concurrently
const loadInitialData = async () => {
  try {
    isLoading.value = true;
    isEventLoading.value = true;
    
    // Fetch event data
    const eventData = await fetchLatestPastEvent();
    latestEvent.value = Array.isArray(eventData)
      ? null
      : (eventData as Event | null);
      
    // Fetch blog data
    const blogData = await fetchBlogData();
    postData.value = blogData;
    console.log("Blogs loaded:", blogData);
    
  } catch (error) {
    console.error("Error loading initial data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  } finally {
    isLoading.value = false;
    isEventLoading.value = false;
  }
};

onMounted(loadInitialData);
</script>
