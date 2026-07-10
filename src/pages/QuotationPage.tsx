import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaFilePdf,
  FaFilter, FaCheckCircle, FaClock, FaTimesCircle,
  FaFileAlt, FaExternalLinkAlt,
  FaChartLine, FaTimes, FaSave, FaSpinner,
  FaEnvelope, FaClipboardList, FaDollarSign
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './QuotationPage.css';
import api from '../../src/services/api';

interface QuotationItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

// In QuotationPage.tsx - update the Quotation interface and fetch function

export interface Quotation {
  id: string;
  quotationNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  date: string;
  validTill: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
  currency: string;
  items: QuotationItem[];
  notes: string;
  termsConditions: string;
  namingSeries?: string;
  quotationTo?: string;
  orderType?: string;
  company?: string;
  priceList?: string;
  taxCategory?: string;
  taxesAndCharges?: string;
  shippingRule?: string;
  incoterm?: string;
  placeOfSupply?: string;
  contactPerson?: string;
  paymentTermsTemplate?: string;
  tcName?: string;
  taxes?: TaxRow[];
  paymentSchedule?: PaymentSchedule[];
}

// Add these interfaces
interface TaxRow {
  id: string;
  type: string;
  accountHead: string;
  taxRate: number;
  netAmount: number;
  amount: number;
  total: number;
}

interface PaymentSchedule {
  id: string;
  paymentTerm: string;
  description: string;
  dueDate: string;
  invoicePortion: number;
  paymentAmount: number;
}


