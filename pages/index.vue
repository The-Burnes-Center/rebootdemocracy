<template>
  <section class="p-6">
  <Text 
    as="h1" 
    size="sm" 
    weight="normal" 
    align="center"
    fontStyle="italic" 
    fontFamily="inter" 
    class="my-custom-class"
    transform="uppercase"
  >
    <strong>Big Heading</strong>
  </Text>    
    <Title level="h1" :lineClamp="1" color="text-primary">
    This long title will be truncated after one line
  </Title>

<!-- Two lines with ellipsis -->
  <Title  as = "p" fontFamily="inter" weight="normal" level="h2" :lineClamp="2" color="text-primary">
    This longer title will span up to two lines before being truncated with an ellipsis
  </Title>

<!-- Basic paragraph -->
<Paragraph>
  This is a standard paragraph with default styling.
</Paragraph>

<!-- Styled paragraph -->
<Paragraph 
  size="lg" 
  weight="medium"
  color="text-secondary"
  fontFamily="inria"
  margin="lg"
  lineHeight="relaxed"
>
  This paragraph has larger text, medium weight, secondary color,
  large margins, and relaxed line spacing.
</Paragraph>

<!-- Paragraph with line clamp -->
<Paragraph :lineClamp="3">
  This paragraph will display at most 3 lines of text, 
  after which it will be truncated with an ellipsis.
  Any additional content beyond the third line won't be visible.
    after which it will be truncated with an ellipsis.
</Paragraph>

<!-- Paragraph with custom margins -->
<Paragraph marginTop="xl" marginBottom="none">
  This paragraph has extra large top margin and no bottom margin.
</Paragraph>
    <Button variant="primary" @click="register"> Register </Button>

    <Button variant="secondary" @click="register"> Login </Button>

    <TabSwitch :tabs="tabs" :initialTab="0" @tab-changed="onTabChanged">
      <template #latestposts>
        <div class="space-y-4">
          <div
            v-for="post in blogPosts"
            :key="post.id"
            class="p-4 border rounded-md shadow-sm"
          >
            <h2 class="text-xl font-semibold">{{ post.title }}</h2>
            <p class="text-sm text-gray-500 mb-2">
              by {{ post.author }} — {{ post.date }}
            </p>
            <p class="text-gray-700">{{ post.excerpt }}</p>
          </div>
        </div>
      </template>
    </TabSwitch>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { Button } from "#components";
import Title from "../components/typography/Title.vue";

// Tab data with correct structure
const tabs = [
  { title: "Latest Posts", name: "latestposts" },
  {
    title: "News that caught our eye",
    name: "news",
    url: "https://rebootdemocracy.ai/news",
    external: true,
  },
  {
    title: "Events",
    name: "events",
    url: "https://rebootdemocracy.ai/events",
    external: true,
  },
];

// Tab state tracking
const currentTabName = ref("latestposts");

// Tab change handler - fixed function name to match template
const onTabChanged = (index, name) => {
  console.log(`Tab changed to index ${index} with name ${name}`);
  currentTabName.value = name;
};

// Blog posts array with sample data
const blogPosts = ref([
  {
    id: 1,
    tag: "Internet Archive Book Talk",
    title: "Copyright, AI, and Great Power Competition",
    author: "Angelique Casem",
    excerpt:
      "A new paper by Joshua Levine and Tim Hwang explores how different nations approach AI policy and copyright regulation, and also what's at stake in the battle for technological dominance.",
    imageUrl: "/images/exampleImage.png",
    date: "2025-03-10",
  },
  {
    id: 2,
    tag: "Technology",
    title: "The Future of Web Development in 2025",
    author: "Michael Chen",
    excerpt:
      "Exploring the latest trends in web development, from AI-assisted coding to new frameworks that are revolutionizing how we build applications.",
    imageUrl: "/images/exampleImage.png",
    date: "2025-02-25",
  },
  {
    id: 3,
    tag: "Digital Libraries",
    title: "Preserving Knowledge in the Digital Age",
    author: "Sarah Johnson",
    excerpt:
      "How modern archivists are using technology to ensure information is preserved for future generations, despite rapidly changing formats and platforms.",
    imageUrl: "/images/exampleImage.png",
    date: "2025-02-15",
  },
  {
    id: 4,
    tag: "Open Source",
    title: "Community-Driven Innovation",
    author: "Angelique Casem",
    excerpt:
      "The power of open source communities in driving technological innovation and making knowledge accessible to all.",
    imageUrl: "/images/open-source.jpg",
    date: "2025-01-28",
  },
]);
</script>
