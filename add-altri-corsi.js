#!/usr/bin/env node
/**
 * Aggiunge altriCorsi ai JSON per le lezioni condivise.
 * Slot: titolo + HH:mm start + HH:mm end + aula (normalizzata) + docente + gruppo
 */
const fs = require('fs')
const path = require('path')

const ORARI = path.join(__dirname, 'orari')

function extractTime(iso) {
  const t = (iso || '').split('T')[1]
  return t ? t.slice(0, 5) : ''
}

function normAula(a) {
  const m = {
    'Aula Magna 2': 'Magna 2',
    'Magna 2': 'Magna 2',
    'Magna 1+2': 'Magna 1+2',
    'Aula Magna': 'Magna',
    'Magna': 'Magna',
    'Conference 1+2': 'Conference 1+2',
    'Digital Hub': 'Digital HUB',
    'Digital HUB': 'Digital HUB',
  }
  return m[a] || a
}

// slotKey -> [[corso, anno], ...] (tutti i corsi che hanno questa lezione)
const SHARED = {
  'Semiotica dell\'Arte|11:30|13:30|Magna 2|Caciolli|': [['GD', 2], ['PITTURA', 2]],
  'Filosofia dell\'Arte|13:00|15:00|Magna 1+2|Guaita|': [['FOTOGRAFIA', 2], ['GD', 3]],
  'Fondamenti di Marketing Culturale|10:30|12:30|Magna 1+2|Imparati|': [['FOTOGRAFIA', 3], ['PITTURA', 3]],
  'Inglese|13:00|15:00|Magna 2|Green|': [['GD', 1], ['PITTURA', 1]],
  // Solo Conference 1+2 11:30-13:30 (Magna 1+2 10:30-12:30 NON esiste per GD3/Pittura3)
  'Inglese per la Comunicazione Artistica|11:30|13:30|Conference 1+2|Connell|': [['GD', 3], ['PITTURA', 3]],
  'Storia del Cinema e del Video|14:00|16:30|Magna 2|Borrelli / Galeassi|': [['FOTOGRAFIA', 1], ['PITTURA', 3], ['REGIA', 1]],
  'Storia dell\'Arte Contemporanea|08:30|10:30|Magna 1+2|Fiaschi|': [['GD', 3], ['PITTURA', 3]],
  'Storia dell\'Arte Contemporanea|09:30|11:30|Conference 1+2|Fiaschi|': [['GD', 3], ['PITTURA', 3]],
  'Storia dell\'Arte Contemporanea|16:30|18:30|Conference 1+2|Fiaschi|': [['DESIGN', 3], ['FOTOGRAFIA', 2]],
  'Storia dell\'Arte Moderna|14:00|16:30|Magna 2|Sughi|': [['DESIGN', 1], ['FOTOGRAFIA', 1]],
  'Italiano per Stranieri|14:00|18:00|Digital HUB|Carbone|': [
    ['CINEMA', 1], ['DESIGN', 1], ['DESIGN', 2], ['DESIGN', 3],
    ['FASHION', 1], ['FASHION', 2], ['FASHION', 3],
    ['FOTOGRAFIA', 1], ['FOTOGRAFIA', 2], ['FOTOGRAFIA', 3],
    ['GD', 1], ['GD', 2], ['GD', 3],
    ['INTERIOR', 1], ['INTERIOR', 2],
    ['PITTURA', 1], ['PITTURA', 2], ['PITTURA', 3],
    ['REGIA', 1],
  ],
}

function slotKey(entry) {
  const start = extractTime(entry.start)
  const end = extractTime(entry.end)
  const aula = normAula(entry.aula)
  const gruppo = (entry.gruppo || '').toString()
  return `${entry.corso}|${start}|${end}|${aula}|${entry.docente}|${gruppo}`
}

let modified = 0

function processDir(dir, corso, anno) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      const n = parseInt(name, 10)
      processDir(full, corso, !isNaN(n) ? n : anno)
    } else if (name.endsWith('.json')) {
      const annoDir = path.basename(path.dirname(full))
      const corsoDir = path.basename(path.dirname(path.dirname(full)))
      const anno = parseInt(annoDir, 10) || 1
      const corso = corsoDir

      let data
      try {
        data = JSON.parse(fs.readFileSync(full, 'utf8'))
      } catch (e) {
        console.error('Parse', full)
        continue
      }
      if (!Array.isArray(data)) continue

      let changed = false
      for (const entry of data) {
        if (entry.anno !== anno) continue
        const key = slotKey(entry)
        const all = SHARED[key]
        if (!all) continue

        const altri = all.filter(([c, a]) => !(c === corso && a === anno))
        if (altri.length === 0) continue

        entry.altriCorsi = altri
        changed = true
        modified++
      }
      if (changed) {
        fs.writeFileSync(full, JSON.stringify(data, null, 2))
      }
    }
  }
}

function walk(dir, parentCorso, parentAnno) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      const n = parseInt(e.name, 10)
      if (!isNaN(n) && n >= 1 && n <= 3) {
        walk(full, path.basename(dir), n)
      } else {
        walk(full, e.name, parentAnno)
      }
    } else if (e.name.endsWith('.json')) {
      const parts = full.split(path.sep)
      const corso = parts[parts.length - 3]
      const anno = parseInt(parts[parts.length - 2], 10)

      let data
      try {
        data = JSON.parse(fs.readFileSync(full, 'utf8'))
      } catch (err) {
        console.error('Parse', full)
        continue
      }
      if (!Array.isArray(data)) continue

      let changed = false
      for (const entry of data) {
        if (entry.anno !== anno) continue
        const key = slotKey(entry)
        const all = SHARED[key]
        if (!all) continue

        const altri = all.filter(([c, a]) => !(c === corso && a === anno))
        if (altri.length === 0) continue

        entry.altriCorsi = altri
        changed = true
        modified++
      }
      if (changed) {
        fs.writeFileSync(full, JSON.stringify(data, null, 2))
      }
    }
  }
}

walk(ORARI)
console.log(`Aggiunto altriCorsi a ${modified} entry`)
