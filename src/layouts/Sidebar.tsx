import React, { useState, useEffect, type JSX } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { useModule } from '../context/ModuleContext';
import logo from '../assets/logo.png';
import { UserIcon } from 'lucide-react';
import { GiHumanCannonball } from 'react-icons/gi';
import { RiQuillPenAiLine } from 'react-icons/ri';
// Import storage functions
import { getUserName, getUserEmail, getUserRole } from '../utils/storage';
// Import permission helper
import { hasSubmoduleByName } from '../utils/permissions';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

interface MenuItem {
  title: string;
  icon: JSX.Element;
  path: string;
  apiSubmodule?: string; // submodule name as returned by login API (omit to always show)
}

export default function Sidebar({ 
  isOpen = true, 
  onClose,
  isMinimized = false,
  onToggleMinimize
}: SidebarProps) {
  const location = useLocation();
  const { currentModule, setCurrentModule } = useModule();
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('expandedCategories');
    return saved ? JSON.parse(saved) : {
      'Manufacturing': true,
      'Sales': true,
      'Customers': true,
      'Items & Pricing': false,
      'Organization': false,
      'Setup': false,
      'Tools': false,
      'Reports': false,
      'Theme': false,
      'Purchase Documents': false,
      'Suppliers & Contacts': false,
      'Pricing & Lists': false,
      'Accounting': true,
      'Accounts': false,
      'Receivables': false,
      'Payables': false,
      'Banking': false,
      'Expenses': false,
      'Stock': true // ← Added Stock category - expanded by default
    };
  });

  // State for user data
  const [, setUserData] = useState({
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

  // Update module based on current path
  useEffect(() => {
    if (location.pathname === "/home") {
      setCurrentModule("home");
    }
  }, [location.pathname, setCurrentModule]);

  // Save expanded categories to localStorage
  useEffect(() => {
    localStorage.setItem('expandedCategories', JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle]
    }));
  };

  const handleNavClick = (e: React.MouseEvent) => {
    if (isMinimized && onToggleMinimize) {
      e.preventDefault();
      onToggleMinimize();
      const target = e.currentTarget as HTMLAnchorElement;
      setTimeout(() => {
        window.location.href = target.href;
      }, 350);
    }
  

      if (onClose) {
      onClose();
    }
  };

  // Close sidebar on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ─── Top level items (Home & Dashboard) ──────────────────────────────
  const topLevelItems: MenuItem[] = [
    { title: 'Home', icon: <HomeIcon />, path: '/home' },
    { 
      title: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: currentModule !== 'home' ? `/dashboard/${currentModule}` : '/dashboard/manufacturing' 
    }
  ];

  // All menu categories (without Home)
  const allMenuCategories: { title: string; module: string; icon: JSX.Element; items: MenuItem[] }[] = [
    {
      title: 'Sales',
      module: 'sales',
      icon: <SalesIcon />,
      items: [
        { title: 'Lead', icon: <GiHumanCannonball />, path: '/lead', apiSubmodule: 'Lead' },
        { title: 'Quotation', icon: <QuotationIcon />, path: '/quotation', apiSubmodule: 'Quotation' },
        { title: 'Sales Order', icon: <SalesOrderIcon />, path: '/sales-order', apiSubmodule: 'Sales Order' },
        { title: 'Proforma Invoice', icon: <SalesOrderIcon />, path: '/proforma-invoice', apiSubmodule: 'Proforma Invoice' },
        { title: 'Delivery Challans', icon: <ReceiptIcon />, path: '/delivery-challan', apiSubmodule: 'Delivery Challans' },
        { title: 'Tax Invoice/Sale Bill', icon: <InvoiceIcon />, path: '/sales-bill', apiSubmodule: 'Tax Invoice/Sale Bill' }
      ]
    },
    {
      title: 'Customers',
      module: 'sales',
      icon: <CustomersIcon />,
      items: [
        { title: 'Customers', icon: <CustomersIcon />, path: '/customer', apiSubmodule: 'Customers' },
      ]
    },
    {
      title: 'Items & Pricing',
      module: 'sales',
      icon: <ItemIcon />,
      items: [
        { title: 'Item', icon: <ItemIcon />, path: '/item-list', apiSubmodule: 'Item' },
        { title: 'Item Group', icon: <FolderIcon />, path: '/item-group', apiSubmodule: 'Item Group' },
      ]
    },
    {
      title: 'Manufacturing',
      module: 'manufacturing',
      icon: <ManufacturingIcon />,
      items: [
        { title: 'BOM', icon: <BomIcon />, path: '/bom', apiSubmodule: 'BOM' },
        { title: 'Work Order', icon: <WorkOrderIcon />, path: '/work-order', apiSubmodule: 'Work Order' },
        { title: 'Job Card', icon: <JobCardIcon />, path: '/job-card', apiSubmodule: 'Job Card' },
        { title: 'Stock Entry', icon: <StockIcon />, path: '/stock-entry', apiSubmodule: 'Stock Inventory' },
        { title: 'Inventory', icon: <BomIcon />, path: '/InventoryList', apiSubmodule: 'Inventory' },
      ]
    },
    {
      title: 'Organization',
      module: 'organization',
      icon: <OrganizationIcon />,
      items: [
        { title: 'Employee', icon: <WarehouseIcon />, path: '/employee', apiSubmodule: 'Employee' },
        { title: 'User Management', icon: <UserIcon />, path: '/user-management', apiSubmodule: 'User Managment' },
        { title: 'Role Management', icon: <UserIcon />, path: '/role', apiSubmodule: 'Role Management' },
        { title: 'Company', icon: <CompanyIcon />, path: '/company', apiSubmodule: 'Company' },
        { title: 'Letter Head', icon: <LetterHeadIcon />, path: '/letter-head', apiSubmodule: 'Letter Head' },
        { title: 'Bank Details', icon: <BankingIcon />, path: '/bank-details', apiSubmodule: 'Bank Details' }
      ]
    },
    {
      title: 'Setup',
      module: 'setup',
      icon: <SetupIcon />,
      items: [
        { title: 'Item', icon: <ItemIcon />, path: '/item-list', apiSubmodule: 'Item' },
        { title: 'Item Group', icon: <FolderIcon />, path: '/item-group', apiSubmodule: 'Item Group' },
        { title: 'Warehouse', icon: <WarehouseIcon />, path: '/warehouse', apiSubmodule: 'Warehouse' },
        { title: 'Workstation', icon: <WarehouseIcon />, path: '/Workstation', apiSubmodule: 'Workstation' },
        { title: 'Operations', icon: <WarehouseIcon />, path: '/operations', apiSubmodule: 'Operations' },
        { title: 'Unit of Measure (UOM)', icon: <RulerIcon />, path: '/uom', apiSubmodule: 'Unit Of Measure (UOM)' },
        { title: 'Quality Inspection', icon: <RiQuillPenAiLine />, path: '/quality-inspection', apiSubmodule: 'Quality Inspection' },
      ]
    },
    // ─── STOCK CATEGORY ──────────────────────────────────────────────────
    {
      title: 'Stock',
      module: 'stock',
      icon: <StockIcon />,
      items: [
        { title: 'Inventory', icon: <BomIcon />, path: '/InventoryList', apiSubmodule: 'Inventory' },
        { title: 'Raw Material', icon: <WarehouseIcon />, path: '/raw-material', apiSubmodule: 'Raw Material' },
        { title: 'Work In Progress', icon: <WorkOrderIcon />, path: '/work-in-progress', apiSubmodule: 'Work In Progress' },
        { title: 'Finished Goods', icon: <CheckIcon />, path: '/finished-goods', apiSubmodule: 'Finished Goods' },
        { title: 'Stock Reports', icon: <ReportIcon />, path: '/stock-reports', apiSubmodule: 'Stock Reports' },
      ]
    },
    {
      title: 'Tools',
      module: 'tools',
      icon: <ToolIcon />,
      items: [
        { title: 'Tools', icon: <ToolIcon />, path: '/tools', apiSubmodule: 'Tools' }
      ]
    },
    // ─── BUYING - Purchase Documents ───
    {
      title: 'Purchase Documents',
      module: 'purchasing',
      icon: <PurchaseDocumentsIcon />,
      items: [
        { title: 'Purchase Order', icon: <PurchaseOrderIcon />, path: '/purchase-order', apiSubmodule: 'Purchase Order' },
        { title: 'Goods Receipt Note', icon: <GRNIcon />, path: '/grn', apiSubmodule: 'Goods Receipt Note' },
        { title: 'Purchase Bill', icon: <PurchaseInvoiceIcon />, path: '/purchase-invoice', apiSubmodule: 'Purchase Bill' },
      ]
    },
    // ─── SUPPLIERS & CONTACTS ───
    {
      title: 'Suppliers & Contacts',
      module: 'purchasing',
      icon: <SupplierContactsIcon />,
      items: [
        { title: 'Supplier', icon: <SupplierIcon />, path: '/supplier', apiSubmodule: 'Supplier' },
      ]
    },
    {
      title: 'Accounts',
      module: 'accounting',
      icon: <AccountingIcon />,
      items: [
        { title: 'Chart of Accounts', icon: <ChartOfAccountsIcon />, path: '/chart-of-accounts', apiSubmodule: 'Chart of Accounts' },
        { title: 'Ledger Accounts', icon: <LedgerIcon />, path: '/ledger-accounts', apiSubmodule: 'Ledger Accounts' },
        { title: 'Cost Centers', icon: <CostCenterIcon />, path: '/accounting/cost-centers', apiSubmodule: 'Cost Centers' },
      ]
    },
    {
      title: 'Receivables',
      module: 'accounting',
      icon: <ReceivablesIcon />,
      items: [
        {
          title: 'Customer Invoices',
          icon: <InvoiceIcon />,
          path: '/customer-invoices',
          apiSubmodule: 'Customer Invoices'
        },
        {
          title: 'Customer Payments',
          icon: <PaymentIcon />,
          path: '/Customer-payments',
          apiSubmodule: 'Customer Payments'
        },
        {
          title: 'Credit Notes',
          icon: <CreditNoteIcon />,
          path: '/receivables/credit-notes',
          apiSubmodule: 'Credit Notes'
        },
        {
          title: 'Outstanding Receivables',
          icon: <CustomersIcon />,
          path: '/outstanding-receivables',
          apiSubmodule: 'Outstanding Receivables'
        }
      ]
    },
    {
      title: 'Payables',
      module: 'accounting',
      icon: <PayablesIcon />,
      items: [
        { title: 'Supplier Bills', icon: <SupplierIcon />, path: '/payables/supplier-bills', apiSubmodule: 'Supplier Bills' },
        { title: 'Supplier Payments', icon: <PaymentIcon />, path: '/payables/supplier-payments', apiSubmodule: 'Supplier Payments' },
        { title: 'Outstanding Payables', icon: <OutstandingIcon />, path: '/payables/outstanding-payables', apiSubmodule: 'Outstanding Payables' }
      ]
    },
    {
      title: 'Banking',
      module: 'accounting',
      icon: <BankingIcon />,
      items: [
        { title: 'Bank Accounts', icon: <BankAccountIcon />, path: '/banking/bank-accounts', apiSubmodule: 'Bank Accounts' },
        { title: 'Bank Transactions', icon: <BankTransactionIcon />, path: '/banking/bank-transactions', apiSubmodule: 'Bank Transactions' },
        { title: 'Bank Reconciliation', icon: <BankReconciliationIcon />, path: '/banking/bank-reconciliation', apiSubmodule: 'Bank Reconciliation' },
        { title: 'Setups', icon: <TagIcon />, path: '/CompanyAccountingSetup', apiSubmodule: 'Setups' },
      ]
    },
    {
      title: 'Expenses',
      module: 'accounting',
      icon: <ExpenseIcon />,
      items: [
        { title: 'Expense', icon: <TagIcon />, path: '/expenses/expense', apiSubmodule: 'Expense' },
      ]
    },
    {
      title: 'Setting',
      module: 'theme',
      icon: <SettingsIcon />,
      items: [
        { title: 'Settings', icon: <SettingsIcon />, path: '/settings', apiSubmodule: 'Settings' }
      ]
    }
  ];

  // Filter categories based on current module
  const getFilteredCategories = () => {
    return allMenuCategories.filter(cat =>
      cat.module === currentModule || cat.module === 'theme'
    );
  };

  // Filters out items the logged-in user has no permission for
  const applyPermissionFilter = (
    categories: { title: string; module: string; icon: JSX.Element; items: MenuItem[] }[]
  ) => {
    return categories
      .map(category => ({
        ...category,
        items: category.items.filter(item => {
          if (!item.apiSubmodule) return true;
          return hasSubmoduleByName(item.apiSubmodule);
        })
      }))
      .filter(category => category.items.length > 0);
  };

  const menuCategories = applyPermissionFilter(getFilteredCategories());

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'} ${isMinimized ? 'minimized' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <img src={logo} alt="SculptERP Logo" className="logo-image" />
            </div>
            <div className="logo-text">ChandraTara Ind</div>
          </div>
           {onClose && (
            <button 
              className="mobile-close-btn" 
              onClick={onClose}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              ×
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          {/* ─── Top Level Items: Home & Dashboard ─────────────────────── */}
          {topLevelItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item single-category-item ${isActive ? 'active' : ''}`
              }
              onClick={handleNavClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.title}</span>
              {isMinimized && (
                <span className="nav-tooltip">
                  {item.title}
                  <span className="tooltip-shortcut">Click to expand</span>
                </span>
              )}
            </NavLink>
          ))}

          {/* ─── Categories ────────────────────────────────────────────── */}
          {menuCategories.map((category, idx) => {
            // If a category has only a single menu item, render it directly
            if (category.items.length === 1) {
              const item = category.items[0];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item single-category-item ${isActive ? 'active' : ''}`
                  }
                  onClick={handleNavClick}
                >
                  <span className="nav-icon">{category.icon}</span>
                  <span className="nav-text">{category.title}</span>
                  {isMinimized && (
                    <span className="nav-tooltip">
                      {category.title}
                      <span className="tooltip-shortcut">Click to expand</span>
                    </span>
                  )}
                </NavLink>
              );
            }

            return (
              <div key={idx} className="nav-category">
                <div 
                  className="category-header"
                  onClick={() => toggleCategory(category.title)}
                >
                  <div className="category-header-left">
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-title">{category.title}</span>
                  </div>
                  <span className="category-toggle">
                    {expandedCategories[category.title] ? 
                      <ChevronUpIcon /> : 
                      <ChevronDownIcon />
                    }
                  </span>
                </div>
                <div className={`category-items-wrapper ${expandedCategories[category.title] ? 'expanded' : 'collapsed'}`}>
                  <div className="category-items">
                    {category.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                          `nav-item ${isActive ? 'active' : ''}`
                        }
                        onClick={handleNavClick}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-text">{item.title}</span>
                        {isMinimized && (
                          <span className="nav-tooltip">
                            {item.title}
                            <span className="tooltip-shortcut">Click to expand</span>
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ERP by Sculptotech - Footer */}
        <div className="sidebar-footer">
          <a 
            href="https://sculptortechpvtltd.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="erp-footer-link"
          >
            <img 
              src="/src/assets/logo1.png" 
              alt="Sculptotech Logo" 
              className="erp-footer-logo" 
            />
            <span className="erp-footer-text">Sculpt-ERP</span>
          </a>
        </div>
      </aside>

      {/* Toggle Button */}
      {isOpen && onToggleMinimize && (
      <button 
        className={`sidebar-toggle-btn ${isMinimized ? 'minimized' : 'expanded'}`}
        onClick={onToggleMinimize}
        aria-label={isMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
        title={isMinimized ? 'Click to expand' : 'Click to minimize'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <span className="toggle-tooltip">
          {isMinimized ? 'Expand' : 'Minimize'}
        </span>
      </button>
      )}
    </>
  );
}

// ===== ICON COMPONENTS =====

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const SalesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

const CustomersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <path d="M16 11l2 2 4-4"/>
    <path d="M18 13v4"/>
    <path d="M14 13h6"/>
  </svg>
);

const QuotationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const SalesOrderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2" ry="2"/>
    <line x1="8" y1="9" x2="16" y2="9"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
  </svg>
);

const InvoiceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
    <line x1="8" y1="9" x2="10" y2="9"/>
  </svg>
);

const ItemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const OrganizationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="4" rx="1"/>
    <rect x="2" y="14" width="6" height="4" rx="1"/>
    <rect x="16" y="14" width="6" height="4" rx="1"/>
    <path d="M12 6v4M12 10H5v4M12 10h7v4"/>
  </svg>
);

const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.17 9.17a2 2 0 0 0 2.83 0l7-7a2 2 0 0 0 0-2.83L12 2z"/>
    <circle cx="7" cy="7" r="2" fill="none"/>
  </svg>
);

const RulerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h20M12 2v20M8 4v2M16 4v2M4 8h2M18 8h2M4 16h2M18 16h2M8 20v2M16 20v2"/>
  </svg>
);

const ReceiptIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h12v20l-2-1.5L14 22l-2-1.5L10 22l-2-1.5L6 22V2z" />
    <path d="M9 7h6" />
    <path d="M9 11h6" />
    <path d="M9 15h4" />
  </svg>
);

const CreditNoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h12v20l-2-1.5L14 22l-2-1.5L10 22l-2-1.5L6 22V2z" />
    <path d="M9 7h6" />
    <path d="M9 11h4" />
    <path d="M15 16h-6" />
    <path d="M11 14l-2 2 2 2" />
  </svg>
);

const ManufacturingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4h6v6M4 20L20 4M18 20h-6M4 8V4h4"/>
  </svg>
);

const BomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const WorkOrderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

const JobCardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const StockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ReportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2"/>
    <circle cx="12" cy="16" r="5"/>
    <path d="M12 11v5"/>
    <path d="M9 14l3 3 3-3"/>
  </svg>
);

const CompanyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <path d="M9 8h6"/>
    <path d="M9 12h6"/>
    <path d="M9 16h4"/>
  </svg>
);

const LetterHeadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="3" y1="14" x2="21" y2="14"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
    <line x1="8" y1="4" x2="8" y2="10"/>
    <line x1="16" y1="4" x2="16" y2="10"/>
  </svg>
);

const SetupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
  </svg>
);

const WarehouseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <path d="M9 22V12h6v10"/>
  </svg>
);

const ReceivablesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <path d="M12 7v10" />
    <circle cx="8" cy="14" r="1.5" />
    <circle cx="16" cy="14" r="1.5" />
  </svg>
);

const PaymentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="M16 12h4" />
    <circle cx="8" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <path d="M4 16h7" />
  </svg>
);

const PayablesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <path d="M12 7v10" />
    <path d="M7 9.5v5" />
    <path d="M17 9.5v5" />
    <circle cx="8" cy="14" r="1.5" />
    <circle cx="16" cy="14" r="1.5" />
  </svg>
);

const OutstandingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
    <path d="M12 22v-4" />
    <path d="M6 12h2" />
    <path d="M16 12h2" />
  </svg>
);

const ToolIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const PurchaseDocumentsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const GRNIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
    <path d="M12 7v10"/>
    <path d="M8 10l4 2 4-2"/>
    <path d="M8 14l4 2 4-2"/>
  </svg>
);

const PurchaseOrderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const PurchaseInvoiceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="16" x2="16" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
    <line x1="8" y1="20" x2="10" y2="20"/>
    <path d="M8 8h4"/>
  </svg>
);

const SupplierContactsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <path d="M16 11l2 2 4-4"/>
    <path d="M17 12v6"/>
    <path d="M14 15h6"/>
    <path d="M21 15h-7"/>
  </svg>
);

const SupplierIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <path d="M16 11l2 2 4-4"/>
    <path d="M19 13v4"/>
    <path d="M16 13h6"/>
  </svg>
);

const AccountingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="2" ry="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="12" y1="6" x2="12" y2="20" />
  </svg>
);

const ChartOfAccountsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="14" y2="14" />
    <line x1="8" y1="18" x2="12" y2="18" />
  </svg>
);

const LedgerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
    <line x1="2" y1="7" x2="22" y2="7" />
  </svg>
);

const CostCenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <circle cx="12" cy="14" r="2" />
    <path d="M8 14h8" />
  </svg>
);

const BankingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 14h2" />
    <path d="M10 14h4" />
    <path d="M16 14h2" />
    <path d="M2 6l4-4h12l4 4" />
  </svg>
);

const BankAccountIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 14h2" />
    <path d="M10 14h4" />
    <path d="M16 14h2" />
    <path d="M2 6l4-4h12l4 4" />
  </svg>
);

const BankTransactionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    <line x1="8" y1="8" x2="16" y2="16" />
  </svg>
);

const BankReconciliationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="14" r="2" />
    <path d="M8 14h8" />
    <line x1="8" y1="18" x2="12" y2="18" />
  </svg>
);

const ExpenseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12h-3" />
    <path d="M6 12H3" />
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <path d="M17.5 6.5l2.5 2.5" />
    <path d="M4 15l2.5 2.5" />
    <path d="M6.5 6.5L4 9" />
    <path d="M17.5 17.5l2.5-2.5" />
    <path d="M12 8v4l2 2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 4l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 8l4-4 4 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);