# Application navigation and footer redesign

## Objective

Simplify navigation in the authenticated application, make page names describe their actual
content, and prevent the footer from dominating small screens. Frequently used operational
pages must remain immediately accessible; account, setup, support, and legal pages must be
available without competing with the primary workflow.

This change affects information architecture and presentation only. Existing permissions and
backend APIs remain unchanged.

## Problems in the current interface

- The primary navigation mixes frequent logbook tasks with infrequent setup pages.
- **Settings** opens a page whose content is actually pilot and logbook data: Personal, Licence,
  Prior totals, Medical, and Install app.
- **Profile** contains account preferences and Google access settings, so its purpose overlaps
  with Settings.
- **Automation** describes an implementation mechanism rather than the user's goal of connecting
  a logbook to a club.
- The authenticated footer contains product, club, support, and legal links at the same level.
  On mobile this occupies a disproportionate amount of the page.
- Public navigation and authenticated application navigation currently share a footer even
  though they serve different user journeys.

## Target information architecture

### Primary application navigation

The primary navigation contains only frequently used operational sections:

1. **Dashboard**
2. **Flights**
3. **Statistics**
4. **Training & Qualification Events**
5. **Instructors** — visible only when
   `can_view_club_instructor_reports` is `true`

**Instructors** is an operational CFI/DCFI tool and stays alongside the other working sections.
It must not be placed under Club connections or treated as an account setting.

On desktop, **Training & Qualification Events** may be visually shortened to **Training** when
space is limited. The full label must remain available through accessible text or an
`aria-label`. The mobile menu uses the full name.

### User menu and secondary navigation

Remove Settings, Automation, and Profile from the primary navigation. Place the following items
in the user menu:

| Menu label | Existing route | Purpose |
| --- | --- | --- |
| Pilot details | `/settings` | Personal details, licence, prior totals, medical, and other data stored in the pilot logbook |
| Account settings | `/profile` | Preferences, units, language, notifications, Google access, and logbook disconnection |
| Club connections | `/automation` | Requests for automatic flight import from participating clubs |
| Install app | New dedicated page or section | PWA installation instructions and action |
| Help | `/help` | Support and product-information links |
| Log out | Existing action | End the current session |

The existing `/settings`, `/profile`, and `/automation` paths should remain valid to preserve
bookmarks and external links. Only their visible titles and navigation labels change:

- Settings → **Pilot details**
- Profile → **Account settings**
- Automation → **Club connections**

The **Install app** content must be removed from Pilot details. The preferred implementation is a
small dedicated `/install-app` page reusing the existing `PwaInstallSection`. If this is deferred,
the menu item may temporarily link to a clearly identified section on Account settings.

## Desktop behaviour

The header shows:

```text
Logo | Dashboard | Flights | Statistics | Training | Instructors* | Sync status | User menu
```

`Instructors*` is conditional. The user menu contains the secondary items described above.

The currently active primary page retains the existing active underline. When Pilot details,
Account settings, Club connections, Install app, or Help is open, the user-menu trigger should
have an active state so that the current location is still apparent.

## Mobile behaviour

The hamburger menu uses two visually separated groups:

```text
LOGBOOK
Dashboard
Flights
Statistics
Training & Qualification Events
Instructors                         (CFI/DCFI only)

ACCOUNT
Pilot details
Account settings
Club connections
Install app

Help
Log out
```

Group labels are non-interactive, visually secondary, and announced appropriately by assistive
technology. The menu must close after navigation. Existing active-page styling remains.

Do not add a separate **Club** or **Oversight** group in this version: each would contain too few
items and would make the menu appear more complex without improving discovery.

## Footer

### Authenticated application footer

Use a compact footer inside the application:

```text
Help · Legal
© <year> Glider Pilot Logbook
```

- **Help** opens `/help`.
- **Legal** opens `/legal`.
- On mobile the footer should occupy no more than two short lines under normal text scaling.
- Do not render the complete public-page link list in the authenticated application.

The Help page provides links to:

- FAQ
- Contact
- Logbook Template
- About

The Legal page provides links to:

- Privacy Policy
- Terms of Service
- Cookie Policy
- Disclaimer

The existing individual URLs must remain available. The Help and Legal pages are navigation hubs,
not replacements for the existing content pages.

### Public footer

Public and marketing pages retain access to all current links, grouped by purpose:

| Product | For clubs | Support | Legal |
| --- | --- | --- | --- |
| About | Downloads | FAQ | Privacy Policy |
| Logbook Template | Synchronisation | Contact | Terms of Service |
|  |  |  | Cookie Policy |
|  |  |  | Disclaimer |

On narrow screens these groups may stack vertically or use accessible disclosure sections. The
public footer is allowed to be larger because it supports discovery by visitors who are not using
the authenticated application workflow.

**Downloads** and **Synchronisation** must not appear directly in the authenticated footer. They
remain available from the public **For clubs** group.

## Page content changes

### Pilot details (`/settings`)

- Change the page heading from **Pilot settings** to **Pilot details**.
- Keep Personal, Licence, Prior totals, Medical, and other logbook-owned pilot data.
- Remove the Install app section.
- Preserve all save behaviour and validation.

### Account settings (`/profile`)

- Change the page heading to **Account settings**.
- Keep account preferences, measurement units, language, email notifications, Google access,
  and disconnect actions.

### Club connections (`/automation`)

- Change the page heading from **Automation** to **Club connections**.
- Describe the feature in user terms: connecting a logbook to a participating club for automatic
  flight import.
- Internal model and API names do not need to change.

### Install app

- Reuse the current installation component and browser-support behaviour.
- The page must remain useful when installation is unavailable or the app is already installed.

## Implementation notes

- Define primary and secondary navigation items separately instead of maintaining one mixed
  `navItems` collection with desktop-only exceptions.
- Preserve the existing capability check for Instructors.
- Introduce an application/public variant for `SiteFooter`, or render separate footer components
  from the relevant layouts.
- Continue using router links for internal destinations.
- Keep all existing public content routes working.
- Add document titles for Help, Legal, Install app, Pilot details, Account settings, and Club
  connections.
- Update navigation tests for authenticated, unauthenticated, mobile, demo, and CFI/DCFI states.

## Acceptance criteria

1. Desktop primary navigation contains Dashboard, Flights, Statistics, Training, and conditional
   Instructors only.
2. Mobile navigation shows the full **Training & Qualification Events** label.
3. Instructors remains in the operational Logbook group and is visible only to authorised
   CFI/DCFI users.
4. Pilot details, Account settings, Club connections, and Install app are accessible from the user
   menu on desktop and the Account group on mobile.
5. Existing `/settings`, `/profile`, and `/automation` links continue to work.
6. Page headings match their new navigation labels.
7. Install app is no longer presented as part of Pilot details.
8. The authenticated footer contains only Help, Legal, and copyright information.
9. FAQ, Contact, Logbook Template, About, and all legal pages remain reachable within two actions
   from any authenticated page.
10. Downloads and Synchronisation remain available on public pages but are absent from the
    authenticated footer.
11. Keyboard navigation, focus visibility, active states, and accessible menu labels continue to
    work on desktop and mobile.
12. Navigation changes do not alter permissions, logbook data, synchronization behaviour, or
    backend APIs.
