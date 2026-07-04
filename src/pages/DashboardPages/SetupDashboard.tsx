// SetupDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaTags, FaBuilding, FaWarehouse,
  FaPlus, FaArrowRight, FaCheckCircle,
  FaClock, FaUsers, 
  FaRuler, FaCube, FaIndustry,
  FaChartBar, 
  FaDownload} from "react-icons/fa";
import { BsTools } from "react-icons/bs";
import "./SetupDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface SetupStats {
  totalItems: number;
  totalItemGroups: number;
  totalBrands: number;
  totalWarehouses: number;
  totalUOMs: number;
  totalItemAttributes: number;
  totalWorkstations: number;
  totalOperations: number;
}

interface RecentActivity {
  id: number;
  type: string;
  name: string;
  action: string;
  timestamp: string;
  status: string;
}

export default function SetupDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SetupStats>({
    totalItems: 0,
    totalItemGroups: 0,
    totalBrands: 0,
    totalWarehouses: 0,
    totalUOMs: 0,
    totalItemAttributes: 0,
    totalWorkstations: 0,
    totalOperations: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [quickAccessItems, setQuickAccessItems] = useState<any[]>([]);

  useEffect(() => {
    fetchSetupData();
  }, []);

  const fetchSetupData = async () => {
    setLoading(true);
    try {
      // Fetch data from various setup APIs
      // This is a placeholder - replace with actual API calls
      
      // Sample data for demonstration
      setStats({
        totalItems: 245,
        totalItemGroups: 28,
        totalBrands: 45,
        totalWarehouses: 12,
        totalUOMs: 18,
        totalItemAttributes: 32,
        totalWorkstations: 8,
        totalOperations: 15
      });

      setRecentActivities([
        {
          id: 1,
          type: "Item",
          name: "Premium Widget",
          action: "Created",
          timestamp: "2024-01-15T10:30:00",
          status: "Active"
        },
        {
          id: 2,
          type: "Item Group",
          name: "Electronics",
          action: "Updated",
          timestamp: "2024-01-15T09:15:00",
          status: "Active"
        },
        {
          id: 3,
          type: "Brand",
          name: "TechPro",
          action: "Created",
          timestamp: "2024-01-14T16:45:00",
          status: "Active"
        },
        {
          id: 4,
          type: "Warehouse",
          name: "Main Warehouse",
          action: "Updated",
          timestamp: "2024-01-14T14:20:00",
          status: "Active"
        },
        {
          id: 5,
          type: "UOM",
          name: "Box",
          action: "Created",
          timestamp: "2024-01-14T11:00:00",
          status: "Active"
        }
      ]);

      setQuickAccessItems([
        { id: 1, name: "Premium Widget", type: "Item", status: "Active" },
        { id: 2, name: "Electronics", type: "Item Group", status: "Active" },
        { id: 3, name: "TechPro", type: "Brand", status: "Active" },
        { id: 4, name: "Main Warehouse", type: "Warehouse", status: "Active" }
      ]);
    } catch (error) {
      console.error("Error fetching setup data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "items",
      title: "Total Items",
      value: stats.totalItems,
      icon: <FaBoxes />,
      color: "primary",
      trend: "master data"
    },
    {
      id: "item-groups",
      title: "Item Groups",
      value: stats.totalItemGroups,
      icon: <FaTags />,
      color: "info",
      trend: "categories"
    },
    {
      id: "brands",
      title: "Brands",
      value: stats.totalBrands,
      icon: <FaBuilding />,
      color: "success",
      trend: "manufacturers"
    },
    {
      id: "warehouses",
      title: "Warehouses",
      value: stats.totalWarehouses,
      icon: <FaWarehouse />,
      color: "warning",
      trend: "locations"
    },
    {
      id: "uoms",
      title: "UOMs",
      value: stats.totalUOMs,
      icon: <FaRuler />,
      color: "primary",
      trend: "units"
    },
    {
      id: "attributes",
      title: "Attributes",
      value: stats.totalItemAttributes,
      icon: <FaCube />,
      color: "info",
      trend: "properties"
    },
    {
      id: "workstations",
      title: "Workstations",
      value: stats.totalWorkstations,
      icon: <FaIndustry />,
      color: "success",
      trend: "machines"
    },
    {
      id: "operations",
      title: "Operations",
      value: stats.totalOperations,
      icon: <BsTools />,
      color: "warning",
      trend: "processes"
    }
  ];

  const quickActions = [
    { id: "new-item", label: "New Item", icon: <FaPlus />, path: "/item-list" },
    { id: "new-group", label: "New Item Group", icon: <FaTags />, path: "/item-group" },
    { id: "new-brand", label: "New Brand", icon: <FaBuilding />, path: "/brand" },
    { id: "new-warehouse", label: "New Warehouse", icon: <FaWarehouse />, path: "/warehouse" },
    { id: "new-uom", label: "New UOM", icon: <FaRuler />, path: "/uom" },
    { id: "new-attribute", label: "New Attribute", icon: <FaCube />, path: "/item-attribute" }
  ];

  const setupCategories = [
    { 
      title: "Item Management", 
      icon: <FaBoxes />,
      items: ["Items", "Item Groups", "Brands", "Item Attributes"]
    },
    { 
      title: "Inventory", 
      icon: <FaWarehouse />,
      items: ["Warehouses", "UOM"]
    },
    { 
      title: "Manufacturing", 
      icon: <FaIndustry />,
      items: ["Workstations", "Operations"]
    }
  ];

  const getStatusColor = (status: string) => {
    return status === 'Active' ? '#22c55e' : '#94a3b8';
  };

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
          <div key={stat.id} className={`stat-card stat-${stat.color}`}>
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
                    <div key={idx} className="category-item">
                      <span className="item-dot"></span>
                      <span className="item-name">{item}</span>
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
            <button className="view-all" onClick={() => handleNavigate("/setup/activity")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="activity-list">
            {loading ? (
              <div className="activity-item">Loading...</div>
            ) : recentActivities.length === 0 ? (
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
                        {new Date(activity.timestamp).toLocaleDateString()}
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

        {/* Quick Access */}
        <div className="card quick-access">
          <div className="card-header">
            <h3>Quick Access</h3>
            <span className="badge">Recently Used</span>
          </div>
          <div className="access-list">
            {quickAccessItems.map((item) => (
              <div key={item.id} className="access-item" onClick={() => handleNavigate(`/setup/${item.type.toLowerCase()}/${item.id}`)}>
                <div className="access-icon">
                  {item.type === 'Item' && <FaBoxes />}
                  {item.type === 'Item Group' && <FaTags />}
                  {item.type === 'Brand' && <FaBuilding />}
                  {item.type === 'Warehouse' && <FaWarehouse />}
                </div>
                <div className="access-info">
                  <div className="access-name">{item.name}</div>
                  <div className="access-type">{item.type}</div>
                </div>
                <div className="access-status">
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(item.status) }}></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Metrics */}
        <div className="card setup-metrics">
          <div className="card-header">
            <h3>Setup Metrics</h3>
            <span className="badge">Overview</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaCheckCircle /></div>
              <div className="metric-info">
                <span className="metric-label">Complete Setup</span>
                <span className="metric-value">85%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaClock /></div>
              <div className="metric-info">
                <span className="metric-label">Pending Items</span>
                <span className="metric-value">12</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaUsers /></div>
              <div className="metric-info">
                <span className="metric-label">Active Configs</span>
                <span className="metric-value">156</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaChartBar /></div>
              <div className="metric-info">
                <span className="metric-label">Updates Today</span>
                <span className="metric-value">23</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}