// JobCardManagement.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Plus,
  Filter as FilterIcon,
  X,
  ArrowUpDown,
  FileStack,
  Check,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Building,
  Clock,
} from "lucide-react";
import "./JobCardManagement.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from '../../src/services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_FIELDS = ["Created On", "Work Order", "ID", "Operation"];

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "Open" | "Work In Progress" | "Completed" | "On Hold" | "Cancelled";

interface JobCardRecord {
  id: number;
  name: string;
  creation: string;
  modified: string;
  modified_by: string;
  owner: string;
  docstatus: number;
  idx: number;
  work_order: string;
  production_item: string;
  for_quantity: number;
  bom_no: string;
  company: string;
  naming_series: string;
  posting_date: string | null;
  finished_good: string;
  semi_fg_bom: string | null;
  pending_qty: number;
  process_loss_qty: number;
  total_completed_qty: number;
  transferred_qty: number;
  manufactured_qty: number;
  operation: string;
  source_warehouse: string;
  wip_warehouse: string;
  skip_material_transfer: number;
  backflush_from_wip_warehouse: number;
  workstation_type: string;
  workstation: string;
  target_warehouse: string;
  quality_inspection_template: string;
  quality_inspection: string;
  expected_start_date: string | null;
  time_required: number;
  expected_end_date: string | null;
  actual_start_date: string | null;
  total_time_in_mins: number;
  actual_end_date: string | null;
  for_job_card: string;
  is_corrective_job_card: number;
  hour_rate: number;
  for_operation: string;
  item_name: string;
  requested_qty: number;
  is_paused: number;
  is_subcontracted: number;
  track_semi_finished_goods: number;
  project: string | null;
  remarks: string | null;
  status: Status;
  operation_row_id: number;
  amended_from: string | null;
  operation_row_number: string;
  operation_id: string;
  sequence_id: number;
  serial_no: string;
  serial_and_batch_bundle: string;
  barcode: string;
  batch_no: string;
  _user_tags: string | null;
  _comments: string | null;
  _assign: string | null;
  _liked_by: string | null;
  job_cardcol: string | null;
  is_deleted: number;
}

interface JobCardListResponse {
  success: number;
  data: JobCardRecord[];
}

interface JobCardDetailResponse {
  success: number;
  data: JobCardRecord;
}

