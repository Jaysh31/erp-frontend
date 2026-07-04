// JobCardManagement.tsx
import { useState, useEffect } from "react";
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
} from "react-icons/fa";
import "./JobCardManagement.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";

type Status = "Open" | "Work In Progress" | "Completed" | "On Hold" | "Cancelled";

interface JobCard {
  id: string;
  job_card_id: string;
  work_order: string;
  operation: string;
  workstation: string;
  qty_to_manufacture: number;
  total_completed_qty: number;
  company: string;
  status: Status;
  created_on: string;
  expected_start_date?: string | null;
  expected_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
}

interface JobCardDisplay {
  id: string;
  jobCardId: string;
  workOrder: string;
  operation: string;
  workstation: string;
  qty: number;
  completedQty: number;
  company: string;
  status: Status;
  createdOn: string;
  progress: number;
  createdAgo: string;
  expectedStartDate: Date | null;
  expectedEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
}

const STATUS_CLASS: Record<Status, string> = {
  Open: "s-open",
  "Work In Progress": "s-inprocess",
  Completed: "s-completed",
  "On Hold": "s-onhold",
  Cancelled: "s-cancelled",
};

const STATUS_LABELS: Record<Status, string> = {
  Open: "Open",
  "Work In Progress": "Work In Progress",
  Completed: "Completed",
  "On Hold": "On Hold",
  Cancelled: "Cancelled",
};

// ─── local storage (no API) ────────────────────────────────────────────
// Must match the exact key/shape used by JobCardForm.tsx so both stay in sync.

const JOB_CARDS_STORAGE_KEY = "job_cards";
const JOB_CARDS_UPDATE_EVENT = "job-cards-updated";

