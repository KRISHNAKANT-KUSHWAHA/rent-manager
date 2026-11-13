import api from './axios';

export const getMeters = async () => {
  const res = await api.get('/electricity/meters');
  return res.data;
};

export const recordReading = async (formData) => {
  const res = await api.post('/electricity/readings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getReadings = async (params = {}) => {
  const res = await api.get('/electricity/readings', { params });
  return res.data;
};

export const updateReading = async (id, data) => {
  const res = await api.put(`/electricity/readings/${id}`, data);
  return res.data;
};

export const deleteReading = async (id) => {
  const res = await api.delete(`/electricity/readings/${id}`);
  return res.data;
};

export const getBills = async (params = {}) => {
  const res = await api.get('/electricity/bills', { params });
  return res.data;
};

export const updateBill = async (id, data) => {
  const res = await api.put(`/electricity/bills/${id}`, data);
  return res.data;
};

export const deleteBill = async (id) => {
  const res = await api.delete(`/electricity/bills/${id}`);
  return res.data;
};

export const recordElectricityPayment = async (data) => {
  const res = await api.post('/electricity/payments', data);
  return res.data;
};

export const getElectricityBillPdfUrl = (billId) => `/api/electricity/bills/${billId}/pdf`;

