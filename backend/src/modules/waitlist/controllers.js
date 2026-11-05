const crypto = require('crypto');
const { z } = require('zod');
const { supabase } = require('../../config/supabase');

const WAITLIST_STATUS = ['pending', 'selected', 'rejected', 'invited', 'accepted', 'declined'];
const ALLOWED_TRANSITIONS = {
  pending: ['selected', 'rejected'],
  selected: ['rejected'],
  invited: ['accepted', 'declined'],
  rejected: [],
  accepted: [],
  declined: []
};

const isSupabaseReady = () => {
  return Boolean(
    supabase &&
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_URL.includes('dummy-creatorshq')
  );
};

const unavailableWaitlistError = () => Object.assign(
  new Error('Waitlist storage is temporarily unavailable. Please try again later.'),
  { status: 503 }
);

const requireSupabase = () => {
  if (!isSupabaseReady()) throw unavailableWaitlistError();
  return supabase;
};

const handleWaitlistError = (error, res, next) => {
  if (!isSupabaseReady() || error?.code?.startsWith('PGRST')) {
    return res.status(503).json({
      success: false,
      message: 'Waitlist storage is temporarily unavailable. Please try again later.'
    });
  }
  return next(error);
};

const normalizeStatus = (status) => String(status || 'pending').trim().toLowerCase();
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const optionalUrlSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return '';
  return String(value).trim();
}, z.string().refine((value) => !value || /^https?:\/\//i.test(value), {
  message: 'Please enter a valid URL.'
}));

const applicationSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required.').max(120),
  email: z.string().trim().email('Please enter a valid email address.'),
  instagram_url: optionalUrlSchema,
  youtube_url: optionalUrlSchema.optional().or(z.literal('')),
  other_social_url: optionalUrlSchema.optional().or(z.literal('')),
  creator_niche: z.string().trim().min(2, 'Creator niche is required.').max(120),
  follower_count: z.string().trim().min(1, 'Follower count is required.').max(80),
  introduction: z.string().trim().min(20, 'Please share a bit more about yourself.').max(2000),
  reason_for_testing: z.string().trim().min(20, 'Please tell us why you want to test the platform.').max(2000)
});

const statusSchema = z.object({
  status: z.enum(WAITLIST_STATUS)
});

const inviteSchema = z.object({
  id: z.string().uuid(),
  forceEmail: z.boolean().optional()
});

const acceptSchema = z.object({
  token: z.string().min(32, 'Invitation token is required.'),
  email: z.string().trim().email('Please provide a valid email address.').optional()
});

const normalizeApplication = (payload) => ({
  full_name: String(payload.full_name || '').trim(),
  email: String(payload.email || '').trim().toLowerCase(),
  instagram_url: String(payload.instagram_url || '').trim(),
  youtube_url: String(payload.youtube_url || '').trim(),
  other_social_url: String(payload.other_social_url || '').trim(),
  creator_niche: String(payload.creator_niche || '').trim(),
  follower_count: String(payload.follower_count || '').trim(),
  introduction: String(payload.introduction || '').trim(),
  reason_for_testing: String(payload.reason_for_testing || '').trim()
});

const listWaitlistRecords = async () => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('creator_waitlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const findWaitlistRecordById = async (id) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('creator_waitlist')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

const findWaitlistRecordByEmail = async (email) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('creator_waitlist')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length ? data[0] : null;
};

const findWaitlistRecordByInvitationHash = async (tokenHash) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('creator_waitlist')
    .select('*')
    .eq('invitation_token_hash', tokenHash)
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

