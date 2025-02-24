<script>
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useHead } from '@vueuse/head';
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import { lazyLoad } from '../directives/lazyLoad';

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
  },
  directives: {
    lazyLoad
  },
  data() {
    return {
      weeklyNewsData: [],
      flattenedArticles: [],
      directus: new Directus('https://content.thegovlab.com/'),
      isLoading: true,
      activeCategory: 'all',
      categories: ['all'],
      error: null
    }
  },
  created() {
    this.fetchWeeklyNews();
  },
  mounted() {
    this.fillMeta();
  },
  methods: {
    renderMarkdown(text) {
      if (!text) return '';
      const rawHtml = marked(text);
      return DOMPurify.sanitize(rawHtml);
    },
    formatDateOnly(dateStr) {
      if (!dateStr) return '';
      try {
        return format(new Date(dateStr), 'MMMM d, yyyy');
      } catch (error) {
        console.error("Error formatting date:", error);
        return dateStr; // Return original string if formatting fails
      }
    },
    async fetchWeeklyNews() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await this.directus.items('reboot_democracy_weekly_news').readByQuery({
          limit: -1,
          filter: { status: { _eq: "published" } },
          fields: ['*.*.*'], // Get all nested fields
          sort: ['-id'] // Sort by ID descending (newest first)
        });

        this.weeklyNewsData = response.data;
        console.log("Weekly News Data:", this.weeklyNewsData);
        
        // Process the data to extract articles and categories
        this.processWeeklyNewsData();
      } catch (error) {
        console.error("Error fetching weekly news data:", error.message);
        this.error = "Failed to load articles. Please try again later.";
      } finally {
        this.isLoading = false;
      }
    },
    processWeeklyNewsData() {
      // Extract all articles into a flattened array
      this.flattenedArticles = [];
      const categorySet = new Set(['all']);
      
      if (this.weeklyNewsData && this.weeklyNewsData.length) {
        this.weeklyNewsData.forEach(newsItem => {
          if (newsItem.items && Array.isArray(newsItem.items)) {
            newsItem.items.forEach(item => {
              // Only include items with the required data structure
              if (item && item.reboot_democracy_weekly_news_items_id) {
                // Add the article to our flattened array
                this.flattenedArticles.push({
                  ...item,
                  parentTitle: newsItem.title || 'Unknown Collection'
                });
                
                // Add the category to our set of unique categories
                if (item.reboot_democracy_weekly_news_items_id.category) {
                  categorySet.add(item.reboot_democracy_weekly_news_items_id.category);
                }
              }
            });
          }
        });
      }
      
      this.categories = Array.from(categorySet);
      console.log("Processed articles:", this.flattenedArticles.length);
      console.log("Categories:", this.categories);
    },
    filterByCategory(category) {
      console.log("Filtering by category:", category);
      this.activeCategory = category;
    },
    getFilteredArticles() {
      if (!this.flattenedArticles || !this.flattenedArticles.length) {
        return [];
      }
      
      if (this.activeCategory === 'all') {
        return this.flattenedArticles;
      }
      
      return this.flattenedArticles.filter(article => 
        article.reboot_democracy_weekly_news_items_id && 
        article.reboot_democracy_weekly_news_items_id.category === this.activeCategory
      );
    },
    fillMeta() {
      useHead({
        title: "News That Caught Our Eye - Reboot Democracy",
        meta: [
          { name: 'title', content: "News That Caught Our Eye - Reboot Democracy" },
          { property: 'og:title', content: "News That Caught Our Eye - Reboot Democracy" },
          { property: 'og:description', content: "Collection of curated news articles on the intersection of AI and democracy." },
          { property: 'og:image', content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b" },
          { property: 'twitter:title', content: "News That Caught Our Eye - Reboot Democracy" },
          { property: 'twitter:description', content: "Collection of curated news articles on the intersection of AI and democracy." },
          { property: 'twitter:image', content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b" },
          { property: 'twitter:card', content: "summary_large_image" },
        ],
      })
    }
  }
}
</script>

