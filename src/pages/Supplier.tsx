import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSave,
  FaSpinner,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaTags,
  FaCheckCircle,
  FaTimesCircle,
  FaCopy,
} from 'react-icons/fa';
import "./Supplier.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Supplier {
  id: string;
  name: string;
  supplierName: string;
  supplierType: string;
  supplierGroup: string;
  country: string;
  defaultCurrency: string;
  language: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  taxId: string;
  taxCategory: string;
  paymentTerms: string;
  defaultBankAccount: string;
  defaultPriceList: string;
  website: string;
  supplierDetails: string;
  isTransporter: boolean;
  isInternalSupplier: boolean;
  onHold: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

interface SupplierDisplay {
  id: string;
  supplierName: string;
  supplierType: string;
  supplierGroup: string;
  country: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  isTransporter: boolean;
  isInternalSupplier: boolean;
  onHold: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: number;
  message: string;
  data: {
    records: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface EditFormState {
  id: string;
  supplierName: string;
  supplierType: string;
  supplierGroup: string;
  country: string;
  defaultCurrency: string;
  language: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  taxId: string;
  taxCategory: string;
  paymentTerms: string;
  defaultBankAccount: string;
  defaultPriceList: string;
  website: string;
  supplierDetails: string;
  isTransporter: boolean;
  isInternalSupplier: boolean;
  onHold: boolean;
  status: 'Active' | 'Inactive';
}

export default function SupplierList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [suppliers, setSuppliers] = useState<SupplierDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDisplay | null>(null);
  const [supplierGroups, setSupplierGroups] = useState<string[]>([]);

  // ─── Edit Modal State ──────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ─── View Modal State ──────────────────────────────────────────────────
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewSupplier, setViewSupplier] = useState<SupplierDisplay | null>(null);

