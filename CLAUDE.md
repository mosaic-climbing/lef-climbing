# LEF Climbing — site handoff

Static marketing site for LEF Climbing (indoor climbing gym, 916 N Broadway, Lexington, KY 40505 — phone 859-523-0518, opened TBD (confirm with owner)). Replaces the existing Wix site at https://www.lefclimbing.com. Owner is the owner; primary maintainer is Chris. Public site contact email is `info@lefclimbing.com` (shown in the JSON-LD); **all form submissions are delivered to `nicole@lefclimbing.com`** — kept distinct from Mosaic's inbox. LEF is the only climbing gym in Lexington.

## Stack

- Plain HTML + one CSS file + two JS files (`script.js` on every page, `calendar.js` only on `/calendar`). **No frontend framework and no build step for the pages.** There IS a small Cloudflare Worker entry (`src/worker.js`) that serves `/api/events` for the live events calendar — Workers Builds bundles it on push. See the **Events calendar** section below.
- `scripts/dev-server.mjs` (local preview) uses Node built-ins only — nothing to install. `scripts/capture-calendar-input.mjs` (the daily allowlist sync) uses **Playwright**, declared in `scripts/package.json`; the GitHub Action `npm ci`s it + downloads headless Chromium. Don't add deps to the runtime Worker (`src/`) — those stay framework-free.
- **Hosting**: Cloudflare Workers Assets (static) **+ Worker entry (`src/worker.js`)** for `/api/events`. See [MIGRATION.md](MIGRATION.md) for the Wix → Cloudflare cutover.
  - Active deploy URL: `https://lef-climbing.chris-shotwell.workers.dev/`
  - Target custom domain: `lefclimbing.com` (cutover from Wix per MIGRATION.md)
  - Deploy: push to `main` → Cloudflare Workers Builds auto-deploys (see Deploy section below).
  - Config: [wrangler.jsonc](wrangler.jsonc) (`main: "src/worker.js"`, `assets.binding: "ASSETS"`, a ratelimit `unsafe.binding`); security/cache headers + CSP in [_headers](_headers); legacy URL 301s in [_redirects](_redirects); [.assetsignore](.assetsignore) keeps server-only paths (`src/`, `scripts/`, `.github/`, `wrangler.jsonc`, docs) out of the public asset bundle.
  - Zone hardening: `scripts/harden-cloudflare.sh` applies SSL/HTTP3/Auto Minify/etc. (idempotent; needs `CLOUDFLARE_API_TOKEN`).
  - Repo: `mosaic-climbing/lef-climbing` on GitHub. Public.
- Local dev: `python3 -m http.server 8000` for the static pages — but `/api/events` won't work under it, so the calendar shows its error state. To preview the **live calendar locally with no npm**, run `node scripts/dev-server.mjs` (serves the site + `/api/events` on `http://localhost:8000`). `npx wrangler dev` also works but pulls wrangler via npm.
- **Fonts**: League Spartan (display weight 900) + Inter (body weights 400/500/600/700/800) + JetBrains Mono (numerics 500). **Self-hosted** under `/fonts/` — the `@font-face` rules live inline at the top of `styles.css`. Originally pulled from Google Fonts; switched to self-hosting to eliminate two third-party round-trips.
- **No JS framework**. `script.js` handles: mobile nav toggle, sticky-header scroll state, `aria-current` on nav (clean-URL aware), year auto-fill, injected chat widget (POSTs to FormSubmit → `nicole@lefclimbing.com`). `calendar.js` renders the events week-view (only loaded on `/calendar`). LightWidget Instagram embed and Flodesk newsletter from Mosaic were removed; not in use. Don't add libraries.

## File map

