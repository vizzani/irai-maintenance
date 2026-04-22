import supabase from './supabase.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('centrali')
        .select('*')
        .eq('active', true)
        .order('marca', { ascending: true });
      
      if (error) throw error;
      return res.json(data);
    }

    if (method === 'POST') {
      const { sede_id, marca, modello, numero_serie, anno_installazione, centrale_tipologia } = req.body;
      
      const { data, error } = await supabase
        .from('centrali')
        .insert([{ sede_id, marca, modello, numero_serie, anno_installazione, centrale_tipologia }])
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