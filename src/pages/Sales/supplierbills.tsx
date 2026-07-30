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
import './supplierbills.css';
import api from '../../services/api';

/* ─────────────────────── Types ─────────────────────── */

interface BillItem {
  id: string;
  itemCode: string;
  itemName: string;
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

export interface SupplierBill {
  id: string;
  billNumber: string;
  supplierBillNo?: string;
  supplierBillDate?: string;
  supplier: string;
  supplierName: string;
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
  isPaid: boolean;
  isReturn: boolean;
  totalTaxesAndCharges: number;
  roundingAdjustment: number;
  roundedTotal: number;
  remarks: string;
  items: BillItem[];
}

interface BillApiItem {
  item_id?: number;
  item_code?: string;
  item_name?: string;
  item_group?: string | null;
  brand?: string | null;
  qty?: number;
  uom?: string;
  stock_uom?: string | null;
  rate?: number;
  amount?: number;
  discount_percentage?: number;
  discount_amount?: number;
  net_amount?: number;
  warehouse?: string;
}

interface BillApiRecord {
  id: number | string;
  name?: string;
  supplier?: string;
  supplier_name?: string;
  company?: string;
  posting_date?: string;
  due_date?: string | null;
  currency?: string;
  total_qty?: number;
  total?: number;
  net_total?: number;
  grand_total?: number;
  outstanding_amount?: number;
  paid_amount?: number;
  status?: string;
  is_paid?: number | boolean;
  is_return?: number | boolean;
  total_taxes_and_charges?: number;
  rounding_adjustment?: number;
  rounded_total?: number;
  remarks?: string | null;
  bill_no?: string | null;
  bill_date?: string | null;
  creation?: string;
  modified?: string;
  items?: BillApiItem[];
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

const generateFallbackBillNumber = (id: number | string): string => {
  const year = new Date().getFullYear();
  return `SUPP-INV-${year}-${String(id).padStart(5, '0')}`;
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

/** Maps a raw /purchase-invoice API record's `items` child table into UI-shaped BillItem[]. */
const mapApiItemsToBillItems = (record: BillApiRecord | null | undefined): BillItem[] => {
  if (!record || !Array.isArray(record.items)) return [];
  return record.items.map((it, idx) => {
    const qty = it.qty ?? 0;
    const rate = it.rate ?? 0;
    return {
      id: String(idx + 1),
      itemCode: it.item_code || '',
      itemName: it.item_name || '',
      itemGroup: it.item_group || '',
      brand: it.brand || '',
      qty,
      uom: it.uom || 'Nos',
      stockUom: it.stock_uom || it.uom || 'Nos',
      rate,
      amount: it.amount ?? qty * rate,
      discountPercentage: it.discount_percentage ?? 0,
      discountAmount: it.discount_amount ?? 0,
      netAmount: it.net_amount || it.amount || qty * rate,
      warehouse: it.warehouse || '',
    };
  });
};

const mapApiRecordToBill = (o: BillApiRecord): SupplierBill => ({
  id: String(o.id),
  billNumber: generateFallbackBillNumber(o.id),
  supplierBillNo: o.bill_no || '',
  supplierBillDate: o.bill_date || '',
  supplier: o.supplier || '',
  supplierName: o.supplier_name || '',
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
  status: (o.status as SupplierBill['status']) || 'Draft',
  isPaid: Boolean(o.is_paid),
  isReturn: Boolean(o.is_return),
  totalTaxesAndCharges: o.total_taxes_and_charges ?? 0,
  roundingAdjustment: o.rounding_adjustment ?? 0,
  roundedTotal: o.rounded_total ?? o.grand_total ?? 0,
  remarks: o.remarks || '',
  items: mapApiItemsToBillItems(o),
});

/* ─────────────────────── Component ─────────────────────── */

export default function SupplierBills() {
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

  const [bills, setBills] = useState<SupplierBill[]>([]);

  // Pagination (mirrors the API's page / limit / total shape)
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── load from GET /purchase-invoice ─── */

  const fetchBills = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/purchase-invoice?page=${pageNum}&limit=${limit}`);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to fetch supplier bills');
      }

      const payload = response.data.data;
      const records: BillApiRecord[] = Array.isArray(payload?.records) ? payload.records : [];

      setBills(records.map(mapApiRecordToBill));
      setTotalRecords(payload?.total ?? records.length);
      setPage(payload?.page ?? pageNum);
    } catch (err: any) {
      console.error('Error fetching supplier bills:', err);
      setError(err.response?.data?.message || 'An error occurred while loading supplier bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(1);
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

  const isOverdue = (bill: SupplierBill) => {
    if (bill.outstandingAmount <= 0) return false;
    if (!bill.dueDate) return false;
    return new Date(bill.dueDate).getTime() < Date.now();
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = (b.billNumber || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (b.supplierName || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (b.supplier || '').toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Payables stats
  const totalPayable = bills.reduce((sum, b) => sum + (b.outstandingAmount || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const overdueCount = bills.filter(isOverdue).length;
  const totalBilled = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    fetchBills(p);
  };

  const handleView = (bill: SupplierBill) => {
    navigate(`/supplier-bills/${bill.id}`, { state: { bill } });
  };

  const handleEdit = (bill: SupplierBill) => {
    navigate(`/supplier-bills/${bill.id}`, { state: { bill } });
  };

  const handleDeleteClick = (bill: SupplierBill) => {
    setSelectedBill(bill);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedBill) return;
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/purchase-invoice/${selectedBill.id}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to delete supplier bill');
      }
      setShowDeleteModal(false);
      setSelectedBill(null);
      toast.success('Supplier bill deleted successfully!');
      fetchBills(page);
    } catch (err: any) {
      console.error('Error deleting supplier bill:', err);
      toast.error(err.response?.data?.message || 'Failed to delete supplier bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilterText('');
    setSelectedStatus('All');
  };

  /* ─────────────────────── Print (Tax-Invoice format) ─────────────────────── */

  const buildBillPrintHtml = (bill: SupplierBill): string => {
    const validItems = bill.items || [];

    const baseTotal = bill.netTotal || validItems.reduce((sum, it) => sum + (it.netAmount || it.amount || 0), 0);
    const taxAmount = bill.totalTaxesAndCharges || 0;
    const cgstAmount = taxAmount / 2;
    const sgstAmount = taxAmount / 2;
    const totalQty = bill.totalQty || validItems.reduce((sum, it) => sum + (it.qty || 0), 0);
    const grandTotal = bill.roundedTotal || bill.grandTotal || (baseTotal + taxAmount);

    const itemRows = validItems.map((item, idx) => `
      <tr>
        <td class="sb-col-sl">${idx + 1}</td>
        <td class="sb-col-desc">
          ${escapeHtml(item.itemName || item.itemCode || '')}
          ${item.itemCode ? `<div class="sb-item-sub">${escapeHtml(item.itemCode)}</div>` : ''}
        </td>
        <td class="sb-col-qty">${item.qty} ${escapeHtml(item.uom || 'Nos')}</td>
        <td class="sb-col-rate">${item.rate.toFixed(2)}</td>
        <td class="sb-col-disc">${item.discountPercentage ? item.discountPercentage + '%' : ''}</td>
        <td class="sb-col-amt">${(item.netAmount ?? item.amount).toFixed(2)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(bill.billNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 24px; }
  .sb-outer { border: 1.5px solid #000; }
  .sb-title-row { display: flex; align-items: center; justify-content: center; position: relative; padding: 8px; border-bottom: 1.5px solid #000; }
  .sb-title { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
  .sb-top { display: flex; border-bottom: 1px solid #000; }
  .sb-company-box { flex: 1.3; padding: 8px; border-right: 1px solid #000; }
  .sb-company-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
  .sb-company-box div { margin: 1px 0; }
  .sb-meta-box { flex: 1.1; }
  .sb-meta-row { display: flex; border-bottom: 1px solid #000; }
  .sb-meta-row:last-child { border-bottom: none; }
  .sb-meta-cell { flex: 1; padding: 4px 8px; border-right: 1px solid #000; }
  .sb-meta-cell:last-child { border-right: none; }
  .sb-meta-label { font-size: 10px; color: #444; }
  .sb-meta-value { font-weight: 600; margin-top: 1px; min-height: 13px; }
  .sb-parties { display: flex; border-bottom: 1px solid #000; }
  .sb-party-box { flex: 1; padding: 8px; }
  .sb-party-label { font-weight: bold; margin-bottom: 3px; }
  .sb-party-box div { margin: 1px 0; }
  table.sb-items { width: 100%; border-collapse: collapse; }
  table.sb-items th, table.sb-items td { border-right: 1px solid #000; padding: 5px 6px; }
  table.sb-items th:last-child, table.sb-items td:last-child { border-right: none; }
  table.sb-items thead th { border-bottom: 1px solid #000; font-size: 11px; text-align: left; }
  .sb-col-sl { width: 26px; text-align: center; }
  .sb-col-desc { min-width: 200px; }
  .sb-item-sub { font-size: 10px; color: #555; }
  .sb-col-qty { width: 84px; text-align: right; }
  .sb-col-rate { width: 70px; text-align: right; }
  .sb-col-disc { width: 60px; text-align: right; }
  .sb-col-amt { width: 100px; text-align: right; }
  .sb-total-row td { border-top: 1px solid #000; font-weight: bold; padding: 6px; }
  .sb-words { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; justify-content: space-between; align-items: flex-start; }
  .sb-words-label { font-size: 10px; color: #444; }
  .sb-eoe { font-size: 11px; font-style: italic; white-space: nowrap; }
  table.sb-summary { width: 100%; border-collapse: collapse; margin-top: 0; }
  table.sb-summary th, table.sb-summary td { border: 1px solid #000; padding: 4px 8px; font-size: 11px; text-align: right; }
  table.sb-summary th:first-child, table.sb-summary td:first-child { text-align: left; }
  .sb-bottom { display: flex; border-top: 1px solid #000; }
  .sb-pan-decl-box { flex: 1; padding: 8px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
  .sb-bank-sign-box { flex: 1; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
  .sb-signatory { text-align: right; margin-top: 24px; font-size: 11px; }
  .sb-footer { text-align: center; padding: 8px; font-size: 10px; color: #444; border-top: 1px solid #000; }
  .sb-footer div:first-child { font-weight: 600; letter-spacing: 0.5px; margin-bottom: 2px; }
  @media print {
    body { padding: 0; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="sb-outer">

    <div class="sb-title-row">
      <div class="sb-title">SUPPLIER BILL</div>
    </div>

    <div class="sb-top">
      <div class="sb-company-box">
        <div class="sb-company-name">${escapeHtml(bill.company || companyDetails.name)}</div>
        <div>${escapeHtml(companyDetails.address)}</div>
        <div>Phone: ${escapeHtml(companyDetails.contact)}</div>
        ${companyDetails.email ? `<div>Email: ${escapeHtml(companyDetails.email)}</div>` : ''}
        ${companyPrintDetails.gstin ? `<div>GSTIN/UIN: ${escapeHtml(companyPrintDetails.gstin)}</div>` : ''}
        <div>State Name : ${escapeHtml(companyPrintDetails.stateName)}, Code : ${escapeHtml(companyPrintDetails.stateCode)}</div>
      </div>
      <div class="sb-meta-box">
        <div class="sb-meta-row">
          <div class="sb-meta-cell">
            <div class="sb-meta-label">Bill No.</div>
            <div class="sb-meta-value">${escapeHtml(bill.billNumber)}</div>
          </div>
          <div class="sb-meta-cell" style="border-right:none;">
            <div class="sb-meta-label">Posting Date</div>
            <div class="sb-meta-value">${escapeHtml(formatPrintDate(bill.postingDate))}</div>
          </div>
        </div>
        <div class="sb-meta-row">
          <div class="sb-meta-cell">
            <div class="sb-meta-label">Due Date</div>
            <div class="sb-meta-value">${escapeHtml(formatPrintDate(bill.dueDate))}</div>
          </div>
          <div class="sb-meta-cell" style="border-right:none;">
            <div class="sb-meta-label">Status</div>
            <div class="sb-meta-value">${escapeHtml(bill.status)}</div>
          </div>
        </div>
        <div class="sb-meta-row">
          <div class="sb-meta-cell">
            <div class="sb-meta-label">Supplier's Bill No.</div>
            <div class="sb-meta-value">${escapeHtml(bill.supplierBillNo || '')}</div>
          </div>
          <div class="sb-meta-cell" style="border-right:none;">
            <div class="sb-meta-label">Supplier's Bill Date</div>
            <div class="sb-meta-value">${escapeHtml(formatPrintDate(bill.supplierBillDate || ''))}</div>
          </div>
        </div>
        <div class="sb-meta-row">
          <div class="sb-meta-cell">
            <div class="sb-meta-label">Outstanding Amount</div>
            <div class="sb-meta-value">${bill.currency} ${bill.outstandingAmount.toFixed(2)}</div>
          </div>
          <div class="sb-meta-cell" style="border-right:none;">
            <div class="sb-meta-label">Paid Amount</div>
            <div class="sb-meta-value">${bill.currency} ${bill.paidAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="sb-parties">
      <div class="sb-party-box">
        <div class="sb-party-label">Supplier</div>
        <div><strong>${escapeHtml(bill.supplierName)}</strong></div>
        ${bill.supplier ? `<div>Supplier Code : ${escapeHtml(bill.supplier)}</div>` : ''}
      </div>
    </div>

    <table class="sb-items">
      <thead>
        <tr>
          <th class="sb-col-sl">Sl</th>
          <th class="sb-col-desc">Description of Goods</th>
          <th class="sb-col-qty">Quantity</th>
          <th class="sb-col-rate">Rate</th>
          <th class="sb-col-disc">Discount</th>
          <th class="sb-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="sb-total-row">
          <td colspan="2">Total</td>
          <td class="sb-col-qty">${totalQty} Nos.</td>
          <td colspan="2"></td>
          <td class="sb-col-amt">${grandTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="sb-words">
      <div>
        <div class="sb-words-label">Amount Chargeable (in words)</div>
        <div><strong>${bill.currency || 'INR'} ${numberToIndianWords(grandTotal)} Only</strong></div>
      </div>
      <div class="sb-eoe">E.&amp;O.E</div>
    </div>

    ${taxAmount > 0 ? `
    <table class="sb-summary">
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Taxable Value</td><td>${baseTotal.toFixed(2)}</td></tr>
        <tr><td>Input CGST</td><td>${cgstAmount.toFixed(2)}</td></tr>
        <tr><td>Input SGST</td><td>${sgstAmount.toFixed(2)}</td></tr>
        <tr style="font-weight:600;"><td>Total Tax</td><td>${taxAmount.toFixed(2)}</td></tr>
      </tbody>
    </table>` : ''}

    <div class="sb-bottom">
      <div class="sb-pan-decl-box">
        <div>
          <strong>Declaration</strong>
          <div>We declare that this bill shows the actual price of the goods/services described and that all particulars are true and correct.</div>
        </div>
        ${companyPrintDetails.panNo ? `<div style="margin-top:8px;">Company's PAN : ${escapeHtml(companyPrintDetails.panNo)}</div>` : ''}
      </div>
      <div class="sb-bank-sign-box">
        <div>
          <div><strong>Company's Bank Details</strong></div>
          ${companyPrintDetails.bankName ? `<div>Bank Name : ${escapeHtml(companyPrintDetails.bankName)}</div>` : ''}
          ${companyPrintDetails.bankAccountNo ? `<div>A/c No. : ${escapeHtml(companyPrintDetails.bankAccountNo)}</div>` : ''}
          ${companyPrintDetails.bankBranchIfsc ? `<div>Branch &amp; IFS Code : ${escapeHtml(companyPrintDetails.bankBranchIfsc)}</div>` : ''}
        </div>
        <div class="sb-signatory">
          for ${escapeHtml(bill.company || companyDetails.name)}<br /><br /><br />
          Authorised Signatory
        </div>
      </div>
    </div>

    <div class="sb-footer">
      ${companyPrintDetails.jurisdiction ? `<div>SUBJECT TO ${escapeHtml(companyPrintDetails.jurisdiction)} JURISDICTION</div>` : ''}
      <div>This is a computer generated supplier bill.</div>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
  };

  const handlePrintBill = async (bill: SupplierBill) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print this bill');
      return;
    }
    printWindow.document.write('<p style="font-family:sans-serif;padding:24px;color:#374151;">Loading bill…</p>');

    setPrintLoadingId(bill.id);
    try {
      printWindow.document.open();
      printWindow.document.write(buildBillPrintHtml(bill));
      printWindow.document.close();
    } catch (err) {
      console.error('Error printing supplier bill:', err);
    } finally {
      setPrintLoadingId(null);
    }
  };

  return (
    <div className={`supplier-bills-page ${theme}-theme`}>
      {/* Payables Stats */}
      <div className="sb-stats-container">
        <div className="sb-stat-card">
          <div className="sb-stat-icon" style={{ color: '#6366f1' }}>
            <FaFileAlt />
          </div>
          <div className="sb-stat-content">
            <div className="sb-stat-title">Total Billed</div>
            <p className="sb-stat-value">₹{totalBilled.toLocaleString()}</p>
          </div>
        </div>
        <div className="sb-stat-card">
          <div className="sb-stat-icon" style={{ color: '#f59e0b' }}>
            <FaWallet />
          </div>
          <div className="sb-stat-content">
            <div className="sb-stat-title">Total Payable</div>
            <p className="sb-stat-value">₹{totalPayable.toLocaleString()}</p>
          </div>
        </div>
        <div className="sb-stat-card">
          <div className="sb-stat-icon" style={{ color: '#10b981' }}>
            <FaMoneyBillWave />
          </div>
          <div className="sb-stat-content">
            <div className="sb-stat-title">Total Paid</div>
            <p className="sb-stat-value">₹{totalPaid.toLocaleString()}</p>
          </div>
        </div>
        <div className="sb-stat-card">
          <div className="sb-stat-icon" style={{ color: '#ef4444' }}>
            <FaExclamationTriangle />
          </div>
          <div className="sb-stat-content">
            <div className="sb-stat-title">Overdue Bills</div>
            <p className="sb-stat-value">{overdueCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sb-filter-bar">
        <div className="sb-filter-left">
          <div className="sb-search-wrapper">
            <FaSearch className="sb-search-icon" />
            <input
              type="text"
              placeholder="Search by Bill # or Supplier..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="sb-search-input"
            />
            {filterText && (
              <button className="sb-search-clear" onClick={() => setFilterText('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="sb-filter-right">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="sb-filter-select"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Return">Return</option>
          </select>
          <button className="sb-btn-new" onClick={() => navigate('/supplier-bills/new')}>
            <FaPlus size={12} /> Add Supplier Bill
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedStatus !== 'All') && (
        <div className="sb-active-filters">
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
          <button onClick={clearFilters} className="sb-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="sb-loading">
          <p>Loading supplier bills...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="sb-error">
          <p>{error}</p>
          <button onClick={() => fetchBills(page)} className="sb-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="sb-table-wrap">
          {filteredBills.length === 0 ? (
            <div className="sb-empty-state">
              <div className="sb-empty-content">
                <FaBoxOpen size={48} />
                <p>No supplier bills found</p>
                <span>Try adjusting your search criteria, or create your first supplier bill</span>
              </div>
            </div>
          ) : (
            <table className="sb-table">
              <thead>
                <tr>
                  <th className="sb-th">Bill #</th>
                  <th className="sb-th">Supplier</th>
                  <th className="sb-th">Posting Date</th>
                  <th className="sb-th">Due Date</th>
                  <th className="sb-th">Status</th>
                  <th className="sb-th sb-text-right">Grand Total</th>
                  <th className="sb-th sb-text-right">Outstanding</th>
                  <th className="sb-th sb-th-meta">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, index) => (
                  <tr key={bill.id || `bill-${index}`} className="sb-tr">
                    <td className="sb-td sb-td-id">{bill.billNumber}</td>
                    <td className="sb-td">
                      <div>
                        <div className="sb-td-link">{bill.supplierName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{bill.supplier}</div>
                      </div>
                    </td>
                    <td className="sb-td">
                      {bill.postingDate ? new Date(bill.postingDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="sb-td">
                      <div style={{ color: isOverdue(bill) ? 'var(--danger-color, #ef4444)' : undefined, fontWeight: isOverdue(bill) ? 600 : undefined }}>
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="sb-td">
                      <span className={`sb-status-badge ${getStatusColor(isOverdue(bill) ? 'Overdue' : bill.status)}`}>
                        {getStatusIcon(isOverdue(bill) ? 'Overdue' : bill.status)}
                        {isOverdue(bill) ? 'Overdue' : bill.status}
                      </span>
                    </td>
                    <td className="sb-td sb-text-right sb-amount-cell">
                      <span className="sb-currency">{bill.currency}</span>
                      {bill.grandTotal.toLocaleString()}
                    </td>
                    <td className="sb-td sb-text-right sb-amount-cell" style={{ color: bill.outstandingAmount > 0 ? 'var(--danger-color, #ef4444)' : 'var(--text-secondary)' }}>
                      <span className="sb-currency">{bill.currency}</span>
                      {bill.outstandingAmount.toLocaleString()}
                    </td>
                    <td className="sb-td sb-td-meta">
                      <div className="sb-action-buttons">
                        <button className="sb-action-btn sb-action-view" onClick={() => handleView(bill)} title="View / Edit">
                          <FaEye size={12} />
                        </button>
                        <button
                          className="sb-action-btn sb-action-print"
                          onClick={() => handlePrintBill(bill)}
                          title="Print"
                          disabled={printLoadingId === bill.id}
                        >
                          {printLoadingId === bill.id ? <FaSpinner className="spinning" size={12} /> : <FaPrint size={12} />}
                        </button>
                        <button className="sb-action-btn sb-action-edit" onClick={() => handleEdit(bill)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="sb-action-btn sb-action-delete" onClick={() => handleDeleteClick(bill)} title="Delete">
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
      <div className="sb-pagination">
        <div className="sb-pagination-left">
          <span className="sb-pagination-info">
            {filteredBills.length} of {totalRecords} bills
          </span>
        </div>
        <div className="sb-pagination-right">
          <span className="sb-pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaChartLine size={14} style={{ color: 'var(--primary-color)' }} />
            Page {page} of {totalPages}
          </span>
          <button className="sb-page-btn" onClick={() => goToPage(page - 1)} disabled={page <= 1}>Prev</button>
          <button className="sb-page-btn" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      </div>

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedBill && (
        <div className="sb-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="sb-modal sb-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="sb-modal-header">
              <span className="sb-modal-title">Confirm Delete</span>
              <button className="sb-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="sb-modal-body">
              <p>Are you sure you want to delete this supplier bill?</p>
              <p className="sb-modal-item-name">
                <strong>{selectedBill.billNumber}</strong> - {selectedBill.supplierName}
              </p>
              <p className="sb-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="sb-modal-footer">
              <button className="sb-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="sb-btn-delete" onClick={confirmDelete} disabled={isSubmitting}>
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