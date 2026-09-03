// JobCardManagement.tsx - Fixed version with Server-Side Pagination
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaEye,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSpinner,
  FaCalendarAlt,
} from "react-icons/fa";
import "./JobCardManagement.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";

type Status = "Open" | "Work In Progress" | "Completed" | "On Hold" | "Cancelled";

interface JobCardApiRecord {
  id: number;
  name: string;
  work_order: string;
  operation: string;
  workstation: string;
  for_quantity?: number;
  requested_qty?: number;
  total_completed_qty: number;
  process_loss_qty: number;
  sequence_id: number;
  company: string;
  status: Status;
  creation?: string;
  posting_date?: string;
  expected_start_date?: string | null;
  expected_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  production_item: string;
}

interface JobCardDisplay {
  id: string;
  recordId: number;
  jobCardId: string;
  workOrder: string;
  operation: string;
  workstation: string;
  qty: number;
  completedQty: number;
  lossQty: number;
  productionItem: string;
  sequenceId: number;
  company: string;
  status: Status;
  createdOn: string;
  progress: number;
  createdAgo: string;
  expectedStartDate: Date | null;
  expectedEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  // ✅ Formatted display fields
  displayCreatedOn?: string;
  displayExpectedStart?: string;
  displayExpectedEnd?: string;
  displayActualStart?: string;
  displayActualEnd?: string;
}

interface WorkOrderGroup {
  workOrder: string;
  jobCards: JobCardDisplay[];
  totalQty: number;
  completedQty: number;
  production_item: string;
  lossQty: number;
  progress: number;
}

const STATUS_CLASS: Record<Status, string> = {
  Open: "s-open",
  "Work In Progress": "s-inprocess",
  Completed: "s-completed",
  "On Hold": "s-onhold",
  Cancelled: "s-cancelled",
};

