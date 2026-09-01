// Stockentry.tsx
import { useState, useEffect, type JSX } from "react";
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
  FaBuilding,
  FaBoxes,
  FaWarehouse,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaArrowRight,
  FaArrowLeft as FaArrowLeftIcon,
  FaExchangeAlt,
  FaIndustry,
  FaTruck,
  FaExclamationCircle,
  FaDollarSign,
} from "react-icons/fa";
import "./Stockentry.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";
import { FaSpinner } from "react-icons/fa6";

type EntryType =
  | "Disassemble"
  | "Manufacture"
  | "Material Consumption for Manufacture"
  | "Material Issue"
  | "Material Receipt"
  | "Material Transfer"
  | "Material Transfer for Manufacture"
  | "Receive from Customer"
  | "Repack"
  | "Send to Subcontractor";

interface StockEntry {
  id: number;
  name: string;
  stock_entry_type: EntryType;
  from_warehouse: string;
  to_warehouse: string;
  company: string;
  posting_date: string;
  work_order: string;
  supplier: string;
  total_amount: number;
  total_outgoing_value: number;
  total_incoming_value: number;
  total_additional_costs: number;
  remarks: string;
  created_by: string;
  status: string;
  docstatus: number;
  fg_completed_qty: number;
  purpose: string;
  item_name?: string;
}

interface StockEntryDisplay {
  id: string;
  name: string;
  entryType: EntryType;
  sourceWarehouse: string;
  targetWarehouse: string;
  company: string;
  postingDate: string;
  createdAgo: string;
  workOrder: string;
  supplier: string;
  totalAmount: number;
  remarks: string;
  docstatus: number;
  status: string;
  qty: number;
  itemName: string;
  displayPostingDate?: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: StockEntry[];
  };
}

const TYPE_CLASS: Record<EntryType, string> = {
  Disassemble: "s-stopped",
  Manufacture: "s-inprocess",
  "Material Consumption for Manufacture": "s-notstarted",
  "Material Issue": "s-draft",
  "Material Receipt": "s-completed",
  "Material Transfer": "s-open",
  "Material Transfer for Manufacture": "s-onhold",
  "Receive from Customer": "s-completed",
  Repack: "s-cancelled",
  "Send to Subcontractor": "s-inprocess",
};

const TYPE_ICONS: Record<EntryType, JSX.Element> = {
  Disassemble: <FaExchangeAlt />,
  Manufacture: <FaIndustry />,
  "Material Consumption for Manufacture": <FaBoxes />,
  "Material Issue": <FaArrowRight />,
  "Material Receipt": <FaArrowLeftIcon />,
  "Material Transfer": <FaTruck />,
  "Material Transfer for Manufacture": <FaTruck />,
  "Receive from Customer": <FaUser />,
  Repack: <FaBoxes />,
  "Send to Subcontractor": <FaBuilding />,
};

const ENTRY_TYPES: EntryType[] = [
  "Disassemble",
  "Manufacture",
  "Material Consumption for Manufacture",
  "Material Issue",
  "Material Receipt",
  "Material Transfer",
  "Material Transfer for Manufacture",
  "Receive from Customer",
  "Repack",
  "Send to Subcontractor",
];

