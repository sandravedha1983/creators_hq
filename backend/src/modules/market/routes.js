const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { supabase } = require('../../config/supabase');
const { createNotification } = require('../notifications/controllers');

const getProfilesById = async (ids, includeEmail = false) => {
  const uniqueIds = [...new Set(ids.filter(Boolean).map(String))];
  if (!uniqueIds.length) return new Map();

  const fields = includeEmail ? 'id, name, email, avatar' : 'id, name, avatar';
  const { data, error } = await supabase.from('profiles').select(fields).in('id', uniqueIds);
  if (error) throw error;
  return new Map((data || []).map(profile => [String(profile.id), profile]));
};

const serializeCampaign = (campaign, profiles = new Map()) => {
  const brand = profiles.get(String(campaign.brand_id));
  return {
    ...campaign,
    _id: campaign._id || campaign.id,
    createdAt: campaign.createdAt || campaign.created_at,
    deliverables: Array.isArray(campaign.deliverables)
      ? campaign.deliverables.join(', ')
      : campaign.deliverables || '',
    requirements: campaign.requirements || '',
    brand_id: brand
      ? { ...brand, _id: brand.id }
      : campaign.brand_id
  };
};

const serializeApplication = (application, { campaign, creator } = {}) => ({
  ...application,
  _id: application._id || application.id,
  createdAt: application.createdAt || application.created_at,
  campaign_id: campaign
    ? serializeCampaign(campaign)
    : application.campaign_id,
  creator_id: creator
    ? { ...creator, _id: creator.id }
    : application.creator_id
});