```
index.html              home (hero, get-climbing CTAs, disciplines, programs, visit)
about.html              about / disciplines / Yoga / classes cards / FAQ
booking.html            group events + youth/adult instruction + private rates
                        (renamed from classes.html; /classes 301s here)
membership.html         adult / youth memberships
calendar.html           live events calendar (week view; consumes /api/events)
contact.html            address, phone, contact form
climb-with-us.html      buy day pass / membership / gift card / summer camp / waiver
waiver.html             redirect to portal waiver
404.html                error page
styles.css              @font-face rules + entire design system + calendar styles.
                        One file on purpose. ?v=N cache-buster on every <link>; bump N on edits.
script.js               minimal interactive behaviors (see Stack section above)
calendar.js             events week-view UI (only loaded on calendar.html)
fonts/                  self-hosted WOFF2 subsets for Inter / League Spartan / JetBrains Mono
images/                 photo library (referenced + extras — owner keeps unused ones)
src/                    Worker source (bundled by Workers Builds on push)
  worker.js               entry: routes /api/events, delegates rest to ASSETS
  events-api.js           GET /api/events — rate limit, 5-min edge cache, error handling
  scrape.js               StorefrontPlansQuery + windowed StorefrontCalendarQuery (parallel)
  normalize.js            rphq row → events.json row; deep-link URLs via planId→slug map
  calendar-config.js      vendor knobs: GRAPHQL_URL, facilityId, category rules
  portal-visible-plan-ids.js   AUTO-GENERATED allowlist of plan IDs the LEF
                               portal calendar SPA queries for (don't hand-edit)
scripts/
  capture-calendar-input.mjs   Playwright capture of the LEF calendar SPA's
                               StorefrontCalendarQuery planId[] — see calendar
  render-allowlist-diff.py     turns an allowlist diff into named programs for
                               the bot PR body
  dev-server.mjs          npm-free local server (static + /api/events) for local calendar testing
  harden-cloudflare.sh    one-shot zone hardening (SSL/HTTP3/etc.) — see Deploy
  package.json            dev-only, ZERO dependencies
sitemap.xml, robots.txt, llms.txt    SEO + AI discoverability
wrangler.jsonc          CF Workers config (assets binding + Worker entry + ratelimit)
_headers                security headers + CSP + Cache-Control rules
_redirects              Wix-legacy + /classes→/booking 301s
.assetsignore           keeps server-only files out of the static bundle
.github/workflows/calendar-allowlist.yml   daily Action: regenerate the calendar allowlist, PR on drift
.github/workflows/cloudflare-harden.yml    manual-trigger zone hardening
.github/dependabot.yml  weekly GitHub-Actions version bumps (keeps the SHA-pinned PR action current)
MIGRATION.md            Wix → Cloudflare DNS + registrar cutover playbook
favicon.ico, favicon-32.png, favicon-192.png, apple-touch-icon.png
```

## Design system

### Tokens (`:root` in `styles.css`)

- **Surface**: `--bone` `#fafafa`, `--bone-deep` `#ededec` (neutral, no warm tints — owner explicitly rejected those).
- **Ink**: `--ink` `#0a0a0a` (charcoal, not pure black).
- **Accent**: `--clay` `#1e5d57` (teal — the actual lefclimbing.com brand color). `--clay-deep` `#143f3b` for hover. Do not swap to coral / orange / terracotta — owner rejected those repeatedly. Calendar chips inherit these tokens (no hardcoded colors).
- **Display font**: `--display: 'League Spartan', 'Anton', 'Oswald', 'Inter', system-ui, sans-serif`. Heavy geometric sans.

### Typography rules

- **One headline style**: `h1`, `h2`, `h3` all use League Spartan, all caps, weight 900, letter-spacing -0.01em. Sizes scale via `clamp()`. `h4` uses Inter for footer column labels.
- **No italics anywhere.** Owner asked for them stripped sitewide.
- **Eyebrow style**: `.eyebrow` / `.kicker` / `.marker` are aliases — small uppercase tracked sans, mid-grey. Used sparingly (inside cards/media, never above a section h2).
- **No eyebrows above section h2 titles** — owner called them weird and unnecessary.
- Body: `<p>` and `<p class="lede">` (intro / pull paragraph, max-width 72ch). That's it.

### Components

