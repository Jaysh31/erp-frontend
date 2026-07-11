import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaFilePdf,
  FaFilter, FaCheckCircle, FaClock, FaTimesCircle,
  FaFileAlt, FaExternalLinkAlt,
  FaChartLine, FaTimes, FaSpinner,
  FaClipboardList, FaDollarSign, FaBoxOpen
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './SalesOrder.css';
import api from '../../src/services/api';

interface SalesOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface SalesOrder {
  id: string;
  salesOrderNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  date: string;
  deliveryDate: string;
  totalAmount: number;
  status: 'Draft' | 'Confirmed' | 'On Hold' | 'Completed' | 'Cancelled' | 'Closed';
  orderType: string;
  isSubcontracted: boolean;
  currency: string;
  items: SalesOrderItem[];
  notes: string;
  termsConditions: string;
  namingSeries?: string;
  paymentTermsTemplate?: string;
}

interface SalesOrderApiRecord {
  name: string;
  id?: string | number;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  delivery_date?: string;
  order_type?: string;
  is_subcontracted?: number | boolean;
  grand_total?: number;
  total?: number;
  status?: string;
  currency?: string;
  contact_email?: string;
  contact_mobile?: string;
  address_display?: string;
  customer_address?: string;
  terms?: string;
  notes?: string;
  items?: Array<{ item_code?: string; item_name?: string; qty?: number; rate?: number; amount?: number }>;
}

const companyDetails = {
  name: 'Sculptor Tech Pvt Ltd',
  address: 'c-1006, gc, Pune, Maharashtra 411028, India',
  website: 'sculptortechpvtltd@gmail.com',
  email: 'jayeshwakle@sculptortechpvtltd.com',
  contact: '8668584275',
};


const generateFallbackOrderNumber = (index: number): string => {
  const year = new Date().getFullYear();
  return `SAL-ORD-${year}-${String(index + 1).padStart(5, '0')}`;
};

