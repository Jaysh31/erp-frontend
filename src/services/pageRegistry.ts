// src/services/pageRegistry.ts

export interface PageInfo {
  path: string;
  name: string;
  module: string;
  keywords?: string[];
}

export const PAGES: PageInfo[] = [
  // ---------- HOME ----------a
  { path: '/home', name: 'Home', module: 'home' },

  // ---------- DASHBOARDS ----------
  { path: '/dashboard', name: 'Dashboard', module: 'home' },
  { path: '/dashboard/manufacturing', name: 'Manufacturing Dashboard', module: 'manufacturing' },
  { path: '/dashboard/sales', name: 'Sales Dashboard', module: 'sales' },
  { path: '/dashboard/setup', name: 'Setup Dashboard', module: 'setup' },
  { path: '/dashboard/purchasing', name: 'Purchasing Dashboard', module: 'purchasing' },
  { path: '/dashboard/organization', name: 'Organization Dashboard', module: 'organization' },
  { path: '/dashboard/accounting', name: 'Accounting Dashboard', module: 'accounting' },
  { path: '/dashboard/tools', name: 'Tools Dashboard', module: 'tools' },
  { path: '/dashboard/reports', name: 'Reports Dashboard', module: 'reports' },
  { path: '/dashboard/stock', name: 'Stock Dashboard', module: 'manufacturing' },
  { path: '/dashboard/quality', name: 'Quality Dashboard', module: 'quality' },

  // ---------- MANUFACTURING ----------
  { path: '/bom', name: 'BOM List', module: 'manufacturing', keywords: ['bom', 'bill of material'] },
  { path: '/bom/new', name: 'Add BOM', module: 'manufacturing' },
  { path: '/work-order', name: 'Work Order List', module: 'manufacturing', keywords: ['work order'] },
  { path: '/work-order/new', name: 'Add Work Order', module: 'manufacturing' },
  { path: '/job-card', name: 'Job Card List', module: 'manufacturing', keywords: ['job card'] },
  { path: '/job-cards/new', name: 'Add Job Card', module: 'manufacturing' },
  { path: '/stock-entry', name: 'Stock Entry List', module: 'manufacturing', keywords: ['stock entry'] },
  { path: '/stock-entry/new', name: 'Add Stock Entry', module: 'manufacturing' },
  { path: '/InventoryList', name: 'Inventory', module: 'manufacturing', keywords: ['inventory'] },
  { path: '/inventory/detail/:itemCode', name: 'Inventory Detail', module: 'manufacturing' },

  // ---------- SETUP ----------
  { path: '/item-list', name: 'Item List', module: 'setup', keywords: ['item'] },
  { path: '/item/:id', name: 'Item Form', module: 'setup' },
  { path: '/item-group', name: 'Item Group List', module: 'setup', keywords: ['item group'] },
  { path: '/item-group/:id', name: 'Item Group Form', module: 'setup' },
  { path: '/item-attribute/new', name: 'Add Item Attribute', module: 'setup' },
  { path: '/warehouse', name: 'Warehouse List', module: 'setup', keywords: ['warehouse'] },
  { path: '/warehouse/new', name: 'Add Warehouse', module: 'setup' },
  { path: '/uom', name: 'UOM List', module: 'setup', keywords: ['uom', 'unit of measure'] },
  { path: '/uom/new', name: 'Add UOM', module: 'setup' },
  { path: '/operations', name: 'Operations List', module: 'setup', keywords: ['operation'] },
  { path: '/operation/new', name: 'Add Operation', module: 'setup' },
  { path: '/Workstation', name: 'Workstation List', module: 'setup', keywords: ['workstation'] },
  { path: '/NewWorkstation', name: 'Add Workstation', module: 'setup' },
  { path: '/item-bulk-upload', name: 'Item Bulk Upload', module: 'setup' },
  { path: '/employee', name: 'Employee List', module: 'organization', keywords: ['employee'] },
  { path: '/employee/new', name: 'Add Employee', module: 'organization' },

  // ---------- SALES ----------
  { path: '/sales-order', name: 'Sales Order List', module: 'sales', keywords: ['sales order'] },
  { path: '/sales-order/new', name: 'Add Sales Order', module: 'sales' },
  { path: '/sales-invoice', name: 'Sales Invoice List', module: 'sales', keywords: ['sales invoice'] },
  { path: '/sales-bill', name: 'Sales Bill List', module: 'sales', keywords: ['sales bill'] },
  { path: '/sales-bill/new', name: 'Add Sales Bill', module: 'sales' },
  { path: '/quotation', name: 'Quotation List', module: 'sales', keywords: ['quotation', 'quote'] },
  { path: '/quotation/new', name: 'Add Quotation', module: 'sales' },
  { path: '/proforma-invoice', name: 'Proforma Invoice List', module: 'sales', keywords: ['proforma'] },
  { path: '/proforma-invoice/new', name: 'Add Proforma Invoice', module: 'sales' },
  { path: '/delivery-challan', name: 'Delivery Challan List', module: 'sales', keywords: ['delivery challan'] },
  { path: '/delivery-challan/new', name: 'Add Delivery Challan', module: 'sales' },
  { path: '/lead', name: 'Lead List', module: 'sales', keywords: ['lead'] },
  { path: '/leads/new', name: 'Add Lead', module: 'sales' },
  { path: '/price-list', name: 'Price List', module: 'sales', keywords: ['price list'] },
  { path: '/item-price', name: 'Item Price', module: 'sales' },
  { path: '/pricing-rule', name: 'Pricing Rule', module: 'sales' },
  { path: '/coupon-code', name: 'Coupon Code', module: 'sales' },
  { path: '/customer', name: 'Customer List', module: 'sales', keywords: ['customer'] },
  { path: '/customer/add', name: 'Add Customer', module: 'sales' },
  { path: '/customer-invoices', name: 'Customer Invoices', module: 'accounting' },

  // ---------- PURCHASING ----------
  { path: '/supplier', name: 'Supplier List', module: 'purchasing', keywords: ['supplier'] },
  { path: '/supplier/new', name: 'Add Supplier', module: 'purchasing' },
  { path: '/supplier-group', name: 'Supplier Group', module: 'purchasing' },
  { path: '/material-request', name: 'Material Request', module: 'purchasing' },
  { path: '/purchase-order', name: 'Purchase Order List', module: 'purchasing', keywords: ['purchase order'] },
  { path: '/purchase-order/new', name: 'Add Purchase Order', module: 'purchasing' },
  { path: '/request-for-quotation', name: 'Request for Quotation', module: 'purchasing' },
  { path: '/supplier-quotation', name: 'Supplier Quotation', module: 'purchasing' },
  { path: '/purchase-invoice', name: 'Purchase Invoice List', module: 'purchasing', keywords: ['purchase invoice', 'purchase bill'] },
  { path: '/purchase-invoice/new', name: 'Add Purchase Invoice', module: 'purchasing' },
  { path: '/grn', name: 'GRN List', module: 'purchasing', keywords: ['grn', 'goods receipt'] },
  { path: '/grn/new', name: 'Add GRN', module: 'purchasing' },
  { path: '/contacts', name: 'Contacts', module: 'purchasing' },

  // ---------- ORGANIZATION ----------
  { path: '/company', name: 'Company List', module: 'organization', keywords: ['company'] },
  { path: '/company/new', name: 'Add Company', module: 'organization' },
  { path: '/letter-head', name: 'Letter Head List', module: 'organization', keywords: ['letter head'] },
  { path: '/letter-head/new', name: 'Add Letter Head', module: 'organization' },

  // ---------- ACCOUNTING ----------
  { path: '/accounts', name: 'Accounts', module: 'accounting' },
  { path: '/chart-of-accounts', name: 'Chart of Accounts', module: 'accounting' },
  { path: '/ledger-accounts', name: 'Ledger Accounts', module: 'accounting' },
  { path: '/outstanding-receivables', name: 'Outstanding Receivables', module: 'accounting' },
  { path: '/customer-payments', name: 'Customer Payments', module: 'accounting' },
  { path: '/payables/supplier-bills', name: 'Supplier Bills', module: 'accounting' },
  { path: '/bank-details', name: 'Bank Details', module: 'accounting' },
  { path: '/supplier-bills', name: 'Supplier Bill Form', module: 'accounting' },

  // ---------- QUALITY ----------
  { path: '/quality-inspection', name: 'Quality Inspection List', module: 'quality', keywords: ['quality inspection'] },
  { path: '/quality-inspection/new', name: 'Add Quality Inspection', module: 'quality' },

  // ---------- SYSTEM / USERS ----------
  { path: '/user-management', name: 'User Management', module: 'system', keywords: ['user'] },
  { path: '/users/new', name: 'Add User', module: 'system' },
  { path: '/role', name: 'Role List', module: 'system', keywords: ['role'] },
  { path: '/role/:id', name: 'Role Form', module: 'system' },
  { path: '/settings', name: 'Settings', module: 'system' },
  { path: '/module/:moduleId/submodules', name: 'Submodule Permissions', module: 'system' },

  // ---------- TOOLS ----------
  { path: '/CompanyAccountingSetup', name: 'Company Accounting Setup', module: 'tools' },
];

// ============================================================
// MATCHERS
// ============================================================
export function findPage(query: string): PageInfo | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const exact = PAGES.find((p) => p.path.toLowerCase() === q);
  if (exact) return exact;

  const matches: { score: number; page: PageInfo }[] = [];
  for (const page of PAGES) {
    const name = page.name.toLowerCase();
    if (q.includes(name)) matches.push({ score: name.length, page });
    for (const kw of page.keywords || []) {
      if (q.includes(kw.toLowerCase())) {
        matches.push({ score: kw.length, page });
      }
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return matches[0]?.page ?? null;
}

export function getPagesByModule(module: string): PageInfo[] {
  return PAGES.filter((p) => p.module === module.toLowerCase());
}

export function getPageCountByModule(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of PAGES) {
    counts[p.module] = (counts[p.module] || 0) + 1;
  }
  return counts;
}

export function getTotalPageCount(): number {
  return PAGES.length;
}

export function getAllModules(): string[] {
  return Array.from(new Set(PAGES.map((p) => p.module)));
}