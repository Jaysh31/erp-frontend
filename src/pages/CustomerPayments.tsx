import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaPrint,
  FaEye,
  FaEdit,
  FaPrint as FaPrintIcon,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaEllipsisV,
  FaFilePdf,
  FaEnvelope,
  FaBan,
  FaMoneyBillWave,
  FaReceipt,
  FaRupeeSign,
  FaWallet,
  FaUniversity,
  FaCreditCard,
  FaMobile,
  FaSpinner,
  FaSync,
  FaTruck,
  FaFileInvoice,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

// ===== INTERFACES =====

interface CustomerPayment {
  id: string | number;
  name: string;
  invoice_no: string;
  invoice_id: string | number;
  dc_no?: string;
  dc_id?: string | number;
  customer: string;
  customer_name: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Partial' | 'Paid';
  invoice_status: 'Not Generated' | 'Generated';
  reference_no?: string;
  transaction_no?: string;
  bank_account?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  modified: string;
  modified_by: string;
  invoice_amount?: number;
  outstanding_amount?: number;
  paid_amount?: number;
}


interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: CustomerPayment[];
  };
}

// ===== STATUS BADGE =====
const StatusBadge: React.FC<{ status: string; type?: 'payment' | 'invoice' | 'delivery' }> = ({ 
  status}) => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    // Payment Status
    'Pending': { color: '#f59e0b', bg: '#fffbeb', label: 'Pending' },
    'Partial': { color: '#3b82f6', bg: '#eff6ff', label: 'Partial' },
    'Paid': { color: '#10b981', bg: '#ecfdf5', label: 'Paid' },
    // Invoice Status
    'Not Generated': { color: '#94a3b8', bg: '#f1f5f9', label: 'Not Generated' },
    'Generated': { color: '#8b5cf6', bg: '#f5f3ff', label: 'Generated' },
    'Draft': { color: '#94a3b8', bg: '#f1f5f9', label: 'Draft' },
    'Sent': { color: '#3b82f6', bg: '#eff6ff', label: 'Sent' },
    'Overdue': { color: '#ef4444', bg: '#fef2f2', label: 'Overdue' },
    'Cancelled': { color: '#f59e0b', bg: '#fffbeb', label: 'Cancelled' },
    // Delivery Status
    'Pending Dispatch': { color: '#f59e0b', bg: '#fffbeb', label: 'Pending' },
    'Partial Dispatch': { color: '#3b82f6', bg: '#eff6ff', label: 'Partial' },
    'Fully Dispatched': { color: '#10b981', bg: '#ecfdf5', label: 'Fully Dispatched' }
  };
  const config = configs[status] || configs['Pending'];
  
  return (
    <span className="status-badge" style={{ color: config.color, background: config.bg }}>
      <span className="dot" style={{ background: config.color }} />
      {config.label}
    </span>
  );
};

// ===== SUMMARY CARD =====
const SummaryCard: React.FC<{ 
  label: string; 
  value: string | number; 
  color: string; 
  icon?: React.ReactNode;
  subtitle?: string;
}> = ({ label, value, color, icon, subtitle }) => {
  return (
    <div className="summary-card" style={{ borderLeftColor: color }}>
      <div className="summary-card-label">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="summary-card-value">{value}</div>
      {subtitle && <div className="summary-card-subtitle">{subtitle}</div>}
    </div>
  );
};

// ===== PAYMENT METHOD ICON =====
const PaymentMethodIcon: React.FC<{ method: string }> = ({ method }) => {
  const icons: Record<string, React.ReactNode> = {
    'Cash': <FaWallet />,
    'Bank Transfer': <FaUniversity />,
    'Cheque': <FaPrintIcon />,
    'Credit Card': <FaCreditCard />,
    'Debit Card': <FaCreditCard />,
    'UPI': <FaMobile />
  };
  return <span className="method-icon">{icons[method] || <FaMoneyBillWave />}</span>;
};

