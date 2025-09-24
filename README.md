# Nuxt 3 Project Setup Guide for Beginners

This guide will walk you through setting up a Nuxt 3 project with the same configuration as the RebootDemocracy project. Follow these steps carefully to ensure your project is set up correctly.


## Prerequisites

Before starting, ensure you have the following installed on your system:

### 1. Node.js and npm
- **Required Version**: Node.js >= 20.12.2
- **Check if installed**: Run `node --version` and `npm --version` in your terminal

### 2. Git
- **Check if installed**: Run `git --version` in your terminal

- Install helpful extensions:
  - Vue - Official
  - TypeScript Vue Plugin (Volar)
  - ESLint
  - Prettier

## Project Initialization

### Step 1: Create a New Nuxt Project

Open your terminal and run:

```bash
# Navigate to your desired directory
cd ~/Desktop

# Create a new Nuxt project
npx nuxi@latest init my-nuxt-project

# Navigate into the project directory
cd my-nuxt-project
```

When prompted:
- Choose "npm" as your package manager
- Say "Yes" to initialize git repository

### Step 2: Clean Up Default Files

The default Nuxt installation creates some files we need to modify:

```bash
# Remove the default app.vue (we'll create our own)
rm app.vue

# Remove the default components
rm -rf components/
```

## Installing Dependencies

### Step 3: Install Core Dependencies

Copy and run this command to install all necessary dependencies:

### Step 4: Install Development Dependencies

## Project Structure Setup

### Step 5: Create Directory Structure

Create the following directory structure in your project:

```bash
# Create main directories
mkdir -p components/{badge,button,card,dropdown,footer,header,hero,mailing,search,styles,tab,tags,typography,widget}
mkdir -p composables
mkdir -p layouts
mkdir -p pages/{blog/category,events,more-resources,newsthatcaughtoureye,our-engagements,our-research}
mkdir -p plugins
mkdir -p public/images
mkdir -p server
mkdir -p src/helpers
mkdir -p tests/components/{button,card,text}
mkdir -p types
mkdir -p netlify/functions
```

**What are Composables?** Composables are simple reusable functions in Vue that let you share logic (like data fetching or state) across components while using Vue’s reactivity and Nuxt’s features.

### Step 6: Create Essential Files

Create these essential files with basic content:

#### Create `app.vue`:

The `app.vue` file is the root component of your Nuxt application. Think of it as the main container that wraps your entire application. Here's what it should contain:

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

**Understanding the Components:**

1. **`<template>` tag**: This is where you write your HTML-like Vue template code. Everything visual in your component goes here.

2. **`<NuxtLayout>`**: This is a built-in Nuxt component that handles layouts. It allows you to have different layouts for different pages (like a blog layout vs. a default layout). 
   - By default, it uses `layouts/default.vue`
   - You can create multiple layouts and switch between them
   - It provides a consistent structure (header, footer, navigation) across pages

3. **`<NuxtPage />`**: This is another built-in Nuxt component that renders the current page based on the URL.
   - It acts as a placeholder for your page content
   - When someone visits `/about`, it renders `pages/about.vue`
   - When someone visits `/blog`, it renders `pages/blog/index.vue`
   - It's like a dynamic slot that changes based on the route

**How it Works Together:**
1. User visits your website
2. `app.vue` loads first as the root component
3. `<NuxtLayout>` wraps the page with your chosen layout (header, footer, etc.)
4. `<NuxtPage />` displays the specific page content based on the URL
5. The result is a complete page with layout + content

**Example Flow:**
- User visits `/blog`
- `app.vue` renders
- `<NuxtLayout>` loads the default layout (or blog layout if specified)
- `<NuxtPage />` loads `pages/blog/index.vue`
- User sees: Header + Blog Content + Footer

**Note**: This is the minimal `app.vue` setup. You can add more features like:
- Global error handling
- Loading indicators
- Authentication checks
- Global CSS imports
- Transition effects between pages

#### Create `layouts/default.vue`:

**Why Create the `layouts` Directory?**

The `mkdir -p layouts` command creates a directory specifically for layout components. Here's why layouts are important:

1. **Reusable Page Structure**: Instead of copying the same header/footer code on every page, you define it once in a layout
2. **Multiple Layout Support**: Different sections of your site can have different layouts (blog layout, admin layout, minimal layout)
3. **Centralized Updates**: Change the header once, and it updates across all pages using that layout
4. **Clean Code**: Keeps your page components focused on content, not structure

**Example: Default Layout** (`layouts/default.vue`):
```vue
<template>
  <div class="layout">
    <DefaultHeader :topicTags="tags" />
    <div class="header-spacer"></div>
    <main class="main-content">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { useAsyncData } from "#app";
// Import your data fetching function
import { fetchAllUniqueTagsForSSG } from "../composables/fetchAllUniqueTagsSSG";

// Fetch data that will be used by the header component
const { data: tags } = await useAsyncData(
  "topic-tags",  // Unique key for caching
  fetchAllUniqueTagsForSSG  // Your data fetching function
);
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;  /* Take up remaining space between header and footer */
}

.header-spacer {
  height: 80px; /* Adjust based on your header height */
}
</style>
```

**Important Concepts in This Layout:**

1. **Component Imports**: The layout uses auto-imported components (`DefaultHeader`, `Footer`) thanks to Nuxt's auto-imports feature
2. **Props Passing**: The `:topicTags="tags"` passes data from the layout to the header component
3. **Data Fetching**: Uses `useAsyncData` to fetch data that's needed across all pages using this layout
4. **Slot**: The `<slot />` is where your page content appears

**Example: Blog Layout** (`layouts/blog.vue`):
```vue
<template>
  <div class="layout">
    <BlogHeader :topicTags="tags" />
    <div class="header-spacer"></div>
    <main class="main-content">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { useAsyncData } from '#app';
import { fetchAllUniqueTagsForSSG } from "../composables/fetchAllUniqueTagsSSG";

// Same data fetching as default layout but with BlogHeader component
const { data: tags } = await useAsyncData("topic-tags", fetchAllUniqueTagsForSSG);
</script>
```

**How to Use Different Layouts:**

1. **Using default layout** (automatic):
```vue
<!-- pages/index.vue -->
<template>
  <div>
    <h1>Welcome to My Site</h1>
    <p>This page automatically uses the default layout</p>
  </div>
</template>
```

1. **Specifying a custom layout**:
```vue
<!-- pages/blog/index.vue -->
<template>
  <div>
    <h1>Blog Posts</h1>
    <p>This page uses the blog layout</p>
  </div>
</template>

<script setup>
// Tell Nuxt to use the blog layout for this page
definePageMeta({
  layout: 'blog'
})
</script>
```

3. **Disabling layout** for a specific page:
```vue
<!-- pages/login.vue -->
<template>
  <div class="login-page">
    <h1>Login</h1>
    <!-- No header/footer, just the login form -->
  </div>
</template>

<script setup>
// This page won't use any layout
definePageMeta({
  layout: false
})
</script>
```

**Benefits Illustrated:**
- **Without Layouts**: You'd have to copy the header/footer code to every single page file
- **With Layouts**: Define once, use everywhere
- **Multiple Layouts**: Blog pages can have a different look than marketing pages
- **Easy Maintenance**: Update the navigation menu in one file, not 50 files

The `<slot />` component in the layout is where your page content gets inserted, creating a complete page!

## Understanding useAsyncData

### What is useAsyncData?

`useAsyncData` is a powerful Nuxt 3 composable for fetching data in a way that works with both server-side rendering (SSR) and client-side navigation. It's one of the most important concepts to master in Nuxt 3.

### Why is it Important?

1. **SSR Compatibility**: Data is fetched on the server during initial page load, improving SEO and performance
2. **Automatic Caching**: Prevents duplicate requests when navigating between pages
3. **Loading States**: Built-in pending, error, and refresh states

### Basic useAsyncData Syntax

