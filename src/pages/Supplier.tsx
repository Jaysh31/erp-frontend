import { useState, useEffect, useRef, type FormEvent } from "react";
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
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronRight as FaChevronRightIcon,
  FaUser,
  FaStar,
  FaGlobe,
  FaUniversity,
  FaCalendarAlt,
} from 'react-icons/fa';
import "./Supplier.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import React from "react";

interface Contact {
  id: number;
  supplier_id: number;
  first_name: string;
  last_name: string;
  contact_name: string;
  mobile_no: string;
  alternate_mobile: string;
  email_id: string;
  telephone: string;
  extension: string;
  is_primary: number;
  is_billing_contact: number;
  is_saler_contact: number;
  is_purchase_contact?: number;
  remarks: string;
}

interface BankDetail {
  id: number;
  supplier_id?: number;
  account_holder_name: string;
  account_type: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  micr_code?: string;
  swift_code?: string;
  iban?: string;
  upi_id?: string;
  currency: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  verified: number;
  verified_by?: string;
  verified_on?: string;
  is_primary: number;
  remarks?: string;
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
  website: string;
  contacts: Contact[];
  bankDetails: BankDetail[];
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Edit Modal State ──────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ─── View Modal State ──────────────────────────────────────────────────
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewSupplier, setViewSupplier] = useState<SupplierDisplay | null>(null);

  // ─── Bank Accounts Modal State ────────────────────────────────────────
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankModalSupplier, setBankModalSupplier] = useState<SupplierDisplay | null>(null);

  // ─── Date Range Filter State (From - To, same UI as Purchase Order) ───
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [tempFrom, setTempFrom] = useState<Date | null>(null);
  const [tempTo, setTempTo] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  const supplierTypes = ['Company', 'Individual', 'Partnership', 'Proprietorship', 'LLP', 'Trust', 'Society'];
  const countries = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan', 'UAE', 'Singapore'];
  const taxCategories = ['Registered Regular', 'Registered Composition', 'Unregistered', 'SEZ', 'Export Oriented'];
  const paymentTerms = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'Due on Receipt'];
  const priceLists = ['Standard Buying', 'Export Pricing', 'Wholesale', 'Distributor'];
  const statusOptions = ['Active', 'Inactive'];

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

  // ─── Date Range Filter Helpers ─────────────────────────────────────────
  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateShort = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const isSameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const dateButtonLabel =
    dateFrom && dateTo ? `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}` : 'From - To';

  const getCalendarDays = (monthDate: Date): (Date | null)[] => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const openDatePicker = () => {
    setTempFrom(dateFrom);
    setTempTo(dateTo);
    setCalendarMonth(dateFrom || new Date());
    setShowDatePicker((prev) => !prev);
  };

  const handleDayClick = (day: Date) => {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(day);
      setTempTo(null);
    } else if (day < tempFrom) {
      setTempTo(tempFrom);
      setTempFrom(day);
    } else {
      setTempTo(day);
    }
  };

  const setQuickRange = (type: 'today' | '7days' | '30days' | 'month') => {
    const now = new Date();
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from: Date;
    let to: Date;
    switch (type) {
      case 'today':
        from = todayOnly;
        to = todayOnly;
        break;
      case '7days':
        to = todayOnly;
        from = new Date(todayOnly);
        from.setDate(from.getDate() - 6);
        break;
      case '30days':
        to = todayOnly;
        from = new Date(todayOnly);
        from.setDate(from.getDate() - 29);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = todayOnly;
        break;
    }
    setTempFrom(from);
    setTempTo(to);
    setCalendarMonth(from);
  };

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const applyDateFilter = () => {
    setDateFrom(tempFrom);
    setDateTo(tempTo);
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  const clearDateFilterOnly = () => {
    setTempFrom(null);
    setTempTo(null);
    setDateFrom(null);
    setDateTo(null);
  };

  // Close the date picker popup when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/supplier?page=${currentPage}&limit=${itemsPerPage}`;
      if (dateFrom) url += `&from=${toISODate(dateFrom)}`;
      if (dateTo) url += `&to=${toISODate(dateTo)}`;

      const response = await api.get<ApiResponse>(url);

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
          website: item.website || '',
          contacts: item.contacts || [],
          bankDetails: item.bank_details || [],
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
  }, [currentPage, itemsPerPage, dateFrom, dateTo]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, groupFilter, dateFrom, dateTo]);

  // Filter data based on search and status
  const filteredData = suppliers.filter(item => {
    const matchesSearch = 
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.contacts.some(contact => 
        contact.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.mobile_no.includes(searchTerm)
      );
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && item.status === 'Active') ||
      (statusFilter === 'inactive' && item.status === 'Inactive');
    const matchesGroup = groupFilter === 'all' || item.supplierGroup === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const totalFilteredItems =
    searchTerm || statusFilter !== "all" || groupFilter !== "all"
      ? filteredData.length
      : totalSuppliers;

  const totalPagesFiltered =
    searchTerm || statusFilter !== "all" || groupFilter !== "all"
      ? Math.ceil(filteredData.length / itemsPerPage)
      : totalPages;

  // Ensure current page is valid when data changes
  const validCurrentPage = Math.min(currentPage, totalPagesFiltered || 1);
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

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

  // 🔧 FIXED: Better error handling and debugging for delete
  const confirmDelete = async () => {
    if (!selectedSupplier) return;
    
    setIsDeleting(true);
    try {
      console.log('Attempting to delete supplier with ID:', selectedSupplier.id);
      
      // Log the full URL for debugging
      const deleteUrl = `/supplier/${selectedSupplier.id}`;
      console.log('DELETE URL:', deleteUrl);
      
      const response = await api.delete(deleteUrl);
      console.log('Delete response:', response);
      
      if (response.data && response.data.success === 1) {
        setShowDeleteConfirm(false);
        setSelectedSupplier(null);
        toast.success(response.data.message || 'Supplier deleted successfully!');
        // Refresh the supplier list
        await fetchSuppliers();
      } else {
        const errorMsg = response.data?.message || 'Failed to delete supplier';
        console.error('Delete failed:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error in delete operation:', err);
      
      // More detailed error logging
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        toast.error(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        toast.error('No response from server. Please check your connection and CORS settings.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message);
        toast.error('Failed to send delete request. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // 🔧 FIXED: Edit function now opens modal instead of navigating
  const handleEdit = (supplier: SupplierDisplay) => {
    setEditForm({
      id: supplier.id,
      supplierName: supplier.supplierName,
      supplierType: supplier.supplierType || 'Company',
      supplierGroup: supplier.supplierGroup !== 'N/A' ? supplier.supplierGroup : '',
      country: supplier.country !== 'N/A' ? supplier.country : 'India',
      defaultCurrency: 'INR',
      language: 'English',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      taxId: '',
      taxCategory: 'Registered Regular',
      paymentTerms: '30 Days',
      defaultBankAccount: '',
      defaultPriceList: 'Standard Buying',
      website: supplier.website || '',
      supplierDetails: '',
      isTransporter: supplier.isTransporter || false,
      isInternalSupplier: supplier.isInternalSupplier || false,
      onHold: supplier.onHold || false,
      status: supplier.status || 'Active'
    });
    setShowEditModal(true);
    setEditError(null);
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

  const handleViewBankAccounts = (supplier: SupplierDisplay) => {
    setBankModalSupplier(supplier);
    setShowBankModal(true);
  };

  const handleAddBankAccount = (supplier: SupplierDisplay) => {
    navigate('/bank-details', {
      state: {
        embedContext: {
          returnPath: `/supplier/${supplier.id}`,
          partyType: 'Supplier',
          partyId: supplier.id,
          supplierName: supplier.supplierName,
          isPendingSupplier: true,
        },
      },
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setGroupFilter('all');
    clearDateFilterOnly();
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(
      (currentPage - 1) * itemsPerPage + paginatedData.length,
      totalSuppliers
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="supplier-status-badge supplier-status-active"><FaCheckCircle /> Active</span>;
      case 'Inactive':
        return <span className="supplier-status-badge supplier-status-inactive"><FaTimesCircle /> Inactive</span>;
      default:
        return <span className="supplier-status-badge">{status}</span>;
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getContactTypeLabel = (contact: Contact) => {
    const types = [];
    if (contact.is_billing_contact) types.push('Billing');
    if (contact.is_saler_contact || (contact as any).is_purchase_contact) types.push('Sales');
    if (!contact.is_primary && !contact.is_billing_contact && !(contact.is_saler_contact || (contact as any).is_purchase_contact)) {
      return null;
    }
    if (contact.is_primary && types.length === 0) return 'Primary';
    return types.length > 0 ? types.join(' • ') : 'General';
  };

  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={`supplier-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="supplier-filter-bar">
        <div className="supplier-filter-left">
          <div className="supplier-search-wrapper">
            <FaSearch className="supplier-search-icon" />
            <input
              type="text"
              placeholder="Search suppliers by name, email, phone, or ID..."
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

          {/* ─── From - To Date Filter Button + Calendar Popup ─────────── */}
          <div ref={datePickerRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={openDatePicker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #d1d5db)',
                background: 'var(--card-bg, #ffffff)',
                color: 'var(--text-primary, #1f2937)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <FaCalendarAlt size={13} style={{ color: 'var(--primary-color, #2563eb)' }} />
              {dateButtonLabel}
              <FaChevronDown size={10} style={{ opacity: 0.6 }} />
            </button>

            {showDatePicker && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 50,
                  width: '300px',
                  background: 'var(--card-bg, #ffffff)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border-color, #e5e7eb)',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #1f2937)' }}>
                    Filter by Date
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #6b7280)' }}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Quick range chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px 14px' }}>
                  {[
                    { label: 'Today', type: 'today' as const },
                    { label: 'Last 7 Days', type: '7days' as const },
                    { label: 'Last 30 Days', type: '30days' as const },
                    { label: 'This Month', type: 'month' as const },
                  ].map((q) => (
                    <button
                      key={q.type}
                      type="button"
                      onClick={() => setQuickRange(q.type)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '12px',
                        borderRadius: '999px',
                        border: '1px solid var(--border-color, #d1d5db)',
                        background: 'var(--hover-bg, #f3f4f6)',
                        color: 'var(--text-primary, #374151)',
                        cursor: 'pointer',
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* Month navigation */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 14px',
                  }}
                >
                  <button
                    type="button"
                    onClick={prevMonth}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary, #374151)' }}
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary, #1f2937)' }}>
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary, #374151)' }}
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>

                {/* Weekday header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    padding: '4px 10px 0 10px',
                    textAlign: 'center',
                  }}
                >
                  {weekdayLabels.map((wd) => (
                    <span key={wd} style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)', padding: '4px 0' }}>
                      {wd}
                    </span>
                  ))}
                </div>

                {/* Day grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    padding: '0 10px 10px 10px',
                    textAlign: 'center',
                  }}
                >
                  {getCalendarDays(calendarMonth).map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />;

                    const isFrom = isSameDay(day, tempFrom);
                    const isTo = isSameDay(day, tempTo);
                    const inRange =
                      tempFrom && tempTo && day > tempFrom && day < tempTo;
                    const isEndpoint = isFrom || isTo;

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        style={{
                          margin: '2px 0',
                          padding: '6px 0',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: isEndpoint
                            ? 'var(--primary-color, #2563eb)'
                            : inRange
                            ? 'var(--primary-color-light, #dbeafe)'
                            : 'transparent',
                          color: isEndpoint ? '#ffffff' : 'var(--text-primary, #1f2937)',
                          fontWeight: isEndpoint ? 600 : 400,
                        }}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Footer actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    padding: '10px 14px',
                    borderTop: '1px solid var(--border-color, #e5e7eb)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTempFrom(null);
                      setTempTo(null);
                    }}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color, #d1d5db)',
                      background: 'var(--card-bg, #ffffff)',
                      color: 'var(--text-primary, #374151)',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyDateFilter}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--primary-color, #2563eb)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="supplier-btn-primary" onClick={() => navigate("/supplier/new")}>
            <FaPlus size={12} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all' || groupFilter !== 'all' || (dateFrom && dateTo)) && (
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
          {dateFrom && dateTo && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Date:</strong> {formatDateShort(dateFrom)} – {formatDateShort(dateTo)}
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
                  <th className="supplier-th" style={{ width: '30px' }}></th>
                  <th className="supplier-th">Supplier Name</th>
                  <th className="supplier-th">Contact</th>
                  <th className="supplier-th">Group</th>
                  <th className="supplier-th">Bank Accounts</th>
                  <th className="supplier-th">Status</th>
                  <th className="supplier-th supplier-th-meta">
                    <span className="supplier-count-label">{totalFilteredItems} of {totalSuppliers}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="supplier-empty-state">
                      <div className="supplier-empty-content">
                        <FaBuilding size={48} />
                        <p>No suppliers found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, _index) => {
                    const isExpanded = expandedRows.has(row.id);
                    const hasContacts = row.contacts && row.contacts.length > 0;
                    const hasBankAccounts = row.bankDetails && row.bankDetails.length > 0;

                    return (
                      <React.Fragment key={row.id}>
                        <tr 
                          className={`supplier-tr ${isExpanded ? 'supplier-tr-expanded' : ''}`}
                          onClick={() => toggleRow(row.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="supplier-td" style={{ textAlign: 'center', padding: '8px 4px' }}>
                            {hasContacts && (
                              <button 
                                className="supplier-expand-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(row.id);
                                }}
                              >
                                {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRightIcon size={10} />}
                              </button>
                            )}
                          </td>
                          <td className="supplier-td">
                            <div className="supplier-info">
                              <div className="supplier-avatar">
                                {row.supplierName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="supplier-name">{row.supplierName}</div>
                                {row.website && (
                                  <div className="supplier-website">
                                    <FaGlobe className="supplier-icon-small" />
                                    {row.website}
                                  </div>
                                )}
                                {hasContacts && (
                                  <div className="supplier-contact-count">
                                    <FaUser size={10} />
                                    <span>{row.contacts.length} contact{row.contacts.length > 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="supplier-td">
                            <div className="supplier-contact">
                              {row.email && (
                                <span className="supplier-contact-item">
                                  <FaEnvelope size={10} /> {row.email}
                                </span>
                              )}
                              {row.phone && (
                                <span className="supplier-contact-item">
                                  <FaPhone size={10} /> {row.phone}
                                </span>
                              )}
                              {!row.email && !row.phone && 'N/A'}
                            </div>
                          </td>
                          <td className="supplier-td">
                            <span className="supplier-group-badge">{row.supplierGroup}</span>
                          </td>
                          <td className="supplier-td" onClick={(e) => e.stopPropagation()}>
                            {hasBankAccounts ? (
                              <button
                                type="button"
                                className="supplier-bank-badge"
                                onClick={() => handleViewBankAccounts(row)}
                                title="View bank account details"
                              >
                                <FaUniversity size={11} />
                                {row.bankDetails.length} Account{row.bankDetails.length > 1 ? 's' : ''}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="supplier-bank-add-btn"
                                onClick={() => handleAddBankAccount(row)}
                                title="Add a bank account for this supplier"
                              >
                                <FaPlus size={10} /> Add Account
                              </button>
                            )}
                          </td>
                          <td className="supplier-td">{getStatusBadge(row.status)}</td>
                          <td className="supplier-td supplier-td-meta">
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
                              <button
                                className="supplier-action-btn supplier-action-delete"
                                onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                                title="Delete"
                                disabled={isDeleting}
                              >
                                {isDeleting && selectedSupplier?.id === row.id ? (
                                  <FaSpinner className="supplier-spin" size={12} />
                                ) : (
                                  <FaTrash size={12} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && hasContacts && (
                          <tr className="supplier-expanded-row">
                            <td colSpan={7}>
                              <div className="supplier-expanded-content">
                                <div className="supplier-contact-table-wrap">
                                  <table className="supplier-contact-table">
                                    <tbody>
                                      {row.contacts.map((contact, idx) => (
                                        <tr key={contact.id || idx} className="supplier-contact-row">
                                          <td className="supplier-contact-td" style={{ textAlign: 'center', padding: '10px 4px' }}>{idx + 1}</td>
                                          <td className="supplier-contact-td">
                                            <span className="supplier-contact-name-text">
                                              {contact.contact_name || 'Unnamed Contact'}
                                              {contact.is_primary === 1 && (
                                                <span className="supplier-contact-badge-primary">
                                                  <FaStar size={8} /> Primary
                                                </span>
                                              )}
                                            </span>
                                          </td>
                                          <td className="supplier-contact-td">
                                            {(() => {
                                              const typeLabel = getContactTypeLabel(contact);
                                              return typeLabel ? (
                                                <span className="supplier-contact-type-badge">
                                                  {typeLabel}
                                                </span>
                                              ) : (
                                                <span className="supplier-contact-type-dash">—</span>
                                              );
                                            })()}
                                          </td>
                                          <td className="supplier-contact-td">
                                            {contact.email_id ? (
                                              <a href={`mailto:${contact.email_id}`} className="supplier-contact-email-link">
                                                {contact.email_id}
                                              </a>
                                            ) : '—'}
                                          </td>
                                          <td className="supplier-contact-td">
                                            {contact.mobile_no ? (
                                              <a href={`tel:${contact.mobile_no}`} className="supplier-contact-phone-link">
                                                {contact.mobile_no}
                                              </a>
                                            ) : '—'}
                                          </td>
                                          <td className="supplier-contact-td">{contact.alternate_mobile || '—'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
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
        <div className="supplier-modal-overlay" onClick={() => !isDeleting && setShowDeleteConfirm(false)}>
          <div className="supplier-modal supplier-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="supplier-modal-header">
              <span className="supplier-modal-title">Confirm Delete</span>
              <button 
                className="supplier-modal-close" 
                onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                <FaTimes size={16} />
              </button>
            </div>
            <div className="supplier-modal-body">
              <p>Are you sure you want to delete this supplier?</p>
              <p className="supplier-modal-item-name"><strong>{selectedSupplier.supplierName}</strong></p>
              <p className="supplier-modal-warning">This action cannot be undone.</p>
              {isDeleting && (
                <div className="supplier-deleting-indicator">
                  <FaSpinner className="supplier-spin" size={16} />
                  <span>Deleting...</span>
                </div>
              )}
            </div>
            <div className="supplier-modal-footer">
              <button 
                className="supplier-btn-cancel" 
                onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="supplier-btn-delete" 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <><FaSpinner className="supplier-spin" size={12} /> Deleting...</>
                ) : (
                  <><FaTrash size={12} /> Delete</>
                )}
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
                  <div className="supplier-view-row"><label>Bank Accounts:</label><span>{viewSupplier.bankDetails?.length || 0}</span></div>
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

      {/* Bank Accounts Modal */}
      {showBankModal && bankModalSupplier && (
        <div className="supplier-modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="supplier-modal supplier-modal-bank" onClick={(e) => e.stopPropagation()}>
            <div className="supplier-bank-modal-header">
              <div className="supplier-bank-modal-header-icon">
                <FaUniversity size={16} />
              </div>
              <div className="supplier-bank-modal-header-text">
                <span className="supplier-modal-title">Bank Accounts</span>
                <span className="supplier-edit-subtitle">{bankModalSupplier.supplierName}</span>
              </div>
              <button className="supplier-modal-close" onClick={() => setShowBankModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="supplier-modal-body supplier-bank-modal-body">
              {bankModalSupplier.bankDetails && bankModalSupplier.bankDetails.length > 0 ? (
                bankModalSupplier.bankDetails.map((acc, idx) => (
                  <div key={acc.id || idx} className="supplier-bank-card">
                    <div className="supplier-bank-card-icon">
                      <FaUniversity size={16} />
                    </div>
                    <div className="supplier-bank-card-info">
                      <div className="supplier-bank-card-top">
                        <strong>{acc.bank_name || 'Bank account'}</strong>
                        <div className="supplier-bank-card-badges">
                          {acc.is_primary === 1 && (
                            <span className="supplier-bank-badge-tag supplier-bank-badge-primary">
                              <FaStar size={8} /> Primary
                            </span>
                          )}
                          {acc.verified === 1 ? (
                            <span className="supplier-bank-badge-tag supplier-bank-badge-verified">
                              <FaCheckCircle size={9} /> Verified
                            </span>
                          ) : (
                            <span className="supplier-bank-badge-tag supplier-bank-badge-unverified">
                              <FaTimesCircle size={9} /> Unverified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="supplier-bank-card-rows">
                        <div className="supplier-bank-card-row">
                          <label>Holder</label><span>{acc.account_holder_name || 'N/A'}</span>
                        </div>
                        <div className="supplier-bank-card-row">
                          <label>Account No.</label><span>{acc.account_number || 'N/A'}</span>
                        </div>
                        <div className="supplier-bank-card-row">
                          <label>IFSC Code</label><span>{acc.ifsc_code || 'N/A'}</span>
                        </div>
                        <div className="supplier-bank-card-row">
                          <label>Branch</label><span>{acc.branch_name || 'N/A'}</span>
                        </div>
                        <div className="supplier-bank-card-row">
                          <label>Account Type</label><span>{acc.account_type || 'N/A'}</span>
                        </div>
                        <div className="supplier-bank-card-row">
                          <label>Currency</label><span>{acc.currency || 'INR'}</span>
                        </div>
                        {acc.swift_code && (
                          <div className="supplier-bank-card-row">
                            <label>SWIFT</label><span>{acc.swift_code}</span>
                          </div>
                        )}
                        {acc.iban && (
                          <div className="supplier-bank-card-row">
                            <label>IBAN</label><span>{acc.iban}</span>
                          </div>
                        )}
                        {acc.upi_id && (
                          <div className="supplier-bank-card-row">
                            <label>UPI ID</label><span>{acc.upi_id}</span>
                          </div>
                        )}
                        {acc.remarks && (
                          <div className="supplier-bank-card-row supplier-bank-card-row-full">
                            <label>Remarks</label><span>{acc.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="supplier-bank-empty">
                  <FaUniversity size={32} />
                  <p>No bank accounts on file for this supplier.</p>
                </div>
              )}
            </div>
            <div className="supplier-modal-footer">
              <button className="supplier-btn-cancel" onClick={() => setShowBankModal(false)}>
                Close
              </button>
              <button
                className="supplier-btn-edit"
                onClick={() => { setShowBankModal(false); handleAddBankAccount(bankModalSupplier); }}
              >
                <FaPlus size={12} /> Add Another
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