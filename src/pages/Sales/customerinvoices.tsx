import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaPrint,
  FaFilter, FaCheckCircle, FaClock, FaTimesCircle,
  FaFileAlt, FaExternalLinkAlt,
  FaChartLine, FaTimes, FaSpinner,
  FaBoxOpen, FaMoneyBillWave, FaExclamationTriangle, FaWallet
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './customerinvoices.css';
import api from '../../services/api';

/* ─────────────────────── Types ─────────────────────── */

interface InvoiceItem {
  id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  itemGroup?: string;
  brand?: string;
  qty: number;
  uom?: string;
  stockUom?: string;
  rate: number;
  amount: number;
  discountPercentage?: number;
  discountAmount?: number;
  netAmount?: number;
  warehouse?: string;
}

interface PaymentScheduleEntry {
  id: string;
  paymentTerm: string;
  dueDate: string;
  dueDays: number;
  invoicePortion: number;
  paymentAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: string;
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerName: string;
  company: string;
  postingDate: string;
  dueDate: string;
  currency: string;
  totalQty: number;
  total: number;
  netTotal: number;
  grandTotal: number;
  outstandingAmount: number;
  paidAmount: number;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Overdue' | 'Cancelled' | 'Return' | string;
  isPos: boolean;
  isReturn: boolean;
  totalTaxesAndCharges: number;
  roundingAdjustment: number;
  roundedTotal: number;
  remarks: string;
  items: InvoiceItem[];
  paymentSchedule: PaymentScheduleEntry[];
}

interface InvoiceApiItem {
  item_id?: number;
  item_code?: string;
  item_name?: string;
  description?: string;
  item_group?: string;
  brand?: string | null;
  qty?: number;
  uom?: string;
  stock_uom?: string;
  rate?: number;
  amount?: number;
  discount_percentage?: number;
  discount_amount?: number;
  net_amount?: number;
  warehouse?: string;
}

interface InvoiceApiPaymentEntry {
  payment_id?: number;
  payment_term?: string;
  due_date?: string;
  due_days?: number;
  invoice_portion?: number;
  payment_amount?: number;
  paid_amount?: number;
  pending_amount?: number;
  payment_status?: string;
}

interface InvoiceApiRecord {
  id: number | string;
  customer?: string;
  customer_name?: string;
  company?: string;
  posting_date?: string;
  due_date?: string;
  currency?: string;
  total_qty?: number;
  total?: number;
  net_total?: number;
  grand_total?: number;
  outstanding_amount?: number;
  paid_amount?: number;
  status?: string;
  is_pos?: number | boolean;
  is_return?: number | boolean;
  total_taxes_and_charges?: number;
  rounding_adjustment?: number;
  rounded_total?: number;
  remarks?: string | null;
  creation?: string;
  modified?: string;
  items?: InvoiceApiItem[];
  payment_schedule?: InvoiceApiPaymentEntry[];
}

/* ─────────────────────── Company / print constants ─────────────────────── */

