import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Plus,
  Filter as FilterIcon,
  X,
  ArrowUpDown,
  FileStack,
  Check,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import "./BOMPage.css";
import NewBOMPage from "./Newbompage";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from '../../src/services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_FIELDS = ["Created On", "Last Updated On", "ID", "Item to Manufacture"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface BOMRecord {
  id: number;
  item: string;
  item_name: string;
  quantity: number;
  uom: string;
  company: string;
  is_active: number;
  is_default: number;
  total_cost: number;
  creation: string;
}

interface BOMListResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: BOMRecord[];
  };
}

interface BOMDetailResponse {
  success: number;
  data: {
    bom: any;
    items: any[];
    operations: any[];
  };
}

interface BOMRow {
  id: string;
  status: "Draft" | "Active" | "Disabled";
  itemToManufacture: string;
  isActive: boolean;
  isDefault: boolean;
  totalCost: string;
  hasVariants: boolean;
  createdOn: string;
  comments: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const CheckBadge: React.FC<{ checked: boolean }> = ({ checked }) => (
  <div className={`bom-check-badge ${checked ? "bom-check-badge--on" : ""}`}>
    {checked && <Check size={12} color="#fff" strokeWidth={3} />}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const BOMPage: React.FC = () => {
  const { theme } = useAdminTheme();
  const [showNewBOM, setShowNewBOM] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editBOMData, setEditBOMData] = useState<any>(null);

  // Data state
  const [bomData, setBomData] = useState<BOMRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // Sort
  const [sortOpen, setSortOpen] = useState(false);
  const [sortField, setSortField] = useState("Created On");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selected rows
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const rootRef = useRef<HTMLDivElement>(null);

  // ─── Fetch BOMs from API ──────────────────────────────────────────────────

  const fetchBOMs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const sortMap: Record<string, string> = {
        'Created On': 'creation',
        'Last Updated On': 'modified',
        'ID': 'id',
        'Item to Manufacture': 'item_name'
      };
      if (sortField in sortMap) {
        params.append('sort_by', sortMap[sortField]);
        params.append('sort_order', 'desc');
      }

      const response = await api.get<BOMListResponse>(`/bom?${params.toString()}`);
      
      if (response.data.success === 1) {
        setBomData(response.data.data.records);
        setTotalRecords(response.data.data.total);
      } else {
        setError('Failed to load BOMs');
      }
    } catch (err: any) {
      console.error('Error fetching BOMs:', err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch single BOM for editing ────────────────────────────────────────

  const fetchBOMForEdit = async (bomId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<BOMDetailResponse>(`/bom/${bomId}`);
      
      if (response.data.success === 1) {
        setEditBOMData(response.data.data);
        setShowNewBOM(true);
      } else {
        setError('Failed to load BOM data for editing');
      }
    } catch (err: any) {
      console.error('Error fetching BOM:', err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchBOMs();
  }, [currentPage, itemsPerPage, sortField, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchBOMs();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const closeAll = () => {
    setSortOpen(false);
  };

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean
  ) => {
    closeAll();
    setter(!current);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // ─── Transform API data to table rows ────────────────────────────────────

  const transformToRows = (records: BOMRecord[]): BOMRow[] => {
    return records.map(record => ({
      id: String(record.id),
      status: record.is_active === 1 ? "Active" : "Disabled",
      itemToManufacture: record.item_name,
      isActive: record.is_active === 1,
      isDefault: record.is_default === 1,
      totalCost: `₹ ${record.total_cost.toFixed(2)}`,
      hasVariants: false,
      createdOn: new Date(record.creation).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      comments: 0,
    }));
  };

  const tableData = transformToRows(bomData);

  // ─── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(validCurrentPage + 1);
  const goToPrevPage = () => goToPage(validCurrentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  // ─── Row selection ────────────────────────────────────────────────────────

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      const numId = Number(id);
      next.has(numId) ? next.delete(numId) : next.add(numId);
      return next;
    });
  };

  const allSelected = tableData.length > 0 && selectedRows.size === tableData.length;

  const toggleAll = () => {
    setSelectedRows(allSelected ? new Set() : new Set(tableData.map((r) => Number(r.id))));
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleView = (row: BOMRow) => {
    console.log("View BOM", row.id);
    // Navigate to view page or open modal
  };

  const handleEdit = (row: BOMRow) => {
    // Fetch full BOM data for editing
    fetchBOMForEdit(Number(row.id));
  };

  const handleDelete = async (row: BOMRow) => {
    if (window.confirm(`Are you sure you want to delete BOM "${row.id}"?`)) {
      try {
        // DELETE with id in payload (not in URL)
        const response = await api.delete('/bom', { data: { id: Number(row.id) } });
        if (response.data.success === 1) {
          await fetchBOMs();
          setSelectedRows(prev => {
            const next = new Set(prev);
            next.delete(Number(row.id));
            return next;
          });
          alert('BOM deleted successfully');
        } else {
          setError('Failed to delete BOM');
        }
      } catch (err: any) {
        console.error('Error deleting BOM:', err);
        setError(err.response?.data?.message || 'Failed to delete BOM');
      }
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {showNewBOM && (
        <NewBOMPage 
          onBack={() => {
            setShowNewBOM(false);
            setEditBOMData(null);
            fetchBOMs();
          }} 
          editData={editBOMData}
        />
      )}
      {!showNewBOM && (
        <div className={`bom-page ${theme}`} ref={rootRef}>
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="bom-header">
            <div className="bom-breadcrumb">
              <button className="bom-breadcrumb__home" onClick={() => console.log('Home')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <span className="bom-breadcrumb__sep">/</span>
              <span className="bom-breadcrumb__crumb">Manufacturing</span>
              <span className="bom-breadcrumb__sep">/</span>
              <span className="bom-breadcrumb__crumb--active">Bill of Materials</span>
            </div>
            <div className="bom-actions">
              <button className="bom-icon-btn bom-icon-btn--teal" title="Refresh" onClick={fetchBOMs}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Error message ────────────────────────────────────────────── */}
          {error && (
            <div className="bom-error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="bom-error-close">
                <X size={14} />
              </button>
            </div>
          )}

          

          {/* ── Search and Filter Bar ─────────────────────────────────────── */}
          <div className="bom-filter-bar">
            <div className="bom-filter-left">
              <div className="bom-search-wrapper">
                <Search className="bom-search-icon" size={14} />
                <input
                  type="text"
                  placeholder="Search BOMs by ID or Item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bom-search-input"
                />
                {searchTerm && (
                  <button className="bom-search-clear" onClick={() => setSearchTerm('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="bom-filter-right">
              <select 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bom-filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <button className="bom-sort-btn" onClick={() => toggle(setSortOpen, sortOpen)}>
                <ArrowUpDown size={12} />
                {sortField}
                <ChevronDown size={12} />
                {sortOpen && (
                  <div className="bom-menu bom-menu--list bom-menu--narrow bom-menu--right">
                    {SORT_FIELDS.map((f) => (
                      <div
                        key={f}
                        className={`bom-menu__item ${sortField === f ? "bom-menu__item--active" : ""}`}
                        onClick={() => {
                          setSortField(f);
                          setSortOpen(false);
                        }}
                      >
                        {sortField === f ? (
                          <Check size={14} className="bom-menu__check" />
                        ) : (
                          <span style={{ width: 14 }} />
                        )}
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
              <button className="bom-btn-primary" onClick={() => {
                setEditBOMData(null);
                setShowNewBOM(true);
              }}>
                <Plus size={12} />
                Add BOM
              </button>
            </div>
          </div>

          {/* ── Active filters indicator ──────────────────────────────────── */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="bom-active-filters">
              <FilterIcon size={12} style={{ color: 'var(--primary-color)' }} />
              <span>Active filters:</span>
              {searchTerm && (
                <span><strong>Search:</strong> "{searchTerm}"</span>
              )}
              {statusFilter !== 'all' && (
                <span><strong>Status:</strong> {statusFilter === 'active' ? 'Active' : 'Disabled'}</span>
              )}
              <button 
                onClick={clearFilters}
                className="bom-clear-filters"
              >
                <X size={10} /> Clear All
              </button>
            </div>
          )}

          {/* ── Table ──────────────────────────────────────────────────────── */}
          <div className="bom-table-wrap">
            {loading ? (
              <div className="bom-loading-state">
                <div className="bom-spinner"></div>
                <p>Loading BOMs...</p>
              </div>
            ) : (
              <table className="bom-table">
                <thead>
                  <tr>
                    <th className="bom-th-check">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="bom-checkbox"
                        disabled={tableData.length === 0}
                      />
                    </th>
                    <th className="bom-th">BOM ID</th>
                    <th className="bom-th">Status</th>
                    <th className="bom-th">Item to Manufacture</th>
                    <th className="bom-th">Quantity</th>
                    <th className="bom-th">UOM</th>
                    <th className="bom-th">Is Active</th>
                    <th className="bom-th">Is Default</th>
                    <th className="bom-th">Total Cost</th>
                    <th className="bom-th bom-th-meta">
                      <span className="bom-count-label">{totalRecords} total</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="bom-empty-state">
                        <div className="bom-empty-content">
                          <FileStack size={48} />
                          <p>No BOMs found</p>
                          <span>
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search criteria' 
                              : 'Create your first BOM by clicking "Add BOM"'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tableData.map((row) => (
                      <tr
                        key={row.id}
                        className={`bom-tr ${selectedRows.has(Number(row.id)) ? "bom-tr-selected" : ""}`}
                      >
                        <td className="bom-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(Number(row.id))}
                            onChange={() => toggleRow(row.id)}
                            className="bom-checkbox"
                          />
                        </td>
                        <td className="bom-td bom-td-id">
                          <a
                            className="bom-id-link"
                            href={`/bom/${row.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleView(row);
                            }}
                          >
                            {row.id}
                          </a>
                        </td>
                        <td className="bom-td">
                          <span className={`bom-status-pill ${row.status === 'Active' ? 'bom-status--active' : 'bom-status--disabled'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="bom-td" style={{ fontWeight: 500 }}>{row.itemToManufacture}</td>
                        <td className="bom-td">{bomData.find(b => String(b.id) === row.id)?.quantity || '-'}</td>
                        <td className="bom-td">{bomData.find(b => String(b.id) === row.id)?.uom || '-'}</td>
                        <td className="bom-td">
                          <CheckBadge checked={row.isActive} />
                        </td>
                        <td className="bom-td">
                          <CheckBadge checked={row.isDefault} />
                        </td>
                        <td className="bom-td bom-cost">{row.totalCost}</td>
                        <td className="bom-td bom-td-meta">
                          <span className="bom-ago">{row.createdOn}</span>
                          <span className="bom-dot">·</span>
                          <div className="bom-action-buttons">
                            <button 
                              className="bom-action-btn bom-action-view" 
                              onClick={(e) => { e.stopPropagation(); handleView(row); }}
                              title="View"
                            >
                              <Eye size={12} />
                            </button>
                            <button 
                              className="bom-action-btn bom-action-edit" 
                              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                              title="Edit"
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              className="bom-action-btn bom-action-delete" 
                              onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {!loading && totalRecords > 0 && (
            <div className="bom-pagination">
              <div className="bom-pagination-left">
                <span className="bom-pagination-label">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bom-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="bom-pagination-label">entries</span>
              </div>
              <div className="bom-pagination-center">
                <button 
                  onClick={goToFirstPage} 
                  disabled={validCurrentPage === 1 || totalRecords === 0} 
                  className="bom-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="11 17 6 12 11 7"/>
                    <polyline points="18 17 13 12 18 7"/>
                  </svg>
                </button>
                <button 
                  onClick={goToPrevPage} 
                  disabled={validCurrentPage === 1 || totalRecords === 0} 
                  className="bom-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`bom-page-btn ${validCurrentPage === page ? 'bom-page-btn-active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={goToNextPage} 
                  disabled={validCurrentPage === totalPages || totalRecords === 0} 
                  className="bom-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
                <button 
                  onClick={goToLastPage} 
                  disabled={validCurrentPage === totalPages || totalRecords === 0} 
                  className="bom-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 17 18 12 13 7"/>
                    <polyline points="6 17 11 12 6 7"/>
                  </svg>
                </button>
              </div>
              <div className="bom-pagination-right">
                <span className="bom-pagination-info">
                  Showing {getStartIndex()} to {getEndIndex()} of {totalRecords} entries
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BOMPage;