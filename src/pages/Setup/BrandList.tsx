import { useState } from "react";
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
  FaTag,
  FaPlus,
  FaCheck,
} from 'react-icons/fa';
import "./BrandList.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface Brand {
  id: string;
  name: string;
  description: string;
  createdOn: string;
}

interface BrandFormData {
  id: string;
  name: string;
  description: string;
}

const MOCK_BRANDS: Brand[] = [
  { id: "1", name: "RMW Electrical", description: "Electrical products", createdOn: "1m" },
  { id: "2", name: "TechPro", description: "Technology solutions", createdOn: "2m" },
  { id: "3", name: "GreenEco", description: "Eco-friendly products", createdOn: "3m" },
  { id: "4", name: "SmartHome", description: "Smart home devices", createdOn: "4m" },
  { id: "5", name: "PowerMax", description: "Power equipment", createdOn: "5m" },
  { id: "6", name: "AutoParts", description: "Automotive parts", createdOn: "6m" },
  { id: "7", name: "FoodFresh", description: "Food products", createdOn: "7m" },
  { id: "8", name: "FashionWear", description: "Fashion clothing", createdOn: "8m" },
  { id: "9", name: "HealthPlus", description: "Health supplements", createdOn: "9m" },
  { id: "10", name: "TechGadgets", description: "Gadgets and accessories", createdOn: "10m" },
];

