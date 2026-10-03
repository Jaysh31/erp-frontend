// src/services/erpApi.ts

export const ERP_BASE_URL = 'https://erp.sculptortechpvtltd.com';

export interface ErpEndpoint {
  url: string;
  label: string;
  module: string;
  keywords: string[];
}

export const ERP_ENDPOINTS: Record<string, ErpEndpoint> = {
  // ── MANUFACTURING ─────────────────────────────────────────
  workOrder: {
    url: `${ERP_BASE_URL}/api/work-order?page=1&limit=100`,
    label: 'Work Orders',
    module: 'manufacturing',
    keywords: ['work order', 'work-order', 'workorder', 'work orders'],
  },
  jobCard: {
    url: `${ERP_BASE_URL}/api/job-card?page=1&limit=100`,
    label: 'Job Cards',
    module: 'manufacturing',
    keywords: ['job card', 'job-card', 'jobcard', 'job cards'],
  },
  inventory: {
    url: `${ERP_BASE_URL}/api/inventory?page=1&limit=100`,
    label: 'Inventory',
    module: 'manufacturing',
    keywords: ['inventory', 'stock', 'inventory list'],
  },
  bom: {
    url: `${ERP_BASE_URL}/api/bom?page=1&limit=100`,
    label: 'BOM',
    module: 'manufacturing',
    keywords: ['bom', 'bill of material', 'bill of materials'],
  },
  stockEntry: {
    url: `${ERP_BASE_URL}/api/stock-entry?page=1&limit=100`,
    label: 'Stock Entries',
    module: 'manufacturing',
    keywords: ['stock entry', 'stock-entry', 'stock entries', 'stock movement'],
  },

  // ── SETUP ─────────────────────────────────────────────────
  item: {
    url: `${ERP_BASE_URL}/api/item?page=1&limit=200`,
    label: 'Items',
    module: 'setup',
    keywords: ['item', 'items', 'item list'],
  },
  itemProduct: {
    url: `${ERP_BASE_URL}/api/item?page=1&limit=200&group=Product`,
    label: 'Product Items',
    module: 'setup',
    keywords: ['product item', 'product items', 'product list'],
  },
  itemRaw: {
    url: `${ERP_BASE_URL}/api/item?type=raw&limit=200`,
    label: 'Raw Items',
    module: 'setup',
    keywords: ['raw item', 'raw items', 'raw material', 'raw materials'],
  },
  itemGroup: {
    url: `${ERP_BASE_URL}/api/item-group?page=1&limit=100`,
    label: 'Item Groups',
    module: 'setup',
    keywords: ['item group', 'item-group', 'item groups'],
  },
  warehouse: {
    url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=100`,
    label: 'Warehouses',
    module: 'setup',
    keywords: ['warehouse', 'warehouses'],
  },
  workstation: {
    url: `${ERP_BASE_URL}/api/workstation?page=1&limit=100&sort_order=asc&sort_by=id`,
    label: 'Workstations',
    module: 'setup',
    keywords: ['workstation', 'workstations', 'work station'],
  },
  operation: {
    url: `${ERP_BASE_URL}/api/operation?page=1&limit=100`,
    label: 'Operations',
    module: 'setup',
    keywords: ['operation', 'operations'],
  },
  uom: {
    url: `${ERP_BASE_URL}/api/uom?page=1&limit=100`,
    label: 'Units of Measure',
    module: 'setup',
    keywords: ['uom', 'unit of measure', 'units'],
  },

  // ── QUALITY ───────────────────────────────────────────────
  qualityInspection: {
    url: `${ERP_BASE_URL}/api/quality-inspection?page=1&limit=100`,
    label: 'Quality Inspections',
    module: 'quality',
    keywords: ['quality inspection', 'quality-inspection', 'quality', 'inspections'],
  },

  // ── SALES ─────────────────────────────────────────────────
  lead: {
    url: `${ERP_BASE_URL}/api/lead?page=1&limit=100`,
    label: 'Leads',
    module: 'sales',
    keywords: ['lead', 'leads'],
  },
  quotation: {
    url: `${ERP_BASE_URL}/api/quotation?page=1&limit=100`,
    label: 'Quotations',
    module: 'sales',
    keywords: ['quotation', 'quotations', 'quote'],
  },
  salesOrder: {
    url: `${ERP_BASE_URL}/api/sales-order?page=1&limit=100`,
    label: 'Sales Orders',
    module: 'sales',
    keywords: ['sales order', 'sales-order', 'sales orders', 'salesorder'],
  },
 proformaInvoice: {
  url: `${ERP_BASE_URL}/api/sales-order?page=1&limit=100`,
  label: 'Proforma Invoices',
    module: 'sales',
    keywords: [
      'proforma invoice',
      'proforma-invoice',
      'proforma invoices',
      'proforma',
      'pi ',
    ],
  },
  deliveryNote: {
    url: `${ERP_BASE_URL}/api/delivery-note?page=1&limit=100`,
    label: 'Delivery Notes',
    module: 'sales',
    keywords: [
      'delivery note',
      'delivery-note',
      'delivery notes',
      'delivery challan',
      'delivery-challan',
      'challan',
      'challans',
    ],
  },
  salesInvoice: {
    url: `${ERP_BASE_URL}/api/sales-invoice?page=1&limit=100`,
    label: 'Sales Invoices',
    module: 'sales',
    keywords: [
      'sales invoice',
      'sales-invoice',
      'sales invoices',
      'sales bill',
      'sales bills',
      'tax invoice',
      'tax invoices',
    ],
  },

  // ── ORGANIZATION ──────────────────────────────────────────
  company: {
    url: `${ERP_BASE_URL}/api/company?page=1&limit=100`,
    label: 'Companies',
    module: 'organization',
    keywords: ['company', 'companies'],
  },
  customer: {
    url: `${ERP_BASE_URL}/api/customer?page=1&limit=100`,
    label: 'Customers',
    module: 'organization',
    keywords: ['customer', 'customers', 'client', 'clients'],
  },
  employee: {
    url: `${ERP_BASE_URL}/api/employee?page=1&limit=100`,
    label: 'Employees',
    module: 'organization',
    keywords: ['employee', 'employees', 'staff', 'worker', 'workers'],
  },
  supplier: {
    url: `${ERP_BASE_URL}/api/supplier?page=1&limit=100`,
    label: 'Suppliers',
    module: 'organization',
    keywords: ['supplier', 'suppliers', 'vendor', 'vendors'],
  },

  // ── PURCHASING ────────────────────────────────────────────
  purchaseOrder: {
    url: `${ERP_BASE_URL}/api/purchase-order?page=1&limit=100`,
    label: 'Purchase Orders',
    module: 'purchasing',
    keywords: ['purchase order', 'purchase-order', 'purchase orders', 'po ', 'pos '],
  },
  grn: {
    url: `${ERP_BASE_URL}/api/grn?page=1&limit=100`,
    label: 'GRN',
    module: 'purchasing',
    keywords: ['grn', 'grns', 'goods receipt note', 'goods receipt', 'goods receipt order', 'goods receipt orders'],
  },
  purchaseInvoice: {
    url: `${ERP_BASE_URL}/api/purchase-invoice?page=1&limit=100`,
    label: 'Purchase Invoices',
    module: 'purchasing',
    keywords: ['purchase invoice', 'purchase-invoice', 'purchase invoices', 'purchase bill', 'purchase bills'],
  },
};

// ============================================================
// ROUTE MAP
// ============================================================
export const ENDPOINT_ROUTES: Record<string, string> = {
  workOrder: '/work-order',
  jobCard: '/job-card',
  inventory: '/InventoryList',
  bom: '/bom',
  stockEntry: '/stock-entry',
  item: '/item-list',
  itemProduct: '/item-list',
  itemRaw: '/item-list',
  itemGroup: '/item-group',
  warehouse: '/warehouse',
  workstation: '/Workstation',
  operation: '/operations',
  uom: '/uom',
  qualityInspection: '/quality-inspection',
  lead: '/lead',
  quotation: '/quotation',
  salesOrder: '/sales-order',
  proformaInvoice: '/sales-order',
  deliveryNote: '/delivery-challan',
  salesInvoice: '/sales-bill',
  company: '/company',
  customer: '/customer',
  employee: '/employee',
  supplier: '/supplier',
  purchaseOrder: '/purchase-order',
  grn: '/grn',
  purchaseInvoice: '/purchase-invoice',
};

// ============================================================
// ENDPOINT DETAIL BASES
// ============================================================
export const ENDPOINT_DETAIL_BASES: Record<string, string> = {
  workOrder: '/work-order',
  jobCard: '/job-card',
  inventory: '/inventory',
  bom: '/bom',
  stockEntry: '/stock-entry',
  item: '/item',
  itemProduct: '/item',
  itemRaw: '/item',
  itemGroup: '/item-group',
  warehouse: '/warehouse',
  workstation: '/workstation',
  operation: '/operation',
  uom: '/uom',
  qualityInspection: '/quality-inspection',
  lead: '/lead',
  quotation: '/quotation',
  salesOrder: '/sales-order',
  proformaInvoice: '/sales-order',
  deliveryNote: '/delivery-note',
  salesInvoice: '/sales-invoice',
  company: '/company',
  customer: '/customer',
  employee: '/employee',
  supplier: '/supplier',
  purchaseOrder: '/purchase-order',
  grn: '/grn',
  purchaseInvoice: '/purchase-invoice',
};

// ============================================================
// ENDPOINT LIST BASES (for the list call, before /:id)
// ============================================================
export const ENDPOINT_LIST_BASES: Record<string, string> = {
  workOrder: '/work-order',
  jobCard: '/job-card',
  inventory: '/inventory',
  bom: '/bom',
  stockEntry: '/stock-entry',
  item: '/item',
  itemProduct: '/item',
  itemRaw: '/item',
  itemGroup: '/item-group',
  warehouse: '/warehouse',
  workstation: '/workstation',
  operation: '/operation',
  uom: '/uom',
  qualityInspection: '/quality-inspection',
  lead: '/lead',
  quotation: '/quotation',
  salesOrder: '/sales-order',
  proformaInvoice: '/sales-order',
  deliveryNote: '/delivery-note',
  salesInvoice: '/sales-invoice',
  company: '/company',
  customer: '/customer',
  employee: '/employee',
  supplier: '/supplier',
  purchaseOrder: '/purchase-order',
  grn: '/grn',
  purchaseInvoice: '/purchase-invoice',
};

// ============================================================
// NAME-KEYED MODULES
// ============================================================
export const NAME_KEYED_MODULES: Set<string> = new Set([
  'operation',
  'uom',
  'itemGroup',
  'warehouse',
  'workstation',
  'item',
  'itemProduct',
  'itemRaw',
  'company',
  'customer',
  'supplier',
  'employee',
]);

// ============================================================
// DETAIL LOOKUP FIELDS
// ============================================================
export const DETAIL_LOOKUP_FIELDS: Record<string, string[]> = {
  qualityInspection: ['inspection_no', 'id', 'name'],
  operation:         ['name', 'operation_name', 'id'],
  uom:               ['name', 'uom_name', 'id'],
  itemGroup:         ['name', 'item_group_name', 'id'],
  warehouse:         ['name', 'warehouse_name', 'id'],
  workstation:       ['name', 'workstation_name', 'id'],
  item:              ['item_code', 'item_name', 'name', 'id'],
  itemProduct:       ['item_code', 'item_name', 'name', 'id'],
  itemRaw:           ['item_code', 'item_name', 'name', 'id'],
  company:           ['name', 'company_name', 'id'],
  customer:          ['name', 'customer_name', 'id'],
  supplier:          ['name', 'supplier_name', 'id'],
  employee:          ['name', 'employee_name', 'id'],

  // ── Transactional modules ────────────────────────────────
  salesOrder:        ['name', 'sales_order_no', 'order_no', 'id'],
  quotation:         ['name', 'quotation_no', 'id'],
  proformaInvoice:   ['name', 'proforma_invoice_no', 'id'],
  deliveryNote:      ['name', 'delivery_note_no', 'id'],
  salesInvoice:      ['name', 'sales_invoice_no', 'invoice_no', 'id'],
  purchaseOrder:     ['name', 'purchase_order_no', 'order_no', 'id'],
  purchaseInvoice:   ['name', 'purchase_invoice_no', 'invoice_no', 'bill_no', 'id'],
  grn:               ['name', 'grn_no', 'id'],
  jobCard:           ['name', 'job_card_no', 'id'],
  workOrder:         ['name', 'work_order_no', 'id'],
  bom:               ['name', 'bom_no', 'id'],
  stockEntry:        ['name', 'stock_entry_no', 'id'],
  lead:              ['name', 'lead_name', 'id'],
};

// ============================================================
// DETAIL PAGE APIs
// ============================================================
export interface DetailRelatedApi {
  key: string;
  label: string;
  url: string;
}

export interface DetailPageConfig {
  masterBase: string;
  related: DetailRelatedApi[];
}

export const DETAIL_PAGE_APIS: Record<string, DetailPageConfig> = {
  // ── BOM detail page ───────────────────────────────────────
  bom: {
    masterBase: '/bom',
    related: [
      { key: 'bomList',      label: 'BOM List',      url: `${ERP_BASE_URL}/api/bom?limit=100` },
      { key: 'itemsProduct', label: 'Product Items', url: `${ERP_BASE_URL}/api/item?page=1&limit=200&group=Product` },
      { key: 'itemsRaw',     label: 'Raw Items',     url: `${ERP_BASE_URL}/api/item?type=raw&limit=200` },
      { key: 'operations',   label: 'Operations',    url: `${ERP_BASE_URL}/api/operation` },
      { key: 'workstations', label: 'Workstations',  url: `${ERP_BASE_URL}/api/workstation` },
      { key: 'warehouses',   label: 'Warehouses',    url: `${ERP_BASE_URL}/api/warehouse` },
    ],
  },

  // ── Work Order detail page ────────────────────────────────
  workOrder: {
    masterBase: '/work-order',
    related: [
      { key: 'bomList',      label: 'BOM List',      url: `${ERP_BASE_URL}/api/bom?limit=100` },
      { key: 'itemsProduct', label: 'Product Items', url: `${ERP_BASE_URL}/api/item?page=1&limit=200&group=Product` },
      { key: 'itemsRaw',     label: 'Raw Items',     url: `${ERP_BASE_URL}/api/item?type=raw&limit=200` },
      { key: 'operations',   label: 'Operations',    url: `${ERP_BASE_URL}/api/operation` },
      { key: 'workstations', label: 'Workstations',  url: `${ERP_BASE_URL}/api/workstation` },
      { key: 'warehouses',   label: 'Warehouses',    url: `${ERP_BASE_URL}/api/warehouse` },
    ],
  },

  // ── Job Card detail page ──────────────────────────────────
  jobCard: {
    masterBase: '/job-card',
    related: [
      { key: 'employees',    label: 'Employees',     url: `${ERP_BASE_URL}/api/employee` },
      { key: 'operations',   label: 'Operations',    url: `${ERP_BASE_URL}/api/operation` },
      { key: 'workstations', label: 'Workstations',  url: `${ERP_BASE_URL}/api/workstation` },
    ],
  },

  // ── Stock Entry detail page ───────────────────────────────
  stockEntry: {
    masterBase: '/stock-entry',
    related: [
      { key: 'warehouses',     label: 'Warehouses',    url: `${ERP_BASE_URL}/api/warehouse` },
      { key: 'suppliers',      label: 'Suppliers',     url: `${ERP_BASE_URL}/api/supplier` },
      { key: 'stockEntryList', label: 'Stock Entries', url: `${ERP_BASE_URL}/api/stock-entry?page=1&limit=100` },
    ],
  },

  // ── Quality Inspection detail page ────────────────────────
  qualityInspection: {
    masterBase: '/quality-inspection',
    related: [
      { key: 'itemsProduct', label: 'Product Items', url: `${ERP_BASE_URL}/api/item?page=1&limit=200&group=Product` },
      { key: 'itemsRaw',     label: 'Raw Items',     url: `${ERP_BASE_URL}/api/item?type=raw&limit=200` },
      { key: 'warehouses',   label: 'Warehouses',    url: `${ERP_BASE_URL}/api/warehouse` },
      { key: 'customers',    label: 'Customers',     url: `${ERP_BASE_URL}/api/customer` },
      { key: 'suppliers',    label: 'Suppliers',     url: `${ERP_BASE_URL}/api/supplier` },
      { key: 'employees',    label: 'Employees',     url: `${ERP_BASE_URL}/api/employee` },
      { key: 'inspections',  label: 'Inspections',   url: `${ERP_BASE_URL}/api/quality-inspection?page=1&limit=100` },
    ],
  },

  // ── Inventory detail page ─────────────────────────────────
  inventory: {
    masterBase: '/inventory/history',
    related: [
      { key: 'warehouses', label: 'Warehouses', url: `${ERP_BASE_URL}/api/warehouse` },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // SETUP MODULE DETAIL PAGES
  // ══════════════════════════════════════════════════════════

  itemGroup: {
    masterBase: '/item-group',
    related: [
      { key: 'itemGroups', label: 'Item Groups', url: `${ERP_BASE_URL}/api/item-group?page=1&limit=100` },
      { key: 'items',      label: 'Items',       url: `${ERP_BASE_URL}/api/item?page=1&limit=200` },
    ],
  },

  warehouse: {
    masterBase: '/warehouse',
    related: [
      { key: 'warehouses', label: 'Warehouses', url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=100` },
      { key: 'items',      label: 'Items',      url: `${ERP_BASE_URL}/api/item?page=1&limit=200` },
      { key: 'inventory',  label: 'Inventory',  url: `${ERP_BASE_URL}/api/inventory?limit=1000` },
    ],
  },

  workstation: {
    masterBase: '/workstation',
    related: [
      { key: 'workstations', label: 'Workstations', url: `${ERP_BASE_URL}/api/workstation?page=1&limit=100` },
      { key: 'operations',   label: 'Operations',   url: `${ERP_BASE_URL}/api/operation` },
      { key: 'employees',    label: 'Employees',    url: `${ERP_BASE_URL}/api/employee` },
    ],
  },

  // NOTE: operation's detail endpoint is /api/workstation on this ERP.
  // The list endpoint is still /api/operation, but the master fetch uses
  // /api/workstation/:name. This matches the API you gave me.
  operation: {
    masterBase: '/workstation',
    related: [
      { key: 'operations',   label: 'Operations',   url: `${ERP_BASE_URL}/api/operation` },
      { key: 'workstations', label: 'Workstations', url: `${ERP_BASE_URL}/api/workstation` },
    ],
  },

  uom: {
    masterBase: '/uom',
    related: [
      { key: 'uoms',  label: 'Units of Measure', url: `${ERP_BASE_URL}/api/uom?page=1&limit=100` },
      { key: 'items', label: 'Items',            url: `${ERP_BASE_URL}/api/item?page=1&limit=200` },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // SALES MODULE DETAIL PAGES
  // ══════════════════════════════════════════════════════════

  quotation: {
    masterBase: '/quotation',
    related: [
      { key: 'productsForLine', label: 'Product Items',  url: `${ERP_BASE_URL}/api/item?type=product&page=1&limit=200` },
      { key: 'customers',       label: 'Customers',      url: `${ERP_BASE_URL}/api/customer?page=1&limit=50` },
      { key: 'taxes',           label: 'Tax Master',     url: `${ERP_BASE_URL}/api/item/get-tax` },
      { key: 'warehouses',      label: 'Warehouses',     url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=100` },
    ],
  },

  salesOrder: {
    masterBase: '/sales-order',
    related: [
      { key: 'inventory',  label: 'Inventory',  url: `${ERP_BASE_URL}/api/inventory?limit=1000` },
      { key: 'warehouses', label: 'Warehouses', url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=100` },
      { key: 'customers',  label: 'Customers',  url: `${ERP_BASE_URL}/api/customer?page=1&limit=50` },
      { key: 'productsForLine', label: 'Product Items', url: `${ERP_BASE_URL}/api/item?type=product&page=1&limit=200` },
      { key: 'taxes',      label: 'Tax Master', url: `${ERP_BASE_URL}/api/item/get-tax` },
    ],
  },

  proformaInvoice: {
    masterBase: '/sales-order',
    related: [
      { key: 'productsForLine', label: 'Product Items', url: `${ERP_BASE_URL}/api/item?type=product&page=1&limit=200` },
      { key: 'customers',       label: 'Customers',     url: `${ERP_BASE_URL}/api/customer?page=1&limit=50` },
      { key: 'taxes',           label: 'Tax Master',    url: `${ERP_BASE_URL}/api/item/get-tax` },
      { key: 'warehouses',      label: 'Warehouses',    url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=100` },
      { key: 'inventory',       label: 'Inventory',     url: `${ERP_BASE_URL}/api/inventory?limit=1000` },
    ],
  },

  deliveryNote: {
    masterBase: '/delivery-note',
    related: [
      { key: 'productsForLine', label: 'Product Items', url: `${ERP_BASE_URL}/api/item?type=product&page=1&limit=200` },
      { key: 'customers',       label: 'Customers',     url: `${ERP_BASE_URL}/api/customer?page=1&limit=50` },
      { key: 'taxes',           label: 'Tax Master',    url: `${ERP_BASE_URL}/api/item/get-tax` },
      { key: 'warehouses',      label: 'Warehouses',    url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=100` },
      { key: 'inventory',       label: 'Inventory',     url: `${ERP_BASE_URL}/api/inventory?limit=1000` },
    ],
  },

  salesInvoice: {
    masterBase: '/sales-invoice',
    related: [
      { key: 'productsForLine', label: 'Product Items', url: `${ERP_BASE_URL}/api/item?type=product&page=1&limit=200` },
      { key: 'customers',       label: 'Customers',     url: `${ERP_BASE_URL}/api/customer?page=1&limit=50` },
      { key: 'taxes',           label: 'Tax Master',    url: `${ERP_BASE_URL}/api/item/get-tax` },
      { key: 'warehouses',      label: 'Warehouses',    url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=100` },
      { key: 'inventory',       label: 'Inventory',     url: `${ERP_BASE_URL}/api/inventory?limit=1000` },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // PURCHASING MODULE DETAIL PAGES
  // ══════════════════════════════════════════════════════════

  purchaseOrder: {
    masterBase: '/purchase-order',
    related: [
      { key: 'rawItems',   label: 'Raw Items',   url: `${ERP_BASE_URL}/api/item?type=raw&limit=200` },
      { key: 'items',      label: 'Items',       url: `${ERP_BASE_URL}/api/item?limit=200` },
      { key: 'taxes',      label: 'Tax Master',  url: `${ERP_BASE_URL}/api/item/get-tax` },
      { key: 'suppliers',  label: 'Suppliers',   url: `${ERP_BASE_URL}/api/supplier?page=1&limit=1000` },
      { key: 'customers',  label: 'Customers',   url: `${ERP_BASE_URL}/api/customer?page=1&limit=1000` },
      { key: 'warehouses', label: 'Warehouses',  url: `${ERP_BASE_URL}/api/warehouse?page=1&limit=1000` },
    ],
  },

  grn: {
    masterBase: '/grn',
    related: [
      { key: 'warehouses',    label: 'Warehouses',     url: `${ERP_BASE_URL}/api/warehouse?limit=200` },
      { key: 'employees',     label: 'Employees',      url: `${ERP_BASE_URL}/api/employee` },
      { key: 'purchaseOrders', label: 'Purchase Orders', url: `${ERP_BASE_URL}/api/purchase-order?limit=200` },
    ],
  },

  purchaseInvoice: {
    masterBase: '/purchase-invoice',
    related: [
      { key: 'purchaseOrders', label: 'Purchase Orders', url: `${ERP_BASE_URL}/api/purchase-order?limit=200` },
      { key: 'suppliers',      label: 'Suppliers',       url: `${ERP_BASE_URL}/api/supplier?limit=200` },
      { key: 'rawItems',       label: 'Raw Items',       url: `${ERP_BASE_URL}/api/item?type=raw&limit=200` },
      { key: 'items',          label: 'Items',           url: `${ERP_BASE_URL}/api/item?limit=200` },
      { key: 'taxes',          label: 'Tax Master',      url: `${ERP_BASE_URL}/api/item/get-tax` },
      { key: 'warehouses',     label: 'Warehouses',      url: `${ERP_BASE_URL}/api/warehouse?limit=200` },
    ],
  },
};

// ============================================================
// SALES DETAIL REGISTRY
// ============================================================
export const SALES_DETAIL_APIS: Record<string, { label: string; masterBase: string }> = {
  quotation:        { label: 'Quotation',        masterBase: '/quotation' },
  salesOrder:       { label: 'Sales Order',      masterBase: '/sales-order' },
  proformaInvoice:  { label: 'Proforma Invoice', masterBase: '/sales-order' },
  deliveryNote:     { label: 'Delivery Note',    masterBase: '/delivery-note' },
  salesInvoice:     { label: 'Sales Invoice',    masterBase: '/sales-invoice' },
};

// ============================================================
// PURCHASING DETAIL REGISTRY
// ============================================================
export const PURCHASING_DETAIL_APIS: Record<string, { label: string; masterBase: string }> = {
  purchaseOrder:   { label: 'Purchase Order',   masterBase: '/purchase-order' },
  grn:             { label: 'GRN',              masterBase: '/grn' },
  purchaseInvoice: { label: 'Purchase Invoice', masterBase: '/purchase-invoice' },
};

// ============================================================
// SETUP DETAIL REGISTRY
// ============================================================
export const SETUP_DETAIL_APIS: Record<string, { label: string; masterBase: string }> = {
  itemGroup:   { label: 'Item Group',  masterBase: '/item-group' },
  warehouse:   { label: 'Warehouse',   masterBase: '/warehouse' },
  workstation: { label: 'Workstation', masterBase: '/workstation' },
  operation:   { label: 'Operation',   masterBase: '/workstation' },
  uom:         { label: 'UOM',         masterBase: '/uom' },
};

// ============================================================
// QUALITY DETAIL REGISTRY
// ============================================================
export const QUALITY_DETAIL_APIS: Record<string, { label: string; masterBase: string }> = {
  qualityInspection: { label: 'Quality Inspection', masterBase: '/quality-inspection' },
};

// ============================================================
// LIST URL BUILDERS — use these in components instead of
// hand-building URLs like "/workstation?".
// ============================================================
export function buildListUrl(
  endpointKey: keyof typeof ERP_ENDPOINTS,
  extraParams: Record<string, string | number> = {}
): string {
  const base = ENDPOINT_LIST_BASES[endpointKey];
  if (!base) {
    throw new Error(`Unknown endpoint key: ${String(endpointKey)}`);
  }
  const url = new URL(`${ERP_BASE_URL}/api${base}`);
  // Only add page/limit if not already provided
  if (!url.searchParams.has('page')) url.searchParams.set('page', '1');
  if (!url.searchParams.has('limit')) url.searchParams.set('limit', '200');
  for (const [k, v] of Object.entries(extraParams)) {
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export function getWorkstationListUrl(): string {
  return buildListUrl('workstation', { sort_order: 'asc', sort_by: 'id' });
}

export function getOperationListUrl(): string {
  return buildListUrl('operation');
}

export function getUomListUrl(): string {
  return buildListUrl('uom');
}

export function getItemGroupListUrl(): string {
  return buildListUrl('itemGroup');
}

export function getWarehouseListUrl(): string {
  return buildListUrl('warehouse');
}

export function getQualityInspectionListUrl(): string {
  return buildListUrl('qualityInspection');
}

// 🆕 NEW: dedicated item list URL builder for components that need
//         a full item list at limit=200.
export function getItemListUrl(extraParams: Record<string, string | number> = {}): string {
  const url = new URL(`${ERP_BASE_URL}/api/item`);
  url.searchParams.set('limit', '200');
  for (const [k, v] of Object.entries(extraParams)) {
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

// ============================================================
// NAVIGATION HELPERS
// ============================================================
export interface ParsedDetailRoute {
  endpointKey: string;
  route: string;
  id: string;
}

export function getDetailRoute(
  endpointKey: keyof typeof ERP_ENDPOINTS,
  id: string | number
): string | null {
  const route = ENDPOINT_ROUTES[endpointKey];
  if (!route) return null;
  return `${route}/${encodeURIComponent(String(id))}`;
}

// FIXED: skip action segments (edit / view / new / create / detail)
// so "/purchase-invoice/edit/92" resolves to id "92" instead of "edit".
export function parseDetailRoute(pathname: string): ParsedDetailRoute | null {
  const ACTION_SEGMENTS = new Set(['edit', 'view', 'new', 'create', 'detail']);

  const sorted = Object.entries(ENDPOINT_ROUTES).sort(
    (a, b) => b[1].length - a[1].length
  );

  for (const [key, route] of sorted) {
    if (pathname === route) continue;
    if (!pathname.startsWith(route + '/')) continue;

    const rest = pathname.slice(route.length + 1);
    const segments = rest.split('/').filter(Boolean);
    const idSegment = segments.find(
      (s) => !ACTION_SEGMENTS.has(s.toLowerCase())
    );
    if (!idSegment) continue;

    return { endpointKey: key, route, id: decodeURIComponent(idSegment) };
  }

  return null;
}

// ============================================================
// DASHBOARD ROUTES
// ============================================================
export const DASHBOARD_ROUTES: Record<string, string> = {
  '/dashboard/sales': 'Sales Dashboard',
  '/dashboard/manufacturing': 'Manufacturing Dashboard',
  '/dashboard/setup': 'Setup Dashboard',
  '/dashboard/purchasing': 'Purchasing Dashboard',
  '/dashboard/organization': 'Organization Dashboard',
  '/dashboard/quality': 'Quality Dashboard',
  '/dashboard/stock': 'Stock Dashboard',
  '/dashboard/accounting': 'Accounting Dashboard',
  '/dashboard/reports': 'Reports Dashboard',
  '/dashboard/tools': 'Tools Dashboard',
  '/dashboard': 'Dashboard',
};

// ============================================================
// AUTH
// ============================================================
let _tokenCache: string | null = null;

function isJwtLike(v: string): boolean {
  if (!v || v.length < 30) return false;
  const parts = v.split('.');
  if (parts.length !== 3) return false;
  return parts[0].startsWith('eyJ');
}

function stripBearer(v: string): string {
  return v.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '').trim();
}

function getAuthToken(): string | null {
  if (_tokenCache) return _tokenCache;

  const directKeys = [
    'token', 'access_token', 'auth_token', 'accessToken',
    'authToken', 'jwt', 'bearer', 'id_token',
  ];

  for (const k of directKeys) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!v) continue;
    const cleaned = stripBearer(v);
    if (isJwtLike(cleaned)) {
      _tokenCache = cleaned;
      return cleaned;
    }
  }

  const objectKeys = [
    'user', 'auth', 'authData', 'auth_data',
    'session', 'loginResponse', 'loggedInUser', 'data',
  ];

  for (const k of objectKeys) {
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      const candidate =
        obj?.token ||
        obj?.access_token ||
        obj?.accessToken ||
        obj?.jwt ||
        obj?.authToken ||
        obj?.id_token ||
        obj?.data?.token ||
        obj?.data?.access_token;
      if (typeof candidate === 'string') {
        const cleaned = stripBearer(candidate);
        if (isJwtLike(cleaned)) {
          _tokenCache = cleaned;
          return cleaned;
        }
      }
    } catch {
      // not JSON, skip
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key);
    if (!value) continue;

    const cleaned = stripBearer(value);
    if (isJwtLike(cleaned)) {
      _tokenCache = cleaned;
      return cleaned;
    }

    const match = value.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (match) {
      _tokenCache = match[0];
      return match[0];
    }
  }

  return null;
}

export function clearAuthTokenCache(): void {
  _tokenCache = null;
}

// ============================================================
// FETCH — single page
// ============================================================
export interface FetchResult<T = any> {
  ok: boolean;
  data?: T;
  count?: number;
  error?: string;
  status?: number;
}

export async function fetchErpData<T = any>(url: string): Promise<FetchResult<T>> {
  const token = getAuthToken();

  if (!token) {
    return { ok: false, error: 'No auth token found. Please log in again.', status: 401 };
  }

  const safeUrl = url.replace(ERP_BASE_URL, '');
  console.log('📡 Fetching:', safeUrl);

  const makeRequest = async (authHeaderValue: string) => {
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeaderValue,
      },
    });
  };

  try {
    let res = await makeRequest(`Bearer ${token}`);
    console.log('📡 Status:', res.status);

    if (res.status === 401) {
      res = await makeRequest(token);
      console.log('📡 Status (raw token):', res.status);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('❌ API error body:', body.slice(0, 300));
      return {
        ok: false,
        status: res.status,
        error:
          res.status === 401
            ? 'Unauthorized — token rejected.'
            : res.status === 403
              ? 'Forbidden.'
              : `Request failed (${res.status})`,
      };
    }

    const json = await res.json();
    let count: number | undefined;
    if (Array.isArray(json)) count = json.length;
    else if (typeof json?.count === 'number') count = json.count;
    else if (typeof json?.total === 'number') count = json.total;
    else if (Array.isArray(json?.data)) count = json.data.length;

    return { ok: true, data: json, count };
  } catch (err: any) {
    console.error('❌ Fetch exception:', err?.message || err);
    return { ok: false, error: err?.message || 'Network error' };
  }
}

// ============================================================
// FETCH ALL PAGES
// ============================================================
export interface FetchAllResult<T = any> {
  ok: boolean;
  records: T[];
  total: number;
  pages: number;
  error?: string;
}

export async function fetchAllPages<T = any>(baseUrl: string): Promise<FetchAllResult<T>> {
  const token = getAuthToken();
  if (!token) {
    return {
      ok: false,
      records: [],
      total: 0,
      pages: 0,
      error: 'No auth token found. Please log in again.',
    };
  }

  const urlObj = new URL(baseUrl);
  urlObj.searchParams.set('limit', '100');
  const limit = 100;

  const all: T[] = [];
  let page = 1;
  let reportedTotal = 0;
  const MAX_PAGES = 500;

  while (page <= MAX_PAGES) {
    urlObj.searchParams.set('page', String(page));
    const url = urlObj.toString();

    console.log(`📡 Fetching page ${page}: ${url.replace(ERP_BASE_URL, '')}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`❌ Page ${page} failed (${res.status}):`, errBody.slice(0, 200));
      return {
        ok: false,
        records: all,
        total: all.length,
        pages: page,
        error: `Page ${page} failed (${res.status})`,
      };
    }

    const json = await res.json();

    const raw = json?.data ?? json;
    const rows: T[] =
      (Array.isArray(raw?.records) && raw.records) ||
      (Array.isArray(raw?.data) && raw.data) ||
      (Array.isArray(raw) && raw) ||
      [];

    const declaredTotal =
      raw?.total ??
      raw?.count ??
      raw?.total_count ??
      raw?.totalCount ??
      json?.total ??
      json?.count ??
      undefined;
    if (typeof declaredTotal === 'number') reportedTotal = declaredTotal;

    all.push(...rows);
    console.log(`   page ${page}: got ${rows.length} rows, running total ${all.length}`);

    if (reportedTotal && all.length >= reportedTotal) break;
    if (rows.length < limit) break;

    page += 1;
  }

  console.log(
    `✅ fetchAllPages done: ${all.length} records across ${page} page(s)` +
      (reportedTotal ? ` (API says ${reportedTotal})` : '')
  );

  return {
    ok: true,
    records: all,
    total: reportedTotal || all.length,
    pages: page,
  };
}

// ============================================================
// RESOLVE RECORD FROM LIST
// ============================================================
export async function resolveRecordFromList(
  endpointKey: string,
  id: string
): Promise<any | null> {
  const base = ENDPOINT_LIST_BASES[endpointKey];
  if (!base) return null;

  const token = getAuthToken();
  if (!token) return null;

  const listUrl = `${ERP_BASE_URL}/api${base}?page=1&limit=100`;
  const idLower = String(id).toLowerCase();

  try {
    const res = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const raw = json?.data ?? json;
    const rows: any[] =
      (Array.isArray(raw?.records) && raw.records) ||
      (Array.isArray(raw?.data) && raw.data) ||
      (Array.isArray(raw) && raw) ||
      [];

    const lookupFields = DETAIL_LOOKUP_FIELDS[endpointKey] || ['id', 'name'];

    const match = rows.find((r: any) => {
      for (const field of lookupFields) {
        const v = r?.[field];
        if (v === undefined || v === null || v === '') continue;
        if (String(v).toLowerCase() === idLower) return true;
      }
      return false;
    });

    return match || null;
  } catch {
    return null;
  }
}

// ============================================================
// FETCH SINGLE RECORD BY ID OR NAME
// ============================================================
export async function fetchRecordById(
  endpointKey: keyof typeof ERP_ENDPOINTS,
  id: string
): Promise<any | null> {
  if (!endpointKey || !id) return null;

  const base = ENDPOINT_DETAIL_BASES[endpointKey];
  if (!base) return null;

  const token = getAuthToken();
  if (!token) return null;

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Try direct fetch
  const directUrl = `${ERP_BASE_URL}/api${base}/${encodeURIComponent(id)}`;
  console.log(`📡 Direct fetch: /api${base}/${id}`);

  try {
    const res = await fetch(directUrl, { method: 'GET', headers: authHeaders });
    if (res.ok) {
      const json = await res.json();
      const raw = json?.data ?? json;

      if (Array.isArray(raw) && raw.length > 0) return raw[0];
      if (Array.isArray(raw?.data) && raw.data.length > 0) return raw.data[0];
      if (Array.isArray(raw?.records) && raw.records.length > 0) return raw.records[0];
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
    } else {
      console.log(`↪️ Direct fetch ${base}/${id} returned ${res.status}`);
    }
  } catch (err: any) {
    console.log(`↪️ Direct fetch ${base}/${id} threw:`, err?.message || err);
  }

  // 2. Fallback: resolve from list
  console.log(`↪️ Resolving ${endpointKey}/${id} from list`);
  return resolveRecordFromList(endpointKey, id);
}

// ============================================================
// FETCH DETAIL PAGE DATA
// ============================================================
export interface DetailPageResult {
  ok: boolean;
  endpointKey: string;
  id: string;
  master: any | null;
  related: Record<string, any[]>;
  errors: string[];
}

export async function fetchDetailPageData(
  endpointKey: keyof typeof ERP_ENDPOINTS,
  id: string
): Promise<DetailPageResult> {
  const empty: DetailPageResult = {
    ok: false,
    endpointKey,
    id,
    master: null,
    related: {},
    errors: [],
  };

  const config = DETAIL_PAGE_APIS[endpointKey];
  if (!config) {
    empty.errors.push(`No detail-page config for "${endpointKey}".`);
    return empty;
  }

  const token = getAuthToken();
  if (!token) {
    empty.errors.push('No auth token found. Please log in again.');
    return empty;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const masterUrl =
    endpointKey === 'inventory'
      ? `${ERP_BASE_URL}/api/inventory/history?item_code=${encodeURIComponent(id)}`
      : `${ERP_BASE_URL}/api${config.masterBase}/${encodeURIComponent(id)}`;

  console.log(`📄 Detail page: fetching master ${masterUrl.replace(ERP_BASE_URL, '')}`);

  // Helper: parse a fetch response into a record.
  const parseRecord = (json: any): any => {
    const raw = json?.data ?? json;
    if (Array.isArray(raw)) return raw[0] ?? null;
    if (raw && typeof raw === 'object') return raw;
    return null;
  };

  const masterPromise = (async () => {
    try {
      // For name-keyed modules, skip the direct ID-based URL and go straight
      // to the list-lookup to avoid a guaranteed 404 + error log.
      const isNameKeyed = NAME_KEYED_MODULES.has(endpointKey);

      if (isNameKeyed) {
        const fromList = await resolveRecordFromList(endpointKey, id);
        if (fromList) {
          // Try a detail fetch with the resolved key, but don't log an error
          // if it fails — just use the list record.
          const resolvedKey =
            fromList?.name ??
            fromList?.item_code ??
            fromList?.code ??
            fromList?.inspection_no ??
            fromList?.id;

          if (resolvedKey !== undefined) {
            const retryUrl = `${ERP_BASE_URL}/api${config.masterBase}/${encodeURIComponent(
              String(resolvedKey)
            )}`;
            try {
              const retryRes = await fetch(retryUrl, {
                method: 'GET',
                headers: authHeaders,
              });
              if (retryRes.ok) {
                const json = await retryRes.json();
                const rec = parseRecord(json);
                if (rec) return { ok: true, data: rec };
              }
            } catch {
              // ignore — fall through to list record
            }
          }
          return { ok: true, data: fromList };
        }
      }

      // Non-name-keyed (or name-keyed with no list match): try direct URL.
      let res = await fetch(masterUrl, { method: 'GET', headers: authHeaders });

      // Fallback for quality-inspection / any module where direct fetch
      // fails (any non-OK status, not just 404).
      if (!res.ok && endpointKey !== 'inventory') {
        console.log(
          `↪️ /api${config.masterBase}/${id} failed (${res.status}) — resolving from list`
        );
        const listMatch = await resolveRecordFromList(endpointKey, id);
        if (listMatch) {
          const resolvedKey =
            listMatch?.id ??
            listMatch?.inspection_no ??
            listMatch?.name ??
            listMatch?.item_code ??
            listMatch?.code;

          if (
            resolvedKey !== undefined &&
            String(resolvedKey) !== String(id)
          ) {
            const retryUrl = `${ERP_BASE_URL}/api${config.masterBase}/${encodeURIComponent(
              String(resolvedKey)
            )}`;
            try {
              const retryRes = await fetch(retryUrl, {
                method: 'GET',
                headers: authHeaders,
              });
              if (retryRes.ok) res = retryRes;
              else return { ok: true, data: listMatch };
            } catch {
              return { ok: true, data: listMatch };
            }
          } else {
            return { ok: true, data: listMatch };
          }
        }
      }

      if (!res.ok) return { ok: false, status: res.status, data: null };
      const json = await res.json();
      return { ok: true, data: parseRecord(json) };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error', data: null };
    }
  })();

  const relatedPromises = config.related.map(async (rel) => {
    const r = await fetchAllPages(rel.url);
    return { key: rel.key, label: rel.label, result: r };
  });

  const [masterRes, ...relatedRes] = await Promise.all([
    masterPromise,
    ...relatedPromises,
  ]);

  const out: DetailPageResult = {
    ok: masterRes.ok,
    endpointKey,
    id,
    master: masterRes.data ?? null,
    related: {},
    errors: [],
  };

  if (!masterRes.ok) {
    out.errors.push(
      `Master record fetch failed (${(masterRes as any).status ?? 'n/a'})`
    );
  }

  for (const r of relatedRes) {
    if (r.result.ok) {
      out.related[r.key] = r.result.records;
    } else {
      out.errors.push(`${r.label}: ${r.result.error}`);
      out.related[r.key] = [];
    }
  }

  console.log(
    `✅ fetchDetailPageData(${endpointKey}, ${id}): ` +
      `master=${out.master ? '✓' : '✗'}, ` +
      `related keys=[${Object.keys(out.related).join(', ')}]` +
      (out.errors.length ? `, errors=${out.errors.length}` : '')
  );

  return out;
}

// ============================================================
// SALES DETAIL PAGE DATA
// ============================================================
export interface SalesPageDetailData {
  ok: boolean;
  endpointKey: string;
  id: string;
  master: any | null;
  productsForLine: any[];
  customers: any[];
  taxes: any[];
  warehouses: any[];
  inventory: any[];
  errors: string[];
}

export async function fetchSalesDetailPageData(
  endpointKey: keyof typeof ERP_ENDPOINTS,
  id: string
): Promise<SalesPageDetailData> {
  const empty: SalesPageDetailData = {
    ok: false,
    endpointKey,
    id,
    master: null,
    productsForLine: [],
    customers: [],
    taxes: [],
    warehouses: [],
    inventory: [],
    errors: [],
  };

  const config = DETAIL_PAGE_APIS[endpointKey];
  if (!config) {
    empty.errors.push(`No detail-page config for "${endpointKey}".`);
    return empty;
  }

  const token = getAuthToken();
  if (!token) {
    empty.errors.push('No auth token found. Please log in again.');
    return empty;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetcher = async (url: string) => {
    try {
      const res = await fetch(url, { method: 'GET', headers: authHeaders });
      if (!res.ok) return { ok: false, status: res.status, data: null };
      const json = await res.json();
      const raw = json?.data ?? json;
      return { ok: true, data: raw };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error', data: null };
    }
  };

  const masterUrl = `${ERP_BASE_URL}/api${config.masterBase}/${encodeURIComponent(id)}`;
  console.log(`📄 Sales detail (${endpointKey}): fetching master ${masterUrl.replace(ERP_BASE_URL, '')}`);

  const relatedUrls: Record<string, string> = {
    productsForLine: `${ERP_BASE_URL}/api/item?type=product&page=1&limit=200`,
    customers:       `${ERP_BASE_URL}/api/customer?page=1&limit=50`,
    taxes:           `${ERP_BASE_URL}/api/item/get-tax`,
    warehouses:      `${ERP_BASE_URL}/api/warehouse?page=1&limit=100`,
    inventory:       `${ERP_BASE_URL}/api/inventory?limit=1000`,
  };

  const [
    masterRes,
    productsRes,
    customersRes,
    taxesRes,
    warehousesRes,
    inventoryRes,
  ] = await Promise.all([
    fetcher(masterUrl),
    fetcher(relatedUrls.productsForLine),
    fetcher(relatedUrls.customers),
    fetcher(relatedUrls.taxes),
    fetcher(relatedUrls.warehouses),
    fetcher(relatedUrls.inventory),
  ]);

  const unwrapList = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  };

  const out: SalesPageDetailData = {
    ok: masterRes.ok,
    endpointKey,
    id,
    master: masterRes.data ?? null,
    productsForLine: unwrapList(productsRes.data),
    customers:       unwrapList(customersRes.data),
    taxes:           unwrapList(taxesRes.data),
    warehouses:      unwrapList(warehousesRes.data),
    inventory:       unwrapList(inventoryRes.data),
    errors: [],
  };

  if (!masterRes.ok) {
    out.errors.push(`Master fetch failed (${(masterRes as any).status ?? 'n/a'})`);
  }
  if (!productsRes.ok)   out.errors.push(`Product items failed (${(productsRes as any).status ?? 'n/a'})`);
  if (!customersRes.ok)  out.errors.push(`Customers failed (${(customersRes as any).status ?? 'n/a'})`);
  if (!taxesRes.ok)      out.errors.push(`Tax master failed (${(taxesRes as any).status ?? 'n/a'})`);
  if (!warehousesRes.ok) out.errors.push(`Warehouses failed (${(warehousesRes as any).status ?? 'n/a'})`);
  if (!inventoryRes.ok)  out.errors.push(`Inventory failed (${(inventoryRes as any).status ?? 'n/a'})`);

  console.log(
    `✅ fetchSalesDetailPageData(${endpointKey}, ${id}): ` +
      `master=${out.master ? '✓' : '✗'}, ` +
      `products=${out.productsForLine.length}, ` +
      `customers=${out.customers.length}, ` +
      `taxes=${out.taxes.length}, ` +
      `warehouses=${out.warehouses.length}, ` +
      `inventory=${out.inventory.length}` +
      (out.errors.length ? `, errors=${out.errors.length}` : '')
  );

  return out;
}

// ============================================================
// PURCHASING DETAIL PAGE DATA
// ============================================================
export interface PurchasingPageDetailData {
  ok: boolean;
  endpointKey: string;
  id: string;
  master: any | null;
  rawItems: any[];
  items: any[];
  taxes: any[];
  suppliers: any[];
  customers: any[];
  warehouses: any[];
  employees: any[];
  purchaseOrders: any[];
  errors: string[];
}

export async function fetchPurchasingDetailPageData(
  endpointKey: keyof typeof ERP_ENDPOINTS,
  id: string
): Promise<PurchasingPageDetailData> {
  const empty: PurchasingPageDetailData = {
    ok: false,
    endpointKey,
    id,
    master: null,
    rawItems: [],
    items: [],
    taxes: [],
    suppliers: [],
    customers: [],
    warehouses: [],
    employees: [],
    purchaseOrders: [],
    errors: [],
  };

  const config = DETAIL_PAGE_APIS[endpointKey];
  if (!config) {
    empty.errors.push(`No detail-page config for "${endpointKey}".`);
    return empty;
  }

  const token = getAuthToken();
  if (!token) {
    empty.errors.push('No auth token found. Please log in again.');
    return empty;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetcher = async (url: string) => {
    try {
      const res = await fetch(url, { method: 'GET', headers: authHeaders });
      if (!res.ok) return { ok: false, status: res.status, data: null };
      const json = await res.json();
      const raw = json?.data ?? json;
      return { ok: true, data: raw };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error', data: null };
    }
  };

  const masterUrl = `${ERP_BASE_URL}/api${config.masterBase}/${encodeURIComponent(id)}`;
  console.log(`📄 Purchasing detail (${endpointKey}): fetching master ${masterUrl.replace(ERP_BASE_URL, '')}`);

  // Item list at limit=200 for the purchase order line-item picker.
  const relatedUrls: Record<string, string> = {
    rawItems:       `${ERP_BASE_URL}/api/item?type=raw&limit=200`,
    items:          `${ERP_BASE_URL}/api/item?limit=200`,
    taxes:          `${ERP_BASE_URL}/api/item/get-tax`,
    suppliers:      `${ERP_BASE_URL}/api/supplier?limit=1000`,
    customers:      `${ERP_BASE_URL}/api/customer?limit=1000`,
    warehouses:     `${ERP_BASE_URL}/api/warehouse?limit=1000`,
    employees:      `${ERP_BASE_URL}/api/employee?limit=1000`,
    purchaseOrders: `${ERP_BASE_URL}/api/purchase-order?limit=1000`,
  };

  const [
    masterRes,
    rawItemsRes,
    itemsRes,
    taxesRes,
    suppliersRes,
    customersRes,
    warehousesRes,
    employeesRes,
    purchaseOrdersRes,
  ] = await Promise.all([
    fetcher(masterUrl),
    fetcher(relatedUrls.rawItems),
    fetcher(relatedUrls.items),
    fetcher(relatedUrls.taxes),
    fetcher(relatedUrls.suppliers),
    fetcher(relatedUrls.customers),
    fetcher(relatedUrls.warehouses),
    fetcher(relatedUrls.employees),
    fetcher(relatedUrls.purchaseOrders),
  ]);

  const unwrapList = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.rows)) return data.rows;
    return [];
  };

  const out: PurchasingPageDetailData = {
    ok: masterRes.ok,
    endpointKey,
    id,
    master: masterRes.data ?? null,
    rawItems:       unwrapList(rawItemsRes.data),
    items:          unwrapList(itemsRes.data),
    taxes:          unwrapList(taxesRes.data),
    suppliers:      unwrapList(suppliersRes.data),
    customers:      unwrapList(customersRes.data),
    warehouses:     unwrapList(warehousesRes.data),
    employees:      unwrapList(employeesRes.data),
    purchaseOrders: unwrapList(purchaseOrdersRes.data),
    errors: [],
  };

  if (!masterRes.ok)        out.errors.push(`Master fetch failed (${(masterRes as any).status ?? 'n/a'})`);
  if (!rawItemsRes.ok)      out.errors.push(`Raw items failed (${(rawItemsRes as any).status ?? 'n/a'})`);
  if (!itemsRes.ok)         out.errors.push(`Items failed (${(itemsRes as any).status ?? 'n/a'})`);
  if (!taxesRes.ok)         out.errors.push(`Tax master failed (${(taxesRes as any).status ?? 'n/a'})`);
  if (!suppliersRes.ok)     out.errors.push(`Suppliers failed (${(suppliersRes as any).status ?? 'n/a'})`);
  if (!customersRes.ok)     out.errors.push(`Customers failed (${(customersRes as any).status ?? 'n/a'})`);
  if (!warehousesRes.ok)    out.errors.push(`Warehouses failed (${(warehousesRes as any).status ?? 'n/a'})`);
  if (!employeesRes.ok)     out.errors.push(`Employees failed (${(employeesRes as any).status ?? 'n/a'})`);
  if (!purchaseOrdersRes.ok) out.errors.push(`Purchase orders failed (${(purchaseOrdersRes as any).status ?? 'n/a'})`);

  console.log(
    `✅ fetchPurchasingDetailPageData(${endpointKey}, ${id}): ` +
      `master=${out.master ? '✓' : '✗'}, ` +
      `rawItems=${out.rawItems.length}, ` +
      `items=${out.items.length}, ` +
      `taxes=${out.taxes.length}, ` +
      `suppliers=${out.suppliers.length}, ` +
      `customers=${out.customers.length}, ` +
      `warehouses=${out.warehouses.length}, ` +
      `employees=${out.employees.length}, ` +
      `purchaseOrders=${out.purchaseOrders.length}` +
      (out.errors.length ? `, errors=${out.errors.length}` : '')
  );

  return out;
}

