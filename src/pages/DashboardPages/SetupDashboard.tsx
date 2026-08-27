// SetupDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaTags, FaBuilding, FaWarehouse,
  FaPlus,
  FaRuler, FaIndustry,
  
  FaDownload, FaSpinner, FaExclamationTriangle
} from "react-icons/fa";
import { BsTools } from "react-icons/bs";
import "./SetupDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from "../../services/api";

// ─── Types ───────────────────────────────────────────────────────────────

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

// ─── API Response Types ────────────────────────────────────────────────

interface ApiItemsResponse {
  success: number;
  data: ApiItem[];
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

// ─── Helper functions ──────────────────────────────────────────────────

function getItemsData(response: ApiItemsResponse): ApiItem[] {
  return response.data || [];
}

function getWarehousesData(response: ApiWarehouseResponse): ApiWarehouse[] {
  return response.data?.records || [];
}

function getWorkstationsData(response: ApiWorkstationResponse): ApiWorkstation[] {
  return response.data || [];
}

function getOperationsData(response: ApiOperationResponse): ApiOperation[] {
  return response.data || [];
}

function getUOMsData(response: ApiUOMResponse): ApiUOM[] {
  return response.data?.records || [];
}

// ─── Component ──────────────────────────────────────────────────────────

export default function SetupDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setItems] = useState<ApiItem[]>([]);
  const [stats, setStats] = useState<SetupStats>({
    totalItems: 0,
    totalItemGroups: 0,
    totalBrands: 0,
    totalWarehouses: 0,
    totalUOMs: 0,
    totalWorkstations: 0,
    totalOperations: 0,
    totalActiveItems: 0,
    totalInactiveItems: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [, setQuickAccessItems] = useState<any[]>([]);

  useEffect(() => {
    fetchAllSetupData();
  }, []);

  const fetchAllSetupData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        itemsRes,
        warehousesRes,
        workstationsRes,
        operationsRes,
        uomsRes
      ] = await Promise.all([
        api.get<ApiItemsResponse>('/item?page=1&limit=100000'),
        api.get<ApiWarehouseResponse>('/warehouse?page=1&limit=10'),
        api.get<ApiWorkstationResponse>('/workstation?page=1&limit=10&sort_order=asc&sort_by=id'),
        api.get<ApiOperationResponse>('/operation'),
        api.get<ApiUOMResponse>('/uom?page=1&limit=10')
      ]);

      const itemsData = getItemsData(itemsRes.data);
      setItems(itemsData);
      
      const warehouses = getWarehousesData(warehousesRes.data);
      const workstations = getWorkstationsData(workstationsRes.data);
      const operations = getOperationsData(operationsRes.data);
      const uoms = getUOMsData(uomsRes.data);

      // ─── Process Items ──────────────────────────────────────
      const activeItems = itemsData.filter(item => item.disabled === 0);
      const inactiveItems = itemsData.filter(item => item.disabled === 1);
      const groups = [...new Set(itemsData.map(item => item.item_group).filter(Boolean))];
      const brandList = [...new Set(itemsData.map(item => item.brand).filter(Boolean))];

      // ─── Process Warehouses ──────────────────────────────────
      const activeWarehouses = warehouses.filter(w => w.disabled === 0);

      // ─── Process Workstations ────────────────────────────────
      const activeWorkstations = workstations.filter(
        w => w.status === 'Active' && w.is_deleted !== 1
      );

      // ─── Process Operations ──────────────────────────────────
      const activeOperations = operations.filter(op => op.is_deleted !== 1);

      // ─── Set Stats ────────────────────────────────────────────
      setStats({
        totalItems: itemsData.length,
        totalItemGroups: groups.length,
        totalBrands: brandList.length,
        totalWarehouses: activeWarehouses.length,
        totalUOMs: uoms.length,
        totalWorkstations: activeWorkstations.length,
        totalOperations: activeOperations.length,
        totalActiveItems: activeItems.length,
        totalInactiveItems: inactiveItems.length
      });

      // ─── Build Recent Activities ─────────────────────────────
      const recent: RecentActivity[] = [];
      
      // Add recent items (last 5)
      const sortedItems = [...itemsData].sort((a, b) => 
        new Date(b.creation).getTime() - new Date(a.creation).getTime()
      );
      sortedItems.slice(0, 5).forEach(item => {
        recent.push({
          id: item.id,
          type: "Item",
          name: item.item_name || item.item_code,
          action: "Created",
          timestamp: item.creation,
          status: item.disabled === 0 ? "Active" : "Inactive"
        });
      });

      setRecentActivities(recent.slice(0, 5));

      // ─── Build Quick Access ──────────────────────────────────
      const quickItems = sortedItems.slice(0, 4).map(item => ({
        id: item.id,
        name: item.item_name || item.item_code,
        type: "Item",
        status: item.disabled === 0 ? "Active" : "Inactive"
      }));
      setQuickAccessItems(quickItems);

    } catch (err: any) {
      console.error("Error fetching setup data:", err);
      setError(err.response?.data?.message || err.message || "Failed to load setup data");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    if (path) {
      navigate(path);
    }
  };

  // ─── Stat Cards - Only working routes ──────────────────────────────
  const statCards = [
    {
      id: "items",
      title: "Total Items",
      value: stats.totalItems,
      icon: <FaBoxes />,
      color: "primary",
      trend: `${stats.totalActiveItems} active`,
      path: "/item-list"
    },
    {
      id: "item-groups",
      title: "Item Groups",
      value: stats.totalItemGroups,
      icon: <FaTags />,
      color: "info",
      trend: "categories",
      path: stats.totalItemGroups > 0 ? "/item-group" : ""
    },
    {
      id: "brands",
      title: "Brands",
      value: stats.totalBrands,
      icon: <FaBuilding />,
      color: "success",
      trend: "manufacturers",
      path: stats.totalBrands > 0 ? "" : ""
    },
    {
      id: "warehouses",
      title: "Warehouses",
      value: stats.totalWarehouses,
      icon: <FaWarehouse />,
      color: "warning",
      trend: "locations",
      path: stats.totalWarehouses > 0 ? "/warehouse" : ""
    },
    {
      id: "uoms",
      title: "UOMs",
      value: stats.totalUOMs,
      icon: <FaRuler />,
      color: "primary",
      trend: "units",
      path: stats.totalUOMs > 0 ? "/uom" : ""
    },
    {
      id: "workstations",
      title: "Workstations",
      value: stats.totalWorkstations,
      icon: <FaIndustry />,
      color: "success",
      trend: "machines",
      path: stats.totalWorkstations > 0 ? "/workstation" : ""
    },
    {
      id: "operations",
      title: "Operations",
      value: stats.totalOperations,
      icon: <BsTools />,
      color: "warning",
      trend: "processes",
      path: stats.totalOperations > 0 ? "/operations" : ""
    }
  ];

  const quickActions = [
    { id: "new-item", label: "New Item", icon: <FaPlus />, path: "/item-list" },
    { id: "new-group", label: "New Item Group", icon: <FaTags />, path: "/item-group" },
    { id: "new-warehouse", label: "New Warehouse", icon: <FaWarehouse />, path: "/warehouse" },
    { id: "new-uom", label: "New UOM", icon: <FaRuler />, path: "/uom" },
    { id: "new-workstation", label: "New Workstation", icon: <FaIndustry />, path: "/workstation" },
  ];

  const setupCategories = [
    { 
      title: "Item Management", 
      icon: <FaBoxes />,
      items: [
        { name: "Items", path: "/item-list" },
        { name: "Item Groups", path: "/item-group" },
        { name: "Brands", path: "" }
      ]
    },
    { 
      title: "Inventory", 
      icon: <FaWarehouse />,
      items: [
        { name: "Warehouses", path: "/warehouse" },
        { name: "UOM", path: "/uom" }
      ]
    },
    { 
      title: "Manufacturing", 
      icon: <FaIndustry />,
      items: [
        { name: "Workstations", path: "/workstation" },
        { name: "Operations", path: "/operations" }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    return status === 'Active' ? '#22c55e' : '#94a3b8';
  };

  if (loading) {
    return (
      <div className={`dashboard setup-dashboard ${theme}`}>
        <div className="dashboard-header">
          <h1>⚙️ Setup Dashboard</h1>
          <p className="header-subtitle">Loading master data...</p>
        </div>
        <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <FaSpinner className="spinner" style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginLeft: '16px' }}>Loading setup data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard setup-dashboard ${theme}`}>
        <div className="dashboard-header">
          <h1>⚙️ Setup Dashboard</h1>
          <p className="header-subtitle">Error loading data</p>
        </div>
        <div className="error-container" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          <FaExclamationTriangle size={48} style={{ marginBottom: '16px' }} />
          <p>{error}</p>
          <button 
            onClick={fetchAllSetupData}
            style={{ 
              marginTop: '16px', 
              padding: '8px 24px', 
              cursor: 'pointer',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard setup-dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>⚙️ Setup Dashboard</h1>
          <p className="header-subtitle">Master data management and configuration</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/item-list")}>
            <FaPlus /> New Item
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/setup/export")}>
            <FaDownload /> Export Data
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div 
            key={stat.id} 
            className={`stat-card stat-${stat.color} ${!stat.path ? 'stat-disabled' : ''}`}
            onClick={() => stat.path && handleNavigate(stat.path)}
            style={{ cursor: stat.path ? 'pointer' : 'default' }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-title">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-trend">{stat.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
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

        {/* Setup Categories */}
        <div className="card setup-categories">
          <div className="card-header">
            <h3>Setup Categories</h3>
            <span className="badge">Configuration</span>
          </div>
          <div className="categories-grid">
            {setupCategories.map((category, index) => (
              <div key={index} className="category-card">
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-title">{category.title}</span>
                </div>
                <div className="category-items">
                  {category.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="category-item"
                      onClick={() => handleNavigate(item.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="item-dot"></span>
                      <span className="item-name">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card recent-activity">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {recentActivities.length === 0 ? (
              <div className="activity-item">No recent activity</div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-type">
                    <span className="type-badge">{activity.type}</span>
                  </div>
                  <div className="activity-content">
                    <div className="activity-name">{activity.name}</div>
                    <div className="activity-action">
                      <span className="action-label">{activity.action}</span>
                      <span className="activity-time">
                        {new Date(activity.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="activity-status">
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(activity.status) }}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Access
        <div className="card quick-access">
          <div className="card-header">
            <h3>Quick Access</h3>
            <span className="badge">Recently Used</span>
          </div>
          <div className="access-list">
            {quickAccessItems.length === 0 ? (
              <div className="access-item">No items available</div>
            ) : (
              quickAccessItems.map((item) => (
                <div 
                  key={item.id} 
                  className="access-item" 
                  onClick={() => handleNavigate(`/inventory/detail/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="access-icon">
                    <FaBoxes />
                  </div>
                  <div className="access-info">
                    <div className="access-name">{item.name}</div>
                    <div className="access-type">{item.type}</div>
                  </div>
                  <div className="access-status">
                    <span className="status-dot" style={{ backgroundColor: getStatusColor(item.status) }}></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div> */}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        .stat-disabled {
          opacity: 0.6;
          cursor: default !important;
        }
        .stat-disabled:hover {
          transform: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}