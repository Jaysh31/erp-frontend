// ToolsDashboard.tsx
import { useState, useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTools, FaWrench, FaCog, 
  FaPlus, FaArrowRight, FaClipboardList, FaCheckCircle,
  FaClock, FaUsers, FaChartBar,
  
  FaUserCog, FaFileExport, FaFileImport,
  FaDatabase, FaSync,
  FaShieldAlt, 
  FaRobot, FaRocket, FaBug, FaCode, FaCloudUploadAlt, FaCloudDownloadAlt} from "react-icons/fa";
import "./ToolsDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface ToolsStats {
  totalTools: number;
  activeTools: number;
  maintenanceTools: number;
  totalCategories: number;
  totalOperations: number;
  pendingTasks: number;
  completedTasks: number;
  totalUsers: number;
}

interface RecentActivity {
  id: number;
  type: string;
  name: string;
  action: string;
  timestamp: string;
  user: string;
  status: string;
}

interface ToolCategory {
  name: string;
  icon: JSX.Element;
  count: number;
  color: string;
}

export default function ToolsDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ToolsStats>({
    totalTools: 0,
    activeTools: 0,
    maintenanceTools: 0,
    totalCategories: 0,
    totalOperations: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalUsers: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [toolCategories, setToolCategories] = useState<ToolCategory[]>([]);
  const [quickTools, setQuickTools] = useState<any[]>([]);

  useEffect(() => {
    fetchToolsData();
  }, []);

  const fetchToolsData = async () => {
    setLoading(true);
    try {
      // Fetch data from tools APIs
      // This is a placeholder - replace with actual API calls
      
      // Sample data for demonstration
      setStats({
        totalTools: 45,
        activeTools: 32,
        maintenanceTools: 8,
        totalCategories: 12,
        totalOperations: 156,
        pendingTasks: 23,
        completedTasks: 89,
        totalUsers: 67
      });

      setToolCategories([
        { name: "Development Tools", icon: <FaCode />, count: 12, color: "#3b82f6" },
        { name: "Testing Tools", icon: <FaBug />, count: 8, color: "#ef4444" },
        { name: "Automation Tools", icon: <FaRobot />, count: 6, color: "#22c55e" },
        { name: "Analysis Tools", icon: <FaChartBar />, count: 5, color: "#f59e0b" },
        { name: "Security Tools", icon: <FaShieldAlt />, count: 4, color: "#8b5cf6" },
        { name: "Management Tools", icon: <FaUserCog />, count: 10, color: "#06b6d4" }
      ]);

      setRecentActivities([
        {
          id: 1,
          type: "Tool",
          name: "VS Code Extension Updated",
          action: "Updated",
          timestamp: "2024-01-15T10:30:00",
          user: "Admin",
          status: "Completed"
        },
        {
          id: 2,
          type: "Backup",
          name: "Database Backup",
          action: "Created",
          timestamp: "2024-01-15T09:15:00",
          user: "System",
          status: "Completed"
        },
        {
          id: 3,
          type: "Tool",
          name: "Docker Container Setup",
          action: "Installed",
          timestamp: "2024-01-14T16:45:00",
          user: "DevOps Team",
          status: "In Progress"
        },
        {
          id: 4,
          type: "Maintenance",
          name: "Server Health Check",
          action: "Scheduled",
          timestamp: "2024-01-14T14:20:00",
          user: "System",
          status: "Pending"
        },
        {
          id: 5,
          type: "Tool",
          name: "Git Repository Cloned",
          action: "Created",
          timestamp: "2024-01-14T11:00:00",
          user: "Developer",
          status: "Completed"
        }
      ]);

      setQuickTools([
        { id: 1, name: "Visual Studio Code", type: "IDE", status: "Available", users: 25 },
        { id: 2, name: "Docker Desktop", type: "Container", status: "Available", users: 18 },
        { id: 3, name: "Git SCM", type: "Version Control", status: "Available", users: 32 },
        { id: 4, name: "Postman API", type: "Testing", status: "In Use", users: 15 },
        { id: 5, name: "Jenkins CI/CD", type: "Automation", status: "Available", users: 12 }
      ]);
    } catch (error) {
      console.error("Error fetching tools data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "total-tools",
      title: "Total Tools",
      value: stats.totalTools,
      icon: <FaTools />,
      color: "primary",
      trend: "available tools"
    },
    {
      id: "active-tools",
      title: "Active Tools",
      value: stats.activeTools,
      icon: <FaCheckCircle />,
      color: "success",
      trend: "currently in use"
    },
    {
      id: "maintenance",
      title: "Under Maintenance",
      value: stats.maintenanceTools,
      icon: <FaWrench />,
      color: "warning",
      trend: "being serviced"
    },
    {
      id: "categories",
      title: "Categories",
      value: stats.totalCategories,
      icon: <FaClipboardList />,
      color: "info",
      trend: "tool groups"
    },
    {
      id: "operations",
      title: "Total Operations",
      value: stats.totalOperations,
      icon: <FaChartBar />,
      color: "primary",
      trend: "actions performed"
    },
    {
      id: "pending",
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: <FaClock />,
      color: "warning",
      trend: "to be completed"
    },
    {
      id: "completed",
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: <FaCheckCircle />,
      color: "success",
      trend: "tasks done"
    },
    {
      id: "users",
      title: "Tool Users",
      value: stats.totalUsers,
      icon: <FaUsers />,
      color: "info",
      trend: "active users"
    }
  ];

  const quickActions = [
    { id: "new-tool", label: "Add New Tool", icon: <FaPlus />, path: "/tools/new" },
    { id: "import-tool", label: "Import Tools", icon: <FaFileImport />, path: "/tools/import" },
    { id: "export-data", label: "Export Data", icon: <FaFileExport />, path: "/tools/export" },
    { id: "backup", label: "Backup", icon: <FaCloudUploadAlt />, path: "/tools/backup" },
    { id: "restore", label: "Restore", icon: <FaCloudDownloadAlt />, path: "/tools/restore" },
    { id: "settings", label: "Tools Settings", icon: <FaCog />, path: "/tools/settings" }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Completed': '#22c55e',
      'In Progress': '#3b82f6',
      'Pending': '#f59e0b',
      'Available': '#22c55e',
      'In Use': '#3b82f6'
    };
    return colors[status] || '#94a3b8';
  };

  return (
    <div className={`dashboard tools-dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🔧 Tools Dashboard</h1>
          <p className="header-subtitle">Manage and monitor all tools and utilities</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/tools/new")}>
            <FaPlus /> Add New Tool
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/tools/import")}>
            <FaFileImport /> Import
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

        {/* Tool Categories */}
        <div className="card tool-categories">
          <div className="card-header">
            <h3>Tool Categories</h3>
            <span className="badge">{toolCategories.length} Categories</span>
          </div>
          <div className="categories-grid">
            {toolCategories.map((category, index) => (
              <div key={index} className="category-card">
                <div className="category-icon" style={{ backgroundColor: category.color }}>
                  {category.icon}
                </div>
                <div className="category-info">
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">{category.count} tools</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tools */}
        <div className="card quick-tools">
          <div className="card-header">
            <h3>Quick Access Tools</h3>
            <button className="view-all" onClick={() => handleNavigate("/tools/list")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="tools-list">
            {quickTools.map((tool) => (
              <div key={tool.id} className="tool-item" onClick={() => handleNavigate(`/tools/${tool.id}`)}>
                <div className="tool-icon">
                  {tool.type === 'IDE' && <FaCode />}
                  {tool.type === 'Container' && <FaCloudUploadAlt />}
                  {tool.type === 'Version Control' && <FaCode />}
                  {tool.type === 'Testing' && <FaBug />}
                  {tool.type === 'Automation' && <FaRobot />}
                </div>
                <div className="tool-info">
                  <div className="tool-name">{tool.name}</div>
                  <div className="tool-type">{tool.type}</div>
                </div>
                <div className="tool-stats">
                  <span className="tool-users">{tool.users} users</span>
                  <span className="tool-status" style={{ backgroundColor: getStatusColor(tool.status) }}>
                    {tool.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card recent-activity">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <button className="view-all" onClick={() => handleNavigate("/tools/activity")}>
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
                  <div className="activity-type-icon">
                    {activity.type === 'Tool' && <FaTools />}
                    {activity.type === 'Backup' && <FaDatabase />}
                    {activity.type === 'Maintenance' && <FaWrench />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.name}</div>
                    <div className="activity-meta">
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-user">by {activity.user}</span>
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

        {/* Tools Metrics */}
        <div className="card tools-metrics">
          <div className="card-header">
            <h3>Tools Metrics</h3>
            <span className="badge">Live</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaRocket /></div>
              <div className="metric-info">
                <span className="metric-label">Active Sessions</span>
                <span className="metric-value">42</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaSync /></div>
              <div className="metric-info">
                <span className="metric-label">Auto Updates</span>
                <span className="metric-value">Enabled</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaShieldAlt /></div>
              <div className="metric-info">
                <span className="metric-label">Security Status</span>
                <span className="metric-value">Protected</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaCloudUploadAlt /></div>
              <div className="metric-info">
                <span className="metric-label">Backups</span>
                <span className="metric-value">Last: Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}