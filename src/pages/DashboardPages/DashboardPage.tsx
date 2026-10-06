// DashboardPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes,
  FaClock,
  FaChartLine,
  FaIndustry,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlay,
  FaWarehouse,
  FaPlus,
  FaArrowRight,
  FaDollarSign,
  FaRocket,
  FaTasks,
  FaHourglassHalf,
} from "react-icons/fa";
import { BsGear } from "react-icons/bs";
import "./DashboardPage.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";

// ============================================================
// TYPES
// ============================================================

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

  // IMPORTANT:
  // open includes Open + Not Started + In Process
  open: number;

  // Kept separately for reference / other dashboard usage
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

const statusColors: Record<string, string> = {
  Draft: "#94a3b8",
  Open: "#3b82f6",
  "In Process": "#f59e0b",
  Completed: "#22c55e",
  Stopped: "#ef4444",
  "On Hold": "#8b5cf6",
};

// ============================================================
// COMPONENT
// ============================================================

export default function DashboardPage() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const quickActions = [
    { id: "work-order", label: "New Work Order", path: "/work-order/new", icon: <FaPlus /> },
    { id: "job-cards", label: "Job Cards", path: "/job-card", icon: <FaTasks /> },
    { id: "inventory", label: "Inventory", path: "/inventory", icon: <FaWarehouse /> },
    { id: "bom", label: "Bill of Materials", path: "/bom", icon: <BsGear /> },
  ];

  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] =
    useState<DashboardData>({
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
        onHold: 0,
      },

      jobCardStats: {
        total: 0,
        open: 0,
        inProcess: 0,
        completed: 0,
        stopped: 0,
        pending: 0,
      },

      inventoryStats: {
        totalItems: 0,
        totalValue: 0,
        rawMaterialItems: 0,
        finishedGoodsItems: 0,
        wipItems: 0,
        lowStockItems: 0,
        totalQuantity: 0,
      },

      totalJobCards: 0,
      totalInventoryValue: 0,
      completionRate: 0,
    });

  // ============================================================
  // PRODUCTION CAPACITY STATE
  // ============================================================

  const [boms, setBoms] = useState<any[]>([]);
  const [selectedBomId, setSelectedBomId] = useState<string>("");
  const [bomLoading, setBomLoading] = useState(false);
  const [producible, setProducible] =
    useState<ProducibleResult | null>(null);

  const [, setRecentJobCards] = useState<any[]>([]);
  const [, setRecentInventory] = useState<any[]>([]);

  // ============================================================
  // FETCH DATA
  // ============================================================

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    try {
      // Fetch all APIs in parallel
      const [
        woRes,
        jobRes,
        invRes,
        bomRes,
      ] = await Promise.all([
        api.get("/work-order?limit=1000"),
        api.get("/job-card?limit=1000"),
        api.get("/inventory?limit=10000"),
        api.get("/bom?limit=1000"),
      ]);

      // ========================================================
      // WORK ORDERS
      // ========================================================

      const workOrders =
        woRes.data?.data?.records ||
        woRes.data?.data ||
        [];

      const workOrdersArray = Array.isArray(workOrders)
        ? workOrders
        : [];

      // ========================================================
      // JOB CARDS
      // ========================================================

      const jobCards =
        jobRes.data?.data?.records ||
        jobRes.data?.data ||
        [];

      const jobCardsArray = Array.isArray(jobCards)
        ? jobCards
        : [];

      // ========================================================
      // INVENTORY
      // ========================================================

      const inventory =
        invRes.data?.data?.records ||
        invRes.data?.data ||
        [];

      const inventoryArray = Array.isArray(inventory)
        ? inventory
        : [];

      // ========================================================
      // BOM
      // ========================================================

      const bomsData =
        bomRes.data?.data?.records ||
        bomRes.data?.data ||
        [];

      const bomsArray = Array.isArray(bomsData)
        ? bomsData
        : [];

      // ========================================================
      // WORK ORDER STATS
      // ========================================================

      const stats: WorkOrderStats = {
        total: workOrdersArray.length,

        draft: workOrdersArray.filter(
          (o: any) => o.status === "Draft"
        ).length,

        open: workOrdersArray.filter(
          (o: any) =>
            o.status === "Open" ||
            o.status === "Not Started"
        ).length,

        inProcess: workOrdersArray.filter(
          (o: any) => o.status === "In Process"
        ).length,

        completed: workOrdersArray.filter(
          (o: any) => o.status === "Completed"
        ).length,

        stopped: workOrdersArray.filter(
          (o: any) => o.status === "Stopped"
        ).length,

        overdue: workOrdersArray.filter((o: any) => {
          if (
            o.planned_end_date &&
            o.status !== "Completed"
          ) {
            return (
              new Date(o.planned_end_date) <
              new Date()
            );
          }

          return false;
        }).length,

        onHold: workOrdersArray.filter(
          (o: any) => o.status === "On Hold"
        ).length,
      };

      // ========================================================
      // TOTAL PRODUCED
      // ========================================================

      const totalProduced =
        workOrdersArray.reduce(
          (sum: number, o: any) =>
            sum + (o.produced_qty || 0),
          0
        );

      // ========================================================
      // TOTAL VALUE
      // ========================================================

      const totalValue =
        workOrdersArray.reduce(
          (sum: number, o: any) =>
            sum + (o.total_operating_cost || 0),
          0
        );

      // ========================================================
      // JOB CARD STATS
      //
      // IMPORTANT CHANGE:
      //
      // OPEN = Open + Not Started + In Process
      //
      // Therefore "In Process" is included in the Open count.
      // ========================================================

      const jobCardStats: JobCardStats = {
        total: jobCardsArray.length,

        open: jobCardsArray.filter(
          (j: any) =>
            j.status === "Open" ||
            j.status === "Not Started" ||
            j.status === "In Process"
        ).length,

        // Keep this separately in case it is needed elsewhere.
        inProcess: jobCardsArray.filter(
          (j: any) => j.status === "In Process"
        ).length,

        completed: jobCardsArray.filter(
          (j: any) => j.status === "Completed"
        ).length,

        stopped: jobCardsArray.filter(
          (j: any) => j.status === "Stopped"
        ).length,

        pending: jobCardsArray.filter(
          (j: any) => j.status === "Pending"
        ).length,
      };

      // ========================================================
      // INVENTORY STATS
      // ========================================================

      const rawMaterialItems =
        inventoryArray.filter(
          (i: any) =>
            i.item_group === "Raw Material" ||
            i.item_group?.includes("Raw")
        ).length;

      const finishedGoodsItems =
        inventoryArray.filter(
          (i: any) =>
            i.item_group === "Finished Goods" ||
            i.item_group?.includes("Finished") ||
            i.item_group === "Product"
        ).length;

      const wipItems =
        inventoryArray.filter(
          (i: any) =>
            i.warehouse_name === "Work In Progress" ||
            i.item_group === "WIP"
        ).length;

      const totalInventoryValue =
        inventoryArray.reduce(
          (sum: number, i: any) =>
            sum + (i.stock_value || 0),
          0
        );

      const totalQuantity =
        inventoryArray.reduce(
          (sum: number, i: any) =>
            sum + (i.actual_qty || 0),
          0
        );

      const lowStockItems =
        inventoryArray.filter(
          (i: any) => (i.actual_qty || 0) < 10
        ).length;

      const inventoryStats: InventoryStats = {
        totalItems: inventoryArray.length,
        totalValue: totalInventoryValue,
        rawMaterialItems,
        finishedGoodsItems,
        wipItems,
        lowStockItems,
        totalQuantity,
      };

      // ========================================================
      // DASHBOARD DATA
      // ========================================================

      setDashboardData({
        totalProduced,
        totalValue,

        efficiency:
          stats.total > 0
            ? Math.round(
                (stats.completed / stats.total) * 100
              )
            : 0,

        openWorkOrders: stats.open,

        wipWorkOrders: stats.inProcess,

        totalWorkOrders: stats.total,

        overdueOrders: stats.overdue,

        recentActivity: [
          ...workOrdersArray.slice(0, 3),
          ...jobCardsArray.slice(0, 2),
        ]
          .sort(
            (a, b) =>
              new Date(
                b.modified || b.creation
              ).getTime() -
              new Date(
                a.modified || a.creation
              ).getTime()
          )
          .slice(0, 5),

        topProducts:
          workOrdersArray.slice(0, 3),

        stats,

        jobCardStats,

        inventoryStats,

        totalJobCards:
          jobCardsArray.length,

        totalInventoryValue,

        completionRate:
          stats.total > 0
            ? Math.round(
                (stats.completed / stats.total) * 100
              )
            : 0,
      });

      // ========================================================
      // RECENT DATA
      // ========================================================

      setRecentJobCards(
        jobCardsArray.slice(0, 5)
      );

      setRecentInventory(
        inventoryArray.slice(0, 5)
      );

      // ========================================================
      // BOMS
      // ========================================================

      setBoms(bomsArray);
    } catch (error) {
      console.error(
        "Error fetching dashboard data:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // BOM SELECTION
  // ============================================================

  const handleBomSelect = async (
    id: string
  ) => {
    setSelectedBomId(id);
    setProducible(null);

    if (!id) return;

    setBomLoading(true);

    try {
      const response =
        await api.get(`/bom/${id}`);

      if (response.data.success === 1) {
        calculateProducible(
          response.data.data
        );
      }
    } catch (error) {
      console.error(
        "Error fetching BOM details:",
        error
      );
    } finally {
      setBomLoading(false);
    }
  };

  // ============================================================
  // CALCULATE PRODUCIBLE
  // ============================================================

  const calculateProducible = (
    data: any
  ) => {
    const bomQty = data.bom?.quantity || 1;
    const items = data.items || [];

    if (items.length === 0) {
      setProducible({
        maxUnits: 0,
        bottleneck: "No raw materials",
        items: [],
      });
      return;
    }

    let maxUnits = Infinity;
    let bottleneck = "";

    const rows: ProducibleItemRow[] = items.map((item: any) => {
      const requiredPerUnit = (item.qty || 0) / bomQty;

      const warehouseStock = Array.isArray(item.stock_by_warehouse)
        ? item.stock_by_warehouse.reduce(
            (sum: number, w: any) => sum + (w.actual_qty || 0),
            0
          )
        : 0;

      const available =
        warehouseStock || item.actual_qty || item.total_available_stock || 0;

      const possible =
        requiredPerUnit > 0 ? Math.floor(available / requiredPerUnit) : Infinity;

      if (possible < maxUnits) {
        maxUnits = possible;
        bottleneck = item.item_name || item.item_code || "Material";
      }

      return {
        name: item.item_name || item.item_code || "Material",
        required: requiredPerUnit,
        available,
        possible,
        warehouse: item.warehouse_name || item.warehouse || "",
      };
    });

    const finalMaxUnits =
      rows.length > 0
        ? rows.reduce((min, item) => Math.min(min, item.possible), Infinity)
        : 0;

    setProducible({
      maxUnits: Number.isFinite(finalMaxUnits) ? finalMaxUnits : 0,
      bottleneck: bottleneck || "No limitation detected",
      items: rows,
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`dashboard ${theme}`}>

      {/* ======================================================
          DASHBOARD HEADER
      ====================================================== */}
      <header className="dashboard-header">

        <div className="header-left">
          <div className="header-title-wrap">
            <div className="header-title-icon">
              <FaIndustry />
            </div>

            <div>
              <h1>Manufacturing Dashboard</h1>
              <p>
                Production overview, work orders, job cards and inventory
              </p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button
            className="btn-secondary"
            onClick={() => fetchAllData()}
            disabled={loading}
          >
            <FaChartLine />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="btn-primary"
            onClick={() => handleNavigate("/work-order/new")}
          >
            <FaPlus />
            New Work Order
          </button>
        </div>

      </header>

      {/* ======================================================
          KPI OVERVIEW
      ====================================================== */}
      <section className="dashboard-kpis">

        {/* TOTAL WORK ORDERS */}
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon">
            <FaIndustry />
          </div>

          <div className="kpi-content">
            <span className="kpi-label">
              Total Work Orders
            </span>

            <strong className="kpi-value">
              {dashboardData.totalWorkOrders.toLocaleString()}
            </strong>

            <span className="kpi-description">
              All production orders
            </span>
          </div>
        </div>

        {/* ACTIVE WORK ORDERS */}
        <div className="kpi-card kpi-orange">
          <div className="kpi-icon">
            <FaPlay />
          </div>

          <div className="kpi-content">
            <span className="kpi-label">
              Active Work Orders
            </span>

            <strong className="kpi-value">
              {dashboardData.openWorkOrders.toLocaleString()}
            </strong>

            <span className="kpi-description">
              Open / Not Started
            </span>
          </div>
        </div>

        {/* WIP */}
        <div className="kpi-card kpi-purple">
          <div className="kpi-icon">
            <FaHourglassHalf />
          </div>

          <div className="kpi-content">
            <span className="kpi-label">
              Work In Progress
            </span>

            <strong className="kpi-value">
              {dashboardData.wipWorkOrders.toLocaleString()}
            </strong>

            <span className="kpi-description">
              Currently processing
            </span>
          </div>
        </div>

        {/* COMPLETION RATE */}
        <div className="kpi-card kpi-green">
          <div className="kpi-icon">
            <FaCheckCircle />
          </div>

          <div className="kpi-content">
            <span className="kpi-label">
              Completion Rate
            </span>

            <strong className="kpi-value">
              {dashboardData.completionRate}%
            </strong>

            <span className="kpi-description">
              Production completion
            </span>
          </div>
        </div>

        {/* TOTAL PRODUCED */}
        <div className="kpi-card kpi-cyan">
          <div className="kpi-icon">
            <FaRocket />
          </div>

          <div className="kpi-content">
            <span className="kpi-label">
              Total Produced
            </span>

            <strong className="kpi-value">
              {dashboardData.totalProduced.toLocaleString()}
            </strong>

            <span className="kpi-description">
              Units produced
            </span>
          </div>
        </div>

        {/* LOW STOCK */}
        <div className="kpi-card kpi-red">
          <div className="kpi-icon">
            <FaExclamationTriangle />
          </div>

          <div className="kpi-content">
            <span className="kpi-label">
              Low Stock
            </span>

            <strong className="kpi-value">
              {dashboardData.inventoryStats.lowStockItems}
            </strong>

            <span className="kpi-description">
              Items below threshold
            </span>
          </div>
        </div>

      </section>

      {/* ======================================================
          MAIN DASHBOARD GRID
      ====================================================== */}
      <div className="dashboard-grid">

        {/* ====================================================
            WORK ORDER STATUS
        ==================================================== */}
        <div className="card status-distribution">

          <div className="card-header">
            <div>
              <h3>Work Order Status</h3>
              <span className="card-subtitle">
                Current production order distribution
              </span>
            </div>

            <span className="badge">
              {dashboardData.totalWorkOrders} Total
            </span>
          </div>

          <div className="status-bars">

            {Object.entries({
              Draft: dashboardData.stats.draft,
              Open: dashboardData.stats.open,
              "In Process": dashboardData.stats.inProcess,
              Completed: dashboardData.stats.completed,
              Stopped: dashboardData.stats.stopped,
              "On Hold": dashboardData.stats.onHold,
            })
              .filter(([, value]) => value > 0)
              .map(([key, value]) => {

                const percentage =
                  dashboardData.stats.total > 0
                    ? Math.round((value / dashboardData.stats.total) * 100)
                    : 0;

                const colorKey = key === "In Process" ? "inProcess" : key;

                return (
                  <div key={key} className="status-item">
                    <div className="status-label">

                      <span
                        className={`status-dot status-${colorKey
                          .toLowerCase()
                          .replace(" ", "")}`}
                      />

                      <span className="status-name">{key}</span>

                      <span className="status-count">{value}</span>

                      <span className="status-percentage">{percentage}%</span>
                    </div>

                    <div className="status-bar-track">
                      <div
                        className="status-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: statusColors[key] || "#3b82f6",
                        }}
                      />
                    </div>
                  </div>
                );
              })}

          </div>
        </div>

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}
        <div className="card quick-actions">

          <div className="card-header">
            <div>
              <h3>Quick Actions</h3>
              <span className="card-subtitle">
                Frequently used manufacturing operations
              </span>
            </div>

            <span className="badge">Actions</span>
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
                <FaArrowRight className="action-arrow" />
              </button>
            ))}
          </div>

        </div>

        {/* ====================================================
            PRODUCTION CAPACITY
        ==================================================== */}
        <div className="card produce-check full-width-card">

          <div className="card-header">
            <div>
              <h3>Production Capacity Check</h3>
              <span className="card-subtitle">
                Check how many units can be produced using current stock
              </span>
            </div>

            <span className="badge live-badge">
              <span className="live-dot" />
              Live Stock
            </span>
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

          {bomLoading && (
            <div className="produce-loading">
              <span className="loading-spinner" />
              Checking current stock...
            </div>
          )}

          {producible && !bomLoading && (
            <>
              <div className="produce-result">
                <div className="produce-result-icon">
                  <FaBoxes />
                </div>

                <div className="produce-result-content">
                  <div className="produce-result-value">
                    {producible.maxUnits.toLocaleString()}
                    <span> units</span>
                  </div>

                  <div className="produce-result-label">
                    can be produced from current stock
                    {producible.maxUnits > 0 && producible.bottleneck && (
                      <>
                        {" "}• Limited by {" "}
                        <strong>{producible.bottleneck}</strong>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="produce-items">
                {producible.items.map((row, idx) => (
                  <div key={idx} className="produce-item-row">
                    <div className="produce-item-main">
                      <span className="produce-item-name">{row.name}</span>
                      <span className="produce-item-stock">
                        {row.available} available {" • "}
                        {row.required.toFixed(2)}/unit
                      </span>
                    </div>

                    <span
                      className={`produce-item-badge ${
                        row.possible === producible.maxUnits && producible.maxUnits > 0
                          ? "is-bottleneck"
                          : ""
                      }`}
                    >
                      {row.possible} pcs
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!bomLoading && !producible && !selectedBomId && (
            <div className="produce-empty">
              <FaBoxes />
              <span>Select a BOM to calculate production capacity</span>
            </div>
          )}

        </div>

        {/* ====================================================
            JOB CARD STATUS
        ==================================================== */}
        <div className="card job-card-status">

          <div className="card-header">
            <div>
              <h3>Job Card Status</h3>
              <span className="card-subtitle">
                Active, completed and stopped job cards
              </span>
            </div>

            <button className="view-all" onClick={() => handleNavigate("/job-card")}>
              View All
              <FaArrowRight />
            </button>
          </div>

          <div className="status-bars">
            {Object.entries({
              Open: dashboardData.jobCardStats.open,
              Completed: dashboardData.jobCardStats.completed,
              Stopped: dashboardData.jobCardStats.stopped,
            })
              .filter(([, value]) => value > 0)
              .map(([key, value]) => {
                const percentage =
                  dashboardData.jobCardStats.total > 0
                    ? Math.round((value / dashboardData.jobCardStats.total) * 100)
                    : 0;

                return (
                  <div key={key} className="status-item">
                    <div className="status-label">
                      <span
                        className={`status-dot status-${key
                          .toLowerCase()
                          .replace(" ", "")}`}
                      />

                      <span className="status-name">{key}</span>
                      <span className="status-count">{value}</span>
                      <span className="status-percentage">{percentage}%</span>
                    </div>

                    <div className="status-bar-track">
                      <div
                        className="status-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: statusColors[key] || "#3b82f6",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="job-card-summary">
            <div className="summary-item">
              <div className="summary-icon">
                <FaTasks />
              </div>

              <div>
                <span className="summary-label">Total Job Cards</span>
                <span className="summary-value">{dashboardData.jobCardStats.total}</span>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon">
                <FaCheckCircle />
              </div>

              <div>
                <span className="summary-label">Completion Rate</span>
                <span className="summary-value">
                  {dashboardData.jobCardStats.total > 0
                    ? Math.round(
                        (dashboardData.jobCardStats.completed /
                          dashboardData.jobCardStats.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ====================================================
            RECENT ACTIVITY
        ==================================================== */}
        <div className="card recent-activity">
          <div className="card-header">
            <div>
              <h3>Recent Activity</h3>
              <span className="card-subtitle">
                Latest work orders and job card updates
              </span>
            </div>

            <button className="view-all" onClick={() => handleNavigate("/work-order")}>
              View All
              <FaArrowRight />
            </button>
          </div>

          <div className="activity-list">
            {loading ? (
              <div className="activity-empty">
                <span className="loading-spinner" />
                Loading activity...
              </div>
            ) : dashboardData.recentActivity.length === 0 ? (
              <div className="activity-empty">
                <FaClock />
                <span>No recent activity</span>
              </div>
            ) : (
              dashboardData.recentActivity.map((activity: any, index: number) => (
                <div key={index} className="activity-item">
                  <div
                    className={`activity-icon status-${
                      activity.status?.toLowerCase().replace(" ", "") || "pending"
                    }`}
                  >
                    {activity.status === "Completed" ? (
                      <FaCheckCircle />
                    ) : activity.status === "In Process" ? (
                      <FaHourglassHalf />
                    ) : activity.status === "Open" ? (
                      <FaPlay />
                    ) : (
                      <FaClock />
                    )}
                  </div>

                  <div className="activity-content">
                    <div className="activity-title">
                      {activity.production_item ||
                        activity.item_name ||
                        activity.name ||
                        `WO-${activity.id}`}

                      {activity.work_order && (
                        <span className="activity-wo">
                          {" "}• WO: {activity.work_order}
                        </span>
                      )}
                    </div>

                    <div className="activity-meta">
                      <span
                        className="activity-status"
                        style={{
                          backgroundColor: statusColors[activity.status] || "#3b82f6",
                        }}
                      >
                        {activity.status || "Unknown"}
                      </span>

                      <span className="activity-type">
                        {activity.work_order ? "Job Card" : "Work Order"}
                      </span>

                      <span className="activity-date">
                        {activity.modified
                          ? new Date(activity.modified).toLocaleDateString()
                          : activity.creation
                          ? new Date(activity.creation).toLocaleDateString()
                          : ""}
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

        {/* ====================================================
            MANUFACTURING METRICS
        ==================================================== */}
        <div className="card metrics full-width-card">
          <div className="card-header">
            <div>
              <h3>Manufacturing Metrics</h3>
              <span className="card-subtitle">
                Production and inventory performance overview
              </span>
            </div>

            <span className="badge live-badge">
              <span className="live-dot" />
              Live
            </span>
          </div>

          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon">
                <FaRocket />
              </div>

              <div className="metric-info">
                <span className="metric-label">Total Produced</span>
                <span className="metric-value">
                  {dashboardData.totalProduced.toLocaleString()}
                  <small> units</small>
                </span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon">
                <FaChartLine />
              </div>

              <div className="metric-info">
                <span className="metric-label">Completion Rate</span>
                <span className="metric-value">{dashboardData.completionRate}%</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon">
                <FaTasks />
              </div>

              <div className="metric-info">
                <span className="metric-label">Active Job Cards</span>
                <span className="metric-value">{dashboardData.jobCardStats.open}</span>
                <small className="metric-hint">Includes Work In Progress</small>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon">
                <FaDollarSign />
              </div>

              <div className="metric-info">
                <span className="metric-label">Inventory Value</span>
                <span className="metric-value">
                  ₹{(dashboardData.totalInventoryValue / 100000).toFixed(1)}L
                </span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon">
                <FaBoxes />
              </div>

              <div className="metric-info">
                <span className="metric-label">Inventory Items</span>
                <span className="metric-value">{dashboardData.inventoryStats.totalItems}</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon">
                <FaIndustry />
              </div>

              <div className="metric-info">
                <span className="metric-label">Raw Materials</span>
                <span className="metric-value">{dashboardData.inventoryStats.rawMaterialItems}</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon">
                <FaCheckCircle />
              </div>

              <div className="metric-info">
                <span className="metric-label">Finished Goods</span>
                <span className="metric-value">{dashboardData.inventoryStats.finishedGoodsItems}</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon">
                <FaExclamationTriangle />
              </div>

              <div className="metric-info">
                <span className="metric-label">Low Stock Items</span>

                <span
                  className="metric-value"
                  style={{
                    color:
                      dashboardData.inventoryStats.lowStockItems > 0 ? "#ef4444" : "#22c55e",
                  }}
                >
                  {dashboardData.inventoryStats.lowStockItems}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}