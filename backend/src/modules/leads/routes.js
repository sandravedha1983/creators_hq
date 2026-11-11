const express = require('express');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = req.supabase
      .from('leads')
      .select('*')
      .eq('user_id', req.user.id);

    if (status && status !== 'all') query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);

    const { data: leads, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, data: leads || [] });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, company, status, value, notes, source } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Lead name is required' });

    const { data: lead, error } = await req.supabase
      .from('leads')
      .insert({
        user_id: req.user.id,
        name,
        email: email || '',
        phone: phone || '',
        company: company || '',
        status: status || 'Warm',
        value: value || '',
        notes: notes || '',
        source: source || 'manual'
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ success: true, data: lead });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'phone', 'company', 'status', 'value', 'notes', 'source'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const { data: lead, error } = await req.supabase
      .from('leads')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    return res.json({ success: true, data: lead });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { data: lead, error } = await req.supabase
      .from('leads')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    return res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
