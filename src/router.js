import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Events from './pages/Events.vue';
import EventDetail from './pages/EventDetail.vue';
import Clubs from './pages/Clubs.vue';
import ClubDetail from './pages/ClubDetail.vue';
import Calendar from './pages/Calendar.vue';
import Auth from './pages/Auth.vue';
import Personal from './pages/Personal.vue';
import Manage from './pages/Manage.vue';
import ContentForm from './pages/ContentForm.vue';
import Info from './pages/Info.vue';
import { store } from './store.js';
export const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: Home, meta: { title: 'Home' } },
    { path: '/events', component: Events, meta: { title: 'Explore events' } },
    {
      path: '/events/new',
      component: ContentForm,
      meta: { title: 'Create event', auth: true, manage: true },
      props: { kind: 'events' },
    },
    {
      path: '/events/:id/edit',
      component: ContentForm,
      meta: { title: 'Edit event', auth: true, manage: true },
      props: { kind: 'events' },
    },
    { path: '/events/:id', component: EventDetail, meta: { title: 'Event details' } },
    { path: '/clubs', component: Clubs, meta: { title: 'Clubs & societies' } },
    {
      path: '/clubs/new',
      component: ContentForm,
      meta: { title: 'Create club', auth: true, manage: true },
      props: { kind: 'clubs' },
    },
    {
      path: '/clubs/:id/edit',
      component: ContentForm,
      meta: { title: 'Edit club', auth: true, manage: true },
      props: { kind: 'clubs' },
    },
    { path: '/clubs/:id', component: ClubDetail, meta: { title: 'Club details' } },
    { path: '/calendar', component: Calendar, meta: { title: 'Event calendar' } },
    { path: '/login', component: Auth, meta: { title: 'Log in' }, props: { register: false } },
    {
      path: '/register',
      component: Auth,
      meta: { title: 'Create an account' },
      props: { register: true },
    },
    {
      path: '/my-events',
      component: Personal,
      meta: { title: 'My events', auth: true },
      props: { mode: 'events' },
    },
    {
      path: '/liked',
      component: Personal,
      meta: { title: 'Liked events', auth: true },
      props: { mode: 'liked' },
    },
    {
      path: '/profile',
      component: Personal,
      meta: { title: 'My profile', auth: true },
      props: { mode: 'profile' },
    },
    {
      path: '/manage',
      component: Manage,
      meta: { title: 'Organizer workspace', auth: true, manage: true },
    },
    { path: '/about', component: Info, meta: { title: 'About the Hub' }, props: { kind: 'about' } },
    { path: '/help', component: Info, meta: { title: 'Help & FAQs' }, props: { kind: 'help' } },
    {
      path: '/:pathMatch(.*)*',
      component: Info,
      meta: { title: 'Page not found' },
      props: { kind: '404' },
    },
  ],
});
router.beforeEach((to) => {
  store.notice = '';
  if (to.meta.auth && !store.user) return { path: '/login', query: { redirect: to.fullPath } };
  if (to.meta.manage && !store.canManage) return '/profile';
});
router.afterEach((to) => {
  document.title = `${to.meta.title} · Campus Events Hub`;
});
