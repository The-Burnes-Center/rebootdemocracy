<template>
  <section class="page-layout">
    <article class="left-content">
      <PostCard
        tag="Internet Archive Book Talk"
        titleText="Copyright, AI, and Great Power Competition"
        author="Jane Doe"
        excerpt="A new paper by Joshua Levine and Tim Hwang explores how different nations approach AI policy and copyright regulation, and also what’s at stake in the battle for technological dominance."
        imageUrl="/images/exampleImage.png"
        :date="new Date()"
        :tagIndex="1"
        variant="default"
        :hoverable="true"
      />
    </article>
    
    <aside class="right-content">
      <UpcomingCard
        title="Copyright, AI, and Great Power Competition"
        excerpt="A new paper by Joshua Levine and Tim Hwang explores how different nations approach AI policy and copyright regulation, and also what’s at stake in the battle for technological dominance.!"
        imageUrl="/images/exampleImage.png"
        :onClick="handleRegisterClick"
      />
      <SignUpButtonWidget 
        title="Sign Up for updates"
        placeholder="Enter your email"
        buttonLabel="Sign Up"
        backgroundColor="#F9F9F9"
      />
      <AuthorBadge
        name="Tiago C. Peixoto"
        title="Senior Public Sector Specialist"
        imageUrl="/images/exampleImage.png"
      />
      <CuratorBadge
        name="Beth Simone Noveck"
        title="Director at Burnes Center and the Govlab"
        imageUrl="/images/exampleImage.png"
        moreText="More incredible things Beth done in in her"
      />
      <AuthorCard
        name="Clara Langevin"
        title="AI Policy Specialist"
        bio="Clara Langevin is an AI Policy Specialist on the Emerging Technologies team. She focuses on promoting responsible AI adoption across different sectors and creating policy guidance on AI and data ethics, transparency, and explainability."
        imageUrl="/images/exampleImage.png"
        articlesLink="/authors/clara-langevin"
      />
    </aside>
  </section>
</template>

<script lang="ts" setup>
const handleRegisterClick = () => {
  console.log('Register button clicked!')
  // Navigate or open modal, etc.
}
</script>

