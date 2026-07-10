import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaSpinner, FaPlus,
  FaTrash, FaFileAlt,
  FaDollarSign, FaBarcode, FaCopy, FaTag,
  FaAddressCard, FaCreditCard,
  FaTimes, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import './CreateQuotation.css';
import toast from 'react-hot-toast';
import api from '../../src/services/api';

interface QuotationItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface TaxRow {
  id: string;
  type: string;
  accountHead: string;
  taxRate: number;
  netAmount: number;
  amount: number;
  total: number;
}

interface PaymentSchedule {
  id: string;
  paymentTerm: string;
  description: string;
  dueDate: string;
  invoicePortion: number;
  paymentAmount: number;
}

interface QuotationForm {
  namingSeries: string;
  quotationTo: string;
  customer: string;
  partyName: string;
  date: string;
  validTill: string;
  orderType: string;
  company: string;
  status: string;
  currency: string;
  priceList: string;
  items: QuotationItem[];
  totalQuantity: number;
  baseTotal: number;
  baseNetTotal: number;
  total: number;
  netTotal: number;
  taxCategory: string;
  taxesAndCharges: string;
  shippingRule: string;
  incoterm: string;
  taxes: TaxRow[];
  baseTotalTaxesAndCharges: number;
  totalTaxesAndCharges: number;
  baseGrandTotal: number;
  baseRoundingAdjustment: number;
  baseRoundedTotal: number;
  grandTotal: number;
  roundingAdjustment: number;
  roundedTotal: number;
  customerAddress: string;
  placeOfSupply: string;
  contactPerson: string;
  shippingAddress: string;
  companyAddress: string;
  paymentTermsTemplate: string;
  paymentSchedule: PaymentSchedule[];
  tcName: string;
  termDetails: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
  tabIndex: number;
}

/** Shape returned by GET /quotation/:id (matches the POST/PUT /quotation payload). */
interface QuotationApiRecord {
  name: string;

  naming_series?: string;
  quotation_to?: string;

  party_name?: string;
  customer_name?: string;

  transaction_date?: string;
  valid_till?: string;

  order_type?: string;
  company?: string;
  status?: string;

  currency?: string;
  selling_price_list?: string;

  tax_category?: string;
  taxes_and_charges?: string;

  shipping_rule?: string;
  incoterm?: string;

  customer_address?: string;
  address_display?: string;
  territory?: string;
  contact_person?: string;
  contact_display?: string;

  shipping_address?: string;
  company_address?: string;
  company_address_display?: string;

  payment_terms_template?: string;

  tc_name?: string;
  terms?: string;

  grand_total?: number;
  total?: number;
  total_taxes_and_charges?: number;

  taxes?: any[];

  payment_schedule?: any[];

  items?: Array<{
    item_code?: string;
    item_name?: string;
    qty?: number;
    rate?: number;
    amount?: number;
  }>;
}

/**
 * Ensures a <select>'s currently-loaded value is always present as an option,
 * even if it isn't one of the predefined suggestions. Without this, editing a
 * quotation whose stored value (e.g. a real customer code or tax template)
 * doesn't match the static demo list would silently render as blank.
 */
const withOption = (options: string[], value?: string | null): string[] => {
  if (!value) return options;
  return options.includes(value) ? options : [value, ...options];
};

const unwrapDate = (value?: string | null): string => {
  if (!value) return '';
  return value.split('T')[0];
};


const QUOTATION_LINE_CACHE_PREFIX = 'quotation_line_data:';

interface CachedQuotationLineData {
  items?: QuotationItem[];
  taxes?: TaxRow[];
  paymentSchedule?: PaymentSchedule[];
}

const cacheQuotationLineData = (name: string, data: CachedQuotationLineData) => {
  try {
    localStorage.setItem(QUOTATION_LINE_CACHE_PREFIX + name, JSON.stringify(data));
  } catch {
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
  const [activeTab, setActiveTab] = useState(0);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // The real docname/primary key from the backend (used for PUT)
  const [recordName, setRecordName] = useState<string | null>(null);

  const tabs = [
    { id: 0, name: 'Details', icon: <FaFileAlt size={14} /> },
    { id: 1, name: 'Items', icon: <FaTag size={14} /> },
    { id: 2, name: 'Taxes & Totals', icon: <FaDollarSign size={14} /> },
    { id: 3, name: 'Payment & Terms', icon: <FaCreditCard size={14} /> },
  ];

  const taxTypes = ['Tax', 'Charge', 'Cess', 'Surcharge'];
  const accountHeads = ['GST - 18%', 'GST - 12%', 'GST - 5%', 'Service Tax', 'VAT', 'Customs Duty'];
  const paymentTerms = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Cash on Delivery'];
  const taxCategories = ['Standard', 'Export', 'SEZ', 'GST', 'VAT'];
  const shippingRules = ['Free Shipping', 'Flat Rate', 'Weight Based', 'Price Based'];
  const incoterms = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
  const placeOfSupplyOptions = ['Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Rajasthan'];
  const contactPersons = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Mary Williams'];
  const companies = ['My Company', 'Sculptor Tech Pvt Ltd'];
  const statusOptions = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'];
  const customerOptions = ['CUST-001', 'CUST-002', 'CUST-003'];
  const taxesAndChargesOptions = ['GST-18', 'GST-12', 'GST-5'];
  const customerAddresses = [
    '123, Business Park, Mumbai, Maharashtra - 400001',
    '456, Industrial Area, Pune, Maharashtra - 411001',
    '789, Commercial Complex, Delhi - 110001'
  ];
  const shippingAddresses = [
    'Warehouse 1, Industrial Zone, Mumbai - 400001',
    'Warehouse 2, Logistics Park, Pune - 411001'
  ];
  const companyAddresses = [
    'Corporate Office, 100, Main Street, Mumbai - 400001'
  ];
  const termsList = ['Standard Terms', 'Export Terms', 'Special Terms', 'Credit Terms'];

  const defaultFormData = (): QuotationForm => ({
    namingSeries: 'SAL-QTN-.YYYY.-',
    quotationTo: '',
    customer: '',
    partyName: '',
    date: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    orderType: '',
    company: '',
    status: '',
    currency: 'INR',
    priceList: 'Standard Selling',
    items: [
      { id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, amount: 0 }
    ],
    totalQuantity: 0,
    baseTotal: 0,
    baseNetTotal: 0,
    total: 0,
    netTotal: 0,
    taxCategory: '',
    taxesAndCharges: '',
    shippingRule: '',
    incoterm: '',
    taxes: [],
    baseTotalTaxesAndCharges: 0,
    totalTaxesAndCharges: 0,
    baseGrandTotal: 0,
    baseRoundingAdjustment: 0,
    baseRoundedTotal: 0,
    grandTotal: 0,
    roundingAdjustment: 0,
    roundedTotal: 0,
    customerAddress: '',
    placeOfSupply: '',
    contactPerson: '',
    shippingAddress: '',
    companyAddress: '',
    paymentTermsTemplate: 'Net 30',
    paymentSchedule: [
      { id: '1', paymentTerm: 'Net 30', description: 'Payment due within 30 days', dueDate: '', invoicePortion: 100, paymentAmount: 0 }
    ],
    tcName: '',
    termDetails: 'Payment due within 30 days. Late payment penalty of 2% per month applies.'
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

  // ─── load existing quotation when editing ──────────────────────────

  useEffect(() => {
    if (isEditMode && id) {
      fetchQuotationById(id);
    }
  }, [id]);

  const QUOTATION_PAGE_SIZE = 50;

  
  const findQuotationRecord = async (quotationId: string): Promise<QuotationApiRecord | null> => {
    const MAX_PAGES = 50; // safety cap against a runaway backend
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
        return null; // exhausted every page — not found
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
              amount: it.amount ?? quantity * rate,
            };
          })
        : cached?.items && cached.items.length > 0
          ? cached.items
          : [{ id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, amount: 0 }];

    let taxes: TaxRow[] = [];
    if (Array.isArray(record.taxes) && record.taxes.length > 0) {
      taxes = record.taxes.map((tax: any, idx: number) => ({
        id: String(idx + 1),
        type: tax.charge_type || 'Tax',
        accountHead: tax.account_head || '',
        taxRate: tax.rate || 0,
        netAmount: tax.tax_amount ?? tax.net_amount ?? 0,
        amount: tax.tax_amount || 0,
        total: tax.total || 0,
      }));
    } else if (cached?.taxes && cached.taxes.length > 0) {
      taxes = cached.taxes;
    } else if (record.total_taxes_and_charges) {
      // No line-item tax breakdown from the API, but a tax total exists —
      // surface it as a single row so the Taxes & Totals tab still reflects
      // what was actually saved instead of showing an empty table.
      taxes = [{
        id: '1',
        type: 'Tax',
        accountHead: record.taxes_and_charges || 'Tax',
        taxRate: 0,
        netAmount: record.total_taxes_and_charges,
        amount: record.total_taxes_and_charges,
        total: record.total_taxes_and_charges,
      }];
    }

    let paymentSchedule: PaymentSchedule[] = [];
    if (Array.isArray(record.payment_schedule) && record.payment_schedule.length > 0) {
      paymentSchedule = record.payment_schedule.map((p: any, idx: number) => ({
        id: String(idx + 1),
        paymentTerm: p.payment_term || '',
        description: p.description || '',
        dueDate: unwrapDate(p.due_date),
        invoicePortion: p.invoice_portion || 0,
        paymentAmount: p.payment_amount || 0,
      }));
    } else if (cached?.paymentSchedule && cached.paymentSchedule.length > 0) {
      paymentSchedule = cached.paymentSchedule;
    } else if (record.payment_terms_template) {
      paymentSchedule = [{
        id: '1',
        paymentTerm: record.payment_terms_template,
        description: '',
        dueDate: unwrapDate(record.valid_till),
        invoicePortion: 100,
        paymentAmount: record.grand_total ?? record.total ?? 0,
      }];
    }

    setFormData((prev) => ({
      ...prev,
      namingSeries: record.naming_series || prev.namingSeries,
      quotationTo: record.quotation_to || prev.quotationTo,
      customer: record.party_name || prev.customer,
      partyName: record.customer_name || prev.partyName,
      date: unwrapDate(record.transaction_date) || prev.date,
      validTill: unwrapDate(record.valid_till) || prev.validTill,
      orderType: record.order_type || prev.orderType,
      company: record.company || prev.company,
      status: record.status || prev.status,
      currency: record.currency || prev.currency,
      priceList: record.selling_price_list || prev.priceList,
      taxCategory: record.tax_category || prev.taxCategory,
      taxesAndCharges: record.taxes_and_charges || prev.taxesAndCharges,
      shippingRule: record.shipping_rule || prev.shippingRule,
      incoterm: record.incoterm || prev.incoterm,
      customerAddress: record.address_display || record.customer_address || prev.customerAddress,
      placeOfSupply: record.territory || prev.placeOfSupply,
      contactPerson: record.contact_display || record.contact_person || prev.contactPerson,
      shippingAddress: record.shipping_address || prev.shippingAddress,
      companyAddress: record.company_address_display || record.company_address || prev.companyAddress,
      paymentTermsTemplate: record.payment_terms_template || prev.paymentTermsTemplate,
      tcName: record.tc_name || prev.tcName,
      termDetails: record.terms || prev.termDetails,
      items,
      taxes,
      paymentSchedule,
    }));
  };

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.customer.trim())
      allErrors.push({ field: 'customer', label: 'Customer', message: 'Customer is required', tabIndex: 0 });
    if (!formData.partyName.trim())
      allErrors.push({ field: 'partyName', label: 'Party Name', message: 'Party Name is required', tabIndex: 0 });
    if (!formData.date)
      allErrors.push({ field: 'date', label: 'Date', message: 'Date is required', tabIndex: 0 });
    if (!formData.validTill)
      allErrors.push({ field: 'validTill', label: 'Valid Till', message: 'Valid till date is required', tabIndex: 0 });

    let hasValidItem = false;
    formData.items.forEach((item, index) => {
      if (item.itemCode || item.itemName) {
        hasValidItem = true;
        if (!item.itemCode) {
          allErrors.push({ field: `item_${index}_code`, label: `Item ${index + 1} Code`, message: 'Item code required', tabIndex: 1 });
        }
        if (item.quantity <= 0) {
          allErrors.push({ field: `item_${index}_quantity`, label: `Item ${index + 1} Quantity`, message: 'Quantity must be > 0', tabIndex: 1 });
        }
        if (item.rate <= 0) {
          allErrors.push({ field: `item_${index}_rate`, label: `Item ${index + 1} Rate`, message: 'Rate must be > 0', tabIndex: 1 });
        }
      }
    });
    if (!hasValidItem) {
      allErrors.push({ field: 'items', label: 'Items', message: 'At least one item is required', tabIndex: 1 });
    }

    return allErrors;
  };

  const getTabErrorCount = (tabId: number): number => {
    return getAllValidationErrors().filter((e) => e.tabIndex === tabId).length;
  };

  const jumpToTab = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setShowValidationSummary(false);
    setErrors({});
  };

  const handleTabChange = (tabId: number) => {
    setActiveTab(tabId);
    setErrors({});
    setShowValidationSummary(false);
  };

  const handleNext = () => {
    const nextTab = activeTab + 1;
    if (nextTab <= 3) {
      setActiveTab(nextTab);
      setErrors({});
      setShowValidationSummary(false);
    }
  };

  const handlePrevious = () => {
    setActiveTab(activeTab - 1);
    setErrors({});
    setShowValidationSummary(false);
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
      inputRefs.current['partyName']?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.currency, formData.taxes]);

  const calculateTotals = () => {
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const baseTotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const netTotal = baseTotal;

    const taxTotal = formData.taxes.reduce((sum, tax) => sum + tax.amount, 0);
    const totalTaxesAndCharges = taxTotal;

    const grandTotal = netTotal + totalTaxesAndCharges;
    const roundingAdjustment = 0;
    const roundedTotal = Math.round(grandTotal);

    setFormData(prev => ({
      ...prev,
      totalQuantity: totalQty,
      baseTotal,
      baseNetTotal: baseTotal,
      total: grandTotal,
      netTotal,
      baseTotalTaxesAndCharges: totalTaxesAndCharges,
      totalTaxesAndCharges: totalTaxesAndCharges,
      baseGrandTotal: grandTotal,
      grandTotal,
      roundingAdjustment,
      roundedTotal,
      baseRoundedTotal: roundedTotal
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
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number, field: keyof QuotationItem) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const fields: (keyof QuotationItem)[] = ['itemCode', 'itemName', 'quantity', 'rate'];
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
        { id: newId, itemCode: '', itemName: '', quantity: 1, rate: 0, amount: 0 }
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

  const addTaxRow = () => {
    const newId = String(formData.taxes.length + 1);
    setFormData(prev => ({
      ...prev,
      taxes: [
        ...prev.taxes,
        { id: newId, type: 'Tax', accountHead: '', taxRate: 0, netAmount: 0, amount: 0, total: 0 }
      ]
    }));
  };

  const removeTaxRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      taxes: prev.taxes.filter((_, i) => i !== index)
    }));
  };

  const handleTaxChange = (index: number, field: keyof TaxRow, value: string | number) => {
    const updatedTaxes = [...formData.taxes];
    updatedTaxes[index] = {
      ...updatedTaxes[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      taxes: updatedTaxes
    }));
  };

  const addPaymentSchedule = () => {
    const newId = String(formData.paymentSchedule.length + 1);
    setFormData(prev => ({
      ...prev,
      paymentSchedule: [
        ...prev.paymentSchedule,
        { id: newId, paymentTerm: '', description: '', dueDate: '', invoicePortion: 0, paymentAmount: 0 }
      ]
    }));
  };

  const removePaymentSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      paymentSchedule: prev.paymentSchedule.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      return false;
    }
    return true;
  };

  // ─── build API payload — matches POST/PUT /quotation shape ──────────

  const generateQuotationName = (): string => {
    const year = new Date().getFullYear();
    const seriesPrefix = formData.namingSeries
      .replace(/\.YYYY\.-?/gi, `${year}-`)
      .replace(/\.YY\.-?/gi, `${String(year).slice(-2)}-`)
      .replace(/\.#+/g, '');
    const suffix = Date.now().toString(36).toUpperCase().slice(-6);
    return `${seriesPrefix}${suffix}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return date.split("T")[0];
  };

  const buildApiPayload = () => {
    const payload: any = {
      name: isEditMode && recordName ? recordName : generateQuotationName(),
      naming_series: formData.namingSeries,
      quotation_to: formData.quotationTo,
      party_name: formData.customer,
      customer_name: formData.partyName,
      transaction_date: formatDate(formData.date),
      valid_till: formatDate(formData.validTill),
      order_type: formData.orderType,
      company: formData.company,
      currency: formData.currency,
      conversion_rate: 1,
      selling_price_list: formData.priceList,
      price_list_currency: formData.currency,
      plc_conversion_rate: 1,
      ignore_pricing_rule: 0,
      scan_barcode: '',
      has_unit_price_items: 0,
      total_qty: formData.totalQuantity,
      total_net_weight: 0,
      base_total: formData.baseTotal,
      base_net_total: formData.baseNetTotal,
      total: formData.total,
      net_total: formData.netTotal,
      tax_category: formData.taxCategory,
      taxes_and_charges: formData.taxesAndCharges,
      shipping_rule: formData.shippingRule,
      incoterm: formData.incoterm,
      named_place: '',
      base_total_taxes_and_charges: formData.baseTotalTaxesAndCharges,
      total_taxes_and_charges: formData.totalTaxesAndCharges,
      base_grand_total: formData.baseGrandTotal,
      grand_total: formData.grandTotal,
      base_rounding_adjustment: formData.baseRoundingAdjustment,
      rounding_adjustment: formData.roundingAdjustment,
      base_rounded_total: formData.baseRoundedTotal,
      rounded_total: formData.roundedTotal,
      disable_rounded_total: 0,
      base_in_words: `${formData.currency} ${formData.roundedTotal} Only`,
      in_words: `${formData.currency} ${formData.roundedTotal} Only`,
      apply_discount_on: 'Grand Total',
      base_discount_amount: 0,
      discount_amount: 0,
      additional_discount_percentage: 0,
      coupon_code: '',
      customer_address: formData.customerAddress,
      address_display: formData.customerAddress,
      contact_person: formData.contactPerson,
      contact_display: formData.contactPerson,
      contact_mobile: '',
      contact_email: '',
      shipping_address_name: formData.shippingAddress,
      shipping_address: formData.shippingAddress,
      company_address: formData.companyAddress,
      company_address_display: formData.companyAddress,
      company_contact_person: '',
      payment_terms_template: formData.paymentTermsTemplate,
      tc_name: formData.tcName,
      terms: formData.termDetails,
      auto_repeat: null,
      letter_head: 'Standard',
      group_same_items: 0,
      select_print_heading: '',
      language: 'en',
      order_lost_reason: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      status: formData.status,
      customer_group: 'Commercial',
      territory: formData.placeOfSupply || 'India',
      title: `Quotation for ${formData.partyName}`,
      opportunity: '',
      enq_det: '',
      supplier_quotation: '',
      amended_from: null,
      referral_sales_partner: '',
      other_charges_calculation: '',
      items: formData.items
        .filter((item) => item.itemCode || item.itemName)
        .map((item) => ({
          item_code: item.itemCode,
          item_name: item.itemName,
          qty: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
      taxes: formData.taxes.map((tax) => ({
        charge_type: tax.type,
        account_head: tax.accountHead,
        rate: tax.taxRate,
        tax_amount: tax.amount,
        total: tax.total,
      })),
      payment_schedule: formData.paymentSchedule.map((p) => ({
        payment_term: p.paymentTerm,
        description: p.description,
        due_date: p.dueDate,
        invoice_portion: p.invoicePortion,
        payment_amount: p.paymentAmount,
      })),
    };

    return payload;
  };

  // ─── submit — POST/PUT /quotation ───────────────────────────────────

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
        taxes: formData.taxes,
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

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  const getTabStatus = (tabId: number) => {
    return getTabErrorCount(tabId) > 0 ? 'warning' : 'ok';
  };

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
                  <div key={idx} className="jcf-validation-error-item" onClick={() => jumpToTab(error.tabIndex)}>
                    <div className="jcf-error-header">
                      <FaTimes className="jcf-error-icon" />
                      <strong className="jcf-error-label">{error.label}</strong>
                      <span className="jcf-error-tab">
                        Tab {error.tabIndex + 1}: {tabs[error.tabIndex].name}
                      </span>
                    </div>
                    <div className="jcf-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="jcf-hint-banner">
                <FaInfoCircle className="jcf-hint-icon" />
                Click on any error to jump to that section
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
          {/* Tabs */}
          <div className="jcf-tabs-wrap">
            <div className="jcf-tabs-row">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const tabStatus = getTabStatus(tab.id);
                const errorCount = getTabErrorCount(tab.id);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`jcf-tab-btn ${isActive ? "jcf-tab-btn-active" : ""}`}
                  >
                    <div
                      className={`jcf-tab-circle ${isActive ? "jcf-tab-circle-active" : ""} ${tabStatus === "warning" && !isActive ? "jcf-tab-circle-warning" : ""
                        }`}
                    >
                      {tabStatus === "warning" && !isActive ? <FaExclamationTriangle size={14} /> : tab.id + 1}

                      {errorCount > 0 && !isActive && (
                        <div className="jcf-tab-error-badge">{errorCount}</div>
                      )}
                    </div>

                    <div className="jcf-tab-label-wrap">
                      <div className={`jcf-tab-step ${isActive ? "jcf-tab-step-active" : ""} ${tabStatus === "warning" && !isActive ? "jcf-tab-step-warning" : ""
                        }`}>
                        Step {tab.id + 1}
                      </div>
                      <div className={`jcf-tab-name ${isActive ? "jcf-tab-name-active" : ""}`}>
                        {tab.name}
                      </div>
                    </div>

                    {isActive && <div className="jcf-tab-underline" />}
                  </button>
                );
              })}
            </div>
          </div>

          {getTabErrorCount(activeTab) > 0 && (
            <div className="jcf-tab-warning-banner">
              <FaExclamationTriangle size={12} />
              <span>This tab has incomplete or missing information. Please review before submitting.</span>
            </div>
          )}

          {/* Tab 0 — Details */}
          {activeTab === 0 && (
            <div className="jcf-fade-in">
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">Basic Information</h3>
                  <div className="section-actions">
                    <span className="section-shortcut">Series: {formData.namingSeries}</span>
                  </div>
                </div>
                <div className="form-grid compact-grid">
                  <div className="form-group">
                    <label>Series</label>
                    <select
                      name="namingSeries"
                      value={formData.namingSeries}
                      onChange={handleInputChange}
                      ref={setRef('namingSeries')}
                    >
                      {withOption(['SAL-QTN-.YYYY.-', 'SAL-QTN-.YY.-'], formData.namingSeries).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quotation To</label>
                    <select
                      name="quotationTo"
                      value={formData.quotationTo}
                      onChange={handleInputChange}
                      ref={setRef('quotationTo')}
                    >
                      <option value="">Select...</option>
                      {withOption(['Customer', 'Lead', 'Prospect'], formData.quotationTo).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Customer *</label>
                    <select
                      name="customer"
                      value={formData.customer}
                      onChange={handleInputChange}
                      className={errors.customer ? 'error' : ''}
                      ref={setRef('customer')}
                    >
                      <option value="">Select...</option>
                      {withOption(customerOptions, formData.customer).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.customer && <span className="error-text">{errors.customer}</span>}
                  </div>
                  <div className="form-group">
                    <label>Party Name *</label>
                    <input
                      type="text"
                      name="partyName"
                      value={formData.partyName}
                      onChange={handleInputChange}
                      placeholder="Customer name"
                      className={errors.partyName ? 'error' : ''}
                      ref={setRef('partyName')}
                      onFocus={() => setFocusedField('partyName')}
                      onBlur={() => setFocusedField(null)}
                    />
                    {errors.partyName && <span className="error-text">{errors.partyName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={errors.date ? 'error' : ''}
                      ref={setRef('date')}
                    />
                    {errors.date && <span className="error-text">{errors.date}</span>}
                  </div>
                  <div className="form-group">
                    <label>Valid Till *</label>
                    <input
                      type="date"
                      name="validTill"
                      value={formData.validTill}
                      onChange={handleInputChange}
                      className={errors.validTill ? 'error' : ''}
                      ref={setRef('validTill')}
                    />
                    {errors.validTill && <span className="error-text">{errors.validTill}</span>}
                  </div>
                  <div className="form-group">
                    <label>Order Type</label>
                    <select
                      name="orderType"
                      value={formData.orderType}
                      onChange={handleInputChange}
                      ref={setRef('orderType')}
                    >
                      <option value="">Select...</option>
                      {withOption(['Sales', 'Return', 'Credit Note'], formData.orderType).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <select
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      ref={setRef('company')}
                    >
                      <option value="">Select...</option>
                      {withOption(companies, formData.company).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      ref={setRef('currency')}
                    >
                      {withOption(['INR', 'USD', 'EUR', 'GBP'], formData.currency).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price List</label>
                    <select
                      name="priceList"
                      value={formData.priceList}
                      onChange={handleInputChange}
                      ref={setRef('priceList')}
                    >
                      {withOption(['Standard Selling', 'Wholesale', 'Retail'], formData.priceList).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      ref={setRef('status')}
                    >
                      <option value="">Select...</option>
                      {withOption(statusOptions, formData.status).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1 — Items */}
          {activeTab === 1 && (
            <div className="jcf-fade-in">
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
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>No.</th>
                        <th style={{ minWidth: '140px' }}>Item Code</th>
                        <th style={{ minWidth: '120px' }}>Item Name</th>
                        <th style={{ width: '80px' }}>Quantity</th>
                        <th style={{ width: '100px' }}>Rate</th>
                        <th style={{ width: '120px' }}>Amount</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className={focusedField === `item_${index}` ? 'focused-row' : ''}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                              placeholder="Code"
                              className={errors[`item_${index}_code`] ? 'error' : ''}
                              ref={setItemRef(`item_${index}_itemCode`)}
                              onFocus={() => setFocusedField(`item_${index}`)}
                              onBlur={() => setFocusedField(null)}
                              onKeyDown={(e) => handleItemKeyDown(e, index, 'itemCode')}
                            />
                            {errors[`item_${index}_code`] && <span className="error-text">{errors[`item_${index}_code`]}</span>}
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
                          <td className="amount-cell">
                            {formData.currency} {item.amount.toFixed(2)}
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
                        <td></td>
                        <td className="total-amount">{formData.currency} {formData.baseTotal.toFixed(2)}</td>
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
                    <span>Net Total</span>
                    <strong>{formData.currency} {formData.netTotal.toFixed(2)}</strong>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <strong>{formData.currency} {formData.total.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="keyboard-tips">
                  <span><kbd>Enter</kbd> Next field</span>
                  <span><kbd>Ctrl+Shift+A</kbd> Add item</span>
                  <span><kbd>Ctrl+B</kbd> Scan barcode</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2 — Taxes & Totals */}
          {activeTab === 2 && (
            <div className="jcf-fade-in">
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title"><FaDollarSign size={13} /> Taxes and Totals</h3>
                </div>

                <div className="form-grid compact-grid">
                  <div className="form-group">
                    <label>Tax Category</label>
                    <select
                      name="taxCategory"
                      value={formData.taxCategory}
                      onChange={handleInputChange}
                      ref={setRef('taxCategory')}
                    >
                      <option value="">Select...</option>
                      {withOption(taxCategories, formData.taxCategory).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sales Taxes and Charges Template</label>
                    <select
                      name="taxesAndCharges"
                      value={formData.taxesAndCharges}
                      onChange={handleInputChange}
                      ref={setRef('taxesAndCharges')}
                    >
                      <option value="">Select...</option>
                      {withOption(taxesAndChargesOptions, formData.taxesAndCharges).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Shipping Rule</label>
                    <select
                      name="shippingRule"
                      value={formData.shippingRule}
                      onChange={handleInputChange}
                      ref={setRef('shippingRule')}
                    >
                      <option value="">Select...</option>
                      {withOption(shippingRules, formData.shippingRule).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Incoterm</label>
                    <select
                      name="incoterm"
                      value={formData.incoterm}
                      onChange={handleInputChange}
                      ref={setRef('incoterm')}
                    >
                      <option value="">Select...</option>
                      {withOption(incoterms, formData.incoterm).map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>

                <div className="tax-table-wrapper">
                  <div className="tax-table-header">
                    <span>Sales Taxes and Charges</span>
                    <button type="button" className="add-tax-btn" onClick={addTaxRow}>
                      <FaPlus size={11} /> Add Tax
                    </button>
                  </div>
                  <table className="tax-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>No.</th>
                        <th>Type</th>
                        <th>Account Head</th>
                        <th style={{ width: '100px' }}>Tax Rate %</th>
                        <th style={{ width: '120px' }}>Net Amount</th>
                        <th style={{ width: '120px' }}>Amount</th>
                        <th style={{ width: '120px' }}>Total</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.taxes.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="empty-tax-row">No rows</td>
                        </tr>
                      ) : (
                        formData.taxes.map((tax, index) => (
                          <tr key={tax.id}>
                            <td className="text-center">{index + 1}</td>
                            <td>
                              <select
                                value={tax.type}
                                onChange={(e) => handleTaxChange(index, 'type', e.target.value)}
                              >
                                {withOption(taxTypes, tax.type).map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </td>
                            <td>
                              <select
                                value={tax.accountHead}
                                onChange={(e) => handleTaxChange(index, 'accountHead', e.target.value)}
                              >
                                <option value="">Select...</option>
                                {withOption(accountHeads, tax.accountHead).map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={tax.taxRate}
                                onChange={(e) => handleTaxChange(index, 'taxRate', Number(e.target.value))}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td>{formData.currency} {tax.netAmount.toFixed(2)}</td>
                            <td>{formData.currency} {tax.amount.toFixed(2)}</td>
                            <td>{formData.currency} {tax.total.toFixed(2)}</td>
                            <td>
                              <button
                                type="button"
                                className="remove-tax-btn"
                                onClick={() => removeTaxRow(index)}
                              >
                                <FaTrash size={10} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="total-label">Total Taxes and Charges</td>
                        <td className="total-amount">{formData.currency} {formData.totalTaxesAndCharges.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="totals-grid" style={{ marginTop: '16px' }}>
                  <div className="totals-left">
                    <div className="total-row">
                      <span>Grand Total</span>
                      <span className="total-amount">{formData.currency} {formData.grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="total-row">
                      <span>Rounding Adjustment</span>
                      <span>{formData.currency} {formData.roundingAdjustment.toFixed(2)}</span>
                    </div>
                    <div className="total-row highlighted">
                      <span>Rounded Total</span>
                      <span className="rounded-total">{formData.currency} {formData.roundedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3 — Payment & Terms */}
          {activeTab === 3 && (
            <div className="jcf-fade-in">
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title"><FaAddressCard size={13} /> Addresses</h3>
                </div>
                <div className="form-grid compact-grid">
                  <div className="form-group">
                    <label>Billing Address</label>
                    <select
                      name="customerAddress"
                      value={formData.customerAddress}
                      onChange={handleInputChange}
                      ref={setRef('customerAddress')}
                    >
                      <option value="">Select...</option>
                      {withOption(customerAddresses, formData.customerAddress).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Place of Supply</label>
                    <select
                      name="placeOfSupply"
                      value={formData.placeOfSupply}
                      onChange={handleInputChange}
                      ref={setRef('placeOfSupply')}
                    >
                      <option value="">Select...</option>
                      {withOption(placeOfSupplyOptions, formData.placeOfSupply).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <select
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      ref={setRef('contactPerson')}
                    >
                      <option value="">Select...</option>
                      {withOption(contactPersons, formData.contactPerson).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Shipping Address</label>
                    <select
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      ref={setRef('shippingAddress')}
                    >
                      <option value="">Select...</option>
                      {withOption(shippingAddresses, formData.shippingAddress).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group half-width">
                    <label>Company Address</label>
                    <select
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      ref={setRef('companyAddress')}
                    >
                      <option value="">Select...</option>
                      {withOption(companyAddresses, formData.companyAddress).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title"><FaCreditCard size={13} /> Payment Terms</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Payment Terms Template</label>
                    <select
                      name="paymentTermsTemplate"
                      value={formData.paymentTermsTemplate}
                      onChange={handleInputChange}
                      ref={setRef('paymentTermsTemplate')}
                    >
                      {withOption(paymentTerms, formData.paymentTermsTemplate).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="payment-schedule-wrapper">
                  <div className="payment-schedule-header">
                    <span>Payment Schedule</span>
                    <button type="button" className="add-payment-btn" onClick={addPaymentSchedule}>
                      <FaPlus size={11} /> Add Schedule
                    </button>
                  </div>
                  <table className="payment-schedule-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>No.</th>
                        <th>Payment Term</th>
                        <th>Description</th>
                        <th style={{ width: '130px' }}>Due Date</th>
                        <th style={{ width: '100px' }}>Invoice Portion %</th>
                        <th style={{ width: '130px' }}>Payment Amount</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.paymentSchedule.map((schedule, index) => (
                        <tr key={schedule.id}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <select
                              value={schedule.paymentTerm}
                              onChange={(e) => {
                                const updated = [...formData.paymentSchedule];
                                updated[index].paymentTerm = e.target.value;
                                setFormData(prev => ({ ...prev, paymentSchedule: updated }));
                              }}
                            >
                              <option value="">Select...</option>
                              {withOption(paymentTerms, schedule.paymentTerm).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={schedule.description}
                              onChange={(e) => {
                                const updated = [...formData.paymentSchedule];
                                updated[index].description = e.target.value;
                                setFormData(prev => ({ ...prev, paymentSchedule: updated }));
                              }}
                              placeholder="Description"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={schedule.dueDate}
                              onChange={(e) => {
                                const updated = [...formData.paymentSchedule];
                                updated[index].dueDate = e.target.value;
                                setFormData(prev => ({ ...prev, paymentSchedule: updated }));
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={schedule.invoicePortion}
                              onChange={(e) => {
                                const updated = [...formData.paymentSchedule];
                                updated[index].invoicePortion = Number(e.target.value);
                                updated[index].paymentAmount = (formData.grandTotal * Number(e.target.value)) / 100;
                                setFormData(prev => ({ ...prev, paymentSchedule: updated }));
                              }}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </td>
                          <td className="amount-cell">
                            {formData.currency} {schedule.paymentAmount.toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="remove-payment-btn"
                              onClick={() => removePaymentSchedule(index)}
                            >
                              <FaTrash size={10} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title"><FaFileAlt size={13} /> Terms and Conditions</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Terms</label>
                    <select
                      name="tcName"
                      value={formData.tcName}
                      onChange={handleInputChange}
                      ref={setRef('tcName')}
                    >
                      <option value="">Select...</option>
                      {withOption(termsList, formData.tcName).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
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
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <div className="action-left">
            {activeTab > 0 && (
              <button type="button" className="btn-secondary" onClick={handlePrevious}>
                ← Previous
              </button>
            )}
          </div>
          <div className="action-right">
            {activeTab < 3 && (
              <button type="button" className="submit-btn" onClick={handleNext}>
                Next →
              </button>
            )}
            {activeTab === 3 && (
              <>
                <button type="button" className="btn-secondary" onClick={() => toast('Converting to Sales Order...')}>
                  <FaCopy size={12} /> Convert to Sales Order
                </button>
                <button type="submit" className="submit-btn" disabled={saving}>
                  {saving && <FaSpinner className="spinning" />}
                  <FaSave /> {isEditMode ? 'Update Quotation' : 'Create Quotation'}
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}