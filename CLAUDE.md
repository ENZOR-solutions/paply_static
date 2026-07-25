# CLAUDE.md

## What This Project Is

**paply_static** is the public marketing site for **Paply**, ENZOR Solutions' SaaS for electronic invoice exchange (e-invoice / e-Račun) in Slovenia, Croatia, and Serbia. This repo is **not** the app — it's a single static landing page whose only jobs are:

1. **Get found.** Good SEO, indexable content, fast load, clear positioning — this is the top-of-funnel surface that ranks and gets shared.
2. **Point to `paply.app`.** Every CTA should lead a visitor toward the real product.
3. **Set expectations correctly while Paply is in testing.** Paply is **not yet publicly live** — it's in its testing stage. The site must say so clearly. See **Coming Soon** below before editing any CTA or pricing copy.

The actual product (React/FastAPI, full feature set, Stripe billing, REDOK e-invoice integration, etc.) lives in a separate repo — that project's own `CLAUDE.md` is the source of truth for how Paply itself works, its pricing plans, compliance rules, and architecture. Treat facts from here (pricing tiers, feature names, country coverage) as *marketing content to keep in sync with*, not as something this repo implements or enforces.

## Current State — IMPORTANT

- `index.html` is a **single self-contained HTML file** styled with the **Tailwind CDN script** (`cdn.tailwindcss.com`) plus a small inline `<style>` block for brand tokens. No build step, no bundler, no `node_modules`, no package.json.
- `assets/` holds the logo, icon-logo, and favicon (`.ico`).
- No CI/build pipeline exists in this repo yet. `git log` shows a prior "test auto deploy" commit but no workflow files are checked in — confirm actual hosting/deploy mechanism (S3+CloudFront, GitHub Pages, Netlify, etc.) before assuming one when asked to wire up deploys.
- Remote: `github.com/ENZOR-solutions/paply_static`.

## Coming Soon — Messaging Rule

**Paply is in testing.** The hero badge reads "Coming soon to Slovenia, Croatia & Serbia" (translated per-language, `hero_badge` key) instead of claiming live availability. Concretely:

- It's fine to describe *what Paply will do* (features, countries, pricing plans) in full detail — that's good SEO content and sets expectations. What's not fine is language that implies the product is broadly, publicly available *right now*.
- **Every CTA on the page** (`get_started_free`, `start_free`, `select_plan` — header button, hero buttons, all four pricing-card buttons, bottom CTA button) is a real link to **`https://paply.app/login`**, i.e. the actual app's login page. This is a deliberate choice: Paply already has real early customers using the live product (see the main app's `CLAUDE.md`, "Current Clients"), so sending visitors to the real login page is accurate even while the site's own framing stays "coming soon" for the general public. Don't revert these to in-page `#pricing` anchors — that was the old placeholder behavior before real links were added.
- `Contact sales →` stays a `mailto:sales@paply.si` link — unrelated to this rule.
- If Paply's login/signup route ever moves off `https://paply.app/login`, update every occurrence of that URL in `index.html` (currently 7: header, hero, 4 pricing cards, bottom CTA) — there's no shared constant for it in this plain-HTML setup, so each `href` is literal.
- If/when Paply exits testing entirely, flip the hero badge and hero copy back to "live" language — a content edit, not a rebuild.

## SEO Priorities

Since discoverability is the main point of this site, keep these in mind on every edit:

- Keep `<title>` and `<meta name="description">` accurate, keyword-relevant (e-invoicing, e-Račun, fiscalization, Slovenia/Croatia/Serbia), and under ~160 chars for the description.
- Add structured data (`Organization`/`SoftwareApplication` JSON-LD) and Open Graph / Twitter card tags if not already present — currently missing from `index.html`.
- Use one `<h1>` per page, semantic heading hierarchy, and descriptive `alt` text on images (currently `assets/logo.png` has `alt="Paply"` — keep alt text descriptive, not just the brand name, where it helps).
- Keep the page fast: no heavy JS beyond the Tailwind CDN script, no render-blocking resources, compress/optimize anything added to `assets/`.
- Canonical URL, `robots.txt`, and `sitemap.xml` should point at the production domain (`paply.app` or wherever this static site is actually hosted — confirm which before adding, since the marketing site and the app may live on different hosts/subdomains).
- Every internal link that should lead to the product goes to `paply.app`, not a relative path within this static site.

## Brand — Paply Color System (Amber)

Match the main app's design tokens exactly — this site is the first impression of the brand.

