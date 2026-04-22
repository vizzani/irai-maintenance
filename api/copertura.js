import supabase from './supabase.js';

export default async function handler(req, res) {
  const { query } = req;
  const { centraleId } = query;

  try {
    let query = supabase.from('copertura_ciclo').select('*');

    if (centraleId) {
      query = query.eq('centrale_id', centraleId);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}