// ─── Public: list all open campaigns (creators browse) ───────────────────────
router.get('/campaigns', async (req, res, next) => {
  try {
    const { search, niche, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
        .from('campaigns')
        .select(`
          id,
          brand_id,
          title,
          description,
          budget,
          niche,
          deliverables,
          deadline,
          image,
          status,
          created_at
        `, { count: 'exact' })
        .eq('status', 'open');

      if (niche && niche !== 'all') {
        query = query.ilike('niche', `%${niche}%`);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      const { data: campaigns, error, count } = await query;
      if (error) throw error;

      const profiles = await getProfilesById((campaigns || []).map(campaign => campaign.brand_id));
      const data = (campaigns || []).map(campaign => serializeCampaign(campaign, profiles));
    return res.json({ success: true, data, total: count || 0, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: list own campaigns ────────────────────────────────────────────────
router.get('/campaigns/mine', authenticate, async (req, res, next) => {
  try {
    const { data: campaigns, error } = await req.supabase
        .from('campaigns')
        .select('*')
        .eq('brand_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const profiles = await getProfilesById((campaigns || []).map(campaign => campaign.brand_id));
    return res.json({ success: true, data: (campaigns || []).map(campaign => serializeCampaign(campaign, profiles)) });
  } catch (err) {
    next(err);
  }
});

// ─── Get single campaign ──────────────────────────────────────────────────────
router.get('/campaign/:id', async (req, res, next) => {
  try {
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          brand_id,
          title,
          description,
          budget,
          niche,
          deliverables,
          deadline,
          image,
          status,
          created_at
        `)
        .eq('id', req.params.id)
        .single();

      if (error || !campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
      const profiles = await getProfilesById([campaign.brand_id]);
    return res.json({ success: true, data: serializeCampaign(campaign, profiles) });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: create campaign ───────────────────────────────────────────────────
router.post('/campaign', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    const { title, description, budget, niche, deliverables, requirements, deadline, image, status } = req.body;
    if (!title || !description || !budget) {
      return res.status(400).json({ success: false, message: 'title, description and budget are required' });
    }

    const { data: campaign, error } = await req.supabase
        .from('campaigns')
        .insert({
          brand_id: req.user.id,
          title,
          description,
          budget,
          niche: niche || '',
          deliverables: deliverables ? [String(deliverables)] : [],
          deadline: deadline || null,
          image: image || '',
          status: status || 'open'
        })
        .select()
        .single();

      if (error) throw error;
      const profiles = await getProfilesById([campaign.brand_id]);
    return res.status(201).json({ success: true, data: serializeCampaign(campaign, profiles) });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: update own campaign ───────────────────────────────────────────────
router.put('/campaign/:id', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    const { data: existing, error: fetchErr } = await req.supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchErr || !existing) return res.status(404).json({ success: false, message: 'Campaign not found' });

      if (req.user.role !== 'admin' && String(existing.brand_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const allowed = ['title', 'description', 'budget', 'niche', 'deadline', 'image', 'status'];
      const updates = {};
      allowed.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });
      if (req.body.deliverables !== undefined) {
        updates.deliverables = req.body.deliverables ? [String(req.body.deliverables)] : [];
      }

      const { data: updated, error: updateErr } = await req.supabase
        .from('campaigns')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      const profiles = await getProfilesById([updated.brand_id]);
    return res.json({ success: true, data: serializeCampaign(updated, profiles) });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: delete own campaign ───────────────────────────────────────────────
router.delete('/campaign/:id', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    const { data: existing, error: fetchErr } = await req.supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchErr || !existing) return res.status(404).json({ success: false, message: 'Campaign not found' });

      if (req.user.role !== 'admin' && String(existing.brand_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { error: applicationsError } = await req.supabase.from('campaign_applications').delete().eq('campaign_id', req.params.id);
      if (applicationsError) throw applicationsError;
      const { error: delErr } = await req.supabase.from('campaigns').delete().eq('id', req.params.id);
      if (delErr) throw delErr;

      return res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── Creator: apply to campaign ───────────────────────────────────────────────
router.post('/campaign/:id/apply', authenticate, authorize('creator'), async (req, res, next) => {
  try {
    const { data: campaign, error: campErr } = await req.supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (campErr || !campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
      if (campaign.status !== 'open') {
        return res.status(400).json({ success: false, message: 'This campaign is not accepting applications' });
      }

      const { data: existing, error: existingError } = await req.supabase
        .from('campaign_applications')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('creator_id', req.user.id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) {
        return res.status(409).json({ success: false, message: 'You have already applied to this campaign' });
      }

      const { data: application, error: appErr } = await req.supabase
        .from('campaign_applications')
        .insert({
          campaign_id: campaign.id,
          creator_id: req.user.id,
          message: req.body.message || ''
        })
        .select()
        .single();

      if (appErr) throw appErr;

      // Notify Brand
      await createNotification(
        campaign.brand_id,
        'New Campaign Application',
        `A creator applied to your campaign "${campaign.title}".`,
        'application',
        `/campaigns`
      );

    return res.status(201).json({ success: true, data: serializeApplication(application) });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: get applications for own campaign ─────────────────────────────────
router.get('/campaign/:id/applications', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    const { data: campaign, error: campErr } = await req.supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (campErr || !campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

      if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { data: applications, error: appErr } = await req.supabase
        .from('campaign_applications')
        .select(`
          id,
          message,
          status,
          created_at,
          creator_id
        `)
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      if (appErr) throw appErr;
      const creators = await getProfilesById(
        (applications || []).map(application => application.creator_id),
        true
      );
      const data = (applications || []).map(application =>
        serializeApplication(application, { creator: creators.get(String(application.creator_id)) })
      );
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: approve / reject an application ───────────────────────────────────
router.patch('/campaign/:id/application/:appId', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }

    const { data: campaign, error: campErr } = await req.supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (campErr || !campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

      if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { data: application, error: appErr } = await req.supabase
        .from('campaign_applications')
        .update({ status })
        .eq('id', req.params.appId)
        .eq('campaign_id', campaign.id)
        .select()
        .single();

      if (appErr || !application) return res.status(404).json({ success: false, message: 'Application not found' });

      // Notify Creator
      await createNotification(
        application.creator_id,
        `Application ${status === 'approved' ? 'Approved! 🎉' : 'Update'}`,
        `Your application for campaign "${campaign.title}" was ${status}.`,
        'application',
        '/campaigns'
      );

    return res.json({ success: true, data: serializeApplication(application) });
  } catch (err) {
    next(err);
  }
});

// ─── Creator: get own applications ────────────────────────────────────────────
router.get('/my-applications', authenticate, authorize('creator'), async (req, res, next) => {
  try {
    const { data: applications, error } = await req.supabase
        .from('campaign_applications')
        .select(`
          id,
          message,
          status,
          created_at,
          campaign:campaign_id(*)
        `)
        .eq('creator_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const data = (applications || []).map(application =>
        serializeApplication(application, { campaign: application.campaign })
      );
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
