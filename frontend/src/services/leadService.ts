import API from './api';

export interface Lead {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'Hot' | 'Warm' | 'Cold';
  value: string;
  notes: string;
  source: string;
  createdAt: string;
}

// ─── Get all leads (with optional filters) ───────────────────────────────────
export const getLeads = async (params?: { status?: string; search?: string }) => {
  const res = await API.get('/api/leads', { params });
  return res.data;
};

// ─── Create a lead ────────────────────────────────────────────────────────────
export const createLead = async (data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: 'Hot' | 'Warm' | 'Cold';
  value?: string;
  notes?: string;
  source?: string;
}) => {
  const res = await API.post('/api/leads', data);
  return res.data;
};

// ─── Update a lead ────────────────────────────────────────────────────────────
export const updateLead = async (id: string, data: Partial<Lead>) => {
  const res = await API.put(`/api/leads/${id}`, data);
  return res.data;
};

// ─── Delete a lead ────────────────────────────────────────────────────────────
export const deleteLead = async (id: string) => {
  const res = await API.delete(`/api/leads/${id}`);
  return res.data;
};
