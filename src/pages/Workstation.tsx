// Workstation.tsx - Fixed with Proper Server-Side Pagination

import { useState, useEffect, useRef } from "react";
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
  FaClock,
  FaChevronDown,
  FaCalendarAlt,

} from 'react-icons/fa';
import "./Workstation.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import NewWorkstation from './NewWorkstation';

interface Workstation {
  id: number;
  workstation_name: string;
  workstation_type: string;
  plant_floor: string;
  disabled: number;
  production_capacity: number;
  warehouse: string;
  status: string;
  on_status_image: string;
  off_status_image: string;
  hour_rate: number;
  description: string;
  holiday_list: string;
  total_working_hours: number;
  _user_tags: string;
  _comments: string | null;
  _assign: string | null;
  _liked_by: string | null;
  creation: string;
  modified: string;
  modified_by: string;
  owner: string;
  docstatus: number;
  idx: number;
  is_deleted: number;
}

interface ApiResponse {
  success: number;
  data: Workstation[] | {
    total?: number;
    page?: number;
    limit?: number;
    records?: Workstation[];
  };
}

export default function WorkstationList() {
  const { theme } = useAdminTheme();
  
  const [showNewWorkstation, setShowNewWorkstation] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState<Workstation | null>(null);
  const [editData, setEditData] = useState<Workstation | null>(null);
  
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Workstation | null>(null);

  // ─── Date Range Filter State (From - To, same UI as Purchase Order) ───
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [tempFrom, setTempFrom] = useState<Date | null>(null);
  const [tempTo, setTempTo] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // ─── Format date ──────────────────────────────────────────────────────────

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
    return `${Math.floor(diffDays / 365)}y`;
  };

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

  // ─── Fetch workstations with SERVER-SIDE PAGINATION ─────────────────────

  const fetchWorkstations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      // ✅ SERVER-SIDE PAGINATION PARAMS
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      params.append('sort_order', 'asc');
      params.append('sort_by', 'id');
      
      // Add search parameter if searchTerm exists
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (dateFrom) params.append('from', toISODate(dateFrom));
      if (dateTo) params.append('to', toISODate(dateTo));

      // Add status filter
      if (statusFilter !== 'all') {
        params.append('is_deleted', statusFilter === 'active' ? '0' : '1');
      }

      const url = `/workstation?${params.toString()}`;
      console.log('API URL:', url);

      const response = await api.get<ApiResponse>(url);
      
      if (response.data.success === 1) {
        const data = response.data.data;
        
        let records: Workstation[] = [];
        let total = 0;
        
        if (Array.isArray(data)) {
          records = data;
          total = data.length;
        } else if (data && 'records' in data) {
          records = data.records || [];
          // ✅ Use the total from API response
          total = data.total || records.length;
        } else {
          records = data.records || [];
          total = records.length;
        }
        
        // ✅ Filter out deleted records if statusFilter is 'all' - use the actual data length
        // The API should handle filtering, but we also filter client-side for safety
        let filteredRecords = records;
        if (statusFilter === 'all') {
          // When 'all' is selected, show all records (both active and disabled)
          filteredRecords = records;
          // Use the total from API response
          setTotalItems(total);
        } else if (statusFilter === 'active') {
          filteredRecords = records.filter(ws => ws.is_deleted === 0);
          setTotalItems(filteredRecords.length);
        } else if (statusFilter === 'disabled') {
          filteredRecords = records.filter(ws => ws.is_deleted === 1);
          setTotalItems(filteredRecords.length);
        }
        
        filteredRecords.sort((a, b) => a.id - b.id);
        
        setWorkstations(filteredRecords);
        
        // ✅ If statusFilter is 'all', use API total, otherwise use filtered count
        if (statusFilter === 'all') {
          setTotalItems(total);
        }
        
        console.log(`Total records: ${total}, Filtered: ${filteredRecords.length}, Current page: ${currentPage}, Limit: ${itemsPerPage}`);
      } else {
        setError('Failed to fetch workstations');
        setWorkstations([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Error fetching workstations:', err);
      setError('An error occurred while fetching workstations');
      setWorkstations([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch when dependencies change (including pagination)
  useEffect(() => {
    fetchWorkstations();
  }, [currentPage, itemsPerPage, dateFrom, dateTo, searchTerm, statusFilter]);

  // ✅ Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  // ─── Filter data (client-side for any remaining filters) ─────────────────
  // Since we're now using server-side filtering, we only need to filter what's already fetched
  const filteredData = workstations;

  const totalFilteredItems = filteredData.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  if (validCurrentPage !== currentPage && currentPage > 1) {
    setCurrentPage(validCurrentPage);
  }
  
  // Use the filtered data directly (already paginated from server)
  const paginatedData = filteredData;

  // ─── Pagination ───────────────────────────────────────────────────────────

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

  const getStartIndex = () => {
    if (totalFilteredItems === 0) return 0;
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };
  
  const getEndIndex = () => {
    if (totalFilteredItems === 0) return 0;
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleView = (ws: Workstation) => {
    setSelectedWorkstation(ws);
    setShowDetailModal(true);
  };

  const handleEdit = (ws: Workstation) => {
    setEditData(ws);
    setShowNewWorkstation(true);
  };

  const handleDelete = (ws: Workstation) => {
    setDeleteTarget(ws);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        const response = await api.delete(`/workstation/${deleteTarget.id}`);
        
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
          fetchWorkstations();
          alert('Workstation deleted successfully');
        } else {
          setError('Failed to delete workstation');
        }
      } catch (err: any) {
        console.error('Error deleting workstation:', err);
        if (err.response) {
          setError(err.response.data?.message || `Server error: ${err.response.status}`);
        } else if (err.request) {
          setError('Network error. Please check your connection.');
        } else {
          setError('An unexpected error occurred.');
        }
        alert('Failed to delete workstation');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    clearDateFilterOnly();
    setCurrentPage(1);
  };

  // ─── Check if workstation is active ──────────────────────────────────────
  const isWorkstationActive = (ws: Workstation) => {
    return ws.is_deleted === 0;
  };

  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {showNewWorkstation && (
        <NewWorkstation 
          onBack={() => {
            setShowNewWorkstation(false);
            setEditData(null);
            fetchWorkstations();
          }}
          editData={editData ? {
            ...editData,
            _comments: editData._comments ?? '',
            _assign: editData._assign ?? '',
            _liked_by: editData._liked_by ?? '',
          } : null}
        />
      )}

      {!showNewWorkstation && (
        <div className={`wo-page ${theme}`}>
          {/* Stats Cards */}
         
          {/* Search and Filter Bar */}
          <div className="wo-filter-bar">
            <div className="wo-filter-left">
              <div className="wo-search-wrapper">
                <FaSearch className="wo-search-icon" />
                <input
                  type="text"
                  placeholder="Search workstations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="wo-search-input"
                />
                {searchTerm && (
                  <button className="wo-search-clear" onClick={() => setSearchTerm('')}>
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="wo-filter-right">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="wo-filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
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

              <button 
                className="wo-btn-primary" 
                onClick={() => {
                  setEditData(null);
                  setShowNewWorkstation(true);
                }}
              >
                <FaPlus size={12} />
                Add Workstation
              </button>
            </div>
          </div>

          {/* Active filters indicator */}
          {(searchTerm || statusFilter !== 'all' || (dateFrom && dateTo)) && (
            <div className="wo-active-filters">
              <FaFilter size={12} style={{ color: '#3B82F6' }} />
              <span>Active filters:</span>
              {searchTerm && (
                <span><strong>Search:</strong> "{searchTerm}"</span>
              )}
              {statusFilter !== 'all' && (
                <span><strong>Status:</strong> {statusFilter}</span>
              )}
              {dateFrom && dateTo && (
                <span><strong>Date:</strong> {formatDateShort(dateFrom)} – {formatDateShort(dateTo)}</span>
              )}
              <button 
                onClick={clearFilters}
                className="wo-clear-filters"
              >
                <FaTimes size={10} /> Clear All
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="wo-loading">
              <p>Loading workstations...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="wo-error">
              <p>{error}</p>
              <button onClick={fetchWorkstations} className="wo-retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* Table Grid View */}
          {!loading && !error && (
            <>
              <div className="wo-table-container">
                {paginatedData.length === 0 ? (
                  <div className="wo-empty-state">
                    <div className="wo-empty-content">
                      <FaClock size={48} />
                      <p>No workstations found</p>
                      <span>Try adjusting your search criteria</span>
                    </div>
                  </div>
                ) : (
                  <table className="wo-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Plant Floor</th>
                        <th>Capacity</th>
                        <th>Hour Rate</th>
                        <th className="wo-th-meta">
                          <span>{paginatedData.length} of {totalFilteredItems}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((ws) => (
                        <tr key={ws.id} className="wo-tr">
                          <td className="wo-td-name">{ws.workstation_name}</td>
                          <td className="wo-td-type">{ws.workstation_type}</td>
                          <td>
                            {/* Use is_deleted to determine active/disabled status */}
                            {isWorkstationActive(ws) ? (
                              <span 
                                className="wo-status-badge"
                                style={{
                                  background: '#D1FAE5',
                                  color: '#10B981',
                                }}
                              >
                                Active
                              </span>
                            ) : (
                              <span 
                                className="wo-status-badge"
                                style={{
                                  background: '#FEE2E2',
                                  color: '#EF4444',
                                }}
                              >
                                Disabled
                              </span>
                            )}
                          </td>
                          <td>{ws.plant_floor}</td>
                          <td>{ws.production_capacity}</td>
                          <td>₹{ws.hour_rate}</td>
                          <td className="wo-td-meta">
                            <div className="wo-action-buttons">
                              <button 
                                className="wo-action-btn wo-action-view" 
                                onClick={() => handleView(ws)}
                                title="View"
                              >
                                <FaEye size={12} />
                              </button>
                              <button 
                                className="wo-action-btn wo-action-edit" 
                                onClick={() => handleEdit(ws)}
                                title="Edit"
                              >
                                <FaEdit size={12} />
                              </button>
                              <button 
                                className="wo-action-btn wo-action-delete" 
                                onClick={() => handleDelete(ws)}
                                title="Delete"
                              >
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

              {/* Pagination - Show only if total items > 0 */}
              {totalFilteredItems > 0 && (
                <div className="wo-pagination">
                  <div className="wo-pagination-left">
                    <span className="wo-pagination-label">Show:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="wo-page-size-select"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="wo-pagination-info">
                      {totalFilteredItems > 0 ? (
                        `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                      ) : (
                        'No entries to show'
                      )}
                    </span>
                  </div>
                  <div className="wo-pagination-center">
                    <button 
                      onClick={goToFirstPage} 
                      disabled={currentPage === 1 || totalFilteredItems === 0} 
                      className="wo-page-btn"
                    >
                      <FaAngleDoubleLeft size={12} />
                    </button>
                    <button 
                      onClick={goToPrevPage} 
                      disabled={currentPage === 1 || totalFilteredItems === 0} 
                      className="wo-page-btn"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    {totalFilteredItems > 0 && getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`wo-page-btn ${currentPage === page ? 'wo-page-btn-active' : ''}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      onClick={goToNextPage} 
                      disabled={currentPage === totalPages || totalFilteredItems === 0} 
                      className="wo-page-btn"
                    >
                      <FaChevronRight size={12} />
                    </button>
                    <button 
                      onClick={goToLastPage} 
                      disabled={currentPage === totalPages || totalFilteredItems === 0} 
                      className="wo-page-btn"
                    >
                      <FaAngleDoubleRight size={12} />
                    </button>
                  </div>
                  <div className="wo-pagination-right">
                    <span className="wo-pagination-info">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && deleteTarget && (
            <div className="wo-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
              <div className="wo-modal wo-modal-delete" onClick={e => e.stopPropagation()}>
                <div className="wo-modal-header">
                  <span className="wo-modal-title">Confirm Delete</span>
                  <button className="wo-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                    <FaTimes size={16} />
                  </button>
                </div>
                <div className="wo-modal-body">
                  <p>Are you sure you want to delete this workstation?</p>
                  <p className="wo-modal-item-name">
                    <strong>{deleteTarget.workstation_name}</strong>
                  </p>
                  <p className="wo-modal-warning">This action cannot be undone.</p>
                </div>
                <div className="wo-modal-footer">
                  <button className="wo-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </button>
                  <button className="wo-btn-delete" onClick={confirmDelete}>
                    <FaTrash size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── View Detail Modal ────────────────────────────────────── */}
          {showDetailModal && selectedWorkstation && (
            <div className="wo-modal-overlay" onClick={() => setShowDetailModal(false)}>
              <div className="wo-modal wo-modal-detail" onClick={e => e.stopPropagation()}>
                <div className="wo-modal-header">
                  <span className="wo-modal-title">
                    <FaEye size={16} style={{ marginRight: 8 }} />
                    Workstation Details - #{selectedWorkstation.id}
                  </span>
                  <button className="wo-modal-close" onClick={() => setShowDetailModal(false)}>
                    <FaTimes size={16} />
                  </button>
                </div>
                <div className="wo-modal-body">
                  <div className="wo-detail-grid">
                    <div className="wo-detail-section">
                      <h4>Basic Information</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Workstation Name</span>
                        <span className="wo-detail-value">{selectedWorkstation.workstation_name}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Type</span>
                        <span className="wo-detail-value">{selectedWorkstation.workstation_type}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Plant Floor</span>
                        <span className="wo-detail-value">{selectedWorkstation.plant_floor}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Status</span>
                        <span className="wo-detail-value">
                          {isWorkstationActive(selectedWorkstation) ? (
                            <span 
                              className="wo-status-badge"
                              style={{
                                background: '#D1FAE5',
                                color: '#10B981',
                              }}
                            >
                              Active
                            </span>
                          ) : (
                            <span 
                              className="wo-status-badge"
                              style={{
                                background: '#FEE2E2',
                                color: '#EF4444',
                              }}
                            >
                              Disabled
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="wo-detail-section">
                      <h4>Capacity & Cost</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Production Capacity</span>
                        <span className="wo-detail-value">{selectedWorkstation.production_capacity}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Hour Rate</span>
                        <span className="wo-detail-value">₹ {selectedWorkstation.hour_rate}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Total Working Hours</span>
                        <span className="wo-detail-value">{selectedWorkstation.total_working_hours}h</span>
                      </div>
                    </div>

                    <div className="wo-detail-section">
                      <h4>Warehouse</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Warehouse</span>
                        <span className="wo-detail-value">{selectedWorkstation.warehouse}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Holiday List</span>
                        <span className="wo-detail-value">{selectedWorkstation.holiday_list}</span>
                      </div>
                    </div>

                    <div className="wo-detail-section">
                      <h4>Images</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">On Status Image</span>
                        <span className="wo-detail-value">{selectedWorkstation.on_status_image}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Off Status Image</span>
                        <span className="wo-detail-value">{selectedWorkstation.off_status_image}</span>
                      </div>
                    </div>

                    <div className="wo-detail-section">
                      <h4>Tags</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">User Tags</span>
                        <span className="wo-detail-value">{selectedWorkstation._user_tags}</span>
                      </div>
                    </div>

                    {selectedWorkstation.description && (
                      <div className="wo-detail-section wo-detail-full">
                        <h4>Description</h4>
                        <div className="wo-detail-description">
                          {selectedWorkstation.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="wo-modal-footer">
                  <button className="wo-btn-secondary" onClick={() => setShowDetailModal(false)}>
                    Close
                  </button>
                  <button 
                    className="wo-btn-primary" 
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedWorkstation);
                    }}
                  >
                    <FaEdit size={12} /> Edit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}