import { useState } from 'react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaCopy, FaEye,
  FaFileAlt, FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle,
  FaTruck, FaSpinner,
  FaChevronLeft, FaChevronRight,
  FaAngleDoubleLeft, FaAngleDoubleRight,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './PurchaseOrder.css';

interface PurchaseOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  receivedQty: number;
  balanceQty: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  supplier: string;
  supplierCode: string;
  status: 'Draft' | 'Submitted' | 'Partially Received' | 'Fully Received' | 'Cancelled' | 'Closed';
  orderDate: string;
  deliveryDate: string;
  currency: string;
  totalAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  paymentTerms: string;
  shippingAddress: string;
  billingAddress: string;
  notes: string;
  items: PurchaseOrderItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function PurchaseOrder() {
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
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: '1',
      poNumber: 'PO-2026-001',
      title: 'Raw Material Purchase',
      supplier: 'ABC Manufacturing Co.',
      supplierCode: 'SUP-001',
      status: 'Partially Received',
      orderDate: '2026-06-20',
      deliveryDate: '2026-07-05',
      currency: 'INR',
      totalAmount: 250000,
      receivedAmount: 100000,
      balanceAmount: 150000,
      paymentTerms: 'Net 30',
      shippingAddress: '123, Business Park, Mumbai - 400001',
      billingAddress: '123, Business Park, Mumbai - 400001',
      notes: 'Urgent delivery required',
      createdBy: 'Tejas Tarte',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z',
      items: [
        { id: '1', itemCode: 'RM-001', itemName: 'Steel Sheets 2mm', quantity: 500, uom: 'NOS', rate: 350, amount: 175000, receivedQty: 200, balanceQty: 300 },
        { id: '2', itemCode: 'RM-002', itemName: 'Aluminum Bars', quantity: 300, uom: 'KG', rate: 250, amount: 75000, receivedQty: 100, balanceQty: 200 }
      ]
    },
    {
      id: '2',
      poNumber: 'PO-2026-002',
      title: 'Electronic Components',
      supplier: 'XYZ Electronics Ltd.',
      supplierCode: 'SUP-002',
      status: 'Fully Received',
      orderDate: '2026-06-18',
      deliveryDate: '2026-06-28',
      currency: 'USD',
      totalAmount: 45000,
      receivedAmount: 45000,
      balanceAmount: 0,
      paymentTerms: 'Net 15',
      shippingAddress: '456, Tech Park, Bangalore - 560100',
      billingAddress: '456, Tech Park, Bangalore - 560100',
      notes: 'Quality check required upon receipt',
      createdBy: 'Nirjala Bagal',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z',
      items: [
        { id: '1', itemCode: 'EC-001', itemName: 'Resistor Pack 100k', quantity: 1000, uom: 'NOS', rate: 15, amount: 15000, receivedQty: 1000, balanceQty: 0 },
        { id: '2', itemCode: 'EC-002', itemName: 'Capacitor 100uF', quantity: 500, uom: 'NOS', rate: 60, amount: 30000, receivedQty: 500, balanceQty: 0 }
      ]
    },
    {
      id: '3',
      poNumber: 'PO-2026-003',
      title: 'Packaging Materials',
      supplier: 'PQR Packaging Solutions',
      supplierCode: 'SUP-003',
      status: 'Draft',
      orderDate: '2026-06-22',
      deliveryDate: '2026-07-10',
      currency: 'INR',
      totalAmount: 120000,
      receivedAmount: 0,
      balanceAmount: 120000,
      paymentTerms: 'Net 45',
      shippingAddress: '789, Packaging Park, Pune - 411001',
      billingAddress: '789, Packaging Park, Pune - 411001',
      notes: 'Pending approval',
      createdBy: 'P S Kamthe',
      createdAt: '2026-06-22T10:00:00Z',
      updatedAt: '2026-06-22T10:00:00Z',
      items: [
        { id: '1', itemCode: 'PKG-001', itemName: 'Carton Boxes Large', quantity: 200, uom: 'NOS', rate: 300, amount: 60000, receivedQty: 0, balanceQty: 200 },
        { id: '2', itemCode: 'PKG-002', itemName: 'Packing Tape', quantity: 150, uom: 'ROL', rate: 400, amount: 60000, receivedQty: 0, balanceQty: 150 }
      ]
    }
  ]);

  const statusOptions = ['Draft', 'Submitted', 'Partially Received', 'Fully Received', 'Cancelled', 'Closed'];
  const suppliers = ['ABC Manufacturing Co.', 'XYZ Electronics Ltd.', 'PQR Packaging Solutions'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  const paymentTerms = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Cash on Delivery'];

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(filterText.toLowerCase()) ||
                         po.title.toLowerCase().includes(filterText.toLowerCase()) ||
                         po.supplier.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || po.status === selectedStatus;
    const matchesSupplier = selectedSupplier === 'All' || po.supplier === selectedSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Pagination calculations
  const totalFilteredItems = filteredOrders.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  
  const paginatedData = filteredOrders.slice(
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
      case 'Draft': return 'po-status-draft';
      case 'Submitted': return 'po-status-submitted';
      case 'Partially Received': return 'po-status-partial';
      case 'Fully Received': return 'po-status-completed';
      case 'Cancelled': return 'po-status-cancelled';
      case 'Closed': return 'po-status-closed';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Submitted': return <FaClock size={10} />;
      case 'Partially Received': return <FaExclamationTriangle size={10} />;
      case 'Fully Received': return <FaCheckCircle size={10} />;
      case 'Cancelled': return <FaTimesCircle size={10} />;
      case 'Closed': return <FaCheckCircle size={10} />;
      default: return null;
    }
  };

  const handleCreate = () => {
    navigate('/purchase-order/new');
  };

  const handleEdit = (po: PurchaseOrder) => {
    navigate(`/purchase-order/edit/${po.id}`);
  };

  const handleRowClick = (po: PurchaseOrder) => {
    // Navigate to edit on row click
    navigate(`/purchase-order/edit/${po.id}`);
  };

  const handleView = (po: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPO(po);
    setShowViewModal(true);
  };

  const handleDelete = (po: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPO(po);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedPO) return;
    setLoading(true);
    
    setTimeout(() => {
      setPurchaseOrders(prev => prev.filter(po => po.id !== selectedPO.id));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Purchase Order deleted successfully!');
    }, 1000);
  };

  const handleDuplicate = (po: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPO: PurchaseOrder = {
      ...po,
      id: String(purchaseOrders.length + 1),
      poNumber: `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      title: `${po.title} (Copy)`,
      status: 'Draft',
      receivedAmount: 0,
      balanceAmount: po.totalAmount,
      items: po.items.map(item => ({ ...item, receivedQty: 0, balanceQty: item.quantity })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPurchaseOrders(prev => [...prev, newPO]);
    toast.success('Purchase Order duplicated successfully!');
  };

  const totalOrders = purchaseOrders.length;
  const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const pendingOrders = purchaseOrders.filter(po => po.status === 'Draft' || po.status === 'Submitted').length;
  const partiallyReceived = purchaseOrders.filter(po => po.status === 'Partially Received').length;

  const clearFilters = () => {
    setFilterText('');
    setSelectedStatus('All');
    setSelectedSupplier('All');
  };

  return (
    <div className={`po-page ${theme}`}>
      {/* Header */}
      <div className="po-header">
        <div className="po-header-left">
          <h1 className="po-title">Purchase Orders</h1>
          <span className="po-badge">{purchaseOrders.length}</span>
        </div>
        <div className="po-header-actions">
          <button className="po-btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add PO
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="po-stats-container">
        <div className="po-stat-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8cc 100%)' }}>
          <div className="po-stat-icon">
            <FaFileAlt size={20} />
          </div>
          <div className="po-stat-content">
            <p className="po-stat-title">Total Orders</p>
            <p className="po-stat-value">{totalOrders}</p>
          </div>
        </div>
        <div className="po-stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24cc 100%)' }}>
          <div className="po-stat-icon">
            <FaClock size={20} />
          </div>
          <div className="po-stat-content">
            <p className="po-stat-title">Pending</p>
            <p className="po-stat-value">{pendingOrders}</p>
          </div>
        </div>
        <div className="po-stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfacc 100%)' }}>
          <div className="po-stat-icon">
            <FaExclamationTriangle size={20} />
          </div>
          <div className="po-stat-content">
            <p className="po-stat-title">Partially Received</p>
            <p className="po-stat-value">{partiallyReceived}</p>
          </div>
        </div>
        <div className="po-stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399cc 100%)' }}>
          <div className="po-stat-icon">
            <FaTruck size={20} />
          </div>
          <div className="po-stat-content">
            <p className="po-stat-title">Total Amount</p>
            <p className="po-stat-value">₹{totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="po-filter-bar">
        <div className="po-filter-left">
          <div className="po-search-wrapper">
            <FaSearch className="po-search-icon" />
            <input
              type="text"
              placeholder="Search by PO #, title or supplier..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="po-search-input"
            />
            {filterText && (
              <button className="po-search-clear" onClick={() => setFilterText('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="po-filter-right">
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="po-filter-select"
          >
            <option value="All">All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            className={`po-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} />
            Filter
          </button>
          <button className="po-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Order Date
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== 'All' || selectedSupplier !== 'All') && (
        <div className="po-active-filters">
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
            className="po-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Expandable Filters */}
      {showFilters && (
        <div className="po-expandable-filters">
          <div className="po-filter-group">
            <label>Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="po-filter-group">
            <label>Currency</label>
            <select>
              <option value="all">All Currencies</option>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="po-filter-group">
            <label>Payment Terms</label>
            <select>
              <option value="all">All Terms</option>
              {paymentTerms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="po-apply-filters">Apply</button>
        </div>
      )}

      {/* Table */}
      <div className="po-table-wrap">
        <table className="po-table">
          <thead>
            <tr>
              <th className="po-th-check">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="po-checkbox" />
              </th>
              <th className="po-th">PO #</th>
              <th className="po-th">Title</th>
              <th className="po-th">Supplier</th>
              <th className="po-th">Order Date</th>
              <th className="po-th">Amount</th>
              <th className="po-th">Status</th>
              <th className="po-th po-th-meta">
                <span className="po-count-label">{totalFilteredItems} of {purchaseOrders.length}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="po-empty-state">
                  <div className="po-empty-content">
                    <FaFileAlt size={48} />
                    <p>No purchase orders found</p>
                    <span>Create your first purchase order to get started</span>
                    <button className="po-btn-primary" onClick={handleCreate} style={{ marginTop: '12px' }}>
                      <FaPlus size={12} /> Add PO
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((po) => (
                <tr
                  key={po.id}
                  className={`po-tr ${selected.has(po.id) ? "po-tr-selected" : ""}`}
                  onClick={() => handleRowClick(po)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="po-td-check" onClick={(e) => toggleRow(po.id, e)}>
                    <input type="checkbox" checked={selected.has(po.id)} onChange={() => {}} className="po-checkbox" />
                  </td>
                  <td className="po-td po-td-id">{po.poNumber}</td>
                  <td className="po-td">{po.title}</td>
                  <td className="po-td">{po.supplier}</td>
                  <td className="po-td">{new Date(po.orderDate).toLocaleDateString()}</td>
                  <td className="po-td">{po.currency} {po.totalAmount.toLocaleString()}</td>
                  <td className="po-td">
                    <span className={`po-status-badge ${getStatusColor(po.status)}`}>
                      {getStatusIcon(po.status)}
                      {po.status}
                    </span>
                  </td>
                  <td className="po-td po-td-meta">
                    <span className="po-ago">{new Date(po.createdAt).toLocaleDateString()}</span>
                    <span className="po-dot">·</span>
                    <div className="po-action-buttons">
                      <button 
                        className="po-action-btn po-action-view" 
                        onClick={(e) => handleView(po, e)}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button 
                        className="po-action-btn po-action-edit" 
                        onClick={(e) => { e.stopPropagation(); handleEdit(po); }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        className="po-action-btn po-action-copy" 
                        onClick={(e) => handleDuplicate(po, e)}
                        title="Duplicate"
                      >
                        <FaCopy size={12} />
                      </button>
                      <button 
                        className="po-action-btn po-action-delete" 
                        onClick={(e) => handleDelete(po, e)}
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
      <div className="po-pagination">
        <div className="po-pagination-left">
          <span className="po-pagination-label">Show:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="po-page-size-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="po-pagination-label">entries</span>
        </div>
        <div className="po-pagination-center">
          <button 
            onClick={goToFirstPage} 
            disabled={currentPage === 1 || totalFilteredItems === 0} 
            className="po-page-btn"
          >
            <FaAngleDoubleLeft size={12} />
          </button>
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 1 || totalFilteredItems === 0} 
            className="po-page-btn"
          >
            <FaChevronLeft size={12} />
          </button>
          {totalFilteredItems > 0 && getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`po-page-btn ${currentPage === page ? 'po-page-btn-active' : ''}`}
            >
              {page}
            </button>
          ))}
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages || totalFilteredItems === 0} 
            className="po-page-btn"
          >
            <FaChevronRight size={12} />
          </button>
          <button 
            onClick={goToLastPage} 
            disabled={currentPage === totalPages || totalFilteredItems === 0} 
            className="po-page-btn"
          >
            <FaAngleDoubleRight size={12} />
          </button>
        </div>
        <div className="po-pagination-right">
          <span className="po-pagination-info">
            {totalFilteredItems > 0 ? (
              `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
            ) : (
              'No entries to show'
            )}
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedPO && (
        <div className="po-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="po-modal po-modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="po-modal-header">
              <span className="po-modal-title">{selectedPO.poNumber} - {selectedPO.title}</span>
              <button className="po-modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="po-modal-body">
              <div className="po-view-grid">
                <div className="po-view-section">
                  <h4>Order Information</h4>
                  <div className="po-view-row"><label>PO Number:</label><span>{selectedPO.poNumber}</span></div>
                  <div className="po-view-row"><label>Title:</label><span>{selectedPO.title}</span></div>
                  <div className="po-view-row"><label>Status:</label><span className={`po-status-badge ${getStatusColor(selectedPO.status)}`}>{selectedPO.status}</span></div>
                  <div className="po-view-row"><label>Currency:</label><span>{selectedPO.currency}</span></div>
                </div>
                <div className="po-view-section">
                  <h4>Supplier Details</h4>
                  <div className="po-view-row"><label>Supplier:</label><span>{selectedPO.supplier}</span></div>
                  <div className="po-view-row"><label>Supplier Code:</label><span>{selectedPO.supplierCode}</span></div>
                  <div className="po-view-row"><label>Payment Terms:</label><span>{selectedPO.paymentTerms}</span></div>
                </div>
                <div className="po-view-section">
                  <h4>Dates</h4>
                  <div className="po-view-row"><label>Order Date:</label><span>{new Date(selectedPO.orderDate).toLocaleDateString()}</span></div>
                  <div className="po-view-row"><label>Delivery Date:</label><span>{new Date(selectedPO.deliveryDate).toLocaleDateString()}</span></div>
                  <div className="po-view-row"><label>Created By:</label><span>{selectedPO.createdBy}</span></div>
                </div>
                <div className="po-view-section">
                  <h4>Financial Summary</h4>
                  <div className="po-view-row"><label>Total Amount:</label><span>{selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}</span></div>
                  <div className="po-view-row"><label>Received:</label><span className="po-received-cell">{selectedPO.currency} {selectedPO.receivedAmount.toLocaleString()}</span></div>
                  <div className="po-view-row"><label>Balance:</label><span className="po-balance-cell">{selectedPO.currency} {selectedPO.balanceAmount.toLocaleString()}</span></div>
                </div>
                <div className="po-view-section full-width">
                  <h4>Addresses</h4>
                  <div className="po-view-row"><label>Shipping:</label><span>{selectedPO.shippingAddress}</span></div>
                  <div className="po-view-row"><label>Billing:</label><span>{selectedPO.billingAddress}</span></div>
                </div>
                <div className="po-view-section full-width">
                  <h4>Items</h4>
                  <table className="po-view-items-table">
                    <thead>
                      <tr><th>Item Code</th><th>Item Name</th><th>Qty</th><th>UOM</th><th>Rate</th><th>Amount</th><th>Received</th><th>Balance</th></tr>
                    </thead>
                    <tbody>
                      {selectedPO.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.itemCode}</td>
                          <td>{item.itemName}</td>
                          <td>{item.quantity}</td>
                          <td>{item.uom}</td>
                          <td>{selectedPO.currency} {item.rate}</td>
                          <td>{selectedPO.currency} {item.amount}</td>
                          <td className="po-received-cell">{item.receivedQty}</td>
                          <td className="po-balance-cell">{item.balanceQty}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td colSpan={7} className="po-total-label">Total</td><td className="po-total-amount">{selectedPO.currency} {selectedPO.totalAmount}</td></tr>
                    </tfoot>
                  </table>
                </div>
                {selectedPO.notes && (
                  <div className="po-view-section full-width">
                    <h4>Notes</h4>
                    <div className="po-view-row"><span>{selectedPO.notes}</span></div>
                  </div>
                )}
              </div>
            </div>
            <div className="po-modal-footer">
              <button className="po-btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="po-btn-primary" onClick={() => handleEdit(selectedPO)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedPO && (
        <div className="po-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="po-modal po-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="po-modal-header">
              <span className="po-modal-title">Confirm Delete</span>
              <button className="po-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="po-modal-body">
              <p>Are you sure you want to delete this purchase order?</p>
              <p className="po-modal-item-name"><strong>{selectedPO.poNumber}</strong></p>
              <p className="po-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="po-modal-footer">
              <button className="po-btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="po-btn-delete" onClick={handleDeleteConfirm} disabled={loading}>
                {loading && <FaSpinner className="po-spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}