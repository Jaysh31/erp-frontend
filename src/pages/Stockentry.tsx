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
  FaClipboardList,
  FaWarehouse,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaChartPie,
  FaLayerGroup,
  FaList,
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

type ViewMode = "list" | "category";

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

interface CategoryGroup {
  name: string;
  icon: React.ReactNode;
  count: number;
  totalAmount: number;
  entries: StockEntryDisplay[];
  warehouses: string[];
  suppliers: string[];
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

// ─── Category Definitions ──────────────────────────────────────────────

const CATEGORY_DEFINITIONS = [
  {
    name: "Raw Materials",
    keywords: ["raw", "material", "store", "raw material", "inventory"],
    icon: <FaBoxes size={16} />,
    color: "#4f46e5",
  },
  {
    name: "Work In Progress",
    keywords: ["wip", "work in progress", "production", "manufacturing", "assembly"],
    icon: <FaClipboardList size={16} />,
    color: "#f59e0b",
  },
  {
    name: "Finished Goods",
    keywords: ["finished", "fg", "finished goods", "completed", "ready"],
    icon: <FaWarehouse size={16} />,
    color: "#10b981",
  },
  {
    name: "Supplies & Consumables",
    keywords: ["supply", "consumable", "packaging", "tool", "maintenance"],
    icon: <FaBuilding size={16} />,
    color: "#8b5cf6",
  },
  {
    name: "Electronics & Components",
    keywords: ["electronic", "component", "pcb", "circuit", "wire", "connector"],
    icon: <FaChartPie size={16} />,
    color: "#ec4899",
  },
  {
    name: "Chemicals & Paint",
    keywords: ["chemical", "paint", "solvent", "thinner", "coating", "oil"],
    icon: <FaFileAlt size={16} />,
    color: "#14b8a6",
  },
  {
    name: "Metal & Hardware",
    keywords: ["metal", "steel", "aluminum", "iron", "bolt", "nut", "screw", "hardware"],
    icon: <FaBuilding size={16} />,
    color: "#6b7280",
  },
  {
    name: "Other",
    keywords: [],
    icon: <FaLayerGroup size={16} />,
    color: "#9ca3af",
  },
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockEntryDisplay | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  // ─── Categorization Function ──────────────────────────────────────────

  const categorizeEntry = (entry: StockEntryDisplay): string => {
    const searchText = [
      entry.entryType,
      entry.sourceWarehouse,
      entry.targetWarehouse,
      entry.remarks,
      entry.workOrder,
      entry.supplier,
    ].join(" ").toLowerCase();

    for (const category of CATEGORY_DEFINITIONS) {
      for (const keyword of category.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return category.name;
        }
      }
    }
    return "Other";
  };

  // ─── Group Entries by Category ────────────────────────────────────────