```typescript
const { data, pending, error, refresh } = await useAsyncData(
  'unique-key',  // Cache key
  () => fetchDataFunction(),  // Async function that returns data
  {
    // Optional configuration
    server: true,  // Fetch on server-side
    lazy: false,   // Wait for data before rendering
    transform: (data) => data, // Transform the data
    pick: ['field1', 'field2'] // Pick specific fields
  }
)
```

### Real-World Examples

#### Example 1: Fetching Data in a Page
```vue
<!-- pages/blog/index.vue -->
<template>
  <div>
    <h1>Blog Posts</h1>
    
    <!-- Show loading state -->
    <div v-if="pending">Loading posts...</div>
    
    <!-- Show error state -->
    <div v-else-if="error">Error loading posts: {{ error.message }}</div>
    
    <!-- Show data -->
    <div v-else>
      <article v-for="post in posts" :key="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <NuxtLink :to="`/blog/${post.slug}`">Read more</NuxtLink>
      </article>
    </div>
  </div>
</template>

<script setup>
// The function will be auto-imported from composables/
const { data: posts, pending, error } = await useAsyncData(
  'blog-posts',  // Unique key for this data
  () => fetchBlogPosts()  // Your async function
)
</script>
```

#### Example 2: Fetching Data with Parameters
```vue
<!-- pages/blog/[slug].vue -->
<template>
  <article v-if="post">
    <h1>{{ post.title }}</h1>
    <div v-html="post.content"></div>
  </article>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// Use the route parameter in the key for proper caching
const { data: post } = await useAsyncData(
  `blog-post-${route.params.slug}`,  // Dynamic key based on slug
  () => fetchBlogPost(route.params.slug)
)

// Handle 404
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}
</script>
```

#### Example 3: Fetching Multiple Data Sources
```vue
<!-- pages/dashboard.vue -->
<script setup>
// Fetch multiple data sources in parallel
const [
  { data: userData },
  { data: statsData },
  { data: recentPosts }
] = await Promise.all([
  useAsyncData('user-data', () => fetchUserData()),
  useAsyncData('stats', () => fetchStats()),
  useAsyncData('recent-posts', () => fetchRecentPosts())
])
</script>
```

### Creating a Composable for Data Fetching

Create `composables/fetchBlogPosts.ts`:
```typescript
export const fetchBlogPosts = async () => {
  // Example using Directus SDK
  const client = useDirectusClient()
  
  try {
    const posts = await client.items('blog_posts').readByQuery({
      filter: { status: { _eq: 'published' } },
      sort: ['-date_created'],
      limit: 10,
      fields: ['id', 'title', 'slug', 'excerpt', 'date_created', 'author']
    })
    
    return posts.data
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    throw error
  }
}
```

Replace the default `nuxt.config.ts` with this configuration:

