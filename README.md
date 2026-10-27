# Campus Events Hub

A complete COS30043 web application for discovering campus events and student societies. Built from the supplied Group Agreement and Web App Project brief. All seeded events, clubs, and contact addresses are fictional demonstration content.

## Run locally

Requires Node.js 24 or newer. No database installation or paid services are needed for the local version.

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:3001. Keep this terminal running. The SQLite database is created at `data/campus.sqlite` and survives server restarts. Do not open `index.html` directly: the database API needs a running server.

For development, run `npm run api` and `npm run dev` in separate terminals. Vite forwards `/api` to the backend. Both local services bind to loopback only.

## Use organizer features

Register an account in the application, then grant the role from a trusted local terminal:

```sh
node server/account.js promote your-test-email@example.test organizer
```

Use `admin` instead of `organizer` to manage all sample content. Organizers manage only items they created; administrators can also edit and delete the seeded items. A new registration always receives the student role. Log out and log back in after changing a role. Never add role selection to the public registration form.

There are no embedded default administrator credentials. An administrator may also be created with `node server/account.js create EMAIL`, supplying `CAMPUS_ADMIN_PASSWORD` as a temporary environment variable. Clear it afterwards. Do not put passwords in source files or command arguments.

## Included functionality

- Nineteen Vue Router route definitions, including an intentional not-found route; meaningful navigation between home, events, event details, clubs, club details, calendar, login, registration, my events, liked events, profile, organizer workspace, create/edit event, create/edit club, about, and help.
- Events searched by title, description, and club; combined category, location, date, and price filters; date, popularity, title, and price sorting; six-item pagination.
- Searchable, filterable, sortable, paginated club directory and individual society pages.
- Validated registration/login, server-side role and ownership checks, and persistent sessions.
- Real event and club create/read/update/delete APIs with validation, referential integrity, and clear deletion confirmation.
- Persistent event likes, capacity-limited registrations, cancellations, club memberships, and personal pages.
- Advanced reactive month calendar with category filtering, day selection, agenda, and `.ics` export. Calendar exports assume a two-hour event duration and use UTC derived from Malaysia time (UTC+8).
- Responsive Bootstrap columns, reusable Vue components, focus indicators, skip link, native form labels, announced errors, and reduced-motion support.

## Verification

```sh
npm test
npm run build
npm run build:mercury
```

The default tests exercise the Node/SQLite backend. The PHP adapter suite runs when `PHP_BIN` and `PHP_EXT` point to a PHP 8.1+ executable and its extension directory, with PDO SQLite available. The suite starts a temporary server on port 3017 and uses isolated temporary databases; it does not modify your project database.

See `docs/VALIDATION.md` for the performed checks and remaining verification limits.

## Mercury deployment

`npm run build:mercury` creates `build/mercury/` with the production Vue application and PHP REST adapter. This avoids requiring a persistent Node process on a shared teaching host. SQLite and MySQL configurations are supported. Read `docs/MERCURY.md` before uploading. The actual Mercury server, permissions, PHP/PDO extensions, database access, and final URL still need to be verified using your university account.

This project has not been deployed to Mercury. Do not submit a localhost address as your Mercury URL. No alternative hosting service has been substituted.

## Project layout

| Folder           | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `src/components` | Event cards, club cards, artwork, icons, pagination              |
| `src/pages`      | Routed Vue views                                                 |
| `src/store.js`   | Reactive shared state and API client                             |
| `server`         | Local Node REST API, SQLite schema, sample data, account tool    |
| `deploy`         | PHP API, private configuration example, setup and SQL schemas    |
| `scripts`        | Mercury production packaging                                     |
| `tests`          | Behavioral backend integration tests                             |
| `docs`           | Requirement mapping, responsibilities, deployment and validation |
| `docs/reference` | Original group agreement supplied by the project team             |

No third-party image downloads or generated bitmap assets are required. Illustrations are project-owned SVG components. Dependencies are locked in `package-lock.json`.

## Assignment handoff

See `docs/REQUIREMENTS.md` for a complete brief-to-implementation map and `docs/TEAM.md` for the four proposed role areas and submission obligations. The agreement does not assign these roles to particular people. The application is a starting point for the group to understand, review, and adapt; do not describe generated implementation or suggested tasks as work already completed independently by any member.
