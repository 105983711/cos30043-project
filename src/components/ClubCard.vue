<script setup>
defineProps({ club: Object });
</script>
<template>
  <article class="club-card">
    <span class="club-mark" :class="club.color">{{ club.initials }}</span
    ><span class="eyebrow">{{ club.category }}</span>
    <h3>
      <RouterLink :to="`/clubs/${club.id}`">{{ club.name }}</RouterLink>
    </h3>
    <p>{{ club.description }}</p>
    <RouterLink :to="`/clubs/${club.id}`" class="text-link"
      >Meet the club <span aria-hidden="true">↗</span></RouterLink
    >
  </article>
</template>
