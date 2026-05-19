/**
 * IndexNow: notify Bing + Yandex về URL changes.
 * Chạy sau mỗi lần deploy có content/sitemap update.
 *
 * Usage: pnpm tsx scripts/notify-indexnow.ts
 *
 * Yêu cầu: SITE_URL trong .env hoặc env var.
 */

const INDEXNOW_KEY = 'b2c4b113d010f28af75742592373bdcc82ce67ce19aacad3253f7119f0b4dce0';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luangiaivanmenh.com';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

async function fetchSitemapUrls(): Promise<string[]> {
  const xml = await fetch(`${SITE_URL}/sitemap.xml`).then((r) => r.text());
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(matches, (m) => m[1]);
}

async function notify(urls: string[]) {
  if (urls.length === 0) {
    console.log('[indexnow] no URLs to submit');
    return;
  }

  const body = {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (res.status === 200 || res.status === 202) {
    console.log(`[indexnow] OK ${res.status} — submitted ${urls.length} URLs`);
  } else {
    const text = await res.text().catch(() => '');
    console.error(`[indexnow] FAIL ${res.status} ${res.statusText}: ${text}`);
    process.exitCode = 1;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const urls = args.length > 0 ? args : await fetchSitemapUrls();
  console.log(`[indexnow] submitting ${urls.length} URL(s) to api.indexnow.org`);
  for (const u of urls) console.log(`  - ${u}`);
  await notify(urls);
}

main().catch((err) => {
  console.error('[indexnow] error:', err);
  process.exit(1);
});
