import API from './api';

export interface CreatorProfile {
  _id: string;
  user_id: string;
  username: string;
  avatar: string;
  coverImage: string;
  bio: string;
  niche: string;
  location: string;
  website: string;
  goals: string;
  followers: number;
  engagement_rate: number;
  growthScore: number;
  socialLinks: {
    instagram: string;
    youtube: string;
    twitter: string;
    linkedin: string;
    tiktok: string;
  };
}

export interface BrandProfile {
  _id: string;
  user_id: string;
  companyName: string;
  logo: string;
  website: string;
  industry: string;
  location: string;
  description: string;
  objectives: string;
  budget: string;
}

export interface GrowthScoreData {
  score: number;
  breakdown: {
    bio: boolean;
    niche: boolean;
    location: boolean;
    website: boolean;
    avatar: boolean;
    goals: boolean;
    verifiedSocials: string[];
    followers: number;
    insufficientData: boolean;
    message?: string;
  };
}

// ─── Creator Profile ──────────────────────────────────────────────────────────
export const getCreatorProfile = async () => {
  const res = await API.get('/api/creators/profile');
  return res.data as { success: boolean; data: CreatorProfile | null };
};

export const updateCreatorProfile = async (data: Partial<CreatorProfile>) => {
  const res = await API.put('/api/creators/profile', data);
  return res.data as { success: boolean; data: CreatorProfile };
};

export const getGrowthScore = async () => {
  const res = await API.get('/api/creators/growth-score');
  return res.data as { success: boolean } & GrowthScoreData;
};

export const getPublicCreators = async (params?: { niche?: string; search?: string; page?: number }) => {
  const res = await API.get('/api/creators/public', { params });
  return res.data;
};

// ─── Brand Profile ────────────────────────────────────────────────────────────
export const getBrandProfile = async () => {
  const res = await API.get('/api/creators/brand-profile');
  return res.data as { success: boolean; data: BrandProfile | null };
};

export const updateBrandProfile = async (data: Partial<BrandProfile>) => {
  const res = await API.put('/api/creators/brand-profile', data);
  return res.data as { success: boolean; data: BrandProfile };
};

// ─── User-level profile update (name, avatar, onboarding) ────────────────────
export const updateUserProfile = async (data: { name?: string; avatar?: string; isOnboarded?: boolean }) => {
  const res = await API.put('/api/auth/profile', data);
  return res.data;
};

// ─── AI usage ────────────────────────────────────────────────────────────────
export const getAiUsage = async () => {
  const res = await API.get('/api/ai/usage');
  return res.data as {
    success: boolean;
    data: { used: number; limit: number | null; isPro: boolean; limitReached: boolean };
  };
};

export const getAiHistory = async () => {
  const res = await API.get('/api/ai/history');
  return res.data;
};
