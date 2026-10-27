# CLAUDE.md

## What This Project Is

**paply_static** is the public marketing site for **Paply** (www.paply.si), ENZOR's SaaS for e-invoicing (e-račun) and fiscalization in Slovenia and Croatia, with Serbia on the roadmap. This repo is **not** the app. Its jobs:

1. **Get found.** SEO, indexable content in three languages, fast load, clear positioning.
2. **Point to `paply.app`.** Every CTA leads toward the real product.
3. **Set expectations correctly while Paply is in testing.** See **Coming Soon** below before editing any CTA, feature or pricing copy.

The product itself (React/FastAPI, Stripe billing, the e-invoice network integration, mobile app) lives in `C:\ENZOR\Paply`; its `CLAUDE.md` is the source of truth for features, plans and compliance. Copy here must stay in sync with it, never ahead of it.

## Architecture — IMPORTANT

A multi-page static site produced by a **stdlib-only Python generator** (`build.py`, Python 3.9+, no pip installs). The generated HTML **is committed**; Vercel serves the repo root as plain static files with no build step on deploy.

```
src/layout.html          document skeleton (head, SEO tags, JSON-LD slot)
src/partials/*.html      header, footer, cta, icons (SVG sprite); <!-- @include name -->
src/pages/*.html         one file per page, starting with a <!--page {json} --> header
src/i18n/sl.json, hr.json  translations (flat "key": "text")
src/i18n/en.json         GENERATED from the English markup; don't edit, but do commit
assets/css/site.css      all styling (hand-written, no Tailwind)
assets/js/site.js        all behaviour (no dependencies)
assets/img, assets/fonts optimised WebP/PNG, self-hosted Inter (400/500 variable woff2)
tools/make_og.py         regenerates assets/img/og-<lang>.png (needs Pillow)
build.py                 generator
--- generated, committed ---
index.html, features/, pricing/, mobile/, e-invoicing/{,croatia/,slovenia/}, faq/, 404.html
sl/..., hr/...           same pages per language
sitemap.xml, robots.txt
```

**Workflow:** edit `src/` (or `assets/`), run `python build.py`, check the output in a browser, commit `src/` *and* the generated files together. `python build.py --check` exits 1 on any warning (use it before committing). Never hand-edit generated HTML; it is overwritten.

**Page header** (`src/pages/x.html`): `path` (URL, trailing slash), `title` and `description` (English; ≤ 65 / ≤ 160 chars, the build warns), optional `nav` (highlights a header link), `schema` (`software`, `faq`), `crumbs` (breadcrumb trail + BreadcrumbList), `priority`/`changefreq` (sitemap), `langs` (defaults to all three), `noindex`, `sitemap: false`.

