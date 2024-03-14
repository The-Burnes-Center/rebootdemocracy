
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

          // this.debounceSearch = _.debounce(this.searchBlog, 500);
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
            _and: [
            {
            slug: {
              _eq: this.slug,
            },
            }
            ],
          },
        })
        .then((item) => {
          self.postData = item.data;
          item.data.length>0 ? this.fillMeta() :  this.fillMetaDefault()
        });
    },
    fillMeta()
    {
      // convert HTML body of Blog Entry into plain text
      var htmlToText = document.createElement('div');
      htmlToText.innerHTML = this.postData[0].content;
      // console.log(this.postData[0].excerpt)
  
      
     useHead({
      title: "RebootDemocracy.AI Blog | "+this.postData[0].title,
      meta: [
        { name: 'title', content:"RebootDemocracy.AI Blog | "+this.postData[0].title },
        { name: 'description', content: this.postData[0].excerpt!=''?this.postData[0].excerpt: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'og:title', content: "RebootDemocracy.AI Blog | "+this.postData[0].title },
        // { property: 'og:description', content: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'og:description', content: this.postData[0].excerpt!=''?this.postData[0].excerpt: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'og:image', content: this.postData[0].image?this.directus._url+'assets/'+this.postData[0].image.id:this.directus._url+'assets/'+'4650f4e2-6cc2-407b-ab01-b74be4838235'},
        { property: 'twitter:title', content: "RebootDemocracy.AI"},
        { property: 'twitter:description', content: this.postData[0].excerpt!=''?this.postData[0].excerpt: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'twitter:image', content:  this.postData[0].image?this.directus._url+'assets/'+this.postData[0].image.id:this.directus._url+'assets/'+'4650f4e2-6cc2-407b-ab01-b74be4838235'},
        { property: 'twitter:card', content: "summary_large_image" },
      ],
    })
    },
    async fillMetaDefault()
    {
     useHead({
      title: "RebootDemocracy.AI",
      meta: [
        { name: 'title', content:"RebootDemocracy.AI" },
        { property: 'og:title', content: "RebootDemocracy.AI" },
        { property: 'og:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`},
        { property: 'og:image', content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"},
        { property: 'twitter:title', content: "RebootDemocracy.AI"},
        { property: 'twitter:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`},
        { property: 'twitter:image', content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"},
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

  <img v-if="postData[0].image" class="blog-img" :src= "this.directus._url+'assets/'+postData[0].image.id+'?width=800'" />
  
  <div class="blog-details">
    <h1>{{postData[0].title}}</h1>
    <p class="excerpt"> {{postData[0].excerpt}}</p>
    <p class="post-date">Published on <b>{{formatDateOnly(new Date(postData[0].date))}}</b></p>

      <div class="hero-author-sm">
      <div v-for="(author,i) in postData[0].authors">
          <div class="author-item">
            <img v-if="author.team_id.Headshot" class="author-headshot" :src="this.directus._url+'assets/'+author.team_id.Headshot.id">
            <p  v-if="!author.team_id.Headshot" class="author-no-image">{{author.team_id.First_Name[0] }} {{author.team_id.Last_Name[0]}}</p>
            <div class="author-details">
              <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
              <a class="author-bio" :href="author.team_id.Link_to_bio">Read Bio</a>
            </div>
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

<div class="blog-body">
  <div class="audio-version" v-if="postData[0].audio_version">
  <p dir="ltr"><em>Listen to the AI-generated audio version of this piece.&nbsp;</em></p>
    <p><audio controls="controls"><source :src="this.directus._url+'assets/'+postData[0].audio_version.id" type="audio/mpeg" data-mce-fragment="1"></audio></p>
  </div>
    <div class="blog-content" v-html="postData[0].content"></div>
    <p v-if="postData[0].ai_content_disclaimer" class="blog-img-byline">Some images in this post were generated using AI generated.</p>
</div>

  <!-- Footer Component -->
  <footer-comp></footer-comp>
</template>
