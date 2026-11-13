# Vision

The symbanta dashboard is the presentation half of the symbanta analytics pair: a single-page
application that reads the core's statistics API and answers one question — what happened on my
site, and is it getting better? The core owns ingestion, storage, rollups and the contract; this
repository owns everything a person actually looks at, including the parts most dashboards treat as
decoration: colour contrast, keyboard order, translation, and the ability to develop with no
backend at all. This document is about where that surface is going.

## Where symbanta-dashboard is today

The application is React 19 with Vite, TailwindCSS 4, TanStack Query and Recharts, written in
strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) and tested with Vitest
and Testing Library on jsdom. It is a client of one thing: the core's OpenAPI document. `orval`'s
generated client and models live in `src/api/`, and the one place they are adapted is
`src/api/custom-fetch.ts`, which re-roots the absolute production URLs onto `VITE_API_BASE_URL` at
runtime — so the generated code is never patched by hand and a regeneration is always safe.

What exists, panel by panel: summary cards (page views, visitors, bounce rate, average visit), a
traffic area chart with hourly or daily buckets, breakdown tables for routes, screen sizes,
countries, user agents and event occurrences, a console-log viewer filtered by level, and the
event-type registry with idempotent registration. One sticky period selector drives every panel at
once; the selected property is remembered in a cookie; a `401` anywhere redirects to `/login`.

Five decisions constrain everything that follows:

1. **The API contract is the only coupling.** No hand-written fetch wrappers, no local copy of the
   response shapes, no `any` at the boundary. A new panel is a generated hook and a table.
2. **Every colour is a token with a measured ratio.** `src/index.css` holds the four-layer glass
   material; `src/a11y/tokens.ts` mirrors it as a paint stack ordered back to front, and
   `tokens.test.ts` recomputes every text-on-material ratio with the worst-case stop and the
   thinnest alpha. A component that uses a colour nobody measured fails a test.
3. **Every chart has a text equivalent.** Charts carry `role="img"` and a visually hidden table
   holding the same series, because a tooltip is not an accessible answer.
4. **The mock is a development contract, not a fixture.** `mock-api/routes.ts` is a pure
   `handle(method, url, body)` returning `{status, headers, body}`, mounted as Vite middleware in
   development and preview and runnable standalone; its data are seeded by `domain + period`, so a
   reload never changes the numbers and a screenshot always matches the report.
5. **Interface preferences only in cookies.** Theme, contrast, selected property and locale are
   stored; no analytics data ever is.

Translation is part of the architecture rather than an afterthought: the msgids are the source
strings, extracted from the TypeScript AST, compiled from GNU gettext `.po` files at build time, and
pluralised by a small expression interpreter that reads each catalog's own `Plural-Forms` header
without `eval`. Eight locales ship, and a stale or incomplete catalog fails the suite.

What is honestly absent: there is no custom date range (the `CUSTOM` period is modelled and
translated in every locale, but no control sends the start and end dates the API accepts), no
drill-down from a table row into its own series, no period-over-period comparison, no export of any
kind, no shareable URL (the period and property live in a cookie), no read-only or public mode, no
saved views, and no way to look at the `props` of a custom event even though the core stores them.
Console logs can be filtered by level and limited, not searched.

## The vision

1. **Any number on the screen is one click from the rows that produced it.** "Why is this 412?"
   should be answerable inside the dashboard: the breakdown that contributes to a total, then the
   series behind the contributing row, then the events behind that series. This is the difference
   between a report and a tool.
2. **The period selector becomes an interval.** Custom ranges, a comparison window and a URL that
   carries the whole view, so a link can be pasted into a chat and arrive showing the same seven
   days of the same property.
3. **The accessibility contract becomes an exportable asset.** The contrast maths, the token model,
   the DOM audit and the "toolbar must stay denser than the panels" rule are general enough to be a
   small library with a test harness that any React dashboard can adopt, and that is a more useful
   contribution than being the only dashboard that got it right.
