import puppeteer from 'puppeteer'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const htmlPath = resolve(__dirname, 'pitch-deck.html')
const pdfPath  = resolve(__dirname, 'cadenz-japan-pitch.pdf')

const browser = await puppeteer.launch({ headless: true })
const page    = await browser.newPage()

await page.setViewport({ width: 1280, height: 720 })
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'domcontentloaded', timeout: 60000 })

// Hide nav and fixed UI elements before capturing
await page.evaluate(() => {
  const hide = ['#nav', '.slide-num-badge', '.key-hint', '.fullscreen-btn', '.scroll-hint']
  hide.forEach(sel => {
    const el = document.querySelector(sel)
    if (el) el.style.display = 'none'
  })
})

// Wait for fonts + animations to settle
await new Promise(r => setTimeout(r, 2000))

const TOTAL = 17
const pages = []

for (let i = 0; i < TOTAL; i++) {
  // Navigate to each slide
  await page.evaluate((idx) => {
    const slides = document.querySelectorAll('.slide')
    slides.forEach((s, j) => {
      s.classList.remove('active', 'exit')
      if (j === idx) s.classList.add('active')
    })
    // Update dots + counter
    document.querySelectorAll('.dot').forEach((d, j) => {
      d.classList.toggle('active', j === idx)
    })
    const counter = document.getElementById('counter')
    const badge = document.getElementById('slideNumBadge')
    if (counter) counter.textContent = `${idx + 1} / 17`
    if (badge) badge.textContent = String(idx + 1).padStart(2, '0') + ' / 17'
  }, i)

  await new Promise(r => setTimeout(r, 300))

  const screenshot = await page.screenshot({ type: 'png', fullPage: false })
  pages.push(screenshot)
  console.log(`Captured slide ${i + 1}/${TOTAL}`)
}

await browser.close()

// Build PDF from screenshots using built-in puppeteer PDF
// Re-open and print each slide
const browser2 = await puppeteer.launch({ headless: true })
const page2 = await browser2.newPage()

// Build a simple HTML with all slides as images
const imgs = pages.map(buf =>
  `<div style="page-break-after:always;margin:0;padding:0;width:1280px;height:720px;overflow:hidden;">
    <img src="data:image/png;base64,${buf.toString('base64')}" style="width:1280px;height:720px;display:block;">
  </div>`
).join('\n')

const html = `<!DOCTYPE html><html><head><style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { background:#000; }
  @page { size: 1280px 720px; margin: 0; }
</style></head><body>${imgs}</body></html>`

await page2.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page2.pdf({
  path: pdfPath,
  width: '1280px',
  height: '720px',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
})

await browser2.close()
console.log('PDF saved to:', pdfPath)
