const crypto = require('crypto');
const path = require('path');
const { supabase } = require('../../config/supabase');
const { validateApplication, MAX_FILE_SIZE } = require('./screening');

const STORAGE_BUCKET = 'verification_docs';
const SIGNED_URL_SECONDS = 300;
const FILE_EXTENSIONS = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png'
};
const ACTIVE_STATUSES = ['pending', 'under_review', 'additional_information_required'];
const ALLOWED_DECISIONS = new Set([
  'under_review',
  'additional_information_required',
  'verified',
  'rejected',
  'suspended'
]);

const notifyUser = async (userId, title, message) => {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type: 'system',
    link: '/verify-account'
  });
  if (error) throw error;
};

const parseApplication = (body) => {
  if (!body.application) return body;
  if (typeof body.application !== 'string') return body.application;
  try {
    return JSON.parse(body.application);
  } catch {
    const error = new Error('application must contain valid JSON.');
    error.status = 400;
    throw error;
  }
};

const cleanupUploadedFiles = async (paths) => {
  if (!paths.length) return;
  const { error: documentError } = await supabase
    .from('verification_documents')
    .delete()
    .in('storage_path', paths);
  if (documentError) console.error('[VERIFICATION DOCUMENT CLEANUP ERROR]', documentError.message);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) console.error('[VERIFICATION FILE CLEANUP ERROR]', error.message);
};