const companyDetails = {
  name: 'Sculptor Tech Pvt Ltd',
  address: 'c-1006, gc, Pune, Maharashtra 411028, India',
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

const generateFallbackInvoiceNumber = (id: number | string): string => {
  const year = new Date().getFullYear();
  return `SINV-${year}-${String(id).padStart(5, '0')}`;
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

/** Maps a raw /sales-invoice API record's `items` child table into UI-shaped InvoiceItem[]. */
const mapApiItemsToInvoiceItems = (record: InvoiceApiRecord | null | undefined): InvoiceItem[] => {
  if (!record || !Array.isArray(record.items)) return [];
  return record.items.map((it, idx) => {
    const qty = it.qty ?? 0;
    const rate = it.rate ?? 0;
    return {
      id: String(idx + 1),
      itemCode: it.item_code || '',
      itemName: it.item_name || '',
      description: it.description || '',
      itemGroup: it.item_group || '',
      brand: it.brand || '',
      qty,
      uom: it.uom || 'Nos',
      stockUom: it.stock_uom || 'Nos',
      rate,
      amount: it.amount ?? qty * rate,
      discountPercentage: it.discount_percentage ?? 0,
      discountAmount: it.discount_amount ?? 0,
      netAmount: it.net_amount ?? it.amount ?? qty * rate,
      warehouse: it.warehouse || '',
    };
  });
};

const mapApiPaymentSchedule = (record: InvoiceApiRecord | null | undefined): PaymentScheduleEntry[] => {
  if (!record || !Array.isArray(record.payment_schedule)) return [];
  return record.payment_schedule.map((p, idx) => ({
    id: String(p.payment_id ?? idx + 1),
    paymentTerm: p.payment_term || '',
    dueDate: p.due_date || '',
    dueDays: p.due_days ?? 0,
    invoicePortion: p.invoice_portion ?? 0,
    paymentAmount: p.payment_amount ?? 0,
    paidAmount: p.paid_amount ?? 0,
    pendingAmount: p.pending_amount ?? 0,
    paymentStatus: p.payment_status || 'Pending',
  }));
};

const mapApiRecordToInvoice = (o: InvoiceApiRecord): CustomerInvoice => ({
  id: String(o.id),
  invoiceNumber: generateFallbackInvoiceNumber(o.id),
  customer: o.customer || '',
  customerName: o.customer_name || '',
  company: o.company || '',
  postingDate: o.posting_date || '',
  dueDate: o.due_date || '',
  currency: o.currency || 'INR',
  totalQty: o.total_qty ?? 0,
  total: o.total ?? 0,
  netTotal: o.net_total ?? 0,
  grandTotal: o.grand_total ?? 0,
  outstandingAmount: o.outstanding_amount ?? 0,
  paidAmount: o.paid_amount ?? 0,
  status: (o.status as CustomerInvoice['status']) || 'Draft',
  isPos: Boolean(o.is_pos),
  isReturn: Boolean(o.is_return),
  totalTaxesAndCharges: o.total_taxes_and_charges ?? 0,
  roundingAdjustment: o.rounding_adjustment ?? 0,
  roundedTotal: o.rounded_total ?? o.grand_total ?? 0,
  remarks: o.remarks || '',
  items: mapApiItemsToInvoiceItems(o),
  paymentSchedule: mapApiPaymentSchedule(o),
});

/* ─────────────────────── Component ─────────────────────── */

export default function CustomerInvoices() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printLoadingId, setPrintLoadingId] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);

  // Pagination (mirrors the API's page / limit / total shape)
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── load from GET /sales-invoice ─── */

  const fetchInvoices = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/sales-invoice?page=${pageNum}&limit=${limit}`);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to fetch customer invoices');
      }

      const payload = response.data.data;
      const records: InvoiceApiRecord[] = Array.isArray(payload?.records) ? payload.records : [];

      setInvoices(records.map(mapApiRecordToInvoice));
      setTotalRecords(payload?.total ?? records.length);
      setPage(payload?.page ?? pageNum);
    } catch (err: any) {
      console.error('Error fetching customer invoices:', err);
      setError(err.response?.data?.message || 'An error occurred while loading customer invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Submitted': return 'status-sent';
      case 'Paid': return 'status-accepted';
      case 'Overdue': return 'status-rejected';
      case 'Cancelled': return 'status-rejected';
      case 'Return': return 'status-converted';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Submitted': return <FaCheckCircle size={10} />;
      case 'Paid': return <FaCheckCircle size={10} />;
      case 'Overdue': return <FaClock size={10} />;
      case 'Cancelled': return <FaTimesCircle size={10} />;
      case 'Return': return <FaExternalLinkAlt size={10} />;
      default: return null;
    }
  };

  const isOverdue = (invoice: CustomerInvoice) => {
    if (invoice.outstandingAmount <= 0) return false;
    if (!invoice.dueDate) return false;
    return new Date(invoice.dueDate).getTime() < Date.now();
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = (inv.invoiceNumber || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (inv.customerName || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (inv.customer || '').toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Receivables stats
  const totalReceivable = invoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const overdueCount = invoices.filter(isOverdue).length;
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    fetchInvoices(p);
  };

  const handleView = (invoice: CustomerInvoice) => {
    navigate(`/customer-invoices/${invoice.id}`, { state: { invoice } });
  };

  const handleEdit = (invoice: CustomerInvoice) => {
    navigate(`/customer-invoices/${invoice.id}`, { state: { invoice } });
  };

  const handleDeleteClick = (invoice: CustomerInvoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedInvoice) return;
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/sales-invoice/${selectedInvoice.id}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to delete customer invoice');
      }
      setShowDeleteModal(false);
      setSelectedInvoice(null);
      toast.success('Customer invoice deleted successfully!');
      fetchInvoices(page);
    } catch (err: any) {
      console.error('Error deleting customer invoice:', err);
      toast.error(err.response?.data?.message || 'Failed to delete customer invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilterText('');
    setSelectedStatus('All');
  };

  /* ─────────────────────── Print (Tax-Invoice format) ─────────────────────── */

  const buildInvoicePrintHtml = (invoice: CustomerInvoice): string => {
    const validItems = invoice.items || [];

    const baseTotal = invoice.netTotal || validItems.reduce((sum, it) => sum + (it.netAmount || it.amount || 0), 0);
    const taxAmount = invoice.totalTaxesAndCharges || 0;
    const cgstAmount = taxAmount / 2;
    const sgstAmount = taxAmount / 2;
    const totalQty = invoice.totalQty || validItems.reduce((sum, it) => sum + (it.qty || 0), 0);
    const grandTotal = invoice.roundedTotal || invoice.grandTotal || (baseTotal + taxAmount);

    const itemRows = validItems.map((item, idx) => `
      <tr>
        <td class="ci-col-sl">${idx + 1}</td>
        <td class="ci-col-desc">
          ${escapeHtml(item.itemName || item.itemCode || '')}
          ${item.itemCode ? `<div class="ci-item-sub">${escapeHtml(item.itemCode)}</div>` : ''}
        </td>
        <td class="ci-col-qty">${item.qty} ${escapeHtml(item.stockUom || 'Nos')}</td>
        <td class="ci-col-rate">${item.rate.toFixed(2)}</td>
        <td class="ci-col-disc">${item.discountPercentage ? item.discountPercentage + '%' : ''}</td>
        <td class="ci-col-amt">${(item.netAmount ?? item.amount).toFixed(2)}</td>
      </tr>
    `).join('');

    const paymentRows = (invoice.paymentSchedule || []).map(p => `
      <tr>
        <td>${escapeHtml(p.paymentTerm)}</td>
        <td>${escapeHtml(formatPrintDate(p.dueDate))}</td>
        <td>${p.invoicePortion}%</td>
        <td>${p.paymentAmount.toFixed(2)}</td>
        <td>${p.paidAmount.toFixed(2)}</td>
        <td>${p.pendingAmount.toFixed(2)}</td>
        <td>${escapeHtml(p.paymentStatus)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 24px; }
  .ci-outer { border: 1.5px solid #000; }
  .ci-title-row { display: flex; align-items: center; justify-content: center; position: relative; padding: 8px; border-bottom: 1.5px solid #000; }
  .ci-title { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
  .ci-top { display: flex; border-bottom: 1px solid #000; }
  .ci-company-box { flex: 1.3; padding: 8px; border-right: 1px solid #000; }
  .ci-company-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
  .ci-company-box div { margin: 1px 0; }
  .ci-meta-box { flex: 1.1; }
  .ci-meta-row { display: flex; border-bottom: 1px solid #000; }
  .ci-meta-row:last-child { border-bottom: none; }
  .ci-meta-cell { flex: 1; padding: 4px 8px; border-right: 1px solid #000; }
  .ci-meta-cell:last-child { border-right: none; }
  .ci-meta-label { font-size: 10px; color: #444; }
  .ci-meta-value { font-weight: 600; margin-top: 1px; min-height: 13px; }
  .ci-parties { display: flex; border-bottom: 1px solid #000; }
  .ci-party-box { flex: 1; padding: 8px; }
  .ci-party-label { font-weight: bold; margin-bottom: 3px; }
  .ci-party-box div { margin: 1px 0; }
  table.ci-items { width: 100%; border-collapse: collapse; }
  table.ci-items th, table.ci-items td { border-right: 1px solid #000; padding: 5px 6px; }
  table.ci-items th:last-child, table.ci-items td:last-child { border-right: none; }
  table.ci-items thead th { border-bottom: 1px solid #000; font-size: 11px; text-align: left; }
  .ci-col-sl { width: 26px; text-align: center; }
  .ci-col-desc { min-width: 200px; }
  .ci-item-sub { font-size: 10px; color: #555; }
  .ci-col-qty { width: 84px; text-align: right; }
  .ci-col-rate { width: 70px; text-align: right; }
  .ci-col-disc { width: 60px; text-align: right; }
  .ci-col-amt { width: 100px; text-align: right; }
  .ci-total-row td { border-top: 1px solid #000; font-weight: bold; padding: 6px; }
  .ci-words { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; justify-content: space-between; align-items: flex-start; }
  .ci-words-label { font-size: 10px; color: #444; }
  .ci-eoe { font-size: 11px; font-style: italic; white-space: nowrap; }
  table.ci-summary { width: 100%; border-collapse: collapse; margin-top: 0; }
  table.ci-summary th, table.ci-summary td { border: 1px solid #000; padding: 4px 8px; font-size: 11px; text-align: right; }
  table.ci-summary th:first-child, table.ci-summary td:first-child { text-align: left; }
  .ci-bottom { display: flex; border-top: 1px solid #000; }
  .ci-pan-decl-box { flex: 1; padding: 8px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
  .ci-bank-sign-box { flex: 1; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
  .ci-signatory { text-align: right; margin-top: 24px; font-size: 11px; }
  .ci-footer { text-align: center; padding: 8px; font-size: 10px; color: #444; border-top: 1px solid #000; }
  .ci-footer div:first-child { font-weight: 600; letter-spacing: 0.5px; margin-bottom: 2px; }
  @media print {
    body { padding: 0; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="ci-outer">

    <div class="ci-title-row">
      <div class="ci-title">TAX INVOICE</div>
    </div>

    <div class="ci-top">
      <div class="ci-company-box">
        <div class="ci-company-name">${escapeHtml(invoice.company || companyDetails.name)}</div>
        <div>${escapeHtml(companyDetails.address)}</div>
        <div>Phone: ${escapeHtml(companyDetails.contact)}</div>
        ${companyDetails.email ? `<div>Email: ${escapeHtml(companyDetails.email)}</div>` : ''}
        ${companyPrintDetails.gstin ? `<div>GSTIN/UIN: ${escapeHtml(companyPrintDetails.gstin)}</div>` : ''}
        <div>State Name : ${escapeHtml(companyPrintDetails.stateName)}, Code : ${escapeHtml(companyPrintDetails.stateCode)}</div>
      </div>
      <div class="ci-meta-box">
        <div class="ci-meta-row">
          <div class="ci-meta-cell">
            <div class="ci-meta-label">Invoice No.</div>
            <div class="ci-meta-value">${escapeHtml(invoice.invoiceNumber)}</div>
          </div>
          <div class="ci-meta-cell" style="border-right:none;">
            <div class="ci-meta-label">Posting Date</div>
            <div class="ci-meta-value">${escapeHtml(formatPrintDate(invoice.postingDate))}</div>
          </div>
        </div>
        <div class="ci-meta-row">
          <div class="ci-meta-cell">
            <div class="ci-meta-label">Due Date</div>
            <div class="ci-meta-value">${escapeHtml(formatPrintDate(invoice.dueDate))}</div>
          </div>
          <div class="ci-meta-cell" style="border-right:none;">
            <div class="ci-meta-label">Status</div>
            <div class="ci-meta-value">${escapeHtml(invoice.status)}</div>
          </div>
        </div>
        <div class="ci-meta-row">
          <div class="ci-meta-cell">
            <div class="ci-meta-label">Outstanding Amount</div>
            <div class="ci-meta-value">${invoice.currency} ${invoice.outstandingAmount.toFixed(2)}</div>
          </div>
          <div class="ci-meta-cell" style="border-right:none;">
            <div class="ci-meta-label">Paid Amount</div>
            <div class="ci-meta-value">${invoice.currency} ${invoice.paidAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="ci-parties">
      <div class="ci-party-box">
        <div class="ci-party-label">Bill To</div>
        <div><strong>${escapeHtml(invoice.customerName)}</strong></div>
        ${invoice.customer ? `<div>Customer Code : ${escapeHtml(invoice.customer)}</div>` : ''}
      </div>
    </div>

    <table class="ci-items">
      <thead>
        <tr>
          <th class="ci-col-sl">Sl</th>
          <th class="ci-col-desc">Description of Goods</th>
          <th class="ci-col-qty">Quantity</th>
          <th class="ci-col-rate">Rate</th>
          <th class="ci-col-disc">Discount</th>
          <th class="ci-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="ci-total-row">
          <td colspan="2">Total</td>
          <td class="ci-col-qty">${totalQty} Nos.</td>
          <td colspan="2"></td>
          <td class="ci-col-amt">${grandTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="ci-words">
      <div>
        <div class="ci-words-label">Amount Chargeable (in words)</div>
        <div><strong>${invoice.currency || 'INR'} ${numberToIndianWords(grandTotal)} Only</strong></div>
      </div>
      <div class="ci-eoe">E.&amp;O.E</div>
    </div>

    ${taxAmount > 0 ? `
    <table class="ci-summary">
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Taxable Value</td><td>${baseTotal.toFixed(2)}</td></tr>
        <tr><td>Output CGST</td><td>${cgstAmount.toFixed(2)}</td></tr>
        <tr><td>Output SGST</td><td>${sgstAmount.toFixed(2)}</td></tr>
        <tr style="font-weight:600;"><td>Total Tax</td><td>${taxAmount.toFixed(2)}</td></tr>
      </tbody>
    </table>` : ''}

    ${paymentRows ? `
    <table class="ci-summary" style="margin-top:0;">
      <thead>
        <tr>
          <th>Payment Term</th>
          <th>Due Date</th>
          <th>Portion</th>
          <th>Amount</th>
          <th>Paid</th>
          <th>Pending</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${paymentRows}
      </tbody>
    </table>` : ''}

    <div class="ci-bottom">
      <div class="ci-pan-decl-box">
        <div>
          <strong>Declaration</strong>
          <div>We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.</div>
        </div>
        ${companyPrintDetails.panNo ? `<div style="margin-top:8px;">Company's PAN : ${escapeHtml(companyPrintDetails.panNo)}</div>` : ''}
      </div>
      <div class="ci-bank-sign-box">
        <div>
          <div><strong>Company's Bank Details</strong></div>
          ${companyPrintDetails.bankName ? `<div>Bank Name : ${escapeHtml(companyPrintDetails.bankName)}</div>` : ''}
          ${companyPrintDetails.bankAccountNo ? `<div>A/c No. : ${escapeHtml(companyPrintDetails.bankAccountNo)}</div>` : ''}
          ${companyPrintDetails.bankBranchIfsc ? `<div>Branch &amp; IFS Code : ${escapeHtml(companyPrintDetails.bankBranchIfsc)}</div>` : ''}
        </div>
        <div class="ci-signatory">
          for ${escapeHtml(invoice.company || companyDetails.name)}<br /><br /><br />
          Authorised Signatory
        </div>
      </div>
    </div>

    <div class="ci-footer">
      ${companyPrintDetails.jurisdiction ? `<div>SUBJECT TO ${escapeHtml(companyPrintDetails.jurisdiction)} JURISDICTION</div>` : ''}
      <div>This is a computer generated tax invoice.</div>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
  };

  const handlePrintInvoice = async (invoice: CustomerInvoice) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print this invoice');
      return;
    }
    printWindow.document.write('<p style="font-family:sans-serif;padding:24px;color:#374151;">Loading invoice…</p>');

    setPrintLoadingId(invoice.id);
    try {
      printWindow.document.open();
      printWindow.document.write(buildInvoicePrintHtml(invoice));
      printWindow.document.close();
    } catch (err) {
      console.error('Error printing customer invoice:', err);
    } finally {
      setPrintLoadingId(null);
    }
  };

  return (
    <div className={`customer-invoices-page ${theme}-theme`}>
      {/* Receivables Stats */}
      <div className="ci-stats-container">
        <div className="ci-stat-card">
          <div className="ci-stat-icon" style={{ color: '#6366f1' }}>
            <FaFileAlt />
          </div>
          <div className="ci-stat-content">
            <div className="ci-stat-title">Total Invoiced</div>
            <p className="ci-stat-value">₹{totalInvoiced.toLocaleString()}</p>
          </div>
        </div>
        <div className="ci-stat-card">
          <div className="ci-stat-icon" style={{ color: '#f59e0b' }}>
            <FaWallet />
          </div>
          <div className="ci-stat-content">
            <div className="ci-stat-title">Total Receivable</div>
            <p className="ci-stat-value">₹{totalReceivable.toLocaleString()}</p>
          </div>
        </div>
        <div className="ci-stat-card">
          <div className="ci-stat-icon" style={{ color: '#10b981' }}>
            <FaMoneyBillWave />
          </div>
          <div className="ci-stat-content">
            <div className="ci-stat-title">Total Collected</div>
            <p className="ci-stat-value">₹{totalCollected.toLocaleString()}</p>
          </div>
        </div>
        <div className="ci-stat-card">
          <div className="ci-stat-icon" style={{ color: '#ef4444' }}>
            <FaExclamationTriangle />
          </div>
          <div className="ci-stat-content">
            <div className="ci-stat-title">Overdue Invoices</div>
            <p className="ci-stat-value">{overdueCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="ci-filter-bar">
        <div className="ci-filter-left">
          <div className="ci-search-wrapper">
            <FaSearch className="ci-search-icon" />
            <input
              type="text"
              placeholder="Search by Invoice # or Customer..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="ci-search-input"
            />
            {filterText && (
              <button className="ci-search-clear" onClick={() => setFilterText('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="ci-filter-right">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="ci-filter-select"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Return">Return</option>
          </select>
          <button className="ci-btn-new" onClick={() => navigate('/customer-invoices/new')}>
            <FaPlus size={12} /> Add Customer Invoice
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== 'All') && (
        <div className="ci-active-filters">
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
          <button onClick={clearFilters} className="ci-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="ci-loading">
          <p>Loading customer invoices...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="ci-error">
          <p>{error}</p>
          <button onClick={() => fetchInvoices(page)} className="ci-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="ci-table-wrap">
          {filteredInvoices.length === 0 ? (
            <div className="ci-empty-state">
              <div className="ci-empty-content">
                <FaBoxOpen size={48} />
                <p>No customer invoices found</p>
                <span>Try adjusting your search criteria, or create your first customer invoice</span>
              </div>
            </div>
          ) : (
            <table className="ci-table">
              <thead>
                <tr>
                  <th className="ci-th">Invoice #</th>
                  <th className="ci-th">Customer</th>
                  <th className="ci-th">Posting Date</th>
                  <th className="ci-th">Due Date</th>
                  <th className="ci-th">Status</th>
                  <th className="ci-th ci-text-right">Grand Total</th>
                  <th className="ci-th ci-text-right">Outstanding</th>
                  <th className="ci-th ci-th-meta">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, index) => (
                  <tr key={invoice.id || `inv-${index}`} className="ci-tr">
                    <td className="ci-td ci-td-id">{invoice.invoiceNumber}</td>
                    <td className="ci-td">
                      <div>
                        <div className="ci-td-link">{invoice.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{invoice.customer}</div>
                      </div>
                    </td>
                    <td className="ci-td">
                      {invoice.postingDate ? new Date(invoice.postingDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="ci-td">
                      <div style={{ color: isOverdue(invoice) ? 'var(--danger-color, #ef4444)' : undefined, fontWeight: isOverdue(invoice) ? 600 : undefined }}>
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="ci-td">
                      <span className={`ci-status-badge ${getStatusColor(isOverdue(invoice) ? 'Overdue' : invoice.status)}`}>
                        {getStatusIcon(isOverdue(invoice) ? 'Overdue' : invoice.status)}
                        {isOverdue(invoice) ? 'Overdue' : invoice.status}
                      </span>
                    </td>
                    <td className="ci-td ci-text-right ci-amount-cell">
                      <span className="ci-currency">{invoice.currency}</span>
                      {invoice.grandTotal.toLocaleString()}
                    </td>
                    <td className="ci-td ci-text-right ci-amount-cell" style={{ color: invoice.outstandingAmount > 0 ? 'var(--danger-color, #ef4444)' : 'var(--text-secondary)' }}>
                      <span className="ci-currency">{invoice.currency}</span>
                      {invoice.outstandingAmount.toLocaleString()}
                    </td>
                    <td className="ci-td ci-td-meta">
                      <div className="ci-action-buttons">
                        <button className="ci-action-btn ci-action-view" onClick={() => handleView(invoice)} title="View / Edit">
                          <FaEye size={12} />
                        </button>
                        <button
                          className="ci-action-btn ci-action-print"
                          onClick={() => handlePrintInvoice(invoice)}
                          title="Print"
                          disabled={printLoadingId === invoice.id}
                        >
                          {printLoadingId === invoice.id ? <FaSpinner className="spinning" size={12} /> : <FaPrint size={12} />}
                        </button>
                        <button className="ci-action-btn ci-action-edit" onClick={() => handleEdit(invoice)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="ci-action-btn ci-action-delete" onClick={() => handleDeleteClick(invoice)} title="Delete">
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer / Pagination */}
      <div className="ci-pagination">
        <div className="ci-pagination-left">
          <span className="ci-pagination-info">
            {filteredInvoices.length} of {totalRecords} invoices
          </span>
        </div>
        <div className="ci-pagination-right">
          <span className="ci-pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaChartLine size={14} style={{ color: 'var(--primary-color)' }} />
            Page {page} of {totalPages}
          </span>
          <button className="ci-page-btn" onClick={() => goToPage(page - 1)} disabled={page <= 1}>Prev</button>
          <button className="ci-page-btn" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      </div>

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedInvoice && (
        <div className="ci-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="ci-modal ci-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="ci-modal-header">
              <span className="ci-modal-title">Confirm Delete</span>
              <button className="ci-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="ci-modal-body">
              <p>Are you sure you want to delete this customer invoice?</p>
              <p className="ci-modal-item-name">
                <strong>{selectedInvoice.invoiceNumber}</strong> - {selectedInvoice.customerName}
              </p>
              <p className="ci-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="ci-modal-footer">
              <button className="ci-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="ci-btn-delete" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}