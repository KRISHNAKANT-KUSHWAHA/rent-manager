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
import Table from '../components/common/Table';
import SearchFilterBar from '../components/common/SearchFilterBar';
import {
  FolderLock,
  Upload,
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

      await uploadDocument(formData);
      toast.success('Document uploaded and encrypted in storage');
      setIsUploadOpen(false);
      setDocFile(null);
      setDocTitle('');
      setDocNumber('');
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tenant document?')) return;
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Document Management"
        subtitle="Secure, private document archive for Aadhaar cards, Voter IDs, PAN cards, rental agreements, and police verification."
      >
        <Button variant="brand" icon={Upload} onClick={() => setIsUploadOpen(true)}>
          Upload Document
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search document title, ID, tenant..."
        filters={[
          {
            id: 'type',
            label: 'Document Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: 'all', label: 'All Document Types' },
              ...Object.keys(DOCUMENT_TYPE_LABELS).map((k) => ({
                value: k,
                label: DOCUMENT_TYPE_LABELS[k],
              })),
            ],
          },
          {
            id: 'tenant',
            label: 'Tenant',
            value: tenantFilter,
            onChange: setTenantFilter,
            options: [
              { value: 'all', label: 'All Tenants' },
              ...tenants.map((t) => ({ value: t._id, label: t.fullName })),
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setTypeFilter('all');
          setTenantFilter('all');
        }}
      >
        <Button size="sm" variant="secondary" onClick={fetchDocs}>
          Search
        </Button>
      </SearchFilterBar>

      {/* Documents Table */}
      <Table
        headers={[
          'Document Title & ID',
          'Document Type',
          'Tenant Name',
          'File Format',
          'Uploaded On',
          { label: 'Actions', align: 'right' },
        ]}
        loading={loading}
        empty={documents.length === 0}
        emptyTitle="No tenant documents found"
        emptyMessage="Upload tenant identity proofs or rental agreement scans."
        emptyIcon={FolderLock}
        emptyAction={
          <Button size="sm" variant="brand" onClick={() => setIsUploadOpen(true)}>
            Upload Document
          </Button>
        }
      >
        {documents.map((doc) => (
          <tr key={doc._id} className="hover:bg-slate-50/60 transition">
            <td className="py-4 px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{doc.title}</div>
                  {doc.documentNumber && (
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      No: {doc.documentNumber}
                    </div>
                  )}
                </div>
              </div>
            </td>

            <td className="py-4 px-4 sm:px-5">
              <Badge variant="slate">{DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}</Badge>
            </td>

            <td className="py-4 px-4 sm:px-5">
              <div className="font-bold text-slate-800 text-xs">
                {doc.tenant?.fullName || 'Resident'}
              </div>
              <div className="text-[11px] text-slate-400">
                Room: {doc.tenant?.currentRoom?.roomNumber || 'Vacated'}
              </div>
            </td>

            <td className="py-4 px-4 sm:px-5 font-mono text-xs text-slate-500 uppercase">
              {doc.mimeType ? doc.mimeType.split('/')[1] : 'FILE'} •{' '}
              {Math.round((doc.fileSize || 0) / 1024)} KB
            </td>

            <td className="py-4 px-4 sm:px-5 text-slate-600 text-xs font-medium">
              {formatDate(doc.createdAt)}
            </td>

            <td className="py-4 px-4 sm:px-5 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <a
                  href={`/api/documents/${doc._id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleDelete(doc._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Tenant Document"
        subtitle="Documents are kept in private local storage and accessible only to the authenticated owner."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <Select
            label="Associate With Tenant"
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          >
            <option value="">-- Choose Tenant --</option>
            {tenants.map((t) => (
              <option key={t._id} value={t._id}>
                {t.fullName} (Room: {t.currentRoom?.roomNumber || 'None'})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Document Type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              options={Object.keys(DOCUMENT_TYPE_LABELS).map((k) => ({
                value: k,
                label: DOCUMENT_TYPE_LABELS[k],
              }))}
            />
            <Input
              label="Document / ID Number (Optional)"
              placeholder="e.g. 1234-5678-9012"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
            />
          </div>

          <Input
            label="Document Title / Label"
            placeholder="e.g. Aadhaar Card Front & Back"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select File (PDF, JPG, PNG - Max 10MB)
            </label>
            <input
              type="file"
              required
              accept="application/pdf,image/*"
              onChange={(e) => setDocFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" loading={uploading}>
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsPage;
