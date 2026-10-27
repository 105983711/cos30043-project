<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store } from '../store.js';
import EventCard from '../components/EventCard.vue';
import Pagination from '../components/Pagination.vue';
const route = useRoute(),
  router = useRouter(),
  error = ref(''),
  busy = ref(false),
  page = ref(1);
const club = computed(() => store.clubs.find((c) => c.id === Number(route.params.id))),
  events = computed(() => store.events.filter((e) => e.clubId === club.value?.id));
async function join() {
  if (!store.user) {
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    await store.toggleMembership(club.value.id);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="container page-space">
    <RouterLink to="/clubs" class="back-link">← All clubs & societies</RouterLink
    ><template v-if="club"
      ><section class="club-detail-head">
        <span class="club-mark large" :class="club.color">{{ club.initials }}</span>
        <div>
          <span class="eyebrow">{{ club.category }}</span>
          <h1>{{ club.name }}</h1>
          <p>{{ club.description }}</p>
          <p class="muted">
            {{ club.members }} {{ club.members === 1 ? 'member' : 'members' }} · Sample student
            society
          </p>
          <div class="button-row">
            <button class="button" :disabled="busy" @click="join">
              {{ store.memberships.includes(club.id) ? 'Leave this club' : 'Join this community' }}
              <span aria-hidden="true">↗</span></button
            ><RouterLink
              v-if="store.owns(club)"
              :to="`/clubs/${club.id}/edit`"
              class="button outline"
              >Edit club</RouterLink
            >
          </div>
          <p v-if="store.memberships.includes(club.id)" role="status" class="success-text">
            You’re part of this community. Welcome!
          </p>
          <p v-if="error" role="alert" class="error-text">{{ error }}</p>
          <p class="fine-print">
            Contact: {{ club.contact }} · Sample contact; no messages are sent by this app.
          </p>
        </div>
      </section>
      <section class="section-block">
        <div class="section-heading">
          <h2>What’s happening with us</h2>
          <RouterLink to="/events" class="text-link">Explore all events ↗</RouterLink>
        </div>
        <div class="row g-4">
          <div
            v-for="event in events.slice((page - 1) * 6, page * 6)"
            :key="event.id"
            class="col-md-6 col-lg-4"
          >
            <EventCard :event="event" />
          </div>
        </div>
        <p v-if="!events.length" class="empty-state">No events listed yet. Check back soon.</p>
        <Pagination v-model:page="page" :total="events.length" /></section
    ></template>
    <div v-else class="empty-state">
      <h1>Club not found</h1>
      <RouterLink to="/clubs">Browse clubs</RouterLink>
    </div>
  </div>
</template>
