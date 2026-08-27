// DashboardPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaClock, FaChartLine, FaIndustry,
  FaCheckCircle, FaExclamationTriangle, FaPlay,
  FaWarehouse, FaPlus,
  FaArrowRight, FaDollarSign,
  FaRocket, FaTasks, FaHourglassHalf
} from "react-icons/fa";
import { BsGear } from "react-icons/bs";
import "./DashboardPage.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from "../../services/api";

// Types
interface WorkOrderStats {
  total: number;
  draft: number;
  open: number;
  inProcess: number;
  completed: number;
  stopped: number;
  overdue: number;
  onHold: number;
}

interface JobCardStats {
  total: number;
  open: number;
  inProcess: number;
  completed: number;
  stopped: number;
  pending: number;
}

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  rawMaterialItems: number;
  finishedGoodsItems: number;
  wipItems: number;
  lowStockItems: number;
  totalQuantity: number;
}

interface DashboardData {
  totalProduced: number;
  totalValue: number;
  efficiency: number;
  openWorkOrders: number;
  wipWorkOrders: number;
  totalWorkOrders: number;
  overdueOrders: number;
  recentActivity: any[];
  topProducts: any[];
  stats: WorkOrderStats;
  jobCardStats: JobCardStats;
  inventoryStats: InventoryStats;
  totalJobCards: number;
  totalInventoryValue: number;
  completionRate: number;
}

interface ProducibleItemRow {
  name: string;
  required: number;
  available: number;
  possible: number;
  warehouse: string;
}

interface ProducibleResult {
  maxUnits: number;
  bottleneck: string;
  items: ProducibleItemRow[];
}