```typescript
// Import the defineNuxtConfig function to create the configuration
import { defineNuxtConfig } from "nuxt/config";

// Import Algolia module for search functionality
import '@nuxtjs/algolia';

// Import composables for generating static routes (if using SSG)
// These will be created later in your composables directory
import { getStaticBlogRoutes } from './composables/getStaticBlogRoutes';
import { getStaticCategoryRoutes } from './composables/getStaticCategoryRoutes';
import { getStaticNewsRoutes } from './composables/getStaticNewsRoutes';

// Export the Nuxt configuration
export default defineNuxtConfig({
  // Compatibility date for Nuxt features
  compatibilityDate: '2024-11-01',
  
  // Enable Vue devtools for debugging
  devtools: { enabled: true },
  
  // Enable Server-Side Rendering (set to false for SPA)
  ssr: true,
  
  // Nuxt modules - extend functionality
  modules: [
    '@nuxt/test-utils/module',     // Testing utilities
    '@nuxtjs/algolia',             // Algolia search integration
    'nuxt-gtag',                   // Google Analytics
    'nuxt-build-cache',            // Cache build artifacts for faster builds
    'nuxt-lazy-hydrate'            // Lazy hydration for better performance
  ],
  
  // Google Analytics configuration
  gtag: {
    id: 'YOUR-GOOGLE-ANALYTICS-ID', // Replace with your actual GA ID (e.g., 'G-XXXXXXXXXX')
    enabled: true,                  // Set to false to disable tracking
  },
  
  // Nitro server configuration (powers the server-side)
  nitro: {
    // Deployment preset - options: 'netlify', 'vercel', 'cloudflare', 'node-server', etc.
    preset: 'netlify',
    
    // Pre-rendering configuration for static generation
    prerender: {
      crawlLinks: false,    // Don't automatically crawl links to find routes
      failOnError: false,   // Continue building even if some pages fail
      concurrency: 1,       // Number of pages to render simultaneously
      routes: []           // Routes will be added dynamically via hooks
    },
    
    // Output directory configuration
    output: {
      dir: '.output',                    // Main output directory
      publicDir: '.output/public',       // Static assets directory
      serverDir: '.output/server'        // Server bundle directory
    }
  },
  
  // Hooks for build-time operations
  hooks: {
    // This hook runs before Nitro builds
    async 'nitro:config'(nitroConfig) {
      // Fetch all routes that need to be pre-rendered
      const blogRoutes = await getStaticBlogRoutes();
      const categoryRoutes = await getStaticCategoryRoutes();
      const newsRoutes = await getStaticNewsRoutes();
      
      // Add routes to the pre-render list
      nitroConfig.prerender = nitroConfig.prerender ?? {};
      nitroConfig.prerender.routes = [
        ...(nitroConfig.prerender.routes ?? []),
        ...blogRoutes,        // e.g., ['/blog/post-1', '/blog/post-2']
        ...categoryRoutes,    // e.g., ['/blog/category/tech', '/blog/category/life']
        ...newsRoutes        // e.g., ['/news/article-1', '/news/article-2']
      ];
    }
  },
  
  // Algolia search configuration
  algolia: {
    apiKey: process.env.ALGOLIA_API_KEY,        // Your Algolia API key (from .env)
    applicationId: process.env.ALGOLIA_APP_ID,   // Your Algolia app ID (from .env)
    lite: true,                                  // Use lite client for smaller bundle
    instantSearch: {
      theme: 'satellite',                        // InstantSearch theme
    },
  },
  
  // Route-specific rules for rendering and caching
  routeRules: {
    '/': { prerender: true },                    // Pre-render homepage
    '/blog': { prerender: true },                // Pre-render blog index
    '/blog/**': { prerender: true },             // Pre-render all blog posts
    '/events': { prerender: true },              // Pre-render events page
    '/about': { prerender: true },               // Pre-render about page
    
    // Example of dynamic route with caching
    '/api/dynamic': { 
      prerender: false,                          // Don't pre-render
      headers: { 'cache-control': 's-maxage=60' } // Cache for 60 seconds
    },
    
    // Example of a redirect
    '/old-page': {
      redirect: '/new-page',                     // Redirect to new URL
      prerender: false
    }
  },
  
  // Global CSS files to include
  css: [
    './components/styles/index.css',             // Main stylesheet
    // Add more global styles here if needed
  ],
  
  // Component auto-import configuration
  components: [
    {
      path: './components',      // Directory to scan for components
      pathPrefix: false,         // Don't prefix component names with path
      global: true              // Make components globally available
    }
  ],
  
  // App-level configuration
  app: {
    // HTML head configuration
    head: {
      // Page title template
      title: 'My Nuxt App',
      
      // Meta tags for SEO
      meta: [
        { charset: 'utf-8' },                    // Character encoding
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }, // Responsive viewport
        { name: 'description', content: 'Your site description for SEO' },
        
        // Open Graph tags for social media sharing
        { property: 'og:title', content: 'Your Site Title' },
        { property: 'og:description', content: 'Your site description' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og-image.jpg' }, // Social share image
        
        // Twitter Card tags
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Your Site Title' },
        { name: 'twitter:description', content: 'Your site description' },
      ],
      
      // Link tags
      link: [
        // Favicon
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        
        // Preconnect to external domains for performance
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        
        // Google Fonts (customize with your preferred fonts)
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
        },
        
        // Additional external stylesheets
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css'
        }
      ],
      
     
  },
```

### Understanding Key Configuration Sections:

