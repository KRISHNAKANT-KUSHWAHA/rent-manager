import api from './axios';

export const generateMonthlyInvoices = async (month) => {
  const res = await api.post('/rent/generate-invoices', { month });
  return res.data;
};

export const getInvoices = async (params = {}) => {
  const res = await api.get('/rent/invoices', { params });
  return res.data;
};

export const getInvoice = async (id) => {
  const res = await api.get(`/rent/invoices/${id}`);
  return res.data;
};

export const recordRentPayment = async (data) => {
  const res = await api.post('/rent/payments', data);
  return res.data;
};

export const getRentPayments = async (params = {}) => {
  const res = await api.get('/rent/payments', { params });
  return res.data;
};

export const getReceiptPdfUrl = (paymentId) => `/api/rent/receipts/${paymentId}/pdf`;

