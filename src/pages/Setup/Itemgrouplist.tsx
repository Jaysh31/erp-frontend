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
} from 'react-icons/fa';
import "./ItemGroupList.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface ItemGroup {
  id: string;
  item_group_name: string;
  parent_item_group: string;
  is_group: number;
  image: string | null;
  creation: string;
  modified: string;
}

interface ItemGroupDisplay {
  id: string;
  itemGroupName: string;
  parentItemGroup: string;
  isGroup: boolean;
  createdAgo: string;
  comments: number;
}

interface ApiResponse {
  success: number;
  data: ItemGroup[];
}

export default function ItemGroupList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const [itemGroups, setItemGroups] = useState<ItemGroupDisplay[]>([]);
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
  const [selectedItem, setSelectedItem] = useState<ItemGroupDisplay | null>(null);

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

  // Fetch item groups from API
  const fetchItemGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>(`/item-group?page=${currentPage}&limit=${itemsPerPage}`);
      
      if (response.data.success === 1) {
        const data = response.data.data;
        setTotalItems(data.length);
        
        // Transform API data to display format
        const transformedData: ItemGroupDisplay[] = data.map((item: ItemGroup) => ({
          id: item.id.toString(),
          itemGroupName: item.item_group_name,
          parentItemGroup: item.parent_item_group || 'N/A',
          isGroup: item.is_group === 1,
          createdAgo: formatDate(item.creation),
          comments: 0,
        }));
        
        setItemGroups(transformedData);
      } else {
        setError('Failed to fetch item groups');
      }
    } catch (err) {
      console.error('Error fetching item groups:', err);
      setError('An error occurred while fetching item groups');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchItemGroups();
  }, [currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filter data based on search and status
  const filteredData = itemGroups.filter(item => {
    const matchesSearch = item.itemGroupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'group' && item.isGroup) ||
                         (statusFilter === 'item' && !item.isGroup);
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

  const handleDelete = (item: ItemGroupDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        const response = await api.delete(`/item-group/${selectedItem.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
          fetchItemGroups();
        }
      } catch (err) {
        console.error('Error deleting item group:', err);
        alert('Failed to delete item group');
      }
    }
  };

  const handleEdit = (item: ItemGroupDisplay) => {
    navigate(`/item-group/${encodeURIComponent(item.id)}`);
  };

  const handleView = (item: ItemGroupDisplay) => {
    navigate(`/item-group/${encodeURIComponent(item.id)}`);
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

  return (
    <div className={`igl-page ${theme}`}>
      {/* Stats Cards */}
      {/* <div className="igl-stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="igl-stat-card" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)` }}>
            <div className="igl-stat-icon">{stat.icon}</div>
            <div className="igl-stat-content">
              <p className="igl-stat-title">{stat.title}</p>
              <p className="igl-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div> */}

      {/* Search and Filter Bar */}
      <div className="igl-filter-bar">
        <div className="igl-filter-left">
          <div className="igl-search-wrapper">
            <FaSearch className="igl-search-icon" />
            <input
              type="text"
              placeholder="Search item groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="igl-search-input"
            />
            {searchTerm && (
              <button className="igl-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="igl-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="igl-filter-select"
          >
            <option value="all">All Types</option>
            <option value="group">Parent Groups</option>
            <option value="item">Sub Items</option>
          </select>
          <button className="igl-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="igl-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="igl-btn-primary" onClick={() => navigate("/item-group/new")}>
            <FaPlus size={12} />
            Add Item Group
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="igl-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Type:</strong> {statusFilter === 'group' ? 'Parent Groups' : 'Sub Items'}
            </span>
          )}
          <button 
            onClick={clearFilters}
            className="igl-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="igl-loading">
          <p>Loading item groups...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="igl-error">
          <p>{error}</p>
          <button onClick={fetchItemGroups} className="igl-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="igl-table-wrap">
            <table className="igl-table">
              <thead>
                <tr>
                  <th className="igl-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="igl-checkbox" />
                  </th>
                  <th className="igl-th">ID</th>
                  <th className="igl-th">Item Group Name</th>
                  <th className="igl-th">Parent Item Group</th>
                  <th className="igl-th">Type</th>
                  <th className="igl-th igl-th-meta">
                    <span className="igl-count-label">{totalFilteredItems} of {itemGroups.length}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="igl-empty-state">
                      <div className="igl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No item groups found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`igl-tr ${selected.has(row.id) ? "igl-tr-selected" : ""}`}
                    >
                      <td className="igl-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="igl-checkbox" />
                      </td>
                      <td className="igl-td igl-td-id">{row.id}</td>
                      <td className="igl-td">{row.itemGroupName}</td>
                      <td className="igl-td">{row.parentItemGroup}</td>
                      <td className="igl-td">
                        <span className={`igl-status-badge ${row.isGroup ? 'igl-status-group' : 'igl-status-item'}`}>
                          {row.isGroup ? 'Parent Group' : 'Sub Item'}
                        </span>
                      </td>
                      <td className="igl-td igl-td-meta">
                        <span className="igl-ago">{row.createdAgo}</span>
                        <span className="igl-dot">·</span>
                        <div className="igl-action-buttons">
                          <button 
                            className="igl-action-btn igl-action-view" 
                            onClick={(e) => { e.stopPropagation(); handleView(row); }}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button 
                            className="igl-action-btn igl-action-edit" 
                            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="igl-action-btn igl-action-delete" 
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
          <div className="igl-pagination">
            <div className="igl-pagination-left">
              <span className="igl-pagination-label">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="igl-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="igl-pagination-label">entries</span>
            </div>
            <div className="igl-pagination-center">
              <button 
                onClick={goToFirstPage} 
                disabled={currentPage === 1 || totalFilteredItems === 0} 
                className="igl-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1 || totalFilteredItems === 0} 
                className="igl-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`igl-page-btn ${currentPage === page ? 'igl-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || totalFilteredItems === 0} 
                className="igl-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button 
                onClick={goToLastPage} 
                disabled={currentPage === totalPages || totalFilteredItems === 0} 
                className="igl-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="igl-pagination-right">
              <span className="igl-pagination-info">
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
        <div className="igl-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="igl-modal igl-modal-delete">
            <div className="igl-modal-header">
              <span className="igl-modal-title">Confirm Delete</span>
              <button className="igl-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="igl-modal-body">
              <p>Are you sure you want to delete this item group?</p>
              <p className="igl-modal-item-name"><strong>{selectedItem.itemGroupName}</strong></p>
              <p className="igl-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="igl-modal-footer">
              <button className="igl-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="igl-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}