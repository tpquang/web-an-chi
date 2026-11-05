// Sinh docs/web/design/palette.html từ design/tokens.css. Chạy từ gốc repo sau khi đổi token.
import { readFileSync, writeFileSync } from 'node:fs'

const css = readFileSync('design/tokens.css', 'utf8')
const block = (re) => Object.fromEntries([...css.match(re)[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
const light = block(/:root \{([\s\S]*?)\n\}/)
const dark = block(/\[data-theme="dark"\] \{([\s\S]*?)\n\}/)
const resolve = (v) => (v?.startsWith('var(--') ? light[v.slice(6, -1)] : v)

const ramp = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, light[`wood-${n}`]])
const groups = {
  'Thương hiệu': ['brand', 'wood', 'wood-hover', 'wood-soft', 'on-wood', 'brass'],
  'Nền và chữ': ['paper', 'paper-2', 'surface', 'ink', 'ink-2', 'ink-3', 'line', 'line-strong'],
  'Khối tối': ['night', 'on-night', 'on-night-2'],
  'Trạng thái': ['ok', 'ok-soft', 'warn', 'warn-soft', 'err', 'err-soft', 'info', 'info-soft'],
}
const swatch = (name, value) => `<div class="s"><i style="background:${value}"></i><b>${name}</b><code>${value.toUpperCase()}</code></div>`
const theme = (label, t, get) => {
  const c = (k) => get(k)
  return `<section class="t" style="background:${c('paper')};color:${c('ink')};--l:${c('line')};--m:${c('ink-2')}">
<h2 style="font-family:Georgia,serif">${label}</h2>
${Object.entries(groups).map(([g, keys]) => `<h3>${g}</h3><div class="g">${keys.map((k) => swatch(k, c(k))).join('')}</div>`).join('')}
<h3>Áp dụng</h3>
<div class="demo" style="background:${c('surface')}">
<h4 style="font-family:Georgia,serif;color:${c('wood')}">Vòng tay trầm hương 12mm</h4>
<p style="color:${c('ink-2')}">Mô tả sản phẩm dùng chữ phụ trên nền thẻ.</p>
<div class="row"><span class="b" style="background:${c('wood')};color:${c('on-wood')}">Thêm vào giỏ</span><span class="b" style="background:${c('wood-hover')};color:${c('on-wood')}">Hover</span><span class="b" style="border:1px solid ${c('wood')};color:${c('wood')}">Nút viền</span></div>
<div class="row">${['ok:Còn hàng', 'warn:Sắp hết', 'err:Hết hàng', 'info:Thông tin'].map((x) => { const [k, l] = x.split(':'); return `<span class="tag" style="background:${c(k + '-soft')};color:${c(k)}">${l}</span>` }).join('')}</div>
</div></section>`
}

writeFileSync('docs/web/design/palette.html', `<!doctype html>
<!-- File sinh tự động bởi anchi-ui-ux/scripts/build-palette.mjs, không sửa tay. -->
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bảng màu An Chi</title>
<style>
*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,sans-serif;background:${light.paper};color:${light.ink}}
header{padding:32px 16px;display:flex;gap:24px;align-items:center;flex-wrap:wrap}header img{width:120px;border-radius:8px}h1{font:500 36px Georgia,serif;margin:0}
.ramp{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));margin:0 16px 32px}.ramp div{padding:32px 8px 8px;font-size:12px}
.ts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))}.t{padding:24px 16px}.t h2{margin:0;font-size:28px;font-weight:500}h3{margin:24px 0 8px;font-size:14px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:12px}.s i{display:block;height:56px;border-radius:6px;border:1px solid var(--l)}.s b{display:block;font-size:13px;margin-top:6px}.s code{font-size:12px;color:var(--m)}
.demo{border:1px solid var(--l);border-radius:8px;padding:20px}.demo h4{margin:0;font-size:24px;font-weight:600}.demo p{margin:4px 0 16px}.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.b{padding:10px 16px;border-radius:6px;font-weight:500}.tag{padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600}
</style></head><body>
<header><img src="../../../apps/web/public/brand/logo-sample.jpeg" alt="Logo mẫu An Chi Trầm Hương"><div><h1>Bảng màu An Chi</h1><p>Màu chính: gỗ sẫm ${light['wood-700'].toUpperCase()}. Sáng là theme gốc, lần đầu vào trang theo cài đặt thiết bị.</p></div></header>
<div class="ramp">${ramp.map(([n, v]) => `<div style="background:${v};color:${n >= 500 ? light.paper : light.ink}"><b>${n}</b><br>${v.toUpperCase()}</div>`).join('')}</div>
<div class="ts">${theme('Theme sáng', light, (k) => resolve(light[k]))}${theme('Theme tối', dark, (k) => dark[k])}</div>
</body></html>
`)
console.log('Đã ghi docs/web/design/palette.html')