Primary accent: `#EF9F27`. Use only for primary CTAs, active/focus states, the logo, and key highlighted numbers/badges.

**Design tokens already defined in `index.html`'s inline Tailwind config and `:root` CSS vars:**

| Token | Light value |
|---|---|
| `bg-primary` | `#F8F7F5` |
| `bg-secondary` | `#FFFFFF` |
| `bg-tertiary` | `#F1F0EC` |
| `text-primary` | `#18181A` |
| `text-secondary` | `#6B6869` |
| `text-tertiary` | `#9A9896` |
| `border-default` | `#E3E2DE` |
| `border-emphasis` | `#CCCAC5` |
| `accent` | `#EF9F27` |
| `accent-surface` | `rgba(239,159,39,0.12)` |

Border radius scale: `rounded-input` (6px) · `rounded-button` (8px) · `rounded-card` (12px) · `rounded-modal` (16px).

**Typography:** weights 400 and 500 only — never 600 or 700, matching the app. Keep font sizes within the app's scale (11/12/13/14/16/18/22px) plus the larger display sizes already used for the hero (`40px`/`52px`) and section headers (`30px`).

Never use `#000000` or generic grays on branded surfaces — always the tokens above. If a dark mode is added later, mirror the semantic state colors from the main app's `CLAUDE.md` (Approved/Error/Warning/Info) rather than inventing new ones.

## Content Facts to Stay Consistent With

Pull these from the main Paply app when writing copy, and don't drift from them without confirming against the app's `CLAUDE.md` (plans/limits change there first):

- **Countries:** Slovenia, Croatia, Serbia. Croatia's B2B e-invoicing mandate goes live Jan 2026; Slovenia's mandate follows Jan 2028. Don't claim a country is "live" if the app itself isn't serving real customers there yet.
- **Plans:** FREE (€0, drafts only, no network sends) · START (€12/mo, 50 sends) · CORE (€27/mo, 200 sends, REST API, AI invoice scanning) · PRO (€59/mo, 500 sends) · ENTERPRISE (custom, 1000+ sends). Invoice *creation* is always unlimited; the quota is only for e-invoice network sends. The pricing cards use a **"seat" + inheritance** pattern (each tier's list starts with its seat/observer count, then "Everything in [previous tier], plus:" followed by only that tier's *new* items) rather than repeating every feature on every card — when a plan's included features change, update the specific tier's `*_feat*` keys, not a duplicated list on the tier above it. FREE additionally lists what it explicitly *excludes* (`free_limit`: no network delivery, no fiscalization) styled without a checkmark (`.pricing-feat` CSS class adds the ✓ — omit that class for exclusion/inheritance lines).
- **Headline features:** structured e-invoice send/receive over the exchange network or PDF-by-email, automatic FURS-style fiscalization (QR / PDF417 / Code 128 barcodes), AI invoice scanning (CORE+), 11-year statutory archive, team roles/observers, REST API (CORE+).
- **Contact:** `info@enzor.si` is used in the footer and the "Contact sales" mailto — confirm this is still the right address before changing it again, since the product itself runs on the `paply.app` domain for SES/auth.
- Do **not** mention any underlying e-invoice network/vendor by name anywhere on this public site — Paply's exchange-network provider operates under a white-label contract and must never be named or otherwise identifiable in public-facing content. This is public-facing marketing copy, the highest-exposure surface for that rule.

## Internationalisation

The site supports **English, Slovenian, and Croatian** via **client-side, browser-language auto-detection** — no manual language switcher, no separate URLs per language.

