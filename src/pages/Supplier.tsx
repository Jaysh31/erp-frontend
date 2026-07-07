import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaFilter, 
  FaCheckCircle, FaTimesCircle, FaPhone, FaEnvelope,
  FaBuilding, 
  FaTimes, FaSave, FaSpinner, FaCopy,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// UI Interface - matches what we actually display
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

export default function Supplier() {
  const navigate = useNavigate();
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [pageSize] = useState(10);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    supplierName: '',
    supplierType: 'Company',
    supplierGroup: '',
    country: 'India',
    defaultCurrency: 'INR',
    language: 'en',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    taxId: '',
    taxCategory: 'Registered Regular',
    paymentTerms: '30 Days',
    defaultBankAccount: '',
    defaultPriceList: 'Standard Buying',
    website: '',
    supplierDetails: '',
    isTransporter: false,
    isInternalSupplier: false,
    onHold: false,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const supplierTypes = ['Company', 'Individual', 'Partnership', 'Proprietorship', 'LLP', 'Trust', 'Society'];
  const supplierGroups = ['Raw Materials', 'Electronic Components', 'Packaging', 'Chemicals', 'Logistics', 'Office Supplies', 'Services', 'All Supplier Groups'];
  const countries = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan', 'UAE', 'Singapore'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  const languages = ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ar'];
  const taxCategories = ['Registered Regular', 'Registered Composition', 'Unregistered', 'SEZ', 'Export Oriented'];
  const paymentTerms = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'Due on Receipt'];
  const priceLists = ['Standard Buying', 'Export Pricing', 'Wholesale', 'Distributor'];
  const statusOptions = ['Active', 'Inactive'];

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Component error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const fetchSuppliers = async (page: number = 1) => {
    setFetching(true);
    setHasError(false);
    try {
      const response = await api.get<ApiResponse>(`/supplier?page=${page}&limit=${pageSize}`);
      
      console.log('🔍 Full API Response:', response.data);
      
      if (response && response.data) {
        // Try different response structures
        let records = [];
        let total = 0;
        let currentPageNum = page;
        let totalPagesCount = 1;
        let limit = pageSize;
        
        // Check for different response structures
        if (response.data.data && Array.isArray(response.data.data.records)) {
          records = response.data.data.records;
          total = response.data.data.total || records.length;
          currentPageNum = response.data.data.page || page;
          limit = response.data.data.limit || pageSize;
          totalPagesCount = Math.ceil(total / limit);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          records = response.data.data;
          total = records.length;
          totalPagesCount = 1;
        } else if (Array.isArray(response.data)) {
          records = response.data;
          total = records.length;
          totalPagesCount = 1;
        } else {
          records = [];
          total = 0;
          totalPagesCount = 1;
        }
        
        console.log('📋 Records found:', records.length);
        
        if (records.length > 0) {
          console.log('📄 Sample record:', records[0]);
          console.log('🔑 Available fields:', Object.keys(records[0]));
        }

        const mappedSuppliers: Supplier[] = records.map((item: any) => ({
          id: item.id?.toString() || '',
          name: item.name || item.supplier_name || '',
          supplierName: item.supplier_name || item.name || '',
          supplierType: item.supplier_type || '',
          supplierGroup: item.supplier_group || '',
          country: item.country || '',
          defaultCurrency: item.default_currency || 'INR',
          language: item.language || 'en',
          email: item.email_id || item.email || '',
          phone: item.mobile_no || item.phone || '',
          address: item.address || '',
          city: item.city || '',
          state: item.state || '',
          pincode: item.pincode || '',
          taxId: item.tax_id || '',
          taxCategory: item.tax_category || '',
          paymentTerms: item.payment_terms || '',
          defaultBankAccount: item.default_bank_account || '',
          defaultPriceList: item.default_price_list || '',
          website: item.website || '',
          supplierDetails: item.supplier_details || '',
          isTransporter: item.is_transporter === 1 || item.is_transporter === true,
          isInternalSupplier: item.is_internal_supplier === 1 || item.is_internal_supplier === true,
          onHold: item.on_hold === 1 || item.on_hold === true,
          status: item.disabled === 1 ? 'Inactive' : 'Active',
          createdAt: item.created_at || '',
          updatedAt: item.updated_at || ''
        }));

        console.log('✅ Mapped suppliers count:', mappedSuppliers.length);
        console.log('✅ First mapped supplier:', mappedSuppliers[0]);
        
        setSuppliers(mappedSuppliers);
        setTotalSuppliers(total);
        setTotalPages(totalPagesCount);
        setCurrentPage(currentPageNum);
      } else {
        setSuppliers([]);
        setTotalSuppliers(0);
        setTotalPages(1);
        toast('No suppliers found');
      }
    } catch (error: any) {
      console.error('❌ Error fetching suppliers:', error);
      setSuppliers([]);
      setTotalSuppliers(0);
      setTotalPages(1);
      
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        toast.error('Network error - Please check your connection');
      } else if (error.response?.status === 401) {
        toast.error('Session expired - Please login again');
      } else {
        console.warn('Failed to load suppliers:', error.message);
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(currentPage);
  }, [currentPage]);

  const filteredSuppliers = suppliers.filter(s => {
    if (!s) return false;
    const searchTerm = filterText.toLowerCase();
    const matchesSearch = (s.supplierName?.toLowerCase() || '').includes(searchTerm) ||
                         (s.name?.toLowerCase() || '').includes(searchTerm) ||
                         (s.email?.toLowerCase() || '').includes(searchTerm) ||
                         (s.phone?.toLowerCase() || '').includes(searchTerm);
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
    const matchesGroup = selectedGroup === 'All' || s.supplierGroup === selectedGroup;
    const matchesCountry = selectedCountry === 'All' || s.country === selectedCountry;
    return matchesSearch && matchesStatus && matchesGroup && matchesCountry;
  });

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  };

  const getStatusIcon = (status: string) => {
    return status === 'Active' ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />;
  };



  const handleCreate = () => {
    navigate('/supplier/new');
  };

  const handleEdit = (supplier: Supplier) => {
    if (!supplier) return;
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      supplierName: supplier.supplierName || '',
      supplierType: supplier.supplierType || 'Company',
      supplierGroup: supplier.supplierGroup || '',
      country: supplier.country || 'India',
      defaultCurrency: supplier.defaultCurrency || 'INR',
      language: supplier.language || 'en',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      pincode: supplier.pincode || '',
      taxId: supplier.taxId || '',
      taxCategory: supplier.taxCategory || 'Registered Regular',
      paymentTerms: supplier.paymentTerms || '30 Days',
      defaultBankAccount: supplier.defaultBankAccount || '',
      defaultPriceList: supplier.defaultPriceList || 'Standard Buying',
      website: supplier.website || '',
      supplierDetails: supplier.supplierDetails || '',
      isTransporter: supplier.isTransporter || false,
      isInternalSupplier: supplier.isInternalSupplier || false,
      onHold: supplier.onHold || false,
      status: supplier.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (!supplier) return;
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handleView = (supplier: Supplier) => {
    if (!supplier) return;
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedSupplier) return;
    setLoading(true);
    
    try {
      const payload = {
        name: formData.supplierName,
        supplier_name: formData.supplierName,
        supplier_type: formData.supplierType,
        supplier_group: formData.supplierGroup,
        country: formData.country,
        default_currency: formData.defaultCurrency,
        language: formData.language,
        email_id: formData.email,
        mobile_no: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        tax_id: formData.taxId || null,
        tax_category: formData.taxCategory || null,
        payment_terms: formData.paymentTerms || null,
        default_bank_account: formData.defaultBankAccount || null,
        default_price_list: formData.defaultPriceList,
        website: formData.website || null,
        supplier_details: formData.supplierDetails || null,
        is_transporter: formData.isTransporter ? 1 : 0,
        is_internal_supplier: formData.isInternalSupplier ? 1 : 0,
        on_hold: formData.onHold ? 1 : 0,
        disabled: formData.status === 'Inactive' ? 1 : 0,
        modified_by: "Administrator",
        owner: "Administrator"
      };
      
      const response = await api.put(`/supplier/${selectedSupplier.id}`, payload);
      
      if (response.data && response.data.success === 1) {
        setSuppliers(prev => 
          prev.map(s => s.id === selectedSupplier.id ? { ...s, ...formData, updatedAt: new Date().toISOString() } : s)
        );
        setShowEditModal(false);
        toast.success(response.data.message || 'Supplier updated successfully!');
      } else {
        toast.error(response.data?.message || 'Failed to update supplier');
      }
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      toast.error(error?.response?.data?.message || 'Failed to update supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSupplier) return;
    setLoading(true);
    
    try {
      const response = await api.delete(`/supplier/${selectedSupplier.id}`);
      
      if (response.data && response.data.success === 1) {
        setSuppliers(prev => prev.filter(s => s.id !== selectedSupplier.id));
        setShowDeleteModal(false);
        toast.success(response.data.message || 'Supplier deleted successfully!');
      } else {
        toast.error(response.data?.message || 'Failed to delete supplier');
      }
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (supplier: Supplier) => {
    if (!supplier) return;
    setLoading(true);
    
    try {
      const payload = {
        name: `${supplier.supplierName || 'Supplier'} (Copy)`,
        supplier_name: `${supplier.supplierName || 'Supplier'} (Copy)`,
        supplier_type: supplier.supplierType || 'Company',
        supplier_group: supplier.supplierGroup || '',
        country: supplier.country || 'India',
        default_currency: supplier.defaultCurrency || 'INR',
        language: supplier.language || 'en',
        email_id: supplier.email || '',
        mobile_no: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        pincode: supplier.pincode || '',
        tax_id: supplier.taxId || null,
        tax_category: supplier.taxCategory || null,
        payment_terms: supplier.paymentTerms || null,
        default_bank_account: supplier.defaultBankAccount || null,
        default_price_list: supplier.defaultPriceList || 'Standard Buying',
        website: supplier.website || null,
        supplier_details: supplier.supplierDetails || null,
        is_transporter: supplier.isTransporter ? 1 : 0,
        is_internal_supplier: supplier.isInternalSupplier ? 1 : 0,
        on_hold: supplier.onHold ? 1 : 0,
        disabled: 0,
        modified_by: "Administrator",
        owner: "Administrator"
      };
      
      const response = await api.post('/supplier', payload);
      
      if (response.data && response.data.success === 1) {
        toast.success(response.data.message || 'Supplier duplicated successfully!');
        fetchSuppliers(currentPage);
      } else {
        toast.error(response.data?.message || 'Failed to duplicate supplier');
      }
    } catch (error: any) {
      console.error('Error duplicating supplier:', error);
      toast.error(error?.response?.data?.message || 'Failed to duplicate supplier');
    } finally {
      setLoading(false);
    }
  };

  const activeSuppliers = suppliers.filter(s => s && s.status === 'Active').length;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (hasError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444' }}>Something went wrong</h3>
        <p style={{ color: 'var(--text-secondary)' }}>There was an error loading the suppliers page.</p>
        <button 
          onClick={() => {
            setHasError(false);
            window.location.reload();
          }}
          style={{
            padding: '8px 20px',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '12px'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className={`supplier-page ${theme}-theme`}>
      <style>{`
        .supplier-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--layout-bg, #f5f7fb);
          padding: 16px 24px;
          gap: 12px;
          overflow-y: auto;
          font-family: -apple-system, "Inter", "Segoe UI", Roboto, sans-serif;
          color: var(--text-primary, #1f2433);
        }

        .supplier-page::-webkit-scrollbar { width: 4px; }
        .supplier-page::-webkit-scrollbar-track { background: transparent; }
        .supplier-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .page-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0;
        }

        .badge {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          background: var(--card-bg, #ffffff);
          padding: 1px 10px;
          border-radius: 12px;
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 16px;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary:hover {
          background: var(--primary-hover, #4f46e5);
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: var(--card-bg, #ffffff);
          color: var(--text-primary, #1f2433);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background: var(--layout-bg, #f3f4f6);
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
          background: var(--card-bg, #ffffff);
          border-radius: 0 0 8px 8px;
        }

        .pagination-info {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pagination-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--card-bg, #ffffff);
          color: var(--text-primary, #374151);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--nav-hover, #f3f4f6);
          border-color: var(--primary-color, #6366f1);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn.active {
          background: var(--primary-color, #6366f1);
          color: white;
          border-color: var(--primary-color, #6366f1);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .compact-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 16px;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .stat-item {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          font-weight: 500;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
        }

        .stat-active {
          color: #10b981;
        }

        .stat-divider {
          width: 1px;
          height: 20px;
          background: var(--border-color, #e5e7eb);
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          padding: 0 12px;
          transition: all 0.15s ease;
          height: 34px;
        }

        .search-wrapper:focus-within {
          border-color: var(--primary-color, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .search-icon {
          color: var(--text-secondary, #9ca3af);
          font-size: 13px;
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          background: transparent;
          padding: 6px 10px;
          font-size: 13px;
          color: var(--text-primary, #374151);
          outline: none;
          flex: 1;
          min-width: 120px;
        }

        .search-input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .clear-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 50%;
          background: var(--border-color, #e5e7eb);
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .clear-btn:hover {
          background: var(--text-secondary, #6b7280);
          color: white;
        }

        .filter-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: var(--card-bg, #ffffff);
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          height: 34px;
        }

        .filter-toggle:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .filter-toggle.active {
          border-color: var(--primary-color, #6366f1);
          color: var(--primary-color, #6366f1);
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }

        .result-count {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .expandable-filters {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          padding: 12px 16px;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          animation: slideDown 0.2s ease;
          flex-wrap: wrap;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-group label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
        }

        .filter-group select {
          padding: 4px 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 12px;
          background: var(--input-bg, #ffffff);
          color: var(--text-primary, #374151);
          outline: none;
          height: 30px;
        }

        .filter-group select:focus {
          border-color: var(--primary-color, #6366f1);
        }

        .apply-filters {
          padding: 4px 16px;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          height: 30px;
          transition: all 0.15s ease;
        }

        .apply-filters:hover {
          background: var(--primary-hover, #4f46e5);
        }

        .supplier-container {
          flex: 1;
          min-height: 0;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .table-wrapper {
          overflow-x: auto;
          flex: 1;
        }

        .supplier-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 800px;
        }

        .supplier-table thead {
          background: var(--layout-bg, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .supplier-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .supplier-table td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .supplier-row {
          transition: background 0.15s ease;
        }

        .supplier-row:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .name-cell {
          font-weight: 500;
          color: var(--text-primary, #1f2433);
        }

        .contact-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .contact-cell .contact-detail {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .group-badge {
          display: inline-block;
          padding: 2px 10px;
          background: #e0e7ff;
          color: #3730a3;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .action-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .action-btn:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .action-btn.view:hover { color: var(--primary-color, #6366f1); }
        .action-btn.edit:hover { color: #f59e0b; }
        .action-btn.copy:hover { color: #8b5cf6; }
        .action-btn.delete:hover { color: #ef4444; background: #fef2f2; }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          text-align: center;
          flex: 1;
        }

        .empty-icon {
          color: var(--text-secondary, #9ca3af);
          margin-bottom: 12px;
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0 0 4px 0;
        }

        .empty-state p {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
          margin: 0 0 16px 0;
        }

        .list-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 4px 0 4px;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          flex-shrink: 0;
        }

        .conversion-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          background: color-mix(in srgb, var(--primary-color) 10%, transparent);
          color: var(--primary-color, #6366f1);
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: var(--card-bg, #ffffff);
          border-radius: 12px;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .view-modal { max-width: 750px; }
        .delete-modal { max-width: 420px; }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0;
        }

        .modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 20px;
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 20px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .view-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .view-section {
          padding: 12px;
          background: var(--layout-bg, #f8f9fa);
          border-radius: 8px;
        }

        .view-section.full-width {
          grid-column: 1 / -1;
        }

        .view-section h4 {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .view-row {
          display: flex;
          padding: 3px 0;
          font-size: 13px;
        }

        .view-row label {
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          min-width: 90px;
        }

        .view-row span {
          color: var(--text-primary, #1f2433);
        }

        .delete-body {
          text-align: center;
          padding: 32px 20px;
        }

        .delete-icon {
          color: #ef4444;
          margin-bottom: 16px;
        }

        .delete-body h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0 0 8px 0;
        }

        .delete-body p {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
          margin: 4px 0;
        }

        .delete-warning {
          color: #ef4444 !important;
          font-weight: 500;
          margin-top: 12px !important;
        }

        @media (max-width: 768px) {
          .supplier-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-wrap: wrap; justify-content: flex-end; }
          .search-bar { flex-direction: column; align-items: stretch; }
          .filter-wrapper { justify-content: space-between; }
          .expandable-filters { flex-direction: column; align-items: stretch; }
          .supplier-table { min-width: 600px; }
          .modal-container { max-width: 100%; margin: 10px; }
          .modal-footer { flex-direction: column; }
          .modal-footer button { width: 100%; justify-content: center; }
          .view-grid { grid-template-columns: 1fr; }
          .compact-stats { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
          .stat-divider { display: none; }
          .pagination { flex-direction: column; gap: 8px; align-items: center; }
        }

        @media (max-width: 480px) {
          .supplier-page { padding: 8px 12px; }
          .supplier-table { font-size: 12px; min-width: 500px; }
          .supplier-table th, .supplier-table td { padding: 6px 10px; }
          .action-group { gap: 0; }
          .action-btn { width: 24px; height: 24px; }
          .pagination-controls { flex-wrap: wrap; justify-content: center; }
          .pagination-btn { min-width: 28px; height: 28px; font-size: 12px; }
        }

        .dark-theme .supplier-page { background: var(--layout-bg, #0f172a); }
        .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .badge { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .search-wrapper { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .search-input { color: var(--text-primary, #f8fafc); }
        .dark-theme .search-input::placeholder { color: var(--text-secondary, #64748b); }
        .dark-theme .filter-toggle { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .filter-toggle:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .expandable-filters { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .filter-group select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .supplier-container { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .supplier-table thead { background: var(--layout-bg, #0f172a); }
        .dark-theme .supplier-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
        .dark-theme .supplier-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .supplier-row:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .name-cell { color: var(--text-primary, #f8fafc); }
        .dark-theme .group-badge { background: rgba(99,102,241,0.2); color: var(--primary-color, #818cf8); }
        .dark-theme .action-btn { color: var(--text-secondary, #64748b); }
        .dark-theme .action-btn:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .modal-container { background: var(--card-bg, #1e293b); }
        .dark-theme .modal-header { border-bottom-color: var(--border-color, #334155); }
        .dark-theme .modal-header h2 { color: var(--text-primary, #f8fafc); }
        .dark-theme .modal-close { color: var(--text-secondary, #94a3b8); }
        .dark-theme .modal-close:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .modal-footer { border-top-color: var(--border-color, #334155); }
        .dark-theme .view-section { background: var(--layout-bg, #0f172a); }
        .dark-theme .view-row span { color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary:hover { background: var(--layout-bg, #0f172a); }
        .dark-theme .btn-primary { background: var(--primary-color, #3b82f6); }
        .dark-theme .btn-primary:hover { background: var(--primary-hover, #2563eb); }
        .dark-theme .status-active { background: rgba(16,185,129,0.2); color: #34d399; }
        .dark-theme .status-inactive { background: rgba(107,114,128,0.2); color: #9ca3af; }
        .dark-theme .compact-stats { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .stat-value { color: var(--text-primary, #f8fafc); }
        .dark-theme .stat-divider { background: var(--border-color, #334155); }
        .dark-theme .empty-state h3 { color: var(--text-primary, #f8fafc); }
        .dark-theme .empty-state p { color: var(--text-secondary, #94a3b8); }
        .dark-theme .conversion-badge { background: rgba(99,102,241,0.15); color: var(--primary-color, #818cf8); }
        .dark-theme .result-count { color: var(--text-secondary, #94a3b8); }
        .dark-theme .list-footer { color: var(--text-secondary, #94a3b8); }
        .dark-theme .delete-body h3 { color: var(--text-primary, #f8fafc); }
        .dark-theme .delete-body p { color: var(--text-secondary, #94a3b8); }
        .dark-theme .contact-cell .contact-detail { color: var(--text-secondary, #94a3b8); }
        .dark-theme .pagination { background: var(--card-bg, #1e293b); border-top-color: var(--border-color, #334155); }
        .dark-theme .pagination-info { color: var(--text-secondary, #94a3b8); }
        .dark-theme .pagination-btn { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .pagination-btn:hover:not(:disabled) { background: var(--nav-hover, rgba(255,255,255,0.05)); border-color: var(--primary-color, #818cf8); }
        .dark-theme .pagination-btn.active { background: var(--primary-color, #3b82f6); color: white; border-color: var(--primary-color, #3b82f6); }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Suppliers</h1>
          <span className="badge">{totalSuppliers}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add Supplier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="compact-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalSuppliers}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value stat-active">{activeSuppliers}</span>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
          {filterText && (
            <button className="clear-btn" onClick={() => setFilterText('')}>×</button>
          )}
        </div>
        <div className="filter-wrapper">
          <select 
            className="filter-toggle"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} /> Filter
          </button>
          <span className="result-count">{filteredSuppliers.length} of {totalSuppliers}</span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Supplier Group</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="All">All Groups</option>
              {supplierGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="All">All Countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Supplier List */}
      <div className="supplier-container">
        {fetching ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaSpinner size={48} className="spinning" />
            </div>
            <h3>Loading suppliers...</h3>
            <p>Please wait while we fetch the data</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaBuilding size={48} />
            </div>
            <h3>No suppliers found</h3>
            <p>Create your first supplier to get started</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add Supplier
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="supplier-table">
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Contact</th>
                    <th>Group</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id || Math.random().toString()}>
                      <td className="name-cell">{supplier.supplierName || supplier.name || 'N/A'}</td>
                      <td>
                        <div className="contact-cell">
                          <span className="contact-detail">
                            <FaEnvelope size={10} /> {supplier.email || 'N/A'}
                          </span>
                          <span className="contact-detail">
                            <FaPhone size={10} /> {supplier.phone || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="group-badge">{supplier.supplierGroup || 'N/A'}</span>
                      </td>
                      <td>{supplier.country || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(supplier.status || 'Active')}`}>
                          {getStatusIcon(supplier.status || 'Active')}
                          {supplier.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button 
                            className="action-btn view" 
                            title="View"
                            onClick={() => handleView(supplier)}
                          >
                            <FaEye size={12} />
                          </button>
                          <button 
                            className="action-btn edit" 
                            title="Edit"
                            onClick={() => handleEdit(supplier)}
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="action-btn copy" 
                            title="Duplicate"
                            onClick={() => handleDuplicate(supplier)}
                          >
                            <FaCopy size={12} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            title="Delete"
                            onClick={() => handleDelete(supplier)}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSuppliers)} of {totalSuppliers} entries
                </div>
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn" 
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    className="pagination-btn" 
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="list-footer">
        <span>{filteredSuppliers.length} of {totalSuppliers} suppliers</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaBuilding size={11} /> {activeSuppliers} active
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSupplier.supplierName || selectedSupplier.name || 'Supplier Details'}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section">
                  <h4>Basic Information</h4>
                  <div className="view-row"><label>Name:</label><span>{selectedSupplier.supplierName || selectedSupplier.name || 'N/A'}</span></div>
                  <div className="view-row"><label>Type:</label><span>{selectedSupplier.supplierType || 'N/A'}</span></div>
                  <div className="view-row"><label>Group:</label><span>{selectedSupplier.supplierGroup || 'N/A'}</span></div>
                  <div className="view-row"><label>Country:</label><span>{selectedSupplier.country || 'N/A'}</span></div>
                  <div className="view-row"><label>Status:</label><span className={`status-badge ${getStatusColor(selectedSupplier.status || 'Active')}`}>{selectedSupplier.status || 'Active'}</span></div>
                </div>
                <div className="view-section">
                  <h4>Contact Details</h4>
                  <div className="view-row"><label>Email:</label><span>{selectedSupplier.email || 'N/A'}</span></div>
                  <div className="view-row"><label>Phone:</label><span>{selectedSupplier.phone || 'N/A'}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4>Address</h4>
                  <div className="view-row"><label>Address:</label><span>{selectedSupplier.address || 'N/A'}</span></div>
                  <div className="view-row"><label>City:</label><span>{selectedSupplier.city || 'N/A'}</span></div>
                  <div className="view-row"><label>State:</label><span>{selectedSupplier.state || 'N/A'}</span></div>
                  <div className="view-row"><label>Pincode:</label><span>{selectedSupplier.pincode || 'N/A'}</span></div>
                </div>
                <div className="view-section">
                  <h4>Tax & Financial</h4>
                  <div className="view-row"><label>Tax ID:</label><span>{selectedSupplier.taxId || 'N/A'}</span></div>
                  <div className="view-row"><label>Tax Category:</label><span>{selectedSupplier.taxCategory || 'N/A'}</span></div>
                  <div className="view-row"><label>Payment Terms:</label><span>{selectedSupplier.paymentTerms || 'N/A'}</span></div>
                  <div className="view-row"><label>Currency:</label><span>{selectedSupplier.defaultCurrency || 'INR'}</span></div>
                </div>
                {selectedSupplier.website && (
                  <div className="view-section full-width">
                    <h4>Additional Info</h4>
                    <div className="view-row"><label>Website:</label><span><a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer">{selectedSupplier.website}</a></span></div>
                    {selectedSupplier.supplierDetails && (
                      <div className="view-row"><label>Details:</label><span>{selectedSupplier.supplierDetails}</span></div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => handleEdit(selectedSupplier)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== EDIT MODAL ====== */}
      {showEditModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Supplier</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Supplier Type</label>
                  <select
                    value={formData.supplierType}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierType: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    {supplierTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Supplier Group</label>
                  <select
                    value={formData.supplierGroup}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierGroup: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Select Group</option>
                    {supplierGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Currency</label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Tax ID / GSTIN</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Tax Category</label>
                  <select
                    value={formData.taxCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxCategory: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    {taxCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    {paymentTerms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Default Price List</label>
                  <select
                    value={formData.defaultPriceList}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultPriceList: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    {priceLists.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label>Supplier Details</label>
                  <textarea
                    value={formData.supplierDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierDetails: e.target.value }))}
                    placeholder="Additional notes about the supplier..."
                    rows={2}
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isTransporter}
                      onChange={(e) => setFormData(prev => ({ ...prev, isTransporter: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                    />
                    Is Transporter
                  </label>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isInternalSupplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, isInternalSupplier: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                    />
                    Internal Supplier
                  </label>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={formData.onHold}
                      onChange={(e) => setFormData(prev => ({ ...prev, onHold: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                    />
                    On Hold
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdate} disabled={loading}>
                {loading && <FaSpinner className="spinning" />}
                <FaSave size={12} /> Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Supplier</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body delete-body">
              <div className="delete-icon">
                <FaTrash size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                You are about to delete <strong>{selectedSupplier.supplierName || selectedSupplier.name || 'this supplier'}</strong>
              </p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteConfirm} disabled={loading}>
                {loading && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}