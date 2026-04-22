import supabase from './supabase.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('sedi')
        .select('*')
        .eq('active', true)
        .order('nome_sede');
      
      if (error) throw error;
      return res.json(data);
    }

    if (method === 'POST') {
      const { cliente_id, nome_sede, indirizzo, città, livello_rischio, attività } = req.body;
      
      const { data, error } = await supabase
        .from('sedi')
        .insert([{ cliente_id, nome_sede, indirizzo, città, livello_rischio, attività }])
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