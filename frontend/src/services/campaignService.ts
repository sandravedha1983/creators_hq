import API from './api';

export interface Campaign {
  _id: string;
  brand_id: { _id: string; name: string; email: string } | string;
  title: string;
  description: string;
  budget: string;
  niche: string;
  deliverables: string;
  requirements: string;
  deadline?: string;
  image: string;
  status: 'draft' | 'open' | 'paused' | 'closed';
  createdAt: string;
}

export interface CampaignApplication {
  _id: string;
  campaign_id: Campaign | string;
  creator_id: { _id: string; name: string; email: string } | string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ─── Public: list all open campaigns (creator browse) ────────────────────────
export const getCampaigns = async (params?: { search?: string; niche?: string; page?: number }) => {
  const res = await API.get('/api/market/campaigns', { params });
  return res.data;
};

// ─── Brand: list own campaigns ────────────────────────────────────────────────
export const getMyCampaigns = async () => {
  const res = await API.get('/api/market/campaigns/mine');
  return res.data;
};

// ─── Get single campaign ──────────────────────────────────────────────────────
export const getCampaign = async (id: string) => {
  const res = await API.get(`/api/market/campaign/${id}`);
  return res.data;
};

// ─── Brand: create campaign ───────────────────────────────────────────────────
export const createCampaign = async (data: {
  title: string;
  description: string;
  budget: string;
  niche?: string;
  deliverables?: string;
  requirements?: string;
  deadline?: string;
  image?: string;
  status?: string;
}) => {
  const res = await API.post('/api/market/campaign', data);
  return res.data;
};

// ─── Brand: update campaign ───────────────────────────────────────────────────
export const updateCampaign = async (id: string, data: Partial<Campaign>) => {
  const res = await API.put(`/api/market/campaign/${id}`, data);
  return res.data;
};

// ─── Brand: delete campaign ───────────────────────────────────────────────────
export const deleteCampaign = async (id: string) => {
  const res = await API.delete(`/api/market/campaign/${id}`);
  return res.data;
};

// ─── Creator: apply to campaign ───────────────────────────────────────────────
export const applyToCampaign = async (id: string, message?: string) => {
  const res = await API.post(`/api/market/campaign/${id}/apply`, { message: message || '' });
  return res.data;
};

// ─── Brand: get applications for own campaign ─────────────────────────────────
export const getCampaignApplications = async (campaignId: string) => {
  const res = await API.get(`/api/market/campaign/${campaignId}/applications`);
  return res.data;
};

// ─── Brand: approve or reject an application ─────────────────────────────────
export const updateApplicationStatus = async (campaignId: string, appId: string, status: 'approved' | 'rejected') => {
  const res = await API.patch(`/api/market/campaign/${campaignId}/application/${appId}`, { status });
  return res.data;
};

// ─── Creator: get own applications ────────────────────────────────────────────
export const getMyApplications = async () => {
  const res = await API.get('/api/market/my-applications');
  return res.data;
};
