import { useNavigate } from "react-router-dom";
import { useModule } from '../context/ModuleContext';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import {
  FaCogs,
  FaIndustry,
  FaBoxes,
  FaClipboardCheck,
  FaChartBar,
  FaTools,
  FaSignOutAlt,
  FaShoppingCart,
  FaBuilding,
  FaMoneyBillWave,
} from "react-icons/fa";
import logo from '../assets/logo.png';
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const { setCurrentModule } = useModule();
  const { theme } = useAdminTheme();

  const modules = [
    {
      title: "Manufacturing",
      icon: <FaIndustry />,
      path: "/dashboard/manufacturing", // Changed to module-specific path
      module: 'manufacturing' as const,
      description: "Manage production & BOM",
      color: "#6366f1"
    },
    {
      title: "Setup",
      icon: <FaCogs />,
      path: "/dashboard/setup", // Changed
      module: 'setup' as const,
      description: "Configure master data",
      color: "#8b5cf6"
    },
    {
      title: "Stock",
      icon: <FaBoxes />,
      path: "/dashboard/stock", // Changed - you might want a Stock module
      module: 'setup' as const,
      description: "Manage inventory",
      color: "#06b6d4"
    },
    {
      title: "Quality",
      icon: <FaClipboardCheck />,
      path: "/dashboard/quality", // Changed
      module: 'manufacturing' as const,
      description: "Quality control",
      color: "#10b981"
    },
    {
      title: "Sales",
      icon: <FaShoppingCart />,
      path: "/dashboard/sales", // Changed
      module: 'sales' as const,
      description: "Manage sales orders",
      color: "#f59e0b"
    },
    {
      title: "Purchasing",
      icon: <FaShoppingCart />,
      path: "/dashboard/purchasing", // Changed
      module: 'purchasing' as const,
      description: "Manage purchase orders",
      color: "#f59e0b"
    },
    {
      title: "Organization",
      icon: <FaBuilding />,
      path: "/dashboard/organization", // Changed
      module: 'organization' as const,
      description: "Company & letter head",
      color: "#8b5cf6"
    },
    {
      title: "Reports",
      icon: <FaChartBar />,
      path: "/dashboard/reports", // Changed
      module: 'reports' as const,
      description: "Analytics & insights",
      color: "#f59e0b"
    },
    {
      title: "Accounting",
      icon: <FaMoneyBillWave />, // Changed icon to be more specific
      path: "/dashboard/accounting", // Changed
      module: 'accounting' as const,
      description: "Manage financial records",
      color: "#10b981"
    },
    {
      title: "Tools",
      icon: <FaTools />,
      path: "/dashboard/tools", // Changed
      module: 'tools' as const,
      description: "Utilities & helpers",
      color: "#ef4444"
    },
  ];

  const handleModuleClick = (module: typeof modules[0]) => {
    setCurrentModule(module.module as any);
    navigate(module.path);
  };

  return (
    <div className={`home-page ${theme}`}>
      <div className="home-container">
        <div className="home-card">
          {/* Header Section */}
          <div className="home-header">
            <div className="home-logo">
              <img src={logo} alt="SculptERP Logo" className="home-logo-image" />
            </div>
            <div className="home-header-content">
              <h1>SculptERP</h1>
              <p>Select a module to begin your journey</p>
            </div>
          </div>

          {/* Module Grid - 4 columns */}
          <div className="module-grid">
            {modules.map((module) => (
              <div
                key={module.title}
                className="module-card"
                onClick={() => handleModuleClick(module)}
                style={{ '--module-color': module.color } as React.CSSProperties}
              >
                <div className="module-icon" style={{ background: module.color }}>
                  {module.icon}
                </div>
                <div className="module-content">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          <div className="home-footer">
            <div className="footer-left">
              <span className="footer-dot"></span>
              <span>Ready to start</span>
            </div>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}