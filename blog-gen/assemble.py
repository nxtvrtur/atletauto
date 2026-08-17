#!/usr/bin/env python3
"""Полная пересборка блога atletauto.ru из списка статей.

В отличие от первой версии не дописывает карточки в конец, а восстанавливает
индекс из бэкапа (6 исходных статей) и заново кладёт туда весь текущий набор.
Так удаление статьи не оставляет мусора в сетке.
"""
import json, re, sys, html, os, datetime, glob

SITE = "/Users/mak/arturr source/eso-vpn/.claude/worktrees/compassionate-carson-922fef/atletauto-site"
SCRATCH = "/private/tmp/claude-501/-Users-mak-orca-workspaces-DARE-----------/c17c799f-93ae-4099-a03e-f712e30096b2/scratchpad"
BLOG_DIR = os.path.join(SITE, "blog")
TPL = os.path.join(BLOG_DIR, "real-price-breakdown.html")
ARTS = json.load(open(sys.argv[1], encoding="utf-8"))

# Ссылки на удалённые статьи переводим на ближайшую выжившую по смыслу —
# битая ссылка внутри статьи хуже, чем ссылка на соседнюю тему.
REDIRECT = {
    "skolko-stoit-prignat-avto-iz-kitaya": "skrytye-rashody-pri-importe",
    "utilsbor-2026-lgota-160-ls": "avto-do-160-ls-iz-kitaya",
    "serye-shemy-rastamozhki": "bitye-avto-iz-kitaya",
    "rastamozhka-elektromobilya-iz-kitaya": "gibrid-ili-erev-chto-vygodnee",
}
LIVE = {a["slug"] for a in ARTS}

tpl = open(TPL, encoding="utf-8").read()
head = tpl[:tpl.index("</head>")]

SHELL = open(os.path.join(SCRATCH, "shell.tpl"), encoding="utf-8").read()
ICONS = [
    '<path d="M3 3l18 18M3 21L21 3"/><circle cx="12" cy="12" r="10"/>',
    '<path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/>',
    '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V5h10v2"/>',
    '<path d="M4 17h16M6 17V9l6-4 6 4v8"/>',
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
]

fixed = dropped = 0
cards = []
for i, a in enumerate(ARTS):
    body = a["bodyHtml"].strip()

    def relink(m):
        global fixed, dropped
        slug = m.group(1)
        if slug in LIVE:
            return m.group(0)
        if slug in REDIRECT and REDIRECT[slug] in LIVE:
            fixed += 1
            return 'href="%s.html"' % REDIRECT[slug]
        dropped += 1
        return 'href="../blog.html"'
    body = re.sub(r'href="([a-z0-9-]+)\.html"', relink, body)

    body = "\n".join("      " + ln if ln.strip() else ln for ln in body.split("\n"))
    h = re.sub(r"<title>.*?</title>", "<title>%s — Атлет-Авто Блог</title>" % html.escape(a["seoTitle"]), head, flags=re.S)
    h = re.sub(r'<meta name="description" content=".*?">',
               '<meta name="description" content="%s">' % html.escape(a["metaDesc"], quote=True), h, flags=re.S)
    open(os.path.join(BLOG_DIR, a["slug"] + ".html"), "w", encoding="utf-8").write(
        h + SHELL.format(crumb=html.escape(a["seoTitle"]), label=html.escape(a["label"]), h1=a["h1"],
                         avatar=a["authorFile"], author=html.escape(a["author"]),
                         role=html.escape(a["authorRole"]), body=body,
                         cta_title=html.escape(a["ctaTitle"]), cta_text=html.escape(a["ctaText"])))

    cards.append("""      <a class="article-card" href="blog/{slug}.html">
        <div class="ac-cover cover-{c}">
          <div class="ac-cover-inner">
            <div class="ac-cover-icon">
              <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".6" stroke-linecap="round" color="#fff">{icon}</svg>
            </div>
          </div>
          <div class="ac-cover-badge">{label}</div>
          <div class="ac-author-row">
            <img class="ac-avatar" src="images/team/{avatar}" alt="{author}">
            <span class="ac-author-name">{author}</span>
          </div>
        </div>
        <div class="ac-body">
          <div class="ac-title">{title}</div>
          <p class="ac-excerpt">{excerpt}</p>
          <span class="ac-link">
            Читать
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </div>
      </a>""".format(slug=a["slug"], c=(i % 6) + 1, icon=ICONS[i % len(ICONS)],
                     label=html.escape(a["label"]), avatar=a["authorFile"],
                     author=html.escape(a["author"]), title=html.escape(a["seoTitle"]),
                     excerpt=html.escape(a["excerpt"])))

# индекс — всегда от чистого бэкапа с шестью исходными статьями
b = open(os.path.join(SCRATCH, "blog.html.bak"), encoding="utf-8").read()
anchor = b.rindex("      </a>\n\n    </div>")
b = b[:anchor + len("      </a>\n")] + "\n" + "\n\n".join(cards) + "\n" + b[anchor + len("      </a>\n"):]
total = b.count('class="article-card"')
b = re.sub(r'<p class="section-label">Все статьи · \d+ материалов</p>',
           '<p class="section-label">Все статьи · %d материалов</p>' % total, b)
open(os.path.join(SITE, "blog.html"), "w", encoding="utf-8").write(b)

today = datetime.date.today().isoformat()
urls = ["", "catalog.html", "catalog-order.html", "blog.html", "privacy.html"] + \
       ["blog/%s" % os.path.basename(f) for f in sorted(glob.glob(BLOG_DIR + "/*.html"))]
sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    sm.append("  <url><loc>https://atletauto.ru/%s</loc><lastmod>%s</lastmod></url>" % (u, today))
sm.append("</urlset>")
open(os.path.join(SITE, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sm) + "\n")

print("статей собрано:", len(ARTS))
print("карточек в индексе:", total)
print("ссылок перенаправлено:", fixed, "| ссылок снято на /blog:", dropped)
print("URL в sitemap:", len(urls))
