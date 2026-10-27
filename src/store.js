import { reactive } from 'vue';
export async function api(path, method = 'GET', body) {
  const base = import.meta.env.VITE_API_BASE || './api';
  let response;
  try {
    response = await fetch(base + path, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('The server is unavailable. Please try again shortly.');
  }
  const data = await response
    .json()
    .catch(() => ({ message: 'The server returned an unreadable response.' }));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}
export const categories = [
  'Arts & culture',
  'Technology',
  'Sports & wellbeing',
  'Social',
  'Careers',
  'Volunteering',
];
export const locations = [
  'Student Commons',
  'Innovation Lab',
  'Sports Centre',
  'Main Auditorium',
  'Campus Green',
  'Library',
];
export const store = reactive({
  user: null,
  events: [],
  clubs: [],
  liked: [],
  registered: [],
  memberships: [],
  error: '',
  notice: '',
  ready: false,
  get canManage() {
    return ['organizer', 'admin'].includes(this.user?.role);
  },
  owns(item) {
    return this.canManage && (this.user.role === 'admin' || item.owner_id === this.user.id);
  },
  async refresh() {
    const [events, clubs] = await Promise.all([api('/events'), api('/clubs')]);
    this.events = events;
    this.clubs = clubs;
    if (this.user) {
      const me = await api('/me');
      this.user = me.user;
      this.liked = me.liked;
      this.registered = me.registered;
      this.memberships = me.clubs;
    } else {
      this.liked = [];
      this.registered = [];
      this.memberships = [];
    }
  },
  async initialize() {
    this.error = '';
    try {
      this.user = (await api('/session')).user;
      await this.refresh();
    } catch (e) {
      this.error = e.message;
    } finally {
      this.ready = true;
    }
  },
  async authenticate(path, body) {
    this.user = (await api(path, 'POST', body)).user;
    await this.refresh();
  },
  async logout() {
    await api('/logout', 'POST', {});
    this.user = null;
    await this.refresh();
  },
  async toggleLike(id) {
    await api(`/events/${id}/like`, this.liked.includes(id) ? 'DELETE' : 'POST', {});
    await this.refresh();
  },
  async toggleRegistration(id) {
    await api(`/events/${id}/registration`, this.registered.includes(id) ? 'DELETE' : 'POST', {});
    await this.refresh();
  },
  async toggleMembership(id) {
    await api(`/clubs/${id}/membership`, this.memberships.includes(id) ? 'DELETE' : 'POST', {});
    await this.refresh();
  },
});
export const dateLabel = (date, options = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('en-GB', options).format(new Date(date + 'T12:00:00'));
export const priceLabel = (price) =>
  Number(price) === 0 ? 'Free' : `RM ${Number(price).toFixed(2)}`;
