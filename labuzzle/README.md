# LABuzzle — griglia giornaliera

Stesso flusso di `labarola/words.json`: file servito da GitHub Pages (`LABA_Orari`).

- **`grids.json`**: elenco `days` con `date` (`yyyy-MM-dd`) e `rows` (4 stringhe di 4 lettere maiuscole, alfabeto italiano senza accenti).

L’app iOS carica da  
`https://laba-firenze.github.io/LABA_Orari/labuzzle/grids.json`  
con cache 1h e fallback sul bundle (`labuzzle_grids.json`).

Per estendere le date: rigenerare o aggiungere voci in `days` mantenendo il formato.
