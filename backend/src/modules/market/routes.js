const express = require('express');
const router = express.Router();
const Campaign = require('./models');
const CampaignApplication = require('./applicationModel');
const { authenticate, authorize } = require('../../middleware/auth');

// ─── Public: list all open campaigns (creators browse) ───────────────────────
router.get('/campaigns', async (req, res, next) => {
  try {
    const { search, niche, page = 1, limit = 20 } = req.query;
    const query = { status: 'open' };
    if (niche) query.niche = { $regex: niche, $options: 'i' };
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const campaigns = await Campaign.find(query)
      .populate('brand_id', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Campaign.countDocuments(query);
    res.json({ success: true, data: campaigns, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: list own campaigns ────────────────────────────────────────────────
router.get('/campaigns/mine', authenticate, async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ brand_id: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
});

// ─── Get single campaign ──────────────────────────────────────────────────────
router.get('/campaign/:id', async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('brand_id', 'name email');
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
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    // Only the owning brand or admin can update
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

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
});

// ─── Brand: get applications for own campaign ─────────────────────────────────
router.get('/campaign/:id/applications', authenticate, authorize('brand', 'admin'), async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (req.user.role !== 'admin' && String(campaign.brand_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const applications = await CampaignApplication.find({ campaign_id: campaign._id })
      .populate('creator_id', 'name email')
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
    res.json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
});

// ─── Creator: get own applications ────────────────────────────────────────────
router.get('/my-applications', authenticate, authorize('creator'), async (req, res, next) => {
  try {
    const applications = await CampaignApplication.find({ creator_id: req.user.id })
      .populate('campaign_id')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
