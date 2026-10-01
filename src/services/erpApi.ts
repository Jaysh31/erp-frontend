// src/services/erpApi.ts

export const ERP_BASE_URL = 'https://erp.sculptortechpvtltd.com';

export interface ErpEndpoint {
  url: string;
  label: string;
  module: string;
  keywords: string[];
  /** Optional: base URL without query params for filtering */
  filterBase?: string;
}

export const ERP_ENDPOINTS: Record<string, ErpEndpoint> = {
  // ── MANUFACTURING ─────────────────────────────────────────
  workOrder: {
    url: `${ERP_BASE_URL}/api/work-order?page=1&limit=100`,
    label: 'Work Orders',
    module: 'manufacturing',
    keywords: ['work order', 'work-order', 'workorder', 'work orders', 'workorders'],
  },
  jobCard: {
    url: `${ERP_BASE_URL}/api/job-card?page=1&limit=100`,
    label: 'Job Cards',
    module: 'manufacturing',
    keywords: ['job card', 'job-card', 'jobcard', 'job cards', 'jobcards'],
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
    keywords: ['bom', 'boms', 'bill of material', 'bill of materials'],
    // 🆕 filterBase for filtered BOM queries (matches item/salesOrder pattern)
    filterBase: `${ERP_BASE_URL}/api/bom`,
  },
  stockEntry: {
    url: `${ERP_BASE_URL}/api/stock-entry?page=1&limit=100`,
    label: 'Stock Entries',
    module: 'manufacturing',
    keywords: ['stock entry', 'stock-entry', 'stock entries', 'stock movements', 'stock movement'],
  },

  // ── SETUP ─────────────────────────────────────────────────
  item: {
    url: `${ERP_BASE_URL}/api/item?page=1&limit=200`,
    label: 'Items',
    module: 'setup',
    keywords: ['item', 'items', 'item list'],
    filterBase: `${ERP_BASE_URL}/api/item`,
  },
  itemProduct: {
    url: `${ERP_BASE_URL}/api/item?page=1&limit=200&group=Product`,
    label: 'Product Items',
    module: 'setup',
    keywords: ['product item', 'product items', 'product list'],
    filterBase: `${ERP_BASE_URL}/api/item`,
  },
  itemRaw: {
    url: `${ERP_BASE_URL}/api/item?type=raw&limit=200`,
    label: 'Raw Items',
    module: 'setup',
    keywords: ['raw item', 'raw items', 'raw material', 'raw materials'],
    filterBase: `${ERP_BASE_URL}/api/item`,
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
    keywords: ['quotation', 'quotations', 'quote', 'quotes'],
  },
  salesOrder: {
    url: `${ERP_BASE_URL}/api/sales-order?page=1&limit=100`,
    label: 'Sales Orders',
    module: 'sales',
    keywords: [
      'sales order',
      'sales-order',
      'sales orders',
      'salesorder',
      'salesorders',
      'sale order',
      'sale-order',
      'sale orders',
    ],
    filterBase: `${ERP_BASE_URL}/api/sales-order`,
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
      'pi-',
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

  inventory:         ['item_code', 'name', 'id'],

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
// INVENTORY DETAIL ROUTE BUILDER
// ============================================================
export function buildInventoryDetailRoute(
  itemCode: string,
  record?: any
): string {
  const item = itemCode ?? record?.item_code ?? '';
  const type =
    record?.type ??
    record?.stock_type ??
    record?.warehouse_type ??
    'Internal';
  const warehouseId =
    record?.warehouse_id ??
    record?.warehouse ??
    record?.warehouseId ??
    '';

  const params = new URLSearchParams();
  params.set('type', String(type));
  if (warehouseId !== '' && warehouseId !== undefined && warehouseId !== null) {
    params.set('warehouse_id', String(warehouseId));
  }

  return `/inventory/detail/${encodeURIComponent(String(item))}?${params.toString()}`;
}

// ============================================================
// SALES ORDER FILTER URL BUILDER
// ============================================================
export function buildSalesOrderFilterUrl(params: {
  status?: string;
  customer?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}): string {
  const url = new URL(`${ERP_BASE_URL}/api/sales-order`);
  const { page = 1, limit = 100, ...rest } = params;

  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  return url.toString();
}

// ============================================================
// ITEM FILTER URL BUILDER
// ============================================================
export function buildItemFilterUrl(params: {
  status?: string;
  type?: string;
  group?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}): string {
  const url = new URL(`${ERP_BASE_URL}/api/item`);
  const { page = 1, limit = 200, ...rest } = params;

  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  return url.toString();
}

// ============================================================
// 🆕 BOM FILTER URL BUILDER
// ============================================================
/**
 * Builds a filtered BOM API URL.
 * Supports item, type, search, and pagination.
 *
 * Example:
 *   buildBOMFilterUrl({ item: 'wooden study table', page: 1, limit: 200 })
 *   → https://erp.sculptortechpvtltd.com/api/bom?page=1&limit=200&item=wooden%20study%20table
 */
export function buildBOMFilterUrl(params: {
  item?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}): string {
  const url = new URL(`${ERP_BASE_URL}/api/bom`);
  const { page = 1, limit = 200, ...rest } = params;

  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  return url.toString();
}

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

  jobCard: {
    masterBase: '/job-card',
    related: [
      { key: 'employees',    label: 'Employees',     url: `${ERP_BASE_URL}/api/employee` },
      { key: 'operations',   label: 'Operations',    url: `${ERP_BASE_URL}/api/operation` },
      { key: 'workstations', label: 'Workstations',  url: `${ERP_BASE_URL}/api/workstation` },
    ],
  },

  stockEntry: {
    masterBase: '/stock-entry',
    related: [
      { key: 'warehouses',     label: 'Warehouses',    url: `${ERP_BASE_URL}/api/warehouse` },
      { key: 'suppliers',      label: 'Suppliers',     url: `${ERP_BASE_URL}/api/supplier` },
      { key: 'stockEntryList', label: 'Stock Entries', url: `${ERP_BASE_URL}/api/stock-entry?page=1&limit=100` },
    ],
  },

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

  inventory: {
    masterBase: '/inventory/history',
    related: [
      { key: 'warehouses', label: 'Warehouses', url: `${ERP_BASE_URL}/api/warehouse` },
    ],
  },

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
// LIST URL BUILDERS
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
  if (endpointKey === 'inventory') {
    return buildInventoryDetailRoute(String(id));
  }
  const route = ENDPOINT_ROUTES[endpointKey];
  if (!route) return null;
  return `${route}/${encodeURIComponent(String(id))}`;
}

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

  const masterPromise = (async (): Promise<{ ok: boolean; data: any; status?: number; error?: string }> => {
    try {
      if (endpointKey === 'inventory') {
        const historyResult = await fetchInventoryHistory(id);
        if (historyResult.ok && historyResult.records.length > 0) {
          const first = historyResult.records[0] as any;
          const master = {
            ...first,
            item_code: id,
            total_movements: historyResult.records.length,
            history: historyResult.records,
          };
          return { ok: true, data: master };
        }
        const fromList = await resolveRecordFromList('inventory', id);
        if (fromList) return { ok: true, data: fromList };
        return { ok: false, data: null, status: 404 };
      }

      const masterUrl = `${ERP_BASE_URL}/api${config.masterBase}/${encodeURIComponent(id)}`;
      console.log(`📄 Detail page: fetching master ${masterUrl.replace(ERP_BASE_URL, '')}`);

      const parseRecord = (json: any): any => {
        const raw = json?.data ?? json;
        if (Array.isArray(raw)) return raw[0] ?? null;
        if (raw && typeof raw === 'object') return raw;
        return null;
      };

      const isNameKeyed = NAME_KEYED_MODULES.has(endpointKey);

      if (isNameKeyed) {
        const fromList = await resolveRecordFromList(endpointKey, id);
        if (fromList) {
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

      let res = await fetch(masterUrl, { method: 'GET', headers: authHeaders });

      if (!res.ok) {
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
// 🆕 BOM DETAIL (single) — thin wrapper around /api/bom/{id}
// ============================================================
/**
 * Fetches a single BOM by ID (calls `/api/bom/{bomId}`).
 *
 * Example:
 *   const bom = await fetchBOMDetail('91');
 *   // → GET https://erp.sculptortechpvtltd.com/api/bom/91
 */
export async function fetchBOMDetail(bomId: string | number): Promise<any | null> {
  if (bomId === undefined || bomId === null || String(bomId).trim() === '') {
    return null;
  }

  const token = getAuthToken();
  if (!token) {
    console.warn('⚠️ fetchBOMDetail: no auth token');
    return null;
  }

  const url = `${ERP_BASE_URL}/api/bom/${encodeURIComponent(String(bomId))}`;
  console.log(`📡 fetchBOMDetail: ${url.replace(ERP_BASE_URL, '')}`);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn(`⚠️ fetchBOMDetail: ${res.status}`);
      return null;
    }

    const json = await res.json();
    const raw = json?.data ?? json;
    if (Array.isArray(raw)) return raw[0] ?? null;
    if (Array.isArray(raw?.data)) return raw.data[0] ?? null;
    if (Array.isArray(raw?.records)) return raw.records[0] ?? null;
    if (raw && typeof raw === 'object') return raw;
    return null;
  } catch (err: any) {
    console.error('❌ fetchBOMDetail exception:', err?.message || err);
    return null;
  }
}

// ============================================================
// 🆕 PRODUCTION CAPACITY CHECK
// ============================================================
export interface ProductionCapacityComponent {
  itemCode: string;
  itemName: string;
  requiredPerUnit: number;
  availableStock: number;
  uom: string;
  maxUnits: number;
}

export interface ProductionCapacityResult {
  ok: boolean;
  bomId: string;
  bomName: string;
  productionItem: string;
  bomQuantity: number;
  /** How many finished units can be made from current stock. Infinity = all components available. */
  capacity: number;
  /** The component that limits production (lowest maxUnits). */
  limitingComponent: ProductionCapacityComponent | null;
  components: ProductionCapacityComponent[];
  error?: string;
}

/**
 * Mirrors the dashboard's "Production Capacity Check" widget.
 *
 * Steps:
 *   1. Fetch the BOM via `/api/bom/{bomId}`
 *   2. Fetch `/api/inventory` for current stock levels
 *   3. For each component, compute:
 *        requiredPerUnit = component.qty / bom.quantity
 *        maxUnits = floor(availableStock / requiredPerUnit)
 *   4. The result is the minimum across all components.
 *
 * Example:
 *   const cap = await fetchProductionCapacity('91');
 *   // → { capacity: 8, limitingComponent: { itemName: 'rtui', ... }, ... }
 */
export async function fetchProductionCapacity(
  bomId: string | number
): Promise<ProductionCapacityResult> {
  const empty: ProductionCapacityResult = {
    ok: false,
    bomId: String(bomId ?? ''),
    bomName: '',
    productionItem: '',
    bomQuantity: 0,
    capacity: 0,
    limitingComponent: null,
    components: [],
  };

  if (bomId === undefined || bomId === null || String(bomId).trim() === '') {
    empty.error = 'Missing BOM ID';
    return empty;
  }

  // ── 1. Fetch BOM ─────────────────────────────────────────
  const bom = await fetchBOMDetail(bomId);
  if (!bom) {
    empty.error = `Could not fetch BOM #${bomId}`;
    return empty;
  }

  const components: any[] =
    (Array.isArray(bom.items) && bom.items) ||
    (Array.isArray(bom.bom_items) && bom.bom_items) ||
    (Array.isArray(bom.components) && bom.components) ||
    [];

  if (components.length === 0) {
    empty.ok = false;
    empty.bomName = bom.name || '';
    empty.productionItem = bom.item_name || bom.item || bom.production_item || '';
    empty.bomQuantity = Number(bom.quantity ?? bom.qty ?? 1) || 1;
    empty.error = 'BOM has no components (or components not returned by API)';
    return empty;
  }

  const bomQty = Number(bom.quantity ?? bom.qty ?? 1) || 1;

  // ── 2. Fetch inventory ───────────────────────────────────
  const invResult = await fetchAllPages(`${ERP_BASE_URL}/api/inventory?limit=10000`);
  if (!invResult.ok) {
    empty.error = `Could not fetch inventory: ${invResult.error}`;
    return empty;
  }

  // Build a stock map: item_code → total available qty
  const stockMap = new Map<string, number>();
  for (const inv of invResult.records as any[]) {
    const code = String(inv.item_code ?? inv.item ?? '').toUpperCase().trim();
    if (!code) continue;
    const qty = Number(inv.actual_qty ?? inv.qty ?? 0) || 0;
    stockMap.set(code, (stockMap.get(code) || 0) + qty);
  }

  // ── 3. Compute per-component capacity ────────────────────
  const compRows: ProductionCapacityComponent[] = components.map((c: any) => {
    const code = String(c.item_code ?? c.item ?? '').toUpperCase().trim();
    const name = c.item_name || c.item_code || c.item || '—';
    const reqPerBom = Number(c.qty ?? c.quantity ?? 0) || 0;
    const requiredPerUnit = bomQty > 0 ? reqPerBom / bomQty : reqPerBom;
    const avail = stockMap.get(code) ?? 0;
    const maxUnits =
      requiredPerUnit > 0 ? Math.floor(avail / requiredPerUnit) : Infinity;
    return {
      itemCode: code || name,
      itemName: name,
      requiredPerUnit,
      availableStock: avail,
      uom: c.uom || c.stock_uom || '',
      maxUnits,
    };
  });

  const validRows = compRows.filter((r) => r.itemCode);

  // ── 4. Determine overall capacity ────────────────────────
  const finiteRows = validRows.filter((r) => Number.isFinite(r.maxUnits));
  const capacity =
    finiteRows.length > 0
      ? Math.min(...finiteRows.map((r) => r.maxUnits))
      : Infinity;
  const limiting =
    finiteRows.find((r) => r.maxUnits === capacity) ?? validRows[0] ?? null;

  return {
    ok: true,
    bomId: String(bom.id ?? bom.name ?? bomId),
    bomName: bom.name || bom.bom_no || '',
    productionItem: bom.item_name || bom.item || bom.production_item || '',
    bomQuantity: bomQty,
    capacity,
    limitingComponent: limiting,
    components: validRows,
  };
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
    if (endpointKey === 'inventory') {
      return {
        route: buildInventoryDetailRoute(id),
        label: `${endpoint.label} "${id}"`,
        isDetail: true,
        endpointKey,
        id,
      };
    }

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
   STATUS COUNT / FILTER HELPERS
   ============================================================ */

const STATUS_QUERY_PATTERNS = [
  /how many/i,
  /count/i,
  /number of/i,
  /total/i,
  /how much/i,
];

const STATUS_KEYWORDS: Record<string, string[]> = {
  completed:      ['completed', 'complete', 'done', 'finished', 'closed'],
  cancelled:      ['cancelled', 'canceled', 'cancel'],
  draft:          ['draft', 'draft status'],
  sent:           ['sent', 'send', 'sent status', 'dispatched'],
  accepted:       ['accepted', 'accept'],
  rejected:       ['rejected', 'reject'],
  expired:        ['expired', 'expire', 'expiring'],
  converted:      ['converted', 'convert', 'converted to order', 'converted order'],
  paid:           ['paid', 'fully paid'],
  'partially paid': ['partially paid', 'partially-paid', 'partial paid', 'part payment'],
  unpaid:         ['unpaid', 'not paid', 'un-paid'],
  'in process':   ['in process', 'in-process', 'in progress', 'in-progress', 'processing'],
  pending:        ['pending', 'awaiting', 'waiting'],
  open:           ['open', 'open status'],
  submitted:      ['submitted', 'submit'],
  approved:       ['approved', 'approve'],
  overdue:        ['overdue', 'over due'],
  'on hold':      ['on hold', 'on-hold', 'hold'],
  active:         ['active', 'enabled'],
  inactive:       ['inactive', 'disabled'],
};

const STATUS_FIELD_NAMES = [
  'status', 'work_order_status', 'order_status', 'job_card_status',
  'stock_entry_status', 'status_name', 'state', 'document_status',
  'bom_status', 'sales_order_status', 'purchase_order_status',
  'inspection_status', 'quotation_status', 'invoice_status',
  'production_status', 'current_status',
  'item_status', 'item_type', 'type',
];

export function getRecordStatus(record: any): string {
  for (const field of STATUS_FIELD_NAMES) {
    const v = record?.[field];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim().toLowerCase();
    }
  }
  return '';
}

function matchesStatus(recordStatus: string, targetStatus: string): boolean {
  if (!recordStatus || !targetStatus) return false;

  const normRecord = recordStatus.toLowerCase().trim();
  const normTarget = targetStatus.toLowerCase().trim();

  if (normRecord === normTarget) return true;

  const targetWords = normTarget.split(/\s+/);
  if (targetWords.length > 1) {
    return targetWords.every((w) => normRecord.includes(w));
  }

  return normRecord.includes(normTarget) || normTarget.includes(normRecord);
}

export function detectStatusFilter(question: string): string | null {
  const q = question.toLowerCase();
  const allKeywords: Array<{ status: string; keyword: string }> = [];
  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
    for (const kw of keywords) {
      allKeywords.push({ status, keyword: kw });
    }
  }
  allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const { status, keyword } of allKeywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');
    if (re.test(q)) return status;
  }
  return null;
}

export function isCountQuery(question: string): boolean {
  return STATUS_QUERY_PATTERNS.some((p) => p.test(question));
}

export function isListQuery(question: string): boolean {
  const q = question.toLowerCase();
  const listPatterns = [
    /show me which/i,
    /show me the/i,
    /list.*(which|the|all)/i,
    /which.*(are|is)/i,
    /display.*(which|the|all)/i,
    /tell me which/i,
    /what are the/i,
    /show.*(completed|draft|pending|open|approved|rejected|cancelled|sent|accepted|expired|converted|submitted|paid|partially paid|overdue|in process|in progress)/i,
    /filter.*sales order/i,
    /sales order.*filter/i,
    /sales order.*status/i,
    /filter.*item/i,
    /item.*filter/i,
    /item.*status/i,
    /item.*type/i,
    /raw item/i,
    /product item/i,
  ];
  return listPatterns.some((p) => p.test(q));
}

// ============================================================
// LATEST-LIST QUERY DETECTION
// ============================================================
export function isLatestListQuery(question: string): string | null {
  const q = question.toLowerCase();
  const patterns: Array<[string, RegExp]> = [
    ['latest',   /\blatest\b/],
    ['recent',   /\brecent\b/],
    ['newest',   /\bnewest\b/],
    ['last',     /\blast\b/],
    ['new',      /\bnew\s+(?!user|record\b)/],
  ];
  for (const [label, re] of patterns) {
    if (re.test(q)) {
      return label;
    }
  }
  return null;
}

// ============================================================
// STATUS-FILTERED NAVIGATION RESULT
// ============================================================
export interface StatusNavigationPayload {
  route: string;
  label: string;
  endpointKey: string;
  status: string;
  count: number;
}

export interface StatusQueryResult {
  ok: boolean;
  reply: string;
  navigation?: StatusNavigationPayload;
  error?: string;
}

export async function fetchAndFilterByStatus(
  endpointKey: string,
  status: string,
  forList: boolean
): Promise<StatusQueryResult> {
  const endpoint = ERP_ENDPOINTS[endpointKey];
  if (!endpoint) {
    return { ok: false, reply: '', error: `Unknown endpoint: ${endpointKey}` };
  }

  const token = getAuthToken();
  if (!token) {
    return {
      ok: false,
      reply: '',
      error: 'No auth token found. Please log in again.',
    };
  }

  console.log(`📡 Fetching all ${endpoint.label} for status filter: "${status}"`);

  const fetchUrl = endpoint.filterBase
    ? `${endpoint.filterBase}?page=1&limit=100`
    : endpoint.url;

  const result = await fetchAllPages(fetchUrl);
  if (!result.ok) {
    return {
      ok: false,
      reply: '',
      error: `Could not fetch ${endpoint.label}: ${result.error}`,
    };
  }

  const matching: any[] = [];
  const statusCounts: Record<string, number> = {};

  for (const record of result.records) {
    const rs = getRecordStatus(record);
    const displayStatus = rs || 'unknown';
    statusCounts[displayStatus] = (statusCounts[displayStatus] || 0) + 1;

    if (matchesStatus(rs, status)) {
      matching.push(record);
    }
  }

  console.log(
    `✅ Found ${matching.length} records with status "${status}" out of ${result.records.length}`
  );

  const baseRoute = ENDPOINT_ROUTES[endpointKey];
  const navRoute = baseRoute
    ? `${baseRoute}?status=${encodeURIComponent(status)}&autoFilter=1`
    : '';

  const lines: string[] = [];

  if (forList) {
    lines.push(
      `**${endpoint.label} with status "${status}"** — ${matching.length} record(s) found:\n`
    );

    if (matching.length === 0) {
      lines.push('No records match this status.');
    } else {
      const shown = matching.slice(0, 20);
      for (const rec of shown) {
        const name =
          rec.name ||
          rec.item_code ||
          rec.item_name ||
          rec.work_order_no ||
          rec.job_card_no ||
          rec.stock_entry_no ||
          rec.bom_no ||
          rec.sales_order_no ||
          rec.order_no ||
          rec.invoice_no ||
          rec.id ||
          '—';
        const st = getRecordStatus(rec) || '—';
        const extra =
          rec.item_code ||
          rec.product_name ||
          rec.item_name ||
          rec.customer_name ||
          rec.supplier_name ||
          rec.party_name ||
          '';
        lines.push(`- **${name}** | Status: ${st}${extra ? ` | ${extra}` : ''}`);
      }
      if (matching.length > 20) {
        lines.push(`\n... and ${matching.length - 20} more. Click below to view the full filtered list.`);
      }
    }

    lines.push('\n**Status breakdown for all records:**');
  } else {
    lines.push(
      `**${endpoint.label} with status "${status}"** — **${matching.length}** record(s) found out of ${result.records.length} total.\n`
    );
    lines.push('**Full status breakdown:**');
  }

  const sortedCounts = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  for (const [st, count] of sortedCounts) {
    const marker = matchesStatus(st, status) ? ' ✅' : '';
    lines.push(`- ${st}: **${count}**${marker}`);
  }

  return {
    ok: true,
    reply: lines.join('\n'),
    navigation: navRoute
      ? {
          route: navRoute,
          label: `View ${matching.length} ${endpoint.label} with status "${status}"`,
          endpointKey,
          status,
          count: matching.length,
        }
      : undefined,
  };
}

// ============================================================
// SALES ORDER FILTERED FETCH
// ============================================================
export async function fetchSalesOrdersFiltered(params: {
  status?: string;
  customer?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<FetchAllResult<any>> {
  const url = buildSalesOrderFilterUrl(params);
  console.log(`📡 Fetching filtered sales orders: ${url.replace(ERP_BASE_URL, '')}`);

  const result = await fetchAllPages(url);
  if (!result.ok) return result;

  if (params.status) {
    const targetStatus = params.status.toLowerCase().trim();
    const filtered = result.records.filter((r: any) => {
      const rs = getRecordStatus(r);
      return matchesStatus(rs, targetStatus);
    });

    if (filtered.length !== result.records.length) {
      console.log(
        `🔍 Client-side filtered sales orders: ${filtered.length}/${result.records.length} match "${params.status}"`
      );
      return {
        ...result,
        records: filtered,
        total: filtered.length,
      };
    }
  }

  return result;
}

// ============================================================
// ITEM FILTERED FETCH
// ============================================================
export async function fetchItemsFiltered(params: {
  status?: string;
  type?: string;
  group?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<FetchAllResult<any>> {
  const url = buildItemFilterUrl(params);
  console.log(`📡 Fetching filtered items: ${url.replace(ERP_BASE_URL, '')}`);

  const result = await fetchAllPages(url);
  if (!result.ok) return result;

  if (params.status) {
    const targetStatus = params.status.toLowerCase().trim();
    const filtered = result.records.filter((r: any) => {
      const rs = getRecordStatus(r);
      return matchesStatus(rs, targetStatus);
    });

    if (filtered.length !== result.records.length) {
      console.log(
        `🔍 Client-side filtered items: ${filtered.length}/${result.records.length} match "${params.status}"`
      );
      return {
        ...result,
        records: filtered,
        total: filtered.length,
      };
    }
  }

  if (params.type) {
    const targetType = params.type.toLowerCase().trim();
    const filtered = result.records.filter((r: any) => {
      const rt = String(r?.type ?? r?.item_type ?? '').toLowerCase().trim();
      return rt.includes(targetType) || targetType.includes(rt);
    });

    if (filtered.length !== result.records.length) {
      console.log(
        `🔍 Client-side filtered items by type: ${filtered.length}/${result.records.length} match "${params.type}"`
      );
      return {
        ...result,
        records: filtered,
        total: filtered.length,
      };
    }
  }

  if (params.group) {
    const targetGroup = params.group.toLowerCase().trim();
    const filtered = result.records.filter((r: any) => {
      const rg = String(
        r?.group ?? r?.item_group ?? r?.item_group_name ?? ''
      ).toLowerCase().trim();
      return rg.includes(targetGroup) || targetGroup.includes(rg);
    });

    if (filtered.length !== result.records.length) {
      console.log(
        `🔍 Client-side filtered items by group: ${filtered.length}/${result.records.length} match "${params.group}"`
      );
      return {
        ...result,
        records: filtered,
        total: filtered.length,
      };
    }
  }

  if (params.search) {
    const term = params.search.toLowerCase().trim();
    const filtered = result.records.filter((r: any) => {
      const candidates = [
        r?.name,
        r?.item_code,
        r?.item_name,
        r?.code,
        r?.description,
      ].filter(Boolean);
      return candidates.some((v: any) => String(v).toLowerCase().includes(term));
    });

    if (filtered.length !== result.records.length) {
      console.log(
        `🔍 Client-side filtered items by search: ${filtered.length}/${result.records.length} match "${params.search}"`
      );
      return {
        ...result,
        records: filtered,
        total: filtered.length,
      };
    }
  }

  return result;
}

// ============================================================
// LATEST-LIST NAVIGATION RESULT
// ============================================================
export interface LatestNavigationPayload {
  route: string;
  label: string;
  endpointKey: string;
  count: number;
  keyword: string;
}

export interface LatestListQueryResult {
  ok: boolean;
  reply: string;
  navigation?: LatestNavigationPayload;
  error?: string;
}

export async function fetchAndBuildLatestListNavigation(
  endpointKey: string,
  keyword: string
): Promise<LatestListQueryResult> {
  const endpoint = ERP_ENDPOINTS[endpointKey];
  if (!endpoint) {
    return { ok: false, reply: '', error: `Unknown endpoint: ${endpointKey}` };
  }

  const token = getAuthToken();
  if (!token) {
    return {
      ok: false,
      reply: '',
      error: 'No auth token found. Please log in again.',
    };
  }

  console.log(`📡 Fetching all ${endpoint.label} for latest-list query (keyword="${keyword}")`);

  const result = await fetchAllPages(endpoint.url);
  if (!result.ok) {
    return {
      ok: false,
      reply: '',
      error: `Could not fetch ${endpoint.label}: ${result.error}`,
    };
  }

  const DATE_FIELDS = [
    'creation', 'created_at', 'createdAt', 'created_on', 'creation_date',
    'date_created', 'created', 'inserted_at', 'created_date',
    'transaction_date', 'posting_date', 'order_date', 'date',
  ];
  const getDate = (r: any): number => {
    for (const f of DATE_FIELDS) {
      const v = r?.[f];
      if (!v) continue;
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return 0;
  };

  const sorted = [...result.records].sort((a, b) => getDate(b) - getDate(a));

  const total = result.total || sorted.length;
  const shown = sorted.slice(0, 10);

  const lines: string[] = [];
  lines.push(`**Latest ${endpoint.label}** (showing ${shown.length} of ${total}):\n`);

  if (shown.length === 0) {
    lines.push('_No records found._');
  } else {
    shown.forEach((rec: any, idx: number) => {
      const name =
        rec.name ||
        rec.item_code ||
        rec.item_name ||
        rec.work_order_no ||
        rec.job_card_no ||
        rec.stock_entry_no ||
        rec.bom_no ||
        rec.sales_order_no ||
        rec.order_no ||
        rec.invoice_no ||
        rec.id ||
        '—';
      const st = getRecordStatus(rec) || '—';
      const extra =
        rec.item_name ||
        rec.product_name ||
        rec.customer_name ||
        rec.supplier_name ||
        rec.party_name ||
        '';
      const d = getDate(rec);
      const dateStr = d
        ? ` · 📅 ${new Date(d).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}`
        : '';
      lines.push(
        `${idx + 1}. **${name}** · ${st}${extra ? ` · ${extra}` : ''}${dateStr}`
      );
    });
  }

  const baseRoute = ENDPOINT_ROUTES[endpointKey];
  const navRoute = baseRoute ? `${baseRoute}?sort=latest&autoFilter=1` : '';

  return {
    ok: true,
    reply: lines.join('\n'),
    navigation: navRoute
      ? {
          route: navRoute,
          label: `🔍 Open ${endpoint.label} (${total})`,
          endpointKey,
          count: total,
          keyword,
        }
      : undefined,
  };
}

// ============================================================
// AI INTEGRATION
// ============================================================

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
  navigation?: StatusNavigationPayload;
  navigationRoute?: string;
}

const SYSTEM_PROMPT =
  'You are a helpful assistant for Sculptor Tech ERP. ' +
  'You help users understand their Work Orders, Job Cards, Inventory, BOM, ' +
  'Quotations, Sales Orders, Purchase Orders, Items, and other ERP modules. ' +
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
        '⚠️ AI API key not set. Open src/services/erpApi.  ',
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

  const statusFilter = detectStatusFilter(question);
  const matchedEndpoint = matchEndpoint(question);

  if (statusFilter && matchedEndpoint) {
    const endpointKey = Object.keys(ERP_ENDPOINTS).find(
      (k) => ERP_ENDPOINTS[k] === matchedEndpoint
    );

    if (endpointKey) {
      const wantsList = isListQuery(question) || !isCountQuery(question);

      console.log(
        `🔢 Status query detected: ${endpointKey} → "${statusFilter}" (list=${wantsList})`
      );

      const statusResult = await fetchAndFilterByStatus(
        endpointKey,
        statusFilter,
        wantsList
      );

      if (statusResult.ok) {
        return {
          ok: true,
          reply: statusResult.reply,
          navigation: statusResult.navigation,
        };
      }

      console.warn(`⚠️ Status filter failed: ${statusResult.error}`);
    }
  }

  const latestKeyword = isLatestListQuery(question);
  if (latestKeyword && matchedEndpoint) {
    const endpointKey = Object.keys(ERP_ENDPOINTS).find(
      (k) => ERP_ENDPOINTS[k] === matchedEndpoint
    );

    if (endpointKey) {
      console.log(
        `🆕 Latest-list query detected: ${endpointKey} (keyword="${latestKeyword}")`
      );

      const latestResult = await fetchAndBuildLatestListNavigation(
        endpointKey,
        latestKeyword
      );

      if (latestResult.ok) {
        return {
          ok: true,
          reply: latestResult.reply,
          navigation: latestResult.navigation as any,
        };
      }

      console.warn(`⚠️ Latest-list fetch failed: ${latestResult.error}`);
    }
  }

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
  const aiResult = await askAi(question, [...history, contextMessage]);

  if (aiResult.ok && endpointKey === 'inventory' && detail.master) {
    aiResult.navigationRoute = buildInventoryDetailRoute(id, detail.master);
  }

  return aiResult;
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