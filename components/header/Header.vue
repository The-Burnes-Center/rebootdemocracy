<template>
  <header class="header-section">
    <h1>Nuxt Vue Blog app- Header component</h1>
    <p>This is the header component</p>
   
     <Button
      label="Learn more"
      bgColor="#FAFAFA"
      textColor="#0d63eb"
      borderColor="#0d63eb"
      :opacity="0.2"
      :onClick="handleClick"
    />
  </header>
</template>

<script setup></script>
