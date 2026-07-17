import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaSpinner, FaPlus,
  FaTrash, FaFileAlt,
  FaBarcode, FaTag,
  FaTimes, FaExclamationTriangle, FaInfoCircle,
  FaUser, FaCreditCard, FaCalendarAlt,
  FaFileImport, FaCheckCircle, FaExclamationCircle, FaQuestionCircle
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import './CreateSalesOrder.css';
import toast from 'react-hot-toast';
import api from '../../src/services/api';

/* ─────────────────────────── Types ─────────────────────────── */

type StockStatus = 'checking' | 'available' | 'insufficient' | 'unknown' | undefined;

interface SalesOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  stockUom: string;
  cgst: number; // percentage
  sgst: number; // percentage
  amount: number;
  stockStatus?: StockStatus;
  availableQty?: number;
}

interface PaymentScheduleRow {
  id: string;
  paymentTerm: string;
  dueDate: string;
  durationDays: number;
  invoicePortion: number;
  paymentAmount: number;
}

interface SalesOrderForm {
  namingSeries: string;
  orderType: string;        
  isSubcontracted: boolean;
  company: string;
  warehouse: string;
  date: string;
  deliveryDate: string;     
  customer: string;
  customerName: string;
  status: string;
  items: SalesOrderItem[];
  totalQuantity: number;
  baseTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  grandTotal: number;
  roundedTotal: number;
  paymentTermsTemplate: string;
  paymentSchedule: PaymentScheduleRow[];
  tcName: string;
  termDetails: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface SalesOrderApiRecord {
  name: string;
  naming_series?: string;
  order_type?: string;
  is_subcontracted?: number | boolean;
  company?: string;
  set_warehouse?: string;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  delivery_date?: string;
  status?: string;
  payment_terms_template?: string;
  tc_name?: string;
  terms?: string;
  grand_total?: number;
  total?: number;
  items?: Array<{
    item_code?: string;
    item_name?: string;
    qty?: number;
    rate?: number;
    stock_uom?: string;
    warehouse?: string;
    cgst_rate?: number;
    sgst_rate?: number;
    amount?: number;
  }>;
  payment_schedule?: any[];
}

interface QuotationApiRecord {
  name: string;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  valid_till?: string;
  company?: string | null;
  currency?: string;
  total_qty?: number;
  total?: number;
  net_total?: number;
  grand_total?: number;
  rounded_total?: number;
  payment_terms_template?: string | null;
  tc_name?: string | null;
  terms?: string | null;
  payment_schedule?: any[];
  items?: Array<{
    item_code?: string;
    item_name?: string;
    qty?: number;
    rate?: number;
    stock_uom?: string;
    warehouse?: string;
    cgst_rate?: number;
    sgst_rate?: number;
    amount?: number;
  }>;
}

interface InventoryApiRecord {
  name: string;
  item_code: string;
  warehouse_Id?: number;
  actual_qty: number;
  reserved_stock?: number;
  projected_qty?: number;
  stock_uom?: string;
  company?: string;
}

const withOption = (options: string[], value?: string | null): string[] => {
  if (!value) return options;
  return options.includes(value) ? options : [value, ...options];
};

const unwrapDate = (value?: string | null): string => {
  if (!value) return '';
  return value.split('T')[0];
};

const daysBetween = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
};

const addDays = (date: string, days: number): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const SALES_ORDER_LINE_CACHE_PREFIX = 'sales_order_line_data:';

interface CachedSalesOrderLineData {
  items?: SalesOrderItem[];
  paymentSchedule?: PaymentScheduleRow[];
}

