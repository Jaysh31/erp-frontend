// GRNList.tsx
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
  FaBoxes,
  FaClipboardCheck,
  FaClock,
  FaExclamationTriangle,
} from 'react-icons/fa';
import "./GRNList.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

interface GRN {
  id: string;
  grn_no: string;
  grn_date: string;
  supplier: string;
  purchase_order: string;
  warehouse: string;
  received_by: string;
  status: 'draft' | 'submitted' | 'completed' | 'rejected';
  total_items: number;
  creation: string;
}

interface GRNDisplay {
  id: string;
  grnNo: string;
  supplier: string;
  poReference: string;
  date: string;
  status: 'draft' | 'submitted' | 'completed' | 'rejected';
  items: number;
  createdAgo: string;
}

interface ApiResponse {
  success: number;
  data: GRN[];
}

export default function GRNList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const [grns, setGrns] = useState<GRNDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GRNDisplay | null>(null);

  // Stats
  const [stats, setStats] = useState([
    { title: 'Total GRNs', value: 0, icon: <FaBoxes />, color: '#6366f1' },
    { title: 'Pending GRNs', value: 0, icon: <FaClock />, color: '#f59e0b' },
    { title: 'Completed', value: 0, icon: <FaClipboardCheck />, color: '#10b981' },
    { title: 'Rejected', value: 0, icon: <FaExclamationTriangle />, color: '#ef4444' },
  ]);

  // Format date to "X h" or "X d" format
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

  // Fetch GRNs from API
  const fetchGRNs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>(`/grn?page=${currentPage}&limit=${itemsPerPage}`);
      
      if (response.data.success === 1) {
        const data = response.data.data;
        setTotalItems(data.length);
        
        // Transform API data to display format
        const transformedData: GRNDisplay[] = data.map((item: GRN) => ({
          id: item.id.toString(),
          grnNo: item.grn_no || `GRN-${String(item.id).padStart(5, '0')}`,
          supplier: item.supplier || 'N/A',
          poReference: item.purchase_order || 'N/A',
          date: item.grn_date ? new Date(item.grn_date).toLocaleDateString() : 'N/A',
          status: item.status || 'draft',
          items: item.total_items || 0,
          createdAgo: formatDate(item.creation || new Date().toISOString()),
        }));
        
        setGrns(transformedData);

        // Update stats
        const total = transformedData.length;
        const pending = transformedData.filter(g => g.status === 'draft' || g.status === 'submitted').length;
        const completed = transformedData.filter(g => g.status === 'completed').length;
        const rejected = transformedData.filter(g => g.status === 'rejected').length;

        setStats([
          { title: 'Total GRNs', value: total, icon: <FaBoxes />, color: '#6366f1' },
          { title: 'Pending GRNs', value: pending, icon: <FaClock />, color: '#f59e0b' },
          { title: 'Completed', value: completed, icon: <FaClipboardCheck />, color: '#10b981' },
          { title: 'Rejected', value: rejected, icon: <FaExclamationTriangle />, color: '#ef4444' },
        ]);
      } else {
        setError('Failed to fetch GRNs');
      }
    } catch (err) {
      console.error('Error fetching GRNs:', err);
      setError('An error occurred while fetching GRNs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchGRNs();
  }, [currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filter data based on search and status
  const filteredData = grns.filter(item => {
    const matchesSearch = item.grnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.poReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFilteredItems = filteredData.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  
  // Ensure current page is valid when data changes
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
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

  const handleDelete = (item: GRNDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        const response = await api.delete(`/grn/${selectedItem.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
          fetchGRNs();
        }
      } catch (err) {
        console.error('Error deleting GRN:', err);
        alert('Failed to delete GRN');
      }
    }
  };

  const handleEdit = (item: GRNDisplay) => {
    navigate(`/grn/${encodeURIComponent(item.id)}`);
  };

  const handleView = (item: GRNDisplay) => {
    navigate(`/grn/${encodeURIComponent(item.id)}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'grn-status-draft';
      case 'submitted': return 'grn-status-submitted';
      case 'completed': return 'grn-status-completed';
      case 'rejected': return 'grn-status-rejected';
      default: return 'grn-status-draft';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return 'Draft';
    }
  };

  return (
    <div className={`grn-page ${theme}`}>
      {/* Stats Cards */}
      <div className="grn-stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="grn-stat-card" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)` }}>
            <div className="grn-stat-icon">{stat.icon}</div>
            <div className="grn-stat-content">
              <p className="grn-stat-title">{stat.title}</p>
              <p className="grn-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="grn-filter-bar">
        <div className="grn-filter-left">
          <div className="grn-search-wrapper">
            <FaSearch className="grn-search-icon" />
            <input
              type="text"
              placeholder="Search GRNs by number, supplier, or PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="grn-search-input"
            />
            {searchTerm && (
              <button className="grn-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="grn-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="grn-filter-select"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="grn-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="grn-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="grn-btn-primary" onClick={() => navigate("/grn/new")}>
            <FaPlus size={12} />
            New GRN
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="grn-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {getStatusLabel(statusFilter)}
            </span>
          )}
          <button 
            onClick={clearFilters}
            className="grn-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grn-loading">
          <p>Loading GRNs...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="grn-error">
          <p>{error}</p>
          <button onClick={fetchGRNs} className="grn-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="grn-table-wrap">
            <table className="grn-table">
              <thead>
                <tr>
                  <th className="grn-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="grn-checkbox" />
                  </th>
                  <th className="grn-th">GRN No.</th>
                  <th className="grn-th">Supplier</th>
                  <th className="grn-th">PO Reference</th>
                  <th className="grn-th">Date</th>
                  <th className="grn-th">Status</th>
                  <th className="grn-th">Items</th>
                  <th className="grn-th grn-th-meta">
                    <span className="grn-count-label">{totalFilteredItems} of {grns.length}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="grn-empty-state">
                      <div className="grn-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No GRNs found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`grn-tr ${selected.has(row.id) ? "grn-tr-selected" : ""}`}
                    >
                      <td className="grn-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="grn-checkbox" />
                      </td>
                      <td className="grn-td grn-td-id">{row.grnNo}</td>
                      <td className="grn-td">{row.supplier}</td>
                      <td className="grn-td">{row.poReference}</td>
                      <td className="grn-td">{row.date}</td>
                      <td className="grn-td">
                        <span className={`grn-status-badge ${getStatusBadgeClass(row.status)}`}>
                          {getStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="grn-td">{row.items}</td>
                      <td className="grn-td grn-td-meta">
                        <span className="grn-ago">{row.createdAgo}</span>
                        <span className="grn-dot">·</span>
                        <div className="grn-action-buttons">
                          <button 
                            className="grn-action-btn grn-action-view" 
                            onClick={(e) => { e.stopPropagation(); handleView(row); }}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button 
                            className="grn-action-btn grn-action-edit" 
                            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="grn-action-btn grn-action-delete" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Always visible */}
          <div className="grn-pagination">
            <div className="grn-pagination-left">
              <span className="grn-pagination-label">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="grn-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="grn-pagination-label">entries</span>
            </div>
            <div className="grn-pagination-center">
              <button 
                onClick={goToFirstPage} 
                disabled={currentPage === 1 || totalFilteredItems === 0} 
                className="grn-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1 || totalFilteredItems === 0} 
                className="grn-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`grn-page-btn ${currentPage === page ? 'grn-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || totalFilteredItems === 0} 
                className="grn-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button 
                onClick={goToLastPage} 
                disabled={currentPage === totalPages || totalFilteredItems === 0} 
                className="grn-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="grn-pagination-right">
              <span className="grn-pagination-info">
                {totalFilteredItems > 0 ? (
                  `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                ) : (
                  'No entries to show'
                )}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="grn-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="grn-modal grn-modal-delete">
            <div className="grn-modal-header">
              <span className="grn-modal-title">Confirm Delete</span>
              <button className="grn-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="grn-modal-body">
              <p>Are you sure you want to delete this GRN?</p>
              <p className="grn-modal-item-name"><strong>{selectedItem.grnNo}</strong> - {selectedItem.supplier}</p>
              <p className="grn-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="grn-modal-footer">
              <button className="grn-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="grn-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}