export default function Stockentry() {
  const navigate = useNavigate();
  
  const { theme, formatDate, getApiDateFormat } = useAdminTheme();

  const [stockEntries, setStockEntries] = useState<StockEntryDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [, setTotalItems] = useState(0);
  const [, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockEntryDisplay | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  // ─── Date Filter States ────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const formatDateAgo = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
      return `${Math.floor(diffDays / 365)}y ago`;
    } catch {
      return dateString;
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  const toApiDateFormat = (date: Date) => {
    return getApiDateFormat(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

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
      fetchStockEntries();
    }
  };

  const handleClearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setShowDatePicker(false);
    fetchStockEntries();
  };

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    setFromDate(from.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  const fetchStockEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
        params.append('search_by', 'all');
      }

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      
      if (fromDate) {
        params.append('date_from', fromDate);
      }
      if (toDate) {
        params.append('date_to', toDate);
      }

      const url = `/stock-entry${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<ApiResponse>(url);

      if (response.data.success === 1 && response.data.data) {
        const { records, total, page, limit } = response.data.data;
        setTotalItems(total ?? 0);
        setTotalPages(Math.ceil((total ?? 0) / (limit || itemsPerPage)));
        setCurrentPage(page ?? 1);

        const transformedData: StockEntryDisplay[] = (records ?? []).map((item: StockEntry) => {
          let itemName = "Unknown Item";
          let qty = item.fg_completed_qty || 0;
          
          if (item.item_name) {
            itemName = item.item_name;
          } else if (item.remarks) {
            const match = item.remarks.match(/[–-]\s*([^-]+)$/);
            if (match) {
              itemName = match[1].trim();
            }
          }
          
          if (itemName === "Unknown Item" && item.stock_entry_type) {
            itemName = item.stock_entry_type;
          }

          return {
            id: item.id.toString(),
            name: item.name,
            entryType: item.stock_entry_type,
            sourceWarehouse: item.from_warehouse,
            targetWarehouse: item.to_warehouse,
            company: item.company,
            postingDate: item.posting_date,
            createdAgo: formatDateAgo(item.posting_date),
            workOrder: item.work_order,
            supplier: item.supplier,
            totalAmount: item.total_amount || item.total_outgoing_value || 0,
            remarks: item.remarks,
            docstatus: item.docstatus,
            status: item.status || (item.docstatus === 1 ? "Submitted" : "Draft"),
            qty: qty,
            itemName: itemName,
            displayPostingDate: item.posting_date ? formatDisplayDate(item.posting_date) : '',
          };
        });

        setStockEntries(transformedData);
      } else {
        setStockEntries([]);
        setError("Failed to fetch stock entries");
      }
    } catch (err) {
      console.error("Error fetching stock entries:", err);
      setError("An error occurred while fetching stock entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockEntries();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchStockEntries();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchStockEntries();
    }
  }, [typeFilter, fromDate, toDate]);

  const filteredData = stockEntries.filter((item) => {
    const matchesType = typeFilter === "all" || item.entryType === typeFilter;
    return matchesType;
  });

  const totalFilteredItems = filteredData.length;
  const filteredTotalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  const validCurrentPage = Math.min(currentPage, filteredTotalPages || 1);

  useEffect(() => {
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
    }
  }, [validCurrentPage, currentPage]);

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= filteredTotalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(filteredTotalPages);
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
    let endPage = Math.min(filteredTotalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleDelete = (item: StockEntryDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        const response = await api.delete(`/stock-entry/${selectedItem.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
          fetchStockEntries();
        }
      } catch (err) {
        console.error("Error deleting stock entry:", err);
        alert("Failed to delete stock entry");
      }
    }
  };

  const handleEdit = (item: StockEntryDisplay) => {
    navigate(`/stock-entry/${encodeURIComponent(item.id)}`);
  };

  const handleView = (item: StockEntryDisplay) => {
    navigate(`/stock-entry/${encodeURIComponent(item.id)}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  const getEntryTypeIcon = (type: EntryType) => {
    return TYPE_ICONS[type] || <FaBoxes />;
  };

  // ─── Card View ──────────────────────────────────────────────────────
  const renderCardView = () => (
    <div className="se-card-grid">
      {paginatedData.map((item) => (
        <div 
          key={item.id} 
          className="se-card"
        >
          <div className="se-card-header">
            <div className="se-card-type">
              <span className={`se-card-icon ${TYPE_CLASS[item.entryType]}`}>
                {getEntryTypeIcon(item.entryType)}
              </span>
              <span className="se-card-type-label">{item.entryType}</span>
            </div>
            <span className={`se-status-badge ${TYPE_CLASS[item.entryType]}`}>
              {item.entryType}
            </span>
          </div>
          
          <div className="se-card-body">
            <div className="se-card-item">
              <div className="se-card-item-name">{item.itemName}</div>
              <div className="se-card-item-qty">
                <span className="qty-label">Qty:</span>
                <span className="qty-value">{item.qty || 0}</span>
              </div>
            </div>
            
            <div className="se-card-warehouse-flow">
              <div className="se-card-warehouse">
                <FaWarehouse className="wh-icon" />
                <span>{item.sourceWarehouse || "—"}</span>
              </div>
              <FaArrowRight className="flow-arrow" />
              <div className="se-card-warehouse">
                <FaWarehouse className="wh-icon" />
                <span>{item.targetWarehouse || "—"}</span>
              </div>
            </div>
            
            <div className="se-card-meta">
              <div className="se-card-meta-item">
                <FaCalendarAlt className="meta-icon" />
                <span>{item.displayPostingDate || new Date(item.postingDate).toLocaleDateString("en-IN", { 
                  day: "2-digit", 
                  month: "short", 
                  year: "numeric" 
                })}</span>
              </div>
              <div className="se-card-meta-item">
                <FaDollarSign className="meta-icon" />
                <span className="amount">{formatCurrency(item.totalAmount)}</span>
              </div>
            </div>
          </div>
          
          <div className="se-card-footer">
            <div className="se-card-actions">
              <button 
                className="se-action-btn se-action-view" 
                onClick={(e) => { e.stopPropagation(); handleView(item); }} 
                title="View"
              >
                <FaEye size={12} />
              </button>
              <button 
                className="se-action-btn se-action-edit" 
                onClick={(e) => { e.stopPropagation(); handleEdit(item); }} 
                title="Edit"
              >
                <FaEdit size={12} />
              </button>
              <button 
                className="se-action-btn se-action-delete" 
                onClick={(e) => { e.stopPropagation(); handleDelete(item); }} 
                title="Delete"
              >
                <FaTrash size={12} />
              </button>
            </div>
            <span className="se-card-time">{item.createdAgo}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`se-page ${theme}`}>
      {/* ─── Search and Filter Bar ─── */}
      <div className="se-filter-bar">
        <div className="se-filter-left">
          <div className="se-search-wrapper">
            <FaSearch className="se-search-icon" />
            <input
              type="text"
              placeholder="Search by item, warehouse, WO, supplier, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="se-search-input"
            />
            {searchTerm && (
              <button className="se-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="se-filter-right">
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)} 
            className="se-filter-select"
          >
            <option value="all">All Types</option>
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* ─── Date Range Picker ─── */}
          <div className="se-date-range-wrapper">
            <button 
              className={`se-date-toggle-btn ${showDatePicker ? 'active' : ''}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Filter by date range"
            >
              <FaCalendarAlt size={14} />
            </button>
            {showDatePicker && (
              <div className="se-date-picker-popup">
                <div className="se-date-picker-header">
                  <span className="se-date-picker-title">Filter by Date</span>
                </div>
                
                {/* Date Range Display */}
                <div className="se-date-range-display">
                  {fromDate && toDate ? (
                    <span>{formatDateDisplay(fromDate)} – {formatDateDisplay(toDate)}</span>
                  ) : (
                    <span className="se-date-range-placeholder">Select date range</span>
                  )}
                </div>

                {/* Quick Filters */}
                <div className="se-quick-filters">
                  <button className="se-quick-filter-btn" onClick={() => setQuickDateRange(0)}>Today</button>
                  <button className="se-quick-filter-btn" onClick={() => setQuickDateRange(7)}>Last 7 Days</button>
                  <button className="se-quick-filter-btn" onClick={() => setQuickDateRange(30)}>Last 30 Days</button>
                  <button className="se-quick-filter-btn" onClick={() => setQuickDateRange(90)}>This Month</button>
                </div>

                {/* Calendar */}
                <div className="se-calendar">
                  <div className="se-calendar-header">
                    <button className="se-calendar-nav" onClick={handlePrevMonth}>
                      <FaChevronLeft size={12} />
                    </button>
                    <span className="se-calendar-month">{getMonthYear(currentMonth)}</span>
                    <button className="se-calendar-nav" onClick={handleNextMonth}>
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                  <div className="se-calendar-weekdays">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>
                  <div className="se-calendar-days">
                    {Array.from({ length: getDaysInMonth(currentMonth).firstDayOfMonth }).map((_, i) => (
                      <span key={`empty-${i}`} className="se-calendar-day-empty"></span>
                    ))}
                    {Array.from({ length: getDaysInMonth(currentMonth).daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isSelected = isDateSelected(day);
                      return (
                        <button
                          key={day}
                          className={`se-calendar-day ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleDateClick(day)}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="se-date-actions">
                  <button 
                    className="se-btn-clear-filter" 
                    onClick={handleClearDateFilter}
                  >
                    Clear
                  </button>
                  <button 
                    className="se-btn-apply-filter" 
                    onClick={handleApplyDateFilter}
                    disabled={!fromDate || !toDate}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="se-view-toggle">
            <button 
              className={`se-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <FaFileAlt size={14} />
            </button>
            <button 
              className={`se-view-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Card View"
            >
              <FaBoxes size={14} />
            </button>
          </div>

         
        </div>
      </div>

      {/* ─── Active filters indicator ─── */}
      {(searchTerm || typeFilter !== "all" || (fromDate && toDate)) && (
        <div className="se-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span style={{ color: "var(--text-primary)" }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {typeFilter !== "all" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Type:</strong> {typeFilter}
            </span>
          )}
          {fromDate && toDate && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Date Range:</strong> {formatDateDisplay(fromDate)} - {formatDateDisplay(toDate)}
            </span>
          )}
          <button onClick={clearFilters} className="se-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* ─── Loading State ─── */}
      {loading && (
        <div className="se-loading">
          <FaSpinner className="spinning" size={32} />
          <p>Loading stock entries...</p>
        </div>
      )}

      {/* ─── Error State ─── */}
      {error && (
        <div className="se-error">
          <FaExclamationCircle size={32} />
          <p>{error}</p>
          <button onClick={fetchStockEntries} className="se-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* ─── Content ─── */}
      {!loading && !error && (
        <>
          {viewMode === "cards" ? (
            renderCardView()
          ) : (
            <div className="se-table-wrap">
              <table className="se-table">
                <thead>
                  <tr>
                    <th className="se-th">Item / Product</th>
                    <th className="se-th">Type</th>
                    <th className="se-th">Source → Target</th>
                    <th className="se-th">Qty</th>
                    <th className="se-th">Amount</th>
                    <th className="se-th">Posting Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="se-empty-state">
                        <div className="se-empty-content">
                          <FaBoxes size={48} style={{ color: "var(--text-secondary)" }} />
                          <p>No stock entries found</p>
                          <span>Try adjusting your search criteria</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row) => (
                      <tr
                        key={row.id}
                        className="se-tr"
                        style={{ cursor: "pointer" }}
                      >
                        <td className="se-td se-td-item">
                          <div className="se-item-info">
                            <span className="se-item-name">{row.itemName}</span>
                            <span className="se-item-code">{row.name}</span>
                          </div>
                        </td>
                        <td className="se-td">
                          <span className={`se-status-badge ${TYPE_CLASS[row.entryType]}`}>
                            {getEntryTypeIcon(row.entryType)}
                            {row.entryType}
                          </span>
                        </td>
                        <td className="se-td se-td-warehouses">
                          <div className="se-warehouse-flow">
                            <span className="se-warehouse-label">{row.sourceWarehouse || "—"}</span>
                            <FaArrowRight className="flow-arrow-sm" />
                            <span className="se-warehouse-label">{row.targetWarehouse || "—"}</span>
                          </div>
                        </td>
                        <td className="se-td se-td-qty">
                          <span className="se-qty">{row.qty || 0}</span>
                        </td>
                        <td className="se-td se-td-amount">
                          <span className="se-amount">{formatCurrency(row.totalAmount)}</span>
                        </td>
                        <td className="se-td se-td-dates">
                          <div className="se-date-info">
                            <FaCalendarAlt size={10} className="se-date-icon" />
                            {row.displayPostingDate || 
                              (row.postingDate
                                ? new Date(row.postingDate).toLocaleDateString("en-IN", { 
                                    day: "2-digit", 
                                    month: "short", 
                                    year: "numeric" 
                                  })
                                : "—")}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Pagination ─── */}
          {totalFilteredItems > 0 && (
            <div className="se-pagination">
              <div className="se-pagination-left">
                <span className="se-pagination-label">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))} 
                  className="se-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="se-pagination-label">entries</span>
              </div>
              <div className="se-pagination-center">
                <button onClick={goToFirstPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="se-page-btn">
                  <FaAngleDoubleLeft size={12} />
                </button>
                <button onClick={goToPrevPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="se-page-btn">
                  <FaChevronLeft size={12} />
                </button>
                {getPageNumbers().map((page) => (
                  <button 
                    key={page} 
                    onClick={() => goToPage(page)} 
                    className={`se-page-btn ${currentPage === page ? "se-page-btn-active" : ""}`}
                  >
                    {page}
                  </button>
                ))}
                <button onClick={goToNextPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="se-page-btn">
                  <FaChevronRight size={12} />
                </button>
                <button onClick={goToLastPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="se-page-btn">
                  <FaAngleDoubleRight size={12} />
                </button>
              </div>
              <div className="se-pagination-right">
                <span className="se-pagination-info">
                  {totalFilteredItems > 0
                    ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                    : "No entries to show"}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {showDeleteConfirm && selectedItem && (
        <div className="se-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="se-modal se-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="se-modal-header">
              <span className="se-modal-title">Confirm Delete</span>
              <button className="se-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="se-modal-body">
              <p>Are you sure you want to delete this stock entry?</p>
              <div className="se-modal-item-details">
                <p><strong>Entry:</strong> {selectedItem.name}</p>
                <p><strong>Item:</strong> {selectedItem.itemName}</p>
                <p><strong>Type:</strong> {selectedItem.entryType}</p>
                <p><strong>Qty:</strong> {selectedItem.qty}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem.totalAmount)}</p>
              </div>
              <p className="se-modal-warning">⚠️ This action cannot be undone.</p>
            </div>
            <div className="se-modal-footer">
              <button className="se-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="se-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}