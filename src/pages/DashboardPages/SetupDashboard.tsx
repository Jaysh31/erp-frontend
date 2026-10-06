/* ============================================================
   SETUP DASHBOARD
   PREMIUM ERP UI
   Same visual system as Purchasing Dashboard
============================================================ */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaBoxes,
  FaTags,
  FaWarehouse,
  FaPlus,
  FaRuler,
  FaIndustry,
  FaDownload,
  FaSpinner,
  FaExclamationTriangle,
  FaArrowRight,
} from "react-icons/fa";

import { BsTools } from "react-icons/bs";

import "./SetupDashboard.css";
import "./DashboardPage.css";

import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";

/* ============================================================
   TYPES
============================================================ */

interface SetupStats {
  totalItems: number;
  totalItemGroups: number;
  totalBrands: number;
  totalWarehouses: number;
  totalUOMs: number;
  totalWorkstations: number;
  totalOperations: number;
  totalActiveItems: number;
  totalInactiveItems: number;
}

interface RecentActivity {
  id: number;
  type: string;
  name: string;
  action: string;
  timestamp: string;
  status: string;
}

/* ============================================================
   API TYPES
============================================================ */

interface ApiItemsResponse {
  success: number;
  data: ApiItem[];
}

interface ApiItemGroupResponse {
  success: number;
  data: ApiItemGroup[];
}

interface ApiWarehouseResponse {
  success: number;
  data: {
    records: ApiWarehouse[];
    total: number;
    page: number;
    limit: number;
  };
}

interface ApiUOMResponse {
  success: number;
  data: {
    records: ApiUOM[];
    total: number;
    page: number;
    limit: number;
  };
}

interface ApiWorkstationResponse {
  success: number;
  data: ApiWorkstation[];
}

interface ApiOperationResponse {
  success: number;
  data: ApiOperation[];
}

interface ApiQualityInspectionResponse {
  success: number;
  data: {
    records: ApiQualityInspection[];
    total: number;
    page: number;
    limit: number;
  };
}

/* ============================================================
   API MODELS
============================================================ */

interface ApiItem {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  brand: string;
  stock_uom: string;
  standard_rate: number;
  selling_price: number;
  disabled: number;
  creation: string;
  valuation_rate: number;
}

interface ApiItemGroup {
  id: number;
  group_name: string;
  parent_group: string | null;
  disabled?: number;
}

interface ApiWarehouse {
  id: number;
  warehouse_name: string;
  company: string;
  city: string | null;
  state: string | null;
  disabled: number;
}

interface ApiWorkstation {
  id: number;
  workstation_name: string;
  workstation_type: string;
  plant_floor: string;
  warehouse: string;
  status: string;
  hour_rate: number;
  is_deleted?: number;
}

interface ApiOperation {
  id: number;
  name: string;
  workstation_name: string;
  workstationId: number;
  hour_rate: number;
  total_operation_time: number;
  batch_size: number;
  is_deleted?: number;
}

interface ApiUOM {
  id: number;
  uom_name: string;
  symbol: string;
  category: string;
}

interface ApiQualityInspection {
  id: number;
  name: string;
  status: string;
  type: string;
}

/* ============================================================
   HELPERS
============================================================ */

function getItemsData(response: ApiItemsResponse): ApiItem[] {
  return response?.data || [];
}

function getItemGroupsData(
  response: ApiItemGroupResponse
): ApiItemGroup[] {
  return response?.data || [];
}

function getWarehousesData(
  response: ApiWarehouseResponse
): ApiWarehouse[] {
  return response?.data?.records || [];
}

function getWorkstationsData(
  response: ApiWorkstationResponse
): ApiWorkstation[] {
  return response?.data || [];
}

function getOperationsData(
  response: ApiOperationResponse
): ApiOperation[] {
  return response?.data || [];
}

function getUOMsData(
  response: ApiUOMResponse
): ApiUOM[] {
  return response?.data?.records || [];
}

/* ============================================================
   COMPONENT
============================================================ */

