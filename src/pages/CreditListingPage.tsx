import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Plus,
  Filter as FilterIcon,
  X,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  User,
} from "lucide-react";
import "./CreditListingPage.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";
import { PageLoader } from "../components/PageLoader.tsx";

/* ─────────────────────────── Types ─────────────────────────── */

interface AccountEntry {
  id: number;
  entry_no: string;
  entry_date: string;
  entry_type: "Credit" | "Debit";
  company_id: number;
  bank_detail_id: number | null;
  transaction_id: string | number | null;
  transaction_date: string | null;
  party_type: "Customer" | "Supplier";
  party_id: number;
  reference_type: string;
  reference_id: number;
  reference_no: string;
  reference_date: string;
  purchase_invoice_no: string | null;
  purchase_order_no: string | null;
  grn_no: string | null;
  sales_invoice_no: string | null;
  sales_order_no: string | null;
  delivery_note_no: string | null;
  payment_type: string;
  currency: string;
  total_amount: number;
  cost_center_id: number | null;
  narration: string;
  remarks: string | null;
  status: string;
  created_by: number;
  creation: string;
  modified_by: number;
  modified: string;
  is_deleted: number;
}

interface AccountEntryListResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: AccountEntry[];
  };
}

interface AccountEntryRow {
  id: string;
  entryNo: string;
  entryDate: string;
  entryType: "Credit" | "Debit";
  partyType: string;
  partyId: number;
  referenceType: string;
  referenceId: number;
  referenceNo: string;
  paymentType: string;
  amount: number;
  currency: string;
  narration: string;
  status: string;
  createdOn: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

interface DeleteModalState {
  isOpen: boolean;
  entryId: string;
  entryNo: string;
  referenceNo: string;
}

/* ─────────────────── Constants ─────────────────── */

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Cancelled", label: "Cancelled" },
];

const ENTRY_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "Credit", label: "Credit" },
  { value: "Debit", label: "Debit" },
];

const PAYMENT_MODES = [
  { value: "all", label: "All Modes" },
  { value: "NEFT", label: "NEFT" },
  { value: "IMPS", label: "IMPS" },
  { value: "RTGS", label: "RTGS" },
  { value: "SWIFT", label: "SWIFT" },
  { value: "UPI", label: "UPI" },
  { value: "Cash", label: "Cash" },
];

/* ─────────────────── Helpers ─────────────────── */

