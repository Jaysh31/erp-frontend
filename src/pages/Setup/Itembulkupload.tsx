import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  FaArrowLeft,
  FaUpload,
  FaFileExcel,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaPlay,
  FaExclamationTriangle,
  FaTrash,
  FaListUl,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../services/api";
import "./ItemBulkUpload.css";

// ────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────
interface Warehouse {
  id: number;
  warehouse_name: string;
}

interface Tax {
  tax_id: number;
  tax_type: string;
}

// One row exactly as read from the sheet — all strings/numbers, unvalidated.
interface RawRow {
  [key: string]: any;
  __rowNum: number; // 1-based row number in the sheet, for error messages
}

interface ParsedRow {
  rowNum: number;
  raw: RawRow;
  itemPayload: Record<string, any> | null;
  warehouseId: number | null;
  openingQty: number;
  openingRate: number;
  isStockItem: boolean;
  errors: string[];
  // Display-only values for the review table — never sent to the API.
  taxTypeDisplay: string | null;
  profitMarginDisplay: number;
}

interface RowResult {
  rowNum: number;
  itemCode: string;
  itemName: string;
  status: "success" | "failed" | "skipped";
  message: string;
}

// A single issue line shown inside the error popup — one per error message,
// so a row with 3 problems shows up as 3 rows in the modal.
interface ModalIssue {
  rowNum: number;
  itemCode: string;
  itemName: string;
  message: string;
}

// ────────────────────────────────────────────────────────────────────────
// Column mapping — header names are matched case-insensitively, and these
// aliases are accepted so client sheets don't have to match exactly.
// ────────────────────────────────────────────────────────────────────────
const HEADER_ALIASES: Record<string, string[]> = {
  item_code: ["item code", "code", "sku"],
  item_name: ["item name", "name", "item"],
  item_group: ["item group", "group", "category"],
  stock_uom: ["uom", "unit", "unit of measure", "default uom"],
  brand: ["brand"],
  description: ["description", "desc"],
  hsn: ["hsn", "hsn code"],
  standard_rate: ["standard rate", "purchase rate", "base price", "cost", "rate"],
  profit_margin: ["profit margin", "margin", "profit margin %", "margin %"],
  selling_price: ["selling price", "mrp", "sale price"],
  tax_type: ["tax type", "tax", "gst"],
  safety_stock: ["safety stock", "reorder level", "min stock"],
  opening_stock: ["opening stock", "opening qty", "qty"],
  opening_rate: ["opening rate", "opening stock rate"],
  warehouse: ["warehouse", "warehouse name"],
  is_sales_item: ["is sales item", "sales item", "sellable"],
  is_purchase_item: ["is purchase item", "purchase item", "purchasable"],
  is_stock_item: ["is stock item", "stock item", "track inventory"],
  disabled: ["disabled", "inactive"],
};

const TEMPLATE_COLUMNS = [
  "item_code",
  "item_name",
  "item_group",
  "stock_uom",
  "brand",
  "description",
  "hsn",
  "standard_rate",
  "profit_margin",
  "selling_price",
  "tax_type",
  "safety_stock",
  "opening_stock",
  "opening_rate",
  "warehouse",
  "is_sales_item",
  "is_purchase_item",
  "is_stock_item",
  "disabled",
];

// Friendly header labels for the review table (kept short so the wide
// table with 18 columns stays scannable).
const COLUMN_LABELS: Record<string, string> = {
  item_code: "Item Code",
  item_name: "Item Name",
  item_group: "Item Group",
  stock_uom: "UOM",
  brand: "Brand",
  description: "Description",
  hsn: "HSN",
  standard_rate: "Standard Rate",
  profit_margin: "Margin %",
  selling_price: "Selling Price",
  tax_type: "Tax Type",
  safety_stock: "Safety Stock",
  opening_stock: "Opening Qty",
  opening_rate: "Opening Rate",
  warehouse: "Warehouse",
  is_sales_item: "Sales Item",
  is_purchase_item: "Purchase Item",
  is_stock_item: "Stock Item",
  disabled: "Disabled",
};

