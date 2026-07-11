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
  FaExclamationTriangle,
  FaEllipsisV,
  FaFilePdf,
  FaFileExcel,
  FaBan,
  FaPaperPlane,
  FaTruck,
  FaFileInvoice,
  FaCopy,
  FaExternalLinkAlt,
  FaSpinner,
  FaSync
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

// ===== INTERFACES =====

interface DeliveryChallan {
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
  // Additional fields from your API
  invoiceNo?: string;
  warehouse?: string;
  vehicleNumber?: string;
  deliveryStatus?: string;
  totalDispatchQty?: number;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: DeliveryChallan[];
  };
}

// ===== STATUS BADGE =====
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    'Draft': { color: '#94a3b8', bg: '#f1f5f9', label: 'Draft' },
    'Submitted': { color: '#3b82f6', bg: '#eff6ff', label: 'Submitted' },
    'Cancelled': { color: '#f59e0b', bg: '#fffbeb', label: 'Cancelled' },
    'Pending': { color: '#f59e0b', bg: '#fffbeb', label: 'Pending' },
    'Partial Dispatch': { color: '#3b82f6', bg: '#eff6ff', label: 'Partial Dispatch' },
    'Fully Dispatched': { color: '#10b981', bg: '#ecfdf5', label: 'Fully Dispatched' }
  };
  const config = configs[status] || configs['Draft'];
  
  return (
    <span className="status-badge" style={{ color: config.color, background: config.bg }}>
      <span className="dot" style={{ background: config.color }} />
      {config.label}
    </span>
  );
};

