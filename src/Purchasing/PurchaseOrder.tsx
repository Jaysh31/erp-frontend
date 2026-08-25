import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter,
  FaTimes, FaEye,
  FaFileAlt, FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle,
  FaSpinner,
  FaChevronLeft, FaChevronRight,
  FaAngleDoubleLeft, FaAngleDoubleRight,
  FaCalendarAlt,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import './PurchaseOrder.css';

// ─── Types ──────────────────────────────────────────────────

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
  // Formatted display fields
  displayOrderDate?: string;
  displayDeliveryDate?: string;
}

interface ApiPurchaseOrder {
  id: number;
  name: string;
  title?: string;
  supplier: string;
  supplier_name: string;
  company: string;
  transaction_date: string;
  schedule_date: string;
  currency: string;
  total_qty: number;
  total: number;
  net_total: number;
  grand_total: number;
  rounded_total: number;
  status: string;
  per_received: number;
  per_billed: number;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: ApiPurchaseOrder[];
  };
}

// ─── Date helpers (for the calendar picker) ───────────────────

// ✅ NEW: Format date for API (YYYY-MM-DD)
const toISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ✅ UPDATED: Format display date using context (will be replaced in component)
const formatDisplayDate = (iso: string, formatFn?: (date: string) => string): string => {
  if (!iso) return '';
  if (formatFn) {
    return formatFn(iso);
  }
  // Fallback if formatFn not provided
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ─── Range Calendar Component ─────────────────────────────────

interface RangeCalendarProps {
  month: Date;
  onMonthChange: (d: Date) => void;
  fromDate: string;
  toDate: string;
  onSelect: (from: string, to: string) => void;
  formatDisplayDateFn: (iso: string) => string;
}

function RangeCalendar({ month, onMonthChange, fromDate, toDate, onSelect, formatDisplayDateFn }: RangeCalendarProps) {
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

// ─── Main Component ────────────────────────────────────────

export default function PurchaseOrder() {
  const navigate = useNavigate();
  
  // ✅ GET THE DATE FORMAT FUNCTION FROM CONTEXT
  const { theme, formatDate, getApiDateFormat } = useAdminTheme();

  // Filters
  const [filterText, setFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Date filters - single From / To range (applied to Order Date)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Date filter dropdown state
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const dateFilterRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);

  // Data & loading
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pagination (server‑side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ NEW: Format display date using context
  const formatDisplayDateWithContext = (dateString: string) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  // ✅ NEW: Format date for API (YYYY-MM-DD)
  const toApiDateFormat = (date: Date) => {
    return getApiDateFormat(date);
  };

  // ─── Click outside handler ──────────────────────────────

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

  // ─── API Helpers ──────────────────────────────────────────

  const mapStatus = (apiStatus: string): PurchaseOrder['status'] => {
    switch (apiStatus?.toLowerCase()) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'partially received':
      case 'partial': return 'Partially Received';
      case 'fully received':
      case 'received': return 'Fully Received';
      case 'cancelled': return 'Cancelled';
      case 'closed': return 'Closed';
      default: return 'Draft';
    }
  };

  // Debounce function for search
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedFilterText = useDebounce(filterText, 500);
  const debouncedSupplier = useDebounce(selectedSupplier, 300);

  // Fetch current page from the server with all filters
  const fetchPurchaseOrders = useCallback(async () => {
    setFetching(true);
    setApiError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));

      if (debouncedFilterText.trim()) {
        params.append('search', debouncedFilterText.trim());
      }

      if (selectedStatus !== 'All') {
        params.append('status', selectedStatus);
      }

      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }

      const response = await api.get<ApiResponse>(`/purchase-order?${params.toString()}`);
      if (response.data.success === 1) {
        const records = response.data.data.records;
        setTotalRecords(response.data.data.total);

        // ✅ TRANSFORM DATA WITH FORMATTED DATES
        const transformedOrders: PurchaseOrder[] = records.map((item) => ({
          id: String(item.id),
          poNumber: item.name || `PO-${String(item.id).padStart(5, '0')}`,
          title: item.title || `PO-${item.name || item.id}`,
          supplier: item.supplier_name || item.supplier || 'N/A',
          supplierCode: item.supplier || 'N/A',
          status: mapStatus(item.status),
          orderDate: item.transaction_date
            ? new Date(item.transaction_date).toLocaleDateString()
            : new Date().toLocaleDateString(),
          deliveryDate: item.schedule_date
            ? new Date(item.schedule_date).toLocaleDateString()
            : 'N/A',
          currency: item.currency || 'INR',
          totalAmount: item.grand_total || item.total || 0,
          receivedAmount: item.total
            ? (item.total * (item.per_received || 0)) / 100
            : 0,
          balanceAmount: item.total
            ? (item.total * (1 - (item.per_received || 0) / 100))
            : 0,
          paymentTerms: 'Net 30',
          shippingAddress: '',
          billingAddress: '',
          notes: '',
          createdBy: 'System',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [],
          // ✅ ADD FORMATTED DATES FOR DISPLAY
          displayOrderDate: item.transaction_date ? formatDisplayDateWithContext(item.transaction_date) : '',
          displayDeliveryDate: item.schedule_date ? formatDisplayDateWithContext(item.schedule_date) : ''
        }));
        setPurchaseOrders(transformedOrders);
      } else {
        setApiError('Failed to fetch purchase orders');
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setApiError('An error occurred while fetching purchase orders');
    } finally {
      setFetching(false);
    }
  }, [currentPage, itemsPerPage, debouncedFilterText, selectedStatus, debouncedSupplier, dateFrom, dateTo]);

  // ─── Effects ──────────────────────────────────────────────

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, selectedStatus, selectedSupplier, dateFrom, dateTo]);

  // ─── Filtering (client‑side on the current page) ─────────

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      po.title.toLowerCase().includes(filterText.toLowerCase()) ||
      po.supplier.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || po.status === selectedStatus;
    const matchesSupplier = selectedSupplier === 'All' || po.supplier === selectedSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalRecords);

  // ─── Pagination handlers with LOOP (wrap around) ─────────

  const goToPage = (page: number) => {
    if (page < 1) page = totalPages;
    if (page > totalPages) page = 1;
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(validCurrentPage + 1);
  const goToPrevPage = () => goToPage(validCurrentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  // ─── Helpers for UI ──────────────────────────────────────

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

  // ─── Quick presets for the calendar ──────────────────────

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

  // ✅ UPDATED: Date button label using context formatter
  const dateButtonLabel = () => {
    if (dateFrom) {
      return `${formatDisplayDateWithContext(dateFrom)}${dateTo ? ' – ' + formatDisplayDateWithContext(dateTo) : ''}`;
    }
    return 'From - To';
  };

  // ─── Action Handlers ──────────────────────────────────────

  const handleCreate = () => navigate('/purchase-order/new');
  const handleRowClick = (po: PurchaseOrder) => navigate(`/purchase-order/edit/${po.id}`);

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

  const handleDeleteConfirm = async () => {
    if (!selectedPO) return;
    setLoading(true);
    try {
      const response = await api.delete(`/purchase-order/${selectedPO.id}`);
      if (response.data.success === 1) {
        setShowDeleteModal(false);
        toast.success('Purchase Order deleted successfully!');
        fetchPurchaseOrders();
      } else {
        toast.error('Failed to delete purchase order');
      }
    } catch (err) {
      toast.error('An error occurred while deleting');
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

  // ─── Data for filters ────────────────────────────────────

  const suppliers = [...new Set(purchaseOrders.map((po) => po.supplier))];
  const statusOptions = ['Draft', 'Submitted', 'Partially Received', 'Fully Received', 'Cancelled', 'Closed'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  const paymentTerms = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Cash on Delivery'];

  // ─── Render ──────────────────────────────────────────────

  if (fetching) {
    return (
      <div className={`po-page ${theme}`}>
        <div className="po-loading">
          <FaSpinner className="po-spinning" size={32} />
          <p>Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`po-page ${theme}`}>
      {/* ─── Filter Bar ────────────────────────────────────── */}
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
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            className={`po-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} /> Filter
          </button>

          {/* Date Range Button with Calendar Dropdown */}
          <div ref={dateFilterRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="po-sort-btn"
              onClick={() => setShowDateFilterDropdown(!showDateFilterDropdown)}
              style={dateFrom ? { borderColor: '#3182ce', color: '#3182ce' } : undefined}
            >
              <FaCalendarAlt size={13} />
              <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dateButtonLabel()}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            {/* Calendar Date Filter Dropdown */}
            {showDateFilterDropdown && (
              <div className="po-date-filter-dropdown" style={{
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
                    {dateFrom ? formatDisplayDateWithContext(dateFrom) : 'From'}
                  </div>
                  <div style={{
                    flex: 1, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px',
                    fontSize: '12px', color: dateTo ? '#1a202c' : '#a0aec0'
                  }}>
                    {dateTo ? formatDisplayDateWithContext(dateTo) : 'To'}
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
                  formatDisplayDateFn={formatDisplayDateWithContext}
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
                      fetchPurchaseOrders();
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

          <button className="po-btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add PO
          </button>
        </div>
      </div>

      {/* ─── Active filters ────────────────────────────────── */}
      {(filterText || selectedStatus !== 'All' || selectedSupplier !== 'All' || dateFrom || dateTo) && (
        <div className="po-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span>Active filters:</span>
          {filterText && <span><strong>Search:</strong> "{filterText}"</span>}
          {selectedStatus !== 'All' && <span><strong>Status:</strong> {selectedStatus}</span>}
          {selectedSupplier !== 'All' && <span><strong>Supplier:</strong> {selectedSupplier}</span>}
          {dateFrom && <span><strong>From:</strong> {formatDisplayDateWithContext(dateFrom)}</span>}
          {dateTo && <span><strong>To:</strong> {formatDisplayDateWithContext(dateTo)}</span>}
          <button onClick={clearFilters} className="po-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* ─── API Error ──────────────────────────────────────── */}
      {apiError && (
        <div className="po-api-error">
          <FaExclamationTriangle size={16} />
          <span>{apiError}</span>
          <button onClick={fetchPurchaseOrders} className="po-retry-btn">Retry</button>
        </div>
      )}

      {/* ─── Expandable Filters ────────────────────────────── */}
      {showFilters && (
        <div className="po-expandable-filters">
          <div className="po-filter-group">
            <label>Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="po-filter-group">
            <label>Currency</label>
            <select>
              <option value="all">All Currencies</option>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="po-filter-group">
            <label>Payment Terms</label>
            <select>
              <option value="all">All Terms</option>
              {paymentTerms.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="po-apply-filters" onClick={fetchPurchaseOrders}>Apply</button>
        </div>
      )}

      {/* ─── Table ──────────────────────────────────────────── */}
      <div className="po-table-wrap">
        <table className="po-table">
          <thead>
            <tr>
              <th className="po-th">PO #</th>
              <th className="po-th">Title</th>
              <th className="po-th">Supplier</th>
              <th className="po-th">Order Date</th>
              <th className="po-th">Delivery Date</th>
              <th className="po-th">Amount</th>
              <th className="po-th">Status</th>
              <th className="po-th po-th-meta">
                <span className="po-count-label">
                  {totalRecords > 0
                    ? `${(validCurrentPage - 1) * itemsPerPage + 1}–${Math.min(validCurrentPage * itemsPerPage, totalRecords)}`
                    : '0'} of {totalRecords}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
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
              filteredOrders.map((po) => (
                <tr key={po.id} className="po-tr" onClick={() => handleRowClick(po)} style={{ cursor: 'pointer' }}>
                  <td className="po-td po-td-id">{po.poNumber}</td>
                  <td className="po-td">{po.title}</td>
                  <td className="po-td">{po.supplier}</td>
                  {/* ✅ USE FORMATTED DATE FOR DISPLAY */}
                  <td className="po-td">{po.displayOrderDate || po.orderDate}</td>
                  <td className="po-td">{po.displayDeliveryDate || po.deliveryDate}</td>
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
                      <button className="po-action-btn po-action-view" onClick={(e) => handleView(po, e)} title="View">
                        <FaEye size={12} />
                      </button>
                      <button className="po-action-btn po-action-edit" onClick={(e) => { e.stopPropagation(); handleRowClick(po); }} title="Edit">
                        <FaEdit size={12} />
                      </button>
                      <button className="po-action-btn po-action-delete" onClick={(e) => handleDelete(po, e)} title="Delete">
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

      {/* ─── Pagination ────────────────────────────────────── */}
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
          <button onClick={goToFirstPage} className="po-page-btn">
            <FaAngleDoubleLeft size={12} />
          </button>
          <button onClick={goToPrevPage} className="po-page-btn">
            <FaChevronLeft size={12} />
          </button>
          {totalRecords > 0 &&
            getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`po-page-btn ${validCurrentPage === page ? 'po-page-btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
          <button onClick={goToNextPage} className="po-page-btn">
            <FaChevronRight size={12} />
          </button>
          <button onClick={goToLastPage} className="po-page-btn">
            <FaAngleDoubleRight size={12} />
          </button>
        </div>
        <div className="po-pagination-right">
          <span className="po-pagination-info">
            {totalRecords > 0
              ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalRecords} entries`
              : 'No entries to show'}
          </span>
        </div>
      </div>

      {/* ─── View Modal ────────────────────────────────────── */}
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
                  {/* ✅ USE FORMATTED DATES FOR DISPLAY */}
                  <div className="po-view-row"><label>Order Date:</label><span>{selectedPO.displayOrderDate || selectedPO.orderDate}</span></div>
                  <div className="po-view-row"><label>Delivery Date:</label><span>{selectedPO.displayDeliveryDate || selectedPO.deliveryDate}</span></div>
                  <div className="po-view-row"><label>Created By:</label><span>{selectedPO.createdBy}</span></div>
                </div>
                <div className="po-view-section">
                  <h4>Financial Summary</h4>
                  <div className="po-view-row"><label>Total Amount:</label><span>{selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}</span></div>
                  <div className="po-view-row"><label>Received:</label><span className="po-received-cell">{selectedPO.currency} {selectedPO.receivedAmount.toLocaleString()}</span></div>
                  <div className="po-view-row"><label>Balance:</label><span className="po-balance-cell">{selectedPO.currency} {selectedPO.balanceAmount.toLocaleString()}</span></div>
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
              <button className="po-btn-primary" onClick={() => handleRowClick(selectedPO)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Modal ──────────────────────────────────── */}
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