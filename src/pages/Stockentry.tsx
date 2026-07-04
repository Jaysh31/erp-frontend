// Stockentry.tsx
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
  FaBuilding,
  FaBoxes,
} from "react-icons/fa";
import "./Stockentry.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";

type EntryType =
  | "Disassemble"
  | "Manufacture"
  | "Material Consumption for Manufacture"
  | "Material Issue"
  | "Material Receipt"
  | "Material Transfer"
  | "Material Transfer for Manufacture"
  | "Receive from Customer"
  | "Repack"
  | "Send to Subcontractor";

interface StockEntry {
  id: number;
  name: string;
  stock_entry_type: EntryType;
  source_warehouse: string;
  target_warehouse: string;
  company: string;
  posting_date: string;
}

interface StockEntryDisplay {
  id: string;
  name: string;
  entryType: EntryType;
  sourceWarehouse: string;
  targetWarehouse: string;
  company: string;
  postingDate: string;
  createdAgo: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: StockEntry[];
  };
}

const TYPE_CLASS: Record<EntryType, string> = {
  Disassemble: "s-stopped",
  Manufacture: "s-inprocess",
  "Material Consumption for Manufacture": "s-notstarted",
  "Material Issue": "s-draft",
  "Material Receipt": "s-completed",
  "Material Transfer": "s-open",
  "Material Transfer for Manufacture": "s-onhold",
  "Receive from Customer": "s-completed",
  Repack: "s-cancelled",
  "Send to Subcontractor": "s-inprocess",
};

const ENTRY_TYPES: EntryType[] = [
  "Disassemble",
  "Manufacture",
  "Material Consumption for Manufacture",
  "Material Issue",
  "Material Receipt",
  "Material Transfer",
  "Material Transfer for Manufacture",
  "Receive from Customer",
  "Repack",
  "Send to Subcontractor",
];

