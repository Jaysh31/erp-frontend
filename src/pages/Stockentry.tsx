// Stockentry.tsx
import { useState, useEffect, type JSX } from "react";
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
  FaClipboardList,
  FaWarehouse,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaArrowRight,
  FaArrowLeft as FaArrowLeftIcon,
  FaExchangeAlt,
  FaIndustry,
  FaChartPie,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaDollarSign,
} from "react-icons/fa";
import "./Stockentry.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";
import { FaSpinner } from "react-icons/fa6";

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
  from_warehouse: string;
  to_warehouse: string;
  company: string;
  posting_date: string;
  work_order: string;
  supplier: string;
  total_amount: number;
  total_outgoing_value: number;
  total_incoming_value: number;
  total_additional_costs: number;
  remarks: string;
  created_by: string;
  status: string;
  docstatus: number;
  fg_completed_qty: number;
  purpose: string;
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
  workOrder: string;
  supplier: string;
  totalAmount: number;
  remarks: string;
  docstatus: number;
  status: string;
  qty: number;
  itemName: string;
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

const TYPE_ICONS: Record<EntryType, JSX.Element> = {
  Disassemble: <FaExchangeAlt />,
  Manufacture: <FaIndustry />,
  "Material Consumption for Manufacture": <FaBoxes />,
  "Material Issue": <FaArrowRight />,
  "Material Receipt": <FaArrowLeftIcon />,
  "Material Transfer": <FaTruck />,
  "Material Transfer for Manufacture": <FaTruck />,
  "Receive from Customer": <FaUser />,
  Repack: <FaBoxes />,
  "Send to Subcontractor": <FaBuilding />,
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
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
      return `${Math.floor(diffDays / 365)}y ago`;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const fetchStockEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      // Remove pagination params to get all data
      const response = await api.get<ApiResponse>(`/stock-entry`);

      if (response.data.success === 1 && response.data.data) {
        const { records, total, page, limit } = response.data.data;
        setTotalItems(total ?? 0);
        setTotalPages(Math.ceil((total ?? 0) / (limit || itemsPerPage)));
        setCurrentPage(page ?? 1);

        const transformedData: StockEntryDisplay[] = (records ?? []).map((item: StockEntry) => {
          // Extract item name from remarks or use default
          let itemName = "Unknown Item";
          let qty = item.fg_completed_qty || 0;
          
          // Try to extract item info from remarks
          if (item.remarks) {
            const match = item.remarks.match(/[–-]\s*([^-]+)$/);
            if (match) {
              itemName = match[1].trim();
            }
          }
          
          // If no item name found, use the entry type
          if (itemName === "Unknown Item" && item.stock_entry_type) {
            itemName = item.stock_entry_type;
          }

          return {
            id: item.id.toString(),
            name: item.name,
            entryType: item.stock_entry_type,
            sourceWarehouse: item.from_warehouse,
            targetWarehouse: item.to_warehouse,
            company: item.company,
            postingDate: item.posting_date,
            createdAgo: formatDate(item.posting_date),
            workOrder: item.work_order,
            supplier: item.supplier,
            totalAmount: item.total_amount || item.total_outgoing_value || 0,
            remarks: item.remarks,
            docstatus: item.docstatus,
            status: item.status || (item.docstatus === 1 ? "Submitted" : "Draft"),
            qty: qty,
            itemName: itemName,
          };
        });

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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const filteredData = stockEntries.filter((item) => {
    const matchesSearch =
      (item.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.itemName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sourceWarehouse ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.targetWarehouse ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.company ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.workOrder ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.remarks ?? "").toLowerCase().includes(searchTerm.toLowerCase());
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

  const getDocStatusLabel = (docstatus: number) => {
    if (docstatus === 0) return { label: "Draft", class: "status-draft" };
    if (docstatus === 1) return { label: "Submitted", class: "status-submitted" };
    if (docstatus === 2) return { label: "Cancelled", class: "status-cancelled" };
    return { label: "Unknown", class: "status-unknown" };
  };

  const getEntryTypeIcon = (type: EntryType) => {
    return TYPE_ICONS[type] || <FaBoxes />;
  };

  // ─── Card View ──────────────────────────────────────────────────────
  const renderCardView = () => (
    <div className="se-card-grid">
      {paginatedData.map((item) => (
        <div 
          key={item.id} 
          className="se-card"
          onClick={() => handleRowClick(item)}
        >
          <div className="se-card-header">
            <div className="se-card-type">
              <span className={`se-card-icon ${TYPE_CLASS[item.entryType]}`}>
                {getEntryTypeIcon(item.entryType)}
              </span>
              <span className="se-card-type-label">{item.entryType}</span>
            </div>
            <span className={`se-status-badge ${TYPE_CLASS[item.entryType]}`}>
              {item.entryType}
            </span>
          </div>
          
          <div className="se-card-body">
            <div className="se-card-item">
              <div className="se-card-item-name">{item.itemName}</div>
              <div className="se-card-item-qty">
                <span className="qty-label">Qty:</span>
                <span className="qty-value">{item.qty || 0}</span>
              </div>
            </div>
            
            <div className="se-card-warehouse-flow">
              <div className="se-card-warehouse">
                <FaWarehouse className="wh-icon" />
                <span>{item.sourceWarehouse || "—"}</span>
              </div>
              <FaArrowRight className="flow-arrow" />
              <div className="se-card-warehouse">
                <FaWarehouse className="wh-icon" />
                <span>{item.targetWarehouse || "—"}</span>
              </div>
            </div>
            
            <div className="se-card-meta">
              <div className="se-card-meta-item">
                <FaCalendarAlt className="meta-icon" />
                <span>{new Date(item.postingDate).toLocaleDateString("en-IN", { 
                  day: "2-digit", 
                  month: "short", 
                  year: "numeric" 
                })}</span>
              </div>
              <div className="se-card-meta-item">
                <FaDollarSign className="meta-icon" />
                <span className="amount">{formatCurrency(item.totalAmount)}</span>
              </div>
            </div>
          </div>
          
          <div className="se-card-footer">
            <div className="se-card-actions">
              <button 
                className="se-action-btn se-action-view" 
                onClick={(e) => { e.stopPropagation(); handleView(item); }} 
                title="View"
              >
                <FaEye size={12} />
              </button>
              <button 
                className="se-action-btn se-action-edit" 
                onClick={(e) => { e.stopPropagation(); handleEdit(item); }} 
                title="Edit"
              >
                <FaEdit size={12} />
              </button>
              <button 
                className="se-action-btn se-action-delete" 
                onClick={(e) => { e.stopPropagation(); handleDelete(item); }} 
                title="Delete"
              >
                <FaTrash size={12} />
              </button>
            </div>
            <span className="se-card-time">{item.createdAgo}</span>
          </div>
        </div>
      ))}
    </div>
  );

  // ─── Stats Summary ─────────────────────────────────────────────────
  const stats = {
    total: stockEntries.length,
    totalValue: stockEntries.reduce((sum, item) => sum + item.totalAmount, 0),
    manufacture: stockEntries.filter(item => item.entryType === "Manufacture").length,
    transfer: stockEntries.filter(item => item.entryType === "Material Transfer").length,
    receipt: stockEntries.filter(item => item.entryType === "Material Receipt").length,
    issue: stockEntries.filter(item => item.entryType === "Material Issue").length,
  };

  return (
    <div className={`se-page ${theme}`}>
      {/* ─── Stats Bar ─── */}
      <div className="se-stats-bar">
        <div className="se-stat-item">
          <div className="se-stat-icon blue">
            <FaBoxes />
          </div>
          <div className="se-stat-content">
            <span className="se-stat-value">{stats.total}</span>
            <span className="se-stat-label">Total Entries</span>
          </div>
        </div>
        <div className="se-stat-item">
          <div className="se-stat-icon green">
            <FaDollarSign />
          </div>
          <div className="se-stat-content">
            <span className="se-stat-value">{formatCurrency(stats.totalValue)}</span>
            <span className="se-stat-label">Total Value</span>
          </div>
        </div>
        <div className="se-stat-item">
          <div className="se-stat-icon purple">
            <FaIndustry />
          </div>
          <div className="se-stat-content">
            <span className="se-stat-value">{stats.manufacture}</span>
            <span className="se-stat-label">Manufacture</span>
          </div>
        </div>
        <div className="se-stat-item">
          <div className="se-stat-icon orange">
            <FaTruck />
          </div>
          <div className="se-stat-content">
            <span className="se-stat-value">{stats.transfer}</span>
            <span className="se-stat-label">Transfers</span>
          </div>
        </div>
        <div className="se-stat-item">
          <div className="se-stat-icon teal">
            <FaArrowLeftIcon />
          </div>
          <div className="se-stat-content">
            <span className="se-stat-value">{stats.receipt}</span>
            <span className="se-stat-label">Receipts</span>
          </div>
        </div>
        <div className="se-stat-item">
          <div className="se-stat-icon red">
            <FaArrowRight />
          </div>
          <div className="se-stat-content">
            <span className="se-stat-value">{stats.issue}</span>
            <span className="se-stat-label">Issues</span>
          </div>
        </div>
      </div>

      {/* ─── Search and Filter Bar ─── */}
      <div className="se-filter-bar">
        <div className="se-filter-left">
          <div className="se-search-wrapper">
            <FaSearch className="se-search-icon" />
            <input
              type="text"
              placeholder="Search by item, warehouse, WO, or supplier..."
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
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)} 
            className="se-filter-select"
          >
            <option value="all">All Types</option>
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div className="se-view-toggle">
            <button 
              className={`se-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <FaFileAlt size={14} />
            </button>
            <button 
              className={`se-view-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Card View"
            >
              <FaBoxes size={14} />
            </button>
          </div>

          <button className="se-btn-primary" onClick={() => navigate("/stock-entry/new")}>
            <FaPlus size={12} />
            Add Stock Entry
          </button>
        </div>
      </div>

      {/* ─── Active filters indicator ─── */}
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

      {/* ─── Loading State ─── */}
      {loading && (
        <div className="se-loading">
          <FaSpinner className="spinning" size={32} />
          <p>Loading stock entries...</p>
        </div>
      )}

      {/* ─── Error State ─── */}
      {error && (
        <div className="se-error">
          <FaExclamationCircle size={32} />
          <p>{error}</p>
          <button onClick={fetchStockEntries} className="se-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* ─── Content ─── */}
      {!loading && !error && (
        <>
          {viewMode === "cards" ? (
            renderCardView()
          ) : (
            <div className="se-table-wrap">
              <table className="se-table">
                <thead>
                  <tr>
                    <th className="se-th-check">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} className="se-checkbox" />
                    </th>
                    <th className="se-th">Item / Product</th>
                    <th className="se-th">Type</th>
                    <th className="se-th">Source → Target</th>
                    <th className="se-th">Qty</th>
                    <th className="se-th">Amount</th>
                    <th className="se-th">Posting Date</th>
                    <th className="se-th se-th-meta">Actions</th>
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
                        <td className="se-td se-td-item">
                          <div className="se-item-info">
                            <span className="se-item-name">{row.itemName}</span>
                            <span className="se-item-code">{row.name}</span>
                          </div>
                        </td>
                        <td className="se-td">
                          <span className={`se-status-badge ${TYPE_CLASS[row.entryType]}`}>
                            {getEntryTypeIcon(row.entryType)}
                            {row.entryType}
                          </span>
                        </td>
                        <td className="se-td se-td-warehouses">
                          <div className="se-warehouse-flow">
                            <span className="se-warehouse-label">{row.sourceWarehouse || "—"}</span>
                            <FaArrowRight className="flow-arrow-sm" />
                            <span className="se-warehouse-label">{row.targetWarehouse || "—"}</span>
                          </div>
                        </td>
                        <td className="se-td se-td-qty">
                          <span className="se-qty">{row.qty || 0}</span>
                        </td>
                        <td className="se-td se-td-amount">
                          <span className="se-amount">{formatCurrency(row.totalAmount)}</span>
                        </td>
                        <td className="se-td se-td-dates">
                          <div className="se-date-info">
                            <FaCalendarAlt size={10} className="se-date-icon" />
                            {row.postingDate
                              ? new Date(row.postingDate).toLocaleDateString("en-IN", { 
                                  day: "2-digit", 
                                  month: "short", 
                                  year: "numeric" 
                                })
                              : "—"}
                            <span className="se-ago-badge">{row.createdAgo}</span>
                          </div>
                        </td>
                        <td className="se-td se-td-meta" onClick={(e) => e.stopPropagation()}>
                          <div className="se-action-buttons">
                            <button className="se-action-btn se-action-view" onClick={() => handleView(row)} title="View">
                              <FaEye size={12} />
                            </button>
                            <button className="se-action-btn se-action-edit" onClick={() => handleEdit(row)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="se-action-btn se-action-delete" onClick={() => handleDelete(row)} title="Delete">
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
          )}

          {/* ─── Pagination ─── */}
          {totalFilteredItems > 0 && (
            <div className="se-pagination">
              <div className="se-pagination-left">
                <span className="se-pagination-label">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))} 
                  className="se-page-size-select"
                >
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
                {getPageNumbers().map((page) => (
                  <button 
                    key={page} 
                    onClick={() => goToPage(page)} 
                    className={`se-page-btn ${currentPage === page ? "se-page-btn-active" : ""}`}
                  >
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
          )}
        </>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
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
              <div className="se-modal-item-details">
                <p><strong>Entry:</strong> {selectedItem.name}</p>
                <p><strong>Item:</strong> {selectedItem.itemName}</p>
                <p><strong>Type:</strong> {selectedItem.entryType}</p>
                <p><strong>Qty:</strong> {selectedItem.qty}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem.totalAmount)}</p>
              </div>
              <p className="se-modal-warning">⚠️ This action cannot be undone.</p>
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