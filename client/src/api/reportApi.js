import api from './axios';

export const getReportsData = async (params = {}) => {
  const res = await api.get('/reports/analytics', { params });
  return res.data;
};

export const getExportCsvUrl = (type) => `/api/reports/export-csv?type=${type}`;

