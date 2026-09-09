import { useState, useEffect, type FormEvent, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  FaSave,
  FaSpinner,
  FaTag,
  FaFolder,
  FaArrowLeft,
  FaCalendarAlt,
  FaChevronDown
} from 'react-icons/fa';
import "./Itemgrouplist.css";
import '../Sales/SalesMobileTable.css';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import { PageLoader } from "../components/PageLoader";

interface ItemGroup {
  id: string;
  item_group_name: string;
  parent_item_group: string;
  is_group: number;
  is_editable: number;
  image: string | null;
  creation: string;
  modified: string;
  disabled?: number;
}

interface ItemGroupDisplay {
  id: string;
  itemGroupName: string;
  parentItemGroup: string;
  creation: string;
  isGroup: boolean;
  isEditable: boolean;
  createdAgo: string;
  comments: number;
  disabled: number;
}

interface ItemGroupDetail {
  id: string;
  item_group_name: string;
  parent_item_group: string;
  is_group: number;
  is_editable: number;
  image: string | null;
  creation: string;
  modified: string;
  company: string;
  item_tax_template: string;
  tax_category: string;
  valid_from: string;
  min_net_rate: number;
  max_net_rate: number;
  default_warehouse: string;
  default_price_list: string;
  comments: string;
}

interface ApiResponse {
  success: number;
  data: ItemGroup[];
}

interface ApiDetailResponse {
  success: number;
  data: ItemGroupDetail;
}

interface EditFormState {
  id: string;
  itemGroupName: string;
  parentItemGroup: string;
  isGroup: boolean;
}

