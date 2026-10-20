# paply_static

Marketing site for [Paply](https://www.paply.si): e-invoicing and fiscalization for Slovenia and Croatia.
English, Slovenian and Croatian pages generated from `src/` by a small Python script.

```
python build.py          # regenerate all pages, sitemap.xml and robots.txt
python build.py --check  # same, but fail on any warning (missing translation etc.)
python -m http.server    # preview at http://localhost:8000
```

Edit `src/` and `assets/`, never the generated HTML. Commit sources and output together;
Vercel deploys the repo root as static files. See `CLAUDE.md` for conventions.
