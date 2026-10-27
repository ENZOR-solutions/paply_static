#!/usr/bin/env python3
"""Static site generator for www.paply.si (Python 3.9+, standard library only).

    python build.py           build every page in every language
    python build.py --check   same, but exit 1 on any i18n warning (CI)

Sources live in src/ (never deployed, see .vercelignore):
  src/layout.html        document skeleton shared by every page
  src/partials/*.html    pulled in with <!-- @include name -->
  src/pages/*.html       one file per page; starts with a <!--page {json} --> block
  src/i18n/sl.json ...   translations; English is the inline text in the HTML
  src/i18n/en.json       GENERATED reference of every English string (don't edit)

Output is plain HTML at the repo root (/, /features/, /sl/, /hr/features/ ...)
plus sitemap.xml and robots.txt. Commit the output: Vercel serves it as is.
See CLAUDE.md for the conventions.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
SITE = "https://www.paply.si"
APP = "https://paply.app"
LANGS = ["en", "sl", "hr"]
DEFAULT = "en"
OG_LOCALE = {"en": "en_US", "sl": "sl_SI", "hr": "hr_HR"}

warnings: list[str] = []


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f"  ! {msg}")


# ---------------------------------------------------------------- sources

def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def flatten(d: dict, prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out


def load_pages() -> list[tuple[dict, str]]:
    pages = []
    for f in sorted((SRC / "pages").glob("*.html")):
        text = read(f)
        m = re.match(r"\s*<!--page\s*(\{.*?\})\s*-->", text, re.S)
        if not m:
            sys.exit(f"{f.name}: missing <!--page {{...}} --> header")
        meta = json.loads(m.group(1))
        meta["id"] = f.stem
        pages.append((meta, text[m.end():]))
    return pages


def include(text: str, depth: int = 0) -> str:
    if depth > 5:
        sys.exit("@include nested too deeply")

    def repl(m: re.Match) -> str:
        return include(read(SRC / "partials" / f"{m.group(1)}.html"), depth + 1)

    return re.sub(r"<!--\s*@include\s+([\w-]+)\s*-->", repl, text)


# ---------------------------------------------------------------- i18n

OPEN_TAG = re.compile(r'<([a-zA-Z][\w-]*)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>')
ATTR_TAG = re.compile(r'<[a-zA-Z][\w-]*\b[^>]*?\sdata-i18n-attr="([^"]+)"[^>]*>')


def find_close(text: str, tag: str, start: int) -> int:
    """Index of the </tag> matching an element whose content starts at `start`."""
    depth = 1
    pat = re.compile(rf"<(/?){tag}\b[^>]*>", re.I)
    for m in pat.finditer(text, start):
        if m.group(0).endswith("/>"):
            continue
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return m.start()
    sys.exit(f"unclosed <{tag}> after offset {start}")


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def extract(text: str, into: dict[str, str]) -> None:
    """Collect the English source string of every data-i18n / data-i18n-attr key."""
    pos = 0
    while (m := OPEN_TAG.search(text, pos)):
        tag, key = m.group(1), m.group(2)
        end = find_close(text, tag, m.end())
        value = norm(text[m.end():end])
        if key in into and into[key] != value:
            warn(f'key "{key}" has two different English texts')
        into[key] = value
        pos = m.end()
    for m in ATTR_TAG.finditer(text):
        for pair in m.group(1).split(";"):
            attr, key = pair.split(":", 1)
            am = re.search(rf'\s{attr}="([^"]*)"', m.group(0))
            if am:
                k = key.strip()
                if k in into and into[k] != am.group(1):
                    warn(f'key "{k}" has two different English texts')
                into[k] = am.group(1)


def translate(text: str, d: dict[str, str]) -> str:
    out, pos = [], 0
    while (m := OPEN_TAG.search(text, pos)):
        tag, key = m.group(1), m.group(2)
        end = find_close(text, tag, m.end())
        out.append(text[pos:m.end()])
        out.append(d[key] if key in d else text[m.end():end])
        pos = end
    out.append(text[pos:])
    text = "".join(out)

    def attr_repl(m: re.Match) -> str:
        tag = m.group(0)
        for pair in m.group(1).split(";"):
            attr, key = (s.strip() for s in pair.split(":", 1))
            if key in d:
                val = html.escape(d[key], quote=True)
                tag = re.sub(rf'(\s{attr}=")[^"]*(")', lambda mm: mm.group(1) + val + mm.group(2), tag, count=1)
        return tag

    return ATTR_TAG.sub(attr_repl, text)


# ---------------------------------------------------------------- urls

def url_for(path: str, lang: str) -> str:
    return path if lang == DEFAULT else f"/{lang}{path}"


def localize_links(text: str, lang: str) -> str:
    if lang == DEFAULT:
        return text
    return re.sub(r'href="/(?!/|assets/|sl/|hr/|favicon|site\.webmanifest)', f'href="/{lang}/', text)


def asset_version(rel: str) -> str:
    digest = hashlib.sha1((ROOT / "assets" / rel).read_bytes()).hexdigest()[:10]
    return f"/assets/{rel}?v={digest}"


# ---------------------------------------------------------------- structured data

def faq_entries(body: str) -> list[dict]:
    items = []
    for m in re.finditer(r'<details[^>]*class="[^"]*\bfaq\b[^"]*"[^>]*>\s*<summary[^>]*>(.*?)</summary>(.*?)</details>', body, re.S):
        q = norm(re.sub(r"<[^>]+>", " ", m.group(1)))
        a = norm(re.sub(r"<[^>]+>", " ", m.group(2)))
        items.append({"@type": "Question", "name": html.unescape(q),
                      "acceptedAnswer": {"@type": "Answer", "text": html.unescape(a)}})
    return items


def jsonld(meta: dict, lang: str, title: str, desc: str, body: str, d: dict[str, str]) -> str:
    org = {
        "@type": "Organization", "@id": f"{SITE}/#org", "name": "Paply", "url": f"{SITE}/",
        "logo": f"{SITE}/assets/img/paply-icon-512.png", "email": "info@paply.si",
        "parentOrganization": {"@type": "Organization", "name": "ENZOR d.o.o.", "url": "https://enzor.si/"},
        "areaServed": ["SI", "HR", "RS"],
    }
    graph: list[dict] = [org, {
        "@type": "WebSite", "@id": f"{SITE}/#website", "url": f"{SITE}/", "name": "Paply",
        "inLanguage": lang, "publisher": {"@id": f"{SITE}/#org"},
    }]
    page_url = SITE + url_for(meta["path"], lang)
    schema = meta.get("schema", [])
    if "software" in schema:
        plans = [("Free", "0"), ("Start", "12"), ("Core", "27"), ("Pro", "59")]
        graph.append({
            "@type": "SoftwareApplication", "name": "Paply", "url": APP,
            "applicationCategory": "BusinessApplication", "applicationSubCategory": "E-invoicing",
            "operatingSystem": "Web", "inLanguage": ["en", "sl", "hr", "sr"],
            "description": desc, "publisher": {"@id": f"{SITE}/#org"},
            "offers": [{"@type": "Offer", "name": n, "price": p, "priceCurrency": "EUR",
                        "url": SITE + url_for("/pricing/", lang)} for n, p in plans],
        })
    if "faq" in schema:
        entries = faq_entries(body)
        if entries:
            graph.append({"@type": "FAQPage", "@id": page_url + "#faq", "mainEntity": entries})
    if meta.get("crumbs"):
        items = [{"@type": "ListItem", "position": 1, "name": d.get("crumb.home", "Home"),
                  "item": SITE + url_for("/", lang)}]
        for i, c in enumerate(meta["crumbs"], start=2):
            items.append({"@type": "ListItem", "position": i, "name": d.get(c["key"], c["en"]),
                          "item": SITE + url_for(c["path"], lang)})
        graph.append({"@type": "BreadcrumbList", "itemListElement": items})
    graph.append({"@type": "WebPage", "@id": page_url, "url": page_url, "name": title,
                  "description": desc, "inLanguage": lang, "isPartOf": {"@id": f"{SITE}/#website"},
                  "dateModified": date.today().isoformat(), "publisher": {"@id": f"{SITE}/#org"}})
    data = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))
    return data.replace("</", "<\\/")


# ---------------------------------------------------------------- render

def render(meta: dict, body: str, layout: str, lang: str, d: dict[str, str]) -> str:
    langs = meta.get("langs", LANGS)
    title = d.get(f"{meta['id']}.meta.title", meta["title"])
    desc = d.get(f"{meta['id']}.meta.description", meta["description"])
    if len(desc) > 160:
        warn(f"{meta['id']} [{lang}] meta description is {len(desc)} chars (> 160)")
    if len(title) > 65:
        warn(f"{meta['id']} [{lang}] title is {len(title)} chars (> 65)")

    page = layout.replace("{{content}}", body)
    page = include(page)
    page = translate(page, d)

    # Breadcrumb trail (visible), built from the page meta.
    crumbs = ""
    if meta.get("crumbs"):
        parts = [f'<a href="/">{html.escape(d.get("crumb.home", "Home"))}</a>']
        for c in meta["crumbs"][:-1]:
            parts.append(f'<a href="{c["path"]}">{html.escape(d.get(c["key"], c["en"]))}</a>')
        last = meta["crumbs"][-1]
        parts.append(f'<span aria-current="page">{html.escape(d.get(last["key"], last["en"]))}</span>')
        crumbs = '<nav class="crumbs" aria-label="Breadcrumb">' + '<span aria-hidden="true">/</span>'.join(parts) + "</nav>"
    page = page.replace("{{crumbs}}", crumbs)

    page = localize_links(page, lang)

    # Active nav item.
    if meta.get("nav"):
        page = page.replace(f'data-nav="{meta["nav"]}"', f'data-nav="{meta["nav"]}" aria-current="page"')

    canonical = SITE + url_for(meta["path"], lang)
    alternates = ""
    if not meta.get("noindex"):
        alternates = "\n".join(
            f'<link rel="alternate" hreflang="{l}" href="{SITE}{url_for(meta["path"], l)}">' for l in langs
        ) + f'\n<link rel="alternate" hreflang="x-default" href="{SITE}{meta["path"]}">'
    og_alts = "\n".join(f'<meta property="og:locale:alternate" content="{OG_LOCALE[l]}">' for l in langs if l != lang)

    subs = {
        "lang": lang,
        "title": html.escape(title),
        "description": html.escape(desc, quote=True),
        "canonical": canonical,
        "alternates": alternates,
        "og_locale": OG_LOCALE[lang],
        "og_locale_alts": og_alts,
        "og_image": f"{SITE}/assets/img/og-{lang}.png",
        "robots": "noindex, follow" if meta.get("noindex") else "index, follow, max-image-preview:large",
        "jsonld": jsonld(meta, lang, title, desc, page, d),
        "page_id": meta["id"],
        "app": APP,
        "site": SITE,
        "year": str(date.today().year),
    }
    for l in LANGS:
        subs[f"alt:{l}"] = url_for(meta["path"], l) if l in langs else url_for("/", l)
    page = re.sub(r"\{\{v:([^}]+)\}\}", lambda m: asset_version(m.group(1)), page)
    page = re.sub(r"\{\{([\w:]+)\}\}", lambda m: subs.get(m.group(1), m.group(0)), page)
    if "{{" in page:
        for left in sorted(set(re.findall(r"\{\{[^}]*\}\}", page))):
            warn(f"{meta['id']} [{lang}] unresolved placeholder {left}")

    page = re.sub(r'\sdata-i18n(?:-attr)?="[^"]*"', "", page)
    return page


def out_path(path: str, lang: str) -> Path:
    url = url_for(path, lang)
    if url.endswith(".html"):
        return ROOT / url.lstrip("/")
    return ROOT / url.lstrip("/") / "index.html"


def main() -> None:
    check = "--check" in sys.argv
    layout = read(SRC / "layout.html")
    pages = load_pages()

    # 1. English source strings, straight from the markup.
    en: dict[str, str] = {}
    extract(include(layout), en)
    for meta, body in pages:
        extract(include(body), en)
        en[f"{meta['id']}.meta.title"] = meta["title"]
        en[f"{meta['id']}.meta.description"] = meta["description"]
        for c in meta.get("crumbs", []):
            en.setdefault(c["key"], c["en"])
    en.setdefault("crumb.home", "Home")

    en_file = SRC / "i18n" / "en.json"
    previous = json.loads(read(en_file)) if en_file.exists() else {}
    changed = [k for k, v in en.items() if k in previous and previous[k] != v]

    dicts = {"en": en}
    for lang in LANGS[1:]:
        tr = flatten(json.loads(read(SRC / "i18n" / f"{lang}.json")))
        en_only = {m["id"] for m, _ in pages if lang not in m.get("langs", LANGS)}
        missing = [k for k in en if k not in tr and k.split(".")[0] not in en_only]
        unused = [k for k in tr if k not in en]
        for k in missing:
            warn(f"[{lang}] missing translation: {k} (falls back to English)")
        for k in unused:
            warn(f"[{lang}] unused key: {k}")
        for k in changed:
            if k in tr:
                warn(f"[{lang}] English changed, re-check translation: {k}")
        dicts[lang] = {**en, **tr}

    en_file.write_text(json.dumps(dict(sorted(en.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # 2. Render.
    count = 0
    sitemap_urls = []
    for meta, body in pages:
        langs = meta.get("langs", LANGS)
        for lang in langs:
            target = out_path(meta["path"], lang)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(render(meta, body, layout, lang, dicts[lang]), encoding="utf-8")
            count += 1
        if meta.get("sitemap", True) and not meta.get("noindex"):
            sitemap_urls.append(meta)

    # 3. sitemap.xml + robots.txt
    today = date.today().isoformat()
    rows = []
    for meta in sitemap_urls:
        langs = meta.get("langs", LANGS)
        links = "".join(
            f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{SITE}{url_for(meta["path"], l)}"/>' for l in langs
        ) + f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{meta["path"]}"/>'
        for lang in langs:
            rows.append(
                f"  <url>\n    <loc>{SITE}{url_for(meta['path'], lang)}</loc>\n    <lastmod>{today}</lastmod>"
                f"\n    <changefreq>{meta.get('changefreq', 'monthly')}</changefreq>"
                f"\n    <priority>{meta.get('priority', 0.7)}</priority>{links}\n  </url>"
            )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(rows) + "\n</urlset>\n", encoding="utf-8")
    # AI search/answer crawlers are welcomed explicitly (they also match "*").
    ai_bots = ["OAI-SearchBot", "ChatGPT-User", "GPTBot", "PerplexityBot", "Perplexity-User",
               "ClaudeBot", "Claude-SearchBot", "Claude-User", "Google-Extended", "Applebot-Extended", "Bingbot"]
    robots = "User-agent: *\nAllow: /\n\n" + "".join(f"User-agent: {bot}\nAllow: /\n\n" for bot in ai_bots)
    (ROOT / "robots.txt").write_text(robots + f"Sitemap: {SITE}/sitemap.xml\n", encoding="utf-8")

    print(f"Built {count} pages, {len(sitemap_urls) * len(LANGS)} sitemap URLs, {len(warnings)} warning(s).")
    if check and warnings:
        sys.exit(1)


if __name__ == "__main__":
    main()
