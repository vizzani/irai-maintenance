import supabase from './supabase.js';

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('scadenze_imminenti')
      .select('*')
      .order('data_prevista');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}