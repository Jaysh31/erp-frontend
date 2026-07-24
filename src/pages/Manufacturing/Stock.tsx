// Stock.tsx
import { useState, useEffect, } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaPlus,
  FaTimes,
  FaBoxes,
  FaWarehouse,
  FaArrowUp,
  FaArrowDown,
  FaHistory,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaPrint,
  FaEye,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSortUp,
  FaSortDown,
  FaCircle,
  FaTruck,
  
  FaUser,
  FaFileAlt,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import "./Stock.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
// import api from "../services/api";
import { FaMapPin } from "react-icons/fa6";

// ─── Types ───────────────────────────────────────────────────────────────

interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  warehouse: string;
  location: string;
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Over Stock";
  lastUpdated: string;
  value: number;
  reorderLevel: number;
  supplier: string;
  batchNo?: string;
  expiryDate?: string;
  image?: string;
}

interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: "In" | "Out" | "Transfer" | "Adjustment";
  quantity: number;
  previousQty: number;
  newQty: number;
  date: string;
  user: string;
  reference: string;
  notes: string;
  warehouse: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  capacity: number;
  usedCapacity: number;
  status: "Active" | "Inactive" | "Maintenance";
}

interface StockSummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalWarehouses: number;
  recentActivity: number;
}

type ViewMode = "grid" | "list";
type StockStatus = "All" | "In Stock" | "Low Stock" | "Out of Stock" | "Over Stock";

// ─── Mock Data ──────────────────────────────────────────────────────────

const mockWarehouses: Warehouse[] = [
  { id: "WH-001", name: "Main Store - Raw Materials", location: "Building A, Floor 1", manager: "Rahul Sharma", capacity: 10000, usedCapacity: 7200, status: "Active" },
  { id: "WH-002", name: "WIP Warehouse", location: "Building B, Floor 2", manager: "Priya Patel", capacity: 5000, usedCapacity: 3200, status: "Active" },
  { id: "WH-003", name: "Finished Goods Store", location: "Building C, Floor 1", manager: "Amit Kumar", capacity: 8000, usedCapacity: 4500, status: "Active" },
  { id: "WH-004", name: "Chemical Store", location: "Building D, Ground Floor", manager: "Sneha Reddy", capacity: 2000, usedCapacity: 1200, status: "Maintenance" },
];

const mockStockItems: StockItem[] = [
  { id: "1", itemCode: "RM-001", itemName: "Stainless Steel Sheet 2mm", category: "Raw Material", quantity: 450, minQuantity: 50, maxQuantity: 1000, unit: "Kg", warehouse: "Main Store - Raw Materials", location: "Aisle 1 - Rack 3", status: "In Stock", lastUpdated: "2026-07-07T10:30:00Z", value: 45000, reorderLevel: 100, supplier: "ABC Steel Suppliers" },
  { id: "2", itemCode: "RM-002", itemName: "Aluminum Bars 40mm", category: "Raw Material", quantity: 30, minQuantity: 100, maxQuantity: 500, unit: "Kg", warehouse: "Main Store - Raw Materials", location: "Aisle 2 - Rack 1", status: "Low Stock", lastUpdated: "2026-07-06T15:20:00Z", value: 7500, reorderLevel: 100, supplier: "Aluminum Industries Ltd" },
  { id: "3", itemCode: "RM-003", itemName: "Copper Wire 2.5mm", category: "Raw Material", quantity: 0, minQuantity: 50, maxQuantity: 300, unit: "Mtr", warehouse: "Main Store - Raw Materials", location: "Aisle 3 - Rack 2", status: "Out of Stock", lastUpdated: "2026-07-05T09:00:00Z", value: 0, reorderLevel: 50, supplier: "Copper Works Pvt Ltd" },
  { id: "4", itemCode: "WIP-001", itemName: "CNC Machined Parts - Batch A", category: "Work in Progress", quantity: 250, minQuantity: 20, maxQuantity: 500, unit: "Nos", warehouse: "WIP Warehouse", location: "WIP Area 1", status: "In Stock", lastUpdated: "2026-07-07T08:15:00Z", value: 125000, reorderLevel: 50, supplier: "Internal Production" },
  { id: "5", itemCode: "WIP-002", itemName: "PCB Assemblies v2.0", category: "Work in Progress", quantity: 15, minQuantity: 30, maxQuantity: 200, unit: "Pcs", warehouse: "WIP Warehouse", location: "WIP Area 2", status: "Low Stock", lastUpdated: "2026-07-06T16:45:00Z", value: 30000, reorderLevel: 30, supplier: "Internal Production" },
  { id: "6", itemCode: "FG-001", itemName: "Machine Assembly Model X", category: "Finished Goods", quantity: 75, minQuantity: 10, maxQuantity: 150, unit: "Nos", warehouse: "Finished Goods Store", location: "FG Rack 1", status: "In Stock", lastUpdated: "2026-07-07T11:00:00Z", value: 375000, reorderLevel: 20, supplier: "Internal Production" },
  { id: "7", itemCode: "FG-002", itemName: "Control Panel Unit", category: "Finished Goods", quantity: 500, minQuantity: 50, maxQuantity: 300, unit: "Nos", warehouse: "Finished Goods Store", location: "FG Rack 2", status: "Over Stock", lastUpdated: "2026-07-06T14:30:00Z", value: 50000, reorderLevel: 100, supplier: "Internal Production" },
  { id: "8", itemCode: "CH-001", itemName: "Industrial Paint - Red", category: "Chemicals", quantity: 120, minQuantity: 20, maxQuantity: 200, unit: "Ltr", warehouse: "Chemical Store", location: "Chemical Rack 1", status: "In Stock", lastUpdated: "2026-07-05T13:00:00Z", value: 24000, reorderLevel: 25, supplier: "Paint Suppliers Co." },
  { id: "9", itemCode: "CH-002", itemName: "Solvent Thinner", category: "Chemicals", quantity: 45, minQuantity: 30, maxQuantity: 150, unit: "Ltr", warehouse: "Chemical Store", location: "Chemical Rack 2", status: "Low Stock", lastUpdated: "2026-07-06T10:00:00Z", value: 6750, reorderLevel: 30, supplier: "Chemical Solutions Ltd" },
  { id: "10", itemCode: "PK-001", itemName: "Carton Boxes Large", category: "Packaging", quantity: 850, minQuantity: 100, maxQuantity: 2000, unit: "Nos", warehouse: "Finished Goods Store", location: "Packaging Area", status: "In Stock", lastUpdated: "2026-07-07T09:30:00Z", value: 17000, reorderLevel: 200, supplier: "Packaging Solutions" },
];