export default function ItemGroupList() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useAdminTheme();
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [itemGroups, setItemGroups] = useState<ItemGroupDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemGroupDisplay | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpand = (rowId: string, event?: { stopPropagation: () => void }) => {
    event?.stopPropagation();
    setExpandedRows((currentRows) => {
      const nextRows = new Set(currentRows);
      if (nextRows.has(rowId)) {
        nextRows.delete(rowId);
      } else {
        nextRows.add(rowId);
      }
      return nextRows;
    });
  };

  // ---- Date filter (calendar) state ----
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());

  const [detailData, setDetailData] = useState<ItemGroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);


  const isDetailView = !!id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo`;
    return `${Math.floor(diffDays / 365)} y`;
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Local (non-UTC) YYYY-MM-DD formatter, avoids the timezone-shift bug
  // that toISOString() causes when converting local dates to API params.
  const toLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateForAPI = (dateString: string) => {
    if (!dateString) return '';
    return dateString; // already stored as YYYY-MM-DD
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Short label used inside the trigger button, e.g. "Aug 18 – Aug 20, 2026"
  const formatButtonRangeLabel = () => {
    if (!fromDate || !toDate) return 'From - To';
    const from = new Date(fromDate + 'T00:00:00');
    const to = new Date(toDate + 'T00:00:00');
    const fromLabel = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const toLabel = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fromLabel} – ${toLabel}`;
  };

  const fetchItemGroupDetail = async (groupId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await api.get<ApiDetailResponse>(`/item-group/${groupId}`);

      if (response.data.success === 1) {
        setDetailData(response.data.data);
      } else {
        setDetailError('Failed to fetch item group details');
      }
    } catch (err) {
      console.error('Error fetching item group detail:', err);
      setDetailError('An error occurred while fetching item group details');
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchItemGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/item-group?page=${currentPage}&limit=${itemsPerPage}`;

      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      if (fromDate && toDate) {
        url += `&date_from=${formatDateForAPI(fromDate)}&date_to=${formatDateForAPI(toDate)}`;
      }

      const response = await api.get<ApiResponse>(url);

      if (response.data.success === 1) {
        const data = response.data.data;
        setTotalItems(data.length);

        const transformedData: ItemGroupDisplay[] = data.map((item: ItemGroup) => ({
          id: item.id.toString(),
          itemGroupName: item.item_group_name,
          parentItemGroup: item.parent_item_group || 'N/A',
          creation: item.creation,
          isGroup: item.is_group === 1,
          isEditable: item.is_editable !== 0,
          createdAgo: formatDate(item.creation),
          comments: 0,
          disabled: item.disabled ?? 0,
        }));

        setItemGroups(transformedData);
      } else {
        setError('Failed to fetch item groups');
      }
    } catch (err) {
      console.error('Error fetching item groups:', err);
      setError('An error occurred while fetching item groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const applyDateFilter = () => {
    if (fromDate && toDate) {
      setDateFilterActive(true);
      setCurrentPage(1);
      fetchItemGroups();
      setShowDatePicker(false);
    } else {
      alert('Please select both From and To dates');
    }
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setDateFilterActive(false);
    setCurrentPage(1);
    fetchItemGroups();
    setShowDatePicker(false);
  };

  const setDateRange = (range: string) => {
    const today = new Date();
    let from = new Date();

    switch (range) {
      case 'today':
        from = new Date(today);
        break;
      case 'last7days':
        from = new Date(today);
        from.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        from = new Date(today);
        from.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      default:
        return;
    }

    const fromStr = toLocalDateStr(from);
    const toStr = toLocalDateStr(today);
    setFromDate(fromStr);
    setToDate(toStr);
    setCalendarViewDate(today);
  };

  // ---- Calendar helpers ----
  const calendarYear = calendarViewDate.getFullYear();
  const calendarMonth = calendarViewDate.getMonth();

  const calendarMonthLabel = calendarViewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getCalendarDays = (): (number | null)[] => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const goToPrevMonth = () => {
    setCalendarViewDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarViewDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const handleCalendarDayClick = (day: number | null) => {
    if (day === null) return;
    const clicked = new Date(calendarYear, calendarMonth, day);
    const clickedStr = toLocalDateStr(clicked);

    // Start a new range if nothing selected yet, or if a full range is already set
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(clickedStr);
      setToDate('');
      return;
    }

    // fromDate is set, toDate is not: complete the range
    const fromAsDate = new Date(fromDate + 'T00:00:00');
    if (clicked < fromAsDate) {
      setToDate(fromDate);
      setFromDate(clickedStr);
    } else {
      setToDate(clickedStr);
    }
  };

  const isSameDay = (dateStr: string, year: number, month: number, day: number) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  };

  const isDayInRange = (year: number, month: number, day: number) => {
    if (!fromDate || !toDate) return false;
    const current = new Date(year, month, day);
    const from = new Date(fromDate + 'T00:00:00');
    const to = new Date(toDate + 'T00:00:00');
    return current > from && current < to;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // When the picker opens, jump the visible month to the current "from" date (if any)
  useEffect(() => {
    if (showDatePicker && fromDate) {
      setCalendarViewDate(new Date(fromDate + 'T00:00:00'));
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (id) {
      fetchItemGroupDetail(id);
    }
  }, [id]);

  useEffect(() => {
    if (!isDetailView) {
      fetchItemGroups();
    }
  }, [currentPage, itemsPerPage, isDetailView]);

  useEffect(() => {
    if (!isDetailView) {
      setCurrentPage(1);
    }
  }, [statusFilter, isDetailView]);

  const filteredData = itemGroups.filter(item => {
    const matchesSearch = item.itemGroupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'group' && item.isGroup) ||
      (statusFilter === 'item' && !item.isGroup);
    return matchesSearch && matchesStatus;
  });

  const totalFilteredItems = filteredData.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);

  if (validCurrentPage !== currentPage && !isDetailView) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const parentGroupOptions = Array.from(
    new Set(
      itemGroups
        .map((g) => g.parentItemGroup)
        .filter((p) => p && p !== 'N/A' && p !== 'NA')
    )
  ).sort((a, b) => a.localeCompare(b));

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

  const handleDelete = (item: ItemGroupDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      setDeletingId(selectedItem.id);
      try {
        const response = await api.delete(`/item-group/${selectedItem.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
          fetchItemGroups();
        }
      } catch (err) {
        console.error('Error deleting item group:', err);
        alert('Failed to delete item group');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = (item: ItemGroupDisplay) => {
    setEditForm({
      id: item.id,
      itemGroupName: item.itemGroupName,
      parentItemGroup: item.parentItemGroup === 'NA' || item.parentItemGroup === 'N/A' ? '' : item.parentItemGroup,
      isGroup: item.isGroup,
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (editSubmitting) return;
    setShowEditModal(false);
    setEditForm(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    if (!editForm.itemGroupName.trim()) {
      setEditError('Item group name is required');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      const payload = {
        id: Number(editForm.id),
        item_group_name: editForm.itemGroupName.trim(),
        parent_item_group: editForm.parentItemGroup || 'NA',
        is_group: editForm.isGroup ? 1 : 0,
        modified_by: 'Administrator',
      };

      const response = await api.put('/item-group', payload);

      if (response.data && response.data.success === 1) {
        setItemGroups((prev) =>
          prev.map((g) =>
            g.id === editForm.id
              ? { ...g, itemGroupName: payload.item_group_name, parentItemGroup: payload.parent_item_group }
              : g
          )
        );
        setShowEditModal(false);
        setEditForm(null);
      } else {
        setEditError(response.data?.message || 'Failed to update item group');
      }
    } catch (err: any) {
      console.error('Error updating item group:', err);
      if (err.response) {
        setEditError(err.response.data?.message || 'Failed to update item group');
      } else if (err.request) {
        setEditError('Network error. Please check your connection.');
      } else {
        setEditError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleView = (item: ItemGroupDisplay) => {
    navigate(`/item-group/${encodeURIComponent(item.id)}`);
  };

  const goBackToList = () => {
    navigate('/item-group');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setDateFilterActive(false);
    if (!isDetailView) {
      fetchItemGroups();
    }
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  if (isDetailView) {
    return (
      <div className={`igl-page ${theme}`}>
        <div className="igl-detail-header">
          <button className="igl-back-btn" onClick={goBackToList}>
            <FaArrowLeft size={14} /> Back to List
          </button>
          <h1 className="igl-detail-title">
            {detailLoading ? 'Loading...' : detailData?.item_group_name || 'Item Group Details'}
          </h1>
        </div>

        {detailLoading && (
          <div className="igl-loading">
            <FaSpinner className="igl-spin" size={32} />
            <p>Loading item group details...</p>
          </div>
        )}

        {detailError && (
          <div className="igl-error">
            <p>{detailError}</p>
            <button onClick={() => id && fetchItemGroupDetail(id)} className="igl-retry-btn">
              Retry
            </button>
          </div>
        )}

        {!detailLoading && !detailError && detailData && (
          <div className="igl-detail-content">
            <div className="igl-detail-section">
              <h3 className="igl-detail-section-title">GENERAL SETTINGS</h3>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>PARENT ITEM GROUP</label>
                  <span>{detailData.parent_item_group || 'N/A'}</span>
                </div>
              </div>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>Is Group</label>
                  <span>{detailData.is_group === 1 ? 'Parent Group' : 'Sub Item'}</span>
                </div>
              </div>
            </div>

            <div className="igl-detail-section">
              <h3 className="igl-detail-section-title">ITEM GROUP DEFAULTS</h3>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>NO. COMPANY</label>
                  <span>{detailData.company || 'N/A'}</span>
                </div>
              </div>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>ITEM TAX</label>
                  <span>{detailData.item_tax_template || 'N/A'}</span>
                </div>
              </div>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>TAX CATEGORY</label>
                  <span>{detailData.tax_category || 'N/A'}</span>
                </div>
              </div>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>VALID FROM</label>
                  <span>{detailData.valid_from ? formatDisplayDate(detailData.valid_from) : 'N/A'}</span>
                </div>
              </div>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>MIN NET RATE</label>
                  <span>{detailData.min_net_rate ?? 'N/A'}</span>
                </div>
              </div>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>MAX NET RATE</label>
                  <span>{detailData.max_net_rate ?? 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="igl-detail-section">
              <h3 className="igl-detail-section-title">COMMENTS</h3>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <span>{detailData.comments || 'No comments'}</span>
                </div>
              </div>
            </div>

            <div className="igl-detail-section">
              <h3 className="igl-detail-section-title">DEFAULT WAREHOUSE</h3>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>DEFAULT PRICE LIST</label>
                  <span>{detailData.default_price_list || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="igl-detail-section">
              <h3 className="igl-detail-section-title">DEFAULTS</h3>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>DEFAULT PRICE LIST</label>
                  <span>{detailData.default_price_list || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="igl-detail-section">
              <h3 className="igl-detail-section-title">TAX CATEGORY</h3>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>TAX CATEGORY</label>
                  <span>{detailData.tax_category || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="igl-detail-section">
              <h3 className="igl-detail-section-title">META INFORMATION</h3>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>Created</label>
                  <span>{formatDisplayDate(detailData.creation)}</span>
                </div>
              </div>
              <div className="igl-detail-row">
                <div className="igl-detail-field">
                  <label>Modified</label>
                  <span>{formatDisplayDate(detailData.modified)}</span>
                </div>
              </div>
            </div>

            {detailData.is_editable !== 0 && (
              <div className="igl-detail-actions">
                <button
                  className="igl-btn-save"
                  onClick={() => {
                    navigate('/item-group');
                    setTimeout(() => {
                      const item = itemGroups.find(g => g.id === detailData.id.toString());
                      if (item) handleEdit(item);
                    }, 100);
                  }}
                >
                  <FaEdit size={12} /> Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Loading Screen ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
        <PageLoader
          message="Loading Setup & Item Group List..."
        //subtitle="Calculating bill of materials, operations rates, and component structures"
        />
      </div>
    );
  }

  return (
    <div className={`igl-page ${theme}`}>
      <style>{`
        /* ── Active Filters ── */
        .igl-active-filters {
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
          margin-bottom: 12px;
        }

        .igl-active-filters span {
          color: var(--text-primary, #111827);
        }

        .igl-clear-filters {
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

        .igl-clear-filters:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        /* ── Filter Bar ── */
        .igl-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          flex-shrink: 0;
          padding: 12px 0;
        }

        .igl-filter-left {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 200px;
        }

        .igl-search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .igl-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary, #9ca3af);
          font-size: 14px;
        }

        .igl-search-input {
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

        .igl-search-input:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .igl-search-input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .igl-search-clear {
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

        .igl-filter-select {
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

        .igl-filter-select:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .igl-filter-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ── Date Filter ── */
        .igl-date-filter-wrapper {
          position: relative;
          display: inline-block;
        }

        .igl-date-filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: var(--card-bg, white);
          color: var(--text-primary, #374151);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          height: 38px;
          white-space: nowrap;
        }

        .igl-date-filter-btn:hover {
          border-color: var(--primary-color, #2563eb);
          background: var(--hover-bg, #f8fafc);
        }

        .igl-date-filter-btn svg {
          color: var(--primary-color, #2563eb);
        }

        .igl-date-filter-active {
          border-color: var(--primary-color, #2563eb);
          background: var(--hover-bg, #f8fafc);
        }

        .igl-date-picker-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          box-shadow: 0 10px 40px var(--shadow-color, rgba(0,0,0,0.15));
          padding: 16px;
          z-index: 1000;
          min-width: 340px;
          width: 340px;
        }

        .igl-date-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .igl-date-picker-header span {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .igl-date-picker-header button {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .igl-date-picker-header button:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .igl-date-range-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--hover-bg, #f8fafc);
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .igl-date-range-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .igl-date-range-label {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-secondary, #6b7280);
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .igl-date-range-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
        }

        .igl-date-range-separator {
          color: var(--text-secondary, #6b7280);
          font-weight: 300;
        }

        .igl-date-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .igl-date-preset-btn {
          padding: 4px 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          background: var(--card-bg, #fff);
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .igl-date-preset-btn:hover {
          border-color: var(--primary-color, #2563eb);
          color: var(--primary-color, #2563eb);
        }

        .igl-calendar {
          margin-bottom: 12px;
        }

        .igl-calendar-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .igl-calendar-nav-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .igl-calendar-nav-btn:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .igl-calendar-month-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .igl-calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 4px;
        }

        .igl-calendar-weekdays span {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          padding: 4px 0;
        }

        .igl-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .igl-calendar-day {
          text-align: center;
          padding: 6px 4px;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary, #1e293b);
          border: none;
          background: transparent;
        }

        .igl-calendar-day-empty {
          cursor: default;
        }

        .igl-calendar-day:hover:not(.igl-calendar-day-empty):not(.igl-calendar-day-selected) {
          background: var(--hover-bg, #f3f4f6);
        }

        .igl-calendar-day-in-range {
          background: rgba(37, 99, 235, 0.1);
        }

        .igl-calendar-day-selected {
          background: var(--primary-color, #2563eb);
          color: #fff;
          font-weight: 600;
        }

        .igl-date-picker-footer {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .igl-date-clear-btn {
          padding: 6px 16px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .igl-date-clear-btn:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .igl-date-apply-btn {
          padding: 6px 16px;
          border: none;
          border-radius: 6px;
          background: var(--primary-color, #2563eb);
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .igl-date-apply-btn:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        /* ── Table ── */
        .igl-table-wrap {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,0.05));
          border: 1px solid var(--border-color, #e5e7eb);
          overflow-x: auto;
          overflow-y: visible;
          flex: 0 0 auto;
        }

        .igl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 700px;
        }

        .igl-th {
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

        .igl-th-meta {
          text-align: right;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .igl-count-label {
          font-size: 11px;
          font-weight: 400;
          color: var(--text-secondary, #9ca3af);
          text-transform: none;
        }

        .igl-tr {
          cursor: default;
          transition: background 0.15s;
        }

        .igl-tr:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .igl-td {
          padding: 12px 16px;
          color: var(--text-primary, #374151);
          vertical-align: middle;
          text-align: left;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
        }

        .igl-td-id {
          font-weight: 500;
          color: var(--primary-color, #6366f1);
        }

        .igl-td-meta {
          text-align: right;
        }

        /* ── Status Badge ── */
        .igl-status-badge {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          gap: 4px;
        }

        .igl-status-group {
          background: #dbeafe;
          color: #2563eb;
        }

        .igl-status-item {
          background: #f3f4f6;
          color: #6b7280;
        }

        /* ── Action Buttons ── */
        .igl-action-buttons {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .igl-action-btn {
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

        .igl-action-btn:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .igl-action-view:hover {
          color: var(--primary-color, #2563eb);
        }

        .igl-action-edit:hover {
          color: #f59e0b;
        }

        .igl-action-delete:hover {
          color: var(--danger-color, #ef4444);
        }

        /* ── Loading, Error, Empty ── */
        .igl-loading, .igl-error, .igl-empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .igl-loading p, .igl-error p, .igl-empty-state p {
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
          margin-top: 12px;
        }

        .igl-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary, #6b7280);
        }

        .igl-empty-content p {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
          margin: 0;
        }

        .igl-empty-content span {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .igl-retry-btn {
          margin-top: 12px;
          padding: 8px 20px;
          background: var(--primary-color, #2563eb);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .igl-retry-btn:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .igl-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Pagination Styles - Single line layout ── */
        .igl-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 8px 0;
          border-top: 1px solid var(--border-color, #e5e7eb);
          margin-top: 8px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .igl-pagination-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .igl-pagination-left select {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
        }

        .igl-pagination-left select:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
        }

        .igl-pagination-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .igl-page-btn {
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

        .igl-page-btn:hover:not(:disabled):not(.igl-page-btn-active) {
          background: var(--nav-hover, #f8fafc);
          border-color: var(--primary-color, #2563eb);
        }

        .igl-page-btn-active {
          background: var(--primary-color, #2563eb);
          border-color: var(--primary-color, #2563eb);
          color: #fff;
        }

        .igl-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .igl-pagination-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .igl-pagination-label {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .igl-pagination-info {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        /* ── Modal Styles ── */
        .igl-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .igl-modal {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .igl-modal-delete {
          max-width: 420px;
        }

        .igl-modal-edit {
          max-width: 480px;
        }

        .igl-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .igl-modal-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .igl-modal-close {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .igl-modal-close:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .igl-modal-body {
          padding: 20px;
          color: var(--text-primary, #1e293b);
        }

        .igl-modal-item-name {
          padding: 8px 12px;
          background: var(--hover-bg, #f8fafc);
          border-radius: 6px;
          margin: 8px 0;
        }

        .igl-modal-warning {
          color: var(--danger-color, #ef4444);
          font-size: 13px;
          margin-top: 8px;
        }

        .igl-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .igl-btn-cancel {
          padding: 8px 16px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .igl-btn-cancel:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .igl-btn-delete {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: var(--danger-color, #ef4444);
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .igl-btn-delete:hover {
          background: var(--danger-hover, #dc2626);
        }

        .igl-btn-save {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: var(--primary-color, #2563eb);
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .igl-btn-save:hover:not(:disabled) {
          background: var(--primary-hover, #1d4ed8);
        }

        .igl-btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .igl-edit-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .igl-edit-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--primary-color, #2563eb);
          color: #fff;
        }

        .igl-edit-header-text {
          flex: 1;
        }

        .igl-edit-header-text .igl-modal-title {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .igl-edit-subtitle {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .igl-edit-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .igl-edit-field {
          margin-bottom: 16px;
        }

        .igl-edit-field:last-of-type {
          margin-bottom: 0;
        }

        .igl-edit-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
          margin-bottom: 6px;
        }

        .igl-edit-label-icon {
          color: var(--text-secondary, #6b7280);
        }

        .igl-required {
          color: #ef4444;
        }

        .igl-edit-input,
        .igl-edit-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 13px;
          background: var(--input-bg, #fff);
          color: var(--text-primary, #1e293b);
          transition: all 0.2s;
          min-height: 38px;
        }

        .igl-edit-input:focus,
        .igl-edit-select:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .igl-edit-input:disabled,
        .igl-edit-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .igl-edit-hint {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          margin-top: 4px;
        }

        /* ── Dark Theme ── */
        .dark-theme .igl-page {
          background: var(--layout-bg, #0f172a);
        }

        .dark-theme .igl-search-input {
          background: var(--input-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-search-input::placeholder {
          color: var(--text-secondary, #64748b);
        }

        .dark-theme .igl-filter-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-date-filter-btn {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-date-filter-btn:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .igl-date-picker-dropdown {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .igl-date-picker-header span {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-date-range-display {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .igl-date-range-value {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-date-preset-btn {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .igl-date-preset-btn:hover {
          border-color: var(--primary-color, #3b82f6);
          color: var(--primary-color, #3b82f6);
        }

        .dark-theme .igl-calendar-day {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-calendar-day:hover:not(.igl-calendar-day-empty):not(.igl-calendar-day-selected) {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .igl-calendar-weekdays span {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .igl-calendar-month-label {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-table-wrap {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .igl-th {
          background: var(--layout-bg, #0f172a);
          color: var(--text-secondary, #94a3b8);
          border-bottom-color: var(--border-color, #334155);
        }

        .dark-theme .igl-td {
          color: var(--text-primary, #f8fafc);
          border-bottom-color: var(--border-color, #334155);
        }

        .dark-theme .igl-tr:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .igl-count-label {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .igl-active-filters {
          background: rgba(99, 102, 241, 0.08);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .igl-active-filters span {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-clear-filters {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .igl-page-btn {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-page-btn:hover:not(:disabled):not(.igl-page-btn-active) {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .igl-page-size-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-empty-content p {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-empty-content span {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .igl-modal {
          background: var(--card-bg, #1e293b);
        }

        .dark-theme .igl-modal-title {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-modal-body {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-edit-header-text .igl-modal-title {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-edit-subtitle {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .igl-edit-label {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-edit-input,
        .dark-theme .igl-edit-select {
          background: var(--input-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .igl-edit-input:focus,
        .dark-theme .igl-edit-select:focus {
          border-color: var(--primary-color, #3b82f6);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .igl-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .igl-filter-left {
            width: 100%;
          }

          .igl-search-wrapper {
            max-width: 100%;
          }

          .igl-filter-right {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .igl-table {
            min-width: 600px;
          }

          .igl-pagination {
            flex-direction: column;
            align-items: center;
          }

          .igl-pagination-center {
            order: 2;
          }

          .igl-pagination-left,
          .igl-pagination-right {
            order: 1;
          }

          .igl-td {
            padding: 10px 12px;
            font-size: 12px;
          }

          .igl-th {
            padding: 10px 12px;
            font-size: 11px;
          }

          .igl-date-picker-dropdown {
            left: 0;
            min-width: 100%;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .igl-filter-right {
            flex-direction: column;
            width: 100%;
          }

          .igl-filter-right > * {
            width: 100%;
          }

          .igl-date-filter-btn {
            justify-content: center;
            width: 100%;
          }

          .igl-pagination {
            padding: 8px 0 0 0;
          }

          .igl-pagination-center {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>

      <div className="igl-filter-bar">
        <div className="igl-filter-left">
          <div className="igl-search-wrapper">
            <FaSearch className="igl-search-icon" />
            <input
              type="text"
              placeholder="Search item groups..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="igl-search-input"
            />
            {searchTerm && (
              <button className="igl-search-clear" onClick={() => handleSearch('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="igl-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="igl-filter-select"
          >
            <option value="all">All Types</option>
            <option value="group">Parent Groups</option>
            <option value="item">Sub Items</option>
          </select>

          {/* Date Filter Button with Calendar Icon */}
          <div className="igl-date-filter-wrapper" ref={datePickerRef}>
            <button
              className={`igl-date-filter-btn ${dateFilterActive ? 'igl-date-filter-active' : ''}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <FaCalendarAlt size={14} />
              <span>{formatButtonRangeLabel()}</span>
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="igl-date-picker-dropdown">
                <div className="igl-date-picker-header">
                  <span>Filter by Date</span>
                  <button onClick={() => setShowDatePicker(false)}>
                    <FaTimes size={14} />
                  </button>
                </div>

                <div className="igl-date-picker-body">
                  {/* Date Range Display - Like Screenshot */}
                  <div className="igl-date-range-display">
                    <div className="igl-date-range-item">
                      <span className="igl-date-range-label">From</span>
                      <span className="igl-date-range-value">
                        {fromDate ? formatDateForDisplay(fromDate) : 'Select date'}
                      </span>
                    </div>
                    <span className="igl-date-range-separator">—</span>
                    <div className="igl-date-range-item">
                      <span className="igl-date-range-label">To</span>
                      <span className="igl-date-range-value">
                        {toDate ? formatDateForDisplay(toDate) : 'Select date'}
                      </span>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="igl-date-presets">
                    <button onClick={() => setDateRange('today')} className="igl-date-preset-btn">Today</button>
                    <button onClick={() => setDateRange('last7days')} className="igl-date-preset-btn">Last 7 Days</button>
                    <button onClick={() => setDateRange('last30days')} className="igl-date-preset-btn">Last 30 Days</button>
                    <button onClick={() => setDateRange('thisMonth')} className="igl-date-preset-btn">This Month</button>
                  </div>

                  {/* Calendar */}
                  <div className="igl-calendar">
                    <div className="igl-calendar-nav">
                      <button
                        type="button"
                        className="igl-calendar-nav-btn"
                        onClick={goToPrevMonth}
                        aria-label="Previous month"
                      >
                        <FaChevronLeft size={12} />
                      </button>
                      <span className="igl-calendar-month-label">{calendarMonthLabel}</span>
                      <button
                        type="button"
                        className="igl-calendar-nav-btn"
                        onClick={goToNextMonth}
                        aria-label="Next month"
                      >
                        <FaChevronRight size={12} />
                      </button>
                    </div>

                    <div className="igl-calendar-weekdays">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>

                    <div className="igl-calendar-grid">
                      {getCalendarDays().map((day, idx) => {
                        if (day === null) {
                          return <span key={`empty-${idx}`} className="igl-calendar-day igl-calendar-day-empty" />;
                        }
                        const isFrom = isSameDay(fromDate, calendarYear, calendarMonth, day);
                        const isTo = isSameDay(toDate, calendarYear, calendarMonth, day);
                        const inRange = isDayInRange(calendarYear, calendarMonth, day);
                        const classNames = [
                          'igl-calendar-day',
                          (isFrom || isTo) ? 'igl-calendar-day-selected' : '',
                          inRange ? 'igl-calendar-day-in-range' : '',
                        ].filter(Boolean).join(' ');
                        return (
                          <button
                            type="button"
                            key={`${calendarYear}-${calendarMonth}-${day}`}
                            className={classNames}
                            onClick={() => handleCalendarDayClick(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer with Clear and Apply */}
                <div className="igl-date-picker-footer">
                  <button onClick={clearDateFilter} className="igl-date-clear-btn">
                    Clear
                  </button>
                  <button onClick={applyDateFilter} className="igl-date-apply-btn">
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {(searchTerm || statusFilter !== 'all' || dateFilterActive) && (
        <div className="igl-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Type:</strong> {statusFilter === 'group' ? 'Parent Groups' : 'Sub Items'}
            </span>
          )}
          {dateFilterActive && fromDate && toDate && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>From:</strong> {formatDateForDisplay(fromDate)} <strong>To:</strong> {formatDateForDisplay(toDate)}
            </span>
          )}
          <button onClick={clearFilters} className="igl-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="igl-loading">
          <p>Loading item groups...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="igl-error">
          <p>{error}</p>
          <button onClick={fetchItemGroups} className="igl-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="igl-table-wrap sales-desktop-table-wrap">
            <table className="igl-table">
              <thead>
                <tr>
                  <th className="igl-th">ID</th>
                  <th className="igl-th">Item Group Name</th>
                  <th className="igl-th">Parent Item Group</th>
                  <th className="igl-th">Type</th>
                  <th className="igl-th igl-th-meta">
                    <span className="igl-count-label">
                      {totalFilteredItems > 0
                        ? `${getStartIndex()}–${getEndIndex()}`
                        : '0'} of {totalFilteredItems}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="igl-empty-state">
                      <div className="igl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <p>No item groups found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.id} className="igl-tr">
                      <td className="igl-td igl-td-id">{row.id}</td>
                      <td className="igl-td">{row.itemGroupName}</td>
                      <td className="igl-td">{row.parentItemGroup}</td>
                      <td className="igl-td">
                        <span className={`igl-status-badge ${row.isGroup ? 'igl-status-group' : 'igl-status-item'}`}>
                          {row.isGroup ? 'Parent Group' : 'Sub Item'}
                        </span>
                      </td>
                      <td className="igl-td igl-td-meta">
                        <div className="igl-action-buttons">
                          <button className="wl-action-btn wl-action-view" onClick={(e) => { e.stopPropagation(); handleView(row); }} title="View">
                            <FaEye size={12} />
                          </button>
                          {row.isEditable && (
                            <>
                              <button className="igl-action-btn igl-action-edit" onClick={(e) => { e.stopPropagation(); handleEdit(row); }} title="Edit">
                                <FaEdit size={12} />
                              </button>
                              <button className="igl-action-btn igl-action-delete" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} title="Delete">
                                <FaTrash size={12} />
                              </button>
                            </>
                          )}
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
                <span className="sales-mobile-th-cell">Item Group Name</span>
                <span className="sales-mobile-th-sep">•</span>
                <span className="sales-mobile-th-cell">Type</span>
              </div>
              <div className="sales-mobile-th-right">
                <span className="sales-count-label">
                  {totalFilteredItems > 0
                    ? `${getStartIndex()}–${getEndIndex()}`
                    : '0'} of {totalFilteredItems}
                </span>
              </div>
            </div>

            {paginatedData.length === 0 ? (
              <div className="igl-empty-state">
                <div className="igl-empty-content">
                  <p>No Item Groups found</p>
                  <span>Try adjusting your search criteria</span>
                </div>
              </div>
            ) : (
              <div className="sales-mobile-cards">
                {paginatedData.map((row, idx) => {
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

                  function handleView(item: ItemGroupDisplay) {
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
                              {row.itemGroupName || "—"}
                            </span>
                            <span className="sales-mobile-header-badge">
                              <span className={`igl-status-badge ${row.isGroup ? 'igl-status-group' : 'igl-status-item'}`}>
                                {row.isGroup ? 'Parent Group' : 'Sub Item'}

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
                            <span className="sales-mobile-detail-label">Parent Item Group</span>
                            <span className="sales-mobile-detail-value">
                              {row.parentItemGroup}
                            </span>
                          </div>

                          <div className="sales-mobile-detail-footer">
                            <span className="sales-mobile-card-meta-text">
                              {/*rowNumber} of {totalFilteredItems*/}
                            </span>
                            <div className="sales-mobile-action-buttons">
                              <button
                                className="wl-action-btn wl-action-view"
                                onClick={(e) => { e.stopPropagation(); handleView(row); }}

                                title="View "
                              >
                                <FaEye size={12} />
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

          {/* ✅ Pagination - Single line layout */}
          <div className="igl-pagination">
            {/* Left: Show dropdown + Showing entries info */}
            <div className="igl-pagination-left">
              <span className="igl-pagination-label">Show:</span>
              <select value={itemsPerPage} onChange={(e) => handlePageSizeChange(Number(e.target.value))} className="igl-page-size-select">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="igl-pagination-info">
                {totalFilteredItems > 0 ? (
                  `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                ) : (
                  'No entries to show'
                )}
              </span>
            </div>

            {/* Center: Page navigation buttons */}
            <div className="igl-pagination-center">
              <button onClick={goToFirstPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="igl-page-btn">
                <FaAngleDoubleLeft size={12} />
              </button>
              <button onClick={goToPrevPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="igl-page-btn">
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map(page => (
                <button key={page} onClick={() => goToPage(page)} className={`igl-page-btn ${currentPage === page ? 'igl-page-btn-active' : ''}`}>
                  {page}
                </button>
              ))}
              <button onClick={goToNextPage} disabled={currentPage === totalPages || totalFilteredItems === 0} className="igl-page-btn">
                <FaChevronRight size={12} />
              </button>
              <button onClick={goToLastPage} disabled={currentPage === totalPages || totalFilteredItems === 0} className="igl-page-btn">
                <FaAngleDoubleRight size={12} />
              </button>
            </div>

            {/* Right: Page info */}
            <div className="igl-pagination-right">
              <span className="igl-pagination-info">
                Page {currentPage} of {totalPages || 1}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="igl-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="igl-modal igl-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="igl-modal-header">
              <span className="igl-modal-title">Confirm Delete</span>
              <button className="igl-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="igl-modal-body">
              <p>Are you sure you want to delete this item group?</p>
              <p className="igl-modal-item-name"><strong>{selectedItem.itemGroupName}</strong></p>
              <p className="igl-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="igl-modal-footer">
              <button className="igl-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="igl-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Group Modal */}
      {showEditModal && editForm && (
        <div className="igl-modal-overlay" onClick={closeEditModal}>
          <div className="igl-modal igl-modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="igl-edit-header">
              <div className="igl-edit-header-icon">
                <FaEdit size={16} />
              </div>
              <div className="igl-edit-header-text">
                <span className="igl-modal-title">Edit Item Group</span>
                <span className="igl-edit-subtitle">Update the details for this item group</span>
              </div>
              <button className="igl-modal-close" onClick={closeEditModal} disabled={editSubmitting} type="button">
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="igl-modal-body">
                {editError && (
                  <div className="igl-edit-error">
                    <FaTimes size={12} />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="igl-edit-field igl-edit-field-name">
                  <label className="igl-edit-label">
                    <FaTag className="igl-edit-label-icon" />
                    Item Group Name <span className="igl-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="igl-edit-input"
                    value={editForm.itemGroupName}
                    onChange={(e) => setEditForm({ ...editForm, itemGroupName: e.target.value })}
                    placeholder="Enter item group name"
                    disabled={editSubmitting}
                    autoFocus
                  />
                </div>

                <div className="igl-edit-field igl-edit-field-parent">
                  <label className="igl-edit-label">
                    <FaFolder className="igl-edit-label-icon" />
                    Parent Item Group
                  </label>
                  <select
                    className="igl-edit-select"
                    value={editForm.parentItemGroup}
                    onChange={(e) => setEditForm({ ...editForm, parentItemGroup: e.target.value })}
                    disabled={editSubmitting}
                  >
                    <option value="">-- None --</option>
                    {parentGroupOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <p className="igl-edit-hint">Choose the parent this group should nest under</p>
                </div>
              </div>

              <div className="igl-modal-footer">
                <button type="button" className="igl-btn-cancel" onClick={closeEditModal} disabled={editSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="igl-btn-save" disabled={editSubmitting}>
                  {editSubmitting ? <FaSpinner className="igl-spin" size={12} /> : <FaSave size={12} />}
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}