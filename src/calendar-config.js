// Static config for the LEF calendar scraper.
// All vendor-specific knobs live here so src/scrape.js stays small.

export const GRAPHQL_URL = 'https://portal.lefclimbing.com/graphql-public';

// `Language` enum value accepted by rphq's API. Confirmed via error response.
export const LANGUAGE = 'ENGLISH';

// CalendarFilter shape (minus startDate/endDate/planId, which are filled in
// dynamically per-request).
//
// - facilityId: LEF's facility node (Relay global ID). Decodes to "Facility:10000009".
//   The Redpoint HQ storefront at portal.lefclimbing.com is shared with Mosaic
//   (Facility:10000012), so this id is what scopes the calendar to LEF.
//   Won't change unless LEF re-keys the portal. To re-capture if it does, run
//   `node scripts/capture-calendar-input.mjs` (verbose mode) and copy the field.
// - planId: NOT here. Comes from src/portal-visible-plan-ids.js, which mirrors
//   the planId[] LEF's public calendar SPA itself queries for — regenerated
//   daily by the calendar-allowlist GitHub Action.
export const CALENDAR_INPUT_EXTRA = {
  facilityId: ['RmFjaWxpdHk6MTAwMDAwMDk='],
};

// Page size for the StorefrontPlansQuery. LEF's shared catalog is ~140 plans,
// so 250 covers it with headroom.
export const PLANS_PAGE_SIZE = 250;

// The portal rejects multi-month ranges ("short time frame"); 21-day windows
// mirror what the vendor SPA itself requests.
export const WINDOW_DAYS = 21;

// How far ahead to scrape. 6 months covers Summer Camp + Boulder League + a
// full recurring-class horizon without hammering the API.
export const MONTHS_AHEAD = 6;

// NOTE: the plan ALLOWLIST has no denylist (unlike Mosaic) — it faithfully
// mirrors LEF's portal calendar SPA, day-pass plans included.
//
// But at RENDER time we hide day passes from the events grid: they're
// reservation-only and surfaced via a dedicated "Reserve a day pass" CTA
// (homepage / calendar / climb-with-us), so showing hundreds of individual
// day-pass reservation slots as chips would bury the actual programs. This
// regex is matched against each plan's vendor slug in buildPayload(). Keep it
// narrow — it should only ever match the day-pass plan(s).
export const CALENDAR_HIDE_SLUGS = /day-pass/i;

// Heuristic mapping from a publicTitle to one of our four UI categories.
// Order matters — first match wins. `member` is checked BEFORE `youth` so a
// "Member Events | Blue/Black" grade-night isn't miscategorized as youth on the
// word "Blue". Tuned to LEF's program names:
//   member  → Member Events (any "Member Events | …" grade night / meet-up)
//   youth   → Green/Blue/Purple Club, Advanced Team, Summer Camp
//   workshop → Top Rope Class, Lead Class, Gym to Crag, Yoga, Boulder League,
//              Climbing 101, Hangboarding
//   event   → anything else
export const CATEGORY_RULES = [
  { test: /\b(member|meet[\s-]?up)\b/i, category: 'member' },
  { test: /\b(camps?|kids|youth|teen|club|green|blue|purple|team)\b/i, category: 'youth' },
  { test: /\b(learn|intro|belay|technique|workshop|clinic|lesson|class|league|training|yoga|hangboard|lead|crag|101|sign[\s-]?up)\b/i, category: 'workshop' },
];
