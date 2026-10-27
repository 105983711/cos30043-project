<script setup>
import { reactive, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store, api, categories, locations } from '../store.js';
const props = defineProps({ kind: String });
const route = useRoute(),
  router = useRouter(),
  busy = ref(false),
  error = ref('');
const editing = Boolean(route.params.id);
const original = store[props.kind].find((i) => i.id === Number(route.params.id));
const permitted = computed(() => !editing || (original && store.owns(original)));
const form = reactive(
  props.kind === 'events'
    ? {
        title: '',
        clubId: store.clubs[0]?.id || '',
        category: categories[0],
        date: '',
        time: '18:00',
        location: locations[0],
        price: 0,
        capacity: 40,
        description: '',
        artwork: 'art',
      }
    : {
        name: '',
        category: categories[0],
        description: '',
        contact: '',
        initials: '',
        color: 'peach',
      }
);
if (original) Object.keys(form).forEach((k) => (form[k] = original[k]));
async function submit() {
  busy.value = true;
  error.value = '';
  try {
    const result = await api(
      `/${props.kind}${editing ? '/' + route.params.id : ''}`,
      editing ? 'PUT' : 'POST',
      form
    );
    await store.refresh();
    router.push(`/${props.kind}/${result.id}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="container page-space narrow">
    <RouterLink to="/manage" class="back-link">← Organizer workspace</RouterLink
    ><template v-if="permitted"
      ><div class="page-heading">
        <span class="eyebrow">GIVE YOUR COMMUNITY SOMETHING TO LOOK FORWARD TO</span>
        <h1>{{ editing ? 'Edit' : 'Create' }} {{ kind === 'events' ? 'an event' : 'a club' }}.</h1>
        <p>Fields marked * are required. Details are validated before they are saved.</p>
      </div>
      <form class="content-form" @submit.prevent="submit">
        <div class="row g-4">
          <template v-if="kind === 'events'"
            ><div class="col-12 field">
              <label for="title">Event title *</label
              ><input id="title" v-model.trim="form.title" required minlength="5" maxlength="100" />
            </div>
            <div class="col-md-6 field">
              <label for="host">Host club *</label
              ><select id="host" v-model.number="form.clubId" required>
                <option v-for="club in store.clubs" :key="club.id" :value="club.id">
                  {{ club.name }}
                </option></select
              ><small v-if="!store.clubs.length">Create a club before adding an event.</small>
            </div></template
          ><template v-else
            ><div class="col-12 field">
              <label for="club-name">Club name *</label
              ><input
                id="club-name"
                v-model.trim="form.name"
                required
                minlength="3"
                maxlength="80"
              /></div
          ></template>
          <div class="col-md-6 field">
            <label for="form-category">Category *</label
            ><select id="form-category" v-model="form.category" required>
              <option v-for="c in categories" :key="c">{{ c }}</option>
            </select>
          </div>
          <template v-if="kind === 'events'"
            ><div class="col-md-6 field">
              <label for="event-date">Date *</label
              ><input id="event-date" v-model="form.date" type="date" required />
            </div>
            <div class="col-md-6 field">
              <label for="event-time">Time (Malaysia, UTC+8) *</label
              ><input id="event-time" v-model="form.time" type="time" required />
            </div>
            <div class="col-md-6 field">
              <label for="event-location">Campus location *</label
              ><select id="event-location" v-model="form.location" required>
                <option v-for="l in locations" :key="l">{{ l }}</option>
              </select>
            </div>
            <div class="col-md-6 field">
              <label for="price">Price (RM) *</label
              ><input
                id="price"
                v-model.number="form.price"
                type="number"
                required
                min="0"
                max="10000"
                step="0.01"
              /><small>Use 0 for a free event. Payments are not collected in this app.</small>
            </div>
            <div class="col-md-6 field">
              <label for="capacity">Capacity *</label
              ><input
                id="capacity"
                v-model.number="form.capacity"
                type="number"
                required
                min="1"
                max="10000"
                step="1"
              />
            </div>
            <div class="col-md-6 field">
              <label for="artwork">Visual theme *</label
              ><select id="artwork" v-model="form.artwork">
                <option v-for="t in ['art', 'tech', 'sport', 'social', 'career', 'green']" :key="t">
                  {{ t }}
                </option>
              </select>
            </div></template
          ><template v-else
            ><div class="col-md-6 field">
              <label for="contact">Contact email *</label
              ><input
                id="contact"
                v-model.trim="form.contact"
                type="email"
                required
                maxlength="254"
              />
            </div>
            <div class="col-md-6 field">
              <label for="initials">Club initials *</label
              ><input
                id="initials"
                v-model.trim="form.initials"
                required
                pattern="[A-Za-z0-9]{1,3}"
                maxlength="3"
              /><small>1–3 letters or numbers.</small>
            </div>
            <div class="col-md-6 field">
              <label for="color">Club colour *</label
              ><select id="color" v-model="form.color">
                <option v-for="c in ['peach', 'lavender', 'lime', 'pink', 'blue', 'mint']" :key="c">
                  {{ c }}
                </option>
              </select>
            </div></template
          >
          <div class="col-12 field">
            <label for="description">Description *</label
            ><textarea
              id="description"
              v-model.trim="form.description"
              rows="7"
              required
              minlength="30"
              maxlength="5000"
            ></textarea
            ><small>30–5,000 characters. Include what to expect and what to bring.</small>
          </div>
        </div>
        <p v-if="error" class="alert error" role="alert">{{ error }}</p>
        <div class="button-row form-bottom">
          <button
            type="submit"
            class="button"
            :disabled="busy || (kind === 'events' && !store.clubs.length)"
          >
            {{
              busy
                ? 'Saving…'
                : editing
                  ? 'Save changes'
                  : 'Publish ' + (kind === 'events' ? 'event' : 'club')
            }}</button
          ><RouterLink class="button outline" to="/manage">Cancel</RouterLink>
        </div>
      </form></template
    >
    <div v-else class="empty-state">
      <h1>Content unavailable</h1>
      <p>This item does not exist or you do not have permission to edit it.</p>
    </div>
  </div>
</template>
