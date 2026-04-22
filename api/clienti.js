import supabase from './supabase.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('clienti')
        .select('*')
        .eq('active', true)
        .order('ragione_sociale');
      
      if (error) throw error;
      return res.json(data);
    }

    if (method === 'POST') {
      const { ragione_sociale, partita_iva, indirizzo, città, provincia, telefono, email } = req.body;
      
      const { data, error } = await supabase
        .from('clienti')
        .insert([{ ragione_sociale, partita_iva, indirizzo, città, provincia, telefono, email }])
        .select()
        .single();
      
      if (error) throw error;
      return res.json({ success: true, id: data.id });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Errore:', err);
    res.status(500).json({ error: err.message });
  }
}