export default function SalesOrder() {
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
  const [selectedOrderType, setSelectedOrderType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── load from GET /sales-order ───────────────────────────────────────

  const fetchSalesOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/sales-order');

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to fetch sales orders');
      }

      const raw = response.data.data;
      let all: SalesOrderApiRecord[] =
        raw?.records ??
        (Array.isArray(raw) ? raw : raw?.data) ??
        [];

      if (!Array.isArray(all)) {
        console.warn('Unexpected /sales-order response shape, defaulting to empty list:', raw);
        all = [];
      }

      const transformedData: SalesOrder[] = all.map((o, idx) => {
        // Prefer a real numeric/string id from the API for delete/navigate.
        // Fall back to `name` if no id field is present at all.
        const resolvedId =
          o.id !== undefined && o.id !== null && String(o.id).trim() !== ''
            ? String(o.id)
            : (o.name || '');

        return {
          id: resolvedId,
          salesOrderNumber: o.name || generateFallbackOrderNumber(idx),
          customer: o.party_name || '',
          customerName: o.customer_name || '',
          customerEmail: o.contact_email || '',
          customerPhone: o.contact_mobile || '',
          customerAddress: o.address_display || o.customer_address || '',
          date: o.transaction_date || '',
          deliveryDate: o.delivery_date || '',
          totalAmount: o.grand_total ?? o.total ?? 0,
          status: (o.status as SalesOrder['status']) || 'Draft',
          orderType: o.order_type || 'Sales',
          isSubcontracted: Boolean(o.is_subcontracted),
          currency: o.currency || 'INR',
          notes: o.notes || '',
          termsConditions: o.terms || '',
          items: Array.isArray(o.items)
            ? o.items.map((it, i) => {
              const quantity = it.qty ?? 0;
              const rate = it.rate ?? 0;
              return {
                id: String(i + 1),
                itemCode: it.item_code || '',
                itemName: it.item_name || '',
                quantity,
                rate,
                amount: it.amount ?? quantity * rate,
              };
            })
            : [],
        };
      });

      setSalesOrders(transformedData);
    } catch (err: any) {
      console.error('Error fetching sales orders:', err);
      setError(err.response?.data?.message || 'An error occurred while loading sales orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Confirmed': return 'status-sent';
      case 'On Hold': return 'status-expired';
      case 'Completed': return 'status-accepted';
      case 'Cancelled': return 'status-rejected';
      case 'Closed': return 'status-converted';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Confirmed': return <FaCheckCircle size={10} />;
      case 'On Hold': return <FaClock size={10} />;
      case 'Completed': return <FaCheckCircle size={10} />;
      case 'Cancelled': return <FaTimesCircle size={10} />;
      case 'Closed': return <FaExternalLinkAlt size={10} />;
      default: return null;
    }
  };

  const filteredOrders = salesOrders.filter(o => {
    const matchesSearch = (o.salesOrderNumber || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;
    const matchesOrderType = selectedOrderType === 'All' || o.orderType === selectedOrderType;
    return matchesSearch && matchesStatus && matchesOrderType;
  });

  const getStatusCount = (status: string) => {
    return salesOrders.filter(o => o.status === status).length;
  };

  const totalAmount = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedAmount = salesOrders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.totalAmount, 0);
  const fulfillmentRate = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
  const totalOrders = salesOrders.length;

  // View / Edit — both route to the CreateSalesOrder form (edit mode).
  const handleView = (order: SalesOrder) => {
    if (!order.id) {
      toast.error('Unable to open this sales order — missing order ID');
      return;
    }
    navigate(`/sales-order/${order.id}`, { state: { salesOrder: order } });
  };

  const handleEdit = (order: SalesOrder) => {
    if (!order.id) {
      toast.error('Unable to open this sales order — missing order ID');
      return;
    }
    navigate(`/sales-order/${order.id}`, { state: { salesOrder: order } });
  };

  // Delete Sales Order — DELETE /sales-order/:id
  const handleDeleteClick = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;
    if (!selectedOrder.id) {
      toast.error('Cannot delete — missing order ID');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/sales-order/${selectedOrder.id}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to delete sales order');
      }
      setShowDeleteModal(false);
      setSelectedOrder(null);
      toast.success('Sales order deleted successfully!');
      fetchSalesOrders();
    } catch (err: any) {
      console.error('Error deleting sales order:', err);
      toast.error(err.response?.data?.message || 'Failed to delete sales order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF View for single sales order
  const handlePdfView = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowPdfModal(true);
  };

  const getCompanyDetails = () => companyDetails;

  const clearFilters = () => {
    setFilterText('');
    setSelectedStatus('All');
    setSelectedOrderType('All');
  };

  return (
    <div className={`sales-order-page ${theme}-theme`}>
      {/* Stats Cards */}
      <div className="qt-stats-container">
        <div className="qt-stat-card" style={{ background: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
          <div className="qt-stat-icon" style={{ color: '#3B82F6' }}>
            <FaClipboardList size={18} />
          </div>
          <div className="qt-stat-content">
            <p className="qt-stat-title">Total Orders</p>
            <p className="qt-stat-value">{totalOrders}</p>
          </div>
        </div>
        <div className="qt-stat-card" style={{ background: '#ECFDF5', borderLeft: '4px solid #10B981' }}>
          <div className="qt-stat-icon" style={{ color: '#10B981' }}>
            <FaCheckCircle size={18} />
          </div>
          <div className="qt-stat-content">
            <p className="qt-stat-title">Completed</p>
            <p className="qt-stat-value">{getStatusCount('Completed')}</p>
          </div>
        </div>
        <div className="qt-stat-card" style={{ background: '#FEF3C7', borderLeft: '4px solid #F59E0B' }}>
          <div className="qt-stat-icon" style={{ color: '#F59E0B' }}>
            <FaClock size={18} />
          </div>
          <div className="qt-stat-content">
            <p className="qt-stat-title">Pending</p>
            <p className="qt-stat-value">{getStatusCount('Draft') + getStatusCount('Confirmed') + getStatusCount('On Hold')}</p>
          </div>
        </div>
        <div className="qt-stat-card" style={{ background: '#F5F3FF', borderLeft: '4px solid #8B5CF6' }}>
          <div className="qt-stat-icon" style={{ color: '#8B5CF6' }}>
            <FaDollarSign size={18} />
          </div>
          <div className="qt-stat-content">
            <p className="qt-stat-title">Fulfillment Rate</p>
            <p className="qt-stat-value">{fulfillmentRate}%</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="qt-filter-bar">
        <div className="qt-filter-left">
          <div className="qt-search-wrapper">
            <FaSearch className="qt-search-icon" />
            <input
              type="text"
              placeholder="Search by Order # or Customer..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="qt-search-input"
            />
            {filterText && (
              <button className="qt-search-clear" onClick={() => setFilterText('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="qt-filter-right">
          <select
            value={selectedOrderType}
            onChange={(e) => setSelectedOrderType(e.target.value)}
            className="qt-filter-select"
          >
            <option value="All">All Types</option>
            <option value="Sales">Sales</option>
            <option value="Return">Return</option>
            <option value="Credit Note">Credit Note</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="qt-filter-select"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Closed">Closed</option>
          </select>
          <button className="qt-btn-new" onClick={() => navigate('/sales-order/new')}>
            <FaPlus size={12} /> Add Sales Order
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== 'All' || selectedOrderType !== 'All') && (
        <div className="qt-active-filters">
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
          {selectedOrderType !== 'All' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Order Type:</strong> {selectedOrderType}
            </span>
          )}
          <button onClick={clearFilters} className="qt-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="qt-loading">
          <p>Loading sales orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="qt-error">
          <p>{error}</p>
          <button onClick={fetchSalesOrders} className="qt-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="qt-table-wrap">
          {filteredOrders.length === 0 ? (
            <div className="qt-empty-state">
              <div className="qt-empty-content">
                <FaBoxOpen size={48} />
                <p>No sales orders found</p>
                <span>Try adjusting your search criteria, or create your first sales order</span>
              </div>
            </div>
          ) : (
            <table className="qt-table">
              <thead>
                <tr>
                  <th className="qt-th">Order #</th>
                  <th className="qt-th">Customer</th>
                  <th className="qt-th">Date</th>
                  <th className="qt-th">Order Type</th>
                  <th className="qt-th">Status</th>
                  <th className="qt-th qt-text-right">Amount</th>
                  <th className="qt-th qt-th-meta">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={order.id || `so-${index}`} className="qt-tr">
                    <td className="qt-td qt-td-id">{order.salesOrderNumber}</td>
                    <td className="qt-td">
                      <div>
                        <div className="qt-td-link">{order.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{order.customer}</div>
                      </div>
                    </td>
                    <td className="qt-td">
                      <div>{order.date ? new Date(order.date).toLocaleDateString() : '-'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Delivery: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="qt-td">{order.orderType}</td>
                    <td className="qt-td">
                      <span className={`qt-status-badge ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="qt-td qt-text-right qt-amount-cell">
                      <span className="qt-currency">{order.currency}</span>
                      {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="qt-td qt-td-meta">
                      <div className="qt-action-buttons">
                        <button className="qt-action-btn qt-action-view" onClick={() => handleView(order)} title="View / Edit">
                          <FaEye size={12} />
                        </button>
                        <button className="qt-action-btn qt-action-pdf" onClick={() => handlePdfView(order)} title="PDF">
                          <FaFilePdf size={12} />
                        </button>
                        <button className="qt-action-btn qt-action-edit" onClick={() => handleEdit(order)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="qt-action-btn qt-action-delete" onClick={() => handleDeleteClick(order)} title="Delete">
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="qt-pagination">
        <div className="qt-pagination-left">
          <span className="qt-pagination-info">
            {filteredOrders.length} of {salesOrders.length} orders
          </span>
        </div>
        <div className="qt-pagination-right">
          <span className="qt-pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaChartLine size={14} style={{ color: 'var(--primary-color)' }} />
            {fulfillmentRate}% fulfillment rate
          </span>
        </div>
      </div>

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedOrder && (
        <div className="qt-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="qt-modal qt-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="qt-modal-header">
              <span className="qt-modal-title">Confirm Delete</span>
              <button className="qt-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="qt-modal-body">
              <p>Are you sure you want to delete this sales order?</p>
              <p className="qt-modal-item-name">
                <strong>{selectedOrder.salesOrderNumber}</strong> - {selectedOrder.customerName}
              </p>
              <p className="qt-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="qt-modal-footer">
              <button className="qt-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="qt-btn-delete" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== PDF MODAL ====== */}
      {showPdfModal && selectedOrder && (
        <div className="qt-modal-overlay" onClick={() => setShowPdfModal(false)}>
          <div className="qt-modal qt-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="qt-modal-header">
              <span className="qt-modal-title">{selectedOrder.salesOrderNumber} - PDF Preview</span>
              <button className="qt-modal-close" onClick={() => setShowPdfModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="qt-modal-body" style={{ background: '#f8f9fa' }}>
              <div style={{ background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: "'Times New Roman', serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1f2433', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2433', letterSpacing: '2px' }}>SALES ORDER</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{selectedOrder.salesOrderNumber}</div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2433', margin: 0 }}>{getCompanyDetails().name}</h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{getCompanyDetails().address}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Phone: {getCompanyDetails().contact} | Email: {getCompanyDetails().email}</p>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Customer Details</div>
                  <div style={{ padding: '2px 0' }}><strong>Name:</strong> {selectedOrder.customerName}</div>
                  <div style={{ padding: '2px 0' }}><strong>Code:</strong> {selectedOrder.customer}</div>
                  <div style={{ padding: '2px 0' }}><strong>Email:</strong> {selectedOrder.customerEmail || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Phone:</strong> {selectedOrder.customerPhone || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Address:</strong> {selectedOrder.customerAddress || 'N/A'}</div>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ padding: '2px 0' }}><strong>Date:</strong> {selectedOrder.date ? new Date(selectedOrder.date).toLocaleDateString() : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Delivery Date:</strong> {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Order Type:</strong> {selectedOrder.orderType}</div>
                  <div style={{ padding: '2px 0' }}><strong>Status:</strong> {selectedOrder.status}</div>
                  <div style={{ padding: '2px 0' }}><strong>Currency:</strong> {selectedOrder.currency}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', margin: '16px 0' }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Item Code</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Item Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Rate</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}>{item.itemCode}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}>{item.itemName}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{selectedOrder.currency} {item.rate}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{selectedOrder.currency} {item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background: '#f8f9fa' }}>
                    <tr>
                      <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total Amount</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '16px' }}>{selectedOrder.currency} {selectedOrder.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
                {selectedOrder.notes && (
                  <div style={{ margin: '16px 0', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Notes</div>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}
                {selectedOrder.termsConditions && (
                  <div style={{ margin: '16px 0', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Terms & Conditions</div>
                    <p>{selectedOrder.termsConditions}</p>
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
                  <p>This is a computer-generated sales order. No signature required.</p>
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
            <div className="qt-modal-footer">
              <button className="qt-btn-cancel" onClick={() => setShowPdfModal(false)}>Close</button>
              <button className="qt-btn-primary" onClick={() => {
                toast.success('PDF downloaded successfully!');
                setShowPdfModal(false);
              }}>
                <FaFilePdf size={12} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}