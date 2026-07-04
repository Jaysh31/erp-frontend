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
// import "./OperationList.css";
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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, ] = useState<string>('creation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch operations from API
  const fetchOperations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>('/operation');
      
      if (response.data.success === 1) {
        setOperations(response.data.data);
        setTotalItems(response.data.data.length);
      } else {
        setError('Failed to fetch operations');
      }
    } catch (err) {
      console.error('Error fetching operations:', err);
      setError('An error occurred while fetching operations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchOperations();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Filter and sort data
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
        case 'batch_size':
          comparison = a.batch_size - b.batch_size;
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

  const totalPages = Math.ceil(filteredAndSortedOperations.length / itemsPerPage);

  // Stats
  const totalActive = operations.filter(op => op.docstatus === 0).length;
  const totalSubmitted = operations.filter(op => op.docstatus === 1).length;
  // const totalCancelled = operations.filter(op => op.docstatus === 2).length;
  const uniqueWorkstations = [...new Set(operations.map(op => op.workstation))].length;

  const stats = [
    { title: 'Total Operations', value: totalItems, icon: <FaBoxes />, color: '#6366f1' },
    { title: 'Active', value: totalActive, icon: <FaCheckCircle />, color: '#10b981' },
    { title: 'Submitted', value: totalSubmitted, icon: <FaClock />, color: '#3b82f6' },
    { title: 'Workstations', value: uniqueWorkstations, icon: <FaIndustry />, color: '#f59e0b' },
  ];

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map((r) => r.id)));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllChecked(next.size === paginatedData.length);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1d';
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
    return date.toLocaleDateString();
  };

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
        // Delete operation - pass id in payload
        await api.delete('/operation', { data: { id: operation.id } });
        await fetchOperations();
        setSelected(prev => {
          const newSet = new Set(prev);
          newSet.delete(operation.id);
          return newSet;
        });
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

  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <span className="itl-status-badge itl-status-active">Active</span>;
      case 1:
        return <span className="itl-status-badge itl-status-submitted">Submitted</span>;
      case 2:
        return <span className="itl-status-badge itl-status-cancelled">Cancelled</span>;
      default:
        return null;
    }
  };

  const getOperationType = (operation: Operation) => {
    return operation.is_corrective_operation === 1 ? 'Corrective' : 'Standard';
  };

  return (
    <div className={`itl-page ${theme}`}>
      {/* Stats Cards */}
      <div className="itl-stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="itl-stat-card" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)` }}>
            <div className="itl-stat-icon">{stat.icon}</div>
            <div className="itl-stat-content">
              <p className="itl-stat-title">{stat.title}</p>
              <p className="itl-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="itl-filter-bar">
        <div className="itl-filter-left">
          <div className="itl-search-wrapper">
            <FaSearch className="itl-search-icon" />
            <input
              type="text"
              placeholder="Search operations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="itl-search-input"
            />
            {searchTerm && (
              <button className="itl-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="itl-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="itl-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="submitted">Submitted</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="itl-sort-btn" onClick={() => {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Sort {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
          <button className="itl-btn-primary" onClick={handleAddOperation}>
            <FaPlus size={12} />
            Add Operation
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="itl-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {statusFilter}
            </span>
          )}
          <button 
            onClick={clearFilters}
            className="itl-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="itl-loading">
          <FaSpinner className="spinning" size={24} />
          <p>Loading operations...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="itl-error">
          <p>{error}</p>
          <button onClick={fetchOperations} className="itl-retry-btn">Retry</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="itl-table-wrap">
            <table className="itl-table">
              <thead>
                <tr>
                  <th className="itl-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="itl-checkbox" />
                  </th>
                  <th className="itl-th">Operation Name</th>
                  <th className="itl-th">Workstation</th>
                  <th className="itl-th">Status</th>
                  <th className="itl-th">Type</th>
                  <th className="itl-th">Batch Size</th>
                  <th className="itl-th">Time (min)</th>
                  <th className="itl-th">Quality Template</th>
                  <th className="itl-th itl-th-meta">
                    <span className="itl-count-label">{filteredAndSortedOperations.length} of {totalItems}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="itl-empty-state">
                      <div className="itl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No operations found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`itl-tr ${selected.has(row.id) ? "itl-tr-selected" : ""}`}
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="itl-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="itl-checkbox" />
                      </td>
                      <td className="itl-td itl-td-name">{row.name}</td>
                      <td className="itl-td">{row.workstation}</td>
                      <td className="itl-td">
                        {getStatusBadge(row.docstatus)}
                      </td>
                      <td className="itl-td">{getOperationType(row)}</td>
                      <td className="itl-td">{row.batch_size}</td>
                      <td className="itl-td">{row.total_operation_time}</td>
                      <td className="itl-td">{row.quality_inspection_template}</td>
                      <td className="itl-td itl-td-meta">
                        <span className="itl-ago">{formatDate(row.creation)}</span>
                        <span className="itl-dot">·</span>
                        <button 
                          className="itl-meta-btn" 
                          onClick={(e) => { e.stopPropagation(); handleViewOperation(row); }}
                          title="View Operation"
                        >
                          <FaEye size={13} />
                        </button>
                        <button 
                          className="itl-meta-btn" 
                          onClick={(e) => { e.stopPropagation(); handleEditOperation(row); }}
                          title="Edit Operation"
                        >
                          <FaEdit size={13} />
                        </button>
                        <button 
                          className="itl-meta-btn itl-delete-btn" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteOperation(row); }}
                          disabled={deletingId === row.id}
                          title="Delete Operation"
                        >
                          {deletingId === row.id ? <FaSpinner className="spinning" size={13} /> : <FaTrash size={13} />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="itl-pagination">
              <div className="itl-pagination-left">
                <span className="itl-pagination-label">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="itl-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="itl-pagination-label">entries</span>
              </div>
              <div className="itl-pagination-center">
                <button 
                  onClick={goToFirstPage} 
                  disabled={currentPage === 1} 
                  className="itl-page-btn"
                >
                  <FaAngleDoubleLeft size={12} />
                </button>
                <button 
                  onClick={goToPrevPage} 
                  disabled={currentPage === 1} 
                  className="itl-page-btn"
                >
                  <FaChevronLeft size={12} />
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`itl-page-btn ${currentPage === page ? 'itl-page-btn-active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages} 
                  className="itl-page-btn"
                >
                  <FaChevronRight size={12} />
                </button>
                <button 
                  onClick={goToLastPage} 
                  disabled={currentPage === totalPages} 
                  className="itl-page-btn"
                >
                  <FaAngleDoubleRight size={12} />
                </button>
              </div>
              <div className="itl-pagination-right">
                <span className="itl-pagination-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedOperations.length)} of {filteredAndSortedOperations.length} entries
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}