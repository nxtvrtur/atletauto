// Пинг IndexNow: сообщает Яндексу и Bing, что появились новые страницы.
// Молодой домен они обходят медленно — на importdare это ускоряло попадание
// в индекс с недель до пары дней.
//   node indexnow.mjs            — все URL из sitemap.xml
//   node indexnow.mjs <url> ...  — точечно после публикации статьи
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = 'atletauto.ru';
const here = dirname(fileURLToPath(import.meta.url));
const KEY = readFileSync(join(here, 'indexnow.key'), 'utf8').trim();

let urls = process.argv.slice(2);
if (!urls.length) {
  const sm = readFileSync(join(here, 'sitemap.xml'), 'utf8');
  urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
console.log(`отправляю ${urls.length} URL`);

for (let i = 0; i < urls.length; i += 1000) {
  const batch = urls.slice(i, i + 1000);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST, key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: batch,
    }),
  });
  // 403 SiteVerificationNotCompleted на первом заходе — норма, проверка ключа
  // занимает секунды. Просто запустить скрипт ещё раз.
  console.log(`  батч ${i / 1000 + 1}: HTTP ${r.status} ${r.status === 200 ? 'принято' : await r.text().then(t => t.slice(0, 120))}`);
}