export default function DashboardPage() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProduced: 0,
    totalValue: 0,
    efficiency: 0,
    openWorkOrders: 0,
    wipWorkOrders: 0,
    totalWorkOrders: 0,
    overdueOrders: 0,
    recentActivity: [],
    topProducts: [],
    stats: {
      total: 0,
      draft: 0,
      open: 0,
      inProcess: 0,
      completed: 0,
      stopped: 0,
      overdue: 0,
      onHold: 0
    },
    jobCardStats: {
      total: 0,
      open: 0,
      inProcess: 0,
      completed: 0,
      stopped: 0,
      pending: 0
    },
    inventoryStats: {
      totalItems: 0,
      totalValue: 0,
      rawMaterialItems: 0,
      finishedGoodsItems: 0,
      wipItems: 0,
      lowStockItems: 0,
      totalQuantity: 0
    },
    totalJobCards: 0,
    totalInventoryValue: 0,
    completionRate: 0
  });

  // ─── Production Capacity Check state ─────────────────────────────────
  const [boms, setBoms] = useState<any[]>([]);
  const [selectedBomId, setSelectedBomId] = useState<string>("");
  const [bomLoading, setBomLoading] = useState(false);
  const [producible, setProducible] = useState<ProducibleResult | null>(null);
  const [, setRecentJobCards] = useState<any[]>([]);
  const [recentInventory, setRecentInventory] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all APIs in parallel
      const [woRes, jobRes, invRes, bomRes] = await Promise.all([
        api.get("/work-order?limit=1000"),
        api.get("/job-card?limit=1000"),
        api.get("/inventory?limit=10000"),
        api.get("/bom?limit=1000")
      ]);

      // Process Work Orders
      const workOrders = woRes.data?.data?.records || woRes.data?.data || [];
      const workOrdersArray = Array.isArray(workOrders) ? workOrders : [];
      
      // Process Job Cards
      const jobCards = jobRes.data?.data?.records || jobRes.data?.data || [];
      const jobCardsArray = Array.isArray(jobCards) ? jobCards : [];
      
      // Process Inventory
      const inventory = invRes.data?.data?.records || invRes.data?.data || [];
      const inventoryArray = Array.isArray(inventory) ? inventory : [];
      
      // Process BOMs
      const bomsData = bomRes.data?.data?.records || bomRes.data?.data || [];
      const bomsArray = Array.isArray(bomsData) ? bomsData : [];

      // ─── Work Order Stats ──────────────────────────────────────────────
      const stats = {
        total: workOrdersArray.length,
        draft: workOrdersArray.filter((o: any) => o.status === "Draft").length,
        open: workOrdersArray.filter((o: any) => o.status === "Open" || o.status === "Not Started").length,
        inProcess: workOrdersArray.filter((o: any) => o.status === "In Process").length,
        completed: workOrdersArray.filter((o: any) => o.status === "Completed").length,
        stopped: workOrdersArray.filter((o: any) => o.status === "Stopped").length,
        overdue: workOrdersArray.filter((o: any) => {
          if (o.planned_end_date && o.status !== "Completed") {
            return new Date(o.planned_end_date) < new Date();
          }
          return false;
        }).length,
        onHold: workOrdersArray.filter((o: any) => o.status === "On Hold").length
      };

      const totalProduced = workOrdersArray.reduce((sum: number, o: any) => sum + (o.produced_qty || 0), 0);
      const totalValue = workOrdersArray.reduce((sum: number, o: any) => sum + (o.total_operating_cost || 0), 0);

      // ─── Job Card Stats ──────────────────────────────────────────────────
      const jobCardStats = {
        total: jobCardsArray.length,
        open: jobCardsArray.filter((j: any) => j.status === "Open" || j.status === "Not Started").length,
        inProcess: jobCardsArray.filter((j: any) => j.status === "In Process").length,
        completed: jobCardsArray.filter((j: any) => j.status === "Completed").length,
        stopped: jobCardsArray.filter((j: any) => j.status === "Stopped").length,
        pending: jobCardsArray.filter((j: any) => j.status === "Pending").length
      };

      // ─── Inventory Stats ──────────────────────────────────────────────────
      const rawMaterialItems = inventoryArray.filter((i: any) => 
        i.item_group === "Raw Material" || i.item_group?.includes("Raw")
      ).length;
      const finishedGoodsItems = inventoryArray.filter((i: any) => 
        i.item_group === "Finished Goods" || i.item_group?.includes("Finished") || i.item_group === "Product"
      ).length;
      const wipItems = inventoryArray.filter((i: any) => 
        i.warehouse_name === "Work In Progress" || i.item_group === "WIP"
      ).length;
      
      const totalInventoryValue = inventoryArray.reduce((sum: number, i: any) => sum + (i.stock_value || 0), 0);
      const totalQuantity = inventoryArray.reduce((sum: number, i: any) => sum + (i.actual_qty || 0), 0);
      const lowStockItems = inventoryArray.filter((i: any) => (i.actual_qty || 0) < 10).length;

      const inventoryStats = {
        totalItems: inventoryArray.length,
        totalValue: totalInventoryValue,
        rawMaterialItems,
        finishedGoodsItems,
        wipItems,
        lowStockItems,
        totalQuantity
      };

      // ─── Set Dashboard Data ──────────────────────────────────────────────
      setDashboardData({
        totalProduced,
        totalValue,
        efficiency: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        openWorkOrders: stats.open,
        wipWorkOrders: stats.inProcess,
        totalWorkOrders: stats.total,
        overdueOrders: stats.overdue,
        recentActivity: [...workOrdersArray.slice(0, 3), ...jobCardsArray.slice(0, 2)].sort(
          (a, b) => new Date(b.modified || b.creation).getTime() - new Date(a.modified || a.creation).getTime()
        ).slice(0, 5),
        topProducts: workOrdersArray.slice(0, 3),
        stats,
        jobCardStats,
        inventoryStats,
        totalJobCards: jobCardsArray.length,
        totalInventoryValue,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      });

      // ─── Set Recent Data ──────────────────────────────────────────────────
      setRecentJobCards(jobCardsArray.slice(0, 5));
      setRecentInventory(inventoryArray.slice(0, 5));
      
      // ─── Set BOMs for Production Capacity ──────────────────────────────
      setBoms(bomsArray);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Production Capacity Check handlers ──────────────────────────────

  const handleBomSelect = async (id: string) => {
    setSelectedBomId(id);
    setProducible(null);
    if (!id) return;

    setBomLoading(true);
    try {
      const response = await api.get(`/bom/${id}`);
      if (response.data.success === 1) {
        calculateProducible(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching BOM details:", error);
    } finally {
      setBomLoading(false);
    }
  };

  const calculateProducible = (data: any) => {
    const bomQty = data.bom?.quantity || 1;
    const items = data.items || [];
  
    if (items.length === 0) {
      setProducible({ maxUnits: 0, bottleneck: "No raw materials", items: [] });
      return;
    }
  
    let maxUnits = Infinity;
    let bottleneck = "";
  
    const rows: ProducibleItemRow[] = items.map((item: any) => {
      const requiredPerUnit = (item.qty || 0) / bomQty;
  
      // Sum actual physical stock across all warehouses
      const warehouseStock = Array.isArray(item.stock_by_warehouse)
        ? item.stock_by_warehouse.reduce((sum: number, w: any) => sum + (w.actual_qty || 0), 0)
        : 0;
  
      const available = warehouseStock || item.actual_qty || item.total_available_stock || 0;
      const possible = requiredPerUnit > 0 ? Math.floor(available / requiredPerUnit) : Infinity;
  
      if (possible < maxUnits) {
        maxUnits = possible;
        bottleneck = item.item_name || item.item_code;
      }
  
      return {
        name: item.item_name || item.item_code,
        required: requiredPerUnit,
        available,
        possible: possible === Infinity ? 0 : possible,
        warehouse: item.source_warehouse || "Unknown"
      };
    });
  
    setProducible({
      maxUnits: maxUnits === Infinity ? 0 : maxUnits,
      bottleneck,
      items: rows,
    });
  };

  // ─── Navigation Handlers ──────────────────────────────────────────────
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // ─── Stat Cards Configuration ─────────────────────────────────────────


  const quickActions = [
    { id: "new-wo", label: "New Work Order", icon: <FaPlus />, path: "/work-order/new" },
    { id: "job-list", label: "Job Cards", icon: <FaTasks />, path: "/job-card" },
    { id: "wo-list", label: "Work Orders", icon: <FaIndustry />, path: "/work-order" },
    { id: "bom", label: "BOM Listing", icon: <BsGear />, path: "/bom" },
    { id: "inventory", label: "Inventory", icon: <FaWarehouse />, path: "/InventoryList" },
  ];

  // ─── Status Color Mapping ─────────────────────────────────────────────
  const statusColors: Record<string, string> = {
    'Draft': '#94a3b8',
    'Open': '#f59e0b',
    'Not Started': '#94a3b8',
    'In Process': '#3b82f6',
    'Completed': '#22c55e',
    'Stopped': '#ef4444',
    'On Hold': '#8b5cf6',
    'Pending': '#f59e0b'
  };

  return (
    <div className={`dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🏭 Manufacturing Dashboard</h1>
          <p className="header-subtitle">
            Real-time production overview · {dashboardData.totalWorkOrders} orders · {dashboardData.totalJobCards} job cards
          </p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/work-order/new")}>
            <FaPlus /> New Work Order
          </button>
         
        </div>
      </div>

    

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Status Distribution - Work Orders */}
        <div className="card status-distribution">
          <div className="card-header">
            <h3>Work Order Status Distribution</h3>
            <span className="badge">{dashboardData.totalWorkOrders} Total</span>
          </div>
          <div className="status-bars">
            {Object.entries({
              'Draft': dashboardData.stats.draft,
              'Open': dashboardData.stats.open,
              'In Process': dashboardData.stats.inProcess,
              'Completed': dashboardData.stats.completed,
              'Stopped': dashboardData.stats.stopped,
              'On Hold': dashboardData.stats.onHold
            }).filter(([_, value]) => value > 0).map(([key, value]) => {
              const percentage = dashboardData.stats.total > 0 
                ? Math.round((value / dashboardData.stats.total) * 100) 
                : 0;
              const colorKey = key === 'In Process' ? 'inProcess' : key;
              return (
                <div key={key} className="status-item">
                  <div className="status-label">
                    <span className={`status-dot status-${colorKey.toLowerCase().replace(' ', '')}`}></span>
                    <span>{key}</span>
                    <span className="status-count">{value}</span>
                  </div>
                  <div className="status-bar-track">
                    <div 
                      className="status-bar-fill" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: statusColors[key] || '#3b82f6' 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card quick-actions">
          <div className="card-header">
            <h3>Quick Actions</h3>
            <span className="badge">Favorites</span>
          </div>
          <div className="actions-grid">
            {quickActions.map((action) => (
              <button 
                key={action.id}
                className="action-btn"
                onClick={() => handleNavigate(action.path)}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Production Capacity Check */}
        <div className="card produce-check">
          <div className="card-header">
            <h3>Production Capacity Check</h3>
            <span className="badge">Live Stock</span>
          </div>

          <select
            className="produce-select"
            value={selectedBomId}
            onChange={(e) => handleBomSelect(e.target.value)}
          >
            <option value="">Select a product (BOM)...</option>
            {boms.map((b) => (
              <option key={b.id} value={b.id}>
                {b.item_name || b.item} (Qty {b.quantity})
              </option>
            ))}
          </select>

          {bomLoading && <div className="produce-loading">Checking stock...</div>}

          {producible && !bomLoading && (
            <>
              <div className="produce-result">
                <div className="produce-result-icon"><FaBoxes /></div>
                <div>
                  <div className="produce-result-value">{producible.maxUnits} units</div>
                  <div className="produce-result-label">
                    can be made from current stock
                    {producible.maxUnits > 0 && producible.bottleneck && (
                      <> · limited by <strong>{producible.bottleneck}</strong></>
                    )}
                  </div>
                </div>
              </div>

              <div className="produce-items">
                {producible.items.map((row, idx) => (
                  <div key={idx} className="produce-item-row">
                    <span className="produce-item-name">{row.name}</span>
                    <span className="produce-item-stock">
                      {row.available} avail · {row.required.toFixed(2)}/unit
                    </span>
                    <span
                      className={`produce-item-badge ${
                        row.possible === producible.maxUnits && producible.maxUnits > 0 ? "is-bottleneck" : ""
                      }`}
                    >
                      {row.possible} pcs
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Job Card Status */}
        <div className="card job-card-status">
          <div className="card-header">
            <h3>Job Card Status</h3>
            <button className="view-all" onClick={() => handleNavigate("/job-card")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="status-bars">
            {Object.entries({
              'Open': dashboardData.jobCardStats.open,
              'In Process': dashboardData.jobCardStats.inProcess,
              'Completed': dashboardData.jobCardStats.completed,
              'Stopped': dashboardData.jobCardStats.stopped
            }).filter(([_, value]) => value > 0).map(([key, value]) => {
              const percentage = dashboardData.jobCardStats.total > 0 
                ? Math.round((value / dashboardData.jobCardStats.total) * 100) 
                : 0;
              const colorKey = key === 'In Process' ? 'inProcess' : key;
              return (
                <div key={key} className="status-item">
                  <div className="status-label">
                    <span className={`status-dot status-${colorKey.toLowerCase().replace(' ', '')}`}></span>
                    <span>{key}</span>
                    <span className="status-count">{value}</span>
                  </div>
                  <div className="status-bar-track">
                    <div 
                      className="status-bar-fill" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: statusColors[key] || '#3b82f6' 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="job-card-summary">
            <div className="summary-item">
              <span className="summary-label">Total Job Cards</span>
              <span className="summary-value">{dashboardData.jobCardStats.total}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completion Rate</span>
              <span className="summary-value">
                {dashboardData.jobCardStats.total > 0 
                  ? Math.round((dashboardData.jobCardStats.completed / dashboardData.jobCardStats.total) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card recent-activity">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <button className="view-all" onClick={() => handleNavigate("/work-order")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="activity-list">
            {loading ? (
              <div className="activity-item">Loading...</div>
            ) : dashboardData.recentActivity.length === 0 ? (
              <div className="activity-item">No recent activity</div>
            ) : (
              dashboardData.recentActivity.map((activity: any, index: number) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon status-${activity.status?.toLowerCase().replace(' ', '') || 'pending'}`}>
                    {activity.status === "Completed" ? <FaCheckCircle /> : 
                     activity.status === "In Process" ? <FaHourglassHalf /> :
                     activity.status === "Open" ? <FaPlay /> :
                     <FaClock />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">
                      {activity.production_item || activity.item_name || activity.name || `WO-${activity.id}`}
                      {activity.work_order && <span className="activity-wo"> (WO: {activity.work_order})</span>}
                    </div>
                    <div className="activity-meta">
                      <span className="activity-status" style={{ 
                        backgroundColor: statusColors[activity.status] || '#3b82f6' 
                      }}>
                        {activity.status || 'Unknown'}
                      </span>
                      <span className="activity-type">
                        {activity.work_order ? 'Job Card' : 'Work Order'}
                      </span>
                      <span className="activity-date">
                        {activity.modified ? new Date(activity.modified).toLocaleDateString() : 
                         activity.creation ? new Date(activity.creation).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                  <div className="activity-qty">
                    Qty: {activity.qty || activity.for_quantity || activity.requested_qty || 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manufacturing Metrics */}
        <div className="card metrics">
          <div className="card-header">
            <h3>Manufacturing Metrics</h3>
            <span className="badge">Live</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaRocket /></div>
              <div className="metric-info">
                <span className="metric-label">Total Produced</span>
                <span className="metric-value">{dashboardData.totalProduced.toLocaleString()} units</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaChartLine /></div>
              <div className="metric-info">
                <span className="metric-label">Completion Rate</span>
                <span className="metric-value">{dashboardData.completionRate}%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaTasks /></div>
              <div className="metric-info">
                <span className="metric-label">Active Job Cards</span>
                <span className="metric-value">
                  {dashboardData.jobCardStats.open + dashboardData.jobCardStats.inProcess}
                </span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaDollarSign /></div>
              <div className="metric-info">
                <span className="metric-label">Inventory Value</span>
                <span className="metric-value">₹{(dashboardData.totalInventoryValue / 100000).toFixed(1)}L</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaBoxes /></div>
              <div className="metric-info">
                <span className="metric-label">Inventory Items</span>
                <span className="metric-value">{dashboardData.inventoryStats.totalItems}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaIndustry /></div>
              <div className="metric-info">
                <span className="metric-label">Raw Materials</span>
                <span className="metric-value">{dashboardData.inventoryStats.rawMaterialItems}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaCheckCircle /></div>
              <div className="metric-info">
                <span className="metric-label">Finished Goods</span>
                <span className="metric-value">{dashboardData.inventoryStats.finishedGoodsItems}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaExclamationTriangle /></div>
              <div className="metric-info">
                <span className="metric-label">Low Stock Items</span>
                <span className="metric-value" style={{ color: dashboardData.inventoryStats.lowStockItems > 0 ? '#ef4444' : '#22c55e' }}>
                  {dashboardData.inventoryStats.lowStockItems}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Work Orders */}
        <div className="card priority-list">
          <div className="card-header">
            <h3>Priority Work Orders</h3>
            <span className="badge">Urgent</span>
          </div>
          <div className="priority-items">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity
                .filter((a: any) => a.status !== 'Completed' && a.status !== 'Stopped')
                .slice(0, 4)
                .map((activity: any, index: number) => (
                  <div 
                    key={index} 
                    className="priority-item" 
                    onClick={() => handleNavigate(`/work-order/${activity.id}`)}
                  >
                    <div className={`priority-indicator ${activity.status === 'Open' ? 'high' : 'medium'}`}></div>
                    <div className="priority-content">
                      <div className="priority-title">{activity.production_item || activity.item_name || `WO-${activity.id}`}</div>
                      <div className="priority-meta">
                        {activity.status} · Qty: {activity.qty || activity.for_quantity || 0}
                        {activity.work_order && ` · Job Card: ${activity.work_order}`}
                      </div>
                    </div>
                    <button className="priority-view" onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(`/work-order/${activity.id}`);
                    }}>
                      View →
                    </button>
                  </div>
                ))
            ) : (
              <div className="priority-item">
                <div className="priority-indicator low"></div>
                <div className="priority-content">
                  <div className="priority-title">No urgent orders</div>
                  <div className="priority-meta">All orders are on track</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Inventory */}
        <div className="card recent-inventory">
          <div className="card-header">
            <h3>Recent Inventory Updates</h3>
            <button className="view-all" onClick={() => handleNavigate("/InventoryList")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="inventory-list">
            {loading ? (
              <div className="inventory-item">Loading...</div>
            ) : recentInventory.length === 0 ? (
              <div className="inventory-item">No inventory data</div>
            ) : (
              recentInventory.map((item: any) => (
                <div key={item.id} className="inventory-item">
                  <div className="inventory-info">
                    <div className="inventory-name">{item.item_name}</div>
                    <div className="inventory-meta">
                      <span className="inventory-code">{item.item_code}</span>
                      <span className="inventory-group">{item.item_group}</span>
                    </div>
                  </div>
                  <div className="inventory-stock">
                    <span className="inventory-qty">{item.actual_qty || 0}</span>
                    <span className="inventory-uom">{item.stock_uom}</span>
                  </div>
                  <div className="inventory-warehouse">
                    {item.warehouse_name}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}