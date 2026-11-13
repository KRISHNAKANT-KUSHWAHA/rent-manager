import api from './axios';

export const getDocuments = async (params = {}) => {
  const res = await api.get('/documents', { params });
  return res.data;
};

export const uploadDocument = async (formData) => {
  const res = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteDocument = async (id) => {
  const res = await api.delete(`/documents/${id}`);
  return res.data;
};

export const getDocumentViewUrl = (id) => `/api/documents/${id}/view`;
export const getDocumentDownloadUrl = (id) => `/api/documents/${id}/download`;

