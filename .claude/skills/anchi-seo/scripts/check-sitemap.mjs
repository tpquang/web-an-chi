// Kiểm từng URL trong sitemap sau deploy, chạy từ gốc repo: node check-sitemap.mjs <base> [--limit=N]
// Báo URL không trả 200, có redirect, thiếu canonical hoặc bị noindex; link trong nav.ts đi qua
// redirect; và (khi không --limit) trang trong sitemap không có link nội bộ nào. Có lỗi thì exit 1.
import { readFileSync } from 'node:fs'

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity
// Thấp có chủ đích: script có thể chạy trên prod.
const CONCURRENCY = 4

const res = await fetch(`${base}/sitemap.xml`)
if (!res.ok) {
  console.error(`Không đọc được sitemap: ${res.status}`)
  process.exit(1)
}
const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace(/&amp;/g, '&'))
  .slice(0, limit)

const problems = []
const linked = new Set()

async function check(url) {
  const { pathname, search } = new URL(url)
  const r = await fetch(`${base}${pathname}${search}`, { redirect: 'manual' })
  if (r.status !== 200) {
    const to = r.headers.get('location')
    problems.push(`${r.status} ${pathname}${search}${to ? ` -> ${to}` : ''}`)
    return
  }
  const html = await r.text()
  for (const m of html.matchAll(/<a\b[^>]*href="(\/[^"?#]*)/g)) linked.add(m[1])
  const tags = html.match(/<(?:link|meta)\b[^>]*>/g) || []
  if (pathname !== '/' && !tags.some((t) => /rel="canonical"/.test(t))) problems.push(`thiếu canonical ${pathname}`)
  if (tags.some((t) => /name="robots"/.test(t) && /noindex/.test(t))) problems.push(`noindex ${pathname}`)
  if (/noindex/.test(r.headers.get('x-robots-tag') || '')) problems.push(`X-Robots-Tag noindex ${pathname}`)
}

const queue = [...urls]
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const url = queue.shift()
      await check(url).catch((e) => problems.push(`lỗi mạng ${url}: ${e.message}`))
    }
  }),
)

const navHrefs = new Set(
  [...readFileSync('apps/web/src/lib/nav.ts', 'utf8').matchAll(/href: "(\/[^"]*)"/g)].map((m) => m[1]),
)
for (const href of navHrefs) {
  const r = await fetch(`${base}${href}`, { redirect: 'manual' })
  if (r.status !== 200) problems.push(`nav.ts ${r.status} ${href}`)
}

if (limit === Infinity) {
  for (const url of urls) {
    const { pathname } = new URL(url)
    if (pathname !== '/' && !linked.has(pathname)) problems.push(`mồ côi ${pathname}`)
  }
}

console.log(`Đã kiểm ${urls.length} URL, ${problems.length} vấn đề.`)
problems.forEach((p) => console.log(`  ${p}`))
process.exit(problems.length ? 1 : 0)