**What the build does per page × language:** includes partials, swaps `data-i18n` text and `data-i18n-attr` attributes, prefixes internal links with `/sl/` or `/hr/`, writes canonical + `hreflang` alternates (en/sl/hr/x-default), Open Graph/Twitter tags (per-language `og-<lang>.png`), JSON-LD (Organization, WebSite, WebPage, plus SoftwareApplication with the four plan Offers, FAQPage built from the page's `<details class="faq">`, BreadcrumbList), cache-busting `?v=<hash>` on CSS/JS, then `sitemap.xml` with alternates.

**Placeholders:** `{{app}}` (https://paply.app), `{{site}}`, `{{year}}`, `{{crumbs}}`, `{{alt:sl}}` (this page in another language), `{{v:css/site.css}}`.

## Internationalisation

Real per-language URLs: English at `/`, Slovenian at `/sl/`, Croatian at `/hr/`, each with its own `<html lang>`, canonical and `hreflang` alternates, so all three are crawlable and can rank in google.si / google.hr. (This replaced the old client-side text swapping, which only ever got English indexed.)

- **English source text lives inline in the markup** with `data-i18n="page.key"`. Attributes use `data-i18n-attr="alt:key;aria-label:key2"`. A `data-i18n` element's content may contain inline HTML (`<strong>`, links); translations are inserted as HTML, so escape `&` as `&amp;`.
- **Adding/changing a string:** edit the English in `src/`, add/update the key in **both** `sl.json` and `hr.json`, run the build. It warns about missing keys, unused keys, and keys whose English changed since the last build ("re-check translation"), and about one key used with two different English texts.
- **Reuse keys** for identical strings (`common.*`, `faq.*` answers shared between pages, `nav.*`).
- **Plan names** (Free, Start, Core, Pro, Enterprise) are never translated, matching the app.
- **Terminology** follows the app's own sl/hr locale files (e.g. sl: Izdani/Prejeti, Osnutek, Likvidacija, Zastopana podjetja, Opomini; hr: Odlazni/Pristigli, Nacrt, Tijek odobravanja, Zastupane tvrtke, Opomene). Check `C:\ENZOR\Paply\frontend\src\i18n\locales\` before inventing a term.
- **Language choice:** `site.js` remembers an explicit pick (`localStorage['paply-lang']`) and, only on a first visit to an English page, follows `navigator.languages` once to `/sl/` or `/hr/`. Crawlers report English and stay put. Don't make this a server redirect.
- **Adding Serbian later:** add `"sr"` to `LANGS`/`OG_LOCALE` in `build.py`, create `src/i18n/sr.json`, add `sr` to the `localize_links` exclusion regex and the language menus in `header.html`/`footer.html`, extend `make_og.py`, rebuild.

## Coming Soon — Messaging Rule

**Paply is in testing** and opening up step by step; early customers already use it daily. The **e-invoice exchange network is not launched** (the app's `EINVOICE_NETWORK_ENABLED` switch is off) The **Android app is live on Google Play** (Slovenia and Croatia, since 2026-10-25); **iOS is not in the App Store yet**.

- Describe features, countries and pricing in full, but anything not live carries a "Coming soon" badge or wording: network exchange (eSLOG 2.0 / UBL 2.1), and the iOS app. Card payment links and Tap to Pay (Core+, in the mobile app) are live, no badge. Pricing shows the network allowances with the note that they apply from launch (mirrors the app's `billing:network_coming_soon_note`).
- Hero badge: `home.badge` ("Coming soon to Slovenia, Croatia & Serbia"). When Paply exits testing, flip it and the network/mobile "coming soon" copy (search `coming_soon`, `Coming soon`, `network_note`, `mobile.badge`, `home.m_badge`).
- **CTAs:** "Get started free" / "Start for free" / "Choose <plan>" → `https://paply.app/register`; "Sign in" → `https://paply.app/login`. Written as `{{app}}/register` / `{{app}}/login`, so a domain change is one constant in `build.py`.
- "Contact sales" is `mailto:info@enzor.si?subject=Paply%20Enterprise`. Note: the app itself uses `sales@paply.si` for the same purpose; confirm which address is correct before changing either.
- Google Play uses Google's official badge (`assets/img/google-play-<lang>.png`, padding trimmed, artwork unmodified; swapped per language via `common.gplay_img`) linking to `https://play.google.com/store/apps/details?id=si.enzor.paply`. The App Store button stays a non-link (`aria-disabled`) until the iOS app is published; then use Apple's official badge the same way.

## Content Facts to Stay Consistent With

Verify against the main app's `CLAUDE.md` / `backend/src/config/plans.py` / `frontend/src/i18n/locales/en/billing.json` before changing:

- **Plans:** FREE €0 (1 member, drafts/templates/PDF/approvals; no network exchange, no fiscalization) · START €12 (2 members + 5 read-only, 50 exchanged e-invoices, fiscalization, email delivery, payment reminders, archive, documents, represented companies, cash register) · CORE €27 (5 + 20, 150, AI scanning with a daily limit, email inbox connector, Stripe/Shopify/Odoo connectors, own-mailbox sending, REST API, priority support) · PRO €59 (15 + 50, 400, higher daily AI limit, higher support priority) · ENTERPRISE custom (1,000+). €0.15 per extra exchanged e-invoice on every paid plan (2026-10-19; was 200/500 and €0.12). AI assistants (MCP) on Core+ are coming soon. Represented companies €4.90/month each (not on Free). Yearly billing: 2 months free (€120 / €270 / €590), allowance stays monthly; upgrades apply now (pay the difference), downgrades at period end. Estimates, customer orders, purchase orders, price lists and XML import have no plan gate. Prices exclude VAT. Invoice creation is unlimited everywhere; only network exchanges count.
- Pricing cards use the **seat + inheritance** pattern ("Everything in Start, plus:" then only new items). Keep the cards, the comparison table, the estimator's `PLANS` array in `site.js`, and the JSON-LD offers in `build.py` in sync.
- **AI scanning is capped per day in the app** (CORE 25, PRO 60). Never advertise it as "unlimited".
- **Fiscal codes:** invoices carry a QR code (SI: FURS ZOI/EOR verification + UPN QR payment; HR: Porezna ZKI/JIR verification). PDF417/Code 128 fiscal barcodes do **not** exist; HUB3 (a PDF417 code) is only the scan-to-pay code for paying received bills.
- **Retention:** 10 years in Slovenia, 11 in Croatia (not a flat "11-year archive").
- **Croatia:** F1 fiscalization is live in Paply; F2 / B2B e-invoice exchange is not. **Slovenia:** FURS fiscalization live; eSLOG exchange coming soon; B2B e-invoices mandatory from 1 Jan 2028. **Serbia:** roadmap only (apps are translated to Serbian). Country pages state only well-established deadlines and end with a "not legal advice" disclaimer. Don't add legal claims that aren't in the app's approved rule cards (`docs/compliance/`).
- Data is hosted in AWS eu-central-1 (Frankfurt).
- **White-label rule:** never name or hint at the underlying e-invoice network provider anywhere in this repo. Not in copy, comments or docs: `CLAUDE.md` used to be publicly served and named it. Before committing, grep the repo for the provider names listed in the main app's `docs/compliance/shared/white-label.md`.

## AI Search (ChatGPT, Perplexity, Claude, Google AI Overviews)

- All content is static HTML, readable without JavaScript; keep it that way (AI crawlers often don't run JS). Never put important copy only in JS strings.
- `llms.txt` (repo root, hand-written, served at `/llms.txt`) is a plain-text fact sheet for AI tools. **Keep its plans/prices/features in sync** whenever pricing or features change.
- `robots.txt` (generated by `build.py`) explicitly allows the AI search crawlers; don't block them.
- Write answers AI can quote: direct, factual sentences with concrete numbers and dates (FAQs, glossary, guides). The WebPage JSON-LD carries `dateModified` from the build date.

## SEO Checklist (every new page)

Unique `title`/`description` in all three languages · exactly one `<h1>` · descriptive `alt` (translated via `data-i18n-attr`) · internal links as root-relative paths (`/pricing/`, auto-localized) · product links via `{{app}}` · add the page to the header/footer nav if it's a primary page · `python build.py --check` passes · `sitemap.xml` regenerated.

## Brand — Paply Color System (Amber)

Tokens are CSS variables in `assets/css/site.css` (`:root`), matching the app:

| Token | Value |
|---|---|
| `--bg-primary` / `--bg-secondary` / `--bg-tertiary` | `#F8F7F5` / `#FFFFFF` / `#F1F0EC` |
| `--text-primary` / `--text-secondary` / `--text-tertiary` | `#18181A` / `#6B6869` / `#9A9896` |
| `--border-default` / `--border-emphasis` | `#E3E2DE` / `#CCCAC5` |
| `--accent` / `--accent-surface` | `#EF9F27` / `rgba(239,159,39,0.12)` |
| state colours (`--ok-*`, `--err-*`, `--warn-*`, `--info-*`) | the app's semantic Approved/Error/Warning/Info pairs |

`--accent-deep` (`#B86E0B`) is a site-only shade for amber text on light backgrounds, where `#EF9F27` fails contrast. Radii 6/8/12/16px. **Weights 400 and 500 only** (Inter, self-hosted; `<th>`/`<b>` are reset to 400/500). Font sizes: the app scale (11–22px) plus 30px section headers and 40/52px display. Never `#000`; the dark bands use `--text-primary`.

## Mobile Support — MANDATORY

Check every change at **320px**, 375px and desktop with a real render (local static server + Playwright/Chromium): no horizontal overflow (`scrollWidth <= clientWidth`), no clipped text, tap targets ≥ 40px.

- **Header breakpoint is 960px** (`DESKTOP` in `site.js`, `@media (min-width: 960px)` in `site.css`; keep both in sync). Below it, only logo + language globe + hamburger show; nav, Sign in and the CTA move into `#mobile-menu`. Add new nav links to **both** `.nav-desktop` and `#mobile-menu` in `src/partials/header.html`.
- The mobile menu animates via `max-height` read from `scrollHeight` on open (no JS change needed when links change), closes on link click, Escape, and resize past 960px.
- In-page anchor scrolling offsets by the live header (+ sticky jump-nav) height; don't hardcode offsets.
- Wide content (comparison table) scrolls inside `.table-wrap`, never the page.

## Animations

All motion is CSS keyframes/transitions plus small JS (reveal-on-scroll via IntersectionObserver, hero outbox mock that cycles Draft → Fiscalized → Sent → Paid, auto-advancing feature tabs, FAQ height animation, estimator number tween). Everything respects `prefers-reduced-motion` (static final state) and pauses off-screen. Content is visible without JS (`.reveal` only hides when `<html class="js">`).

## Build & Deploy

- Hosted on **Vercel** (www.paply.si; paply.si redirects there), auto-deployed from `main`. `vercel.json` sets `trailingSlash: true`, security headers, long caching for fonts and versioned CSS/JS, and redirects away from repo-internal paths. `.vercelignore` keeps `src/`, `tools/`, `build.py`, `CLAUDE.md`, `README.md` out of the deployment.
- Vercel serves `404.html` for unknown paths automatically.
- Old `assets/logo.png`, `assets/icon-logo.png`, `assets/paply-icon.ico` are unused by the site (kept in case something external links to them); optimised replacements live in `assets/img/` and `/favicon.ico`.
- No secrets belong here; it is a fully public static site.
