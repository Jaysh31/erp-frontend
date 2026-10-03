// WorkOrderList.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaFilter,
  FaSpinner,
  FaCalendarAlt,
  FaCheckCircle,
  FaPlay,
  FaClock,
  FaStop,
  FaFileAlt,
  FaBox,
  FaWrench,
  FaList,
  FaChevronDown,
} from 'react-icons/fa';
import "./WorkOrder.css";
import { PageLoader } from "../components/PageLoader.tsx";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

// ═══════════════════════════════════════════════════════════════════════
// 🆕 Filter preservation helpers
// ═══════════════════════════════════════════════════════════════════════
const WO_PRESERVE_FLAG_KEY = "__wo_preserve_filters__";
const WO_FILTER_DATA_KEY = "__wo_list_filters__";

// Install the history observer exactly once per browser tab
if (typeof window !== "undefined" && !(window as any).__woNavObserverInstalled) {
  (window as any).__woNavObserverInstalled = true;

  const clearFlagIfLeavingWorkOrder = () => {
    try {
      const path = window.location.pathname;
      if (!path.startsWith("/work-order")) {
        sessionStorage.removeItem(WO_PRESERVE_FLAG_KEY);
      }
    } catch {
      /* ignore */
    }
  };

  const origPush = window.history.pushState;
  const origReplace = window.history.replaceState;

  window.history.pushState = function (...args: any[]) {
    const r = origPush.apply(this as any, args as any);
    clearFlagIfLeavingWorkOrder();
    return r;
  };
  window.history.replaceState = function (...args: any[]) {
    const r = origReplace.apply(this as any, args as any);
    clearFlagIfLeavingWorkOrder();
    return r;
  };
  window.addEventListener("popstate", clearFlagIfLeavingWorkOrder);
}

type Status = "Draft" | "Not Started" | "In Process" | "Completed" | "Stopped";
type OrderType = "all" | "internal" | "external";

interface WorkOrder {
  id: number;
  name: string;
  production_item: string;
  bom_no: string;
  qty: number;
  produced_qty: number;
  company: string;
  status: Status;
  planned_start_date: string;
  planned_end_date: string;
  total_job_cards?: number;
  completed_job_cards?: number;
  job_card_progress?: string;
  type?: string;
  selected_grn_id?: number;
  supplier_name?: string;
}

interface WorkOrderDisplay {
  id: string;
  name: string;
  productionItem: string;
  qty: number;
  producedQty: number;
  status: Status;
  plannedStartDate: string;
  plannedEndDate: string;
  progress: number;
  createdAgo: string;
  totalJobCards: number;
  completedJobCards: number;
  jobCardProgress: string;
  canComplete: boolean;
  type: OrderType;
  supplierName?: string;
  displayStartDate?: string;
  displayEndDate?: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: WorkOrder[];
  };
}

const STATUS_CLASS: Record<Status, string> = {
  Draft: "s-draft",
  "Not Started": "s-notstarted",
  "In Process": "s-inprocess",
  Completed: "s-completed",
  Stopped: "s-stopped",
};

const STATUS_LABELS: Record<Status, string> = {
  Draft: "Draft",
  "Not Started": "Not Started",
  "In Process": "In Process",
  Completed: "Completed",
  Stopped: "Stopped",
};

const TYPE_LABELS: Record<string, string> = {
  internal: "Product",
  external: "Service",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  internal: <FaBox size={11} />,
  external: <FaWrench size={11} />,
};

// 🆕 Map chatbot status keywords → Work Order status values
const URL_STATUS_TO_WO_STATUS: Record<string, Status> = {
  "completed":        "Completed",
  "complete":         "Completed",
  "done":             "Completed",
  "finished":         "Completed",
  "closed":           "Completed",
  "draft":            "Draft",
  "open":             "Not Started",
  "not started":      "Not Started",
  "pending":          "Not Started",
  "in process":       "In Process",
  "in-process":       "In Process",
  "in progress":      "In Process",
  "in-progress":      "In Process",
  "processing":       "In Process",
  "ongoing":          "In Process",
  "running":          "In Process",
  "work in progress": "In Process",
  "stopped":          "Stopped",
  "on hold":          "Stopped",
  "on-hold":          "Stopped",
  "hold":             "Stopped",
  "cancelled":        "Stopped",
  "canceled":         "Stopped",
  "cancel":           "Stopped",
};

function resolveWorkOrderStatus(rawStatus: string): Status | null {
  if (!rawStatus) return null;
  const norm = rawStatus.toLowerCase().trim();
  if (URL_STATUS_TO_WO_STATUS[norm]) return URL_STATUS_TO_WO_STATUS[norm];

  for (const [key, val] of Object.entries(URL_STATUS_TO_WO_STATUS)) {
    if (norm.includes(key) || key.includes(norm)) return val;
  }
  return null;
}

