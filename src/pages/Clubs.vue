<script setup>
import { ref, computed, watch } from 'vue';
import { store, categories } from '../store.js';
import ClubCard from '../components/ClubCard.vue';
import Pagination from '../components/Pagination.vue';
const query = ref(''),
  category = ref(''),
  sort = ref('name'),
  page = ref(1);
const filtered = computed(() =>
  store.clubs
    .filter(
      (c) =>
        (!category.value || c.category === category.value) &&
        `${c.name} ${c.description}`.toLowerCase().includes(query.value.toLowerCase().trim())
    )
    .sort((a, b) =>
      sort.value === 'members' ? b.members - a.members : a.name.localeCompare(b.name)
    )
);
watch([query, category, sort], () => (page.value = 1));
</script>
<template>
  <div class="container page-space">
    <div class="page-heading">
      <span class="eyebrow">YOU DON'T HAVE TO FIND YOUR PEOPLE BY CHANCE</span>
      <h1>Your interests.<br /><em>Your people.</em></h1>
      <p>Find a shared passion. Make a new connection. There’s a club for that.</p>
    </div>
    <div class="club-filters">
      <div>
        <label for="club-search">Search clubs</label
        ><input id="club-search" v-model="query" type="search" placeholder="Find your community" />
      </div>
      <div>
        <label for="club-category">Interest</label
        ><select id="club-category" v-model="category">
          <option value="">All interests</option>
          <option v-for="c in categories" :key="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label for="club-sort">Sort by</label
        ><select id="club-sort" v-model="sort">
          <option value="name">Name A–Z</option>
          <option value="members">Most members</option>
        </select>
      </div>
    </div>
    <p class="muted" aria-live="polite">{{ filtered.length }} communities to explore</p>
    <div class="row g-4">
      <div
        v-for="club in filtered.slice((page - 1) * 6, page * 6)"
        :key="club.id"
        class="col-md-6 col-lg-4"
      >
        <ClubCard :club="club" />
      </div>
    </div>
    <div v-if="!filtered.length" class="empty-state">
      <h2>No clubs match yet.</h2>
      <button
        class="button"
        @click="
          query = '';
          category = '';
        "
      >
        Clear filters
      </button>
    </div>
    <Pagination v-model:page="page" :total="filtered.length" />
  </div>
</template>