  const supplierTypes = ['Company', 'Individual', 'Partnership', 'Proprietorship', 'LLP', 'Trust', 'Society'];
  const countries = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan', 'UAE', 'Singapore'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  const languages = ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ar'];
  const taxCategories = ['Registered Regular', 'Registered Composition', 'Unregistered', 'SEZ', 'Export Oriented'];
  const paymentTerms = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'Due on Receipt'];
  const priceLists = ['Standard Buying', 'Export Pricing', 'Wholesale', 'Distributor'];
  const statusOptions = ['Active', 'Inactive'];

  // Format date to "X h" or "X d" format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo`;
    return `${Math.floor(diffDays / 365)} y`;
  };

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>(`/supplier?page=${currentPage}&limit=${itemsPerPage}`);

      if (response.data && response.data.success === 1) {
        const records = response.data.data?.records || [];
        const total = response.data.data?.total || 0;
        const totalPagesCount = response.data.data?.totalPages || 1;

        setTotalSuppliers(total);
        setTotalPages(totalPagesCount);

        // Transform API data to display format
        const transformedData: SupplierDisplay[] = records.map((item: any) => ({
          id: item.id?.toString() || '',
          supplierName: item.supplier_name || item.name || '',
          supplierType: item.supplier_type || 'Company',
          supplierGroup: item.supplier_group || 'N/A',
          country: item.country || 'N/A',
          email: item.email_id || item.email || '',
          phone: item.mobile_no || item.phone || '',
          status: item.disabled === 1 ? 'Inactive' : 'Active',
          isTransporter: item.is_transporter === 1 || item.is_transporter === true,
          isInternalSupplier: item.is_internal_supplier === 1 || item.is_internal_supplier === true,
          onHold: item.on_hold === 1 || item.on_hold === true,
          createdAt: item.created_at || '',
          updatedAt: item.updated_at || '',
        }));

        setSuppliers(transformedData);

        // Extract unique supplier groups for filter
        const groups = Array.from(new Set(transformedData.map(s => s.supplierGroup).filter(g => g && g !== 'N/A')));
        setSupplierGroups(groups);
      } else {
        setSuppliers([]);
        setTotalSuppliers(0);
        setTotalPages(1);
        if (response.data?.message) {
          setError(response.data.message);
        }
      }
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setSuppliers([]);
      setTotalSuppliers(0);
      setTotalPages(1);
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Network error - Please check your connection');
      } else if (err.response?.status === 401) {
        setError('Session expired - Please login again');
      } else {
        setError(err.response?.data?.message || 'An error occurred while fetching suppliers');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, groupFilter]);

  // Filter data based on search and status
  const filteredData = suppliers.filter(item => {
    const matchesSearch = item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && item.status === 'Active') ||
                         (statusFilter === 'inactive' && item.status === 'Inactive');
    const matchesGroup = groupFilter === 'all' || item.supplierGroup === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const totalFilteredItems = filteredData.length;
  const totalPagesFiltered = Math.ceil(totalFilteredItems / itemsPerPage);

  // Ensure current page is valid when data changes
  const validCurrentPage = Math.min(currentPage, totalPagesFiltered || 1);
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map((r) => r.id)));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllChecked(next.size === paginatedData.length);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPagesFiltered) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPagesFiltered);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPagesFiltered, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleDelete = (supplier: SupplierDisplay) => {
    setSelectedSupplier(supplier);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedSupplier) {
      try {
        const response = await api.delete(`/supplier/${selectedSupplier.id}`);
        if (response.data && response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedSupplier(null);
          toast.success(response.data.message || 'Supplier deleted successfully!');
          fetchSuppliers();
        } else {
          toast.error(response.data?.message || 'Failed to delete supplier');
        }
      } catch (err: any) {
        console.error('Error deleting supplier:', err);
        toast.error(err?.response?.data?.message || 'Failed to delete supplier');
      }
    }
  };

  const handleEdit = (supplier: SupplierDisplay) => {
    navigate(`/supplier/${supplier.id}`);
  };

  const closeEditModal = () => {
    if (editSubmitting) return;
    setShowEditModal(false);
    setEditForm(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    if (!editForm.supplierName.trim()) {
      setEditError('Supplier name is required');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      const payload = {
        id: editForm.id,
        supplier_name: editForm.supplierName.trim(),
        supplier_type: editForm.supplierType,
        supplier_group: editForm.supplierGroup || 'N/A',
        country: editForm.country,
        default_currency: editForm.defaultCurrency,
        language: editForm.language,
        email_id: editForm.email,
        mobile_no: editForm.phone,
        address: editForm.address || null,
        city: editForm.city || null,
        state: editForm.state || null,
        pincode: editForm.pincode || null,
        tax_id: editForm.taxId || null,
        tax_category: editForm.taxCategory || null,
        payment_terms: editForm.paymentTerms || null,
        default_bank_account: editForm.defaultBankAccount || null,
        default_price_list: editForm.defaultPriceList,
        website: editForm.website || null,
        supplier_details: editForm.supplierDetails || null,
        is_transporter: editForm.isTransporter ? 1 : 0,
        is_internal_supplier: editForm.isInternalSupplier ? 1 : 0,
        on_hold: editForm.onHold ? 1 : 0,
        disabled: editForm.status === 'Inactive' ? 1 : 0,
        modified_by: "Administrator",
        owner: "Administrator"
      };

      const response = await api.put('/supplier', payload);

      if (response.data && response.data.success === 1) {
        // Reflect the change immediately in the table
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === editForm.id
              ? {
                  ...s,
                  supplierName: payload.supplier_name,
                  supplierType: payload.supplier_type,
                  supplierGroup: payload.supplier_group,
                  country: payload.country,
                  email: payload.email_id,
                  phone: payload.mobile_no,
                  status: payload.disabled === 1 ? 'Inactive' : 'Active',
                }
              : s
          )
        );
        toast.success(response.data.message || 'Supplier updated successfully!');
        setShowEditModal(false);
        setEditForm(null);
      } else {
        setEditError(response.data?.message || 'Failed to update supplier');
      }
    } catch (err: any) {
      console.error('Error updating supplier:', err);
      if (err.response) {
        setEditError(err.response.data?.message || 'Failed to update supplier');
      } else if (err.request) {
        setEditError('Network error. Please check your connection.');
      } else {
        setEditError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleView = (supplier: SupplierDisplay) => {
    setViewSupplier(supplier);
    setShowViewModal(true);
  };

  const handleDuplicate = async (supplier: SupplierDisplay) => {
    setLoading(true);
    try {
      // Fetch full supplier details first
      const response = await api.get(`/supplier/${supplier.id}`);
      if (response.data && response.data.success === 1) {
        const item = response.data.data;
        const payload = {
          supplier_name: `${supplier.supplierName} (Copy)`,
          supplier_type: item.supplier_type || 'Company',
          supplier_group: item.supplier_group || 'N/A',
          country: item.country || 'India',
          default_currency: item.default_currency || 'INR',
          language: item.language || 'en',
          email_id: item.email_id || '',
          mobile_no: item.mobile_no || '',
          address: item.address || null,
          city: item.city || null,
          state: item.state || null,
          pincode: item.pincode || null,
          tax_id: item.tax_id || null,
          tax_category: item.tax_category || null,
          payment_terms: item.payment_terms || null,
          default_bank_account: item.default_bank_account || null,
          default_price_list: item.default_price_list || 'Standard Buying',
          website: item.website || null,
          supplier_details: item.supplier_details || null,
          is_transporter: item.is_transporter === 1 || item.is_transporter === true ? 1 : 0,
          is_internal_supplier: item.is_internal_supplier === 1 || item.is_internal_supplier === true ? 1 : 0,
          on_hold: item.on_hold === 1 || item.on_hold === true ? 1 : 0,
          disabled: 0,
          modified_by: "Administrator",
          owner: "Administrator"
        };

        const duplicateResponse = await api.post('/supplier', payload);
        if (duplicateResponse.data && duplicateResponse.data.success === 1) {
          toast.success(duplicateResponse.data.message || 'Supplier duplicated successfully!');
          fetchSuppliers();
        } else {
          toast.error(duplicateResponse.data?.message || 'Failed to duplicate supplier');
        }
      }
    } catch (err: any) {
      console.error('Error duplicating supplier:', err);
      toast.error(err?.response?.data?.message || 'Failed to duplicate supplier');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setGroupFilter('all');
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'supplier-status-active' : 'supplier-status-inactive';
  };

  const activeCount = suppliers.filter(s => s.status === 'Active').length;

  return (
    <div className={`supplier-page ${theme}`}>
      {/* Stats Cards */}
      {/* <div className="supplier-stats-container">
        <div className="supplier-stat-card" style={{
  background: "#adb6cd",
  border: "2px solid #22c55e",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
}}>
          <div className="supplier-stat-icon">
            <FaBuilding size={20} />
          </div>
          <div className="supplier-stat-content">
            <div className="supplier-stat-title">Total Suppliers</div>
            <div className="supplier-stat-value">{totalSuppliers}</div>
          </div>
        </div>
        <div className="supplier-stat-card" style={{
  background: "#caa8d4",
  border: "2px solid #22c55e",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
}}>
          <div className="supplier-stat-icon">
            <FaCheckCircle size={20} />
          </div>
          <div className="supplier-stat-content">
            <div className="supplier-stat-title">Active</div>
            <div className="supplier-stat-value">{activeCount}</div>
          </div>
        </div>
        <div className="supplier-stat-card" style={{
  background: "#b1d3a3",
  border: "2px solid #22c55e",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
}}>
          <div className="supplier-stat-icon">
            <FaGlobe size={20} />
          </div>
          <div className="supplier-stat-content">
            <div className="supplier-stat-title">Countries</div>
            <div className="supplier-stat-value">{new Set(suppliers.map(s => s.country)).size}</div>
          </div>
        </div>
        <div className="supplier-stat-card" style={{
  background: "#bf7a97",
  border: "2px solid #22c55e",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
}}>
          <div className="supplier-stat-icon">
            <FaTags size={20} />
          </div>
          <div className="supplier-stat-content">
            <div className="supplier-stat-title">Groups</div>
            <div className="supplier-stat-value">{supplierGroups.length}</div>
          </div>
        </div>
      </div> */}

      {/* Search and Filter Bar */}
      <div className="supplier-filter-bar">
        <div className="supplier-filter-left">
          <div className="supplier-search-wrapper">
            <FaSearch className="supplier-search-icon" />
            <input
              type="text"
              placeholder="Search suppliers by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="supplier-search-input"
            />
            {searchTerm && (
              <button className="supplier-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="supplier-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="supplier-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="supplier-filter-select"
          >
            <option value="all">All Groups</option>
            {supplierGroups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button className="supplier-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="supplier-btn-primary" onClick={() => navigate("/supplier/new")}>
            <FaPlus size={12} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all' || groupFilter !== 'all') && (
        <div className="supplier-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {statusFilter === 'active' ? 'Active' : 'Inactive'}
            </span>
          )}
          {groupFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Group:</strong> {groupFilter}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="supplier-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="supplier-loading">
          <p>Loading suppliers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="supplier-error">
          <p>{error}</p>
          <button onClick={fetchSuppliers} className="supplier-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="supplier-table-wrap">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th className="supplier-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="supplier-checkbox" />
                  </th>
                  <th className="supplier-th">Supplier Name</th>
                  <th className="supplier-th">Contact</th>
                  <th className="supplier-th">Group</th>
                  <th className="supplier-th">Status</th>
                  <th className="supplier-th supplier-th-meta">
                    <span className="supplier-count-label">{totalFilteredItems} of {totalSuppliers}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="supplier-empty-state">
                      <div className="supplier-empty-content">
                        <FaBuilding size={48} />
                        <p>No suppliers found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`supplier-tr ${selected.has(row.id) ? "supplier-tr-selected" : ""}`}
                    >
                      <td className="supplier-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="supplier-checkbox" />
                      </td>
                      <td className="supplier-td supplier-td-name">{row.supplierName}</td>
                      <td className="supplier-td">
                        <div className="supplier-contact">
                          <span className="supplier-contact-item">
                            <FaEnvelope size={10} /> {row.email || 'N/A'}
                          </span>
                          <span className="supplier-contact-item">
                            <FaPhone size={10} /> {row.phone || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="supplier-td">
                        <span className="supplier-group-badge">{row.supplierGroup}</span>
                      </td>
                      <td className="supplier-td">
                        <span className={`supplier-status-badge ${row.status === 'Active' ? 'supplier-status-active' : 'supplier-status-inactive'}`}>
                          {row.status === 'Active' ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                          {row.status}
                        </span>
                      </td>
                      <td className="supplier-td supplier-td-meta">
                        {/* <span className="supplier-ago">{formatDate(row.createdAt)}</span> */}
                        <span className="supplier-dot">·</span>
                        <div className="supplier-action-buttons">
                          <button
                            className="supplier-action-btn supplier-action-view"
                            onClick={(e) => { e.stopPropagation(); handleView(row); }}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button
                            className="supplier-action-btn supplier-action-edit"
                            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          {/* <button
                            className="supplier-action-btn supplier-action-copy"
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(row); }}
                            title="Duplicate"
                          >
                            <FaCopy size={12} />
                          </button> */}
                          <button
                            className="supplier-action-btn supplier-action-delete"
                            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="supplier-pagination">
            <div className="supplier-pagination-left">
              <span className="supplier-pagination-label">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="supplier-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="supplier-pagination-label">entries</span>
            </div>
            <div className="supplier-pagination-center">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1 || totalFilteredItems === 0}
                className="supplier-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1 || totalFilteredItems === 0}
                className="supplier-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`supplier-page-btn ${currentPage === page ? 'supplier-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPagesFiltered || totalFilteredItems === 0}
                className="supplier-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPagesFiltered || totalFilteredItems === 0}
                className="supplier-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="supplier-pagination-right">
              <span className="supplier-pagination-info">
                {totalFilteredItems > 0 ? (
                  `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                ) : (
                  'No entries to show'
                )}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedSupplier && (
        <div className="supplier-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="supplier-modal supplier-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="supplier-modal-header">
              <span className="supplier-modal-title">Confirm Delete</span>
              <button className="supplier-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="supplier-modal-body">
              <p>Are you sure you want to delete this supplier?</p>
              <p className="supplier-modal-item-name"><strong>{selectedSupplier.supplierName}</strong></p>
              <p className="supplier-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="supplier-modal-footer">
              <button className="supplier-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="supplier-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewSupplier && (
        <div className="supplier-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="supplier-modal supplier-modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="supplier-modal-header">
              <span className="supplier-modal-title">Supplier Details</span>
              <button className="supplier-modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="supplier-modal-body">
              <div className="supplier-view-grid">
                <div className="supplier-view-section">
                  <h4>Basic Information</h4>
                  <div className="supplier-view-row"><label>Name:</label><span>{viewSupplier.supplierName}</span></div>
                  <div className="supplier-view-row"><label>Type:</label><span>{viewSupplier.supplierType}</span></div>
                  <div className="supplier-view-row"><label>Group:</label><span>{viewSupplier.supplierGroup}</span></div>
                  <div className="supplier-view-row"><label>Country:</label><span>{viewSupplier.country}</span></div>
                  <div className="supplier-view-row"><label>Status:</label>
                    <span className={`supplier-status-badge ${viewSupplier.status === 'Active' ? 'supplier-status-active' : 'supplier-status-inactive'}`}>
                      {viewSupplier.status === 'Active' ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                      {viewSupplier.status}
                    </span>
                  </div>
                </div>
                <div className="supplier-view-section">
                  <h4>Contact Details</h4>
                  <div className="supplier-view-row"><label>Email:</label><span>{viewSupplier.email || 'N/A'}</span></div>
                  <div className="supplier-view-row"><label>Phone:</label><span>{viewSupplier.phone || 'N/A'}</span></div>
                </div>
                <div className="supplier-view-section supplier-view-full">
                  <h4>Additional Info</h4>
                  <div className="supplier-view-row"><label>Transporter:</label><span>{viewSupplier.isTransporter ? 'Yes' : 'No'}</span></div>
                  <div className="supplier-view-row"><label>Internal Supplier:</label><span>{viewSupplier.isInternalSupplier ? 'Yes' : 'No'}</span></div>
                  <div className="supplier-view-row"><label>On Hold:</label><span>{viewSupplier.onHold ? 'Yes' : 'No'}</span></div>
                  <div className="supplier-view-row"><label>Created:</label><span>{formatDate(viewSupplier.createdAt)}</span></div>
                  <div className="supplier-view-row"><label>Updated:</label><span>{formatDate(viewSupplier.updatedAt)}</span></div>
                </div>
              </div>
            </div>
            <div className="supplier-modal-footer">
              <button className="supplier-btn-cancel" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button className="supplier-btn-edit" onClick={() => { setShowViewModal(false); handleEdit(viewSupplier); }}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && editForm && (
        <div className="supplier-modal-overlay" onClick={closeEditModal}>
          <div className="supplier-modal supplier-modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="supplier-edit-header">
              <div className="supplier-edit-header-icon">
                <FaEdit size={16} />
              </div>
              <div className="supplier-edit-header-text">
                <span className="supplier-modal-title">Edit Supplier</span>
                <span className="supplier-edit-subtitle">Update the details for this supplier</span>
              </div>
              <button
                className="supplier-modal-close"
                onClick={closeEditModal}
                disabled={editSubmitting}
                type="button"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="supplier-modal-body">
                {editError && (
                  <div className="supplier-edit-error">
                    <FaTimes size={12} />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="supplier-edit-grid">
                  <div className="supplier-edit-field supplier-edit-field-name">
                    <label className="supplier-edit-label">
                      <FaBuilding className="supplier-edit-label-icon" />
                      Supplier Name <span className="supplier-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="supplier-edit-input"
                      value={editForm.supplierName}
                      onChange={(e) => setEditForm({ ...editForm, supplierName: e.target.value })}
                      placeholder="Enter supplier name"
                      disabled={editSubmitting}
                      autoFocus
                    />
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Supplier Type</label>
                    <select
                      className="supplier-edit-select"
                      value={editForm.supplierType}
                      onChange={(e) => setEditForm({ ...editForm, supplierType: e.target.value })}
                      disabled={editSubmitting}
                    >
                      {supplierTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Supplier Group</label>
                    <select
                      className="supplier-edit-select"
                      value={editForm.supplierGroup}
                      onChange={(e) => setEditForm({ ...editForm, supplierGroup: e.target.value })}
                      disabled={editSubmitting}
                    >
                      <option value="">Select Group</option>
                      {supplierGroups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Country</label>
                    <select
                      className="supplier-edit-select"
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      disabled={editSubmitting}
                    >
                      {countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Email</label>
                    <input
                      type="email"
                      className="supplier-edit-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Enter email"
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Phone</label>
                    <input
                      type="text"
                      className="supplier-edit-input"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="supplier-edit-field supplier-edit-field-full">
                    <label className="supplier-edit-label">Address</label>
                    <input
                      type="text"
                      className="supplier-edit-input"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Enter address"
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">City</label>
                    <input
                      type="text"
                      className="supplier-edit-input"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="Enter city"
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">State</label>
                    <input
                      type="text"
                      className="supplier-edit-input"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="Enter state"
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Pincode</label>
                    <input
                      type="text"
                      className="supplier-edit-input"
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                      placeholder="Enter pincode"
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Tax ID / GSTIN</label>
                    <input
                      type="text"
                      className="supplier-edit-input"
                      value={editForm.taxId}
                      onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                      placeholder="Enter tax ID"
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Tax Category</label>
                    <select
                      className="supplier-edit-select"
                      value={editForm.taxCategory}
                      onChange={(e) => setEditForm({ ...editForm, taxCategory: e.target.value })}
                      disabled={editSubmitting}
                    >
                      {taxCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Payment Terms</label>
                    <select
                      className="supplier-edit-select"
                      value={editForm.paymentTerms}
                      onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                      disabled={editSubmitting}
                    >
                      {paymentTerms.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Default Price List</label>
                    <select
                      className="supplier-edit-select"
                      value={editForm.defaultPriceList}
                      onChange={(e) => setEditForm({ ...editForm, defaultPriceList: e.target.value })}
                      disabled={editSubmitting}
                    >
                      {priceLists.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-edit-field">
                    <label className="supplier-edit-label">Status</label>
                    <select
                      className="supplier-edit-select"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'Active' | 'Inactive' })}
                      disabled={editSubmitting}
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-edit-field supplier-edit-field-full">
                    <label className="supplier-edit-label">Supplier Details</label>
                    <textarea
                      className="supplier-edit-textarea"
                      value={editForm.supplierDetails}
                      onChange={(e) => setEditForm({ ...editForm, supplierDetails: e.target.value })}
                      placeholder="Additional notes about the supplier..."
                      rows={3}
                      disabled={editSubmitting}
                    />
                  </div>

                  <div className="supplier-edit-field supplier-edit-field-check">
                    <input
                      type="checkbox"
                      id="isTransporter"
                      checked={editForm.isTransporter}
                      onChange={(e) => setEditForm({ ...editForm, isTransporter: e.target.checked })}
                      disabled={editSubmitting}
                    />
                    <label htmlFor="isTransporter">Is Transporter</label>
                  </div>

                  <div className="supplier-edit-field supplier-edit-field-check">
                    <input
                      type="checkbox"
                      id="isInternalSupplier"
                      checked={editForm.isInternalSupplier}
                      onChange={(e) => setEditForm({ ...editForm, isInternalSupplier: e.target.checked })}
                      disabled={editSubmitting}
                    />
                    <label htmlFor="isInternalSupplier">Internal Supplier</label>
                  </div>

                  <div className="supplier-edit-field supplier-edit-field-check">
                    <input
                      type="checkbox"
                      id="onHold"
                      checked={editForm.onHold}
                      onChange={(e) => setEditForm({ ...editForm, onHold: e.target.checked })}
                      disabled={editSubmitting}
                    />
                    <label htmlFor="onHold">On Hold</label>
                  </div>
                </div>
              </div>

              <div className="supplier-modal-footer">
                <button
                  type="button"
                  className="supplier-btn-cancel"
                  onClick={closeEditModal}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="supplier-btn-save" disabled={editSubmitting}>
                  {editSubmitting ? <FaSpinner className="supplier-spin" size={12} /> : <FaSave size={12} />}
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}