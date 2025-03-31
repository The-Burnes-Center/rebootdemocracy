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
    </aside>
  </section>
</template>

<script lang="ts" setup>
const handleRegisterClick = () => {
  console.log('Register button clicked!')
  // Navigate or open modal, etc.
}
</script>

