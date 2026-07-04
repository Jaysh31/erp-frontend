// DashboardPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaClipboardList, FaClock, FaChartLine, FaIndustry,
  FaCheckCircle, FaExclamationTriangle, FaPlay,
  FaWarehouse, FaPlus,
  FaArrowRight, FaBuilding, FaDollarSign,
  FaPercent, FaTools, FaRocket,
} from "react-icons/fa";
import { BsGear } from "react-icons/bs";
import "./DashboardPage.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from "../../services/api";

interface WorkOrderStats {
  total: number;
  draft: number;
  open: number;
  inProcess: number;
  completed: number;
  stopped: number;
  overdue: number;
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
      overdue: 0
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/work-order");
      if (response.data.success === 1) {
        const orders = response.data.data.records || response.data.data || [];
        
        // Calculate stats
        const stats = {
          total: orders.length,
          draft: orders.filter((o: any) => o.status === "Draft").length,
          open: orders.filter((o: any) => o.status === "Not Started").length,
          inProcess: orders.filter((o: any) => o.status === "In Process").length,
          completed: orders.filter((o: any) => o.status === "Completed").length,
          stopped: orders.filter((o: any) => o.status === "Stopped").length,
          overdue: orders.filter((o: any) => {
            if (o.planned_end_date && o.status !== "Completed") {
              return new Date(o.planned_end_date) < new Date();
            }
            return false;
          }).length
        };

        const totalProduced = orders.reduce((sum: number, o: any) => sum + (o.produced_qty || 0), 0);
        const totalValue = orders.reduce((sum: number, o: any) => sum + (o.total_operating_cost || 0), 0);

        setDashboardData({
          totalProduced,
          totalValue,
          efficiency: orders.length > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
          openWorkOrders: stats.open,
          wipWorkOrders: stats.inProcess,
          totalWorkOrders: stats.total,
          overdueOrders: stats.overdue,
          recentActivity: orders.slice(0, 5),
          topProducts: [],
          stats
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Navigation Handlers ──────────────────────────────────────────────
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "total",
      title: "Total Work Orders",
      value: dashboardData.totalWorkOrders,
      icon: <FaClipboardList />,
      color: "primary",
      trend: "all",
    },
    {
      id: "open",
      title: "Open Orders",
      value: dashboardData.openWorkOrders,
      icon: <FaPlay />,
      color: "warning",
      trend: "pending",
    },
    {
      id: "wip",
      title: "In Progress",
      value: dashboardData.wipWorkOrders,
      icon: <FaClock />,
      color: "info",
      trend: "active",
    },
    {
      id: "completed",
      title: "Completed",
      value: dashboardData.stats.completed,
      icon: <FaCheckCircle />,
      color: "success",
      trend: "completed",
    },
    {
      id: "overdue",
      title: "Overdue",
      value: dashboardData.overdueOrders,
      icon: <FaExclamationTriangle />,
      color: "danger",
      trend: "overdue",
    },
    {
      id: "efficiency",
      title: "Efficiency",
      value: `${dashboardData.efficiency}%`,
      icon: <FaChartLine />,
      color: "primary",
      trend: "efficiency",
    },
    {
      id: "produced",
      title: "Total Produced",
      value: dashboardData.totalProduced.toLocaleString(),
      icon: <FaBoxes />,
      color: "success",
      trend: "produced",
    },
    {
      id: "value",
      title: "Total Value",
      value: `₹${dashboardData.totalValue.toLocaleString()}`,
      icon: <FaDollarSign />,
      color: "gold",
      trend: "value",
    },
  ];

  const quickActions = [
    { id: "new-wo", label: "New Work Order", icon: <FaPlus />, path: "/work-order/new" },
    { id: "new-job", label: "New Job Card", icon: <FaTools />, path: "/job-cards/new" },
    { id: "job-list", label: "Job Cards", icon: <FaClipboardList />, path: "/job-card" },
    { id: "wo-list", label: "Work Orders", icon: <FaIndustry />, path: "/work-order" },
    { id: "bom", label: "BOM Listing", icon: <BsGear />, path: "/bom" },
    { id: "warehouse", label: "Warehouse", icon: <FaWarehouse />, path: "/warehouse" },
  ];

  return (
    <div className={`dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🏭 Manufacturing Dashboard</h1>
          <p className="header-subtitle">Real-time production overview and insights</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/work-order/new")}>
            <FaPlus /> New Work Order
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/job-cards/new")}>
            <FaTools /> New Job Card
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
        {/* Status Distribution */}
        <div className="card status-distribution">
          <div className="card-header">
            <h3>Order Status Distribution</h3>
            <span className="badge">Today</span>
          </div>
          <div className="status-bars">
            {Object.entries(dashboardData.stats).map(([key, value]) => {
              if (key === 'total' || !value) return null;
              const percentage = dashboardData.stats.total > 0 
                ? Math.round((value / dashboardData.stats.total) * 100) 
                : 0;
              const colors: Record<string, string> = {
                draft: '#94a3b8',
                open: '#f59e0b',
                inProcess: '#3b82f6',
                completed: '#22c55e',
                stopped: '#ef4444',
                overdue: '#ef4444'
              };
              return (
                <div key={key} className="status-item">
                  <div className="status-label">
                    <span className={`status-dot status-${key}`}></span>
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span className="status-count">{value}</span>
                  </div>
                  <div className="status-bar-track">
                    <div 
                      className="status-bar-fill" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: colors[key] || '#3b82f6' 
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
                  <div className="activity-icon">
                    {activity.status === "Completed" ? <FaCheckCircle /> : 
                     activity.status === "In Process" ? <FaClock /> :
                     <FaPlay />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.item_name || activity.production_item || `WO-${activity.id}`}</div>
                    <div className="activity-meta">
                      <span className="activity-status">{activity.status}</span>
                      <span className="activity-date">
                        {activity.modified ? new Date(activity.modified).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                  <div className="activity-qty">Qty: {activity.qty || 0}</div>
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
                <span className="metric-label">Production Rate</span>
                <span className="metric-value">{dashboardData.totalProduced} units</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaPercent /></div>
              <div className="metric-info">
                <span className="metric-label">Efficiency</span>
                <span className="metric-value">{dashboardData.efficiency}%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaBuilding /></div>
              <div className="metric-info">
                <span className="metric-label">Total Orders</span>
                <span className="metric-value">{dashboardData.totalWorkOrders}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaDollarSign /></div>
              <div className="metric-info">
                <span className="metric-label">Total Value</span>
                <span className="metric-value">₹{dashboardData.totalValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Work Order Priority */}
        <div className="card priority-list">
          <div className="card-header">
            <h3>Priority Work Orders</h3>
            <span className="badge">Urgent</span>
          </div>
          <div className="priority-items">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.slice(0, 3).map((activity: any, index: number) => (
                <div key={index} className="priority-item" onClick={() => handleNavigate(`/work-order/${activity.id}`)}>
                  <div className="priority-indicator high"></div>
                  <div className="priority-content">
                    <div className="priority-title">{activity.item_name || activity.production_item || `WO-${activity.id}`}</div>
                    <div className="priority-meta">{activity.status} · Qty: {activity.qty || 0}</div>
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
      </div>
    </div>
  );
}
