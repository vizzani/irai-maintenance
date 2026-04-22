import supabase from './supabase.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pianoId, centraleId, protocolloTipo, verifiche, savedAt, isOnline } = req.body;

    // Update piano status
    const { error: pianoError } = await supabase
      .from('piani_manutenzione')
      .update({ data_effettiva: new Date().toISOString(), stato: 'completato', updated_at: new Date().toISOString() })
      .eq('id', pianoId);

    if (pianoError) throw pianoError;

    // Insert verifiche per dispositivo
    for (const [dispositivoId, checks] of Object.entries(verifiche)) {
      for (const check of checks) {
        if (check.esito !== null && check.esito !== undefined) {
          const { error: insertError } = await supabase
            .from('verifiche_punto')
            .upsert({
              piano_id: pianoId,
              dispositivo_id: parseInt(dispositivoId),
              punto_norma: check.puntoCodice,
              tipologia_prova: check.tipologia,
              esito: check.esito,
              valore_rilevato: check.valoreRilevato,
              note: check.note,
              ora_inizio: check.oraInizio || new Date().toISOString(),
              ora_fine: check.oraFine || new Date().toISOString()
            }, {
              onConflict: 'piano_id,dispositivo_id,punto_norma'
            });

          if (insertError) throw insertError;

          // Create NC if not conforme
          if (!check.esito) {
            await supabase.from('non_conformita').insert([{
              dispositivo_id: parseInt(dispositivoId),
              nc_tipo: 'anomalia',
              gravità: 'media',
              descrizione: `Punto ${check.puntoCodice}: ${check.puntoDescrizione} - ${check.note || 'Non conforme'}`,
              stato: 'aperta',
              data_apertura: new Date().toISOString()
            }]);
          }
        }
      }
    }

    res.json({ success: true, message: 'Verifiche salvate con successo' });
  } catch (err) {
    console.error('Errore salvataggio:', err);
    res.status(500).json({ error: err.message });
  }
}