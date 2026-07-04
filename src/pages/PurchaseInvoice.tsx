import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaSpinner, FaCopy, FaEye,
  FaFileAlt, FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle,
  FaPaperPlane, FaReceipt,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './PurchaseInvoice.css';

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  supplierCode: string;
  purchaseOrder: string;
  status: 'Draft' | 'Submitted' | 'Partially Paid' | 'Fully Paid' | 'Overdue' | 'Cancelled';
  date: string;
  dueDate: string;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  itemsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function PurchaseInvoice() {
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
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);

  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([
    {
      id: '1',
      invoiceNumber: 'PI-2026-001',
      supplier: 'ABC Manufacturing Co.',
      supplierCode: 'SUP-001',
      purchaseOrder: 'PO-2026-001',
      status: 'Partially Paid',
      date: '2026-06-20',
      dueDate: '2026-07-20',
      currency: 'INR',
      totalAmount: 175000,
      paidAmount: 75000,
      balanceAmount: 100000,
      itemsCount: 2,
      createdBy: 'Tejas Tarte',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    },
    {
      id: '2',
      invoiceNumber: 'PI-2026-002',
      supplier: 'XYZ Electronics Ltd.',
      supplierCode: 'SUP-002',
      purchaseOrder: 'PO-2026-002',
      status: 'Fully Paid',
      date: '2026-06-18',
      dueDate: '2026-07-18',
      currency: 'USD',
      totalAmount: 45000,
      paidAmount: 45000,
      balanceAmount: 0,
      itemsCount: 3,
      createdBy: 'Nirjala Bagal',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z'
    },
    {
      id: '3',
      invoiceNumber: 'PI-2026-003',
      supplier: 'PQR Packaging Solutions',
      supplierCode: 'SUP-003',
      purchaseOrder: 'PO-2026-003',
      status: 'Draft',
      date: '2026-06-22',
      dueDate: '2026-07-22',
      currency: 'INR',
      totalAmount: 120000,
      paidAmount: 0,
      balanceAmount: 120000,
      itemsCount: 2,
      createdBy: 'P S Kamthe',
      createdAt: '2026-06-22T10:00:00Z',
      updatedAt: '2026-06-22T10:00:00Z'
    }
  ]);

  const suppliers = ['ABC Manufacturing Co.', 'XYZ Electronics Ltd.', 'PQR Packaging Solutions'];
  const statusOptions = ['Draft', 'Submitted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(filterText.toLowerCase()) ||
                         inv.supplier.toLowerCase().includes(filterText.toLowerCase()) ||
                         inv.purchaseOrder.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
    const matchesSupplier = selectedSupplier === 'All' || inv.supplier === selectedSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Pagination calculations
  const totalFilteredItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  
  const paginatedData = filteredInvoices.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map((r) => r.id)));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllChecked(next.size === paginatedData.length);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
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
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'inv-status-draft';
      case 'Submitted': return 'inv-status-submitted';
      case 'Partially Paid': return 'inv-status-partial';
      case 'Fully Paid': return 'inv-status-paid';
      case 'Overdue': return 'inv-status-overdue';
      case 'Cancelled': return 'inv-status-cancelled';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Submitted': return <FaPaperPlane size={10} />;
      case 'Partially Paid': return <FaClock size={10} />;
      case 'Fully Paid': return <FaCheckCircle size={10} />;
      case 'Overdue': return <FaExclamationTriangle size={10} />;
      case 'Cancelled': return <FaTimesCircle size={10} />;
      default: return null;
    }
  };

  const handleCreate = () => {
    navigate('/purchase-invoice/new');
  };

  const handleEdit = (invoice: PurchaseInvoice) => {
    navigate(`/purchase-invoice/edit/${invoice.id}`);
  };

  const handleRowClick = (invoice: PurchaseInvoice) => {
    navigate(`/purchase-invoice/edit/${invoice.id}`);
  };

  const handleView = (invoice: PurchaseInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleDelete = (invoice: PurchaseInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedInvoice) return;
    setLoading(true);
    
    setTimeout(() => {
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Purchase Invoice deleted successfully!');
    }, 1000);
  };

  const handleDuplicate = (invoice: PurchaseInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const newInvoice: PurchaseInvoice = {
      ...invoice,
      id: String(invoices.length + 1),
      invoiceNumber: `PI-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      status: 'Draft',
      paidAmount: 0,
      balanceAmount: invoice.totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setInvoices(prev => [...prev, newInvoice]);
    toast.success('Purchase Invoice duplicated successfully!');
  };

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'Fully Paid').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const draftInvoices = invoices.filter(inv => inv.status === 'Draft').length;

  const clearFilters = () => {
    setFilterText('');
    setSelectedStatus('All');
    setSelectedSupplier('All');
  };

  return (
    <div className={`inv-page ${theme}-theme`}>
      {/* Header */}
      <div className="inv-header">
        <div className="inv-header-left">
          <h1 className="inv-title">Purchase Invoices</h1>
          <span className="inv-badge">{invoices.length}</span>
        </div>
        <div className="inv-header-actions">
          <button className="inv-btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> New Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="inv-stats-container">
        <div className="inv-stat-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8cc 100%)' }}>
          <div className="inv-stat-icon">
            <FaReceipt size={20} />
          </div>
          <div className="inv-stat-content">
            <p className="inv-stat-title">Total Invoices</p>
            <p className="inv-stat-value">{totalInvoices}</p>
          </div>
        </div>
        <div className="inv-stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24cc 100%)' }}>
          <div className="inv-stat-icon">
            <FaFileAlt size={20} />
          </div>
          <div className="inv-stat-content">
            <p className="inv-stat-title">Draft</p>
            <p className="inv-stat-value">{draftInvoices}</p>
          </div>
        </div>
        <div className="inv-stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399cc 100%)' }}>
          <div className="inv-stat-icon">
            <FaCheckCircle size={20} />
          </div>
          <div className="inv-stat-content">
            <p className="inv-stat-title">Fully Paid</p>
            <p className="inv-stat-value">{paidInvoices}</p>
          </div>
        </div>
        <div className="inv-stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171cc 100%)' }}>
          <div className="inv-stat-icon">
            <FaExclamationTriangle size={20} />
          </div>
          <div className="inv-stat-content">
            <p className="inv-stat-title">Overdue</p>
            <p className="inv-stat-value">{overdueInvoices}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="inv-filter-bar">
        <div className="inv-filter-left">
          <div className="inv-search-wrapper">
            <FaSearch className="inv-search-icon" />
            <input
              type="text"
              placeholder="Search by invoice #, supplier or PO..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="inv-search-input"
            />
            {filterText && (
              <button className="inv-search-clear" onClick={() => setFilterText('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="inv-filter-right">
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="inv-filter-select"
          >
            <option value="All">All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            className={`inv-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} />
            Filter
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== 'All' || selectedSupplier !== 'All') && (
        <div className="inv-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {filterText && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{filterText}"
            </span>
          )}
          {selectedStatus !== 'All' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {selectedStatus}
            </span>
          )}
          {selectedSupplier !== 'All' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Supplier:</strong> {selectedSupplier}
            </span>
          )}
          <button 
            onClick={clearFilters}
            className="inv-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Expandable Filters */}
      {showFilters && (
        <div className="inv-expandable-filters">
          <div className="inv-filter-group">
            <label>Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="inv-filter-group">
            <label>Currency</label>
            <select>
              <option value="all">All Currencies</option>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="inv-apply-filters">Apply</button>
        </div>
      )}

      {/* Table */}
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th className="inv-th-check">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="inv-checkbox" />
              </th>
              <th className="inv-th">Invoice #</th>
              <th className="inv-th">Supplier</th>
              <th className="inv-th">PO #</th>
              <th className="inv-th">Date</th>
              <th className="inv-th">Total</th>
              <th className="inv-th">Balance</th>
              <th className="inv-th">Status</th>
              <th className="inv-th inv-th-meta">
                <span className="inv-count-label">{totalFilteredItems} of {invoices.length}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="inv-empty-state">
                  <div className="inv-empty-content">
                    <FaReceipt size={48} />
                    <p>No purchase invoices found</p>
                    <span>Create your first purchase invoice to get started</span>
                    <button className="inv-btn-primary" onClick={handleCreate} style={{ marginTop: '12px' }}>
                      <FaPlus size={12} /> New Invoice
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((inv) => (
                <tr
                  key={inv.id}
                  className={`inv-tr ${selected.has(inv.id) ? "inv-tr-selected" : ""}`}
                  onClick={() => handleRowClick(inv)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="inv-td-check" onClick={(e) => toggleRow(inv.id, e)}>
                    <input type="checkbox" checked={selected.has(inv.id)} onChange={() => {}} className="inv-checkbox" />
                  </td>
                  <td className="inv-td inv-td-id">{inv.invoiceNumber}</td>
                  <td className="inv-td">{inv.supplier}</td>
                  <td className="inv-td">{inv.purchaseOrder}</td>
                  <td className="inv-td">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="inv-td">{inv.currency} {inv.totalAmount.toLocaleString()}</td>
                  <td className={`inv-td ${inv.balanceAmount > 0 && new Date(inv.dueDate) < new Date() ? 'inv-balance-overdue' : ''}`}>
                    {inv.currency} {inv.balanceAmount.toLocaleString()}
                  </td>
                  <td className="inv-td">
                    <span className={`inv-status-badge ${getStatusColor(inv.status)}`}>
                      {getStatusIcon(inv.status)}
                      {inv.status}
                    </span>
                  </td>
                  <td className="inv-td inv-td-meta">
                    <span className="inv-ago">{new Date(inv.createdAt).toLocaleDateString()}</span>
                    <span className="inv-dot">·</span>
                    <div className="inv-action-buttons">
                      <button 
                        className="inv-action-btn inv-action-view" 
                        onClick={(e) => handleView(inv, e)}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button 
                        className="inv-action-btn inv-action-edit" 
                        onClick={(e) => { e.stopPropagation(); handleEdit(inv); }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        className="inv-action-btn inv-action-copy" 
                        onClick={(e) => handleDuplicate(inv, e)}
                        title="Duplicate"
                      >
                        <FaCopy size={12} />
                      </button>
                      <button 
                        className="inv-action-btn inv-action-delete" 
                        onClick={(e) => handleDelete(inv, e)}
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
      <div className="inv-pagination">
        <div className="inv-pagination-left">
          <span className="inv-pagination-label">Show:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="inv-page-size-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="inv-pagination-label">entries</span>
        </div>
        <div className="inv-pagination-center">
          <button 
            onClick={goToFirstPage} 
            disabled={currentPage === 1 || totalFilteredItems === 0} 
            className="inv-page-btn"
          >
            <FaAngleDoubleLeft size={12} />
          </button>
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 1 || totalFilteredItems === 0} 
            className="inv-page-btn"
          >
            <FaChevronLeft size={12} />
          </button>
          {totalFilteredItems > 0 && getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`inv-page-btn ${currentPage === page ? 'inv-page-btn-active' : ''}`}
            >
              {page}
            </button>
          ))}
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages || totalFilteredItems === 0} 
            className="inv-page-btn"
          >
            <FaChevronRight size={12} />
          </button>
          <button 
            onClick={goToLastPage} 
            disabled={currentPage === totalPages || totalFilteredItems === 0} 
            className="inv-page-btn"
          >
            <FaAngleDoubleRight size={12} />
          </button>
        </div>
        <div className="inv-pagination-right">
          <span className="inv-pagination-info">
            {totalFilteredItems > 0 ? (
              `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
            ) : (
              'No entries to show'
            )}
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedInvoice && (
        <div className="inv-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="inv-modal inv-modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <span className="inv-modal-title">{selectedInvoice.invoiceNumber}</span>
              <button className="inv-modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="inv-modal-body">
              <div className="inv-view-grid">
                <div className="inv-view-section">
                  <h4>Invoice Details</h4>
                  <div className="inv-view-row"><label>Number:</label><span>{selectedInvoice.invoiceNumber}</span></div>
                  <div className="inv-view-row"><label>Status:</label><span className={`inv-status-badge ${getStatusColor(selectedInvoice.status)}`}>{selectedInvoice.status}</span></div>
                  <div className="inv-view-row"><label>Date:</label><span>{new Date(selectedInvoice.date).toLocaleDateString()}</span></div>
                  <div className="inv-view-row"><label>Due Date:</label><span>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span></div>
                </div>
                <div className="inv-view-section">
                  <h4>Supplier Details</h4>
                  <div className="inv-view-row"><label>Supplier:</label><span>{selectedInvoice.supplier}</span></div>
                  <div className="inv-view-row"><label>Code:</label><span>{selectedInvoice.supplierCode}</span></div>
                  <div className="inv-view-row"><label>PO #:</label><span>{selectedInvoice.purchaseOrder}</span></div>
                </div>
                <div className="inv-view-section full-width">
                  <h4>Financial Summary</h4>
                  <div className="inv-view-row"><label>Total Amount:</label><span className="inv-amount-cell">{selectedInvoice.currency} {selectedInvoice.totalAmount.toLocaleString()}</span></div>
                  <div className="inv-view-row"><label>Paid Amount:</label><span className="inv-paid-cell">{selectedInvoice.currency} {selectedInvoice.paidAmount.toLocaleString()}</span></div>
                  <div className="inv-view-row"><label>Balance Amount:</label><span className="inv-balance-cell">{selectedInvoice.currency} {selectedInvoice.balanceAmount.toLocaleString()}</span></div>
                  <div className="inv-view-row"><label>Items:</label><span>{selectedInvoice.itemsCount} items</span></div>
                </div>
              </div>
            </div>
            <div className="inv-modal-footer">
              <button className="inv-btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="inv-btn-primary" onClick={() => handleEdit(selectedInvoice)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedInvoice && (
        <div className="inv-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="inv-modal inv-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <span className="inv-modal-title">Confirm Delete</span>
              <button className="inv-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="inv-modal-body">
              <p>Are you sure you want to delete this purchase invoice?</p>
              <p className="inv-modal-item-name"><strong>{selectedInvoice.invoiceNumber}</strong></p>
              <p className="inv-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="inv-modal-footer">
              <button className="inv-btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="inv-btn-delete" onClick={handleDeleteConfirm} disabled={loading}>
                {loading && <FaSpinner className="inv-spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}