4. **The dashboard speaks the core's whole vocabulary without becoming a business-intelligence
   tool.** Goals, funnels, event properties, annotations: all of them arrive as panels obeying the
   same rules — one filter bar, one screen, no query builder, no drag-and-drop canvas.
5. **A read-only public mode is a deployment, not a feature flag.** A project can publish its
   numbers to the world with the same design and the same accessibility guarantees, and nothing
   from the authenticated view leaks into it.

## Features that are in scope and not built yet

- **Custom date range.** `Period.CUSTOM` exists in the generated client and in all eight catalogs,
  and the core resolves `startDate`/`endDate` into a half-open window. The hard part is a range
  control that is genuinely keyboard and screen-reader usable, plus surfacing the two facts a user
  must know: the window is half-open, and a long window is served as its most recent 500 buckets.
- **Route drill-down.** `GET /v1/stats/routes` returns per-route totals and nothing per-route.
  The hard part is that the missing piece is an API parameter the core does not have yet, so the
  mock would have to grow it first or the panel would be fiction.
- **Event property inspection.** `props` is `jsonb` in the core and appears nowhere in this client.
  The hard part is rendering an arbitrary document accessibly, at 50–500 rows, without inventing a
  query language.
- **Period-over-period deltas.** The summary cards have no baseline. The hard part is two windows
  per panel through one cache key, and an honest "there was no traffic last week" state instead of a
  division by zero dressed as a percentage.
- **Export.** Nothing in the client writes a file. The hard part is doing CSV correctly without a
  dependency — separator conventions, quoting, and a locale-correct header — and doing PNG of a
  glass panel without exporting the wallpaper with it.
- **View state in the URL.** The period and the property are cookies only. The hard part is a
  grammar that survives the session-cookie authentication model and does not put data into a link
  preview.
- **A public, unauthenticated view.** `LoginPage` is the only entry today. The hard part is
  deciding which panels are safe to expose per deployment and making that a build-time decision
  rather than a runtime trust in the client.
- **Role awareness.** The core seeds users with roles, `ROLE_ADMIN` among them. The dashboard has a
  single login page and no notion of what the signed-in account may see. The hard part is not
  building an admin UI, but hiding what would 403.

## New features that would be worth having

- **A machine-traffic panel.** The core's user-agent parser already labels ChatGPT, Claude, Common
  Crawl and assorted crawlers, and this client renders them as another row in a long table. A panel
  that separates humans from machines answers a question every small site owner now asks.
- **An annotation lane under the time series.** "The release went out here" turns a step in a chart
  into an explanation, and it needs one API addition and one thin strip.
- **A quiet numbers mode.** The same report as a short paragraph, printable and copyable, which
  serves screen-reader users, email digests and anyone who wanted a sentence rather than a chart.
- **Time-of-day heat map.** Hour × weekday from buckets the API already returns; no new endpoint.
- **A command palette.** Period, property, panel and refresh behind one key, which is what makes a
  dashboard feel like a tool rather than a page.
- **A panel registry driven by configuration.** A deployment that does not want console logs or the
  event-type registry should be able to say so in one file, and the mock should follow.
- **A theme generator with a proof.** Two colours in, a material out, and the contrast suite must
  pass before the theme can be used — the existing tokens make this a natural extension.
- **A session-length histogram.** The summary gives an average visit and nothing about the shape of
  visits, which is usually the more interesting number.

## Contributions that would move the needle

1. **The custom date range.** The model, the translations and the API support are already in place;
   what is missing is one well-built control and a clear explanation of the window semantics. It is
   the largest gap a new user notices.
2. **Period-over-period deltas on the summary cards.** Small surface, immediate value, and it
   forces a decision about missing data that the rest of the panels will inherit.
3. **View state in the URL.** It makes the dashboard shareable, which is how most analytics
   conversations actually start.
4. **CSV export.** Unglamorous, and the single feature that stops people retyping numbers.
5. **A print stylesheet.** A paper report is still how a monthly review reaches a person who never
   signs in.
6. **A new panel following the existing pattern** — machine traffic is the right first one, because
   it needs no new endpoint.
