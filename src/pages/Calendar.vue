<script setup>
import { ref, computed } from 'vue';
import { store, categories, dateLabel } from '../store.js';
import Icon from '../components/Icon.vue';
const now = new Date(),
  year = ref(now.getFullYear()),
  month = ref(now.getMonth()),
  selected = ref(''),
  category = ref('');
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(year.value, month.value, 1)
  )
);
const all = computed(() =>
  store.events.filter((e) => !category.value || e.category === category.value)
);
const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const cells = computed(() => {
  const first = new Date(year.value, month.value, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year.value, month.value, 1 - offset + i);
    const date = key(d);
    return {
      date,
      day: d.getDate(),
      outside: d.getMonth() !== month.value,
      today: date === key(now),
      events: all.value.filter((e) => e.date === date),
    };
  });
});
const agenda = computed(() =>
  all.value.filter((e) =>
    selected.value
      ? e.date === selected.value
      : e.date.startsWith(`${year.value}-${String(month.value + 1).padStart(2, '0')}`)
  )
);
function move(step) {
  const d = new Date(year.value, month.value + step, 1);
  year.value = d.getFullYear();
  month.value = d.getMonth();
  selected.value = '';
}
function today() {
  year.value = now.getFullYear();
  month.value = now.getMonth();
  selected.value = '';
}
</script>
<template>
  <div class="container page-space">
    <div class="page-heading">
      <span class="eyebrow">MAKE ROOM FOR THE GOOD STUFF</span>
      <h1>A month of <em>possibilities.</em></h1>
      <p>See what’s ahead. Choose a day to find your next campus moment.</p>
    </div>
    <div class="calendar-controls">
      <div class="month-controls">
        <button class="icon-button" aria-label="Previous month" @click="move(-1)">←</button>
        <h2 aria-live="polite">{{ monthLabel }}</h2>
        <button class="icon-button" aria-label="Next month" @click="move(1)">→</button
        ><button class="button outline small" @click="today">Today</button>
      </div>
      <label for="calendar-category" class="sort-label"
        >Interest
        <select id="calendar-category" v-model="category">
          <option value="">All interests</option>
          <option v-for="c in categories" :key="c">{{ c }}</option>
        </select></label
      >
    </div>
    <div class="calendar-shell">
      <div class="calendar-week" aria-hidden="true">
        <span v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="day">{{
          day
        }}</span>
      </div>
      <div class="calendar-grid">
        <button
          v-for="cell in cells"
          :key="cell.date"
          class="calendar-cell"
          :class="{ outside: cell.outside, today: cell.today, selected: selected === cell.date }"
          :aria-pressed="selected === cell.date"
          :aria-label="`${dateLabel(cell.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}: ${cell.events.length} events`"
          @click="selected = selected === cell.date ? '' : cell.date"
        >
          <span class="day-number">{{ cell.day }}</span
          ><span
            v-for="e in cell.events.slice(0, 2)"
            :key="e.id"
            class="calendar-event"
            :class="e.artwork"
            ><span>{{ e.time }}</span> {{ e.title }}</span
          ><span v-if="cell.events.length > 2" class="more-events"
            >+{{ cell.events.length - 2 }} more</span
          ><span class="mobile-event-dot" v-if="cell.events.length" aria-hidden="true">●</span>
        </button>
      </div>
    </div>
    <section class="agenda">
      <div class="section-heading">
        <h2>
          {{
            selected
              ? dateLabel(selected, { day: 'numeric', month: 'long' })
              : 'This month at a glance'
          }}
        </h2>
        <button v-if="selected" class="plain-button" @click="selected = ''">
          Show whole month
        </button>
      </div>
      <p aria-live="polite" class="muted">
        {{ agenda.length }} {{ agenda.length === 1 ? 'event' : 'events' }}
      </p>
      <RouterLink
        v-for="event in agenda"
        :key="event.id"
        :to="`/events/${event.id}`"
        class="agenda-item"
        ><span class="agenda-date"
          >{{ dateLabel(event.date, { day: 'numeric' })
          }}<small>{{ dateLabel(event.date, { month: 'short' }) }}</small></span
        >
        <div>
          <span class="eyebrow">{{ event.category }}</span>
          <h3>{{ event.title }}</h3>
          <p>{{ event.time }} · {{ event.location }}</p>
        </div>
        <Icon name="arrow"
      /></RouterLink>
      <div v-if="!agenda.length" class="empty-state">
        <h3>A little open space.</h3>
        <p>No events match this view. Try another day, month, or interest.</p>
      </div>
    </section>
  </div>
</template>
