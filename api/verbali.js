import supabase from './supabase.js';

export default async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  try {
    if (method === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('verbali')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return res.json(data);
      }

      const { data, error } = await supabase
        .from('verbali')
        .select('*')
        .order('data_verifica', { ascending: false });

      if (error) throw error;
      return res.json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}