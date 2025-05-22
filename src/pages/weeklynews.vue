<script>
import { ref, watch } from 'vue';
import { Directus } from "@directus/sdk";
import format from "date-fns/format";
import isPast from "date-fns/isPast";
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import { VueFinalModal, ModalsContainer } from 'vue-final-modal';
import ModalComp from "../components/modal.vue";
import { useHead } from '@vueuse/head';
import { fetchPostData } from '../helpers/weeklyNewsHelper.js';

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
    "ws-banner": VueFinalModal,
    ModalsContainer,
    ModalComp,
  },
  props: {
    slug: String,
    name: String,
  },
  data() {
    return {
      model: 0,
      postData: [],
      slug: this.$route.params.name,
      modalData: [],
      showmodal: false,
      directus: new Directus("https://directus.theburnescenter.org/"),
      path: this.$route.fullPath,
    };
  },
  computed: {
    // Compute unique categories from nested items.
    // Use the actual category if present; otherwise, fallback to "News that caught our eye".
    uniqueCategories() {
      if (!this.postData.length || !this.postData[0].items) return [];
      const cats = this.postData[0].items.map(
        item => item.reboot_democracy_weekly_news_items_id.category || "News that caught our eye"
      );
      return [...new Set(cats)];
    }
  },
  watch: {
    '$route': {
      handler() {
        this.loadModal();
      },
      deep: true,
      immediate: true
    },
  },
  created() {
    this.loadModal();
    this.fetchBlog();
  },
  methods: {
    formatTimeOnly(d1) {
      return format(d1, "h:mm aa");
    },
    formatDateTime(d1) {
      return format(d1, "MMMM d, yyyy, h:mm aa");
    },
    formatDateOnly(d1) {
      return format(d1, "MMMM d, yyyy");
    },
    PastDate(d1) {
      return isPast(d1);
    },
    async fetchBlog() {
      try {
        const response = await fetchPostData.call(this, this.slug);
        this.postData = response.data;
        if (this.postData.length === 0) {
          window.location.href = "/";
        }
        console.log(this.postData);
        this.postData.length > 0 ? this.fillMeta() : this.fillMetaDefault();
      } catch (error) {
        console.error("An error occurred while fetching the blog data: ", error);
      }
    },
    loadModal() {
      this.directus
        .items('reboot_democracy_modal')
        .readByQuery({
          meta: 'total_count',
          limit: -1,
          fields: ['*.*']
        })
        .then(item => {
          this.modalData = item.data;
          console.log(this.modalData);
          let storageItem = localStorage.getItem("Reboot Democracy");
          this.showmodal = this.modalData.status === 'published' &&
            (this.modalData.visibility === 'always' || (this.modalData.visibility === 'once' && storageItem !== 'off'));
        });
    },
    closeModal() {
      this.showmodal = false;
      localStorage.setItem("Reboot Democracy", "off");
    },
    fillMeta() {
      // Use the edition's summary (since there's no 'content' property) to create plain text.
      const htmlToText = document.createElement('div');
      htmlToText.innerHTML = this.postData[0].summary;
      const imageUrl = this.postData[0].image
        ? this.directus._url + 'assets/' + this.postData[0].image.filename_disk
        : this.directus._url + 'assets/4650f4e2-6cc2-407b-ab01-b74be4838235';
      const imageWidth = this.postData[0].image && this.postData[0].image.width ? this.postData[0].image.width : '';
      const imageHeight = this.postData[0].image && this.postData[0].image.height ? this.postData[0].image.height : '';
      useHead({
        title: "RebootDemocracy.AI Blog | " + this.postData[0].title,
        meta: [
          { name: 'title', content: "RebootDemocracy.AI Blog | " + this.postData[0].title },
          { name: 'description', content: this.postData[0].summary !== '' ? this.postData[0].summary : htmlToText.textContent.substring(0, 200) + '...' },
          { property: 'og:title', content: "RebootDemocracy.AI Blog | " + this.postData[0].title },
          { property: 'og:type', content: "website" },
          { property: 'og:url', content: "https://rebootdemocracy.ai/newsthatcaughtoureye/" + this.postData[0].edition },
          { property: 'og:description', content: this.postData[0].summary !== '' ? this.postData[0].summary : htmlToText.textContent.substring(0, 200) + '...' },
          { property: 'og:image', content: "https://rebootdemocracy.ai/assets/newsheader.40a0340b.jpg" },
          { property: 'og:image:width', content: imageWidth },
          { property: 'og:image:height', content: imageHeight },
          { property: 'twitter:title', content: "RebootDemocracy.AI" },
          { property: 'twitter:description', content: this.postData[0].summary !== '' ? this.postData[0].summary : htmlToText.textContent.substring(0, 200) + '...' },
          { property: 'twitter:image', content: "https://rebootdemocracy.ai/assets/newsheader.40a0340b.jpg" },
          { property: 'twitter:card', content: "summary_large_image" },
        ],
      });
    },
    async fillMetaDefault() {
      useHead({
        title: "RebootDemocracy.AI",
        meta: [
          { name: 'title', content: "RebootDemocracy.AI" },
          { property: 'og:title', content: "RebootDemocracy.AI" },
          { property: 'og:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. ...` },
          { property: 'og:image', content: "https://rebootdemocracy.ai/assets/newsheader.40a0340b.jpg" },
          { property: 'og:type', content: "website" },
          { property: 'og:url', content: "https://rebootdemocracy.ai" },
          { property: 'twitter:title', content: "RebootDemocracy.AI" },
          { property: 'twitter:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. ...` },
          { property: 'twitter:image', content: "https://rebootdemocracy.ai/assets/newsheader.40a0340b.jpg" },
          { property: 'twitter:card', content: "summary_large_image" },
        ],
      });
    },
  },
};
</script>

<template>

    <!-- Header Component -->
    <header-comp></header-comp>

    <div class="weeklynews-hero">
          <img v-if="!postData[0].image" class="weeklynews-img" src= "../assets/newsheader.jpg" />
          <img v-if="postData[0].image"  class="weeklynews-img" :src= "'https://directus.theburnescenter.org/assets/'+ postData[0].image.id" />
        
      <div class="weeklynews-details">
        <h1>{{postData[0].title}}</h1>
         <p>Published by {{postData[0].author}} on {{ formatDateOnly(new Date(postData[0].date)) }} </p>
      </div>
    </div>
    <!-- Table of Contents -->
    <div class="toc">
      <p class="excerpt"> {{postData[0].summary}}</p><br>
      <p><strong>In the news this week</strong></p>
      <ul>
        <li v-for="cat in uniqueCategories" :key="cat">
          <a :href="'#' + cat.toLowerCase().replace(/\s+/g, '')">
            <strong>{{ cat }}:</strong>
          </a>
          <span class="toc-description">
            {{
              cat === 'AI and Elections' ? 'Free, fair and frequent' :
              cat === 'Governing AI' ? 'Setting the rules for a fast-moving technology.' :
              cat === 'AI for Governance' ? 'Smarter public institutions through machine intelligence.' :
              cat === 'AI and Public Engagement' ? 'Bolstering participation' :
              cat === 'AI and Problem Solving' ? 'Research, applications, technical breakthroughs' :
              cat === 'AI Infrastructure' ? 'Computing resources, data systems and energy use' :
              cat === 'AI and International Relations (IR)' ? "Global cooperation—or competition—over AI's future" :
              cat === 'AI and Education' ? 'Preparing people for an AI-driven world' :
              cat === 'AI and Public Safety' ? 'Law enforcement, disaster prevention and preparedness' :
              cat === 'AI and Labor' ? 'Worker rights, safety and opportunity' :
              'News that caught our eye'
            }}
          </span>
        </li>
      </ul>
    </div>
    <div class="news-items" v-if="postData[0].events">
          <h2 class="group-heading">
          Upcoming Events
        </h2>
       <div class="news-item" v-html="postData[0].events">
      </div>
    </div>

        <div class="news-items" v-if="postData[0].announcements">
          <h2 class="group-heading">
          Special Announcements
        </h2>
       <div class="news-item" v-html="postData[0].announcements">
      </div>
    </div>

    <!-- Grouped News Items by Category -->
    <div class="news-items">
      <div v-for="cat in uniqueCategories" :key="cat">
        <h2 :id="cat.toLowerCase().replace(/\s+/g, '')" class="group-heading">
          {{ cat }}
        </h2>
        <div v-for="item in postData[0].items.filter(item => (item.reboot_democracy_weekly_news_items_id.category || 'News that caught our eye') === cat)"
             :key="item.reboot_democracy_weekly_news_items_id.id"
             class="news-item">
          <p class="category-badge">
            <span>{{ item.reboot_democracy_weekly_news_items_id.category || 'News that caught our eye' }}</span>
          </p>
          <h4 class="item-title"><strong>{{ item.reboot_democracy_weekly_news_items_id.title }}</strong></h4>
          <div class="item-meta">
            <p><em>
              {{ item.reboot_democracy_weekly_news_items_id.author }} on 
              {{ formatDateOnly(new Date(item.reboot_democracy_weekly_news_items_id.date)) }} in 
               {{ item.reboot_democracy_weekly_news_items_id.publication }} 
            </em></p>
          </div>
          <p class="item-excerpt">{{item.reboot_democracy_weekly_news_items_id.excerpt}}</p>
          <a :href="item.reboot_democracy_weekly_news_items_id.url" class="read-article" target="_blank">
            Read article
          </a>

          <div v-if="item.reboot_democracy_weekly_news_items_id.related_links != ''" class="weekly-news-related-articles">
            <p><b>Related Articles:</b></p>
            <ul>
              <li v-for="related_item in item.reboot_democracy_weekly_news_items_id.related_links">
                <a  :href="related_item.reboot_weekly_news_related_news_id.link">{{related_item.reboot_weekly_news_related_news_id.title}}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Component -->
    <footer-comp></footer-comp>

</template>