const upsertWaitlistRecord = async (record) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('creator_waitlist')
    .upsert(record, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

const acceptWaitlistRecord = async (application, tokenHash, acceptedAt) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('creator_waitlist')
    .update({
      status: 'accepted',
      accepted_at: acceptedAt,
      invitation_token_hash: null,
      invitation_expires_at: null,
      updated_at: acceptedAt
    })
    .eq('id', application.id)
    .eq('status', 'invited')
    .eq('invitation_token_hash', tokenHash)
    .gt('invitation_expires_at', acceptedAt)
    .select('status, accepted_at')
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

const summaryFromRecords = (records) => {
  const summary = {
    total: records.length,
    pending: 0,
    selected: 0,
    invited: 0,
    accepted: 0,
    rejected: 0,
    declined: 0
  };

  for (const record of records) {
    const normalized = normalizeStatus(record.status);
    summary[normalized] = (summary[normalized] || 0) + 1;
  }

  return summary;
};

const sendInvitationEmail = async (application, token) => {
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const resendKey = process.env.RESEND_API_KEY;

  if (!smtpHost && !resendKey) {
    return { sent: false, message: 'Email delivery is not configured for invitations.' };
  }

  try {
    if (resendKey) {
      const { Resend } = await import('resend');
      const emailClient = new Resend(resendKey);
      const { data, error } = await emailClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@creatorshq.app',
        to: application.email,
        subject: 'CreatorsHQ Beta invitation',
        html: `
          <p>Hello ${application.full_name},</p>
          <p>You have been selected for the CreatorsHQ beta waitlist.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/waitlist/accept?token=${encodeURIComponent(token)}">Accept your invitation</a></p>
        `
      });
      if (error || !data?.id) {
        if (error) console.error('[WAITLIST RESEND ERROR]', error);
        return { sent: false, message: 'Invitation created but email delivery failed. Please retry from the admin dashboard.' };
      }
      return { sent: true, message: 'Invitation email sent successfully.' };
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined
    });

    const delivery = await transporter.sendMail({
      from: process.env.EMAIL_FROM || smtpUser,
      to: application.email,
      subject: 'CreatorsHQ Beta invitation',
      html: `<p>Hello ${application.full_name},</p><p>You have been selected to try CreatorsHQ.</p><p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/waitlist/accept?token=${encodeURIComponent(token)}">Accept your invitation</a></p>`
    });

    const acceptedRecipient = (delivery.accepted || []).some(
      (recipient) => String(recipient).toLowerCase() === application.email.toLowerCase()
    );
    if (!acceptedRecipient) {
      return { sent: false, message: 'Invitation created but email delivery failed. Please retry from the admin dashboard.' };
    }

    return { sent: true, message: 'Invitation email sent successfully.' };
  } catch (error) {
    console.error('[WAITLIST EMAIL ERROR]', error);
    return { sent: false, message: 'Invitation created but email delivery failed. Please retry from the admin dashboard.' };
  }
};

const apply = async (req, res, next) => {
  try {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'request',
          message: issue.message
        }))
      });
    }

    const application = normalizeApplication(parsed.data);
    const existing = await findWaitlistRecordByEmail(application.email);
    if (existing && !['rejected', 'declined'].includes(normalizeStatus(existing.status))) {
      return res.status(409).json({
        success: false,
        message: 'A beta application already exists for this email address.'
      });
    }

    const record = {
      id: crypto.randomUUID(),
      ...application,
      status: 'pending',
      invitation_token_hash: null,
      invitation_expires_at: null,
      invited_at: null,
      accepted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let saved;
    try {
      saved = await upsertWaitlistRecord(record);
    } catch (error) {
      if (error?.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'A beta application already exists for this email address.'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Your beta application has been submitted successfully.',
      data: {
        id: saved.id,
        status: saved.status,
        created_at: saved.created_at
      }
    });
  } catch (error) {
    handleWaitlistError(error, res, next);
  }
};

const listAdminWaitlist = async (req, res, next) => {
  try {
    const records = await listWaitlistRecords();
    res.json({
      success: true,
      data: records,
      summary: summaryFromRecords(records)
    });
  } catch (error) {
    handleWaitlistError(error, res, next);
  }
};

const updateWaitlistStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.',
        errors: parsed.error.issues
      });
    }

    const targetStatus = parsed.data.status;
    const current = await findWaitlistRecordById(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const currentStatus = normalizeStatus(current.status);
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status transition from ${currentStatus} to ${targetStatus} is not allowed.`
      });
    }

    const nextRecord = { ...current, status: targetStatus, updated_at: new Date().toISOString() };
    if (targetStatus === 'invited') {
      nextRecord.invited_at = new Date().toISOString();
    }
    if (targetStatus === 'accepted') {
      nextRecord.accepted_at = new Date().toISOString();
    }

    const saved = await upsertWaitlistRecord(nextRecord);
    res.json({
      success: true,
      message: `Application status updated to ${targetStatus}.`,
      data: saved
    });
  } catch (error) {
    handleWaitlistError(error, res, next);
  }
};

const createInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = inviteSchema.safeParse({ id, forceEmail: req.body?.forceEmail ?? false });
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid invitation request.', errors: parsed.error.issues });
    }

    const application = await findWaitlistRecordById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const currentStatus = normalizeStatus(application.status);
    const invitationExpired = currentStatus === 'invited'
      && application.invitation_expires_at
      && new Date(application.invitation_expires_at).getTime() <= Date.now();
    if (currentStatus !== 'selected' && !invitationExpired) {
      return res.status(400).json({ success: false, message: 'Only selected creators or creators with expired invitations can receive an invitation.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString();
    const invitationTokenHash = hashToken(token);
    const updatedRecord = {
      ...application,
      status: 'invited',
      invitation_token_hash: invitationTokenHash,
      invitation_expires_at: expiresAt,
      invited_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saved = await upsertWaitlistRecord(updatedRecord);
    const emailResult = await sendInvitationEmail(saved, token);

    if (!emailResult.sent) {
      try {
        await upsertWaitlistRecord({
          ...saved,
          status: 'selected',
          invitation_token_hash: null,
          invitation_expires_at: null,
          invited_at: null,
          updated_at: new Date().toISOString()
        });
      } catch (rollbackError) {
        console.error('[WAITLIST INVITATION ROLLBACK ERROR]', rollbackError);
        return res.status(502).json({
          success: false,
          message: 'Email delivery failed and the invitation could not be reset. Please contact support.'
        });
      }

      return res.status(502).json({
        success: false,
        message: emailResult.message
      });
    }

    res.status(emailResult.sent ? 200 : 502).json({
      success: true,
      message: emailResult.message,
      data: {
        ...saved,
        emailSent: true,
        invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/waitlist/accept?token=${encodeURIComponent(token)}`
      }
    });
  } catch (error) {
    handleWaitlistError(error, res, next);
  }
};

const acceptInvitation = async (req, res, next) => {
  try {
    const parsed = acceptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is invalid.',
        errors: parsed.error.issues.map((issue) => ({ field: issue.path.join('.') || 'request', message: issue.message }))
      });
    }

    const token = parsed.data.token;
    const tokenHash = hashToken(token);
    const application = await findWaitlistRecordByInvitationHash(tokenHash);

    if (!application) {
      return res.status(401).json({ success: false, message: 'Invalid or expired invitation token.' });
    }

    if (parsed.data.email && application.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This invitation does not match the provided account email.' });
    }

    if (normalizeStatus(application.status) !== 'invited') {
      return res.status(409).json({ success: false, message: 'This invitation has already been used or is no longer valid.' });
    }

    const expiresAt = application.invitation_expires_at ? new Date(application.invitation_expires_at) : null;
    if (!expiresAt || expiresAt.getTime() <= Date.now()) {
      return res.status(410).json({ success: false, message: 'This invitation has expired.' });
    }

    if (req.user && req.user.email && application.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to accept this invitation.' });
    }

    const acceptedAt = new Date().toISOString();
    const saved = await acceptWaitlistRecord(application, tokenHash, acceptedAt);
    if (!saved) {
      return res.status(409).json({
        success: false,
        message: 'This invitation has already been used or is no longer valid.'
      });
    }

    res.json({
      success: true,
      message: 'Invitation accepted successfully.',
      data: {
        status: saved.status,
        accepted_at: saved.accepted_at
      }
    });
  } catch (error) {
    handleWaitlistError(error, res, next);
  }
};

module.exports = {
  apply,
  listAdminWaitlist,
  updateWaitlistStatus,
  createInvitation,
  acceptInvitation,
  WAITLIST_STATUS,
  summaryFromRecords,
  findWaitlistRecordByEmail
};
