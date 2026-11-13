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

export const getBills = async (params = {}) => {
  const res = await api.get('/electricity/bills', { params });
  return res.data;
};

export const recordElectricityPayment = async (data) => {
  const res = await api.post('/electricity/payments', data);
  return res.data;
};

export const getElectricityBillPdfUrl = (billId) => `/api/electricity/bills/${billId}/pdf`;