1. **Basic Settings**:
   - `compatibilityDate`: Ensures consistent behavior across Nuxt versions
   - `devtools`: Enables Vue DevTools for debugging
   - `ssr`: Controls server-side rendering (true) vs SPA mode (false)

2. **Modules**: External packages that extend Nuxt functionality
   - Each module can have its own configuration section

3. **Nitro**: Controls the server and build process
   - `preset`: Deployment target (Netlify, Vercel, etc.)
   - `prerender`: Static generation settings

4. **Hooks**: Run code at specific points in the build process
   - Used here to dynamically add routes for pre-rendering

5. **Route Rules**: Fine-grained control over individual routes
   - Pre-rendering, caching, redirects, etc.

6. **App Configuration**: Global app settings
   - SEO meta tags
   - External resources (fonts, stylesheets)
   - Favicon and social media images

## Understanding Static Site Generation (SSG) in Nuxt

### How SSG Works - Build Time vs Runtime

Static Site Generation is a powerful feature in Nuxt that fundamentally changes how your application serves content. When you run `npm run generate`, Nuxt performs a build-time process that's completely different from traditional server-side rendering:

**The Build-Time Magic:**
1. **API Calls at Build Time**: During the build process, Nuxt executes all your `useAsyncData` and `useFetch` calls for each route. This means your Directus API, external APIs, or any data source is called ONLY during the build, not when users visit your site.

2. **Pre-rendered HTML**: For each route, Nuxt generates a complete HTML file with all the data already embedded. The blog post content, user lists, navigation menus - everything is baked into static HTML files.

3. **Zero Runtime API Calls**: When a user visits your site, they receive pre-built HTML files directly from the CDN. No server processing, no database queries, no API calls - just instant static file delivery.

### What Does `prerender: true` Mean?

When you set `prerender: true` for a route in your `routeRules`, you're telling Nuxt to generate a static HTML file for that route at build time. Here's what happens:

```typescript
routeRules: {
  '/': { prerender: true },  // Homepage becomes /index.html
  '/about': { prerender: true },  // About page becomes /about.html
  '/blog/**': { prerender: true },  // All blog posts become static HTML files
}
```

**The Process:**
1. **During `npm run generate`**: Nuxt visits each route marked with `prerender: true`
2. **Executes all code**: Runs your Vue components, calls APIs via `useAsyncData`
3. **Generates HTML**: Creates a complete HTML file with all data embedded
4. **Saves to disk**: Stores the HTML in `.output/public/` directory

**Without `prerender: true`:**
- The page would need a Node.js server to render
- API calls would happen when users visit
- Slower initial page loads
- Higher hosting costs

**With `prerender: true`:**
- Page is pre-built as static HTML
- No server needed - just file hosting
- Instant page loads
- Data is "frozen" at build time

**Real Example:**
```typescript
// When you have this in routeRules:
'/blog/my-post': { prerender: true }

// At build time, Nuxt:
// 1. Navigates to /blog/my-post
// 2. Runs all useAsyncData calls
// 3. Fetches post data from your CMS
// 4. Generates: .output/public/blog/my-post.html
// 5. The HTML file contains the complete blog post

// When a user visits /blog/my-post:
// - They get the pre-built HTML file
// - No API calls to your CMS
// - Page loads instantly
```

**Dynamic Routes with Wildcards:**
```typescript
'/blog/**': { prerender: true }  // ** means all routes under /blog/
// This will pre-render:
// - /blog/post-1
// - /blog/post-2
// - /blog/category/tech
// - Any route starting with /blog/
```

### Example: Blog Post Generation

Let's see how this works with a real example from your blog:

```typescript
// composables/getStaticBlogRoutes.ts
export const getStaticBlogRoutes = async () => {
  // This runs at BUILD TIME only
  const client = useDirectusClient();
  
  // Fetch all blog posts from your CMS
  const posts = await client.items('blog_posts').readByQuery({
    filter: { status: { _eq: 'published' } },
    fields: ['slug']
  });
  
  // Return routes that need to be pre-rendered
  return posts.data.map(post => `/blog/${post.slug}`);
  // Returns: ['/blog/my-first-post', '/blog/another-post', ...]
}
```

