import supabase from './supabase.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'POST') {
    const { action, email } = req.body;

    if (action === 'reset_password') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.SITE_URL || 'https://irai-maintenance.vercel.app'}/update-password`
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}