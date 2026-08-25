import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSpinner,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaFileExcel,
} from 'react-icons/fa';
import "./ItemList.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  is_fixed_asset: number;
  is_sales_item: number;
  is_purchase_item: number;
  disabled: number;
  description: string;
  brand: string | null;
  valuation_method: string;
  creation: string;
  modified: string;
}

interface ApiResponse {
  success: number;
  data:
    | Item[]
    | {
        total: number;
        page: number;
        limit: number;
        records: Item[];
      };
}

export default function ItemList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [allItems, setAllItems] = useState<Item[]>([]);

  // ===== DATE FILTER STATES =====
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [tempFromDate, setTempFromDate] = useState<string>('');
  const [tempToDate, setTempToDate] = useState<string>('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>('');

  // ===== CALENDAR STATE =====
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // ===== DATE HELPER FUNCTIONS =====
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const getFirstDayOfMonth = (): string => {
    const date = new Date(currentYear, currentMonth, 1);
    return date.toISOString().split('T')[0];
  };

  const getLastDayOfMonth = (): string => {
    const date = new Date(currentYear, currentMonth + 1, 0);
    return date.toISOString().split('T')[0];
  };

  // ===== QUICK FILTER HANDLERS =====
  const applyQuickFilter = (filter: string) => {
    setSelectedQuickFilter(filter);
    let start = '';
    let end = getTodayDate();

    switch (filter) {
      case 'today':
        start = getTodayDate();
        break;
      case 'last7':
        start = getDateDaysAgo(7);
        break;
      case 'last30':
        start = getDateDaysAgo(30);
        break;
      case 'thisMonth':
        start = getFirstDayOfMonth();
        end = getLastDayOfMonth();
        break;
      default:
        return;
    }

    setTempFromDate(start);
    setTempToDate(end);
  };

  // ===== CALENDAR FUNCTIONS =====
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonthIndex = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = (): (number | null)[] => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonthIndex(currentYear, currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateInRange = (day: number): boolean => {
    if (!tempFromDate && !tempToDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (tempFromDate && tempToDate) {
      return dateStr >= tempFromDate && dateStr <= tempToDate;
    }
    if (tempFromDate) {
      return dateStr >= tempFromDate;
    }
    if (tempToDate) {
      return dateStr <= tempToDate;
    }
    return false;
  };

  const isDateSelected = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === tempFromDate || dateStr === tempToDate;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!tempFromDate || (tempFromDate && tempToDate)) {
      setTempFromDate(dateStr);
      setTempToDate('');
      setSelectedQuickFilter('');
    } else if (tempFromDate && !tempToDate) {
      if (dateStr < tempFromDate) {
        setTempFromDate(dateStr);
        setTempToDate('');
      } else {
        setTempToDate(dateStr);
        setSelectedQuickFilter('');
      }
    }
  };

  const changeMonth = (delta: number) => {
    const newMonth = currentMonth + delta;
    if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  const getMonthName = (month: number): string => {
    return new Date(currentYear, month).toLocaleString('en-US', { month: 'long' });
  };

  // ===== DATE PICKER HANDLERS =====
  const openDatePicker = () => {
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setShowDatePicker(true);
  };

  const applyDateFilter = () => {
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setShowDatePicker(false);
    setCurrentPage(1);
    // API call will be triggered by useEffect when fromDate or toDate changes
    if (tempFromDate || tempToDate) {
      // toast will be handled by the component
    }
  };

  const clearDateFilters = () => {
    setTempFromDate('');
    setTempToDate('');
    setSelectedQuickFilter('');
    setFromDate('');
    setToDate('');
    setShowDatePicker(false);
  };

  // ===== CLOSE DATE PICKER ON OUTSIDE CLICK =====
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const datePickerContainer = document.querySelector('.itl-date-picker-container');
      if (datePickerContainer && !datePickerContainer.contains(target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch items from API with pagination
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter === 'enabled' ? '1' : '0');
      }
      if (groupFilter !== 'all') {
        params.append('group', groupFilter);
      }
      // Add date filters
      if (fromDate) {
        params.append('from_date', fromDate);
      }
      if (toDate) {
        params.append('to_date', toDate);
      }

      const response = await api.get<ApiResponse>(`/item?${params.toString()}`);
      console.log('API RESPONSE for page', currentPage, ':', response.data);

      if (response.data.success === 1) {
        const raw = response.data.data;

        if (Array.isArray(raw)) {
          setItems(raw);
          setAllItems(raw);

          const isFullPage = raw.length === itemsPerPage;
          const estimatedTotal = isFullPage
            ? currentPage * itemsPerPage + 1
            : (currentPage - 1) * itemsPerPage + raw.length;

          setTotalItems(estimatedTotal);
        } else if (raw && typeof raw === 'object') {
          const records = raw.records || [];
          setItems(records);
          setTotalItems(raw.total || records.length || 0);
          setAllItems(records);
        } else {
          setItems([]);
          setTotalItems(0);
          setAllItems([]);
        }
      } else {
        setError('Failed to fetch items');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('An error occurred while fetching items');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, groupFilter, fromDate, toDate]);

  // Delete item
  const handleDeleteItem = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await api.delete(`/item/${id}`);
      if (response.data.success === 1) {
        fetchItems();
        console.log('Item deleted successfully');
      } else {
        setError('Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('An error occurred while deleting the item');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle edit
  const handleEditItem = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/item/${item.id}`, {
      state: { itemData: item, editMode: true }
    });
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, groupFilter, fromDate, toDate]);

  // Get unique item groups for filter
  const itemGroups = Array.from(new Set(allItems.map(item => item.item_group))).filter(Boolean);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalItems);

  // Pagination navigation functions with wrap-around
  const goToPage = (page: number) => {
    if (page < 1) {
      page = totalPages;
    } else if (page > totalPages) {
      page = 1;
    }

    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => {
    if (totalPages > 0) {
      setCurrentPage(1);
    }
  };

  const goToLastPage = () => {
    if (totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  const goToNextPage = () => {
    console.log('goToNextPage clicked ->', { validCurrentPage, totalPages, totalItems, currentPage, itemsPerPage });
    if (validCurrentPage < totalPages) {
      setCurrentPage(validCurrentPage + 1);
    } else {
      setCurrentPage(1);
    }
  };

  const goToPrevPage = () => {
    if (validCurrentPage > 1) {
      setCurrentPage(validCurrentPage - 1);
    } else {
      setCurrentPage(totalPages);
    }
  };

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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setGroupFilter('all');
    setFromDate('');
    setToDate('');
    setTempFromDate('');
    setTempToDate('');
    setSelectedQuickFilter('');
    setShowDatePicker(false);
  };

  const handleRowClick = (item: Item) => {
    navigate(`/item/${item.id}`, {
      state: { itemData: item }
    });
  };

  const handleAddItem = () => {
    navigate("/item/new");
  };

  const handleBulkUpload = () => {
    navigate("/item-bulk-upload");
  };

  return (
    <div className={`itl-page ${theme}`}>
      <style>{`
        /* ── Date Range Picker Styles ── */
        .itl-date-picker-container {
          position: relative;
          display: inline-block;
        }

        .itl-date-picker-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          padding: 7px 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          min-height: 38px;
        }

        .itl-date-picker-trigger:hover {
          border-color: var(--primary-color, #2563eb);
          background: var(--hover-bg, #f8fafc);
        }

        .itl-date-picker-trigger.active {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .itl-date-picker-trigger .itl-calendar-icon {
          color: var(--primary-color, #2563eb);
          font-size: 16px;
        }

        .itl-date-picker-trigger .itl-date-label {
          font-weight: 500;
        }

        .itl-date-picker-trigger .itl-date-label.placeholder {
          color: var(--text-secondary, #6b7280);
          font-weight: 400;
        }

        .itl-date-picker-trigger .itl-date-range-display {
          color: var(--primary-color, #2563eb);
          font-weight: 500;
        }

        .itl-date-picker-popup {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          box-shadow: 0 10px 40px var(--shadow-color, rgba(0,0,0,0.15));
          padding: 20px;
          z-index: 1000;
          min-width: 340px;
          width: 340px;
        }

        .itl-date-picker-popup .itl-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .itl-date-picker-popup .itl-popup-header .itl-popup-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .itl-date-picker-popup .itl-popup-header .itl-popup-close {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
        }

        .itl-date-picker-popup .itl-popup-header .itl-popup-close:hover {
          color: var(--text-primary, #1e293b);
        }

        .itl-date-picker-popup .itl-quick-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .itl-date-picker-popup .itl-quick-filter-btn {
          padding: 4px 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          background: var(--card-bg, #fff);
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .itl-date-picker-popup .itl-quick-filter-btn:hover {
          border-color: var(--primary-color, #2563eb);
          color: var(--primary-color, #2563eb);
        }

        .itl-date-picker-popup .itl-quick-filter-btn.active {
          background: var(--primary-color, #2563eb);
          border-color: var(--primary-color, #2563eb);
          color: #fff;
        }

        .itl-date-picker-popup .itl-calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .itl-date-picker-popup .itl-calendar-header .itl-month-year {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .itl-date-picker-popup .itl-calendar-header .itl-nav-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          padding: 4px 8px;
          font-size: 14px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .itl-date-picker-popup .itl-calendar-header .itl-nav-btn:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .itl-date-picker-popup .itl-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 12px;
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-header {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          padding: 4px 0;
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell {
          text-align: center;
          padding: 6px 4px;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary, #1e293b);
          position: relative;
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell.empty {
          cursor: default;
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell:hover:not(.empty):not(.in-range) {
          background: var(--hover-bg, #f3f4f6);
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell.in-range {
          background: rgba(37, 99, 235, 0.1);
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell.selected {
          background: var(--primary-color, #2563eb);
          color: #fff;
          font-weight: 600;
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell.selected-start {
          background: var(--primary-color, #2563eb);
          color: #fff;
          font-weight: 600;
          border-radius: 6px 0 0 6px;
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell.selected-end {
          background: var(--primary-color, #2563eb);
          color: #fff;
          font-weight: 600;
          border-radius: 0 6px 6px 0;
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell.range-middle {
          background: rgba(37, 99, 235, 0.15);
        }

        .itl-date-picker-popup .itl-calendar-grid .itl-day-cell.today {
          border: 1px solid var(--primary-color, #2563eb);
        }

        .itl-date-picker-popup .itl-popup-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .itl-date-picker-popup .itl-popup-actions button {
          padding: 6px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .itl-date-picker-popup .itl-popup-actions .itl-btn-apply {
          background: var(--primary-color, #2563eb);
          color: #fff;
        }

        .itl-date-picker-popup .itl-popup-actions .itl-btn-apply:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .itl-date-picker-popup .itl-popup-actions .itl-btn-clear {
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .itl-date-picker-popup .itl-popup-actions .itl-btn-clear:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .itl-date-picker-popup .itl-popup-actions .itl-btn-cancel {
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .itl-date-picker-popup .itl-popup-actions .itl-btn-cancel:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .itl-filter-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Dark theme overrides */
        .dark-theme .itl-date-picker-trigger {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-date-picker-trigger:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .itl-date-picker-popup {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .itl-date-picker-popup .itl-popup-title {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-date-picker-popup .itl-quick-filter-btn {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .itl-date-picker-popup .itl-quick-filter-btn.active {
          background: var(--primary-color, #3b82f6);
          color: #fff;
        }

        .dark-theme .itl-date-picker-popup .itl-calendar-grid .itl-day-cell {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-date-picker-popup .itl-day-header {
          color: var(--text-secondary, #94a3b8);
        }

        @media (max-width: 768px) {
          .itl-date-picker-popup {
            left: 0;
            min-width: 100%;
            width: 100%;
          }
        }
      `}</style>

      {/* Search and Filter Bar */}
      <div className="itl-filter-bar">
        <div className="itl-filter-left">
          <div className="itl-search-wrapper">
            <FaSearch className="itl-search-icon" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="itl-search-input"
            />
            {searchTerm && (
              <button className="itl-search-clear" onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="itl-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="itl-filter-select"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="itl-filter-select"
          >
            <option value="all">All Groups</option>
            {itemGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          {/* ===== DATE RANGE PICKER ===== */}
          <div className="itl-date-picker-container">
            <div 
              className={`itl-date-picker-trigger ${showDatePicker ? 'active' : ''}`}
              onClick={openDatePicker}
            >
              <FaCalendarAlt className="itl-calendar-icon" />
              <span className={`itl-date-label ${!fromDate && !toDate ? 'placeholder' : ''}`}>
                {fromDate || toDate ? (
                  <span className="itl-date-range-display">
                    {fromDate ? formatDateForDisplay(fromDate) : 'Start'} – {toDate ? formatDateForDisplay(toDate) : 'End'}
                  </span>
                ) : (
                  'Filter by Date'
                )}
              </span>
            </div>
            
            {showDatePicker && (
              <div className="itl-date-picker-popup">
                <div className="itl-popup-header">
                  <span className="itl-popup-title">Filter by Date</span>
                  <button className="itl-popup-close" onClick={() => setShowDatePicker(false)}>
                    <FaTimes size={14} />
                  </button>
                </div>
                
                {/* Quick Filters */}
                <div className="itl-quick-filters">
                  <button 
                    className={`itl-quick-filter-btn ${selectedQuickFilter === 'today' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('today')}
                  >
                    Today
                  </button>
                  <button 
                    className={`itl-quick-filter-btn ${selectedQuickFilter === 'last7' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('last7')}
                  >
                    Last 7 Days
                  </button>
                  <button 
                    className={`itl-quick-filter-btn ${selectedQuickFilter === 'last30' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('last30')}
                  >
                    Last 30 Days
                  </button>
                  <button 
                    className={`itl-quick-filter-btn ${selectedQuickFilter === 'thisMonth' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('thisMonth')}
                  >
                    This Month
                  </button>
                </div>
                
                {/* Calendar */}
                <div className="itl-calendar-header">
                  <button className="itl-nav-btn" onClick={() => changeMonth(-1)}>
                    <FaChevronLeft size={12} />
                  </button>
                  <span className="itl-month-year">
                    {getMonthName(currentMonth)} {currentYear}
                  </span>
                  <button className="itl-nav-btn" onClick={() => changeMonth(1)}>
                    <FaChevronRight size={12} />
                  </button>
                </div>
                
                <div className="itl-calendar-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="itl-day-header">{day}</div>
                  ))}
                  {generateCalendarDays().map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="itl-day-cell empty"></div>;
                    }
                    
                    const dateObj = new Date(currentYear, currentMonth, day);
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const isToday = dateStr === getTodayDate();
                    const isInRange = isDateInRange(day);
                    const isSelected = isDateSelected(day);
                    const isStart = dateStr === tempFromDate;
                    const isEnd = dateStr === tempToDate;
                    
                    let className = 'itl-day-cell';
                    if (isToday) className += ' today';
                    if (isInRange && !isSelected) className += ' in-range';
                    if (isSelected) className += ' selected';
                    if (isStart && tempToDate) className += ' selected-start';
                    if (isEnd && tempFromDate) className += ' selected-end';
                    if (isInRange && !isSelected && !isStart && !isEnd) className += ' range-middle';
                    
                    return (
                      <div 
                        key={day} 
                        className={className}
                        onClick={() => handleDateClick(day)}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                
                <div className="itl-popup-actions">
                  <button className="itl-btn-clear" onClick={clearDateFilters}>
                    Clear
                  </button>
                  <button className="itl-btn-cancel" onClick={() => setShowDatePicker(false)}>
                    Cancel
                  </button>
                  <button className="itl-btn-apply" onClick={applyDateFilter}>
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="itl-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="itl-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="itl-btn-secondary" onClick={handleBulkUpload}>
            <FaFileExcel size={13} />
            Bulk Upload
          </button>
          <button className="itl-btn-primary" onClick={handleAddItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all' || groupFilter !== 'all' || fromDate || toDate) && (
        <div className="itl-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {statusFilter}
            </span>
          )}
          {groupFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Group:</strong> {groupFilter}
            </span>
          )}
          {(fromDate || toDate) && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Date:</strong> {fromDate ? formatDateForDisplay(fromDate) : 'Any'} – {toDate ? formatDateForDisplay(toDate) : 'Any'}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="itl-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="itl-loading">
          <FaSpinner className="spinning" size={24} />
          <p>Loading items...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="itl-error">
          <p>{error}</p>
          <button onClick={fetchItems} className="itl-retry-btn">Retry</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="itl-table-wrap">
            <table className="itl-table">
              <thead>
                <tr>
                  <th className="itl-th">Item Code</th>
                  <th className="itl-th">Item Name</th>
                  <th className="itl-th">Status</th>
                  <th className="itl-th">Item Group</th>
                  <th className="itl-th">UOM</th>
                  <th className="itl-th">Type</th>
                  <th className="itl-th itl-th-meta">
                    <span className="itl-count-label">
                      {totalItems > 0
                        ? `${getStartIndex()}–${getEndIndex()}`
                        : '0'} of {totalItems}
                    </span>
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="itl-empty-state">
                      <div className="itl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No items found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr
                      key={row.id}
                      className="itl-tr"
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="itl-td itl-td-code">{row.item_code}</td>
                      <td className="itl-td itl-td-name">{row.item_name}</td>
                      <td className="itl-td">
                        <span className={`itl-status-badge itl-status-${row.disabled === 0 ? 'enabled' : 'disabled'}`}>
                          {row.disabled === 0 ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="itl-td">{row.item_group}</td>
                      <td className="itl-td">{row.stock_uom}</td>
                      <td className="itl-td">
                        {row.is_stock_item === 1 ? 'Stock' : 'Non-Stock'}
                      </td>
                      <td className="itl-td itl-td-meta">
                        <div className="itl-action-buttons" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="itl-action-btn itl-edit-btn"
                            onClick={(e) => handleEditItem(row, e)}
                            title="Edit item"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            className="itl-action-btn itl-delete-btn"
                            onClick={(e) => handleDeleteItem(row.id, e)}
                            disabled={deletingId === row.id}
                            title="Delete item"
                          >
                            {deletingId === row.id ? (
                              <FaSpinner className="spinning" size={14} />
                            ) : (
                              <FaTrash size={14} />
                            )}
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
          {(totalItems > 0 || items.length > 0) && (
            <div className="itl-pagination">
              <div className="itl-pagination-left">
                <span className="itl-pagination-label">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="itl-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="itl-pagination-label">entries</span>
              </div>
              <div className="itl-pagination-center">
                <button
                  onClick={goToFirstPage}
                  disabled={validCurrentPage === 1 || totalPages === 0}
                  className="itl-page-btn"
                >
                  <FaAngleDoubleLeft size={12} />
                </button>
                <button
                  onClick={goToPrevPage}
                  disabled={totalPages === 0}
                  className="itl-page-btn"
                >
                  <FaChevronLeft size={12} />
                </button>
                {totalPages > 0 && getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`itl-page-btn ${validCurrentPage === page ? 'itl-page-btn-active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={goToNextPage}
                  disabled={totalPages === 0}
                  className="itl-page-btn"
                >
                  <FaChevronRight size={12} />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={validCurrentPage === totalPages || totalPages === 0}
                  className="itl-page-btn"
                >
                  <FaAngleDoubleRight size={12} />
                </button>
              </div>
              <div className="itl-pagination-right">
                <span className="itl-pagination-info">
                  {totalItems > 0
                    ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
                    : 'No entries to show'}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}