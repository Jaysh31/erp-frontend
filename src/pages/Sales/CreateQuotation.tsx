import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaSpinner, FaPlus,
  FaTrash, FaFileAlt,
  FaBarcode, FaTag,
  FaTimes, FaExclamationTriangle, FaInfoCircle,
  FaUser, FaCreditCard, FaCalendarAlt,
   FaHands // Added icons for Items/Services
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import './CreateQuotation.css';
import toast from 'react-hot-toast';
import api from '../../services/api';

/* ─────────────────────────── Types ─────────────────────────── */

interface QuotationItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  cgst: number; // percentage
  sgst: number; // percentage
  amount: number;
}

interface PaymentScheduleRow {
  id: string;
  paymentTerm: string;
  dueDate: string;
  durationDays: number;
  invoicePortion: number;
  paymentAmount: number;
}

interface QuotationForm {
  type: string;           
  date: string;
  validTill: string;
  customer: string;      
  customerName: string;  
  status: string;
  items: QuotationItem[];
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

/** Shape returned by GET /quotation/:id (matches the POST/PUT /quotation payload). */
interface QuotationApiRecord {
  name: string;
  naming_series?: string;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  valid_till?: string;
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
    cgst_rate?: number;
    sgst_rate?: number;
    amount?: number;
  }>;
  payment_schedule?: any[];
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

const QUOTATION_LINE_CACHE_PREFIX = 'quotation_line_data:';

interface CachedQuotationLineData {
  items?: QuotationItem[];
  paymentSchedule?: PaymentScheduleRow[];
}

const cacheQuotationLineData = (name: string, data: CachedQuotationLineData) => {
  try {
    localStorage.setItem(QUOTATION_LINE_CACHE_PREFIX + name, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const readCachedQuotationLineData = (name: string): CachedQuotationLineData | null => {
  try {
    const raw = localStorage.getItem(QUOTATION_LINE_CACHE_PREFIX + name);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Normalizes a list-style API response: { success, data: { records, total } } or { success, data: [...] } */
const extractRecords = (payload: any): any[] => {
  if (!payload) return [];
  const data = payload.success === 1 || payload.success === 0 ? payload.data : payload;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data)) return data;
  return [];
};

/** Computes the line amount after applying CGST + SGST to the base (qty * rate) amount. */
const getItemGrossAmount = (item: QuotationItem): number => {
  const gstPercent = (item.cgst || 0) + (item.sgst || 0);
  return item.amount + (item.amount * gstPercent) / 100;
};

/* ─────────────────────────── Component ─────────────────────────── */

export default function CreateQuotation() {
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

  // ─── Type options ──────────────────────────────────────────────
  const typeOptions = ['Items', 'Services']; // Updated to match DC page

  const statusOptions = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'];

  const defaultFormData = (): QuotationForm => ({
    type: 'Items', // Default to Items
    date: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer: '',
    customerName: '',
    status: 'Draft',
    items: [
      { id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, cgst: 0, sgst: 0, amount: 0 }
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

  const [formData, setFormData] = useState<QuotationForm>(defaultFormData());

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

  /* ─── load customers (sourced from qualified leads) ────────────── */

  /** Only leads with status "Qualified" should be selectable as a quotation customer. */
  const isQualifiedCustomer = (c: any): boolean => {
    const status = c?.status ?? '';
    return String(status).trim().toLowerCase() === 'qualified';
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await api.get('/lead');
      const records = extractRecords(response.data);
      setCustomers(records.filter(isQualifiedCustomer));
    } catch (err) {
      console.error('Error fetching qualified leads:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  /** Leads don't have a stable "customer code" like /customer records do,
   *  so fall back to company name, then lead id, then contact name. */
  const customerIdOf = (c: any) => c?.company_name || (c?.id != null ? String(c.id) : '') || c?.lead_name || '';
  const customerLabelOf = (c: any) => {
    const org = c?.company_name || '';
    const contact = c?.lead_name || '';
    if (org && contact && org !== contact) return `${org} (${contact})`;
    return org || contact || customerIdOf(c);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const match = customers.find((c) => String(customerIdOf(c)) === value);
    setSelectedCustomer(match || null);
    setFormData((prev) => ({
      ...prev,
      customer: value,
      customerName: match?.company_name || match?.lead_name || value,
    }));
    if (errors.customer) setErrors((prev) => ({ ...prev, customer: '' }));
  };

  // ─── Handle Type Change (Items/Services) ──────────────────────
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    // Clear existing items when switching type
    setFormData((prev) => ({
      ...prev,
      type: value,
      items: [
        { id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, cgst: 0, sgst: 0, amount: 0 }
      ],
      totalQuantity: 0,
      baseTotal: 0,
      cgstTotal: 0,
      sgstTotal: 0,
      grandTotal: 0,
      roundedTotal: 0
    }));
    
    // Clear item suggestions when type changes
    setItemSuggestions({});
    setOpenItemDropdown(null);
    
    // Show toast notification
    toast.success(`Switched to ${value}`);
  };

  const customerDetailFields: { label: string; key: string }[] = [
    { label: 'Contact Name', key: 'lead_name' },
    { label: 'Mobile No', key: 'mobile_no' },
    { label: 'Email', key: 'email_id' },
    { label: 'City', key: 'city' },
    { label: 'State', key: 'state' },
    { label: 'Country', key: 'country' },
    { label: 'Lead Owner', key: 'lead_owner' },
  ];

  /* ─── load items (search) ────────────────────────────────────── */

  const fetchItemOptions = async (index: number, query: string) => {
    setItemSuggestLoading((prev) => ({ ...prev, [index]: true }));
    try {
      // Filter items based on type
      const typeFilter = formData.type === 'Items' ? 'item' : 'service';
      const url = query
        ? `/item?page=1&limit=10&search=${encodeURIComponent(query)}&type=${typeFilter}`
        : `/item?page=1&limit=10&type=${typeFilter}`;
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

    const updatedItems = [...formData.items];
    const quantity = updatedItems[index].quantity;
    const effectiveRate = rate || updatedItems[index].rate;
    updatedItems[index] = {
      ...updatedItems[index],
      itemCode,
      itemName,
      rate: effectiveRate,
      cgst: cgst || updatedItems[index].cgst,
      sgst: sgst || updatedItems[index].sgst,
      amount: quantity * effectiveRate,
    };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
    setOpenItemDropdown(null);
  };

  const itemOptionLabel = (record: any) => {
    const code = record?.item_code || record?.name || '';
    const name = record?.item_name || '';
    return name ? `${code} — ${name}` : code;
  };

  /* ─── load existing quotation when editing ──────────────────────── */

  useEffect(() => {
    if (isEditMode && id) {
      fetchQuotationById(id);
    }
  }, [id]);

  const QUOTATION_PAGE_SIZE = 50;

  const findQuotationRecord = async (quotationId: string): Promise<QuotationApiRecord | null> => {
    const MAX_PAGES = 50;
    let page = 1;

    while (page <= MAX_PAGES) {
      const response = await api.get("/quotation");
      const payload = response.data;
      if (payload && payload.success === 0) return null;

      const data = payload && payload.success === 1 ? payload.data : payload;
      const records: any[] = Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data)
          ? data
          : [];

      const found = records.find(
        (r) => r && (r.name === quotationId || String(r.id) === String(quotationId))
      );
      if (found) return found;

      const total = data?.total ?? records.length;
      const fetchedSoFar = page * QUOTATION_PAGE_SIZE;
      if (records.length === 0 || fetchedSoFar >= total) {
        return null;
      }
      page += 1;
    }
    return null;
  };

  const fetchQuotationById = async (quotationId: string) => {
    setLoadingRecord(true);
    setApiError(null);
    try {
      const record = await findQuotationRecord(quotationId);
      if (record) {
        loadQuotationIntoForm(record);
      } else {
        setApiError('Quotation not found');
      }
    } catch (err: any) {
      console.error('Error fetching quotation:', err);
      setApiError(err.response?.data?.message || 'Failed to load quotation');
    } finally {
      setLoadingRecord(false);
    }
  };

  const loadQuotationIntoForm = (record: QuotationApiRecord) => {
    setRecordName(record.name ?? null);

    const cached = readCachedQuotationLineData(record.name);

    const items: QuotationItem[] =
      Array.isArray(record.items) && record.items.length > 0
        ? record.items.map((it, idx) => {
          const quantity = it.qty ?? 0;
          const rate = it.rate ?? 0;
          return {
            id: String(idx + 1),
            itemCode: it.item_code || '',
            itemName: it.item_name || '',
            quantity,
            rate,
            cgst: it.cgst_rate ?? 0,
            sgst: it.sgst_rate ?? 0,
            amount: it.amount ?? quantity * rate,
          };
        })
        : cached?.items && cached.items.length > 0
          ? cached.items
          : [{ id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, cgst: 0, sgst: 0, amount: 0 }];

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
        dueDate: unwrapDate(record.valid_till),
        durationDays: daysBetween(unwrapDate(record.transaction_date), unwrapDate(record.valid_till)),
        invoicePortion: 100,
        paymentAmount: record.grand_total ?? record.total ?? 0,
      }];
    }

    // Determine type from naming_series or items
    let type = 'Items'; // default to Items
    if (record.naming_series) {
      if (record.naming_series.includes('SVC')) {
        type = 'Services';
      } else if (record.naming_series.includes('SAL')) {
        type = 'Items';
      }
    } else if (items.length > 0 && items[0].itemCode) {
      // Try to determine from item code prefix or API
      type = formData.type || 'Items';
    }

    setFormData((prev) => ({
      ...prev,
      type: type,
      customer: record.party_name || prev.customer,
      customerName: record.customer_name || prev.customerName,
      date: unwrapDate(record.transaction_date) || prev.date,
      validTill: unwrapDate(record.valid_till) || prev.validTill,
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
    if (!formData.validTill)
      allErrors.push({ field: 'validTill', label: 'Valid Till', message: 'Valid till date is required' });

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
      inputRefs.current['type']?.focus();
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
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

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));

    if (field === 'itemCode') {
      scheduleItemSearch(index, String(value));
      setOpenItemDropdown(index);
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number, field: keyof QuotationItem) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const fields: (keyof QuotationItem)[] = ['itemCode', 'itemName', 'quantity', 'rate', 'cgst', 'sgst'];
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
        { id: newId, itemCode: '', itemName: '', quantity: 1, rate: 0, cgst: 0, sgst: 0, amount: 0 }
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

  const generateQuotationName = (): string => {
    const year = new Date().getFullYear();
    const prefix = formData.type === 'Items' ? 'SAL-QTN' : 'SVC-QTN';
    const suffix = Date.now().toString(36).toUpperCase().slice(-6);
    return `${prefix}-${year}-${suffix}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return date.split("T")[0];
  };

  const buildApiPayload = () => {
    const payload: any = {
      name: isEditMode && recordName ? recordName : generateQuotationName(),
      naming_series: formData.type === 'Items' ? 'SAL-QTN-.YYYY.-' : 'SVC-QTN-.YYYY.-',
      type: formData.type === 'Items' ? 'item' : 'service',
      party_name: formData.customer,
      customer_name: formData.customerName,
      transaction_date: formatDate(formData.date),
      valid_till: formatDate(formData.validTill),
      currency: 'INR',
      conversion_rate: 1,
      selling_price_list: 'Standard Selling',
      total_qty: formData.totalQuantity,
      base_total: formData.baseTotal,
      base_net_total: formData.baseTotal,
      total: formData.baseTotal,
      net_total: formData.baseTotal,
      total_taxes_and_charges: formData.cgstTotal + formData.sgstTotal,
      base_grand_total: formData.grandTotal,
      grand_total: formData.grandTotal,
      rounded_total: formData.roundedTotal,
      base_rounded_total: formData.roundedTotal,
      in_words: `INR ${formData.roundedTotal} Only`,
      base_in_words: `INR ${formData.roundedTotal} Only`,
      status: formData.status,
      title: `Quotation for ${formData.customerName}`,
      payment_terms_template: formData.paymentTermsTemplate,
      tc_name: formData.tcName,
      terms: formData.termDetails,
      items: formData.items
        .filter((item) => item.itemCode || item.itemName)
        .map((item) => ({
          item_code: item.itemCode,
          item_name: item.itemName,
          qty: item.quantity,
          rate: item.rate,
          cgst_rate: item.cgst,
          sgst_rate: item.sgst,
          amount: item.amount,
        })),
      taxes: [
        ...(formData.cgstTotal > 0 ? [{ charge_type: 'Tax', account_head: 'CGST', rate: 0, tax_amount: formData.cgstTotal, total: formData.baseTotal + formData.cgstTotal }] : []),
        ...(formData.sgstTotal > 0 ? [{ charge_type: 'Tax', account_head: 'SGST', rate: 0, tax_amount: formData.sgstTotal, total: formData.grandTotal }] : []),
      ],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();
      console.log('Saving quotation with payload:', payload);

      let response;
      if (isEditMode && recordName) {
        response = await api.put('/quotation', payload);
      } else {
        response = await api.post('/quotation', payload);
      }

      console.log('Quotation save response:', response.data);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to save quotation');
      }

      cacheQuotationLineData(payload.name, {
        items: formData.items,
        paymentSchedule: formData.paymentSchedule,
      });

      toast.success(isEditMode ? 'Quotation updated successfully!' : 'Quotation created successfully!');
      navigate('/quotation');
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      let message = 'Failed to save quotation';
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

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      navigate('/quotation');
    }
  };

  // Helper to get type icon
  // const getTypeIcon = () => {
  //   return formData.type === 'Items' ? <FaBox size={14} /> : <FaHands size={14} />;
  // };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  return (
    <div className={`create-quotation-page ${theme}-theme`}>
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

      <div className="jcf-header-wrap">
        <div className="jcf-header-row">
          <button
            type="button"
            className="jcf-back-btn"
            onClick={() => navigate("/quotation")}
          >
            <FaArrowLeft size={12} />
            Back
          </button>

          <h1 className="jcf-title">
            {isEditMode ? 'Edit Quotation' : 'Create Quotation'}
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
              {allValidationErrors.length > 1 ? "s" : ""}
            </div>
          )}

          {loadingRecord && (
            <div className="jcf-error-pill">
              <FaSpinner className="spinning" size={11} />
              Loading quotation...
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="quotation-form">
        <div className="form-scrollable">

          {/* ── Basic Information ─────────────────────────────── */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Basic Information</h3>
            </div>
            <div className="form-grid compact-grid">
              {/* 1. Type Dropdown - Items/Services like DC page */}
              <div className="form-group">
                <label>Type *</label>
                <div className="cq-type-select-wrapper">
                  {/* <span className="cq-type-icon">{getTypeIcon()}</span> */}
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    ref={setRef('type')}
                    className={errors.type ? 'error' : ''}
                  >
                    {typeOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {errors.type && <span className="error-text">{errors.type}</span>}
                <small className="cq-type-hint">
                  {formData.type === 'Items' ? '📦 Quotation for physical products' : '🛠️ Quotation for services'}
                </small>
              </div>

              {/* 2. Date */}
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

              {/* 3. Valid Till */}
              <div className="form-group">
                <label>Valid Till *</label>
                <div className="cq-date-field">
                  <input
                    type="date"
                    name="validTill"
                    value={formData.validTill}
                    onChange={handleInputChange}
                    className={errors.validTill ? 'error' : ''}
                    ref={setRef('validTill')}
                  />
                  <button
                    type="button"
                    className="cq-date-icon-btn"
                    onClick={() => openDatePicker('validTill')}
                    tabIndex={-1}
                    aria-label="Open calendar"
                  >
                    <FaCalendarAlt size={13} />
                  </button>
                </div>
                {errors.validTill && <span className="error-text">{errors.validTill}</span>}
              </div>

            </div>

            {/* 4. Customer */}
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
                  <option value="">
                    {loadingCustomers
                      ? 'Loading customers...'
                      : customers.length === 0
                        ? 'No qualified leads available'
                        : 'Select qualified customer...'}
                  </option>
                  {customers.map((c) => (
                    <option key={customerIdOf(c)} value={customerIdOf(c)}>
                      {customerLabelOf(c)}
                    </option>
                  ))}
                </select>
                {errors.customer && <span className="error-text">{errors.customer}</span>}
                {!loadingCustomers && customers.length === 0 && (
                  <small className="cq-type-hint">
                    Only leads with a "Qualified" status can be selected here.
                  </small>
                )}
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

              {/* 5. Status (fixed to default, not editable) */}
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

          {/* ── 6. Items ─────────────────────────────────────── */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">
                {formData.type === 'Items' ? <FaTag size={13} /> : <FaHands size={13} />}
                {formData.type === 'Items' ? ' Items' : ' Services'}
              </h3>
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
                  <FaPlus size={12} /> Add {formData.type === 'Items' ? 'Item' : 'Service'}
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
                    <th className="cq-col-code">{formData.type === 'Items' ? 'Item Code' : 'Service Code'}</th>
                    <th style={{ minWidth: '110px' }}>{formData.type === 'Items' ? 'Item Name' : 'Service Name'}</th>
                    <th style={{ width: '64px' }}>Qty</th>
                    <th style={{ width: '80px' }}>Rate</th>
                    <th style={{ width: '58px' }}>CGST %</th>
                    <th style={{ width: '58px' }}>SGST %</th>
                    <th style={{ width: '100px' }}>Amount (incl. GST)</th>
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
                          placeholder={formData.type === 'Items' ? 'Item Code' : 'Service Code'}
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
                              <div className="cq-item-suggest-empty">No {formData.type.toLowerCase()} found</div>
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
                          placeholder={formData.type === 'Items' ? 'Item name' : 'Service name'}
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
                    <td></td>
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
              <span><kbd>Ctrl+Shift+A</kbd> Add {formData.type === 'Items' ? 'item' : 'service'}</span>
              <span><kbd>Ctrl+B</kbd> Scan barcode</span>
            </div>
          </div>

          {/* ── 7. Payment Schedule ─────────────────────────────── */}
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

          {/* ── 8. Terms and Conditions ─────────────────────────── */}
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
              <FaSave /> {isEditMode ? 'Update Quotation' : 'Create Quotation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}