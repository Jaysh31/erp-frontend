// OrganizationDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBuilding, FaUsers, FaBriefcase, 
  FaPlus, FaArrowRight, FaCheckCircle,
  FaClock, FaUserTie, FaUserFriends,
  FaMapMarkerAlt, 
  
  FaFileAlt, FaBook} from "react-icons/fa";
import "./OrganizationDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface OrganizationStats {
  totalCompanies: number;
  totalDepartments: number;
  totalEmployees: number;
  totalLocations: number;
  totalLetterHeads: number;
  totalDocuments: number;
  activeEmployees: number;
  pendingOnboarding: number;
}

interface Company {
  id: number;
  name: string;
  code: string;
  type: string;
  status: string;
  location: string;
  employees: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  action: string;
  timestamp: string;
  user: string;
}

export default function OrganizationDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrganizationStats>({
    totalCompanies: 0,
    totalDepartments: 0,
    totalEmployees: 0,
    totalLocations: 0,
    totalLetterHeads: 0,
    totalDocuments: 0,
    activeEmployees: 0,
    pendingOnboarding: 0
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [departmentDistribution, setDepartmentDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    setLoading(true);
    try {
      // Fetch data from organization APIs
      // This is a placeholder - replace with actual API calls
      
      // Sample data for demonstration
      setStats({
        totalCompanies: 3,
        totalDepartments: 12,
        totalEmployees: 156,
        totalLocations: 5,
        totalLetterHeads: 8,
        totalDocuments: 234,
        activeEmployees: 142,
        pendingOnboarding: 14
      });

      setCompanies([
        {
          id: 1,
          name: "SculptERP Solutions",
          code: "SES",
          type: "Private Limited",
          status: "Active",
          location: "Mumbai, India",
          employees: 85
        },
        {
          id: 2,
          name: "Sculpt Technologies",
          code: "ST",
          type: "Private Limited",
          status: "Active",
          location: "Pune, India",
          employees: 45
        },
        {
          id: 3,
          name: "Sculpt Innovations",
          code: "SI",
          type: "Partnership",
          status: "Active",
          location: "Delhi, India",
          employees: 26
        }
      ]);

      setRecentActivities([
        {
          id: 1,
          type: "Employee",
          title: "John Doe joined as Senior Developer",
          action: "Onboarded",
          timestamp: "2024-01-15T10:30:00",
          user: "HR Team"
        },
        {
          id: 2,
          type: "Department",
          title: "New R&D Department Created",
          action: "Created",
          timestamp: "2024-01-14T16:45:00",
          user: "Management"
        },
        {
          id: 3,
          type: "Location",
          title: "New Office Opening in Bangalore",
          action: "Added",
          timestamp: "2024-01-14T14:20:00",
          user: "Admin"
        },
        {
          id: 4,
          type: "Document",
          title: "Employee Handbook Updated",
          action: "Updated",
          timestamp: "2024-01-13T11:00:00",
          user: "HR Team"
        },
        {
          id: 5,
          type: "Company",
          title: "Sculpt Innovations Annual Meeting",
          action: "Scheduled",
          timestamp: "2024-01-13T09:30:00",
          user: "CEO Office"
        }
      ]);

      setDepartmentDistribution([
        { name: "Engineering", count: 45, color: "#3b82f6" },
        { name: "Sales", count: 32, color: "#22c55e" },
        { name: "Marketing", count: 18, color: "#f59e0b" },
        { name: "HR", count: 12, color: "#8b5cf6" },
        { name: "Finance", count: 15, color: "#06b6d4" },
        { name: "Operations", count: 20, color: "#ef4444" }
      ]);
    } catch (error) {
      console.error("Error fetching organization data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "companies",
      title: "Companies",
      value: stats.totalCompanies,
      icon: <FaBuilding />,
      color: "primary",
      trend: "active entities"
    },
    {
      id: "departments",
      title: "Departments",
      value: stats.totalDepartments,
      icon: <FaBriefcase />,
      color: "info",
      trend: "total units"
    },
    {
      id: "employees",
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: <FaUsers />,
      color: "success",
      trend: "workforce"
    },
    {
      id: "active",
      title: "Active Employees",
      value: stats.activeEmployees,
      icon: <FaUserTie />,
      color: "success",
      trend: "currently working"
    },
    {
      id: "pending",
      title: "Pending Onboarding",
      value: stats.pendingOnboarding,
      icon: <FaUserFriends />,
      color: "warning",
      trend: "to be onboarded"
    },
    {
      id: "locations",
      title: "Locations",
      value: stats.totalLocations,
      icon: <FaMapMarkerAlt />,
      color: "info",
      trend: "offices"
    },
    {
      id: "letterheads",
      title: "Letter Heads",
      value: stats.totalLetterHeads,
      icon: <FaFileAlt />,
      color: "primary",
      trend: "templates"
    },
    {
      id: "documents",
      title: "Documents",
      value: stats.totalDocuments,
      icon: <FaBook />,
      color: "warning",
      trend: "total records"
    }
  ];

  const quickActions = [
    { id: "new-company", label: "New Company", icon: <FaBuilding />, path: "/company/new" },
    { id: "new-department", label: "New Department", icon: <FaBriefcase />, path: "/department/new" },
    { id: "new-employee", label: "Add Employee", icon: <FaUserTie />, path: "/employee/new" },
    { id: "new-letterhead", label: "Letter Head", icon: <FaFileAlt />, path: "/letter-head/new" },
    { id: "org-chart", label: "Org Chart", icon: <FaBook />, path: "/organization/chart" },
    { id: "settings", label: "Organization Settings", icon: <FaBuilding />, path: "/organization/settings" }
  ];

  const getStatusColor = (status: string) => {
    return status === 'Active' ? '#22c55e' : '#94a3b8';
  };

  return (
    <div className={`dashboard organization-dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🏢 Organization Dashboard</h1>
          <p className="header-subtitle">Company structure and workforce management</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/company/new")}>
            <FaPlus /> New Company
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/employee/new")}>
            <FaUserTie /> Add Employee
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

        {/* Department Distribution */}
        <div className="card department-distribution">
          <div className="card-header">
            <h3>Department Distribution</h3>
            <span className="badge">Total: {stats.totalEmployees}</span>
          </div>
          <div className="department-list">
            {departmentDistribution.map((dept, index) => {
              const percentage = stats.totalEmployees > 0 
                ? Math.round((dept.count / stats.totalEmployees) * 100) 
                : 0;
              return (
                <div key={index} className="department-item">
                  <div className="department-info">
                    <div className="department-name">
                      <span className="dept-dot" style={{ backgroundColor: dept.color }}></span>
                      {dept.name}
                    </div>
                    <span className="department-count">{dept.count} employees</span>
                  </div>
                  <div className="department-bar">
                    <div 
                      className="department-fill" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: dept.color 
                      }}
                    />
                  </div>
                  <div className="department-percentage">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Companies List */}
        <div className="card companies-list">
          <div className="card-header">
            <h3>Companies</h3>
            <button className="view-all" onClick={() => handleNavigate("/company")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="company-list">
            {companies.map((company) => (
              <div key={company.id} className="company-item" onClick={() => handleNavigate(`/company/${company.id}`)}>
                <div className="company-icon">
                  <FaBuilding />
                </div>
                <div className="company-info">
                  <div className="company-name">{company.name}</div>
                  <div className="company-meta">
                    <span className="company-code">{company.code}</span>
                    <span className="company-type">{company.type}</span>
                    <span className="company-location">{company.location}</span>
                  </div>
                </div>
                <div className="company-stats">
                  <span className="company-employees">{company.employees} employees</span>
                  <span className="company-status" style={{ backgroundColor: getStatusColor(company.status) }}>
                    {company.status}
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
            <button className="view-all" onClick={() => handleNavigate("/organization/activity")}>
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
                    {activity.type === 'Employee' && <FaUserTie />}
                    {activity.type === 'Department' && <FaBriefcase />}
                    {activity.type === 'Location' && <FaMapMarkerAlt />}
                    {activity.type === 'Document' && <FaFileAlt />}
                    {activity.type === 'Company' && <FaBuilding />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-meta">
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-user">by {activity.user}</span>
                      <span className="activity-time">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Organization Metrics */}
        <div className="card organization-metrics">
          <div className="card-header">
            <h3>Organization Metrics</h3>
            <span className="badge">Live</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaUsers /></div>
              <div className="metric-info">
                <span className="metric-label">Avg. Employees/Company</span>
                <span className="metric-value">{Math.round(stats.totalEmployees / stats.totalCompanies)}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaBuilding /></div>
              <div className="metric-info">
                <span className="metric-label">Dept/Company Ratio</span>
                <span className="metric-value">{Math.round(stats.totalDepartments / stats.totalCompanies)}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaClock /></div>
              <div className="metric-info">
                <span className="metric-label">Onboarding Rate</span>
                <span className="metric-value">92%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaCheckCircle /></div>
              <div className="metric-info">
                <span className="metric-label">Active Companies</span>
                <span className="metric-value">{stats.totalCompanies}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}