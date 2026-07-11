// InventoryList.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaBoxes,
  FaWarehouse,
  FaClipboardList,
  FaDollarSign,
  FaList,
  FaArrowUp,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import "./InventoryList.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../services/api";

// ─── Types ───────────────────────────────────────────────────────────────

interface InventoryItem {
  id: number;
  name: string;
  item_code: string;
  warehouse_Id: number;
  warehouse_name?: string;
  actual_qty: number;
  planned_qty: number;
  indented_qty: number;
  ordered_qty: number;
  reserved_qty: number;
  reserved_qty_for_production: number;
  reserved_qty_for_sub_contract: number;
  reserved_qty_for_production_plan: number;
  projected_qty: number;
  reserved_stock: number;
  stock_uom: string;
  company: string;
  valuation_rate: number;
  stock_value: number;
  creation: string;
}

interface Warehouse {
  id: number;
  warehouse_name: string;
  company: string;
  parent_warehouse: string | null;
  warehouse_type: string | null;
  city: string | null;
  state: string | null;
  email_id: string | null;
  phone_no: string | null;
  disabled: number;
  itemCount?: number;
  totalValue?: number;
  lowStockItems?: number;
}

interface InventoryDisplay {
  id: string;
  itemCode: string;
  itemName: string;
  warehouse: string;
  warehouseId: number;
  actualQty: number;
  plannedQty: number;
  orderedQty: number;
  reservedQty: number;
  projectedQty: number;
  uom: string;
  valuationRate: number;
  stockValue: number;
  status: InventoryStatus;
  lastUpdated: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: InventoryItem[];
  };
}

interface WarehouseApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Warehouse[];
  };
}

type ViewMode = "warehouse" | "item" | "details";
type InventoryStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock"
  | "Over Stock";

