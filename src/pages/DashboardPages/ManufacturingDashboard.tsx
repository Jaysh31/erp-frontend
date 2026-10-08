
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaBoxes,
  FaClock,

  FaIndustry,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlay,
  FaWarehouse,
  FaPlus,
  FaArrowRight,
  FaTasks,
  FaHourglassHalf,
  FaClipboardList,
  FaCube,
  FaCubes,
  FaSyncAlt,

} from "react-icons/fa";

import {
  BsGear,
  BsBoxSeam,
  BsClipboardCheck,
} from "react-icons/bs";

import "./Dashboard.css";
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

// ============================================================
// COLORS
// ============================================================

const statusColors: Record<string, string> = {
  Draft: "#94a3b8",
  Open: "#3b82f6",
  "In Process": "#f59e0b",
  Completed: "#22c55e",
  Stopped: "#ef4444",
  "On Hold": "#8b5cf6",
  Pending: "#f59e0b",
};

// Soft/light backgrounds.
// These are intentionally similar to .qa-purple { background: #f1eafe; }
const statusLightColors: Record<string, string> = {
  Draft: "#f1f5f9",
  Open: "#eaf2ff",
  "In Process": "#fff7df",
  Completed: "#eaf8ef",
  Stopped: "#feecec",
  "On Hold": "#f1eafe",
  Pending: "#fff7df",
};

// ============================================================
// COMPONENT
// ============================================================

