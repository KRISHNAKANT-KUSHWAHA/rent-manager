import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { vacateTenant } from '../../api/tenantApi';
import { useToast } from '../../context/ToastContext';

const VacateTenantModal = ({ isOpen, onClose, tenant, onSuccess }) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [vacateData, setVacateData] = useState({
    vacatingDate: new Date().toISOString().slice(0, 10),
    depositRefundStatus: 'Refunded',
    refundAmount: '',
    deductionAmount: 0,
    deductionReason: '',
    notes: '',
  });

  useEffect(() => {
    if (tenant) {
      setVacateData({
        vacatingDate: new Date().toISOString().slice(0, 10),
        depositRefundStatus: 'Refunded',
        refundAmount: 0,
        deductionAmount: 0,
        deductionReason: '',
        notes: '',
      });
    }
  }, [tenant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setSubmitting(true);

    try {
      const res = await vacateTenant(tenant._id, {
        ...vacateData,
        refundAmount: Number(vacateData.refundAmount) || 0,
        deductionAmount: Number(vacateData.deductionAmount) || 0,
      });
      toast.success(res.message || 'Tenant vacated successfully');
      onSuccess(res.tenant);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process vacating');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vacate Tenant: ${tenant.fullName}`}
      subtitle={`Room ${tenant.currentRoom?.roomNumber || 'Room'} will become Available.`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
          <strong>Notice:</strong> Vacating marks the tenancy as terminated and releases the room. All rent invoices, payments, and electricity history will be permanently preserved in the ledger.
        </div>

        <Input
          label="Vacating Date"
          type="date"
          required
          value={vacateData.vacatingDate}
          onChange={(e) =>
            setVacateData({ ...vacateData, vacatingDate: e.target.value })
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Select
            label="Security Deposit Settlement"
            value={vacateData.depositRefundStatus}
            onChange={(e) =>
              setVacateData({ ...vacateData, depositRefundStatus: e.target.value })
            }
            options={[
              { value: 'Refunded', label: 'Refunded in Full' },
              { value: 'Partially Refunded', label: 'Partially Refunded (Deductions)' },
              { value: 'Forfeited', label: 'Forfeited' },
              { value: 'Not Applicable', label: 'Not Applicable (₹0 Deposit)' },
            ]}
          />
          <Input
            label="Refund Amount (INR)"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={vacateData.refundAmount}
            onChange={(e) =>
              setVacateData({
                ...vacateData,
                refundAmount: e.target.value.replace(/[^0-9]/g, ''),
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Deduction Amount (if any)"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={vacateData.deductionAmount}
            onChange={(e) =>
              setVacateData({
                ...vacateData,
                deductionAmount: e.target.value.replace(/[^0-9]/g, ''),
              })
            }
          />
          <Input
            label="Reason for Deductions"
            placeholder="e.g. Paint touchup / broken switch"
            value={vacateData.deductionReason}
            onChange={(e) =>
              setVacateData({ ...vacateData, deductionReason: e.target.value })
            }
          />
        </div>

        <Input
          label="Vacating Remarks & Notes"
          placeholder="e.g. Cleared all dues, keys returned"
          value={vacateData.notes}
          onChange={(e) => setVacateData({ ...vacateData, notes: e.target.value })}
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={submitting}>
            Confirm Vacate & Settle
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VacateTenantModal;
