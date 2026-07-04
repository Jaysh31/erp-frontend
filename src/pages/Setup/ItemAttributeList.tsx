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
  FaPlus,
} from 'react-icons/fa';
import "./ItemAttributeList.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface ItemAttribute {
  id: string;
  attributeName: string;
  status: "Enabled" | "Disabled";
  createdOn: string;
}

const MOCK_ATTRIBUTES: ItemAttribute[] = [
  { id: "1", attributeName: "Colour", status: "Enabled", createdOn: "1d" },
  { id: "2", attributeName: "Size", status: "Enabled", createdOn: "1d" },
];

export default function ItemAttributeList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const [attributes] = useState<ItemAttribute[]>(MOCK_ATTRIBUTES);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemAttribute | null>(null);

  // Filter data based on search and status
  const filteredData = attributes.filter(item => {
    const matchesSearch = item.attributeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && item.status === 'Enabled') ||
                         (statusFilter === 'disabled' && item.status === 'Disabled');
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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

  const handleDelete = (item: ItemAttribute) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    console.log('Deleting:', selectedItem);
    setShowDeleteConfirm(false);
    setSelectedItem(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className={`ial-page ${theme}`}>
      {/* Stats Cards */}
      {/* <div className="ial-stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="ial-stat-card" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)` }}>
            <div className="ial-stat-icon">{stat.icon}</div>
            <div className="ial-stat-content">
              <p className="ial-stat-title">{stat.title}</p>
              <p className="ial-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div> */}

      {/* Search and Filter Bar */}
      <div className="ial-filter-bar">
        <div className="ial-filter-left">
          <div className="ial-search-wrapper">
            <FaSearch className="ial-search-icon" />
            <input
              type="text"
              placeholder="Search attributes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ial-search-input"
            />
            {searchTerm && (
              <button className="ial-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="ial-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ial-filter-select"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="ial-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="ial-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="ial-btn-primary" onClick={() => navigate("/item-attribute/new")}>
            <FaPlus size={12} />
            Add Attribute
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="ial-active-filters">
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
            className="ial-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Table */}
      <div className="ial-table-wrap">
        <table className="ial-table">
          <thead>
            <tr>
              <th className="ial-th-check">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="ial-checkbox" />
              </th>
              <th className="ial-th">ID</th>
              <th className="ial-th">Attribute Name</th>
              <th className="ial-th">Status</th>
              <th className="ial-th ial-th-meta">
                <span className="ial-count-label">{totalItems} of {attributes.length}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="ial-empty-state">
                  <div className="ial-empty-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p>No attributes found</p>
                    <span>Try adjusting your search criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className={`ial-tr ${selected.has(row.id) ? "ial-tr-selected" : ""}`}
                  onClick={() => navigate(`/item-attribute/${encodeURIComponent(row.attributeName)}`)}
                >
                  <td className="ial-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="ial-checkbox" />
                  </td>
                  <td className="ial-td">{row.id}</td>
                  <td className="ial-td ial-td-name">{row.attributeName}</td>
                  <td className="ial-td">
                    <span className={`ial-status-badge ial-status-${row.status.toLowerCase()}`}>{row.status}</span>
                  </td>
                  <td className="ial-td ial-td-meta">
                    <span className="ial-ago">{row.createdOn}</span>
                    <span className="ial-dot">·</span>
                    <div className="ial-action-buttons">
                      <button 
                        className="ial-action-btn ial-action-view" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/item-attribute/${encodeURIComponent(row.attributeName)}`); }}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button 
                        className="ial-action-btn ial-action-edit" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/item-attribute/${encodeURIComponent(row.attributeName)}`); }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        className="ial-action-btn ial-action-delete" 
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
      {totalPages > 1 && (
        <div className="ial-pagination">
          <div className="ial-pagination-left">
            <span className="ial-pagination-label">Show:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="ial-page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ial-pagination-label">entries</span>
          </div>
          <div className="ial-pagination-center">
            <button 
              onClick={goToFirstPage} 
              disabled={currentPage === 1} 
              className="ial-page-btn"
            >
              <FaAngleDoubleLeft size={12} />
            </button>
            <button 
              onClick={goToPrevPage} 
              disabled={currentPage === 1} 
              className="ial-page-btn"
            >
              <FaChevronLeft size={12} />
            </button>
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`ial-page-btn ${currentPage === page ? 'ial-page-btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages} 
              className="ial-page-btn"
            >
              <FaChevronRight size={12} />
            </button>
            <button 
              onClick={goToLastPage} 
              disabled={currentPage === totalPages} 
              className="ial-page-btn"
            >
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="ial-pagination-right">
            <span className="ial-pagination-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="ial-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="ial-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ial-modal-header">
              <h3>Confirm Delete</h3>
              <button className="ial-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="ial-modal-body">
              <p>Are you sure you want to delete this attribute?</p>
              <p className="ial-modal-item-name"><strong>{selectedItem.attributeName}</strong></p>
              <p className="ial-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="ial-modal-footer">
              <button className="ial-modal-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="ial-modal-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}