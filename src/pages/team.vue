<template>
  <div>
    <header-component></header-component>
    <div class="team-title">
        <h1>Our Team</h1>
    </div>
    <div class="teamContainer">
    <div v-for="team_item in teamData">
        <card-component 
        :fname="team_item.First_Name"
        :lname="team_item.Last_Name"
        :bio="team_item.Link_to_bio"
        :title="team_item.Title"
        :imgUrl = "this.directus._url + 'assets/' + team_item.Headshot.id"
         />
    </div>
    </div>
    <footer-component></footer-component>
  </div>
</template>

<script>
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import img1 from '../assets/hero.png';
import CardComponent from '../components/card.vue';
import { Directus } from '@directus/sdk';


export default {
  components: {
    'card-component': CardComponent, // Register the child component
    'header-component': HeaderComponent,
    'footer-component': FooterComponent
  },


  data() {
    return {
      teamData:[],
      directus: new Directus('https://content.thegovlab.com/'),
      url:'https://content.thegovlab.com/',
      path:this.$route.fullPath,
    }
  },
  created() {
    this.indexData = this.directus.items("reboot_democracy");
    this.fetchTeamData();
},
methods: {

    fetchTeamData: function fetchTeamData() {
    self = this;

  this.directus
  .items('Reboot_Democracy_team')
  .readByQuery({
     meta: 'total_count',
     limit: -1,
     fields: [
      '*.*'
   ],
   
  })
  .then((item) => {
  self.teamData =  item.data;
  });
},
}
};
</script>
