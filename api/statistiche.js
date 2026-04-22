import supabase from './supabase.js';

export default async function handler(req, res) {
  try {
    const [centrali, scadenze, nc, conformità] = await Promise.all([
      supabase.from('centrali').select('id', { count: 'exact', head: true }),
      supabase.from('piani_manutenzione').select('id', { count: 'exact', head: true }).lte('data_prevista', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()).neq('stato', 'completato'),
      supabase.from('non_conformita').select('id', { count: 'exact', head: true }).not('stato', 'in', ['risolta', 'chiusa']),
      supabase.from('verbali').select('perc_conformità').gte('data_verifica', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const avgConformità = conformità.data?.length 
      ? conformità.data.reduce((a, b) => a + (b.perc_conformità || 0), 0) / conformità.data.length 
      : 0;

    res.json({
      totaleCentrali: centrali.count || 0,
      scadenze30gg: scadenze.count || 0,
      ncAperte: nc.count || 0,
      conformitaMedia: Math.round(avgConformità)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}