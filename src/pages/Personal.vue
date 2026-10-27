<script setup>
import { computed, ref, watch } from 'vue';
import { store } from '../store.js';
import EventCard from '../components/EventCard.vue';
import ClubCard from '../components/ClubCard.vue';
import Pagination from '../components/Pagination.vue';
const props = defineProps({ mode: String });
const page = ref(1);
watch(
  () => props.mode,
  () => (page.value = 1)
);
const events = computed(() =>
  store.events.filter((e) =>
    (props.mode === 'liked' ? store.liked : store.registered).includes(e.id)
  )
);
const clubs = computed(() => store.clubs.filter((c) => store.memberships.includes(c.id)));
</script>
<template>
  <div class="container page-space">
    <div class="page-heading">
      <span class="eyebrow">YOUR LITTLE CORNER OF CAMPUS</span>
      <h1>
        {{
          mode === 'profile'
            ? 'Hello, ' + store.user?.name + '.'
            : mode === 'liked'
              ? 'Things you love.'
              : 'See you there.'
        }}
      </h1>
      <p>
        {{
          mode === 'profile'
            ? 'Your profile, your communities, your campus.'
            : mode === 'liked'
              ? 'A little inspiration for your next campus moment.'
              : 'Your registered events, all in one place.'
        }}
      </p>
    </div>
    <nav class="tabs" aria-label="Your account">
      <RouterLink to="/my-events"
        >My events <span>{{ store.registered.length }}</span></RouterLink
      ><RouterLink to="/liked"
        >Liked events <span>{{ store.liked.length }}</span></RouterLink
      ><RouterLink to="/profile">My profile</RouterLink
      ><RouterLink v-if="store.canManage" to="/manage">Organizer workspace</RouterLink>
    </nav>
    <template v-if="mode === 'profile'"
      ><div class="profile-card">
        <span class="avatar large">{{ store.user?.name.slice(0, 1).toUpperCase() }}</span>
        <div>
          <h2>{{ store.user?.name }}</h2>
          <p>{{ store.user?.email }}</p>
          <span class="role-badge">{{ store.user?.role }}</span>
        </div>
      </div>
      <p v-if="!store.canManage" class="muted">
        Organizing an event? Ask your project administrator to enable organizer access for your
        account.
      </p>
      <h2 class="section-title">Your communities</h2>
      <div class="row g-4">
        <div v-for="club in clubs" :key="club.id" class="col-md-6 col-lg-4">
          <ClubCard :club="club" />
        </div>
      </div>
      <div v-if="!clubs.length" class="empty-state">
        <h3>Your people are out there.</h3>
        <p>Join a club to see it here.</p>
        <RouterLink to="/clubs" class="button">Explore communities ↗</RouterLink>
      </div></template
    ><template v-else
      ><div class="row g-4">
        <div
          v-for="event in events.slice((page - 1) * 6, page * 6)"
          :key="event.id"
          class="col-md-6 col-lg-4"
        >
          <EventCard :event="event" />
        </div>
      </div>
      <div v-if="!events.length" class="empty-state">
        <h2>
          {{ mode === 'liked' ? 'What catches your eye?' : 'A little room for something new.' }}
        </h2>
        <p>
          {{
            mode === 'liked'
              ? 'Tap the heart on an event to find it here.'
              : 'Register for an event and it will appear here.'
          }}
        </p>
        <RouterLink to="/events" class="button">Find your next thing ↗</RouterLink>
      </div>
      <Pagination v-model:page="page" :total="events.length"
    /></template>
  </div>
</template>
