
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
    slug: String,
    name: String,
  },
  data() {
    return {
      postData: [],
      slug: this.$route.params.name,
      directus: new Directus("https://content.thegovlab.com/"),
      path: this.$route.fullPath,
    };
  },
  created() {
    
    this.fetchBlog();
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

    fetchBlog: function fetchBlog() {
      self = this;

      this.directus
        .items("reboot_democracy_blog")
        .readByQuery({
          meta: "total_count",
          limit: -1,
          
          fields: ["*.*",
          'authors.team_id.*',
          'authors.team_id.Headshot.*'
          ],
          filter: {
            slug: {
              _eq: this.slug,
            },
          },
        })
        .then((item) => {
          self.postData = item.data;
          console.log( self.postData[0])
          this.fillMeta();
        });
    },
    fillMeta()
    {
      // convert HTML body of Blog Entry into plain text
      var htmlToText = document.createElement('div');
      htmlToText.innerHTML = this.postData[0].content;

     useHead({
      title: "RebootDemocracy.AI Blog | "+this.postData[0].title,
      meta: [
        { name: 'title', content:"RebootDemocracy.AI  Blog | "+this.postData[0].title },
        { property: 'og:title', content: "RebootDemocracy.AI  Blog | "+this.postData[0].title },
        { property: 'og:description', content: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'og:image', content: this.directus._url+'assets/'+postData[0].image.id},
        { property: 'twitter:title', content: "RebootDemocracy.AI"},
        { property: 'twitter:description', content: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'twitter:image', content:  this.directus._url+'assets/'+postData[0].image.id},
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

  <img class="blog-img" :src= "this.directus._url+'assets/'+postData[0].image.id">
  <div class="blog-details">
    <h1>{{postData[0].title}}</h1>
    <p class="excerpt"> {{postData[0].excerpt}}</p>
    <div v-for="(author,i) in postData[0].authors">
      <div class="hero-author-sm">
        <div class="author-item">
          <img class="author-headshot" :src="this.directus._url+'assets/'+author.team_id.Headshot.id">
          <div class="author-details">
            <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
            <a class="author-bio" :href="author.team_id.Link_to_bio">Read Bio</a>
          </div>

        </div>
        <div class="sm-tray">
          <a target="_blank" :href="'http://twitter.com/share?url=https://rebootdemocracy.ai/blog/' + postData[0].slug"><i class="fa-brands fa-square-x-twitter"></i></a>
          <a target="_blank" :href="'https://www.facebook.com/sharer/sharer.php?u=https://rebootdemocracy.ai/blog/' + postData[0].slug"><i class="fa-brands fa-facebook"></i></a>
          <a target="_blank" :href="'https://linkedin.com/shareArticle?url=https://rebootdemocracy.ai/blog/' + postData[0].slug + '&title=' + postData[0].title"><i class="fa-brands fa-linkedin"></i></a>
          <!-- <a><i class="fa-solid fa-link"></i></a> -->
        </div>
      </div>
    </div>
  </div>
</div>

<div class="blog-body">
  <div class="blog-content" v-html="postData[0].content"></div>
</div>

  <!-- Footer Component -->
  <footer-comp></footer-comp>
</template>
