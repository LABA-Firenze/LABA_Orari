#!/usr/bin/env node
/**
 * Espande i file in orari/nuovi/ nel formato flat (start/end ISO8601)
 * per Piattaforma Orario e app LABA.
 *
 * Uso: node scripts/espandi-nuovi.js
 *
 * Comportamento: per ogni file in orari/nuovi/X/Y/Z.json, espande gli entry
 * e scrive in orari/X/Y/Z.json. Se il file di destinazione esiste, fa MERGE:
 * sostituisce le lezioni che compaiono in nuovi, mantiene le altre.
 *
 * Opzioni:
 *   --sovrascrivi  sovrascrive completamente (niente merge)
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const NUOVI = path.join(ROOT, 'orari', 'nuovi')
const ORARI = path.join(ROOT, 'orari')
const TZ = '+01:00'

/** Converte data da GG-MM-AAAA o AAAA-MM-GG a AAAA-MM-GG per ISO. */
function toISOData(s) {
  const d = String(s).trim()
  const dmY = d.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dmY) {
    return `${dmY[3]}-${dmY[2].padStart(2, '0')}-${dmY[1].padStart(2, '0')}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  throw new Error('Data non valida (usare GG-MM-AAAA): ' + s)
}

function espandiEntry(entry, corsoStudio) {
  const base = {
    corso: entry.corso,
    oidCorso: entry.oidCorso ?? null,
    oidCorsi: entry.oidCorsi ?? null,
    anno: entry.anno,
    gruppo: entry.gruppo ?? null,
    aula: entry.aula ?? null,
    docente: entry.docente ?? null,
    note: entry.note ?? null,
    corsoStudio: corsoStudio || entry.corsoStudio || 'DESIGN'
  }

  const events = []
  if (!entry.lezioni || !Array.isArray(entry.lezioni)) return events

  for (const l of entry.lezioni) {
    const dataISO = toISOData(l.data)
    const oi = l.oraInizio || '09:00'
    const of = l.oraFine || '13:00'
    events.push({
      ...base,
      start: `${dataISO}T${oi}:00${TZ}`,
      end: `${dataISO}T${of}:00${TZ}`
    })
  }

  return events
}

function walkNuovi(dir, prefix = '') {
  const results = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      results.push(...walkNuovi(full, prefix ? `${prefix}/${name}` : name))
    } else if (name.endsWith('.json')) {
      const rel = prefix ? `${prefix}/${name}` : name
      results.push(rel)
    }
  }
  return results
}

function main() {
  if (!fs.existsSync(NUOVI)) {
    console.log('Cartella orari/nuovi/ non trovata.')
    process.exit(1)
  }

  const files = walkNuovi(NUOVI)
  let totalEvents = 0

  for (const rel of files) {
    const srcPath = path.join(NUOVI, rel)
    const destPath = path.join(ORARI, rel)

    let data
    try {
      data = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
    } catch (e) {
      console.error('Parse error', srcPath, e.message)
      continue
    }

    if (!Array.isArray(data)) {
      console.error('File non è un array:', srcPath)
      continue
    }

    const corsoStudio = rel.split('/')[0] || 'DESIGN'
    const events = []
    for (const entry of data) {
      const expanded = espandiEntry(entry, corsoStudio)
      events.push(...expanded)
    }

    const destDir = path.dirname(destPath)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    const sovrascrivi = process.argv.includes('--sovrascrivi')
    let output = events

    if (!sovrascrivi && fs.existsSync(destPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(destPath, 'utf8'))
        const nuoviCorsi = new Set(events.map(e => `${e.corso}|${e.anno}|${e.gruppo}`))
        const filtered = existing.filter(e => !nuoviCorsi.has(`${e.corso}|${e.anno}|${e.gruppo}`))
        output = [...filtered, ...events].sort((a, b) => a.start.localeCompare(b.start))
      } catch (e) {
        console.error('Merge fallito', destPath, e.message)
      }
    }

    fs.writeFileSync(destPath, JSON.stringify(output, null, 2))
    totalEvents += events.length
    console.log(`${rel} → ${events.length} eventi`)
  }

  console.log(`\nTotale: ${totalEvents} eventi espansi da ${files.length} file`)
}

main()