// ============================================================
// BOM DETAIL PAGE DATA
// ============================================================
export interface BOMPageDetailData {
  ok: boolean;
  bomId: string;
  bom: any | null;
  items: any[];
  operations: any[];
  operationsMaster: any[];
  workstationsMaster: any[];
  warehousesMaster: any[];
  productItems: any[];
  rawItems: any[];
  errors: string[];
}

export async function fetchBOMDetailPageData(
  bomId: string
): Promise<BOMPageDetailData> {
  const empty: BOMPageDetailData = {
    ok: false,
    bomId,
    bom: null,
    items: [],
    operations: [],
    operationsMaster: [],
    workstationsMaster: [],
    warehousesMaster: [],
    productItems: [],
    rawItems: [],
    errors: [],
  };

  const token = getAuthToken();
  if (!token) {
    empty.errors.push('No auth token found. Please log in again.');
    return empty;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetcher = async (url: string) => {
    try {
      const res = await fetch(url, { method: 'GET', headers: authHeaders });
      if (!res.ok) return { ok: false, status: res.status, data: null };
      const json = await res.json();
      const raw = json?.data ?? json;
      return { ok: true, data: raw };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error', data: null };
    }
  };

  console.log(`📄 BOM detail: fetching /api/bom/${bomId} + operations + workstations + warehouses + items`);

  const [
    bomRes,
    operationsRes,
    workstationsRes,
    warehousesRes,
    productItemsRes,
    rawItemsRes,
  ] = await Promise.all([
    fetcher(`${ERP_BASE_URL}/api/bom/${encodeURIComponent(bomId)}`),
    fetcher(`${ERP_BASE_URL}/api/operation`),
    fetcher(`${ERP_BASE_URL}/api/workstation`),
    fetcher(`${ERP_BASE_URL}/api/warehouse`),
    fetcher(`${ERP_BASE_URL}/api/item?page=1&limit=200&group=Product`),
    fetcher(`${ERP_BASE_URL}/api/item?type=raw&limit=200`),
  ]);

  const unwrapList = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    return [];
  };

  let bom: any = null;
  let items: any[] = [];
  let operations: any[] = [];

  if (bomRes.ok && bomRes.data) {
    const d = bomRes.data;
    if (d.bom) {
      bom = d.bom;
      items = Array.isArray(d.items) ? d.items : [];
      operations = Array.isArray(d.operations) ? d.operations : [];
    } else {
      bom = d;
      items = Array.isArray(d.items) ? d.items : [];
      operations = Array.isArray(d.operations) ? d.operations : [];
    }
  } else if (!bomRes.ok) {
    empty.errors.push(`BOM fetch failed (${(bomRes as any).status ?? 'n/a'})`);
  }

  const out: BOMPageDetailData = {
    ok: bomRes.ok,
    bomId,
    bom,
    items,
    operations,
    operationsMaster: unwrapList(operationsRes.data),
    workstationsMaster: unwrapList(workstationsRes.data),
    warehousesMaster: unwrapList(warehousesRes.data),
    productItems: unwrapList(productItemsRes.data),
    rawItems: unwrapList(rawItemsRes.data),
    errors: [...empty.errors],
  };

  console.log(
    `✅ fetchBOMDetailPageData(${bomId}): ` +
      `bom=${out.bom ? '✓' : '✗'}, ` +
      `items=${out.items.length}, operations=${out.operations.length}, ` +
      `opsMaster=${out.operationsMaster.length}, ` +
      `wsMaster=${out.workstationsMaster.length}, ` +
      `whMaster=${out.warehousesMaster.length}, ` +
      `productItems=${out.productItems.length}, ` +
      `rawItems=${out.rawItems.length}`
  );

  return out;
}

