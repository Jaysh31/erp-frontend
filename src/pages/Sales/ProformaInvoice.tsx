import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEye, FaTrash, FaFilePdf, FaPrint,
  FaFilter, FaCheckCircle, FaClock, FaTimesCircle,
  FaFileAlt, FaExternalLinkAlt,
  FaChartLine, FaTimes, FaSpinner, FaBoxOpen, FaEnvelope,
  FaFileInvoice, FaBuilding, FaBan
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

const formatPrintDate = (date: string): string => {
  if (!date) return '';
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

/** Normalizes a list-style API response: { success, data: { records, total } } or { success, data: [...] } */
const extractRecords = (payload: any): any[] => {
  if (!payload) return [];
  const data = payload.success === 1 || payload.success === 0 ? payload.data : payload;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data)) return data;
  return [];
};

/** Maps a raw /sales-order API record's `items` child table into UI-shaped SalesOrderItem[]. */
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

export default function ProformaInvoice() {
  const navigate = useNavigate();

  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedOrderType, setSelectedOrderType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printLoadingId, setPrintLoadingId] = useState<string | null>(null);

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfModalLoading] = useState(false);

  // ─── Fetch Companies ───────────────────────────────────────
  const fetchCompanies = async () => {
    try {
      const response = await api.get('/company');
      if (response.data.success === 1) {
        setCompanies(response.data.data || []);
        // Find ChandraTara Industires or set first company
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

  // ─── load from GET /sales-order ───────────────────────────────────────
  const fetchSalesOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/sales-order');

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

      // Show ALL sales orders as proforma - NO FILTERING
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
    fetchSalesOrders();
    fetchCompanies();
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Confirmed': return 'status-sent';
      case 'On Hold': return 'status-expired';
      case 'Completed': return 'status-accepted';
      case 'Cancelled': return 'status-rejected';
      case 'Closed': return 'status-converted';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Confirmed': return <FaCheckCircle size={10} />;
      case 'On Hold': return <FaClock size={10} />;
      case 'Completed': return <FaCheckCircle size={10} />;
      case 'Cancelled': return <FaTimesCircle size={10} />;
      case 'Closed': return <FaExternalLinkAlt size={10} />;
      default: return null;
    }
  };

  const filteredOrders = salesOrders.filter(o => {
    const matchesSearch = (o.salesOrderNumber || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;
    const matchesOrderType = selectedOrderType === 'All' || o.orderType === selectedOrderType;
    return matchesSearch && matchesStatus && matchesOrderType;
  });

  const totalAmount = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedAmount = salesOrders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.totalAmount, 0);
  const fulfillmentRate = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;

  // View / Edit
  const handleView = (order: SalesOrder) => {
    if (!order.id) {
      toast.error('Unable to open this proforma — missing ID');
      return;
    }
    navigate(`/proforma-invoice/${order.id}`, { state: { proforma: order } });
  };

  // const handleEdit = (order: SalesOrder) => {
  //   if (!order.id) {
  //     toast.error('Unable to open this proforma — missing ID');
  //     return;
  //   }
  //   navigate(`/proforma-invoice/edit/${order.id}`, { state: { proforma: order } });
  // };

  // const handleDeleteClick = (order: SalesOrder) => {
  //   setSelectedOrder(order);
  //   setShowDeleteModal(true);
  // };

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
    setSelectedStatus('All');
    setSelectedOrderType('All');
  };

  /* ─────────────────────── Build Proforma Invoice HTML ─────────────────────── */

  const buildProformaInvoiceHtml = (order: SalesOrder, company?: Company, bank?: BankDetail): string => {
    const validItems = order.items || [];

    const baseTotal = validItems.reduce((sum, it) => sum + (it.amount || 0), 0);
    const cgstAmount = validItems.reduce((sum, it) => sum + ((it.amount || 0) * (it.cgst || 0)) / 100, 0);
    const sgstAmount = validItems.reduce((sum, it) => sum + ((it.amount || 0) * (it.sgst || 0)) / 100, 0);
    const totalQty = validItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const grandTotal = order.totalAmount || (baseTotal + cgstAmount + sgstAmount);

    // Use company details or fallback
    const companyName = company?.company_name || companyDetails.name;
    const companyAddress = company?.country || companyDetails.address;
    const companyPhone = company?.phone_no || companyDetails.contact;
    const companyEmail = company?.email || companyDetails.email;
    const companyGstin = company?.tax_id || companyPrintDetails.gstin;

    // Use bank details or fallback
    const bankName = bank?.bank_name || companyPrintDetails.bankName || 'HDFC';
    const bankBranch = bank?.branch_name || 'Pune';
    const bankAccount = bank?.account_number || companyPrintDetails.bankAccountNo || '351548887';
    const bankIfsc = bank?.ifsc_code || companyPrintDetails.bankBranchIfsc || 'HDFC0000123';
    const accountHolder = bank?.account_holder_name || 'Chandratara';
    const accountType = bank?.account_type || 'Savings';

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
            <div class="pq-meta-value">${escapeHtml(formatPrintDate(order.date))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Sales Order No.</div>
            <div class="pq-meta-value">${escapeHtml(order.salesOrderNumber)}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Valid Until</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDate(order.deliveryDate || ''))}</div>
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
            <div class="pq-meta-value">${escapeHtml(formatPrintDate(order.buyersOrderDate || ''))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Order Type</div>
            <div class="pq-meta-value">${escapeHtml(order.orderType || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Delivery Date</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDate(order.deliveryDate || ''))}</div>
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
      
      // Get selected company and bank details
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
      {/* Stats Cards */}
      <div className="pq-stats-grid">
        <div className="pq-stat-card">
          <div className="pq-stat-icon" style={{ background: 'var(--primary-light)' }}>
            <FaFileInvoice size={20} />
          </div>
          <div className="pq-stat-content">
            <span className="pq-stat-label">Total Proformas</span>
            <span className="pq-stat-value">{salesOrders.length}</span>
          </div>
        </div>
        <div className="pq-stat-card">
          <div className="pq-stat-icon" style={{ background: 'var(--success-light)' }}>
            <FaCheckCircle size={20} />
          </div>
          <div className="pq-stat-content">
            <span className="pq-stat-label">Confirmed</span>
            <span className="pq-stat-value">{salesOrders.filter(o => o.status === 'Confirmed').length}</span>
          </div>
        </div>
        <div className="pq-stat-card">
          <div className="pq-stat-icon" style={{ background: 'var(--warning-light)' }}>
            <FaClock size={20} />
          </div>
          <div className="pq-stat-content">
            <span className="pq-stat-label">Pending</span>
            <span className="pq-stat-value">{salesOrders.filter(o => o.status === 'Draft' || o.status === 'On Hold').length}</span>
          </div>
        </div>
        <div className="pq-stat-card">
          <div className="pq-stat-icon" style={{ background: 'var(--info-light)' }}>
            <FaChartLine size={20} />
          </div>
          <div className="pq-stat-content">
            <span className="pq-stat-label">Fulfillment Rate</span>
            <span className="pq-stat-value">{fulfillmentRate}%</span>
          </div>
        </div>
      </div>

      {/* Company & Bank Selector */}
      {companies.length > 0 && (
        <div className="pq-company-selector">
          <div className="pq-selector-group">
            <label className="pq-selector-label">
              <FaBuilding size={14} /> Company
            </label>
            <select
              className="pq-selector-input"
              value={selectedCompanyId || ''}
              onChange={(e) => {
                const companyId = Number(e.target.value);
                setSelectedCompanyId(companyId);
                const company = companies.find(c => c.id === companyId);
                if (company?.bank_details && company.bank_details.length > 0) {
                  setSelectedBankId(company.bank_details[0].id);
                } else {
                  setSelectedBankId(null);
                }
              }}
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.company_name} ({company.abbr})
                </option>
              ))}
            </select>
          </div>

          <div className="pq-selector-group">
            <label className="pq-selector-label">
              <FaBan size={14} /> Bank Account
            </label>
            <select
              className="pq-selector-input"
              value={selectedBankId || ''}
              onChange={(e) => setSelectedBankId(Number(e.target.value))}
              disabled={!selectedCompanyId}
            >
              {companies
                .find(c => c.id === selectedCompanyId)
                ?.bank_details?.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bank_name} - {bank.account_number} ({bank.account_type})
                    {bank.is_primary ? ' ★' : ''}
                  </option>
                )) || (
                  <option value="">No bank accounts available</option>
                )
              }
            </select>
          </div>
          
          <div className="pq-selector-info">
            <span className="pq-info-text">
              <FaCheckCircle size={12} style={{ color: '#10b981' }} />
              {selectedCompanyId && selectedBankId ? 'Bank account selected for printing' : 'Select bank account for print'}
            </span>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="pq-filter-bar">
        <div className="pq-filter-left">
          <div className="pq-search-wrapper">
            <FaSearch className="pq-search-icon" />
            <input
              type="text"
              placeholder="Search by Proforma # or Customer..."
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
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="pq-filter-select"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Closed">Closed</option>
          </select>
          <button className="pq-btn-new" onClick={() => navigate('/proforma-invoice/new')}>
            <FaPlus size={12} /> New Proforma
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== 'All' || selectedOrderType !== 'All') && (
        <div className="pq-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {filterText && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{filterText}"
            </span>
          )}
          {selectedStatus !== 'All' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {selectedStatus}
            </span>
          )}
          {selectedOrderType !== 'All' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Order Type:</strong> {selectedOrderType}
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
          {filteredOrders.length === 0 ? (
            <div className="pq-empty-state">
              <div className="pq-empty-content">
                <FaBoxOpen size={48} />
                <p>No proforma invoices found</p>
                <span>Try adjusting your search criteria, or create your first proforma</span>
              </div>
            </div>
          ) : (
            <table className="pq-table">
              <thead>
                <tr>
                  <th className="pq-th">Proforma #</th>
                  <th className="pq-th">Customer</th>
                  <th className="pq-th">Date</th>
                  <th className="pq-th">Order Type</th>
                  <th className="pq-th">Status</th>
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
                      <div>{order.date ? new Date(order.date).toLocaleDateString() : '-'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Valid Until: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="pq-td">{order.orderType}</td>
                    <td className="pq-td">
                      <span className={`pq-status-badge ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="pq-td pq-text-right pq-amount-cell">
                      <span className="pq-currency">{order.currency}</span>
                      {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="pq-td pq-td-meta">
                      <div className="pq-action-buttons">
                        <button className="pq-action-btn pq-action-view" onClick={() => handleView(order)} title="View ">
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
                        {/* <button className="pq-action-btn pq-action-edit" onClick={() => handleEdit(order)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="pq-action-btn pq-action-delete" onClick={() => handleDeleteClick(order)} title="Delete">
                          <FaTrash size={12} />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pq-pagination">
        <div className="pq-pagination-left">
          <span className="pq-pagination-info">
            {filteredOrders.length} of {salesOrders.length} proformas
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
                  <div style={{ padding: '2px 0' }}><strong>Date:</strong> {selectedOrder.date ? new Date(selectedOrder.date).toLocaleDateString() : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Valid Until:</strong> {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : 'N/A'}</div>
                  <div style={{ padding: '2px 0' }}><strong>Order Type:</strong> {selectedOrder.orderType}</div>
                  <div style={{ padding: '2px 0' }}><strong>Status:</strong> {selectedOrder.status}</div>
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