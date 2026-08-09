// Выдаёт следующую порцию тем для генерации: из плана вычитаются уже
// написанные статьи и всё, что пересекается с витриной-партнёром.
//
//   node blog-gen/next-batch.mjs [сколько]      → JSON с темами на stdout
//   node blog-gen/next-batch.mjs --stats        → сколько написано и сколько осталось
//
// Список слагов витрины лежит в blog-gen/importdare-slugs.txt и обновляется
// командой из README. Без него дедуп не работает — скрипт об этом скажет.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plan } from './topics.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SITE = join(here, '..');

const done = new Set(
  readdirSync(join(SITE, 'blog')).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''))
);

const rivalFile = join(here, 'importdare-slugs.txt');
if (!existsSync(rivalFile)) {
  console.error('НЕТ importdare-slugs.txt — дедуп против витрины невозможен, см. README');
  process.exit(1);
}
const rival = readFileSync(rivalFile, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);

// Пересечением считаем совпадение двух и более значимых слов слага. Порог
// подобран на живых данных: одного общего слова мало (почти всё содержит
// «avto»), трёх — слишком строго, реальные коллизии проскакивают.
// Общие слова из сравнения выкидываем: почти каждый слаг обеих сторон содержит
// «avto», «skolko», «stoit», «kitaya» — по ним совпадает всё подряд, и дедуп
// начинал резать честные темы («сколько стоит доставка Владивосток — Москва»
// он считал коллизией со «сколько стоит пригнать авто из Китая»).
const STOP = new Set(['avto', 'skolko', 'stoit', 'kitaya', 'kitae', 'korei', 'rossii', 'pod', 'klyuch',
  'iz', 'ili', 'chto', 'kak', 'dlya', '2026', 'luchshe', 'mashinu', 'mashiny']);
const collides = (slug) => {
  const toks = slug.split('-').filter((t) => t.length > 4 && !STOP.has(t));
  if (toks.length < 2) return false;
  return rival.some((r) => toks.filter((t) => r.includes(t)).length >= 2);
};

// Страховка от главной ошибки: ни одной темы про конкретную модель.
const MODEL = /zeekr|li-auto|lixiang|voyah|tank-\d|aito|xiaomi|byd|denza|\bnio\b|haval|geely|hongqi|leapmotor|lynk|avatr|xpeng|omoda|exeed|changan|chery|jetour|tesla/;

const all = plan();
const blocked = [];
const queue = all.filter((t) => {
  if (done.has(t.slug)) return false;
  if (MODEL.test(t.slug)) { blocked.push([t.slug, 'помодельная тема']); return false; }
  if (collides(t.slug)) { blocked.push([t.slug, 'пересечение с витриной']); return false; }
  return true;
});

if (process.argv.includes('--stats')) {
  console.log('всего тем в плане:', all.length);
  console.log('уже написано:     ', all.length - queue.length - blocked.length);
  console.log('отсеяно:          ', blocked.length);
  for (const [s, why] of blocked.slice(0, 10)) console.log('   -', s, '·', why);
  console.log('осталось в очереди:', queue.length);
  process.exit(0);
}

const n = Number(process.argv[2]) || 25;
console.log(JSON.stringify(queue.slice(0, n), null, 1));
