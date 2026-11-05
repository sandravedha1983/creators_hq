const { supabase } = require('../../config/supabase');

const isSupabaseActive = () => {
  return supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq');
};

// In-memory store fallback if Supabase is offline
const memoryFeedback = [];

const submitFeedback = async (req, res, next) => {
  try {
    const { category = 'general', subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'subject and message are required' });
    }

    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: req.user ? req.user.id : null,
          user_email: req.user ? req.user.email : (req.body.email || ''),
          category,
          subject,
          message,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Feedback submitted successfully', data });
    }

    const item = {
      id: `fb_${Date.now()}`,
      user_id: req.user?.id || null,
      user_email: req.user?.email || req.body.email || '',
      category,
      subject,
      message,
      status: 'open',
      created_at: new Date()
    };
    memoryFeedback.push(item);
    res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: item });
  } catch (err) {
    next(err);
  }
};

const getAllFeedback = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          id,
          user_id,
          user_email,
          category,
          subject,
          message,
          status,
          created_at,
          user:user_id(name, email, avatar, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: data || [] });
    }

    res.json({ success: true, data: memoryFeedback });
  } catch (err) {
    next(err);
  }
};

const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'in_review', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return res.status(404).json({ success: false, message: 'Feedback not found' });
      return res.json({ success: true, data });
    }

    const item = memoryFeedback.find(f => f.id === id);
    if (!item) return res.status(404).json({ success: false, message: 'Feedback not found' });
    item.status = status;
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitFeedback, getAllFeedback, updateFeedbackStatus };
