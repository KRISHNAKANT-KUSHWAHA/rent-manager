import api from './axios';

export const getAgreements = async (params = {}) => {
  const res = await api.get('/agreements', { params });
  return res.data;
};

export const getAgreement = async (id) => {
  const res = await api.get(`/agreements/${id}`);
  return res.data;
};

export const createAgreement = async (data) => {
  const res = await api.post('/agreements', data);
  return res.data;
};

export const renewAgreement = async (id, data) => {
  const res = await api.post(`/agreements/${id}/renew`, data);
  return res.data;
};

export const refundDeposit = async (id, data) => {
  const res = await api.post(`/agreements/${id}/refund-deposit`, data);
  return res.data;
};

export const getAgreementPdfUrl = (id) => `/api/agreements/${id}/pdf`;

