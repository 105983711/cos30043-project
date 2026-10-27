<script setup>
defineProps({ kind: String });
const faqs = [
  [
    'How do I join an event?',
    'Open an event and select “Count me in”. You will be asked to log in or register first. Find your registered activities under My events.',
  ],
  [
    'Can I change my mind?',
    'Yes. Open the event and choose “Cancel my registration”. The spot becomes available to another student immediately.',
  ],
  [
    'What does the heart do?',
    'Liking an event adds it to your Liked events page. It does not reserve a place; use “Count me in” to register.',
  ],
  [
    'How do I organize an event?',
    'Your project administrator can grant organizer access. Organizers can create, edit, and delete their own events and clubs from the workspace. Administrators can manage all content.',
  ],
  [
    'Are these real campus events?',
    'No. The seeded clubs, activities, and contact addresses are fictional sample content for a COS30043 assignment. Do not make payments or attend based on these listings.',
  ],
  [
    'How does the calendar work?',
    'Move between months and filter by interest. Select a day to show its event list. Open an event to download an .ics calendar file. The export assumes a two-hour duration and uses Malaysia time (UTC+8).',
  ],
  [
    'What if I need access arrangements?',
    'Contact the organizer of a real event before attending. For this demonstration, all contact addresses are examples. The interface supports keyboard navigation, labelled forms, and responsive layouts.',
  ],
  [
    'What information is saved?',
    'The backend database stores your name, email, password hash, role, likes, registrations, memberships, and published content. Login uses an HttpOnly session cookie. No payment details are requested.',
  ],
];
</script>
<template>
  <div class="container page-space narrow">
    <template v-if="kind === 'about'"
      ><div class="page-heading">
        <span class="eyebrow">LIFE BEYOND THE LECTURE HALL</span>
        <h1>A campus is a place.<br /><em>Community is what we make.</em></h1>
      </div>
      <div class="prose">
        <p>
          Campus Events Hub brings student activities and societies into one shared space. Discover
          a workshop, meet a new team, or find a community around something you already love.
        </p>
        <h2>One Hub. Plenty of ways to belong.</h2>
        <p>
          Explore events by interest, location, date, or budget. Browse student societies, like an
          activity for later, or register when you are ready to join in.
        </p>
        <h2>Built for a student project</h2>
        <p>
          This Vue 3 application was created for COS30043 Interface Design and Development. The
          listed activities, clubs, and contact details are sample data for demonstration.
        </p>
        <p>
          Project group: Mohona Tabassum Sneha, May Myat Noe, Sai Wen Hao, and Tea Sing Yii.
          Individual responsibilities are to be confirmed by the team.
        </p>
        <RouterLink to="/events" class="button">Find your next thing ↗</RouterLink>
      </div></template
    ><template v-else-if="kind === 'help'"
      ><div class="page-heading">
        <span class="eyebrow">A LITTLE GUIDANCE</span>
        <h1>Glad you <em>asked.</em></h1>
        <p>Everything you need to find your way around the Hub.</p>
      </div>
      <details v-for="([question, answer], i) in faqs" :key="i" class="faq">
        <summary>{{ question }}</summary>
        <p>{{ answer }}</p>
      </details></template
    >
    <div v-else class="empty-state">
      <span class="eyebrow">404 · A LITTLE OFF THE PATH</span>
      <h1>Let’s get you back.</h1>
      <p>This page isn’t here. Your next good campus moment might be.</p>
      <RouterLink to="/events" class="button">Explore events ↗</RouterLink>
    </div>
  </div>
</template>
