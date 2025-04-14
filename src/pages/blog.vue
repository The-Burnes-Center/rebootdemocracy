<script>
import { ref, watch } from 'vue';
import { Directus } from "@directus/sdk";
import format from "date-fns/format";
import isPast from "date-fns/isPast";
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import { VueFinalModal, ModalsContainer } from 'vue-final-modal';
import ModalComp from "../components/modal.vue";
import { useHead } from '@vueuse/head'

import { fetchBlogData } from '../helpers/blogHelper.js';

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
      directus: new Directus("https://dev.thegovlab.com/"),
      path: this.$route.fullPath,
    };
  },
  watch: {
    '$route': {
      handler: function(r) {
        this.loadModal(); 
      },
      deep: true,
      immediate: true
    },
  },
  computed: {
    // This computed property parses the raw blog content and replaces any
    // URLs with base "https://dev.thegovlab.com/assets/" with a DigitalOcean Spaces URL
    // wrapped via the Netlify Images proxy.
    processedContent() {
      if (!this.postData || !this.postData[0] || !this.postData[0].content) return '';
      return this.postData[0].content.replace(
        /https:\/\/dev\.thegovlab\.com\/assets\/([a-zA-Z0-9\-]+)(\.[a-zA-Z]+)(\?[^"']*)?/g,
        (match, fileId, ext) => {
          return `/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/' + fileId + ext)}&w=800`;
        }
      );
    }
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
      self = this;
      try {
        const response = await fetchBlogData.call(this, this.slug);
        self.postData = response.data;
        if (self.postData.length === 0) {
          window.location.href = "/";
        }
        console.log(self.postData);
        self.postData.length > 0 ? this.fillMeta() : this.fillMetaDefault();
      } catch (error) {
        console.error("An error occurred while fetching the blog data: ", error);
      }
    },
    loadModal() {
      self = this;
      this.directus
        .items('reboot_democracy_modal')
        .readByQuery({     
          meta: 'total_count',
          limit: -1,
          fields: ['*.*']
        }).then((item) => {
          self.modalData = item.data;
          console.log(self.modalData);
          let storageItem = localStorage.getItem("Reboot Democracy");
          self.showmodal = self.modalData.status == 'published' && (self.modalData.visibility == 'always' || (self.modalData.visibility == 'once' && storageItem != 'off'));
        })
    },
    closeModal() {
      this.showmodal = false;
      localStorage.setItem("Reboot Democracy", "off");
    },
    fillMeta() {
      // Convert HTML content to plain text for meta description
      var htmlToText = document.createElement('div');
      htmlToText.innerHTML = this.postData[0].content;
      
      useHead({
        title: "RebootDemocracy.AI Blog | " + this.postData[0].title,
        meta: [
          { name: 'title', content: "RebootDemocracy.AI Blog | " + this.postData[0].title },
          { name: 'description', content: this.postData[0].excerpt !== '' ? this.postData[0].excerpt : htmlToText.textContent.substring(0,200) + '...' },
          { property: 'og:title', content: "RebootDemocracy.AI Blog | " + this.postData[0].title },
          { property: 'og:description', content: this.postData[0].excerpt !== '' ? this.postData[0].excerpt : htmlToText.textContent.substring(0,200) + '...' },
          { property: 'og:image', content: this.postData[0].image ? `/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/' + this.postData[0].image.filename_disk)}&w=800` : `/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/4650f4e2-6cc2-407b-ab01-b74be4838235')}&w=800` },
          { property: 'og:type', content: "website" },
          { property: 'og:url', content: "https://ssg-test.rebootdemocracy.ai/blog/" + this.postData[0].slug },
          { property: 'twitter:title', content: "RebootDemocracy.AI" },
          { property: 'twitter:description', content: this.postData[0].excerpt !== '' ? this.postData[0].excerpt : htmlToText.textContent.substring(0,200) + '...' },
          { property: 'twitter:image', content: this.postData[0].image ? `/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/' + this.postData[0].image.filename_disk)}&w=800` : `/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/4650f4e2-6cc2-407b-ab01-b74be4838235')}&w=800` },
          { property: 'twitter:card', content: "summary_large_image" },
        ],
      })
    },
    async fillMetaDefault() {
      useHead({
        title: "RebootDemocracy.AI",
        meta: [
          { name: 'title', content: "RebootDemocracy.AI" },
          { property: 'og:title', content: "RebootDemocracy.AI" },
          { property: 'og:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 
          
1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.
          
Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` },
          { property: 'og:image', content: `/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/41462f51-d8d6-4d54-9fec-5f56fa2ef05b')}&w=800` },
          { property: 'og:type', content: "website" },
          { property: 'og:url', content: "https://ssg-test.rebootdemocracy.ai/" },
          { property: 'twitter:title', content: "RebootDemocracy.AI" },
          { property: 'twitter:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 
          
1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.
          
Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` },
          { property: 'twitter:image', content: `/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/41462f51-d8d6-4d54-9fec-5f56fa2ef05b')}&w=800` },
          { property: 'twitter:card', content: "summary_large_image" },
        ],
      })
    },
  },
};
</script>

<template>
  <!-- Header Component -->
  <header-comp></header-comp>
asdasd
  <div class="blog-hero">
    <!-- Static hero image using Netlify images transformation -->
    <img :src="`/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/4b15233a-16ed-4cef-8935-124455a382f0.png')}&w=100`" />
    <!-- Post image using the filename from DO Spaces -->
    <img v-if="postData[0] && postData[0].image" class="blog-img" :src="`/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/' + postData[0].image.filename_disk)}&w=800`" />

    <div class="blog-details">
      <h1>{{postData[0].title}}</h1>
      <p class="excerpt">{{postData[0].excerpt}}</p>
      <p class="post-date">Published on <b>{{formatDateOnly(new Date(postData[0].date))}}</b></p>

      <div class="hero-author-sm">
        <div v-for="(author, i) in postData[0].authors" :key="i">
          <div class="author-item">
            <!-- Author headshot using DigitalOcean filename -->
            <img v-if="author.team_id.Headshot" class="author-headshot" :src="`/.netlify/images?url=${encodeURIComponent('https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/' + author.team_id.Headshot.filename_disk)}&w=300`" />
            <p v-else class="author-no-image">{{ author.team_id.First_Name[0] }} {{ author.team_id.Last_Name[0] }}</p>
            <div class="author-details">
              <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
              <a class="author-bio" v-if="author.team_id.Link_to_bio" :href="author.team_id.Link_to_bio">Read Bio</a>
            </div>
          </div>
        </div>
        <div class="sm-tray">
          <a target="_blank" :href="'http://twitter.com/share?url=https://rebootdemocracy.ai/blog/' + postData[0].slug"><i class="fa-brands fa-square-x-twitter"></i></a>
          <a target="_blank" :href="'https://www.facebook.com/sharer/sharer.php?u=https://rebootdemocracy.ai/blog/' + postData[0].slug"><i class="fa-brands fa-facebook"></i></a>
          <a target="_blank" :href="'https://linkedin.com/shareArticle?url=https://rebootdemocracy.ai/blog/' + postData[0].slug + '&title=' + postData[0].title"><i class="fa-brands fa-linkedin"></i></a>
          <a target="_blank" :href="'https://bsky.app/intent/compose?text=https://rebootdemocracy.ai/blog/' + postData[0].slug"><i class="fa-brands fa-square-bluesky"></i></a>
        </div>
      </div>
    </div>
  </div>

  <div class="blog-body">
    <div class="audio-version" v-if="postData[0].audio_version">
      <p dir="ltr"><em>Listen to the AI-generated audio version of this piece.&nbsp;</em></p>
      <p>
        <audio controls="controls">
          <source :src="`https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/${postData[0].audio_version.filename_disk}`" type="audio/mpeg" data-mce-fragment="1">
        </audio>
      </p>
    </div>
    <div class="blog-content" v-html="processedContent"></div>
    <p v-if="postData[0].ai_content_disclaimer" class="blog-img-byline">Some images in this post were generated using AI.</p>
  </div>

  <!-- Footer Component -->
  <footer-comp></footer-comp>
</template>