- All translatable strings live in one `translations` object inside the `<script>` block at the bottom of `index.html`, keyed by `en`/`sl`/`hr`. Markup elements carry `data-i18n="key"` (for text content) or `data-i18n-attr="attr:key"` (for attributes — currently used only for the `<meta name="description">` tag).
- On load, an IIFE reads `navigator.languages`/`navigator.language`, picks the first supported code (`en`/`sl`/`hr`, matched on the first two characters, e.g. `sl-SI` → `sl`), defaults to `en` if nothing matches, sets `<html lang>` accordingly, and swaps every `[data-i18n]`/`[data-i18n-attr]` element's text/attribute.
- The static HTML served before JS runs is always **English** — that's the fallback for JS-disabled visitors and, in practice, what most search-engine crawlers will index.
- **Known SEO trade-off (accepted deliberately):** because language switching is client-side only with no distinct per-language URL, search engines will primarily index and rank the English content — the Slovenian and Croatian text is very unlikely to surface in local (`google.si`/`google.hr`) search results. This was a conscious choice for simplicity over the alternative (separate crawlable pages per language with `hreflang` tags), made despite this site's SEO priority above. If organic search traffic from Slovenia/Croatia becomes a real growth channel later, revisit this — it would mean splitting into per-language static pages (e.g. `/`, `/sl/`, `/hr/`) with `hreflang` alternates and a one-time redirect based on browser language, not deepening the current single-page approach.
- **Adding a new string:** add the `data-i18n` key to the markup, then add the key to all three language blocks (`en`, `sl`, `hr`) in the `translations` object — don't add a key to just one language.
- **Reused strings:** several keys are intentionally shared across multiple elements with identical copy (e.g. `select_plan`, `vat_excl`, `feat_ai_unlimited`, `get_started_free`, `start_free`, `per_month`) — reuse an existing key instead of creating a near-duplicate when the English text is genuinely the same string in two places.
- **Plan tier names** (`Free`, `Start`, `Core`, `Pro`, `Enterprise`) are deliberately **not translated** — kept as English brand/tier names in all three languages, consistent with how the product itself names its plans.
- **Adding a 4th language:** add a new key (e.g. `sr` for Serbian, matching the app's country coverage) to both `SUPPORTED` and `translations` in the script, and to every `data-i18n` key already in use.

## Working Conventions

- This is plain HTML/CSS via Tailwind's CDN build — there is no `npm install`/build/test step. Edit `index.html` directly and open it in a browser (or a local static server) to preview.
- Keep it a single-file site unless a real reason emerges to split it up (e.g. adding a second page like `/privacy` or `/terms`) — don't introduce a framework, bundler, or component system for a one-page brochure site.
- Optimize images added to `assets/` before committing (the existing PNGs/ico are small — keep new additions similarly lightweight).
- No secrets belong in this repo — it's a fully public static site with no backend.

## Mobile Support — MANDATORY

**Every change to this site must work on mobile, not just desktop.** This is a marketing/SEO landing page — most of its traffic will be on phones. Concretely:

- Before considering any visual or structural change done, check it at a **narrow viewport, down to 320px** (not just 375px/desktop) — 320 is where cramped layouts actually break first (the header CTA wrapped to two lines and collided with the hamburger button at 320px before this was fixed). Don't eyeball the Tailwind responsive classes and assume — actually render it (a local static server + headless Chromium via Playwright, or a mobile-width browser window, is enough; there's no test suite to lean on here).
- Check for: horizontal overflow (`document.documentElement.scrollWidth` shouldn't exceed `clientWidth`), content that's `hidden md:flex`/`md:block` with no mobile equivalent, cramped/wrapping elements at 320px specifically, and touch-target sizing on buttons/links.
- **Header, mobile-first:** below `md`, the header shows only the logo and the hamburger button (`#mobile-menu-btn`) — the primary CTA (`hidden md:inline-flex`) is deliberately *not* shown inline on mobile (it used to be, and wrapped/crowded the hamburger at 320px); instead it's repeated as a full-width button inside the mobile menu panel itself. If a new header-level CTA or icon is added, default it to `md:`-only visibility too, rather than assuming there's room for it next to the logo + hamburger on a 320px screen.
- The header nav pattern to follow when adding new nav items: add the link to *both* the desktop `<nav class="hidden md:flex">` and the mobile `<nav id="mobile-menu" class="mobile-menu md:hidden ...">` — they're two separate lists in the markup, not one that reflows, so a link added to only one is invisible on the other breakpoint.
- **Mobile menu animation:** the panel's open/close is driven by the `.mobile-menu` CSS class (`max-height`/`opacity` transition, defined in the `<style>` block) plus inline `style.maxHeight` set from `menu.scrollHeight` in the toggle script — not a plain `hidden` class swap, since that can't be transitioned. If menu content changes height (e.g. a link added/removed), no code change is needed — `scrollHeight` is read fresh on every open, and also recomputed on window resize while open. The hamburger icon morphs to an X via two swapped inline SVGs (`#menu-icon-open`/`#menu-icon-close`) — keep both in sync if the icon changes.
- The toggle script (bottom of `index.html`, the `mobile-menu-btn`/`mobile-menu` IIFE) auto-closes the menu on link click and on resize past the `md` breakpoint (768px) — keep that behavior if the menu markup changes.
- The in-page smooth-scroll script already computes its offset from the *live* `header.offsetHeight`, so it correctly accounts for the taller header when the mobile menu is open — don't hardcode a scroll offset that would break that.
