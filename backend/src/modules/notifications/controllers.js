const { supabase } = require('../../config/supabase');

const getNotifications = async (req, res, next) => {
  try {
    const { data: notifications, error } = await req.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const { count: unreadCount, error: countError } = await req.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('read', false);
    if (countError) throw countError;
    return res.json({ success: true, data: notifications || [], unreadCount: unreadCount || 0 });
  } catch (error) {
    return next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { data: notification, error } = await req.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, data: notification });
  } catch (error) {
    return next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const { error } = await req.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false);
    if (error) throw error;
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    return next(error);
  }
};

const createNotification = async (userId, title, message, type = 'system', link = '') => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type, link })
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
