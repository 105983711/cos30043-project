# D/HD Advanced Feature Detailed Proposal

## Student and project details

- **Student:** Mohona Tabassum Sneha
- **Student ID:** 105983711
- **Project:** Campus Events Hub
- **Planned individual advanced feature:** Personalised “Recommended for You” event recommendations

## D/HD interest statement

I am registering my interest in completing the D/HD project interview. I will individually design, implement, test and demonstrate a personalised event-recommendation feature in Vue 3. The feature will rank upcoming events using the signed-in user's interactions and will explain why each event was recommended.

## What is already available in the group application

The current Campus Events Hub source provides the shared foundation for this feature. It already contains event and club listings, event-detail pages, user registration and login, event likes, event registrations, club memberships, reusable event-card components and reactive shared state. The backend stores these interactions persistently and returns the signed-in user's liked events, registered events and club memberships.

The current application does **not** contain a personalised recommendation engine or a “Recommended for You” interface. I will not claim the existing group foundation as my individual advanced feature. My individual contribution begins with the design and implementation described below, and it will be recorded through my own branch, commits, pull request, tests and screenshots.

## Problem being solved

As the number of events grows, users may find it difficult to identify events relevant to their interests. Search and filters help only when users already know what they want. My feature will use the user's previous interactions to suggest relevant upcoming events automatically, while still showing understandable reasons for every recommendation.

## Planned user experience

After a user signs in, the application will show a **Recommended for You** section. Each recommendation will use the existing event-card design and include a short explanation, for example:

- “Recommended because you joined Tech & Makers Society.”
- “Recommended because you liked Technology events.”
- “Recommended because you registered for a similar event.”
- “Popular with the campus community.”

The section will exclude expired events and will not recommend the event currently being viewed. It may also exclude events for which the user is already registered, depending on the final usability test. Guests will see a clear invitation to sign in instead of receiving fake personalised results. New users without interaction history will receive a labelled fallback based on upcoming and popular events.

## Recommendation method

I will implement a transparent weighted-scoring method rather than a random list. A planned initial scoring model is:

| Signal | Example score |
| --- | ---: |
| Event belongs to a club the user joined | +6 |
| Category matches an event the user registered for | +5 |
| Category matches an event the user liked | +4 |
| Event belongs to a club previously liked or registered with | +3 |
| Event occurs soon and is still upcoming | +2 |
| Event has comparatively high community popularity | +1 |

The exact weights will be declared as named constants so they are readable and easy to modify during testing or the interview. For every candidate event, the algorithm will calculate a score, collect the matching reasons, sort by score and date, remove ineligible results, and return the highest-ranked events. Ties will be resolved consistently using event date and title.

## Vue implementation plan

I plan to complete the work in a dedicated branch such as `feature/mohona-personal-recommendations`. The implementation is expected to include:

1. A recommendation utility or composable containing the scoring rules.
2. A reusable `RecommendedEvents.vue` component.
3. Reactive input from the existing user, events, likes, registrations and memberships state.
4. A computed recommendation list that updates after the user likes, registers for or joins something.
5. Integration into the home page and/or event-detail page.
6. Reuse of `EventCard.vue` to maintain visual consistency.
7. Loading, signed-out, new-user, no-result and API-error states.
8. Responsive Bootstrap layout for mobile, tablet and desktop.
9. Accessible headings, status messages, focus behaviour and explanation text.

The initial version can calculate recommendations in the Vue frontend from data already supplied by the API. If additional interaction information is required, I will document the required API change and coordinate it with the backend owner without claiming their backend work as mine.

## Measurable completion criteria

The feature will be considered complete only when all of the following are demonstrated:

- A signed-in user receives ranked upcoming-event recommendations.
- Changing the user's likes, registrations or memberships changes the ranking without a full page reload.
- Every displayed recommendation includes at least one understandable reason.
- Expired events and the current event are excluded.
- Duplicate recommendations are not displayed.
- A new user receives a clearly labelled fallback instead of an empty or broken section.
- A guest receives a sign-in prompt rather than personalised claims.
- The interface works at approximately 390 px, 768 px and 1440 px widths.
- The section can be used with a keyboard and has meaningful headings and status text.
- The production build continues to pass.

## Planned testing

I will prepare controlled test scenarios instead of judging the feature only by appearance:

1. **Guest test:** confirm that no personal recommendation is claimed.
2. **New-user test:** confirm that the fallback contains upcoming/popular events and is labelled correctly.
3. **Liked-category test:** like a Technology event and confirm that suitable Technology events move higher.
4. **Registration test:** register for an Arts event and confirm that similar upcoming events gain the expected score.
5. **Membership test:** join a club and confirm that its upcoming events are prioritised.
6. **Exclusion test:** confirm that past, duplicate and currently viewed events are absent.
7. **Reactive test:** change an interaction and confirm that recommendations update.
8. **Tie test:** provide equal scores and confirm stable date/title ordering.
9. **Responsive and keyboard test:** verify the feature at three widths and without a mouse.
10. **Regression test:** run `npm test` and `npm run build` after integration.

I will record expected and actual results, defects discovered, changes made to weights or interface behaviour, and final retest results.

## Video demonstration plan

During my section of the continuous group video, I will:

1. Sign in with a fresh student account.
2. Show the initial fallback recommendations.
3. Like an event, register for an event and/or join a club.
4. Return to the recommendation section and show the changed order.
5. Open a recommendation and point out the displayed explanation.
6. Briefly show the scoring code and reactive Vue computation.
7. State why this improves event discovery compared with ordinary search alone.

## Individual report evidence

My individual report will include:

- The problem and rationale for the feature.
- Evidence that recommendation techniques were independently researched.
- Component/data-flow and scoring-method explanation.
- Important Vue code and design decisions.
- Before-and-after screenshots.
- Test cases and results.
- Challenges, defects and resolutions.
- Accessibility and usability evaluation.
- Limitations, privacy considerations and possible future improvements.
- Links or identifiers for my branch, commits and pull request.

## Interview preparation

I will be prepared to explain and modify the scoring weights, add or remove a recommendation signal, change the result limit, explain computed reactivity, fix an exclusion rule, and describe how I verified that the ranking changed correctly. I will also be able to distinguish my recommendation implementation from the pre-existing group application and identify the exact files and commits that represent my work.

## Expected value

The planned feature goes beyond a basic static “similar events” list. It uses multiple persistent user-interaction signals, produces explainable ranked results, reacts to user actions, handles cold-start users, and is evaluated through controlled tests. This should make Campus Events Hub more useful while providing a substantial Vue-related individual contribution for the D/HD demonstration, report and interview.
