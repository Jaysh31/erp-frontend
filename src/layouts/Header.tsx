import { useLocation, Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import { useModule } from '../context/ModuleContext';
import { useState, useEffect, useRef } from 'react';
import { getUserName, getUserEmail, getUserRole } from '../utils/storage';

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
  "/purchase-invoice": "Purchase Bill",
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
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const { currentModule } = useModule();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State for user data
  const [userData, setUserData] = useState({
    fullName: 'User',
    email: '',
    role: '',
    initials: 'U'
  });

  // Load user data from localStorage on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Function to load user data from storage
  const loadUserData = () => {
    const fullName = getUserName() || 'User';
    const email = getUserEmail() || '';
    const role = getUserRole()?.name || '';
    
    // Generate initials from full name
    const initials = fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    setUserData({
      fullName,
      email,
      role,
      initials: initials || 'U'
    });
  };

  // Listen for storage changes (if user data updates in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'userName' || e.key === 'userEmail' || e.key === 'userRole') {
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Handle logout - prevents going back
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('expandedCategories');
    localStorage.removeItem('sidebarMinimized');
    
    // Clear all session storage
    sessionStorage.clear();
    
    // Navigate to login with replace option
    // This prevents the user from going back to the previous page
    navigate('/Login', { replace: true });
  };

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
        {/* User Profile Section */}
        <div className="header-user-section" ref={dropdownRef}>
          <div 
            className="header-user-profile" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="header-user-avatar">{userData.initials}</div>
            <div className="header-user-info">
              <div className="header-user-name">{userData.fullName}</div>
              <div className="header-user-role">{userData.role || 'User'}</div>
            </div>
            <svg 
              className={`header-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="header-dropdown-menu">
              <div className="dropdown-user-info">
                <div className="dropdown-user-avatar-large">{userData.initials}</div>
                <div className="dropdown-user-details">
                  <div className="dropdown-user-name">{userData.fullName}</div>
                  <div className="dropdown-user-email">{userData.email}</div>
                  <div className="dropdown-user-role">{userData.role || 'User'}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => {/* Navigate to profile */}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </button>
              <button className="dropdown-item" onClick={() => {/* Navigate to settings */}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                Settings
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout-item" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}