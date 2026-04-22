const express = require('express');
const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const multer = require('multer');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/irai_db',
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/verifiche/save', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { pianoId, centraleId, protocolloTipo, verifiche, savedAt, isOnline } = req.body;
    
    const pianoUpdate = await client.query(
      `UPDATE piani_manutenzione 
       SET data_effettiva = $1, stato = 'completato', updated_at = NOW()
       WHERE id = $2`,
      [new Date(), pianoId]
    );
    
    for (const [dispositivoId, checks] of Object.entries(verifiche)) {
      for (const check of checks) {
        if (check.esito !== null) {
          await client.query(
            `INSERT INTO verifiche_punto 
             (piano_id, dispositivo_id, punto_norma, tipologia_prova, esito, valore_rilevato, note, ora_inizio, ora_fine, foto_prima, foto_dopo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (piano_id, dispositivo_id, punto_norma) 
             DO UPDATE SET esito = $5, valore_rilevato = $6, note = $7, ora_fine = $9, foto_dopo = $11`,
            [
              pianoId, dispositivoId, check.puntoCodice, check.tipologia,
              check.esito, check.valoreRilevato, check.note,
              check.oraInizio || new Date(), check.oraFine || new Date(),
              check.fotoPrima ? Buffer.from(check.fotoPrima.split(',')[1], 'base64') : null,
              check.fotoDopo ? Buffer.from(check.fotoDopo.split(',')[1], 'base64') : null
            ]
          );
          
          if (!check.esito) {
            await client.query(
              `INSERT INTO non_conformita (dispositivo_id, nc_tipo, gravità, descrizione, stato, data_apertura)
               VALUES ($1, 'anomalia', 'media', $2, 'aperta', NOW())`,
              [dispositivoId, `Punto ${check.puntoCodice}: ${check.puntoDescrizione} - ${check.note || 'Non conforme'}`]
            );
          }
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Verifiche salvate con successo' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Errore salvataggio verifiche:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/verbali/generate', async (req, res) => {
  const client = await pool.connect();
  try {
    const { pianoId, centraleId, protocolloTipo, protocolloLabel, verifiche, dataVerifica } = req.body;
    
    const result = await pool.query(
      `SELECT c.marca, c.modello, c.numero_serie, s.nome_sede, s.indirizzo, s.città,
              cli.ragione_sociale, cli.partita_iva
       FROM centrali c
       JOIN sedi s ON s.id = c.sede_id
       JOIN clienti cli ON cli.id = s.cliente_id
       WHERE c.id = $1`,
      [centraleId]
    );
    
    const info = result.rows[0];
    let totali = 0, conformi = 0, nonConformi = 0;
    
    for (const [, checks] of Object.entries(verifiche)) {
      for (const check of checks) {
        totali++;
        if (check.esito === true) conformi++;
        else if (check.esito === false) nonConformi++;
      }
    }
    
    const percConformità = totali > 0 ? Math.round((conformi / totali) * 100) : 0;
    const numeroVerbale = `VG-${centraleId}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${numeroVerbale}.pdf"`);
      res.send(buffer);
    });
    
    doc.fontSize(18).font('Helvetica-Bold').text('VERIFICA MANUTENZIONE IMPIANTO ANTINCENDIO', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Verbale n. ${numeroVerbale}`, { align: 'center' });
    doc.fontSize(10).text(`Data: ${new Date().toLocaleDateString('it-IT')}`, { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(11).font('Helvetica-Bold').text('DATI IMPIANTO');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Cliente: ${info.ragione_sociale}`);
    doc.text(`P.IVA: ${info.partita_iva}`);
    doc.text(`Sede: ${info.nome_sede} - ${info.indirizzo}, ${info.città}`);
    doc.text(`Centrale: ${info.marca} ${info.modello} (S/N: ${info.numero_serie})`);
    doc.text(`Protocollo: ${protocolloLabel}`);
    doc.moveDown();
    
    doc.fontSize(11).font('Helvetica-Bold').text('RISULTATI VERIFICHE');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Punti verificati: ${totali}`);
    doc.text(`Conformi: ${conformi}`);
    doc.text(`Non conformi: ${nonConformi}`);
    doc.text(`Percentuale conformità: ${percConformità}%`);
    doc.moveDown();
    
    doc.fontSize(11).font('Helvetica-Bold').text('DETTAGLIO VERIFICHE');
    let y = doc.y;
    
    for (const [dispositivoId, checks] of Object.entries(verifiche)) {
      const devRes = await pool.query(
        `SELECT indirizzo_centrale, zona, posizione FROM dispositivi WHERE id = $1`,
        [dispositivoId]
      );
      const dev = devRes.rows[0];
      
      doc.fontSize(9).font('Helvetica-Bold').text(`Dispositivo: [${dev.indirizzo_centrale}] ${dev.zona}`);
      doc.font('Helvetica').fontSize(8);
      
      for (const check of checks) {
        if (check.puntoCodice) {
          const status = check.esito === true ? '✓ CONFORME' : check.esito === false ? '✗ NON CONFORME' : '-';
          doc.text(`  ${check.puntoCodice} - ${check.puntoDescrizione.substring(0, 40)}: ${status}`);
        }
      }
      doc.moveDown(0.5);
    }
    
    doc.moveDown(2);
    doc.fontSize(10).text('Firma del tecnico:', 50, doc.y);
    doc.moveDown(2);
    doc.fontSize(8).text('_________________________', 50, doc.y);
    doc.text('Il tecnico abilitato');
    
    const pageHeight = doc.page.height;
    doc.fontSize(7).text(
      `Documento generato automaticamente - Sistema IRAI - UNI 11224:2019/2021`,
      50, pageHeight - 50,
      { align: 'center', width: 500 }
    );
    
    await pool.query(
      `INSERT INTO verbali (piano_id, centrale_id, numero_verbale, data_verifica, protocollo_tipo, totali_punti, punti_conformi, perc_conformità)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [pianoId, centraleId, numeroVerbale, new Date(), protocolloTipo, totali, conformi, percConformità]
    );
    
    doc.end();
  } catch (err) {
    console.error('Errore generazione verbale:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/copertura/:centraleId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM copertura_ciclo WHERE centrale_id = $1`,
      [req.params.centraleId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/scadenze', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM scadenze_imminenti`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dispositivi/:centraleId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, dispositivo_tipo, indirizzo_centrale, zona, posizione, piano, stato 
       FROM dispositivi WHERE centrale_id = $1 AND active = TRUE ORDER BY indirizzo_centrale`,
      [req.params.centraleId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/registro/:sedeId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM registro_antincendio WHERE sede_id = $1 AND deleted_at IS NULL ORDER BY data_intervento DESC`,
      [req.params.sedeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clienti', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM clienti WHERE active = TRUE ORDER BY ragione_sociale`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clienti/save', async (req, res) => {
  try {
    const { ragione_sociale, partita_iva, indirizzo, città, provincia, telefono, email } = req.body;
    const result = await pool.query(
      `INSERT INTO clienti (ragione_sociale, partita_iva, indirizzo, città, provincia, telefono, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [ragione_sociale, partita_iva, indirizzo, città, provincia, telefono, email]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sedi', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM sedi WHERE active = TRUE ORDER BY nome_sede`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sedi/save', async (req, res) => {
  try {
    const { cliente_id, nome_sede, indirizzo, città, livello_rischio, attività } = req.body;
    const result = await pool.query(
      `INSERT INTO sedi (cliente_id, nome_sede, indirizzo, città, livello_rischio, attività)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [cliente_id, nome_sede, indirizzo, città, livello_rischio, attività]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/centrali', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM centrali WHERE active = TRUE ORDER BY marca, modello`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/centrali/save', async (req, res) => {
  try {
    const { sede_id, marca, modello, numero_serie, anno_installazione, centrale_tipologia } = req.body;
    const result = await pool.query(
      `INSERT INTO centrali (sede_id, marca, modello, numero_serie, anno_installazione, centrale_tipologia)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [sede_id, marca, modello, numero_serie, anno_installazione, centrale_tipologia]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dispositivi', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM dispositivi WHERE active = TRUE ORDER BY indirizzo_centrale`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dispositivi/save', async (req, res) => {
  try {
    const { centrale_id, dispositivo_tipo, indirizzo_centrale, zona, posizione, piano, marca, modello } = req.body;
    const result = await pool.query(
      `INSERT INTO dispositivi (centrale_id, dispositivo_tipo, indirizzo_centrale, zona, posizione, piano, marca, modello, stato)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'attivo') RETURNING id`,
      [centrale_id, dispositivo_tipo, indirizzo_centrale, zona, posizione, piano, marca, modello]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/interventi', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pm.*, c.marca, c.modello, s.nome_sede
       FROM piani_manutenzione pm
       JOIN centrali c ON c.id = pm.centrale_id
       JOIN sedi s ON s.id = c.sede_id
       ORDER BY pm.data_prevista DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/verbali', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM verbali ORDER BY data_verifica DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/verbali/:id/download', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM verbali WHERE id = $1`, [req.params.id]);
    const v = result.rows[0];
    
    if (!v) return res.status(404).json({ error: 'Verbale non trovato' });
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${v.numero_verbale}.pdf"`);
      res.send(Buffer.concat(chunks));
    });
    
    doc.fontSize(18).font('Helvetica-Bold').text('VERBALE DI MANUTENZIONE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N. ${v.numero_verbale}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(10).text(`Protocollo: ${v.protocollo_tipo}`);
    doc.text(`Data verifica: ${v.data_verifica}`);
    doc.text(`Conformità: ${v.perc_conformità}%`);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/nc', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM non_conformita ORDER BY data_apertura DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/statistiche', async (req, res) => {
  try {
    const [centrali, scadenze, nc, conformità] = await Promise.all([
      pool.query(`SELECT COUNT(*) as totale FROM centrali WHERE active = TRUE`),
      pool.query(`SELECT COUNT(*) as totale FROM piani_manutenzione WHERE data_prevista <= NOW() + INTERVAL '30 days' AND stato != 'completato'`),
      pool.query(`SELECT COUNT(*) as totale FROM non_conformita WHERE stato NOT IN ('risolta', 'chiusa')`),
      pool.query(`SELECT AVG(perc_conformità) as media FROM verbali WHERE data_verifica >= NOW() - INTERVAL '1 year'`)
    ]);
    
    res.json({
      totaleCentrali: parseInt(centrali.rows[0].totale) || 0,
      scadenze30gg: parseInt(scadenze.rows[0].totale) || 0,
      ncAperte: parseInt(nc.rows[0].totale) || 0,
      conformitaMedia: Math.round(parseFloat(conformità.rows[0].media) || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/copertura', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM copertura_ciclo`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server IRAI running on port ${PORT}`);
});

module.exports = app;