// ===== MAIN COMPONENT =====
const CustomerPayments: React.FC = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedInvoice,] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<CustomerPayment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== FETCH DATA =====
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedMethod !== 'all') params.append('payment_method', selectedMethod);
      if (selectedInvoice !== 'all') params.append('invoice', selectedInvoice);
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get<ApiResponse>(`/customer-payments${query}`);
      
      if (response.data?.data?.records) {
        setPayments(response.data.data.records);
      } else {
        setPayments([]);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load payments');
      toast.error('Failed to load customer payments');
    } finally {
      setLoading(false);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPayments(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, selectedMethod, selectedInvoice, currentPage]);

  // ===== HELPERS =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // ===== FILTER DATA =====
  const filteredData = payments.filter(item => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(search) ||
      (item.customer_name || '').toLowerCase().includes(search) ||
      (item.invoice_no || '').toLowerCase().includes(search) ||
      (item.dc_no || '').toLowerCase().includes(search);
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || item.payment_method === selectedMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== SUMMARY STATS =====
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const partialCount = payments.filter(p => p.status === 'Partial').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const invoiceGenerated = payments.filter(p => p.invoice_status === 'Generated').length;

  const stats = {
    total: payments.length,
    totalAmount: totalAmount,
    paid: paidCount,
    partial: partialCount,
    pending: pendingCount,
    invoiceGenerated: invoiceGenerated
  };

  // ===== ACTIONS =====
  const handleCreate = () => navigate('/customer-payments/new');
  const handleRefresh = () => fetchPayments();
  const handleView = (payment: CustomerPayment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
    setShowMoreMenu(null);
  };
  const handleEdit = (id: string | number) => navigate(`/customer-payments/edit/${id}`);
  const handlePrint = () => window.print();
  
  const handleGenerateInvoice = async (id: string | number) => {
    if (!window.confirm('Generate invoice for this payment?')) return;
    try {
      await api.post(`/customer-payments/${id}/generate-invoice`, {});
      toast.success('Invoice generated successfully');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to generate invoice');
    }
    setShowMoreMenu(null);
  };

  const handleCancel = async (id: string | number) => {
    if (!window.confirm('Cancel this payment?')) return;
    try {
      await api.post(`/customer-payments/${id}/cancel`, {});
      toast.success('Payment cancelled successfully');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to cancel payment');
    }
    setShowMoreMenu(null);
  };

  const handleViewInvoice = (invoiceNo?: string) => {
    if (!invoiceNo) return;
    navigate(`/customer-invoices?invoice=${invoiceNo}`);
  };

  const handleViewDC = (dcNo?: string) => {
    if (!dcNo) return;
    navigate(`/delivery-challans?dc=${dcNo}`);
  };

  const toggleMenu = (id: string | number) => {
    setShowMoreMenu(showMoreMenu === String(id) ? null : String(id));
  };

  // ===== LOADING =====
  if (loading && payments.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-center">
          <FaSpinner className="spinning" size={40} />
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  // ===== ERROR =====
  if (error) {
    return (
      <div className="page-container">
        <div className="error-center">
          <FaExclamationTriangle size={40} color="#ef4444" />
          <h3>Failed to load</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={handleRefresh}>
            <FaSync /> Retry
          </button>
        </div>
      </div>
    );
  }

   function handleCollectPayment(_id: string | number): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="page-container">
      <style>{`
        .page-container {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        .loading-center, .error-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .spinning {
          animation: spin 1s linear infinite;
          color: #2563eb;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #fff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #2563eb;
          color: #2563eb;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .page-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
        }

        .breadcrumb .separator { color: #e2e8f0; }
        .breadcrumb .active { color: #1e293b; font-weight: 500; }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }

        .page-title .title-icon { color: #2c7a8a; }

        .page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .page-header-right {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: #fff;
          padding: 16px 20px;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border-left: 4px solid;
          transition: all 0.2s;
        }

        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .summary-card-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .summary-card-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-top: 4px;
        }

        .summary-card-subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .filter-section {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .filter-section-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-container {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          background: #fff;
        }

        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }

        .clear-search:hover { color: #1e293b; }

        .filter-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-toggle:hover {
          background: #f8fafc;
          border-color: #2563eb;
          color: #2563eb;
        }

        .filter-toggle.active {
          background: #eff6ff;
          border-color: #2563eb;
          color: #2563eb;
        }

        .filter-selects {
          display: flex;
          gap: 8px;
        }

        .filter-select {
          padding: 10px 36px 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2364748b'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          min-width: 160px;
        }

        .filter-select:focus { outline: none; border-color: #2563eb; }

        .table-container {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          overflow: hidden;
          min-height: 300px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table thead {
          background: #f8fafc;
        }

        .data-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .data-table tbody tr:hover { background: #f8fafc; }
        .data-table tbody tr:last-child td { border-bottom: none; }

        .payment-number { font-weight: 600; color: #2563eb; }
        .invoice-link { color: #8b5cf6; cursor: pointer; }
        .invoice-link:hover { text-decoration: underline; }
        .dc-link { color: #f59e0b; cursor: pointer; }
        .dc-link:hover { text-decoration: underline; }

        .method-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          background: #f1f5f9;
          color: #64748b;
        }

        .method-icon { font-size: 12px; margin-right: 4px; }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .action-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .action-btn.payment-btn {
          color: #3b82f6;
        }

        .action-btn.payment-btn:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .action-btn.invoice-btn {
          color: #8b5cf6;
        }

        .action-btn.invoice-btn:hover {
          background: #f5f3ff;
          color: #7c3aed;
        }

        .more-menu-container { position: relative; }
        .more-menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          min-width: 220px;
          z-index: 100;
          padding: 4px 0;
          margin-top: 4px;
        }

        .more-menu-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: #1e293b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .more-menu-dropdown button:hover { background: #f8fafc; color: #2563eb; }
        .more-menu-dropdown button.danger { color: #ef4444; }
        .more-menu-dropdown button.danger:hover { background: #fef2f2; }

        .table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pagination-info { font-size: 14px; color: #64748b; }
        .pagination-controls { display: flex; gap: 4px; }

        .pagination-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          padding: 0 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #fff;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #2563eb;
          color: #2563eb;
        }

        .pagination-btn.active {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }

        .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .empty-state {
          padding: 60px 20px !important;
          text-align: center !important;
          display: table-cell !important;
        }

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-icon { font-size: 48px; color: #94a3b8; }
        .empty-state-content h3 { font-size: 18px; color: #1e293b; margin: 0; }
        .empty-state-content p { color: #64748b; margin: 0; }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          gap: 12px;
        }

        /* ===== DETAIL MODAL ===== */
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
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          padding: 24px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #94a3b8;
          cursor: pointer;
        }

        .modal-close:hover { color: #1e293b; }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
        }

        .detail-item label {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .detail-item .value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
        }

        .detail-item .value.amount {
          font-size: 20px;
          font-weight: 700;
          color: #2563eb;
        }

        .related-items {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .related-items h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .related-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .related-item .item-icon {
          font-size: 18px;
          color: #94a3b8;
        }

        .related-item .item-details {
          flex: 1;
        }

        .related-item .item-details .item-title {
          font-weight: 500;
          color: #1e293b;
        }

        .related-item .item-details .item-sub {
          font-size: 12px;
          color: #94a3b8;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }

        .modal-actions .btn-secondary,
        .modal-actions .btn-primary {
          flex: 0 0 auto;
        }

        @media (max-width: 1200px) {
          .summary-cards { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 992px) {
          .detail-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .page-container { padding: 16px; }
          .page-header { flex-direction: column; gap: 16px; }
          .page-header-right { width: 100%; }
          .summary-cards { grid-template-columns: 1fr 1fr; }
          .filter-section-top { flex-direction: column; align-items: stretch; }
          .filter-actions { width: 100%; flex-wrap: wrap; }
          .filter-selects { flex: 1; flex-wrap: wrap; }
          .filter-select { flex: 1; min-width: 120px; }
          .data-table { display: block; overflow-x: auto; white-space: nowrap; }
          .more-menu-dropdown { right: -80px; }
          .modal-content { margin: 16px; max-height: 95vh; }
          .modal-actions { flex-direction: column; }
          .modal-actions button { width: 100%; justify-content: center; }
        }

        @media (max-width: 480px) {
          .summary-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span>Accounts</span>
            <span className="separator">/</span>
            <span>Receivables</span>
            <span className="separator">/</span>
            <span className="active">Customer Payments</span>
          </div>
          <h1 className="page-title">
            <FaMoneyBillWave className="title-icon" />
            Customer Payments
          </h1>
          <p className="page-subtitle">Collect and manage customer payments against invoices and challans</p>
        </div>
        <div className="page-header-right">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus /> Collect Payment
          </button>
          <button className="btn-secondary" onClick={handleRefresh}>
            <FaSync /> Refresh
          </button>
          <button className="btn-secondary">
            <FaDownload /> Export
          </button>
          <button className="btn-secondary" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="summary-cards">
        <SummaryCard 
          label="Total Payments" 
          value={stats.total} 
          color="#2563eb" 
          icon={<FaReceipt />}
        />
        <SummaryCard 
          label="Total Amount" 
          value={formatCurrency(stats.totalAmount)} 
          color="#10b981" 
          icon={<FaRupeeSign />}
        />
        <SummaryCard 
          label="Paid" 
          value={stats.paid} 
          color="#10b981" 
          icon={<FaCheckCircle />}
        />
        <SummaryCard 
          label="Partial" 
          value={stats.partial} 
          color="#3b82f6" 
          icon={<FaClock />}
        />
        <SummaryCard 
          label="Pending" 
          value={stats.pending} 
          color="#f59e0b" 
          icon={<FaExclamationTriangle />}
        />
        <SummaryCard 
          label="Invoices Generated" 
          value={stats.invoiceGenerated} 
          color="#8b5cf6" 
          icon={<FaFileInvoice />}
        />
      </div>

      {/* ===== FILTERS ===== */}
      <div className="filter-section">
        <div className="filter-section-top">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Payment No, Invoice No, DC No, or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>
          <div className="filter-actions">
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
            <div className="filter-selects">
              <select 
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
              <select 
                className="filter-select"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <FaSpinner className="spinning" size={30} />
            <span>Loading...</span>
          </div>
        ) : paginatedData.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment No</th>
                <th>Invoice No</th>
                <th>DC No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Invoice Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="payment-number">{item.name || '-'}</td>
                  <td>
                    {item.invoice_no ? (
                      <span className="invoice-link" onClick={() => handleViewInvoice(item.invoice_no)}>
                        {item.invoice_no}
                        <FaExternalLinkAlt size={10} style={{ marginLeft: '4px' }} />
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    {item.dc_no ? (
                      <span className="dc-link" onClick={() => handleViewDC(item.dc_no)}>
                        {item.dc_no}
                        <FaExternalLinkAlt size={10} style={{ marginLeft: '4px' }} />
                      </span>
                    ) : '-'}
                  </td>
                  <td>{item.customer_name || '-'}</td>
                  <td>{formatDate(item.payment_date)}</td>
                  <td>
                    <span className="method-badge">
                      <PaymentMethodIcon method={item.payment_method} />
                      {item.payment_method || 'N/A'}
                    </span>
                  </td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td><StatusBadge status={item.status || 'Pending'} type="payment" /></td>
                  <td><StatusBadge status={item.invoice_status || 'Not Generated'} type="invoice" /></td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="View" onClick={() => handleView(item)}>
                        <FaEye />
                      </button>
                      {item.status !== 'Paid' && (
                        <button 
                          className="action-btn payment-btn" 
                          title="Collect Payment"
                          onClick={() => handleCollectPayment(item.id)}
                        >
                          <FaMoneyBillWave />
                        </button>
                      )}
                      {item.status === 'Paid' && item.invoice_status === 'Not Generated' && (
                        <button 
                          className="action-btn invoice-btn" 
                          title="Generate Invoice"
                          onClick={() => handleGenerateInvoice(item.id)}
                        >
                          <FaFileInvoice />
                        </button>
                      )}
                      <div className="more-menu-container">
                        <button className="action-btn" title="More" onClick={() => toggleMenu(item.id)}>
                          <FaEllipsisV />
                        </button>
                        {showMoreMenu === String(item.id) && (
                          <div className="more-menu-dropdown">
                            <button onClick={() => handleView(item)}><FaEye /> View Details</button>
                            <button onClick={() => handleEdit(item.id)}><FaEdit /> Edit</button>
                            {item.invoice_no && (
                              <button onClick={() => handleViewInvoice(item.invoice_no)}>
                                <FaExternalLinkAlt /> View Invoice
                              </button>
                            )}
                            {item.dc_no && (
                              <button onClick={() => handleViewDC(item.dc_no)}>
                                <FaTruck /> View DC
                              </button>
                            )}
                            <button><FaFilePdf /> Download Receipt</button>
                            <button><FaEnvelope /> Send Receipt</button>
                            <button className="danger" onClick={() => handleCancel(item.id)}>
                              <FaBan /> Cancel Payment
                            </button>
                            <button onClick={handlePrint}><FaPrintIcon /> Print</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <FaMoneyBillWave className="empty-icon" />
              <h3>No customer payments found</h3>
              <p>Collect your first customer payment to get started</p>
              <button className="btn-primary" onClick={handleCreate}>
                <FaPlus /> Collect Payment
              </button>
            </div>
          </div>
        )}

        {/* ===== PAGINATION ===== */}
        {filteredData.length > 0 && (
          <div className="table-footer">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FaMoneyBillWave style={{ color: '#2563eb' }} />
                Payment Details
              </h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Payment No</label>
                  <span className="value">{selectedPayment.name || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Customer</label>
                  <span className="value">{selectedPayment.customer_name || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Invoice No</label>
                  <span className="value">
                    {selectedPayment.invoice_no ? (
                      <span className="invoice-link" onClick={() => handleViewInvoice(selectedPayment.invoice_no)}>
                        {selectedPayment.invoice_no}
                      </span>
                    ) : '-'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>DC No</label>
                  <span className="value">
                    {selectedPayment.dc_no ? (
                      <span className="dc-link" onClick={() => handleViewDC(selectedPayment.dc_no)}>
                        {selectedPayment.dc_no}
                      </span>
                    ) : '-'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Payment Date</label>
                  <span className="value">{formatDate(selectedPayment.payment_date)}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Method</label>
                  <span className="value">
                    <span className="method-badge">
                      <PaymentMethodIcon method={selectedPayment.payment_method} />
                      {selectedPayment.payment_method || 'N/A'}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <label>Amount</label>
                  <span className="value amount">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span className="value"><StatusBadge status={selectedPayment.status || 'Pending'} type="payment" /></span>
                </div>
                <div className="detail-item full-width">
                  <label>Reference / Notes</label>
                  <span className="value">{selectedPayment.notes || selectedPayment.reference_no || '-'}</span>
                </div>
              </div>

              {/* Related Items */}
              <div className="related-items">
                <h4>Related Documents</h4>
                {selectedPayment.invoice_no && (
                  <div className="related-item">
                    <span className="item-icon"><FaFileInvoice /></span>
                    <div className="item-details">
                      <div className="item-title">Invoice: {selectedPayment.invoice_no}</div>
                      <div className="item-sub">Click to view invoice details</div>
                    </div>
                    <button className="btn-secondary" onClick={() => handleViewInvoice(selectedPayment.invoice_no)}>
                      <FaExternalLinkAlt /> View
                    </button>
                  </div>
                )}
                {selectedPayment.dc_no && (
                  <div className="related-item">
                    <span className="item-icon"><FaTruck /></span>
                    <div className="item-details">
                      <div className="item-title">Delivery Challan: {selectedPayment.dc_no}</div>
                      <div className="item-sub">Click to view DC details</div>
                    </div>
                    <button className="btn-secondary" onClick={() => handleViewDC(selectedPayment.dc_no)}>
                      <FaExternalLinkAlt /> View
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                <button className="btn-secondary" onClick={() => handleEdit(selectedPayment.id)}>
                  <FaEdit /> Edit
                </button>
                {selectedPayment.status === 'Paid' && selectedPayment.invoice_status === 'Not Generated' && (
                  <button className="btn-primary" onClick={() => handleGenerateInvoice(selectedPayment.id)}>
                    <FaFileInvoice /> Generate Invoice
                  </button>
                )}
                <button className="btn-secondary"><FaFilePdf /> Download Receipt</button>
                <button className="btn-secondary"><FaEnvelope /> Send Email</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayments;