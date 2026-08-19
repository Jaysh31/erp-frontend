import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaSpinner, FaEye,
  FaFileAlt, FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle,
  FaPaperPlane, FaReceipt,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import './PurchaseInvoice.css';

// ─── Date helpers ─────────────────────────────────────────────────

const toISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ─── Range Calendar Component ────────────────────────────────────

interface RangeCalendarProps {
  month: Date;
  onMonthChange: (d: Date) => void;
  fromDate: string;
  toDate: string;
  onSelect: (from: string, to: string) => void;
}

function RangeCalendar({ month, onMonthChange, fromDate, toDate, onSelect }: RangeCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDayClick = (day: number) => {
    const clickedStr = toISODate(new Date(year, monthIndex, day));
    if (!fromDate || (fromDate && toDate)) {
      onSelect(clickedStr, '');
    } else if (clickedStr < fromDate) {
      onSelect(clickedStr, fromDate);
    } else {
      onSelect(fromDate, clickedStr);
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDaysInMonth; d++) cells.push(d);

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
            borderRadius: '4px', color: '#4a5568', display: 'flex', alignItems: 'center'
          }}
        >
          <FaChevronLeft size={11} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '13px', color: '#1a202c' }}>{monthLabel}</span>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
            borderRadius: '4px', color: '#4a5568', display: 'flex', alignItems: 'center'
          }}
        >
          <FaChevronRight size={11} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {WEEKDAY_LABELS.map((wd) => (
          <span key={wd} style={{ fontSize: '10px', fontWeight: 600, color: '#a0aec0', textAlign: 'center', padding: '4px 0' }}>
            {wd}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '2px' }}>
        {cells.map((day, idx) => {
          if (day === null) return <span key={`empty-${idx}`} />;
          const dateStr = toISODate(new Date(year, monthIndex, day));
          const isFrom = dateStr === fromDate;
          const isTo = dateStr === toDate;
          const isEndpoint = isFrom || isTo;
          const inRange = !!fromDate && !!toDate && dateStr > fromDate && dateStr < toDate;
          const isToday = dateStr === toISODate(new Date());

          let borderRadius = '6px';
          if (isFrom && toDate) borderRadius = '6px 0 0 6px';
          else if (isTo && fromDate) borderRadius = '0 6px 6px 0';

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => handleDayClick(day)}
              style={{
                width: '100%',
                aspectRatio: '1',
                border: isToday && !isEndpoint ? '1px solid #3182ce' : 'none',
                borderRadius,
                background: isEndpoint ? '#3182ce' : inRange ? '#ebf8ff' : 'transparent',
                color: isEndpoint ? 'white' : '#2d3748',
                fontSize: '12px',
                fontWeight: isEndpoint ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────

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

// API Response interface
interface ApiPurchaseInvoice {
  id: number;
  name: string;
  supplier: string;
  supplier_name: string;
  purchase_order: string;
  status: string;
  posting_date: string;
  due_date: string;
  currency: string;
  total: number;
  paid_amount: number;
  outstanding_amount: number;
  items_count: number;
  created_by: string;
  creation: string;
  modified: string;
  is_paid: number;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: ApiPurchaseInvoice[];
  };
}

// ─── Main Component ──────────────────────────────────────────────

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
  
  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const dateFilterRef = useRef<HTMLDivElement>(null);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [suppliersList, setSuppliersList] = useState<string[]>([]);

  // ─── Click outside handler ──────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setShowDateFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ─── Quick presets for the calendar ──────────────────────────

  const applyPreset = (preset: 'today' | 'last7' | 'last30' | 'thisMonth') => {
    const today = new Date();
    let from = today;
    let to = today;

    if (preset === 'last7') {
      from = new Date(today);
      from.setDate(today.getDate() - 6);
    } else if (preset === 'last30') {
      from = new Date(today);
      from.setDate(today.getDate() - 29);
    } else if (preset === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const fromStr = toISODate(from);
    const toStr = toISODate(to);

    setDateFrom(fromStr);
    setDateTo(toStr);
    setCalMonth(from);
  };

  const clearDateRange = () => {
    setDateFrom('');
    setDateTo('');
  };

  const dateButtonLabel = () => {
    if (dateFrom) {
      return `${formatDisplayDate(dateFrom)}${dateTo ? ' – ' + formatDisplayDate(dateTo) : ''}`;
    }
    return 'From - To';
  };

  // Map API status to component status
  const mapStatus = (apiStatus: string): PurchaseInvoice['status'] => {
    switch (apiStatus?.toLowerCase()) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'partially paid':
      case 'partial': return 'Partially Paid';
      case 'fully paid':
      case 'paid': return 'Fully Paid';
      case 'overdue': return 'Overdue';
      case 'cancelled': return 'Cancelled';
      default: return 'Draft';
    }
  };

  // Fetch purchase invoices from API
  const fetchPurchaseInvoices = async () => {
    setFetching(true);
    setApiError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));

      // Date filters
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }

      const response = await api.get<ApiResponse>(`/purchase-invoice?${params.toString()}`);
      
      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setTotalRecords(response.data.data.total || 0);
        
        // Transform API data to component format
        const transformedInvoices: PurchaseInvoice[] = records.map((item: ApiPurchaseInvoice) => ({
          id: String(item.id),
          invoiceNumber: `PINV-${String(item.id).padStart(5, '0')}`,
          supplier: item.supplier_name || item.supplier || 'N/A',
          supplierCode: item.supplier || 'N/A',
          purchaseOrder: item.purchase_order || 'N/A',
          status: mapStatus(item.status),
          date: item.posting_date ? new Date(item.posting_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '',
          currency: item.currency || 'INR',
          totalAmount: item.total || 0,
          paidAmount: item.paid_amount || 0,
          balanceAmount: item.outstanding_amount || item.total || 0,
          itemsCount: item.items_count || 0,
          createdBy: item.created_by || 'System',
          createdAt: item.creation || new Date().toISOString(),
          updatedAt: item.modified || new Date().toISOString()
        }));
        
        setInvoices(transformedInvoices);
        
        // Extract unique suppliers for filter
        const uniqueSuppliers = [...new Set(transformedInvoices.map(inv => inv.supplier))];
        setSuppliersList(uniqueSuppliers);
      } else {
        setApiError('Failed to fetch purchase invoices');
      }
    } catch (err: any) {
      console.error('Error fetching purchase invoices:', err);
      setApiError('An error occurred while fetching purchase invoices');
    } finally {
      setFetching(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchPurchaseInvoices();
  }, [currentPage, itemsPerPage, dateFrom, dateTo]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, selectedStatus, selectedSupplier, dateFrom, dateTo]);

  // Filter data based on search and status
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

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;
    setLoading(true);
    
    try {
      const response = await api.delete(`/purchase-invoice/${selectedInvoice.id}`);
      if (response.data.success === 1) {
        setShowDeleteModal(false);
        toast.success('Purchase Invoice deleted successfully!');
        fetchPurchaseInvoices();
      } else {
        toast.error('Failed to delete purchase invoice');
      }
    } catch (err: any) {
      console.error('Error deleting purchase invoice:', err);
      toast.error(err.response?.data?.message || 'An error occurred while deleting');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterText('');
    setSelectedStatus('All');
    setSelectedSupplier('All');
    setDateFrom('');
    setDateTo('');
    setShowDateFilterDropdown(false);
  };

  const statusOptions = ['Draft', 'Submitted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

  if (fetching) {
    return (
      <div className={`inv-page ${theme}-theme`}>
        <div className="inv-loading">
          <FaSpinner className="inv-spinning" size={32} />
          <p>Loading purchase invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inv-page ${theme}-theme`}>
      {/* Header */}
      <div className="inv-header">
        <div className="inv-header-left">
          <h1 className="inv-title">Purchase Bill</h1>
          <span className="inv-badge">{totalRecords}</span>
        </div>
        <div className="inv-header-actions">
          <button className="inv-btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> New Purchase Bill
          </button>
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
          
          {/* Date Range Button with Calendar Dropdown */}
          <div ref={dateFilterRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="inv-filter-btn"
              onClick={() => setShowDateFilterDropdown(!showDateFilterDropdown)}
              style={dateFrom ? { borderColor: '#3182ce', color: '#3182ce' } : undefined}
            >
              <FaCalendarAlt size={13} />
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dateButtonLabel()}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            {/* Calendar Date Filter Dropdown */}
            {showDateFilterDropdown && (
              <div className="inv-date-filter-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: '16px',
                minWidth: '300px',
                zIndex: 1000,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#1a202c' }}>Filter by Date</span>
                  <button onClick={() => setShowDateFilterDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Selected range readout */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <div style={{
                    flex: 1, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px',
                    fontSize: '12px', color: dateFrom ? '#1a202c' : '#a0aec0'
                  }}>
                    {dateFrom ? formatDisplayDate(dateFrom) : 'From'}
                  </div>
                  <div style={{
                    flex: 1, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px',
                    fontSize: '12px', color: dateTo ? '#1a202c' : '#a0aec0'
                  }}>
                    {dateTo ? formatDisplayDate(dateTo) : 'To'}
                  </div>
                </div>

                {/* Quick presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {([
                    { key: 'today', label: 'Today' },
                    { key: 'last7', label: 'Last 7 Days' },
                    { key: 'last30', label: 'Last 30 Days' },
                    { key: 'thisMonth', label: 'This Month' },
                  ] as const).map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p.key)}
                      style={{
                        padding: '4px 10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '999px',
                        backgroundColor: '#f7fafc',
                        fontSize: '11px',
                        color: '#4a5568',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Calendar */}
                <RangeCalendar
                  month={calMonth}
                  onMonthChange={setCalMonth}
                  fromDate={dateFrom}
                  toDate={dateTo}
                  onSelect={(from, to) => { setDateFrom(from); setDateTo(to); }}
                />

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button
                    onClick={clearDateRange}
                    style={{
                      padding: '6px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#4a5568'
                    }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      setShowDateFilterDropdown(false);
                      fetchPurchaseInvoices();
                    }}
                    style={{
                      padding: '6px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#3182ce',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            className={`inv-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} />
            Filter
          </button>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="inv-api-error">
          <FaExclamationTriangle size={16} />
          <span>{apiError}</span>
          <button onClick={fetchPurchaseInvoices} className="inv-retry-btn">Retry</button>
        </div>
      )}

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== 'All' || selectedSupplier !== 'All' || dateFrom || dateTo) && (
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
          {dateFrom && <span><strong>From:</strong> {dateFrom}</span>}
          {dateTo && <span><strong>To:</strong> {dateTo}</span>}
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
              {suppliersList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="inv-filter-group">
            <label>Currency</label>
            <select>
              <option value="all">All Currencies</option>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="inv-apply-filters" onClick={fetchPurchaseInvoices}>Apply</button>
        </div>
      )}

      {/* Table */}
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th className="inv-th">Invoice #</th>
              <th className="inv-th">Supplier</th>
              <th className="inv-th">Date</th>
              <th className="inv-th">Total</th>
              <th className="inv-th">Balance</th>
              <th className="inv-th">Status</th>
              <th className="inv-th inv-th-meta">
                <span className="inv-count-label">{totalFilteredItems} of {totalRecords}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="inv-empty-state">
                  <div className="inv-empty-content">
                    <FaReceipt size={48} />
                    <p>No purchase invoices found</p>
                    <span>Create your first purchase invoice to get started</span>
                    <button className="inv-btn-primary" onClick={handleCreate} style={{ marginTop: '12px' }}>
                      <FaPlus size={12} /> New Purchase Bill
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((inv) => (
                <tr
                  key={inv.id}
                  className="inv-tr"
                  onClick={() => handleRowClick(inv)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="inv-td inv-td-id">
                    <div>
                      <div style={{ fontWeight: 600 }}>{inv.invoiceNumber}</div>
                      <div style={{ fontSize: '11px', opacity: 0.6 }}>PINV-{inv.id}</div>
                    </div>
                  </td>
                  <td className="inv-td">{inv.supplier}</td>
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