// ============================================================
// QUALITY INSPECTION DETAIL PAGE DATA
// ============================================================
export interface QualityPageDetailData {
  ok: boolean;
  inspectionId: string;
  inspection: any | null;
  details: any[];
  observations: any[];
  productItems: any[];
  rawItems: any[];
  customers: any[];
  suppliers: any[];
  warehouses: any[];
  employees: any[];
  inspections: any[];
  errors: string[];
}

export async function fetchQualityDetailPageData(
  inspectionId: string
): Promise<QualityPageDetailData> {
  const empty: QualityPageDetailData = {
    ok: false,
    inspectionId,
    inspection: null,
    details: [],
    observations: [],
    productItems: [],
    rawItems: [],
    customers: [],
    suppliers: [],
    warehouses: [],
    employees: [],
    inspections: [],
    errors: [],
  };

  const token = getAuthToken();
  if (!token) {
    empty.errors.push('No auth token found. Please log in again.');
    return empty;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetcher = async (url: string) => {
    try {
      const res = await fetch(url, { method: 'GET', headers: authHeaders });
      if (!res.ok) return { ok: false, status: res.status, data: null };
      const json = await res.json();
      const raw = json?.data ?? json;
      return { ok: true, data: raw };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error', data: null };
    }
  };

  console.log(`📄 Quality Inspection detail: fetching /api/quality-inspection/${inspectionId}`);

  const [
    inspectionRes,
    productItemsRes,
    rawItemsRes,
    customersRes,
    suppliersRes,
    warehousesRes,
    employeesRes,
    inspectionsRes,
  ] = await Promise.all([
    fetcher(`${ERP_BASE_URL}/api/quality-inspection/${encodeURIComponent(inspectionId)}`),
    fetcher(`${ERP_BASE_URL}/api/item?page=1&limit=200&group=Product`),
    fetcher(`${ERP_BASE_URL}/api/item?type=raw&limit=200`),
    fetcher(`${ERP_BASE_URL}/api/customer`),
    fetcher(`${ERP_BASE_URL}/api/supplier`),
    fetcher(`${ERP_BASE_URL}/api/warehouse`),
    fetcher(`${ERP_BASE_URL}/api/employee`),
    fetcher(`${ERP_BASE_URL}/api/quality-inspection?page=1&limit=100`),
  ]);

  const unwrapList = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    return [];
  };

  let inspection: any = null;
  let details: any[] = [];
  let observations: any[] = [];

  if (inspectionRes.ok && inspectionRes.data) {
    const d = inspectionRes.data;
    inspection = d;
    details = Array.isArray(d.details) ? d.details : [];

    for (const detail of details) {
      if (Array.isArray(detail.observations)) {
        observations.push(...detail.observations);
      }
    }
  } else if (!inspectionRes.ok) {
    empty.errors.push(`Quality Inspection fetch failed (${(inspectionRes as any).status ?? 'n/a'})`);
  }

  const out: QualityPageDetailData = {
    ok: inspectionRes.ok,
    inspectionId,
    inspection,
    details,
    observations,
    productItems: unwrapList(productItemsRes.data),
    rawItems: unwrapList(rawItemsRes.data),
    customers: unwrapList(customersRes.data),
    suppliers: unwrapList(suppliersRes.data),
    warehouses: unwrapList(warehousesRes.data),
    employees: unwrapList(employeesRes.data),
    inspections: unwrapList(inspectionsRes.data),
    errors: [...empty.errors],
  };

  console.log(
    `✅ fetchQualityDetailPageData(${inspectionId}): ` +
      `inspection=${out.inspection ? '✓' : '✗'}, ` +
      `details=${out.details.length}, ` +
      `observations=${out.observations.length}, ` +
      `productItems=${out.productItems.length}, ` +
      `rawItems=${out.rawItems.length}, ` +
      `customers=${out.customers.length}, ` +
      `suppliers=${out.suppliers.length}, ` +
      `warehouses=${out.warehouses.length}, ` +
      `employees=${out.employees.length}, ` +
      `inspections=${out.inspections.length}`
  );

  return out;
}

