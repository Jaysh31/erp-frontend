// InventoryList.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  FaBoxes,
  FaWarehouse,

  FaDollarSign,
  FaArrowUp,
  FaExclamationTriangle,
  FaCheckCircle,
  FaIndustry,
  FaTruck,
  FaGlobe,
  FaCogs,
  FaRecycle,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaLock,
  FaLockOpen,
  FaChevronDown,
  FaFilter
} from "react-icons/fa";
import "./InventoryList.css";
import '../Sales/SalesMobileTable.css';
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";
import { PageLoader } from "../components/PageLoader";

// ═══════════════════════════════════════════════════════════════════════
// 🆕 Filter preservation helpers
//    - INV_PRESERVE_FLAG_KEY : set to "true" before navigating to a
//      /inventory/* or /InventoryList sub-route. Consumed on mount.
//    - INV_FILTER_DATA_KEY   : JSON snapshot of current filters, saved on
//      every filter change.
//
//    A global history observer wipes the preserve flag as soon as the
//    URL leaves the inventory module. That way, going to any other
//    page (Dashboard, Work Order, GRN, …) effectively discards filters.
//
//    NOTE: The list itself lives at /InventoryList but the detail pages
//    live at /inventory/detail/... — so we treat BOTH prefixes as
//    "inside the module" for the purpose of preserving state.
// ═══════════════════════════════════════════════════════════════════════
const INV_PRESERVE_FLAG_KEY = "__inv_preserve_filters__";
const INV_FILTER_DATA_KEY = "__inv_list_filters__";

const isInsideInventoryModule = (path: string) =>
  path.startsWith("/inventory") || path.startsWith("/InventoryList") ||
  path.startsWith("/inventorylist");

// Install the history observer exactly once per browser tab
if (typeof window !== "undefined" && !(window as any).__invNavObserverInstalled) {
  (window as any).__invNavObserverInstalled = true;

  const clearFlagIfLeavingInventory = () => {
    try {
      const path = window.location.pathname;
      if (!isInsideInventoryModule(path)) {
        sessionStorage.removeItem(INV_PRESERVE_FLAG_KEY);
      }
    } catch {
      /* ignore */
    }
  };

  const origPush = window.history.pushState;
  const origReplace = window.history.replaceState;

  window.history.pushState = function (...args: any[]) {
    const r = origPush.apply(this as any, args as any);
    clearFlagIfLeavingInventory();
    return r;
  };
  window.history.replaceState = function (...args: any[]) {
    const r = origReplace.apply(this as any, args as any);
    clearFlagIfLeavingInventory();
    return r;
  };
  window.addEventListener("popstate", clearFlagIfLeavingInventory);
}

// ─── Types ───────────────────────────────────────────────────────────────

interface InventoryItem {
  id: number;
  name: string;
  item_code: string;
  item_name: string;
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
  type: "Internal" | "External";
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
}

