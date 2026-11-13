import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getTenants } from '../api/tenantApi';
import { getRooms } from '../api/roomApi';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Table from '../components/common/Table';
import SearchFilterBar from '../components/common/SearchFilterBar';
import RegisterTenantModal from '../components/tenants/RegisterTenantModal';
import EditTenantModal from '../components/tenants/EditTenantModal';
import VacateTenantModal from '../components/tenants/VacateTenantModal';
import { Users, Plus, Phone, Home, Eye, LogOut, Pencil } from 'lucide-react';
import { useDataCache, invalidateCache } from '../hooks/useDataCache';

const TenantsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVacateOpen, setIsVacateOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Cached data: Instant SWR rendering (0ms on route switch)
  const tenantFetcher = useCallback(async () => {
    const res = await getTenants({ search, status: statusFilter });
    return res.success ? res.tenants : [];
  }, [search, statusFilter]);

  const {
    data: tenantsData,
    setData: setTenants,
    loading,
    refresh: fetchTenants,
  } = useDataCache(`tenants-${statusFilter}-${search}`, tenantFetcher, { initialData: [] });
  const tenants = tenantsData || [];

  const roomFetcher = useCallback(async () => {
    const res = await getRooms({ status: 'Available' });
    return res.success ? res.rooms : [];
  }, []);

  const {
    data: roomsData,
    refresh: fetchAvailableRooms,
  } = useDataCache('rooms-available', roomFetcher, { initialData: [] });
  const availableRooms = roomsData || [];

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsRegisterOpen(true);
    }
  }, [searchParams]);

  // Optimistic UI updates
  const handleRegisterSuccess = (newTenant) => {
    if (newTenant) {
      setTenants((prev) => [newTenant, ...(prev || [])]);
    }
    invalidateCache('tenants');
    invalidateCache('rooms');
    fetchTenants();
    fetchAvailableRooms();
  };

  const handleEditSuccess = (updatedTenant) => {
    if (updatedTenant) {
      setTenants((prev) =>
        (prev || []).map((t) => (t._id === updatedTenant._id ? { ...t, ...updatedTenant } : t))
      );
    }
    invalidateCache('tenants');
    invalidateCache('rooms');
    fetchTenants();
    fetchAvailableRooms();
  };

  const handleVacateSuccess = (vacatedTenant) => {
    if (vacatedTenant) {
      setTenants((prev) =>
        (prev || []).map((t) =>
          t._id === vacatedTenant._id
            ? { ...t, status: 'Vacated', currentRoom: null }
            : t
        )
      );
    }
    invalidateCache('tenants');
    invalidateCache('rooms');
    fetchTenants();
    fetchAvailableRooms();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Tenant Management"
        subtitle="Maintain tenant profiles, family & emergency contacts, identity documents, and tenancy records."
      >
        <Button
          variant="brand"
          icon={Plus}
          onClick={() => setIsRegisterOpen(true)}
        >
          Register New Tenant
        </Button>
      </PageHeader>

      {/* Filter and Search */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search tenant name, phone, occupation..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Tenants' },
              { value: 'Active', label: 'Active Tenancies' },
              { value: 'Vacated', label: 'Past Vacated Tenants' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setStatusFilter('all');
        }}
      >
        <Button size="sm" variant="secondary" onClick={fetchTenants}>
          Search
        </Button>
      </SearchFilterBar>

      {/* Tenants Table */}
      <Table
        headers={[
          'Tenant Name & Profession',
          'Assigned Room',
          'Phone Number',
          'Aadhaar / ID',
          'Move-in Date',
          'Status',
          { label: 'Actions', align: 'right' },
        ]}
        loading={loading}
        empty={tenants.length === 0}
        emptyTitle="No tenants found"
        emptyMessage="Register a new tenant to assign them to an available room."
        emptyIcon={Users}
        emptyAction={
          <Button size="sm" variant="brand" onClick={() => setIsRegisterOpen(true)}>
            Register Tenant
          </Button>
        }
      >
        {tenants.map((tenant) => (
          <tr key={tenant._id} className="hover:bg-slate-50/60 transition">
            <td className="py-4 px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200">
                  {tenant.fullName ? tenant.fullName[0] : 'T'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {tenant.fullName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    Father: {tenant.fatherName} • {tenant.occupation || 'Resident'}
                  </div>
                </div>
              </div>
            </td>

            <td className="py-4 px-4 sm:px-5">
              {tenant.currentRoom ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800 font-bold text-xs">
                    <Home className="w-3.5 h-3.5 text-slate-500" />
                    <span>{tenant.currentRoom.roomNumber}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    👥 {tenant.familyMembers?.length ? tenant.familyMembers.length + 1 : 1} {tenant.familyMembers?.length ? 'occupants' : 'occupant'}
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 font-medium text-xs">None (Vacated)</span>
              )}
            </td>

            <td className="py-4 px-4 sm:px-5 font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{tenant.primaryMobile}</span>
              </div>
            </td>

            <td className="py-4 px-4 sm:px-5 font-mono text-slate-600 text-xs">
              {tenant.aadhaarNumber || '—'}
            </td>

            <td className="py-4 px-4 sm:px-5 text-slate-600 text-xs font-medium">
              {formatDate(tenant.moveInDate)}
            </td>

            <td className="py-4 px-4 sm:px-5">
              <Badge status={tenant.status} />
            </td>

            <td className="py-4 px-4 sm:px-5 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={Eye}
                  onClick={() => navigate(`/tenants/${tenant._id}`)}
                >
                  Profile
                </Button>

                {tenant.status === 'Active' && (
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                    icon={Pencil}
                    title="Edit tenant"
                    onClick={() => {
                      setSelectedTenant(tenant);
                      setIsEditOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                )}

                {tenant.status === 'Active' && (
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                    icon={LogOut}
                    title="Vacate room"
                    onClick={() => {
                      setSelectedTenant(tenant);
                      setIsVacateOpen(true);
                    }}
                  >
                    Vacate
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {/* Isolated Modals with Self-Contained State */}
      <RegisterTenantModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        availableRooms={availableRooms}
        onSuccess={handleRegisterSuccess}
      />

      <EditTenantModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        tenant={selectedTenant}
        availableRooms={availableRooms}
        onSuccess={handleEditSuccess}
      />

      <VacateTenantModal
        isOpen={isVacateOpen}
        onClose={() => setIsVacateOpen(false)}
        tenant={selectedTenant}
        onSuccess={handleVacateSuccess}
      />
    </div>
  );
};

export default TenantsPage;