type StockStatus = "All" | InventoryStatus;
export default function InventoryList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [inventoryItems, setInventoryItems] = useState<InventoryDisplay[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StockStatus>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("warehouse");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedItem, setSelectedItem] = useState<InventoryDisplay | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<InventoryDisplay | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalWarehouses: 0,
  });

  // ─── Fetch Warehouses ──────────────────────────────────────────────
  const fetchWarehouses = async () => {
    try {
      const response = await api.get<WarehouseApiResponse>("/warehouse");
      if (response.data.success === 1) {
        const records = response.data.data?.records || [];
        setWarehouses(records);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  // ─── Fetch Inventory ──────────────────────────────────────────────
  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>("/inventory");
      if (response.data.success === 1) {
        const records = response.data.data?.records || [];
        
        // Map warehouse names to inventory items
        const warehouseMap = new Map<number, string>();
        warehouses.forEach(wh => warehouseMap.set(wh.id, wh.warehouse_name));

        const transformedData: InventoryDisplay[] = records.map((item) => {
            const warehouseName =
              warehouseMap.get(item.warehouse_Id) || "Unknown";
          
            const status = getStockStatus(
              item.actual_qty || 0,
              item.projected_qty || 0
            );
          
            return {
              id: item.id.toString(),
              itemCode: item.item_code,
              itemName: item.item_code,
              warehouse: warehouseName,
              warehouseId: item.warehouse_Id,
              actualQty: item.actual_qty || 0,
              plannedQty: item.planned_qty || 0,
              orderedQty: item.ordered_qty || 0,
              reservedQty: item.reserved_qty || 0,
              projectedQty: item.projected_qty || 0,
              uom: item.stock_uom || "Nos",
              valuationRate: item.valuation_rate || 0,
              stockValue: item.stock_value || 0,
              status,
              lastUpdated: item.creation || new Date().toISOString(),
            };
          });

        setInventoryItems(transformedData);
        updateStats(transformedData);
      } else {
        setError("Failed to fetch inventory data");
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError("An error occurred while fetching inventory");
    } finally {
      setLoading(false);
    }
  };
  const getStockStatus = (
    actualQty: number,
    _projectedQty: number
  ): InventoryStatus => {
    if (actualQty <= 0) return "Out of Stock";
    if (actualQty < 10) return "Low Stock";
    if (actualQty > 1000) return "Over Stock";
    return "In Stock";
  };

  // ─── Update Stats ─────────────────────────────────────────────────
  const updateStats = (items: InventoryDisplay[]) => {
    const totalValue = items.reduce((sum, item) => sum + item.stockValue, 0);
    const lowStock = items.filter(item => item.status === "Low Stock").length;
    const outOfStock = items.filter(item => item.status === "Out of Stock").length;
    const totalWarehouses = new Set(items.map(item => item.warehouseId)).size;

    setStats({
      totalItems: items.length,
      totalValue,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
      totalWarehouses,
    });
  };

  // ─── Load Data ────────────────────────────────────────────────────
  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (warehouses.length > 0) {
      fetchInventory();
    }
  }, [warehouses]);

  // ─── Filter Items ─────────────────────────────────────────────────
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = selectedWarehouse === "all" || item.warehouseId === selectedWarehouse;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  // ─── Pagination ──────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ─── Group by Warehouse ──────────────────────────────────────────
  const warehouseGroups = warehouses.map(wh => {
    const items = inventoryItems.filter(item => item.warehouseId === wh.id);
    const totalQty = items.reduce((sum, item) => sum + item.actualQty, 0);
    const totalValue = items.reduce((sum, item) => sum + item.stockValue, 0);
    const itemCount = items.length;
    const lowStock = items.filter(item => item.status === "Low Stock").length;
    
    return {
      ...wh,
      items,
      totalQty,
      totalValue,
      itemCount,
      lowStock,
    };
  }).filter(wh => wh.itemCount > 0);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleViewItem = (item: InventoryDisplay) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  const handleDeleteClick = (item: InventoryDisplay) => {
    setSelectedItemForDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedItemForDelete) {
      try {
        await api.delete(`/inventory/${selectedItemForDelete.id}`);
        setShowDeleteConfirm(false);
        setSelectedItemForDelete(null);
        fetchInventory();
      } catch (err) {
        console.error("Error deleting inventory item:", err);
        alert("Failed to delete inventory item");
      }
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // const getStatusColor = (status: StockStatus) => {
  //   switch (status) {
  //     case "In Stock": return "#10b981";
  //     case "Low Stock": return "#f59e0b";
  //     case "Out of Stock": return "#ef4444";
  //     case "Over Stock": return "#3b82f6";
  //     default: return "#6b7280";
  //   }
  // };

  const getStatusIcon = (status: StockStatus) => {
    switch (status) {
      case "In Stock": return <FaCheckCircle style={{ color: "#10b981" }} />;
      case "Low Stock": return <FaExclamationTriangle style={{ color: "#f59e0b" }} />;
      case "Out of Stock": return <FaTimes style={{ color: "#ef4444" }} />;
      case "Over Stock": return <FaArrowUp style={{ color: "#3b82f6" }} />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  // ─── Render Functions ────────────────────────────────────────────

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
    <div className={`inv-stat-card ${color}`}>
      <div className="inv-stat-icon">{icon}</div>
      <div className="inv-stat-content">
        <div className="inv-stat-value">{value}</div>
        <div className="inv-stat-label">{label}</div>
      </div>
    </div>
  );

  const renderWarehouseView = () => (
    <div className="inv-warehouse-grid">
      {warehouseGroups.map((wh) => (
        <div key={wh.id} className="inv-warehouse-card">
          <div className="inv-wh-header">
            <div className="inv-wh-header-left">
              <FaWarehouse className="inv-wh-icon" />
              <span className="inv-wh-name">{wh.warehouse_name}</span>
            </div>
            <div className="inv-wh-header-right">
              <span className="inv-wh-status active">Active</span>
            </div>
          </div>
          
          <div className="inv-wh-stats">
            <div className="inv-wh-stat">
              <span className="inv-wh-stat-label">Items</span>
              <span className="inv-wh-stat-value">{wh.itemCount}</span>
            </div>
            <div className="inv-wh-stat">
              <span className="inv-wh-stat-label">Total Qty</span>
              <span className="inv-wh-stat-value">{wh.totalQty.toLocaleString()}</span>
            </div>
            <div className="inv-wh-stat">
              <span className="inv-wh-stat-label">Value</span>
              <span className="inv-wh-stat-value">₹{wh.totalValue.toLocaleString()}</span>
            </div>
            <div className="inv-wh-stat">
              <span className="inv-wh-stat-label">Low Stock</span>
              <span className="inv-wh-stat-value" style={{ color: wh.lowStock > 0 ? "#f59e0b" : "#10b981" }}>
                {wh.lowStock}
              </span>
            </div>
          </div>

          <div className="inv-wh-items-preview">
            <div className="inv-wh-items-header">
              <span>Recent Items</span>
              <button 
                className="inv-wh-view-all"
                onClick={() => {
                  setSelectedWarehouse(wh.id);
                  setViewMode("item");
                }}
              >
                View All
              </button>
            </div>
            <div className="inv-wh-items-list">
              {wh.items.slice(0, 5).map((item) => (
                <div key={item.id} className="inv-wh-item">
                  <span className="inv-wh-item-code">{item.itemCode}</span>
                  <span className="inv-wh-item-qty">{item.actualQty} {item.uom}</span>
                  <span className={`inv-wh-item-status ${item.status.toLowerCase().replace(" ", "-")}`}>
                    {item.status}
                  </span>
                </div>
              ))}
              {wh.items.length > 5 && (
                <div className="inv-wh-item-more">
                  +{wh.items.length - 5} more items
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderItemView = () => (
    <>
      {/* Warehouse Filter */}
      <div className="inv-warehouse-filter">
        <label className="inv-filter-label">Filter by Warehouse:</label>
        <select
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="inv-filter-select"
        >
          <option value="all">All Warehouses</option>
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>{wh.warehouse_name}</option>
          ))}
        </select>
        <button 
          className="inv-filter-back"
          onClick={() => {
            setSelectedWarehouse("all");
            setViewMode("warehouse");
          }}
        >
          ← Back to Warehouses
        </button>
      </div>

      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th className="inv-th">Item Code</th>
              <th className="inv-th">Warehouse</th>
              <th className="inv-th">Actual Qty</th>
              <th className="inv-th">Projected</th>
              <th className="inv-th">Reserved</th>
              <th className="inv-th">Status</th>
              <th className="inv-th">Value</th>
              <th className="inv-th inv-th-meta">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="inv-empty-state">
                  <div className="inv-empty-content">
                    <FaBoxes size={48} />
                    <p>No inventory items found</p>
                    <span>Try adjusting your search criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} className="inv-tr">
                  <td className="inv-td inv-td-code">{item.itemCode}</td>
                  <td className="inv-td">{item.warehouse}</td>
                  <td className="inv-td inv-td-number">
                    <span className="inv-qty">{item.actualQty}</span>
                    <span className="inv-uom">{item.uom}</span>
                  </td>
                  <td className="inv-td inv-td-number">{item.projectedQty}</td>
                  <td className="inv-td inv-td-number">{item.reservedQty}</td>
                  <td className="inv-td">
                    <span className={`inv-status-badge ${item.status.toLowerCase().replace(" ", "-")}`}>
                      {getStatusIcon(item.status)} {item.status}
                    </span>
                  </td>
                  <td className="inv-td inv-td-amount">₹{item.stockValue.toLocaleString()}</td>
                  <td className="inv-td inv-td-meta">
                    <span className="inv-ago">{formatDate(item.lastUpdated)}</span>
                    <span className="inv-dot">·</span>
                    <div className="inv-action-buttons">
                      <button 
                        className="inv-action-btn inv-action-view" 
                        onClick={() => handleViewItem(item)}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button 
                        className="inv-action-btn inv-action-edit" 
                        onClick={() => navigate(`/inventory/edit/${item.id}`)}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        className="inv-action-btn inv-action-delete" 
                        onClick={() => handleDeleteClick(item)}
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
      {filteredItems.length > 0 && (
        <div className="inv-pagination">
          <div className="inv-pagination-left">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
            </span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="inv-page-size-select"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
          <div className="inv-pagination-center">
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="inv-page-btn">
              <FaAngleDoubleLeft size={12} />
            </button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="inv-page-btn">
              <FaChevronLeft size={12} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage;
              if (totalPages > 5) {
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
              } else {
                pageNum = i + 1;
              }
              return (
                <button
                  key={pageNum}
                  className={`inv-page-btn ${currentPage === pageNum ? "active" : ""}`}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="inv-page-btn">
              <FaChevronRight size={12} />
            </button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="inv-page-btn">
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="inv-pagination-right">
            <span>Page {currentPage} of {totalPages || 1}</span>
          </div>
        </div>
      )}
    </>
  );

  // ─── Main Render ──────────────────────────────────────────────────

  return (
    <div className={`inv-page ${theme}`}>
      <div className="inv-container">

        {/* ─── Header ─── */}
        <div className="inv-header">
          <div className="inv-header-left">
            <h1><FaClipboardList className="inv-header-icon" /> Inventory Management</h1>
            <span className="inv-subtitle">Track stock across all warehouses</span>
          </div>
          <div className="inv-header-right">
            <button className="inv-btn-primary" onClick={() => navigate("/inventory/new")}>
              <FaPlus /> Add Item
            </button>
          </div>
        </div>

        {/* ─── Stats Cards ─── */}
        <div className="inv-stats-grid">
          {renderStatCard(<FaBoxes />, "Total Items", stats.totalItems, "blue")}
          {renderStatCard(<FaDollarSign />, "Total Value", `₹${stats.totalValue.toLocaleString()}`, "green")}
          {renderStatCard(<FaExclamationTriangle />, "Low Stock", stats.lowStockItems, "yellow")}
          {renderStatCard(<FaTimes />, "Out of Stock", stats.outOfStockItems, "red")}
          {renderStatCard(<FaWarehouse />, "Warehouses", stats.totalWarehouses, "purple")}
        </div>

        {/* ─── Filters ─── */}
        <div className="inv-filters">
          <div className="inv-filters-left">
            <div className="inv-search-wrapper">
              <FaSearch className="inv-search-icon" />
              <input
                type="text"
                placeholder="Search by item code, warehouse, or UOM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="inv-search-input"
              />
              {searchTerm && (
                <button className="inv-search-clear" onClick={() => setSearchTerm("")}>
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="inv-filters-right">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as StockStatus)}
              className="inv-filter-select"
            >
              <option value="All">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Over Stock">Over Stock</option>
            </select>
            <div className="inv-view-toggle">
              <button 
                className={`inv-view-btn ${viewMode === "warehouse" ? "active" : ""}`}
                onClick={() => { setViewMode("warehouse"); setSelectedWarehouse("all"); }}
                title="Warehouse View"
              >
                <FaWarehouse size={14} />
              </button>
              <button 
                className={`inv-view-btn ${viewMode === "item" ? "active" : ""}`}
                onClick={() => setViewMode("item")}
                title="Item List View"
              >
                <FaList size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Loading State ─── */}
        {loading && (
          <div className="inv-loading">
            <p>Loading inventory data...</p>
          </div>
        )}

        {/* ─── Error State ─── */}
        {error && (
          <div className="inv-error">
            <p>{error}</p>
            <button onClick={fetchInventory} className="inv-retry-btn">Retry</button>
          </div>
        )}

        {/* ─── Content ─── */}
        {!loading && !error && (
          <div className="inv-content">
            {viewMode === "warehouse" ? renderWarehouseView() : renderItemView()}
          </div>
        )}

        {/* ─── Item Details Modal ─── */}
        {showItemDetails && selectedItem && (
          <div className="inv-modal-overlay" onClick={() => setShowItemDetails(false)}>
            <div className="inv-modal inv-item-detail" onClick={(e) => e.stopPropagation()}>
              <div className="inv-modal-header">
                <h2>{selectedItem.itemCode}</h2>
                <button className="inv-modal-close" onClick={() => setShowItemDetails(false)}>
                  <FaTimes size={16} />
                </button>
              </div>
              <div className="inv-modal-body">
                <div className="inv-detail-grid">
                  <div className="inv-detail-item">
                    <label>Item Code</label>
                    <span>{selectedItem.itemCode}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Warehouse</label>
                    <span>{selectedItem.warehouse}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Status</label>
                    <span className={`inv-status-badge ${selectedItem.status.toLowerCase().replace(" ", "-")}`}>
                      {selectedItem.status}
                    </span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Actual Quantity</label>
                    <span>{selectedItem.actualQty} {selectedItem.uom}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Projected Quantity</label>
                    <span>{selectedItem.projectedQty} {selectedItem.uom}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Reserved Quantity</label>
                    <span>{selectedItem.reservedQty} {selectedItem.uom}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Valuation Rate</label>
                    <span>₹{selectedItem.valuationRate.toFixed(2)}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Stock Value</label>
                    <span>₹{selectedItem.stockValue.toLocaleString()}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Last Updated</label>
                    <span>{formatDate(selectedItem.lastUpdated)}</span>
                  </div>
                </div>
              </div>
              <div className="inv-modal-footer">
                <button className="inv-btn-secondary" onClick={() => setShowItemDetails(false)}>Close</button>
                <button className="inv-btn-primary" onClick={() => navigate(`/inventory/edit/${selectedItem.id}`)}>
                  <FaEdit size={12} /> Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Delete Confirmation Modal ─── */}
        {showDeleteConfirm && selectedItemForDelete && (
          <div className="inv-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="inv-modal inv-modal-delete" onClick={(e) => e.stopPropagation()}>
              <div className="inv-modal-header">
                <span className="inv-modal-title">Confirm Delete</span>
                <button className="inv-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                  <FaTimes size={16} />
                </button>
              </div>
              <div className="inv-modal-body">
                <p>Are you sure you want to delete this inventory item?</p>
                <p className="inv-modal-item-name">
                  <strong>{selectedItemForDelete.itemCode}</strong> - {selectedItemForDelete.warehouse}
                </p>
                <p className="inv-modal-warning">This action cannot be undone.</p>
              </div>
              <div className="inv-modal-footer">
                <button className="inv-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button className="inv-btn-danger" onClick={confirmDelete}>
                  <FaTrash size={12} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}