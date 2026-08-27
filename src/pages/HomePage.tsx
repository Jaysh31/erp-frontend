import { useNavigate } from "react-router-dom";
import { useModule } from '../context/ModuleContext';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import { hasModule, hasPermission } from '../utils/permissions';
import {
  FaCogs,
  FaIndustry,
  FaBoxes,
  FaClipboardCheck,
  FaChartBar,
  FaTools,
  FaBuilding,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaShoppingCart,

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
      path: "/dashboard/manufacturing",
      module: 'manufacturing' as const,
      description: "Manage production & BOM",
      color: "#6366f1",
      apiModule: 'Manufacturing'
    },
    {
      title: "Setup",
      icon: <FaCogs />,
      path: "/dashboard/setup",
      module: 'setup' as const,
      description: "Configure master data",
      color: "#8b5cf6",
      apiModule: 'Setup'
    },
    {
      title: "Sales",
      icon: <FaShoppingCart />,
      path: "/dashboard/sales",
      module: 'sales' as const,
      description: "Manage sales orders",
      color: "#f59e0b",
      apiModule: 'Sales'
    },
    {
      title: "Purchasing",
      icon: <FaShoppingCart />,
      path: "/dashboard/purchasing",
      module: 'purchasing' as const,
      description: "Manage purchase orders",
      color: "#f59e0b",
      apiModule: 'Purchasing'
    },
    {
      title: "Stock",
      icon: <FaBoxes />,
      path: "/dashboard/stock",
      module: 'stock' as const,
      description: "Manage inventory",
      color: "#06b6d4",
      apiModule: 'Setup'
    },
    {
      title: "Quality",
      icon: <FaClipboardCheck />,
      path: "/dashboard/quality",
      module: 'manufacturing' as const,
      description: "Quality control",
      color: "#10b981",
      apiModule: 'Setup',
      apiSubmodule: 'Quality Inspection'
    },
    {
      title: "Organization",
      icon: <FaBuilding />,
      path: "/dashboard/organization",
      module: 'organization' as const,
      description: "Company & letter head",
      color: "#8b5cf6",
      apiModule: 'Organisation'
    },
    {
      title: "Reports",
      icon: <FaChartBar />,
      path: "/dashboard/reports",
      module: 'reports' as const,
      description: "Analytics & insights",
      color: "#f59e0b",
      apiModule: 'Reports'
    },
    {
      title: "Accounting",
      icon: <FaMoneyBillWave />,
      path: "/dashboard/accounting",
      module: 'accounting' as const,
      description: "Manage financial records",
      color: "#10b981",
      apiModule: 'Accounting'
    },
    {
      title: "Tools",
      icon: <FaTools />,
      path: "/dashboard/tools",
      module: 'tools' as const,
      description: "Utilities & helpers",
      color: "#ef4444",
      apiModule: 'Tools'
    },
  ];

  // Only show a card if the logged-in user's modules array (from login response)
  // actually contains that module — for Quality, also require the submodule.
  // Order is preserved exactly as declared above.
  const visibleModules = modules.filter(m =>
    m.apiSubmodule
      ? hasPermission(m.apiModule, m.apiSubmodule)
      : hasModule(m.apiModule)
  );

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
              <h1>ChandraTara Industries</h1>
              <p>Select a module to begin your journey</p>
            </div>
          </div>

          {/* Module Grid - 4 columns */}
          <div className="module-grid">
            {visibleModules.map((module) => (
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