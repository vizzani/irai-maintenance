import supabase from './supabase.js';

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('non_conformita')
      .select('*')
      .order('data_apertura', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}