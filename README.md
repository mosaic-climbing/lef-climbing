# LEF Climbing — static marketing site

The website for [LEF Climbing](https://www.lefclimbing.com), an indoor climbing gym in Lexington, Kentucky (greater Lexington). Replaces the existing Wix site.

Plain HTML + one CSS file + one JS file. No framework, no build step, no `package.json`.

## Live URLs

- **Production target**: `lefclimbing.com` (still served by Wix during the transition)
- **Repo**: `mosaic-climbing/lef-climbing` on GitHub

## Stack

- HTML/CSS/JS, no build tool
- **Hosting**: Cloudflare Workers Assets — auto-deploys from `main` via Cloudflare Workers Builds. Active URL: `https://lef-climbing.chris-shotwell.workers.dev/` (target custom domain: `lefclimbing.com`)
- **Forms**: [FormSubmit](https://formsubmit.co) — `contact.html` and `classes.html` POST to `info@lefclimbing.com` with a honeypot field
- **Fonts**: League Spartan (display) + Inter (body) + JetBrains Mono (numerics). Self-hosted under `/fonts/` (WOFF2 subsets, originally from Google Fonts)
- **No JS framework**. `script.js` handles mobile-nav toggle, sticky-header scroll state, `aria-current` on nav, year auto-fill, and an injected chat bubble

## Pages

```
index.html              home — hero, disciplines, visit, programs intro
about.html              about / disciplines (bouldering, ropes, fitness) / FAQ
classes.html            group events + youth/adult instruction + inquiry form
membership.html         adult / youth memberships + benefits comparison
calendar.html           events + link to portal calendar
contact.html            address, phone, contact form
climb-with-us.html      day passes / memberships / gift cards (links to portal)
404.html                error page
waiver.html             redirect to portal waiver
```

Plus `sitemap.xml`, `robots.txt`, `llms.txt`, `wrangler.jsonc`, `_headers`, `_redirects`, favicons.

## Local dev

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Any static server works.

## Deploy

Cloudflare Workers Builds auto-deploys on every push to `main`:

1. The `lef-climbing` Worker on Cloudflare is connected to `mosaic-climbing/lef-climbing` on GitHub. Each push to `main` kicks off a build that uploads the static assets in `.` (per `wrangler.jsonc`) to the Worker. `_headers` and `_redirects` are honored by Workers Assets.
2. Check builds at <https://dash.cloudflare.com> → Workers & Pages → `lef-climbing` → **Deployments**.
3. Custom domain: Cloudflare dashboard → Worker → **Settings** → **Domains & Routes** → add `lefclimbing.com`. Cutover playbook lives in [MIGRATION.md](MIGRATION.md).

Don't run `wrangler deploy` locally — it bypasses Git history and the build pipeline. Pushing to `main` is the supported path.

## Workflow

This site is maintained collaboratively with Claude. The flow:

1. Owner messages Claude what to change.
2. Claude edits files, commits to `main`, pushes.
3. Cloudflare Workers Builds auto-deploys in ~30 seconds.
4. Rollback = redeploy a previous build from the Cloudflare dashboard.

## Cache busting

`styles.css` is referenced as `styles.css?v=N` from every page. Bump `N` across all HTML files when the CSS changes:

```bash
for f in *.html; do sed -i '' 's/styles\.css?v=29/styles.css?v=1/g' "$f"; done
```

Required regardless of host: `_headers` sets `Cache-Control: immutable, max-age=31536000` on `/styles.css` and `/script.js`, so browsers won't refetch without the `?v=N` change.

## SEO + AI discoverability

- Per-page unique `<title>`, `<meta description>`, canonical, OG, Twitter Card
- JSON-LD on every page: `SportsActivityLocation` (with `paymentAccepted`, `areaServed`, `hasMap`, etc.). Home adds `WebSite` + 2 `Service` blocks. About adds `FAQPage`.
- `llms.txt` at root for LLM crawlers
- Page-specific OG images (each page's social preview matches its hero photo)

## Accessibility

axe-core WCAG 2.1 AA — **zero violations** across all 9 main pages. Includes:

- Semantic landmarks
- Skip-to-content link
- Visible focus rings
- Logical heading order (one `<h1>` per page)
- All form inputs labelled
- `aria-current="page"` on active nav link
- `prefers-reduced-motion` honored

## Don't

- Don't add a build step or framework.
- Don't add tracking / analytics scripts without asking.
- Don't change navigation order (About / Classes / Membership / Calendar / Contact / Climb With Us).
- Don't replace the Instagram embed (LightWidget) without asking — owner controls it.

## License

All site copy and photos belong to LEF Climbing. Fonts loaded from Google Fonts under their open licenses.