export default function BrandList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const [brands] = useState<Brand[]>(MOCK_BRANDS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({
    id: "",
    name: "",
    description: "",
  });

  // Filter data based on search
  const filteredData = brands.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
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

  const handleOpenModal = () => {
    setFormData({ id: "", name: "", description: "" });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ id: "", name: "", description: "" });
  };

  const handleSave = () => {
    if (formData.name.trim()) {
      navigate(`/brand/${encodeURIComponent(formData.name)}`);
      handleCloseModal();
    }
  };

  const handleEditFull = () => {
    if (formData.name.trim()) {
      navigate(`/brand/${encodeURIComponent(formData.name)}`);
      handleCloseModal();
    }
  };

  const handleDelete = (item: Brand) => {
    setSelectedBrand(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    console.log('Deleting:', selectedBrand);
    setShowDeleteConfirm(false);
    setSelectedBrand(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalItems);
  };

  return (
    <div className={`bl-page ${theme}`}>
      {/* Stats Cards */}
      {/* <div className="bl-stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="bl-stat-card" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)` }}>
            <div className="bl-stat-icon">{stat.icon}</div>
            <div className="bl-stat-content">
              <p className="bl-stat-title">{stat.title}</p>
              <p className="bl-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div> */}

      {/* Search and Filter Bar */}
      <div className="bl-filter-bar">
        <div className="bl-filter-left">
          <div className="bl-search-wrapper">
            <FaSearch className="bl-search-icon" />
            <input
              type="text"
              placeholder="Search Brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bl-search-input"
            />
            {searchTerm && (
              <button className="bl-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="bl-filter-right">
          <button className="bl-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="bl-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="bl-btn-primary" onClick={handleOpenModal}>
            <FaPlus size={12} />
            Add Brand
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {searchTerm && (
        <div className="bl-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          <span style={{ color: 'var(--text-primary)' }}>
            <strong>Search:</strong> "{searchTerm}"
          </span>
          <button 
            onClick={clearFilters}
            className="bl-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bl-table-wrap">
        <table className="bl-table">
          <thead>
            <tr>
              <th className="bl-th-check">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="bl-checkbox" />
              </th>
              <th className="bl-th">ID</th>
              <th className="bl-th">Brand Name</th>
              <th className="bl-th">Description</th>
              <th className="bl-th bl-th-meta">
                <span className="bl-count-label">{totalItems} of {brands.length}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="bl-empty-state">
                  <div className="bl-empty-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p>No Brands found</p>
                    <span>Try adjusting your search criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className={`bl-tr ${selected.has(row.id) ? "bl-tr-selected" : ""}`}
                  onClick={() => navigate(`/brand/${encodeURIComponent(row.name)}`)}
                >
                  <td className="bl-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="bl-checkbox" />
                  </td>
                  <td className="bl-td">{row.id}</td>
                  <td className="bl-td bl-td-name">{row.name}</td>
                  <td className="bl-td">{row.description || "—"}</td>
                  <td className="bl-td bl-td-meta">
                    <span className="bl-ago">{row.createdOn}</span>
                    <span className="bl-dot">·</span>
                    <div className="bl-action-buttons">
                      <button 
                        className="bl-action-btn bl-action-view" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/brand/${encodeURIComponent(row.name)}`); }}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button 
                        className="bl-action-btn bl-action-edit" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/brand/${encodeURIComponent(row.name)}`); }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        className="bl-action-btn bl-action-delete" 
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
      <div className="bl-pagination">
        <div className="bl-pagination-left">
          <span className="bl-pagination-label">Show:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="bl-page-size-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="bl-pagination-label">entries</span>
        </div>
        <div className="bl-pagination-center">
          <button 
            onClick={goToFirstPage} 
            disabled={currentPage === 1 || totalItems === 0} 
            className="bl-page-btn"
          >
            <FaAngleDoubleLeft size={12} />
          </button>
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 1 || totalItems === 0} 
            className="bl-page-btn"
          >
            <FaChevronLeft size={12} />
          </button>
          {totalItems > 0 && getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`bl-page-btn ${currentPage === page ? 'bl-page-btn-active' : ''}`}
            >
              {page}
            </button>
          ))}
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages || totalItems === 0} 
            className="bl-page-btn"
          >
            <FaChevronRight size={12} />
          </button>
          <button 
            onClick={goToLastPage} 
            disabled={currentPage === totalPages || totalItems === 0} 
            className="bl-page-btn"
          >
            <FaAngleDoubleRight size={12} />
          </button>
        </div>
        <div className="bl-pagination-right">
          <span className="bl-pagination-info">
            {totalItems > 0 ? (
              `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
            ) : (
              'No entries to show'
            )}
          </span>
        </div>
      </div>

      {/* New Brand Modal */}
      {showModal && (
        <div className="bl-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className="bl-modal">
            <div className="bl-modal-header">
              <div className="bl-modal-header-left">
                <div className="bl-modal-icon">
                  <FaTag size={16} />
                </div>
                <span className="bl-modal-title">New Brand</span>
              </div>
              <button className="bl-modal-close" onClick={handleCloseModal}>
                <FaTimes size={16} />
              </button>
            </div>

            <div className="bl-modal-body">
              <div className="bl-field">
                <label className="bl-label">ID</label>
                <input
                  className="bl-input"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="Enter brand ID"
                />
              </div>

              <div className="bl-field">
                <label className="bl-label">Brand Name <span className="bl-req">*</span></label>
                <input
                  className="bl-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                  placeholder="Enter brand name"
                />
              </div>

              <div className="bl-field">
                <label className="bl-label">Description</label>
                <input
                  className="bl-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter brand description"
                />
              </div>
            </div>

            <div className="bl-modal-footer">
              <button className="bl-btn-edit-full" onClick={handleEditFull}>
                <FaEdit size={12} /> Edit Full Form
              </button>
              <button 
                className="bl-btn-save" 
                onClick={handleSave}
                disabled={!formData.name.trim()}
              >
                <FaCheck size={12} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedBrand && (
        <div className="bl-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bl-modal bl-modal-delete">
            <div className="bl-modal-header">
              <span className="bl-modal-title">Confirm Delete</span>
              <button className="bl-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="bl-modal-body">
              <p>Are you sure you want to delete this brand?</p>
              <p className="bl-modal-item-name"><strong>{selectedBrand.name}</strong></p>
              <p className="bl-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="bl-modal-footer">
              <button className="bl-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="bl-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}