const readAllJobCardsLocally = (): JobCard[] => {
  try {
    const raw = localStorage.getItem(JOB_CARDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read job cards from local storage:", err);
    return [];
  }
};

const writeAllJobCardsLocally = (cards: JobCard[]) => {
  localStorage.setItem(JOB_CARDS_STORAGE_KEY, JSON.stringify(cards));
  window.dispatchEvent(new Event(JOB_CARDS_UPDATE_EVENT));
};

// ─── timer helpers ─────────────────────────────────────────────────────

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

interface TimerInfo {
  label: string;
  colorVar: string;
  pulsing: boolean;
}

const getTimerInfo = (row: JobCardDisplay, now: Date): TimerInfo => {
  // Actively running — count down to the expected end date
  if (row.actualStartDate && !row.actualEndDate) {
    if (row.expectedEndDate) {
      const diff = row.expectedEndDate.getTime() - now.getTime();
      if (diff > 0) {
        return { label: `Ends in ${formatDuration(diff)}`, colorVar: "var(--primary-color)", pulsing: true };
      }
      return { label: `Overdue by ${formatDuration(-diff)}`, colorVar: "var(--danger-color)", pulsing: true };
    }
    // No expected end date to count down to — fall back to elapsed time
    const elapsed = now.getTime() - row.actualStartDate.getTime();
    return { label: formatDuration(elapsed), colorVar: "var(--primary-color)", pulsing: true };
  }

  // Finished — show total time it took
  if (row.actualStartDate && row.actualEndDate) {
    const total = row.actualEndDate.getTime() - row.actualStartDate.getTime();
    return { label: `Done in ${formatDuration(total)}`, colorVar: "var(--text-secondary)", pulsing: false };
  }

  // Not started yet — count down to scheduled start
  if (row.expectedStartDate) {
    const diff = row.expectedStartDate.getTime() - now.getTime();
    if (diff > 0) {
      return { label: `Starts in ${formatDuration(diff)}`, colorVar: "var(--text-secondary)", pulsing: false };
    }
    return { label: `Overdue by ${formatDuration(-diff)}`, colorVar: "var(--danger-color)", pulsing: false };
  }

  return { label: "-", colorVar: "var(--text-secondary)", pulsing: false };
};

export default function JobCardManagement() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [jobCards, setJobCards] = useState<JobCardDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JobCardDisplay | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // Tick every second so the Timer column stays live without re-fetching data
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  const calculateProgress = (qty: number, completedQty: number): number => {
    if (qty === 0) return 0;
    return Math.min(Math.round((completedQty / qty) * 100), 100);
  };

  // ─── load from localStorage (no API) ──────────────────────────────────

  const fetchJobCards = () => {
    setLoading(true);
    setError(null);
    try {
      const all = readAllJobCardsLocally();

      const transformedData: JobCardDisplay[] = all.map((item) => ({
        id: item.id,
        jobCardId: item.job_card_id,
        workOrder: item.work_order,
        operation: item.operation,
        workstation: item.workstation,
        qty: item.qty_to_manufacture,
        completedQty: item.total_completed_qty,
        company: item.company,
        status: item.status,
        createdOn: item.created_on,
        progress: calculateProgress(item.qty_to_manufacture, item.total_completed_qty),
        createdAgo: formatDate(item.created_on),
        expectedStartDate: item.expected_start_date ? new Date(item.expected_start_date) : null,
        expectedEndDate: item.expected_end_date ? new Date(item.expected_end_date) : null,
        actualStartDate: item.actual_start_date ? new Date(item.actual_start_date) : null,
        actualEndDate: item.actual_end_date ? new Date(item.actual_end_date) : null,
      }));

      // Newest first
      transformedData.sort(
        (a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
      );

      setTotalItems(transformedData.length);
      setJobCards(transformedData);
    } catch (err) {
      console.error("Error reading job cards from local storage:", err);
      setError("An error occurred while loading job cards");
    } finally {
      setLoading(false);
    }
  };

  // Initial load + live sync whenever the form (or another tab) saves a job card
  useEffect(() => {
    fetchJobCards();

    window.addEventListener(JOB_CARDS_UPDATE_EVENT, fetchJobCards);
    window.addEventListener("storage", fetchJobCards); // cross-tab sync

    return () => {
      window.removeEventListener(JOB_CARDS_UPDATE_EVENT, fetchJobCards);
      window.removeEventListener("storage", fetchJobCards);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredData = jobCards.filter((item) => {
    const matchesSearch =
      item.jobCardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.workOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFilteredItems = filteredData.length;
  const filteredTotalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  const validCurrentPage = Math.min(currentPage, filteredTotalPages || 1);
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map((r) => r.id)));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllChecked(next.size === paginatedData.length);
  };

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

  const handleDelete = (item: JobCardDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      try {
        const all = readAllJobCardsLocally();
        const updated = all.filter((c) => c.id !== selectedItem.id);
        writeAllJobCardsLocally(updated);
        setShowDeleteConfirm(false);
        setSelectedItem(null);
        fetchJobCards();
      } catch (err) {
        console.error("Error deleting job card:", err);
        alert("Failed to delete job card");
      }
    }
  };

  const handleRowClick = (item: JobCardDisplay) => {
    navigate(`/job-cards/${encodeURIComponent(item.id)}`);
  };

  const handleEdit = (item: JobCardDisplay) => {
    navigate(`/job-cards/${encodeURIComponent(item.id)}`);
  };

  const handleView = (item: JobCardDisplay) => {
    navigate(`/job-cards/${encodeURIComponent(item.id)}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
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
              placeholder="Search job cards by ID, work order, operation, or company..."
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="jc-filter-select"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Work In Progress">Work In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button className="jc-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="jc-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" />
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="jc-btn-primary" onClick={() => navigate("/job-cards/new")}>
            <FaPlus size={12} />
            Add Job Card
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== "all") && (
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
              <strong>Status:</strong> {STATUS_LABELS[statusFilter as Status]}
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
          <p>Loading job cards...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="jc-error">
          <p>{error}</p>
          <button onClick={fetchJobCards} className="jc-retry-btn">
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
                  <th className="jc-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="jc-checkbox" />
                  </th>
                  <th className="jc-th">Job Card #</th>
                  <th className="jc-th">Work Order</th>
                  <th className="jc-th">Operation</th>
                  <th className="jc-th">Workstation</th>
                  <th className="jc-th">Qty</th>
                  <th className="jc-th">Progress</th>
                  <th className="jc-th">Company</th>
                  <th className="jc-th">Status</th>
                  <th className="jc-th">Timer</th>
                  <th className="jc-th jc-th-meta">
                    <span className="jc-count-label">{totalFilteredItems} of {totalItems}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="jc-empty-state">
                      <div className="jc-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <p>No job cards found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => {
                    const timer = getTimerInfo(row, now);
                    return (
                      <tr
                        key={row.id}
                        className={`jc-tr ${selected.has(row.id) ? "jc-tr-selected" : ""}`}
                        onClick={() => handleRowClick(row)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="jc-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                          <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="jc-checkbox" />
                        </td>
                        <td className="jc-td jc-td-id">{row.jobCardId}</td>
                        <td className="jc-td jc-td-link">{row.workOrder}</td>
                        <td className="jc-td">{row.operation}</td>
                        <td className="jc-td">{row.workstation}</td>
                        <td className="jc-td jc-td-number">{row.qty.toLocaleString()}</td>
                        <td className="jc-td">
                          <div className="jc-progress-container">
                            <div className="jc-progress-bar">
                              <div className="jc-progress-fill" style={{ width: `${row.progress}%` }} />
                            </div>
                            <span className="jc-progress-text">{row.progress}%</span>
                          </div>
                        </td>
                        <td className="jc-td jc-td-company">
                          <FaBuilding size={10} className="jc-company-icon" />
                          {row.company}
                        </td>
                        <td className="jc-td">
                          <span className={`jc-status-badge ${STATUS_CLASS[row.status]}`}>
                            {STATUS_LABELS[row.status]}
                          </span>
                        </td>
                        <td className="jc-td">
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: "0.82em",
                              fontWeight: 500,
                              color: timer.colorVar,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {timer.pulsing && (
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  backgroundColor: "var(--primary-color)",
                                  display: "inline-block",
                                  animation: "jc-timer-pulse 1.2s ease-in-out infinite",
                                }}
                              />
                            )}
                            {timer.label}
                          </span>
                        </td>
                        <td className="jc-td jc-td-meta" onClick={(e) => e.stopPropagation()}>
                          <span className="jc-ago">{row.createdAgo}</span>
                          <span className="jc-dot">·</span>
                          <div className="jc-action-buttons">
                            <button className="jc-action-btn jc-action-view" onClick={(e) => { e.stopPropagation(); handleView(row); }} title="View">
                              <FaEye size={12} />
                            </button>
                            <button className="jc-action-btn jc-action-edit" onClick={(e) => { e.stopPropagation(); handleEdit(row); }} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="jc-action-btn jc-action-delete" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
              <span className="jc-pagination-label">entries</span>
            </div>
            <div className="jc-pagination-center">
              <button onClick={goToFirstPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="jc-page-btn">
                <FaAngleDoubleLeft size={12} />
              </button>
              <button onClick={goToPrevPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="jc-page-btn">
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map((page) => (
                <button key={page} onClick={() => goToPage(page)} className={`jc-page-btn ${currentPage === page ? "jc-page-btn-active" : ""}`}>
                  {page}
                </button>
              ))}
              <button onClick={goToNextPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="jc-page-btn">
                <FaChevronRight size={12} />
              </button>
              <button onClick={goToLastPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="jc-page-btn">
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="jc-pagination-right">
              <span className="jc-pagination-info">
                {totalFilteredItems > 0
                  ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                  : "No entries to show"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="jc-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="jc-modal jc-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="jc-modal-header">
              <span className="jc-modal-title">Confirm Delete</span>
              <button className="jc-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="jc-modal-body">
              <p>Are you sure you want to delete this job card?</p>
              <p className="jc-modal-item-name"><strong>{selectedItem.jobCardId}</strong> - {selectedItem.workOrder}</p>
              <p className="jc-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="jc-modal-footer">
              <button className="jc-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="jc-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation for the "running" timer dot */}
      <style>{`
        @keyframes jc-timer-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}