const getStatus = async (req, res, next) => {
  try {
    const [{ data: profile, error: profileError }, { data: requests, error: requestError }] = await Promise.all([
      supabase.from('profiles')
        .select('verification_status, is_verified, is_suspended')
        .eq('id', req.user.id)
        .single(),
      supabase.from('verification_requests')
        .select('id, status, decision_reason, submitted_at, reviewed_at')
        .eq('user_id', req.user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
    ]);
    if (profileError) throw profileError;
    if (requestError) throw requestError;

    return res.json({
      success: true,
      data: {
        status: profile.verification_status,
        isVerified: profile.is_verified,
        isSuspended: profile.is_suspended,
        request: requests?.[0] || null
      }
    });
  } catch (error) {
    return next(error);
  }
};

const submitRequest = async (req, res, next) => {
  let requestId;
  let isNewRequest = false;
  const storagePaths = [];
  try {
    const files = req.files || [];
    if (!['creator', 'brand'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Creator and Brand accounts can submit verification.' });
    }
    if (files.some(file => file.size > MAX_FILE_SIZE)) {
      return res.status(400).json({ success: false, message: 'Each document must be no larger than 10 MB.' });
    }

    const application = parseApplication(req.body);
    if (!application || typeof application !== 'object' || Array.isArray(application)) {
      return res.status(400).json({ success: false, message: 'application must be a JSON object.' });
    }
    const screening = validateApplication(req.user.role, application, files);
    if (!screening.valid) {
      return res.status(400).json({
        success: false,
        message: 'Please correct the verification application.',
        errors: screening.errors
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('verification_status, is_verified, is_suspended')
      .eq('id', req.user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.is_suspended || profile.verification_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Suspended accounts cannot submit verification.' });
    }
    if (profile.is_verified || profile.verification_status === 'verified') {
      return res.status(409).json({ success: false, message: 'This account is already verified.' });
    }

    const { data: activeRequest, error: activeError } = await supabase
      .from('verification_requests')
      .select('id, status')
      .eq('user_id', req.user.id)
      .in('status', ACTIVE_STATUSES)
      .maybeSingle();
    if (activeError) throw activeError;
    if (activeRequest && activeRequest.status !== 'additional_information_required') {
      return res.status(409).json({
        success: false,
        message: 'A verification application is already being processed.',
        data: { requestId: activeRequest.id, status: activeRequest.status }
      });
    }

    if (req.user.role === 'brand' && screening.application.business_email) {
      const { data: duplicates, error: duplicateError } = await supabase
        .from('verification_requests')
        .select('id')
        .eq('account_role', 'brand')
        .neq('user_id', req.user.id)
        .filter('application_data->>business_email', 'eq', screening.application.business_email.trim().toLowerCase())
        .limit(1);
      if (duplicateError) throw duplicateError;
      if (duplicates?.length) screening.result.flags.push('business_email_used_by_another_account');
    }

    const submittedLinks = [
      screening.application.website,
      screening.application.portfolio,
      ...Object.values(screening.application.social_links || {})
    ].filter(Boolean);
    if (submittedLinks.length) {
      const { data: previousRequests, error: previousError } = await supabase
        .from('verification_requests')
        .select('user_id, application_data')
        .eq('account_role', req.user.role)
        .neq('user_id', req.user.id)
        .order('submitted_at', { ascending: false })
        .limit(200);
      if (previousError) throw previousError;
      const submittedSet = new Set(submittedLinks.map(link => link.toLowerCase()));
      const duplicateLinks = (previousRequests || []).some(previous => {
        const oldApplication = previous.application_data || {};
        const oldLinks = [
          oldApplication.website,
          oldApplication.portfolio,
          ...Object.values(oldApplication.social_links || {})
        ].filter(value => typeof value === 'string').map(value => value.toLowerCase());
        return oldLinks.some(link => submittedSet.has(link));
      });
      if (duplicateLinks) screening.result.flags.push('social_or_website_link_used_by_another_account');
    }

    requestId = activeRequest?.id || crypto.randomUUID();
    const requestPayload = {
      user_id: req.user.id,
      account_role: req.user.role,
      status: 'pending',
      application_data: screening.application,
      screening_result: screening.result,
      decision_reason: null,
      admin_notes: null,
      reviewer_id: null,
      reviewed_at: null,
      submitted_at: new Date().toISOString()
    };

    if (!activeRequest) {
      const { error } = await supabase.from('verification_requests').insert({ id: requestId, ...requestPayload });
      if (error) throw error;
      isNewRequest = true;
    }

    for (const file of files) {
      const suffix = crypto.randomUUID();
      const storagePath = `${req.user.id}/${requestId}/${suffix}${FILE_EXTENSIONS[file.mimetype]}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
      if (uploadError) throw uploadError;
      storagePaths.push(storagePath);
    }

    const documentRows = files.map((file, index) => ({
      request_id: requestId,
      user_id: req.user.id,
      storage_path: storagePaths[index],
      document_name: path.basename(file.originalname || 'supporting-document')
        .replace(/[\u0000-\u001f]/g, '')
        .slice(0, 180),
      content_type: file.mimetype,
      file_size: file.size,
      document_type: req.user.role === 'brand' ? 'business_registration' : 'supporting_evidence'
    }));
    const { error: documentsError } = await supabase.from('verification_documents').insert(documentRows);
    if (documentsError) throw documentsError;

    const { data: submitted, error: submissionError } = await supabase.rpc('record_verification_submission', {
      p_request_id: requestId,
      p_user_id: req.user.id,
      p_role: req.user.role,
      p_application_data: screening.application,
      p_screening_result: screening.result
    });
    if (submissionError) throw submissionError;

    let notificationDelivered = true;
    try {
      await notifyUser(req.user.id, 'Verification submitted', 'Your application was submitted and is awaiting Admin review.');
    } catch (notificationError) {
      notificationDelivered = false;
      console.error('[VERIFICATION NOTIFICATION ERROR]', notificationError.message || notificationError);
    }

    return res.status(activeRequest ? 200 : 201).json({
      success: true,
      message: 'Verification submitted. Automated screening does not approve accounts; an Admin decision is required.',
      data: { id: submitted.id, status: submitted.status, screening: screening.result },
      notificationDelivered
    });
  } catch (error) {
    await cleanupUploadedFiles(storagePaths);
    if (isNewRequest && requestId) {
      const { error: deleteError } = await supabase.from('verification_requests').delete().eq('id', requestId);
      if (deleteError) console.error('[VERIFICATION ROLLBACK ERROR]', deleteError.message);
    }
    return next(error);
  }
};

const listAdminRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const statuses = [
      'pending',
      'under_review',
      'additional_information_required',
      'verified',
      'rejected',
      'suspended'
    ];
    let query = supabase
      .from('verification_requests')
      .select('id, user_id, account_role, status, application_data, screening_result, decision_reason, submitted_at, reviewed_at', { count: 'exact' });

    if (req.query.status && statuses.includes(req.query.status)) query = query.eq('status', req.query.status);
    if (req.query.role && ['creator', 'brand'].includes(req.query.role)) query = query.eq('account_role', req.query.role);
    if (req.query.search) {
      const search = String(req.query.search).trim().replace(/[%_*(),]/g, ' ');
      if (search) query = query.or(
        `application_data->>full_name.ilike.%${search}%,application_data->>company_name.ilike.%${search}%,application_data->>business_email.ilike.%${search}%`
      );
    }

    const { data: requests, error, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const userIds = [...new Set((requests || []).map(request => request.user_id))];
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase.from('profiles').select('id, name, email, avatar, is_blocked, is_suspended').in('id', userIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const profileById = new Map((profiles || []).map(profile => [profile.id, profile]));

    return res.json({
      success: true,
      data: (requests || []).map(request => ({
        ...request,
        profile: profileById.get(request.user_id) || null
      })),
      pagination: { page, limit, total: count || 0 }
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminSummary = async (req, res, next) => {
  try {
    const statuses = [
      'pending',
      'under_review',
      'additional_information_required',
      'verified',
      'rejected',
      'suspended'
    ];
    const entries = await Promise.all(statuses.map(async status => {
      const { count, error } = await supabase
        .from('verification_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);
      if (error) throw error;
      return [status, count || 0];
    }));
    return res.json({ success: true, data: Object.fromEntries(entries) });
  } catch (error) {
    return next(error);
  }
};

const getAdminRequest = async (req, res, next) => {
  try {
    const { data: request, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;

    const [{ data: profile, error: profileError }, { data: documents, error: documentsError }, { data: history, error: historyError }] = await Promise.all([
      supabase.from('profiles')
        .select('id, name, email, role, avatar, is_verified, is_blocked, is_suspended, verification_status')
        .eq('id', request.user_id)
        .single(),
      supabase.from('verification_documents')
        .select('id, storage_path, document_name, content_type, file_size, document_type, created_at')
        .eq('request_id', request.id)
        .order('created_at', { ascending: true }),
      supabase.from('audit_logs')
        .select('id, actor_id, action, details, created_at')
        .eq('entity_type', 'verification_request')
        .eq('entity_id', request.id)
        .order('created_at', { ascending: true })
    ]);
    if (profileError) throw profileError;
    if (documentsError) throw documentsError;
    if (historyError) throw historyError;

    const documentsWithUrls = await Promise.all((documents || []).map(async document => {
      const { data, error: signedUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(document.storage_path, SIGNED_URL_SECONDS);
      if (signedUrlError) throw signedUrlError;
      return { ...document, signed_url: data.signedUrl };
    }));

    return res.json({
      success: true,
      data: { ...request, profile, documents: documentsWithUrls, history: history || [] }
    });
  } catch (error) {
    return next(error);
  }
};

const deleteAdminDocument = async (req, res, next) => {
  try {
    const { data: document, error: documentError } = await supabase
      .from('verification_documents')
      .select('id, user_id, request_id, storage_path, document_name')
      .eq('id', req.params.documentId)
      .eq('request_id', req.params.id)
      .maybeSingle();
    if (documentError) throw documentError;
    if (!document) return res.status(404).json({ success: false, message: 'Verification document not found.' });

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([document.storage_path]);
    if (storageError) throw storageError;

    const { error: deleteError } = await supabase
      .from('verification_documents')
      .delete()
      .eq('id', document.id);
    if (deleteError) throw deleteError;

    const { error: auditError } = await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'verification_document_deleted',
      entity_type: 'verification_request',
      entity_id: document.request_id,
      details: {
        target_user_id: document.user_id,
        document_id: document.id,
        document_name: document.document_name
      }
    });
    if (auditError) throw auditError;

    return res.json({ success: true, message: 'Private verification document deleted.' });
  } catch (error) {
    return next(error);
  }
};

const decideAdminRequest = async (req, res, next) => {
  try {
    const { status, reason, adminNotes } = req.body;
    if (!ALLOWED_DECISIONS.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification decision.' });
    }
    const decisionReason = typeof reason === 'string' ? reason.trim() : '';
    if (['rejected', 'additional_information_required', 'suspended'].includes(status) && !decisionReason) {
      return res.status(400).json({ success: false, message: 'A decision reason is required for this action.' });
    }
    if (decisionReason.length > 2000 || (typeof adminNotes === 'string' && adminNotes.length > 5000)) {
      return res.status(400).json({ success: false, message: 'Decision reason or Admin notes are too long.' });
    }

    const { data: updated, error: decisionError } = await supabase.rpc('apply_verification_decision', {
      p_request_id: req.params.id,
      p_status: status,
      p_reason: decisionReason || null,
      p_admin_notes: typeof adminNotes === 'string' ? adminNotes.trim() || null : null,
      p_reviewer_id: req.user.id
    });
    if (decisionError) {
      if (decisionError.message?.includes('Invalid verification transition')) {
        return res.status(409).json({ success: false, message: decisionError.message });
      }
      if (decisionError.message?.includes('Verification request not found')) {
        return res.status(404).json({ success: false, message: 'Verification request not found.' });
      }
      throw decisionError;
    }

    const notifications = {
      under_review: ['Verification under review', 'An Admin has started reviewing your verification application.'],
      additional_information_required: ['More information required', `Please update your application: ${decisionReason}`],
      verified: ['Verification approved', 'Your account has been verified. Restricted marketplace actions are now available.'],
      rejected: ['Verification not approved', `Your verification application was not approved: ${decisionReason}`],
      suspended: ['Account suspended', `Your account has been suspended: ${decisionReason}`]
    };
    const [title, message] = notifications[status];
    let notificationDelivered = true;
    try {
      await notifyUser(updated.user_id, title, message);
    } catch (notificationError) {
      notificationDelivered = false;
      console.error('[VERIFICATION NOTIFICATION ERROR]', notificationError.message || notificationError);
    }

    return res.json({ success: true, data: updated, notificationDelivered });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStatus,
  submitRequest,
  getAdminSummary,
  listAdminRequests,
  getAdminRequest,
  deleteAdminDocument,
  decideAdminRequest
};
