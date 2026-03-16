#!/usr/bin/env node
/**
 * Converte i file flat in orari/{CORSO}/{ANNO}/*.json nel formato nuovi
 * (una entry per lezione con array lezioni, date GG-MM-AAAA) e scrive in
 * orari/nuovi/{CORSO}/{ANNO}/1sem.json e 2sem.json.
 *
 * Uso: node scripts/converti-vecchi-in-nuovi.js
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const ORARI = path.join(ROOT, 'orari')
const NUOVI = path.join(ROOT, 'orari', 'nuovi')

/** Da ISO "2026-02-01T09:30:00+01:00" → { data: "01-02-2026", oraInizio: "09:30", oraFine da end } */
function isoToLezione(startISO, endISO) {
  const s = startISO.trim()
  const e = endISO.trim()
  const dateMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  const endMatch = e.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!dateMatch || !endMatch) return null
  const data = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
  const oraInizio = `${dateMatch[4]}:${dateMatch[5]}`
  const oraFine = `${endMatch[4]}:${endMatch[5]}`
  return { data, oraInizio, oraFine }
}

function chiaveEntry(entry) {
  return [
    entry.corso,
    entry.oidCorso ?? '',
    (entry.oidCorsi || []).join(','),
    entry.anno,
    entry.gruppo ?? '',
    entry.aula ?? '',
    entry.docente ?? '',
    entry.note ?? '',
    entry.corsoStudio ?? ''
  ].join('\t')
}

function convertiFlatToNuovi(flatArray) {
  const gruppi = new Map()

  for (const entry of flatArray) {
    const start = entry.start
    const end = entry.end
    if (!start || !end) continue

    const lezione = isoToLezione(start, end)
    if (!lezione) continue

    const key = chiaveEntry(entry)
    if (!gruppi.has(key)) {
      gruppi.set(key, {
        corso: entry.corso,
        oidCorso: entry.oidCorso ?? null,
        oidCorsi: entry.oidCorsi ?? null,
        anno: entry.anno,
        gruppo: entry.gruppo ?? null,
        aula: entry.aula ?? null,
        docente: entry.docente ?? null,
        note: entry.note ?? null,
        corsoStudio: entry.corsoStudio ?? null,
        lezioni: []
      })
    }
    gruppi.get(key).lezioni.push(lezione)
  }

  const out = []
  for (const obj of gruppi.values()) {
    obj.lezioni.sort((a, b) => {
      const [ga, ma, aa] = a.data.split('-').map(Number)
      const [gb, mb, ab] = b.data.split('-').map(Number)
      if (aa !== ab) return aa - ab
      if (ma !== mb) return ma - mb
      return ga - gb
    })
    out.push(obj)
  }

  out.sort((a, b) => {
    if (a.corso !== b.corso) return a.corso.localeCompare(b.corso)
    if (a.gruppo !== b.gruppo) return (a.gruppo || '').localeCompare(b.gruppo || '')
    return 0
  })

  return out
}

function walkOrariFlat(dir, prefix = '') {
  const results = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      if (name === 'nuovi') continue
      results.push(...walkOrariFlat(full, prefix ? `${prefix}/${name}` : name))
    } else if (name.endsWith('.json') && (name === '1sem.json' || name === '2sem.json')) {
      results.push(prefix ? `${prefix}/${name}` : name)
    }
  }
  return results
}

function main() {
  const files = walkOrariFlat(ORARI)
  console.log(`Trovati ${files.length} file flat da convertire.\n`)

  for (const rel of files) {
    const srcPath = path.join(ORARI, rel)
    const destPath = path.join(NUOVI, rel)

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

    const converted = convertiFlatToNuovi(data)
    const destDir = path.dirname(destPath)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    fs.writeFileSync(destPath, JSON.stringify(converted, null, 2))
    console.log(`${rel} → ${converted.length} lezioni (da ${data.length} eventi flat)`)
  }

  console.log('\nFatto. I file in orari/nuovi/ sono pronti.')
}

main()
