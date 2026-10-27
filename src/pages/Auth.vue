<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store } from '../store.js';
import Icon from '../components/Icon.vue';
const props = defineProps({ register: Boolean });
const router = useRouter(),
  route = useRoute();
const name = ref(''),
  email = ref(''),
  password = ref(''),
  confirm = ref(''),
  error = ref(''),
  busy = ref(false),
  show = ref(false);
async function submit() {
  error.value = '';
  if (props.register && password.value !== confirm.value) {
    error.value = 'The passwords do not match.';
    return;
  }
  busy.value = true;
  try {
    await store.authenticate(props.register ? '/register' : '/login', {
      name: name.value,
      email: email.value,
      password: password.value,
    });
    const target = String(route.query.redirect || '/my-events');
    router.push(target.startsWith('/') && !target.startsWith('//') ? target : '/my-events');
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="container page-space">
    <div class="auth-layout">
      <div class="auth-aside">
        <span class="eyebrow">A LITTLE MORE CONNECTED</span>
        <h1>Make campus<br /><em>your place.</em></h1>
        <p>
          Save the events you love, join a community, and find a little more to look forward to.
        </p>
        <span class="auth-flower" aria-hidden="true">✳</span>
      </div>
      <section class="auth-form">
        <RouterLink to="/" class="back-link">← Back to the Hub</RouterLink>
        <h2>{{ register ? 'Your next chapter starts here.' : 'Good to see you again.' }}</h2>
        <p class="muted">
          {{
            register
              ? 'Create your account to get involved.'
              : 'Log in and pick up where you left off.'
          }}
        </p>
        <form @submit.prevent="submit">
          <div v-if="register" class="field">
            <label for="name">Your name</label
            ><input
              id="name"
              v-model="name"
              autocomplete="name"
              required
              minlength="2"
              maxlength="80"
              placeholder="How should we call you?"
            />
          </div>
          <div class="field">
            <label for="email">Email address</label
            ><input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              maxlength="254"
              placeholder="you@example.edu"
            />
          </div>
          <div class="field">
            <div class="label-row">
              <label for="password">Password</label
              ><button
                type="button"
                class="plain-button"
                :aria-pressed="show"
                @click="show = !show"
              >
                {{ show ? 'Hide' : 'Show' }}
              </button>
            </div>
            <input
              id="password"
              v-model="password"
              :type="show ? 'text' : 'password'"
              :autocomplete="register ? 'new-password' : 'current-password'"
              required
              :minlength="register ? 10 : 1"
              maxlength="128"
              :aria-describedby="register ? 'password-help' : undefined"
            /><small v-if="register" id="password-help"
              >Use 10–128 characters. Avoid reusing a password.</small
            >
          </div>
          <div v-if="register" class="field">
            <label for="confirm">Confirm password</label
            ><input
              id="confirm"
              v-model="confirm"
              :type="show ? 'text' : 'password'"
              autocomplete="new-password"
              required
              minlength="10"
              maxlength="128"
            />
          </div>
          <p v-if="error" class="alert error" role="alert">{{ error }}</p>
          <button class="button full" :disabled="busy" type="submit">
            {{ busy ? 'One moment…' : register ? 'Join the Hub' : 'Log in'
            }}<Icon name="arrow" :size="18" />
          </button>
        </form>
        <p class="auth-switch">
          {{ register ? 'Already part of the community?' : 'New around here?' }}
          <RouterLink :to="{ path: register ? '/login' : '/register', query: route.query }">{{
            register ? 'Log in' : 'Create an account'
          }}</RouterLink>
        </p>
        <p class="fine-print">
          Student project: use a test email and a unique demo password. Accounts are saved in the
          project database. New accounts have student access.
        </p>
      </section>
    </div>
  </div>
</template>