export default function SetupDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<SetupStats>({
    totalItems: 0,
    totalItemGroups: 0,
    totalBrands: 0,
    totalWarehouses: 0,
    totalUOMs: 0,
    totalWorkstations: 0,
    totalOperations: 0,
    totalActiveItems: 0,
    totalInactiveItems: 0,
  });

  const [recentActivities, setRecentActivities] =
    useState<RecentActivity[]>([]);

  /* ============================================================
     FETCH DATA
  ============================================================ */

  useEffect(() => {
    fetchAllSetupData();
  }, []);

  const fetchAllSetupData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        itemsRes,
        itemGroupsRes,
        warehousesRes,
        workstationsRes,
        operationsRes,
        uomsRes,
        qualityInspectionRes,
      ] = await Promise.all([
        api.get<ApiItemsResponse>(
          "/item?page=1&limit=100000"
        ),

        api.get<ApiItemGroupResponse>(
          "/item-group?page=1&limit=100000"
        ),

        api.get<ApiWarehouseResponse>(
          "/warehouse?page=1&limit=100000"
        ),

        api.get<ApiWorkstationResponse>(
          "/workstation?page=1&limit=100000&sort_order=asc&sort_by=id"
        ),

        api.get<ApiOperationResponse>(
          "/operation"
        ),

        api.get<ApiUOMResponse>(
          "/uom?page=1&limit=100000"
        ),

        api.get<ApiQualityInspectionResponse>(
          "/quality-inspection?page=1&limit=100000"
        ),
      ]);

      /* Prevent unused response warning while preserving API call */
      void qualityInspectionRes;

      /* --------------------------------------------------------
         Extract Data
      -------------------------------------------------------- */

      const itemsData = getItemsData(itemsRes.data);

      const itemGroups = getItemGroupsData(
        itemGroupsRes.data
      );

      const warehouses = getWarehousesData(
        warehousesRes.data
      );

      const workstations = getWorkstationsData(
        workstationsRes.data
      );

      const operations = getOperationsData(
        operationsRes.data
      );

      const uoms = getUOMsData(
        uomsRes.data
      );

      /* --------------------------------------------------------
         Items
      -------------------------------------------------------- */

      const activeItems = itemsData.filter(
        (item) => item.disabled === 0
      );

      const inactiveItems = itemsData.filter(
        (item) => item.disabled === 1
      );

      /* --------------------------------------------------------
         Brands
      -------------------------------------------------------- */

      const brandList = [
        ...new Set(
          itemsData
            .map((item) => item.brand)
            .filter(Boolean)
        ),
      ];

      /* --------------------------------------------------------
         Item Groups
      -------------------------------------------------------- */

      const activeItemGroups = itemGroups.filter(
        (group) => group.disabled !== 1
      );

      /* --------------------------------------------------------
         Warehouses
      -------------------------------------------------------- */

      const activeWarehouses = warehouses.filter(
        (warehouse) => warehouse.disabled === 0
      );

      /* --------------------------------------------------------
         Workstations
      -------------------------------------------------------- */

      const activeWorkstations = workstations.filter(
        (workstation) =>
          workstation.status === "Active" &&
          workstation.is_deleted !== 1
      );

      /* --------------------------------------------------------
         Operations
      -------------------------------------------------------- */

      const activeOperations = operations.filter(
        (operation) => operation.is_deleted !== 1
      );

      /* --------------------------------------------------------
         UOM
      -------------------------------------------------------- */

      const activeUOMs = uoms.filter(
        (uom) =>
          uom.category &&
          uom.category !== "inactive"
      );

      /* --------------------------------------------------------
         Stats
      -------------------------------------------------------- */

      setStats({
        totalItems: itemsData.length,
        totalItemGroups: activeItemGroups.length,
        totalBrands: brandList.length,
        totalWarehouses: activeWarehouses.length,
        totalUOMs:
          activeUOMs.length || uoms.length,
        totalWorkstations:
          activeWorkstations.length,
        totalOperations:
          activeOperations.length,
        totalActiveItems:
          activeItems.length,
        totalInactiveItems:
          inactiveItems.length,
      });

      /* ========================================================
         RECENT ACTIVITY
      ======================================================== */

      const recent: RecentActivity[] = [];

      /* Recent Items */

      const sortedItems = [...itemsData].sort(
        (a, b) =>
          new Date(b.creation).getTime() -
          new Date(a.creation).getTime()
      );

      sortedItems.slice(0, 5).forEach((item) => {
        recent.push({
          id: item.id,
          type: "Item",
          name:
            item.item_name ||
            item.item_code,
          action: "Created",
          timestamp: item.creation,
          status:
            item.disabled === 0
              ? "Active"
              : "Inactive",
        });
      });

      /* Recent Item Groups */

      const sortedGroups = [
        ...itemGroups,
      ].sort(
        (a, b) =>
          (b.id || 0) -
          (a.id || 0)
      );

      sortedGroups
        .slice(0, 2)
        .forEach((group) => {
          if (group.group_name) {
            recent.push({
              id: group.id,
              type: "Item Group",
              name: group.group_name,
              action: "Created",
              timestamp:
                new Date().toISOString(),
              status:
                group.disabled !== 1
                  ? "Active"
                  : "Inactive",
            });
          }
        });

      /* Recent Warehouses */

      const sortedWarehouses = [
        ...warehouses,
      ].sort(
        (a, b) =>
          (b.id || 0) -
          (a.id || 0)
      );

      sortedWarehouses
        .slice(0, 2)
        .forEach((warehouse) => {
          if (warehouse.warehouse_name) {
            recent.push({
              id: warehouse.id,
              type: "Warehouse",
              name:
                warehouse.warehouse_name,
              action: "Created",
              timestamp:
                new Date().toISOString(),
              status:
                warehouse.disabled === 0
                  ? "Active"
                  : "Inactive",
            });
          }
        });

      setRecentActivities(
        recent.slice(0, 5)
      );
    } catch (err: any) {
      console.error(
        "Error fetching setup data:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load setup data"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     NAVIGATION
  ============================================================ */

  const handleNavigate = (
    path: string
  ) => {
    if (path) {
      navigate(path);
    }
  };

  /* ============================================================
     STAT CARDS
  ============================================================ */

  const statCards = [
    {
      id: "items",
      title: "Total Items",
      value: stats.totalItems,
      icon: <FaBoxes />,
      color: "primary",
      trend: `${stats.totalActiveItems} active`,
      path: "/item-list",
    },

    {
      id: "item-groups",
      title: "Item Groups",
      value: stats.totalItemGroups,
      icon: <FaTags />,
      color: "blue",
      trend: "categories",
      path:
        stats.totalItemGroups > 0
          ? "/item-group"
          : "",
    },

    {
      id: "warehouses",
      title: "Warehouses",
      value: stats.totalWarehouses,
      icon: <FaWarehouse />,
      color: "orange",
      trend: "locations",
      path:
        stats.totalWarehouses > 0
          ? "/warehouse"
          : "",
    },

    {
      id: "uoms",
      title: "UOMs",
      value: stats.totalUOMs,
      icon: <FaRuler />,
      color: "primary",
      trend: "units",
      path:
        stats.totalUOMs > 0
          ? "/uom"
          : "",
    },

    {
      id: "workstations",
      title: "Workstations",
      value: stats.totalWorkstations,
      icon: <FaIndustry />,
      color: "green",
      trend: "machines",
      path:
        stats.totalWorkstations > 0
          ? "/workstation"
          : "",
    },

    {
      id: "operations",
      title: "Operations",
      value: stats.totalOperations,
      icon: <BsTools />,
      color: "orange",
      trend: "processes",
      path:
        stats.totalOperations > 0
          ? "/operations"
          : "",
    },
  ];

  /* ============================================================
     QUICK ACTIONS
  ============================================================ */

  const quickActions = [
    {
      id: "new-item",
      label: "New Item",
      description: "Create a new item",
      icon: <FaPlus />,
      color: "purple",
      path: "/item-list",
    },

    {
      id: "new-group",
      label: "New Item Group",
      description: "Create item category",
      icon: <FaTags />,
      color: "blue",
      path: "/item-group",
    },

    {
      id: "new-warehouse",
      label: "New Warehouse",
      description: "Add warehouse location",
      icon: <FaWarehouse />,
      color: "orange",
      path: "/warehouse",
    },

    {
      id: "new-uom",
      label: "New UOM",
      description: "Create measurement unit",
      icon: <FaRuler />,
      color: "indigo",
      path: "/uom",
    },

    {
      id: "new-workstation",
      label: "New Workstation",
      description: "Add production machine",
      icon: <FaIndustry />,
      color: "green",
      path: "/workstation",
    },
  ];

  /* ============================================================
     STATUS
  ============================================================ */

  const getStatusClass = (
    status: string
  ) => {
    return status === "Active"
      ? "active"
      : "inactive";
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div
        className={`setup-dashboard ${theme}`}
      >
        <div className="setup-loading">
          <div className="setup-loading-icon">
            <FaSpinner />
          </div>

          <h3>
            Loading Setup Dashboard
          </h3>

          <p>
            Fetching master data...
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (error) {
    return (
      <div
        className={`setup-dashboard ${theme}`}
      >
        <div className="setup-error">
          <div className="setup-error-icon">
            <FaExclamationTriangle />
          </div>

          <h3>
            Unable to Load Setup Data
          </h3>

          <p>{error}</p>

          <button
            type="button"
            className="setup-retry-button"
            onClick={
              fetchAllSetupData
            }
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN UI
  ============================================================ */

  return (
    <div
      className={`setup-dashboard ${theme}`}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="setup-dashboard-header">
        <div className="setup-header-left">
          <div className="setup-header-icon">
            <FaBoxes />
          </div>

          <div>
            <div className="setup-header-eyebrow">
              MASTER DATA
            </div>

            <h1>
              Setup Dashboard
            </h1>

          </div>
        </div>

        <div className="setup-header-actions">
          <button
            type="button"
            className="setup-primary-button"
            onClick={() =>
              handleNavigate(
                "/item-list"
              )
            }
          >
            <FaPlus />
            <span>New Item</span>
          </button>

          <button
            type="button"
            className="setup-secondary-button"
            onClick={() =>
              handleNavigate(
                "/setup/export"
              )
            }
          >
            <FaDownload />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* ======================================================
          STAT CARDS
      ====================================================== */}

      <div className="setup-stats-grid">
        {statCards.map((stat) => (
          <div
            key={stat.id}
            className={`setup-stat-card setup-stat-${stat.color} ${
              !stat.path
                ? "setup-stat-disabled"
                : ""
            }`}
            onClick={() =>
              stat.path &&
              handleNavigate(
                stat.path
              )
            }
          >
            <div className="setup-stat-decoration" />

            <div className="setup-stat-icon">
              {stat.icon}
            </div>

            <div className="setup-stat-content">
              <div className="setup-stat-title">
                {stat.title}
              </div>

              <div className="setup-stat-value">
                {stat.value}
              </div>

              <div className="setup-stat-trend">
                {stat.trend}
              </div>
            </div>

            {stat.path && (
              <div className="setup-stat-arrow">
                <FaArrowRight />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="setup-dashboard-grid">

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <section className="setup-card setup-quick-actions">
          <div className="setup-card-header">
            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Frequently used setup modules
              </p>
            </div>

            <span className="setup-favorite-badge">
              Favorites
            </span>
          </div>

          <div className="setup-actions-grid">
            {quickActions.map(
              (action) => (
                <button
                  key={action.id}
                  type="button"
                  className="setup-action-card"
                  onClick={() =>
                    handleNavigate(
                      action.path
                    )
                  }
                >
                  <div
                    className={`setup-action-icon setup-action-${action.color}`}
                  >
                    {action.icon}
                  </div>

                  <div className="setup-action-content">
                    <strong>
                      {action.label}
                    </strong>

                    <span>
                      {action.description}
                    </span>
                  </div>

                  <FaArrowRight className="setup-action-arrow" />
                </button>
              )
            )}
          </div>
        </section>

        {/* ====================================================
            RECENT ACTIVITY
        ==================================================== */}

        <section className="setup-card setup-recent-activity">
          <div className="setup-card-header">
            <div>
              <h2>
                Recent Activity
              </h2>

              <p>
                Latest setup changes
              </p>
            </div>

            <button
              type="button"
              className="setup-view-all"
              onClick={() =>
                handleNavigate(
                  "/item-list"
                )
              }
            >
              View All
              <FaArrowRight />
            </button>
          </div>

          <div className="setup-activity-list">
            {recentActivities.length ===
            0 ? (
              <div className="setup-empty-state">
                <FaBoxes />

                <h3>
                  No Recent Activity
                </h3>

                <p>
                  New setup records will
                  appear here.
                </p>
              </div>
            ) : (
              recentActivities.map(
                (activity, index) => (
                  <div
                    key={`${activity.id}-${index}`}
                    className="setup-activity-item"
                  >
                    <div className="setup-activity-type">
                      <span className="setup-type-badge">
                        {activity.type}
                      </span>
                    </div>

                    <div className="setup-activity-content">
                      <div className="setup-activity-name">
                        {activity.name}
                      </div>

                      <div className="setup-activity-meta">
                        <strong>
                          {activity.action}
                        </strong>

                        <span>
                          {new Date(
                            activity.timestamp
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`setup-status-badge ${getStatusClass(
                        activity.status
                      )}`}
                    >
                      {activity.status}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}