const STATUS_LABELS: Record<Status, string> = {
  Open: "Open",
  "Work In Progress": "Work In Progress",
  Completed: "Completed",
  "On Hold": "On Hold",
  Cancelled: "Cancelled",
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

interface TimerInfo {
  label: string;
  colorVar: string;
  pulsing: boolean;
}

const getTimerInfo = (row: JobCardDisplay, now: Date): TimerInfo => {
  if (row.actualStartDate && !row.actualEndDate) {
    if (row.expectedEndDate) {
      const diff = row.expectedEndDate.getTime() - now.getTime();
      if (diff > 0) {
        return { label: `Ends in ${formatDuration(diff)}`, colorVar: "var(--primary-color)", pulsing: true };
      }
      return { label: `Overdue by ${formatDuration(-diff)}`, colorVar: "var(--danger-color)", pulsing: true };
    }
    const elapsed = now.getTime() - row.actualStartDate.getTime();
    return { label: formatDuration(elapsed), colorVar: "var(--primary-color)", pulsing: true };
  }
  if (row.actualStartDate && row.actualEndDate) {
    const total = row.actualEndDate.getTime() - row.actualStartDate.getTime();
    return { label: `Done in ${formatDuration(total)}`, colorVar: "var(--text-secondary)", pulsing: false };
  }
  if (row.expectedStartDate) {
    const diff = row.expectedStartDate.getTime() - now.getTime();
    if (diff > 0) {
      return { label: `Starts in ${formatDuration(diff)}`, colorVar: "var(--text-secondary)", pulsing: false };
    }
    return { label: `Overdue by ${formatDuration(-diff)}`, colorVar: "var(--danger-color)", pulsing: false };
  }
  return { label: "-", colorVar: "var(--text-secondary)", pulsing: false };
};

export default function JobCardManagement() {
  const navigate = useNavigate();
  
  // ✅ GET THE DATE FORMAT FUNCTION FROM CONTEXT
  const { theme, formatDate, getApiDateFormat } = useAdminTheme();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [jobCards, setJobCards] = useState<JobCardDisplay[]>([]);
  const [groups, setGroups] = useState<WorkOrderGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JobCardDisplay | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // ─── Date Filter States ────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const pageSizeOptions = [10, 25, 50, 100];

  // ✅ NEW: Format display date using context (supports all 4 formats)
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  // ✅ NEW: Format date for API (YYYY-MM-DD)
  const toApiDateFormat = (date: Date) => {
    return getApiDateFormat(date);
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ UPDATED: Format date display using context
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return formatDate(dateStr);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateSelected = (day: number) => {
    if (!fromDate || !toDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    return date >= from && date <= to;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(dateStr);
      setToDate('');
    } else {
      if (new Date(dateStr) < new Date(fromDate)) {
        setToDate(fromDate);
        setFromDate(dateStr);
      } else {
        setToDate(dateStr);
      }
    }
  };

  const handleApplyDateFilter = () => {
    if (fromDate && toDate) {
      setCurrentPage(1);
      setShowDatePicker(false);
      fetchJobCards();
    }
  };

  const handleClearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setShowDatePicker(false);
    fetchJobCards();
  };

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    setFromDate(from.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  // ✅ UPDATED: Format date ago using context
  const formatDateAgo = (dateString: string) => {
    const date = new Date(dateString);
    const nowDate = new Date();
    const diffMs = nowDate.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo`;
    return `${Math.floor(diffDays / 365)} y`;
  };

  const calculateProgress = (qty: number, completed: number, loss: number): number => {
    if (qty === 0) return 0;
    const totalDone = completed + loss;
    return Math.min(Math.round((totalDone / qty) * 100), 100);
  };

  const fetchJobCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      // ✅ SERVER-SIDE PAGINATION PARAMS
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (statusFilter !== "all") {
        params.append('status', statusFilter);
      }

      // Add date filters
      if (fromDate) {
        params.append('date_from', fromDate);
      }
      if (toDate) {
        params.append('date_to', toDate);
      }

      console.log(`Calling API: /job-card?${params.toString()}`);
      const response = await api.get(`/job-card?${params.toString()}`);
      
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to fetch job cards");
      }

      const rawData = response.data.data;
      let records: JobCardApiRecord[] = [];
      let total = 0;
      
      if (Array.isArray(rawData)) {
        records = rawData;
        total = records.length;
      } else if (rawData && typeof rawData === 'object' && 'records' in rawData) {
        const paginatedData = rawData as { records: JobCardApiRecord[]; total: number; page: number; limit: number };
        records = paginatedData.records || [];
        total = paginatedData.total || records.length;
        console.log(`Total records from API: ${total}, Current page: ${currentPage}, Limit: ${itemsPerPage}`);
      } else {
        records = [];
        total = 0;
      }

      // ✅ Set total items from API response
      setTotalItems(total);
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
      console.log(`Total Pages: ${Math.ceil(total / itemsPerPage)}`);

      // ✅ TRANSFORM DATA WITH FORMATTED DATES
      const transformed = records.map((item) => {
        const qty = item.for_quantity ?? item.requested_qty ?? 0;
        const completed = item.total_completed_qty || 0;
        const loss = item.process_loss_qty || 0;
        const createdOn = item.creation || item.posting_date || new Date().toISOString();
        return {
          productionItem: item.production_item,
          id: item.name || `jc-${item.id}`,
          recordId: item.id,
          jobCardId: item.name || `JC-${item.id}`,
          workOrder: item.work_order,
          operation: item.operation || "N/A",
          workstation: item.workstation || "N/A",
          qty,
          completedQty: completed,
          lossQty: loss,
          sequenceId: item.sequence_id || 0,
          company: item.company,
          status: item.status,
          createdOn,
          progress: calculateProgress(qty, completed, loss),
          createdAgo: formatDateAgo(createdOn),
          expectedStartDate: item.expected_start_date ? new Date(item.expected_start_date) : null,
          expectedEndDate: item.expected_end_date ? new Date(item.expected_end_date) : null,
          actualStartDate: item.actual_start_date ? new Date(item.actual_start_date) : null,
          actualEndDate: item.actual_end_date ? new Date(item.actual_end_date) : null,
          // ✅ ADD FORMATTED DATES FOR DISPLAY
          displayCreatedOn: formatDisplayDate(createdOn),
          displayExpectedStart: item.expected_start_date ? formatDisplayDate(item.expected_start_date) : '',
          displayExpectedEnd: item.expected_end_date ? formatDisplayDate(item.expected_end_date) : '',
          displayActualStart: item.actual_start_date ? formatDisplayDate(item.actual_start_date) : '',
          displayActualEnd: item.actual_end_date ? formatDisplayDate(item.actual_end_date) : '',
        };
      });
      
      transformed.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
      
      setJobCards(transformed);
      groupByWorkOrder(transformed);
      
    } catch (err: any) {
      console.error("Error fetching job cards:", err);
      setError(err.response?.data?.message || "An error occurred while loading job cards");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, fromDate, toDate]);

  const groupByWorkOrder = (data: JobCardDisplay[]) => {
    const groupMap = new Map<string, JobCardDisplay[]>();
    data.forEach(jc => {
      if (!groupMap.has(jc.workOrder)) {
        groupMap.set(jc.workOrder, []);
      }
      groupMap.get(jc.workOrder)!.push(jc);
    });

    const grouped: WorkOrderGroup[] = Array.from(groupMap.entries()).map(([workOrder, cards]) => {
      const sortedCards = [...cards].sort((a, b) => a.sequenceId - b.sequenceId);
      
      const totalQty = sortedCards.reduce((sum, c) => sum + c.qty, 0);
      const completedQty = sortedCards.reduce((sum, c) => sum + c.completedQty, 0);
      const lossQty = sortedCards.reduce((sum, c) => sum + c.lossQty, 0);
      const progress = totalQty > 0 ? Math.round(((completedQty + lossQty) / totalQty) * 100) : 0;
      
      return {
        workOrder,
        jobCards: sortedCards,
        totalQty,
        completedQty,
        lossQty,
        production_item: sortedCards[0]?.productionItem ?? "",
        progress,
      };
    });

    grouped.sort((a, b) => {
      const latestA = Math.max(...a.jobCards.map(jc => new Date(jc.createdOn).getTime()));
      const latestB = Math.max(...b.jobCards.map(jc => new Date(jc.createdOn).getTime()));
      return latestB - latestA;
    });

    setGroups(grouped);

    if (grouped.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set([grouped[0].workOrder]));
    }
  };

  const toggleGroup = (workOrder: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(workOrder)) {
        next.delete(workOrder);
      } else {
        next.add(workOrder);
      }
      return next;
    });
  };

  // ✅ Filter groups based on search and status (client-side filtering on the current page data)
  const getFilteredGroups = () => {
    let filtered = groups;

    if (searchTerm.trim()) {
      filtered = filtered.filter(group =>
        group.workOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.jobCards.some(jc =>
          jc.jobCardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jc.operation.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(group =>
        group.jobCards.some(jc => jc.status === statusFilter)
      );
    }

    return filtered;
  };

  // ✅ Pagination calculations
  const getStartIndex = () => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * itemsPerPage + 1;
  };
  
  const getEndIndex = () => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * itemsPerPage, totalItems);
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

  // ✅ Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, fromDate, toDate]);

  // ✅ Fetch when dependencies change
  useEffect(() => {
    fetchJobCards();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, fromDate, toDate]);

  const handleDelete = (item: JobCardDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setDeletingId(selectedItem.recordId);
    try {
      const response = await api.delete(`/job-card/${selectedItem.recordId}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to delete job card");
      }
      setShowDeleteConfirm(false);
      setSelectedItem(null);
      setDeletingId(null);
      fetchJobCards();
    } catch (err: any) {
      console.error("Error deleting job card:", err);
      alert(err.response?.data?.message || "Failed to delete job card");
      setDeletingId(null);
    }
  };

  const handleRowClick = (item: JobCardDisplay) => {
    navigate(`/job-cards/${item.recordId}`);
  };

  const handleEdit = (item: JobCardDisplay) => {
    navigate(`/job-cards/${item.recordId}`);
  };

  const handleView = (item: JobCardDisplay) => {
    navigate(`/job-cards/${item.recordId}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const totalQty = jobCards.reduce((sum, jc) => sum + jc.qty, 0);
  const totalCompleted = jobCards.reduce((sum, jc) => sum + jc.completedQty, 0);
  const totalLoss = jobCards.reduce((sum, jc) => sum + jc.lossQty, 0);
  const overallProgress = totalQty > 0 ? Math.round(((totalCompleted + totalLoss) / totalQty) * 100) : 0;

  return (
    <div className={`jc-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="jc-filter-bar">
        <div className="jc-filter-left">
          <div className="jc-search-wrapper">
            <FaSearch className="jc-search-icon" />
            <input
              type="text"
              placeholder="Search by Work Order, Job Card ID, or Operation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="jc-search-input"
            />
            {searchTerm && (
              <button className="jc-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="jc-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="jc-filter-select"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Work In Progress">Work In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          {/* Date Range Picker */}
          <div className="jc-date-range-wrapper">
            <button 
              className={`jc-date-toggle-btn ${showDatePicker ? 'active' : ''}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Filter by date range"
            >
              <FaCalendarAlt size={14} />
            </button>
            {showDatePicker && (
              <div className="jc-date-picker-popup">
                <div className="jc-date-picker-header">
                  <span className="jc-date-picker-title">Filter by Date</span>
                </div>
                
                {/* Date Range Display */}
                <div className="jc-date-range-display">
                  {fromDate && toDate ? (
                    <span>{formatDateDisplay(fromDate)} – {formatDateDisplay(toDate)}</span>
                  ) : (
                    <span className="jc-date-range-placeholder">Select date range</span>
                  )}
                </div>

                {/* Quick Filters */}
                <div className="jc-quick-filters">
                  <button className="jc-quick-filter-btn" onClick={() => setQuickDateRange(0)}>Today</button>
                  <button className="jc-quick-filter-btn" onClick={() => setQuickDateRange(7)}>Last 7 Days</button>
                  <button className="jc-quick-filter-btn" onClick={() => setQuickDateRange(30)}>Last 30 Days</button>
                  <button className="jc-quick-filter-btn" onClick={() => setQuickDateRange(90)}>This Month</button>
                </div>

                {/* Calendar */}
                <div className="jc-calendar">
                  <div className="jc-calendar-header">
                    <button className="jc-calendar-nav" onClick={handlePrevMonth}>
                      <FaChevronLeft size={12} />
                    </button>
                    <span className="jc-calendar-month">{getMonthYear(currentMonth)}</span>
                    <button className="jc-calendar-nav" onClick={handleNextMonth}>
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                  <div className="jc-calendar-weekdays">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>
                  <div className="jc-calendar-days">
                    {Array.from({ length: getDaysInMonth(currentMonth).firstDayOfMonth }).map((_, i) => (
                      <span key={`empty-${i}`} className="jc-calendar-day-empty"></span>
                    ))}
                    {Array.from({ length: getDaysInMonth(currentMonth).daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isSelected = isDateSelected(day);
                      return (
                        <button
                          key={day}
                          className={`jc-calendar-day ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleDateClick(day)}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="jc-date-actions">
                  <button 
                    className="jc-btn-clear-filter" 
                    onClick={handleClearDateFilter}
                  >
                    Clear
                  </button>
                  <button 
                    className="jc-btn-apply-filter" 
                    onClick={handleApplyDateFilter}
                    disabled={!fromDate || !toDate}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(searchTerm || statusFilter !== "all" || (fromDate && toDate)) && (
        <div className="jc-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span style={{ color: "var(--text-primary)" }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== "all" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Status:</strong> {STATUS_LABELS[statusFilter as Status]}
            </span>
          )}
          {fromDate && toDate && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Date Range:</strong> {formatDateDisplay(fromDate)} - {formatDateDisplay(toDate)}
            </span>
          )}
          <button onClick={clearFilters} className="jc-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {loading && (
        <div className="jc-loading">
          <FaSpinner className="spinning" size={24} />
          <p>Loading job cards...</p>
        </div>
      )}
      {error && (
        <div className="jc-error">
          <p>{error}</p>
          <button onClick={fetchJobCards} className="jc-retry-btn">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="jc-table-wrap">
          {getFilteredGroups().length === 0 ? (
            <div className="jc-empty-state">
              <div className="jc-empty-content">
                <FaClipboardList size={48} />
                <p>No job cards found on page {currentPage}</p>
                <span>Try adjusting your search criteria or go to another page</span>
              </div>
            </div>
          ) : (
            <div className="jc-group-container">
              {getFilteredGroups().map((group) => {
                const isExpanded = expandedGroups.has(group.workOrder);
                const filteredCards = group.jobCards.filter(jc => {
                  if (statusFilter === "all") return true;
                  return jc.status === statusFilter;
                });

                return (
                  <div key={group.workOrder} className="jc-group">
                    <div
                      className="jc-group-header"
                      onClick={() => toggleGroup(group.workOrder)}
                    >
                      <div className="jc-group-header-left">
                        <span className="jc-group-toggle">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <span className="jc-group-title">
                          <FaBuilding className="jc-group-icon" />
                          {"WorkOrder Number : "}{group.workOrder}{" | Product: "}{group.production_item}
                        </span>
                      </div>
                      <div className="jc-group-header-right">
                        <span className="jc-group-stats">
                          {group.completedQty + group.lossQty} of {group.totalQty} qty done
                        </span>
                        <div className="jc-group-progress">
                          <div className="jc-group-progress-bar">
                            <div
                              className="jc-group-progress-fill"
                              style={{ width: `${group.progress}%` }}
                            />
                          </div>
                          <span className="jc-group-progress-text">{group.progress}%</span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <table className="jc-table">
                        <thead>
                          <tr>
                            <th className="jc-th">#</th>
                            <th className="jc-th">Job Card #</th>
                            <th className="jc-th">Operation</th>
                            <th className="jc-th">Workstation</th>
                            <th className="jc-th">Qty</th>
                            <th className="jc-th">Progress</th>
                            <th className="jc-th">Status</th>
                            <th className="jc-th">Timer</th>
                            <th className="jc-th jc-th-meta">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCards.map((row, index) => {
                            const timer = getTimerInfo(row, now);
                            return (
                              <tr
                                key={row.id}
                                className="jc-tr"
                                onClick={() => handleRowClick(row)}
                                style={{ cursor: "pointer" }}
                              >
                                <td className="jc-td jc-td-number">{index + 1}</td>
                                <td className="jc-td jc-td-id">{row.jobCardId}</td>
                                <td className="jc-td">{row.operation}</td>
                                <td className="jc-td">{row.workstation}</td>
                                <td className="jc-td jc-td-number">{row.qty.toLocaleString()}</td>
                                <td className="jc-td">
                                  <div className="jc-progress-container">
                                    <div className="jc-progress-bar">
                                      <div className="jc-progress-fill" style={{ width: `${row.progress}%` }} />
                                    </div>
                                    <span className="jc-progress-text">{row.progress}%</span>
                                  </div>
                                </td>
                                <td className="jc-td">
                                  <span className={`jc-status-badge ${STATUS_CLASS[row.status]}`}>
                                    {STATUS_LABELS[row.status]}
                                  </span>
                                </td>
                                <td className="jc-td">
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: "0.82em",
                                      fontWeight: 500,
                                      color: timer.colorVar,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {timer.pulsing && (
                                      <span
                                        style={{
                                          width: 6,
                                          height: 6,
                                          borderRadius: "50%",
                                          backgroundColor: "var(--primary-color)",
                                          display: "inline-block",
                                          animation: "jc-timer-pulse 1.2s ease-in-out infinite",
                                        }}
                                      />
                                    )}
                                    {timer.label}
                                  </span>
                                </td>
                                <td className="jc-td jc-td-meta" onClick={(e) => e.stopPropagation()}>
                                  
                                  <div className="jc-action-buttons">
                                    <button 
                                      className="jc-action-btn jc-action-view" 
                                      onClick={(e) => { e.stopPropagation(); handleView(row); }} 
                                      title="View"
                                    >
                                      <FaEye size={12} />
                                    </button>
                                    <button 
                                      className="jc-action-btn jc-action-edit" 
                                      onClick={(e) => { e.stopPropagation(); handleEdit(row); }} 
                                      title="Edit"
                                    >
                                      <FaEdit size={12} />
                                    </button>
                                    <button 
                                      className="jc-action-btn jc-action-delete" 
                                      onClick={(e) => { e.stopPropagation(); handleDelete(row); }} 
                                      title="Delete"
                                      disabled={deletingId === row.recordId}
                                    >
                                      {deletingId === row.recordId ? (
                                        <FaSpinner className="spinning" size={12} />
                                      ) : (
                                        <FaTrash size={12} />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="jc-pagination">
          <div className="jc-pagination-left">
            <span className="jc-pagination-label">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="jc-page-size-select"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="jc-pagination-info">
              {totalItems > 0
                ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
                : 'No entries to show'}
            </span>
          </div>
          <div className="jc-pagination-center">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1 || totalItems === 0}
              className="jc-page-btn"
            >
              <FaAngleDoubleLeft size={12} />
            </button>
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1 || totalItems === 0}
              className="jc-page-btn"
            >
              <FaChevronLeft size={12} />
            </button>
            {totalItems > 0 && getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`jc-page-btn ${currentPage === page ? 'jc-page-btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages || totalItems === 0}
              className="jc-page-btn"
            >
              <FaChevronRight size={12} />
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages || totalItems === 0}
              className="jc-page-btn"
            >
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="jc-pagination-right">
            <span className="jc-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedItem && (
        <div className="jc-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="jc-modal jc-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="jc-modal-header">
              <span className="jc-modal-title">Confirm Delete</span>
              <button className="jc-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="jc-modal-body">
              <p>Are you sure you want to delete this job card?</p>
              <p className="jc-modal-item-name"><strong>{selectedItem.jobCardId}</strong> - {selectedItem.workOrder}</p>
              <p className="jc-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="jc-modal-footer">
              <button className="jc-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="jc-btn-delete" onClick={confirmDelete} disabled={deletingId === selectedItem.recordId}>
                {deletingId === selectedItem.recordId ? (
                  <FaSpinner className="spinning" size={12} />
                ) : (
                  <FaTrash size={12} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes jc-timer-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}