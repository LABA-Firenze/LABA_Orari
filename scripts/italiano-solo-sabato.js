#!/usr/bin/env node
/**
 * Imposta "Italiano per Stranieri" con SOLO i sabati del 2° semestre (feb–giu 2026).
 * Rimuove tutte le date che non sono sabato e inserisce l'elenco completo dei sabati.
 * Formato data: DD-MM-YYYY. getDay() 6 = sabato.
 */

const fs = require('fs')
const path = require('path')

const ORARI_ROOT = path.join(__dirname, '..', 'orari')

/** Genera tutti i sabati da inizioFeb a fineGiu 2026 */
function sabatiSemestre2() {
  const out = []
  const start = new Date(2026, 1, 1)   // 1 feb 2026
  const end = new Date(2026, 5, 30)    // 30 giu 2026
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 6) continue
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    out.push({ data: `${dd}-${mm}-2026`, oraInizio: '14:00', oraFine: '18:00' })
  }
  return out
}

const LEZIONI_SABATO = sabatiSemestre2()

function processFile(filePath) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (!Array.isArray(json)) return false
  let changed = false
  for (const entry of json) {
    if (entry.corso !== 'Italiano per Stranieri') continue
    entry.lezioni = [...LEZIONI_SABATO]
    changed = true
    console.log(path.relative(ORARI_ROOT, filePath), '- impostate', LEZIONI_SABATO.length, 'sabati')
  }
  if (changed) fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8')
  return changed
}

let count = 0
for (const corso of fs.readdirSync(ORARI_ROOT)) {
  const corsoDir = path.join(ORARI_ROOT, corso)
  if (!fs.statSync(corsoDir).isDirectory()) continue
  for (const anno of fs.readdirSync(corsoDir)) {
    const twoSem = path.join(corsoDir, anno, '2sem.json')
    if (fs.existsSync(twoSem) && processFile(twoSem)) count++
  }
}
console.log('File aggiornati:', count)