interface InventoryDisplay {
  id: string;
  itemCode: string;
  itemName: string;
  item_name: string;
  warehouse: string;
  warehouseId: number;
  actualQty: number;
  plannedQty: number;
  orderedQty: number;
  reservedQty: number;
  reservedStock: number;
  projectedQty: number;
  uom: string;
  valuationRate: number;
  stockValue: number;
  status: InventoryStatus;
  lastUpdated: string;
  type: "Internal" | "External";
  isGrouped?: boolean;
  groupItems?: InventoryDisplay[];
  itemCount?: number;
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

type ViewMode = "warehouses" | "detail";
type InventoryStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock"
  | "Over Stock";

type StockStatus = "All" | InventoryStatus;
type ActiveTab = "all" | "internal" | "external";

// 🆕 Map chatbot status keywords → Inventory status values
const URL_STATUS_TO_INV_STATUS: Record<string, InventoryStatus> = {
  "in stock":      "In Stock",
  "instock":       "In Stock",
  "available":     "In Stock",
  "low stock":     "Low Stock",
  "lowstock":      "Low Stock",
  "low":           "Low Stock",
  "out of stock":  "Out of Stock",
  "out-of-stock":  "Out of Stock",
  "outofstock":    "Out of Stock",
  "out":           "Out of Stock",
  "empty":         "Out of Stock",
  "over stock":    "Over Stock",
  "overstock":     "Over Stock",
  "over-stock":    "Over Stock",
  "excess":        "Over Stock",
};

function resolveInventoryStatus(rawStatus: string): InventoryStatus | null {
  if (!rawStatus) return null;
  const norm = rawStatus.toLowerCase().trim();
  if (URL_STATUS_TO_INV_STATUS[norm]) return URL_STATUS_TO_INV_STATUS[norm];

  for (const [key, val] of Object.entries(URL_STATUS_TO_INV_STATUS)) {
    if (norm.includes(key) || key.includes(norm)) return val;
  }
  return null;
}

// ─── Warehouse visual identity helpers ────────────────────────────────────
const getWarehouseVisual = (name: string) => {
  const n = (name || "").toLowerCase();
  if (n.includes("raw material") || n.includes("raw material store")) {
    return { icon: <FaBoxes />, tone: "blue", tag: "Raw Material" };
  }
  if (n.includes("work in progress") || n.includes("wip")) {
    return { icon: <FaCogs />, tone: "amber", tag: "In Production" };
  }
  if (n.includes("finished")) {
    return { icon: <FaCheckCircle />, tone: "green", tag: "Ready to Ship" };
  }
  if (n.includes("scrap")) {
    return { icon: <FaRecycle />, tone: "gray", tag: "Scrap" };
  }
  return { icon: <FaWarehouse />, tone: "indigo", tag: "Warehouse" };
};

// ─── Warehouse ordering helper ────────────────────────────────────────────
const getWarehouseOrderRank = (name: string, type?: string | null) => {
  const n = (name || "").toLowerCase();
  const t = (type || "").toLowerCase();
  if (n.includes("raw material") || t.includes("raw material")) return 1;
  if (n.includes("work in progress") || n.includes("wip") || t.includes("work in progress")) return 2;
  if (n.includes("finished") || t.includes("finished")) return 3;
  if (n.includes("scrap") || t.includes("scrap")) return 4;
  return 5;
};

export default function InventoryList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 🆕 URL-driven status filter
  const urlStatus = searchParams.get("status") || "";
  const urlAutoFilter = searchParams.get("autoFilter") === "1";
  const isUrlFiltered = !!urlStatus && urlAutoFilter;

  const { theme } = useAdminTheme();

  const [inventoryItems, setInventoryItems] = useState<InventoryDisplay[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("warehouses");
  const [detailWarehouseId, setDetailWarehouseId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus>("All");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [selectedItem] = useState<InventoryDisplay | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<InventoryDisplay | null>(null);

  // Overall stats (shown on the warehouse-picker screen)
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });

  // ─── Mobile expanded rows state ──────────────────────────────────
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const toggleRowExpand = (id: string | number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 🆕 Gates the "reset page to 1" effect so it doesn't clobber a
  //    restored currentPage right after mount.
  const [filtersReady, setFiltersReady] = useState(false);
  const isRestoringRef = useRef(false);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 RESTORE FILTERS + VIEW STATE ON MOUNT
  //    Only restores if the preserve flag is set (i.e. we came back from
  //    an inventory detail page). Otherwise, discards the saved data.
  // ═════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let shouldPreserve = false;
    try {
      shouldPreserve = sessionStorage.getItem(INV_PRESERVE_FLAG_KEY) === "true";
      sessionStorage.removeItem(INV_PRESERVE_FLAG_KEY);
    } catch {
      /* ignore */
    }

    if (shouldPreserve) {
      try {
        const saved = sessionStorage.getItem(INV_FILTER_DATA_KEY);
        if (saved) {
          const f = JSON.parse(saved);
          isRestoringRef.current = true;

          if (f.viewMode === "warehouses" || f.viewMode === "detail") {
            setViewMode(f.viewMode);
          }
          if (typeof f.detailWarehouseId === "number" || f.detailWarehouseId === null) {
            setDetailWarehouseId(f.detailWarehouseId);
          }
          if (typeof f.searchTerm === "string")   setSearchTerm(f.searchTerm);
          if (typeof f.statusFilter === "string") setStatusFilter(f.statusFilter as StockStatus);
          if (f.activeTab === "all" || f.activeTab === "internal" || f.activeTab === "external") {
            setActiveTab(f.activeTab);
          }
          if (typeof f.currentPage === "number")  setCurrentPage(f.currentPage);
          if (typeof f.itemsPerPage === "number") setItemsPerPage(f.itemsPerPage);

          console.log("♻️ Restored inventory filters + view state:", f);
        }
      } catch (e) {
        console.warn("⚠️ Failed to restore inventory filters:", e);
      }
    } else {
      // Came from outside the inventory module → discard stale filters.
      try {
        sessionStorage.removeItem(INV_FILTER_DATA_KEY);
      } catch {
        /* ignore */
      }
    }

    setFiltersReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═════════════════════════════════════════════════════════════════════
  // 🆕 SAVE FILTERS + VIEW STATE ON EVERY CHANGE
  // ═════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!filtersReady) return;
    try {
      sessionStorage.setItem(
        INV_FILTER_DATA_KEY,
        JSON.stringify({
          viewMode,
          detailWarehouseId,
          searchTerm,
          statusFilter,
          activeTab,
          currentPage,
          itemsPerPage,
        })
      );
    } catch {
      /* ignore */
    }
  }, [
    viewMode,
    detailWarehouseId,
    searchTerm,
    statusFilter,
    activeTab,
    currentPage,
    itemsPerPage,
    filtersReady,
  ]);

  // 🆕 Wrapper that sets the preserve flag before navigating to an
  //    inventory sub-route.
  const navigateWithPreserve = (path: string) => {
    try {
      sessionStorage.setItem(INV_PRESERVE_FLAG_KEY, "true");
    } catch {
      /* ignore */
    }
    navigate(path);
  };

  // 🆕 Sync URL status → statusFilter dropdown
  useEffect(() => {
    if (isUrlFiltered && urlStatus) {
      const mapped = resolveInventoryStatus(urlStatus);
      if (mapped) {
        setStatusFilter(mapped as StockStatus);
        setCurrentPage(1);
        // Make sure we're in the detail view so the status filter is visible
        if (viewMode === "warehouses") {
          setViewMode("detail");
        }
      }
    }
  }, [isUrlFiltered, urlStatus, viewMode]);

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
      const response = await api.get<ApiResponse>("/inventory?limit=10000");
      if (response.data.success === 1) {
        const records = response.data.data?.records || [];

        const warehouseMap = new Map<number, string>();
        warehouses.forEach((wh) => warehouseMap.set(wh.id, wh.warehouse_name));

        const transformedData: InventoryDisplay[] = records.map((item: any) => {
          const warehouseName = warehouseMap.get(item.warehouse_Id) || "Unknown";
          const status = getStockStatus(item.actual_qty || 0);

          return {
            id: item.id.toString(),
            itemCode: item.item_code,
            itemName: item.item_name || item.item_code,
            item_name: item.item_name || item.item_code,
            warehouse: warehouseName,
            warehouseId: item.warehouse_Id,
            actualQty: item.actual_qty || 0,
            plannedQty: item.planned_qty || 0,
            orderedQty: item.ordered_qty || 0,
            reservedQty: item.reserved_qty || 0,
            reservedStock: item.reserved_stock || 0,
            projectedQty: item.projected_qty || 0,
            uom: item.stock_uom || "Nos",
            valuationRate: item.valuation_rate || 0,
            stockValue: item.stock_value || 0,
            status,
            lastUpdated: item.creation || new Date().toISOString(),
            type: item.type || "Internal",
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

  const getStockStatus = (actualQty: number): InventoryStatus => {
    if (actualQty <= 0) return "Out of Stock";
    if (actualQty < 10) return "Low Stock";
    if (actualQty > 1000) return "Over Stock";
    return "In Stock";
  };

  // ─── Group Internal Items by Item Code ──────────────────────────────
  const groupInternalItems = (items: InventoryDisplay[]): InventoryDisplay[] => {
    const internalItems = items.filter(item => item.type === "Internal");
    const externalItems = items.filter(item => item.type === "External");

    const groupedMap = new Map<string, InventoryDisplay[]>();

    internalItems.forEach(item => {
      if (!groupedMap.has(item.itemCode)) {
        groupedMap.set(item.itemCode, []);
      }
      groupedMap.get(item.itemCode)!.push(item);
    });

    const groupedInternalItems: InventoryDisplay[] = [];

    groupedMap.forEach((group, itemCode) => {
      const totalActualQty = group.reduce((sum, item) => sum + item.actualQty, 0);
      const totalReservedStock = group.reduce((sum, item) => sum + item.reservedStock, 0);
      const totalStockValue = group.reduce((sum, item) => sum + item.stockValue, 0);
      const totalValuationRate = group.reduce((sum, item) => sum + item.valuationRate, 0);
      const avgValuationRate = totalValuationRate / group.length;

      const firstItem = group[0];

      const groupedItem: InventoryDisplay = {
        ...firstItem,
        id: `grouped-${itemCode}`,
        actualQty: totalActualQty,
        reservedStock: totalReservedStock,
        stockValue: totalStockValue,
        valuationRate: avgValuationRate,
        isGrouped: true,
        groupItems: group,
        itemCount: group.length,
        status: getStockStatus(totalActualQty),
      };

      groupedInternalItems.push(groupedItem);
    });

    return [...groupedInternalItems, ...externalItems];
  };

  // ─── Update Stats ─────────────────────────────────────────────────
  const updateStats = (items: InventoryDisplay[]) => {
    const groupedItems = groupInternalItems(items);

    const totalValue = groupedItems.reduce((sum, item) => sum + item.stockValue, 0);
    const lowStock = groupedItems.filter((item) => item.status === "Low Stock").length;
    const outOfStock = groupedItems.filter((item) => item.status === "Out of Stock").length;

    setStats({
      totalItems: groupedItems.length,
      totalValue,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses]);

  // ─── Per-warehouse rollups ──
  const warehouseCards = useMemo(() => {
    const cards = warehouses.map((wh) => {
      const warehouseItems = inventoryItems.filter((item) => item.warehouseId === wh.id);
      const groupedWarehouseItems = groupInternalItems(warehouseItems);

      const internalItems = groupedWarehouseItems.filter((item) => item.type === "Internal");
      const externalItems = groupedWarehouseItems.filter((item) => item.type === "External");
      const totalValue = groupedWarehouseItems.reduce((sum, item) => sum + item.stockValue, 0);
      const lowStock = groupedWarehouseItems.filter((item) => item.status === "Low Stock" || item.status === "Out of Stock").length;
      const overReserved = groupedWarehouseItems.filter((item) => item.reservedStock > item.actualQty).length;
      const visual = getWarehouseVisual(wh.warehouse_name);

      return {
        ...wh,
        items: groupedWarehouseItems,
        itemCount: groupedWarehouseItems.length,
        internalCount: internalItems.length,
        externalCount: externalItems.length,
        totalValue,
        lowStock,
        overReserved,
        visual,
      };
    });

    return cards.sort((a, b) => {
      const rankA = getWarehouseOrderRank(a.warehouse_name, a.warehouse_type);
      const rankB = getWarehouseOrderRank(b.warehouse_name, b.warehouse_type);
      if (rankA !== rankB) return rankA - rankB;
      return a.warehouse_name.localeCompare(b.warehouse_name);
    });
  }, [warehouses, inventoryItems]);

  const activeWarehouse = warehouseCards.find((wh) => wh.id === detailWarehouseId) || null;

  // ─── Items for the detail view ────────────────────────────────────
  const detailItems = useMemo(() => {
    if (!activeWarehouse) return [];

    let items = activeWarehouse.items;

    if (activeTab === "internal") {
      items = items.filter(item => item.type === "Internal");
    } else if (activeTab === "external") {
      items = items.filter(item => item.type === "External");
    }

    return items.filter((item) => {
      const matchesSearch =
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.uom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeWarehouse, searchTerm, statusFilter, activeTab]);

  const detailTabCounts = useMemo(() => {
    if (!activeWarehouse) return { all: 0, internal: 0, external: 0 };
    return {
      all: activeWarehouse.items.length,
      internal: activeWarehouse.items.filter(i => i.type === "Internal").length,
      external: activeWarehouse.items.filter(i => i.type === "External").length,
    };
  }, [activeWarehouse]);

  // Reset pagination when filters/tab/warehouse change — skip the first
  // run after restoration so we don't clobber a restored currentPage.
  useEffect(() => {
    if (!filtersReady) return;
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchTerm, detailWarehouseId, filtersReady]);

  // ─── Pagination ──────────────────────────────────────────────────
  const totalPages = Math.ceil(detailItems.length / itemsPerPage) || 1;
  const paginatedItems = detailItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ─── Handlers ────────────────────────────────────────────────────
  const openWarehouse = (id: number) => {
    setDetailWarehouseId(id);
    setViewMode("detail");
    setActiveTab("all");
    if (!isUrlFiltered) {
      setStatusFilter("All");
    }
    setSearchTerm("");
  };

  const backToWarehouses = () => {
    setViewMode("warehouses");
    setDetailWarehouseId(null);
  };

  const confirmDelete = async () => {
    if (selectedItemForDelete) {
      try {
        if (selectedItemForDelete.isGrouped && selectedItemForDelete.groupItems) {
          for (const item of selectedItemForDelete.groupItems) {
            await api.delete(`/inventory/${item.id}`);
          }
        } else {
          await api.delete(`/inventory/${selectedItemForDelete.id}`);
        }
        setShowDeleteConfirm(false);
        setSelectedItemForDelete(null);
        fetchInventory();
      } catch (err) {
        console.error("Error deleting inventory item(s):", err);
        alert("Failed to delete inventory item(s)");
      }
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setActiveTab("all");
    setCurrentPage(1);
  };

  // 🆕 Clears the URL-driven status filter
  const clearUrlStatusFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    next.delete("autoFilter");
    setSearchParams(next);
    setStatusFilter("All");
    setCurrentPage(1);
  };

  const getStatusIcon = (status: StockStatus) => {
    switch (status) {
      case "In Stock":
        return <FaCheckCircle style={{ color: "#10b981" }} />;
      case "Low Stock":
        return <FaExclamationTriangle style={{ color: "#f59e0b" }} />;
      case "Out of Stock":
        return <FaTimes style={{ color: "#ef4444" }} />;
      case "Over Stock":
        return <FaArrowUp style={{ color: "#3b82f6" }} />;
      default:
        return null;
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

  // ─── Render: warehouse picker ─────────────────────────────────────

  const renderWarehousePicker = () => (
    <>
      <div className="inv-stats-grid inv-stats-grid--compact">
        {[
          { icon: <FaBoxes />, label: "Total Items", value: stats.totalItems, color: "blue" },
          { icon: <FaDollarSign />, label: "Total Value", value: `₹${stats.totalValue.toLocaleString()}`, color: "green" },
          { icon: <FaExclamationTriangle />, label: "Low Stock", value: stats.lowStockItems, color: "yellow" },
          { icon: <FaTimes />, label: "Out of Stock", value: stats.outOfStockItems, color: "red" },
        ].map((s) => (
          <div className={`inv-stat-card ${s.color}`} key={s.label}>
            <div className="inv-stat-icon">{s.icon}</div>
            <div className="inv-stat-content">
              <div className="inv-stat-value">{s.value}</div>
              <div className="inv-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="inv-picker-heading">
        <h2>Select a warehouse</h2>
        <span>Click a stage to see what's inside it</span>
      </div>

      <div className="inv-wh-picker-grid">
        {warehouseCards.length === 0 ? (
          <div className="inv-empty-state">
            <div className="inv-empty-content">
              <FaWarehouse size={48} />
              <p>No warehouses found</p>
            </div>
          </div>
        ) : (
          warehouseCards.map((wh) => (
            <button
              key={wh.id}
              className={`inv-wh-tile inv-wh-tile--${wh.visual.tone}`}
              onClick={() => openWarehouse(wh.id)}
            >
              <div className="inv-wh-tile-top">
                <span className="inv-wh-tile-icon">{wh.visual.icon}</span>
                {wh.disabled ? (
                  <span className="inv-wh-tile-badge disabled"><FaLock size={9} /> Disabled</span>
                ) : (
                  <span className="inv-wh-tile-badge active"><FaLockOpen size={9} /> Active</span>
                )}
              </div>
              <div className="inv-wh-tile-name">{wh.warehouse_name}</div>
              <div className="inv-wh-tile-tag inv-desktop-only">{wh.visual.tag}</div>
              {wh.city && (
                <div className="inv-wh-tile-location inv-desktop-only">
                  <FaMapMarkerAlt size={10} /> {wh.city}{wh.state ? `, ${wh.state}` : ""}
                </div>
              )}

              <div className="inv-wh-tile-stats">
                <div className="inv-wh-tile-stat">
                  <span className="inv-wh-tile-stat-value">{wh.itemCount}</span>
                  <span className="inv-wh-tile-stat-label">Items</span>
                </div>
                <div className="inv-wh-tile-stat">
                  <span className="inv-wh-tile-stat-value">₹{wh.totalValue.toLocaleString()}</span>
                  <span className="inv-wh-tile-stat-label">Value</span>
                </div>
                <div className="inv-wh-tile-stat">
                  <span className="inv-wh-tile-stat-value" style={{ color: wh.lowStock > 0 ? "#f59e0b" : undefined }}>
                    {wh.lowStock}
                  </span>
                  <span className="inv-wh-tile-stat-label">Low/Out</span>
                </div>
              </div>

              <div className="inv-wh-tile-split inv-desktop-only">
                <span><FaIndustry size={10} /> {wh.internalCount} Internal</span>
                <span><FaTruck size={10} /> {wh.externalCount} External</span>
              </div>

              {wh.overReserved > 0 && (
                <div className="inv-wh-tile-warning inv-desktop-only">
                  <FaExclamationTriangle size={10} /> {wh.overReserved} item{wh.overReserved > 1 ? "s" : ""} over-reserved
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </>
  );

  // ─── Render: warehouse detail (drill-down) ────────────────────────

  const renderWarehouseDetail = () => {
    if (!activeWarehouse) return null;
    function getStartIndex() {
      return (currentPage - 1) * itemsPerPage + 1;
    }

    function getEndIndex() {
      return Math.min(currentPage * itemsPerPage, detailItems.length);
    }

    if (loading) {
      return (
        <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
          <PageLoader
            message="Loading Organization & Company List..."
          />
        </div>
      );
    }

    return (
      <>
        {/* 🆕 URL-driven status filter banner */}
        {isUrlFiltered && (
          <div className="inv-url-filter-banner">
            <FaFilter size={12} />
            <span>
              Showing Inventory with status: <strong>{resolveInventoryStatus(urlStatus) || urlStatus}</strong>
            </span>
            <span className="inv-url-filter-count">
              ({detailItems.length} record{detailItems.length === 1 ? "" : "s"})
            </span>
            <button
              className="inv-url-filter-clear"
              onClick={clearUrlStatusFilter}
              title="Clear status filter"
            >
              <FaTimes size={10} /> Clear
            </button>
          </div>
        )}

        <div className="inv-detail-header">
          <button className="inv-detail-back" onClick={backToWarehouses}>
            <FaArrowLeft size={12} /> All Warehouses
          </button>
          <div className="inv-detail-title">
            <span className={`inv-detail-title-icon inv-wh-tile--${activeWarehouse.visual.tone}`}>
              {activeWarehouse.visual.icon}
            </span>
            <div>
              <h2>{activeWarehouse.warehouse_name}</h2>
              <span className="inv-subtitle">
                {activeWarehouse.itemCount} items · ₹{activeWarehouse.totalValue.toLocaleString()} in stock
                {activeWarehouse.city ? ` · ${activeWarehouse.city}${activeWarehouse.state ? `, ${activeWarehouse.state}` : ""}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="inv-tabs">
          <button
            className={`inv-tab ${activeTab === "all" ? "inv-tab--active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <FaGlobe size={14} />
            All
            <span className="inv-tab-count">{detailTabCounts.all}</span>
          </button>
          <button
            className={`inv-tab ${activeTab === "internal" ? "inv-tab--active" : ""}`}
            onClick={() => setActiveTab("internal")}
          >
            <FaIndustry size={14} />
            Internal <span className="inv-tab-hint">(Grouped)</span>
            <span className="inv-tab-count">{detailTabCounts.internal}</span>
          </button>
          <button
            className={`inv-tab ${activeTab === "external" ? "inv-tab--active" : ""}`}
            onClick={() => setActiveTab("external")}
          >
            <FaTruck size={14} />
            External <span className="inv-tab-hint">(Individual)</span>
            <span className="inv-tab-count">{detailTabCounts.external}</span>
          </button>
        </div>

        {/* ─── Filters ─── */}
        <div className="inv-filters">
          <div className="inv-filters-left">
            <div className="inv-search-wrapper">
              <FaSearch className="inv-search-icon" />
              <input
                type="text"
                placeholder="Search by item code, name, or UOM..."
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
          </div>
        </div>

        {(searchTerm || statusFilter !== "All" || isUrlFiltered) && (
          <div className="inv-active-filters">
            <span>Active filters:</span>
            {isUrlFiltered && <span><strong>Status (URL):</strong> {resolveInventoryStatus(urlStatus) || urlStatus}</span>}
            {searchTerm && <span><strong>Search:</strong> "{searchTerm}"</span>}
            {statusFilter !== "All" && <span><strong>Status:</strong> {statusFilter}</span>}
            <button
              onClick={() => {
                clearFilters();
                if (isUrlFiltered) clearUrlStatusFilter();
              }}
              className="inv-clear-filters"
            >
              <FaTimes size={10} /> Clear
            </button>
          </div>
        )}

        {/* ─── Table ─── */}
        {!loading && !error && (
          <>
            <div className="inv-table-wrap sales-desktop-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th className="inv-th">Item Code</th>
                    <th className="inv-th">Item Name</th>
                    {activeTab === "all" && <th className="inv-th">Type</th>}
                    <th className="inv-th">Actual Qty</th>
                    <th className="inv-th">Status</th>
                    <th className="inv-th">Valuation Rate</th>
                    <th className="inv-th">Stock Value</th>
                    <th className="inv-th inv-th-meta">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === "all" ? 8 : 7} className="inv-empty-state">
                        <div className="inv-empty-content">
                          <FaBoxes size={40} />
                          <p>No items found in {activeWarehouse.warehouse_name}</p>
                          <span>Try switching tabs or adjusting your search</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => {
                      return (
                        <tr key={item.id} className={`inv-tr ${item.isGrouped ? 'inv-tr-grouped' : ''}`}>
                          <td className="inv-td inv-td-code">
                            {item.isGrouped && (
                              <span className="inv-group-badge" title={`${item.itemCount} items grouped`}>
                                <FaBoxes size={10} /> {item.itemCount}x
                              </span>
                            )}
                            {item.itemCode}
                          </td>
                          <td className="inv-td">{item.itemName}</td>

                          {activeTab === "all" && (
                            <td className="inv-td">
                              <span className={`inv-type-badge ${item.type.toLowerCase()}`}>
                                {item.type === "Internal" ? <FaIndustry size={10} /> : <FaTruck size={10} />}
                                {item.type}
                              </span>
                            </td>
                          )}
                          <td className="inv-td inv-td-number">
                            <span className="inv-qty">{item.actualQty}</span>
                            <span className="inv-uom">{item.uom}</span>
                          </td>
                          <td className="inv-td">
                            <span className={`inv-status-badge ${item.status.toLowerCase().replace(" ", "-")}`}>
                              {getStatusIcon(item.status)} {item.status}
                            </span>
                          </td>
                          <td className="inv-td inv-td-number">₹{item.valuationRate.toLocaleString()}</td>
                          <td className="inv-td inv-td-amount">₹{item.stockValue.toLocaleString()}</td>
                          <td className="inv-td inv-td-meta">
                            <div className="inv-action-buttons">
                              <button
                                className="wo-action-btn wo-action-view"
                                onClick={() =>
                                  navigateWithPreserve(
                                    `/inventory/detail/${encodeURIComponent(item.itemCode)}` +
                                    `?type=${encodeURIComponent(item.type)}` +
                                    `&warehouse_id=${encodeURIComponent(String(item.warehouseId))}`
                                  )
                                }
                                title="View Details"
                              >
                                <FaEye size={12} />
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Table Section */}
            <div className="sales-mobile-list-wrap">
              <div className="sales-mobile-list-header">
                <div className="sales-mobile-th-primary">
                  <span className="sales-mobile-th-cell">Item Code	</span>
                  <span className="sales-mobile-th-sep">•</span>
                  <span className="sales-mobile-th-cell">Item Name </span>
                </div>
                <div className="sales-mobile-th-right">
                  <span className="sales-count-label">
                    {detailItems.length > 0
                      ? `${getStartIndex()}–${getEndIndex()}`
                      : '0'} of {detailItems.length}
                  </span>
                </div>
              </div>

              {paginatedItems.length === 0 ? (
                <div className="qt-empty-state">
                  <div className="qt-empty-content">
                    <p>No warehouses found</p>
                    <span>Try adjusting your search criteria</span>
                  </div>
                </div>
              ) : (
                <div className="sales-mobile-cards">
                  {paginatedItems.map((item) => {
                    const isExpanded = expandedRows.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`sales-mobile-card ${isExpanded ? "sales-mobile-card-expanded" : ""}`}
                      >
                        <div
                          className="sales-mobile-card-header"
                          onClick={() => toggleRowExpand(item.id)}
                        >
                          <div className="sales-mobile-card-primary">
                            <div className="sales-mobile-card-primary-row">
                              <span
                                className="sales-mobile-item-name">
                                {item.isGrouped && (
                                  <span className="inv-group-badge" title={`${item.itemCount} items grouped`}>
                                    <FaBoxes size={10} /> {item.itemCount}x
                                  </span>
                                )}
                                {item.itemCode}
                              </span>
                              <span className="sales-mobile-header-badge">

                                {item.itemName}

                                {activeTab === "all" && (
                                  <span className="inv-td">
                                    <span className={`inv-type-badge ${item.type.toLowerCase()}`}>
                                      {item.type === "Internal" ? <FaIndustry size={10} /> : <FaTruck size={10} />}
                                      {item.type}
                                    </span>
                                  </span>
                              )}
                                </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`sales-mobile-dropdown-btn ${isExpanded ? "expanded" : ""}`}
                            onClick={(e) => toggleRowExpand(item.id, e)}
                            aria-label={isExpanded ? "Collapse quotation details" : "Expand quotation details"}
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            <FaChevronDown size={13} className="sales-mobile-chevron" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="sales-mobile-card-details">
                            <div className="sales-mobile-detail-row">
                              <span className="sales-mobile-detail-label">Actual Qty</span>
                              <span className="sales-mobile-detail-value">
                                {item.actualQty}
                              </span>
                            </div>

                            <div className="sales-mobile-detail-row">
                              <span className="sales-mobile-detail-label">Status</span>
                              <span className="sales-mobile-detail-value sales-amount-highlight">

                                <span className={`inv-status-badge ${item.status.toLowerCase().replace(" ", "-")}`}>
                                  {getStatusIcon(item.status)} {item.status}
                                </span>
                              </span>
                            </div>

                            <div className="sales-mobile-detail-row">
                              <span className="sales-mobile-detail-label">Valuation Rate</span>
                              <span className="sales-mobile-detail-value">
                                ₹{item.valuationRate.toLocaleString()}
                              </span>
                            </div>

                            <div className="sales-mobile-detail-row">
                              <span className="sales-mobile-detail-label">Stock Value</span>
                              <span className="sales-mobile-detail-value">
                                ₹{item.stockValue.toLocaleString()}
                              </span>
                            </div>

                            <div className="sales-mobile-detail-footer">
                              <span className="sales-mobile-card-meta-text">
                              </span>
                              <div className="sales-mobile-action-buttons">
                                <button
                                  className="wo-action-btn wo-action-view"
                                  onClick={() =>
                                    navigateWithPreserve(
                                      `/inventory/detail/${encodeURIComponent(item.itemCode)}` +
                                      `?type=${encodeURIComponent(item.type)}` +
                                      `&warehouse_id=${encodeURIComponent(String(item.warehouseId))}`
                                    )
                                  }
                                  title="View Details"
                                >
                                  <FaEye size={12} />
                                </button>

                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {detailItems.length > 0 && (
          <div className="inv-pagination">
            <div className="inv-pagination-left">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, detailItems.length)} of {detailItems.length} items
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
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        )}

        </>
      );
  };

  // ─── Helper: Reservation State ────────────────────────────────────

  return (
    <div className={`inv-page ${theme}`}>
      <div className="inv-container">

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
            {viewMode === "warehouses" ? renderWarehousePicker() : renderWarehouseDetail()}
          </div>
        )}

        {/* ─── Item Details Modal ─── */}
        {showItemDetails && selectedItem && (
          <div className="inv-modal-overlay" onClick={() => setShowItemDetails(false)}>
            <div className="inv-modal inv-item-detail" onClick={(e) => e.stopPropagation()}>
              <div className="inv-modal-header">
                <h2>
                  <span className={`inv-type-badge ${selectedItem.type.toLowerCase()}`}>
                    {selectedItem.type === "Internal" ? <FaIndustry size={12} /> : <FaTruck size={12} />}
                    {selectedItem.type}
                  </span>
                  {selectedItem.itemCode}
                  {selectedItem.isGrouped && (
                    <span className="inv-group-badge" style={{ marginLeft: '10px' }}>
                      <FaBoxes size={12} /> {selectedItem.itemCount} items grouped
                    </span>
                  )}
                </h2>
                <button className="inv-modal-close" onClick={() => setShowItemDetails(false)}>
                  <FaTimes size={16} />
                </button>
              </div>
              <div className="inv-modal-body">
                {selectedItem.isGrouped && selectedItem.groupItems && (
                  <div className="inv-grouped-items-list">
                    <h4>Grouped Items:</h4>
                    <ul>
                      {selectedItem.groupItems.map((subItem) => (
                        <li key={subItem.id}>
                          {subItem.itemCode} - {subItem.itemName} - Qty: {subItem.actualQty} {subItem.uom}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="inv-detail-grid">
                  <div className="inv-detail-item">
                    <label>Item Code</label>
                    <span>{selectedItem.itemCode}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Item Name</label>
                    <span>{selectedItem.itemName}</span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Type</label>
                    <span className={`inv-type-badge ${selectedItem.type.toLowerCase()}`}>
                      {selectedItem.type}
                    </span>
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
                    <span>
                      {selectedItem.actualQty} {selectedItem.uom}
                      {selectedItem.isGrouped && selectedItem.groupItems && (
                        <span className="inv-group-hint"> (total of {selectedItem.groupItems.length} items)</span>
                      )}
                    </span>
                  </div>
                  <div className="inv-detail-item">
                    <label>Projected Quantity</label>
                    <span>{selectedItem.projectedQty} {selectedItem.uom}</span>
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
                <button
                  className="inv-btn-primary"
                  onClick={() => navigateWithPreserve(`/inventory/edit/${selectedItem.id}`)}
                >
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
                  <strong>{selectedItemForDelete.itemCode}</strong> - {selectedItemForDelete.itemName} - {selectedItemForDelete.warehouse}
                  {selectedItemForDelete.isGrouped && selectedItemForDelete.groupItems && (
                    <span className="inv-group-hint"> ({selectedItemForDelete.groupItems.length} items will be deleted)</span>
                  )}
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