interface JobCardRow {
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const CheckBadge: React.FC<{ checked: boolean }> = ({ checked }) => (
  <div className={`jc-check-badge ${checked ? "jc-check-badge--on" : ""}`}>
    {checked && <Check size={12} color="#fff" strokeWidth={3} />}
  </div>
);

const StatusPill: React.FC<{ status: Status }> = ({ status }) => {
  const statusMap: Record<Status, { class: string; label: string }> = {
    Open: { class: "jc-status--open", label: "Open" },
    "Work In Progress": { class: "jc-status--inprogress", label: "Work In Progress" },
    Completed: { class: "jc-status--completed", label: "Completed" },
    "On Hold": { class: "jc-status--onhold", label: "On Hold" },
    Cancelled: { class: "jc-status--cancelled", label: "Cancelled" },
  };
  
  const info = statusMap[status] || statusMap.Open;
  return (
    <span className={`jc-status-pill ${info.class}`}>
      {info.label}
    </span>
  );
};

// ─── Timer Helpers ────────────────────────────────────────────────────────────

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

const getTimerInfo = (row: JobCardRow, now: Date): { label: string; colorVar: string; pulsing: boolean } => {
  // Actively running — count down to the expected end date
  if (row.actualStartDate && !row.actualEndDate) {
    if (row.expectedEndDate) {
      const diff = row.expectedEndDate.getTime() - now.getTime();
      if (diff > 0) {
        return { label: `Ends in ${formatDuration(diff)}`, colorVar: "var(--primary-color)", pulsing: true };
      }
      return { label: `Overdue by ${formatDuration(-diff)}`, colorVar: "var(--danger-color)", pulsing: true };
    }
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

// ─── Format date helper ──────────────────────────────────────────────────────

const formatDateAgo = (dateString: string): string => {
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

// ─── Main Component ───────────────────────────────────────────────────────────

const JobCardManagement: React.FC = () => {
  const { theme } = useAdminTheme();
  const [showNewJobCard, setShowNewJobCard] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editJobCardData, setEditJobCardData] = useState<JobCardRecord | null>(null);

  // Data state
  const [jobCardData, setJobCardData] = useState<JobCardRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // Sort
  const [sortOpen, setSortOpen] = useState(false);
  const [sortField, setSortField] = useState("Created On");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selected rows
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Timer tick
  const [now, setNow] = useState<Date>(() => new Date());

  const rootRef = useRef<HTMLDivElement>(null);

  // ─── Timer tick ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Calculate progress ────────────────────────────────────────────────────

  const calculateProgress = (qty: number, completedQty: number): number => {
    if (qty === 0) return 0;
    return Math.min(Math.round((completedQty / qty) * 100), 100);
  };

  // ─── Fetch Job Cards from API ──────────────────────────────────────────────

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Add search param
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      // Add status filter
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // Add sorting
      const sortMap: Record<string, string> = {
        'Created On': 'creation',
        'Work Order': 'work_order',
        'ID': 'id',
        'Operation': 'operation'
      };
      if (sortField in sortMap) {
        params.append('sort_by', sortMap[sortField]);
        params.append('sort_order', 'desc');
      }

      // Add pagination
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));

      const queryString = params.toString();
      const url = `/job-card${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<JobCardListResponse>(url);
      
      if (response.data.success === 1) {
        const records = response.data.data || [];
        setJobCardData(records);
        setTotalRecords(records.length);
      } else {
        setError('Failed to load job cards');
      }
    } catch (err: any) {
      console.error('Error fetching job cards:', err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch single Job Card for editing ─────────────────────────────────────

  const fetchJobCardForEdit = async (jobCardId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<JobCardDetailResponse>(`/job-card/${jobCardId}`);
      
      if (response.data.success === 1) {
        setEditJobCardData(response.data.data);
        setShowNewJobCard(true);
      } else {
        setError('Failed to load job card data for editing');
      }
    } catch (err: any) {
      console.error('Error fetching job card:', err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchJobCards();
  }, [currentPage, itemsPerPage, sortField, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchJobCards();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const closeAll = () => {
    setSortOpen(false);
  };

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean
  ) => {
    closeAll();
    setter(!current);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // ─── Transform API data to table rows ────────────────────────────────────

  const transformToRows = (records: JobCardRecord[]): JobCardRow[] => {
    return records.map(record => ({
      id: String(record.id),
      jobCardId: record.name || `JC-${record.id}`,
      workOrder: record.work_order || "",
      operation: record.operation || "",
      workstation: record.workstation || "",
      qty: record.for_quantity || 0,
      completedQty: record.total_completed_qty || 0,
      company: record.company || "",
      status: record.status || "Open",
      createdOn: new Date(record.creation).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      createdAgo: formatDateAgo(record.creation),
      progress: calculateProgress(record.for_quantity || 0, record.total_completed_qty || 0),
      expectedStartDate: record.expected_start_date ? new Date(record.expected_start_date) : null,
      expectedEndDate: record.expected_end_date ? new Date(record.expected_end_date) : null,
      actualStartDate: record.actual_start_date ? new Date(record.actual_start_date) : null,
      actualEndDate: record.actual_end_date ? new Date(record.actual_end_date) : null,
    }));
  };

  const tableData = transformToRows(jobCardData);

  // ─── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(validCurrentPage + 1);
  const goToPrevPage = () => goToPage(validCurrentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  // ─── Row selection ────────────────────────────────────────────────────────

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      const numId = Number(id);
      next.has(numId) ? next.delete(numId) : next.add(numId);
      return next;
    });
  };

  const allSelected = tableData.length > 0 && selectedRows.size === tableData.length;

  const toggleAll = () => {
    setSelectedRows(allSelected ? new Set() : new Set(tableData.map((r) => Number(r.id))));
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleView = (row: JobCardRow) => {
    console.log("View job card", row.id);
    // Navigate to view page or open modal
  };

  const handleEdit = (row: JobCardRow) => {
    fetchJobCardForEdit(Number(row.id));
  };

  const handleDelete = async (row: JobCardRow) => {
    if (window.confirm(`Are you sure you want to delete job card "${row.jobCardId}"?`)) {
      try {
        // DELETE with id in payload (not in URL)
        const response = await api.delete('/job-card', { data: { id: Number(row.id) } });
        if (response.data.success === 1) {
          await fetchJobCards();
          setSelectedRows(prev => {
            const next = new Set(prev);
            next.delete(Number(row.id));
            return next;
          });
          alert('Job card deleted successfully');
        } else {
          setError('Failed to delete job card');
        }
      } catch (err: any) {
        console.error('Error deleting job card:', err);
        setError(err.response?.data?.message || 'Failed to delete job card');
      }
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {showNewJobCard && (
        <JobCardManagement 
        //   onBack={() => {
        //     setShowNewJobCard(false);
        //     setEditJobCardData(null);
        //     fetchJobCards();
        //   }
        // } 
          // editData={editJobCardData}
        />
      )}
      {!showNewJobCard && (
        <div className={`jc-page ${theme}`} ref={rootRef}>
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="jc-header">
            <div className="jc-breadcrumb">
              <button className="jc-breadcrumb__home" onClick={() => console.log('Home')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <span className="jc-breadcrumb__sep">/</span>
              <span className="jc-breadcrumb__crumb">Manufacturing</span>
              <span className="jc-breadcrumb__sep">/</span>
              <span className="jc-breadcrumb__crumb--active">Job Cards</span>
            </div>
            <div className="jc-actions">
              <button className="jc-icon-btn jc-icon-btn--teal" title="Refresh" onClick={fetchJobCards}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Error message ────────────────────────────────────────────── */}
          {error && (
            <div className="jc-error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="jc-error-close">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Search and Filter Bar ─────────────────────────────────────── */}
          <div className="jc-filter-bar">
            <div className="jc-filter-left">
              <div className="jc-search-wrapper">
                <Search className="jc-search-icon" size={14} />
                <input
                  type="text"
                  placeholder="Search job cards by ID, work order, operation, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="jc-search-input"
                />
                {searchTerm && (
                  <button className="jc-search-clear" onClick={() => setSearchTerm('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="jc-filter-right">
              <select 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="jc-filter-select"
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="Work In Progress">Work In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button className="jc-sort-btn" onClick={() => toggle(setSortOpen, sortOpen)}>
                <ArrowUpDown size={12} />
                {sortField}
                <ChevronDown size={12} />
                {sortOpen && (
                  <div className="jc-menu jc-menu--list jc-menu--narrow jc-menu--right">
                    {SORT_FIELDS.map((f) => (
                      <div
                        key={f}
                        className={`jc-menu__item ${sortField === f ? "jc-menu__item--active" : ""}`}
                        onClick={() => {
                          setSortField(f);
                          setSortOpen(false);
                        }}
                      >
                        {sortField === f ? (
                          <Check size={14} className="jc-menu__check" />
                        ) : (
                          <span style={{ width: 14 }} />
                        )}
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
              <button className="jc-btn-primary" onClick={() => {
                setEditJobCardData(null);
                setShowNewJobCard(true);
              }}>
                <Plus size={12} />
                Add Job Card
              </button>
            </div>
          </div>

          {/* ── Active filters indicator ──────────────────────────────────── */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="jc-active-filters">
              <FilterIcon size={12} style={{ color: 'var(--primary-color)' }} />
              <span>Active filters:</span>
              {searchTerm && (
                <span><strong>Search:</strong> "{searchTerm}"</span>
              )}
              {statusFilter !== 'all' && (
                <span><strong>Status:</strong> {statusFilter}</span>
              )}
              <button 
                onClick={clearFilters}
                className="jc-clear-filters"
              >
                <X size={10} /> Clear All
              </button>
            </div>
          )}

          {/* ── Table ──────────────────────────────────────────────────────── */}
          <div className="jc-table-wrap">
            {loading ? (
              <div className="jc-loading-state">
                <div className="jc-spinner"></div>
                <p>Loading job cards...</p>
              </div>
            ) : (
              <table className="jc-table">
                <thead>
                  <tr>
                    <th className="jc-th-check">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="jc-checkbox"
                        disabled={tableData.length === 0}
                      />
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
                      <span className="jc-count-label">{totalRecords} total</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="jc-empty-state">
                        <div className="jc-empty-content">
                          <FileStack size={48} />
                          <p>No job cards found</p>
                          <span>
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search criteria' 
                              : 'Create your first job card by clicking "Add Job Card"'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tableData.map((row) => {
                      const timer = getTimerInfo(row, now);
                      return (
                        <tr
                          key={row.id}
                          className={`jc-tr ${selectedRows.has(Number(row.id)) ? "jc-tr-selected" : ""}`}
                        >
                          <td className="jc-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                            <input
                              type="checkbox"
                              checked={selectedRows.has(Number(row.id))}
                              onChange={() => toggleRow(row.id)}
                              className="jc-checkbox"
                            />
                          </td>
                          <td className="jc-td jc-td-id">
                            <a
                              className="jc-id-link"
                              href={`/job-cards/${row.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleView(row);
                              }}
                            >
                              {row.jobCardId}
                            </a>
                          </td>
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
                            <Building size={10} className="jc-company-icon" />
                            {row.company}
                          </td>
                          <td className="jc-td">
                            <StatusPill status={row.status} />
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
                              <Clock size={12} />
                              {timer.label}
                            </span>
                          </td>
                          <td className="jc-td jc-td-meta">
                            <span className="jc-ago">{row.createdAgo}</span>
                            <span className="jc-dot">·</span>
                            <div className="jc-action-buttons">
                              <button 
                                className="jc-action-btn jc-action-view" 
                                onClick={(e) => { e.stopPropagation(); handleView(row); }}
                                title="View"
                              >
                                <Eye size={12} />
                              </button>
                              <button 
                                className="jc-action-btn jc-action-edit" 
                                onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                                title="Edit"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                className="jc-action-btn jc-action-delete" 
                                onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {!loading && totalRecords > 0 && (
            <div className="jc-pagination">
              <div className="jc-pagination-left">
                <span className="jc-pagination-label">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="jc-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="jc-pagination-label">entries</span>
              </div>
              <div className="jc-pagination-center">
                <button 
                  onClick={goToFirstPage} 
                  disabled={validCurrentPage === 1 || totalRecords === 0} 
                  className="jc-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="11 17 6 12 11 7"/>
                    <polyline points="18 17 13 12 18 7"/>
                  </svg>
                </button>
                <button 
                  onClick={goToPrevPage} 
                  disabled={validCurrentPage === 1 || totalRecords === 0} 
                  className="jc-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`jc-page-btn ${validCurrentPage === page ? 'jc-page-btn-active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={goToNextPage} 
                  disabled={validCurrentPage === totalPages || totalRecords === 0} 
                  className="jc-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
                <button 
                  onClick={goToLastPage} 
                  disabled={validCurrentPage === totalPages || totalRecords === 0} 
                  className="jc-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 17 18 12 13 7"/>
                    <polyline points="6 17 11 12 6 7"/>
                  </svg>
                </button>
              </div>
              <div className="jc-pagination-right">
                <span className="jc-pagination-info">
                  Showing {getStartIndex()} to {getEndIndex()} of {totalRecords} entries
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pulse animation for the "running" timer dot */}
      <style>{`
        @keyframes jc-timer-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
};

export default JobCardManagement;