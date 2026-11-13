import api from './axios';

export const getExpenses = async (params = {}) => {
  const res = await api.get('/expenses', { params });
  return res.data;
};

export const createExpense = async (formData) => {
  const res = await api.post('/expenses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateExpense = async (id, formData) => {
  const res = await api.put(`/expenses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteExpense = async (id) => {
  const res = await api.delete(`/expenses/${id}`);
  return res.data;
};

