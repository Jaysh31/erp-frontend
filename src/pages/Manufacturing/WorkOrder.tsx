// WorkOrderList.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  FaTasks,
} from 'react-icons/fa';
import "./WorkOrder.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

type Status = "Draft" | "Not Started" | "In Process" | "Completed" | "Stopped";

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
  progress: number; // Now based on job cards only
  createdAgo: string;
  totalJobCards: number;
  completedJobCards: number;
  jobCardProgress: string;
  canComplete: boolean;
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

export default function WorkOrderList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [, setWorkOrders] = useState<WorkOrderDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkOrderDisplay | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrderDisplay[]>([]);
  const [completionProgress, setCompletionProgress] = useState<number>(0);

  const pageSizeOptions = [10, 25, 50, 100];
  const dateFilterOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
  ];

  // Format date to relative time
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

  // Calculate progress based on job cards only
  const calculateJobCardProgress = (total: number = 0, completed: number = 0): number => {
    if (total === 0) return 0;
    return Math.min(Math.round((completed / total) * 100), 100);
  };

  // Check if work order can be completed
  const canCompleteWorkOrder = (status: Status, totalJobCards: number, completedJobCards: number): boolean => {
    if (status === 'Completed' || status === 'Stopped') return false;
    if (totalJobCards === 0) return false;
    return completedJobCards >= totalJobCards;
  };

  // Check if date falls within filter range
  const isDateInRange = (dateString: string, filter: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
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

  // Fetch work orders from API
  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      console.log(`Calling API: /work-order?${params.toString()}`);
      const response = await api.get<ApiResponse>(`/work-order?${params.toString()}`);

      if (response.data.success === 1) {
        const { records, total, limit } = response.data.data;
        setTotalItems(total);
        const totalPagesCalc = Math.max(1, Math.ceil(total / limit));
        setTotalPages(totalPagesCalc);

        const transformedData: WorkOrderDisplay[] = records.map((item: WorkOrder) => {
          const totalJobCards = item.total_job_cards || 0;
          const completedJobCards = item.completed_job_cards || 0;
          // Progress is now based on job cards only
          const progress = calculateJobCardProgress(totalJobCards, completedJobCards);
          
          return {
            id: item.id.toString(),
            name: item.name,
            productionItem: item.production_item,
            qty: item.qty,
            producedQty: item.produced_qty,
            status: item.status,
            plannedStartDate: item.planned_start_date,
            plannedEndDate: item.planned_end_date,
            progress: progress, // Now based on job cards
            createdAgo: formatDate(item.planned_start_date),
            totalJobCards,
            completedJobCards,
            jobCardProgress: item.job_card_progress || `${completedJobCards}/${totalJobCards}`,
            canComplete: canCompleteWorkOrder(item.status, totalJobCards, completedJobCards),
          };
        });

        setWorkOrders(transformedData);
        setAllWorkOrders(transformedData);
      } else {
        setError('Failed to fetch work orders');
      }
    } catch (err) {
      console.error('Error fetching work orders:', err);
      setError('An error occurred while fetching work orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  // Fetch all work orders for filtering (client-side)
  const fetchAllWorkOrders = useCallback(async () => {
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
        const transformedData: WorkOrderDisplay[] = records.map((item: WorkOrder) => {
          const totalJobCards = item.total_job_cards || 0;
          const completedJobCards = item.completed_job_cards || 0;
          // Progress is now based on job cards only
          const progress = calculateJobCardProgress(totalJobCards, completedJobCards);
          
          return {
            id: item.id.toString(),
            name: item.name,
            productionItem: item.production_item,
            qty: item.qty,
            producedQty: item.produced_qty,
            status: item.status,
            plannedStartDate: item.planned_start_date,
            plannedEndDate: item.planned_end_date,
            progress: progress, // Now based on job cards
            createdAgo: formatDate(item.planned_start_date),
            totalJobCards,
            completedJobCards,
            jobCardProgress: item.job_card_progress || `${completedJobCards}/${totalJobCards}`,
            canComplete: canCompleteWorkOrder(item.status, totalJobCards, completedJobCards),
          };
        });
        setAllWorkOrders(transformedData);
      }
    } catch (err) {
      console.error('Error fetching all work orders:', err);
    }
  }, [searchTerm, statusFilter]);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  // Fetch when page, itemsPerPage, search, or status changes
  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  // Fetch all data for filtering
  useEffect(() => {
    fetchAllWorkOrders();
  }, [fetchAllWorkOrders]);



  const goToFirstPage = () => {
    if (totalPages > 0) {
      console.log('Going to first page');
      setCurrentPage(1);
    }
  };

  const goToLastPage = () => {
    if (totalPages > 0) {
      console.log(`Going to last page: ${totalPages}`);
      setCurrentPage(totalPages);
    }
  };

  const goToNextPage = () => {
    console.log(`Next page clicked. Current: ${currentPage}, Total: ${totalPages}`);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else {
      console.log('Wrapping to page 1');
      setCurrentPage(1);
    }
  };

  const goToPrevPage = () => {
    console.log(`Prev page clicked. Current: ${currentPage}, Total: ${totalPages}`);
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else {
      console.log(`Wrapping to page ${totalPages}`);
      setCurrentPage(totalPages);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    console.log(`Changing page size to: ${newSize}`);
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };


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
        fetchWorkOrders();
        fetchAllWorkOrders();
      }
    } catch (err) {
      console.error('Error deleting work order:', err);
      alert('Failed to delete work order');
      setDeletingId(null);
    }
  };

  // Handle complete work order
  const handleCompleteWorkOrder = (item: WorkOrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.canComplete) {
      alert('This work order cannot be completed. Please check job cards.');
      return;
    }
    setSelectedItem(item);
    // Calculate completion progress
    const progress = item.totalJobCards > 0 
      ? Math.round((item.completedJobCards / item.totalJobCards) * 100)
      : 0;
    setCompletionProgress(progress);
    setShowCompleteConfirm(true);
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
        // Refresh the list
        fetchWorkOrders();
        fetchAllWorkOrders();
        // Show success message
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

  // Navigate to job cards for work order
  const handleViewJobCards = (item: WorkOrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/job-card?work_order=${item.id}`);
  };

  // Navigate to edit form (view mode)
  const handleRowClick = (item: WorkOrderDisplay) => {
    navigate(`/work-order/${encodeURIComponent(item.id)}`);
  };

  const handleEdit = (item: WorkOrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/work-order/${encodeURIComponent(item.id)}`);
  };

  const handleView = (item: WorkOrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/work-order/${encodeURIComponent(item.id)}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  const getStartIndex = () => {
    return (currentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(currentPage * itemsPerPage, totalItems);
  };

  // Filter data from all work orders for display
  const filteredData = allWorkOrders.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.productionItem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDate = dateFilter === 'all' || isDateInRange(item.plannedStartDate, dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Get status icon
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Completed':
        return <FaCheckCircle size={14} />;
      case 'In Process':
        return <FaClock size={14} />;
      case 'Not Started':
        return <FaPlay size={14} />;
      case 'Stopped':
        return <FaStop size={14} />;
      default:
        return <FaFileAlt size={14} />;
    }
  };

  // Get progress color based on percentage
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#22c55e';
    if (progress >= 70) return '#3b82f6';
    if (progress >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`wo-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="wo-filter-bar">
        <div className="wo-filter-left">
          <div className="wo-search-wrapper">
            <FaSearch className="wo-search-icon" />
            <input
              type="text"
              placeholder="Search work orders by name or item..."
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
          <button className="wo-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="wo-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="wo-btn-primary" onClick={() => navigate("/work-order/new")}>
            <FaPlus size={12} />
            Add Work Order
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
        <div className="wo-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
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
          {dateFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Date:</strong> {dateFilterOptions.find(o => o.value === dateFilter)?.label}
            </span>
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
          <FaSpinner className="spinning" size={24} />
          <p>Loading work orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="wo-error">
          <p>{error}</p>
          <button onClick={fetchWorkOrders} className="wo-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="wo-table-wrap">
            <table className="wo-table">
              <thead>
                <tr>
                  <th className="wo-th">WO #</th>
                  <th className="wo-th">Production Item</th>
                  <th className="wo-th">Qty</th>
                  <th className="wo-th">Job Cards</th>
                  <th className="wo-th">Progress</th>
                  <th className="wo-th">Status</th>
                  <th className="wo-th">Planned Dates</th>
                  <th className="wo-th wo-th-meta">
                    <span className="wo-count-label">{filteredData.length} of {totalItems}</span>
                    <FaTasks size={14} style={{ color: 'var(--text-secondary, #9ca3af)' }} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="wo-empty-state">
                      <div className="wo-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <p>No work orders found on page {currentPage}</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr
                      key={row.id}
                      className="wo-tr"
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="wo-td wo-td-id">{row.name}</td>
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
                          <span>{new Date(row.plannedStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="wo-td wo-td-meta" onClick={(e) => e.stopPropagation()}>
                        <span className="wo-ago">{row.createdAgo}</span>
                        <span className="wo-dot">·</span>
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
                          {row.canComplete && (
                            <button
                              className="wo-action-btn wo-action-complete"
                              onClick={(e) => handleCompleteWorkOrder(row, e)}
                              title="Complete Work Order"
                              disabled={completingId === row.id}
                            >
                              {completingId === row.id ? (
                                <FaSpinner className="spinning" size={12} />
                              ) : (
                                <FaCheckCircle size={12} />
                              )}
                            </button>
                          )}
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

          {/* Pagination - ALWAYS SHOW */}
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
                disabled={currentPage === 1 || totalPages === 0}
                className="wo-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button
                onClick={goToPrevPage}
                disabled={totalPages === 0}
                className="wo-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {/* Only show current page number */}
              <button className="wo-page-btn wo-page-btn-active">
                {currentPage}
              </button>
              <button
                onClick={goToNextPage}
                disabled={totalPages === 0}
                className="wo-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="wo-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="wo-pagination-right">
              <span className="wo-pagination-info">
                {totalItems > 0
                  ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }

        /* Job Card Styles */
        .wo-job-card-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .wo-job-card-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #111827);
          min-width: 40px;
        }

        .wo-job-card-bar {
          width: 50px;
          height: 4px;
          background: var(--bg-secondary, #e5e7eb);
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .wo-job-card-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .wo-job-card-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wo-job-card-btn:hover {
          background: var(--bg-secondary, #f3f4f6);
          color: var(--primary-color, #3b82f6);
        }

        /* Status Badge with Icon */
        .wo-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        /* Complete Action Button */
        .wo-action-complete {
          color: #22c55e;
        }

        .wo-action-complete:hover:not(:disabled) {
          background: #dcfce7;
          color: #16a34a;
        }

        .wo-action-complete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wo-action-complete .spinning {
          color: #22c55e;
        }

        /* Complete Modal */
        .wo-modal-complete .wo-modal-body {
          padding: 24px;
        }

        .wo-complete-summary {
          text-align: center;
        }

        .wo-complete-icon {
          margin-bottom: 16px;
        }

        .wo-complete-summary h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #111827);
        }

        .wo-complete-detail {
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
          margin-bottom: 20px;
        }

        .wo-complete-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 16px 0;
          padding: 16px;
          background: var(--bg-secondary, #f9fafb);
          border-radius: 8px;
        }

        .wo-complete-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .wo-complete-stat span {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .wo-complete-stat strong {
          font-size: 16px;
          color: var(--text-primary, #111827);
        }

        .wo-complete-progress {
          margin: 16px 0;
        }

        .wo-complete-progress-bar {
          height: 8px;
          background: var(--bg-secondary, #e5e7eb);
          border-radius: 4px;
          overflow: hidden;
        }

        .wo-complete-progress-bar .wo-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .wo-complete-warning {
          font-size: 13px;
          color: #f59e0b;
          background: #fffbeb;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #fcd34d;
          margin-top: 16px;
        }

        .wo-btn-complete {
          padding: 8px 20px;
          background: #22c55e;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .wo-btn-complete:hover:not(:disabled) {
          background: #16a34a;
        }

        .wo-btn-complete:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Dark mode styles */
        .dashboard.dark .wo-job-card-text {
          color: #f3f4f6;
        }

        .dashboard.dark .wo-job-card-bar {
          background: #374151;
        }

        .dashboard.dark .wo-complete-summary h3 {
          color: #f3f4f6;
        }

        .dashboard.dark .wo-complete-detail {
          color: #9ca3af;
        }

        .dashboard.dark .wo-complete-stats {
          background: #374151;
        }

        .dashboard.dark .wo-complete-stat strong {
          color: #f3f4f6;
        }

        .dashboard.dark .wo-complete-warning {
          background: #374151;
          border-color: #f59e0b;
          color: #fbbf24;
        }

        .dashboard.dark .wo-action-complete:hover:not(:disabled) {
          background: #1a3a2a;
        }

        .dashboard.dark .wo-job-card-btn:hover {
          background: #374151;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .wo-job-card-info {
            flex-wrap: wrap;
          }
          
          .wo-job-card-bar {
            width: 40px;
          }

          .wo-complete-stats {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .wo-status-badge {
            font-size: 11px;
            padding: 3px 8px;
          }
        }
      `}</style>
    </div>
  );
}