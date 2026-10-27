<script setup>
import { ref, computed, watch } from 'vue';
import { store, api, dateLabel } from '../store.js';
import Pagination from '../components/Pagination.vue';
const kind = ref('events'),
  page = ref(1),
  deleting = ref(null),
  busy = ref(false),
  error = ref('');
const items = computed(() => store[kind.value].filter((i) => store.owns(i)));
watch(kind, () => {
  page.value = 1;
  deleting.value = null;
  error.value = '';
});
async function remove() {
  busy.value = true;
  error.value = '';
  try {
    await api(`/${kind.value}/${deleting.value.id}`, 'DELETE', {});
    await store.refresh();
    deleting.value = null;
    page.value = Math.max(1, Math.min(page.value, Math.ceil(items.value.length / 8)));
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="container page-space">
    <div class="section-heading">
      <div class="page-heading">
        <span class="eyebrow">BRING PEOPLE TOGETHER</span>
        <h1>Your organizer <em>workspace.</em></h1>
        <p>
          {{
            store.user?.role === 'admin'
              ? 'Administrator access: manage all event and club content.'
              : 'Create and manage the content you own.'
          }}
        </p>
      </div>
      <RouterLink :to="`/${kind}/new`" class="button"
        >+ Create {{ kind === 'events' ? 'event' : 'club' }}</RouterLink
      >
    </div>
    <div class="tabs">
      <button :class="{ active: kind === 'events' }" @click="kind = 'events'">Events</button
      ><button :class="{ active: kind === 'clubs' }" @click="kind = 'clubs'">Clubs</button>
    </div>
    <div v-if="deleting" class="delete-confirm" role="region" aria-label="Confirm content deletion">
      <h2>Delete “{{ deleting.title || deleting.name }}”?</h2>
      <p>
        This removes the content and its associated likes, memberships, or registrations. This
        action cannot be undone.
      </p>
      <p v-if="error" class="error-text" role="alert">{{ error }}</p>
      <div class="button-row">
        <button class="button danger" :disabled="busy" @click="remove">
          {{ busy ? 'Deleting…' : 'Delete permanently' }}</button
        ><button class="button outline" :disabled="busy" @click="deleting = null">Keep it</button>
      </div>
    </div>
    <div class="table-scroll">
      <table>
        <caption class="sr-only">
          {{
            kind === 'events' ? 'Events' : 'Clubs'
          }}
          you can manage
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ kind === 'events' ? 'Event' : 'Club' }}</th>
            <th scope="col">Category</th>
            <th scope="col">{{ kind === 'events' ? 'Date' : 'Members' }}</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items.slice((page - 1) * 8, page * 8)" :key="item.id">
            <td>
              <RouterLink :to="`/${kind}/${item.id}`">{{ item.title || item.name }}</RouterLink>
            </td>
            <td>{{ item.category }}</td>
            <td>{{ kind === 'events' ? dateLabel(item.date) : item.members }}</td>
            <td>
              <div class="table-actions">
                <RouterLink :to="`/${kind}/${item.id}/edit`" class="text-link">Edit</RouterLink
                ><button
                  class="plain-button danger-text"
                  @click="
                    deleting = item;
                    error = '';
                  "
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!items.length" class="empty-state">
      <h2>Start something good.</h2>
      <p>You have no {{ kind }} to manage yet. Create your first one above.</p>
    </div>
    <Pagination v-model:page="page" :total="items.length" :page-size="8" />
  </div>
</template>