interface QuotationApiRecord {
  name: string;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  valid_till?: string;
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

export default function QuotationPage() {
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
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quotations, setQuotations] = useState<Quotation[]>([]);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── load from GET /quotation ───────────────────────────────────────

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/quotation');

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to fetch quotations');
      }

      const raw = response.data.data;
      let all: QuotationApiRecord[] =
        raw?.records ??
        (Array.isArray(raw) ? raw : raw?.data) ??
        [];

      if (!Array.isArray(all)) {
        console.warn('Unexpected /quotation response shape, defaulting to empty list:', raw);
        all = [];
      }

      const transformedData: Quotation[] = all.map((q) => ({
        id: q.name,
        quotationNumber: q.name,
        customer: q.party_name || '',
        customerName: q.customer_name || '',
        customerEmail: q.contact_email || '',
        customerPhone: q.contact_mobile || '',
        customerAddress: q.address_display || q.customer_address || '',
        date: q.transaction_date || '',
        validTill: q.valid_till || '',
        totalAmount: q.grand_total ?? q.total ?? 0,
        status: (q.status as Quotation['status']) || 'Draft',
        currency: q.currency || 'INR',
        notes: q.notes || '',
        termsConditions: q.terms || '',
        items: Array.isArray(q.items)
          ? q.items.map((it, idx) => {
              const quantity = it.qty ?? 0;
              const rate = it.rate ?? 0;
              return {
                id: String(idx + 1),
                itemCode: it.item_code || '',
                itemName: it.item_name || '',
                quantity,
                rate,
                amount: it.amount ?? quantity * rate,
              };
            })
          : [],
      }));

      setQuotations(transformedData);
    } catch (err: any) {
      console.error('Error fetching quotations:', err);
      setError(err.response?.data?.message || 'An error occurred while loading quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Sent': return 'status-sent';
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
      case 'Sent': return <FaEnvelope size={10} />;
      case 'Accepted': return <FaCheckCircle size={10} />;
      case 'Rejected': return <FaTimesCircle size={10} />;
      case 'Expired': return <FaClock size={10} />;
      case 'Converted': return <FaExternalLinkAlt size={10} />;
      default: return null;
    }
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.quotationNumber.toLowerCase().includes(filterText.toLowerCase()) ||
                         q.customerName.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || q.status === selectedStatus;
    const matchesCurrency = selectedCurrency === 'All' || q.currency === selectedCurrency;
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  const getStatusCount = (status: string) => {
    return quotations.filter(q => q.status === status).length;
  };

  const totalAmount = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const acceptedAmount = quotations.filter(q => q.status === 'Accepted').reduce((sum, q) => sum + q.totalAmount, 0);
  const conversionRate = totalAmount > 0 ? Math.round((acceptedAmount / totalAmount) * 100) : 0;
  const totalQuotes = quotations.length;

  // View / Edit — both route to the CreateQuotation form (edit mode),
  // mirroring JobCardManagement where handleView and handleEdit both
  // navigate to the same job card page.
  const handleView = (quote: Quotation) => {
    navigate(`/quotation/${quote.id}`, { state: { quotation: quote } });
  };

  const handleEdit = (quote: Quotation) => {
    navigate(`/quotation/${quote.id}`, { state: { quotation: quote } });
  };

  // Delete Quotation — DELETE /quotation/:id
  const handleDeleteClick = (quote: Quotation) => {
    setSelectedQuote(quote);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedQuote) return;
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/quotation/${selectedQuote.id}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to delete quotation');
      }
      setShowDeleteModal(false);
      setSelectedQuote(null);
      toast.success('Quotation deleted successfully!');
      fetchQuotations();
    } catch (err: any) {
      console.error('Error deleting quotation:', err);
      toast.error(err.response?.data?.message || 'Failed to delete quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF View for single quotation
  const handlePdfView = (quote: Quotation) => {
    setSelectedQuote(quote);
    setShowPdfModal(true);
  };

  const getCompanyDetails = () => companyDetails;

  const clearFilters = () => {
    setFilterText('');
    setSelectedStatus('All');
    setSelectedCurrency('All');
  };

  return (
    <div className={`quotation-page ${theme}`}>
      {/* Stats Cards */}
      <div className="qt-stats-container">
        <div className="qt-stat-card" style={{ background: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
          <div className="qt-stat-icon" style={{ color: '#3B82F6' }}>
            <FaClipboardList size={18} />
          </div>
          <div className="qt-stat-content">
            <p className="qt-stat-title">Total Quotes</p>
            <p className="qt-stat-value">{totalQuotes}</p>
          </div>
        </div>
        <div className="qt-stat-card" style={{ background: '#ECFDF5', borderLeft: '4px solid #10B981' }}>
          <div className="qt-stat-icon" style={{ color: '#10B981' }}>
            <FaCheckCircle size={18} />
          </div>
          <div className="qt-stat-content">
            <p className="qt-stat-title">Accepted</p>
            <p className="qt-stat-value">{getStatusCount('Accepted')}</p>
          </div>
        </div>
        <div className="qt-stat-card" style={{ background: '#FEF3C7', borderLeft: '4px solid #F59E0B' }}>
          <div className="qt-stat-icon" style={{ color: '#F59E0B' }}>
            <FaClock size={18} />
          </div>
          <div className="qt-stat-content">
            <p className="qt-stat-title">Pending</p>
            <p className="qt-stat-value">{getStatusCount('Sent') + getStatusCount('Draft')}</p>
          </div>
        </div>
        <div className="qt-stat-card" style={{ background: '#F5F3FF', borderLeft: '4px solid #8B5CF6' }}>
          <div className="qt-stat-icon" style={{ color: '#8B5CF6' }}>
            <FaDollarSign size={18} />
          </div>
          <div className="qt-stat-content">
            <p className="qt-stat-title">Conversion Rate</p>
            <p className="qt-stat-value">{conversionRate}%</p>
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
              placeholder="Search by Quote # or Customer..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="qt-search-input"
            />
            {filterText && (
              <button className="qt-search-clear" onClick={() => setFilterText("")}>
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
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
            <option value="Converted">Converted</option>
          </select>
          <button className="qt-btn-new" onClick={() => navigate('/quotation/new')}>
            <FaPlus size={12} /> New Quote
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== "All" || selectedCurrency !== "All") && (
        <div className="qt-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span style={{ color: "var(--text-primary)" }}>Active filters:</span>
          {filterText && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Search:</strong> "{filterText}"
            </span>
          )}
          {selectedStatus !== "All" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Status:</strong> {selectedStatus}
            </span>
          )}
          {selectedCurrency !== "All" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Currency:</strong> {selectedCurrency}
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
          <p>Loading quotations...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="qt-error">
          <p>{error}</p>
          <button onClick={fetchQuotations} className="qt-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="qt-table-wrap">
          {filteredQuotations.length === 0 ? (
            <div className="qt-empty-state">
              <div className="qt-empty-content">
                <FaFileAlt size={48} />
                <p>No quotations found</p>
                <span>Try adjusting your search criteria</span>
              </div>
            </div>
          ) : (
            <table className="qt-table">
              <thead>
                <tr>
                  <th className="qt-th">Quote #</th>
                  <th className="qt-th">Customer</th>
                  <th className="qt-th">Date</th>
                  <th className="qt-th">Status</th>
                  <th className="qt-th qt-text-right">Amount</th>
                  <th className="qt-th qt-th-meta">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quote) => (
                  <tr key={quote.id} className="qt-tr">
                    <td className="qt-td qt-td-id">{quote.quotationNumber}</td>
                    <td className="qt-td">
                      <div>
                        <div className="qt-td-link">{quote.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{quote.customer}</div>
                      </div>
                    </td>
                    <td className="qt-td">
                      <div>{quote.date ? new Date(quote.date).toLocaleDateString() : '-'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Valid: {quote.validTill ? new Date(quote.validTill).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="qt-td">
                      <span className={`qt-status-badge ${getStatusColor(quote.status)}`}>
                        {getStatusIcon(quote.status)}
                        {quote.status}
                      </span>
                    </td>
                    <td className="qt-td qt-text-right qt-amount-cell">
                      <span className="qt-currency">{quote.currency}</span>
                      {quote.totalAmount.toLocaleString()}
                    </td>
                    <td className="qt-td qt-td-meta">
                      <div className="qt-action-buttons">
                        <button className="qt-action-btn qt-action-view" onClick={() => handleView(quote)} title="View / Edit">
                          <FaEye size={12} />
                        </button>
                        <button className="qt-action-btn qt-action-pdf" onClick={() => handlePdfView(quote)} title="PDF">
                          <FaFilePdf size={12} />
                        </button>
                        <button className="qt-action-btn qt-action-edit" onClick={() => handleEdit(quote)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="qt-action-btn qt-action-delete" onClick={() => handleDeleteClick(quote)} title="Delete">
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
            {filteredQuotations.length} of {quotations.length} quotes
          </span>
        </div>
        <div className="qt-pagination-right">
          <span className="qt-pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaChartLine size={14} style={{ color: 'var(--primary-color)' }} />
            {conversionRate}% conversion rate
          </span>
        </div>
      </div>

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedQuote && (
        <div className="qt-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="qt-modal qt-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="qt-modal-header">
              <span className="qt-modal-title">Confirm Delete</span>
              <button className="qt-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="qt-modal-body">
              <p>Are you sure you want to delete this quotation?</p>
              <p className="qt-modal-item-name">
                <strong>{selectedQuote.quotationNumber}</strong> - {selectedQuote.customerName}
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
      {showPdfModal && selectedQuote && (
        <div className="qt-modal-overlay" onClick={() => setShowPdfModal(false)}>
          <div className="qt-modal qt-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="qt-modal-header">
              <span className="qt-modal-title">{selectedQuote.quotationNumber} - PDF Preview</span>
              <button className="qt-modal-close" onClick={() => setShowPdfModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="qt-modal-body" style={{ background: '#f8f9fa' }}>
              <div style={{ background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: "'Times New Roman', serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1f2433', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2433', letterSpacing: '2px' }}>QUOTATION</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{selectedQuote.quotationNumber}</div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2433', margin: 0 }}>{getCompanyDetails().name}</h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{getCompanyDetails().address}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Phone: {getCompanyDetails().contact} | Email: {getCompanyDetails().email}</p>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Customer Details</div>
                  <div style={{ padding: '2px 0' }}><strong>Name:</strong> {selectedQuote.customerName}</div>
                  <div style={{ padding: '2px 0' }}><strong>Code:</strong> {selectedQuote.customer}</div>
                  <div style={{ padding: '2px 0' }}><strong>Email:</strong> {selectedQuote.customerEmail || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Phone:</strong> {selectedQuote.customerPhone || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Address:</strong> {selectedQuote.customerAddress || 'N/A'}</div>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ padding: '2px 0' }}><strong>Date:</strong> {selectedQuote.date ? new Date(selectedQuote.date).toLocaleDateString() : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Valid Till:</strong> {selectedQuote.validTill ? new Date(selectedQuote.validTill).toLocaleDateString() : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Status:</strong> {selectedQuote.status}</div>
                  <div style={{ padding: '2px 0' }}><strong>Currency:</strong> {selectedQuote.currency}</div>
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
                    {selectedQuote.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}>{item.itemCode}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}>{item.itemName}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{selectedQuote.currency} {item.rate}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{selectedQuote.currency} {item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background: '#f8f9fa' }}>
                    <tr>
                      <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total Amount</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '16px' }}>{selectedQuote.currency} {selectedQuote.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
                {selectedQuote.notes && (
                  <div style={{ margin: '16px 0', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Notes</div>
                    <p>{selectedQuote.notes}</p>
                  </div>
                )}
                {selectedQuote.termsConditions && (
                  <div style={{ margin: '16px 0', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Terms & Conditions</div>
                    <p>{selectedQuote.termsConditions}</p>
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
                  <p>This is a computer-generated quotation. No signature required.</p>
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
              <button className="qt-btn-primary" onClick={() => {
                toast.success('PDF sent to email!');
                setShowPdfModal(false);
              }}>
                <FaEnvelope size={12} /> Email PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}