```vue
<!-- pages/blog/[slug].vue -->
<script setup>
const route = useRoute();

// This API call happens at BUILD TIME for each blog post
const { data: post } = await useAsyncData(
  `blog-${route.params.slug}`,
  () => fetchBlogPost(route.params.slug)
);

// At build time, Nuxt will:
// 1. Call fetchBlogPost('my-first-post')
// 2. Generate /blog/my-first-post.html with the data
// 3. Call fetchBlogPost('another-post')
// 4. Generate /blog/another-post.html with the data
// ... and so on for every blog post
</script>

<template>
  <article>
    <!-- This HTML is generated at build time with real data -->
    <h1>{{ post.title }}</h1>
    <div v-html="post.content"></div>
  </article>
</template>
```

### The Build Process Visualized:

```
BUILD TIME (npm run generate):
┌─────────────────────────────────────┐
│ 1. Nuxt starts build process        │
│ 2. Reads nuxt.config.ts             │
│ 3. Discovers all routes             │
│ 4. For EACH route:                  │
│    - Executes the page component    │
│    - Runs useAsyncData/useFetch     │
│    - Makes API calls to Directus    │
│    - Generates static HTML          │
│ 5. Outputs .output/public/ folder   │
│    with all HTML files              │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│        .output/public/              │
│  ├── index.html (homepage)          │
│  ├── blog/                          │
│  │   ├── index.html (blog list)    │
│  │   ├── my-first-post.html        │
│  │   ├── another-post.html         │
│  │   └── ... (all blog posts)      │
│  ├── about.html                     │
│  └── _nuxt/ (JS/CSS assets)        │
└─────────────────────────────────────┘
         ↓
RUNTIME (User visits site):
┌─────────────────────────────────────┐
│ 1. User requests /blog/my-post      │
│ 2. CDN serves my-post.html          │
│ 3. No API calls needed!             │
│ 4. Page loads instantly             │
│ 5. Vue hydrates for interactivity   │
└─────────────────────────────────────┘
```

### Benefits of SSG:

1. **Performance**: Pages load instantly since they're pre-built HTML
2. **SEO**: Perfect SEO since search engines see complete HTML
3. **Cost**: Minimal hosting costs (just static file hosting)
4. **Security**: No direct database access from the frontend
5. **Scalability**: Can handle millions of users (it's just files!)

### Important Considerations:

1. **Build Time**: More content = longer build times
2. **Content Updates**: Need to rebuild when content changes
3. **Dynamic Data**: Not suitable for user-specific or real-time data


### Step 8: Update `package.json`

Update your `package.json` to include these scripts and configurations:

```json
{
  "name": "nuxt-app",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.12.2"
  },
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "test": "vitest"
  }
}
```

## Running the Project

### Step 9: Initial Setup Commands

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Your application should now be running at `http://localhost:3000`

### Step 10: Build Commands

```bash
# Build for production
npm run build

# Generate static site
npm run generate

# Preview production build
npm run preview
```

## Deployment Setup

### Step 11: Netlify Deployment (Optional)

If deploying to Netlify, create `netlify.toml`:

```toml
[build]
command = "npm run generate"
publish = ".output/public/"
functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20.12.2"
  NPM_FLAGS = "--no-audit --no-fund"

[[plugins]]
package = "netlify-plugin-cache"
  [plugins.inputs]
  paths = [".output/public"]

[dev]
command = "npm run dev"
targetPort = 3000
```

## Next Steps

### Additional Setup Tasks:

1. **Create CSS Structure**:
   - Create `components/styles/index.css` as your main stylesheet
   - Import component-specific styles as needed

2. **Set Up Directus Integration**:
   - Create `plugins/directus.js` for Directus client setup
   - Create composables for data fetching

3. **Add Components**:
   - Start creating Vue components in the `components/` directory
   - They will be auto-imported.

4. **Add Pages**:
   - Create additional pages in the `pages/` directory
   - Nuxt will automatically create routes based on the file structure
