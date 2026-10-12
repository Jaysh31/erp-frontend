import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useModule } from '../context/ModuleContext';
import { Search, X, ArrowRight } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

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




  type SearchPage = {
    title: string;
    category: string;
    path: string;
    apiModule: string;
    apiSubmodule?: string;
  };

  const searchablePages: SearchPage[] = [
    // Sales
    { title: "Lead", category: "Sales", path: "/lead", apiModule: "Sales", apiSubmodule: "Lead" },
    { title: "Quotation", category: "Sales", path: "/quotation", apiModule: "Sales", apiSubmodule: "Quotation" },
    { title: "Sales Order", category: "Sales", path: "/sales-order", apiModule: "Sales", apiSubmodule: "Sales Order" },
    { title: "Proforma Invoice", category: "Sales", path: "/proforma-invoice", apiModule: "Sales", apiSubmodule: "Proforma Invoice" },
    { title: "Delivery Challans", category: "Sales", path: "/delivery-challan", apiModule: "Sales", apiSubmodule: "Delivery Challans" },
    { title: "Tax Invoice", category: "Sales", path: "/Tax-Invoice", apiModule: "Sales", apiSubmodule: "Tax Invoice/Sale Bill" },
    { title: "Customers", category: "Sales", path: "/customer", apiModule: "Sales", apiSubmodule: "Customers" },

    // Items and setup
    { title: "Items", category: "Setup", path: "/item-list", apiModule: "Setup", apiSubmodule: "Item" },
    { title: "Item Group", category: "Setup", path: "/item-group", apiModule: "Setup", apiSubmodule: "Item Group" },
    { title: "Warehouse", category: "Setup", path: "/warehouse", apiModule: "Setup", apiSubmodule: "Warehouse" },
    { title: "Workstation", category: "Setup", path: "/Workstation", apiModule: "Setup", apiSubmodule: "Workstation" },
    { title: "Operations", category: "Setup", path: "/operations", apiModule: "Setup", apiSubmodule: "Operations" },
    { title: "Unit of Measure", category: "Setup", path: "/uom", apiModule: "Setup", apiSubmodule: "Unit Of Measure (UOM)" },
    { title: "Quality Inspection", category: "Setup", path: "/quality-inspection", apiModule: "Setup", apiSubmodule: "Quality Inspection" },

    // Manufacturing and stock
    { title: "BOM", category: "Manufacturing", path: "/bom", apiModule: "Manufacturing", apiSubmodule: "BOM" },
    { title: "Work Order", category: "Manufacturing", path: "/work-order", apiModule: "Manufacturing", apiSubmodule: "Work Order" },
    { title: "Job Card", category: "Manufacturing", path: "/job-card", apiModule: "Manufacturing", apiSubmodule: "Job Card" },
    { title: "Stock Entry", category: "Manufacturing", path: "/stock-entry", apiModule: "Manufacturing", apiSubmodule: "Stock Inventory" },
    { title: "Inventory", category: "Stock", path: "/InventoryList", apiModule: "Setup", apiSubmodule: "Inventory" },
    { title: "Raw Material", category: "Stock", path: "/raw-material", apiModule: "Setup", apiSubmodule: "Raw Material" },
    { title: "Work In Progress", category: "Stock", path: "/work-in-progress", apiModule: "Setup", apiSubmodule: "Work In Progress" },
    { title: "Finished Goods", category: "Stock", path: "/finished-goods", apiModule: "Setup", apiSubmodule: "Finished Goods" },
    { title: "Stock Reports", category: "Stock", path: "/stock-reports", apiModule: "Setup", apiSubmodule: "Stock Reports" },

    // Purchasing
    { title: "Purchase Order", category: "Purchasing", path: "/purchase-order", apiModule: "Purchasing", apiSubmodule: "Purchase Order" },
    { title: "Goods Receipt Note", category: "Purchasing", path: "/grn", apiModule: "Purchasing", apiSubmodule: "Goods Receipt Note" },
    { title: "Purchase Invoice", category: "Purchasing", path: "/purchase-invoice", apiModule: "Purchasing", apiSubmodule: "Purchase Bill" },
    { title: "Supplier", category: "Purchasing", path: "/supplier", apiModule: "Purchasing", apiSubmodule: "Supplier" },

    // Organization
    { title: "Employee", category: "Organization", path: "/employee", apiModule: "Organisation", apiSubmodule: "Employee" },
    { title: "User Management", category: "Organization", path: "/user-management", apiModule: "Organisation", apiSubmodule: "User Managment" },
    { title: "Role Management", category: "Organization", path: "/role", apiModule: "Organisation", apiSubmodule: "Role Management" },
    { title: "Company", category: "Organization", path: "/company", apiModule: "Organisation", apiSubmodule: "Company" },
    { title: "Letter Head", category: "Organization", path: "/letter-head", apiModule: "Organisation", apiSubmodule: "Letter Head" },
    { title: "Bank Details", category: "Organization", path: "/bank-details", apiModule: "Organisation", apiSubmodule: "Bank Details" },

    // Accounting
    { title: "Chart of Accounts", category: "Accounting", path: "/chart-of-accounts", apiModule: "Accounting", apiSubmodule: "Chart of Accounts" },
    { title: "Ledger Accounts", category: "Accounting", path: "/ledger-accounts", apiModule: "Accounting", apiSubmodule: "Ledger Accounts" },
    { title: "Cost Centers", category: "Accounting", path: "/accounting/cost-centers", apiModule: "Accounting", apiSubmodule: "Cost Centers" },
    { title: "Customer Invoices", category: "Receivables", path: "/customer-invoices", apiModule: "Accounting", apiSubmodule: "Customer Invoices" },
    { title: "Customer Payments", category: "Receivables", path: "/Customer-payments", apiModule: "Accounting", apiSubmodule: "Customer Payments" },
    { title: "Credit Notes", category: "Receivables", path: "/Credit-notes-all", apiModule: "Accounting", apiSubmodule: "Credit Notes" },
    { title: "Debit Notes", category: "Receivables", path: "/Debit-notes", apiModule: "Accounting", apiSubmodule: "Debit Notes" },
    { title: "General Account Entry", category: "Receivables", path: "/GeneralAccountEntry", apiModule: "Accounting", apiSubmodule: "General Account Entry" },
    { title: "Outstanding Receivables", category: "Receivables", path: "/outstanding-receivables", apiModule: "Accounting", apiSubmodule: "Outstanding Receivables" },
    { title: "Supplier Bills", category: "Payables", path: "/payables/supplier-bills", apiModule: "Accounting", apiSubmodule: "Supplier Bills" },
    { title: "Supplier Payments", category: "Payables", path: "/payables/supplier-payments", apiModule: "Accounting", apiSubmodule: "Supplier Payments" },
    { title: "Outstanding Payables", category: "Payables", path: "/payables/outstanding-payables", apiModule: "Accounting", apiSubmodule: "Outstanding Payables" },
    { title: "Bank Accounts", category: "Banking", path: "/banking/bank-accounts", apiModule: "Accounting", apiSubmodule: "Bank Accounts" },
    { title: "Bank Transactions", category: "Banking", path: "/banking/bank-transactions", apiModule: "Accounting", apiSubmodule: "Bank Transactions" },
    { title: "Bank Reconciliation", category: "Banking", path: "/banking/bank-reconciliation", apiModule: "Accounting", apiSubmodule: "Bank Reconciliation" },
    { title: "Expense", category: "Expenses", path: "/expenses/expense", apiModule: "Accounting", apiSubmodule: "Expense" },

    // Tools and settings
    { title: "Tools", category: "Tools", path: "/tools", apiModule: "Tools", apiSubmodule: "Tools" },
    { title: "Settings", category: "Settings", path: "/settings", apiModule: "Settings", apiSubmodule: "Settings" },
  ];

  const visibleModules = modules.filter((module) =>
    module.apiSubmodule
      ? hasPermission(module.apiModule, module.apiSubmodule)
      : hasModule(module.apiModule)
  );

  // Filter accessible pages based on module and submodule permissions.
  const visibleSearchPages = searchablePages.filter((page) => {
    if (page.apiSubmodule) {
      return hasPermission(page.apiModule, page.apiSubmodule);
    }

    return hasModule(page.apiModule);
  });

  const query = searchQuery.trim().toLowerCase();

  // Search both module cards and individual ERP pages.
  const filteredModules = visibleModules.filter((module) =>
    `${module.title} ${module.description}`
      .toLowerCase()
      .includes(query)
  );

  const filteredPages = visibleSearchPages.filter((page) =>
    `${page.title} ${page.category}`
      .toLowerCase()
      .includes(query)
  );

  const handleModuleClick = (module: (typeof modules)[number]) => {
    setCurrentModule(module.module as any);
    setSearchQuery("");
    setShowSearchResults(false);
    navigate(module.path);
  };

  const handlePageClick = (page: SearchPage) => {
    // Set the correct current module before navigation.
    const moduleMapping: Record<string, string> = {
      Sales: "sales",
      Setup: "setup",
      Manufacturing: "manufacturing",
      Stock: "stock",
      Purchasing: "purchasing",
      Organisation: "organization",
      Accounting: "accounting",
      Reports: "reports",
      Tools: "tools",
      Settings: "settings",
    };

    const currentModule = moduleMapping[page.apiModule];

    if (currentModule) {
      setCurrentModule(currentModule as any);
    }

    setSearchQuery("");
    setShowSearchResults(false);
    navigate(page.path);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Escape") {
      setShowSearchResults(false);
      return;
    }

    if (event.key === "Enter") {
      if (filteredModules.length > 0) {
        handleModuleClick(filteredModules[0]);
      } else if (filteredPages.length > 0) {
        handlePageClick(filteredPages[0]);
      }
    }
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



            {/* Module Search - Right Side */}
  
  <div className="home-search-wrapper">
    <div className="home-search-box">
      <Search size={19} className="home-search-icon" />

      <input
        type="text"
        value={searchQuery}
        placeholder="Search modules and pages..."
        aria-label="Search modules and ERP pages"
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowSearchResults(true);
        }}
        onFocus={() => setShowSearchResults(true)}
        onKeyDown={handleSearchKeyDown}
      />

      {searchQuery && (
        <button
          type="button"
          className="home-search-clear"
          aria-label="Clear search"
          onClick={() => {
            setSearchQuery("");
            setShowSearchResults(true);
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>

    {showSearchResults && searchQuery.trim() && (
      <div className="home-search-results">
        {filteredModules.length === 0 &&
        filteredPages.length === 0 ? (
          <div className="home-search-empty">
            <Search size={22} />
            <span>No matching pages found</span>
            <small>Try another page or module name.</small>
          </div>
        ) : (
          <>
            {filteredModules.length > 0 && (
              <div className="home-search-group">
                <div className="home-search-group-title">
                  Modules
                </div>

                {filteredModules.map((module) => (
                  <button
                    type="button"
                    key={`module-${module.title}`}
                    className="home-search-result"
                    onClick={() => handleModuleClick(module)}
                  >
                    <span
                      className="home-search-result-icon"
                      style={{ color: module.color }}
                    >
                      {module.icon}
                    </span>

                    <span className="home-search-result-content">
                      <strong>{module.title}</strong>
                      <small>{module.description}</small>
                    </span>

                    <ArrowRight
                      size={16}
                      className="home-search-result-arrow"
                    />
                  </button>
                ))}
              </div>
            )}

            {filteredPages.length > 0 && (
              <div className="home-search-group">
                <div className="home-search-group-title">
                  Pages
                </div>

                {filteredPages.map((page) => (
                  <button
                    type="button"
                    key={`page-${page.path}`}
                    className="home-search-result"
                    onClick={() => handlePageClick(page)}
                  >
                    <span className="home-search-result-icon">
                      <Search size={17} />
                    </span>

                    <span className="home-search-result-content">
                      <strong>{page.title}</strong>
                      <small>{page.category}</small>
                    </span>

                    <ArrowRight
                      size={16}
                      className="home-search-result-arrow"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )}
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