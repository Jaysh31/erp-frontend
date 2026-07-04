import { useLocation, Link } from "react-router-dom";
import "./Header.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import { useModule } from '../context/ModuleContext';

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/manufacturing": "Manufacturing Dashboard",
  "/dashboard/sales": "Sales Dashboard",
  "/dashboard/purchasing": "Purchasing Dashboard",
  "/dashboard/accounting": "Accounting Dashboard",
  "/dashboard/setup": "Setup Dashboard",
  "/dashboard/organization": "Organization Dashboard",
  "/dashboard/tools": "Tools Dashboard",
  "/dashboard/reports": "Reports Dashboard",
  "/dashboard/stock": "Stock Dashboard",
  "/dashboard/quality": "Quality Dashboard",
  "/home": "Home",
  "/bom": "BOM",
  "/work-order": "Work Order",
  "/job-card": "Job Card",
  "/stock-entry": "Stock Entry",
  "/material-planning": "Material Planning",
  "/tools": "Tools",
  "/reports": "Reports",
  "/setup": "Setup",
  "/settings": "Settings",
  "/item-list": "Item List",
  "/item-group": "Item Group",
  "/item-attribute": "Item Attribute",
  "/brand": "Brand",
  "/warehouse": "Warehouse",
  "/uom": "Unit of Measure",
  "/uom-conversion": "UOM Conversion",
  "/serial-no": "Serial No",
  "/batch-no": "Batch No",
  "/serial-batch-bundle": "Serial & Batch Bundle",
  "/sales-order": "Sales Order",
  "/sales-order/new": "Add Sales Order",
  "/sales-invoice": "Sales Invoice",
  "/sales-invoice/new": "Create Sales Invoice",
  "/company": "Company",
  "/letter-head": "Letter Head",
  "/quality": "Quality",
  "/stock": "Stock",
  "/material-request": "Material Request",
  "/request-for-quotation": "Request for Quotation",
  "/supplier-quotation": "Supplier Quotation",
  "/purchase-order": "Purchase Order",
  "/purchase-invoice": "Purchase Invoice",
  "/supplier": "Supplier",
  "/supplier-group": "Supplier Group",
  "/price-list": "Price List",
  "/address": "Address",
  "/contacts": "Contacts",
  "/supplier-scorecard": "Supplier Scorecard",
  "/supplier-scorecard-criteria": "Supplier Scorecard Criteria",
  "/item-price": "Item Price",
  "/pricing-rule": "Pricing Rule",
  "/coupon-code": "Coupon Code",
  "/accounting/dashboard": "Accounting Dashboard",
  "/accounting/accounts": "Accounts",
  "/chart-of-accounts": "Chart of Accounts",
  "/ledger-accounts": "Ledger Accounts",
  "/accounting/cost-centers": "Cost Centers",
  "/sales-receipts": "Delivery Challans",
  "/Customer-payments": "Customer Payments",
  "/customer-invoices": "Customer Invoices",
  "/receivables/credit-notes": "Credit Notes",
  "/outstanding-receivables": "Outstanding Receivables",
  "/payables/supplier-bills": "Supplier Bills",
  "/payables/supplier-payments": "Supplier Payments",
  "/payables/outstanding-payables": "Outstanding Payables",
  "/banking/bank-accounts": "Bank Accounts",
  "/banking/bank-transactions": "Bank Transactions",
  "/banking/bank-reconciliation": "Bank Reconciliation",
  "/expenses/expense": "Expense",
  "/quotation": "Quotation",
  "/Workstation": "Workstation",
  "/operations": "Operations"
};

// Module names for display
const MODULE_NAMES: Record<string, string> = {
  'home': 'Home',
  'manufacturing': 'Manufacturing',
  'setup': 'Setup',
  'sales': 'Sales',
  'purchasing': 'Purchasing',
  'organization': 'Organization',
  'tools': 'Tools',
  'reports': 'Reports',
  'system': 'System',
  'accounting': 'Accounting'
};

// Map modules to their dashboard paths
const MODULE_DASHBOARD_PATHS: Record<string, string> = {
  'home': '/home',
  'manufacturing': '/dashboard/manufacturing',
  'setup': '/dashboard/setup',
  'sales': '/dashboard/sales',
  'purchasing': '/dashboard/purchasing',
  'organization': '/dashboard/organization',
  'tools': '/dashboard/tools',
  'reports': '/dashboard/reports',
  'system': '/settings',
  'accounting': '/dashboard/accounting'
};

// Get the display name for a path
const getPageTitle = (path: string): string => {
  // Check exact match first
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  
  // Check if it's a dashboard path
  if (path.startsWith('/dashboard/')) {
    const module = path.replace('/dashboard/', '');
    const moduleName = MODULE_NAMES[module];
    if (moduleName) return `${moduleName} Dashboard`;
  }
  
  // Default fallback
  return "Dashboard";
};

export default function Header() {
  const location = useLocation();
  const { theme } = useAdminTheme();
  const { currentModule } = useModule();
  
  // Get the page title
  const pageTitle = getPageTitle(location.pathname);
  
  // Get the module name
  const moduleName = MODULE_NAMES[currentModule] || 'Home';

  // Don't show module name on home page
  const showModule = currentModule !== 'home';

  // Get the dashboard path for the current module
  const moduleDashboardPath = MODULE_DASHBOARD_PATHS[currentModule] || '/home';

  // Check if we're on a dashboard page
  const isDashboardPage = location.pathname.includes('/dashboard/') || location.pathname === '/dashboard';

  // Check if we're on the home page
  const isHomePage = location.pathname === '/home';

  return (
    <header className={`header ${theme}`}>
      <div className="header-breadcrumb">
        {/* Home icon - always links to home */}
        <Link to="/home" className="breadcrumb-home-link" title="Go to Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>
        
        {/* For home page - just show Home */}
        {isHomePage && (
          <>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-title">Home</span>
          </>
        )}

        {/* For dashboard pages */}
        {isDashboardPage && !isHomePage && (
          <>
            <span className="breadcrumb-sep">/</span>
            {showModule && (
              <>
                {/* Module name - clickable to go to module's dashboard */}
                <Link to={moduleDashboardPath} className="breadcrumb-module-link">
                  {moduleName}
                </Link>
                <span className="breadcrumb-sep">/</span>
              </>
            )}
            {/* Dashboard title */}
            <span className="breadcrumb-title">{pageTitle}</span>
          </>
        )}

        {/* For other pages (non-home, non-dashboard) */}
        {!isHomePage && !isDashboardPage && (
          <>
            <span className="breadcrumb-sep">/</span>
            {showModule && (
              <>
                {/* Module name - clickable to go to module's dashboard */}
                <Link to={moduleDashboardPath} className="breadcrumb-module-link">
                  {moduleName}
                </Link>
                <span className="breadcrumb-sep">/</span>
              </>
            )}
            {/* Current page */}
            <span className="breadcrumb-title">{pageTitle}</span>
          </>
        )}
      </div>
      <div className="header-right">
        <button className="header-icon-btn" aria-label="More options">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>
    </header>
  );
}