- **`.photo-hero`** — full-bleed photo with overlay text. Used on home (full mega height) and `.photo-hero--page` variant for subpages (~60vh).
- **`.section`** — vertical section. Variants: `.section-bone-deep` (light grey), `.section-ink` (charcoal with film-grain), `.section-tight` (less padding).
- **`.alt-rows` / `.alt-row`** — full-width alternating photo/text rows. **Text-only alt-rows (no `.alt-row__media`) auto-collapse to a single full-width column** via a scoped `:has()` rule — that's how the booking package families render without photos. Add a `.alt-row__media` to get the 2-column photo/text layout.
- **`.cols`** with `.cols-2-equal` / `.cols-narrow-wide` / `.cols-5-7` for two-column layouts. Stacks under 800px.
- **`.compare`** pricing tables, **`.num-list`** / **`.check-list`** / **`.card`** / **`.tlink`** / **`.media`** — all present in `styles.css`.
- **`.faq`** — `<details class="faq"><summary>…</summary><div class="answer">…</div></details>` disclosure blocks (About FAQ).
- **`.cal-*`** — the calendar week-grid / agenda / modal component (see Events calendar).
- **Buttons**: `.btn .btn-primary` (teal filled), `.btn-ghost` (outlined on light bg), `.btn-sm-dark` (small dark, used in alt-rows), `.btn-on-dark` / `.btn-on-dark-ghost` (on dark sections), `.btn-sm`. Modifiers `.btn-lg`, `.btn-arrow`.

### Photos

- Real images from the live lefclimbing.com site, optimized to 1800px max (JPEG q85 + `.webp` + `.avif`; AVIFs re-encoded `-q 75`). Each `<img>` ships a `<picture>` with avif/webp/jpg sources.
- **`images/` is intentionally a library** — keep unreferenced photos (owner request).
- Library: `bouldering-action.*`, `roped-instruction.*` (originals), plus `youth-group.*` (used in the home hero-promo card), `fitness-center.*`, `lead-climbing.*`, `bouldering-wide.*` (added from the owner's Drive set; available for future use).
- **Pulling more photos from the owner's Drive folder** (the Drive MCP connector can't see it; use plain HTTP — the folder is "anyone with link"): get the file list from `https://drive.google.com/embeddedfolderview?id=<FOLDER_ID>#list` (server-rendered HTML with `/file/d/<ID>/` links), then download each by ID with `curl -sL "https://drive.google.com/uc?export=download&id=<ID>" -o name.jpg`. Optimize with the pipeline below.
- Optimize pipeline (matches the repo convention): `sips -s format jpeg -s formatOptions 85 -Z 1800 in.jpg --out images/name.jpg` → `cwebp -q 82 images/name.jpg -o images/name.webp` → `avifenc -q 75 images/name.jpg images/name.avif`. Then add a `<picture>` with avif/webp/jpg sources.
- Hero photos use `fetchpriority="high" decoding="async"` (no lazy). Below-fold images use `loading="lazy" decoding="async"`.

## Forms

- **All forms POST to FormSubmit.co** with `action="https://formsubmit.co/nicole@lefclimbing.com"`. Single inbox, LEF-specific (not shared with Mosaic).
  - `contact.html` — general inquiries (`_subject`: "Contact form …")
  - `booking.html` (`#inquire`) — group event / booking inquiries; every "Inquire" CTA across the page anchors to this form (`_subject`: "Group booking inquiry …", `_next`: `/booking?sent=1#inquire`)
  - Chat-bubble widget (injected on every page) — AJAX POST to `formsubmit.co/ajax/nicole@…`
  - First submission to each `_subject` triggers a one-time FormSubmit activation email — see [MIGRATION.md](MIGRATION.md).

## Events calendar (`/calendar`)

The events page renders a week view (desktop grid / mobile agenda) backed by the Worker route `/api/events`, which proxies LEF's **Redpoint HQ** storefront GraphQL (`https://portal.lefclimbing.com/graphql-public`), normalizes rows, and caches 5 min at the edge. Same vendor as Mosaic; the portal at `portal.lefclimbing.com` is **shared between LEF and Mosaic**, so the LEF `facilityId` is what scopes events to LEF.

