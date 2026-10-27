<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { store, categories } from '../store.js';
import Artwork from '../components/Artwork.vue';
import EventCard from '../components/EventCard.vue';
import Icon from '../components/Icon.vue';
const search = ref(''),
  router = useRouter();
const featured = computed(() =>
  store.events.filter((e) => new Date(`${e.date}T${e.time}:00+08:00`) > new Date()).slice(0, 3)
);
function find() {
  router.push({ path: '/events', query: search.value.trim() ? { q: search.value.trim() } : {} });
}
</script>
<template>
  <div class="container">
    <section class="hero row align-items-center">
      <div class="col-lg-6 hero-copy">
        <span class="eyebrow"
          ><span class="live-dot"></span> YOUR NEXT GOOD MEMORY STARTS HERE</span
        >
        <h1>
          More than campus.<br /><em>Your kind of<br />community.</em>
        </h1>
        <p>
          Find something that sparks your curiosity. Meet people who get you. Make the most of life
          beyond the lecture hall.
        </p>
        <form class="hero-search" @submit.prevent="find">
          <Icon name="search" /><label class="sr-only" for="home-search">Search events</label
          ><input
            id="home-search"
            v-model="search"
            placeholder="What are you in the mood for?"
          /><button class="button" type="submit">
            Find events <Icon name="arrow" :size="17" />
          </button>
        </form>
        <div class="hero-proof">
          <span class="mini-faces" aria-hidden="true"><b>✳</b><b>☺</b><b>✺</b></span
          ><span
            >A whole campus of possibilities.<br /><strong>Find where you belong.</strong></span
          >
        </div>
      </div>
      <div class="col-lg-6 hero-poster">
        <Artwork theme="art" hero /><span class="floating-note"
          ><Icon name="spark" :size="17" /> Less scrolling. More showing up.</span
        >
      </div>
    </section>
    <section class="browse-strip">
      <span class="eyebrow">FOLLOW YOUR CURIOSITY</span>
      <div class="category-chips">
        <RouterLink
          v-for="(category, i) in categories"
          :key="category"
          :to="{ path: '/events', query: { category } }"
          class="category-chip"
          ><span :class="`category-dot dot-${i}`">{{ ['✳', '⌘', '↗', '☺', '✦', '♧'][i] }}</span
          >{{ category }}</RouterLink
        >
      </div>
    </section>
    <section class="section-block">
      <div class="section-heading">
        <div>
          <span class="eyebrow">STEP OUT. JOIN IN.</span>
          <h2>Coming up on campus<span class="heading-dot">.</span></h2>
          <p>A few good reasons to clear a little space in your calendar.</p>
        </div>
        <RouterLink to="/events" class="text-link"
          >Explore all events <Icon name="arrow" :size="18"
        /></RouterLink>
      </div>
      <div class="row g-4">
        <div v-for="event in featured" :key="event.id" class="col-md-6 col-lg-4">
          <EventCard :event="event" />
        </div>
      </div>
      <p v-if="!featured.length && !store.error" class="empty-state">
        No upcoming events yet. Check back soon.
      </p>
    </section>
    <section class="club-teaser row g-0">
      <div class="col-md-5 teaser-art" aria-hidden="true">
        <span class="teaser-flower">✳</span
        ><span class="teaser-word">better<br /><em>together.</em></span
        ><span class="little-star">✦</span>
      </div>
      <div class="col-md-7 teaser-copy">
        <span class="eyebrow">FIND YOUR PEOPLE</span>
        <h2>Big interests.<br />Even better company.</h2>
        <p>
          From creative experiments to weekend adventures, there’s a club for every side of you.
          Discover a familiar interest or try something completely new.
        </p>
        <RouterLink to="/clubs" class="button"
          >Explore clubs & societies <Icon name="arrow" :size="18"
        /></RouterLink>
      </div>
    </section>
    <div class="sample-note">
      <Icon name="spark" :size="15" /><span
        >This is a student project. All listed clubs and activities are sample content.</span
      >
    </div>
  </div>
</template>
