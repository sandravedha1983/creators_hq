const express = require('express');
const router = express.Router();
const Lead = require('./models');
const { authenticate } = require('../../middleware/auth');
const { supabase } = require('../../config/supabase');

const isSupabaseActive = () => {
  return supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq');
};

// All lead routes require authentication — leads are per-user
router.use(authenticate);

// ─── Get all leads for authenticated user ─────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;

    if (isSupabaseActive()) {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', req.user.id);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data: leads, error } = await query;
      if (error) throw error;
      return res.json({ success: true, data: leads || [] });
    }

    // MongoDB Fallback
    const query = { user_id: req.user.id };
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    next(err);
  }
});

// ─── Create a lead ────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, company, status, value, notes, source } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Lead name is required' });

    if (isSupabaseActive()) {
      const { data: lead, error } = await supabase
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
    }

    // MongoDB Fallback
    const lead = await Lead.create({
      user_id: req.user.id,
      name,
      email: email || '',
      phone: phone || '',
      company: company || '',
      status: status || 'Warm',
      value: value || '',
      notes: notes || '',
      source: source || 'manual'
    });

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
});

// ─── Update a lead ────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'phone', 'company', 'status', 'value', 'notes', 'source'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (isSupabaseActive()) {
      const { data: lead, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error || !lead) return res.status(404).json({ success: false, message: 'Lead not found' });
      return res.json({ success: true, data: lead });
    }

    // MongoDB Fallback
    const lead = await Lead.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    allowed.forEach(field => {
      if (req.body[field] !== undefined) lead[field] = req.body[field];
    });

    await lead.save();
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
});

// ─── Delete a lead ────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

      if (error) throw error;
      return res.json({ success: true, message: 'Lead deleted' });
    }

    // MongoDB Fallback
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
