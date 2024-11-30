<script>
import { ref, watch } from 'vue';
import { createDirectus, rest, readItems } from '@directus/sdk';
//import format from 'date-fns/format';
//import isPast from 'date-fns/isPast';
//import isFuture from 'date-fns/isFuture';

import { VueFinalModal, ModalsContainer } from 'vue-final-modal';

import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
// import ModalComp from "../components/modal.vue";
import MailingListComponent from "../components/mailing.vue";
// import OpenAIChat from "../components/pschat.vue";

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
    "mailing-list-comp": MailingListComponent,
    // "openai-chat": OpenAIChat,
    VueFinalModal,
    ModalsContainer,
  },
  data() {
    return {
      model: 0,
      indexData: [],
      eventsData: [],
      featuredData: [],
      researchData: [],
      writingData: [],
      teachingData: [],
      engagementData: [],
      eelData: [],
      modalData: [],
      showmodal: false,
      moreresourceData: [],
      item_counter: 0,
      directus: createDirectus('https://content.thegovlab.com').with(rest()),
      path: this.$route.fullPath,
    };
  },
  watch: {
    '$route': {
      handler: function (r) {
        // this.loadModal();
      },
      deep: true,
      immediate: true,
    },
  },
  created() {
    this.item_counter = 0;
    // this.loadModal();
    this.fetchEvents();
    this.fetchFeatured();
    this.fetchIndex();
    // this.fetchResearch();
    // this.fetchWriting();
    // this.fetchEngagements();
    // this.fetchEEL();
    // this.fetchTeaching();
    // this.fetchMoreResources();
  },
  methods: {
    // Date formatting methods
    formatDateTime: function (d1) {
      return format(d1, 'MMMM d, yyyy, h:mm aa');
    },
    formatDateOnly: function (d1) {
      return format(d1, 'MMMM d, yyyy');
    },
    PastDate: function (d1) {
      return isPast(d1);
    },
    FutureDate: function (d1) {
      return isFuture(new Date(d1));
    },

    // Fetch methods updated with new SDK
    fetchIndex: function () {
      const self = this;
      this.directus
        .request(
          readItems('reboot_democracy', {
            meta: 'total_count',
            limit: -1,
            fields: ['*.*'],
          })
        )
        .then((data) => {
          self.indexData = data;
        })
        .catch((error) => {
          console.error('Error fetching index data:', error);
        });
    },
    fetchEvents: function () {
      const self = this;
      this.directus
        .request(
          readItems('reboot_democracy_resources', {
            filter: {
              _and: [
                { type: { _eq: 'Event' } },
                { date: { _gte: '$NOW' } },
              ],
            },
            meta: 'total_count',
            limit: 2,
            sort: ['date'],
            fields: ['*.*', 'thumbnail.*', 'event_series.general_events_series_id.*'],
          })
        )
        .then((data) => {
          self.eventsData = data;
        })
        .catch((error) => {
          console.error('Error fetching events data:', error);
        });
    },
    fetchFeatured: function () {
      const self = this;
      this.directus
        .request(
          readItems('reboot_democracy_blog', {
            filter: {
              status: { _eq: 'published' },
            },
            meta: 'total_count',
            limit: 6,
            sort: ['-date'],
            fields: [
              '*.*',
              'authors.team_id.*',
              'authors.team_id.Headshot.*',
            ],
          })
        )
        .then((data) => {
          self.featuredData = data;
          // self.preloadImages();
        })
        .catch((error) => {
          console.error('Error fetching featured data:', error);
        });
    },
    // Update other fetch methods similarly...

    // loadModal() {
    //   const self = this;
    //   this.directus
    //     .request(
    //       readItems('reboot_democracy_modal', {
    //         meta: 'total_count',
    //         limit: -1,
    //         fields: ['*.*'],
    //       })
    //     )
    //     .then((data) => {
    //       self.modalData = data[0]; // Assuming you want the first item
    //       const storageItem = localStorage.getItem("Reboot Democracy");
    //       self.showmodal =
    //         self.modalData.status === 'published' &&
    //         (self.modalData.visibility === 'always' ||
    //           (self.modalData.visibility === 'once' && storageItem !== 'off'));
    //     })
    //     .catch((error) => {
    //       console.error('Error fetching modal data:', error);
    //     });
    // },
    // closeModal() {
    //   this.showmodal = false;
    //   localStorage.setItem("Reboot Democracy", "off");
    // },
    // preloadImages() {
    //   this.featuredData.forEach(item => {
    //     if (item.image) {
    //       const img = new Image();
    //       img.src = this.directus.url + 'assets/' + item.image.id + '?width=438';
    //     }
    //   });
    // },
    // ... other methods, updated similarly
  },
};
</script>