const mockTransactions: StockTransaction[] = [
  { id: "1", itemId: "1", itemName: "Stainless Steel Sheet 2mm", type: "In", quantity: 100, previousQty: 350, newQty: 450, date: "2026-07-07T10:30:00Z", user: "Rahul Sharma", reference: "GRN-2026-001", notes: "Purchase order received", warehouse: "Main Store - Raw Materials" },
  { id: "2", itemId: "2", itemName: "Aluminum Bars 40mm", type: "Out", quantity: 20, previousQty: 50, newQty: 30, date: "2026-07-06T15:20:00Z", user: "Priya Patel", reference: "WO-2026-0042", notes: "Issued for production", warehouse: "Main Store - Raw Materials" },
  { id: "3", itemId: "1", itemName: "Stainless Steel Sheet 2mm", type: "Transfer", quantity: 50, previousQty: 450, newQty: 400, date: "2026-07-06T11:00:00Z", user: "Amit Kumar", reference: "TR-2026-001", notes: "Transferred to WIP", warehouse: "Main Store - Raw Materials → WIP Warehouse" },
  { id: "4", itemId: "4", itemName: "CNC Machined Parts - Batch A", type: "In", quantity: 200, previousQty: 50, newQty: 250, date: "2026-07-07T08:15:00Z", user: "Sneha Reddy", reference: "JC-2026-001", notes: "Job card completed", warehouse: "WIP Warehouse" },
  { id: "5", itemId: "3", itemName: "Copper Wire 2.5mm", type: "Out", quantity: 30, previousQty: 30, newQty: 0, date: "2026-07-05T09:00:00Z", user: "Rahul Sharma", reference: "WO-2026-0035", notes: "Consumed in production", warehouse: "Main Store - Raw Materials" },
  { id: "6", itemId: "6", itemName: "Machine Assembly Model X", type: "Out", quantity: 5, previousQty: 80, newQty: 75, date: "2026-07-07T11:00:00Z", user: "Amit Kumar", reference: "SO-2026-001", notes: "Shipped to customer", warehouse: "Finished Goods Store" },
  { id: "7", itemId: "8", itemName: "Industrial Paint - Red", type: "In", quantity: 50, previousQty: 70, newQty: 120, date: "2026-07-05T13:00:00Z", user: "Priya Patel", reference: "GRN-2026-005", notes: "Purchase order received", warehouse: "Chemical Store" },
];