  const getCategoryGroups = (entries: StockEntryDisplay[]): CategoryGroup[] => {
    const groups: Record<string, CategoryGroup> = {};

    entries.forEach(entry => {
      const categoryName = categorizeEntry(entry);
      
      if (!groups[categoryName]) {
        const def = CATEGORY_DEFINITIONS.find(d => d.name === categoryName);
        groups[categoryName] = {
          name: categoryName,
          icon: def?.icon || <FaLayerGroup size={16} />,
          count: 0,
          totalAmount: 0,
          entries: [],
          warehouses: [],
          suppliers: [],
        };
      }
      
      groups[categoryName].count++;
      groups[categoryName].totalAmount += entry.totalAmount;
      groups[categoryName].entries.push(entry);
      
      if (entry.sourceWarehouse) {
        groups[categoryName].warehouses.push(entry.sourceWarehouse);
      }
      if (entry.targetWarehouse) {
        groups[categoryName].warehouses.push(entry.targetWarehouse);
      }
      if (entry.supplier) {
        groups[categoryName].suppliers.push(entry.supplier);
      }
    });

    // Remove duplicates from warehouses and suppliers
    Object.keys(groups).forEach(key => {
      groups[key].warehouses = [...new Set(groups[key].warehouses)];
      groups[key].suppliers = [...new Set(groups[key].suppliers)];
    });

    // Sort categories by count (most items first)
    return Object.values(groups).sort((a, b) => b.count - a.count);
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
  }, [searchTerm, typeFilter, categoryFilter]);

  const filteredData = stockEntries.filter((item) => {
    const matchesSearch =
      (item.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sourceWarehouse ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.targetWarehouse ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.company ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.workOrder ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.remarks ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || item.entryType === typeFilter;
    
    let matchesCategory = true;
    if (categoryFilter !== "all") {
      const itemCategory = categorizeEntry(item);
      matchesCategory = itemCategory === categoryFilter;
    }
    
    return matchesSearch && matchesType && matchesCategory;
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

  // Get category groups for category view
  const categoryGroups = getCategoryGroups(filteredData);

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
    setCategoryFilter("all");
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

  const toggleCategory = (categoryName: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(categoryName)) {
      newSet.delete(categoryName);
    } else {
      newSet.add(categoryName);
    }
    setExpandedCategories(newSet);
  };

  // ─── Category View Render ─────────────────────────────────────────────

  const renderCategoryView = () => {
    return (
      <div className="se-category-view">
        {categoryGroups.map((group) => {
          const isExpanded = expandedCategories.has(group.name);
          const def = CATEGORY_DEFINITIONS.find(d => d.name === group.name);
          const color = def?.color || "#9ca3af";

          return (
            <div key={group.name} className="se-category-group">
              <div 
                className="se-category-header"
                onClick={() => toggleCategory(group.name)}
                style={{ borderLeftColor: color }}
              >
                <div className="se-category-header-left">
                  <span className="se-category-icon" style={{ color }}>
                    {group.icon}
                  </span>
                  <span className="se-category-name">{group.name}</span>
                  <span className="se-category-badge">{group.count} entries</span>
                </div>
                <div className="se-category-header-right">
                  <span className="se-category-amount">₹{group.totalAmount.toFixed(2)}</span>
                  <span className="se-category-toggle">{isExpanded ? "▼" : "▶"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="se-category-content">
                  <div className="se-category-meta">
                    <div className="se-category-meta-item">
                      <FaWarehouse size={12} />
                      <span>Warehouses: {group.warehouses.join(", ") || "N/A"}</span>
                    </div>
                    <div className="se-category-meta-item">
                      <FaUser size={12} />
                      <span>Suppliers: {group.suppliers.join(", ") || "N/A"}</span>
                    </div>
                  </div>

                  <div className="se-category-entries">
                    <table className="se-table se-table-category">
                      <thead>
                        <tr>
                          <th>Entry #</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Source → Target</th>
                          <th>Work Order</th>
                          <th>Supplier</th>
                          <th>Amount</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.entries.map((entry) => (
                          <tr key={entry.id} className="se-category-entry-row">
                            <td className="se-td-id">
                              <span className="se-entry-id">{entry.name}</span>
                            </td>
                            <td>
                              <span className={`se-status-badge ${TYPE_CLASS[entry.entryType]}`}>
                                {entry.entryType}
                              </span>
                            </td>
                            <td>
                              <span className={`se-doc-status ${getDocStatusLabel(entry.docstatus).class}`}>
                                {getDocStatusLabel(entry.docstatus).label}
                              </span>
                            </td>
                            <td>
                              <div className="se-warehouse-flow">
                                <span className="se-warehouse-label">{entry.sourceWarehouse || "—"}</span>
                                <span className="se-warehouse-arrow">→</span>
                                <span className="se-warehouse-label">{entry.targetWarehouse || "—"}</span>
                              </div>
                            </td>
                            <td>
                              {entry.workOrder && entry.workOrder !== "WO-00001" ? (
                                <span className="se-work-order-link">
                                  <FaClipboardList size={10} />
                                  {entry.workOrder}
                                </span>
                              ) : (
                                <span className="se-muted">—</span>
                              )}
                            </td>
                            <td>
                              {entry.supplier ? (
                                <span className="se-supplier">
                                  <FaUser size={10} />
                                  {entry.supplier}
                                </span>
                              ) : (
                                <span className="se-muted">—</span>
                              )}
                            </td>
                            <td>
                              <span className="se-amount">
                                ₹{entry.totalAmount.toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <div className="se-action-buttons" onClick={(e) => e.stopPropagation()}>
                                <button className="se-action-btn se-action-view" onClick={() => handleView(entry)} title="View">
                                  <FaEye size={12} />
                                </button>
                                <button className="se-action-btn se-action-edit" onClick={() => handleEdit(entry)} title="Edit">
                                  <FaEdit size={12} />
                                </button>
                                <button className="se-action-btn se-action-delete" onClick={() => handleDelete(entry)} title="Delete">
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
              placeholder="Search by entry #, warehouse, WO, supplier, or remarks..."
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
          
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="se-filter-select">
            <option value="all">All Categories</option>
            {CATEGORY_DEFINITIONS.map((cat) => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <div className="se-view-toggle">
            <button 
              className={`se-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <FaList size={14} />
            </button>
            <button 
              className={`se-view-btn ${viewMode === "category" ? "active" : ""}`}
              onClick={() => setViewMode("category")}
              title="Category View"
            >
              <FaLayerGroup size={14} />
            </button>
          </div>

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
      {(searchTerm || typeFilter !== "all" || categoryFilter !== "all") && (
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
          {categoryFilter !== "all" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Category:</strong> {categoryFilter}
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

      {/* Table / Category View */}
      {!loading && !error && (
        <>
          {viewMode === "category" ? (
            renderCategoryView()
          ) : (
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
                      <th className="se-th">Status</th>
                      <th className="se-th">Source → Target</th>
                      <th className="se-th">Work Order</th>
                      <th className="se-th">Supplier</th>
                      <th className="se-th">Total Amount</th>
                      <th className="se-th">Posting Date</th>
                      <th className="se-th se-th-meta">
                        <span className="se-count-label">{totalFilteredItems} of {totalItems}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="se-empty-state">
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
                          <td className="se-td se-td-id">
                            <span className="se-entry-id">{row.name}</span>
                          </td>
                          <td className="se-td">
                            <span className={`se-status-badge ${TYPE_CLASS[row.entryType]}`}>
                              {row.entryType}
                            </span>
                          </td>
                          <td className="se-td">
                            <span className={`se-doc-status ${getDocStatusLabel(row.docstatus).class}`}>
                              {getDocStatusLabel(row.docstatus).label}
                            </span>
                          </td>
                          <td className="se-td se-td-warehouses">
                            <div className="se-warehouse-flow">
                              <span className="se-warehouse-label">{row.sourceWarehouse || "—"}</span>
                              <span className="se-warehouse-arrow">→</span>
                              <span className="se-warehouse-label">{row.targetWarehouse || "—"}</span>
                            </div>
                          </td>
                          <td className="se-td se-td-work-order">
                            {row.workOrder && row.workOrder !== "WO-00001" ? (
                              <span className="se-work-order-link">
                                <FaClipboardList size={10} />
                                {row.workOrder}
                              </span>
                            ) : (
                              <span className="se-muted">—</span>
                            )}
                          </td>
                          <td className="se-td se-td-supplier">
                            {row.supplier ? (
                              <span className="se-supplier">
                                <FaUser size={10} />
                                {row.supplier}
                              </span>
                            ) : (
                              <span className="se-muted">—</span>
                            )}
                          </td>
                          <td className="se-td se-td-amount">
                            <span className="se-amount">
                              ₹{row.totalAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="se-td se-td-dates">
                            <div className="se-date-info">
                              <FaCalendarAlt size={10} className="se-date-icon" />
                              {row.postingDate
                                ? new Date(row.postingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
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

              {/* Summary Stats */}
              <div className="se-stats-bar">
                <div className="se-stats-item">
                  <span className="se-stats-label">Total Entries:</span>
                  <span className="se-stats-value">{totalItems}</span>
                </div>
                <div className="se-stats-item">
                  <span className="se-stats-label">Filtered:</span>
                  <span className="se-stats-value">{totalFilteredItems}</span>
                </div>
                <div className="se-stats-item">
                  <span className="se-stats-label">Total Amount:</span>
                  <span className="se-stats-value">₹{stockEntries.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}</span>
                </div>
                <div className="se-stats-item">
                  <span className="se-stats-label">Unique Suppliers:</span>
                  <span className="se-stats-value">{new Set(stockEntries.map(item => item.supplier).filter(Boolean)).size}</span>
                </div>
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
              <div className="se-modal-item-details">
                <p><strong>Entry:</strong> {selectedItem.name}</p>
                <p><strong>Type:</strong> {selectedItem.entryType}</p>
                <p><strong>Work Order:</strong> {selectedItem.workOrder || "—"}</p>
                <p><strong>Supplier:</strong> {selectedItem.supplier || "—"}</p>
                <p><strong>Amount:</strong> ₹{selectedItem.totalAmount.toFixed(2)}</p>
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