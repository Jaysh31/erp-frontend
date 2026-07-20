// JobCardManagement.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaBuilding,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import "./JobCardManagement.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../../src/services/api";

type Status = "Open" | "Work In Progress" | "Completed" | "On Hold" | "Cancelled";

/** Shape returned by GET /job-card – now includes `process_loss_qty` and `sequence_id`. */
interface JobCardApiRecord {
  id: number;
  name: string;
  work_order: string;
  operation: string;
  workstation: string;
  for_quantity?: number;
  requested_qty?: number;
  total_completed_qty: number;
  process_loss_qty: number;
  sequence_id: number;        // <-- added for ordering operations
  company: string;
  status: Status;
  creation?: string;
  posting_date?: string;
  expected_start_date?: string | null;
  expected_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
}

interface JobCardDisplay {
  id: string;
  recordId: number;
  jobCardId: string;
  workOrder: string;
  operation: string;
  workstation: string;
  qty: number;
  completedQty: number;
  lossQty: number;
  sequenceId: number;         // <-- added
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

// Group by Work Order – now uses aggregated quantities
interface WorkOrderGroup {
  workOrder: string;
  jobCards: JobCardDisplay[];
  totalQty: number;
  completedQty: number;
  lossQty: number;
  progress: number;
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

// ─── timer helpers (unchanged) ──────────────────────────────────────────

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
  if (row.actualStartDate && row.actualEndDate) {
    const total = row.actualEndDate.getTime() - row.actualStartDate.getTime();
    return { label: `Done in ${formatDuration(total)}`, colorVar: "var(--text-secondary)", pulsing: false };
  }
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
  const [groups, setGroups] = useState<WorkOrderGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JobCardDisplay | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // Tick every second
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

  // ─── progress using completed + loss (both count as done) ──────────────
  const calculateProgress = (qty: number, completed: number, loss: number): number => {
    if (qty === 0) return 0;
    const totalDone = completed + loss;
    return Math.min(Math.round((totalDone / qty) * 100), 100);
  };

  // ─── fetch data ────────────────────────────────────────────────────────
  const fetchJobCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/job-card");
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to fetch job cards");
      }

      const all: JobCardApiRecord[] = response.data.data || [];

      const transformedData: JobCardDisplay[] = all.map((item) => {
        const qty = item.for_quantity ?? item.requested_qty ?? 0;
        const completed = item.total_completed_qty || 0;
        const loss = item.process_loss_qty || 0;
        const createdOn = item.creation || item.posting_date || new Date().toISOString();
        return {
          id: item.name || `jc-${item.id}`,
          recordId: item.id,
          jobCardId: item.name || `JC-${item.id}`,
          workOrder: item.work_order,
          operation: item.operation || "N/A",
          workstation: item.workstation || "N/A",
          qty,
          completedQty: completed,
          lossQty: loss,
          sequenceId: item.sequence_id || 0,
          company: item.company,
          status: item.status,
          createdOn,
          progress: calculateProgress(qty, completed, loss),
          createdAgo: formatDate(createdOn),
          expectedStartDate: item.expected_start_date ? new Date(item.expected_start_date) : null,
          expectedEndDate: item.expected_end_date ? new Date(item.expected_end_date) : null,
          actualStartDate: item.actual_start_date ? new Date(item.actual_start_date) : null,
          actualEndDate: item.actual_end_date ? new Date(item.actual_end_date) : null,
        };
      });

