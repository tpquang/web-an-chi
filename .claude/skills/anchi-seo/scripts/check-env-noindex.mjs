// Sau deploy, kiểm môi trường đúng trạng thái index. Prod bật nhầm noindex là mất index.
// Dùng: node check-env-noindex.mjs <base-url> --expect=index|noindex
const base = (process.argv[2] || '').replace(/\/$/, '')
const expected = process.argv.find((a) => a.startsWith('--expect='))?.split('=')[1]
if (!base || !['index', 'noindex'].includes(expected)) {
  console.error('Dùng: node check-env-noindex.mjs <base-url> --expect=index|noindex')
  process.exit(2)
}
const res = await fetch(`${base}/`)
const html = await res.text()
const header = /noindex/.test(res.headers.get('x-robots-tag') || '')
const meta = (html.match(/<meta[^>]*name="robots"[^>]*>/g) || []).some((t) => /noindex/.test(t))
const actual = header || meta ? 'noindex' : 'index'
console.log(`${base}: ${actual} (header ${header}, meta ${meta})`)
process.exit(actual === expected ? 0 : 1)