// ============================================================
// SETUP DETAIL PAGE DATA
// ============================================================
export interface SetupPageDetailData {
  ok: boolean;
  endpointKey: string;
  id: string;
  master: any | null;
  itemGroups: any[];
  items: any[];
  warehouses: any[];
  workstations: any[];
  operations: any[];
  employees: any[];
  uoms: any[];
  inventory: any[];
  errors: string[];
}

export async function fetchSetupDetailPageData(
  endpointKey: keyof typeof ERP_ENDPOINTS,
  id: string
): Promise<SetupPageDetailData> {
  const empty: SetupPageDetailData = {
    ok: false,
    endpointKey,
    id,
    master: null,
    itemGroups: [],
    items: [],
    warehouses: [],
    workstations: [],
    operations: [],
    employees: [],
    uoms: [],
    inventory: [],
    errors: [],
  };

  const config = DETAIL_PAGE_APIS[endpointKey];
  if (!config) {
    empty.errors.push(`No detail-page config for "${endpointKey}".`);
    return empty;
  }

  const token = getAuthToken();
  if (!token) {
    empty.errors.push('No auth token found. Please log in again.');
    return empty;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetcher = async (url: string) => {
    try {
      const res = await fetch(url, { method: 'GET', headers: authHeaders });
      if (!res.ok) return { ok: false, status: res.status, data: null };
      const json = await res.json();
      const raw = json?.data ?? json;
      return { ok: true, data: raw };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error', data: null };
    }
  };

  const masterUrl = `${ERP_BASE_URL}/api${config.masterBase}/${encodeURIComponent(id)}`;
  console.log(`📄 Setup detail (${endpointKey}): fetching master ${masterUrl.replace(ERP_BASE_URL, '')}`);

  const relatedUrls: Record<string, string> = {
    itemGroups:  `${ERP_BASE_URL}/api/item-group?page=1&limit=100`,
    items:       `${ERP_BASE_URL}/api/item?page=1&limit=200`,
    warehouses:  `${ERP_BASE_URL}/api/warehouse?page=1&limit=100`,
    workstations: `${ERP_BASE_URL}/api/workstation?page=1&limit=100`,
    operations:  `${ERP_BASE_URL}/api/operation`,
    employees:   `${ERP_BASE_URL}/api/employee`,
    uoms:        `${ERP_BASE_URL}/api/uom?page=1&limit=100`,
    inventory:   `${ERP_BASE_URL}/api/inventory?limit=1000`,
  };

  const [
    masterRes,
    itemGroupsRes,
    itemsRes,
    warehousesRes,
    workstationsRes,
    operationsRes,
    employeesRes,
    uomsRes,
    inventoryRes,
  ] = await Promise.all([
    fetcher(masterUrl),
    fetcher(relatedUrls.itemGroups),
    fetcher(relatedUrls.items),
    fetcher(relatedUrls.warehouses),
    fetcher(relatedUrls.workstations),
    fetcher(relatedUrls.operations),
    fetcher(relatedUrls.employees),
    fetcher(relatedUrls.uoms),
    fetcher(relatedUrls.inventory),
  ]);

  const unwrapList = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  };

  let masterData = masterRes.data;
  if (!masterRes.ok) {
    const resolved = await resolveRecordFromList(endpointKey, id);
    if (resolved) masterData = resolved;
  }

  const out: SetupPageDetailData = {
    ok: masterRes.ok || masterData != null,
    endpointKey,
    id,
    master: masterData ?? null,
    itemGroups:  unwrapList(itemGroupsRes.data),
    items:       unwrapList(itemsRes.data),
    warehouses:  unwrapList(warehousesRes.data),
    workstations: unwrapList(workstationsRes.data),
    operations:  unwrapList(operationsRes.data),
    employees:   unwrapList(employeesRes.data),
    uoms:        unwrapList(uomsRes.data),
    inventory:   unwrapList(inventoryRes.data),
    errors: [],
  };

  if (!masterRes.ok && !masterData) {
    out.errors.push(`Master fetch failed (${(masterRes as any).status ?? 'n/a'})`);
  }
  if (!itemGroupsRes.ok)  out.errors.push(`Item groups failed (${(itemGroupsRes as any).status ?? 'n/a'})`);
  if (!itemsRes.ok)       out.errors.push(`Items failed (${(itemsRes as any).status ?? 'n/a'})`);
  if (!warehousesRes.ok)  out.errors.push(`Warehouses failed (${(warehousesRes as any).status ?? 'n/a'})`);
  if (!workstationsRes.ok) out.errors.push(`Workstations failed (${(workstationsRes as any).status ?? 'n/a'})`);
  if (!operationsRes.ok)  out.errors.push(`Operations failed (${(operationsRes as any).status ?? 'n/a'})`);
  if (!employeesRes.ok)   out.errors.push(`Employees failed (${(employeesRes as any).status ?? 'n/a'})`);
  if (!uomsRes.ok)        out.errors.push(`UOMs failed (${(uomsRes as any).status ?? 'n/a'})`);
  if (!inventoryRes.ok)   out.errors.push(`Inventory failed (${(inventoryRes as any).status ?? 'n/a'})`);

  console.log(
    `✅ fetchSetupDetailPageData(${endpointKey}, ${id}): ` +
      `master=${out.master ? '✓' : '✗'}, ` +
      `itemGroups=${out.itemGroups.length}, ` +
      `items=${out.items.length}, ` +
      `warehouses=${out.warehouses.length}, ` +
      `workstations=${out.workstations.length}, ` +
      `operations=${out.operations.length}, ` +
      `employees=${out.employees.length}, ` +
      `uoms=${out.uoms.length}, ` +
      `inventory=${out.inventory.length}` +
      (out.errors.length ? `, errors=${out.errors.length}` : '')
  );

  return out;
}

