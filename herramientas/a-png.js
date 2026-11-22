// Convierte a PNG los SVG que generó diagramas.py (lecciones/img/diagramas.json).
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
const img = path.join(__dirname, '..', 'lecciones', 'img')
const lista = JSON.parse(fs.readFileSync(path.join(img, 'diagramas.json')))
;(async () => {
  const b = await chromium.launch()
  for (const [n, w, h] of lista) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1.5 })
    await p.goto('file://' + path.join(img, n + '.svg'))
    await p.screenshot({ path: path.join(img, n + '.png') })
    await p.close()
  }
  await b.close()
})()