export default function Stockentry() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [stockEntries, setStockEntries] = useState<StockEntryDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockEntryDisplay | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo`;
    return `${Math.floor(diffDays / 365)} y`;
  };

  const fetchStockEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>(`/stock-entry?page=${currentPage}&limit=${itemsPerPage}`);

      if (response.data.success === 1 && response.data.data) {
        const { records, total, page, limit } = response.data.data;
        setTotalItems(total ?? 0);
        setTotalPages(Math.ceil((total ?? 0) / (limit || itemsPerPage)));
        setCurrentPage(page ?? 1);

        const transformedData: StockEntryDisplay[] = (records ?? []).map((item: StockEntry) => ({
          id: item.id.toString(),
          name: item.name,
          entryType: item.stock_entry_type,
          sourceWarehouse: item.source_warehouse,
          targetWarehouse: item.target_warehouse,
          company: item.company,
          postingDate: item.posting_date,
          createdAgo: formatDate(item.posting_date),
        }));

        setStockEntries(transformedData);
      } else {
        setStockEntries([]);
        setError("Failed to fetch stock entries");
      }
    } catch (err) {
      console.error("Error fetching stock entries:", err);
      setError("An error occurred while fetching stock entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockEntries();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const filteredData = stockEntries.filter((item) => {
    const matchesSearch =
      (item.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sourceWarehouse ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.targetWarehouse ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.company ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.entryType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalFilteredItems = filteredData.length;
  const filteredTotalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  const validCurrentPage = Math.min(currentPage, filteredTotalPages || 1);

  useEffect(() => {
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
    }
  }, [validCurrentPage, currentPage]);

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
    if (page >= 1 && page <= filteredTotalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(filteredTotalPages);
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
    let endPage = Math.min(filteredTotalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleDelete = (item: StockEntryDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        const response = await api.delete(`/stock-entry/${selectedItem.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
          fetchStockEntries();
        }
      } catch (err) {
        console.error("Error deleting stock entry:", err);
        alert("Failed to delete stock entry");
      }
    }
  };

  const handleRowClick = (item: StockEntryDisplay) => {
    navigate(`/stock-entry/${encodeURIComponent(item.id)}`);
  };

  const handleEdit = (item: StockEntryDisplay) => {
    navigate(`/stock-entry/${encodeURIComponent(item.id)}`);
  };

  const handleView = (item: StockEntryDisplay) => {
    navigate(`/stock-entry/${encodeURIComponent(item.id)}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  return (
    <div className={`se-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="se-filter-bar">
        <div className="se-filter-left">
          <div className="se-search-wrapper">
            <FaSearch className="se-search-icon" />
            <input
              type="text"
              placeholder="Search stock entries by ID, warehouse, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="se-search-input"
            />
            {searchTerm && (
              <button className="se-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="se-filter-right">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="se-filter-select">
            <option value="all">All Types</option>
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button className="se-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="se-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" />
            </svg>
            Posting Date
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="se-btn-primary" onClick={() => navigate("/stock-entry/new")}>
            <FaPlus size={12} />
            Add Stock Entry
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || typeFilter !== "all") && (
        <div className="se-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span style={{ color: "var(--text-primary)" }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {typeFilter !== "all" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Type:</strong> {typeFilter}
            </span>
          )}
          <button onClick={clearFilters} className="se-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="se-loading">
          <p>Loading stock entries...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="se-error">
          <p>{error}</p>
          <button onClick={fetchStockEntries} className="se-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="se-table-wrap">
            <table className="se-table">
              <thead>
                <tr>
                  <th className="se-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="se-checkbox" />
                  </th>
                  <th className="se-th">Entry #</th>
                  <th className="se-th">Type</th>
                  <th className="se-th">Source Warehouse</th>
                  <th className="se-th">Target Warehouse</th>
                  <th className="se-th">Company</th>
                  <th className="se-th">Posting Date</th>
                  <th className="se-th se-th-meta">
                    <span className="se-count-label">{totalFilteredItems} of {totalItems}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="se-empty-state">
                      <div className="se-empty-content">
                        <FaBoxes size={48} style={{ color: "var(--text-secondary)" }} />
                        <p>No stock entries found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`se-tr ${selected.has(row.id) ? "se-tr-selected" : ""}`}
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="se-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="se-checkbox" />
                      </td>
                      <td className="se-td se-td-id">{row.name}</td>
                      <td className="se-td">
                        <span className={`se-status-badge ${TYPE_CLASS[row.entryType]}`}>
                          {row.entryType}
                        </span>
                      </td>
                      <td className="se-td se-td-link">{row.sourceWarehouse || "—"}</td>
                      <td className="se-td se-td-link">{row.targetWarehouse || "—"}</td>
                      <td className="se-td se-td-company">
                        <FaBuilding size={10} className="se-company-icon" />
                        {row.company}
                      </td>
                      <td className="se-td se-td-dates">
                        {row.postingDate
                          ? new Date(row.postingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="se-td se-td-meta" onClick={(e) => e.stopPropagation()}>
                        <span className="se-ago">{row.createdAgo}</span>
                        <span className="se-dot">·</span>
                        <div className="se-action-buttons">
                          <button className="se-action-btn se-action-view" onClick={(e) => { e.stopPropagation(); handleView(row); }} title="View">
                            <FaEye size={12} />
                          </button>
                          <button className="se-action-btn se-action-edit" onClick={(e) => { e.stopPropagation(); handleEdit(row); }} title="Edit">
                            <FaEdit size={12} />
                          </button>
                          <button className="se-action-btn se-action-delete" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} title="Delete">
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
          <div className="se-pagination">
            <div className="se-pagination-left">
              <span className="se-pagination-label">Show:</span>
              <select value={itemsPerPage} onChange={(e) => handlePageSizeChange(Number(e.target.value))} className="se-page-size-select">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="se-pagination-label">entries</span>
            </div>
            <div className="se-pagination-center">
              <button onClick={goToFirstPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="se-page-btn">
                <FaAngleDoubleLeft size={12} />
              </button>
              <button onClick={goToPrevPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="se-page-btn">
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map((page) => (
                <button key={page} onClick={() => goToPage(page)} className={`se-page-btn ${currentPage === page ? "se-page-btn-active" : ""}`}>
                  {page}
                </button>
              ))}
              <button onClick={goToNextPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="se-page-btn">
                <FaChevronRight size={12} />
              </button>
              <button onClick={goToLastPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="se-page-btn">
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="se-pagination-right">
              <span className="se-pagination-info">
                {totalFilteredItems > 0
                  ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                  : "No entries to show"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="se-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="se-modal se-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="se-modal-header">
              <span className="se-modal-title">Confirm Delete</span>
              <button className="se-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="se-modal-body">
              <p>Are you sure you want to delete this stock entry?</p>
              <p className="se-modal-item-name"><strong>{selectedItem.name}</strong> - {selectedItem.entryType}</p>
              <p className="se-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="se-modal-footer">
              <button className="se-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="se-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}