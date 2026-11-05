import API from './api';

export const submitWaitlistApplication = async (payload: Record<string, any>) => {
  const response = await API.post('/api/waitlist/apply', payload);
  return response.data;
};

export const getWaitlistAdminData = async () => {
  const response = await API.get('/api/waitlist/admin');
  return response.data;
};

export const updateWaitlistStatus = async (id: string, status: string) => {
  const response = await API.patch(`/api/waitlist/${id}/status`, { status });
  return response.data;
};

export const createWaitlistInvitation = async (id: string) => {
  const response = await API.post(`/api/waitlist/${id}/invite`);
  return response.data;
};

export const acceptWaitlistInvitation = async (token: string) => {
  const response = await API.post('/api/waitlist/accept', { token });
  return response.data;
};
