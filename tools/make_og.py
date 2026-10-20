#!/usr/bin/env python3
"""Generates the Open Graph share images (assets/img/og-<lang>.png, 1200x630).

Needs Pillow (pip install pillow) and the Inter TTF files, which are not in
the repo: download Inter from https://fonts.google.com/specimen/Inter and pass
the folder holding Inter-Regular.ttf / Inter-Medium.ttf (static fonts):

    python tools/make_og.py <folder-with-inter-ttf>

Re-run only when the headline copy or branding changes; the output is committed.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT
REG = str(next(FONTS.glob("*Regular*.ttf"), FONTS / "inter400.ttf"))
MED = str(next(FONTS.glob("*Medium*.ttf"), FONTS / "inter500.ttf"))

COPY = {
    "en": ("E-invoicing,", "without the complexity.", "Create, send, fiscalize and archive invoices.\nFor businesses in Slovenia and Croatia.", "www.paply.si"),
    "sl": ("E-računi,", "brez zapletov.", "Ustvarjajte, pošiljajte, fiskalizirajte in arhivirajte\nračune. Za podjetja v Sloveniji in na Hrvaškem.", "www.paply.si"),
    "hr": ("E-računi,", "bez komplikacija.", "Izrađujte, šaljite, fiskalizirajte i arhivirajte\nračune. Za tvrtke u Hrvatskoj i Sloveniji.", "www.paply.si"),
}
BG, INK, MUTED, ACCENT = (248, 247, 245), (24, 24, 26), (107, 104, 105), (239, 159, 39)

phone = Image.open(ROOT / "assets/img/app-home.webp").convert("RGBA")
logo = Image.open(ROOT / "assets/img/paply-wordmark.png").convert("RGBA")

for lang, (l1, l2, sub, url) in COPY.items():
    im = Image.new("RGB", (1200, 630), BG)
    glow = Image.new("RGBA", (1200, 630), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((700, -200, 1400, 500), fill=(239, 159, 39, 110))
    im.paste(glow.filter(ImageFilter.GaussianBlur(90)), (0, 0), glow.filter(ImageFilter.GaussianBlur(90)))
    d = ImageDraw.Draw(im)
    # faint grid
    for x in range(0, 1200, 44):
        d.line((x, 0, x, 630), fill=(238, 236, 232))
    for y in range(0, 630, 44):
        d.line((0, y, 1200, y), fill=(238, 236, 232))

    lg = logo.resize((int(logo.width * 56 / logo.height), 56), Image.LANCZOS)
    im.paste(lg, (72, 64), lg)
    f_big = ImageFont.truetype(MED, 64)
    f_sub = ImageFont.truetype(REG, 26)
    f_url = ImageFont.truetype(MED, 22)
    d.text((72, 190), l1, font=f_big, fill=INK)
    d.text((72, 268), l2, font=f_big, fill=ACCENT)
    d.multiline_text((72, 380), sub, font=f_sub, fill=MUTED, spacing=10)
    d.rounded_rectangle((72, 500, 72 + d.textlength(url, font=f_url) + 36, 548), 24, fill=(255, 255, 255), outline=(227, 226, 222))
    d.text((90, 511), url, font=f_url, fill=INK)

    ph = phone.resize((300, int(phone.height * 300 / phone.width)), Image.LANCZOS).rotate(-6, expand=True, resample=Image.BICUBIC)
    shadow = Image.new("RGBA", ph.size, (0, 0, 0, 0))
    shadow.paste((24, 24, 26, 90), (0, 0), ph.split()[3])
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    im.paste(shadow, (835, 110), shadow)
    im.paste(ph, (815, 70), ph)

    out = ROOT / f"assets/img/og-{lang}.png"
    im.save(out, optimize=True)
    print(out.name, out.stat().st_size // 1024, "KB")
