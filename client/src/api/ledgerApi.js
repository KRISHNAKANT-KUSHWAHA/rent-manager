import api from './axios';

export const getTenantLedger = async (tenantId, params = {}) => {
  const res = await api.get(`/ledger/tenant/${tenantId}`, { params });
  return res.data;
};

