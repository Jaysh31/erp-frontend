// Workstation.tsx - Updated with proper API response handling

import  { useState, useEffect } from "react";
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
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHourglassHalf,
} from 'react-icons/fa';
import "./Workstation.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import NewWorkstation from './NewWorkstation';

interface Workstation {
  id: number;
  workstation_name: string;
  workstation_type: string;
  plant_floor: string;
  disabled: number;
  production_capacity: number;
  warehouse: string;
  status: string;
  on_status_image: string;
  off_status_image: string;
  hour_rate: number;
  description: string;
  holiday_list: string;
  total_working_hours: number;
  _user_tags: string;
  _comments: string | null;
  _assign: string | null;
  _liked_by: string | null;
  creation: string;
  modified: string;
  modified_by: string;
  owner: string;
  docstatus: number;
  idx: number;
}

interface ApiResponse {
  success: number;
  data: Workstation[] | {
    total?: number;
    page?: number;
    limit?: number;
    records?: Workstation[];
  };
}

export default function WorkstationList() {
  const { theme } = useAdminTheme();
  
  const [showNewWorkstation, setShowNewWorkstation] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState<Workstation | null>(null);
  const [] = useState(false);
  const [editData, setEditData] = useState<Workstation | null>(null);
  
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Workstation | null>(null);

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

  // ─── Fetch workstations ─────────────────────────────────────────────────────

  const fetchWorkstations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>(
        `/workstation?page=${currentPage}&limit=${itemsPerPage}`
      );
      
      if (response.data.success === 1) {
        const data = response.data.data;
        
        // Handle both response formats
        let records: Workstation[] = [];
        let total = 0;
        
        if (Array.isArray(data)) {
          // Direct array response
          records = data;
          total = data.length;
        } else if (data && 'records' in data) {
          // Paginated response with records
          records = data.records || [];
          total = data.total || records.length;
        } else {
          // Single object or other format
          records = data.records || [];
          total = records.length;
        }
        
        setWorkstations(records);
        setTotalItems(total);
      } else {
        setError('Failed to fetch workstations');
        setWorkstations([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Error fetching workstations:', err);
      setError('An error occurred while fetching workstations');
      setWorkstations([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkstations();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ─── Filter data ──────────────────────────────────────────────────────────

  const filteredData = workstations.filter(ws => {
    const matchesSearch = ws.workstation_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ws.workstation_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ws.plant_floor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && ws.disabled === 0) ||
                         (statusFilter === 'disabled' && ws.disabled === 1);
    return matchesSearch && matchesStatus;
  });

  const totalFilteredItems = filteredData.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  if (validCurrentPage !== currentPage && currentPage > 1) {
    setCurrentPage(validCurrentPage);
  }
  
  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = [
    { 
      title: 'Total Workstations', 
      value: workstations.length, 
      icon: <FaClock />, 
      color: '#6366f1' 
    },
    { 
      title: 'Active', 
      value: workstations.filter(ws => ws.disabled === 0).length, 
      icon: <FaCheckCircle />, 
      color: '#10b981' 
    },
    { 
      title: 'Disabled', 
      value: workstations.filter(ws => ws.disabled === 1).length, 
      icon: <FaExclamationTriangle />, 
      color: '#ef4444' 
    },
    { 
      title: 'Total Capacity', 
      value: workstations.reduce((sum, ws) => sum + (ws.production_capacity || 0), 0), 
      icon: <FaHourglassHalf />, 
      color: '#f59e0b' 
    },
  ];

  // ─── Status colors ────────────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'idle':
        return '#6b7280';
      case 'maintenance':
        return '#8b5cf6';
      case 'off':
        return '#ef4444';
      case 'problem':
        return '#dc2626';
      case 'setup':
        return '#f59e0b';
      case 'production':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#d1fae5';
      case 'idle':
        return '#f3f4f6';
      case 'maintenance':
        return '#ede9fe';
      case 'off':
        return '#fee2e2';
      case 'problem':
        return '#fecaca';
      case 'setup':
        return '#fef3c7';
      case 'production':
        return '#dbeafe';
      default:
        return '#f3f4f6';
    }
  };

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
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);

  // ─── Selection ────────────────────────────────────────────────────────────

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

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleView = (ws: Workstation) => {
    setSelectedWorkstation(ws);
    setShowDetailModal(true);
  };

  const handleEdit = (ws: Workstation) => {
    setEditData(ws);
    setShowNewWorkstation(true);
  };

  const handleDelete = (ws: Workstation) => {
    setDeleteTarget(ws);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        const response = await api.delete('/workstation', { data: { id: deleteTarget.id } });
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
          fetchWorkstations();
        }
      } catch (err) {
        console.error('Error deleting workstation:', err);
        alert('Failed to delete workstation');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {showNewWorkstation && (
        <NewWorkstation 
          onBack={() => {
            setShowNewWorkstation(false);
            setEditData(null);
            fetchWorkstations();
          }}
          editData={editData ? {
            ...editData,
            _comments: editData._comments ?? '',
            _assign: editData._assign ?? '',
            _liked_by: editData._liked_by ?? '',
          } : null}
        />
      )}

      {!showNewWorkstation && (
        <div className={`wo-page ${theme}`}>
          {/* Stats Cards */}
          <div className="wo-stats-container">
            {stats.map((stat, index) => (
              <div key={index} className="wo-stat-card" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)` }}>
                <div className="wo-stat-icon">{stat.icon}</div>
                <div className="wo-stat-content">
                  <p className="wo-stat-title">{stat.title}</p>
                  <p className="wo-stat-value">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filter Bar */}
          <div className="wo-filter-bar">
            <div className="wo-filter-left">
              <div className="wo-search-wrapper">
                <FaSearch className="wo-search-icon" />
                <input
                  type="text"
                  placeholder="Search workstations..."
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
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <button className="wo-filter-btn">
                <FaFilter size={12} />
                Filter
              </button>
              <button 
                className="wo-btn-primary" 
                onClick={() => {
                  setEditData(null);
                  setShowNewWorkstation(true);
                }}
              >
                <FaPlus size={12} />
                Add Workstation
              </button>
            </div>
          </div>

          {/* Active filters indicator */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="wo-active-filters">
              <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
              <span>Active filters:</span>
              {searchTerm && (
                <span><strong>Search:</strong> "{searchTerm}"</span>
              )}
              {statusFilter !== 'all' && (
                <span><strong>Status:</strong> {statusFilter}</span>
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
              <p>Loading workstations...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="wo-error">
              <p>{error}</p>
              <button onClick={fetchWorkstations} className="wo-retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* Table Grid View */}
          {!loading && !error && (
            <>
              <div className="wo-table-container">
                {paginatedData.length === 0 ? (
                  <div className="wo-empty-state">
                    <div className="wo-empty-content">
                      <FaClock size={48} />
                      <p>No workstations found</p>
                      <span>Try adjusting your search criteria</span>
                    </div>
                  </div>
                ) : (
                  <table className="wo-table">
                    <thead>
                      <tr>
                        <th className="wo-th-check">
                          <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                        </th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Plant Floor</th>
                        <th>Capacity</th>
                        <th>Hour Rate</th>
                        <th className="wo-th-meta">
                          <span>{paginatedData.length} of {totalItems}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((ws) => (
                        <tr key={ws.id} className={`wo-tr ${selected.has(ws.id) ? 'wo-tr-selected' : ''}`}>
                          <td className="wo-td-check">
                            <input 
                              type="checkbox" 
                              checked={selected.has(ws.id)} 
                              onChange={() => toggleRow(ws.id)} 
                            />
                          </td>
                          <td className="wo-td-id">#{ws.id}</td>
                          <td className="wo-td-name">{ws.workstation_name}</td>
                          <td className="wo-td-type">{ws.workstation_type}</td>
                          <td>
                            <span 
                              className="wo-status-badge"
                              style={{
                                background: ws.disabled === 0 ? '#d1fae5' : '#fee2e2',
                                color: ws.disabled === 0 ? '#10b981' : '#ef4444',
                              }}
                            >
                              {ws.disabled === 0 ? 'Active' : 'Disabled'}
                            </span>
                            {ws.status && (
                              <span 
                                className="wo-status-badge"
                                style={{
                                  background: getStatusBgColor(ws.status),
                                  color: getStatusColor(ws.status),
                                  marginLeft: 4,
                                }}
                              >
                                {ws.status}
                              </span>
                            )}
                          </td>
                          <td>{ws.plant_floor}</td>
                          <td>{ws.production_capacity}</td>
                          <td>₹{ws.hour_rate}</td>
                          <td className="wo-td-meta">
                            <span className="wo-ago">{formatDate(ws.creation)}</span>
                            <span className="wo-dot">·</span>
                            <div className="wo-action-buttons">
                              <button 
                                className="wo-action-btn wo-action-view" 
                                onClick={() => handleView(ws)}
                                title="View"
                              >
                                <FaEye size={12} />
                              </button>
                              <button 
                                className="wo-action-btn wo-action-edit" 
                                onClick={() => handleEdit(ws)}
                                title="Edit"
                              >
                                <FaEdit size={12} />
                              </button>
                              <button 
                                className="wo-action-btn wo-action-delete" 
                                onClick={() => handleDelete(ws)}
                                title="Delete"
                              >
                                <FaTrash size={12} />
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
              {totalFilteredItems > 0 && totalPages > 1 && (
                <div className="wo-pagination">
                  <div className="wo-pagination-left">
                    <span className="wo-pagination-label">Show:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="wo-page-size-select"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="wo-pagination-label">entries</span>
                  </div>
                  <div className="wo-pagination-center">
                    <button 
                      onClick={goToFirstPage} 
                      disabled={currentPage === 1} 
                      className="wo-page-btn"
                    >
                      <FaAngleDoubleLeft size={12} />
                    </button>
                    <button 
                      onClick={goToPrevPage} 
                      disabled={currentPage === 1} 
                      className="wo-page-btn"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`wo-page-btn ${currentPage === page ? 'wo-page-btn-active' : ''}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      onClick={goToNextPage} 
                      disabled={currentPage === totalPages} 
                      className="wo-page-btn"
                    >
                      <FaChevronRight size={12} />
                    </button>
                    <button 
                      onClick={goToLastPage} 
                      disabled={currentPage === totalPages} 
                      className="wo-page-btn"
                    >
                      <FaAngleDoubleRight size={12} />
                    </button>
                  </div>
                  <div className="wo-pagination-right">
                    <span className="wo-pagination-info">
                      Showing {getStartIndex()} to {getEndIndex()} of {totalFilteredItems} entries
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && deleteTarget && (
            <div className="wo-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
              <div className="wo-modal wo-modal-delete">
                <div className="wo-modal-header">
                  <span className="wo-modal-title">Confirm Delete</span>
                  <button className="wo-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                    <FaTimes size={16} />
                  </button>
                </div>
                <div className="wo-modal-body">
                  <p>Are you sure you want to delete this workstation?</p>
                  <p className="wo-modal-item-name">
                    <strong>{deleteTarget.workstation_name}</strong>
                  </p>
                  <p className="wo-modal-warning">This action cannot be undone.</p>
                </div>
                <div className="wo-modal-footer">
                  <button className="wo-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </button>
                  <button className="wo-btn-delete" onClick={confirmDelete}>
                    <FaTrash size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── View Detail Modal ────────────────────────────────────── */}
          {showDetailModal && selectedWorkstation && (
            <div className="wo-modal-overlay" onClick={() => setShowDetailModal(false)}>
              <div className="wo-modal wo-modal-detail" onClick={e => e.stopPropagation()}>
                <div className="wo-modal-header">
                  <span className="wo-modal-title">
                    <FaEye size={16} style={{ marginRight: 8 }} />
                    Workstation Details - #{selectedWorkstation.id}
                  </span>
                  <button className="wo-modal-close" onClick={() => setShowDetailModal(false)}>
                    <FaTimes size={16} />
                  </button>
                </div>
                <div className="wo-modal-body">
                  <div className="wo-detail-grid">
                    <div className="wo-detail-section">
                      <h4>Basic Information</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Workstation Name</span>
                        <span className="wo-detail-value">{selectedWorkstation.workstation_name}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Type</span>
                        <span className="wo-detail-value">{selectedWorkstation.workstation_type}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Plant Floor</span>
                        <span className="wo-detail-value">{selectedWorkstation.plant_floor}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Status</span>
                        <span className="wo-detail-value">
                          <span 
                            className="wo-status-badge"
                            style={{
                              background: selectedWorkstation.disabled === 0 ? '#d1fae5' : '#fee2e2',
                              color: selectedWorkstation.disabled === 0 ? '#10b981' : '#ef4444',
                            }}
                          >
                            {selectedWorkstation.disabled === 0 ? 'Active' : 'Disabled'}
                          </span>
                          {selectedWorkstation.status && (
                            <span 
                              className="wo-status-badge"
                              style={{
                                background: getStatusBgColor(selectedWorkstation.status),
                                color: getStatusColor(selectedWorkstation.status),
                                marginLeft: 4,
                              }}
                            >
                              {selectedWorkstation.status}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="wo-detail-section">
                      <h4>Capacity & Cost</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Production Capacity</span>
                        <span className="wo-detail-value">{selectedWorkstation.production_capacity}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Hour Rate</span>
                        <span className="wo-detail-value">₹ {selectedWorkstation.hour_rate}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Total Working Hours</span>
                        <span className="wo-detail-value">{selectedWorkstation.total_working_hours}h</span>
                      </div>
                    </div>

                    <div className="wo-detail-section">
                      <h4>Warehouse</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Warehouse</span>
                        <span className="wo-detail-value">{selectedWorkstation.warehouse}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Holiday List</span>
                        <span className="wo-detail-value">{selectedWorkstation.holiday_list}</span>
                      </div>
                    </div>

                    <div className="wo-detail-section">
                      <h4>Images</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">On Status Image</span>
                        <span className="wo-detail-value">{selectedWorkstation.on_status_image}</span>
                      </div>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">Off Status Image</span>
                        <span className="wo-detail-value">{selectedWorkstation.off_status_image}</span>
                      </div>
                    </div>

                    <div className="wo-detail-section">
                      <h4>Tags</h4>
                      <div className="wo-detail-row">
                        <span className="wo-detail-label">User Tags</span>
                        <span className="wo-detail-value">{selectedWorkstation._user_tags}</span>
                      </div>
                    </div>

                    {selectedWorkstation.description && (
                      <div className="wo-detail-section wo-detail-full">
                        <h4>Description</h4>
                        <div className="wo-detail-description">
                          {selectedWorkstation.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="wo-modal-footer">
                  <button className="wo-btn-secondary" onClick={() => setShowDetailModal(false)}>
                    Close
                  </button>
                  <button 
                    className="wo-btn-primary" 
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedWorkstation);
                    }}
                  >
                    <FaEdit size={12} /> Edit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}