
<script>
import { ref } from "vue";
import { Directus } from "@directus/sdk";
import format from "date-fns/format";
import isPast from "date-fns/isPast";
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import {useHead } from '@vueuse/head'

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,

  },
  props: {
    blogslug: String,
    name: String,
  },
  data() {
    return {
      aboutData: [],
      blogslug: this.$route.params.name,
      directus: new Directus("https://content.thegovlab.com/"),
      path: this.$route.fullPath,
    };
  },
  created() {
    
    this.fetchAbout();
  },

  methods: {
    formatTimeOnly: function formatTimeOnly(d1) {
      return format(d1, "h:mm aa");
    },
    formatDateTime: function formatDateTime(d1) {
      return format(d1, "MMMM d, yyyy, h:mm aa");
    },
    formatDateOnly: function formatDateOnly(d1) {
      return format(d1, "MMMM d, yyyy");
    },
    PastDate: function PastDate(d1) {
      return isPast(d1);
    },

    fetchAbout: function fetchAbout() {
      self = this;

      this.directus
        .items("innovate_us_blog")
        .readByQuery({
          meta: "total_count",
          limit: -1,
          
          fields: ["*.*",
                  "thumbnail.*",
          ],
          filter: {
            slug: {
              _eq: this.blogslug,
            },
          },
        })
        .then((item) => {
          self.aboutData = item.data;
          this.fillMeta();
        });
    },
    fillMeta()
    {
      // convert HTML body of Blog Entry into plain text
      var htmlToText = document.createElement('div');
      htmlToText.innerHTML = this.aboutData[0].post_content;

     useHead({
      title: "RebootDemocracy.AI Blog | "+this.aboutData[0].title,
      meta: [
        { name: 'title', content:"RebootDemocracy.AI  Blog | "+this.aboutData[0].title },
        { property: 'og:title', content: "RebootDemocracy.AI  Blog | "+this.aboutData[0].title },
        { property: 'og:description', content: htmlToText.textContent.substring(0,200)+'...'},
        // { property: 'og:image', content: "https://innovate-us.org/innovateus_meta.jpg"},
        { property: 'twitter:title', content: "RebootDemocracy.AI"},
        { property: 'twitter:description', content: htmlToText.textContent.substring(0,200)+'...'},
        // { property: 'twitter:image', content: "https://innovate-us.org/innovateus_meta.jpg"},
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
<div class="blog-hero">

  <div v-if="aboutData[0].thumbnail" class="blog-img" :style="{ backgroundImage: 'url(' + this.directus._url+'assets/'+aboutData[0].thumbnail.id+ ')' }">

  </div>
  <div class="blog-details">
    <h1 v-if="aboutData[0].title.length < 80">{{aboutData[0].title}}</h1>
    <h1 v-if="aboutData[0].title.length > 81" class="small-title">{{aboutData[0].title}}</h1>
    <h5 class="lede">{{aboutData[0].author}}</h5>
    <!-- <h6 class="lede">{{ formatDateOnly(new Date(aboutData[0].date)) }}</h6> -->
  </div>

  
</div>

<div class="blog-body" v-html="aboutData[0].post_content">

</div>

  <!-- Footer Component -->
  <footer-comp></footer-comp>
</template>