- **Vendor: Redpoint HQ.** The `calendar(input)` query requires BOTH `facilityId` AND a `planId` allowlist (an unfiltered query 500s).
- **`facilityId`**: `RmFjaWxpdHk6MTAwMDAwMDk=` (decodes to `Facility:10000009`; Mosaic is `…0012`). In `src/calendar-config.js`. Won't change unless LEF re-keys the portal; if it does, run `node scripts/capture-calendar-input.mjs` (verbose mode) and copy the field.
- **Allowlist (`src/portal-visible-plan-ids.js`)**: AUTO-GENERATED. It **mirrors the planId[] LEF's own public calendar SPA queries for** — the portal calendar lives at `https://portal.lefclimbing.com/lef/calendar/n/untitled` (NOT `/lef/n/calendar`, which 404s). The portal calendar is the source of truth: whatever it shows, the marketing calendar shows. **No denylist** — unlike Mosaic, LEF sells day passes by reservation *through this calendar*, so day-pass plans are intentionally included. Today it resolves to 14 plans (Top Rope Class, Climbing 101, Lead Class, Gym to Crag, Yoga, Green/Blue/Purple Club, Advanced Team, Member Events, Summer Camp, Boulder League, Day Pass).

### Adding / retiring events (the GitHub Action)

`.github/workflows/calendar-allowlist.yml` runs **daily** (and on manual dispatch): `scripts/capture-calendar-input.mjs` loads the LEF portal calendar in headless Chromium, reads the `planId[]` the SPA fires in its `StorefrontCalendarQuery`, and opens a PR when the set drifts from what's committed. So when staff add a program to the **portal calendar** (`/lef/calendar/n/untitled`), the next run mirrors it → PR (with a human-readable Added/Removed list via `scripts/render-allowlist-diff.py`) → merge → it appears on the marketing calendar. Retiring works in reverse. Force a sync now: GitHub → Actions → "Calendar allowlist sync" → Run workflow. The PR action is SHA-pinned and kept current by `.github/dependabot.yml`.

