<template>
  <div class="about-container">
    <TitleText level="h1" weight="bold" fontFamily="var(--font-habibi)">About Us</TitleText>
    <Text margin="md" fontFamily="habibi">
      <p>Democracy is in crisis, but not beyond repair. At Reboot, we explore how artificial intelligence—if designed and governed wisely—can help strengthen our democratic institutions rather than weaken them.</p>
      <p>Where commercial AI often optimizes for profit or control, we are interested in Democratic AI: tools, policies and practices that expand our collective ability to gather knowledge, deliberate choices, and deliver public action.</p>
              <p>This blog is edited by <strong>Beth Simone Noveck,</strong> with contributions from <a href="/about#team-editorial-section">colleagues</a> at the <strong>GovLab and the Burnes Center for Social Change. The Reboot Blog</strong> is a partner project of <strong>InnovateUS</strong>.</p>
      <p>Here we publish:</p>
      <ul>
      <li>Timely analysis of how governments and communities are experimenting with AI in practice to solve problems.</li>

      <li>Critical reflection on how AI can address democracy’s crises—of truth, legitimacy, participation, and governance.</li>

      <li>Case studies and interviews that show how institutions are using AI to listen better, learn faster, and deliver more fairly.</li>
      </ul>
      <p>Repairing and improving our democratic institutions is a political imperative and a design challenge—one that demands the same urgency and ambition we devote to climate or public health. By sharing insights here, we aim to build the conversation—and the practical know-how—that will allow us to treat democracy with the same seriousness we bring to our greatest scientific challenges. </p>
      <p>Want to write for us? Email <a href="mailto:beth@thegovlab.org">here</a></p>
      <p>Beth Simone Noveck is Professor at Northeastern University, 
        where she directs the Burnes Center for Social Change and founded 
        The Governance Lab. Former U.S. Deputy Chief Technology Officer and current New Jersey Chief AI Strategist,
        her latest book is Reboot: The Race to Save Democracy with AI. Read more about her at <a href="http://thegovlab.org/beth-simone-noveck.html">LINK</a></p>
    </Text>
    
    <div class="team-section" id="team-editorial-section">
      <TitleText level="h1" weight="bold" fontFamily="var(--font-habibi)">Editorial Team</TitleText>
  
      <div class="team-editorial-grid" id="team-editorial-grid">
        <div 
          v-for="member in validEditorialTeamMembers" 
          :key="member.id" 
          class="team-member"
        >
          <div class="member-photo" fontFamily="var(--font-habibi)">
            <img
              v-if="member.Headshot"
              :src="getImageUrl(member.Headshot, 512)"
              :alt="`${member.First_Name} ${member.Last_Name}`"
            />
            <div v-else class="photo-placeholder"></div>
          </div>
          
          <div class="member-info">
            <TitleText level="h3" weight="bold" fontFamily="var(--font-sora)" color="text-dark">{{ member.First_Name }} {{ member.Last_Name }}</TitleText>
            <Text 
              as="p" 
              class="member-title" 
              color="text-tertiary" 
              size="sm"
              fontFamily="habibi"
              marginBottom="md"
            >{{ member.Title }}</Text>
            
            <a
              v-if="member.Link_to_bio"
              :href="member.Link_to_bio"
              rel="noopener noreferrer"
              class="bio-link"
            >
              <Text as="span" color="link-primary" weight="medium" size="sm" fontFamily="habibi">View Bio</Text>
            </a>
          </div>
        </div>

        
      </div>
    </div>

    <div class="team-section">
      <TitleText level="h1" weight="bold" fontFamily="var(--font-habibi)">Production Team</TitleText>
      
      <div class="team-production-grid" id="team-production-grid">
        <div 
          v-for="member in validProductionTeamMembers" 
          :key="member.id" 
          class="team-member"
        >
          <div class="member-photo" fontFamily="var(--font-habibi)">
            <img
              v-if="member.Headshot"
              :src="getImageUrl(member.Headshot, 512)"
              :alt="`${member.First_Name} ${member.Last_Name}`"
            />
            <div v-else class="photo-placeholder"></div>
          </div>
          
          <div class="member-info">
            <TitleText level="h3" weight="bold" fontFamily="var(--font-sora)" color="text-dark">{{ member.First_Name }} {{ member.Last_Name }}</TitleText>
            <Text 
              as="p" 
              class="member-title" 
              color="text-tertiary" 
              size="sm"
              fontFamily="habibi"
              marginBottom="md"
            >{{ member.Title }}</Text>
            
            <a
              v-if="member.Link_to_bio"
              :href="member.Link_to_bio"
              rel="noopener noreferrer"
              class="bio-link"
            >
              <Text as="span" color="link-primary" weight="medium" size="sm" fontFamily="habibi">View Bio</Text>
            </a>
          </div>
        </div>

        
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { fetchEditorialTeamData, fetchProductionTeam } from '~/composables/fetchAboutData';
import { useRoute } from 'vue-router';
import { nextTick } from 'vue'; 

const { data: teamData, pending, error } = await useAsyncData("team-data", async () => {
  try {
    const[Editorial, Production] = await Promise.all([fetchEditorialTeamData(), fetchProductionTeam()]);
    return { Editorial, Production };
  } catch (err) {
    console.error('Error fetching team data:', err);
    throw err;
  }
}, { server: true })

const EditorialTeam = computed(() => teamData.value?.Editorial);

const ProductionTeam = computed(() => teamData.value?.Production);

const route = useRoute();

const validEditorialTeamMembers = computed(() => {
  const team = EditorialTeam?.value;
  if (!team || !Array.isArray(team)) {
    return [];
  }
  
  return team.filter((member) => {
    const hasName = member.First_Name && member.Last_Name;
    const hasHeadshot = member.Headshot?.id;
    const hasBio = member.Link_to_bio?.trim && member.Link_to_bio.trim().length > 0;
    return hasName && (hasHeadshot || hasBio);
  });
});

const validProductionTeamMembers = computed(() => {
  const team = ProductionTeam?.value;
  if (!team || !Array.isArray(team)) {
    return [];
  }
  
  return team.filter((member) => {
    const hasName = member.First_Name && member.Last_Name;
    const hasHeadshot = member.Headshot?.id;
    const hasBio = member.Link_to_bio?.trim && member.Link_to_bio.trim().length > 0;
    return hasName && (hasHeadshot || hasBio);
  });
})

//smooth scroll
watch(validEditorialTeamMembers, async (isLoading) => {
  if (!isLoading && route.hash === '#team-editorial-section') {
    await nextTick();
    const el = document.getElementById('team-editorial-section');
    if (el) {
      el.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }
});

</script>

<style>
.about-container ul li{
  font-size: 20px;
  line-height: 30px;
  font-family: var(--font-habibi);
  color: #333333;
  margin: 0.5rem 0;
  padding: 0.25rem 0;
}

#team-editorial-section {
  scroll-margin-top: 5rem;
  padding-top: 2rem;
}
</style>
