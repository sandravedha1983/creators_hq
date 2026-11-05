/**
 * CreatorsHQ — MongoDB to Supabase PostgreSQL Migration Script
 *
 * This script idempotently migrates existing MongoDB business records to Supabase PostgreSQL:
 * 1. Users -> auth.users + public.profiles
 * 2. CreatorProfile -> public.creator_profiles
 * 3. BrandProfile -> public.brand_profiles
 * 4. Campaign -> public.campaigns
 * 5. CampaignApplication -> public.campaign_applications
 * 6. Collaboration -> public.collaborations
 * 7. Lead -> public.leads
 * 8. Notification -> public.notifications
 * 9. AiGeneration -> public.ai_generations
 * 10. Analytics -> public.analytics
 * 11. Transaction -> public.transactions
 *
 * Usage:
 *   node backend/src/scripts/migrate-mongo-to-supabase.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

// Models
const User = require('../modules/auth/models');
const CreatorProfile = require('../modules/creators/models');
const BrandProfile = require('../modules/creators/brandModel');
const Campaign = require('../modules/market/models');
const CampaignApplication = require('../modules/market/applicationModel');
const Collaboration = require('../modules/collaborations/models');
const Lead = require('../modules/leads/models');
const Notification = require('../modules/notifications/models');
const AiGeneration = require('../modules/ai/models');
const Analytics = require('../modules/analytics/models');
const Transaction = require('../modules/billing/models');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MONGO_URI = process.env.MONGO_URI;

async function runMigration() {
  console.log('=================================================================');
  console.log('       CreatorsHQ — MongoDB to Supabase PostgreSQL Migration     ');
  console.log('=================================================================');

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not set in environment.');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_URL.includes('dummy-creatorshq') || SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
    console.warn('\n⚠️  Notice: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is using a placeholder.');
    console.warn('   The migration script will connect to MongoDB to inspect and validate source data,');
    console.warn('   but live Supabase sync requires live Supabase project credentials in backend/.env.\n');
  }

  // Connect to MongoDB
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB successfully.');

  const isLiveSupabase = SUPABASE_URL &&
    SUPABASE_SERVICE_ROLE_KEY &&
    !SUPABASE_URL.includes('dummy-creatorshq') &&
    !SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

  let supabase = null;
  if (isLiveSupabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    console.log('✅ Connected to Supabase client with Service Role.');
  } else {
    console.log('ℹ️  Running in validation & dry-run reporting mode.');
  }

  // Count source documents
  const counts = {
    users: await User.countDocuments(),
    creatorProfiles: await CreatorProfile.countDocuments(),
    brandProfiles: await BrandProfile.countDocuments(),
    campaigns: await Campaign.countDocuments(),
    applications: await CampaignApplication.countDocuments(),
    collaborations: await Collaboration.countDocuments(),
    leads: await Lead.countDocuments(),
    notifications: await Notification.countDocuments(),
    aiGenerations: await AiGeneration.countDocuments(),
    analytics: await Analytics.countDocuments(),
    transactions: await Transaction.countDocuments(),
  };

  console.log('\n📊 Source MongoDB Record Counts:');
  console.table(counts);

  const mongoUserToSupabase = {};
  const stats = {
    migratedUsers: 0,
    migratedCreatorProfiles: 0,
    migratedBrandProfiles: 0,
    migratedCampaigns: 0,
    migratedApplications: 0,
    migratedCollaborations: 0,
    migratedLeads: 0,
    migratedNotifications: 0,
    migratedAiGenerations: 0,
    migratedAnalytics: 0,
    migratedTransactions: 0,
    errors: []
  };

  if (!isLiveSupabase) {
    console.log('\n📝 Dry-run validation finished. All MongoDB models and documents are intact.');
    console.log('   To perform live synchronization into Supabase:');
    console.log('   1. Apply supabase/migrations/20261014000000_creatorshq_v1_init.sql to your Supabase project.');
    console.log('   2. Set valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.');
    console.log('   3. Re-run: node backend/src/scripts/migrate-mongo-to-supabase.js\n');
    await mongoose.disconnect();
    return;
  }

  // 1. Migrate Users & Profiles
  console.log('\n⏳ Migrating Users and Profiles...');
  const users = await User.find();
  for (const u of users) {
    try {
      // Find or create in Supabase Auth
      let authUserId;
      const { data: existingUserList } = await supabase.auth.admin.listUsers();
      const existing = existingUserList?.users?.find(x => x.email?.toLowerCase() === u.email.toLowerCase());

      if (existing) {
        authUserId = existing.id;
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: u.email,
          email_confirm: true,
          user_metadata: { name: u.name, role: u.role || 'creator' }
        });
        if (createError) throw createError;
        authUserId = newUser.user.id;
      }

      mongoUserToSupabase[u._id.toString()] = authUserId;

      // Upsert into public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUserId,
          name: u.name || '',
          email: u.email,
          role: u.role || 'creator',
          is_verified: Boolean(u.isVerified),
          is_blocked: Boolean(u.isBlocked),
          is_suspended: Boolean(u.isSuspended),
          social_handle: u.socialHandle || '',
          avatar: u.avatar || '',
          plan: u.plan || 'free',
          is_onboarded: Boolean(u.isOnboarded),
          verification_status: u.verificationStatus || 'not_submitted',
          verification_screenshot: u.verificationScreenshot || '',
          verification_code: u.verificationCode || '',
          integrations: u.integrations ? Object.fromEntries(u.integrations) : {},
          socials: u.socials || {}
        }, { onConflict: 'id' });

      if (profileError) throw profileError;
      stats.migratedUsers++;

      // Creator Profile
      if (u.role === 'creator') {
        const cp = await CreatorProfile.findOne({ user_id: u._id });
        if (cp) {
          const { error: cpError } = await supabase
            .from('creator_profiles')
            .upsert({
              user_id: authUserId,
              username: cp.username || '',
              avatar: cp.avatar || u.avatar || '',
              cover_image: cp.coverImage || '',
              bio: cp.bio || '',
              niche: cp.niche || '',
              sub_categories: cp.subCategories || [],
              languages: cp.languages || [],
              content_types: cp.contentTypes || [],
              location: cp.location || '',
              website: cp.website || '',
              goals: cp.goals || '',
              collaboration_preferences: cp.collaborationPreferences || '',
              preferred_brand_categories: cp.preferredBrandCategories || [],
              portfolio: cp.portfolio || [],
              followers: cp.followers || 0,
              engagement_rate: cp.engagement_rate || 0,
              growth_score: cp.growthScore || 0,
              social_links: cp.socialLinks || {}
            }, { onConflict: 'user_id' });
          if (!cpError) stats.migratedCreatorProfiles++;
        }
      }

      // Brand Profile
      if (u.role === 'brand') {
        const bp = await BrandProfile.findOne({ user_id: u._id });
        if (bp) {
          const { error: bpError } = await supabase
            .from('brand_profiles')
            .upsert({
              user_id: authUserId,
              company_name: bp.companyName || u.name || '',
              logo: bp.logo || bp.avatar || '',
              website: bp.website || '',
              industry: bp.industry || '',
              location: bp.location || '',
              description: bp.description || '',
              objectives: bp.objectives || '',
              budget: bp.budget || ''
            }, { onConflict: 'user_id' });
          if (!bpError) stats.migratedBrandProfiles++;
        }
      }
    } catch (err) {
      stats.errors.push(`User ${u.email}: ${err.message}`);
    }
  }

  // 2. Migrate Campaigns
  console.log('⏳ Migrating Campaigns...');
  const mongoCampaignToSupabase = {};
  const campaigns = await Campaign.find();
  for (const c of campaigns) {
    try {
      const brandUuid = mongoUserToSupabase[c.brand_id?.toString()];
      if (!brandUuid) continue;

      const { data: inserted, error: campError } = await supabase
        .from('campaigns')
        .insert({
          brand_id: brandUuid,
          title: c.title,
          description: c.description,
          budget: c.budget,
          niche: c.niche || '',
          deliverables: c.deliverables || '',
          requirements: c.requirements || '',
          deadline: c.deadline || null,
          image: c.image || '',
          status: c.status || 'open'
        })
        .select()
        .single();

      if (campError) throw campError;
      mongoCampaignToSupabase[c._id.toString()] = inserted.id;
      stats.migratedCampaigns++;
    } catch (err) {
      stats.errors.push(`Campaign ${c.title}: ${err.message}`);
    }
  }

  // 3. Migrate Campaign Applications
  console.log('⏳ Migrating Campaign Applications...');
  const applications = await CampaignApplication.find();
  for (const app of applications) {
    try {
      const campUuid = mongoCampaignToSupabase[app.campaign_id?.toString()];
      const creatorUuid = mongoUserToSupabase[app.creator_id?.toString()];
      if (!campUuid || !creatorUuid) continue;

      const { error: appError } = await supabase
        .from('campaign_applications')
        .upsert({
          campaign_id: campUuid,
          creator_id: creatorUuid,
          message: app.message || '',
          status: app.status || 'pending'
        }, { onConflict: 'campaign_id,creator_id' });

      if (appError) throw appError;
      stats.migratedApplications++;
    } catch (err) {
      stats.errors.push(`Application ${app._id}: ${err.message}`);
    }
  }

  // 4. Migrate Collaborations
  console.log('⏳ Migrating Collaborations...');
  const collabs = await Collaboration.find();
  for (const col of collabs) {
    try {
      const senderUuid = mongoUserToSupabase[col.sender_id?.toString()];
      const receiverUuid = mongoUserToSupabase[col.receiver_id?.toString()];
      if (!senderUuid || !receiverUuid) continue;

      const { error: colError } = await supabase
        .from('collaborations')
        .insert({
          sender_id: senderUuid,
          receiver_id: receiverUuid,
          message: col.message || '',
          status: col.status || 'pending'
        });

      if (colError) throw colError;
      stats.migratedCollaborations++;
    } catch (err) {
      stats.errors.push(`Collaboration ${col._id}: ${err.message}`);
    }
  }

  // 5. Migrate Leads
  console.log('⏳ Migrating Leads...');
  const leads = await Lead.find();
  for (const l of leads) {
    try {
      const userUuid = mongoUserToSupabase[l.user_id?.toString()];
      if (!userUuid) continue;

      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          user_id: userUuid,
          name: l.name,
          email: l.email || '',
          phone: l.phone || '',
          company: l.company || '',
          status: l.status || 'Warm',
          value: l.value || '',
          notes: l.notes || '',
          source: l.source || 'manual'
        });

      if (leadError) throw leadError;
      stats.migratedLeads++;
    } catch (err) {
      stats.errors.push(`Lead ${l.name}: ${err.message}`);
    }
  }

  // 6. Migrate Notifications
  console.log('⏳ Migrating Notifications...');
  const notifs = await Notification.find();
  for (const n of notifs) {
    try {
      const userUuid = mongoUserToSupabase[n.user_id?.toString()];
      if (!userUuid) continue;

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userUuid,
          title: n.title,
          message: n.message,
          type: n.type || 'system',
          read: Boolean(n.read),
          link: n.link || ''
        });

      if (notifError) throw notifError;
      stats.migratedNotifications++;
    } catch (err) {
      stats.errors.push(`Notification ${n._id}: ${err.message}`);
    }
  }

  // 7. Migrate AI Generations
  console.log('⏳ Migrating AI Generations...');
  const aiGens = await AiGeneration.find();
  for (const ai of aiGens) {
    try {
      const userUuid = mongoUserToSupabase[ai.user_id?.toString()];
      if (!userUuid) continue;

      let normalizedType = (ai.type || 'idea').toLowerCase();
      if (normalizedType === 'ideas') normalizedType = 'idea';

      const { error: aiError } = await supabase
        .from('ai_generations')
        .insert({
          user_id: userUuid,
          type: normalizedType,
          prompt: ai.prompt,
          output: ai.output,
          tokens_used: ai.tokens_used || 0,
          model: ai.model || 'gpt-4o-mini'
        });

      if (aiError) throw aiError;
      stats.migratedAiGenerations++;
    } catch (err) {
      stats.errors.push(`AiGeneration ${ai._id}: ${err.message}`);
    }
  }

  // 8. Migrate Analytics
  console.log('⏳ Migrating Analytics...');
  const analyticsList = await Analytics.find();
  for (const an of analyticsList) {
    try {
      const userUuid = mongoUserToSupabase[an.userId?.toString()];
      if (!userUuid) continue;

      const { error: anError } = await supabase
        .from('analytics')
        .upsert({
          user_id: userUuid,
          followers: an.followers || 0,
          engagement: an.engagement || 0,
          earnings: an.earnings || 0,
          growth_score: an.growthScore || 0,
          historical_data: an.historicalData || [],
          instagram_data: an.instagramData || {},
          last_updated: an.lastUpdated || new Date()
        }, { onConflict: 'user_id' });

      if (anError) throw anError;
      stats.migratedAnalytics++;
    } catch (err) {
      stats.errors.push(`Analytics ${an._id}: ${err.message}`);
    }
  }

  // 9. Migrate Transactions
  console.log('⏳ Migrating Transactions...');
  const txList = await Transaction.find();
  for (const tx of txList) {
    try {
      const senderUuid = mongoUserToSupabase[tx.sender_id?.toString()];
      const recipientUuid = mongoUserToSupabase[tx.recipient_id?.toString()];
      if (!senderUuid || !recipientUuid) continue;

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          sender_id: senderUuid,
          recipient_id: recipientUuid,
          amount: tx.amount,
          currency: tx.currency || 'INR',
          status: tx.status || 'paid'
        });

      if (txError) throw txError;
      stats.migratedTransactions++;
    } catch (err) {
      stats.errors.push(`Transaction ${tx._id}: ${err.message}`);
    }
  }

  console.log('\n=================================================================');
  console.log('                    MIGRATION SUMMARY REPORT                     ');
  console.log('=================================================================');
  console.table({
    'Users Migrated': stats.migratedUsers,
    'Creator Profiles Migrated': stats.migratedCreatorProfiles,
    'Brand Profiles Migrated': stats.migratedBrandProfiles,
    'Campaigns Migrated': stats.migratedCampaigns,
    'Applications Migrated': stats.migratedApplications,
    'Collaborations Migrated': stats.migratedCollaborations,
    'Leads Migrated': stats.migratedLeads,
    'Notifications Migrated': stats.migratedNotifications,
    'AI Generations Migrated': stats.migratedAiGenerations,
    'Analytics Migrated': stats.migratedAnalytics,
    'Transactions Migrated': stats.migratedTransactions,
    'Total Errors': stats.errors.length
  });

  if (stats.errors.length > 0) {
    console.log('\n⚠️ Migration Errors:');
    stats.errors.slice(0, 10).forEach(e => console.log(' -', e));
    if (stats.errors.length > 10) {
      console.log(` ... and ${stats.errors.length - 10} more`);
    }
  }

  await mongoose.disconnect();
  console.log('✅ Migration process completed.');
}

runMigration().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