Knobs that might need touching in `src/calendar-config.js`: `CATEGORY_RULES` (publicTitle → youth/member/workshop/event chip category — `member` is intentionally tested before `youth` so "Member Events | Blue/Black" isn't mis-tagged on the word "Blue"), `MONTHS_AHEAD`/`WINDOW_DAYS`.

### Worker + rate limit

`wrangler.jsonc` declares `main: "src/worker.js"`, `assets.binding: "ASSETS"` (static delegation), and an `unsafe.bindings` ratelimit (`EVENTS_RATE_LIMIT`, 60 req/60s per IP, checked before the upstream fan-out). The Worker caches `/api/events` in `caches.default` (`s-maxage=300, swr=600`).

## SEO + AI discoverability

- Per-page unique `<title>` (≤60 chars), `<meta description>` (140–160 chars), canonical, OG + Twitter.
- **Clean URLs**: internal links drop the `.html` extension (`href="about"`, brand logo `href="/"`); Workers Assets serves `/about` from `about.html` and 307s `/about.html`→`/about`. Avoids the per-nav redirect penalty.
- JSON-LD: `SportsActivityLocation` on every page. Home adds `WebSite` + 3 `Service` blocks (bouldering / ropes / yoga). About has a visible FAQ whose copy mirrors its `FAQPage` JSON-LD (Google requires the structured data to match visible content — keep them in sync). `foundingDate` is omitted until the owner confirms LEF's open date — don't invent it.
- `llms.txt`, `sitemap.xml`, `robots.txt` at root.

## Accessibility

- Each page has exactly one `<h1>`. No skipped levels. Footer column labels use `<p class="foot-heading">`.
- axe-core WCAG 2.1 AA target: zero violations. Run via Chrome DevTools / chrome MCP.
- Every `<img>` has descriptive `alt`; decorative images use `alt=""`.

## Cache busting

Every HTML file references `styles.css?v=N`, `script.js?v=M`, and (on `/calendar`) `calendar.js?v=K`. Current values:

- `styles.css?v=7`
- `script.js?v=3`
- `calendar.js?v=1`

Bump across every HTML file when the file changes (calendar.js only appears in calendar.html):

```bash
# CSS bump (7 → 8)
for f in *.html; do sed -i '' 's/styles\.css?v=7/styles.css?v=8/g' "$f"; done
# JS bump (3 → 4)
for f in *.html; do sed -i '' 's/script\.js?v=3/script.js?v=4/g' "$f"; done
# calendar.js bump (1 → 2)
sed -i '' 's/calendar\.js?v=1/calendar.js?v=2/g' calendar.html
```

`_headers` sets `Cache-Control: immutable, max-age=31536000` on `/styles.css`, `/script.js`, `/calendar.js`, `/images/*`, `/fonts/*`. `/api/events` has its own 5-min edge cache (see Events calendar).

## Deploy

**Push to `main` on GitHub → Cloudflare auto-deploys** (Cloudflare Workers Builds, connected to `mosaic-climbing/lef-climbing`). Every push uploads the static assets and bundles `src/worker.js`. `_headers` and `_redirects` are honored.

```bash
git add ... && git commit -m "..." && git push origin main
```

Check the build at https://dash.cloudflare.com → Workers & Pages → `lef-climbing` → Deployments. Don't run `wrangler deploy` locally (bypasses Git history + the build pipeline).

Zone-level settings are configured by `scripts/harden-cloudflare.sh` (wrapped in [cloudflare-harden.yml](.github/workflows/cloudflare-harden.yml)). See [MIGRATION.md](MIGRATION.md) for the Wix → Cloudflare story.

## Things the owner has rejected (do not reintroduce)

- Italics anywhere
- Coral / orange / terracotta accent (teal only)
- Warm-tinted off-white surfaces (cream/peach reads as "AI design")
- Eyebrows above section headlines
- "BP" / "Bouldering Project" references
- Numbered marker prefixes ("01 ABOUT US")
- Text-shadow on the hero headline
- Invented copy anywhere
- Double-arrow on link-with-arrow elements (`.tlink::after` adds the arrow; don't also put `→` in the link text)
- A "what sets us apart / vs competitors" section — LEF is the only gym in Lexington, so don't port Mosaic's competitive-superlatives list.

## Outstanding / nice-to-haves

- **Photos.** The home hero-promo card (youth teaser → `booking#youth`) is now wired with `youth-group.jpg`. `fitness-center.*`, `lead-climbing.*`, `bouldering-wide.*` are in the library but not yet placed — candidates to give the disciplines/booking their own imagery instead of reusing the two originals, or to add a Fitness discipline (the gym has a real fitness center — see `fitness-center.jpg`). No yoga-studio photo exists in the owner's set, so the About "Yoga" section stays text-only for now. ~250 more photos are in the Drive folder (see Photos section for how to pull them).
- About FAQ specifics (auto-belay weight range 25–310lbs, under-14 supervision) are carried from the original site's JSON-LD — confirm they're LEF-true and update the visible FAQ + JSON-LD together if not.
- `foundingDate` JSON-LD pending the owner's confirmed open date.
- Holiday-closures list on `/calendar` is a single hardcoded entry — owner to maintain.
- Mobile (≤380px) renders fine but hasn't been aggressively tuned.

## Don't

- Don't add a build step or frontend framework. The `src/` Worker IS bundled by CF Workers Builds — that's the Worker entry only.
- Don't add npm runtime dependencies to the calendar tooling — it's deliberately zero-dep (`fetch`/`http`/`fs`). CI runs no `npm install`.
- Don't add tracking / analytics scripts without asking.
- Don't change the navigation order (About / Booking / Membership / Calendar / Contact / Climb With Us).
- Don't replace the chat widget injection in `script.js` — the owner asked for that bottom-right contact bubble.
- Don't add an email-collection modal — owner doesn't want intrusive popups.
- Don't delete unreferenced photos in `images/` — owner keeps them as a library.
- Don't add `.html` to internal `href`s — use clean URLs (`href="about"`, home is `href="/"`).
- Don't hand-edit `src/portal-visible-plan-ids.js` — it's regenerated by `scripts/capture-calendar-input.mjs` / the daily Action.
- Don't widen the CSP in `_headers` to `'unsafe-inline'` for scripts. JSON-LD blocks are exempt; the site has no executable inline scripts. Allowlist a new origin only when you actually add a third-party script.
