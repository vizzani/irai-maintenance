# IRAI - Sistema Gestione Manutenzione Impianti Antincendio

Sistema web e mobile per la gestione delle manutenzioni degli impianti antincendio (IRAI) in conformità alla norma **UNI 11224:2019/2021**.

## Caratteristiche Principali

- **Anagrafica Impianti**: Gestione Clienti, Sedi, Centrali Antincendio, Dispositivi
- **Check-list DINAMICHE**: Form basati sui punti della norma per ogni tipologia di dispositivo
- **Ciclo di Manutenzione**: Tracciabilità 50% + 50% per copertura annuale
- **Registro Antincendio**: Alimentazione automatica del registro obbligatorio (DM 20/12/2018)
- **Verifica Generale**: Gestione interventi al 12° anno
- **Generazione PDF**: Verbali di manutenzione conformi alla norma
- **Offline-First**: Lavoro senza rete con sincronizzazione automatica

## Requisiti

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm o yarn

## Quick Start

### 1. Setup Database

```bash
# Crea il database
createdb irai_db

# Importa lo schema
psql irai_db -f db/schema.sql

# Oppure con credenzie personalizzate
psql -U postgres -d irai_db -f db/schema.sql
```

### 2. Configurazione Ambiente

Crea un file `.env` nella root:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/irai_db
PORT=3001
```

### 3. Installazione Dipendenze

```bash
npm install
```

### 4. Avvio

```bash
# Terminale 1: Backend API
npm run server

# Terminale 2: Frontend Vite
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## Normativa UNI 11224:2019/2021

### Protocolli di Verifica

| Protocollo | Frequenza | Descrizione |
|------------|-----------|-------------|
| **Sorveglianza** | Semestrale (6 mesi) | Verifiche visive e funzionali di base |
| **Controllo Periodico** | Annuale (12 mesi) | Prova funzionale completa di tutti i dispositivi |
| **Revisione** | Ogni 5 anni | Sostituzione componenti, pulizia, taratura |
| **Verifica Generale** | Ogni 12 anni | Revisione completa, collaudo, dichiarazione conformità |

### Cicli di Prova

- **Prova di Funzionalità**: Verifica che il dispositivo risponda correttamente agli stimoli
- **Prova di Efficacia**: Verifica che il dispositivo svolga la funzione per cui è installato
- **Prova Complessiva**: Verifica dell'integrazione con l'intero sistema

### Copertura Annuale

La norma richiede che entro il ciclo annuale venga testato il 100% dei dispositivi:
- Semestre 1: minimo 50%
- Semestre 2: completamento al 100%

Il sistema traccia automaticamente la percentuale di copertura.

## Struttura Database

### Tabelle Principali

- **clienti**: Anagrafica clienti
- **sedi**: Sedie/impianti del cliente
- **centrali**: Centrali antincendio
- **dispositivi**: Rilevatori, pulsanti, sirene, ecc.
- **piani_manutenzione**: Pianificazione interventi
- **verifiche_punto**: Verifiche su ogni singolo punto
- **non_conformita**: Gestione anomalie
- **registro_antincendio**: Registro digitale obbligatorio
- **verbali**: Verbali PDF generati
- **tecnici**: Anagrafica tecnici
- **sync_log**: Log sincronizzazione offline

### View

- **copertura_ciclo**: Percentuale copertura annuale per centrale
- **scadenze_imminenti**: Interventi nei prossimi 30 giorni

## API Endpoints

### Anagrafica

```
GET    /api/clienti          # Lista clienti
POST   /api/clienti/save     # Crea/modifica cliente
GET    /api/sedi            # Lista sedi
POST   /api/sedi/save       # Crea/modifica sede
GET    /api/centrali         # Lista centrali
POST   /api/centrali/save   # Crea/modifica centrale
GET    /api/dispositivi     # Lista dispositivi
POST   /api/dispositivi/save # Crea/modifica dispositivo
```

### Interventi

```
GET    /api/interventi       # Lista interventi
GET    /api/verbali        # Lista verbali
POST   /api/verifiche/save # Salva verifiche
POST   /api/verbali/generate # Genera PDF verbale
GET    /api/verbali/:id/download # Scarica PDF
GET    /api/nc            # Lista non conformità
```

### Dashboard

```
GET    /api/scadenze       # Scadenze imminenti
GET    /api/statistiche   # Statistiche globali
GET    /api/copertura    # Copertura ciclo annuale
GET    /api/dispositivi/:centraleId # Dispositivi centrale
```

## Sviluppo

### Comandi

```bash
npm run dev       # Avvia frontend in dev mode
npm run build    # Build per produzione
npm run preview # Preview build locale
npm run server  # Avvia solo backend
```

### Aggiungi dati di test

```sql
-- Esempio: Inserisci cliente
INSERT INTO clienti (ragione_sociale, partita_iva, città)
VALUES ('Acme Corp', '01234567890', 'Roma');

-- Esempio: Inserisci centrale
INSERT INTO centrali (sede_id, marca, modello, anno_installazione, centrale_tipologia)
VALUES (1, 'Simpson', 'DX-2000', 2020, 'indirizzata');

-- Esempio: Inserisci dispositivo
INSERT INTO dispositivi (centrale_id, dispositivo_tipo, indirizzo_centrale, zona, piano)
VALUES (1, 'rilevatore_fumo', '001', 'Piano Terra - Ufficio', 'T');
```

## PWA - Installazione

L'app è installabile come applicazione mobile:

1. Apri http://localhost:3000 su Chrome/Safari
2. Menu → Installa app / Aggiungi alla schermata Home

Funziona offline e sincronizza quando ritorna la connessione.

## License

ISC

## Autori

Sistema sviluppato in conformità alle normative tecniche italiane vigenti.