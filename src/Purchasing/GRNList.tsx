import { useState, useEffect, type JSX, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaBoxes,
  FaFileInvoice,
  FaUsers,
  FaList,
  FaCalendarAlt,
  FaUser,
  FaExclamationTriangle,
} from 'react-icons/fa';
import "./GRNList.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

// ─── Types ──────────────────────────────────────────────────────────

interface GRN {
  id: number;
  grn_number: string;
  grn_date: string;
  supplier_id: number | null;
  supplier_name: string | null;
  customer_id: number | null;
  name: string | null;
  party_name: string | null;
  purchase_order_id: number | null;
  warehouse_id: number;
  received_by: string;
  vehicle_number: string | null;
  delivery_challan_no: string;
  invoice_number: string | null;
  status: 'draft' | 'submitted' | 'completed' | 'rejected';
  total_ordered_qty: number;
  total_received_qty: number;
  total_accepted_qty: number;
  total_rejected_qty: number;
  remarks: string | null;
  total_items: number;
  type?: string;
  creation?: string;
}

interface GRNDisplay {
  id: string;
  grnNo: string;
  partyName: string;
  partyId: number | null;
  supplierId: number | null;
  customerId: number | null;
  purchaseOrderId: number | null;
  poReference: string;
  date: string;
  dateRaw: string;
  status: 'draft' | 'submitted' | 'completed' | 'rejected';
  items: number;
  receivedBy: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  createdAgo: string;
  isService: boolean;
  isManual: boolean;
  type: string;
  // Formatted display fields
  displayDate?: string;
}

interface ApiResponse {
  success: number;
  data: {
    data: GRN[];
    totalRecords: number;
    page: number;
    limit: number;
  };
  totalRecords: number;
  page: number;
  limit: number;
}

type TabId = 'all' | 'po' | 'manual' | 'service';

// ─── Date helpers ────────────────────────────────────────────────

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

// ─── Range Calendar Component ────────────────────────────────────

interface RangeCalendarProps {
  month: Date;
  onMonthChange: (d: Date) => void;
  fromDate: string;
  toDate: string;
  onSelect: (from: string, to: string) => void;
  formatDisplayDateFn: (iso: string) => string;
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

// ─── Main Component ──────────────────────────────────────────────

export default function GRNList() {
  const navigate = useNavigate();
  
  // ✅ GET THE DATE FORMAT FUNCTION FROM CONTEXT
  const { theme, formatDate } = useAdminTheme();

  // ── State ──────────────────────────────────────────────────────
  const [allGrns, setAllGrns] = useState<GRNDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GRNDisplay | null>(null);

  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const dateFilterRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Format display date using context
  const formatDisplayDateWithContext = (dateString: string) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  // ✅ NEW: Format date for API (YYYY-MM-DD)

  // ── Tabs config ─────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: JSX.Element }[] = [
    { id: 'all', label: 'All GRNs', icon: <FaList size={14} /> },
    { id: 'po', label: 'By PO', icon: <FaFileInvoice size={14} /> },
    { id: 'manual', label: 'Manual Entry', icon: <FaBoxes size={14} /> },
    { id: 'service', label: 'Service', icon: <FaUsers size={14} /> },
  ];

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

  // ─── Helper: Format GRN Number ──────────────────────────────
  
  const formatGRNNumber = (grnNumber: string, id: number): string => {
    if (grnNumber && grnNumber.startsWith('GRN-') && grnNumber.length <= 12) {
      return grnNumber;
    }
    return `GRN-${String(id).padStart(4, '0')}`;
  };

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

  // ✅ UPDATED: Date button label using context formatter
  const dateButtonLabel = () => {
    if (dateFrom) {
      return `${formatDisplayDateWithContext(dateFrom)}${dateTo ? ' – ' + formatDisplayDateWithContext(dateTo) : ''}`;
    }
    return 'From - To';
  };

  // ─── Fetch ALL GRNs ──────────────────────────────────────────────

