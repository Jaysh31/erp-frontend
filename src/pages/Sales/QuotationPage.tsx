import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaFilePdf, FaPrint,
  FaFilter, FaCheckCircle, FaClock, FaTimesCircle,
  FaFileAlt, FaExternalLinkAlt,
  FaChartLine, FaTimes, FaSpinner,
  FaEnvelope, FaCalendarAlt,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight

} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './QuotationPage.css';
import api from '../../services/api';

interface QuotationItem {
  id: string;
  itemCode: string;
  itemName: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  amount: number;
  cgst?: number;
  sgst?: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerGstin?: string;
  customerState?: string;
  customerStateCode?: string;
  date: string;
  validTill: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
  currency: string;
  items: QuotationItem[];
  notes: string;
  termsConditions: string;
  namingSeries?: string;
  quotationTo?: string;
  orderType?: string;
  company?: string;
  priceList?: string;
  taxCategory?: string;
  taxesAndCharges?: string;
  shippingRule?: string;
  incoterm?: string;
  placeOfSupply?: string;
  contactPerson?: string;
  paymentTermsTemplate?: string;
  tcName?: string;
  taxes?: TaxRow[];
  paymentSchedule?: PaymentSchedule[];
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

interface QuotationApiRecord {
  name: string;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  valid_till?: string;
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
    qty?: number;
    rate?: number;
    amount?: number;
    cgst_rate?: number;
    sgst_rate?: number;
  }>;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    records: QuotationApiRecord[];
  };
}

const companyDetails = {
  name: 'Chandratara Industries',
  address: '20/1,Hadapsar Industrial Estate, hadapsar, Pune-411013, Maharashtra',
  contact: '8888861441',
};

const companyPrintDetails = {
  gstin: '27AFFPC0269R1Z4',
  stateName: 'Maharashtra',
  stateCode: '27',
  panNo: 'AFFPC0269R',
  bankName: 'STATE BANK OF INDIA (NEW)',
  bankAccountNo: '40159796829',
  bankBranchIfsc: 'PULGATE & SBIN0008044',
  jurisdiction: 'PUNE',
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

const QUOTATION_LINE_CACHE_PREFIX = 'quotation_line_data:';

interface CachedQuotationLineData {
  items?: QuotationItem[];
  paymentSchedule?: any[];
}

const readCachedQuotationLineData = (name: string): CachedQuotationLineData | null => {
  try {
    const raw = localStorage.getItem(QUOTATION_LINE_CACHE_PREFIX + name);
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

const mapApiItemsToQuotationItems = (record: QuotationApiRecord | null | undefined): QuotationItem[] => {
  if (!record || !Array.isArray(record.items)) return [];
  return record.items.map((it, idx) => {
    const quantity = it.qty ?? 0;
    const rate = it.rate ?? 0;
    return {
      id: String(idx + 1),
      itemCode: it.item_code || '',
      itemName: it.item_name || '',
      hsnCode: it.hsn_code || it.gst_hsn_code || '',
      quantity,
      rate,
      amount: it.amount ?? quantity * rate,
      cgst: it.cgst_rate ?? 0,
      sgst: it.sgst_rate ?? 0,
    };
  });
};

// ─── Date filter helpers ────────────────────────────────────────────────

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDisplayDate(d: Date): string {
  return `${MONTH_LABELS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  return cells;
}

export default function QuotationPage() {
  const navigate = useNavigate();

  const { theme, formatDate, getApiDateFormat } = useAdminTheme();


  const [filterText, setFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printLoadingId, setPrintLoadingId] = useState<string | null>(null);

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  
  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ─── Date Filter States ────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const dateFilterWrapperRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfModalLoading] = useState(false);

  // ─── Debounce function for search ──────────────────────────────────
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

  const debouncedFilterText = useDebounce(filterText, 500);

  const formatDisplayDateWithContext = (dateString: string) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  const toApiDateFormat = (date: Date) => {
    return getApiDateFormat(date);
  };

  // ─── Date Filter Functions ─────────────────────────────────────────────

  const openDatePicker = () => {
    // Convert fromDate/toDate strings to Date objects for temp state
    if (fromDate) {
      const from = new Date(fromDate);
      if (!isNaN(from.getTime())) setTempFromDate(from);
    } else {
      setTempFromDate(null);
    }
    if (toDate) {
      const to = new Date(toDate);
      if (!isNaN(to.getTime())) setTempToDate(to);
    } else {
      setTempToDate(null);
    }
    setCalendarViewDate(fromDate ? new Date(fromDate) : new Date());
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleCalendarDayClick = (day: Date) => {
    const clicked = stripTime(day);
    if (!tempFromDate || (tempFromDate && tempToDate)) {
      setTempFromDate(clicked);
      setTempToDate(null);
      return;
    }
    if (clicked < tempFromDate) {
      setTempToDate(tempFromDate);
      setTempFromDate(clicked);
    } else {
      setTempToDate(clicked);
    }
  };

  const applyQuickFilter = (range: "today" | "last7" | "last30" | "thisMonth") => {
    const today = stripTime(new Date());
    if (range === "today") {
      setTempFromDate(today);
      setTempToDate(today);
      setCalendarViewDate(today);
    } else if (range === "last7") {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      setTempFromDate(from);
      setTempToDate(today);
      setCalendarViewDate(today);
    } else if (range === "last30") {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      setTempFromDate(from);
      setTempToDate(today);
      setCalendarViewDate(today);
    } else if (range === "thisMonth") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setTempFromDate(from);
      setTempToDate(to);
      setCalendarViewDate(today);
    }
  };

  const goToPrevMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleApplyDateFilter = () => {
    if (tempFromDate && tempToDate) {
      setFromDate(toLocalDateStr(tempFromDate));
      setToDate(toLocalDateStr(tempToDate));
      setCurrentPage(1);
      setShowDatePicker(false);
    }
  };

  const handleClearDateFilter = () => {
    setTempFromDate(null);
    setTempToDate(null);
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const handleClearDateFilterBadge = () => {
    setTempFromDate(null);
    setTempToDate(null);
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const dateFilterButtonLabel = 
    fromDate && toDate
      ? `${formatDisplayDate(new Date(fromDate))} – ${formatDisplayDate(new Date(toDate))}`
      : "From - To";

  const calendarCells = buildCalendarGrid(calendarViewDate.getFullYear(), calendarViewDate.getMonth());

  // ─── load from GET /quotation with server-side pagination ──────

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));

      if (debouncedFilterText.trim()) {
        params.append('search', debouncedFilterText.trim());
        params.append('search_by', 'all');
      }

      if (selectedStatus !== 'All') {
        params.append('status', selectedStatus);
      }

      if (selectedCurrency !== 'All') {
        params.append('currency', selectedCurrency);
      }

      if (fromDate) {
        params.append('date_from', fromDate);
      }
      if (toDate) {
        params.append('date_to', toDate);
      }

      const response = await api.get<ApiResponse>(`/quotation?${params.toString()}`);

      const { records, total, totalPages: apiTotalPages } = response.data.data;

      setTotalRecords(total);
      setTotalPages(apiTotalPages);
      
      if (currentPage > apiTotalPages && apiTotalPages > 0) {
        setCurrentPage(apiTotalPages);
        return;
      }

      const transformedData: Quotation[] = records.map((q) => ({
        id: q.name,
        quotationNumber: q.name,
        customer: q.party_name || '',
        customerName: q.customer_name || '',
        customerEmail: q.contact_email || '',
        customerPhone: q.contact_mobile || '',
        customerAddress: q.address_display || q.customer_address || '',
        customerGstin: q.customer_gstin || q.gstin || '',
        customerState: q.customer_state || q.state || '',
        customerStateCode: q.state_code || '',
        date: q.transaction_date || '',
        validTill: q.valid_till || '',
        totalAmount: q.grand_total ?? q.total ?? 0,
        status: (q.status as Quotation['status']) || 'Draft',
        currency: q.currency || 'INR',
        notes: q.notes || '',
        termsConditions: q.terms || '',
        paymentTermsTemplate: q.payment_terms_template || '',
        deliveryNote: q.delivery_note || '',
        referenceNo: q.reference_no || '',
        referenceDate: q.reference_date || '',
        buyersOrderNo: q.po_no || '',
        buyersOrderDate: q.po_date || '',
        dispatchDocNo: q.dispatch_document_no || '',
        deliveryNoteDate: q.lr_date || '',
        dispatchedThrough: q.dispatched_through || '',
        destination: q.destination || '',
        items: mapApiItemsToQuotationItems(q),
      }));

      setQuotations(transformedData);
    } catch (err: any) {
      console.error('Error fetching quotations:', err);
      setError(err.response?.data?.message || 'An error occurred while loading quotations');
    } finally {
      setLoading(false);
    }
  };

  // ─── Click outside handler for date picker ──────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showDatePicker &&
        dateFilterWrapperRef.current &&
        !dateFilterWrapperRef.current.contains(e.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDatePicker]);

  // Fetch when page, itemsPerPage, or filters change
  useEffect(() => {
    fetchQuotations();
  }, [currentPage, itemsPerPage, debouncedFilterText, selectedStatus, selectedCurrency, fromDate, toDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, selectedStatus, selectedCurrency, fromDate, toDate]);

  const fetchFullQuotationRecord = async (quotationId: string): Promise<QuotationApiRecord | null> => {
    try {
      const response = await api.get(`/quotation/${quotationId}`);
      if (response.data && response.data.success !== 0) {
        const data = response.data.success === 1 ? response.data.data : response.data;
        const record = Array.isArray(data) ? data[0] : (data?.record ?? data);
        if (record && (record.name || record.id)) {
          return record as QuotationApiRecord;
        }
      }
    } catch (err) {
      console.warn('Direct /quotation/:id fetch failed, falling back to list scan:', err);
    }

    try {
      const response = await api.get('/quotation');
      const records = extractRecords(response.data);
      const found = records.find(
        (r: any) => r && (r.name === quotationId || String(r.id) === String(quotationId))
      );
      return (found as QuotationApiRecord) || null;
    } catch (err) {
      console.error('Error fetching quotation detail:', err);
      return null;
    }
  };

  const enrichItemsFromCatalog = async (items: QuotationItem[]): Promise<QuotationItem[]> => {
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

  const buildPrintableQuote = async (quote: Quotation): Promise<Quotation> => {
    let items: QuotationItem[] = [];
    let latestTotal: number | undefined;

    try {
      const detail = await fetchFullQuotationRecord(quote.id);
      items = mapApiItemsToQuotationItems(detail);
      latestTotal = detail?.grand_total ?? detail?.total ?? undefined;
    } catch (err) {
      console.error('Error fetching full quotation record for print:', err);
    }

    if (items.length === 0) {
      const cached = readCachedQuotationLineData(quote.id);
      if (cached?.items && cached.items.length > 0) {
        items = cached.items;
      }
    }

    if (items.length === 0 && quote.items && quote.items.length > 0) {
      items = quote.items;
    }

    try {
      items = await enrichItemsFromCatalog(items);
    } catch (err) {
      console.error('Item catalog enrichment failed:', err);
    }

    return {
      ...quote,
      items,
      totalAmount: latestTotal ?? quote.totalAmount,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Sent': return 'status-sent';
      case 'Accepted': return 'status-accepted';
      case 'Rejected': return 'status-rejected';
      case 'Expired': return 'status-expired';
      case 'Converted': return 'status-converted';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Sent': return <FaEnvelope size={10} />;
      case 'Accepted': return <FaCheckCircle size={10} />;
      case 'Rejected': return <FaTimesCircle size={10} />;
      case 'Expired': return <FaClock size={10} />;
      case 'Converted': return <FaExternalLinkAlt size={10} />;
      default: return null;
    }
  };

  // ─── Pagination Handlers ──────────────────────────────────────────
  const goToPage = (page: number) => {
    if (page < 1) {
      setCurrentPage(1);
    } else if (page > totalPages) {
      setCurrentPage(totalPages);
    } else {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
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

  const getStartIndexDisplay = () => {
    if (totalRecords === 0) return 0;
    return (currentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndexDisplay = () => {
    return Math.min(currentPage * itemsPerPage, totalRecords);
  };

  const totalAmount = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const acceptedAmount = quotations.filter(q => q.status === 'Accepted').reduce((sum, q) => sum + q.totalAmount, 0);
  const conversionRate = totalAmount > 0 ? Math.round((acceptedAmount / totalAmount) * 100) : 0;

  const handleView = (quote: Quotation) => {
    navigate(`/quotation/${quote.id}`, { state: { quotation: quote } });
  };

  const handleEdit = (quote: Quotation) => {
    navigate(`/quotation/${quote.id}`, { state: { quotation: quote } });
  };

  const handleDeleteClick = (quote: Quotation) => {
    setSelectedQuote(quote);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedQuote) return;
    setIsSubmitting(true);
    try {
      console.log('Attempting to delete quotation:', selectedQuote.id);
      console.log('Quotation data:', selectedQuote);
      
      const response = await api.delete(`/quotation/${selectedQuote.id}`);
      console.log('Delete response:', response);
      
      if (response.data && response.data.success === 1) {
        setShowDeleteModal(false);
        setSelectedQuote(null);
        toast.success(response.data.message || 'Quotation deleted successfully!');
        await fetchQuotations();
      } else {
        const errorMsg = response.data?.message || 'Failed to delete quotation';
        console.error('Delete failed:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error deleting quotation:', err);
      
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
        console.error('Error response headers:', err.response.headers);
        
        if (err.response.status === 500) {
          toast.error('Server error: The quotation may have related records (items, taxes) that need to be deleted first.');
        } else if (err.response.status === 404) {
          toast.error('Quotation not found. It may have already been deleted.');
        } else if (err.response.status === 403) {
          toast.error('You do not have permission to delete this quotation.');
        } else if (err.response.status === 400) {
          toast.error(err.response.data?.message || 'Bad request. Please check the quotation data.');
        } else {
          toast.error(err.response.data?.message || 'Failed to delete quotation');
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        toast.error('Network error - Please check your connection');
      } else {
        console.error('Request setup error:', err.message);
        toast.error('An unexpected error occurred: ' + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCompanyDetails = () => companyDetails;

  const clearFilters = () => {
    setFilterText('');
    setSelectedStatus('All');
    setSelectedCurrency('All');
    setFromDate('');
    setToDate('');
    setTempFromDate(null);
    setTempToDate(null);
    setCurrentPage(1);
  };

  /* ─────────────────────── Print (Tax-Invoice format) ─────────────────────── */

  const buildQuotationPrintHtml = (quote: Quotation): string => {
    const validItems = quote.items || [];

    const baseTotal = validItems.reduce((sum, it) => sum + (it.amount || 0), 0);
    const cgstAmount = validItems.reduce((sum, it) => sum + ((it.amount || 0) * (it.cgst || 0)) / 100, 0);
    const sgstAmount = validItems.reduce((sum, it) => sum + ((it.amount || 0) * (it.sgst || 0)) / 100, 0);
    const totalQty = validItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const grandTotal = quote.totalAmount || (baseTotal + cgstAmount + sgstAmount);

    const formatPrintDateLocal = (dateStr: string) => {
      if (!dateStr) return '';
      return formatDisplayDateWithContext(dateStr);
    };

    const itemRows = validItems.map((item, idx) => `
      <tr>
        <td class="pq-col-sl">${idx + 1}</td>
        <td class="pq-col-desc">
          ${escapeHtml(item.itemName || item.itemCode || '')}
          ${item.itemCode ? `<div class="pq-item-sub">${escapeHtml(item.itemCode)}</div>` : ''}
        </td>
        <td class="pq-col-hsn">${escapeHtml(item.hsnCode || '')}</td>
        <td class="pq-col-qty">${item.quantity} Nos.</td>
        <td class="pq-col-rate">${item.rate.toFixed(2)}</td>
        <td class="pq-col-per">Nos.</td>
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

    const paymentTerms = quote.paymentTermsTemplate || '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(quote.quotationNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 24px; }
  .pq-outer { border: 1.5px solid #000; }
  .pq-title-row { display: flex; align-items: center; justify-content: center; position: relative; padding: 8px; border-bottom: 1.5px solid #000; }
  .pq-title { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
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
  table.pq-items thead th { border-bottom: 1px solid #000; border-top: none; font-size: 11px; text-align: left; }
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
  .pq-total-row td { border-top: 1px solid #000; font-weight: bold; padding: 6px; }
  .pq-words { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; justify-content: space-between; align-items: flex-start; }
  .pq-words-label { font-size: 10px; color: #444; }
  .pq-eoe { font-size: 11px; font-style: italic; white-space: nowrap; }
  table.pq-summary { width: 100%; border-collapse: collapse; }
  table.pq-summary th, table.pq-summary td { border: 1px solid #000; padding: 4px 8px; font-size: 11px; text-align: right; }
  table.pq-summary th:first-child, table.pq-summary td:first-child { text-align: left; }
  .pq-tax-words { border-top: 1px solid #000; padding: 6px 8px; }
  .pq-bottom { display: flex; border-top: 1px solid #000; }
  .pq-pan-decl-box { flex: 1; padding: 8px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
  .pq-bank-sign-box { flex: 1; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
  .pq-signatory { text-align: right; margin-top: 24px; font-size: 11px; }
  .pq-footer { text-align: center; padding: 8px; font-size: 10px; color: #444; border-top: 1px solid #000; }
  .pq-footer div:first-child { font-weight: 600; letter-spacing: 0.5px; margin-bottom: 2px; }
  @media print {
    body { padding: 0; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="pq-outer">

    <div class="pq-title-row">
      <div class="pq-title">QUOTATION</div>
    </div>

    <div class="pq-top">
      <div class="pq-company-box">
        <div class="pq-company-name">${escapeHtml(companyDetails.name)}</div>
        <div>${escapeHtml(companyDetails.address)}</div>
        <div>Phone: ${escapeHtml(companyDetails.contact)}</div>
        ${companyPrintDetails.gstin ? `<div>GSTIN/UIN: ${escapeHtml(companyPrintDetails.gstin)}</div>` : ''}
        <div>State Name : ${escapeHtml(companyPrintDetails.stateName)}, Code : ${escapeHtml(companyPrintDetails.stateCode)}</div>
      </div>
      <div class="pq-meta-box">
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Quotation No.</div>
            <div class="pq-meta-value">${escapeHtml(quote.quotationNumber)}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Dated</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDateLocal(quote.date))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Delivery Note</div>
            <div class="pq-meta-value">${escapeHtml(quote.deliveryNote || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Mode/Terms of Payment</div>
            <div class="pq-meta-value">${escapeHtml(paymentTerms)}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Reference No. &amp; Date.</div>
            <div class="pq-meta-value">${escapeHtml(quote.referenceNo || '')}${quote.referenceDate ? ` dt. ${escapeHtml(formatPrintDateLocal(quote.referenceDate))}` : ''}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Buyer's Order No.</div>
            <div class="pq-meta-value">${escapeHtml(quote.buyersOrderNo || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Dated</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDateLocal(quote.buyersOrderDate || ''))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Dispatch Doc No.</div>
            <div class="pq-meta-value">${escapeHtml(quote.dispatchDocNo || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Delivery Note Date</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDateLocal(quote.deliveryNoteDate || ''))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Dispatched through</div>
            <div class="pq-meta-value">${escapeHtml(quote.dispatchedThrough || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Destination</div>
            <div class="pq-meta-value">${escapeHtml(quote.destination || '')}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Terms of Delivery</div>
            <div class="pq-meta-value">${escapeHtml(quote.termsConditions || '')}</div>
          </div>
        </div>
        ${quote.status ? `
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Status</div>
            <div class="pq-meta-value">${escapeHtml(quote.status)} ${quote.validTill ? `&nbsp;•&nbsp; Valid Till: ${escapeHtml(formatPrintDateLocal(quote.validTill))}` : ''}</div>
          </div>
        </div>` : ''}
      </div>
    </div>

    <div class="pq-parties">
      <div class="pq-party-box">
        <div class="pq-party-label">Consignee (Ship to)</div>
        <div><strong>${escapeHtml(quote.customerName)}</strong></div>
        ${quote.customerAddress ? `<div>${escapeHtml(quote.customerAddress)}</div>` : ''}
        ${quote.customerGstin ? `<div>GSTIN/UIN : ${escapeHtml(quote.customerGstin)}</div>` : ''}
        ${quote.customerState ? `<div>State Name : ${escapeHtml(quote.customerState)}${quote.customerStateCode ? `, Code : ${escapeHtml(quote.customerStateCode)}` : ''}</div>` : ''}
      </div>
      <div class="pq-party-box">
        <div class="pq-party-label">Buyer (Bill to)</div>
        <div><strong>${escapeHtml(quote.customerName)}</strong></div>
        ${quote.customerAddress ? `<div>${escapeHtml(quote.customerAddress)}</div>` : ''}
        ${quote.customerGstin ? `<div>GSTIN/UIN : ${escapeHtml(quote.customerGstin)}</div>` : ''}
        ${quote.customerState ? `<div>State Name : ${escapeHtml(quote.customerState)}${quote.customerStateCode ? `, Code : ${escapeHtml(quote.customerStateCode)}` : ''}</div>` : ''}
        ${quote.customerEmail ? `<div>Email : ${escapeHtml(quote.customerEmail)}</div>` : ''}
        ${quote.customerPhone ? `<div>Phone : ${escapeHtml(quote.customerPhone)}</div>` : ''}
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
        <div><strong>${quote.currency || 'INR'} ${numberToIndianWords(grandTotal)} Only</strong></div>
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
      Tax Amount (in words) : <strong>${quote.currency || 'INR'} ${numberToIndianWords(cgstAmount + sgstAmount)} Only</strong>
    </div>` : ''}

    <div class="pq-bottom">
      <div class="pq-pan-decl-box">
        <div>
          <strong>Declaration</strong>
          <div>We declare that this quotation shows the actual price of the goods described and that all particulars are true and correct.</div>
        </div>
        ${companyPrintDetails.panNo ? `<div style="margin-top:8px;">Company's PAN : ${escapeHtml(companyPrintDetails.panNo)}</div>` : ''}
      </div>
      <div class="pq-bank-sign-box">
        <div>
          <div><strong>Company's Bank Details</strong></div>
          ${companyPrintDetails.bankName ? `<div>Bank Name : ${escapeHtml(companyPrintDetails.bankName)}</div>` : ''}
          ${companyPrintDetails.bankAccountNo ? `<div>A/c No. : ${escapeHtml(companyPrintDetails.bankAccountNo)}</div>` : ''}
          ${companyPrintDetails.bankBranchIfsc ? `<div>Branch &amp; IFS Code : ${escapeHtml(companyPrintDetails.bankBranchIfsc)}</div>` : ''}
        </div>
        <div class="pq-signatory">
          for ${escapeHtml(companyDetails.name)}<br /><br /><br />
          Authorised Signatory
        </div>
      </div>
    </div>

    <div class="pq-footer">
      ${companyPrintDetails.jurisdiction ? `<div>SUBJECT TO ${escapeHtml(companyPrintDetails.jurisdiction)} JURISDICTION</div>` : ''}
      <div>This is a computer generated quotation.</div>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
  };

  const handlePrintQuotation = async (quote: Quotation) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print this quotation');
      return;
    }
    printWindow.document.write('<p style="font-family:sans-serif;padding:24px;color:#374151;">Loading quotation…</p>');

    setPrintLoadingId(quote.id);
    try {
      const printable = await buildPrintableQuote(quote);
      printWindow.document.open();
      printWindow.document.write(buildQuotationPrintHtml(printable));
      printWindow.document.close();
    } catch (err) {
      console.error('Error printing quotation:', err);
      printWindow.document.open();
      printWindow.document.write(buildQuotationPrintHtml(quote));
      printWindow.document.close();
    } finally {
      setPrintLoadingId(null);
    }
  };

  return (
    <div className={`quotation-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="qt-filter-bar">
        <div className="qt-filter-left">
          <div className="qt-search-wrapper">
            <FaSearch className="qt-search-icon" />
            <input
              type="text"
              placeholder="Search by Quote #, Customer Name, or Customer Code..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="qt-search-input"
            />
            {filterText && (
              <button className="qt-search-clear" onClick={() => setFilterText("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="qt-filter-right">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="qt-filter-select"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
            <option value="Converted">Converted</option>
          </select>

          {/* ─── From - To Date Filter Button ─── */}
           <div className="jc-date-filter-wrapper" ref={dateFilterWrapperRef}>
  <button
    type="button"
    className={`jc-date-filter-btn ${
      fromDate && toDate ? "jc-filter-active" : ""
    }`}
    onClick={openDatePicker}
  >
    <FaCalendarAlt className="pq-calendar-icon" />

    <span>{dateFilterButtonLabel}</span>

    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ marginLeft: "4px" }}
    >
      <path
        d="M2 4l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>

  {showDatePicker && (
    <div className="jc-date-filter-popup">
      {/* Header */}
      <div className="jc-date-filter-popup-header">
        <span>Filter by Date</span>

        <button
          type="button"
          className="jc-date-filter-popup-close"
          onClick={closeDatePicker}
        >
          <FaTimes size={14} />
        </button>
      </div>

      {/* Selected Date Inputs */}
      <div className="jc-date-filter-inputs">
        <input
          type="text"
          readOnly
          placeholder="From"
          className="jc-date-filter-input"
          value={
            tempFromDate
              ? formatDisplayDate(tempFromDate)
              : ""
          }
        />

        <input
          type="text"
          readOnly
          placeholder="To"
          className="jc-date-filter-input"
          value={
            tempToDate
              ? formatDisplayDate(tempToDate)
              : ""
          }
        />
      </div>

      {/* Quick Filters */}
      <div className="jc-date-filter-quick-row">
        <button
          type="button"
          className="jc-quick-filter-btn"
          onClick={() => applyQuickFilter("today")}
        >
          Today
        </button>

        <button
          type="button"
          className="jc-quick-filter-btn"
          onClick={() => applyQuickFilter("last7")}
        >
          Last 7 Days
        </button>

        <button
          type="button"
          className="jc-quick-filter-btn"
          onClick={() => applyQuickFilter("last30")}
        >
          Last 30 Days
        </button>
      </div>

      <div className="jc-date-filter-quick-row">
        <button
          type="button"
          className="jc-quick-filter-btn"
          onClick={() => applyQuickFilter("thisMonth")}
        >
          This Month
        </button>
      </div>

      {/* Calendar */}
      <div className="jc-calendar">
        <div className="jc-calendar-header">
          <button
            type="button"
            className="jc-calendar-nav-btn"
            onClick={goToPrevMonth}
          >
            <FaChevronLeft size={12} />
          </button>

          <span className="jc-calendar-month-label">
            {MONTH_LABELS[calendarViewDate.getMonth()]}{" "}
            {calendarViewDate.getFullYear()}
          </span>

          <button
            type="button"
            className="jc-calendar-nav-btn"
            onClick={goToNextMonth}
          >
            <FaChevronRight size={12} />
          </button>
        </div>

        {/* Weekdays */}
        <div className="jc-calendar-weekdays">
          {WEEKDAY_LABELS.map((wd) => (
            <span
              key={wd}
              className="jc-calendar-weekday"
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="jc-calendar-grid">
          {calendarCells.map((day, idx) => {
            if (!day) {
              return (
                <span
                  key={`blank-${idx}`}
                  className="jc-calendar-cell jc-calendar-cell-empty"
                />
              );
            }

            const isStart = isSameDay(day, tempFromDate);
            const isEnd = isSameDay(day, tempToDate);

            const inRange =
              !!tempFromDate &&
              !!tempToDate &&
              day > tempFromDate &&
              day < tempToDate;

            return (
              <button
                type="button"
                key={day.toISOString()}
                className={[
                  "jc-calendar-cell",
                  isStart || isEnd
                    ? "jc-calendar-cell-selected"
                    : "",
                  inRange
                    ? "jc-calendar-cell-inrange"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleCalendarDayClick(day)}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="jc-date-filter-footer">
        <button
          type="button"
          className="jc-btn-cancel"
          onClick={handleClearDateFilter}
        >
          Clear
        </button>

        <button
          type="button"
          className="jc-btn-primary"
          onClick={handleApplyDateFilter}
          disabled={!tempFromDate || !tempToDate}
        >
          Apply Filters
        </button>
      </div>
    </div>
  )}
</div>

          <button className="qt-btn-new" onClick={() => navigate('/quotation/new')}>
            <FaPlus size={12} /> New Quotation
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== "All" || selectedCurrency !== "All" || (fromDate && toDate)) && (
        <div className="qt-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span style={{ color: "var(--text-primary)" }}>Active filters:</span>
          {filterText && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Search:</strong> "{filterText}"
            </span>
          )}
          {selectedStatus !== "All" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Status:</strong> {selectedStatus}
            </span>
          )}
          {selectedCurrency !== "All" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Currency:</strong> {selectedCurrency}
            </span>
          )}
          {fromDate && toDate && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>From:</strong> {formatDisplayDate(new Date(fromDate))}{" "}
              <strong>To:</strong> {formatDisplayDate(new Date(toDate))}
              <button
                onClick={handleClearDateFilterBadge}
                style={{ marginLeft: 6, background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                title="Clear date filter"
              >
                <FaTimes size={10} />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="qt-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="qt-loading">
          <p>Loading quotations...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="qt-error">
          <p>{error}</p>
          <button onClick={fetchQuotations} className="qt-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="qt-table-wrap">
          {quotations.length === 0 ? (
            <div className="qt-empty-state">
              <div className="qt-empty-content">
                <FaFileAlt size={48} />
                <p>No quotations found</p>
                <span>Try adjusting your search criteria</span>
              </div>
            </div>
          ) : (
            <>
              <table className="qt-table">
                <thead>
                  <tr>
                    <th className="qt-th">Quote #</th>
                    <th className="qt-th">Customer</th>
                    <th className="qt-th">Date</th>
                    <th className="qt-th">Status</th>
                    <th className="qt-th qt-text-right">Amount</th>
                    <th className="qt-th qt-th-meta">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((quote) => (
                    <tr key={quote.id} className="qt-tr">
                      <td className="qt-td qt-td-id">{quote.quotationNumber}</td>
                      <td className="qt-td">
                        <div>
                          <div className="qt-td-link">{quote.customerName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{quote.customer}</div>
                        </div>
                      </td>
                      <td className="qt-td">
                        <div>{quote.date ? formatDisplayDateWithContext(quote.date) : '-'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Valid: {quote.validTill ? formatDisplayDateWithContext(quote.validTill) : '-'}
                        </div>
                      </td>
                      <td className="qt-td">
                        <span className={`qt-status-badge ${getStatusColor(quote.status)}`}>
                          {getStatusIcon(quote.status)}
                          {quote.status}
                        </span>
                      </td>
                      <td className="qt-td qt-text-right qt-amount-cell">
                        <span className="qt-currency">{quote.currency}</span>
                        {quote.totalAmount.toLocaleString()}
                      </td>
                      <td className="qt-td qt-td-meta">
                        <div className="qt-action-buttons">
                          <button className="qt-action-btn qt-action-view" onClick={() => handleView(quote)} title="View / Edit">
                            <FaEye size={12} />
                          </button>
                          <button
                            className="qt-action-btn qt-action-print"
                            onClick={() => handlePrintQuotation(quote)}
                            title="Print"
                            disabled={printLoadingId === quote.id}
                          >
                            {printLoadingId === quote.id ? <FaSpinner className="spinning" size={12} /> : <FaPrint size={12} />}
                          </button>
                          <button className="qt-action-btn qt-action-edit" onClick={() => handleEdit(quote)} title="Edit">
                            <FaEdit size={12} />
                          </button>
                          <button className="qt-action-btn qt-action-delete" onClick={() => handleDeleteClick(quote)} title="Delete">
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ─── Pagination ────────────────────────────── */}
              {totalRecords > 0 && (
                <div className="qt-pagination" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 0',
                  borderTop: '1px solid var(--border-color, #e5e7eb)',
                  marginTop: '8px'
                }}>
                  <div className="qt-pagination-left" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: 'var(--text-secondary, #6b7280)',
                    fontSize: '13px'
                  }}>
                    <span className="qt-pagination-label">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="qt-page-size-select"
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border-color, #d1d5db)',
                        borderRadius: '4px',
                        background: 'var(--bg-color, white)',
                        color: 'var(--text-primary, #1f2937)',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="qt-pagination-label">entries</span>
                  </div>

                  <div className="qt-pagination-center" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px'
                  }}>
                    <button 
                      onClick={goToFirstPage} 
                      className="qt-page-btn" 
                      disabled={currentPage === 1 || totalPages === 0}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border-color, #d1d5db)',
                        borderRadius: '4px',
                        background: 'var(--bg-color, white)',
                        color: 'var(--text-primary, #1f2937)',
                        cursor: currentPage === 1 || totalPages === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 || totalPages === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <FaAngleDoubleLeft size={12} />
                    </button>
                    <button 
                      onClick={goToPrevPage} 
                      className="qt-page-btn" 
                      disabled={currentPage === 1 || totalPages === 0}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border-color, #d1d5db)',
                        borderRadius: '4px',
                        background: 'var(--bg-color, white)',
                        color: 'var(--text-primary, #1f2937)',
                        cursor: currentPage === 1 || totalPages === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 || totalPages === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    
                    {totalPages > 0 && getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`qt-page-btn ${currentPage === page ? 'qt-page-btn-active' : ''}`}
                        style={{
                          padding: '4px 10px',
                          border: currentPage === page ? '1px solid var(--primary-color, #3b82f6)' : '1px solid var(--border-color, #d1d5db)',
                          borderRadius: '4px',
                          background: currentPage === page ? 'var(--primary-color, #3b82f6)' : 'var(--bg-color, white)',
                          color: currentPage === page ? 'white' : 'var(--text-primary, #1f2937)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: currentPage === page ? '600' : '400',
                          minWidth: '32px'
                        }}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button 
                      onClick={goToNextPage} 
                      className="qt-page-btn" 
                      disabled={currentPage === totalPages || totalPages === 0}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border-color, #d1d5db)',
                        borderRadius: '4px',
                        background: 'var(--bg-color, white)',
                        color: 'var(--text-primary, #1f2937)',
                        cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <FaChevronRight size={12} />
                    </button>
                    <button 
                      onClick={goToLastPage} 
                      className="qt-page-btn" 
                      disabled={currentPage === totalPages || totalPages === 0}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border-color, #d1d5db)',
                        borderRadius: '4px',
                        background: 'var(--bg-color, white)',
                        color: 'var(--text-primary, #1f2937)',
                        cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <FaAngleDoubleRight size={12} />
                    </button>
                  </div>

                  <div className="qt-pagination-right" style={{ 
                    color: 'var(--text-secondary, #6b7280)',
                    fontSize: '13px'
                  }}>
                    <span className="qt-pagination-info">
                      {totalRecords > 0
                        ? `Showing ${getStartIndexDisplay()} to ${getEndIndexDisplay()} of ${totalRecords} entries`
                        : 'No entries to show'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer Stats */}
      <div className="qt-footer-stats" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        marginTop: '4px'
      }}>
        <div className="qt-pagination-left">
          <span className="qt-pagination-info" style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '13px' }}>
            {totalRecords} total quotes
          </span>
        </div>
        <div className="qt-pagination-right">
          <span className="qt-pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #6b7280)', fontSize: '13px' }}>
            <FaChartLine size={14} style={{ color: 'var(--primary-color)' }} />
            {conversionRate}% conversion rate
          </span>
        </div>
      </div>

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedQuote && (
        <div className="qt-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="qt-modal qt-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="qt-modal-header">
              <span className="qt-modal-title">Confirm Delete</span>
              <button className="qt-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="qt-modal-body">
              <p>Are you sure you want to delete this quotation?</p>
              <p className="qt-modal-item-name">
                <strong>{selectedQuote.quotationNumber}</strong> - {selectedQuote.customerName}
              </p>
              <p className="qt-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="qt-modal-footer">
              <button className="qt-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="qt-btn-delete" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== PDF MODAL ====== */}
      {showPdfModal && selectedQuote && (
        <div className="qt-modal-overlay" onClick={() => setShowPdfModal(false)}>
          <div className="qt-modal qt-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="qt-modal-header">
              <span className="qt-modal-title">{selectedQuote.quotationNumber} - PDF Preview</span>
              <button className="qt-modal-close" onClick={() => setShowPdfModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="qt-modal-body" style={{ background: '#f8f9fa' }}>
              {pdfModalLoading && (
                <div style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontSize: '13px' }}>
                  <FaSpinner className="spinning" /> Loading item details...
                </div>
              )}
              <div style={{ background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: "'Times New Roman', serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1f2433', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2433', letterSpacing: '2px' }}>QUOTATION</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{selectedQuote.quotationNumber}</div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2433', margin: 0 }}>{getCompanyDetails().name}</h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{getCompanyDetails().address}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Phone: {getCompanyDetails().contact}</p>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Customer Details</div>
                  <div style={{ padding: '2px 0' }}><strong>Name:</strong> {selectedQuote.customerName}</div>
                  <div style={{ padding: '2px 0' }}><strong>Code:</strong> {selectedQuote.customer}</div>
                  <div style={{ padding: '2px 0' }}><strong>Email:</strong> {selectedQuote.customerEmail || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Phone:</strong> {selectedQuote.customerPhone || 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Address:</strong> {selectedQuote.customerAddress || 'N/A'}</div>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ padding: '2px 0' }}><strong>Date:</strong> {selectedQuote.date ? formatDisplayDateWithContext(selectedQuote.date) : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Valid Till:</strong> {selectedQuote.validTill ? formatDisplayDateWithContext(selectedQuote.validTill) : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Status:</strong> {selectedQuote.status}</div>
                  <div style={{ padding: '2px 0' }}><strong>Currency:</strong> {selectedQuote.currency}</div>
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
                    {selectedQuote.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}>{item.itemCode}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}>{item.itemName}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{selectedQuote.currency} {item.rate}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{item.cgst ? `${item.cgst}%` : ''}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{item.sgst ? `${item.sgst}%` : ''}</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{selectedQuote.currency} {item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background: '#f8f9fa' }}>
                    <tr>
                      <td colSpan={6} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total Amount</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '16px' }}>{selectedQuote.currency} {selectedQuote.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
                {selectedQuote.notes && (
                  <div style={{ margin: '16px 0', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Notes</div>
                    <p>{selectedQuote.notes}</p>
                  </div>
                )}
                {selectedQuote.termsConditions && (
                  <div style={{ margin: '16px 0', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2433', margin: '16px 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Terms & Conditions</div>
                    <p>{selectedQuote.termsConditions}</p>
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
                  <p>This is a computer-generated quotation. No signature required.</p>
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
            <div className="qt-modal-footer">
              <button className="qt-btn-cancel" onClick={() => setShowPdfModal(false)}>Close</button>
              <button className="qt-btn-primary" onClick={() => {
                handlePrintQuotation(selectedQuote);
              }}>
                <FaPrint size={12} /> Print
              </button>
              <button className="qt-btn-primary" onClick={() => {
                toast.success('PDF downloaded successfully!');
                setShowPdfModal(false);
              }}>
                <FaFilePdf size={12} /> Download PDF
              </button>
              <button className="qt-btn-primary" onClick={() => {
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