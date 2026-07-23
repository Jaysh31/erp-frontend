import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaPrint,
  FaEye,
  FaEdit,
  FaPrint as FaPrintIcon,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaEllipsisV,
  FaFilePdf,
  FaFileExcel,
  FaBan,
  FaPaperPlane,
  FaFileInvoice,
  FaCopy,
  
  FaSpinner,
  FaSync,
  FaTimes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ===== INTERFACES =====

interface SalesInvoice {
  id: string | number;
  name: string;
  customer_name: string;
  posting_date: string;
  status: string;
  grand_total: number;
  currency: string;
  modified: string;
  modified_by: string;
  creation: string;
  deliveryChallanNo?: string;
  paid_amount?: number;
  outstanding_amount?: number;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: SalesInvoice[];
  };
}

// ===== STATUS BADGE =====
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    'Draft': { color: '#6b7280', bg: '#f3f4f6', label: 'Draft' },
    'Submitted': { color: '#1e40af', bg: '#dbeafe', label: 'Submitted' },
    'Cancelled': { color: '#991b1b', bg: '#fee2e2', label: 'Cancelled' },
    'Paid': { color: '#065f46', bg: '#d1fae5', label: 'Paid' },
    'Partially Paid': { color: '#92400e', bg: '#fef3c7', label: 'Partially Paid' }
  };
  const config = configs[status] || configs['Draft'];
  
  return (
    <span className="qt-status-badge" style={{ color: config.color, background: config.bg }}>
      <span className="qt-dot" style={{ background: config.color }} />
      {config.label}
    </span>
  );
};


