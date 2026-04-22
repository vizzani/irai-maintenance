import supabase from './supabase.js';

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('piani_manutenzione')
      .select('*, centrali(marca, modello), sedi(nome_sede)')
      .order('data_prevista', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}