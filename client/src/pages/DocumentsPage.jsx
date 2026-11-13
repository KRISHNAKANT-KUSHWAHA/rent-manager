import React, { useState, useEffect } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../api/documentApi';
import { getTenants } from '../api/tenantApi';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { DOCUMENT_TYPE_LABELS } from '../utils/constants';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import {
  FolderLock,
  Upload,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [docFile, setDocFile] = useState(null);
  const [tenantId, setTenantId] = useState('');
  const [docType, setDocType] = useState('aadhaar');
  const [docTitle, setDocTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');

  const toast = useToast();

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await getDocuments({
        search,
        documentType: typeFilter,
        tenantId: tenantFilter,
      });
      if (res.success) {
        setDocuments(res.documents);
      }
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantsList = async () => {
    try {
      const res = await getTenants();
      if (res.success) setTenants(res.tenants);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchTenantsList();
  }, [typeFilter, tenantFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocs();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!docFile || !tenantId) {
      toast.error('Please select both a tenant and file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', docFile);
      formData.append('tenantId', tenantId);
      formData.append('documentType', docType);
      formData.append('title', docTitle || DOCUMENT_TYPE_LABELS[docType]);
      formData.append('documentNumber', docNumber);

      const res = await uploadDocument(formData);
      toast.success(res.message || 'Document uploaded securely');
      setIsUploadOpen(false);
      setDocFile(null);
      setDocTitle('');
      setDocNumber('');
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await deleteDocument(id);
      toast.success(res.message || 'Document deleted');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Management"
        subtitle="Secure private repository for tenant Aadhaar cards, Voter IDs, Agreements, and Address proofs."
      >
        <Button variant="primary" icon={Upload} onClick={() => setIsUploadOpen(true)}>
          Upload Document
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <Input
            placeholder="Search document title, filename..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-48">
            <Select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
            >
              <option value="all">All Tenants</option>
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-48">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Document Types</option>
              {Object.keys(DOCUMENT_TYPE_LABELS).map((k) => (
                <option key={k} value={k}>
                  {DOCUMENT_TYPE_LABELS[k]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Documents Grid / Table */}
      {loading ? (
        <Skeleton className="h-64" count={3} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FolderLock}
          title="No documents uploaded yet"
          description="Upload tenant identity proofs or signed agreements."
          actionLabel="Upload Document"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Document Details</th>
                  <th className="py-4 px-6">Document Type</th>
                  <th className="py-4 px-6">Tenant Name</th>
                  <th className="py-4 px-6">File Size</th>
                  <th className="py-4 px-6">Uploaded Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{doc.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {doc.originalName} {doc.documentNumber && `• Ref: ${doc.documentNumber}`}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant="indigo">
                        {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.tenant?.fullName || 'Tenant'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-mono">
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      {formatDate(doc.createdAt)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/documents/${doc._id}/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                          title="Preview in Browser"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`/api/documents/${doc._id}/download`}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 transition"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Tenant Document"
        subtitle="Documents are stored in a private directory with owner-authenticated access only."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <Select
            label="Select Tenant"
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          >
            <option value="">-- Choose Tenant --</option>
            {tenants.map((t) => (
              <option key={t._id} value={t._id}>
                {t.fullName} ({t.currentRoom?.roomNumber || 'Vacated'})
              </option>
            ))}
          </Select>

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
            placeholder="e.g. Aadhaar Card Front & Back"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
          />

          <Input
            label="Document Ref / Card Number (Optional)"
            placeholder="e.g. XXXX-XXXX-4589"
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

export default DocumentsPage;

