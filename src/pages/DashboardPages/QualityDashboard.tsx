// QualityDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardCheck, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaClock, FaPlus, FaArrowRight,
  FaChartBar, FaChartLine, 
  FaDownload, 
  FaFileAlt, FaUserCheck, 
  FaFlask, 
  FaTools
} from "react-icons/fa";
import "./QualityDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import { FaGauge } from "react-icons/fa6";

interface QualityStats {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  pendingInspections: number;
  qualityScore: number;
  defectRate: number;
  totalDefects: number;
  criticalDefects: number;
}

interface Inspection {
  id: number;
  item: string;
  type: string;
  inspector: string;
  date: string;
  result: string;
  defects: number;
  severity: string;
}

interface QualityMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: string;
}

export default function QualityDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QualityStats>({
    totalInspections: 0,
    passedInspections: 0,
    failedInspections: 0,
    pendingInspections: 0,
    qualityScore: 0,
    defectRate: 0,
    totalDefects: 0,
    criticalDefects: 0
  });
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [defectCategories, setDefectCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchQualityData();
  }, []);

  const fetchQualityData = async () => {
    setLoading(true);
    try {
      // Sample data for demonstration
      setStats({
        totalInspections: 234,
        passedInspections: 198,
        failedInspections: 36,
        pendingInspections: 15,
        qualityScore: 87,
        defectRate: 8.5,
        totalDefects: 42,
        criticalDefects: 8
      });

      setRecentInspections([
        {
          id: 1,
          item: "Premium Steel Rods",
          type: "Incoming Inspection",
          inspector: "John Quality",
          date: "2024-01-15T10:30:00",
          result: "Passed",
          defects: 0,
          severity: "None"
        },
        {
          id: 2,
          item: "Aluminum Sheets",
          type: "In-Process Inspection",
          inspector: "Sarah Smith",
          date: "2024-01-15T09:15:00",
          result: "Failed",
          defects: 3,
          severity: "Medium"
        },
        {
          id: 3,
          item: "Electronic Components",
          type: "Final Inspection",
          inspector: "Mike Johnson",
          date: "2024-01-14T16:45:00",
          result: "Passed",
          defects: 0,
          severity: "None"
        },
        {
          id: 4,
          item: "Copper Wire Coils",
          type: "Incoming Inspection",
          inspector: "Emily Davis",
          date: "2024-01-14T14:20:00",
          result: "Failed",
          defects: 2,
          severity: "High"
        },
        {
          id: 5,
          item: "Plastic Raw Material",
          type: "In-Process Inspection",
          inspector: "John Quality",
          date: "2024-01-14T11:00:00",
          result: "Pending",
          defects: 0,
          severity: "None"
        }
      ]);

      setQualityMetrics([
        { name: "First Pass Yield", value: 92, target: 95, unit: "%", status: "Good" },
        { name: "Defect Density", value: 2.3, target: 1.5, unit: "per unit", status: "Warning" },
        { name: "Inspection Efficiency", value: 85, target: 90, unit: "%", status: "Warning" },
        { name: "Supplier Quality", value: 94, target: 92, unit: "%", status: "Good" },
        { name: "Process Capability", value: 1.8, target: 2.0, unit: "Cpk", status: "Warning" },
        { name: "Customer Complaints", value: 4, target: 2, unit: "per month", status: "Critical" }
      ]);

      setDefectCategories([
        { name: "Material Defects", count: 15, percentage: 35.7, color: "#ef4444" },
        { name: "Manufacturing Defects", count: 12, percentage: 28.6, color: "#f59e0b" },
        { name: "Design Issues", count: 8, percentage: 19.0, color: "#3b82f6" },
        { name: "Packaging Defects", count: 5, percentage: 11.9, color: "#8b5cf6" },
        { name: "Others", count: 2, percentage: 4.8, color: "#94a3b8" }
      ]);
    } catch (error) {
      console.error("Error fetching quality data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "total-inspections",
      title: "Total Inspections",
      value: stats.totalInspections,
      icon: <FaClipboardCheck />,
      color: "primary",
      trend: "quality checks"
    },
    {
      id: "passed",
      title: "Passed",
      value: stats.passedInspections,
      icon: <FaCheckCircle />,
      color: "success",
      trend: `${Math.round((stats.passedInspections / stats.totalInspections) * 100)}% pass rate`
    },
    {
      id: "failed",
      title: "Failed",
      value: stats.failedInspections,
      icon: <FaTimesCircle />,
      color: "danger",
      trend: "needs attention"
    },
    {
      id: "pending",
      title: "Pending",
      value: stats.pendingInspections,
      icon: <FaClock />,
      color: "warning",
      trend: "in queue"
    },
    {
      id: "quality-score",
      title: "Quality Score",
      value: `${stats.qualityScore}%`,
      icon: <FaChartBar />,
      color: "primary",
      trend: "overall quality"
    },
    {
      id: "defect-rate",
      title: "Defect Rate",
      value: `${stats.defectRate}%`,
      icon: <FaExclamationTriangle />,
      color: "warning",
      trend: "defects per batch"
    },
    {
      id: "total-defects",
      title: "Total Defects",
      value: stats.totalDefects,
      icon: <FaTools />,
      color: "danger",
      trend: "identified issues"
    },
    {
      id: "critical-defects",
      title: "Critical Defects",
      value: stats.criticalDefects,
      icon: <FaExclamationTriangle />,
      color: "danger",
      trend: "high priority"
    }
  ];

  const quickActions = [
    { id: "new-inspection", label: "New Inspection", icon: <FaPlus />, path: "/quality/inspection/new" },
    { id: "defect-report", label: "Defect Report", icon: <FaFileAlt />, path: "/quality/defects" },
    { id: "quality-test", label: "Quality Test", icon: <FaFlask />, path: "/quality/test" },
    { id: "calibration", label: "Calibration", icon: <FaGauge />, path: "/quality/calibration" },
    { id: "audit", label: "Quality Audit", icon: <FaUserCheck />, path: "/quality/audit" },
    { id: "report", label: "Quality Report", icon: <FaChartLine />, path: "/quality/report" }
  ];

  const getResultColor = (result: string) => {
    const colors: Record<string, string> = {
      'Passed': '#22c55e',
      'Failed': '#ef4444',
      'Pending': '#f59e0b'
    };
    return colors[result] || '#94a3b8';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'None': '#94a3b8',
      'Low': '#22c55e',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Critical': '#dc2626'
    };
    return colors[severity] || '#94a3b8';
  };

  return (
    <div className={`dashboard quality-dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🔬 Quality Dashboard</h1>
          <p className="header-subtitle">Quality control and inspection management</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/quality/inspection/new")}>
            <FaPlus /> New Inspection
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/quality/report")}>
            <FaDownload /> Report
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

        {/* Quality Metrics */}
        <div className="card quality-metrics">
          <div className="card-header">
            <h3>Quality Metrics</h3>
            <span className="badge">KPIs</span>
          </div>
          <div className="metrics-list">
            {qualityMetrics.map((metric, index) => (
              <div key={index} className="metric-row">
                <div className="metric-info">
                  <div className="metric-name">{metric.name}</div>
                  <div className="metric-target">Target: {metric.target}{metric.unit}</div>
                </div>
                <div className="metric-value-wrapper">
                  <div className="metric-value">{metric.value}{metric.unit}</div>
                  <div className={`metric-status ${metric.status.toLowerCase()}`}>
                    {metric.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inspections */}
        <div className="card recent-inspections">
          <div className="card-header">
            <h3>Recent Inspections</h3>
            <button className="view-all" onClick={() => handleNavigate("/quality/inspections")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="inspection-list">
            {loading ? (
              <div className="inspection-item">Loading...</div>
            ) : recentInspections.length === 0 ? (
              <div className="inspection-item">No recent inspections</div>
            ) : (
              recentInspections.map((inspection) => (
                <div key={inspection.id} className="inspection-item">
                  <div className="inspection-info">
                    <div className="inspection-item-name">{inspection.item}</div>
                    <div className="inspection-meta">
                      <span className="inspection-type">{inspection.type}</span>
                      <span className="inspection-inspector">by {inspection.inspector}</span>
                      <span className="inspection-date">
                        {new Date(inspection.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="inspection-details">
                    {inspection.defects > 0 && (
                      <span className="inspection-defects">
                        {inspection.defects} defects
                      </span>
                    )}
                    <span 
                      className="inspection-severity"
                      style={{ backgroundColor: getSeverityColor(inspection.severity) }}
                    >
                      {inspection.severity}
                    </span>
                    <span 
                      className="inspection-result"
                      style={{ backgroundColor: getResultColor(inspection.result) }}
                    >
                      {inspection.result === 'Passed' && <FaCheckCircle />}
                      {inspection.result === 'Failed' && <FaTimesCircle />}
                      {inspection.result === 'Pending' && <FaClock />}
                      {inspection.result}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Defect Categories */}
        <div className="card defect-categories">
          <div className="card-header">
            <h3>Defect Categories</h3>
            <span className="badge">Analysis</span>
          </div>
          <div className="defect-list">
            {defectCategories.map((category, index) => (
              <div key={index} className="defect-item">
                <div className="defect-info">
                  <span className="defect-dot" style={{ backgroundColor: category.color }}></span>
                  <span className="defect-name">{category.name}</span>
                  <span className="defect-count">{category.count}</span>
                </div>
                <div className="defect-bar">
                  <div 
                    className="defect-fill" 
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: category.color
                    }}
                  />
                </div>
                <div className="defect-percentage">{category.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Overview */}
        <div className="card quality-overview">
          <div className="card-header">
            <h3>Quality Overview</h3>
            <span className="badge">Summary</span>
          </div>
          <div className="overview-grid">
            <div className="overview-item">
              <div className="overview-icon" style={{ backgroundColor: '#22c55e' }}>
                <FaCheckCircle />
              </div>
              <div className="overview-content">
                <div className="overview-label">Pass Rate</div>
                <div className="overview-value">
                  {stats.totalInspections > 0 
                    ? Math.round((stats.passedInspections / stats.totalInspections) * 100) 
                    : 0}%
                </div>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-icon" style={{ backgroundColor: '#f59e0b' }}>
                <FaExclamationTriangle />
              </div>
              <div className="overview-content">
                <div className="overview-label">Defect Rate</div>
                <div className="overview-value">{stats.defectRate}%</div>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-icon" style={{ backgroundColor: '#3b82f6' }}>
                <FaChartLine />
              </div>
              <div className="overview-content">
                <div className="overview-label">Quality Score</div>
                <div className="overview-value">{stats.qualityScore}%</div>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-icon" style={{ backgroundColor: '#8b5cf6' }}>
                <FaTools />
              </div>
              <div className="overview-content">
                <div className="overview-label">Critical Defects</div>
                <div className="overview-value">{stats.criticalDefects}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}