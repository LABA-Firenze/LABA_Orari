#!/usr/bin/env node
/**
 * Rimuove "Inglese per la Comunicazione Artistica" 10:30-12:30 Magna 1+2 (non esiste).
 * La lezione GD3+Pittura3 è SOLO in Conference 1+2 11:30-13:30.
 */
const fs = require('fs')
const path = require('path')

const ORARI = path.join(__dirname, 'orari')
let removed = 0
let filesModified = 0

function extractTime(iso) {
  const t = (iso || '').split('T')[1]
  return t ? t.slice(0, 5) : ''
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      walk(full)
    } else if (name.endsWith('.json')) {
      let data
      try {
        data = JSON.parse(fs.readFileSync(full, 'utf8'))
      } catch (e) {
        console.error('Parse', full)
        continue
      }
      if (!Array.isArray(data)) continue

      const aulaNorm = (a) => (a === 'Magna 1+2' || a === 'Aula Magna 1+2' ? 'Magna 1+2' : a)
      const out = data.filter((entry) => {
        if (entry.corso !== 'Inglese per la Comunicazione Artistica') return true
        const start = extractTime(entry.start)
        const end = extractTime(entry.end)
        const aula = aulaNorm(entry.aula || '')
        if (start === '10:30' && end === '12:30' && aula === 'Magna 1+2') {
          removed++
          return false
        }
        return true
      })

      if (out.length !== data.length) {
        fs.writeFileSync(full, JSON.stringify(out, null, 2))
        filesModified++
      }
    }
  }
}

walk(ORARI)
console.log(`Rimossi ${removed} entry errate, modificati ${filesModified} file`)
