<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Icon from './components/Icon.vue';
import { store } from './store.js';
const route = useRoute(),
  router = useRouter(),
  menu = ref(false),
  loggingOut = ref(false);
watch(
  () => route.fullPath,
  () => {
    menu.value = false;
  }
);
function skipToContent() {
  const main = document.getElementById('main');
  main?.focus();
  main?.scrollIntoView({ block: 'start' });
}
async function logout() {
  loggingOut.value = true;
  try {
    await store.logout();
    router.push('/');
  } catch (e) {
    store.notice = e.message;
  } finally {
    loggingOut.value = false;
  }
}
</script>
<template>
  <a class="skip-link" href="#main" @click.prevent="skipToContent">Skip to content</a>
  <div class="top-note">
    Good things happen when you show up.
    <RouterLink to="/events">Find your next thing <span aria-hidden="true">↗</span></RouterLink>
  </div>
  <header class="site-header">
    <div class="container header-inner">
      <RouterLink class="brand" to="/" aria-label="Campus Events Hub home"
        ><span class="brand-symbol"><Icon name="spark" :size="27" /></span
        ><span>campus<span class="brand-sub">events hub</span></span></RouterLink
      ><button
        class="mobile-menu icon-button"
        aria-label="Toggle navigation"
        :aria-expanded="menu"
        aria-controls="main-navigation"
        @click="menu = !menu"
      >
        <Icon :name="menu ? 'close' : 'menu'" />
      </button>
      <nav id="main-navigation" :class="{ open: menu }" aria-label="Main navigation">
        <RouterLink to="/events">Explore events</RouterLink
        ><RouterLink to="/clubs">Clubs & societies</RouterLink
        ><RouterLink to="/calendar">Calendar</RouterLink
        ><RouterLink v-if="store.user" to="/my-events">My events</RouterLink>
      </nav>
      <div class="account-actions">
        <template v-if="store.user"
          ><RouterLink v-if="store.canManage" class="text-link" to="/manage">Workspace</RouterLink
          ><RouterLink class="avatar" to="/profile" :aria-label="`Profile: ${store.user.name}`">{{
            store.user.name.slice(0, 1).toUpperCase()
          }}</RouterLink
          ><button class="plain-button" :disabled="loggingOut" @click="logout">
            Log out
          </button></template
        ><template v-else
          ><RouterLink class="login-link" to="/login">Log in</RouterLink
          ><RouterLink class="button small" to="/register"
            >Join the Hub <Icon name="arrow" :size="16" /></RouterLink
        ></template>
      </div>
    </div>
  </header>
  <main id="main" tabindex="-1">
    <div v-if="store.error" class="container">
      <div class="alert error" role="alert">
        {{ store.error }}
        <button class="plain-button" @click="store.initialize()">Try again</button>
      </div>
    </div>
    <div v-if="store.notice" class="container">
      <p class="alert" role="status">{{ store.notice }}</p>
    </div>
    <RouterView :key="route.path" />
  </main>
  <section class="community-band">
    <div class="container community-inner">
      <div>
        <span class="eyebrow">YOUR CAMPUS. YOUR COMMUNITY.</span>
        <h2>There’s a place for you here.</h2>
        <p>Find the people, ideas, and experiences that make campus yours.</p>
      </div>
      <RouterLink to="/clubs" class="button light"
        >Find your community <Icon name="arrow" :size="18"
      /></RouterLink>
    </div>
  </section>
  <footer class="site-footer container">
    <div class="footer-top">
      <RouterLink to="/" class="brand"
        ><span class="brand-symbol"><Icon name="spark" :size="25" /></span
        ><span>campus<span class="brand-sub">events hub</span></span></RouterLink
      >
      <p>A little more connected.<br />A little more you.</p>
      <nav aria-label="Footer navigation">
        <RouterLink to="/about">About the Hub</RouterLink
        ><RouterLink to="/help">Help & FAQs</RouterLink
        ><RouterLink to="/calendar">Event calendar</RouterLink>
      </nav>
    </div>
    <div class="footer-bottom">
      <span>© {{ new Date().getFullYear() }} Campus Events Hub · COS30043 student project</span
      ><span>Sample activities & clubs for demonstration. Times: Malaysia (UTC+8).</span>
    </div>
  </footer>
</template>