// ===== MAIN COMPONENT =====
const SalesInvoice: React.FC = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== FETCH DATA =====
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get<ApiResponse>(`/sales-invoice${query}`);
      
      if (response.data?.data?.records) {
        setInvoices(response.data.data.records);
      } else {
        setInvoices([]);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load sales invoices');
      toast.error('Failed to load sales invoices');
    } finally {
      setLoading(false);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchInvoices(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, currentPage]);

  // ===== HELPERS =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };


  // ===== FILTER DATA =====
  const filteredData = invoices.filter(item => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(search) ||
      (item.customer_name || '').toLowerCase().includes(search) ||
      (item.deliveryChallanNo || '').toLowerCase().includes(search);
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  // ===== ACTIONS =====
  const handleCreate = () => navigate('/sales-bill/new');
  const handleRefresh = () => fetchInvoices();
  const handleView = (id: string | number) => navigate(`/sales-bill/view/${id}`);
  const handleEdit = (id: string | number) => navigate(`/sales-bill/edit/${id}`);
  const handleDuplicate = (id: string | number) => navigate(`/sales-bill/duplicate/${id}`);
  const handlePrint = () => window.print();
  
  const handleCancel = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to cancel this Sales Bill?')) return;
    try {
      await api.post(`/sales-invoice/${id}/cancel`, {});
      toast.success('Sales Bill cancelled successfully');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to cancel');
    }
    setShowMoreMenu(null);
  };

  const handleSubmit = async (id: string | number) => {
    if (!window.confirm('Submit this Sales Bill?')) return;
    try {
      await api.post(`/sales-invoice/${id}/submit`, {});
      toast.success('Submitted successfully');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to submit');
    }
    setShowMoreMenu(null);
  };

  const handleDownloadPDF = (_id: string | number) => {
    toast.success('Downloading PDF...');
    setShowMoreMenu(null);
  };

  const toggleMenu = (id: string | number) => {
    setShowMoreMenu(showMoreMenu === String(id) ? null : String(id));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
    setCurrentPage(1);
  };

  // ===== RENDER =====
  return (
    <div className="quotation-page">
      <style>{`
        /* ── Inherit styles from QuotationPage ── */
        .quotation-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--layout-bg, #f5f7fb);
          border-radius: 8px;
          padding: 20px;
          gap: 16px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .quotation-page::-webkit-scrollbar {
          width: 6px;
        }
        .quotation-page::-webkit-scrollbar-track {
          background: var(--layout-bg, #f9fafb);
          border-radius: 3px;
        }
        .quotation-page::-webkit-scrollbar-thumb {
          background: var(--border-color, #e5e7eb);
          border-radius: 3px;
        }
        .quotation-page::-webkit-scrollbar-thumb:hover {
          background: var(--primary-color, #6366f1);
        }

        /* ── Stats Cards ── */
        .qt-stats-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          flex-shrink: 0;
        }

        .qt-stat-card {
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,0.06));
          transition: transform 0.15s, box-shadow 0.15s;
          background: white;
        }

        .qt-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--shadow-color, rgba(0,0,0,0.08));
        }

        .qt-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          background: rgba(255,255,255,0.6);
        }

        .qt-stat-content {
          flex: 1;
          min-width: 0;
        }

        .qt-stat-title {
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 2px;
          letter-spacing: 0.3px;
        }

        .qt-stat-value {
          color: var(--text-primary, #111827);
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }

        /* ── Filter Bar ── */
        .qt-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .qt-filter-left {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 200px;
        }

        .qt-search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .qt-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary, #9ca3af);
          font-size: 14px;
        }

        .qt-search-input {
          width: 100%;
          padding: 8px 36px 8px 36px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          background: var(--input-bg, white);
          color: var(--text-primary, #374151);
          outline: none;
          transition: border-color 0.2s;
          height: 38px;
        }

        .qt-search-input:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .qt-search-input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .qt-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary, #9ca3af);
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .qt-filter-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .qt-filter-select {
          padding: 7px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          background: var(--card-bg, white);
          color: var(--text-primary, #374151);
          cursor: pointer;
          outline: none;
          height: 38px;
        }

        .qt-filter-select:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .qt-btn-new {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: var(--primary-color, #6366f1);
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .qt-btn-new:hover {
          background: var(--primary-hover, #4f46e5);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .qt-btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: var(--card-bg, white);
          font-size: 13px;
          color: var(--text-primary, #374151);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .qt-btn-secondary:hover {
          background: var(--nav-hover, #f9fafb);
        }

        /* ── Active Filters ── */
        .qt-active-filters {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
          border-radius: 8px;
          font-size: 12px;
          flex-wrap: wrap;
          border: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .qt-active-filters span {
          color: var(--text-primary, #111827);
        }

        .qt-clear-filters {
          margin-left: auto;
          padding: 4px 12px;
          background: var(--card-bg, white);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary, #6b7280);
          transition: all 0.15s;
        }

        .qt-clear-filters:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        /* ── Table ── */
        .qt-table-wrap {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,0.05));
          border: 1px solid var(--border-color, #e5e7eb);
          overflow-x: auto;
          overflow-y: visible;
          flex-shrink: 0;
        }

        .qt-table-wrap::-webkit-scrollbar {
          height: 6px;
        }
        .qt-table-wrap::-webkit-scrollbar-track {
          background: var(--layout-bg, #f9fafb);
          border-radius: 3px;
        }
        .qt-table-wrap::-webkit-scrollbar-thumb {
          background: var(--border-color, #e5e7eb);
          border-radius: 3px;
        }
        .qt-table-wrap::-webkit-scrollbar-thumb:hover {
          background: var(--primary-color, #6366f1);
        }

        .qt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 900px;
        }

        .qt-th {
          padding: 12px 14px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          background: var(--layout-bg, #f9fafb);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .qt-th-meta {
          text-align: right;
          padding-right: 20px;
        }

        .qt-tr {
          cursor: default;
          transition: background 0.15s;
        }

        .qt-tr:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .qt-tr+.qt-tr td {
          border-top: 1px solid var(--border-color, #f3f4f6);
        }

        .qt-td {
          padding: 10px 14px;
          color: var(--text-primary, #374151);
          vertical-align: middle;
          white-space: nowrap;
        }

        .qt-td-id {
          font-weight: 600;
          color: var(--text-primary, #111827);
          font-family: monospace;
        }

        .qt-td-link {
          color: var(--primary-color, #6366f1);
          font-weight: 500;
        }

        .qt-td-link:hover {
          text-decoration: underline;
          cursor: pointer;
        }

        .qt-td-meta {
          text-align: right;
          padding-right: 20px;
          white-space: nowrap;
        }

        .qt-text-right {
          text-align: right;
        }

        .qt-text-center {
          text-align: center;
        }

        /* ── Status Badge ── */
        .qt-status-badge {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          gap: 4px;
        }

        .qt-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        /* ── Action Buttons ── */
        .qt-action-buttons {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .qt-action-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: transparent;
        }

        .qt-action-view {
          color: var(--primary-color, #6366f1);
        }

        .qt-action-view:hover {
          background: rgba(99, 102, 241, 0.1);
        }

        .qt-action-edit {
          color: #f59e0b;
        }

        .qt-action-edit:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .qt-action-delete {
          color: var(--danger-color, #ef4444);
        }

        .qt-action-delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .qt-action-pdf {
          color: #ef4444;
        }

        .qt-action-pdf:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .qt-action-more {
          color: var(--text-secondary, #6b7280);
        }

        .qt-action-more:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .qt-action-print {
          color: var(--text-secondary, #6b7280);
        }

        .qt-action-print:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        /* ── More Menu ── */
        .qt-more-menu-container {
          position: relative;
        }

        .qt-more-menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          box-shadow: 0 10px 40px var(--shadow-color, rgba(0,0,0,0.15));
          min-width: 200px;
          z-index: 100;
          padding: 4px 0;
          margin-top: 4px;
        }

        .qt-more-menu-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .qt-more-menu-dropdown button:hover {
          background: var(--nav-hover, #f8fafc);
          color: var(--primary-color, #2563eb);
        }

        .qt-more-menu-dropdown button.danger {
          color: var(--danger-color, #ef4444);
        }

        .qt-more-menu-dropdown button.danger:hover {
          background: #fef2f2;
        }

        /* ── Amount Cell ── */
        .qt-amount-cell {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary, #1f2433);
        }

        .qt-currency {
          font-size: 11px;
          font-weight: 400;
          color: var(--text-secondary, #6b7280);
          margin-right: 2px;
        }

        /* ── Empty State ── */
        .qt-empty-state {
          padding: 60px 20px;
          text-align: center;
        }

        .qt-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .qt-empty-content svg {
          color: var(--text-secondary, #9ca3af);
        }

        .qt-empty-content p {
          font-size: 18px;
          font-weight: 500;
          color: var(--text-primary, #111827);
          margin: 0;
        }

        .qt-empty-content span {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
        }

        /* ── Loading ── */
        .qt-loading {
          padding: 40px;
          text-align: center;
          color: var(--text-secondary, #6b7280);
        }

        .qt-error {
          padding: 40px;
          text-align: center;
          color: var(--danger-color, #ef4444);
        }

        .qt-retry-btn {
          margin-top: 12px;
          padding: 8px 20px;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        /* ── Pagination ── */
        .qt-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 0 0;
          flex-wrap: wrap;
          gap: 12px;
          background: transparent;
          flex-shrink: 0;
          border-top: 1px solid var(--border-color, #e5e7eb);
          margin-top: 4px;
        }

        .qt-pagination-left,
        .qt-pagination-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qt-pagination-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .qt-pagination-info {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .qt-page-btn {
          height: 34px;
          min-width: 34px;
          padding: 0 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: var(--card-bg, white);
          font-size: 13px;
          color: var(--text-primary, #374151);
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .qt-page-btn:hover:not(:disabled) {
          background: var(--nav-hover, #f3f4f6);
          border-color: var(--primary-color, #6366f1);
        }

        .qt-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qt-page-btn-active {
          background: var(--primary-color, #6366f1);
          color: white;
          border-color: var(--primary-color, #6366f1);
        }

        .qt-page-btn-active:hover {
          background: var(--primary-hover, #4f46e5);
        }

        /* ── Spinner ── */
        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Dark Theme ── */
        .dark-theme .quotation-page {
          background: var(--layout-bg, #0f172a);
        }

        .dark-theme .qt-stat-card {
          background: var(--card-bg, #1e293b);
        }

        .dark-theme .qt-stat-value {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-stat-title {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .qt-search-input {
          background: var(--input-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-search-input::placeholder {
          color: var(--text-secondary, #64748b);
        }

        .dark-theme .qt-filter-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-btn-secondary {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-btn-secondary:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .qt-btn-new {
          background: var(--primary-color, #3b82f6);
        }

        .dark-theme .qt-btn-new:hover {
          background: var(--primary-hover, #2563eb);
        }

        .dark-theme .qt-table-wrap {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .qt-th {
          background: var(--layout-bg, #0f172a);
          color: var(--text-secondary, #94a3b8);
          border-bottom-color: var(--border-color, #334155);
        }

        .dark-theme .qt-td {
          color: var(--text-primary, #f8fafc);
          border-top-color: var(--border-color, #334155);
        }

        .dark-theme .qt-tr:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .qt-amount-cell {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-currency {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .qt-empty-content p {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-empty-content span {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .qt-active-filters {
          background: rgba(99, 102, 241, 0.08);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .qt-active-filters span {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-clear-filters {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .qt-page-btn {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-page-btn:hover:not(:disabled) {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .qt-more-menu-dropdown {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .qt-more-menu-dropdown button {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-more-menu-dropdown button:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .qt-stats-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .quotation-page {
            padding: 12px;
            gap: 12px;
          }

          .qt-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .qt-filter-left {
            width: 100%;
          }

          .qt-search-wrapper {
            max-width: 100%;
          }

          .qt-filter-right {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .qt-table {
            min-width: 700px;
          }

          .qt-pagination {
            flex-direction: column;
            align-items: center;
          }

          .qt-td {
            padding: 8px 10px;
            font-size: 12px;
          }

          .qt-th {
            padding: 8px 10px;
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .qt-stats-container {
            grid-template-columns: 1fr;
          }

          .qt-stat-card {
            padding: 12px 16px;
          }

          .qt-stat-value {
            font-size: 18px;
          }

          .qt-stat-icon {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .qt-filter-right {
            flex-direction: column;
            width: 100%;
          }

          .qt-filter-right > * {
            width: 100%;
          }

          .qt-btn-new {
            justify-content: center;
          }

          .qt-pagination {
            padding: 8px 0 0 0;
          }

          .qt-pagination-center {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>

      {/* ===== STATS CARDS ===== */}
      {/* <div className="qt-stats-container">
        <StatsCard 
          label="Total Bills" 
          value={stats.total} 
          color="#3B82F6" 
          icon={<FaFileInvoice size={18} />}
          bgColor="#EFF6FF"
        />
        <StatsCard 
          label="Draft" 
          value={stats.draft} 
          color="#6B7280" 
          icon={<FaFileInvoice size={18} />}
          bgColor="#F9FAFB"
        />
        <StatsCard 
          label="Submitted" 
          value={stats.submitted} 
          color="#10B981" 
          icon={<FaPaperPlane size={18} />}
          bgColor="#ECFDF5"
        />
        <StatsCard 
          label="Paid" 
          value={stats.paid} 
          color="#8B5CF6" 
          icon={<FaMoneyBillWave size={18} />}
          bgColor="#F5F3FF"
        />
      </div> */}

      {/* ===== FILTER BAR ===== */}
      <div className="qt-filter-bar">
        <div className="qt-filter-left">
          <div className="qt-search-wrapper">
            <FaSearch className="qt-search-icon" />
            <input
              type="text"
              placeholder="Search by Bill Number, Customer, or DC No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="qt-search-input"
            />
            {searchTerm && (
              <button className="qt-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="qt-filter-right">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="qt-filter-select"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button className="qt-btn-secondary" onClick={handleRefresh}>
            <FaSync size={12} /> Refresh
          </button>
          <button className="qt-btn-secondary" onClick={handlePrint}>
            <FaPrint size={12} /> Print
          </button>
          <button className="qt-btn-new" onClick={handleCreate}>
            <FaPlus size={12} /> New Sales Bill
          </button>
        </div>
      </div>

      {/* ===== ACTIVE FILTERS ===== */}
      {(searchTerm || selectedStatus !== "All") && (
        <div className="qt-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span>Active filters:</span>
          {searchTerm && (
            <span>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {selectedStatus !== "All" && (
            <span>
              <strong>Status:</strong> {selectedStatus}
            </span>
          )}
          <button onClick={clearFilters} className="qt-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="qt-table-wrap">
        {loading && invoices.length === 0 ? (
          <div className="qt-loading">
            <FaSpinner className="spinning" size={30} style={{ display: 'block', margin: '0 auto 12px' }} />
            <p>Loading sales bills...</p>
          </div>
        ) : error ? (
          <div className="qt-error">
            <FaExclamationTriangle size={30} style={{ display: 'block', margin: '0 auto 12px' }} />
            <p>{error}</p>
            <button onClick={handleRefresh} className="qt-retry-btn">
              <FaSync size={12} style={{ marginRight: '6px' }} /> Retry
            </button>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="qt-empty-state">
            <div className="qt-empty-content">
              <FaFileInvoice size={48} />
              <p>No sales bills found</p>
              <span>Try adjusting your search criteria or create a new one</span>
              <button className="qt-btn-new" onClick={handleCreate} style={{ marginTop: '12px' }}>
                <FaPlus size={12} /> New Sales Bill
              </button>
            </div>
          </div>
        ) : (
          <>
            <table className="qt-table">
              <thead>
                <tr>
                  <th className="qt-th">Bill No</th>
                  <th className="qt-th">Customer</th>
                  <th className="qt-th">Bill Date</th>
                  <th className="qt-th">Delivery Challan</th>
                  <th className="qt-th qt-text-right">Amount</th>
                  <th className="qt-th">Status</th>
                  <th className="qt-th qt-th-meta">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} className="qt-tr">
                    <td className="qt-td qt-td-id">{item.name || '-'}</td>
                    <td className="qt-td">
                      <div className="qt-td-link" onClick={() => handleView(item.id)}>
                        {item.customer_name || '-'}
                      </div>
                    </td>
                    <td className="qt-td">
                      <div>{formatDate(item.posting_date)}</div>
                    </td>
                    <td className="qt-td">
                      <div>{item.deliveryChallanNo || '-'}</div>
                    </td>
                    <td className="qt-td qt-text-right qt-amount-cell">
                      <span className="qt-currency">INR </span>
                      {item.grand_total.toLocaleString()}
                    </td>
                    <td className="qt-td">
                      <StatusBadge status={item.status || 'Draft'} />
                    </td>
                    <td className="qt-td qt-td-meta">
                      <div className="qt-action-buttons">
                        <button 
                          className="qt-action-btn qt-action-view" 
                          onClick={() => handleView(item.id)} 
                          title="View"
                        >
                          <FaEye size={12} />
                        </button>
                        {item.status === 'Draft' && (
                          <button 
                            className="qt-action-btn qt-action-edit" 
                            onClick={() => handleEdit(item.id)} 
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                        )}
                        <button 
                          className="qt-action-btn qt-action-print" 
                          onClick={handlePrint} 
                          title="Print"
                        >
                          <FaPrintIcon size={12} />
                        </button>
                        <div className="qt-more-menu-container">
                          <button 
                            className="qt-action-btn qt-action-more" 
                            onClick={() => toggleMenu(item.id)} 
                            title="More"
                          >
                            <FaEllipsisV size={12} />
                          </button>
                          {showMoreMenu === String(item.id) && (
                            <div className="qt-more-menu-dropdown">
                              <button onClick={() => handleView(item.id)}>
                                <FaEye size={12} /> View
                              </button>
                              {item.status === 'Draft' && (
                                <>
                                  <button onClick={() => handleEdit(item.id)}>
                                    <FaEdit size={12} /> Edit
                                  </button>
                                  <button onClick={() => handleSubmit(item.id)}>
                                    <FaPaperPlane size={12} /> Submit
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDuplicate(item.id)}>
                                <FaCopy size={12} /> Duplicate
                              </button>
                              <button onClick={() => handleDownloadPDF(item.id)}>
                                <FaFilePdf size={12} /> Download PDF
                              </button>
                              <button onClick={() => handleDownloadPDF(item.id)}>
                                <FaFileExcel size={12} /> Download Excel
                              </button>
                              {item.status !== 'Cancelled' && (
                                <button className="danger" onClick={() => handleCancel(item.id)}>
                                  <FaBan size={12} /> Cancel
                                </button>
                              )}
                              <button onClick={handlePrint}>
                                <FaPrintIcon size={12} /> Print
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ===== PAGINATION ===== */}
            {filteredData.length > 0 && (
              <div className="qt-pagination">
                <div className="qt-pagination-left">
                  <span className="qt-pagination-info">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                  </span>
                </div>
                <div className="qt-pagination-center">
                  <button 
                    className="qt-page-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 7) {
                      if (currentPage > 4) {
                        pageNum = currentPage - 3 + i;
                      }
                      if (pageNum > totalPages) {
                        pageNum = totalPages - (6 - i);
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`qt-page-btn ${currentPage === pageNum ? 'qt-page-btn-active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    className="qt-page-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>
                <div className="qt-pagination-right">
                  <span className="qt-pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalesInvoice;