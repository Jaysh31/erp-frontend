import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEye, FaTrash, FaFilePdf, FaPrint,
  FaFilter,
  FaChartLine, FaTimes, FaSpinner, FaBoxOpen, FaEnvelope,
  FaCalendarAlt,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './ProformaInvoice.css';
import api from '../../services/api';

interface SalesOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  hsnCode?: string;
  stockUom?: string;
  quantity: number;
  rate: number;
  amount: number;
  cgst?: number;
  sgst?: number;
}

export interface SalesOrder {
  id: string;
  salesOrderNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerGstin?: string;
  customerState?: string;
  customerStateCode?: string;
  date: string;
  deliveryDate: string;
  totalAmount: number;
  status: 'Draft' | 'Confirmed' | 'On Hold' | 'Completed' | 'Cancelled' | 'Closed';
  orderType: string;
  isSubcontracted: boolean;
  currency: string;
  items: SalesOrderItem[];
  notes: string;
  termsConditions: string;
  namingSeries?: string;
  paymentTermsTemplate?: string;
  deliveryNote?: string;
  referenceNo?: string;
  referenceDate?: string;
  buyersOrderNo?: string;
  buyersOrderDate?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  destination?: string;
}

interface SalesOrderApiRecord {
  name: string;
  id?: string | number;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  delivery_date?: string;
  order_type?: string;
  is_subcontracted?: number | boolean;
  grand_total?: number;
  total?: number;
  status?: string;
  currency?: string;
  contact_email?: string;
  contact_mobile?: string;
  address_display?: string;
  customer_address?: string;
  customer_gstin?: string;
  gstin?: string;
  customer_state?: string;
  tax_type?: string;
  state?: string;
  state_code?: string;
  terms?: string;
  notes?: string;
  payment_terms_template?: string;
  delivery_note?: string;
  reference_no?: string;
  reference_date?: string;
  po_no?: string;
  po_date?: string;
  dispatch_document_no?: string;
  lr_date?: string;
  dispatched_through?: string;
  destination?: string;
  items?: Array<{
    item_code?: string;
    item_name?: string;
    hsn_code?: string;
    gst_hsn_code?: string;
    stock_uom?: string;
    qty?: number;
    rate?: number;
    amount?: number;
    cgst_rate?: number;
    sgst_rate?: number;
  }>;
}

interface Company {
  id: number;
  company_name: string;
  abbr: string;
  default_currency: string;
  country: string;
  tax_id?: string;
  email?: string;
  phone_no?: string;
  website?: string;
  bank_details?: BankDetail[];
}

interface BankDetail {
  id: number;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  account_type: string;
  currency: string;
  is_primary: number;
}

const companyDetails = {
  name: 'Sculptor Tech Pvt Ltd',
  address: 'c-1006, gc, Pune, Maharashtra 411028, India',
  website: 'sculptortechpvtltd@gmail.com',
  email: 'jayeshwakle@sculptortechpvtltd.com',
  contact: '8668584275',
};

const companyPrintDetails = {
  gstin: '',
  stateName: 'Maharashtra',
  stateCode: '27',
  panNo: '',
  bankName: '',
  bankAccountNo: '',
  bankBranchIfsc: '',
  jurisdiction: 'PUNE',
};

const generateFallbackOrderNumber = (index: number): string => {
  const year = new Date().getFullYear();
  return `PI-${year}-${String(index + 1).padStart(5, '0')}`;
};

/* ─────────────────────── Amount-in-words helper ─────────────────────── */

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigitWords = (n: number): string => {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
};

const threeDigitWords = (n: number): string => {
  if (n >= 100) {
    return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigitWords(n % 100) : '');
  }
  return twoDigitWords(n);
};

const numberToIndianWords = (value: number): string => {
  let num = Math.round(Math.abs(value));
  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;

  let out = '';
  if (crore) out += threeDigitWords(crore) + ' Crore ';
  if (lakh) out += threeDigitWords(lakh) + ' Lakh ';
  if (thousand) out += threeDigitWords(thousand) + ' Thousand ';
  if (hundred) out += threeDigitWords(hundred);

  return out.trim();
};

