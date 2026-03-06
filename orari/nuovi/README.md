# Formato nuovi orari

Ogni lezione è **un solo entry** con l'array `lezioni` che elenca tutte le date (e orari). Modificare le date è facile: basta editare l'array.

## Schema

Campi condivisi: `corso`, `oidCorso`, `oidCorsi`, `anno`, `gruppo`, `aula`, `docente`, `note`, `corsoStudio`

Ogni entry ha **lezioni**: array di `{ "data": "GG-MM-AAAA", "oraInizio": "HH:MM", "oraFine": "HH:MM" }`.

**Formato data:** `GG-MM-AAAA` (es. `28-02-2026`). Lo script di espansione converte in ISO per i file flat.

Esempio:

```json
{
  "corso": "Italiano per Stranieri",
  "oidCorso": null,
  "oidCorsi": null,
  "anno": 1,
  "gruppo": null,
  "aula": "Digital HUB",
  "docente": "Carbone",
  "lezioni": [
    { "data": "28-02-2026", "oraInizio": "14:00", "oraFine": "18:00" },
    { "data": "07-03-2026", "oraInizio": "14:00", "oraFine": "18:00" },
    { "data": "14-03-2026", "oraInizio": "14:00", "oraFine": "18:00" }
  ],
  "note": null,
  "corsoStudio": "DESIGN"
}
```

Se in date diverse gli orari cambiano, basta mettere orari diversi in ogni oggetto dell'array.

## Conversione

- **Flat → Nuovi:** `node scripts/converti-vecchi-in-nuovi.js` — legge i file in `orari/{CORSO}/{ANNO}/` (formato flat) e riscrive in `orari/nuovi/{CORSO}/{ANNO}/` (formato lezioni, date GG-MM-AAAA). Usare dopo aver modificato i flat a mano o per creare la struttura nuovi da zero.
- **Nuovi → Flat:** `node scripts/espandi-nuovi.js` — converte i file in `orari/nuovi/` nel formato flat (`start`/`end` ISO8601) e aggiorna `orari/{CORSO}/{ANNO}/` (merge con esistente). Eseguire dopo ogni modifica in `nuovi/` per aggiornare Piattaforma Orario e app.
