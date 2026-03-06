# LABA Orari

Repository per gli orari delle lezioni dell'Accademia LABA Firenze.

## Struttura

```
orari/
├── CINEMA/
│   └── 1/
│       ├── 1sem.json
│       └── 2sem.json
├── DESIGN/
│   ├── 1/  1sem.json, 2sem.json
│   ├── 2/  1sem.json, 2sem.json
│   └── 3/  1sem.json, 2sem.json
├── FASHION/
├── FOTOGRAFIA/
├── GD/
├── INTERIOR/
├── PITTURA/
└── REGIA/
```

Codici corso: `CINEMA`, `DESIGN`, `FASHION`, `FOTOGRAFIA`, `GD`, `INTERIOR`, `PITTURA`, `REGIA`.

## Formato JSON (formato “nuovi”)

Ogni file è un array di **lezioni**. Ogni elemento ha un array `lezioni` con le date/orari (una riga per giorno):

- `corso`, `oidCorso`, `oidCorsi`, `anno`, `gruppo`, `aula`, `docente`, `note`, `corsoStudio`
- `lezioni`: `[{ "data": "GG-MM-AAAA", "oraInizio": "HH:MM", "oraFine": "HH:MM" }, ...]`

I client (App iOS, PWA, Piattaforma Orario) riconoscono questo formato e lo espandono in memoria in eventi con `start`/`end` ISO.

## GitHub Pages

I file sono disponibili su:
`https://laba-firenze.github.io/LABA_Orari/orari/{CODICE}/{anno}/{1|2}sem.json`

Esempio: `.../orari/CINEMA/1/1sem.json`

## Come aggiornare gli orari

1. Modifica il file JSON in `orari/{CODICE}/{anno}/1sem.json` o `2sem.json`
2. Commit e push: GitHub Pages aggiorna automaticamente i file pubblici

La cartella `orari/nuovi/` è un backup del formato “nuovi”; i file in uso sono quelli in `orari/{CODICE}/{anno}/`.