const TEMPLATE_EXAMPLE_ROW = {
  item_code: "FEVICOL",
  item_name: "fevicol",
  item_group: "Raw Material",
  stock_uom: "liters",
  brand: "",
  description: "fevicol",
  hsn: "65656",
  standard_rate: 50,
  profit_margin: "",
  selling_price: 59,
  tax_type: "",
  safety_stock: 50,
  opening_stock: 0,
  opening_rate: 0,
  warehouse: "",
  is_sales_item: "N",
  is_purchase_item: "N",
  is_stock_item: "Y",
  disabled: "N",
};

const CONCURRENCY = 5;

// ────────────────────────────────────────────────────────────────────────
// Shared helpers (kept in sync with the logic in ItemForm.tsx)
// ────────────────────────────────────────────────────────────────────────
const isRawMaterialGroup = (groupName: string): boolean => {
  if (!groupName) return false;
  const rawMaterialGroups = [
    "raw material", "raw materials", "input material",
    "raw material store", "raw materials store",
    "component", "components", "parts",
    "sub assembly", "sub-assembly",
  ];
  const lower = groupName.toLowerCase().trim();
  return rawMaterialGroups.some((g) => lower.includes(g));
};

const getDefaultWarehouse = (itemGroup: string, warehouseList: Warehouse[]): Warehouse | null => {
  if (!itemGroup || warehouseList.length === 0) return null;
  const find = (pred: (w: Warehouse) => boolean) => warehouseList.find(pred) || null;

  if (isRawMaterialGroup(itemGroup)) {
    return (
      find((w) => w.warehouse_name.toLowerCase() === "raw material store") ||
      find((w) => w.warehouse_name.toLowerCase().includes("raw material"))
    );
  }
  return (
    find((w) => w.warehouse_name.toLowerCase() === "finished goods") ||
    find((w) => w.warehouse_name.toLowerCase() === "finished goods store") ||
    find((w) => w.warehouse_name.toLowerCase().includes("finished goods")) ||
    find((w) => w.warehouse_name.toLowerCase().includes("finished"))
  );
};

const calcPricing = (standardRate: number, profitMarginPct: number, taxPct: number, isRaw: boolean) => {
  const margin = isRaw ? 0 : profitMarginPct;
  const profitAmount = standardRate * (margin / 100);
  const priceBeforeTax = standardRate + profitAmount;
  const taxAmount = priceBeforeTax * (taxPct / 100);
  const finalPrice = priceBeforeTax + taxAmount;
  return {
    valuationRate: priceBeforeTax,
    sellingPrice: finalPrice,
    lastPurchaseRate: standardRate,
  };
};

const truthy = (v: any): boolean => {
  if (v === undefined || v === null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "y" || s === "yes" || s === "true";
};

const toNumber = (v: any, fallback = 0): number => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? fallback : n;
};

// Strips generic words ("store", "warehouse") and extra whitespace so
// "Finished Goods Store" and "Finished Goods" compare equal.
const normalizeWarehouseName = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/\b(store|warehouse|stores|godown)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Resolves a warehouse name typed in the sheet against the real warehouse
// list. Tries, in order: exact match, match ignoring generic suffix words
// (so "Finished Goods Store" matches "Finished Goods"), then a loose
// substring match either direction as a last resort.
const matchWarehouse = (raw: string, wh: Warehouse[]): Warehouse | null => {
  const target = raw.toLowerCase().trim();

  let match = wh.find((w) => w.warehouse_name.toLowerCase().trim() === target);
  if (match) return match;

  const normTarget = normalizeWarehouseName(raw);
  if (normTarget) {
    match = wh.find((w) => normalizeWarehouseName(w.warehouse_name) === normTarget);
    if (match) return match;
  }

  match = wh.find((w) => {
    const wLower = w.warehouse_name.toLowerCase().trim();
    return wLower.includes(target) || target.includes(wLower);
  });
  if (match) return match;

  return null;
};

