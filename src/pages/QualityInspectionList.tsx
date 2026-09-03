import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaPrint,
  FaFilter, FaCheckCircle, FaTimesCircle,
  FaSpinner, FaTimes,
  FaClipboardCheck, FaCalendarAlt, FaChevronDown,
  FaChevronLeft, FaChevronRight,
  FaAngleDoubleLeft, FaAngleDoubleRight,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './QualityInspectionList.css';
import api from '../../src/services/api';

/* ─────────────────────────── Types ─────────────────────────── */

export interface InspectionListItem {
  id: string | number;
  reportNo: string;
  docNo: string;
  partProductName: string;
  partNo: string;
  customerName: string;
  date: string;
  sampleCount: number;
  outOfSpecCount: number;
  status: string;
  overallResult: string;
  // Formatted display fields
  displayDate?: string;
}

interface InspectionApiRecord {
  id: number;
  inspection_no: string;
  inspection_date: string;
  inspection_type: string;
  reference_type: string;
  item_id: number;
  inspection_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  status: string;
  overall_result: string;
}

const extractRecords = (payload: any): any[] => {
  if (!payload) return [];
  const data = payload.success === 1 || payload.success === 0 ? payload.data : payload;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data)) return data;
  return [];
};

export default function QualityInspectionList() {
  const navigate = useNavigate();

  // ✅ GET THE DATE FORMAT FUNCTION FROM CONTEXT
  const { theme, formatDate, getApiDateFormat } = useAdminTheme();

  const [filterText, setFilterText] = useState('');
  const [selectedResult, setSelectedResult] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reports, setReports] = useState<InspectionListItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // ─── Pagination States ────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<InspectionListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Date Range Filter State (From - To, same UI as Workstation) ───
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [tempFrom, setTempFrom] = useState<Date | null>(null);
  const [tempTo, setTempTo] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Format display date using context
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  // ✅ NEW: Format date for API (YYYY-MM-DD)
  const toApiDateFormat = (date: Date) => {
    return getApiDateFormat(date);
  };

  // ─── Format date for display using the context formatter ──────────
  const formatDateShort = (d: Date) => {
    // Use the context formatter for consistent date display
    return formatDate(d.toISOString().split('T')[0]);
  };

  // ─── Format date for API (YYYY-MM-DD) ────────────────────────────
  const toISODate = (d: Date) => {
    return toApiDateFormat(d);
  };

  const isSameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const dateButtonLabel =
    dateFrom && dateTo ? `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}` : 'From - To';

  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
    setCurrentPage(1);
    setShowDatePicker(false);
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

  /* ─── load from GET /quality-inspection with SERVER-SIDE PAGINATION ────────── */

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/quality-inspection';
      const params = new URLSearchParams();
      
      // ✅ SERVER-SIDE PAGINATION PARAMS
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      
      if (filterText.trim()) {
        params.append('search', filterText.trim());
      }
      
      // Use 'from' and 'to' parameters like the Workstation file
      if (dateFrom) {
        params.append('from', toISODate(dateFrom));
      }
      
      if (dateTo) {
        params.append('to', toISODate(dateTo));
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await api.get(url);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to fetch inspection reports');
      }

      const all: InspectionApiRecord[] = extractRecords(response.data);
      
      // ✅ Get total from API response
      const total = response.data?.data?.total ?? response.data?.total ?? all.length;
      setTotalRecords(total);

      // ✅ TRANSFORM DATA WITH FORMATTED DATES
      const transformed: InspectionListItem[] = all.map((r) => ({
        id: r.id,
        reportNo: r.inspection_no || `QI-${r.id}`,
        docNo: r.reference_type || '',
        partProductName: `Item ${r.item_id}`,
        partNo: r.item_id?.toString() || '',
        customerName: 'N/A',
        date: r.inspection_date || '',
        sampleCount: r.inspection_qty ?? 0,
        outOfSpecCount: r.rejected_qty ?? 0,
        status: r.status || '',
        overallResult: r.overall_result || '',
        // ✅ ADD FORMATTED DATE FOR DISPLAY
        displayDate: r.inspection_date ? formatDisplayDate(r.inspection_date) : ''
      }));

      setReports(transformed);
    } catch (err: any) {
      console.error('Error fetching inspection reports:', err);
      setError(err.response?.data?.message || 'An error occurred while loading inspection reports');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search - fetch reports when filterText changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 500);

    return () => clearTimeout(timer);
  }, [filterText]);

  // ✅ Fetch when date range or pagination changes
  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo, currentPage, itemsPerPage]);

  // ✅ Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, selectedResult, dateFrom, dateTo]);

  // Initial fetch
  useEffect(() => {
    fetchReports();
  }, []);

  // Filter for result (client-side filtering since API doesn't support result filter)
  const filteredReports = reports.filter((r) => {
    const matchesResult =
      selectedResult === 'All' ||
      (selectedResult === 'Pass' && r.overallResult?.toLowerCase() === 'pass') ||
      (selectedResult === 'Fail' && r.overallResult?.toLowerCase() === 'fail');
    
    return matchesResult;
  });

  // ✅ Pagination calculations - SERVER SIDE
  const totalFilteredItems = totalRecords;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  
  if (validCurrentPage !== currentPage && currentPage > 0) {
    setCurrentPage(validCurrentPage);
  }

  const getStartIndex = () => {
    if (totalRecords === 0) return 0;
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };
  
  const getEndIndex = () => {
    if (totalRecords === 0) return 0;
    return Math.min(validCurrentPage * itemsPerPage, totalRecords);
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

  const totalReports = reports.length;
  const passedCount = reports.filter((r) => r.overallResult?.toLowerCase() === 'pass').length;
  const passRate = totalReports > 0 ? Math.round((passedCount / totalReports) * 100) : 0;

  const handleView = (report: InspectionListItem) => {
    navigate(`/quality-inspection/${report.id}`);
  };

  const handleEdit = (report: InspectionListItem) => {
    navigate(`/quality-inspection/${report.id}`);
  };

  const handlePrint = (report: InspectionListItem) => {
    navigate(`/quality-inspection/${report.id}?print=1`);
  };

  const handleDeleteClick = (report: InspectionListItem) => {
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/quality-inspection/${selectedReport.id}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to delete inspection report');
      }
      setShowDeleteModal(false);
      setSelectedReport(null);
      toast.success('Inspection report deleted successfully!');
      fetchReports();
    } catch (err: any) {
      console.error('Error deleting inspection report:', err);
      toast.error(err.response?.data?.message || 'Failed to delete inspection report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilterText('');
    setSelectedResult('All');
    clearDateFilterOnly();
    setCurrentPage(1);
  };

  return (
    <div className={`qi-list-page ${theme}`}>
     
      {/* Search and Filter Bar */}
      <div className="qi-filter-bar">
        <div className="qi-filter-left">
          <div className="qi-search-wrapper">
            <FaSearch className="qi-search-icon" />
            <input
              type="text"
              placeholder="Search by Inspection #, Type, or Status..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="qi-search-input"
            />
            {filterText && (
              <button className="qi-search-clear" onClick={() => setFilterText('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="qi-filter-right">
          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="qi-filter-select"
          >
            <option value="All">All Results</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>

          {/* ─── From - To Date Filter Button + Calendar Popup ─────────── */}
          <div ref={datePickerRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={openDatePicker}
              className="qi-date-filter-btn"
            >
              <FaCalendarAlt size={13} style={{ color: 'var(--primary-color, #2563eb)' }} />
              {dateButtonLabel}
              <FaChevronDown size={10} style={{ opacity: 0.6 }} />
            </button>

            {showDatePicker && (
              <div className="qi-date-popup">
                {/* Header */}
                <div className="qi-date-popup-header">
                  <span className="qi-date-popup-title">Filter by Date</span>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="qi-date-popup-close"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Quick range chips */}
                <div className="qi-quick-chips">
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
                      className="qi-quick-chip"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* Month navigation */}
                <div className="qi-month-nav">
                  <button type="button" onClick={prevMonth} className="qi-month-nav-btn">
                    <FaChevronLeft size={12} />
                  </button>
                  <span className="qi-month-label">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button type="button" onClick={nextMonth} className="qi-month-nav-btn">
                    <FaChevronRight size={12} />
                  </button>
                </div>

                {/* Weekday header */}
                <div className="qi-weekday-header">
                  {weekdayLabels.map((wd) => (
                    <span key={wd} className="qi-weekday-label">{wd}</span>
                  ))}
                </div>

                {/* Day grid */}
                <div className="qi-day-grid">
                  {getCalendarDays(calendarMonth).map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="qi-day-empty" />;

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
                        className={`qi-day-btn ${isEndpoint ? 'qi-day-selected' : ''} ${inRange ? 'qi-day-in-range' : ''}`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Footer actions */}
                <div className="qi-date-popup-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setTempFrom(null);
                      setTempTo(null);
                    }}
                    className="qi-popup-clear-btn"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyDateFilter}
                    className="qi-popup-apply-btn"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="qi-btn-new" onClick={() => navigate('/quality-inspection/new')}>
            <FaPlus size={12} /> Add Quality Inspection
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedResult !== 'All' || (dateFrom && dateTo)) && (
        <div className="qi-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {filterText && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{filterText}"
            </span>
          )}
          {selectedResult !== 'All' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Result:</strong> {selectedResult}
            </span>
          )}
          {dateFrom && dateTo && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Date:</strong> {formatDateShort(dateFrom)} – {formatDateShort(dateTo)}
            </span>
          )}
          <button onClick={clearFilters} className="qi-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="qi-loading">
          <p>Loading inspection reports...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="qi-error">
          <p>{error}</p>
          <button onClick={fetchReports} className="qi-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="qi-table-wrap">
          {filteredReports.length === 0 ? (
            <div className="qi-empty-state">
              <div className="qi-empty-content">
                <FaClipboardCheck size={48} />
                <p>No inspection reports found</p>
                <span>Try adjusting your search, or add a new inspection</span>
              </div>
            </div>
          ) : (
            <table className="qi-table">
              <thead>
                <tr>
                  <th className="qi-th">Inspection #</th>
                  <th className="qi-th">Type</th>
                  <th className="qi-th">Reference</th>
                  <th className="qi-th">Date</th>
                  <th className="qi-th qi-text-center">Samples</th>
                  <th className="qi-th">Status</th>
                  <th className="qi-th">Result</th>
                  <th className="qi-th qi-th-meta">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="qi-tr">
                    <td className="qi-td qi-td-id">{report.reportNo}</td>
                    <td className="qi-td">{report.docNo || '-'}</td>
                    <td className="qi-td">{report.partProductName || '-'}</td>
                    {/* ✅ USE FORMATTED DATE FOR DISPLAY */}
                    <td className="qi-td">{report.displayDate || '-'}</td>
                    <td className="qi-td qi-text-center">{report.sampleCount}</td>
                    <td className="qi-td">
                      <span className={`qi-status-badge qi-status-${report.status?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                        {report.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="qi-td">
                      {report.overallResult?.toLowerCase() === 'pass' ? (
                        <span className="qi-status-badge qi-status-pass">
                          <FaCheckCircle size={10} /> Pass
                        </span>
                      ) : report.overallResult?.toLowerCase() === 'fail' ? (
                        <span className="qi-status-badge qi-status-fail">
                          <FaTimesCircle size={10} /> Fail ({report.outOfSpecCount} rejected)
                        </span>
                      ) : (
                        <span className="qi-status-badge qi-status-unknown">
                          {report.overallResult || 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td className="qi-td qi-td-meta">
                      <div className="qi-action-buttons">
                        <button className="qi-action-btn qi-action-view" onClick={() => handleView(report)} title="View / Edit">
                          <FaEye size={12} />
                        </button>
                        <button className="qi-action-btn qi-action-print" onClick={() => handlePrint(report)} title="Print">
                          <FaPrint size={12} />
                        </button>
                        <button className="qi-action-btn qi-action-edit" onClick={() => handleEdit(report)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="qi-action-btn qi-action-delete" onClick={() => handleDeleteClick(report)} title="Delete">
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
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="qi-pagination">
          <div className="qi-pagination-left">
            <span className="qi-pagination-label">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="qi-page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="qi-pagination-info">
              {totalRecords > 0 ? (
                `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalRecords} entries`
              ) : (
                'No entries to show'
              )}
            </span>
          </div>
          <div className="qi-pagination-center">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1 || totalRecords === 0}
              className="qi-page-btn"
            >
              <FaAngleDoubleLeft size={12} />
            </button>
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1 || totalRecords === 0}
              className="qi-page-btn"
            >
              <FaChevronLeft size={12} />
            </button>
            {totalRecords > 0 && getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`qi-page-btn ${currentPage === page ? 'qi-page-btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages || totalRecords === 0}
              className="qi-page-btn"
            >
              <FaChevronRight size={12} />
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages || totalRecords === 0}
              className="qi-page-btn"
            >
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="qi-pagination-right">
            <span className="qi-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="qi-footer">
        <div className="qi-footer-left">
          <span className="qi-pagination-info">
            {filteredReports.length} of {totalRecords} reports
          </span>
        </div>
        <div className="qi-footer-right">
          <span className="qi-pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCheckCircle size={14} style={{ color: 'var(--primary-color)' }} />
            {passRate}% pass rate
          </span>
        </div>
      </div>

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedReport && (
        <div className="qi-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="qi-modal qi-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="qi-modal-header">
              <span className="qi-modal-title">Confirm Delete</span>
              <button className="qi-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="qi-modal-body">
              <p>Are you sure you want to delete this inspection report?</p>
              <p className="qi-modal-item-name">
                <strong>{selectedReport.reportNo}</strong> - {selectedReport.partProductName}
              </p>
              <p className="qi-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="qi-modal-footer">
              <button className="qi-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="qi-btn-delete" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}