export default function WorkOrderList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 🆕 URL-driven status filter
  const urlStatus = searchParams.get("status") || "";
  const urlAutoFilter = searchParams.get("autoFilter") === "1";
  const isUrlFiltered = !!urlStatus && urlAutoFilter;

  const { theme } = useAdminTheme();

  const [loading, setLoading] = useState(false);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 FIX: `initialLoading` is ONLY true for the very first data load.
  //    Subsequent fetches (e.g. typing in the search box) keep the page
  //    mounted, so the search input never loses focus / caret position.
  // ═════════════════════════════════════════════════════════════════════
  const [initialLoading, setInitialLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<OrderType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkOrderDisplay | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrderDisplay[]>([]);
  const [completionProgress] = useState<number>(0);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 🆕 Gates the initial fetch until filter restoration is done.
  const [filtersReady, setFiltersReady] = useState(false);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 RESTORE FILTERS ON MOUNT
  // ═════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let shouldPreserve = false;
    try {
      shouldPreserve =
        sessionStorage.getItem(WO_PRESERVE_FLAG_KEY) === "true";
      sessionStorage.removeItem(WO_PRESERVE_FLAG_KEY);
    } catch {
      /* ignore */
    }

    if (shouldPreserve) {
      try {
        const saved = sessionStorage.getItem(WO_FILTER_DATA_KEY);
        if (saved) {
          const f = JSON.parse(saved);
          if (typeof f.searchTerm === "string")     setSearchTerm(f.searchTerm);
          if (typeof f.statusFilter === "string")   setStatusFilter(f.statusFilter);
          if (typeof f.dateFilter === "string")     setDateFilter(f.dateFilter);
          if (typeof f.fromDate === "string")       setFromDate(f.fromDate);
          if (typeof f.toDate === "string")         setToDate(f.toDate);
          if (typeof f.activeTab === "string")      setActiveTab(f.activeTab as OrderType);
          if (typeof f.currentPage === "number")    setCurrentPage(f.currentPage);
          if (typeof f.itemsPerPage === "number")   setItemsPerPage(f.itemsPerPage);
          console.log("♻️ Restored work-order filters from session:", f);
        }
      } catch (e) {
        console.warn("⚠️ Failed to restore work-order filters:", e);
      }
    } else {
      try {
        sessionStorage.removeItem(WO_FILTER_DATA_KEY);
      } catch {
        /* ignore */
      }
    }

    setFiltersReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 SAVE FILTERS ON EVERY CHANGE
  // ═════════════════════════════════════════════════════════════════════
  const hasMountedSaveRef = useRef(false);
  useEffect(() => {
    if (!hasMountedSaveRef.current) {
      hasMountedSaveRef.current = true;
      return;
    }
    try {
      sessionStorage.setItem(
        WO_FILTER_DATA_KEY,
        JSON.stringify({
          searchTerm,
          statusFilter,
          dateFilter,
          fromDate,
          toDate,
          activeTab,
          currentPage,
          itemsPerPage,
        })
      );
    } catch {
      /* ignore */
    }
  }, [
    searchTerm,
    statusFilter,
    dateFilter,
    fromDate,
    toDate,
    activeTab,
    currentPage,
    itemsPerPage,
  ]);

  // 🆕 Wrapper that sets the preserve flag before navigating to a
  //    work-order sub-route.
  const navigateWithPreserve = useCallback(
    (path: string) => {
      try {
        sessionStorage.setItem(WO_PRESERVE_FLAG_KEY, "true");
      } catch {
        /* ignore */
      }
      navigate(path);
    },
    [navigate]
  );

  // 🆕 Sync URL status → statusFilter dropdown
  useEffect(() => {
    if (isUrlFiltered && urlStatus) {
      const mapped = resolveWorkOrderStatus(urlStatus);
      if (mapped) {
        setStatusFilter(mapped);
        setCurrentPage(1);
      }
    }
  }, [isUrlFiltered, urlStatus]);

  const toggleRowExpand = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const pageSizeOptions = [10, 25, 50, 100];
  const dateFilterOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
  ];

  const formatDateAgo = (dateString: string) => {
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
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calculateJobCardProgress = (total: number = 0, completed: number = 0): number => {
    if (total === 0) return 0;
    return Math.min(Math.round((completed / total) * 100), 100);
  };

  const canCompleteWorkOrder = (status: Status, totalJobCards: number, completedJobCards: number): boolean => {
    if (status === 'Completed' || status === 'Stopped') return false;
    if (totalJobCards === 0) return false;
    return completedJobCards >= totalJobCards;
  };

  const isDateInRange = (dateString: string, filter: string, from?: string, to?: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (from && to) {
      const fromDateObj = new Date(from);
      const toDateObj = new Date(to);
      toDateObj.setHours(23, 59, 59, 999);
      return date >= fromDateObj && date <= toDateObj;
    }
    
    switch (filter) {
      case 'today':
        return date >= today;
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return date >= weekStart;
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return date >= monthStart;
      }
      case 'quarter': {
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        return date >= quarterStart;
      }
      default:
        return true;
    }
  };

  const getWorkOrderType = (item: WorkOrder): OrderType => {
    if (item.selected_grn_id || (item.type && String(item.type).toLowerCase() === "external")) {
      return "external";
    }
    return "internal";
  };

  const transformWorkOrder = (item: WorkOrder): WorkOrderDisplay => {
    const totalJobCards = item.total_job_cards || 0;
    const completedJobCards = item.completed_job_cards || 0;
    const progress = calculateJobCardProgress(totalJobCards, completedJobCards);
    const type = getWorkOrderType(item);
    
    return {
      id: item.id.toString(),
      name: item.name,
      productionItem: item.production_item,
      qty: item.qty,
      producedQty: item.produced_qty,
      status: item.status,
      plannedStartDate: item.planned_start_date,
      plannedEndDate: item.planned_end_date,
      progress: progress,
      createdAgo: formatDateAgo(item.planned_start_date),
      totalJobCards,
      completedJobCards,
      jobCardProgress: item.job_card_progress || `${completedJobCards}/${totalJobCards}`,
      canComplete: canCompleteWorkOrder(item.status, totalJobCards, completedJobCards),
      type,
      supplierName: item.supplier_name || '',
      displayStartDate: formatDisplayDate(item.planned_start_date),
      displayEndDate: formatDisplayDate(item.planned_end_date),
    };
  };

  const fetchAllWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1000');
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await api.get<ApiResponse>(`/work-order?${params.toString()}`);
      if (response.data.success === 1) {
        const { records } = response.data.data;
        const transformedData: WorkOrderDisplay[] = records.map(transformWorkOrder);
        setAllWorkOrders(transformedData);
      } else {
        setError('Failed to fetch work orders');
      }
    } catch (err) {
      console.error('Error fetching work orders:', err);
      setError('An error occurred while fetching work orders');
    } finally {
      setLoading(false);
      // 🆕 Once the first request finishes, never show the full-page
      //    loader again — this keeps the search input mounted & focused.
      setInitialLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, activeTab, fromDate, toDate]);

  // 🆕 Wait for filter restoration before the first fetch.
  useEffect(() => {
    if (filtersReady) {
      fetchAllWorkOrders();
    }
  }, [fetchAllWorkOrders, filtersReady]);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 BASE FILTERED DATA — applies status, date, and date-range filters
  //    but NOT the tab filter. This is the reference set used to compute
  //    the tab counts so the numbers always match what the user sees.
  // ═════════════════════════════════════════════════════════════════════
  const baseFilteredData = useMemo(() => {
    let filtered = allWorkOrders.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesDate = dateFilter === 'all' || isDateInRange(item.plannedStartDate, dateFilter);
      return matchesStatus && matchesDate;
    });

    if (fromDate && toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.plannedStartDate);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        return itemDate >= from && itemDate <= to;
      });
    }

    return filtered;
  }, [allWorkOrders, searchTerm, statusFilter, dateFilter, fromDate, toDate]);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 TAB-FILTERED DATA — further restricted by the active type tab.
  // ═════════════════════════════════════════════════════════════════════
  const filteredData = useMemo(() => {
    if (activeTab === 'all') return baseFilteredData;
    return baseFilteredData.filter(item => item.type === activeTab);
  }, [baseFilteredData, activeTab]);

  const displayTotalItems = filteredData.length;
  const displayTotalPages = Math.max(1, Math.ceil(displayTotalItems / itemsPerPage));

  useEffect(() => {
    if (currentPage > displayTotalPages && displayTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [displayTotalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 FIXED: tab counts now reflect the current filter state (status,
  //    date, date range) instead of the raw dataset. The tab numbers
  //    will match exactly what shows up when the user clicks each tab.
  // ═════════════════════════════════════════════════════════════════════
  const tabCounts = useMemo(() => {
    const internal = baseFilteredData.filter(wo => wo.type === 'internal').length;
    const external = baseFilteredData.filter(wo => wo.type === 'external').length;
    return { internal, external, total: baseFilteredData.length };
  }, [baseFilteredData]);

  const getStartIndex = () => {
    if (displayTotalItems === 0) return 0;
    return (currentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(currentPage * itemsPerPage, displayTotalItems);
  };

  const goToFirstPage = () => { if (displayTotalPages > 0) setCurrentPage(1); };
  const goToLastPage = () => { if (displayTotalPages > 0) setCurrentPage(displayTotalPages); };
  const goToNextPage = () => { if (currentPage < displayTotalPages) setCurrentPage(currentPage + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(displayTotalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: OrderType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ─── Date Filter Handlers ─────────────────────────────────────────────
  const handleApplyDateFilter = () => {
    if (fromDate && toDate) {
      setDateFilter('custom');
      setCurrentPage(1);
      setShowDatePicker(false);
    }
  };

  const handleClearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setDateFilter('all');
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  // ─── Quick Date Filters ──────────────────────────────────────────────
  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    setFromDate(from.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  // ─── Calendar Functions ──────────────────────────────────────────────
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

  // ─── Actions ──────────────────────────────────────────────────────────
  const handleDelete = (item: WorkOrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setDeletingId(selectedItem.id);
    try {
      const response = await api.delete(`/work-order/${selectedItem.id}`);
      if (response.data.success === 1) {
        setShowDeleteConfirm(false);
        setSelectedItem(null);
        setDeletingId(null);
        fetchAllWorkOrders();
      }
    } catch (err) {
      console.error('Error deleting work order:', err);
      alert('Failed to delete work order');
      setDeletingId(null);
    }
  };


  const confirmComplete = async () => {
    if (!selectedItem) return;
    setCompletingId(selectedItem.id);
    try {
      const response = await api.put(`/work-order/${selectedItem.id}`, {
        status: 'Completed',
        produced_qty: selectedItem.qty,
        actual_end_date: new Date().toISOString()
      });
      
      if (response.data.success === 1) {
        setShowCompleteConfirm(false);
        setSelectedItem(null);
        setCompletingId(null);
        fetchAllWorkOrders();
        alert(`Work Order ${selectedItem.name} has been completed successfully!`);
      } else {
        alert('Failed to complete work order. Please try again.');
      }
    } catch (err) {
      console.error('Error completing work order:', err);
      alert('An error occurred while completing the work order.');
    } finally {
      setCompletingId(null);
    }
  };

  // 🆕 Job Cards link intentionally does NOT set the preserve flag.
  const handleViewJobCards = (item: WorkOrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/job-card?work_order=${item.id}`);
  };

  // 🆕 Row click → preserve filters
  const handleRowClick = (item: WorkOrderDisplay) => {
    navigateWithPreserve(`/work-order/${encodeURIComponent(item.id)}`);
  };

  // 🆕 Edit → preserve filters
  const handleEdit = (item: WorkOrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    navigateWithPreserve(`/work-order/${encodeURIComponent(item.id)}`);
  };

  // 🆕 View → preserve filters
  const handleView = (item: WorkOrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    navigateWithPreserve(`/work-order/${encodeURIComponent(item.id)}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setFromDate('');
    setToDate('');
    setActiveTab('all');
    setCurrentPage(1);
  };

  const clearUrlStatusFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    next.delete("autoFilter");
    setSearchParams(next);
    setCurrentPage(1);
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Completed': return <FaCheckCircle size={14} />;
      case 'In Process': return <FaClock size={14} />;
      case 'Not Started': return <FaPlay size={14} />;
      case 'Stopped': return <FaStop size={14} />;
      default: return <FaFileAlt size={14} />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#22c55e';
    if (progress >= 70) return '#3b82f6';
    if (progress >= 40) return '#f59e0b';
    return '#ef4444';
  };

  
  // ─── Loading Screen ─────────────────────────────────────────────────────
  // 🆕 FIX: only the FIRST load shows the full-page loader. Any later
  //    fetch (e.g. while typing in the search box) keeps the page mounted,
  //    so the search input retains focus and the caret position.
  if (initialLoading) {
    return (
      <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
        <PageLoader 
          message="Loading Manufacturing & Work Order..." 
          subtitle="Calculating bill of materials, operations rates, and component structures"
        />
      </div>
    );
  }

  return (
    <div className={`wo-page ${theme}`}>

      {/* 🆕 URL-driven status filter banner */}
      {isUrlFiltered && (
        <div className="wo-url-filter-banner">
          <FaFilter size={12} />
          <span>
            Showing Work Orders with status: <strong>{resolveWorkOrderStatus(urlStatus) || urlStatus}</strong>
          </span>
          <span className="wo-url-filter-count">
            ({displayTotalItems} record{displayTotalItems === 1 ? "" : "s"})
          </span>
          <button
            className="wo-url-filter-clear"
            onClick={clearUrlStatusFilter}
            title="Clear status filter"
          >
            <FaTimes size={10} /> Clear
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="wo-tabs">
        <button
          className={`wo-tab ${activeTab === 'all' ? 'wo-tab--active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <FaList size={14} />
          All Orders
          <span className="wo-tab-count">{tabCounts.total}</span>
        </button>
        <button
          className={`wo-tab ${activeTab === 'internal' ? 'wo-tab--active' : ''}`}
          onClick={() => handleTabChange('internal')}
        >
          <FaBox size={14} />
          Products
          <span className="wo-tab-count">{tabCounts.internal}</span>
        </button>
        <button
          className={`wo-tab ${activeTab === 'external' ? 'wo-tab--active' : ''}`}
          onClick={() => handleTabChange('external')}
        >
          <FaWrench size={14} />
          Services
          <span className="wo-tab-count">{tabCounts.external}</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="wo-filter-bar">
        <div className="wo-filter-left">
          <div className="wo-search-wrapper">
            <FaSearch className="wo-search-icon" />
            <input
              type="text"
              placeholder={`Search ${activeTab !== 'all' ? (activeTab === 'internal' ? 'product' : 'service') + ' ' : ''}work orders by name, item, or supplier...`}
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
            <option value="Draft">Draft</option>
            <option value="Not Started">Not Started</option>
            <option value="In Process">In Process</option>
            <option value="Completed">Completed</option>
            <option value="Stopped">Stopped</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="wo-filter-select"
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Date Range Picker - NEW UI */}
          <div className="wo-date-range-wrapper">
            <button 
              className={`wo-date-toggle-btn ${showDatePicker ? 'active' : ''}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Filter by date range"
            >
              <FaCalendarAlt size={14} />
            </button>
            {showDatePicker && (
              <div className="wo-date-picker-popup">
                <div className="wo-date-picker-header">
                  <span className="wo-date-picker-title">Filter by Date</span>
                </div>
                
                {/* Date Range Display */}
                <div className="wo-date-range-display">
                  {fromDate && toDate ? (
                    <span>{formatDateDisplay(fromDate)} – {formatDateDisplay(toDate)}</span>
                  ) : (
                    <span className="wo-date-range-placeholder">Select date range</span>
                  )}
                </div>

                {/* Quick Filters */}
                <div className="wo-quick-filters">
                  <button className="wo-quick-filter-btn" onClick={() => setQuickDateRange(0)}>Today</button>
                  <button className="wo-quick-filter-btn" onClick={() => setQuickDateRange(7)}>Last 7 Days</button>
                  <button className="wo-quick-filter-btn" onClick={() => setQuickDateRange(30)}>Last 30 Days</button>
                  <button className="wo-quick-filter-btn" onClick={() => setQuickDateRange(90)}>This Month</button>
                </div>

                {/* Calendar */}
                <div className="wo-calendar">
                  <div className="wo-calendar-header">
                    <button className="wo-calendar-nav" onClick={handlePrevMonth}>
                      <FaChevronLeft size={12} />
                    </button>
                    <span className="wo-calendar-month">{getMonthYear(currentMonth)}</span>
                    <button className="wo-calendar-nav" onClick={handleNextMonth}>
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                  <div className="wo-calendar-weekdays">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>
                  <div className="wo-calendar-days">
                    {Array.from({ length: getDaysInMonth(currentMonth).firstDayOfMonth }).map((_, i) => (
                      <span key={`empty-${i}`} className="wo-calendar-day-empty"></span>
                    ))}
                    {Array.from({ length: getDaysInMonth(currentMonth).daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isSelected = isDateSelected(day);
                      return (
                        <button
                          key={day}
                          className={`wo-calendar-day ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleDateClick(day)}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="wo-date-actions">
                  <button 
                    className="wo-btn-clear-filter" 
                    onClick={handleClearDateFilter}
                  >
                    Clear
                  </button>
                  <button 
                    className="wo-btn-apply-filter" 
                    onClick={handleApplyDateFilter}
                    disabled={!fromDate || !toDate}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* 🆕 New Work Order → preserve filters on the way out */}
          <button
            className="wo-btn-primary"
            onClick={() => navigateWithPreserve("/work-order/new")}
          >
            <FaPlus size={12} />
            Add Work Order
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || activeTab !== 'all' || (fromDate && toDate) || isUrlFiltered) && (
        <div className="wo-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {isUrlFiltered && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status (URL):</strong> {resolveWorkOrderStatus(urlStatus) || urlStatus}
            </span>
          )}
          {activeTab !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Type:</strong> {activeTab === 'internal' ? 'Products' : 'Services'}
            </span>
          )}
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {STATUS_LABELS[statusFilter as Status]}
            </span>
          )}
          {fromDate && toDate && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Date Range:</strong> {formatDateDisplay(fromDate)} - {formatDateDisplay(toDate)}
            </span>
          )}
          {dateFilter !== 'all' && dateFilter !== 'custom' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Date:</strong> {dateFilterOptions.find(o => o.value === dateFilter)?.label}
            </span>
          )}
          <button
            onClick={() => {
              clearFilters();
              if (isUrlFiltered) clearUrlStatusFilter();
            }}
            className="wo-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          🆕 FIX: While loading, hide the list/table completely and show
          ONLY the loading indicator. Once loading finishes, the list is
          shown. The filter bar (with search input) stays mounted above,
          so the search box never loses focus.
         ═══════════════════════════════════════════════════════════════ */}
      {loading && (
        <div className="wo-loading">
          <FaSpinner className="spinning" size={24} />
          <p>Loading work orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="wo-error">
          <p>{error}</p>
          <button onClick={fetchAllWorkOrders} className="wo-retry-btn">Retry</button>
        </div>
      )}

      {/* Table — only rendered when NOT loading and NO error */}
      {!loading && !error && (
        <>
          <div className="wo-table-wrap wo-desktop-table-wrap">
            <table className="wo-table">
              <thead>
                <tr>
                  <th className="wo-th">WO #</th>
                  <th className="wo-th">Type</th>
                  <th className="wo-th">Production Item</th>
                  <th className="wo-th">Qty</th>
                  <th className="wo-th">Job Cards</th>
                  <th className="wo-th">Progress</th>
                  <th className="wo-th">Status</th>
                  <th className="wo-th">Planned Dates</th>
                  <th className="wo-th wo-th-meta">
                    <span className="itl-count-label">
                      {displayTotalItems > 0
                        ? `${getStartIndex()}–${getEndIndex()}`
                        : '0'} of {displayTotalItems}
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
                    <td colSpan={9} className="wo-empty-state">
                      <div className="wo-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <p>No {activeTab !== 'all' ? (activeTab === 'internal' ? 'product' : 'service') + ' ' : ''}work orders found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className="wo-tr"
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="wo-td wo-td-id">{row.name}</td>
                      <td className="wo-td">
                        <span className={`wo-type-badge ${row.type === 'internal' ? 'wo-type--internal' : 'wo-type--external'}`}>
                          {TYPE_ICONS[row.type]}
                          {TYPE_LABELS[row.type]}
                        </span>
                      </td>
                      <td className="wo-td wo-td-link">{row.productionItem}</td>
                      <td className="wo-td wo-td-number">{row.qty.toLocaleString()}</td>
                      <td className="wo-td">
                        <div className="wo-job-card-info">
                          <span className="wo-job-card-text">
                            {row.completedJobCards}/{row.totalJobCards}
                          </span>
                          {row.totalJobCards > 0 && (
                            <div className="wo-job-card-bar">
                              <div 
                                className="wo-job-card-fill"
                                style={{ 
                                  width: `${(row.completedJobCards / row.totalJobCards) * 100}%`,
                                  backgroundColor: row.completedJobCards >= row.totalJobCards ? '#22c55e' : '#3b82f6'
                                }}
                              />
                            </div>
                          )}
                          <button
                            className="wo-job-card-btn"
                            onClick={(e) => handleViewJobCards(row, e)}
                            title="View Job Cards"
                          >
                            <FaFileAlt size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="wo-td">
                        <div className="wo-progress-container">
                          <div className="wo-progress-bar">
                            <div 
                              className="wo-progress-fill" 
                              style={{ 
                                width: `${row.progress}%`,
                                backgroundColor: getProgressColor(row.progress)
                              }}
                            />
                          </div>
                          <span className="wo-progress-text" style={{ color: getProgressColor(row.progress) }}>
                            {row.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="wo-td">
                        <span className={`wo-status-badge ${STATUS_CLASS[row.status]}`}>
                          {getStatusIcon(row.status)}
                          {STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td className="wo-td wo-td-dates">
                        <div className="wo-date-range">
                          <FaCalendarAlt size={12} style={{ color: 'var(--text-secondary)', marginRight: '4px' }} />
                          <span>{row.displayStartDate || new Date(row.plannedStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="wo-td wo-td-meta" onClick={(e) => e.stopPropagation()}>

                        <div className="wo-action-buttons">
                          <button
                            className="wo-action-btn wo-action-view"
                            onClick={(e) => handleView(row, e)}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button
                            className="wo-action-btn wo-action-edit"
                            onClick={(e) => handleEdit(row, e)}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            className="wo-action-btn wo-action-delete"
                            onClick={(e) => handleDelete(row, e)}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile UI List Section (max-width: 768px) ──────────────────── */}
          <div className="wo-mobile-list-wrap">
            {paginatedData.length === 0 ? (
              <div className="wo-empty-state">
                <div className="wo-empty-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <p>No {activeTab !== 'all' ? (activeTab === 'internal' ? 'product' : 'service') + ' ' : ''}work orders found</p>
                  <span>Try adjusting your search criteria</span>
                </div>
              </div>
            ) : (
              <>
                {/* ── Mobile UI Table Header / Title at Top ── */}
                <div className="wo-mobile-list-header">
                  <div className="wo-mobile-th-primary">
                    <span className="wo-mobile-th-cell wo-mobile-th-id">WO #</span>
                    <span className="wo-mobile-th-cell wo-mobile-th-item">Production Item</span>
                  </div>
                  <div className="wo-mobile-th-right">
                    <span className="wo-count-label">
                      {displayTotalItems > 0
                        ? `${getStartIndex()}–${getEndIndex()}`
                        : '0'}{' '}
                      of {displayTotalItems}
                    </span>
                  </div>
                </div>

                <div className="wo-mobile-cards">
                  {paginatedData.map((row) => {
                    const isExpanded = expandedRows.has(row.id);
                    return (
                      <div
                        key={row.id}
                        className={`wo-mobile-card ${isExpanded ? 'wo-mobile-card-expanded' : ''}`}
                      >
                        <div 
                          className="wo-mobile-card-header"
                          onClick={() => toggleRowExpand(row.id)}
                        >
                          <div className="wo-mobile-card-primary">
                            <span
                              className="wo-mobile-id"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(row, e);
                              }}
                              title="View Work Order"
                            >
                              {row.name}
                            </span>
                            <span className="wo-mobile-item-name" title={row.productionItem}>
                              {row.productionItem}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`wo-mobile-dropdown-btn ${isExpanded ? 'expanded' : ''}`}
                            onClick={(e) => toggleRowExpand(row.id, e)}
                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            <FaChevronDown size={14} className="wo-mobile-chevron" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="wo-mobile-card-details">
                            <div className="wo-mobile-detail-row">
                              <span className="wo-mobile-detail-label">Type</span>
                              <span className={`wo-type-badge ${row.type === 'internal' ? 'wo-type--internal' : 'wo-type--external'}`}>
                                {TYPE_ICONS[row.type]}
                                {TYPE_LABELS[row.type]}
                              </span>
                            </div>

                            <div className="wo-mobile-detail-row">
                              <span className="wo-mobile-detail-label">Qty</span>
                              <span className="wo-mobile-detail-value">{row.qty.toLocaleString()}</span>
                            </div>

                            <div className="wo-mobile-detail-row">
                              <span className="wo-mobile-detail-label">Job Cards</span>
                              <div className="wo-job-card-info">
                                <span className="wo-job-card-text">
                                  {row.completedJobCards}/{row.totalJobCards}
                                </span>
                                {row.totalJobCards > 0 && (
                                  <div className="wo-job-card-bar">
                                    <div 
                                      className="wo-job-card-fill"
                                      style={{ 
                                        width: `${(row.completedJobCards / row.totalJobCards) * 100}%`,
                                        backgroundColor: row.completedJobCards >= row.totalJobCards ? '#22c55e' : '#3b82f6'
                                      }}
                                    />
                                  </div>
                                )}
                                <button
                                  className="wo-job-card-btn"
                                  onClick={(e) => handleViewJobCards(row, e)}
                                  title="View Job Cards"
                                >
                                  <FaFileAlt size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="wo-mobile-detail-row">
                              <span className="wo-mobile-detail-label">Progress</span>
                              <div className="wo-progress-container" style={{ minWidth: '120px' }}>
                                <div className="wo-progress-bar">
                                  <div 
                                    className="wo-progress-fill" 
                                    style={{ 
                                      width: `${row.progress}%`,
                                      backgroundColor: getProgressColor(row.progress)
                                    }}
                                  />
                                </div>
                                <span className="wo-progress-text" style={{ color: getProgressColor(row.progress) }}>
                                  {row.progress}%
                                </span>
                              </div>
                            </div>

                            <div className="wo-mobile-detail-row">
                              <span className="wo-mobile-detail-label">Status</span>
                              <span className={`wo-status-badge ${STATUS_CLASS[row.status]}`}>
                                {getStatusIcon(row.status)}
                                {STATUS_LABELS[row.status]}
                              </span>
                            </div>

                            <div className="wo-mobile-detail-row">
                              <span className="wo-mobile-detail-label">Planned Dates</span>
                              <div className="wo-date-range">
                                <FaCalendarAlt size={12} style={{ color: 'var(--text-secondary)', marginRight: '4px' }} />
                                <span>{row.displayStartDate || new Date(row.plannedStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>

                            <div className="wo-mobile-detail-footer">
                              <div className="wo-mobile-detail-meta">
                                <span className="wo-count-label">
                                </span>
                              </div>

                              <div className="wo-action-buttons">
                                <button 
                                  className="wo-action-btn wo-action-view" 
                                  onClick={(e) => { e.stopPropagation(); handleView(row, e); }}
                                  title="View"
                                >
                                  <FaEye size={12} />
                                </button>
                                <button 
                                  className="wo-action-btn wo-action-edit" 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(row, e); }}
                                  title="Edit"
                                >
                                  <FaEdit size={12} />
                                </button>
                                <button 
                                  className="wo-action-btn wo-action-delete" 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(row, e); }}
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
              </>
            )}
          </div>

           {/* Pagination */}
           <div className="wo-pagination">
            <div className="wo-pagination-left">
              <span className="wo-pagination-label">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="wo-page-size-select"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="wo-pagination-label">entries</span>
            </div>
            <div className="wo-pagination-center">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1 || displayTotalPages === 0}
                className="wo-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1 || displayTotalPages === 0}
                className="wo-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`wo-page-btn ${currentPage === page ? 'wo-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={goToNextPage}
                disabled={currentPage >= displayTotalPages || displayTotalPages === 0}
                className="wo-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage >= displayTotalPages || displayTotalPages === 0}
                className="wo-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="wo-pagination-right">
              <span className="wo-pagination-info">
                {displayTotalItems > 0
                  ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${displayTotalItems} entries`
                  : 'No entries to show'}
              </span>
            </div>
          </div>
        </>
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="wo-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="wo-modal wo-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="wo-modal-header">
              <span className="wo-modal-title">Confirm Delete</span>
              <button className="wo-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="wo-modal-body">
              <p>Are you sure you want to delete this work order?</p>
              <p className="wo-modal-item-name"><strong>{selectedItem.name}</strong> - {selectedItem.productionItem}</p>
              <p className="wo-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="wo-modal-footer">
              <button className="wo-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="wo-btn-delete" onClick={confirmDelete} disabled={deletingId === selectedItem.id}>
                {deletingId === selectedItem.id ? (
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

      {/* Complete Work Order Confirmation Modal */}
      {showCompleteConfirm && selectedItem && (
        <div className="wo-modal-overlay" onClick={() => setShowCompleteConfirm(false)}>
          <div className="wo-modal wo-modal-complete" onClick={(e) => e.stopPropagation()}>
            <div className="wo-modal-header">
              <span className="wo-modal-title">Complete Work Order</span>
              <button className="wo-modal-close" onClick={() => setShowCompleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="wo-modal-body">
              <div className="wo-complete-summary">
                <div className="wo-complete-icon">
                  <FaCheckCircle size={48} style={{ color: '#22c55e' }} />
                </div>
                <h3>Ready to Complete?</h3>
                <p className="wo-complete-detail">
                  <strong>{selectedItem.name}</strong> - {selectedItem.productionItem}
                </p>
                <div className="wo-complete-stats">
                  <div className="wo-complete-stat">
                    <span>Quantity</span>
                    <strong>{selectedItem.qty} units</strong>
                  </div>
                  <div className="wo-complete-stat">
                    <span>Job Cards</span>
                    <strong>{selectedItem.completedJobCards}/{selectedItem.totalJobCards} completed</strong>
                  </div>
                  <div className="wo-complete-stat">
                    <span>Completion</span>
                    <strong>{completionProgress}%</strong>
                  </div>
                </div>
                <div className="wo-complete-progress">
                  <div className="wo-progress-bar wo-complete-progress-bar">
                    <div 
                      className="wo-progress-fill" 
                      style={{ 
                        width: `${completionProgress}%`, 
                        backgroundColor: completionProgress >= 100 ? '#22c55e' : '#3b82f6'
                      }}
                    />
                  </div>
                </div>
                <p className="wo-complete-warning">
                  ⚠️ This will mark the work order as completed and update the production quantity.
                </p>
              </div>
            </div>
            <div className="wo-modal-footer">
              <button className="wo-btn-cancel" onClick={() => setShowCompleteConfirm(false)}>
                Cancel
              </button>
              <button 
                className="wo-btn-complete" 
                onClick={confirmComplete} 
                disabled={completingId === selectedItem.id}
              >
                {completingId === selectedItem.id ? (
                  <FaSpinner className="spinning" size={12} />
                ) : (
                  <FaCheckCircle size={12} />
                )}
                Complete Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}