const cacheSalesOrderLineData = (name: string, data: CachedSalesOrderLineData) => {
  try {
    localStorage.setItem(SALES_ORDER_LINE_CACHE_PREFIX + name, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const readCachedSalesOrderLineData = (name: string): CachedSalesOrderLineData | null => {
  try {
    const raw = localStorage.getItem(SALES_ORDER_LINE_CACHE_PREFIX + name);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const extractRecords = (payload: any): any[] => {
  if (!payload) return [];
  const data = payload.success === 1 || payload.success === 0 ? payload.data : payload;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data)) return data;
  return [];
};

// const extractRecord = (payload: any): any | null => {
//   if (!payload) return null;
//   const data = payload.success === 1 || payload.success === 0 ? payload.data : payload;
//   if (data?.record) return data.record;
//   if (data?.name) return data;
//   return data ?? null;
// };

const getItemGrossAmount = (item: SalesOrderItem): number => {
  const gstPercent = (item.cgst || 0) + (item.sgst || 0);
  return item.amount + (item.amount * gstPercent) / 100;
};


const generateSalesOrderName = (): string => {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `SAL-ORD-${year}-${suffix}`;
};

/* ─────────────────────────── Component ─────────────────────────── */

export default function CreateSalesOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = !!id && id !== 'new';

  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanBarcode, setScanBarcode] = useState('');
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  
  const [showStockWarningModal, setShowStockWarningModal] = useState(false);
  const [stockWarningItems, setStockWarningItems] = useState<SalesOrderItem[]>([]);

  const [recordName, setRecordName] = useState<string | null>(null);

  // ─── Customer lookup ────────────────────────────────────────────
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // ─── Item lookup ────────────────────────────────────────────────
  const [itemSuggestions, setItemSuggestions] = useState<{ [index: number]: any[] }>({});
  const [itemSuggestLoading, setItemSuggestLoading] = useState<{ [index: number]: boolean }>({});
  const [openItemDropdown, setOpenItemDropdown] = useState<number | null>(null);
  const itemSearchTimers = useRef<{ [index: number]: ReturnType<typeof setTimeout> }>({});

  // ─── Quotation lookup / autofill ──────────────────────────────
  const [quotations, setQuotations] = useState<QuotationApiRecord[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [selectedQuotationName, setSelectedQuotationName] = useState('');
  const [applyingQuotation, setApplyingQuotation] = useState(false);

  // ─── Inventory / stock check ───────────────────────────────────
  const [inventoryMap, setInventoryMap] = useState<{ [itemCode: string]: InventoryApiRecord }>({});
  const [loadingInventory, setLoadingInventory] = useState(false);

  // ─── Item master catalog (for enriching quotation item lines) ──
  const [itemMasterMap, setItemMasterMap] = useState<{ [itemCode: string]: any }>({});
  const [loadingItemMaster, setLoadingItemMaster] = useState(false);

  const statusOptions = ['Draft', 'Confirmed', 'On Hold', 'Completed', 'Cancelled', 'Closed'];
  // const orderTypeOptions = ['Sales', 'Return', 'Credit Note'];

  const defaultFormData = (): SalesOrderForm => ({
    namingSeries: 'SAL-ORD-.YYYY.-',
    orderType: 'Sales',
    isSubcontracted: false,
    company: 'SculptorTech Pvt Ltd',
    warehouse: 'Finished Goods',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer: '',
    customerName: '',
    status: 'Draft',
    items: [
      { id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, stockUom: 'Nos', cgst: 0, sgst: 0, amount: 0 }
    ],
    totalQuantity: 0,
    baseTotal: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    grandTotal: 0,
    roundedTotal: 0,
    paymentTermsTemplate: '',
    paymentSchedule: [
      { id: '1', paymentTerm: '', dueDate: '', durationDays: 30, invoicePortion: 100, paymentAmount: 0 }
    ],
    tcName: '',
    termDetails: ''
  });

  const [formData, setFormData] = useState<SalesOrderForm>(defaultFormData());

  const inputRefs = React.useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null }>({});
  const itemInputRefs = React.useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

  const setRef = (key: string) => (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
    inputRefs.current[key] = el;
  };

  const setItemRef = (key: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
    itemInputRefs.current[key] = el;
    inputRefs.current[key] = el;
  };

  const openDatePicker = (key: string) => {
    const el = inputRefs.current[key] as HTMLInputElement | null;
    if (!el) return;
    if (typeof (el as any).showPicker === 'function') {
      try {
        (el as any).showPicker();
        return;
      } catch {
      }
    }
    el.focus();
  };

  /* ─── load customers ─────────────────────────────────────────── */

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await api.get('/customer');
      const records = extractRecords(response.data);
      setCustomers(records);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const customerIdOf = (c: any) => c?.name ?? c?.id ?? c?.customer_code ?? '';
  const customerLabelOf = (c: any) => {
    const id = customerIdOf(c);
    const label = c?.customer_name || c?.party_name || id;
    return label && label !== id ? `${label} (${id})` : `${id}`;
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const match = customers.find((c) => String(customerIdOf(c)) === value);
    setSelectedCustomer(match || null);
    setFormData((prev) => ({
      ...prev,
      customer: value,
      customerName: match?.customer_name || match?.party_name || value,
    }));
    if (errors.customer) setErrors((prev) => ({ ...prev, customer: '' }));
  };

  const customerDetailFields: { label: string; key: string }[] = [
    { label: 'Customer Name', key: 'customer_name' },
    { label: 'Customer Group', key: 'customer_group' },
    { label: 'Territory', key: 'territory' },
    { label: 'Mobile No', key: 'mobile_no' },
    { label: 'Phone', key: 'phone' },
    { label: 'Email', key: 'email_id' },
    { label: 'GSTIN', key: 'gstin' },
    { label: 'PAN', key: 'pan' },
    { label: 'Address', key: 'primary_address' },
    { label: 'Credit Limit', key: 'credit_limit' },
  ];

  /* ─── load quotations (for autofill) ───────────────────────────── */

  const fetchQuotations = async () => {
    setLoadingQuotations(true);
    try {
      const response = await api.get('/quotation');
      const records = extractRecords(response.data);
      setQuotations(records);
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setLoadingQuotations(false);
    }
  };

  useEffect(() => {
    if (!isEditMode) {
      fetchQuotations();
    }
  }, []);

  const quotationLabelOf = (q: QuotationApiRecord) => {
    const amount = q.grand_total ?? q.total ?? 0;
    const customer = q.customer_name || q.party_name || '';
    return `${q.name} — ${customer} (INR ${amount})`;
  };

  /* ─── load inventory (for stock check) ─────────────────────────── */

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await api.get('/inventory');
      const records: InventoryApiRecord[] = extractRecords(response.data);
      const map: { [itemCode: string]: InventoryApiRecord } = {};
      records.forEach((r) => {
        if (r.item_code) {
          const key = r.item_code.toUpperCase();
          // If the same item exists in multiple warehouses, keep the one with the highest actual_qty.
          if (!map[key] || (r.actual_qty ?? 0) > (map[key].actual_qty ?? 0)) {
            map[key] = r;
          }
        }
      });
      setInventoryMap(map);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

 
  const fetchItemMaster = async () => {
    setLoadingItemMaster(true);
    try {
      const map: { [itemCode: string]: any } = {};
      const limit = 100;
      let page = 1;
      while (page <= 20) {
        const response = await api.get(`/item?page=${page}&limit=${limit}&_=${Date.now()}`);
        const records = extractRecords(response.data);
        records.forEach((r: any) => {
          if (r.item_code) map[String(r.item_code).toUpperCase()] = r;
        });
        const total = response.data?.data?.total ?? records.length;
        if (records.length === 0 || page * limit >= total) break;
        page += 1;
      }
      setItemMasterMap(map);
    } catch (err) {
      console.error('Error fetching item master catalog:', err);
    } finally {
      setLoadingItemMaster(false);
    }
  };

  useEffect(() => {
    fetchItemMaster();
  }, []);

  const getStockStatus = (itemCode: string, quantity: number): { status: StockStatus; availableQty?: number } => {
    if (!itemCode) return { status: undefined };
    const inv = inventoryMap[itemCode.toUpperCase()];
    if (!inv) return { status: 'unknown' };
    return {
      status: (inv.actual_qty ?? 0) >= quantity ? 'available' : 'insufficient',
      availableQty: inv.actual_qty,
    };
  };

  
  useEffect(() => {
    if (Object.keys(inventoryMap).length === 0) return;
    setFormData((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (!item.itemCode) return item;
        const { status, availableQty } = getStockStatus(item.itemCode, item.quantity);
        return { ...item, stockStatus: status, availableQty };
      });
      return { ...prev, items: updatedItems };
    });
  }, [inventoryMap]);

  const StockBadge = ({ item }: { item: SalesOrderItem }) => {
    if (!item.itemCode) return null;
    if (loadingInventory) {
      return (
        <span className="cq-stock-badge cq-stock-checking">
          <FaSpinner className="spinning" size={9} /> Checking
        </span>
      );
    }
    if (item.stockStatus === 'available') {
      return (
        <span className="cq-stock-badge cq-stock-available" title={`${item.availableQty} in stock`}>
          <FaCheckCircle size={9} /> In Stock ({item.availableQty})
        </span>
      );
    }
    if (item.stockStatus === 'insufficient') {
      return (
        <span className="cq-stock-badge cq-stock-insufficient" title={`Only ${item.availableQty} available`}>
          <FaExclamationCircle size={9} /> Only {item.availableQty ?? 0} left
        </span>
      );
    }
    return (
      <span className="cq-stock-badge cq-stock-unknown">
        <FaQuestionCircle size={9} /> Unknown
      </span>
    );
  };

  /* ─── load items (search) ────────────────────────────────────── */

  const fetchItemOptions = async (index: number, query: string) => {
    setItemSuggestLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const url = query
        ? `/item?page=1&limit=10&search=${encodeURIComponent(query)}`
        : `/item?page=1&limit=10`;
      const response = await api.get(url);
      const records = extractRecords(response.data);
      setItemSuggestions((prev) => ({ ...prev, [index]: records }));
    } catch (err) {
      console.error('Error fetching items:', err);
      setItemSuggestions((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setItemSuggestLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const scheduleItemSearch = (index: number, query: string) => {
    if (itemSearchTimers.current[index]) {
      clearTimeout(itemSearchTimers.current[index]);
    }
    itemSearchTimers.current[index] = setTimeout(() => {
      fetchItemOptions(index, query);
    }, 300);
  };

  const handleItemCodeFocus = (index: number) => {
    setOpenItemDropdown(index);
    if (!itemSuggestions[index]) {
      fetchItemOptions(index, formData.items[index].itemCode);
    }
  };

  const handleItemCodeBlur = () => {
    setTimeout(() => setOpenItemDropdown(null), 150);
  };

  const selectItemSuggestion = (index: number, record: any) => {
    const itemCode = record?.item_code || record?.name || '';
    const itemName = record?.item_name || '';
    const rate = Number(record?.standard_rate ?? record?.rate ?? 0) || 0;
    const cgst = Number(record?.cgst_rate ?? record?.cgst ?? 0) || 0;
    const sgst = Number(record?.sgst_rate ?? record?.sgst ?? 0) || 0;
    const stockUom = record?.stock_uom || record?.uom || 'Nos';

    const updatedItems = [...formData.items];
    const quantity = updatedItems[index].quantity;
    const effectiveRate = rate || updatedItems[index].rate;
    const { status, availableQty } = getStockStatus(itemCode, quantity);
    updatedItems[index] = {
      ...updatedItems[index],
      itemCode,
      itemName,
      rate: effectiveRate,
      stockUom,
      cgst: cgst || updatedItems[index].cgst,
      sgst: sgst || updatedItems[index].sgst,
      amount: quantity * effectiveRate,
      stockStatus: status,
      availableQty,
    };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
    setOpenItemDropdown(null);
  };

  const itemOptionLabel = (record: any) => {
    const code = record?.item_code || record?.name || '';
    const name = record?.item_name || '';
    return name ? `${code} — ${name}` : code;
  };

  /* ─── load quotation into form ─────────────────────────────────── */

  const handleQuotationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedQuotationName(name);
    if (!name) return;

    setApplyingQuotation(true);
    try {
      
      const response = await api.get('/quotation');
      const payload = response.data;
      const data = payload && (payload.success === 1 || payload.success === 0) ? payload.data : payload;
      const records: QuotationApiRecord[] = Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data)
          ? data
          : [];

      const record: QuotationApiRecord | undefined =
        records.find((q) => q.name === name) || quotations.find((q) => q.name === name);

      if (!record) {
        toast.error('Selected quotation could not be loaded');
        return;
      }

      applyQuotationToForm(record);
    } catch (err) {
      console.error('Error loading quotation detail:', err);
      toast.error('Failed to load quotation details');
    } finally {
      setApplyingQuotation(false);
    }
  };

  /** Looks up an item_code in the /item master catalog (case-insensitive). */
  const getItemMasterRecord = (itemCode: string): any | undefined =>
    itemCode ? itemMasterMap[itemCode.toUpperCase()] : undefined;

  
  const findLikelyCatalogMatch = (rate: number, quantity: number): any | undefined => {
    const candidates = Object.values(itemMasterMap).filter((m: any) => {
      if (m.is_sales_item === 0) return false;
      const masterRate = Number(m.standard_rate ?? m.selling_price ?? NaN);
      return !isNaN(masterRate) && Math.abs(masterRate - rate) < 0.01;
    });
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0];
    const withEnoughStock = candidates.find((m: any) => {
      const inv = inventoryMap[String(m.item_code).toUpperCase()];
      return inv && (inv.actual_qty ?? 0) >= quantity;
    });
    return withEnoughStock || candidates[0];
  };

  const applyQuotationToForm = (record: QuotationApiRecord) => {
    const rawItems = Array.isArray(record.items) ? record.items : [];

    let items: SalesOrderItem[];
    let itemsAreGuessed = false;
    let itemsNeedManualPick = false;

    if (rawItems.length > 0) {
      
      items = rawItems.map((it, idx) => {
        const itemCode = it.item_code || '';
        const master = getItemMasterRecord(itemCode);
        const quantity = it.qty ?? 1;
        const rate = it.rate ?? master?.standard_rate ?? 0;
        const itemName = it.item_name || master?.item_name || '';
        const stockUom = it.stock_uom || master?.stock_uom || 'Nos';
        const { status, availableQty } = getStockStatus(itemCode, quantity);
        return {
          id: String(idx + 1),
          itemCode,
          itemName,
          quantity,
          rate,
          stockUom,
          cgst: it.cgst_rate ?? 0,
          sgst: it.sgst_rate ?? 0,
          amount: it.amount ?? quantity * rate,
          stockStatus: status,
          availableQty,
        };
      });
    } else {
      
      const quantity = record.total_qty && record.total_qty > 0 ? record.total_qty : 0;
      const baseAmount = record.total ?? record.net_total ?? 0;

      if (quantity > 0 && baseAmount > 0) {
        const rate = Number((baseAmount / quantity).toFixed(2));
        const grand = record.grand_total ?? record.rounded_total ?? baseAmount;
        const taxAmount = Math.max(0, grand - baseAmount);
        const taxPercent = baseAmount > 0 ? (taxAmount / baseAmount) * 100 : 0;
       
        const halfTax = Number((taxPercent / 2).toFixed(2));

        const match = findLikelyCatalogMatch(rate, quantity);

        if (match) {
          const itemCode = match.item_code;
          const { status, availableQty } = getStockStatus(itemCode, quantity);
          items = [{
            id: '1',
            itemCode,
            itemName: match.item_name || '',
            quantity,
            rate: Number(match.standard_rate ?? rate),
            stockUom: match.stock_uom || 'Nos',
            cgst: halfTax,
            sgst: halfTax,
            amount: baseAmount,
            stockStatus: status,
            availableQty,
          }];
          itemsAreGuessed = true;
        } else {
          items = [{
            id: '1',
            itemCode: '',
            itemName: `Select item — no catalog match for ${record.name} totals`,
            quantity,
            rate,
            stockUom: 'Nos',
            cgst: halfTax,
            sgst: halfTax,
            amount: baseAmount,
          }];
          itemsNeedManualPick = true;
        }
      } else {
        items = [{ id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, stockUom: 'Nos', cgst: 0, sgst: 0, amount: 0 }];
      }
    }

    
    let paymentSchedule: PaymentScheduleRow[] = [];
    if (Array.isArray(record.payment_schedule) && record.payment_schedule.length > 0) {
      paymentSchedule = record.payment_schedule.map((p: any, idx: number) => ({
        id: String(idx + 1),
        paymentTerm: p.payment_term || '',
        dueDate: unwrapDate(p.due_date),
        durationDays: p.duration_days ?? daysBetween(unwrapDate(record.transaction_date), unwrapDate(p.due_date)),
        invoicePortion: p.invoice_portion || 0,
        paymentAmount: p.payment_amount || 0,
      }));
    } else {
      const txnDate = unwrapDate(record.transaction_date);
      const dueDate = unwrapDate(record.valid_till);
      if (dueDate) {
        paymentSchedule = [{
          id: '1',
          paymentTerm: record.payment_terms_template || 'Full payment on or before valid till date',
          dueDate,
          durationDays: daysBetween(txnDate, dueDate),
          invoicePortion: 100,
          paymentAmount: record.grand_total ?? record.total ?? 0,
        }];
      }
    }

    setFormData((prev) => ({
      ...prev,
      company: record.company || prev.company,
      customer: record.party_name || prev.customer,
      customerName: record.customer_name || prev.customerName,
      date: unwrapDate(record.transaction_date) || prev.date,
      deliveryDate: unwrapDate(record.valid_till) || prev.deliveryDate,
      paymentTermsTemplate: record.payment_terms_template || prev.paymentTermsTemplate,
      tcName: record.tc_name || prev.tcName,
      termDetails: record.terms || prev.termDetails,
      items,
      paymentSchedule: paymentSchedule.length > 0 ? paymentSchedule : prev.paymentSchedule,
    }));

    
    if (record.party_name) {
      const match = customers.find((c) => String(customerIdOf(c)) === String(record.party_name));
      if (match) setSelectedCustomer(match);
    }

    if (itemsAreGuessed) {
      toast(
        `${record.name} had no saved item lines, so "${items[0].itemName}" (${items[0].itemCode}) was matched by rate — please verify it's correct before saving.`,
        { icon: '⚠️' }
      );
    } else if (itemsNeedManualPick) {
      toast(
        `${record.name} has no saved item lines and no catalog item matches its rate — please pick the actual item code.`,
        { icon: '⚠️' }
      );
    } else if (rawItems.length === 0) {
      toast(`Loaded ${record.name}, but it has no item lines — add items manually.`);
    } else {
      toast.success(`Loaded fields from ${record.name}`);
    }
  };

  /* ─── load existing sales order when editing ──────────────────────── */

  useEffect(() => {
    if (isEditMode && id) {
      fetchSalesOrderById(id);
    }
  }, [id]);

  const SALES_ORDER_PAGE_SIZE = 50;

  const findSalesOrderRecord = async (orderId: string): Promise<SalesOrderApiRecord | null> => {
    const MAX_PAGES = 50;
    let page = 1;

    while (page <= MAX_PAGES) {
      const response = await api.get('/sales-order');
      const payload = response.data;
      if (payload && payload.success === 0) return null;

      const data = payload && payload.success === 1 ? payload.data : payload;
      const records: any[] = Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data)
          ? data
          : [];

      const found = records.find(
        (r) => r && (r.name === orderId || String(r.id) === String(orderId))
      );
      if (found) return found;

      const total = data?.total ?? records.length;
      const fetchedSoFar = page * SALES_ORDER_PAGE_SIZE;
      if (records.length === 0 || fetchedSoFar >= total) {
        return null;
      }
      page += 1;
    }
    return null;
  };

  const fetchSalesOrderById = async (orderId: string) => {
    setLoadingRecord(true);
    setApiError(null);
    try {
      const record = await findSalesOrderRecord(orderId);
      if (record) {
        loadSalesOrderIntoForm(record);
      } else {
        setApiError('Sales order not found');
      }
    } catch (err: any) {
      console.error('Error fetching sales order:', err);
      setApiError(err.response?.data?.message || 'Failed to load sales order');
    } finally {
      setLoadingRecord(false);
    }
  };

  const loadSalesOrderIntoForm = (record: SalesOrderApiRecord) => {
    setRecordName(record.name ?? null);

    const cached = readCachedSalesOrderLineData(record.name);

    const items: SalesOrderItem[] =
      Array.isArray(record.items) && record.items.length > 0
        ? record.items.map((it, idx) => {
          const quantity = it.qty ?? 0;
          const rate = it.rate ?? 0;
          const itemCode = it.item_code || '';
          const { status, availableQty } = getStockStatus(itemCode, quantity);
          return {
            id: String(idx + 1),
            itemCode,
            itemName: it.item_name || '',
            quantity,
            rate,
            stockUom: it.stock_uom || 'Nos',
            cgst: it.cgst_rate ?? 0,
            sgst: it.sgst_rate ?? 0,
            amount: it.amount ?? quantity * rate,
            stockStatus: status,
            availableQty,
          };
        })
        : cached?.items && cached.items.length > 0
          ? cached.items
          : [{ id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, stockUom: 'Nos', cgst: 0, sgst: 0, amount: 0 }];

    let paymentSchedule: PaymentScheduleRow[] = [];
    if (Array.isArray(record.payment_schedule) && record.payment_schedule.length > 0) {
      paymentSchedule = record.payment_schedule.map((p: any, idx: number) => ({
        id: String(idx + 1),
        paymentTerm: p.payment_term || '',
        dueDate: unwrapDate(p.due_date),
        durationDays: p.duration_days ?? daysBetween(unwrapDate(record.transaction_date), unwrapDate(p.due_date)),
        invoicePortion: p.invoice_portion || 0,
        paymentAmount: p.payment_amount || 0,
      }));
    } else if (cached?.paymentSchedule && cached.paymentSchedule.length > 0) {
      paymentSchedule = cached.paymentSchedule;
    } else if (record.payment_terms_template) {
      paymentSchedule = [{
        id: '1',
        paymentTerm: record.payment_terms_template,
        dueDate: unwrapDate(record.delivery_date),
        durationDays: daysBetween(unwrapDate(record.transaction_date), unwrapDate(record.delivery_date)),
        invoicePortion: 100,
        paymentAmount: record.grand_total ?? record.total ?? 0,
      }];
    }

    setFormData((prev) => ({
      ...prev,
      namingSeries: record.naming_series || prev.namingSeries,
      orderType: record.order_type || prev.orderType,
      isSubcontracted: Boolean(record.is_subcontracted),
      company: record.company || prev.company,
      warehouse: record.set_warehouse || prev.warehouse,
      customer: record.party_name || prev.customer,
      customerName: record.customer_name || prev.customerName,
      date: unwrapDate(record.transaction_date) || prev.date,
      deliveryDate: unwrapDate(record.delivery_date) || prev.deliveryDate,
      status: record.status || prev.status,
      paymentTermsTemplate: record.payment_terms_template || prev.paymentTermsTemplate,
      tcName: record.tc_name || prev.tcName,
      termDetails: record.terms || prev.termDetails,
      items,
      paymentSchedule,
    }));
  };

  useEffect(() => {
    if (formData.customer && customers.length > 0) {
      const match = customers.find((c) => String(customerIdOf(c)) === String(formData.customer));
      if (match) setSelectedCustomer(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, formData.customer]);

  /* ─── validation ─────────────────────────────────────────────── */

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.customer.trim())
      allErrors.push({ field: 'customer', label: 'Customer', message: 'Customer is required' });
    if (!formData.date)
      allErrors.push({ field: 'date', label: 'Date', message: 'Date is required' });
    if (!formData.deliveryDate)
      allErrors.push({ field: 'deliveryDate', label: 'Delivery Date', message: 'Delivery date is required' });

    let hasValidItem = false;
    formData.items.forEach((item, index) => {
      if (item.itemCode || item.itemName) {
        hasValidItem = true;
        if (!item.itemCode) {
          allErrors.push({ field: `item_${index}_code`, label: `Item ${index + 1} Code`, message: 'Item code required' });
        }
        if (item.quantity <= 0) {
          allErrors.push({ field: `item_${index}_quantity`, label: `Item ${index + 1} Quantity`, message: 'Quantity must be > 0' });
        }
        if (item.rate <= 0) {
          allErrors.push({ field: `item_${index}_rate`, label: `Item ${index + 1} Rate`, message: 'Rate must be > 0' });
        }
      }
    });
    if (!hasValidItem) {
      allErrors.push({ field: 'items', label: 'Items', message: 'At least one item is required' });
    }

    return allErrors;
  };

  const jumpToField = (field: string) => {
    setShowValidationSummary(false);
    setErrors({});
    setTimeout(() => {
      const el = inputRefs.current[field];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 50);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e as any);
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        addItemRow();
        toast.success('New item added');
        setTimeout(() => {
          const lastIndex = formData.items.length;
          const refKey = `item_${lastIndex}_itemCode`;
          if (itemInputRefs.current[refKey]) {
            itemInputRefs.current[refKey]?.focus();
          }
        }, 100);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowBarcodeScanner(!showBarcodeScanner);
      }

      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items.length, showBarcodeScanner]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current['orderType']?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items]);

  const calculateTotals = () => {
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const baseTotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const cgstTotal = formData.items.reduce((sum, item) => sum + (item.amount * (item.cgst || 0)) / 100, 0);
    const sgstTotal = formData.items.reduce((sum, item) => sum + (item.amount * (item.sgst || 0)) / 100, 0);
    const grandTotal = baseTotal + cgstTotal + sgstTotal;
    const roundedTotal = Math.round(grandTotal);

    setFormData(prev => ({
      ...prev,
      totalQuantity: totalQty,
      baseTotal,
      cgstTotal,
      sgstTotal,
      grandTotal,
      roundedTotal
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
    }

    if (field === 'itemCode' || field === 'quantity') {
      const itemCode = field === 'itemCode' ? String(value) : updatedItems[index].itemCode;
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const { status, availableQty } = getStockStatus(itemCode, quantity);
      updatedItems[index].stockStatus = status;
      updatedItems[index].availableQty = availableQty;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));

    if (field === 'itemCode') {
      scheduleItemSearch(index, String(value));
      setOpenItemDropdown(index);
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number, field: keyof SalesOrderItem) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const fields: (keyof SalesOrderItem)[] = ['itemCode', 'itemName', 'quantity', 'rate', 'cgst', 'sgst'];
      const currentIndex = fields.indexOf(field);

      if (currentIndex === fields.length - 1) {
        if (formData.items[index].rate > 0 && formData.items[index].itemCode) {
          addItemRow();
          setTimeout(() => {
            const newIndex = index + 1;
            const refKey = `item_${newIndex}_itemCode`;
            if (itemInputRefs.current[refKey]) {
              itemInputRefs.current[refKey]?.focus();
            }
          }, 100);
        }
      } else {
        const nextField = fields[currentIndex + 1];
        const refKey = `item_${index}_${nextField}`;
        if (itemInputRefs.current[refKey]) {
          itemInputRefs.current[refKey]?.focus();
        }
      }
    }
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, itemCode: '', itemName: '', quantity: 1, rate: 0, stockUom: 'Nos', cgst: 0, sgst: 0, amount: 0 }
      ]
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  /* ─── payment schedule ───────────────────────────────────────── */

  const addPaymentSchedule = () => {
    const newId = String(formData.paymentSchedule.length + 1);
    setFormData(prev => ({
      ...prev,
      paymentSchedule: [
        ...prev.paymentSchedule,
        { id: newId, paymentTerm: '', dueDate: '', durationDays: 0, invoicePortion: 0, paymentAmount: 0 }
      ]
    }));
  };

  const removePaymentSchedule = (index: number) => {
    if (formData.paymentSchedule.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      paymentSchedule: prev.paymentSchedule.filter((_, i) => i !== index)
    }));
  };

  const updatePaymentRow = (index: number, patch: Partial<PaymentScheduleRow>) => {
    setFormData(prev => {
      const updated = [...prev.paymentSchedule];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, paymentSchedule: updated };
    });
  };

  const handlePaymentDueDateChange = (index: number, dueDate: string) => {
    const duration = daysBetween(formData.date, dueDate);
    updatePaymentRow(index, { dueDate, durationDays: duration });
  };

  const handlePaymentDurationChange = (index: number, durationDays: number) => {
    const dueDate = addDays(formData.date, durationDays);
    updatePaymentRow(index, { durationDays, dueDate });
  };

  /* ─── submit ─────────────────────────────────────────────────── */

  const validateForm = (): boolean => {
    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      return false;
    }
    return true;
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return date.split('T')[0];
  };


  const buildApiPayload = () => {
    const validItems = formData.items.filter((item) => item.itemCode || item.itemName);

    const payload: any = {
      name: isEditMode && recordName ? recordName : generateSalesOrderName(),
      naming_series: formData.namingSeries,
      company: formData.company,
      customer: formData.customer,
      customer_name: formData.customerName,
      transaction_date: formatDate(formData.date),
      delivery_date: formatDate(formData.deliveryDate),
      currency: 'INR',
      set_warehouse: formData.warehouse,
      total_qty: formData.totalQuantity,
      total: formData.baseTotal,
      net_total: formData.baseTotal,
      grand_total: formData.grandTotal,
      payment_terms_template: formData.paymentTermsTemplate,
      tc_name: formData.tcName,
      terms: formData.termDetails,
      items: validItems.map((item) => ({
        item_code: item.itemCode,
        item_name: item.itemName,
        qty: item.quantity,
        stock_uom: item.stockUom || 'Nos',
        rate: item.rate,
        cgst_rate: item.cgst,
        sgst_rate: item.sgst,
        amount: item.amount,
        warehouse: formData.warehouse,
      })),
      payment_schedule: formData.paymentSchedule.map((p) => ({
        payment_term: p.paymentTerm,
        due_date: p.dueDate,
        duration_days: p.durationDays,
        invoice_portion: p.invoicePortion,
        payment_amount: p.paymentAmount,
      })),
    };

    return payload;
  };

  
  const saveSalesOrder = async () => {
    setSaving(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();

      let response;
      if (isEditMode && recordName) {
        response = await api.put('/sales-order', payload);
      } else {
        response = await api.post('/sales-order', payload);
      }

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to save sales order');
      }

   
      const savedName = response.data?.data?.name || payload.name;
      cacheSalesOrderLineData(savedName, {
        items: formData.items,
        paymentSchedule: formData.paymentSchedule,
      });

      toast.success(isEditMode ? 'Sales order updated successfully!' : 'Sales order created successfully!');
      navigate('/sales-order');
    } catch (error: any) {
      console.error('Error saving sales order:', error);
      let message = 'Failed to save sales order';
      if (error.response) {
        message = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        message = 'Network error. Please check your connection.';
      } else if (error.message) {
        message = error.message;
      }
      setApiError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    const insufficientItems = formData.items.filter((item) => item.itemCode && item.stockStatus === 'insufficient');
    if (insufficientItems.length > 0) {
      
      setStockWarningItems(insufficientItems);
      setShowStockWarningModal(true);
      return;
    }

    await saveSalesOrder();
  };

  const confirmSaveDespiteStock = async () => {
    setShowStockWarningModal(false);
    await saveSalesOrder();
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      navigate('/sales-order');
    }
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  return (
    <div className={`create-sales-order-page ${theme}-theme`}>
      {/* Validation Summary Modal */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="jcf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jcf-modal-header jcf-modal-header-warning">
              <h2 className="jcf-modal-title-warning">
                <FaExclamationTriangle /> Missing Required Fields
              </h2>
              <button className="jcf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="jcf-modal-body">
              <p className="jcf-modal-intro">
                Please fill in the following required fields before submitting:
              </p>
              <div className="jcf-error-list">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="jcf-validation-error-item" onClick={() => jumpToField(error.field)}>
                    <div className="jcf-error-header">
                      <FaTimes className="jcf-error-icon" />
                      <strong className="jcf-error-label">{error.label}</strong>
                    </div>
                    <div className="jcf-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="jcf-hint-banner">
                <FaInfoCircle className="jcf-hint-icon" />
                Click on any error to jump to that field
              </div>
            </div>
            <div className="jcf-modal-footer">
              <button className="jcf-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Stock Warning Modal (replaces window.confirm) */}
      {showStockWarningModal && (
        <div className="jcf-modal-overlay" onClick={() => setShowStockWarningModal(false)}>
          <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jcf-modal-header jcf-modal-header-warning">
              <h2 className="jcf-modal-title-warning">
                <FaExclamationTriangle /> Insufficient Stock
              </h2>
              <button className="jcf-modal-close" onClick={() => setShowStockWarningModal(false)}>×</button>
            </div>
            <div className="jcf-modal-body">
              <p className="jcf-modal-intro">
                The following item{stockWarningItems.length > 1 ? 's do' : ' does'} not have enough stock available.
                You can still create this sales order, or go back and adjust the quantities.
              </p>
              <div className="jcf-error-list">
                {stockWarningItems.map((item, idx) => (
                  <div key={idx} className="jcf-validation-error-item" style={{ cursor: 'default' }}>
                    <div className="jcf-error-header">
                      <FaExclamationCircle className="jcf-error-icon" />
                      <strong className="jcf-error-label">
                        {item.itemName || item.itemCode} ({item.itemCode})
                      </strong>
                    </div>
                    <div className="jcf-error-message">
                      Requested {item.quantity}, only {item.availableQty ?? 0} in stock
                    </div>
                  </div>
                ))}
              </div>
              <div className="jcf-hint-banner">
                <FaInfoCircle className="jcf-hint-icon" />
                You can create the order anyway and adjust stock later, or go back to change quantities.
              </div>
            </div>
            <div className="jcf-modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="jcf-btn-cancel" onClick={() => setShowStockWarningModal(false)}>
                Go Back
              </button>
              <button className="submit-btn" onClick={confirmSaveDespiteStock} disabled={saving}>
                {saving && <FaSpinner className="spinning" />}
                <FaSave /> Create Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="jcf-header-wrap">
        <div className="jcf-header-row">
          <button
            type="button"
            className="jcf-back-btn"
            onClick={() => navigate('/sales-order')}
          >
            <FaArrowLeft size={12} />
            Back
          </button>

          <h1 className="jcf-title">
            {isEditMode ? 'Edit Sales Order' : 'Create Sales Order'}
          </h1>

          {apiError && (
            <div className="jcf-error-pill">
              <FaExclamationTriangle size={11} />
              {apiError}
            </div>
          )}

          {hasAnyErrors && (
            <div className="jcf-error-pill">
              <FaExclamationTriangle size={11} />
              {allValidationErrors.length} issue
              {allValidationErrors.length > 1 ? 's' : ''}
            </div>
          )}

          {loadingRecord && (
            <div className="jcf-error-pill">
              <FaSpinner className="spinning" size={11} />
              Loading sales order...
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="salesorder-form">
        <div className="form-scrollable">

          {/* ── Load from Quotation ───────────────────────────── */}
          {!isEditMode && (
            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title"><FaFileImport size={13} /> Load from Quotation</h3>
              </div>
              <div className="form-grid compact-grid">
                <div className="form-group">
                  <label>Select Quotation</label>
                  <select
                    value={selectedQuotationName}
                    onChange={handleQuotationChange}
                    disabled={loadingQuotations || applyingQuotation || loadingItemMaster}
                  >
                    <option value="">
                      {loadingQuotations
                        ? 'Loading quotations...'
                        : loadingItemMaster
                          ? 'Loading item catalog...'
                          : 'Select a quotation to auto-fill this form...'}
                    </option>
                    {quotations.map((q) => (
                      <option key={q.name} value={q.name}>
                        {quotationLabelOf(q)}
                      </option>
                    ))}
                  </select>
                  {applyingQuotation && (
                    <span className="error-text" style={{ color: 'var(--primary-color)' }}>
                      <FaSpinner className="spinning" size={10} /> Loading quotation details...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Basic Information ─────────────────────────────── */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Basic Information</h3>
            </div>
            <div className="form-grid compact-grid">
              {/* Company */}
              {/* <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  ref={setRef('company')}
                />
              </div> */}

              {/* Warehouse */}
              {/* <div className="form-group">
                <label><FaBoxes size={11} style={{ marginRight: 4 }} />Warehouse</label>
                <input
                  type="text"
                  name="warehouse"
                  value={formData.warehouse}
                  onChange={handleInputChange}
                  ref={setRef('warehouse')}
                />
              </div> */}

              {/* Date */}
              <div className="form-group">
                <label>Date *</label>
                <div className="cq-date-field">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={errors.date ? 'error' : ''}
                    ref={setRef('date')}
                  />
                  <button
                    type="button"
                    className="cq-date-icon-btn"
                    onClick={() => openDatePicker('date')}
                    tabIndex={-1}
                    aria-label="Open calendar"
                  >
                    <FaCalendarAlt size={13} />
                  </button>
                </div>
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>

              {/* Delivery Date */}
              <div className="form-group">
                <label>Delivery Date *</label>
                <div className="cq-date-field">
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    className={errors.deliveryDate ? 'error' : ''}
                    ref={setRef('deliveryDate')}
                  />
                  <button
                    type="button"
                    className="cq-date-icon-btn"
                    onClick={() => openDatePicker('deliveryDate')}
                    tabIndex={-1}
                    aria-label="Open calendar"
                  >
                    <FaCalendarAlt size={13} />
                  </button>
                </div>
                {errors.deliveryDate && <span className="error-text">{errors.deliveryDate}</span>}
              </div>
            </div>

            {/* Customer */}
            <div className="form-grid compact-grid" style={{ marginTop: 2 }}>
              <div className="form-group">
                <label><FaUser size={11} style={{ marginRight: 4 }} />Customer *</label>
                <select
                  name="customer"
                  value={formData.customer}
                  onChange={handleCustomerChange}
                  className={errors.customer ? 'error' : ''}
                  ref={setRef('customer')}
                  disabled={loadingCustomers}
                >
                  <option value="">{loadingCustomers ? 'Loading customers...' : 'Select customer...'}</option>
                  {customers.map((c) => (
                    <option key={customerIdOf(c)} value={customerIdOf(c)}>
                      {customerLabelOf(c)}
                    </option>
                  ))}
                </select>
                {errors.customer && <span className="error-text">{errors.customer}</span>}
              </div>

              {selectedCustomer && (
                <div className="form-group full-width">
                  <div className="cq-customer-card">
                    {customerDetailFields
                      .filter(({ key }) => selectedCustomer[key])
                      .map(({ label, key }) => (
                        <div className="cq-customer-field" key={key}>
                          <span className="cq-customer-label">{label}</span>
                          <span className="cq-customer-value">{String(selectedCustomer[key])}</span>
                        </div>
                      ))}
                    {customerDetailFields.filter(({ key }) => selectedCustomer[key]).length === 0 && (
                      <div className="cq-customer-empty">No additional details available for this customer.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Status (fixed to default, not editable) */}
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  disabled
                  className="disabled-input"
                  ref={setRef('status')}
                >
                  {withOption(statusOptions, formData.status).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Items ─────────────────────────────────────── */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title"><FaTag size={13} /> Items</h3>
              <div className="section-actions">
                <button
                  type="button"
                  className="barcode-btn"
                  onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
                  title="Ctrl+B"
                >
                  <FaBarcode size={14} /> Scan Barcode
                </button>
                <button type="button" className="add-item-btn" onClick={addItemRow}>
                  <FaPlus size={12} /> Add Item
                </button>
              </div>
            </div>

            {showBarcodeScanner && (
              <div className="barcode-scanner">
                <input
                  type="text"
                  placeholder="Scan or enter barcode..."
                  value={scanBarcode}
                  onChange={(e) => setScanBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && toast.success(`Item ${scanBarcode} added`)}
                  autoFocus
                />
                <button onClick={() => setShowBarcodeScanner(false)}>
                  <FaTimes size={14} />
                </button>
              </div>
            )}

            {errors.items && <div className="error-text">{errors.items}</div>}

            <div className="items-table-wrapper">
              <table className="items-table cq-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '32px' }}>No.</th>
                    <th className="cq-col-code">Item Code</th>
                    <th style={{ minWidth: '110px' }}>Item Name</th>
                    <th style={{ width: '64px' }}>Qty</th>
                    <th style={{ width: '80px' }}>Rate</th>
                    <th style={{ width: '58px' }}>CGST %</th>
                    <th style={{ width: '58px' }}>SGST %</th>
                    <th style={{ width: '100px' }}>Amount (incl. GST)</th>
                    <th style={{ width: '110px' }}>Stock</th>
                    <th style={{ width: '32px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className={focusedField === `item_${index}` ? 'focused-row' : ''}>
                      <td className="text-center">{index + 1}</td>
                      <td className="cq-col-code" style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                          placeholder="Code"
                          className={errors[`item_${index}_code`] ? 'error' : ''}
                          ref={setItemRef(`item_${index}_itemCode`)}
                          onFocus={() => { setFocusedField(`item_${index}`); handleItemCodeFocus(index); }}
                          onBlur={handleItemCodeBlur}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'itemCode')}
                          autoComplete="off"
                        />
                        {errors[`item_${index}_code`] && <span className="error-text">{errors[`item_${index}_code`]}</span>}

                        {openItemDropdown === index && (
                          <div className="cq-item-suggest-dropdown">
                            {itemSuggestLoading[index] && (
                              <div className="cq-item-suggest-loading"><FaSpinner className="spinning" size={11} /> Searching...</div>
                            )}
                            {!itemSuggestLoading[index] && (itemSuggestions[index]?.length ?? 0) === 0 && (
                              <div className="cq-item-suggest-empty">No items found</div>
                            )}
                            {!itemSuggestLoading[index] && itemSuggestions[index]?.map((rec, ri) => (
                              <div
                                key={ri}
                                className="cq-item-suggest-row"
                                onMouseDown={() => selectItemSuggestion(index, rec)}
                              >
                                {itemOptionLabel(rec)}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          ref={setItemRef(`item_${index}_itemName`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'itemName')}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          min="1"
                          className={errors[`item_${index}_quantity`] ? 'error' : ''}
                          ref={setItemRef(`item_${index}_quantity`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'quantity')}
                        />
                        {errors[`item_${index}_quantity`] && <span className="error-text">{errors[`item_${index}_quantity`]}</span>}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          className={errors[`item_${index}_rate`] ? 'error' : ''}
                          ref={setItemRef(`item_${index}_rate`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'rate')}
                        />
                        {errors[`item_${index}_rate`] && <span className="error-text">{errors[`item_${index}_rate`]}</span>}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.cgst}
                          onChange={(e) => handleItemChange(index, 'cgst', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          ref={setItemRef(`item_${index}_cgst`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'cgst')}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.sgst}
                          onChange={(e) => handleItemChange(index, 'sgst', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          ref={setItemRef(`item_${index}_sgst`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'sgst')}
                        />
                      </td>
                      <td className="amount-cell">
                        INR {getItemGrossAmount(item).toFixed(2)}
                      </td>
                      <td>
                        <StockBadge item={item} />
                      </td>
                      <td>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => removeItemRow(index)}
                            title="Delete item"
                          >
                            <FaTrash size={11} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="total-label">Total Quantity</td>
                    <td className="total-value">{formData.totalQuantity}</td>
                    <td colSpan={2}></td>
                    <td className="total-amount">INR {formData.grandTotal.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="items-summary">
              <div className="summary-row">
                <span>Total Quantity</span>
                <strong>{formData.totalQuantity}</strong>
              </div>
              <div className="summary-row">
                <span>CGST</span>
                <strong>INR {formData.cgstTotal.toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>SGST</span>
                <strong>INR {formData.sgstTotal.toFixed(2)}</strong>
              </div>
              <div className="summary-row total">
                <span>Grand Total</span>
                <strong>INR {formData.roundedTotal.toFixed(2)}</strong>
              </div>
            </div>

            <div className="keyboard-tips">
              <span><kbd>Enter</kbd> Next field</span>
              <span><kbd>Ctrl+Shift+A</kbd> Add item</span>
              <span><kbd>Ctrl+B</kbd> Scan barcode</span>
            </div>
          </div>

          {/* ── Payment Schedule ─────────────────────────────── */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title"><FaCreditCard size={13} /> Payment Schedule</h3>
            </div>

            <div className="payment-schedule-wrapper">
              <div className="payment-schedule-header">
                <span><FaCalendarAlt size={11} style={{ marginRight: 4 }} />Payment Schedule</span>
                <button type="button" className="add-payment-btn" onClick={addPaymentSchedule}>
                  <FaPlus size={11} /> Add Schedule
                </button>
              </div>
              <table className="payment-schedule-table">
                <thead>
                  <tr>
                    <th style={{ width: '32px' }}>No.</th>
                    <th style={{ width: '150px' }}>Due Date</th>
                    <th style={{ width: '130px' }}>Duration (Days)</th>
                    <th style={{ width: '150px' }}>Payment Amount</th>
                    <th style={{ width: '32px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.paymentSchedule.map((schedule, index) => (
                    <tr key={schedule.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="cq-date-field">
                          <input
                            type="date"
                            value={schedule.dueDate}
                            onChange={(e) => handlePaymentDueDateChange(index, e.target.value)}
                            ref={setRef(`payment_${index}_dueDate`)}
                          />
                          <button
                            type="button"
                            className="cq-date-icon-btn"
                            onClick={() => openDatePicker(`payment_${index}_dueDate`)}
                            tabIndex={-1}
                            aria-label="Open calendar"
                          >
                            <FaCalendarAlt size={11} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={schedule.durationDays}
                          onChange={(e) => handlePaymentDurationChange(index, Number(e.target.value))}
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={schedule.paymentAmount}
                          onChange={(e) => updatePaymentRow(index, { paymentAmount: Number(e.target.value) })}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        {formData.paymentSchedule.length > 1 && (
                          <button
                            type="button"
                            className="remove-payment-btn"
                            onClick={() => removePaymentSchedule(index)}
                          >
                            <FaTrash size={10} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Terms and Conditions ─────────────────────────── */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title"><FaFileAlt size={13} /> Terms and Conditions</h3>
            </div>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Term Details</label>
                <textarea
                  name="termDetails"
                  value={formData.termDetails}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter terms and conditions..."
                  ref={setRef('termDetails')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <div className="action-left">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div className="action-right">
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving && <FaSpinner className="spinning" />}
              <FaSave /> {isEditMode ? 'Update Sales Order' : 'Create Sales Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}