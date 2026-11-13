import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTenant, uploadTenantPhoto } from '../api/tenantApi';
import { uploadDocument, deleteDocument } from '../api/documentApi';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency, maskAadhaar } from '../utils/formatters';
import { DOCUMENT_TYPE_LABELS } from '../utils/constants';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import {
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Home,
  Shield,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Calendar,
  CreditCard,
  BookOpen,
  ArrowLeft,
  Camera,
} from 'lucide-react';

const TenantDetailPage = () => {
  const { id } = useParams();
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Document upload form
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('aadhaar');
  const [docTitle, setDocTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');

  const toast = useToast();
  const navigate = useNavigate();

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const res = await getTenant(id);
      if (res.success) {
        setTenantData(res);
      }
    } catch (err) {
      toast.error('Failed to load tenant profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantDetails();
  }, [id]);

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!docFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', docFile);
      formData.append('tenantId', id);
      formData.append('documentType', docType);
      formData.append('title', docTitle || DOCUMENT_TYPE_LABELS[docType]);
      formData.append('documentNumber', docNumber);

      const res = await uploadDocument(formData);
      toast.success(res.message || 'Document uploaded securely');
      setIsUploadOpen(false);
      setDocFile(null);
      setDocTitle('');
      setDocNumber('');
      fetchTenantDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await deleteDocument(docId);
      toast.success(res.message || 'Document removed');
      fetchTenantDetails();
    } catch (err) {
      toast.error('Failed to remove document');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await uploadTenantPhoto(id, formData);
      toast.success('Photo updated successfully');
      fetchTenantDetails();
    } catch (err) {
      toast.error('Failed to update photo');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const { tenant, activeAgreement, allAgreements, documents, financialSummary } =
    tenantData || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate('/tenants')}
        >
          Back to Tenants
        </Button>
      </div>

      <PageHeader
        title={tenant?.fullName || 'Tenant Profile'}
        subtitle={`Registered on ${formatDate(tenant?.createdAt)} • ${tenant?.status} Tenancy`}
      >
        <Link to={`/ledger?tenantId=${tenant?._id}`}>
          <Button variant="secondary" icon={BookOpen}>
            View Financial Ledger
          </Button>
        </Link>
        <Button
          variant="primary"
          icon={Upload}
          onClick={() => setIsUploadOpen(true)}
        >
          Upload Document
        </Button>
      </PageHeader>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Personal Information */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-3xl overflow-hidden border-2 border-indigo-200 shadow-md">
                {tenant?.photoUrl ? (
                  <img
                    src={tenant.photoUrl}
                    alt={tenant.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{tenant?.fullName ? tenant.fullName[0] : 'T'}</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 rounded-lg bg-indigo-600 text-white cursor-pointer shadow hover:bg-indigo-700 transition">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <h3 className="mt-3 text-lg font-black text-slate-900">{tenant?.fullName}</h3>
            <p className="text-xs text-slate-500">{tenant?.occupation || 'Tenant'}</p>
            <Badge status={tenant?.status} className="mt-2" />
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Phone Numbers
                </span>
                <span className="font-bold text-slate-800">{tenant?.primaryMobile}</span>
                {tenant?.alternateMobile && (
                  <span className="text-slate-500 block">Alt: {tenant.alternateMobile}</span>
                )}
              </div>
            </div>

            {tenant?.email && (
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Email
                  </span>
                  <span className="font-semibold text-slate-800">{tenant.email}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Father's Name
                </span>
                <span className="font-semibold text-slate-800">{tenant?.fatherName}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Permanent Address
                </span>
                <span className="font-medium text-slate-700 leading-relaxed">
                  {tenant?.permanentAddress}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Employer / College
                </span>
                <span className="font-semibold text-slate-800">
                  {tenant?.employerOrCollege || 'Not recorded'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (2 spans): Tenancy, Identity, Documents & Balances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Tenancy Room Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-indigo-600" />
              Assigned Room & Tenancy Details
            </h4>

            {tenant?.currentRoom ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Room Number</span>
                  <span className="text-base font-black text-slate-900">
                    {tenant.currentRoom.roomNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {tenant.currentRoom.floorName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Monthly Rent</span>
                  <span className="text-base font-black text-slate-900">
                    {formatCurrency(activeAgreement?.monthlyRent || tenant.currentRoom.monthlyRent)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Security Deposit</span>
                  <span className="text-base font-black text-slate-900">
                    {formatCurrency(
                      activeAgreement?.securityDeposit || tenant.currentRoom.securityDeposit
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Move-in Date</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatDate(tenant.moveInDate)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                This tenant has vacated and has no active room assignment.
              </div>
            )}

            {/* Financial Balances Bar */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Total Rent Billed
                </span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(financialSummary?.totalRentBilled)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">
                  Total Rent Paid
                </span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(financialSummary?.totalRentPaid)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50">
                <span className="text-rose-700 block text-[10px] uppercase font-bold">
                  Remaining Outstanding
                </span>
                <span className="text-sm font-black text-rose-700">
                  {formatCurrency(financialSummary?.totalOutstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* Identity Information (Protected) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-orange-600" />
              Identity Information (Protected)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Aadhaar Number</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {tenant?.aadhaarNumber || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Voter ID Number</span>
                <span className="font-mono font-semibold text-slate-800">
                  {tenant?.voterId || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PAN Card</span>
                <span className="font-mono font-semibold text-slate-800">
                  {tenant?.panNumber || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Room Co-Occupants / Family Members Living Here */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-orange-600" />
                  Members / Co-Occupants Living In This Room ({tenant?.familyMembers?.length || 0})
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  All registered family members and roommates sharing this room.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 self-start sm:self-auto">
                Total Headcount: {(tenant?.familyMembers?.length || 0) + 1} Persons
              </span>
            </div>

            {tenant?.familyMembers && tenant.familyMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tenant.familyMembers.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{m.name}</span>
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md">
                        {m.relationship}
                      </span>
                    </div>
                    {m.age && <p className="text-[11px] text-slate-500">Age: {m.age} yrs</p>}
                    {m.phone && (
                      <p className="text-[11px] text-slate-600 font-medium">📞 {m.phone}</p>
                    )}
                    {m.occupation && <p className="text-[11px] text-slate-500">{m.occupation}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                Only the primary tenant ({tenant?.fullName}) is registered in this room.
              </div>
            )}
          </div>

          {/* Uploaded Documents List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Uploaded Tenant Documents ({documents?.length || 0})
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Private & secure document storage (Aadhaar, Voter ID, Agreement, Photo)
                </p>
              </div>
              <Button
                size="xs"
                variant="outline"
                icon={Upload}
                onClick={() => setIsUploadOpen(true)}
              >
                Upload Document
              </Button>
            </div>

            {documents && documents.length > 0 ? (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{doc.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType} •{' '}
                          {formatDate(doc.createdAt)} • {(doc.fileSize / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`/api/documents/${doc._id}/view`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={`/api/documents/${doc._id}/download`}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-indigo-600 transition"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc._id)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No identity or agreement documents uploaded yet for this tenant.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title={`Upload Document for ${tenant?.fullName}`}
        subtitle="Upload Aadhaar card, Voter ID, Agreement, or Police Verification."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDocumentUpload} className="space-y-4">
          <Select
            label="Document Type"
            required
            value={docType}
            onChange={(e) => {
              setDocType(e.target.value);
              setDocTitle(DOCUMENT_TYPE_LABELS[e.target.value] || '');
            }}
            options={Object.keys(DOCUMENT_TYPE_LABELS).map((k) => ({
              value: k,
              label: DOCUMENT_TYPE_LABELS[k],
            }))}
          />

          <Input
            label="Document Title"
            required
            placeholder="e.g. Front & Back Aadhaar Card"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
          />

          <Input
            label="Document ID / Number (Optional)"
            placeholder="e.g. XXXX-XXXX-1234 or Voter ID"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select File (PDF, JPG, PNG) <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              required
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={(e) => setDocFile(e.target.files[0])}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={uploading}>
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TenantDetailPage;

