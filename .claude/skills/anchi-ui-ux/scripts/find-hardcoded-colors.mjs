// Liệt kê màu viết cứng và class màu mặc định của Tailwind trong web và CMS. Chạy từ gốc repo.
// Dùng: node find-hardcoded-colors.mjs          Có vi phạm thì exit 1.
import fs from 'node:fs'
import path from 'node:path'

const ROOTS = ['apps/web/src', 'apps/cms/src']
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g
const TW_PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|accent|decoration|shadow)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/g

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('._')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(css|tsx?)$/.test(entry.name)) yield full
  }
}

let total = 0
for (const root of ROOTS) {
  for (const file of walk(root)) {
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((text, i) => {
        // Định nghĩa token là nơi màu được phép sống. Dòng có ghi chú allow-color là ngoại lệ đã duyệt.
        if (/^\s*--[\w-]+\s*:/.test(text) || text.includes('allow-color')) return
        for (const m of [...text.matchAll(COLOR), ...text.matchAll(TW_PALETTE)]) {
          total += 1
          console.log(`${file}:${i + 1}  ${m[0]}`)
        }
      })
  }
}
console.log(`${total} chỗ viết cứng màu.`)
process.exit(total ? 1 : 0)
