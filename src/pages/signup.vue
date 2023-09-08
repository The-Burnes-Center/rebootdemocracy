



<script>
import { ref, watch } from 'vue';
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';

// import { $vfm, VueFinalModal, ModalsContainer } from 'vue-final-modal'

import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import MailingListComponent from "../components/mailing.vue";
// import { register } from 'swiper/element/bundle';
// import {useHead } from '@vueuse/head'


export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
    "mailing-list-comp": MailingListComponent,

  //   "generative-ai-banner-comp":GenerativeAIBannerComponent,
  //   "ws-banner":WsBanner,
  //       VueFinalModal,
  //   ModalsContainer,
  //   ModalComp,
  },

}
</script>

<template>


 <!-- 
  This events page is driven by the following collections and is concatenated for the purpose of showing all events. If more event sources are added, this list should be udpated.
- All items tagged as event under Reboot Democracy 
- All InnovateUS Workshops  
-->


<!-- Header Component -->
<header-comp></header-comp>

<div class="signup-form" id="mc_embed_shell">
  <h3>Subscribe to Updates from Reboot Democracy</h3>
<div id="mc_embed_signup">
    <form action="https://innovate-us.us14.list-manage.com/subscribe/post?u=36f840aa1f979805ce7b81fa7&amp;id=cb864aff13&amp;f_id=003bf8e0f0" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_self" novalidate="">
        <div id="mc_embed_signup_scroll">
            <div class="indicates-required"><span class="asterisk">*</span> indicates required</div>
            <div class="mc-field-group">
              <label for="mce-EMAIL">Email Address <span class="asterisk">*</span></label><input type="email" name="EMAIL" class="required email" id="mce-EMAIL" required="" value=""></div>
              <div class="mc-field-group"><label for="mce-FNAME">First Name </label><input type="text" name="FNAME" class=" text" id="mce-FNAME" value=""></div>
              <div class="mc-field-group"><label for="mce-LNAME">Last Name </label><input type="text" name="LNAME" class=" text" id="mce-LNAME" value=""></div>
              <div class="mc-field-group"><label for="mce-MMERGE5">Affiliation </label><input type="text" name="MMERGE5" class=" text" id="mce-MMERGE5" value=""></div>
            <div hidden=""><input type="hidden" name="tags" value="7345136"></div>
        <div id="mce-responses" class="clear">
            <div class="response" id="mce-error-response" style="display: none;"></div>
            <div class="response" id="mce-success-response" style="display: none;"></div>
        </div><div aria-hidden="true" style="position: absolute; left: -5000px;"><input type="text" name="b_36f840aa1f979805ce7b81fa7_cb864aff13" tabindex="-1" value=""></div><div class="clear"><input type="submit" class="btn btn-primary btn-dark btn-medium" name="subscribe" id="mc-embedded-subscribe"  value="Subscribe"></div>
    </div>
</form>
</div>
</div>


<footer-comp></footer-comp>

</template>
