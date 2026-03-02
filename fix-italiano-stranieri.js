#!/usr/bin/env node
/**
 * Corregge Italiano per Stranieri: sempre 14:00-18:00, sempre Digital HUB.
 */
const fs = require('fs')
const path = require('path')

const ORARI = path.join(__dirname, 'orari')
let fixed = 0
let filesModified = 0

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
        console.error('Parse error', full)
        continue
      }
      if (!Array.isArray(data)) continue
      let changed = false
      const seen = new Set()
      const out = []
      for (const entry of data) {
        if (entry.corso !== 'Italiano per Stranieri') {
          out.push(entry)
          continue
        }
        let start = entry.start || ''
        let end = entry.end || ''
        if (start.includes('T13:00') && end.includes('T17:00')) {
          start = start.replace('T13:00', 'T14:00')
          end = end.replace('T17:00', 'T18:00')
          changed = true
          fixed++
        }
        if (entry.aula === 'Digital Hub') {
          entry.aula = 'Digital HUB'
          changed = true
        }
        const key = `${start}|${end}|${entry.aula}`
        if (seen.has(key)) continue
        seen.add(key)
        entry.start = start
        entry.end = end
        out.push(entry)
      }
      if (changed) {
        fs.writeFileSync(full, JSON.stringify(out, null, 2))
        filesModified++
      }
    }
  }
}

walk(ORARI)
console.log(`Corretti ${fixed} entry, modificati ${filesModified} file`)
