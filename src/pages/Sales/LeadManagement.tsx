import { useState, useEffect, useRef } from "react";
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
  FaBuilding,
  FaCalendarAlt,
} from "react-icons/fa";
import "./LeadManagement.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";
import toast from 'react-hot-toast';

// ─── types ──────────────────────────────────────────────────────────────

type LeadStatus = "Lead" | "Contacted" | "Qualified" | "Unqualified" | "Converted";

interface LeadDisplay {
  id: string; 
  recordId?: number; 
  leadName: string;
  organizationName: string;
  jobTitle: string;
  status: LeadStatus;
  leadType: string;
  source: string;
  email: string;
  mobileNo: string;
  city: string;
  country: string;
  createdOn: string;
  createdAgo: string;
}

const STATUS_CLASS: Record<LeadStatus, string> = {
  Lead: "s-open",
  Contacted: "s-inprocess",
  Qualified: "s-completed",
  Unqualified: "s-cancelled",
  Converted: "s-onhold",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  Lead: "Lead",
  Contacted: "Contacted",
  Qualified: "Qualified",
  Unqualified: "Unqualified",
  Converted: "Converted",
};

// ─── date filter helpers ────────────────────────────────────────────────

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDisplayDate(d: Date): string {
  return `${MONTH_LABELS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  return cells;
}

// ─── raw API record -> display record ──────────────────────────────────

function mapApiLeadToDisplay(raw: any, formatDate: (d: string) => string): LeadDisplay {
  const firstName = raw.first_name || "";
  const lastName = raw.last_name || "";
  return {
    id: String(raw.name ?? raw.id ?? ""),
    recordId: raw.id != null ? Number(raw.id) : undefined,
    leadName: raw.lead_name || [firstName, lastName].filter(Boolean).join(" ") || "—",
    organizationName: raw.company_name || "",
    jobTitle: raw.job_title || "",
    status: (raw.status as LeadStatus) || "Lead",
    leadType: raw.type || "",
    source: raw.utm_source || raw.request_type || "",
    email: raw.email_id || "",
    mobileNo: raw.mobile_no || "",
    city: raw.city || "",
    country: raw.country || "",
    createdOn: raw.creation || raw.createdOn || new Date().toISOString(),
    createdAgo: formatDate(raw.creation || raw.createdOn || new Date().toISOString()),
  };
}

function extractList(raw: any): any[] {
  const list = raw?.data?.records ?? raw?.data ?? raw?.leads ?? raw?.results ?? raw;
  return Array.isArray(list) ? list : [];
}

export default function LeadManagement() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [leads, setLeads] = useState<LeadDisplay[]>([]);
  const [rawLeads, setRawLeads] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected] = useState<Set<string>>(new Set());

  const [] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadDisplay | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // ─── date range filter state ─────────────────────────────────────────
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [tempDateFrom, setTempDateFrom] = useState<Date | null>(null);
  const [tempDateTo, setTempDateTo] = useState<Date | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const dateFilterWrapperRef = useRef<HTMLDivElement>(null);

  // close date popup on outside click (discards unapplied edits)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showDateFilter &&
        dateFilterWrapperRef.current &&
        !dateFilterWrapperRef.current.contains(e.target as Node)
      ) {
        setShowDateFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDateFilter]);

  const openDateFilter = () => {
    setTempDateFrom(dateFrom);
    setTempDateTo(dateTo);
    setCalendarViewDate(dateFrom ?? new Date());
    setShowDateFilter((prev) => !prev);
  };

  const handleCalendarDayClick = (day: Date) => {
    const clicked = stripTime(day);
    if (!tempDateFrom || (tempDateFrom && tempDateTo)) {
      setTempDateFrom(clicked);
      setTempDateTo(null);
      return;
    }
    if (clicked < tempDateFrom) {
      setTempDateTo(tempDateFrom);
      setTempDateFrom(clicked);
    } else {
      setTempDateTo(clicked);
    }
  };

  const applyQuickFilter = (range: "today" | "last7" | "last30" | "thisMonth") => {
    const today = stripTime(new Date());
    if (range === "today") {
      setTempDateFrom(today);
      setTempDateTo(today);
      setCalendarViewDate(today);
    } else if (range === "last7") {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      setTempDateFrom(from);
      setTempDateTo(today);
      setCalendarViewDate(today);
    } else if (range === "last30") {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      setTempDateFrom(from);
      setTempDateTo(today);
      setCalendarViewDate(today);
    } else if (range === "thisMonth") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setTempDateFrom(from);
      setTempDateTo(to);
      setCalendarViewDate(today);
    }
  };

  const goToPrevMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const clearDateFilter = () => {
    setTempDateFrom(null);
    setTempDateTo(null);
    setDateFrom(null);
    setDateTo(null);
  };

  const applyDateFilter = () => {
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    setCurrentPage(1);
    setShowDateFilter(false);
    // Fetch leads with date filter applied
    fetchLeadsWithFilters(statusFilter, tempDateFrom, tempDateTo);
  };

  const clearDateFilterBadge = () => {
    setDateFrom(null);
    setDateTo(null);
    setTempDateFrom(null);
    setTempDateTo(null);
    // Refresh leads without date filter
    fetchLeadsWithFilters(statusFilter, null, null);
  };

  const dateFilterButtonLabel =
    dateFrom && dateTo
      ? `${formatDisplayDate(dateFrom)} – ${formatDisplayDate(dateTo)}`
      : "From - To";

  const calendarCells = buildCalendarGrid(calendarViewDate.getFullYear(), calendarViewDate.getMonth());

  const formatDate = (dateString: string) => {
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

  // ─── fetch from GET /lead with status and date filters ──────────────

  const fetchLeadsWithFilters = async (
    status?: string, 
    fromDate?: Date | null, 
    toDate?: Date | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      // ✅ SERVER-SIDE PAGINATION PARAMS
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      
      // Add status filter if selected and not 'all'
      if (status && status !== 'all') {
        params.append('status', status);
      }

      // Add date from filter
      if (fromDate) {
        params.append('date_from', toLocalDateStr(fromDate));
      }

      // Add date to filter
      if (toDate) {
        params.append('date_to', toLocalDateStr(toDate));
      }

      const url = `/lead?${params.toString()}`;
      console.log("GET request URL:", url);
      
      const response = await api.get(url);
      console.log("GET /lead raw response:", response.data);

      const list = extractList(response.data);
      setRawLeads(list);

      if (list.length > 0) {
        console.log("First raw lead record:", list[0]);
      }

      const transformedData: LeadDisplay[] = list.map((item) => mapApiLeadToDisplay(item, formatDate));

      // ✅ Set total items from API response
      const total = response.data?.data?.total ?? response.data?.total ?? transformedData.length;
      setTotalItems(total);
      setLeads(transformedData);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.message || "An error occurred while loading leads");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── fetch leads with status filter from API ───────────────────────────


  // ─── handle filter application ────────────────────────────────────

  const handleStatusSelect = (status: string) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
    
    // Call API with the selected status and current date filters
    fetchLeadsWithFilters(status === 'all' ? undefined : status, dateFrom, dateTo);
  };

  // ─── status options for dropdown ──────────────────────────────────

  const statusOptions = [
    { value: 'all', label: 'Status *' },
    { value: 'Lead', label: 'Lead' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Unqualified', label: 'Unqualified' },
    { value: 'Converted', label: 'Converted' },
  ];

  // Initial load
  useEffect(() => {
    fetchLeadsWithFilters();
  }, []);

  // ✅ Fetch when filters or pagination changes
  useEffect(() => {
    fetchLeadsWithFilters(
      statusFilter === 'all' ? undefined : statusFilter,
      dateFrom,
      dateTo
    );
  }, [currentPage, itemsPerPage]);

  // ✅ Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ─── Local filtering for search (client-side search only) ────────────

  const filteredData = leads.filter((item) => {
    const matchesSearch =
      item.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // ✅ Pagination calculations - SERVER SIDE
  const totalFilteredItems = totalItems;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  
  if (validCurrentPage !== currentPage && currentPage > 0) {
    setCurrentPage(validCurrentPage);
  }

  const getStartIndex = () => {
    if (totalFilteredItems === 0) return 0;
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    if (totalFilteredItems === 0) return 0;
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
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

  const handleDelete = (item: LeadDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    setDeleting(true);
    setError(null);

    try {
      const deleteUrl = `/lead/${selectedItem.recordId}`;
      console.log(`Attempting to delete lead with ID: ${selectedItem.recordId}`);
      console.log(`DELETE URL: ${deleteUrl}`);
      
      const response = await api.delete(deleteUrl);
      console.log("Delete response:", response);

      if (response.data && response.data.success === 1) {
        setShowDeleteConfirm(false);
        setSelectedItem(null);
        toast.success(response.data.message || "Lead deleted successfully!");
        await fetchLeadsWithFilters(
          statusFilter === 'all' ? undefined : statusFilter,
          dateFrom,
          dateTo
        );
      } else {
        const errorMsg = response.data?.message || "Failed to delete lead";
        console.error("Delete failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error("Error deleting lead:", err);
      
      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        console.error("Error response headers:", err.response.headers);
        
        const errorMsg = err.response.data?.message || `Server error: ${err.response.status}`;
        toast.error(errorMsg);
        setError(errorMsg);
      } else if (err.request) {
        console.error("No response received:", err.request);
        const errorMsg = "No response from server. Please check your connection and CORS settings.";
        toast.error(errorMsg);
        setError(errorMsg);
      } else {
        console.error("Request setup error:", err.message);
        const errorMsg = "Failed to send delete request. Please try again.";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } finally {
      setDeleting(false);
    }
  };

  const findRawById = (id: string) => rawLeads.find((l) => String(l.name ?? l.id) === id);

  const goToLead = (item: LeadDisplay) => {
    const raw = findRawById(item.id);
    navigate(`/leads/${encodeURIComponent(item.id)}`, { state: { lead: raw } });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom(null);
    setDateTo(null);
    setTempDateFrom(null);
    setTempDateTo(null);
    setCurrentPage(1);
    fetchLeadsWithFilters();
  };

  // Get current status label
  const getCurrentStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === statusFilter);
    return option ? option.label : 'Status *';
  };

  return (
    <div className={`jc-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="jc-filter-bar">
        <div className="jc-filter-left">
          <div className="jc-search-wrapper">
            <FaSearch className="jc-search-icon" />
            <input
              type="text"
              placeholder="Search leads by name, organization, email, or ID..."
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
          {/* Custom Status Dropdown with Filter Button */}
          <div className="jc-status-dropdown-wrapper">
            <button 
              className={`jc-filter-btn ${statusFilter !== 'all' ? 'jc-filter-active' : ''}`}
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <FaFilter size={12} />
              {getCurrentStatusLabel()}
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none"
                style={{ marginLeft: '4px' }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {showStatusDropdown && (
              <div className="jc-status-dropdown-menu">
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`jc-status-dropdown-item ${statusFilter === option.value ? 'jc-status-dropdown-item-active' : ''}`}
                    onClick={() => handleStatusSelect(option.value)}
                  >
                    <span>{option.label}</span>
                    {statusFilter === option.value && (
                      <span className="jc-status-dropdown-check">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Filter (From - To) */}
          <div className="jc-date-filter-wrapper" ref={dateFilterWrapperRef}>
            <button
              className={`jc-date-filter-btn ${dateFrom && dateTo ? "jc-filter-active" : ""}`}
              onClick={openDateFilter}
            >
              <FaCalendarAlt size={12} />
              <span>{dateFilterButtonLabel}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "4px" }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showDateFilter && (
              <div className="jc-date-filter-popup">
                <div className="jc-date-filter-popup-header">
                  <span>Filter by Date</span>
                  <button className="jc-date-filter-popup-close" onClick={() => setShowDateFilter(false)}>
                    <FaTimes size={14} />
                  </button>
                </div>

                <div className="jc-date-filter-inputs">
                  <input
                    type="text"
                    readOnly
                    placeholder="From"
                    className="jc-date-filter-input"
                    value={tempDateFrom ? formatDisplayDate(tempDateFrom) : ""}
                  />
                  <input
                    type="text"
                    readOnly
                    placeholder="To"
                    className="jc-date-filter-input"
                    value={tempDateTo ? formatDisplayDate(tempDateTo) : ""}
                  />
                </div>

                <div className="jc-date-filter-quick-row">
                  <button className="jc-quick-filter-btn" onClick={() => applyQuickFilter("today")}>
                    Today
                  </button>
                  <button className="jc-quick-filter-btn" onClick={() => applyQuickFilter("last7")}>
                    Last 7 Days
                  </button>
                  <button className="jc-quick-filter-btn" onClick={() => applyQuickFilter("last30")}>
                    Last 30 Days
                  </button>
                </div>
                <div className="jc-date-filter-quick-row">
                  <button className="jc-quick-filter-btn" onClick={() => applyQuickFilter("thisMonth")}>
                    This Month
                  </button>
                </div>

                <div className="jc-calendar">
                  <div className="jc-calendar-header">
                    <button className="jc-calendar-nav-btn" onClick={goToPrevMonth}>
                      <FaChevronLeft size={12} />
                    </button>
                    <span className="jc-calendar-month-label">
                      {MONTH_LABELS[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                    </span>
                    <button className="jc-calendar-nav-btn" onClick={goToNextMonth}>
                      <FaChevronRight size={12} />
                    </button>
                  </div>

                  <div className="jc-calendar-weekdays">
                    {WEEKDAY_LABELS.map((wd) => (
                      <span key={wd} className="jc-calendar-weekday">{wd}</span>
                    ))}
                  </div>

                  <div className="jc-calendar-grid">
                    {calendarCells.map((day, idx) => {
                      if (!day) return <span key={`blank-${idx}`} className="jc-calendar-cell jc-calendar-cell-empty" />;

                      const isStart = isSameDay(day, tempDateFrom);
                      const isEnd = isSameDay(day, tempDateTo);
                      const inRange =
                        tempDateFrom && tempDateTo && day > tempDateFrom && day < tempDateTo;

                      return (
                        <button
                          key={day.toISOString()}
                          className={[
                            "jc-calendar-cell",
                            isStart || isEnd ? "jc-calendar-cell-selected" : "",
                            inRange ? "jc-calendar-cell-inrange" : "",
                          ].filter(Boolean).join(" ")}
                          onClick={() => handleCalendarDayClick(day)}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="jc-date-filter-footer">
                  <button className="jc-btn-cancel" onClick={clearDateFilter}>
                    Clear
                  </button>
                  <button className="jc-btn-primary" onClick={applyDateFilter}>
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          
          <button className="jc-btn-primary" onClick={() => navigate("/leads/new")}>
            <FaPlus size={12} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== "all" || (dateFrom && dateTo)) && (
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
              <strong>Status:</strong> {getCurrentStatusLabel()}
            </span>
          )}
          {dateFrom && dateTo && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>From:</strong> {formatDisplayDate(dateFrom)}{" "}
              <strong>To:</strong> {formatDisplayDate(dateTo)}
              <button
                onClick={clearDateFilterBadge}
                style={{ marginLeft: 6, background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                title="Clear date filter"
              >
                <FaTimes size={10} />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="jc-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="jc-loading">
          <p>Loading leads...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="jc-error">
          <p>{error}</p>
          <button onClick={() => fetchLeadsWithFilters(
            statusFilter === 'all' ? undefined : statusFilter,
            dateFrom,
            dateTo
          )} className="jc-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="jc-table-wrap">
            <table className="jc-table">
              <thead>
                <tr>
                  <th className="jc-th">Lead ID</th>
                  <th className="jc-th">Name</th>
                  <th className="jc-th">Organization</th>
                  <th className="jc-th">Email</th>
                  <th className="jc-th">Mobile No</th>
                  <th className="jc-th">Status</th>
                  <th className="jc-th jc-th-meta">
                    <span className="jc-count-label">{leads.length} of {totalItems}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="jc-empty-state">
                      <div className="jc-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <p>No leads found</p>
                        <span>Try adjusting your search criteria, or add a new lead</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((row) => (
                    <tr
                      key={row.id}
                      className={`jc-tr ${selected.has(row.id) ? "jc-tr-selected" : ""}`}
                      onClick={() => goToLead(row)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="jc-td jc-td-id">{row.id}</td>
                      <td className="jc-td jc-td-link">{row.leadName}</td>
                      <td className="jc-td jc-td-company">
                        <FaBuilding size={10} className="jc-company-icon" />
                        {row.organizationName || "—"}
                      </td>
                      <td className="jc-td">{row.email || "—"}</td>
                      <td className="jc-td">{row.mobileNo || "—"}</td>
                      <td className="jc-td">
                        <span className={`jc-status-badge ${STATUS_CLASS[row.status]}`}>
                          {STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td className="jc-td jc-td-meta" onClick={(e) => e.stopPropagation()}>
                        <div className="jc-action-buttons">
                          <button className="jc-action-btn jc-action-view" onClick={(e) => { e.stopPropagation(); goToLead(row); }} title="View">
                            <FaEye size={12} />
                          </button>
                          <button className="jc-action-btn jc-action-edit" onClick={(e) => { e.stopPropagation(); goToLead(row); }} title="Edit">
                            <FaEdit size={12} />
                          </button>
                          <button className="jc-action-btn jc-action-delete" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} title="Delete">
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
          <div className="jc-pagination">
            <div className="jc-pagination-left">
              <span className="jc-pagination-label">Show:</span>
              <select value={itemsPerPage} onChange={(e) => handlePageSizeChange(Number(e.target.value))} className="jc-page-size-select">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="jc-pagination-info">
                {totalItems > 0
                  ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
                  : "No entries to show"}
              </span>
            </div>
            <div className="jc-pagination-center">
              <button onClick={goToFirstPage} disabled={currentPage === 1 || totalItems === 0} className="jc-page-btn">
                <FaAngleDoubleLeft size={12} />
              </button>
              <button onClick={goToPrevPage} disabled={currentPage === 1 || totalItems === 0} className="jc-page-btn">
                <FaChevronLeft size={12} />
              </button>
              {totalItems > 0 && getPageNumbers().map((page) => (
                <button key={page} onClick={() => goToPage(page)} className={`jc-page-btn ${currentPage === page ? "jc-page-btn-active" : ""}`}>
                  {page}
                </button>
              ))}
              <button onClick={goToNextPage} disabled={currentPage === totalPages || totalItems === 0} className="jc-page-btn">
                <FaChevronRight size={12} />
              </button>
              <button onClick={goToLastPage} disabled={currentPage === totalPages || totalItems === 0} className="jc-page-btn">
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="jc-pagination-right">
              <span className="jc-pagination-info">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="jc-modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="jc-modal jc-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="jc-modal-header">
              <span className="jc-modal-title">Confirm Delete</span>
              <button className="jc-modal-close" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="jc-modal-body">
              <p>Are you sure you want to delete this lead?</p>
              <p className="jc-modal-item-name"><strong>{selectedItem.leadName}</strong> - {selectedItem.organizationName || "—"}</p>
              <p className="jc-modal-warning">This action cannot be undone.</p>
              {deleting && (
                <div className="jc-deleting-indicator">
                  <span>Deleting...</span>
                </div>
              )}
            </div>
            <div className="jc-modal-footer">
              <button className="jc-btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="jc-btn-delete" onClick={confirmDelete} disabled={deleting}>
                <FaTrash size={12} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}