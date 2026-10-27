import { createApp } from 'vue';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
import './style.css';
import App from './App.vue';
import { router } from './router.js';
import { store } from './store.js';
await store.initialize();
createApp(App).use(router).mount('#app');