// ============================================================
// INVENTORY HISTORY
// ============================================================
export async function fetchInventoryHistory(
  itemCode: string
): Promise<FetchAllResult<any>> {
  if (!itemCode) {
    return { ok: false, records: [], total: 0, pages: 0, error: 'Missing item_code' };
  }

  const url = `${ERP_BASE_URL}/api/inventory/history?item_code=${encodeURIComponent(itemCode)}`;
  console.log(`📡 Inventory history: /api/inventory/history?item_code=${itemCode}`);

  const res = await fetchAllPages(url);

  if (!res.ok) {
    console.warn(`⚠️ inventory history failed: ${res.error}`);
  } else {
    console.log(`✅ inventory history returned ${res.records.length} rows`);
  }

  return res;
}

// ============================================================
// MATCH ENDPOINT
// ============================================================
export function matchEndpoint(question: string): ErpEndpoint | null {
  const q = question.toLowerCase();
  const allMatches: { keyword: string; endpoint: ErpEndpoint }[] = [];

  for (const ep of Object.values(ERP_ENDPOINTS)) {
    for (const kw of ep.keywords) {
      if (q.includes(kw)) allMatches.push({ keyword: kw, endpoint: ep });
    }
  }

  if (allMatches.length === 0) return null;
  allMatches.sort((a, b) => b.keyword.length - a.keyword.length);
  return allMatches[0].endpoint;
}

