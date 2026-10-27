<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store, dateLabel, priceLabel } from '../store.js';
import Artwork from '../components/Artwork.vue';
import Icon from '../components/Icon.vue';
import EventCard from '../components/EventCard.vue';
const route = useRoute(),
  router = useRouter(),
  busy = ref(false),
  error = ref('');
const event = computed(() => store.events.find((e) => e.id === Number(route.params.id)));
const related = computed(() =>
  store.events
    .filter((e) => e.id !== event.value?.id && e.category === event.value?.category)
    .slice(0, 3)
);
const past = computed(
  () => event.value && new Date(`${event.value.date}T${event.value.time}:00+08:00`) < new Date()
);
async function action(kind) {
  if (!store.user) {
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  error.value = '';
  busy.value = true;
  try {
    if (kind === 'like') await store.toggleLike(event.value.id);
    else await store.toggleRegistration(event.value.id);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
function calendarDownload() {
  const e = event.value;
  const start = new Date(`${e.date}T${e.time}:00+08:00`);
  const end = new Date(start.getTime() + 2 * 3600000);
  const stamp = (d) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const escape = (s) =>
    s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const data = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Events Hub//EN',
    'BEGIN:VEVENT',
    `UID:event-${e.id}@campus-events-hub`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(e.title)}`,
    `LOCATION:${escape(e.location)}`,
    `DESCRIPTION:${escape(e.description + ' Suggested duration: two hours; confirm with the organizer.')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([data], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `campus-event-${e.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>
<template>
  <div class="container page-space">
    <RouterLink to="/events" class="back-link">← All events</RouterLink
    ><template v-if="event"
      ><div class="detail-grid">
        <article>
          <Artwork class="detail-art" :theme="event.artwork" />
          <div class="detail-copy">
            <span class="eyebrow">{{ event.category }}</span>
            <h1>{{ event.title }}</h1>
            <p class="host-line">
              Brought to you by
              <RouterLink :to="`/clubs/${event.clubId}`">{{ event.clubName }}</RouterLink>
            </p>
            <h2>A little about this event</h2>
            <p class="long-copy">{{ event.description }}</p>
            <h2>Everyone starts somewhere.</h2>
            <p>
              Come as you are. If you need access arrangements, contact the host club before the
              event so they can help you plan your visit.
            </p>
            <RouterLink
              v-if="store.owns(event)"
              :to="`/events/${event.id}/edit`"
              class="button outline"
              >Edit this event</RouterLink
            >
          </div>
        </article>
        <aside class="booking-panel">
          <span class="eyebrow">MAKE A LITTLE ROOM FOR THIS</span
          ><strong class="booking-price">{{ priceLabel(event.price) }}</strong>
          <p class="muted">
            {{
              Number(event.price) === 0
                ? 'No ticket cost. Just bring yourself.'
                : 'Sample ticket price; no online payment is collected.'
            }}
          </p>
          <dl class="event-facts">
            <div>
              <dt><Icon name="calendar" />When</dt>
              <dd>
                {{
                  dateLabel(event.date, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                }}
              </dd>
            </div>
            <div>
              <dt><Icon name="clock" />Time</dt>
              <dd>{{ event.time }} · Malaysia time (UTC+8)</dd>
            </div>
            <div>
              <dt><Icon name="pin" />Where</dt>
              <dd>{{ event.location }}</dd>
            </div>
            <div>
              <dt><Icon name="people" />Spaces</dt>
              <dd>
                {{ Math.max(0, event.capacity - event.attendees) }} of {{ event.capacity }} spots
                available
              </dd>
            </div>
          </dl>
          <button
            class="button full"
            :disabled="
              busy ||
              (!store.registered.includes(event.id) && (past || event.attendees >= event.capacity))
            "
            @click="action('register')"
          >
            {{
              store.registered.includes(event.id)
                ? 'Cancel my registration'
                : past
                  ? 'Registration closed'
                  : event.attendees >= event.capacity
                    ? 'Event is full'
                    : 'Count me in'
            }}<Icon name="arrow" :size="17" /></button
          ><button
            class="button outline full"
            :disabled="busy"
            :aria-pressed="store.liked.includes(event.id)"
            @click="action('like')"
          >
            <Icon name="heart" :size="17" />{{
              store.liked.includes(event.id) ? 'Liked — remove like' : 'Like this event'
            }}
            · {{ event.likes }}</button
          ><button class="plain-button full calendar-download" @click="calendarDownload">
            <Icon name="calendar" :size="17" /> Add to my calendar
          </button>
          <p v-if="store.registered.includes(event.id)" role="status" class="success-text">
            You’re on the list. See you there!
          </p>
          <p v-if="error" role="alert" class="error-text">{{ error }}</p>
          <p class="fine-print">
            Sample event for demonstration. Calendar exports use a suggested two-hour duration.
          </p>
        </aside>
      </div>
      <section v-if="related.length" class="section-block">
        <div class="section-heading">
          <h2>A little more your speed</h2>
          <RouterLink to="/events" class="text-link">All events ↗</RouterLink>
        </div>
        <div class="row g-4">
          <div v-for="item in related" :key="item.id" class="col-md-6 col-lg-4">
            <EventCard :event="item" />
          </div>
        </div></section
    ></template>
    <div v-else class="empty-state">
      <h1>Event not found</h1>
      <p>It may have been removed by its organizer.</p>
      <RouterLink to="/events" class="button">Explore events</RouterLink>
    </div>
  </div>
</template>
