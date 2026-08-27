import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaSpinner, FaCopy, FaEye,
  FaFileAlt,  FaCheckCircle,
  FaTimesCircle, FaClock, FaPaperPlane,
  
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';

interface SupplierQuotation {
  id: string;
  quotationNumber: string;
  supplier: string;
  supplierCode: string;
  status: 'Draft' | 'Submitted' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
  date: string;
  validTill: string;
  isReverseCharge: boolean;
  currency: string;
  totalAmount: number;
  itemsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierQuotation() {
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
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<SupplierQuotation | null>(null);
  const [loading, setLoading] = useState(false);

  const [quotations, setQuotations] = useState<SupplierQuotation[]>([
    {
      id: '1',
      quotationNumber: 'PUR-SQTN-2026-001',
      supplier: 'ABC Manufacturing Co.',
      supplierCode: 'SUP-001',
      status: 'Submitted',
      date: '2026-06-20',
      validTill: '2026-07-20',
      isReverseCharge: false,
      currency: 'INR',
      totalAmount: 175000,
      itemsCount: 2,
      createdBy: 'Tejas Tarte',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    },
    {
      id: '2',
      quotationNumber: 'PUR-SQTN-2026-002',
      supplier: 'XYZ Electronics Ltd.',
      supplierCode: 'SUP-002',
      status: 'Accepted',
      date: '2026-06-18',
      validTill: '2026-07-18',
      isReverseCharge: false,
      currency: 'USD',
      totalAmount: 45000,
      itemsCount: 3,
      createdBy: 'Nirjala Bagal',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z'
    },
    {
      id: '3',
      quotationNumber: 'PUR-SQTN-2026-003',
      supplier: 'PQR Packaging Solutions',
      supplierCode: 'SUP-003',
      status: 'Draft',
      date: '2026-06-22',
      validTill: '2026-07-22',
      isReverseCharge: true,
      currency: 'INR',
      totalAmount: 120000,
      itemsCount: 2,
      createdBy: 'P S Kamthe',
      createdAt: '2026-06-22T10:00:00Z',
      updatedAt: '2026-06-22T10:00:00Z'
    }
  ]);

  const suppliers = ['ABC Manufacturing Co.', 'XYZ Electronics Ltd.', 'PQR Packaging Solutions'];
  const statusOptions = ['Draft', 'Submitted', 'Accepted', 'Rejected', 'Expired', 'Converted'];

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.quotationNumber.toLowerCase().includes(filterText.toLowerCase()) ||
                         q.supplier.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || q.status === selectedStatus;
    const matchesSupplier = selectedSupplier === 'All' || q.supplier === selectedSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Submitted': return 'status-submitted';
      case 'Accepted': return 'status-accepted';
      case 'Rejected': return 'status-rejected';
      case 'Expired': return 'status-expired';
      case 'Converted': return 'status-converted';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Submitted': return <FaPaperPlane size={10} />;
      case 'Accepted': return <FaCheckCircle size={10} />;
      case 'Rejected': return <FaTimesCircle size={10} />;
      case 'Expired': return <FaClock size={10} />;
      case 'Converted': return <FaCheckCircle size={10} />;
      default: return null;
    }
  };

  const handleCreate = () => {
    navigate('/supplier-quotation/new');
  };

  const handleEdit = (quotation: SupplierQuotation) => {
    navigate(`/supplier-quotation/edit/${quotation.id}`);
  };

  const handleView = (quotation: SupplierQuotation) => {
    setSelectedQuotation(quotation);
    setShowViewModal(true);
  };

  const handleDelete = (quotation: SupplierQuotation) => {
    setSelectedQuotation(quotation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedQuotation) return;
    setLoading(true);
    
    setTimeout(() => {
      setQuotations(prev => prev.filter(q => q.id !== selectedQuotation.id));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Supplier Quotation deleted successfully!');
    }, 1000);
  };

  const handleDuplicate = (quotation: SupplierQuotation) => {
    const newQuotation: SupplierQuotation = {
      ...quotation,
      id: String(quotations.length + 1),
      quotationNumber: `PUR-SQTN-2026-${String(quotations.length + 1).padStart(3, '0')}`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setQuotations(prev => [...prev, newQuotation]);
    toast.success('Supplier Quotation duplicated successfully!');
  };

  const totalQuotations = quotations.length;
  const submittedQuotations = quotations.filter(q => q.status === 'Submitted').length;
  const acceptedQuotations = quotations.filter(q => q.status === 'Accepted').length;

  return (
    <div className={`supplier-quotation-page ${theme}-theme`}>
      <style>{`
        /* ── Page Container ─────────────────────────────────────── */
        .supplier-quotation-page {
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

        .supplier-quotation-page::-webkit-scrollbar { width: 4px; }
        .supplier-quotation-page::-webkit-scrollbar-track { background: transparent; }
        .supplier-quotation-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

        /* ── Header ──────────────────────────────────────────────── */
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

        /* ── Compact Stats ────────────────────────────────────────── */
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

        .stat-submitted {
          color: #3b82f6;
        }

        .stat-accepted {
          color: #10b981;
        }

        .stat-divider {
          width: 1px;
          height: 20px;
          background: var(--border-color, #e5e7eb);
        }

        /* ── Search Bar ───────────────────────────────────────────── */
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

        /* ── Expandable Filters ───────────────────────────────────── */
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

        /* ── Table ────────────────────────────────────────────────── */
        .quotation-container {
          flex: 1;
          min-height: 0;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
          height: 100%;
        }

        .quotation-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 900px;
        }

        .quotation-table thead {
          background: var(--layout-bg, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .quotation-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .quotation-table td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .quotation-row {
          transition: background 0.15s ease;
        }

        .quotation-row:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .number-cell {
          font-weight: 600;
          color: var(--primary-color, #6366f1);
          font-size: 12px;
        }

        .supplier-cell {
          font-weight: 500;
          color: var(--text-primary, #1f2433);
        }

        .date-cell {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .amount-cell {
          font-weight: 600;
          color: var(--text-primary, #1f2433);
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

        .status-draft {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-submitted {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-accepted {
          background: #d1fae5;
          color: #065f46;
        }

        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-expired {
          background: #fef3c7;
          color: #92400e;
        }

        .status-converted {
          background: #e0e7ff;
          color: #3730a3;
        }

        .reverse-charge-badge {
          display: inline-block;
          padding: 1px 8px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 500;
          margin-left: 4px;
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

        /* ── Empty State ───────────────────────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          text-align: center;
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

        /* ── Footer ────────────────────────────────────────────────── */
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

        /* ── MODALS ────────────────────────────────────────────────── */
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
          max-width: 650px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .view-modal { max-width: 700px; }
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

        /* ── View Modal ────────────────────────────────────────────── */
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
          min-width: 110px;
        }

        .view-row span {
          color: var(--text-primary, #1f2433);
        }

        /* ── Delete Modal ──────────────────────────────────────────── */
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

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 768px) {
          .supplier-quotation-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-wrap: wrap; justify-content: flex-end; }
          .search-bar { flex-direction: column; align-items: stretch; }
          .filter-wrapper { justify-content: space-between; }
          .quotation-table { min-width: 700px; }
          .modal-container { max-width: 100%; margin: 10px; }
          .modal-footer { flex-direction: column; }
          .modal-footer button { width: 100%; justify-content: center; }
          .view-grid { grid-template-columns: 1fr; }
          .compact-stats { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
          .stat-divider { display: none; }
        }

        @media (max-width: 480px) {
          .supplier-quotation-page { padding: 8px 12px; }
          .quotation-table { font-size: 12px; min-width: 600px; }
          .quotation-table th, .quotation-table td { padding: 6px 10px; }
          .action-group { gap: 0; }
          .action-btn { width: 24px; height: 24px; }
        }

        /* ─── Dark Theme ─────────────────────────────────────────── */
        .dark-theme .supplier-quotation-page { background: var(--layout-bg, #0f172a); }
        .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .badge { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .search-wrapper { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .search-input { color: var(--text-primary, #f8fafc); }
        .dark-theme .search-input::placeholder { color: var(--text-secondary, #64748b); }
        .dark-theme .filter-toggle { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .filter-toggle:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .expandable-filters { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .filter-group select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .quotation-container { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .quotation-table thead { background: var(--layout-bg, #0f172a); }
        .dark-theme .quotation-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
        .dark-theme .quotation-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .quotation-row:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .number-cell { color: var(--primary-color, #818cf8); }
        .dark-theme .supplier-cell { color: var(--text-primary, #f8fafc); }
        .dark-theme .date-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .amount-cell { color: var(--text-primary, #f8fafc); }
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
        .dark-theme .status-draft { background: rgba(107,114,128,0.2); color: #9ca3af; }
        .dark-theme .status-submitted { background: rgba(59,130,246,0.2); color: #60a5fa; }
        .dark-theme .status-accepted { background: rgba(16,185,129,0.2); color: #34d399; }
        .dark-theme .status-rejected { background: rgba(239,68,68,0.2); color: #f87171; }
        .dark-theme .status-expired { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .dark-theme .status-converted { background: rgba(99,102,241,0.2); color: var(--primary-color, #818cf8); }
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
        .dark-theme .reverse-charge-badge { background: rgba(251,191,36,0.2); color: #fbbf24; }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Supplier Quotations</h1>
          <span className="badge">{quotations.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> New Quotation
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="compact-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalQuotations}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Submitted</span>
          <span className="stat-value stat-submitted">{submittedQuotations}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Accepted</span>
          <span className="stat-value stat-accepted">{acceptedQuotations}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Draft</span>
          <span className="stat-value">{quotations.filter(q => q.status === 'Draft').length}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by quotation # or supplier..."
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
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} /> Filter
          </button>
          <span className="result-count">{filteredQuotations.length} of {quotations.length}</span>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Reverse Charge</label>
            <select>
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Quotation List */}
      <div className="quotation-container">
        {filteredQuotations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaFileAlt size={48} />
            </div>
            <h3>No supplier quotations found</h3>
            <p>Create your first supplier quotation to get started</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> New Quotation
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="quotation-table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Valid Till</th>
                  <th>Currency</th>
                  <th>Amount</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q) => (
                  <tr key={q.id} className="quotation-row">
                    <td className="number-cell">
                      {q.quotationNumber}
                      {q.isReverseCharge && (
                        <span className="reverse-charge-badge">RC</span>
                      )}
                    </td>
                    <td className="supplier-cell">{q.supplier}</td>
                    <td className="date-cell">{new Date(q.date).toLocaleDateString()}</td>
                    <td className="date-cell">{new Date(q.validTill).toLocaleDateString()}</td>
                    <td className="date-cell">{q.currency}</td>
                    <td className="amount-cell">{q.currency} {q.totalAmount.toLocaleString()}</td>
                    <td className="date-cell">{q.itemsCount}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(q.status)}`}>
                        {getStatusIcon(q.status)}
                        {q.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn view" 
                          title="View"
                          onClick={() => handleView(q)}
                        >
                          <FaEye size={12} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(q)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn copy" 
                          title="Duplicate"
                          onClick={() => handleDuplicate(q)}
                        >
                          <FaCopy size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(q)}
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
        )}
      </div>

      {/* Footer */}
      <div className="list-footer">
        <span>{filteredQuotations.length} of {quotations.length} quotations</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaCheckCircle size={11} /> {acceptedQuotations} accepted
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedQuotation && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedQuotation.quotationNumber}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section">
                  <h4>Quotation Details</h4>
                  <div className="view-row"><label>Number:</label><span>{selectedQuotation.quotationNumber}</span></div>
                  <div className="view-row"><label>Status:</label><span className={`status-badge ${getStatusColor(selectedQuotation.status)}`}>{selectedQuotation.status}</span></div>
                  <div className="view-row"><label>Date:</label><span>{new Date(selectedQuotation.date).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Valid Till:</label><span>{new Date(selectedQuotation.validTill).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Reverse Charge:</label><span>{selectedQuotation.isReverseCharge ? 'Yes' : 'No'}</span></div>
                </div>
                <div className="view-section">
                  <h4>Supplier Details</h4>
                  <div className="view-row"><label>Supplier:</label><span>{selectedQuotation.supplier}</span></div>
                  <div className="view-row"><label>Code:</label><span>{selectedQuotation.supplierCode}</span></div>
                  <div className="view-row"><label>Currency:</label><span>{selectedQuotation.currency}</span></div>
                  <div className="view-row"><label>Total Amount:</label><span className="amount-cell">{selectedQuotation.currency} {selectedQuotation.totalAmount.toLocaleString()}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4>Additional Information</h4>
                  <div className="view-row"><label>Items:</label><span>{selectedQuotation.itemsCount} items</span></div>
                  <div className="view-row"><label>Created By:</label><span>{selectedQuotation.createdBy}</span></div>
                  <div className="view-row"><label>Created:</label><span>{new Date(selectedQuotation.createdAt).toLocaleString()}</span></div>
                  <div className="view-row"><label>Updated:</label><span>{new Date(selectedQuotation.updatedAt).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => {
                toast.success('Quotation sent to supplier!');
                setShowViewModal(false);
              }}>
                <FaPaperPlane size={12} /> Send
              </button>
              <button className="btn-primary" onClick={() => handleEdit(selectedQuotation)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedQuotation && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Supplier Quotation</h2>
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
                You are about to delete <strong>{selectedQuotation.quotationNumber}</strong>
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