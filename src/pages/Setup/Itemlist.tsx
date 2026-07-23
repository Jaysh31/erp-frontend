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
  FaSpinner,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';
import "./ItemList.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  is_fixed_asset: number;
  is_sales_item: number;
  is_purchase_item: number;
  disabled: number;
  description: string;
  brand: string | null;
  valuation_method: string;
  creation: string;
  modified: string;
}

interface ApiResponse {
  success: number;
  data: Item[];
}

export default function ItemList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch items from API
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get<ApiResponse>(`/item?${params.toString()}`);
      
      if (response.data.success === 1) {
        setItems(response.data.data);
        setTotalItems(response.data.data.length);
      } else {
        setError('Failed to fetch items');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('An error occurred while fetching items');
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await api.delete(`/item/${id}`);
      if (response.data.success === 1) {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        console.log('Item deleted successfully');
      } else {
        setError('Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('An error occurred while deleting the item');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle edit
  const handleEditItem = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/item/${item.id}`, { 
      state: { itemData: item, editMode: true } 
    });
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchItems();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, statusFilter, groupFilter]);

  // Get unique item groups for filter
  const itemGroups = Array.from(new Set(items.map(item => item.item_group))).filter(Boolean);

  // Filter data based on status and group
  const filteredItems = items.filter(item => {
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && item.disabled === 0) ||
                         (statusFilter === 'disabled' && item.disabled === 1);
    const matchesGroup = groupFilter === 'all' || item.item_group === groupFilter;
    return matchesStatus && matchesGroup;
  });

  const paginatedData = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

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
    setGroupFilter('all');
  };

  const handleRowClick = (item: Item) => {
    navigate(`/item/${item.id}`, { 
      state: { itemData: item } 
    });
  };

  const handleAddItem = () => {
    navigate("/item/new");
  };

  return (
    <div className={`itl-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="itl-filter-bar">
        <div className="itl-filter-left">
          <div className="itl-search-wrapper">
            <FaSearch className="itl-search-icon" />
            <input
              type="text"
              placeholder="Search items..."
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
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <select 
            value={groupFilter} 
            onChange={(e) => setGroupFilter(e.target.value)}
            className="itl-filter-select"
          >
            <option value="all">All Groups</option>
            {itemGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <button className="itl-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="itl-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="itl-btn-primary" onClick={handleAddItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all' || groupFilter !== 'all') && (
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
          {groupFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Group:</strong> {groupFilter}
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
          <p>Loading items...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="itl-error">
          <p>{error}</p>
          <button onClick={fetchItems} className="itl-retry-btn">Retry</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="itl-table-wrap">
            <table className="itl-table">
              <thead>
                <tr>
                  <th className="itl-th">Item Code</th>
                  <th className="itl-th">Item Name</th>
                  <th className="itl-th">Status</th>
                  <th className="itl-th">Item Group</th>
                  <th className="itl-th">UOM</th>
                  <th className="itl-th">Type</th>
                  <th className="itl-th itl-th-meta">
                    <span className="itl-count-label">{filteredItems.length} of {totalItems}</span>
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="itl-empty-state">
                      <div className="itl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No items found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className="itl-tr"
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="itl-td itl-td-code">{row.item_code}</td>
                      <td className="itl-td itl-td-name">{row.item_name}</td>
                      <td className="itl-td">
                        <span className={`itl-status-badge itl-status-${row.disabled === 0 ? 'enabled' : 'disabled'}`}>
                          {row.disabled === 0 ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="itl-td">{row.item_group}</td>
                      <td className="itl-td">{row.stock_uom}</td>
                      <td className="itl-td">
                        {row.is_stock_item === 1 ? 'Stock' : 'Non-Stock'}
                      </td>
                      <td className="itl-td itl-td-meta">
                        <div className="itl-action-buttons" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="itl-action-btn itl-edit-btn"
                            onClick={(e) => handleEditItem(row, e)}
                            title="Edit item"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button 
                            className="itl-action-btn itl-delete-btn"
                            onClick={(e) => handleDeleteItem(row.id, e)}
                            disabled={deletingId === row.id}
                            title="Delete item"
                          >
                            {deletingId === row.id ? (
                              <FaSpinner className="spinning" size={14} />
                            ) : (
                              <FaTrash size={14} />
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}