#!/usr/bin/env python3
"""Проверка статей ДО сборки. Ловит ровно то, что портит выдачу и репутацию:
тонкий текст, длинную meta, отсутствие обязательных блоков, битые внутренние
ссылки, таблицы (для них в вёрстке нет стилей) и выдуманные точные суммы.
"""
import json, re, sys, os

ARTS = json.load(open(sys.argv[1], encoding="utf-8"))
ALLOWED_LINKS = {"../index.html", "../catalog.html", "../blog.html"}
SLUGS = {a["slug"] + ".html" for a in ARTS}

def words(h):
    return len(re.sub(r"<[^>]+>", " ", h).split())

bad, warn = [], []
for a in ARTS:
    s, p = a["slug"], []
    b = a["bodyHtml"]
    w = words(b)
    if w < 600: p.append(f"мало текста: {w} слов")
    if w > 1400: p.append(f"слишком длинно: {w} слов")
    if len(a["metaDesc"]) > 148: p.append(f"meta {len(a['metaDesc'])} симв (>148)")
    if len(a["seoTitle"]) > 62: p.append(f"title {len(a['seoTitle'])} симв (>62)")
    if 'class="checklist"' not in b: p.append("нет чеклиста")
    if "Частые вопросы" not in b: p.append("нет FAQ")
    if 'class="disclaimer"' not in b: p.append("нет оговорки")
    if "<table" in b: p.append("есть таблица (стилей нет)")
    if re.search(r"[\U0001F300-\U0001FAFF☀-➿]", b): p.append("эмодзи в тексте")
    if not os.path.exists("/Users/mak/arturr source/eso-vpn/.claude/worktrees/"
                          "compassionate-carson-922fef/atletauto-site/images/team/" + a["authorFile"]):
        p.append("нет файла аватара " + a["authorFile"])

    links = re.findall(r'href="([^"]+)"', b)
    ext = [l for l in links if l not in ALLOWED_LINKS and l not in SLUGS]
    if ext: p.append("чужие ссылки: " + ", ".join(ext[:3]))
    if not (2 <= len(links) <= 6): p.append(f"внутренних ссылок {len(links)} (нужно 3-4)")

    # Выдуманная точность: сумма в рублях с 6+ значащими цифрами и без слов
    # «ориентировочно/примерно/около/от…до» рядом.
    for m in re.finditer(r"(\d[\d  ]{5,})\s*(?:₽|руб)", b):
        ctx = b[max(0, m.start() - 90): m.end() + 30].lower()
        if not re.search(r"ориентиров|примерн|около|от\s|до\s|порядка|диапазон|~", ctx):
            p.append("точная сумма без оговорки: " + m.group(0).strip())
            break

    if p: bad.append((s, p))

print(f"проверено статей: {len(ARTS)}")
if bad:
    print(f"\nС ЗАМЕЧАНИЯМИ: {len(bad)}")
    for s, p in bad:
        print(f"  {s}")
        for x in p: print(f"      – {x}")
else:
    print("замечаний нет")
print(f"\nчистых: {len(ARTS) - len(bad)}")
