// ReportsDashboard.tsx
import { useState, useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartLine, FaFileAlt,
  FaPlus, FaArrowRight, FaDownload, 
  FaCalendarAlt, FaEye,
  FaFilePdf, FaFileExcel, FaFileWord, 
  FaClock, FaCheckCircle, FaExclamationTriangle,
  FaUsers, FaBoxes, FaMoneyBillWave, FaIndustry,
  FaBuilding, FaShoppingCart, FaCog
} from "react-icons/fa";
import { BsGraphUp } from "react-icons/bs";
import "./ReportsDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface ReportsStats {
  totalReports: number;
  scheduledReports: number;
  generatedToday: number;
  pendingReports: number;
  favoriteReports: number;
  sharedReports: number;
}

interface Report {
  id: number;
  name: string;
  type: string;
  category: string;
  generatedBy: string;
  generatedAt: string;
  status: string;
  size: string;
}

interface ReportCategory {
  name: string;
  icon: JSX.Element;
  count: number;
  color: string;
}

export default function ReportsDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportsStats>({
    totalReports: 0,
    scheduledReports: 0,
    generatedToday: 0,
    pendingReports: 0,
    favoriteReports: 0,
    sharedReports: 0
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [reportCategories, setReportCategories] = useState<ReportCategory[]>([]);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // Sample data for demonstration
      setStats({
        totalReports: 156,
        scheduledReports: 23,
        generatedToday: 12,
        pendingReports: 8,
        favoriteReports: 34,
        sharedReports: 45
      });

      setReportCategories([
        { name: "Sales Reports", icon: <FaShoppingCart />, count: 32, color: "#3b82f6" },
        { name: "Manufacturing", icon: <FaIndustry />, count: 28, color: "#22c55e" },
        { name: "Accounting", icon: <FaMoneyBillWave />, count: 35, color: "#f59e0b" },
        { name: "Inventory", icon: <FaBoxes />, count: 24, color: "#8b5cf6" },
        { name: "Purchasing", icon: <FaShoppingCart />, count: 18, color: "#06b6d4" },
        { name: "Organization", icon: <FaBuilding />, count: 19, color: "#ef4444" }
      ]);

      setRecentReports([
        {
          id: 1,
          name: "Monthly Sales Report - January 2024",
          type: "Sales",
          category: "Sales Reports",
          generatedBy: "Admin",
          generatedAt: "2024-01-15T10:30:00",
          status: "Completed",
          size: "2.4 MB"
        },
        {
          id: 2,
          name: "Production Efficiency Report",
          type: "Manufacturing",
          category: "Manufacturing",
          generatedBy: "Production Manager",
          generatedAt: "2024-01-15T09:15:00",
          status: "Completed",
          size: "1.8 MB"
        },
        {
          id: 3,
          name: "Financial Summary - Q4 2023",
          type: "Accounting",
          category: "Accounting",
          generatedBy: "Finance Team",
          generatedAt: "2024-01-14T16:45:00",
          status: "Pending",
          size: "3.2 MB"
        },
        {
          id: 4,
          name: "Inventory Status Report",
          type: "Inventory",
          category: "Inventory",
          generatedBy: "Warehouse Manager",
          generatedAt: "2024-01-14T14:20:00",
          status: "Completed",
          size: "1.2 MB"
        },
        {
          id: 5,
          name: "Supplier Performance Report",
          type: "Purchasing",
          category: "Purchasing",
          generatedBy: "Procurement",
          generatedAt: "2024-01-14T11:00:00",
          status: "In Progress",
          size: "0.8 MB"
        }
      ]);
    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "total-reports",
      title: "Total Reports",
      value: stats.totalReports,
      icon: <FaFileAlt />,
      color: "primary",
      trend: "all reports"
    },
    {
      id: "generated-today",
      title: "Generated Today",
      value: stats.generatedToday,
      icon: <FaClock />,
      color: "success",
      trend: "new reports"
    },
    {
      id: "scheduled",
      title: "Scheduled Reports",
      value: stats.scheduledReports,
      icon: <FaCalendarAlt />,
      color: "info",
      trend: "auto-generated"
    },
    {
      id: "pending",
      title: "Pending Reports",
      value: stats.pendingReports,
      icon: <FaExclamationTriangle />,
      color: "warning",
      trend: "in queue"
    },
    {
      id: "favorites",
      title: "Favorites",
      value: stats.favoriteReports,
      icon: <FaEye />,
      color: "primary",
      trend: "saved reports"
    },
    {
      id: "shared",
      title: "Shared Reports",
      value: stats.sharedReports,
      icon: <FaUsers />,
      color: "info",
      trend: "collaboration"
    }
  ];

  const quickActions = [
    { id: "new-report", label: "New Report", icon: <FaPlus />, path: "/reports/new" },
    { id: "schedule-report", label: "Schedule Report", icon: <FaCalendarAlt />, path: "/reports/schedule" },
    { id: "export-data", label: "Export Data", icon: <FaFileExcel />, path: "/reports/export" },
    { id: "import-data", label: "Import Data", icon: <FaFileAlt />, path: "/reports/import" },
    { id: "report-builder", label: "Report Builder", icon: <FaCog />, path: "/reports/builder" },
    { id: "analytics", label: "Analytics", icon: <BsGraphUp />, path: "/reports/analytics" }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Completed': '#22c55e',
      'In Progress': '#3b82f6',
      'Pending': '#f59e0b',
      'Failed': '#ef4444'
    };
    return colors[status] || '#94a3b8';
  };

  const getFileIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      'Sales': <FaFileExcel />,
      'Manufacturing': <FaFileWord />,
      'Accounting': <FaFilePdf />,
      'Inventory': <FaFileExcel />,
      'Purchasing': <FaFileWord />,
      'Organization': <FaFilePdf />
    };
    return icons[type] || <FaFileAlt />;
  };

  return (
    <div className={`dashboard reports-dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📊 Reports Dashboard</h1>
          <p className="header-subtitle">Analytics and reporting center</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/reports/new")}>
            <FaPlus /> New Report
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/reports/schedule")}>
            <FaCalendarAlt /> Schedule
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

        {/* Report Categories */}
        <div className="card report-categories">
          <div className="card-header">
            <h3>Report Categories</h3>
            <span className="badge">Browse by type</span>
          </div>
          <div className="categories-grid">
            {reportCategories.map((category, index) => (
              <div key={index} className="category-card">
                <div className="category-icon" style={{ backgroundColor: category.color }}>
                  {category.icon}
                </div>
                <div className="category-info">
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">{category.count} reports</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card recent-reports">
          <div className="card-header">
            <h3>Recent Reports</h3>
            <button className="view-all" onClick={() => handleNavigate("/reports/list")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="reports-list">
            {loading ? (
              <div className="report-item">Loading...</div>
            ) : recentReports.length === 0 ? (
              <div className="report-item">No recent reports</div>
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="report-item">
                  <div className="report-icon">
                    {getFileIcon(report.type)}
                  </div>
                  <div className="report-info">
                    <div className="report-name">{report.name}</div>
                    <div className="report-meta">
                      <span className="report-category">{report.category}</span>
                      <span className="report-time">
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </span>
                      <span className="report-size">{report.size}</span>
                    </div>
                  </div>
                  <div className="report-actions">
                    <span className="report-status" style={{ backgroundColor: getStatusColor(report.status) }}>
                      {report.status}
                    </span>
                    <button 
                      className="report-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(`/reports/${report.id}`);
                      }}
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="report-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(`/reports/${report.id}/download`);
                      }}
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Metrics */}
        <div className="card report-metrics">
          <div className="card-header">
            <h3>Report Metrics</h3>
            <span className="badge">Live</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaChartLine /></div>
              <div className="metric-info">
                <span className="metric-label">Reports Generated</span>
                <span className="metric-value">{stats.generatedToday}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaUsers /></div>
              <div className="metric-info">
                <span className="metric-label">Active Users</span>
                <span className="metric-value">45</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaFileExcel /></div>
              <div className="metric-info">
                <span className="metric-label">Exported Reports</span>
                <span className="metric-value">89</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaCheckCircle /></div>
              <div className="metric-info">
                <span className="metric-label">Success Rate</span>
                <span className="metric-value">96%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}