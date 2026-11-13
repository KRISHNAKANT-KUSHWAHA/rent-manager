import api from './axios';

export const getTenants = async (params = {}) => {
  const res = await api.get('/tenants', { params });
  return res.data;
};

export const getTenant = async (id) => {
  const res = await api.get(`/tenants/${id}`);
  return res.data;
};

export const createTenant = async (data) => {
  const res = await api.post('/tenants', data);
  return res.data;
};

export const updateTenant = async (id, data) => {
  const res = await api.put(`/tenants/${id}`, data);
  return res.data;
};

export const vacateTenant = async (id, data) => {
  const res = await api.post(`/tenants/${id}/vacate`, data);
  return res.data;
};

export const deleteTenant = async (id) => {
  const res = await api.delete(`/tenants/${id}`);
  return res.data;
};

export const uploadTenantPhoto = async (id, formData) => {
  const res = await api.post(`/tenants/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