7. **Accessibility walkthroughs.** NVDA, VoiceOver and Orca reports are worth more than a rule in
   `domAudit.ts`, and this project treats them as bug reports.
8. **Pinning the generated client's input.** `orval.config.ts` reads the core's OpenAPI document
   from a moving `trunk` URL; pinning it to a tag and regenerating deliberately would make type
   drift a reviewable event instead of a surprise.

## Compared to related projects

| Project | What it is | Where symbanta-dashboard differs |
| --- | --- | --- |
| Plausible Analytics' dashboard | The Vue interface of a cookie-free analytics product: goals, funnels, segments, share links | Plausible's UI is far broader and lives inside its own server. This is a standalone SPA against a documented API, with a measured contrast contract and no goal vocabulary to render. |
| Umami | A React/Next.js analytics app with a friendly, widget-heavy dashboard | Umami renders its own data model directly. Here the client is generated from the core's contract, so a panel cannot disagree with the server's types. |
| Matomo | PHP analytics with a very deep, configuration-driven reporting UI | Matomo shows everything and asks you to configure it. This shows one screen and one filter bar, and deliberately refuses the query builder. |
| GoatCounter | Go-based analytics with server-rendered, text-first reports | GoatCounter's reports are plain and robust; this is a graphical SPA that works hard to give the same information to a screen reader. |
| Grafana | General dashboarding over time series, dashboards described in JSON | Grafana answers "show me this metric" for operators. This answers "did my site improve" for someone who will never write a query, and pays for it with a fixed panel set. |
| Metabase | Business intelligence over SQL: questions, models, embedded dashboards | Metabase explores arbitrary data. This dashboard is opinionated, has no SQL surface, and could not leak a table by accident. |
| Tremor | A React component library for building dashboards and charts | Tremor provides the parts; this is an application with a design system, a contrast contract and a deterministic mock API — any of it could be rebuilt on Tremor, and the a11y rules are what it would add. |

What the others do that this dashboard could still add: saved segments and filters, tokenised share
links and embedded widgets, scheduled email reports, annotations, click-through drill-downs,
CSV and image export, dashboards described as files, and the breadth that comes from a widget
vocabulary. Where it is ahead and should stay ahead: accessibility is enforced by measurement
rather than intention — the contrast suite recomputes every ratio from the worst-case gradient stop,
a test reads the stylesheet to prove the sticky toolbar never becomes as transparent as the panels,
and the colour scan fails on any utility class nobody measured. Every chart carries a hidden data
table. Translation is real GNU gettext with each catalog's own plural rules. The mock API is a pure
router with fault and empty switches, so error and empty states are designed rather than discovered.
And the generated client is never patched by hand, which is why the dashboard can be regenerated
against a new core release without a review of hand-written glue.

## In the long run

The multi-year bet is that **accessibility and calm are a product feature, not compliance work**: a
dashboard that a screen reader can narrate, that a projector cannot wash out, and that a person can
read in one breath is a different thing from a wall of widgets, and the contrast contract plus the
hidden data tables are how that claim survives future contributors. The second bet is that
**panels outlive this application**: the same components, driven by any OpenAPI document that
matches the core's shapes, could be published for other privacy-friendly cores, which turns a
single application into a small ecosystem. The third is that **the design system stays a system**:
tokens, materials and easing curves in one file, mirrored by a tested model, so a new theme is a
data change that either passes the contract or does not ship. The fourth is that **the client stays
a pure client**: no server-side rendering, no embedded analytics logic, no local cache of truth
beyond what TanStack Query holds — which keeps the privacy story of the core intact all the way to
the last pixel.

## What this document is for

Use it to decide whether a change belongs here or in the core. Anything that computes, stores or
aggregates belongs to the core; anything that explains, compares or presents belongs here. A
proposal that adds a query builder, a canvas of draggable widgets, or a second source of truth for
the data model is out of scope whatever its popularity, and a proposal that measurably improves
contrast, keyboard path or legibility is always in scope.

*This document describes intent, not commitments; the code, the release notes and the issue tracker
say what is actually true today.*
