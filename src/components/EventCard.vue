<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Artwork from './Artwork.vue';
import Icon from './Icon.vue';
import { store, dateLabel, priceLabel } from '../store.js';
const props = defineProps({ event: Object });
const router = useRouter();
const busy = ref(false);
const error = ref('');
async function like() {
  if (!store.user) {
    router.push({ path: '/login', query: { redirect: `/events/${props.event.id}` } });
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    await store.toggleLike(props.event.id);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <article class="event-card">
    <div class="card-visual">
      <RouterLink :to="`/events/${event.id}`" tabindex="-1" aria-hidden="true"
        ><Artwork :theme="event.artwork" /></RouterLink
      ><span class="price-pill">{{ priceLabel(event.price) }}</span
      ><button
        class="like-button"
        :class="{ liked: store.liked.includes(event.id) }"
        :aria-label="`${store.liked.includes(event.id) ? 'Unlike' : 'Like'} ${event.title}`"
        :aria-pressed="store.liked.includes(event.id)"
        :disabled="busy"
        @click="like"
      >
        <Icon name="heart" :size="18" />
      </button>
    </div>
    <div class="card-copy">
      <span class="eyebrow category-label">{{ event.category }}</span>
      <h3>
        <RouterLink :to="`/events/${event.id}`">{{ event.title }}</RouterLink>
      </h3>
      <p class="event-meta">
        <Icon name="calendar" :size="15" />{{ dateLabel(event.date) }} <span>·</span>
        {{ event.time }}
      </p>
      <p class="event-meta"><Icon name="pin" :size="15" />{{ event.location }}</p>
      <div class="card-bottom">
        <span>{{ event.clubName }}</span
        ><span class="like-count"><Icon name="heart" :size="13" />{{ event.likes }}</span>
      </div>
      <p v-if="error" role="alert" class="error-text">{{ error }}</p>
    </div>
  </article>
</template>