const formatMoney = (v: unknown): string => {
  const n = Number(v);
  if (!isFinite(n)) return "0.00";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/** Local-time YYYY-MM-DD (no timezone drift) */
const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* ─────────────────── Component ─────────────────── */

const CreditListingPage: React.FC = () => {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // ✅ Default to Credit — this is the "Credit Listing" page.
  const [entryTypeFilter, setEntryTypeFilter] = useState("Credit");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allEntries, setAllEntries] = useState<AccountEntry[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    entryId: "",
    entryNo: "",
    referenceNo: "",
  });
  const [deleting, setDeleting] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const rootRef = useRef<HTMLDivElement>(null);

  /* ─── Toasts ─── */

  const addToast = useCallback(
    (type: Toast["type"], title: string, message: string) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ─── Date picker helpers ─── */

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getMonthYear = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );

  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  const isDateSelected = (day: number) => {
    if (!fromDate || !toDate) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    return date >= from && date <= to;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateStr = toISODate(date); // ✅ local-time ISO, no timezone drift
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(dateStr);
      setToDate("");
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
      fetchEntries();
    }
  };

  const handleClearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    setShowDatePicker(false);
    fetchEntries();
  };

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    setFromDate(toISODate(from));
    setToDate(toISODate(today));
    setCurrentPage(1);
  };

  /* ─── Fetch ─── */

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(1),
        limit: String(1000),
      });

      // ✅ Send entry_type to the API. Defaults to "credit"; if the user
      //    explicitly chooses Debit in the dropdown, we send "debit".
      if (entryTypeFilter !== "all") {
        params.append("entry_type", entryTypeFilter.toLowerCase());
      } else {
        // "All Types" still defaults to credit on this listing page
        params.append("entry_type", "credit");
      }

      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (fromDate) params.append("date_from", fromDate);
      if (toDate) params.append("date_to", toDate);

      const url = `/account_entry?${params.toString()}`;
      console.log("Fetching account entries:", url);

      const response = await api.get<AccountEntryListResponse>(url);

      if (response.data?.success === 1) {
        const data = response.data.data;
        const records: AccountEntry[] = Array.isArray(data)
          ? data
          : data?.records ?? [];

        console.log("Total records from API:", records.length);
        console.log(
          "Types:",
          records.map((r) => `${r.entry_no}=${r.entry_type}`).join(", ")
        );

        setAllEntries(records);
      } else {
        setError("Failed to load entries");
      }
    } catch (err: any) {
      console.error("Error fetching account entries:", err);
      if (err.response) {
        setError(
          err.response.data?.message || `Server error: ${err.response.status}`
        );
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Effects ─── */

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, entryTypeFilter, fromDate, toDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchEntries();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ─── Derived filtering ─── */
  // Note: entry_type is now filtered server-side, so we only filter
  // payment_type client-side here.
  const filteredEntries = useMemo(() => {
    let filtered = [...allEntries];

    if (paymentFilter !== "all") {
      filtered = filtered.filter((e) => e.payment_type === paymentFilter);
    }

    return filtered;
  }, [allEntries, paymentFilter]);

  /* ─── Pagination ─── */

  const totalRecords = filteredEntries.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, validCurrentPage, itemsPerPage]);

  const tableData: AccountEntryRow[] = useMemo(
    () =>
      paginated.map((e) => ({
        id: String(e.id),
        entryNo: e.entry_no || `ACC-${e.id}`,
        entryDate: formatDate(e.entry_date),
        entryType: e.entry_type,
        partyType: e.party_type || "—",
        partyId: e.party_id,
        referenceType: e.reference_type || "—",
        referenceId: e.reference_id,
        referenceNo: e.reference_no || "—",
        paymentType: e.payment_type || "—",
        amount: Number(e.total_amount) || 0,
        currency: e.currency || "INR",
        narration: e.narration || "",
        status: e.status || "Draft",
        createdOn: formatDate(e.creation),
      })),
    [paginated]
  );

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () =>
    Math.min(validCurrentPage * itemsPerPage, totalRecords);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible)
      startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(validCurrentPage + 1);
  const goToPrevPage = () => goToPage(validCurrentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  /* ─── Handlers ─── */

  const toggleRowExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setEntryTypeFilter("Credit"); // ✅ back to the page's default
    setPaymentFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  /* ─── Navigation ─── */

  const handleNewEntry = () => {
    navigate("/receivables/new-credits");
  };

  const handleView = (row: AccountEntryRow) => {
    navigate(
      `/receivables/new-credits?id=${row.id}&mode=view` +
        `&referenceType=${encodeURIComponent(row.referenceType)}` +
        `&referenceId=${row.referenceId}`
    );
  };

  const handleEdit = (row: AccountEntryRow) => {
    navigate(
      `/receivables/new-credits?id=${row.id}&mode=edit` +
        `&referenceType=${encodeURIComponent(row.referenceType)}` +
        `&referenceId=${row.referenceId}`
    );
  };

  /* ─── Delete ─── */

  const openDeleteModal = (row: AccountEntryRow) => {
    setDeleteModal({
      isOpen: true,
      entryId: row.id,
      entryNo: row.entryNo,
      referenceNo: row.referenceNo,
    });
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setDeleteModal({
        isOpen: false,
        entryId: "",
        entryNo: "",
        referenceNo: "",
      });
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      const response = await api.delete(
        `/account_entry/${deleteModal.entryId}`
      );
      if (response.data?.success === 1) {
        addToast(
          "success",
          "Deleted Successfully",
          `Entry "${deleteModal.entryNo}" has been deleted.`
        );
        closeDeleteModal();
        await fetchEntries();
      } else {
        addToast("error", "Delete Failed", "Failed to delete entry.");
      }
    } catch (err: any) {
      console.error("Error deleting entry:", err);
      addToast(
        "error",
        "Delete Failed",
        err.response?.data?.message || "Failed to delete entry"
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Loading screen ─── */

  if (loading && allEntries.length === 0) {
    return (
      <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
        <PageLoader message="Loading Account Entries..." />
      </div>
    );
  }

  /* ─────────────────────── Render ─────────────────────── */

  return (
    <>
      {deleteModal.isOpen && (
        <div className="ace-modal-overlay" onClick={closeDeleteModal}>
          <div className="ace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ace-modal-header">
              <div className="ace-modal-icon">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="ace-modal-title">Delete Entry</h3>
                <p className="ace-modal-subtitle">
                  Are you sure you want to delete this entry? This action cannot
                  be undone.
                </p>
              </div>
            </div>

            <div className="ace-modal-body">
              <div className="ace-modal-info">
                <div className="ace-modal-info-row">
                  <span className="ace-modal-info-label">Entry No</span>
                  <span className="ace-modal-info-value">
                    {deleteModal.entryNo}
                  </span>
                </div>
                <div className="ace-modal-info-row">
                  <span className="ace-modal-info-label">Reference</span>
                  <span className="ace-modal-info-value">
                    {deleteModal.referenceNo}
                  </span>
                </div>
              </div>
            </div>

            <div className="ace-modal-footer">
              <button
                className="ace-btn-secondary"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="ace-btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="ace-spinner ace-spinner--sm" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ace-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`ace-toast ace-toast--${toast.type}`}>
            <div className="ace-toast-icon">
              {toast.type === "success" && <CheckCircle size={16} />}
              {toast.type === "error" && <AlertCircle size={16} />}
              {toast.type === "info" && <Info size={16} />}
            </div>
            <div className="ace-toast-content">
              <p className="ace-toast-title">{toast.title}</p>
              <p className="ace-toast-message">{toast.message}</p>
            </div>
            <button
              className="ace-toast-close"
              onClick={() => removeToast(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className={`ace-page ${theme}`} ref={rootRef}>
        {error && (
          <div className="ace-error-banner">
            <AlertCircle size={14} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ace-error-close"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="ace-filter-bar">
          <div className="ace-filter-left">
            <div className="ace-search-wrapper">
              <Search className="ace-search-icon" size={14} />
              <input
                type="text"
                placeholder="Search by entry no, reference no, narration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ace-search-input"
              />
              {searchTerm && (
                <button
                  className="ace-search-clear"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="ace-filter-right">
            {/*<select
              value={entryTypeFilter}
              onChange={(e) => {
                setEntryTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="ace-filter-select"
            >
              {ENTRY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>*/}

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="ace-filter-select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="ace-filter-select"
            >
              {PAYMENT_MODES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="ace-date-range-wrapper">
              <button
                className={`ace-date-toggle-btn ${
                  showDatePicker ? "active" : ""
                }`}
                onClick={() => setShowDatePicker(!showDatePicker)}
                title="Filter by date range"
              >
                <Calendar size={14} />
              </button>

              {showDatePicker && (
                <div className="ace-date-picker-popup">
                  <div className="ace-date-picker-header">
                    <span className="ace-date-picker-title">
                      Filter by Date
                    </span>
                  </div>

                  <div className="ace-date-range-display">
                    {fromDate && toDate ? (
                      <span>
                        {formatDateDisplay(fromDate)} –{" "}
                        {formatDateDisplay(toDate)}
                      </span>
                    ) : (
                      <span className="ace-date-range-placeholder">
                        Select date range
                      </span>
                    )}
                  </div>

                  <div className="ace-quick-filters">
                    <button
                      className="ace-quick-filter-btn"
                      onClick={() => setQuickDateRange(0)}
                    >
                      Today
                    </button>
                    <button
                      className="ace-quick-filter-btn"
                      onClick={() => setQuickDateRange(7)}
                    >
                      Last 7 Days
                    </button>
                    <button
                      className="ace-quick-filter-btn"
                      onClick={() => setQuickDateRange(30)}
                    >
                      Last 30 Days
                    </button>
                    <button
                      className="ace-quick-filter-btn"
                      onClick={() => setQuickDateRange(90)}
                    >
                      This Month
                    </button>
                  </div>

                  <div className="ace-calendar">
                    <div className="ace-calendar-header">
                      <button
                        className="ace-calendar-nav"
                        onClick={handlePrevMonth}
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <span className="ace-calendar-month">
                        {getMonthYear(currentMonth)}
                      </span>
                      <button
                        className="ace-calendar-nav"
                        onClick={handleNextMonth}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="ace-calendar-weekdays">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>
                    <div className="ace-calendar-days">
                      {Array.from({
                        length: getDaysInMonth(currentMonth).firstDayOfMonth,
                      }).map((_, i) => (
                        <span
                          key={`empty-${i}`}
                          className="ace-calendar-day-empty"
                        />
                      ))}
                      {Array.from({
                        length: getDaysInMonth(currentMonth).daysInMonth,
                      }).map((_, i) => {
                        const day = i + 1;
                        const isSelected = isDateSelected(day);
                        return (
                          <button
                            key={day}
                            className={`ace-calendar-day ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() => handleDateClick(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ace-date-actions">
                    <button
                      className="ace-btn-clear-filter"
                      onClick={handleClearDateFilter}
                    >
                      Clear
                    </button>
                    <button
                      className="ace-btn-apply-filter"
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

          <button className="ace-btn-new" onClick={handleNewEntry}>
            <Plus size={12} />
            New Credit Entry
          </button>
        </div>

        {(searchTerm ||
          statusFilter !== "all" ||
          entryTypeFilter !== "Credit" ||
          paymentFilter !== "all" ||
          (fromDate && toDate)) && (
          <div className="ace-active-filters">
            <FilterIcon size={12} style={{ color: "var(--primary-color)" }} />
            <span>Active filters:</span>
            {entryTypeFilter !== "Credit" && (
              <span>
                <strong>Type:</strong> {entryTypeFilter}
              </span>
            )}
            {searchTerm && (
              <span>
                <strong>Search:</strong> "{searchTerm}"
              </span>
            )}
            {statusFilter !== "all" && (
              <span>
                <strong>Status:</strong> {statusFilter}
              </span>
            )}
            {paymentFilter !== "all" && (
              <span>
                <strong>Payment:</strong> {paymentFilter}
              </span>
            )}
            {fromDate && toDate && (
              <span>
                <strong>Date Range:</strong> {formatDateDisplay(fromDate)} -{" "}
                {formatDateDisplay(toDate)}
              </span>
            )}
            <button onClick={clearFilters} className="ace-clear-filters">
              <X size={10} /> Clear All
            </button>
          </div>
        )}

        <div className="ace-table-wrap ace-desktop-table-wrap">
          <table className="ace-table">
            <thead>
              <tr>
                <th className="ace-th">Entry No</th>
                <th className="ace-th">Type</th>
                <th className="ace-th">Entry Date</th>
                <th className="ace-th">Party</th>
                <th className="ace-th">Reference</th>
                <th className="ace-th">Mode</th>
                <th className="ace-th">Amount</th>
                <th className="ace-th">Status</th>
                <th className="ace-th ace-th-meta">
                  <span className="ace-count-label">
                    {totalRecords > 0
                      ? `${getStartIndex()}–${getEndIndex()}`
                      : "0"}{" "}
                    of {totalRecords}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ace-empty-state">
                    <div className="ace-empty-content">
                      <ArrowDownLeft size={48} />
                      <p>No entries found</p>
                      <span>
                        {searchTerm ||
                        statusFilter !== "all" ||
                        entryTypeFilter !== "Credit" ||
                        paymentFilter !== "all" ||
                        (fromDate && toDate)
                          ? "Try adjusting your search criteria"
                          : 'Create your first entry by clicking "New Credit Entry"'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                tableData.map((row) => (
                  <tr key={row.id} className="ace-tr">
                    <td className="ace-td ace-td-id">
                      <a
                        className="ace-id-link"
                        href={`/account_entry/${row.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleView(row);
                        }}
                      >
                        {row.entryNo}
                      </a>
                    </td>
                    <td className="ace-td">
                      <span
                        className={`ace-entry-type-badge ${
                          row.entryType === "Credit"
                            ? "ace-type--credit"
                            : "ace-type--debit"
                        }`}
                      >
                        {row.entryType}
                      </span>
                    </td>
                    <td className="ace-td">{row.entryDate}</td>
                    <td className="ace-td">
                      <span className="ace-party-badge">
                        <User size={12} />
                        {row.partyType} #{row.partyId}
                      </span>
                    </td>
                    <td className="ace-td">
                      <div className="ace-ref-cell">
                        <span className="ace-ref-type">{row.referenceType}</span>
                        <span className="ace-ref-no">{row.referenceNo}</span>
                      </div>
                    </td>
                    <td className="ace-td">
                      <span className="ace-mode-badge">{row.paymentType}</span>
                    </td>
                    <td className="ace-td ace-amount">
                      ₹{formatMoney(row.amount)}
                    </td>
                    <td className="ace-td">
                      <span
                        className={`ace-status-pill ${
                          row.status === "Submitted"
                            ? "ace-status--submitted"
                            : row.status === "Cancelled"
                            ? "ace-status--cancelled"
                            : "ace-status--draft"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="ace-td ace-td-meta">
                      <div className="ace-action-buttons">
                        <button
                          className="ace-action-btn ace-action-view"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(row);
                          }}
                          title="View"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          className="ace-action-btn ace-action-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                          }}
                          title="Edit"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          className="ace-action-btn ace-action-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(row);
                          }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="ace-mobile-list-wrap">
          {tableData.length === 0 ? (
            <div className="ace-empty-state">
              <div className="ace-empty-content">
                <ArrowDownLeft size={48} />
                <p>No entries found</p>
                <span>
                  {searchTerm ||
                  statusFilter !== "all" ||
                  entryTypeFilter !== "Credit" ||
                  paymentFilter !== "all" ||
                  (fromDate && toDate)
                    ? "Try adjusting your search criteria"
                    : 'Create your first entry by clicking "New Credit Entry"'}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="ace-mobile-list-header">
                <div className="ace-mobile-th-primary">
                  <span className="ace-mobile-th-cell ace-mobile-th-id">
                    Entry No
                  </span>
                  <span className="ace-mobile-th-cell ace-mobile-th-item">
                    Reference
                  </span>
                </div>
                <div className="ace-mobile-th-right">
                  <span className="ace-count-label">
                    {totalRecords > 0
                      ? `${getStartIndex()}–${getEndIndex()}`
                      : "0"}{" "}
                    of {totalRecords}
                  </span>
                </div>
              </div>

              <div className="ace-mobile-cards">
                {tableData.map((row) => {
                  const isExpanded = expandedRows.has(row.id);
                  return (
                    <div
                      key={row.id}
                      className={`ace-mobile-card ${
                        isExpanded ? "ace-mobile-card-expanded" : ""
                      }`}
                    >
                      <div
                        className="ace-mobile-card-header"
                        onClick={() => toggleRowExpand(row.id)}
                      >
                        <div className="ace-mobile-card-primary">
                          <a
                            className="ace-mobile-id"
                            href={`/account_entry/${row.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleView(row);
                            }}
                          >
                            {row.entryNo}
                          </a>
                          <span className="ace-mobile-item-name">
                            {row.referenceType} · {row.referenceNo}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`ace-mobile-dropdown-btn ${
                            isExpanded ? "expanded" : ""
                          }`}
                          onClick={(e) => toggleRowExpand(row.id, e)}
                        >
                          <ChevronDown
                            size={16}
                            className="ace-mobile-chevron"
                          />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="ace-mobile-card-details">
                          <div className="ace-mobile-detail-row">
                            <span className="ace-mobile-detail-label">Type</span>
                            <span
                              className={`ace-entry-type-badge ${
                                row.entryType === "Credit"
                                  ? "ace-type--credit"
                                  : "ace-type--debit"
                              }`}
                            >
                              {row.entryType}
                            </span>
                          </div>
                          <div className="ace-mobile-detail-row">
                            <span className="ace-mobile-detail-label">Status</span>
                            <span
                              className={`ace-status-pill ${
                                row.status === "Submitted"
                                  ? "ace-status--submitted"
                                  : row.status === "Cancelled"
                                  ? "ace-status--cancelled"
                                  : "ace-status--draft"
                              }`}
                            >
                              {row.status}
                            </span>
                          </div>
                          <div className="ace-mobile-detail-row">
                            <span className="ace-mobile-detail-label">
                              Entry Date
                            </span>
                            <span className="ace-mobile-detail-value">
                              {row.entryDate}
                            </span>
                          </div>
                          <div className="ace-mobile-detail-row">
                            <span className="ace-mobile-detail-label">Party</span>
                            <span className="ace-mobile-detail-value">
                              {row.partyType} #{row.partyId}
                            </span>
                          </div>
                          <div className="ace-mobile-detail-row">
                            <span className="ace-mobile-detail-label">Mode</span>
                            <span className="ace-mode-badge">
                              {row.paymentType}
                            </span>
                          </div>
                          <div className="ace-mobile-detail-row">
                            <span className="ace-mobile-detail-label">Amount</span>
                            <span className="ace-mobile-detail-value ace-amount">
                              ₹{formatMoney(row.amount)}
                            </span>
                          </div>
                          {row.narration && (
                            <div className="ace-mobile-detail-row">
                              <span className="ace-mobile-detail-label">
                                Narration
                              </span>
                              <span className="ace-mobile-detail-value">
                                {row.narration}
                              </span>
                            </div>
                          )}
                          <div className="ace-mobile-detail-footer">
                            <div className="ace-mobile-detail-meta">
                              <span className="ace-count-label">
                                Created {row.createdOn}
                              </span>
                            </div>
                            <div className="ace-action-buttons">
                              <button
                                className="ace-action-btn ace-action-view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(row);
                                }}
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                className="ace-action-btn ace-action-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(row);
                                }}
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                className="ace-action-btn ace-action-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(row);
                                }}
                              >
                                <Trash2 size={12} />
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

        {!loading && totalRecords > 0 && (
          <div className="ace-pagination">
            <div className="ace-pagination-left">
              <span className="ace-pagination-label">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="ace-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="ace-pagination-info">
                Showing {getStartIndex()} to {getEndIndex()} of {totalRecords}{" "}
                entries
              </span>
            </div>
            <div className="ace-pagination-center">
              <button
                onClick={goToFirstPage}
                disabled={validCurrentPage === 1}
                className="ace-page-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7" />
                  <polyline points="18 17 13 12 18 7" />
                </svg>
              </button>
              <button
                onClick={goToPrevPage}
                disabled={validCurrentPage === 1}
                className="ace-page-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`ace-page-btn ${
                    validCurrentPage === page ? "ace-page-btn-active" : ""
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={goToNextPage}
                disabled={validCurrentPage === totalPages}
                className="ace-page-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <button
                onClick={goToLastPage}
                disabled={validCurrentPage === totalPages}
                className="ace-page-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              </button>
            </div>
            <div className="ace-pagination-right">
              <span className="ace-pagination-page">
                Page {validCurrentPage} of {totalPages}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CreditListingPage;