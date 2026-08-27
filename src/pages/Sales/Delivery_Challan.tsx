import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaPrint,
  FaEye,
  FaEdit,
  FaPrint as FaPrintIcon,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaExclamationTriangle,
  FaEllipsisV,
  FaFilePdf,
  FaFileExcel,
  FaBan,
  FaPaperPlane,
  FaTruck,
  FaSpinner,
  FaSync,
  FaTimes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ===== INTERFACES =====

interface DeliveryChallanItem {
  id: number;
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  stock_uom: string;
  uom: string;
  rate: number;
  amount: number;
  tax_id: number | null;
  net_rate: number;
  net_amount: number;
  warehouse: string;
  serial_no?: string;
  batch_no?: string;
}

interface DeliveryChallan {
  id: string | number;
  name: string;
  customer_id: number;
  customer_name: string;
  posting_date: string;
  status: string;
  grand_total: number;
  currency: string | null;
  modified: string;
  modified_by: string | null;
  creation: string;
  set_warehouse?: string;
  transporter?: string;
  vehicle_no?: string;
  driver_name?: string;
  instructions?: string;
  sales_order_id?: number | null;
  items?: DeliveryChallanItem[];
  customer_details?: {
    id: number;
    customer_name: string;
    customer_type: string;
    customer_group: string;
    territory: string;
    mobile_no: string;
    email_id: string;
    primary_address: string;
    tax_id: string | null;
    default_currency: string | null;
    payment_terms: string | null;
    disabled: number;
    gstin?: string;
    address?: string;
    shipping_address?: string;
    state?: string;
    state_code?: string;
  };
  payment_schedule?: any[];
  displayDcNumber?: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: DeliveryChallan[];
  };
}

// ===== COMPANY DETAILS =====
const companyDetails = {
  name: 'Sculptor Tech Pvt Ltd',
  address: 'c-1006, gc, Pune, Maharashtra 411028, India',
  website: 'sculptortechpvtltd@gmail.com',
  email: 'jayeshwakle@sculptortechpvtltd.com',
  contact: '8668584275',
  gstin: '',
  stateName: 'Maharashtra',
  stateCode: '27',
  panNo: '',
  bankName: '',
  bankAccountNo: '',
  bankBranchIfsc: '',
  jurisdiction: 'PUNE',
};

// ===== FORMAT DC NUMBER =====
const formatDcNumber = (id: string | number): string => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  const paddedId = String(numId).padStart(5, '0');
  return `DC-${paddedId}`;
};

// ===== AMOUNT IN WORDS HELPER =====
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

// ===== STATUS BADGE =====
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    'Draft': { color: '#6b7280', bg: '#f3f4f6', label: 'Draft' },
    'Submitted': { color: '#1e40af', bg: '#dbeafe', label: 'Submitted' },
    'Cancelled': { color: '#991b1b', bg: '#fee2e2', label: 'Cancelled' },
    'Pending': { color: '#92400e', bg: '#fef3c7', label: 'Pending' },
    'Partial Dispatch': { color: '#1e40af', bg: '#dbeafe', label: 'Partial Dispatch' },
    'Fully Dispatched': { color: '#065f46', bg: '#d1fae5', label: 'Fully Dispatched' }
  };
  const config = configs[status] || configs['Draft'];
  
  return (
    <span className="qt-status-badge" style={{ color: config.color, background: config.bg }}>
      <span className="qt-dot" style={{ background: config.color }} />
      {config.label}
    </span>
  );
};

