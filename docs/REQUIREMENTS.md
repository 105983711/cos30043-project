# Requirements and implementation map

## Source documents

- `Campus_Events_Hub_Group_Agreement_4_Members (2).docx`: theme, members, proposed roles, feature plan, communication and working agreement.
- `Web App Project (1).pdf`, four pages: required functionality, stack, deployment, reports, demonstration, submission, and marking scheme.

The documents are assignment evidence. Their instructions to students are recorded as project constraints and deliverables, not treated as permission to send messages, submit work, or access university accounts.

## Functional requirements

| Requirement                         | Implementation and review location                                                                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At least 10 interconnected pages    | 19 route definitions in `src/router.js`; home, listings, details, calendar, authentication, personal pages, management forms, about and help. Reusable components do not count as standalone pages. |
| Collection and item details         | 18 fictional events, 6 fictional societies; `/events/:id` and `/clubs/:id`                                                                                                                          |
| Search by various criteria and sort | Events: keyword, category, location, price and date; date, likes, name and price sorting. Clubs: keyword/category and name/member sorting.                                                          |
| Registration and login              | `/register`, `/login`, session restoration, protected routes and authenticated navigation                                                                                                           |
| Different guest/member visibility   | Guests browse; personal pages, social writes, registration and memberships require authentication. Organizer workspace and content forms require an organizer/admin role.                           |
| Authorized content CRUD             | Event and club POST/PUT/DELETE endpoints; organizer ownership enforced by backend, admin override; club deletion blocked while it hosts events                                                      |
| Social interaction                  | Like/unlike with count and personal liked list; club join/leave is additional functionality                                                                                                         |
| Persistent application/user data    | SQLite local database; PHP adapter with PDO SQLite or MySQL for Mercury; password hashes, accounts, likes, registrations, memberships and content retained                                          |

## Technical requirements

| Requirement                    | Evidence                                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vue 3 and Vite                 | `package.json`, Vue SFC files, `vite.config.js`, successful production build                                                                                                           |
| Bootstrap grid                 | Installed Bootstrap 5; `bootstrap-grid.min.css` imported; `container`, `row`, `col-md-*` and `col-lg-*` used throughout                                                                |
| Component architecture         | Cards, artwork, icons, pagination, shared store and separate route views                                                                                                               |
| Vue Router                     | Hash history supports a Mercury subfolder without rewrite rules; guest and role guards                                                                                                 |
| Vue directives and reactivity  | `v-model` filters/forms, `v-for` cards/calendar, `v-if` permissions/empty states, `:disabled`/`:class` bindings, `@click`/`@submit`, methods, `computed`, `ref`, `reactive`, `watch`   |
| Mobile-first and three sizes   | Bootstrap responsive columns; custom small-screen navigation, single-column forms/cards, compact mobile calendar; checked at 390, 768 and 1440 pixel widths                            |
| Pagination                     | Events and clubs six per page, personal lists six per page, workspace eight per page                                                                                                   |
| Form validation                | Native constraints plus API validation; email, password length, title, description, date/time, category, location, numeric price/capacity and club fields; authentication errors shown |
| Backend database and REST CRUD | `server/index.js` and `server/database.js`; Mercury `deploy/api.php`; parameterized SQL and foreign keys                                                                               |
| Consistent conventions         | Formatted Vue/JS/CSS source, consistent two-space indentation, descriptive components and variables                                                                                    |
| Mercury deployment             | Build and PHP adapter prepared. Actual school-host upload, host capabilities, HTTPS and URL remain outstanding; this requirement is not yet fully satisfied.                           |

## Advanced feature

The Vue calendar derives a 42-cell month view, per-day event associations and filtered agenda from reactive month/year/category state. Clicking a day narrows the agenda, month navigation correctly handles year boundaries, and the Today button resets the month. Native buttons support keyboard operation. Event details export an `.ics` file using browser Blob downloads and UTC timestamps calculated from Malaysia time.

The brief encourages each student to independently learn and implement an advanced Vue-related feature. The group should agree which individual owns this feature and what additional advanced work other members undertake. This implementation does not establish independent authorship or guarantee the advanced-feature mark.

## Boundaries and open decisions

- Assignment language is English; the UI and project documentation are English.
- Agreement member names are included, but student IDs/signatures are not exposed in the website.
- No exact campus, university logo, real event data, hosting credentials, Canvas due date or Mercury path was provided; none is invented.
- Sample dates are set relative to first Node initialization, or the date of the Mercury build. Persisted content does not move forward every restart.
- Payment processing, password reset email, real email delivery and uploads are not required by the supplied brief and are not implemented.
- SQLite and MySQL deployment choices must follow the actual Mercury account's available PDO drivers and database permissions.
- Node and PHP are alternative backend deployments. Their password hashes and session implementations differ; initialize the PHP database separately rather than copying the Node database into production.
