const Notification = require('./models');
const { supabase } = require('../../config/supabase');

const isSupabaseActive = () => {
  return supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq');
};

const getNotifications = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const { count: unreadCount, error: countErr } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .eq('read', false);

      if (countErr) throw countErr;

      return res.json({ success: true, data: notifications || [], unreadCount: unreadCount || 0 });
    }

    // MongoDB Fallback
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user_id: req.user.id, read: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: notification, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error || !notification) return res.status(404).json({ success: false, message: 'Notification not found' });
      return res.json({ success: true, data: notification });
    }

    // MongoDB Fallback
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', req.user.id)
        .eq('read', false);

      if (error) throw error;
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    // MongoDB Fallback
    await Notification.updateMany({ user_id: req.user.id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

const createNotification = async (userId, title, message, type = 'system', link = '') => {
  try {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          link
        })
        .select()
        .single();
      if (error) console.error('[SUPABASE NOTIFICATION ERROR]', error.message);
      return data;
    }

    // MongoDB Fallback
    return await Notification.create({ user_id: userId, title, message, type, link });
  } catch (err) {
    console.error('[NOTIFICATION ERROR]', err.message);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
