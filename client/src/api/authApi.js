import api from './axios';

export const getAuthStatus = async () => {
  const res = await api.get('/auth/status');
  return res.data;
};

export const loginOwner = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const setupOwner = async (setupData) => {
  const res = await api.post('/auth/setup', setupData);
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const logoutOwner = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

export const changePassword = async (data) => {
  const res = await api.put('/auth/change-password', data);
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.put('/auth/profile', data);
  return res.data;
};

export const resetData = async (mode = 'tenancies') => {
  const res = await api.post('/auth/reset-data', { mode });
  return res.data;
};