export default function DashboardPage() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();

  // ==========================================================
  // QUICK ACTIONS
  // ==========================================================

  const quickActions = [
    {
      id: "bom",
      label: "Create BOM",
      description: "Bill of Materials",
      path: "/bom/new",
      icon: <BsGear />,
      className: "qa-purple",
    },
    {
      id: "work-order",
      label: "Create Work Order",
      description: "Start production",
      path: "/work-order/new",
      icon: <FaIndustry />,
      className: "qa-blue",
    },
    {
      id: "job-card",
      label: "Job Cards",
      description: "Manage job cards",
      path: "/job-card",
      icon: <BsClipboardCheck />,
      className: "qa-green",
    },
    {
      id: "stock-entry",
      label: "Stock Entry",
      description: "Material movement",
      path: "/stock-entry",
      icon: <BsBoxSeam />,
      className: "qa-orange",
    },
    {
      id: "inventory",
      label: "Inventory",
      description: "View stock",
      path: "/InventoryList",
      icon: <FaWarehouse />,
      className: "qa-indigo",
    },
  ];

  // ==========================================================
  // STATE
  // ==========================================================

  const [loading, setLoading] = useState(true);

  const [selectedWorkOrderStatus, setSelectedWorkOrderStatus] =
    useState<string | null>(null);

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

  // ==========================================================
  // BOM CAPACITY
  // ==========================================================

  const [boms, setBoms] = useState<any[]>([]);
  const [selectedBomId, setSelectedBomId] = useState("");
  const [bomLoading, setBomLoading] = useState(false);
  const [producible, setProducible] =
    useState<ProducibleResult | null>(null);

  // ==========================================================
  // FETCH ALL DATA
  // ==========================================================

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    try {
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

      // ======================================================
      // WORK ORDERS
      // ======================================================

      const workOrders =
        woRes.data?.data?.records ||
        woRes.data?.data ||
        [];

      const workOrdersArray = Array.isArray(workOrders)
        ? workOrders
        : [];

      // ======================================================
      // JOB CARDS
      // ======================================================

      const jobCards =
        jobRes.data?.data?.records ||
        jobRes.data?.data ||
        [];

      const jobCardsArray = Array.isArray(jobCards)
        ? jobCards
        : [];

      // ======================================================
      // INVENTORY
      // ======================================================

      const inventory =
        invRes.data?.data?.records ||
        invRes.data?.data ||
        [];

      const inventoryArray = Array.isArray(inventory)
        ? inventory
        : [];

      // ======================================================
      // BOM
      // ======================================================

      const bomsData =
        bomRes.data?.data?.records ||
        bomRes.data?.data ||
        [];

      const bomsArray = Array.isArray(bomsData)
        ? bomsData
        : [];

      // ======================================================
      // WORK ORDER STATS
      // ======================================================

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

      // ======================================================
      // TOTAL PRODUCED
      // ======================================================

      const totalProduced =
        workOrdersArray.reduce(
          (sum: number, o: any) =>
            sum + Number(o.produced_qty || 0),
          0
        );

      // ======================================================
      // TOTAL VALUE
      // ======================================================

      const totalValue =
        workOrdersArray.reduce(
          (sum: number, o: any) =>
            sum + Number(o.total_operating_cost || 0),
          0
        );

      // ======================================================
      // JOB CARD STATS
      // ======================================================

      const jobCardStats: JobCardStats = {
        total: jobCardsArray.length,

        open: jobCardsArray.filter(
          (j: any) =>
            j.status === "Open" ||
            j.status === "Not Started" ||
            j.status === "In Process"
        ).length,

        inProcess: jobCardsArray.filter(
          (j: any) =>
            j.status === "In Process"
        ).length,

        completed: jobCardsArray.filter(
          (j: any) =>
            j.status === "Completed"
        ).length,

        stopped: jobCardsArray.filter(
          (j: any) =>
            j.status === "Stopped"
        ).length,

        pending: jobCardsArray.filter(
          (j: any) =>
            j.status === "Pending"
        ).length,
      };

      // ======================================================
      // INVENTORY STATS
      // ======================================================

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
            i.warehouse_name ===
              "Work In Progress" ||
            i.item_group === "WIP"
        ).length;

      const totalInventoryValue =
        inventoryArray.reduce(
          (sum: number, i: any) =>
            sum + Number(i.stock_value || 0),
          0
        );

      const totalQuantity =
        inventoryArray.reduce(
          (sum: number, i: any) =>
            sum + Number(i.actual_qty || 0),
          0
        );

      const lowStockItems =
        inventoryArray.filter(
          (i: any) =>
            Number(i.actual_qty || 0) < 10
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

      // ======================================================
      // RECENT ACTIVITY
      // ======================================================

      const recentActivity = [
        ...workOrdersArray.slice(0, 5),
        ...jobCardsArray.slice(0, 5),
      ]
        .sort(
          (a: any, b: any) =>
            new Date(
              b.modified || b.creation
            ).getTime() -
            new Date(
              a.modified || a.creation
            ).getTime()
        )
        .slice(0, 6);

      // ======================================================
      // FINAL DASHBOARD DATA
      // ======================================================

      const completionRate =
        stats.total > 0
          ? Math.round(
              (stats.completed / stats.total) *
                100
            )
          : 0;

      setDashboardData({
        totalProduced,
        totalValue,

        efficiency: completionRate,

        openWorkOrders: stats.open,

        wipWorkOrders: stats.inProcess,

        totalWorkOrders: stats.total,

        overdueOrders: stats.overdue,

        recentActivity,

        topProducts:
          workOrdersArray.slice(0, 5),

        stats,

        jobCardStats,

        inventoryStats,

        totalJobCards:
          jobCardsArray.length,

        totalInventoryValue,

        completionRate,
      });

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

  // ==========================================================
  // BOM SELECTION
  // ==========================================================

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

  // ==========================================================
  // CALCULATE PRODUCTION CAPACITY
  // ==========================================================

  const calculateProducible = (
    data: any
  ) => {
    const bomQty =
      data.bom?.quantity || 1;

    const items = data.items || [];

    if (items.length === 0) {
      setProducible({
        maxUnits: 0,
        bottleneck:
          "No raw materials",
        items: [],
      });

      return;
    }

    let maxUnits = Infinity;
    let bottleneck = "";

    const rows: ProducibleItemRow[] =
      items.map((item: any) => {
        const requiredPerUnit =
          Number(item.qty || 0) /
          Number(bomQty);

        const warehouseStock =
          Array.isArray(
            item.stock_by_warehouse
          )
            ? item.stock_by_warehouse.reduce(
                (
                  sum: number,
                  w: any
                ) =>
                  sum +
                  Number(
                    w.actual_qty || 0
                  ),
                0
              )
            : 0;

        const available =
          warehouseStock ||
          Number(
            item.actual_qty || 0
          ) ||
          Number(
            item.total_available_stock ||
              0
          );

        const possible =
          requiredPerUnit > 0
            ? Math.floor(
                available /
                  requiredPerUnit
              )
            : 0;

        if (possible < maxUnits) {
          maxUnits = possible;

          bottleneck =
            item.item_name ||
            item.item_code ||
            "Material";
        }

        return {
          name:
            item.item_name ||
            item.item_code ||
            "Material",

          required:
            requiredPerUnit,

          available,

          possible,

          warehouse:
            item.warehouse_name ||
            item.warehouse ||
            "",
        };
      });

    const finalMaxUnits =
      rows.length > 0
        ? rows.reduce(
            (
              min,
              item
            ) =>
              Math.min(
                min,
                item.possible
              ),
            Infinity
          )
        : 0;

    setProducible({
      maxUnits:
        Number.isFinite(
          finalMaxUnits
        )
          ? finalMaxUnits
          : 0,

      bottleneck:
        bottleneck ||
        "No limitation detected",

      items: rows,
    });
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleNavigate = (
    path: string
  ) => {
    navigate(path);
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getPercentage = (
    value: number,
    total: number
  ) => {
    if (!total) return 0;

    return Math.round(
      (value / total) * 100
    );
  };

  const formatDate = (
    value: any
  ) => {
    if (!value) return "";

    return new Date(
      value
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getActivityIcon = (
    status?: string
  ) => {
    switch (status) {
      case "Completed":
        return <FaCheckCircle />;

      case "In Process":
        return <FaHourglassHalf />;

      case "Open":
        return <FaPlay />;

      case "Stopped":
        return <FaExclamationTriangle />;

      default:
        return <FaClock />;
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className={`dashboard-page ${theme}`}
    >
      {/* ====================================================
          TOP HEADER
      ==================================================== */}

      <header className="manufacturing-header">
        <div className="header-heading">
          <div className="header-heading-icon">
            <FaIndustry />
          </div>

          <div>
            <h1>
              Manufacturing Dashboard
            </h1>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={fetchAllData}
            disabled={loading}
          >
            <FaSyncAlt
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            className="primary-btn"
            onClick={() =>
              handleNavigate(
                "/work-order/new"
              )
            }
          >
            <FaPlus />
            New Work Order
          </button>
        </div>
      </header>

      {/* ====================================================
          KPI CARDS
      ==================================================== */}

      <section className="manufacturing-kpis">

        <div
          className="modern-kpi kpi-purple"
          onClick={() =>
            handleNavigate("/bom")
          }
        >
          <div className="kpi-top">
            <div className="kpi-icon">
              <BsGear />
            </div>

            <FaArrowRight className="kpi-arrow" />
          </div>

          <span className="kpi-label">
            BOM
          </span>

          <strong>
            {boms.length}
          </strong>

          <small>
            Bill of Materials
          </small>
        </div>

        <div
          className="modern-kpi kpi-blue"
          onClick={() =>
            handleNavigate(
              "/work-order"
            )
          }
        >
          <div className="kpi-top">
            <div className="kpi-icon">
              <FaClipboardList />
            </div>

            <FaArrowRight className="kpi-arrow" />
          </div>

          <span className="kpi-label">
            Work Orders
          </span>

          <strong>
            {dashboardData.totalWorkOrders}
          </strong>

          <small>
            {dashboardData.openWorkOrders} active
          </small>
        </div>

        <div
          className="modern-kpi kpi-green"
          onClick={() =>
            handleNavigate(
              "/job-card"
            )
          }
        >
          <div className="kpi-top">
            <div className="kpi-icon">
              <BsClipboardCheck />
            </div>

            <FaArrowRight className="kpi-arrow" />
          </div>

          <span className="kpi-label">
            Job Cards
          </span>

          <strong>
            {dashboardData.totalJobCards}
          </strong>

          <small>
            {dashboardData.jobCardStats.completed} completed
          </small>
        </div>

        <div
          className="modern-kpi kpi-orange"
          onClick={() =>
            handleNavigate(
              "/stock-entry"
            )
          }
        >
          <div className="kpi-top">
            <div className="kpi-icon">
              <BsBoxSeam />
            </div>

            <FaArrowRight className="kpi-arrow" />
          </div>

          <span className="kpi-label">
            Stock Entry
          </span>

          <strong>
            {dashboardData.inventoryStats.totalQuantity.toLocaleString()}
          </strong>

          <small>
            Total stock quantity
          </small>
        </div>

        <div
          className="modern-kpi kpi-cyan"
          onClick={() =>
            handleNavigate(
              "/InventoryList"
            )
          }
        >
          <div className="kpi-top">
            <div className="kpi-icon">
              <FaWarehouse />
            </div>

            <FaArrowRight className="kpi-arrow" />
          </div>

          <span className="kpi-label">
            Inventory
          </span>

          <strong>
            {dashboardData.inventoryStats.totalItems}
          </strong>

          <small>
            {dashboardData.inventoryStats.lowStockItems} low stock
          </small>
        </div>
      </section>

      {/* ====================================================
          MAIN GRID
      ==================================================== */}

      <main className="dashboard-content">

        {/* ==================================================
            WORK ORDER STATUS
        ================================================== */}

        <section className="dashboard-card work-order-card">

          <div className="card-heading">
            <div>
              <h2>
                Work Order Status
              </h2>

              <p>
                Current production order distribution
              </p>
            </div>

            <button
              className="card-link"
              onClick={() =>
                handleNavigate(
                  "/work-order"
                )
              }
            >
              View All
              <FaArrowRight />
            </button>
          </div>

          <div className="work-order-layout">

            <div
              className="status-donut"
              style={{
                background: `conic-gradient(
                  #22c55e 0% ${getPercentage(
                    dashboardData.stats.completed,
                    dashboardData.stats.total
                  )}%,
                  #3b82f6 ${getPercentage(
                    dashboardData.stats.completed,
                    dashboardData.stats.total
                  )}% ${getPercentage(
                    dashboardData.stats.completed +
                      dashboardData.stats.open,
                    dashboardData.stats.total
                  )}%,
                  #f59e0b ${getPercentage(
                    dashboardData.stats.completed +
                      dashboardData.stats.open,
                    dashboardData.stats.total
                  )}% ${getPercentage(
                    dashboardData.stats.completed +
                      dashboardData.stats.open +
                      dashboardData.stats.inProcess,
                    dashboardData.stats.total
                  )}%,
                  #ef4444 ${getPercentage(
                    dashboardData.stats.completed +
                      dashboardData.stats.open +
                      dashboardData.stats.inProcess,
                    dashboardData.stats.total
                  )}% 100%
                )`,
              }}
            >
              <div className="donut-center">
                <strong>
                  {dashboardData.stats.total}
                </strong>

                <span>
                  Total WO
                </span>
              </div>
            </div>

            <div className="status-list">

              {[
                {
                  name: "Completed",
                  value:
                    dashboardData.stats.completed,
                  color:
                    "#22c55e",
                },
                {
                  name: "Open",
                  value:
                    dashboardData.stats.open,
                  color:
                    "#3b82f6",
                },
                {
                  name: "In Process",
                  value:
                    dashboardData.stats.inProcess,
                  color:
                    "#f59e0b",
                },
                {
                  name: "On Hold",
                  value:
                    dashboardData.stats.onHold,
                  color:
                    "#8b5cf6",
                },
                {
                  name: "Stopped",
                  value:
                    dashboardData.stats.stopped,
                  color:
                    "#ef4444",
                },
              ]
                .filter(
                  item =>
                    item.value > 0
                )
                .map(item => (
                  <button
                    type="button"
                    className={`status-row ${
                      selectedWorkOrderStatus === item.name
                        ? "status-row-active"
                        : ""
                    }`}
                    key={item.name}
                    onClick={() =>
                      setSelectedWorkOrderStatus(
                        selectedWorkOrderStatus === item.name
                          ? null
                          : item.name
                      )
                    }
                    title={`Select ${item.name}`}
                  >
                    <span
                      className="status-indicator"
                      style={{
                        background:
                          item.color,
                      }}
                    />

                    <span className="status-title">
                      {item.name}
                    </span>

                    <strong>
                      {item.value}
                    </strong>

                    <small>
                      {getPercentage(
                        item.value,
                        dashboardData.stats.total
                      )}
                      %
                    </small>
                  </button>
                ))}
            </div>
          </div>
        </section>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="dashboard-card quick-action-card">

          <div className="card-heading">
            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Manufacturing operations
              </p>
            </div>

            <div className="heading-icon">
              <FaPlus />
            </div>
          </div>

          <div className="quick-action-list">
            {quickActions.map(
              action => (
                <button
                  key={action.id}
                  className="quick-action"
                  onClick={() =>
                    handleNavigate(
                      action.path
                    )
                  }
                >
                  <span
                    className={`quick-action-icon ${action.className}`}
                  >
                    {action.icon}
                  </span>

                  <span className="quick-action-text">
                    <strong>
                      {action.label}
                    </strong>

                    <small>
                      {action.description}
                    </small>
                  </span>

                  <FaArrowRight className="quick-action-arrow" />
                </button>
              )
            )}
          </div>
        </section>

        {/* ==================================================
            PRODUCTION CAPACITY
        ================================================== */}

        <section className="dashboard-card capacity-card full-width">

          <div className="card-heading">
            <div>
              <h2>
                Production Capacity
              </h2>

              <p>
                Check how many units can be produced using current stock
              </p>
            </div>

            <span className="live-pill">
              <span />
              Live Stock
            </span>
          </div>

          <select
            className="bom-select"
            value={selectedBomId}
            onChange={e =>
              handleBomSelect(
                e.target.value
              )
            }
          >
            <option value="">
              Select a product (BOM)...
            </option>

            {boms.map(bom => (
              <option
                key={bom.id}
                value={bom.id}
              >
                {bom.item_name ||
                  bom.item ||
                  "Product"}{" "}
                — Qty{" "}
                {bom.quantity ||
                  1}
              </option>
            ))}
          </select>

          {bomLoading && (
            <div className="capacity-loading">
              <span className="spinner" />
              Checking current stock...
            </div>
          )}

          {!bomLoading &&
            !producible &&
            !selectedBomId && (
              <div className="capacity-empty">
                <div className="capacity-empty-icon">
                  <FaBoxes />
                </div>

                <div>
                  <strong>
                    Select a BOM
                  </strong>

                  <p>
                    Choose a product to calculate production capacity.
                  </p>
                </div>
              </div>
            )}

          {producible &&
            !bomLoading && (
              <>
                <div className="capacity-result">

                  <div className="capacity-result-icon">
                    <FaBoxes />
                  </div>

                  <div className="capacity-result-main">
                    <span>
                      Maximum producible
                    </span>

                    <strong>
                      {producible.maxUnits.toLocaleString()}
                      <small>
                        units
                      </small>
                    </strong>

                    {producible.bottleneck && (
                      <p>
                        Bottleneck:
                        <b>
                          {producible.bottleneck}
                        </b>
                      </p>
                    )}
                  </div>
                </div>

                <div className="material-list">
                  {producible.items.map(
                    (item, index) => (
                      <div
                        className="material-row"
                        key={index}
                      >
                        <div className="material-info">
                          <div className="material-icon">
                            <FaCube />
                          </div>

                          <div>
                            <strong>
                              {item.name}
                            </strong>

                            <span>
                              {item.available} available
                              {" • "}
                              {item.required.toFixed(
                                2
                              )}
                              /unit
                            </span>
                          </div>
                        </div>

                        <span
                          className={
                            item.possible ===
                              producible.maxUnits
                              ? "bottleneck-badge"
                              : "possible-badge"
                          }
                        >
                          {item.possible} pcs
                        </span>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
        </section>

        {/* ==================================================
            JOB CARD STATUS
        ================================================== */}

        <section className="dashboard-card job-card-dashboard">

          <div className="card-heading">
            <div>
              <h2>
                Job Card Status
              </h2>

              <p>
                Production task progress
              </p>
            </div>

            <button
              className="card-link"
              onClick={() =>
                handleNavigate(
                  "/job-card"
                )
              }
            >
              View All
              <FaArrowRight />
            </button>
          </div>

          <div className="job-status-grid">

            <div className="job-status-box">
              <span className="job-dot blue" />
              <small>Open</small>
              <strong>
                {dashboardData.jobCardStats.open}
              </strong>
            </div>

            <div className="job-status-box">
              <span className="job-dot orange" />
              <small>In Process</small>
              <strong>
                {dashboardData.jobCardStats.inProcess}
              </strong>
            </div>

            <div className="job-status-box">
              <span className="job-dot green" />
              <small>Completed</small>
              <strong>
                {dashboardData.jobCardStats.completed}
              </strong>
            </div>

            <div className="job-status-box">
              <span className="job-dot red" />
              <small>Stopped</small>
              <strong>
                {dashboardData.jobCardStats.stopped}
              </strong>
            </div>
          </div>

          <div className="job-summary">
            <div>
              <FaTasks />

              <span>
                Total Job Cards
              </span>

              <strong>
                {dashboardData.jobCardStats.total}
              </strong>
            </div>

            <div>
              <FaCheckCircle />

              <span>
                Completion Rate
              </span>

              <strong>
                {dashboardData.jobCardStats.total
                  ? Math.round(
                      (dashboardData.jobCardStats.completed /
                        dashboardData.jobCardStats.total) *
                        100
                    )
                  : 0}
                %
              </strong>
            </div>
          </div>
        </section>

        {/* ==================================================
            INVENTORY SUMMARY
        ================================================== */}

        <section className="dashboard-card inventory-card">

          <div className="card-heading">
            <div>
              <h2>
                Inventory Summary
              </h2>

              <p>
                Current stock overview
              </p>
            </div>

            <button
              className="card-link"
              onClick={() =>
                handleNavigate(
                  "/InventoryList"
                )
              }
            >
              View All
              <FaArrowRight />
            </button>
          </div>

          <div className="inventory-summary">

            <div className="inventory-ring">
              <div>
                <strong>
                  {dashboardData.inventoryStats.totalItems}
                </strong>

                <span>
                  Items
                </span>
              </div>
            </div>

            <div className="inventory-types">

              <div>
                <span className="inventory-dot raw" />

                <span>
                  Raw Material
                </span>

                <strong>
                  {dashboardData.inventoryStats.rawMaterialItems}
                </strong>
              </div>

              <div>
                <span className="inventory-dot finished" />

                <span>
                  Finished Goods
                </span>

                <strong>
                  {dashboardData.inventoryStats.finishedGoodsItems}
                </strong>
              </div>

              <div>
                <span className="inventory-dot wip" />

                <span>
                  WIP
                </span>

                <strong>
                  {dashboardData.inventoryStats.wipItems}
                </strong>
              </div>

              <div>
                <span className="inventory-dot low" />

                <span>
                  Low Stock
                </span>

                <strong className="danger-text">
                  {dashboardData.inventoryStats.lowStockItems}
                </strong>
              </div>
            </div>
          </div>

          <div className="inventory-value">
            <span>
              Total Inventory Value
            </span>

            <strong>
              ₹
              {(
                dashboardData.totalInventoryValue /
                100000
              ).toFixed(1)}
              L
            </strong>
          </div>
        </section>

        {/* ==================================================
            RECENT ACTIVITY
        ================================================== */}

        <section className="dashboard-card recent-card full-width">

          <div className="card-heading">
            <div>
              <h2>
                Recent Activity
              </h2>

              <p>
                Latest manufacturing updates
              </p>
            </div>

            <button
              className="card-link"
              onClick={() =>
                handleNavigate(
                  "/work-order"
                )
              }
            >
              View All
              <FaArrowRight />
            </button>
          </div>

          <div className="activity-table">

            <div className="activity-header">
              <span>
                Activity
              </span>

              <span>
                Module
              </span>

              <span>
                Status
              </span>

              <span>
                Date
              </span>
            </div>

            {loading ? (
              <div className="activity-loading">
                <span className="spinner" />
                Loading activity...
              </div>
            ) : dashboardData.recentActivity.length === 0 ? (
              <div className="activity-empty-row">
                <FaClock />
                No recent activity
              </div>
            ) : (
              dashboardData.recentActivity.map(
                (activity: any, index: number) => {
                  const activityColor =
                    statusColors[activity.status] ||
                    "#3b82f6";

                  const activityLightColor =
                    statusLightColors[activity.status] ||
                    "#eaf2ff";

                  return (
                    <div
                      className="activity-row"
                      key={index}
                    >

                      {/* ACTIVITY */}
                      <div className="activity-main">

                        <div
                          className="activity-icon"
                          style={{
                            background:
                              activityLightColor,
                            color:
                              activityColor,
                          }}
                        >
                          {getActivityIcon(
                            activity.status
                          )}
                        </div>

                        <div>
                          <strong>
                            {activity.production_item ||
                              activity.item_name ||
                              activity.name ||
                              `WO-${activity.id}`}
                          </strong>

                          <small>
                            Qty:{" "}
                            {activity.qty ||
                              activity.for_quantity ||
                              activity.requested_qty ||
                              0}
                          </small>
                        </div>
                      </div>

                      {/* MODULE */}
                      <span className="module-badge">
                        {activity.work_order
                          ? "Job Card"
                          : "Work Order"}
                      </span>

                      {/* STATUS */}
                      <span
                        className="activity-status-badge"
                        style={{
                          color:
                            activityColor,

                          background:
                            activityLightColor,
                        }}
                      >
                        {activity.status ||
                          "Unknown"}
                      </span>

                      {/* DATE */}
                      <span className="activity-date">
                        {formatDate(
                          activity.modified ||
                            activity.creation
                        )}
                      </span>

                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        {/* ==================================================
            MANUFACTURING METRICS
        ================================================== */}

        <section className="dashboard-card metrics-card full-width">

          <div className="card-heading">
            <div>
              <h2>
                Manufacturing Overview
              </h2>

              <p>
                Key production and inventory metrics
              </p>
            </div>

            <span className="live-pill">
              <span />
              Live
            </span>
          </div>

          <div className="metrics-grid">

            <div className="metric-box">
              <div className="metric-icon blue">
                <FaBoxes />
              </div>

              <span>
                Total Produced
              </span>

              <strong>
                {dashboardData.totalProduced.toLocaleString()}
              </strong>

              <small>
                units
              </small>
            </div>

            <div className="metric-box">
              <div className="metric-icon green">
                <FaCheckCircle />
              </div>

              <span>
                Completion Rate
              </span>

              <strong>
                {dashboardData.completionRate}%
              </strong>
            </div>

            <div className="metric-box">
              <div className="metric-icon purple">
                <FaTasks />
              </div>

              <span>
                Active Job Cards
              </span>

              <strong>
                {dashboardData.jobCardStats.open}
              </strong>
            </div>

            <div className="metric-box">
              <div className="metric-icon orange">
                <FaCubes />
              </div>

              <span>
                Inventory Items
              </span>

              <strong>
                {dashboardData.inventoryStats.totalItems}
              </strong>
            </div>

            <div className="metric-box">
              <div className="metric-icon cyan">
                <FaIndustry />
              </div>

              <span>
                Raw Materials
              </span>

              <strong>
                {dashboardData.inventoryStats.rawMaterialItems}
              </strong>
            </div>

            <div className="metric-box">
              <div className="metric-icon green">
                <BsBoxSeam />
              </div>

              <span>
                Finished Goods
              </span>

              <strong>
                {dashboardData.inventoryStats.finishedGoodsItems}
              </strong>
            </div>

            <div className="metric-box">
              <div className="metric-icon red">
                <FaExclamationTriangle />
              </div>

              <span>
                Low Stock
              </span>

              <strong
                className={
                  dashboardData.inventoryStats
                    .lowStockItems > 0
                    ? "danger-number"
                    : ""
                }
              >
                {dashboardData.inventoryStats.lowStockItems}
              </strong>
            </div>

            <div className="metric-box">
              <div className="metric-icon blue">
                <FaWarehouse />
              </div>

              <span>
                Stock Quantity
              </span>

              <strong>
                {dashboardData.inventoryStats.totalQuantity.toLocaleString()}
              </strong>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