      // Sort by creation date (latest first)
      transformedData.sort(
        (a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
      );

      setTotalItems(transformedData.length);
      setJobCards(transformedData);
      groupByWorkOrder(transformedData);
    } catch (err: any) {
      console.error("Error fetching job cards:", err);
      setError(err.response?.data?.message || "An error occurred while loading job cards");
    } finally {
      setLoading(false);
    }
  };

  // ─── Group by Work Order with operations sorted by sequence_id ──────────
  const groupByWorkOrder = (data: JobCardDisplay[]) => {
    const groupMap = new Map<string, JobCardDisplay[]>();
    data.forEach(jc => {
      if (!groupMap.has(jc.workOrder)) {
        groupMap.set(jc.workOrder, []);
      }
      groupMap.get(jc.workOrder)!.push(jc);
    });

    const grouped: WorkOrderGroup[] = Array.from(groupMap.entries()).map(([workOrder, cards]) => {
      // Sort job cards within the group by sequence_id (ascending)
      const sortedCards = [...cards].sort((a, b) => a.sequenceId - b.sequenceId);
      
      const totalQty = sortedCards.reduce((sum, c) => sum + c.qty, 0);
      const completedQty = sortedCards.reduce((sum, c) => sum + c.completedQty, 0);
      const lossQty = sortedCards.reduce((sum, c) => sum + c.lossQty, 0);
      const progress = totalQty > 0 ? Math.round(((completedQty + lossQty) / totalQty) * 100) : 0;

      return {
        workOrder,
        jobCards: sortedCards,
        totalQty,
        completedQty,
        lossQty,
        progress,
      };
    });

    // Sort groups by the latest job card creation date within each group
    grouped.sort((a, b) => {
      const latestA = Math.max(...a.jobCards.map(jc => new Date(jc.createdOn).getTime()));
      const latestB = Math.max(...b.jobCards.map(jc => new Date(jc.createdOn).getTime()));
      return latestB - latestA;
    });

    setGroups(grouped);

    if (grouped.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set([grouped[0].workOrder]));
    }
  };

  const toggleGroup = (workOrder: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(workOrder)) {
        next.delete(workOrder);
      } else {
        next.add(workOrder);
      }
      return next;
    });
  };

  // ─── filtering ──────────────────────────────────────────────────────────
  const getFilteredGroups = () => {
    let filtered = groups;

    if (searchTerm.trim()) {
      filtered = filtered.filter(group =>
        group.workOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.jobCards.some(jc =>
          jc.jobCardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jc.operation.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(group =>
        group.jobCards.some(jc => jc.status === statusFilter)
      );
    }

    return filtered;
  };

  useEffect(() => {
    fetchJobCards();
  }, []);

  const handleDelete = (item: JobCardDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      const response = await api.delete(`/job-card/${selectedItem.recordId}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to delete job card");
      }
      setShowDeleteConfirm(false);
      setSelectedItem(null);
      fetchJobCards();
    } catch (err: any) {
      console.error("Error deleting job card:", err);
      alert(err.response?.data?.message || "Failed to delete job card");
    }
  };

  const handleRowClick = (item: JobCardDisplay) => {
    navigate(`/job-cards/${item.recordId}`);
  };

  const handleEdit = (item: JobCardDisplay) => {
    navigate(`/job-cards/${item.recordId}`);
  };

  const handleView = (item: JobCardDisplay) => {
    navigate(`/job-cards/${item.recordId}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  // ─── Overall stats based on quantities ────────────────────────────────
  const totalQty = jobCards.reduce((sum, jc) => sum + jc.qty, 0);
  const totalCompleted = jobCards.reduce((sum, jc) => sum + jc.completedQty, 0);
  const totalLoss = jobCards.reduce((sum, jc) => sum + jc.lossQty, 0);
  const overallProgress = totalQty > 0 ? Math.round(((totalCompleted + totalLoss) / totalQty) * 100) : 0;
  const totalJobCards = jobCards.length;

  return (
    <div className={`jc-page ${theme}`}>
      {/* Stats Cards – updated to show completed, loss, and overall progress */}
      <div className="jc-stats-container">
        <div className="jc-stat-card" style={{ background: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
          <div className="jc-stat-icon" style={{ color: '#3B82F6' }}>
            <FaClipboardList size={18} />
          </div>
          <div className="jc-stat-content">
            <p className="jc-stat-title">Total Job Cards</p>
            <p className="jc-stat-value">{totalJobCards}</p>
          </div>
        </div>
        <div className="jc-stat-card" style={{ background: '#ECFDF5', borderLeft: '4px solid #10B981' }}>
          <div className="jc-stat-icon" style={{ color: '#10B981' }}>
            <FaCheckCircle size={18} />
          </div>
          <div className="jc-stat-content">
            <p className="jc-stat-title">Completed Qty</p>
            <p className="jc-stat-value">{totalCompleted}</p>
          </div>
        </div>
        <div className="jc-stat-card" style={{ background: '#FEF3C7', borderLeft: '4px solid #F59E0B' }}>
          <div className="jc-stat-icon" style={{ color: '#F59E0B' }}>
            <FaClock size={18} />
          </div>
          <div className="jc-stat-content">
            <p className="jc-stat-title">Loss / Scrap</p>
            <p className="jc-stat-value">{totalLoss}</p>
          </div>
        </div>
        <div className="jc-stat-card" style={{ background: '#F5F3FF', borderLeft: '4px solid #8B5CF6' }}>
          <div className="jc-stat-icon" style={{ color: '#8B5CF6' }}>
            <FaBuilding size={18} />
          </div>
          <div className="jc-stat-content">
            <p className="jc-stat-title">Overall Progress</p>
            <p className="jc-stat-value">{overallProgress}%</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar (unchanged) */}
      <div className="jc-filter-bar">
        <div className="jc-filter-left">
          <div className="jc-search-wrapper">
            <FaSearch className="jc-search-icon" />
            <input
              type="text"
              placeholder="Search by Work Order, Job Card ID, or Operation..."
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
          <button className="jc-btn-primary" onClick={() => navigate("/job-cards/new")}>
            <FaPlus size={12} />
            Add Job Card
          </button>
        </div>
      </div>

      {/* Active filters indicator (unchanged) */}
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

      {/* Loading / Error states (unchanged) */}
      {loading && (
        <div className="jc-loading">
          <p>Loading job cards...</p>
        </div>
      )}
      {error && (
        <div className="jc-error">
          <p>{error}</p>
          <button onClick={fetchJobCards} className="jc-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Grouped Table */}
      {!loading && !error && (
        <div className="jc-table-wrap">
          {getFilteredGroups().length === 0 ? (
            <div className="jc-empty-state">
              <div className="jc-empty-content">
                <FaClipboardList size={48} />
                <p>No job cards found</p>
                <span>Try adjusting your search criteria</span>
              </div>
            </div>
          ) : (
            <div className="jc-group-container">
              {getFilteredGroups().map((group) => {
                const isExpanded = expandedGroups.has(group.workOrder);
                const filteredCards = group.jobCards.filter(jc => {
                  if (statusFilter === "all") return true;
                  return jc.status === statusFilter;
                });

                return (
                  <div key={group.workOrder} className="jc-group">
                    {/* Group Header – updated stats */}
                    <div
                      className="jc-group-header"
                      onClick={() => toggleGroup(group.workOrder)}
                    >
                      <div className="jc-group-header-left">
                        <span className="jc-group-toggle">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <span className="jc-group-title">
                          <FaBuilding className="jc-group-icon" />
                          {group.workOrder}
                        </span>
                      </div>
                      <div className="jc-group-header-right">
                        <span className="jc-group-stats">
                          {group.completedQty + group.lossQty} of {group.totalQty} qty done
                        </span>
                        <div className="jc-group-progress">
                          <div className="jc-group-progress-bar">
                            <div
                              className="jc-group-progress-fill"
                              style={{ width: `${group.progress}%` }}
                            />
                          </div>
                          <span className="jc-group-progress-text">{group.progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Group Body – Job Cards */}
                    {isExpanded && (
                      <table className="jc-table">
                        <thead>
                          <tr>
                            <th className="jc-th">#</th>
                            <th className="jc-th">Job Card #</th>
                            <th className="jc-th">Operation</th>
                            <th className="jc-th">Workstation</th>
                            <th className="jc-th">Qty</th>
                            <th className="jc-th">Progress</th>
                            <th className="jc-th">Status</th>
                            <th className="jc-th">Timer</th>
                            <th className="jc-th jc-th-meta">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCards.map((row, index) => {
                            const timer = getTimerInfo(row, now);
                            return (
                              <tr
                                key={row.id}
                                className="jc-tr"
                                onClick={() => handleRowClick(row)}
                                style={{ cursor: "pointer" }}
                              >
                                <td className="jc-td jc-td-number">{index + 1}</td>
                                <td className="jc-td jc-td-id">{row.jobCardId}</td>
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
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal (unchanged) */}
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

      <style>{`
        @keyframes jc-timer-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}