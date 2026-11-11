const { requestSchema } = require('./validations');
const { createNotification } = require('../notifications/controllers');

const getMyCollaborations = async (req, res, next) => {
  try {
      const { data, error } = await req.supabase
        .from('collaborations')
        .select(`
          id,
          message,
          status,
          created_at,
          updated_at,
          sender:sender_id(id, name, email, avatar, role),
          receiver:receiver_id(id, name, email, avatar, role)
        `)
        .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getByBrand = async (req, res, next) => {
  try {
    // IDOR Security Protection: Only owning brand or admin can query
    if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.brandId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these collaborations.' });
    }

      const { data, error } = await req.supabase
        .from('collaborations')
        .select(`
          id,
          message,
          status,
          created_at,
          receiver:receiver_id(id, name, email, avatar)
        `)
        .eq('sender_id', req.params.brandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getByCreator = async (req, res, next) => {
  try {
    // IDOR Security Protection: Only owning creator or admin can query
    if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.creatorId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these collaborations.' });
    }

      const { data, error } = await req.supabase
        .from('collaborations')
        .select(`
          id,
          message,
          status,
          created_at,
          sender:sender_id(id, name, email, avatar)
        `)
        .eq('receiver_id', req.params.creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const ALLOWED_STATUSES = ['pending', 'accepted', 'rejected', 'completed'];

const validateTransition = (currentStatus, targetStatus, { isSender, isReceiver, isAdmin }) => {
  // 1. Target status must be in allowed list
  if (!targetStatus || typeof targetStatus !== 'string' || !ALLOWED_STATUSES.includes(targetStatus)) {
    return {
      valid: false,
      code: 400,
      message: `Invalid status: "${targetStatus}". Allowed values: ${ALLOWED_STATUSES.join(', ')}`
    };
  }

  // 2. Admin can perform any authorized transition
  if (isAdmin) {
    return { valid: true };
  }

  // 3. Idempotent request (same status)
  if (currentStatus === targetStatus) {
    return { valid: true, isNoOp: true };
  }

  // 4. Transitions from 'pending'
  if (currentStatus === 'pending') {
    if (targetStatus === 'accepted' || targetStatus === 'rejected') {
      if (!isReceiver) {
        return {
          valid: false,
          code: 403,
          message: 'Only the receiver may accept or reject a pending collaboration request.'
        };
      }
      return { valid: true };
    }
    return {
      valid: false,
      code: 400,
      message: `Cannot transition collaboration from "${currentStatus}" to "${targetStatus}". Pending requests can only be accepted or rejected.`
    };
  }

  // 5. Transitions from 'accepted'
  if (currentStatus === 'accepted') {
    if (targetStatus === 'completed') {
      if (!isSender && !isReceiver) {
        return {
          valid: false,
          code: 403,
          message: 'Only collaboration participants may mark an accepted collaboration as completed.'
        };
      }
      return { valid: true };
    }
    return {
      valid: false,
      code: 400,
      message: `Cannot transition collaboration from "${currentStatus}" to "${targetStatus}". Accepted collaborations can only be marked as completed.`
    };
  }

  // 6. Terminal states ('rejected', 'completed')
  if (currentStatus === 'rejected' || currentStatus === 'completed') {
    return {
      valid: false,
      code: 400,
      message: `Collaboration is in terminal state "${currentStatus}" and cannot be transitioned.`
    };
  }

  return {
    valid: false,
    code: 400,
    message: `Unsupported status transition from "${currentStatus}" to "${targetStatus}".`
  };
};

const updateStatus = async (req, res, next) => {
  // Verify participant authority and the transition before the conditional update.
  try {
    // 1. Strictly extract only status from request body (never allow sender_id, receiver_id, or protected fields)
    const { status } = req.body || {};

    if (!status || typeof status !== 'string' || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

      const { data: collab, error: fetchErr } = await req.supabase
        .from('collaborations')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchErr || !collab) {
        return res.status(404).json({ success: false, message: 'Collaboration not found' });
      }

      const isSender = String(collab.sender_id) === String(req.user.id);
      const isReceiver = String(collab.receiver_id) === String(req.user.id);
      const isAdmin = req.user.role === 'admin';

      if (!isSender && !isReceiver && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this collaboration'
        });
      }

      const transitionCheck = validateTransition(collab.status, status, { isSender, isReceiver, isAdmin });
      if (!transitionCheck.valid) {
        return res.status(transitionCheck.code).json({
          success: false,
          message: transitionCheck.message
        });
      }

      if (transitionCheck.isNoOp) {
        return res.json({ success: true, data: collab });
      }

      // Concurrency protection: update only if status has not been modified by another concurrent request
      // and update ONLY the status field
      const { data: updated, error: updateErr } = await req.supabase
        .from('collaborations')
        .update({ status })
        .eq('id', req.params.id)
        .eq('status', collab.status)
        .select()
        .single();

      if (updateErr || !updated) {
        return res.status(409).json({
          success: false,
          message: 'Conflict: collaboration status was modified concurrently by another process.'
        });
      }

      // Notify the other party safely — do not fail the status update if notification delivery fails
      try {
        const targetUserId = String(collab.sender_id) === String(req.user.id) ? collab.receiver_id : collab.sender_id;
        await createNotification(
          targetUserId,
          'Collaboration Status Updated',
          `Your collaboration status has been updated to "${status}".`,
          'collaboration',
          '/collaborations'
        );
      } catch (notifErr) {
        console.error('[COLLABORATION NOTIFICATION ERROR]', notifErr?.message || notifErr);
      }

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const createRequest = async (req, res, next) => {
  try {
    const validatedData = requestSchema.parse(req.body);

      const { data: request, error } = await req.supabase
        .from('collaborations')
        .insert({
          sender_id: req.user.id,
          receiver_id: validatedData.receiver_id,
          message: validatedData.message
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger in-app notification for receiver
      try {
        await createNotification(
          validatedData.receiver_id,
          'New Collaboration Proposal',
          'You received a new collaboration proposal.',
          'collaboration',
          '/collaborations'
        );
      } catch (notificationError) {
        console.error('[COLLABORATION NOTIFICATION ERROR]', notificationError?.message || notificationError);
      }

    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyCollaborations, getByBrand, getByCreator, updateStatus, createRequest, validateTransition, ALLOWED_STATUSES };