const formatPrintDate = (date: string, formatFn?: (date: string) => string): string => {
  if (!date) return '';
  if (formatFn) {
    return formatFn(date);
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const escapeHtml = (val: unknown): string => {
  const s = val === null || val === undefined ? '' : String(val);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const SALES_ORDER_LINE_CACHE_PREFIX = 'sales_order_line_data:';

interface CachedSalesOrderLineData {
  items?: SalesOrderItem[];
  paymentSchedule?: any[];
}

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

const mapApiItemsToSalesOrderItems = (record: SalesOrderApiRecord | null | undefined): SalesOrderItem[] => {
  if (!record || !Array.isArray(record.items)) return [];
  return record.items.map((it, idx) => {
    const quantity = it.qty ?? 0;
    const rate = it.rate ?? 0;
    return {
      id: String(idx + 1),
      itemCode: it.item_code || '',
      itemName: it.item_name || '',
      hsnCode: it.hsn_code || it.gst_hsn_code || '',
      stockUom: it.stock_uom || 'Nos',
      quantity,
      rate,
      amount: it.amount ?? quantity * rate,
      cgst: it.cgst_rate ?? 0,
      sgst: it.sgst_rate ?? 0,
    };
  });
};

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function ProformaInvoice() {
  const navigate = useNavigate();

  const { theme, formatDate, getApiDateFormat } = useAdminTheme();

  const [filterText, setFilterText] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printLoadingId, setPrintLoadingId] = useState<string | null>(null);

  // Date range filter states
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [tempFromDate, setTempFromDate] = useState<string>('');
  const [tempToDate, setTempToDate] = useState<string>('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>('');

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfModalLoading] = useState(false);

  // Debounced search term
  const debouncedFilterText = useDebounce(filterText, 500);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  const toApiDateFormat = (date: Date) => {
    return getApiDateFormat(date);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const datePickerContainer = document.querySelector('.pq-date-picker-container');
      if (datePickerContainer && !datePickerContainer.contains(target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    return formatDate(dateStr);
  };

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const getFirstDayOfMonth = (): string => {
    const date = new Date(currentYear, currentMonth, 1);
    return date.toISOString().split('T')[0];
  };

  const getLastDayOfMonth = (): string => {
    const date = new Date(currentYear, currentMonth + 1, 0);
    return date.toISOString().split('T')[0];
  };

  const applyQuickFilter = (filter: string) => {
    setSelectedQuickFilter(filter);
    let start = '';
    let end = getTodayDate();

    switch (filter) {
      case 'today':
        start = getTodayDate();
        break;
      case 'last7':
        start = getDateDaysAgo(7);
        break;
      case 'last30':
        start = getDateDaysAgo(30);
        break;
      case 'thisMonth':
        start = getFirstDayOfMonth();
        end = getLastDayOfMonth();
        break;
      default:
        return;
    }

    setTempFromDate(start);
    setTempToDate(end);
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/company');
      if (response.data.success === 1) {
        setCompanies(response.data.data || []);
        const chandratara = response.data.data?.find((c: Company) => 
          c.company_name.includes('ChandraTara') || c.abbr === 'CT_IND'
        );
        if (chandratara) {
          setSelectedCompanyId(chandratara.id);
          if (chandratara.bank_details && chandratara.bank_details.length > 0) {
            setSelectedBankId(chandratara.bank_details[0].id);
          }
        } else if (response.data.data && response.data.data.length > 0) {
          setSelectedCompanyId(response.data.data[0].id);
          const firstCompany = response.data.data[0];
          if (firstCompany.bank_details && firstCompany.bank_details.length > 0) {
            setSelectedBankId(firstCompany.bank_details[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchSalesOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));
      
      if (debouncedFilterText.trim()) {
        params.append('search', debouncedFilterText.trim());
        params.append('search_by', 'all');
      }

      if (selectedOrderType !== 'All') {
        params.append('order_type', selectedOrderType);
      }

      if (fromDate) {
        params.append('from_date', fromDate);
      }
      if (toDate) {
        params.append('to_date', toDate);
      }

      const url = `/sales-order${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('API Call URL:', url);
      
      const response = await api.get(url);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to fetch sales orders');
      }

      const raw = response.data.data;
      let all: SalesOrderApiRecord[] =
        raw?.records ??
        (Array.isArray(raw) ? raw : raw?.data) ??
        [];

      if (!Array.isArray(all)) {
        console.warn('Unexpected /sales-order response shape, defaulting to empty list:', raw);
        all = [];
      }

      // Get total from API response
      const total = raw?.total ?? raw?.records?.length ?? all.length;
      setTotalRecords(total);

      const transformedData: SalesOrder[] = all.map((o, idx) => {
        const resolvedId =
          o.id !== undefined && o.id !== null && String(o.id).trim() !== ''
            ? String(o.id)
            : (o.name || '');

        return {
          id: resolvedId,
          salesOrderNumber: o.name || generateFallbackOrderNumber(idx),
          customer: o.party_name || '',
          customerName: o.customer_name || '',
          customerEmail: o.contact_email || '',
          customerPhone: o.contact_mobile || '',
          customerAddress: o.address_display || o.customer_address || '',
          customerGstin: o.customer_gstin || o.gstin || '',
          customerState: o.customer_state || o.state || '',
          customerStateCode: o.state_code || '',
          date: o.transaction_date || '',
          deliveryDate: o.delivery_date || '',
          totalAmount: o.grand_total ?? o.total ?? 0,
          status: (o.status as SalesOrder['status']) || 'Draft',
          orderType: o.order_type || 'Sales',
          isSubcontracted: Boolean(o.is_subcontracted),
          currency: o.currency || 'INR',
          notes: o.notes || '',
          termsConditions: o.terms || '',
          paymentTermsTemplate: o.payment_terms_template || '',
          deliveryNote: o.delivery_note || '',
          referenceNo: o.reference_no || '',
          referenceDate: o.reference_date || '',
          buyersOrderNo: o.po_no || '',
          buyersOrderDate: o.po_date || '',
          dispatchDocNo: o.dispatch_document_no || '',
          deliveryNoteDate: o.lr_date || '',
          dispatchedThrough: o.dispatched_through || '',
          destination: o.destination || '',
          items: mapApiItemsToSalesOrderItems(o),
        };
      });

      setSalesOrders(transformedData);
    } catch (err: any) {
      console.error('Error fetching sales orders:', err);
      setError(err.response?.data?.message || 'An error occurred while loading sales orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch when filters or pagination changes
  useEffect(() => {
    fetchSalesOrders();
  }, [debouncedFilterText, selectedOrderType, fromDate, toDate, currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, selectedOrderType, fromDate, toDate]);

  const fetchFullSalesOrderRecord = async (orderId: string): Promise<SalesOrderApiRecord | null> => {
    try {
      const response = await api.get(`/sales-order/${orderId}`);
      if (response.data && response.data.success !== 0) {
        const data = response.data.success === 1 ? response.data.data : response.data;
        const record = Array.isArray(data) ? data[0] : (data?.record ?? data);
        if (record && (record.name || record.id)) {
          return record as SalesOrderApiRecord;
        }
      }
    } catch (err) {
      console.warn('Direct /sales-order/:id fetch failed, falling back to list scan:', err);
    }

    try {
      const response = await api.get('/sales-order');
      const records = extractRecords(response.data);
      const found = records.find(
        (r: any) => r && (r.name === orderId || String(r.id) === String(orderId))
      );
      return (found as SalesOrderApiRecord) || null;
    } catch (err) {
      console.error('Error fetching sales order detail:', err);
      return null;
    }
  };

  const enrichItemsFromCatalog = async (items: SalesOrderItem[]): Promise<SalesOrderItem[]> => {
    return Promise.all(items.map(async (item) => {
      const needsLookup = !item.itemName || !item.rate;
      if (!needsLookup || !item.itemCode) return item;

      try {
        const response = await api.get(`/item?page=1&limit=5&search=${encodeURIComponent(item.itemCode)}`);
        const records = extractRecords(response.data);
        const match =
          records.find((r: any) => (r.item_code || r.name) === item.itemCode) || records[0];
        if (!match) return item;

        return {
          ...item,
          itemName: item.itemName || match.item_name || '',
          hsnCode: item.hsnCode || match.hsn_code || match.gst_hsn_code || '',
          stockUom: item.stockUom || match.stock_uom || match.uom || 'Nos',
          rate: item.rate || Number(match.standard_rate ?? match.rate ?? 0) || 0,
          cgst: item.cgst || Number(match.cgst_rate ?? match.cgst ?? 0) || 0,
          sgst: item.sgst || Number(match.sgst_rate ?? match.sgst ?? 0) || 0,
        };
      } catch (err) {
        console.error('Item catalog lookup failed for', item.itemCode, err);
        return item;
      }
    }));
  };

  const buildPrintableOrder = async (order: SalesOrder): Promise<SalesOrder> => {
    let items: SalesOrderItem[] = [];
    let latestTotal: number | undefined;

    try {
      const detail = await fetchFullSalesOrderRecord(order.id);
      items = mapApiItemsToSalesOrderItems(detail);
      latestTotal = detail?.grand_total ?? detail?.total ?? undefined;
    } catch (err) {
      console.error('Error fetching full sales order record for print:', err);
    }

    if (items.length === 0) {
      const cached = readCachedSalesOrderLineData(order.salesOrderNumber);
      if (cached?.items && cached.items.length > 0) {
        items = cached.items;
      }
    }

    if (items.length === 0 && order.items && order.items.length > 0) {
      items = order.items;
    }

    try {
      items = await enrichItemsFromCatalog(items);
    } catch (err) {
      console.error('Item catalog enrichment failed:', err);
    }

    return {
      ...order,
      items,
      totalAmount: latestTotal ?? order.totalAmount,
    };
  };

  const totalAmount = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedAmount = salesOrders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.totalAmount, 0);
  const fulfillmentRate = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;

  const handleView = (order: SalesOrder) => {
    if (!order.id) {
      toast.error('Unable to open this proforma — missing ID');
      return;
    }
    navigate(`/proforma-invoice/${order.id}`, { state: { proforma: order, readOnly: true } });
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;
    if (!selectedOrder.id) {
      toast.error('Cannot delete — missing order ID');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/sales-order/${selectedOrder.id}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to delete proforma');
      }
      setShowDeleteModal(false);
      setSelectedOrder(null);
      toast.success('Proforma invoice deleted successfully!');
      fetchSalesOrders();
    } catch (err: any) {
      console.error('Error deleting proforma:', err);
      toast.error(err.response?.data?.message || 'Failed to delete proforma');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCompanyDetails = () => companyDetails;

  const clearFilters = () => {
    setFilterText('');
    setSelectedOrderType('All');
    setFromDate('');
    setToDate('');
    setTempFromDate('');
    setTempToDate('');
    setSelectedQuickFilter('');
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  // Date picker handlers
  const openDatePicker = () => {
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setShowDatePicker(true);
  };

  const applyDateFilter = () => {
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setShowDatePicker(false);
    if (tempFromDate || tempToDate) {
      toast.success('Date range applied');
    }
  };

  const clearDateFilters = () => {
    setTempFromDate('');
    setTempToDate('');
    setSelectedQuickFilter('');
    setFromDate('');
    setToDate('');
    setShowDatePicker(false);
  };

  // Pagination functions
  const totalFiltered = totalRecords;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalFiltered);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Calendar functions
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonthIndex = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = (): (number | null)[] => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonthIndex(currentYear, currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateInRange = (day: number): boolean => {
    if (!tempFromDate && !tempToDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (tempFromDate && tempToDate) {
      return dateStr >= tempFromDate && dateStr <= tempToDate;
    }
    if (tempFromDate) {
      return dateStr >= tempFromDate;
    }
    if (tempToDate) {
      return dateStr <= tempToDate;
    }
    return false;
  };

  const isDateSelected = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === tempFromDate || dateStr === tempToDate;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!tempFromDate || (tempFromDate && tempToDate)) {
      setTempFromDate(dateStr);
      setTempToDate('');
      setSelectedQuickFilter('');
    } else if (tempFromDate && !tempToDate) {
      if (dateStr < tempFromDate) {
        setTempFromDate(dateStr);
        setTempToDate('');
      } else {
        setTempToDate(dateStr);
        setSelectedQuickFilter('');
      }
    }
  };

  const changeMonth = (delta: number) => {
    const newMonth = currentMonth + delta;
    if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  const getMonthName = (month: number): string => {
    return new Date(currentYear, month).toLocaleString('en-US', { month: 'long' });
  };

  const buildProformaInvoiceHtml = (order: SalesOrder, company?: Company, bank?: BankDetail): string => {
    const validItems = order.items || [];

    const baseTotal = validItems.reduce((sum, it) => sum + (it.amount || 0), 0);
    const cgstAmount = validItems.reduce((sum, it) => sum + ((it.amount || 0) * (it.cgst || 0)) / 100, 0);
    const sgstAmount = validItems.reduce((sum, it) => sum + ((it.amount || 0) * (it.sgst || 0)) / 100, 0);
    const totalQty = validItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const grandTotal = order.totalAmount || (baseTotal + cgstAmount + sgstAmount);

    const companyName = company?.company_name || companyDetails.name;
    const companyAddress = company?.country || companyDetails.address;
    const companyPhone = company?.phone_no || companyDetails.contact;
    const companyEmail = company?.email || companyDetails.email;
    const companyGstin = company?.tax_id || companyPrintDetails.gstin;

    const bankName = bank?.bank_name || companyPrintDetails.bankName || 'HDFC';
    const bankBranch = bank?.branch_name || 'Pune';
    const bankAccount = bank?.account_number || companyPrintDetails.bankAccountNo || '351548887';
    const bankIfsc = bank?.ifsc_code || companyPrintDetails.bankBranchIfsc || 'HDFC0000123';
    const accountHolder = bank?.account_holder_name || 'Chandratara';
    const accountType = bank?.account_type || 'Savings';

    const formatPrintDateLocal = (dateStr: string) => {
      if (!dateStr) return '';
      return formatDisplayDate(dateStr);
    };

    const itemRows = validItems.map((item, idx) => `
      <tr>
        <td class="pq-col-sl">${idx + 1}</td>
        <td class="pq-col-desc">
          ${escapeHtml(item.itemName || item.itemCode || '')}
          ${item.itemCode ? `<div class="pq-item-sub">${escapeHtml(item.itemCode)}</div>` : ''}
        </td>
        <td class="pq-col-hsn">${escapeHtml(item.hsnCode || '')}</td>
        <td class="pq-col-qty">${item.quantity} ${escapeHtml(item.stockUom || 'Nos')}</td>
        <td class="pq-col-rate">${item.rate.toFixed(2)}</td>
        <td class="pq-col-per">${escapeHtml(item.stockUom || 'Nos')}</td>
        <td class="pq-col-cgst">${item.cgst ? item.cgst + '%' : ''}</td>
        <td class="pq-col-sgst">${item.sgst ? item.sgst + '%' : ''}</td>
        <td class="pq-col-amt">${item.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    const cgstRate = validItems.find(it => (it.cgst || 0) > 0)?.cgst || 0;
    const sgstRate = validItems.find(it => (it.sgst || 0) > 0)?.sgst || 0;

    const taxLines: string[] = [];
    if (cgstAmount > 0) {
      taxLines.push(`
        <tr>
          <td colspan="8" class="pq-tax-label">Output CGST ${cgstRate}%</td>
          <td class="pq-col-amt">${cgstAmount.toFixed(2)}</td>
        </tr>
      `);
    }
    if (sgstAmount > 0) {
      taxLines.push(`
        <tr>
          <td colspan="8" class="pq-tax-label">Output SGST ${sgstRate}%</td>
          <td class="pq-col-amt">${sgstAmount.toFixed(2)}</td>
        </tr>
      `);
    }

    const hsnGroups = new Map<string, { taxable: number; cgstRate: number; sgstRate: number; cgstAmt: number; sgstAmt: number }>();
    validItems.forEach((it) => {
      const key = it.hsnCode || '—';
      const taxable = it.amount || 0;
      const itCgstAmt = (taxable * (it.cgst || 0)) / 100;
      const itSgstAmt = (taxable * (it.sgst || 0)) / 100;
      const existing = hsnGroups.get(key);
      if (existing) {
        existing.taxable += taxable;
        existing.cgstAmt += itCgstAmt;
        existing.sgstAmt += itSgstAmt;
      } else {
        hsnGroups.set(key, {
          taxable,
          cgstRate: it.cgst || 0,
          sgstRate: it.sgst || 0,
          cgstAmt: itCgstAmt,
          sgstAmt: itSgstAmt,
        });
      }
    });

    const hasTax = cgstAmount > 0 || sgstAmount > 0;
    const hsnSummaryRows = Array.from(hsnGroups.entries()).map(([hsn, g]) => `
      <tr>
        <td>${escapeHtml(hsn === '—' ? '' : hsn)}</td>
        <td>${g.taxable.toFixed(2)}</td>
        ${cgstAmount > 0 ? `<td>${g.cgstRate ? g.cgstRate + '%' : ''}</td><td>${g.cgstAmt.toFixed(2)}</td>` : ''}
        ${sgstAmount > 0 ? `<td>${g.sgstRate ? g.sgstRate + '%' : ''}</td><td>${g.sgstAmt.toFixed(2)}</td>` : ''}
        <td>${(g.cgstAmt + g.sgstAmt).toFixed(2)}</td>
      </tr>
    `).join('');

    const paymentTerms = order.paymentTermsTemplate || '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>PROFORMA INVOICE - ${escapeHtml(order.salesOrderNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 24px; }
  .pq-outer { border: 1.5px solid #000; }
  .pq-title-row { display: flex; align-items: center; justify-content: center; position: relative; padding: 8px; border-bottom: 1.5px solid #000; background: #f8f9fa; }
  .pq-title { font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #1a1a1a; }
  .pq-title-sub { font-size: 11px; color: #666; margin-top: 2px; text-align: center; }
  .pq-top { display: flex; border-bottom: 1px solid #000; }
  .pq-company-box { flex: 1.3; padding: 8px; border-right: 1px solid #000; }
  .pq-company-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
  .pq-company-box div { margin: 1px 0; }
  .pq-meta-box { flex: 1.1; }
  .pq-meta-row { display: flex; border-bottom: 1px solid #000; }
  .pq-meta-row:last-child { border-bottom: none; }
  .pq-meta-cell { flex: 1; padding: 4px 8px; border-right: 1px solid #000; }
  .pq-meta-cell:last-child { border-right: none; }
  .pq-meta-label { font-size: 10px; color: #444; }
  .pq-meta-value { font-weight: 600; margin-top: 1px; min-height: 13px; }
  .pq-parties { display: flex; border-bottom: 1px solid #000; }
  .pq-party-box { flex: 1; padding: 8px; border-right: 1px solid #000; }
  .pq-party-box:last-child { border-right: none; }
  .pq-party-label { font-weight: bold; margin-bottom: 3px; }
  .pq-party-box div { margin: 1px 0; }
  table.pq-items { width: 100%; border-collapse: collapse; }
  table.pq-items th, table.pq-items td { border-right: 1px solid #000; padding: 5px 6px; }
  table.pq-items th:last-child, table.pq-items td:last-child { border-right: none; }
  table.pq-items thead th { border-bottom: 1px solid #000; border-top: none; font-size: 11px; text-align: left; background: #f8f9fa; }
  .pq-col-sl { width: 26px; text-align: center; }
  .pq-col-desc { min-width: 170px; }
  .pq-item-sub { font-size: 10px; color: #555; }
  .pq-col-hsn { width: 62px; }
  .pq-col-qty { width: 74px; text-align: right; }
  .pq-col-rate { width: 62px; text-align: right; }
  .pq-col-per { width: 42px; }
  .pq-col-cgst { width: 54px; text-align: right; }
  .pq-col-sgst { width: 54px; text-align: right; }
  .pq-col-amt { width: 92px; text-align: right; }
  .pq-tax-label { text-align: right; font-style: italic; padding-right: 10px; }
  .pq-total-row td { border-top: 1px solid #000; font-weight: bold; padding: 6px; background: #f8f9fa; }
  .pq-words { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; justify-content: space-between; align-items: flex-start; }
  .pq-words-label { font-size: 10px; color: #444; }
  .pq-eoe { font-size: 11px; font-style: italic; white-space: nowrap; }
  table.pq-summary { width: 100%; border-collapse: collapse; }
  table.pq-summary th, table.pq-summary td { border: 1px solid #000; padding: 4px 8px; font-size: 11px; text-align: right; }
  table.pq-summary th:first-child, table.pq-summary td:first-child { text-align: left; }
  table.pq-summary th { background: #f8f9fa; }
  .pq-tax-words { border-top: 1px solid #000; padding: 6px 8px; }
  .pq-bottom { display: flex; border-top: 1px solid #000; }
  .pq-pan-decl-box { flex: 1; padding: 8px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
  .pq-bank-sign-box { flex: 1; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
  .pq-signatory { text-align: right; margin-top: 24px; font-size: 11px; }
  .pq-footer { text-align: center; padding: 8px; font-size: 10px; color: #444; border-top: 1px solid #000; }
  .pq-footer div:first-child { font-weight: 600; letter-spacing: 0.5px; margin-bottom: 2px; }
  .pq-proforma-note { background: #fff3cd; padding: 6px 10px; border-bottom: 1px solid #000; font-size: 11px; color: #856404; text-align: center; }
  @media print {
    body { padding: 0; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="pq-outer">

    <div class="pq-title-row">
      <div>
        <div class="pq-title">PROFORMA INVOICE</div>
        <div class="pq-title-sub">(This is not a tax invoice)</div>
      </div>
    </div>

    <div class="pq-proforma-note">
      ⚠️ This is a proforma invoice for quotation/estimation purposes only. Final tax invoice will be issued upon order confirmation.
    </div>

    <div class="pq-top">
      <div class="pq-company-box">
        <div class="pq-company-name">${escapeHtml(companyName)}</div>
        <div>${escapeHtml(companyAddress)}</div>
        <div>Phone: ${escapeHtml(companyPhone)}</div>
        ${companyEmail ? `<div>Email: ${escapeHtml(companyEmail)}</div>` : ''}
        ${companyGstin ? `<div>GSTIN/UIN: ${escapeHtml(companyGstin)}</div>` : ''}
        <div>State Name : ${escapeHtml(companyPrintDetails.stateName)}, Code : ${escapeHtml(companyPrintDetails.stateCode)}</div>
      </div>
      <div class="pq-meta-box">
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Proforma Invoice No.</div>
            <div class="pq-meta-value">PI-${escapeHtml(order.salesOrderNumber)}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Dated</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDateLocal(order.date))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Sales Order No.</div>
            <div class="pq-meta-value">${escapeHtml(order.salesOrderNumber)}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Valid Until</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDateLocal(order.deliveryDate || ''))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Mode/Terms of Payment</div>
            <div class="pq-meta-value">${escapeHtml(paymentTerms)}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Buyer's Order No.</div>
            <div class="pq-meta-value">${escapeHtml(order.buyersOrderNo || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Dated</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDateLocal(order.buyersOrderDate || ''))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Order Type</div>
            <div class="pq-meta-value">${escapeHtml(order.orderType || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Delivery Date</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDateLocal(order.deliveryDate || ''))}</div>
          </div>
        </div>
        ${order.status ? `
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Status</div>
            <div class="pq-meta-value">${escapeHtml(order.status)}</div>
          </div>
        </div>` : ''}
      </div>
    </div>

    <div class="pq-parties">
      <div class="pq-party-box">
        <div class="pq-party-label">Consignee (Ship to)</div>
        <div><strong>${escapeHtml(order.customerName)}</strong></div>
        ${order.customerAddress ? `<div>${escapeHtml(order.customerAddress)}</div>` : ''}
        ${order.customerGstin ? `<div>GSTIN/UIN : ${escapeHtml(order.customerGstin)}</div>` : ''}
        ${order.customerState ? `<div>State Name : ${escapeHtml(order.customerState)}${order.customerStateCode ? `, Code : ${escapeHtml(order.customerStateCode)}` : ''}</div>` : ''}
      </div>
      <div class="pq-party-box">
        <div class="pq-party-label">Buyer (Bill to)</div>
        <div><strong>${escapeHtml(order.customerName)}</strong></div>
        ${order.customerAddress ? `<div>${escapeHtml(order.customerAddress)}</div>` : ''}
        ${order.customerGstin ? `<div>GSTIN/UIN : ${escapeHtml(order.customerGstin)}</div>` : ''}
        ${order.customerState ? `<div>State Name : ${escapeHtml(order.customerState)}${order.customerStateCode ? `, Code : ${escapeHtml(order.customerStateCode)}` : ''}</div>` : ''}
        ${order.customerEmail ? `<div>Email : ${escapeHtml(order.customerEmail)}</div>` : ''}
        ${order.customerPhone ? `<div>Phone : ${escapeHtml(order.customerPhone)}</div>` : ''}
      </div>
    </div>

    <table class="pq-items">
      <thead>
        <tr>
          <th class="pq-col-sl">Sl</th>
          <th class="pq-col-desc">Description of Goods</th>
          <th class="pq-col-hsn">HSN/SAC</th>
          <th class="pq-col-qty">Quantity</th>
          <th class="pq-col-rate">Rate</th>
          <th class="pq-col-per">per</th>
          <th class="pq-col-cgst">CGST</th>
          <th class="pq-col-sgst">SGST</th>
          <th class="pq-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${taxLines.join('')}
        <tr class="pq-total-row">
          <td colspan="3">Total</td>
          <td class="pq-col-qty">${totalQty} Nos.</td>
          <td colspan="4"></td>
          <td class="pq-col-amt">${grandTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="pq-words">
      <div>
        <div class="pq-words-label">Amount Chargeable (in words)</div>
        <div><strong>${order.currency || 'INR'} ${numberToIndianWords(grandTotal)} Only</strong></div>
      </div>
      <div class="pq-eoe">E.&amp;O.E</div>
    </div>

    ${hasTax ? `
    <table class="pq-summary">
      <thead>
        <tr>
          <th>HSN/SAC</th>
          <th>Taxable Value</th>
          ${cgstAmount > 0 ? `<th>CGST Rate</th><th>CGST Amount</th>` : ''}
          ${sgstAmount > 0 ? `<th>SGST Rate</th><th>SGST Amount</th>` : ''}
          <th>Total Tax Amount</th>
        </tr>
      </thead>
      <tbody>
        ${hsnSummaryRows}
        <tr style="font-weight:600;">
          <td>Total</td>
          <td>${baseTotal.toFixed(2)}</td>
          ${cgstAmount > 0 ? `<td></td><td>${cgstAmount.toFixed(2)}</td>` : ''}
          ${sgstAmount > 0 ? `<td></td><td>${sgstAmount.toFixed(2)}</td>` : ''}
          <td>${(cgstAmount + sgstAmount).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    <div class="pq-tax-words">
      Tax Amount (in words) : <strong>${order.currency || 'INR'} ${numberToIndianWords(cgstAmount + sgstAmount)} Only</strong>
    </div>` : ''}

    <div class="pq-bottom">
      <div class="pq-pan-decl-box">
        <div>
          <strong>Declaration</strong>
          <div>We declare that this proforma invoice shows the estimated price of the goods described and that all particulars are true and correct.</div>
        </div>
        ${companyPrintDetails.panNo ? `<div style="margin-top:8px;">Company's PAN : ${escapeHtml(companyPrintDetails.panNo)}</div>` : ''}
      </div>
      <div class="pq-bank-sign-box">
        <div>
          <div><strong>Company's Bank Details</strong></div>
          ${bankName ? `<div>Bank Name : ${escapeHtml(bankName)}</div>` : ''}
          ${bankBranch ? `<div>Branch : ${escapeHtml(bankBranch)}</div>` : ''}
          ${accountHolder ? `<div>Account Holder : ${escapeHtml(accountHolder)}</div>` : ''}
          ${accountType ? `<div>Account Type : ${escapeHtml(accountType)}</div>` : ''}
          ${bankAccount ? `<div>A/c No. : ${escapeHtml(bankAccount)}</div>` : ''}
          ${bankIfsc ? `<div>IFSC Code : ${escapeHtml(bankIfsc)}</div>` : ''}
        </div>
        <div class="pq-signatory">
          for ${escapeHtml(companyName)}<br /><br /><br />
          Authorised Signatory
        </div>
      </div>
    </div>

    <div class="pq-footer">
      ${companyPrintDetails.jurisdiction ? `<div>SUBJECT TO ${escapeHtml(companyPrintDetails.jurisdiction)} JURISDICTION</div>` : ''}
      <div>This is a computer generated proforma invoice.</div>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
  };

  const handlePrintOrder = async (order: SalesOrder) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print this proforma');
      return;
    }
    printWindow.document.write('<p style="font-family:sans-serif;padding:24px;color:#374151;">Loading proforma invoice…</p>');

    setPrintLoadingId(order.id);
    try {
      const printable = await buildPrintableOrder(order);
      
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      const selectedBank = selectedCompany?.bank_details?.find(b => b.id === selectedBankId);
      
      printWindow.document.open();
      printWindow.document.write(buildProformaInvoiceHtml(printable, selectedCompany, selectedBank));
      printWindow.document.close();
    } catch (err) {
      console.error('Error printing proforma:', err);
      printWindow.document.open();
      printWindow.document.write(buildProformaInvoiceHtml(order));
      printWindow.document.close();
    } finally {
      setPrintLoadingId(null);
    }
  };

  return (
    <div className={`proforma-page ${theme}-theme`}>
      <style>{`
        /* Date Range Picker Styles */
        .pq-date-picker-container {
          position: relative;
          display: inline-block;
        }

        .pq-date-picker-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          min-height: 38px;
        }

        .pq-date-picker-trigger:hover {
          border-color: var(--primary-color, #2563eb);
          background: var(--hover-bg, #f8fafc);
        }

        .pq-date-picker-trigger.active {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .pq-date-picker-trigger .pq-calendar-icon {
          color: var(--primary-color, #2563eb);
          font-size: 16px;
        }

        .pq-date-picker-trigger .pq-date-label {
          font-weight: 500;
        }

        .pq-date-picker-trigger .pq-date-label.placeholder {
          color: var(--text-secondary, #6b7280);
          font-weight: 400;
        }

        .pq-date-picker-trigger .pq-date-range-display {
          color: var(--primary-color, #2563eb);
          font-weight: 500;
        }

        .pq-date-picker-popup {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          box-shadow: 0 10px 40px var(--shadow-color, rgba(0,0,0,0.15));
          padding: 20px;
          z-index: 1000;
          min-width: 340px;
          width: 340px;
        }

        .pq-date-picker-popup .pq-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .pq-date-picker-popup .pq-popup-header .pq-popup-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .pq-date-picker-popup .pq-popup-header .pq-popup-close {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
        }

        .pq-date-picker-popup .pq-popup-header .pq-popup-close:hover {
          color: var(--text-primary, #1e293b);
        }

        .pq-date-picker-popup .pq-quick-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .pq-date-picker-popup .pq-quick-filter-btn {
          padding: 4px 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          background: var(--card-bg, #fff);
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pq-date-picker-popup .pq-quick-filter-btn:hover {
          border-color: var(--primary-color, #2563eb);
          color: var(--primary-color, #2563eb);
        }

        .pq-date-picker-popup .pq-quick-filter-btn.active {
          background: var(--primary-color, #2563eb);
          border-color: var(--primary-color, #2563eb);
          color: #fff;
        }

        .pq-date-picker-popup .pq-calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .pq-date-picker-popup .pq-calendar-header .pq-month-year {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .pq-date-picker-popup .pq-calendar-header .pq-nav-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          padding: 4px 8px;
          font-size: 14px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .pq-date-picker-popup .pq-calendar-header .pq-nav-btn:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .pq-date-picker-popup .pq-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 12px;
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-header {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          padding: 4px 0;
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell {
          text-align: center;
          padding: 6px 4px;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary, #1e293b);
          position: relative;
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell.empty {
          cursor: default;
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell:hover:not(.empty):not(.in-range) {
          background: var(--hover-bg, #f3f4f6);
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell.in-range {
          background: rgba(37, 99, 235, 0.1);
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell.selected {
          background: var(--primary-color, #2563eb);
          color: #fff;
          font-weight: 600;
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell.selected-start {
          background: var(--primary-color, #2563eb);
          color: #fff;
          font-weight: 600;
          border-radius: 6px 0 0 6px;
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell.selected-end {
          background: var(--primary-color, #2563eb);
          color: #fff;
          font-weight: 600;
          border-radius: 0 6px 6px 0;
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell.range-middle {
          background: rgba(37, 99, 235, 0.15);
        }

        .pq-date-picker-popup .pq-calendar-grid .pq-day-cell.today {
          border: 1px solid var(--primary-color, #2563eb);
        }

        .pq-date-picker-popup .pq-popup-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .pq-date-picker-popup .pq-popup-actions button {
          padding: 6px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pq-date-picker-popup .pq-popup-actions .pq-btn-apply {
          background: var(--primary-color, #2563eb);
          color: #fff;
        }

        .pq-date-picker-popup .pq-popup-actions .pq-btn-apply:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .pq-date-picker-popup .pq-popup-actions .pq-btn-clear {
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .pq-date-picker-popup .pq-popup-actions .pq-btn-clear:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .pq-date-picker-popup .pq-popup-actions .pq-btn-cancel {
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .pq-date-picker-popup .pq-popup-actions .pq-btn-cancel:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        /* Filter bar styles */
        .pq-filter-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: var(--card-bg, #fff);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .pq-filter-left {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .pq-filter-right {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .pq-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .pq-search-input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: var(--input-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          min-height: 38px;
        }

        .pq-search-input:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .pq-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
        }

        .pq-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pq-search-clear:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .pq-filter-select {
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: var(--input-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          min-height: 38px;
          cursor: pointer;
        }

        .pq-filter-select:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
        }

        .pq-btn-new {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--primary-color, #2563eb);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 38px;
          white-space: nowrap;
        }

        .pq-btn-new:hover {
          background: var(--primary-hover, #1d4ed8);
          transform: translateY(-1px);
        }

        /* Active filters */
        .pq-active-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--hover-bg, #f8fafc);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          font-size: 13px;
        }

        .pq-clear-filters {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border: none;
          border-radius: 4px;
          background: var(--danger-color, #ef4444);
          color: #fff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pq-clear-filters:hover {
          background: var(--danger-hover, #dc2626);
        }

        /* Table styles */
        .pq-table-wrap {
          overflow-x: auto;
          padding: 0 16px;
        }

        .pq-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .pq-th {
          text-align: left;
          padding: 10px 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          border-bottom: 2px solid var(--border-color, #e5e7eb);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pq-th-meta {
          text-align: center;
        }

        .pq-text-right {
          text-align: right;
        }

        .pq-tr {
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          transition: background 0.2s;
        }

        .pq-tr:hover {
          background: var(--hover-bg, #f8fafc);
        }

        .pq-td {
          padding: 10px 12px;
          color: var(--text-primary, #1e293b);
        }

        .pq-td-id {
          font-weight: 500;
          color: var(--primary-color, #2563eb);
        }

        .pq-td-link {
          font-weight: 500;
          color: var(--primary-color, #2563eb);
          cursor: pointer;
        }

        .pq-td-link:hover {
          text-decoration: underline;
        }

        .pq-amount-cell {
          font-weight: 500;
        }

        .pq-currency {
          font-size: 10px;
          color: var(--text-secondary, #6b7280);
          margin-right: 2px;
        }

        .pq-action-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .pq-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .pq-action-btn:hover {
          background: var(--hover-bg, #f3f4f6);
          color: var(--primary-color, #2563eb);
        }

        .pq-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pq-action-btn.pq-action-print:hover {
          color: #059669;
        }

        .pq-action-btn.pq-action-view:hover {
          color: #2563eb;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Loading, Error, Empty states */
        .pq-loading, .pq-error, .pq-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: var(--text-secondary, #6b7280);
        }

        .pq-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .pq-empty-content p {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
          margin: 0;
        }

        .pq-empty-content span {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .pq-retry-btn {
          margin-top: 12px;
          padding: 8px 20px;
          background: var(--primary-color, #2563eb);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .pq-retry-btn:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        /* Pagination */
        .pq-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          flex-wrap: wrap;
          gap: 8px;
        }

        .pq-pagination-info {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        /* Pagination Bar Styles */
        .pq-pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          flex-wrap: wrap;
          gap: 8px;
          background: var(--card-bg, #fff);
        }

        .pq-pagination-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .pq-pagination-left select {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
        }

        .pq-pagination-left select:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
        }

        .pq-pagination-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pq-page-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 32px;
          text-align: center;
        }

        .pq-page-btn:hover:not(:disabled):not(.active) {
          background: var(--nav-hover, #f8fafc);
          border-color: var(--primary-color, #2563eb);
        }

        .pq-page-btn.active {
          background: var(--primary-color, #2563eb);
          border-color: var(--primary-color, #2563eb);
          color: #fff;
        }

        .pq-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pq-page-btn.arrow {
          padding: 6px 10px;
        }

        .pq-pagination-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        /* Modal styles */
        .pq-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .pq-modal {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .pq-modal-lg {
          max-width: 900px;
        }

        .pq-modal-delete {
          max-width: 420px;
        }

        .pq-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .pq-modal-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .pq-modal-close {
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .pq-modal-close:hover {
          background: var(--hover-bg, #f3f4f6);
          color: var(--text-primary, #1e293b);
        }

        .pq-modal-body {
          padding: 20px;
          color: var(--text-primary, #1e293b);
        }

        .pq-modal-item-name {
          padding: 8px 12px;
          background: var(--hover-bg, #f8fafc);
          border-radius: 6px;
          margin: 8px 0;
        }

        .pq-modal-warning {
          color: var(--danger-color, #ef4444);
          font-size: 13px;
          margin-top: 8px;
        }

        .pq-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .pq-btn-cancel {
          padding: 8px 16px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .pq-btn-cancel:hover {
          background: var(--hover-bg, #f3f4f6);
        }

        .pq-btn-delete {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: var(--danger-color, #ef4444);
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .pq-btn-delete:hover:not(:disabled) {
          background: var(--danger-hover, #dc2626);
        }

        .pq-btn-delete:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pq-btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: var(--primary-color, #2563eb);
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .pq-btn-primary:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .pq-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .pq-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .pq-filter-left {
            flex-direction: column;
            align-items: stretch;
          }
          .pq-filter-right {
            flex-wrap: wrap;
            justify-content: stretch;
          }
          .pq-filter-right select {
            flex: 1;
          }
          .pq-btn-new {
            justify-content: center;
            flex: 1;
          }
          .pq-date-picker-container {
            width: 100%;
          }
          .pq-date-picker-trigger {
            width: 100%;
            justify-content: center;
          }
          .pq-date-picker-popup {
            left: 0;
            min-width: 100%;
            width: 100%;
          }
          .pq-pagination {
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .pq-pagination-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          .pq-pagination-left,
          .pq-pagination-center,
          .pq-pagination-right {
            justify-content: center;
          }
        }
      `}</style>

      {/* Search and Filter Bar */}
      <div className="pq-filter-bar">
        <div className="pq-filter-left">
          <div className="pq-search-wrapper">
            <FaSearch className="pq-search-icon" />
            <input
              type="text"
              placeholder="Search by Proforma #, Customer Name, or Customer Code..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pq-search-input"
            />
            {filterText && (
              <button className="pq-search-clear" onClick={() => setFilterText('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="pq-filter-right">
          <select
            value={selectedOrderType}
            onChange={(e) => setSelectedOrderType(e.target.value)}
            className="pq-filter-select"
          >
            <option value="All">All Types</option>
            <option value="Sales">Sales</option>
            <option value="Return">Return</option>
            <option value="Credit Note">Credit Note</option>
          </select>

          {/* Date Range Picker - Before New Proforma Button */}
          <div className="pq-date-picker-container">
            <div 
              className={`pq-date-picker-trigger ${showDatePicker ? 'active' : ''}`}
              onClick={openDatePicker}
            >
              <FaCalendarAlt className="pq-calendar-icon" />
              <span className={`pq-date-label ${!fromDate && !toDate ? 'placeholder' : ''}`}>
                {fromDate || toDate ? (
                  <span className="pq-date-range-display">
                    {fromDate ? formatDateForDisplay(fromDate) : 'Start'} – {toDate ? formatDateForDisplay(toDate) : 'End'}
                  </span>
                ) : (
                  'Filter by Date'
                )}
              </span>
            </div>
            
            {showDatePicker && (
              <div className="pq-date-picker-popup">
                <div className="pq-popup-header">
                  <span className="pq-popup-title">Filter by Date</span>
                  <button className="pq-popup-close" onClick={() => setShowDatePicker(false)}>
                    <FaTimes size={14} />
                  </button>
                </div>
                
                {/* Quick Filters */}
                <div className="pq-quick-filters">
                  <button 
                    className={`pq-quick-filter-btn ${selectedQuickFilter === 'today' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('today')}
                  >
                    Today
                  </button>
                  <button 
                    className={`pq-quick-filter-btn ${selectedQuickFilter === 'last7' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('last7')}
                  >
                    Last 7 Days
                  </button>
                  <button 
                    className={`pq-quick-filter-btn ${selectedQuickFilter === 'last30' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('last30')}
                  >
                    Last 30 Days
                  </button>
                  <button 
                    className={`pq-quick-filter-btn ${selectedQuickFilter === 'thisMonth' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('thisMonth')}
                  >
                    This Month
                  </button>
                </div>
                
                {/* Calendar */}
                <div className="pq-calendar-header">
                  <button className="pq-nav-btn" onClick={() => changeMonth(-1)}>
                    <FaChevronLeft size={12} />
                  </button>
                  <span className="pq-month-year">
                    {getMonthName(currentMonth)} {currentYear}
                  </span>
                  <button className="pq-nav-btn" onClick={() => changeMonth(1)}>
                    <FaChevronRight size={12} />
                  </button>
                </div>
                
                <div className="pq-calendar-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="pq-day-header">{day}</div>
                  ))}
                  {generateCalendarDays().map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="pq-day-cell empty"></div>;
                    }
                    
                    const dateObj = new Date(currentYear, currentMonth, day);
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const isToday = dateStr === getTodayDate();
                    const isInRange = isDateInRange(day);
                    const isSelected = isDateSelected(day);
                    const isStart = dateStr === tempFromDate;
                    const isEnd = dateStr === tempToDate;
                    
                    let className = 'pq-day-cell';
                    if (isToday) className += ' today';
                    if (isInRange && !isSelected) className += ' in-range';
                    if (isSelected) className += ' selected';
                    if (isStart && tempToDate) className += ' selected-start';
                    if (isEnd && tempFromDate) className += ' selected-end';
                    if (isInRange && !isSelected && !isStart && !isEnd) className += ' range-middle';
                    
                    return (
                      <div 
                        key={day} 
                        className={className}
                        onClick={() => handleDateClick(day)}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                
                <div className="pq-popup-actions">
                  <button className="pq-btn-clear" onClick={clearDateFilters}>
                    Clear
                  </button>
                  <button className="pq-btn-cancel" onClick={() => setShowDatePicker(false)}>
                    Cancel
                  </button>
                  <button className="pq-btn-apply" onClick={applyDateFilter}>
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="pq-btn-new" onClick={() => navigate('/proforma-invoice/new')}>
            <FaPlus size={12} /> New Proforma
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedOrderType !== 'All' || fromDate || toDate) && (
        <div className="pq-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {filterText && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{filterText}"
            </span>
          )}
          {selectedOrderType !== 'All' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Order Type:</strong> {selectedOrderType}
            </span>
          )}
          {(fromDate || toDate) && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Date:</strong> {fromDate ? formatDateForDisplay(fromDate) : 'Any'} – {toDate ? formatDateForDisplay(toDate) : 'Any'}
            </span>
          )}
          <button onClick={clearFilters} className="pq-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="pq-loading">
          <p>Loading proforma invoices...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="pq-error">
          <p>{error}</p>
          <button onClick={fetchSalesOrders} className="pq-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="pq-table-wrap">
          {salesOrders.length === 0 ? (
            <div className="pq-empty-state">
              <div className="pq-empty-content">
                <FaBoxOpen size={48} />
                <p>No proforma invoices found</p>
                <span>Try adjusting your search criteria, or create your first proforma</span>
              </div>
            </div>
          ) : (
            <>
              <table className="pq-table">
                <thead>
                  <tr>
                    <th className="pq-th">Proforma #</th>
                    <th className="pq-th">Customer</th>
                    <th className="pq-th">Date</th>
                    <th className="pq-th">Order Type</th>
                    <th className="pq-th pq-text-right">Amount</th>
                    <th className="pq-th pq-th-meta">Actions</th>

                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={order.id || `so-${index}`} className="pq-tr">
                    <td className="pq-td pq-td-id">
                      {order.salesOrderNumber}
                    </td>
                    <td className="pq-td">
                      <div>
                        <div className="pq-td-link">{order.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{order.customer}</div>
                      </div>
                    </td>
                    <td className="pq-td">
                      {/* ✅ USE FORMATTED DATE FOR DISPLAY */}
                      <div>{order.date ? formatDisplayDate(order.date) : '-'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Valid Until: {order.deliveryDate ? formatDisplayDate(order.deliveryDate) : '-'}
                      </div>
                    </td>
                    <td className="pq-td">{order.orderType}</td>
                    <td className="pq-td pq-text-right pq-amount-cell">
                      <span className="pq-currency">{order.currency}</span>
                      {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="pq-td pq-td-meta">
                      <div className="pq-action-buttons">
                        <button className="pq-action-btn pq-action-view" onClick={() => handleView(order)} title="View Proforma">
                          <FaEye size={12} />
                        </button>
                        <button
                          className="qt-action-btn qt-action-print"
                          onClick={() => handlePrintOrder(order)}
                          title="Print Proforma Invoice"
                          disabled={printLoadingId === order.id}
                        >
                          {printLoadingId === order.id ? <FaSpinner className="spinning" size={12} /> : <FaPrint size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {salesOrders.map((order, index) => (
                    <tr key={order.id || `so-${index}`} className="pq-tr">
                      <td className="pq-td pq-td-id">
                        {order.salesOrderNumber}
                      </td>
                      <td className="pq-td">
                        <div>
                          <div className="pq-td-link">{order.customerName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{order.customer}</div>
                        </div>
                      </td>
                      <td className="pq-td">
                        <div>{order.date ? formatDisplayDate(order.date) : '-'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Valid Until: {order.deliveryDate ? formatDisplayDate(order.deliveryDate) : '-'}
                        </div>
                      </td>
                      <td className="pq-td">{order.orderType}</td>
                      <td className="pq-td pq-text-right pq-amount-cell">
                        <span className="pq-currency">{order.currency}</span>
                        {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="pq-td pq-td-meta">
                        <div className="pq-action-buttons">
                          <button className="pq-action-btn pq-action-view" onClick={() => handleView(order)} title="View Proforma">
                            <FaEye size={12} />
                          </button>
                          <button
                            className="pq-action-btn pq-action-print"
                            onClick={() => handlePrintOrder(order)}
                            title="Print Proforma Invoice"
                            disabled={printLoadingId === order.id}
                          >
                            {printLoadingId === order.id ? <FaSpinner className="spinning" size={12} /> : <FaPrint size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Bar */}
              <div className="pq-pagination-bar">
                <div className="pq-pagination-left">
                  <span>Show:</span>
                  <select value={pageSize} onChange={handlePageSizeChange}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>
                    Showing {startIndex} to {endIndex} of {totalRecords} entries
                  </span>
                </div>

                <div className="pq-pagination-center">
                  <button
                    className="pq-page-btn arrow"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      className={`pq-page-btn ${page === currentPage ? 'active' : ''}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    className="pq-page-btn arrow"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>

                <div className="pq-pagination-right">
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pq-pagination">
        <div className="pq-pagination-left">
          <span className="pq-pagination-info">
            {salesOrders.length} proformas on page {currentPage}
          </span>
        </div>
        <div className="pq-pagination-right">
          <span className="pq-pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaChartLine size={14} style={{ color: 'var(--primary-color)' }} />
            {fulfillmentRate}% conversion rate
          </span>
        </div>
      </div>

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedOrder && (
        <div className="pq-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="pq-modal pq-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="pq-modal-header">
              <span className="pq-modal-title">Confirm Delete</span>
              <button className="pq-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="pq-modal-body">
              <p>Are you sure you want to delete this proforma invoice?</p>
              <p className="pq-modal-item-name">
                <strong>{selectedOrder.salesOrderNumber}</strong> - {selectedOrder.customerName}
              </p>
              <p className="pq-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="pq-modal-footer">
              <button className="pq-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="pq-btn-delete" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== PDF MODAL ====== */}
      {showPdfModal && selectedOrder && (
        <div className="pq-modal-overlay" onClick={() => setShowPdfModal(false)}>
          <div className="pq-modal pq-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="pq-modal-header">
              <span className="pq-modal-title">{selectedOrder.salesOrderNumber} - Proforma Invoice Preview</span>
              <button className="pq-modal-close" onClick={() => setShowPdfModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="pq-modal-body" style={{ background: '#f8f9fa' }}>
              {pdfModalLoading && (
                <div style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontSize: '13px' }}>
                  <FaSpinner className="spinning" /> Loading item details...
                </div>
              )}
              <div style={{ background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: "'Times New Roman', serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1f2433', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2433', letterSpacing: '2px' }}>PROFORMA INVOICE</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{selectedOrder.salesOrderNumber}</div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2433', margin: 0 }}>{getCompanyDetails().name}</h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{getCompanyDetails().address}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Phone: {getCompanyDetails().contact} | Email: {getCompanyDetails().email}</p>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Customer Details</div>
                  <div style={{ padding: '2px 0' }}><strong>Name:</strong> {selectedOrder.customerName}</div>
                  <div style={{ padding: '2px 0' }}><strong>Code:</strong> {selectedOrder.customer}</div>
                  <div style={{ padding: '2px 0' }}><strong>Email:</strong> {selectedOrder.customerEmail || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Phone:</strong> {selectedOrder.customerPhone || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Address:</strong> {selectedOrder.customerAddress || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>GSTIN:</strong> {selectedOrder.customerGstin || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>State:</strong> {selectedOrder.customerState || 'N/A'}{selectedOrder.customerStateCode ? ` (Code: ${selectedOrder.customerStateCode})` : ''}</div>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ padding: '2px 0' }}><strong>Date:</strong> {selectedOrder.date ? formatDisplayDate(selectedOrder.date) : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Valid Until:</strong> {selectedOrder.deliveryDate ? formatDisplayDate(selectedOrder.deliveryDate) : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Order Type:</strong> {selectedOrder.orderType}</div>
                  <div style={{ padding: '2px 0' }}><strong>Currency:</strong> {selectedOrder.currency}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', margin: '16px 0' }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Item Code</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Item Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Rate</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>CGST</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>SGST</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}>{item.itemCode}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}>{item.itemName}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{selectedOrder.currency} {item.rate}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{item.cgst ? `${item.cgst}%` : ''}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{item.sgst ? `${item.sgst}%` : ''}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{selectedOrder.currency} {item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background: '#f8f9fa' }}>
                    <tr>
                      <td colSpan={6} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total Amount</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '16px' }}>{selectedOrder.currency} {selectedOrder.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
                {selectedOrder.notes && (
                  <div style={{ margin: '16px 0', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Notes</div>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}
                {selectedOrder.termsConditions && (
                  <div style={{ margin: '16px 0', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Terms & Conditions</div>
                    <p>{selectedOrder.termsConditions}</p>
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
                  <p>This is a computer-generated proforma invoice. No signature required.</p>
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
            <div className="pq-modal-footer">
              <button className="pq-btn-cancel" onClick={() => setShowPdfModal(false)}>Close</button>
              <button className="pq-btn-primary" onClick={() => {
                handlePrintOrder(selectedOrder);
              }}>
                <FaPrint size={12} /> Print
              </button>
              <button className="pq-btn-primary" onClick={() => {
                toast.success('PDF downloaded successfully!');
                setShowPdfModal(false);
              }}>
                <FaFilePdf size={12} /> Download PDF
              </button>
              <button className="pq-btn-primary" onClick={() => {
                toast.success('PDF sent to email!');
                setShowPdfModal(false);
              }}>
                <FaEnvelope size={12} /> Email PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}