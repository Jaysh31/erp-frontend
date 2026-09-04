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
  FaSpinner,
  FaChevronDown,
  FaCalendarAlt,
  FaUsers,
  FaEnvelope,
  FaMobileAlt,
  FaUser,
  FaBuilding,
} from 'react-icons/fa';
import "./WarehouseList.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader } from "../components/PageLoader";

interface Warehouse {
  id: number;
  warehouse_name: string;
  company: string | null;
  parent_warehouse: string | null;
  warehouse_type: string | null;
  city: string | null;
  state: string | null;
  email_id: string | null;
  phone_no: string | null;
  disabled: number;
}

interface Contact {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  status: string;
  contactCode: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Warehouse[];
  };
}

export default function WarehouseList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  
  // ─── View Modal States ──────────────────────────────────────────────────
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingWarehouse, setViewingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseContacts, setWarehouseContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // ─── Date Range Filter State (From - To, same UI as Purchase Order) ───
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [tempFrom, setTempFrom] = useState<Date | null>(null);
  const [tempTo, setTempTo] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // ─── Date Range Filter Helpers ─────────────────────────────────────────
  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateShort = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const isSameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const dateButtonLabel =
    dateFrom && dateTo ? `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}` : 'From - To';

  const getCalendarDays = (monthDate: Date): (Date | null)[] => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const openDatePicker = () => {
    setTempFrom(dateFrom);
    setTempTo(dateTo);
    setCalendarMonth(dateFrom || new Date());
    setShowDatePicker((prev) => !prev);
  };

  const handleDayClick = (day: Date) => {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(day);
      setTempTo(null);
    } else if (day < tempFrom) {
      setTempTo(tempFrom);
      setTempFrom(day);
    } else {
      setTempTo(day);
    }
  };

  const setQuickRange = (type: 'today' | '7days' | '30days' | 'month') => {
    const now = new Date();
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from: Date;
    let to: Date;
    switch (type) {
      case 'today':
        from = todayOnly;
        to = todayOnly;
        break;
      case '7days':
        to = todayOnly;
        from = new Date(todayOnly);
        from.setDate(from.getDate() - 6);
        break;
      case '30days':
        to = todayOnly;
        from = new Date(todayOnly);
        from.setDate(from.getDate() - 29);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = todayOnly;
        break;
    }
    setTempFrom(from);
    setTempTo(to);
    setCalendarMonth(from);
  };

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const applyDateFilter = () => {
    setDateFrom(tempFrom);
    setDateTo(tempTo);
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  const clearDateFilterOnly = () => {
    setTempFrom(null);
    setTempTo(null);
    setDateFrom(null);
    setDateTo(null);
  };

  // Close the date picker popup when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Fetch warehouses from API
  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (dateFrom) {
        params.append('from', toISODate(dateFrom));
      }
      if (dateTo) {
        params.append('to', toISODate(dateTo));
      }

      const response = await api.get<ApiResponse>(`/warehouse?${params.toString()}`);
      
      if (response.data.success === 1) {
        setWarehouses(response.data.data.records);
        setTotalItems(response.data.data.total);
      } else {
        setError('Failed to fetch warehouses');
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError('An error occurred while fetching warehouses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouse contacts
  const fetchWarehouseContacts = async (warehouseId: number) => {
    setLoadingContacts(true);
    try {
      const response = await api.get(`/warehouse/${warehouseId}/contacts`);
      if (response.data && response.data.success === 1) {
        setWarehouseContacts(response.data.data || []);
      } else {
        setWarehouseContacts([]);
      }
    } catch (err) {
      console.error('Error fetching warehouse contacts:', err);
      setWarehouseContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchWarehouses();
  }, [currentPage, itemsPerPage, searchTerm, dateFrom, dateTo]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, dateFrom, dateTo]);

  // Filter data based on status
  const filteredData = warehouses.filter(item => {
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && item.disabled === 0) ||
                         (statusFilter === 'disabled' && item.disabled === 1);
    return matchesStatus;
  });

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Ensure current page is valid when data changes
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  if (validCurrentPage !== currentPage && totalPages > 0) {
    setCurrentPage(validCurrentPage);
  }
  
  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

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

  // Navigate to warehouse form for new warehouse
  const handleAddWarehouse = () => {
    navigate('/warehouse/new');
  };

  // Navigate to warehouse form for editing - using ID
  const handleEditWarehouse = (warehouse: Warehouse) => {
    console.log('Navigating to edit warehouse with ID:', warehouse.id);
    navigate(`/warehouse/${warehouse.id}`);
  };

  // Navigate to warehouse form for viewing - using ID
  const handleViewWarehouse = async (warehouse: Warehouse) => {
    setViewingWarehouse(warehouse);
    setShowViewModal(true);
    await fetchWarehouseContacts(warehouse.id);
  };

  const handleDelete = (item: Warehouse) => {
    setSelectedWarehouse(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedWarehouse) {
      try {
        const response = await api.delete(`/warehouse/${selectedWarehouse.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedWarehouse(null);
          toast.success('Warehouse deleted successfully!');
          fetchWarehouses(); // Refresh the list
        } else {
          toast.error(response.data?.message || 'Failed to delete warehouse');
        }
      } catch (err) {
        console.error('Error deleting warehouse:', err);
        toast.error('Failed to delete warehouse');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    clearDateFilterOnly();
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalItems);
  };

  const handleRowClick = (warehouse: Warehouse) => {
    navigate(`/warehouse/${warehouse.id}`);
  };

  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Passive': return 'status-passive';
      case 'Suspended': return 'status-suspended';
      default: return '';
    }
  };

    // ─── Loading Screen ─────────────────────────────────────────────────────
    if (loading) {
      return (
        <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
          <PageLoader 
            message="Loading Setup & Warehouse List..." 
            //subtitle="Calculating bill of materials, operations rates, and component structures"
          />
        </div>
      );
    }

  return (
    <div className={`wl-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="wl-filter-bar">
        <div className="wl-filter-left">
          <div className="wl-search-wrapper">
            <FaSearch className="wl-search-icon" />
            <input
              type="text"
              placeholder="Search Warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="wl-search-input"
            />
            {searchTerm && (
              <button className="wl-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="wl-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="wl-filter-select"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
         

          {/* ─── From - To Date Filter Button + Calendar Popup ─────────── */}
          <div ref={datePickerRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={openDatePicker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #d1d5db)',
                background: 'var(--card-bg, #ffffff)',
                color: 'var(--text-primary, #1f2937)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <FaCalendarAlt size={13} style={{ color: 'var(--primary-color, #2563eb)' }} />
              {dateButtonLabel}
              <FaChevronDown size={10} style={{ opacity: 0.6 }} />
            </button>

            {showDatePicker && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 50,
                  width: '300px',
                  background: 'var(--card-bg, #ffffff)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border-color, #e5e7eb)',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #1f2937)' }}>
                    Filter by Date
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #6b7280)' }}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Quick range chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px 14px' }}>
                  {[
                    { label: 'Today', type: 'today' as const },
                    { label: 'Last 7 Days', type: '7days' as const },
                    { label: 'Last 30 Days', type: '30days' as const },
                    { label: 'This Month', type: 'month' as const },
                  ].map((q) => (
                    <button
                      key={q.type}
                      type="button"
                      onClick={() => setQuickRange(q.type)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '12px',
                        borderRadius: '999px',
                        border: '1px solid var(--border-color, #d1d5db)',
                        background: 'var(--hover-bg, #f3f4f6)',
                        color: 'var(--text-primary, #374151)',
                        cursor: 'pointer',
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* Month navigation */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 14px',
                  }}
                >
                  <button
                    type="button"
                    onClick={prevMonth}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary, #374151)' }}
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary, #1f2937)' }}>
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary, #374151)' }}
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>

                {/* Weekday header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    padding: '4px 10px 0 10px',
                    textAlign: 'center',
                  }}
                >
                  {weekdayLabels.map((wd) => (
                    <span key={wd} style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)', padding: '4px 0' }}>
                      {wd}
                    </span>
                  ))}
                </div>

                {/* Day grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    padding: '0 10px 10px 10px',
                    textAlign: 'center',
                  }}
                >
                  {getCalendarDays(calendarMonth).map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />;

                    const isFrom = isSameDay(day, tempFrom);
                    const isTo = isSameDay(day, tempTo);
                    const inRange =
                      tempFrom && tempTo && day > tempFrom && day < tempTo;
                    const isEndpoint = isFrom || isTo;

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        style={{
                          margin: '2px 0',
                          padding: '6px 0',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: isEndpoint
                            ? 'var(--primary-color, #2563eb)'
                            : inRange
                            ? 'var(--primary-color-light, #dbeafe)'
                            : 'transparent',
                          color: isEndpoint ? '#ffffff' : 'var(--text-primary, #1f2937)',
                          fontWeight: isEndpoint ? 600 : 400,
                        }}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Footer actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    padding: '10px 14px',
                    borderTop: '1px solid var(--border-color, #e5e7eb)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTempFrom(null);
                      setTempTo(null);
                    }}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color, #d1d5db)',
                      background: 'var(--card-bg, #ffffff)',
                      color: 'var(--text-primary, #374151)',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyDateFilter}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--primary-color, #2563eb)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

         
          <button className="wl-btn-primary" onClick={handleAddWarehouse}>
            <FaPlus size={12} />
            Add Warehouse
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all' || (dateFrom && dateTo)) && (
        <div className="wl-active-filters">
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
          {dateFrom && dateTo && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Date:</strong> {formatDateShort(dateFrom)} – {formatDateShort(dateTo)}
            </span>
          )}
          <button 
            onClick={clearFilters}
            className="wl-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="wl-loading">
          <FaSpinner className="spinning" size={24} />
          <p>Loading warehouses...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="wl-error">
          <p>{error}</p>
          <button onClick={fetchWarehouses} className="wl-retry-btn">Retry</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="wl-table-wrap">
            <table className="wl-table">
              <thead>
                <tr>
                  <th className="wl-th">ID</th>
                  <th className="wl-th">Warehouse Name</th>
                  <th className="wl-th">Status</th>
                  <th className="wl-th">Company</th>
                  <th className="wl-th">Parent Warehouse</th>
                  <th className="wl-th">Type</th>
                  <th className="wl-th wl-th-meta">
                    <span className="wl-count-label">
                     {totalItems> 0
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
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="wl-empty-state">
                      <div className="wl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No Warehouses found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className="wl-tr"
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="wl-td">{row.id}</td>
                      <td className="wl-td wl-td-name">{row.warehouse_name}</td>
                      <td className="wl-td">
                        <span className={`wl-status-badge wl-status-${row.disabled === 0 ? 'enabled' : 'disabled'}`}>
                          {row.disabled === 0 ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="wl-td">{row.company || '-'}</td>
                      <td className="wl-td">{row.parent_warehouse || '-'}</td>
                      <td className="wl-td">{row.warehouse_type || '-'}</td>
                      <td className="wl-td wl-td-meta">
                        <div className="wl-action-buttons">
                          <button 
                            className="wl-action-btn wl-action-view" 
                            onClick={(e) => { e.stopPropagation(); handleViewWarehouse(row); }}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button 
                            className="wl-action-btn wl-action-edit" 
                            onClick={(e) => { e.stopPropagation(); handleEditWarehouse(row); }}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="wl-action-btn wl-action-delete" 
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

          {/* Pagination */}
          <div className="wl-pagination">
            <div className="wl-pagination-left">
              <span className="wl-pagination-label">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="wl-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="wl-pagination-label">entries</span>
            </div>
            <div className="wl-pagination-center">
              <button 
                onClick={goToFirstPage} 
                disabled={currentPage === 1 || totalItems === 0} 
                className="wl-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1 || totalItems === 0} 
                className="wl-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`wl-page-btn ${currentPage === page ? 'wl-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || totalItems === 0} 
                className="wl-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button 
                onClick={goToLastPage} 
                disabled={currentPage === totalPages || totalItems === 0} 
                className="wl-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="wl-pagination-right">
              <span className="wl-pagination-info">
                {totalItems > 0 ? (
                  `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
                ) : (
                  'No entries to show'
                )}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ─── View Modal ────────────────────────────────────────────────── */}
      {showViewModal && viewingWarehouse && (
        <div className="wl-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="wl-modal wl-modal-view">
            <div className="wl-modal-header">
              <span className="wl-modal-title">
                <FaBuilding size={16} style={{ marginRight: '8px' }} />
                Warehouse Details: {viewingWarehouse.warehouse_name}
              </span>
              <button className="wl-modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="wl-modal-body">
              {/* Warehouse Info */}
              <div className="wl-view-section">
                <h4>Warehouse Information</h4>
                <div className="wl-view-grid">
                  <div className="wl-view-item">
                    <label>ID</label>
                    <span>{viewingWarehouse.id}</span>
                  </div>
                  <div className="wl-view-item">
                    <label>Name</label>
                    <span>{viewingWarehouse.warehouse_name}</span>
                  </div>
                  <div className="wl-view-item">
                    <label>Company</label>
                    <span>{viewingWarehouse.company || 'N/A'}</span>
                  </div>
                  <div className="wl-view-item">
                    <label>Parent Warehouse</label>
                    <span>{viewingWarehouse.parent_warehouse || 'N/A'}</span>
                  </div>
                  <div className="wl-view-item">
                    <label>Type</label>
                    <span>{viewingWarehouse.warehouse_type || 'N/A'}</span>
                  </div>
                  <div className="wl-view-item">
                    <label>City</label>
                    <span>{viewingWarehouse.city || 'N/A'}</span>
                  </div>
                  <div className="wl-view-item">
                    <label>State</label>
                    <span>{viewingWarehouse.state || 'N/A'}</span>
                  </div>
                  <div className="wl-view-item">
                    <label>Status</label>
                    <span className={`wl-status-badge wl-status-${viewingWarehouse.disabled === 0 ? 'enabled' : 'disabled'}`}>
                      {viewingWarehouse.disabled === 0 ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="wl-view-item">
                    <label>Phone</label>
                    <span>{viewingWarehouse.phone_no || 'N/A'}</span>
                  </div>
                  <div className="wl-view-item">
                    <label>Email</label>
                    <span>{viewingWarehouse.email_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contacts Section */}
              <div className="wl-view-section">
                <h4>
                  <FaUsers size={14} style={{ marginRight: '6px' }} />
                  Contacts ({warehouseContacts.length})
                </h4>
                {loadingContacts ? (
                  <div className="wl-loading-contacts">
                    <FaSpinner className="spinning" size={20} />
                    <p>Loading contacts...</p>
                  </div>
                ) : warehouseContacts.length > 0 ? (
                  <div className="wl-contacts-grid">
                    {warehouseContacts.map((contact) => (
                      <div key={contact.id} className="wl-contact-card">
                        <div className="wl-contact-header">
                          <FaUser className="wl-contact-icon" />
                          <span className="wl-contact-name">{contact.fullName}</span>
                          <span className={`wl-contact-status ${getStatusColor(contact.status)}`}>
                            {contact.status}
                          </span>
                        </div>
                        <div className="wl-contact-details">
                          {contact.email && (
                            <div className="wl-contact-detail">
                              <FaEnvelope size={12} />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.mobile && (
                            <div className="wl-contact-detail">
                              <FaMobileAlt size={12} />
                              <span>{contact.mobile}</span>
                            </div>
                          )}
                          {contact.contactCode && (
                            <div className="wl-contact-detail">
                              <span className="wl-contact-code">{contact.contactCode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wl-empty-contacts">
                    <p>No contacts found for this warehouse.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="wl-modal-footer">
              <button 
                className="wl-btn-cancel" 
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button 
                className="wl-btn-edit" 
                onClick={() => {
                  setShowViewModal(false);
                  handleEditWarehouse(viewingWarehouse);
                }}
              >
                <FaEdit size={12} /> Edit Warehouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedWarehouse && (
        <div className="wl-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="wl-modal wl-modal-delete">
            <div className="wl-modal-header">
              <span className="wl-modal-title">Confirm Delete</span>
              <button className="wl-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="wl-modal-body">
              <p>Are you sure you want to delete this warehouse?</p>
              <p className="wl-modal-item-name"><strong>{selectedWarehouse.warehouse_name}</strong></p>
              <p className="wl-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="wl-modal-footer">
              <button className="wl-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="wl-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}