// ===== SUMMARY CARD =====
const SummaryCard: React.FC<{ label: string; value: string | number; color: string; icon?: React.ReactNode }> = ({ 
  label, value, color, icon 
}) => {
  return (
    <div className="summary-card" style={{ borderLeftColor: color }}>
      <div className="summary-card-label">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="summary-card-value">{value}</div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const DeliveryChallans: React.FC = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== FETCH DATA =====
  const fetchChallans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get<ApiResponse>(`/delivery-note${query}`);
      
      if (response.data?.data?.records) {
        setChallans(response.data.data.records);
      } else {
        setChallans([]);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load');
      toast.error('Failed to load delivery challans');
    } finally {
      setLoading(false);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchChallans();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchChallans(), 500);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // ===== FILTER DATA =====
  const filteredData = challans.filter(item => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(search) ||
      (item.customer_name || '').toLowerCase().includes(search);
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== SUMMARY STATS =====
  const stats = {
    total: challans.length,
    draft: challans.filter(d => d.status === 'Draft').length,
    submitted: challans.filter(d => d.status === 'Submitted').length,
    cancelled: challans.filter(d => d.status === 'Cancelled').length,
  };

  // ===== ACTIONS =====
  const handleCreate = () => navigate('/delivery-challan/new');
  const handleRefresh = () => fetchChallans();
  const handleView = (id: string | number) => navigate(`/delivery-challan/view/${id}`);
  const handleEdit = (id: string | number) => navigate(`/delivery-challan/edit/${id}`);
  const handleDuplicate = (id: string | number) => navigate(`/delivery-challan/duplicate/${id}`);
  const handlePrint = () => window.print();
  
  const handleCancel = async (id: string | number) => {
    if (!window.confirm('Cancel this Delivery Challan?')) return;
    try {
      await api.post(`/delivery-note/${id}/cancel`, {});
      toast.success('Cancelled successfully');
      fetchChallans();
    } catch (err) {
      toast.error('Failed to cancel');
    }
    setShowMoreMenu(null);
  };

  const handleSubmit = async (id: string | number) => {
    if (!window.confirm('Submit this Delivery Challan?')) return;
    try {
      await api.post(`/delivery-note/${id}/submit`, {});
      toast.success('Submitted successfully');
      fetchChallans();
    } catch (err) {
      toast.error('Failed to submit');
    }
    setShowMoreMenu(null);
  };

  const handleDownloadPDF = (_id: string | number) => {
    toast.success(`Downloading PDF...`);
    setShowMoreMenu(null);
  };

  const toggleMenu = (id: string | number) => {
    setShowMoreMenu(showMoreMenu === String(id) ? null : String(id));
  };

  // ===== LOADING =====
  if (loading && challans.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-center">
          <FaSpinner className="spinning" size={40} />
          <p>Loading...</p>
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

  // ===== RENDER =====
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
          grid-template-columns: repeat(4, 1fr);
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

        .dc-number { font-weight: 600; color: #2563eb; }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

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

        .more-menu-container { position: relative; }
        .more-menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          min-width: 200px;
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
            <span className="active">Delivery Challans</span>
          </div>
          <h1 className="page-title">
            <FaTruck className="title-icon" />
            Delivery Challans
          </h1>
          <p className="page-subtitle">Create and manage delivery challans</p>
        </div>
        <div className="page-header-right">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus /> New DC
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
        <SummaryCard label="Total DCs" value={stats.total} color="#2563eb" icon={<FaTruck />} />
        <SummaryCard label="Draft" value={stats.draft} color="#94a3b8" icon={<FaFileInvoice />} />
        <SummaryCard label="Submitted" value={stats.submitted} color="#3b82f6" icon={<FaPaperPlane />} />
        <SummaryCard label="Cancelled" value={stats.cancelled} color="#f59e0b" icon={<FaBan />} />
      </div>

      {/* ===== FILTERS ===== */}
      <div className="filter-section">
        <div className="filter-section-top">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by DC No or Customer..."
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
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Cancelled">Cancelled</option>
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
                <th>DC No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="dc-number">{item.name || '-'}</td>
                  <td>{item.customer_name || '-'}</td>
                  <td>{formatDate(item.posting_date)}</td>
                  <td>{formatCurrency(item.grand_total)}</td>
                  <td><StatusBadge status={item.status || 'Draft'} /></td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="View" onClick={() => handleView(item.id)}>
                        <FaEye />
                      </button>
                      {item.status === 'Draft' && (
                        <button className="action-btn" title="Edit" onClick={() => handleEdit(item.id)}>
                          <FaEdit />
                        </button>
                      )}
                      <button className="action-btn" title="Print" onClick={handlePrint}>
                        <FaPrintIcon />
                      </button>
                      <div className="more-menu-container">
                        <button className="action-btn" title="More" onClick={() => toggleMenu(item.id)}>
                          <FaEllipsisV />
                        </button>
                        {showMoreMenu === String(item.id) && (
                          <div className="more-menu-dropdown">
                            <button onClick={() => handleView(item.id)}><FaEye /> View</button>
                            {item.status === 'Draft' && (
                              <>
                                <button onClick={() => handleEdit(item.id)}><FaEdit /> Edit</button>
                                <button onClick={() => handleSubmit(item.id)}><FaPaperPlane /> Submit</button>
                              </>
                            )}
                            <button onClick={() => handleDuplicate(item.id)}><FaCopy /> Duplicate</button>
                            <button onClick={() => handleDownloadPDF(item.id)}><FaFilePdf /> Download PDF</button>
                            <button onClick={() => handleDownloadPDF(item.id)}><FaFileExcel /> Download Excel</button>
                            <button onClick={() => navigate(`/customer-invoices?invoice=${item.invoiceNo || ''}`)}>
                              <FaExternalLinkAlt /> View Invoice
                            </button>
                            {item.status !== 'Cancelled' && (
                              <button className="danger" onClick={() => handleCancel(item.id)}>
                                <FaBan /> Cancel
                              </button>
                            )}
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
              <FaTruck className="empty-icon" />
              <h3>No Delivery Challans found</h3>
              <p>Create your first delivery challan to get started</p>
              <button className="btn-primary" onClick={handleCreate}>
                <FaPlus /> New DC
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
    </div>
  );
};

export default DeliveryChallans;