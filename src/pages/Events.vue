<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store, categories, locations } from '../store.js';
import EventCard from '../components/EventCard.vue';
import Pagination from '../components/Pagination.vue';
import Icon from '../components/Icon.vue';
const route = useRoute(),
  router = useRouter();
const query = ref(String(route.query.q || '')),
  category = ref(String(route.query.category || '')),
  location = ref(String(route.query.location || '')),
  cost = ref(''),
  from = ref(''),
  sort = ref('soonest'),
  page = ref(1);
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return store.events
    .filter(
      (e) =>
        (!q || [e.title, e.description, e.clubName].some((v) => v.toLowerCase().includes(q))) &&
        (!category.value || e.category === category.value) &&
        (!location.value || e.location === location.value) &&
        (!cost.value || (cost.value === 'free' ? e.price === 0 : e.price > 0)) &&
        (!from.value || e.date >= from.value)
    )
    .sort((a, b) =>
      sort.value === 'popular'
        ? b.likes - a.likes
        : sort.value === 'title'
          ? a.title.localeCompare(b.title)
          : sort.value === 'price'
            ? a.price - b.price
            : `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
});
const visible = computed(() => filtered.value.slice((page.value - 1) * 6, page.value * 6));
watch([query, category, location, cost, from, sort], () => {
  page.value = 1;
  router.replace({
    path: '/events',
    query: {
      ...(query.value ? { q: query.value } : {}),
      ...(category.value ? { category: category.value } : {}),
      ...(location.value ? { location: location.value } : {}),
    },
  });
});
function reset() {
  query.value = '';
  category.value = '';
  location.value = '';
  cost.value = '';
  from.value = '';
  sort.value = 'soonest';
}
</script>
<template>
  <div class="container page-space">
    <div class="page-heading">
      <span class="eyebrow">GOOD THINGS ARE HAPPENING</span>
      <h1>Find your next <em>thing.</em></h1>
      <p>A workshop, a new friend, a fresh perspective. Start here.</p>
    </div>
    <div class="listing-layout">
      <aside class="filter-panel">
        <div class="filter-heading">
          <h2>Make it your own</h2>
          <button class="plain-button" @click="reset">Reset</button>
        </div>
        <label for="event-search">Search events</label>
        <div class="input-icon">
          <Icon name="search" :size="18" /><input
            id="event-search"
            v-model="query"
            type="search"
            placeholder="Title, club, or keyword"
          />
        </div>
        <label for="category">Your interests</label
        ><select id="category" v-model="category">
          <option value="">All categories</option>
          <option v-for="c in categories" :key="c">{{ c }}</option></select
        ><label for="location">On campus</label
        ><select id="location" v-model="location">
          <option value="">All locations</option>
          <option v-for="l in locations" :key="l">{{ l }}</option></select
        ><label for="cost">Budget</label
        ><select id="cost" v-model="cost">
          <option value="">Any price</option>
          <option value="free">Free events</option>
          <option value="paid">Paid events</option></select
        ><label for="from-date">From date</label><input id="from-date" v-model="from" type="date" />
        <div class="filter-note">
          <Icon name="calendar" />
          <p>More of a planner?<RouterLink to="/calendar">Try the calendar view ↗</RouterLink></p>
        </div>
      </aside>
      <section aria-label="Event results">
        <div class="results-toolbar">
          <p aria-live="polite">
            <strong>{{ filtered.length }}</strong> events to discover
          </p>
          <label class="sort-label" for="sort"
            >Sort by
            <select id="sort" v-model="sort">
              <option value="soonest">Soonest first</option>
              <option value="popular">Most liked</option>
              <option value="title">Name A–Z</option>
              <option value="price">Price: low to high</option>
            </select></label
          >
        </div>
        <div class="row g-4">
          <div v-for="event in visible" :key="event.id" class="col-md-6">
            <EventCard :event="event" />
          </div>
        </div>
        <div v-if="!filtered.length" class="empty-state">
          <Icon name="search" :size="36" />
          <h2>No matches this time.</h2>
          <p>Try another keyword or loosen your filters.</p>
          <button class="button" @click="reset">Clear filters</button>
        </div>
        <Pagination v-model:page="page" :total="filtered.length" />
      </section>
    </div>
  </div>
</template>