<template>
  <!-- Header Component -->
  <header-comp></header-comp>

  <div class="news-page-hero">
    <h1 class="eyebrow">Reboot Democracy</h1>
    <h1>News That Caught Our Eye</h1>
    <p style="padding:1rem 0 0 0">A collection of curated news articles about AI and democracy.</p>
  </div>

  <!-- Loading Indicator -->
  <div v-if="isLoading" class="loader-blog"></div>
  
  <!-- Error Message -->
  <div v-else-if="error" class="error-message">
    <p>{{ error }}</p>
    <button @click="fetchWeeklyNews" class="reload-btn">Try Again</button>
  </div>
  
  <!-- No Articles Message -->
  <div v-else-if="flattenedArticles.length === 0" class="no-articles-message">
    <p>No articles found.</p>
    <button @click="fetchWeeklyNews" class="reload-btn">Reload</button>
  </div>

  <!-- News Content -->
  <div v-else class="weekly-news-container">
    <!-- Category Filter -->
    <div class="category-filter">
      <h3>Filter by Category:</h3>
      <div class="category-buttons">
        <button 
          v-for="category in categories" 
          :key="category"
          :class="['category-btn', { active: activeCategory === category }]"
          @click="filterByCategory(category)"
        >
          {{ category === 'all' ? 'All Categories' : category }}
        </button>
      </div>
    </div>

    <!-- All Articles (Grid Layout) -->
    <div class="all-articles-container">
      <h3 v-if="activeCategory !== 'all'">Articles in {{ activeCategory }}</h3>
      <h3 v-else>All Articles</h3>
      
      <!-- Count of all articles -->
      <p class="articles-count">
        {{ getFilteredArticles().length }} article{{ getFilteredArticles().length !== 1 ? 's' : '' }} found
      </p>
      
      <div v-if="getFilteredArticles().length === 0" class="no-articles-message">
        <p>No articles found in the "{{ activeCategory }}" category.</p>
        <button class="reset-filter-btn" @click="filterByCategory('all')">
          Show All Categories
        </button>
      </div>
      
      <!-- Grid Layout -->
      <div v-else class="articles-grid">
        <div v-for="(article, index) in getFilteredArticles()" 
             :key="index" 
             class="news-article grid-article">
          
          <div class="article-header">
            <h4 class="article-title">{{ article.reboot_democracy_weekly_news_items_id.title }}</h4>
          </div>
          
          <div class="article-meta">
            <span v-if="article.reboot_democracy_weekly_news_items_id.category" class="article-category">
              {{ article.reboot_democracy_weekly_news_items_id.category }}
            </span>
            <span v-if="article.reboot_democracy_weekly_news_items_id.publication" class="article-publication">
              {{ article.reboot_democracy_weekly_news_items_id.publication }}
            </span>
            <span v-if="article.reboot_democracy_weekly_news_items_id.author" class="article-author">
              By {{ article.reboot_democracy_weekly_news_items_id.author }}
            </span>
            <span v-if="article.reboot_democracy_weekly_news_items_id.date" class="article-date">
              {{ formatDateOnly(article.reboot_democracy_weekly_news_items_id.date) }}
            </span>
          </div>
          
          <div v-if="article.reboot_democracy_weekly_news_items_id.excerpt" class="article-excerpt">
            {{ article.reboot_democracy_weekly_news_items_id.excerpt }}
          </div>
          
          <a v-if="article.reboot_democracy_weekly_news_items_id.url" 
             :href="article.reboot_democracy_weekly_news_items_id.url" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="article-link">
            Read Full Article <span class="external-link-icon">↗</span>
          </a>
          
          <div class="article-footer">
            <span class="article-collection">
              From: {{ article.parentTitle }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer Component -->
  <footer-comp></footer-comp>
</template>

<style scoped>
.news-page-hero {
  background-color: #f5f7f9;
  padding: 4rem 2rem;
  text-align: center;
  margin-bottom: 2rem;
}

.news-page-hero h1 {
  margin: 0;
  font-size: 2.5rem;
}

.news-page-hero .eyebrow {
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
  color: #1d72b8;
}

.weekly-news-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.news-article {
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.article-title {
  margin: 0 0 0.5rem;
  color: #333;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
  align-items: center;
}

.article-excerpt {
  margin-bottom: 1rem;
  line-height: 1.6;
  font-style: italic;
  color: #555;
  border-left: 3px solid #1d72b8;
  padding-left: 1rem;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.article-category {
  display: inline-block;
  background-color: #e6f0fa;
  color: #1d72b8;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-right: 0.5rem;
}

.article-link {
  display: inline-block;
  color: #1d72b8;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  margin-top: 0.5rem;
}

.article-link:hover {
  color: #0d5291;
  text-decoration: underline;
}

.external-link-icon {
  font-size: 0.8em;
  margin-left: 3px;
}

.loader-blog {
  display: block;
  margin: 4rem auto;
  width: 50px;
  height: 50px;
  border: 3px solid rgba(29, 114, 184, 0.3);
  border-radius: 50%;
  border-top-color: #1d72b8;
  animation: spin 1s ease-in-out infinite;
}

/* Category Filter */
.category-filter {
  margin-bottom: 2rem;
  background-color: #f5f7f9;
  padding: 1.5rem;
  border-radius: 8px;
}

.category-filter h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.category-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-btn {
  padding: 0.5rem 1rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.category-btn:hover {
  background-color: #f0f4f8;
}

.category-btn.active {
  background-color: #1d72b8;
  color: white;
  border-color: #1d72b8;
}

.error-message,
.no-articles-message {
  max-width: 1200px;
  margin: 3rem auto;
  padding: 2rem;
  text-align: center;
  background-color: #f5f7f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.all-articles-container {
  margin-top: 2rem;
}

.articles-count {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #666;
  background-color: #f0f4f8;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  display: inline-block;
}

.article-collection {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

.article-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #eee;
}

.reset-filter-btn,
.reload-btn {
  background-color: #1d72b8;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.reset-filter-btn:hover,
.reload-btn:hover {
  background-color: #0d5291;
}

/* Grid Layout Styles */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.grid-article {
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 0; /* Override default margin */
  border: 1px solid #d1e1f0; /* Light blue border */
  box-shadow: 0 2px 6px rgba(29, 114, 184, 0.08);
}

.grid-article .article-excerpt {
  flex-grow: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.grid-article .article-link {
  margin-top: auto;
  padding-top: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .news-page-hero {
    padding: 3rem 1rem;
  }
  
  .weekly-news-container {
    padding: 0 1rem 3rem;
  }
  
  .news-article {
    padding: 1.5rem;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .category-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .article-header {
    flex-direction: column;
  }
  
  .article-category {
    margin-top: 0.5rem;
    align-self: flex-start;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
  }
}
</style>