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

  const [workOrders, setWorkOrders] = useState<WorkOrderDisplay[]>([]);
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
  const [selectedItem, setSelectedItem] = useState<WorkOrderDisplay | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrderDisplay[]>([]);

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

  // Calculate progress percentage
  const calculateProgress = (qty: number, producedQty: number): number => {
    if (qty === 0) return 0;
    return Math.min(Math.round((producedQty / qty) * 100), 100);
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

        const transformedData: WorkOrderDisplay[] = records.map((item: WorkOrder) => ({
          id: item.id.toString(),
          name: item.name,
          productionItem: item.production_item,
          qty: item.qty,
          producedQty: item.produced_qty,
          status: item.status,
          plannedStartDate: item.planned_start_date,
          plannedEndDate: item.planned_end_date,
          progress: calculateProgress(item.qty, item.produced_qty),
          createdAgo: formatDate(item.planned_start_date),
        }));

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
        const transformedData: WorkOrderDisplay[] = records.map((item: WorkOrder) => ({
          id: item.id.toString(),
          name: item.name,
          productionItem: item.production_item,
          qty: item.qty,
          producedQty: item.produced_qty,
          status: item.status,
          plannedStartDate: item.planned_start_date,
          plannedEndDate: item.planned_end_date,
          progress: calculateProgress(item.qty, item.produced_qty),
          createdAgo: formatDate(item.planned_start_date),
        }));
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

  const goToPage = (page: number) => {
    if (page < 1) {
      page = totalPages;
    } else if (page > totalPages) {
      page = 1;
    }

    if (page >= 1 && page <= totalPages) {
      console.log(`Going to page: ${page}`);
      setCurrentPage(page);
    }
  };

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

  // Only show current page number
  const getPageNumbers = () => {
    return [currentPage];
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
                  <th className="wo-th">Progress</th>
                  <th className="wo-th">Status</th>
                  <th className="wo-th">Planned Dates</th>
                  <th className="wo-th wo-th-meta">
                    <span className="wo-count-label">{filteredData.length} of {totalItems}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="wo-empty-state">
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
                        <div className="wo-progress-container">
                          <div className="wo-progress-bar">
                            <div 
                              className="wo-progress-fill" 
                              style={{ width: `${row.progress}%` }}
                            />
                          </div>
                          <span className="wo-progress-text">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="wo-td">
                        <span className={`wo-status-badge ${STATUS_CLASS[row.status]}`}>
                          {STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td className="wo-td wo-td-dates">
                        <div className="wo-date-range">
                          <FaCalendarAlt size={12} style={{ color: 'var(--text-secondary)', marginRight: '4px' }} />
                          <span>{new Date(row.plannedStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="wo-date-sep">→</span>
                          <span>{new Date(row.plannedEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}