// Normalizes a sheet's raw headers (whatever the client typed) onto our
// canonical field names using HEADER_ALIASES.
const normalizeHeaders = (headers: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  const lowerHeaders = headers.map((h) => String(h || "").trim().toLowerCase());

  Object.entries(HEADER_ALIASES).forEach(([canonical, aliases]) => {
    const allNames = [canonical.replace(/_/g, " "), canonical, ...aliases];
    const idx = lowerHeaders.findIndex((h) => allNames.includes(h));
    if (idx !== -1) map[canonical] = headers[idx];
  });

  return map;
};

// ────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────
export default function ItemBulkUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const [fileName, setFileName] = useState<string | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);

  const [uploading, setUploading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [failures, setFailures] = useState<RowResult[]>([]);
  const [done, setDone] = useState(false);

  // ── Error popup state ─────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalIssues, setModalIssues] = useState<ModalIssue[]>([]);

  const validCount = useMemo(() => rows.filter((r) => r.errors.length === 0).length, [rows]);
  const invalidCount = rows.length - validCount;

  // ── Load warehouses + taxes once, needed to resolve row values ───────
  const ensureLookups = async () => {
    if (warehouses.length > 0 && taxes.length > 0) return { warehouses, taxes };
    setLoadingLookups(true);
    try {
      const [whRes, taxRes] = await Promise.all([
        api.get("/warehouse"),
        api.get("/item/get-tax"),
      ]);
      const wh: Warehouse[] = whRes.data?.success === 1 ? (whRes.data.data.records || whRes.data.data || []) : [];
      const tx: Tax[] = taxRes.data?.success === 1 ? taxRes.data.data || [] : [];
      setWarehouses(wh);
      setTaxes(tx);
      return { warehouses: wh, taxes: tx };
    } catch (err) {
      console.error("Error loading warehouses/taxes:", err);
      toast.error("Could not load warehouses/taxes — check these before uploading");
      return { warehouses: [], taxes: [] };
    } finally {
      setLoadingLookups(false);
    }
  };

  // ── Template download ─────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([TEMPLATE_EXAMPLE_ROW], { header: TEMPLATE_COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Items");
    XLSX.writeFile(wb, "item_bulk_upload_template.xlsx");
  };

  // ── Build one item payload + resolve warehouse/tax for a row ─────────
  const buildRow = (raw: RawRow, hMap: Record<string, string>, wh: Warehouse[], tx: Tax[]): ParsedRow => {
    const get = (field: string) => (hMap[field] ? raw[hMap[field]] : undefined);
    const errors: string[] = [];

    const itemName = String(get("item_name") ?? "").trim();
    const itemCodeRaw = String(get("item_code") ?? "").trim();
    const itemGroup = String(get("item_group") ?? "").trim();
    const stockUom = String(get("stock_uom") ?? "").trim() || "Nos";

    if (!itemName) errors.push("Item name is missing");
    if (!itemGroup) errors.push("Item group is missing");

    const itemCode = itemCodeRaw || itemName.toUpperCase().replace(/\s+/g, "-");
    const isRaw = isRawMaterialGroup(itemGroup);

    // Resolve tax
    let taxId: number | null = null;
    const taxTypeRaw = String(get("tax_type") ?? "").trim();
    if (taxTypeRaw) {
      const match = tx.find((t) => t.tax_type.toLowerCase() === taxTypeRaw.toLowerCase());
      if (match) taxId = match.tax_id;
      else errors.push(`Tax type "${taxTypeRaw}" not found`);
    } else {
      taxId = tx[0]?.tax_id ?? 1;
    }
    const taxPct = taxId ? parseFloat((tx.find((t) => t.tax_id === taxId)?.tax_type || "").replace(/[^0-9.]/g, "")) || 0 : 0;

    // Pricing
    const standardRate = toNumber(get("standard_rate"), 0);
    const explicitSelling = get("selling_price");
    const profitMargin = toNumber(get("profit_margin"), 0);
    const pricing = calcPricing(standardRate, profitMargin, taxPct, isRaw);
    const sellingPrice = explicitSelling !== undefined && explicitSelling !== "" ? toNumber(explicitSelling) : pricing.sellingPrice;

    // Stock item / warehouse
    const isStockItem = get("is_stock_item") === undefined ? true : truthy(get("is_stock_item"));
    let warehouseId: number | null = null;
    const warehouseNameRaw = String(get("warehouse") ?? "").trim();
    if (isStockItem) {
      if (warehouseNameRaw) {
        const match = matchWarehouse(warehouseNameRaw, wh);
        if (match) warehouseId = match.id;
        else errors.push(`Warehouse "${warehouseNameRaw}" not found`);
      } else {
        const auto = getDefaultWarehouse(itemGroup, wh);
        if (auto) warehouseId = auto.id;
        else errors.push("No warehouse specified and none could be auto-detected for this item group");
      }
    }

    const openingQty = toNumber(get("opening_stock"), 0);
    const openingRate = toNumber(get("opening_rate"), 0);

    const itemPayload = {
      naming_series: "STO-ITEM-.YYYY.-",
      item_code: itemCode,
      item_name: itemName,
      item_group: itemGroup,
      stock_uom: stockUom,
      image: null,
      disabled: truthy(get("disabled")) ? 1 : 0,
      tax_id: taxId,
      is_stock_item: isStockItem ? 1 : 0,
      is_fixed_asset: 0,
      auto_create_assets: 0,
      is_grouped_asset: 0,
      asset_category: null,
      asset_naming_series: null,
      is_sales_item: truthy(get("is_sales_item")) ? 1 : 0,
      allow_alternative_item: 0,
      has_variants: 0,
      is_purchase_item: truthy(get("is_purchase_item")) ? 1 : 0,
      is_customer_provided_item: 0,
      standard_rate: standardRate,
      selling_price: sellingPrice,
      opening_stock: openingQty,
      over_delivery_receipt_allowance: 0,
      over_billing_allowance: 0,
      brand: String(get("brand") ?? "").trim() || null,
      description: String(get("description") ?? "").trim() || itemName,
      no_of_months: 0,
      purchase_tax_withholding_category: null,
      sales_tax_withholding_category: null,
      valuation_method: "FIFO",
      valuation_rate: pricing.valuationRate,
      end_of_life: "2099-12-31",
      default_material_request_type: "Purchase",
      warranty_period: null,
      weight_per_unit: 0,
      weight_uom: null,
      allow_negative_stock: 0,
      has_batch_no: 0,
      create_new_batch: 0,
      batch_number_series: null,
      has_expiry_date: 0,
      shelf_life_in_days: 0,
      retain_sample: 0,
      sample_quantity: 0,
      has_serial_no: 0,
      serial_no_series: null,
      variant_of: null,
      variant_based_on: "Item Attribute",
      purchase_uom: null,
      min_order_qty: 0,
      safety_stock: toNumber(get("safety_stock"), 0),
      lead_time_days: 0,
      last_purchase_rate: pricing.lastPurchaseRate,
      delivered_by_supplier: 0,
      country_of_origin: "India",
      customs_tariff_number: null,
      sales_uom: null,
      grant_commission: 1,
      max_discount: 0,
      include_item_in_manufacturing: 1,
      is_sub_contracted_item: 0,
      default_bom: null,
      production_capacity: 0,
      total_projected_qty: 0,
      default_manufacturer_part_no: null,
      default_item_manufacturer: null,
      customer_code: null,
      inspection_required_before_purchase: 0,
      inspection_required_before_delivery: 0,
      quality_inspection_template: null,
      HSN: String(get("hsn") ?? "").trim() || null,
    };

    return {
      rowNum: raw.__rowNum,
      raw,
      itemPayload: errors.length === 0 ? itemPayload : null,
      warehouseId,
      openingQty,
      openingRate,
      isStockItem,
      errors,
      taxTypeDisplay: taxTypeRaw || null,
      profitMarginDisplay: profitMargin,
    };
  };

  // ── File selection → parse ────────────────────────────────────────────
  const handleFile = async (file: File) => {
    setParsing(true);
    setDone(false);
    setFailures([]);
    setProcessedCount(0);
    setSuccessCount(0);
    setFailedCount(0);
    setFileName(file.name);

    try {
      const { warehouses: wh, taxes: tx } = await ensureLookups();

      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length === 0) {
        toast.error("No rows found in the sheet");
        setRows([]);
        return;
      }
      if (json.length > 2000) {
        toast.error("This sheet has more than 2000 rows — split it into smaller batches");
      }

      const headers = Object.keys(json[0]);
      const hMap = normalizeHeaders(headers);
      setHeaderMap(hMap);

      if (!hMap.item_name) {
        toast.error('No "item_name" column found — check your headers against the template');
        setRows([]);
        return;
      }

      const parsed = json.map((r, i) =>
        buildRow({ ...r, __rowNum: i + 2 }, hMap, wh, tx) // +2: header row + 1-based
      );
      setRows(parsed);

      const invalid = parsed.filter((r) => r.errors.length > 0).length;
      toast.success(`Parsed ${parsed.length} rows — ${parsed.length - invalid} ready, ${invalid} need fixes`);
    } catch (err) {
      console.error("Error parsing file:", err);
      toast.error("Could not read this file — make sure it's a valid .xlsx or .csv");
      setRows([]);
    } finally {
      setParsing(false);
    }
  };

  // ── Read a column's value for the review table: prefer the resolved/
  // computed value (so you see exactly what will be sent), fall back to
  // the raw sheet cell so invalid rows still show what was typed. ───────
  const getCellValue = (r: ParsedRow, col: string): string => {
    const rawFallback = () => {
      const key = headerMap[col];
      const v = key ? r.raw[key] : r.raw[col];
      return v !== undefined && v !== null && v !== "" ? String(v) : "—";
    };

    switch (col) {
      case "warehouse":
        return warehouses.find((w) => w.id === r.warehouseId)?.warehouse_name || (r.isStockItem ? rawFallback() : "n/a");
      case "opening_stock":
        return String(r.openingQty);
      case "opening_rate":
        return String(r.openingRate);
      case "is_stock_item":
        return r.isStockItem ? "Y" : "N";
      case "is_sales_item":
        return r.itemPayload ? (r.itemPayload.is_sales_item ? "Y" : "N") : rawFallback();
      case "is_purchase_item":
        return r.itemPayload ? (r.itemPayload.is_purchase_item ? "Y" : "N") : rawFallback();
      case "disabled":
        return r.itemPayload ? (r.itemPayload.disabled ? "Y" : "N") : rawFallback();
      case "hsn":
        return r.itemPayload?.HSN || rawFallback();
      case "tax_type":
        return r.taxTypeDisplay || rawFallback();
      case "profit_margin":
        return r.itemPayload ? String(r.profitMarginDisplay ?? 0) : rawFallback();
      default: {
        const val = (r.itemPayload as any)?.[col];
        if (val !== undefined && val !== null && val !== "") return String(val);
        return rawFallback();
      }
    }
  };

  // ── Error popup helpers ───────────────────────────────────────────────
  const openModal = (title: string, issues: ModalIssue[]) => {
    setModalTitle(title);
    setModalIssues(issues);
    setModalOpen(true);
  };

  const rowIssues = (r: ParsedRow): ModalIssue[] =>
    r.errors.map((message) => ({
      rowNum: r.rowNum,
      itemCode: r.raw[headerMap.item_code] ? String(r.raw[headerMap.item_code]) : "",
      itemName: r.raw[headerMap.item_name] ? String(r.raw[headerMap.item_name]) : "",
      message,
    }));

  const openRowErrors = (r: ParsedRow) => {
    openModal(`Row ${r.rowNum} — issues`, rowIssues(r));
  };

  const openAllValidationErrors = () => {
    const issues = rows.filter((r) => r.errors.length > 0).flatMap(rowIssues);
    openModal(`All issues (${invalidCount} row${invalidCount === 1 ? "" : "s"})`, issues);
  };

  const openUploadFailures = () => {
    openModal(
      `Upload failures (${failures.length})`,
      failures.map((f) => ({ rowNum: f.rowNum, itemCode: f.itemCode, itemName: f.itemName, message: f.message }))
    );
  };

  // ── Upload one row: POST /item then POST /inventory ──────────────────
  const uploadRow = async (row: ParsedRow): Promise<RowResult> => {
    const label = row.itemPayload?.item_name || `Row ${row.rowNum}`;
    const code = row.itemPayload?.item_code || "";

    try {
      const itemRes = await api.post("/item", row.itemPayload);
      if (!(itemRes.data && itemRes.data.success === 1)) {
        return { rowNum: row.rowNum, itemCode: code, itemName: label, status: "failed", message: itemRes.data?.message || "Item creation failed" };
      }

      const newItemId = itemRes.data.data?.insertId ?? itemRes.data.data?.id;
      if (!newItemId) {
        return { rowNum: row.rowNum, itemCode: code, itemName: label, status: "failed", message: "Item created but no ID returned — inventory not set" };
      }

      if (row.isStockItem && row.warehouseId) {
        const openingValue = row.openingQty * row.openingRate;
        const inventoryPayload = {
          name: `INV-${code}`,
          item_Id: newItemId,
          item_code: code,
          warehouse_Id: row.warehouseId,
          actual_qty: row.openingQty,
          planned_qty: 0,
          indented_qty: 0,
          ordered_qty: 0,
          reserved_qty: 0,
          reserved_qty_for_production: 0,
          reserved_qty_for_sub_contract: 0,
          reserved_qty_for_production_plan: 0,
          projected_qty: row.openingQty,
          reserved_stock: row.itemPayload?.safety_stock || 0,
          stock_uom: row.itemPayload?.stock_uom,
          company: "SculptorTech Pvt Ltd",
          valuation_rate: row.openingRate,
          stock_value: openingValue,
        };

        const invRes = await api.post("/inventory", inventoryPayload);
        if (!(invRes.data && invRes.data.success === 1)) {
          return { rowNum: row.rowNum, itemCode: code, itemName: label, status: "failed", message: `Item created (id ${newItemId}) but inventory failed: ${invRes.data?.message || "unknown error"}` };
        }
      }

      return { rowNum: row.rowNum, itemCode: code, itemName: label, status: "success", message: "Created" };
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      if (err.response?.status === 409) {
        return { rowNum: row.rowNum, itemCode: code, itemName: label, status: "failed", message: `Item code "${code}" already exists` };
      }
      return { rowNum: row.rowNum, itemCode: code, itemName: label, status: "failed", message: serverMsg || err.message || "Network error" };
    }
  };

  // ── Run the whole batch with limited concurrency ──────────────────────
  const handleStartUpload = async () => {
    const toProcess = rows.filter((r) => r.errors.length === 0);
    if (toProcess.length === 0) {
      toast.error("No valid rows to upload");
      return;
    }

    setUploading(true);
    setDone(false);
    cancelRef.current = false;

    const results: RowResult[] = [];
    let idx = 0;

    const worker = async () => {
      while (idx < toProcess.length && !cancelRef.current) {
        const current = toProcess[idx];
        idx += 1;
        const result = await uploadRow(current);
        results.push(result);
        setProcessedCount((c) => c + 1);
        if (result.status === "success") setSuccessCount((c) => c + 1);
        else setFailedCount((c) => c + 1);
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const failedResults = results.filter((r) => r.status === "failed");
    setFailures(failedResults);
    setUploading(false);
    setDone(true);

    const successTotal = results.filter((r) => r.status === "success").length;
    const failedTotal = failedResults.length;
    if (failedTotal === 0) {
      toast.success(`All ${successTotal} items uploaded successfully`);
    } else {
      toast.error(`${successTotal} uploaded, ${failedTotal} failed — see report below`);
      // Surface failures immediately in the popup so they're not missed.
      openModal(
        `Upload failures (${failedResults.length})`,
        failedResults.map((f) => ({ rowNum: f.rowNum, itemCode: f.itemCode, itemName: f.itemName, message: f.message }))
      );
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    toast("Stopping after current requests finish…");
  };

  const handleDownloadFailures = () => {
    if (failures.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      failures.map((f) => ({
        row: f.rowNum,
        item_code: f.itemCode,
        item_name: f.itemName,
        reason: f.message,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Failed rows");
    XLSX.writeFile(wb, "item_bulk_upload_failures.xlsx");
  };

  const handleReset = () => {
    setFileName(null);
    setRows([]);
    setHeaderMap({});
    setFailures([]);
    setProcessedCount(0);
    setSuccessCount(0);
    setFailedCount(0);
    setDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const progressPct = rows.length > 0 ? Math.round((processedCount / validCount) * 100) : 0;

  return (
    <div className="ibu-page">
      <div className="ibu-topbar">
        <div className="ibu-breadcrumb">
          <button onClick={() => navigate("/item-list")} className="ibu-back-btn">
            <FaArrowLeft size={11} /> Back
          </button>
          <span className="ibu-bc-sep">/</span>
          <span className="ibu-bc-current">Bulk import items</span>
        </div>
      </div>

      <div className="ibu-body">
        {/* Step 1: template + upload */}
        <div className="ibu-card">
          <div className="ibu-card-head">
            <h3>1. Upload your sheet</h3>
            <p>Use the template so column headers line up. Existing item codes will be rejected as duplicates.</p>
          </div>

          <div className="ibu-actions-row">
            <button type="button" className="ibu-btn-secondary" onClick={handleDownloadTemplate}>
              <FaDownload size={12} /> Download template
            </button>
          </div>

          <div
            className="ibu-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            {parsing || loadingLookups ? (
              <>
                <FaSpinner className="ibu-spin" size={24} />
                <p>{loadingLookups ? "Loading warehouses & tax types…" : "Reading sheet…"}</p>
              </>
            ) : fileName ? (
              <>
                <FaFileExcel size={24} />
                <p className="ibu-dropzone-bold">{fileName}</p>
                <p className="ibu-dropzone-hint">{rows.length} rows parsed — click to replace</p>
              </>
            ) : (
              <>
                <FaUpload size={24} />
                <p className="ibu-dropzone-bold">Click to upload or drag and drop</p>
                <p className="ibu-dropzone-hint">.xlsx, .xls, or .csv</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="ibu-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Step 2: preview + validation */}
        {rows.length > 0 && (
          <div className="ibu-card">
            <div className="ibu-card-head">
              <h3>2. Review</h3>
              <p>
                <span className="ibu-stat-ok">{validCount} ready</span>
                {invalidCount > 0 && <span className="ibu-stat-bad"> · {invalidCount} need fixes</span>}
                {" "}of {rows.length} rows. All rows and columns are shown below.
              </p>
            </div>

            {invalidCount > 0 && (
              <div className="ibu-actions-row">
                <button type="button" className="ibu-btn-secondary" onClick={openAllValidationErrors}>
                  <FaListUl size={12} /> View all issues ({invalidCount})
                </button>
              </div>
            )}

            <div className="ibu-table-wrapper">
              <table className="ibu-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    {TEMPLATE_COLUMNS.map((col) => (
                      <th key={col}>{COLUMN_LABELS[col] || col}</th>
                    ))}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rowNum} className={r.errors.length > 0 ? "ibu-row-invalid" : ""}>
                      <td>{r.rowNum}</td>
                      {TEMPLATE_COLUMNS.map((col) => (
                        <td key={col}>{getCellValue(r, col)}</td>
                      ))}
                      <td>
                        {r.errors.length === 0 ? (
                          <span className="ibu-badge ibu-badge-ok"><FaCheckCircle size={10} /> Ready</span>
                        ) : (
                          <button
                            type="button"
                            className="ibu-badge ibu-badge-bad ibu-badge-btn"
                            onClick={() => openRowErrors(r)}
                            title="Click to view all issues for this row"
                          >
                            <FaExclamationTriangle size={10} /> {r.errors.length} issue{r.errors.length === 1 ? "" : "s"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: upload */}
        {rows.length > 0 && (
          <div className="ibu-card">
            <div className="ibu-card-head">
              <h3>3. Upload</h3>
              <p>Runs {CONCURRENCY} requests at a time. Rows with errors above are skipped automatically.</p>
            </div>

            {(uploading || done) && (
              <div className="ibu-progress-block">
                <div className="ibu-progress-bar-track">
                  <div className="ibu-progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="ibu-progress-stats">
                  <span>{processedCount} / {validCount} processed</span>
                  <span className="ibu-stat-ok">{successCount} succeeded</span>
                  {failedCount > 0 && <span className="ibu-stat-bad">{failedCount} failed</span>}
                </div>
              </div>
            )}

            <div className="ibu-actions-row">
              {!uploading ? (
                <button type="button" className="ibu-btn-primary" onClick={handleStartUpload} disabled={validCount === 0}>
                  <FaPlay size={12} /> Upload {validCount} item{validCount === 1 ? "" : "s"}
                </button>
              ) : (
                <button type="button" className="ibu-btn-secondary" onClick={handleCancel}>
                  <FaTimesCircle size={12} /> Stop after current batch
                </button>
              )}
              <button type="button" className="ibu-btn-ghost" onClick={handleReset} disabled={uploading}>
                <FaTrash size={12} /> Start over
              </button>
            </div>

            {done && failures.length > 0 && (
              <div className="ibu-failures-block">
                <div className="ibu-card-head">
                  <h4>{failures.length} row{failures.length === 1 ? "" : "s"} failed to upload</h4>
                </div>
                <div className="ibu-actions-row">
                  <button type="button" className="ibu-btn-secondary" onClick={openUploadFailures}>
                    <FaListUl size={12} /> View failures
                  </button>
                  <button type="button" className="ibu-btn-secondary" onClick={handleDownloadFailures}>
                    <FaDownload size={12} /> Download failures as sheet
                  </button>
                </div>
              </div>
            )}

            {done && failures.length === 0 && (
              <div className="ibu-success-banner">
                <FaCheckCircle size={14} /> All items uploaded. <button type="button" className="ibu-link-btn" onClick={() => navigate("/item-list")}>Go to item list</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error / issues popup — used for validation issues, a single row's
          issues, and post-upload failures. */}
      {modalOpen && (
        <div className="ibu-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="ibu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ibu-modal-head">
              <h4>{modalTitle}</h4>
              <button type="button" className="ibu-modal-close" onClick={() => setModalOpen(false)} aria-label="Close">
                <FaTimesCircle size={16} />
              </button>
            </div>
            <div className="ibu-modal-body">
              {modalIssues.length === 0 ? (
                <p>No issues to show.</p>
              ) : (
                <table className="ibu-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Item code</th>
                      <th>Item name</th>
                      <th>Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalIssues.map((it, i) => (
                      <tr key={`${it.rowNum}-${i}`}>
                        <td>{it.rowNum}</td>
                        <td>{it.itemCode || "—"}</td>
                        <td>{it.itemName || "—"}</td>
                        <td>{it.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}