// ===== MAIN COMPONENT =====
const DeliveryChallans: React.FC = () => {
  const navigate = useNavigate();
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printLoadingId, setPrintLoadingId] = useState<string | null>(null);

  // ===== CLOSE MENU ON CLICK OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu === null) return;
      
      const target = event.target as Node;
      const menuContainer = menuRefs.current[showMoreMenu];
      
      if (menuContainer && !menuContainer.contains(target)) {
        setShowMoreMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // ===== FETCH FULL DC DETAILS =====
  const fetchFullDeliveryChallan = async (id: string | number): Promise<DeliveryChallan | null> => {
    try {
      const response = await api.get(`/delivery-note/${id}`);
      if (response.data && response.data.success !== 0) {
        const data = response.data.success === 1 ? response.data.data : response.data;
        const record = Array.isArray(data) ? data[0] : (data?.record ?? data);
        if (record && (record.name || record.id)) {
          return {
            ...record,
            displayDcNumber: formatDcNumber(record.id || record.name)
          } as DeliveryChallan;
        }
      }
    } catch (err) {
      console.warn('Direct fetch failed:', err);
    }
    return null;
  };

  // ===== FETCH DATA =====
  const fetchChallans = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get<ApiResponse>(`/delivery-note${query}`);
      
      if (response.data?.data?.records) {
        const recordsWithDisplayNumber = response.data.data.records.map((record) => ({
          ...record,
          displayDcNumber: formatDcNumber(record.id)
        }));
        setChallans(recordsWithDisplayNumber);
      } else {
        setChallans([]);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load delivery challans');
      toast.error('Failed to load delivery challans');
    } finally {
      setLoading(false);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchChallans();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchChallans(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, currentPage, itemsPerPage]);

  // ===== HELPERS =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // ===== FILTER DATA =====
  const filteredData = challans.filter(item => {
    const search = searchTerm.toLowerCase();
    const displayNumber = item.displayDcNumber?.toLowerCase() || '';
    const matchesSearch = 
      displayNumber.includes(search) ||
      (item.name || '').toLowerCase().includes(search) ||
      (item.customer_name || '').toLowerCase().includes(search);
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // ===== PAGINATION =====
  const totalFilteredItems = filteredData.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  // ===== PAGINATION HELPERS =====
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
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
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  // ===== BUILD PRINT HTML =====
  const buildDeliveryChallanPrintHtml = (challan: DeliveryChallan): string => {
    const items = challan.items || [];
    const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const grandTotal = challan.grand_total || 0;

    const itemRows = items.map((item, idx) => `
      <tr>
        <td class="pq-col-sl">${idx + 1}</td>
        <td class="pq-col-desc">
          ${escapeHtml(item.item_name || item.item_code || '')}
          ${item.item_code ? `<div class="pq-item-sub">${escapeHtml(item.item_code)}</div>` : ''}
          ${item.description ? `<div class="pq-item-desc">${escapeHtml(item.description)}</div>` : ''}
        </td>
        <td class="pq-col-qty">${item.qty || 0} ${escapeHtml(item.stock_uom || item.uom || 'Nos')}</td>
        <td class="pq-col-rate">${(item.rate || 0).toFixed(2)}</td>
        <td class="pq-col-amt">${(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const customer = challan.customer_details;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(challan.displayDcNumber || challan.name || 'Delivery Challan')}</title>
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
  .pq-col-desc { min-width: 200px; }
  .pq-item-sub { font-size: 10px; color: #555; }
  .pq-item-desc { font-size: 10px; color: #666; margin-top: 2px; }
  .pq-col-qty { width: 80px; text-align: right; }
  .pq-col-rate { width: 70px; text-align: right; }
  .pq-col-amt { width: 90px; text-align: right; }
  .pq-total-row td { border-top: 1px solid #000; font-weight: bold; padding: 6px; }
  .pq-words { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; justify-content: space-between; align-items: flex-start; }
  .pq-words-label { font-size: 10px; color: #444; }
  .pq-eoe { font-size: 11px; font-style: italic; white-space: nowrap; }
  .pq-bottom { display: flex; border-top: 1px solid #000; }
  .pq-decl-box { flex: 1; padding: 8px; border-right: 1px solid #000; }
  .pq-sign-box { flex: 1; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
  .pq-signatory { text-align: right; margin-top: 24px; font-size: 11px; }
  .pq-footer { text-align: center; padding: 8px; font-size: 10px; color: #444; border-top: 1px solid #000; }
  .pq-footer div:first-child { font-weight: 600; letter-spacing: 0.5px; margin-bottom: 2px; }
  .pq-status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
  .pq-status-Submitted { background: #dbeafe; color: #1e40af; }
  .pq-status-Draft { background: #f3f4f6; color: #6b7280; }
  .pq-status-Cancelled { background: #fee2e2; color: #991b1b; }
  @media print {
    body { padding: 0; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="pq-outer">

    <div class="pq-title-row">
      <div class="pq-title">DELIVERY CHALLAN</div>
      <span style="position:absolute;right:12px;font-size:11px;color:#555;">
        <span class="pq-status-badge pq-status-${escapeHtml(challan.status || 'Draft')}">${escapeHtml(challan.status || 'Draft')}</span>
      </span>
    </div>

    <div class="pq-top">
      <div class="pq-company-box">
        <div class="pq-company-name">${escapeHtml(companyDetails.name)}</div>
        <div>${escapeHtml(companyDetails.address)}</div>
        <div>Phone: ${escapeHtml(companyDetails.contact)}</div>
        ${companyDetails.email ? `<div>Email: ${escapeHtml(companyDetails.email)}</div>` : ''}
        ${companyDetails.gstin ? `<div>GSTIN/UIN: ${escapeHtml(companyDetails.gstin)}</div>` : ''}
        <div>State Name : ${escapeHtml(companyDetails.stateName)}, Code : ${escapeHtml(companyDetails.stateCode)}</div>
      </div>
      <div class="pq-meta-box">
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">DC No.</div>
            <div class="pq-meta-value">${escapeHtml(challan.displayDcNumber || challan.name || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Date</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDate(challan.posting_date))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Warehouse</div>
            <div class="pq-meta-value">${escapeHtml(challan.set_warehouse || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Transporter</div>
            <div class="pq-meta-value">${escapeHtml(challan.transporter || challan.driver_name || '')}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Vehicle No.</div>
            <div class="pq-meta-value">${escapeHtml(challan.vehicle_no || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Sales Order</div>
            <div class="pq-meta-value">${challan.sales_order_id ? `#${escapeHtml(String(challan.sales_order_id))}` : 'N/A'}</div>
          </div>
        </div>
        ${challan.instructions ? `
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Instructions</div>
            <div class="pq-meta-value">${escapeHtml(challan.instructions)}</div>
          </div>
        </div>` : ''}
      </div>
    </div>

    <div class="pq-parties">
      <div class="pq-party-box">
        <div class="pq-party-label">Consignee (Ship to)</div>
        <div><strong>${escapeHtml(challan.customer_name || '')}</strong></div>
        ${customer?.primary_address ? `<div>${escapeHtml(customer.primary_address)}</div>` : ''}
        ${customer?.mobile_no ? `<div>Phone: ${escapeHtml(customer.mobile_no)}</div>` : ''}
        ${customer?.email_id ? `<div>Email: ${escapeHtml(customer.email_id)}</div>` : ''}
        ${customer?.gstin ? `<div>GSTIN/UIN : ${escapeHtml(customer.gstin)}</div>` : ''}
        ${customer?.state ? `<div>State: ${escapeHtml(customer.state)}${customer?.state_code ? ` (${escapeHtml(customer.state_code)})` : ''}</div>` : ''}
      </div>
      <div class="pq-party-box">
        <div class="pq-party-label">Buyer (Bill to)</div>
        <div><strong>${escapeHtml(challan.customer_name || '')}</strong></div>
        ${customer?.primary_address ? `<div>${escapeHtml(customer.primary_address)}</div>` : ''}
        ${customer?.mobile_no ? `<div>Phone: ${escapeHtml(customer.mobile_no)}</div>` : ''}
        ${customer?.email_id ? `<div>Email: ${escapeHtml(customer.email_id)}</div>` : ''}
        ${customer?.gstin ? `<div>GSTIN/UIN : ${escapeHtml(customer.gstin)}</div>` : ''}
        ${customer?.state ? `<div>State: ${escapeHtml(customer.state)}${customer?.state_code ? ` (${escapeHtml(customer.state_code)})` : ''}</div>` : ''}
      </div>
    </div>

    <table class="pq-items">
      <thead>
        <tr>
          <th class="pq-col-sl">#</th>
          <th class="pq-col-desc">Description of Goods</th>
          <th class="pq-col-qty">Quantity</th>
          <th class="pq-col-rate">Rate</th>
          <th class="pq-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="pq-total-row">
          <td colspan="2">Total</td>
          <td class="pq-col-qty">${totalQty} ${items.length > 0 ? escapeHtml(items[0]?.stock_uom || items[0]?.uom || 'Nos') : 'Nos'}</td>
          <td class="pq-col-rate"></td>
          <td class="pq-col-amt">${grandTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="pq-words">
      <div>
        <div class="pq-words-label">Amount Chargeable (in words)</div>
        <div><strong>INR ${numberToIndianWords(grandTotal)} Only</strong></div>
      </div>
      <div class="pq-eoe">E.&amp;O.E</div>
    </div>

    <div class="pq-bottom">
      <div class="pq-decl-box">
        <strong>Declaration</strong>
        <div style="margin-top:4px;">We declare that the goods described above are as per the delivery challan and all particulars are true and correct.</div>
        ${companyDetails.panNo ? `<div style="margin-top:8px;">Company's PAN : ${escapeHtml(companyDetails.panNo)}</div>` : ''}
      </div>
      <div class="pq-sign-box">
        <div>
          <div><strong>Delivery Details</strong></div>
          ${challan.transporter ? `<div>Transporter: ${escapeHtml(challan.transporter)}</div>` : ''}
          ${challan.vehicle_no ? `<div>Vehicle No: ${escapeHtml(challan.vehicle_no)}</div>` : ''}
          ${challan.driver_name ? `<div>Driver: ${escapeHtml(challan.driver_name)}</div>` : ''}
        </div>
        <div class="pq-signatory">
          for ${escapeHtml(companyDetails.name)}<br /><br /><br />
          Authorised Signatory
        </div>
      </div>
    </div>

    <div class="pq-footer">
      ${companyDetails.jurisdiction ? `<div>SUBJECT TO ${escapeHtml(companyDetails.jurisdiction)} JURISDICTION</div>` : ''}
      <div>This is a computer generated delivery challan. ${challan.status === 'Submitted' ? '✓ Submitted' : ''}</div>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
  };

  // ===== ACTIONS =====
  const handleCreate = () => navigate('/delivery-challan/new');
  const handleRefresh = () => fetchChallans();
  const handleView = (id: string | number) => navigate(`/delivery-challan/view/${id}`);
  const handleEdit = (id: string | number) => {
    setShowMoreMenu(null);
    navigate(`/delivery-challan/edit/${id}`);
  };

  const handlePrint = (challan: DeliveryChallan) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print this delivery challan');
      return;
    }
    printWindow.document.write('<p style="font-family:sans-serif;padding:24px;color:#374151;">Loading delivery challan…</p>');

    setPrintLoadingId(String(challan.id));
    
    // Fetch full details if items are not already loaded
    const loadAndPrint = async () => {
      try {
        let printData = challan;
        if (!challan.items || challan.items.length === 0) {
          const fullData = await fetchFullDeliveryChallan(challan.id);
          if (fullData) {
            printData = fullData;
          }
        }
        printWindow.document.open();
        printWindow.document.write(buildDeliveryChallanPrintHtml(printData));
        printWindow.document.close();
      } catch (err) {
        console.error('Error printing delivery challan:', err);
        printWindow.document.open();
        printWindow.document.write(buildDeliveryChallanPrintHtml(challan));
        printWindow.document.close();
      } finally {
        setPrintLoadingId(null);
      }
    };
    
    loadAndPrint();
  };

  const handleCancel = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to cancel this Delivery Challan?')) return;
    try {
      await api.post(`/delivery-note/${id}/cancel`, {});
      toast.success('Delivery Challan cancelled successfully');
      fetchChallans();
    } catch (err) {
      toast.error('Failed to cancel');
    }
    setShowMoreMenu(null);
  };

  const handleSubmit = async (id: string | number) => {
    if (!window.confirm('Submit this Delivery Challan?')) return;
    try {
      await api.post(`/delivery-note/${id}/submit`, {});
      toast.success('Submitted successfully');
      fetchChallans();
    } catch (err) {
      toast.error('Failed to submit');
    }
    setShowMoreMenu(null);
  };

  const handleDownloadPDF = (_id: string | number) => {
    toast.success('Downloading PDF...');
    setShowMoreMenu(null);
  };

  const toggleMenu = (id: string | number) => {
    setShowMoreMenu(showMoreMenu === String(id) ? null : String(id));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
    setCurrentPage(1);
  };

  // ===== RENDER =====
  return (
    <div className="quotation-page">
      <style>{`
        .quotation-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--layout-bg, #f5f7fb);
          border-radius: 8px;
          padding: 20px;
          gap: 16px;
          overflow: hidden;
        }

        .quotation-page::-webkit-scrollbar {
          width: 6px;
        }
        .quotation-page::-webkit-scrollbar-track {
          background: var(--layout-bg, #f9fafb);
          border-radius: 3px;
        }
        .quotation-page::-webkit-scrollbar-thumb {
          background: var(--border-color, #e5e7eb);
          border-radius: 3px;
        }
        .quotation-page::-webkit-scrollbar-thumb:hover {
          background: var(--primary-color, #6366f1);
        }

        /* ── Filter Bar ── */
        .qt-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .qt-filter-left {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 200px;
        }

        .qt-search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .qt-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary, #9ca3af);
          font-size: 14px;
        }

        .qt-search-input {
          width: 100%;
          padding: 8px 36px 8px 36px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          background: var(--input-bg, white);
          color: var(--text-primary, #374151);
          outline: none;
          transition: border-color 0.2s;
          height: 38px;
        }

        .qt-search-input:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .qt-search-input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .qt-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary, #9ca3af);
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .qt-filter-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .qt-filter-select {
          padding: 7px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          background: var(--card-bg, white);
          color: var(--text-primary, #374151);
          cursor: pointer;
          outline: none;
          height: 38px;
        }

        .qt-filter-select:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .qt-btn-new {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: var(--primary-color, #6366f1);
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .qt-btn-new:hover {
          background: var(--primary-hover, #4f46e5);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .qt-btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: var(--card-bg, white);
          font-size: 13px;
          color: var(--text-primary, #374151);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .qt-btn-secondary:hover {
          background: var(--nav-hover, #f9fafb);
        }

        /* ── Active Filters ── */
        .qt-active-filters {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
          border-radius: 8px;
          font-size: 12px;
          flex-wrap: wrap;
          border: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .qt-active-filters span {
          color: var(--text-primary, #111827);
        }

        .qt-clear-filters {
          margin-left: auto;
          padding: 4px 12px;
          background: var(--card-bg, white);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary, #6b7280);
          transition: all 0.15s;
        }

        .qt-clear-filters:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        /* ── Table ── */
        .qt-table-wrap {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,0.05));
          border: 1px solid var(--border-color, #e5e7eb);
          overflow-x: auto;
          overflow-y: auto;
          flex: 0 0 auto;
          max-height: calc(100vh - 310px);
        }

        .qt-table-wrap::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .qt-table-wrap::-webkit-scrollbar-track {
          background: var(--layout-bg, #f9fafb);
          border-radius: 3px;
        }
        .qt-table-wrap::-webkit-scrollbar-thumb {
          background: var(--border-color, #e5e7eb);
          border-radius: 3px;
        }
        .qt-table-wrap::-webkit-scrollbar-thumb:hover {
          background: var(--primary-color, #6366f1);
        }

        .qt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 700px;
        }

        .qt-th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          background: var(--layout-bg, #f9fafb);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .qt-tr {
          cursor: default;
          transition: background 0.15s;
        }

        .qt-tr:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .qt-tr+.qt-tr td {
          border-top: 1px solid var(--border-color, #f3f4f6);
        }

        .qt-td {
          padding: 12px 16px;
          color: var(--text-primary, #374151);
          vertical-align: middle;
          text-align: left;
        }

        .qt-td-dcno {
          font-weight: 600;
          color: var(--text-primary, #111827);
          font-family: monospace;
        }

        .qt-td-customer {
          font-weight: 500;
          color: var(--primary-color, #6366f1);
          cursor: pointer;
        }

        .qt-td-customer:hover {
          text-decoration: underline;
        }

        .qt-td-amount {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary, #1f2433);
        }

        /* ── Status Badge ── */
        .qt-status-badge {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          gap: 4px;
        }

        .qt-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        /* ── Action Buttons ── */
        .qt-action-buttons {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .qt-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .qt-action-btn:hover {
          background: var(--nav-hover, #f3f4f6);
        }
          .pq-action-print {
  color: #0d9488;
}

.pq-action-print:hover {
  background: rgba(13, 148, 136, 0.1);
}

        .qt-action-more {
          color: var(--text-secondary, #6b7280);
        }

        .qt-action-more:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        /* ── More Menu ── */
        .qt-more-menu-container {
          position: relative;
          display: inline-block;
        }

        .qt-more-menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          box-shadow: 0 10px 40px var(--shadow-color, rgba(0,0,0,0.15));
          min-width: 180px;
          z-index: 100;
          padding: 4px 0;
          margin-top: 4px;
        }

        .qt-more-menu-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .qt-more-menu-dropdown button:hover {
          background: var(--nav-hover, #f8fafc);
          color: var(--primary-color, #2563eb);
        }

        .qt-more-menu-dropdown button.danger {
          color: var(--danger-color, #ef4444);
        }

        .qt-more-menu-dropdown button.danger:hover {
          background: #fef2f2;
        }

        .qt-more-menu-dropdown .menu-divider {
          height: 1px;
          background: var(--border-color, #e5e7eb);
          margin: 4px 0;
        }

        .pq-action-view {
  color: var(--primary-color, #6366f1);
}



        /* ── Empty State ── */
        .qt-empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .qt-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .qt-empty-content svg {
          color: var(--text-secondary, #9ca3af);
        }

        .qt-empty-content p {
          font-size: 18px;
          font-weight: 500;
          color: var(--text-primary, #111827);
          margin: 0;
        }

        .qt-empty-content span {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
        }

        /* ── Loading ── */
        .qt-loading {
          padding: 40px;
          text-align: center;
          color: var(--text-secondary, #6b7280);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .qt-error {
          padding: 40px;
          text-align: center;
          color: var(--danger-color, #ef4444);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .qt-retry-btn {
          margin-top: 12px;
          padding: 8px 20px;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        /* ── Pagination ── */
        .qt-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 0 0;
          flex-wrap: wrap;
          gap: 12px;
          background: transparent;
          flex-shrink: 0;
          border-top: 1px solid var(--border-color, #e5e7eb);
          margin-top: 4px;
        }

        .qt-pagination-left,
        .qt-pagination-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qt-pagination-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .qt-pagination-label {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .qt-page-size-select {
          padding: 6px 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 13px;
          background: var(--card-bg, white);
          color: var(--text-primary, #374151);
          cursor: pointer;
          height: 34px;
        }

        .qt-page-size-select:focus {
          border-color: var(--primary-color, #6366f1);
          outline: none;
        }

        .qt-page-btn {
          height: 34px;
          min-width: 34px;
          padding: 0 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: var(--card-bg, white);
          font-size: 13px;
          color: var(--text-primary, #374151);
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .qt-page-btn:hover:not(:disabled) {
          background: var(--nav-hover, #f3f4f6);
          border-color: var(--primary-color, #6366f1);
        }

        .qt-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qt-page-btn-active {
          background: var(--primary-color, #6366f1);
          color: white;
          border-color: var(--primary-color, #6366f1);
        }

        .qt-page-btn-active:hover {
          background: var(--primary-hover, #4f46e5);
        }

        .qt-pagination-info {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        /* ── Spinner ── */
        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Dark Theme ── */
        .dark-theme .quotation-page {
          background: var(--layout-bg, #0f172a);
        }

        .dark-theme .qt-search-input {
          background: var(--input-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-search-input::placeholder {
          color: var(--text-secondary, #64748b);
        }

        .dark-theme .qt-filter-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-btn-secondary {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-btn-secondary:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .qt-btn-new {
          background: var(--primary-color, #3b82f6);
        }

        .dark-theme .qt-btn-new:hover {
          background: var(--primary-hover, #2563eb);
        }

        .dark-theme .qt-table-wrap {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .qt-th {
          background: var(--layout-bg, #0f172a);
          color: var(--text-secondary, #94a3b8);
          border-bottom-color: var(--border-color, #334155);
        }

        .dark-theme .qt-td {
          color: var(--text-primary, #f8fafc);
          border-top-color: var(--border-color, #334155);
        }

        .dark-theme .qt-tr:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .qt-td-amount {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-empty-content p {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-empty-content span {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .qt-active-filters {
          background: rgba(99, 102, 241, 0.08);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .qt-active-filters span {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-clear-filters {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .qt-page-btn {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-page-btn:hover:not(:disabled) {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .qt-page-size-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-more-menu-dropdown {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .qt-more-menu-dropdown button {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .qt-more-menu-dropdown button:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .quotation-page {
            padding: 12px;
            gap: 12px;
          }

          .qt-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .qt-filter-left {
            width: 100%;
          }

          .qt-search-wrapper {
            max-width: 100%;
          }

          .qt-filter-right {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .qt-table {
            min-width: 600px;
          }

          .qt-pagination {
            flex-direction: column;
            align-items: center;
          }

          .qt-pagination-center {
            order: 2;
          }

          .qt-pagination-left,
          .qt-pagination-right {
            order: 1;
          }

          .qt-td {
            padding: 10px 12px;
            font-size: 12px;
          }

          .qt-th {
            padding: 10px 12px;
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .qt-filter-right {
            flex-direction: column;
            width: 100%;
          }

          .qt-filter-right > * {
            width: 100%;
          }

          .qt-btn-new {
            justify-content: center;
          }

          .qt-pagination {
            padding: 8px 0 0 0;
          }

          .qt-pagination-center {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>

      {/* ===== FILTER BAR ===== */}
      <div className="qt-filter-bar">
        <div className="qt-filter-left">
          <div className="qt-search-wrapper">
            <FaSearch className="qt-search-icon" />
            <input
              type="text"
              placeholder="Search by DC No or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="qt-search-input"
            />
            {searchTerm && (
              <button className="qt-search-clear" onClick={() => setSearchTerm("")}>
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
            <option value="Submitted">Submitted</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button className="qt-btn-secondary" onClick={handleRefresh}>
            <FaSync size={12} /> Refresh
          </button>
          <button className="qt-btn-secondary" onClick={() => window.print()}>
            <FaPrint size={12} /> Print
          </button>
          <button className="qt-btn-new" onClick={handleCreate}>
            <FaPlus size={12} /> New DC
          </button>
        </div>
      </div>

      {/* ===== ACTIVE FILTERS ===== */}
      {(searchTerm || selectedStatus !== "All") && (
        <div className="qt-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span>Active filters:</span>
          {searchTerm && (
            <span>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {selectedStatus !== "All" && (
            <span>
              <strong>Status:</strong> {selectedStatus}
            </span>
          )}
          <button onClick={clearFilters} className="qt-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="qt-table-wrap">
        {loading && challans.length === 0 ? (
          <div className="qt-loading">
            <FaSpinner className="spinning" size={30} style={{ display: 'block', margin: '0 auto 12px' }} />
            <p>Loading delivery challans...</p>
          </div>
        ) : error ? (
          <div className="qt-error">
            <FaExclamationTriangle size={30} style={{ display: 'block', margin: '0 auto 12px' }} />
            <p>{error}</p>
            <button onClick={handleRefresh} className="qt-retry-btn">
              <FaSync size={12} style={{ marginRight: '6px' }} /> Retry
            </button>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="qt-empty-state">
            <div className="qt-empty-content">
              <FaTruck size={48} />
              <p>No delivery challans found</p>
              <span>Try adjusting your search criteria or create a new one</span>
              <button className="qt-btn-new" onClick={handleCreate} style={{ marginTop: '12px' }}>
                <FaPlus size={12} /> New DC
              </button>
            </div>
          </div>
        ) : (
          <table className="qt-table">
            <thead>
              <tr>
                <th className="qt-th">DC No</th>
                <th className="qt-th">Customer</th>
                <th className="qt-th">Date</th>
                <th className="qt-th">Amount</th>
                <th className="qt-th">Status</th>
                <th className="qt-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id} className="qt-tr">
                  <td className="qt-td qt-td-dcno">
                    {item.displayDcNumber || item.name || '-'}
                  </td>
                  <td className="qt-td">
                    <span className="qt-td-customer" onClick={() => handleView(item.id)}>
                      {item.customer_name || '-'}
                    </span>
                  </td>
                  <td className="qt-td">{formatDate(item.posting_date)}</td>
                  <td className="qt-td qt-td-amount">
                    ₹{item.grand_total?.toLocaleString() || '0'}
                  </td>
                  <td className="qt-td">
                    <StatusBadge status={item.status || 'Draft'} />
                  </td>
                  <td className="qt-td">
                    <div className="qt-action-buttons">
                      <button 
                        className="qt-action-btn pq-action-print" 
                        onClick={() => handlePrint(item)} 
                        title="Print"
                        disabled={printLoadingId === String(item.id)}
                      >
                        {printLoadingId === String(item.id) ? <FaSpinner className="spinning" size={12} /> : <FaPrintIcon size={12} />}
                      </button>
                      <div 
                        className="qt-more-menu-container" 
                        ref={(el) => { menuRefs.current[String(item.id)] = el }}
                      >
                        <button 
                          className="qt-action-btn qt-action-more" 
                          onClick={() => toggleMenu(item.id)} 
                          title="More"
                        >
                          <FaEllipsisV size={14} />
                        </button>
                        {showMoreMenu === String(item.id) && (
                          <div className="qt-more-menu-dropdown ">
                            <button onClick={() => handleView(item.id)}>
                              <FaEye size={12} /> View
                            </button>
                            {item.status === 'Draft' && (
                              <>
                                <button onClick={() => handleEdit(item.id)}>
                                  <FaEdit size={12} /> Edit
                                </button>
                                <button onClick={() => handleSubmit(item.id)}>
                                  <FaPaperPlane size={12} /> Submit
                                </button>
                              </>
                            )}
                            <button onClick={() => handlePrint(item)} disabled={printLoadingId === String(item.id)}>
                              <FaPrintIcon size={12} /> Print
                            </button>
                            <button onClick={() => handleDownloadPDF(item.id)}>
                              <FaFilePdf size={12} /> Download PDF
                            </button>
                            <button onClick={() => handleDownloadPDF(item.id)}>
                              <FaFileExcel size={12} /> Download Excel
                            </button>
                            {item.status !== 'Cancelled' && item.status !== 'Submitted' && (
                              <button className="danger" onClick={() => handleCancel(item.id)}>
                                <FaBan size={12} /> Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {!loading && !error && (
        <div className="qt-pagination">
          <div className="qt-pagination-left">
            <span className="qt-pagination-label">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="qt-page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="qt-pagination-label">entries</span>
          </div>
          <div className="qt-pagination-center">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1 || totalFilteredItems === 0}
              className="qt-page-btn"
            >
              <FaAngleDoubleLeft size={12} />
            </button>
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1 || totalFilteredItems === 0}
              className="qt-page-btn"
            >
              <FaChevronLeft size={12} />
            </button>
            {totalFilteredItems > 0 && getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`qt-page-btn ${currentPage === page ? 'qt-page-btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages || totalFilteredItems === 0}
              className="qt-page-btn"
            >
              <FaChevronRight size={12} />
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages || totalFilteredItems === 0}
              className="qt-page-btn"
            >
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="qt-pagination-right">
            <span className="qt-pagination-info">
              {totalFilteredItems > 0 ? (
                `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
              ) : (
                'No entries to show'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChallans;