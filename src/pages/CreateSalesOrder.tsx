import React, { useState, useEffect, useRef,  } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaSpinner, FaPlus,
  FaTrash, FaFileAlt,
 
  FaTimes, FaExclamationTriangle, FaInfoCircle,
  FaUser, FaCreditCard, FaCalendarAlt,
  FaFileImport, FaCheckCircle, FaExclamationCircle, FaQuestionCircle,
  FaBuilding, FaPhone, FaEnvelope, FaBox, FaCalculator, FaClipboardList,

} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import './CreateSalesOrder.css';
import toast from 'react-hot-toast';
import api from '../../src/services/api';
import ReactDOM from 'react-dom';

/* ─────────────────────────── Types ─────────────────────────── */

type StockStatus = 'checking' | 'available' | 'insufficient' | 'unknown' | undefined;

interface SalesOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  stockUom: string;
  cgst: number;
  sgst: number;
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

// ===== SHARED: portal-based dropdown menu position hook =====
// function useDropdownPosition(isOpen: boolean, triggerRef: React.RefObject<HTMLDivElement | null>) {
//   const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

//   const recalc = useCallback(() => {
//     if (triggerRef.current) {
//       const rect = triggerRef.current.getBoundingClientRect();
//       setPos({
//         top: rect.bottom + 4,
//         left: rect.left,
//         width: rect.width
//       });
//     }
//   }, [triggerRef]);

//   useEffect(() => {
//     if (!isOpen) return;
//     recalc();
//     window.addEventListener('scroll', recalc, true);
//     window.addEventListener('resize', recalc);
//     return () => {
//       window.removeEventListener('scroll', recalc, true);
//       window.removeEventListener('resize', recalc);
//     };
//   }, [isOpen, recalc]);

//   return pos;
// }

// const withOption = (options: string[], value?: string | null): string[] => {
//   if (!value) return options;
//   return options.includes(value) ? options : [value, ...options];
// };

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

const getItemGrossAmount = (item: SalesOrderItem): number => {
  const gstPercent = (item.cgst || 0) + (item.sgst || 0);
  return item.amount + (item.amount * gstPercent) / 100;
};

const generateSalesOrderName = (): string => {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `SAL-ORD-${year}-${suffix}`;
};

/* ═════ SUCCESS MODAL COMPONENT ═════ */
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder: string;
  totalItems: number;
  message: string;
  customerName?: string;
  onViewDetails?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  salesOrder,
  totalItems,
  message,
  customerName,
  onViewDetails
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="so-modal-overlay" onClick={onClose}>
      <div className="so-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="so-modal-success-icon">
          <FaCheckCircle size={48} />
        </div>
        
        <h2 className="so-modal-title">✓ Success!</h2>
        
        <p className="so-modal-message">{message}</p>
        
        <div className="so-modal-details">
          <div className="so-modal-detail-item">
            <span className="so-modal-detail-label">Sales Order</span>
            <span className="so-modal-detail-value so-modal-so-number">{salesOrder}</span>
          </div>
          
          {customerName && (
            <div className="so-modal-detail-item">
              <span className="so-modal-detail-label">Customer</span>
              <span className="so-modal-detail-value">{customerName}</span>
            </div>
          )}
          
          <div className="so-modal-detail-item">
            <span className="so-modal-detail-label">Total Items</span>
            <span className="so-modal-detail-value">{totalItems}</span>
          </div>
        </div>
        
        <div className="so-modal-actions">
          <button onClick={onViewDetails || onClose} className="so-modal-btn so-modal-btn-primary">
            View Sales Order
          </button>
          <button onClick={onClose} className="so-modal-btn so-modal-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ═════ MAIN COMPONENT ═════ */

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
  const [, setLoadingRecord] = useState(false);
  // const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  // const [scanBarcode, setScanBarcode] = useState('');
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showStockWarningModal, setShowStockWarningModal] = useState(false);
  const [stockWarningItems, setStockWarningItems] = useState<SalesOrderItem[]>([]);
  const [recordName, setRecordName] = useState<string | null>(null);

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    salesOrder: string;
    totalItems: number;
    message: string;
    customerName?: string;
  }>({
    salesOrder: '',
    totalItems: 0,
    message: ''
  });

  // Customer lookup
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Item lookup
  const [itemSuggestions, setItemSuggestions] = useState<{ [index: number]: any[] }>({});
  const [itemSuggestLoading, setItemSuggestLoading] = useState<{ [index: number]: boolean }>({});
  const [openItemDropdown, setOpenItemDropdown] = useState<number | null>(null);
  const itemSearchTimers = useRef<{ [index: number]: ReturnType<typeof setTimeout> }>({});

  // Quotation lookup
  const [quotations, setQuotations] = useState<QuotationApiRecord[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [selectedQuotationName, setSelectedQuotationName] = useState('');
  const [applyingQuotation, setApplyingQuotation] = useState(false);

  // Inventory / stock check
  const [inventoryMap, setInventoryMap] = useState<{ [itemCode: string]: InventoryApiRecord }>({});
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Item master catalog
  const [itemMasterMap, setItemMasterMap] = useState<{ [itemCode: string]: any }>({});
  const [loadingItemMaster, setLoadingItemMaster] = useState(false);

  const statusOptions = ['Draft', 'Confirmed', 'On Hold', 'Completed', 'Cancelled', 'Closed'];

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

  // ─── load customers ──────────────────────────
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

  // const customerDetailFields: { label: string; key: string }[] = [
  //   { label: 'Customer Name', key: 'customer_name' },
  //   { label: 'Customer Group', key: 'customer_group' },
  //   { label: 'Territory', key: 'territory' },
  //   { label: 'Mobile No', key: 'mobile_no' },
  //   { label: 'Phone', key: 'phone' },
  //   { label: 'Email', key: 'email_id' },
  //   { label: 'GSTIN', key: 'gstin' },
  //   { label: 'PAN', key: 'pan' },
  //   { label: 'Address', key: 'primary_address' },
  //   { label: 'Credit Limit', key: 'credit_limit' },
  // ];

  // ─── load quotations ──────────────────────────
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

  // ─── load inventory ──────────────────────────
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await api.get('/inventory');
      const records: InventoryApiRecord[] = extractRecords(response.data);
      const map: { [itemCode: string]: InventoryApiRecord } = {};
      records.forEach((r) => {
        if (r.item_code) {
          const key = r.item_code.toUpperCase();
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
        <span className="so-stock-badge so-stock-checking">
          <FaSpinner className="so-spinning" size={9} /> Checking
        </span>
      );
    }
    if (item.stockStatus === 'available') {
      return (
        <span className="so-stock-badge so-stock-available" title={`${item.availableQty} in stock`}>
          <FaCheckCircle size={9} /> In Stock ({item.availableQty})
        </span>
      );
    }
    if (item.stockStatus === 'insufficient') {
      return (
        <span className="so-stock-badge so-stock-insufficient" title={`Only ${item.availableQty} available`}>
          <FaExclamationCircle size={9} /> Only {item.availableQty ?? 0} left
        </span>
      );
    }
    return (
      <span className="so-stock-badge so-stock-unknown">
        <FaQuestionCircle size={9} /> Unknown
      </span>
    );
  };

  // ─── load items (search) ──────────────────────
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

  // ─── load quotation ──────────────────────────
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

  // ─── load existing sales order ───────────────────
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
  }, [customers, formData.customer]);

  // ─── validation ──────────────────────────────
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
  }, [formData.items.length, showBarcodeScanner]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current['orderType']?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    calculateTotals();
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

  // ─── payment schedule ─────────────────────────
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

  // ─── submit ──────────────────────────────────
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

      const totalItems = formData.items.filter(i => i.itemCode && i.quantity > 0).length;

      setSuccessData({
        salesOrder: savedName,
        totalItems: totalItems,
        message: isEditMode ? 'Sales order updated successfully!' : 'Sales order created successfully!',
        customerName: formData.customerName
      });
      setShowSuccessModal(true);

      toast.success(isEditMode ? 'Sales order updated successfully!' : 'Sales order created successfully!');
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

  const handleViewSalesOrder = () => {
    setShowSuccessModal(false);
    navigate(`/sales-order/${successData.salesOrder}`);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/sales-order');
  };

  // const allValidationErrors = getAllValidationErrors();
  // const hasAnyErrors = allValidationErrors.length > 0;

  // In the return statement, replace the existing JSX with this structure:

return (
  <div className={`so-page ${theme}`}>
    <style>{`
      .so-spinning { animation: soSpin 1s linear infinite; }
      @keyframes soSpin { to { transform: rotate(360deg); } }

      .so-custom-scroll::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      .so-custom-scroll::-webkit-scrollbar-track {
        background: var(--border-color, #f1f5f9);
        border-radius: 2px;
      }
      .so-custom-scroll::-webkit-scrollbar-thumb {
        background: var(--text-secondary, #cbd5e1);
        border-radius: 2px;
      }
      .so-custom-scroll::-webkit-scrollbar-thumb:hover {
        background: var(--text-secondary, #94a3b8);
      }
    `}</style>

    {/* Success Modal */}
    <SuccessModal
      isOpen={showSuccessModal}
      onClose={handleCloseModal}
      salesOrder={successData.salesOrder}
      totalItems={successData.totalItems}
      message={successData.message}
      customerName={successData.customerName}
      onViewDetails={handleViewSalesOrder}
    />

    {/* Validation Summary Modal */}
    {showValidationSummary && validationErrors.length > 0 && (
      <div className="so-modal-overlay" onClick={() => setShowValidationSummary(false)}>
        <div className="so-validation-modal" onClick={(e) => e.stopPropagation()}>
          <div className="so-modal-header so-modal-header-warning">
            <h2 className="so-modal-title-warning">
              <FaExclamationTriangle /> Missing Required Fields
            </h2>
            <button className="so-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
          </div>
          <div className="so-modal-body">
            <p className="so-modal-intro">
              Please fill in the following required fields before submitting:
            </p>
            <div className="so-error-list">
              {validationErrors.map((error, idx) => (
                <div key={idx} className="so-validation-error-item" onClick={() => jumpToField(error.field)}>
                  <div className="so-error-header">
                    <FaTimes className="so-error-icon" />
                    <strong className="so-error-label">{error.label}</strong>
                  </div>
                  <div className="so-error-message">{error.message}</div>
                </div>
              ))}
            </div>
            <div className="so-hint-banner">
              <FaInfoCircle className="so-hint-icon" />
              Click on any error to jump to that field
            </div>
          </div>
          <div className="so-modal-footer">
            <button className="so-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* Stock Warning Modal */}
    {showStockWarningModal && (
      <div className="so-modal-overlay" onClick={() => setShowStockWarningModal(false)}>
        <div className="so-validation-modal" onClick={(e) => e.stopPropagation()}>
          <div className="so-modal-header so-modal-header-warning">
            <h2 className="so-modal-title-warning">
              <FaExclamationTriangle /> Insufficient Stock
            </h2>
            <button className="so-modal-close" onClick={() => setShowStockWarningModal(false)}>×</button>
          </div>
          <div className="so-modal-body">
            <p className="so-modal-intro">
              The following item{stockWarningItems.length > 1 ? 's do' : ' does'} not have enough stock available.
              You can still create this sales order, or go back and adjust the quantities.
            </p>
            <div className="so-error-list">
              {stockWarningItems.map((item, idx) => (
                <div key={idx} className="so-validation-error-item" style={{ cursor: 'default' }}>
                  <div className="so-error-header">
                    <FaExclamationCircle className="so-error-icon" />
                    <strong className="so-error-label">
                      {item.itemName || item.itemCode} ({item.itemCode})
                    </strong>
                  </div>
                  <div className="so-error-message">
                    Requested {item.quantity}, only {item.availableQty ?? 0} in stock
                  </div>
                </div>
              ))}
            </div>
            <div className="so-hint-banner">
              <FaInfoCircle className="so-hint-icon" />
              You can create the order anyway and adjust stock later, or go back to change quantities.
            </div>
          </div>
          <div className="so-modal-footer" style={{ justifyContent: 'space-between' }}>
            <button className="so-btn-cancel" onClick={() => setShowStockWarningModal(false)}>
              Go Back
            </button>
            <button className="so-btn so-btn-submit" onClick={confirmSaveDespiteStock} disabled={saving}>
              {saving && <FaSpinner className="so-spinning" />}
              <FaSave /> Create Anyway
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Header */}
    <div className="so-header">
      <div className="so-header-left">
        <button onClick={() => navigate('/sales-order')} className="so-back-btn">
          <FaArrowLeft size={13} /> Back
        </button>
        <div className="so-header-divider" />
        <h1 className="so-header-title">
          {isEditMode ? 'Edit Sales Order' : 'Create Sales Order'}
        </h1>
      </div>
      <div className="so-header-right">
        <label className="so-checkbox-label">
          <input
            type="checkbox"
            name="isSubcontracted"
            checked={formData.isSubcontracted}
            onChange={handleInputChange}
            className="so-checkbox"
          />
          <span>Subcontracted</span>
        </label>
      </div>
    </div>

    {/* API Error Pill */}
    {apiError && (
      <div className="so-error-pill">
        <FaExclamationTriangle size={11} />
        {apiError}
      </div>
    )}

    {/* Main Box */}
    <div className="so-main-box">
      {/* Two-Column Compact Layout */}
      <div className="so-compact-layout">
        {/* Left Column */}
        <div className="so-left-column">
          {/* Load from Quotation */}
          {!isEditMode && (
            <>
              <div className="so-section-header">
                <FaFileImport className="so-section-icon" />
                <span>Load from Quotation</span>
              </div>
              <div className="so-field">
                <label className="so-label">Select Quotation</label>
                <select
                  value={selectedQuotationName}
                  onChange={handleQuotationChange}
                  disabled={loadingQuotations || applyingQuotation || loadingItemMaster}
                  className="so-select"
                >
                  <option value="">
                    {loadingQuotations
                      ? 'Loading quotations...'
                      : loadingItemMaster
                        ? 'Loading item catalog...'
                        : 'Select a quotation to auto-fill...'}
                  </option>
                  {quotations.map((q) => (
                    <option key={q.name} value={q.name}>
                      {quotationLabelOf(q)}
                    </option>
                  ))}
                </select>
                {applyingQuotation && (
                  <span className="so-loading-text">
                    <FaSpinner className="so-spinning" size={10} /> Loading quotation details...
                  </span>
                )}
              </div>
            </>
          )}

          {/* Basic Information */}
          <div className="so-section-header" style={{ marginTop: !isEditMode ? '1rem' : '0' }}>
            <FaBox className="so-section-icon" />
            <span>Basic Information</span>
          </div>

          {/* Customer & Date in one row */}
          <div className="so-field-row">
            <div className="so-field-half">
              <label className="so-label"><FaUser size={11} style={{ marginRight: 4 }} />Customer <span className="so-required">*</span></label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleCustomerChange}
                className={`so-select ${errors.customer ? 'so-select-error' : ''}`}
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
              {errors.customer && <span className="so-error-text">{errors.customer}</span>}
            </div>

            <div className="so-field-half">
              <label className="so-label">Date <span className="so-required">*</span></label>
              <div className="so-date-field">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`so-input ${errors.date ? 'so-input-error' : ''}`}
                  ref={setRef('date')}
                />
                <button
                  type="button"
                  className="so-date-icon-btn"
                  onClick={() => openDatePicker('date')}
                  tabIndex={-1}
                >
                  <FaCalendarAlt size={13} />
                </button>
              </div>
              {errors.date && <span className="so-error-text">{errors.date}</span>}
            </div>
          </div>

          {/* Delivery Date and Status in grid-3 */}
          <div className="so-grid-3">
            <div className="so-field">
              <label className="so-label">Delivery Date <span className="so-required">*</span></label>
              <div className="so-date-field">
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  className={`so-input ${errors.deliveryDate ? 'so-input-error' : ''}`}
                  ref={setRef('deliveryDate')}
                />
                <button
                  type="button"
                  className="so-date-icon-btn"
                  onClick={() => openDatePicker('deliveryDate')}
                  tabIndex={-1}
                >
                  <FaCalendarAlt size={13} />
                </button>
              </div>
              {errors.deliveryDate && <span className="so-error-text">{errors.deliveryDate}</span>}
            </div>

            <div className="so-field">
              <label className="so-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="so-select"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="so-field">
              <label className="so-label">Order Type</label>
              <select
                name="orderType"
                value={formData.orderType}
                onChange={handleInputChange}
                className="so-select"
                ref={setRef('orderType')}
              >
                <option value="Sales">Sales</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Debit Note">Debit Note</option>
                <option value="Quotation">Quotation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column - Customer Detail Card */}
        <div className="so-right-column">
          {selectedCustomer ? (
            <div className="so-detail-card">
              <div className="so-card-header">
                <FaBuilding size={14} />
                <span>Customer Details</span>
              </div>
              <div className="so-card-content">
                <h3>{selectedCustomer.customer_name || selectedCustomer.name}</h3>
                <div className="so-card-info">
                  {selectedCustomer.mobile_no && (
                    <div className="so-info-item">
                      <span className="so-info-label"><FaPhone size={10} /> Phone</span>
                      <span className="so-info-value">{selectedCustomer.mobile_no}</span>
                    </div>
                  )}
                  {selectedCustomer.email_id && (
                    <div className="so-info-item">
                      <span className="so-info-label"><FaEnvelope size={10} /> Email</span>
                      <span className="so-info-value">{selectedCustomer.email_id}</span>
                    </div>
                  )}
                  {selectedCustomer.gstin && (
                    <div className="so-info-item">
                      <span className="so-info-label">GST</span>
                      <span className="so-info-value">{selectedCustomer.gstin}</span>
                    </div>
                  )}
                  {selectedCustomer.primary_address && (
                    <div className="so-info-item">
                      <span className="so-info-label">Address</span>
                      <span className="so-info-value">{selectedCustomer.primary_address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="so-detail-card so-empty-card">
              <div className="so-card-header">
                <FaBuilding size={14} />
                <span>Customer Details</span>
              </div>
              <div className="so-card-content">
                <div className="so-empty-state">
                  <FaInfoCircle size={24} />
                  <p>Select a customer to view details</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Width - Items Section */}
      <div className="so-items-full">
        <div className="so-items-header">
          <span className="so-items-title">
            <FaClipboardList className="so-items-icon" /> Products
          </span>
          <button type="button" className="so-add-btn" onClick={addItemRow}>
            <FaPlus size={9} /> Add
          </button>
        </div>

        {errors.items && <div className="so-items-error"><FaExclamationTriangle /> {errors.items}</div>}

        <div className="so-table-wrap">
          <table className="so-items-table">
            <thead>
              <tr>
                <th className="so-col-code">Item Code</th>
                <th className="so-col-name">Item Name</th>
                <th className="so-col-qty">Qty</th>
                <th className="so-col-rate">Rate</th>
                <th className="so-col-cgst">CGST %</th>
                <th className="so-col-sgst">SGST %</th>
                <th className="so-col-amount">Amount</th>
                <th className="so-col-stock">Stock</th>
                <th className="so-col-action"></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="so-col-code">
                    <input
                      type="text"
                      value={item.itemCode}
                      onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                      placeholder="Code"
                      className={`so-table-input ${errors[`item_${index}_code`] ? 'so-input-error' : ''}`}
                      ref={setItemRef(`item_${index}_itemCode`)}
                      onFocus={() => handleItemCodeFocus(index)}
                      onBlur={handleItemCodeBlur}
                      onKeyDown={(e) => handleItemKeyDown(e, index, 'itemCode')}
                      autoComplete="off"
                    />
                    {openItemDropdown === index && (
                      <div className="so-item-dropdown">
                        {itemSuggestLoading[index] && (
                          <div className="so-item-loading"><FaSpinner className="so-spinning" size={11} /> Searching...</div>
                        )}
                        {!itemSuggestLoading[index] && (itemSuggestions[index]?.length ?? 0) === 0 && (
                          <div className="so-item-empty">No items found</div>
                        )}
                        {!itemSuggestLoading[index] && itemSuggestions[index]?.map((rec, ri) => (
                          <div
                            key={ri}
                            className="so-item-row"
                            onMouseDown={() => selectItemSuggestion(index, rec)}
                          >
                            {itemOptionLabel(rec)}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="so-col-name">
                    <input
                      type="text"
                      value={item.itemName}
                      disabled
                      className="so-table-input so-table-input-disabled so-table-input-text"
                    />
                  </td>
                  <td className="so-col-qty">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      min="1"
                      className={`so-table-input ${errors[`item_${index}_quantity`] ? 'so-input-error' : ''}`}
                      ref={setItemRef(`item_${index}_quantity`)}
                      onKeyDown={(e) => handleItemKeyDown(e, index, 'quantity')}
                    />
                  </td>
                  <td className="so-col-rate">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className={`so-table-input ${errors[`item_${index}_rate`] ? 'so-input-error' : ''}`}
                      ref={setItemRef(`item_${index}_rate`)}
                      onKeyDown={(e) => handleItemKeyDown(e, index, 'rate')}
                    />
                  </td>
                  <td className="so-col-cgst">
                    <input
                      type="number"
                      value={item.cgst}
                      onChange={(e) => handleItemChange(index, 'cgst', Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="so-table-input"
                      ref={setItemRef(`item_${index}_cgst`)}
                      onKeyDown={(e) => handleItemKeyDown(e, index, 'cgst')}
                    />
                  </td>
                  <td className="so-col-sgst">
                    <input
                      type="number"
                      value={item.sgst}
                      onChange={(e) => handleItemChange(index, 'sgst', Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="so-table-input"
                      ref={setItemRef(`item_${index}_sgst`)}
                      onKeyDown={(e) => handleItemKeyDown(e, index, 'sgst')}
                    />
                  </td>
                  <td className="so-col-amount">
                    <span className="so-table-value">INR {getItemGrossAmount(item).toFixed(2)}</span>
                  </td>
                  <td className="so-col-stock">
                    <StockBadge item={item} />
                  </td>
                  <td className="so-col-action">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        className="so-remove-btn"
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
          </table>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="so-bottom-section">
        {/* Left Column - Payment Schedule & Terms */}
        <div className="so-bottom-left">
          {/* Payment Schedule */}
          <div className="so-section-header">
            <FaCreditCard className="so-section-icon" />
            <span>Payment Schedule</span>
          </div>

          <div className="so-payment-table-wrap">
            <table className="so-payment-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Due Date</th>
                  <th>Duration (Days)</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.paymentSchedule.map((schedule, index) => (
                  <tr key={schedule.id}>
                    <td className="so-col-no">{index + 1}</td>
                    <td className="so-col-date">
                      <div className="so-date-field">
                        <input
                          type="date"
                          value={schedule.dueDate}
                          onChange={(e) => handlePaymentDueDateChange(index, e.target.value)}
                          className="so-table-input"
                          ref={setRef(`payment_${index}_dueDate`)}
                        />
                        <button
                          type="button"
                          className="so-date-icon-btn"
                          onClick={() => openDatePicker(`payment_${index}_dueDate`)}
                          tabIndex={-1}
                        >
                          <FaCalendarAlt size={11} />
                        </button>
                      </div>
                    </td>
                    <td className="so-col-duration">
                      <input
                        type="number"
                        value={schedule.durationDays}
                        onChange={(e) => handlePaymentDurationChange(index, Number(e.target.value))}
                        min="0"
                        className="so-table-input"
                      />
                    </td>
                    <td className="so-col-amount">
                      <input
                        type="number"
                        value={schedule.paymentAmount}
                        onChange={(e) => updatePaymentRow(index, { paymentAmount: Number(e.target.value) })}
                        min="0"
                        step="0.01"
                        className="so-table-input"
                      />
                    </td>
                    <td className="so-col-action">
                      {formData.paymentSchedule.length > 1 && (
                        <button
                          type="button"
                          className="so-remove-btn"
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

          <button type="button" className="so-add-payment-btn" onClick={addPaymentSchedule}>
            <FaPlus size={9} /> Add Schedule
          </button>

          {/* Terms and Conditions */}
          <div className="so-section-header" style={{ marginTop: '1rem' }}>
            <FaFileAlt className="so-section-icon" />
            <span>Terms and Conditions</span>
          </div>
          <div className="so-field">
            <label className="so-label">Term Details</label>
            <textarea
              name="termDetails"
              value={formData.termDetails}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter terms and conditions..."
              className="so-textarea"
              ref={setRef('termDetails')}
            />
          </div>
        </div>

        {/* Right Column - Summary Card */}
        <div className="so-bottom-right">
          <div className="so-detail-card so-summary-card">
            <div className="so-card-header">
              <FaCalculator size={14} />
              <span>Financial Summary</span>
            </div>
            <div className="so-card-content">
              <div className="so-summary-grid">
                <div className="so-summary-item">
                  <span className="so-summary-label">Total Qty</span>
                  <span className="so-summary-value">{formData.totalQuantity}</span>
                </div>
                <div className="so-summary-item">
                  <span className="so-summary-label">Base Total</span>
                  <span className="so-summary-value">INR {formData.baseTotal.toFixed(2)}</span>
                </div>
                <div className="so-summary-item">
                  <span className="so-summary-label">CGST</span>
                  <span className="so-summary-value">INR {formData.cgstTotal.toFixed(2)}</span>
                </div>
                <div className="so-summary-item">
                  <span className="so-summary-label">SGST</span>
                  <span className="so-summary-value">INR {formData.sgstTotal.toFixed(2)}</span>
                </div>
                <div className="so-summary-grand">
                  <span className="so-summary-grand-label">Grand Total</span>
                  <span className="so-summary-grand-value">INR {formData.roundedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Form Actions */}
    <div className="so-form-footer">
      <button type="button" className="so-btn so-btn-secondary" onClick={handleCancel}>
        <FaTimes size={11} /> Cancel
      </button>
      <button type="button" className="so-btn so-btn-submit" onClick={handleSubmit} disabled={saving}>
        {saving && <FaSpinner className="so-spinning" />}
        <FaSave /> {isEditMode ? 'Update Sales Order' : 'Create Sales Order'}
      </button>
    </div>
  </div>
)
}