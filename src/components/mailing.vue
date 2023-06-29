<script>
import { Directus } from '@directus/sdk';

export default {

  data() {
    return {
      aboutData: [],
      directus: new Directus('https://content.thegovlab.com/'),
    }
  },
  created() {
    this.fetchAbout();
  },
  methods: {
    fetchAbout: function fetchAbout() {
    
      this.directus
      .items('innovate_us')
      .readByQuery({
         meta: 'total_count',
         limit: -1,
         fields: [
          '*.*'
       ]
      })
      .then((item) => {
      this.aboutData =  item.data;
      });
    }

  }
}
</script>
<template>
  <div class="mailing-list-section">
    <div class="row">
      <div class="col-60">
        <h3>Want to be a part of our community of innovators?</h3>
        <p>We’d love to keep in touch!</p>
      </div>
      <div class="col-40">
        <a href="mailinglist" class="btn btn-secondary btn-medium">Sign up to learn about our free programs</a>
      </div>
    </div>
  </div>
</template>
