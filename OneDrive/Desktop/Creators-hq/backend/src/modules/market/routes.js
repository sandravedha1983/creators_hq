const express = require('express');
const router = express.Router();
const Campaign = require('./models');
const CampaignApplication = require('./applicationModel');
const { authenticate, authorize } = require('../../middleware/auth');
const { supabase } = require('../../config/supabase');
const { createNotification } = require('../notifications/controllers');

const isSupabaseActive = () => {
  return supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq');
};

// ─── Public: list all open campaigns (creators browse) ───────────────────────
router.get('/campaigns', async (req, res, next) => {
  try {
    const { search, niche, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    if (isSupabaseActive()) {
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
          requirements,
          deadline,
          image,
          status,
          created_at,
          brand:brand_id(name, email, avatar)
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

      return res.json({ success: true, data: campaigns || [], total: count || 0, page: pageNum, limit: limitNum });
    }

    // MongoDB Fallback
    const query = { status: 'open' };
    if (niche) query.niche = { $regex: niche, $options: 'i' };
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const total = await Campaign.countDocuments(query);
    const campaigns = await Campaign.find(query)
      .populate('brand_id', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limitNum);

    res.json({ success: true, data: campaigns, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: list own campaigns ────────────────────────────────────────────────
router.get('/campaigns/mine', authenticate, async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('brand_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: campaigns || [] });
    }

    // MongoDB Fallback
    const campaigns = await Campaign.find({ brand_id: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
});

// ─── Get single campaign ──────────────────────────────────────────────────────
router.get('/campaign/:id', async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
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
          requirements,
          deadline,
          image,
          status,
          created_at,
          brand:brand_id(name, email, avatar)
        `)
        .eq('id', req.params.id)
        .single();

      if (error || !campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
      return res.json({ success: true, data: campaign });
    }

    // MongoDB Fallback
    const campaign = await Campaign.findById(req.params.id).populate('brand_id', 'name email avatar');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
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

    if (isSupabaseActive()) {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          brand_id: req.user.id,
          title,
          description,
          budget,
          niche: niche || '',
          deliverables: deliverables || '',
          requirements: requirements || '',
          deadline: deadline || null,
          image: image || '',
          status: status || 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, data: campaign });
    }

    // MongoDB Fallback
    const campaign = await Campaign.create({
      brand_id: req.user.id,
      title,
      description,
      budget,
      niche: niche || '',
      deliverables: deliverables || '',
      requirements: requirements || '',
      deadline: deadline || undefined,
      image: image || '',
      status: status || 'open'
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: update own campaign ───────────────────────────────────────────────
router.put('/campaign/:id', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: existing, error: fetchErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchErr || !existing) return res.status(404).json({ success: false, message: 'Campaign not found' });

      if (req.user.role !== 'admin' && String(existing.brand_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const allowed = ['title', 'description', 'budget', 'niche', 'deliverables', 'requirements', 'deadline', 'image', 'status'];
      const updates = {};
      allowed.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const { data: updated, error: updateErr } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      return res.json({ success: true, data: updated });
    }

    // MongoDB Fallback
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowed = ['title', 'description', 'budget', 'niche', 'deliverables', 'requirements', 'deadline', 'image', 'status'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) campaign[field] = req.body[field];
    });

    await campaign.save();
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: delete own campaign ───────────────────────────────────────────────
router.delete('/campaign/:id', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: existing, error: fetchErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchErr || !existing) return res.status(404).json({ success: false, message: 'Campaign not found' });

      if (req.user.role !== 'admin' && String(existing.brand_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      await supabase.from('campaign_applications').delete().eq('campaign_id', req.params.id);
      const { error: delErr } = await supabase.from('campaigns').delete().eq('id', req.params.id);
      if (delErr) throw delErr;

      return res.json({ success: true, message: 'Campaign deleted' });
    }

    // MongoDB Fallback
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Campaign.deleteOne({ _id: campaign._id });
    await CampaignApplication.deleteMany({ campaign_id: campaign._id });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── Creator: apply to campaign ───────────────────────────────────────────────
router.post('/campaign/:id/apply', authenticate, authorize('creator'), async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (campErr || !campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
      if (campaign.status !== 'open') {
        return res.status(400).json({ success: false, message: 'This campaign is not accepting applications' });
      }

      const { data: existing } = await supabase
        .from('campaign_applications')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('creator_id', req.user.id)
        .single();

      if (existing) {
        return res.status(409).json({ success: false, message: 'You have already applied to this campaign' });
      }

      const { data: application, error: appErr } = await supabase
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

      return res.status(201).json({ success: true, data: application });
    }

    // MongoDB Fallback
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (campaign.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This campaign is not accepting applications' });
    }

    const existing = await CampaignApplication.findOne({
      campaign_id: campaign._id,
      creator_id: req.user.id
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied to this campaign' });
    }

    const application = await CampaignApplication.create({
      campaign_id: campaign._id,
      creator_id: req.user.id,
      message: req.body.message || ''
    });

    // Notify Brand
    await createNotification(
      campaign.brand_id,
      'New Campaign Application',
      `A creator applied to your campaign "${campaign.title}".`,
      'application',
      `/campaigns`
    );

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: get applications for own campaign ─────────────────────────────────
router.get('/campaign/:id/applications', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (campErr || !campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

      if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { data: applications, error: appErr } = await supabase
        .from('campaign_applications')
        .select(`
          id,
          message,
          status,
          created_at,
          creator:creator_id(name, email, avatar)
        `)
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      if (appErr) throw appErr;
      return res.json({ success: true, data: applications || [] });
    }

    // MongoDB Fallback
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const applications = await CampaignApplication.find({ campaign_id: campaign._id })
      .populate('creator_id', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applications });
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

    if (isSupabaseActive()) {
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (campErr || !campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

      if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { data: application, error: appErr } = await supabase
        .from('campaign_applications')
        .update({ status })
        .eq('id', req.params.appId)
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

      return res.json({ success: true, data: application });
    }

    // MongoDB Fallback
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const application = await CampaignApplication.findByIdAndUpdate(
      req.params.appId,
      { status },
      { new: true }
    );

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    // Notify Creator
    await createNotification(
      application.creator_id,
      `Application ${status === 'approved' ? 'Approved! 🎉' : 'Update'}`,
      `Your application for campaign "${campaign.title}" was ${status}.`,
      'application',
      '/campaigns'
    );

    res.json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
});

// ─── Creator: get own applications ────────────────────────────────────────────
router.get('/my-applications', authenticate, authorize('creator'), async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: applications, error } = await supabase
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
      return res.json({ success: true, data: applications || [] });
    }

    // MongoDB Fallback
    const applications = await CampaignApplication.find({ creator_id: req.user.id })
      .populate('campaign_id')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
