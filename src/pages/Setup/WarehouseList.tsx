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
  
  FaSpinner,
} from 'react-icons/fa';
import "./WarehouseList.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface Warehouse {
  id: number;
  warehouse_name: string;
  company: string | null;
  parent_warehouse: string | null;
  warehouse_type: string | null;
  city: string | null;
  state: string | null;
  email_id: string | null;
  phone_no: string | null;
  disabled: number;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Warehouse[];
  };
}

export default function WarehouseList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Fetch warehouses from API
  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get<ApiResponse>(`/warehouse?${params.toString()}`);
      
      if (response.data.success === 1) {
        setWarehouses(response.data.data.records);
        setTotalItems(response.data.data.total);
      } else {
        setError('Failed to fetch warehouses');
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError('An error occurred while fetching warehouses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchWarehouses();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Filter data based on status
  const filteredData = warehouses.filter(item => {
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && item.disabled === 0) ||
                         (statusFilter === 'disabled' && item.disabled === 1);
    return matchesStatus;
  });

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Ensure current page is valid when data changes
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  if (validCurrentPage !== currentPage && totalPages > 0) {
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

  const toggleRow = (id: number) => {
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

  // Updated: Navigate to warehouse form for new warehouse
  const handleAddWarehouse = () => {
    navigate('/warehouse/new');
  };

  // Updated: Navigate to warehouse form for editing
  const handleEditWarehouse = (warehouse: Warehouse) => {
    navigate(`/warehouse/${encodeURIComponent(warehouse.warehouse_name)}`, {
      state: { warehouseData: warehouse }
    });
  };

  // Updated: Navigate to warehouse form for viewing
  const handleViewWarehouse = (warehouse: Warehouse) => {
    navigate(`/warehouse/${encodeURIComponent(warehouse.warehouse_name)}`, {
      state: { warehouseData: warehouse }
    });
  };

  const handleDelete = (item: Warehouse) => {
    setSelectedWarehouse(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedWarehouse) {
      try {
        const response = await api.delete(`/warehouse/${selectedWarehouse.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedWarehouse(null);
          fetchWarehouses(); // Refresh the list
        }
      } catch (err) {
        console.error('Error deleting warehouse:', err);
        alert('Failed to delete warehouse');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalItems);
  };

  const handleRowClick = (warehouse: Warehouse) => {
    navigate(`/warehouse/${encodeURIComponent(warehouse.warehouse_name)}`, {
      state: { warehouseData: warehouse }
    });
  };

  return (
    <div className={`wl-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="wl-filter-bar">
        <div className="wl-filter-left">
          <div className="wl-search-wrapper">
            <FaSearch className="wl-search-icon" />
            <input
              type="text"
              placeholder="Search Warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="wl-search-input"
            />
            {searchTerm && (
              <button className="wl-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="wl-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="wl-filter-select"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="wl-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="wl-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="wl-btn-primary" onClick={handleAddWarehouse}>
            <FaPlus size={12} />
            Add Warehouse
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="wl-active-filters">
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
            className="wl-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="wl-loading">
          <FaSpinner className="spinning" size={24} />
          <p>Loading warehouses...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="wl-error">
          <p>{error}</p>
          <button onClick={fetchWarehouses} className="wl-retry-btn">Retry</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="wl-table-wrap">
            <table className="wl-table">
              <thead>
                <tr>
                  <th className="wl-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="wl-checkbox" />
                  </th>
                  <th className="wl-th">ID</th>
                  <th className="wl-th">Warehouse Name</th>
                  <th className="wl-th">Status</th>
                  <th className="wl-th">Company</th>
                  <th className="wl-th">Parent Warehouse</th>
                  <th className="wl-th">Type</th>
                  <th className="wl-th wl-th-meta">
                    <span className="wl-count-label">{totalItems} total</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="wl-empty-state">
                      <div className="wl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No Warehouses found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`wl-tr ${selected.has(row.id) ? "wl-tr-selected" : ""}`}
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="wl-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="wl-checkbox" />
                      </td>
                      <td className="wl-td">{row.id}</td>
                      <td className="wl-td wl-td-name">{row.warehouse_name}</td>
                      <td className="wl-td">
                        <span className={`wl-status-badge wl-status-${row.disabled === 0 ? 'enabled' : 'disabled'}`}>
                          {row.disabled === 0 ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="wl-td">{row.company || '-'}</td>
                      <td className="wl-td">{row.parent_warehouse || '-'}</td>
                      <td className="wl-td">{row.warehouse_type || '-'}</td>
                      <td className="wl-td wl-td-meta">
                        <span className="wl-ago">-</span>
                        <span className="wl-dot">·</span>
                        <div className="wl-action-buttons">
                          <button 
                            className="wl-action-btn wl-action-view" 
                            onClick={(e) => { e.stopPropagation(); handleViewWarehouse(row); }}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button 
                            className="wl-action-btn wl-action-edit" 
                            onClick={(e) => { e.stopPropagation(); handleEditWarehouse(row); }}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="wl-action-btn wl-action-delete" 
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

          {/* Pagination */}
          <div className="wl-pagination">
            <div className="wl-pagination-left">
              <span className="wl-pagination-label">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="wl-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="wl-pagination-label">entries</span>
            </div>
            <div className="wl-pagination-center">
              <button 
                onClick={goToFirstPage} 
                disabled={currentPage === 1 || totalItems === 0} 
                className="wl-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1 || totalItems === 0} 
                className="wl-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`wl-page-btn ${currentPage === page ? 'wl-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || totalItems === 0} 
                className="wl-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button 
                onClick={goToLastPage} 
                disabled={currentPage === totalPages || totalItems === 0} 
                className="wl-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="wl-pagination-right">
              <span className="wl-pagination-info">
                {totalItems > 0 ? (
                  `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
                ) : (
                  'No entries to show'
                )}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedWarehouse && (
        <div className="wl-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="wl-modal wl-modal-delete">
            <div className="wl-modal-header">
              <span className="wl-modal-title">Confirm Delete</span>
              <button className="wl-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="wl-modal-body">
              <p>Are you sure you want to delete this warehouse?</p>
              <p className="wl-modal-item-name"><strong>{selectedWarehouse.warehouse_name}</strong></p>
              <p className="wl-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="wl-modal-footer">
              <button className="wl-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="wl-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}