export function getEndpointUrl(key: keyof typeof ERP_ENDPOINTS): string {
  return ERP_ENDPOINTS[key].url;
}

// ============================================================
// ROUTE HELPERS
// ============================================================
export function getEndpointRoute(
  key: keyof typeof ERP_ENDPOINTS
): string | null {
  return ENDPOINT_ROUTES[key] || null;
}

// FIXED: require an exact match or a '/' boundary so that
// "/purchase-invoice" is not matched against a shorter prefix.
export function findEndpointKeyByRoute(route: string): string | null {
  const sorted = Object.entries(ENDPOINT_ROUTES).sort(
    (a, b) => b[1].length - a[1].length
  );
  for (const [key, r] of sorted) {
    if (route === r) return key;
    if (route.startsWith(r + '/')) return key;
  }
  return null;
}

export function findEndpointByLabelOrRoute(text: string): ErpEndpoint | null {
  const q = text.toLowerCase();

  for (const ep of Object.values(ERP_ENDPOINTS)) {
    if (q.includes(ep.label.toLowerCase())) return ep;
  }

  for (const [key, route] of Object.entries(ENDPOINT_ROUTES)) {
    if (q.includes(route.toLowerCase())) {
      const ep = ERP_ENDPOINTS[key];
      if (ep) return ep;
    }
  }

  return null;
}

export function detectNavigationTarget(question: string): {
  route: string;
  label: string;
} | null {
  const q = question.toLowerCase();

  const navKeywords = [
    'go to',
    'open ',
    'navigate',
    'take me to',
    'show me the page',
    'go on',
    'redirect',
  ];
  const isNav = navKeywords.some((kw) => q.includes(kw));
  if (!isNav) return null;

  const endpoint = findEndpointByLabelOrRoute(question);
  if (!endpoint) return null;

  for (const [key, ep] of Object.entries(ERP_ENDPOINTS)) {
    if (ep === endpoint) {
      const route = ENDPOINT_ROUTES[key];
      if (route) return { route, label: ep.label };
    }
  }

  return null;
}

// ============================================================
// SMART NAVIGATION
// ============================================================
export function detectSmartNavigation(question: string): {
  route: string;
  label: string;
  isDetail: boolean;
  endpointKey?: string;
  id?: string;
} | null {
  const q = question.toLowerCase();

  const navKeywords = [
    'go to', 'open', 'navigate', 'take me to',
    'show me the page', 'go on', 'redirect', 'show',
  ];
  const isNav = navKeywords.some((kw) => q.includes(kw));
  if (!isNav) return null;

  const endpoint = findEndpointByLabelOrRoute(question);
  if (!endpoint) return null;

  const endpointKey = Object.keys(ERP_ENDPOINTS).find(
    (k) => ERP_ENDPOINTS[k] === endpoint
  );
  if (!endpointKey) return null;

  // FIXED: prefer a full document-style ID (SAL-ORD-2026-00001, QIR-123)
  // before falling back to a bare number. Also skip year-like numbers.
  let id: string | null = null;
  const docMatch = question.match(/\b[A-Z][A-Z0-9]*(?:[-_][A-Z0-9]+)+\b/i);
  if (docMatch) {
    id = docMatch[0].toUpperCase();
  } else {
    const tokens = q.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      const cleaned = t.replace(/[^\w-]/g, '');
      if (!/^\d+$/.test(cleaned)) continue;
      const n = Number(cleaned);
      if (n >= 1900 && n <= 2099) continue;
      id = cleaned;
      break;
    }
  }

  if (!id) {
    const stopWords = new Set([
      'go', 'to', 'open', 'navigate', 'take', 'me', 'show', 'page', 'on',
      'redirect', 'the', 'detail', 'details', 'of', 'for', 'please', 'a', 'an',
      'and', 'or', 'is', 'are', 'was', 'were', 'this', 'that', 'with', 'about',
    ]);
    const labelWords = new Set(endpoint.label.toLowerCase().split(/\s+/));
    for (const kw of endpoint.keywords) {
      kw.split(/\s+/).forEach((w) => labelWords.add(w));
    }

    const originalTokens = question.split(/\s+/).filter(Boolean);
    const nameParts: string[] = [];
    for (const orig of originalTokens) {
      const cleaned = orig.replace(/[^\w-]/g, '');
      if (!cleaned) continue;
      const lower = cleaned.toLowerCase();
      if (stopWords.has(lower)) continue;
      if (labelWords.has(lower)) continue;
      if (/^\d+$/.test(cleaned)) continue;
      nameParts.push(cleaned);
    }

    if (nameParts.length > 0) {
      id = nameParts.join(' ');
    }
  }

  const baseRoute = ENDPOINT_ROUTES[endpointKey];
  if (!baseRoute) return null;

  if (id) {
    return {
      route: `${baseRoute}/${encodeURIComponent(id)}`,
      label: `${endpoint.label} "${id}"`,
      isDetail: true,
      endpointKey,
      id,
    };
  }

  return {
    route: baseRoute,
    label: endpoint.label,
    isDetail: false,
    endpointKey,
  };
}

// ============================================================
// DASHBOARD HELPERS
// ============================================================
export function isDashboardPath(pathname: string): {
  isDashboard: boolean;
  label: string;
} {
  const sorted = Object.keys(DASHBOARD_ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sorted) {
    if (pathname === key || pathname.startsWith(key + '/')) {
      return { isDashboard: true, label: DASHBOARD_ROUTES[key] };
    }
  }
  return { isDashboard: false, label: '' };
}

// ============================================================
// SETTINGS HELPERS
// ============================================================
export const SETTINGS_PATHS = ['/settings', '/Setting', '/admin/settings'];

export function isSettingsPath(pathname: string): boolean {
  return SETTINGS_PATHS.some((p) => pathname.startsWith(p));
}

// ============================================================
// SMART RECORD LOOKUP
// ============================================================
export interface RecordSearchResult {
  endpoint: ErpEndpoint;
  endpointKey: string;
  record: any;
}