  const fetchGRNs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('limit', '10000');

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
        console.log('Searching with term:', searchTerm.trim());
      }

      if (dateFrom) {
        params.append('date_from', dateFrom);
        console.log('Filtering from date:', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
        console.log('Filtering to date:', dateTo);
      }

      console.log('API URL:', `/grn?${params.toString()}`);

      const response = await api.get<ApiResponse>(`/grn?${params.toString()}`);

      if (response.data.success === 1) {
        const records = response.data.data.data || [];
        console.log('Records received:', records.length);
        
        // ✅ TRANSFORM DATA WITH FORMATTED DATES
        const transformed: GRNDisplay[] = records.map((item: GRN) => {
          const isService = item.type === 'External';
          const isManual = item.purchase_order_id === null && item.customer_id === null;
          const partyName = isService
            ? (item.name || item.party_name || 'N/A')
            : (item.supplier_name || item.party_name || 'N/A');

          const formattedGRN = formatGRNNumber(item.grn_number, item.id);

          return {
            id: item.id.toString(),
            grnNo: formattedGRN,
            partyName,
            partyId: isService ? item.customer_id : item.supplier_id,
            supplierId: item.supplier_id,
            customerId: item.customer_id,
            purchaseOrderId: item.purchase_order_id,
            poReference: item.purchase_order_id ? `PO-${String(item.purchase_order_id).padStart(5, '0')}` : 'N/A',
            date: formatDisplayDate(item.grn_date, formatDisplayDateWithContext),
            dateRaw: item.grn_date,
            status: item.status || 'draft',
            items: item.total_items || 0,
            receivedBy: item.received_by || 'N/A',
            orderedQty: item.total_ordered_qty || 0,
            receivedQty: item.total_received_qty || 0,
            acceptedQty: item.total_accepted_qty || 0,
            rejectedQty: item.total_rejected_qty || 0,
            createdAgo: '',
            isService,
            isManual,
            type: item.type || '',
            // ✅ ADD FORMATTED DATE FOR DISPLAY
            displayDate: item.grn_date ? formatDisplayDateWithContext(item.grn_date) : ''
          };
        });

        // Sort by date in descending order (newest first)
        const sortedTransformed = transformed.sort((a, b) => {
          return new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime();
        });

        setAllGrns(sortedTransformed);
      } else {
        setError('Failed to fetch GRNs');
      }
    } catch (err) {
      console.error('Error fetching GRNs:', err);
      setError('An error occurred while fetching GRNs');
    } finally {
      setLoading(false);
    }
  };

  // ─── Effects ────────────────────────────────────────────────────

  useEffect(() => {
    fetchGRNs();
  }, [searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeTab]);

  // ─── Filtering ─────────────────────────────────────────────

  const getFilteredGrns = (): GRNDisplay[] => {
    let filtered = allGrns;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    if (activeTab === 'po') {
      filtered = filtered.filter(g => g.purchaseOrderId !== null && g.purchaseOrderId > 0);
    } else if (activeTab === 'manual') {
      filtered = filtered.filter(g => g.purchaseOrderId === null && g.customerId === null);
    } else if (activeTab === 'service') {
      filtered = filtered.filter(g => g.type === 'External');
    }

    return filtered;
  };

  const filteredGrns = getFilteredGrns();
  const totalFiltered = filteredGrns.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedGrns = filteredGrns.slice(startIndex, startIndex + itemsPerPage);

  // ─── Tab counts ──────────────────────────────────────────────────

  const tabCounts = {
    all: allGrns.length,
    po: allGrns.filter(g => g.purchaseOrderId !== null && g.purchaseOrderId > 0).length,
    manual: allGrns.filter(g => g.purchaseOrderId === null && g.customerId === null).length,
    service: allGrns.filter(g => g.type === 'External').length,
  };

  // ─── Pagination handlers ──────────────────────────────────────────

  const goToPage = (page: number) => {
    if (page < 1) page = totalPages;
    if (page > totalPages) page = 1;
    setCurrentPage(page);
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
    let start = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalFiltered);

  // ── UI Helpers ──────────────────────────────────────────────────

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'grn-status-draft';
      case 'submitted': return 'grn-status-submitted';
      case 'completed': return 'grn-status-completed';
      case 'rejected': return 'grn-status-rejected';
      default: return 'grn-status-draft';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return 'Draft';
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────

  const handleDelete = (item: GRNDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      const response = await api.delete(`/grn/${selectedItem.id}`);
      if (response.data.success === 1) {
        setShowDeleteConfirm(false);
        setSelectedItem(null);
        fetchGRNs();
      }
    } catch (err) {
      console.error('Error deleting GRN:', err);
      alert('Failed to delete GRN');
    }
  };

  const handleEdit = (item: GRNDisplay) => navigate(`/grn/${encodeURIComponent(item.id)}`);
  const handleView = (item: GRNDisplay) => navigate(`/grn/${encodeURIComponent(item.id)}`);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setActiveTab('all');
    setDateFrom('');
    setDateTo('');
    setShowDateFilterDropdown(false);
  };

  // ─── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`grn-page ${theme}`}>
        <div className="grn-loading">
          <div className="grn-loading-spinner"></div>
          <p>Loading GRNs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grn-page ${theme}`}>

      {/* ─── Tabs ───────────────────────────────────── */}
      <div className="grn-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`grn-tab ${activeTab === tab.id ? 'grn-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
            <span className="grn-tab-count">{tabCounts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* ─── Error banner ───────────────────────────────────────── */}
      {error && (
        <div className="grn-error-banner">
          <FaExclamationTriangle size={14} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="grn-error-close">
            <FaTimes size={14} />
          </button>
        </div>
      )}

      {/* ─── Filter Bar ─────────────────────────────────────────── */}
      <div className="grn-filter-bar">
        <div className="grn-filter-left">
          <div className="grn-search-wrapper">
            <FaSearch className="grn-search-icon" size={14} />
            <input
              type="text"
              placeholder="Search GRNs by number, party, or PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="grn-search-input"
            />
            {searchTerm && (
              <button className="grn-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="grn-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="grn-filter-select"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          
          {/* Created On Button with Calendar Dropdown */}
          <div ref={dateFilterRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="grn-sort-btn"
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
              <div className="grn-date-filter-dropdown" style={{
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
                      fetchGRNs();
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

          <button className="grn-btn-primary" onClick={() => navigate('/grn/new')}>
            <FaPlus size={12} /> New GRN
          </button>
        </div>
      </div>

      {/* ─── Active filters indicator ───────────────────────────── */}
      {(searchTerm || statusFilter !== 'all' || activeTab !== 'all' || dateFrom || dateTo) && (
        <div className="grn-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span>Active filters:</span>
          {activeTab !== 'all' && (
            <span><strong>Tab:</strong> {tabs.find(t => t.id === activeTab)?.label}</span>
          )}
          {searchTerm && (
            <span><strong>Search:</strong> "{searchTerm}"</span>
          )}
          {statusFilter !== 'all' && (
            <span><strong>Status:</strong> {getStatusLabel(statusFilter)}</span>
          )}
          {dateFrom && <span><strong>From:</strong> {formatDisplayDateWithContext(dateFrom)}</span>}
          {dateTo && <span><strong>To:</strong> {formatDisplayDateWithContext(dateTo)}</span>}
          <button onClick={clearFilters} className="grn-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* ─── Table ───────────────────────────────────────────────── */}
      <div className="grn-table-wrap">
        <table className="grn-table">
          <thead>
            <tr>
              <th className="grn-th">GRN No.</th>
              <th className="grn-th">Party</th>
              <th className="grn-th">PO</th>
              <th className="grn-th">Received By</th>
              <th className="grn-th">Date</th>
              <th className="grn-th">Status</th>
              <th className="grn-th">Qty</th>
              <th className="grn-th grn-th-meta">
                <span className="grn-count-label">{totalFiltered} records</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedGrns.length === 0 ? (
              <tr>
                <td colSpan={8} className="grn-empty-state">
                  <div className="grn-empty-content">
                    <FaBoxes size={48} />
                    <p>No GRNs found</p>
                    <span>Try adjusting your search or filter criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedGrns.map((row) => (
                <tr
                  key={row.id}
                  className="grn-tr"
                  onClick={() => handleView(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="grn-td grn-td-id">
                    <span className="grn-id-link">{row.grnNo}</span>
                  </td>
                  <td className="grn-td">
                    <span className="grn-party">
                      {row.isService && <FaUsers size={12} style={{ marginRight: 4, color: 'var(--primary-color)' }} />}
                      {row.partyName}
                    </span>
                  </td>
                  <td className="grn-td">
                    <span className="grn-po-ref">{row.poReference}</span>
                  </td>
                  <td className="grn-td">
                    <span className="grn-received-by">
                      <FaUser size={10} style={{ marginRight: 4 }} />
                      {row.receivedBy}
                    </span>
                  </td>
                  <td className="grn-td">
                    <span className="grn-date">
                      <FaCalendarAlt size={10} style={{ marginRight: 4 }} />
                      {/* ✅ USE FORMATTED DATE FOR DISPLAY */}
                      {row.displayDate || row.date}
                    </span>
                  </td>
                  <td className="grn-td">
                    <span className={`grn-status-pill ${getStatusBadgeClass(row.status)}`}>
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="grn-td grn-td-qty">
                    <span className="grn-qty">{row.receivedQty}</span>
                  </td>
                  <td className="grn-td grn-td-meta">
                    <div className="grn-action-buttons">
                      <button
                        className="grn-action-btn grn-action-view"
                        onClick={(e) => { e.stopPropagation(); handleView(row); }}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button
                        className="grn-action-btn grn-action-edit"
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        className="grn-action-btn grn-action-delete"
                        onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
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

      {/* ─── Pagination ──────────────────────────────────────────── */}
      {!loading && totalFiltered > 0 && (
        <div className="grn-pagination">
          <div className="grn-pagination-left">
            <span className="grn-pagination-label">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="grn-page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="grn-pagination-label">entries</span>
          </div>
          <div className="grn-pagination-center">
            <button onClick={goToFirstPage} className="grn-page-btn">
              <FaAngleDoubleLeft size={12} />
            </button>
            <button onClick={goToPrevPage} className="grn-page-btn">
              <FaChevronLeft size={12} />
            </button>
            {totalFiltered > 0 && getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`grn-page-btn ${validCurrentPage === page ? 'grn-page-btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button onClick={goToNextPage} className="grn-page-btn">
              <FaChevronRight size={12} />
            </button>
            <button onClick={goToLastPage} className="grn-page-btn">
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="grn-pagination-right">
            <span className="grn-pagination-info">
              {totalFiltered > 0 ? (
                `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFiltered} entries`
              ) : (
                'No entries to show'
              )}
            </span>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ───────────────────────────── */}
      {showDeleteConfirm && selectedItem && (
        <div className="grn-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="grn-modal grn-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="grn-modal-header">
              <span className="grn-modal-title">Confirm Delete</span>
              <button className="grn-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="grn-modal-body">
              <p>Are you sure you want to delete this GRN?</p>
              <p className="grn-modal-item-name"><strong>{selectedItem.grnNo}</strong> - {selectedItem.partyName}</p>
              <p className="grn-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="grn-modal-footer">
              <button className="grn-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="grn-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}