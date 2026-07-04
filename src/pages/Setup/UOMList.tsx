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
  FaRuler,
  FaTimesCircle,
  FaPlus,
  FaCheck,
  FaPlusCircle,
} from 'react-icons/fa';
import "./UOMList.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface UOM {
  id: string;
  uom_name: string;
  symbol: string | null;
  common_code: string | null;
  category: string;
  enabled: number;
  must_be_whole_number: number;
  creation: string;
}

interface UOMFormData {
  name: string;
  symbol: string;
  common_code: string;
  description: string;
  category: string;
  must_be_whole_number: boolean;
}

interface Category {
  id: number;
  name: string;
  category_name: string;
  creation: string;
  modified: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: UOM[];
  };
}

interface CategoryApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Category[];
  };
}

export default function UOMList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUOM, setSelectedUOM] = useState<UOM | null>(null);
  const [formData, setFormData] = useState<UOMFormData>({
    name: "",
    symbol: "",
    common_code: "",
    description: "",
    category: "",
    must_be_whole_number: false,
  });
  const [apiError, setApiError] = useState<string | null>(null);

  // Category related states
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryApiError, setCategoryApiError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get<CategoryApiResponse>('/uom-category');
      if (response.data.success === 1) {
        setCategories(response.data.data.records);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch UOMs from API
  const fetchUOMs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (statusFilter !== 'all') {
        params.append('enabled', statusFilter === 'enabled' ? '1' : '0');
      }

      const response = await api.get<ApiResponse>(`/uom?${params.toString()}`);
      
      if (response.data.success === 1) {
        setUoms(response.data.data.records);
        setTotalItems(response.data.data.total);
      } else {
        setError('Failed to fetch UOMs');
      }
    } catch (err) {
      console.error('Error fetching UOMs:', err);
      setError('An error occurred while fetching UOMs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch when dependencies change
  useEffect(() => {
    fetchUOMs();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.category_name.toLowerCase().includes(categorySearch.toLowerCase())
  );


  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(uoms.map((r) => r.id.toString())));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllChecked(next.size === uoms.length);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

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

  const handleOpenModal = () => {
    setFormData({ 
      name: "", 
      symbol: "", 
      common_code: "", 
      description: "", 
      category: "",
      must_be_whole_number: false 
    });
    setCategorySearch('');
    setShowCategoryDropdown(false);
    setApiError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ 
      name: "", 
      symbol: "", 
      common_code: "", 
      description: "", 
      category: "",
      must_be_whole_number: false 
    });
    setCategorySearch('');
    setShowCategoryDropdown(false);
    setApiError(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryApiError('Category name is required');
      return;
    }

    try {
      const payload = {
        category_name: newCategoryName.trim(),
        modified_by: "Administrator",
        owner: "Administrator",
        _user_tags: "",
        _comments: "",
        _assign: "",
        _liked_by: ""
      };

      const response = await api.post('/uom-category', payload);
      
      if (response.data.success === 1) {
        // Refresh categories
        await fetchCategories();
        // Select the new category
        setFormData({ ...formData, category: newCategoryName.trim() });
        setCategorySearch(newCategoryName.trim());
        setShowAddCategoryModal(false);
        setNewCategoryName('');
        setCategoryApiError(null);
        setShowCategoryDropdown(false);
      } else {
        setCategoryApiError(response.data?.message || 'Failed to create category');
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
      if (err.response) {
        if (err.response.status === 409) {
          setCategoryApiError('A category with this name already exists');
        } else {
          setCategoryApiError(err.response.data?.message || 'Failed to create category');
        }
      } else if (err.request) {
        setCategoryApiError('Network error. Please check your connection.');
      } else {
        setCategoryApiError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setApiError('UOM Name is required');
      return;
    }

    if (!formData.category) {
      setApiError('Category is required');
      return;
    }

    try {
      const payload = {
        uom_name: formData.name.trim(),
        symbol: formData.symbol.trim() || null,
        common_code: formData.common_code.trim() || null,
        description: formData.description.trim() || null,
        category: formData.category,
        must_be_whole_number: formData.must_be_whole_number ? 1 : 0,
        owner: "Administrator",
        modified_by: "Administrator"
      };

      const response = await api.post('/uom', payload);
      
      if (response.data && response.data.success === 1) {
        await fetchUOMs();
        handleCloseModal();
      } else {
        setApiError(response.data?.message || 'Failed to create UOM');
      }
    } catch (err: any) {
      console.error('Error creating UOM:', err);
      
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A UOM with this name already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || 'Failed to create UOM');
        }
      } else if (err.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleDelete = (item: UOM) => {
    setSelectedUOM(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedUOM) {
      try {
        const response = await api.delete(`/uom/${selectedUOM.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedUOM(null);
          await fetchUOMs();
        }
      } catch (err) {
        console.error('Error deleting UOM:', err);
        alert('Failed to delete UOM');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const getStartIndex = () => {
    return (currentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(currentPage * itemsPerPage, totalItems);
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

  return (
    <div className={`uoml-page ${theme}`}>
      {/* Stats Cards */}
      {/* <div className="uoml-stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="uoml-stat-card" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)` }}>
            <div className="uoml-stat-icon">{stat.icon}</div>
            <div className="uoml-stat-content">
              <p className="uoml-stat-title">{stat.title}</p>
              <p className="uoml-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div> */}

      {/* Search and Filter Bar */}
      <div className="uoml-filter-bar">
        <div className="uoml-filter-left">
          <div className="uoml-search-wrapper">
            <FaSearch className="uoml-search-icon" />
            <input
              type="text"
              placeholder="Search UOMs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="uoml-search-input"
            />
            {searchTerm && (
              <button className="uoml-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="uoml-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="uoml-filter-select"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="uoml-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="uoml-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="uoml-btn-primary" onClick={handleOpenModal}>
            <FaPlus size={12} />
            Add UOM
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="uoml-active-filters">
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
            className="uoml-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="uoml-loading">
          <p>Loading UOMs...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="uoml-error">
          <p>{error}</p>
          <button onClick={fetchUOMs} className="uoml-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="uoml-table-wrap">
            <table className="uoml-table">
              <thead>
                <tr>
                  <th className="uoml-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="uoml-checkbox" />
                  </th>
                  <th className="uoml-th">ID</th>
                  <th className="uoml-th">UOM Name</th>
                  <th className="uoml-th">Symbol</th>
                  <th className="uoml-th">Status</th>
                  <th className="uoml-th">Category</th>
                  <th className="uoml-th uoml-th-meta">
                    <span className="uoml-count-label">{totalItems} total</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {uoms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="uoml-empty-state">
                      <div className="uoml-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No UOMs found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  uoms.map((row) => (
                    <tr
                      key={row.id}
                      className={`uoml-tr ${selected.has(row.id.toString()) ? "uoml-tr-selected" : ""}`}
                      onClick={() => navigate(`/uom/${encodeURIComponent(row.uom_name)}`)}
                    >
                      <td className="uoml-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id.toString()); }}>
                        <input type="checkbox" checked={selected.has(row.id.toString())} onChange={() => toggleRow(row.id.toString())} className="uoml-checkbox" />
                      </td>
                      <td className="uoml-td">{row.id}</td>
                      <td className="uoml-td uoml-td-name">{row.uom_name}</td>
                      <td className="uoml-td">{row.symbol || '-'}</td>
                      <td className="uoml-td">
                        <span className={`uoml-status-badge uoml-status-${row.enabled === 1 ? 'enabled' : 'disabled'}`}>
                          {row.enabled === 1 ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="uoml-td">{row.category}</td>
                      <td className="uoml-td uoml-td-meta">
                        <span className="uoml-ago">{formatDate(row.creation)}</span>
                        <span className="uoml-dot">·</span>
                        <div className="uoml-action-buttons">
                          <button 
                            className="uoml-action-btn uoml-action-view" 
                            onClick={(e) => { e.stopPropagation(); navigate(`/uom/${encodeURIComponent(row.uom_name)}`); }}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button 
                            className="uoml-action-btn uoml-action-edit" 
                            onClick={(e) => { e.stopPropagation(); navigate(`/uom/${encodeURIComponent(row.uom_name)}`); }}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="uoml-action-btn uoml-action-delete" 
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
          <div className="uoml-pagination">
            <div className="uoml-pagination-left">
              <span className="uoml-pagination-label">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="uoml-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="uoml-pagination-label">entries</span>
            </div>
            <div className="uoml-pagination-center">
              <button 
                onClick={goToFirstPage} 
                disabled={currentPage === 1 || totalItems === 0} 
                className="uoml-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1 || totalItems === 0} 
                className="uoml-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`uoml-page-btn ${currentPage === page ? 'uoml-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || totalItems === 0} 
                className="uoml-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button 
                onClick={goToLastPage} 
                disabled={currentPage === totalPages || totalItems === 0} 
                className="uoml-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="uoml-pagination-right">
              <span className="uoml-pagination-info">
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

      {/* New UOM Modal */}
      {showModal && (
        <div className="uoml-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className="uoml-modal">
            <div className="uoml-modal-header">
              <div className="uoml-modal-header-left">
                <div className="uoml-modal-icon">
                  <FaRuler size={16} />
                </div>
                <span className="uoml-modal-title">New UOM</span>
              </div>
              <button className="uoml-modal-close" onClick={handleCloseModal}>
                <FaTimes size={16} />
              </button>
            </div>

            {apiError && (
              <div className="uoml-api-error">
                <FaTimesCircle className="error-icon" />
                <span>{apiError}</span>
                <button className="error-close" onClick={() => setApiError(null)}>×</button>
              </div>
            )}

            <div className="uoml-modal-body">
              <div className="uoml-field">
                <label className="uoml-label">UOM Name <span className="uoml-req">*</span></label>
                <input
                  className="uoml-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                  placeholder="Enter UOM name"
                />
              </div>

              <div className="uoml-field">
                <label className="uoml-label">Symbol</label>
                <input
                  className="uoml-input"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="Enter symbol (e.g., Nos, kg, m)"
                />
              </div>

              <div className="uoml-field">
                <label className="uoml-label">Common Code</label>
                <input
                  className="uoml-input"
                  value={formData.common_code}
                  onChange={(e) => setFormData({ ...formData, common_code: e.target.value })}
                  placeholder="Enter common code"
                />
              </div>

              <div className="uoml-field">
                <label className="uoml-label">Description</label>
                <input
                  className="uoml-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>

              <div className="uoml-field">
                <label className="uoml-label">Category <span className="uoml-req">*</span></label>
                <div className="uoml-category-select-wrapper">
                  <div className="uoml-category-input-wrapper">
                    <input
                      className="uoml-input"
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setShowCategoryDropdown(true);
                        // Check if the typed value matches a category
                        const matched = categories.find(cat => 
                          cat.category_name.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (matched) {
                          setFormData({ ...formData, category: matched.category_name });
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onBlur={() => {
                        // Delay hiding to allow click events on dropdown items
                        setTimeout(() => setShowCategoryDropdown(false), 200);
                      }}
                      placeholder="Search or select category"
                    />
                    <button
                      className="uoml-category-add-btn"
                      onClick={() => {
                        setShowCategoryDropdown(false);
                        setShowAddCategoryModal(true);
                      }}
                      title="Add new category"
                    >
                      <FaPlusCircle size={16} />
                    </button>
                  </div>
                  
                  {showCategoryDropdown && (
                    <div className="uoml-category-dropdown">
                      {filteredCategories.length === 0 ? (
                        <div className="uoml-category-dropdown-empty">
                          <span>No categories found</span>
                          <button
                            className="uoml-category-dropdown-add"
                            onClick={() => {
                              setShowCategoryDropdown(false);
                              setShowAddCategoryModal(true);
                            }}
                          >
                            <FaPlusCircle size={14} /> Add new category
                          </button>
                        </div>
                      ) : (
                        <>
                          {filteredCategories.map(cat => (
                            <div
                              key={cat.id}
                              className="uoml-category-dropdown-item"
                              onMouseDown={() => {
                                setFormData({ ...formData, category: cat.category_name });
                                setCategorySearch(cat.category_name);
                                setShowCategoryDropdown(false);
                              }}
                            >
                              {cat.category_name}
                            </div>
                          ))}
                          <div className="uoml-category-dropdown-divider" />
                          <button
                            className="uoml-category-dropdown-add-btn"
                            onMouseDown={() => {
                              setShowCategoryDropdown(false);
                              setShowAddCategoryModal(true);
                            }}
                          >
                            <FaPlusCircle size={14} /> Add new category
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {formData.category && (
                  <div className="uoml-category-selected">
                    Selected: <strong>{formData.category}</strong>
                  </div>
                )}
              </div>

              <div className="uoml-field-check">
                <input
                  type="checkbox"
                  id="mustBeWholeNumber"
                  checked={formData.must_be_whole_number}
                  onChange={(e) => setFormData({ ...formData, must_be_whole_number: e.target.checked })}
                  className="uoml-checkbox"
                />
                <label htmlFor="mustBeWholeNumber" className="uoml-check-label">
                  Must be whole number
                </label>
                <p className="uoml-check-hint">
                  Enable if this UOM can only have whole number values
                </p>
              </div>
            </div>

            <div className="uoml-modal-footer">
              <button className="uoml-btn-edit-full" onClick={() => {
                if (formData.name.trim()) {
                  navigate(`/uom/${encodeURIComponent(formData.name)}`);
                  handleCloseModal();
                }
              }}>
                <FaEdit size={12} /> Edit Full Form
              </button>
              <button 
                className="uoml-btn-save" 
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.category}
              >
                <FaCheck size={12} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="uoml-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddCategoryModal(false)}>
          <div className="uoml-modal uoml-modal-category">
            <div className="uoml-modal-header">
              <div className="uoml-modal-header-left">
                <div className="uoml-modal-icon">
                  <FaPlusCircle size={16} />
                </div>
                <span className="uoml-modal-title">Add New Category</span>
              </div>
              <button className="uoml-modal-close" onClick={() => {
                setShowAddCategoryModal(false);
                setNewCategoryName('');
                setCategoryApiError(null);
              }}>
                <FaTimes size={16} />
              </button>
            </div>

            {categoryApiError && (
              <div className="uoml-api-error">
                <FaTimesCircle className="error-icon" />
                <span>{categoryApiError}</span>
                <button className="error-close" onClick={() => setCategoryApiError(null)}>×</button>
              </div>
            )}

            <div className="uoml-modal-body">
              <div className="uoml-field">
                <label className="uoml-label">Category Name <span className="uoml-req">*</span></label>
                <input
                  className="uoml-input"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                  placeholder="Enter category name (e.g., Weight, Volume, Length)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                />
              </div>
            </div>

            <div className="uoml-modal-footer">
              <button className="uoml-btn-cancel" onClick={() => {
                setShowAddCategoryModal(false);
                setNewCategoryName('');
                setCategoryApiError(null);
              }}>
                Cancel
              </button>
              <button 
                className="uoml-btn-save" 
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
              >
                <FaCheck size={12} /> Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUOM && (
        <div className="uoml-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="uoml-modal uoml-modal-delete">
            <div className="uoml-modal-header">
              <span className="uoml-modal-title">Confirm Delete</span>
              <button className="uoml-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="uoml-modal-body">
              <p>Are you sure you want to delete this UOM?</p>
              <p className="uoml-modal-item-name"><strong>{selectedUOM.uom_name}</strong></p>
              <p className="uoml-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="uoml-modal-footer">
              <button className="uoml-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="uoml-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}