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
  FaChevronDown
} from 'react-icons/fa';
import "./ItemList.css";
import '../Sales/SalesMobileTable.css';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import { PageLoader } from "../components/PageLoader";


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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpand = (id: number, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setExpandedRows((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
   // ─── Loading Screen ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
        <PageLoader 
          message="Loading Setup & Item List..." 
          //subtitle="Calculating bill of materials, operations rates, and component structures"
        />
      </div>
    );
  }

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

        /* ── Active Filters ── */
        .itl-active-filters {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
          border-radius: 8px;
          font-size: 12px;
          flex-wrap: wrap;
          border: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .itl-active-filters span {
          color: var(--text-primary, #111827);
        }

        .itl-clear-filters {
          margin-left: auto;
          padding: 4px 12px;
          background: var(--card-bg, white);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary, #6b7280);
          transition: all 0.15s;
        }

        .itl-clear-filters:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        /* ── Filter Bar ── */
        .itl-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          flex-shrink: 0;
          padding: 12px 0;
        }

        .itl-filter-left {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 200px;
        }

        .itl-search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .itl-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary, #9ca3af);
          font-size: 14px;
        }

        .itl-search-input {
          width: 100%;
          padding: 8px 36px 8px 36px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          background: var(--input-bg, white);
          color: var(--text-primary, #374151);
          outline: none;
          transition: border-color 0.2s;
          height: 38px;
        }

        .itl-search-input:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .itl-search-input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .itl-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary, #9ca3af);
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .itl-filter-select {
          padding: 7px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          background: var(--card-bg, white);
          color: var(--text-primary, #374151);
          cursor: pointer;
          outline: none;
          height: 38px;
        }

        .itl-filter-select:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .itl-btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: var(--card-bg, white);
          font-size: 13px;
          color: var(--text-primary, #374151);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .itl-btn-secondary:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .itl-btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: var(--primary-color, #6366f1);
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .itl-btn-primary:hover {
          background: var(--primary-hover, #4f46e5);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        /* ── Table ── */
        .itl-table-wrap {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,0.05));
          border: 1px solid var(--border-color, #e5e7eb);
          overflow-x: auto;
          overflow-y: visible;
          flex: 0 0 auto;
        }

        .itl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 700px;
        }

        .itl-th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          background: var(--layout-bg, #f9fafb);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .itl-th-meta {
          text-align: right;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .itl-count-label {
          font-size: 11px;
          font-weight: 400;
          color: var(--text-secondary, #9ca3af);
          text-transform: none;
        }

        .itl-tr {
          cursor: pointer;
          transition: background 0.15s;
        }

        .itl-tr:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .itl-td {
          padding: 12px 16px;
          color: var(--text-primary, #374151);
          vertical-align: middle;
          text-align: left;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
        }

        .itl-td-code {
          font-weight: 500;
          font-family: monospace;
          color: var(--primary-color, #6366f1);
        }

        .itl-td-name {
          font-weight: 500;
        }

        .itl-td-meta {
          text-align: right;
        }

        /* ── Status Badge ── */
        .itl-status-badge {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          gap: 4px;
        }

        .itl-status-enabled {
          background: #d1fae5;
          color: #059669;
        }

        .itl-status-disabled {
          background: #fee2e2;
          color: #dc2626;
        }

        /* ── Action Buttons ── */
        .itl-action-buttons {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .itl-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .itl-action-btn:hover:not(:disabled) {
          background: var(--nav-hover, #f3f4f6);
        }

        .itl-edit-btn:hover:not(:disabled) {
          color: var(--primary-color, #2563eb);
        }

        .itl-delete-btn:hover:not(:disabled) {
          color: var(--danger-color, #ef4444);
        }

        .itl-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Loading, Error, Empty ── */
        .itl-loading, .itl-error, .itl-empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .itl-loading p, .itl-error p, .itl-empty-state p {
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
          margin-top: 12px;
        }

        .itl-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-empty-content p {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
          margin: 0;
        }

        .itl-empty-content span {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-retry-btn {
          margin-top: 12px;
          padding: 8px 20px;
          background: var(--primary-color, #2563eb);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .itl-retry-btn:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Pagination Styles - Single line layout ── */
        .itl-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 8px 0;
          border-top: 1px solid var(--border-color, #e5e7eb);
          margin-top: 8px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .itl-pagination-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-pagination-left select {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
        }

        .itl-pagination-left select:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
        }

        .itl-pagination-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .itl-page-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 32px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .itl-page-btn:hover:not(:disabled):not(.itl-page-btn-active) {
          background: var(--nav-hover, #f8fafc);
          border-color: var(--primary-color, #2563eb);
        }

        .itl-page-btn-active {
          background: var(--primary-color, #2563eb);
          border-color: var(--primary-color, #2563eb);
          color: #fff;
        }

        .itl-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .itl-pagination-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-pagination-label {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-pagination-info {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        /* ── Dark Theme ── */
        .dark-theme .itl-page {
          background: var(--layout-bg, #0f172a);
        }

        .dark-theme .itl-search-input {
          background: var(--input-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-search-input::placeholder {
          color: var(--text-secondary, #64748b);
        }

        .dark-theme .itl-filter-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-btn-secondary {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-btn-secondary:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .itl-btn-primary {
          background: var(--primary-color, #3b82f6);
        }

        .dark-theme .itl-btn-primary:hover {
          background: var(--primary-hover, #2563eb);
        }

        .dark-theme .itl-table-wrap {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .itl-th {
          background: var(--layout-bg, #0f172a);
          color: var(--text-secondary, #94a3b8);
          border-bottom-color: var(--border-color, #334155);
        }

        .dark-theme .itl-td {
          color: var(--text-primary, #f8fafc);
          border-bottom-color: var(--border-color, #334155);
        }

        .dark-theme .itl-tr:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .itl-count-label {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .itl-active-filters {
          background: rgba(99, 102, 241, 0.08);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .itl-active-filters span {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-clear-filters {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .itl-page-btn {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-page-btn:hover:not(:disabled):not(.itl-page-btn-active) {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .itl-page-size-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-empty-content p {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-empty-content span {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .itl-status-enabled {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .dark-theme .itl-status-disabled {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .itl-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .itl-filter-left {
            width: 100%;
          }

          .itl-search-wrapper {
            max-width: 100%;
          }

          .itl-filter-right {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .itl-table {
            min-width: 600px;
          }

          .itl-pagination {
            flex-direction: column;
            align-items: center;
          }

          .itl-pagination-center {
            order: 2;
          }

          .itl-pagination-left,
          .itl-pagination-right {
            order: 1;
          }

          .itl-td {
            padding: 10px 12px;
            font-size: 12px;
          }

          .itl-th {
            padding: 10px 12px;
            font-size: 11px;
          }

          .itl-date-picker-popup {
            left: 0;
            min-width: 100%;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .itl-filter-right {
            flex-direction: column;
            width: 100%;
          }

          .itl-filter-right > * {
            width: 100%;
          }

          .itl-btn-primary {
            justify-content: center;
          }

          .itl-btn-secondary {
            justify-content: center;
          }

          .itl-pagination {
            padding: 8px 0 0 0;
          }

          .itl-pagination-center {
            flex-wrap: wrap;
            justify-content: center;
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
          <div className="itl-table-wrap sales-desktop-table-wrap">
            <table className="itl-table">
              <thead>
                <tr>
                  <th className="itl-th">Item Code</th>
                  {/* <th className="itl-th">Item Name</th> */}
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
                    
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
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
                      {/* <td className="itl-td itl-td-name">{row.item_name}</td> */}
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
                            className="igl-action-btn igl-action-edit"
                            onClick={(e) => handleEditItem(row, e)}
                            title="Edit item"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            className="igl-action-btn igl-action-delete"
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

          {/* Mobile Table Section (Customer, Status + Dropdown Button -> Date, Amount, Actions) */}
                    <div className="sales-mobile-list-wrap">
                      <div className="sales-mobile-list-header">
                        <div className="sales-mobile-th-primary">
                          <span className="sales-mobile-th-cell">Customer</span>
                          <span className="sales-mobile-th-sep">•</span>
                          <span className="sales-mobile-th-cell">Status</span>
                        </div>
                        <div className="sales-mobile-th-right">
                          <span className="sales-count-label">
                            {totalItems > 0
                        ? `${getStartIndex()}–${getEndIndex()}`
                        : '0'} of {totalItems}
                          </span>
                        </div>
                      </div>
          
                      {items.length === 0 ? (
                        <div className="itl-empty-state">
                          <div className="itl-empty-content">
                            <p>No Items found</p>
                            <span>Try adjusting your search criteria</span>
                          </div>
                        </div>
                      ) : (
                        <div className="sales-mobile-cards">
                          {items.map((row, idx) => {
                            const isExpanded = expandedRows.has(row.id);
                            const rowNumber = getStartIndex() + idx;

                            function formatDisplayDateWithContext(value: unknown): string {
                              if (value === null || value === undefined || value === '') {
                                return '—';
                              }

                              const date = value instanceof Date ? value : new Date(String(value));

                              if (Number.isNaN(date.getTime())) {
                                return String(value);
                              }

                              return date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              });
                            }

                            function handleView(item: Item) {
                              navigate(`/item/${item.id}`, {
                                state: { itemData: item }
                              });
                            }

                            function getStatusIcon(status: string): string {
                              const normalizedStatus = String(status ?? '').trim().toLowerCase();

                              return '•';
                            }

                            return (
                              <div
                                key={row.id}
                                className={`sales-mobile-card ${isExpanded ? "sales-mobile-card-expanded" : ""}`}
                              >
                                <div
                                  className="sales-mobile-card-header"
                                  onClick={() => toggleRowExpand(row.id)}
                                >
                                  <div className="sales-mobile-card-primary">
                                    <div className="sales-mobile-card-primary-row">
                                      <span
                                        className="sales-mobile-item-name"
                                      >
                                        {row.item_code}
                                      </span>
                                      <span className="sales-mobile-header-badge">
                                        <span className="itl-td">
                                          {row.item_group}
                                        </span>
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className={`sales-mobile-dropdown-btn ${isExpanded ? "expanded" : ""}`}
                                    onClick={(e) => toggleRowExpand(row.id, e)}
                                    aria-label={isExpanded ? "Collapse item details" : "Expand item details"}
                                    title={isExpanded ? "Collapse" : "Expand"}
                                  >
                                    <FaChevronDown size={13} className="sales-mobile-chevron" />
                                  </button>
                                </div>

                                {isExpanded && (
                                  <div className="sales-mobile-card-details">
                                    <div className="sales-mobile-detail-row">
                                       <span className="sales-mobile-detail-label">Status</span>
                                      <span className={`itl-status-badge itl-status-${row.disabled === 0 ? 'enabled' : 'disabled'}`}>
                          {row.disabled === 0 ? 'Enabled' : 'Disabled'}
                        </span>
                        </div>


                                    <div className="sales-mobile-detail-row">
                                      <span className="sales-mobile-detail-label">UOM</span>
                                      <span className="sales-mobile-detail-value">{row.stock_uom}</span>
                                    </div>

                                    
                                    <div className="sales-mobile-detail-row">
                                      <span className="sales-mobile-detail-label">Type</span>
                                      <span className="sales-mobile-detail-value"> {row.is_stock_item === 1 ? 'Stock' : 'Non-Stock'}</span>
                                    </div>

                                    <div className="sales-mobile-detail-footer">
                                      <span className="sales-mobile-card-meta-text">
                                        {rowNumber} of {totalItems}
                                      </span>
                                      <div className="sales-mobile-action-buttons">
                                        
                                        <button
                                          className="qt-action-btn qt-action-edit"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditItem(row, e);
                                          }}
                                          title="Edit"
                                        >
                                          <FaEdit size={12} />
                                        </button>
                                        <button
                                          className="qt-action-btn qt-action-delete"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteItem(row.id, e);
                                          }}
                                          title="Delete"
                                          disabled={deletingId === row.id}
                                        >
                                          {deletingId === row.id ? (
                                            <FaSpinner className="spinning" size={12} />
                                          ) : (
                                            <FaTrash size={12} />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

          {/* ✅ Pagination Section - Single line layout */}
          {(totalItems > 0 || items.length > 0) && (
            <div className="itl-pagination">
              {/* Left: Show dropdown + Showing entries info */}
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
                <span className="itl-pagination-info">
                  {totalItems > 0
                    ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
                    : 'No entries to show'}
                </span>
              </div>

              {/* Center: Page navigation buttons */}
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

              {/* Right: Page info */}
              <div className="itl-pagination-right">
                <span className="itl-pagination-info">
                  Page {validCurrentPage} of {totalPages}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}