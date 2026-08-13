const express = require('express');
const router = express.Router();
const Lead = require('./models');
const { authenticate } = require('../../middleware/auth');

// All lead routes require authentication — leads are per-user
router.use(authenticate);

// ─── Get all leads for authenticated user ─────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = { user_id: req.user.id };

    if (status) query.status = status;
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
    const lead = await Lead.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const allowed = ['name', 'email', 'phone', 'company', 'status', 'value', 'notes', 'source'];
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
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
