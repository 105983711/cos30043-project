# Validation record

Performed on 22 October 2026 in the local Windows workspace. These results describe the tested environment, not a claim of deployment to the university host or full accessibility conformance.

## Build and dependency checks

| Check | Result |
|---|---|
| Dependency installation and lockfile | Successful; npm reported zero known vulnerabilities for the installed dependency tree |
| Local production build | `npm run build` passed, 44 modules transformed |
| Mercury production package | `npm run build:mercury` passed; relative assets and PHP query-string API configuration generated |
| PHP syntax | `api.php` and `setup.php` passed PHP 8.4.27 syntax validation |
| Source formatting | Vue, JavaScript, CSS, JSON and documentation formatted with Prettier; PHP formatted with the PHP plugin |

## Behavioral API tests

`npm test` with `PHP_BIN` and `PHP_EXT` configured: **2 passed, 0 failed, 0 skipped**.

The Node/SQLite lifecycle test checks:

- Initial sample collections and guest protection.
- Invalid registration, duplicate email and incorrect login rejection.
- Role escalation attempts in registration rejected; new user remains a student.
- Student CRUD denial and cross-organizer ownership denial.
- Event and club creation/edit/deletion and detail retrieval.
- Invalid dates and capacities rejected.
- Duplicate likes remain idempotent; unlike updates counts.
- Registrations, cancellation and capacity enforcement.
- Club membership and leaving a club.
- Club deletion blocked while it has events.
- Cross-origin writes rejected.
- Session, content and personal data retained after server/database restart.
- Logout invalidates the session and deleted content returns 404.

The PHP/PDO SQLite lifecycle test checks:

- Repeatable, non-destructive CLI setup and private admin creation.
- PHP registration, session cookies, login/logout, roles and student write denial.
- Event and club CRUD, validation and detail retrieval.
- Persistent, idempotent likes, memberships and registrations.
- Event capacity enforcement, cancellation and subsequent admission.
- Referential restrictions and deletion.
- Session and data retention across PHP server restart.

Tests use temporary databases and dispose of them afterwards. A browser-only test account and event were also removed after validation. No test credentials or user database is included in the delivery archive.

## Browser checks

| Interaction | Observed result |
|---|---|
| Event browsing | 18 sample events loaded, six cards on a result page |
| Combined keyword/category | Technology + “website” returned the matching workshop |
| Pagination | Page 2 showed the next six events |
| Name sort | A–Z sorting changed the visible order and reset pagination to page 1 |
| Guest registration action | Redirected to login with the selected event preserved |
| Register account | Returned to the originally selected event |
| Register and like event | Available space decreased, like count increased and controls reflected selected state |
| Page reload | Authenticated state, registration and like remained available |
| Organizer interface | Workspace visible only for authorized account; event form saved to backend and edit showed the updated title |
| Calendar | Month navigation, category filter and selected-day agenda updated reactively |
| Calendar export | `.ics` downloaded; inspected title, location, UTC start/end, and escaped description. 18:00 Malaysia time exported as 10:00 UTC. |
| Logout | Returned to guest home navigation |
| Skip link | Focus moved to `main` without changing the Vue Router URL |
| Runtime logs | No warnings or errors were captured in the inspected Node and PHP browser tabs |
| Mercury subfolder simulation | Production frontend loaded and displayed backend data at `/campus/` through the PHP adapter |

## Responsive visual checks

- **390 × 844**: homepage and compact calendar inspected; navigation menu expanded correctly; single-column flow; no horizontal overflow measured.
- **768 × 1024**: calendar inspected with filtered events; seven-day layout remained usable.
- **1440 × 1000**: homepage, event listings and organizer workflow inspected; multi-column layouts and desktop navigation displayed correctly; no horizontal overflow measured.

Screenshots are supplied separately in the delivery's `screenshots` folder. The desktop home and event listing screenshots are clean guest views. Calendar screenshots were taken during a temporary local test session.

## Remaining verification limits

- Actual Mercury upload and URL are unverified because no university host/account access was provided.
- The MySQL schema/configuration branch is supplied but was not executed against a MySQL server. PHP with PDO SQLite was executed and tested.
- Browser checks used the available Chromium-based in-app browser; Safari, Firefox, physical touch devices and screen-reader software were not tested.
- Keyboard labels/focus and responsive behavior were checked, but no formal WCAG audit or user study was performed.
- The downloaded calendar file was inspected as text; import into third-party calendar applications was not performed.
- Reports, video, individual authorship, peer evaluation and Canvas submission require the group's own work and review.