export function extractSearchToken(question: string): string | null {
  // Prefer full document numbers like SAL-ORD-2026-00001 or QIR-123
  const docMatch = question.match(/\b[A-Z][A-Z0-9]*(?:[-_][A-Z0-9]+)+\b/i);
  if (docMatch) return docMatch[0].toUpperCase();

  const cleaned = question
    .replace(
      /\b(i want|its|it's|the|of|about|for|show|me|give|detail|details|please|record|info|information|full|is|are)\b/gi,
      ' '
    )
    .replace(/[?.!,]/g, ' ')
    .trim();

  const tokens = cleaned.split(/\s+/).filter(Boolean);

  const strongMatch = tokens.find(
    (t) => /[A-Za-z]/.test(t) && /\d/.test(t) && t.length >= 3
  );
  if (strongMatch) return strongMatch;

  const fallback = tokens.find((t) => /^[A-Za-z0-9_-]{4,}$/.test(t));
  return fallback || null;
}

export async function searchAllModulesForRecord(
  token: string
): Promise<RecordSearchResult | null> {
  const tokenLower = token.toLowerCase();

  const directChecks = Object.entries(ERP_ENDPOINTS).map(async ([key, ep]) => {
    try {
      const record = await fetchRecordById(key as keyof typeof ERP_ENDPOINTS, token);
      if (record) {
        console.log(`✅ Direct match: ${ep.label} / ${token}`);
        return {
          endpoint: ep,
          endpointKey: key,
          record,
        } as RecordSearchResult;
      }
      return null;
    } catch {
      return null;
    }
  });

  const directResults = await Promise.all(directChecks);
  const directHit = directResults.find((r) => r !== null) as RecordSearchResult | undefined;
  if (directHit) return directHit;

  const listChecks = Object.entries(ERP_ENDPOINTS).map(async ([key, ep]) => {
    try {
      const result = await fetchAllPages(ep.url);
      if (!result.ok) return null;

      const found = result.records.find((r: any) => {
        const candidates = [
          r.name,
          r.id,
          r.item_code,
          r.item_name,
          r.customer_name,
          r.supplier_name,
          r.party_name,
          r.lead_name,
          r.company_name,
          r.warehouse_name,
          r.operation_name,
          r.uom_name,
          r.item_group_name,
          r.workstation_name,
          r.inspection_no,
          r.code,
          r.label,
        ].filter(Boolean);

        return candidates.some((v: any) => {
          const s = String(v).toLowerCase();
          return s === tokenLower || s.includes(tokenLower);
        });
      });

      if (found) {
        console.log(`✅ List match: ${ep.label} / ${token}`);
        return {
          endpoint: ep,
          endpointKey: key,
          record: found,
        } as RecordSearchResult;
      }

      return null;
    } catch {
      return null;
    }
  });

  const listResults = await Promise.all(listChecks);
  return (listResults.find((r) => r !== null) as RecordSearchResult) || null;
}

/* ============================================================
   AI INTEGRATION
   ============================================================ */

export const AI_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const AI_API_KEY = '';

export const AI_MODEL = 'openai/gpt-oss-120b';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  ok: boolean;
  reply?: string;
  error?: string;
}

const SYSTEM_PROMPT =
  'You are a helpful assistant for Sculptor Tech ERP. ' +
  'You help users understand their Work Orders, Job Cards, Inventory, BOM, ' +
  'Quotations, Sales Orders, Purchase Orders, and other ERP modules. ' +
  'When live ERP data is provided to you in a system message, use it to ' +
  'answer questions accurately with real numbers and record names. ' +
  'Never invent data. If the data is not provided, say so.';

export async function askAi(
  question: string,
  history: ChatMessage[] = []
): Promise<AiResponse> {
  if (!question?.trim()) {
    return { ok: false, error: 'Empty question' };
  }

  const key: string = AI_API_KEY;
  if (!key || !key.startsWith('gsk_')) {
    console.warn('⚠️ AI key not set — the AI fallback will be skipped.');
    return {
      ok: false,
      error:
        '⚠️ AI API key not set. Open src/services/erpApi.ts ',
    };
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: question },
  ];

  console.log('🤖 Sending to Groq:', {
    totalMessages: messages.length,
    historyMessages: history.length,
    hasErpContext: history.some((h) => h.content.includes('live')),
  });

  try {
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    console.log('🤖 Groq response status:', res.status);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('❌ Groq error body:', body.slice(0, 400));
      if (res.status === 401) return { ok: false, error: 'Invalid AI API key.' };
      if (res.status === 429) return { ok: false, error: 'Rate limit reached.' };
      if (res.status === 413) return { ok: false, error: 'Request too large for the AI model.' };
      return { ok: false, error: `AI request failed (${res.status})` };
    }

    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content?.trim();
    if (!reply) return { ok: false, error: 'AI returned an empty response.' };

    console.log('✅ Groq replied:', reply.slice(0, 100));
    return { ok: true, reply };
  } catch (err: any) {
    console.error('❌ Groq exception:', err?.message || err);
    return { ok: false, error: err?.message || 'Network error.' };
  }
}

export async function askAiWithErpContext(
  question: string,
  history: ChatMessage[] = []
): Promise<AiResponse> {
  console.log('──────────────────────────────────────');
  console.log('🚀 askAiWithErpContext starting');
  console.log('📝 Question:', question);

  const detailHit = await tryAnswerFromDetailPage(question, history);
  if (detailHit) return detailHit;

  const endpoint = matchEndpoint(question);

  if (!endpoint) {
    console.log('🤖 STEP 1: No ERP module matched → asking AI directly');
    return askAi(question, history);
  }

  console.log(`✅ STEP 1: Matched ERP module = ${endpoint.label}`);

  console.log(`📡 STEP 2: Fetching ${endpoint.label} from ERP...`);
  const result = await fetchAllPages(endpoint.url);

  if (!result.ok) {
    console.warn(`⚠️ STEP 2 failed: ${result.error}`);
    return {
      ok: false,
      error: `Could not fetch ${endpoint.label}: ${result.error}`,
    };
  }

  console.log(`✅ STEP 2: Got ${result.records.length} records from ERP`);

  const records = result.records.slice(0, 10);
  console.log(`✅ STEP 3: Built ERP context (${records.length} records)`);

  const contextMessage: ChatMessage = {
    role: 'system',
    content:
      `Here is live ${endpoint.label} data from the ERP ` +
      `(showing ${records.length} of ${result.total} total records):\n\n` +
      JSON.stringify(records),
  };

  const enrichedHistory: ChatMessage[] = [...history, contextMessage];

  console.log('📤 STEP 4: Sending to Groq with ERP context...');
  const aiResult = await askAi(question, enrichedHistory);

  if (aiResult.ok) {
    console.log('✅ STEP 5: AI answer received');
  } else {
    console.warn(`⚠️ STEP 5: AI failed — ${aiResult.error}`);
  }

  return aiResult;
}

// ============================================================
// DETAIL-PAGE CHATBOT HELPER
// ============================================================
async function tryAnswerFromDetailPage(
  question: string,
  history: ChatMessage[]
): Promise<AiResponse | null> {
  const q = question.toLowerCase();

  const endpoint = matchEndpoint(question);
  if (!endpoint) return null;

  const endpointKey = Object.keys(ERP_ENDPOINTS).find(
    (k) => ERP_ENDPOINTS[k] === endpoint
  );
  if (!endpointKey) return null;

  if (!DETAIL_PAGE_APIS[endpointKey]) return null;

  // FIXED: prefer full document-style IDs over bare numbers, and skip
  // year-like numbers. This prevents "SAL-ORD-2026-00001" from being
  // parsed as just "2026".
  let id: string | null = null;
  const docMatch = question.match(/\b[A-Z][A-Z0-9]*(?:[-_][A-Z0-9]+)+\b/i);
  if (docMatch) {
    id = docMatch[0].toUpperCase();
  } else {
    const tokens = q.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      const cleaned = t.replace(/[^\w-]/g, '');
      if (!/^\d+$/.test(cleaned)) continue;
      const n = Number(cleaned);
      if (n >= 1900 && n <= 2099) continue;
      id = cleaned;
      break;
    }
  }

  if (!id) {
    const stopWords = new Set([
      'go', 'to', 'open', 'navigate', 'take', 'me', 'show', 'page', 'on',
      'redirect', 'the', 'detail', 'details', 'of', 'for', 'please', 'a', 'an',
      'and', 'or', 'is', 'are', 'was', 'were', 'this', 'that', 'with', 'about',
      'what', 'which', 'who', 'how', 'tell', 'give', 'get', 'find', 'search',
    ]);
    const labelWords = new Set(endpoint.label.toLowerCase().split(/\s+/));
    for (const kw of endpoint.keywords) {
      kw.split(/\s+/).forEach((w) => labelWords.add(w));
    }

    const originalTokens = question.split(/\s+/).filter(Boolean);
    const nameParts: string[] = [];
    for (const orig of originalTokens) {
      const cleaned = orig.replace(/[^\w-]/g, '');
      if (!cleaned) continue;
      const lower = cleaned.toLowerCase();
      if (stopWords.has(lower)) continue;
      if (labelWords.has(lower)) continue;
      if (/^\d+$/.test(cleaned)) continue;
      nameParts.push(cleaned);
    }

    if (nameParts.length > 0) {
      id = nameParts.join(' ');
    }
  }

  if (!id) return null;

  const listWords = ['all', 'list', 'every', 'show me all', 'show all'];
  if (listWords.some((w) => q.includes(w))) return null;

  console.log(`🔎 Detail-page question detected → ${endpointKey} #${id}`);

  const detail = await fetchDetailPageData(
    endpointKey as keyof typeof ERP_ENDPOINTS,
    id
  );

  if (!detail.master && Object.keys(detail.related).length === 0) {
    console.log('↪️ No detail data, falling back to normal flow');
    return null;
  }

  const contextLines: string[] = [];
  contextLines.push(
    `Live detail-page data for ${endpoint.label} #${id} from the ERP.`
  );
  contextLines.push(`Master record:\n${JSON.stringify(detail.master)}`);
  for (const [key, rows] of Object.entries(detail.related)) {
    contextLines.push(
      `Related "${key}" (${rows.length} rows, showing up to 10):\n` +
        JSON.stringify(rows.slice(0, 10))
    );
  }
  if (detail.errors.length) {
    contextLines.push(`Some fetches failed: ${detail.errors.join('; ')}`);
  }

  const contextMessage: ChatMessage = {
    role: 'system',
    content: contextLines.join('\n\n'),
  };

  console.log('📤 Sending detail-page context to Groq...');
  return askAi(question, [...history, contextMessage]);
}

export function extractRecordsFromErp(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.data?.records)) return payload.data.records;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}