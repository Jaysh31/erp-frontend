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
  FaFileAlt,
  FaStar,
  FaCheckCircle,
  FaBan,
  FaPlus,
} from 'react-icons/fa';
import "./LetterHeadList.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import type { LetterHeadRecord } from './AddLetterHeadForm';

// ─── localStorage helpers ──────────────────────────────────────────────────

const LS_KEY = "letterHeads";

function loadLetterHeads(): LetterHeadRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function deleteLetterHead(id: string): void {
  const records = loadLetterHeads().filter((r) => r.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(records));
}

// ─── relative time helper ──────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function LetterHeadList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [letterHeads, setLetterHeads] = useState<LetterHeadRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LetterHeadRecord | null>(null);

  // ── load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    setLetterHeads(loadLetterHeads());
  }, []);

  // ── filtering ─────────────────────────────────────────────────────────────
  const filteredData = letterHeads.filter(item => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'default' && item.isDefault) ||
      (statusFilter === 'disabled' && item.disabled);
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalDefault  = letterHeads.filter(item => item.isDefault).length;
  const totalDisabled = letterHeads.filter(item => item.disabled).length;
  const totalActive   = letterHeads.filter(item => !item.disabled).length;

  const stats = [
    { title: 'Total Letter Heads', value: letterHeads.length, icon: <FaFileAlt />, color: '#6366f1' },
    { title: 'Default',            value: totalDefault,       icon: <FaStar />,       color: '#f59e0b' },
    { title: 'Active',             value: totalActive,        icon: <FaCheckCircle />, color: '#10b981' },
    { title: 'Disabled',           value: totalDisabled,      icon: <FaBan />,         color: '#ef4444' },
  ];

  // ── selection ─────────────────────────────────────────────────────────────
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

  // ── pagination ────────────────────────────────────────────────────────────
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const goToFirstPage = () => goToPage(1);
  const goToLastPage  = () => goToPage(totalPages);
  const goToNextPage  = () => goToPage(currentPage + 1);
  const goToPrevPage  = () => goToPage(currentPage - 1);

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

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = (item: LetterHeadRecord) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!selectedItem) return;
    deleteLetterHead(selectedItem.id);
    setLetterHeads(loadLetterHeads());
    setSelected((prev) => { const n = new Set(prev); n.delete(selectedItem.id); return n; });
    setShowDeleteConfirm(false);
    setSelectedItem(null);
  };

  // ── navigation — pass full record as router state ─────────────────────────
  const openRecord = (record: LetterHeadRecord) => {
    navigate(`/letter-head/${encodeURIComponent(record.id)}`, {
      state: { letterHead: record },
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className={`lh-page ${theme}`}>
      {/* Stats Cards */}
      <div className="lh-stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="lh-stat-card" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)` }}>
            <div className="lh-stat-icon">{stat.icon}</div>
            <div className="lh-stat-content">
              <p className="lh-stat-title">{stat.title}</p>
              <p className="lh-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="lh-filter-bar">
        <div className="lh-filter-left">
          <div className="lh-search-wrapper">
            <FaSearch className="lh-search-icon" />
            <input
              type="text"
              placeholder="Search letter heads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="lh-search-input"
            />
            {searchTerm && (
              <button className="lh-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="lh-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="lh-filter-select"
          >
            <option value="all">All Letter Heads</option>
            <option value="default">Default</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="lh-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="lh-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="lh-btn-primary" onClick={() => navigate("/letter-head/new")}>
            <FaPlus size={12} />
            Add Letter Head
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="lh-active-filters">
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
          <button onClick={clearFilters} className="lh-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Table */}
      <div className="lh-table-wrap">
        <table className="lh-table">
          <thead>
            <tr>
              <th className="lh-th-check">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="lh-checkbox" />
              </th>
              <th className="lh-th">ID</th>
              <th className="lh-th lh-th-bool">Is Default</th>
              <th className="lh-th lh-th-bool">Disabled</th>
              <th className="lh-th lh-th-meta">
                <span className="lh-count-label">{totalItems} of {letterHeads.length}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="lh-empty-state">
                  <div className="lh-empty-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>
                    </svg>
                    <p>No letter heads found</p>
                    <span>
                      {letterHeads.length === 0
                        ? "Click \"Add Letter Head\" to create your first one."
                        : "Try adjusting your search criteria"}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className={`lh-tr ${selected.has(row.id) ? "lh-tr-selected" : ""}`}
                  onClick={() => openRecord(row)}
                >
                  <td className="lh-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="lh-checkbox" />
                  </td>
                  <td className="lh-td lh-td-name">{row.id}</td>
                  <td className="lh-td lh-td-bool">
                    <input type="checkbox" checked={row.isDefault} disabled className="lh-checkbox lh-checkbox-readonly" />
                  </td>
                  <td className="lh-td lh-td-bool">
                    <input type="checkbox" checked={row.disabled} disabled className="lh-checkbox lh-checkbox-readonly" />
                  </td>
                  <td className="lh-td lh-td-meta">
                    <span className="lh-ago">{relativeTime(row.createdAt)}</span>
                    <span className="lh-dot">·</span>
                    <div className="lh-action-buttons">
                      <button
                        className="lh-action-btn lh-action-view"
                        onClick={(e) => { e.stopPropagation(); openRecord(row); }}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button
                        className="lh-action-btn lh-action-edit"
                        onClick={(e) => { e.stopPropagation(); openRecord(row); }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        className="lh-action-btn lh-action-delete"
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
        <div className="lh-pagination">
          <div className="lh-pagination-left">
            <span className="lh-pagination-label">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="lh-page-size-select"
            >
              <option value={20}>20</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={2500}>2500</option>
            </select>
            <span className="lh-pagination-label">entries</span>
          </div>
          <div className="lh-pagination-center">
            <button onClick={goToFirstPage} disabled={currentPage === 1} className="lh-page-btn"><FaAngleDoubleLeft size={12} /></button>
            <button onClick={goToPrevPage}  disabled={currentPage === 1} className="lh-page-btn"><FaChevronLeft size={12} /></button>
            {getPageNumbers().map(page => (
              <button key={page} onClick={() => goToPage(page)} className={`lh-page-btn ${currentPage === page ? 'lh-page-btn-active' : ''}`}>
                {page}
              </button>
            ))}
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className="lh-page-btn"><FaChevronRight size={12} /></button>
            <button onClick={goToLastPage} disabled={currentPage === totalPages} className="lh-page-btn"><FaAngleDoubleRight size={12} /></button>
          </div>
          <div className="lh-pagination-right">
            <span className="lh-pagination-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="lh-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="lh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lh-modal-header">
              <h3>Confirm Delete</h3>
              <button className="lh-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="lh-modal-body">
              <p>Are you sure you want to delete this letter head?</p>
              <p className="lh-modal-item-name"><strong>{selectedItem.id}</strong></p>
              <p className="lh-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="lh-modal-footer">
              <button className="lh-modal-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="lh-modal-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}