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
  FaBoxes,
  FaCheckCircle,
  FaSpinner,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaClock,
  FaIndustry,
} from 'react-icons/fa';
import "./OperationListing.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface Operation {
  id: number;
  name: string;
  creation: string;
  modified: string;
  modified_by: string;
  owner: string;
  docstatus: number;
  idx: number;
  workstation: string;
  is_corrective_operation: number;
  create_job_card_based_on_batch_size: number;
  quality_inspection_template: string;
  batch_size: number;
  total_operation_time: number;
  description: string;
  _user_tags: string;
  _comments: string | null;
  _assign: string | null;
  _liked_by: string | null;
}

interface ApiResponse {
  success: number;
  data: Operation[];
}

export default function OperationList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField] = useState<string>('creation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  // ─── Fetch operations from API ────────────────────────────────────────────

  const fetchOperations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>('/operation');
      
      if (response.data.success === 1) {
        const records = response.data.data || [];
        // Sort by ID in ascending order
        records.sort((a, b) => a.id - b.id);
        setOperations(records);
        setTotalItems(records.length);
      } else {
        setError('Failed to fetch operations');
        setOperations([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Error fetching operations:', err);
      setError('An error occurred while fetching operations');
      setOperations([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ─── Filter and sort data ─────────────────────────────────────────────────

  const filteredAndSortedOperations = operations
    .filter(op => {
      const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           op.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           op.workstation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && op.docstatus === 0) ||
                           (statusFilter === 'submitted' && op.docstatus === 1) ||
                           (statusFilter === 'cancelled' && op.docstatus === 2);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'creation':
          comparison = new Date(a.creation).getTime() - new Date(b.creation).getTime();
          break;
        case 'workstation':
          comparison = a.workstation.localeCompare(b.workstation);
          break;
        case 'total_operation_time':
          comparison = a.total_operation_time - b.total_operation_time;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const paginatedData = filteredAndSortedOperations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedOperations.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  if (validCurrentPage !== currentPage && currentPage > 1) {
    setCurrentPage(validCurrentPage);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  const totalActive = operations.filter(op => op.docstatus === 0).length;
  const totalSubmitted = operations.filter(op => op.docstatus === 1).length;
  const uniqueWorkstations = [...new Set(operations.map(op => op.workstation))].length;

  const stats = [
    { 
      title: 'Total Operations', 
      value: totalItems, 
      icon: <FaBoxes />, 
      color: '#3B82F6',
      lightColor: '#EFF6FF'
    },
    { 
      title: 'Active', 
      value: totalActive, 
      icon: <FaCheckCircle />, 
      color: '#10B981',
      lightColor: '#ECFDF5'
    },
    { 
      title: 'Submitted', 
      value: totalSubmitted, 
      icon: <FaClock />, 
      color: '#F59E0B',
      lightColor: '#FFFBEB'
    },
    { 
      title: 'Workstations', 
      value: uniqueWorkstations, 
      icon: <FaIndustry />, 
      color: '#8B5CF6',
      lightColor: '#F5F3FF'
    },
  ];

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

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, filteredAndSortedOperations.length);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleRowClick = (operation: Operation) => {
    navigate(`/operation/${operation.id}`, { 
      state: { operationData: operation, mode: 'view' } 
    });
  };

  const handleViewOperation = (operation: Operation) => {
    navigate(`/operation/${operation.id}`, { 
      state: { operationData: operation, mode: 'view' } 
    });
  };

  const handleEditOperation = (operation: Operation) => {
    navigate(`/operation/${operation.id}/edit`, { 
      state: { operationData: operation } 
    });
  };

  const handleDeleteOperation = async (operation: Operation) => {
    if (window.confirm(`Are you sure you want to delete operation "${operation.name}"?`)) {
      try {
        setDeletingId(operation.id);
        await api.delete(`/operation/${operation.id}`);
        await fetchOperations();
        alert('Operation deleted successfully');
      } catch (err) {
        console.error('Error deleting operation:', err);
        alert('Failed to delete operation');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleAddOperation = () => {
    navigate('/operation/new');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  // ─── Status Helpers ──────────────────────────────────────────────────────

  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <span className="op-status-badge op-status-active">Active</span>;
      case 1:
        return <span className="op-status-badge op-status-submitted">Submitted</span>;
      case 2:
        return <span className="op-status-badge op-status-cancelled">Cancelled</span>;
      default:
        return null;
    }
  };

  const getOperationType = (operation: Operation) => {
    return operation.is_corrective_operation === 1 ? 'Corrective' : 'Standard';
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`op-page ${theme}`}>
      {/* Stats Cards */}
      <div className="op-stats-container">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="op-stat-card" 
            style={{ 
              background: stat.lightColor,
              borderLeft: `4px solid ${stat.color}`
            }}
          >
            <div className="op-stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="op-stat-content">
              <p className="op-stat-title">{stat.title}</p>
              <p className="op-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="op-filter-bar">
        <div className="op-filter-left">
          <div className="op-search-wrapper">
            <FaSearch className="op-search-icon" />
            <input
              type="text"
              placeholder="Search operations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="op-search-input"
            />
            {searchTerm && (
              <button className="op-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="op-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="op-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="submitted">Submitted</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="op-sort-btn" onClick={() => {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Sort {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
          <button 
            className="op-btn-primary" 
            onClick={handleAddOperation}
          >
            <FaPlus size={12} />
            Add Operation
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="op-active-filters">
          <FaFilter size={12} style={{ color: '#3B82F6' }} />
          <span>Active filters:</span>
          {searchTerm && (
            <span><strong>Search:</strong> "{searchTerm}"</span>
          )}
          {statusFilter !== 'all' && (
            <span><strong>Status:</strong> {statusFilter}</span>
          )}
          <button 
            onClick={clearFilters}
            className="op-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="op-loading">
          <FaSpinner className="spinning" size={24} />
          <p>Loading operations...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="op-error">
          <p>{error}</p>
          <button onClick={fetchOperations} className="op-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="op-table-container">
            {paginatedData.length === 0 ? (
              <div className="op-empty-state">
                <div className="op-empty-content">
                  <FaBoxes size={48} />
                  <p>No operations found</p>
                  <span>Try adjusting your search criteria</span>
                </div>
              </div>
            ) : (
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Workstation</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Time (min)</th>
                    <th >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className="op-tr"
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="op-td-name">{row.name}</td>
                      <td>{row.workstation}</td>
                      <td>
                        {getStatusBadge(row.docstatus)}
                      </td>
                      <td>{getOperationType(row)}</td>
                      <td>{row.total_operation_time}</td>
                      <td className="op-td-meta">
                        <span className="op-ago">{formatDate(row.creation)}</span>
                        <span className="op-dot">·</span>
                        <div className="op-action-buttons">
                          <button 
                            className="op-action-btn op-action-view" 
                            onClick={(e) => { e.stopPropagation(); handleViewOperation(row); }}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button 
                            className="op-action-btn op-action-edit" 
                            onClick={(e) => { e.stopPropagation(); handleEditOperation(row); }}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="op-action-btn op-action-delete" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteOperation(row); }}
                            disabled={deletingId === row.id}
                            title="Delete"
                          >
                            {deletingId === row.id ? <FaSpinner className="spinning" size={12} /> : <FaTrash size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredAndSortedOperations.length > 0 && totalPages > 1 && (
            <div className="op-pagination">
              <div className="op-pagination-left">
                <span className="op-pagination-label">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="op-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="op-pagination-label">entries</span>
              </div>
              <div className="op-pagination-center">
                <button 
                  onClick={goToFirstPage} 
                  disabled={currentPage === 1} 
                  className="op-page-btn"
                >
                  <FaAngleDoubleLeft size={12} />
                </button>
                <button 
                  onClick={goToPrevPage} 
                  disabled={currentPage === 1} 
                  className="op-page-btn"
                >
                  <FaChevronLeft size={12} />
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`op-page-btn ${currentPage === page ? 'op-page-btn-active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages} 
                  className="op-page-btn"
                >
                  <FaChevronRight size={12} />
                </button>
                <button 
                  onClick={goToLastPage} 
                  disabled={currentPage === totalPages} 
                  className="op-page-btn"
                >
                  <FaAngleDoubleRight size={12} />
                </button>
              </div>
              <div className="op-pagination-right">
                <span className="op-pagination-info">
                  Showing {getStartIndex()} to {getEndIndex()} of {filteredAndSortedOperations.length} entries
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}