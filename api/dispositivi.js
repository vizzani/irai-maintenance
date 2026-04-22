import supabase from './supabase.js';

export default async function handler(req, res) {
  const { method, query } = req;
  const { centraleId } = query;

  try {
    if (method === 'GET') {
      let query = supabase
        .from('dispositivi')
        .select('id, dispositivo_tipo, indirizzo_centrale, zona, posizione, piano, stato')
        .eq('active', true)
        .order('indirizzo_centrale');

      if (centraleId) {
        query = query.eq('centrale_id', centraleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json(data);
    }

    if (method === 'POST') {
      const { centrale_id, dispositivo_tipo, indirizzo_centrale, zona, posizione, piano, marca, modello } = req.body;
      
      const { data, error } = await supabase
        .from('dispositivi')
        .insert([{ centrale_id, dispositivo_tipo, indirizzo_centrale, zona, posizione, piano, marca, modello, stato: 'attivo' }])
        .select()
        .single();
      
      if (error) throw error;
      return res.json({ success: true, id: data.id });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}