export default function Stock() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StockStatus>("All");
  const [showActivity, setShowActivity] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [sortField, setSortField] = useState<keyof StockItem>("itemName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Stats
  const [summary, setSummary] = useState<StockSummary>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalWarehouses: 0,
    recentActivity: 0,
  });

  const [stockItems, ] = useState<StockItem[]>(mockStockItems);
  const [warehouses] = useState<Warehouse[]>(mockWarehouses);
  const [transactions] = useState<StockTransaction[]>(mockTransactions);
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([]);

  // Get unique categories
  const categories = [...new Set(stockItems.map(item => item.category))];

  useEffect(() => {
    // Calculate summary
    const totalValue = stockItems.reduce((sum, item) => sum + item.value, 0);
    const lowStock = stockItems.filter(item => item.status === "Low Stock").length;
    const outOfStock = stockItems.filter(item => item.status === "Out of Stock").length;
    
    setSummary({
      totalItems: stockItems.length,
      totalValue,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
      totalWarehouses: warehouses.length,
      recentActivity: transactions.length,
    });

    // Get recent transactions (last 5)
    setRecentTransactions(transactions.slice(-5).reverse());
  }, [stockItems, warehouses, transactions]);

  // Filter items
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = selectedWarehouse === "all" || item.warehouse === selectedWarehouse;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    
    return matchesSearch && matchesWarehouse && matchesCategory && matchesStatus;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aVal = a[sortField] ?? "";
    const bVal = b[sortField] ?? "";
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof StockItem) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: StockStatus | string) => {
    switch (status) {
      case "In Stock": return "#10b981";
      case "Low Stock": return "#f59e0b";
      case "Out of Stock": return "#ef4444";
      case "Over Stock": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status: StockStatus | string) => {
    switch (status) {
      case "In Stock": return <FaCheckCircle className="status-icon" style={{ color: "#10b981" }} />;
      case "Low Stock": return <FaExclamationTriangle className="status-icon" style={{ color: "#f59e0b" }} />;
      case "Out of Stock": return <FaTimes className="status-icon" style={{ color: "#ef4444" }} />;
      case "Over Stock": return <FaArrowUp className="status-icon" style={{ color: "#3b82f6" }} />;
      default: return <FaCircle className="status-icon" style={{ color: "#6b7280" }} />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "In": return <FaArrowUp className="tx-icon in" />;
      case "Out": return <FaArrowDown className="tx-icon out" />;
      case "Transfer": return <FaTruck className="tx-icon transfer" />;
      case "Adjustment": return <FaEdit className="tx-icon adjustment" />;
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

  const getWarehouseUsage = (warehouse: Warehouse) => {
    const percentage = (warehouse.usedCapacity / warehouse.capacity) * 100;
    return Math.min(percentage, 100);
  };

  // ─── Render Functions ──────────────────────────────────────────────────

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number, color: string, subtitle?: string) => (
    <div className={`stock-stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="stock-grid">
      {paginatedItems.map((item) => (
        <div 
          key={item.id} 
          className={`stock-grid-item ${item.status.toLowerCase().replace(" ", "-")}`}
          onClick={() => { setSelectedItem(item); setShowItemDetails(true); }}
        >
          <div className="grid-item-header">
            <div className="item-status-indicator" style={{ background: getStatusColor(item.status) }} />
            <span className="item-code">{item.itemCode}</span>
            <span className="item-status-badge" style={{ background: getStatusColor(item.status) }}>
              {getStatusIcon(item.status)} {item.status}
            </span>
          </div>
          <div className="grid-item-body">
            <h3 className="item-name">{item.itemName}</h3>
            <div className="item-meta">
              <span className="meta-tag">{item.category}</span>
              <span className="meta-tag">{item.warehouse}</span>
            </div>
            <div className="item-quantity-section">
              <div className="quantity-display">
                <span className="qty-value">{item.quantity}</span>
                <span className="qty-unit">{item.unit}</span>
              </div>
              <div className="quantity-bar">
                <div 
                  className="quantity-fill" 
                  style={{ 
                    width: `${Math.min((item.quantity / item.maxQuantity) * 100, 100)}%`,
                    background: getStatusColor(item.status)
                  }} 
                />
              </div>
              <div className="quantity-labels">
                <span>Min: {item.minQuantity}</span>
                <span>Max: {item.maxQuantity}</span>
              </div>
            </div>
          </div>
          <div className="grid-item-footer">
            <div className="item-location">
              <FaWarehouse size={12} />
              <span>{item.location}</span>
            </div>
            <div className="item-value">
              ₹{item.value.toLocaleString()}
            </div>
          </div>
          <div className="grid-item-hover">
            <button className="hover-btn view-btn">
              <FaEye /> View
            </button>
            <button className="hover-btn edit-btn">
              <FaEdit /> Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="stock-table-wrap">
      <table className="stock-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("itemCode")}>
              Item Code {sortField === "itemCode" && (sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />)}
            </th>
            <th onClick={() => handleSort("itemName")}>
              Item Name {sortField === "itemName" && (sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />)}
            </th>
            <th onClick={() => handleSort("category")}>
              Category {sortField === "category" && (sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />)}
            </th>
            <th onClick={() => handleSort("warehouse")}>
              Warehouse {sortField === "warehouse" && (sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />)}
            </th>
            <th onClick={() => handleSort("quantity")}>
              Quantity {sortField === "quantity" && (sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />)}
            </th>
            <th>Status</th>
            <th onClick={() => handleSort("value")}>
              Value {sortField === "value" && (sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />)}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((item) => (
            <tr key={item.id} className="stock-table-row">
              <td className="item-code-cell">{item.itemCode}</td>
              <td className="item-name-cell">{item.itemName}</td>
              <td><span className="category-tag">{item.category}</span></td>
              <td>{item.warehouse}</td>
              <td className="quantity-cell">
                <span className="qty-number">{item.quantity}</span>
                <span className="qty-unit-sm">{item.unit}</span>
              </td>
              <td>
                <span className={`status-badge-sm ${item.status.toLowerCase().replace(" ", "-")}`}>
                  {item.status}
                </span>
              </td>
              <td className="value-cell">₹{item.value.toLocaleString()}</td>
              <td className="actions-cell">
                <button className="action-btn view" onClick={() => { setSelectedItem(item); setShowItemDetails(true); }}>
                  <FaEye size={12} />
                </button>
                <button className="action-btn edit" onClick={() => navigate(`/stock/edit/${item.id}`)}>
                  <FaEdit size={12} />
                </button>
                <button className="action-btn delete">
                  <FaTrash size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderActivityFeed = () => (
    <div className="stock-activity-feed">
      <div className="activity-header">
        <h3><FaHistory /> Recent Activity</h3>
        <button className="view-all-btn" onClick={() => setShowActivity(!showActivity)}>
          {showActivity ? "Hide" : "View All"}
        </button>
      </div>
      <div className="activity-list">
        {recentTransactions.map((tx) => (
          <div key={tx.id} className="activity-item">
            <div className="activity-icon-wrapper">
              {getTransactionIcon(tx.type)}
            </div>
            <div className="activity-content">
              <div className="activity-main">
                <span className="activity-item-name">{tx.itemName}</span>
                <span className={`activity-type ${tx.type.toLowerCase()}`}>{tx.type}</span>
                <span className="activity-qty">{tx.type === "In" ? "+" : "-"}{tx.quantity} units</span>
              </div>
              <div className="activity-details">
                <span className="activity-user"><FaUser size={10} /> {tx.user}</span>
                <span className="activity-reference"><FaFileAlt size={10} /> {tx.reference}</span>
                <span className="activity-time"><FaClock size={10} /> {formatDate(tx.date)}</span>
              </div>
              {tx.notes && <div className="activity-notes">{tx.notes}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────────────────

  return (
    <div className={`stock-page ${theme}`}>
      <div className="stock-container">
        {/* ─── Header ─── */}
        <div className="stock-header">
          <div className="stock-header-left">
            <h1><FaBoxes className="header-icon" /> Inventory Management</h1>
            <span className="stock-subtitle">Real-time stock tracking and warehouse management</span>
          </div>
          <div className="stock-header-right">
            <button className="header-btn primary" onClick={() => navigate("/stock/new")}>
              <FaPlus /> Add Item
            </button>
            <button className="header-btn secondary">
              <FaDownload /> Export
            </button>
            <button className="header-btn secondary">
              <FaPrint /> Print
            </button>
          </div>
        </div>

        {/* ─── Stats Cards ─── */}
        <div className="stock-stats-grid">
          {renderStatCard(
            <FaBoxes />,
            "Total Items",
            summary.totalItems,
            "blue",
            `${categories.length} categories`
          )}
          {renderStatCard(
            <FaChartLine />,
            "Total Value",
            `₹${summary.totalValue.toLocaleString()}`,
            "green",
            "All warehouses"
          )}
          {renderStatCard(
            <FaExclamationTriangle />,
            "Low Stock Alert",
            summary.lowStockItems,
            "yellow",
            "Items below minimum"
          )}
          {renderStatCard(
            <FaTimes />,
            "Out of Stock",
            summary.outOfStockItems,
            "red",
            "Items need immediate action"
          )}
          {renderStatCard(
            <FaWarehouse />,
            "Active Warehouses",
            summary.totalWarehouses,
            "purple",
            "Across all locations"
          )}
          {renderStatCard(
            <FaClock />,
            "Recent Activity",
            summary.recentActivity,
            "teal",
            "Last 24 hours"
          )}
        </div>

        {/* ─── Warehouse Overview ─── */}
        <div className="stock-warehouses">
          <div className="section-header">
            <h3><FaWarehouse /> Warehouses Overview</h3>
          </div>
          <div className="warehouse-grid">
            {warehouses.map((wh) => (
              <div key={wh.id} className={`warehouse-card ${wh.status.toLowerCase()}`}>
                <div className="warehouse-header">
                  <span className="warehouse-name">{wh.name}</span>
                  <span className={`warehouse-status ${wh.status.toLowerCase()}`}>{wh.status}</span>
                </div>
                <div className="warehouse-details">
                  <span><FaMapPin /> {wh.location}</span>
                  <span><FaUser /> {wh.manager}</span>
                </div>
                <div className="warehouse-capacity">
                  <div className="capacity-bar">
                    <div 
                      className="capacity-fill" 
                      style={{ width: `${getWarehouseUsage(wh)}%` }}
                    />
                  </div>
                  <span className="capacity-text">
                    {wh.usedCapacity.toLocaleString()} / {wh.capacity.toLocaleString()} units used ({Math.round(getWarehouseUsage(wh))}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="stock-filters">
          <div className="filters-left">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search items by code, name, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="search-clear" onClick={() => setSearchTerm("")}>
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="filters-right">
            <select 
              value={selectedWarehouse} 
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.name}>{wh.name}</option>
              ))}
            </select>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as StockStatus)}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Over Stock">Over Stock</option>
            </select>
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <FaThLarge />
              </button>
              <button 
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="stock-main">
          <div className="stock-content">
            {viewMode === "grid" ? renderGridView() : renderListView()}
          </div>
          <div className="stock-sidebar">
            {renderActivityFeed()}
          </div>
        </div>

        {/* ─── Pagination ─── */}
        <div className="stock-pagination">
          <div className="pagination-left">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedItems.length)} of {sortedItems.length} items
            </span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="page-size-select"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
          </div>
          <div className="pagination-center">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
              className="page-btn"
            >
              <FaAngleDoubleLeft size={12} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              className="page-btn"
            >
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
                  className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              <FaChevronRight size={12} />
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="pagination-right">
            <span>Page {currentPage} of {totalPages || 1}</span>
          </div>
        </div>

        {/* ─── Item Details Modal ─── */}
        {showItemDetails && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowItemDetails(false)}>
            <div className="item-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedItem.itemName}</h2>
                <button className="modal-close" onClick={() => setShowItemDetails(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Item Code</label>
                    <span>{selectedItem.itemCode}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category</label>
                    <span>{selectedItem.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span className={`status-badge-sm ${selectedItem.status.toLowerCase().replace(" ", "-")}`}>
                      {selectedItem.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Quantity</label>
                    <span>{selectedItem.quantity} {selectedItem.unit}</span>
                  </div>
                  <div className="detail-item">
                    <label>Warehouse</label>
                    <span>{selectedItem.warehouse}</span>
                  </div>
                  <div className="detail-item">
                    <label>Location</label>
                    <span>{selectedItem.location}</span>
                  </div>
                  <div className="detail-item">
                    <label>Value</label>
                    <span>₹{selectedItem.value.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Updated</label>
                    <span>{formatDate(selectedItem.lastUpdated)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Supplier</label>
                    <span>{selectedItem.supplier}</span>
                  </div>
                  <div className="detail-item">
                    <label>Reorder Level</label>
                    <span>{selectedItem.reorderLevel} {selectedItem.unit}</span>
                  </div>
                </div>
                <div className="detail-actions">
                  <button className="detail-btn primary">
                    <FaEdit /> Edit Item
                  </button>
                  <button className="detail-btn secondary">
                    <FaHistory /> View History
                  </button>
                  <button className="detail-btn danger">
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}